import { describe, expect, it } from "vitest";
import { poisonBowAmbushSupportFixture as support, poisonBowAmbushComponents as components, poisonBowAmbushSources as sources, poisonBowAmbushCriticalContexts as contexts } from "./poisonBowAmbushSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "criticalChance",weight: 3 },{ id: "criticalDamageBonus",weight: 2 },{ id: "poisonMagnitude",weight: 3 }] });

describe("Ambush for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's enemy Full Life boundary without assuming uptime or changing scores", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_int.lua#L${support.line}`);
    for (const text of ["100% more Critical Hit Chance only against enemies on Full Life", "5% becomes 10% before caps", "not player Full Life or guaranteed critical hits",
      "Opening hits may qualify while the target is still at Full Life", "later hits must satisfy that condition again", "Ongoing Poison is not a Hit",
      "does not make new critical-hit rolls for this bonus", "A damaging arrow does not establish Full Life for a later burst/cloud",
      "opener critical state is not assumed to carry into them", "checkbox holds that condition fixed throughout the calculation",
      "not real burst/cloud Hits or proof of live-game inheritance", "fixed Inexorable buildup does not simulate resets",
      "No enemy Full Life or critical uptime", "No added Mana multiplier; other supports still cost Mana", "Manual weights and route scores stay unchanged"])
      expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Critical Hit Chance", "20% increased Critical Damage Bonus", "20% increased Magnitude of Poison you inflict", "Minions have 20% increased Critical Hit Chance"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
    const [saved] = normalizeSavedBuilds([{ id: skill,name: skill,createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    const [restored] = parseSavedBuildExport(serializeSavedBuildExport([saved]));
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(setSkillSupport(selected,support.id,false)).toEqual({ ...current,supportGemIds: [] });
  });

  it.each(components)("checks $skill's $component without treating source fields as real burst/cloud hits", f => {
    const mean = (f.range[0]+f.range[1])/2*(f.component.includes("Fire") ? 1 : .25);
    expect(f.hits[0]).toBeCloseTo(mean*(1+.05*(2-1)),9);
    expect(f.hits[1]).toBeCloseTo(mean*(1+.1*(2-1)),9);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("opener critical state is not assumed to carry into them");
  });

  it.each(sources)("reconstructs %s's fixed enemy-state estimates without claiming an opening-hit timeline", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const modeled = (range: readonly number[], duration: number, chance: number, multiplier: number, poisonChance = 1) => {
      const potential = 1.2*duration*poisonChance, roll = potential/(potential+1), presence = 1-(1-chance)**potential;
      return (range[0]+(range[1]-range[0])*roll)*(1+presence*(multiplier-1))*.2;
    };
    for (const full of [0,1]) {
      const more = full ? 2 : 1;
      expect(f.poison[full]).toBeCloseTo(modeled(source.range,f.duration,.05*more,2),9);
      for (const [i,c] of contexts.entries()) expect(f.criticalPairs[i][full]).toBeCloseTo(modeled(source.range,f.duration,Math.min(1,c.chance*more),c.multiplier),9);
      const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
      expect(f.arrowPoison[full]).toBeCloseTo(modeled(arrow.range,2,.05*more,2,.6),9);
      expect(f.cappedPoison).toBeCloseTo(modeled(source.range,f.duration,Math.min(1,more),2),9);
    }
    expect(f.neverPoison).toBeCloseTo(modeled(source.range,f.duration,0,0),9);
    expect(f.linkedMana).toBe(Math.floor(f.mana*1.2));
    expect(contexts.filter(c => c.seconds !== 0).map(c => c.seconds)).toEqual([5,5]);
  });

  it.each(poisonBowIds)("preserves %s's existing critical supports, alternate Inexorable tiers and earlier warnings", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    for (const inex of ["inexorable-critical-i","inexorable-critical-ii"]) {
      const peers = ["supercritical","pinpoint-critical",inex,"momentum","blindside","blind-ii","malady","poison-iii","fork","pierce-iii","chain-iii","ricochet-ii","nova-projectiles-ii",
        ...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
      const initial = { ...settings(skill),supportGemIds: peers }, selected = setSkillSupport(initial,support.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,support.id] });
      const original = selectedSkillSupports(preset,peers), resolved = selectedSkillSupports(preset,selected.supportGemIds);
      for (const peer of original) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,peers));
      expect(setSkillSupport(selected,support.id,false)).toEqual(initial);
    }
    expect(normalizeSkillSupportIds(skill,[support.id,support.id,null,"ambush-ii"])).toEqual([support.id]);
  });

  it("keeps the two reviewed pairs narrow without inventing Ambush tiers", () => {
    expect(support.catalogTier).toBe(1);
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.some(s => /^ambush-/.test(s.id))).toBe(false);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
      expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
  });
});

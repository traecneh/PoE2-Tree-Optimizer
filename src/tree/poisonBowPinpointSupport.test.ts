import { describe, expect, it } from "vitest";
import { poisonBowPinpointSupportFixture as support, poisonBowPinpointComponents as components, poisonBowPinpointSources as sources } from "./poisonBowPinpointSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7,
  preferences: [{ id: "criticalChance", weight: 3 }, { id: "criticalDamageBonus", weight: 2 }, { id: "poisonMagnitude", weight: 3 }] });

describe("Pinpoint Critical for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's chance/extra-bonus trade-off without changing manual scores or saved goals", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_int.lua#L${support.line}`);
    for (const text of ["60% more Critical Hit Chance (5% becomes 8%)", "30% less Critical Damage Bonus", "extra critical damage component, not total damage",
      "2x critical multiplier becomes 1.7x", "Chance is still capped", "cannot restore prohibited critical hits", "1.6 x 0.8", "0.7 x 0.5 = 0.35",
      "not an additive 80% penalty", "do not simulate how changed crit chance affects Inexorable resets", "Maximum buildup and critical uptime are not assumed",
      "A better average hit need not improve native Poison estimates", "not real burst/cloud Hits or proof of live-game critical inheritance",
      "No added Mana multiplier; other supports still cost Mana", "Manual weights and route scores stay unchanged"])
      expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Critical Hit Chance", "20% increased Critical Damage Bonus", "20% increased Magnitude of Poison you inflict", "Minions have 20% increased Critical Damage Bonus"]) {
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

  it.each(components)("checks $skill's $component with independently weighted critical hits", f => {
    const mean = (f.range[0]+f.range[1])/2*(f.component.includes("Fire") ? 1 : .25);
    expect(f.hits[0]).toBeCloseTo(mean*(1+.05*(2-1)),9);
    expect(f.hits[1]).toBeCloseTo(mean*(1+.08*(1.7-1)),9);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("not real burst/cloud Hits");
  });

  it.each(sources)("reconstructs %s's standalone, capped and paired source estimates without assuming reset-cycle uptime", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const modeled = (range: readonly number[], duration: number, chance: number, multiplier: number, poisonChance = 1) => {
      const potential = 1.2*duration*poisonChance, roll = potential/(potential+1), presence = 1-(1-chance)**potential;
      return (range[0]+(range[1]-range[0])*roll)*(1+presence*(multiplier-1))*.2;
    };
    for (const p of [0,1]) {
      const chanceMore = p ? 1.6 : 1, bonusMore = p ? .7 : 1;
      expect(f.poison[p]).toBeCloseTo(modeled(source.range,f.duration,.05*chanceMore,1+bonusMore),9);
      expect(f.superPoison[p]).toBeCloseTo(modeled(source.range,f.duration,.05*.8*chanceMore,1+2*bonusMore),9);
      expect(f.cappedPoison[p]).toBeCloseTo(modeled(source.range,f.duration,1,1+bonusMore),9);
      for (const [index,time] of [0,2,5,10].entries()) {
        const incI = Math.min(time*10,100), incII = Math.min(time*40,200), penalty = 1-Math.min(time*10,50)/100;
        expect(f.inexI[p][index]).toBeCloseTo(modeled(source.range,f.duration,.05*(1+incI/100)*chanceMore,1+bonusMore),9);
        expect(f.inexII[p][index]).toBeCloseTo(modeled(source.range,f.duration,.05*(1+incII/100)*chanceMore,1+penalty*bonusMore),9);
      }
      expect(f.superInex[0][p]).toBeCloseTo(modeled(source.range,f.duration,.05*1.5*.8*chanceMore,1+2*bonusMore),9);
      expect(f.superInex[1][p]).toBeCloseTo(modeled(source.range,f.duration,.05*3*.8*chanceMore,1+2*.5*bonusMore),9);
      const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
      expect(f.arrowPoison[p]).toBeCloseTo(modeled(arrow.range,2,.05*chanceMore,1+bonusMore,.6),9);
    }
    expect(f.neverPoison).toBeCloseTo(modeled(source.range,f.duration,0,0),9);
    expect(f.cappedPoison[1]).toBeLessThan(f.cappedPoison[0]);
    if (f.skill === "poisonburst-arrow") expect(f.inexII[1][2]).toBeLessThan(f.inexII[0][2]);
    expect(f.inexMana).toBe(Math.floor(f.mana*1.2));
  });

  it.each(poisonBowIds)("preserves %s's Supercritical, both alternative Inexorable tiers and prior warnings", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    for (const inex of ["inexorable-critical-i","inexorable-critical-ii"]) {
      const peers = ["supercritical",inex,"momentum","blindside","blind-ii","malady","poison-iii","fork","pierce-iii","chain-iii","ricochet-ii","nova-projectiles-ii",
        ...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
      const initial = { ...settings(skill),supportGemIds: peers }, selected = setSkillSupport(initial,support.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,support.id] });
      const original = selectedSkillSupports(preset,peers), resolved = selectedSkillSupports(preset,selected.supportGemIds);
      for (const peer of original) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,peers));
      expect(setSkillSupport(selected,support.id,false)).toEqual(initial);
    }
    expect(normalizeSkillSupportIds(skill,[support.id,support.id,null,"pinpoint-critical-ii"])).toEqual([support.id]);
  });

  it("keeps the reviewed allowlist narrow without inventing Pinpoint tiers", () => {
    expect(support.catalogTier).toBe(2);
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.some(s => /^pinpoint-critical-/.test(s.id))).toBe(false);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
      expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
  });
});

import { describe, expect, it } from "vitest";
import { poisonBowSupercriticalSupportFixture as support, poisonBowSupercriticalComponents as components, poisonBowSupercriticalSources as sources } from "./poisonBowSupercriticalSupport.fixtures";
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

describe("Supercritical for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's critical trade-off without changing manual priorities, scores or saved goals", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name, effectId: s.effectId, family: s.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(s.sourceUrl).toContain(`sup_int.lua#L${support.line}`);
    for (const text of ["100% increased Critical Damage Bonus, with 20% less Critical Hit Chance", "extra critical damage component, not total damage",
      "5% becomes 4%", "not minus 20 percentage points", "sustained-application assumptions",
      "Source-hit fields are not real burst/cloud Hits or proof of live-game critical inheritance", "A net benefit or critical uptime is not assumed",
      "cannot restore prohibited critical hits", "No added Mana multiplier", "Manual weights and route scores stay unchanged",
      skill === "gas-arrow" ? "conditional Fire explosion remain separate" : "on-hit Poison stay separate from the no-hit Poison burst"])
      expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current, supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Critical Hit Chance", "20% increased Critical Damage Bonus", "20% increased Magnitude of Poison you inflict", "Minions have 20% increased Critical Damage Bonus"]) {
      const n: TreeNode = { id: "fixture", flags: {}, position: { x: 0,y: 0 }, stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [],2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const [restored] = parseSavedBuildExport(serializeSavedBuildExport([saved]));
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(setSkillSupport(selected,support.id,false)).toEqual({ ...current, supportGemIds: [] });
  });

  it.each(components)("independently checks $skill's $component, including a negative high-bonus trade-off", f => {
    const mean = (f.range[0]+f.range[1])/2*(f.component.includes("Fire") ? 1 : .25);
    const chances = [.05,.04,0,.05,.04], multipliers = [2,3,0,6,7];
    for (let i = 0; i < f.hits.length; i++) expect(f.hits[i]).toBeCloseTo(mean*(1+chances[i]*(multipliers[i]-1)),9);
    expect(f.hits[1]).toBeGreaterThan(f.hits[0]);
    expect(f.hits[4]).toBeLessThan(f.hits[3]);
    expect(f.hits[2]).toBe(mean);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("Source-hit fields are not real burst/cloud Hits");
  });

  it.each(sources)("reconstructs %s's native source-Poison assumptions without inventing critical uptime or extra stacks", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const modeled = (range: readonly number[], duration: number, chance: number, multiplier: number, poisonChance = 1) => {
      const potential = 1.2*duration*poisonChance, roll = potential/(potential+1), presence = 1-(1-chance)**potential;
      const damage = range[0]+(range[1]-range[0])*roll;
      return damage*(1+presence*(multiplier-1))*.2;
    };
    for (const [i,chance,multiplier] of [[0,.05,2],[1,.04,3],[2,0,0],[3,.05,6],[4,.04,7]])
      expect(f.poison[i]).toBeCloseTo(modeled(source.range,f.duration,chance,multiplier),9);
    expect(f.poison[1]).toBeGreaterThan(f.poison[0]);
    expect(f.poison[4]).toBeLessThan(f.poison[3]);
    const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    expect(f.arrowPoison[0]).toBeCloseTo(modeled(arrow.range,2,.05,2,.6),9);
    expect(f.arrowPoison[1]).toBeCloseTo(modeled(arrow.range,2,.04,3,.6),9);
    expect(f.poisonIIIMana).toBe(Math.floor(f.mana*1.2));
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
  });

  it.each(poisonBowIds)("preserves %s's existing support choices and warnings", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    const peers = ["momentum", "blindside", "blind-ii", "malady", "poison-iii", "fork", "pierce-iii", "chain-iii", "ricochet-ii", "nova-projectiles-ii",
      ...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    const initial = { ...settings(skill), supportGemIds: peers }, selected = setSkillSupport(initial,support.id,true);
    expect(selected).toEqual({ ...initial, supportGemIds: [...peers,support.id] });
    const original = selectedSkillSupports(preset,peers), resolved = selectedSkillSupports(preset,selected.supportGemIds);
    for (const peer of original) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,peers));
    expect(setSkillSupport(selected,support.id,false)).toEqual(initial);
    expect(normalizeSkillSupportIds(skill,[support.id,support.id,null,"supercritical-ii"])).toEqual([support.id]);
  });

  it("keeps the two reviewed pairs narrow without inventing tiers or a broad Hit-skill allowlist", () => {
    expect(support.catalogTier).toBe(3);
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.some(s => /^supercritical-/.test(s.id))).toBe(false);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "fireball", "skeletal-sniper", "contagion"])
      expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
  });
});

import { describe, expect, it } from "vitest";
import { poisonBowInexorableSupportFixtures as supports, poisonBowInexorableComponents as components, poisonBowInexorableSources as sources } from "./poisonBowInexorableSupports.fixtures";
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
const cases = poisonBowIds.flatMap(skill => supports.map(support => ({ skill,support })));

describe("Inexorable Critical for reviewed Poison bow focuses", () => {
  it.each(cases)("reviews $skill's $support.name without importing PoB's default uptime or changing manual state", ({ skill,support }) => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_int.lua#L${support.line}`);
    for (const text of [`${support.chancePerSecond}% increased Critical Hit Chance each second`, `up to ${support.chanceCap}%`,
      "Buildup resets whenever a skill supported by Inexorable Critical critically hits", "Tier II's accumulated penalty resets too",
      "Poison damage itself is not a critical Hit or a reset event", "PoB defaults to ten elapsed seconds",
      "configured snapshot rather than a simulated reset cycle", "Maximum buildup and critical uptime are not assumed",
      "not real burst/cloud Hits or proof of live-game critical inheritance", "20% higher Mana cost before rounding applies even at zero buildup",
      "Manual weights and route scores stay unchanged"])
      expect(s.summary).toContain(text);
    expect(s.summary).toContain(support.lessBonusCap ? "50% less" : "not +100 percentage points or guaranteed critical hits");
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

  it.each(components)("independently checks $skill's $component at reset, partial buildup and caps", f => {
    const mean = (f.range[0]+f.range[1])/2*(f.component.includes("Fire") ? 1 : .25);
    const chances = [.05,.06,.1,.09,.15], multipliers = [2,2,2,1.8,1.5];
    for (let i = 0; i < f.hits.length; i++) expect(f.hits[i]).toBeCloseTo(mean*(1+chances[i]*(multipliers[i]-1)),9);
    expect(f.scalar5).toBeCloseTo(mean*1.075,9);
    expect(f.hits[2]).toBeGreaterThan(f.hits[4]);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === supports[0].id)!.summary).toContain("not real burst/cloud Hits");
  });

  it.each(sources)("reconstructs %s's conditional native source estimates and separately paid costs", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const modeled = (range: readonly number[], duration: number, chance: number, multiplier: number, poisonChance = 1) => {
      const potential = 1.2*duration*poisonChance, roll = potential/(potential+1), presence = 1-(1-chance)**potential;
      return (range[0]+(range[1]-range[0])*roll)*(1+presence*(multiplier-1))*.2;
    };
    for (const [i,chance] of [[0,.05],[1,.06],[2,.075],[3,.1]]) expect(f.poisonI[i]).toBeCloseTo(modeled(source.range,f.duration,chance,2),9);
    for (const [i,chance,multiplier] of [[0,.05,2],[1,.09,1.8],[2,.15,1.5]]) expect(f.poisonII[i]).toBeCloseTo(modeled(source.range,f.duration,chance,multiplier),9);
    expect(f.poisonII[2]).toBeLessThan(f.poisonII[1]);
    expect(f.neverPoison).toBeCloseTo(modeled(source.range,f.duration,0,0),9);
    expect(f.superPoison[0]).toBeCloseTo(modeled(source.range,f.duration,.06,3),9);
    expect(f.superPoison[1]).toBeCloseTo(modeled(source.range,f.duration,.12,2),9);
    const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    for (const [i,chance,multiplier] of [[0,.05,2],[1,.075,2],[2,.15,1.5]]) expect(f.arrowPoison[i]).toBeCloseTo(modeled(arrow.range,2,chance,multiplier,.6),9);
    expect(f.supportedMana).toBe(Math.floor(f.mana*1.2));
    expect(f.combinedPoisonMana).toBe(Math.floor(f.mana*1.44));
  });

  it.each(poisonBowIds)("replaces only %s's Inexorable tier and preserves earlier support warnings", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    const peers = ["supercritical", "momentum", "blindside", "blind-ii", "malady", "poison-iii", "fork", "pierce-iii", "chain-iii", "ricochet-ii", "nova-projectiles-ii",
      ...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    const initial = { ...settings(skill),supportGemIds: peers };
    let selected: PassiveOptimizationSettings = initial;
    for (const support of supports) {
      selected = setSkillSupport(selected,support.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,support.id] });
      const original = selectedSkillSupports(preset,peers), resolved = selectedSkillSupports(preset,selected.supportGemIds);
      for (const peer of original) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,peers));
      expect(setSkillSupport(selected,support.id,false)).toEqual(initial);
    }
    expect(normalizeSkillSupportIds(skill,[supports[0].id,supports[1].id,supports[0].id,null])).toEqual([supports[0].id]);
  });

  it("does not invent a third tier or broaden the reviewed allowlist", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([3,4]);
    expect(reviewedSkillSupports.some(s => s.id === "inexorable-critical-iii")).toBe(false);
    for (const support of supports) {
      expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
      expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow", "toxic-growth", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
    }
  });
});

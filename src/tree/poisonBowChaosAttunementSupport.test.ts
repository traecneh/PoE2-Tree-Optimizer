import { describe, expect, it } from "vitest";
import { poisonBowChaosAttunementSupportFixture as support, poisonBowChaosAttunementComponents as components,
  poisonBowChaosAttunementSourceFixtures as sources, poisonBowChaosAttunementExplosionFixture as explosion } from "./poisonBowChaosAttunementSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "physicalDamage", weight: 2 }, { id: "chaosDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }] });

describe("Chaos Attunement for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's gain and penalties, correcting mixed-source caution without changing priorities or scores", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name, effectId: s.effectId, family: s.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect([support.gainAsChaos, support.lessNonChaos, support.manaMultiplier, support.catalogTier]).toEqual([25, 50, 20, 3]);
    expect(s.sourceUrl).toContain("sup_int.lua#L1731");
    for (const text of ["Gain 25% of Damage as Extra Chaos Damage", "50% less Physical, Fire, Cold and Lightning Damage",
      "not conversion or 25% more Poison", "Poison-source value falls despite higher arrow average hits", "not a universal DPS recommendation",
      "Native source fields are not real burst/cloud hits", "20% higher Mana cost", "not guaranteed sustain",
      skill === "gas-arrow" ? "neither Poison chance nor ignition/detonation" : "distinct from the no-hit burst focus"]) expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current, supportGemIds: [support.id] });
    const refined = refineSkillPreferencePreset(preset, selected.supportGemIds);
    expect(refined.suggestions).toEqual(preset.suggestions);
    expect(refined.passiveStatScopes).toEqual(preset.passiveStatScopes);
    expect(refined.exclusions.filter(e => e.id !== "chaosDamage")).toEqual(preset.exclusions.filter(e => e.id !== "chaosDamage"));
    const caution = refined.exclusions.find(e => e.id === "chaosDamage")!.reason;
    expect(caution).toContain("Chaos Damage can scale that portion");
    expect(caution).toContain("not the remaining Physical source or all Poison damage");
    expect(caution).toContain("partial heuristic, not a DPS ranking");
    expect(caution).not.toContain("The Chaos tag does not add Chaos");
    expect(refineSkillPreferencePreset(preset, setSkillSupport(selected, support.id, false).supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
    for (const stats of [["20% increased Physical Damage"], ["20% increased Chaos Damage"], ["20% increased Magnitude of Poison you inflict"],
      ["20% increased Fire Damage"], ["Minions deal 20% increased Damage"]]) {
      const n: TreeNode = { id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats };
      expect(passivePreferenceValues(n, selected)).toEqual(passivePreferenceValues(n, current));
      expect(scorePassiveNode(n, selected.preferences, selected)).toBe(scorePassiveNode(n, current.preferences, current));
    }
  });

  it.each(components)("keeps $skill's $component Physical/Fire loss and gained Chaos distinct from total hit or Poison value", f => {
    expect(f.chaos[0]).toEqual([0, 0]);
    expect(f.chaos[1][0]).toBeGreaterThan(0);
    expect(f.chaos[1][1]).toBeGreaterThan(0);
    if (f.component === "conditional explosion") {
      expect(f.fire[1][0]).toBeLessThan(f.fire[0][0]);
      expect(f.hits[1]).toBeLessThan(f.hits[0]);
      expect(f.physical).toEqual([[0, 0], [0, 0]]);
    } else {
      expect(f.physical[1][0]).toBeLessThan(f.physical[0][0]);
      expect(f.physical[1][1]).toBeLessThan(f.physical[0][1]);
      expect(f.hits[1]).toBeGreaterThan(f.hits[0]);
    }
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("not real burst/cloud hits");
  });

  it.each(sources)("independently reproduces %s's mixed-source Poison trade-offs, gain-only/penalty-only and Chaos probes", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    const weighted = (p: readonly number[], c: readonly number[], roll: number) => p[0] + c[0] + (p[1] + c[1] - p[0] - c[0]) * roll / 100;
    const base = weighted(source.physical[0], source.chaos[0], f.roll);
    expect(f.poison[1] / f.poison[0]).toBeCloseTo(weighted(source.physical[1], source.chaos[1], f.roll) / base, 9);
    expect(f.gainOnly / f.poison[0]).toBeCloseTo(weighted(source.physical[0], source.chaos[1], f.roll) / base, 9);
    expect(f.penaltyOnly / f.poison[0]).toBeCloseTo(weighted(source.physical[1], [0,0], f.roll) / base, 9);
    expect(f.arrowPoison[1] / f.arrowPoison[0]).toBeCloseTo(weighted(arrow.physical[1], arrow.chaos[1], f.arrowRoll) / weighted(arrow.physical[0], arrow.chaos[0], f.arrowRoll), 9);
    expect(f.poison[1]).toBeLessThan(f.poison[0]);
    expect(f.chaosProbe[0]).toBe(f.poison[0]);
    expect(f.chaosProbe[1] / f.poison[0]).toBeCloseTo(weighted(source.physical[1], f.doubledChaos, f.roll) / base, 9);
    expect(f.chaosProbe[1]).toBeGreaterThan(f.poison[1]);
    expect(f.mana[1]).toBe(Math.floor(f.mana[0] * 1.2));
    expect(f.poisonMana[1]).toBe(Math.floor(f.mana[0] * 1.2 ** 2));
    expect(f.efficiencyMana[1]).toBe(Math.ceil(f.mana[1] * .6));
    expect(f.masteryMana[1]).toBe(Math.floor(f.masteryMana[0] * 1.2));
    expect(f.masteryPoison[1]).toBeLessThan(f.masteryPoison[0]);
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it("keeps newly eligible explosion Chaos separate from Poison chance and Fire damage", () => {
    const hit = components.find(c => c.component === "conditional explosion")!;
    const arrow = components.find(c => c.skill === "gas-arrow" && c.component === "arrow")!;
    expect(explosion.withoutChancePoison).toBe(0);
    expect(explosion.separateChance).toBe(60);
    expect(explosion.separatePoisonDuration).toBe(2);
    expect(explosion.eligibleChaos).toEqual(hit.chaos[1]);
    expect(explosion.eligibleChaos).toEqual([arrow.physical[1][0] + arrow.chaos[1][0], arrow.physical[1][1] + arrow.chaos[1][1]]);
    expect(explosion.poisonWithSeparateChance).toBe(sources.find(s => s.skill === "gas-arrow")!.arrowPoison[1]);
    expect(explosion.manaWithSeparateChance).toBe(89);
    expect(reviewedSkillSupportsFor("gas-arrow").find(s => s.id === support.id)!.summary).toContain("a separate source of on-hit Poison chance");
    expect(reviewedSkillSupportsFor("gas-arrow").find(s => s.id === support.id)!.summary).toContain("neither Poison chance nor ignition/detonation");
  });

  it.each(poisonBowIds)("round-trips %s's review with state, other supports and earlier warnings intact", skill => {
    const initial = { ...settings(skill), supportGemIds: ["malady", "poison-iii", "blindside", "blind-ii", "longshot-ii", "close-combat-ii", "efficiency-ii", "corrosion", "exploit-weakness", "chaos-mastery"] };
    const selected = setSkillSupport(initial, support.id, true);
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds, support.id] });
    expect(normalizeSkillSupportIds(skill, [support.id, support.id, "chaos-mastery", null])).toEqual([support.id, "chaos-mastery"]);
    const resolved = selectedSkillSupports(getSkillPreferencePreset(skill)!, selected.supportGemIds);
    expect(resolved.find(s => s.id === "poison-iii")!.summary).toContain("Malady is selected");
    expect(resolved.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
    for (const id of ["longshot-ii", "close-combat-ii"]) expect(resolved.find(s => s.id === id)!.summary).toContain("their damage bonuses do not overlap");
    for (const id of ["exploit-weakness", "corrosion"]) expect(resolved.find(s => s.id === id)!.summary).toContain("Incompatible pair selected");
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.selectedClassStartId).toBe("ranger");
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(setSkillSupport(selected, support.id, false)).toEqual(initial);
  });

  it("does not admit every legal damaging skill or fictional tiers", () => {
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "chaos-attunement-ii", true)).toEqual(settings(skill));
  });
});

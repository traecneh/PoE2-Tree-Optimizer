import { describe, expect, it } from "vitest";
import { poisonBowEscalatingSupportFixture as support, poisonBowEscalatingNativeFixtures as native,
  poisonBowEscalatingHitFixtures as hits } from "./poisonBowEscalatingSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const preset = (skill: string) => getSkillPreferencePreset(skill)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "poisonDuration", weight: 3 }, { id: "skillDuration", weight: 1 }, { id: "poisonMagnitude", weight: 2 }, { id: "attackSpeed", weight: 1 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Escalating Poison for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("admits %s with an explicit capacity/duration trade-off, not automatic score or priority changes", (skill) => {
    const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === support.id)!;
    expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(resolved.summary).toContain("One additional Poison stack; 20% less outgoing Poison duration");
    expect(resolved.summary).toContain("Extra capacity does not guarantee sustained stacks or a damage gain");
    expect(resolved.summary).toContain("Native PoB models the no-hit Poison component");
    expect(resolved.summary).toContain(skill === "gas-arrow" ? "not the four-second cloud lifetime" : "initial arrow must hit");
    expect(resolved.priorities).toEqual([]);
    const current = settings(skill);
    const selected = setSkillSupport(current, support.id, true);
    expect(selected).toEqual({ ...current, supportGemIds: [support.id] });
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
    expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
    expect(addSkillPresetPreferences(selected, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    expect(setSkillSupport(selected, support.id, false)).toEqual({ ...current, supportGemIds: [] });
  });

  it.each(poisonBowIds)("preserves %s's other families, goal, class and point-budget settings through saved JSON", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["prolonged-duration-ii", "deadly-poison-ii", "efficiency-ii", "mobility"] };
    const selected = setSkillSupport(current, support.id, true);
    expect(selected.supportGemIds).toEqual([...current.supportGemIds, support.id]);
    expect(normalizeSkillSupportIds(skill, [support.id, support.id, "unreviewed-swift-affliction", null, "bad"])).toEqual([support.id]);
    expect(setSkillSupport(selected, support.id, false)).toEqual(current);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(restored.state.selectedClassStartId).toBe("ranger");
  });

  it.each(native)("independently checks $skill's stack capacity and shorter Poison separately from hits, coverage and skill lifetime", (f) => {
    expect(f.noHitSource).toBe(true);
    expect(f.supportedStacks).toBe(f.stacks + support.additionalStacks);
    expect(f.supportedPoisonDuration).toBeCloseTo(f.poisonDuration * (1 - support.durationLess / 100));
    for (const [actual, baseline] of [[f.supportedDuration, f.duration], [f.supportedHit, f.hit], [f.supportedMagnitude, f.magnitude],
      [f.supportedMana, f.mana], [f.supportedRate, f.rate], [f.supportedRadius, f.radius]]) expect(actual).toBe(baseline);
    expect(f.syntheticPoison).toBe(f.supportedPoison);
    expect(f.durationOnlyPoison).toBeLessThan(f.poison);
    expect(f.supportedPoison).toBeLessThan(f.stackOnlyPoison);
    expect(f.supportedPoison).not.toBeCloseTo(f.poison * 2);
    expect(f.supportedPoison).not.toBeCloseTo(f.poison * 2 * .8);
  });

  it.each(native)("checks $skill's native constant-firing estimate without treating capacity as sustained stacks", (f) => {
    const potential = (duration: number, rate: number, cap: number) => duration * rate / cap;
    expect(potential(f.poisonDuration, f.rate, f.stacks)).toBeCloseTo(f.potential);
    expect(potential(f.supportedPoisonDuration, f.supportedRate, f.supportedStacks)).toBeCloseTo(f.supportedPotential);
    const applications = f.supportedPoisonDuration * f.supportedRate;
    const roll = f.supportedPotential > 1 ? (applications - (f.supportedStacks - 1) / 2) / (applications + 1) * 100 : 50;
    expect(roll).toBeCloseTo(f.supportedRoll);
    expect(potential(f.poisonDuration, f.slowRate, f.stacks)).toBeCloseTo(f.slowPotential);
    expect(potential(f.supportedPoisonDuration, f.slowRate, f.supportedStacks)).toBeCloseTo(f.slowSupportedPotential);
    expect(f.slowSupportedPotential).toBeLessThan(1);
    expect(f.slowRoll).toBe(50);
    expect(f.slowSupportedRoll).toBe(50);
    expect(f.slowSupportedPoison).toBeCloseTo(f.slowPoison * .8);
    expect(f.slowSupportedPoison).toBeLessThan(f.slowPoison);
    expect(potential(f.rapidPoisonDuration, f.rapidRate, f.supportedStacks)).toBeCloseTo(f.rapidPotential);
    expect(f.rapidPoison).toBeGreaterThan(f.supportedPoison);
    // These are PoB's synthetic constant-application assumptions, not actual cloud/arrow contact rates.
    if (f.skill === "gas-arrow") expect(f.supportedPotential).toBeLessThan(1);
  });

  it.each(native)("keeps $skill's duration, magnitude, deployment and cost interactions distinct", (f) => {
    expect(f.poison100Duration).toBeCloseTo(f.supportedPoisonDuration * 2);
    expect(f.poison100SkillDuration).toBe(f.duration);
    expect(f.skill100PoisonDuration).toBeCloseTo(f.supportedPoisonDuration * (f.linkedSkillDuration ? 2 : 1));
    expect(f.skill100Duration).toBeGreaterThan(f.duration);
    expect(f.prolongedPoisonDuration).toBeCloseTo(f.supportedPoisonDuration * (f.linkedSkillDuration ? 1.35 : 1));
    expect(f.prolongedSkillDuration).toBeGreaterThan(f.duration);
    if (!f.linkedSkillDuration) expect(f.prolongedPoison).toBe(f.supportedPoison);
    expect(f.deadlyMagnitude).toBe(2);
    expect(f.deadlyStacks).toBe(f.supportedStacks);
    expect(f.deadlyPoisonDuration).toBe(f.supportedPoisonDuration);
    expect(f.deadlyHit).toBeLessThan(f.hit);
    expect(f.combinedMagnitude).toBe(f.deadlyMagnitude);
    expect(f.combinedStacks).toBe(f.supportedStacks);
    expect(f.combinedPoisonDuration).toBe(f.prolongedPoisonDuration);
    expect(f.combinedMana).toBe(Math.ceil(Math.floor(f.mana * 1.2) * .6));
  });

  it.each(hits)("does not turn $skill / $component into a new default Poison hit", (f) => {
    expect(f.supportedHit).toBe(f.hit);
    expect(f.hasPoisonOutput).toBe(false);
  });

  it.each(poisonBowIds)("does not multiply %s's passive scores, conflate timers or broaden hit/owner scopes", (skill) => {
    const current = settings(skill);
    const selected = setSkillSupport(current, support.id, true);
    for (const p of [node("20% increased Magnitude of Poison you inflict"), node("10% increased Poison Duration"), node("10% increased Skill Effect Duration"),
      node("20% increased Attack Speed"), node("20% increased Attack Damage"), node("Minions deal 100% increased Damage", "100% increased Damage with Plant Skills")]) {
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
    }
    expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).passiveStatScopes).toEqual(preset(skill).passiveStatScopes);
    expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).exclusions).toEqual(preset(skill).exclusions);
  });

  it("does not infer coverage for other Poison-capable or previously held focuses", () => {
    expect(reviewedSkillSupports.find((s) => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "entangle", "fireball", "lightning-arrow", "contagion"]) {
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
      expect(reviewedSkillSupportsFor(skill).some((s) => s.id === support.id)).toBe(false);
    }
  });
});

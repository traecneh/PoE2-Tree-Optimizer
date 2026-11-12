import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { poisonBowDeadlySupportFixtures as supports, poisonBowDeadlyNativeFixtures as native, poisonBowDeadlyHitControls as hits } from "./poisonBowDeadlySupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { poisonBowReviewedSupportIdsFor } from "./poisonBowSpeedSupports.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset,
  setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const preset = (skill: string) => getSkillPreferencePreset(skill)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "poisonMagnitude", weight: 1 }, { id: "poisonDuration", weight: 1 }, { id: "attackDamage", weight: 2 }, { id: "life", weight: 3 }, { id: "fireDamage", weight: 2 }] });

describe("reviewed Deadly Poison for Poison burst/cloud focuses", () => {
  it.each(supports)("admits $id only for the reviewed focuses with both modifiers and no flat DPS/priority multiplier", (f) => {
    for (const skill of poisonBowIds) {
      const resolved = preCommon45SupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ effectId: resolved.effectId, name: resolved.name, family: resolved.family }).toEqual({ effectId: f.effectId, name: f.name, family: f.family });
      expect(resolved.summary).toContain(`${f.poisonMore}% more Poison magnitude; ${f.hitLess}% less damage with hits`);
      expect(resolved.summary).toContain("Native PoB also reduces the derived Poison source");
      expect(resolved.summary).toContain(`not ${f.poisonMore}% more Poison DPS`);
      expect(resolved.summary).toContain("poisons without hitting");
      expect(resolved.priorities).toEqual([]);
      const current = settings(skill);
      const selected = setSkillSupport(current, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
      expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
      expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
    }
    for (const skill of ["spark", "fireball", "vine-arrow", "toxic-growth", "entangle", "skeletal-arsonist"])
      expect(setSkillSupport(settings(skill), f.id, true)).toEqual(settings(skill));
  });

  it.each(poisonBowIds)("retains %s's prior links, one Deadly tier, goals and manual priorities through saved JSON", (skill) => {
    expect(preCommon45SupportsFor(skill).map((s) => s.id)).toEqual(poisonBowReviewedSupportIdsFor(skill));
    const current = { ...settings(skill), supportGemIds: ["prolonged-duration-ii", "rapid-attacks-ii", "efficiency-ii"] };
    const first = setSkillSupport(current, "deadly-poison-i", true);
    const second = setSkillSupport(first, "deadly-poison-ii", true);
    expect(second).toEqual({ ...current, supportGemIds: [...current.supportGemIds, "deadly-poison-ii"] });
    expect(normalizeSkillSupportIds(skill, ["deadly-poison-ii", "deadly-poison-i", "deadly-poison-ii", "bad", null])).toEqual(["deadly-poison-ii"]);
    expect(normalizePassiveOptimizationSettings(second)).toEqual(second);
    expect(addSkillPresetPreferences(second, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: second,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(second);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(setSkillSupport(second, "deadly-poison-ii", false)).toEqual(current);
  });

  it.each(native)("independently checks $skill's hit-only, magnitude-only and combined native Poison behavior", (f) => {
    expect(f.hitOnlyIPoison).toBeLessThan(f.baselinePoison);
    expect(f.hitOnlyIIPoison).toBeLessThan(f.hitOnlyIPoison);
    expect(f.magnitudeOnlyIPoison).toBeCloseTo(f.baselinePoison * 1.75);
    expect(f.magnitudeOnlyIIPoison).toBeCloseTo(f.baselinePoison * 2);
    expect(f.supportIPoison).toBeCloseTo(f.hitOnlyIPoison * f.magnitudeI);
    expect(f.supportIIPoison).toBeCloseTo(f.hitOnlyIIPoison * f.magnitudeII);
    expect(f.supportIPoison).toBe(f.syntheticIPoison);
    expect(f.supportIIPoison).toBe(f.syntheticIIPoison);
    expect(f.supportIPoison).toBeGreaterThan(f.baselinePoison);
    expect(f.supportIIPoison).toBeGreaterThan(f.supportIPoison);
    expect(f.supportIPoison).toBeLessThan(f.magnitudeOnlyIPoison);
    expect(f.supportIIPoison).toBeLessThan(f.magnitudeOnlyIIPoison);
    expect((1 + 1) * f.magnitudeII).toBe(f.increasedMagnitude100);
    expect(f.increasedMagnitude100Poison).toBeCloseTo(f.supportIIPoison * 2);
    for (const [value, baseline] of [[f.supportedDuration, f.baseDuration], [f.supportedPoisonDuration, f.poisonDuration],
      [f.supportedRadius, f.radius], [f.supportedMana, f.mana], [f.supportedRate, f.rate],
      [f.supportedPoisonChance, f.poisonChance], [f.supportedStackLimit, f.stackLimit]]) expect(value).toBe(baseline);
    expect(f.combinedRate).toBeCloseTo(f.rate * 1.25);
    expect(f.combinedPoisonDuration).toBeCloseTo(f.poisonDuration * (f.skill === "poisonburst-arrow" ? 1.35 : 1));
    expect(f.combinedSkillDuration).toBeCloseTo(Math.ceil((f.skill === "poisonburst-arrow" ? 3 : 4) * 1.35 / .033) * .033);
    expect(f.combinedMana).toBe(Math.ceil(Math.floor(f.mana * 1.2) * .6));
  });

  it.each(hits)("retains the $skill / $component hit penalty without granting Poison chance or assuming exact rounded ratios", (f) => {
    expect(f.tierI).toBeLessThan(f.base);
    expect(f.tierII).toBeLessThanOrEqual(f.tierI);
    expect(f.hasDefaultPoisonOutput).toBe(false);
  });

  it.each(poisonBowIds)("keeps %s's passive scores, no-hit/owner scopes and manual choices separate from native support output", (skill) => {
    const current = settings(skill);
    const p: TreeNode = { id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats: ["20% increased Magnitude of Poison you inflict", "10% reduced Magnitude of Poison you inflict",
      "20% increased Damage with Bows", "10% increased Attack Area Damage", "10% increased Poison Duration", "Minions deal 100% increased Damage"] };
    for (const f of supports) {
      const selected = setSkillSupport(current, f.id, true);
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      expect(selected.preferences).toEqual(current.preferences);
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
      const note = preCommon45SupportsFor(skill).find((s) => s.id === f.id)!.summary;
      expect(note).toContain(skill === "gas-arrow" ? "conditional Fire-explosion hits lose damage" : "initial-arrow hits lose damage");
    }
  });
});

import { describe, expect, it } from "vitest";
import { poisonBowConcentratedSupportFixture as support, poisonBowConcentratedNativeFixtures as native, poisonBowConcentratedHitControls as hits } from "./poisonBowConcentratedSupports.fixtures";
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
  preferences: [{ id: "areaOfEffect", weight: 1 }, { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }, { id: "fireDamage", weight: 2 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Concentrated Area for Poison burst/cloud focuses", () => {
  it.each(poisonBowIds)("admits %s with reviewed identity and an explicit coverage-only priority adjustment", (skill) => {
    const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === support.id)!;
    expect({ effectId: resolved.effectId, family: resolved.family, name: resolved.name }).toEqual({ effectId: support.effectId, family: support.family, name: support.name });
    expect(resolved.summary).toContain("30% more Area Damage; 50% less area, not 50% less radius");
    expect(resolved.summary).toContain("derived Poison source");
    expect(resolved.summary).toContain("still poisons without hitting");
    expect(resolved.summary).toContain("not a DPS multiplier or calculated restoration");
    expect(resolved.priorities).toMatchObject([{ id: support.preference, weight: support.priority }]);
    const current = settings(skill);
    const selected = setSkillSupport(current, support.id, true);
    expect(selected).toEqual({ ...current, supportGemIds: [support.id] });
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const refined = refineSkillPreferencePreset(preset(skill), selected.supportGemIds);
    expect(refined.suggestions.find((s) => s.id === support.preference)?.weight).toBe(2);
    expect(refined.passiveStatScopes).toEqual(preset(skill).passiveStatScopes);
    expect(refined.exclusions).toEqual(preset(skill).exclusions);
    expect(addSkillPresetPreferences(selected, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    expect(skillSupportPriorityChanges(selected, preset(skill))).toMatchObject([{ id: "areaOfEffect", weight: 2 }]);
    const applied = applySkillSupportPriorities(selected, preset(skill));
    expect(applied).toEqual({ ...selected, preferences: [{ id: "areaOfEffect", weight: 2 }, ...current.preferences.slice(1)] });
    expect(applySkillSupportPriorities(applied, preset(skill))).toEqual(applied);
    const removed = setSkillSupport(applied, support.id, false);
    expect(removed.preferences).toEqual(applied.preferences);
    expect(refineSkillPreferencePreset(preset(skill), removed.supportGemIds)).toEqual(preset(skill));
  });

  it.each(poisonBowIds)("round-trips %s's support and explicit priority while preserving prior families, goals and budget", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["magnified-area-ii", "deadly-poison-ii", "efficiency-ii"] };
    const selected = applySkillSupportPriorities(setSkillSupport(current, support.id, true), preset(skill));
    expect(selected.supportGemIds).toEqual([...current.supportGemIds, support.id]);
    expect(normalizeSkillSupportIds(skill, [support.id, support.id, "unreviewed-swift-affliction", null, "bad"])).toEqual([support.id]);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(restored.state.optimizerSettings?.extraPointBudget).toBe(7);
    expect(restored.state.optimizerSettings?.pointBudgetMode).toBe("all-available");
  });

  it.each(native)("independently checks $skill's source scaling, coverage loss and separate timer/cost boundaries", (f) => {
    expect(Math.floor(f.radius * Math.sqrt(.5))).toBe(f.concentratedRadius);
    expect(f.concentratedRadius).not.toBe(f.radius * .5);
    expect(Math.floor(f.radius * Math.sqrt((1 + 1) * .5))).toBe(f.increased100Radius);
    expect(f.increased100Radius).toBe(f.radius);
    expect(Math.floor(f.radius * Math.sqrt(1.45 * .5))).toBe(f.magnifiedRadius);
    expect(f.magnifiedRadius).toBeLessThan(f.radius);
    expect(f.areaOnlyPoison).toBe(f.basePoison);
    expect(f.areaOnlyRadius).toBe(f.concentratedRadius);
    expect(f.damageOnlyPoison).toBe(f.concentratedPoison);
    expect(f.damageOnlyRadius).toBe(f.radius);
    expect(f.syntheticPoison).toBe(f.concentratedPoison);
    expect(f.syntheticSourceHit).toBe(f.concentratedSourceHit);
    expect(f.concentratedPoison).toBeGreaterThan(f.basePoison);
    // Low Bow values round before the final ailment estimate, so no exact 1.3 output ratio is forced.
    expect(f.concentratedPoison).not.toBeCloseTo(f.basePoison * 1.3, 6);
    expect(f.magnifiedPoison).toBe(f.concentratedPoison);
    for (const [value, baseline] of [[f.concentratedDuration, f.duration], [f.concentratedPoisonDuration, f.poisonDuration],
      [f.concentratedMana, f.mana], [f.concentratedRate, f.rate], [f.concentratedMagnitude, f.magnitude], [f.concentratedStackLimit, f.stackLimit]]) expect(value).toBe(baseline);
    expect(f.deadlyConcentratedPoison).toBeGreaterThan(f.deadlyOnlyPoison);
    expect(f.combinedPoison).toBe(f.deadlyConcentratedPoison);
    expect(f.combinedMagnitude).toBe(2);
    expect(f.combinedMana).toBe(Math.ceil(Math.floor(f.mana * 1.3) * .6));
  });

  it.each(hits)("keeps $skill / $component behavior separate from the no-hit Poison source", (f) => {
    if (f.areaEnabled) expect(f.concentratedHit).toBeGreaterThan(f.hit);
    else expect(f.concentratedHit).toBe(f.hit);
  });

  it.each(poisonBowIds)("does not multiply %s's passive damage score and changes only coverage weighting on explicit apply", (skill) => {
    const current = settings(skill);
    const selected = setSkillSupport(current, support.id, true);
    const p = node("20% increased Magnitude of Poison you inflict", "10% increased Area of Effect for Attacks", "10% increased Attack Area Damage",
      "Minions deal 100% increased Damage", "100% increased Damage with Plant Skills");
    expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
    expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
    const area = node("10% increased Area of Effect for Attacks");
    expect(scorePassiveNode(area, selected.preferences, selected)).toBe(1);
    const applied = applySkillSupportPriorities(selected, preset(skill));
    expect(scorePassiveNode(area, applied.preferences, applied)).toBe(2);
    const poison = node("20% increased Magnitude of Poison you inflict");
    expect(scorePassiveNode(poison, applied.preferences, applied)).toBe(scorePassiveNode(poison, current.preferences, current));
  });

  it("keeps Fireball's held review, Vine Arrow's intrinsic DoT focus and older Concentrated reasons unchanged", () => {
    for (const skill of ["fireball", "vine-arrow", "essence-drain", "enfeeble"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
    expect(reviewedSkillSupportsFor("toxic-growth").find((s) => s.id === support.id)?.summary).toContain("impact/explosion hits");
    const base = reviewedSkillSupports.find((s) => s.id === support.id)!;
    for (const skill of ["rain-of-arrows", "rolling-slam"]) {
      const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === support.id)!;
      expect(resolved.summary).toBe(base.summary);
      expect(resolved.priorities).toEqual(base.priorities);
    }
  });
});

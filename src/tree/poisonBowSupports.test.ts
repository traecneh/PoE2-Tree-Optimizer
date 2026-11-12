import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { poisonBowSupportFixtures as supports, poisonBowSupportIds as allowed, poisonBowCombinedSupportIds as combined,
  poisonBowSupportComponents as components, poisonBowSupportHitControls as hits } from "./poisonBowSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { poisonBowReviewedSupportIdsFor } from "./poisonBowSpeedSupports.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "poisonMagnitude", weight: 1 }, { id: "poisonDuration", weight: 1 }, { id: "skillDuration", weight: 1 }, { id: "life", weight: 3 }, { id: "fireDamage", weight: 2 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });

describe("reviewed Poison bow area, duration and cost supports", () => {
  it.each(supports)("keeps $id's identity and skill-specific notes without a fabricated priority command", (f) => {
    const source = reviewedSkillSupports.find((s) => s.id === f.id)!;
    expect({ effectId: source.effectId, family: source.family, name: source.name }).toEqual({ effectId: f.effectId, family: f.family, name: f.name });
    for (const skill of poisonBowIds) {
      const resolved = preCommon45SupportsFor(skill).find((s) => s.id === f.id)!;
      expect(resolved.priorities).toEqual([]);
      expect(resolved.summary).toContain(`${f.amount}% ${f.kind === "area" ? "increased area" : f.kind === "duration" ? "more skill-effect duration" : "less supported-skill cost"}`);
      expect(resolved.summary).toContain("priorities stay unchanged");
      expect(refineSkillPreferencePreset(preset(skill), [f.id])).toEqual(preset(skill));
      expect(skillSupportPriorityChanges(setSkillSupport(settings(skill), f.id, true), preset(skill))).toEqual([]);
    }
  });

  it.each(poisonBowIds)("retains %s's six utility pairs alongside reviewed speed pairs and rejects unreviewed supports", (skill) => {
    expect(preCommon45SupportsFor(skill).map((s) => s.id)).toEqual(poisonBowReviewedSupportIdsFor(skill));
    const current = settings(skill);
    for (const id of allowed) {
      const selected = setSkillSupport(current, id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [id] });
      expect(setSkillSupport(selected, id, false)).toEqual({ ...current, supportGemIds: [] });
      expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
    }
    let selected = current;
    for (const id of allowed) selected = setSkillSupport(selected, id, true);
    expect(selected.supportGemIds).toEqual(combined);
    expect(normalizeSkillSupportIds(skill, [...combined, "efficiency-i", null, {}, "bad"])).toEqual(combined);
    for (const id of ["projectile-acceleration-iii", "unreviewed-swift-affliction", "brutality-iv", "spell-echo"]) {
      expect(setSkillSupport(current, id, true)).toBe(current);
      expect(normalizeSkillSupportIds(skill, [id])).toEqual([]);
    }
  });

  it.each(poisonBowIds)("preserves %s's manual choices, goals, point budget and support selection through saved JSON", (skill) => {
    const current = { ...settings(skill), supportGemIds: combined };
    expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
    expect(addSkillPresetPreferences(current, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(current);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(setSkillSupport(current, "prolonged-duration-ii", false)).toEqual({ ...current, supportGemIds: ["magnified-area-ii", "efficiency-ii"] });
  });

  it.each(components)("independently checks $skill's area, timer and rounded cost arithmetic", (f) => {
    expect(Math.floor(f.radius * Math.sqrt(1.35))).toBe(f.magnifiedI);
    expect(Math.floor(f.radius * Math.sqrt(1.45))).toBe(f.magnifiedII);
    expect(Math.floor(f.radius * Math.sqrt(1 + 1 + .45))).toBe(f.area100WithMagnifiedII);
    expect(Math.ceil(f.sourceDuration / .033) * .033).toBeCloseTo(f.roundedDuration);
    expect(Math.ceil(f.sourceDuration * 1.3 / .033) * .033).toBeCloseTo(f.prolongedI);
    expect(Math.ceil(f.sourceDuration * 1.35 / .033) * .033).toBeCloseTo(f.prolongedII);
    expect(Math.ceil(f.sourceDuration * 2 * 1.35 / .033) * .033).toBeCloseTo(f.duration100WithProlongedII);
    expect(Math.floor(f.manaCost * 1.3)).toBe(f.magnifiedCost);
    expect(Math.floor(f.manaCost * 1.2)).toBe(f.prolongedCost);
    expect(Math.ceil(f.manaCost * .7)).toBe(f.efficiencyI);
    expect(Math.ceil(f.manaCost * .6)).toBe(f.efficiencyII);
    expect(Math.ceil(Math.floor(f.manaCost * 1.3 * 1.2) * .6)).toBe(f.combinedCost);
    expect(f.hitWithEachSupport).toBe(f.hit);
    expect(f.rateWithEachSupport).toBe(f.rate);
    expect(f.magnitudeUnaffectedPoison).toBe(f.poison);
    expect(f.poison100Poison).toBeCloseTo(f.poisonDuration * 2 * (f.linkedPoisonDuration ? 1.35 : 1));
    if (f.linkedPoisonDuration) {
      expect(f.prolongedIPoison).toBeCloseTo(f.poisonDuration * 1.3);
      expect(f.prolongedIIPoison).toBeCloseTo(f.poisonDuration * 1.35);
      expect(f.duration100Poison).toBeCloseTo(f.poisonDuration * 2 * 1.35);
      // Native roll-selection estimates change with persistence, not a direct tick-damage modifier.
      expect(f.prolongedIPoisonDPS).toBeGreaterThan(f.poison);
      expect(f.prolongedIIPoisonDPS).toBeGreaterThan(f.prolongedIPoisonDPS);
    } else {
      for (const value of [f.prolongedIPoison, f.prolongedIIPoison, f.duration100Poison]) expect(value).toBe(f.poisonDuration);
      for (const value of [f.prolongedIPoisonDPS, f.prolongedIIPoisonDPS]) expect(value).toBe(f.poison);
    }
  });

  it("keeps linked Poison persistence, separate cloud lifetime and conditional real hits explicit", () => {
    const text = (skill: string, support: string) => preCommon45SupportsFor(skill).find((s) => s.id === support)!.summary;
    expect(text("poisonburst-arrow", "prolonged-duration-ii")).toContain("linked outgoing Poison duration");
    expect(text("gas-arrow", "prolonged-duration-ii")).toContain("not its outgoing two-second Poison duration");
    expect(text("gas-arrow", "magnified-area-i")).toContain("not Poison tick damage or guaranteed overlap");
    expect(text("poisonburst-arrow", "magnified-area-ii")).toContain("initial arrow must hit");
    expect(text("gas-arrow", "efficiency-ii")).toContain("separate Detonator skill");
    for (const f of hits) {
      expect(f.hitWithEachSupport).toBe(f.hit);
      expect(f.hasPoisonOutput).toBe(false);
    }
  });

  it.each(poisonBowIds)("does not multiply %s's passive scores, duration weights or broaden hit/owner scopes when linking supports", (skill) => {
    const current = addSkillPresetPreferences(settings(skill), preset(skill));
    const passive = node("20% increased Magnitude of Poison you inflict", "10% increased Poison Duration", "10% increased Skill Effect Duration",
      "20% increased Damage with Bows", "10% increased Attack Area Damage", "Minions deal 100% increased Damage", "100% increased Damage with Plant Skills");
    for (const id of allowed) {
      const selected = setSkillSupport(current, id, true);
      expect(selected.preferences).toEqual(current.preferences);
      expect(passivePreferenceValues(passive, selected)).toEqual(passivePreferenceValues(passive, current));
      expect(scorePassiveNode(passive, selected.preferences, selected)).toBe(scorePassiveNode(passive, current.preferences, current));
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
    }
  });
});

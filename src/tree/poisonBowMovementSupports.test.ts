import { describe, expect, it } from "vitest";
import { poisonBowMovementSupportFixtures as supports, poisonBowMovementNative as native,
  poisonBowMovementPoisonFixtures as poison, poisonBowMovementHitFixtures as hits } from "./poisonBowMovementSupports.fixtures";
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
  preferences: [{ id: "movementSpeed", weight: 3 }, { id: "skillMovementPenaltyReduction", weight: 1 }, { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Poison bow firing-movement supports", () => {
  it.each(poisonBowIds)("admits both reviewed %s links without translating penalties into global speed or automatic priorities", (skill) => {
    for (const f of supports) {
      const support = reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ name: support.name, family: support.family, effectId: support.effectId }).toEqual({ name: f.name, family: f.family, effectId: f.effectId });
      expect(support.summary).toContain(f.id === "mobility" ? "25% less movement-speed penalty while firing, not global Movement Speed" : "20% more damage; 30% more movement-speed penalty while firing");
      expect(support.summary).toContain(f.id === "mobility" ? "or Poison-source damage" : "derived Poison source, not Poison Magnitude");
      expect(support.summary).toContain(skill === "gas-arrow" ? "cloud still poisons without hitting" : "initial arrow must hit");
      expect(support.priorities).toEqual([]);
      const current = settings(skill);
      const selected = setSkillSupport(current, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
      expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
      expect(addSkillPresetPreferences(selected, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
      expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
    }
  });

  it.each(poisonBowIds)("round-trips %s with independent families, goals and point budget intact", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["deadly-poison-ii", "efficiency-ii", "rapid-attacks-ii"] };
    const selected = setSkillSupport(setSkillSupport(current, "mobility", true), "deliberation", true);
    expect(selected.supportGemIds).toEqual([...current.supportGemIds, "mobility", "deliberation"]);
    expect(normalizeSkillSupportIds(skill, ["mobility", "deliberation", "mobility", "deliberation", "unreviewed-swift-affliction", null])).toEqual(["mobility", "deliberation"]);
    expect(setSkillSupport(selected, "mobility", false).supportGemIds).toEqual([...current.supportGemIds, "deliberation"]);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
  });

  it("independently distinguishes retained action speed, multiplicative penalties and PoB rounding", () => {
    const retained = (inc: number, more: number) => 1 - (1 - native.baseRetained) * Math.max(0, (1 + inc / 100) * more);
    expect(retained(0, supports[0].penaltyMultiplier)).toBeCloseTo(native.mobilityRetained);
    expect(retained(0, supports[1].penaltyMultiplier)).toBeCloseTo(native.deliberationRetained);
    const raw = supports[0].penaltyMultiplier * supports[1].penaltyMultiplier;
    expect(raw).toBeCloseTo(.975);
    expect(Math.round(raw * 100) / 100).toBe(native.bothPenalty);
    expect(retained(0, native.bothPenalty)).toBeCloseTo(native.bothRetained);
    expect(retained(0, raw)).toBeCloseTo(.3175);
    expect(retained(0, raw)).not.toBeCloseTo(native.bothRetained, 4);
    expect(retained(0, 1 - .25 + .3)).not.toBeCloseTo(native.bothRetained);
    expect(native.mobilityRetained).not.toBe(native.baseRetained + .25);
    expect(native.deliberationRetained).not.toBe(native.baseRetained * .7);
    expect(native.global20Retained).toBe(native.baseRetained);
    expect(native.global20Speed).toBeCloseTo(native.baseRetained * native.global20);
    expect(native.bothGlobal20Retained).toBe(native.bothRetained);
    expect(native.bothGlobal20Speed).toBeCloseTo(native.bothRetained * native.global20);
    expect(retained(native.penaltyReductionInc, 1)).toBeCloseTo(native.penaltyReductionRetained);
    expect(retained(native.penaltyReductionInc, supports[1].penaltyMultiplier)).toBeCloseTo(native.deliberationReducedRetained);
  });

  it.each(poison)("keeps $skill's damage-only source control separate from movement, magnitude, timers and cost", (f) => {
    expect(f.mobilityPoison).toBe(f.poison);
    expect(f.mobilitySourceHit).toBe(f.sourceHit);
    expect(f.global20Poison).toBe(f.poison);
    expect(f.reductionOnlyPoison).toBe(f.poison);
    expect(f.deliberationPoison).toBeGreaterThan(f.poison);
    for (const value of [f.bothPoison, f.damageOnlyPoison, f.bothGlobal20Poison, f.deliberationReducedPoison]) expect(value).toBe(f.deliberationPoison);
    expect(f.damageOnlySourceHit).toBe(f.deliberationSourceHit);
    // Source damage is rounded before the ailment estimate; no exact final 1.2 ratio is promised.
    expect(f.deliberationPoison).not.toBeCloseTo(f.poison * 1.2, 6);
    for (const boundaries of [f.mobility, f.deliberation, f.both]) expect(boundaries).toEqual(f.base);
    expect(f.combinedPoison).toBeGreaterThan(f.deliberationPoison);
    expect(f.combinedSourceHit).toBeLessThan(f.deliberationSourceHit);
    expect(f.combinedMagnitude).toBe(2);
    expect(f.combinedMana).toBe(Math.ceil(f.base.mana * .6));
  });

  it.each(hits)("keeps $skill / $component hits outside the Poison focus", (f) => {
    expect(f.mobilityHit).toBe(f.hit);
    expect(f.deliberationHit).toBeGreaterThan(f.hit);
    expect(f.bothHit).toBe(f.deliberationHit);
  });

  it.each(poisonBowIds)("does not inflate %s's route scores, merge movement preferences or broaden owner/hit scopes", (skill) => {
    const current = settings(skill);
    const selected = setSkillSupport(setSkillSupport(current, "mobility", true), "deliberation", true);
    for (const p of [node("20% increased Movement Speed"), node("20% reduced Movement Speed Penalty from using Skills while moving"),
      node("20% increased Magnitude of Poison you inflict"), node("20% increased Attack Damage"),
      node("Minions have 20% increased Movement Speed", "100% increased Damage with Plant Skills")]) {
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
    }
    expect(passivePreferenceValues(node("20% increased Movement Speed"), selected)).toEqual({ movementSpeed: 20 });
    expect(passivePreferenceValues(node("20% reduced Movement Speed Penalty from using Skills while moving"), selected)).toEqual({ skillMovementPenaltyReduction: 20 });
    expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).passiveStatScopes).toEqual(preset(skill).passiveStatScopes);
    expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).exclusions).toEqual(preset(skill).exclusions);
  });

  it("does not infer Deliberation for older moving skills or change their Mobility explanations", () => {
    expect(reviewedSkillSupports.find((s) => s.id === "deliberation")?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["fireball", "vine-arrow", "entangle", "contagion", "snipers-mark"]) {
      expect(setSkillSupport(settings(skill), "deliberation", true)).toEqual(settings(skill));
      if (skill !== "fireball") expect(reviewedSkillSupportsFor(skill).find((s) => s.id === "mobility")?.summary).not.toContain("Poison-source damage");
    }
    expect(reviewedSkillSupportsFor("vine-arrow").find((s) => s.id === "mobility")?.summary).toContain("Plant lifetime, intrinsic vine-DoT rate");
    expect(reviewedSkillSupportsFor("toxic-growth").some((s) => s.id === "mobility")).toBe(false);
  });
});

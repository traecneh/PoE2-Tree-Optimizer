import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { poisonBowSpeedSupportFixtures as supports, poisonBowSpeedComponents as components, poisonBowSpeedNative as native,
  poisonBowSpeedPoisonFixtures as poison, poisonBowReviewedSupportIdsFor as allowed } from "./poisonBowSpeedSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset,
  setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const preset = (skill: string) => getSkillPreferencePreset(skill)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "attackSpeed", weight: 1 }, { id: "projectileSpeed", weight: 1 }, { id: "poisonMagnitude", weight: 2 }, { id: "poisonDuration", weight: 1 }, { id: "life", weight: 3 }, { id: "fireDamage", weight: 2 }] });

describe("reviewed Poison bow delivery supports", () => {
  it.each(supports)("admits $id with exact identity and contextual notes, not an implicit damage or priority multiplier", (f) => {
    for (const skill of poisonBowIds) {
      const resolved = preCommon45SupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ effectId: resolved.effectId, family: resolved.family, name: resolved.name }).toEqual({ effectId: f.effectId, family: f.family, name: f.name });
      expect(resolved.priorities).toEqual([]);
      expect(resolved.summary).toContain(`${f.amount}% ${f.kind === "attack" ? "increased attack speed" : "more projectile speed"}`);
      expect(resolved.summary.toLowerCase()).toContain("priorities stay unchanged");
      const current = settings(skill);
      const selected = setSkillSupport(current, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
      expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
    }
  });

  it.each(poisonBowIds)("keeps %s's prior utility families, one speed tier and saved priorities/goals/budget", (skill) => {
    expect(preCommon45SupportsFor(skill).map((s) => s.id)).toEqual(allowed(skill));
    let selected = { ...settings(skill), supportGemIds: ["magnified-area-ii", "prolonged-duration-ii", "efficiency-ii"] };
    for (const f of supports) selected = setSkillSupport(selected, f.id, true) as typeof selected;
    const expected = ["magnified-area-ii", "prolonged-duration-ii", "efficiency-ii", "rapid-attacks-ii", "projectile-acceleration-ii"];
    expect(selected).toEqual({ ...settings(skill), supportGemIds: expected });
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    expect(normalizeSkillSupportIds(skill, ["rapid-attacks-ii", "rapid-attacks-i", "projectile-acceleration-ii", "projectile-acceleration-i", null, "__proto__"]))
      .toEqual(["rapid-attacks-ii", "projectile-acceleration-ii"]);
    for (const id of ["projectile-acceleration-iii", "brutality-iv", "unreviewed-swift-affliction", "spell-echo"])
      expect(setSkillSupport(selected, id, true)).toBe(selected);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
  });

  it("independently distinguishes increased attack speed, more projectile speed and Pierce chance from damage conversion", () => {
    expect(native.baseRate * 1.15).toBeCloseTo(native.rapidI);
    expect(native.baseRate * 1.25).toBeCloseTo(native.rapidII);
    expect(native.baseRate * (1 + 1 + .25)).toBeCloseTo(native.increasedAttack100WithII);
    expect(native.increasedAttack100WithII).not.toBeCloseTo(native.baseRate * 2 * 1.25);
    expect(native.projectileBase * 1.4).toBeCloseTo(native.projectileI);
    expect(native.projectileII).toBe(native.projectileI);
    expect(2 * 1.4).toBeCloseTo(native.increasedProjectile100WithII);
    expect(native.nativePierceCountI).toBe(0);
    expect(native.nativePierceCountII).toBe(native.tierIIPierceChance / 100);
    expect(native.speedToDamageConversion).toBe(false);
  });

  it.each(components)("keeps $skill / $component hits, timers and cost per use separate from delivery", (f) => {
    expect(f.rapidMana).toBe(f.mana);
    expect(Math.floor(f.mana * 1.2)).toBe(f.projectileMana);
    expect(Math.ceil(f.projectileMana * .6)).toBe(f.combinedWithEfficiencyII);
    expect(f.supportedHit).toBe(f.hit);
    if ("duration" in f) {
      expect(f.supportedDuration).toBe(f.duration);
      expect(f.supportedPoisonDuration).toBe(f.poisonDuration);
      expect(f.supportedRadius).toBe(f.radius);
      expect(f.projectilePoisonDPS).toBe(f.baselinePoisonDPS);
    }
  });

  it.each(poison)("checks %s's native rate-dependent Poison rolls without turning them into faster ticks or cloud contacts", (f) => {
    expect(f.magnitude).toBe(1);
    expect(f.maxStacks).toBe(1);
    for (const row of f.rows) {
      expect(row.rate * f.duration / f.maxStacks).toBeCloseTo(row.potential);
      expect((row.potential - (f.maxStacks - 1) / 2) / (row.potential + 1) * 100).toBeCloseTo(row.roll);
    }
    expect(f.rows[1].dps).toBeGreaterThan(f.rows[0].dps);
    expect(f.rows[2].dps).toBeGreaterThan(f.rows[1].dps);
  });

  it.each(poisonBowIds)("does not convert %s's speed selections into damage scores, broader hit scopes or guaranteed application", (skill) => {
    const current = settings(skill);
    const p: TreeNode = { id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats: ["10% increased Attack Speed with Bows", "10% reduced Attack Speed",
      "20% increased Projectile Speed", "20% increased Magnitude of Poison you inflict", "Minions deal 100% increased Damage", "100% increased Damage with Plant Skills"] };
    for (const f of supports) {
      const selected = setSkillSupport(current, f.id, true);
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      expect(selected.preferences).toEqual(current.preferences);
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
    }
    const text = (id: string) => preCommon45SupportsFor(skill).find((s) => s.id === id)!.summary;
    expect(text("rapid-attacks-ii")).toContain("not Poison magnitude, tick speed");
    expect(text("rapid-attacks-i")).toContain("Cost per use stays unchanged");
    expect(text("projectile-acceleration-ii")).toContain("40% chance to Pierce, not guaranteed extra bursts, clouds or hits");
    expect(text("projectile-acceleration-i")).not.toContain("40% chance to Pierce");
    expect(text("projectile-acceleration-ii")).toContain("not attack speed or a damage conversion");
    expect(text("projectile-acceleration-ii")).toContain(skill === "gas-arrow" ? "Ground-targeted delivery" : "Initial hits and spreading contacts remain separate");
  });
});

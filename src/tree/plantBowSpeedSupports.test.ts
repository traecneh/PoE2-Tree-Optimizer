import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { plantBowSpeedSupportFixtures as supports, plantBowSpeedComponents as components, plantBowSpeedNative as native,
  plantBowOutgoingPoisonFixtures as outgoingPoison } from "./plantBowSpeedSupports.fixtures";
import { plantBowSupportCompatibility as pairs } from "./plantBowSupports.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset,
  setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const preset = (skill: string) => getSkillPreferencePreset(skill)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "attackSpeed", weight: 1 }, { id: "projectileSpeed", weight: 1 }, { id: "plantDamage", weight: 3 }, { id: "life", weight: 3 }, { id: "poisonMagnitude", weight: 2 }] });

describe("reviewed Plant bow speed supports", () => {
  it.each(supports)("admits $id for both focuses with frozen identity and no implicit priority changes", (f) => {
    for (const { skill } of pairs) {
      const resolved = preCommon45SupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ effectId: resolved.effectId, name: resolved.name, family: resolved.family }).toEqual({ effectId: f.effectId, name: f.name, family: f.family });
      expect(resolved.priorities).toEqual([]);
      expect(resolved.summary).toContain(`${f.amount}% ${f.kind === "attack" ? "increased attack speed" : "more projectile speed"}`);
      expect(resolved.summary).toContain("Priorities stay unchanged");
      const current = settings(skill);
      const selected = setSkillSupport(current, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
      expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
      expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
    }
  });

  it.each(pairs)("retains $skill's independent utility families and one speed tier through saved JSON", ({ skill }) => {
    let selected = { ...settings(skill), supportGemIds: ["magnified-area-ii", "efficiency-ii"] };
    for (const f of supports) selected = setSkillSupport(selected, f.id, true) as typeof selected;
    const expected = ["magnified-area-ii", "efficiency-ii", "rapid-attacks-ii", "projectile-acceleration-ii"];
    expect(selected).toEqual({ ...settings(skill), supportGemIds: expected });
    expect(normalizeSkillSupportIds(skill, ["rapid-attacks-ii", "rapid-attacks-i", "projectile-acceleration-ii", "projectile-acceleration-i", "projectile-acceleration-iii"]))
      .toEqual(["rapid-attacks-ii", "projectile-acceleration-ii"]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    for (const rejected of ["projectile-acceleration-iii", "brutality-i", "spell-echo"]) expect(setSkillSupport(selected, rejected, true)).toBe(selected);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
  });

  it("independently distinguishes additive attack speed, more projectile speed and Pierce from damage conversion", () => {
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

  it.each(components)("keeps $skill / $component damage, timers and per-use cost separate from deployment", (f) => {
    expect(f.rapidMana).toBe(f.mana);
    expect(f.projectileMana).toBeGreaterThan(f.mana);
    expect(f.combinedWithEfficiencyII).toBeLessThan(f.projectileMana);
    if ("hit" in f) expect(f.supportedHit).toBe(f.hit);
    if ("duration" in f) expect(f.supportedDuration).toBe(f.duration);
    if ("intrinsicDoT" in f) expect(f.supportedIntrinsicDoT).toBe(f.intrinsicDoT);
    if ("detonation" in f) expect(f.supportedDetonation).toBe(f.detonation);
    if ("poisonDuration" in f) expect(f.supportedPoisonDuration).toBe(f.poisonDuration);
  });

  it.each(outgoingPoison)("checks $probe's rate-dependent outgoing-Poison roll without inferring supplied Poison or magnitude", (f) => {
    expect(f.rate * f.duration / f.maxStacks).toBeCloseTo(f.potential);
    expect((f.potential - (f.maxStacks - 1) / 2) / (f.potential + 1) * 100).toBeCloseTo(f.rollPercent);
    expect(f.magnitudeEffect).toBe(1);
    if (f.probe !== "baseline") expect(f.dps).toBeGreaterThan(outgoingPoison[0].dps);
  });

  it.each(pairs)("does not turn $skill's selected speed supports into damage scopes, scores or Poison-supply assumptions", ({ skill }) => {
    const current = settings(skill);
    const p: TreeNode = { id: "fixture", position: { x: 0, y: 0 }, flags: {}, stats: ["10% increased Attack Speed with Bows", "10% reduced Attack Speed",
      "12% increased Damage with Plant Skills", "20% increased Projectile Speed", "Minions deal 100% increased Damage", "100% increased Damage with Plant Skills while Overgrown"] };
    for (const f of supports) {
      const selected = setSkillSupport(current, f.id, true);
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      expect(selected.preferences).toEqual(current.preferences);
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).exclusions.map((e) => e.id)).toContain("poisonMagnitude");
    }
    const text = (id: string) => preCommon45SupportsFor(skill).find((s) => s.id === id)!.summary;
    expect(text("rapid-attacks-ii")).toContain(skill === "vine-arrow" ? "not intrinsic vine-DoT rate" : "not the 15-second base detonation timer");
    expect(text("projectile-acceleration-ii")).toContain("40% chance to Pierce, not guaranteed extra hits or plants");
    expect(text("projectile-acceleration-i")).not.toContain("40% chance to Pierce");
    expect(text("projectile-acceleration-ii")).toContain("not attack speed or a damage conversion");
    expect(text("projectile-acceleration-ii")).toContain(skill === "vine-arrow" ? "Non-colliding rain delivery" : "Ground-targeted rain delivery");
  });
});

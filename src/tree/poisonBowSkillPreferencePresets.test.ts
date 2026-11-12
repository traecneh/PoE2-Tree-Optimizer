import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { poisonBowSkillFixtures as fixtures, poisonBowNativeFixtures as native, poisonBowScopes as scopes,
  poisonBowSuggestionIds as suggestions, poisonBowSeparateHitControls as hits } from "./poisonBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSkillSupportIds } from "./skillSupportPreferences";
import { poisonBowReviewedSupportIdsFor } from "./poisonBowSpeedSupports.fixtures";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });

describe("reviewed Poisonburst and Gas Arrow focuses", () => {
  it.each(fixtures)("adds $name with exact identity, tags and reviewed source scopes, not inferred hits or unreviewed supports", (f) => {
    const p = preset(f.id);
    expect({ id: p.id, name: p.name, gemId: p.gemId, tags: p.tags }).toEqual({ id: f.id, name: f.name, gemId: f.gemId, tags: f.tags });
    expect(p.passiveStatScopes).toEqual(scopes);
    expect(p.suggestions.map((s) => s.id)).toEqual(suggestions);
    expect(p.suggestions.find((s) => s.id === "poisonMagnitude")?.weight).toBe(3);
    for (const unsupported of ["criticalChance", "criticalDamageBonus", "accuracy", "poisonChance", "chaosDamage", "damageOverTime", "fireDamage", "plantDamage"])
      expect(p.suggestions.map((s) => s.id)).not.toContain(unsupported);
    expect(preCommon45SupportsFor(f.id).map((s) => s.id)).toEqual(poisonBowReviewedSupportIdsFor(f.id));
    expect(normalizeSkillSupportIds(f.id, ["rapid-attacks-i", "magnified-area-i", "unreviewed-swift-affliction", "concentrated-area", "efficiency-ii"]))
      .toEqual(["rapid-attacks-i", "magnified-area-i", "concentrated-area", "efficiency-ii"]);
    expect(f.noHitPoison).toBe(true);
    expect(f.suppliedPoisonModeled).toBe(false);
  });

  it.each(fixtures)("matches $name's signed Bow/area source modifiers once, not critical, on-hit or elemental scopes", (f) => {
    const context = { focusSkillId: f.id };
    expect(passivePreferenceValues(node("20% increased Damage with Bows", "5% reduced Damage with Bows", "10% increased Attack Speed with Bows",
      "5% reduced Attack Speed with Bows", "10% increased Attack Area Damage", "2% reduced Attack Area Damage", "8% increased Area Damage",
      "10% increased Area of Effect for Attacks", "5% reduced Area of Effect for Attacks", "20% increased Magnitude of Poison you inflict", "5% reduced Magnitude of Poison you inflict"), context))
      .toEqual({ attackDamage: 15, attackSpeed: 5, attackAreaDamage: 8, areaDamage: 8, areaOfEffect: 5, poisonMagnitude: 15 });
    expect(passivePreferenceValues(node("20% increased Critical Hit Chance for Attacks", "20% increased Critical Damage Bonus with Bows", "20% increased Accuracy Rating with Bows",
      "20% increased Elemental Damage with Attacks", "20% increased Spell Area Damage", "Attacks have 20% chance to Maim on Hit", "20% increased Damage with Plant Skills",
      "20% increased Damage with Spears", "20% increased Damage with Two Handed Weapons"), context)).toEqual({});
    for (const line of ["Minions deal 100% increased Damage with Bows", "Companions have 20% increased Area of Effect for Attacks",
      "20% increased Attack Area Damage while Overgrown", "20% increased Damage with Bows per Poison", "20% increased Damage with Bows and Attack Speed"])
      expect(passivePreferenceValues(node(line), context), line).toEqual({});
    const s: PassiveOptimizationSettings = { mode: "weighted", focusSkillId: f.id, extraPointBudget: 3,
      preferences: [{ id: "attackDamage", weight: 2 }, { id: "poisonMagnitude", weight: 3 }] };
    expect(scorePassiveNode(node("20% increased Damage with Bows"), s.preferences, s)).toBe(4);
    expect(scorePassiveNode(node("20% increased Magnitude of Poison you inflict"), s.preferences, s)).toBe(6);
  });

  it.each(fixtures)("preserves $name's manual choices, budgets, goals and saved JSON without silently adopting suggestions", (f) => {
    const current: PassiveOptimizationSettings = { mode: "weighted", focusSkillId: f.id, extraPointBudget: 7, pointBudgetMode: "all-available",
      preferences: [{ id: "poisonMagnitude", weight: 1 }, { id: "fireDamage", weight: 2 }, { id: "criticalChance", weight: 1 }, { id: "life", weight: 3 }] };
    const added = addSkillPresetPreferences(current, preset(f.id));
    expect(added.preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    expect(addSkillPresetPreferences(added, preset(f.id))).toEqual(added);
    expect(normalizePassiveOptimizationSettings(added)).toEqual(added);
    expect(added.extraPointBudget).toBe(7);
    expect(added.pointBudgetMode).toBe("all-available");
    expect(preset(f.id).exclusions.map((e) => e.id)).toEqual(expect.arrayContaining(["fireDamage", "criticalChance", "chaosDamage", "damageOverTime", "poisonChance", "plantDamage"]));
    const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: added,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(added);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
  });

  it.each(native)("independently checks $skill's magnitude, weapon source and timer/deployment boundaries", (f) => {
    expect(f.poison * 1.2).toBeCloseTo(f.magnitude20);
    expect(f.poison * .8).toBeCloseTo(f.reducedMagnitude20);
    expect(f.hitMagnitude20).toBe(f.hit);
    for (const value of [f.attack20, f.bow20, f.physical20, f.projectile20, f.area20]) expect(value).toBe(f.generic20);
    expect(f.generic20).toBeGreaterThan(f.poison);
    for (const value of [f.chaos20, f.dot20, f.fire20, f.minion100, f.plant100, f.spell20]) expect(value).toBe(f.poison);
    expect(f.chance20).toBe(f.poisonChance);
    expect(f.poisonChance).toBe(100);
    expect(f.poisonDuration * 1.2).toBeCloseTo(f.poisonDuration20);
    expect(f.poison20SkillDuration).toBe(f.duration);
    expect(Math.floor(f.radius * Math.sqrt(1.2))).toBe(f.area20Radius);
    expect(f.attackArea20Radius).toBe(f.area20Radius);
    expect(f.deployRate * 1.2).toBeCloseTo(f.attackSpeed20);
    expect(f.bowSpeed20).toBe(f.attackSpeed20);
    // Rate-dependent native roll selection is not faster Poison ticks or supplied-Poison magnitude.
    expect(f.poisonAttackSpeed20).toBeGreaterThan(f.poison);
  });

  it("keeps Poisonburst's linked Poison duration distinct from Gas Arrow's cloud lifetime", () => {
    const [burst, gas] = native;
    expect(fixtures[0].poisonUsesSkillDuration).toBe(true);
    expect(fixtures[1].poisonUsesSkillDuration).toBe(false);
    expect(burst.skill20PoisonDuration).toBe(burst.poisonDuration20);
    expect(gas.skill20PoisonDuration).toBe(gas.poisonDuration);
    expect(Math.ceil(fixtures[0].sourceDuration * 1.2 / .033) * .033).toBeCloseTo(burst.skillDuration20);
    expect(Math.ceil(fixtures[1].sourceDuration * 1.2 / .033) * .033).toBeCloseTo(gas.skillDuration20);
    expect(preset("poisonburst-arrow").suggestions.find((s) => s.id === "skillDuration")?.reason).toContain("poison_duration_is_skill_duration");
    expect(preset("gas-arrow").suggestions.find((s) => s.id === "skillDuration")?.reason).toContain("outgoing Poison duration unchanged");
  });

  it("keeps real arrows, conditional Fire explosion and fake no-hit Poison source fields separate", () => {
    expect(hits.poisonburstArrowHitPhysical20).toBeGreaterThan(hits.poisonburstArrowHit);
    expect(hits.gasArrowHitPhysical20).toBeGreaterThan(hits.gasArrowHit);
    expect(hits.poisonburstArrowPoisonsByDefault).toBe(false);
    expect(hits.gasArrowPoisonsByDefault).toBe(false);
    expect(hits.gasExplosionPoisonsByDefault).toBe(false);
    expect(hits.gasExplosionPhysicalHit).toBe(0);
    expect(hits.gasExplosionFireHit).toBeGreaterThan(0);
    expect(hits.gasExplosionHitFire20).toBeGreaterThan(hits.gasExplosionHit);
    expect(preset("gas-arrow").exclusions.find((e) => e.id === "fireDamage")?.reason).toContain("Detonator skill or an Ignited enemy");
    expect(preset("gas-arrow").exclusions.find((e) => e.id === "criticalChance")?.reason).toContain("fake-hit critical fields");
    expect(preset("poisonburst-arrow").exclusions.find((e) => e.id === "accuracy")?.reason).toContain("initial arrow connect");
    for (const f of fixtures) {
      const selected = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset(f.id));
      expect(scorePassiveNode(node("100% increased Fire Damage", "100% increased Chaos Damage", "100% increased Damage over Time", "100% increased Critical Hit Chance",
        "Minions deal 100% increased Damage", "100% increased Damage with Plant Skills"), selected.preferences, selected)).toBe(0);
    }
  });

  it.each(fixtures)("retains required goals and shared point accounting for $name without inventing cloud or Poison multipliers", (f) => {
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "poison", "bridge"].map((id) => [id, { ...node(), id,
        stats: id === "poison" ? ["20% increased Magnitude of Poison you inflict"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: [["start", "plain"], ["plain", "goal"], ["start", "poison"], ["poison", "bridge"], ["bridge", "goal"]].map(([from, to]) => ({ from, to })),
      groups: {}, classStarts: { ranger: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, focusSkillId: f.id, preferences: [{ id: "poisonMagnitude" as const, weight: 3 }], extraPointBudget: 1,
      baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
    const weighted = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(weighted.totalNodeIds).toEqual(expect.arrayContaining(["start", "poison", "goal"]));
    expect(weighted.pointCost).toBe(3);
    expect(weighted.weighted?.score).toBe(6);
    expect(runOptimizerRequest({ ...request, mode: "shortest" as const }).pointCost).toBe(2);
    expect(optimizeWeightedBuildGoals({ ...request, totalPointLimit: 2 }, undefined, { maxIterations: 8 }).pointCost).toBe(2);
  });
});

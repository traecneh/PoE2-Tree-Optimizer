import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { plantBowSkillFixtures as fixtures, plantBowNativeFixture as native } from "./plantBowSkills.fixtures";
import { plantBowSupportCompatibility } from "./plantBowSupports.fixtures";
import { plantDamageNodeIds } from "./plantSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSkillSupportIds } from "./skillSupportPreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });

describe("reviewed Plant bow skill focuses", () => {
  it.each(fixtures)("adds $name with frozen identity, tags and exact component scopes, not inferred supports", (f) => {
    const p = preset(f.id);
    expect({ id: p.id, name: p.name, gemId: p.gemId, tags: p.tags }).toEqual({ id: f.id, name: f.name, gemId: f.gemId, tags: f.tags });
    expect(p.passiveStatScopes).toEqual(f.scopes);
    expect(p.suggestions.map((s) => s.id)).toEqual(f.suggestions);
    expect(p.suggestions.some((s) => ["poisonChance", "poisonMagnitude", "poisonDuration", "criticalChance", "criticalDamageBonus"].includes(s.id))).toBe(false);
    expect(preCommon45SupportsFor(f.id).map((s) => s.id)).toEqual(plantBowSupportCompatibility.find((p) => p.skill === f.id)!.allowed);
    expect(normalizeSkillSupportIds(f.id, ["projectile-acceleration-iii", "brutality-i", "unreviewed-swift-affliction"])).toEqual([]);
    expect(f.suppliedPoisonModeled).toBe(false);
  });

  it("keeps Vine Arrow's DoT matching distinct from bow hit damage and critical/application effects", () => {
    const context = { focusSkillId: "vine-arrow" };
    expect(passivePreferenceValues(node("12% increased Damage with Plant Skills", "10% reduced Damage with Plant Skills", "15% increased Chaos Damage",
      "10% increased Damage over Time", "10% increased Attack Speed with Bows", "5% reduced Attack Speed with Bows", "8% increased Area of Effect for Attacks"), context))
      .toEqual({ plantDamage: 2, chaosDamage: 15, damageOverTime: 10, attackSpeed: 5, areaOfEffect: 8 });
    expect(passivePreferenceValues(node("20% increased Damage with Bows", "20% increased Damage with Two Handed Weapons", "20% increased Critical Hit Chance for Attacks",
      "20% increased Critical Damage Bonus with Bows", "20% increased Accuracy Rating with Bows", "20% increased Attack Area Damage", "20% increased Area Damage",
      "Attacks have 20% chance to Maim on Hit", "20% chance to Hinder Enemies on Hit with Spells"), context)).toEqual({});
    const exclusions = preset("vine-arrow").exclusions.map((e) => e.id);
    expect(exclusions).toEqual(expect.arrayContaining(["attackDamage", "projectileDamage", "criticalChance", "criticalDamageBonus", "poisonChance", "poisonMagnitude", "poisonDuration"]));
  });

  it("admits Toxic Growth's reviewed attack/weapon modifiers once without transferring them to plant DoT", () => {
    const context = { focusSkillId: "toxic-growth" };
    expect(passivePreferenceValues(node("12% increased Damage with Plant Skills", "10% increased Damage with Bows", "5% reduced Damage with Two Handed Weapons",
      "10% increased Attack Speed with Bows", "20% increased Accuracy Rating with Bows", "15% increased Critical Damage Bonus with Bows",
      "5% reduced Critical Damage Bonus for Attack Damage", "10% increased Critical Hit Chance for Attacks", "8% increased Attack Area Damage", "5% reduced Area Damage",
      "10% increased Area of Effect for Attacks"), context)).toEqual({ plantDamage: 12, attackDamage: 5, attackSpeed: 10, accuracy: 20,
        criticalDamageBonus: 10, criticalChance: 10, attackAreaDamage: 8, areaDamage: -5, areaOfEffect: 10 });
    expect(passivePreferenceValues(node("20% increased Spell Area Damage", "20% increased Critical Hit Chance for Spells", "20% increased Critical Spell Damage Bonus",
      "20% increased Elemental Damage with Attacks", "20% increased Damage with Spears"), context)).toEqual({});
    const exclusions = preset("toxic-growth").exclusions.map((e) => e.id);
    expect(exclusions).toEqual(expect.arrayContaining(["chaosDamage", "damageOverTime", "skillDuration", "poisonChance", "poisonMagnitude", "poisonDuration"]));
    expect(preset("toxic-growth").exclusions.find((e) => e.id === "poisonChance")?.reason).toContain("100%");
  });

  it.each(fixtures)("preserves $name's manual Poison/defensive priorities and budgets through suggestions and saved JSON", (f) => {
    const current: PassiveOptimizationSettings = { mode: "weighted", focusSkillId: f.id, extraPointBudget: 7, pointBudgetMode: "all-available",
      preferences: [{ id: "life", weight: 3 }, { id: "poisonMagnitude", weight: 2 }, { id: "poisonDuration", weight: 1 }, { id: "plantDamage", weight: 1 }] };
    const selected = addSkillPresetPreferences(current, preset(f.id));
    expect(selected.preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    expect(selected.extraPointBudget).toBe(7);
    expect(selected.pointBudgetMode).toBe("all-available");
    expect(addSkillPresetPreferences(selected, preset(f.id))).toEqual(selected);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    expect(passivePreferenceValues(node("20% increased Magnitude of Poison you inflict"), selected)).toEqual({ poisonMagnitude: 20 });
    const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))[0].state.optimizerSettings).toEqual(selected);
  });

  it.each(fixtures)("keeps $name's owner, condition and composite boundaries and all eight real Plant nodes", (f) => {
    const context = { focusSkillId: f.id };
    for (const line of ["Minions deal 100% increased Damage with Plant Skills", "20% increased Damage with Plant Skills while Overgrown",
      "20% increased Damage with Plant Skills per Poison", "20% increased Damage with Plant Skills and Area of Effect"])
      expect(passivePreferenceValues(node(line), context), line).toEqual({});
    const minion = node("Minions deal 100% increased Damage");
    expect(scorePassiveNode(minion, [{ id: "plantDamage", weight: 3 }, { id: "attackDamage", weight: 3 }], context)).toBe(0);
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    expect(Object.values(graph.nodes).filter((n) => Object.hasOwn(passivePreferenceValues(n, context), "plantDamage")).map((n) => n.id).sort()).toEqual([...plantDamageNodeIds].sort());
    expect(scorePassiveNode(node("12% increased Damage with Plant Skills"), [{ id: "plantDamage", weight: 3 }], context)).toBeCloseTo(3.6);
  });

  it("independently checks intrinsic Chaos DoT scaling, deployment speed and lifetime without assuming Poison feed", () => {
    expect(fixtures[0].intrinsicChaosPerMinute / 60).toBeCloseTo(native.vineDot);
    for (const value of [native.plant20Dot, native.generic20Dot, native.chaos20Dot, native.dot20Dot]) expect(value).toBeCloseTo(native.vineDot * 1.2);
    expect(native.reducedPlant20Dot).toBeCloseTo(native.vineDot * 0.8);
    for (const value of [native.attack20Dot, native.projectile20Dot, native.bow20Dot, native.spell20Dot, native.area20Dot, native.poisonMagnitude20Dot, native.minion100Dot]) expect(value).toBe(native.vineDot);
    expect(native.bowSpeed20Rate).toBeCloseTo(native.deployRate * 1.2);
    expect(Math.ceil(8 * 1.2 / 0.033) * 0.033).toBeCloseTo(native.duration20);
    expect(Math.floor(native.vineRadius * Math.sqrt(1.2))).toBe(native.attackArea20Radius);
  });

  it("checks attack hit modifiers and outgoing Poison separately from stored-Poison detonation", () => {
    for (const value of [native.toxicPlant20Hit, native.toxicAttack20Hit, native.toxicProjectile20Hit, native.toxicBow20Hit, native.toxicArea20Hit, native.toxicPhysical20Hit]) expect(value).toBe(native.toxicGeneric20Hit);
    expect(native.toxicPlant20Hit).toBeGreaterThan(native.toxicExplosionHit);
    expect(native.toxicReducedPlant20Hit).toBeLessThan(native.toxicExplosionHit);
    for (const value of [native.toxicChaos20Hit, native.toxicDot20Hit, native.toxicSpell20Hit, native.toxicPoisonMagnitude20Hit, native.toxicMinion100Hit]) expect(value).toBe(native.toxicExplosionHit);
    expect(native.toxicPoisonMagnitude20).toBeCloseTo(native.toxicOutgoingPoison * 1.2);
    expect(native.toxicPoisonDuration20).toBeCloseTo(native.toxicBasePoisonDuration * 1.2);
    expect(native.toxicSkillDuration20Detonation).toBe(native.toxicDetonation);
    expect(native.toxicPoisonDuration20Detonation).toBe(native.toxicDetonation);
  });

  it.each(fixtures)("retains required goals and Shortest costs with $name's optional Plant detour", (f) => {
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "plant", "bridge"].map((id) => [id, { ...node(), id,
        stats: id === "plant" ? ["20% increased Damage with Plant Skills"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: [["start", "plain"], ["plain", "goal"], ["start", "plant"], ["plant", "bridge"], ["bridge", "goal"]].map(([from, to]) => ({ from, to })),
      groups: {}, classStarts: { ranger: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, focusSkillId: f.id, preferences: [{ id: "plantDamage" as const, weight: 3 }], extraPointBudget: 1,
      baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
    const weighted = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(weighted.totalNodeIds).toEqual(expect.arrayContaining(["start", "plant", "goal"]));
    expect(weighted.pointCost).toBe(3);
    expect(weighted.weighted?.score).toBe(6);
    const supported = optimizeWeightedBuildGoals({ ...request, supportGemIds: ["magnified-area-ii", "prolonged-duration-ii", "efficiency-ii", "mobility", "rapid-attacks-ii", "projectile-acceleration-ii"] }, undefined, { maxIterations: 8 });
    expect(supported.totalNodeIds).toEqual(weighted.totalNodeIds);
    expect(supported.pointCost).toBe(weighted.pointCost);
    expect(supported.weighted?.score).toBe(weighted.weighted?.score);
    const shortest = { ...request, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
    expect(runOptimizerRequest({ ...shortest, supportGemIds: ["rapid-attacks-ii", "projectile-acceleration-ii", "efficiency-ii"] }).totalNodeIds).toEqual(runOptimizerRequest(shortest).totalNodeIds);
  });
});

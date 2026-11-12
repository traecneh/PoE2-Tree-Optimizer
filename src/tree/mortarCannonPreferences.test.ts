import { describe, expect, it } from "vitest";
import { mortarGrenadeFixtures as fixtures, mortarNativeFixture as native } from "./mortarCannon.fixtures";
import { mortarCannonGrenades, normalizeSocketedGrenadeId } from "./mortarCannonPreferences";
import { addSkillPresetPreferences, getSkillPreferencePreset, resolveSkillPreferencePreset } from "./skillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassivePreference } from "./passivePreferences";
import { normalizeSkillSupportIds } from "./skillSupportPreferences";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { validationRequest } from "./buildGoalsValidation.fixtures";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const context = (socketedGrenadeId: string) => ({ focusSkillId: "mortar-cannon", socketedGrenadeId });

describe("Mortar Cannon socketed Grenade context", () => {
  it("offers exactly the six explicitly reviewed compatible Grenades without an implicit default", () => {
    expect(mortarCannonGrenades.map(({ id, name }) => ({ id, name }))).toEqual(fixtures.map(({ id, name }) => ({ id, name })));
    expect(getSkillPreferencePreset("mortar-cannon")).toMatchObject({ gemId: "Metadata/Items/Gems/SkillGemMortarCannon", suggestions: [], passiveStatScopes: [] });
    for (const socketedGrenadeId of [undefined, "", "MetaMortarCannonPlayer", "mortar-cannon", "crossbow-shot", "spark", "__proto__", 1, {}]) {
      expect(normalizeSocketedGrenadeId("mortar-cannon", socketedGrenadeId)).toBeUndefined();
    }
    expect(normalizeSocketedGrenadeId("spark", "explosive-grenade")).toBeUndefined();
    expect(normalizeSocketedGrenadeId("Mortar Cannon", "explosive-grenade")).toBeUndefined();
  });

  it.each(fixtures)("uses $name's reviewed hit scope and separate Totem utility, without inferring new supports", (f) => {
    const c = context(f.id);
    const p = resolveSkillPreferencePreset(c)!;
    const ids = p.suggestions.map((s) => s.id);
    expect(p.id).toBe("mortar-cannon");
    expect(p.description).toContain(f.name);
    expect(p.description.split(/\s+/).length).toBeLessThanOrEqual(40);
    expect(ids).toEqual(expect.arrayContaining(["totemDamage", "totemAttackSpeed", "totemPlacementSpeed", "totemLife", "totemDuration", "totemAreaOfEffect",
      "attackDamage", "attackSpeed", "projectileDamage", "attackAreaDamage", "cooldownRecoveryRate", f.damage]));
    expect(p.passiveStatScopes).toEqual(expect.arrayContaining(["grenadeDamage", "grenadeCooldownRecovery", "grenadeAreaOfEffect", "crossbowAttackDamage", "attackAreaDamage"]));
    expect(p.passiveStatScopes?.includes("attackElementalDamage")).toBe(f.damage !== "physicalDamage");
    for (const id of ["minionDamage", "minionSpeed", "castSpeed", "totemCastSpeed", "skillDuration", "criticalChance", "accuracy"]) expect(ids).not.toContain(id);
    for (const scope of ["attackBlindChance", "attackMaimChance", "attackIncisionChance"]) expect(p.passiveStatScopes).not.toContain(scope);
    expect(normalizeSkillSupportIds("mortar-cannon", ["magnified-area-i", "prolonged-duration-i", "rapid-attacks-i"])).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(p.exclusions.some((e) => ids.includes(e.id))).toBe(false);
  });

  it.each(fixtures)("scores $name's modifier sources once, keeping placement/player/minion owners separate", (f) => {
    const c = context(f.id);
    const p = node("20% increased Totem Damage", "10% increased Attack Damage", "5% increased Damage with Crossbows", "5% increased Grenade Damage",
      "Attacks used by Totems have 6% increased Attack Speed", "3% increased Attack Speed", "10% increased Totem Placement speed",
      "10% increased Cooldown Recovery Rate", "10% increased Cooldown Recovery Rate for Grenade Skills", "10% increased Totem Life", "10% increased maximum Life");
    expect(passivePreferenceValues(p, c)).toEqual({ totemDamage: 20, attackDamage: 20, totemAttackSpeed: 6, attackSpeed: 3,
      totemPlacementSpeed: 10, cooldownRecoveryRate: 20, totemLife: 10, life: 10 });
    const weights: PassivePreference[] = ["totemDamage", "attackDamage", "totemAttackSpeed", "attackSpeed", "totemPlacementSpeed", "totemLife"]
      .map((id) => ({ id: id as PassivePreference["id"], weight: 1 }));
    expect(scorePassiveNode(p, weights, c)).toBe(9); // 2 + 2 + 2 + 1 + 1 + 1; no duplicated damage/speed sources.
    expect(scorePassiveNode(node("10% increased maximum Life"), [{ id: "totemLife", weight: 3 }], c)).toBe(0);
    expect(scorePassiveNode(node("10% increased Totem Life"), [{ id: "life", weight: 3 }], c)).toBe(0);
    const settings = addSkillPresetPreferences({ ...c, mode: "weighted", extraPointBudget: 2, preferences: [] }, getSkillPreferencePreset("mortar-cannon")!);
    expect(scorePassiveNode(node("Minions deal 100% increased Damage", "100% increased maximum Life", "Spells Cast by Totems have 100% increased Cast Speed",
      "100% increased Cast Speed", "Companions deal 100% increased Damage", "100% increased Skill Effect Duration"), settings.preferences, c)).toBe(0);
    expect(passivePreferenceValues(node("10% increased Grenade Damage per Charge", "10% increased Totem Damage while stationary",
      "Minions have 10% increased Grenade Damage", "Attacks have 10% chance to Maim on Hit", "10% chance for Attack Hits to apply Incision"), c)).toEqual({});
    expect(passivePreferenceValues(node("5% reduced Grenade Damage", "3% reduced Attack Speed with Crossbows", "4% reduced Totem Damage",
      "Attacks used by Totems have 3% reduced Attack Speed"), c)).toEqual({ attackDamage: -5, attackSpeed: -3, totemDamage: -4, totemAttackSpeed: -3 });
  });

  it("keeps Gas/Oil physical impact, Flash control and Voltaic Lightning separate", () => {
    for (const id of ["gas-grenade", "oil-grenade"]) {
      const p = resolveSkillPreferencePreset(context(id))!;
      expect(p.description).toContain("Only physical impact hits");
      for (const effect of ["fireDamage", "chaosDamage", "damageOverTime", "igniteMagnitude", "poisonMagnitude"]) expect(p.suggestions.some((s) => s.id === effect)).toBe(false);
    }
    expect(resolveSkillPreferencePreset(context("flash-grenade"))!.suggestions.map((s) => s.id)).toEqual(expect.arrayContaining(["stunBuildup", "blindEffect", "blindDuration"]));
    expect(resolveSkillPreferencePreset(context("voltaic-grenade"))!.suggestions.some((s) => s.id === "fireDamage")).toBe(false);
  });

  it("keeps native speed, cooldown and lifetime mechanics separate from passive preference arithmetic", () => {
    expect(native.addedTypes).toEqual(["UsedByTotem", "UsedByProxy", "SupportedByMortarTotem"]);
    expect(native.durationMs).toBe(8000);
    expect(native.moreDamage).toBe(-50);
    expect(native.moreAttackSpeed).toBe(-50);
    expect(native.explosive.cooldown).toBe(5 / (1 + native.increasedGrenadeCooldownRecovery / 100));
    expect(native.explosive.cooldownWith20Recovery).toBeCloseTo(5 / 2.2);
    expect(passivePreferenceValues(node("20% increased Cooldown Recovery Rate for Grenade Skills"), context("explosive-grenade"))).toEqual({ cooldownRecoveryRate: 20 });
    expect(scorePassiveNode(node("20% increased Totem Damage"), [{ id: "totemDamage", weight: 1 }], context("explosive-grenade"))).toBe(2);
  });

  it.each(fixtures)("retains $name through normalization and saved JSON without overwriting priorities or budgets", (f) => {
    const current = { ...context(f.id), mode: "weighted" as const, extraPointBudget: 7, pointBudgetMode: "all-available" as const,
      preferences: [{ id: "life" as const, weight: 3 }, { id: "totemLife" as const, weight: 2 }, { id: "attackDamage" as const, weight: 1 }] };
    const settings = addSkillPresetPreferences(current, getSkillPreferencePreset("mortar-cannon")!);
    expect(settings.preferences.slice(0, 3)).toEqual(current.preferences);
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "mercenary", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: settings,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(saved.state.optimizerSettings).toEqual(settings);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    expect(normalizePassiveOptimizationSettings({ ...settings, focusSkillId: "spark" })).not.toHaveProperty("socketedGrenadeId");
    expect(normalizePassiveOptimizationSettings({ ...settings, socketedGrenadeId: "spark" })).not.toHaveProperty("socketedGrenadeId");
  });

  it("rejects missing, malformed and incompatible Grenades in weighted requests, not Shortest", () => {
    const request = { ...validationRequest(), ...context("explosive-grenade"), mode: "weighted" as const, preferences: [{ id: "totemDamage" as const, weight: 1 }], extraPointBudget: 1 };
    for (const socketedGrenadeId of [undefined, "", "spark", "mortar-cannon", "__proto__", 2, {}]) {
      const invalid = { ...request, socketedGrenadeId } as typeof request;
      expect(createBuildGoalsValidation(invalid).issues).toContainEqual(expect.objectContaining({ code: "socketed-grenade" }));
      expect(optimizeWeightedBuildGoals(invalid, undefined, { maxIterations: 1 }).status).toBe("error");
      const shortest = { ...invalid, mode: "shortest" as const };
      expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(validationRequest()));
    }
    expect(createBuildGoalsValidation(request).issues).toEqual([]);
    expect(createBuildGoalsValidation({ ...request, focusSkillId: "spark" }).issues).toContainEqual(expect.objectContaining({ code: "socketed-grenade" }));
  });

  it.each(["explosive-grenade", "voltaic-grenade"])("passes %s context into route scoring, preserving point limits and Shortest", (socketedGrenadeId) => {
    const edges = [["start", "plain"], ["plain", "goal"], ["start", "fire"], ["fire", "bridge"], ["bridge", "goal"], ["start", "lightning"], ["lightning", "bridge"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "fire", "lightning", "bridge"].map((id) => [id, { ...node(), id,
        stats: id === "fire" ? ["20% increased Fire Damage"] : id === "lightning" ? ["20% increased Lightning Damage"] : [],
        flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from, to]) => ({ from, to })), groups: {}, classStarts: { mercenary: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const settings = addSkillPresetPreferences({ ...context(socketedGrenadeId), mode: "weighted", extraPointBudget: 1, preferences: [] }, getSkillPreferencePreset("mortar-cannon")!);
    const request = { ...settings, graph, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(result.status).toBe("success");
    expect(result.totalNodeIds).toContain(socketedGrenadeId === "explosive-grenade" ? "fire" : "lightning");
    expect(result.totalNodeIds).not.toContain(socketedGrenadeId === "explosive-grenade" ? "lightning" : "fire");
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(6);
    expect(runOptimizerRequest({ ...request, mode: "shortest" })).toMatchObject(optimizeBuildGoals({ ...request, mode: "shortest" }));
  });
});

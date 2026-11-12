import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { normalizeSkillSupportIds } from "./skillSupportPreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const ids = ["galvanic-shards", "explosive-shot", "explosive-grenade", "rake", "maul", "shred"];
const crossbows = ids.slice(0, 3);
const node = (...stats: string[]): TreeNode => ({ id: "node", stats, flags: {}, position: { x: 0, y: 0 } });
const preset = (id: string) => getSkillPreferencePreset(id)!;

describe("crossbow, spear and shapeshift hit presets", () => {
  it.each(ids)("preserves manual priorities and point settings for %s through save and export", (focusSkillId) => {
    const settings = { mode: "weighted" as const, extraPointBudget: 6, pointBudgetMode: "all-available" as const,
      preferences: [{ id: "energyShield" as const, weight: 3 }, { id: "attackDamage" as const, weight: 1 }] };
    const added = addSkillPresetPreferences(settings, preset(focusSkillId));
    expect(added.preferences.slice(0, 2)).toEqual(settings.preferences);
    expect(added).toMatchObject({ focusSkillId, extraPointBudget: 6, pointBudgetMode: "all-available" });
    expect(normalizePassiveOptimizationSettings(added)).toEqual(added);
    expect(added.preferences.some((p) => ["criticalChance", "criticalDamageBonus", "accuracy"].includes(p.id))).toBe(false);
    expect(normalizeSkillSupportIds(focusSkillId, ["controlled-destruction", "rapid-attacks-i", "concentrated-area", "heavy-swing"])).toEqual([]);
    const [saved] = normalizeSavedBuilds([{ id: focusSkillId, name: focusSkillId, createdAt: "test", updatedAt: "test",
      state: { allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
        selectedClassStartId: "mercenary", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: added } }]);
    expect(saved.state.optimizerSettings).toEqual(added);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
  });

  it.each(crossbows)("scopes %s to crossbow/attack bonuses, not bows, melee or spells", (focusSkillId) => {
    expect(passivePreferenceValues(node("12% increased Damage with Crossbows", "15% reduced Attack Speed with Crossbows",
      "10% increased Critical Hit Chance with Crossbows", "80% increased Critical Damage Bonus with Crossbows",
      "12.5% increased Accuracy Rating with Crossbows", "5% reduced Accuracy Rating with Crossbows",
      "100% increased Damage with Bows", "100% increased Melee Damage", "100% increased Critical Hit Chance for Spells"), { focusSkillId }))
      .toEqual({ attackDamage: 12, attackSpeed: -15, criticalChance: 10, criticalDamageBonus: 80, accuracy: 7.5 });
    expect(passivePreferenceValues(node("40% increased Crossbow Reload Speed", "15% reduced Grenade Detonation Time"), { focusSkillId })).toEqual({crossbowReloadSpeed:40});
  });

  it("adds Grenade damage, coverage and recharge sources once, retaining damage penalties", () => {
    const passive = node("10% increased Attack Damage", "20% increased Damage with Crossbows", "12% increased Grenade Damage", "80% reduced Grenade Damage",
      "10% increased Area of Effect", "15% increased Area of Effect for Attacks", "10% increased Grenade Area of Effect", "5% reduced Grenade Area of Effect",
      "20% increased Cooldown Recovery Rate", "40% increased Cooldown Recovery Rate for Grenade Skills");
    const context = { focusSkillId: "explosive-grenade" };
    expect(passivePreferenceValues(passive, context)).toEqual({ attackDamage: -38, areaOfEffect: 30, cooldownRecoveryRate: 60 });
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }], context)).toBeCloseTo(-11.4);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    for (const focusSkillId of [undefined, "explosive-shot", "galvanic-shards", "fireball", "shred", "rake"]) {
      expect(passivePreferenceValues(node("12% increased Grenade Damage", "10% increased Grenade Area of Effect",
        "40% increased Cooldown Recovery Rate for Grenade Skills"), { focusSkillId })).toEqual({});
    }
  });

  it.each([["Grenade Damage", "attackDamage"], ["Grenade Area of Effect", "areaOfEffect"],
    ["Cooldown Recovery Rate for Grenade Skills", "cooldownRecoveryRate"]] as const)("retains signed decimals and zero for %s", (wording, id) => {
    const context = { focusSkillId: "explosive-grenade" };
    expect(passivePreferenceValues(node(`12.5% increased ${wording}`, `20% reduced ${wording}`), context)).toEqual({ [id]: -7.5 });
    expect(passivePreferenceValues(node(`0% increased ${wording}`), context)).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`), context)).toEqual({ [id]: 0 });
  });

  it.each(["Grenade Damage", "Grenade Area of Effect", "Cooldown Recovery Rate for Grenade Skills", "Damage with Crossbows"])("rejects foreign owners and conditional/malformed %s", (wording) => {
    for (const line of [`Minions deal 10% increased ${wording}`, `Totems have 10% increased ${wording}`, `Companions have 10% increased ${wording}`,
      `10% increased ${wording} if you've Reloaded Recently`, `10% increased ${wording} while Shapeshifted`, `10% increased ${wording} per Charge`,
      `10% more ${wording}`, `+10% increased ${wording}`, `1.2.3% increased ${wording}`, `10% increased ${wording} and Attack Speed`]) {
      expect(passivePreferenceValues(node(line), { focusSkillId: "explosive-grenade" }), line).toEqual({});
    }
  });

  it("does not infer area damage for Galvanic beams or projectile/cold damage for Shred's base strikes", () => {
    expect(preset("galvanic-shards").passiveStatScopes).not.toContain("attackAreaDamage");
    expect(passivePreferenceValues(node("20% increased Attack Area Damage"), { focusSkillId: "galvanic-shards" })).toEqual({});
    expect(preset("shred").tags).toEqual(expect.arrayContaining(["cold", "projectile"]));
    for (const id of ["coldDamage", "projectileDamage"]) expect(preset("shred").suggestions.map((p) => p.id)).not.toContain(id);
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset("shred"));
    expect(scorePassiveNode(node("100% increased Cold Damage", "100% increased Projectile Damage", "Minions deal 100% increased Damage"), settings.preferences, { focusSkillId: "shred" })).toBe(0);
    expect(preset("explosive-shot").suggestions.find((s) => s.id === "attackAreaDamage")?.reason).toContain("Explosion only");
  });

  it.each(["maul", "shred"])("keeps %s's player/form scope distinct from claw weapons and companion/minion ownership", (focusSkillId) => {
    expect(preset(focusSkillId).tags).toContain("shapeshift");
    expect(passivePreferenceValues(node("10% increased Melee Damage", "10% increased Critical Hit Chance for Attacks", "20% increased Attack Area Damage"), { focusSkillId }))
      .toEqual({ attackDamage: 10, criticalChance: 10, attackAreaDamage: 20 });
    expect(passivePreferenceValues(node("100% increased Damage with Claws", "100% increased Damage with Spears", "100% increased Damage with Two Handed Weapons",
      "Minions deal 100% increased Damage", "Companions deal 100% increased Damage", "20% increased Critical Hit Chance while Shapeshifted"), { focusSkillId }))
      .toEqual({ minionDamage: 100, companionDamage: 100 });
    const effects = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset(focusSkillId)).preferences;
    expect(scorePassiveNode(node("Minions deal 100% increased Damage", "Companions deal 100% increased Damage"), effects, { focusSkillId })).toBe(0);
  });

  it("classifies Rake as a spear hit focus rather than a shapeshift or automatic Bleeding calculation", () => {
    expect(preset("rake").tags).not.toContain("shapeshift");
    expect(preset("rake").passiveStatScopes).toContain("spearAttackDamage");
    expect(preset("rake").description).toContain("not a shapeshift");
    expect(preset("rake").suggestions.map((s) => s.id)).not.toContain("damageOverTime");
    expect(passivePreferenceValues(node("10% increased Melee Damage", "20% increased Damage with Spears"), { focusSkillId: "rake" })).toEqual({ attackDamage: 30 });
  });

  it.each(ids)("routes %s toward relevant hits within budget while leaving Shortest unchanged", (focusSkillId) => {
    const edges = [["start", "plain"], ["plain", "goal"], ["start", "useful"], ["useful", "bridge"], ["bridge", "goal"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "useful", "bridge"].map((id) => [id, { ...node(), id,
        stats: id === "useful" ? [crossbows.includes(focusSkillId) ? "20% increased Damage with Crossbows" : "20% increased Melee Damage"] : [],
        flags: id === "start" ? { classStart: true } : {} }])), edges: edges.map(([from, to]) => ({ from, to })),
      groups: {}, classStarts: { witch: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"],
      focusSkillId, preferences: [{ id: "attackDamage" as const, weight: 1 }], extraPointBudget: 1 };
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(result.status).toBe("success");
    expect(result.pointCost).toBe(3);
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(["start", "useful", "goal"]));
    expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.maxPointCost).toBe(3);
    const shortest = { ...request, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

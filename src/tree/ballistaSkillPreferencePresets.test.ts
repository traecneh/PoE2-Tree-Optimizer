import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ballistaSkillFixtures as fixtures } from "./ballistaSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { normalizeSkillSupportIds } from "./skillSupportPreferences";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const preset = (id: string) => getSkillPreferencePreset(id)!;

describe("reviewed Ballista Totem focuses", () => {
  it.each(fixtures)("matches $name's frozen identity and firing component, not its non-damaging deployment", (f) => {
    const p = preset(f.id);
    expect({ id: p.id, name: p.name, gemId: p.gemId, tags: p.tags }).toEqual({ id: f.id, name: f.name, gemId: f.gemId, tags: f.tags });
    expect(f.deployDealsNoDamage).toBe(true);
    expect(f.sets.every((s) => s.attack && s.projectile && s.totem && s.areaDamageStat)).toBe(true);
    expect(p.passiveStatScopes).toEqual([
      "attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage",
      "crossbowAttackDamage", "crossbowAttackSpeed", "crossbowAccuracy", "crossbowCriticalChance", "crossbowCriticalDamageBonus", "twoHandedWeaponDamage",
      ...(f.id === "siege-ballista" ? ["attackElementalDamage"] : []),
    ]);
    expect(p.suggestions.map((s) => s.id)).toEqual([
      "totemDamage", "attackDamage", "projectileDamage", "totemAttackSpeed", "attackSpeed", "totemPlacementSpeed", "totemLife", "totemDuration",
      "totemAreaOfEffect", "areaOfEffect", "attackAreaDamage", ...(f.id === "artillery-ballista" ? ["physicalDamage", "pinBuildup"] : ["fireDamage", "elementalDamage"]),
    ]);
    expect(normalizeSkillSupportIds(f.id, ["magnified-area-i", "prolonged-duration-i", "rapid-attacks-i", "controlled-destruction"])).toEqual([]);
  });

  it.each(fixtures)("keeps $name's Totem/player/minion owners and modifier categories independent", ({ id }) => {
    const context = { focusSkillId: id };
    const p = node("20% increased Totem Damage", "10% increased Attack Damage", "5% reduced Totem Damage",
      "Attacks used by Totems have 6% increased Attack Speed", "3% increased Attack Speed",
      "10% increased Totem Placement speed", "20% increased Totem Life", "10% increased maximum Life",
      "10% increased Totem Duration", "10% increased Skill Effect Duration", "10% increased Area of Effect for Skills used by Totems",
      "10% increased Area of Effect", "Minions deal 100% increased Damage", "Minions have 100% increased maximum Life");
    expect(passivePreferenceValues(p, context)).toEqual({ totemDamage: 15, attackDamage: 10, totemAttackSpeed: 6, attackSpeed: 3,
      totemPlacementSpeed: 10, totemLife: 20, life: 10, totemDuration: 10, skillDuration: 10, totemAreaOfEffect: 10, areaOfEffect: 10,
      minionDamage: 100, minionLife: 100 });
    const weights = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset(id)).preferences;
    // Independent units: 15/10*3 + 10/10*2 + 6/3*2 + 3/3 + 10/10 + 20/10 + 10/10 + 10/10 + 10/10.
    expect(scorePassiveNode(p, weights, context)).toBe(17.5);
    expect(scorePassiveNode(node("100% increased maximum Life", "100% increased Skill Effect Duration", "100% increased Cast Speed",
      "Minions deal 100% increased Damage", "Minions have 100% increased Attack and Cast Speed", "Companions deal 100% increased Damage",
      "Spells Cast by Totems have 100% increased Cast Speed"), weights, context)).toBe(0);
    expect(scorePassiveNode(node("10% increased Totem Life"), [{ id: "life", weight: 3 }], context)).toBe(0);
    expect(scorePassiveNode(node("10% increased maximum Life"), [{ id: "totemLife", weight: 3 }], context)).toBe(0);
    expect(scorePassiveNode(node("10% increased maximum Life"), [{ id: "life", weight: 3 }], context)).toBe(10);
    expect(scorePassiveNode(node("Attacks used by Totems have 3% increased Attack Speed"), [{ id: "attackSpeed", weight: 3 }], context)).toBe(0);
    expect(scorePassiveNode(node("3% increased Attack Speed"), [{ id: "totemAttackSpeed", weight: 3 }], context)).toBe(0);
  });

  it.each(fixtures)("matches $name's inherited Crossbow and area attack modifiers once, including reductions", ({ id }) => {
    const context = { focusSkillId: id };
    expect(passivePreferenceValues(node("20% increased Damage with Crossbows", "5% reduced Damage with Crossbows",
      "10% increased Damage with Two Handed Weapons", "6% increased Attack Speed with Crossbows", "3% reduced Attack Speed with Crossbows",
      "10% increased Attack Area Damage", "5% reduced Attack Area Damage", "10% increased Area Damage", "5% reduced Area Damage",
      "10% increased Elemental Damage with Attacks", "100% increased Spell Area Damage", "100% increased Damage with Bows",
      "100% increased Damage with Spears", "100% increased Melee Damage"), context)).toEqual({ attackDamage: 25, attackSpeed: 3,
      attackAreaDamage: 5, areaDamage: 5, ...(id === "siege-ballista" ? { elementalDamage: 10 } : {}) });
    expect(passivePreferenceValues(node("20% increased Damage with Crossbows if you've Reloaded Recently", "20% increased Totem Damage per Summoned Totem",
      "Totems have 20% increased Attack and Cast Speed", "Minions have 20% increased Totem Damage", "20% more Totem Damage"), context)).toEqual({});
    expect(passivePreferenceValues(node("15% increased Critical Hit Chance for Attacks", "5% reduced Critical Hit Chance with Crossbows",
      "10% increased Critical Hit Chance for Spells", "10% increased Critical Damage Bonus with Crossbows"), context)).toEqual({ criticalChance: 10, criticalDamageBonus: 10 });
    expect(preset(id).suggestions.some((s) => ["criticalChance", "criticalDamageBonus", "accuracy"].includes(s.id))).toBe(false);
  });

  it("does not confuse Artillery's Bow type tag with weapon flags, or Siege's missing PoB area flag with game stats", () => {
    expect(fixtures[0].weapon).toBe("Crossbow");
    expect(fixtures[0].durationMs).toBe(12000);
    expect(fixtures[1].durationMs).toBe(8000);
    expect(fixtures[1].sets.every((s) => !s.nativeAreaFlag && s.areaDamageStat)).toBe(true);
    expect(preset("siege-ballista").suggestions.find((s) => s.id === "attackAreaDamage")?.reason).toContain("PoB's missing area flag");
    expect(preset("siege-ballista").suggestions.some((s) => s.id === "pinBuildup")).toBe(false);
    expect(preset("artillery-ballista").suggestions.some((s) => s.id === "fireDamage")).toBe(false);
  });

  it.each(fixtures)("preserves $name's manual priorities, goals and budget through saved JSON", ({ id, name }) => {
    const current = { mode: "weighted" as const, extraPointBudget: 7, pointBudgetMode: "all-available" as const, goals: ["required"],
      preferences: [{ id: "life" as const, weight: 3 }, { id: "totemLife" as const, weight: 2 }, { id: "totemDamage" as const, weight: 1 }] };
    const settings = addSkillPresetPreferences(current, preset(id));
    expect(settings.preferences.slice(0, 3)).toEqual(current.preferences);
    expect(settings).toHaveProperty("goals", ["required"]);
    expect(settings.extraPointBudget).toBe(7);
    expect(settings.pointBudgetMode).toBe("all-available");
    const normalized = normalizePassiveOptimizationSettings(settings);
    expect(normalized.focusSkillId).toBe(id);
    expect(normalized.preferences).toEqual(settings.preferences);
    const [saved] = normalizeSavedBuilds([{ id, name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "mercenary", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: normalized,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    expect(saved.state.optimizerSettings).toEqual(normalized);
  });

  it.each(fixtures)("routes $name towards Totem value without treating minion/player-only nodes as Totem power", ({ id }) => {
    const edges = [["start", "plain"], ["plain", "goal"], ["start", "totem"], ["totem", "bridge"], ["bridge", "goal"],
      ["start", "wrong-owner"], ["wrong-owner", "bridge"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "totem", "bridge", "wrong-owner"].map((key) => [key, { ...node(), id: key,
        stats: key === "totem" ? ["20% increased Totem Damage"] : key === "wrong-owner"
          ? ["Minions deal 1000% increased Damage", "1000% increased maximum Life", "1000% increased Cast Speed"] : [],
        flags: key === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from, to]) => ({ from, to })), groups: {}, classStarts: { mercenary: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 1, preferences: [] }, preset(id));
    const request = { graph, ...settings, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(result.status).toBe("success");
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(["goal", "totem"]));
    expect(result.totalNodeIds).not.toContain("wrong-owner");
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(6);
    const shortest = { ...request, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });

  it("scores real-tree Totem/placement nodes in separate categories", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    for (const id of ["10534", "16051", "24259", "33209", "33423", "65192"]) {
      const values = passivePreferenceValues(graph.nodes[id], { focusSkillId: "artillery-ballista" });
      expect(values.totemAttackSpeed).toBe(4);
      expect(values.attackSpeed).toBeUndefined();
      expect(values.totemPlacementSpeed).toBeUndefined();
    }
    expect(passivePreferenceValues(graph.nodes["27096"], { focusSkillId: "siege-ballista" }))
      .toEqual({ totemAttackSpeed: 6, totemCastSpeed: 6, totemPlacementSpeed: 40 });
    const weights = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 1, preferences: [] }, preset("siege-ballista")).preferences;
    expect(scorePassiveNode(graph.nodes["27096"], weights, { focusSkillId: "siege-ballista" })).toBe(8);
  });
});

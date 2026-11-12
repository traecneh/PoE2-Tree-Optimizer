import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { plantSkillFixtures as fixtures, plantIds, plantDamageNodeIds, plantModifierProbes } from "./plantSkills.fixtures";
import { plantBowIds } from "./plantBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset, skillPreferencePresets } from "./skillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceCatalog, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { normalizeSkillSupportIds } from "./skillSupportPreferences";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const preset = (id: string) => getSkillPreferencePreset(id)!;

describe("reviewed Plant spell and Pustule focuses", () => {
  it.each(fixtures)("retains $name's frozen identity and tags without inferring support compatibility", (f) => {
    const p = preset(f.id);
    expect({ id: p.id, name: p.name, gemId: p.gemId, tags: p.tags }).toEqual({ id: f.id, name: f.name, gemId: f.gemId, tags: f.tags });
    expect(p.suggestions.map((s) => s.id)).toEqual(f.suggestions);
    expect(p.passiveStatScopes).toEqual(f.actor === "spell" ? ["plantDamage", "spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"]
      : ["plantDamage", "attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage"]);
    expect(p.suggestions.some((s) => ["criticalChance", "criticalDamageBonus", "accuracy", "poisonMagnitude", "poisonChance"].includes(s.id))).toBe(false);
    expect(normalizeSkillSupportIds(f.id, ["magnified-area-i", "prolonged-duration-i", "controlled-destruction", "spell-echo", "brutality-i"]))
      .toEqual(["magnified-area-i", "prolonged-duration-i", ...(f.id === "thrashing-vines" ? ["controlled-destruction", "spell-echo"]
        : f.id === "entangle" ? ["controlled-destruction"] : []), "brutality-i"]);
  });

  it("admits unconditional Plant Damage only for the explicit reviewed focuses, not arbitrary Plant tags or names", () => {
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes("plantDamage")).map((p) => p.id)).toEqual([...plantIds, ...plantBowIds]);
    expect(passivePreferenceCatalog.find((p) => p.id === "plantDamage")?.scale).toBe(10);
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Entangle", "__proto__"]) {
      expect(passivePreferenceValues(node("12% increased Damage with Plant Skills"), { focusSkillId }), focusSkillId)
        .toEqual([...plantIds, ...plantBowIds].includes(focusSkillId ?? "") ? { plantDamage: 12 } : {});
    }
    expect(passivePreferenceValues({ ...node(), name: "Entangle Plant Damage" })).toEqual({});
  });

  it.each(fixtures)("counts $name's Plant, generic and actor-specific sources once with signed reductions", ({ id, actor }) => {
    const context = { focusSkillId: id };
    const p = node("  12.5%   INCREASED DAMAGE WITH PLANT SKILLS  ", "20% reduced Damage with Plant Skills", "10% increased Damage",
      "20% increased Spell Damage", "30% increased Physical Damage", "40% increased Attack Damage");
    expect(passivePreferenceValues(p, context)).toEqual({ plantDamage: -7.5, genericDamage: 10, spellDamage: 20, physicalDamage: 30, attackDamage: 40 });
    expect(scorePassiveNode(p, [{ id: "plantDamage", weight: 2 }], context)).toBe(-1.5);
    expect(scorePassiveNode(node("20% increased Damage with Plant Skills"), [{ id: "genericDamage", weight: 3 }, { id: "physicalDamage", weight: 3 },
      { id: "spellDamage", weight: 3 }, { id: "attackDamage", weight: 3 }, { id: "damageOverTime", weight: 3 }], context)).toBe(0);
    expect(scorePassiveNode(p, [{ id: "plantDamage", weight: 2 }, { id: "genericDamage", weight: 1 }, { id: actor === "spell" ? "spellDamage" : "attackDamage", weight: 1 }], context))
      .toBe(actor === "spell" ? 1.5 : 3.5);
    expect(scorePassiveNode(p, [], context)).toBe(0);
    expect(passivePreferenceValues(node("10% increased Damage with Plant Skills", "10% reduced Damage with Plant Skills"), context)).toEqual({ plantDamage: 0 });
    expect(passivePreferenceValues(node("0% increased Damage with Plant Skills"), context)).toEqual({ plantDamage: 0 });
  });

  it.each(fixtures)("rejects $name's unreviewed growth, ownership, conditional, malformed and more/less wording", ({ id }) => {
    for (const line of ["12% increased Plant Damage", "12% increased Damage with Plant Skills while Overgrown", "12% increased Damage with Plant Skills per Plant",
      "12% increased Damage with Plant Skills\nif you have cast Recently", "Minions deal 12% increased Damage with Plant Skills",
      "Totems deal 12% increased Damage with Plant Skills", "Companions deal 12% increased Damage with Plant Skills", "Enemies take 12% increased Damage with Plant Skills",
      "12% more Damage with Plant Skills", "12% less Damage with Plant Skills", "+12% increased Damage with Plant Skills", "-12% increased Damage with Plant Skills",
      "NaN% increased Damage with Plant Skills", "Infinity% increased Damage with Plant Skills", "1.2.3% increased Damage with Plant Skills",
      "12% increased Damage with Plant Skills and Spell Damage", "Plants have a 20% chance to immediately Overgrow", "Overgrown Plant Skills Break 50% increased Armour",
      "Skills which create Fissures have a 20% chance to create an additional Fissure", "Fissure Skills have +1 to Limit",
      "Storm and Plant Spells:\n• deal 50% more damage\n• cost 50% less\n• have 75% less duration"]) {
      expect(passivePreferenceValues(node(line), { focusSkillId: id }), line).toEqual({});
    }
  });

  it.each(fixtures)("keeps $name's spell/attack scopes and critical bonuses distinct from Plant Damage", ({ id, actor }) => {
    const context = { focusSkillId: id };
    const p = node("20% increased Spell Area Damage", "5% reduced Spell Area Damage", "10% increased Attack Area Damage", "2% reduced Attack Area Damage",
      "10% increased Area Damage", "Spell Skills have 10% increased Area of Effect", "10% increased Area of Effect for Attacks",
      "20% increased Critical Hit Chance for Spells", "5% reduced Critical Hit Chance for Attacks", "10% increased Critical Spell Damage Bonus",
      "15% increased Critical Damage Bonus for Attack Damage", "100% increased Damage with Bows", "100% increased Projectile Speed for Spell Skills");
    expect(passivePreferenceValues(p, context)).toEqual({ areaDamage: 10, areaOfEffect: 10, ...(actor === "spell"
      ? { spellAreaDamage: 15, criticalChance: 20, criticalDamageBonus: 10 } : { attackAreaDamage: 8, criticalChance: -5, criticalDamageBonus: 15 }) });
  });

  it.each(plantModifierProbes)("confirms $skill / $component's native Plant applicability without interpreting damage ratios as DPS", (f) => {
    expect(f.plant20).toBe(f.generic20);
    expect(f.plant20).toBe(f.spell20);
    expect(f.plant20).toBeGreaterThan(f.baseHit);
    expect(f.reducedPlant20).toBeLessThan(f.baseHit);
    expect(f.attack20).toBe(f.baseHit);
    expect(f.area20 > f.baseHit).toBe(f.component !== "Vines");
  });

  it("records conditional storage, movement, timer and NoAttackOrCastTime boundaries", () => {
    expect(preset("entangle").suggestions.find((s) => s.id === "spellAreaDamage")?.reason).toContain("attached-vine hits do not");
    expect(preset("entangle").suggestions.find((s) => s.id === "castSpeed")?.reason).toContain("fixed vine-application interval");
    expect(preset("briarpatch").description).toContain("moving enemies");
    expect(preset("briarpatch").exclusions.find((s) => s.id === "castSpeed")?.reason).toContain("zero native cast time");
    expect(preset("thrashing-vines").suggestions.find((s) => s.id === "castSpeed")?.reason).toContain("50% of cast time");
    const toxic = preset("toxic-domain");
    expect(toxic.description).toContain("non-damaging Bloom");
    expect(toxic.suggestions.find((s) => s.id === "cooldownRecoveryRate")?.reason).toContain("15-second base detonation");
    expect(toxic.exclusions.map((s) => s.id)).toEqual(expect.arrayContaining(["spellDamage", "castSpeed", "attackSpeed", "projectileDamage", "skillDuration", "chaosDamage", "damageOverTime"]));
  });

  it("matches all eight real Plant-damage nodes while leaving complex Plant mechanics unscored", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    for (const focusSkillId of plantIds) {
      expect(Object.values(graph.nodes).filter((n) => Object.hasOwn(passivePreferenceValues(n, { focusSkillId }), "plantDamage")).map((n) => n.id).sort())
        .toEqual([...plantDamageNodeIds].sort());
      for (const id of plantDamageNodeIds) {
        expect(passivePreferenceValues(graph.nodes[id], { focusSkillId })).toEqual({ plantDamage: 12 });
        expect(scorePassiveNode(graph.nodes[id], [{ id: "plantDamage", weight: 3 }], { focusSkillId })).toBeCloseTo(3.6);
      }
      for (const id of ["9009", "15114", "20251", "45874", "49363"]) expect(passivePreferenceValues(graph.nodes[id], { focusSkillId })).toEqual({});
    }
  });

  it.each(fixtures)("retains $name and Plant weights through explicit suggestion apply and saved JSON", ({ id, name }) => {
    const current = { mode: "weighted" as const, extraPointBudget: 7, pointBudgetMode: "all-available" as const, goals: ["required"],
      preferences: [{ id: "life" as const, weight: 3 }, { id: "plantDamage" as const, weight: 1 }, { id: "criticalChance" as const, weight: 2 }] };
    const settings = addSkillPresetPreferences(current, preset(id));
    expect(settings.preferences.slice(0, 3)).toEqual(current.preferences);
    expect(settings).toHaveProperty("goals", ["required"]);
    expect(settings.extraPointBudget).toBe(7);
    expect(settings.pointBudgetMode).toBe("all-available");
    expect(addSkillPresetPreferences(settings, preset(id))).toEqual(settings);
    const normalized = normalizePassiveOptimizationSettings(settings);
    expect(normalized.focusSkillId).toBe(id);
    const [saved] = normalizeSavedBuilds([{ id, name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "druid", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: normalized,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    expect(saved.state.optimizerSettings).toEqual(normalized);
  });

  it.each(fixtures)("uses $name's Plant preference for a legal weighted detour without changing Shortest", ({ id }) => {
    const edges = [["start", "plain"], ["plain", "goal"], ["start", "plant"], ["plant", "bridge"], ["bridge", "goal"],
      ["start", "wrong-owner"], ["wrong-owner", "bridge"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "plant", "bridge", "wrong-owner"].map((key) => [key, { ...node(), id: key,
        stats: key === "plant" ? ["20% increased Damage with Plant Skills"] : key === "wrong-owner"
          ? ["Minions deal 1000% increased Damage", "1000% increased Damage with Plant Skills while Overgrown"] : [],
        flags: key === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from, to]) => ({ from, to })), groups: {}, classStarts: { druid: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 1, preferences: [] }, preset(id));
    const request = { graph, ...settings, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(result.status).toBe("success");
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(["goal", "plant"]));
    expect(result.totalNodeIds).not.toContain("wrong-owner");
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(6);
    const shortest = { ...request, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

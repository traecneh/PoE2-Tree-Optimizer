import { describe, expect, it } from "vitest";
import { fireLightningSkillFixtures as fixtures, burningComponentProbe } from "./fireLightningSkills.fixtures";
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

describe("reviewed Fire and Lightning spell focuses", () => {
  it.each(fixtures)("preserves $name's actual identity and tags but admits only reviewed component scopes", (f) => {
    const p = preset(f.id);
    expect({ id: p.id, name: p.name, gemId: p.gemId, tags: p.tags }).toEqual({ id: f.id, name: f.name, gemId: f.gemId, tags: f.tags });
    expect(p.suggestions.map((s) => s.id)).toEqual(f.suggestions);
    expect(p.passiveStatScopes).toEqual(f.focus === "burning" ? ["spellAreaOfEffect"] : [
      "spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellHinderChance",
      ...(f.areaDamage ? ["spellAreaDamage"] : []), ...(f.projectile ? ["spellProjectileSpeed"] : []),
    ]);
    expect(p.suggestions.some((s) => ["criticalChance", "criticalDamageBonus", "accuracy", "shockChance", "shockMagnitude"].includes(s.id))).toBe(false);
    expect(normalizeSkillSupportIds(f.id, ["spell-echo", "controlled-destruction", "magnified-area-i", "prolonged-duration-i", "arcane-tempo"])).toEqual([]);
  });

  it.each(fixtures)("keeps $name's scoped area, hit crit and projectile delivery separate, including reductions", (f) => {
    const context = { focusSkillId: f.id };
    const values = passivePreferenceValues(node("20% increased Spell Area Damage", "5% reduced Spell Area Damage",
      "10% increased Area Damage", "2% reduced Area Damage", "Spell Skills have 10% increased Area of Effect", "Spell Skills have 3% reduced Area of Effect",
      "20% increased Critical Hit Chance for Spells", "5% reduced Critical Hit Chance for Spells", "10% increased Critical Spell Damage Bonus",
      "15% increased Projectile Speed for Spell Skills", "5% reduced Projectile Speed for Spell Skills",
      "5% chance to Hinder Enemies on Hit with Spells", "100% increased Attack Area Damage", "100% increased Critical Hit Chance for Attacks"), context);
    expect(values).toEqual({ areaOfEffect: 7, ...(f.areaDamage ? { spellAreaDamage: 15, areaDamage: 8 } : {}),
      ...(f.focus === "hit" ? { criticalChance: 15, criticalDamageBonus: 10, hinderChance: 5 } : {}), ...(f.projectile ? { projectileSpeed: 10 } : {}) });
    expect(scorePassiveNode(node("20% increased Spell Area Damage"), [{ id: "spellDamage", weight: 3 }], context)).toBe(0);
    expect(scorePassiveNode(node("20% increased Fire Damage"), [], context)).toBe(0);
  });

  it.each(fixtures)("scores $name's selected elemental effect once without importing owners, conditions or unrelated skill tags", (f) => {
    const context = { focusSkillId: f.id };
    const weights = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset(f.id)).preferences;
    expect(scorePassiveNode(node(`20% increased ${f.element === "fireDamage" ? "Fire" : "Lightning"} Damage`,
      `5% reduced ${f.element === "fireDamage" ? "Fire" : "Lightning"} Damage`), weights, context)).toBe(4.5);
    for (const raw of ["Minions deal 100% increased Damage", "Companions deal 100% increased Damage", "100% increased Totem Damage",
      "Minions have 100% increased Cast Speed", "100% increased Attack Damage", "100% increased Fire Damage while on Full Life",
      "100% increased Lightning Damage per Power Charge", "100% increased Damage with Plant Skills", "100% increased Storm Damage",
      "100% increased Fire Damage with Attacks", "100% increased Damage with Repeatable Skills", "100% increased Sustained Skill Damage"]) {
      expect(scorePassiveNode(node(raw), weights, context), raw).toBe(0);
    }
  });

  it.each(["incinerate", "flame-wall"] as const)("does not promote %s's native critical field or virtual hit into burning scaling", (id) => {
    const f = fixtures.find((f) => f.id === id)!;
    expect(f.nativeCritChance).toBeGreaterThan(0);
    const probe = burningComponentProbe[id];
    for (const key of ["spellDamage20FireDot", "areaDamage20FireDot", "criticalChance100FireDot", "castSpeed20FireDot"] as const) expect(probe[key]).toBe(probe.baseFireDot);
    expect(probe.fireDamage20FireDot / probe.baseFireDot).toBeCloseTo(1.2);
    expect(probe.damageOverTime20FireDot / probe.baseFireDot).toBeCloseTo(1.2);
    const weights = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset(id)).preferences;
    expect(scorePassiveNode(node("20% increased Spell Damage", "20% increased Area Damage", "20% increased Critical Hit Chance for Spells",
      "20% increased Projectile Damage"), weights, { focusSkillId: id })).toBe(0);
    expect(scorePassiveNode(node("10% increased Damage over Time", "5% reduced Damage over Time"), weights, { focusSkillId: id })).toBe(1.5);
    expect(preset(id).exclusions.map((e) => e.id)).toEqual(expect.arrayContaining(["spellDamage", "criticalChance", "criticalDamageBonus", "projectileDamage"]));
  });

  it("keeps release delays, target radii, infusion components and fixed timing explicit rather than using a tag-wide rule", () => {
    expect(preset("ember-fusillade").suggestions.find((s) => s.id === "castSpeed")?.reason).toContain("1300 ms");
    expect(preset("ember-fusillade").exclusions.find((s) => s.id === "skillDuration")?.reason).toContain("release delay");
    for (const id of ["orb-of-storms", "lightning-conduit"]) {
      expect(preset(id).tags).toContain("area");
      expect(preset(id).passiveStatScopes).not.toContain("spellAreaDamage");
    }
    expect(preset("orb-of-storms").suggestions.find((s) => s.id === "castSpeed")?.reason).toContain("six-hit limit");
    expect(preset("lightning-conduit").suggestions.find((s) => s.id === "cooldownRecoveryRate")?.weight).toBe(2);
    expect(preset("lightning-conduit").exclusions.find((s) => s.id === "shockChance")?.reason).toContain("cannot Shock");
    expect(preset("lightning-warp").exclusions.find((s) => s.id === "projectileDamage")?.reason).toContain("Ball Lightning");
    expect(preset("thunderstorm").suggestions.find((s) => s.id === "skillDuration")?.reason).toContain("350 ms");
  });

  it.each(fixtures)("preserves $name's manual priorities, goals, budget and identity through saved/exported builds", ({ id, name }) => {
    const current = { mode: "weighted" as const, extraPointBudget: 7, pointBudgetMode: "all-available" as const, goals: ["required"],
      preferences: [{ id: "life" as const, weight: 3 }, { id: "spellDamage" as const, weight: 1 }, { id: "criticalChance" as const, weight: 2 }] };
    const settings = addSkillPresetPreferences(current, preset(id));
    expect(settings.preferences.slice(0, 3)).toEqual(current.preferences);
    expect(settings).toHaveProperty("goals", ["required"]);
    expect(settings.extraPointBudget).toBe(7);
    expect(settings.pointBudgetMode).toBe("all-available");
    expect(addSkillPresetPreferences(settings, preset(id))).toEqual(settings);
    const normalized = normalizePassiveOptimizationSettings(settings);
    expect(normalized.focusSkillId).toBe(id);
    const [saved] = normalizeSavedBuilds([{ id, name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "sorceress", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: normalized,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    expect(saved.state.optimizerSettings).toEqual(normalized);
  });

  it.each(fixtures)("routes $name through reviewed value within budget and leaves Shortest unchanged", (f) => {
    const edges = [["start", "plain"], ["plain", "goal"], ["start", "value"], ["value", "bridge"], ["bridge", "goal"],
      ["start", "wrong-owner"], ["wrong-owner", "bridge"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "value", "bridge", "wrong-owner"].map((id) => [id, { ...node(), id,
        stats: id === "value" ? [`20% increased ${f.element === "fireDamage" ? "Fire" : "Lightning"} Damage`] : id === "wrong-owner"
          ? ["Minions deal 1000% increased Damage", "1000% increased Attack Damage", "1000% increased Totem Damage"] : [],
        flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from, to]) => ({ from, to })), groups: {}, classStarts: { sorceress: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 1, preferences: [] }, preset(f.id));
    const request = { graph, ...settings, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(result.status).toBe("success");
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(["goal", "value"]));
    expect(result.totalNodeIds).not.toContain("wrong-owner");
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(6);
    const shortest = { ...request, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import { addSkillPresetPreferences, getSkillPreferencePreset, skillPreferencePresets } from "./skillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { normalizeSkillSupportIds } from "./skillSupportPreferences";
import { remainingAttackSkillFixtures as fixtures } from "./remainingAttackSkills.fixtures";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "node", stats, flags: {}, position: { x: 0, y: 0 } });
const preset = (id: string) => getSkillPreferencePreset(id)!;
const suggestions = (id: string) => preset(id).suggestions.map((s) => s.id);

describe("remaining crossbow and bear/wolf attack presets", () => {
  it.each(fixtures)("preserves $name's frozen native identity and reviewed damage-component scope", (f) => {
    const p = preset(f.id);
    expect({ id: p.id, name: p.name, gemId: p.gemId, tags: p.tags }).toEqual({ id: f.id, name: f.name, gemId: f.gemId, tags: f.tags });
    expect(p.description.split(/\s+/).length).toBeLessThanOrEqual(40);
    expect(p.passiveStatScopes?.includes("attackAreaDamage")).toBe(f.area);
    expect(p.passiveStatScopes?.includes("attackElementalDamage")).toBe(f.damage !== "physicalDamage");
    if (f.area) expect(f.nativeSets.some((s) => s.areaStat && "attack" in s.flags && s.flags.attack)).toBe(true);
    expect(p.passiveStatScopes?.includes("meleeDamage")).toBe(f.family === "melee-form");
    expect(p.suggestions.find((s) => s.id === "attackSpeed")?.weight ?? 0).toBe(f.speed);
    expect(p.suggestions.find((s) => s.id === "cooldownRecoveryRate")?.weight ?? 0).toBe(f.cooldown ? 2 : 0);
    expect(p.suggestions.some((s) => ["accuracy", "criticalChance", "criticalDamageBonus"].includes(s.id))).toBe(false);
    expect(normalizeSkillSupportIds(f.id, ["controlled-destruction", "heavy-swing", "rapid-attacks-i", "concentrated-area", "magnified-area-i"])).toEqual([]);
  });

  it.each(fixtures)("matches $name's weapon/area/element scope once, not from its gem tags", (f) => {
    const crossbow = f.family === "crossbow" || f.family === "grenade";
    const values = passivePreferenceValues(node("20% increased Damage with Crossbows", "5% reduced Damage with Crossbows",
      "20% increased Melee Damage", "5% reduced Melee Damage", "20% increased Attack Area Damage", "5% reduced Attack Area Damage",
      "20% increased Elemental Damage with Attacks", "5% reduced Elemental Damage with Attacks",
      "100% increased Damage with Claws", "100% increased Damage with Spears", "100% increased Critical Hit Chance for Spells"), { focusSkillId: f.id });
    expect(values).toEqual({ ...(crossbow || f.family === "melee-form" ? { attackDamage: 15 } : {}),
      ...(f.area ? { attackAreaDamage: 15 } : {}), ...(f.damage !== "physicalDamage" ? { elementalDamage: 15 } : {}) });
    const effects = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset(f.id)).preferences;
    expect(scorePassiveNode(node("Minions deal 100% increased Damage", "Companions deal 100% increased Damage", "Totems deal 100% increased Damage",
      "100% increased Spell Damage", "100% increased Cast Speed"), effects, { focusSkillId: f.id })).toBe(0);
    expect(passivePreferenceValues(node("20% increased Damage with Crossbows if you've Reloaded Recently", "20% increased Attack Area Damage per Charge",
      "20% increased Critical Hit Chance while Shapeshifted"), { focusSkillId: f.id })).toEqual({});
  });

  it.each(fixtures)("retains $name through normalization and saved JSON without overwriting manual settings", (f) => {
    const before = { mode: "weighted" as const, focusSkillId: f.id, extraPointBudget: 7, pointBudgetMode: "all-available" as const,
      preferences: [{ id: "energyShield" as const, weight: 3 }, { id: "attackDamage" as const, weight: 1 }] };
    const added = addSkillPresetPreferences(before, preset(f.id));
    expect(added.preferences.slice(0, 2)).toEqual(before.preferences);
    expect(added.extraPointBudget).toBe(7);
    expect(added.pointBudgetMode).toBe("all-available");
    expect(normalizePassiveOptimizationSettings(added)).toEqual(added);
    const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "mercenary", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: added,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(saved.state.optimizerSettings).toEqual(added);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
  });

  it.each(["fragmentation-rounds", "shockburst-rounds", "incendiary-shot", "permafrost-bolts", "crossbow-shot"])("does not infer unconditional area damage for %s", (id) => {
    expect(preset(id).tags).toContain("area");
    expect(passivePreferenceValues(node("100% increased Area Damage", "100% increased Attack Area Damage"), { focusSkillId: id })).toEqual({});
    expect(suggestions(id)).not.toContain("areaOfEffect");
  });

  it.each(["gas-grenade", "oil-grenade"])("keeps %s's initial physical hit separate from its cloud/ground damage", (id) => {
    expect(preset(id).tags).toContain("fire");
    for (const effect of ["fireDamage", "chaosDamage", "damageOverTime", "igniteMagnitude", "poisonMagnitude"]) expect(suggestions(id)).not.toContain(effect);
    const effects = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset(id)).preferences;
    expect(scorePassiveNode(node("100% increased Fire Damage", "100% increased Chaos Damage", "100% increased Damage over Time"), effects, { focusSkillId: id })).toBe(0);
    expect(preset(id).passiveStatScopes).toContain("grenadeDamage");
  });

  it("keeps player Pounce separate from its Mark/Wolf and Calamity meteors separate from melee and activation speed", () => {
    for (const effect of ["markEffect", "minionDamage", "minionLife", "companionDamage"]) expect(suggestions("pounce")).not.toContain(effect);
    expect(preset("pounce").description).toContain("separate effects/owners");
    expect(suggestions("walking-calamity")).not.toContain("attackSpeed");
    expect(suggestions("walking-calamity")).not.toContain("projectileDamage");
    expect(passivePreferenceValues(node("100% increased Melee Damage", "100% increased Damage with Crossbows", "100% increased Damage with Two Handed Weapons"), { focusSkillId: "walking-calamity" })).toEqual({});
    expect(suggestions("walking-calamity")).toEqual(["attackDamage", "fireDamage", "elementalDamage", "attackAreaDamage", "areaOfEffect", "skillDuration"]);
    expect(suggestions("requiem")).not.toContain("skillDuration");
    expect(preset("molten-crash").exclusions.some((e) => e.id === "fireDamage")).toBe(true);
  });

  it("limits new control suggestions to the skills with native application sources", () => {
    expect(suggestions("armour-piercing-rounds")).toContain("armourBreakAmount");
    expect(suggestions("high-velocity-rounds")).not.toContain("armourBreakAmount");
    expect(suggestions("flash-grenade")).toEqual(expect.arrayContaining(["stunBuildup", "blindEffect", "blindDuration"]));
    expect(suggestions("flash-grenade")).not.toContain("blindChance");
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset("flash-grenade"));
    expect(scorePassiveNode(node("10% increased Blind Effect", "10% increased Blind duration", "10% increased Stun Buildup"), settings.preferences, { focusSkillId: "flash-grenade" })).toBe(4);
    expect(scorePassiveNode(node("10% reduced Blind Effect", "10% reduced Blind duration", "10% reduced Stun Buildup"), settings.preferences, { focusSkillId: "flash-grenade" })).toBe(-4);
  });

  it("keeps the non-damaging/proxy utility backlog separate and all preset IDs unique", () => {
    expect(skillPreferencePresets).toHaveLength(239);
    expect(new Set(skillPreferencePresets.map((p) => p.gemId)).size).toBe(239);
    expect(preset("arctic-howl").passiveStatScopes).toEqual(["secondaryAreaDamage"]);
    expect(preset("lunar-blessing").passiveStatScopes).toEqual([]);
    for (const id of ["emergency-reload", "shard-scavenger"]) {
      expect(preset(id).passiveStatScopes).toEqual([]);
      expect(preset(id).suggestions.some(s => s.id === "attackDamage")).toBe(false);
    }
  });

  it.each(["armour-piercing-rounds", "cluster-grenade", "gas-grenade", "lunar-assault", "pounce", "walking-calamity"])("routes %s within the same extra-point budget without changing Shortest", (focusSkillId) => {
    const f = fixtures.find((x) => x.id === focusSkillId)!;
    const edges = [["start", "plain"], ["plain", "goal"], ["start", "good"], ["good", "bridge"], ["bridge", "goal"]];
    const matching = f.family === "crossbow" || f.family === "grenade" ? "20% increased Damage with Crossbows"
      : f.family === "melee-form" ? "20% increased Melee Damage" : "20% increased Attack Damage";
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "good", "bridge"].map((id) => [id, { ...node(), id,
        stats: id === "good" ? [matching] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from, to]) => ({ from, to })), groups: {}, classStarts: { witch: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"],
      focusSkillId, extraPointBudget: 1, preferences: [{ id: "attackDamage" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(result.status).toBe("success");
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(2);
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(["start", "good", "goal"]));
    const shortest = { ...request, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { treeEdgeKey } from "./pathAllocation";
import type { TreeGraph } from "./types";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds } from "./skillSupportPreferences";

function graph(edges: string[][], effects: Record<string, string[]> = {}): TreeGraph {
  return {
    schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
    nodes: Object.fromEntries([...new Set(edges.flat())].map((id) => [id, { id, name: id, stats: effects[id] ?? [], flags: {}, position: { x: 0, y: 0 } }])),
    edges: edges.map(([from, to]) => ({ from, to })), groups: {}, classStarts: { witch: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
  };
}
function request(g: TreeGraph, budget = 1) {
  return { graph: g, mode: "weighted" as const, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"],
    extraPointBudget: budget, preferences: [{ id: "energyShield" as const, weight: 1 }] };
}
const options = { maxIterations: 36, noImprovementMs: 60_000 };

describe("weighted build goals", () => {
  it.each(["infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar"])("routes toward %s utility without inferring attack, spell, minion or form damage", (focusSkillId) => {
    const g = graph([["start", "utility"], ["utility", "goal"], ["start", "damage"], ["damage", "goal"], ["start", "penalty"]], {
      utility: ["10% increased Warcry Speed", "10% increased Warcry Cooldown Recovery Rate", "Warcry Skills have 10% increased Area of Effect", "10% increased Skill Effect Duration"],
      damage: ["100% increased Attack Damage", "100% increased Spell Damage", "100% increased Physical Damage", "100% increased Fire Damage", "Minions deal 100% increased Damage", "Break 100% increased Armour"],
      penalty: ["10% reduced Warcry Speed", "10% reduced Warcry Cooldown Recovery Rate", "Warcry Skills have 10% reduced Area of Effect", "10% reduced Skill Effect Duration"],
    });
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset(focusSkillId)!);
    const r = { ...request(g, 0), ...settings };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(2);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["utility", "goal"]));
    expect(result.weighted?.score).toBe(focusSkillId === "ancestral-cry" ? 4 : 5);
    expect(result.weighted?.contributions.every((c) => c.nodeCount === 1)).toBe(true);
    const all = ["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility",
      "raging-cry", "exposing-cry", "enraged-warcry-i", "enraged-warcry-ii", "echoing-cry", "corrupting-cry-i", "corrupting-cry-ii"];
    const allowed = all.filter((id) => normalizeSkillSupportIds(focusSkillId, [id]).length > 0);
    for (const supportGemIds of [...allowed.map((id) => [id]), normalizeSkillSupportIds(focusSkillId, all)]) {
      const supported = optimizeWeightedBuildGoals({ ...r, supportGemIds }, undefined, options);
      expect(supported.addedNodeIds).toEqual(result.addedNodeIds);
      expect(supported.pointCost).toBe(result.pointCost);
      expect(supported.weighted?.score).toBe(result.weighted?.score);
      expect(supported.weighted?.contributions).toEqual(result.weighted?.contributions);
    }
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["penalty"] }, undefined, options);
    expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(focusSkillId === "ancestral-cry" ? -4 : -5);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts shared Warcry utility only once and does not re-reward allocated nodes", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], {
      joint: ["10% increased Warcry Speed", "10% increased Warcry Cooldown Recovery Rate", "Warcry Skills have 10% increased Area of Effect"],
    });
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset("ferocious-roar")!);
    const r = { ...request(g, 0), ...settings, goalNodeIds: ["goal", "second"] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(5);
    expect(result.weighted?.contributions.every((c) => c.nodeCount === 1)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
  });
  it.each(["snipers-mark", "bloodhounds-mark", "freezing-mark", "voltaic-mark"])("routes toward %s utility, not its consuming hit, conditional buff or damage tags", (focusSkillId) => {
    const g = graph([["start", "utility"], ["utility", "goal"], ["start", "damage"], ["damage", "goal"], ["start", "penalty"]], {
      utility: ["10% increased Effect of your Mark Skills", "Mark Skills have 10% increased Use Speed", "Mark Skills have 10% increased Skill Effect Duration"],
      damage: ["100% increased Spell Damage", "100% increased Attack Damage", "100% increased Physical Damage", "100% increased Cold Damage", "100% increased Lightning Damage", "Minions deal 100% increased Damage"],
      penalty: ["10% reduced Effect of your Mark Skills", "Mark Skills have 10% reduced Use Speed", "Mark Skills have 10% reduced Skill Effect Duration"],
    });
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset(focusSkillId)!);
    const r = { ...request(g, 0), ...settings };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["utility", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(5);
    expect(result.weighted?.contributions).toMatchObject([
      { id: "markEffect", score: 3, nodeCount: 1 }, { id: "markUseSpeed", score: 1, nodeCount: 1 }, { id: "markDuration", score: 1, nodeCount: 1 },
    ]);
    for (const supportGemIds of [["mobility"], ["efficiency-i"], ["efficiency-ii"], ["prolonged-duration-i"], ["prolonged-duration-ii"], ["mobility", "efficiency-ii", "prolonged-duration-ii"]]) {
      const supported = optimizeWeightedBuildGoals({ ...r, supportGemIds }, undefined, options);
      expect(supported.addedNodeIds).toEqual(result.addedNodeIds);
      expect(supported.pointCost).toBe(result.pointCost);
      expect(supported.weighted?.score).toBe(result.weighted?.score);
      expect(supported.weighted?.contributions).toEqual(result.weighted?.contributions);
    }
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["penalty"] }, undefined, options);
    expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-5);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts shared Mark utility once for multiple goals and does not re-reward an allocated base", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], {
      joint: ["10% increased Effect of your Mark Skills", "Mark Skills have 10% increased Use Speed", "Mark Skills have 10% increased Skill Effect Duration"],
    });
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset("bloodhounds-mark")!);
    const r = { ...request(g, 0), ...settings, goalNodeIds: ["goal", "second"] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(5);
    expect(result.weighted?.contributions.every((c) => c.nodeCount === 1)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
  });
  it.each([
    ["charmChargesGained", "10% increased Charm Charges gained", "10% reduced Charm Charges gained", "1000% increased Flask Charges gained"],
    ["charmChargeCostReduction", "10% reduced Charm Charges used", "10% increased Charm Charges used", "1000% reduced Flask Charges used"],
    ["charmEffectDuration", "10% increased Charm Effect Duration", "10% reduced Charm Effect Duration", "1000% increased Flask Effect Duration"],
  ] as const)("routes toward signed %s without borrowing Flask bonuses or changing shortest", (id, positive, negative, other) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, other, `Minions have ${positive}`, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("routes toward Charm charges per second without borrowing gain modifiers or Flask generation", () => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: ["Charms gain 0.1 charges per Second"], wrong: ["1000% increased Charm Charges gained", "Life Flasks gain 10 charges per Second"],
    });
    const r = { ...request(g, 0), preferences: [{ id: "charmChargeGeneration" as const, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts Charm effects once on shared routes without Flask or base rewards", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Charm Charges gained", "Charms gain 0.1 charges per Second", "10% reduced Charm Charges used", "10% increased Charm Effect Duration",
    ] });
    const ids = ["charmChargesGained", "charmChargeGeneration", "charmChargeCostReduction", "charmEffectDuration"] as const;
    const other = ["flaskChargesGained", "lifeFlaskChargeGeneration", "manaFlaskChargeGeneration", "flaskChargeCostReduction", "flaskEffectDuration", "skillDuration"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ids, ...other].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(4);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(4);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => other.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
  });
  it("rewards shared Flask-and-Charm wording once per selected item type without counting the node twice", () => {
    const g = graph([["start", "goal"]], { goal: ["10% increased Flask and Charm Charges gained"] });
    const r = { ...request(g, 0), preferences: [{ id: "flaskChargesGained" as const, weight: 1 }, { id: "charmChargesGained" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(1); expect(result.addedNodeIds).toEqual(["goal"]); expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id: "flaskChargesGained", score: 1, nodeCount: 1 }, { id: "charmChargesGained", score: 1, nodeCount: 1 }]);
    for (const preference of r.preferences) expect(optimizeWeightedBuildGoals({ ...r, preferences: [preference] }, undefined, options).weighted?.score).toBe(1);
  });
  it.each([
    ["ailmentMagnitude", "10% increased Magnitude of Ailments you inflict", "10% reduced Magnitude of Ailments you inflict", "1000% increased Ignite Magnitude"],
    ["immobilisationBuildup", "10% increased Immobilisation buildup", "10% reduced Immobilisation buildup", "1000% increased Freeze Buildup"],
    ["slowMagnitude", "Debuffs you inflict have 10% increased Slow Magnitude", "Debuffs you inflict have 10% reduced Slow Magnitude", "1000% reduced Slowing Potency of Debuffs on You"],
  ] as const)("routes toward signed generic %s without copying specific or incoming bonuses", (id, positive, negative, other) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, other, `Minions have ${positive}`, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts generic ailment/control lines once with specific preferences selected on shared routes", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Magnitude of Ailments you inflict", "10% increased Immobilisation buildup", "Debuffs you inflict have 10% increased Slow Magnitude",
    ] });
    const ids = ["ailmentMagnitude", "immobilisationBuildup", "slowMagnitude"] as const;
    const other = ["damagingAilmentMagnitude", "igniteMagnitude", "poisonMagnitude", "bleedingMagnitude", "chillMagnitude", "shockMagnitude",
      "freezeBuildup", "electrocuteBuildup", "pinBuildup", "stunBuildup", "slowPotencyReduction", "debuffExpirySpeed", "genericDamage"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ids, ...other].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => other.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g);
    distinct.nodes.joint.stats.push("10% increased Magnitude of Chill you inflict", "10% increased Freeze Buildup");
    const combined = optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options);
    expect(combined.pointCost).toBe(3); expect(combined.weighted?.score).toBe(5);
    expect(combined.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
  });
  it.each([
    ["freezeThreshold", "10% increased Freeze Threshold", "10% reduced Freeze Threshold", "1000% increased Freeze Buildup"],
    ["igniteEffectReduction", "10% reduced Magnitude of Ignite on you", "10% increased Magnitude of Ignite on you", "1000% increased Ignite Magnitude"],
    ["ailmentDurationReduction", "10% reduced Duration of Ailments on You", "10% increased Duration of Ailments on You", "Debuffs on you expire 1000% faster"],
  ] as const)("routes toward signed %s without borrowing outgoing effects or expiry", (id, positive, negative, other) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, other, `Minions have ${positive}`, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts incoming ailment modifiers once on shared routes without outgoing, expiry or base rewards", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Freeze Threshold", "10% reduced Magnitude of Ignite on you", "10% reduced Duration of Ailments on You",
    ] });
    const ids = ["freezeThreshold", "igniteEffectReduction", "ailmentDurationReduction"] as const;
    const other = ["elementalAilmentThreshold", "freezeBuildup", "igniteMagnitude", "igniteDuration", "damagingAilmentDuration", "skillDuration", "debuffExpirySpeed"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ids, ...other].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => other.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g);
    distinct.nodes.joint.stats.push("10% increased Ignite Magnitude", "Debuffs on you expire 10% faster");
    const combined = optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options);
    expect(combined.pointCost).toBe(3); expect(combined.weighted?.score).toBe(5);
    expect(combined.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
  });
  it.each([
    ["warcrySpeed", "10% increased Warcry Speed", "10% reduced Warcry Speed", "1000% increased Skill Speed"],
    ["warcryCooldownRecoveryRate", "10% increased Warcry Cooldown Recovery Rate", "10% reduced Warcry Cooldown Recovery Rate", "1000% increased Cooldown Recovery Rate"],
    ["warcryAreaOfEffect", "Warcry Skills have 10% increased Area of Effect", "Warcry Skills have 10% reduced Area of Effect", "1000% increased Area of Effect"],
  ] as const)("routes toward signed %s without reusing a generic bonus or changing shortest", (id, positive, negative, generic) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, generic, `Minions have ${positive}`, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts shared Warcry and generic effects once in their own categories, excluding allocated base rewards", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Warcry Speed", "10% increased Warcry Cooldown Recovery Rate", "Warcry Skills have 10% increased Area of Effect",
    ] });
    const ids = ["warcrySpeed", "warcryCooldownRecoveryRate", "warcryAreaOfEffect"] as const;
    const generic = ["skillSpeed", "cooldownRecoveryRate", "areaOfEffect"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ids, ...generic].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => generic.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g);
    distinct.nodes.joint.stats.push("3% increased Skill Speed", "10% increased Cooldown Recovery Rate", "10% increased Area of Effect");
    const combined = optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options);
    expect(combined.pointCost).toBe(3); expect(combined.weighted?.score).toBe(6);
    expect(combined.weighted?.contributions.every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
  });
  it.each([
    ["recoupSpeed", "10% increased speed of Recoup Effects", "10% reduced speed of Recoup Effects"],
    ["flaskEffectDuration", "10% increased Flask Effect Duration", "10% reduced Flask Effect Duration"],
    ["lifeRecoveryOnKill", "Recover 1% of maximum Life on Kill", "Lose 1% of maximum Life on Kill"],
    ["manaRecoveryOnKill", "Recover 1% of maximum Mana on Kill", "Lose 1% of maximum Mana on Kill"],
  ] as const)("routes toward signed %s without inferring sustain or changing shortest", (id, positive, negative) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, `Minions have ${positive}`, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts Recoup speed, on-Kill amounts and flask duration independently on shared routes, excluding base rewards", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased speed of Recoup Effects", "Recover 1% of maximum Life on Kill", "Recover 1% of maximum Mana on Kill", "10% increased Flask Effect Duration",
    ] });
    const ids = ["recoupSpeed", "lifeRecoveryOnKill", "manaRecoveryOnKill", "flaskEffectDuration"] as const;
    const other = ["lifeRecoup", "manaRecoup", "energyShieldRecoup", "lifeRegenerationPercent", "lifeRegenerationRate", "manaRegenerationRate",
      "lifeFlaskRecovery", "manaFlaskRecovery", "flaskChargesGained", "lifeFlaskChargeGeneration", "manaFlaskChargeGeneration", "skillDuration"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ids, ...other].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(4);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(4);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => other.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g); distinct.nodes.joint.stats.push("3% of Damage taken Recouped as Life");
    expect(optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options).weighted?.score).toBe(5);
  });
  it.each([
    ["manaCostEfficiency", "10% increased Mana Cost Efficiency", "10% reduced Mana Cost Efficiency"],
    ["debuffExpirySpeed", "Debuffs on you expire 10% faster", "Debuffs on you expire 10% slower"],
  ] as const)("routes toward signed %s without changing shortest or scope", (id, positive, negative) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, `Minions have ${positive}`, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("routes toward a Life regeneration source without borrowing a rate-only or owned bonus", () => {
    const g = graph([["start", "source"], ["source", "goal"], ["start", "rate"], ["rate", "goal"]], {
      source: ["Regenerate 0.2% of maximum Life per second"], rate: ["100% increased Life Regeneration Rate", "Minions Regenerate 5% of maximum Life per second"],
    });
    const r = { ...request(g, 0), preferences: [{ id: "lifeRegenerationPercent" as const, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["source", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts sustain/expiry sources once per real stat on shared routes, excluding base rewards", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "Regenerate 0.2% of maximum Life per second", "10% increased Mana Cost Efficiency", "Debuffs on you expire 10% faster",
    ] });
    const ids = ["lifeRegenerationPercent", "manaCostEfficiency", "debuffExpirySpeed"] as const;
    const other = ["lifeRegenerationRate", "manaRegenerationRate", "skillDuration", "slowPotencyReduction", "minionReservationEfficiency"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ids, ...other].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => other.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g); distinct.nodes.joint.stats.push("10% increased Life Regeneration Rate");
    expect(optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options).weighted?.score).toBe(4);
  });
  it.each([
    ["armourBreakAmount", "Break ", "Armour"], ["fullyBrokenArmourEffect", "", "effect of Fully Broken Armour"], ["armourBreakDuration", "", "Armour Break Duration"],
  ] as const)("routes toward %s with required penalties and unchanged shortest", (id, prefix, wording) => {
    const positive = `${prefix}10% increased ${wording}`, negative = `${prefix}10% reduced ${wording}`;
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, `Minions have ${prefix}100% increased ${wording}`, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "armour", weight: 3 }, { id: "physicalDamage", weight: 3 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts distinct Armour Break preferences once on shared routes without base or generic-stat rewards", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "Break 10% increased Armour", "10% increased effect of Fully Broken Armour", "10% increased Armour Break Duration",
    ] });
    const ids = ["armourBreakAmount", "fullyBrokenArmourEffect", "armourBreakDuration"] as const;
    const generic = ["armour", "physicalDamage", "skillDuration"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ids, ...generic].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(3);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => generic.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g); distinct.nodes.joint.stats.push("10% increased Armour");
    expect(optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options).weighted?.score).toBeCloseTo(3 + 10 / 12);
  });
  it.each([
    ["fireResistance", "Fire Resistance", 5], ["coldResistance", "Cold Resistance", 5], ["lightningResistance", "Lightning Resistance", 5], ["chaosResistance", "Chaos Resistance", 5],
    ["maximumFireResistance", "Maximum Fire Resistance", 1], ["maximumColdResistance", "Maximum Cold Resistance", 1], ["maximumLightningResistance", "Maximum Lightning Resistance", 1],
  ] as const)("routes toward signed player %s without changing shortest or ownership", (id, wording, amount) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [`+${amount}% to ${wording}`], wrong: [`-${amount}% to ${wording}`, `Minions have +50% to ${wording}`, `+50% to ${wording} while Shapeshifted`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "firePenetration", weight: 3 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("separates ordinary and maximum elemental rewards while counting a shared node once", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: ["+5% to all Elemental Resistances", "+1% to all Maximum Elemental Resistances"] });
    const ordinary = ["fireResistance", "coldResistance", "lightningResistance"] as const;
    const maximum = ["maximumFireResistance", "maximumColdResistance", "maximumLightningResistance"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ordinary, ...maximum, "chaosResistance" as const].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(6);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(6);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.find((c) => c.id === "chaosResistance")).toMatchObject({ score: 0, nodeCount: 0 });
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    for (const [line, selected, other] of [["+5% to all Elemental Resistances", ordinary, maximum], ["+1% to all Maximum Elemental Resistances", maximum, ordinary]] as const) {
      const single = structuredClone(g); single.nodes.joint.stats = [line];
      const scored = optimizeWeightedBuildGoals({ ...r, graph: single }, undefined, options);
      expect(scored.pointCost).toBe(3); expect(scored.weighted?.score).toBe(3);
      expect(scored.weighted?.contributions.filter((c) => selected.some((id) => id === c.id)).every((c) => c.score === 1 && c.nodeCount === 1)).toBe(true);
      expect(scored.weighted?.contributions.filter((c) => other.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    }
  });
  it.each([
    ["slowPotencyReduction", "Slowing Potency of Debuffs on You"], ["curseEffectReduction", "effect of Curses on you"],
    ["chillEffectReduction", "Effect of Chill on you"], ["shockEffectReduction", "effect of Shock on you"],
  ] as const)("routes toward reduced incoming %s, retaining required increases and unchanged shortest", (id, wording) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [`10% reduced ${wording}`], wrong: [`10% increased ${wording}`, `Minions have 100% reduced ${wording}`, `100% reduced ${wording} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "curseMagnitude", weight: 3 }, { id: "chillMagnitude", weight: 3 }, { id: "shockMagnitude", weight: 3 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts shared incoming protection once per real stat, without outgoing fan-out or base-node rewards", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% reduced Slowing Potency of Debuffs on You", "10% reduced effect of Curses on you",
      "10% reduced Effect of Chill on you", "10% reduced effect of Shock on you",
    ] });
    const ids = ["slowPotencyReduction", "curseEffectReduction", "chillEffectReduction", "shockEffectReduction"] as const;
    const outgoing = ["curseMagnitude", "chillMagnitude", "shockMagnitude", "movementSpeed", "skillMovementPenaltyReduction"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ids, ...outgoing].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(4);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(4);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => outgoing.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g); distinct.nodes.joint.stats.push("10% increased Magnitude of Shock you inflict");
    expect(optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options).weighted?.score).toBe(5);
  });
  it.each([
    ["electrocuteBuildup", "Electrocute Buildup"], ["pinBuildup", "Pin Buildup"], ["dazeDuration", "Daze Duration"],
    ["damagingAilmentMagnitude", "Magnitude of Damaging Ailments you inflict"], ["damagingAilmentDuration", "Duration of Damaging Ailments on Enemies"],
  ] as const)("routes toward %s with signed penalties, correct ownership and unchanged shortest", (id, wording) => {
    const positive = `10% increased ${wording}`, negative = `10% reduced ${wording}`;
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, `Minions have 100% increased ${wording}`, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts shared generic ailment bonuses once without copying them to specific ailment preferences", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Electrocute Buildup", "10% increased Pin Buildup", "10% increased Daze Duration",
      "10% increased Magnitude of Damaging Ailments you inflict", "10% increased Duration of Damaging Ailments on Enemies",
    ] });
    const ids = ["electrocuteBuildup", "pinBuildup", "dazeDuration", "damagingAilmentMagnitude", "damagingAilmentDuration"] as const;
    const specific = ["poisonMagnitude", "bleedingMagnitude", "igniteMagnitude", "poisonDuration", "bleedingDuration", "igniteDuration", "dazeChance", "stunBuildup", "skillDuration"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [...ids, ...specific].map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(5);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(5);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => specific.some((id) => id === c.id)).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g); distinct.nodes.joint.stats.push("10% increased Poison Duration");
    expect(optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options).weighted?.score).toBe(6);
  });
  it.each([
    ["poisonChance", "5% chance to Poison on Hit", "-5% chance to Poison on Hit", "Minions have 100% chance to Poison on Hit"],
    ["bleedingChance", "5% chance to inflict Bleeding on Hit", "-5% chance to inflict Bleeding on Hit", "100% increased chance to inflict Ailments"],
    ["dazeChance", "5% chance to Daze on Hit", "-5% chance to Daze on Hit", "100% increased Daze Duration"],
    ["ailmentChance", "10% increased chance to inflict Ailments", "10% reduced chance to inflict Ailments", "100% chance to Poison on Hit"],
    ["blindChance", "5% chance to Blind Enemies on Hit", "-5% chance to Blind Enemies on Hit", "100% increased Blind Effect"],
    ["blindEffect", "10% increased Blind Effect", "10% reduced Blind Effect", "100% increased Blind duration"],
    ["blindDuration", "10% increased Blind duration", "10% reduced Blind duration", "100% chance to Blind Enemies on Hit"],
    ["hinderDuration", "10% increased Hinder Duration", "10% reduced Hinder Duration", "Debuffs you inflict have 100% increased Slow Magnitude"],
    ["knockbackDistance", "10% increased Knockback Distance", "10% reduced Knockback Distance", "80% less Knockback Distance for Blocked Hits"],
    ["markEffect", "10% increased Effect of your Mark Skills", "10% reduced Effect of your Mark Skills", "100% increased Curse Magnitudes"],
    ["markUseSpeed", "Mark Skills have 10% increased Use Speed", "Mark Skills have 10% reduced Use Speed", "100% increased Skill Speed"],
    ["markDuration", "Mark Skills have 10% increased Skill Effect Duration", "Mark Skills have 10% reduced Skill Effect Duration", "100% increased Skill Effect Duration"],
    ["exposureEffect", "10% increased Exposure Effect", "10% reduced Exposure Effect", "Exposure you inflict lowers Resistances by an additional 5%"],
  ] as const)("routes toward %s without conflating chance types or changing shortest", (id, positive, negative, wrong) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, wrong, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts Mark and Exposure sources once on shared branches without generic timing or elemental fanout", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "20% increased Effect of your Mark Skills", "5% reduced Effect of your Mark Skills",
      "Mark Skills have 30% increased Use Speed", "Mark Skills have 10% reduced Use Speed",
      "Mark Skills have 25% increased Skill Effect Duration", "Mark Skills have 5% reduced Skill Effect Duration",
      "10% increased Exposure Effect", "20% increased Exposure Effect", "5% reduced Exposure Effect",
      "Exposure you inflict lowers Resistances by an additional 5%", "100% increased Critical Hit Chance against Marked Enemies",
    ] });
    const ids = ["markEffect", "markUseSpeed", "markDuration", "exposureEffect", "skillSpeed", "skillDuration", "curseMagnitude", "curseDuration", "firePenetration", "coldPenetration", "lightningPenetration"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: ids.map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(8);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toMatchObject([
      { id: "markEffect", score: 1.5, nodeCount: 1 }, { id: "markUseSpeed", score: 2, nodeCount: 1 },
      { id: "markDuration", score: 2, nodeCount: 1 }, { id: "exposureEffect", score: 2.5, nodeCount: 1 },
    ]);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g); distinct.nodes.joint.stats.push("3% increased Skill Speed", "10% increased Skill Effect Duration",
      "6% increased Curse Magnitudes", "20% increased Curse Duration", "Damage Penetrates 5% Fire Resistance");
    expect(optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options).weighted?.score).toBe(13);
  });
  it("scores separate chance categories once on a shared branch, never as probability or extra point cost", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "5% chance to Poison on Hit", "5% chance to inflict Bleeding on Hit", "5% chance to Daze on Hit", "10% increased chance to inflict Ailments",
    ] });
    const ids = ["poisonChance", "bleedingChance", "dazeChance", "ailmentChance"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: ids.map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(4);
    expect(result.weighted?.contributions.every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    for (const [line, expectedId] of [["10% increased chance to inflict Ailments", "ailmentChance"], ["5% chance to Poison on Hit", "poisonChance"]]) {
      const single = structuredClone(g); single.nodes.joint.stats = [line];
      const scored = optimizeWeightedBuildGoals({ ...r, graph: single }, undefined, options);
      expect(scored.pointCost).toBe(3); expect(scored.weighted?.score).toBe(1);
      expect(scored.weighted?.contributions.filter((c) => c.score !== 0)).toMatchObject([{ id: expectedId, score: 1, nodeCount: 1 }]);
      expect(scored.weighted?.contributions.filter((c) => c.id !== expectedId).every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    }
  });
  it.each([
    ["blindChance", "chance to Blind Enemies on Hit with Attacks", "lightning-arrow", "spark"],
    ["hinderChance", "chance to Hinder Enemies on Hit with Spells", "spark", "lightning-arrow"],
  ] as const)("routes toward %s only on matching player-hit focuses without changing shortest", (id, wording, focusSkillId, wrongFocus) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "plain"], ["plain", "goal"]], {
      benefit: [`5% ${wording}`], plain: [`-5% ${wording}`, `100% ${wording} while stationary`],
    });
    const r = { ...request(g, 0), focusSkillId, preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["plain"] }, undefined, options);
    expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    for (const focusSkillId of [wrongFocus, "contagion", "dark-effigy", "skeletal-arsonist", undefined]) {
      expect(optimizeWeightedBuildGoals({ ...r, focusSkillId }, undefined, options).weighted?.score).toBe(0);
    }
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "ailmentChance", weight: 3 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each([
    ["maimChance", "Attacks have 5% chance to Maim on Hit", "Attacks have -5% chance to Maim on Hit"],
    ["incisionChance", "5% chance for Attack Hits to apply Incision", "-5% chance for Attack Hits to apply Incision"],
  ] as const)("routes toward %s only for reviewed player attack hits, retaining required penalties and shortest behavior", (id, positive, negative) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "plain"], ["plain", "goal"]], {
      benefit: [positive], plain: [negative, `${positive} against Poisoned Enemies`],
    });
    const r = { ...request(g, 0), focusSkillId: "lightning-arrow", preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["plain"] }, undefined, options);
    expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    for (const focusSkillId of ["spark", "contagion", "dark-effigy", "skeletal-arsonist", undefined]) {
      expect(optimizeWeightedBuildGoals({ ...r, focusSkillId }, undefined, options).weighted?.score).toBe(0);
    }
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "bleedingChance", weight: 3 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts Knockback/Maim/Incision effects once on shared branches, not as damage or extra base reward", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "20% increased Knockback Distance", "5% reduced Knockback Distance", "Attacks have 10% chance to Maim on Hit",
      "Attacks have 15% chance to Maim on Hit", "Attacks have -5% chance to Maim on Hit",
      "20% chance for Attack Hits to apply Incision", "40% chance for Attack Hits to apply Incision", "-10% chance for Attack Hits to apply Incision",
      "10% chance for Attack Hits to apply ten Incision", "50% increased effect of Incision", "100% increased Attack Damage against Maimed Enemies",
    ] });
    const ids = ["knockbackDistance", "maimChance", "incisionChance", "bleedingChance", "bleedingMagnitude", "slowMagnitude", "stunBuildup", "attackDamage", "ailmentChance"] as const;
    const r = { ...request(g, 0), focusSkillId: "lightning-spear", goalNodeIds: ["goal", "second"], preferences: ids.map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(15.5);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toMatchObject([
      { id: "knockbackDistance", score: 1.5, nodeCount: 1 }, { id: "maimChance", score: 4, nodeCount: 1 }, { id: "incisionChance", score: 10, nodeCount: 1 },
    ]);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g); distinct.nodes.joint.stats.push("5% chance to inflict Bleeding on Hit");
    expect(optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options).weighted?.score).toBe(16.5);
  });
  it.each(["lightning-arrow", "spark"])("counts Blind/Hinder application, strength and duration once on shared %s branches", (focusSkillId) => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "5% chance to Blind Enemies on Hit", "10% chance to Blind Enemies on Hit with Attacks",
      "20% increased Blind Effect", "5% reduced Blind Effect", "25% increased Blind duration", "5% reduced Blind duration",
      "15% chance to Hinder Enemies on Hit with Spells", "30% increased Hinder Duration", "10% reduced Hinder Duration",
      "Debuffs you inflict have 4% increased Slow Magnitude", "100% increased Damage with Hits against Blinded Enemies",
      "100% increased Damage with Hits against Hindered Enemies",
    ] });
    const ids = ["blindChance", "blindEffect", "blindDuration", "hinderChance", "hinderDuration", "slowMagnitude", "skillDuration", "ailmentChance", "genericDamage"] as const;
    const r = { ...request(g, 0), focusSkillId, goalNodeIds: ["goal", "second"], preferences: ids.map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBeCloseTo(focusSkillId === "spark" ? 9.9 : 8.9);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0).every((c) => c.nodeCount === 1)).toBe(true);
    expect(result.weighted?.contributions.filter((c) => ["skillDuration", "ailmentChance", "genericDamage"].includes(c.id)).every((c) => c.score === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
  });
  it.each([
    ["genericDamage", "10% increased Damage", "10% reduced Damage", "Minions deal 100% increased Damage"],
    ["skillSpeed", "3% increased Skill Speed", "3% reduced Skill Speed", "30% increased Attack Speed"],
    ["chillMagnitude", "10% increased Magnitude of Chill you inflict", "10% reduced Magnitude of Chill you inflict", "100% increased Cold Damage"],
  ] as const)("routes toward unconditional %s, retains required penalties and leaves shortest unchanged", (id, positive, negative, wrong) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      benefit: [positive], wrong: [negative, wrong, `${positive} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("does not re-reward a generic Skill Speed line through other speed preferences or shared/base nodes", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: ["3% increased Skill Speed"] });
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [
      { id: "skillSpeed" as const, weight: 2 }, { id: "attackSpeed" as const, weight: 3 }, { id: "castSpeed" as const, weight: 3 },
      { id: "totemPlacementSpeed" as const, weight: 3 }, { id: "totemAttackSpeed" as const, weight: 3 }, { id: "totemCastSpeed" as const, weight: 3 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions.filter((c) => c.score !== 0)).toMatchObject([{ id: "skillSpeed", score: 2, nodeCount: 1 }]);
    expect(result.weighted?.contributions.filter((c) => c.id !== "skillSpeed").every((c) => c.score === 0 && c.nodeCount === 0)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
    const distinct = structuredClone(g); distinct.nodes.joint.stats.push("3% increased Attack Speed");
    const mixed = optimizeWeightedBuildGoals({ ...r, graph: distinct }, undefined, options);
    expect(mixed.weighted?.score).toBe(5);
    expect(mixed.weighted?.contributions.filter((c) => c.score !== 0)).toHaveLength(2);
  });
  it.each([
    ["totemAreaOfEffect", "10% increased Area of Effect for Skills used by Totems", "10% reduced Area of Effect for Skills used by Totems", "100% increased Area of Effect", -2],
    ["totemPlacementRange", "10% increased Totem Placement range", "10% reduced Totem Placement range", "100% increased Totem Placement speed", -2],
    ["totemFireResistance", "Totems gain +5% to all Elemental Resistances", "Totems gain -5% to all Elemental Resistances", "Minions have +50% to all Elemental Resistances", -2],
    ["totemColdResistance", "Totems gain +5% to all Elemental Resistances", "Totems gain -5% to all Elemental Resistances", "Companions have +50% to all Elemental Resistances", -2],
    ["totemLightningResistance", "Totems gain +5% to all Elemental Resistances", "Totems gain -5% to all Elemental Resistances", "+50% to all Elemental Resistances", -2],
    ["totemMaximumFireResistance", "Totems gain +1% to all Maximum Elemental Resistances", "Totems gain -1% to all Maximum Elemental Resistances", "Totems gain +50% to all Elemental Resistances", -2],
    ["totemMaximumColdResistance", "Totems gain +1% to all Maximum Elemental Resistances", "Totems gain -1% to all Maximum Elemental Resistances", "Minions have +10% to all Maximum Elemental Resistances", -2],
    ["totemMaximumLightningResistance", "Totems gain +1% to all Maximum Elemental Resistances", "Totems gain -1% to all Maximum Elemental Resistances", "+10% to all Maximum Elemental Resistances", -2],
    ["totemPhysicalDamageReduction", "Totems have 3% additional Physical Damage Reduction", "Totems have -3% additional Physical Damage Reduction", "Minions have 30% additional Physical Damage Reduction", -2],
    ["totemLifeRegeneration", "Totems Regenerate 1% of maximum Life per second", "Totems Regenerate 0% of maximum Life per second", "100% increased Life Regeneration Rate", 0],
  ] as const)("routes toward %s without borrowing another owner's effect or changing shortest", (id, positive, negative, wrong, penaltyScore) => {
    const g = graph([["start", "owned"], ["owned", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      owned: [positive], wrong: [negative, wrong, `${positive} per Summoned Totem`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["owned", "goal"]));
    expect(result.pointCost).toBe(2); expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong"); expect(required.pointCost).toBe(1); expect(required.weighted?.score).toBe(penaltyScore);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("scores elemental fan-out and Totem recovery once per selected category on a shared branch, not the base", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Area of Effect for Skills used by Totems", "10% increased Totem Placement range", "Totems gain +5% to all Elemental Resistances",
      "Totems gain +1% to all Maximum Elemental Resistances", "Totems have 3% additional Physical Damage Reduction", "Totems Regenerate 1% of maximum Life per second",
    ] });
    const ids = ["totemAreaOfEffect", "totemPlacementRange", "totemFireResistance", "totemColdResistance", "totemLightningResistance",
      "totemMaximumFireResistance", "totemMaximumColdResistance", "totemMaximumLightningResistance", "totemPhysicalDamageReduction", "totemLifeRegeneration"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: ids.map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(10);
    expect(result.weighted?.contributions).toHaveLength(10);
    expect(result.weighted?.contributions.every((c) => c.nodeCount === 1 && c.score === 1)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2); expect(base.weighted?.score).toBe(0);
  });
  it.each([
    ["totemDamage", "10% increased Totem Damage", "10% reduced Totem Damage", "Minions deal 100% increased Damage"],
    ["totemLife", "10% increased Totem Life", "10% reduced Totem Life", "100% increased maximum Life"],
    ["totemPlacementSpeed", "10% increased Totem Placement speed", "10% reduced Totem Placement speed", "100% increased Cast Speed"],
    ["totemDuration", "10% increased Totem Duration", "10% reduced Totem Duration", "100% increased Skill Effect Duration"],
    ["totemAttackSpeed", "Attacks used by Totems have 3% increased Attack Speed", "Attacks used by Totems have 3% reduced Attack Speed", "Minions have 30% increased Attack Speed"],
    ["totemCastSpeed", "Spells Cast by Totems have 3% increased Cast Speed", "Spells Cast by Totems have 3% reduced Cast Speed", "30% increased Cast Speed"],
  ] as const)("routes toward explicit %s without borrowing other owners' effects or changing shortest", (id, positive, negative, wrong) => {
    const g = graph([["start", "owned"], ["owned", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      owned: [positive], wrong: [negative, wrong, `${positive} per Summoned Totem`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["owned", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong");
    expect(required.pointCost).toBe(1);
    expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts separate Totem effects once on a shared branch, not on already allocated base nodes", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Totem Damage", "10% increased Totem Life", "10% increased Totem Placement speed", "10% increased Totem Duration",
      "Attacks used by Totems have 3% increased Attack Speed", "Spells Cast by Totems have 3% reduced Cast Speed",
      "100% increased Attack Damage", "100% increased maximum Life", "Minions have 30% increased Attack and Cast Speed",
    ] });
    const ids = ["totemDamage", "totemLife", "totemPlacementSpeed", "totemDuration", "totemAttackSpeed", "totemCastSpeed"] as const;
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: ids.map((id) => ({ id, weight: 1 })) };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(4);
    expect(result.weighted?.contributions).toHaveLength(6);
    expect(result.weighted?.contributions.every((c) => c.nodeCount === 1)).toBe(true);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it.each([
    ["attackAreaDamage", "Attack Area Damage", "ice-strike", "lightning-arrow"],
    ["elementalDamage", "Elemental Damage with Attacks", "ice-shot", "rain-of-arrows"],
    ["criticalDamageBonus", "Critical Spell Damage Bonus", "bonestorm", "contagion"],
    ["criticalDamageBonus", "Critical Damage Bonus for Attack Damage", "ice-shot", "fireball"],
    ["areaDamage", "Area Damage", "fireball", "contagion"],
    ["areaDamage", "Area Damage", "tempest-flurry", "lightning-spear"],
    ["accuracy", "Accuracy Rating with Bows", "ice-shot", "fireball"],
    ["accuracy", "Accuracy Rating with Spears", "lightning-spear", "ice-shot"],
    ["accuracy", "Accuracy Rating with Quarterstaves", "ice-strike", "boneshatter"],
    ["criticalDamageBonus", "Critical Damage Bonus with Bows", "rain-of-arrows", "fireball"],
    ["criticalDamageBonus", "Critical Damage Bonus with Spears", "explosive-spear", "ice-strike"],
    ["criticalDamageBonus", "Critical Damage Bonus with Quarterstaves", "tempest-flurry", "boneshatter"],
    ["stunBuildup", "Stun Buildup with Melee Damage", "rolling-slam", "lightning-spear"],
    ["stunBuildup", "Stun Buildup with Quarterstaves", "tempest-flurry", "rolling-slam"],
    ["stunBuildup", "Stun Buildup with Maces", "boneshatter", "ice-strike"],
    ["freezeBuildup", "Freeze Buildup with Quarterstaves", "ice-strike", "tempest-flurry"],
    ["attackDamage", "Damage with Two Handed Weapons", "ice-shot", "boneshatter"],
    ["accuracy", "Accuracy Rating with Two Handed Melee Weapons", "ice-strike", "ice-shot"],
    ["attackDamage", "Damage with One Handed Weapons", "lightning-spear", "boneshatter"],
    ["attackSpeed", "Attack Speed with One Handed Weapons", "lightning-spear", "ice-strike", 3],
    ["attackSpeed", "Attack Speed with One Handed Melee Weapons", "explosive-spear", "boneshatter", 3],
    ["accuracy", "Accuracy Rating with One Handed Melee Weapons", "lightning-spear", "ice-shot"],
    ["criticalChance", "Critical Hit Chance with One Handed Melee Weapons", "lightning-spear", "boneshatter", 15],
    ["criticalDamageBonus", "Critical Damage Bonus with One Handed Melee Weapons", "explosive-spear", "ice-strike"],
  ] as const)("routes toward %s only with a reviewed skill scope and keeps shortest untouched", (id, wording, focusSkillId, wrongFocus, unit: number = 10) => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "plain"], ["plain", "goal"]], {
      benefit: [`${unit}% increased ${wording}`], plain: [`${unit}% reduced ${wording}`, `100% increased ${wording} while stationary`],
    });
    const r = { ...request(g, 0), focusSkillId, preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["plain"] }, undefined, options);
    expect(required.pointCost).toBe(1);
    expect(required.weighted?.score).toBe(-2);
    for (const context of [{ focusSkillId: wrongFocus }, { focusSkillId: undefined }]) {
      expect(optimizeWeightedBuildGoals({ ...r, ...context }, undefined, options).weighted?.score).toBe(0);
    }
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("routes toward one-handed attack ailment chance only when selected for a reviewed spear focus", () => {
    const g = graph([["start", "benefit"], ["benefit", "goal"], ["start", "plain"], ["plain", "goal"]], {
      benefit: ["Attacks with One-Handed Weapons have 10% increased Chance to inflict Ailments"],
      plain: ["Attacks with One-Handed Weapons have 10% reduced Chance to inflict Ailments",
        "Attacks with One-Handed Weapons have 100% increased Chance to inflict Ailments while stationary"],
    });
    const r = { ...request(g, 0), focusSkillId: "lightning-spear", preferences: [{ id: "ailmentChance" as const, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["benefit", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id: "ailmentChance", score: 2, nodeCount: 1 }]);
    expect(optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["plain"] }, undefined, options).weighted?.score).toBe(-2);
    for (const focusSkillId of [undefined, "boneshatter", "spark"]) {
      expect(optimizeWeightedBuildGoals({ ...r, focusSkillId }, undefined, options).weighted?.score).toBe(0);
    }
    for (const id of ["poisonChance", "bleedingChance", "dazeChance", "criticalChance"] as const) {
      expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id, weight: 3 }] }, undefined, options).weighted?.score).toBe(0);
    }
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each(["lightning-spear", "explosive-spear"])("counts critical/ailment overlap once on a shared %s branch, not again for the base", (focusSkillId) => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "15% increased Critical Hit Chance", "15% increased Critical Hit Chance for Attacks", "10% increased Critical Hit Chance with Spears",
      "25% increased Critical Hit Chance with One Handed Melee Weapons", "5% reduced Critical Hit Chance with One Handed Melee Weapons",
      "10% increased Critical Damage Bonus", "20% increased Critical Damage Bonus for Attack Damage", "30% increased Critical Damage Bonus with Spears",
      "40% increased Critical Damage Bonus with One Handed Melee Weapons", "5% reduced Critical Damage Bonus with One Handed Melee Weapons",
      "10% increased chance to inflict Ailments", "Attacks with One-Handed Weapons have 20% increased Chance to inflict Ailments",
      "Attacks with One-Handed Weapons have 5% reduced Chance to inflict Ailments",
    ] });
    const r = { ...request(g, 0), focusSkillId, goalNodeIds: ["goal", "second"], preferences: [
      { id: "criticalChance" as const, weight: 1 }, { id: "criticalDamageBonus" as const, weight: 1 }, { id: "ailmentChance" as const, weight: 1 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 16, contributions: [
      { id: "criticalChance", score: 4, nodeCount: 1 }, { id: "criticalDamageBonus", score: 9.5, nodeCount: 1 }, { id: "ailmentChance", score: 2.5, nodeCount: 1 },
    ] });
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it("counts scoped mixed effects once on a shared branch and does not re-reward allocated base nodes", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Attack Area Damage", "12% increased Elemental Damage with Attacks", "8% increased Elemental Damage",
    ] });
    const r = { ...request(g, 0), focusSkillId: "ice-strike", goalNodeIds: ["goal", "second"], preferences: [
      { id: "attackAreaDamage" as const, weight: 1 }, { id: "elementalDamage" as const, weight: 1 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(3);
    expect(result.weighted?.contributions).toMatchObject([{ id: "attackAreaDamage", score: 1, nodeCount: 1 }, { id: "elementalDamage", score: 2, nodeCount: 1 }]);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it("counts generic area and attack critical effects once on shared nodes, never re-rewarding the base", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Area Damage", "20% increased Attack Area Damage", "30% increased Spell Area Damage",
      "10% increased Critical Damage Bonus", "20% increased Critical Damage Bonus for Attack Damage",
      "5% reduced Critical Damage Bonus for Attack Damage", "30% increased Critical Spell Damage Bonus",
    ] });
    const r = { ...request(g, 0), focusSkillId: "ice-strike", goalNodeIds: ["goal", "second"], preferences: [
      { id: "areaDamage" as const, weight: 1 }, { id: "attackAreaDamage" as const, weight: 1 },
      { id: "spellAreaDamage" as const, weight: 1 }, { id: "criticalDamageBonus" as const, weight: 1 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3);
    expect(new Set(result.addedNodeIds).size).toBe(3);
    expect(result.weighted).toMatchObject({ score: 5.5, contributions: [
      { id: "areaDamage", score: 1, nodeCount: 1 }, { id: "attackAreaDamage", score: 2, nodeCount: 1 },
      { id: "spellAreaDamage", score: 0, nodeCount: 0 }, { id: "criticalDamageBonus", score: 2.5, nodeCount: 1 },
    ] });
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it.each([["ice-shot", "Bows", "Spears"], ["lightning-spear", "Spears", "Quarterstaves"], ["ice-strike", "Quarterstaves", "Bows"]])
    ("counts %s combat sources once on shared branches and never rewards the base again", (focusSkillId, weapon, other) => {
      const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
        "10% increased Accuracy Rating", `20% increased Accuracy Rating with ${weapon}`, `5% reduced Accuracy Rating with ${weapon}`,
        "10% increased Critical Damage Bonus", "30% increased Critical Damage Bonus for Attack Damage",
        `20% increased Critical Damage Bonus with ${weapon}`, `5% reduced Critical Damage Bonus with ${weapon}`,
        `100% increased Accuracy Rating with ${other}`, `100% increased Critical Damage Bonus with ${other}`,
      ] });
      const r = { ...request(g, 0), focusSkillId, goalNodeIds: ["goal", "second"], preferences: [
        { id: "accuracy" as const, weight: 1 }, { id: "criticalDamageBonus" as const, weight: 1 },
      ] };
      const result = optimizeWeightedBuildGoals(r, undefined, options);
      expect(result.pointCost).toBe(3);
      expect(new Set(result.addedNodeIds).size).toBe(3);
      expect(result.weighted).toMatchObject({ score: 8, contributions: [
        { id: "accuracy", score: 2.5, nodeCount: 1 }, { id: "criticalDamageBonus", score: 5.5, nodeCount: 1 },
      ] });
      const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
      expect(base.pointCost).toBe(2);
      expect(base.weighted?.score).toBe(0);
    });
  it("counts generic, melee and weapon buildup once on a shared branch, with no reward for existing base nodes", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Stun Buildup", "20% increased Stun Buildup with Melee Damage", "30% increased Stun Buildup with Quarterstaves",
      "5% reduced Stun Buildup with Quarterstaves", "40% increased Stun Buildup with Maces", "10% increased Freeze Buildup",
      "20% increased Freeze Buildup with Quarterstaves", "5% reduced Freeze Buildup with Quarterstaves",
    ] });
    const r = { ...request(g, 0), focusSkillId: "ice-strike", goalNodeIds: ["goal", "second"], preferences: [
      { id: "stunBuildup" as const, weight: 1 }, { id: "freezeBuildup" as const, weight: 1 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3);
    expect(new Set(result.addedNodeIds).size).toBe(3);
    expect(result.weighted).toMatchObject({ score: 8, contributions: [
      { id: "stunBuildup", score: 5.5, nodeCount: 1 }, { id: "freezeBuildup", score: 2.5, nodeCount: 1 },
    ] });
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it.each([["ice-strike", "Quarterstaves", true], ["tempest-flurry", "Quarterstaves", true], ["ice-shot", "Bows", false]] as const)
    ("counts %s generic/weapon/handedness sources once on shared branches and excludes base rewards", (focusSkillId, weapon, melee) => {
      const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
        "10% increased Attack Damage", `20% increased Damage with ${weapon}`, "30% increased Damage with Two Handed Weapons",
        "5% reduced Damage with Two Handed Weapons", "10% increased Accuracy Rating", `20% increased Accuracy Rating with ${weapon}`,
        "30% increased Accuracy Rating with Two Handed Melee Weapons", "5% reduced Accuracy Rating with Two Handed Melee Weapons",
        "100% increased Accuracy Rating with One Handed Melee Weapons",
      ] });
      const r = { ...request(g, 0), focusSkillId, goalNodeIds: ["goal", "second"], preferences: [
        { id: "attackDamage" as const, weight: 1 }, { id: "accuracy" as const, weight: 1 },
      ] };
      const result = optimizeWeightedBuildGoals(r, undefined, options);
      expect(result.pointCost).toBe(3);
      expect(new Set(result.addedNodeIds).size).toBe(3);
      expect(result.weighted).toMatchObject({ score: melee ? 11 : 8.5, contributions: [
        { id: "attackDamage", score: 5.5, nodeCount: 1 }, { id: "accuracy", score: melee ? 5.5 : 3, nodeCount: 1 },
      ] });
      const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
      expect(base.pointCost).toBe(2);
      expect(base.weighted?.score).toBe(0);
    });
  it.each(["lightning-spear", "explosive-spear"])("counts %s generic/spear/handedness sources once on shared branches and excludes base rewards", (focusSkillId) => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "10% increased Attack Damage", "20% increased Damage with Spears", "30% increased Damage with One Handed Weapons",
      "5% reduced Damage with One Handed Weapons", "3% increased Attack Speed", "6% increased Attack Speed with Spears",
      "4% increased Attack Speed with One Handed Weapons", "5% increased Attack Speed with One Handed Melee Weapons",
      "2% reduced Attack Speed with One Handed Weapons", "1% reduced Attack Speed with One Handed Melee Weapons",
      "10% increased Accuracy Rating", "20% increased Accuracy Rating with Spears", "30% increased Accuracy Rating with One Handed Melee Weapons",
      "5% reduced Accuracy Rating with One Handed Melee Weapons", "100% increased Damage with Two Handed Weapons",
      "100% increased Accuracy Rating with Two Handed Melee Weapons", "10% increased Melee Damage", "7% increased Skill Speed",
    ] });
    const r = { ...request(g, 0), focusSkillId, goalNodeIds: ["goal", "second"], preferences: [
      { id: "attackDamage" as const, weight: 1 }, { id: "attackSpeed" as const, weight: 1 }, { id: "accuracy" as const, weight: 1 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.pointCost).toBe(3);
    expect(new Set(result.addedNodeIds).size).toBe(3);
    expect(result.weighted).toMatchObject({ score: 16, contributions: [
      { id: "attackDamage", score: 5.5, nodeCount: 1 }, { id: "attackSpeed", score: 5, nodeCount: 1 }, { id: "accuracy", score: 5.5, nodeCount: 1 },
    ] });
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it("filters scoped spell critical bonus during routing under Controlled Destruction", () => {
    const g = graph([["start", "generic"], ["generic", "goal"], ["start", "scoped"], ["scoped", "goal"]], {
      generic: ["10% increased Critical Damage Bonus"], scoped: ["30% increased Critical Spell Damage Bonus"],
    });
    const r = { ...request(g, 0), focusSkillId: "fireball", preferences: [{ id: "criticalDamageBonus" as const, weight: 1 }] };
    expect(optimizeWeightedBuildGoals(r, undefined, options).addedNodeIds).toContain("scoped");
    const blocked = optimizeWeightedBuildGoals({ ...r, supportGemIds: ["controlled-destruction"] }, undefined, options);
    expect(blocked.addedNodeIds).toContain("generic");
    expect(blocked.weighted?.score).toBe(1);
  });
  it.each([
    ["companionDamage", "Companions deal 10% increased Damage", "Companions deal 10% reduced Damage", "Minions deal 100% increased Damage"],
    ["companionLife", "Companions have 10% increased maximum Life", "Companions have 10% reduced maximum Life", "Minions have 100% increased maximum Life"],
    ["companionAttackSpeed", "Companions have 3% increased Attack Speed", "Companions have 3% reduced Attack Speed", "Minions have 30% increased Attack Speed"],
    ["companionMovementSpeed", "Companions have 5% increased Movement Speed", "Companions have 5% reduced Movement Speed", "50% increased Movement Speed"],
    ["companionAreaOfEffect", "Companions have 10% increased Area of Effect", "Companions have 10% reduced Area of Effect", "Minions have 100% increased Area of Effect"],
    ["companionFireResistance", "Companions have +5% to Fire Resistance", "Companions have -5% to Fire Resistance", "Minions have +50% to Fire Resistance"],
    ["companionColdResistance", "Companions have +5% to Cold Resistance", "Companions have -5% to Cold Resistance", "Companions have +50% to Maximum Cold Resistances"],
    ["companionLightningResistance", "Companions have +5% to Lightning Resistance", "Companions have -5% to Lightning Resistance", "+50% to Lightning Resistance"],
    ["companionChaosResistance", "Companions have +5% to Chaos Resistance", "Companions have -5% to Chaos Resistance", "Companions have +50% to all Elemental Resistances"],
    ["companionReservationEfficiency", "5% increased Reservation Efficiency of Companion Skills", "5% reduced Reservation Efficiency of Companion Skills", "50% increased Reservation Efficiency of Minion Skills"],
  ] as const)("routes toward explicit %s while retaining penalties, required goals and shortest behavior", (id, positive, negative, wrong) => {
    const g = graph([["start", "owned"], ["owned", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      owned: [positive], wrong: [negative, wrong, `${positive} while on Full Life`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["owned", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong");
    expect(required.pointCost).toBe(1);
    expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("scores Companion and broader minion effects separately once on a shared node without re-rewarding base allocation", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "Companions deal 10% increased Damage", "Minions deal 10% increased Damage", "Companions have +5% to all Elemental Resistances",
      "5% reduced Reservation Efficiency of Companion Skills",
    ] });
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [
      { id: "companionDamage" as const, weight: 1 }, { id: "minionDamage" as const, weight: 1 },
      { id: "companionFireResistance" as const, weight: 1 }, { id: "companionColdResistance" as const, weight: 1 },
      { id: "companionLightningResistance" as const, weight: 1 }, { id: "companionReservationEfficiency" as const, weight: 1 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["joint", "goal", "second"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(4);
    expect(result.weighted?.contributions).toHaveLength(6);
    for (const contribution of result.weighted!.contributions) expect(contribution.nodeCount).toBe(1);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it.each([
    ["minionCommandDamage", "Minions deal 10% increased Damage with Command Skills", "Minions deal 10% reduced Damage with Command Skills", "Minions deal 100% increased Damage"],
    ["minionCommandCooldownRecovery", "Minions have 10% increased Cooldown Recovery Rate for Command Skills", "Minions have 10% reduced Cooldown Recovery Rate for Command Skills", "100% increased Cooldown Recovery Rate"],
    ["minionDuration", "10% increased Minion Duration", "10% reduced Minion Duration", "100% increased Skill Effect Duration"],
    ["minionReservationEfficiency", "5% increased Reservation Efficiency of Minion Skills", "5% reduced Reservation Efficiency of Minion Skills", "50% increased Mana Cost Efficiency of Command Skills"],
  ] as const)("routes toward explicit %s without mixing generic effects or changing shortest routing", (id, positive, negative, wrong) => {
    const g = graph([["start", "owned"], ["owned", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      owned: [positive], wrong: [negative, wrong, `${positive} while on Full Life`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["owned", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong");
    expect(required.pointCost).toBe(1);
    expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("scores a shared command/duration/reservation node once and never rewards existing base nodes again", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "Minions deal 10% increased Damage with Command Skills", "Minions have 10% reduced Cooldown Recovery Rate for Command Skills",
      "10% increased Minion Duration", "5% increased Reservation Efficiency of Minion Skills",
    ] });
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [
      { id: "minionCommandDamage" as const, weight: 1 }, { id: "minionCommandCooldownRecovery" as const, weight: 1 },
      { id: "minionDuration" as const, weight: 1 }, { id: "minionReservationEfficiency" as const, weight: 1 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["joint", "goal", "second"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toHaveLength(4);
    for (const contribution of result.weighted!.contributions) expect(contribution.nodeCount).toBe(1);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it.each([
    ["minionEvasion", "Minions have 12% increased Evasion Rating", "Minions have 12% reduced Evasion Rating", "120% increased Evasion Rating", 1, -1],
    ["minionPhysicalDamageReduction", "Minions have 3% additional Physical Damage Reduction", "Minions have -3% additional Physical Damage Reduction", "Minions take 30% reduced Physical Damage", 1, -1],
    ["minionLifeRecoup", "Minions Recoup 3% of Damage taken as Life", "Minions Recoup 0% of Damage taken as Life", "30% of Damage taken Recouped as Life", 1, 0],
    ["minionMaximumFireResistance", "Minions have +1% to Maximum Fire Resistances", "Minions have -1% to Maximum Fire Resistances", "Minions have +50% to Fire Resistance", 1, -1],
    ["minionMaximumColdResistance", "Minions have +1% to Maximum Cold Resistances", "Minions have -1% to Maximum Cold Resistances", "+50% to Maximum Cold Resistances", 1, -1],
    ["minionMaximumLightningResistance", "Minions have +1% to Maximum Lightning Resistances", "Minions have -1% to Maximum Lightning Resistances", "Minions have +50% to Lightning Resistance", 1, -1],
  ] as const)("routes toward %s only when selected, retaining signed raw modifiers and shortest behavior", (id, positive, negative, wrong, score, penalty) => {
    const g = graph([["start", "owned"], ["owned", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      owned: [positive], wrong: [negative, wrong, `${positive} while on Full Life`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["owned", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(score * 2);
    expect(result.weighted?.contributions).toMatchObject([{ id, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong");
    expect(required.pointCost).toBe(1);
    expect(required.weighted?.score).toBe(penalty * 2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("keeps ordinary resistance, cap modifiers and recoup separate on a shared route node", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: [
      "Minions have +2% to all Maximum Elemental Resistances", "Minions have +10% to all Elemental Resistances", "Minions Recoup 3% of Damage taken as Life",
    ] });
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [
      { id: "minionMaximumFireResistance" as const, weight: 1 }, { id: "minionMaximumColdResistance" as const, weight: 1 },
      { id: "minionMaximumLightningResistance" as const, weight: 1 }, { id: "minionLifeRecoup" as const, weight: 1 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["joint", "goal", "second"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(7);
    expect(result.weighted?.contributions).toHaveLength(4);
    for (const contribution of result.weighted!.contributions) expect(contribution.nodeCount).toBe(1);
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it.each([
    ["minionCriticalChance", "Minions have 15% increased Critical Hit Chance", "Minions have 15% reduced Critical Hit Chance", "150% increased Critical Hit Chance"],
    ["minionCriticalDamageBonus", "Minions have 10% increased Critical Damage Bonus", "Minions have 10% reduced Critical Damage Bonus", "100% increased Critical Damage Bonus"],
    ["minionAreaOfEffect", "Minions have 10% increased Area of Effect", "Minions have 10% reduced Area of Effect", "100% increased Area of Effect"],
    ["minionMovementSpeed", "Minions have 5% increased Movement Speed", "Minions have 5% reduced Movement Speed", "50% increased Movement Speed"],
    ["minionFireResistance", "Minions have +5% to Fire Resistance", "Minions have -5% to Fire Resistance", "Minions have +50% to Maximum Fire Resistances"],
    ["minionColdResistance", "Minions have +5% to Cold Resistance", "Minions have -5% to Cold Resistance", "+50% to Cold Resistance"],
    ["minionLightningResistance", "Minions have +5% to Lightning Resistance", "Minions have -5% to Lightning Resistance", "Minions have +50% to all Maximum Elemental Resistances"],
    ["minionChaosResistance", "Minions have +5% to Chaos Resistance", "Minions have -5% to Chaos Resistance", "Minions have +50% to all Elemental Resistances"],
  ] as const)("routes toward owned %s only when selected, retaining penalties, goals and shortest behavior", (id, positive, negative, wrong) => {
    const g = graph([["start", "owned"], ["owned", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      owned: [positive], wrong: [negative, wrong, `${positive} while on Full Life`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["owned", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(2);
    expect(result.weighted?.contributions).toMatchObject([{ id, score: 2, nodeCount: 1 }]);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["wrong"] }, undefined, options);
    expect(required.addedNodeIds).toContain("wrong");
    expect(required.pointCost).toBe(1);
    expect(required.weighted?.score).toBe(-2);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts shared all-elemental minion resistance once per selected element and never rewards base nodes again", () => {
    const g = graph([["start", "joint"], ["joint", "goal"], ["joint", "second"]], { joint: ["Minions have +10% to all Elemental Resistances"] });
    const r = { ...request(g, 0), goalNodeIds: ["goal", "second"], preferences: [
      { id: "minionFireResistance" as const, weight: 1 }, { id: "minionColdResistance" as const, weight: 1 },
      { id: "minionLightningResistance" as const, weight: 1 }, { id: "minionChaosResistance" as const, weight: 3 },
    ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["joint", "goal", "second"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(6);
    expect(result.weighted?.contributions).toHaveLength(4);
    for (const contribution of result.weighted!.contributions.filter((c) => c.id !== "minionChaosResistance")) expect(contribution).toMatchObject({ score: 2, nodeCount: 1 });
    expect(result.weighted?.contributions.find((c) => c.id === "minionChaosResistance")).toMatchObject({ score: 0, nodeCount: 0 });
    const base = optimizeWeightedBuildGoals({ ...r, baseNodeIds: ["start", "joint"], baseEdgeKeys: [treeEdgeKey("start", "joint")] }, undefined, options);
    expect(base.pointCost).toBe(2);
    expect(base.weighted?.score).toBe(0);
  });
  it.each([
    ["skeletal-sniper", "Minions have 6% increased Attack Speed", "30% increased Attack Speed", 4],
    ["skeletal-frost-mage", "Minions have 6% increased Cast Speed", "100% increased Cold Damage", 4],
    ["skeletal-storm-mage", "Minions have 6% increased Cast Speed", "100% increased Lightning Damage", 4],
    ["skeletal-brute", "Minions have 6% increased Attack Speed", "100% increased Physical Damage", 4],
    ["skeletal-cleric", "Minions have 6% increased Cast Speed", "Minions deal 100% increased Damage", 2],
    ["skeletal-reaver", "Minions have 6% increased Attack Speed", "30% increased Attack Speed", 4],
    ["bone-offering", "10% increased Skill Effect Duration", "100% increased Physical Damage", 3],
    ["pain-offering", "10% increased Skill Effect Duration", "Minions deal 100% increased Damage", 3],
  ])("routes %s through its reviewed owned effect, not an unrelated player or damage benefit", (focusSkillId, good, bad, score) => {
    const g = graph([["start", "right"], ["right", "goal"], ["start", "wrong"], ["wrong", "goal"]], { right: [String(good)], wrong: [String(bad)] });
    const selected = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset(String(focusSkillId))!);
    const r = { ...request(g, 0), ...selected };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["right", "goal"]));
    expect(result.weighted?.score).toBe(score);
    expect(result.pointCost).toBe(2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each([["bonestorm", "considered-casting"], ["despair", "spell-echo"]])("scores only explicitly applied cast-speed priority for %s/%s", (focusSkillId, supportId) => {
    const g = graph([["start", "goal"]], { goal: ["3% increased Cast Speed", "40% increased Area of Effect for Echoed Spells"] });
    const selected = { ...request(g, 0), focusSkillId, supportGemIds: [supportId], preferences: [{ id: "castSpeed" as const, weight: 1 }] };
    expect(optimizeWeightedBuildGoals(selected, undefined, options).weighted?.score).toBe(1);
    const applied = applySkillSupportPriorities(selected, getSkillPreferencePreset(focusSkillId)!);
    expect(optimizeWeightedBuildGoals({ ...selected, ...applied }, undefined, options).weighted?.score).toBe(2);
    const shortest = { ...selected, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each(["brutality-i", "brutality-ii", "brutality-iii"])("keeps %s prohibitions out of fresh suggestions without multiplying Physical Damage scores", (supportId) => {
    const g = graph([["start", "physical"], ["physical", "goal"], ["start", "fire"], ["fire", "goal"]], {
      physical: ["10% increased Physical Damage"], fire: ["100% increased Fire Damage"],
    });
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, focusSkillId: "detonate-dead", supportGemIds: [supportId], preferences: [] }, getSkillPreferencePreset("detonate-dead")!);
    const r = { ...request(g, 0), ...settings };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(result.addedNodeIds).toContain("physical");
    expect(result.weighted?.score).toBe(3);
    expect(result.pointCost).toBe(2);
    const manual = optimizeWeightedBuildGoals({ ...r, preferences: [...r.preferences, { id: "fireDamage", weight: 1 }] }, undefined, options);
    expect(manual.addedNodeIds).toContain("fire");
    expect(manual.weighted?.score).toBe(10);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each(["projectile-acceleration-i", "projectile-acceleration-ii"])("keeps Bonestorm %s delivery context separate from passive score multipliers", (supportId) => {
    const g = graph([["start", "goal"]], { goal: ["15% increased Projectile Speed for Spell Skills", "5% reduced Projectile Speed"] });
    const r = { ...request(g, 0), focusSkillId: "bonestorm", preferences: [{ id: "projectileSpeed" as const, weight: 1 }] };
    const base = optimizeWeightedBuildGoals(r, undefined, options);
    const supported = optimizeWeightedBuildGoals({ ...r, supportGemIds: [supportId] }, undefined, options);
    expect(supported.weighted).toEqual(base.weighted);
    expect(supported.weighted?.score).toBe(1);
    expect(supported.pointCost).toBe(1);
  });
  it.each([
    ["contagion", "magnified-area-ii"], ["bone-cage", "prolonged-duration-i"], ["despair", "prolonged-duration-ii"],
    ["bonestorm", "rapid-casting-i"], ["dark-effigy", "magnified-area-i"], ["dark-effigy", "mobility"], ["dark-effigy", "rapid-casting-iii"],
  ])("keeps %s routing and point cost unchanged with context-only %s", (focusSkillId, supportId) => {
    const g = graph([["start", "right"], ["right", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      right: ["Spell Skills have 10% reduced Area of Effect", "10% increased Skill Effect Duration", "3% increased Cast Speed"],
      wrong: ["40% increased Area of Effect for Echoed Spells"],
    });
    const r = { ...request(g, 0), focusSkillId, preferences: [{ id: "areaOfEffect" as const, weight: 1 },
      { id: "skillDuration" as const, weight: 2 }, { id: "castSpeed" as const, weight: 1 }] };
    const base = optimizeWeightedBuildGoals(r, undefined, options);
    const supported = optimizeWeightedBuildGoals({ ...r, supportGemIds: [supportId] }, undefined, options);
    expect(supported.weighted).toEqual(base.weighted);
    expect(new Set(supported.addedNodeIds)).toEqual(new Set(["right", "goal"]));
    expect(supported.weighted?.score).toBe(2);
    expect(supported.pointCost).toBe(2);
    const shortest = { ...r, supportGemIds: [supportId], mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each([
    ["contagion", "10% increased Damage over Time", "100% increased Spell Area Damage", 3],
    ["bonestorm", "35% increased Spell Area Damage", "100% increased Attack Damage", 3.5],
    ["bone-cage", "10% increased Physical Damage", "Minions deal 100% increased Damage", 3],
    ["despair", "6% increased Curse Magnitudes", "100% increased Chaos Damage", 3],
    ["vulnerability", "6% increased Curse Magnitudes", "100% increased Physical Damage", 3],
    ["hexblast", "35% increased Spell Area Damage", "100% increased Curse Duration", 3.5],
    ["unearth", "10% increased Physical Damage", "Minions deal 100% increased Damage", 3],
    ["detonate-dead", "10% increased Physical Damage", "100% increased Spell Area Damage", 3],
    ["dark-effigy", "10% increased Projectile Damage", "100% increased Damage over Time", 2],
  ])("routes with the reviewed %s component without counting unrelated effects or changing shortest", (focusSkillId, good, bad, score) => {
    const g = graph([["start", "right"], ["right", "goal"], ["start", "wrong"], ["wrong", "goal"]], { right: [String(good)], wrong: [String(bad)] });
    const selected = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset(String(focusSkillId))!);
    const r = { ...request(g, 0), ...selected };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["right", "goal"]));
    expect(result.weighted?.score).toBe(score);
    expect(result.pointCost).toBe(2);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each(["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility"])
    ("does not turn %s magnitudes into passive score, cost, recovery or movement multipliers", (supportId) => {
      const g = graph([["start", "goal"]], { goal: ["10% increased Area of Effect", "10% increased Skill Effect Duration",
        "10% reduced Movement Speed Penalty from using Skills while moving", "10% increased Mana Regeneration Rate"] });
      const r = { ...request(g, 0), focusSkillId: "firestorm", preferences: [{ id: "areaOfEffect" as const, weight: 1 },
        { id: "skillDuration" as const, weight: 1 }, { id: "skillMovementPenaltyReduction" as const, weight: 1 }, { id: "manaRegenerationRate" as const, weight: 1 }] };
      const base = optimizeWeightedBuildGoals(r, undefined, options);
      const supported = optimizeWeightedBuildGoals({ ...r, supportGemIds: [supportId] }, undefined, options);
      expect(supported.weighted).toEqual(base.weighted);
      expect(supported.pointCost).toBe(1);
      expect(supported.weighted?.score).toBe(4);
      const shortest = { ...r, supportGemIds: [supportId], mode: "shortest" as const };
      expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    });
  it("uses Controlled Destruction's reviewed crit block for a new spell without dropping manual generic crit", () => {
    const g = graph([["start", "generic"], ["generic", "goal"], ["start", "scoped"], ["scoped", "goal"]], {
      generic: ["15% increased Critical Hit Chance"], scoped: ["30% increased Critical Hit Chance for Spells"],
    });
    const r = { ...request(g, 0), focusSkillId: "comet", preferences: [{ id: "criticalChance" as const, weight: 2 }] };
    expect(optimizeWeightedBuildGoals(r, undefined, options).addedNodeIds).toContain("scoped");
    const blocked = optimizeWeightedBuildGoals({ ...r, supportGemIds: ["controlled-destruction"] }, undefined, options);
    expect(blocked.addedNodeIds).toContain("generic");
    expect(blocked.weighted?.score).toBe(2);
  });
  it("scores only the applied cast-speed priority for Considered Casting and Echo, not native damage or repeat count", () => {
    const g = graph([["start", "goal"]], { goal: ["3% increased Cast Speed", "40% increased Area of Effect for Echoed Spells"] });
    const settings = applySkillSupportPriorities({ mode: "weighted", extraPointBudget: 0, focusSkillId: "comet",
      supportGemIds: ["considered-casting", "spell-echo"], preferences: [{ id: "castSpeed", weight: 1 }] }, getSkillPreferencePreset("comet")!);
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), ...settings }, undefined, options);
    expect(result.pointCost).toBe(1);
    expect(result.weighted?.score).toBe(2);
    expect(settings.preferences).toEqual([{ id: "castSpeed", weight: 2 }]);
  });
  it.each(["arc", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "eye-of-winter", "frost-bomb", "flameblast", "frost-wall"])
    ("routes with the reviewed %s crit scope only when selected, without changing shortest or point cost", (focusSkillId) => {
      const g = graph([["start", "generic"], ["generic", "goal"], ["start", "scoped"], ["scoped", "goal"]], {
        generic: ["10% increased Spell Damage"], scoped: ["30% increased Critical Hit Chance for Spells"],
      });
      const r = { ...request(g, 0), focusSkillId, preferences: [{ id: "criticalChance" as const, weight: 2 }, { id: "spellDamage" as const, weight: 1 }] };
      const result = runOptimizerRequest(r, undefined, options);
      expect(new Set(result.addedNodeIds)).toEqual(new Set(["scoped", "goal"]));
      expect(result.pointCost).toBe(2);
      expect(result.weighted?.score).toBe(4);
      const manual = optimizeWeightedBuildGoals({ ...r, focusSkillId: undefined }, undefined, options);
      expect(new Set(manual.addedNodeIds)).toEqual(new Set(["generic", "goal"]));
      expect(manual.weighted?.score).toBe(1);
      const unselected = optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "spellDamage", weight: 1 }] }, undefined, options);
      expect(new Set(unselected.addedNodeIds)).toEqual(new Set(["generic", "goal"]));
      const shortest = { ...r, mode: "shortest" as const };
      expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    });
  it.each(["ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "frost-bomb", "flameblast", "frost-wall"])
    ("retains Ruin's area penalty and damage contribution independently for the reviewed %s component", (focusSkillId) => {
      const g = graph([["start", "goal"]], { goal: ["Spell Skills have 10% reduced Area of Effect", "35% increased Spell Area Damage", "100% increased Spell Area Damage while stationary"] });
      const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset(focusSkillId)!);
      const result = optimizeWeightedBuildGoals({ ...request(g, 0), ...settings }, undefined, options);
      expect(result.pointCost).toBe(1);
      expect(result.addedNodeIds).toEqual(["goal"]);
      expect(result.weighted?.score).toBe(2.5);
      expect(result.weighted?.contributions.find((c) => c.id === "areaOfEffect")).toMatchObject({ score: -1, nodeCount: 1 });
      expect(result.weighted?.contributions.find((c) => c.id === "spellAreaDamage")).toMatchObject({ score: 3.5, nodeCount: 1 });
    });
  it.each(["frostbolt", "arc", "ball-lightning", "eye-of-winter"])("keeps projectile-speed routing explicitly scoped for %s", (focusSkillId) => {
    const g = graph([["start", "generic"], ["generic", "goal"], ["start", "scoped"], ["scoped", "goal"]], {
      generic: ["10% increased Projectile Speed"], scoped: ["30% increased Projectile Speed for Spell Skills"],
    });
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), focusSkillId, preferences: [{ id: "projectileSpeed", weight: 3 }] }, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set([focusSkillId === "frostbolt" ? "scoped" : "generic", "goal"]));
    expect(result.weighted?.score).toBe(focusSkillId === "frostbolt" ? 9 : 3);
    expect(result.pointCost).toBe(2);
  });
  it.each([
    ["energyShieldRechargeStart", "12% faster start of Energy Shield Recharge", "20% slower start of Energy Shield Recharge"],
    ["energyShieldRechargeRate", "12% increased Energy Shield Recharge Rate", "10% reduced Energy Shield Recharge Rate"],
    ["lifeRegenerationRate", "20% increased Life Regeneration rate", "20% reduced Life Regeneration rate"],
    ["manaRegenerationRate", "15% increased Mana Regeneration Rate", "10% reduced Mana Regeneration Rate"],
    ["elementalAilmentThreshold", "20% increased Elemental Ailment Threshold", "10% reduced Elemental Ailment Threshold"],
    ["cooldownRecoveryRate", "10% increased Cooldown Recovery Rate", "10% reduced Cooldown Recovery Rate"],
    ["lifeFlaskRecovery", "20% increased Life Recovery from Flasks", "10% reduced Life Recovery from Flasks"],
    ["manaFlaskRecovery", "20% increased Mana Recovery from Flasks", "10% reduced Mana Recovery from Flasks"],
    ["flaskChargesGained", "20% increased Flask Charges gained", "10% reduced Flask Charges gained"],
    ["lifeFlaskChargesGained", "20% increased Life Flask Charges gained", "10% reduced Life Flask Charges gained"],
    ["manaFlaskChargesGained", "20% increased Mana Flask Charges gained", "10% reduced Mana Flask Charges gained"],
    ["accuracy", "12% increased Accuracy Rating", "20% reduced Accuracy Rating"],
    ["blockChance", "12% increased Block chance", "10% reduced Block chance"],
    ["stunThreshold", "16% increased Stun Threshold", "10% reduced Stun Threshold"],
    ["stunRecovery", "20% increased Stun Recovery", "10% reduced Stun Recovery"],
    ["presenceArea", "20% increased Presence Area of Effect", "15% reduced Presence Area of Effect"],
    ["lifeLeechAmount", "20% increased amount of Life Leeched", "10% reduced amount of Life Leeched"],
    ["manaLeechAmount", "20% increased amount of Mana Leeched", "10% reduced amount of Mana Leeched"],
    ["flaskChargeCostReduction", "10% reduced Flask Charges used", "10% increased Flask Charges used"],
    ["manaFlaskChargeCostReduction", "10% reduced Flask Charges used from Mana Flasks", "10% increased Flask Charges used from Mana Flasks"],
    ["criticalDamageBonus", "20% increased Critical Damage Bonus", "20% reduced Critical Damage Bonus"],
    ["stunBuildup", "35% increased Stun Buildup", "20% reduced Stun Buildup"],
    ["freezeBuildup", "35% increased Freeze Buildup", "20% reduced Freeze Buildup"],
    ["flammabilityMagnitude", "15% increased Flammability Magnitude", "20% reduced Flammability Magnitude"],
    ["igniteMagnitude", "12% increased Ignite Magnitude", "10% reduced Ignite Magnitude"],
    ["shockMagnitude", "25% increased Magnitude of Shock you inflict", "20% reduced Magnitude of Shock you inflict"],
    ["poisonMagnitude", "20% increased Magnitude of Poison you inflict", "20% reduced Magnitude of Poison you inflict"],
    ["bleedingMagnitude", "20% increased Magnitude of Bleeding you inflict", "20% reduced Magnitude of Bleeding you inflict"],
    ["shockChance", "30% increased chance to Shock", "10% reduced chance to Shock"],
    ["igniteDuration", "10% increased Ignite Duration on Enemies", "20% reduced Ignite Duration on Enemies"],
    ["poisonDuration", "10% increased Poison Duration", "25% reduced Poison Duration"],
    ["bleedingDuration", "10% increased Bleeding Duration", "20% reduced Bleeding Duration"],
    ["shockDuration", "20% increased Shock Duration", "20% reduced Shock Duration"],
    ["freezeDuration", "20% increased Freeze Duration on Enemies", "20% reduced Freeze Duration on Enemies"],
  ] as const)("routes toward %s only when selected, retaining goals, cost and shortest behavior", (id, positive, negative) => {
    const g = graph([["start", "recovery"], ["recovery", "goal"], ["start", "tradeoff"], ["tradeoff", "goal"]], {
      recovery: [positive], tradeoff: [negative, `100% ${positive.slice(positive.indexOf(" ") + 1)} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["recovery", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBeCloseTo(Number(positive.split("%")[0]) / 10 * 2);
    expect(result.weighted?.contributions[0]).toMatchObject({ id, nodeCount: 1 });
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["tradeoff"] }, undefined, options);
    expect(required.addedNodeIds).toContain("tradeoff");
    expect(required.pointCost).toBe(1);
    expect(required.weighted?.score).toBeCloseTo(-Number(negative.split("%")[0]) / 10 * 2);
    const without = optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, options);
    expect(without.weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each([
    ["firePenetration", "Fire Resistance"], ["coldPenetration", "Cold Resistance"],
    ["lightningPenetration", "Lightning Resistance"], ["elementalPenetration", "of Enemy Elemental Resistances"],
  ] as const)("routes with opt-in %s without confusing flat penetration with increased damage or bypassing budgets", (id, wording) => {
    const g = graph([["start", "small"], ["small", "goal"], ["start", "best"], ["best", "goal"]], {
      small: [`Damage Penetrates 5% ${wording}`, `Damage Penetrates 100% ${wording} while Shapeshifted`, "100% increased Elemental Damage"],
      best: [`Damage Penetrates 10% ${wording}`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = runOptimizerRequest(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["best", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted).toMatchObject({ score: 4, baselinePointCost: 2, maxPointCost: 2, contributions: [{ id, score: 4, nodeCount: 1 }] });
    const unselected = optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 3 }] }, undefined, options);
    expect(unselected.weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("adds Flash Storm's two rewards once on a shared branch, with no reward for already allocated modifiers", () => {
    const stats = ["Damage Penetrates 15% Lightning Resistance", "30% increased chance to Shock"];
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "flash"]], { allocated: stats, flash: stats });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")],
      goalNodeIds: ["goal", "second"], preferences: [{ id: "lightningPenetration" as const, weight: 1 }, { id: "shockChance" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "flash"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 6, baselinePointCost: 2, maxPointCost: 3, contributions: [
      { id: "lightningPenetration", score: 3, nodeCount: 1 }, { id: "shockChance", score: 3, nodeCount: 1 },
    ] });
    const noExtra = optimizeWeightedBuildGoals({ ...r, extraPointBudget: 0 }, undefined, options);
    expect(noExtra.pointCost).toBe(2);
    expect(noExtra.weighted?.score).toBe(0);
  });
  it("counts combined flask recovery once per pool on a shared branch, without re-scoring the base or exceeding the point budget", () => {
    const stats = ["20% increased Life and Mana Recovery from Flasks"];
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "flasks"]], { allocated: stats, flasks: stats });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")],
      goalNodeIds: ["goal", "second"], preferences: [{ id: "lifeFlaskRecovery" as const, weight: 2 }, { id: "manaFlaskRecovery" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "flasks"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 6, baselinePointCost: 2, maxPointCost: 3, contributions: [
      { id: "lifeFlaskRecovery", score: 4, nodeCount: 1 }, { id: "manaFlaskRecovery", score: 2, nodeCount: 1 },
    ] });
    const noExtra = optimizeWeightedBuildGoals({ ...r, extraPointBudget: 0 }, undefined, options);
    expect(new Set(noExtra.addedNodeIds)).toEqual(new Set(["goal", "second"]));
    expect(noExtra.weighted?.score).toBe(0);
    const reduced = optimizeWeightedBuildGoals({ ...r, graph: graph([["start", "flasks"]], { flasks: ["20% reduced Life and Mana Recovery from Flasks"] }),
      baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["flasks"] }, undefined, options);
    expect(reduced.pointCost).toBe(1);
    expect(reduced.weighted?.score).toBe(-6);
  });
  it.each([
    ["lifeRecoup", "6% of Damage taken Recouped as Life", 2], ["manaRecoup", "6% of Damage taken Recouped as Mana", 2],
    ["energyShieldRecoup", "6% of Damage taken Recouped as Energy Shield", 2],
    ["lifeFlaskChargeGeneration", "Life Flasks gain 0.15 charges per Second", 1.5],
    ["manaFlaskChargeGeneration", "Mana Flasks gain 0.15 charges per Second", 1.5],
  ] as const)("routes toward opt-in %s in its own units without changing shortest or required goals", (id, stat, score) => {
    const g = graph([["start", "plain"], ["plain", "goal"], ["start", "bonus"], ["bonus", "goal"]], {
      bonus: [stat], plain: [`${stat} while stationary`],
    });
    const r = { ...request(g, 0), preferences: [{ id, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["bonus", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBeCloseTo(score * 2);
    expect(optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["plain"] }, undefined, options).addedNodeIds).toEqual(["plain"]);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 3 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("scores Glazed Flesh's three recoup pools once each on a shared branch, not allocated base effects", () => {
    const stats = ["3% of Damage Taken Recouped as Life, Mana and Energy Shield"];
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "recoup"]], { allocated: stats, recoup: stats });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")],
      goalNodeIds: ["goal", "second"], preferences: [{ id: "lifeRecoup" as const, weight: 3 }, { id: "manaRecoup" as const, weight: 2 }, { id: "energyShieldRecoup" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "recoup"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 6, baselinePointCost: 2, maxPointCost: 3, contributions: [
      { id: "lifeRecoup", score: 3, nodeCount: 1 }, { id: "manaRecoup", score: 2, nodeCount: 1 }, { id: "energyShieldRecoup", score: 1, nodeCount: 1 },
    ] });
    const noExtra = optimizeWeightedBuildGoals({ ...r, extraPointBudget: 0 }, undefined, options);
    expect(noExtra.pointCost).toBe(2);
    expect(noExtra.weighted?.score).toBe(0);
  });
  it("retains selected flask-charge tradeoffs without rewarding Charm charges or multiplying flat generation", () => {
    const g = graph([["start", "mixed"], ["mixed", "goal"], ["start", "life"], ["life", "goal"]], {
      mixed: ["20% increased Flask and Charm Charges gained", "10% reduced Life Flask Charges gained"], life: ["10% increased Life Flask Charges gained"],
    });
    const r = { ...request(g, 0), preferences: [{ id: "flaskChargesGained" as const, weight: 1 }, { id: "lifeFlaskChargesGained" as const, weight: 3 }] };
    expect(optimizeWeightedBuildGoals(r, undefined, options).addedNodeIds).toContain("life");
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["mixed"] }, undefined, options);
    expect(required.pointCost).toBe(1);
    expect(required.weighted?.score).toBe(-1);
    const flat = optimizeWeightedBuildGoals({ ...request(graph([["start", "goal"]], { goal: ["10% increased Flask Charges gained", "Life Flasks gain 0.1 charges per Second"] }), 0),
      preferences: [{ id: "flaskChargesGained", weight: 1 }, { id: "lifeFlaskChargeGeneration", weight: 1 }] }, undefined, options);
    expect(flat.pointCost).toBe(1);
    expect(flat.weighted?.score).toBe(2);
  });
  it("balances Savoured Blood's slower leech against its amount without losing required goals", () => {
    const g = graph([["start", "savoured"], ["savoured", "goal"], ["start", "fast"], ["fast", "goal"]], {
      savoured: ["35% increased amount of Life Leeched", "Leech Life 20% slower"], fast: ["8% increased amount of Life Leeched", "Leech Life 15% faster"],
    });
    const r = { ...request(g, 0), preferences: [{ id: "lifeLeechAmount" as const, weight: 1 }, { id: "lifeLeechSpeed" as const, weight: 3 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["fast", "goal"]));
    expect(result.weighted?.score).toBeCloseTo(5.3);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["savoured"] }, undefined, options);
    expect(required.addedNodeIds).toEqual(["savoured"]);
    expect(required.pointCost).toBe(1);
    expect(required.weighted?.score).toBe(-2.5);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "lifeLeechAmount", weight: 1 }] }, undefined, options).addedNodeIds).toContain("savoured");
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("rewards skill movement-penalty reductions on a shared branch without granting global movement or re-scoring the base", () => {
    const stats = ["10% increased Stun Recovery", "10% increased Presence Area of Effect", "10% reduced Movement Speed Penalty from using Skills while moving"];
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "utility"]], { allocated: stats, utility: stats });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")],
      goalNodeIds: ["goal", "second"], preferences: [{ id: "stunRecovery" as const, weight: 3 }, { id: "presenceArea" as const, weight: 2 },
        { id: "skillMovementPenaltyReduction" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "utility"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 6, baselinePointCost: 2, maxPointCost: 3, contributions: [
      { id: "stunRecovery", score: 3, nodeCount: 1 }, { id: "presenceArea", score: 2, nodeCount: 1 }, { id: "skillMovementPenaltyReduction", score: 1, nodeCount: 1 },
    ] });
    expect(optimizeWeightedBuildGoals({ ...r, extraPointBudget: 0 }, undefined, options).weighted?.score).toBe(0);
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "movementSpeed", weight: 3 }] }, undefined, options).weighted?.score).toBe(0);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("retains required poison-stack tradeoff nodes without inventing a reward for the unmodeled extra stack", () => {
    const g = graph([["start", "toxins"]], { toxins: ["Targets can be affected by +1 of your Poisons at the same time", "20% reduced Magnitude of Poison you inflict"] });
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), goalNodeIds: ["toxins"], preferences: [{ id: "poisonMagnitude", weight: 2 }] }, undefined, options);
    expect(result.addedNodeIds).toEqual(["toxins"]);
    expect(result.pointCost).toBe(1);
    expect(result.weighted).toMatchObject({ score: -4, contributions: [{ id: "poisonMagnitude", score: -4, nodeCount: 1 }] });
  });
  it("weighs Careful Assassin and Throatseeker's opposite crit chance/damage tradeoffs independently", () => {
    const g = graph([["start", "careful"], ["careful", "goal"], ["start", "throatseeker"], ["throatseeker", "goal"]], {
      careful: ["20% reduced Critical Damage Bonus", "50% increased Critical Hit Chance"],
      throatseeker: ["60% increased Critical Damage Bonus", "20% reduced Critical Hit Chance"],
    });
    const r = { ...request(g, 0), preferences: [{ id: "criticalDamageBonus" as const, weight: 1 }] };
    const damage = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(damage.addedNodeIds)).toEqual(new Set(["throatseeker", "goal"]));
    expect(damage.weighted?.score).toBe(6);
    const chance = optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "criticalChance", weight: 1 }] }, undefined, options);
    expect(new Set(chance.addedNodeIds)).toEqual(new Set(["careful", "goal"]));
    expect(chance.weighted?.score).toBeCloseTo(50 / 15);
    const balanced = optimizeWeightedBuildGoals({ ...r, preferences: [...r.preferences, { id: "criticalChance", weight: 3 }] }, undefined, options);
    expect(new Set(balanced.addedNodeIds)).toEqual(new Set(["careful", "goal"]));
    expect(balanced.weighted).toMatchObject({ score: 8, contributions: [
      { id: "criticalDamageBonus", score: -2, nodeCount: 1 }, { id: "criticalChance", score: 10, nodeCount: 1 },
    ] });
    expect(balanced.pointCost).toBe(2);
  });
  it("counts Pressure Points' separate buildup bonuses once on a budgeted shared branch, not allocated effects", () => {
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "pressure"], ["goal", "crit"]], {
      allocated: ["100% increased Critical Damage Bonus", "100% increased Stun Buildup", "100% increased Freeze Buildup"],
      pressure: ["35% increased Stun Buildup", "35% increased Freeze Buildup"], crit: ["20% increased Critical Damage Bonus"],
    });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")],
      goalNodeIds: ["goal", "second"], preferences: [
        { id: "criticalDamageBonus" as const, weight: 1 }, { id: "stunBuildup" as const, weight: 1 }, { id: "freezeBuildup" as const, weight: 1 },
      ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "pressure"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 7, baselinePointCost: 2, maxPointCost: 3, contributions: [
      { id: "criticalDamageBonus", score: 0, nodeCount: 0 }, { id: "stunBuildup", score: 3.5, nodeCount: 1 }, { id: "freezeBuildup", score: 3.5, nodeCount: 1 },
    ] });
    const noExtra = optimizeWeightedBuildGoals({ ...r, extraPointBudget: 0 }, undefined, options);
    expect(new Set(noExtra.addedNodeIds)).toEqual(new Set(["goal", "second"]));
    expect(noExtra.weighted?.score).toBe(0);
  });
  it("balances Frantic Reach's attack area against its accuracy reduction only when accuracy is selected", () => {
    const g = graph([["start", "frantic"], ["frantic", "goal"], ["start", "safe"], ["safe", "goal"]], {
      frantic: ["18% increased Area of Effect for Attacks", "20% reduced Accuracy Rating"],
      safe: ["10% increased Accuracy Rating"],
    });
    const r = { ...request(g, 0), focusSkillId: "lightning-arrow", preferences: [{ id: "areaOfEffect" as const, weight: 1 }] };
    const areaOnly = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(areaOnly.addedNodeIds)).toEqual(new Set(["frantic", "goal"]));
    expect(areaOnly.weighted?.score).toBeCloseTo(1.8);
    const balanced = optimizeWeightedBuildGoals({ ...r, preferences: [...r.preferences, { id: "accuracy", weight: 1 }] }, undefined, options);
    expect(new Set(balanced.addedNodeIds)).toEqual(new Set(["safe", "goal"]));
    expect(balanced.weighted?.score).toBe(1);
    expect(balanced.pointCost).toBe(2);
  });
  it("balances Core of the Guardian's block bonus and ES reduction without treating maximum block as ordinary block", () => {
    const g = graph([["start", "core"], ["core", "goal"], ["start", "safe"], ["safe", "goal"]], {
      core: ["30% increased Block chance", "20% reduced maximum Energy Shield"],
      safe: ["20% increased Block chance", "12% increased maximum Energy Shield", "+2% to maximum Block chance"],
    });
    const r = { ...request(g, 0), preferences: [{ id: "blockChance" as const, weight: 1 }] };
    expect(new Set(optimizeWeightedBuildGoals(r, undefined, options).addedNodeIds)).toEqual(new Set(["core", "goal"]));
    const balanced = optimizeWeightedBuildGoals({ ...r, preferences: [...r.preferences, { id: "energyShield", weight: 1 }] }, undefined, options);
    expect(new Set(balanced.addedNodeIds)).toEqual(new Set(["safe", "goal"]));
    expect(balanced.weighted).toMatchObject({ score: 3, contributions: [
      { id: "blockChance", score: 2, nodeCount: 1 }, { id: "energyShield", score: 1, nodeCount: 1 },
    ] });
  });
  it("counts shared accuracy, block and stun bonuses once, excluding allocated nodes from new rewards", () => {
    const stats = ["10% increased Accuracy Rating", "10% increased Block chance", "10% increased Stun Threshold"];
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "bonus"]], {
      allocated: stats, bonus: stats,
    });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")],
      goalNodeIds: ["goal", "second"], preferences: [
        { id: "accuracy" as const, weight: 1 }, { id: "blockChance" as const, weight: 1 }, { id: "stunThreshold" as const, weight: 1 },
      ] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "bonus"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 3, baselinePointCost: 2, maxPointCost: 3,
      contributions: r.preferences.map(({ id }) => ({ id, score: 1, nodeCount: 1 })),
    });
    const noExtra = optimizeWeightedBuildGoals({ ...r, extraPointBudget: 0 }, undefined, options);
    expect(new Set(noExtra.addedNodeIds)).toEqual(new Set(["goal", "second"]));
    expect(noExtra.weighted?.score).toBe(0);
  });
  it("balances recharge timing against rate instead of treating Convalescence as a free recovery bonus", () => {
    const g = graph([["start", "rapid"], ["rapid", "goal"], ["start", "convalescence"], ["convalescence", "goal"]], {
      rapid: ["12% faster start of Energy Shield Recharge", "12% increased Energy Shield Recharge Rate"],
      convalescence: ["20% faster start of Energy Shield Recharge", "10% reduced Energy Shield Recharge Rate"],
    });
    const r = { ...request(g, 0), preferences: [{ id: "energyShieldRechargeStart" as const, weight: 1 }, { id: "energyShieldRechargeRate" as const, weight: 1 }] };
    const balanced = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(balanced.addedNodeIds)).toEqual(new Set(["rapid", "goal"]));
    expect(balanced.weighted?.score).toBeCloseTo(2.4);
    const startOnly = optimizeWeightedBuildGoals({ ...r, preferences: [r.preferences[0]] }, undefined, options);
    expect(new Set(startOnly.addedNodeIds)).toEqual(new Set(["convalescence", "goal"]));
    expect(startOnly.weighted?.score).toBe(2);
  });
  it("counts shared recovery nodes once and excludes allocated recovery from budgeted branch rewards", () => {
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "bonus"]], {
      allocated: ["20% increased Life Regeneration rate"], bonus: ["20% increased Life Regeneration rate", "10% reduced Mana Regeneration Rate"],
    });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")], goalNodeIds: ["goal", "second"],
      preferences: [{ id: "lifeRegenerationRate" as const, weight: 2 }, { id: "manaRegenerationRate" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "bonus"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 3, baselinePointCost: 2, maxPointCost: 3,
      contributions: [{ id: "lifeRegenerationRate", score: 4, nodeCount: 1 }, { id: "manaRegenerationRate", score: -1, nodeCount: 1 }] });
  });
  it("weighs Ruin and Roil's separate damage/coverage tradeoffs instead of treating both as free area", () => {
    const g = graph([["start", "ruin"], ["ruin", "goal"], ["start", "roil"], ["roil", "goal"]], {
      ruin: ["Spell Skills have 10% reduced Area of Effect", "35% increased Spell Area Damage"],
      roil: ["Spell Skills have 25% increased Area of Effect", "10% reduced Spell Area Damage"],
    });
    const r = { ...request(g, 0), focusSkillId: "fireball", preferences: [{ id: "areaOfEffect" as const, weight: 1 }] };
    const coverage = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(coverage.addedNodeIds)).toEqual(new Set(["roil", "goal"]));
    expect(coverage.weighted?.score).toBe(2.5);
    const both = { ...r, preferences: [...r.preferences, { id: "spellAreaDamage" as const, weight: 1 }] };
    const balanced = optimizeWeightedBuildGoals(both, undefined, options);
    expect(new Set(balanced.addedNodeIds)).toEqual(new Set(["ruin", "goal"]));
    expect(balanced.weighted).toMatchObject({ score: 2.5, baselinePointCost: 2, maxPointCost: 2,
      contributions: [{ id: "areaOfEffect", score: -1, nodeCount: 1 }, { id: "spellAreaDamage", score: 3.5, nodeCount: 1 }] });
    const areaFirst = optimizeWeightedBuildGoals({ ...both, preferences: [{ id: "areaOfEffect", weight: 3 }, { id: "spellAreaDamage", weight: 1 }] }, undefined, options);
    expect(new Set(areaFirst.addedNodeIds)).toEqual(new Set(["roil", "goal"]));
    expect(areaFirst.weighted).toMatchObject({ score: 6.5, contributions: [{ id: "areaOfEffect", score: 7.5, nodeCount: 1 }, { id: "spellAreaDamage", score: -1, nodeCount: 1 }] });
    const defaultSettings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset("fireball")!);
    const suggested = optimizeWeightedBuildGoals({ ...r, ...defaultSettings }, undefined, options);
    expect(new Set(suggested.addedNodeIds)).toEqual(new Set(["ruin", "goal"]));
    expect(suggested.weighted?.score).toBe(2.5);
    expect(balanced.pointCost).toBe(2);
    expect(areaFirst.pointCost).toBe(2);
    const shortest = { ...both, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each([undefined, "spark", "enfeeble", "explosive-spear"])("does not reward explosion-only Spell Area Damage for %s", (focusSkillId) => {
    const g = graph([["start", "generic"], ["generic", "goal"], ["start", "area"], ["area", "goal"]], {
      generic: ["10% increased Spell Damage"], area: ["35% increased Spell Area Damage"],
    });
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), focusSkillId,
      preferences: [{ id: "spellDamage", weight: 1 }, { id: "spellAreaDamage", weight: 3 }] }, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["generic", "goal"]));
    expect(result.weighted?.score).toBe(1);
    expect(result.weighted?.contributions.find((entry) => entry.id === "spellAreaDamage")).toMatchObject({ score: 0, nodeCount: 0 });
  });
  it("scores a shared spell-area damage branch once within budget and never rewards already allocated damage", () => {
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "bonus"]], {
      allocated: ["35% increased Spell Area Damage"], bonus: ["20% increased Spell Area Damage", "10% increased Area of Effect", "100% increased Spell Area Damage while stationary"],
    });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")], goalNodeIds: ["goal", "second"],
      focusSkillId: "fireball", supportGemIds: ["controlled-destruction"], preferences: [{ id: "spellAreaDamage" as const, weight: 2 }, { id: "areaOfEffect" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "bonus"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 5, baselinePointCost: 2, maxPointCost: 3,
      contributions: [{ id: "spellAreaDamage", score: 4, nodeCount: 1 }, { id: "areaOfEffect", score: 1, nodeCount: 1 }] });
    const without = optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 3 }] }, undefined, options);
    expect(new Set(without.addedNodeIds)).toEqual(new Set(["goal", "second"]));
    expect(without.weighted?.score).toBe(0);
  });
  it("keeps required Roil's negative damage contribution rather than dropping its goal or counting it as general damage", () => {
    const g = graph([["start", "roil"]], { roil: ["Spell Skills have 25% increased Area of Effect", "10% reduced Spell Area Damage"] });
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), goalNodeIds: ["roil"], focusSkillId: "fireball",
      preferences: [{ id: "spellAreaDamage", weight: 2 }, { id: "spellDamage", weight: 3 }] }, undefined, options);
    expect(result.addedNodeIds).toEqual(["roil"]);
    expect(result.pointCost).toBe(1);
    expect(result.weighted).toMatchObject({ score: -2,
      contributions: [{ id: "spellAreaDamage", score: -2, nodeCount: 1 }, { id: "spellDamage", score: 0, nodeCount: 0 }] });
  });
  it("uses Fireball spell-area coverage on equal-cost routes only while the preference is selected, leaving shortest unchanged", () => {
    const g = graph([["start", "generic"], ["generic", "goal"], ["start", "spell"], ["spell", "goal"]], {
      generic: ["10% increased Area of Effect"], spell: ["Spell Skills have 25% increased Area of Effect", "10% reduced Spell Area Damage"],
    });
    const r = { ...request(g, 0), focusSkillId: "fireball", preferences: [{ id: "areaOfEffect" as const, weight: 2 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["spell", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted).toMatchObject({ score: 5, baselinePointCost: 2, maxPointCost: 2, contributions: [{ id: "areaOfEffect", score: 5, nodeCount: 1 }] });
    for (const focusSkillId of [undefined, "spark", "enfeeble", "lightning-arrow"]) {
      const other = optimizeWeightedBuildGoals({ ...r, focusSkillId }, undefined, options);
      expect(new Set(other.addedNodeIds)).toEqual(new Set(["generic", "goal"]));
      expect(other.weighted?.score).toBe(2);
    }
    const unselected = optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "spellDamage", weight: 3 }] }, undefined, options);
    expect(unselected.weighted?.score).toBe(0);
    expect(unselected.weighted?.contributions.some((entry) => entry.id === "areaOfEffect")).toBe(false);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("counts a shared spell-area branch once within budget, excluding existing allocation", () => {
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "bonus"]], {
      allocated: ["Spell Skills have 25% increased Area of Effect"], bonus: ["10% increased Area of Effect", "Spell Skills have 6% increased Area of Effect"],
    });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")], goalNodeIds: ["goal", "second"],
      focusSkillId: "fireball", supportGemIds: ["controlled-destruction"], preferences: [{ id: "areaOfEffect" as const, weight: 3 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "bonus"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ baselinePointCost: 2, maxPointCost: 3, contributions: [{ id: "areaOfEffect", nodeCount: 1 }] });
    expect(result.weighted?.score).toBeCloseTo(4.8);
    const without = optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 3 }] }, undefined, options);
    expect(new Set(without.addedNodeIds)).toEqual(new Set(["goal", "second"]));
    expect(without.weighted?.score).toBe(0);
  });
  it("keeps reduced spell area negative and does not reward Echoed or conditional area", () => {
    const g = graph([["start", "safe"], ["safe", "goal"], ["start", "reduced"], ["reduced", "goal"], ["start", "conditional"], ["conditional", "goal"]], {
      safe: ["Spell Skills have 6% increased Area of Effect"], reduced: ["Spell Skills have 10% reduced Area of Effect", "35% increased Spell Area Damage"],
      conditional: ["Echoed Spells have 100% increased Area of Effect", "Spell Skills have 100% increased Area of Effect while stationary"],
    });
    const r = { ...request(g, 0), focusSkillId: "fireball", preferences: [{ id: "areaOfEffect" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["safe", "goal"]));
    expect(result.weighted?.score).toBeCloseTo(0.6);
    const required = optimizeWeightedBuildGoals({ ...r, goalNodeIds: ["reduced"] }, undefined, options);
    expect(required.addedNodeIds).toContain("reduced");
    expect(required.pointCost).toBe(1);
    expect(required.weighted).toMatchObject({ score: -1, contributions: [{ id: "areaOfEffect", score: -1, nodeCount: 1 }] });
  });
  it.each([["ice-strike", "Quarterstaves"], ["tempest-flurry", "Quarterstaves"], ["lightning-spear", "Spears"], ["explosive-spear", "Spears"]])
    ("rewards weapon crit for %s only after explicitly selecting Critical Hit Chance", (focusSkillId, weapon) => {
      const g = graph([["start", "damage"], ["damage", "goal"], ["start", "crit"], ["crit", "goal"]], {
        damage: ["5% increased Attack Damage"], crit: [`10% increased Critical Hit Chance with ${weapon}`],
      });
      const preset = getSkillPreferencePreset(focusSkillId)!;
      const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, preset);
      expect(settings.preferences.some((entry) => entry.id === "criticalChance")).toBe(false);
      const r = { ...request(g, 0), ...settings };
      const without = optimizeWeightedBuildGoals(r, undefined, options);
      expect(new Set(without.addedNodeIds)).toEqual(new Set(["damage", "goal"]));
      expect(without.weighted?.score).toBe(1.5);
      expect(without.weighted?.contributions.some((entry) => entry.id === "criticalChance")).toBe(false);
      const selected = { ...r, preferences: [...r.preferences, { id: "criticalChance" as const, weight: 3 }] };
      const result = optimizeWeightedBuildGoals(selected, undefined, options);
      expect(new Set(result.addedNodeIds)).toEqual(new Set(["crit", "goal"]));
      expect(result.weighted?.score).toBe(2);
      expect(result.weighted?.contributions.filter((entry) => entry.nodeCount > 0)).toEqual([expect.objectContaining({ id: "criticalChance", score: 2, nodeCount: 1 })]);
      expect(result.pointCost).toBe(without.pointCost);
      expect(result.pointCost).toBe(2);
      const removed = { ...selected, preferences: selected.preferences.filter((entry) => entry.id !== "criticalChance") };
      expect(new Set(optimizeWeightedBuildGoals(removed, undefined, options).addedNodeIds)).toEqual(new Set(["damage", "goal"]));
      const shortest = { ...selected, mode: "shortest" as const };
      expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    });
  it.each([undefined, "unknown", "spark", "fireball", "lightning-arrow", "ice-shot", "rain-of-arrows", "boneshatter", "rolling-slam"])
    ("does not reward quarterstaff/spear crit for unsupported focus %s", (focusSkillId) => {
      const g = graph([["start", "generic"], ["generic", "goal"], ["start", "weapon"], ["weapon", "goal"]], {
        generic: ["15% increased Critical Hit Chance"], weapon: ["100% increased Critical Hit Chance with Quarterstaves", "100% increased Critical Hit Chance with Spears"],
      });
      const result = optimizeWeightedBuildGoals({ ...request(g, 0), focusSkillId, preferences: [{ id: "criticalChance", weight: 1 }] }, undefined, options);
      expect(new Set(result.addedNodeIds)).toEqual(new Set(["generic", "goal"]));
      expect(result.weighted?.score).toBe(1);
      expect(result.pointCost).toBe(2);
    });
  it.each([["ice-strike", "Quarterstaves", "Spears"], ["lightning-spear", "Spears", "Quarterstaves"]])
    ("counts %s weapon crit once on a budgeted branch, excluding existing allocation and the other weapon", (focusSkillId, weapon, otherWeapon) => {
      const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "bonus"]], {
        allocated: [`10% increased Critical Hit Chance with ${weapon}`],
        bonus: [`10% increased Critical Hit Chance with ${weapon}`, `100% increased Critical Hit Chance with ${otherWeapon}`],
      });
      const r = { ...request(g, 1), baseNodeIds: ["start", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")], goalNodeIds: ["goal", "second"],
        focusSkillId, preferences: [{ id: "criticalChance" as const, weight: 3 }] };
      const result = optimizeWeightedBuildGoals(r, undefined, options);
      expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "bonus"]));
      expect(result.pointCost).toBe(3);
      expect(result.weighted).toMatchObject({ score: 2, baselinePointCost: 2, maxPointCost: 3, contributions: [{ id: "criticalChance", score: 2, nodeCount: 1 }] });
      const without = optimizeWeightedBuildGoals({ ...r, preferences: [{ id: "energyShield", weight: 3 }] }, undefined, options);
      expect(new Set(without.addedNodeIds)).toEqual(new Set(["goal", "second"]));
      expect(without.weighted?.score).toBe(0);
      expect(without.pointCost).toBe(2);
    });
  it("penalizes reduced weapon crit without promoting conditional or critical-damage effects", () => {
    const g = graph([["start", "generic"], ["generic", "goal"], ["start", "tradeoff"], ["tradeoff", "goal"]], {
      generic: ["15% increased Critical Hit Chance"], tradeoff: ["10% increased Critical Hit Chance with Spears", "20% reduced Critical Hit Chance with Spears",
        "100% increased Critical Hit Chance with Spears if you've Crit Recently", "100% increased Critical Damage Bonus with Spears"],
    });
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), focusSkillId: "lightning-spear", preferences: [{ id: "criticalChance", weight: 1 }] }, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["generic", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(1);
  });
  it.each(["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"])("uses unconditional Melee Damage for %s without changing required goals, point costs or shortest behavior", (focusSkillId) => {
    const g = graph([["start", "generic"], ["generic", "goal"], ["start", "melee"], ["melee", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      generic: ["10% increased Attack Damage"], melee: ["20% increased Melee Damage"],
      wrong: ["100% increased Spell Damage", "Minions deal 100% increased Damage", "100% increased Projectile Damage"],
    });
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset(focusSkillId)!);
    const r = { ...request(g, 0), ...settings };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["melee", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(6);
    expect(result.weighted?.contributions.filter((entry) => entry.nodeCount > 0)).toEqual([expect.objectContaining({ id: "attackDamage", score: 6, nodeCount: 1 })]);
    const manual = optimizeWeightedBuildGoals({ ...r, focusSkillId: undefined }, undefined, options);
    expect(new Set(manual.addedNodeIds)).toEqual(new Set(["generic", "goal"]));
    expect(manual.weighted?.score).toBe(3);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it.each(["lightning-arrow", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear", "spark", "fireball"])
    ("does not route %s toward a Melee Damage bonus", (focusSkillId) => {
      const g = graph([["start", "generic"], ["generic", "goal"], ["start", "melee"], ["melee", "goal"]], {
        generic: ["10% increased Attack Damage"], melee: ["100% increased Melee Damage"],
      });
      const r = { ...request(g, 0), focusSkillId, preferences: [{ id: "attackDamage" as const, weight: 1 }] };
      const result = optimizeWeightedBuildGoals(r, undefined, options);
      expect(new Set(result.addedNodeIds)).toEqual(new Set(["generic", "goal"]));
      expect(result.weighted?.score).toBe(1);
      expect(result.pointCost).toBe(2);
    });
  it("counts general, melee and weapon damage on one branch node once and excludes already allocated bonuses", () => {
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "bonus"]], {
      allocated: ["100% increased Melee Damage"], bonus: ["10% increased Attack Damage", "20% increased Melee Damage", "14% increased Damage with Maces",
        "40% increased Melee Damage against Heavy Stunned enemies"],
    });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")], goalNodeIds: ["goal", "second"],
      focusSkillId: "rolling-slam", preferences: [{ id: "attackDamage" as const, weight: 3 }, { id: "physicalDamage" as const, weight: 3 }] };
    const original = structuredClone(r.preferences);
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "bonus"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.baselinePointCost).toBe(2);
    expect(result.weighted?.maxPointCost).toBe(3);
    expect(result.weighted?.score).toBeCloseTo(13.2);
    expect(result.weighted?.contributions).toEqual([expect.objectContaining({ id: "attackDamage", nodeCount: 1 }),
      expect.objectContaining({ id: "physicalDamage", score: 0, nodeCount: 0 })]);
    expect(result.weighted?.contributions[0].score).toBeCloseTo(13.2);
    expect(r.preferences).toEqual(original);
  });
  it("retains Melee Damage reductions and ignores conditional-only rewards when choosing a route", () => {
    const g = graph([["start", "safe"], ["safe", "goal"], ["start", "tradeoff"], ["tradeoff", "goal"], ["start", "conditional"], ["conditional", "goal"]], {
      safe: ["10% increased Attack Damage"], tradeoff: ["20% increased Melee Damage", "30% reduced Melee Damage"],
      conditional: ["100% increased Melee Damage against Heavy Stunned enemies"],
    });
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), focusSkillId: "boneshatter", preferences: [{ id: "attackDamage", weight: 1 }] }, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["safe", "goal"]));
    expect(result.weighted?.score).toBe(1);
    expect(result.pointCost).toBe(2);
  });
  it.each([
    ["lightning-arrow", "Bows", "Spears", "attackDamage", "Damage", 10, 20],
    ["ice-shot", "Bows", "Spears", "attackDamage", "Damage", 10, 20],
    ["rain-of-arrows", "Bows", "Spears", "attackDamage", "Damage", 10, 20],
    ["lightning-spear", "Spears", "Bows", "attackDamage", "Damage", 10, 20],
    ["explosive-spear", "Spears", "Bows", "attackDamage", "Damage", 10, 20],
    ["lightning-arrow", "Bows", "Spears", "attackSpeed", "Attack Speed", 3, 6],
    ["ice-shot", "Bows", "Spears", "attackSpeed", "Attack Speed", 3, 6],
    ["rain-of-arrows", "Bows", "Spears", "attackSpeed", "Attack Speed", 3, 6],
    ["lightning-spear", "Spears", "Bows", "attackSpeed", "Attack Speed", 3, 6],
    ["explosive-spear", "Spears", "Bows", "attackSpeed", "Attack Speed", 3, 6],
    ["ice-strike", "Quarterstaves", "Maces", "attackDamage", "Damage", 10, 20],
    ["tempest-flurry", "Quarterstaves", "Maces", "attackDamage", "Damage", 10, 20],
    ["boneshatter", "Maces", "Quarterstaves", "attackDamage", "Damage", 10, 20],
    ["rolling-slam", "Maces", "Quarterstaves", "attackDamage", "Damage", 10, 20],
    ["ice-strike", "Quarterstaves", "Maces", "attackSpeed", "Attack Speed", 3, 6],
    ["tempest-flurry", "Quarterstaves", "Maces", "attackSpeed", "Attack Speed", 3, 6],
    ["boneshatter", "Maces", "Quarterstaves", "attackSpeed", "Attack Speed", 3, 6],
    ["rolling-slam", "Maces", "Quarterstaves", "attackSpeed", "Attack Speed", 3, 6],
  ] as const)("routes %s using %s-specific %s while rejecting the other weapon at the same point cost", (focusSkillId, weapon, otherWeapon, id, wording, normal, bonus) => {
    const g = graph([["start", "generic"], ["generic", "goal"], ["start", "weapon"], ["weapon", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      generic: [`${normal}% increased ${id === "attackDamage" ? "Attack Damage" : wording}`],
      weapon: [`${bonus}% increased ${wording} with ${weapon}`], wrong: [`100% increased ${wording} with ${otherWeapon}`],
    });
    const r = { ...request(g, 0), focusSkillId, preferences: [{ id, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["weapon", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted).toMatchObject({ score: 2, maxPointCost: 2, contributions: [{ id, score: 2, nodeCount: 1 }] });
    const manual = optimizeWeightedBuildGoals({ ...r, focusSkillId: undefined }, undefined, options);
    expect(new Set(manual.addedNodeIds)).toEqual(new Set(["generic", "goal"]));
    expect(manual.weighted?.score).toBe(1);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("reports weapon effects once, excludes already allocated bonuses and preserves both required goals within the budget", () => {
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "bonus"]], {
      allocated: ["100% increased Damage with Spears"],
      bonus: ["25% increased Damage with Spears", "3% increased Attack Speed with Spears", "100% increased Damage with Bows"],
    });
    const r = { ...request(g, 1), baseNodeIds: ["start", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")],
      goalNodeIds: ["goal", "second"], focusSkillId: "lightning-spear",
      preferences: [{ id: "attackDamage" as const, weight: 2 }, { id: "attackSpeed" as const, weight: 1 }, { id: "projectileDamage" as const, weight: 3 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "bonus"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted).toMatchObject({ score: 6, baselinePointCost: 2, maxPointCost: 3,
      contributions: [{ id: "attackDamage", score: 5, nodeCount: 1 }, { id: "attackSpeed", score: 1, nodeCount: 1 }, { id: "projectileDamage", score: 0, nodeCount: 0 }] });
  });
  it.each([
    ["ice-strike", "8% increased Attack Speed with Quarterstaves", "attackSpeed", 8 / 3 * 2],
    ["tempest-flurry", "3% increased Attack Speed with Quarterstaves", "attackSpeed", 2],
    ["boneshatter", "15% increased Damage with Maces", "attackDamage", 4.5],
    ["rolling-slam", "14% increased Damage with Maces", "attackDamage", 4.2],
  ] as const)("keeps %s preset weights while scoring actual tree wording in a budgeted branch", (focusSkillId, stat, id, expectedScore) => {
    const g = graph([["start", "allocated"], ["allocated", "goal"], ["goal", "second"], ["goal", "bonus"]], {
      allocated: [stat], bonus: [stat, "20% more Damage against Heavy Stunned Enemies with Maces", "18% increased Stun Buildup with Maces",
        "Quarterstaff Skills that consume Power Charges count as consuming an additional Power Charge"],
    });
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 1, preferences: [] }, getSkillPreferencePreset(focusSkillId)!);
    const original = structuredClone(settings);
    const r = { ...request(g, 1), ...settings, baseNodeIds: ["start", "allocated"], baseEdgeKeys: [treeEdgeKey("start", "allocated")], goalNodeIds: ["goal", "second"] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["goal", "second", "bonus"]));
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.baselinePointCost).toBe(2);
    expect(result.weighted?.maxPointCost).toBe(3);
    expect(result.weighted?.score).toBeCloseTo(expectedScore);
    expect(result.weighted?.contributions.filter((entry) => entry.nodeCount > 0)).toEqual([expect.objectContaining({ id, nodeCount: 1 })]);
    expect(settings).toEqual(original);
  });
  it("retains negative weapon modifiers in route scores instead of only rewarding the damage line", () => {
    const g = graph([["start", "safe"], ["safe", "goal"], ["start", "tradeoff"], ["tradeoff", "goal"]], {
      safe: ["10% increased Attack Damage"], tradeoff: ["20% increased Damage with Bows", "6% reduced Attack Speed with Bows"],
    });
    const r = { ...request(g, 0), focusSkillId: "ice-shot", preferences: [{ id: "attackDamage" as const, weight: 1 }, { id: "attackSpeed" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["safe", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(1);
  });
  it.each([
    ["ice-shot", "10% increased Cold Damage"], ["rain-of-arrows", "10% increased Physical Damage"],
    ["lightning-spear", "10% increased Lightning Damage"], ["explosive-spear", "10% increased Fire Damage"],
  ] as const)("routes %s through its reviewed damage type while keeping required goals, point cost and shortest behavior", (focusSkillId, effect) => {
    const g = graph([["start", "damage"], ["damage", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      damage: [effect], wrong: ["100% increased Spell Damage", "Minions deal 100% increased Damage", "100% increased Damage over Time"],
    });
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset(focusSkillId)!);
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), ...settings }, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["damage", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(3);
    const shortest = { ...request(g, 0), ...settings, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("changes bow/spear delivery routing only after applying the reviewed projectile support priority", () => {
    const g = graph([["start", "hit"], ["hit", "goal"], ["start", "speed"], ["speed", "goal"]], {
      hit: ["5% increased Attack Damage"], speed: ["10% increased Projectile Speed"],
    });
    const base = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset("lightning-spear")!);
    const selected = { ...base, supportGemIds: ["projectile-acceleration-iii"] };
    expect(new Set(optimizeWeightedBuildGoals({ ...request(g, 0), ...selected }, undefined, options).addedNodeIds)).toEqual(new Set(["hit", "goal"]));
    const applied = applySkillSupportPriorities(selected, getSkillPreferencePreset("lightning-spear")!);
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), ...applied }, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["speed", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(3);
    expect(result.weighted?.contributions).toContainEqual(expect.objectContaining({ id: "projectileSpeed", score: 3, nodeCount: 1 }));
  });
  it.each([
    ["ice-strike", "10% increased Cold Damage"], ["tempest-flurry", "10% increased Lightning Damage"],
    ["boneshatter", "10% increased Physical Damage"], ["rolling-slam", "10% increased Physical Damage"],
  ] as const)("routes the %s preset through its reviewed damage focus, not spell or minion stats", (focusSkillId, effect) => {
    const g = graph([["start", "damage"], ["damage", "goal"], ["start", "wrong"], ["wrong", "goal"]], {
      damage: [effect], wrong: ["100% increased Spell Damage", "Minions deal 100% increased Damage", "100% increased Projectile Damage"],
    });
    const settings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset(focusSkillId)!);
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), ...settings }, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["damage", "goal"]));
    expect(result.pointCost).toBe(2);
    expect(result.weighted?.score).toBe(3);
    const shortest = { ...request(g, 0), ...settings, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("lets a reviewed melee support change coverage routing only after priorities are applied", () => {
    const g = graph([["start", "hit"], ["hit", "goal"], ["start", "area"], ["area", "goal"]], {
      hit: ["5% increased Attack Damage"], area: ["10% increased Area of Effect for Attacks"],
    });
    const base = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset("ice-strike")!);
    const selected = { ...base, supportGemIds: ["concentrated-area"] };
    const initial = optimizeWeightedBuildGoals({ ...request(g, 0), ...selected }, undefined, options);
    expect(new Set(initial.addedNodeIds)).toEqual(new Set(["hit", "goal"]));
    const applied = applySkillSupportPriorities(selected, getSkillPreferencePreset("ice-strike")!);
    const refined = optimizeWeightedBuildGoals({ ...request(g, 0), ...applied }, undefined, options);
    expect(new Set(refined.addedNodeIds)).toEqual(new Set(["area", "goal"]));
    expect(refined.weighted?.score).toBe(2);
    expect(refined.pointCost).toBe(initial.pointCost);
    expect(refined.weighted?.maxPointCost).toBe(2);
  });
  it.each([
    ["spark", "lightning-arrow", "criticalChance", "15% increased Critical Hit Chance", "30% increased Critical Hit Chance for Spells"],
    ["lightning-arrow", "spark", "criticalChance", "15% increased Critical Hit Chance", "30% increased Critical Hit Chance for Attacks"],
    ["lightning-arrow", "spark", "areaOfEffect", "10% increased Area of Effect", "20% increased Area of Effect for Attacks"],
  ] as const)("routes %s using the matching %s-scoped effect without changing point costs", (focusSkillId, otherFocus, id, general, scoped) => {
    const g = graph([["start", "general"], ["general", "goal"], ["start", "scoped"], ["scoped", "goal"]], { general: [general], scoped: [scoped] });
    const r = { ...request(g, 0), focusSkillId, preferences: [{ id, weight: 1 }] };
    const matched = optimizeWeightedBuildGoals(r, undefined, options);
    expect(new Set(matched.addedNodeIds)).toEqual(new Set(["scoped", "goal"]));
    expect(matched.pointCost).toBe(2);
    expect(matched.weighted).toMatchObject({ score: 2, maxPointCost: 2, contributions: [{ id, score: 2, nodeCount: 1 }] });
    const unmatched = optimizeWeightedBuildGoals({ ...r, focusSkillId: otherFocus }, undefined, options);
    expect(new Set(unmatched.addedNodeIds)).toEqual(new Set(["general", "goal"]));
    expect(unmatched.weighted?.score).toBe(1);
    const shortest = { ...r, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("uses support context to block scoped spell crit without deleting the manual generic preference", () => {
    const g = graph([["start", "general"], ["general", "goal"], ["start", "scoped"], ["scoped", "goal"]], {
      general: ["15% increased Critical Hit Chance"], scoped: ["30% increased Critical Hit Chance for Spells"],
    });
    const r = { ...request(g, 0), focusSkillId: "spark", preferences: [{ id: "criticalChance" as const, weight: 3 }] };
    expect(optimizeWeightedBuildGoals(r, undefined, options).weighted?.score).toBe(6);
    const blocked = optimizeWeightedBuildGoals({ ...r, supportGemIds: ["controlled-destruction"] }, undefined, options);
    expect(new Set(blocked.addedNodeIds)).toEqual(new Set(["general", "goal"]));
    expect(blocked.weighted).toMatchObject({ score: 3, contributions: [{ id: "criticalChance", score: 3, nodeCount: 1 }] });
    expect(r.preferences).toEqual([{ id: "criticalChance", weight: 3 }]);
  });
  it("counts mixed and negative scoped values once in route breakdowns", () => {
    const g = graph([["start", "goal"]], { goal: ["15% increased Critical Hit Chance", "30% reduced Critical Hit Chance for Attacks", "10% increased Area of Effect", "5% reduced Area of Effect for Attacks"] });
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), focusSkillId: "lightning-arrow",
      preferences: [{ id: "criticalChance", weight: 1 }, { id: "areaOfEffect", weight: 1 }] }, undefined, options);
    expect(result.pointCost).toBe(1);
    expect(result.weighted).toMatchObject({ score: -0.5, contributions: [{ id: "criticalChance", score: -1, nodeCount: 1 }, { id: "areaOfEffect", score: 0.5, nodeCount: 1 }] });
  });
  it("uses a scoped spell-speed bonus in routing and breakdown only for a matching focus", () => {
    const g = graph([["start", "general"], ["general", "goal"], ["start", "scoped"], ["scoped", "goal"]], {
      general: ["10% increased Projectile Speed"], scoped: ["15% increased Projectile Speed for Spell Skills"],
    });
    const r = { ...request(g, 0), preferences: [{ id: "projectileSpeed" as const, weight: 3 }] };
    const spell = optimizeWeightedBuildGoals({ ...r, focusSkillId: "spark" }, undefined, options);
    expect(new Set(spell.addedNodeIds)).toEqual(new Set(["scoped", "goal"]));
    expect(spell.pointCost).toBe(2);
    expect(spell.weighted).toMatchObject({ score: 4.5, maxPointCost: 2, contributions: [{ id: "projectileSpeed", score: 4.5, nodeCount: 1 }] });
    for (const focusSkillId of [undefined, "lightning-arrow", "enfeeble", "skeletal-arsonist", "unknown"]) {
      const other = optimizeWeightedBuildGoals({ ...r, focusSkillId }, undefined, options);
      expect(new Set(other.addedNodeIds)).toEqual(new Set(["general", "goal"]));
      expect(other.weighted?.score).toBe(3);
    }
    const shortest = { ...r, focusSkillId: "spark", mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
  it("penalizes scoped reductions and counts mixed lines in a required route once", () => {
    const g = graph([["start", "goal"]], { goal: ["5% increased Projectile Speed", "10% reduced Projectile Speed for Spell Skills"] });
    const r = { ...request(g, 0), preferences: [{ id: "projectileSpeed" as const, weight: 3 }] };
    const result = optimizeWeightedBuildGoals({ ...r, focusSkillId: "spark" }, undefined, options);
    expect(result.pointCost).toBe(1);
    expect(result.weighted).toMatchObject({ score: -1.5, contributions: [{ id: "projectileSpeed", score: -1.5, nodeCount: 1 }] });
    expect(optimizeWeightedBuildGoals({ ...r, focusSkillId: "lightning-arrow" }, undefined, options).weighted?.score).toBe(1.5);
  });
  it("applies the support-selected priority once to spell-scoped speed, without inventing a damage bonus", () => {
    const g = graph([["start", "goal"]], { goal: ["15% increased Projectile Speed for Spell Skills"] });
    const settings = applySkillSupportPriorities({ mode: "weighted", extraPointBudget: 0, focusSkillId: "spark",
      supportGemIds: ["projectile-acceleration-iii"], preferences: [] }, getSkillPreferencePreset("spark")!);
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), ...settings }, undefined, options);
    expect(result.weighted).toMatchObject({ score: 4.5, contributions: [{ id: "projectileSpeed", score: 4.5, nodeCount: 1 }] });
    expect(result.pointCost).toBe(1);
  });
  it("uses support-refined projectile priorities on equal-cost routes without changing budgets or multiplying gem damage", () => {
    const g = graph([["start", "spell"], ["spell", "goal"], ["start", "speed"], ["speed", "goal"]], {
      spell: ["8% increased Spell Damage"], speed: ["10% increased Projectile Speed"],
    });
    const base = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset("spark")!);
    const supported = applySkillSupportPriorities({ ...base, supportGemIds: ["projectile-acceleration-iii"] }, getSkillPreferencePreset("spark")!);
    const original = optimizeWeightedBuildGoals({ ...request(g, 0), preferences: base.preferences }, undefined, options);
    const refined = optimizeWeightedBuildGoals({ ...request(g, 0), preferences: supported.preferences }, undefined, options);
    expect(new Set(original.addedNodeIds)).toEqual(new Set(["spell", "goal"]));
    expect(new Set(refined.addedNodeIds)).toEqual(new Set(["speed", "goal"]));
    expect(refined.weighted?.score).toBe(3);
    expect(original.pointCost).toBe(2);
    expect(refined.pointCost).toBe(2);
    expect(refined.weighted?.maxPointCost).toBe(2);
    const shortestRequest = { ...request(g, 0), ...supported, mode: "shortest" as const };
    expect(runOptimizerRequest(shortestRequest)).toMatchObject(optimizeBuildGoals(shortestRequest));
  });
  it("routes an Enfeeble preset through outgoing curse bonuses, not Spell Damage or incoming curse protection", () => {
    const g = graph([["start", "spell"], ["spell", "goal"], ["start", "curse"], ["curse", "goal"], ["goal", "incoming"]], {
      spell: ["100% increased Spell Damage"], curse: ["6% increased Curse Magnitudes"], incoming: ["100% reduced effect of Curses on you"],
    });
    const presetSettings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset("enfeeble")!);
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), preferences: presetSettings.preferences }, undefined, options);
    expect(result.pointCost).toBe(2);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["curse", "goal"]));
    expect(result.weighted?.score).toBe(3);
  });
  it("uses a minion preset without treating player attack speed as minion attack speed", () => {
    const g = graph([["start", "player"], ["player", "goal"], ["start", "minion"], ["minion", "goal"]], {
      player: ["100% increased Attack Speed"], minion: ["Minions have 3% increased Attack and Cast Speed"],
    });
    const presetSettings = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 0, preferences: [] }, getSkillPreferencePreset("skeletal-arsonist")!);
    const result = optimizeWeightedBuildGoals({ ...request(g, 0), preferences: presetSettings.preferences }, undefined, options);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["minion", "goal"]));
    expect(result.weighted?.score).toBe(2);
  });
  it("keeps shortest dispatch unchanged", () => {
    const r = { ...request(graph([["start", "goal"]])), mode: "shortest" as const };
    expect(runOptimizerRequest(r)).toMatchObject(optimizeBuildGoals(r));
  });
  it("chooses an alternate equal-cost route with a zero extra-point budget", () => {
    const g = graph([["start", "a"], ["a", "goal"], ["start", "shield"], ["shield", "goal"]], { shield: ["12% increased maximum Energy Shield"] });
    const result = optimizeWeightedBuildGoals(request(g, 0), undefined, options);
    expect(result.addedNodeIds).toContain("shield");
    expect(result.pointCost).toBe(2);
    expect(result.weighted).toMatchObject({ baselinePointCost: 2, maxPointCost: 2, score: 1 });
  });
  it("finds a longer rewarding route rather than only reranking shortest routes", () => {
    const g = graph([["start", "a"], ["a", "goal"], ["start", "shield1"], ["shield1", "shield2"], ["shield2", "goal"]],
      { shield1: ["12% increased maximum Energy Shield"], shield2: ["12% increased maximum Energy Shield"] });
    const result = optimizeWeightedBuildGoals(request(g), undefined, options);
    expect(result.pointCost).toBe(3);
    expect(new Set(result.addedNodeIds)).toEqual(new Set(["shield1", "shield2", "goal"]));
    expect(result.weighted?.score).toBe(2);
    expect(optimizeBuildGoals({ ...request(g), mode: "shortest" }).pointCost).toBe(2);
  });
  it("can spend extra points on nearby branches without losing any required goal", () => {
    const g = graph([["start", "hub"], ["hub", "goal"], ["hub", "goal2"], ["hub", "shield"]], { shield: ["24% increased maximum Energy Shield"] });
    const result = optimizeWeightedBuildGoals({ ...request(g), goalNodeIds: ["goal", "goal2"] }, undefined, options);
    expect(result.pointCost).toBe(4);
    expect(result.addedNodeIds).toEqual(expect.arrayContaining(["goal", "goal2", "shield"]));
    for (const candidate of result.routeCandidates ?? []) {
      expect(candidate.pointCost).toBeLessThanOrEqual(4);
      expect(candidate.pointCost).toBe(new Set(candidate.addedNodeIds).size);
    }
  });
  it("never adds an attractive branch outside the budget or double-counts shared and base nodes", () => {
    const g = graph([["start", "base"], ["base", "goal"], ["base", "travel"], ["travel", "shield"]], {
      base: ["120% increased maximum Energy Shield"], shield: ["120% increased maximum Energy Shield"], goal: ["12% increased maximum Energy Shield"],
    });
    const result = optimizeWeightedBuildGoals({ ...request(g), baseNodeIds: ["start", "base", "base"], baseEdgeKeys: [treeEdgeKey("start", "base")] }, undefined, options);
    expect(result.pointCost).toBe(1);
    expect(result.weighted?.score).toBe(1);
    expect(result.totalNodeIds).toEqual(["start", "base", "goal"]);
    expect(result.totalEdgeKeys).toContain(treeEdgeKey("start", "base"));
  });
  it("does not auto-allocate unrequested keystones or disconnected rewarding nodes", () => {
    const g = graph([["start", "goal"], ["goal", "keystone"], ["isolated", "island"]], { keystone: ["120% increased maximum Energy Shield"], island: ["120% increased maximum Energy Shield"] });
    g.nodes.keystone.flags.keystone = true;
    const result = optimizeWeightedBuildGoals(request(g, 3), undefined, options);
    expect(result.addedNodeIds).toEqual(["goal"]);
  });
  it("handles unreachable goals, no preferences and cancellation", () => {
    const r = request(graph([["start", "mid"], ["island", "goal"]]));
    expect(optimizeWeightedBuildGoals(r, undefined, options).status).toBe("unreachable");
    expect(optimizeWeightedBuildGoals({ ...r, preferences: [] }, undefined, options).status).toBe("error");
    expect(optimizeWeightedBuildGoals(request(graph([["start", "goal"]])), undefined, { ...options, shouldCancel: () => true }).status).toBe("cancelled");
  });
  it("honors relative priorities rather than simply accumulating raw percentages", () => {
    const g = graph([["start", "goal"], ["goal", "life"], ["goal", "shield"]], {
      life: ["3% increased maximum Life"], shield: ["24% increased maximum Energy Shield"],
    });
    const result = optimizeWeightedBuildGoals({ ...request(g), preferences: [{ id: "life", weight: 3 }, { id: "energyShield", weight: 1 }] }, undefined, options);
    expect(result.addedNodeIds).toContain("life");
    expect(result.addedNodeIds).not.toContain("shield");
    expect(result.weighted?.score).toBe(3);
  });
  it("uses the remaining total budget instead of adding 123 points on top of the baseline", () => {
    const g = graph([["start", "base"], ["base", "goal"], ["goal", "shield1"], ["shield1", "shield2"]], {
      shield1: ["12% increased maximum Energy Shield"], shield2: ["12% increased maximum Energy Shield"],
    });
    g.nodes.start.flags.classStart = true;
    const result = optimizeWeightedBuildGoals({ ...request(g), baseNodeIds: ["start", "base", "base"], baseEdgeKeys: [treeEdgeKey("start", "base")],
      pointBudgetMode: "all-available", totalPointLimit: 3, extraPointBudget: 123 }, undefined, options);
    expect(result.weighted).toMatchObject({ basePointCost: 1, totalPointLimit: 3, maxPointCost: 2, pointBudgetMode: "all-available" });
    expect(result.pointCost).toBe(2);
    expect(result.totalNodeIds).toContain("shield1");
    expect(result.totalNodeIds).not.toContain("shield2");
    expect(result.routeCandidates?.every((route) => route.pointCost <= 2)).toBe(true);
  });
  it("caps the full tree at 123 while rewarding reachable preferred branches", () => {
    const ids = Array.from({ length: 130 }, (_, index) => `shield${index}`);
    const g = graph([["start", "goal"], ["goal", ids[0]], ...ids.slice(1).map((id, index) => [ids[index], id])],
      Object.fromEntries(ids.map((id) => [id, ["12% increased maximum Energy Shield"]])));
    g.nodes.start.flags.classStart = true;
    const result = optimizeWeightedBuildGoals({ ...request(g), pointBudgetMode: "all-available" }, undefined, { ...options, maxIterations: 1 });
    expect(result.pointCost).toBe(123);
    expect(result.weighted?.maxPointCost).toBe(123);
    expect(new Set(result.totalNodeIds).size).toBe(124);
  });
  it("does not apply a partial route when required goals exceed the remaining budget", () => {
    const g = graph([["start", "base"], ["base", "travel"], ["travel", "goal"]]);
    g.nodes.start.flags.classStart = true;
    const result = optimizeWeightedBuildGoals({ ...request(g), baseNodeIds: ["start", "base"], baseEdgeKeys: [treeEdgeKey("start", "base")], pointBudgetMode: "all-available", totalPointLimit: 2 }, undefined, options);
    expect(result.status).toBe("error");
    expect(result.message).toContain("only 1 remain");
    expect(result.addedNodeIds).toEqual([]);
  });
  it("finishes immediately when no points remain and the goals are already allocated", () => {
    const g = graph([["start", "goal"], ["goal", "shield"]], { shield: ["12% increased maximum Energy Shield"] });
    g.nodes.start.flags.classStart = true;
    const result = optimizeWeightedBuildGoals({ ...request(g), baseNodeIds: ["start", "goal"], baseEdgeKeys: [treeEdgeKey("start", "goal")], pointBudgetMode: "all-available", totalPointLimit: 1 }, undefined, options);
    expect(result.status).toBe("success");
    expect(result.pointCost).toBe(0);
    expect(result.message).toContain("No unspent points");
  });
  it("labels large-goal baselines as found rather than proven exact", () => {
    const goalIds = Array.from({ length: 11 }, (_, index) => `goal${index}`);
    const g = graph([...goalIds.map((id) => ["start", id]), ["start", "shield"]], { shield: ["12% increased maximum Energy Shield"] });
    const result = optimizeWeightedBuildGoals({ ...request(g), goalNodeIds: goalIds }, undefined, options);
    expect(result.weighted).toMatchObject({ baselineExact: false, baselinePointCost: 11, maxPointCost: 12 });
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(goalIds));
    expect(result.pointCost).toBe(12);
  });
  it("can add useful passives when all goals are already allocated", () => {
    const g = graph([["start", "goal"], ["goal", "shield"]], { shield: ["12% increased maximum Energy Shield"] });
    const result = optimizeWeightedBuildGoals({ ...request(g), baseNodeIds: ["start", "goal"], baseEdgeKeys: [treeEdgeKey("start", "goal")] }, undefined, options);
    expect(result.addedNodeIds).toEqual(["shield"]);
    expect(result.weighted?.baselinePointCost).toBe(0);
  });
  it("reports non-decreasing preference scores and keeps a shortest baseline for comparison", () => {
    const progress: number[] = [];
    const snapshots: number[][] = [];
    const g = graph([["start", "goal"], ["goal", "shield"]], { shield: ["12% increased maximum Energy Shield"] });
    const result = optimizeWeightedBuildGoals(request(g), (r) => {
      if (r.weighted?.stage === "preferences") {
        progress.push(r.weighted.score);
        snapshots.push(r.improvementHistory!);
      }
    }, options);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
    expect(result.routeCandidates?.some((candidate) => candidate.label === "shortest-baseline")).toBe(true);
    expect(snapshots[0]).toEqual([0]);
    expect(snapshots.at(-1)).toEqual([0, 1]);
  });
});

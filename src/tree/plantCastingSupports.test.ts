import { describe, expect, it } from "vitest";
import { plantCastingSkillIds as skills, plantCastingSupportFixtures as supports, plantCastingComponentFixtures as components } from "./plantSkillSupports.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId,
  preferences: [{ id: "castSpeed", weight: 1 }, { id: "life", weight: 3 }, { id: "plantDamage", weight: 3 }, { id: "criticalChance", weight: 2 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", position: { x: 0, y: 0 }, flags: {}, stats });

describe("reviewed Plant casting supports", () => {
  it.each(supports)("admits $id for both reviewed self-cast focuses without changing scores or manual preferences", (f) => {
    for (const id of skills) {
      const support = reviewedSkillSupportsFor(id).find((s) => s.id === f.id)!;
      expect({ effectId: support.effectId, family: support.family }).toEqual({ effectId: f.effectId, family: f.family });
      const current = settings(id);
      const selected = setSkillSupport(current, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
      expect(refineSkillPreferencePreset(preset(id), [f.id]).passiveStatScopes).toEqual(preset(id).passiveStatScopes);
      expect(addSkillPresetPreferences(selected, preset(id)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
      const passive = node("12% increased Damage with Plant Skills", "5% increased Cast Speed", "2% reduced Cast Speed",
        "Minions have 100% increased Cast Speed", "100% increased Cast Speed while Overgrown");
      expect(passivePreferenceValues(passive, selected)).toEqual(passivePreferenceValues(passive, current));
      expect(scorePassiveNode(passive, selected.preferences, selected)).toBe(scorePassiveNode(passive, current.preferences, current));
      expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
    }
  });

  it.each(skills)("offers %s's cast-speed trade-off only through explicit priority actions", (id) => {
    const current = settings(id);
    for (const f of supports.filter((s) => s.family === "RapidCasting")) {
      const selected = setSkillSupport(current, f.id, true);
      expect(skillSupportPriorityChanges(selected, preset(id))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(id))).toEqual(selected);
      expect(refineSkillPreferencePreset(preset(id), [f.id]).suggestions).toEqual(preset(id).suggestions);
    }
    const selected = setSkillSupport(current, "considered-casting", true);
    expect(skillSupportPriorityChanges(selected, preset(id))).toMatchObject([{ id: "castSpeed", weight: 2 }]);
    expect(refineSkillPreferencePreset(preset(id), selected.supportGemIds).suggestions.find((s) => s.id === "castSpeed")?.weight).toBe(2);
    const applied = applySkillSupportPriorities(selected, preset(id));
    expect(applied).toEqual({ ...selected, preferences: [{ id: "castSpeed", weight: 2 }, ...current.preferences.slice(1)] });
    expect(skillSupportPriorityChanges(applied, preset(id))).toEqual([]);
    expect(setSkillSupport(applied, "considered-casting", false).preferences).toEqual(applied.preferences);
    const noSpeed = { ...selected, preferences: current.preferences.slice(1) };
    expect(applySkillSupportPriorities(noSpeed, preset(id)).preferences).toEqual([...noSpeed.preferences, { id: "castSpeed", weight: 2 }]);
    expect(addSkillPresetPreferences(noSpeed, preset(id)).preferences).toContainEqual({ id: "castSpeed", weight: 2 });
  });

  it.each(skills)("keeps one Rapid tier, independent families and %s's saved settings", (id) => {
    let current = { ...settings(id), supportGemIds: ["efficiency-ii", "considered-casting"] };
    for (const tier of ["rapid-casting-i", "rapid-casting-ii", "rapid-casting-iii"]) current = setSkillSupport(current, tier, true) as typeof current;
    expect(current.supportGemIds).toEqual(["efficiency-ii", "considered-casting", "rapid-casting-iii"]);
    expect(normalizeSkillSupportIds(id, ["rapid-casting-i", "rapid-casting-ii", "rapid-casting-iii", "considered-casting"])).toEqual(["rapid-casting-i", "considered-casting"]);
    expect(current.preferences).toEqual(settings(id).preferences);
    const [saved] = normalizeSavedBuilds([{ id, name: id, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "druid", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))[0].state.optimizerSettings).toEqual(current);
  });

  it.each(["briarpatch", "toxic-domain"])("does not infer casting support for the unreviewed %s focus", (id) => {
    for (const f of supports) {
      expect(normalizeSkillSupportIds(id, [f.id])).toEqual([]);
      expect(setSkillSupport(settings(id), f.id, true)).toEqual(settings(id));
    }
  });

  it.each(components)("independently checks $skill / $component native cast rates without converting them into DPS", (f) => {
    // PoB rounds the combined speed multiplier to two decimals before dividing.
    const rate = (increased = 0, less = 0) => Math.round(((1 + increased / 100) * (1 - less / 100) + Number.EPSILON) * 100) / 100 / f.castTime;
    expect(rate()).toBeCloseTo(f.baselineRate, 10);
    expect(rate(15)).toBeCloseTo(f.rapidI, 10);
    expect(rate(20)).toBeCloseTo(f.rapidII, 10);
    expect(rate(0)).toBeCloseTo(f.rapidIII0, 10);
    expect(rate(10)).toBeCloseTo(f.rapidIII1, 10);
    expect(rate(30)).toBeCloseTo(f.rapidIII3, 10);
    expect(rate(100)).toBeCloseTo(f.increased100, 10);
    expect(rate(120)).toBeCloseTo(f.increased100WithII, 10);
    expect(f.increased100WithII / f.increased100).toBeCloseTo(1.1, 10);
    expect(rate(0, 15)).toBeCloseTo(f.considered, 10);
    expect(rate(20, 15)).toBeCloseTo(f.rapidIIWithConsidered, 10);
    expect(rate(30, 15)).toBeCloseTo(f.rapidIII3WithConsidered, 10);
    expect(rate(30, 15)).not.toBeCloseTo(1.3 * 0.85 / f.castTime, 5);
    expect(f.castTime / 0.85).toBeGreaterThan(f.castTime * 1.15);
    expect(f.rapidCost).toBe(f.baselineCost);
    if ("baselineDuration" in f) expect(f.supportedDuration).toBe(f.baselineDuration);
    if ("baselineSecondaryDuration" in f) expect(f.supportedSecondaryDuration).toBe(f.baselineSecondaryDuration);
  });

  it("keeps conditional speed, fixed timing, additive speed and self-cast trade-offs explicit", () => {
    for (const id of skills) {
      const text = (support: string) => selectedSkillSupports(preset(id), [support])[0].summary;
      expect(text("rapid-casting-ii")).toContain("additive with other increased cast speed, not 20% more");
      expect(text("rapid-casting-iii")).toContain("Conditional 10% increased cast speed per different spell cast in the last eight seconds");
      expect(text("rapid-casting-iii")).toContain("Rotation and uptime are not assumed");
      expect(text("considered-casting")).toContain("35% more damage, 15% less cast speed and a 115% Mana-cost multiplier");
      expect(text("considered-casting")).toContain("base self-cast");
      expect(text("considered-casting")).toContain("opt-in responsiveness suggestion");
      for (const f of supports) expect(text(f.id)).toContain(id === "entangle" ? "100 ms vine-application interval" : "50% of cast time");
    }
  });

  it("retains existing Shortest cost and weighted route scoring until the user changes priorities", () => {
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "plant", "bridge"].map((id) => [id, { ...node(), id,
        stats: id === "plant" ? ["20% increased Damage with Plant Skills", "10% increased Cast Speed"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: [["start", "plain"], ["plain", "goal"], ["start", "plant"], ["plant", "bridge"], ["bridge", "goal"]].map(([from, to]) => ({ from, to })),
      groups: {}, classStarts: { druid: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    for (const focusSkillId of skills) {
      const request = { graph, mode: "weighted" as const, focusSkillId, preferences: [{ id: "plantDamage" as const, weight: 3 }], extraPointBudget: 1,
        baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
      const baseline = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
      const supported = optimizeWeightedBuildGoals({ ...request, supportGemIds: ["rapid-casting-iii", "considered-casting"] }, undefined, { maxIterations: 8 });
      expect(supported.totalNodeIds).toEqual(baseline.totalNodeIds);
      expect(supported.pointCost).toBe(3);
      expect(supported.weighted?.score).toBe(6);
      const shortest = { ...request, mode: "shortest" as const, supportGemIds: ["rapid-casting-iii", "considered-casting"] };
      expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
      expect(runOptimizerRequest(shortest).pointCost).toBe(2);
    }
  });
});

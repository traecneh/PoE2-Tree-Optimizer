import { describe, expect, it } from "vitest";
import { plantCritEchoCompatibilityFixtures as pairs, plantCritEchoSupportFixtures as supports, plantCritComponentFixtures as components,
  plantEchoAreaFixture as echoArea } from "./plantSkillSupports.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId,
  preferences: [{ id: "criticalChance", weight: 3 }, { id: "criticalDamageBonus", weight: 2 }, { id: "castSpeed", weight: 1 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", position: { x: 0, y: 0 }, flags: {}, stats });

describe("reviewed Plant critical-hit prohibition and Echo eligibility", () => {
  it.each(pairs)("admits only $skill's explicitly reviewed combinations without changing manual settings", ({ skill, allowed }) => {
    for (const f of supports) {
      const current = settings(skill);
      const admitted = (allowed as readonly string[]).includes(f.id);
      const selected = setSkillSupport(current, f.id, true);
      expect(normalizeSkillSupportIds(skill, [f.id])).toEqual(admitted ? [f.id] : []);
      if (!admitted) { expect(selected).toBe(current); continue; }
      const support = reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ effectId: support.effectId, family: support.family }).toEqual({ effectId: f.effectId, family: f.family });
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
      expect(addSkillPresetPreferences(selected, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
      expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
    }
  });

  it.each(["entangle", "thrashing-vines"])("blocks %s's scoped spell critical modifiers, not unrelated manual generic weights", (id) => {
    const current = settings(id);
    const selected = setSkillSupport(current, "controlled-destruction", true);
    const scoped = node("30% increased Critical Hit Chance for Spells", "5% reduced Critical Hit Chance for Spells",
      "20% increased Critical Spell Damage Bonus", "5% reduced Critical Spell Damage Bonus",
      "100% increased Critical Hit Chance for Attacks", "Minions have 100% increased Critical Hit Chance");
    expect(passivePreferenceValues(scoped, current)).toEqual({ criticalChance: 25, criticalDamageBonus: 15, minionCriticalChance: 100 });
    expect(passivePreferenceValues(scoped, selected)).toEqual({ minionCriticalChance: 100 });
    expect(scorePassiveNode(scoped, selected.preferences, selected)).toBe(0);
    const manual = node("15% increased Critical Hit Chance", "10% increased Critical Damage Bonus");
    expect(passivePreferenceValues(manual, selected)).toEqual({ criticalChance: 15, criticalDamageBonus: 10 });
    expect(scorePassiveNode(manual, selected.preferences, selected)).toBe(5);
    expect(selected.preferences).toEqual(current.preferences);
    expect(skillSupportPriorityChanges(selected, preset(id))).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset(id))).toEqual(selected);
    const refined = refineSkillPreferencePreset(preset(id), selected.supportGemIds);
    expect(refined.passiveStatScopes).toEqual(preset(id).passiveStatScopes!.filter((s) => !["spellCriticalChance", "spellCriticalDamageBonus"].includes(s)));
    for (const key of ["criticalChance", "criticalDamageBonus"]) {
      expect(refined.exclusions.find((e) => e.id === key)?.reason.toLowerCase()).toContain("manual");
      expect(refined.suggestions.some((s) => s.id === key)).toBe(false);
    }
    const removed = setSkillSupport(selected, "controlled-destruction", false);
    expect(refineSkillPreferencePreset(preset(id), removed.supportGemIds)).toEqual(preset(id));
    expect(passivePreferenceValues(scoped, removed)).toEqual(passivePreferenceValues(scoped, current));
  });

  it("retains the Echo trade-off and both independent families without granting unconditional area or damage", () => {
    const current = settings("thrashing-vines");
    const selected = setSkillSupport(setSkillSupport(current, "controlled-destruction", true), "spell-echo", true);
    expect(selected.supportGemIds).toEqual(["controlled-destruction", "spell-echo"]);
    expect(selected.preferences).toEqual(current.preferences);
    expect(skillSupportPriorityChanges(selected, preset(current.focusSkillId!))).toMatchObject([{ id: "castSpeed", weight: 2 }]);
    const applied = applySkillSupportPriorities(selected, preset("thrashing-vines"));
    expect(applied.preferences).toEqual(current.preferences.map((p) => p.id === "castSpeed" ? { ...p, weight: 2 } : p));
    expect(setSkillSupport(applied, "spell-echo", false).preferences).toEqual(applied.preferences);
    const passive = node("12% increased Damage with Plant Skills", "10% increased Cast Speed", "10% increased Area of Effect");
    expect(passivePreferenceValues(passive, selected)).toEqual(passivePreferenceValues(passive, current));
    expect(scorePassiveNode(passive, selected.preferences, selected)).toBe(scorePassiveNode(passive, current.preferences, current));
    expect(normalizeSkillSupportIds("entangle", ["spell-echo", "controlled-destruction"])).toEqual(["controlled-destruction"]);
  });

  it.each(["entangle", "thrashing-vines"])("round-trips %s's admitted supports and all manual priorities through saved JSON", (id) => {
    const optimizerSettings = { ...settings(id), supportGemIds: id === "entangle" ? ["efficiency-ii", "controlled-destruction"] : ["efficiency-ii", "controlled-destruction", "spell-echo"] };
    const [saved] = normalizeSavedBuilds([{ id, name: id, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "druid", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))[0].state.optimizerSettings).toEqual(optimizerSettings);
  });

  it.each(components)("freezes $skill / $component's crit prohibition and Echo acceptance independently", (f) => {
    expect(f.baseCrit).toBeGreaterThan(0);
    expect(f.highCrit).toBe(100);
    expect(f.controlledCrit).toBe(0);
    expect(f.controlledHighCrit).toBe(0);
    expect(f.controlledRate).toBe(f.baselineRate);
    expect(f.controlledCost).toBe(f.baselineCost);
    expect(f.echoRate).toBeCloseTo(f.baselineRate * (f.echoApplied ? 0.7 : 1), 10);
    expect(f.echoCost).toBe(f.baselineCost * (f.echoApplied ? 1.5 : 1));
    expect(f.echoRepeats).toBe(f.echoApplied ? 2 : 1);
  });

  it("keeps repeat-only area separate from the initial radius, duration and guaranteed hit count", () => {
    expect(echoArea.noneRadius).toBe(echoArea.radius);
    expect(Math.floor(echoArea.radius * Math.sqrt(1 + echoArea.echoOnlyAreaIncrease / 200))).toBe(echoArea.averageRadius);
    expect(Math.floor(echoArea.radius * Math.sqrt(1 + echoArea.echoOnlyAreaIncrease / 100))).toBe(echoArea.finalRadius);
    expect(echoArea.finalRadius).not.toBe(echoArea.radius * 1.4);
    expect(echoArea.durationWithEcho).toBe(echoArea.durationBefore);
    expect(echoArea.secondaryWithEcho).toBe(echoArea.secondaryBefore);
    const summary = selectedSkillSupports(preset("thrashing-vines"), ["spell-echo"])[0].summary;
    expect(summary).toContain("Adds one Echo with 30% less cast speed and a 150% Mana-cost multiplier");
    expect(summary).toContain("40% increased area is Echo-only");
    expect(summary).toContain("double hit count or DPS is not assumed");
    for (const id of ["entangle", "thrashing-vines"]) {
      const text = selectedSkillSupports(preset(id), ["controlled-destruction"])[0].summary;
      expect(text).toContain("25% more spell-hit damage");
      expect(text).toContain("cannot critically hit");
      expect(text).toContain("Manual critical priorities remain selected with warnings");
    }
    expect(reviewedSkillSupports.find((s) => s.id === "spell-echo")!.skillOverrides?.entangle).toBeUndefined();
  });

  it("preserves required goals, Shortest cost and non-critical weighted scores without support multipliers", () => {
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "plant", "bridge"].map((id) => [id, { ...node(), id,
        stats: id === "plant" ? ["20% increased Damage with Plant Skills"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: [["start", "plain"], ["plain", "goal"], ["start", "plant"], ["plant", "bridge"], ["bridge", "goal"]].map(([from, to]) => ({ from, to })),
      groups: {}, classStarts: { druid: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    for (const focusSkillId of ["entangle", "thrashing-vines"]) {
      const request = { graph, mode: "weighted" as const, focusSkillId, preferences: [{ id: "plantDamage" as const, weight: 3 }], extraPointBudget: 1,
        baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
      const supportGemIds = normalizeSkillSupportIds(focusSkillId, ["controlled-destruction", "spell-echo"]);
      const baseline = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
      const supported = optimizeWeightedBuildGoals({ ...request, supportGemIds }, undefined, { maxIterations: 8 });
      expect(supported.totalNodeIds).toEqual(baseline.totalNodeIds);
      expect(supported.totalNodeIds).toContain("goal");
      expect(supported.pointCost).toBe(3);
      expect(supported.weighted?.score).toBe(6);
      const shortest = { ...request, mode: "shortest" as const, supportGemIds };
      expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
      expect(runOptimizerRequest(shortest).pointCost).toBe(2);
    }
  });
});

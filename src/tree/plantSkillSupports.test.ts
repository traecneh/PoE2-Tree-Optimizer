import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { plantIds } from "./plantSkills.fixtures";
import { plantSupportFixtures as supports, plantSupportComponentFixtures as components, plantUtilitySupportFixtures as utilitySupports,
  plantUtilityCompatibilityFixtures as utilityPairs, plantUtilityCostFixtures as costs, plantMobilityFixture,
  plantCastingSkillIds, plantCastingSupportFixtures, plantCritEchoCompatibilityFixtures, plantCritEchoSupportFixtures } from "./plantSkillSupports.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId,
  preferences: [{ id: "plantDamage", weight: 1 }, { id: "life", weight: 3 }, { id: "fireDamage", weight: 2 }, { id: "poisonMagnitude", weight: 3 }] });

describe("reviewed Plant support refinements", () => {
  it.each(supports)("admits $id only by explicit review with frozen identity, family and effect magnitude", (f) => {
    const support = reviewedSkillSupports.find((s) => s.id === f.id)!;
    expect({ effectId: support.effectId, family: support.family }).toEqual({ effectId: f.effectId, family: f.family });
    expect(support.priorities).toEqual([]);
    for (const id of plantIds) {
      expect(support.skillIds).toContain(id);
      const resolved = preCommon45SupportsFor(id).find((s) => s.id === f.id)!;
      expect(resolved.summary).toContain(`${f.amount}% ${f.kind === "area" ? "increased area" : f.kind === "duration" ? "more skill-effect duration" : "more Physical Damage"}`);
      expect(normalizeSkillSupportIds(id, [f.id])).toEqual([f.id]);
      expect(refineSkillPreferencePreset(preset(id), [f.id]).passiveStatScopes).toEqual(preset(id).passiveStatScopes);
    }
  });

  it.each(plantIds)("offers only explicitly reviewed supports for %s and preserves settings on selection/removal", (id) => {
    const allowedUtility = utilityPairs.find((p) => p.skill === id)!.allowed as readonly string[];
    const allowedCasting = (plantCastingSkillIds as readonly string[]).includes(id) ? plantCastingSupportFixtures.map((s) => s.id) : [];
    const allowedCritEcho = plantCritEchoCompatibilityFixtures.find((f) => f.skill === id)!.allowed as readonly string[];
    expect(preCommon45SupportsFor(id).map((s) => s.id).sort()).toEqual([...supports.map((s) => s.id), ...allowedUtility, ...allowedCasting, ...allowedCritEcho].sort());
    const current = { ...settings(id), goals: ["required"] };
    for (const f of [...supports, ...utilitySupports.filter((s) => allowedUtility.includes(s.id))]) {
      const selected = setSkillSupport(current, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(normalizePassiveOptimizationSettings(selected)).toMatchObject({ focusSkillId: id, supportGemIds: [f.id], preferences: current.preferences,
        extraPointBudget: 7, pointBudgetMode: "all-available" });
      expect(addSkillPresetPreferences(selected, preset(id)).preferences.slice(0, 4)).toEqual(current.preferences);
      expect(skillSupportPriorityChanges(selected, preset(id))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(id))).toEqual(selected);
      expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
    }
    for (const unsupported of ["constructor",
      ...plantCritEchoSupportFixtures.filter((s) => !allowedCritEcho.includes(s.id)).map((s) => s.id),
      ...plantCastingSupportFixtures.filter((s) => !allowedCasting.includes(s.id)).map((s) => s.id),
      ...utilitySupports.filter((s) => !allowedUtility.includes(s.id)).map((s) => s.id)]) {
      expect(setSkillSupport(current, unsupported, true)).toBe(current);
      expect(normalizeSkillSupportIds(id, [unsupported])).toEqual([]);
    }
  });

  it.each(utilitySupports)("freezes $id's identity and magnitude without adding passive priority or scope changes", (f) => {
    const support = reviewedSkillSupports.find((s) => s.id === f.id)!;
    expect({ effectId: support.effectId, family: support.family }).toEqual({ effectId: f.effectId, family: f.family });
    expect(support.priorities).toEqual([]);
    expect(f.multiplier).toBeCloseTo(1 - f.amount / 100);
    for (const pair of utilityPairs) if ((pair.allowed as readonly string[]).includes(f.id)) {
      expect(selectedSkillSupports(preset(pair.skill), [f.id])[0].summary).toContain(`${f.amount}% less`);
      expect(refineSkillPreferencePreset(preset(pair.skill), [f.id]).passiveStatScopes).toEqual(preset(pair.skill).passiveStatScopes);
    }
  });

  it.each(utilityPairs)("normalizes $skill's utility families without admitting incompatible stored selections", ({ skill, allowed }) => {
    const valid = allowed as readonly string[];
    const ids = ["efficiency-ii", "efficiency-i", "mobility"].filter((id) => valid.includes(id) && id !== "efficiency-i");
    const current = { ...settings(skill), supportGemIds: [...ids, "magnified-area-ii", "prolonged-duration-ii", "brutality-iii"] };
    expect(normalizeSkillSupportIds(skill, ["efficiency-ii", "efficiency-i", "mobility"])).toEqual(ids);
    const selected = normalizePassiveOptimizationSettings(current);
    expect(selected).toEqual(current);
    if (valid.includes("efficiency-i")) {
      expect(setSkillSupport(current, "efficiency-i", true).supportGemIds).toEqual([...ids.filter((id) => id !== "efficiency-ii"),
        "magnified-area-ii", "prolonged-duration-ii", "brutality-iii", "efficiency-i"]);
    }
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "druid", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))[0].state.optimizerSettings).toEqual(current);
    expect(normalizePassiveOptimizationSettings({ ...current, supportGemIds: ["efficiency-i", "efficiency-ii", "mobility"] }).preferences).toEqual(current.preferences);
  });

  it.each(costs)("checks $skill's individual Efficiency cost examples independently", (f) => {
    expect(Math.ceil(f.baseline * 0.7)).toBe(f.efficiencyI);
    expect(Math.ceil(f.baseline * 0.6)).toBe(f.efficiencyII);
  });

  it("keeps Entangle use-action movement separate from global speed, casting and Plant timers", () => {
    const f = plantMobilityFixture;
    expect(100 - f.penalty).toBe(f.baselineRetainedSpeed);
    expect(100 - f.penalty * 0.75).toBe(f.supportedRetainedSpeed);
    expect(f.globalSpeedAfter).toBe(f.globalSpeedBefore);
    expect(f.castRateAfter).toBe(f.castRateBefore);
    const text = (id: string, support: string) => preCommon45SupportsFor(id).find((s) => s.id === support)!.summary;
    expect(text("entangle", "mobility")).toContain("not global Movement Speed or Cast Speed");
    expect(text("entangle", "mobility")).toContain("100 ms vine-application interval");
    expect(text("thrashing-vines", "efficiency-i")).toContain("not spawn rate, retarget speed or uptime");
    expect(text("toxic-domain", "efficiency-ii")).toContain("not Bloom's increased costs for other skills");
    expect(text("toxic-domain", "efficiency-ii")).toContain("detonation delay and cooldown stay separate");
  });

  it.each(plantIds)("keeps one tier per family and three independent families for %s", (id) => {
    let current = settings(id);
    for (const f of supports) current = setSkillSupport(current, f.id, true);
    expect(current.supportGemIds).toEqual(["magnified-area-ii", "prolonged-duration-ii", "brutality-iii"]);
    expect(current.preferences).toEqual(settings(id).preferences);
    expect(normalizeSkillSupportIds(id, supports.map((s) => s.id))).toEqual(["magnified-area-i", "prolonged-duration-i", "brutality-i"]);
    expect(normalizeSkillSupportIds(id, ["brutality-iii", "brutality-i", "brutality-iii", null, {}])).toEqual(["brutality-iii"]);
  });

  it.each(plantIds)("warns about %s's Elemental/Chaos/Poison conflicts under Brutality without deleting manual weights", (id) => {
    for (const support of ["brutality-i", "brutality-ii", "brutality-iii"]) {
      const current = setSkillSupport(settings(id), support, true);
      const refined = refineSkillPreferencePreset(preset(id), current.supportGemIds);
      expect(refined.suggestions.map((s) => s.id)).toContain("plantDamage");
      expect(refined.exclusions.map((e) => e.id)).toEqual(expect.arrayContaining(["fireDamage", "coldDamage", "lightningDamage", "elementalDamage", "chaosDamage",
        "firePenetration", "coldPenetration", "lightningPenetration", "elementalPenetration", "poisonChance", "poisonMagnitude", "poisonDuration"]));
      expect(refined.exclusions.find((e) => e.id === "poisonMagnitude")?.reason).toContain("still affects routing");
      expect(refined.exclusions.filter((e) => e.id === "poisonMagnitude")).toHaveLength(1);
      const restored = refineSkillPreferencePreset(preset(id), setSkillSupport(current, support, false).supportGemIds);
      expect(restored).toEqual(preset(id));
      expect(current.preferences).toEqual(settings(id).preferences);
    }
  });

  it("keeps component-specific text, reservation and Poison warnings out of unrelated skill summaries", () => {
    const text = (id: string, support: string) => preCommon45SupportsFor(id).find((s) => s.id === support)!.summary;
    expect(text("entangle", "magnified-area-i")).toContain("not attached-vine area damage");
    expect(text("entangle", "prolonged-duration-i")).toContain("one-second attached-vine timer is not verified");
    expect(text("briarpatch", "magnified-area-ii")).toContain("Spirit reservation stays unchanged");
    expect(text("thrashing-vines", "prolonged-duration-ii")).toContain("eight-second and five-second timers");
    expect(text("toxic-domain", "prolonged-duration-ii")).toContain("separate 15-second base detonation timer");
    expect(text("toxic-domain", "brutality-iii")).toContain("not a recommendation for a Poison build");
    expect(text("toxic-domain", "brutality-iii")).toContain("20% chance");
    expect(text("toxic-domain", "brutality-iii")).toContain("not unconditional penetration");
    expect(text("contagion", "magnified-area-i")).toBe(reviewedSkillSupports.find((s) => s.id === "magnified-area-i")!.summary);
    expect(selectedSkillSupports(preset("toxic-domain"), ["brutality-i"])[0].summary).toContain("prevents its Poison damage");
    expect(selectedSkillSupports(preset("bone-cage"), ["brutality-i"])[0].exclusions?.some((e) => e.id === "poisonMagnitude")).toBe(false);
    for (const support of reviewedSkillSupports) for (const [id, override] of Object.entries(support.skillOverrides ?? {})) {
      expect(support.skillIds).toContain(id);
      expect(override.summary).not.toBe("");
    }
  });

  it.each(components)("independently checks $skill / $component area and duration arithmetic against frozen native results", (f) => {
    expect(Math.floor(f.radius * Math.sqrt(1.35))).toBe(f.magnifiedI);
    expect(Math.floor(f.radius * Math.sqrt(1.45))).toBe(f.magnifiedII);
    const roundedDuration = (duration: number, multiplier: number) => Math.ceil(duration * multiplier / 0.033) * 0.033;
    if ("duration" in f) {
      expect(roundedDuration(f.duration, 1.3)).toBeCloseTo(f.prolongedI);
      expect(roundedDuration(f.duration, 1.35)).toBeCloseTo(f.prolongedII);
    }
    if ("secondaryDuration" in f) {
      expect(roundedDuration(f.secondaryDuration, 1.3)).toBeCloseTo(f.secondaryProlongedI);
      expect(roundedDuration(f.secondaryDuration, 1.35)).toBeCloseTo(f.secondaryProlongedII);
    }
    if ("detonationWithoutSupport" in f) {
      expect(f.detonationWithProlongedI).toBe(f.detonationWithoutSupport);
      expect(f.detonationWithProlongedII).toBe(f.detonationWithoutSupport);
      expect(f.poisonDpsWithoutSupport).toBeGreaterThan(0);
      expect(f.poisonDpsWithBrutality).toBe(0);
    }
    if ("spiritWithoutSupport" in f) expect(f.spiritWithAllSevenIndividualSupports).toBe(f.spiritWithoutSupport);
  });

  it.each(plantIds)("preserves %s's passive score, budget and owner separation for admitted and rejected supports", (id) => {
    const p = node("12% increased Damage with Plant Skills", "2% reduced Damage with Plant Skills", "20% increased Spell Area Damage", "10% increased Attack Area Damage",
      "Minions deal 100% increased Damage", "100% increased Damage with Plant Skills while Overgrown");
    const base = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 3, preferences: [] }, preset(id));
    for (const support of [...supports, ...utilitySupports]) {
      const selected = setSkillSupport(base, support.id, true);
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, base));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, base.preferences, base));
      expect(selected.extraPointBudget).toBe(3);
    }
  });

  it.each(plantIds)("round-trips %s's support families and manual settings through saved JSON", (id) => {
    const selected = { ...settings(id), supportGemIds: ["magnified-area-ii", "prolonged-duration-ii", "brutality-iii"] };
    const [saved] = normalizeSavedBuilds([{ id, name: id, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "druid", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(saved.state.optimizerSettings).toEqual(selected);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
  });

  it("keeps weighted Plant detours and Shortest costs independent of support damage multipliers", () => {
    const edges = [["start", "plain"], ["plain", "goal"], ["start", "plant"], ["plant", "bridge"], ["bridge", "goal"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "plant", "bridge"].map((id) => [id, { ...node(), id,
        stats: id === "plant" ? ["20% increased Damage with Plant Skills"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from, to]) => ({ from, to })), groups: {}, classStarts: { druid: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, focusSkillId: "entangle", preferences: [{ id: "plantDamage" as const, weight: 3 }], extraPointBudget: 1,
      baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
    const baseline = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    const supported = optimizeWeightedBuildGoals({ ...request, supportGemIds: ["magnified-area-ii", "prolonged-duration-ii", "brutality-iii", "efficiency-ii", "mobility"] }, undefined, { maxIterations: 8 });
    expect(supported.totalNodeIds).toEqual(baseline.totalNodeIds);
    expect(supported.pointCost).toBe(3);
    expect(supported.weighted?.score).toBe(6);
    const shortest = { ...request, mode: "shortest" as const, supportGemIds: ["brutality-iii"] };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

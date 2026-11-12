import { describe, expect, it } from "vitest";
import { availableMainPointLimit, deriveWeaponAttachments, fixedWeaponComponents } from "./allocationConstraints";
import { optimizeBuildGoals, optimizeBuildGoalsAnytime, type BuildGoalsOptimizeRequest, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { independentlyValid, validationGraph } from "./buildGoalsValidation.fixtures";

function fixture(): BuildGoalsOptimizeRequest {
  const graph = validationGraph([["start", "travel"], ["travel", "goal"], ["start", "anchor"], ["anchor", "w1"], ["w1", "w1-end"], ["anchor", "w2"], ["travel", "reward"]]);
  graph.nodes.reward.stats = ["+10 to Strength"]; graph.nodes.w1.stats = ["+1000 to Strength"];
  return { graph, mode: "weighted", rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"],
    preferences: [{ id: "attributes", weight: 1 }], extraPointBudget: 8, totalPointLimit: 4,
    weaponSets: { allocations: { 1: ["w1", "w1-end"], 2: ["w2"] }, attachmentNodeIds: ["anchor"] } };
}
describe("optimizer allocation safety", () => {
  it.each(["extra", "all-available"] as const)("caps %s additions after fixed base cost and preserves weapon anchors", (pointBudgetMode) => {
    const request = fixture(); request.pointBudgetMode = pointBudgetMode;
    request.baseNodeIds.push("travel"); request.baseEdgeKeys.push("start::travel");
    const progress: BuildGoalsOptimizeResult[] = [];
    const result = optimizeWeightedBuildGoals(request, (r) => progress.push(r), { maxIterations: 16 });
    expect(result).toMatchObject({ status: "success", pointCost: 3, weighted: { maxPointCost: 3, baselinePointCost: 2, score: 2 } });
    for (const row of [...progress, result]) {
      expect(row.totalNodeIds).toContain("anchor"); expect(row.totalNodeIds).not.toContain("w1");
      expect(row.totalNodeIds.length - 1).toBeLessThanOrEqual(4);
      expect(independentlyValid(request, row)).toBe(true);
      expect(createBuildGoalsValidation(request).validateResult(row)).toEqual([]);
    }
    expect(request.weaponSets!.allocations).toEqual({ 1: ["w1", "w1-end"], 2: ["w2"] });
    expect(request.goalNodeIds).toEqual(["goal"]);
  });
  it("accounts for the weapon reserve exactly once, even when the caller already supplied the adjusted cap", () => {
    const weapons = fixture().weaponSets!; weapons.allocations[1] = Array.from({ length: 24 }, (_, i) => `w${i}`);
    expect(availableMainPointLimit({ mode: "weighted", weaponSets: weapons })).toBe(99);
    expect(availableMainPointLimit({ mode: "weighted", totalPointLimit: 99, weaponSets: weapons })).toBe(99);
    expect(availableMainPointLimit({ mode: "weighted", totalPointLimit: 90, weaponSets: weapons })).toBe(90);
  });
  it("enforces an explicit cap in shortest mode without changing the exact path algorithm", () => {
    const request = { ...fixture(), mode: "shortest" as const, totalPointLimit: 2 };
    for (const run of [optimizeBuildGoals, (r: BuildGoalsOptimizeRequest) => optimizeBuildGoalsAnytime(r, undefined, { maxIterations: 16 })]) {
      expect(run(request)).toMatchObject({ status: "error", pointCost: 0 });
      const result = run({ ...request, totalPointLimit: 3 });
      expect(result).toMatchObject({ status: "success", pointCost: 3 });
      expect(result.totalNodeIds).toContain("anchor");
    }
  });
  it("does not publish over-cap weighted baselines or infeasible exact results", () => {
    const request = { ...fixture(), totalPointLimit: 2 }, progress: BuildGoalsOptimizeResult[] = [];
    expect(optimizeWeightedBuildGoals(request, (r) => progress.push(r), { maxIterations: 16 }).status).toBe("error");
    expect(progress).toEqual([]);
    expect(optimizeBuildGoalsAnytime({ ...request, mode: "shortest" }, (r) => progress.push(r)).status).toBe("error");
    expect(progress).toEqual([]);
  });
  it("rejects an over-cap fixed base without removing committed nodes", () => {
    const request = fixture(); request.baseNodeIds = ["start", "travel"]; request.baseEdgeKeys = ["start::travel"]; request.totalPointLimit = 0;
    const original = [...request.baseNodeIds];
    expect(optimizeWeightedBuildGoals(request).status).toBe("error"); expect(request.baseNodeIds).toEqual(original);
  });
  it("derives only root-connected shared boundary nodes, not all original shared nodes or detached grants", () => {
    const request = fixture(), graph = request.graph;
    graph.nodes.detached = { ...graph.nodes.anchor, id: "detached" }; graph.edges.push({ from: "detached", to: "w2" });
    const shared = ["start", "travel", "goal", "anchor", "detached"];
    expect(deriveWeaponAttachments(graph, shared, request.weaponSets!.allocations, "start")).toEqual(["anchor"]);
    expect(fixedWeaponComponents(graph, request.weaponSets!, ["start"])).toHaveLength(2);
  });
  it.each(["reserved-goal", "reserved-base", "overlap", "missing-anchor", "unknown", "locked", "over-24"])("rejects invalid fixed-weapon context: %s", (kind) => {
    const request = fixture();
    if (kind === "reserved-goal") request.goalNodeIds.push("w1");
    if (kind === "reserved-base") { request.baseNodeIds.push("anchor", "w1"); request.baseEdgeKeys.push("anchor::start", "anchor::w1"); }
    if (kind === "overlap") request.weaponSets!.allocations[2].push("w1");
    if (kind === "missing-anchor") request.weaponSets!.attachmentNodeIds = [];
    if (kind === "unknown") request.weaponSets!.allocations[1].push("missing");
    if (kind === "locked") request.graph.nodes.w1.visibility = { requiredAscendancy: { id: "oracle", name: "Oracle", className: "Druid" } };
    if (kind === "over-24") request.weaponSets!.allocations[1].push(...Array.from({ length: 24 }, (_, i) => `unknown${i}`));
    expect(optimizeWeightedBuildGoals(request, undefined, { maxIterations: 0 }).status).toBe("error");
  });
  it("never borrows a connection through the opposite weapon set", () => {
    const request = fixture(); request.graph.edges = request.graph.edges.filter((e) => !(e.from === "anchor" && e.to === "w2"));
    request.graph.edges.push({ from: "w1", to: "w2" });
    expect(createBuildGoalsValidation(request).issues.some((issue) => issue.code === "weapon-attachment")).toBe(true);
  });
  it("validates every alternative against point caps and required weapon attachments", () => {
    const request = fixture(); const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 16 });
    expect(result.status).toBe("success");
    const missing = structuredClone(result); missing.totalNodeIds = missing.totalNodeIds.filter((id) => id !== "anchor");
    expect(createBuildGoalsValidation(request).validateResult(missing).length).toBeGreaterThan(0);
    expect(createBuildGoalsValidation({ ...request, totalPointLimit: 3 }).validateResult(result).some((issue) => issue.code === "point-budget")).toBe(true);
    const nextWeapons = structuredClone(request.weaponSets!); nextWeapons.attachmentNodeIds.push("reward");
    const noReward = optimizeBuildGoals({ ...request, mode: "shortest" });
    expect(createBuildGoalsValidation({ ...request, mode: "shortest", weaponSets: nextWeapons }).validateResult(noReward).some((issue) => issue.code === "missing-required")).toBe(true);
  });
  it("keeps uncapped developer shortest stress requests available, while weighted defaults to the normal cap", () => {
    const pairs: [string, string][] = [["start", "n0"]];
    for (let i = 1; i < 124; i += 1) pairs.push([`n${i - 1}`, `n${i}`]);
    const graph = validationGraph(pairs), request = { graph, mode: "shortest" as const, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["n123"] };
    expect(optimizeBuildGoals(request)).toMatchObject({ status: "success", pointCost: 124 });
    expect(optimizeWeightedBuildGoals({ ...request, mode: "weighted", preferences: [{ id: "attributes", weight: 1 }] }).status).toBe("error");
  });
});

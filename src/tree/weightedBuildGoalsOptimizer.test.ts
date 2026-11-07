import { describe, expect, it } from "vitest";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { treeEdgeKey } from "./pathAllocation";
import type { TreeGraph } from "./types";

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
    const result = optimizeWeightedBuildGoals({ ...request(g), baseNodeIds: ["start", "base"], pointBudgetMode: "all-available", totalPointLimit: 2 }, undefined, options);
    expect(result.status).toBe("error");
    expect(result.message).toContain("only 1 remain");
    expect(result.addedNodeIds).toEqual([]);
  });
  it("finishes immediately when no points remain and the goals are already allocated", () => {
    const g = graph([["start", "goal"], ["goal", "shield"]], { shield: ["12% increased maximum Energy Shield"] });
    g.nodes.start.flags.classStart = true;
    const result = optimizeWeightedBuildGoals({ ...request(g), baseNodeIds: ["start", "goal"], pointBudgetMode: "all-available", totalPointLimit: 1 }, undefined, options);
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

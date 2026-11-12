import { describe, expect, it } from "vitest";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import { buildOptimizerGraph, routeCandidateFromSolution, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";
import { optionalBranchExchangeSeeds } from "./weightedBranchExchange";
import { exhaustiveTreeReward, weightedBranchExchangeFixture } from "./weightedBranchExchange.fixtures";
import { exhaustiveWeightedReward, weightedBundleFixture } from "./weightedBundleSearch.fixtures";
import { independentlyValid, validationGraph } from "./buildGoalsValidation.fixtures";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { treeEdgeKey } from "./pathAllocation";

describe("optional weighted branch exchanges", () => {
  it.each(["extra", "all-available"] as const)("replaces a weaker detour: 62 to the independent optimum 63 within nine points (%s)", (pointBudgetMode) => {
    const { request, rewards } = weightedBranchExchangeFixture(); request.pointBudgetMode = pointBudgetMode;
    const options = { maxIterations: 16 };
    const before = optimizeWeightedBuildGoals(request, undefined, { ...options, enableBranchExchanges: false });
    expect(before).toMatchObject({ status: "success", pointCost: 9, weighted: { score: 62 } });
    expect(before.totalNodeIds).toContain("a1r3"); expect(before.totalNodeIds).not.toContain("a6r1");
    const progress: BuildGoalsOptimizeResult[] = [];
    const after = optimizeWeightedBuildGoals(request, (candidate) => progress.push(candidate), options);
    expect(exhaustiveTreeReward(request, rewards, 9)).toEqual({ score: 63, pointCost: 9 });
    expect(after).toMatchObject({ status: "success", pointCost: 9, weighted: { score: 63, maxPointCost: 9 } });
    expect(after.totalNodeIds).not.toContain("a1r3"); expect(after.totalNodeIds).toContain("a6r1");
    expect(progress.some((candidate) => candidate.weighted?.score === 62)).toBe(true);
    for (const candidate of [...progress, after]) {
      expect(independentlyValid(request, candidate)).toBe(true);
      expect(createBuildGoalsValidation(request).validateResult(candidate)).toEqual([]);
    }
    expect(after.routeCandidates?.some((candidate) => candidate.label === "shortest-baseline")).toBe(true);
    expect(after.routeCandidates?.every((candidate) => candidate.pointCost <= 9)).toBe(true);
    expect(optimizeWeightedBuildGoals(request, undefined, options)).toEqual(after);
  });
  it.each(["goal", "base"] as const)("cannot exchange a required %s node even when its effect is weaker", (kind) => {
    const { request, rewards } = weightedBranchExchangeFixture();
    if (kind === "goal") request.goalNodeIds.push("a1r3");
    else { request.baseNodeIds.push("a1r3"); request.baseEdgeKeys.push("a1r3::start"); }
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 16 });
    expect(result.totalNodeIds).toContain("a1r3");
    expect(result.weighted!.score).toBe(exhaustiveTreeReward(request, rewards, kind === "base" ? 8 : 9).score);
    expect(result.totalEdgeKeys).toEqual(expect.arrayContaining(request.baseEdgeKeys));
    expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
  });
  it("does not refill an exchanged branch through an excluded or locked reward", () => {
    for (const kind of ["excluded", "locked", "keystone"] as const) {
      const { request } = weightedBranchExchangeFixture();
      if (kind === "excluded") request.excludedNodeIds = ["a6r1"];
      if (kind === "locked") request.graph.nodes.a6r1.visibility = { requiredAscendancy: { id: "oracle", name: "Oracle", className: "Druid" } };
      if (kind === "keystone") request.graph.nodes.a6r1.flags.keystone = true;
      const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 16 });
      expect(result).toMatchObject({ status: "success", weighted: { score: 62 } });
      expect(result.totalNodeIds).not.toContain("a6r1");
      expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
    }
  });
  it("honors cancellation and inactivity during an exchange improvement", () => {
    for (const kind of ["cancel", "deadline"] as const) {
      const { request } = weightedBranchExchangeFixture(); let stop = false, clock = 0;
      const result = optimizeWeightedBuildGoals(request, (candidate) => {
        if ((candidate.weighted?.score ?? 0) > 62) { stop = true; clock = 100; }
      }, { maxIterations: 16, shouldCancel: () => kind === "cancel" && stop, now: () => clock, noImprovementMs: 50 });
      expect(result).toMatchObject({ status: kind === "cancel" ? "cancelled" : "success", completeReason: kind === "cancel" ? "cancelled" : "no-improvement", weighted: { score: 63 } });
      expect(createBuildGoalsValidation(request).validateResult({ ...result, status: "success" })).toEqual([]);
    }
  });
  it("retains the fast fallback with no iterations and keeps connected-bundle lookahead independent", () => {
    const { request } = weightedBranchExchangeFixture();
    const options = { maxIterations: 0 };
    expect(optimizeWeightedBuildGoals(request, undefined, options)).toEqual(optimizeWeightedBuildGoals(request, undefined, { ...options, enableBranchExchanges: false }));
    const bundle = weightedBundleFixture();
    expect(optimizeWeightedBuildGoals(bundle.request, undefined, { maxIterations: 16, enableBranchExchanges: false })).toMatchObject({ weighted: { score: 20 } });
  });
  it("checks the tree oracle against raw-subset enumeration on signed tiny trees", () => {
    for (let trial = 0; trial < 30; trial += 1) {
      const graph = validationGraph([["start", "goal"], ["start", "a"], ["a", "b"], ["a", "c"], ["c", "d"]]);
      const request = { graph, rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], mode: "weighted" as const,
        preferences: [{ id: "attributes" as const, weight: 1 }], extraPointBudget: 3 };
      const rewards = { a: trial % 7 - 3, b: trial % 3, c: 2, d: trial % 5 - 2 };
      for (const [id, score] of Object.entries(rewards)) graph.nodes[id].stats = [`${score >= 0 ? "+" : ""}${score * 5} to Strength`];
      expect(exhaustiveTreeReward(request, rewards, 4)).toEqual(exhaustiveWeightedReward(request, rewards, 4));
      const before = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 16, enableBranchExchanges: false });
      const after = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 16 });
      expect(after.weighted!.score).toBeGreaterThanOrEqual(before.weighted!.score - 1e-9);
      expect(after.weighted!.score).toBeLessThanOrEqual(exhaustiveTreeReward(request, rewards, 4).score + 1e-9);
      const literalScore = after.addedNodeIds.reduce((sum, id) => sum + (rewards[id as keyof typeof rewards] ?? 0), 0);
      expect(after.weighted!.score).toBe(literalScore);
      expect(independentlyValid(request, after)).toBe(true);
    }
  });
  it("removes whole optional subtrees without breaking shared goal paths, cycles or fixed base edges", () => {
    const graph = validationGraph([["start", "base"], ["base", "trunk"], ["trunk", "goal"], ["trunk", "weak"], ["weak", "leaf"], ["weak", "loop"], ["loop", "trunk"]]);
    const request = { graph, mode: "shortest" as const, rootNodeId: "start", baseNodeIds: ["start", "base"], baseEdgeKeys: ["base::start"], goalNodeIds: ["goal"] };
    const indexed = buildOptimizerGraph(graph, request.baseNodeIds), indexes = indexed.nodeIndexById;
    const solution = { nodeIndexes: new Set(indexes.values()), edgeKeys: new Set(graph.edges.map((e) => treeEdgeKey(e.from, e.to))) };
    const required = new Set(["start", "base", "goal"].map((id) => indexes.get(id)!));
    const seeds = optionalBranchExchangeSeeds(solution, required, indexes, indexed.nodeIds.map((id) => id === "weak" ? -4 : id === "leaf" ? 1 : 0), indexes.get("start")!, 8, () => false);
    expect(seeds.length).toBeGreaterThan(0);
    for (const seed of seeds) {
      expect(seed.nodeIndexes.has(indexes.get("trunk")!)).toBe(true);
      expect(seed.edgeKeys.has("base::start")).toBe(true);
      expect(independentlyValid(request, { ...routeCandidateFromSolution("test", seed, request.baseNodeIds, request.baseEdgeKeys, indexed), status: "success", unreachableGoalNodeIds: [] })).toBe(true);
    }
    expect(optionalBranchExchangeSeeds(solution, required, indexes, [], indexes.get("start")!, 8, () => true)).toEqual([]);
    expect(optionalBranchExchangeSeeds(solution, required, indexes, [], indexes.get("start")!, 0, () => false)).toEqual([]);
    expect(optionalBranchExchangeSeeds({ ...solution, edgeKeys: new Set() }, required, indexes, [], indexes.get("start")!, 8, () => false)).toEqual([]);
  });
});

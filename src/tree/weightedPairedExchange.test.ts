import { describe, expect, it } from "vitest";
import { optionalBranchExchangeSeeds, optionalPairedBranchExchangeSeeds } from "./weightedBranchExchange";
import { weightedPairedExchangeFixture } from "./weightedPairedExchange.fixtures";
import { exhaustiveTreeReward } from "./weightedBranchExchange.fixtures";
import { exhaustiveWeightedReward } from "./weightedBundleSearch.fixtures";
import { buildOptimizerGraph, routeCandidateFromSolution, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import { independentlyValid, validationGraph } from "./buildGoalsValidation.fixtures";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { treeEdgeKey } from "./pathAllocation";

function fixtureSeeds() {
  const data = weightedPairedExchangeFixture(), indexed = buildOptimizerGraph(data.request.graph, data.request.baseNodeIds);
  const selected = new Set(data.incumbentNodeIds);
  const solution = { nodeIndexes: new Set(data.incumbentNodeIds.map((id) => indexed.nodeIndexById.get(id)!)),
    edgeKeys: new Set(data.request.graph.edges.filter((e) => selected.has(e.from) && selected.has(e.to)).map((e) => treeEdgeKey(e.from, e.to))) };
  const required = new Set(["start", "goal"].map((id) => indexed.nodeIndexById.get(id)!));
  const scores = indexed.nodeIds.map((id) => data.rewards[id] ?? 0), root = indexed.nodeIndexById.get("start")!;
  return { ...data, indexed, solution, required, scores, root };
}

describe("bounded two-branch exchanges", () => {
  it("frees six unique points only by removing both weak branches, with an independent 24-at-7 optimum", () => {
    const { request, rewards, indexed, solution, required, scores, root } = fixtureSeeds();
    expect(exhaustiveTreeReward(request, rewards, 7)).toEqual({ score: 24, pointCost: 7 });
    expect(exhaustiveWeightedReward(request, rewards, 7)).toEqual({ score: 24, pointCost: 7 });
    const singles = optionalBranchExchangeSeeds(solution, required, indexed.nodeIndexById, scores, root, 6, () => false);
    for (const seed of singles) {
      const fixed = [...seed.nodeIndexes].map((i) => indexed.nodeIds[i]);
      const retained = fixed.reduce((sum, id) => sum + (rewards[id] ?? 0), 0);
      const best = exhaustiveTreeReward({ ...request, baseNodeIds: fixed }, rewards, 7 - (fixed.length - 1));
      expect(retained + best.score).toBeLessThanOrEqual(20);
    }
    const pairs = optionalPairedBranchExchangeSeeds(solution, required, indexed.nodeIndexById, scores, root, 99, () => false);
    expect(pairs).toHaveLength(2);
    expect([...pairs[0].nodeIndexes].map((i) => indexed.nodeIds[i]).sort()).toEqual(["goal", "start"]);
    expect(solution.nodeIndexes.size - pairs[0].nodeIndexes.size).toBe(6);
    expect(new Set(pairs.map((p) => [...p.nodeIndexes].sort().join("|"))).size).toBe(pairs.length);
  });
  it.each(["extra", "all-available"] as const)("improves isolated exchange search from 20 to 24 without increasing the seven-point %s budget", (pointBudgetMode) => {
    const { request } = weightedPairedExchangeFixture(); request.pointBudgetMode = pointBudgetMode;
    // Disable the independent baseline-bundle strategy to isolate the exchange mechanism.
    const options = { maxIterations: 128, enableBundleLookahead: false };
    const before = optimizeWeightedBuildGoals(request, undefined, { ...options, enablePairedBranchExchanges: false });
    const rows: BuildGoalsOptimizeResult[] = [], pairEvents: number[] = [];
    const after = optimizeWeightedBuildGoals(request, (r) => rows.push(r), { ...options, onPairExchange: (e) => pairEvents.push(e.seeds) });
    expect(before).toMatchObject({ pointCost: 7, weighted: { score: 20 } });
    expect(after).toMatchObject({ pointCost: 7, weighted: { score: 24 } });
    expect(pairEvents.length).toBeGreaterThan(0); expect(pairEvents.every((n) => n <= 2)).toBe(true);
    for (const r of [...rows, after]) {
      expect(independentlyValid(request, r)).toBe(true);
      expect(createBuildGoalsValidation(request).validateResult(r)).toEqual([]);
    }
    expect(after.routeCandidates?.every((r) => r.pointCost <= 7)).toBe(true);
    expect(optimizeWeightedBuildGoals(request, undefined, options)).toEqual(after);
  });
  it("does not require a gain where another enabled strategy already finds the optimum", () => {
    const { request } = weightedPairedExchangeFixture();
    for (const enablePairedBranchExchanges of [false, true]) {
      expect(optimizeWeightedBuildGoals(request, undefined, { maxIterations: 128, enablePairedBranchExchanges }).weighted!.score).toBe(24);
    }
  });
  it("rejects nested/overlapping pairs, respects limits and cancellation, and does not mutate its input", () => {
    const { indexed, solution, required, scores, root } = fixtureSeeds();
    const before = { nodes: [...solution.nodeIndexes], edges: [...solution.edgeKeys], scores: [...scores] };
    expect(optionalPairedBranchExchangeSeeds(solution, required, indexed.nodeIndexById, scores, root, 0, () => false)).toEqual([]);
    expect(optionalPairedBranchExchangeSeeds(solution, required, indexed.nodeIndexById, scores, root, NaN, () => false)).toEqual([]);
    expect(optionalPairedBranchExchangeSeeds(solution, required, indexed.nodeIndexById, scores, root, 2, () => true)).toEqual([]);
    let calls = 0;
    expect(optionalPairedBranchExchangeSeeds(solution, required, indexed.nodeIndexById, scores, root, 2, () => ++calls > 3)).toEqual([]);
    const onlyOneBranch = { nodeIndexes: new Set([...solution.nodeIndexes].filter((i) => !indexed.nodeIds[i].startsWith("b"))),
      edgeKeys: new Set([...solution.edgeKeys].filter((key) => !key.includes("b"))) };
    expect(optionalPairedBranchExchangeSeeds(onlyOneBranch, required, indexed.nodeIndexById, scores, root, 2, () => false)).toEqual([]);
    expect({ nodes: [...solution.nodeIndexes], edges: [...solution.edgeKeys], scores }).toEqual(before);
  });
  it("counts signed removal losses and keeps required paths, fixed edges and cycles connected", () => {
    const graph = validationGraph([["start", "base"], ["base", "trunk"], ["trunk", "goal"], ["trunk", "a"], ["a", "a-leaf"], ["trunk", "b"], ["b", "b-leaf"], ["a-leaf", "b-leaf"]]);
    const request = { graph, mode: "shortest" as const, baseNodeIds: ["start", "base"], baseEdgeKeys: ["base::start"], goalNodeIds: ["goal"] };
    const indexed = buildOptimizerGraph(graph, request.baseNodeIds), map = indexed.nodeIndexById;
    const solution = { nodeIndexes: new Set(map.values()), edgeKeys: new Set(graph.edges.map((e) => treeEdgeKey(e.from, e.to))) };
    const required = new Set(["start", "base", "goal"].map((id) => map.get(id)!));
    const pairs = optionalPairedBranchExchangeSeeds(solution, required, map, indexed.nodeIds.map((id) => id === "a" ? -10 : id === "b" ? -5 : 1), map.get("start")!, 2, () => false);
    expect(pairs.length).toBeGreaterThan(0);
    const signed = indexed.nodeIds.map((id) => id === "a" ? -10 : id === "b" ? -5 : 1);
    const removed = [...solution.nodeIndexes].filter((i) => !pairs[0].nodeIndexes.has(i));
    expect(removed).toHaveLength(4); expect(removed.reduce((sum, i) => sum + signed[i], 0)).toBe(-13);
    for (const seed of pairs) {
      expect(seed.edgeKeys.has("base::start")).toBe(true); expect(seed.nodeIndexes.has(map.get("trunk")!)).toBe(true);
      expect(independentlyValid(request, { ...routeCandidateFromSolution("test", seed, request.baseNodeIds, request.baseEdgeKeys, indexed), status: "success", unreachableGoalNodeIds: [] })).toBe(true);
    }
  });
  it.each(["goal", "base", "weapon"] as const)("cannot remove protected %s attachments to make room", (kind) => {
    const { request } = weightedPairedExchangeFixture();
    if (kind === "goal") request.goalNodeIds.push("a2");
    if (kind === "base") { request.baseNodeIds.push("a0", "a1", "a2"); request.baseEdgeKeys.push("a0::start", "a0::a1", "a1::a2"); }
    if (kind === "weapon") {
      request.graph.nodes.w1 = { ...request.graph.nodes.a2, id: "w1", stats: ["+5000 to Strength"] };
      request.graph.edges.push({ from: "a2", to: "w1" });
      request.weaponSets = { allocations: { 1: ["w1"], 2: [] }, attachmentNodeIds: ["a2"] };
    }
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 128, enableBundleLookahead: false });
    expect(result.totalNodeIds).toContain("a2"); expect(result.totalNodeIds).not.toContain("w1");
    expect(result.totalEdgeKeys).toEqual(expect.arrayContaining(request.baseEdgeKeys));
    expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
  });
  it.each(["cancel", "deadline"] as const)("honors %s at pair dispatch and retains the valid incumbent", (kind) => {
    const { request } = weightedPairedExchangeFixture(); let stop = false, clock = 0;
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 128, enableBundleLookahead: false,
      now: () => clock, noImprovementMs: 50, shouldCancel: () => kind === "cancel" && stop,
      onPairExchange: () => { stop = true; clock = 100; } });
    expect(result).toMatchObject({ status: kind === "cancel" ? "cancelled" : "success", completeReason: kind === "cancel" ? "cancelled" : "no-improvement", weighted: { score: 20 } });
    expect(createBuildGoalsValidation(request).validateResult({ ...result, status: "success" })).toEqual([]);
  });
  it("can cancel after a paired improvement without losing it", () => {
    const { request } = weightedPairedExchangeFixture(); let stop = false;
    const result = optimizeWeightedBuildGoals(request, (r) => { if (r.weighted?.score === 24) stop = true; }, {
      maxIterations: 128, enableBundleLookahead: false, shouldCancel: () => stop,
    });
    expect(result).toMatchObject({ status: "cancelled", weighted: { score: 24 }, pointCost: 7 });
    expect(createBuildGoalsValidation(request).validateResult({ ...result, status: "success" })).toEqual([]);
  });
  it("deduplicates settled incumbents and keeps pair rounds separated by fast restarts", () => {
    const { request } = weightedPairedExchangeFixture();
    const collect = (maxIterations: number) => {
      const events: { iteration: number; revision: number; seeds: number }[] = [];
      optimizeWeightedBuildGoals(request, undefined, { maxIterations, enableBundleLookahead: false, onPairExchange: (e) => events.push(e) });
      return events;
    };
    const events = collect(128);
    expect(events.length).toBeGreaterThan(0); expect(collect(512)).toEqual(events);
    expect(new Set(events.map((e) => e.revision)).size).toBe(events.length);
    events.slice(1).forEach((e, i) => expect(e.iteration - events[i].iteration).toBeGreaterThanOrEqual(16));
  });
});

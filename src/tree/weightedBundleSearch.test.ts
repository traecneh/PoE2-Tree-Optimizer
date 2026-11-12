import { describe, expect, it } from "vitest";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import { optimizeBuildGoals, optimizeBuildGoalsAnytime, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { independentlyValid, validationGraph } from "./buildGoalsValidation.fixtures";
import { weightedBundleFixture, exhaustiveWeightedReward } from "./weightedBundleSearch.fixtures";

describe("connected-bundle weighted lookahead", () => {
  it("improves 12 to the independently proven score 20 at the same nine-point budget", () => {
    const { request, rewards } = weightedBundleFixture();
    const legacy = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 256, enableBundleLookahead: false, enableBranchExchanges: false });
    expect(legacy).toMatchObject({ pointCost: 9, weighted: { score: 12 } });
    const progress: BuildGoalsOptimizeResult[] = [];
    const result = optimizeWeightedBuildGoals(request, (candidate) => progress.push(candidate), { maxIterations: 256 });
    expect(exhaustiveWeightedReward(request, rewards, 9)).toEqual({ score: 20, pointCost: 9 });
    expect(result).toMatchObject({ status: "success", pointCost: 9, searchType: "anytime", weighted: { score: 20, baselinePointCost: 1, maxPointCost: 9 } });
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(["goal", "t1", "t2", "t3", ...Object.keys(rewards).filter((id) => id.startsWith("cluster"))]));
    expect(result.addedNodeIds.filter((id) => id.startsWith("bait"))).toEqual([]);
    expect(progress.find((candidate) => candidate.weighted?.stage === "preferences")?.weighted?.score).toBe(0);
    expect(progress.some((candidate) => candidate.weighted?.score === 12)).toBe(true);
    for (const candidate of [...progress, result]) {
      expect(independentlyValid(request, candidate)).toBe(true);
      expect(createBuildGoalsValidation(request).validateResult(candidate)).toEqual([]);
    }
    expect(result.routeCandidates?.some((candidate) => candidate.label === "shortest-baseline" && candidate.pointCost === 1)).toBe(true);
  });
  it("includes negative gateway effects instead of valuing only the reward leaves", () => {
    const { request, rewards } = weightedBundleFixture();
    request.graph.nodes.t1.stats = ["-30 to Strength"]; rewards.t1 = -6;
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(exhaustiveWeightedReward(request, rewards, 9)).toEqual({ score: 14, pointCost: 9 });
    expect(result).toMatchObject({ pointCost: 9, weighted: { score: 14 } });
  });
  it("counts fixed base effects zero times and shared travel/reward nodes only once", () => {
    const { request } = weightedBundleFixture();
    request.baseNodeIds = ["start", "goal", "goal"];
    request.baseEdgeKeys = ["goal::start"];
    request.graph.nodes.goal.stats = ["+500 to Strength"];
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(result).toMatchObject({ status: "success", pointCost: 8, weighted: { score: 20, baselinePointCost: 0, maxPointCost: 8 } });
    expect(result.addedNodeIds).not.toContain("goal");
    expect(result.totalEdgeKeys).toContain("goal::start");
    expect(result.addedEdgeKeys).not.toContain("goal::start");
  });
  it("preserves several mandatory goals while valuing the connected reward bundle", () => {
    const { request } = weightedBundleFixture();
    request.goalNodeIds.push("bait0"); request.extraPointBudget = 8;
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(result.status).toBe("success");
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(["goal", "bait0"]));
    expect(result.pointCost).toBeLessThanOrEqual(result.weighted!.maxPointCost);
    expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
  });
  it.each(["extra", "all-available"] as const)("respects a tight %s budget", (pointBudgetMode) => {
    const { request, rewards } = weightedBundleFixture();
    request.extraPointBudget = 7; request.pointBudgetMode = pointBudgetMode; request.totalPointLimit = 8;
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(exhaustiveWeightedReward(request, rewards, 8)).toEqual({ score: 16, pointCost: 8 });
    expect(result).toMatchObject({ status: "success", pointCost: 8, weighted: { score: 16, maxPointCost: 8 } });
    expect(result.routeCandidates?.every((candidate) => candidate.pointCost <= 8)).toBe(true);
  });
  it("does not use excluded, locked or unrequested keystone gateways", () => {
    for (const kind of ["excluded", "locked", "keystone"] as const) {
      const { request } = weightedBundleFixture();
      if (kind === "excluded") request.excludedNodeIds = ["t1"];
      if (kind === "locked") request.graph.nodes.t1.visibility = { requiredAscendancy: { id: "oracle", name: "Oracle", className: "Druid" } };
      if (kind === "keystone") request.graph.nodes.t1.flags.keystone = true;
      const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
      expect(result).toMatchObject({ status: "success", weighted: { score: 12 } });
      expect(result.totalNodeIds).not.toContain("t1");
    }
  });
  it("honors cancellation during bundle progress, retaining a valid incumbent", () => {
    const { request } = weightedBundleFixture(); let cancel = false;
    const result = optimizeWeightedBuildGoals(request, (candidate) => { if ((candidate.weighted?.score ?? 0) > 12) cancel = true; },
      { maxIterations: 16, shouldCancel: () => cancel });
    expect(result).toMatchObject({ status: "cancelled", completeReason: "cancelled" });
    expect(result.weighted!.score).toBeGreaterThan(12);
    expect(createBuildGoalsValidation(request).validateResult({ ...result, status: "success" })).toEqual([]);
  });
  it("checks the inactivity deadline during bundle search and keeps the fast fallback at zero iterations", () => {
    const { request } = weightedBundleFixture(); let clock = 0;
    const result = optimizeWeightedBuildGoals(request, (candidate) => {
      if ((candidate.weighted?.score ?? 0) > 12) clock = 100;
    }, { now: () => clock, noImprovementMs: 50 });
    expect(result).toMatchObject({ status: "success", completeReason: "no-improvement" });
    expect(result.weighted!.score).toBeGreaterThan(12);
    expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
    const fallback = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 0 });
    expect(fallback).toMatchObject({ pointCost: 9, weighted: { score: 12 }, completeReason: "iteration-limit" });
  });
  it("does not change shortest mode and is deterministic at a fixed seed", () => {
    const { request } = weightedBundleFixture();
    const shortest = { ...request, mode: "shortest" as const };
    expect(optimizeBuildGoals(shortest).pointCost).toBe(1);
    expect(optimizeBuildGoalsAnytime(shortest).pointCost).toBe(1);
    const options = { maxIterations: 16, randomSeedStart: 42 };
    expect(optimizeWeightedBuildGoals(request, undefined, options)).toEqual(optimizeWeightedBuildGoals(request, undefined, options));
  });
  it("keeps or improves the old score on 30 seeded tiny signed-reward graphs", () => {
    let seed = 23;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let trial = 0; trial < 30; trial += 1) {
      const ids = ["start", "goal", "a", "b", "c", "d", "e", "f"];
      const pairs: [string, string][] = [["start", "goal"]];
      for (let i = 2; i < ids.length; i += 1) pairs.push([ids[Math.floor(random() * i)], ids[i]]);
      for (let i = 0; i < 4; i += 1) {
        const a = Math.floor(random() * ids.length), b = Math.floor(random() * ids.length);
        if (a !== b) pairs.push([ids[a], ids[b]]);
      }
      const graph = validationGraph(pairs), rewards: Record<string, number> = {};
      for (const id of ids.slice(2)) { const value = Math.floor(random() * 9) - 3; rewards[id] = value; graph.nodes[id].stats = [`${value >= 0 ? "+" : ""}${value * 5} to Strength`]; }
      const request = { graph, mode: "weighted" as const, rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"],
        extraPointBudget: 4, preferences: [{ id: "attributes" as const, weight: 1 }] };
      const options = { maxIterations: 16, randomSeedStart: trial + 1 };
      const before = optimizeWeightedBuildGoals(request, undefined, { ...options, enableBundleLookahead: false, enableBranchExchanges: false });
      const after = optimizeWeightedBuildGoals(request, undefined, { ...options, enableBranchExchanges: false });
      expect(after.status, `trial ${trial}`).toBe("success");
      expect(after.weighted!.score, `trial ${trial}`).toBeGreaterThanOrEqual(before.weighted!.score - 1e-9);
      expect(after.weighted!.score).toBeLessThanOrEqual(exhaustiveWeightedReward(request, rewards, 5).score + 1e-9);
      expect(after.weighted!.score).toBe(after.addedNodeIds.reduce((sum, id) => sum + (rewards[id] ?? 0), 0));
      expect(independentlyValid(request, after)).toBe(true);
      expect(createBuildGoalsValidation(request).validateResult(after)).toEqual([]);
    }
  });
});

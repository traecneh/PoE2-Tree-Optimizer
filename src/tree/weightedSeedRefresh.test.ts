import { describe, expect, it } from "vitest";
import { optimizeWeightedBuildGoals, type WeightedSeedRefreshEvent } from "./weightedBuildGoalsOptimizer";
import { lateWeightedImprovementFixture } from "./weightedSeedRefresh.fixtures";
import { exhaustiveTreeReward } from "./weightedBranchExchange.fixtures";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { independentlyValid } from "./buildGoalsValidation.fixtures";
import type { BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";

describe("weighted deep-search seed refresh", () => {
  it.each(["extra", "all-available"] as const)("reopens deep work for a late 84-to-86 improvement within 11 points (%s)", (pointBudgetMode) => {
    const { request, rewards } = lateWeightedImprovementFixture(); request.pointBudgetMode = pointBudgetMode;
    const options = { maxIterations: 64, randomSeedStart: 1701, enablePairedBranchExchanges: false };
    const beforeWarmup = optimizeWeightedBuildGoals(request, undefined, { ...options, maxIterations: 16 });
    expect(beforeWarmup).toMatchObject({ weighted: { score: 84 }, pointCost: 11 });
    const progress: BuildGoalsOptimizeResult[] = [], refreshes: WeightedSeedRefreshEvent[] = [];
    const result = optimizeWeightedBuildGoals(request, (r) => progress.push(r), { ...options, onSeedRefresh: (e) => refreshes.push(e) });
    expect(exhaustiveTreeReward(request, rewards, 11)).toEqual({ score: 86, pointCost: 11 });
    expect(result).toMatchObject({ weighted: { score: 86 }, pointCost: 11 });
    expect(refreshes).toEqual([{ round: 2, phase: "exchange", iteration: 32, revision: 3, score: 86, pointCost: 11, bundleSeeds: 0, exchangeSeeds: 1 }]);
    for (const row of [...progress, result]) {
      expect(independentlyValid(request, row)).toBe(true);
      expect(createBuildGoalsValidation(request).validateResult(row)).toEqual([]);
    }
    const scores = progress.filter((r) => r.weighted?.stage === "preferences").map((r) => r.weighted!.score);
    expect(scores).toEqual([0, 84, 86]);
    // Refresh verifies a new incumbent here; the old fast lane also reaches 86.
    expect(optimizeWeightedBuildGoals(request, undefined, { ...options, enableSeedRefresh: false }).weighted!.score).toBe(86);
  });
  it("does not repeatedly requeue an unchanged incumbent or reset inactivity on refresh", () => {
    const { request } = lateWeightedImprovementFixture();
    const collect = (maxIterations: number) => {
      const events: WeightedSeedRefreshEvent[] = [];
      optimizeWeightedBuildGoals(request, undefined, { maxIterations, enablePairedBranchExchanges: false, onSeedRefresh: (e) => events.push(e) });
      return events;
    };
    expect(collect(256)).toEqual(collect(64));
    let clock = 0;
    const result = optimizeWeightedBuildGoals(request, undefined, {
      maxIterations: 256, enablePairedBranchExchanges: false, now: () => clock, noImprovementMs: 50,
      onSeedRefresh: () => { clock = 100; },
    });
    expect(result).toMatchObject({ status: "success", completeReason: "no-improvement", weighted: { score: 86 } });
  });
  it("cancels at a refresh without losing or invalidating the best route", () => {
    const { request } = lateWeightedImprovementFixture(); let cancel = false;
    const result = optimizeWeightedBuildGoals(request, undefined, {
      maxIterations: 256, enablePairedBranchExchanges: false, onSeedRefresh: () => { cancel = true; }, shouldCancel: () => cancel,
    });
    expect(result).toMatchObject({ status: "cancelled", completeReason: "cancelled", weighted: { score: 86 } });
    expect(createBuildGoalsValidation(request).validateResult({ ...result, status: "success" })).toEqual([]);
  });
  it("does not dispatch refresh work after cancellation from a late improvement", () => {
    const { request } = lateWeightedImprovementFixture(); let cancel = false;
    const refreshes: WeightedSeedRefreshEvent[] = [];
    const result = optimizeWeightedBuildGoals(request, (r) => { if (r.weighted?.score === 86) cancel = true; }, {
      maxIterations: 256, enablePairedBranchExchanges: false, shouldCancel: () => cancel, onSeedRefresh: (e) => refreshes.push(e),
    });
    expect(result.status).toBe("cancelled"); expect(refreshes).toEqual([]);
  });
  it("keeps fixed base edges and reserved weapon branches through refreshed work", () => {
    const { request } = lateWeightedImprovementFixture();
    request.baseNodeIds.push("goal"); request.baseEdgeKeys.push("goal::start");
    request.graph.nodes.w1 = { ...request.graph.nodes.n24, id: "w1", stats: ["+5000 to Strength"] };
    request.graph.edges.push({ from: "goal", to: "w1" });
    request.weaponSets = { allocations: { 1: ["w1"], 2: [] }, attachmentNodeIds: ["goal"] };
    const original = JSON.stringify(request), refreshes: WeightedSeedRefreshEvent[] = [], rows: BuildGoalsOptimizeResult[] = [];
    const result = optimizeWeightedBuildGoals(request, (r) => rows.push(r), { maxIterations: 128, randomSeedStart: 3, enablePairedBranchExchanges: false, onSeedRefresh: (e) => refreshes.push(e) });
    expect(refreshes.length).toBeGreaterThan(0);
    for (const r of [...rows, result]) {
      expect(r.totalEdgeKeys).toContain("goal::start"); expect(r.totalNodeIds).not.toContain("w1");
      expect(r.pointCost).toBeLessThanOrEqual(10);
      expect(createBuildGoalsValidation(request).validateResult(r)).toEqual([]);
    }
    expect(JSON.stringify(request)).toBe(original);
  });
  it("leaves the pre-refresh control and disabled strategies available", () => {
    const { request } = lateWeightedImprovementFixture(), events: WeightedSeedRefreshEvent[] = [];
    const options = { maxIterations: 64, enablePairedBranchExchanges: false, onSeedRefresh: (e: WeightedSeedRefreshEvent) => events.push(e) };
    optimizeWeightedBuildGoals(request, undefined, { ...options, enableSeedRefresh: false });
    optimizeWeightedBuildGoals(request, undefined, { ...options, searchSchedule: "legacy" });
    optimizeWeightedBuildGoals(request, undefined, { ...options, enableBundleLookahead: false, enableBranchExchanges: false });
    expect(events).toEqual([]);
  });
});

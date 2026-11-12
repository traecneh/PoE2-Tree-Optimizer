import { describe, expect, it } from "vitest";
import { optimizeBuildGoals, optimizeBuildGoalsAnytime, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { independentlyValid, validationGraph, validationRequest } from "./buildGoalsValidation.fixtures";
import { sharedJunctionFixture, connectedBranchFixture, exhaustiveRequiredCost } from "./buildGoalsLocalSearch.fixtures";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";

describe("bounded shared-junction and connected-branch search", () => {
  it("improves the demonstrated 11-goal trap from 17 to the proven 16 points", () => {
    const request = sharedJunctionFixture();
    const old = optimizeBuildGoalsAnytime(request, undefined, { maxIterations: 128, enableLocalSearch: false });
    expect(old.pointCost).toBe(17);
    const progress: BuildGoalsOptimizeResult[] = [];
    const result = optimizeBuildGoalsAnytime(request, (p) => progress.push(p), { maxIterations: 128 });
    expect(exhaustiveRequiredCost(request)).toBe(16);
    expect(result).toMatchObject({ status: "success", searchType: "anytime", pointCost: 16 });
    expect(progress.map((p) => p.pointCost)).toEqual([17, 16]);
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(["trunk", "hub", ...request.goalNodeIds]));
    for (const candidate of [...progress, result]) {
      expect(independentlyValid(request, candidate)).toBe(true);
      expect(createBuildGoalsValidation(request).validateResult(candidate)).toEqual([]);
    }
  });
  it("reconnects a removable travel chain to the retained branch", () => {
    const request = connectedBranchFixture();
    const old = optimizeBuildGoalsAnytime(request, undefined, { maxIterations: 0, enableLocalSearch: false });
    expect(old.pointCost).toBe(18);
    const result = optimizeBuildGoalsAnytime(request, undefined, { maxIterations: 1 });
    expect(result.pointCost).toBe(17);
    expect(exhaustiveRequiredCost(request)).toBe(17);
    expect(result.routeCandidates?.some((candidate) => candidate.label === "connected-branch replacement" && candidate.pointCost === 17)).toBe(true);
    expect(result.addedNodeIds).toContain("cross");
    expect(independentlyValid(request, result)).toBe(true);
  });
  it("never respecs the fixed base, including pending travel nodes and base edges", () => {
    const request = connectedBranchFixture();
    request.baseNodeIds = ["start", "b1", "b2"];
    request.baseEdgeKeys = ["b1::start", "b1::b2"];
    const result = optimizeBuildGoalsAnytime(request, undefined, { maxIterations: 32 });
    expect(result.status).toBe("success");
    expect(result.totalNodeIds).toEqual(expect.arrayContaining(request.baseNodeIds));
    expect(result.totalEdgeKeys).toEqual(expect.arrayContaining(request.baseEdgeKeys));
    expect(result.addedNodeIds).not.toContain("b1");
    expect(result.addedNodeIds).not.toContain("b2");
    expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
  });
  it("does not use an excluded or ascendancy-locked junction", () => {
    const request = sharedJunctionFixture();
    const excluded = { ...request, excludedNodeIds: ["hub"] };
    const result = optimizeBuildGoalsAnytime(excluded, undefined, { maxIterations: 32 });
    expect(result.pointCost).toBe(17); expect(result.totalNodeIds).not.toContain("hub");
    request.graph.nodes.hub.visibility = { requiredAscendancy: { id: "oracle", name: "Oracle", className: "Druid" } };
    const locked = optimizeBuildGoalsAnytime(request, undefined, { maxIterations: 32 });
    expect(locked.pointCost).toBe(17); expect(locked.totalNodeIds).not.toContain("hub");
  });
  it("keeps the exact solver path unchanged regardless of the new option", () => {
    const request = sharedJunctionFixture(); request.goalNodeIds = ["g0", "g1", "g2"];
    const exact = optimizeBuildGoalsAnytime(request, undefined, { enableLocalSearch: false });
    expect(exact).toMatchObject({ pointCost: 8, searchType: "exact", completeReason: "exact" });
    expect(optimizeBuildGoalsAnytime(request, undefined, { enableLocalSearch: true })).toEqual(exact);
    expect(optimizeBuildGoals(request).totalNodeIds).toEqual(exact.totalNodeIds);
  });
  it("can bring a large weighted baseline within its available budget without changing scoring", () => {
    const request = { ...sharedJunctionFixture(), mode: "weighted" as const, pointBudgetMode: "all-available" as const,
      totalPointLimit: 16, preferences: [{ id: "attributes" as const, weight: 1 }] };
    expect(optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8, enableLocalSearch: false }).status).toBe("error");
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    expect(result).toMatchObject({ status: "success", pointCost: 16, weighted: { baselinePointCost: 16, maxPointCost: 16, score: 0, baselineExact: false } });
    expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
  });
  it("is deterministic for the same request and seed", () => {
    const request = sharedJunctionFixture(), options = { maxIterations: 12, randomSeedStart: 41 };
    expect(optimizeBuildGoalsAnytime(request, undefined, options)).toEqual(optimizeBuildGoalsAnytime(request, undefined, options));
  });
  it("honors cancellation and the configured iteration budget without claiming exactness", () => {
    const request = sharedJunctionFixture();
    let cancelled = false;
    const result = optimizeBuildGoalsAnytime(request, () => { cancelled = true; }, { shouldCancel: () => cancelled });
    expect(result).toMatchObject({ status: "cancelled", completeReason: "cancelled", pointCost: 17 });
    const initial = optimizeBuildGoalsAnytime(request, undefined, { maxIterations: 0 });
    expect(initial).toMatchObject({ pointCost: 17, completeReason: "iteration-limit", searchType: "anytime" });
  });
  it("retains or improves legacy costs and remains valid on 30 independent padded graphs", () => {
    let seed = 20261108;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let trial = 0; trial < 30; trial += 1) {
      const ids = ["start", "a", "b", "c", "d", "e", "f", "g"];
      const pairs: [string, string][] = ids.slice(1).map((id, i) => [ids[i], id]);
      for (let i = 0; i < 9; i += 1) {
        const a = Math.floor(random() * ids.length), b = Math.floor(random() * ids.length);
        if (a !== b) pairs.push([ids[a], ids[b]]);
      }
      const goals = ["c", "f", "g"];
      for (let i = 0; i < 8; i += 1) { const id = `padding${i}`; goals.push(id); pairs.push(["start", id]); }
      const request = { ...validationRequest(validationGraph(pairs)), goalNodeIds: goals };
      const options = { maxIterations: 12, randomSeedStart: trial + 1 };
      const old = optimizeBuildGoalsAnytime(request, undefined, { ...options, enableLocalSearch: false });
      const result = optimizeBuildGoalsAnytime(request, undefined, options);
      expect(result.status, `trial ${trial}`).toBe("success");
      expect(result.pointCost, `trial ${trial}`).toBeLessThanOrEqual(old.pointCost);
      expect(result.pointCost, `trial ${trial}`).toBeGreaterThanOrEqual(exhaustiveRequiredCost(request));
      expect(independentlyValid(request, result)).toBe(true);
      expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
    }
  });
});

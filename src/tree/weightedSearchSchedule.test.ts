import { describe, expect, it } from "vitest";
import { WeightedSearchSchedule, type WeightedRefinement } from "./weightedSearchSchedule";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import { weightedBundleFixture, exhaustiveWeightedReward } from "./weightedBundleSearch.fixtures";
import { createBuildGoalsValidation } from "./buildGoalsValidation";

describe("weighted refinement scheduling", () => {
  it("earns one unit of deep work for two units of fast work and carries excess cost forward", () => {
    let clock = 0, steps = 0;
    const schedule = new WeightedSearchSchedule(false, () => clock);
    function* job(): WeightedRefinement { while (true) { steps += 1; clock += 4; yield; } }
    schedule.enqueue(job());
    expect(schedule.advance(() => false)).toBe(0);
    schedule.recordFastTurn(16);
    expect(schedule.advance(() => false)).toBe(2);
    expect(steps).toBe(2);
    schedule.recordFastTurn(2);
    expect(schedule.advance(() => false)).toBe(1);
    schedule.recordFastTurn(4);
    expect(schedule.advance(() => false)).toBe(0);
    schedule.recordFastTurn(2);
    expect(schedule.advance(() => false)).toBe(0);
    schedule.recordFastTurn(2);
    expect(schedule.advance(() => false)).toBe(1);
  });
  it("bounds each deep turn and rotates pending jobs instead of draining a whole search", () => {
    let clock = 0;
    const seen: string[] = [], schedule = new WeightedSearchSchedule(false, () => clock);
    function* job(id: string): WeightedRefinement { while (true) { seen.push(id); clock += 5; yield; } }
    schedule.enqueue(job("bundle")); schedule.enqueue(job("exchange"));
    schedule.recordFastTurn(1000);
    expect(schedule.advance(() => false)).toBe(4);
    expect(seen).toEqual(["bundle", "exchange", "bundle", "exchange"]);
    expect(clock).toBe(20);
  });
  it("checks cancellation between work units and resumes without restarting the job", () => {
    const schedule = new WeightedSearchSchedule(true);
    let steps = 0;
    function* job(): WeightedRefinement { while (steps < 4) { steps += 1; yield; } }
    schedule.enqueue(job()); schedule.recordFastTurn(0);
    expect(schedule.advance(() => steps === 2)).toBe(2);
    expect(steps).toBe(2);
    schedule.advance(() => false);
    expect(steps).toBe(4);
  });
  it("uses deterministic work quanta for fixed-iteration tests regardless of host speed", () => {
    const run = (stepCost: number) => {
      let clock = 0, steps = 0;
      const schedule = new WeightedSearchSchedule(true, () => clock);
      function* job(): WeightedRefinement { while (true) { steps += 1; clock += stepCost; yield; } }
      schedule.enqueue(job()); schedule.recordFastTurn(stepCost);
      schedule.advance(() => false);
      return steps;
    };
    expect(run(0)).toBe(16); expect(run(100)).toBe(16);
  });
  it("bounds work even with a clock that does not advance and removes completed jobs", () => {
    const schedule = new WeightedSearchSchedule(false, () => 0);
    let completed = 0, steps = 0;
    function* empty(): WeightedRefinement { completed += 1; }
    function* endless(): WeightedRefinement { while (true) { steps += 1; yield; } }
    schedule.enqueue(empty()); schedule.enqueue(endless()); schedule.recordFastTurn(1000);
    expect(schedule.advance(() => false)).toBe(64);
    expect(completed).toBe(1); expect(steps).toBe(63);
  });
  it("interleaves fast restarts with bundle work while preserving monotonic valid incumbents", () => {
    const { request, rewards } = weightedBundleFixture();
    const steps: string[] = [], scores: number[] = [];
    const result = optimizeWeightedBuildGoals(request, (candidate) => {
      expect(createBuildGoalsValidation(request).validateResult(candidate)).toEqual([]);
      if (candidate.weighted?.stage === "preferences") scores.push(candidate.weighted.score);
    }, { maxIterations: 16, onSearchStep: (kind) => steps.push(kind) });
    const firstDeep = steps.indexOf("bundle"), secondFast = steps.indexOf("greedy", firstDeep);
    expect(firstDeep).toBeGreaterThan(0);
    expect(steps.indexOf("bundle", secondFast)).toBeGreaterThan(secondFast);
    expect(steps.filter((kind) => kind === "greedy")).toHaveLength(16);
    expect(steps.lastIndexOf("bundle")).toBeLessThan(steps.indexOf("exchange"));
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    expect(result.weighted!.score).toBe(exhaustiveWeightedReward(request, rewards, 9).score);
    expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
  });
  it("keeps the same fast random stream when refinements are disabled", () => {
    const { request } = weightedBundleFixture();
    for (const randomSeedStart of [42, 1701]) {
      const options = { maxIterations: 32, randomSeedStart, enableBundleLookahead: false, enableBranchExchanges: false };
      expect(optimizeWeightedBuildGoals(request, undefined, options)).toEqual(
        optimizeWeightedBuildGoals(request, undefined, { ...options, searchSchedule: "legacy" }));
    }
  });
});

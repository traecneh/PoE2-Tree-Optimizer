import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import type { AllocationPlan } from "./allocationPlan";
import type { BuildGoalsOptimizeRequest, BuildGoalsOptimizeResult } from "../tree/buildGoalsOptimizer";
import type { BuildGoalsOptimizationCallbacks, BuildGoalsOptimizationRun } from "../tree/buildGoalsOptimizerClient";
import type { TreeGraph } from "../tree/types";
import { useBuildGoalsState } from "./useBuildGoalsState";

describe("useBuildGoalsState", () => {
  it("adds, merges, toggles, removes, and clears build goal ids", () => {
    const { result } = renderHook(() => useBuildGoalsState({
      visibleGraph: fixtureGraph(),
      allocationPlan: fixtureAllocationPlan(),
      setAllocationPlan: () => undefined,
    }));

    act(() => {
      result.current.addBuildGoal("goal-a");
      result.current.addBuildGoal("goal-a");
      result.current.addBuildGoals(["goal-b", "goal-c", "goal-b"]);
    });

    expect(result.current.buildGoalNodeIds).toEqual(["goal-a", "goal-b", "goal-c"]);
    expect(result.current.buildGoalNodeIdSet.has("goal-b")).toBe(true);

    act(() => {
      result.current.toggleBuildGoal("goal-b");
    });
    expect(result.current.buildGoalNodeIds).toEqual(["goal-a", "goal-c"]);

    act(() => {
      result.current.toggleBuildGoal("goal-b");
    });
    expect(result.current.buildGoalNodeIds).toEqual(["goal-a", "goal-c", "goal-b"]);

    act(() => {
      result.current.removeBuildGoal("goal-a");
    });
    expect(result.current.buildGoalNodeIds).toEqual(["goal-c", "goal-b"]);

    act(() => {
      result.current.clearBuildGoals();
    });
    expect(result.current.buildGoalNodeIds).toEqual([]);
  });

  it("runs optimization, previews route candidates, reports route details, and applies the selected route", async () => {
    let progressCallback: ((result: BuildGoalsOptimizeResult) => void) | undefined;
    let resolveRun: ((result: BuildGoalsOptimizeResult) => void) | undefined;
    const cancel = vi.fn();
    const runOptimization = vi.fn((
      request: BuildGoalsOptimizeRequest,
      callbacks: BuildGoalsOptimizationCallbacks = {},
    ): BuildGoalsOptimizationRun => {
      progressCallback = callbacks.onProgress;
      return {
        promise: new Promise((resolve) => {
          resolveRun = resolve;
        }),
        cancel,
      };
    });

    const { result } = renderHook(() => {
      const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>(fixtureAllocationPlan());
      return {
        allocationPlan,
        buildGoals: useBuildGoalsState({
          visibleGraph: fixtureGraph(),
          allocationPlan,
          setAllocationPlan,
          runOptimization,
        }),
      };
    });

    act(() => {
      result.current.buildGoals.addBuildGoals(["goal-a", "goal-b"]);
    });
    act(() => {
      result.current.buildGoals.optimizeBuildGoalsRoute();
    });

    expect(runOptimization).toHaveBeenCalledWith({
      graph: fixtureGraph(),
      baseNodeIds: ["start"],
      baseEdgeKeys: [],
      goalNodeIds: ["goal-a", "goal-b"],
      mode: "shortest",
    }, { onProgress: expect.any(Function) });
    expect(result.current.buildGoals.buildGoalStatus).toEqual({ kind: "running" });

    act(() => {
      progressCallback?.(successResult("progress-route", 3));
    });

    expect(result.current.buildGoals.buildGoalStatus).toMatchObject({
      kind: "running",
      pointCost: 3,
    });
    expect(result.current.allocationPlan.previewNodePath).toEqual(["start", "mid", "goal-a"]);
    expect(result.current.allocationPlan.previewHighlightNodeIds).toEqual(["mid", "goal-a"]);

    await act(async () => {
      resolveRun?.(successResult("complete-route", 4, [
        routeCandidate("first", 4, ["start", "mid", "goal-a", "goal-b"]),
        routeCandidate("same-cost", 4, ["start", "same-cost", "goal-a", "goal-b"]),
        routeCandidate("second", 5, ["start", "alt", "goal-b", "goal-a"]),
      ]));
    });

    expect(result.current.buildGoals.buildGoalStatus).toMatchObject({
      kind: "success",
      pointCost: 4,
    });
    expect(result.current.buildGoals.routeCandidateCount).toBe(3);
    expect(result.current.buildGoals.routeCandidateSummaries).toEqual([
      { index: 0, pointCost: 4, pointCostRouteNumber: 1, pointCostRouteCount: 2 },
      { index: 1, pointCost: 4, pointCostRouteNumber: 2, pointCostRouteCount: 2 },
      { index: 2, pointCost: 5, pointCostRouteNumber: 1, pointCostRouteCount: 1 },
    ]);
    expect(result.current.buildGoals.selectedRouteCandidate).toEqual({
      index: 0,
      pointCost: 4,
      pointCostRouteNumber: 1,
      pointCostRouteCount: 2,
    });
    expect(result.current.buildGoals.selectedRouteDetails).toMatchObject({
      pointCost: 4,
      pointDeltaFromBest: 0,
      addedNodeCount: 3,
      selectedOnlyNodeNames: [],
      bestOnlyNodeNames: [],
      selectedOnlyEdgeCount: 0,
      bestOnlyEdgeCount: 0,
    });
    expect(result.current.allocationPlan.previewNodePath).toEqual(["start", "mid", "goal-a", "goal-b"]);

    act(() => {
      result.current.buildGoals.selectOptimizedRoute(1);
    });

    expect(result.current.buildGoals.optimizedRouteIndex).toBe(1);
    expect(result.current.buildGoals.selectedRouteCandidate).toEqual({
      index: 1,
      pointCost: 4,
      pointCostRouteNumber: 2,
      pointCostRouteCount: 2,
    });
    expect(result.current.buildGoals.selectedRouteDetails).toMatchObject({
      pointCost: 4,
      pointDeltaFromBest: 0,
      addedNodeCount: 3,
      selectedOnlyNodeNames: ["Same Cost"],
      bestOnlyNodeNames: ["Mid"],
      selectedOnlyEdgeCount: 2,
      bestOnlyEdgeCount: 2,
    });
    expect(result.current.allocationPlan.previewNodePath).toEqual(["start", "same-cost", "goal-a", "goal-b"]);

    act(() => {
      result.current.buildGoals.selectOptimizedRoute(2);
    });

    expect(result.current.buildGoals.selectedRouteCandidate).toEqual({
      index: 2,
      pointCost: 5,
      pointCostRouteNumber: 1,
      pointCostRouteCount: 1,
    });
    expect(result.current.buildGoals.selectedRouteDetails).toMatchObject({
      pointCost: 5,
      pointDeltaFromBest: 1,
      addedNodeCount: 3,
      selectedOnlyNodeNames: ["Alt"],
      bestOnlyNodeNames: ["Mid"],
      selectedOnlyEdgeCount: 2,
      bestOnlyEdgeCount: 2,
    });
    expect(result.current.allocationPlan.previewNodePath).toEqual(["start", "alt", "goal-b", "goal-a"]);

    act(() => {
      result.current.buildGoals.applyOptimizedRoute();
    });

    expect(result.current.allocationPlan.committedNodePath).toEqual(["start", "alt", "goal-b", "goal-a"]);
    expect(result.current.allocationPlan.previewNodePath).toEqual([]);
    expect(result.current.buildGoals.buildGoalStatus).toEqual({ kind: "already-reached" });
    expect(result.current.buildGoals.appliedOptimizedRouteChoice).toEqual({
      routeIndex: 2,
      routeNumber: 3,
      routeCount: 3,
      pointCost: 5,
      pointDeltaFromBest: 1,
      pointCostRouteNumber: 1,
      pointCostRouteCount: 1,
    });
    expect(cancel).toHaveBeenCalledTimes(0);
  });

  it("cancels running optimization and ignores stale completion", async () => {
    let resolveRun: ((result: BuildGoalsOptimizeResult) => void) | undefined;
    const cancel = vi.fn();
    const runOptimization = vi.fn((
      _request: BuildGoalsOptimizeRequest,
      _callbacks: BuildGoalsOptimizationCallbacks = {},
    ): BuildGoalsOptimizationRun => ({
      promise: new Promise((resolve) => {
        resolveRun = resolve;
      }),
      cancel,
    }));
    const { result } = renderHook(() => {
      const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>(fixtureAllocationPlan());
      return useBuildGoalsState({
        visibleGraph: fixtureGraph(),
        allocationPlan,
        setAllocationPlan,
        runOptimization,
      });
    });

    act(() => {
      result.current.addBuildGoal("goal-a");
    });
    act(() => {
      result.current.optimizeBuildGoalsRoute();
    });
    act(() => {
      result.current.cancelBuildGoalsOptimization();
    });

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(result.current.buildGoalStatus).toEqual({ kind: "cancelled" });

    await act(async () => {
      resolveRun?.(successResult("late-route", 2));
    });

    expect(result.current.buildGoalStatus).toEqual({ kind: "cancelled" });
  });
});

function fixtureAllocationPlan(): AllocationPlan {
  return {
    committedNodePath: ["start"],
    committedEdgeKeys: [],
    previewNodePath: [],
    previewEdgeKeys: [],
    previewRouteNodePath: [],
  };
}

function fixtureGraph(): TreeGraph {
  return {
    schemaVersion: 1,
    gameVersion: "build-goals-fixture",
    extractedAt: "2026-06-01T00:00:00.000Z",
    source: { kind: "fixture", path: "src/app/useBuildGoalsState.test.ts" },
    nodes: {
      start: fixtureNode("start", "Start"),
      mid: fixtureNode("mid", "Mid", ["+5 to Intelligence"]),
      alt: fixtureNode("alt", "Alt", ["+5 to Strength"]),
      "same-cost": fixtureNode("same-cost", "Same Cost", ["+5 to Dexterity"]),
      "goal-a": fixtureNode("goal-a", "Goal A", ["10% increased Damage"]),
      "goal-b": fixtureNode("goal-b", "Goal B", ["5% increased Cast Speed"]),
      "goal-c": fixtureNode("goal-c", "Goal C"),
    },
    groups: {},
    edges: [
      { from: "start", to: "mid" },
      { from: "mid", to: "goal-a" },
      { from: "goal-a", to: "goal-b" },
      { from: "start", to: "alt" },
      { from: "alt", to: "goal-b" },
      { from: "goal-b", to: "goal-a" },
      { from: "start", to: "same-cost" },
      { from: "same-cost", to: "goal-a" },
    ],
    classStarts: { WITCH: "start" },
    bounds: { minX: 0, maxX: 400, minY: 0, maxY: 100 },
  };
}

function fixtureNode(id: string, name: string, stats: string[] = []) {
  return {
    id,
    name,
    stats,
    position: { x: 0, y: 0 },
    flags: id === "start" ? { classStart: true } : { small: true },
  };
}

function successResult(
  label: string,
  pointCost: number,
  routeCandidates = [routeCandidate(label, pointCost, ["start", "mid", "goal-a"])],
): BuildGoalsOptimizeResult {
  const route = routeCandidates[0];
  return {
    status: "success",
    addedNodeIds: route.addedNodeIds,
    addedEdgeKeys: route.addedEdgeKeys,
    totalNodeIds: route.totalNodeIds,
    totalEdgeKeys: route.totalEdgeKeys,
    orderedNodeIds: route.orderedNodeIds,
    pointCost,
    unreachableGoalNodeIds: [],
    routeCandidates,
    improvementHistory: [pointCost],
    searchType: "anytime",
    completeReason: "no-improvement",
  };
}

function routeCandidate(label: string, pointCost: number, nodeIds: string[]) {
  const edgeKeys = nodeIds.slice(1).map((nodeId, index) => edgeKey(nodeIds[index], nodeId));
  return {
    label,
    addedNodeIds: nodeIds.slice(1),
    addedEdgeKeys: edgeKeys,
    totalNodeIds: nodeIds,
    totalEdgeKeys: edgeKeys,
    orderedNodeIds: nodeIds,
    pointCost,
  };
}

function edgeKey(left: string, right: string): string {
  return [left, right].sort().join("::");
}

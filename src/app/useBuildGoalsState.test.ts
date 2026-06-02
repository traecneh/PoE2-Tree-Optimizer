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

  it("runs optimization, previews route candidates, and applies the selected route", async () => {
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
        routeCandidate("second", 5, ["start", "alt", "goal-b", "goal-a"]),
      ]));
    });

    expect(result.current.buildGoals.buildGoalStatus).toMatchObject({
      kind: "success",
      pointCost: 4,
    });
    expect(result.current.buildGoals.routeCandidateCount).toBe(2);
    expect(result.current.allocationPlan.previewNodePath).toEqual(["start", "mid", "goal-a", "goal-b"]);

    act(() => {
      result.current.buildGoals.selectOptimizedRoute(1);
    });

    expect(result.current.buildGoals.optimizedRouteIndex).toBe(1);
    expect(result.current.allocationPlan.previewNodePath).toEqual(["start", "alt", "goal-b", "goal-a"]);

    act(() => {
      result.current.buildGoals.applyOptimizedRoute();
    });

    expect(result.current.allocationPlan.committedNodePath).toEqual(["start", "alt", "goal-b", "goal-a"]);
    expect(result.current.allocationPlan.previewNodePath).toEqual([]);
    expect(result.current.buildGoals.buildGoalStatus).toEqual({ kind: "already-reached" });
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
      mid: fixtureNode("mid", "Mid"),
      alt: fixtureNode("alt", "Alt"),
      "goal-a": fixtureNode("goal-a", "Goal A"),
      "goal-b": fixtureNode("goal-b", "Goal B"),
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
    ],
    classStarts: { WITCH: "start" },
    bounds: { minX: 0, maxX: 400, minY: 0, maxY: 100 },
  };
}

function fixtureNode(id: string, name: string) {
  return {
    id,
    name,
    stats: [],
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
  return {
    label,
    addedNodeIds: nodeIds.slice(1),
    addedEdgeKeys: nodeIds.slice(1).map((nodeId, index) => `${nodeIds[index]}::${nodeId}`),
    totalNodeIds: nodeIds,
    totalEdgeKeys: nodeIds.slice(1).map((nodeId, index) => `${nodeIds[index]}::${nodeId}`),
    orderedNodeIds: nodeIds,
    pointCost,
  };
}

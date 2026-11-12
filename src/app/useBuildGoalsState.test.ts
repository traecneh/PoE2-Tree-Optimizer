import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import type { AllocationPlan } from "./allocationPlan";
import type { BuildGoalsOptimizeRequest, BuildGoalsOptimizeResult } from "../tree/buildGoalsOptimizer";
import type { BuildGoalsOptimizationCallbacks, BuildGoalsOptimizationRun } from "../tree/buildGoalsOptimizerClient";
import type { TreeGraph } from "../tree/types";
import { useBuildGoalsState } from "./useBuildGoalsState";
import { optimizerTreeFingerprint } from "../tree/buildGoalsValidation";
import { optimizeBuildGoals } from "../tree/buildGoalsOptimizer";

describe("useBuildGoalsState", () => {
  it.each(["spell-totem","ancestral-warrior-totem","mirage-archer","cast-on-critical","blasphemy","feral-invocation"])("passes %s's selected source to workers and cancels stale work on change", focusSkillId => {
    const cancel = vi.fn();
    const runOptimization = vi.fn((_request: BuildGoalsOptimizeRequest): BuildGoalsOptimizationRun => ({
      promise: new Promise<BuildGoalsOptimizeResult>(() => undefined), cancel,
    }));
    const { result } = renderHook(() => useBuildGoalsState({
      visibleGraph: fixtureGraph(), allocationPlan: fixtureAllocationPlan(), setAllocationPlan: vi.fn(), runOptimization,
    }));
    const first = focusSkillId === "blasphemy" ? "enfeeble" : focusSkillId === "feral-invocation" ? "maul" : focusSkillId === "mirage-archer" ? "lightning-arrow" : ["spell-totem","cast-on-critical"].includes(focusSkillId) ? "fireball" : "armour-breaker";
    const next = focusSkillId === "blasphemy" ? "despair" : focusSkillId === "feral-invocation" ? "lunar-assault" : focusSkillId === "mirage-archer" ? "ice-shot" : ["spell-totem","cast-on-critical"].includes(focusSkillId) ? "contagion" : "sunder";
    act(() => result.current.updateOptimizerSettings({ mode: "weighted", focusSkillId, socketedProxySkillId: first,
      extraPointBudget: 1, preferences: [{ id: "totemDamage", weight: 3 }] }));
    act(() => result.current.addBuildGoal("goal-a"));
    act(() => result.current.optimizeBuildGoalsRoute());
    expect(runOptimization.mock.calls[0][0]).toMatchObject({ mode: "weighted", focusSkillId, socketedProxySkillId: first });
    act(() => result.current.updateOptimizerSettings({ ...result.current.optimizerSettings, socketedProxySkillId: next }));
    expect(cancel).toHaveBeenCalled();
    act(() => result.current.optimizeBuildGoalsRoute());
    expect(runOptimization.mock.calls[1][0].socketedProxySkillId).toBe(next);
    act(() => result.current.updateOptimizerSettings({ ...result.current.optimizerSettings, mode: "shortest" }));
    act(() => result.current.optimizeBuildGoalsRoute());
    expect(runOptimization.mock.calls[2][0]).not.toHaveProperty("socketedProxySkillId");
  });

  it("sends the socketed Grenade to weighted workers and clears stale candidates when it changes", () => {
    const cancel = vi.fn();
    const runOptimization = vi.fn((_request: BuildGoalsOptimizeRequest): BuildGoalsOptimizationRun => ({
      promise: new Promise<BuildGoalsOptimizeResult>(() => undefined), cancel,
    }));
    const { result } = renderHook(() => useBuildGoalsState({
      visibleGraph: fixtureGraph(), allocationPlan: fixtureAllocationPlan(), setAllocationPlan: vi.fn(), runOptimization,
    }));
    act(() => result.current.updateOptimizerSettings({ mode: "weighted", focusSkillId: "mortar-cannon", socketedGrenadeId: "explosive-grenade",
      extraPointBudget: 1, preferences: [{ id: "totemDamage", weight: 3 }] }));
    act(() => result.current.addBuildGoal("goal-a"));
    act(() => result.current.optimizeBuildGoalsRoute());
    expect(runOptimization.mock.calls[0][0]).toMatchObject({ mode: "weighted", focusSkillId: "mortar-cannon", socketedGrenadeId: "explosive-grenade" });
    act(() => result.current.updateOptimizerSettings({ ...result.current.optimizerSettings, socketedGrenadeId: "gas-grenade" }));
    expect(cancel).toHaveBeenCalled();
    act(() => result.current.optimizeBuildGoalsRoute());
    expect(runOptimization.mock.calls[1][0].socketedGrenadeId).toBe("gas-grenade");
    act(() => result.current.updateOptimizerSettings({ ...result.current.optimizerSettings, mode: "shortest" }));
    act(() => result.current.optimizeBuildGoalsRoute());
    expect(runOptimization.mock.calls[2][0]).not.toHaveProperty("socketedGrenadeId");
  });

  it("passes the reviewed focus to weighted workers, but leaves shortest request shape unchanged", () => {
    const runOptimization = vi.fn((_request: BuildGoalsOptimizeRequest): BuildGoalsOptimizationRun => ({
      promise: new Promise<BuildGoalsOptimizeResult>(() => undefined), cancel: vi.fn(),
    }));
    const { result } = renderHook(() => useBuildGoalsState({
      visibleGraph: fixtureGraph(), allocationPlan: fixtureAllocationPlan(), setAllocationPlan: vi.fn(), runOptimization,
    }));
    act(() => result.current.updateOptimizerSettings({ mode: "weighted", focusSkillId: "spark", supportGemIds: ["controlled-destruction"], extraPointBudget: 0,
      preferences: [{ id: "projectileSpeed", weight: 3 }] }));
    act(() => result.current.addBuildGoal("goal-a"));
    act(() => result.current.optimizeBuildGoalsRoute());
    expect(runOptimization.mock.calls[0][0]).toMatchObject({ mode: "weighted", focusSkillId: "spark", preferences: [{ id: "projectileSpeed", weight: 3 }] });
    expect(runOptimization.mock.calls[0][0].supportGemIds).toEqual(["controlled-destruction"]);
    act(() => result.current.updateOptimizerSettings({ ...result.current.optimizerSettings, mode: "shortest" }));
    act(() => result.current.optimizeBuildGoalsRoute());
    expect(runOptimization.mock.calls[1][0]).not.toHaveProperty("focusSkillId");
    expect(runOptimization.mock.calls[1][0]).not.toHaveProperty("preferences");
    expect(runOptimization.mock.calls[1][0]).not.toHaveProperty("supportGemIds");
  });
  it("passes the weapon-set-adjusted main limit for all-available weighted requests", () => {
    const runOptimization = vi.fn((_request: BuildGoalsOptimizeRequest): BuildGoalsOptimizationRun => ({
      promise: new Promise<BuildGoalsOptimizeResult>(() => undefined), cancel: vi.fn(),
    }));
    const { result } = renderHook(() => useBuildGoalsState({
      visibleGraph: fixtureGraph(), allocationPlan: fixtureAllocationPlan(), setAllocationPlan: vi.fn(),
      mainPointLimit: 99, runOptimization,
    }));
    act(() => result.current.updateOptimizerSettings({ mode: "weighted", pointBudgetMode: "all-available", extraPointBudget: 5, preferences: [{ id: "life", weight: 1 }] }));
    act(() => result.current.addBuildGoal("goal-a"));
    act(() => result.current.optimizeBuildGoalsRoute());
    expect(runOptimization.mock.calls[0][0]).toMatchObject({ mode: "weighted", pointBudgetMode: "all-available", totalPointLimit: 99 });
  });

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
      allocationPool: "main",
      totalPointLimit: 123,
      weaponSets: undefined,
      rootNodeId: "start",
      treeFingerprint: expect.any(String),
      visibility: { selectedAscendancyId: undefined, allocatedAscendancyNodeIds: undefined },
    }, { onProgress: expect.any(Function) });
    expect(result.current.buildGoals.buildGoalStatus).toEqual({ kind: "running" });

    act(() => {
      progressCallback?.(successResult("progress-route", 3, [routeCandidate("progress", 3, ["start", "mid", "goal-a", "goal-b"])]));
    });

    expect(result.current.buildGoals.buildGoalStatus).toMatchObject({
      kind: "running",
      pointCost: 3,
    });
    expect(result.current.allocationPlan.previewNodePath).toEqual(["start", "mid", "goal-a", "goal-b"]);
    expect(result.current.allocationPlan.previewHighlightNodeIds).toEqual(["mid", "goal-a", "goal-b"]);

    await act(async () => {
      resolveRun?.(successResult("complete-route", 3, [
        routeCandidate("first", 3, ["start", "mid", "goal-a", "goal-b"]),
        routeCandidate("same-cost", 3, ["start", "same-cost", "goal-a", "goal-b"]),
        routeCandidate("second", 5, ["start", "alt", "alt-mid", "alt-end", "goal-b", "goal-a"]),
      ]));
    });

    expect(result.current.buildGoals.buildGoalStatus).toMatchObject({
      kind: "success",
      pointCost: 3,
    });
    expect(result.current.buildGoals.routeCandidateCount).toBe(3);
    expect(result.current.buildGoals.routeCandidateSummaries).toEqual([
      { index: 0, pointCost: 3, pointCostRouteNumber: 1, pointCostRouteCount: 2 },
      { index: 1, pointCost: 3, pointCostRouteNumber: 2, pointCostRouteCount: 2 },
      { index: 2, pointCost: 5, pointCostRouteNumber: 1, pointCostRouteCount: 1 },
    ]);
    expect(result.current.buildGoals.selectedRouteCandidate).toEqual({
      index: 0,
      pointCost: 3,
      pointCostRouteNumber: 1,
      pointCostRouteCount: 2,
    });
    expect(result.current.buildGoals.selectedRouteDetails).toMatchObject({
      pointCost: 3,
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
      pointCost: 3,
      pointCostRouteNumber: 2,
      pointCostRouteCount: 2,
    });
    expect(result.current.buildGoals.selectedRouteDetails).toMatchObject({
      pointCost: 3,
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
      pointDeltaFromBest: 2,
      addedNodeCount: 5,
      selectedOnlyNodeNames: ["Alt", "Alt Mid", "Alt End"],
      bestOnlyNodeNames: ["Mid"],
      selectedOnlyEdgeCount: 4,
      bestOnlyEdgeCount: 2,
    });
    expect(result.current.allocationPlan.previewNodePath).toEqual(["start", "alt", "alt-mid", "alt-end", "goal-b", "goal-a"]);

    act(() => {
      result.current.buildGoals.applyOptimizedRoute();
    });

    expect(result.current.allocationPlan.committedNodePath).toEqual(["start", "alt", "alt-mid", "alt-end", "goal-b", "goal-a"]);
    expect(result.current.allocationPlan.previewNodePath).toEqual([]);
    expect(result.current.buildGoals.buildGoalStatus).toEqual({ kind: "already-reached" });
    expect(result.current.buildGoals.appliedOptimizedRouteChoice).toEqual({
      routeIndex: 2,
      routeNumber: 3,
      routeCount: 3,
      pointCost: 5,
      pointDeltaFromBest: 2,
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

  it("does not preview or apply malformed progress, including a missing required goal", () => {
    const runner = controlledRunner();
    const { result } = renderHook(() => {
      const [allocationPlan, setAllocationPlan] = useState(fixtureAllocationPlan());
      return { allocationPlan, goals: useBuildGoalsState({ visibleGraph: fixtureGraph(), allocationPlan, setAllocationPlan, runOptimization: runner.run }) };
    });
    act(() => result.current.goals.addBuildGoals(["goal-a", "goal-b"]));
    act(() => result.current.goals.optimizeBuildGoalsRoute());
    act(() => runner.progress(successResult("incomplete", 2)));
    expect(result.current.goals.buildGoalStatus.kind).toBe("error");
    expect(result.current.goals.canApplyOptimizedRoute).toBe(false);
    act(() => result.current.goals.applyOptimizedRoute());
    expect(result.current.allocationPlan).toEqual(fixtureAllocationPlan());
  });

  it("rejects a malformed alternative even when the best result is valid", async () => {
    const runner = controlledRunner();
    const { result } = renderHook(() => {
      const [allocationPlan, setAllocationPlan] = useState(fixtureAllocationPlan());
      return { allocationPlan, goals: useBuildGoalsState({ visibleGraph: fixtureGraph(), allocationPlan, setAllocationPlan, runOptimization: runner.run }) };
    });
    act(() => result.current.goals.addBuildGoal("goal-a"));
    act(() => result.current.goals.optimizeBuildGoalsRoute());
    const valid = successResult("valid", 2);
    valid.routeCandidates!.push({ ...valid.routeCandidates![0], totalEdgeKeys: [] });
    await act(async () => runner.complete(valid));
    expect(result.current.goals.buildGoalStatus.kind).toBe("error");
    expect(result.current.allocationPlan.previewNodePath).toEqual([]);
  });

  it("rechecks the current tree before accepting late progress and before applying", () => {
    const runner = controlledRunner();
    const { result } = renderHook(() => {
      const [visibleGraph, setGraph] = useState(fixtureGraph());
      const [allocationPlan, setAllocationPlan] = useState(fixtureAllocationPlan());
      return { allocationPlan, setGraph, goals: useBuildGoalsState({ visibleGraph, allocationPlan, setAllocationPlan, runOptimization: runner.run }) };
    });
    act(() => result.current.goals.addBuildGoal("goal-a"));
    act(() => result.current.goals.optimizeBuildGoalsRoute());
    act(() => runner.progress(successResult("valid", 2)));
    expect(result.current.goals.canApplyOptimizedRoute).toBe(true);
    act(() => result.current.setGraph({ ...fixtureGraph(), gameVersion: "new-patch" }));
    act(() => result.current.goals.applyOptimizedRoute());
    expect(result.current.goals.buildGoalStatus.kind).toBe("error");
    expect(result.current.allocationPlan.committedNodePath).toEqual(["start"]);
    expect(result.current.allocationPlan.previewNodePath).toEqual([]);
    act(() => result.current.goals.optimizeBuildGoalsRoute());
    act(() => result.current.setGraph({ ...fixtureGraph(), gameVersion: "even-newer-patch" }));
    act(() => runner.progress(successResult("late", 2)));
    expect(result.current.goals.buildGoalStatus.kind).toBe("error");
    expect(result.current.allocationPlan.previewNodePath).toEqual([]);
  });
  it.each(["cap", "weapons"] as const)("rejects applying an old preview after %s constraints change", (kind) => {
    const runner = controlledRunner();
    const { result } = renderHook(() => {
      const [allocationPlan, setAllocationPlan] = useState(fixtureAllocationPlan());
      const [limit, setLimit] = useState(123);
      const [weapons, setWeapons] = useState<{ 1: string[]; 2: string[] }>({ 1: [], 2: [] });
      return { allocationPlan, setLimit, setWeapons, goals: useBuildGoalsState({ visibleGraph: fixtureGraph(), allocationPlan, setAllocationPlan,
        runOptimization: runner.run, mainPointLimit: limit, weaponSetAllocationNodeIds: weapons }) };
    });
    act(() => result.current.goals.addBuildGoal("goal-a"));
    act(() => result.current.goals.optimizeBuildGoalsRoute());
    act(() => runner.progress(successResult("valid", 2)));
    expect(result.current.goals.canApplyOptimizedRoute).toBe(true);
    act(() => kind === "cap" ? result.current.setLimit(1) : result.current.setWeapons({ 1: ["mid"], 2: [] }));
    act(() => result.current.goals.applyOptimizedRoute());
    expect(result.current.goals.buildGoalStatus.kind).toBe("error");
    expect(result.current.goals.canApplyOptimizedRoute).toBe(false);
    expect(result.current.allocationPlan.committedNodePath).toEqual(["start"]);
  });

  it("uses and preserves the pending allocation as a zero-cost base", async () => {
    const initial: AllocationPlan = { ...fixtureAllocationPlan(), previewNodePath: ["start", "mid"], previewEdgeKeys: ["mid::start"] };
    const { result } = renderHook(() => {
      const [allocationPlan, setAllocationPlan] = useState(initial);
      return { allocationPlan, goals: useBuildGoalsState({ visibleGraph: fixtureGraph(), allocationPlan, setAllocationPlan,
        runOptimization: (request) => ({ promise: Promise.resolve(optimizeBuildGoals(request)), cancel: vi.fn() }) }) };
    });
    act(() => result.current.goals.addBuildGoal("goal-a"));
    await act(async () => result.current.goals.optimizeBuildGoalsRoute());
    expect(result.current.goals.buildGoalStatus).toMatchObject({ kind: "success", pointCost: 1 });
    expect(result.current.allocationPlan.previewHighlightNodeIds).toEqual(["goal-a"]);
    act(() => result.current.goals.applyOptimizedRoute());
    expect(result.current.allocationPlan.committedNodePath).toEqual(["start", "mid", "goal-a"]);
  });
});

function controlledRunner() {
  let callbacks: BuildGoalsOptimizationCallbacks;
  let resolve: (result: BuildGoalsOptimizeResult) => void;
  return {
    run: vi.fn((_request: BuildGoalsOptimizeRequest, next: BuildGoalsOptimizationCallbacks = {}): BuildGoalsOptimizationRun => {
      callbacks = next;
      return { promise: new Promise((done) => { resolve = done; }), cancel: vi.fn() };
    }),
    progress: (result: BuildGoalsOptimizeResult) => callbacks.onProgress?.(result),
    complete: (result: BuildGoalsOptimizeResult) => resolve(result),
  };
}

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
      "alt-mid": fixtureNode("alt-mid", "Alt Mid"),
      "alt-end": fixtureNode("alt-end", "Alt End"),
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
      { from: "alt", to: "alt-mid" },
      { from: "alt-mid", to: "alt-end" },
      { from: "alt-end", to: "goal-b" },
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
    treeFingerprint: optimizerTreeFingerprint(fixtureGraph()),
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

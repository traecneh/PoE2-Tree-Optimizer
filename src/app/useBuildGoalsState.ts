import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { BuildGoalsPanelStatus } from "../viewer/BuildGoalsPanel";
import type { BuildGoalsOptimizeRequest, BuildGoalsOptimizeResult, BuildGoalsRouteCandidate } from "../tree/buildGoalsOptimizer";
import {
  runBuildGoalsOptimization as runDefaultBuildGoalsOptimization,
  type BuildGoalsOptimizationCallbacks,
  type BuildGoalsOptimizationRun,
} from "../tree/buildGoalsOptimizerClient";
import type { TreeGraph } from "../tree/types";
import type { AllocationPlan } from "./allocationPlan";
import { mergeNodeIds } from "./allocationPlan";

type RunBuildGoalsOptimization = (
  request: BuildGoalsOptimizeRequest,
  callbacks?: BuildGoalsOptimizationCallbacks,
) => BuildGoalsOptimizationRun;

type UseBuildGoalsStateOptions = {
  visibleGraph: TreeGraph;
  allocationPlan: AllocationPlan;
  setAllocationPlan: Dispatch<SetStateAction<AllocationPlan>>;
  runOptimization?: RunBuildGoalsOptimization;
};

export function useBuildGoalsState({
  visibleGraph,
  allocationPlan,
  setAllocationPlan,
  runOptimization = runDefaultBuildGoalsOptimization,
}: UseBuildGoalsStateOptions) {
  const [buildGoalNodeIds, setBuildGoalNodeIds] = useState<string[]>([]);
  const [buildGoalStatus, setBuildGoalStatus] = useState<BuildGoalsPanelStatus>({ kind: "idle" });
  const [optimizedPreview, setOptimizedPreview] = useState<BuildGoalsOptimizeResult | undefined>();
  const [optimizedRouteIndex, setOptimizedRouteIndex] = useState(0);
  const optimizerRun = useRef<BuildGoalsOptimizationRun | undefined>(undefined);

  const buildGoalNodeIdSet = useMemo(
    () => new Set(buildGoalNodeIds),
    [buildGoalNodeIds],
  );
  const routeCandidateCount = optimizedPreview?.routeCandidates?.length ?? 0;
  const canApplyOptimizedRoute = Boolean(optimizedPreview && optimizedPreview.pointCost > 0);

  const clearOptimizedRouteState = useCallback((nextStatus: BuildGoalsPanelStatus = { kind: "idle" }) => {
    optimizerRun.current?.cancel();
    optimizerRun.current = undefined;
    setOptimizedPreview(undefined);
    setOptimizedRouteIndex(0);
    setBuildGoalStatus(nextStatus);
  }, []);

  const addBuildGoal = useCallback((nodeId: string) => {
    clearOptimizedRouteState();
    setBuildGoalNodeIds((current) => (current.includes(nodeId) ? current : [...current, nodeId]));
  }, [clearOptimizedRouteState]);

  const addBuildGoals = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    clearOptimizedRouteState();
    setBuildGoalNodeIds((current) => mergeNodeIds(current, nodeIds));
  }, [clearOptimizedRouteState]);

  const removeBuildGoal = useCallback((nodeId: string) => {
    clearOptimizedRouteState();
    setBuildGoalNodeIds((current) => current.filter((currentNodeId) => currentNodeId !== nodeId));
  }, [clearOptimizedRouteState]);

  const clearBuildGoals = useCallback(() => {
    clearOptimizedRouteState();
    setBuildGoalNodeIds([]);
  }, [clearOptimizedRouteState]);

  const toggleBuildGoal = useCallback((nodeId: string) => {
    if (buildGoalNodeIdSet.has(nodeId)) {
      removeBuildGoal(nodeId);
      return;
    }

    addBuildGoal(nodeId);
  }, [addBuildGoal, buildGoalNodeIdSet, removeBuildGoal]);

  const showOptimizedRoutePreview = useCallback((result: BuildGoalsOptimizeResult, routeIndex: number) => {
    const route = optimizedRouteCandidate(result, routeIndex);
    setAllocationPlan((current) => ({
      ...current,
      previewNodePath: route.totalNodeIds,
      previewEdgeKeys: route.totalEdgeKeys,
      previewRouteNodePath: [],
      previewHighlightNodeIds: route.addedNodeIds,
      previewHighlightEdgeKeys: route.addedEdgeKeys,
      noAllocationPathNodeId: undefined,
    }));
  }, [setAllocationPlan]);

  const handleOptimizedResult = useCallback((result: BuildGoalsOptimizeResult) => {
    if (result.status === "cancelled") {
      setBuildGoalStatus({ kind: "cancelled" });
      return;
    }

    if (result.status === "error") {
      setBuildGoalStatus({ kind: "error", message: result.message ?? "Build goal optimization failed." });
      return;
    }

    if (result.status === "unreachable") {
      setBuildGoalStatus({
        kind: "unreachable",
        unreachableGoals: result.unreachableGoalNodeIds.flatMap((nodeId) => (
          visibleGraph.nodes[nodeId] ? [visibleGraph.nodes[nodeId]] : []
        )),
      });
      return;
    }

    if (result.pointCost === 0) {
      setBuildGoalStatus({ kind: "already-reached" });
      return;
    }

    showOptimizedRoutePreview(result, 0);
    setOptimizedPreview(result);
    setOptimizedRouteIndex(0);
    setBuildGoalStatus({
      kind: "success",
      pointCost: result.pointCost,
      searchType: result.searchType,
      completeReason: result.completeReason,
      improvementHistory: result.improvementHistory,
    });
  }, [showOptimizedRoutePreview, visibleGraph.nodes]);

  const handleOptimizedProgress = useCallback((result: BuildGoalsOptimizeResult) => {
    if (result.status !== "success" || result.pointCost === 0) return;
    showOptimizedRoutePreview(result, 0);
    setOptimizedPreview(result);
    setOptimizedRouteIndex(0);
    setBuildGoalStatus({
      kind: "running",
      pointCost: result.pointCost,
      improvementHistory: result.improvementHistory,
    });
  }, [showOptimizedRoutePreview]);

  const optimizeBuildGoalsRoute = useCallback(() => {
    if (buildGoalNodeIds.length === 0) return;

    optimizerRun.current?.cancel();
    setOptimizedPreview(undefined);
    setBuildGoalStatus({ kind: "running" });

    const baseNodeIds = allocationPlan.previewNodePath.length > 0
      ? allocationPlan.previewNodePath
      : allocationPlan.committedNodePath;
    const baseEdgeKeys = allocationPlan.previewEdgeKeys.length > 0
      ? allocationPlan.previewEdgeKeys
      : allocationPlan.committedEdgeKeys;
    const run = runOptimization({
      graph: visibleGraph,
      baseNodeIds,
      baseEdgeKeys,
      goalNodeIds: buildGoalNodeIds,
      mode: "shortest",
    }, {
      onProgress: (result) => {
        if (optimizerRun.current !== run) return;
        handleOptimizedProgress(result);
      },
    });

    optimizerRun.current = run;
    run.promise.then((result) => {
      if (optimizerRun.current !== run) return;
      optimizerRun.current = undefined;
      handleOptimizedResult(result);
    });
  }, [
    allocationPlan.committedEdgeKeys,
    allocationPlan.committedNodePath,
    allocationPlan.previewEdgeKeys,
    allocationPlan.previewNodePath,
    buildGoalNodeIds,
    handleOptimizedProgress,
    handleOptimizedResult,
    runOptimization,
    visibleGraph,
  ]);

  const cancelBuildGoalsOptimization = useCallback(() => {
    if (!optimizerRun.current) return;
    optimizerRun.current.cancel();
    optimizerRun.current = undefined;
    setBuildGoalStatus({ kind: "cancelled" });
  }, []);

  const selectOptimizedRoute = useCallback((routeIndex: number) => {
    if (!optimizedPreview) return;
    const routeCount = optimizedPreview.routeCandidates?.length ?? 1;
    const nextRouteIndex = (routeIndex + routeCount) % routeCount;
    setOptimizedRouteIndex(nextRouteIndex);
    showOptimizedRoutePreview(optimizedPreview, nextRouteIndex);
  }, [optimizedPreview, showOptimizedRoutePreview]);

  const applyOptimizedRoute = useCallback(() => {
    if (!optimizedPreview || optimizedPreview.pointCost === 0) return;
    const route = optimizedRouteCandidate(optimizedPreview, optimizedRouteIndex);

    optimizerRun.current?.cancel();
    optimizerRun.current = undefined;
    setAllocationPlan({
      committedNodePath: route.orderedNodeIds,
      committedEdgeKeys: route.totalEdgeKeys,
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    });
    setOptimizedPreview(undefined);
    setOptimizedRouteIndex(0);
    setBuildGoalStatus({ kind: "already-reached" });
  }, [optimizedPreview, optimizedRouteIndex, setAllocationPlan]);

  useEffect(() => () => {
    optimizerRun.current?.cancel();
  }, []);

  return {
    buildGoalNodeIds,
    setBuildGoalNodeIds,
    buildGoalNodeIdSet,
    buildGoalStatus,
    optimizedPreview,
    optimizedRouteIndex,
    routeCandidateCount,
    canApplyOptimizedRoute,
    clearOptimizedRouteState,
    addBuildGoal,
    addBuildGoals,
    toggleBuildGoal,
    removeBuildGoal,
    clearBuildGoals,
    optimizeBuildGoalsRoute,
    cancelBuildGoalsOptimization,
    selectOptimizedRoute,
    applyOptimizedRoute,
  };
}

function optimizedRouteCandidate(result: BuildGoalsOptimizeResult, routeIndex: number): BuildGoalsRouteCandidate {
  return result.routeCandidates?.[routeIndex] ?? {
    addedNodeIds: result.addedNodeIds,
    addedEdgeKeys: result.addedEdgeKeys,
    totalNodeIds: result.totalNodeIds,
    totalEdgeKeys: result.totalEdgeKeys,
    orderedNodeIds: result.orderedNodeIds,
    pointCost: result.pointCost,
  };
}

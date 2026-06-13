import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type {
  BuildGoalsPanelStatus,
  BuildGoalsRouteCandidateDetails,
  BuildGoalsRouteCandidateSummary,
} from "../viewer/BuildGoalsPanel";
import type { BuildGoalsOptimizeRequest, BuildGoalsOptimizeResult, BuildGoalsRouteCandidate } from "../tree/buildGoalsOptimizer";
import {
  runBuildGoalsOptimization as runDefaultBuildGoalsOptimization,
  type BuildGoalsOptimizationCallbacks,
  type BuildGoalsOptimizationRun,
} from "../tree/buildGoalsOptimizerClient";
import { buildSummary } from "../tree/buildSummary";
import type { OptimizedRouteChoice } from "../tree/optimizedRouteChoice";
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
  const [appliedOptimizedRouteChoice, setAppliedOptimizedRouteChoice] = useState<OptimizedRouteChoice | undefined>();
  const optimizerRun = useRef<BuildGoalsOptimizationRun | undefined>(undefined);

  const buildGoalNodeIdSet = useMemo(
    () => new Set(buildGoalNodeIds),
    [buildGoalNodeIds],
  );
  const routeCandidateSummaries = useMemo(
    () => summarizeRouteCandidates(optimizedPreview),
    [optimizedPreview],
  );
  const selectedRouteCandidate = routeCandidateSummaries[optimizedRouteIndex];
  const selectedRouteDetails = useMemo(
    () => buildRouteCandidateDetails(visibleGraph, optimizedPreview, optimizedRouteIndex),
    [optimizedPreview, optimizedRouteIndex, visibleGraph],
  );
  const routeCandidateCount = routeCandidateSummaries.length;
  const canApplyOptimizedRoute = Boolean(optimizedPreview && optimizedPreview.pointCost > 0);

  const clearOptimizedRouteState = useCallback((nextStatus: BuildGoalsPanelStatus = { kind: "idle" }) => {
    optimizerRun.current?.cancel();
    optimizerRun.current = undefined;
    setOptimizedPreview(undefined);
    setOptimizedRouteIndex(0);
    setAppliedOptimizedRouteChoice(undefined);
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
      setAppliedOptimizedRouteChoice(undefined);
      setBuildGoalStatus({ kind: "cancelled" });
      return;
    }

    if (result.status === "error") {
      setAppliedOptimizedRouteChoice(undefined);
      setBuildGoalStatus({ kind: "error", message: result.message ?? "Build goal optimization failed." });
      return;
    }

    if (result.status === "unreachable") {
      setAppliedOptimizedRouteChoice(undefined);
      setBuildGoalStatus({
        kind: "unreachable",
        unreachableGoals: result.unreachableGoalNodeIds.flatMap((nodeId) => (
          visibleGraph.nodes[nodeId] ? [visibleGraph.nodes[nodeId]] : []
        )),
      });
      return;
    }

    if (result.pointCost === 0) {
      setAppliedOptimizedRouteChoice(undefined);
      setBuildGoalStatus({ kind: "already-reached" });
      return;
    }

    showOptimizedRoutePreview(result, 0);
    setOptimizedPreview(result);
    setOptimizedRouteIndex(0);
    setAppliedOptimizedRouteChoice(undefined);
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
    setAppliedOptimizedRouteChoice(undefined);
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
    setAppliedOptimizedRouteChoice(undefined);
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
    const routeChoice = buildOptimizedRouteChoice(optimizedPreview, optimizedRouteIndex);

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
    setAppliedOptimizedRouteChoice(routeChoice);
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
    routeCandidateSummaries,
    selectedRouteCandidate,
    selectedRouteDetails,
    appliedOptimizedRouteChoice,
    setAppliedOptimizedRouteChoice,
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

function buildOptimizedRouteChoice(
  result: BuildGoalsOptimizeResult,
  routeIndex: number,
): OptimizedRouteChoice | undefined {
  const routeCandidates = routeCandidatesFromResult(result);
  const selectedRoute = routeCandidates[routeIndex];
  const selectedSummary = summarizeRouteCandidates(result)[routeIndex];
  if (!selectedRoute || !selectedSummary) return undefined;

  const bestPointCost = routeCandidates.reduce((bestPointCost, candidate) => (
    Math.min(bestPointCost, candidate.pointCost)
  ), routeCandidates[0]?.pointCost ?? selectedRoute.pointCost);

  return {
    routeIndex,
    routeNumber: routeIndex + 1,
    routeCount: routeCandidates.length,
    pointCost: selectedRoute.pointCost,
    pointDeltaFromBest: Math.max(0, selectedRoute.pointCost - bestPointCost),
    pointCostRouteNumber: selectedSummary.pointCostRouteNumber,
    pointCostRouteCount: selectedSummary.pointCostRouteCount,
  };
}

function buildRouteCandidateDetails(
  graph: TreeGraph,
  result: BuildGoalsOptimizeResult | undefined,
  routeIndex: number,
): BuildGoalsRouteCandidateDetails | undefined {
  if (!result) return undefined;

  const routeCandidates = routeCandidatesFromResult(result);
  const selectedRoute = routeCandidates[routeIndex];
  if (!selectedRoute) return undefined;

  const bestRoute = routeCandidates.reduce((best, candidate) => (
    candidate.pointCost < best.pointCost ? candidate : best
  ), routeCandidates[0]);
  const selectedAddedNodeIdSet = new Set(selectedRoute.addedNodeIds);
  const bestAddedNodeIdSet = new Set(bestRoute.addedNodeIds);
  const selectedAddedEdgeKeySet = new Set(selectedRoute.addedEdgeKeys);
  const bestAddedEdgeKeySet = new Set(bestRoute.addedEdgeKeys);
  const selectedOnlyNodeIds = selectedRoute.addedNodeIds.filter((nodeId) => !bestAddedNodeIdSet.has(nodeId));
  const bestOnlyNodeIds = bestRoute.addedNodeIds.filter((nodeId) => !selectedAddedNodeIdSet.has(nodeId));
  const selectedOnlyEdgeKeys = selectedRoute.addedEdgeKeys.filter((edgeKey) => !bestAddedEdgeKeySet.has(edgeKey));
  const bestOnlyEdgeKeys = bestRoute.addedEdgeKeys.filter((edgeKey) => !selectedAddedEdgeKeySet.has(edgeKey));

  return {
    pointCost: selectedRoute.pointCost,
    pointDeltaFromBest: Math.max(0, selectedRoute.pointCost - bestRoute.pointCost),
    addedNodeCount: selectedRoute.addedNodeIds.length,
    selectedOnlyNodeNames: formatNodeNames(graph, selectedOnlyNodeIds),
    bestOnlyNodeNames: formatNodeNames(graph, bestOnlyNodeIds),
    selectedOnlyEdgeCount: selectedOnlyEdgeKeys.length,
    bestOnlyEdgeCount: bestOnlyEdgeKeys.length,
    routeSummary: buildSummary(graph, selectedRoute.addedNodeIds),
    selectedOnlySummary: buildSummary(graph, selectedOnlyNodeIds),
    bestOnlySummary: buildSummary(graph, bestOnlyNodeIds),
  };
}

function routeCandidatesFromResult(result: BuildGoalsOptimizeResult): BuildGoalsRouteCandidate[] {
  return result.routeCandidates?.length
    ? result.routeCandidates
    : [optimizedRouteCandidate(result, 0)];
}

function formatNodeNames(graph: TreeGraph, nodeIds: string[]): string[] {
  return nodeIds.map((nodeId) => graph.nodes[nodeId]?.name ?? nodeId);
}

function summarizeRouteCandidates(result: BuildGoalsOptimizeResult | undefined): BuildGoalsRouteCandidateSummary[] {
  if (!result) return [];
  const routeCandidates = routeCandidatesFromResult(result);
  const routeCountByPointCost = new Map<number, number>();
  for (const candidate of routeCandidates) {
    routeCountByPointCost.set(candidate.pointCost, (routeCountByPointCost.get(candidate.pointCost) ?? 0) + 1);
  }

  const seenByPointCost = new Map<number, number>();
  return routeCandidates.map((candidate, index) => {
    const pointCostRouteNumber = (seenByPointCost.get(candidate.pointCost) ?? 0) + 1;
    seenByPointCost.set(candidate.pointCost, pointCostRouteNumber);
    return {
      index,
      pointCost: candidate.pointCost,
      pointCostRouteNumber,
      pointCostRouteCount: routeCountByPointCost.get(candidate.pointCost) ?? 1,
    };
  });
}

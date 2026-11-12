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
import { defaultPassiveOptimizationSettings, normalizePassiveOptimizationSettings, type PassiveOptimizationSettings } from "../tree/passivePreferences";
import { maxPassiveAllocationPointCount } from "../tree/passivePointBudget";
import { deriveWeaponAttachments, filterWeaponAttachments, type FixedWeaponSets } from "../tree/allocationConstraints";
import { buildGoalsValidationFailure, createBuildGoalsValidation, optimizerTreeFingerprint, type BuildGoalsValidation } from "../tree/buildGoalsValidation";
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
  mainPointLimit?: number;
  rootNodeId?: string;
  selectedAscendancyId?: string;
  allocatedAscendancyNodeIds?: string[];
  weaponSetAllocationNodeIds?: FixedWeaponSets["allocations"];
  weaponSetAttachmentNodeIds?: string[];
};

export function useBuildGoalsState({
  visibleGraph,
  allocationPlan,
  setAllocationPlan,
  runOptimization = runDefaultBuildGoalsOptimization,
  mainPointLimit = maxPassiveAllocationPointCount,
  rootNodeId,
  selectedAscendancyId,
  allocatedAscendancyNodeIds,
  weaponSetAllocationNodeIds = { 1: [], 2: [] },
  weaponSetAttachmentNodeIds = [],
}: UseBuildGoalsStateOptions) {
  const [buildGoalNodeIds, setBuildGoalNodeIds] = useState<string[]>([]);
  const [optimizerSettings, setOptimizerSettings] = useState(defaultPassiveOptimizationSettings);
  const [buildGoalStatus, setBuildGoalStatus] = useState<BuildGoalsPanelStatus>({ kind: "idle" });
  const [optimizedPreview, setOptimizedPreview] = useState<BuildGoalsOptimizeResult | undefined>();
  const [optimizedRouteIndex, setOptimizedRouteIndex] = useState(0);
  const [appliedOptimizedRouteChoice, setAppliedOptimizedRouteChoice] = useState<OptimizedRouteChoice | undefined>();
  const optimizerRun = useRef<BuildGoalsOptimizationRun | undefined>(undefined);
  const allocationBeforeOptimization = useRef<AllocationPlan | undefined>(undefined);
  const optimizationRequest = useRef<BuildGoalsOptimizeRequest | undefined>(undefined);
  const treeFingerprint = useMemo(() => optimizerTreeFingerprint(visibleGraph), [visibleGraph]);
  const validationKey = JSON.stringify([treeFingerprint, rootNodeId, selectedAscendancyId, [...(allocatedAscendancyNodeIds ?? [])].sort(), mainPointLimit,
    weaponSetAllocationNodeIds[1], weaponSetAllocationNodeIds[2], weaponSetAttachmentNodeIds]);
  const currentValidationState = useRef({ visibleGraph, rootNodeId, selectedAscendancyId, allocatedAscendancyNodeIds, mainPointLimit, treeFingerprint, validationKey, weaponSetAllocationNodeIds, weaponSetAttachmentNodeIds });
  currentValidationState.current = { visibleGraph, rootNodeId, selectedAscendancyId, allocatedAscendancyNodeIds, mainPointLimit, treeFingerprint, validationKey, weaponSetAllocationNodeIds, weaponSetAttachmentNodeIds };
  const validationCache = useRef<{ request: BuildGoalsOptimizeRequest; key: string; validation: BuildGoalsValidation } | undefined>(undefined);

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
    allocationBeforeOptimization.current = undefined;
    optimizationRequest.current = undefined;
    validationCache.current = undefined;
  }, []);

  const restoreOptimizerSettings = useCallback((settings: PassiveOptimizationSettings) => {
    setOptimizerSettings(normalizePassiveOptimizationSettings(settings));
  }, []);

  const updateOptimizerSettings = useCallback((settings: PassiveOptimizationSettings) => {
    const originalAllocation = allocationBeforeOptimization.current;
    clearOptimizedRouteState();
    if (originalAllocation) setAllocationPlan(originalAllocation);
    restoreOptimizerSettings(settings);
  }, [clearOptimizedRouteState, restoreOptimizerSettings, setAllocationPlan]);

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

  const validateCurrentResult = useCallback((result: BuildGoalsOptimizeResult): BuildGoalsOptimizeResult => {
    if (result.status !== "success") return result;
    const request = optimizationRequest.current;
    if (!request) return buildGoalsValidationFailure([{ code: "stale-run", kind: "invalid", message: "This route has no active optimization request. Optimize again." }]);
    const current = currentValidationState.current;
    const cached = validationCache.current;
    const validation = cached?.request === request && cached.key === current.validationKey ? cached.validation : createBuildGoalsValidation({
      ...request, graph: current.visibleGraph, rootNodeId: current.rootNodeId ?? request.rootNodeId,
      visibility: { selectedAscendancyId: current.selectedAscendancyId, allocatedAscendancyNodeIds: current.allocatedAscendancyNodeIds },
      totalPointLimit: current.mainPointLimit,
      weaponSets: fixedWeapons(current.visibleGraph, current.weaponSetAllocationNodeIds, current.weaponSetAttachmentNodeIds, request.baseNodeIds, current.rootNodeId),
    });
    validationCache.current = { request, key: current.validationKey, validation };
    const issues = validation.validateResult(result, true);
    return issues.length ? buildGoalsValidationFailure(issues) : result;
  }, []);

  const rejectOptimizedResult = useCallback((result: BuildGoalsOptimizeResult) => {
    optimizerRun.current?.cancel();
    optimizerRun.current = undefined;
    setOptimizedPreview(undefined);
    setOptimizedRouteIndex(0);
    setAppliedOptimizedRouteChoice(undefined);
    const original = allocationBeforeOptimization.current;
    const request = optimizationRequest.current;
    if (original) setAllocationPlan((current) => {
      const sameCommitted = current.committedNodePath.length === original.committedNodePath.length
        && current.committedNodePath.every((id, i) => id === original.committedNodePath[i])
        && current.committedEdgeKeys.length === original.committedEdgeKeys.length
        && current.committedEdgeKeys.every((id, i) => id === original.committedEdgeKeys[i]);
      if (!sameCommitted) return current;
      if (request?.treeFingerprint === currentValidationState.current.treeFingerprint) return original;
      return { ...current, previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [], previewHighlightNodeIds: [], previewHighlightEdgeKeys: [] };
    });
    setBuildGoalStatus({ kind: "error", message: result.message ?? "The optimized route failed validation. Optimize again." });
  }, [setAllocationPlan]);

  const handleOptimizedResult = useCallback((incoming: BuildGoalsOptimizeResult) => {
    const result = validateCurrentResult(incoming);
    if (result.status === "cancelled") {
      setAppliedOptimizedRouteChoice(undefined);
      setBuildGoalStatus({ kind: "cancelled" });
      return;
    }

    if (result.status === "error") {
      rejectOptimizedResult(result);
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

    if (result.pointCost === 0 && !result.weighted) {
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
      weighted: result.weighted,
      message: result.message,
    });
  }, [showOptimizedRoutePreview, visibleGraph.nodes, validateCurrentResult, rejectOptimizedResult]);

  const handleOptimizedProgress = useCallback((incoming: BuildGoalsOptimizeResult) => {
    const result = validateCurrentResult(incoming);
    if (result.status === "error") { rejectOptimizedResult(result); return; }
    if (result.weighted?.stage === "baseline") {
      setBuildGoalStatus({ kind: "running", weighted: result.weighted });
      return;
    }
    if (result.status !== "success" || result.pointCost === 0) return;
    showOptimizedRoutePreview(result, 0);
    setOptimizedPreview(result);
    setOptimizedRouteIndex(0);
    setAppliedOptimizedRouteChoice(undefined);
    setBuildGoalStatus({
      kind: "running",
      pointCost: result.pointCost,
      improvementHistory: result.improvementHistory,
      weighted: result.weighted,
    });
  }, [showOptimizedRoutePreview, validateCurrentResult, rejectOptimizedResult]);

  const optimizeBuildGoalsRoute = useCallback(() => {
    if (buildGoalNodeIds.length === 0) return;

    optimizerRun.current?.cancel();
    const baseAllocation = optimizerSettings.mode === "weighted" && optimizedPreview?.weighted && allocationBeforeOptimization.current
      ? allocationBeforeOptimization.current : allocationPlan;
    allocationBeforeOptimization.current = baseAllocation;
    setOptimizedPreview(undefined);
    setAppliedOptimizedRouteChoice(undefined);
    setBuildGoalStatus({ kind: "running" });

    const baseNodeIds = baseAllocation.previewNodePath.length > 0
      ? baseAllocation.previewNodePath
      : baseAllocation.committedNodePath;
    const baseEdgeKeys = baseAllocation.previewNodePath.length > 0
      ? baseAllocation.previewEdgeKeys
      : baseAllocation.committedEdgeKeys;
    const request: BuildGoalsOptimizeRequest = {
      graph: visibleGraph,
      baseNodeIds,
      baseEdgeKeys,
      goalNodeIds: buildGoalNodeIds,
      mode: optimizerSettings.mode,
      allocationPool: "main",
      rootNodeId: rootNodeId ?? baseNodeIds[0],
      treeFingerprint,
      visibility: { selectedAscendancyId, allocatedAscendancyNodeIds },
      totalPointLimit: mainPointLimit,
      weaponSets: fixedWeapons(visibleGraph, weaponSetAllocationNodeIds, weaponSetAttachmentNodeIds, baseNodeIds, rootNodeId),
      ...(optimizerSettings.mode === "weighted" ? {
        preferences: optimizerSettings.preferences,
        ...(optimizerSettings.focusSkillId ? { focusSkillId: optimizerSettings.focusSkillId } : {}),
        ...(optimizerSettings.supportGemIds?.length ? { supportGemIds: optimizerSettings.supportGemIds } : {}),
        ...(optimizerSettings.socketedGrenadeId ? { socketedGrenadeId: optimizerSettings.socketedGrenadeId } : {}),
        ...(optimizerSettings.socketedProxySkillId ? { socketedProxySkillId: optimizerSettings.socketedProxySkillId } : {}),
        extraPointBudget: optimizerSettings.extraPointBudget,
        ...(optimizerSettings.pointBudgetMode === "all-available" ? { pointBudgetMode: "all-available" as const, totalPointLimit: mainPointLimit } : {}),
      } : {}),
    };
    optimizationRequest.current = request;
    const validation = createBuildGoalsValidation(request);
    validationCache.current = { request, key: currentValidationState.current.validationKey, validation };
    if (validation.issues.length) { rejectOptimizedResult(buildGoalsValidationFailure(validation.issues)); return; }
    const run = runOptimization(request, {
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
    allocationPlan,
    allocationPlan.committedEdgeKeys,
    allocationPlan.committedNodePath,
    allocationPlan.previewEdgeKeys,
    allocationPlan.previewNodePath,
    buildGoalNodeIds,
    handleOptimizedProgress,
    handleOptimizedResult,
    runOptimization,
    optimizerSettings,
    mainPointLimit,
    optimizedPreview,
    visibleGraph,
    rootNodeId,
    treeFingerprint,
    selectedAscendancyId,
    allocatedAscendancyNodeIds,
    rejectOptimizedResult,
    weaponSetAllocationNodeIds,
    weaponSetAttachmentNodeIds,
  ]);

  const cancelBuildGoalsOptimization = useCallback(() => {
    if (!optimizerRun.current) return;
    optimizerRun.current.cancel();
    optimizerRun.current = undefined;
    setBuildGoalStatus({ kind: "cancelled" });
  }, []);

  const selectOptimizedRoute = useCallback((routeIndex: number) => {
    if (!optimizedPreview) return;
    const checked = validateCurrentResult(optimizedPreview);
    if (checked.status === "error") { rejectOptimizedResult(checked); return; }
    const routeCount = optimizedPreview.routeCandidates?.length ?? 1;
    const nextRouteIndex = (routeIndex + routeCount) % routeCount;
    setOptimizedRouteIndex(nextRouteIndex);
    showOptimizedRoutePreview(optimizedPreview, nextRouteIndex);
  }, [optimizedPreview, showOptimizedRoutePreview, validateCurrentResult, rejectOptimizedResult]);

  const applyOptimizedRoute = useCallback(() => {
    if (!optimizedPreview || optimizedPreview.pointCost === 0) return;
    const checked = validateCurrentResult(optimizedPreview);
    if (checked.status === "error") { rejectOptimizedResult(checked); return; }
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
    allocationBeforeOptimization.current = undefined;
    optimizationRequest.current = undefined;
    setBuildGoalStatus({ kind: "already-reached" });
  }, [optimizedPreview, optimizedRouteIndex, setAllocationPlan, validateCurrentResult, rejectOptimizedResult]);

  useEffect(() => () => {
    optimizerRun.current?.cancel();
  }, []);

  return {
    buildGoalNodeIds,
    optimizerSettings,
    updateOptimizerSettings,
    restoreOptimizerSettings,
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

function fixedWeapons(graph: TreeGraph, allocations: FixedWeaponSets["allocations"], recorded: string[], base: string[], root: string | undefined): FixedWeaponSets | undefined {
  if (!allocations[1].length && !allocations[2].length) return undefined;
  return { allocations: { 1: [...allocations[1]], 2: [...allocations[2]] }, attachmentNodeIds: [...new Set([
    ...filterWeaponAttachments(graph, recorded, allocations), ...deriveWeaponAttachments(graph, base, allocations, root ?? base[0]),
  ])] };
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
    ...(selectedRoute.weighted ? {
      preferenceScore: selectedRoute.weighted.score,
      baselinePointCost: selectedRoute.weighted.baselinePointCost,
    } : {}),
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

  const bestRoute = (result.weighted ? routeCandidates.find((candidate) => candidate.label === "shortest-baseline") : undefined) ?? routeCandidates.reduce((best, candidate) => (
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
    weighted: selectedRoute.weighted,
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
      ...(candidate.weighted ? { preferenceScore: candidate.weighted.score } : {}),
    };
  });
}

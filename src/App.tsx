import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  allocationPathFromNodePath,
  allocationPlanHasVisibleState,
  allocationPlanNodeIds,
  appendUniqueNodePath,
  cloneAllocationPlan,
  edgeKeysFromNodePath,
  emptyAllocationPlanForStart,
  filterEdgeKeysToNodeIds,
  mergeEdgeKeys,
  mergeNodeIds,
  nodePathEndpoint,
  pendingAllocationEdgeKeys,
  pendingAllocationNodeIds,
  pruneCommittedNodePathOnClick,
  pruneNodePathOnClick,
  sanitizeSavedAllocationPlan,
} from "./app/allocationPlan";
import {
  maxAscendancyAllocationCount,
  sanitizeAscendancyAllocationNodeIds,
} from "./app/ascendancyAllocation";
import {
  buildPobImportReportDetails,
  pobPathStartStatus,
} from "./app/pobImportStatus";
import { useAscendancyAllocationState } from "./app/useAscendancyAllocationState";
import { useAllocationPlanState } from "./app/useAllocationPlanState";
import { usePobImportState } from "./app/usePobImportState";
import { buildSummary } from "./tree/buildSummary";
import type { BuildGoalsOptimizeResult, BuildGoalsRouteCandidate } from "./tree/buildGoalsOptimizer";
import { runBuildGoalsOptimization, type BuildGoalsOptimizationRun } from "./tree/buildGoalsOptimizerClient";
import {
  buildClassStartOptions,
  resolveClassStartOptionFromPobMetadata,
  type ClassStartOption,
} from "./tree/classStartAliases";
import {
  findAllocationDistancesFrom,
  findShortestAllocationPathFromAllocated,
} from "./tree/pathAllocation";
import { createPassiveSearchIndex, searchPassiveTree } from "./tree/passiveSearch";
import { importBuildGoalsFromPobCode } from "./tree/pobBuildImport";
import { publicAssetPath } from "./tree/publicAssetPaths";
import { sampleGraph } from "./tree/sampleGraph";
import {
  createSavedBuildId,
  loadSavedBuilds,
  storeSavedBuilds,
  type SavedBuild,
  type SavedBuildState,
} from "./tree/savedBuilds";
import { filterVisibleTreeGraph } from "./tree/treeVisibility";
import type { TreeGraph, TreeNode } from "./tree/types";
import {
  BuildGoalsPanel,
  type BuildGoalsPanelGoal,
  type BuildGoalsPanelStatus,
} from "./viewer/BuildGoalsPanel";
import { BuildSummaryPanel } from "./viewer/BuildSummaryPanel";
import { ControlTooltip } from "./viewer/ControlTooltip";
import { NodeInspector } from "./viewer/NodeInspector";
import { PassiveSearchPanel, type PassiveSearchPanelResult } from "./viewer/PassiveSearchPanel";
import { TreeViewer, type DebugOverlayState } from "./viewer/TreeViewer";

const nodeVisualScaleOptions = [1, 1.5, 2, 3] as const;
const defaultNodeVisualScale = 3;
const maxPassiveAllocationPointCount = 123;
const treeDataVersionLabel = "PoE2 0.5.0";
const savedBuildToastDurationMs = 3000;
const debugOverlayOff: DebugOverlayState = {
  showNodeIds: false,
  highlightMissingStats: false,
  highlightOrphans: false,
  showEdgeRoutes: false,
  showEdgeRouteLabels: false,
};

type GraphLoadStatus = "loading" | "loaded" | "fallback";

export default function App() {
  const [graph, setGraph] = useState<TreeGraph>(sampleGraph);
  const [graphLoadStatus, setGraphLoadStatus] = useState<GraphLoadStatus>("loading");
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [selectedClassStartId, setSelectedClassStartId] = useState<string | undefined>();
  const [pathStartNodeId, setPathStartNodeId] = useState<string | undefined>();
  const { allocationPlan, setAllocationPlan, resetAllocationPlan } = useAllocationPlanState();
  const [nodeVisualScale, setNodeVisualScale] = useState<number>(defaultNodeVisualScale);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocusedNodeId, setSearchFocusedNodeId] = useState<string | undefined>();
  const [hoverPathPreviewEnabled, setHoverPathPreviewEnabled] = useState(false);
  const [hoverPreviewTargetNodeId, setHoverPreviewTargetNodeId] = useState<string | undefined>();
  const [goalShortcutActive, setGoalShortcutActive] = useState(false);
  const [buildGoalNodeIds, setBuildGoalNodeIds] = useState<string[]>([]);
  const [buildGoalStatus, setBuildGoalStatus] = useState<BuildGoalsPanelStatus>({ kind: "idle" });
  const {
    pobImportCode,
    setPobImportCode,
    pobImportStatus,
    setPobImportStatus,
    clearPobImport,
    clearPobImportStatus,
  } = usePobImportState();
  const [optimizedPreview, setOptimizedPreview] = useState<BuildGoalsOptimizeResult | undefined>();
  const [optimizedRouteIndex, setOptimizedRouteIndex] = useState(0);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() => loadSavedBuilds());
  const [selectedSavedBuildId, setSelectedSavedBuildId] = useState("");
  const [savedBuildName, setSavedBuildName] = useState("");
  const [savedBuildStatus, setSavedBuildStatus] = useState("");
  const [savedBuildStatusFeedbackKey, setSavedBuildStatusFeedbackKey] = useState(0);
  const optimizerRun = useRef<BuildGoalsOptimizationRun | undefined>(undefined);
  const savedBuildStatusTimeoutId = useRef<number | undefined>(undefined);
  const classStartOptions = useMemo(
    () => buildClassStartOptions(graph),
    [graph],
  );
  const selectedClassStartOption = useMemo(
    () => (selectedClassStartId
      ? classStartOptions.find((option) => option.id === selectedClassStartId)
      : undefined),
    [classStartOptions, selectedClassStartId],
  );
  const selectedAscendancy = selectedClassStartOption?.ascendancy;
  const {
    setAscendancyAllocationNodeIds,
    activeAscendancyAllocationNodeIds,
    activeAscendancyPointCostByNodeId,
    activeAscendancyPointCount,
    activeAscendancyAllocationEdgeKeys,
    resetAscendancyAllocation,
    toggleAscendancyAllocationNode,
  } = useAscendancyAllocationState(graph, selectedAscendancy);
  const allocatedNodePath = allocationPlan.committedNodePath;
  const allocatedNodeIds = useMemo(
    () => new Set(allocatedNodePath),
    [allocatedNodePath],
  );
  const visibleGraph = useMemo(
    () => filterVisibleTreeGraph(graph, {
      selectedAscendancyId: selectedAscendancy?.id,
      allocatedAscendancyNodeIds: activeAscendancyAllocationNodeIds,
    }),
    [activeAscendancyAllocationNodeIds, graph, selectedAscendancy?.id],
  );
  const selectedNode = useMemo(
    () => (selectedNodeId ? visibleGraph.nodes[selectedNodeId] : undefined),
    [selectedNodeId, visibleGraph.nodes],
  );
  const passiveSearchIndex = useMemo(() => createPassiveSearchIndex(visibleGraph), [visibleGraph]);
  const searchResults = useMemo(() => searchPassiveTree(passiveSearchIndex, searchQuery), [passiveSearchIndex, searchQuery]);
  const displayAllocatedNodeIds = useMemo(
    () => new Set([...allocatedNodePath, ...activeAscendancyAllocationNodeIds]),
    [activeAscendancyAllocationNodeIds, allocatedNodePath],
  );
  const displayAllocatedEdgeKeys = useMemo(
    () => new Set([...allocationPlan.committedEdgeKeys, ...activeAscendancyAllocationEdgeKeys]),
    [activeAscendancyAllocationEdgeKeys, allocationPlan.committedEdgeKeys],
  );
  const allocationDistanceNodeIds = useMemo(
    () => new Set(allocationPlan.previewNodePath.length > 0 ? allocationPlan.previewNodePath : allocatedNodePath),
    [allocatedNodePath, allocationPlan.previewNodePath],
  );
  const buildSummaryNodeIds = useMemo(
    () => new Set([...allocationDistanceNodeIds, ...activeAscendancyAllocationNodeIds]),
    [activeAscendancyAllocationNodeIds, allocationDistanceNodeIds],
  );
  const currentAllocationEdgeKeys = useMemo(
    () => new Set(allocationPlan.previewEdgeKeys.length > 0
      ? allocationPlan.previewEdgeKeys
      : allocationPlan.committedEdgeKeys),
    [allocationPlan.committedEdgeKeys, allocationPlan.previewEdgeKeys],
  );
  const allocationDistances = useMemo(
    () => findAllocationDistancesFrom(visibleGraph, allocationDistanceNodeIds),
    [allocationDistanceNodeIds, visibleGraph],
  );
  const buildSummaryData = useMemo(
    () => buildSummary(visibleGraph, buildSummaryNodeIds, { pointCostByNodeId: activeAscendancyPointCostByNodeId }),
    [activeAscendancyPointCostByNodeId, buildSummaryNodeIds, visibleGraph],
  );
  const buildGoalNodeIdSet = useMemo(
    () => new Set(buildGoalNodeIds),
    [buildGoalNodeIds],
  );
  const buildGoalPanelGoals = useMemo<BuildGoalsPanelGoal[]>(
    () => buildGoalNodeIds.flatMap((nodeId) => {
      const node = visibleGraph.nodes[nodeId];
      if (!node) return [];
      return [{
        node,
        allocationDistance: allocationDistances.get(nodeId),
        reached: allocationDistanceNodeIds.has(nodeId),
      }];
    }),
    [allocationDistanceNodeIds, allocationDistances, buildGoalNodeIds, visibleGraph.nodes],
  );
  const searchResultsWithAllocationDistance = useMemo<PassiveSearchPanelResult[]>(
    () => searchResults
      .map((result, searchIndex) => ({
        result: {
          ...result,
          allocationDistance: allocationDistances.get(result.node.id),
          allocated: displayAllocatedNodeIds.has(result.node.id),
        },
        searchIndex,
      }))
      .sort((left, right) => (
        compareAllocationDistances(left.result.allocationDistance, right.result.allocationDistance)
        || left.searchIndex - right.searchIndex
      ))
      .map(({ result }) => result),
    [allocationDistances, displayAllocatedNodeIds, searchResults],
  );
  const currentPathEndpointNodeId = nodePathEndpoint(allocationPlan.previewNodePath)
    ?? nodePathEndpoint(allocatedNodePath)
    ?? pathStartNodeId;
  const previewRouteNodePath = allocationPlan.previewRouteNodePath;
  const previewRouteEndpointNodeId = nodePathEndpoint(previewRouteNodePath);
  const allocationPath = useMemo(
    () => (selectedNodeId && selectedNodeId === previewRouteEndpointNodeId
      ? allocationPathFromNodePath(previewRouteNodePath)
      : undefined),
    [previewRouteEndpointNodeId, previewRouteNodePath, selectedNodeId],
  );
  const searchMatchNodeIds = useMemo(
    () => new Set(searchResults.map(({ node }) => node.id)),
    [searchResults],
  );
  const allocationPathNodeIds = useMemo(
    () => pendingAllocationNodeIds(
      allocationPlan.previewNodePath,
      allocatedNodePath,
      previewRouteNodePath,
      allocationPlan.previewHighlightNodeIds,
    ),
    [allocatedNodePath, allocationPlan.previewHighlightNodeIds, allocationPlan.previewNodePath, previewRouteNodePath],
  );
  const allocationPathEdgeKeys = useMemo(
    () => pendingAllocationEdgeKeys(
      allocationPlan.previewEdgeKeys,
      allocationPlan.committedEdgeKeys,
      allocationPlan.previewHighlightEdgeKeys,
    ),
    [allocationPlan.committedEdgeKeys, allocationPlan.previewEdgeKeys, allocationPlan.previewHighlightEdgeKeys],
  );
  const hoverAllocationPath = useMemo(
    () => (hoverPathPreviewEnabled
      && !goalShortcutActive
      && hoverPreviewTargetNodeId
      && !allocationDistanceNodeIds.has(hoverPreviewTargetNodeId)
      ? findShortestAllocationPathFromAllocated(visibleGraph, allocationDistanceNodeIds, hoverPreviewTargetNodeId)
      : undefined),
    [allocationDistanceNodeIds, goalShortcutActive, hoverPathPreviewEnabled, hoverPreviewTargetNodeId, visibleGraph],
  );
  const hoverAllocationPathNodeIds = useMemo(
    () => new Set((hoverAllocationPath?.nodeIds ?? []).filter((nodeId) => !allocationDistanceNodeIds.has(nodeId))),
    [allocationDistanceNodeIds, hoverAllocationPath],
  );
  const hoverAllocationPathEdgeKeys = useMemo(
    () => new Set((hoverAllocationPath?.edgeKeys ?? []).filter((edgeKey) => !currentAllocationEdgeKeys.has(edgeKey))),
    [currentAllocationEdgeKeys, hoverAllocationPath],
  );
  const noAllocationPathNodeId = allocationPlan.noAllocationPathNodeId;
  const allocatedPointCount = Math.max(0, allocatedNodePath.length - 1);
  const canResetAllocation = allocatedPointCount > 0
    || activeAscendancyAllocationNodeIds.length > 0
    || allocationPlan.previewNodePath.length > 0
    || allocationPlan.previewEdgeKeys.length > 0
    || allocationPlan.previewRouteNodePath.length > 0
    || Boolean(allocationPlan.noAllocationPathNodeId);
  const allocationPathNodeNames = useMemo(
    () => allocationPath?.nodeIds.map((nodeId) => visibleGraph.nodes[nodeId]?.name ?? nodeId) ?? [],
    [allocationPath, visibleGraph.nodes],
  );
  const selectedSavedBuild = useMemo(
    () => savedBuilds.find((build) => build.id === selectedSavedBuildId),
    [savedBuilds, selectedSavedBuildId],
  );
  const canSaveCurrentBuild = savedBuildName.trim().length > 0;

  function clearOptimizedRouteState(nextStatus: BuildGoalsPanelStatus = { kind: "idle" }) {
    optimizerRun.current?.cancel();
    optimizerRun.current = undefined;
    setOptimizedPreview(undefined);
    setOptimizedRouteIndex(0);
    setBuildGoalStatus(nextStatus);
  }

  function resetAllocation() {
    clearOptimizedRouteState();
    resetAscendancyAllocation();
    resetAllocationPlan(pathStartNodeId);
  }

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchFocusedNodeId(undefined);
  }, []);

  function updateHoverPreviewTarget(nodeId: string | undefined) {
    setHoverPreviewTargetNodeId(hoverPathPreviewEnabled && !goalShortcutActive ? nodeId : undefined);
  }

  function toggleHoverPathPreview(enabled: boolean) {
    setHoverPathPreviewEnabled(enabled);
    if (!enabled) {
      setHoverPreviewTargetNodeId(undefined);
    }
  }

  function applyClassStartOption(option: ClassStartOption) {
    clearOptimizedRouteState();
    setSelectedNodeId(undefined);
    setHoverPreviewTargetNodeId(undefined);
    setSelectedClassStartId(option.id);
    setPathStartNodeId(option.nodeId);
    resetAscendancyAllocation();
    resetAllocationPlan(option.nodeId);
  }

  function changeSelectedClassStart(classStartId: string) {
    const option = classStartOptions.find((currentOption) => currentOption.id === classStartId);
    if (option) applyClassStartOption(option);
  }

  function updateSavedBuilds(nextBuilds: SavedBuild[]) {
    setSavedBuilds(nextBuilds);
    storeSavedBuilds(nextBuilds);
  }

  function showSavedBuildStatus(nextStatus: string) {
    if (savedBuildStatusTimeoutId.current !== undefined) {
      window.clearTimeout(savedBuildStatusTimeoutId.current);
    }
    setSavedBuildStatus(nextStatus);
    setSavedBuildStatusFeedbackKey((currentKey) => currentKey + 1);
    savedBuildStatusTimeoutId.current = window.setTimeout(() => {
      setSavedBuildStatus("");
      savedBuildStatusTimeoutId.current = undefined;
    }, savedBuildToastDurationMs);
  }

  function clearSavedBuildStatus() {
    if (savedBuildStatusTimeoutId.current !== undefined) {
      window.clearTimeout(savedBuildStatusTimeoutId.current);
      savedBuildStatusTimeoutId.current = undefined;
    }
    setSavedBuildStatus("");
  }

  function currentSavedBuildState(): SavedBuildState {
    return {
      selectedClassStartId,
      pathStartNodeId,
      allocationPlan: cloneAllocationPlan(allocationPlan),
      nodeVisualScale,
      buildGoalNodeIds: [...buildGoalNodeIds],
      ascendancyAllocationNodeIds: [...activeAscendancyAllocationNodeIds],
    };
  }

  function saveCurrentBuild() {
    const name = savedBuildName.trim();
    if (!name) return;

    const now = new Date().toISOString();
    const existingBuild = savedBuilds.find((build) => build.id === selectedSavedBuildId);
    const nextBuild: SavedBuild = existingBuild
      ? {
        ...existingBuild,
        name,
        updatedAt: now,
        state: currentSavedBuildState(),
      }
      : {
        id: createSavedBuildId(),
        name,
        createdAt: now,
        updatedAt: now,
        state: currentSavedBuildState(),
      };
    const nextBuilds = existingBuild
      ? savedBuilds.map((build) => (build.id === existingBuild.id ? nextBuild : build))
      : [...savedBuilds, nextBuild];

    updateSavedBuilds(nextBuilds);
    setSelectedSavedBuildId(nextBuild.id);
    setSavedBuildName(nextBuild.name);
    showSavedBuildStatus(`Saved ${nextBuild.name}`);
  }

  function loadSavedBuild(buildId: string) {
    setSelectedSavedBuildId(buildId);
    const build = savedBuilds.find((currentBuild) => currentBuild.id === buildId);
    if (!build) {
      setSavedBuildName("");
      clearSavedBuildStatus();
      return;
    }

    clearOptimizedRouteState();
    clearPobImport();
    setSearchQuery("");
    setSearchFocusedNodeId(undefined);
    setSelectedNodeId(undefined);
    setHoverPreviewTargetNodeId(undefined);

    const nextClassStartOption = resolveSavedClassStartOption(build.state, classStartOptions);
    const nextPathStartNodeId = nextClassStartOption?.nodeId;
    setSelectedClassStartId(nextClassStartOption?.id);
    setPathStartNodeId(nextPathStartNodeId);
    setAllocationPlan(sanitizeSavedAllocationPlan(build.state.allocationPlan, graph, nextPathStartNodeId));
    setAscendancyAllocationNodeIds(sanitizeAscendancyAllocationNodeIds(
      build.state.ascendancyAllocationNodeIds,
      graph,
      nextClassStartOption?.ascendancy,
    ));
    setNodeVisualScale(validNodeVisualScale(build.state.nodeVisualScale));
    setBuildGoalNodeIds(build.state.buildGoalNodeIds.filter((nodeId) => {
      const node = graph.nodes[nodeId];
      return node && canAddBuildGoal(node, { allowAnyPassive: true });
    }));
    setSavedBuildName(build.name);
    showSavedBuildStatus(`Loaded ${build.name}`);
  }

  function newUnsavedBuild(nextStatus = "New unsaved build") {
    clearOptimizedRouteState();
    clearPobImport();
    setSearchQuery("");
    setSearchFocusedNodeId(undefined);
    setSelectedNodeId(undefined);
    setHoverPreviewTargetNodeId(undefined);
    setBuildGoalNodeIds([]);
    resetAscendancyAllocation();
    resetAllocationPlan(pathStartNodeId);
    setSelectedSavedBuildId("");
    setSavedBuildName("");
    showSavedBuildStatus(nextStatus);
  }

  function deleteSelectedBuild() {
    if (!selectedSavedBuild) return;
    const deletedBuildName = selectedSavedBuild.name;
    updateSavedBuilds(savedBuilds.filter((build) => build.id !== selectedSavedBuild.id));
    newUnsavedBuild(`Deleted ${deletedBuildName}`);
  }

  function allocatePreviewPath() {
    if (!allocationPath || allocationPath.pointCost === 0) return;
    clearOptimizedRouteState();
    setAllocationPlan((current) => ({
      committedNodePath: current.previewNodePath,
      committedEdgeKeys: current.previewEdgeKeys,
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    }));
  }

  function addBuildGoal(nodeId: string, options: { allowAnyPassive?: boolean } = {}) {
    const node = visibleGraph.nodes[nodeId];
    if (!node || !canAddBuildGoal(node, options)) return;
    clearOptimizedRouteState();
    clearPobImportStatus();
    setBuildGoalNodeIds((current) => (current.includes(nodeId) ? current : [...current, nodeId]));
  }

  function addMatchingBuildGoals(nodeIds: string[]) {
    const addableNodeIds = nodeIds.filter((nodeId) => {
      const node = visibleGraph.nodes[nodeId];
      return node && canAddBuildGoal(node, { allowAnyPassive: true });
    });
    if (addableNodeIds.length === 0) return;

    clearOptimizedRouteState();
    clearPobImportStatus();
    setBuildGoalNodeIds((current) => mergeNodeIds(current, addableNodeIds));
  }

  function toggleMapBuildGoal(nodeId: string) {
    if (buildGoalNodeIdSet.has(nodeId)) {
      removeBuildGoal(nodeId);
      return;
    }

    addBuildGoal(nodeId, { allowAnyPassive: true });
  }

  function removeBuildGoal(nodeId: string) {
    clearOptimizedRouteState();
    clearPobImportStatus();
    setBuildGoalNodeIds((current) => current.filter((currentNodeId) => currentNodeId !== nodeId));
  }

  function clearBuildGoals() {
    clearOptimizedRouteState();
    clearPobImportStatus();
    setBuildGoalNodeIds([]);
  }

  function importPobBuildGoals() {
    if (pobImportCode.trim().length === 0) return;

    try {
      const result = importBuildGoalsFromPobCode(pobImportCode, graph);
      const currentGoalNodeIds = new Set(buildGoalNodeIds);
      const importedGoalNodeIds = result.goalNodeIds.filter((nodeId) => !currentGoalNodeIds.has(nodeId));
      const pathStartResolution = resolveClassStartOptionFromPobMetadata(classStartOptions, {
        className: result.className,
        ascendClassName: result.ascendClassName,
        allocatedNodeIds: result.allocatedNodeIds,
      });
      const nextClassStartOption = pathStartResolution.kind === "matched" ? pathStartResolution.option : selectedClassStartOption;
      const importedAscendancyNodeIds = sanitizeAscendancyAllocationNodeIds(
        result.ascendancyNodeIds,
        graph,
        nextClassStartOption?.ascendancy,
      );

      clearOptimizedRouteState();
      if (pathStartResolution.kind === "matched") {
        applyClassStartOption(pathStartResolution.option);
      }
      setAscendancyAllocationNodeIds(importedAscendancyNodeIds);
      setBuildGoalNodeIds((current) => mergeNodeIds(current, importedGoalNodeIds));
      setPobImportStatus({
        kind: "success",
        importedGoalCount: importedGoalNodeIds.length,
        pobBasePassivePointCount: result.pobBasePassivePointCount,
        selectedAscendancyNodeCount: importedAscendancyNodeIds.length,
        alreadySelectedGoalCount: result.goalNodeIds.length - importedGoalNodeIds.length,
        missingNodeCount: result.missingNodeIds.length,
        pathStart: pobPathStartStatus(pathStartResolution),
        details: buildPobImportReportDetails(result, {
          graph,
          importedGoalNodeIds,
          alreadySelectedGoalNodeIds: result.goalNodeIds.filter((nodeId) => currentGoalNodeIds.has(nodeId)),
          selectedAscendancyNodeIds: importedAscendancyNodeIds,
        }),
      });
    } catch (error) {
      clearOptimizedRouteState();
      setPobImportStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not import PoB build code.",
      });
    }
  }

  function optimizeBuildGoalsRoute() {
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
    const run = runBuildGoalsOptimization({
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
  }

  function cancelBuildGoalsOptimization() {
    if (!optimizerRun.current) return;
    optimizerRun.current.cancel();
    optimizerRun.current = undefined;
    setBuildGoalStatus({ kind: "cancelled" });
  }

  function handleOptimizedResult(result: BuildGoalsOptimizeResult) {
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
  }

  function handleOptimizedProgress(result: BuildGoalsOptimizeResult) {
    if (result.status !== "success" || result.pointCost === 0) return;
    showOptimizedRoutePreview(result, 0);
    setOptimizedPreview(result);
    setOptimizedRouteIndex(0);
    setBuildGoalStatus({
      kind: "running",
      pointCost: result.pointCost,
      improvementHistory: result.improvementHistory,
    });
  }

  function showOptimizedRoutePreview(result: BuildGoalsOptimizeResult, routeIndex: number) {
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
  }

  function selectOptimizedRoute(routeIndex: number) {
    if (!optimizedPreview) return;
    const routeCount = optimizedPreview.routeCandidates?.length ?? 1;
    const nextRouteIndex = (routeIndex + routeCount) % routeCount;
    setOptimizedRouteIndex(nextRouteIndex);
    showOptimizedRoutePreview(optimizedPreview, nextRouteIndex);
  }

  function applyOptimizedRoute() {
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
  }

  function selectTreeNode(nodeId: string) {
    clearOptimizedRouteState();
    const node = visibleGraph.nodes[nodeId];
    if (!node) return;
    if (node?.flags.ascendancy) {
      setSelectedNodeId(nodeId);
      setHoverPreviewTargetNodeId(undefined);
      toggleAscendancyAllocationNode(node);
      return;
    }

    const committedNodeIndex = allocationPlan.committedNodePath.lastIndexOf(nodeId);
    if (committedNodeIndex !== -1) {
      const committedNodePath = pruneCommittedNodePathOnClick(allocationPlan.committedNodePath, nodeId);
      setSelectedNodeId(committedNodePath.includes(nodeId) ? nodeId : undefined);
      setAllocationPlan({
        committedNodePath,
        committedEdgeKeys: filterEdgeKeysToNodeIds(allocationPlan.committedEdgeKeys, committedNodePath),
        previewNodePath: [],
        previewEdgeKeys: [],
        previewRouteNodePath: [],
      });
      return;
    }

    const previewNodeIndex = allocationPlan.previewNodePath.lastIndexOf(nodeId);
    if (previewNodeIndex !== -1) {
      const previewNodePath = pruneNodePathOnClick(allocationPlan.previewNodePath, nodeId);
      const previewRouteNodePath = pruneNodePathOnClick(allocationPlan.previewRouteNodePath, nodeId);
      setSelectedNodeId(previewNodePath.includes(nodeId) ? nodeId : undefined);
      setAllocationPlan({
        ...allocationPlan,
        previewNodePath,
        previewEdgeKeys: filterEdgeKeysToNodeIds(allocationPlan.previewEdgeKeys, previewNodePath),
        previewRouteNodePath,
        previewHighlightNodeIds: allocationPlan.previewHighlightNodeIds?.filter((highlightNodeId) => previewNodePath.includes(highlightNodeId)),
        previewHighlightEdgeKeys: allocationPlan.previewHighlightEdgeKeys
          ? filterEdgeKeysToNodeIds(allocationPlan.previewHighlightEdgeKeys, previewNodePath)
          : undefined,
        noAllocationPathNodeId: undefined,
      });
      return;
    }

    setSelectedNodeId(nodeId);
    setAllocationPlan((current) => {
      const baseNodePath = current.previewNodePath.length > 0
        ? current.previewNodePath
        : current.committedNodePath;
      const baseEdgeKeys = current.previewNodePath.length > 0
        ? current.previewEdgeKeys
        : current.committedEdgeKeys;
      const pathStartNodePath = baseNodePath.length > 0
        ? baseNodePath
        : pathStartNodeId ? [pathStartNodeId] : [];
      const nextPath = pathStartNodePath.length > 0
        ? findShortestAllocationPathFromAllocated(visibleGraph, new Set(pathStartNodePath), nodeId)
        : undefined;

      if (!nextPath) {
        return {
          ...current,
          noAllocationPathNodeId: nodeId,
        };
      }

      return {
        ...current,
        previewNodePath: appendUniqueNodePath(pathStartNodePath, nextPath.nodeIds),
        previewEdgeKeys: mergeEdgeKeys(baseEdgeKeys, Array.from(edgeKeysFromNodePath(nextPath.nodeIds))),
        previewRouteNodePath: nextPath.nodeIds,
        previewHighlightNodeIds: undefined,
        previewHighlightEdgeKeys: undefined,
        noAllocationPathNodeId: undefined,
      };
    });
  }

  useLayoutEffect(() => {
    const currentOption = selectedClassStartId
      ? classStartOptions.find((option) => option.id === selectedClassStartId)
      : undefined;
    const nextOption = currentOption
      ?? (pathStartNodeId ? classStartOptions.find((option) => option.nodeId === pathStartNodeId) : undefined)
      ?? classStartOptions[0];

    if (nextOption?.id !== selectedClassStartId) {
      setSelectedClassStartId(nextOption?.id);
    }
    if (nextOption?.nodeId !== pathStartNodeId) {
      setPathStartNodeId(nextOption?.nodeId);
    }
  }, [classStartOptions, pathStartNodeId, selectedClassStartId]);

  useEffect(() => {
    optimizerRun.current?.cancel();
    optimizerRun.current = undefined;
    setOptimizedPreview(undefined);
    setBuildGoalStatus({ kind: "idle" });
    setAllocationPlan((current) => {
      const currentPlanHasState = allocationPlanHasVisibleState(current);
      const currentPlanIsValid = allocationPlanNodeIds(current).every((nodeId) => visibleGraph.nodes[nodeId]);
      if (currentPlanHasState && currentPlanIsValid) return current;
      return emptyAllocationPlanForStart(pathStartNodeId && visibleGraph.nodes[pathStartNodeId] ? pathStartNodeId : undefined);
    });
  }, [pathStartNodeId, visibleGraph.nodes]);

  useEffect(() => {
    setBuildGoalNodeIds((current) => {
      const next = current.filter((nodeId) => {
        const node = visibleGraph.nodes[nodeId];
        return node && canAddBuildGoal(node, { allowAnyPassive: true });
      });
      return next.length === current.length ? current : next;
    });
  }, [visibleGraph.nodes]);

  useEffect(() => {
    if (selectedNodeId && !visibleGraph.nodes[selectedNodeId]) {
      setSelectedNodeId(undefined);
    }
    if (searchFocusedNodeId && !visibleGraph.nodes[searchFocusedNodeId]) {
      setSearchFocusedNodeId(undefined);
    }
    if (hoverPreviewTargetNodeId && !visibleGraph.nodes[hoverPreviewTargetNodeId]) {
      setHoverPreviewTargetNodeId(undefined);
    }
  }, [hoverPreviewTargetNodeId, searchFocusedNodeId, selectedNodeId, visibleGraph.nodes]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Control") return;
      setGoalShortcutActive(true);
      setHoverPreviewTargetNodeId(undefined);
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key !== "Control") return;
      setGoalShortcutActive(false);
    }

    function handleWindowBlur() {
      setGoalShortcutActive(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  useEffect(() => () => {
    optimizerRun.current?.cancel();
  }, []);

  useEffect(() => () => {
    if (savedBuildStatusTimeoutId.current !== undefined) {
      window.clearTimeout(savedBuildStatusTimeoutId.current);
    }
  }, []);

  useEffect(() => {
    fetch(publicAssetPath("tree-graph.json"))
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((loaded: TreeGraph) => {
        setGraph(loaded);
        setGraphLoadStatus("loaded");
      })
      .catch(() => {
        setGraph(sampleGraph);
        setGraphLoadStatus("fallback");
      });
  }, []);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="top-brand">
          <h1>PoE2 Tree Optimizer for Boomslang</h1>
          <div className="brand-support">
            <span className="tree-data-version" aria-label="Tree data version">
              Tree data: {treeDataVersionLabel}
            </span>
            <div className="site-help">
              <button
                className="site-help-trigger"
                type="button"
                aria-describedby="site-help-tooltip"
              >
                How to use the site
              </button>
              <div
                id="site-help-tooltip"
                className="site-help-tooltip"
                role="tooltip"
                aria-label="Site usage help"
              >
                <strong>Quick controls</strong>
                <ul>
                  <li>Ctrl + left click a node to add or remove it from Build goals.</li>
                  <li>Click nodes on the tree to preview allocation paths, then apply the path from the node inspector.</li>
                  <li>Use Passive search to find passives, add one result, or add all matching nodes with the same effect.</li>
                  <li>Import PoB goals to pull build goals from a Path of Building code.</li>
                  <li>Optimize route previews the shortest route through current Build goals; Apply optimized route commits it.</li>
                  <li>Check Hover path preview to see routes while hovering unallocated nodes.</li>
                  <li>Use Path start for class or ascendancy start, Node size for visibility, and Reset allocation to clear selected nodes.</li>
                  <li>Use New build, Save build, the build dropdown, and Delete build to manage saved trees in this browser.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="top-controls">
          <div className="header-control-group saved-build-control" role="group" aria-label="Build management">
            <label className="saved-build-select-control">
              Build{" "}
              <ControlTooltip id="saved-build-tooltip" text="Load a saved build stored in this browser.">
                <select
                  aria-label="Saved build"
                  aria-describedby="saved-build-tooltip"
                  value={selectedSavedBuildId}
                  onChange={(event) => loadSavedBuild(event.currentTarget.value)}
                >
                  <option value="">Unsaved build</option>
                  {savedBuilds.map((build) => (
                    <option key={build.id} value={build.id}>{build.name}</option>
                  ))}
                </select>
              </ControlTooltip>
            </label>
            <label className="saved-build-name-control">
              Name{" "}
              <ControlTooltip id="build-name-tooltip" text="Name used when saving the current build.">
                <input
                  aria-label="Build name"
                  aria-describedby="build-name-tooltip"
                  value={savedBuildName}
                  onChange={(event) => setSavedBuildName(event.currentTarget.value)}
                  placeholder="Build name"
                />
              </ControlTooltip>
            </label>
            <ControlTooltip id="new-build-tooltip" text="Start a new unsaved build without deleting saved builds.">
              <button
                className="tool-button saved-build-button"
                type="button"
                aria-label="New build"
                aria-describedby="new-build-tooltip"
                onClick={() => newUnsavedBuild()}
              >
                New
              </button>
            </ControlTooltip>
            <ControlTooltip id="save-build-tooltip" text="Save the current build name, path, goals, and settings.">
              <button
                className="tool-button saved-build-button"
                type="button"
                aria-label="Save build"
                aria-describedby="save-build-tooltip"
                onClick={saveCurrentBuild}
                disabled={!canSaveCurrentBuild}
              >
                Save
              </button>
            </ControlTooltip>
            <ControlTooltip id="delete-build-tooltip" text="Delete the selected saved build from this browser.">
              <button
                className="tool-button saved-build-button"
                type="button"
                aria-label="Delete build"
                aria-describedby="delete-build-tooltip"
                onClick={deleteSelectedBuild}
                disabled={!selectedSavedBuild}
              >
                Delete
              </button>
            </ControlTooltip>
          </div>
          <div className="header-control-group tree-setup-control" role="group" aria-label="Tree setup">
            <label className="path-start-control">
              Path start{" "}
              <ControlTooltip id="path-start-tooltip" text="Choose the class or ascendancy start used for pathing.">
                <select
                  aria-label="Path start"
                  aria-describedby="path-start-tooltip"
                  value={selectedClassStartId ?? ""}
                  onChange={(event) => changeSelectedClassStart(event.currentTarget.value)}
                >
                  {classStartOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </ControlTooltip>
            </label>
            <label className="node-size-control">
              Node size{" "}
              <ControlTooltip id="node-size-tooltip" text="Scale passive node icons in the tree viewer.">
                <select
                  aria-label="Node size"
                  aria-describedby="node-size-tooltip"
                  value={nodeVisualScale}
                  onChange={(event) => setNodeVisualScale(Number(event.currentTarget.value))}
                >
                  {nodeVisualScaleOptions.map((scale) => (
                    <option key={scale} value={scale}>{scale}x</option>
                  ))}
                </select>
              </ControlTooltip>
            </label>
            <label className="hover-preview-control">
              <ControlTooltip id="hover-preview-tooltip" text="Show a temporary path preview while hovering unallocated nodes.">
                <input
                  type="checkbox"
                  aria-label="Hover path preview"
                  aria-describedby="hover-preview-tooltip"
                  checked={hoverPathPreviewEnabled}
                  onChange={(event) => toggleHoverPathPreview(event.currentTarget.checked)}
                />
              </ControlTooltip>
              Hover preview
            </label>
          </div>
          <div className="header-control-group allocation-control" role="group" aria-label="Allocation summary">
            <div className="allocation-counts">
              <ControlTooltip id="allocated-count-tooltip" text="Current committed main tree passive points out of 123.">
                <span className="allocation-count-row" aria-describedby="allocated-count-tooltip">
                  {formatAllocatedPointCount(allocatedPointCount)}
                </span>
              </ControlTooltip>
              <span className="allocation-count-row">
                {selectedAscendancy ? formatAscendancyPointCount(activeAscendancyPointCount) : "\u00a0"}
              </span>
            </div>
            <ControlTooltip id="reset-allocation-tooltip" text="Clear committed allocation and the current preview path.">
              <button
                className="tool-button"
                type="button"
                aria-label="Reset allocation"
                aria-describedby="reset-allocation-tooltip"
                onClick={resetAllocation}
                disabled={!canResetAllocation}
              >
                Reset
              </button>
            </ControlTooltip>
          </div>
        </div>
        {savedBuildStatus ? (
          <div
            key={savedBuildStatusFeedbackKey}
            className="saved-build-toast"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-feedback-key={savedBuildStatusFeedbackKey}
          >
            {savedBuildStatus}
          </div>
        ) : null}
      </header>
      {graphLoadStatus === "fallback" ? (
        <div className="data-warning" role="status">
          <strong>Real tree data is unavailable.</strong>
          <span>Using the sample fixture tree. Run npm run prepare-data before building or serving the full tool.</span>
        </div>
      ) : null}
      <section className="workspace">
        <BuildSummaryPanel summary={buildSummaryData} />
        <section
          className={`tree-viewer-shell${graphLoadStatus === "loading" ? " tree-viewer-shell-loading" : ""}`}
          role="region"
          aria-label="Passive tree viewer"
          aria-busy={graphLoadStatus === "loading"}
        >
          {graphLoadStatus === "loading" ? (
            <div className="tree-loading-state">
              Loading passive tree...
            </div>
          ) : null}
          <TreeViewer
            graph={visibleGraph}
            selectedNodeId={selectedNodeId}
            pathStartNodeId={pathStartNodeId}
            pathStartClassName={selectedClassStartOption?.className}
            activeAscendancyId={selectedAscendancy?.id}
            noAllocationPathNodeId={noAllocationPathNodeId}
            nodeVisualScale={nodeVisualScale}
            searchMatchNodeIds={searchMatchNodeIds}
            searchFocusedNodeId={searchFocusedNodeId}
            buildGoalNodeIds={buildGoalNodeIdSet}
            allocatedNodeIds={displayAllocatedNodeIds}
            allocatedEdgeKeys={displayAllocatedEdgeKeys}
            allocationPathNodeIds={allocationPathNodeIds}
            allocationPathEdgeKeys={allocationPathEdgeKeys}
            hoverAllocationPathNodeIds={hoverAllocationPathNodeIds}
            hoverAllocationPathEdgeKeys={hoverAllocationPathEdgeKeys}
            onSelectNode={selectTreeNode}
            onAddBuildGoal={toggleMapBuildGoal}
            onHoverNode={updateHoverPreviewTarget}
            debug={debugOverlayOff}
          />
        </section>
        <div className="side-panel">
          <PassiveSearchPanel
            query={searchQuery}
            results={searchResultsWithAllocationDistance}
            selectedNodeId={selectedNodeId}
            buildGoalNodeIds={buildGoalNodeIdSet}
            onQueryChange={updateSearchQuery}
            onSelectNode={selectTreeNode}
            onHoverNode={setSearchFocusedNodeId}
            canAddBuildGoal={isBuildGoalableNode}
            onAddBuildGoal={addBuildGoal}
            canAddMatchingBuildGoal={(node) => canAddBuildGoal(node, { allowAnyPassive: true })}
            onAddMatchingBuildGoals={addMatchingBuildGoals}
          />
          <BuildGoalsPanel
            goals={buildGoalPanelGoals}
            status={buildGoalStatus}
            pobImportCode={pobImportCode}
            pobImportStatus={pobImportStatus}
            canApplyOptimizedRoute={Boolean(optimizedPreview && optimizedPreview.pointCost > 0)}
            routeCandidateCount={optimizedPreview?.routeCandidates?.length ?? 0}
            selectedRouteIndex={optimizedRouteIndex}
            onPobImportCodeChange={setPobImportCode}
            onImportPobBuildGoals={importPobBuildGoals}
            onRemoveGoal={removeBuildGoal}
            onClearGoals={clearBuildGoals}
            onOptimize={optimizeBuildGoalsRoute}
            onCancel={cancelBuildGoalsOptimization}
            onApplyOptimizedRoute={applyOptimizedRoute}
            onPreviousRoute={() => selectOptimizedRoute(optimizedRouteIndex - 1)}
            onNextRoute={() => selectOptimizedRoute(optimizedRouteIndex + 1)}
          />
          <NodeInspector
            node={selectedNode}
            edges={visibleGraph.edges}
            allocationPath={allocationPath}
            allocationPathNodeNames={allocationPathNodeNames}
            pathStartName={currentPathEndpointNodeId ? visibleGraph.nodes[currentPathEndpointNodeId]?.name : undefined}
            canAllocatePath={allocationPlan.previewNodePath.length > 0 && (allocationPath?.pointCost ?? 0) > 0}
            onAllocatePath={allocatePreviewPath}
            canAddBuildGoal={selectedNode ? isBuildGoalableNode(selectedNode) : false}
            isBuildGoal={selectedNodeId ? buildGoalNodeIdSet.has(selectedNodeId) : false}
            onAddBuildGoal={selectedNodeId ? () => addBuildGoal(selectedNodeId) : undefined}
          />
        </div>
      </section>
    </main>
  );
}

function formatAllocatedPointCount(pointCount: number): string {
  return `Allocated ${pointCount}/${maxPassiveAllocationPointCount}`;
}

function formatAscendancyPointCount(pointCount: number): string {
  return `Ascendancy ${pointCount}/${maxAscendancyAllocationCount}`;
}

function resolveSavedClassStartOption(
  state: SavedBuildState,
  options: ClassStartOption[],
): ClassStartOption | undefined {
  return (state.selectedClassStartId
    ? options.find((option) => option.id === state.selectedClassStartId)
    : undefined)
    ?? (state.pathStartNodeId
      ? options.find((option) => option.nodeId === state.pathStartNodeId)
      : undefined)
    ?? options[0];
}

function validNodeVisualScale(scale: number): number {
  return nodeVisualScaleOptions.some((option) => option === scale) ? scale : defaultNodeVisualScale;
}

function compareAllocationDistances(left: number | undefined, right: number | undefined): number {
  return allocationDistanceSortValue(left) - allocationDistanceSortValue(right);
}

function allocationDistanceSortValue(distance: number | undefined): number {
  return distance ?? Number.POSITIVE_INFINITY;
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

function isBuildGoalableNode(node: TreeNode): boolean {
  return Boolean(node.flags.notable || node.flags.keystone || node.flags.jewelSocket);
}

function canAddBuildGoal(node: TreeNode, options: { allowAnyPassive?: boolean }): boolean {
  if (options.allowAnyPassive) {
    return !node.flags.classStart;
  }
  return isBuildGoalableNode(node);
}

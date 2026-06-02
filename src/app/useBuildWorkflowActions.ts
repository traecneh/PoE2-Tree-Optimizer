import { useCallback, type Dispatch, type SetStateAction } from "react";
import { resolveClassStartOptionFromPobMetadata, type ClassStartOption } from "../tree/classStartAliases";
import { importBuildGoalsFromPobCode } from "../tree/pobBuildImport";
import type { SavedBuild } from "../tree/savedBuilds";
import type { TreeGraph } from "../tree/types";
import type { PobBuildImportStatus } from "../viewer/BuildGoalsPanel";
import { mergeNodeIds, sanitizeSavedAllocationPlan, type AllocationPlan } from "./allocationPlan";
import { sanitizeAscendancyAllocationNodeIds } from "./ascendancyAllocation";
import {
  buildPobImportReportDetails,
  pobPathStartStatus,
} from "./pobImportStatus";
import {
  canAddBuildGoal,
  resolveSavedClassStartOption,
  validNodeVisualScale,
} from "./buildWorkflow";

type UseBuildWorkflowActionsOptions = {
  graph: TreeGraph;
  visibleGraph: TreeGraph;
  classStartOptions: ClassStartOption[];
  selectedClassStartOption: ClassStartOption | undefined;
  setSelectedClassStartId: Dispatch<SetStateAction<string | undefined>>;
  pathStartNodeId: string | undefined;
  setPathStartNodeId: Dispatch<SetStateAction<string | undefined>>;
  allocationPlan: AllocationPlan;
  setAllocationPlan: Dispatch<SetStateAction<AllocationPlan>>;
  resetAllocationPlan: (pathStartNodeId: string | undefined) => void;
  nodeVisualScaleOptions: readonly number[];
  defaultNodeVisualScale: number;
  setNodeVisualScale: Dispatch<SetStateAction<number>>;
  buildGoalNodeIds: string[];
  buildGoalNodeIdSet: ReadonlySet<string>;
  setBuildGoalNodeIds: Dispatch<SetStateAction<string[]>>;
  addBuildGoalNodeId: (nodeId: string) => void;
  addBuildGoalNodeIds: (nodeIds: string[]) => void;
  removeBuildGoalNodeId: (nodeId: string) => void;
  clearBuildGoalNodeIds: () => void;
  activeAscendancyAllocationNodeIds: string[];
  setAscendancyAllocationNodeIds: Dispatch<SetStateAction<string[]>>;
  resetAscendancyAllocation: () => void;
  clearOptimizedRouteState: () => void;
  pobImportCode: string;
  setPobImportStatus: Dispatch<SetStateAction<PobBuildImportStatus>>;
  clearPobImport: () => void;
  clearPobImportStatus: () => void;
  selectSavedBuild: (buildId: string) => SavedBuild | undefined;
  markNewUnsavedBuild: (nextStatus?: string) => void;
  deleteSelectedSavedBuild: () => SavedBuild | undefined;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSearchFocusedNodeId: Dispatch<SetStateAction<string | undefined>>;
  clearTreeInteractionState: () => void;
};

export function useBuildWorkflowActions({
  graph,
  visibleGraph,
  classStartOptions,
  selectedClassStartOption,
  setSelectedClassStartId,
  pathStartNodeId,
  setPathStartNodeId,
  allocationPlan,
  setAllocationPlan,
  resetAllocationPlan,
  nodeVisualScaleOptions,
  defaultNodeVisualScale,
  setNodeVisualScale,
  buildGoalNodeIds,
  buildGoalNodeIdSet,
  setBuildGoalNodeIds,
  addBuildGoalNodeId,
  addBuildGoalNodeIds,
  removeBuildGoalNodeId,
  clearBuildGoalNodeIds,
  activeAscendancyAllocationNodeIds,
  setAscendancyAllocationNodeIds,
  resetAscendancyAllocation,
  clearOptimizedRouteState,
  pobImportCode,
  setPobImportStatus,
  clearPobImport,
  clearPobImportStatus,
  selectSavedBuild,
  markNewUnsavedBuild,
  deleteSelectedSavedBuild,
  setSearchQuery,
  setSearchFocusedNodeId,
  clearTreeInteractionState,
}: UseBuildWorkflowActionsOptions) {
  const canResetAllocation = allocationPointCount(allocationPlan.committedNodePath) > 0
    || activeAscendancyAllocationNodeIds.length > 0
    || allocationPlan.previewNodePath.length > 0
    || allocationPlan.previewEdgeKeys.length > 0
    || allocationPlan.previewRouteNodePath.length > 0
    || Boolean(allocationPlan.noAllocationPathNodeId);

  const resetAllocation = useCallback(() => {
    clearOptimizedRouteState();
    resetAscendancyAllocation();
    resetAllocationPlan(pathStartNodeId);
  }, [clearOptimizedRouteState, pathStartNodeId, resetAllocationPlan, resetAscendancyAllocation]);

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchFocusedNodeId(undefined);
  }, [setSearchFocusedNodeId, setSearchQuery]);

  const applyClassStartOption = useCallback((option: ClassStartOption) => {
    clearOptimizedRouteState();
    clearTreeInteractionState();
    setSelectedClassStartId(option.id);
    setPathStartNodeId(option.nodeId);
    resetAscendancyAllocation();
    resetAllocationPlan(option.nodeId);
  }, [
    clearOptimizedRouteState,
    clearTreeInteractionState,
    resetAllocationPlan,
    resetAscendancyAllocation,
    setPathStartNodeId,
    setSelectedClassStartId,
  ]);

  const changeSelectedClassStart = useCallback((classStartId: string) => {
    const option = classStartOptions.find((currentOption) => currentOption.id === classStartId);
    if (option) applyClassStartOption(option);
  }, [applyClassStartOption, classStartOptions]);

  const clearWorkingBuildState = useCallback(() => {
    clearOptimizedRouteState();
    clearPobImport();
    setSearchQuery("");
    setSearchFocusedNodeId(undefined);
    clearTreeInteractionState();
    setBuildGoalNodeIds([]);
    resetAscendancyAllocation();
    resetAllocationPlan(pathStartNodeId);
  }, [
    clearOptimizedRouteState,
    clearPobImport,
    clearTreeInteractionState,
    pathStartNodeId,
    resetAllocationPlan,
    resetAscendancyAllocation,
    setBuildGoalNodeIds,
    setSearchFocusedNodeId,
    setSearchQuery,
  ]);

  const loadSavedBuild = useCallback((buildId: string) => {
    const build = selectSavedBuild(buildId);
    if (!build) return;

    clearOptimizedRouteState();
    clearPobImport();
    setSearchQuery("");
    setSearchFocusedNodeId(undefined);
    clearTreeInteractionState();

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
    setNodeVisualScale(validNodeVisualScale(build.state.nodeVisualScale, nodeVisualScaleOptions, defaultNodeVisualScale));
    setBuildGoalNodeIds(build.state.buildGoalNodeIds.filter((nodeId) => {
      const node = graph.nodes[nodeId];
      return node && canAddBuildGoal(node, { allowAnyPassive: true });
    }));
  }, [
    classStartOptions,
    clearOptimizedRouteState,
    clearPobImport,
    clearTreeInteractionState,
    defaultNodeVisualScale,
    graph,
    nodeVisualScaleOptions,
    selectSavedBuild,
    setAllocationPlan,
    setAscendancyAllocationNodeIds,
    setBuildGoalNodeIds,
    setNodeVisualScale,
    setPathStartNodeId,
    setSearchFocusedNodeId,
    setSearchQuery,
    setSelectedClassStartId,
  ]);

  const newUnsavedBuild = useCallback((nextStatus = "New unsaved build") => {
    clearWorkingBuildState();
    markNewUnsavedBuild(nextStatus);
  }, [clearWorkingBuildState, markNewUnsavedBuild]);

  const deleteSelectedBuild = useCallback(() => {
    const deletedBuild = deleteSelectedSavedBuild();
    if (!deletedBuild) return;
    clearWorkingBuildState();
  }, [clearWorkingBuildState, deleteSelectedSavedBuild]);

  const addBuildGoal = useCallback((nodeId: string, options: { allowAnyPassive?: boolean } = {}) => {
    const node = visibleGraph.nodes[nodeId];
    if (!node || !canAddBuildGoal(node, options)) return;
    clearPobImportStatus();
    addBuildGoalNodeId(nodeId);
  }, [addBuildGoalNodeId, clearPobImportStatus, visibleGraph.nodes]);

  const addMatchingBuildGoals = useCallback((nodeIds: string[]) => {
    const addableNodeIds = nodeIds.filter((nodeId) => {
      const node = visibleGraph.nodes[nodeId];
      return node && canAddBuildGoal(node, { allowAnyPassive: true });
    });
    if (addableNodeIds.length === 0) return;

    clearPobImportStatus();
    addBuildGoalNodeIds(addableNodeIds);
  }, [addBuildGoalNodeIds, clearPobImportStatus, visibleGraph.nodes]);

  const removeBuildGoal = useCallback((nodeId: string) => {
    clearPobImportStatus();
    removeBuildGoalNodeId(nodeId);
  }, [clearPobImportStatus, removeBuildGoalNodeId]);

  const toggleMapBuildGoal = useCallback((nodeId: string) => {
    if (buildGoalNodeIdSet.has(nodeId)) {
      removeBuildGoal(nodeId);
      return;
    }

    addBuildGoal(nodeId, { allowAnyPassive: true });
  }, [addBuildGoal, buildGoalNodeIdSet, removeBuildGoal]);

  const clearBuildGoals = useCallback(() => {
    clearPobImportStatus();
    clearBuildGoalNodeIds();
  }, [clearBuildGoalNodeIds, clearPobImportStatus]);

  const importPobBuildGoals = useCallback(() => {
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
  }, [
    applyClassStartOption,
    buildGoalNodeIds,
    classStartOptions,
    clearOptimizedRouteState,
    graph,
    pobImportCode,
    selectedClassStartOption,
    setAscendancyAllocationNodeIds,
    setBuildGoalNodeIds,
    setPobImportStatus,
  ]);

  return {
    canResetAllocation,
    resetAllocation,
    updateSearchQuery,
    changeSelectedClassStart,
    loadSavedBuild,
    clearWorkingBuildState,
    newUnsavedBuild,
    deleteSelectedBuild,
    addBuildGoal,
    addMatchingBuildGoals,
    toggleMapBuildGoal,
    removeBuildGoal,
    clearBuildGoals,
    importPobBuildGoals,
  };
}

function allocationPointCount(committedNodePath: string[]): number {
  return Math.max(0, committedNodePath.length - 1);
}

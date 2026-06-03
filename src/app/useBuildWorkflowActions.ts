import type { Dispatch, SetStateAction } from "react";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { SavedBuild } from "../tree/savedBuilds";
import type { TreeGraph } from "../tree/types";
import type { PobBuildImportStatus } from "../viewer/BuildGoalsPanel";
import type { AllocationPlan } from "./allocationPlan";
import { useBuildGoalActions } from "./useBuildGoalActions";
import { useClassStartAllocationActions } from "./useClassStartAllocationActions";
import { usePobImportWorkflow } from "./usePobImportWorkflow";
import { useSavedBuildWorkflow } from "./useSavedBuildWorkflow";

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
  const {
    canResetAllocation,
    resetAllocation,
    applyClassStartOption,
    changeSelectedClassStart,
  } = useClassStartAllocationActions({
    allocationPlan,
    activeAscendancyAllocationNodeIds,
    classStartOptions,
    pathStartNodeId,
    setSelectedClassStartId,
    setPathStartNodeId,
    resetAllocationPlan,
    resetAscendancyAllocation,
    clearOptimizedRouteState,
    clearTreeInteractionState,
  });

  const {
    clearWorkingBuildState,
    loadSavedBuild,
    newUnsavedBuild,
    deleteSelectedBuild,
  } = useSavedBuildWorkflow({
    graph,
    classStartOptions,
    pathStartNodeId,
    setSelectedClassStartId,
    setPathStartNodeId,
    setAllocationPlan,
    resetAllocationPlan,
    nodeVisualScaleOptions,
    defaultNodeVisualScale,
    setNodeVisualScale,
    setBuildGoalNodeIds,
    setAscendancyAllocationNodeIds,
    resetAscendancyAllocation,
    clearOptimizedRouteState,
    clearPobImport,
    selectSavedBuild,
    markNewUnsavedBuild,
    deleteSelectedSavedBuild,
    setSearchQuery,
    setSearchFocusedNodeId,
    clearTreeInteractionState,
  });

  const {
    updateSearchQuery,
    addBuildGoal,
    addMatchingBuildGoals,
    toggleMapBuildGoal,
    removeBuildGoal,
    clearBuildGoals,
  } = useBuildGoalActions({
    visibleGraph,
    buildGoalNodeIdSet,
    addBuildGoalNodeId,
    addBuildGoalNodeIds,
    removeBuildGoalNodeId,
    clearBuildGoalNodeIds,
    clearPobImportStatus,
    setSearchQuery,
    setSearchFocusedNodeId,
  });

  const { importPobBuildGoals } = usePobImportWorkflow({
    graph,
    classStartOptions,
    selectedClassStartOption,
    buildGoalNodeIds,
    setBuildGoalNodeIds,
    pobImportCode,
    setAscendancyAllocationNodeIds,
    setPobImportStatus,
    applyClassStartOption,
    clearOptimizedRouteState,
  });

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

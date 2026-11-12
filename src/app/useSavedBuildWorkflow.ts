import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { OptimizedRouteChoice } from "../tree/optimizedRouteChoice";
import {
  defaultPassiveOptimizationSettings,
  normalizePassiveOptimizationSettings,
  type PassiveOptimizationSettings,
} from "../tree/passivePreferences";
import type { SavedBuild } from "../tree/savedBuilds";
import type { TreeGraph } from "../tree/types";
import { sanitizeSavedAllocationPlan, type AllocationPlan } from "./allocationPlan";
import { deriveWeaponAttachments } from "../tree/allocationConstraints";
import { sanitizeAscendancyAllocationNodeIds } from "./ascendancyAllocation";
import {
  canAddBuildGoal,
  resolveSavedClassStartOption,
  validNodeVisualScale,
} from "./buildWorkflow";
import {
  emptyWeaponSetAllocations,
  sanitizeWeaponSetAllocations,
  type AllocationMode,
  type WeaponSetAllocationNodeIds,
} from "./weaponSetAllocation";

type UseSavedBuildWorkflowOptions = {
  graph: TreeGraph;
  classStartOptions: ClassStartOption[];
  pathStartNodeId: string | undefined;
  setSelectedClassStartId: Dispatch<SetStateAction<string | undefined>>;
  setPathStartNodeId: Dispatch<SetStateAction<string | undefined>>;
  setAllocationPlan: Dispatch<SetStateAction<AllocationPlan>>;
  resetAllocationPlan: (pathStartNodeId: string | undefined) => void;
  nodeVisualScaleOptions: readonly number[];
  defaultNodeVisualScale: number;
  setNodeVisualScale: Dispatch<SetStateAction<number>>;
  setActiveAllocationMode: Dispatch<SetStateAction<AllocationMode>>;
  setWeaponSetAllocationNodeIds: Dispatch<SetStateAction<WeaponSetAllocationNodeIds>>;
  setWeaponSetAttachmentNodeIds?: Dispatch<SetStateAction<string[]>>;
  setBuildGoalNodeIds: Dispatch<SetStateAction<string[]>>;
  setAscendancyAllocationNodeIds: Dispatch<SetStateAction<string[]>>;
  setAppliedOptimizedRouteChoice: Dispatch<SetStateAction<OptimizedRouteChoice | undefined>>;
  restoreOptimizerSettings?: (settings: PassiveOptimizationSettings) => void;
  resetAscendancyAllocation: () => void;
  clearOptimizedRouteState: () => void;
  clearPobImport: () => void;
  selectSavedBuild: (buildId: string) => SavedBuild | undefined;
  markNewUnsavedBuild: (nextStatus?: string) => void;
  deleteSelectedSavedBuild: () => SavedBuild | undefined;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSearchFocusedNodeId: Dispatch<SetStateAction<string | undefined>>;
  clearTreeInteractionState: () => void;
};

export function useSavedBuildWorkflow({
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
  setActiveAllocationMode,
  setWeaponSetAllocationNodeIds,
  setWeaponSetAttachmentNodeIds,
  setBuildGoalNodeIds,
  setAscendancyAllocationNodeIds,
  setAppliedOptimizedRouteChoice,
  restoreOptimizerSettings,
  resetAscendancyAllocation,
  clearOptimizedRouteState,
  clearPobImport,
  selectSavedBuild,
  markNewUnsavedBuild,
  deleteSelectedSavedBuild,
  setSearchQuery,
  setSearchFocusedNodeId,
  clearTreeInteractionState,
}: UseSavedBuildWorkflowOptions) {
  const clearWorkingBuildState = useCallback(() => {
    clearOptimizedRouteState();
    clearPobImport();
    setSearchQuery("");
    setSearchFocusedNodeId(undefined);
    clearTreeInteractionState();
    setBuildGoalNodeIds([]);
    setActiveAllocationMode("main");
    setWeaponSetAllocationNodeIds(emptyWeaponSetAllocations());
    setWeaponSetAttachmentNodeIds?.([]);
    setAppliedOptimizedRouteChoice(undefined);
    restoreOptimizerSettings?.(defaultPassiveOptimizationSettings());
    resetAscendancyAllocation();
    resetAllocationPlan(pathStartNodeId);
  }, [
    clearOptimizedRouteState,
    clearPobImport,
    clearTreeInteractionState,
    pathStartNodeId,
    resetAllocationPlan,
    resetAscendancyAllocation,
    restoreOptimizerSettings,
    setAppliedOptimizedRouteChoice,
    setActiveAllocationMode,
    setBuildGoalNodeIds,
    setWeaponSetAllocationNodeIds,
    setWeaponSetAttachmentNodeIds,
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
    setActiveAllocationMode(build.state.activeAllocationMode);
    setWeaponSetAllocationNodeIds(sanitizeWeaponSetAllocations(build.state.weaponSetAllocationNodeIds, graph));
    setWeaponSetAttachmentNodeIds?.(build.state.weaponSetAttachmentNodeIds ?? deriveWeaponAttachments(graph,
      build.state.allocationPlan.previewNodePath.length ? build.state.allocationPlan.previewNodePath : build.state.allocationPlan.committedNodePath,
      sanitizeWeaponSetAllocations(build.state.weaponSetAllocationNodeIds, graph), nextPathStartNodeId));
    setBuildGoalNodeIds(build.state.buildGoalNodeIds.filter((nodeId) => {
      const node = graph.nodes[nodeId];
      return node && canAddBuildGoal(node, { allowAnyPassive: true });
    }));
    setAppliedOptimizedRouteChoice(build.state.optimizedRouteChoice);
    restoreOptimizerSettings?.(normalizePassiveOptimizationSettings(build.state.optimizerSettings));
  }, [
    classStartOptions,
    clearOptimizedRouteState,
    clearPobImport,
    clearTreeInteractionState,
    defaultNodeVisualScale,
    graph,
    nodeVisualScaleOptions,
    restoreOptimizerSettings,
    selectSavedBuild,
    setAllocationPlan,
    setAscendancyAllocationNodeIds,
    setAppliedOptimizedRouteChoice,
    setActiveAllocationMode,
    setBuildGoalNodeIds,
    setNodeVisualScale,
    setPathStartNodeId,
    setSearchFocusedNodeId,
    setSearchQuery,
    setSelectedClassStartId,
    setWeaponSetAllocationNodeIds,
    setWeaponSetAttachmentNodeIds,
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

  return {
    clearWorkingBuildState,
    loadSavedBuild,
    newUnsavedBuild,
    deleteSelectedBuild,
  };
}

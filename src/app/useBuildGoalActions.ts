import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { TreeGraph } from "../tree/types";
import { canAddBuildGoal } from "./buildWorkflow";

type UseBuildGoalActionsOptions = {
  visibleGraph: TreeGraph;
  buildGoalNodeIdSet: ReadonlySet<string>;
  addBuildGoalNodeId: (nodeId: string) => void;
  addBuildGoalNodeIds: (nodeIds: string[]) => void;
  removeBuildGoalNodeId: (nodeId: string) => void;
  clearBuildGoalNodeIds: () => void;
  clearPobImportStatus: () => void;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSearchFocusedNodeId: Dispatch<SetStateAction<string | undefined>>;
};

export function useBuildGoalActions({
  visibleGraph,
  buildGoalNodeIdSet,
  addBuildGoalNodeId,
  addBuildGoalNodeIds,
  removeBuildGoalNodeId,
  clearBuildGoalNodeIds,
  clearPobImportStatus,
  setSearchQuery,
  setSearchFocusedNodeId,
}: UseBuildGoalActionsOptions) {
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchFocusedNodeId(undefined);
  }, [setSearchFocusedNodeId, setSearchQuery]);

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

  return {
    updateSearchQuery,
    addBuildGoal,
    addMatchingBuildGoals,
    toggleMapBuildGoal,
    removeBuildGoal,
    clearBuildGoals,
  };
}

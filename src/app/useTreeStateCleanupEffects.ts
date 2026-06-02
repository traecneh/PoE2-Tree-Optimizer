import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { TreeGraph } from "../tree/types";
import {
  allocationPlanHasVisibleState,
  allocationPlanNodeIds,
  emptyAllocationPlanForStart,
  type AllocationPlan,
} from "./allocationPlan";
import { canAddBuildGoal } from "./buildWorkflow";

type UseTreeStateCleanupEffectsOptions = {
  visibleGraph: TreeGraph;
  pathStartNodeId: string | undefined;
  setAllocationPlan: Dispatch<SetStateAction<AllocationPlan>>;
  clearOptimizedRouteState: () => void;
  setBuildGoalNodeIds: Dispatch<SetStateAction<string[]>>;
  searchFocusedNodeId: string | undefined;
  setSearchFocusedNodeId: Dispatch<SetStateAction<string | undefined>>;
};

export function useTreeStateCleanupEffects({
  visibleGraph,
  pathStartNodeId,
  setAllocationPlan,
  clearOptimizedRouteState,
  setBuildGoalNodeIds,
  searchFocusedNodeId,
  setSearchFocusedNodeId,
}: UseTreeStateCleanupEffectsOptions) {
  useEffect(() => {
    clearOptimizedRouteState();
    setAllocationPlan((current) => {
      const currentPlanHasState = allocationPlanHasVisibleState(current);
      const currentPlanIsValid = allocationPlanNodeIds(current).every((nodeId) => visibleGraph.nodes[nodeId]);
      if (currentPlanHasState && currentPlanIsValid) return current;
      return emptyAllocationPlanForStart(pathStartNodeId && visibleGraph.nodes[pathStartNodeId] ? pathStartNodeId : undefined);
    });
  }, [clearOptimizedRouteState, pathStartNodeId, setAllocationPlan, visibleGraph.nodes]);

  useEffect(() => {
    setBuildGoalNodeIds((current) => {
      const next = current.filter((nodeId) => {
        const node = visibleGraph.nodes[nodeId];
        return node && canAddBuildGoal(node, { allowAnyPassive: true });
      });
      return next.length === current.length ? current : next;
    });
  }, [setBuildGoalNodeIds, visibleGraph.nodes]);

  useEffect(() => {
    if (searchFocusedNodeId && !visibleGraph.nodes[searchFocusedNodeId]) {
      setSearchFocusedNodeId(undefined);
    }
  }, [searchFocusedNodeId, setSearchFocusedNodeId, visibleGraph.nodes]);
}

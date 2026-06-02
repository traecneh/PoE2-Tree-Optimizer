import { useMemo } from "react";
import { buildSummary } from "../tree/buildSummary";
import type { NodeId, TreeGraph } from "../tree/types";
import type { AllocationPlan } from "./allocationPlan";

type UseAllocationDisplayViewModelOptions = {
  visibleGraph: TreeGraph;
  allocationPlan: AllocationPlan;
  activeAscendancyAllocationNodeIds: string[];
  activeAscendancyAllocationEdgeKeys: string[];
  activeAscendancyPointCostByNodeId: ReadonlyMap<NodeId, number>;
};

export function useAllocationDisplayViewModel({
  visibleGraph,
  allocationPlan,
  activeAscendancyAllocationNodeIds,
  activeAscendancyAllocationEdgeKeys,
  activeAscendancyPointCostByNodeId,
}: UseAllocationDisplayViewModelOptions) {
  const allocatedNodePath = allocationPlan.committedNodePath;
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
  const buildSummaryData = useMemo(
    () => buildSummary(visibleGraph, buildSummaryNodeIds, { pointCostByNodeId: activeAscendancyPointCostByNodeId }),
    [activeAscendancyPointCostByNodeId, buildSummaryNodeIds, visibleGraph],
  );
  const allocatedPointCount = Math.max(0, allocatedNodePath.length - 1);

  return {
    allocatedNodePath,
    allocatedPointCount,
    displayAllocatedNodeIds,
    displayAllocatedEdgeKeys,
    allocationDistanceNodeIds,
    buildSummaryNodeIds,
    currentAllocationEdgeKeys,
    buildSummaryData,
  };
}

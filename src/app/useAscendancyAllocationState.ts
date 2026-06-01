import { useCallback, useEffect, useMemo, useState } from "react";
import type { TreeGraph, TreeNode } from "../tree/types";
import {
  ascendancyAllocatedPointCount,
  ascendancyAllocationEdgeKeys,
  ascendancyPointCostByNodeId,
  sanitizeAscendancyAllocationNodeIds,
  type SelectedAscendancy,
  toggleAscendancyAllocationNodeIds,
} from "./ascendancyAllocation";

export function useAscendancyAllocationState(
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
) {
  const [ascendancyAllocationNodeIds, setAscendancyAllocationNodeIds] = useState<string[]>([]);
  const activeAscendancyAllocationNodeIds = useMemo(
    () => sanitizeAscendancyAllocationNodeIds(ascendancyAllocationNodeIds, graph, selectedAscendancy),
    [ascendancyAllocationNodeIds, graph, selectedAscendancy],
  );
  const activeAscendancyPointCostByNodeId = useMemo(
    () => ascendancyPointCostByNodeId(graph, selectedAscendancy, activeAscendancyAllocationNodeIds),
    [activeAscendancyAllocationNodeIds, graph, selectedAscendancy],
  );
  const activeAscendancyPointCount = useMemo(
    () => ascendancyAllocatedPointCount(graph, selectedAscendancy, activeAscendancyAllocationNodeIds),
    [activeAscendancyAllocationNodeIds, graph, selectedAscendancy],
  );
  const activeAscendancyAllocationEdgeKeys = useMemo(
    () => ascendancyAllocationEdgeKeys(graph, selectedAscendancy, activeAscendancyAllocationNodeIds),
    [activeAscendancyAllocationNodeIds, graph, selectedAscendancy],
  );

  const resetAscendancyAllocation = useCallback(() => {
    setAscendancyAllocationNodeIds([]);
  }, []);

  const toggleAscendancyAllocationNode = useCallback((node: TreeNode) => {
    setAscendancyAllocationNodeIds((current) => (
      toggleAscendancyAllocationNodeIds(node, current, graph, selectedAscendancy)
    ));
  }, [graph, selectedAscendancy]);

  useEffect(() => {
    setAscendancyAllocationNodeIds((current) => {
      const next = sanitizeAscendancyAllocationNodeIds(current, graph, selectedAscendancy);
      return sameNodeIds(next, current) ? current : next;
    });
  }, [graph, selectedAscendancy]);

  return {
    ascendancyAllocationNodeIds,
    setAscendancyAllocationNodeIds,
    activeAscendancyAllocationNodeIds,
    activeAscendancyPointCostByNodeId,
    activeAscendancyPointCount,
    activeAscendancyAllocationEdgeKeys,
    resetAscendancyAllocation,
    toggleAscendancyAllocationNode,
  };
}

function sameNodeIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((nodeId, index) => nodeId === right[index]);
}

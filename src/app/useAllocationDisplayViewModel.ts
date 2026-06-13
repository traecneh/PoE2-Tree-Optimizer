import { useMemo } from "react";
import { buildSummary } from "../tree/buildSummary";
import type { NodeId, TreeGraph } from "../tree/types";
import type { AllocationPlan } from "./allocationPlan";
import {
  allocationModeWeaponSetId,
  weaponSetAllocationEdgeKeys,
  weaponSetBasePassivePointCount,
  weaponSetPointCount,
  type AllocationMode,
  type WeaponSetAllocationNodeIds,
} from "./weaponSetAllocation";

type UseAllocationDisplayViewModelOptions = {
  visibleGraph: TreeGraph;
  allocationPlan: AllocationPlan;
  activeAscendancyAllocationNodeIds: string[];
  activeAscendancyAllocationEdgeKeys: string[];
  activeAscendancyPointCostByNodeId: ReadonlyMap<NodeId, number>;
  activeAllocationMode: AllocationMode;
  weaponSetAllocationNodeIds: WeaponSetAllocationNodeIds;
};

export function useAllocationDisplayViewModel({
  visibleGraph,
  allocationPlan,
  activeAscendancyAllocationNodeIds,
  activeAscendancyAllocationEdgeKeys,
  activeAscendancyPointCostByNodeId,
  activeAllocationMode,
  weaponSetAllocationNodeIds,
}: UseAllocationDisplayViewModelOptions) {
  const allocatedNodePath = allocationPlan.committedNodePath;
  const activeWeaponSetId = allocationModeWeaponSetId(activeAllocationMode);
  const activeWeaponSetNodeIds = activeWeaponSetId ? weaponSetAllocationNodeIds[activeWeaponSetId] : [];
  const weaponSet1EdgeKeys = useMemo(
    () => weaponSetAllocationEdgeKeys(visibleGraph, allocatedNodePath, weaponSetAllocationNodeIds[1]),
    [allocatedNodePath, visibleGraph, weaponSetAllocationNodeIds],
  );
  const weaponSet2EdgeKeys = useMemo(
    () => weaponSetAllocationEdgeKeys(visibleGraph, allocatedNodePath, weaponSetAllocationNodeIds[2]),
    [allocatedNodePath, visibleGraph, weaponSetAllocationNodeIds],
  );
  const activeWeaponSetEdgeKeys = activeWeaponSetId === 1
    ? weaponSet1EdgeKeys
    : activeWeaponSetId === 2 ? weaponSet2EdgeKeys : [];
  const displayAllocatedNodeIds = useMemo(
    () => new Set([...allocatedNodePath, ...activeWeaponSetNodeIds, ...activeAscendancyAllocationNodeIds]),
    [activeAscendancyAllocationNodeIds, activeWeaponSetNodeIds, allocatedNodePath],
  );
  const displayAllocatedEdgeKeys = useMemo(
    () => new Set([...allocationPlan.committedEdgeKeys, ...activeWeaponSetEdgeKeys, ...activeAscendancyAllocationEdgeKeys]),
    [activeAscendancyAllocationEdgeKeys, activeWeaponSetEdgeKeys, allocationPlan.committedEdgeKeys],
  );
  const allocationDistanceNodeIds = useMemo(
    () => new Set(allocationPlan.previewNodePath.length > 0 ? allocationPlan.previewNodePath : allocatedNodePath),
    [allocatedNodePath, allocationPlan.previewNodePath],
  );
  const buildSummaryNodeIds = useMemo(
    () => new Set([...allocationDistanceNodeIds, ...activeWeaponSetNodeIds, ...activeAscendancyAllocationNodeIds]),
    [activeAscendancyAllocationNodeIds, activeWeaponSetNodeIds, allocationDistanceNodeIds],
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
  const mainPassivePointCount = Math.max(0, allocatedNodePath.length - 1);
  const weaponSet1PointCount = weaponSetPointCount(weaponSetAllocationNodeIds[1]);
  const weaponSet2PointCount = weaponSetPointCount(weaponSetAllocationNodeIds[2]);
  const allocatedPointCount = weaponSetBasePassivePointCount(mainPassivePointCount, weaponSetAllocationNodeIds);

  return {
    allocatedNodePath,
    allocatedPointCount,
    mainPassivePointCount,
    weaponSet1PointCount,
    weaponSet2PointCount,
    weaponSet1EdgeKeys,
    weaponSet2EdgeKeys,
    displayAllocatedNodeIds,
    displayAllocatedEdgeKeys,
    allocationDistanceNodeIds,
    buildSummaryNodeIds,
    currentAllocationEdgeKeys,
    buildSummaryData,
  };
}

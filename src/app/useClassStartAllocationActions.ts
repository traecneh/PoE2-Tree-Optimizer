import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { AllocationPlan } from "./allocationPlan";
import { weaponSetPointCount, type WeaponSetAllocationNodeIds } from "./weaponSetAllocation";

type UseClassStartAllocationActionsOptions = {
  allocationPlan: AllocationPlan;
  activeAscendancyAllocationNodeIds: string[];
  classStartOptions: ClassStartOption[];
  pathStartNodeId: string | undefined;
  setSelectedClassStartId: Dispatch<SetStateAction<string | undefined>>;
  setPathStartNodeId: Dispatch<SetStateAction<string | undefined>>;
  resetAllocationPlan: (pathStartNodeId: string | undefined) => void;
  resetAscendancyAllocation: () => void;
  weaponSetAllocationNodeIds?: WeaponSetAllocationNodeIds;
  resetWeaponSetAllocations?: () => void;
  clearOptimizedRouteState: () => void;
  clearTreeInteractionState: () => void;
};

export function useClassStartAllocationActions({
  allocationPlan,
  activeAscendancyAllocationNodeIds,
  classStartOptions,
  pathStartNodeId,
  setSelectedClassStartId,
  setPathStartNodeId,
  resetAllocationPlan,
  resetAscendancyAllocation,
  weaponSetAllocationNodeIds = { 1: [], 2: [] },
  resetWeaponSetAllocations = () => undefined,
  clearOptimizedRouteState,
  clearTreeInteractionState,
}: UseClassStartAllocationActionsOptions) {
  const canResetAllocation = allocationPointCount(allocationPlan.committedNodePath) > 0
    || activeAscendancyAllocationNodeIds.length > 0
    || weaponSetPointCount(weaponSetAllocationNodeIds[1]) > 0
    || weaponSetPointCount(weaponSetAllocationNodeIds[2]) > 0
    || allocationPlan.previewNodePath.length > 0
    || allocationPlan.previewEdgeKeys.length > 0
    || allocationPlan.previewRouteNodePath.length > 0
    || Boolean(allocationPlan.noAllocationPathNodeId);

  const resetAllocation = useCallback(() => {
    clearOptimizedRouteState();
    resetAscendancyAllocation();
    resetWeaponSetAllocations();
    resetAllocationPlan(pathStartNodeId);
  }, [
    clearOptimizedRouteState,
    pathStartNodeId,
    resetAllocationPlan,
    resetAscendancyAllocation,
    resetWeaponSetAllocations,
  ]);

  const applyClassStartOption = useCallback((option: ClassStartOption) => {
    clearOptimizedRouteState();
    clearTreeInteractionState();
    setSelectedClassStartId(option.id);
    setPathStartNodeId(option.nodeId);
    resetAscendancyAllocation();
    resetWeaponSetAllocations();
    resetAllocationPlan(option.nodeId);
  }, [
    clearOptimizedRouteState,
    clearTreeInteractionState,
    resetAllocationPlan,
    resetAscendancyAllocation,
    resetWeaponSetAllocations,
    setPathStartNodeId,
    setSelectedClassStartId,
  ]);

  const changeSelectedClassStart = useCallback((classStartId: string) => {
    const option = classStartOptions.find((currentOption) => currentOption.id === classStartId);
    if (option) applyClassStartOption(option);
  }, [applyClassStartOption, classStartOptions]);

  return {
    canResetAllocation,
    resetAllocation,
    applyClassStartOption,
    changeSelectedClassStart,
  };
}

function allocationPointCount(committedNodePath: string[]): number {
  return Math.max(0, committedNodePath.length - 1);
}

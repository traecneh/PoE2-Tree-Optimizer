import type { ClassStartOption } from "../tree/classStartAliases";
import type { SavedBuildState } from "../tree/savedBuilds";
import type { TreeNode } from "../tree/types";
import { cloneAllocationPlan, type AllocationPlan } from "./allocationPlan";

export type CreateSavedBuildStateOptions = {
  selectedClassStartId: string | undefined;
  pathStartNodeId: string | undefined;
  allocationPlan: AllocationPlan;
  nodeVisualScale: number;
  buildGoalNodeIds: string[];
  ascendancyAllocationNodeIds: string[];
};

export function createSavedBuildState({
  selectedClassStartId,
  pathStartNodeId,
  allocationPlan,
  nodeVisualScale,
  buildGoalNodeIds,
  ascendancyAllocationNodeIds,
}: CreateSavedBuildStateOptions): SavedBuildState {
  return {
    selectedClassStartId,
    pathStartNodeId,
    allocationPlan: cloneAllocationPlan(allocationPlan),
    nodeVisualScale,
    buildGoalNodeIds: [...buildGoalNodeIds],
    ascendancyAllocationNodeIds: [...ascendancyAllocationNodeIds],
  };
}

export function resolveSavedClassStartOption(
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

export function validNodeVisualScale(
  scale: number,
  options: readonly number[],
  fallbackScale: number,
): number {
  return options.some((option) => option === scale) ? scale : fallbackScale;
}

export function isBuildGoalableNode(node: TreeNode): boolean {
  return Boolean(node.flags.notable || node.flags.keystone || node.flags.jewelSocket);
}

export function canAddBuildGoal(node: TreeNode, options: { allowAnyPassive?: boolean }): boolean {
  if (options.allowAnyPassive) {
    return !node.flags.classStart;
  }
  return isBuildGoalableNode(node);
}

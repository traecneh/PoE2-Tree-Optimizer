import type { ClassStartOption } from "../tree/classStartAliases";
import type { OptimizedRouteChoice } from "../tree/optimizedRouteChoice";
import { normalizePassiveOptimizationSettings, type PassiveOptimizationSettings } from "../tree/passivePreferences";
import type { SavedBuildState } from "../tree/savedBuilds";
import type { TreeNode } from "../tree/types";
import { cloneAllocationPlan, type AllocationPlan } from "./allocationPlan";
import {
  cloneWeaponSetAllocations,
  emptyWeaponSetAllocations,
  type AllocationMode,
  type WeaponSetAllocationNodeIds,
} from "./weaponSetAllocation";

export type CreateSavedBuildStateOptions = {
  selectedClassStartId: string | undefined;
  pathStartNodeId: string | undefined;
  allocationPlan: AllocationPlan;
  nodeVisualScale: number;
  buildGoalNodeIds: string[];
  ascendancyAllocationNodeIds: string[];
  activeAllocationMode?: AllocationMode;
  weaponSetAllocationNodeIds?: WeaponSetAllocationNodeIds;
  weaponSetAttachmentNodeIds?: string[];
  optimizedRouteChoice?: OptimizedRouteChoice;
  optimizerSettings?: PassiveOptimizationSettings;
};

export function createSavedBuildState({
  selectedClassStartId,
  pathStartNodeId,
  allocationPlan,
  nodeVisualScale,
  buildGoalNodeIds,
  ascendancyAllocationNodeIds,
  activeAllocationMode = "main",
  weaponSetAllocationNodeIds = emptyWeaponSetAllocations(),
  weaponSetAttachmentNodeIds,
  optimizedRouteChoice,
  optimizerSettings,
}: CreateSavedBuildStateOptions): SavedBuildState {
  return {
    selectedClassStartId,
    pathStartNodeId,
    allocationPlan: cloneAllocationPlan(allocationPlan),
    nodeVisualScale,
    buildGoalNodeIds: [...buildGoalNodeIds],
    ascendancyAllocationNodeIds: [...ascendancyAllocationNodeIds],
    activeAllocationMode,
    weaponSetAllocationNodeIds: cloneWeaponSetAllocations(weaponSetAllocationNodeIds),
    ...(weaponSetAttachmentNodeIds?.length ? { weaponSetAttachmentNodeIds: [...weaponSetAttachmentNodeIds] } : {}),
    optimizedRouteChoice,
    optimizerSettings: normalizePassiveOptimizationSettings(optimizerSettings),
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
  return canAddBuildGoal(node, {});
}

export function canAddBuildGoal(node: TreeNode, options: { allowAnyPassive?: boolean }): boolean {
  if (node.flags.classStart || node.flags.ascendancy || node.flags.mastery) return false;
  return Boolean(options.allowAnyPassive || node.flags.notable || node.flags.keystone || node.flags.jewelSocket);
}

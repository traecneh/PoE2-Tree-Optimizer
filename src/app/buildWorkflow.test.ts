import { describe, expect, it } from "vitest";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { TreeNode } from "../tree/types";
import { emptyAllocationPlanForStart } from "./allocationPlan";
import {
  canAddBuildGoal,
  createSavedBuildState,
  isBuildGoalableNode,
  resolveSavedClassStartOption,
  validNodeVisualScale,
} from "./buildWorkflow";

describe("build workflow helpers", () => {
  it("creates saved build snapshots without sharing mutable arrays", () => {
    const allocationPlan = {
      ...emptyAllocationPlanForStart("start"),
      committedNodePath: ["start", "notable"],
      committedEdgeKeys: ["start::notable"],
    };
    const buildGoalNodeIds = ["notable"];
    const ascendancyAllocationNodeIds = ["ascendancy"];
    const weaponSetAllocationNodeIds = {
      1: ["set-1"],
      2: ["set-2"],
    };
    const optimizedRouteChoice = {
      routeIndex: 2,
      routeNumber: 3,
      routeCount: 4,
      pointCost: 42,
      pointDeltaFromBest: 1,
      pointCostRouteNumber: 1,
      pointCostRouteCount: 2,
    };

    const state = createSavedBuildState({
      selectedClassStartId: "witch",
      pathStartNodeId: "start",
      allocationPlan,
      nodeVisualScale: 3,
      buildGoalNodeIds,
      ascendancyAllocationNodeIds,
      activeAllocationMode: "weapon1",
      weaponSetAllocationNodeIds,
      optimizedRouteChoice,
    });
    allocationPlan.committedNodePath.push("mutated");
    buildGoalNodeIds.push("mutated");
    ascendancyAllocationNodeIds.push("mutated");
    weaponSetAllocationNodeIds[1].push("mutated");

    expect(state.allocationPlan.committedNodePath).toEqual(["start", "notable"]);
    expect(state.buildGoalNodeIds).toEqual(["notable"]);
    expect(state.ascendancyAllocationNodeIds).toEqual(["ascendancy"]);
    expect(state.activeAllocationMode).toBe("weapon1");
    expect(state.weaponSetAllocationNodeIds).toEqual({ 1: ["set-1"], 2: ["set-2"] });
    expect(state.optimizedRouteChoice).toEqual(optimizedRouteChoice);
  });

  it("resolves saved class starts by explicit option, node fallback, then first option", () => {
    const options: ClassStartOption[] = [
      classStartOption("witch", "Witch", "witch_start"),
      classStartOption("sorceress", "Sorceress", "witch_start"),
      classStartOption("ranger", "Ranger", "ranger_start"),
    ];

    expect(resolveSavedClassStartOption({
      selectedClassStartId: "sorceress",
      pathStartNodeId: "witch_start",
      allocationPlan: emptyAllocationPlanForStart("witch_start"),
      nodeVisualScale: 3,
      buildGoalNodeIds: [],
      ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",
      weaponSetAllocationNodeIds: { 1: [], 2: [] },
    }, options)?.id).toBe("sorceress");
    expect(resolveSavedClassStartOption({
      pathStartNodeId: "ranger_start",
      allocationPlan: emptyAllocationPlanForStart("ranger_start"),
      nodeVisualScale: 3,
      buildGoalNodeIds: [],
      ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",
      weaponSetAllocationNodeIds: { 1: [], 2: [] },
    }, options)?.id).toBe("ranger");
    expect(resolveSavedClassStartOption({
      allocationPlan: emptyAllocationPlanForStart(undefined),
      nodeVisualScale: 3,
      buildGoalNodeIds: [],
      ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",
      weaponSetAllocationNodeIds: { 1: [], 2: [] },
    }, options)?.id).toBe("witch");
  });

  it("validates node scale options with a fallback", () => {
    expect(validNodeVisualScale(2, [1, 2, 3], 3)).toBe(2);
    expect(validNodeVisualScale(9, [1, 2, 3], 3)).toBe(3);
  });

  it("allows only goalable nodes unless any passive is explicitly allowed", () => {
    expect(isBuildGoalableNode(treeNode("notable", { notable: true }))).toBe(true);
    expect(isBuildGoalableNode(treeNode("keystone", { keystone: true }))).toBe(true);
    expect(isBuildGoalableNode(treeNode("socket", { jewelSocket: true }))).toBe(true);
    expect(isBuildGoalableNode(treeNode("small", { small: true }))).toBe(false);
    expect(canAddBuildGoal(treeNode("small", { small: true }), { allowAnyPassive: true })).toBe(true);
    expect(canAddBuildGoal(treeNode("start", { classStart: true }), { allowAnyPassive: true })).toBe(false);
  });
});

function classStartOption(id: string, label: string, nodeId: string): ClassStartOption {
  return {
    id,
    label,
    className: label,
    rootClassId: label.toUpperCase(),
    nodeId,
  };
}

function treeNode(id: string, flags: TreeNode["flags"]): TreeNode {
  return {
    id,
    name: id,
    stats: [],
    position: { x: 0, y: 0 },
    flags,
  };
}

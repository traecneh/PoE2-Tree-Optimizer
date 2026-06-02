import { renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import type { TreeGraph } from "../tree/types";
import { emptyAllocationPlanForStart, type AllocationPlan } from "./allocationPlan";
import { useTreeStateCleanupEffects } from "./useTreeStateCleanupEffects";

describe("useTreeStateCleanupEffects", () => {
  it("resets an invalid allocation plan to the visible path start", async () => {
    const { result, clearOptimizedRouteState } = renderCleanupHarness({
      initialAllocationPlan: {
        committedNodePath: ["missing_node"],
        committedEdgeKeys: [],
        previewNodePath: [],
        previewEdgeKeys: [],
        previewRouteNodePath: [],
      },
    });

    await waitFor(() => {
      expect(result.current.allocationPlan.committedNodePath).toEqual(["mercenary_start"]);
    });
    expect(clearOptimizedRouteState).toHaveBeenCalled();
  });

  it("preserves a valid allocation plan", async () => {
    const validPlan: AllocationPlan = {
      committedNodePath: ["mercenary_start", "projectile_damage"],
      committedEdgeKeys: ["mercenary_start::projectile_damage"],
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    };
    const { result } = renderCleanupHarness({ initialAllocationPlan: validPlan });

    await waitFor(() => {
      expect(result.current.allocationPlan).toBe(validPlan);
    });
  });

  it("filters missing and class-start build goals", async () => {
    const { result } = renderCleanupHarness({
      initialBuildGoalNodeIds: [
        "precise_shot",
        "mercenary_start",
        "missing_node",
        "projectile_damage",
      ],
    });

    await waitFor(() => {
      expect(result.current.buildGoalNodeIds).toEqual(["precise_shot", "projectile_damage"]);
    });
  });

  it("clears a focused search node when it is no longer visible", async () => {
    const { result } = renderCleanupHarness({ initialSearchFocusedNodeId: "missing_node" });

    await waitFor(() => {
      expect(result.current.searchFocusedNodeId).toBeUndefined();
    });
  });
});

type CleanupHarnessOptions = {
  visibleGraph?: TreeGraph;
  pathStartNodeId?: string;
  initialAllocationPlan?: AllocationPlan;
  initialBuildGoalNodeIds?: string[];
  initialSearchFocusedNodeId?: string;
};

function renderCleanupHarness({
  visibleGraph = sampleGraph,
  pathStartNodeId = "mercenary_start",
  initialAllocationPlan = emptyAllocationPlanForStart("mercenary_start"),
  initialBuildGoalNodeIds = [],
  initialSearchFocusedNodeId,
}: CleanupHarnessOptions) {
  const clearOptimizedRouteState = vi.fn();
  const { result } = renderHook(() => {
    const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>(initialAllocationPlan);
    const [buildGoalNodeIds, setBuildGoalNodeIds] = useState<string[]>(initialBuildGoalNodeIds);
    const [searchFocusedNodeId, setSearchFocusedNodeId] = useState<string | undefined>(initialSearchFocusedNodeId);

    useTreeStateCleanupEffects({
      visibleGraph,
      pathStartNodeId,
      setAllocationPlan,
      clearOptimizedRouteState,
      setBuildGoalNodeIds,
      searchFocusedNodeId,
      setSearchFocusedNodeId,
    });

    return { allocationPlan, buildGoalNodeIds, searchFocusedNodeId };
  });

  return { result, clearOptimizedRouteState };
}

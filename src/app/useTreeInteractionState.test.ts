import { act, renderHook } from "@testing-library/react";
import { useMemo, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { emptyAllocationPlanForStart, type AllocationPlan } from "./allocationPlan";
import { useTreeInteractionState } from "./useTreeInteractionState";

describe("useTreeInteractionState", () => {
  it("previews and applies allocation paths from the current start", () => {
    const clearOptimizedRouteState = vi.fn();
    const { result } = renderHook(() => {
      const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>(
        emptyAllocationPlanForStart("mercenary_start"),
      );
      return {
        allocationPlan,
        interaction: useTreeInteractionState({
          visibleGraph: sampleGraph,
          allocationPlan,
          setAllocationPlan,
          pathStartNodeId: "mercenary_start",
          allocationDistanceNodeIds: allocationNodes(allocationPlan),
          currentAllocationEdgeKeys: allocationEdges(allocationPlan),
          clearOptimizedRouteState,
        }),
      };
    });

    act(() => {
      result.current.interaction.selectTreeNode("precise_shot");
    });

    expect(clearOptimizedRouteState).toHaveBeenCalledTimes(1);
    expect(result.current.interaction.selectedNodeId).toBe("precise_shot");
    expect(result.current.allocationPlan.previewNodePath).toEqual([
      "mercenary_start",
      "projectile_damage",
      "precise_shot",
    ]);
    expect(result.current.interaction.allocationPath?.pointCost).toBe(2);
    expect(result.current.interaction.allocationPathNodeNames).toEqual([
      "Mercenary",
      "Projectile Damage",
      "Precise Shot",
    ]);
    expect(result.current.interaction.allocationPathNodeIds).toEqual(new Set([
      "mercenary_start",
      "projectile_damage",
      "precise_shot",
    ]));

    act(() => {
      result.current.interaction.allocatePreviewPath();
    });

    expect(clearOptimizedRouteState).toHaveBeenCalledTimes(2);
    expect(result.current.allocationPlan.committedNodePath).toEqual([
      "mercenary_start",
      "projectile_damage",
      "precise_shot",
    ]);
    expect(result.current.allocationPlan.previewNodePath).toEqual([]);
    expect(result.current.allocationPlan.previewRouteNodePath).toEqual([]);
  });

  it("prunes the clicked endpoint and clears its selection marker", () => {
    const { result } = renderHook(() => {
      const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>({
        committedNodePath: ["mercenary_start", "projectile_damage", "precise_shot"],
        committedEdgeKeys: [
          "mercenary_start::projectile_damage",
          "precise_shot::projectile_damage",
        ],
        previewNodePath: [],
        previewEdgeKeys: [],
        previewRouteNodePath: [],
      });
      return {
        allocationPlan,
        interaction: useTreeInteractionState({
          visibleGraph: sampleGraph,
          allocationPlan,
          setAllocationPlan,
          pathStartNodeId: "mercenary_start",
          allocationDistanceNodeIds: allocationNodes(allocationPlan),
          currentAllocationEdgeKeys: allocationEdges(allocationPlan),
          clearOptimizedRouteState: () => undefined,
        }),
      };
    });

    act(() => {
      result.current.interaction.selectTreeNode("precise_shot");
    });

    expect(result.current.allocationPlan.committedNodePath).toEqual([
      "mercenary_start",
      "projectile_damage",
    ]);
    expect(result.current.allocationPlan.committedEdgeKeys).toEqual([
      "mercenary_start::projectile_damage",
    ]);
    expect(result.current.interaction.selectedNodeId).toBeUndefined();
  });

  it("shows hover preview only when enabled and suppresses it while Ctrl is held", () => {
    const { result } = renderHook(() => {
      const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>(
        emptyAllocationPlanForStart("mercenary_start"),
      );
      return useTreeInteractionState({
        visibleGraph: sampleGraph,
        allocationPlan,
        setAllocationPlan,
        pathStartNodeId: "mercenary_start",
        allocationDistanceNodeIds: allocationNodes(allocationPlan),
        currentAllocationEdgeKeys: allocationEdges(allocationPlan),
        clearOptimizedRouteState: () => undefined,
      });
    });

    act(() => {
      result.current.toggleHoverPathPreview(true);
    });
    act(() => {
      result.current.updateHoverPreviewTarget("precise_shot");
    });

    expect(result.current.hoverAllocationPathNodeIds).toEqual(new Set([
      "projectile_damage",
      "precise_shot",
    ]));
    expect(result.current.hoverAllocationPathEdgeKeys).toEqual(new Set([
      "mercenary_start::projectile_damage",
      "precise_shot::projectile_damage",
    ]));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
    });

    expect(result.current.goalShortcutActive).toBe(true);
    expect(result.current.hoverAllocationPathNodeIds).toEqual(new Set());

    act(() => {
      result.current.updateHoverPreviewTarget("precise_shot");
    });
    expect(result.current.hoverAllocationPathNodeIds).toEqual(new Set());

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));
    });
    act(() => {
      result.current.updateHoverPreviewTarget("precise_shot");
    });

    expect(result.current.hoverAllocationPathNodeIds).toEqual(new Set([
      "projectile_damage",
      "precise_shot",
    ]));
  });
});

function allocationNodes(allocationPlan: AllocationPlan): Set<string> {
  return new Set(
    allocationPlan.previewNodePath.length > 0
      ? allocationPlan.previewNodePath
      : allocationPlan.committedNodePath,
  );
}

function allocationEdges(allocationPlan: AllocationPlan): Set<string> {
  return new Set(
    allocationPlan.previewEdgeKeys.length > 0
      ? allocationPlan.previewEdgeKeys
      : allocationPlan.committedEdgeKeys,
  );
}

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import type { TreeGraph } from "../tree/types";
import type { AllocationPlan } from "./allocationPlan";
import { useAllocationDisplayViewModel } from "./useAllocationDisplayViewModel";

describe("useAllocationDisplayViewModel", () => {
  it("combines main tree and ascendancy display allocation state", () => {
    const allocationPlan: AllocationPlan = {
      committedNodePath: ["mercenary_start", "projectile_damage"],
      committedEdgeKeys: ["mercenary_start::projectile_damage"],
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    };

    const { result } = renderHook(() => useAllocationDisplayViewModel({
      visibleGraph: sampleGraph,
      allocationPlan,
      activeAscendancyAllocationNodeIds: ["precise_shot"],
      activeAscendancyAllocationEdgeKeys: ["projectile_damage::precise_shot"],
      activeAscendancyPointCostByNodeId: new Map([["precise_shot", 0]]),
    }));

    expect(result.current.displayAllocatedNodeIds).toEqual(new Set([
      "mercenary_start",
      "projectile_damage",
      "precise_shot",
    ]));
    expect(result.current.displayAllocatedEdgeKeys).toEqual(new Set([
      "mercenary_start::projectile_damage",
      "projectile_damage::precise_shot",
    ]));
    expect(result.current.allocationDistanceNodeIds).toEqual(new Set([
      "mercenary_start",
      "projectile_damage",
    ]));
    expect(result.current.currentAllocationEdgeKeys).toEqual(new Set([
      "mercenary_start::projectile_damage",
    ]));
    expect(result.current.allocatedPointCount).toBe(1);
    expect(result.current.buildSummaryData.pointCount).toBe(1);
    expect(result.current.buildSummaryData.nodeCount).toBe(3);
  });

  it("uses preview paths as the distance and summary base while preserving committed display state", () => {
    const allocationPlan: AllocationPlan = {
      committedNodePath: ["mercenary_start"],
      committedEdgeKeys: [],
      previewNodePath: ["mercenary_start", "projectile_damage", "precise_shot"],
      previewEdgeKeys: [
        "mercenary_start::projectile_damage",
        "projectile_damage::precise_shot",
      ],
      previewRouteNodePath: ["mercenary_start", "projectile_damage", "precise_shot"],
    };

    const { result } = renderHook(() => useAllocationDisplayViewModel({
      visibleGraph: sampleGraph,
      allocationPlan,
      activeAscendancyAllocationNodeIds: [],
      activeAscendancyAllocationEdgeKeys: [],
      activeAscendancyPointCostByNodeId: new Map(),
    }));

    expect(result.current.displayAllocatedNodeIds).toEqual(new Set(["mercenary_start"]));
    expect(result.current.allocationDistanceNodeIds).toEqual(new Set([
      "mercenary_start",
      "projectile_damage",
      "precise_shot",
    ]));
    expect(result.current.currentAllocationEdgeKeys).toEqual(new Set([
      "mercenary_start::projectile_damage",
      "projectile_damage::precise_shot",
    ]));
    expect(result.current.buildSummaryData.pointCount).toBe(2);
  });

  it("ignores missing nodes in the build summary", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
      },
    };
    const allocationPlan: AllocationPlan = {
      committedNodePath: ["mercenary_start", "missing_node"],
      committedEdgeKeys: [],
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    };

    const { result } = renderHook(() => useAllocationDisplayViewModel({
      visibleGraph: graph,
      allocationPlan,
      activeAscendancyAllocationNodeIds: [],
      activeAscendancyAllocationEdgeKeys: [],
      activeAscendancyPointCostByNodeId: new Map(),
    }));

    expect(result.current.allocatedPointCount).toBe(1);
    expect(result.current.buildSummaryData.nodeCount).toBe(1);
    expect(result.current.buildSummaryData.pointCount).toBe(0);
  });
});

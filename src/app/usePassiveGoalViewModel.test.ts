import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { usePassiveGoalViewModel } from "./usePassiveGoalViewModel";

describe("usePassiveGoalViewModel", () => {
  it("builds goal display rows with distance and reached state", () => {
    const { result } = renderHook(() => usePassiveGoalViewModel({
      visibleGraph: sampleGraph,
      searchQuery: "",
      buildGoalNodeIds: ["mercenary_start", "precise_shot", "missing"],
      allocationDistanceNodeIds: new Set(["mercenary_start"]),
      displayAllocatedNodeIds: new Set(["mercenary_start"]),
    }));

    expect(result.current.buildGoalPanelGoals.map((goal) => ({
      id: goal.node.id,
      allocationDistance: goal.allocationDistance,
      reached: goal.reached,
    }))).toEqual([
      { id: "mercenary_start", allocationDistance: 0, reached: true },
      { id: "precise_shot", allocationDistance: 2, reached: false },
    ]);
  });

  it("sorts passive search matches by distance to allocation and exposes match ids", () => {
    const { result } = renderHook(() => usePassiveGoalViewModel({
      visibleGraph: sampleGraph,
      searchQuery: "damage",
      buildGoalNodeIds: [],
      allocationDistanceNodeIds: new Set(["mercenary_start"]),
      displayAllocatedNodeIds: new Set(["mercenary_start", "projectile_damage"]),
    }));

    const resultIds = result.current.searchResultsWithAllocationDistance.map(({ node }) => node.id);
    expect(resultIds[0]).toBe("projectile_damage");
    expect(result.current.searchResultsWithAllocationDistance[0].allocationDistance).toBe(1);
    expect(result.current.searchResultsWithAllocationDistance[0].allocated).toBe(true);
    expect(result.current.searchMatchNodeIds).toEqual(new Set(resultIds));
  });
});

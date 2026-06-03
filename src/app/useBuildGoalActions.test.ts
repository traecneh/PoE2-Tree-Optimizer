import { act, renderHook } from "@testing-library/react";
import { useMemo, useState } from "react";
import { describe, expect, it } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import { mergeNodeIds } from "./allocationPlan";
import { useBuildGoalActions } from "./useBuildGoalActions";

describe("useBuildGoalActions", () => {
  it("updates search state and manages manual build goals", () => {
    const { result } = renderHook(() => {
      const [searchQuery, setSearchQuery] = useState("old query");
      const [searchFocusedNodeId, setSearchFocusedNodeId] = useState<string | undefined>("precise_shot");
      const [buildGoalNodeIds, setBuildGoalNodeIds] = useState<string[]>([]);
      const [pobImportStatus, setPobImportStatus] = useState("success");
      const buildGoalNodeIdSet = useMemo(() => new Set(buildGoalNodeIds), [buildGoalNodeIds]);
      const actions = useBuildGoalActions({
        visibleGraph: sampleGraph,
        buildGoalNodeIdSet,
        addBuildGoalNodeId: (nodeId) => {
          setBuildGoalNodeIds((current) => mergeNodeIds(current, [nodeId]));
        },
        addBuildGoalNodeIds: (nodeIds) => {
          setBuildGoalNodeIds((current) => mergeNodeIds(current, nodeIds));
        },
        removeBuildGoalNodeId: (nodeId) => {
          setBuildGoalNodeIds((current) => current.filter((currentNodeId) => currentNodeId !== nodeId));
        },
        clearBuildGoalNodeIds: () => {
          setBuildGoalNodeIds([]);
        },
        clearPobImportStatus: () => {
          setPobImportStatus("idle");
        },
        setSearchQuery,
        setSearchFocusedNodeId,
      });

      return {
        ...actions,
        buildGoalNodeIds,
        pobImportStatus,
        searchFocusedNodeId,
        searchQuery,
      };
    });

    act(() => {
      result.current.updateSearchQuery("damage");
    });

    expect(result.current.searchQuery).toBe("damage");
    expect(result.current.searchFocusedNodeId).toBeUndefined();

    act(() => {
      result.current.addBuildGoal("projectile_damage");
      result.current.addBuildGoal("precise_shot");
    });

    expect(result.current.pobImportStatus).toBe("idle");
    expect(result.current.buildGoalNodeIds).toEqual(["precise_shot"]);

    act(() => {
      result.current.addBuildGoal("projectile_damage", { allowAnyPassive: true });
      result.current.addBuildGoal("mercenary_start", { allowAnyPassive: true });
    });

    expect(result.current.buildGoalNodeIds).toEqual(["precise_shot", "projectile_damage"]);

    act(() => {
      result.current.addMatchingBuildGoals(["mercenary_start", "projectile_damage", "jewel_socket", "missing"]);
    });

    expect(result.current.buildGoalNodeIds).toEqual(["precise_shot", "projectile_damage", "jewel_socket"]);

    act(() => {
      result.current.toggleMapBuildGoal("projectile_damage");
      result.current.toggleMapBuildGoal("mercenary_start");
    });

    expect(result.current.buildGoalNodeIds).toEqual(["precise_shot", "jewel_socket"]);

    act(() => {
      result.current.removeBuildGoal("precise_shot");
    });

    expect(result.current.buildGoalNodeIds).toEqual(["jewel_socket"]);

    act(() => {
      result.current.clearBuildGoals();
    });

    expect(result.current.buildGoalNodeIds).toEqual([]);
  });
});

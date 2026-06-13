import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { OptimizedRouteChoice } from "../tree/optimizedRouteChoice";
import type { SavedBuild, SavedBuildState } from "../tree/savedBuilds";
import type { TreeGraph } from "../tree/types";
import { emptyAllocationPlanForStart, type AllocationPlan } from "./allocationPlan";
import { useSavedBuildWorkflow } from "./useSavedBuildWorkflow";
import { emptyWeaponSetAllocations, type AllocationMode, type WeaponSetAllocationNodeIds } from "./weaponSetAllocation";

describe("useSavedBuildWorkflow", () => {
  it("loads a saved build and clears transient working state", () => {
    const graph = fixtureGraph();
    const options = classStartOptions();
    const savedBuild: SavedBuild = {
      id: "saved-1",
      name: "Stored build",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      state: savedBuildState(),
    };
    const selectSavedBuild = vi.fn(() => savedBuild);
    const clearOptimizedRouteState = vi.fn();
    const clearPobImport = vi.fn();
    const clearTreeInteractionState = vi.fn();

    const { result } = renderHook(() => {
      const [selectedClassStartId, setSelectedClassStartId] = useState<string | undefined>("witch");
      const [pathStartNodeId, setPathStartNodeId] = useState<string | undefined>("100");
      const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>(emptyAllocationPlanForStart("100"));
      const [nodeVisualScale, setNodeVisualScale] = useState(1);
      const [activeAllocationMode, setActiveAllocationMode] = useState<AllocationMode>("main");
      const [weaponSetAllocationNodeIds, setWeaponSetAllocationNodeIds] = useState<WeaponSetAllocationNodeIds>(
        () => emptyWeaponSetAllocations(),
      );
      const [buildGoalNodeIds, setBuildGoalNodeIds] = useState(["old-goal"]);
      const [ascendancyNodeIds, setAscendancyAllocationNodeIds] = useState(["old-ascendancy"]);
      const [appliedOptimizedRouteChoice, setAppliedOptimizedRouteChoice] = useState<OptimizedRouteChoice | undefined>({
        routeIndex: 0,
        routeNumber: 1,
        routeCount: 1,
        pointCost: 1,
        pointDeltaFromBest: 0,
        pointCostRouteNumber: 1,
        pointCostRouteCount: 1,
      });
      const [searchQuery, setSearchQuery] = useState("minion");
      const [searchFocusedNodeId, setSearchFocusedNodeId] = useState<string | undefined>("101");
      const workflow = useSavedBuildWorkflow({
        graph,
        classStartOptions: options,
        pathStartNodeId,
        setSelectedClassStartId,
        setPathStartNodeId,
        setAllocationPlan,
        resetAllocationPlan: () => undefined,
        nodeVisualScaleOptions: [1, 2, 3],
        defaultNodeVisualScale: 3,
        setNodeVisualScale,
        setActiveAllocationMode,
        setWeaponSetAllocationNodeIds,
        setBuildGoalNodeIds,
        setAscendancyAllocationNodeIds,
        setAppliedOptimizedRouteChoice,
        resetAscendancyAllocation: () => undefined,
        clearOptimizedRouteState,
        clearPobImport,
        selectSavedBuild,
        markNewUnsavedBuild: () => undefined,
        deleteSelectedSavedBuild: () => undefined,
        setSearchQuery,
        setSearchFocusedNodeId,
        clearTreeInteractionState,
      });

      return {
        ...workflow,
        selectedClassStartId,
        pathStartNodeId,
        allocationPlan,
        nodeVisualScale,
        activeAllocationMode,
        weaponSetAllocationNodeIds,
        buildGoalNodeIds,
        ascendancyNodeIds,
        appliedOptimizedRouteChoice,
        searchQuery,
        searchFocusedNodeId,
      };
    });

    act(() => {
      result.current.loadSavedBuild("saved-1");
    });

    expect(selectSavedBuild).toHaveBeenCalledWith("saved-1");
    expect(clearOptimizedRouteState).toHaveBeenCalledTimes(1);
    expect(clearPobImport).toHaveBeenCalledTimes(1);
    expect(clearTreeInteractionState).toHaveBeenCalledTimes(1);
    expect(result.current.searchQuery).toBe("");
    expect(result.current.searchFocusedNodeId).toBeUndefined();
    expect(result.current.selectedClassStartId).toBe("ranger:amazon");
    expect(result.current.pathStartNodeId).toBe("200");
    expect(result.current.nodeVisualScale).toBe(3);
    expect(result.current.activeAllocationMode).toBe("weapon2");
    expect(result.current.weaponSetAllocationNodeIds).toEqual({ 1: ["201"], 2: ["202"] });
    expect(result.current.buildGoalNodeIds).toEqual(["103"]);
    expect(result.current.ascendancyNodeIds).toEqual(["301", "302"]);
    expect(result.current.appliedOptimizedRouteChoice).toEqual({
      routeIndex: 2,
      routeNumber: 3,
      routeCount: 4,
      pointCost: 42,
      pointDeltaFromBest: 1,
      pointCostRouteNumber: 1,
      pointCostRouteCount: 2,
    });
    expect(result.current.allocationPlan).toMatchObject({
      committedNodePath: ["200", "201"],
      committedEdgeKeys: ["200::201"],
      previewNodePath: ["201", "202"],
      previewEdgeKeys: ["201::202"],
      previewRouteNodePath: ["202"],
      noAllocationPathNodeId: undefined,
    });
  });

  it("clears working state for new and deleted builds", () => {
    const graph = fixtureGraph();
    const resetAllocationPlan = vi.fn();
    const resetAscendancyAllocation = vi.fn();
    const clearOptimizedRouteState = vi.fn();
    const clearPobImport = vi.fn();
    const clearTreeInteractionState = vi.fn();
    const markNewUnsavedBuild = vi.fn();
    const deleteSelectedSavedBuild = vi.fn(() => ({
      id: "saved-1",
      name: "Stored build",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      state: savedBuildState(),
    } satisfies SavedBuild));

    const { result } = renderHook(() => {
      const [buildGoalNodeIds, setBuildGoalNodeIds] = useState(["old-goal"]);
      const [activeAllocationMode, setActiveAllocationMode] = useState<AllocationMode>("weapon1");
      const [weaponSetAllocationNodeIds, setWeaponSetAllocationNodeIds] = useState<WeaponSetAllocationNodeIds>({
        1: ["201"],
        2: ["202"],
      });
      const [appliedOptimizedRouteChoice, setAppliedOptimizedRouteChoice] = useState<OptimizedRouteChoice | undefined>({
        routeIndex: 1,
        routeNumber: 2,
        routeCount: 2,
        pointCost: 10,
        pointDeltaFromBest: 1,
        pointCostRouteNumber: 1,
        pointCostRouteCount: 1,
      });
      const [searchQuery, setSearchQuery] = useState("damage");
      const [searchFocusedNodeId, setSearchFocusedNodeId] = useState<string | undefined>("103");
      const workflow = useSavedBuildWorkflow({
        graph,
        classStartOptions: classStartOptions(),
        pathStartNodeId: "200",
        setSelectedClassStartId: () => undefined,
        setPathStartNodeId: () => undefined,
        setAllocationPlan: () => undefined,
        resetAllocationPlan,
        nodeVisualScaleOptions: [1, 2, 3],
        defaultNodeVisualScale: 3,
        setNodeVisualScale: () => undefined,
        setActiveAllocationMode,
        setWeaponSetAllocationNodeIds,
        setBuildGoalNodeIds,
        setAscendancyAllocationNodeIds: () => undefined,
        setAppliedOptimizedRouteChoice,
        resetAscendancyAllocation,
        clearOptimizedRouteState,
        clearPobImport,
        selectSavedBuild: () => undefined,
        markNewUnsavedBuild,
        deleteSelectedSavedBuild,
        setSearchQuery,
        setSearchFocusedNodeId,
        clearTreeInteractionState,
      });

      return {
        ...workflow,
        buildGoalNodeIds,
        activeAllocationMode,
        weaponSetAllocationNodeIds,
        appliedOptimizedRouteChoice,
        searchQuery,
        searchFocusedNodeId,
      };
    });

    act(() => {
      result.current.newUnsavedBuild();
    });

    expect(result.current.buildGoalNodeIds).toEqual([]);
    expect(result.current.activeAllocationMode).toBe("main");
    expect(result.current.weaponSetAllocationNodeIds).toEqual({ 1: [], 2: [] });
    expect(result.current.appliedOptimizedRouteChoice).toBeUndefined();
    expect(result.current.searchQuery).toBe("");
    expect(result.current.searchFocusedNodeId).toBeUndefined();
    expect(resetAllocationPlan).toHaveBeenLastCalledWith("200");
    expect(resetAscendancyAllocation).toHaveBeenCalledTimes(1);
    expect(markNewUnsavedBuild).toHaveBeenCalledWith("New unsaved build");

    act(() => {
      result.current.deleteSelectedBuild();
    });

    expect(deleteSelectedSavedBuild).toHaveBeenCalledTimes(1);
    expect(resetAllocationPlan).toHaveBeenLastCalledWith("200");
    expect(resetAscendancyAllocation).toHaveBeenCalledTimes(2);
    expect(result.current.appliedOptimizedRouteChoice).toBeUndefined();
    expect(clearOptimizedRouteState).toHaveBeenCalledTimes(2);
    expect(clearPobImport).toHaveBeenCalledTimes(2);
    expect(clearTreeInteractionState).toHaveBeenCalledTimes(2);
  });
});

function savedBuildState(): SavedBuildState {
  return {
    selectedClassStartId: "ranger:amazon",
    pathStartNodeId: "200",
    allocationPlan: {
      committedNodePath: ["200", "201", "missing"],
      committedEdgeKeys: ["200::201", "201::missing"],
      previewNodePath: ["201", "202", "missing"],
      previewEdgeKeys: ["201::202", "202::missing"],
      previewRouteNodePath: ["202", "missing"],
      noAllocationPathNodeId: "missing",
    },
    nodeVisualScale: 9,
    buildGoalNodeIds: ["103", "200", "missing"],
    ascendancyAllocationNodeIds: ["301", "missing", "302"],
    activeAllocationMode: "weapon2",
    weaponSetAllocationNodeIds: { 1: ["201"], 2: ["202", "missing"] },
    optimizedRouteChoice: {
      routeIndex: 2,
      routeNumber: 3,
      routeCount: 4,
      pointCost: 42,
      pointDeltaFromBest: 1,
      pointCostRouteNumber: 1,
      pointCostRouteCount: 2,
    },
  };
}

function classStartOptions(): ClassStartOption[] {
  return [
    {
      id: "witch",
      label: "Witch",
      className: "Witch",
      rootClassId: "WITCH",
      nodeId: "100",
    },
    {
      id: "ranger:amazon",
      label: "Ranger - Amazon",
      className: "Ranger",
      rootClassId: "RANGER",
      nodeId: "200",
      ascendancy: {
        id: "amazon",
        name: "Amazon",
        startNodeId: "300",
      },
    },
  ];
}

function fixtureGraph(): TreeGraph {
  return {
    schemaVersion: 1,
    gameVersion: "saved-build-workflow-fixture",
    extractedAt: "2026-06-03T00:00:00.000Z",
    source: { kind: "fixture", path: "src/app/useSavedBuildWorkflow.test.ts" },
    nodes: {
      "100": {
        id: "100",
        name: "Witch Start",
        stats: [],
        position: { x: 0, y: 0 },
        flags: { classStart: true },
      },
      "200": {
        id: "200",
        name: "Ranger Start",
        stats: [],
        position: { x: 0, y: 0 },
        flags: { classStart: true },
      },
      "201": {
        id: "201",
        name: "Saved Path",
        stats: ["5% increased Damage"],
        position: { x: 100, y: 0 },
        flags: { small: true },
      },
      "202": {
        id: "202",
        name: "Saved Preview",
        stats: ["5% increased Speed"],
        position: { x: 200, y: 0 },
        flags: { small: true },
      },
      "103": {
        id: "103",
        name: "Saved Goal",
        stats: ["20% increased Damage"],
        position: { x: 300, y: 0 },
        flags: { notable: true },
      },
      "300": {
        id: "300",
        name: "Amazon Start",
        stats: [],
        position: { x: 10_000, y: 0 },
        flags: { ascendancy: true, classStart: true },
        ascendancy: {
          id: "amazon",
          name: "Amazon",
          className: "Ranger",
          disabled: false,
          startNode: true,
        },
      },
      "301": {
        id: "301",
        name: "Amazon First",
        stats: ["20% increased Ascendancy Power"],
        position: { x: 10_100, y: 0 },
        flags: { ascendancy: true, notable: true },
        ascendancy: {
          id: "amazon",
          name: "Amazon",
          className: "Ranger",
          disabled: false,
        },
      },
      "302": {
        id: "302",
        name: "Amazon Second",
        stats: ["20% increased Ascendancy Speed"],
        position: { x: 10_200, y: 0 },
        flags: { ascendancy: true, notable: true },
        ascendancy: {
          id: "amazon",
          name: "Amazon",
          className: "Ranger",
          disabled: false,
        },
      },
    },
    groups: {},
    edges: [
      { from: "200", to: "201" },
      { from: "201", to: "202" },
      { from: "300", to: "301" },
      { from: "301", to: "302" },
    ],
    classStarts: {
      WITCH: "100",
      RANGER: "200",
    },
    bounds: { minX: 0, maxX: 300, minY: 0, maxY: 0 },
  };
}

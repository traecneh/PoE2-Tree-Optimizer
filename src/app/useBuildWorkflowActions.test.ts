import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  defaultPassiveOptimizationSettings,
  normalizePassiveOptimizationSettings,
  passivePreferenceCatalog,
  type PassiveOptimizationSettings,
} from "../tree/passivePreferences";
import type { SavedBuild } from "../tree/savedBuilds";
import { sampleGraph } from "../tree/sampleGraph";
import { emptyAllocationPlanForStart } from "./allocationPlan";
import { createSavedBuildState } from "./buildWorkflow";
import { useBuildWorkflowActions } from "./useBuildWorkflowActions";

describe("useBuildWorkflowActions optimizer settings restoration", () => {
  it("threads restoration through load, new, delete and clear using the latest callback", () => {
    const options = workflowOptions();
    const restoreOptimizerSettings = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const nextRestoreOptimizerSettings = vi.fn<(settings: PassiveOptimizationSettings) => void>();
    const savedBuild = options.selectSavedBuild("saved-1")!;
    const { result, rerender } = renderHook(
      ({ restore }) => useBuildWorkflowActions({ ...options, restoreOptimizerSettings: restore }),
      { initialProps: { restore: restoreOptimizerSettings } },
    );

    act(() => result.current.loadSavedBuild("saved-1"));

    expect(restoreOptimizerSettings).toHaveBeenCalledExactlyOnceWith(
      normalizePassiveOptimizationSettings(savedBuild.state.optimizerSettings),
    );
    restoreOptimizerSettings.mock.calls[0][0].preferences[0].weight = 3;
    expect(savedBuild.state.optimizerSettings?.preferences[0].weight).toBe(2);

    rerender({ restore: nextRestoreOptimizerSettings });
    act(() => {
      result.current.newUnsavedBuild();
      result.current.deleteSelectedBuild();
      result.current.clearWorkingBuildState();
    });

    expect(restoreOptimizerSettings).toHaveBeenCalledTimes(1);
    expect(nextRestoreOptimizerSettings.mock.calls).toEqual([
      [defaultPassiveOptimizationSettings()],
      [defaultPassiveOptimizationSettings()],
      [defaultPassiveOptimizationSettings()],
    ]);
  });

  it("leaves settings alone when no saved build was loaded or deleted", () => {
    const options = workflowOptions();
    options.deleteSelectedSavedBuild.mockReturnValue(undefined);
    const restoreOptimizerSettings = vi.fn();
    const { result } = renderHook(() => useBuildWorkflowActions({ ...options, restoreOptimizerSettings }));

    act(() => {
      result.current.loadSavedBuild("missing");
      result.current.deleteSelectedBuild();
    });

    expect(restoreOptimizerSettings).not.toHaveBeenCalled();
  });

  it("keeps all build actions usable without a restoration callback", () => {
    const options = workflowOptions();
    const { result } = renderHook(() => useBuildWorkflowActions(options));

    act(() => {
      result.current.loadSavedBuild("saved-1");
      result.current.newUnsavedBuild();
      result.current.deleteSelectedBuild();
      result.current.clearWorkingBuildState();
    });

    expect(options.markNewUnsavedBuild).toHaveBeenCalledWith("New unsaved build");
    expect(options.deleteSelectedSavedBuild).toHaveBeenCalledTimes(1);
  });
});

function workflowOptions() {
  const allocationPlan = emptyAllocationPlanForStart(undefined);
  const savedBuild: SavedBuild = {
    id: "saved-1",
    name: "Stored build",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    state: createSavedBuildState({
      selectedClassStartId: undefined,
      pathStartNodeId: undefined,
      allocationPlan,
      nodeVisualScale: 3,
      buildGoalNodeIds: [],
      ascendancyAllocationNodeIds: [],
      optimizerSettings: {
        mode: "weighted",
        extraPointBudget: 3,
        preferences: [{ id: passivePreferenceCatalog[0].id, weight: 2 }],
      },
    }),
  };
  return {
    graph: sampleGraph,
    visibleGraph: sampleGraph,
    classStartOptions: [],
    selectedClassStartOption: undefined,
    setSelectedClassStartId: vi.fn(),
    pathStartNodeId: undefined,
    setPathStartNodeId: vi.fn(),
    allocationPlan,
    setAllocationPlan: vi.fn(),
    resetAllocationPlan: vi.fn(),
    nodeVisualScaleOptions: [1, 2, 3],
    defaultNodeVisualScale: 3,
    setNodeVisualScale: vi.fn(),
    setActiveAllocationMode: vi.fn(),
    weaponSetAllocationNodeIds: { 1: [], 2: [] },
    setWeaponSetAllocationNodeIds: vi.fn(),
    buildGoalNodeIds: [],
    buildGoalNodeIdSet: new Set<string>(),
    setBuildGoalNodeIds: vi.fn(),
    setAppliedOptimizedRouteChoice: vi.fn(),
    addBuildGoalNodeId: vi.fn(),
    addBuildGoalNodeIds: vi.fn(),
    removeBuildGoalNodeId: vi.fn(),
    clearBuildGoalNodeIds: vi.fn(),
    activeAscendancyAllocationNodeIds: [],
    setAscendancyAllocationNodeIds: vi.fn(),
    resetAscendancyAllocation: vi.fn(),
    clearOptimizedRouteState: vi.fn(),
    pobImportCode: "",
    setPobImportStatus: vi.fn(),
    clearPobImport: vi.fn(),
    clearPobImportStatus: vi.fn(),
    selectSavedBuild: vi.fn((buildId: string) => buildId === savedBuild.id ? savedBuild : undefined),
    markNewUnsavedBuild: vi.fn(),
    deleteSelectedSavedBuild: vi.fn<() => SavedBuild | undefined>(() => savedBuild),
    setSearchQuery: vi.fn(),
    setSearchFocusedNodeId: vi.fn(),
    clearTreeInteractionState: vi.fn(),
  } satisfies Parameters<typeof useBuildWorkflowActions>[0];
}

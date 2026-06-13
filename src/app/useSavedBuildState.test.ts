import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SavedBuildState } from "../tree/savedBuilds";
import { useSavedBuildState } from "./useSavedBuildState";

describe("useSavedBuildState", () => {
  it("saves new builds, updates selected builds, and stores changes", () => {
    const storedBuilds: unknown[] = [];
    const storeSavedBuilds = vi.fn((builds: unknown[]) => {
      storedBuilds.push(builds);
    });
    const buildState = savedBuildState();
    const { result } = renderHook(() => useSavedBuildState({
      createSavedBuildId: () => "build-1",
      loadSavedBuilds: () => [],
      storeSavedBuilds,
      getCurrentState: () => buildState,
      toastDurationMs: 3000,
    }));

    act(() => {
      result.current.setSavedBuildName(" First pass ");
    });
    act(() => {
      result.current.saveCurrentBuild();
    });

    expect(result.current.savedBuilds).toHaveLength(1);
    expect(result.current.savedBuilds[0]).toMatchObject({
      id: "build-1",
      name: "First pass",
      state: buildState,
    });
    expect(result.current.selectedSavedBuildId).toBe("build-1");
    expect(result.current.savedBuildName).toBe("First pass");
    expect(result.current.savedBuildStatus).toBe("Saved First pass");
    expect(storeSavedBuilds).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setSavedBuildName("Updated pass");
    });
    act(() => {
      result.current.saveCurrentBuild();
    });

    expect(result.current.savedBuilds).toHaveLength(1);
    expect(result.current.savedBuilds[0].id).toBe("build-1");
    expect(result.current.savedBuilds[0].name).toBe("Updated pass");
    expect(result.current.savedBuildStatus).toBe("Saved Updated pass");
    expect(storeSavedBuilds).toHaveBeenCalledTimes(2);
    expect(storedBuilds).toHaveLength(2);

    const exportedJson = result.current.exportSavedBuildsJson("2026-06-04T12:00:00.000Z");
    expect(JSON.parse(exportedJson ?? "{}")).toMatchObject({
      schemaVersion: 1,
      exportedAt: "2026-06-04T12:00:00.000Z",
      builds: [{ id: "build-1", name: "Updated pass" }],
    });
  });

  it("imports saved builds and assigns fresh ids for collisions", () => {
    const storedBuilds: unknown[] = [];
    const storeSavedBuilds = vi.fn((builds: unknown[]) => {
      storedBuilds.push(builds);
    });
    const createSavedBuildId = vi.fn(() => "fresh-import-id");
    const existingBuild = {
      id: "shared-id",
      name: "Existing build",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
      state: savedBuildState(),
    };
    const importedBuild = {
      id: "shared-id",
      name: "Imported build",
      createdAt: "2026-06-02T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      state: savedBuildState({ pathStartNodeId: "2000" }),
    };
    const { result } = renderHook(() => useSavedBuildState({
      createSavedBuildId,
      loadSavedBuilds: () => [existingBuild],
      storeSavedBuilds,
      getCurrentState: () => savedBuildState(),
      toastDurationMs: 3000,
    }));

    act(() => {
      result.current.importSavedBuildsJson(JSON.stringify({
        schemaVersion: 1,
        exportedAt: "2026-06-04T12:00:00.000Z",
        builds: [importedBuild],
      }));
    });

    expect(result.current.savedBuilds.map((build) => build.id)).toEqual(["shared-id", "fresh-import-id"]);
    expect(result.current.savedBuilds[1].name).toBe("Imported build");
    expect(result.current.savedBuildStatus).toBe("Imported 1 build");
    expect(storeSavedBuilds).toHaveBeenCalledWith(result.current.savedBuilds);
  });

  it("loads and deletes selected builds", () => {
    const storedState = savedBuildState({ nodeVisualScale: 2 });
    const storeSavedBuilds = vi.fn();
    const { result } = renderHook(() => useSavedBuildState({
      createSavedBuildId: () => "unused",
      loadSavedBuilds: () => [{
        id: "saved-1",
        name: "Stored build",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
        state: storedState,
      }],
      storeSavedBuilds,
      getCurrentState: () => savedBuildState(),
      toastDurationMs: 3000,
    }));

    let loadedState: SavedBuildState | undefined;
    act(() => {
      loadedState = result.current.loadSavedBuild("saved-1")?.state;
    });

    expect(loadedState).toEqual(storedState);
    expect(result.current.selectedSavedBuildId).toBe("saved-1");
    expect(result.current.savedBuildName).toBe("Stored build");
    expect(result.current.savedBuildStatus).toBe("Loaded Stored build");

    act(() => {
      result.current.deleteSelectedBuild();
    });

    expect(result.current.savedBuilds).toEqual([]);
    expect(result.current.selectedSavedBuildId).toBe("");
    expect(result.current.savedBuildName).toBe("");
    expect(result.current.savedBuildStatus).toBe("Deleted Stored build");
    expect(storeSavedBuilds).toHaveBeenCalledWith([]);
  });

  it("clears repeated status toasts after the configured delay", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useSavedBuildState({
      createSavedBuildId: () => "build-1",
      loadSavedBuilds: () => [],
      storeSavedBuilds: () => undefined,
      getCurrentState: () => savedBuildState(),
      toastDurationMs: 3000,
    }));

    act(() => {
      result.current.setSavedBuildName("Toast build");
    });
    act(() => {
      result.current.saveCurrentBuild();
    });
    const firstFeedbackKey = result.current.savedBuildStatusFeedbackKey;

    act(() => {
      result.current.saveCurrentBuild();
    });

    expect(result.current.savedBuildStatus).toBe("Saved Toast build");
    expect(result.current.savedBuildStatusFeedbackKey).toBe(firstFeedbackKey + 1);

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(result.current.savedBuildStatus).toBe("Saved Toast build");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.savedBuildStatus).toBe("");

    unmount();
    vi.useRealTimers();
  });
});

function savedBuildState(overrides: Partial<SavedBuildState> = {}): SavedBuildState {
  return {
    selectedClassStartId: "witch",
    pathStartNodeId: "1000",
    allocationPlan: {
      committedNodePath: ["1000"],
      committedEdgeKeys: [],
      previewNodePath: [],
      previewEdgeKeys: [],
      previewRouteNodePath: [],
    },
    nodeVisualScale: 3,
    buildGoalNodeIds: [],
    ascendancyAllocationNodeIds: [],
    activeAllocationMode: "main",
    weaponSetAllocationNodeIds: { 1: [], 2: [] },
    ...overrides,
  };
}

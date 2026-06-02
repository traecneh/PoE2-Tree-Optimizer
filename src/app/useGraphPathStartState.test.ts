import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleGraph } from "../tree/sampleGraph";
import type { TreeGraph } from "../tree/types";
import { useGraphPathStartState } from "./useGraphPathStartState";

describe("useGraphPathStartState", () => {
  it("initializes the default path start from the fixture graph", () => {
    const { result } = renderHook(() => useGraphPathStartState({
      loadGraph: async () => sampleGraph,
    }));

    expect(result.current.selectedClassStartOption?.label).toBe("Mercenary");
    expect(result.current.pathStartNodeId).toBe("mercenary_start");
  });

  it("loads the full graph and preserves path start by matching node when possible", async () => {
    const loadedGraph = fixtureGraph({
      DUELIST: "mercenary_start",
      RANGER: "ranger_start",
    });
    const { result } = renderHook(() => useGraphPathStartState({
      loadGraph: async () => loadedGraph,
    }));

    await waitFor(() => expect(result.current.graphLoadStatus).toBe("loaded"));

    expect(result.current.graph).toBe(loadedGraph);
    expect(result.current.selectedClassStartOption?.label).toBe("Mercenary");
    expect(result.current.pathStartNodeId).toBe("mercenary_start");
  });

  it("updates the path start when the selected class changes", async () => {
    const loadedGraph = fixtureGraph({
      DUELIST: "mercenary_start",
      RANGER: "ranger_start",
    });
    const { result } = renderHook(() => useGraphPathStartState({
      loadGraph: async () => loadedGraph,
    }));

    await waitFor(() => expect(result.current.graphLoadStatus).toBe("loaded"));

    act(() => {
      result.current.setSelectedClassStartId("ranger");
    });

    expect(result.current.selectedClassStartOption?.label).toBe("Ranger");
    expect(result.current.pathStartNodeId).toBe("ranger_start");
  });

  it("uses the fixture graph when loading fails", async () => {
    const { result } = renderHook(() => useGraphPathStartState({
      loadGraph: async () => {
        throw new Error("missing graph");
      },
    }));

    await waitFor(() => expect(result.current.graphLoadStatus).toBe("fallback"));

    expect(result.current.graph).toBe(sampleGraph);
    expect(result.current.graph.nodes.mercenary_start).toBeDefined();
  });
});

function fixtureGraph(classStarts: TreeGraph["classStarts"]): TreeGraph {
  return {
    schemaVersion: 1,
    gameVersion: "graph-path-start-test",
    extractedAt: "2026-06-02T00:00:00.000Z",
    source: { kind: "fixture", path: "src/app/useGraphPathStartState.test.ts" },
    nodes: Object.fromEntries(Object.entries(classStarts).map(([classId, nodeId]) => [nodeId, {
      id: nodeId,
      name: classId,
      stats: ["Starting point"],
      position: { x: 0, y: 0 },
      flags: { classStart: true },
    }])),
    groups: {},
    edges: [],
    classStarts,
    bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  };
}

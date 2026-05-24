import { describe, expect, it } from "vitest";
import { sampleGraph } from "./sampleGraph";
import { validateTreeGraph } from "./validateTreeGraph";
import type { TreeGraph } from "./types";

describe("validateTreeGraph", () => {
  it("accepts the sample graph", () => {
    const report = validateTreeGraph(sampleGraph);
    expect(report.summary.nodeCount).toBe(4);
    expect(report.summary.edgeCount).toBe(3);
    expect(report.issues).toEqual([]);
  });

  it("reports dangling edges", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      edges: [{ from: "mercenary_start", to: "missing" }],
    };

    const report = validateTreeGraph(graph);

    expect(report.summary.danglingEdgeCount).toBe(1);
    expect(report.issues[0]).toMatchObject({ code: "dangling-edge" });
  });

  it("reports missing coordinates and orphan nodes", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        orphan: {
          id: "orphan",
          name: "Broken",
          stats: [],
          position: { x: Number.NaN, y: 10 },
          flags: { small: true },
        },
      },
    };

    const report = validateTreeGraph(graph);

    expect(report.summary.missingCoordinateCount).toBe(1);
    expect(report.summary.orphanNodeCount).toBe(1);
  });
});

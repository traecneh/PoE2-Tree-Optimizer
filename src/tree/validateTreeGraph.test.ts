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

  it("does not report missing stats for mastery choice or ascendancy nodes", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        mastery: {
          id: "mastery",
          name: "Attack Mastery",
          stats: [],
          masteryEffects: [{ id: "Attack1", stats: ["12% increased Attack Damage"] }],
          position: { x: 80, y: 0 },
          flags: { small: true, mastery: true },
        },
        ascendancy: {
          id: "ascendancy",
          name: "Ascendancy Placeholder",
          stats: [],
          position: { x: 90, y: 0 },
          flags: { notable: true, ascendancy: true },
        },
      },
      edges: [
        ...sampleGraph.edges,
        { from: "projectile_damage", to: "mastery" },
        { from: "projectile_damage", to: "ascendancy" },
      ],
    };

    const report = validateTreeGraph(graph);

    expect(report.issues.filter((issue) => issue.code === "missing-stats")).toEqual([]);
    expect(report.summary.missingStatCount).toBe(0);
  });
});

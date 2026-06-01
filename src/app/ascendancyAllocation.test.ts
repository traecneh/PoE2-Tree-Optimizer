import { describe, expect, it } from "vitest";
import type { TreeGraph } from "../tree/types";
import {
  ascendancyAllocatedPointCount,
  ascendancyAllocationEdgeKeys,
  ascendancyPointCostByNodeId,
  sanitizeAscendancyAllocationNodeIds,
  toggleAscendancyAllocationNodeIds,
  type SelectedAscendancy,
} from "./ascendancyAllocation";

describe("ascendancy allocation", () => {
  it("treats choice parent and selected option as one ascendancy point", () => {
    const graph = fixtureGraph();
    const selectedAscendancy = fixtureAscendancy();

    const withParent = toggleAscendancyAllocationNodeIds(
      graph.nodes.choice_parent,
      [],
      graph,
      selectedAscendancy,
    );
    const withOption = toggleAscendancyAllocationNodeIds(
      graph.nodes.choice_option_a,
      withParent,
      graph,
      selectedAscendancy,
    );

    expect(withOption).toEqual(["choice_parent", "choice_option_a"]);
    expect(ascendancyAllocatedPointCount(graph, selectedAscendancy, withOption)).toBe(1);
    expect(Array.from(ascendancyPointCostByNodeId(graph, selectedAscendancy, withOption))).toEqual([
      ["choice_parent", 1],
      ["choice_option_a", 0],
    ]);
  });

  it("replaces sibling choice options instead of charging another point", () => {
    const graph = fixtureGraph();
    const selectedAscendancy = fixtureAscendancy();
    const current = ["choice_parent", "choice_option_a"];

    const next = toggleAscendancyAllocationNodeIds(
      graph.nodes.choice_option_b,
      current,
      graph,
      selectedAscendancy,
    );

    expect(next).toEqual(["choice_parent", "choice_option_b"]);
    expect(ascendancyAllocatedPointCount(graph, selectedAscendancy, next)).toBe(1);
  });

  it("sanitizes invalid nodes and reports allocated ascendancy edges", () => {
    const graph = fixtureGraph();
    const selectedAscendancy = fixtureAscendancy();

    const sanitized = sanitizeAscendancyAllocationNodeIds(
      ["main_tree_notable", "choice_parent", "choice_option_a", "choice_option_b"],
      graph,
      selectedAscendancy,
    );

    expect(sanitized).toEqual(["choice_parent", "choice_option_b"]);
    expect(ascendancyAllocationEdgeKeys(graph, selectedAscendancy, sanitized)).toEqual([
      "asc_start::choice_parent",
      "choice_option_b::choice_parent",
    ]);
  });
});

function fixtureAscendancy(): SelectedAscendancy {
  return {
    id: "oracle",
    name: "Oracle",
    startNodeId: "asc_start",
  };
}

function fixtureGraph(): TreeGraph {
  const ascendancy = {
    id: "oracle",
    name: "Oracle",
    className: "Druid",
    disabled: false,
  };

  return {
    schemaVersion: 1,
    gameVersion: "ascendancy-fixture",
    extractedAt: "2026-06-01T00:00:00.000Z",
    source: { kind: "fixture", path: "src/app/ascendancyAllocation.test.ts" },
    nodes: {
      asc_start: {
        id: "asc_start",
        name: "Oracle Start",
        stats: [],
        position: { x: 0, y: 0 },
        flags: { classStart: true, ascendancy: true },
        ascendancy: { ...ascendancy, startNode: true },
      },
      choice_parent: {
        id: "choice_parent",
        name: "Choice Parent",
        stats: [],
        position: { x: 100, y: 0 },
        flags: { notable: true, ascendancy: true },
        ascendancy,
      },
      choice_option_a: {
        id: "choice_option_a",
        name: "Choice Option A",
        stats: ["20% increased Choice A"],
        position: { x: 200, y: -50 },
        flags: { small: true, ascendancy: true },
        ascendancy,
      },
      choice_option_b: {
        id: "choice_option_b",
        name: "Choice Option B",
        stats: ["20% increased Choice B"],
        position: { x: 200, y: 50 },
        flags: { small: true, ascendancy: true },
        ascendancy,
      },
      main_tree_notable: {
        id: "main_tree_notable",
        name: "Main Tree Notable",
        stats: ["20% increased Damage"],
        position: { x: -100, y: 0 },
        flags: { notable: true },
      },
    },
    groups: {},
    edges: [
      { from: "asc_start", to: "choice_parent" },
      { from: "choice_parent", to: "choice_option_a" },
      { from: "choice_parent", to: "choice_option_b" },
    ],
    classStarts: { TEMPLAR: "main_tree_notable" },
    bounds: { minX: -100, maxX: 200, minY: -50, maxY: 50 },
  };
}

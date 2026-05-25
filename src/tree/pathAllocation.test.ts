import { describe, expect, it } from "vitest";
import { sampleGraph } from "./sampleGraph";
import { findShortestAllocationPath, findShortestAllocationPathFromAllocated } from "./pathAllocation";
import type { TreeGraph } from "./types";

describe("findShortestAllocationPath", () => {
  it("returns the shortest connected node and edge path with point cost", () => {
    expect(findShortestAllocationPath(sampleGraph, "mercenary_start", "precise_shot")).toEqual({
      startNodeId: "mercenary_start",
      targetNodeId: "precise_shot",
      nodeIds: ["mercenary_start", "projectile_damage", "precise_shot"],
      edgeKeys: ["mercenary_start::projectile_damage", "precise_shot::projectile_damage"],
      pointCost: 2,
    });
  });

  it("returns a zero point path when the target is the class start", () => {
    expect(findShortestAllocationPath(sampleGraph, "mercenary_start", "mercenary_start")).toEqual({
      startNodeId: "mercenary_start",
      targetNodeId: "mercenary_start",
      nodeIds: ["mercenary_start"],
      edgeKeys: [],
      pointCost: 0,
    });
  });

  it("ignores long hidden guide edges when computing allocation paths", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        start: {
          id: "start",
          name: "Start",
          stats: [],
          position: { x: 0, y: 0 },
          flags: { classStart: true },
        },
        nearby: {
          id: "nearby",
          name: "Nearby",
          stats: [],
          position: { x: 100, y: 0 },
          flags: { small: true },
        },
        outside_guide: {
          id: "outside_guide",
          name: "Outside Guide",
          stats: [],
          position: { x: 10000, y: 0 },
          flags: { small: true },
        },
      },
      edges: [
        { from: "start", to: "nearby" },
        { from: "start", to: "outside_guide" },
      ],
      classStarts: { Test: "start" },
    };

    expect(findShortestAllocationPath(graph, "start", "outside_guide")).toBeUndefined();
  });

  it("returns undefined for missing or disconnected targets", () => {
    const graph: TreeGraph = {
      ...sampleGraph,
      nodes: {
        ...sampleGraph.nodes,
        orphan: {
          id: "orphan",
          name: "Orphan",
          stats: [],
          position: { x: 700, y: 0 },
          flags: { small: true },
        },
      },
    };

    expect(findShortestAllocationPath(graph, "missing", "precise_shot")).toBeUndefined();
    expect(findShortestAllocationPath(graph, "mercenary_start", "orphan")).toBeUndefined();
  });

  it("returns the shortest path from the current allocated tree", () => {
    expect(findShortestAllocationPathFromAllocated(
      sampleGraph,
      new Set(["mercenary_start", "projectile_damage", "precise_shot"]),
      "jewel_socket",
    )).toEqual({
      startNodeId: "precise_shot",
      targetNodeId: "jewel_socket",
      nodeIds: ["precise_shot", "jewel_socket"],
      edgeKeys: ["jewel_socket::precise_shot"],
      pointCost: 1,
    });
  });

  it("returns a zero point path when the target is already allocated", () => {
    expect(findShortestAllocationPathFromAllocated(
      sampleGraph,
      new Set(["mercenary_start", "projectile_damage", "precise_shot"]),
      "projectile_damage",
    )).toEqual({
      startNodeId: "projectile_damage",
      targetNodeId: "projectile_damage",
      nodeIds: ["projectile_damage"],
      edgeKeys: [],
      pointCost: 0,
    });
  });
});

import { describe, expect, it } from "vitest";
import type { TreeGraph, TreeNode } from "../tree/types";
import {
  defaultWeaponSetPointLimit,
  emptyWeaponSetAllocations,
  nextWeaponSetAllocationNodeIdsForClick,
  sanitizeWeaponSetAllocationNodeIds,
  weaponSetAllocationEdgeKeys,
  weaponSetBasePassivePointCount,
  weaponSetPointCount,
} from "./weaponSetAllocation";

describe("weapon set allocation", () => {
  it("starts with empty weapon set allocations", () => {
    expect(emptyWeaponSetAllocations()).toEqual({ 1: [], 2: [] });
    expect(defaultWeaponSetPointLimit).toBe(24);
  });

  it("sanitizes weapon set allocations to valid weapon-set-capable main tree nodes", () => {
    const graph = fixtureGraph();

    expect(sanitizeWeaponSetAllocationNodeIds(["w1", "socket", "keystone", "ascendancy", "start", "missing"], graph))
      .toEqual(["w1"]);
  });

  it("counts each weapon set side separately", () => {
    expect(weaponSetPointCount(["w1", "w2"])).toBe(2);
  });

  it("counts base passives as global points plus the larger weapon set side", () => {
    expect(weaponSetBasePassivePointCount(98, { 1: ["w1", "w2"], 2: ["w3"] })).toBe(100);
    expect(weaponSetBasePassivePointCount(98, { 1: ["w1"], 2: ["w2", "w3", "w4"] })).toBe(101);
  });

  it("derives weapon-set edge highlights from main plus set-specific allocations", () => {
    const graph = fixtureGraph();

    expect(weaponSetAllocationEdgeKeys(graph, ["start", "main"], ["w1", "w2"]))
      .toEqual(["main::w1", "w1::w2"]);
  });

  it("adds the shortest valid weapon-set path from the main allocation", () => {
    const result = nextWeaponSetAllocationNodeIdsForClick({
      graph: fixtureGraph(),
      mainNodeIds: ["start", "main"],
      weaponSetNodeIds: [],
      targetNodeId: "w2",
    });

    expect(result).toEqual({
      status: "updated",
      nodeIds: ["w1", "w2"],
    });
  });

  it("prunes weapon-set allocations from the clicked node", () => {
    expect(nextWeaponSetAllocationNodeIdsForClick({
      graph: fixtureGraph(),
      mainNodeIds: ["start", "main"],
      weaponSetNodeIds: ["w1", "w2"],
      targetNodeId: "w2",
    })).toEqual({
      status: "updated",
      nodeIds: ["w1"],
    });

    expect(nextWeaponSetAllocationNodeIdsForClick({
      graph: fixtureGraph(),
      mainNodeIds: ["start", "main"],
      weaponSetNodeIds: ["w1"],
      targetNodeId: "w1",
    })).toEqual({
      status: "updated",
      nodeIds: [],
    });
  });

  it("rejects global-only weapon set targets", () => {
    expect(nextWeaponSetAllocationNodeIdsForClick({
      graph: fixtureGraph(),
      mainNodeIds: ["start", "main"],
      weaponSetNodeIds: [],
      targetNodeId: "keystone",
    })).toEqual({
      status: "invalid-target",
      nodeIds: [],
    });
  });

  it("keeps the current weapon set when the path would exceed the weapon point limit", () => {
    expect(nextWeaponSetAllocationNodeIdsForClick({
      graph: fixtureGraph(),
      mainNodeIds: ["start", "main"],
      weaponSetNodeIds: [],
      targetNodeId: "w2",
      pointLimit: 1,
    })).toEqual({
      status: "limit-exceeded",
      nodeIds: [],
    });
  });
});

function fixtureGraph(): TreeGraph {
  return {
    schemaVersion: 1,
    gameVersion: "weapon-set-test",
    extractedAt: "2026-06-12T00:00:00.000Z",
    source: { kind: "fixture", path: "src/app/weaponSetAllocation.test.ts" },
    nodes: {
      start: node("start", { classStart: true }),
      main: node("main", { small: true }),
      w1: node("w1", { small: true }),
      w2: node("w2", { notable: true }),
      socket: node("socket", { jewelSocket: true }),
      keystone: node("keystone", { keystone: true }),
      ascendancy: node("ascendancy", { ascendancy: true, notable: true }),
    },
    groups: {},
    edges: [
      { from: "start", to: "main" },
      { from: "main", to: "w1" },
      { from: "w1", to: "w2" },
      { from: "w2", to: "socket" },
      { from: "main", to: "keystone" },
      { from: "start", to: "ascendancy" },
    ],
    classStarts: { TEST: "start" },
    bounds: { minX: 0, maxX: 400, minY: 0, maxY: 0 },
  };
}

function node(id: string, flags: TreeNode["flags"]): TreeNode {
  return {
    id,
    name: id,
    stats: [],
    position: { x: 0, y: 0 },
    flags,
  };
}

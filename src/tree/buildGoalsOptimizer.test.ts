import { describe, expect, it } from "vitest";
import { treeEdgeKey } from "./pathAllocation";
import type { TreeGraph, TreeNode } from "./types";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";

describe("optimizeBuildGoals", () => {
  it("finds the shortest route to one required goal", () => {
    const graph = fixtureGraph([
      ["start", "travel"],
      ["travel", "goal"],
      ["start", "long_a"],
      ["long_a", "long_b"],
      ["long_b", "goal"],
    ]);

    const result = optimizeBuildGoals({
      graph,
      baseNodeIds: ["start"],
      baseEdgeKeys: [],
      goalNodeIds: ["goal"],
      mode: "shortest",
    });

    expect(result.status).toBe("success");
    expect(result.pointCost).toBe(2);
    expect(result.addedNodeIds).toEqual(["travel", "goal"]);
    expect(result.addedEdgeKeys).toEqual([treeEdgeKey("start", "travel"), treeEdgeKey("goal", "travel")]);
  });

  it("finds a branching route when it uses fewer total nodes", () => {
    const graph = fixtureGraph([
      ["start", "hub"],
      ["hub", "left_goal"],
      ["hub", "right_goal"],
      ["left_goal", "chain_a"],
      ["chain_a", "chain_b"],
      ["chain_b", "right_goal"],
    ]);

    const result = optimizeBuildGoals({
      graph,
      baseNodeIds: ["start"],
      baseEdgeKeys: [],
      goalNodeIds: ["left_goal", "right_goal"],
      mode: "shortest",
    });

    expect(result.status).toBe("success");
    expect(result.pointCost).toBe(3);
    expect(result.addedNodeIds).toEqual(["hub", "left_goal", "right_goal"]);
    expect(new Set(result.addedEdgeKeys)).toEqual(new Set([
      treeEdgeKey("start", "hub"),
      treeEdgeKey("hub", "left_goal"),
      treeEdgeKey("hub", "right_goal"),
    ]));
  });

  it("counts shared travel nodes once across multiple goals", () => {
    const graph = fixtureGraph([
      ["start", "shared_a"],
      ["shared_a", "shared_b"],
      ["shared_b", "goal_one"],
      ["shared_b", "goal_two"],
    ]);

    const result = optimizeBuildGoals({
      graph,
      baseNodeIds: ["start"],
      baseEdgeKeys: [],
      goalNodeIds: ["goal_one", "goal_two"],
      mode: "shortest",
    });

    expect(result.status).toBe("success");
    expect(result.pointCost).toBe(4);
    expect(result.addedNodeIds).toEqual(["shared_a", "shared_b", "goal_one", "goal_two"]);
  });

  it("uses a shared non-goal trunk when it is cheaper than separate shortest paths", () => {
    const graph = fixtureGraph([
      ["start", "direct_one_a"],
      ["direct_one_a", "direct_one_b"],
      ["direct_one_b", "goal_one"],
      ["start", "direct_two_a"],
      ["direct_two_a", "direct_two_b"],
      ["direct_two_b", "goal_two"],
      ["start", "direct_three_a"],
      ["direct_three_a", "direct_three_b"],
      ["direct_three_b", "goal_three"],
      ["start", "trunk"],
      ["trunk", "hub"],
      ["hub", "goal_one_link"],
      ["goal_one_link", "goal_one"],
      ["hub", "goal_two_link"],
      ["goal_two_link", "goal_two"],
      ["hub", "goal_three_link"],
      ["goal_three_link", "goal_three"],
    ]);

    const result = optimizeBuildGoals({
      graph,
      baseNodeIds: ["start"],
      baseEdgeKeys: [],
      goalNodeIds: ["goal_one", "goal_two", "goal_three"],
      mode: "shortest",
    });

    expect(result.status).toBe("success");
    expect(result.pointCost).toBe(8);
    expect(new Set(result.addedNodeIds)).toEqual(new Set([
      "trunk",
      "hub",
      "goal_one_link",
      "goal_one",
      "goal_two_link",
      "goal_two",
      "goal_three_link",
      "goal_three",
    ]));
  });

  it("treats current base nodes and edges as zero-cost route anchors", () => {
    const graph = fixtureGraph([
      ["start", "pending"],
      ["pending", "goal"],
      ["start", "detour_a"],
      ["detour_a", "detour_b"],
      ["detour_b", "goal"],
    ]);

    const result = optimizeBuildGoals({
      graph,
      baseNodeIds: ["start", "pending"],
      baseEdgeKeys: [treeEdgeKey("pending", "start")],
      goalNodeIds: ["goal"],
      mode: "shortest",
    });

    expect(result.status).toBe("success");
    expect(result.pointCost).toBe(1);
    expect(result.addedNodeIds).toEqual(["goal"]);
    expect(result.addedEdgeKeys).toEqual([treeEdgeKey("goal", "pending")]);
    expect(result.totalNodeIds).toEqual(["start", "pending", "goal"]);
    expect(result.totalEdgeKeys).toEqual([treeEdgeKey("pending", "start"), treeEdgeKey("goal", "pending")]);
  });

  it("reports unreachable goals without changing the route", () => {
    const graph = fixtureGraph([
      ["start", "reachable_goal"],
      ["island", "unreachable_goal"],
    ]);

    const result = optimizeBuildGoals({
      graph,
      baseNodeIds: ["start"],
      baseEdgeKeys: [],
      goalNodeIds: ["reachable_goal", "unreachable_goal"],
      mode: "shortest",
    });

    expect(result.status).toBe("unreachable");
    expect(result.pointCost).toBe(0);
    expect(result.addedNodeIds).toEqual([]);
    expect(result.addedEdgeKeys).toEqual([]);
    expect(result.unreachableGoalNodeIds).toEqual(["unreachable_goal"]);
  });
});

function fixtureGraph(edgePairs: Array<[string, string]>): TreeGraph {
  const nodeIds = Array.from(new Set(edgePairs.flat()));
  const nodes: Record<string, TreeNode> = Object.fromEntries(
    nodeIds.map((nodeId, index) => [nodeId, {
      id: nodeId,
      groupId: "g",
      name: titleCase(nodeId),
      stats: [],
      position: { x: index * 100, y: 0 },
      flags: nodeId.includes("goal") ? { notable: true } : { small: true },
    }]),
  );

  return {
    schemaVersion: 1,
    gameVersion: "build-goals-test",
    extractedAt: "2026-05-25T00:00:00.000Z",
    source: { kind: "fixture", path: "src/tree/buildGoalsOptimizer.test.ts" },
    nodes,
    groups: { g: { id: "g", nodeIds } },
    edges: edgePairs.map(([from, to]) => ({ from, to })),
    classStarts: { Test: "start" },
    bounds: { minX: 0, maxX: nodeIds.length * 100, minY: 0, maxY: 0 },
  };
}

function titleCase(value: string): string {
  return value.split("_").map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");
}

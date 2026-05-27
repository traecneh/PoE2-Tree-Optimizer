import { describe, expect, it } from "vitest";
import { createPassiveSearchIndex, searchPassiveTree } from "./passiveSearch";
import type { TreeGraph, TreeNode } from "./types";

describe("searchPassiveTree", () => {
  it("returns every matching passive instead of capping results", () => {
    const graph = graphWithMatchingNodes(75);

    const results = searchPassiveTree(graph, "critical");

    expect(results).toHaveLength(75);
    expect(results.map((result) => result.node.id)).toContain("critical_74");
  });

  it("searches passive mastery choice text", () => {
    const graph = graphWithMatchingNodes(1);
    graph.nodes.mastery = {
      id: "mastery",
      name: "Attack Mastery",
      stats: [],
      masteryEffects: [{ id: "Attack1", stats: ["12% increased Attack Damage"] }],
      position: { x: 100, y: 0 },
      flags: { small: true, mastery: true },
    };

    const results = searchPassiveTree(graph, "attack damage");

    expect(results.map((result) => result.node.id)).toEqual(["mastery"]);
    expect(results[0].matchedText).toBe("12% increased Attack Damage");
  });

  it("searches a precomputed passive index with the same result shape", () => {
    const graph = graphWithMatchingNodes(3);
    const index = createPassiveSearchIndex(graph);

    const results = searchPassiveTree(index, "critical");

    expect(results.map((result) => result.node.id)).toEqual(["critical_0", "critical_1", "critical_2"]);
    expect(results[0].matchedText).toBe("Critical Node 0");
  });

  it("requires quoted text to match as a contiguous phrase", () => {
    const graph = graphWithMatchingNodes(0);
    graph.nodes.life = testNode("life", "Sturdy", ["12% increased Maximum Life"]);
    graph.nodes.splitWords = testNode("split_words", "Split Words", [
      "12% increased Maximum Energy Shield",
      "5% increased Life Regeneration",
    ]);

    const looseResults = searchPassiveTree(graph, "increased maximum life");
    const exactResults = searchPassiveTree(graph, "\"increased Maximum Life\"");

    expect(looseResults.map((result) => result.node.id)).toEqual(["life", "split_words"]);
    expect(exactResults.map((result) => result.node.id)).toEqual(["life"]);
  });

  it("excludes nodes matching minus-prefixed search terms", () => {
    const graph = graphWithMatchingNodes(0);
    graph.nodes.critical = testNode("critical", "Critical Chance", ["15% increased Critical Hit Chance"]);
    graph.nodes.minionCritical = testNode("minion_critical", "Minion Critical Chance", [
      "Minions have 15% increased Critical Hit Chance",
    ]);

    const results = searchPassiveTree(graph, "critical -Minion");

    expect(results.map((result) => result.node.id)).toEqual(["critical"]);
  });

  it("combines exact quoted requirements with exclusions", () => {
    const graph = graphWithMatchingNodes(0);
    graph.nodes.life = testNode("life", "Sturdy", ["12% increased Maximum Life"]);
    graph.nodes.minionLife = testNode("minion_life", "Minion Vitality", [
      "Minions have 12% increased Maximum Life",
    ]);

    const results = searchPassiveTree(graph, "\"increased Maximum Life\" -Minion");

    expect(results.map((result) => result.node.id)).toEqual(["life"]);
  });
});

function testNode(id: string, name: string, stats: string[]): TreeNode {
  return {
    id,
    name,
    stats,
    position: { x: 0, y: 0 },
    flags: { small: true },
  };
}

function graphWithMatchingNodes(count: number): TreeGraph {
  const nodes: Record<string, TreeNode> = {};

  for (let index = 0; index < count; index += 1) {
    nodes[`critical_${index}`] = {
      id: `critical_${index}`,
      name: `Critical Node ${index}`,
      stats: ["5% increased Critical Hit Chance"],
      position: { x: index * 10, y: 0 },
      flags: { small: true },
    };
  }

  return {
    schemaVersion: 1,
    gameVersion: "search-test",
    extractedAt: "2026-05-26T00:00:00.000Z",
    source: { kind: "fixture", path: "src/tree/passiveSearch.test.ts" },
    nodes,
    groups: {},
    edges: [],
    classStarts: {},
    bounds: { minX: 0, maxX: count * 10, minY: 0, maxY: 0 },
  };
}

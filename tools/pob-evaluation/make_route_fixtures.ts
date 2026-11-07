import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { optimizeBuildGoals } from "../../src/tree/buildGoalsOptimizer";
import { findAllocationDistancesFrom } from "../../src/tree/pathAllocation";
import { filterVisibleTreeGraph } from "../../src/tree/treeVisibility";
import type { TreeGraph } from "../../src/tree/types";

const outputPath = process.argv[2];
if (!outputPath) throw new Error("Usage: tsx tools/pob-evaluation/make_route_fixtures.ts OUTPUT.json");
const graph = filterVisibleTreeGraph(JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph, {});
const baseNodeId = graph.classStarts.WITCH;
if (!baseNodeId) throw new Error("The game tree has no Witch start.");
const goalNodeIds = ["Melding", "Patient Barrier"].map((name) => {
  const nodes = Object.values(graph.nodes).filter((node) => node.name === name && !node.flags.ascendancy);
  if (nodes.length !== 1) throw new Error(`Expected one visible main-tree node named ${name}.`);
  return nodes[0].id;
});
const request = { graph, baseNodeIds: [baseNodeId], baseEdgeKeys: [], goalNodeIds, mode: "shortest" as const };
const shortest = optimizeBuildGoals(request);
if (shortest.status !== "success") throw new Error("Could not generate the shortest test route.");
const candidates = [{ label: "shortest", result: shortest }];
const shortestNodes = new Set(shortest.totalNodeIds);
const distances = findAllocationDistancesFrom(graph, shortest.totalNodeIds);
const bonusNodes = Object.values(graph.nodes)
  .filter((node) => !shortestNodes.has(node.id) && !node.flags.ascendancy && !node.flags.classStart
    && node.stats.some((stat) => /^\d+% increased maximum Energy Shield$/.test(stat)))
  .sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity) || a.id.localeCompare(b.id));

for (const node of bonusNodes) {
  const result = optimizeBuildGoals({ ...request, goalNodeIds: [...goalNodeIds, node.id] });
  if (result.status !== "success" || result.pointCost <= shortest.pointCost || result.pointCost > shortest.pointCost + 5) continue;
  if (candidates.some((candidate) => [...candidate.result.totalNodeIds].sort().join() === [...result.totalNodeIds].sort().join())) continue;
  candidates.push({ label: `via ${node.name} (${node.id})`, result });
  if (candidates.length === 3) break;
}

const fixture = {
  graphVersion: graph.gameVersion,
  baseNodeId,
  goalNodeIds,
  description: "Controlled feasibility examples, not a new optimization mode or a real geared character.",
  candidates: candidates.map(({ label, result }) => ({
    label,
    pointCost: result.pointCost,
    nodeIds: result.totalNodeIds,
    edgeKeys: result.totalEdgeKeys,
    nodes: result.addedNodeIds.map((id) => ({ id, name: graph.nodes[id].name, stats: graph.nodes[id].stats })),
  })),
};
writeFileSync(outputPath, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`Wrote ${fixture.candidates.length} complete candidate trees to ${resolve(outputPath)}.`);

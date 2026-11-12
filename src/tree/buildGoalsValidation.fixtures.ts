import type { BuildGoalsOptimizeRequest, BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

// Expected allocations and costs are declared independently of solver reconstruction.
export function validationGraph(pairs: [string, string][] = [["start", "travel"], ["travel", "goal"], ["start", "other"], ["other", "goal"]]): TreeGraph {
  const ids = [...new Set(pairs.flat())];
  return {
    schemaVersion: 1, gameVersion: "validation-fixture", extractedAt: "2026-11-08", source: { kind: "fixture", path: "buildGoalsValidation.fixtures.ts" },
    nodes: Object.fromEntries(ids.map((id) => [id, {
      id, name: id, stats: id === "other" ? ["12% increased maximum Energy Shield"] : [],
      position: { x: 0, y: 0 }, flags: id === "start" ? { classStart: true } : { small: true },
    } satisfies TreeNode])),
    edges: pairs.map(([from, to]) => ({ from, to })), groups: {}, classStarts: { WITCH: "start" },
    bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
  };
}

export function validationRequest(graph = validationGraph()): BuildGoalsOptimizeRequest {
  return { graph, mode: "shortest", rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"] };
}

export function validationResult(): BuildGoalsOptimizeResult {
  return {
    status: "success", totalNodeIds: ["start", "travel", "goal"], orderedNodeIds: ["start", "travel", "goal"],
    addedNodeIds: ["travel", "goal"], totalEdgeKeys: ["start::travel", "goal::travel"],
    addedEdgeKeys: ["start::travel", "goal::travel"], pointCost: 2, unreachableGoalNodeIds: [],
  };
}

// Tiny-graph oracle: raw edge scanning, no production adjacency/count/validation helpers.
export function independentlyValid(request: BuildGoalsOptimizeRequest, result: BuildGoalsOptimizeResult): boolean {
  const selected = new Set(result.totalNodeIds);
  const base = new Set(request.baseNodeIds);
  if (selected.size !== result.totalNodeIds.length || [...base, ...request.goalNodeIds].some((id) => !selected.has(id))) return false;
  if ([...selected].some((id) => !request.graph.nodes[id] || request.excludedNodeIds?.includes(id))) return false;
  const newIds = [...selected].filter((id) => !base.has(id));
  if (newIds.length !== result.pointCost || new Set(result.addedNodeIds).size !== newIds.length || newIds.some((id) => !result.addedNodeIds.includes(id))) return false;
  const chosenEdges = result.totalEdgeKeys.map((key) => key.split("::"));
  if (chosenEdges.some(([a, b]) => !selected.has(a) || !selected.has(b) || !request.graph.edges.some((e) => e.from === a && e.to === b || e.from === b && e.to === a))) return false;
  const seen = new Set([request.rootNodeId ?? request.baseNodeIds[0]]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [a, b] of chosenEdges) {
      if (seen.has(a) && !seen.has(b)) { seen.add(b); changed = true; }
      if (seen.has(b) && !seen.has(a)) { seen.add(a); changed = true; }
    }
  }
  return [...selected].every((id) => seen.has(id));
}

export function exhaustiveMinimum(request: BuildGoalsOptimizeRequest): number {
  const ids = Object.keys(request.graph.nodes).filter((id) => !request.baseNodeIds.includes(id));
  let best = Infinity;
  for (let mask = 0; mask < 2 ** ids.length; mask += 1) {
    const selected = new Set(request.baseNodeIds);
    ids.forEach((id, i) => { if (mask & (1 << i)) selected.add(id); });
    if (request.goalNodeIds.some((id) => !selected.has(id))) continue;
    const seen = new Set(request.baseNodeIds);
    let changed = true;
    while (changed) {
      changed = false;
      for (const { from, to } of request.graph.edges) {
        if (!selected.has(from) || !selected.has(to)) continue;
        if (seen.has(from) && !seen.has(to)) { seen.add(to); changed = true; }
        if (seen.has(to) && !seen.has(from)) { seen.add(from); changed = true; }
      }
    }
    if (seen.size === selected.size) best = Math.min(best, selected.size - new Set(request.baseNodeIds).size);
  }
  return best;
}

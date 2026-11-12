import { findShortestNodeCostRoutes, routeNodeIndexesFromSearch } from "./buildGoalsOptimizer";
import type { buildOptimizerGraph } from "./buildGoalsOptimizer";
import { treeEdgeKey } from "./pathAllocation";

type Solution = { nodeIndexes: Set<number>; edgeKeys: Set<string> };
type IndexedGraph = ReturnType<typeof buildOptimizerGraph>;

function adjacencyOf(solution: Solution, graph: IndexedGraph): Map<number, number[]> | undefined {
  const result = new Map([...solution.nodeIndexes].map((i) => [i, [] as number[]]));
  if ([...result.keys()].some((i) => !Number.isInteger(i) || !graph.nodeIds[i])) return;
  for (const key of solution.edgeKeys) {
    const ids = key.split("::"), a = graph.nodeIndexById.get(ids[0]), b = graph.nodeIndexById.get(ids[1]);
    if (ids.length !== 2 || a === undefined || b === undefined || !result.has(a) || !result.has(b) || !graph.adjacency[a].includes(b)) return;
    result.get(a)!.push(b); result.get(b)!.push(a);
  }
  for (const neighbors of result.values()) neighbors.sort((a, b) => a - b);
  return result;
}

function components(adjacency: Map<number, number[]>): number[][] {
  const seen = new Set<number>(), result: number[][] = [];
  for (const root of adjacency.keys()) {
    if (seen.has(root)) continue;
    const group = [root]; seen.add(root);
    for (let i = 0; i < group.length; i += 1) for (const next of adjacency.get(group[i])!) {
      if (!seen.has(next)) { seen.add(next); group.push(next); }
    }
    result.push(group.sort((a, b) => a - b));
  }
  return result;
}

// Remove one unprotected junction plus its degree-two arms. All boundary nodes
// stay allocated; only a fully reconnected replacement is eligible for scoring.
export function* weightedJunctionCandidates(
  solution: Solution, graph: IndexedGraph, requiredNodes: Set<number>, scores: number[], blocked: boolean[],
  maxPointCost: number, baseEdgeKeys: string[], shouldStop: () => boolean,
): Generator<Solution | undefined, void, unknown> {
  if (shouldStop() || !Number.isInteger(maxPointCost) || maxPointCost < 0 || !graph.baseNodeSet.size) return;
  const base = new Set([...graph.baseNodeSet].map((id) => graph.nodeIndexById.get(id)!));
  const required = new Set([...requiredNodes, ...base]);
  if ([...required].some((i) => !solution.nodeIndexes.has(i)) || baseEdgeKeys.some((key) => !solution.edgeKeys.has(key))) return;
  const adjacency = adjacencyOf(solution, graph);
  if (!adjacency || components(adjacency).length !== 1 || [...solution.nodeIndexes].some((i) => blocked[i] || !Number.isFinite(scores[i]))) return;
  const anchors = new Set([...solution.nodeIndexes].filter((i) => required.has(i) || adjacency.get(i)!.length !== 2));
  const regions: { junction: number; removed: Set<number>; remaining: Solution; groups: number[][]; loss: number }[] = [];
  for (const junction of [...solution.nodeIndexes].sort((a, b) => a - b)) {
    if (shouldStop()) return;
    const arms = adjacency.get(junction)!;
    if (required.has(junction) || arms.length < 3 || arms.length > 4) continue;
    const removed = new Set([junction]);
    let cyclic = false;
    for (const arm of arms) {
      let previous = junction, current = arm;
      while (!anchors.has(current)) {
        if (removed.has(current)) { cyclic = true; break; }
        removed.add(current);
        const next = adjacency.get(current)!.find((i) => i !== previous)!;
        previous = current; current = next;
      }
      if (current === junction) cyclic = true;
    }
    if (cyclic) continue;
    const remaining: Solution = {
      nodeIndexes: new Set([...solution.nodeIndexes].filter((i) => !removed.has(i))),
      edgeKeys: new Set([...solution.edgeKeys].filter((key) => key.split("::").every((id) => !removed.has(graph.nodeIndexById.get(id)!)))),
    };
    const kept = adjacencyOf(remaining, graph);
    if (!kept) continue;
    const groups = components(kept);
    if (groups.length < 3 || groups.length > 4 || groups.filter((group) => group.some((i) => required.has(i))).length < 3) continue;
    regions.push({ junction, removed, remaining, groups, loss: [...removed].reduce((sum, i) => sum + scores[i], 0) });
  }
  regions.sort((a, b) => a.loss / a.removed.size - b.loss / b.removed.size || b.removed.size - a.removed.size || a.junction - b.junction);
  const seen = new Set([[...solution.nodeIndexes].sort((a, b) => a - b).join("|")]);
  for (const { junction, remaining, groups } of regions.slice(0, 2)) for (const strength of [0, 0.125, 0.25, 0.5]) {
    if (shouldStop()) return;
    const costs = graph.nodeIds.map((_, i) => blocked[i] || !Number.isFinite(scores[i]) ? Infinity
      : remaining.nodeIndexes.has(i) ? 0 : Math.max(0.05, 1 - scores[i] * strength));
    const searches: ReturnType<typeof findShortestNodeCostRoutes>[] = [];
    for (const group of groups) {
      if (shouldStop()) return;
      searches.push(findShortestNodeCostRoutes(group, graph.adjacency, costs));
      yield;
    }
    if (shouldStop()) return;
    const ranked: { index: number; cost: number }[] = [];
    for (let index = 0; index < graph.nodeIds.length; index += 1) {
      if (index === junction || remaining.nodeIndexes.has(index) || graph.adjacency[index].length < 3 || !Number.isFinite(costs[index])) continue;
      if (searches.some((search) => !Number.isFinite(search.costs[index]))) continue;
      // Ranking only: shared nodes on the reconstructed paths are counted once below.
      ranked.push({ index, cost: searches.reduce((sum, search) => sum + search.costs[index], 0) - (groups.length - 1) * costs[index] });
    }
    ranked.sort((a, b) => a.cost - b.cost || scores[b.index] - scores[a.index] || a.index - b.index);
    for (const { index } of ranked.slice(0, 3)) {
      if (shouldStop()) return;
      const candidate: Solution = { nodeIndexes: new Set(remaining.nodeIndexes), edgeKeys: new Set(remaining.edgeKeys) };
      for (const search of searches) {
        const path = routeNodeIndexesFromSearch(search, index);
        path.forEach((i) => candidate.nodeIndexes.add(i));
        for (let i = 1; i < path.length; i += 1) candidate.edgeKeys.add(treeEdgeKey(graph.nodeIds[path[i - 1]], graph.nodeIds[path[i]]));
      }
      const key = [...candidate.nodeIndexes].sort((a, b) => a - b).join("|");
      const finalAdjacency = adjacencyOf(candidate, graph);
      if ([...candidate.nodeIndexes].filter((i) => !base.has(i)).length > maxPointCost || [...candidate.nodeIndexes].some((i) => blocked[i])
        || !finalAdjacency || components(finalAdjacency).length !== 1 || seen.has(key)) yield;
      else { seen.add(key); yield candidate; }
    }
  }
}

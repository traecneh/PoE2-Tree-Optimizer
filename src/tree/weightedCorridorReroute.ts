import { findShortestNodeCostRoutes, routeNodeIndexesFromSearch } from "./buildGoalsOptimizer";
import type { buildOptimizerGraph } from "./buildGoalsOptimizer";
import { treeEdgeKey } from "./pathAllocation";

type Solution = { nodeIndexes: Set<number>; edgeKeys: Set<string> };
type IndexedGraph = ReturnType<typeof buildOptimizerGraph>;

function neighbors(solution: Solution, graph: IndexedGraph): Map<number, number[]> | undefined {
  const result = new Map([...solution.nodeIndexes].map((index) => [index, [] as number[]]));
  for (const key of solution.edgeKeys) {
    const [a, b] = key.split("::").map((id) => graph.nodeIndexById.get(id));
    if (a === undefined || b === undefined || !result.has(a) || !result.has(b) || !graph.adjacency[a]?.includes(b)) return;
    result.get(a)!.push(b); result.get(b)!.push(a);
  }
  for (const adjacent of result.values()) adjacent.sort((a, b) => a - b);
  return result;
}

function reached(adjacency: Map<number, number[]>, root: number): Set<number> {
  const seen = new Set(adjacency.has(root) ? [root] : []), queue = [...seen];
  for (let i = 0; i < queue.length; i += 1) for (const next of adjacency.get(queue[i]) ?? []) {
    if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
  return seen;
}

// One yield per routing proposal, including rejected proposals, lets the existing
// scheduler bound deep work. Routing costs propose paths; whole-route score decides.
export function* weightedCorridorCandidates(
  solution: Solution, graph: IndexedGraph, requiredNodes: Set<number>, scores: number[], blocked: boolean[],
  maxPointCost: number, baseEdgeKeys: string[], shouldStop: () => boolean,
): Generator<Solution | undefined, void, unknown> {
  if (shouldStop() || !Number.isInteger(maxPointCost) || maxPointCost < 0) return;
  const base = new Set([...graph.baseNodeSet].map((id) => graph.nodeIndexById.get(id)!));
  const required = new Set([...requiredNodes, ...base]), root = base.values().next().value;
  if (root === undefined || [...required].some((i) => !solution.nodeIndexes.has(i))
    || baseEdgeKeys.some((key) => !solution.edgeKeys.has(key))) return;
  const adjacency = neighbors(solution, graph);
  if (!adjacency || reached(adjacency, root).size !== solution.nodeIndexes.size) return;
  const anchors = new Set([...solution.nodeIndexes].filter((i) => required.has(i) || adjacency.get(i)!.length !== 2));
  const visited = new Set<string>(), chains: number[][] = [];
  for (const anchor of [...anchors].sort((a, b) => a - b)) for (const neighbor of adjacency.get(anchor)!) {
    if (shouldStop()) return;
    const edge = treeEdgeKey(graph.nodeIds[anchor], graph.nodeIds[neighbor]);
    if (visited.has(edge)) continue;
    visited.add(edge);
    const interior: number[] = [];
    let previous = anchor, current = neighbor;
    while (!anchors.has(current)) {
      interior.push(current);
      const next = adjacency.get(current)!.find((i) => i !== previous)!;
      const key = treeEdgeKey(graph.nodeIds[current], graph.nodeIds[next]);
      if (visited.has(key)) break;
      visited.add(key); previous = current; current = next;
    }
    if (interior.length && current !== anchor) chains.push(interior);
  }
  const loss = (chain: number[]) => chain.reduce((sum, i) => sum + scores[i], 0);
  chains.sort((a, b) => loss(a) / a.length - loss(b) / b.length || b.length - a.length || a[0] - b[0]);
  const seen = new Set([[...solution.nodeIndexes].sort((a, b) => a - b).join("|")]);
  let attempted = 0;
  for (const chain of chains) {
    if (attempted >= 4) break;
    if (shouldStop()) return;
    const removed = new Set(chain);
    const remaining: Solution = {
      nodeIndexes: new Set([...solution.nodeIndexes].filter((i) => !removed.has(i))),
      edgeKeys: new Set([...solution.edgeKeys].filter((key) => key.split("::").every((id) => !removed.has(graph.nodeIndexById.get(id)!)))),
    };
    const keptAdjacency = neighbors(remaining, graph);
    if (!keptAdjacency) continue;
    const connected = reached(keptAdjacency, root);
    // Branch-only and redundant-cycle changes belong to the existing exchanges.
    if ([...required].every((i) => connected.has(i))) continue;
    attempted += 1;
    const detached = [...remaining.nodeIndexes].filter((i) => !connected.has(i)).sort((a, b) => a - b);
    for (const strength of [0, 0.125, 0.25, 0.5]) {
      if (shouldStop()) return;
      // Signed affine costs can cross a small negative gateway for a stronger
      // corridor. The positive floor keeps Dijkstra free of negative edges.
      const costs = graph.nodeIds.map((_, i) => blocked[i] || !Number.isFinite(scores[i]) ? Infinity
        : remaining.nodeIndexes.has(i) ? 0 : Math.max(0.05, 1 - scores[i] * strength));
      const search = findShortestNodeCostRoutes([...connected], graph.adjacency, costs);
      const target = detached.reduce((best, i) => search.costs[i] < search.costs[best] ? i : best, detached[0]);
      let candidate: Solution | undefined;
      if (target !== undefined && Number.isFinite(search.costs[target])) {
        candidate = { nodeIndexes: new Set(remaining.nodeIndexes), edgeKeys: new Set(remaining.edgeKeys) };
        const path = routeNodeIndexesFromSearch(search, target);
        path.forEach((i) => candidate!.nodeIndexes.add(i));
        for (let i = 1; i < path.length; i += 1) candidate.edgeKeys.add(treeEdgeKey(graph.nodeIds[path[i - 1]], graph.nodeIds[path[i]]));
        const key = [...candidate.nodeIndexes].sort((a, b) => a - b).join("|");
        const finalAdjacency = neighbors(candidate, graph);
        if ([...candidate.nodeIndexes].filter((i) => !base.has(i)).length > maxPointCost
          || [...candidate.nodeIndexes].some((i) => blocked[i]) || !finalAdjacency
          || reached(finalAdjacency, root).size !== candidate.nodeIndexes.size || seen.has(key)) candidate = undefined;
        else seen.add(key);
      }
      yield candidate;
    }
  }
}

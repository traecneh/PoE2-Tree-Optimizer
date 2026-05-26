import { isAllocatableTreeEdge, treeEdgeKey } from "./pathAllocation";
import type { NodeId, TreeGraph } from "./types";

export type BuildGoalsOptimizeMode = "shortest";

export type BuildGoalsOptimizeRequest = {
  graph: TreeGraph;
  baseNodeIds: NodeId[];
  baseEdgeKeys: string[];
  goalNodeIds: NodeId[];
  mode: BuildGoalsOptimizeMode;
};

export type BuildGoalsOptimizeResult = {
  status: "success" | "unreachable" | "cancelled" | "error";
  addedNodeIds: NodeId[];
  addedEdgeKeys: string[];
  totalNodeIds: NodeId[];
  totalEdgeKeys: string[];
  orderedNodeIds: NodeId[];
  pointCost: number;
  unreachableGoalNodeIds: NodeId[];
  message?: string;
};

type DpParent =
  | { type: "terminal" }
  | { type: "merge"; leftMask: number; rightMask: number }
  | { type: "move"; fromNodeIndex: number };

type IndexedGraph = {
  nodeIds: NodeId[];
  nodeIndexById: Map<NodeId, number>;
  adjacency: number[][];
  nodeCosts: number[];
  baseNodeSet: Set<NodeId>;
};

type SolutionSets = {
  nodeIndexes: Set<number>;
  edgeKeys: Set<string>;
};

type HeapEntry = {
  cost: number;
  nodeIndex: number;
};

type RouteSearch = {
  costs: Float64Array;
  previousNodeIndexes: Int32Array;
};

type Terminal = {
  label: string;
  nodeIndex?: number;
  search: RouteSearch;
};

type MetricEdge = {
  fromTerminalIndex: number;
  toTerminalIndex: number;
  cost: number;
};

const infinity = Number.POSITIVE_INFINITY;
const maxExactGoalCount = 10;
const maxExactStateCount = 6_000_000;

export function optimizeBuildGoals(request: BuildGoalsOptimizeRequest): BuildGoalsOptimizeResult {
  if (request.mode !== "shortest") {
    return emptyResult("error", "Unsupported build goal optimization mode.");
  }

  const baseNodeIds = uniqueValidNodeIds(request.baseNodeIds, request.graph);
  const requestedGoalNodeIds = uniqueValidNodeIds(request.goalNodeIds, request.graph);
  if (baseNodeIds.length === 0) {
    return emptyResult("unreachable", "No valid base path is available.", requestedGoalNodeIds);
  }

  const baseNodeSet = new Set(baseNodeIds);
  const goalNodeIds = requestedGoalNodeIds.filter((nodeId) => !baseNodeSet.has(nodeId));
  const baseEdgeKeys = uniqueEdgeKeys(request.baseEdgeKeys);
  const adjacency = buildAdjacency(request.graph);
  const unreachableGoalNodeIds = unreachableGoals(adjacency, baseNodeSet, goalNodeIds);

  if (unreachableGoalNodeIds.length > 0) {
    return {
      status: "unreachable",
      addedNodeIds: [],
      addedEdgeKeys: [],
      totalNodeIds: baseNodeIds,
      totalEdgeKeys: baseEdgeKeys,
      orderedNodeIds: baseNodeIds,
      pointCost: 0,
      unreachableGoalNodeIds,
      message: "Some build goals cannot be reached from the current path.",
    };
  }

  if (goalNodeIds.length === 0) {
    return {
      status: "success",
      addedNodeIds: [],
      addedEdgeKeys: [],
      totalNodeIds: baseNodeIds,
      totalEdgeKeys: baseEdgeKeys,
      orderedNodeIds: baseNodeIds,
      pointCost: 0,
      unreachableGoalNodeIds: [],
    };
  }

  try {
    return shouldUseExactShortestTree(request.graph, goalNodeIds.length)
      ? solveExactShortestTree(request.graph, adjacency, baseNodeIds, baseEdgeKeys, goalNodeIds)
      : solveBoundedShortestRoute(request.graph, adjacency, baseNodeIds, baseEdgeKeys, goalNodeIds);
  } catch (error) {
    return emptyResult(
      "error",
      error instanceof Error ? error.message : "Build goal optimization failed.",
    );
  }
}

function shouldUseExactShortestTree(graph: TreeGraph, goalCount: number): boolean {
  return goalCount <= maxExactGoalCount
    && (2 ** goalCount) * Object.keys(graph.nodes).length <= maxExactStateCount;
}

function solveExactShortestTree(
  graph: TreeGraph,
  adjacencyById: Map<NodeId, NodeId[]>,
  baseNodeIds: NodeId[],
  baseEdgeKeys: string[],
  goalNodeIds: NodeId[],
): BuildGoalsOptimizeResult {
  const goalCount = goalNodeIds.length;
  if (goalCount > 30) {
    throw new Error("Too many goals for one exact shortest-route run.");
  }

  const maskCount = 2 ** goalCount;
  const indexedGraph = buildIndexedGraph(graph, adjacencyById, baseNodeIds);
  const { nodeIds, nodeIndexById, adjacency, nodeCosts } = indexedGraph;
  const nodeCount = nodeIds.length;
  const costs = Array.from({ length: maskCount }, () => {
    const row = new Float64Array(nodeCount);
    row.fill(infinity);
    return row;
  });
  const parents: Array<Array<DpParent | undefined>> = Array.from(
    { length: maskCount },
    () => new Array<DpParent | undefined>(nodeCount),
  );

  goalNodeIds.forEach((goalNodeId, goalIndex) => {
    const nodeIndex = nodeIndexById.get(goalNodeId);
    if (nodeIndex === undefined) return;
    const mask = 1 << goalIndex;
    costs[mask][nodeIndex] = nodeCosts[nodeIndex];
    parents[mask][nodeIndex] = { type: "terminal" };
  });

  for (let mask = 1; mask < maskCount; mask += 1) {
    mergeSubsetsAtEachNode(mask, costs, parents, nodeCosts);
    relaxMaskAcrossGraph(costs[mask], parents[mask], adjacency, nodeCosts);
  }

  const fullMask = maskCount - 1;
  const bestBaseNodeIndex = findBestBaseNodeIndex(baseNodeIds, nodeIndexById, costs[fullMask]);
  if (bestBaseNodeIndex === undefined) {
    return {
      status: "unreachable",
      addedNodeIds: [],
      addedEdgeKeys: [],
      totalNodeIds: baseNodeIds,
      totalEdgeKeys: baseEdgeKeys,
      orderedNodeIds: baseNodeIds,
      pointCost: 0,
      unreachableGoalNodeIds: goalNodeIds,
      message: "No route could connect all build goals.",
    };
  }

  const solution = collectSolution(fullMask, bestBaseNodeIndex, parents, nodeIds);
  const baseEdgeKeySet = new Set(baseEdgeKeys);
  const addedEdgeKeys = Array.from(solution.edgeKeys).filter((edgeKey) => !baseEdgeKeySet.has(edgeKey));
  const totalEdgeKeys = mergeOrdered(baseEdgeKeys, addedEdgeKeys);
  const orderedNodeIds = orderConnectedSolutionNodeIds(
    baseNodeIds,
    nodeIdsFromIndexes(nodeIds, solution.nodeIndexes),
    totalEdgeKeys,
  );
  const addedNodeIds = orderedNodeIds.filter((nodeId) => !indexedGraph.baseNodeSet.has(nodeId));

  return {
    status: "success",
    addedNodeIds,
    addedEdgeKeys: orderEdgeKeysByNodeOrder(addedEdgeKeys, orderedNodeIds),
    totalNodeIds: orderedNodeIds,
    totalEdgeKeys: orderEdgeKeysByNodeOrder(totalEdgeKeys, orderedNodeIds),
    orderedNodeIds,
    pointCost: addedNodeIds.length,
    unreachableGoalNodeIds: [],
  };
}

function solveBoundedShortestRoute(
  graph: TreeGraph,
  adjacencyById: Map<NodeId, NodeId[]>,
  baseNodeIds: NodeId[],
  baseEdgeKeys: string[],
  goalNodeIds: NodeId[],
): BuildGoalsOptimizeResult {
  const indexedGraph = buildIndexedGraph(graph, adjacencyById, baseNodeIds);
  const { nodeIds, nodeIndexById, adjacency, nodeCosts, baseNodeSet } = indexedGraph;
  const baseNodeIndexes = baseNodeIds
    .map((nodeId) => nodeIndexById.get(nodeId))
    .filter((nodeIndex): nodeIndex is number => nodeIndex !== undefined);
  const terminals: Terminal[] = [{
    label: "base",
    search: findShortestNodeCostRoutes(baseNodeIndexes, adjacency, nodeCosts),
  }];

  for (const goalNodeId of goalNodeIds) {
    const goalNodeIndex = nodeIndexById.get(goalNodeId);
    if (goalNodeIndex === undefined) continue;
    terminals.push({
      label: goalNodeId,
      nodeIndex: goalNodeIndex,
      search: findShortestNodeCostRoutes([goalNodeIndex], adjacency, nodeCosts),
    });
  }

  const metricEdges = buildTerminalMetricEdges(terminals);
  const selectedMetricEdges = minimumSpanningMetricEdges(metricEdges, terminals.length);
  if (selectedMetricEdges.length !== terminals.length - 1) {
    return {
      status: "unreachable",
      addedNodeIds: [],
      addedEdgeKeys: [],
      totalNodeIds: baseNodeIds,
      totalEdgeKeys: baseEdgeKeys,
      orderedNodeIds: baseNodeIds,
      pointCost: 0,
      unreachableGoalNodeIds: goalNodeIds,
      message: "No bounded-memory route could connect all build goals.",
    };
  }

  const solutionNodeIndexes = new Set<number>(baseNodeIndexes);
  const solutionEdgeKeys = new Set<string>();
  for (const selectedEdge of selectedMetricEdges) {
    const toTerminal = terminals[selectedEdge.toTerminalIndex];
    if (toTerminal.nodeIndex === undefined) continue;
    const routeNodeIndexes = routeNodeIndexesFromSearch(
      terminals[selectedEdge.fromTerminalIndex].search,
      toTerminal.nodeIndex,
    );

    routeNodeIndexes.forEach((nodeIndex) => solutionNodeIndexes.add(nodeIndex));
    for (let index = 1; index < routeNodeIndexes.length; index += 1) {
      solutionEdgeKeys.add(treeEdgeKey(nodeIds[routeNodeIndexes[index - 1]], nodeIds[routeNodeIndexes[index]]));
    }
  }

  const baseEdgeKeySet = new Set(baseEdgeKeys);
  const addedEdgeKeys = Array.from(solutionEdgeKeys).filter((edgeKey) => !baseEdgeKeySet.has(edgeKey));
  const totalEdgeKeys = mergeOrdered(baseEdgeKeys, addedEdgeKeys);
  const orderedNodeIds = orderConnectedSolutionNodeIds(
    baseNodeIds,
    nodeIdsFromIndexes(nodeIds, solutionNodeIndexes),
    totalEdgeKeys,
  );
  const addedNodeIds = orderedNodeIds.filter((nodeId) => !baseNodeSet.has(nodeId));

  return {
    status: "success",
    addedNodeIds,
    addedEdgeKeys: orderEdgeKeysByNodeOrder(addedEdgeKeys, orderedNodeIds),
    totalNodeIds: orderedNodeIds,
    totalEdgeKeys: orderEdgeKeysByNodeOrder(totalEdgeKeys, orderedNodeIds),
    orderedNodeIds,
    pointCost: addedNodeIds.length,
    unreachableGoalNodeIds: [],
    message: "Used bounded-memory route search for this large build goal set.",
  };
}

function findShortestNodeCostRoutes(
  startNodeIndexes: number[],
  adjacency: number[][],
  nodeCosts: number[],
): RouteSearch {
  const costs = new Float64Array(adjacency.length);
  costs.fill(infinity);
  const previousNodeIndexes = new Int32Array(adjacency.length);
  previousNodeIndexes.fill(-1);
  const heap: HeapEntry[] = [];

  for (const startNodeIndex of startNodeIndexes) {
    costs[startNodeIndex] = 0;
    heapPush(heap, { cost: 0, nodeIndex: startNodeIndex });
  }

  while (heap.length > 0) {
    const entry = heapPop(heap);
    if (!entry || entry.cost !== costs[entry.nodeIndex]) continue;

    for (const nextNodeIndex of adjacency[entry.nodeIndex]) {
      const candidate = entry.cost + nodeCosts[nextNodeIndex];
      if (candidate >= costs[nextNodeIndex]) continue;
      costs[nextNodeIndex] = candidate;
      previousNodeIndexes[nextNodeIndex] = entry.nodeIndex;
      heapPush(heap, { cost: candidate, nodeIndex: nextNodeIndex });
    }
  }

  return { costs, previousNodeIndexes };
}

function buildTerminalMetricEdges(terminals: Terminal[]): MetricEdge[] {
  const edges: MetricEdge[] = [];
  for (let fromTerminalIndex = 0; fromTerminalIndex < terminals.length; fromTerminalIndex += 1) {
    for (let toTerminalIndex = fromTerminalIndex + 1; toTerminalIndex < terminals.length; toTerminalIndex += 1) {
      const toNodeIndex = terminals[toTerminalIndex].nodeIndex;
      if (toNodeIndex === undefined) continue;
      const cost = terminals[fromTerminalIndex].search.costs[toNodeIndex];
      if (!Number.isFinite(cost)) continue;
      edges.push({ fromTerminalIndex, toTerminalIndex, cost });
    }
  }

  return edges.sort((left, right) => (
    left.cost - right.cost
    || terminals[left.fromTerminalIndex].label.localeCompare(terminals[right.fromTerminalIndex].label)
    || terminals[left.toTerminalIndex].label.localeCompare(terminals[right.toTerminalIndex].label)
  ));
}

function minimumSpanningMetricEdges(metricEdges: MetricEdge[], terminalCount: number): MetricEdge[] {
  const parents = Array.from({ length: terminalCount }, (_value, index) => index);
  const selectedEdges: MetricEdge[] = [];

  for (const edge of metricEdges) {
    const leftRoot = findTerminalRoot(parents, edge.fromTerminalIndex);
    const rightRoot = findTerminalRoot(parents, edge.toTerminalIndex);
    if (leftRoot === rightRoot) continue;
    parents[rightRoot] = leftRoot;
    selectedEdges.push(edge);
    if (selectedEdges.length === terminalCount - 1) break;
  }

  return selectedEdges;
}

function findTerminalRoot(parents: number[], terminalIndex: number): number {
  let current = terminalIndex;
  while (parents[current] !== current) {
    parents[current] = parents[parents[current]];
    current = parents[current];
  }
  return current;
}

function routeNodeIndexesFromSearch(search: RouteSearch, targetNodeIndex: number): number[] {
  const routeNodeIndexes: number[] = [];
  let current = targetNodeIndex;

  while (current !== -1) {
    routeNodeIndexes.push(current);
    current = search.previousNodeIndexes[current];
  }

  routeNodeIndexes.reverse();
  return routeNodeIndexes;
}

function mergeSubsetsAtEachNode(
  mask: number,
  costs: Float64Array[],
  parents: Array<Array<DpParent | undefined>>,
  nodeCosts: number[],
) {
  for (let leftMask = (mask - 1) & mask; leftMask > 0; leftMask = (leftMask - 1) & mask) {
    const rightMask = mask ^ leftMask;
    if (leftMask > rightMask || rightMask === 0) continue;

    const leftCosts = costs[leftMask];
    const rightCosts = costs[rightMask];
    const targetCosts = costs[mask];
    const targetParents = parents[mask];
    for (let nodeIndex = 0; nodeIndex < targetCosts.length; nodeIndex += 1) {
      const candidate = leftCosts[nodeIndex] + rightCosts[nodeIndex] - nodeCosts[nodeIndex];
      if (candidate < targetCosts[nodeIndex]) {
        targetCosts[nodeIndex] = candidate;
        targetParents[nodeIndex] = { type: "merge", leftMask, rightMask };
      }
    }
  }
}

function relaxMaskAcrossGraph(
  maskCosts: Float64Array,
  maskParents: Array<DpParent | undefined>,
  adjacency: number[][],
  nodeCosts: number[],
) {
  const heap: HeapEntry[] = [];
  for (let nodeIndex = 0; nodeIndex < maskCosts.length; nodeIndex += 1) {
    if (Number.isFinite(maskCosts[nodeIndex])) {
      heapPush(heap, { cost: maskCosts[nodeIndex], nodeIndex });
    }
  }

  while (heap.length > 0) {
    const entry = heapPop(heap);
    if (!entry || entry.cost !== maskCosts[entry.nodeIndex]) continue;

    for (const nextNodeIndex of adjacency[entry.nodeIndex]) {
      const candidate = entry.cost + nodeCosts[nextNodeIndex];
      if (candidate < maskCosts[nextNodeIndex]) {
        maskCosts[nextNodeIndex] = candidate;
        maskParents[nextNodeIndex] = { type: "move", fromNodeIndex: entry.nodeIndex };
        heapPush(heap, { cost: candidate, nodeIndex: nextNodeIndex });
      }
    }
  }
}

function findBestBaseNodeIndex(
  baseNodeIds: NodeId[],
  nodeIndexById: Map<NodeId, number>,
  fullCosts: Float64Array,
): number | undefined {
  let bestNodeIndex: number | undefined;
  let bestCost = infinity;

  for (const baseNodeId of baseNodeIds) {
    const nodeIndex = nodeIndexById.get(baseNodeId);
    if (nodeIndex === undefined) continue;
    const cost = fullCosts[nodeIndex];
    if (cost < bestCost) {
      bestCost = cost;
      bestNodeIndex = nodeIndex;
    }
  }

  return Number.isFinite(bestCost) ? bestNodeIndex : undefined;
}

function collectSolution(
  mask: number,
  nodeIndex: number,
  parents: Array<Array<DpParent | undefined>>,
  nodeIds: NodeId[],
): SolutionSets {
  const solution: SolutionSets = {
    nodeIndexes: new Set<number>(),
    edgeKeys: new Set<string>(),
  };
  const visitedStates = new Set<string>();

  collectState(mask, nodeIndex);

  return solution;

  function collectState(currentMask: number, currentNodeIndex: number) {
    const stateKey = `${currentMask}:${currentNodeIndex}`;
    if (visitedStates.has(stateKey)) return;
    visitedStates.add(stateKey);
    solution.nodeIndexes.add(currentNodeIndex);

    const parent = parents[currentMask][currentNodeIndex];
    if (!parent || parent.type === "terminal") return;

    if (parent.type === "merge") {
      collectState(parent.leftMask, currentNodeIndex);
      collectState(parent.rightMask, currentNodeIndex);
      return;
    }

    solution.edgeKeys.add(treeEdgeKey(nodeIds[parent.fromNodeIndex], nodeIds[currentNodeIndex]));
    collectState(currentMask, parent.fromNodeIndex);
  }
}

function buildIndexedGraph(
  graph: TreeGraph,
  adjacencyById: Map<NodeId, NodeId[]>,
  baseNodeIds: NodeId[],
): IndexedGraph {
  const nodeIds = Object.keys(graph.nodes).sort(compareNodeIds);
  const nodeIndexById = new Map(nodeIds.map((nodeId, index) => [nodeId, index]));
  const baseNodeSet = new Set(baseNodeIds);
  const adjacency = nodeIds.map((nodeId) => (
    (adjacencyById.get(nodeId) ?? [])
      .map((neighborNodeId) => nodeIndexById.get(neighborNodeId))
      .filter((neighborNodeIndex): neighborNodeIndex is number => neighborNodeIndex !== undefined)
      .sort((left, right) => compareNodeIds(nodeIds[left], nodeIds[right]))
  ));
  const nodeCosts = nodeIds.map((nodeId) => (baseNodeSet.has(nodeId) ? 0 : 1));

  return {
    nodeIds,
    nodeIndexById,
    adjacency,
    nodeCosts,
    baseNodeSet,
  };
}

function emptyResult(
  status: BuildGoalsOptimizeResult["status"],
  message?: string,
  unreachableGoalNodeIds: NodeId[] = [],
): BuildGoalsOptimizeResult {
  return {
    status,
    addedNodeIds: [],
    addedEdgeKeys: [],
    totalNodeIds: [],
    totalEdgeKeys: [],
    orderedNodeIds: [],
    pointCost: 0,
    unreachableGoalNodeIds,
    message,
  };
}

function unreachableGoals(
  adjacency: Map<NodeId, NodeId[]>,
  baseNodeSet: ReadonlySet<NodeId>,
  goalNodeIds: NodeId[],
): NodeId[] {
  const reachableNodeIds = new Set<NodeId>();
  const queue = Array.from(baseNodeSet);

  for (const nodeId of queue) {
    reachableNodeIds.add(nodeId);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of adjacency.get(current) ?? []) {
      if (reachableNodeIds.has(next)) continue;
      reachableNodeIds.add(next);
      queue.push(next);
    }
  }

  return goalNodeIds.filter((nodeId) => !reachableNodeIds.has(nodeId));
}

function buildAdjacency(graph: TreeGraph): Map<NodeId, NodeId[]> {
  const adjacency = new Map<NodeId, NodeId[]>();
  for (const edge of graph.edges) {
    if (!isAllocatableTreeEdge(graph, edge)) continue;
    appendNeighbor(adjacency, edge.from, edge.to);
    appendNeighbor(adjacency, edge.to, edge.from);
  }

  for (const neighbors of adjacency.values()) {
    neighbors.sort(compareNodeIds);
  }

  return adjacency;
}

function appendNeighbor(adjacency: Map<NodeId, NodeId[]>, from: NodeId, to: NodeId) {
  const neighbors = adjacency.get(from);
  if (neighbors) neighbors.push(to);
  else adjacency.set(from, [to]);
}

function uniqueValidNodeIds(nodeIds: NodeId[], graph: TreeGraph): NodeId[] {
  return uniqueOrdered(nodeIds).filter((nodeId) => Boolean(graph.nodes[nodeId]));
}

function uniqueEdgeKeys(edgeKeys: string[]): string[] {
  return uniqueOrdered(edgeKeys);
}

function uniqueOrdered<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function mergeOrdered<T>(...groups: T[][]): T[] {
  return uniqueOrdered(groups.flat());
}

function nodeIdsFromIndexes(nodeIds: NodeId[], nodeIndexes: ReadonlySet<number>): NodeId[] {
  return Array.from(nodeIndexes)
    .map((nodeIndex) => nodeIds[nodeIndex])
    .sort(compareNodeIds);
}

function orderConnectedSolutionNodeIds(
  baseNodeIds: NodeId[],
  solutionNodeIds: NodeId[],
  totalEdgeKeys: string[],
): NodeId[] {
  const solutionNodeIdSet = new Set(mergeOrdered(baseNodeIds, solutionNodeIds));
  const adjacency = buildEdgeKeyAdjacency(totalEdgeKeys);
  const orderedNodeIds = mergeOrdered(baseNodeIds);
  const orderedNodeIdSet = new Set(orderedNodeIds);
  const queue = [...orderedNodeIds];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of adjacency.get(current) ?? []) {
      if (orderedNodeIdSet.has(next) || !solutionNodeIdSet.has(next)) continue;
      orderedNodeIdSet.add(next);
      orderedNodeIds.push(next);
      queue.push(next);
    }
  }

  for (const nodeId of solutionNodeIds) {
    if (orderedNodeIdSet.has(nodeId)) continue;
    orderedNodeIdSet.add(nodeId);
    orderedNodeIds.push(nodeId);
  }

  return orderedNodeIds;
}

function buildEdgeKeyAdjacency(edgeKeys: string[]): Map<NodeId, NodeId[]> {
  const adjacency = new Map<NodeId, NodeId[]>();
  for (const edgeKey of edgeKeys) {
    const [from, to] = edgeKeyNodeIds(edgeKey);
    appendNeighbor(adjacency, from, to);
    appendNeighbor(adjacency, to, from);
  }

  for (const neighbors of adjacency.values()) {
    neighbors.sort(compareNodeIds);
  }

  return adjacency;
}

function edgeKeyNodeIds(edgeKey: string): [NodeId, NodeId] {
  const [from, to] = edgeKey.split("::");
  return [from, to];
}

function orderEdgeKeysByNodeOrder(edgeKeys: string[], orderedNodeIds: NodeId[]): string[] {
  const nodeOrder = new Map(orderedNodeIds.map((nodeId, index) => [nodeId, index]));
  return [...edgeKeys].sort((left, right) => {
    const [leftFrom, leftTo] = edgeKeyNodeIds(left);
    const [rightFrom, rightTo] = edgeKeyNodeIds(right);
    const leftOrder = Math.min(nodeOrder.get(leftFrom) ?? infinity, nodeOrder.get(leftTo) ?? infinity);
    const rightOrder = Math.min(nodeOrder.get(rightFrom) ?? infinity, nodeOrder.get(rightTo) ?? infinity);
    return leftOrder - rightOrder || compareNodeIds(left, right);
  });
}

function heapPush(heap: HeapEntry[], entry: HeapEntry) {
  heap.push(entry);
  let index = heap.length - 1;
  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2);
    if (compareHeapEntries(heap[parentIndex], entry) <= 0) break;
    heap[index] = heap[parentIndex];
    index = parentIndex;
  }
  heap[index] = entry;
}

function heapPop(heap: HeapEntry[]): HeapEntry | undefined {
  if (heap.length === 0) return undefined;
  const first = heap[0];
  const last = heap.pop();
  if (!last || heap.length === 0) return first;

  let index = 0;
  while (true) {
    const leftIndex = index * 2 + 1;
    const rightIndex = leftIndex + 1;
    if (leftIndex >= heap.length) break;

    const childIndex = rightIndex < heap.length && compareHeapEntries(heap[rightIndex], heap[leftIndex]) < 0
      ? rightIndex
      : leftIndex;
    if (compareHeapEntries(heap[childIndex], last) >= 0) break;
    heap[index] = heap[childIndex];
    index = childIndex;
  }

  heap[index] = last;
  return first;
}

function compareHeapEntries(left: HeapEntry, right: HeapEntry): number {
  return left.cost - right.cost || left.nodeIndex - right.nodeIndex;
}

function compareNodeIds(left: NodeId, right: NodeId): number {
  return left.localeCompare(right);
}

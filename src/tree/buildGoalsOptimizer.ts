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
  searchType?: "exact" | "bounded" | "anytime";
  completeReason?: "exact" | "bounded" | "no-improvement" | "iteration-limit" | "cancelled";
  routeCandidates?: BuildGoalsRouteCandidate[];
  improvementHistory?: number[];
};

export type BuildGoalsRouteCandidate = {
  addedNodeIds: NodeId[];
  addedEdgeKeys: string[];
  totalNodeIds: NodeId[];
  totalEdgeKeys: string[];
  orderedNodeIds: NodeId[];
  pointCost: number;
  label?: string;
};

export type BuildGoalsAnytimeOptions = {
  noImprovementMs?: number;
  maxIterations?: number;
  candidateLimit?: number;
  randomSeedStart?: number;
  now?: () => number;
  shouldCancel?: () => boolean;
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
const defaultNoImprovementMs = 60_000;
const defaultRouteCandidateLimit = 5;

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

export function optimizeBuildGoalsAnytime(
  request: BuildGoalsOptimizeRequest,
  onProgress: (result: BuildGoalsOptimizeResult) => void = () => undefined,
  options: BuildGoalsAnytimeOptions = {},
): BuildGoalsOptimizeResult {
  if (request.mode !== "shortest") {
    const result = emptyResult("error", "Unsupported build goal optimization mode.");
    onProgress(result);
    return result;
  }

  const baseNodeIds = uniqueValidNodeIds(request.baseNodeIds, request.graph);
  const requestedGoalNodeIds = uniqueValidNodeIds(request.goalNodeIds, request.graph);
  const baseNodeSet = new Set(baseNodeIds);
  const goalNodeIds = requestedGoalNodeIds.filter((nodeId) => !baseNodeSet.has(nodeId));
  const baseEdgeKeys = uniqueEdgeKeys(request.baseEdgeKeys);

  if (baseNodeIds.length === 0 || shouldUseExactShortestTree(request.graph, goalNodeIds.length)) {
    const result = annotateCompletedResult(optimizeBuildGoals(request), shouldUseExactShortestTree(request.graph, goalNodeIds.length) ? "exact" : undefined);
    onProgress(result);
    return result;
  }

  const adjacency = buildAdjacency(request.graph);
  const unreachableGoalNodeIds = unreachableGoals(adjacency, baseNodeSet, goalNodeIds);
  if (unreachableGoalNodeIds.length > 0 || goalNodeIds.length === 0) {
    const result = annotateCompletedResult(optimizeBuildGoals(request), "bounded");
    onProgress(result);
    return result;
  }

  const indexedGraph = buildIndexedGraph(request.graph, adjacency, baseNodeIds);
  const terminals = buildRouteTerminals(goalNodeIds, indexedGraph);
  const metricEdges = buildTerminalMetricEdges(terminals);
  const candidateLimit = options.candidateLimit ?? defaultRouteCandidateLimit;
  const noImprovementMs = options.noImprovementMs ?? defaultNoImprovementMs;
  const now = options.now ?? (() => Date.now());
  const routeCandidates: BuildGoalsRouteCandidate[] = [];
  const candidateSignatures = new Set<string>();
  const improvementHistory: number[] = [];
  let bestResult: BuildGoalsOptimizeResult | undefined;
  let lastImprovementAt = now();

  function considerCandidate(candidate: BuildGoalsRouteCandidate): boolean {
    if (!Number.isFinite(candidate.pointCost)) return false;
    const signature = routeCandidateSignature(candidate);
    if (!candidateSignatures.has(signature)) {
      candidateSignatures.add(signature);
      routeCandidates.push(candidate);
      routeCandidates.sort(compareRouteCandidates);
      routeCandidates.splice(candidateLimit);
    }

    if (bestResult && candidate.pointCost >= bestResult.pointCost) return false;

    improvementHistory.push(candidate.pointCost);
    bestResult = resultFromRouteCandidate(candidate, {
      routeCandidates,
      improvementHistory,
      searchType: "anytime",
    });
    lastImprovementAt = now();
    onProgress(bestResult);
    return true;
  }

  considerCandidate(routeCandidateFromSolution(
    "current bounded route",
    materializeMetricEdges(minimumSpanningMetricEdges(metricEdges, terminals.length), terminals, indexedGraph),
    baseNodeIds,
    baseEdgeKeys,
    indexedGraph,
  ));
  considerCandidate(routeCandidateFromSolution(
    "marginal greedy route",
    buildMarginalGreedySolution(terminals, metricEdges, indexedGraph),
    baseNodeIds,
    baseEdgeKeys,
    indexedGraph,
  ));

  const maxIterations = options.maxIterations;
  let iteration = 0;
  let seed = options.randomSeedStart ?? 1;

  while (!options.shouldCancel?.()) {
    if (maxIterations === undefined) {
      if (now() - lastImprovementAt >= noImprovementMs) break;
    } else if (iteration >= maxIterations) {
      break;
    }

    const rng = mulberry32(seed);
    considerCandidate(routeCandidateFromSolution(
      `random marginal route ${seed}`,
      buildMarginalGreedySolution(terminals, metricEdges, indexedGraph, rng),
      baseNodeIds,
      baseEdgeKeys,
      indexedGraph,
    ));
    considerCandidate(routeCandidateFromSolution(
      `randomized route ${seed}`,
      materializeMetricEdges(randomizedMetricEdges(metricEdges, terminals.length, rng), terminals, indexedGraph),
      baseNodeIds,
      baseEdgeKeys,
      indexedGraph,
    ));

    iteration += 1;
    seed += 1;
  }

  if (!bestResult) {
    return emptyResult("unreachable", "No bounded-memory route could connect all build goals.", goalNodeIds);
  }

  if (options.shouldCancel?.()) {
    return {
      ...bestResult,
      status: "cancelled",
      completeReason: "cancelled",
      message: "Build goal optimization was cancelled.",
    };
  }

  return {
    ...bestResult,
    routeCandidates: [...routeCandidates],
    improvementHistory: [...improvementHistory],
    completeReason: maxIterations !== undefined && iteration >= maxIterations ? "iteration-limit" : "no-improvement",
    message: maxIterations !== undefined && iteration >= maxIterations
      ? "Stopped after the configured iteration limit."
      : "Stopped after 60 seconds without finding a better route.",
  };
}

function shouldUseExactShortestTree(graph: TreeGraph, goalCount: number): boolean {
  return goalCount <= maxExactGoalCount
    && (2 ** goalCount) * Object.keys(graph.nodes).length <= maxExactStateCount;
}

function buildRouteTerminals(goalNodeIds: NodeId[], indexedGraph: IndexedGraph): Terminal[] {
  const { nodeIndexById, adjacency, nodeCosts } = indexedGraph;
  const baseNodeIndexes = Array.from(indexedGraph.baseNodeSet)
    .map((nodeId) => nodeIndexById.get(nodeId))
    .filter((nodeIndex): nodeIndex is number => nodeIndex !== undefined);
  const terminals: Terminal[] = [{
    label: "base",
    search: findShortestNodeCostRoutes(baseNodeIndexes, adjacency, nodeCosts),
  }];

  for (const goalNodeId of goalNodeIds) {
    const nodeIndex = nodeIndexById.get(goalNodeId);
    if (nodeIndex === undefined) continue;
    terminals.push({
      label: goalNodeId,
      nodeIndex,
      search: findShortestNodeCostRoutes([nodeIndex], adjacency, nodeCosts),
    });
  }

  return terminals;
}

function buildMarginalGreedySolution(
  terminals: Terminal[],
  metricEdges: MetricEdge[],
  indexedGraph: IndexedGraph,
  rng?: () => number,
): SolutionSets {
  const connectedTerminalIndexes = new Set<number>([0]);
  const solution: SolutionSets = {
    nodeIndexes: new Set(Array.from(indexedGraph.baseNodeSet)
      .map((nodeId) => indexedGraph.nodeIndexById.get(nodeId))
      .filter((nodeIndex): nodeIndex is number => nodeIndex !== undefined)),
    edgeKeys: new Set<string>(),
  };

  while (connectedTerminalIndexes.size < terminals.length) {
    const rankedRoutes: Array<{
      routeNodeIndexes: number[];
      toTerminalIndex: number;
      marginalCost: number;
      metricCost: number;
    }> = [];

    for (const metricEdge of metricEdges) {
      const fromConnected = connectedTerminalIndexes.has(metricEdge.fromTerminalIndex);
      const toConnected = connectedTerminalIndexes.has(metricEdge.toTerminalIndex);
      if (fromConnected === toConnected) continue;

      const fromTerminalIndex = fromConnected ? metricEdge.fromTerminalIndex : metricEdge.toTerminalIndex;
      const toTerminalIndex = fromConnected ? metricEdge.toTerminalIndex : metricEdge.fromTerminalIndex;
      const toNodeIndex = terminals[toTerminalIndex].nodeIndex;
      if (toNodeIndex === undefined) continue;

      const routeNodeIndexes = routeNodeIndexesFromSearch(terminals[fromTerminalIndex].search, toNodeIndex);
      const marginalCost = routeNodeIndexes.reduce(
        (cost, nodeIndex) => cost + (solution.nodeIndexes.has(nodeIndex) ? 0 : indexedGraph.nodeCosts[nodeIndex]),
        0,
      );
      rankedRoutes.push({ routeNodeIndexes, toTerminalIndex, marginalCost, metricCost: metricEdge.cost });
    }

    rankedRoutes.sort((left, right) => left.marginalCost - right.marginalCost || left.metricCost - right.metricCost);
    const selectedRouteIndex = rng ? Math.floor(rng() * Math.min(5, rankedRoutes.length)) : 0;
    const selectedRoute = rankedRoutes[selectedRouteIndex];
    if (!selectedRoute) break;

    connectedTerminalIndexes.add(selectedRoute.toTerminalIndex);
    selectedRoute.routeNodeIndexes.forEach((nodeIndex) => solution.nodeIndexes.add(nodeIndex));
    addRouteEdgeKeys(selectedRoute.routeNodeIndexes, indexedGraph.nodeIds, solution.edgeKeys);
  }

  return pruneSolution(solution, terminals, indexedGraph);
}

function materializeMetricEdges(
  selectedMetricEdges: MetricEdge[],
  terminals: Terminal[],
  indexedGraph: IndexedGraph,
): SolutionSets {
  const solution: SolutionSets = {
    nodeIndexes: new Set(Array.from(indexedGraph.baseNodeSet)
      .map((nodeId) => indexedGraph.nodeIndexById.get(nodeId))
      .filter((nodeIndex): nodeIndex is number => nodeIndex !== undefined)),
    edgeKeys: new Set<string>(),
  };

  for (const selectedEdge of selectedMetricEdges) {
    const toTerminal = terminals[selectedEdge.toTerminalIndex];
    if (toTerminal.nodeIndex === undefined) continue;
    const routeNodeIndexes = routeNodeIndexesFromSearch(
      terminals[selectedEdge.fromTerminalIndex].search,
      toTerminal.nodeIndex,
    );
    routeNodeIndexes.forEach((nodeIndex) => solution.nodeIndexes.add(nodeIndex));
    addRouteEdgeKeys(routeNodeIndexes, indexedGraph.nodeIds, solution.edgeKeys);
  }

  return pruneSolution(solution, terminals, indexedGraph);
}

function pruneSolution(solution: SolutionSets, terminals: Terminal[], indexedGraph: IndexedGraph): SolutionSets {
  const terminalNodeIndexes = new Set<number>();
  for (const terminal of terminals) {
    if (terminal.nodeIndex !== undefined) terminalNodeIndexes.add(terminal.nodeIndex);
  }
  for (const nodeId of indexedGraph.baseNodeSet) {
    const nodeIndex = indexedGraph.nodeIndexById.get(nodeId);
    if (nodeIndex !== undefined) terminalNodeIndexes.add(nodeIndex);
  }

  const nodeIndexes = new Set(solution.nodeIndexes);
  const edgeKeys = new Set(solution.edgeKeys);
  let changed = true;
  while (changed) {
    changed = false;
    const degrees = buildSolutionDegrees(edgeKeys, indexedGraph.nodeIndexById);
    for (const nodeIndex of Array.from(nodeIndexes)) {
      if (terminalNodeIndexes.has(nodeIndex) || (degrees.get(nodeIndex) ?? 0) > 1) continue;
      nodeIndexes.delete(nodeIndex);
      for (const edgeKey of Array.from(edgeKeys)) {
        const [from, to] = edgeKeyNodeIds(edgeKey);
        if (from === indexedGraph.nodeIds[nodeIndex] || to === indexedGraph.nodeIds[nodeIndex]) {
          edgeKeys.delete(edgeKey);
        }
      }
      changed = true;
    }
  }

  return { nodeIndexes, edgeKeys };
}

function buildSolutionDegrees(edgeKeys: Iterable<string>, nodeIndexById: Map<NodeId, number>): Map<number, number> {
  const degrees = new Map<number, number>();
  for (const edgeKey of edgeKeys) {
    const [from, to] = edgeKeyNodeIds(edgeKey);
    const fromIndex = nodeIndexById.get(from);
    const toIndex = nodeIndexById.get(to);
    if (fromIndex === undefined || toIndex === undefined) continue;
    degrees.set(fromIndex, (degrees.get(fromIndex) ?? 0) + 1);
    degrees.set(toIndex, (degrees.get(toIndex) ?? 0) + 1);
  }
  return degrees;
}

function addRouteEdgeKeys(routeNodeIndexes: number[], nodeIds: NodeId[], edgeKeys: Set<string>) {
  for (let index = 1; index < routeNodeIndexes.length; index += 1) {
    edgeKeys.add(treeEdgeKey(nodeIds[routeNodeIndexes[index - 1]], nodeIds[routeNodeIndexes[index]]));
  }
}

function routeCandidateFromSolution(
  label: string,
  solution: SolutionSets,
  baseNodeIds: NodeId[],
  baseEdgeKeys: string[],
  indexedGraph: IndexedGraph,
): BuildGoalsRouteCandidate {
  const baseEdgeKeySet = new Set(baseEdgeKeys);
  const addedEdgeKeys = Array.from(solution.edgeKeys).filter((edgeKey) => !baseEdgeKeySet.has(edgeKey));
  const totalEdgeKeys = mergeOrdered(baseEdgeKeys, addedEdgeKeys);
  const orderedNodeIds = orderConnectedSolutionNodeIds(
    baseNodeIds,
    nodeIdsFromIndexes(indexedGraph.nodeIds, solution.nodeIndexes),
    totalEdgeKeys,
  );
  const addedNodeIds = orderedNodeIds.filter((nodeId) => !indexedGraph.baseNodeSet.has(nodeId));

  return {
    label,
    addedNodeIds,
    addedEdgeKeys: orderEdgeKeysByNodeOrder(addedEdgeKeys, orderedNodeIds),
    totalNodeIds: orderedNodeIds,
    totalEdgeKeys: orderEdgeKeysByNodeOrder(totalEdgeKeys, orderedNodeIds),
    orderedNodeIds,
    pointCost: addedNodeIds.length,
  };
}

function resultFromRouteCandidate(
  candidate: BuildGoalsRouteCandidate,
  metadata: Pick<BuildGoalsOptimizeResult, "routeCandidates" | "improvementHistory" | "searchType">,
): BuildGoalsOptimizeResult {
  return {
    status: "success",
    addedNodeIds: candidate.addedNodeIds,
    addedEdgeKeys: candidate.addedEdgeKeys,
    totalNodeIds: candidate.totalNodeIds,
    totalEdgeKeys: candidate.totalEdgeKeys,
    orderedNodeIds: candidate.orderedNodeIds,
    pointCost: candidate.pointCost,
    unreachableGoalNodeIds: [],
    searchType: metadata.searchType,
    routeCandidates: [...(metadata.routeCandidates ?? [])],
    improvementHistory: [...(metadata.improvementHistory ?? [])],
  };
}

function annotateCompletedResult(
  result: BuildGoalsOptimizeResult,
  searchType: BuildGoalsOptimizeResult["searchType"],
): BuildGoalsOptimizeResult {
  if (result.status !== "success") return result;
  const completeReason = searchType === "exact" ? "exact" : searchType === "bounded" ? "bounded" : undefined;
  return {
    ...result,
    searchType,
    completeReason,
    routeCandidates: [routeCandidateFromResult(result, searchType ?? "route")],
    improvementHistory: [result.pointCost],
  };
}

function routeCandidateFromResult(result: BuildGoalsOptimizeResult, label: string): BuildGoalsRouteCandidate {
  return {
    label,
    addedNodeIds: result.addedNodeIds,
    addedEdgeKeys: result.addedEdgeKeys,
    totalNodeIds: result.totalNodeIds,
    totalEdgeKeys: result.totalEdgeKeys,
    orderedNodeIds: result.orderedNodeIds,
    pointCost: result.pointCost,
  };
}

function randomizedMetricEdges(metricEdges: MetricEdge[], terminalCount: number, rng: () => number): MetricEdge[] {
  const weightedEdges = metricEdges.map((edge) => ({
    edge,
    weight: edge.cost * (0.7 + rng() * 0.7),
  }));

  return minimumSpanningMetricEdges(
    weightedEdges
      .sort((left, right) => (
        left.weight - right.weight
        || left.edge.fromTerminalIndex - right.edge.fromTerminalIndex
        || left.edge.toTerminalIndex - right.edge.toTerminalIndex
      ))
      .map(({ edge }) => edge),
    terminalCount,
  );
}

function routeCandidateSignature(candidate: BuildGoalsRouteCandidate): string {
  return [...candidate.totalEdgeKeys].sort(compareNodeIds).join("|");
}

function compareRouteCandidates(left: BuildGoalsRouteCandidate, right: BuildGoalsRouteCandidate): number {
  return left.pointCost - right.pointCost || routeCandidateSignature(left).localeCompare(routeCandidateSignature(right));
}

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
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

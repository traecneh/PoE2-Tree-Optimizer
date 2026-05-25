import type { NodeId, TreeEdge, TreeGraph, TreeNode } from "./types";

export type AllocationPath = {
  startNodeId: NodeId;
  targetNodeId: NodeId;
  nodeIds: NodeId[];
  edgeKeys: string[];
  pointCost: number;
};

const maxAllocatableEdgeLength = 3000;

export function findShortestAllocationPath(
  graph: TreeGraph,
  startNodeId: NodeId,
  targetNodeId: NodeId,
): AllocationPath | undefined {
  if (!graph.nodes[startNodeId] || !graph.nodes[targetNodeId]) return undefined;
  if (startNodeId === targetNodeId) {
    return {
      startNodeId,
      targetNodeId,
      nodeIds: [startNodeId],
      edgeKeys: [],
      pointCost: 0,
    };
  }

  const adjacency = buildAllocatableAdjacency(graph);
  const queue: NodeId[] = [startNodeId];
  const previous = new Map<NodeId, NodeId | undefined>([[startNodeId, undefined]]);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of adjacency.get(current) ?? []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      if (next === targetNodeId) return buildPath(startNodeId, targetNodeId, previous);
      queue.push(next);
    }
  }

  return undefined;
}

export function findShortestAllocationPathFromAllocated(
  graph: TreeGraph,
  allocatedNodeIds: ReadonlySet<NodeId>,
  targetNodeId: NodeId,
): AllocationPath | undefined {
  if (!graph.nodes[targetNodeId]) return undefined;
  if (allocatedNodeIds.has(targetNodeId)) {
    return {
      startNodeId: targetNodeId,
      targetNodeId,
      nodeIds: [targetNodeId],
      edgeKeys: [],
      pointCost: 0,
    };
  }

  const startNodeIds = Array.from(allocatedNodeIds).filter((nodeId) => graph.nodes[nodeId]);
  if (startNodeIds.length === 0) return undefined;

  const adjacency = buildAllocatableAdjacency(graph);
  const queue: NodeId[] = [...startNodeIds];
  const previous = new Map<NodeId, NodeId | undefined>(
    startNodeIds.map((nodeId) => [nodeId, undefined]),
  );

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of adjacency.get(current) ?? []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      if (next === targetNodeId) return buildPath(resolvePathStart(targetNodeId, previous), targetNodeId, previous);
      queue.push(next);
    }
  }

  return undefined;
}

export function treeEdgeKey(from: NodeId, to: NodeId): string {
  return [from, to].sort().join("::");
}

export function isAllocatableTreeEdge(graph: TreeGraph, edge: TreeEdge): boolean {
  const from = graph.nodes[edge.from];
  const to = graph.nodes[edge.to];
  if (!from || !to) return false;
  if (edgeLength(from, to) > maxAllocatableEdgeLength) return false;
  return !(from.flags.classStart && to.flags.classStart);
}

function buildAllocatableAdjacency(graph: TreeGraph): Map<NodeId, NodeId[]> {
  const adjacency = new Map<NodeId, NodeId[]>();
  for (const edge of graph.edges) {
    if (!isAllocatableTreeEdge(graph, edge)) continue;
    appendNeighbor(adjacency, edge.from, edge.to);
    appendNeighbor(adjacency, edge.to, edge.from);
  }
  return adjacency;
}

function appendNeighbor(adjacency: Map<NodeId, NodeId[]>, from: NodeId, to: NodeId) {
  const neighbors = adjacency.get(from);
  if (neighbors) neighbors.push(to);
  else adjacency.set(from, [to]);
}

function buildPath(startNodeId: NodeId, targetNodeId: NodeId, previous: Map<NodeId, NodeId | undefined>): AllocationPath {
  const nodeIds: NodeId[] = [];
  let current: NodeId | undefined = targetNodeId;
  while (current) {
    nodeIds.push(current);
    current = previous.get(current);
  }
  nodeIds.reverse();

  return {
    startNodeId,
    targetNodeId,
    nodeIds,
    edgeKeys: nodeIds.slice(1).map((nodeId, index) => treeEdgeKey(nodeIds[index], nodeId)),
    pointCost: Math.max(0, nodeIds.length - 1),
  };
}

function resolvePathStart(targetNodeId: NodeId, previous: Map<NodeId, NodeId | undefined>): NodeId {
  let current = targetNodeId;
  let parent = previous.get(current);
  while (parent) {
    current = parent;
    parent = previous.get(current);
  }
  return current;
}

function edgeLength(from: TreeNode, to: TreeNode): number {
  return Math.hypot(to.position.x - from.position.x, to.position.y - from.position.y);
}

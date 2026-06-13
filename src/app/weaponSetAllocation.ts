import { isAllocatableTreeEdge, treeEdgeKey } from "../tree/pathAllocation";
import type { NodeId, TreeGraph, TreeNode } from "../tree/types";

export const defaultWeaponSetPointLimit = 24;

export type WeaponSetId = 1 | 2;
export type AllocationMode = "main" | "weapon1" | "weapon2";
export type WeaponSetAllocationNodeIds = Record<WeaponSetId, NodeId[]>;
export type WeaponSetAllocationClickStatus =
  | "updated"
  | "invalid-target"
  | "unreachable"
  | "limit-exceeded"
  | "already-main";
export type WeaponSetAllocationClickResult = {
  status: WeaponSetAllocationClickStatus;
  nodeIds: NodeId[];
};

export function emptyWeaponSetAllocations(): WeaponSetAllocationNodeIds {
  return {
    1: [],
    2: [],
  };
}

export function cloneWeaponSetAllocations(
  allocations: WeaponSetAllocationNodeIds,
): WeaponSetAllocationNodeIds {
  return {
    1: [...allocations[1]],
    2: [...allocations[2]],
  };
}

export function sanitizeWeaponSetAllocations(
  allocations: WeaponSetAllocationNodeIds | undefined,
  graph: TreeGraph,
): WeaponSetAllocationNodeIds {
  return {
    1: sanitizeWeaponSetAllocationNodeIds(allocations?.[1] ?? [], graph),
    2: sanitizeWeaponSetAllocationNodeIds(allocations?.[2] ?? [], graph),
  };
}

export function sanitizeWeaponSetAllocationNodeIds(
  nodeIds: NodeId[],
  graph: TreeGraph,
): NodeId[] {
  const seen = new Set<NodeId>();
  return nodeIds.filter((nodeId) => {
    if (seen.has(nodeId)) return false;
    const node = graph.nodes[nodeId];
    if (!node || !canAllocateNodeToWeaponSet(node)) return false;
    seen.add(nodeId);
    return true;
  });
}

export function canAllocateNodeToWeaponSet(node: TreeNode): boolean {
  return !node.flags.classStart
    && !node.flags.ascendancy
    && !node.flags.keystone
    && !node.flags.jewelSocket;
}

export function weaponSetPointCount(nodeIds: readonly NodeId[]): number {
  return nodeIds.length;
}

export function weaponSetBasePassivePointCount(
  mainPassivePointCount: number,
  allocations: WeaponSetAllocationNodeIds,
): number {
  return mainPassivePointCount + Math.max(
    weaponSetPointCount(allocations[1]),
    weaponSetPointCount(allocations[2]),
  );
}

export function weaponSetAllocationEdgeKeys(
  graph: TreeGraph,
  mainNodeIds: readonly NodeId[],
  weaponSetNodeIds: readonly NodeId[],
): string[] {
  const mainNodeIdSet = new Set(mainNodeIds);
  const weaponSetNodeIdSet = new Set(weaponSetNodeIds);
  const activeNodeIdSet = new Set([...mainNodeIdSet, ...weaponSetNodeIdSet]);

  return graph.edges.flatMap((edge) => {
    if (!isAllocatableTreeEdge(graph, edge)) return [];
    if (!activeNodeIdSet.has(edge.from) || !activeNodeIdSet.has(edge.to)) return [];
    if (!weaponSetNodeIdSet.has(edge.from) && !weaponSetNodeIdSet.has(edge.to)) return [];
    return [treeEdgeKey(edge.from, edge.to)];
  });
}

export function nextWeaponSetAllocationNodeIdsForClick({
  graph,
  mainNodeIds,
  weaponSetNodeIds,
  targetNodeId,
  pointLimit = defaultWeaponSetPointLimit,
}: {
  graph: TreeGraph;
  mainNodeIds: readonly NodeId[];
  weaponSetNodeIds: readonly NodeId[];
  targetNodeId: NodeId;
  pointLimit?: number;
}): WeaponSetAllocationClickResult {
  if (weaponSetNodeIds.includes(targetNodeId)) {
    return {
      status: "updated",
      nodeIds: pruneWeaponSetNodePathOnClick(weaponSetNodeIds, targetNodeId),
    };
  }

  const mainNodeIdSet = new Set(mainNodeIds);
  if (mainNodeIdSet.has(targetNodeId)) {
    return {
      status: "already-main",
      nodeIds: [...weaponSetNodeIds],
    };
  }

  const targetNode = graph.nodes[targetNodeId];
  if (!targetNode || !canAllocateNodeToWeaponSet(targetNode)) {
    return {
      status: "invalid-target",
      nodeIds: [...weaponSetNodeIds],
    };
  }

  const baseNodeIds = appendUniqueNodeIds(mainNodeIds, weaponSetNodeIds);
  const path = findShortestWeaponSetAllocationPath(graph, new Set(baseNodeIds), targetNodeId);
  if (!path) {
    return {
      status: "unreachable",
      nodeIds: [...weaponSetNodeIds],
    };
  }

  const nextNodeIds = appendUniqueNodeIds(
    weaponSetNodeIds,
    path.filter((nodeId) => !mainNodeIdSet.has(nodeId)),
  );
  if (nextNodeIds.length > pointLimit) {
    return {
      status: "limit-exceeded",
      nodeIds: [...weaponSetNodeIds],
    };
  }

  return {
    status: "updated",
    nodeIds: nextNodeIds,
  };
}

export function allocationModeWeaponSetId(mode: AllocationMode): WeaponSetId | undefined {
  if (mode === "weapon1") return 1;
  if (mode === "weapon2") return 2;
  return undefined;
}

function pruneWeaponSetNodePathOnClick(nodeIds: readonly NodeId[], nodeId: NodeId): NodeId[] {
  const nodeIndex = nodeIds.lastIndexOf(nodeId);
  if (nodeIndex === -1) return [...nodeIds];
  const clickedEndpoint = nodeIndex === nodeIds.length - 1;
  return nodeIds.slice(0, clickedEndpoint ? nodeIndex : nodeIndex + 1);
}

function findShortestWeaponSetAllocationPath(
  graph: TreeGraph,
  baseNodeIds: ReadonlySet<NodeId>,
  targetNodeId: NodeId,
): NodeId[] | undefined {
  const startNodeIds = Array.from(baseNodeIds).filter((nodeId) => graph.nodes[nodeId]);
  if (startNodeIds.length === 0) return undefined;

  const adjacency = buildWeaponSetAdjacency(graph, baseNodeIds);
  const queue: NodeId[] = [...startNodeIds];
  const previous = new Map<NodeId, NodeId | undefined>(
    startNodeIds.map((nodeId) => [nodeId, undefined]),
  );

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of adjacency.get(current) ?? []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      if (next === targetNodeId) return buildNodePath(targetNodeId, previous);
      queue.push(next);
    }
  }

  return undefined;
}

function buildWeaponSetAdjacency(
  graph: TreeGraph,
  baseNodeIds: ReadonlySet<NodeId>,
): Map<NodeId, NodeId[]> {
  const adjacency = new Map<NodeId, NodeId[]>();
  for (const edge of graph.edges) {
    if (!isAllocatableTreeEdge(graph, edge)) continue;
    if (!isWeaponSetTraversalNode(graph, baseNodeIds, edge.from)) continue;
    if (!isWeaponSetTraversalNode(graph, baseNodeIds, edge.to)) continue;
    appendNeighbor(adjacency, edge.from, edge.to);
    appendNeighbor(adjacency, edge.to, edge.from);
  }
  return adjacency;
}

function isWeaponSetTraversalNode(
  graph: TreeGraph,
  baseNodeIds: ReadonlySet<NodeId>,
  nodeId: NodeId,
): boolean {
  if (baseNodeIds.has(nodeId)) return Boolean(graph.nodes[nodeId]);
  const node = graph.nodes[nodeId];
  return Boolean(node && canAllocateNodeToWeaponSet(node));
}

function appendNeighbor(adjacency: Map<NodeId, NodeId[]>, from: NodeId, to: NodeId) {
  const neighbors = adjacency.get(from);
  if (neighbors) neighbors.push(to);
  else adjacency.set(from, [to]);
}

function buildNodePath(targetNodeId: NodeId, previous: Map<NodeId, NodeId | undefined>): NodeId[] {
  const nodeIds: NodeId[] = [];
  let current: NodeId | undefined = targetNodeId;
  while (current) {
    nodeIds.push(current);
    current = previous.get(current);
  }
  return nodeIds.reverse();
}

function appendUniqueNodeIds(
  currentNodeIds: readonly NodeId[],
  nextNodeIds: readonly NodeId[],
): NodeId[] {
  const nodeIds = [...currentNodeIds];
  const seen = new Set(nodeIds);
  for (const nodeId of nextNodeIds) {
    if (seen.has(nodeId)) continue;
    seen.add(nodeId);
    nodeIds.push(nodeId);
  }
  return nodeIds;
}

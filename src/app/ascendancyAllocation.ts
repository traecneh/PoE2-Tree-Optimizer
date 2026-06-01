import { treeEdgeKey, type AllocationPath } from "../tree/pathAllocation";
import type { ClassStartOption } from "../tree/classStartAliases";
import type { TreeGraph, TreeNode } from "../tree/types";
import { appendUniqueNodePath } from "./allocationPlan";

export const maxAscendancyAllocationCount = 8;

export type SelectedAscendancy = ClassStartOption["ascendancy"];
type ActiveAscendancy = NonNullable<SelectedAscendancy>;

export function ascendancyPointCostByNodeId(
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
  nodeIds: string[],
): ReadonlyMap<string, number> {
  const costs = new Map<string, number>();
  const seenPointKeys = new Set<string>();

  for (const nodeId of nodeIds) {
    const pointKey = ascendancyPointKey(graph, selectedAscendancy, nodeId);
    if (!pointKey) continue;

    costs.set(nodeId, seenPointKeys.has(pointKey) ? 0 : 1);
    seenPointKeys.add(pointKey);
  }

  return costs;
}

export function ascendancyAllocatedPointCount(
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
  nodeIds: string[],
): number {
  const pointKeys = new Set<string>();

  for (const nodeId of nodeIds) {
    const pointKey = ascendancyPointKey(graph, selectedAscendancy, nodeId);
    if (pointKey) pointKeys.add(pointKey);
  }

  return pointKeys.size;
}

export function sanitizeAscendancyAllocationNodeIds(
  nodeIds: string[],
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
): string[] {
  if (!selectedAscendancy) return [];
  let sanitized: string[] = [];
  const seen = new Set<string>();

  for (const nodeId of nodeIds) {
    const node = graph.nodes[nodeId];
    if (
      !node
      || !isSelectableAscendancyNode(node, selectedAscendancy)
      || seen.has(nodeId)
    ) {
      continue;
    }

    const candidate = applyAscendancyChoiceExclusivity(
      graph,
      selectedAscendancy,
      [...sanitized, nodeId],
      nodeId,
    );
    if (ascendancyAllocatedPointCount(graph, selectedAscendancy, candidate) > maxAscendancyAllocationCount) {
      continue;
    }

    sanitized = candidate;
    seen.clear();
    for (const sanitizedNodeId of sanitized) {
      seen.add(sanitizedNodeId);
    }
  }

  return sanitized;
}

export function ascendancyAllocationEdgeKeys(
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
  allocatedNodeIds: string[],
): string[] {
  if (!selectedAscendancy || allocatedNodeIds.length === 0) return [];
  const allocatedNodeIdSet = new Set([selectedAscendancy.startNodeId, ...allocatedNodeIds]);
  return graph.edges.flatMap((edge) => {
    if (!allocatedNodeIdSet.has(edge.from) || !allocatedNodeIdSet.has(edge.to)) return [];
    const from = graph.nodes[edge.from];
    const to = graph.nodes[edge.to];
    if (!from || !to) return [];
    if (!isActiveAscendancyNode(from, selectedAscendancy) || !isActiveAscendancyNode(to, selectedAscendancy)) return [];
    return [treeEdgeKey(edge.from, edge.to)];
  });
}

export function toggleAscendancyAllocationNodeIds(
  node: TreeNode,
  nodeIds: string[],
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
): string[] {
  if (!isSelectableAscendancyNode(node, selectedAscendancy)) return nodeIds;

  const validCurrent = sanitizeAscendancyAllocationNodeIds(nodeIds, graph, selectedAscendancy);
  const allocatedNodeIndex = validCurrent.indexOf(node.id);
  if (allocatedNodeIndex !== -1) {
    return validCurrent.slice(0, allocatedNodeIndex + 1);
  }

  const nextPath = findAscendancyAllocationPath(graph, selectedAscendancy, validCurrent, node.id);
  if (!nextPath) return validCurrent;

  const nextNodeIds = applyAscendancyChoiceExclusivity(
    graph,
    selectedAscendancy,
    appendUniqueNodePath(
      validCurrent,
      nextPath.nodeIds.filter((nodeId) => nodeId !== selectedAscendancy?.startNodeId),
    ),
    node.id,
  );
  if (ascendancyAllocatedPointCount(graph, selectedAscendancy, nextNodeIds) > maxAscendancyAllocationCount) return validCurrent;
  return nextNodeIds;
}

export function isSelectableAscendancyNode(
  node: TreeNode,
  selectedAscendancy: SelectedAscendancy,
): boolean {
  return Boolean(
    selectedAscendancy
    && node.ascendancy?.id === selectedAscendancy.id
    && !node.ascendancy.startNode
  );
}

function ascendancyPointKey(
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
  nodeId: string,
): string | undefined {
  const node = graph.nodes[nodeId];
  if (!node || !isSelectableAscendancyNode(node, selectedAscendancy)) return undefined;
  return ascendancyChoiceParentId(graph, selectedAscendancy, nodeId) ?? nodeId;
}

function ascendancyChoiceParentId(
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
  nodeId: string,
): string | undefined {
  if (!selectedAscendancy) return undefined;
  const node = graph.nodes[nodeId];
  if (!node || !isSelectableAscendancyNode(node, selectedAscendancy)) return undefined;

  const neighborIds = activeAscendancyNeighborIds(graph, selectedAscendancy, nodeId);
  if (neighborIds.length !== 1) return undefined;

  const parentId = neighborIds[0];
  return isAscendancyChoiceParent(graph.nodes[parentId], selectedAscendancy) ? parentId : undefined;
}

function isAscendancyChoiceParent(
  node: TreeNode | undefined,
  selectedAscendancy: ActiveAscendancy,
): node is TreeNode {
  return Boolean(
    node
    && isSelectableAscendancyNode(node, selectedAscendancy)
    && node.flags.notable
    && node.stats.length === 0,
  );
}

function activeAscendancyNeighborIds(
  graph: TreeGraph,
  selectedAscendancy: ActiveAscendancy,
  nodeId: string,
): string[] {
  return graph.edges.flatMap((edge) => {
    if (edge.from !== nodeId && edge.to !== nodeId) return [];
    const neighborId = edge.from === nodeId ? edge.to : edge.from;
    return isActiveAscendancyNode(graph.nodes[neighborId], selectedAscendancy) ? [neighborId] : [];
  });
}

function applyAscendancyChoiceExclusivity(
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
  nodeIds: string[],
  targetNodeId: string,
): string[] {
  if (!selectedAscendancy) return nodeIds;
  const choiceParentId = ascendancyChoiceParentId(graph, selectedAscendancy, targetNodeId);
  if (!choiceParentId) return nodeIds;

  const siblingNodeIds = new Set(
    activeAscendancyNeighborIds(graph, selectedAscendancy, choiceParentId)
      .filter((nodeId) => (
        nodeId !== targetNodeId
        && ascendancyChoiceParentId(graph, selectedAscendancy, nodeId) === choiceParentId
      )),
  );

  return nodeIds.filter((nodeId) => !siblingNodeIds.has(nodeId));
}

function findAscendancyAllocationPath(
  graph: TreeGraph,
  selectedAscendancy: SelectedAscendancy,
  allocatedNodeIds: string[],
  targetNodeId: string,
): AllocationPath | undefined {
  if (!selectedAscendancy || !graph.nodes[targetNodeId]) return undefined;
  const startNodeIds = [selectedAscendancy.startNodeId, ...allocatedNodeIds]
    .filter((nodeId) => isActiveAscendancyNode(graph.nodes[nodeId], selectedAscendancy));
  if (startNodeIds.length === 0) return undefined;

  const startNodeIdSet = new Set(startNodeIds);
  if (startNodeIdSet.has(targetNodeId)) {
    return {
      startNodeId: targetNodeId,
      targetNodeId,
      nodeIds: [targetNodeId],
      edgeKeys: [],
      pointCost: 0,
    };
  }

  const adjacency = buildAscendancyAdjacency(graph, selectedAscendancy);
  const queue = [...startNodeIds];
  const previous = new Map<string, string | undefined>(
    startNodeIds.map((nodeId) => [nodeId, undefined]),
  );

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of adjacency.get(current) ?? []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      if (next === targetNodeId) return buildAscendancyPath(resolvePathStart(targetNodeId, previous), targetNodeId, previous);
      queue.push(next);
    }
  }

  return undefined;
}

function buildAscendancyAdjacency(
  graph: TreeGraph,
  selectedAscendancy: ActiveAscendancy,
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const from = graph.nodes[edge.from];
    const to = graph.nodes[edge.to];
    if (!isActiveAscendancyNode(from, selectedAscendancy) || !isActiveAscendancyNode(to, selectedAscendancy)) continue;
    appendNeighbor(adjacency, edge.from, edge.to);
    appendNeighbor(adjacency, edge.to, edge.from);
  }
  return adjacency;
}

function appendNeighbor(adjacency: Map<string, string[]>, from: string, to: string) {
  const neighbors = adjacency.get(from);
  if (neighbors) neighbors.push(to);
  else adjacency.set(from, [to]);
}

function buildAscendancyPath(
  startNodeId: string,
  targetNodeId: string,
  previous: Map<string, string | undefined>,
): AllocationPath {
  const nodeIds: string[] = [];
  let current: string | undefined = targetNodeId;
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

function resolvePathStart(targetNodeId: string, previous: Map<string, string | undefined>): string {
  let current = targetNodeId;
  let parent = previous.get(current);
  while (parent) {
    current = parent;
    parent = previous.get(current);
  }
  return current;
}

function isActiveAscendancyNode(
  node: TreeNode | undefined,
  selectedAscendancy: ActiveAscendancy,
): node is TreeNode {
  return Boolean(node?.flags.ascendancy && node.ascendancy?.id === selectedAscendancy.id);
}

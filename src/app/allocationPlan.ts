import type { AllocationPath } from "../tree/pathAllocation";
import { treeEdgeKey } from "../tree/pathAllocation";
import type { TreeGraph } from "../tree/types";

export type AllocationPlan = {
  committedNodePath: string[];
  committedEdgeKeys: string[];
  previewNodePath: string[];
  previewEdgeKeys: string[];
  previewRouteNodePath: string[];
  previewHighlightNodeIds?: string[];
  previewHighlightEdgeKeys?: string[];
  noAllocationPathNodeId?: string;
};

export function emptyAllocationPlanForStart(pathStartNodeId: string | undefined): AllocationPlan {
  return {
    committedNodePath: pathStartNodeId ? [pathStartNodeId] : [],
    committedEdgeKeys: [],
    previewNodePath: [],
    previewEdgeKeys: [],
    previewRouteNodePath: [],
  };
}

export function cloneAllocationPlan(allocationPlan: AllocationPlan): AllocationPlan {
  return {
    committedNodePath: [...allocationPlan.committedNodePath],
    committedEdgeKeys: [...allocationPlan.committedEdgeKeys],
    previewNodePath: [...allocationPlan.previewNodePath],
    previewEdgeKeys: [...allocationPlan.previewEdgeKeys],
    previewRouteNodePath: [...allocationPlan.previewRouteNodePath],
    previewHighlightNodeIds: allocationPlan.previewHighlightNodeIds
      ? [...allocationPlan.previewHighlightNodeIds]
      : undefined,
    previewHighlightEdgeKeys: allocationPlan.previewHighlightEdgeKeys
      ? [...allocationPlan.previewHighlightEdgeKeys]
      : undefined,
    noAllocationPathNodeId: allocationPlan.noAllocationPathNodeId,
  };
}

export function sanitizeSavedAllocationPlan(
  allocationPlan: AllocationPlan,
  graph: TreeGraph,
  fallbackPathStartNodeId: string | undefined,
): AllocationPlan {
  const committedNodePath = allocationPlan.committedNodePath.filter((nodeId) => graph.nodes[nodeId]);
  const previewNodePath = allocationPlan.previewNodePath.filter((nodeId) => graph.nodes[nodeId]);
  const previewRouteNodePath = allocationPlan.previewRouteNodePath.filter((nodeId) => graph.nodes[nodeId]);
  const availableNodePath = previewNodePath.length > 0 ? previewNodePath : committedNodePath;
  const visibleNodePath = availableNodePath.length > 0
    ? availableNodePath
    : fallbackPathStartNodeId ? [fallbackPathStartNodeId] : [];

  return {
    committedNodePath: committedNodePath.length > 0
      ? committedNodePath
      : fallbackPathStartNodeId ? [fallbackPathStartNodeId] : [],
    committedEdgeKeys: filterEdgeKeysToNodeIds(allocationPlan.committedEdgeKeys, committedNodePath),
    previewNodePath,
    previewEdgeKeys: filterEdgeKeysToNodeIds(allocationPlan.previewEdgeKeys, visibleNodePath),
    previewRouteNodePath,
    previewHighlightNodeIds: allocationPlan.previewHighlightNodeIds?.filter((nodeId) => graph.nodes[nodeId]),
    previewHighlightEdgeKeys: allocationPlan.previewHighlightEdgeKeys
      ? filterEdgeKeysToNodeIds(allocationPlan.previewHighlightEdgeKeys, visibleNodePath)
      : undefined,
    noAllocationPathNodeId: allocationPlan.noAllocationPathNodeId && graph.nodes[allocationPlan.noAllocationPathNodeId]
      ? allocationPlan.noAllocationPathNodeId
      : undefined,
  };
}

export function allocationPlanHasVisibleState(allocationPlan: AllocationPlan): boolean {
  return allocationPlan.committedNodePath.length > 0
    || allocationPlan.previewNodePath.length > 0
    || allocationPlan.previewEdgeKeys.length > 0
    || allocationPlan.previewRouteNodePath.length > 0
    || Boolean(allocationPlan.noAllocationPathNodeId);
}

export function allocationPlanNodeIds(allocationPlan: AllocationPlan): string[] {
  return mergeNodeIds(
    allocationPlan.committedNodePath,
    allocationPlan.previewNodePath,
    allocationPlan.previewRouteNodePath,
    allocationPlan.previewHighlightNodeIds ?? [],
    allocationPlan.noAllocationPathNodeId ? [allocationPlan.noAllocationPathNodeId] : [],
  );
}

export function pruneCommittedNodePathOnClick(nodePath: string[], nodeId: string): string[] {
  return pruneNodePathOnClick(nodePath, nodeId);
}

export function pruneNodePathOnClick(nodePath: string[], nodeId: string): string[] {
  const nodeIndex = nodePath.lastIndexOf(nodeId);
  if (nodeIndex === -1) return [];
  if (nodeIndex <= 0) return nodePath.slice(0, 1);
  const clickedEndpoint = nodeIndex === nodePath.length - 1;
  return nodePath.slice(0, clickedEndpoint ? nodeIndex : nodeIndex + 1);
}

export function allocationPathFromNodePath(nodePath: string[]): AllocationPath | undefined {
  const startNodeId = nodePath[0];
  const targetNodeId = nodePath[nodePath.length - 1];
  if (!startNodeId || !targetNodeId) return undefined;

  return {
    startNodeId,
    targetNodeId,
    nodeIds: nodePath,
    edgeKeys: Array.from(edgeKeysFromNodePath(nodePath)),
    pointCost: Math.max(0, nodePath.length - 1),
  };
}

export function appendUniqueNodePath(currentNodePath: string[], routeNodePath: string[]): string[] {
  const nodeIds = [...currentNodePath];
  const seen = new Set(nodeIds);

  for (const nodeId of routeNodePath) {
    if (seen.has(nodeId)) continue;
    seen.add(nodeId);
    nodeIds.push(nodeId);
  }

  return nodeIds;
}

export function edgeKeysFromNodePath(nodePath: string[]): Set<string> {
  return new Set(nodePath.slice(1).map((nodeId, index) => treeEdgeKey(nodePath[index], nodeId)));
}

export function mergeEdgeKeys(...edgeKeyGroups: string[][]): string[] {
  return Array.from(new Set(edgeKeyGroups.flat()));
}

export function mergeNodeIds(...nodeIdGroups: string[][]): string[] {
  return Array.from(new Set(nodeIdGroups.flat()));
}

export function pendingAllocationNodeIds(
  previewNodePath: string[],
  committedNodePath: string[],
  previewRouteNodePath: string[],
  previewHighlightNodeIds?: string[],
): Set<string> {
  if (previewHighlightNodeIds) return new Set(previewHighlightNodeIds);

  const committedNodeIds = new Set(committedNodePath);
  const nodeIds = new Set(previewNodePath.filter((nodeId) => !committedNodeIds.has(nodeId)));
  const routeStartNodeId = previewRouteNodePath[0];
  if (routeStartNodeId) nodeIds.add(routeStartNodeId);
  return nodeIds;
}

export function pendingAllocationEdgeKeys(
  previewEdgeKeys: string[],
  committedEdgeKeys: string[],
  previewHighlightEdgeKeys?: string[],
): Set<string> {
  if (previewHighlightEdgeKeys) return new Set(previewHighlightEdgeKeys);

  const committed = new Set(committedEdgeKeys);
  return new Set(previewEdgeKeys.filter((edgeKey) => !committed.has(edgeKey)));
}

export function filterEdgeKeysToNodeIds(edgeKeys: string[], nodePath: string[]): string[] {
  const nodeIds = new Set(nodePath);
  return edgeKeys.filter((edgeKey) => {
    const [from, to] = edgeKeyNodeIds(edgeKey);
    return nodeIds.has(from) && nodeIds.has(to);
  });
}

export function nodePathEndpoint(nodePath: string[]): string | undefined {
  return nodePath[nodePath.length - 1];
}

function edgeKeyNodeIds(edgeKey: string): [string, string] {
  const [from, to] = edgeKey.split("::");
  return [from, to];
}

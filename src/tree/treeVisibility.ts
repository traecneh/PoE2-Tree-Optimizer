import type { TreeGraph, TreeNode } from "./types";

export type TreeVisibilityState = {
  selectedAscendancyId?: string;
  allocatedAscendancyNodeIds?: ReadonlySet<string> | readonly string[];
};

export function filterVisibleTreeGraph(
  graph: TreeGraph,
  state: TreeVisibilityState,
): TreeGraph {
  const allocatedAscendancyNodeIds = toReadonlySet(state.allocatedAscendancyNodeIds);
  const nodes = Object.fromEntries(
    Object.entries(graph.nodes).filter(([, node]) => isTreeNodeVisible(node, {
      selectedAscendancyId: state.selectedAscendancyId,
      allocatedAscendancyNodeIds,
    })),
  );
  const visibleNodeIds = new Set(Object.keys(nodes));
  const groups = Object.fromEntries(
    Object.entries(graph.groups)
      .map(([groupId, group]) => [
        groupId,
        {
          ...group,
          nodeIds: group.nodeIds.filter((nodeId) => visibleNodeIds.has(nodeId)),
        },
      ] as const)
      .filter(([, group]) => group.nodeIds.length > 0),
  );
  const edges = graph.edges.filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to));

  return {
    ...graph,
    nodes,
    groups,
    edges,
  };
}

export function isTreeNodeVisible(
  node: TreeNode,
  state: {
    selectedAscendancyId?: string;
    allocatedAscendancyNodeIds: ReadonlySet<string>;
  },
): boolean {
  const visibility = node.visibility;
  if (!visibility) return true;
  if (state.selectedAscendancyId !== visibility.requiredAscendancy.id) return false;
  if (!visibility.unlockNodeId) return true;
  return state.allocatedAscendancyNodeIds.has(visibility.unlockNodeId);
}

function toReadonlySet(values: ReadonlySet<string> | readonly string[] | undefined): ReadonlySet<string> {
  return values instanceof Set ? values : new Set(values ?? []);
}

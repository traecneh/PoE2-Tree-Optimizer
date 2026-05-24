import type { NodeId, TreeGraph } from "./types";

export type ValidationIssueCode =
  | "dangling-edge"
  | "missing-coordinate"
  | "missing-stats"
  | "orphan-node"
  | "duplicate-group-node";

export type ValidationIssue = {
  code: ValidationIssueCode;
  nodeId?: NodeId;
  edge?: { from: NodeId; to: NodeId };
  message: string;
};

export type ValidationReport = {
  gameVersion: string;
  extractedAt: string;
  summary: {
    nodeCount: number;
    edgeCount: number;
    groupCount: number;
    classStartCount: number;
    missingCoordinateCount: number;
    missingStatCount: number;
    danglingEdgeCount: number;
    orphanNodeCount: number;
    duplicateNodeIdCount: number;
    bounds: TreeGraph["bounds"];
  };
  issues: ValidationIssue[];
};

export function validateTreeGraph(graph: TreeGraph): ValidationReport {
  const issues: ValidationIssue[] = [];
  const connected = new Set<NodeId>();
  let danglingEdgeCount = 0;
  let missingCoordinateCount = 0;
  let missingStatCount = 0;
  let duplicateGroupNodeCount = 0;
  const groupedNodeIds = new Set<NodeId>();

  for (const edge of graph.edges) {
    const fromExists = Boolean(graph.nodes[edge.from]);
    const toExists = Boolean(graph.nodes[edge.to]);
    if (!fromExists || !toExists) {
      danglingEdgeCount += 1;
      issues.push({
        code: "dangling-edge",
        edge,
        message: `Edge ${edge.from} -> ${edge.to} references a missing node.`,
      });
      continue;
    }
    connected.add(edge.from);
    connected.add(edge.to);
  }

  for (const node of Object.values(graph.nodes)) {
    if (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)) {
      missingCoordinateCount += 1;
      issues.push({
        code: "missing-coordinate",
        nodeId: node.id,
        message: `Node ${node.id} has invalid coordinates.`,
      });
    }

    if (!node.flags.classStart && !node.flags.jewelSocket && node.stats.length === 0) {
      missingStatCount += 1;
      issues.push({
        code: "missing-stats",
        nodeId: node.id,
        message: `Node ${node.id} has no stat lines.`,
      });
    }

    if (!connected.has(node.id) && !node.flags.classStart) {
      issues.push({
        code: "orphan-node",
        nodeId: node.id,
        message: `Node ${node.id} is not connected to any other node.`,
      });
    }
  }

  for (const group of Object.values(graph.groups)) {
    for (const nodeId of group.nodeIds) {
      if (groupedNodeIds.has(nodeId)) {
        duplicateGroupNodeCount += 1;
        issues.push({
          code: "duplicate-group-node",
          nodeId,
          message: `Node ${nodeId} appears in more than one group node list.`,
        });
      }
      groupedNodeIds.add(nodeId);
    }
  }

  const orphanNodeCount = issues.filter((issue) => issue.code === "orphan-node").length;

  return {
    gameVersion: graph.gameVersion,
    extractedAt: graph.extractedAt,
    summary: {
      nodeCount: Object.keys(graph.nodes).length,
      edgeCount: graph.edges.length,
      groupCount: Object.keys(graph.groups).length,
      classStartCount: Object.keys(graph.classStarts).length,
      missingCoordinateCount,
      missingStatCount,
      danglingEdgeCount,
      orphanNodeCount,
      duplicateNodeIdCount: duplicateGroupNodeCount,
      bounds: graph.bounds,
    },
    issues,
  };
}

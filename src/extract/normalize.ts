import type { TreeEdge, TreeGraph, TreeGroup, TreeNode } from "../tree/types";

type RawPayload = {
  groups?: Record<string, { x?: number; y?: number; n?: Array<string | number> }>;
  nodes?: Record<string, Record<string, unknown>>;
  classes?: Record<string, { startNodeId?: string | number }>;
};

export function normalizePassiveTreePayload(input: {
  gameVersion: string;
  sourcePath: string;
  payload: RawPayload;
}): TreeGraph {
  const rawNodes = input.payload.nodes ?? {};
  const nodes: TreeGraph["nodes"] = {};
  const groups: TreeGraph["groups"] = {};
  const edges: TreeEdge[] = [];

  for (const [id, raw] of Object.entries(rawNodes)) {
    const node = normalizeNode(id, raw);
    nodes[node.id] = node;
    for (const linkedId of readLinkedIds(raw)) {
      edges.push({ from: node.id, to: linkedId });
    }
  }

  for (const [id, raw] of Object.entries(input.payload.groups ?? {})) {
    const group: TreeGroup = {
      id,
      position: Number.isFinite(raw.x) && Number.isFinite(raw.y) ? { x: Number(raw.x), y: Number(raw.y) } : undefined,
      nodeIds: (raw.n ?? []).map(String),
    };
    groups[id] = group;
  }

  const classStarts: TreeGraph["classStarts"] = {};
  for (const [className, rawClass] of Object.entries(input.payload.classes ?? {})) {
    if (rawClass.startNodeId !== undefined) classStarts[className] = String(rawClass.startNodeId);
  }

  return {
    schemaVersion: 1,
    gameVersion: input.gameVersion,
    extractedAt: new Date().toISOString(),
    source: { kind: "local-game-data", path: input.sourcePath },
    nodes,
    groups,
    edges: dedupeEdges(edges),
    classStarts,
    bounds: computeBounds(Object.values(nodes)),
  };
}

function normalizeNode(id: string, raw: Record<string, unknown>): TreeNode {
  const groupId = raw.g ?? raw.group;
  const name = raw.dn ?? raw.name;
  const stats = raw.sd ?? raw.stats ?? [];
  return {
    id: String(raw.id ?? raw.skill ?? id),
    groupId: groupId === undefined ? undefined : String(groupId),
    name: typeof name === "string" ? name : undefined,
    stats: Array.isArray(stats) ? stats.map(String) : [],
    position: {
      x: Number(raw.x ?? 0),
      y: Number(raw.y ?? 0),
    },
    flags: {
      classStart: Boolean(raw.isClassStart || raw.type === "ClassStart"),
      attribute: Boolean(raw.isAttribute || raw.type === "Attribute"),
      small: Boolean(raw.type === "Normal"),
      notable: Boolean(raw.isNotable || raw.type === "Notable"),
      keystone: Boolean(raw.isKeystone || raw.type === "Keystone"),
      jewelSocket: Boolean(raw.isJewelSocket || raw.type === "Socket"),
    },
    art: typeof raw.icon === "string" ? { icon: raw.icon } : undefined,
  };
}

function readLinkedIds(raw: Record<string, unknown>): string[] {
  const out = raw.out ?? raw.linkedId ?? raw.connections;
  return Array.isArray(out) ? out.map(String) : [];
}

function dedupeEdges(edges: TreeEdge[]): TreeEdge[] {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = [edge.from, edge.to].sort().join("::");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function computeBounds(nodes: TreeNode[]): TreeGraph["bounds"] {
  const xs = nodes.map((node) => node.position.x).filter(Number.isFinite);
  const ys = nodes.map((node) => node.position.y).filter(Number.isFinite);
  return {
    minX: xs.length > 0 ? Math.min(...xs) : 0,
    maxX: xs.length > 0 ? Math.max(...xs) : 0,
    minY: ys.length > 0 ? Math.min(...ys) : 0,
    maxY: ys.length > 0 ? Math.max(...ys) : 0,
  };
}

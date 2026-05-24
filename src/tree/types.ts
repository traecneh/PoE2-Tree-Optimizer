export type NodeId = string;
export type GroupId = string;
export type ClassId = string;

export type TreeNodeFlags = {
  classStart?: boolean;
  attribute?: boolean;
  small?: boolean;
  notable?: boolean;
  keystone?: boolean;
  jewelSocket?: boolean;
};

export type TreeNode = {
  id: NodeId;
  groupId?: GroupId;
  name?: string;
  stats: string[];
  position: { x: number; y: number };
  flags: TreeNodeFlags;
  art?: {
    icon?: string;
    assetKey?: string;
  };
};

export type TreeGroup = {
  id: GroupId;
  position?: { x: number; y: number };
  nodeIds: NodeId[];
};

export type TreeEdge = {
  from: NodeId;
  to: NodeId;
};

export type TreeGraph = {
  schemaVersion: 1;
  gameVersion: string;
  extractedAt: string;
  source: {
    kind: "local-game-data" | "fixture";
    path: string;
  };
  nodes: Record<NodeId, TreeNode>;
  groups: Record<GroupId, TreeGroup>;
  edges: TreeEdge[];
  classStarts: Record<ClassId, NodeId>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
};

import type { TreeEdge, TreeGraph, TreeGroup, TreeNode } from "../tree/types";
import { POE2_ORBIT_RADII } from "../tree/orbits";
import { passiveIconAssetKey } from "../tree/passiveIconAssets";

export type ParsedPassiveSkillGraph = {
  version: 3;
  type: number;
  orbits: number[];
  rootNodeIds: number[];
  groups: ParsedPassiveSkillGroup[];
};

export type ParsedPassiveSkillGroup = {
  id: string;
  position: { x: number; y: number };
  groupAssociationKey: number;
  groupBackgroundOverride: number;
  isJewelPositionReference: boolean;
  nodes: ParsedPassiveSkillNode[];
};

export type ParsedPassiveSkillNode = {
  id: number;
  orbit: number;
  orbitIndex: number;
  connections: ParsedPassiveSkillConnection[];
};

export type ParsedPassiveSkillConnection = {
  nodeId: number;
  orbit: number;
};

export type Poe2PassiveSkillRow = {
  Id?: string;
  Name?: string;
  Icon_DDSFile?: string;
  Stats?: unknown[];
  Stat1Value?: number;
  Stat2Value?: number;
  Stat3Value?: number;
  Stat4Value?: number;
  Stat5Value?: number;
  PassiveSkillGraphId?: number | string | null;
  IsKeystone?: boolean;
  IsNotable?: boolean;
  IsJewelSocket?: boolean;
  IsAscendancyStartingNode?: boolean;
  IsAttribute?: boolean;
  NodeFrameArt?: unknown;
};

export function parsePassiveSkillGraph(bytes: Uint8Array): ParsedPassiveSkillGraph {
  const reader = new BinaryReader(bytes);
  const version = reader.readU8();
  if (version !== 3) {
    throw new Error(`Unsupported passive skill graph version: ${version}`);
  }

  const type = reader.readU8();
  const orbitCount = reader.readU8();
  const orbits = Array.from({ length: orbitCount }, () => reader.readU8());
  const rootNodeCount = reader.readU32();
  const rootNodeIds = Array.from({ length: rootNodeCount }, () => {
    const rootNodeId = reader.readU32();
    reader.skip(4);
    return rootNodeId;
  });
  const groupCount = reader.readU32();
  const groups = Array.from({ length: groupCount }, (_, groupIndex) => readGroup(reader, groupIndex));

  if (!reader.done) {
    throw new Error(`Passive skill graph has ${reader.remainingBytes} unread bytes`);
  }

  return { version, type, orbits, rootNodeIds, groups };
}

export function normalizePoe2PassiveTreeData(input: {
  gameVersion: string;
  sourcePath: string;
  graph: ParsedPassiveSkillGraph;
  passiveSkills: Poe2PassiveSkillRow[];
}): TreeGraph {
  const skillsByGraphId = new Map<string, Poe2PassiveSkillRow>();
  for (const row of input.passiveSkills) {
    if (row.PassiveSkillGraphId !== undefined && row.PassiveSkillGraphId !== null) {
      skillsByGraphId.set(String(row.PassiveSkillGraphId), row);
    }
  }

  const rootNodeIds = new Set(input.graph.rootNodeIds.map(String));
  const nodes: TreeGraph["nodes"] = {};
  const groups: TreeGraph["groups"] = {};
  const edges: TreeEdge[] = [];

  for (const group of input.graph.groups) {
    const treeGroup: TreeGroup = {
      id: group.id,
      position: group.position,
      nodeIds: group.nodes.map((node) => String(node.id)),
    };
    groups[treeGroup.id] = treeGroup;

    for (const nodeRef of group.nodes) {
      const skill = skillsByGraphId.get(String(nodeRef.id));
      const node = normalizeNodeRef(nodeRef, group, input.graph.orbits, rootNodeIds, skill);
      nodes[node.id] = node;
      for (const connection of nodeRef.connections) {
        edges.push({ from: node.id, to: String(connection.nodeId), connectionOrbit: connection.orbit });
      }
    }
  }

  return {
    schemaVersion: 1,
    gameVersion: input.gameVersion,
    extractedAt: new Date().toISOString(),
    source: { kind: "local-game-data", path: input.sourcePath },
    nodes,
    groups,
    edges: dedupeEdges(edges),
    classStarts: buildClassStarts(input.graph.rootNodeIds, skillsByGraphId),
    bounds: computeBounds(Object.values(nodes)),
  };
}

function readGroup(reader: BinaryReader, groupIndex: number): ParsedPassiveSkillGroup {
  const x = reader.readF32();
  const y = reader.readF32();
  const groupAssociationKey = reader.readU32();
  const groupBackgroundOverride = reader.readU32();
  const isJewelPositionReference = reader.readU8() !== 0;
  const nodeCount = reader.readU32();
  const nodes = Array.from({ length: nodeCount }, () => readNode(reader));
  return {
    id: String(groupIndex),
    position: { x, y },
    groupAssociationKey,
    groupBackgroundOverride,
    isJewelPositionReference,
    nodes,
  };
}

function readNode(reader: BinaryReader): ParsedPassiveSkillNode {
  const id = reader.readU32();
  const orbit = reader.readU32();
  const orbitIndex = reader.readU32();
  const connectionCount = reader.readU32();
  const connections = Array.from({ length: connectionCount }, () => ({
    nodeId: reader.readU32(),
    orbit: reader.readI32(),
  }));

  return { id, orbit, orbitIndex, connections };
}

function normalizeNodeRef(
  nodeRef: ParsedPassiveSkillNode,
  group: ParsedPassiveSkillGroup,
  orbits: number[],
  rootNodeIds: Set<string>,
  skill: Poe2PassiveSkillRow | undefined,
): TreeNode {
  const id = String(nodeRef.id);
  const classStart = rootNodeIds.has(id) || Boolean(skill?.IsAscendancyStartingNode);
  const keystone = Boolean(skill?.IsKeystone);
  const notable = Boolean(skill?.IsNotable);
  const jewelSocket = Boolean(skill?.IsJewelSocket);
  return {
    id,
    groupId: group.id,
    name: skill?.Name,
    stats: formatStats(skill),
    layout: {
      orbit: nodeRef.orbit,
      orbitIndex: nodeRef.orbitIndex,
    },
    position: resolveNodePosition(group.position, nodeRef, orbits),
    flags: {
      classStart,
      attribute: Boolean(skill?.IsAttribute),
      small: !classStart && !keystone && !notable && !jewelSocket,
      notable,
      keystone,
      jewelSocket,
    },
    art: normalizePassiveIconArt(skill),
  };
}

function normalizePassiveIconArt(skill: Poe2PassiveSkillRow | undefined): TreeNode["art"] {
  if (typeof skill?.Icon_DDSFile !== "string" || skill.Icon_DDSFile.trim() === "") return undefined;
  return { icon: skill.Icon_DDSFile, assetKey: passiveIconAssetKey(skill.Icon_DDSFile) };
}

function resolveNodePosition(
  groupPosition: { x: number; y: number },
  nodeRef: ParsedPassiveSkillNode,
  orbits: number[],
): { x: number; y: number } {
  const radius = POE2_ORBIT_RADII[nodeRef.orbit] ?? nodeRef.orbit * 100;
  const positionsInOrbit = orbits[nodeRef.orbit] ?? 1;
  const angle = -Math.PI / 2 + (Math.PI * 2 * nodeRef.orbitIndex) / positionsInOrbit;
  return {
    x: roundCoordinate(groupPosition.x + Math.cos(angle) * radius),
    y: roundCoordinate(groupPosition.y + Math.sin(angle) * radius),
  };
}

function formatStats(skill: Poe2PassiveSkillRow | undefined): string[] {
  if (!skill || !Array.isArray(skill.Stats)) return [];
  const values = [skill.Stat1Value, skill.Stat2Value, skill.Stat3Value, skill.Stat4Value, skill.Stat5Value];
  return skill.Stats.flatMap((statId, index) => {
    if (statId === null || statId === undefined) return [];
    const value = values[index];
    return [typeof value === "number" ? `stat:${String(statId)}=${value}` : `stat:${String(statId)}`];
  });
}

function buildClassStarts(
  rootNodeIds: number[],
  skillsByGraphId: Map<string, Poe2PassiveSkillRow>,
): TreeGraph["classStarts"] {
  return Object.fromEntries(
    rootNodeIds.map((id, index) => {
      const skill = skillsByGraphId.get(String(id));
      const classId = skill?.Name?.trim() || skill?.Id?.trim() || `root-${index}`;
      return [classId, String(id)];
    }),
  );
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

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

class BinaryReader {
  private offset = 0;
  private readonly view: DataView;

  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get done(): boolean {
    return this.offset === this.bytes.byteLength;
  }

  get remainingBytes(): number {
    return this.bytes.byteLength - this.offset;
  }

  readU8(): number {
    this.assertAvailable(1);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readU32(): number {
    this.assertAvailable(4);
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readI32(): number {
    this.assertAvailable(4);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readF32(): number {
    this.assertAvailable(4);
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  skip(count: number): void {
    this.assertAvailable(count);
    this.offset += count;
  }

  private assertAvailable(count: number): void {
    if (this.offset + count > this.bytes.byteLength) {
      throw new Error("Passive skill graph ended unexpectedly");
    }
  }
}

import { decompressSync, strFromU8 } from "fflate";
import { isAllocatableTreeEdge } from "./pathAllocation";
import type { NodeId, TreeGraph, TreeNode } from "./types";

export type PobBuildGoalImportResult = {
  activeSpecTitle?: string;
  allocatedNodeIds: NodeId[];
  goalNodeIds: NodeId[];
  ignoredNodeIds: NodeId[];
  missingNodeIds: NodeId[];
};

type PobSpecElement = {
  getAttribute: (name: string) => string | null;
};

export function importBuildGoalsFromPobCode(code: string, graph: TreeGraph): PobBuildGoalImportResult {
  return importBuildGoalsFromPobXml(decodePobBuildCode(code), graph);
}

export function decodePobBuildCode(code: string): string {
  try {
    return strFromU8(decompressSync(decodeBase64UrlBytes(code)));
  } catch {
    throw new Error("Could not decode PoB build code.");
  }
}

export function importBuildGoalsFromPobXml(xmlText: string, graph: TreeGraph): PobBuildGoalImportResult {
  const spec = findActiveTreeSpec(xmlText);
  const allocatedNodeIds = uniqueNodeIds(spec.getAttribute("nodes") ?? "");
  const goalNodeIds: NodeId[] = [];
  const ignoredNodeIds: NodeId[] = [];
  const missingNodeIds: NodeId[] = [];
  const mainTreeNodeIds = findMainTreeConnectedNodeIds(graph);
  const importedConnectedNodeIds = findImportedAllocatedConnectedNodeIds(graph, allocatedNodeIds);

  for (const nodeId of allocatedNodeIds) {
    const node = graph.nodes[nodeId];
    if (!node) {
      missingNodeIds.push(nodeId);
    } else if (isBuildGoalableNode(node) && mainTreeNodeIds.has(nodeId) && importedConnectedNodeIds.has(nodeId)) {
      goalNodeIds.push(nodeId);
    } else {
      ignoredNodeIds.push(nodeId);
    }
  }

  return {
    activeSpecTitle: spec.getAttribute("title") ?? undefined,
    allocatedNodeIds,
    goalNodeIds,
    ignoredNodeIds,
    missingNodeIds,
  };
}

function findActiveTreeSpec(xmlText: string): PobSpecElement {
  if (typeof DOMParser !== "function") {
    return findActiveTreeSpecWithoutDomParser(xmlText);
  }

  const document = new DOMParser().parseFromString(xmlText, "application/xml");
  if (document.querySelector("parsererror") || document.documentElement.nodeName !== "PathOfBuilding2") {
    throw new Error("PoB build XML is invalid.");
  }

  const tree = document.querySelector("Tree");
  const specs = Array.from(tree?.children ?? []).filter((child) => child.nodeName === "Spec");
  if (specs.length === 0) {
    throw new Error("PoB build does not contain a passive tree spec.");
  }

  const activeSpecIndex = Math.max(0, (Number(tree?.getAttribute("activeSpec")) || 1) - 1);
  return specs[activeSpecIndex] ?? specs[0];
}

function findActiveTreeSpecWithoutDomParser(xmlText: string): PobSpecElement {
  if (!/<PathOfBuilding2\b/.test(xmlText)) {
    throw new Error("PoB build XML is invalid.");
  }

  const treeMatch = xmlText.match(/<Tree\b([^>]*)>([\s\S]*?)<\/Tree>/);
  if (!treeMatch) {
    throw new Error("PoB build does not contain a passive tree spec.");
  }

  const treeAttributes = parseXmlAttributes(treeMatch[1]);
  const specs = Array.from(treeMatch[2].matchAll(/<Spec\b([^>]*)>/g), (match) => parseXmlAttributes(match[1]));
  if (specs.length === 0) {
    throw new Error("PoB build does not contain a passive tree spec.");
  }

  const activeSpecIndex = Math.max(0, (Number(treeAttributes.get("activeSpec")) || 1) - 1);
  const specAttributes = specs[activeSpecIndex] ?? specs[0];
  return {
    getAttribute: (name: string) => specAttributes.get(name) ?? null,
  };
}

function parseXmlAttributes(attributeText: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of attributeText.matchAll(/([A-Za-z_:][\w:.-]*)\s*=\s*"([^"]*)"/g)) {
    attributes.set(match[1], decodeXmlAttribute(match[2]));
  }

  return attributes;
}

function decodeXmlAttribute(value: string): string {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function uniqueNodeIds(nodeText: string): NodeId[] {
  return Array.from(new Set(Array.from(nodeText.matchAll(/\d+/g), ([nodeId]) => nodeId)));
}

function isBuildGoalableNode(node: TreeNode): boolean {
  return Boolean(node.flags.notable || node.flags.keystone || node.flags.jewelSocket);
}

function findMainTreeConnectedNodeIds(graph: TreeGraph): Set<NodeId> {
  return findReachableNodeIds(
    buildAllocatableAdjacency(graph),
    Object.values(graph.classStarts).filter((nodeId) => graph.nodes[nodeId]),
  );
}

function findImportedAllocatedConnectedNodeIds(graph: TreeGraph, allocatedNodeIds: NodeId[]): Set<NodeId> {
  const allowedNodeIds = new Set<NodeId>(allocatedNodeIds.filter((nodeId) => graph.nodes[nodeId]));
  for (const nodeId of Object.values(graph.classStarts)) {
    if (graph.nodes[nodeId]) {
      allowedNodeIds.add(nodeId);
    }
  }

  return findReachableNodeIds(
    buildAllocatableAdjacency(graph, allowedNodeIds),
    Object.values(graph.classStarts).filter((nodeId) => graph.nodes[nodeId]),
  );
}

function buildAllocatableAdjacency(graph: TreeGraph, allowedNodeIds?: ReadonlySet<NodeId>): Map<NodeId, NodeId[]> {
  const adjacency = new Map<NodeId, NodeId[]>();
  for (const edge of graph.edges) {
    if (!isAllocatableTreeEdge(graph, edge)) continue;
    if (allowedNodeIds && (!allowedNodeIds.has(edge.from) || !allowedNodeIds.has(edge.to))) continue;
    appendNeighbor(adjacency, edge.from, edge.to);
    appendNeighbor(adjacency, edge.to, edge.from);
  }

  return adjacency;
}

function findReachableNodeIds(adjacency: Map<NodeId, NodeId[]>, startNodeIds: NodeId[]): Set<NodeId> {
  const connectedNodeIds = new Set<NodeId>();
  const queue = [...startNodeIds];
  for (const nodeId of queue) {
    connectedNodeIds.add(nodeId);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const next of adjacency.get(current) ?? []) {
      if (connectedNodeIds.has(next)) continue;
      connectedNodeIds.add(next);
      queue.push(next);
    }
  }

  return connectedNodeIds;
}

function appendNeighbor(adjacency: Map<NodeId, NodeId[]>, from: NodeId, to: NodeId) {
  const neighbors = adjacency.get(from);
  if (neighbors) neighbors.push(to);
  else adjacency.set(from, [to]);
}

function decodeBase64UrlBytes(input: string): Uint8Array {
  const base64 = input.trim().replace(/\s+/g, "").replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  if (typeof atob === "function") {
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(padded, "base64"));
  }

  throw new Error("No base64 decoder is available.");
}

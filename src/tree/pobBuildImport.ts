import { decompressSync, strFromU8 } from "fflate";
import { isAllocatableTreeEdge } from "./pathAllocation";
import type { NodeId, TreeGraph, TreeNode } from "./types";

export type PobBuildGoalImportResult = {
  activeSpecTitle?: string;
  className?: string;
  ascendClassName?: string;
  allocatedNodeIds: NodeId[];
  weaponSetNodeIds: NodeId[];
  weaponSet1NodeIds: NodeId[];
  weaponSet2NodeIds: NodeId[];
  ascendancyNodeIds: NodeId[];
  pobBasePassivePointCount: number;
  goalNodeIds: NodeId[];
  ignoredNodeIds: NodeId[];
  missingNodeIds: NodeId[];
};

type PobSpecElement = {
  getAttribute: (name: string) => string | null;
  getChildAttributes: (elementNamePattern: RegExp, attributeName: string) => string[];
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
  const metadata = findBuildMetadata(xmlText);
  const rawAllocatedNodeIds = uniqueNodeIds(spec.getAttribute("nodes") ?? "");
  const weaponSet1NodeIdSet = new Set(uniqueNodeIds(spec.getChildAttributes(/^WeaponSet1$/, "nodes").join(",")));
  const weaponSet2NodeIdSet = new Set(uniqueNodeIds(spec.getChildAttributes(/^WeaponSet2$/, "nodes").join(",")));
  const weaponSetNodeIdSet = new Set([...weaponSet1NodeIdSet, ...weaponSet2NodeIdSet]);
  const weaponSet1NodeIds = rawAllocatedNodeIds.filter((nodeId) => weaponSet1NodeIdSet.has(nodeId));
  const weaponSet2NodeIds = rawAllocatedNodeIds.filter((nodeId) => weaponSet2NodeIdSet.has(nodeId));
  const weaponSetNodeIds = rawAllocatedNodeIds.filter((nodeId) => weaponSetNodeIdSet.has(nodeId));
  const allocatedNodeIds = rawAllocatedNodeIds.filter((nodeId) => !weaponSetNodeIdSet.has(nodeId));
  const ascendancyNodeIds = rawAllocatedNodeIds.filter((nodeId) => isPobCountedAscendancyPassive(graph.nodes[nodeId]));
  const pobBasePassivePointCount = countPobBasePassivePoints(
    rawAllocatedNodeIds,
    weaponSet1NodeIds,
    weaponSet2NodeIds,
    graph,
  );
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
    className: metadata.className,
    ascendClassName: metadata.ascendClassName,
    allocatedNodeIds,
    weaponSetNodeIds,
    weaponSet1NodeIds,
    weaponSet2NodeIds,
    ascendancyNodeIds,
    pobBasePassivePointCount,
    goalNodeIds,
    ignoredNodeIds,
    missingNodeIds,
  };
}

function countPobBasePassivePoints(
  rawAllocatedNodeIds: NodeId[],
  weaponSet1NodeIds: NodeId[],
  weaponSet2NodeIds: NodeId[],
  graph: TreeGraph,
): number {
  const mainTreeAllocatedNodeCount = rawAllocatedNodeIds.filter((nodeId) => isPobCountedMainTreePassive(graph.nodes[nodeId])).length;
  const weaponSet1Count = weaponSet1NodeIds.filter((nodeId) => isPobCountedMainTreePassive(graph.nodes[nodeId])).length;
  const weaponSet2Count = weaponSet2NodeIds.filter((nodeId) => isPobCountedMainTreePassive(graph.nodes[nodeId])).length;
  return mainTreeAllocatedNodeCount - Math.min(weaponSet1Count, weaponSet2Count);
}

function isPobCountedMainTreePassive(node: TreeNode | undefined): boolean {
  return Boolean(node && !node.flags.classStart && !node.flags.ascendancy);
}

function isPobCountedAscendancyPassive(node: TreeNode | undefined): boolean {
  return Boolean(node?.flags.ascendancy && !node.flags.classStart);
}

function findBuildMetadata(xmlText: string): { className?: string; ascendClassName?: string } {
  if (typeof DOMParser === "function") {
    const document = new DOMParser().parseFromString(xmlText, "application/xml");
    if (!document.querySelector("parsererror") && document.documentElement.nodeName === "PathOfBuilding2") {
      const build = document.querySelector("Build");
      return {
        className: firstMeaningfulAttribute(build, document.documentElement, "className"),
        ascendClassName: firstMeaningfulAttribute(build, document.documentElement, "ascendClassName"),
      };
    }
  }

  const rootMatch = xmlText.match(/<PathOfBuilding2\b([^>]*)>/);
  const buildMatch = xmlText.match(/<Build\b([^>]*)>/);
  const rootAttributes = parseXmlAttributes(rootMatch?.[1] ?? "");
  const buildAttributes = parseXmlAttributes(buildMatch?.[1] ?? "");
  return {
    className: firstMeaningfulParsedAttribute(buildAttributes, rootAttributes, "className"),
    ascendClassName: firstMeaningfulParsedAttribute(buildAttributes, rootAttributes, "ascendClassName"),
  };
}

function firstMeaningfulAttribute(
  primary: Element | null,
  fallback: Element,
  name: string,
): string | undefined {
  return meaningfulValue(primary?.getAttribute(name))
    ?? meaningfulValue(fallback.getAttribute(name));
}

function firstMeaningfulParsedAttribute(
  primary: Map<string, string>,
  fallback: Map<string, string>,
  name: string,
): string | undefined {
  return meaningfulValue(primary.get(name))
    ?? meaningfulValue(fallback.get(name));
}

function meaningfulValue(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "None" || trimmed === "NONE") return undefined;
  return trimmed;
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
  return pobSpecElementFromDomElement(specs[activeSpecIndex] ?? specs[0]);
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
  const specs = Array.from(treeMatch[2].matchAll(/<Spec\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Spec>)/g), (match) => ({
    attributes: parseXmlAttributes(match[1]),
    innerXml: match[2] ?? "",
  }));
  if (specs.length === 0) {
    throw new Error("PoB build does not contain a passive tree spec.");
  }

  const activeSpecIndex = Math.max(0, (Number(treeAttributes.get("activeSpec")) || 1) - 1);
  const spec = specs[activeSpecIndex] ?? specs[0];
  return {
    getAttribute: (name: string) => spec.attributes.get(name) ?? null,
    getChildAttributes: (elementNamePattern: RegExp, attributeName: string) => (
      Array.from(spec.innerXml.matchAll(/<([A-Za-z_:][\w:.-]*)\b([^>]*)>/g))
        .filter((match) => matchesElementName(elementNamePattern, match[1]))
        .map((match) => parseXmlAttributes(match[2]).get(attributeName))
        .filter((value): value is string => value !== undefined)
    ),
  };
}

function pobSpecElementFromDomElement(element: Element): PobSpecElement {
  return {
    getAttribute: (name: string) => element.getAttribute(name),
    getChildAttributes: (elementNamePattern: RegExp, attributeName: string) => (
      Array.from(element.children)
        .filter((child) => matchesElementName(elementNamePattern, child.nodeName))
        .map((child) => child.getAttribute(attributeName))
        .filter((value): value is string => value !== null)
    ),
  };
}

function matchesElementName(pattern: RegExp, elementName: string): boolean {
  pattern.lastIndex = 0;
  return pattern.test(elementName);
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

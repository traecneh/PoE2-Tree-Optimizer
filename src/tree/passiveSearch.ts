import type { TreeGraph, TreeNode } from "./types";

export type PassiveSearchResult = {
  node: TreeNode;
  matchedText: string;
};

const maxSearchResults = 60;

export function searchPassiveTree(graph: TreeGraph, query: string): PassiveSearchResult[] {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [];

  return Object.values(graph.nodes)
    .flatMap((node) => {
      const searchableText = searchableNodeText(node);
      if (!tokens.every((token) => searchableText.includes(token))) return [];
      return [{ node, matchedText: firstMatchedLine(node, tokens) }];
    })
    .slice(0, maxSearchResults);
}

function searchableNodeText(node: TreeNode): string {
  const parts = [
    node.id,
    node.name,
    ...node.stats,
    ...flagSearchTerms(node),
  ];
  const normalized = normalizeSearchText(parts.filter(Boolean).join(" "));
  const aliases: string[] = [];

  if (normalized.includes("critical hit")) aliases.push("critical strike");
  if (normalized.includes("critical strike")) aliases.push("critical hit");

  return [normalized, ...aliases].join(" ");
}

function flagSearchTerms(node: TreeNode): string[] {
  const terms: string[] = [];
  if (node.flags.classStart) terms.push("class start starting point");
  if (node.flags.attribute) terms.push("attribute");
  if (node.flags.small) terms.push("small passive");
  if (node.flags.notable) terms.push("notable passive");
  if (node.flags.keystone) terms.push("keystone passive");
  if (node.flags.jewelSocket) terms.push("jewel socket empty jewel slot empty jewel slots");
  return terms;
}

function firstMatchedLine(node: TreeNode, tokens: string[]): string {
  const lines = [node.name, ...node.stats, node.id, ...flagSearchTerms(node)].filter(isNonEmptyString);
  return lines.find((line) => {
    const normalizedLine = normalizeSearchText(line);
    return tokens.some((token) => normalizedLine.includes(token));
  }) ?? node.name ?? node.id;
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+%]+/g, " ").trim();
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value);
}

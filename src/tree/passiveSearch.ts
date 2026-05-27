import type { TreeGraph, TreeNode } from "./types";

export type PassiveSearchResult = {
  node: TreeNode;
  matchedText: string;
};

export type PassiveSearchIndex = {
  items: PassiveSearchIndexItem[];
};

type PassiveSearchIndexItem = {
  node: TreeNode;
  searchableText: string;
  matchedLines: PassiveSearchMatchedLine[];
};

type PassiveSearchMatchedLine = {
  raw: string;
  normalized: string;
};

type ParsedPassiveSearchQuery = {
  includeTerms: string[];
  includePhrases: string[];
  excludeTerms: string[];
  excludePhrases: string[];
};

export function createPassiveSearchIndex(graph: TreeGraph): PassiveSearchIndex {
  return {
    items: Object.values(graph.nodes).map((node) => ({
      node,
      searchableText: searchableNodeText(node),
      matchedLines: searchableNodeLines(node),
    })),
  };
}

export function searchPassiveTree(source: TreeGraph | PassiveSearchIndex, query: string): PassiveSearchResult[] {
  const parsedQuery = parsePassiveSearchQuery(query);
  if (!hasSearchRequirements(parsedQuery)) return [];
  const index = isPassiveSearchIndex(source) ? source : createPassiveSearchIndex(source);

  return index.items
    .flatMap((node) => {
      if (!matchesPassiveSearchQuery(node.searchableText, parsedQuery)) return [];
      return [{ node: node.node, matchedText: firstMatchedLine(node, parsedQuery) }];
    });
}

function isPassiveSearchIndex(source: TreeGraph | PassiveSearchIndex): source is PassiveSearchIndex {
  return "items" in source;
}

function searchableNodeText(node: TreeNode): string {
  const parts = [
    node.id,
    node.name,
    ...node.stats,
    ...masteryStatLines(node),
    ...flagSearchTerms(node),
  ];
  const normalized = normalizeSearchText(parts.filter(Boolean).join(" "));
  const aliases: string[] = [];

  if (normalized.includes("critical hit")) aliases.push("critical strike");
  if (normalized.includes("critical strike")) aliases.push("critical hit");

  return [normalized, ...aliases].join(" ");
}

function parsePassiveSearchQuery(query: string): ParsedPassiveSearchQuery {
  const parsedQuery: ParsedPassiveSearchQuery = {
    includeTerms: [],
    includePhrases: [],
    excludeTerms: [],
    excludePhrases: [],
  };
  let index = 0;

  while (index < query.length) {
    while (index < query.length && /\s/.test(query[index])) index += 1;
    if (index >= query.length) break;

    const excluded = query[index] === "-" && index + 1 < query.length && !/\s/.test(query[index + 1]);
    if (excluded) index += 1;

    const quoted = query[index] === "\"";
    const startIndex = quoted ? index + 1 : index;
    let endIndex = startIndex;

    if (quoted) {
      while (endIndex < query.length && query[endIndex] !== "\"") endIndex += 1;
      index = endIndex < query.length ? endIndex + 1 : endIndex;
    } else {
      while (endIndex < query.length && !/\s/.test(query[endIndex])) endIndex += 1;
      index = endIndex;
    }

    const normalized = normalizeSearchText(query.slice(startIndex, endIndex));
    if (!normalized) continue;

    if (quoted) {
      (excluded ? parsedQuery.excludePhrases : parsedQuery.includePhrases).push(normalized);
    } else {
      const terms = normalized.split(" ").filter(Boolean);
      (excluded ? parsedQuery.excludeTerms : parsedQuery.includeTerms).push(...terms);
    }
  }

  return parsedQuery;
}

function hasSearchRequirements(query: ParsedPassiveSearchQuery): boolean {
  return query.includeTerms.length > 0
    || query.includePhrases.length > 0
    || query.excludeTerms.length > 0
    || query.excludePhrases.length > 0;
}

function matchesPassiveSearchQuery(searchableText: string, query: ParsedPassiveSearchQuery): boolean {
  return query.includeTerms.every((token) => searchableText.includes(token))
    && query.includePhrases.every((phrase) => searchableText.includes(phrase))
    && !query.excludeTerms.some((token) => searchableText.includes(token))
    && !query.excludePhrases.some((phrase) => searchableText.includes(phrase));
}

function flagSearchTerms(node: TreeNode): string[] {
  const terms: string[] = [];
  if (node.flags.classStart) terms.push("class start starting point");
  if (node.flags.attribute) terms.push("attribute");
  if (node.flags.small) terms.push("small passive");
  if (node.flags.notable) terms.push("notable passive");
  if (node.flags.keystone) terms.push("keystone passive");
  if (node.flags.jewelSocket) terms.push("jewel socket empty jewel slot empty jewel slots");
  if (node.flags.mastery) terms.push("mastery passive");
  if (node.flags.ascendancy) terms.push("ascendancy passive");
  return terms;
}

function firstMatchedLine(node: PassiveSearchIndexItem, query: ParsedPassiveSearchQuery): string {
  return node.matchedLines.find((line) => (
    query.includeTerms.every((token) => line.normalized.includes(token))
    && query.includePhrases.every((phrase) => line.normalized.includes(phrase))
  ))?.raw
    ?? node.matchedLines.find((line) => (
      query.includePhrases.some((phrase) => line.normalized.includes(phrase))
      || query.includeTerms.some((token) => line.normalized.includes(token))
    ))?.raw
    ?? node.node.name
    ?? node.node.id;
}

function searchableNodeLines(node: TreeNode): PassiveSearchMatchedLine[] {
  return [node.name, ...node.stats, ...masteryStatLines(node), node.id, ...flagSearchTerms(node)]
    .filter(isNonEmptyString)
    .map((line) => ({ raw: line, normalized: normalizeSearchText(line) }));
}

function masteryStatLines(node: TreeNode): string[] {
  return node.masteryEffects?.flatMap((effect) => effect.stats) ?? [];
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+%]+/g, " ").trim();
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value);
}

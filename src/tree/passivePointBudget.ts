import type { TreeGraph } from "./types";

export const maxPassiveAllocationPointCount = 123;

export function countMainPassivePoints(graph: TreeGraph, nodeIds: readonly string[]): number {
  return [...new Set(nodeIds)].filter((id) => {
    const node = graph.nodes[id];
    return node && !node.flags.classStart && !node.flags.ascendancy;
  }).length;
}

export function normalizeMainPointLimit(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(maxPassiveAllocationPointCount, Math.floor(value)))
    : maxPassiveAllocationPointCount;
}

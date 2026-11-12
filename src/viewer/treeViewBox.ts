import type { TreeGraph, TreeNode } from "../tree/types";

export function buildTreeFitBounds(nodes: Record<string, TreeNode>, activeAscendancyId: string | undefined, fallback: TreeGraph["bounds"]): TreeGraph["bounds"] {
  const points = Object.values(nodes).filter(node => !node.flags.ascendancy || (activeAscendancyId && node.ascendancy?.id === activeAscendancyId));
  if (points.length === 0) return fallback;
  return points.reduce((bounds, node) => ({
    minX: Math.min(bounds.minX, node.position.x), maxX: Math.max(bounds.maxX, node.position.x),
    minY: Math.min(bounds.minY, node.position.y), maxY: Math.max(bounds.maxY, node.position.y),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
}

export function buildFitViewBox(bounds: TreeGraph["bounds"], padding: number): string {
  const x = bounds.minX - padding;
  const y = bounds.minY - padding;
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  return `${x} ${y} ${width} ${height}`;
}

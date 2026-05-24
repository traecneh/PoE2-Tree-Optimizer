import type { TreeGraph } from "../tree/types";

export function buildFitViewBox(bounds: TreeGraph["bounds"], padding: number): string {
  const x = bounds.minX - padding;
  const y = bounds.minY - padding;
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  return `${x} ${y} ${width} ${height}`;
}

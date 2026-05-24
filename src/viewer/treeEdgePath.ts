import { getPoe2OrbitRadius } from "../tree/orbits";
import type { TreeEdge, TreeGroup, TreeNode } from "../tree/types";

const sameOrbitRadiusTolerance = 35;
const minArcRadius = 40;

export function buildTreeEdgePath(from: TreeNode, to: TreeNode, group?: TreeGroup, edge?: TreeEdge): string {
  const routedArc = buildConnectionOrbitArc(from, to, edge?.connectionOrbit);
  const arc = routedArc ?? (group?.position ? buildSameOrbitArc(from, to, group.position, edge) : undefined);
  return arc ?? `M ${formatPathNumber(from.position.x)} ${formatPathNumber(from.position.y)} L ${formatPathNumber(to.position.x)} ${formatPathNumber(to.position.y)}`;
}

function buildConnectionOrbitArc(from: TreeNode, to: TreeNode, connectionOrbit: number | undefined): string | undefined {
  if (connectionOrbit === undefined || connectionOrbit === 0) return undefined;

  const radius = getPoe2OrbitRadius(Math.abs(connectionOrbit));
  if (!radius || radius < minArcRadius) return undefined;

  const chordLength = distance(from.position, to.position);
  if (chordLength === 0 || chordLength > radius * 2) return undefined;

  return buildArcPath(from, to, radius, connectionOrbit > 0 ? 1 : 0);
}

function buildSameOrbitArc(
  from: TreeNode,
  to: TreeNode,
  center: { x: number; y: number },
  edge?: TreeEdge,
): string | undefined {
  if (edge?.connectionOrbit !== undefined && edge.connectionOrbit !== 0) return undefined;
  if (from.layout && to.layout && from.layout.orbit !== to.layout.orbit) return undefined;

  const fromRadius = distance(from.position, center);
  const toRadius = distance(to.position, center);
  const radius = (fromRadius + toRadius) / 2;
  if (radius < minArcRadius || Math.abs(fromRadius - toRadius) > sameOrbitRadiusTolerance) return undefined;

  const fromAngle = Math.atan2(from.position.y - center.y, from.position.x - center.x);
  const toAngle = Math.atan2(to.position.y - center.y, to.position.x - center.x);
  const sweep = positiveAngleDelta(fromAngle, toAngle) <= Math.PI ? 1 : 0;

  return buildArcPath(from, to, radius, sweep);
}

function buildArcPath(from: TreeNode, to: TreeNode, radius: number, sweep: 0 | 1): string {
  const formattedRadius = formatPathNumber(radius);
  return [
    "M",
    formatPathNumber(from.position.x),
    formatPathNumber(from.position.y),
    "A",
    formattedRadius,
    formattedRadius,
    "0",
    "0",
    String(sweep),
    formatPathNumber(to.position.x),
    formatPathNumber(to.position.y),
  ].join(" ");
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function positiveAngleDelta(fromAngle: number, toAngle: number): number {
  const delta = toAngle - fromAngle;
  return delta >= 0 ? delta : delta + Math.PI * 2;
}

function formatPathNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}

import type { TreeGroup, TreeNode } from "../tree/types";

const sameOrbitRadiusTolerance = 35;
const minArcRadius = 40;

export function buildTreeEdgePath(from: TreeNode, to: TreeNode, group?: TreeGroup): string {
  const arc = group?.position ? buildSameOrbitArc(from, to, group.position) : undefined;
  return arc ?? `M ${formatPathNumber(from.position.x)} ${formatPathNumber(from.position.y)} L ${formatPathNumber(to.position.x)} ${formatPathNumber(to.position.y)}`;
}

function buildSameOrbitArc(
  from: TreeNode,
  to: TreeNode,
  center: { x: number; y: number },
): string | undefined {
  const fromRadius = distance(from.position, center);
  const toRadius = distance(to.position, center);
  const radius = (fromRadius + toRadius) / 2;
  if (radius < minArcRadius || Math.abs(fromRadius - toRadius) > sameOrbitRadiusTolerance) return undefined;

  const fromAngle = Math.atan2(from.position.y - center.y, from.position.x - center.x);
  const toAngle = Math.atan2(to.position.y - center.y, to.position.x - center.x);
  const sweep = positiveAngleDelta(fromAngle, toAngle) <= Math.PI ? 1 : 0;
  const largeArc = smallerAngleDelta(fromAngle, toAngle) > Math.PI ? 1 : 0;
  const formattedRadius = formatPathNumber(radius);

  return [
    "M",
    formatPathNumber(from.position.x),
    formatPathNumber(from.position.y),
    "A",
    formattedRadius,
    formattedRadius,
    "0",
    String(largeArc),
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

function smallerAngleDelta(fromAngle: number, toAngle: number): number {
  const delta = Math.abs(toAngle - fromAngle);
  return Math.min(delta, Math.PI * 2 - delta);
}

function formatPathNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}

import { isAllocatableTreeEdge } from "./pathAllocation";
import { maxPassiveAllocationPointCount, normalizeMainPointLimit } from "./passivePointBudget";
import type { TreeGraph } from "./types";

export type FixedWeaponSets = {
  allocations: { 1: string[]; 2: string[] };
  attachmentNodeIds: string[];
};
type BudgetRequest = { mode: string; totalPointLimit?: number; weaponSets?: FixedWeaponSets };
export function hasMainPointCap(request: BudgetRequest): boolean {
  return request.mode === "weighted" || request.totalPointLimit !== undefined || request.weaponSets !== undefined;
}
export function availableMainPointLimit(request: BudgetRequest): number {
  const sets = request.weaponSets?.allocations;
  const reserved = sets ? Math.max(new Set(sets[1]).size, new Set(sets[2]).size) : 0;
  return Math.min(normalizeMainPointLimit(request.totalPointLimit), Math.max(0, maxPassiveAllocationPointCount - reserved));
}

export function fixedWeaponComponents(graph: TreeGraph, weapons: FixedWeaponSets, baseNodeIds: string[]) {
  const reserved = new Set([...weapons.allocations[1], ...weapons.allocations[2]]);
  const anchors = new Set([...baseNodeIds, ...weapons.attachmentNodeIds]);
  const edges = graph.edges.filter((edge) => isAllocatableTreeEdge(graph, edge));
  return ([1, 2] as const).flatMap((set) => {
    const remaining = new Set(weapons.allocations[set]);
    const components: { set: 1 | 2; nodeIds: string[]; attachments: string[] }[] = [];
    while (remaining.size) {
      const queue = [remaining.values().next().value!], attachments = new Set<string>(); remaining.delete(queue[0]);
      for (let i = 0; i < queue.length; i += 1) for (const edge of edges) {
        const next = edge.from === queue[i] ? edge.to : edge.to === queue[i] ? edge.from : undefined;
        if (next === undefined) continue;
        if (remaining.delete(next)) queue.push(next);
        else if (!reserved.has(next) && anchors.has(next)) attachments.add(next);
      }
      components.push({ set, nodeIds: queue, attachments: [...attachments] });
    }
    return components;
  });
}

export function filterWeaponAttachments(graph: TreeGraph, attachments: readonly string[], allocations: FixedWeaponSets["allocations"]): string[] {
  const reserved = new Set([...allocations[1], ...allocations[2]]), adjacent = new Set<string>();
  for (const edge of graph.edges) if (isAllocatableTreeEdge(graph, edge)) {
    if (reserved.has(edge.from) && !reserved.has(edge.to)) adjacent.add(edge.to);
    if (reserved.has(edge.to) && !reserved.has(edge.from)) adjacent.add(edge.from);
  }
  return [...new Set(attachments)].filter((id) => !graph.nodes[id] || adjacent.has(id) && !graph.nodes[id].flags.ascendancy && !graph.nodes[id].flags.mastery).sort();
}

// Only the root-connected shared reference may supply imported attachment nodes.
export function deriveWeaponAttachments(graph: TreeGraph, sharedNodeIds: readonly string[], allocations: FixedWeaponSets["allocations"], rootNodeId: string | undefined): string[] {
  if (!rootNodeId) return [];
  const reserved = new Set([...allocations[1], ...allocations[2]]);
  const shared = new Set(sharedNodeIds.filter((id) => graph.nodes[id] && !reserved.has(id) && !graph.nodes[id].flags.ascendancy && !graph.nodes[id].flags.mastery));
  const reached = new Set(shared.has(rootNodeId) ? [rootNodeId] : []), queue = [...reached];
  const edges = graph.edges.filter((edge) => shared.has(edge.from) && shared.has(edge.to) && isAllocatableTreeEdge(graph, edge));
  for (let i = 0; i < queue.length; i += 1) for (const edge of edges) {
    const next = edge.from === queue[i] ? edge.to : edge.to === queue[i] ? edge.from : undefined;
    if (next !== undefined && !reached.has(next)) { reached.add(next); queue.push(next); }
  }
  return filterWeaponAttachments(graph, [...reached], allocations);
}

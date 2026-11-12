import type { BranchTopology, BranchDomain } from "./branch-complete-plan";

const numeric = (a: string, b: string) => Number(a) - Number(b) || a.localeCompare(b);
const requireCondition = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };
export const recipientFanoutBounds = { minimumComponentNodes: 2, maximumComponentNodes: 8, maximumVariables: 16 } as const;

// The donor is an existing frozen choice. Enumerate every complete eligible
// recipient component without reading a reward, stat, name or preference.
export function enumerateRecipientAlternatives(input: BranchTopology, donor: Pick<BranchDomain, "donorAnchorNodeId" | "donorNodeIds">) {
  requireCondition(input.nodeIds.length <= 100_000 && input.edges.length <= 500_000, "Oversized structural graph");
  for (const ids of [input.nodeIds, input.incumbentNodeIds, input.protectedNodeIds, input.eligibleNodeIds, donor.donorNodeIds]) {
    requireCondition(new Set(ids).size === ids.length && ids.every((id) => typeof id === "string" && id.length > 0), "Duplicate/invalid structural identifier");
  }
  const known = new Set(input.nodeIds), selected = new Set(input.incumbentNodeIds), eligible = new Set(input.eligibleNodeIds);
  const protectedIds = new Set([input.rootNodeId, ...input.protectedNodeIds]), donorIds = new Set(donor.donorNodeIds);
  requireCondition([...selected, ...eligible, ...protectedIds, donor.donorAnchorNodeId, ...donorIds].every((id) => known.has(id)), "Unknown structural node");
  requireCondition([...protectedIds].every((id) => selected.has(id)), "Missing protected node");
  requireCondition(Number.isSafeInteger(input.pointLimit) && input.pointLimit === selected.size - 1, "Expected full-budget incumbent");
  requireCondition(donorIds.size >= 2 && donorIds.size <= 8 && selected.has(donor.donorAnchorNodeId) && !donorIds.has(donor.donorAnchorNodeId), "Invalid frozen donor");
  requireCondition([...donorIds].every((id) => selected.has(id) && eligible.has(id) && !protectedIds.has(id)), "Frozen donor is not optional/eligible");
  const adjacency = new Map(input.nodeIds.map((id) => [id, new Set<string>()]));
  for (const [a, b] of input.edges) {
    requireCondition(known.has(a) && known.has(b), "Unknown structural edge");
    if (a !== b) { adjacency.get(a)!.add(b); adjacency.get(b)!.add(a); }
  }
  const next = new Map([...adjacency].map(([id, neighbors]) => [id, [...neighbors].sort(numeric)]));
  const walk = (starts: string[], allowed: Set<string>) => {
    const seen = new Set<string>(), order: string[] = [];
    for (const start of starts) if (allowed.has(start) && !seen.has(start)) { seen.add(start); order.push(start); }
    for (let i = 0; i < order.length; i += 1) for (const id of next.get(order[i])!) if (allowed.has(id) && !seen.has(id)) { seen.add(id); order.push(id); }
    return order;
  };
  requireCondition(walk([input.rootNodeId], selected).length === selected.size, "Disconnected incumbent");
  const component = walk([donor.donorNodeIds[0]], new Set([...selected].filter((id) => id !== donor.donorAnchorNodeId))).sort(numeric);
  requireCondition(JSON.stringify(component) === JSON.stringify([...donor.donorNodeIds].sort(numeric)), "Frozen donor omits selected descendants");
  const fixed = new Set([...selected].filter((id) => !donorIds.has(id)));
  requireCondition(walk([input.rootNodeId], fixed).length === fixed.size, "Frozen donor disconnects fixed allocation");
  const donorOrder = walk([donor.donorAnchorNodeId], new Set([donor.donorAnchorNodeId, ...donorIds])).filter((id) => id !== donor.donorAnchorNodeId);
  const off = new Set([...eligible].filter((id) => !selected.has(id))), visited = new Set<string>();
  const domains: BranchDomain[] = [], rejected: { firstNodeId: string; size: number; reason: string }[] = [];
  let componentCount = 0, boundedWithSelectedAttachment = 0;
  for (const start of [...off].sort(numeric)) {
    if (visited.has(start)) continue;
    const ids = walk([start], off).sort(numeric); ids.forEach((id) => visited.add(id)); componentCount += 1;
    const reject = (reason: string) => rejected.push({ firstNodeId: ids[0], size: ids.length, reason });
    if (ids.length < 2 || ids.length > 8) { reject("Whole eligible component outside 2..8-node bounds; not clipped"); continue; }
    const selectedBoundary = [...new Set(ids.flatMap((id) => next.get(id)!.filter((n) => selected.has(n))))].sort(numeric);
    if (!selectedBoundary.length) { reject("No selected attachment"); continue; }
    boundedWithSelectedAttachment += 1;
    const fixedBoundary = selectedBoundary.filter((id) => fixed.has(id));
    if (!fixedBoundary.length) { reject("Depends entirely on the frozen donor"); continue; }
    const variableNodeIds = [...donor.donorNodeIds, ...ids].sort(numeric);
    requireCondition(variableNodeIds.length <= 16 && new Set(variableNodeIds).size === variableNodeIds.length, "Oversized/overlapping domain");
    const recipientOrder = walk(ids.filter((id) => next.get(id)!.some((n) => fixed.has(n))), new Set(ids));
    const witnesses = [0, 1, 2].map((transfer) => {
      const selectedVariableNodeIds = [...donorOrder.slice(0, donorIds.size - transfer), ...recipientOrder.slice(0, transfer)].sort(numeric);
      const allocation = new Set([...fixed, ...selectedVariableNodeIds]);
      requireCondition(allocation.size - 1 === input.pointLimit && walk([input.rootNodeId], allocation).length === allocation.size, "Invalid full-budget witness");
      return { donorPoints: donorIds.size - transfer, recipientPoints: transfer, selectedVariableNodeIds };
    });
    domains.push({ donorAnchorNodeId: donor.donorAnchorNodeId, donorNodeIds: [...donor.donorNodeIds], recipientNodeIds: ids,
      recipientBoundaryNodeIds: fixedBoundary, variableNodeIds, witnesses });
  }
  return { domains, rejected, componentCount, boundedWithSelectedAttachment };
}

// Pure structural selection: no stats, names, preferences or reward callbacks.
export type BranchTopology = {
  nodeIds: string[]; edges: [string, string][]; rootNodeId: string; incumbentNodeIds: string[];
  protectedNodeIds: string[]; eligibleNodeIds: string[]; pointLimit: number;
};
export type BranchDomain = {
  donorAnchorNodeId: string; donorNodeIds: string[]; recipientBoundaryNodeIds: string[]; recipientNodeIds: string[];
  variableNodeIds: string[]; witnesses: { donorPoints: number; recipientPoints: number; selectedVariableNodeIds: string[] }[];
};
export const branchSelectionPolicy = { minimumBranchNodes: 2, maximumBranchNodes: 8, maximumVariables: 16, maximumPairCandidates: 256 } as const;
const numeric = (a: string, b: string) => Number(a) - Number(b) || a.localeCompare(b);
const requireCondition = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };

export function selectBranchCompleteDomain(input: BranchTopology) {
  requireCondition(input.nodeIds.length <= 100_000 && input.edges.length <= 500_000, "Structural input too large");
  for (const ids of [input.nodeIds, input.incumbentNodeIds, input.protectedNodeIds, input.eligibleNodeIds]) {
    requireCondition(new Set(ids).size === ids.length && ids.every((id) => typeof id === "string" && id.length > 0), "Duplicate/invalid structural node");
  }
  const known = new Set(input.nodeIds), selected = new Set(input.incumbentNodeIds), eligible = new Set(input.eligibleNodeIds);
  const protectedIds = new Set([input.rootNodeId, ...input.protectedNodeIds]);
  requireCondition([...selected, ...eligible, ...protectedIds].every((id) => known.has(id)), "Unknown structural node");
  requireCondition([...protectedIds].every((id) => selected.has(id)), "Missing protected allocation");
  requireCondition(Number.isSafeInteger(input.pointLimit) && input.pointLimit === selected.size - 1, "Structural batch requires a full-budget incumbent");
  const adjacency = new Map(input.nodeIds.map((id) => [id, new Set<string>()]));
  for (const [a, b] of input.edges) {
    requireCondition(known.has(a) && known.has(b), "Unknown structural edge");
    if (a !== b) { adjacency.get(a)!.add(b); adjacency.get(b)!.add(a); }
  }
  const orderedNext = new Map([...adjacency].map(([id, next]) => [id, [...next].sort(numeric)]));
  const walk = (starts: string[], allowed: Set<string>) => {
    const seen = new Set<string>(), order: string[] = [];
    for (const start of starts) if (allowed.has(start) && !seen.has(start)) { seen.add(start); order.push(start); }
    for (let i = 0; i < order.length; i += 1) for (const next of orderedNext.get(order[i])!) if (allowed.has(next) && !seen.has(next)) { seen.add(next); order.push(next); }
    return order;
  };
  requireCondition(walk([input.rootNodeId], selected).length === selected.size, "Disconnected structural incumbent");
  const rejected: { kind: "donor" | "recipient" | "pair"; firstNodeId: string; size: number; anchorNodeId?: string; reason: string }[] = [];
  const donors: { anchor: string; ids: string[] }[] = [], seenDonors = new Set<string>();
  for (const anchor of [...selected].sort(numeric)) {
    const remaining = new Set([...selected].filter((id) => id !== anchor)), visited = new Set<string>();
    for (const start of [...remaining].sort(numeric)) {
      if (visited.has(start)) continue;
      const ids = walk([start], remaining).sort(numeric); ids.forEach((id) => visited.add(id));
      const reject = (reason: string) => rejected.push({ kind: "donor", firstNodeId: ids[0], size: ids.length, anchorNodeId: anchor, reason });
      if (ids.some((id) => protectedIds.has(id) || !eligible.has(id))) { reject("Contains protected or ineligible selected descendants"); continue; }
      if (ids.length < branchSelectionPolicy.minimumBranchNodes || ids.length > branchSelectionPolicy.maximumBranchNodes) { reject("Whole selected branch outside 2..8-node bounds; not clipped"); continue; }
      const key = ids.join("|");
      if (seenDonors.has(key)) { reject("Duplicate complete branch"); continue; }
      seenDonors.add(key); donors.push({ anchor, ids });
    }
  }
  const off = new Set([...eligible].filter((id) => !selected.has(id))), offSeen = new Set<string>();
  const recipients: { ids: string[]; boundary: string[] }[] = [];
  for (const start of [...off].sort(numeric)) {
    if (offSeen.has(start)) continue;
    const ids = walk([start], off).sort(numeric); ids.forEach((id) => offSeen.add(id));
    const reject = (reason: string) => rejected.push({ kind: "recipient", firstNodeId: ids[0], size: ids.length, reason });
    if (ids.length < branchSelectionPolicy.minimumBranchNodes || ids.length > branchSelectionPolicy.maximumBranchNodes) { reject("Whole eligible unallocated component outside 2..8-node bounds; not clipped"); continue; }
    const boundary = [...new Set(ids.flatMap((id) => orderedNext.get(id)!.filter((next) => selected.has(next))))].sort(numeric);
    if (!boundary.length) { reject("No selected boundary attachment"); continue; }
    recipients.push({ ids, boundary });
  }
  let pairCandidates = 0;
  for (const donor of donors) for (const recipient of recipients) {
    if (pairCandidates === branchSelectionPolicy.maximumPairCandidates) return { domain: null, donorsConsidered: donors.length, recipientsConsidered: recipients.length, pairCandidates, rejected, unavailable: "Topology-only pair-candidate bound reached" };
    pairCandidates += 1;
    const donorSet = new Set(donor.ids), fixed = new Set([...selected].filter((id) => !donorSet.has(id))), fixedBoundary = recipient.boundary.filter((id) => fixed.has(id));
    const reject = (reason: string) => rejected.push({ kind: "pair", firstNodeId: recipient.ids[0], size: donor.ids.length + recipient.ids.length, anchorNodeId: donor.anchor, reason });
    if (!fixedBoundary.length) { reject("Recipient depends entirely on the removable donor"); continue; }
    const donorOrder = walk([donor.anchor], new Set([donor.anchor, ...donor.ids])).filter((id) => id !== donor.anchor);
    const entry = recipient.ids.filter((id) => orderedNext.get(id)!.some((next) => fixed.has(next))), recipientOrder = walk(entry, new Set(recipient.ids));
    const variableNodeIds = [...new Set([...donor.ids, ...recipient.ids])].sort(numeric);
    requireCondition(variableNodeIds.length <= branchSelectionPolicy.maximumVariables && variableNodeIds.length === donor.ids.length + recipient.ids.length, "Overlapping/oversized structural regions");
    const witnesses = [0, 1, 2].map((transfer) => {
      const ids = [...donorOrder.slice(0, donor.ids.length - transfer), ...recipientOrder.slice(0, transfer)].sort(numeric);
      const allocation = new Set([...fixed, ...ids]);
      requireCondition(allocation.size - 1 === input.pointLimit && walk([input.rootNodeId], allocation).length === allocation.size, "Invalid structural split witness");
      return { donorPoints: donor.ids.length - transfer, recipientPoints: transfer, selectedVariableNodeIds: ids };
    });
    const domain: BranchDomain = { donorAnchorNodeId: donor.anchor, donorNodeIds: donor.ids, recipientBoundaryNodeIds: fixedBoundary, recipientNodeIds: recipient.ids, variableNodeIds, witnesses };
    return { domain, donorsConsidered: donors.length, recipientsConsidered: recipients.length, pairCandidates, rejected, unavailable: null };
  }
  return { domain: null, donorsConsidered: donors.length, recipientsConsidered: recipients.length, pairCandidates, rejected, unavailable: "No complete eligible donor/recipient pair with fixed attachment and three full-budget splits" };
}

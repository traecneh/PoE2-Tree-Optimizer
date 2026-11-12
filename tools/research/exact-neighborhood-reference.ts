import type { NeighborhoodInput } from "./exact-neighborhood";

// Full selected-node sets and raw adjacency; no contraction, bitset connectivity,
// objective pruning or production helpers. Used only to cross-check offline proofs.
export function rawNeighborhoodReference(input: NeighborhoodInput) {
  if (input.variableNodeIds.length > 20) throw new Error("Reference audit is restricted to 20 variables");
  const variable = new Set(input.variableNodeIds), fixed = input.incumbentNodeIds.filter((id) => !variable.has(id));
  const domain = new Set([...fixed, ...input.variableNodeIds]);
  const adjacency = new Map([...domain].map((id) => [id, [] as string[]]));
  for (const [a, b] of input.edges) if (domain.has(a) && domain.has(b)) { adjacency.get(a)!.push(b); adjacency.get(b)!.push(a); }
  let bestScore = -Infinity, bestPoints = Infinity, bestOrdinal = Infinity, bestVariableNodeIds: string[] = [], feasibleSubsets = 0;
  const states = 2 ** input.variableNodeIds.length;
  for (let ordinal = 0; ordinal < states; ordinal += 1) {
    const chosen = input.variableNodeIds.filter((_, i) => Math.floor(ordinal / 2 ** i) % 2 === 1);
    if (fixed.length - 1 + chosen.length > input.pointLimit) continue;
    const selected = new Set([...fixed, ...chosen]), seen = new Set([input.rootNodeId]), queue = [input.rootNodeId];
    for (let i = 0; i < queue.length; i += 1) for (const next of adjacency.get(queue[i])!) {
      if (selected.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
    }
    if (seen.size !== selected.size) continue;
    feasibleSubsets += 1;
    const score = chosen.reduce((sum, id) => sum + input.rewardUnits[id], 0);
    if (score > bestScore || score === bestScore && (chosen.length < bestPoints || chosen.length === bestPoints && ordinal < bestOrdinal)) {
      bestScore = score; bestPoints = chosen.length; bestOrdinal = ordinal; bestVariableNodeIds = chosen;
    }
  }
  return { scoreUnits: bestScore, variablePoints: bestPoints, bestVariableNodeIds, enumerated: states, feasibleSubsets };
}

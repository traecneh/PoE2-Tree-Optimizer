import type { NeighborhoodInput } from "./exact-neighborhood";

// Independent full selected sets/raw adjacency in ordinary binary subset order.
// No Gray-code arithmetic, graph contraction, objective pruning or primary helpers.
export function rawStreamingNeighborhoodReference(input: NeighborhoodInput, options: { shouldStop?: () => boolean; maxStates?: number } = {}) {
  const valid = (condition: unknown) => { if (!condition) throw new Error("Invalid bounded raw-reference input"); };
  const maxStates = options.maxStates ?? 2 ** 24, n = input.variableNodeIds.length;
  valid(n > 0 && n <= 24 && input.nodeIds.length <= 100_000 && input.edges.length <= 500_000);
  valid(Number.isSafeInteger(maxStates) && maxStates > 0 && Number.isSafeInteger(input.pointLimit) && input.pointLimit >= 0);
  const known = new Set(input.nodeIds), variable = new Set(input.variableNodeIds), incumbent = new Set(input.incumbentNodeIds);
  valid(known.size === input.nodeIds.length && variable.size === n && incumbent.size === input.incumbentNodeIds.length);
  valid([...known].every((id) => typeof id === "string" && id.length > 0));
  valid([...variable, ...incumbent, input.rootNodeId, ...input.protectedNodeIds].every((id) => known.has(id)));
  valid([input.rootNodeId, ...input.protectedNodeIds].every((id) => incumbent.has(id) && !variable.has(id)));
  valid(incumbent.size - 1 <= input.pointLimit);
  valid(input.variableNodeIds.every((id) => Number.isSafeInteger(input.rewardUnits[id]))
    && input.variableNodeIds.reduce((sum, id) => sum + Math.abs(input.rewardUnits[id]), 0) <= Number.MAX_SAFE_INTEGER);
  const fixed = input.incumbentNodeIds.filter((id) => !variable.has(id)), domain = new Set([...fixed, ...variable]);
  const adjacency = new Map([...domain].map((id) => [id, new Set<string>()]));
  for (const [a, b] of input.edges) {
    valid(known.has(a) && known.has(b));
    if (domain.has(a) && domain.has(b)) { adjacency.get(a)!.add(b); adjacency.get(b)!.add(a); }
  }
  valid(input.committedEdges.every(([a, b]) => fixed.includes(a) && fixed.includes(b) && adjacency.get(a)!.has(b)));
  const connected = (selected: Set<string>) => {
    const reached = new Set([input.rootNodeId]), queue = [input.rootNodeId];
    for (let i = 0; i < queue.length; i += 1) for (const next of adjacency.get(queue[i])!) {
      if (selected.has(next) && !reached.has(next)) { reached.add(next); queue.push(next); }
    }
    return reached.size === selected.size;
  };
  valid(connected(incumbent));
  let bestVariableNodeIds = input.variableNodeIds.filter((id) => incumbent.has(id));
  let bestScore = bestVariableNodeIds.reduce((sum, id) => sum + input.rewardUnits[id], 0), bestPoints = bestVariableNodeIds.length;
  let bestOrdinal = input.variableNodeIds.reduce((sum, id, i) => sum + (incumbent.has(id) ? 2 ** i : 0), 0);
  let enumerated = 0, feasibleSubsets = 0;
  const stateCount = 2 ** n;
  const result = (status: "optimal" | "cancelled" | "limited") => ({ status, scoreUnits: bestScore, variablePoints: bestPoints,
    bestVariableNodeIds, totalPoints: fixed.length - 1 + bestPoints, enumerated, stateCount, feasibleSubsets, retainedSubsetSlots: 0 });
  for (let ordinal = 0; ordinal < stateCount; ordinal += 1) {
    if (enumerated >= maxStates) return result("limited");
    if (ordinal % 4096 === 0 && options.shouldStop?.()) return result("cancelled");
    enumerated += 1;
    const chosen = input.variableNodeIds.filter((_, i) => Math.floor(ordinal / 2 ** i) % 2 === 1);
    if (fixed.length - 1 + chosen.length > input.pointLimit) continue;
    if (!connected(new Set([...fixed, ...chosen]))) continue;
    feasibleSubsets += 1;
    const score = chosen.reduce((sum, id) => sum + input.rewardUnits[id], 0);
    if (score > bestScore || score === bestScore && (chosen.length < bestPoints || chosen.length === bestPoints && ordinal < bestOrdinal)) {
      bestScore = score; bestPoints = chosen.length; bestOrdinal = ordinal; bestVariableNodeIds = chosen;
    }
  }
  return result("optimal");
}

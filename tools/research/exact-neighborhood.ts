// Standalone unit-node-cost oracle: no production graph, routing or scoring imports.
export type NeighborhoodInput = {
  nodeIds: string[]; edges: [string, string][]; rootNodeId: string;
  incumbentNodeIds: string[]; variableNodeIds: string[]; protectedNodeIds: string[];
  committedEdges: [string, string][]; pointLimit: number; rewardUnits: Record<string, number>;
};
export type CompiledNeighborhood = {
  variableNodeIds: string[]; fixedNodeIds: string[]; fixedComponents: string[][];
  adjacencyMasks: number[]; rootIndex: number; maxVariablePoints: number; incumbentMask: number;
  rewards: number[]; fixedPaidPoints: number;
};
const requireCondition = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };
const unique = (ids: string[]) => new Set(ids).size === ids.length && ids.every((id) => typeof id === "string" && id.length > 0);

export function compileNeighborhood(input: NeighborhoodInput): CompiledNeighborhood {
  requireCondition(unique(input.nodeIds) && unique(input.incumbentNodeIds) && unique(input.variableNodeIds) && unique(input.protectedNodeIds), "Duplicate/invalid node identifiers");
  requireCondition(input.variableNodeIds.length > 0 && input.variableNodeIds.length <= 20, "Exact domain requires 1..20 variable nodes");
  requireCondition(Number.isSafeInteger(input.pointLimit) && input.pointLimit >= 0, "Invalid point allowance");
  const known = new Set(input.nodeIds), incumbent = new Set(input.incumbentNodeIds), variables = new Set(input.variableNodeIds);
  const protectedIds = new Set([...input.protectedNodeIds, input.rootNodeId]);
  requireCondition([...incumbent, ...variables, ...protectedIds].every((id) => known.has(id)), "Unknown node");
  requireCondition([...protectedIds].every((id) => incumbent.has(id) && !variables.has(id)), "Root/protected nodes must stay fixed");
  requireCondition(incumbent.size - 1 <= input.pointLimit, "Incumbent exceeds point allowance");
  const rewards = input.variableNodeIds.map((id) => input.rewardUnits[id]);
  requireCondition(rewards.every(Number.isSafeInteger) && rewards.reduce((sum, n) => sum + Math.abs(n), 0) <= Number.MAX_SAFE_INTEGER, "Rewards must be reviewed safe integer units");
  const adjacency = new Map(input.nodeIds.map((id) => [id, new Set<string>()]));
  for (const [a, b] of input.edges) {
    requireCondition(known.has(a) && known.has(b), "Invalid raw edge");
    if (a === b) continue;
    adjacency.get(a)!.add(b); adjacency.get(b)!.add(a);
  }
  const fixedNodeIds = input.incumbentNodeIds.filter((id) => !variables.has(id)), fixed = new Set(fixedNodeIds);
  for (const [a, b] of input.committedEdges) requireCondition(fixed.has(a) && fixed.has(b) && adjacency.get(a)!.has(b), "Committed edge must remain inside the fixed allocation");
  const seen = new Set<string>(), fixedComponents: string[][] = [];
  for (const root of fixedNodeIds) {
    if (seen.has(root)) continue;
    const group = [root]; seen.add(root);
    for (let i = 0; i < group.length; i += 1) for (const next of adjacency.get(group[i])!) if (fixed.has(next) && !seen.has(next)) { seen.add(next); group.push(next); }
    fixedComponents.push(group);
  }
  const n = input.variableNodeIds.length;
  requireCondition(n + fixedComponents.length <= 30, "Contracted graph exceeds the exact bitset bound");
  const index = new Map(input.variableNodeIds.map((id, i) => [id, i]));
  fixedComponents.forEach((group, i) => group.forEach((id) => index.set(id, n + i)));
  const adjacencyMasks = Array<number>(n + fixedComponents.length).fill(0);
  for (const [a, b] of input.edges) {
    const x = index.get(a), y = index.get(b);
    if (x !== undefined && y !== undefined && x !== y) { adjacencyMasks[x] |= 1 << y; adjacencyMasks[y] |= 1 << x; }
  }
  let incumbentMask = 0;
  input.variableNodeIds.forEach((id, i) => { if (incumbent.has(id)) incumbentMask |= 1 << i; });
  const compiled = { variableNodeIds: [...input.variableNodeIds], fixedNodeIds, fixedComponents, adjacencyMasks, rootIndex: index.get(input.rootNodeId)!,
    maxVariablePoints: Math.min(n, input.pointLimit - (fixedNodeIds.length - 1)), incumbentMask, rewards, fixedPaidPoints: fixedNodeIds.length - 1 };
  requireCondition(isConnected(compiled, incumbentMask), "Incumbent is disconnected in the raw graph");
  return compiled;
}

function isConnected(graph: CompiledNeighborhood, mask: number): boolean {
  const n = graph.variableNodeIds.length;
  const fixedMask = ((1 << graph.fixedComponents.length) - 1) << n, allowed = fixedMask | mask;
  let seen = 1 << graph.rootIndex, frontier = seen;
  while (frontier) {
    const bit = frontier & -frontier; frontier ^= bit;
    const next = graph.adjacencyMasks[31 - Math.clz32(bit)] & allowed & ~seen;
    seen |= next; frontier |= next;
  }
  return seen === allowed;
}

export function enumerateNeighborhood(input: NeighborhoodInput, shouldStop: () => boolean = () => false) {
  const graph = compileNeighborhood(input), n = graph.variableNodeIds.length, states = 2 ** n;
  const counts = new Uint8Array(states), scores = new Float64Array(states);
  let bestMask = graph.incumbentMask, bestPoints = 0, bestScore = 0;
  graph.rewards.forEach((reward, i) => { if (bestMask & (1 << i)) { bestPoints += 1; bestScore += reward; } });
  const incumbentScoreUnits = bestScore, incumbentVariablePoints = bestPoints;
  let enumerated = 0, budgetPruned = 0, objectivePruned = 0, connectivityChecks = 0, improvements = 0;
  const result = (status: "optimal" | "cancelled") => ({ status, bestVariableNodeIds: graph.variableNodeIds.filter((_, i) => bestMask & (1 << i)),
    scoreUnits: bestScore, variablePoints: bestPoints, totalPoints: graph.fixedPaidPoints + bestPoints, incumbentScoreUnits, incumbentVariablePoints,
    enumerated, stateCount: states, budgetPruned, objectivePruned, connectivityChecks, improvements, fixedComponents: graph.fixedComponents });
  for (let mask = 0; mask < states; mask += 1) {
    if ((mask & 4095) === 0 && shouldStop()) return result("cancelled");
    if (mask) { const bit = mask & -mask, rest = mask ^ bit; counts[mask] = counts[rest] + 1; scores[mask] = scores[rest] + graph.rewards[31 - Math.clz32(bit)]; }
    enumerated += 1;
    if (counts[mask] > graph.maxVariablePoints) { budgetPruned += 1; continue; }
    if (scores[mask] < bestScore || scores[mask] === bestScore && (counts[mask] > bestPoints || counts[mask] === bestPoints && mask >= bestMask)) { objectivePruned += 1; continue; }
    connectivityChecks += 1;
    if (!isConnected(graph, mask)) continue;
    bestMask = mask; bestScore = scores[mask]; bestPoints = counts[mask]; improvements += 1;
  }
  return result("optimal");
}

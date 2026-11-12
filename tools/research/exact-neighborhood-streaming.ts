import type { NeighborhoodInput } from "./exact-neighborhood";

// Offline-only Gray-code enumeration. All graph/search buffers are linear in the
// explicit graph; no array is indexed by the exponentially many subset states.
export const streamingLimits = { variables: 28, nodes: 100_000, edges: 500_000, defaultStates: 2 ** 24 } as const;
export type StreamingOptions = { shouldStop?: () => boolean; maxStates?: number };
const requireCondition = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };
const unique = (ids: string[]) => new Set(ids).size === ids.length && ids.every((id) => typeof id === "string" && id.length > 0);

export function compileStreamingNeighborhood(input: NeighborhoodInput) {
  requireCondition(input.nodeIds.length <= streamingLimits.nodes && input.edges.length <= streamingLimits.edges, "Graph exceeds offline resource bounds");
  requireCondition(input.variableNodeIds.length > 0 && input.variableNodeIds.length <= streamingLimits.variables, "Streaming domain requires 1..28 variables");
  requireCondition(unique(input.nodeIds) && unique(input.incumbentNodeIds) && unique(input.variableNodeIds) && unique(input.protectedNodeIds), "Duplicate/invalid node identifiers");
  requireCondition(Number.isSafeInteger(input.pointLimit) && input.pointLimit >= 0, "Invalid point allowance");
  const known = new Set(input.nodeIds), incumbent = new Set(input.incumbentNodeIds), variables = new Set(input.variableNodeIds);
  const protectedIds = new Set([input.rootNodeId, ...input.protectedNodeIds]);
  requireCondition([...incumbent, ...variables, ...protectedIds].every((id) => known.has(id)), "Unknown node");
  requireCondition([...protectedIds].every((id) => incumbent.has(id) && !variables.has(id)), "Root/protected nodes must stay fixed");
  requireCondition(incumbent.size - 1 <= input.pointLimit, "Incumbent exceeds point allowance");
  const rewards = Float64Array.from(input.variableNodeIds.map((id) => input.rewardUnits[id]));
  requireCondition(rewards.every(Number.isSafeInteger) && rewards.reduce((sum, value) => sum + Math.abs(value), 0) <= Number.MAX_SAFE_INTEGER, "Rewards must be reviewed safe integer units");
  const fixedNodeIds = input.incumbentNodeIds.filter((id) => !variables.has(id));
  const ids = [...input.variableNodeIds, ...fixedNodeIds], index = new Map(ids.map((id, i) => [id, i]));
  const adjacency = ids.map(() => new Set<number>());
  for (const [a, b] of input.edges) {
    requireCondition(known.has(a) && known.has(b), "Invalid raw edge");
    const x = index.get(a), y = index.get(b);
    if (x !== undefined && y !== undefined && x !== y) { adjacency[x].add(y); adjacency[y].add(x); }
  }
  for (const [a, b] of input.committedEdges) {
    const x = index.get(a), y = index.get(b);
    requireCondition(x !== undefined && y !== undefined && x >= variables.size && y >= variables.size && adjacency[x].has(y), "Committed edge must stay fixed and real");
  }
  const offsets = new Uint32Array(ids.length + 1);
  adjacency.forEach((next, i) => { offsets[i + 1] = offsets[i] + next.size; });
  const neighbors = new Uint32Array(offsets[ids.length]);
  adjacency.forEach((next, i) => { neighbors.set([...next], offsets[i]); });
  const selected = new Uint8Array(variables.size);
  let incumbentMask = 0;
  input.variableNodeIds.forEach((id, i) => { if (incumbent.has(id)) { incumbentMask |= 2 ** i; selected[i] = 1; } });
  const compiled = { variableNodeIds: [...input.variableNodeIds], fixedNodeIds, offsets, neighbors, rewards, rootIndex: index.get(input.rootNodeId)!,
    incumbentMask, fixedPaidPoints: fixedNodeIds.length - 1, maxVariablePoints: Math.min(variables.size, input.pointLimit - fixedNodeIds.length + 1) };
  const connected = connectivityWalker(compiled);
  requireCondition(connected.test(selected, incumbent.size), "Incumbent is disconnected in the raw graph");
  return compiled;
}

function connectivityWalker(graph: ReturnType<typeof compileStreamingNeighborhood>) {
  const size = graph.offsets.length - 1, seen = new Uint32Array(size), queue = new Uint32Array(size);
  let stamp = 0;
  return { bytes: seen.byteLength + queue.byteLength, test(selected: Uint8Array, selectedCount: number) {
    stamp += 1;
    if (stamp === 2 ** 32) { seen.fill(0); stamp = 1; }
    let length = 1; queue[0] = graph.rootIndex; seen[graph.rootIndex] = stamp;
    for (let head = 0; head < length; head += 1) {
      const at = queue[head];
      for (let edge = graph.offsets[at]; edge < graph.offsets[at + 1]; edge += 1) {
        const next = graph.neighbors[edge];
        if (seen[next] === stamp || next < selected.length && !selected[next]) continue;
        seen[next] = stamp; queue[length++] = next;
      }
    }
    return length === selectedCount;
  } };
}

export function enumerateStreamingNeighborhood(input: NeighborhoodInput, options: StreamingOptions = {}) {
  const maxStates = options.maxStates ?? streamingLimits.defaultStates;
  requireCondition(Number.isSafeInteger(maxStates) && maxStates > 0, "Invalid state limit");
  const graph = compileStreamingNeighborhood(input), n = graph.variableNodeIds.length, stateCount = 2 ** n;
  const selected = new Uint8Array(n), connected = connectivityWalker(graph);
  let bestMask = graph.incumbentMask, bestPoints = 0, bestScore = 0;
  graph.rewards.forEach((reward, i) => { if (bestMask & 2 ** i) { bestPoints += 1; bestScore += reward; } });
  const incumbentScoreUnits = bestScore, incumbentVariablePoints = bestPoints;
  let enumerated = 0, budgetPruned = 0, objectivePruned = 0, connectivityChecks = 0, improvements = 0, mask = 0, points = 0, score = 0;
  const result = (status: "optimal" | "cancelled" | "limited") => ({ status, bestVariableNodeIds: graph.variableNodeIds.filter((_, i) => bestMask & 2 ** i),
    scoreUnits: bestScore, variablePoints: bestPoints, totalPoints: graph.fixedPaidPoints + bestPoints, incumbentScoreUnits, incumbentVariablePoints,
    enumerated, stateCount, budgetPruned, objectivePruned, connectivityChecks, improvements, domainNodeCount: graph.offsets.length - 1,
    retainedSubsetSlots: 0, typedArrayBytes: graph.offsets.byteLength + graph.neighbors.byteLength + graph.rewards.byteLength + selected.byteLength + connected.bytes });
  for (let step = 0; step < stateCount; step += 1) {
    if (enumerated >= maxStates) return result("limited");
    if ((step & 4095) === 0 && options.shouldStop?.()) return result("cancelled");
    if (step) {
      const bit = step & -step, i = 31 - Math.clz32(bit);
      selected[i] ^= 1; const sign = selected[i] ? 1 : -1;
      mask ^= bit; points += sign; score += sign * graph.rewards[i];
    }
    enumerated += 1;
    if (points > graph.maxVariablePoints) { budgetPruned += 1; continue; }
    if (score < bestScore || score === bestScore && (points > bestPoints || points === bestPoints && mask >= bestMask)) { objectivePruned += 1; continue; }
    connectivityChecks += 1;
    if (!connected.test(selected, graph.fixedNodeIds.length + points)) continue;
    bestMask = mask; bestScore = score; bestPoints = points; improvements += 1;
  }
  return result("optimal");
}

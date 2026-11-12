type Solution = { nodeIndexes: Set<number>; edgeKeys: Set<string> };

export function optionalBranchExchangeSeeds(
  solution: Solution, required: Set<number>, nodeIndexById: Map<string, number>, scores: number[],
  root: number, limit: number, shouldStop: () => boolean,
): Solution[] {
  if (limit <= 0 || shouldStop() || !solution.nodeIndexes.has(root)) return [];
  const neighbors = new Map([...solution.nodeIndexes].map((index) => [index, [] as number[]]));
  const edges: { key: string; a: number; b: number }[] = [];
  for (const key of solution.edgeKeys) {
    const [from, to] = key.split("::");
    const a = nodeIndexById.get(from), b = nodeIndexById.get(to);
    if (a === undefined || b === undefined || !neighbors.has(a) || !neighbors.has(b)) return [];
    neighbors.get(a)!.push(b); neighbors.get(b)!.push(a); edges.push({ key, a, b });
  }
  for (const adjacent of neighbors.values()) adjacent.sort((a, b) => a - b);
  const order = [root], parent = new Map<number, number>(), seen = new Set(order);
  const children = new Map([...solution.nodeIndexes].map((index) => [index, [] as number[]]));
  for (let i = 0; i < order.length; i += 1) {
    if (shouldStop()) return [];
    for (const next of neighbors.get(order[i]) ?? []) if (!seen.has(next)) {
      seen.add(next); parent.set(next, order[i]); children.get(order[i])!.push(next); order.push(next);
    }
  }
  if (seen.size !== solution.nodeIndexes.size || [...required].some((index) => !seen.has(index))) return [];
  const counts = new Map(order.map((index) => [index, { fixed: Number(required.has(index)), cost: 1, score: scores[index] }]));
  for (const index of [...order].reverse()) {
    const owner = parent.get(index);
    if (owner === undefined) continue;
    const total = counts.get(owner)!, own = counts.get(index)!;
    total.fixed += own.fixed; total.cost += own.cost; total.score += own.score;
  }
  const branches = order.filter((index) => index !== root && counts.get(index)!.fixed === 0);
  const byValue = [...branches].sort((a, b) => {
    const left = counts.get(a)!, right = counts.get(b)!;
    return left.score / left.cost - right.score / right.cost || right.cost - left.cost || a - b;
  });
  const byLoss = [...branches].sort((a, b) => counts.get(a)!.score - counts.get(b)!.score || counts.get(b)!.cost - counts.get(a)!.cost || a - b);
  const ranked = new Set<number>();
  for (let i = 0; i < branches.length && ranked.size < limit; i += 1) {
    ranked.add(byValue[i]);
    if (ranked.size < limit) ranked.add(byLoss[i]);
  }
  const seeds: Solution[] = [];
  for (const branch of ranked) {
    if (shouldStop()) break;
    const removed = new Set<number>(), queue = [branch];
    for (let i = 0; i < queue.length; i += 1) { removed.add(queue[i]); queue.push(...children.get(queue[i])!); }
    // Removing a complete optional subtree leaves its spanning-tree remainder connected,
    // even when extra candidate edges cross the subtree or form cycles.
    seeds.push({ nodeIndexes: new Set([...solution.nodeIndexes].filter((index) => !removed.has(index))),
      edgeKeys: new Set(edges.filter(({ a, b }) => !removed.has(a) && !removed.has(b)).map(({ key }) => key)) });
  }
  return seeds;
}

export function optionalPairedBranchExchangeSeeds(
  solution: Solution, required: Set<number>, nodeIndexById: Map<string, number>, scores: number[],
  root: number, limit: number, shouldStop: () => boolean,
): Solution[] {
  if (!Number.isFinite(limit) || limit <= 0 || shouldStop()) return [];
  // Reuse the same spanning-tree safety proof and ranking as single exchanges.
  // Six roots bound the pair search to 15 combinations, irrespective of tree size.
  const singles = optionalBranchExchangeSeeds(solution, required, nodeIndexById, scores, root, 6, shouldStop);
  const removed = singles.map((seed) => new Set([...solution.nodeIndexes].filter((index) => !seed.nodeIndexes.has(index))));
  const ranked: { seed: Solution; loss: number; cost: number; key: string }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < singles.length; i += 1) for (let j = i + 1; j < singles.length; j += 1) {
    if (shouldStop()) return [];
    // Ancestor/descendant pairs are redundant and would double-count removed cost.
    if ([...removed[i]].some((index) => removed[j].has(index))) continue;
    const union = new Set([...removed[i], ...removed[j]]);
    const key = [...union].sort((a, b) => a - b).join("|");
    if (!union.size || seen.has(key)) continue;
    const loss = [...union].reduce((sum, index) => sum + scores[index], 0);
    if (!Number.isFinite(loss)) continue;
    seen.add(key);
    ranked.push({ loss, cost: union.size, key, seed: {
      nodeIndexes: new Set([...singles[i].nodeIndexes].filter((index) => singles[j].nodeIndexes.has(index))),
      edgeKeys: new Set([...singles[i].edgeKeys].filter((edge) => singles[j].edgeKeys.has(edge))),
    } });
  }
  ranked.sort((a, b) => a.loss / a.cost - b.loss / b.cost || a.loss - b.loss || b.cost - a.cost || a.key.localeCompare(b.key));
  return shouldStop() ? [] : ranked.slice(0, Math.min(2, Math.floor(limit))).map((entry) => entry.seed);
}

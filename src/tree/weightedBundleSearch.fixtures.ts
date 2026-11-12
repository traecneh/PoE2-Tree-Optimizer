import type { BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { validationGraph } from "./buildGoalsValidation.fixtures";

export function weightedBundleFixture() {
  const edges: [string, string][] = [["start", "goal"], ["start", "t1"], ["t1", "t2"], ["t2", "t3"]];
  const rewards: Record<string, number> = {};
  for (let i = 0; i < 4; i += 1) { edges.push(["start", `bait-travel${i}`], [`bait-travel${i}`, `bait${i}`]); rewards[`bait${i}`] = 3; }
  for (let i = 0; i < 5; i += 1) { edges.push(["t3", `cluster${i}`]); rewards[`cluster${i}`] = 4; }
  const graph = validationGraph(edges);
  for (const [id, score] of Object.entries(rewards)) graph.nodes[id].stats = [`+${score * 5} to Strength`];
  const request: BuildGoalsOptimizeRequest = {
    graph, mode: "weighted", rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"],
    preferences: [{ id: "attributes", weight: 1 }], extraPointBudget: 8,
  };
  return { request, rewards };
}

// Raw-edge connectivity and declared reward values: no production scoring/search helpers.
export function exhaustiveWeightedReward(request: BuildGoalsOptimizeRequest, rewards: Record<string, number>, maxNewPoints: number) {
  const fixed = new Set([...request.baseNodeIds, ...request.goalNodeIds]);
  const base = new Set(request.baseNodeIds);
  const optional = Object.keys(request.graph.nodes).filter((id) => !fixed.has(id) && !request.excludedNodeIds?.includes(id));
  if (optional.length > 16) throw new Error("The independent weighted oracle is restricted to tiny graphs.");
  let score = -Infinity, pointCost = Infinity;
  for (let mask = 0; mask < 2 ** optional.length; mask += 1) {
    const kept = new Set(fixed);
    optional.forEach((id, i) => { if (mask & (1 << i)) kept.add(id); });
    const cost = kept.size - base.size;
    if (cost > maxNewPoints) continue;
    const seen = new Set([request.rootNodeId ?? request.baseNodeIds[0]]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const { from, to } of request.graph.edges) {
        if (!kept.has(from) || !kept.has(to)) continue;
        if (seen.has(from) && !seen.has(to)) { seen.add(to); changed = true; }
        if (seen.has(to) && !seen.has(from)) { seen.add(from); changed = true; }
      }
    }
    if (seen.size !== kept.size) continue;
    const value = [...kept].reduce((sum, id) => sum + (base.has(id) ? 0 : rewards[id] ?? 0), 0);
    if (value > score || value === score && cost < pointCost) { score = value; pointCost = cost; }
  }
  return { score, pointCost };
}

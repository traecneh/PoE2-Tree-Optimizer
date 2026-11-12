import type { BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { validationGraph } from "./buildGoalsValidation.fixtures";

export function weightedBranchExchangeFixture() {
  const pairs: [string, string][] = [["start", "goal"]], rewards: Record<string, number> = {};
  const arms = [[0, 3, [15]], [1, 0, [6]], [2, 2, [13]], [4, 1, [12]], [5, 0, [4, 10, 8, 15]], [6, 1, [3, 7, 11, 2]]] as const;
  // Preserve literal graph order/values from the independently checked regression.
  for (const [arm, travel, values] of arms) {
    let parent = "start";
    for (let i = 0; i < travel; i += 1) { const id = `a${arm}t${i}`; pairs.push([parent, id]); parent = id; }
    const indexes = arm === 0 ? [2] : arm === 1 || arm === 2 ? [3] : arm === 4 ? [1] : values.map((_, i) => i);
    values.forEach((value, i) => { const id = `a${arm}r${indexes[i]}`; pairs.push([parent, id]); rewards[id] = value; });
  }
  const graph = validationGraph(pairs);
  for (const [id, score] of Object.entries(rewards)) graph.nodes[id].stats = [`+${score * 5} to Strength`];
  const request: BuildGoalsOptimizeRequest = { graph, mode: "weighted", rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"],
    preferences: [{ id: "attributes", weight: 1 }], pointBudgetMode: "all-available", totalPointLimit: 9, extraPointBudget: 8 };
  return { request, rewards };
}

// Test-only exact oracle for trees: enumerate reward subsets and their unique ancestor
// closure. Zero-reward travel beyond that closure cannot improve score or point cost.
export function exhaustiveTreeReward(request: BuildGoalsOptimizeRequest, rewards: Record<string, number>, budget: number) {
  const root = request.rootNodeId ?? request.baseNodeIds[0], parent = new Map<string, string | undefined>([[root, undefined]]), order = [root];
  for (let i = 0; i < order.length; i += 1) for (const edge of request.graph.edges) {
    const next = edge.from === order[i] ? edge.to : edge.to === order[i] ? edge.from : undefined;
    if (next !== undefined && !parent.has(next)) { parent.set(next, order[i]); order.push(next); }
  }
  if (order.length !== Object.keys(request.graph.nodes).length || request.graph.edges.length !== order.length - 1) throw new Error("Oracle requires a connected tree.");
  const base = new Set(request.baseNodeIds), fixed = [...base, ...request.goalNodeIds];
  const choices = order.filter((id) => !fixed.includes(id) && (rewards[id] ?? 0) !== 0);
  if (choices.length > 16) throw new Error("Oracle requires at most 16 optional reward nodes.");
  let score = -Infinity, pointCost = Infinity;
  for (let mask = 0; mask < 2 ** choices.length; mask += 1) {
    const kept = new Set<string>();
    const add = (id: string) => { let next: string | undefined = id; while (next !== undefined && !kept.has(next)) { kept.add(next); next = parent.get(next); } };
    fixed.forEach(add); choices.forEach((id, i) => { if (mask & (1 << i)) add(id); });
    const cost = kept.size - base.size;
    if (cost > budget || request.excludedNodeIds?.some((id) => kept.has(id))) continue;
    const value = [...kept].reduce((sum, id) => sum + (base.has(id) ? 0 : rewards[id] ?? 0), 0);
    if (value > score || value === score && cost < pointCost) { score = value; pointCost = cost; }
  }
  return { score, pointCost };
}

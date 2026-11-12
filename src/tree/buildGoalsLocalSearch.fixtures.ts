import type { BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { validationGraph } from "./buildGoalsValidation.fixtures";

export function sharedJunctionFixture(): BuildGoalsOptimizeRequest {
  const edges: [string, string][] = [["start", "trunk"], ["trunk", "hub"]];
  const goals: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    const goal = `g${i}`;
    goals.push(goal);
    edges.push(["start", `d${i}a`], [`d${i}a`, `d${i}b`], [`d${i}b`, goal], ["hub", `link${i}`], [`link${i}`, goal]);
  }
  for (let i = 0; i < 8; i += 1) { goals.push(`padding${i}`); edges.push(["start", `padding${i}`]); }
  return { graph: validationGraph(edges), rootNodeId: "start", mode: "shortest", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: goals };
}

export function connectedBranchFixture(): BuildGoalsOptimizeRequest {
  const edges: [string, string][] = [["start", "a1"], ["a1", "a2"], ["a2", "a3"], ["a3", "a4"], ["a4", "a5"], ["a5", "a-goal"],
    ["start", "b1"], ["b1", "b2"], ["b2", "b-goal"], ["a2", "cross"], ["cross", "b-goal"]];
  const goals = ["a-goal", "b-goal"];
  for (let i = 0; i < 9; i += 1) { goals.push(`padding${i}`); edges.push(["start", `padding${i}`]); }
  return { graph: validationGraph(edges), rootNodeId: "start", mode: "shortest", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: goals };
}

// Independent subset oracle, with all required nodes fixed to keep enumeration tiny.
export function exhaustiveRequiredCost(request: BuildGoalsOptimizeRequest): number {
  const fixed = new Set([...request.baseNodeIds, ...request.goalNodeIds]);
  const optional = Object.keys(request.graph.nodes).filter((id) => !fixed.has(id) && !request.excludedNodeIds?.includes(id));
  if (optional.length > 16) throw new Error("This oracle is restricted to tiny regression graphs.");
  let best = Infinity;
  for (let mask = 0; mask < 2 ** optional.length; mask += 1) {
    const nodes = new Set(fixed);
    optional.forEach((id, i) => { if (mask & (1 << i)) nodes.add(id); });
    const cost = nodes.size - new Set(request.baseNodeIds).size;
    if (cost >= best) continue;
    const seen = new Set([request.rootNodeId ?? request.baseNodeIds[0]]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const { from, to } of request.graph.edges) {
        if (!nodes.has(from) || !nodes.has(to)) continue;
        if (seen.has(from) && !seen.has(to)) { seen.add(to); changed = true; }
        if (seen.has(to) && !seen.has(from)) { seen.add(from); changed = true; }
      }
    }
    if (seen.size === nodes.size) best = cost;
  }
  return best;
}

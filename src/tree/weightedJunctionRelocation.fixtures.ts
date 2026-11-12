import type { BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { validationGraph } from "./buildGoalsValidation.fixtures";

export function weightedJunctionFixture(extraHop = false) {
  const edges: [string, string][] = [
    ["start", "a"], ["a", "old"], ["old", "b"], ["b", "goal1"], ["old", "c"], ["c", "goal2"], ["old", "d"], ["d", "goal3"],
    ["start", "x"], ...(extraHop ? [["x", "gateway"], ["gateway", "new"]] : [["x", "new"]]) as [string, string][],
    ["new", "y"], ["y", "goal1"], ["new", "z"], ["z", "goal2"], ["new", "w"], ["w", "goal3"],
  ];
  const rewards: Record<string, number> = { new: 6, ...(extraHop ? { x: -1 } : {}) };
  const graph = validationGraph(edges);
  for (const [id, value] of Object.entries(rewards)) graph.nodes[id].stats = [`${value >= 0 ? "+" : ""}${value * 5} to Strength`];
  const request: BuildGoalsOptimizeRequest = {
    graph, mode: "weighted", rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal1", "goal2", "goal3"],
    preferences: [{ id: "attributes", weight: 1 }], pointBudgetMode: "all-available", totalPointLimit: extraHop ? 9 : 8, extraPointBudget: extraHop ? 1 : 0,
  };
  return { request, rewards, incumbentNodeIds: ["start", "a", "old", "b", "goal1", "c", "goal2", "d", "goal3"] };
}

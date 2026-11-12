import type { BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { validationGraph } from "./buildGoalsValidation.fixtures";

export function weightedCorridorFixture(extraHop = false) {
  const edges: [string, string][] = [
    ["start", "a"], ["a", "b"], ["b", "junction"], ["junction", "goal1"], ["junction", "goal2"],
    ["start", "x"], ["x", "y"], ...(extraHop ? [["y", "z"], ["z", "junction"]] as [string, string][] : [["y", "junction"]] as [string, string][]),
  ];
  const rewards: Record<string, number> = { x: 3, y: 3, ...(extraHop ? { z: -1 } : {}) };
  const graph = validationGraph(edges);
  for (const [id, value] of Object.entries(rewards)) graph.nodes[id].stats = [`${value >= 0 ? "+" : ""}${value * 5} to Strength`];
  const request: BuildGoalsOptimizeRequest = {
    graph, mode: "weighted", rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal1", "goal2"],
    preferences: [{ id: "attributes", weight: 1 }], pointBudgetMode: "all-available", totalPointLimit: extraHop ? 6 : 5, extraPointBudget: extraHop ? 1 : 0,
  };
  return { request, rewards, incumbentNodeIds: ["start", "a", "b", "junction", "goal1", "goal2"] };
}

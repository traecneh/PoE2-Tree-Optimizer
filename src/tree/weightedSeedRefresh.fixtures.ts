import type { BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { validationGraph } from "./buildGoalsValidation.fixtures";

export function lateWeightedImprovementFixture() {
  const pairs: [string, string][] = [
    ["start", "goal"], ["goal", "n0"], ["n0", "n1"], ["goal", "n2"],
    ["n1", "n3"], ["goal", "n4"], ["n2", "n5"], ["n0", "n6"],
    ["n2", "n7"], ["goal", "n8"], ["n7", "n9"], ["n9", "n10"],
    ["n8", "n11"], ["n6", "n12"], ["n4", "n13"], ["n5", "n14"],
    ["n1", "n15"], ["n6", "n16"], ["n6", "n17"], ["n6", "n18"],
    ["n7", "n19"], ["n19", "n20"], ["n1", "n21"], ["n2", "n22"],
    ["n1", "n23"], ["start", "n24"], ["n15", "n25"], ["n25", "n26"],
  ];
  // Literal signed rewards; the separate tree-subset oracle does not parse stats
  // or use the production optimizer to determine the 86-at-11 optimum.
  const rewards: Record<string, number> = {
    n0: -1, n1: 4, n4: 8, n6: -3, n7: 16, n8: 18, n11: 1, n12: -2,
    n13: 19, n14: 9, n15: 3, n17: 14, n18: 1, n19: 6, n20: -1, n21: 11,
  };
  const graph = validationGraph(pairs);
  for (const [id, value] of Object.entries(rewards)) graph.nodes[id].stats = [`${value >= 0 ? "+" : ""}${value * 5} to Strength`];
  const request: BuildGoalsOptimizeRequest = {
    graph, mode: "weighted", rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"],
    preferences: [{ id: "attributes", weight: 1 }], pointBudgetMode: "all-available", totalPointLimit: 11, extraPointBudget: 10,
  };
  return { request, rewards };
}

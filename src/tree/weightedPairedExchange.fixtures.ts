import type { BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { validationGraph } from "./buildGoalsValidation.fixtures";

export function weightedPairedExchangeFixture() {
  const pairs: [string, string][] = [["start", "goal"]];
  const rewards: Record<string, number> = {};
  for (const name of ["a", "b", "c"]) {
    pairs.push(["start", `${name}0`], [`${name}0`, `${name}1`], [`${name}1`, `${name}2`]);
    rewards[`${name}2`] = 10;
  }
  pairs.push(["start", "t0"], ["t0", "t1"], ["t1", "t2"], ["t2", "t3"], ["t3", "r0"], ["t3", "r1"]);
  rewards.r0 = 12; rewards.r1 = 12;
  const graph = validationGraph(pairs);
  for (const [id, value] of Object.entries(rewards)) graph.nodes[id].stats = [`+${value * 5} to Strength`];
  const request: BuildGoalsOptimizeRequest = {
    graph, mode: "weighted", rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"],
    preferences: [{ id: "attributes", weight: 1 }], totalPointLimit: 7, pointBudgetMode: "all-available", extraPointBudget: 6,
  };
  return { request, rewards, incumbentNodeIds: ["start", "goal", "a0", "a1", "a2", "b0", "b1", "b2"] };
}

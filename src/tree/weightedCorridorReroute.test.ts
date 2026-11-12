import { describe, expect, it } from "vitest";
import { buildOptimizerGraph, routeCandidateFromSolution, type BuildGoalsOptimizeRequest, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";
import { weightedCorridorCandidates } from "./weightedCorridorReroute";
import { weightedCorridorFixture } from "./weightedCorridorReroute.fixtures";
import { exhaustiveWeightedReward } from "./weightedBundleSearch.fixtures";
import { independentlyValid, validationGraph } from "./buildGoalsValidation.fixtures";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import { optionalPairedBranchExchangeSeeds } from "./weightedBranchExchange";
import { treeEdgeKey } from "./pathAllocation";

function setup(request: BuildGoalsOptimizeRequest, selected: string[], rewards: Record<string, number>, additionallyBlocked: string[] = []) {
  const selectedSet = new Set(selected), indexed = buildOptimizerGraph(request.graph, request.baseNodeIds);
  const solution = { nodeIndexes: new Set(selected.map((id) => indexed.nodeIndexById.get(id)!)), edgeKeys: new Set(request.graph.edges
    .filter((e) => selectedSet.has(e.from) && selectedSet.has(e.to)).map((e) => treeEdgeKey(e.from, e.to))) };
  const required = new Set([...request.baseNodeIds, ...request.goalNodeIds, ...(request.weaponSets?.attachmentNodeIds ?? [])].map((id) => indexed.nodeIndexById.get(id)!));
  const blockedIds = new Set([...additionallyBlocked, ...(request.excludedNodeIds ?? []), ...(request.weaponSets?.allocations[1] ?? []), ...(request.weaponSets?.allocations[2] ?? [])]);
  const blocked = indexed.nodeIds.map((id) => blockedIds.has(id));
  const scores = indexed.nodeIds.map((id) => request.baseNodeIds.includes(id) ? 0 : rewards[id] ?? 0);
  const budget = (request.totalPointLimit ?? 5) - (new Set(request.baseNodeIds).size - 1);
  const candidates = (stop = () => false) => weightedCorridorCandidates(solution, indexed, required, scores, blocked, budget, request.baseEdgeKeys, stop);
  return { indexed, solution, required, scores, blocked, budget, candidates };
}

describe("preference-aware corridor rerouting", () => {
  it("replaces a zero-value required corridor with score six at the same five-point cost", () => {
    const { request, rewards, incumbentNodeIds } = weightedCorridorFixture();
    const c = setup(request, incumbentNodeIds, rewards);
    expect(optionalPairedBranchExchangeSeeds(c.solution, c.required, c.indexed.nodeIndexById, c.scores, c.indexed.nodeIndexById.get("start")!, 2, () => false)).toEqual([]);
    expect(exhaustiveWeightedReward(request, rewards, 5)).toEqual({ score: 6, pointCost: 5 });
    const results = [...c.candidates()].filter((v) => v !== undefined);
    expect(results.length).toBeGreaterThan(0);
    for (const solution of results) {
      const result = { ...routeCandidateFromSolution("corridor", solution, request.baseNodeIds, request.baseEdgeKeys, c.indexed), status: "success" as const, unreachableGoalNodeIds: [] };
      expect(result.pointCost).toBe(5);
      expect(result.totalNodeIds).toEqual(expect.arrayContaining(["x", "y", "junction", "goal1", "goal2"]));
      expect(result.totalNodeIds).not.toContain("a"); expect(result.totalNodeIds).not.toContain("b");
      expect(result.totalNodeIds.filter((id) => id === "junction")).toHaveLength(1);
      expect(result.addedNodeIds.reduce((sum, id) => sum + (rewards[id] ?? 0), 0)).toBe(6);
      expect(independentlyValid(request, result)).toBe(true);
    }
  });
  it("permits an extra point only within budget and includes the negative gateway effect", () => {
    const { request, rewards, incumbentNodeIds } = weightedCorridorFixture(true);
    expect(exhaustiveWeightedReward(request, rewards, 6)).toEqual({ score: 5, pointCost: 6 });
    const c = setup(request, incumbentNodeIds, rewards);
    const candidates = [...c.candidates()].filter((v) => v !== undefined);
    expect(candidates.some((s) => [...s.nodeIndexes].reduce((sum, i) => sum + c.scores[i], 0) === 5)).toBe(true);
    request.totalPointLimit = 5;
    expect(exhaustiveWeightedReward(request, rewards, 5)).toEqual({ score: 0, pointCost: 5 });
    expect([...setup(request, incumbentNodeIds, rewards).candidates()].filter(Boolean)).toEqual([]);
  });
  it("preserves committed nodes/edges and adjusts the budget for paid base nodes", () => {
    const { request, rewards, incumbentNodeIds } = weightedCorridorFixture();
    request.baseNodeIds.push("a"); request.baseEdgeKeys.push("a::start");
    expect([...setup(request, incumbentNodeIds, rewards).candidates()].filter(Boolean)).toEqual([]);
    request.totalPointLimit = 6;
    const c = setup(request, incumbentNodeIds, rewards), results = [...c.candidates()].filter((v) => v !== undefined);
    expect(results.length).toBeGreaterThan(0);
    for (const s of results) {
      expect(s.edgeKeys.has("a::start")).toBe(true); expect(s.nodeIndexes.has(c.indexed.nodeIndexById.get("a")!)).toBe(true);
      expect([...s.nodeIndexes].filter((i) => !c.indexed.baseNodeSet.has(c.indexed.nodeIds[i])).length).toBeLessThanOrEqual(5);
    }
  });
  it("honors blocked nodes, signed old-corridor losses, cancellation and immutable inputs", () => {
    const { request, rewards, incumbentNodeIds } = weightedCorridorFixture(); rewards.a = -3;
    const c = setup(request, incumbentNodeIds, rewards), before = { nodes: [...c.solution.nodeIndexes], edges: [...c.solution.edgeKeys], scores: [...c.scores] };
    expect([...setup(request, incumbentNodeIds, rewards, ["x"]).candidates()].filter(Boolean)).toEqual([]);
    expect([...c.candidates()].filter((v) => v !== undefined).some((s) => [...s.nodeIndexes].reduce((sum, i) => sum + c.scores[i], 0) === 6)).toBe(true);
    expect([...c.candidates(() => true)]).toEqual([]);
    let stop = false; const generator = c.candidates(() => stop);
    expect(generator.next().done).toBe(false); stop = true; expect(generator.next().done).toBe(true);
    expect({ nodes: [...c.solution.nodeIndexes], edges: [...c.solution.edgeKeys], scores: c.scores }).toEqual(before);
  });
  it("bounds routing proposals to four corridors times four strengths", () => {
    const edges: [string, string][] = [], rewards: Record<string, number> = {}, selected = ["start"], goals: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      edges.push(["start", `a${i}`], [`a${i}`, `g${i}`], ["start", `x${i}`], [`x${i}`, `g${i}`]);
      selected.push(`a${i}`, `g${i}`); goals.push(`g${i}`); rewards[`x${i}`] = 1;
    }
    const request: BuildGoalsOptimizeRequest = { graph: validationGraph(edges), mode: "weighted", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: goals, totalPointLimit: 12 };
    expect([...setup(request, selected, rewards).candidates()]).toHaveLength(16);
  });
  it("skips branch-only or redundant cycles and rejects disconnected or malformed bases", () => {
    const { request, rewards, incumbentNodeIds } = weightedCorridorFixture();
    expect([...setup(request, Object.keys(request.graph.nodes), rewards).candidates()]).toEqual([]);
    const c = setup(request, incumbentNodeIds, rewards);
    c.solution.edgeKeys.clear(); expect([...c.candidates()]).toEqual([]);
    const missingBase = setup(request, incumbentNodeIds, rewards);
    expect([...weightedCorridorCandidates(missingBase.solution, missingBase.indexed, missingBase.required, missingBase.scores, missingBase.blocked, 5, ["missing::start"], () => false)]).toEqual([]);
    expect([...weightedCorridorCandidates(missingBase.solution, missingBase.indexed, missingBase.required, missingBase.scores, missingBase.blocked, NaN, [], () => false)]).toEqual([]);
  });
  it.each(["extra", "all-available"] as const)("keeps production %s results valid with all search strategies enabled", (pointBudgetMode) => {
    const { request } = weightedCorridorFixture(true); request.pointBudgetMode = pointBudgetMode;
    const rows: BuildGoalsOptimizeResult[] = [], attempts: number[] = [];
    const result = optimizeWeightedBuildGoals(request, (r) => rows.push(r), { maxIterations: 128, onCorridorReroute: (e) => attempts.push(e.iteration) });
    expect(attempts.length).toBeGreaterThan(0);
    for (const r of [...rows, result]) { expect(independentlyValid(request, r)).toBe(true); expect(createBuildGoalsValidation(request).validateResult(r)).toEqual([]); }
    expect(result.pointCost).toBeLessThanOrEqual(6);
  });
  it.each(["excluded", "locked", "keystone"] as const)("does not create a corridor through an unallowed %s node", (kind) => {
    const { request } = weightedCorridorFixture();
    if (kind === "excluded") request.excludedNodeIds = ["x"];
    if (kind === "locked") request.graph.nodes.x.visibility = { requiredAscendancy: { id: "oracle", name: "Oracle", className: "Druid" } };
    if (kind === "keystone") request.graph.nodes.x.flags.keystone = true;
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 128 });
    expect(result.totalNodeIds).not.toContain("x"); expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
  });
  it("retains weapon attachment goals and never routes through fixed weapon passives", () => {
    const { request } = weightedCorridorFixture();
    request.graph.nodes.w1 = { ...request.graph.nodes.junction, id: "w1", stats: ["+5000 to Strength"] };
    request.graph.edges.push({ from: "junction", to: "w1" });
    request.weaponSets = { allocations: { 1: ["w1"], 2: [] }, attachmentNodeIds: ["junction"] };
    const before = JSON.stringify(request), rows: BuildGoalsOptimizeResult[] = [];
    const result = optimizeWeightedBuildGoals(request, (r) => rows.push(r), { maxIterations: 128 });
    for (const r of [...rows, result]) {
      expect(r.totalNodeIds).toContain("junction"); expect(r.totalNodeIds).not.toContain("w1"); expect(r.pointCost).toBeLessThanOrEqual(5);
      expect(createBuildGoalsValidation(request).validateResult(r)).toEqual([]);
    }
    expect(JSON.stringify(request)).toBe(before);
  });
  it.each(["cancel", "deadline"] as const)("honors %s at dispatch without losing the valid incumbent", (kind) => {
    const { request } = weightedCorridorFixture(); let stop = false, clock = 0;
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 128, now: () => clock, noImprovementMs: 50,
      shouldCancel: () => kind === "cancel" && stop, onCorridorReroute: () => { stop = true; clock = 100; } });
    expect(result).toMatchObject({ status: kind === "cancel" ? "cancelled" : "success", completeReason: kind === "cancel" ? "cancelled" : "no-improvement" });
    expect(createBuildGoalsValidation(request).validateResult({ ...result, status: "success" })).toEqual([]);
  });
  it("does not requeue an unchanged incumbent and leaves the disabled control available", () => {
    const { request } = weightedCorridorFixture();
    const collect = (maxIterations: number, enableCorridorRerouting = true) => {
      const iterations: number[] = [];
      optimizeWeightedBuildGoals(request, undefined, { maxIterations, enableCorridorRerouting, onCorridorReroute: (e) => iterations.push(e.iteration) });
      return iterations;
    };
    expect(collect(128).length).toBeGreaterThan(0); expect(collect(512)).toEqual(collect(128)); expect(collect(128, false)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { buildOptimizerGraph, routeCandidateFromSolution, type BuildGoalsOptimizeRequest, type BuildGoalsOptimizeResult } from "./buildGoalsOptimizer";
import { weightedJunctionCandidates } from "./weightedJunctionRelocation";
import { weightedJunctionFixture } from "./weightedJunctionRelocation.fixtures";
import { weightedCorridorCandidates } from "./weightedCorridorReroute";
import { optionalPairedBranchExchangeSeeds } from "./weightedBranchExchange";
import { exhaustiveWeightedReward } from "./weightedBundleSearch.fixtures";
import { independentlyValid, validationGraph } from "./buildGoalsValidation.fixtures";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import { treeEdgeKey } from "./pathAllocation";

function setup(request: BuildGoalsOptimizeRequest, selected: string[], rewards: Record<string, number>, blockedIds: string[] = []) {
  const selectedSet = new Set(selected), indexed = buildOptimizerGraph(request.graph, request.baseNodeIds);
  const solution = { nodeIndexes: new Set(selected.map((id) => indexed.nodeIndexById.get(id)!)), edgeKeys: new Set(request.graph.edges
    .filter((e) => selectedSet.has(e.from) && selectedSet.has(e.to)).map((e) => treeEdgeKey(e.from, e.to))) };
  const required = new Set([...request.baseNodeIds, ...request.goalNodeIds, ...(request.weaponSets?.attachmentNodeIds ?? [])].map((id) => indexed.nodeIndexById.get(id)!));
  const blocked = indexed.nodeIds.map((id) => blockedIds.includes(id) || Boolean(request.excludedNodeIds?.includes(id)));
  const scores = indexed.nodeIds.map((id) => request.baseNodeIds.includes(id) ? 0 : rewards[id] ?? 0);
  const budget = (request.totalPointLimit ?? 8) - (new Set(request.baseNodeIds).size - 1);
  const candidates = (stop = () => false) => weightedJunctionCandidates(solution, indexed, required, scores, blocked, budget, request.baseEdgeKeys, stop);
  return { indexed, solution, required, scores, blocked, budget, candidates };
}

describe("bounded preference-aware shared-junction relocation", () => {
  it("moves a shared junction for three goals from score zero to six at the same eight points", () => {
    const { request, rewards, incumbentNodeIds } = weightedJunctionFixture(), c = setup(request, incumbentNodeIds, rewards);
    expect(exhaustiveWeightedReward(request, rewards, 8)).toEqual({ score: 6, pointCost: 8 });
    expect(optionalPairedBranchExchangeSeeds(c.solution, c.required, c.indexed.nodeIndexById, c.scores, c.indexed.nodeIndexById.get("start")!, 2, () => false)).toEqual([]);
    expect([...weightedCorridorCandidates(c.solution, c.indexed, c.required, c.scores, c.blocked, c.budget, [], () => false)].filter(Boolean)).toEqual([]);
    const candidates = [...c.candidates()].filter((v) => v !== undefined);
    expect(candidates.length).toBeGreaterThan(0);
    for (const s of candidates) {
      const result = { ...routeCandidateFromSolution("junction", s, request.baseNodeIds, request.baseEdgeKeys, c.indexed), status: "success" as const, unreachableGoalNodeIds: [] };
      expect(result.pointCost).toBe(8); expect(result.totalNodeIds).toContain("new"); expect(result.totalNodeIds).not.toContain("old");
      expect(result.totalNodeIds.filter((id) => id === "new")).toHaveLength(1);
      expect(result.addedNodeIds.reduce((sum, id) => sum + (rewards[id] ?? 0), 0)).toBe(6);
      expect(independentlyValid(request, result)).toBe(true);
    }
  });
  it("permits a longer signed-effect replacement only when the extra point is available", () => {
    const { request, rewards, incumbentNodeIds } = weightedJunctionFixture(true);
    expect(exhaustiveWeightedReward(request, rewards, 9)).toEqual({ score: 5, pointCost: 9 });
    const c = setup(request, incumbentNodeIds, rewards);
    expect([...c.candidates()].filter((v) => v !== undefined).some((s) => [...s.nodeIndexes].reduce((sum, i) => sum + c.scores[i], 0) === 5)).toBe(true);
    request.totalPointLimit = 8;
    expect(exhaustiveWeightedReward(request, rewards, 8)).toEqual({ score: 0, pointCost: 8 });
    expect([...setup(request, incumbentNodeIds, rewards).candidates()].filter(Boolean)).toEqual([]);
  });
  it("also relocates three-way junctions and keeps cyclic retained components connected", () => {
    const { request, rewards, incumbentNodeIds } = weightedJunctionFixture();
    const omitted = new Set(["d", "w", "goal3"]);
    for (const id of omitted) delete request.graph.nodes[id];
    request.graph.edges = request.graph.edges.filter((e) => !omitted.has(e.from) && !omitted.has(e.to));
    request.goalNodeIds = ["goal1", "goal2"]; request.totalPointLimit = 6;
    const c = setup(request, incumbentNodeIds.filter((id) => !omitted.has(id)), rewards);
    expect(exhaustiveWeightedReward(request, rewards, 6)).toEqual({ score: 6, pointCost: 6 });
    expect([...c.candidates()].filter(Boolean).length).toBeGreaterThan(0);
    const cyclic = weightedJunctionFixture(); cyclic.request.graph.edges.push({ from: "a", to: "b" }); cyclic.request.totalPointLimit = 9;
    const cycle = setup(cyclic.request, cyclic.incumbentNodeIds, cyclic.rewards), candidates = [...cycle.candidates()].filter((v) => v !== undefined);
    expect(candidates.length).toBeGreaterThan(0);
    for (const s of candidates) {
      const result = { ...routeCandidateFromSolution("junction", s, cyclic.request.baseNodeIds, [], cycle.indexed), status: "success" as const, unreachableGoalNodeIds: [] };
      expect(independentlyValid(cyclic.request, result)).toBe(true);
    }
  });
  it("preserves paid base nodes and committed edges while counting their cost only once", () => {
    const { request, rewards, incumbentNodeIds } = weightedJunctionFixture();
    request.baseNodeIds.push("a"); request.baseEdgeKeys.push("a::start");
    expect([...setup(request, incumbentNodeIds, rewards).candidates()].filter(Boolean)).toEqual([]);
    request.totalPointLimit = 9;
    const c = setup(request, incumbentNodeIds, rewards), candidates = [...c.candidates()].filter((v) => v !== undefined);
    expect(candidates.length).toBeGreaterThan(0);
    for (const s of candidates) {
      expect(s.edgeKeys.has("a::start")).toBe(true);
      const result = { ...routeCandidateFromSolution("junction", s, request.baseNodeIds, request.baseEdgeKeys, c.indexed), status: "success" as const, unreachableGoalNodeIds: [] };
      expect(result.pointCost).toBeLessThanOrEqual(8); expect(independentlyValid(request, result)).toBe(true);
    }
  });
  it("does not remove a required junction or a weapon attachment", () => {
    const { request, rewards, incumbentNodeIds } = weightedJunctionFixture();
    request.weaponSets = { allocations: { 1: [], 2: [] }, attachmentNodeIds: ["old"] };
    expect([...setup(request, incumbentNodeIds, rewards).candidates()]).toEqual([]);
    request.weaponSets = undefined; request.goalNodeIds.push("old");
    expect([...setup(request, incumbentNodeIds, rewards).candidates()]).toEqual([]);
  });
  it("honors blocked nodes, signed incumbent effects, cancellation and immutable inputs", () => {
    const { request, rewards, incumbentNodeIds } = weightedJunctionFixture(); rewards.old = -2;
    const c = setup(request, incumbentNodeIds, rewards), before = { nodes: [...c.solution.nodeIndexes], edges: [...c.solution.edgeKeys], scores: [...c.scores] };
    expect([...setup(request, incumbentNodeIds, rewards, ["new"]).candidates()].filter(Boolean)).toEqual([]);
    expect([...c.candidates()].filter(Boolean).length).toBeGreaterThan(0);
    expect([...c.candidates(() => true)]).toEqual([]);
    let stop = false; const generator = c.candidates(() => stop);
    expect(generator.next()).toEqual({ value: undefined, done: false }); stop = true; expect(generator.next().done).toBe(true);
    expect({ nodes: [...c.solution.nodeIndexes], edges: [...c.solution.edgeKeys], scores: c.scores }).toEqual(before);
  });
  it("bounds work to two neighborhoods, four strengths, four component searches and three proposals", () => {
    const edges: [string, string][] = [], selected = ["start"], goals: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      edges.push(["start", `old${i}`], ["start", `new${i}`]); selected.push(`old${i}`);
      for (let g = 0; g < 3; g += 1) { const goal = `g${i}-${g}`; goals.push(goal); selected.push(goal); edges.push([`old${i}`, goal], [`new${i}`, goal]); }
    }
    const request: BuildGoalsOptimizeRequest = { graph: validationGraph(edges), mode: "weighted", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: goals, totalPointLimit: 24 };
    expect([...setup(request, selected, {}).candidates()]).toHaveLength(2 * 4 * (4 + 3));
  });
  it("rejects disconnected, malformed, non-finite and missing-base inputs", () => {
    const { request, rewards, incumbentNodeIds } = weightedJunctionFixture(), c = setup(request, incumbentNodeIds, rewards);
    const call = (budget = 8, edges: string[] = []) => [...weightedJunctionCandidates(c.solution, c.indexed, c.required, c.scores, c.blocked, budget, edges, () => false)];
    expect(call(NaN)).toEqual([]); expect(call(-1)).toEqual([]); expect(call(8, ["absent::start"])).toEqual([]);
    c.scores[c.indexed.nodeIndexById.get("old")!] = NaN; expect(call()).toEqual([]);
    c.scores.fill(0); c.solution.edgeKeys.clear(); expect(call()).toEqual([]);
    c.solution.nodeIndexes.add(-1); expect(call()).toEqual([]);
  });
  it.each(["extra", "all-available"] as const)("keeps production %s results and alternatives valid", (pointBudgetMode) => {
    const { request } = weightedJunctionFixture(true); request.pointBudgetMode = pointBudgetMode;
    const rows: BuildGoalsOptimizeResult[] = [], attempts: number[] = [];
    const result = optimizeWeightedBuildGoals(request, (r) => rows.push(r), { maxIterations: 256, onJunctionRelocation: (e) => attempts.push(e.iteration) });
    expect(attempts.length).toBeGreaterThan(0);
    for (const r of [...rows, result]) { expect(independentlyValid(request, r)).toBe(true); expect(createBuildGoalsValidation(request).validateResult(r)).toEqual([]); }
    expect(result.pointCost).toBeLessThanOrEqual(9);
  });
  it.each(["excluded", "locked", "keystone"] as const)("does not route through an unallowed %s junction", (kind) => {
    const { request } = weightedJunctionFixture();
    if (kind === "excluded") request.excludedNodeIds = ["new"];
    if (kind === "locked") request.graph.nodes.new.visibility = { requiredAscendancy: { id: "oracle", name: "Oracle", className: "Druid" } };
    if (kind === "keystone") request.graph.nodes.new.flags.keystone = true;
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 128 });
    expect(result.totalNodeIds).not.toContain("new"); expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
  });
  it("retains weapon connections and never spends main points on reserved weapon nodes", () => {
    const { request } = weightedJunctionFixture();
    request.graph.nodes.w1 = { ...request.graph.nodes.old, id: "w1", stats: ["+5000 to Strength"] };
    request.graph.edges.push({ from: "old", to: "w1" });
    request.weaponSets = { allocations: { 1: ["w1"], 2: [] }, attachmentNodeIds: ["old"] };
    const before = JSON.stringify(request), rows: BuildGoalsOptimizeResult[] = [];
    const result = optimizeWeightedBuildGoals(request, (r) => rows.push(r), { maxIterations: 256 });
    for (const r of [...rows, result]) {
      expect(r.totalNodeIds).toContain("old"); expect(r.totalNodeIds).not.toContain("w1"); expect(r.pointCost).toBeLessThanOrEqual(8);
      expect(createBuildGoalsValidation(request).validateResult(r)).toEqual([]);
    }
    expect(JSON.stringify(request)).toBe(before);
  });
  it.each(["cancel", "deadline"] as const)("honors %s at dispatch and retains the valid incumbent", (kind) => {
    const { request } = weightedJunctionFixture(); let stop = false, clock = 0, attempts = 0;
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 256, now: () => clock, noImprovementMs: 50,
      shouldCancel: () => kind === "cancel" && stop, onJunctionRelocation: () => { attempts += 1; stop = true; clock = 100; } });
    expect(attempts).toBe(1);
    expect(result).toMatchObject({ status: kind === "cancel" ? "cancelled" : "success", completeReason: kind === "cancel" ? "cancelled" : "no-improvement" });
    expect(createBuildGoalsValidation(request).validateResult({ ...result, status: "success" })).toEqual([]);
  });
  it("does not queue unchanged incumbents again and supports the disabled control", () => {
    const { request } = weightedJunctionFixture();
    const collect = (maxIterations: number, enableJunctionRelocation = true) => {
      const attempts: number[] = [];
      optimizeWeightedBuildGoals(request, undefined, { maxIterations, enableJunctionRelocation, onJunctionRelocation: (e) => attempts.push(e.iteration) });
      return attempts;
    };
    expect(collect(256).length).toBeGreaterThan(0); expect(collect(512)).toEqual(collect(256)); expect(collect(256, false)).toEqual([]);
  });
});

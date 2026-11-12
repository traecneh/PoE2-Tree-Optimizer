import { describe, expect, it } from "vitest";
import { optimizeBuildGoals, optimizeBuildGoalsAnytime, type BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import { createBuildGoalsValidation, optimizerTreeFingerprint } from "./buildGoalsValidation";
import { exhaustiveMinimum, independentlyValid, validationGraph, validationRequest, validationResult } from "./buildGoalsValidation.fixtures";

const algorithms = [
  ["exact/bounded", (request: BuildGoalsOptimizeRequest) => optimizeBuildGoals(request)],
  ["anytime", (request: BuildGoalsOptimizeRequest) => optimizeBuildGoalsAnytime(request, undefined, { maxIterations: 3 })],
  ["weighted", (request: BuildGoalsOptimizeRequest) => optimizeWeightedBuildGoals({ ...request, mode: "weighted", extraPointBudget: 1, preferences: [{ id: "energyShield", weight: 1 }] }, undefined, { maxIterations: 3 })],
] as const;

describe("optimizer request validation", () => {
  it.each(algorithms)("%s rejects unknown goals rather than declaring them reached", (_name, solve) => {
    const result = solve({ ...validationRequest(), goalNodeIds: ["not-in-this-patch"] });
    expect(result).toMatchObject({ status: "error", pointCost: 0, validationIssues: [expect.objectContaining({ code: "unknown-node" })] });
    expect(result.addedNodeIds).toEqual([]);
  });
  it.each(algorithms)("%s rejects disconnected base components as free sources", (_name, solve) => {
    const result = solve({ ...validationRequest(validationGraph([["start", "travel"], ["island", "goal"]])), baseNodeIds: ["start", "island"] });
    expect(result.validationIssues).toContainEqual(expect.objectContaining({ code: "disconnected-base" }));
  });
  it.each(algorithms)("%s honors excluded transit nodes without losing required goals", (_name, solve) => {
    const request = { ...validationRequest(), excludedNodeIds: ["travel"] };
    const result = solve(request);
    expect(result.status).toBe("success");
    expect(result.totalNodeIds).toEqual(["start", "other", "goal"]);
    expect(independentlyValid(request, result)).toBe(true);
  });
  it.each(algorithms)("%s rejects conflicts, foreign starts and non-main allocations", (_name, solve) => {
    const request = validationRequest();
    expect(solve({ ...request, excludedNodeIds: ["goal"] }).status).toBe("error");
    for (const flag of ["ascendancy", "mastery", "classStart"] as const) {
      const graph = validationGraph(); graph.nodes.goal.flags[flag] = true;
      expect(solve(validationRequest(graph)).status).toBe("error");
    }
  });
  it("rejects missing/bad base connections while preserving benign duplicate input IDs", () => {
    const request = validationRequest();
    expect(createBuildGoalsValidation({ ...request, baseNodeIds: ["start", "travel"] }).issues).toContainEqual(expect.objectContaining({ code: "disconnected-base" }));
    expect(createBuildGoalsValidation({ ...request, baseEdgeKeys: ["start::goal"] }).issues).toContainEqual(expect.objectContaining({ code: "invalid-edge" }));
    const result = optimizeBuildGoals({ ...request, baseNodeIds: ["start", "travel", "travel"], baseEdgeKeys: ["start::travel", "start::travel"], goalNodeIds: ["goal", "goal"] });
    expect(result.status).toBe("success"); expect(result.pointCost).toBe(1);
    expect(result.addedEdgeKeys).toEqual(["goal::travel"]);
  });
  it("requires explicit gate context and excludes locked transit from the search graph", () => {
    const graph = validationGraph([["start", "travel"], ["travel", "goal"], ["asc-start", "unlock"]]);
    graph.nodes.unlock.flags = { ascendancy: true };
    graph.nodes.unlock.ascendancy = { id: "oracle", name: "Oracle", className: "Druid", disabled: false };
    graph.nodes.goal.visibility = { requiredAscendancy: { id: "oracle", name: "Oracle", className: "Druid" }, unlockNodeId: "unlock" };
    expect(optimizeBuildGoals(validationRequest(graph)).validationIssues).toContainEqual(expect.objectContaining({ code: "locked-node" }));
    const request = { ...validationRequest(graph), visibility: { selectedAscendancyId: "oracle", allocatedAscendancyNodeIds: ["unlock"] } };
    expect(optimizeBuildGoals(request).status).toBe("success");
    expect(optimizeBuildGoals({ ...request, visibility: { selectedAscendancyId: "other", allocatedAscendancyNodeIds: ["unlock"] } }).status).toBe("error");
  });
  it("detects changed graph contents, not just a version label", () => {
    const graph = validationGraph(); const hash = optimizerTreeFingerprint(graph);
    const changed = structuredClone(graph); changed.nodes.goal.stats = ["Changed effect"];
    expect(optimizerTreeFingerprint(changed)).not.toBe(hash);
    expect(optimizeBuildGoals({ ...validationRequest(changed), treeFingerprint: hash }).validationIssues).toContainEqual(expect.objectContaining({ code: "stale-tree" }));
    const reordered = { ...graph, nodes: Object.fromEntries(Object.entries(graph.nodes).reverse()), edges: [...graph.edges].reverse() };
    expect(optimizerTreeFingerprint(reordered)).toBe(hash);
  });
  it.each([NaN, Infinity, -1, 1.5, 124])("rejects invalid budget %s rather than clamping it", (totalPointLimit) => {
    expect(optimizeBuildGoals({ ...validationRequest(), totalPointLimit }).status).toBe("error");
  });
  it("fails closed on unreadable request payloads", () => {
    for (const request of [null, {}, { ...validationRequest(), goalNodeIds: "goal" }, { ...validationRequest(), graph: {} }]) {
      expect(optimizeBuildGoals(request as BuildGoalsOptimizeRequest).status).toBe("error");
    }
  });
  it("does not mistake inherited object properties for real node IDs", () => {
    expect(optimizeBuildGoals({ ...validationRequest(), goalNodeIds: ["toString"] }).validationIssues).toContainEqual(expect.objectContaining({ code: "unknown-node" }));
  });
});

describe("independent result validation", () => {
  it("accepts the literal fixture and preserves zero-cost base nodes", () => {
    const request = validationRequest(); const result = validationResult();
    expect(independentlyValid(request, result)).toBe(true);
    expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
    const reached = optimizeBuildGoals({ ...request, goalNodeIds: ["start"] });
    expect(reached).toMatchObject({ status: "success", pointCost: 0, addedNodeIds: [], totalNodeIds: ["start"] });
  });
  it("checks every alternative, not just the advertised best route", () => {
    const result = validationResult();
    result.routeCandidates = [{ ...result, totalEdgeKeys: [] }];
    expect(createBuildGoalsValidation(validationRequest()).validateResult(result)).toContainEqual(expect.objectContaining({ code: "disconnected-result" }));
  });
  it("rejects wrong counts, missing goals, duplicate nodes, invented edges and unusable prune order", () => {
    const mutations = [
      { pointCost: 1 }, { totalNodeIds: ["start", "travel"] }, { addedNodeIds: ["travel", "goal", "goal"] },
      { totalEdgeKeys: ["start::travel", "goal::other"] }, { addedEdgeKeys: [] },
      { orderedNodeIds: ["start", "goal", "travel"] }, { unreachableGoalNodeIds: ["goal"] },
    ];
    for (const patch of mutations) expect(createBuildGoalsValidation(validationRequest()).validateResult({ ...validationResult(), ...patch }).length).toBeGreaterThan(0);
  });
  it("rejects stale worker results and budget violations", () => {
    const request = validationRequest(); request.treeFingerprint = optimizerTreeFingerprint(request.graph);
    expect(createBuildGoalsValidation(request).validateResult(validationResult())).toContainEqual(expect.objectContaining({ code: "stale-result" }));
    expect(createBuildGoalsValidation({ ...request, pointBudgetMode: "all-available", totalPointLimit: 1 }).validateResult({ ...validationResult(), treeFingerprint: request.treeFingerprint })).toContainEqual(expect.objectContaining({ code: "point-budget" }));
  });
  it("does not claim support for mixed pools, including free ascendancy choices", () => {
    const request = validationRequest();
    request.graph.nodes.travel.flags.ascendancy = true;
    expect(createBuildGoalsValidation(request).validateResult(validationResult())).toContainEqual(expect.objectContaining({ code: "unavailable-node" }));
    for (const allocationPool of ["weapon1", "weapon2", "ascendancy"] as const) {
      expect(optimizeBuildGoals({ ...validationRequest(), allocationPool }).validationIssues).toContainEqual(expect.objectContaining({ code: "unsupported-pool", kind: "unsupported" }));
    }
  });
  it("checks weighted budgets against the actual retained baseline, not just self-reported numbers", () => {
    const request = { ...validationRequest(), mode: "weighted" as const, extraPointBudget: 1, preferences: [{ id: "energyShield" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 3 });
    expect(result.status).toBe("success");
    expect(createBuildGoalsValidation(request).validateResult(result)).toEqual([]);
    const inflated = structuredClone(result);
    for (const route of [inflated, ...inflated.routeCandidates!]) {
      route.weighted!.baselinePointCost = 100;
      route.weighted!.maxPointCost = 101;
    }
    expect(createBuildGoalsValidation(request).validateResult(inflated)).toContainEqual(expect.objectContaining({ code: "weighted-baseline" }));
    const mismatch = structuredClone(result);
    mismatch.routeCandidates![0] = { ...validationResult(), pointCost: 2, weighted: { ...result.weighted!, score: result.weighted!.score + 1 } };
    expect(createBuildGoalsValidation(request).validateResult(mismatch)).toContainEqual(expect.objectContaining({ code: "best-route" }));
  });
  it("matches an independent exhaustive oracle on 100 seeded tiny graphs", () => {
    let seed = 20261108;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let trial = 0; trial < 100; trial += 1) {
      const ids = ["start", "a", "b", "c", "d", "e", "goal"];
      const edges: [string, string][] = ids.slice(1).map((id, i) => [ids[i], id]);
      for (let i = 0; i < 8; i += 1) {
        const a = Math.floor(random() * ids.length), b = Math.floor(random() * ids.length);
        if (a !== b) edges.push([ids[a], ids[b]]);
      }
      const request = { ...validationRequest(validationGraph(edges)), goalNodeIds: ["c", "goal"] };
      const result = optimizeBuildGoals(request);
      expect(result.status, `seeded trial ${trial}`).toBe("success");
      expect(independentlyValid(request, result), `trial ${trial}`).toBe(true);
      expect(result.pointCost, `trial ${trial}`).toBe(exhaustiveMinimum(request));
      const validator = createBuildGoalsValidation(request);
      for (const invalid of [
        { ...result, pointCost: result.pointCost + 1 },
        { ...result, totalNodeIds: [...result.totalNodeIds, "unknown"] },
        { ...result, addedNodeIds: [...result.addedNodeIds, result.addedNodeIds[0]] },
        { ...result, totalEdgeKeys: [] },
      ]) expect(validator.validateResult(invalid).length, `mutation trial ${trial}`).toBeGreaterThan(0);
      for (const invalidRequest of [
        { ...request, goalNodeIds: [...request.goalNodeIds, "unknown"] },
        { ...request, baseNodeIds: ["start", "unknown"] },
        { ...request, baseEdgeKeys: ["goal::start"] },
        { ...request, rootNodeId: "goal" },
        { ...request, excludedNodeIds: ["c"] },
        { ...request, allocationPool: "weapon1" as const },
      ]) expect(createBuildGoalsValidation(invalidRequest).issues.length, `request mutation ${trial}`).toBeGreaterThan(0);
      const gated = structuredClone(request.graph);
      gated.nodes.c.visibility = { requiredAscendancy: { id: "oracle", name: "Oracle", className: "Druid" } };
      expect(createBuildGoalsValidation({ ...request, graph: gated }).issues).toContainEqual(expect.objectContaining({ code: "locked-node" }));
      const foreign = structuredClone(request.graph); foreign.nodes.c.flags.classStart = true;
      expect(createBuildGoalsValidation({ ...request, graph: foreign }).issues).toContainEqual(expect.objectContaining({ code: "foreign-root" }));
      expect(createBuildGoalsValidation({ ...request, pointBudgetMode: "all-available", totalPointLimit: 0 }).validateResult(result)).toContainEqual(expect.objectContaining({ code: "point-budget" }));
    }
  });
});

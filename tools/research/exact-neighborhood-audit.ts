import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { compileNeighborhood, enumerateNeighborhood, type NeighborhoodInput } from "./exact-neighborhood";
import { exactAuditDirectory, type NeighborhoodPlan } from "./exact-neighborhood-plan";
import { auditHeldoutAllocation, heldoutCases } from "./heldout-weighted-corpus";
import { digest } from "./imported-weighted-corpus";
import { scorePassiveNode } from "../../src/tree/passivePreferences";
import type { BuildGoalsOptimizeRequest, BuildGoalsOptimizeResult } from "../../src/tree/buildGoalsOptimizer";
import type { TreeGraph } from "../../src/tree/types";

type RewardReview = {
  unitsPerScore: number; profiles: Record<string, Record<string, { weight: number; scale: number }>>;
  valued: { text: string; units: Record<string, number>; reason: string }[];
  zeroGroups: { reason: string; texts: string[] }[];
};

export function reviewedRewards(plan: Pick<NeighborhoodPlan, "family" | "variableNodeIds">, graph: TreeGraph, review: RewardReview) {
  assert.equal(review.unitsPerScore, 60); assert.ok(review.profiles[plan.family]);
  const entries = new Map<string, { units: Record<string, number>; reason: string }>();
  const add = (text: string, units: Record<string, number>, reason: string) => {
    assert.ok(!entries.has(text), `Duplicate reward review: ${text}`); assert.ok(reason.length > 0);
    for (const [family, value] of Object.entries(units)) assert.ok(review.profiles[family] && Number.isSafeInteger(value));
    entries.set(text, { units, reason });
  };
  for (const entry of review.valued) add(entry.text, entry.units, entry.reason);
  for (const group of review.zeroGroups) for (const text of group.texts) add(text, {}, group.reason);
  const nodes = plan.variableNodeIds.map((id) => {
    assert.ok(graph.nodes[id]);
    const lines = graph.nodes[id].stats.map((text) => {
      const entry = entries.get(text); assert.ok(entry, `Unreviewed stat blocks exact claim: ${text}`);
      return { text, units: entry.units[plan.family] ?? 0, reason: entry.reason };
    });
    return { id, name: graph.nodes[id].name, lines, units: lines.reduce((sum, line) => sum + line.units, 0) };
  });
  return { nodes, rewardUnits: Object.fromEntries(nodes.map((node) => [node.id, node.units])) };
}

export function rawAllocation(request: BuildGoalsOptimizeRequest, nodeIds: string[]): BuildGoalsOptimizeResult {
  const selected = new Set(nodeIds); assert.equal(selected.size, nodeIds.length);
  const adjacency = new Map(nodeIds.map((id) => [id, [] as string[]])), keys = new Set<string>();
  for (const { from, to } of request.graph.edges) if (from !== to && selected.has(from) && selected.has(to)) {
    adjacency.get(from)!.push(to); adjacency.get(to)!.push(from); keys.add([from, to].sort().join("::"));
  }
  const order = [request.rootNodeId!], seen = new Set(order);
  for (let i = 0; i < order.length; i += 1) for (const next of adjacency.get(order[i])!.sort()) if (!seen.has(next)) { seen.add(next); order.push(next); }
  assert.equal(seen.size, selected.size, "Raw reconstructed allocation is disconnected");
  const base = new Set(request.baseNodeIds), baseEdges = new Set(request.baseEdgeKeys);
  const addedNodeIds = order.filter((id) => !base.has(id)), totalEdgeKeys = [...keys].sort();
  return { status: "success", totalNodeIds: order, orderedNodeIds: order, addedNodeIds, pointCost: addedNodeIds.length,
    totalEdgeKeys, addedEdgeKeys: totalEdgeKeys.filter((key) => !baseEdges.has(key)), unreachableGoalNodeIds: [] };
}

export function runExactNeighborhoodAudits(output: string, maxMs = 0) {
  const inside = relative(resolve("var"), resolve(output)); assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside));
  assert.ok(Number.isSafeInteger(maxMs) && maxMs >= 0);
  const planText = readFileSync(`${exactAuditDirectory}/plan.json`, "utf8"), planFile = JSON.parse(planText);
  const graphText = readFileSync("data/tree-graph.json", "utf8"), graph = JSON.parse(graphText) as TreeGraph;
  const benchmarkText = readFileSync("var/weighted-holdout-20261108/benchmark-v1/benchmark.json", "utf8"), benchmark = JSON.parse(benchmarkText);
  assert.equal(planFile.graphSha256, digest(graphText)); assert.equal(planFile.benchmarkSha256, digest(benchmarkText));
  const reviewText = readFileSync("tools/research/exact-neighborhood-rewards.json", "utf8"), review = JSON.parse(reviewText) as RewardReview;
  const cases = heldoutCases(graph, benchmark.corpus);
  const sourcePaths = ["tools/research/exact-neighborhood.ts", "tools/research/exact-neighborhood-audit.ts", "tools/research/exact-neighborhood-plan.ts",
    "tools/research/exact-neighborhood-rewards.json", `${exactAuditDirectory}/plan.json`, `${exactAuditDirectory}/review-input.json`,
    ...Object.keys(benchmark.fingerprints), "src/tree/skillPreferencePresets.ts", "src/tree/skillSupportPreferences.ts"];
  const fingerprints = Object.fromEntries(sourcePaths.map((path) => [path, digest(readFileSync(path))]));
  mkdirSync(resolve(output));
  const results: unknown[] = [];
  for (const plan of planFile.plans as NeighborhoodPlan[]) {
    const item = cases.find((item) => item.key === plan.case)!; assert.ok(item);
    const row = benchmark.results.find((row: any) => row.case === plan.case && row.arm === "current" && row.seed === 1701
      && row.limitMs === (plan.family === "warbringer-partial" ? 2000 : 60000)); assert.ok(row);
    assert.deepEqual(row.selectedNodeIds, plan.incumbentNodeIds); assert.deepEqual(row.selectedEdgeKeys, plan.incumbentEdgeKeys);
    assert.deepEqual(Object.fromEntries(item.profile.preferences.map((p) => [p.id, p.weight])),
      Object.fromEntries(Object.entries(review.profiles[plan.family]).map(([id, p]) => [id, p.weight])));
    const reviewed = reviewedRewards(plan, graph, review);
    // Production scoring is only a consistency check, never the oracle reward source.
    for (const node of reviewed.nodes) {
      const actual = scorePassiveNode(graph.nodes[node.id], item.profile.preferences) * review.unitsPerScore;
      assert.ok(Math.abs(actual - node.units) < 1e-7, `Independent reward disagreement for ${node.id}: ${node.units} vs ${actual}`);
    }
    const protectedIds = new Set([...item.request.baseNodeIds, ...item.request.goalNodeIds, ...(item.request.weaponSets?.attachmentNodeIds ?? [])]);
    assert.deepEqual([...protectedIds].sort(), [...plan.protectedNodeIds].sort());
    const reserved = new Set([...(item.request.excludedNodeIds ?? []), ...(item.request.weaponSets?.allocations[1] ?? []), ...(item.request.weaponSets?.allocations[2] ?? [])]);
    for (const id of plan.variableNodeIds) {
      const node = item.request.graph.nodes[id]; assert.ok(node && !protectedIds.has(id) && !reserved.has(id));
      assert.ok(!node.flags.classStart && !node.flags.ascendancy && !node.flags.mastery && (!node.flags.keystone || plan.incumbentNodeIds.includes(id)));
    }
    for (const id of plan.incumbentNodeIds) if (id !== plan.rootNodeId) assert.ok(!graph.nodes[id].flags.classStart && !graph.nodes[id].flags.ascendancy);
    assert.equal(plan.pointLimit, Math.min(row.mainPointLimit, row.basePoints + row.pointBudget));
    const input: NeighborhoodInput = { nodeIds: Object.keys(item.request.graph.nodes), edges: item.request.graph.edges.map((edge) => [edge.from, edge.to]),
      rootNodeId: plan.rootNodeId, incumbentNodeIds: plan.incumbentNodeIds, variableNodeIds: plan.variableNodeIds, protectedNodeIds: plan.protectedNodeIds,
      committedEdges: plan.baseEdgeKeys.map((key) => key.split("::") as [string, string]), pointLimit: plan.pointLimit, rewardUnits: reviewed.rewardUnits };
    const compiled = compileNeighborhood(input), started = performance.now();
    const exact = enumerateNeighborhood(input, () => maxMs > 0 && performance.now() - started >= maxMs), elapsedMs = performance.now() - started;
    const bestIds = [...compiled.fixedNodeIds, ...exact.bestVariableNodeIds];
    const structuralRequest = { ...item.request, mode: "shortest" as const, totalPointLimit: plan.pointLimit };
    const incumbent = rawAllocation(structuralRequest, plan.incumbentNodeIds), winner = rawAllocation(structuralRequest, bestIds);
    const incumbentCheck = auditHeldoutAllocation(structuralRequest, incumbent, item.build), winnerCheck = auditHeldoutAllocation(structuralRequest, winner, item.build);
    assert.ok(!winnerCheck.overMainCap && !winnerCheck.weaponOverlap.length && !winnerCheck.detachedWeaponNodes.length);
    const score = (ids: string[]) => ids.filter((id) => !item.request.baseNodeIds.includes(id)).reduce((sum, id) => sum + scorePassiveNode(graph.nodes[id], item.profile.preferences), 0);
    const incumbentScore = score(plan.incumbentNodeIds), winnerScore = score(bestIds), gain = (exact.scoreUnits - exact.incumbentScoreUnits) / review.unitsPerScore;
    assert.ok(Math.abs(incumbentScore - row.checkpoint.score) < 1e-7); assert.ok(Math.abs(winnerScore - incumbentScore - gain) < 1e-7);
    assert.equal(winnerCheck.totalPoints, exact.totalPoints);
    const changed = { removed: plan.incumbentNodeIds.filter((id) => !bestIds.includes(id)), added: bestIds.filter((id) => !plan.incumbentNodeIds.includes(id)) };
    const result = { id: plan.id, case: plan.case, centerNodeId: plan.centerNodeId, radius: plan.radius, variableNodeCount: plan.variableNodeIds.length,
      fixedComponentCount: compiled.fixedComponents.length, ignoredSelfLinks: input.edges.filter(([a, b]) => a === b).length,
      pointLimit: plan.pointLimit, elapsedMs, exact, reviewedNodes: reviewed.nodes,
      localScoreGain: gain, totalPointSaving: incumbentCheck.totalPoints - winnerCheck.totalPoints, incumbentScore, winnerScore,
      incumbentCheck, winnerCheck, changed, winnerNodeIds: winner.totalNodeIds, winnerEdgeKeys: winner.totalEdgeKeys };
    writeFileSync(resolve(output, `${plan.id}.json`), JSON.stringify({ plan, input, result }, null, 2), { flag: "wx" });
    results.push(result); writeFileSync(resolve(output, "results.partial.json"), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ id: plan.id, status: exact.status, states: exact.enumerated, scoreGain: gain, pointSaving: result.totalPointSaving, elapsedMs }));
  }
  for (const [path, hash] of Object.entries(fingerprints)) assert.equal(digest(readFileSync(path)), hash, path);
  writeFileSync(resolve(output, "audit.json"), JSON.stringify({ version: 1, capturedAt: new Date().toISOString(), node: process.version,
    graphSha256: digest(graphText), benchmarkSha256: digest(benchmarkText), planSha256: digest(planText), reviewSha256: digest(reviewText), fingerprints,
    unitsPerScore: review.unitsPerScore, unavailable: planFile.unavailable, results,
    meaning: "Exact only within each explicit variable-node domain, with all outside allocations fixed, real graph connections available, every fixed component reconnected and signed reviewed proxy rewards. Not whole-tree optimality, Full DPS, or an applied route. Cancelled results are not exact proofs." }, null, 2), { flag: "wx" });
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { output: { type: "string", default: `${exactAuditDirectory}/audit-v1` }, "max-ms": { type: "string", default: "0" } } });
  runExactNeighborhoodAudits(values.output!, Number(values["max-ms"]));
}

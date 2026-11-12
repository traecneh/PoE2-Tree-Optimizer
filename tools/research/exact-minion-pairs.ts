import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { compileStreamingNeighborhood, enumerateStreamingNeighborhood } from "./exact-neighborhood-streaming";
import { rawStreamingNeighborhoodReference } from "./exact-neighborhood-streaming-reference";
import { rawAllocation, reviewedRewards } from "./exact-neighborhood-audit";
import { pairAllocationParts, type PairedNeighborhood } from "./exact-paired-neighborhoods";
import { heldoutCases, auditHeldoutAllocation } from "./heldout-weighted-corpus";
import { digest } from "./imported-weighted-corpus";
import { scorePassiveNode } from "../../src/tree/passivePreferences";
import type { NeighborhoodPlan } from "./exact-neighborhood-plan";
import type { NeighborhoodInput } from "./exact-neighborhood";
import type { TreeGraph } from "../../src/tree/types";

export const minionPairDirectory = "var/exact-streaming-minion-pairs-20261108";
const parentPath = "var/exact-neighborhoods-20261108/plan.json", pairedPath = "var/exact-paired-neighborhoods-20261108/plan.json";
const graphPath = "data/tree-graph.json", benchmarkPath = "var/weighted-holdout-20261108/benchmark-v1/benchmark.json";
const reviewPath = "tools/research/exact-neighborhood-rewards.json";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const assertHashes = (hashes: Record<string, string>) => { for (const [path, hash] of Object.entries(hashes)) assert.equal(digest(readFileSync(path)), hash, path); };
type PriorPairs = { excluded: { sourceRegionIds: string[]; variableCount: number; sharedCount: number; case: string }[] };

export function excludedMinionPairs(parent: { plans: NeighborhoodPlan[] }, prior: PriorPairs): PairedNeighborhood[] {
  return ["spectres", "wolfpack"].map((family) => {
    const ids = [`${family}-junction`, `${family}-travel`];
    const [a, b] = ids.map((id) => { const found = parent.plans.filter((p) => p.id === id); assert.equal(found.length, 1, `Missing/duplicate source: ${id}`); return found[0]; });
    for (const key of ["family", "case", "rootNodeId", "pointLimit", "mainPointLimit", "incumbentNodeIds", "incumbentEdgeKeys", "protectedNodeIds", "baseEdgeKeys"] as const) assert.deepEqual(a[key], b[key], key);
    assert.equal(a.family, family); assert.equal(a.pointLimit, 123); assert.equal(a.mainPointLimit, 123);
    assert.equal(new Set(a.variableNodeIds).size, a.variableNodeIds.length); assert.equal(new Set(b.variableNodeIds).size, b.variableNodeIds.length);
    const variableNodeIds = [...new Set([...a.variableNodeIds, ...b.variableNodeIds])].sort((x, y) => Number(x) - Number(y));
    const excluded = prior.excluded.filter((p) => JSON.stringify(p.sourceRegionIds) === JSON.stringify(ids)); assert.equal(excluded.length, 1);
    assert.equal(excluded[0].variableCount, 21); assert.equal(variableNodeIds.length, 21); assert.equal(excluded[0].sharedCount, 0); assert.equal(excluded[0].case, a.case);
    const sharedNodeIds = variableNodeIds.filter((id) => a.variableNodeIds.includes(id) && b.variableNodeIds.includes(id)); assert.equal(sharedNodeIds.length, 0);
    return { ...a, id: `${a.id}--${b.policy}`, policy: "paired-union", variableNodeIds, sourceRegionIds: [ids[0], ids[1]], sharedNodeIds,
      leftOnlyNodeIds: variableNodeIds.filter((id) => !b.variableNodeIds.includes(id)), rightOnlyNodeIds: variableNodeIds.filter((id) => !a.variableNodeIds.includes(id)) };
  });
}

function auditContexts() {
  const protectedHashes = read(`${minionPairDirectory}/protected-before.json`); assertHashes(protectedHashes);
  const parent = read(parentPath), prior = read(pairedPath), graph = read(graphPath) as TreeGraph, benchmark = read(benchmarkPath), review = read(reviewPath);
  for (const plan of [parent, prior]) {
    assert.equal(plan.graphSha256, digest(readFileSync(graphPath))); assert.equal(plan.benchmarkSha256, digest(readFileSync(benchmarkPath)));
  }
  const cases = heldoutCases(graph, benchmark.corpus);
  const contexts = excludedMinionPairs(parent, prior).map((pair) => {
    const item = cases.find((c) => c.key === pair.case)!; assert.ok(item);
    const row = benchmark.results.find((r: any) => r.case === pair.case && r.arm === "current" && r.seed === 1701 && r.limitMs === 60000); assert.ok(row);
    assert.deepEqual(pair.incumbentNodeIds, row.selectedNodeIds); assert.deepEqual(pair.incumbentEdgeKeys, row.selectedEdgeKeys);
    assert.equal(pair.pointLimit, Math.min(row.mainPointLimit, row.basePoints + row.pointBudget)); assert.equal(item.build.mainPointLimit, 123);
    assert.equal(item.build.weaponNodeIds.length, 0);
    assert.deepEqual(Object.fromEntries(item.profile.preferences.map((p) => [p.id, p.weight])),
      Object.fromEntries(Object.entries(review.profiles[pair.family]).map(([id, p]: [string, any]) => [id, p.weight])));
    const required = [...new Set([...item.request.baseNodeIds, ...item.request.goalNodeIds, ...(item.request.weaponSets?.attachmentNodeIds ?? [])])];
    assert.deepEqual([...required].sort(), [...pair.protectedNodeIds].sort());
    const reserved = new Set([...(item.request.excludedNodeIds ?? []), ...item.build.weaponNodeIds]), reviewed = reviewedRewards(pair, graph, review);
    for (const node of reviewed.nodes) {
      const flags = item.request.graph.nodes[node.id]?.flags;
      assert.ok(flags && !required.includes(node.id) && !reserved.has(node.id));
      assert.ok(!flags.classStart && !flags.ascendancy && !flags.mastery && (!flags.keystone || pair.incumbentNodeIds.includes(node.id)));
      assert.ok(Math.abs(scorePassiveNode(graph.nodes[node.id], item.profile.preferences) * review.unitsPerScore - node.units) < 1e-7);
    }
    for (const id of pair.incumbentNodeIds) if (id !== pair.rootNodeId) assert.ok(!graph.nodes[id].flags.classStart && !graph.nodes[id].flags.ascendancy);
    const input: NeighborhoodInput = { nodeIds: Object.keys(item.request.graph.nodes), edges: item.request.graph.edges.map((e) => [e.from, e.to]),
      rootNodeId: pair.rootNodeId, incumbentNodeIds: pair.incumbentNodeIds, variableNodeIds: pair.variableNodeIds, protectedNodeIds: pair.protectedNodeIds,
      committedEdges: pair.baseEdgeKeys.map((key) => key.split("::") as [string, string]), pointLimit: pair.pointLimit, rewardUnits: reviewed.rewardUnits };
    compileStreamingNeighborhood(input);
    return { pair, input, reviewedNodes: reviewed.nodes, item, row };
  });
  return { contexts, protectedHashes, graph, review };
}

export function prepareMinionPairs() {
  const { contexts } = auditContexts();
  const plan = { version: 1, sourceHashes: Object.fromEntries([parentPath, pairedPath, graphPath, benchmarkPath, reviewPath].map((p) => [p, digest(readFileSync(p))])),
    entries: contexts.map(({ pair, input, reviewedNodes }) => ({ pair, input, reviewedNodes })),
    policy: "Only the two previously excluded 21-node Spectres/Wolf Pack junction/travel unions. Keep complete original domains, literal profile rewards, fixed outside allocation, committed base and required goals. One shared original 123-point allowance per build; no route applied or production changes." };
  writeFileSync(`${minionPairDirectory}/plan.json`, JSON.stringify(plan, null, 2), { flag: "wx" });
  console.log(JSON.stringify(plan.entries.map(({ pair, input }) => ({ id: pair.id, variables: input.variableNodeIds.length,
    totalAllowance: input.pointLimit, variableAllowance: compileStreamingNeighborhood(input).maxVariablePoints }))));
  return plan;
}

export function runMinionPairs(output: string, maxMs = 300_000, maxStates = 2 ** 24) {
  const inside = relative(resolve("var"), resolve(output)); assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside));
  assert.ok(Number.isSafeInteger(maxMs) && maxMs > 0 && Number.isSafeInteger(maxStates) && maxStates > 0);
  const planPath = `${minionPairDirectory}/plan.json`, plan = read(planPath), { contexts, graph, review, protectedHashes } = auditContexts();
  assert.equal(plan.version, 1); assertHashes(plan.sourceHashes);
  assert.deepEqual(plan.entries, contexts.map(({ pair, input, reviewedNodes }) => ({ pair, input, reviewedNodes })));
  const paths = [planPath, "tools/research/exact-minion-pairs.ts", "tools/research/exact-minion-pairs-test-context.ts", "tools/research/exact-minion-pairs.check.mjs", ...Object.keys(protectedHashes)];
  const fingerprints = Object.fromEntries(paths.map((p) => [p, digest(readFileSync(p))]));
  mkdirSync(resolve(output));
  const results = [];
  for (const { pair, input, reviewedNodes, item, row } of contexts) {
    const compiled = compileStreamingNeighborhood(input), beforeMemory = process.memoryUsage();
    console.log(`Streaming primary: ${pair.id}; ${input.variableNodeIds.length} variables, shared allowance ${compiled.maxVariablePoints}`);
    const started = performance.now(), primary = enumerateStreamingNeighborhood(input, { maxStates, shouldStop: () => performance.now() - started >= maxMs });
    const primaryMs = performance.now() - started;
    writeFileSync(resolve(output, `${pair.id}.primary.json`), JSON.stringify({ primary, primaryMs }, null, 2), { flag: "wx" });
    let reference: ReturnType<typeof rawStreamingNeighborhoodReference> | null = null, referenceMs = 0;
    if (primary.status === "optimal") {
      console.log(`Independent raw reference: ${pair.id}; ${primary.stateCount} subsets, no objective pruning.`);
      const referenceStart = performance.now();
      reference = rawStreamingNeighborhoodReference(input, { maxStates, shouldStop: () => performance.now() - referenceStart >= maxMs });
      referenceMs = performance.now() - referenceStart;
      if (reference.status === "optimal") {
        assert.equal(primary.scoreUnits, reference.scoreUnits); assert.equal(primary.variablePoints, reference.variablePoints);
        assert.deepEqual(primary.bestVariableNodeIds, reference.bestVariableNodeIds);
      }
    }
    const bestIds = [...compiled.fixedNodeIds, ...primary.bestVariableNodeIds], request = { ...item.request, mode: "shortest" as const, totalPointLimit: pair.pointLimit };
    const winner = rawAllocation(request, bestIds), incumbent = rawAllocation(request, pair.incumbentNodeIds);
    const winnerCheck = auditHeldoutAllocation(request, winner, item.build), incumbentCheck = auditHeldoutAllocation(request, incumbent, item.build);
    assert.equal(winnerCheck.totalPoints, primary.totalPoints); assert.ok(!winnerCheck.overMainCap && !winnerCheck.weaponOverlap.length && !winnerCheck.detachedWeaponNodes.length);
    const score = (ids: string[]) => ids.filter((id) => !request.baseNodeIds.includes(id)).reduce((sum, id) => sum + scorePassiveNode(graph.nodes[id], item.profile.preferences), 0);
    const incumbentScore = score(pair.incumbentNodeIds), winnerScore = score(bestIds), scoreGain = (primary.scoreUnits - primary.incumbentScoreUnits) / review.unitsPerScore;
    assert.ok(Math.abs(incumbentScore - row.checkpoint.score) < 1e-7); assert.ok(Math.abs(winnerScore - incumbentScore - scoreGain) < 1e-7);
    const before = pairAllocationParts(pair, pair.incumbentNodeIds, input.rewardUnits), after = pairAllocationParts(pair, bestIds, input.rewardUnits);
    for (const [parts, points, units] of [[before, primary.incumbentVariablePoints, primary.incumbentScoreUnits], [after, primary.variablePoints, primary.scoreUnits]] as const) {
      assert.equal(parts.left.points + parts.right.points + parts.shared.points, points); assert.equal(parts.left.scoreUnits + parts.right.scoreUnits + parts.shared.scoreUnits, units);
    }
    const result = { id: pair.id, case: pair.case, status: primary.status !== "optimal" ? primary.status : reference!.status,
      verified: primary.status === "optimal" && reference?.status === "optimal", primary, reference, primaryMs, referenceMs, scoreGain,
      pointSaving: incumbentCheck.totalPoints - winnerCheck.totalPoints, incumbentScore, winnerScore, before, after, winnerCheck, incumbentCheck,
      winnerNodeIds: winner.totalNodeIds, winnerEdgeKeys: winner.totalEdgeKeys,
      changed: { removed: pair.incumbentNodeIds.filter((id) => !bestIds.includes(id)), added: bestIds.filter((id) => !pair.incumbentNodeIds.includes(id)) },
      memory: { before: beforeMemory, after: process.memoryUsage(), processMaxRssKiB: process.resourceUsage().maxRSS }, maxMsPerPhase: maxMs, maxStatesPerPhase: maxStates };
    writeFileSync(resolve(output, `${pair.id}.json`), JSON.stringify({ pair, input, reviewedNodes, result }, null, 2), { flag: "wx" });
    results.push(result);
    console.log(JSON.stringify({ id: result.id, verified: result.verified, status: result.status, scoreGain, pointSaving: result.pointSaving, primaryMs, referenceMs }));
  }
  assertHashes(fingerprints);
  writeFileSync(resolve(output, "audit.json"), JSON.stringify({ version: 1, capturedAt: new Date().toISOString(), node: process.version,
    planSha256: digest(readFileSync(planPath)), fingerprints, results,
    meaning: "Exact only within each frozen 21-node union if both primary and independent raw reference finish and agree. One shared 123-point allowance, all outside allocations/goals/base fixed. Reviewed additive proxy rewards, not Full DPS or global optimality. No route applied. Cancelled/limited searches are not certificates." }, null, 2), { flag: "wx" });
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { prepare: { type: "boolean" }, output: { type: "string", default: `${minionPairDirectory}/audit-v1` },
    "max-ms": { type: "string", default: "300000" }, "max-states": { type: "string", default: String(2 ** 24) } } });
  if (values.prepare) prepareMinionPairs(); else runMinionPairs(values.output!, Number(values["max-ms"]), Number(values["max-states"]));
}

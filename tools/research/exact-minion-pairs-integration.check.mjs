import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { excludedMinionPairs, compileStreamingNeighborhood, enumerateStreamingNeighborhood, heldoutCases, auditHeldoutAllocation,
  rawAllocation, reviewedRewards, pairAllocationParts, digest } = await tsImport("./exact-minion-pairs-test-context.ts", import.meta.url);
const root = "var/exact-streaming-minion-pairs-20261108", read = (path) => JSON.parse(readFileSync(path, "utf8"));
const plan = read(`${root}/plan.json`), audit = read(`${root}/audit-v1/audit.json`), graph = read("data/tree-graph.json");
const benchmark = read("var/weighted-holdout-20261108/benchmark-v1/benchmark.json"), cases = heldoutCases(graph, benchmark.corpus);
const records = plan.entries.map((e) => read(`${root}/audit-v1/${e.pair.id}.json`));

test("completed proofs use the frozen original full unions and unchanged source inputs", () => {
  assert.equal(audit.planSha256, digest(readFileSync(`${root}/plan.json`)));
  for (const [path, hash] of Object.entries(plan.sourceHashes)) assert.equal(digest(readFileSync(path)), hash, path);
  const pairs = excludedMinionPairs(read("var/exact-neighborhoods-20261108/plan.json"), read("var/exact-paired-neighborhoods-20261108/plan.json"));
  assert.deepEqual(plan.entries.map((e) => e.pair), pairs); assert.deepEqual(audit.results, records.map((r) => r.result));
  for (let i = 0; i < records.length; i += 1) {
    assert.deepEqual(records[i].pair, plan.entries[i].pair); assert.deepEqual(records[i].input, plan.entries[i].input);
    assert.deepEqual(records[i].reviewedNodes, plan.entries[i].reviewedNodes);
  }
});

test("both primary replays and raw certificates exhaust all subsets and agree exactly", () => {
  let states = 0;
  for (const { input, result } of records) {
    assert.deepEqual(enumerateStreamingNeighborhood(input), result.primary);
    assert.equal(result.status, "optimal"); assert.equal(result.verified, true);
    for (const search of [result.primary, result.reference]) {
      assert.equal(search.status, "optimal"); assert.equal(search.enumerated, 2097152); assert.equal(search.enumerated, search.stateCount);
      assert.equal(search.totalPoints, 123); assert.equal(search.retainedSubsetSlots, 0);
    }
    assert.equal(result.primary.scoreUnits, result.reference.scoreUnits); assert.equal(result.primary.variablePoints, result.reference.variablePoints);
    assert.deepEqual(result.primary.bestVariableNodeIds, result.reference.bestVariableNodeIds);
    assert.equal(result.primary.budgetPruned + result.primary.objectivePruned + result.primary.connectivityChecks, result.primary.enumerated);
    states += result.primary.enumerated;
  }
  assert.equal(states, 4194304);
  assert.deepEqual(records.map((r) => r.result.reference.feasibleSubsets), [1, 134]);
});

test("each pair shares one allowance with fixed outside points counted only once", () => {
  assert.deepEqual(records.map((r) => r.result.primary.variablePoints), [12, 11]);
  for (const { pair, input, result } of records) {
    const compiled = compileStreamingNeighborhood(input);
    assert.equal(input.pointLimit, 123); assert.equal(compiled.fixedPaidPoints + compiled.maxVariablePoints, input.pointLimit);
    assert.equal(result.primary.variablePoints, compiled.maxVariablePoints); assert.equal(compiled.fixedPaidPoints + result.primary.variablePoints, result.primary.totalPoints);
    assert.equal(input.variableNodeIds.length, 21); assert.deepEqual(pair.sharedNodeIds, []);
    const bucketIds = [...pair.leftOnlyNodeIds, ...pair.rightOnlyNodeIds];
    assert.equal(new Set(bucketIds).size, 21); assert.deepEqual(new Set(bucketIds), new Set(input.variableNodeIds));
  }
});

test("reconstructed whole winners preserve every fixed node, required goal and committed edge", () => {
  for (const { pair, input, result } of records) {
    const item = cases.find((c) => c.key === pair.case), compiled = compileStreamingNeighborhood(input), selected = new Set(result.winnerNodeIds);
    for (const id of compiled.fixedNodeIds) assert.ok(selected.has(id));
    for (const id of selected) assert.ok(compiled.fixedNodeIds.includes(id) || input.variableNodeIds.includes(id));
    for (const id of input.protectedNodeIds) { assert.ok(selected.has(id)); assert.ok(!input.variableNodeIds.includes(id)); }
    const request = { ...item.request, mode: "shortest", totalPointLimit: input.pointLimit }, allocation = rawAllocation(request, result.winnerNodeIds);
    const checked = auditHeldoutAllocation(request, allocation, item.build);
    assert.deepEqual(checked, result.winnerCheck); assert.equal(checked.basePoints, 20); assert.equal(checked.totalPoints, 123);
    assert.equal(checked.overMainCap, false); assert.equal(allocation.pointCost, 103);
    assert.deepEqual(checked.weaponOverlap, []); assert.deepEqual(checked.detachedWeaponNodes, []); assert.deepEqual(item.build.weaponNodeIds, []);
    assert.deepEqual(allocation.totalEdgeKeys, result.winnerEdgeKeys);
    for (const edge of request.baseEdgeKeys) assert.ok(allocation.totalEdgeKeys.includes(edge));
    assert.deepEqual(result.changed, { added: [], removed: [] }); assert.equal(result.scoreGain, 0); assert.equal(result.pointSaving, 0);
  }
});

test("literal integer rewards and disjoint buckets reconstruct unchanged costs and scores", () => {
  assert.deepEqual(records.map((r) => r.result.primary.scoreUnits), [440, 300]);
  for (const { pair, input, reviewedNodes, result } of records) {
    const rewards = reviewedRewards(pair, graph, read("tools/research/exact-neighborhood-rewards.json"));
    assert.deepEqual(rewards.nodes, reviewedNodes); assert.deepEqual(rewards.rewardUnits, input.rewardUnits);
    assert.equal(new Set(reviewedNodes.flatMap((n) => n.lines.map((l) => l.text))).size, 14);
    assert.deepEqual(result.before, pairAllocationParts(pair, pair.incumbentNodeIds, input.rewardUnits));
    assert.deepEqual(result.after, pairAllocationParts(pair, result.winnerNodeIds, input.rewardUnits)); assert.deepEqual(result.before, result.after);
    assert.equal(result.after.left.points + result.after.right.points, result.primary.variablePoints);
    assert.equal(result.after.left.scoreUnits + result.after.right.scoreUnits, result.primary.scoreUnits);
  }
});

test("unchanged linear-memory kernels handle both larger possible-allocation graphs", () => {
  assert.deepEqual(records.map((r) => r.result.primary.domainNodeCount), [133, 134]);
  assert.deepEqual(records.map((r) => r.result.primary.typedArrayBytes), [2845, 2889]);
  const frozenKernels = read("var/exact-streaming-warbringer-20261108/frozen-inputs.json");
  for (const path of ["tools/research/exact-neighborhood-streaming.ts", "tools/research/exact-neighborhood-streaming-reference.ts"]) {
    assert.equal(digest(readFileSync(path)), frozenKernels[path]);
  }
  for (const { result } of records) assert.ok(result.primary.typedArrayBytes < 4096);
});

test("cumulative paired coverage is eight of ten with only 27/28-node Warbringer pairs untested", () => {
  const original = read("var/exact-paired-neighborhoods-20261108/plan.json"), first = read("var/exact-paired-neighborhoods-20261108/audit-v1/audit.json");
  const warPlan = read("var/exact-streaming-warbringer-20261108/plan.json"), warAudit = read("var/exact-streaming-warbringer-20261108/audit-v1/audit.json");
  assert.equal(warAudit.result.verified, true); assert.ok(first.results.every((r) => r.exact.status === "optimal" && r.reference));
  const covered = [...original.pairs, warPlan.pair, ...plan.entries.map((e) => e.pair)];
  assert.equal(new Set(covered.map((p) => p.id)).size, 8);
  const remaining = original.excluded.filter((p) => !covered.some((c) => JSON.stringify(c.sourceRegionIds) === JSON.stringify(p.sourceRegionIds)));
  assert.deepEqual(remaining.map((p) => p.variableCount).sort((a, b) => a - b), [27, 28]); assert.ok(remaining.every((p) => p.case.startsWith("warbringer-partial/")));
});

test("all 119 protected earlier files and four new frozen plan/tool files remain byte-identical", () => {
  const protectedFiles = read(`${root}/protected-before.json`), frozen = read(`${root}/frozen-inputs.json`);
  assert.equal(Object.keys(protectedFiles).length, 119); assert.equal(Object.keys(frozen).length, 4);
  for (const hashes of [protectedFiles, frozen, audit.fingerprints]) {
    for (const [path, hash] of Object.entries(hashes)) assert.equal(digest(readFileSync(path)), hash, path);
  }
});

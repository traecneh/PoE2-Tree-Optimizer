import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { compileStreamingNeighborhood, enumerateStreamingNeighborhood, heldoutCases, auditHeldoutAllocation, rawAllocation, reviewedRewards, pairAllocationParts, digest }
  = await tsImport("./exact-streaming-test-context.ts", import.meta.url);
const root = "var/exact-streaming-warbringer-20261108", read = (path) => JSON.parse(readFileSync(path, "utf8"));
const plan = read(`${root}/plan.json`), audit = read(`${root}/audit-v1/audit.json`), result = audit.result;
const graph = read("data/tree-graph.json"), benchmark = read("var/weighted-holdout-20261108/benchmark-v1/benchmark.json");
const item = heldoutCases(graph, benchmark.corpus).find((c) => c.key === plan.pair.case);

test("the audited union is exactly the previously excluded 22-node pair with no clipped nodes", () => {
  const parentPath = "var/exact-neighborhoods-20261108/plan.json", pairedPath = "var/exact-paired-neighborhoods-20261108/plan.json";
  assert.equal(plan.parentSha256, digest(readFileSync(parentPath))); assert.equal(plan.pairedPlanSha256, digest(readFileSync(pairedPath)));
  assert.equal(audit.planSha256, digest(readFileSync(`${root}/plan.json`)));
  const parent = read(parentPath), paired = read(pairedPath), [left, right] = plan.pair.sourceRegionIds.map((id) => parent.plans.find((p) => p.id === id));
  const original = paired.excluded.find((p) => JSON.stringify(p.sourceRegionIds) === JSON.stringify(plan.pair.sourceRegionIds));
  assert.equal(original.variableCount, 22); assert.equal(plan.input.variableNodeIds.length, 22);
  assert.deepEqual(new Set(plan.input.variableNodeIds), new Set([...left.variableNodeIds, ...right.variableNodeIds]));
  assert.equal(plan.input.pointLimit, left.pointLimit); assert.equal(plan.input.pointLimit, right.pointLimit); assert.equal(plan.input.pointLimit, 99);
  assert.deepEqual(plan.pair.sharedNodeIds, []);
  assert.deepEqual(new Set([...plan.pair.leftOnlyNodeIds, ...plan.pair.rightOnlyNodeIds]), new Set(plan.input.variableNodeIds));
});

test("primary replay and completed raw reference agree after all 4194304 subsets", () => {
  assert.deepEqual(enumerateStreamingNeighborhood(plan.input), result.primary);
  assert.equal(result.status, "optimal"); assert.equal(result.verified, true);
  for (const search of [result.primary, result.reference]) {
    assert.equal(search.status, "optimal"); assert.equal(search.enumerated, 4194304); assert.equal(search.enumerated, search.stateCount);
    assert.equal(search.scoreUnits, 315); assert.equal(search.variablePoints, 11); assert.equal(search.totalPoints, 99);
  }
  assert.deepEqual(result.primary.bestVariableNodeIds, result.reference.bestVariableNodeIds); assert.equal(result.reference.feasibleSubsets, 89);
  assert.equal(result.primary.budgetPruned + result.primary.objectivePruned + result.primary.connectivityChecks, result.primary.enumerated);
});

test("linear buffers support the 111-node domain without retaining per-subset arrays", () => {
  const compiled = compileStreamingNeighborhood(plan.input);
  assert.equal(compiled.offsets.length - 1, 111); assert.equal(compiled.fixedNodeIds.length, 89);
  assert.equal(compiled.maxVariablePoints, 11); assert.equal(compiled.fixedPaidPoints, 88);
  assert.equal(result.primary.retainedSubsetSlots, 0); assert.equal(result.reference.retainedSubsetSlots, 0);
  assert.equal(result.primary.typedArrayBytes, 2438);
  assert.ok(result.primary.typedArrayBytes < 4096); assert.ok(result.memory.processMaxRssKiB > 0);
});

test("sixteen earlier exact domains agree, with eleven raw rechecks before the larger audit", () => {
  assert.equal(audit.smallChecks.length, 16); assert.equal(audit.smallChecks.filter((c) => c.rawRechecked).length, 11);
  assert.deepEqual(audit.smallChecks, read(`${root}/audit-v1/small-checks.json`));
  for (const check of audit.smallChecks) {
    const previous = read(check.path), current = enumerateStreamingNeighborhood(previous.input);
    assert.equal(check.status, "optimal"); assert.equal(check.states, current.enumerated); assert.equal(check.states, previous.result.exact.stateCount);
    assert.equal(check.scoreUnits, previous.result.exact.scoreUnits); assert.equal(check.variablePoints, previous.result.exact.variablePoints);
    assert.deepEqual(current.bestVariableNodeIds, check.bestVariableNodeIds); assert.deepEqual(check.bestVariableNodeIds, previous.result.exact.bestVariableNodeIds);
  }
});

test("winner preserves the entire outside allocation, goals and committed edges", () => {
  const compiled = compileStreamingNeighborhood(plan.input), selected = new Set(result.winnerNodeIds);
  for (const id of compiled.fixedNodeIds) assert.ok(selected.has(id));
  for (const id of selected) assert.ok(compiled.fixedNodeIds.includes(id) || plan.input.variableNodeIds.includes(id));
  for (const id of plan.input.protectedNodeIds) { assert.ok(selected.has(id)); assert.ok(!plan.input.variableNodeIds.includes(id)); }
  const request = { ...item.request, mode: "shortest", totalPointLimit: plan.input.pointLimit };
  const allocation = rawAllocation(request, result.winnerNodeIds), checked = auditHeldoutAllocation(request, allocation, item.build);
  assert.deepEqual(checked, result.winnerCheck); assert.equal(checked.basePoints, 20); assert.equal(checked.totalPoints, 99);
  assert.equal(checked.overMainCap, false); assert.equal(allocation.pointCost, 79);
  assert.deepEqual(allocation.totalEdgeKeys, result.winnerEdgeKeys);
  for (const edge of item.request.baseEdgeKeys) assert.ok(allocation.totalEdgeKeys.includes(edge));
  assert.deepEqual(result.changed, { added: [], removed: [] }); assert.equal(result.scoreGain, 0); assert.equal(result.pointSaving, 0);
});

test("both untouched weapon branches remain separately connected through eleven protected attachments", () => {
  assert.deepEqual(result.weaponCounts, [24, 24]); assert.equal(item.build.mainPointLimit, 123 - 24);
  assert.equal(item.request.weaponSets.allocations[1].length, 24); assert.equal(item.request.weaponSets.allocations[2].length, 24);
  assert.deepEqual(result.attachmentNodeIds, item.request.weaponSets.attachmentNodeIds); assert.equal(result.attachmentNodeIds.length, 11);
  for (const id of result.attachmentNodeIds) {
    assert.ok(result.winnerNodeIds.includes(id)); assert.ok(plan.input.protectedNodeIds.includes(id)); assert.ok(!plan.input.variableNodeIds.includes(id));
  }
  for (const id of item.build.weaponNodeIds) { assert.ok(!plan.input.variableNodeIds.includes(id)); assert.ok(!result.winnerNodeIds.includes(id)); }
  assert.deepEqual(result.winnerCheck.weaponOverlap, []); assert.deepEqual(result.winnerCheck.detachedWeaponNodes, []);
});

test("reviewed integer rewards and disjoint buckets reconstruct unchanged local cost and value", () => {
  const reviewed = reviewedRewards(plan.pair, graph, read("tools/research/exact-neighborhood-rewards.json"));
  assert.deepEqual(reviewed.nodes, plan.reviewedNodes); assert.deepEqual(reviewed.rewardUnits, plan.input.rewardUnits);
  assert.equal(new Set(reviewed.nodes.flatMap((n) => n.lines.map((line) => line.text))).size, 14);
  assert.deepEqual(result.before, pairAllocationParts(plan.pair, plan.pair.incumbentNodeIds, reviewed.rewardUnits));
  assert.deepEqual(result.after, pairAllocationParts(plan.pair, result.winnerNodeIds, reviewed.rewardUnits));
  assert.deepEqual(result.before, { left: { points: 7, scoreUnits: 0 }, right: { points: 4, scoreUnits: 315 }, shared: { points: 0, scoreUnits: 0 } });
  assert.deepEqual(result.before, result.after);
});

test("all prior evidence and production files, plus six frozen inputs, remain byte-identical", () => {
  const protectedFiles = read(`${root}/protected-before.json`), frozen = read(`${root}/frozen-inputs.json`);
  assert.equal(Object.keys(protectedFiles).length, 102); assert.equal(Object.keys(frozen).length, 6);
  for (const hashes of [protectedFiles, frozen, audit.fingerprints]) {
    for (const [path, hash] of Object.entries(hashes)) assert.equal(digest(readFileSync(path)), hash, path);
  }
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { pairedNeighborhoodPlan, pairAllocationParts, compileNeighborhood, enumerateNeighborhood, rawAllocation, digest, heldoutCases, auditHeldoutAllocation }
  = await tsImport("./exact-paired-test-context.ts", import.meta.url);
const root = "var/exact-paired-neighborhoods-20261108";
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const plan = json(`${root}/plan.json`), audit = json(`${root}/audit-v1/audit.json`);
const parent = json("var/exact-neighborhoods-20261108/plan.json");
const benchmark = json("var/weighted-holdout-20261108/benchmark-v1/benchmark.json");
const graph = json("data/tree-graph.json"), cases = heldoutCases(graph, benchmark.corpus);
const records = plan.pairs.map((pair) => json(`${root}/audit-v1/${pair.id}.json`));

test("the completed proof uses the frozen full-union plan and original source results", () => {
  assert.equal(audit.planSha256, digest(readFileSync(`${root}/plan.json`)));
  assert.equal(plan.parentPlanSha256, digest(readFileSync("var/exact-neighborhoods-20261108/plan.json")));
  assert.equal(plan.parentAuditSha256, digest(readFileSync("var/exact-neighborhoods-20261108/audit-v2/audit.json")));
  assert.deepEqual(pairedNeighborhoodPlan(parent.plans), { pairs: plan.pairs, excluded: plan.excluded });
  assert.deepEqual(audit.excluded, plan.excluded);
  assert.deepEqual(audit.results, records.map((r) => r.result));
  for (let i = 0; i < records.length; i += 1) assert.deepEqual(records[i].pair, plan.pairs[i]);
});

test("one global allowance funds the union and overlapping nodes are paid only once", () => {
  for (const { pair, input, result } of records) {
    const compiled = compileNeighborhood(input);
    const [a, b] = pair.sourceRegionIds.map((id) => parent.plans.find((p) => p.id === id));
    assert.equal(input.pointLimit, a.pointLimit); assert.equal(input.pointLimit, b.pointLimit);
    assert.equal(result.sharedVariableAllowance, input.pointLimit - compiled.fixedPaidPoints);
    assert.equal(compiled.fixedPaidPoints + result.exact.variablePoints, result.exact.totalPoints);
    assert.deepEqual(new Set(pair.variableNodeIds), new Set([...a.variableNodeIds, ...b.variableNodeIds]));
    const buckets = [...pair.leftOnlyNodeIds, ...pair.rightOnlyNodeIds, ...pair.sharedNodeIds];
    assert.equal(new Set(buckets).size, buckets.length); assert.deepEqual(new Set(buckets), new Set(pair.variableNodeIds));
    assert.deepEqual(pair.sharedNodeIds, pair.variableNodeIds.filter((id) => a.variableNodeIds.includes(id) && b.variableNodeIds.includes(id)));
    assert.ok(pair.variableNodeIds.length <= 20); assert.ok(pair.variableNodeIds.length + compiled.fixedComponents.length <= 30);
  }
  assert.equal(records.filter((r) => r.pair.sharedNodeIds.length === 7).length, 2);
});

test("primary replay agrees with the independent completed raw-graph certificates", () => {
  let total = 0, feasible = 0;
  for (const { input, result } of records) {
    const replay = enumerateNeighborhood(input), reference = result.reference;
    assert.deepEqual(replay, result.exact); assert.ok(reference);
    assert.equal(replay.status, "optimal"); assert.equal(replay.enumerated, 2 ** input.variableNodeIds.length);
    assert.equal(replay.enumerated, replay.stateCount); assert.equal(replay.enumerated, reference.enumerated);
    assert.equal(replay.scoreUnits, reference.scoreUnits); assert.equal(replay.variablePoints, reference.variablePoints);
    assert.deepEqual(replay.bestVariableNodeIds, reference.bestVariableNodeIds);
    assert.ok(reference.feasibleSubsets > 0); total += replay.enumerated; feasible += reference.feasibleSubsets;
  }
  assert.equal(total, 2359296); assert.equal(feasible, 495);
});

test("donor, recipient and shared buckets reconstruct exact scores without double counting", () => {
  for (const { pair, input, result } of records) {
    const rewards = Object.fromEntries(result.reviewedNodes.map((node) => {
      assert.ok(node.lines.every((line) => Number.isSafeInteger(line.units) && line.reason.length > 0));
      assert.equal(node.units, node.lines.reduce((sum, line) => sum + line.units, 0));
      return [node.id, node.units];
    }));
    assert.deepEqual(rewards, input.rewardUnits);
    assert.deepEqual(result.before, pairAllocationParts(pair, pair.incumbentNodeIds, rewards));
    assert.deepEqual(result.after, pairAllocationParts(pair, result.winnerNodeIds, rewards));
    for (const [parts, points, score] of [[result.before, result.exact.incumbentVariablePoints, result.exact.incumbentScoreUnits],
      [result.after, result.exact.variablePoints, result.exact.scoreUnits]]) {
      assert.equal(parts.left.points + parts.right.points + parts.shared.points, points);
      assert.equal(parts.left.scoreUnits + parts.right.scoreUnits + parts.shared.scoreUnits, score);
    }
    assert.equal(result.scoreGain, 0); assert.equal(result.pointSaving, 0);
    assert.deepEqual(result.changed, { added: [], removed: [] });
  }
});

test("whole winners preserve outside allocation, goals, committed edges and main caps", () => {
  for (const { pair, input, result } of records) {
    const item = cases.find((c) => c.key === pair.case), variables = new Set(pair.variableNodeIds);
    const request = { ...item.request, mode: "shortest", totalPointLimit: pair.pointLimit };
    const selected = new Set(result.winnerNodeIds), reserved = new Set(item.build.weaponNodeIds);
    for (const id of pair.incumbentNodeIds) if (!variables.has(id)) assert.ok(selected.has(id));
    for (const id of selected) assert.ok(variables.has(id) || pair.incumbentNodeIds.includes(id));
    for (const id of pair.protectedNodeIds) { assert.ok(selected.has(id)); assert.ok(!variables.has(id)); }
    for (const id of variables) { assert.ok(!reserved.has(id)); assert.ok(request.graph.nodes[id]); }
    assert.equal(input.pointLimit, Math.min(pair.mainPointLimit, item.build.mainPointLimit));
    const allocation = rawAllocation(request, result.winnerNodeIds), checked = auditHeldoutAllocation(request, allocation, item.build);
    assert.deepEqual(checked, result.winnerCheck); assert.equal(checked.totalPoints, selected.size - 1);
    assert.equal(checked.overMainCap, false); assert.deepEqual(checked.weaponOverlap, []); assert.deepEqual(checked.detachedWeaponNodes, []);
    assert.deepEqual(allocation.totalEdgeKeys, result.winnerEdgeKeys);
    for (const edge of request.baseEdgeKeys) assert.ok(allocation.totalEdgeKeys.includes(edge));
  }
});

test("oversized real weapon-set pairs remain excluded rather than misreported as tested", () => {
  assert.equal(plan.pairs.length, 5); assert.equal(plan.excluded.length, 5);
  const weaponPairs = plan.excluded.filter((p) => p.case.startsWith("warbringer-partial/"));
  assert.deepEqual(weaponPairs.map((p) => p.variableCount), [28, 22, 27]);
  assert.ok(!audit.results.some((r) => r.case.startsWith("warbringer-partial/")));
  assert.ok(plan.excluded.every((p) => p.variableCount > 20 && p.reason.includes("no clipping")));
  assert.equal(parent.unavailable.length, 1); assert.equal(parent.unavailable[0].family, "chaos-dot");
});

test("earlier evidence, production code and all frozen paired inputs remain byte-identical", () => {
  const protectedFiles = json(`${root}/protected-before.json`), frozenInputs = json(`${root}/frozen-inputs.json`);
  assert.equal(Object.keys(protectedFiles).length, 82); assert.equal(Object.keys(frozenInputs).length, 4);
  for (const source of [audit.fingerprints, protectedFiles, frozenInputs]) {
    for (const [path, hash] of Object.entries(source)) assert.equal(digest(readFileSync(path)), hash, path);
  }
});

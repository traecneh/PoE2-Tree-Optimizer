import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { selectBranchCompleteDomain, enumerateStreamingNeighborhood, enumerateNeighborhood, rawNeighborhoodReference,
  rawAllocation, auditHeldoutAllocation, heldoutCases, reviewedRewards, loadBranchReview, digest }
  = await tsImport("./branch-complete-test-context.ts", import.meta.url);
const root = "var/exact-branch-complete-20261108", read = (path) => JSON.parse(readFileSync(path, "utf8"));
const plan = read(`${root}/plan.json`), audit = read(`${root}/audit-v1/audit.json`), graph = read("data/tree-graph.json");
const benchmark = read("var/weighted-holdout-20261108/benchmark-v1/benchmark.json"), cases = heldoutCases(graph, benchmark.corpus);
const records = audit.results.map((r) => read(`${root}/audit-v1/${r.id}.json`));
// Repeated raw edge scans, not the selector's adjacency walks.
function reached(seeds, allowed, edges) {
  const seen = new Set(seeds.filter((id) => allowed.has(id))); let changed = true;
  while (changed) { changed = false; for (const [a, b] of edges) {
    if (!allowed.has(a) || !allowed.has(b)) continue;
    if (seen.has(a) && !seen.has(b)) { seen.add(b); changed = true; }
    if (seen.has(b) && !seen.has(a)) { seen.add(a); changed = true; }
  } }
  return seen;
}

test("the topology-only frozen domains and all source data reproduce exactly", () => {
  assert.equal(audit.planSha256, digest(readFileSync(`${root}/plan.json`)));
  for (const [path, hash] of Object.entries(plan.sourceHashes)) assert.equal(digest(readFileSync(path)), hash, path);
  assert.deepEqual(audit.results, records.map((r) => r.result)); assert.equal(plan.entries.length, 4); assert.deepEqual(audit.unavailable, []);
  for (const { entry, input } of records) {
    assert.deepEqual(entry, plan.entries.find((e) => e.id === entry.id)); assert.deepEqual(selectBranchCompleteDomain(entry.topology), entry.selection);
    const item = cases.find((c) => c.key === entry.case), selected = new Set(entry.topology.incumbentNodeIds);
    const row = benchmark.results.find((r) => r.case === entry.case && r.arm === "current" && r.seed === 1701 && r.limitMs === (entry.family === "warbringer-partial" ? 2000 : 60000));
    assert.deepEqual(input.incumbentNodeIds, row.selectedNodeIds); assert.deepEqual(input.nodeIds, Object.keys(item.request.graph.nodes));
    assert.deepEqual(input.edges, item.request.graph.edges.map((e) => [e.from, e.to]));
    assert.equal(input.pointLimit, Math.min(row.mainPointLimit, row.basePoints + row.pointBudget));
    assert.ok(entry.topology.eligibleNodeIds.every((id) => { const f = item.request.graph.nodes[id].flags;
      return !item.build.weaponNodeIds.includes(id) && !f.classStart && !f.ascendancy && !f.mastery && (!f.keystone || selected.has(id)); }));
  }
});

test("independent edge scans prove complete donor descendants and whole eligible recipient components", () => {
  for (const { entry, input } of records) {
    const d = entry.selection.domain, selected = new Set(input.incumbentNodeIds), movable = new Set(entry.topology.eligibleNodeIds);
    const withoutAnchor = new Set([...selected].filter((id) => id !== d.donorAnchorNodeId));
    assert.deepEqual(reached([d.donorNodeIds[0]], withoutAnchor, input.edges), new Set(d.donorNodeIds));
    const off = new Set([...movable].filter((id) => !selected.has(id)));
    assert.deepEqual(reached([d.recipientNodeIds[0]], off, input.edges), new Set(d.recipientNodeIds));
    const donors = new Set(d.donorNodeIds), boundary = new Set();
    for (const [a, b] of input.edges) {
      if (donors.has(a) && selected.has(b) && !donors.has(b)) boundary.add(b);
      if (donors.has(b) && selected.has(a) && !donors.has(a)) boundary.add(a);
    }
    assert.deepEqual(boundary, new Set([d.donorAnchorNodeId]));
    assert.equal(new Set(d.variableNodeIds).size, d.donorNodeIds.length + d.recipientNodeIds.length);
    for (const id of input.protectedNodeIds) assert.ok(!d.variableNodeIds.includes(id));
  }
});

test("all twelve independent transfer witnesses stay connected at the full original point budget", () => {
  let count = 0;
  for (const { entry, input, result } of records) {
    const d = entry.selection.domain, variables = new Set(d.variableNodeIds), fixed = input.incumbentNodeIds.filter((id) => !variables.has(id));
    const splits = new Set();
    for (const witness of d.witnesses) {
      const allocation = new Set([...fixed, ...witness.selectedVariableNodeIds]);
      assert.equal(allocation.size - 1, input.pointLimit); assert.deepEqual(reached([input.rootNodeId], allocation, input.edges), allocation);
      assert.equal(witness.donorPoints + witness.recipientPoints, d.donorNodeIds.length);
      assert.equal(witness.selectedVariableNodeIds.filter((id) => d.donorNodeIds.includes(id)).length, witness.donorPoints);
      assert.equal(witness.selectedVariableNodeIds.filter((id) => d.recipientNodeIds.includes(id)).length, witness.recipientPoints);
      for (const id of input.protectedNodeIds) assert.ok(allocation.has(id));
      splits.add(`${witness.donorPoints}/${witness.recipientPoints}`); count += 1;
    }
    assert.equal(splits.size, 3); assert.deepEqual(d.witnesses.map((w) => w.recipientPoints), [0, 1, 2]);
    assert.ok(result.witnessChecks.every((w) => !w.check.overMainCap && !w.check.weaponOverlap.length && !w.check.detachedWeaponNodes.length));
  }
  assert.equal(count, 12);
});

test("all exact winners agree with old contracted and raw oracles over their complete domains", () => {
  let states = 0, feasible = 0;
  for (const { input, result } of records) {
    const current = enumerateStreamingNeighborhood(input), old = enumerateNeighborhood(input), raw = rawNeighborhoodReference(input);
    assert.deepEqual(current, result.primary); assert.equal(result.status, "optimal"); assert.equal(result.verified, true);
    for (const expected of [old, raw, result.reference]) {
      assert.equal(expected.scoreUnits, current.scoreUnits); assert.equal(expected.variablePoints, current.variablePoints);
      assert.deepEqual(expected.bestVariableNodeIds, current.bestVariableNodeIds); assert.equal(expected.enumerated, 2 ** input.variableNodeIds.length);
    }
    assert.equal(current.enumerated, current.stateCount); assert.equal(result.reference.status, "optimal");
    states += current.enumerated; feasible += result.reference.feasibleSubsets;
  }
  assert.equal(states, 672); assert.equal(feasible, 36); assert.deepEqual(records.map((r) => r.result.reference.feasibleSubsets), [14, 6, 10, 6]);
});

test("literal rewards were reviewed against the frozen plan and no selected profile changed", () => {
  const reviewInput = read(`${root}/review-input.json`), review = loadBranchReview();
  assert.equal(reviewInput.planSha256, audit.planSha256); assert.equal(reviewInput.stats.length, 19); assert.equal(reviewInput.unreviewed.length, 13);
  for (const { entry, input, reviewedNodes, result } of records) {
    const rewards = reviewedRewards({ family: entry.family, variableNodeIds: entry.selection.domain.variableNodeIds }, graph, review);
    assert.deepEqual(rewards.rewardUnits, input.rewardUnits); assert.deepEqual(rewards.nodes, reviewedNodes);
    assert.equal(result.before.donor.scoreUnits + result.before.recipient.scoreUnits, result.primary.incumbentScoreUnits);
    assert.equal(result.after.donor.scoreUnits + result.after.recipient.scoreUnits, result.primary.scoreUnits);
    assert.equal(result.after.donor.points + result.after.recipient.points, result.primary.variablePoints);
    assert.equal(result.scoreGain, 0); assert.equal(result.pointSaving, 0); assert.deepEqual(result.changed, { added: [], removed: [] });
  }
});

test("all reconstructed full winners retain committed edges, goals, caps and weapon attachments", () => {
  for (const { entry, input, result } of records) {
    const item = cases.find((c) => c.key === entry.case), request = { ...item.request, mode: "shortest", totalPointLimit: input.pointLimit };
    const route = rawAllocation(request, result.winnerNodeIds), checked = auditHeldoutAllocation(request, route, item.build);
    assert.deepEqual(checked, result.winnerCheck); assert.equal(checked.basePoints, 20); assert.equal(checked.totalPoints, input.pointLimit);
    assert.deepEqual(route.totalEdgeKeys, result.winnerEdgeKeys); assert.equal(checked.overMainCap, false);
    assert.deepEqual(checked.weaponOverlap, []); assert.deepEqual(checked.detachedWeaponNodes, []);
    for (const edge of request.baseEdgeKeys) assert.ok(route.totalEdgeKeys.includes(edge));
    for (const id of request.weaponSets?.attachmentNodeIds ?? []) { assert.ok(result.winnerNodeIds.includes(id)); assert.ok(!input.variableNodeIds.includes(id)); }
    const vars = new Set(input.variableNodeIds);
    for (const id of input.incumbentNodeIds) if (!vars.has(id)) assert.ok(result.winnerNodeIds.includes(id));
  }
  const weapon = cases.find((c) => c.key.startsWith("warbringer-partial/") && c.budget === "available");
  assert.equal(weapon.build.mainPointLimit, 99); assert.equal(weapon.build.weaponSets[1].length, 24); assert.equal(weapon.build.weaponSets[2].length, 24);
});

test("all structural rejections are retained and scored domains are not selected by objective", () => {
  assert.deepEqual(plan.entries.map((e) => e.selection.donorsConsidered), [4, 6, 12, 2]);
  assert.deepEqual(plan.entries.map((e) => e.selection.recipientsConsidered), [79, 68, 61, 51]);
  for (const entry of plan.entries) {
    assert.ok(entry.selection.rejected.length > 0); assert.equal(entry.selection.pairCandidates, 1);
    assert.equal(entry.selection.unavailable, null); assert.ok(entry.selection.rejected.every((r) => r.reason.length > 0));
    assert.ok(!Object.keys(entry.topology).some((key) => /reward|stat|name|preference|score/i.test(key)));
  }
});

test("136 earlier protected files, seven frozen inputs and both existing solver kernels are unchanged", () => {
  const protectedFiles = read(`${root}/protected-before.json`), frozen = read(`${root}/frozen-inputs.json`);
  assert.equal(Object.keys(protectedFiles).length, 136); assert.equal(Object.keys(frozen).length, 7);
  for (const hashes of [protectedFiles, frozen, audit.fingerprints]) for (const [path, hash] of Object.entries(hashes)) assert.equal(digest(readFileSync(path)), hash, path);
});

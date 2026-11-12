import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";
const { enumerateStreamingNeighborhood, fanoutInput, loadFanoutReview, reviewedRewards, heldoutCases, rawAllocation, auditHeldoutAllocation, digest }
  = await tsImport("./recipient-fanout-test-context.ts", import.meta.url);
const root = "var/exact-recipient-fanout-20261108", output = `${root}/audit-v1`, read = (path) => JSON.parse(readFileSync(path, "utf8"));
const plan = read(`${root}/plan.json`), parent = read(plan.parentPlanPath), audit = read(`${output}/audit.json`), shared = read(`${output}/shared-contexts.json`);
const rows = readFileSync(`${output}/results.jsonl`, "utf8").trim().split("\n").map((line) => JSON.parse(line));
const graph = read("data/tree-graph.json"), benchmark = read("var/weighted-holdout-20261108/benchmark-v1/benchmark.json"), cases = heldoutCases(graph, benchmark.corpus);
const numeric = (a, b) => Number(a) - Number(b);
const topologyCache = new Map(parent.entries.map((entry) => {
  const adjacency = new Map(entry.topology.nodeIds.map((id) => [id, new Set()]));
  for (const [a, b] of entry.topology.edges) { adjacency.get(a).add(b); adjacency.get(b).add(a); }
  return [entry.id, { entry, adjacency }];
}));
function walk(startIds, allowed, adjacency) {
  const reached = new Set(startIds.filter((id) => allowed.has(id))), queue = [...reached];
  for (let i = 0; i < queue.length; i += 1) for (const next of adjacency.get(queue[i])) if (allowed.has(next) && !reached.has(next)) { reached.add(next); queue.push(next); }
  return reached;
}

test("all 252 declared domains occur exactly once with no post-score filtering", () => {
  assert.equal(audit.planSha256, digest(readFileSync(`${root}/plan.json`))); assert.equal(shared.planSha256, audit.planSha256);
  assert.equal(shared.parentPlanSha256, digest(readFileSync(plan.parentPlanPath)));
  const expected = plan.entries.flatMap((entry) => entry.alternatives.domains.map((d) => `${entry.id}--recipient-${d.recipientNodeIds[0]}`));
  assert.equal(rows.length, 252); assert.equal(new Set(rows.map((r) => r.id)).size, 252); assert.deepEqual(rows.map((r) => r.id), expected);
  for (const [name, hash] of Object.entries(audit.resultFiles)) assert.equal(digest(readFileSync(`${output}/${name}`)), hash, name);
  assert.ok(rows.every((r) => !Object.hasOwn(r, "edges") && !Object.hasOwn(r, "nodeIds")));
});

test("independent component enumeration accounts for every bounded alternative and all 84 exclusions", () => {
  let all = 0, exclusions = 0;
  for (const entry of plan.entries) {
    const { entry: source, adjacency } = topologyCache.get(entry.id), selected = new Set(source.topology.incumbentNodeIds);
    const off = new Set(source.topology.eligibleNodeIds.filter((id) => !selected.has(id))), seen = new Set(), expected = [], rejected = [];
    const fixed = new Set(selected); for (const id of entry.donor.donorNodeIds) fixed.delete(id);
    for (const start of [...off].sort(numeric)) {
      if (seen.has(start)) continue;
      const component = [...walk([start], off, adjacency)].sort(numeric); component.forEach((id) => seen.add(id)); all += 1;
      const boundary = new Set(component.flatMap((id) => [...adjacency.get(id)].filter((n) => selected.has(n))));
      if (component.length >= 2 && component.length <= 8 && [...boundary].some((id) => fixed.has(id))) expected.push(component);
      else rejected.push(start);
    }
    assert.deepEqual(entry.alternatives.domains.map((d) => d.recipientNodeIds), expected);
    assert.deepEqual(entry.alternatives.rejected.map((r) => r.firstNodeId), rejected); exclusions += rejected.length;
  }
  assert.equal(all, 336); assert.equal(exclusions, 84);
});

test("all primary replays agree with their completed independent raw certificates", () => {
  let states = 0, feasible = 0;
  for (const row of rows) {
    const source = topologyCache.get(row.contextId).entry, entry = plan.entries.find((e) => e.id === row.contextId), context = shared.contexts.find((c) => c.id === row.contextId);
    const domain = entry.alternatives.domains.find((d) => d.recipientNodeIds[0] === row.recipientFirstNodeId);
    const input = fanoutInput(source.topology, domain, context.rewardUnits, context.baseEdgeKeys), replay = enumerateStreamingNeighborhood(input);
    assert.deepEqual(replay, row.primary); assert.equal(row.status, "optimal"); assert.equal(row.verified, true); assert.equal(row.reference.status, "optimal");
    assert.equal(replay.enumerated, 2 ** domain.variableNodeIds.length); assert.equal(row.reference.enumerated, replay.enumerated);
    assert.equal(row.reference.scoreUnits, replay.scoreUnits); assert.equal(row.reference.variablePoints, replay.variablePoints);
    assert.deepEqual(row.reference.bestVariableNodeIds, replay.bestVariableNodeIds);
    states += replay.enumerated; feasible += row.reference.feasibleSubsets;
  }
  assert.equal(states, 84192); assert.equal(feasible, 2765);
});

test("all 756 full-budget transfer witnesses remain connected and protect held nodes", () => {
  let witnesses = 0;
  for (const entry of plan.entries) {
    const { entry: source, adjacency } = topologyCache.get(entry.id), context = shared.contexts.find((c) => c.id === entry.id);
    for (const domain of entry.alternatives.domains) {
      const row = rows.find((r) => r.contextId === entry.id && r.recipientFirstNodeId === domain.recipientNodeIds[0]);
      assert.deepEqual(domain.donorNodeIds, entry.donor.donorNodeIds);
      assert.deepEqual(domain.witnesses.map((w) => w.recipientPoints), [0, 1, 2]);
      for (let i = 0; i < domain.witnesses.length; i += 1) {
        const witness = domain.witnesses[i], selected = new Set([...context.fixedNodeIds, ...witness.selectedVariableNodeIds]);
        assert.equal(selected.size - 1, source.topology.pointLimit); assert.deepEqual(walk([source.topology.rootNodeId], selected, adjacency), selected);
        for (const id of source.topology.protectedNodeIds) assert.ok(selected.has(id));
        assert.equal(witness.donorPoints + witness.recipientPoints, entry.donor.donorNodeIds.length);
        assert.equal(row.witnessChecks[i].check.totalPoints, source.topology.pointLimit);
        assert.ok(!row.witnessChecks[i].check.overMainCap && !row.witnessChecks[i].check.weaponOverlap.length && !row.witnessChecks[i].check.detachedWeaponNodes.length);
        witnesses += 1;
      }
    }
  }
  assert.equal(witnesses, 756);
});

test("shared literal rewards cover all 820 nodes and zero/negative cases were still fully audited", () => {
  const review = loadFanoutReview(), ids = new Set(); let positive = 0, zero = 0, negative = 0;
  for (const context of shared.contexts) {
    const variableNodeIds = Object.keys(context.rewardUnits), reviewed = reviewedRewards({ family: context.family, variableNodeIds }, graph, review);
    assert.deepEqual(reviewed.rewardUnits, context.rewardUnits);
    assert.deepEqual([...reviewed.nodes].sort((a, b) => numeric(a.id, b.id)), [...context.reviewedNodes].sort((a, b) => numeric(a.id, b.id)));
    variableNodeIds.forEach((id) => ids.add(id));
  }
  for (const row of rows) {
    const context = shared.contexts.find((c) => c.id === row.contextId), entry = plan.entries.find((e) => e.id === row.contextId);
    const domain = entry.alternatives.domains.find((d) => d.recipientNodeIds[0] === row.recipientFirstNodeId), rewards = domain.recipientNodeIds.map((id) => context.rewardUnits[id]);
    assert.equal(row.recipientPositive, rewards.some((n) => n > 0)); assert.equal(row.recipientAllZero, rewards.every((n) => n === 0));
    positive += Number(row.recipientPositive); zero += Number(row.recipientAllZero); negative += Number(!row.recipientPositive && !row.recipientAllZero);
  }
  assert.equal(ids.size, 820); assert.deepEqual([positive, zero, negative], [8, 243, 1]);
});

test("whole winners and caps are unchanged, including W1/W2 and eleven protected attachments", () => {
  for (const context of shared.contexts) {
    const source = topologyCache.get(context.id).entry, item = cases.find((c) => c.key === context.case), request = { ...item.request, mode: "shortest", totalPointLimit: source.topology.pointLimit };
    const route = rawAllocation(request, source.topology.incumbentNodeIds), checked = auditHeldoutAllocation(request, route, item.build);
    for (const row of rows.filter((r) => r.contextId === context.id)) {
      const selected = new Set([...context.fixedNodeIds, ...row.primary.bestVariableNodeIds]); assert.deepEqual(selected, new Set(source.topology.incumbentNodeIds));
      assert.deepEqual(row.winnerCheck, checked); assert.equal(row.scoreGain, 0); assert.equal(row.pointSaving, 0); assert.deepEqual(row.changed, { added: [], removed: [] });
    }
    if (context.family === "warbringer-partial") { assert.equal(checked.totalPoints, 99); assert.equal(request.weaponSets.attachmentNodeIds.length, 11);
      assert.deepEqual([item.build.weaponSets[1].length, item.build.weaponSets[2].length], [24, 24]); }
    else assert.equal(checked.totalPoints, 123);
  }
  assert.deepEqual(audit.counterexamples, []); assert.deepEqual(audit.counterexampleHashes, {});
});

test("summary counts and post-audit coverage-gap qualifications match the retained evidence", () => {
  assert.deepEqual(audit.contexts.map((c) => c.completed), [76, 64, 61, 51]);
  for (const summary of audit.contexts) {
    const subset = rows.filter((r) => r.contextId === summary.id); assert.equal(summary.planned, subset.length); assert.equal(summary.verified, subset.length);
    assert.equal(summary.states, subset.reduce((s, r) => s + r.primary.enumerated, 0)); assert.equal(summary.feasible, subset.reduce((s, r) => s + r.reference.feasibleSubsets, 0));
    assert.equal(summary.positiveRecipientDomains, subset.filter((r) => r.recipientPositive).length); assert.equal(summary.zeroRecipientDomains, subset.filter((r) => r.recipientAllZero).length);
  }
  const gap = read(`${root}/coverage-gap.json`); assert.equal(gap.planSha256, audit.planSha256);
  assert.deepEqual(gap.contexts.map((c) => c.knownPositiveExcludedNodes), [19, 22, 11, 42]);
  assert.deepEqual(gap.contexts[2].byReason, { oversized: 10, singleton: 1 });
  assert.ok(gap.meaning.includes("Not complete node scores"));
});

test("156 protected files, seven frozen plan/review/tool inputs and both solver kernels remain identical", () => {
  const protectedFiles = read(`${root}/protected-before.json`), frozen = read(`${root}/frozen-inputs.json`);
  assert.equal(Object.keys(protectedFiles).length, 156); assert.equal(Object.keys(frozen).length, 7);
  for (const hashes of [protectedFiles, frozen, audit.fingerprints]) for (const [path, hash] of Object.entries(hashes)) assert.equal(digest(readFileSync(path)), hash, path);
});

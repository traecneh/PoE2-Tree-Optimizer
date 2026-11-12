import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { createNeighborhoodPlan, reviewedRewards, rawAllocation, rawNeighborhoodReference, digest, heldoutCases, auditHeldoutAllocation }
  = await tsImport("./exact-neighborhood-test-context.ts", import.meta.url);
const root = "var/exact-neighborhoods-20261108";
const graphText = readFileSync("data/tree-graph.json", "utf8"), graph = JSON.parse(graphText);
const benchmarkText = readFileSync("var/weighted-holdout-20261108/benchmark-v1/benchmark.json", "utf8"), benchmark = JSON.parse(benchmarkText);
const plan = JSON.parse(readFileSync(`${root}/plan.json`, "utf8")), audit = JSON.parse(readFileSync(`${root}/audit-v2/audit.json`, "utf8"));
const review = JSON.parse(readFileSync("tools/research/exact-neighborhood-rewards.json", "utf8"));
const cases = heldoutCases(graph, benchmark.corpus);

test("selection is reproducible, independent of reported score values and explicit about the unavailable slot", () => {
  assert.equal(plan.graphSha256, digest(graphText)); assert.equal(plan.benchmarkSha256, digest(benchmarkText));
  assert.deepEqual(createNeighborhoodPlan(graph, benchmark), { plans: plan.plans, unavailable: plan.unavailable });
  const changedScores = structuredClone(benchmark);
  for (const row of changedScores.results) if (row.checkpoint) row.checkpoint.score = -12345;
  assert.deepEqual(createNeighborhoodPlan(graph, changedScores), { plans: plan.plans, unavailable: plan.unavailable });
  assert.equal(plan.plans.length, 11); assert.equal(plan.unavailable.length, 1);
  assert.equal(plan.unavailable[0].family, "chaos-dot"); assert.equal(plan.unavailable[0].policy, "effect-frontier");
});

test("every domain keeps committed base nodes, goals and weapon attachments outside its variables", () => {
  for (const region of plan.plans) {
    const item = cases.find((c) => c.key === region.case), variables = new Set(region.variableNodeIds);
    assert.ok(variables.size >= 8 && variables.size <= 18);
    for (const id of [...item.request.baseNodeIds, ...item.request.goalNodeIds, ...(item.request.weaponSets?.attachmentNodeIds ?? [])]) assert.ok(!variables.has(id));
    for (const id of variables) {
      assert.ok(item.request.graph.nodes[id]); assert.ok(!item.build.weaponNodeIds.includes(id));
      assert.ok(!graph.nodes[id].flags.ascendancy && !graph.nodes[id].flags.classStart && !graph.nodes[id].flags.mastery);
    }
    assert.equal(region.pointLimit, item.build.mainPointLimit);
  }
});

test("all 46 literal stat lines are covered exactly once with documented scope decisions", () => {
  const input = JSON.parse(readFileSync(`${root}/review-input.json`, "utf8"));
  const texts = [...review.valued.map((r) => r.text), ...review.zeroGroups.flatMap((g) => g.texts)];
  assert.equal(input.stats.length, 46); assert.equal(new Set(texts).size, texts.length); assert.deepEqual(texts.sort(), [...input.stats].sort());
  for (const region of plan.plans) {
    const rewards = reviewedRewards(region, graph, review);
    assert.ok(rewards.nodes.every((n) => n.lines.every((l) => l.reason.length > 0 && Number.isSafeInteger(l.units))));
  }
});

test("unknown lines, duplicated reviews and unreviewed profiles block a comparable exact claim", () => {
  const region = plan.plans[0], id = region.variableNodeIds[0];
  const changedGraph = { ...graph, nodes: { ...graph.nodes, [id]: { ...graph.nodes[id], stats: ["Unreviewed imaginary damage mechanic"] } } };
  assert.throws(() => reviewedRewards(region, changedGraph, review), /Unreviewed/);
  const duplicate = structuredClone(review); duplicate.valued.push(duplicate.valued[0]);
  assert.throws(() => reviewedRewards(region, graph, duplicate), /Duplicate reward/);
  assert.throws(() => reviewedRewards({ ...region, family: "unknown-profile" }, graph, review));
});

test("literal rewards retain owner/scope differences and combined minion speed arithmetic", () => {
  const fake = { nodes: { minion: { name: "Minion", stats: ["Minions deal 10% increased Damage", "Minions have 5% increased Attack and Cast Speed"] },
    conditional: { name: "Conditional", stats: ["20% increased Armour if you have been Hit Recently"] }, chaos: { name: "Chaos", stats: ["7% increased Chaos Damage"] } } };
  assert.equal(reviewedRewards({ family: "spectres", variableNodeIds: ["minion"] }, fake, review).rewardUnits.minion, 320);
  assert.equal(reviewedRewards({ family: "wolfpack", variableNodeIds: ["minion"] }, fake, review).rewardUnits.minion, 60);
  assert.equal(reviewedRewards({ family: "warbringer-partial", variableNodeIds: ["conditional"] }, fake, review).rewardUnits.conditional, 0);
  assert.equal(reviewedRewards({ family: "chaos-dot", variableNodeIds: ["chaos"] }, fake, review).rewardUnits.chaos, 84);
});

test("raw full-allocation enumeration independently agrees on all 11 real-tree domains", () => {
  let total = 0;
  for (const region of plan.plans) {
    const record = JSON.parse(readFileSync(`${root}/audit-v2/${region.id}.json`, "utf8"));
    const reference = rawNeighborhoodReference(record.input), exact = record.result.exact;
    assert.equal(exact.status, "optimal"); assert.equal(exact.enumerated, exact.stateCount); assert.equal(exact.enumerated, reference.enumerated);
    assert.equal(exact.scoreUnits, reference.scoreUnits); assert.equal(exact.variablePoints, reference.variablePoints);
    assert.deepEqual(exact.bestVariableNodeIds, reference.bestVariableNodeIds); assert.ok(reference.feasibleSubsets > 0); total += exact.enumerated;
  }
  assert.equal(total, 161536);
});

test("all reconstructed winners preserve full allocations, caps, selected edges and weapon connections", () => {
  for (const result of audit.results) {
    const item = cases.find((c) => c.key === result.case);
    const request = { ...item.request, mode: "shortest", totalPointLimit: result.pointLimit };
    const allocation = rawAllocation(request, result.winnerNodeIds), checked = auditHeldoutAllocation(request, allocation, item.build);
    assert.equal(checked.overMainCap, false); assert.deepEqual(checked.weaponOverlap, []); assert.deepEqual(checked.detachedWeaponNodes, []);
    for (const edge of item.request.baseEdgeKeys) assert.ok(allocation.totalEdgeKeys.includes(edge));
    assert.equal(result.localScoreGain, 0); assert.equal(result.totalPointSaving, 0); assert.equal(result.ignoredSelfLinks, 1);
  }
});

test("source, plan and reward fingerprints match the completed proof artifacts", () => {
  for (const [path, expected] of Object.entries(audit.fingerprints)) assert.equal(digest(readFileSync(path)), expected, path);
  for (const [path, expected] of Object.entries(JSON.parse(readFileSync(`${root}/protected-before.json`, "utf8")))) assert.equal(digest(readFileSync(path)), expected, path);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { selectBranchCompleteDomain: select, enumerateStreamingNeighborhood, rawStreamingNeighborhoodReference, loadBranchReview, reviewedRewards }
  = await tsImport("./branch-complete-test-context.ts", import.meta.url);
const fixture = () => ({ nodeIds: ["0", "1", "10", "11", "20", "21"], rootNodeId: "0", edges: [["0", "1"], ["0", "10"], ["10", "11"], ["0", "20"], ["20", "21"]],
  incumbentNodeIds: ["0", "1", "10", "11"], protectedNodeIds: ["0", "1"], eligibleNodeIds: ["10", "11", "20", "21"], pointLimit: 3 });

test("complete branches provide three legal full-budget splits and a known six-to-ten improvement", () => {
  const input = fixture(), chosen = select(input); assert.ok(chosen.domain);
  assert.deepEqual(chosen.domain.donorNodeIds, ["10", "11"]); assert.deepEqual(chosen.domain.recipientNodeIds, ["20", "21"]);
  assert.deepEqual(chosen.domain.witnesses.map((w) => [w.donorPoints, w.recipientPoints]), [[2, 0], [1, 1], [0, 2]]);
  const exactInput = { ...input, variableNodeIds: chosen.domain.variableNodeIds, committedEdges: [["0", "1"]], rewardUnits: { "10": 2, "11": 4, "20": 2, "21": 8 } };
  const actual = enumerateStreamingNeighborhood(exactInput), reference = rawStreamingNeighborhoodReference(exactInput);
  assert.equal(actual.incumbentScoreUnits, 6); assert.equal(actual.scoreUnits, 10); assert.equal(actual.totalPoints, 3); assert.deepEqual(actual.bestVariableNodeIds, ["20", "21"]);
  assert.equal(reference.scoreUnits, actual.scoreUnits); assert.deepEqual(reference.bestVariableNodeIds, actual.bestVariableNodeIds);
});

test("selection includes all selected descendants of its donor cut", () => {
  const input = fixture(); input.nodeIds.push("12"); input.edges.push(["11", "12"]); input.incumbentNodeIds.push("12"); input.eligibleNodeIds.push("12"); input.pointLimit = 4;
  const result = select(input); assert.equal(result.domain.donorAnchorNodeId, "0"); assert.deepEqual(result.domain.donorNodeIds, ["10", "11", "12"]);
});

test("a protected goal or weapon attachment inside the branch prevents trimming around it", () => {
  const input = fixture(); input.protectedNodeIds.push("11");
  const result = select(input); assert.equal(result.domain, null); assert.ok(result.rejected.some((r) => r.reason.includes("protected")));
});

test("complete recipient components above the size bound are rejected rather than clipped", () => {
  const input = fixture();
  for (let id = 22; id <= 28; id += 1) { input.nodeIds.push(String(id)); input.eligibleNodeIds.push(String(id)); input.edges.push([String(id - 1), String(id)]); }
  const result = select(input); assert.equal(result.domain, null); assert.ok(result.rejected.some((r) => r.kind === "recipient" && r.size === 9 && r.reason.includes("not clipped")));
});

test("a recipient attached only through the removable donor cannot qualify", () => {
  const input = fixture(); input.edges = input.edges.map(([a, b]) => a === "0" && b === "20" ? ["11", "20"] : [a, b]);
  const result = select(input); assert.equal(result.domain, null); assert.ok(result.rejected.some((r) => r.reason.includes("entirely on the removable donor")));
});

test("selection is deterministic under node/edge permutations and does not read rewards or stat text", () => {
  const input = fixture(), before = JSON.stringify(input), expected = select(input);
  const reversed = structuredClone(input); reversed.nodeIds.reverse(); reversed.edges.reverse(); reversed.incumbentNodeIds.reverse(); reversed.eligibleNodeIds.reverse(); reversed.protectedNodeIds.reverse();
  Object.defineProperty(reversed, "rewards", { get() { throw new Error("Reward access"); } }); Object.defineProperty(reversed, "stats", { get() { throw new Error("Stat access"); } });
  assert.deepEqual(select(reversed), expected); assert.equal(JSON.stringify(input), before);
});

test("duplicate/self links are neutral and malformed inputs fail before selection", () => {
  const input = fixture(), expected = select(input); input.edges.push(["0", "0"], ["0", "10"]); assert.deepEqual(select(input), expected);
  for (const mutate of [(x) => x.nodeIds.push("0"), (x) => x.edges.push(["0", "missing"]), (x) => { x.pointLimit = 4; },
    (x) => { x.edges = [["0", "1"]]; }, (x) => { x.protectedNodeIds.push("21"); }]) {
    const changed = fixture(); mutate(changed); assert.throws(() => select(changed));
  }
});

test("candidate resource limits report unavailable instead of an incomplete qualified domain", () => {
  const input = fixture(); input.edges = input.edges.filter(([a, b]) => b !== "20"); input.edges.push(["11", "20"]);
  for (let i = 1; i < 260; i += 1) {
    const a = String(1000 + i * 2), b = String(1001 + i * 2); input.nodeIds.push(a, b); input.eligibleNodeIds.push(a, b); input.edges.push(["11", a], [a, b]);
  }
  const result = select(input); assert.equal(result.domain, null); assert.equal(result.pairCandidates, 256); assert.ok(result.unavailable.includes("bound"));
});

test("frozen real selection is reproducible without any score or reward fields", () => {
  const plan = JSON.parse(readFileSync("var/exact-branch-complete-20261108/plan.json", "utf8"));
  assert.equal(plan.entries.length, 4);
  for (const entry of plan.entries) {
    assert.deepEqual(select(entry.topology), entry.selection); assert.ok(entry.selection.domain);
    assert.deepEqual(Object.keys(entry.topology).sort(), ["nodeIds", "edges", "rootNodeId", "incumbentNodeIds", "protectedNodeIds", "eligibleNodeIds", "pointLimit"].sort());
    assert.equal(entry.selection.domain.witnesses.length, 3);
  }
});

test("every new stat line has one explicit review and unknown lines still block comparison", () => {
  const input = JSON.parse(readFileSync("var/exact-branch-complete-20261108/review-input.json", "utf8")), review = loadBranchReview();
  assert.equal(input.stats.length, 19); assert.equal(input.unreviewed.length, 13);
  const lines = [...review.valued.map((r) => r.text), ...review.zeroGroups.flatMap((g) => g.texts)];
  assert.equal(new Set(lines).size, lines.length); assert.ok(input.stats.every((line) => lines.includes(line)));
  const fakeGraph = { nodes: { armour: { name: "Armour", stats: ["12% increased Armour"] }, conditional: { name: "Conditional", stats: ["Defend with 120% of Armour while not on Low Energy Shield"] } } };
  assert.equal(reviewedRewards({ family: "warbringer-partial", variableNodeIds: ["armour"] }, fakeGraph, review).rewardUnits.armour, 60);
  assert.equal(reviewedRewards({ family: "spectres", variableNodeIds: ["armour"] }, fakeGraph, review).rewardUnits.armour, 0);
  assert.equal(reviewedRewards({ family: "warbringer-partial", variableNodeIds: ["conditional"] }, fakeGraph, review).rewardUnits.conditional, 0);
  fakeGraph.nodes.armour.stats = ["Unreviewed branch effect"];
  assert.throws(() => reviewedRewards({ family: "warbringer-partial", variableNodeIds: ["armour"] }, fakeGraph, review), /Unreviewed/);
});

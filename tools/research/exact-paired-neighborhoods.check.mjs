import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { pairedNeighborhoodPlan, pairAllocationParts, compileNeighborhood, enumerateNeighborhood, rawNeighborhoodReference }
  = await tsImport("./exact-paired-test-context.ts", import.meta.url);

function region(id, variables, input, extra = {}) {
  return { id, case: "fixture/offence/prefix/available", policy: id, family: "fixture", centerNodeId: variables[0], radius: 2,
    variableNodeIds: variables, incumbentNodeIds: input.incumbentNodeIds, incumbentEdgeKeys: [], protectedNodeIds: input.protectedNodeIds,
    baseEdgeKeys: [], rootNodeId: input.rootNodeId, pointLimit: input.pointLimit, mainPointLimit: input.pointLimit, ...extra };
}

test("a joint allowance permits a sacrifice that neither single-area optimum can make", () => {
  const input = { nodeIds: ["root", "goal", "weak", "b0", "b1"], rootNodeId: "root", edges: [["root", "goal"], ["root", "weak"], ["root", "b0"], ["b0", "b1"]],
    incumbentNodeIds: ["root", "goal", "weak", "b0"], protectedNodeIds: ["root", "goal"], committedEdges: [], pointLimit: 3, rewardUnits: { weak: 4, b0: 2, b1: 8 } };
  const a = region("left", ["weak"], input), b = region("right", ["b0", "b1"], input), { pairs } = pairedNeighborhoodPlan([a, b]);
  const left = enumerateNeighborhood({ ...input, variableNodeIds: a.variableNodeIds }), right = enumerateNeighborhood({ ...input, variableNodeIds: b.variableNodeIds });
  assert.equal(left.scoreUnits, 4); assert.equal(left.incumbentScoreUnits, 4); assert.equal(right.scoreUnits, 2); assert.equal(right.incumbentScoreUnits, 2);
  const jointInput = { ...input, variableNodeIds: pairs[0].variableNodeIds }, joint = enumerateNeighborhood(jointInput), reference = rawNeighborhoodReference(jointInput);
  assert.equal(joint.incumbentScoreUnits, 6); assert.equal(joint.scoreUnits, 10); assert.equal(joint.totalPoints, 3); assert.equal(reference.scoreUnits, 10);
  assert.deepEqual(new Set(joint.bestVariableNodeIds), new Set(["b0", "b1"]));
  const before = pairAllocationParts(pairs[0], input.incumbentNodeIds, input.rewardUnits), after = pairAllocationParts(pairs[0], joint.bestVariableNodeIds, input.rewardUnits);
  assert.deepEqual(before, { left: { points: 1, scoreUnits: 4 }, right: { points: 1, scoreUnits: 2 }, shared: { points: 0, scoreUnits: 0 } });
  assert.deepEqual(after, { left: { points: 0, scoreUnits: 0 }, right: { points: 2, scoreUnits: 10 }, shared: { points: 0, scoreUnits: 0 } });
});

test("overlapping areas count each node, reward and point allowance only once", () => {
  const input = { nodeIds: ["root", "goal", "shared", "a", "b"], rootNodeId: "root", edges: [["root", "goal"], ["root", "shared"], ["shared", "a"], ["shared", "b"]],
    incumbentNodeIds: ["root", "goal", "shared", "a"], protectedNodeIds: ["root", "goal"], committedEdges: [], pointLimit: 3, rewardUnits: { shared: 5, a: 1, b: 3 } };
  const a = region("left", ["shared", "a"], input), b = region("right", ["shared", "b"], input), pair = pairedNeighborhoodPlan([a, b]).pairs[0];
  assert.equal(pair.variableNodeIds.length, 3); assert.deepEqual(pair.sharedNodeIds, ["shared"]);
  const jointInput = { ...input, variableNodeIds: pair.variableNodeIds }, compiled = compileNeighborhood(jointInput), exact = enumerateNeighborhood(jointInput);
  assert.equal(compiled.maxVariablePoints, 2); assert.equal(exact.incumbentScoreUnits, 6); assert.equal(exact.scoreUnits, 8);
  const parts = pairAllocationParts(pair, exact.bestVariableNodeIds, input.rewardUnits);
  assert.equal(parts.shared.points, 1); assert.equal(parts.shared.scoreUnits, 5); assert.equal(parts.left.points + parts.right.points + parts.shared.points, 2);
  assert.equal(parts.left.scoreUnits + parts.right.scoreUnits + parts.shared.scoreUnits, exact.scoreUnits);
  input.pointLimit = 4; assert.equal(compileNeighborhood({ ...input, variableNodeIds: pair.variableNodeIds }).maxVariablePoints, 3);
});

test("full-union size, not the sum of area sizes, determines eligibility", () => {
  const input = { rootNodeId: "root", incumbentNodeIds: ["root"], protectedNodeIds: ["root"], pointLimit: 20 };
  const a = region("left", Array.from({ length: 14 }, (_, i) => `n${i}`), input);
  const b = region("right", Array.from({ length: 14 }, (_, i) => `n${i + 6}`), input);
  const result = pairedNeighborhoodPlan([a, b]); assert.equal(result.pairs.length, 1); assert.equal(result.pairs[0].variableNodeIds.length, 20); assert.equal(result.pairs[0].sharedNodeIds.length, 8);
  b.variableNodeIds.push("n20"); const tooLarge = pairedNeighborhoodPlan([a, b]);
  assert.equal(tooLarge.pairs.length, 0); assert.equal(tooLarge.excluded[0].variableCount, 21); assert.equal(b.variableNodeIds.length, 15);
});

test("pairing rejects incompatible roots, caps, goals, committed edges and source allocations", () => {
  const input = { rootNodeId: "root", incumbentNodeIds: ["root", "a"], protectedNodeIds: ["root"], pointLimit: 3 };
  for (const override of [{ rootNodeId: "other" }, { pointLimit: 4 }, { protectedNodeIds: ["root", "goal"] }, { baseEdgeKeys: ["a::root"] }, { incumbentNodeIds: ["root"] }, { family: "other" }]) {
    assert.throws(() => pairedNeighborhoodPlan([region("left", ["a"], input), region("right", ["b"], input, override)]), /context differs/);
  }
  const a = region("left", ["a"], input), b = region("right", ["b"], input, { case: "other-case" });
  assert.deepEqual(pairedNeighborhoodPlan([a, b]), { pairs: [], excluded: [] });
});

test("protected attachments and committed base-edge endpoints cannot become paired variables", () => {
  const input = { nodeIds: ["root", "anchor", "a", "b"], rootNodeId: "root", edges: [["root", "anchor"], ["anchor", "a"], ["anchor", "b"]],
    incumbentNodeIds: ["root", "anchor", "a"], protectedNodeIds: ["root", "anchor"], committedEdges: [["root", "anchor"]], pointLimit: 3, rewardUnits: { anchor: 1, a: 2, b: 3 } };
  const pair = pairedNeighborhoodPlan([region("left", ["anchor", "a"], input), region("right", ["b"], input)]).pairs[0];
  assert.throws(() => enumerateNeighborhood({ ...input, variableNodeIds: pair.variableNodeIds }), /fixed/);
});

test("pair planning is immutable, deterministic and refuses duplicate source regions", () => {
  const input = { rootNodeId: "root", incumbentNodeIds: ["root", "a"], protectedNodeIds: ["root"], pointLimit: 3 };
  const regions = [region("left", ["a", "c"], input), region("right", ["c", "b"], input)], before = JSON.stringify(regions);
  assert.deepEqual(pairedNeighborhoodPlan(regions), pairedNeighborhoodPlan(regions)); assert.equal(JSON.stringify(regions), before);
  assert.throws(() => pairedNeighborhoodPlan([regions[0], regions[0]]), /Duplicate source/);
});

test("frozen real plan accounts for all ten same-case pairs without clipping", () => {
  const parent = JSON.parse(readFileSync("var/exact-neighborhoods-20261108/plan.json", "utf8"));
  const plan = JSON.parse(readFileSync("var/exact-paired-neighborhoods-20261108/plan.json", "utf8"));
  assert.deepEqual(pairedNeighborhoodPlan(parent.plans), { pairs: plan.pairs, excluded: plan.excluded });
  assert.equal(plan.pairs.length, 5); assert.equal(plan.excluded.length, 5);
  for (const pair of plan.pairs) {
    const [a, b] = pair.sourceRegionIds.map((id) => parent.plans.find((p) => p.id === id));
    assert.deepEqual(new Set(pair.variableNodeIds), new Set([...a.variableNodeIds, ...b.variableNodeIds]));
    assert.equal(pair.pointLimit, a.pointLimit); assert.equal(pair.pointLimit, b.pointLimit);
  }
  assert.equal(plan.excluded.filter((p) => p.case.startsWith("warbringer-partial/")).length, 3);
  assert.ok(plan.excluded.every((p) => p.variableCount > 20));
});

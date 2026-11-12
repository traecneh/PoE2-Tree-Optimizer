import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { excludedMinionPairs } = await tsImport("./exact-minion-pairs-test-context.ts", import.meta.url);
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const parent = read("var/exact-neighborhoods-20261108/plan.json"), prior = read("var/exact-paired-neighborhoods-20261108/plan.json");

test("selects exactly the two predeclared full 21-node unions without changing source plans", () => {
  const before = JSON.stringify({ parent, prior }), result = excludedMinionPairs(parent, prior);
  assert.deepEqual(result.map((p) => p.id), ["spectres-junction--travel", "wolfpack-junction--travel"]);
  assert.deepEqual(result, excludedMinionPairs(parent, prior)); assert.equal(JSON.stringify({ parent, prior }), before);
  for (const pair of result) {
    const [a, b] = pair.sourceRegionIds.map((id) => parent.plans.find((p) => p.id === id));
    assert.deepEqual(new Set(pair.variableNodeIds), new Set([...a.variableNodeIds, ...b.variableNodeIds]));
    assert.equal(pair.variableNodeIds.length, 21); assert.deepEqual(pair.sharedNodeIds, []);
    assert.equal(pair.pointLimit, 123); assert.equal(pair.pointLimit, a.pointLimit); assert.equal(pair.pointLimit, b.pointLimit);
  }
});

test("rejects missing or duplicate sources instead of silently changing the selected domains", () => {
  const missing = structuredClone(parent); missing.plans = missing.plans.filter((p) => p.id !== "spectres-junction");
  assert.throws(() => excludedMinionPairs(missing, prior), /Missing\/duplicate/);
  const duplicate = structuredClone(parent); duplicate.plans.push(duplicate.plans.find((p) => p.id === "wolfpack-travel"));
  assert.throws(() => excludedMinionPairs(duplicate, prior), /Missing\/duplicate/);
});

test("rejects incompatible roots, goals, budgets, committed edges and source allocations", () => {
  for (const override of [{ rootNodeId: "other" }, { protectedNodeIds: [] }, { pointLimit: 122 }, { mainPointLimit: 124 },
    { baseEdgeKeys: [] }, { incumbentNodeIds: [] }, { incumbentEdgeKeys: [] }, { family: "spectres" }, { case: "other-case" }]) {
    const changed = structuredClone(parent), target = changed.plans.find((p) => p.id === "wolfpack-travel"); Object.assign(target, override);
    assert.throws(() => excludedMinionPairs(changed, prior));
  }
});

test("rejects altered exclusion metadata, duplicate variables, larger domains and overlap", () => {
  const absent = structuredClone(prior); absent.excluded = absent.excluded.filter((p) => p.case.startsWith("warbringer"));
  assert.throws(() => excludedMinionPairs(parent, absent));
  for (const change of [(p) => { p.variableCount = 20; }, (p) => { p.sharedCount = 1; }, (p) => { p.case = "other"; }]) {
    const changed = structuredClone(prior); change(changed.excluded[0]); assert.throws(() => excludedMinionPairs(parent, changed));
  }
  for (const change of [(a, b) => b.variableNodeIds.push(b.variableNodeIds[0]), (a, b) => b.variableNodeIds.push("extra"),
    (a, b) => { b.variableNodeIds[0] = a.variableNodeIds[0]; }]) {
    const changed = structuredClone(parent), a = changed.plans.find((p) => p.id === "spectres-junction"), b = changed.plans.find((p) => p.id === "spectres-travel");
    change(a, b); assert.throws(() => excludedMinionPairs(changed, prior));
  }
});

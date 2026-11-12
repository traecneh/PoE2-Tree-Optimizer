import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { compileStreamingNeighborhood, enumerateStreamingNeighborhood: solve, rawStreamingNeighborhoodReference: reference,
  compileNeighborhood, enumerateNeighborhood, rawNeighborhoodReference }
  = await tsImport("./exact-streaming-test-context.ts", import.meta.url);
const diamond = () => ({ nodeIds: ["root", "goal", "a", "b"], rootNodeId: "root", edges: [["root", "a"], ["a", "goal"], ["root", "b"], ["b", "goal"]],
  incumbentNodeIds: ["root", "a", "goal"], variableNodeIds: ["a", "b"], protectedNodeIds: ["goal"], committedEdges: [], pointLimit: 2, rewardUnits: { a: 0, b: 10 } });
const sameWinner = (a, b) => {
  assert.equal(a.scoreUnits, b.scoreUnits); assert.equal(a.variablePoints, b.variablePoints); assert.deepEqual(a.bestVariableNodeIds, b.bestVariableNodeIds);
};
const star = (n) => {
  const variableNodeIds = Array.from({ length: n }, (_, i) => `v${i}`);
  return { nodeIds: ["root", ...variableNodeIds], rootNodeId: "root", edges: variableNodeIds.map((id) => ["root", id]),
    incumbentNodeIds: ["root"], variableNodeIds, protectedNodeIds: [], committedEdges: [], pointLimit: n,
    rewardUnits: Object.fromEntries(variableNodeIds.map((id) => [id, 1])) };
};

test("streaming finds the known better connector and agrees with both previous exact oracles", () => {
  const input = diamond(), result = solve(input);
  assert.equal(result.status, "optimal"); assert.equal(result.scoreUnits, 10); assert.equal(result.totalPoints, 2);
  assert.equal(result.enumerated, 4); assert.deepEqual(result.bestVariableNodeIds, ["b"]);
  for (const expected of [reference(input), enumerateNeighborhood(input), rawNeighborhoodReference(input)]) sameWinner(result, expected);
});

test("Gray-code traversal preserves lowest ordinary-mask tie breaking", () => {
  const input = diamond(); input.incumbentNodeIds = ["root", "b", "goal"]; input.rewardUnits = { a: 2, b: 2 };
  const result = solve(input); assert.deepEqual(result.bestVariableNodeIds, ["a"]); sameWinner(result, reference(input)); sameWinner(result, enumerateNeighborhood(input));
});

test("equal scores prefer fewer points and real incidental fixed-node links", () => {
  const input = diamond(); input.rewardUnits.b = 0; input.edges.push(["root", "goal"]);
  const result = solve(input); assert.deepEqual(result.bestVariableNodeIds, []); assert.equal(result.totalPoints, 1); sameWinner(result, reference(input));
});

test("shared-budget donor sacrifice funds a stronger connected recipient bundle", () => {
  const input = { nodeIds: ["root", "goal", "weak", "gate", "strong"], rootNodeId: "root", edges: [["root", "goal"], ["root", "weak"], ["root", "gate"], ["gate", "strong"]],
    incumbentNodeIds: ["root", "goal", "weak", "gate"], variableNodeIds: ["weak", "gate", "strong"], protectedNodeIds: ["goal"], committedEdges: [["root", "goal"]],
    pointLimit: 3, rewardUnits: { weak: 4, gate: 2, strong: 8 } };
  const result = solve(input); assert.equal(result.incumbentScoreUnits, 6); assert.equal(result.scoreUnits, 10); assert.equal(result.totalPoints, 3);
  assert.deepEqual(result.bestVariableNodeIds, ["gate", "strong"]); sameWinner(result, reference(input));
});

test("signed gateways are counted and disconnected reward islands never win", () => {
  const input = { nodeIds: ["root", "gate", "reward", "island"], rootNodeId: "root", edges: [["root", "gate"], ["gate", "reward"]], incumbentNodeIds: ["root"],
    variableNodeIds: ["gate", "reward", "island"], protectedNodeIds: [], committedEdges: [], pointLimit: 2, rewardUnits: { gate: -2, reward: 5, island: 100 } };
  assert.equal(solve(input).scoreUnits, 3); sameWinner(solve(input), reference(input));
  input.pointLimit = 1; assert.equal(solve(input).scoreUnits, 0); assert.deepEqual(solve(input).bestVariableNodeIds, []);
});

test("all held fixed components must remain connected", () => {
  const input = diamond(); input.nodeIds.push("held"); input.edges.push(["a", "held"]); input.incumbentNodeIds.push("held"); input.pointLimit = 3;
  const result = solve(input); assert.deepEqual(result.bestVariableNodeIds, ["a"]); sameWinner(result, reference(input));
});

test("outside unallocated nodes cannot become invisible connectors", () => {
  const input = diamond(); input.nodeIds.push("outside"); input.edges.push(["root", "outside"], ["outside", "goal"]); input.variableNodeIds = ["a"];
  assert.deepEqual(solve(input).bestVariableNodeIds, ["a"]); sameWinner(solve(input), reference(input));
});

test("explicit adjacency handles more than thirty disconnected fixed components", () => {
  const fixed = ["root", ...Array.from({ length: 60 }, (_, i) => `f${i}`)];
  const input = { nodeIds: [...fixed, "v"], rootNodeId: "root", edges: fixed.map((id) => [id, "v"]), incumbentNodeIds: [...fixed, "v"], variableNodeIds: ["v"],
    protectedNodeIds: fixed, committedEdges: [], pointLimit: 61, rewardUnits: { v: 0 } };
  assert.throws(() => compileNeighborhood(input), /bitset bound/);
  const result = solve(input); assert.equal(result.domainNodeCount, 62); assert.equal(result.totalPoints, 61); assert.deepEqual(result.bestVariableNodeIds, ["v"]);
  sameWinner(result, reference(input));
});

test("a complete 22-variable run retains no exponential subset arrays", () => {
  const result = solve(star(22));
  assert.equal(result.status, "optimal"); assert.equal(result.enumerated, 4194304); assert.equal(result.scoreUnits, 22); assert.equal(result.variablePoints, 22);
  assert.equal(result.retainedSubsetSlots, 0); assert.ok(result.typedArrayBytes < 2048);
  const small = solve(star(20), { maxStates: 1 }), large = solve(star(28), { maxStates: 1 });
  assert.ok(large.typedArrayBytes - small.typedArrayBytes < 1024); assert.equal(large.status, "limited");
});

test("state limits return limited rather than falsely certifying an optimum", () => {
  for (const runner of [solve, reference]) {
    const result = runner(diamond(), { maxStates: 3 }); assert.equal(result.status, "limited"); assert.equal(result.enumerated, 3);
    assert.equal(runner(diamond(), { maxStates: 4 }).status, "optimal");
    for (const maxStates of [0, -1, 0.5, NaN]) assert.throws(() => runner(diamond(), { maxStates }));
  }
});

test("both implementations support cancellation before and during enumeration", () => {
  for (const runner of [solve, reference]) {
    assert.equal(runner(star(15), { shouldStop: () => true }).enumerated, 0);
    let checks = 0; const result = runner(star(15), { shouldStop: () => ++checks === 2 });
    assert.equal(result.status, "cancelled"); assert.equal(result.enumerated, 4096); assert.ok(result.enumerated < result.stateCount);
  }
});

test("self-links and duplicate links are neutral; unknown endpoints are rejected", () => {
  const input = diamond(), original = solve(input); input.edges.push(["root", "root"], ["a", "a"], ["root", "a"]);
  assert.deepEqual(solve(input), original); sameWinner(solve(input), reference(input));
  input.edges.push(["root", "unknown"]); assert.throws(() => solve(input)); assert.throws(() => reference(input));
});

test("protected nodes and committed edges cannot be moved or invented", () => {
  for (const mutate of [(x) => x.protectedNodeIds.push("a"), (x) => x.committedEdges.push(["root", "a"]), (x) => x.committedEdges.push(["root", "goal"])]) {
    const input = diamond(); mutate(input); assert.throws(() => solve(input)); assert.throws(() => reference(input));
  }
});

test("invalid counts, unsafe rewards and disconnected incumbents fail before search", () => {
  for (const mutate of [(x) => x.variableNodeIds.push("a"), (x) => { x.rewardUnits.a = 0.5; }, (x) => { x.rewardUnits.a = Number.MAX_SAFE_INTEGER; },
    (x) => { delete x.rewardUnits.a; }, (x) => { x.pointLimit = 1; }, (x) => { x.edges = [["root", "a"]]; }, (x) => { x.pointLimit = NaN; }]) {
    const input = diamond(); mutate(input); assert.throws(() => solve(input)); assert.throws(() => reference(input));
  }
  assert.throws(() => solve(star(29)), /1..28/); assert.throws(() => reference(star(25)));
  const oversized = diamond(); oversized.nodeIds = Array(100001).fill("root"); assert.throws(() => solve(oversized), /resource bounds/);
});

test("one hundred signed cyclic graphs agree across four independent traversal implementations", () => {
  let seed = 12791; const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let sample = 0; sample < 100; sample += 1) {
    const n = 3 + Math.floor(random() * 6), input = star(n);
    input.nodeIds.push("goal"); input.edges.push(["v0", "goal"]); input.incumbentNodeIds.push("v0", "goal"); input.protectedNodeIds = ["goal"];
    input.pointLimit = 2 + Math.floor(random() * n);
    input.rewardUnits = Object.fromEntries(input.variableNodeIds.map((id) => [id, Math.floor(random() * 13) - 5]));
    for (let a = 0; a < input.nodeIds.length; a += 1) for (let b = a + 1; b < input.nodeIds.length; b += 1) if (random() < 0.25) input.edges.push([input.nodeIds[a], input.nodeIds[b]]);
    const before = JSON.stringify(input), result = solve(input);
    for (const expected of [reference(input), enumerateNeighborhood(input), rawNeighborhoodReference(input)]) sameWinner(result, expected);
    assert.equal(result.enumerated, 2 ** n); assert.equal(JSON.stringify(input), before);
  }
});

test("both offline kernels have no runtime production or other oracle imports", () => {
  for (const path of ["./exact-neighborhood-streaming.ts", "./exact-neighborhood-streaming-reference.ts"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8").replace(/^import type .*;\r?\n/gm, "");
    assert.ok(!/^\s*import\b/m.test(source)); assert.ok(!/\brequire\s*\(/.test(source));
  }
});

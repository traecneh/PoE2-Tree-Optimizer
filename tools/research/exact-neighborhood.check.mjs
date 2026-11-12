import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { compileNeighborhood, enumerateNeighborhood } = await tsImport("./exact-neighborhood.ts", import.meta.url);
const diamond = () => ({ nodeIds: ["root", "goal", "a", "b"], rootNodeId: "root", edges: [["root", "a"], ["a", "goal"], ["root", "b"], ["b", "goal"]],
  incumbentNodeIds: ["root", "a", "goal"], variableNodeIds: ["a", "b"], protectedNodeIds: ["root", "goal"], committedEdges: [], pointLimit: 2, rewardUnits: { a: 0, b: 10 } });

// Raw set construction and repeated edge scans, independent of contraction/bitsets.
function rawOracle(input) {
  const variables = new Set(input.variableNodeIds), fixed = input.incumbentNodeIds.filter((id) => !variables.has(id));
  let best = { scoreUnits: -Infinity, variablePoints: Infinity, mask: Infinity };
  for (let mask = 0; mask < 2 ** input.variableNodeIds.length; mask += 1) {
    const selected = new Set(fixed), chosen = input.variableNodeIds.filter((_, i) => mask & (1 << i));
    for (const id of chosen) selected.add(id);
    if (selected.size - 1 > input.pointLimit) continue;
    const reached = new Set([input.rootNodeId]); let changed = true;
    while (changed) { changed = false; for (const [a, b] of input.edges) {
      if (!selected.has(a) || !selected.has(b)) continue;
      if (reached.has(a) && !reached.has(b)) { reached.add(b); changed = true; }
      if (reached.has(b) && !reached.has(a)) { reached.add(a); changed = true; }
    } }
    if (reached.size !== selected.size) continue;
    const scoreUnits = chosen.reduce((sum, id) => sum + input.rewardUnits[id], 0);
    if (scoreUnits > best.scoreUnits || scoreUnits === best.scoreUnits && (chosen.length < best.variablePoints || chosen.length === best.variablePoints && mask < best.mask)) {
      best = { scoreUnits, variablePoints: chosen.length, mask };
    }
  }
  return { ...best, bestVariableNodeIds: input.variableNodeIds.filter((_, i) => best.mask & (1 << i)) };
}

test("finds a known missed-value connector and exhausts its entire finite domain", () => {
  const result = enumerateNeighborhood(diamond());
  assert.equal(result.status, "optimal"); assert.equal(result.scoreUnits, 10); assert.equal(result.incumbentScoreUnits, 0);
  assert.deepEqual(result.bestVariableNodeIds, ["b"]); assert.equal(result.variablePoints, 1); assert.equal(result.totalPoints, 2);
  assert.equal(result.enumerated, 4); assert.equal(result.enumerated, result.stateCount);
});

test("score ties prefer fewer paid points, including implicit raw fixed-node connections", () => {
  const input = diamond(); input.rewardUnits.b = 0; input.edges.push(["root", "goal"]);
  const result = enumerateNeighborhood(input);
  assert.deepEqual(result.bestVariableNodeIds, []); assert.equal(result.totalPoints, 1); assert.equal(result.scoreUnits, 0);
});

test("includes negative gateways, respects the remaining allowance and rejects reward islands", () => {
  const input = { nodeIds: ["root", "goal", "gate", "reward"], rootNodeId: "root", edges: [["root", "goal"], ["root", "gate"], ["gate", "reward"]],
    incumbentNodeIds: ["root", "goal"], variableNodeIds: ["gate", "reward"], protectedNodeIds: ["goal"], committedEdges: [["root", "goal"]], pointLimit: 3,
    rewardUnits: { gate: -2, reward: 5 } };
  assert.equal(enumerateNeighborhood(input).scoreUnits, 3);
  input.pointLimit = 2; assert.equal(enumerateNeighborhood(input).scoreUnits, 0);
  assert.deepEqual(enumerateNeighborhood(input).bestVariableNodeIds, []);
});

test("must reconnect every fixed component, not only root and requested goal", () => {
  const input = diamond(); input.nodeIds.push("held-leaf"); input.edges.push(["a", "held-leaf"]);
  input.incumbentNodeIds.push("held-leaf"); input.pointLimit = 3;
  const compiled = compileNeighborhood(input); assert.equal(compiled.fixedComponents.length, 3);
  assert.equal(enumerateNeighborhood(input).scoreUnits, 0); assert.deepEqual(enumerateNeighborhood(input).bestVariableNodeIds, ["a"]);
});

test("outside unallocated nodes cannot silently enlarge the exact domain", () => {
  const input = diamond(); input.nodeIds.push("outside"); input.edges.push(["root", "outside"], ["outside", "goal"]);
  input.variableNodeIds = ["a"]; delete input.rewardUnits.b;
  const result = enumerateNeighborhood(input); assert.deepEqual(result.bestVariableNodeIds, ["a"]); assert.equal(result.totalPoints, 2);
});

test("self-links and duplicate raw links are connectivity-neutral, but unknown endpoints are rejected", () => {
  const input = diamond(), original = enumerateNeighborhood(input);
  input.edges.push(["root", "root"], ["b", "b"], ["root", "b"]);
  assert.deepEqual(enumerateNeighborhood(input), original);
  input.edges.push(["root", "absent"]); assert.throws(() => enumerateNeighborhood(input), /Invalid raw edge/);
});

test("rejects variable protected/base nodes, missing or movable committed edges and unknown IDs", () => {
  const input = diamond(); input.protectedNodeIds.push("a"); assert.throws(() => compileNeighborhood(input), /fixed/);
  input.protectedNodeIds.pop(); input.committedEdges.push(["root", "a"]); assert.throws(() => compileNeighborhood(input), /Committed edge/);
  input.committedEdges = [["root", "goal"]]; assert.throws(() => compileNeighborhood(input), /Committed edge/);
  input.committedEdges = []; input.variableNodeIds.push("absent"); assert.throws(() => compileNeighborhood(input), /Unknown/);
});

test("rejects duplicate, non-integer, disconnected and over-budget inputs before enumeration", () => {
  const variants = [
    (x) => { x.variableNodeIds.push("a"); }, (x) => { x.pointLimit = NaN; }, (x) => { x.pointLimit = 1; },
    (x) => { x.rewardUnits.a = 0.25; }, (x) => { delete x.rewardUnits.b; }, (x) => { x.edges = [["root", "a"]]; },
  ];
  for (const mutate of variants) { const input = diamond(); mutate(input); assert.throws(() => enumerateNeighborhood(input)); }
});

test("enforces the 20-variable allocation bound and the 30-vertex bitset bound", () => {
  const input = diamond(); input.variableNodeIds = Array.from({ length: 21 }, (_, i) => `v${i}`);
  assert.throws(() => enumerateNeighborhood(input), /1..20/);
  const fixed = ["root", ...Array.from({ length: 10 }, (_, i) => `f${i}`)], variables = Array.from({ length: 20 }, (_, i) => `v${i}`);
  const large = { nodeIds: [...fixed, ...variables], rootNodeId: "root", incumbentNodeIds: [...fixed, "v0"], variableNodeIds: variables,
    protectedNodeIds: fixed, committedEdges: [], pointLimit: 30, edges: fixed.map((id) => [id, "v0"]), rewardUnits: Object.fromEntries(variables.map((id) => [id, 0])) };
  assert.throws(() => enumerateNeighborhood(large), /bitset bound/);
});

test("handles the highest permitted bit and all required fixed components", () => {
  const fixed = ["root", ...Array.from({ length: 28 }, (_, i) => `f${i}`)];
  const input = { nodeIds: [...fixed, "v"], rootNodeId: "root", incumbentNodeIds: [...fixed, "v"], variableNodeIds: ["v"],
    protectedNodeIds: fixed, committedEdges: [], pointLimit: 29, edges: fixed.map((id) => [id, "v"]), rewardUnits: { v: 0 } };
  const result = enumerateNeighborhood(input); assert.equal(result.status, "optimal"); assert.equal(result.totalPoints, 29); assert.deepEqual(result.bestVariableNodeIds, ["v"]);
});

test("completes the full supported 20-variable domain without exponential graph-sized storage", () => {
  const variables = Array.from({ length: 20 }, (_, i) => `v${i}`);
  const input = { nodeIds: ["root", ...variables], rootNodeId: "root", incumbentNodeIds: ["root"], variableNodeIds: variables,
    protectedNodeIds: [], committedEdges: [], pointLimit: 20, edges: variables.map((id) => ["root", id]), rewardUnits: Object.fromEntries(variables.map((id) => [id, 1])) };
  const result = enumerateNeighborhood(input);
  assert.equal(result.status, "optimal"); assert.equal(result.enumerated, 1048576); assert.equal(result.scoreUnits, 20); assert.equal(result.totalPoints, 20);
});

test("cancellation never labels a partly enumerated result exact", () => {
  const variables = Array.from({ length: 15 }, (_, i) => `v${i}`), input = { nodeIds: ["root", ...variables], rootNodeId: "root", incumbentNodeIds: ["root"],
    variableNodeIds: variables, protectedNodeIds: [], committedEdges: [], pointLimit: 15, edges: variables.map((id) => ["root", id]), rewardUnits: Object.fromEntries(variables.map((id) => [id, 1])) };
  let checks = 0; const result = enumerateNeighborhood(input, () => ++checks === 2);
  assert.equal(result.status, "cancelled"); assert.equal(result.enumerated, 4096); assert.ok(result.enumerated < result.stateCount);
  assert.equal(enumerateNeighborhood(input, () => true).enumerated, 0);
});

test("matches raw subset/edge scanning on 100 seeded cyclic graphs with signed rewards", () => {
  let seed = 1701; const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let sample = 0; sample < 100; sample += 1) {
    const n = 3 + Math.floor(random() * 6), variables = Array.from({ length: n }, (_, i) => `v${i}`), ids = ["root", "goal", ...variables];
    const edges = [["root", "v0"], ["v0", "goal"]];
    for (let a = 0; a < ids.length; a += 1) for (let b = a + 1; b < ids.length; b += 1) if (random() < 0.25) edges.push([ids[a], ids[b]]);
    const input = { nodeIds: ids, edges, rootNodeId: "root", incumbentNodeIds: ["root", "v0", "goal"], variableNodeIds: variables,
      protectedNodeIds: ["goal"], committedEdges: [], pointLimit: 2 + Math.floor(random() * n), rewardUnits: Object.fromEntries(variables.map((id) => [id, Math.floor(random() * 9) - 3])) };
    const before = JSON.stringify(input), actual = enumerateNeighborhood(input), expected = rawOracle(input);
    assert.equal(actual.scoreUnits, expected.scoreUnits); assert.equal(actual.variablePoints, expected.variablePoints);
    assert.deepEqual(actual.bestVariableNodeIds, expected.bestVariableNodeIds); assert.equal(actual.enumerated, 2 ** n); assert.equal(JSON.stringify(input), before);
  }
});

test("oracle has no runtime production imports", () => {
  const source = readFileSync(new URL("./exact-neighborhood.ts", import.meta.url), "utf8");
  assert.ok(!/^\s*import\b/m.test(source)); assert.ok(!/\brequire\s*\(/.test(source));
});

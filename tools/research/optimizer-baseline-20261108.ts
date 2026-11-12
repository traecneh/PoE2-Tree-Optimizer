// Research-only probes. Does not change the production solver or browser state.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { optimizeBuildGoals, optimizeBuildGoalsAnytime, type BuildGoalsOptimizeRequest, type BuildGoalsOptimizeResult } from "../../src/tree/buildGoalsOptimizer";
import { optimizeWeightedBuildGoals } from "../../src/tree/weightedBuildGoalsOptimizer";
import { isAllocatableTreeEdge } from "../../src/tree/pathAllocation";
import { filterVisibleTreeGraph } from "../../src/tree/treeVisibility";
import type { TreeGraph } from "../../src/tree/types";

const output = "var/github-research-20261108/benchmark.json";
type Edge = [string, string];
function graph(edges: Edge[], rewards: Record<string, number> = {}): TreeGraph {
  const ids = [...new Set(edges.flat())];
  return { schemaVersion: 1, gameVersion: "research-fixture", extractedAt: "2026-11-08", source: { kind: "fixture", path: "research-only" },
    nodes: Object.fromEntries(ids.map((id) => [id, { id, name: id, position: { x: 0, y: 0 },
      flags: { classStart: id === "s", small: id !== "s" }, stats: rewards[id] ? [`+${rewards[id] * 5} to Strength`] : [] }])),
    edges: edges.map(([from, to]) => ({ from, to })), groups: {}, classStarts: { fixture: "s" }, bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 } };
}
function adjacency(g: TreeGraph): Map<string, string[]> {
  const a = new Map(Object.keys(g.nodes).map((id) => [id, [] as string[]]));
  for (const e of g.edges) if (isAllocatableTreeEdge(g, e)) { a.get(e.from)!.push(e.to); a.get(e.to)!.push(e.from); }
  return a;
}
function path(a: Map<string, string[]>, sources: Set<string>, target: string): string[] | undefined {
  const queue = [...sources], previous = new Map(queue.map((id) => [id, undefined as string | undefined]));
  for (let head = 0; head < queue.length && !previous.has(target); head++) for (const next of a.get(queue[head]) ?? []) {
    if (!previous.has(next)) { previous.set(next, queue[head]); queue.push(next); }
  }
  if (!previous.has(target)) return undefined;
  const result = []; for (let id: string | undefined = target; id !== undefined; id = previous.get(id)) result.push(id);
  return result.reverse();
}
function validate(r: BuildGoalsOptimizeRequest, result: BuildGoalsOptimizeResult): string[] {
  const errors = [], nodes = new Set(result.totalNodeIds), base = new Set(r.baseNodeIds);
  for (const goal of [...r.baseNodeIds, ...r.goalNodeIds]) if (!nodes.has(goal)) errors.push(`missing ${goal}`);
  if (nodes.size !== result.totalNodeIds.length) errors.push("duplicate nodes");
  if ([...nodes].filter((id) => !base.has(id)).length !== result.pointCost) errors.push("wrong point cost");
  const keys = new Set(r.graph.edges.filter((e) => isAllocatableTreeEdge(r.graph, e)).map((e) => [e.from, e.to].sort().join("::")));
  const a = new Map([...nodes].map((id) => [id, [] as string[]]));
  for (const key of result.totalEdgeKeys) {
    const [from, to] = key.split("::");
    if (!keys.has(key) || !a.has(from) || !a.has(to)) { errors.push(`invalid edge ${key}`); continue; }
    a.get(from)!.push(to); a.get(to)!.push(from);
  }
  const seen = new Set([r.baseNodeIds[0]]), queue = [...seen];
  for (let h = 0; h < queue.length; h++) for (const next of a.get(queue[h]) ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  if ([...nodes].some((id) => !seen.has(id))) errors.push("not connected to root");
  return errors;
}
function enumerate(r: BuildGoalsOptimizeRequest, rewards?: Record<string, number>, maxCost = Infinity) {
  const fixed = new Set([...r.baseNodeIds, ...r.goalNodeIds]), optional = Object.keys(r.graph.nodes).filter((id) => !fixed.has(id));
  assert.ok(optional.length <= 20);
  const a = adjacency(r.graph), base = new Set(r.baseNodeIds);
  let bestCost = Infinity, bestScore = -Infinity;
  for (let mask = 0; mask < 2 ** optional.length; mask++) {
    const kept = new Set(fixed);
    optional.forEach((id, i) => { if (mask & (1 << i)) kept.add(id); });
    const cost = kept.size - base.size;
    if (cost > maxCost || !rewards && cost >= bestCost) continue;
    const seen = new Set([r.baseNodeIds[0]]), queue = [...seen];
    for (let h = 0; h < queue.length; h++) for (const next of a.get(queue[h]) ?? []) if (kept.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
    if (seen.size !== kept.size) continue;
    const score = [...kept].filter((id) => !base.has(id)).reduce((s, id) => s + (rewards?.[id] ?? 0), 0);
    if (!rewards || score > bestScore || score === bestScore && cost < bestCost) { bestCost = cost; bestScore = score; }
  }
  return { pointCost: bestCost, ...(rewards ? { score: bestScore } : {}) };
}
function shortestTrap() {
  const edges: Edge[] = [["s", "trunk"], ["trunk", "hub"]];
  const goals: string[] = [];
  for (let i = 0; i < 3; i++) { const goal = `g${i}`; goals.push(goal); edges.push(["s", `d${i}a`], [`d${i}a`, `d${i}b`], [`d${i}b`, goal], ["hub", `link${i}`], [`link${i}`, goal]); }
  for (let i = 0; i < 8; i++) { goals.push(`padding${i}`); edges.push(["s", `padding${i}`]); }
  return { graph: graph(edges), baseNodeIds: ["s"], baseEdgeKeys: [], goalNodeIds: goals, mode: "shortest" as const };
}
function weightedTrap() {
  const edges: Edge[] = [["s", "goal"], ["s", "t1"], ["t1", "t2"], ["t2", "t3"]];
  const rewards: Record<string, number> = {};
  for (let i = 0; i < 4; i++) { edges.push(["s", `b${i}t`], [`b${i}t`, `bait${i}`]); rewards[`bait${i}`] = 3; }
  for (let i = 0; i < 5; i++) { edges.push(["t3", `cluster${i}`]); rewards[`cluster${i}`] = 4; }
  return { request: { graph: graph(edges, rewards), baseNodeIds: ["s"], baseEdgeKeys: [], goalNodeIds: ["goal"], mode: "weighted" as const,
    preferences: [{ id: "attributes" as const, weight: 1 }], extraPointBudget: 8 }, rewards };
}
function realCase(count: number): BuildGoalsOptimizeRequest {
  const raw = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
  const visible = filterVisibleTreeGraph(raw, {}), root = "54447";
  const nodes = Object.fromEntries(Object.entries(visible.nodes).filter(([id, n]) => !n.flags.ascendancy && !n.flags.mastery && (!n.flags.classStart || id === root)));
  const g = { ...visible, nodes, edges: visible.edges.filter((e) => nodes[e.from] && nodes[e.to]) };
  const a = adjacency(g), dist = new Map([[root, 0]]), queue = [root];
  for (let h = 0; h < queue.length; h++) for (const next of a.get(queue[h]) ?? []) if (!dist.has(next)) { dist.set(next, dist.get(queue[h])! + 1); queue.push(next); }
  let seed = 20261108;
  const choices = Object.values(nodes).filter((n) => n.flags.notable && (dist.get(n.id) ?? Infinity) <= 28).sort((a, b) => Number(a.id) - Number(b.id));
  for (let i = choices.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); [choices[i], choices[j]] = [choices[j], choices[i]]; }
  return { graph: g, baseNodeIds: [root], baseEdgeKeys: [], goalNodeIds: choices.slice(0, count).map((n) => n.id), mode: "shortest" };
}
function baselines(r: BuildGoalsOptimizeRequest) {
  const a = adjacency(r.graph), independent = new Set(r.baseNodeIds), marginal = new Set(r.baseNodeIds);
  for (const goal of r.goalNodeIds) path(a, new Set(r.baseNodeIds), goal)!.forEach((id) => independent.add(id));
  while (r.goalNodeIds.some((id) => !marginal.has(id))) {
    const paths = r.goalNodeIds.filter((id) => !marginal.has(id)).map((id) => path(a, marginal, id)!).sort((a, b) => a.length - b.length);
    paths[0].forEach((id) => marginal.add(id));
  }
  return { independentPathUnionCost: independent.size - r.baseNodeIds.length, dynamicMarginalBfsCost: marginal.size - r.baseNodeIds.length };
}
function runCase(name: string) {
  const request = name === "shortest-trap" ? shortestTrap() : name === "weighted-trap" ? weightedTrap().request : realCase(Number(name.split("-")[1]));
  const before = process.memoryUsage().rss, events: { cost: number; score?: number; ms: number }[] = [], start = performance.now();
  const progress = (r: BuildGoalsOptimizeResult) => events.push({ cost: r.pointCost, ...(r.weighted ? { score: r.weighted.score } : {}), ms: performance.now() - start });
  const result = request.mode === "weighted" ? optimizeWeightedBuildGoals(request, progress, { maxIterations: 256, randomSeedStart: 1701 })
    : optimizeBuildGoalsAnytime(request, progress, { maxIterations: 128, randomSeedStart: 1 });
  const elapsedMs = performance.now() - start;
  assert.equal(result.status, "success"); assert.deepEqual(validate(request, result), []);
  const optimal = name === "shortest-trap" ? enumerate(request) : name === "weighted-trap" ? enumerate(request, weightedTrap().rewards, 9) : undefined;
  return { name, nodeCount: Object.keys(request.graph.nodes).length, edgeCount: request.graph.edges.length, goals: request.goalNodeIds, elapsedMs,
    rssBeforeBytes: before, processPeakRssBytes: process.resourceUsage().maxRSS * 1024, pointCost: result.pointCost, score: result.weighted?.score,
    searchType: result.searchType, completeReason: result.completeReason, candidateCount: result.routeCandidates?.length, valid: true, events, optimal,
    baselines: baselines(request), requestFingerprint: createHash("sha256").update(JSON.stringify(request)).digest("hex") };
}
function oracleChecks() {
  let seed = 71;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let trial = 0; trial < 30; trial++) {
    const edges: Edge[] = [["s", "n1"]];
    for (let i = 2; i < 10; i++) edges.push([`n${i - 1}`, `n${i}`]);
    for (let i = 0; i < 10; i++) { const a = Math.floor(random() * 9) + 1, b = Math.floor(random() * 9) + 1; if (a !== b) edges.push([`n${a}`, `n${b}`]); }
    const r: BuildGoalsOptimizeRequest = { graph: graph(edges), baseNodeIds: ["s"], baseEdgeKeys: [], goalNodeIds: ["n4", "n7", "n9"], mode: "shortest" };
    const result = optimizeBuildGoals(r); assert.deepEqual(validate(r, result), []); assert.equal(result.pointCost, enumerate(r).pointCost);
  }
  return 30;
}
if (process.argv[2] === "--case") {
  console.log(JSON.stringify(runCase(process.argv[3])));
} else {
  const cases = ["shortest-trap", "weighted-trap", "real-3", "real-6", "real-9", "real-11", "real-25", "real-50"];
  const results = cases.map((name) => {
    const value = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), "--case", name], { encoding: "utf8", timeout: 120_000, maxBuffer: 4_000_000 }));
    console.log(`${name}: ${value.pointCost} points${value.score !== undefined ? `, score ${value.score}` : ""}, ${value.elapsedMs.toFixed(1)} ms, peak RSS ${(value.processPeakRssBytes / 1048576).toFixed(1)} MiB`);
    return value;
  });
  const malformed: BuildGoalsOptimizeRequest = { graph: graph([["s", "a"], ["x", "goal"]]), baseNodeIds: ["s", "x"], baseEdgeKeys: [], goalNodeIds: ["goal"], mode: "shortest" };
  const disconnected = optimizeBuildGoals(malformed);
  const unknownRequest = { ...malformed, baseNodeIds: ["s"], goalNodeIds: ["unknown"] };
  const unknown = optimizeBuildGoals(unknownRequest);
  const data = { capturedAt: new Date().toISOString(), node: process.version, platform: `${process.platform}/${process.arch}`, exactOracleCasesPassed: oracleChecks(),
    sourceGraphSha256: createHash("sha256").update(readFileSync("data/tree-graph.json")).digest("hex"),
    method: "Fresh Node/tsx subprocess per case; solver-only elapsed; absolute process peak RSS includes loader/graph; fixed iterations, not a 60-second browser run; single trials, no speedup claim.", results,
    boundaryProbes: { disconnectedBase: { status: disconnected.status, validationErrors: validate(malformed, disconnected) }, unknownGoal: { status: unknown.status, validationErrors: validate(unknownRequest, unknown) } } };
  mkdirSync("var/github-research-20261108", { recursive: true }); writeFileSync(output, JSON.stringify(data, null, 2) + "\n");
  console.log(`Independent exhaustive checks: ${data.exactOracleCasesPassed}. Evidence: ${output}`);
}

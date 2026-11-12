import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { optimizeBuildGoalsAnytime, type BuildGoalsOptimizeRequest } from "../../src/tree/buildGoalsOptimizer";
import { sharedJunctionFixture, connectedBranchFixture, exhaustiveRequiredCost } from "../../src/tree/buildGoalsLocalSearch.fixtures";
import { independentlyValid } from "../../src/tree/buildGoalsValidation.fixtures";
import { createBuildGoalsValidation } from "../../src/tree/buildGoalsValidation";
import { filterVisibleTreeGraph } from "../../src/tree/treeVisibility";
import { isAllocatableTreeEdge } from "../../src/tree/pathAllocation";
import type { TreeGraph } from "../../src/tree/types";

const { values } = parseArgs({ options: {
  case: { type: "string" }, local: { type: "string" }, seed: { type: "string" },
  iterations: { type: "string" }, time: { type: "string" }, seeds: { type: "string", default: "10" },
} });
const rawGraph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;

function requestFor(name: string): BuildGoalsOptimizeRequest {
  assert.ok(["shared", "branch", "feasible-25", "feasible-50", "stress-25", "stress-50"].includes(name), "Unknown benchmark case.");
  if (name === "shared") return sharedJunctionFixture();
  if (name === "branch") return connectedBranchFixture();
  const root = "54447", visible = filterVisibleTreeGraph(rawGraph, {});
  const nodes = Object.fromEntries(Object.entries(visible.nodes).filter(([id, n]) => !n.flags.ascendancy && !n.flags.mastery && (!n.flags.classStart || id === root)));
  const graph = { ...visible, nodes, edges: visible.edges.filter((edge) => nodes[edge.from] && nodes[edge.to]) };
  const adjacency = new Map(Object.keys(nodes).map((id) => [id, [] as string[]]));
  for (const e of graph.edges) if (isAllocatableTreeEdge(graph, e)) { adjacency.get(e.from)!.push(e.to); adjacency.get(e.to)!.push(e.from); }
  const queue = [root], distance = new Map([[root, 0]]);
  for (let i = 0; i < queue.length; i += 1) for (const next of adjacency.get(queue[i]) ?? []) {
    if (!distance.has(next)) { distance.set(next, distance.get(queue[i])! + 1); queue.push(next); }
  }
  const count = name.endsWith("50") ? 50 : 25;
  let choices: string[];
  if (name.startsWith("feasible")) {
    // BFS prefixes are connected: every chosen goal lies in a known <=99-point allocation.
    const region = queue.slice(1, 100);
    choices = [...region.filter((id) => nodes[id].flags.notable), ...region.filter((id) => !nodes[id].flags.notable)];
  } else {
    choices = Object.values(nodes).filter((n) => n.flags.notable && (distance.get(n.id) ?? Infinity) <= 28).map((n) => n.id).sort((a, b) => Number(a) - Number(b));
    let seed = 20261108;
    for (let i = choices.length - 1; i > 0; i -= 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1); [choices[i], choices[j]] = [choices[j], choices[i]];
    }
  }
  return { graph, rootNodeId: root, baseNodeIds: [root], baseEdgeKeys: [], goalNodeIds: choices.slice(0, count), mode: "shortest" };
}

function runCase() {
  const request = requestFor(values.case!);
  const iterations = Number(values.iterations ?? 64), timeLimitMs = Number(values.time ?? 0);
  assert.ok(Number.isInteger(iterations) && iterations >= 0 && Number.isFinite(timeLimitMs) && timeLimitMs >= 0, "Invalid benchmark work budget.");
  const events: { pointCost: number; ms: number }[] = [];
  const start = performance.now();
  const result = optimizeBuildGoalsAnytime(request, (progress) => events.push({ pointCost: progress.pointCost, ms: performance.now() - start }), {
    enableLocalSearch: values.local === "on", randomSeedStart: Number(values.seed ?? 1),
    ...(timeLimitMs ? { shouldCancel: () => performance.now() - start >= timeLimitMs } : { maxIterations: iterations }),
  });
  const elapsedMs = performance.now() - start;
  assert.ok(result.status === "success" || timeLimitMs && result.status === "cancelled", result.message);
  const candidate = { ...result, status: "success" as const };
  assert.equal(independentlyValid(request, candidate), true);
  assert.deepEqual(createBuildGoalsValidation(request).validateResult(candidate), []);
  assert.ok(events.every((event, index) => index === 0 || event.pointCost < events[index - 1].pointCost));
  return { name: values.case, local: values.local, seed: Number(values.seed ?? 1), iterations: timeLimitMs ? undefined : iterations, timeLimitMs,
    pointCost: result.pointCost, elapsedMs, firstResultMs: events[0]?.ms, bestResultMs: events.at(-1)?.ms,
    processPeakMiB: process.resourceUsage().maxRSS / 1024, events, valid: true, searchType: result.searchType, completeReason: result.completeReason,
    goals: request.goalNodeIds, notableGoalCount: request.goalNodeIds.filter((id) => request.graph.nodes[id].flags.notable).length,
    requestSha256: createHash("sha256").update(JSON.stringify(request)).digest("hex"),
    oracleCost: values.case === "shared" || values.case === "branch" ? exhaustiveRequiredCost(request) : undefined,
  };
}

if (values.case) {
  process.stdout.write(JSON.stringify(runCase()));
} else {
  const results: ReturnType<typeof runCase>[] = [];
  const run = (name: string, local: string, seed: number, time = 0) => {
    const result = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), "--case", name,
      "--local", local, "--seed", String(seed), "--iterations", "64", "--time", String(time)], { encoding: "utf8", timeout: 120_000, maxBuffer: 4_000_000 }));
    results.push(result);
  };
  for (const name of ["shared", "branch"]) for (const local of ["off", "on"]) run(name, local, 1);
  const seeds = Number(values.seeds);
  assert.ok(Number.isInteger(seeds) && seeds > 0, "--seeds must be a positive integer.");
  for (const name of ["feasible-25", "feasible-50", "stress-25", "stress-50"]) {
    for (let seed = 1; seed <= seeds; seed += 1) for (const local of ["off", "on"]) run(name, local, seed);
    for (let seed = 1; seed <= Math.min(3, seeds); seed += 1) for (const local of ["off", "on"]) run(name, local, seed, 500);
    const group = results.filter((r) => r.name === name && !r.timeLimitMs);
    console.log(`${name}: off ${group.filter((r) => r.local === "off").map((r) => r.pointCost).join(",")}; on ${group.filter((r) => r.local === "on").map((r) => r.pointCost).join(",")}`);
  }
  const median = (array: number[]) => [...array].sort((a, b) => a - b)[Math.floor(array.length / 2)];
  const quality = (result: ReturnType<typeof runCase>) => result.timeLimitMs
    ? result.events.filter((event) => event.ms <= result.timeLimitMs).at(-1)?.pointCost ?? Infinity : result.pointCost;
  const summary = [...new Set(results.map((r) => `${r.name}|${r.timeLimitMs}`))].map((key) => {
    const group = results.filter((r) => `${r.name}|${r.timeLimitMs}` === key), off = group.filter((r) => r.local === "off"), on = group.filter((r) => r.local === "on");
    return { case: key, improved: on.filter((r, i) => quality(r) < quality(off[i])).length, tied: on.filter((r, i) => quality(r) === quality(off[i])).length,
      regressed: on.filter((r, i) => quality(r) > quality(off[i])).length,
      offMedianCost: median(off.map(quality)), onMedianCost: median(on.map(quality)),
      offMedianMs: median(off.map((r) => r.elapsedMs)), onMedianMs: median(on.map((r) => r.elapsedMs)),
      offMedianFirstMs: median(off.map((r) => r.firstResultMs!)), onMedianFirstMs: median(on.map((r) => r.firstResultMs!)) };
  });
  mkdirSync("var/junction-search-20261108", { recursive: true });
  const output = "var/junction-search-20261108/benchmark.json";
  writeFileSync(output, JSON.stringify({ capturedAt: new Date().toISOString(), node: process.version,
    graphSha256: createHash("sha256").update(readFileSync("data/tree-graph.json")).digest("hex"),
    solverSha256: createHash("sha256").update(readFileSync("src/tree/buildGoalsOptimizer.ts")).digest("hex"),
    method: "Fresh Node/tsx processes; production validation included, input load and independent post-check excluded. Timed comparisons use the last published incumbent at or before the common cutoff; cooperative termination can overrun slightly. Absolute process RSS includes loader/graph. Feasible cases have mixed node types within a known <=99-point tree; stress cases are spread-out notables, not feasible 123-point builds.",
    summary, results }, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Evidence: ${output}`);
}

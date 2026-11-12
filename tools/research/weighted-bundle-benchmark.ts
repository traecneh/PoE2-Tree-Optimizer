import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import type { BuildGoalsOptimizeRequest } from "../../src/tree/buildGoalsOptimizer";
import { optimizeWeightedBuildGoals } from "../../src/tree/weightedBuildGoalsOptimizer";
import { weightedBundleFixture, exhaustiveWeightedReward } from "../../src/tree/weightedBundleSearch.fixtures";
import { weightedBranchExchangeFixture, exhaustiveTreeReward } from "../../src/tree/weightedBranchExchange.fixtures";
import { independentlyValid } from "../../src/tree/buildGoalsValidation.fixtures";
import { createBuildGoalsValidation } from "../../src/tree/buildGoalsValidation";
import { filterVisibleTreeGraph } from "../../src/tree/treeVisibility";
import { isAllocatableTreeEdge } from "../../src/tree/pathAllocation";
import type { TreeGraph } from "../../src/tree/types";

const { values } = parseArgs({ options: {
  case: { type: "string" }, bundles: { type: "string" }, exchanges: { type: "string" }, compare: { type: "string", default: "bundles" },
  seed: { type: "string", default: "1" }, time: { type: "string", default: "0" },
} });
assert.ok(["bundles", "exchanges"].includes(values.compare!));
const comparingExchanges = values.compare === "exchanges";
const rawGraph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
function requestFor(name: string): BuildGoalsOptimizeRequest {
  assert.ok(["trap", "exchange", "attributes-25", "shield-25", "minions-13", "available-25"].includes(name));
  if (name === "trap") return weightedBundleFixture().request;
  if (name === "exchange") return weightedBranchExchangeFixture().request;
  const root = "54447", visible = filterVisibleTreeGraph(rawGraph, {});
  const nodes = Object.fromEntries(Object.entries(visible.nodes).filter(([id, node]) => !node.flags.ascendancy && !node.flags.mastery && (!node.flags.classStart || id === root)));
  const graph = { ...visible, nodes, edges: visible.edges.filter((edge) => nodes[edge.from] && nodes[edge.to]) };
  const adjacency = new Map(Object.keys(nodes).map((id) => [id, [] as string[]]));
  for (const edge of graph.edges) if (isAllocatableTreeEdge(graph, edge)) {
    adjacency.get(edge.from)!.push(edge.to); adjacency.get(edge.to)!.push(edge.from);
  }
  const queue = [root], seen = new Set(queue);
  for (let i = 0; i < queue.length; i += 1) for (const next of adjacency.get(queue[i]) ?? []) {
    if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
  const region = queue.slice(1, 100);
  const compact = [...region.filter((id) => nodes[id].flags.notable), ...region.filter((id) => !nodes[id].flags.notable)].slice(0, 25);
  const minions = Object.values(nodes).filter((node) => node.name === "Minion Life" && seen.has(node.id)).map((node) => node.id);
  const id = name.startsWith("attributes") ? "attributes" : name.startsWith("shield") ? "energyShield" : "minionLife";
  return { graph, rootNodeId: root, baseNodeIds: [root], baseEdgeKeys: [], goalNodeIds: name === "minions-13" ? minions : compact,
    mode: "weighted", preferences: [{ id, weight: 1 }], extraPointBudget: 8,
    ...(name.startsWith("available") ? { pointBudgetMode: "all-available", totalPointLimit: 123 } : {}) };
}
function runCase() {
  const request = requestFor(values.case!), start = performance.now(), time = Number(values.time);
  const events: { score: number; cost: number; ms: number; stage: string }[] = [];
  const result = optimizeWeightedBuildGoals(request, (progress) => {
    events.push({ score: progress.weighted!.score, cost: progress.pointCost, ms: performance.now() - start, stage: progress.weighted!.stage! });
  }, { enableBundleLookahead: comparingExchanges || values.bundles === "on", enableBranchExchanges: values.exchanges === "on", randomSeedStart: Number(values.seed),
    ...(time ? { shouldCancel: () => performance.now() - start >= time } : { maxIterations: 32 }) });
  const elapsedMs = performance.now() - start;
  assert.ok(result.status === "success" || time && result.status === "cancelled", result.message);
  const success = { ...result, status: "success" as const };
  assert.equal(independentlyValid(request, success), true);
  assert.deepEqual(createBuildGoalsValidation(request).validateResult(success), []);
  return { name: values.case, comparison: values.compare, setting: comparingExchanges ? values.exchanges : values.bundles, seed: Number(values.seed), timeLimitMs: time,
    score: result.weighted?.score, pointCost: result.pointCost, budget: result.weighted?.maxPointCost,
    elapsedMs, firstResultMs: events[0]?.ms, bestResultMs: events.at(-1)?.ms, events,
    peakProcessMiB: process.resourceUsage().maxRSS / 1024, goals: request.goalNodeIds,
    requestSha256: createHash("sha256").update(JSON.stringify(request)).digest("hex"),
    valid: true, completeReason: result.completeReason,
    oracle: values.case === "trap" ? exhaustiveWeightedReward(request, weightedBundleFixture().rewards, 9)
      : values.case === "exchange" ? exhaustiveTreeReward(request, weightedBranchExchangeFixture().rewards, 9) : undefined };
}
if (values.case) process.stdout.write(JSON.stringify(runCase()));
else {
  const results: ReturnType<typeof runCase>[] = [];
  const run = (name: string, seed: number, time = 0) => {
    for (const setting of ["off", "on"]) {
      results.push(JSON.parse(execFileSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), "--case", name,
        "--compare", values.compare!, comparingExchanges ? "--exchanges" : "--bundles", setting,
        "--seed", String(seed), "--time", String(time)], { encoding: "utf8", timeout: 120_000 })));
    }
  };
  run("trap", 1);
  if (comparingExchanges) run("exchange", 1);
  for (const name of ["attributes-25", "shield-25", "minions-13", "available-25"]) {
    for (let seed = 1; seed <= 3; seed += 1) run(name, seed);
    for (let seed = 1; seed <= 2; seed += 1) run(name, seed, 500);
    console.log(`Completed ${name}`);
  }
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const quality = (r: ReturnType<typeof runCase>) => r.timeLimitMs
    ? r.events.filter((event) => event.stage === "preferences" && event.ms <= r.timeLimitMs).at(-1) ?? { score: -Infinity, cost: Infinity }
    : { score: r.score!, cost: r.pointCost };
  const summary = [...new Set(results.map((r) => `${r.name}|${r.timeLimitMs}`))].map((key) => {
    const group = results.filter((r) => `${r.name}|${r.timeLimitMs}` === key), off = group.filter((r) => r.setting === "off"), on = group.filter((r) => r.setting === "on");
    const deltas = on.map((r, i) => {
      const a = quality(off[i]), b = quality(r), score = b.score - a.score;
      return Math.abs(score) > 1e-9 ? score : a.cost - b.cost;
    });
    return { case: key, improved: deltas.filter((d) => d > 1e-9).length, tied: deltas.filter((d) => Math.abs(d) <= 1e-9).length,
      regressed: deltas.filter((d) => d < -1e-9).length,
      offMedianScore: median(off.map((r) => quality(r).score)), onMedianScore: median(on.map((r) => quality(r).score)),
      offMedianPoints: median(off.map((r) => quality(r).cost)), onMedianPoints: median(on.map((r) => quality(r).cost)),
      offMedianMs: median(off.map((r) => r.elapsedMs)), onMedianMs: median(on.map((r) => r.elapsedMs)),
      offMedianFirstMs: median(off.map((r) => r.firstResultMs!)), onMedianFirstMs: median(on.map((r) => r.firstResultMs!)) };
  });
  const directory = comparingExchanges ? "var/weighted-exchanges-20261108" : "var/weighted-bundles-20261108";
  const output = `${directory}/benchmark.json`;
  mkdirSync(directory, { recursive: true });
  writeFileSync(output, JSON.stringify({ capturedAt: new Date().toISOString(), node: process.version,
    graphSha256: createHash("sha256").update(readFileSync("data/tree-graph.json")).digest("hex"),
    solverSha256: createHash("sha256").update(readFileSync("src/tree/weightedBuildGoalsOptimizer.ts")).digest("hex"),
    branchHelperSha256: createHash("sha256").update(readFileSync("src/tree/weightedBranchExchange.ts")).digest("hex"),
    method: `Fresh Node/tsx processes comparing ${values.compare}, 32 fixed iterations or a shared 500ms cutoff. Timed quality is the last preference-stage incumbent published before the cutoff; cooperative termination may overrun. Quality compares score first, then fewer points on score ties. Validation included in timing; graph loading and independent post-check excluded. Real cases are generated inputs, not imported human builds. Absolute peak RSS includes loader and graph.`,
    summary, results }, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2)); console.log(`Evidence: ${output}`);
}

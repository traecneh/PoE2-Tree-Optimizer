import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { optimizeWeightedBuildGoals } from "../../src/tree/weightedBuildGoalsOptimizer";
import type { BuildGoalsOptimizeResult } from "../../src/tree/buildGoalsOptimizer";
import type { TreeGraph } from "../../src/tree/types";
import { atCheckpoint, compareQuality, corpusDirectory, digest, type Event } from "./imported-weighted-corpus";
import { auditHeldoutAllocation, heldoutCases, holdoutDirectory, prepareHoldoutCorpus, type HoldoutCorpus } from "./heldout-weighted-corpus";

const { values } = parseArgs({ options: { prepare: { type: "boolean" }, case: { type: "string" }, arm: { type: "string" },
  seed: { type: "string", default: "1701" }, ms: { type: "string", default: "2000" }, output: { type: "string", default: "var/weighted-holdout-20261108/benchmark-v1" } } });
const graphText = readFileSync("data/tree-graph.json", "utf8"), graph = JSON.parse(graphText) as TreeGraph;
const sourceFiles = ["src/tree/buildGoalsOptimizer.ts", "src/tree/weightedBuildGoalsOptimizer.ts", "src/tree/weightedBranchExchange.ts",
  "src/tree/weightedSearchSchedule.ts", "src/tree/weightedCorridorReroute.ts", "src/tree/weightedJunctionRelocation.ts", "src/tree/passivePreferences.ts",
  "src/tree/buildGoalsValidation.ts", "src/tree/allocationConstraints.ts", "src/tree/pobBuildImport.ts", "tools/research/heldout-weighted-corpus.ts",
  "tools/research/heldout-weighted-benchmark.ts", "tools/research/heldout-weighted-sources.lock.json"];
const fingerprints = Object.fromEntries(sourceFiles.map((path) => [path, digest(readFileSync(path))]));
if (values.prepare) {
  const corpus = await prepareHoldoutCorpus(graph, digest(graphText)); console.log(`Frozen holdout v1: ${corpus.builds.length} builds, ${heldoutCases(graph, corpus).length} cases.`);
} else {
  const corpusText = readFileSync(`${holdoutDirectory}/corpus.json`, "utf8"), corpus = JSON.parse(corpusText) as HoldoutCorpus;
  assert.equal(corpus.version, 1); assert.equal(corpus.graphSha256, digest(graphText));
  assert.equal(corpus.legacyCorpusSha256, digest(readFileSync(`${corpusDirectory}/corpus.json`)));
  const cases = heldoutCases(graph, corpus), arms = ["corridor", "current"] as const;
  const runCase = () => {
    const item = cases.find((item) => item.key === values.case); assert.ok(item); assert.ok(arms.some((arm) => arm === values.arm));
    const limitMs = Number(values.ms), seed = Number(values.seed); assert.ok(Number.isInteger(limitMs) && limitMs > 0 && limitMs <= 60_000 && Number.isInteger(seed));
    const request = item.request, requestSha256 = digest(JSON.stringify(request));
    const raw: { ms: number; result: BuildGoalsOptimizeResult }[] = [];
    const work = { greedy: 0, bundle: 0, exchange: 0, corridor: 0, junction: 0 };
    const dispatches: { ms: number; kind: string; iteration: number; revision: number; score: number; pointCost: number }[] = [];
    let firstResultMs: number | undefined;
    const start = performance.now();
    const result = optimizeWeightedBuildGoals(request, (result) => {
      const ms = performance.now() - start; firstResultMs ??= ms;
      if (result.weighted?.stage === "preferences") raw.push({ ms, result });
    }, { randomSeedStart: seed, enableJunctionRelocation: values.arm === "current", shouldCancel: () => performance.now() - start >= limitMs,
      onSearchStep: (kind) => { work[kind] += 1; },
      onCorridorReroute: (event) => dispatches.push({ ms: performance.now() - start, kind: "corridor", ...event }),
      onJunctionRelocation: (event) => dispatches.push({ ms: performance.now() - start, kind: "junction", ...event }) });
    const elapsedMs = performance.now() - start;
    assert.equal(digest(JSON.stringify(request)), requestSha256, "Request mutated");
    const events = raw.map(({ ms, result }) => ({ ms, score: result.weighted!.score, points: result.pointCost,
      ...auditHeldoutAllocation(request, result, item.build) }));
    for (const event of events) assert.ok(!event.overMainCap && !event.weaponOverlap.length && !event.detachedWeaponNodes.length);
    const selected = raw.filter((row) => row.ms <= limitMs).at(-1)?.result;
    const basePoints = request.baseNodeIds.filter((id) => !request.graph.nodes[id].flags.classStart).length;
    return { case: item.key, arm: values.arm!, seed, limitMs, requestSha256, firstResultMs, elapsedMs, basePoints,
      mainPointLimit: item.build.mainPointLimit, fixedAttachmentNodeIds: request.weaponSets?.attachmentNodeIds ?? [],
      baselinePoints: selected?.weighted?.baselinePointCost, pointBudget: selected?.weighted?.maxPointCost,
      status: result.status, message: result.message, completeReason: result.completeReason, events,
      checkpoint: atCheckpoint(events, limitMs), work, dispatches, peakProcessMiB: process.resourceUsage().maxRSS / 1024,
      selectedNodeIds: selected?.totalNodeIds, selectedEdgeKeys: selected?.totalEdgeKeys,
      checkpoints: Object.fromEntries([500, 1000, 2000, 5000, 10000, 30000, 60000].filter((ms) => ms <= limitMs).map((ms) => [ms, atCheckpoint(events, ms) ?? null])) };
  };
  if (values.case) process.stdout.write(JSON.stringify(runCase()));
  else {
    const output = resolve(values.output!), inside = relative(resolve("var"), output);
    assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside)); mkdirSync(resolve(output, ".."), { recursive: true }); mkdirSync(output);
    const results: ReturnType<typeof runCase>[] = [];
    const run = (key: string, arm: string, seed: number, ms: number) => {
      const row = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), "--case", key, "--arm", arm,
        "--seed", String(seed), "--ms", String(ms)], { encoding: "utf8", timeout: ms + 60_000, maxBuffer: 8_000_000 }));
      results.push(row); writeFileSync(resolve(output, "results.partial.json"), JSON.stringify(results, null, 2));
    };
    for (const [index, item] of cases.entries()) {
      for (const [offset, seed] of [1701, 42].entries()) for (let i = 0; i < arms.length; i += 1) run(item.key, arms[(i + index + offset) % arms.length], seed, 2000);
      console.log(`Matrix ${index + 1}/${cases.length}: ${item.key}`);
    }
    const longCases = ["spectres/minion-offence/prefix20/available", "wolfpack/companion-offence/prefix20/available", "chaos-dot/chaos-duration/prefix20/available"];
    for (const [index, key] of longCases.entries()) {
      for (let i = 0; i < arms.length; i += 1) run(key, arms[(i + index) % arms.length], 1701, 60_000);
      console.log(`Convergence 60s: ${key}`);
    }
    const comparisons = [2000, 60000].map((limitMs) => {
      const pairs: { case: string; seed: number; quality?: number; control?: Event; current?: Event }[] = [];
      for (const row of results.filter((row) => row.arm === "current" && row.limitMs === limitMs)) {
        const control = results.find((a) => a.arm === "corridor" && a.case === row.case && a.seed === row.seed && a.limitMs === limitMs); assert.ok(control);
        for (const key of ["requestSha256", "basePoints", "baselinePoints", "pointBudget", "mainPointLimit"] as const) assert.deepEqual(row[key], control[key]);
        pairs.push({ case: row.case, seed: row.seed, quality: compareQuality(control.checkpoint, row.checkpoint), control: control.checkpoint, current: row.checkpoint });
      }
      return { limitMs, improved: pairs.filter((p) => p.quality === 1).length, tied: pairs.filter((p) => p.quality === 0).length,
        behind: pairs.filter((p) => p.quality === -1).length, missing: pairs.filter((p) => p.quality === undefined).length, pairs };
    });
    assert.deepEqual(Object.fromEntries(sourceFiles.map((path) => [path, digest(readFileSync(path))])), fingerprints);
    assert.equal(digest(readFileSync(`${holdoutDirectory}/corpus.json`)), digest(corpusText));
    writeFileSync(resolve(output, "benchmark.json"), JSON.stringify({ capturedAt: new Date().toISOString(), node: process.version, corpusSha256: digest(corpusText),
      fingerprints, corpus, comparisons, results, method: "Holdout v1: 26 scenarios, two seeds and arms, rotating order, common 2s cutoffs (104 runs). Three prefix20/available offence cases at seed1701, both arms, common 60s cutoff (6 runs). Fresh serial Node processes; unchanged optimizer. Missing incumbents/errors remain recorded, not silently excluded. Timing includes validation/baseline but excludes loading and independent post-checks. Costs count paid base plus unique additions. Quality is proxy preference score, not Full DPS or global optimality; do not compare scores across base allocations/profiles." }, null, 2));
    console.log(JSON.stringify(comparisons.map(({ pairs: _, ...summary }) => summary)));
  }
}

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { optimizeWeightedBuildGoals } from "../../src/tree/weightedBuildGoalsOptimizer";
import type { BuildGoalsOptimizeResult } from "../../src/tree/buildGoalsOptimizer";
import type { TreeGraph } from "../../src/tree/types";
import { atCheckpoint, budgetModes, compareQuality, corpusDirectory, digest, importedRequest,
  independentAllocationCheck, prepareImportedCorpus, type Corpus, type Event } from "./imported-weighted-corpus";

const { values } = parseArgs({ options: { prepare: { type: "boolean" }, case: { type: "string" }, arm: { type: "string" },
  arms: { type: "string", default: "corridor,current" },
  seed: { type: "string", default: "1701" }, ms: { type: "string", default: "2000" }, output: { type: "string", default: "var/weighted-junction-20261108/benchmark" } } });
const output = resolve(values.output!), insideVar = relative(resolve("var"), output);
assert.ok(insideVar && !insideVar.startsWith("..") && !isAbsolute(insideVar), "Output must remain under workspace var/");
const graphText = readFileSync("data/tree-graph.json", "utf8"), graph = JSON.parse(graphText) as TreeGraph;
const sourceFiles = ["src/tree/buildGoalsOptimizer.ts", "src/tree/weightedBuildGoalsOptimizer.ts", "src/tree/weightedBranchExchange.ts",
  "src/tree/passivePreferences.ts", "src/tree/pobBuildImport.ts", "src/tree/allocationConstraints.ts", "src/tree/buildGoalsValidation.ts", "src/tree/weightedSearchSchedule.ts", "src/tree/weightedCorridorReroute.ts", "src/tree/weightedJunctionRelocation.ts"];
const fingerprints = Object.fromEntries(sourceFiles.map((path) => [path, digest(readFileSync(path))]));
const arms = values.arms!.split(",");
assert.ok(arms.length >= 2 && arms.includes("current") && new Set(arms).size === arms.length
  && arms.every((arm) => ["greedy", "bundles", "legacy", "balanced", "single", "paired", "corridor", "current"].includes(arm)), "Select distinct control arms and current");
if (values.prepare) { const corpus = await prepareImportedCorpus(graph, digest(graphText)); console.log(`Captured ${corpus.builds.length} usable builds; ${corpus.excluded.length} excluded. ${corpusDirectory}/corpus.json`); }
else {
  const corpus = JSON.parse(readFileSync(`${corpusDirectory}/corpus.json`, "utf8")) as Corpus;
  assert.equal(corpus.graphSha256, digest(graphText), "Tree changed; recapture and review corpus first");
  const cases = corpus.builds.flatMap((build) => build.profiles.flatMap((profile) => budgetModes.map((budget) => ({ key: `${build.id}/${profile.id}/${budget}`, build, profile, budget }))));
  const runCase = () => {
    const item = cases.find((item) => item.key === values.case); assert.ok(item, "Unknown case");
    assert.ok(["greedy", "bundles", "legacy", "balanced", "single", "paired", "corridor", "current"].includes(values.arm!));
    const limitMs = Number(values.ms); assert.ok(Number.isFinite(limitMs) && limitMs > 0 && limitMs <= 60_000);
    const request = importedRequest(graph, item.build, item.profile, item.budget);
    const rawEvents: { ms: number; result: BuildGoalsOptimizeResult }[] = [];
    const searchWork = { greedy: 0, bundle: 0, exchange: 0, corridor: 0, junction: 0 };
    const refreshes: { ms: number; round: number; phase: string; iteration: number; revision: number; score: number; pointCost: number; bundleSeeds: number; exchangeSeeds: number }[] = [];
    const pairExchanges: { ms: number; iteration: number; revision: number; score: number; pointCost: number; seeds: number }[] = [];
    const corridors: { ms: number; iteration: number; revision: number; score: number; pointCost: number }[] = [];
    const junctions: { ms: number; iteration: number; revision: number; score: number; pointCost: number }[] = [];
    let firstResultMs: number | undefined;
    const start = performance.now();
    const result = optimizeWeightedBuildGoals(request, (progress) => {
      const ms = performance.now() - start; firstResultMs ??= ms;
      if (progress.weighted?.stage === "preferences") rawEvents.push({ ms, result: progress });
    }, { randomSeedStart: Number(values.seed), shouldCancel: () => performance.now() - start >= limitMs,
      enableBundleLookahead: values.arm !== "greedy", enableBranchExchanges: ["current", "legacy", "balanced", "single", "paired", "corridor"].includes(values.arm!),
      enableSeedRefresh: ["current", "single", "paired", "corridor"].includes(values.arm!), enablePairedBranchExchanges: ["current", "paired", "corridor"].includes(values.arm!),
      enableCorridorRerouting: ["current", "corridor"].includes(values.arm!), enableJunctionRelocation: values.arm === "current",
      searchSchedule: ["current", "balanced", "single", "paired", "corridor"].includes(values.arm!) ? "balanced" : "legacy",
      onSearchStep: (kind) => { searchWork[kind] += 1; }, onSeedRefresh: (event) => { refreshes.push({ ms: performance.now() - start, ...event }); },
      onPairExchange: (event) => { pairExchanges.push({ ms: performance.now() - start, ...event }); },
      onCorridorReroute: (event) => { corridors.push({ ms: performance.now() - start, ...event }); },
      onJunctionRelocation: (event) => { junctions.push({ ms: performance.now() - start, ...event }); } });
    const elapsedMs = performance.now() - start;
    assert.ok(["success", "cancelled"].includes(result.status), `${item.key}: ${result.message}`);
    const events: Event[] = rawEvents.map(({ ms, result }) => ({ ms, score: result.weighted!.score, points: result.pointCost,
      ...independentAllocationCheck(request, result, item.build) }));
    const checkpoint = atCheckpoint(events, limitMs);
    const selected = rawEvents.filter((event) => event.ms <= limitMs).at(-1)?.result;
    return { case: item.key, arm: values.arm!, seed: Number(values.seed), limitMs, firstResultMs, elapsedMs,
      peakProcessMiB: process.resourceUsage().maxRSS / 1024, searchWork, refreshes, pairExchanges, corridors, junctions, events, checkpoint,
      baselinePoints: selected?.weighted?.baselinePointCost, mainPointLimit: item.build.mainPointLimit,
      fixedAttachmentNodeIds: request.weaponSets?.attachmentNodeIds ?? [],
      pointBudget: selected?.weighted?.maxPointCost, requestSha256: digest(JSON.stringify(request)),
      finalStatus: result.status, completeReason: result.completeReason,
      selectedNodeIds: selected?.totalNodeIds, selectedEdgeKeys: selected?.totalEdgeKeys,
      checkpoints: Object.fromEntries([500, 1000, 2000, 5000, 10000].filter((ms) => ms <= limitMs).map((ms) => [ms, atCheckpoint(events, ms) ?? null])) };
  };
  if (values.case) process.stdout.write(JSON.stringify(runCase()));
  else {
    mkdirSync(resolve(output, ".."), { recursive: true });
    mkdirSync(output);
    const results: ReturnType<typeof runCase>[] = [];
    const run = (key: string, arm: string, seed: number, ms: number) => {
      const row = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), "--case", key,
        "--arm", arm, "--seed", String(seed), "--ms", String(ms)], { encoding: "utf8", timeout: ms + 60_000, maxBuffer: 8_000_000 }));
      results.push(row); writeFileSync(resolve(output, "results.partial.json"), JSON.stringify(results, null, 2));
    };
    for (const [index, item] of cases.entries()) {
      for (const [offset, seed] of [1701, 42].entries()) for (let i = 0; i < arms.length; i += 1) run(item.key, arms[(i + index + offset) % arms.length], seed, 2000);
      console.log(`Completed ${index + 1}/${cases.length}: ${item.key}`);
    }
    const extendedArms = arms.includes("corridor") ? ["corridor", "current"] : arms.includes("paired") ? ["paired", "current"] : arms.includes("single") ? ["single", "current"] : arms.includes("balanced") ? ["balanced", "current"] : ["current"];
    for (const [index, build] of corpus.builds.entries()) {
      const key = `${build.id}/${build.profiles[0].id}/available`;
      for (let i = 0; i < extendedArms.length; i += 1) run(key, extendedArms[(i + index) % extendedArms.length], 1701, 10_000);
      console.log(`Extended: ${key}`);
    }
    const comparisons = cases.map((item) => {
      const rows = results.filter((r) => r.case === item.key && r.limitMs === 2000);
      const pairs = [1701, 42].map((seed) => {
        const get = (arm: string) => rows.find((r) => r.arm === arm && r.seed === seed);
        const matched = arms.map(get);
        assert.ok(matched.every((row) => row !== undefined), "Missing comparison arm");
        assert.equal(new Set(matched.map((row) => row.requestSha256)).size, 1, "Comparison inputs differ");
        assert.equal(new Set(matched.map((row) => row.baselinePoints)).size, 1, "Shortest baselines differ");
        assert.equal(new Set(matched.map((row) => row.pointBudget)).size, 1, "Comparison budgets differ");
        return { seed, greedy: get("greedy")?.checkpoint ?? null, bundles: get("bundles")?.checkpoint ?? null, legacy: get("legacy")?.checkpoint ?? null, balanced: get("balanced")?.checkpoint ?? null, single: get("single")?.checkpoint ?? null, paired: get("paired")?.checkpoint ?? null, corridor: get("corridor")?.checkpoint ?? null, current: get("current")?.checkpoint ?? null,
          vsGreedy: compareQuality(get("greedy")?.checkpoint, get("current")?.checkpoint), vsBundles: compareQuality(get("bundles")?.checkpoint, get("current")?.checkpoint),
          vsLegacy: compareQuality(get("legacy")?.checkpoint, get("current")?.checkpoint), vsBalanced: compareQuality(get("balanced")?.checkpoint, get("current")?.checkpoint),
          vsSingle: compareQuality(get("single")?.checkpoint, get("current")?.checkpoint), vsPaired: compareQuality(get("paired")?.checkpoint, get("current")?.checkpoint),
          vsCorridor: compareQuality(get("corridor")?.checkpoint, get("current")?.checkpoint) };
      });
      return { case: item.key, pairs };
    });
    const summarize = (key: "vsGreedy" | "vsBundles" | "vsLegacy" | "vsBalanced" | "vsSingle" | "vsPaired" | "vsCorridor") => {
      const pairs = comparisons.flatMap((item) => item.pairs), values = pairs.map((pair) => pair[key]);
      return { improved: values.filter((v) => v === 1).length, tied: values.filter((v) => v === 0).length,
        regressed: values.filter((v) => v === -1).length, missingIncumbent: values.filter((v) => v === undefined).length,
        currentOverCap: pairs.filter((pair) => pair.current?.overMainCap).length,
        currentWeaponOverlap: pairs.filter((pair) => pair.current?.weaponOverlap.length).length,
        currentDetachedWeaponNodes: pairs.filter((pair) => pair.current?.detachedWeaponNodes.length).length };
    };
    const summary = Object.fromEntries((["Greedy", "Bundles", "Legacy", "Balanced", "Single", "Paired", "Corridor"] as const).filter((arm) => arms.includes(arm.toLowerCase()))
      .map((arm) => [`vs${arm}`, summarize(`vs${arm}`)]));
    assert.deepEqual(Object.fromEntries(sourceFiles.map((path) => [path, digest(readFileSync(path))])), fingerprints, "Solver/scoring/import source changed during benchmark");
    writeFileSync(resolve(output, "benchmark.json"), JSON.stringify({ capturedAt: new Date().toISOString(), node: process.version,
      graphSha256: corpus.graphSha256, fingerprints, corpus, arms, summary, comparisons, results,
      method: `Shared-junction relocation experiment on the frozen public corpus: ${arms.join(", ")} arms, two seeds, 24 cases at a common 2s cutoff, rotating arm order; four All Available profiles extended to 10s with ${extendedArms.join(", ")} and rotating arm order. Corridor is the pre-junction control with all previous searches enabled. All arms enforce the available main cap and fixed weapon attachments/reservations. Original imported goals, source bytes and preferences are unchanged. Timing includes validation/baseline, excludes input loading/post-checks; only preference-stage incumbents published before cutoff count. Search-work/dispatch counters include cooperative-stop overrun work. Not PoB DPS, whole-build viability or an optimality proof.` }, null, 2));
    console.log(JSON.stringify(summary));
    console.log(`Evidence: ${resolve(output, "benchmark.json")}`);
  }
}

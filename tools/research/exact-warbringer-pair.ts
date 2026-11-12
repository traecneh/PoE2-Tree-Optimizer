import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { compileStreamingNeighborhood, enumerateStreamingNeighborhood } from "./exact-neighborhood-streaming";
import { rawStreamingNeighborhoodReference } from "./exact-neighborhood-streaming-reference";
import { reviewedRewards, rawAllocation } from "./exact-neighborhood-audit";
import { pairAllocationParts, type PairedNeighborhood } from "./exact-paired-neighborhoods";
import { auditHeldoutAllocation, heldoutCases } from "./heldout-weighted-corpus";
import { digest } from "./imported-weighted-corpus";
import { scorePassiveNode } from "../../src/tree/passivePreferences";
import type { NeighborhoodInput } from "./exact-neighborhood";
import type { TreeGraph } from "../../src/tree/types";

export const streamingAuditDirectory = "var/exact-streaming-warbringer-20261108";
const parentDirectory = "var/exact-neighborhoods-20261108", pairedDirectory = "var/exact-paired-neighborhoods-20261108";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const assertHashes = (hashes: Record<string, string>) => { for (const [path, hash] of Object.entries(hashes)) assert.equal(digest(readFileSync(path)), hash, path); };
const sameWinner = (a: { scoreUnits: number; variablePoints: number; bestVariableNodeIds: string[] }, b: typeof a) => {
  assert.equal(a.scoreUnits, b.scoreUnits); assert.equal(a.variablePoints, b.variablePoints); assert.deepEqual(a.bestVariableNodeIds, b.bestVariableNodeIds);
};

export function excludedWarbringerPair(parent: any, paired: any): PairedNeighborhood {
  const ids = ["warbringer-partial-junction", "warbringer-partial-effect-frontier"];
  const [a, b] = ids.map((id) => parent.plans.find((p: any) => p.id === id)); assert.ok(a && b);
  for (const key of ["family", "case", "rootNodeId", "pointLimit", "mainPointLimit", "incumbentNodeIds", "incumbentEdgeKeys", "protectedNodeIds", "baseEdgeKeys"]) assert.deepEqual(a[key], b[key], key);
  assert.equal(new Set(a.variableNodeIds).size, a.variableNodeIds.length); assert.equal(new Set(b.variableNodeIds).size, b.variableNodeIds.length);
  const union = [...new Set<string>([...a.variableNodeIds, ...b.variableNodeIds])].sort((x, y) => Number(x) - Number(y));
  const excluded = paired.excluded.find((p: any) => JSON.stringify(p.sourceRegionIds) === JSON.stringify(ids));
  assert.ok(excluded); assert.equal(excluded.variableCount, 22); assert.equal(union.length, 22);
  return { ...a, id: `${a.id}--${b.policy}`, policy: "paired-union", variableNodeIds: union, sourceRegionIds: [ids[0], ids[1]],
    leftOnlyNodeIds: union.filter((id) => !b.variableNodeIds.includes(id)), rightOnlyNodeIds: union.filter((id) => !a.variableNodeIds.includes(id)),
    sharedNodeIds: union.filter((id) => a.variableNodeIds.includes(id) && b.variableNodeIds.includes(id)) };
}

function auditContext() {
  const protectedHashes = read(`${streamingAuditDirectory}/protected-before.json`); assertHashes(protectedHashes);
  const graphText = readFileSync("data/tree-graph.json", "utf8"), graph = JSON.parse(graphText) as TreeGraph;
  const benchmarkText = readFileSync("var/weighted-holdout-20261108/benchmark-v1/benchmark.json", "utf8"), benchmark = JSON.parse(benchmarkText);
  const parent = read(`${parentDirectory}/plan.json`), prior = read(`${pairedDirectory}/plan.json`);
  assert.equal(parent.graphSha256, digest(graphText)); assert.equal(prior.graphSha256, digest(graphText));
  assert.equal(parent.benchmarkSha256, digest(benchmarkText)); assert.equal(prior.benchmarkSha256, digest(benchmarkText));
  const pair = excludedWarbringerPair(parent, prior), item = heldoutCases(graph, benchmark.corpus).find((c) => c.key === pair.case)!; assert.ok(item);
  const row = benchmark.results.find((r: any) => r.case === pair.case && r.arm === "current" && r.seed === 1701 && r.limitMs === 2000); assert.ok(row);
  assert.deepEqual(pair.incumbentNodeIds, row.selectedNodeIds); assert.deepEqual(pair.incumbentEdgeKeys, row.selectedEdgeKeys);
  assert.equal(pair.pointLimit, Math.min(row.mainPointLimit, row.basePoints + row.pointBudget));
  assert.equal(pair.pointLimit, 99); assert.equal(pair.mainPointLimit, 99);
  const review = read("tools/research/exact-neighborhood-rewards.json"), reviewed = reviewedRewards(pair, graph, review);
  assert.deepEqual(Object.fromEntries(item.profile.preferences.map((p) => [p.id, p.weight])),
    Object.fromEntries(Object.entries(review.profiles[pair.family]).map(([id, p]: [string, any]) => [id, p.weight])));
  const required = [...new Set([...item.request.baseNodeIds, ...item.request.goalNodeIds, ...(item.request.weaponSets?.attachmentNodeIds ?? [])])];
  assert.deepEqual([...pair.protectedNodeIds].sort(), [...required].sort());
  const reserved = new Set([...(item.request.excludedNodeIds ?? []), ...item.build.weaponNodeIds]);
  for (const node of reviewed.nodes) {
    const flags = item.request.graph.nodes[node.id]?.flags;
    assert.ok(flags && !reserved.has(node.id) && !required.includes(node.id));
    assert.ok(!flags.classStart && !flags.ascendancy && !flags.mastery && (!flags.keystone || pair.incumbentNodeIds.includes(node.id)));
    assert.ok(Math.abs(scorePassiveNode(graph.nodes[node.id], item.profile.preferences) * review.unitsPerScore - node.units) < 1e-7);
  }
  for (const id of pair.incumbentNodeIds) if (id !== pair.rootNodeId) assert.ok(!graph.nodes[id].flags.classStart && !graph.nodes[id].flags.ascendancy);
  const input: NeighborhoodInput = { nodeIds: Object.keys(item.request.graph.nodes), edges: item.request.graph.edges.map((e) => [e.from, e.to]),
    rootNodeId: pair.rootNodeId, incumbentNodeIds: pair.incumbentNodeIds, variableNodeIds: pair.variableNodeIds, protectedNodeIds: pair.protectedNodeIds,
    committedEdges: pair.baseEdgeKeys.map((key) => key.split("::") as [string, string]), pointLimit: pair.pointLimit, rewardUnits: reviewed.rewardUnits };
  compileStreamingNeighborhood(input);
  return { pair, item, row, graph, reviewed, review, input, protectedHashes };
}

export function prepareWarbringerPair() {
  const context = auditContext(), parentPath = `${parentDirectory}/plan.json`, pairedPath = `${pairedDirectory}/plan.json`;
  const plan = { version: 1, parentSha256: digest(readFileSync(parentPath)), pairedPlanSha256: digest(readFileSync(pairedPath)),
    graphSha256: digest(readFileSync("data/tree-graph.json")), benchmarkSha256: digest(readFileSync("var/weighted-holdout-20261108/benchmark-v1/benchmark.json")),
    pair: context.pair, input: context.input, reviewedNodes: context.reviewed.nodes,
    policy: "Only the previously excluded 22-node Warbringer junction/frontier full union. One original 99-point main allowance; all outside nodes, committed base, goals and weapon attachment nodes stay fixed. No domain clipping, new preference scoring or production search changes." };
  writeFileSync(`${streamingAuditDirectory}/plan.json`, JSON.stringify(plan, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ id: plan.pair.id, variables: plan.pair.variableNodeIds.length, mainAllowance: plan.input.pointLimit,
    domainNodes: compileStreamingNeighborhood(plan.input).offsets.length - 1, weaponCounts: [context.item.build.weaponSets[1].length, context.item.build.weaponSets[2].length] }));
  return plan;
}

export function verifyStreamingSmallDomains() {
  const rows = [
    ...read(`${parentDirectory}/audit-v2/audit.json`).results.map((r: any) => ({ path: `${parentDirectory}/audit-v2/${r.id}.json`, raw: true })),
    ...read(`${pairedDirectory}/audit-v1/audit.json`).results.map((r: any) => ({ path: `${pairedDirectory}/audit-v1/${r.id}.json`, raw: false })),
  ];
  return rows.map(({ path, raw }) => {
    const record = read(path), result = enumerateStreamingNeighborhood(record.input);
    assert.equal(result.status, "optimal"); assert.equal(result.enumerated, record.result.exact.stateCount); sameWinner(result, record.result.exact);
    if (raw) { const reference = rawStreamingNeighborhoodReference(record.input); assert.equal(reference.status, "optimal"); sameWinner(result, reference); }
    else sameWinner(result, record.result.reference);
    return { path, states: result.enumerated, scoreUnits: result.scoreUnits, variablePoints: result.variablePoints,
      bestVariableNodeIds: result.bestVariableNodeIds, rawRechecked: raw, status: result.status };
  });
}

export function runWarbringerPair(output: string, maxMs = 300_000, maxStates = 2 ** 24) {
  const inside = relative(resolve("var"), resolve(output)); assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside));
  assert.ok(Number.isSafeInteger(maxMs) && maxMs > 0 && Number.isSafeInteger(maxStates) && maxStates > 0);
  const planPath = `${streamingAuditDirectory}/plan.json`, plan = read(planPath), context = auditContext();
  assert.equal(plan.version, 1); assert.deepEqual(plan.pair, context.pair); assert.deepEqual(plan.input, context.input); assert.deepEqual(plan.reviewedNodes, context.reviewed.nodes);
  assert.equal(plan.parentSha256, digest(readFileSync(`${parentDirectory}/plan.json`))); assert.equal(plan.pairedPlanSha256, digest(readFileSync(`${pairedDirectory}/plan.json`)));
  assert.equal(plan.graphSha256, digest(readFileSync("data/tree-graph.json")));
  assert.equal(plan.benchmarkSha256, digest(readFileSync("var/weighted-holdout-20261108/benchmark-v1/benchmark.json")));
  const paths = [planPath, "tools/research/exact-neighborhood-streaming.ts", "tools/research/exact-neighborhood-streaming-reference.ts", "tools/research/exact-warbringer-pair.ts",
    "tools/research/exact-neighborhood-streaming.check.mjs", "tools/research/exact-streaming-test-context.ts", ...Object.keys(context.protectedHashes)];
  const fingerprints = Object.fromEntries(paths.map((p) => [p, digest(readFileSync(p))]));
  mkdirSync(resolve(output));
  console.log("Cross-checking sixteen frozen small domains, including eleven new raw-reference runs.");
  const smallChecks = verifyStreamingSmallDomains(); writeFileSync(resolve(output, "small-checks.json"), JSON.stringify(smallChecks, null, 2), { flag: "wx" });
  const compiled = compileStreamingNeighborhood(plan.input), beforeMemory = process.memoryUsage();
  console.log(`Streaming primary: ${plan.pair.id}; ${plan.input.variableNodeIds.length} variables, allowance ${compiled.maxVariablePoints}`);
  const started = performance.now();
  const primary = enumerateStreamingNeighborhood(plan.input, { maxStates, shouldStop: () => performance.now() - started >= maxMs });
  const primaryMs = performance.now() - started;
  writeFileSync(resolve(output, "primary.json"), JSON.stringify({ primary, primaryMs }, null, 2), { flag: "wx" });
  let reference: ReturnType<typeof rawStreamingNeighborhoodReference> | null = null, referenceMs = 0;
  if (primary.status === "optimal") {
    console.log(`Independent raw reference: ${primary.stateCount} states; no objective pruning.`);
    const referenceStart = performance.now();
    reference = rawStreamingNeighborhoodReference(plan.input, { maxStates, shouldStop: () => performance.now() - referenceStart >= maxMs });
    referenceMs = performance.now() - referenceStart;
    if (reference.status === "optimal") sameWinner(primary, reference);
  }
  const bestIds = [...compiled.fixedNodeIds, ...primary.bestVariableNodeIds], request = { ...context.item.request, mode: "shortest" as const, totalPointLimit: plan.pair.pointLimit };
  const winner = rawAllocation(request, bestIds), incumbent = rawAllocation(request, plan.pair.incumbentNodeIds);
  const winnerCheck = auditHeldoutAllocation(request, winner, context.item.build), incumbentCheck = auditHeldoutAllocation(request, incumbent, context.item.build);
  assert.ok(!winnerCheck.overMainCap && !winnerCheck.weaponOverlap.length && !winnerCheck.detachedWeaponNodes.length);
  assert.equal(winnerCheck.totalPoints, primary.totalPoints);
  const score = (ids: string[]) => ids.filter((id) => !request.baseNodeIds.includes(id)).reduce((sum, id) => sum + scorePassiveNode(context.graph.nodes[id], context.item.profile.preferences), 0);
  const incumbentScore = score(plan.pair.incumbentNodeIds), winnerScore = score(bestIds), scoreGain = (primary.scoreUnits - primary.incumbentScoreUnits) / context.review.unitsPerScore;
  assert.ok(Math.abs(incumbentScore - context.row.checkpoint.score) < 1e-7); assert.ok(Math.abs(winnerScore - incumbentScore - scoreGain) < 1e-7);
  const before = pairAllocationParts(plan.pair, plan.pair.incumbentNodeIds, plan.input.rewardUnits), after = pairAllocationParts(plan.pair, bestIds, plan.input.rewardUnits);
  for (const [parts, points, units] of [[before, primary.incumbentVariablePoints, primary.incumbentScoreUnits], [after, primary.variablePoints, primary.scoreUnits]] as const) {
    assert.equal(parts.left.points + parts.right.points + parts.shared.points, points); assert.equal(parts.left.scoreUnits + parts.right.scoreUnits + parts.shared.scoreUnits, units);
  }
  const result = { status: primary.status !== "optimal" ? primary.status : reference!.status, verified: primary.status === "optimal" && reference?.status === "optimal",
    primary, reference, primaryMs, referenceMs, pointSaving: incumbentCheck.totalPoints - winnerCheck.totalPoints, scoreGain, incumbentScore, winnerScore,
    before, after, winnerCheck, incumbentCheck, winnerNodeIds: winner.totalNodeIds, winnerEdgeKeys: winner.totalEdgeKeys,
    changed: { removed: plan.pair.incumbentNodeIds.filter((id: string) => !bestIds.includes(id)), added: bestIds.filter((id) => !plan.pair.incumbentNodeIds.includes(id)) },
    weaponCounts: [context.item.build.weaponSets[1].length, context.item.build.weaponSets[2].length], attachmentNodeIds: context.item.request.weaponSets!.attachmentNodeIds,
    memory: { before: beforeMemory, after: process.memoryUsage(), processMaxRssKiB: process.resourceUsage().maxRSS }, maxMsPerPhase: maxMs, maxStatesPerPhase: maxStates };
  assertHashes(fingerprints);
  writeFileSync(resolve(output, "audit.json"), JSON.stringify({ version: 1, capturedAt: new Date().toISOString(), node: process.version,
    planSha256: digest(readFileSync(planPath)), fingerprints, smallChecks, result,
    meaning: "Exact only for this frozen 22-node union if primary and independent raw reference both complete and agree. Outside allocation, protected goals/base/weapon attachments fixed; one shared 99-point main cap. Proxy preference rewards, not Full DPS or global optimality. No route applied. Cancelled or limited results are not certificates." }, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ status: result.status, verified: result.verified, scoreGain, pointSaving: result.pointSaving, primaryMs, referenceMs, typedArrayBytes: primary.typedArrayBytes }));
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { prepare: { type: "boolean" }, output: { type: "string", default: `${streamingAuditDirectory}/audit-v1` },
    "max-ms": { type: "string", default: "300000" }, "max-states": { type: "string", default: String(2 ** 24) } } });
  if (values.prepare) prepareWarbringerPair(); else runWarbringerPair(values.output!, Number(values["max-ms"]), Number(values["max-states"]));
}

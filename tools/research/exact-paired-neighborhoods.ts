import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { compileNeighborhood, enumerateNeighborhood, type NeighborhoodInput } from "./exact-neighborhood";
import { rawNeighborhoodReference } from "./exact-neighborhood-reference";
import { reviewedRewards, rawAllocation } from "./exact-neighborhood-audit";
import { exactAuditDirectory, type NeighborhoodPlan } from "./exact-neighborhood-plan";
import { heldoutCases, auditHeldoutAllocation } from "./heldout-weighted-corpus";
import { digest } from "./imported-weighted-corpus";
import { scorePassiveNode } from "../../src/tree/passivePreferences";
import type { TreeGraph } from "../../src/tree/types";

export const pairedAuditDirectory = "var/exact-paired-neighborhoods-20261108";
export type PairedNeighborhood = NeighborhoodPlan & {
  sourceRegionIds: [string, string]; leftOnlyNodeIds: string[]; rightOnlyNodeIds: string[]; sharedNodeIds: string[];
};

export function pairedNeighborhoodPlan(regions: NeighborhoodPlan[]) {
  assert.equal(new Set(regions.map((r) => r.id)).size, regions.length, "Duplicate source region");
  const pairs: PairedNeighborhood[] = [];
  const excluded: { sourceRegionIds: [string, string]; case: string; variableCount: number; sharedCount: number; reason: string }[] = [];
  for (let i = 0; i < regions.length; i += 1) for (let j = i + 1; j < regions.length; j += 1) {
    const a = regions[i], b = regions[j];
    if (a.case !== b.case) continue;
    for (const key of ["family", "rootNodeId", "pointLimit", "mainPointLimit", "incumbentNodeIds", "incumbentEdgeKeys", "protectedNodeIds", "baseEdgeKeys"] as const) {
      assert.deepEqual(a[key], b[key], `Pair context differs: ${key}`);
    }
    assert.equal(new Set(a.variableNodeIds).size, a.variableNodeIds.length); assert.equal(new Set(b.variableNodeIds).size, b.variableNodeIds.length);
    const variableNodeIds = [...new Set([...a.variableNodeIds, ...b.variableNodeIds])].sort((x, y) => Number(x) - Number(y) || x.localeCompare(y));
    const sharedNodeIds = variableNodeIds.filter((id) => a.variableNodeIds.includes(id) && b.variableNodeIds.includes(id));
    if (variableNodeIds.length > 20) {
      excluded.push({ sourceRegionIds: [a.id, b.id], case: a.case, variableCount: variableNodeIds.length, sharedCount: sharedNodeIds.length,
        reason: "Whole union exceeds the exact 20-variable bound; no clipping or partial proof." });
      continue;
    }
    pairs.push({ ...a, id: `${a.id}--${b.policy}`, policy: "paired-union", variableNodeIds, sourceRegionIds: [a.id, b.id], sharedNodeIds,
      leftOnlyNodeIds: variableNodeIds.filter((id) => !b.variableNodeIds.includes(id)), rightOnlyNodeIds: variableNodeIds.filter((id) => !a.variableNodeIds.includes(id)) });
  }
  return { pairs, excluded };
}

export function pairAllocationParts(pair: Pick<PairedNeighborhood, "leftOnlyNodeIds" | "rightOnlyNodeIds" | "sharedNodeIds">, selectedNodeIds: string[], rewardUnits: Record<string, number>) {
  const selected = new Set(selectedNodeIds);
  const bucket = (ids: string[]) => ({ points: ids.filter((id) => selected.has(id)).length,
    scoreUnits: ids.filter((id) => selected.has(id)).reduce((sum, id) => sum + rewardUnits[id], 0) });
  return { left: bucket(pair.leftOnlyNodeIds), right: bucket(pair.rightOnlyNodeIds), shared: bucket(pair.sharedNodeIds) };
}

export function preparePairedNeighborhoods() {
  const sourceText = readFileSync(`${exactAuditDirectory}/plan.json`, "utf8"), source = JSON.parse(sourceText);
  const originalAuditText = readFileSync(`${exactAuditDirectory}/audit-v2/audit.json`, "utf8"), original = JSON.parse(originalAuditText);
  assert.equal(original.planSha256, digest(sourceText));
  for (const [path, hash] of Object.entries(original.fingerprints)) assert.equal(digest(readFileSync(path)), hash, path);
  const plan = { version: 1, parentPlanSha256: digest(sourceText), parentAuditSha256: digest(originalAuditText), graphSha256: source.graphSha256,
    benchmarkSha256: source.benchmarkSha256, ...pairedNeighborhoodPlan(source.plans),
    policy: "Every unordered pair within a saved case. Deduplicate the full union; exclude unions above 20 variables without trimming. Use the original total point allowance once; do not add per-region allowances. Parent unavailable slots remain unavailable." };
  mkdirSync(pairedAuditDirectory, { recursive: true });
  writeFileSync(`${pairedAuditDirectory}/plan.json`, JSON.stringify(plan, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ pairs: plan.pairs.map((p) => ({ id: p.id, variables: p.variableNodeIds.length, shared: p.sharedNodeIds.length })), excluded: plan.excluded }, null, 2));
  return plan;
}

export function runPairedNeighborhoodAudits(output: string, maxMs = 0) {
  const inside = relative(resolve("var"), resolve(output)); assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside));
  assert.ok(Number.isSafeInteger(maxMs) && maxMs >= 0);
  const planText = readFileSync(`${pairedAuditDirectory}/plan.json`, "utf8"), plan = JSON.parse(planText);
  assert.equal(plan.version, 1);
  assert.equal(plan.parentPlanSha256, digest(readFileSync(`${exactAuditDirectory}/plan.json`)));
  assert.equal(plan.parentAuditSha256, digest(readFileSync(`${exactAuditDirectory}/audit-v2/audit.json`)));
  const graphText = readFileSync("data/tree-graph.json", "utf8"), graph = JSON.parse(graphText) as TreeGraph;
  const benchmarkText = readFileSync("var/weighted-holdout-20261108/benchmark-v1/benchmark.json", "utf8"), benchmark = JSON.parse(benchmarkText);
  assert.equal(plan.graphSha256, digest(graphText)); assert.equal(plan.benchmarkSha256, digest(benchmarkText));
  const reviewText = readFileSync("tools/research/exact-neighborhood-rewards.json", "utf8"), review = JSON.parse(reviewText);
  const cases = heldoutCases(graph, benchmark.corpus);
  const paths = ["tools/research/exact-paired-neighborhoods.ts", "tools/research/exact-neighborhood.ts", "tools/research/exact-neighborhood-reference.ts",
    "tools/research/exact-neighborhood-audit.ts", "tools/research/exact-neighborhood-rewards.json", `${pairedAuditDirectory}/plan.json`,
    `${exactAuditDirectory}/plan.json`, `${exactAuditDirectory}/audit-v2/audit.json`, ...Object.keys(benchmark.fingerprints)];
  const fingerprints = Object.fromEntries(paths.map((p) => [p, digest(readFileSync(p))]));
  mkdirSync(resolve(output));
  const results: any[] = [];
  for (const pair of plan.pairs as PairedNeighborhood[]) {
    assert.match(pair.id, /^[a-z0-9-]+$/);
    const item = cases.find((item) => item.key === pair.case)!; assert.ok(item);
    const row = benchmark.results.find((r: any) => r.case === pair.case && r.arm === "current" && r.seed === 1701
      && r.limitMs === (pair.family === "warbringer-partial" ? 2000 : 60000)); assert.ok(row);
    assert.deepEqual(pair.incumbentNodeIds, row.selectedNodeIds); assert.deepEqual(pair.incumbentEdgeKeys, row.selectedEdgeKeys);
    assert.equal(pair.pointLimit, Math.min(row.mainPointLimit, row.basePoints + row.pointBudget));
    assert.deepEqual(Object.fromEntries(item.profile.preferences.map((p) => [p.id, p.weight])),
      Object.fromEntries(Object.entries(review.profiles[pair.family]).map(([id, p]: [string, any]) => [id, p.weight])));
    const fixedRequired = [...new Set([...item.request.baseNodeIds, ...item.request.goalNodeIds, ...(item.request.weaponSets?.attachmentNodeIds ?? [])])];
    assert.deepEqual([...fixedRequired].sort(), [...pair.protectedNodeIds].sort());
    const reserved = new Set([...(item.request.excludedNodeIds ?? []), ...(item.request.weaponSets?.allocations[1] ?? []), ...(item.request.weaponSets?.allocations[2] ?? [])]);
    const reviewed = reviewedRewards(pair, graph, review);
    for (const node of reviewed.nodes) {
      const flags = item.request.graph.nodes[node.id]?.flags;
      assert.ok(flags && !fixedRequired.includes(node.id) && !reserved.has(node.id));
      assert.ok(!flags.classStart && !flags.ascendancy && !flags.mastery && (!flags.keystone || pair.incumbentNodeIds.includes(node.id)));
      assert.ok(Math.abs(scorePassiveNode(graph.nodes[node.id], item.profile.preferences) * review.unitsPerScore - node.units) < 1e-7, "Independent reward mismatch");
    }
    for (const id of pair.incumbentNodeIds) if (id !== pair.rootNodeId) assert.ok(!graph.nodes[id].flags.classStart && !graph.nodes[id].flags.ascendancy);
    const input: NeighborhoodInput = { nodeIds: Object.keys(item.request.graph.nodes), edges: item.request.graph.edges.map((e) => [e.from, e.to]),
      rootNodeId: pair.rootNodeId, incumbentNodeIds: pair.incumbentNodeIds, variableNodeIds: pair.variableNodeIds, protectedNodeIds: pair.protectedNodeIds,
      committedEdges: pair.baseEdgeKeys.map((key) => key.split("::") as [string, string]), pointLimit: pair.pointLimit, rewardUnits: reviewed.rewardUnits };
    const compiled = compileNeighborhood(input);
    console.log(`Exact: ${pair.id} (${pair.variableNodeIds.length} variables, shared allowance ${compiled.maxVariablePoints})`);
    const started = performance.now(), exact = enumerateNeighborhood(input, () => maxMs > 0 && performance.now() - started >= maxMs), exactMs = performance.now() - started;
    let reference: ReturnType<typeof rawNeighborhoodReference> | null = null, referenceMs = 0;
    if (exact.status === "optimal") {
      console.log(`Raw reference: ${pair.id}`);
      const referenceStart = performance.now(); reference = rawNeighborhoodReference(input); referenceMs = performance.now() - referenceStart;
      assert.equal(reference.scoreUnits, exact.scoreUnits); assert.equal(reference.variablePoints, exact.variablePoints); assert.deepEqual(reference.bestVariableNodeIds, exact.bestVariableNodeIds);
    }
    const bestIds = [...compiled.fixedNodeIds, ...exact.bestVariableNodeIds], request = { ...item.request, mode: "shortest" as const, totalPointLimit: pair.pointLimit };
    const winner = rawAllocation(request, bestIds), incumbent = rawAllocation(request, pair.incumbentNodeIds);
    const winnerCheck = auditHeldoutAllocation(request, winner, item.build), incumbentCheck = auditHeldoutAllocation(request, incumbent, item.build);
    assert.ok(!winnerCheck.overMainCap && !winnerCheck.weaponOverlap.length && !winnerCheck.detachedWeaponNodes.length);
    assert.equal(winnerCheck.totalPoints, exact.totalPoints);
    const score = (ids: string[]) => ids.filter((id) => !item.request.baseNodeIds.includes(id)).reduce((n, id) => n + scorePassiveNode(graph.nodes[id], item.profile.preferences), 0);
    const incumbentScore = score(pair.incumbentNodeIds), winnerScore = score(bestIds), scoreGain = (exact.scoreUnits - exact.incumbentScoreUnits) / review.unitsPerScore;
    assert.ok(Math.abs(incumbentScore - row.checkpoint.score) < 1e-7); assert.ok(Math.abs(winnerScore - incumbentScore - scoreGain) < 1e-7);
    const before = pairAllocationParts(pair, pair.incumbentNodeIds, reviewed.rewardUnits), after = pairAllocationParts(pair, bestIds, reviewed.rewardUnits);
    for (const [parts, expectedPoints, expectedScore] of [[before, exact.incumbentVariablePoints, exact.incumbentScoreUnits], [after, exact.variablePoints, exact.scoreUnits]] as const) {
      assert.equal(parts.left.points + parts.right.points + parts.shared.points, expectedPoints);
      assert.equal(parts.left.scoreUnits + parts.right.scoreUnits + parts.shared.scoreUnits, expectedScore);
    }
    const changed = { removed: pair.incumbentNodeIds.filter((id) => !bestIds.includes(id)), added: bestIds.filter((id) => !pair.incumbentNodeIds.includes(id)) };
    const result = { id: pair.id, case: pair.case, sourceRegionIds: pair.sourceRegionIds, variableNodeCount: pair.variableNodeIds.length, sharedNodeCount: pair.sharedNodeIds.length,
      sharedVariableAllowance: compiled.maxVariablePoints, fixedComponentCount: compiled.fixedComponents.length, exact, reference, exactMs, referenceMs,
      scoreGain, pointSaving: incumbentCheck.totalPoints - winnerCheck.totalPoints, incumbentScore, winnerScore, before, after, changed,
      winnerCheck, reviewedNodes: reviewed.nodes, winnerNodeIds: winner.totalNodeIds, winnerEdgeKeys: winner.totalEdgeKeys };
    writeFileSync(resolve(output, `${pair.id}.json`), JSON.stringify({ pair, input, result }, null, 2), { flag: "wx" });
    results.push(result); writeFileSync(resolve(output, "results.partial.json"), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ id: pair.id, status: exact.status, scoreGain, pointSaving: result.pointSaving, states: exact.enumerated }));
  }
  for (const [path, hash] of Object.entries(fingerprints)) assert.equal(digest(readFileSync(path)), hash, path);
  writeFileSync(resolve(output, "audit.json"), JSON.stringify({ version: 1, capturedAt: new Date().toISOString(), node: process.version, planSha256: digest(planText),
    graphSha256: digest(graphText), benchmarkSha256: digest(benchmarkText), reviewSha256: digest(reviewText), fingerprints, excluded: plan.excluded, results,
    meaning: "Exact only for each deduplicated two-region union and its single shared unit-node point allowance. Independent literal proxy rewards and raw topology verification; not whole-tree optimality, Full DPS or an applied route. Cancelled searches are not exact proofs." }, null, 2), { flag: "wx" });
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { prepare: { type: "boolean" }, output: { type: "string", default: `${pairedAuditDirectory}/audit-v1` }, "max-ms": { type: "string", default: "0" } } });
  if (values.prepare) preparePairedNeighborhoods(); else runPairedNeighborhoodAudits(values.output!, Number(values["max-ms"]));
}

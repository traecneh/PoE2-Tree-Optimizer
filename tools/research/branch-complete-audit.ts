import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { selectBranchCompleteDomain, branchSelectionPolicy, type BranchTopology } from "./branch-complete-plan";
import { compileStreamingNeighborhood, enumerateStreamingNeighborhood } from "./exact-neighborhood-streaming";
import { rawStreamingNeighborhoodReference } from "./exact-neighborhood-streaming-reference";
import { heldoutCases, auditHeldoutAllocation } from "./heldout-weighted-corpus";
import { reviewedRewards, rawAllocation } from "./exact-neighborhood-audit";
import { digest } from "./imported-weighted-corpus";
import { scorePassiveNode } from "../../src/tree/passivePreferences";
import type { NeighborhoodInput } from "./exact-neighborhood";
import type { TreeGraph } from "../../src/tree/types";

export const branchAuditDirectory = "var/exact-branch-complete-20261108";
export const branchCaseKeys = ["spectres/minion-offence/prefix20/available", "wolfpack/companion-offence/prefix20/available",
  "chaos-dot/chaos-duration/prefix20/available", "warbringer-partial/life-armour/prefix20/available"];
const graphPath = "data/tree-graph.json", benchmarkPath = "var/weighted-holdout-20261108/benchmark-v1/benchmark.json";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const checkHashes = (hashes: Record<string, string>) => { for (const [path, hash] of Object.entries(hashes)) assert.equal(digest(readFileSync(path)), hash, path); };

function contexts() {
  const protectedHashes = read(`${branchAuditDirectory}/protected-before.json`); checkHashes(protectedHashes);
  const graph = read(graphPath) as TreeGraph, benchmark = read(benchmarkPath);
  assert.equal(benchmark.corpus.graphSha256, digest(readFileSync(graphPath)));
  const cases = heldoutCases(graph, benchmark.corpus);
  return { graph, protectedHashes, entries: branchCaseKeys.map((key) => {
    const item = cases.find((c) => c.key === key)!; assert.ok(item);
    const row = benchmark.results.find((r: any) => r.case === key && r.arm === "current" && r.seed === 1701 && r.limitMs === (item.build.id === "warbringer-partial" ? 2000 : 60000)); assert.ok(row);
    const selected = new Set<string>(row.selectedNodeIds), request = item.request;
    const reserved = new Set([...(request.excludedNodeIds ?? []), ...item.build.weaponNodeIds]);
    const protectedNodeIds = [...new Set([...request.baseNodeIds, ...request.goalNodeIds, ...(request.weaponSets?.attachmentNodeIds ?? [])])];
    const eligibleNodeIds = Object.values(request.graph.nodes).filter((n) => !reserved.has(n.id) && !n.flags.classStart && !n.flags.ascendancy
      && !n.flags.mastery && (!n.flags.keystone || selected.has(n.id))).map((n) => n.id);
    const topology: BranchTopology = { nodeIds: Object.keys(request.graph.nodes), edges: request.graph.edges.map((e) => [e.from, e.to]), rootNodeId: request.rootNodeId!,
      incumbentNodeIds: [...row.selectedNodeIds], protectedNodeIds, eligibleNodeIds, pointLimit: Math.min(row.mainPointLimit, row.basePoints + row.pointBudget) };
    return { id: `${item.build.id}-branch-complete`, case: key, family: item.build.id, topology, item, row };
  }) };
}

export function prepareBranchCompleteAudit() {
  const context = contexts();
  const entries = context.entries.map(({ id, case: key, family, topology }) => ({ id, case: key, family, topology, selection: selectBranchCompleteDomain(topology) }));
  const plan = { version: 1, sourceHashes: Object.fromEntries([graphPath, benchmarkPath, "tools/research/branch-complete-plan.ts"].map((p) => [p, digest(readFileSync(p))])),
    caseKeys: branchCaseKeys, bounds: branchSelectionPolicy, entries,
    policy: "One first structurally eligible complete pendant donor / complete eligible off-allocation component per saved case, anchors/components ordered by numeric ID. No rewards, names, stat text or profiles are read by the selector. Freeze this plan before collecting reward-review text. Preserve outside allocations, base, goals and weapon attachments; require full-budget 0/1/2-point transfer witnesses. All rejections/unavailable contexts retained." };
  writeFileSync(`${branchAuditDirectory}/plan.json`, JSON.stringify(plan, null, 2), { flag: "wx" });
  // Reward text is collected only after the topology-only plan has been sealed.
  const ids = [...new Set(entries.flatMap((e) => e.selection.domain?.variableNodeIds ?? []))].sort((a, b) => Number(a) - Number(b));
  const stats = [...new Set(ids.flatMap((id) => context.graph.nodes[id].stats))].sort();
  const base = read("tools/research/exact-neighborhood-rewards.json"), reviewed = new Set([...base.valued.map((r: any) => r.text), ...base.zeroGroups.flatMap((r: any) => r.texts)]);
  writeFileSync(`${branchAuditDirectory}/review-input.json`, JSON.stringify({ planSha256: digest(readFileSync(`${branchAuditDirectory}/plan.json`)), stats,
    unreviewed: stats.filter((text) => !reviewed.has(text)), nodes: ids.map((id) => ({ id, name: context.graph.nodes[id].name, stats: context.graph.nodes[id].stats })) }, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ entries: entries.map((e) => ({ id: e.id, donor: e.selection.domain?.donorNodeIds, recipient: e.selection.domain?.recipientNodeIds,
    witnesses: e.selection.domain?.witnesses, donorsConsidered: e.selection.donorsConsidered, recipientsConsidered: e.selection.recipientsConsidered,
    pairCandidates: e.selection.pairCandidates, unavailable: e.selection.unavailable })), stats, unreviewed: stats.filter((text) => !reviewed.has(text)) }, null, 2));
  return plan;
}

export function loadBranchReview() {
  const base = read("tools/research/exact-neighborhood-rewards.json"), additions = read("tools/research/branch-complete-reward-additions.json");
  assert.equal(additions.unitsPerScore, base.unitsPerScore);
  return { ...base, valued: [...base.valued, ...additions.valued], zeroGroups: [...base.zeroGroups, ...additions.zeroGroups] };
}

export function runBranchCompleteAudit(output: string, maxMs = 300_000, maxStates = 2 ** 24) {
  const inside = relative(resolve("var"), resolve(output)); assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside));
  assert.ok(Number.isSafeInteger(maxMs) && maxMs > 0 && Number.isSafeInteger(maxStates) && maxStates > 0);
  const planPath = `${branchAuditDirectory}/plan.json`, plan = read(planPath), context = contexts(), review = loadBranchReview();
  assert.equal(plan.version, 1); checkHashes(plan.sourceHashes); assert.deepEqual(plan.bounds, branchSelectionPolicy); assert.deepEqual(plan.caseKeys, branchCaseKeys);
  const expected = context.entries.map(({ id, case: key, family, topology }) => ({ id, case: key, family, topology, selection: selectBranchCompleteDomain(topology) }));
  assert.deepEqual(plan.entries, expected); assert.equal(read(`${branchAuditDirectory}/review-input.json`).planSha256, digest(readFileSync(planPath)));
  const paths = [planPath, `${branchAuditDirectory}/review-input.json`, "tools/research/branch-complete-audit.ts", "tools/research/branch-complete-plan.ts",
    "tools/research/branch-complete-reward-additions.json", "tools/research/branch-complete-test-context.ts", "tools/research/branch-complete-plan.check.mjs", ...Object.keys(context.protectedHashes)];
  const fingerprints = Object.fromEntries(paths.map((p) => [p, digest(readFileSync(p))]));
  mkdirSync(resolve(output));
  const results = [];
  for (const entry of expected) {
    const domain = entry.selection.domain; if (!domain) continue;
    const itemContext = context.entries.find((c) => c.id === entry.id)!, { item, row } = itemContext;
    assert.deepEqual(Object.fromEntries(item.profile.preferences.map((p) => [p.id, p.weight])),
      Object.fromEntries(Object.entries(review.profiles[entry.family]).map(([id, p]: [string, any]) => [id, p.weight])));
    const reviewed = reviewedRewards({ family: entry.family, variableNodeIds: domain.variableNodeIds }, context.graph, review);
    for (const node of reviewed.nodes) assert.ok(Math.abs(scorePassiveNode(context.graph.nodes[node.id], item.profile.preferences) * review.unitsPerScore - node.units) < 1e-7, `Independent reward mismatch: ${node.id}`);
    for (const id of entry.topology.incumbentNodeIds) if (id !== entry.topology.rootNodeId) assert.ok(!context.graph.nodes[id].flags.classStart && !context.graph.nodes[id].flags.ascendancy);
    const input: NeighborhoodInput = { ...entry.topology, variableNodeIds: domain.variableNodeIds, rewardUnits: reviewed.rewardUnits,
      committedEdges: item.request.baseEdgeKeys.map((key) => key.split("::") as [string, string]) };
    const compiled = compileStreamingNeighborhood(input), request = { ...item.request, mode: "shortest" as const, totalPointLimit: input.pointLimit };
    const witnessChecks = domain.witnesses.map((witness) => {
      const route = rawAllocation(request, [...compiled.fixedNodeIds, ...witness.selectedVariableNodeIds]);
      const check = auditHeldoutAllocation(request, route, item.build); assert.equal(check.totalPoints, input.pointLimit);
      assert.ok(!check.overMainCap && !check.weaponOverlap.length && !check.detachedWeaponNodes.length);
      return { donorPoints: witness.donorPoints, recipientPoints: witness.recipientPoints, check };
    });
    console.log(`Exact: ${entry.id}; ${domain.variableNodeIds.length} variables, three verified full-budget splits`);
    const started = performance.now(), primary = enumerateStreamingNeighborhood(input, { maxStates, shouldStop: () => performance.now() - started >= maxMs });
    const primaryMs = performance.now() - started;
    let reference: ReturnType<typeof rawStreamingNeighborhoodReference> | null = null, referenceMs = 0;
    if (primary.status === "optimal") {
      const referenceStart = performance.now(); reference = rawStreamingNeighborhoodReference(input, { maxStates, shouldStop: () => performance.now() - referenceStart >= maxMs }); referenceMs = performance.now() - referenceStart;
      if (reference.status === "optimal") {
        assert.equal(reference.scoreUnits, primary.scoreUnits); assert.equal(reference.variablePoints, primary.variablePoints); assert.deepEqual(reference.bestVariableNodeIds, primary.bestVariableNodeIds);
      }
    }
    const bestIds = [...compiled.fixedNodeIds, ...primary.bestVariableNodeIds], winner = rawAllocation(request, bestIds), incumbent = rawAllocation(request, input.incumbentNodeIds);
    const winnerCheck = auditHeldoutAllocation(request, winner, item.build), incumbentCheck = auditHeldoutAllocation(request, incumbent, item.build);
    assert.equal(winnerCheck.totalPoints, primary.totalPoints); assert.ok(!winnerCheck.overMainCap && !winnerCheck.weaponOverlap.length && !winnerCheck.detachedWeaponNodes.length);
    const score = (ids: string[]) => ids.filter((id) => !request.baseNodeIds.includes(id)).reduce((sum, id) => sum + scorePassiveNode(context.graph.nodes[id], item.profile.preferences), 0);
    const incumbentScore = score(input.incumbentNodeIds), winnerScore = score(bestIds), scoreGain = (primary.scoreUnits - primary.incumbentScoreUnits) / review.unitsPerScore;
    assert.ok(Math.abs(incumbentScore - row.checkpoint.score) < 1e-7); assert.ok(Math.abs(winnerScore - incumbentScore - scoreGain) < 1e-7);
    const donor = new Set(domain.donorNodeIds), recipient = new Set(domain.recipientNodeIds), bucket = (ids: string[], group: Set<string>) => {
      const chosen = ids.filter((id) => group.has(id)); return { points: chosen.length, scoreUnits: chosen.reduce((sum, id) => sum + input.rewardUnits[id], 0) };
    };
    const result = { id: entry.id, case: entry.case, status: primary.status !== "optimal" ? primary.status : reference!.status, verified: primary.status === "optimal" && reference?.status === "optimal",
      primary, reference, primaryMs, referenceMs, witnessChecks, scoreGain, pointSaving: incumbentCheck.totalPoints - winnerCheck.totalPoints, incumbentScore, winnerScore,
      before: { donor: bucket(input.incumbentNodeIds, donor), recipient: bucket(input.incumbentNodeIds, recipient) }, after: { donor: bucket(bestIds, donor), recipient: bucket(bestIds, recipient) },
      winnerCheck, incumbentCheck, winnerNodeIds: winner.totalNodeIds, winnerEdgeKeys: winner.totalEdgeKeys,
      changed: { removed: input.incumbentNodeIds.filter((id) => !bestIds.includes(id)), added: bestIds.filter((id) => !input.incumbentNodeIds.includes(id)) },
      maxMsPerPhase: maxMs, maxStatesPerPhase: maxStates };
    writeFileSync(resolve(output, `${entry.id}.json`), JSON.stringify({ entry, input, reviewedNodes: reviewed.nodes, result }, null, 2), { flag: "wx" });
    results.push(result); console.log(JSON.stringify({ id: entry.id, status: result.status, verified: result.verified, scoreGain, pointSaving: result.pointSaving, feasible: reference?.feasibleSubsets }));
  }
  checkHashes(fingerprints);
  writeFileSync(resolve(output, "audit.json"), JSON.stringify({ version: 1, capturedAt: new Date().toISOString(), node: process.version, planSha256: digest(readFileSync(planPath)), fingerprints,
    unavailable: expected.filter((e) => !e.selection.domain).map((e) => ({ id: e.id, selection: e.selection })), results,
    meaning: "Exact only inside each structurally selected branch-complete domain when both independent solvers finish and agree. Domains/profiles frozen before reward review, all outside allocations fixed, three full-budget point-split witnesses independently checked. Additive proxy rewards, not Full DPS or global optimality. No route applied. Cancelled/limited searches are not certificates." }, null, 2), { flag: "wx" });
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { prepare: { type: "boolean" }, output: { type: "string", default: `${branchAuditDirectory}/audit-v1` }, "max-ms": { type: "string", default: "300000" }, "max-states": { type: "string", default: String(2 ** 24) } } });
  if (values.prepare) prepareBranchCompleteAudit(); else runBranchCompleteAudit(values.output!, Number(values["max-ms"]), Number(values["max-states"]));
}

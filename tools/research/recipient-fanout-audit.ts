import assert from "node:assert/strict";
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { enumerateRecipientAlternatives, recipientFanoutBounds } from "./recipient-fanout-plan";
import { loadBranchReview } from "./branch-complete-audit";
import { digest } from "./imported-weighted-corpus";
import { heldoutCases, auditHeldoutAllocation } from "./heldout-weighted-corpus";
import { reviewedRewards, rawAllocation } from "./exact-neighborhood-audit";
import { enumerateStreamingNeighborhood } from "./exact-neighborhood-streaming";
import { rawStreamingNeighborhoodReference } from "./exact-neighborhood-streaming-reference";
import { scorePassiveNode } from "../../src/tree/passivePreferences";
import type { BranchDomain, BranchTopology } from "./branch-complete-plan";
import type { NeighborhoodInput } from "./exact-neighborhood";
import type { TreeGraph } from "../../src/tree/types";

export const fanoutDirectory = "var/exact-recipient-fanout-20261108";
export const parentPlanPath = "var/exact-branch-complete-20261108/plan.json";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const checkHashes = (hashes: Record<string, string>) => { for (const [path, hash] of Object.entries(hashes)) assert.equal(digest(readFileSync(path)), hash, path); };

export function prepareRecipientFanout() {
  checkHashes(read(`${fanoutDirectory}/protected-before.json`));
  const parent = read(parentPlanPath); checkHashes(parent.sourceHashes);
  const graph = read("data/tree-graph.json") as TreeGraph;
  const entries = parent.entries.map((entry: any) => {
    assert.ok(entry.selection.domain);
    const { donorAnchorNodeId, donorNodeIds } = entry.selection.domain;
    return { id: entry.id, case: entry.case, family: entry.family, donor: { donorAnchorNodeId, donorNodeIds },
      alternatives: enumerateRecipientAlternatives(entry.topology, { donorAnchorNodeId, donorNodeIds }) };
  });
  const plan = { version: 1, parentPlanPath, parentPlanSha256: digest(readFileSync(parentPlanPath)), bounds: recipientFanoutBounds,
    sourceHashes: Object.fromEntries(["data/tree-graph.json", "var/weighted-holdout-20261108/benchmark-v1/benchmark.json", "tools/research/recipient-fanout-plan.ts"].map((p) => [p, digest(readFileSync(p))])),
    entries, policy: "All complete eligible 2..8-node recipient components for the four existing frozen donors. Preserve original domains, goals/base/weapon protections, one original point allowance and three full-budget witnesses. Reject only structural/bound violations, with every exclusion retained. No reward/score filtering or truncation. Parent topology is shared by hash, not copied per domain. Freeze before collecting new review text." };
  writeFileSync(`${fanoutDirectory}/plan.json`, JSON.stringify(plan, null, 2), { flag: "wx" });
  const ids = [...new Set<string>(entries.flatMap((e: any) => e.alternatives.domains.flatMap((d: any) => d.variableNodeIds)))].sort((a, b) => Number(a) - Number(b));
  const stats = [...new Set(ids.flatMap((id) => graph.nodes[id].stats))].sort();
  const review = loadBranchReview(), known = new Set([...review.valued.map((r: any) => r.text), ...review.zeroGroups.flatMap((g: any) => g.texts)]);
  writeFileSync(`${fanoutDirectory}/review-input.json`, JSON.stringify({ planSha256: digest(readFileSync(`${fanoutDirectory}/plan.json`)), stats,
    unreviewed: stats.filter((s) => !known.has(s)), nodes: ids.map((id) => ({ id, name: graph.nodes[id].name, stats: graph.nodes[id].stats })) }, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ contexts: entries.map((e: any) => ({ id: e.id, domains: e.alternatives.domains.length, components: e.alternatives.componentCount,
    boundedAttached: e.alternatives.boundedWithSelectedAttachment, rejected: e.alternatives.rejected.length })), uniqueNodes: ids.length, statLines: stats.length, unreviewed: stats.filter((s) => !known.has(s)).length }, null, 2));
  return plan;
}

export function loadFanoutReview() {
  const base = loadBranchReview(), additions = read("tools/research/recipient-fanout-reward-additions.json");
  assert.equal(additions.unitsPerScore, base.unitsPerScore);
  assert.equal(additions.reviewInputSha256, digest(readFileSync(`${fanoutDirectory}/review-input.json`)));
  return { ...base, valued: [...base.valued, ...additions.valued], zeroGroups: [...base.zeroGroups, ...additions.zeroGroups] };
}

export function fanoutInput(topology: BranchTopology, domain: BranchDomain, rewardUnits: Record<string, number>, baseEdgeKeys: string[]): NeighborhoodInput {
  return { nodeIds: topology.nodeIds, edges: topology.edges, rootNodeId: topology.rootNodeId, incumbentNodeIds: topology.incumbentNodeIds,
    protectedNodeIds: topology.protectedNodeIds, variableNodeIds: domain.variableNodeIds, pointLimit: topology.pointLimit,
    rewardUnits, committedEdges: baseEdgeKeys.map((key) => key.split("::") as [string, string]) };
}

export function runRecipientFanout(output: string, maxMs = 300_000, maxStates = 2 ** 24) {
  const inside = relative(resolve("var"), resolve(output)); assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside));
  assert.ok(Number.isSafeInteger(maxMs) && maxMs > 0 && Number.isSafeInteger(maxStates) && maxStates > 0);
  const protectedHashes = read(`${fanoutDirectory}/protected-before.json`); checkHashes(protectedHashes);
  const planPath = `${fanoutDirectory}/plan.json`, plan = read(planPath), parent = read(parentPlanPath); assert.equal(plan.version, 1);
  assert.equal(plan.parentPlanPath, parentPlanPath); assert.equal(plan.parentPlanSha256, digest(readFileSync(parentPlanPath))); checkHashes(plan.sourceHashes);
  assert.equal(read(`${fanoutDirectory}/review-input.json`).planSha256, digest(readFileSync(planPath))); assert.deepEqual(plan.bounds, recipientFanoutBounds);
  const expected = parent.entries.map((e: any) => {
    const { donorAnchorNodeId, donorNodeIds } = e.selection.domain;
    return { id: e.id, case: e.case, family: e.family, donor: { donorAnchorNodeId, donorNodeIds },
      alternatives: enumerateRecipientAlternatives(e.topology, { donorAnchorNodeId, donorNodeIds }) };
  });
  assert.deepEqual(plan.entries, expected);
  const graph = read("data/tree-graph.json") as TreeGraph, benchmark = read("var/weighted-holdout-20261108/benchmark-v1/benchmark.json"), review = loadFanoutReview();
  const cases = heldoutCases(graph, benchmark.corpus);
  // Review every declared node before optimizing any case. No zero-reward cases
  // are filtered; production scores are only a separate ledger-consistency check.
  const contexts = plan.entries.map((entry: any) => {
    const source = parent.entries.find((e: any) => e.id === entry.id), item = cases.find((c) => c.key === entry.case)!; assert.ok(item && source);
    const row = benchmark.results.find((r: any) => r.case === entry.case && r.arm === "current" && r.seed === 1701 && r.limitMs === (entry.family === "warbringer-partial" ? 2000 : 60000)); assert.ok(row);
    assert.deepEqual(source.topology.incumbentNodeIds, row.selectedNodeIds); assert.equal(source.topology.pointLimit, Math.min(row.mainPointLimit, row.basePoints + row.pointBudget));
    assert.deepEqual(Object.fromEntries(item.profile.preferences.map((p) => [p.id, p.weight])),
      Object.fromEntries(Object.entries(review.profiles[entry.family]).map(([id, p]: [string, any]) => [id, p.weight])));
    const required = [...new Set([...item.request.baseNodeIds, ...item.request.goalNodeIds, ...(item.request.weaponSets?.attachmentNodeIds ?? [])])];
    assert.deepEqual([...required].sort(), [...source.topology.protectedNodeIds].sort());
    const ids = [...new Set<string>(entry.alternatives.domains.flatMap((d: BranchDomain) => d.variableNodeIds))];
    const reviewed = reviewedRewards({ family: entry.family, variableNodeIds: ids }, graph, review);
    const scoreCache = new Map<string, number>();
    for (const id of [...new Set([...ids, ...source.topology.incumbentNodeIds])]) scoreCache.set(id, scorePassiveNode(graph.nodes[id], item.profile.preferences));
    for (const node of reviewed.nodes) {
      const flags = item.request.graph.nodes[node.id]?.flags; assert.ok(flags && source.topology.eligibleNodeIds.includes(node.id));
      assert.ok(!item.build.weaponNodeIds.includes(node.id) && !required.includes(node.id) && !flags.classStart && !flags.ascendancy && !flags.mastery);
      assert.ok(!flags.keystone || source.topology.incumbentNodeIds.includes(node.id));
      assert.ok(Math.abs(scoreCache.get(node.id)! * review.unitsPerScore - node.units) < 1e-7, `Independent reward mismatch: ${node.id} ${entry.family}`);
    }
    for (const id of source.topology.incumbentNodeIds) if (id !== source.topology.rootNodeId) assert.ok(!graph.nodes[id].flags.classStart && !graph.nodes[id].flags.ascendancy);
    const score = (ids: string[]) => ids.filter((id) => !item.request.baseNodeIds.includes(id)).reduce((n, id) => n + scoreCache.get(id)!, 0);
    const incumbentScore = score(source.topology.incumbentNodeIds); assert.ok(Math.abs(incumbentScore - row.checkpoint.score) < 1e-7);
    const fixedNodeIds = source.topology.incumbentNodeIds.filter((id: string) => !entry.donor.donorNodeIds.includes(id));
    return { entry, source, item, reviewed, fixedNodeIds, score, incumbentScore };
  });
  const sourcePaths = [planPath, `${fanoutDirectory}/review-input.json`, "tools/research/recipient-fanout-plan.ts", "tools/research/recipient-fanout-audit.ts",
    "tools/research/recipient-fanout-test-context.ts", "tools/research/recipient-fanout-plan.check.mjs", "tools/research/recipient-fanout-reward-additions.json", ...Object.keys(protectedHashes)];
  const fingerprints = Object.fromEntries(sourcePaths.map((path) => [path, digest(readFileSync(path))]));
  mkdirSync(resolve(output));
  const sharedPath = resolve(output, "shared-contexts.json"), resultsPath = resolve(output, "results.jsonl");
  writeFileSync(sharedPath, JSON.stringify({ version: 1, parentPlanPath, parentPlanSha256: plan.parentPlanSha256, planSha256: digest(readFileSync(planPath)),
    contexts: contexts.map((c: any) => ({ id: c.entry.id, case: c.entry.case, family: c.entry.family, fixedNodeIds: c.fixedNodeIds,
      baseEdgeKeys: c.item.request.baseEdgeKeys, preferences: c.item.profile.preferences, rewardUnits: c.reviewed.rewardUnits, reviewedNodes: c.reviewed.nodes })) }, null, 2), { flag: "wx" });
  writeFileSync(resultsPath, "", { flag: "wx" });
  const summaries = [], counterexamples: string[] = [];
  let totalDone = 0;
  for (const context of contexts) {
    const { entry, source, item, fixedNodeIds, reviewed, score, incumbentScore } = context;
    const request = { ...item.request, mode: "shortest" as const, totalPointLimit: source.topology.pointLimit };
    const incumbent = rawAllocation(request, source.topology.incumbentNodeIds), incumbentCheck = auditHeldoutAllocation(request, incumbent, item.build);
    const summary = { id: entry.id, planned: entry.alternatives.domains.length, completed: 0, verified: 0, higherScore: 0, pointSavings: 0,
      positiveRecipientDomains: 0, zeroRecipientDomains: 0, negativeOnlyRecipientDomains: 0, states: 0, feasible: 0, witnesses: 0, primaryMs: 0, referenceMs: 0 };
    for (const domain of entry.alternatives.domains as BranchDomain[]) {
      const id = `${entry.id}--recipient-${domain.recipientNodeIds[0]}`;
      assert.match(id, /^[a-z0-9-]+$/);
      const input = fanoutInput(source.topology, domain, reviewed.rewardUnits, item.request.baseEdgeKeys);
      const witnessChecks = domain.witnesses.map((w) => {
        const route = rawAllocation(request, [...fixedNodeIds, ...w.selectedVariableNodeIds]), check = auditHeldoutAllocation(request, route, item.build);
        assert.equal(check.totalPoints, input.pointLimit); assert.ok(!check.overMainCap && !check.weaponOverlap.length && !check.detachedWeaponNodes.length);
        return { donorPoints: w.donorPoints, recipientPoints: w.recipientPoints, check };
      });
      const started = performance.now(), primary = enumerateStreamingNeighborhood(input, { maxStates, shouldStop: () => performance.now() - started >= maxMs });
      const primaryMs = performance.now() - started;
      let reference: ReturnType<typeof rawStreamingNeighborhoodReference> | null = null, referenceMs = 0;
      if (primary.status === "optimal") {
        const referenceStart = performance.now(); reference = rawStreamingNeighborhoodReference(input, { maxStates, shouldStop: () => performance.now() - referenceStart >= maxMs }); referenceMs = performance.now() - referenceStart;
        if (reference.status === "optimal") {
          assert.equal(primary.scoreUnits, reference.scoreUnits); assert.equal(primary.variablePoints, reference.variablePoints); assert.deepEqual(primary.bestVariableNodeIds, reference.bestVariableNodeIds);
        }
      }
      const bestIds = [...fixedNodeIds, ...primary.bestVariableNodeIds], winner = rawAllocation(request, bestIds), winnerCheck = auditHeldoutAllocation(request, winner, item.build);
      assert.equal(winnerCheck.totalPoints, primary.totalPoints); assert.ok(!winnerCheck.overMainCap && !winnerCheck.weaponOverlap.length && !winnerCheck.detachedWeaponNodes.length);
      const scoreGain = (primary.scoreUnits - primary.incumbentScoreUnits) / review.unitsPerScore, pointSaving = incumbentCheck.totalPoints - winnerCheck.totalPoints, winnerScore = score(bestIds);
      assert.ok(Math.abs(winnerScore - incumbentScore - scoreGain) < 1e-7);
      const recipientUnits = domain.recipientNodeIds.map((nodeId) => input.rewardUnits[nodeId]);
      const result = { id, contextId: entry.id, recipientFirstNodeId: domain.recipientNodeIds[0], status: primary.status !== "optimal" ? primary.status : reference!.status,
        verified: primary.status === "optimal" && reference?.status === "optimal", primary, reference, primaryMs, referenceMs, scoreGain, pointSaving,
        incumbentScore, winnerScore, winnerCheck, witnessChecks, recipientPositive: recipientUnits.some((n) => n > 0), recipientAllZero: recipientUnits.every((n) => n === 0),
        changed: { removed: input.incumbentNodeIds.filter((nodeId) => !bestIds.includes(nodeId)), added: bestIds.filter((nodeId) => !input.incumbentNodeIds.includes(nodeId)) } };
      appendFileSync(resultsPath, `${JSON.stringify(result)}\n`);
      summary.completed += 1; summary.verified += Number(result.verified); summary.higherScore += Number(scoreGain > 0); summary.pointSavings += Number(pointSaving > 0);
      summary.positiveRecipientDomains += Number(result.recipientPositive); summary.zeroRecipientDomains += Number(result.recipientAllZero);
      summary.negativeOnlyRecipientDomains += Number(!result.recipientPositive && !result.recipientAllZero);
      summary.states += primary.enumerated; summary.feasible += reference?.feasibleSubsets ?? 0; summary.witnesses += witnessChecks.length;
      summary.primaryMs += primaryMs; summary.referenceMs += referenceMs; totalDone += 1;
      if (result.verified && (scoreGain > 0 || pointSaving > 0)) {
        mkdirSync(resolve(output, "counterexamples"), { recursive: true });
        const path = resolve(output, "counterexamples", `${id}.json`);
        writeFileSync(path, JSON.stringify({ domain, input, result, winnerNodeIds: winner.totalNodeIds, winnerEdgeKeys: winner.totalEdgeKeys,
          meaning: "Offline local proxy counterexample; no production route applied." }, null, 2), { flag: "wx" });
        counterexamples.push(relative(resolve(), path).replaceAll("\\", "/"));
        console.log(JSON.stringify({ counterexample: id, scoreGain, pointSaving }));
      }
      if (totalDone % 25 === 0) console.log(`Verified ${totalDone} declared alternatives so far.`);
    }
    summaries.push(summary); console.log(JSON.stringify(summary));
  }
  checkHashes(fingerprints);
  writeFileSync(resolve(output, "audit.json"), JSON.stringify({ version: 1, capturedAt: new Date().toISOString(), node: process.version,
    planSha256: digest(readFileSync(planPath)), fingerprints, resultFiles: { "shared-contexts.json": digest(readFileSync(sharedPath)), "results.jsonl": digest(readFileSync(resultsPath)) },
    contexts: summaries, counterexamples, counterexampleHashes: Object.fromEntries(counterexamples.map((p) => [p, digest(readFileSync(p))])), maxMsPerPhase: maxMs, maxStatesPerPhase: maxStates,
    meaning: "All declared bounded recipients for four frozen donors, not all possible donors or whole-tree optimality. Exact only for rows where both independent solvers complete and agree. Original goals/base/weapon attachments and outside nodes fixed; reviewed additive proxy objective, not Full DPS. No route applied; cancelled/limited rows are not certificates." }, null, 2), { flag: "wx" });
  return summaries;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { prepare: { type: "boolean" }, output: { type: "string", default: `${fanoutDirectory}/audit-v1` }, "max-ms": { type: "string", default: "300000" }, "max-states": { type: "string", default: String(2 ** 24) } } });
  if (values.prepare) prepareRecipientFanout(); else runRecipientFanout(values.output!, Number(values["max-ms"]), Number(values["max-states"]));
}

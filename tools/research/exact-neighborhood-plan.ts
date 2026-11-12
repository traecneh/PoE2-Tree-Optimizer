import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { heldoutCases, type HoldoutCorpus } from "./heldout-weighted-corpus";
import { digest } from "./imported-weighted-corpus";
import type { TreeGraph } from "../../src/tree/types";

export const exactAuditDirectory = "var/exact-neighborhoods-20261108";
export type NeighborhoodPlan = {
  id: string; case: string; policy: string; centerNodeId: string; radius: number; variableNodeIds: string[];
  incumbentNodeIds: string[]; incumbentEdgeKeys: string[]; protectedNodeIds: string[]; baseEdgeKeys: string[];
  rootNodeId: string; pointLimit: number; mainPointLimit: number; family: string;
};
const numeric = (a: string, b: string) => Number(a) - Number(b);

export function createNeighborhoodPlan(graph: TreeGraph, benchmark: any) {
  const corpus = benchmark.corpus as HoldoutCorpus, cases = heldoutCases(graph, corpus), plans: NeighborhoodPlan[] = [];
  const unavailable: { family: string; policy: string; centersConsidered: number; reason: string }[] = [];
  const keys = ["spectres/minion-offence/prefix20/available", "wolfpack/companion-offence/prefix20/available",
    "chaos-dot/chaos-duration/prefix20/available", "warbringer-partial/life-armour/prefix20/available"];
  for (const key of keys) {
    const item = cases.find((c) => c.key === key)!;
    const row = benchmark.results.find((r: any) => r.case === key && r.arm === "current" && r.seed === 1701 && r.limitMs === (key.startsWith("warbringer") ? 2000 : 60000));
    assert.ok(row?.selectedNodeIds && row.checkpoint);
    const request = item.request, selected = new Set<string>(row.selectedNodeIds), reserved = new Set([...(request.excludedNodeIds ?? []),
      ...(request.weaponSets?.allocations[1] ?? []), ...(request.weaponSets?.allocations[2] ?? [])]);
    const protectedIds = new Set([...request.baseNodeIds, ...request.goalNodeIds, ...(request.weaponSets?.attachmentNodeIds ?? [])]);
    const adjacency = new Map(Object.keys(request.graph.nodes).map((id) => [id, [] as string[]]));
    for (const { from, to } of request.graph.edges) if (adjacency.has(from) && adjacency.has(to)) { adjacency.get(from)!.push(to); adjacency.get(to)!.push(from); }
    for (const values of adjacency.values()) values.sort(numeric);
    const allowed = (id: string) => {
      const flags = request.graph.nodes[id]?.flags;
      return flags && !reserved.has(id) && !flags.ascendancy && !flags.classStart && !flags.mastery && (!flags.keystone || selected.has(id));
    };
    const degree = new Map([...selected].map((id) => [id, 0]));
    for (const key of row.selectedEdgeKeys) for (const id of key.split("::")) degree.set(id, (degree.get(id) ?? 0) + 1);
    const family = item.build.id;
    const relevant = family === "spectres" ? /Minions/i : family === "wolfpack" ? /Companions|Minions/i
      : family === "chaos-dot" ? /Chaos Damage|Damage over Time|Skill Effect Duration/i : /maximum Life|Armour/i;
    const centers = [...selected].filter((id) => allowed(id) && !protectedIds.has(id)).sort(numeric);
    const seen = new Set<string>();
    for (const policy of ["junction", "travel", "effect-frontier"]) {
      let found = false, centersConsidered = 0;
      for (const center of centers) {
        if (policy === "junction" && degree.get(center)! < 3 || policy === "travel" && degree.get(center) !== 2
          || policy === "effect-frontier" && !adjacency.get(center)!.some((id) => !selected.has(id) && allowed(id) && relevant.test(graph.nodes[id].stats.join(" ")))) continue;
        centersConsidered += 1;
        const distances = new Map([[center, 0]]), queue = [center];
        for (let i = 0; i < queue.length; i += 1) {
          if (distances.get(queue[i])! === 3) continue;
          for (const next of adjacency.get(queue[i])!) if (!distances.has(next) && (allowed(next) || protectedIds.has(next))) {
            distances.set(next, distances.get(queue[i])! + 1); queue.push(next);
          }
        }
        let chosen: { ids: string[]; radius: number } | undefined;
        for (const radius of [2, 3]) {
          const ids = [...distances.keys()].filter((id) => distances.get(id)! <= radius && allowed(id) && !protectedIds.has(id)).sort(numeric);
          if (ids.length >= 8 && ids.length <= 18 && ids.filter((id) => selected.has(id)).length >= 2 && ids.filter((id) => !selected.has(id)).length >= 2) { chosen = { ids, radius }; break; }
        }
        if (!chosen || seen.has(chosen.ids.join("|"))) continue;
        seen.add(chosen.ids.join("|"));
        plans.push({ id: `${family}-${policy}`, case: key, policy, centerNodeId: center, radius: chosen.radius, variableNodeIds: chosen.ids,
          incumbentNodeIds: [...row.selectedNodeIds], incumbentEdgeKeys: [...row.selectedEdgeKeys], protectedNodeIds: [...protectedIds].sort(numeric),
          baseEdgeKeys: [...request.baseEdgeKeys], rootNodeId: request.rootNodeId!, pointLimit: Math.min(row.mainPointLimit, row.basePoints + row.pointBudget),
          mainPointLimit: row.mainPointLimit, family });
        found = true;
        break;
      }
      if (!found) unavailable.push({ family, policy, centersConsidered,
        reason: "No unique complete eligible radius-2/3 ball with 8..18 variables, at least two incumbent and two unallocated nodes." });
    }
  }
  assert.equal(plans.length + unavailable.length, 12);
  return { plans, unavailable };
}

export function prepareNeighborhoodPlan() {
  const raw = readFileSync("data/tree-graph.json", "utf8"), graph = JSON.parse(raw) as TreeGraph;
  const source = readFileSync("var/weighted-holdout-20261108/benchmark-v1/benchmark.json", "utf8"), benchmark = JSON.parse(source);
  assert.equal(benchmark.corpus.graphSha256, digest(raw));
  const { plans, unavailable } = createNeighborhoodPlan(graph, benchmark);
  const nodeIds = [...new Set(plans.flatMap((p) => p.variableNodeIds))].sort(numeric);
  const stats = [...new Set(nodeIds.flatMap((id) => graph.nodes[id].stats))].sort();
  mkdirSync(exactAuditDirectory, { recursive: true });
  const plan = { version: 1, graphSha256: digest(raw), benchmarkSha256: digest(source), policy: "Four saved current/1701 contexts; first eligible numeric-ID junction, travel and effect-frontier centers; complete eligible radius-2 ball, radius-3 fallback, 8..18 variables; protected/base/goals/weapon attachments remain fixed. No optimizer score is used for selection.", plans, unavailable };
  writeFileSync(`${exactAuditDirectory}/plan.json`, JSON.stringify(plan, null, 2), { flag: "wx" });
  writeFileSync(`${exactAuditDirectory}/review-input.json`, JSON.stringify({ stats, nodes: nodeIds.map((id) => ({ id, name: graph.nodes[id].name, stats: graph.nodes[id].stats })) }, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ plans: plans.map((p) => ({ id: p.id, center: p.centerNodeId, radius: p.radius, variables: p.variableNodeIds.length,
    selectedVariables: p.variableNodeIds.filter((id) => p.incumbentNodeIds.includes(id)).length })), unavailable, uniqueNodes: nodeIds.length, statLines: stats.length, stats }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepareNeighborhoodPlan();

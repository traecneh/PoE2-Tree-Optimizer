import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { buildClassStartOptions, resolveClassStartOptionFromPobMetadata } from "../../src/tree/classStartAliases";
import { decodePobBuildCode, importBuildGoalsFromPobCode } from "../../src/tree/pobBuildImport";
import { sanitizeAscendancyAllocationNodeIds } from "../../src/app/ascendancyAllocation";
import { sanitizeWeaponSetAllocations } from "../../src/app/weaponSetAllocation";
import { treeEdgeKey } from "../../src/tree/pathAllocation";
import type { BuildGoalsOptimizeRequest, BuildGoalsOptimizeResult } from "../../src/tree/buildGoalsOptimizer";
import type { TreeGraph } from "../../src/tree/types";
import { corpusDirectory, digest, importedRequest, independentAllocationCheck, type Corpus, type CorpusBuild, type Profile } from "./imported-weighted-corpus";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
export const holdoutDirectory = "var/weighted-holdout-20261108/corpus-v1";
export const holdoutSources = [
  { share: "22c49", id: "spectres", label: "Spectre Infernalist", expectedSkill: "Spectre: Vaal Guard", decision: "included" },
  { share: "1c254", id: "wolfpack", label: "Wolf Pack Lich", expectedSkill: "Wolf Pack", decision: "included" },
  { share: "27c94", id: "chaos-dot", label: "Essence Drain/Contagion Lich", expectedSkill: "Essence Drain", decision: "included" },
  { share: "20eb3", decision: "eligible-unused" },
  ...["108a0", "2b4f9", "1bce2", "1bafc", "1d3b5", "298af", "2868b"].map((share) => ({ share, decision: "blocked" })),
];
const lock = JSON.parse(readFileSync(new URL("./heldout-weighted-sources.lock.json", import.meta.url), "utf8")) as Record<string, string>;
const profiles: Record<string, Profile[]> = {
  spectres: [
    { id: "minion-offence", preferences: [{ id: "minionDamage", weight: 2 }, { id: "minionSpeed", weight: 1 }] },
    { id: "minion-life-reservation", preferences: [{ id: "minionLife", weight: 2 }, { id: "minionReservationEfficiency", weight: 1 }] },
  ],
  wolfpack: [
    { id: "companion-offence", preferences: [{ id: "companionDamage", weight: 2 }, { id: "companionAttackSpeed", weight: 1 }, { id: "minionDamage", weight: 1 }] },
    { id: "companion-life-reservation", preferences: [{ id: "companionLife", weight: 2 }, { id: "companionReservationEfficiency", weight: 1 }, { id: "minionLife", weight: 1 }] },
  ],
  "chaos-dot": [
    { id: "chaos-duration", preferences: [{ id: "chaosDamage", weight: 2 }, { id: "damageOverTime", weight: 2 }, { id: "skillDuration", weight: 1 }] },
    { id: "es-duration", preferences: [{ id: "energyShield", weight: 2 }, { id: "skillDuration", weight: 1 }, { id: "chaosResistance", weight: 1 }] },
  ],
};
export type Prefix = { nodeIds: string[]; edgeKeys: string[]; paidPoints: number };
export type HoldoutCorpus = {
  version: 1; graphSha256: string; legacyCorpusSha256: string; capturedAt: string;
  builds: CorpusBuild[]; prefixes: Record<string, Prefix>;
  reviewed: { share: string; sourceUrl: string; decision: string; codeSha256: string; xmlSha256: string; preflight: unknown; activeSkillNames: string[] }[];
};

export function originalTreePrefix(graph: TreeGraph, build: CorpusBuild, paidPoints = 20): Prefix {
  assert.ok(Number.isInteger(paidPoints) && paidPoints > 0);
  const allowed = new Set((build.preflight as { sharedNodeIds: string[] }).sharedNodeIds);
  assert.ok(allowed.has(build.rootNodeId));
  const adjacency = new Map([...allowed].map((id) => [id, [] as string[]]));
  for (const { from, to } of graph.edges) if (allowed.has(from) && allowed.has(to)) { adjacency.get(from)!.push(to); adjacency.get(to)!.push(from); }
  for (const next of adjacency.values()) next.sort((a, b) => Number(a) - Number(b));
  const nodeIds = [build.rootNodeId], edges: string[] = [], seen = new Set(nodeIds);
  for (let i = 0; i < nodeIds.length && nodeIds.length <= paidPoints; i += 1) for (const next of adjacency.get(nodeIds[i])!) {
    if (seen.has(next) || graph.nodes[next].flags.ascendancy || graph.nodes[next].flags.classStart || build.weaponNodeIds.includes(next)) continue;
    seen.add(next); nodeIds.push(next); edges.push(treeEdgeKey(nodeIds[i], next));
    if (nodeIds.length === paidPoints + 1) break;
  }
  assert.equal(nodeIds.length, paidPoints + 1, "Original connected tree is too small for this prefix");
  return { nodeIds, edgeKeys: edges, paidPoints };
}

export async function prepareHoldoutCorpus(graph: TreeGraph, graphSha256: string): Promise<HoldoutCorpus> {
  const { inspectPobImport } = await import("../pob-evaluation/import_preflight.mjs");
  assert.ok(!existsSync(holdoutDirectory), "Holdout corpus is immutable; create a reviewed new version instead");
  const builds: CorpusBuild[] = [], reviewed: HoldoutCorpus["reviewed"] = [];
  const captures: { share: string; code: string; xml: string; record: unknown }[] = [];
  for (const source of holdoutSources) {
    const local = `var/weighted-holdout-20261108/candidates/${source.share}.txt`;
    let code: string;
    if (existsSync(local)) code = readFileSync(local, "utf8");
    else { const response = await fetch(`https://poe.ninja/poe2/pob/raw/${source.share}`, { signal: AbortSignal.timeout(20_000) }); assert.ok(response.ok); code = await response.text(); }
    assert.ok(code.length < 500_000); assert.equal(digest(code), lock[source.share], "Mutable public share differs from reviewed bytes");
    const xml = decodePobBuildCode(code), imported = importBuildGoalsFromPobCode(code, graph), preflight = inspectPobImport(xml, graph);
    const dom = new JSDOM(xml, { contentType: "text/xml" }), document = dom.window.document;
    const active = document.querySelector("Skills")?.getAttribute("activeSkillSet") ?? "1";
    const skillSet = [...document.querySelectorAll("Skills > SkillSet") as Iterable<Element>].find((set) => set.getAttribute("id") === active);
    const activeSkillNames = [...skillSet?.querySelectorAll("Gem") ?? []].filter((gem: Element) => gem.getAttribute("enabled") !== "false")
      .map((gem: Element) => gem.getAttribute("nameSpec") ?? "").filter(Boolean);
    dom.window.close();
    const record = { share: source.share, sourceUrl: `https://poe.ninja/poe2/pob/${source.share}`, decision: source.decision,
      codeSha256: digest(code), xmlSha256: digest(xml), preflight, activeSkillNames };
    reviewed.push(record); captures.push({ share: source.share, code, xml, record: { ...record, imported } });
    if (source.decision === "blocked") { assert.equal(preflight.status, "blocked"); continue; }
    assert.equal(preflight.status, "ready_for_audit");
    if (!("id" in source) || source.decision !== "included") continue;
    assert.equal(imported.missingNodeIds.length, 0); assert.ok(activeSkillNames.includes(source.expectedSkill!));
    if (source.id === "chaos-dot") assert.ok(activeSkillNames.includes("Contagion"));
    const resolved = resolveClassStartOptionFromPobMetadata(buildClassStartOptions(graph), imported);
    assert.ok(resolved.kind === "matched" && resolved.source === "metadata");
    const start = resolved.option, weapons = sanitizeWeaponSetAllocations({ 1: imported.weaponSet1NodeIds, 2: imported.weaponSet2NodeIds }, graph);
    const shared = imported.allocatedNodeIds.filter((id) => !graph.nodes[id].flags.classStart && !graph.nodes[id].flags.ascendancy);
    builds.push({ id: source.id!, label: source.label!, sourceUrl: record.sourceUrl, codeSha256: digest(code), xmlSha256: digest(xml),
      className: imported.className!, pathStart: start.label, rootNodeId: start.nodeId, activeSpecTitle: imported.activeSpecTitle,
      originalBasePoints: imported.pobBasePassivePointCount, originalSharedPoints: shared.length, goalNodeIds: [...imported.goalNodeIds],
      visibility: { selectedAscendancyId: start.ascendancy?.id, allocatedAscendancyNodeIds: sanitizeAscendancyAllocationNodeIds(imported.ascendancyNodeIds, graph, start.ascendancy) },
      weaponNodeIds: [...new Set([...weapons[1], ...weapons[2]])], weaponSets: weapons, mainPointLimit: 123 - Math.max(weapons[1].length, weapons[2].length),
      ignored: {}, profiles: profiles[source.id!], preflight });
  }
  const legacyText = readFileSync(`${corpusDirectory}/corpus.json`, "utf8"), legacy = JSON.parse(legacyText) as Corpus;
  assert.equal(legacy.graphSha256, graphSha256);
  const warbringer = legacy.builds.find((build) => build.id === "warbringer")!;
  builds.push({ ...warbringer, id: "warbringer-partial", profiles: [warbringer.profiles[0]] });
  const corpus: HoldoutCorpus = { version: 1, graphSha256, legacyCorpusSha256: digest(legacyText), capturedAt: new Date().toISOString(),
    builds, prefixes: Object.fromEntries(builds.map((build) => [build.id, originalTreePrefix(graph, build)])), reviewed };
  mkdirSync(`${holdoutDirectory}/captured`, { recursive: true });
  for (const capture of captures) for (const [extension, value] of [["txt", capture.code], ["xml", capture.xml], ["json", JSON.stringify(capture.record, null, 2)]]) {
    writeFileSync(`${holdoutDirectory}/captured/${capture.share}.${extension}`, value, { flag: "wx" });
  }
  writeFileSync(`${holdoutDirectory}/corpus.json`, JSON.stringify(corpus, null, 2), { flag: "wx" });
  return corpus;
}

export function heldoutCases(graph: TreeGraph, corpus: HoldoutCorpus) {
  return corpus.builds.flatMap((build) => build.profiles.flatMap((profile) => (build.id === "warbringer-partial" ? ["prefix20"] : ["root", "prefix20"])
    .flatMap((base) => (["tight", "available"] as const).map((budget) => {
      const request = importedRequest(graph, build, profile, budget);
      if (base === "prefix20") { const prefix = corpus.prefixes[build.id]; request.baseNodeIds = [...prefix.nodeIds]; request.baseEdgeKeys = [...prefix.edgeKeys]; }
      return { key: `${build.id}/${profile.id}/${base}/${budget}`, build, profile, base, budget, request };
    }))));
}

export function auditHeldoutAllocation(request: BuildGoalsOptimizeRequest, result: BuildGoalsOptimizeResult, build: CorpusBuild) {
  const legacy = independentAllocationCheck(request, result, build);
  const paid = (ids: string[]) => ids.filter((id) => !request.graph.nodes[id].flags.classStart && !request.graph.nodes[id].flags.ascendancy).length;
  const basePoints = paid(request.baseNodeIds), totalPoints = paid(result.totalNodeIds);
  assert.equal(totalPoints - basePoints, result.pointCost);
  for (const edge of request.baseEdgeKeys) assert.ok(result.totalEdgeKeys.includes(edge), "Committed base edge lost");
  return { ...legacy, overMainCap: totalPoints > build.mainPointLimit, basePoints, totalPoints };
}

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { buildClassStartOptions, resolveClassStartOptionFromPobMetadata } from "../../src/tree/classStartAliases";
import { decodePobBuildCode, importBuildGoalsFromPobCode } from "../../src/tree/pobBuildImport";
import { sanitizeAscendancyAllocationNodeIds } from "../../src/app/ascendancyAllocation";
import { sanitizeWeaponSetAllocations } from "../../src/app/weaponSetAllocation";
import { filterVisibleTreeGraph } from "../../src/tree/treeVisibility";
import { createBuildGoalsValidation } from "../../src/tree/buildGoalsValidation";
import type { BuildGoalsOptimizeRequest, BuildGoalsOptimizeResult } from "../../src/tree/buildGoalsOptimizer";
import type { PassivePreference } from "../../src/tree/passivePreferences";
import type { TreeGraph } from "../../src/tree/types";
import { deriveWeaponAttachments } from "../../src/tree/allocationConstraints";

export const corpusDirectory = "var/weighted-corpus-20261108";
export const publicSources = [
  { id: "spark", share: "28df3", input: "var/pob-real-build-audit-20261107/phoenix-code.txt", label: "Spark Stormweaver, endgame", accepted: true },
  { id: "warbringer", share: "2b47e", input: "var/pob-second-build-audit-20261107/sources/warbringer.txt", label: "Earthshatter totem Warbringer, endgame", accepted: true },
  { id: "huntress", share: "1e9d0", input: `${corpusDirectory}/inputs/1e9d0.txt`, label: "Rarity/support Ritualist, endgame", accepted: true },
  { id: "monk", share: "1c002", input: `${corpusDirectory}/inputs/1c002.txt`, label: "Martial Artist, progression", accepted: true },
  { id: "tactician-blocked", share: "1dc96", input: `${corpusDirectory}/inputs/1dc96.txt`, label: "Tactician, transformed passives", accepted: false },
  { id: "invoker-blocked", share: "2560b", input: `${corpusDirectory}/inputs/2560b.txt`, label: "Ice Nova Invoker, invalid socket reference", accepted: false },
  { id: "old-monk-blocked", share: "1bf9e", input: `${corpusDirectory}/inputs/1bf9e.txt`, label: "Monk, older tree", accepted: false },
] as const;

export type Profile = { id: string; preferences: PassivePreference[] };
const profiles: Record<string, Profile[]> = {
  spark: [{ id: "es-mana", preferences: [{ id: "energyShield", weight: 2 }, { id: "mana", weight: 1 }] },
    { id: "spell-cast", preferences: [{ id: "spellDamage", weight: 2 }, { id: "castSpeed", weight: 1 }] }],
  warbringer: [{ id: "life-armour", preferences: [{ id: "life", weight: 2 }, { id: "armour", weight: 1 }] },
    { id: "totems", preferences: [{ id: "totemDamage", weight: 2 }, { id: "totemAttackSpeed", weight: 1 }, { id: "totemPlacementSpeed", weight: 1 }] }],
  huntress: [{ id: "evasion-life", preferences: [{ id: "evasion", weight: 2 }, { id: "life", weight: 1 }] },
    { id: "attributes-presence", preferences: [{ id: "attributes", weight: 1 }, { id: "presenceArea", weight: 1 }] }],
  monk: [{ id: "evasion-life", preferences: [{ id: "evasion", weight: 1 }, { id: "life", weight: 1 }] },
    { id: "attack-speed", preferences: [{ id: "attackDamage", weight: 2 }, { id: "attackSpeed", weight: 1 }] }],
};
export type CorpusBuild = {
  id: string; label: string; sourceUrl: string; codeSha256: string; xmlSha256: string;
  className: string; pathStart: string; rootNodeId: string; activeSpecTitle?: string;
  originalBasePoints: number; originalSharedPoints: number; goalNodeIds: string[];
  visibility: NonNullable<BuildGoalsOptimizeRequest["visibility"]>;
  weaponNodeIds: string[]; weaponSets: { 1: string[]; 2: string[] }; mainPointLimit: number;
  ignored: Record<string, number>; profiles: Profile[]; preflight: unknown;
};
export type Corpus = { capturedAt: string; graphSha256: string; builds: CorpusBuild[]; excluded: unknown[] };
export const digest = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
const sourceLock = JSON.parse(readFileSync(new URL("./imported-weighted-sources.lock.json", import.meta.url), "utf8")) as Record<string, string>;

export async function prepareImportedCorpus(graph: TreeGraph, graphSha256: string): Promise<Corpus> {
  const { inspectPobImport } = await import("../pob-evaluation/import_preflight.mjs");
  const builds: CorpusBuild[] = [], excluded: unknown[] = [];
  mkdirSync(`${corpusDirectory}/captured`, { recursive: true });
  for (const source of publicSources) {
    let code: string;
    if (existsSync(source.input)) code = readFileSync(source.input, "utf8");
    else {
      const response = await fetch(`https://poe.ninja/poe2/pob/raw/${source.share}`, { signal: AbortSignal.timeout(15_000) });
      assert.ok(response.ok, `${source.id}: export download failed (${response.status})`);
      code = await response.text(); assert.ok(code.length < 500_000, "Unexpectedly large public export");
    }
    assert.equal(digest(code), sourceLock[source.id], `${source.id}: public source changed; review and deliberately refresh its lock`);
    const xml = decodePobBuildCode(code), imported = importBuildGoalsFromPobCode(code, graph);
    const preflight = inspectPobImport(xml, graph);
    const sourceUrl = `https://poe.ninja/poe2/pob/${source.share}`;
    const capture = { id: source.id, label: source.label, sourceUrl, codeSha256: digest(code), xmlSha256: digest(xml),
      imported, preflight };
    // Re-capture is idempotent only for identical bytes; public shares are mutable.
    for (const [extension, text] of [["txt", code], ["xml", xml]] as const) {
      const path = `${corpusDirectory}/captured/${source.id}.${extension}`;
      try { writeFileSync(path, text, { flag: "wx" }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST" || readFileSync(path, "utf8") !== text) throw error; }
    }
    writeFileSync(`${corpusDirectory}/captured/${source.id}.json`, JSON.stringify(capture, null, 2));
    if (!source.accepted) { assert.equal(preflight.status, "blocked", `${source.id}: exclusion reason changed`); excluded.push(capture); continue; }
    assert.equal(preflight.status, "ready_for_audit", `${source.id}: compatibility blocker; inspect captured report`);
    assert.equal(imported.missingNodeIds.length, 0, `${source.id}: missing allocated nodes`);
    const resolution = resolveClassStartOptionFromPobMetadata(buildClassStartOptions(graph), imported);
    assert.ok(resolution.kind === "matched" && resolution.source === "metadata", `${source.id}: ambiguous start`);
    const selected = resolution.option;
    const asc = sanitizeAscendancyAllocationNodeIds(imported.ascendancyNodeIds, graph, selected.ascendancy);
    const weaponSets = sanitizeWeaponSetAllocations({ 1: imported.weaponSet1NodeIds, 2: imported.weaponSet2NodeIds }, graph);
    const ignored: Record<string, number> = {};
    for (const detail of imported.ignoredNodeDetails) ignored[detail.reason] = (ignored[detail.reason] ?? 0) + 1;
    const shared = imported.allocatedNodeIds.filter((id) => !graph.nodes[id].flags.classStart && !graph.nodes[id].flags.ascendancy);
    builds.push({ id: source.id, label: source.label, sourceUrl, codeSha256: digest(code), xmlSha256: digest(xml),
      className: imported.className!, pathStart: selected.label, rootNodeId: selected.nodeId, activeSpecTitle: imported.activeSpecTitle,
      originalBasePoints: imported.pobBasePassivePointCount, originalSharedPoints: shared.length, goalNodeIds: imported.goalNodeIds,
      visibility: { selectedAscendancyId: selected.ascendancy?.id, allocatedAscendancyNodeIds: asc },
      weaponNodeIds: [...new Set([...weaponSets[1], ...weaponSets[2]])], weaponSets,
      mainPointLimit: 123 - Math.max(weaponSets[1].length, weaponSets[2].length), ignored, profiles: profiles[source.id], preflight });
  }
  assert.equal(new Set(builds.map((build) => build.rootNodeId)).size, 4, "Corpus must retain four distinct roots");
  const corpus = { capturedAt: new Date().toISOString(), graphSha256, builds, excluded };
  writeFileSync(`${corpusDirectory}/corpus.json`, JSON.stringify(corpus, null, 2));
  return corpus;
}

export const budgetModes = ["tight", "extra-5", "available"] as const;
export type BudgetMode = typeof budgetModes[number];
export function importedRequest(graph: TreeGraph, build: CorpusBuild, profile: Profile, budget: BudgetMode): BuildGoalsOptimizeRequest {
  const shared = (build.preflight as { sharedNodeIds: string[] }).sharedNodeIds;
  const weaponSets = build.weaponNodeIds.length ? { allocations: build.weaponSets,
    attachmentNodeIds: deriveWeaponAttachments(graph, shared, build.weaponSets, build.rootNodeId) } : undefined;
  return { graph: filterVisibleTreeGraph(graph, build.visibility), allocationPool: "main", rootNodeId: build.rootNodeId,
    baseNodeIds: [build.rootNodeId], baseEdgeKeys: [], goalNodeIds: [...build.goalNodeIds], visibility: build.visibility,
    mode: "weighted", preferences: profile.preferences, extraPointBudget: budget === "tight" ? 0 : 5,
    totalPointLimit: build.mainPointLimit, weaponSets,
    ...(budget === "available" ? { pointBudgetMode: "all-available" } : {}) };
}

export type Event = { ms: number; score: number; points: number; overMainCap: boolean; weaponOverlap: string[]; detachedWeaponNodes: string[] };
export function independentAllocationCheck(request: BuildGoalsOptimizeRequest, result: BuildGoalsOptimizeResult, build: CorpusBuild) {
  const selected = new Set(result.totalNodeIds), base = new Set(request.baseNodeIds);
  assert.equal(selected.size, result.totalNodeIds.length);
  for (const id of [...base, ...request.goalNodeIds, ...(request.weaponSets?.attachmentNodeIds ?? [])]) assert.ok(selected.has(id), `Required node lost: ${id}`);
  const added = [...selected].filter((id) => !base.has(id));
  assert.equal(added.length, result.pointCost);
  assert.deepEqual([...result.addedNodeIds].sort(), added.sort());
  const edges = result.totalEdgeKeys.map((key) => key.split("::"));
  for (const [a, b] of edges) {
    assert.ok(selected.has(a) && selected.has(b));
    assert.ok(request.graph.edges.some((edge) => edge.from === a && edge.to === b || edge.from === b && edge.to === a));
  }
  const walk = (nodes: Set<string>, pairs: string[][]) => {
    const seen = new Set([request.rootNodeId!]); let changed = true;
    while (changed) { changed = false; for (const [a, b] of pairs) {
      if (!nodes.has(a) || !nodes.has(b)) continue;
      if (seen.has(a) && !seen.has(b)) { seen.add(b); changed = true; }
      if (seen.has(b) && !seen.has(a)) { seen.add(a); changed = true; }
    } }
    return seen;
  };
  assert.equal(walk(selected, edges).size, selected.size, "Disconnected main route");
  assert.deepEqual(createBuildGoalsValidation(request).validateResult(result), []);
  const detachedWeaponNodes: string[] = [];
  for (const ids of [build.weaponSets[1], build.weaponSets[2]]) {
    const combined = new Set([...selected, ...ids]);
    const all = request.graph.edges.filter((edge) => combined.has(edge.from) && combined.has(edge.to)).map((edge) => [edge.from, edge.to]);
    const reached = walk(combined, all); detachedWeaponNodes.push(...ids.filter((id) => !reached.has(id)));
  }
  return { overMainCap: result.pointCost > build.mainPointLimit,
    weaponOverlap: build.weaponNodeIds.filter((id) => selected.has(id)), detachedWeaponNodes: [...new Set(detachedWeaponNodes)] };
}

export function atCheckpoint(events: Event[], ms: number): Event | undefined {
  return events.filter((event) => event.ms <= ms).at(-1);
}
export function compareQuality(a: Event | undefined, b: Event | undefined): number | undefined {
  if (!a || !b) return undefined;
  const delta = b.score - a.score;
  return Math.abs(delta) > 1e-9 ? Math.sign(delta) : Math.sign(a.points - b.points);
}

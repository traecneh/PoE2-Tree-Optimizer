import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { auditHeldoutAllocation, heldoutCases, holdoutDirectory, originalTreePrefix, prepareHoldoutCorpus } = await tsImport("./heldout-weighted-corpus.ts", import.meta.url);
const { digest, corpusDirectory, independentAllocationCheck } = await tsImport("./imported-weighted-corpus.ts", import.meta.url);
const { importBuildGoalsFromPobCode, decodePobBuildCode } = await tsImport("../../src/tree/pobBuildImport.ts", import.meta.url);
const { createBuildGoalsValidation } = await tsImport("../../src/tree/buildGoalsValidation.ts", import.meta.url);
const { validationGraph } = await tsImport("../../src/tree/buildGoalsValidation.fixtures.ts", import.meta.url);
const corpus = JSON.parse(readFileSync(`${holdoutDirectory}/corpus.json`, "utf8"));
const graphText = readFileSync("data/tree-graph.json", "utf8"), graph = JSON.parse(graphText);
const cases = heldoutCases(graph, corpus);

test("versioned holdout and legacy graph/corpus bytes remain locked", () => {
  assert.equal(corpus.version, 1); assert.equal(corpus.graphSha256, digest(graphText));
  assert.equal(corpus.legacyCorpusSha256, digest(readFileSync(`${corpusDirectory}/corpus.json`)));
  assert.equal(corpus.builds.length, 4); assert.equal(cases.length, 26);
  assert.equal(new Set(cases.map((c) => c.key)).size, 26);
});

test("all reviewed exports retain exact code/XML hashes and explicit inclusion decisions", () => {
  const lock = JSON.parse(readFileSync("tools/research/heldout-weighted-sources.lock.json", "utf8"));
  assert.equal(corpus.reviewed.length, 11);
  for (const reviewed of corpus.reviewed) {
    const code = readFileSync(`${holdoutDirectory}/captured/${reviewed.share}.txt`, "utf8");
    const xml = readFileSync(`${holdoutDirectory}/captured/${reviewed.share}.xml`, "utf8");
    assert.equal(digest(code), reviewed.codeSha256); assert.equal(digest(code), lock[reviewed.share]);
    assert.equal(decodePobBuildCode(code), xml); assert.equal(digest(xml), reviewed.xmlSha256);
    assert.equal(reviewed.preflight.status, reviewed.decision === "blocked" ? "blocked" : "ready_for_audit");
  }
  assert.equal(corpus.reviewed.filter((r) => r.decision === "blocked").length, 7);
  assert.equal(corpus.reviewed.filter((r) => r.decision === "eligible-unused").length, 1);
});

test("new included builds use their selected skill sets and exact unmodified imported goals", () => {
  for (const [id, skill] of [["spectres", "Spectre: Vaal Guard"], ["wolfpack", "Wolf Pack"], ["chaos-dot", "Essence Drain"]]) {
    const build = corpus.builds.find((b) => b.id === id), reviewed = corpus.reviewed.find((r) => r.sourceUrl === build.sourceUrl);
    const imported = importBuildGoalsFromPobCode(readFileSync(`${holdoutDirectory}/captured/${reviewed.share}.txt`, "utf8"), graph);
    assert.deepEqual(imported.goalNodeIds, build.goalNodeIds); assert.equal(imported.className, build.className);
    assert.equal(imported.missingNodeIds.length, 0); assert.ok(reviewed.activeSkillNames.includes(skill));
    if (id === "chaos-dot") assert.ok(reviewed.activeSkillNames.includes("Contagion"));
    assert.equal(reviewed.preflight.selection.treeVersion, "0_5");
  }
});

test("prefixes are deterministic connected 20-point subsets of the original shared allocations", () => {
  for (const build of corpus.builds) {
    const prefix = corpus.prefixes[build.id], allowed = new Set(build.preflight.sharedNodeIds);
    assert.deepEqual(originalTreePrefix(graph, build), prefix);
    assert.equal(prefix.nodeIds[0], build.rootNodeId); assert.equal(prefix.nodeIds.length, 21); assert.equal(prefix.edgeKeys.length, 20);
    assert.equal(new Set(prefix.nodeIds).size, 21); assert.equal(prefix.paidPoints, 20);
    const seen = new Set([build.rootNodeId]);
    for (const id of prefix.nodeIds) { assert.ok(allowed.has(id)); assert.ok(!graph.nodes[id].flags.ascendancy); assert.ok(!build.weaponNodeIds.includes(id)); }
    for (let pass = 0; pass < prefix.nodeIds.length; pass += 1) for (const key of prefix.edgeKeys) {
      const [a, b] = key.split("::"); assert.ok(graph.edges.some((e) => e.from === a && e.to === b || e.from === b && e.to === a));
      if (seen.has(a)) seen.add(b); if (seen.has(b)) seen.add(a);
    }
    assert.equal(seen.size, 21); assert.ok(build.goalNodeIds.some((id) => !seen.has(id)));
  }
  assert.throws(() => originalTreePrefix(graph, corpus.builds[0], 10000), /too small/);
});

test("all 26 requests preserve goals, visibility, available caps and existing W1/W2 attachments", () => {
  for (const item of cases) {
    assert.deepEqual(createBuildGoalsValidation(item.request).issues, []);
    assert.deepEqual(item.request.goalNodeIds, item.build.goalNodeIds);
    assert.deepEqual(item.request.visibility, item.build.visibility);
    assert.equal(item.request.totalPointLimit, item.build.mainPointLimit);
    assert.equal(item.request.totalPointLimit, 123 - Math.max(item.build.weaponSets[1].length, item.build.weaponSets[2].length));
    assert.equal(item.request.baseNodeIds.length, item.base === "root" ? 1 : 21);
    assert.equal(item.request.baseEdgeKeys.length, item.base === "root" ? 0 : 20);
    assert.equal(item.request.pointBudgetMode === "all-available", item.budget === "available");
    if (item.budget === "tight") assert.equal(item.request.extraPointBudget, 0);
    if (item.build.id === "warbringer-partial") {
      assert.equal(item.request.totalPointLimit, 99); assert.equal(item.request.weaponSets.attachmentNodeIds.length, 11);
      assert.deepEqual(item.request.weaponSets.allocations, item.build.weaponSets);
    }
  }
});

test("preference families keep minion, companion, player defence and DoT scopes explicit", () => {
  const get = (id) => corpus.builds.find((b) => b.id === id).profiles;
  assert.deepEqual(get("spectres")[0].preferences.map((p) => p.id), ["minionDamage", "minionSpeed"]);
  assert.deepEqual(get("wolfpack")[0].preferences.map((p) => p.id), ["companionDamage", "companionAttackSpeed", "minionDamage"]);
  assert.deepEqual(get("chaos-dot")[0].preferences.map((p) => p.id), ["chaosDamage", "damageOverTime", "skillDuration"]);
  for (const item of cases) assert.ok(item.profile.preferences.every((p) => p.weight > 0));
});

test("independent cost audit counts paid base nodes, not only new additions", () => {
  const graph = validationGraph([["start", "a"], ["a", "b"], ["b", "goal"]]);
  const request = { graph, mode: "shortest", rootNodeId: "start", baseNodeIds: ["start", "a"], baseEdgeKeys: ["a::start"], goalNodeIds: ["goal"] };
  const result = { status: "success", totalNodeIds: ["start", "a", "b", "goal"], orderedNodeIds: ["start", "a", "b", "goal"], addedNodeIds: ["b", "goal"],
    pointCost: 2, totalEdgeKeys: ["a::start", "a::b", "b::goal"], addedEdgeKeys: ["a::b", "b::goal"], unreachableGoalNodeIds: [] };
  const build = { ...corpus.builds[0], weaponNodeIds: [], weaponSets: { 1: [], 2: [] }, mainPointLimit: 2 };
  assert.equal(independentAllocationCheck(request, result, build).overMainCap, false);
  assert.deepEqual(auditHeldoutAllocation(request, result, build), { overMainCap: true, weaponOverlap: [], detachedWeaponNodes: [], basePoints: 1, totalPoints: 3 });
  assert.equal(auditHeldoutAllocation(request, result, { ...build, mainPointLimit: 3 }).overMainCap, false);
  assert.throws(() => auditHeldoutAllocation(request, { ...result, totalNodeIds: [...result.totalNodeIds, "b"] }, build));
  assert.throws(() => auditHeldoutAllocation(request, { ...result, totalEdgeKeys: result.totalEdgeKeys.slice(1) }, build));
});

test("case construction is repeatable and does not mutate the frozen source metadata", () => {
  const before = JSON.stringify(corpus); assert.deepEqual(heldoutCases(graph, corpus), heldoutCases(graph, corpus)); assert.equal(JSON.stringify(corpus), before);
  assert.equal(cases.filter((c) => c.base === "root").length, 12); assert.equal(cases.filter((c) => c.base === "prefix20").length, 14);
});

test("preparation refuses to overwrite the existing holdout version", async () => {
  await assert.rejects(prepareHoldoutCorpus(graph, digest(graphText)), /immutable/);
});

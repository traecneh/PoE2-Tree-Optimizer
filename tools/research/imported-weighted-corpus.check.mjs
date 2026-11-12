import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { importedRequest, atCheckpoint, compareQuality, independentAllocationCheck, corpusDirectory, digest } = await tsImport("./imported-weighted-corpus.ts", import.meta.url);
const { importBuildGoalsFromPobCode } = await tsImport("../../src/tree/pobBuildImport.ts", import.meta.url);
const { createBuildGoalsValidation } = await tsImport("../../src/tree/buildGoalsValidation.ts", import.meta.url);
const { validationGraph } = await tsImport("../../src/tree/buildGoalsValidation.fixtures.ts", import.meta.url);
const corpus = JSON.parse(readFileSync(`${corpusDirectory}/corpus.json`, "utf8"));
const graphText = readFileSync("data/tree-graph.json", "utf8"), graph = JSON.parse(graphText);

test("captured imports are exact, class-specific and contain no missing or weapon/ascendancy goals", () => {
  assert.equal(corpus.graphSha256, digest(graphText));
  assert.equal(new Set(corpus.builds.map((build) => build.rootNodeId)).size, 4);
  for (const build of corpus.builds) {
    const code = readFileSync(`${corpusDirectory}/captured/${build.id}.txt`, "utf8");
    assert.equal(digest(code), build.codeSha256);
    const imported = importBuildGoalsFromPobCode(code, graph);
    assert.deepEqual(imported.goalNodeIds, build.goalNodeIds);
    assert.equal(imported.className, build.className);
    assert.equal(imported.missingNodeIds.length, 0);
    assert.equal(build.preflight.status, "ready_for_audit");
    for (const id of build.goalNodeIds) assert.ok(!graph.nodes[id].flags.ascendancy && !build.weaponNodeIds.includes(id));
  }
  assert.equal(corpus.excluded.length, 3);
  assert.ok(corpus.excluded.every((entry) => entry.preflight.status === "blocked"));
});
test("all 24 requests preserve imported goals, selected gates, UI budget semantics and weapon reserve", () => {
  for (const build of corpus.builds) for (const profile of build.profiles) for (const budget of ["tight", "extra-5", "available"]) {
    const request = importedRequest(graph, build, profile, budget);
    assert.deepEqual(createBuildGoalsValidation(request).issues, []);
    assert.deepEqual(request.goalNodeIds, build.goalNodeIds);
    assert.deepEqual(request.baseNodeIds, [build.rootNodeId]);
    assert.equal(request.visibility.selectedAscendancyId, build.visibility.selectedAscendancyId);
    assert.equal(request.extraPointBudget, budget === "tight" ? 0 : 5);
    assert.equal(request.totalPointLimit, build.mainPointLimit);
    if (build.weaponNodeIds.length) {
      assert.deepEqual(request.weaponSets.allocations, build.weaponSets);
      assert.equal(request.weaponSets.attachmentNodeIds.length, 11);
    }
    assert.equal(build.mainPointLimit, 123 - Math.max(build.weaponSets[1].length, build.weaponSets[2].length));
  }
});
test("common checkpoints exclude cooperative-stop overruns and preserve score/fewer-points ordering", () => {
  const a = { ms: 900, score: 12, points: 9 }, b = { ms: 1001, score: 20, points: 9 };
  assert.equal(atCheckpoint([a, b], 1000), a);
  assert.equal(atCheckpoint([a], 500), undefined);
  assert.equal(compareQuality(a, b), 1);
  assert.equal(compareQuality(a, { ...a, points: 8 }), 1);
  assert.equal(compareQuality(a, { ...a, points: 10 }), -1);
  assert.equal(compareQuality(a, { ...a }), 0);
  assert.equal(compareQuality(undefined, b), undefined);
});
test("independent checks reject duplicated and disconnected allocation rather than trusting reported costs", () => {
  const build = corpus.builds[0], request = importedRequest(graph, build, build.profiles[0], "available");
  assert.throws(() => independentAllocationCheck(request, { totalNodeIds: [build.rootNodeId, build.rootNodeId], addedNodeIds: [], totalEdgeKeys: [], pointCost: 0 }, build));
  assert.throws(() => independentAllocationCheck(request, { totalNodeIds: [build.rootNodeId, ...build.goalNodeIds], addedNodeIds: build.goalNodeIds, totalEdgeKeys: [], pointCost: build.goalNodeIds.length }, build));
});
test("independent audit flags over-cap, reserved-node overlap and detached weapon branches separately", () => {
  const graph = validationGraph([["start", "goal"], ["start", "anchor"], ["anchor", "w1"], ["start", "w2"]]);
  const request = { graph, mode: "shortest", rootNodeId: "start", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"] };
  const build = { ...corpus.builds[0], mainPointLimit: 0, weaponNodeIds: ["w1", "w2"], weaponSets: { 1: ["w1"], 2: ["w2"] } };
  const result = { status: "success", totalNodeIds: ["start", "goal"], orderedNodeIds: ["start", "goal"], addedNodeIds: ["goal"],
    totalEdgeKeys: ["goal::start"], addedEdgeKeys: ["goal::start"], pointCost: 1, unreachableGoalNodeIds: [] };
  assert.deepEqual(independentAllocationCheck(request, result, build), { overMainCap: true, weaponOverlap: [], detachedWeaponNodes: ["w1"] });
  const connected = { ...result, totalNodeIds: ["start", "anchor", "goal", "w1"], orderedNodeIds: ["start", "anchor", "goal", "w1"],
    addedNodeIds: ["anchor", "goal", "w1"], totalEdgeKeys: ["anchor::start", "goal::start", "anchor::w1"],
    addedEdgeKeys: ["anchor::start", "goal::start", "anchor::w1"], pointCost: 3 };
  assert.deepEqual(independentAllocationCheck(request, connected, { ...build, mainPointLimit: 3 }),
    { overMainCap: false, weaponOverlap: ["w1"], detachedWeaponNodes: [] });
});

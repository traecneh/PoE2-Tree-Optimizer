import { test } from "node:test";
import assert from "node:assert/strict";
import { tsImport } from "tsx/esm/api";
import { classifyGenerationProtection, deriveGenerationProtection, fingerprint, sourceHash } from "./generation_protection.mjs";
import { parseBuildRequirements, evaluateBuildRequirements } from "./build_requirements.mjs";
import { inspectPobImport } from "./import_preflight.mjs";
import { attachFixtureCoverage } from "./effect-coverage.fixture.mjs";
const { optimizeBuildGoalsAnytime } = await tsImport("../../src/tree/buildGoalsOptimizer.ts", import.meta.url);

function fixture() {
  const graph = { gameVersion: "fixture", classStarts: { MARAUDER: "1" }, groups: {},
    nodes: Object.fromEntries(["1", "2", "3"].map((id) => [id, { id, name: id, stats: [], position: { x: Number(id), y: 0 },
      flags: { classStart: id === "1", small: id === "2", notable: id === "3" } }])),
    edges: [{ from: "1", to: "2" }, { from: "2", to: "3" }, { from: "1", to: "3" }] };
  const xml = `<PathOfBuilding2><Build targetVersion="0_1" className="Warrior" ascendClassName="None" mainSocketGroup="1"/>
    <Tree activeSpec="1"><Spec treeVersion="0_5" nodes="1,2,3"/></Tree><Items activeItemSet="1"><ItemSet id="1"/></Items>
    <Skills activeSkillSet="1"><SkillSet id="1"><Skill enabled="true" includeInFullDPS="true"><Gem nameSpec="Synthetic fixture"/></Skill></SkillSet></Skills>
    <Config activeConfigSet="1"><ConfigSet id="1"/></Config></PathOfBuilding2>`;
  const audit = { sourceXmlSha256: sourceHash(xml), graphVersion: graph.gameVersion, graphFingerprint: fingerprint(graph),
    className: "Warrior", baseNodeId: "1", activeSpecIndex: 1, validationProfile: "ci-mana", originalMainNodeIds: ["1", "2", "3"],
    preservedAscendancyNodeIds: [], preservedWeaponNodeIds: [], preservedWeaponSets: { 1: [], 2: [] }, goalNodeIds: ["3"], pinnedAttributeNodeIds: [],
    generation: { phase: "baseline_only" }, candidates: [{ label: "Original", nodeIds: ["1", "2", "3"], edgeKeys: ["1::2", "2::3"], pointCost: 2 }] };
  const output = { Life: 1, LifeRecoverable: 1, Mana: 100, ManaUnreserved: 100, EnergyShield: 0, FullDPS: 100,
    CombinedDPS: 100, TotalEHP: 101, Str: 7, Dex: 7, Int: 7, ReqStr: 1, ReqDex: 1, ReqInt: 1, sharedMindOverMatter: 100, sharedManaEffectiveLife: 101 };
  const result = { engineVersion: "fixture", treeVersion: "0_5", baseline: output, baselineAfterOverrides: { ...output }, finalBaseline: { ...output },
    baselineUncappedManaBeforeLife: 100, contextUnchangedAfterOverrides: true, allocationUnchangedAfterOverrides: true, finalContextPreserved: true, finalAllocationRestored: true,
    weaponNodeIds: { 1: [], 2: [] },
    candidates: [{ label: "Original", addedCount: 0, removedCount: 0, pobPointCounts: { main: 2, ascendancy: 0, sockets: 0, weapon1: 0, weapon2: 0 },
      reloadOutput: { ...output }, overrideOutput: { ...output }, contextPreservedOnReload: true, attributeChoicesPreserved: true, attributeChoicesPreservedOnReload: true,
      missingAllocationsOnReload: [], weaponNodeIdsOnReload: { 1: [], 2: [] } }] };
  attachFixtureCoverage({ audit, result });
  addLine(result.candidates[0].effectCoverage, "2", "Unmodeled original effect");
  return { audit, result, graph, xml, policy: { version: 1, name: "Fixture", requiredNodeIds: [], minimums: [] } };
}
function addLine(coverage, id, text) {
  coverage.nodes.find((node) => node.id === id).descriptionLineCount++;
  coverage.lines.push({ kind: "passive", ownerId: id, ownerName: id, granted: coverage.nodes.find((node) => node.id === id).granted,
    index: coverage.lines.filter((line) => line.ownerId === id).length + 1, text, parseStatus: "unparsed", parsedModCount: 0 });
}
const requirements = (f) => parseBuildRequirements(f.policy, f.audit);
const classify = (f) => classifyGenerationProtection(f.audit, f.result, requirements(f));
const derive = (f) => deriveGenerationProtection({ audit: f.audit, xml: f.xml, graph: f.graph, baselineAudit: f.baselineAudit ?? f.audit,
  baselineResult: f.result, baselineXml: f.baselineXml ?? f.xml, baselinePreflight: f.preflight ?? inspectPobImport(f.xml, f.graph), policy: f.policy });

test("validated original coverage pins the small node before the real router runs", () => {
  const f = fixture(); const protection = derive(f);
  assert.deepEqual(protection.mandatoryNodeIds, ["2"]);
  const request = { graph: f.graph, baseNodeIds: ["1"], baseEdgeKeys: [], goalNodeIds: ["3"], mode: "shortest" };
  assert.equal(optimizeBuildGoalsAnytime(request).pointCost, 1);
  const protectedRoute = optimizeBuildGoalsAnytime({ ...request, goalNodeIds: [...request.goalNodeIds, ...protection.mandatoryNodeIds] });
  assert.equal(protectedRoute.pointCost, 2);
  assert.ok(protectedRoute.totalNodeIds.includes("2"));
});

test("all unmodeled effects on a node must be allowed before that node can become optional", () => {
  const f = fixture(); addLine(f.result.candidates[0].effectCoverage, "2", "Second unmodeled effect");
  const exception = (text) => ({ nodeId: "2", text, reason: "Synthetic reviewed tradeoff" });
  f.policy.effectCoverage = { allowedPassiveEffectLosses: [exception("Unmodeled original effect")] };
  assert.deepEqual(classify(f).mandatoryNodeIds, ["2"]);
  f.policy.effectCoverage.allowedPassiveEffectLosses.push(exception("Second unmodeled effect"));
  assert.deepEqual(classify(f).mandatoryNodeIds, []);
  f.policy.requiredNodeIds = ["2"];
  assert.deepEqual(classify(f).mandatoryNodeIds, ["2"]);
});

test("weapon/ascendancy allocations and grants stay out of paid shared goals", () => {
  const f = fixture(); f.audit.preservedWeaponNodeIds = ["4", "5"]; f.audit.preservedWeaponSets = { 1: ["4"], 2: ["5"] };
  f.audit.preservedAscendancyNodeIds = ["6"];
  const original = structuredClone(f.result);
  f.result.weaponSetResults = { 1: original, 2: structuredClone(original) };
  attachFixtureCoverage(f);
  for (const scenario of Object.values(f.result.weaponSetResults)) {
    const c = scenario.candidates[0].effectCoverage;
    for (const id of ["2", "6", scenario.activeWeaponSet === 1 ? "4" : "5"]) addLine(c, id, `Unmodeled ${id}`);
    c.nodes.push({ id: "56666", name: "Granted", granted: true, paid: false, descriptionLineCount: 0 });
    addLine(c, "56666", "Granted effect");
    c.grants.push({ name: "Granted", structured: false, resolvedNodeIds: ["56666"], appliedNodeIds: ["56666"] });
  }
  const protection = classify(f);
  assert.deepEqual(protection.mandatoryNodeIds, ["2"]);
  assert.ok(protection.effects.some((effect) => effect.disposition === "preserved_weapon"));
  assert.ok(protection.effects.some((effect) => effect.disposition === "preserved_ascendancy"));
  assert.ok(protection.effects.some((effect) => effect.disposition === "retained_grant"));
  f.policy.effectCoverage = { allowedPassiveEffectLosses: [{ nodeId: "2", text: "Unmodeled 2", reason: "W1 only", weaponSets: [1] }] };
  assert.deepEqual(classify(f).mandatoryNodeIds, ["2"]);
});

test("stale source, graph, allocation, profile and baseline phase do not seed routing", () => {
  for (const change of [
    (f) => f.baselineXml = `${f.xml} `,
    (f) => f.graph.gameVersion = "other",
    (f) => { f.baselineAudit = structuredClone(f.audit); f.baselineAudit.className = "Other"; },
    (f) => { f.baselineAudit = structuredClone(f.audit); f.baselineAudit.preservedWeaponSets[1] = ["2"]; },
    (f) => { f.baselineAudit = structuredClone(f.audit); delete f.baselineAudit.graphFingerprint; },
    (f) => { f.baselineAudit = structuredClone(f.audit); f.baselineAudit.generation.phase = "coverage_constrained"; },
    (f) => f.result.finalContextPreserved = false,
    (f) => f.result.candidates[0].effectCoverage.sourceXmlSha256 = "wrong",
    (f) => f.preflight = { ...inspectPobImport(f.xml, f.graph), canGenerateRoutes: false },
  ]) {
    const f = fixture(); change(f); assert.throws(() => derive(f));
  }
});

test("exceptions must match native original text and cannot suppress another effect", () => {
  const f = fixture(); f.policy.effectCoverage = { allowedPassiveEffectLosses: [{ nodeId: "2", text: "Wrong", reason: "Intentional negative test" }] };
  assert.throws(() => derive(f), /stale or does not match/);
  f.policy.effectCoverage.allowedPassiveEffectLosses[0].text = "Unmodeled original effect";
  assert.deepEqual(derive(f).mandatoryNodeIds, []);
});

test("ranking refuses different effect-loss exceptions than generation used", () => {
  const f = fixture(); f.audit.generation = { phase: "coverage_constrained", effectCoveragePolicy: { allowedPassiveEffectLosses: [] } };
  f.policy.effectCoverage = { allowedPassiveEffectLosses: [{ nodeId: "2", text: "Unmodeled original effect", reason: "Reviewed" }] };
  const report = evaluateBuildRequirements({ ...f, requirements: f.policy, verification: { passed: true, checkCount: 1, checks: [{ name: "Fixture", passed: true }] },
    preflight: inspectPobImport(f.xml, f.graph) });
  assert.equal(report.status, "generation_policy_mismatch");
  assert.deepEqual(report.ranking, []);
});

test("constraint derivation does not mutate coverage, original tree or requirements", () => {
  const f = fixture(); const before = JSON.stringify(f); derive(f); assert.equal(JSON.stringify(f), before);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { auditConnected, lifeManaHitPool, numbersAgree, verifyRealAudit } from "./verify_real_audit.mjs";
import { evaluateBuildRequirements } from "./build_requirements.mjs";
import { attachFixtureCoverage } from "./effect-coverage.fixture.mjs";

function fixture() {
  const xml = "controlled test input";
  const baseline = { Life: 1, LifeRecoverable: 1, Mana: 100, ManaUnreserved: 100, EnergyShield: 0,
    FullDPS: 1000, CombinedDPS: 1000, TotalEHP: 200, Str: 7, Dex: 7, Int: 7, ReqStr: 1, ReqDex: 1, ReqInt: 1,
    sharedMindOverMatter: 100, sharedManaEffectiveLife: 101 };
  const alternate = { ...baseline, FullDPS: 900, CombinedDPS: 900, TotalEHP: 50, sharedMindOverMatter: 96, sharedManaEffectiveLife: 25 };
  const counts = { main: 2, ascendancy: 8, sockets: 0, weapon1: 0, weapon2: 0 };
  const input = {
    xml,
    graph: { gameVersion: "fixture", edges: [{ from: "s", to: "m" }, { from: "g", to: "m" }, { from: "s", to: "g" }],
      nodes: { s: { flags: { classStart: true }, stats: [] },
      g: { flags: { notable: true }, stats: [] }, m: { flags: { small: true }, stats: ["4% of Damage is taken from Mana before Life"] } } },
    audit: { sourceXmlSha256: createHash("sha256").update(xml).digest("hex"), graphVersion: "fixture", baseNodeId: "s",
      originalMainNodeIds: ["s", "g", "m"], goalNodeIds: ["g"], pinnedAttributeNodeIds: [],
      candidates: [
        { label: "Original", nodeIds: ["s", "g", "m"], edgeKeys: ["s::m", "g::m"], pointCost: 2 },
        { label: "Candidate", nodeIds: ["s", "g"], edgeKeys: ["s::g"], pointCost: 1 },
      ] },
    result: {
      baseline, baselineAfterOverrides: { ...baseline }, finalBaseline: { ...baseline }, baselineUncappedManaBeforeLife: 100,
      contextUnchangedAfterOverrides: true, allocationUnchangedAfterOverrides: true, finalContextPreserved: true, finalAllocationRestored: true,
      candidates: [
        { label: "Original", addedCount: 0, removedCount: 0, pobPointCounts: counts,
          overrideOutput: { ...baseline }, reloadOutput: { ...baseline }, contextPreservedOnReload: true,
          attributeChoicesPreserved: true, attributeChoicesPreservedOnReload: true, missingAllocationsOnReload: [] },
        { label: "Candidate", addedCount: 0, removedCount: 1, pobPointCounts: { ...counts, main: 1 },
          overrideOutput: { ...alternate }, reloadOutput: { ...alternate }, contextPreservedOnReload: true,
          attributeChoicesPreserved: true, attributeChoicesPreservedOnReload: true, missingAllocationsOnReload: [] },
      ],
    },
  };
  attachFixtureCoverage(input);
  return input;
}

test("100% mana redirection protects the life and mana resources", () => {
  assert.equal(lifeManaHitPool(1, 9134, 100), 9135);
});
test("8% life leakage leaves only 12.5 damage capacity at one Life", () => {
  assert.ok(numbersAgree(lifeManaHitPool(1, 9134, 92), 12.5));
});
test("a limited mana supply cannot grant more than the combined resources", () => {
  assert.equal(lifeManaHitPool(1000, 100, 50), 1100);
  assert.equal(lifeManaHitPool(1000, 100, 0), 1000);
});
test("invalid or missing pool inputs are not verified", () => {
  for (const percent of [-1, 101, undefined, NaN, Infinity]) assert.equal(lifeManaHitPool(1, 100, percent), undefined);
  assert.equal(lifeManaHitPool(-1, 100, 50), undefined);
});
test("metric comparisons reject missing and nonfinite outputs", () => {
  assert.equal(numbersAgree(undefined, undefined), false);
  assert.equal(numbersAgree(Infinity, Infinity), false);
  assert.equal(numbersAgree(100, 101), false);
});
test("route validation requires the root and connected goals", () => {
  assert.equal(auditConnected(["s", "a", "b"], ["s::a", "a::b"], "s"), true);
  assert.equal(auditConnected(["s", "a", "b"], ["s::a"], "s"), false);
  assert.equal(auditConnected(["a", "b"], ["a::b"], "s"), false);
});
test("route validation rejects edges outside the candidate and handles shared IDs", () => {
  assert.equal(auditConnected(["s", "a"], ["s::missing"], "s"), false);
  assert.equal(auditConnected(["s", "a", "a"], ["s::a"], "s"), true);
});

test("audit verification can pass while flagging an unsuitable candidate", () => {
  const { audit, result, xml, graph } = fixture();
  const report = verifyRealAudit(audit, result, xml, graph);
  assert.equal(report.passed, true);
  assert.equal(report.summaries[1].warnings.length, 1);
});
test("full reload comparison catches an add-only adapter that forgot removals", () => {
  const { audit, result, xml, graph } = fixture();
  result.candidates[1].overrideOutput = { ...result.baseline };
  assert.equal(verifyRealAudit(audit, result, xml, graph).passed, false);
});
test("the audit rejects altered equipment or other protected context", () => {
  const { audit, result, xml, graph } = fixture();
  result.candidates[1].contextPreservedOnReload = false;
  assert.equal(verifyRealAudit(audit, result, xml, graph).passed, false);
});
test("the audit rejects a changed source export", () => {
  const { audit, result, xml, graph } = fixture();
  assert.equal(verifyRealAudit(audit, result, `${xml} changed`, graph).passed, false);
});

test("the audit rejects a connected route using a nonexistent game edge", () => {
  const { audit, result, xml, graph } = fixture();
  graph.edges = graph.edges.filter((edge) => edge.from !== "s" || edge.to !== "g");
  const report = verifyRealAudit(audit, result, xml, graph);
  assert.equal(report.passed, false);
  assert.ok(report.checks.some((check) => check.name === "Candidate: edges exist in game graph" && !check.passed));
});

test("the audit fails cleanly when candidate outputs or counts are missing", () => {
  const { audit, result, xml, graph } = fixture();
  delete result.candidates[1].overrideOutput;
  delete result.candidates[1].pobPointCounts;
  assert.equal(verifyRealAudit(audit, result, xml, graph).passed, false);
});

test("a verified attribute shortfall rejects the candidate without invalidating the calculation audit", () => {
  const { audit, result, xml, graph } = fixture();
  result.candidates[1].overrideOutput.Str = 0;
  result.candidates[1].reloadOutput.Str = 0;
  const verification = verifyRealAudit(audit, result, xml, graph);
  assert.equal(verification.passed, false);
  assert.equal(verification.integrityPassed, true);
  const report = evaluateBuildRequirements({ audit, result, verification,
    preflight: { version: 1, status: "ready_for_audit", canGenerateRoutes: true, sourceXmlSha256: audit.sourceXmlSha256, graphVersion: audit.graphVersion, findings: [] },
    requirements: { version: 1, name: "Attribute requirement", requiredNodeIds: [], minimums: [] } });
  assert.equal(report.status, "evaluated");
  assert.equal(report.candidates[0].decision, "eligible");
  assert.equal(report.candidates[1].decision, "rejected");
  assert.equal(report.candidates[1].failures[0].code, "attribute_requirement");
});

function weaponFixture() {
  const data = fixture();
  data.audit.preservedWeaponNodeIds = ["w1", "w2"];
  data.audit.preservedWeaponSets = { 1: ["w1"], 2: ["w2"] };
  for (const id of ["w1", "w2"]) data.graph.nodes[id] = { flags: { small: true }, stats: [] };
  data.graph.edges.push({ from: "s", to: "w1" }, { from: "s", to: "w2" });
  data.result.weaponNodeIds = { 1: ["w1"], 2: ["w2"] };
  data.result.activeWeaponSet = 1;
  for (const candidate of data.result.candidates) {
    candidate.pobPointCounts.nonWeaponMain = candidate.pobPointCounts.main;
    candidate.pobPointCounts.main += 2;
    candidate.pobPointCounts.weapon1 = candidate.pobPointCounts.weapon2 = 1;
    candidate.weaponNodeIdsOnReload = { 1: ["w1"], 2: ["w2"] };
  }
  const first = structuredClone(data.result);
  const second = structuredClone(data.result);
  second.activeWeaponSet = 2;
  data.result.weaponSetResults = { 1: first, 2: second };
  data.result.originalActiveWeaponSet = 1;
  data.result.finalOriginalContextPreserved = data.result.finalOriginalAllocationRestored = true;
  data.result.finalOriginalBaseline = structuredClone(data.result.baseline);
  return data;
}

test("weapon audit checks two separate sets and excludes their points from shared cost", () => {
  const { audit, result, xml, graph } = weaponFixture();
  assert.equal(verifyRealAudit(audit, result, xml, graph).passed, true);
});

test("same weapon counts with swapped node assignments are rejected", () => {
  const { audit, result, xml, graph } = weaponFixture();
  result.weaponSetResults[2].candidates[1].weaponNodeIdsOnReload = { 1: ["w2"], 2: ["w1"] };
  assert.equal(verifyRealAudit(audit, result, xml, graph).passed, false);
});

test("weapon connections cannot rely on the other set's passives", () => {
  const { audit, result, xml, graph } = weaponFixture();
  graph.edges = graph.edges.filter((edge) => edge.to !== "w2");
  graph.edges.push({ from: "w1", to: "w2" });
  const verification = verifyRealAudit(audit, result, xml, graph);
  assert.ok(verification.checks.some((check) => check.name.includes("W2 connected without the other set") && !check.passed));
});

test("missing W2 or wrong active-set calculation blocks the audit", () => {
  for (const modify of [(result) => delete result.weaponSetResults[2], (result) => result.weaponSetResults[2].activeWeaponSet = 1]) {
    const { audit, result, xml, graph } = weaponFixture();
    modify(result);
    assert.equal(verifyRealAudit(audit, result, xml, graph).passed, false);
  }
});

test("recovery verification rejects wrong resolved-input arithmetic", () => {
  const { audit, result, xml, graph } = fixture();
  result.recoveryCaptured = true;
  const outputs = [result.baseline, result.baselineAfterOverrides, result.finalBaseline,
    ...result.candidates.flatMap((candidate) => [candidate.overrideOutput, candidate.reloadOutput])];
  for (const output of outputs) Object.assign(output, { Armour: 0, Evasion: 0, LifeRegen: 1, ManaRegen: 1, LifeRegenRecovery: 1, ManaRegenRecovery: 1 });
  for (const candidate of result.candidates) {
    candidate.recoveryInputs = Object.fromEntries(["Life", "Mana"].map((resource) => [resource, {
      pool: candidate.reloadOutput[resource], flat: 1, percent: 0, increased: 0, more: 1,
      disabled: false, unaffected: false, transferredToES: false, degenFlat: 0, degenPercent: 0,
      degenIncreased: 0, degenMore: 1, recoveryFlat: 0, recoveryRate: 1, overflow: 0,
    }]));
  }
  assert.equal(verifyRealAudit(audit, result, xml, graph).passed, true);
  result.candidates[1].recoveryInputs.Mana.increased = 100;
  const report = verifyRealAudit(audit, result, xml, graph);
  assert.ok(report.checks.some((check) => check.name.includes("independent Mana recovery arithmetic") && !check.passed));
});

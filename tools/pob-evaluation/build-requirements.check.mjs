import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { evaluateBuildRequirements, parseBuildRequirements } from "./build_requirements.mjs";
import { attachFixtureCoverage } from "./effect-coverage.fixture.mjs";

function fixture() {
  const baseline = { FullDPS: 1000, TotalEHP: 100, sharedMindOverMatter: 100, Str: 20, ReqStr: 20, Dex: 10, ReqDex: 10, Int: 50, ReqInt: 40 };
  const tree = (label, nodes) => ({ label, nodeIds: nodes, pointCost: nodes.length - 1 });
  const original = tree("Original", ["s", "goal", "critical", "a", "b"]);
  const unsafe = tree("Unsafe", ["s", "goal"]);
  const lowerDamage = tree("Lower damage", ["s", "goal", "critical"]);
  const nearOriginal = tree("Near original", ["s", "goal", "critical", "a"]);
  const evaluated = (candidate, changes = {}) => ({ label: candidate.label,
    pobPointCounts: { main: candidate.pointCost }, reloadOutput: { ...baseline, ...changes } });
  const input = {
    audit: { sourceXmlSha256: "controlled-hash", graphVersion: "fixture", originalMainNodeIds: original.nodeIds, goalNodeIds: ["goal"], pinnedAttributeNodeIds: [],
      candidates: [original, unsafe, lowerDamage, nearOriginal] },
    result: { baseline, candidates: [evaluated(original), evaluated(unsafe, { sharedMindOverMatter: 92, TotalEHP: 1 }),
      evaluated(lowerDamage, { FullDPS: 920 }), evaluated(nearOriginal, { FullDPS: 970 })] },
    verification: { passed: true, checkCount: 1, checks: [{ name: "controlled verification", passed: true }] },
    preflight: { version: 1, status: "ready_for_audit", canGenerateRoutes: true, sourceXmlSha256: "controlled-hash", graphVersion: "fixture", findings: [] },
    requirements: { version: 1, name: "Strict fixture", requiredNodeIds: ["critical"], minimums: [
      { metric: "sharedMindOverMatter", value: 100 }, { metric: "FullDPS", baselineFraction: 0.95 },
      { metric: "TotalEHP", baselineFraction: 1 },
    ] },
  };
  attachFixtureCoverage(input);
  return input;
}

test("rejects cheap broken routes before sorting eligible candidates", () => {
  const report = evaluateBuildRequirements(fixture());
  assert.equal(report.status, "evaluated");
  assert.deepEqual(report.ranking, ["Near original", "Original"]);
  assert.equal(report.originalRetained, true);
  assert.equal(report.candidates.find((candidate) => candidate.label === "Unsafe").decision, "rejected");
  assert.equal(report.candidates.find((candidate) => candidate.label === "Lower damage").decision, "rejected");
});

test("missing, blocked or stale preflight never ranks a verified candidate", () => {
  for (const change of [(input) => delete input.preflight, (input) => input.preflight.canGenerateRoutes = false,
    (input) => input.preflight.sourceXmlSha256 = "other", (input) => input.preflight.graphVersion = "other",
    (input) => input.preflight.findings.push({ severity: "blocker" })]) {
    const input = fixture();
    change(input);
    const report = evaluateBuildRequirements(input);
    assert.equal(report.status, "incompatible_import");
    assert.deepEqual(report.ranking, []);
    assert.ok(report.candidates.every((candidate) => candidate.decision === "unverified"));
  }
});

test("reports exact failed nodes and numeric minimums", () => {
  const unsafe = evaluateBuildRequirements(fixture()).candidates[1];
  assert.ok(unsafe.failures.some((failure) => failure.code === "required_node" && failure.actual === false));
  assert.ok(unsafe.failures.some((failure) => failure.actual === 92 && failure.minimum === 100));
  assert.ok(unsafe.failures.some((failure) => failure.actual === 1 && failure.minimum === 100));
});

test("an explicit damage allowance admits more candidates but never relaxes defence", () => {
  const input = fixture();
  input.requirements.minimums[1].baselineFraction = 0.9;
  const report = evaluateBuildRequirements(input);
  assert.deepEqual(report.ranking, ["Lower damage", "Near original", "Original"]);
  assert.equal(report.candidates[1].decision, "rejected");
});

test("original goals and pinned attributes stay mandatory without policy node requirements", () => {
  const input = fixture();
  input.requirements.requiredNodeIds = [];
  input.requirements.minimums = [];
  input.audit.pinnedAttributeNodeIds = ["a"];
  const report = evaluateBuildRequirements(input);
  assert.equal(report.candidates[1].decision, "rejected");
  assert.ok(report.candidates[1].failures.some((failure) => failure.label.endsWith(" a")));
});

test("attribute requirements are checked for every candidate", () => {
  for (const attribute of ["Str", "Dex", "Int"]) {
    const input = fixture();
    input.result.candidates[3].reloadOutput[attribute] = 0;
    const failures = evaluateBuildRequirements(input).candidates[3].failures;
    assert.ok(failures.some((failure) => failure.code === "attribute_requirement"));
  }
});

test("a candidate must meet its own requirements, not just original requirements", () => {
  const input = fixture();
  input.result.candidates[3].reloadOutput.ReqInt = 60;
  assert.equal(evaluateBuildRequirements(input).candidates[3].decision, "rejected");
});

test("missing or nonfinite outputs never pass a minimum or attribute requirement", () => {
  for (const value of [undefined, NaN, Infinity, -1]) {
    const input = fixture();
    input.result.candidates[3].reloadOutput.FullDPS = value;
    input.result.candidates[3].reloadOutput.ReqStr = value;
    const failures = evaluateBuildRequirements(input).candidates[3].failures;
    assert.ok(failures.some((failure) => failure.code === "missing_or_invalid_metric"));
    assert.ok(failures.some((failure) => failure.code === "attribute_requirement"));
  }
});

test("missing baseline and overflowing relative minimums fail closed", () => {
  const input = fixture();
  delete input.result.baseline.FullDPS;
  assert.equal(evaluateBuildRequirements(input).eligibleCount, 0);
  input.result.baseline.FullDPS = Number.MAX_VALUE;
  input.requirements.minimums[1].baselineFraction = 2;
  assert.equal(evaluateBuildRequirements(input).eligibleCount, 0);
});

test("absolute zero and exact threshold values are valid; just-below values fail", () => {
  const input = fixture();
  input.requirements.minimums = [{ metric: "FullDPS", value: 970 }];
  assert.equal(evaluateBuildRequirements(input).candidates[3].decision, "eligible");
  input.result.candidates[3].reloadOutput.FullDPS = 969.9999999;
  assert.equal(evaluateBuildRequirements(input).candidates[3].decision, "rejected");
  input.requirements.minimums[0].value = 0;
  input.result.candidates[3].reloadOutput.FullDPS = 0;
  assert.equal(evaluateBuildRequirements(input).candidates[3].decision, "eligible");
});

test("a failed audit gives no candidate a performance eligibility decision", () => {
  const input = fixture();
  input.verification.passed = false;
  input.verification.checks[0].passed = false;
  const report = evaluateBuildRequirements(input);
  assert.equal(report.status, "invalid_audit");
  assert.deepEqual(report.ranking, []);
  assert.ok(report.candidates.every((candidate) => candidate.decision === "unverified"));
});

test("a passed flag cannot hide failed, absent, or inconsistent audit checks", () => {
  for (const verification of [
    { passed: true, checkCount: 1, checks: [{ passed: false }] },
    { passed: true, checkCount: 0, checks: [] },
    { passed: true, checkCount: 2, checks: [{ passed: true }] },
    { passed: false, integrityPassed: true, checkCount: 1, checks: [{ passed: false, category: "integrity" }] },
    undefined, { passed: true },
  ]) {
    const input = fixture();
    input.verification = verification;
    const report = evaluateBuildRequirements(input);
    assert.equal(report.status, "invalid_audit");
    assert.ok(report.auditVerification.failedChecks.length > 0);
  }
});

test("missing original control or ambiguous candidate labels prevent ranking", () => {
  for (const modify of [
    (input) => input.audit.candidates.shift(),
    (input) => input.result.candidates.shift(),
    (input) => input.result.candidates.push(input.result.candidates[1]),
    (input) => input.audit.candidates.push(input.audit.candidates[1]),
  ]) {
    const input = fixture();
    modify(input);
    assert.equal(evaluateBuildRequirements(input).status, "invalid_audit");
  }
});

test("point-count mismatches cannot win the comparison", () => {
  const input = fixture();
  input.result.candidates[3].pobPointCounts.main = 0;
  assert.equal(evaluateBuildRequirements(input).candidates[3].decision, "rejected");
});

test("the original tree is evaluated honestly and is not automatically passed", () => {
  const input = fixture();
  input.requirements.minimums = [{ metric: "FullDPS", baselineFraction: 1.1 }];
  const report = evaluateBuildRequirements(input);
  assert.equal(report.status, "no_eligible_candidates");
  assert.equal(report.originalRetained, true);
  assert.equal(report.bestEligibleLabel, null);
  assert.equal(report.candidates[0].decision, "rejected");
});

test("equal-cost ordering is deterministic and uses damage only after eligibility", () => {
  const input = fixture();
  input.requirements.minimums = [];
  input.audit.candidates[3].pointCost = 2;
  input.result.candidates[3].pobPointCounts.main = 2;
  assert.deepEqual(evaluateBuildRequirements(input).ranking, ["Near original", "Lower damage", "Original"]);
});

test("evaluation leaves original inputs unchanged", () => {
  const input = fixture();
  const before = JSON.stringify(input);
  evaluateBuildRequirements(input);
  assert.equal(JSON.stringify(input), before);
});

test("existing audit warnings remain visible even if a policy does not forbid the issue", () => {
  const input = fixture();
  input.requirements.requiredNodeIds = [];
  input.requirements.minimums = [];
  input.verification.summaries = [{ label: "Unsafe", warnings: ["Critical mana threshold lost"] }];
  const unsafe = evaluateBuildRequirements(input).candidates[1];
  assert.equal(unsafe.decision, "eligible");
  assert.deepEqual(unsafe.auditWarnings, ["Critical mana threshold lost"]);
});

test("the command refuses output traversal, source-file overwrite, and jobs outside var", () => {
  const script = fileURLToPath(new URL("./build_requirements.mjs", import.meta.url));
  for (const [job, report] of [["var/not-needed", "../bad.requirements-report.json"],
    ["var/not-needed", "source-build.xml"], [".", "bad.requirements-report.json"]]) {
    const run = spawnSync(process.execPath, [script, job, "not-needed.json", report], { encoding: "utf8" });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /Report name|subdirectory of var/);
  }
});

test("policies reject unsupported fields, metrics, duplicated rules, and invalid values", () => {
  const invalid = [
    { version: 2 }, { extra: true }, { name: " " }, { requiredNodeIds: ["unknown"] },
    { requiredNodeIds: ["critical", "critical"] }, { minimums: [{ metric: "FullDPS", value: "950" }] },
    { minimums: [{ metric: "DPS", value: 950 }] }, { minimums: [{ metric: "FullDPS", value: -1 }] },
    { minimums: [{ metric: "FullDPS", value: Infinity }] }, { minimums: [{ metric: "FullDPS" }] },
    { minimums: [{ metric: "FullDPS", value: 10, baselineFraction: 0.9 }] },
    { minimums: [{ metric: "FullDPS", value: 10, typo: true }] },
    { minimums: [{ metric: "FullDPS", value: 10 }, { metric: "FullDPS", value: 20 }] },
    { minimums: [{ metric: "sharedMindOverMatter", value: 101 }] },
    { minimums: null }, { requiredNodeIds: null },
    ...[[], [0], [3], [1, 1], ["1"]].map((weaponSets) => ({ minimums: [{ metric: "CombinedDPS", value: 10, weaponSets }] })),
  ];
  for (const changes of invalid) {
    const input = fixture();
    assert.throws(() => parseBuildRequirements({ ...input.requirements, ...changes }, input.audit));
  }
});

test("minimums apply to both weapon sets against their respective baselines", () => {
  const input = fixture();
  input.requirements = { version: 1, name: "Recovery", requiredNodeIds: [], minimums: [{ metric: "LifeRegenRecovery", baselineFraction: 1 }] };
  const first = structuredClone(input.result);
  const second = structuredClone(input.result);
  first.recoveryCaptured = second.recoveryCaptured = true;
  first.baseline.LifeRegenRecovery = 100;
  second.baseline.LifeRegenRecovery = 200;
  for (const candidate of first.candidates) candidate.reloadOutput.LifeRegenRecovery = 100;
  for (const candidate of second.candidates) candidate.reloadOutput.LifeRegenRecovery = 200;
  second.candidates[3].reloadOutput.LifeRegenRecovery = 150;
  input.result.weaponSetResults = { 1: first, 2: second };
  attachFixtureCoverage(input);
  const report = evaluateBuildRequirements(input);
  assert.equal(report.candidates[3].decision, "rejected");
  assert.ok(report.candidates[3].failures.some((failure) => failure.label.startsWith("W2:") && failure.actual === 150 && failure.minimum === 200));
  assert.equal(report.candidates[0].decision, "eligible");
});

test("damage can target W2 without treating a non-damaging W1 as a valid damage baseline", () => {
  const input = fixture();
  const first = structuredClone(input.result);
  const second = structuredClone(input.result);
  first.baseline.CombinedDPS = 0;
  second.baseline.CombinedDPS = 1000;
  for (const candidate of first.candidates) candidate.reloadOutput.CombinedDPS = 0;
  for (const candidate of second.candidates) candidate.reloadOutput.CombinedDPS = 1000;
  input.result.weaponSetResults = { 1: first, 2: second };
  attachFixtureCoverage(input);
  input.requirements.minimums = [{ metric: "CombinedDPS", baselineFraction: 1, weaponSets: [2] }];
  assert.equal(evaluateBuildRequirements(input).candidates[3].decision, "eligible");
  delete input.requirements.minimums[0].weaponSets;
  assert.equal(evaluateBuildRequirements(input).candidates[3].decision, "rejected");
});

test("an absent requested weapon scenario and absent recovery evidence cannot satisfy a minimum", () => {
  const input = fixture();
  input.requirements.minimums = [{ metric: "CombinedDPS", value: 1, weaponSets: [2] }];
  assert.equal(evaluateBuildRequirements(input).eligibleCount, 0);
  input.result.baseline.ManaRegenRecovery = 100;
  for (const candidate of input.result.candidates) candidate.reloadOutput.ManaRegenRecovery = 100;
  input.requirements.minimums = [{ metric: "ManaRegenRecovery", value: 100 }];
  assert.equal(evaluateBuildRequirements(input).eligibleCount, 0);
});

test("negative recovery is a real deficit, not a missing number or zero", () => {
  const input = fixture();
  input.result.recoveryCaptured = true;
  input.result.candidates[3].reloadOutput.ManaRegenRecovery = -5;
  input.requirements.minimums = [{ metric: "ManaRegenRecovery", value: 0 }];
  const failure = evaluateBuildRequirements(input).candidates[3].failures.find((entry) => entry.code === "metric_minimum");
  assert.equal(failure.actual, -5);
});

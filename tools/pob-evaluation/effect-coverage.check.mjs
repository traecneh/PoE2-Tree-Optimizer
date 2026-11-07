import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectRuntimeEffectCoverage } from "./effect_coverage.mjs";
import { evaluateBuildRequirements, parseBuildRequirements } from "./build_requirements.mjs";
import { attachFixtureCoverage } from "./effect-coverage.fixture.mjs";

function fixture() {
  const baseline = { FullDPS: 100, Str: 20, Dex: 20, Int: 20, ReqStr: 10, ReqDex: 10, ReqInt: 10 };
  const audit = { sourceXmlSha256: "controlled", graphVersion: "fixture", originalMainNodeIds: ["s", "g", "n"], goalNodeIds: ["g"], pinnedAttributeNodeIds: [],
    preservedWeaponNodeIds: ["w1", "w2"], preservedWeaponSets: { 1: ["w1"], 2: ["w2"] },
    candidates: [{ label: "Original", nodeIds: ["s", "g", "n"], pointCost: 2 }, { label: "Candidate", nodeIds: ["s", "g"], pointCost: 1 }] };
  const scenario = (set) => ({ engineVersion: "fixture", treeVersion: "fixture", activeWeaponSet: set, baseline,
    candidates: audit.candidates.map((candidate) => ({ label: candidate.label, reloadOutput: { ...baseline }, pobPointCounts: { nonWeaponMain: candidate.pointCost } })) });
  const result = { originalActiveWeaponSet: 2, weaponSetResults: { 1: scenario(1), 2: scenario(2) }, candidates: [] };
  result.candidates = result.weaponSetResults[2].candidates;
  const input = { audit, result, verification: { passed: true, checkCount: 1, checks: [{ name: "fixture arithmetic", passed: true }] },
    preflight: { version: 1, status: "ready_for_audit", canGenerateRoutes: true, sourceXmlSha256: "controlled", graphVersion: "fixture", findings: [] },
    requirements: { version: 1, name: "Fixture", requiredNodeIds: [], minimums: [] } };
  attachFixtureCoverage(input);
  return input;
}
const coverage = (input, set = 2, index = 0) => input.result.weaponSetResults[set].candidates[index].effectCoverage;
function addUnsupportedGrant(record) {
  record.nodes.push({ id: "56666", name: "Thaumaturgic Generator", granted: true, paid: false, descriptionLineCount: 1 });
  record.grants.push({ name: "thaumaturgic generator", structured: false, resolvedNodeIds: ["56666"], appliedNodeIds: ["56666"] });
  record.lines.push({ kind: "passive", ownerId: "56666", ownerName: "Thaumaturgic Generator", granted: true, index: 1,
    text: "Grants Thaumaturgical Dynamism", parseStatus: "unparsed", parsedModCount: 0, unrecognizedText: "Grants Thaumaturgical Dynamism " });
}

test("no parser gaps means scoped coverage, never a full mechanic-support guarantee", () => {
  const input = fixture();
  const report = evaluateBuildRequirements(input);
  assert.equal(report.runtimeEffectCoverage.status, "no_parser_gaps_detected");
  assert.equal(report.rankingStatus, "scoped");
  assert.deepEqual(report.ranking, ["Candidate", "Original"]);
  assert.match(report.runtimeEffectCoverage.scope.meaning, /not proof of full mechanic support/);
});

test("full-catalog grant outside routing graph is recognized separately from its unsupported effect", () => {
  const input = fixture(); addUnsupportedGrant(coverage(input));
  const report = inspectRuntimeEffectCoverage(input.audit, input.result, { nodes: {} });
  assert.equal(report.evidenceComplete, true);
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0].code, "unparsed_effect");
  assert.equal(report.findings[0].weaponSet, 2);
  assert.equal(report.candidates.find((entry) => entry.label === "Original" && entry.weaponSet === 2).grantedNodes[0].inRoutingGraph, false);
});

test("known gaps stay visible even when the candidate removes the unmodeled node", () => {
  const input = fixture(); addUnsupportedGrant(coverage(input));
  const report = evaluateBuildRequirements(input);
  assert.equal(report.rankingStatus, "provisional");
  assert.equal(report.candidates[1].performanceConfidence, "provisional");
  assert.equal(report.candidates[1].effectCoverageChanges.find((entry) => entry.weaponSet === 2).removedWarnings[0].ownerId, "56666");
  assert.deepEqual(report.ranking, ["Original"]);
  assert.equal(report.candidates[1].decision, "rejected");
  assert.equal(report.candidates[1].passiveEffectProtection[0].nodeId, "56666");
  assert.match(report.rankingWarning, /not proof/);
});

const grantText = "Grants Thaumaturgical Dynamism";
const exception = (changes = {}) => ({ nodeId: "56666", text: grantText, reason: "Deliberate fixture tradeoff, not a gameplay recommendation.", ...changes });
const allow = (input, rules) => { input.requirements.effectCoverage = { allowedPassiveEffectLosses: rules }; };
function addPassiveLine(record, id, text, parseStatus = "unparsed", index = 1) {
  const node = record.nodes.find((node) => node.id === id);
  node.descriptionLineCount++;
  record.lines.push({ kind: "passive", ownerId: id, ownerName: node.name, granted: node.granted, index, text, parseStatus,
    parsedModCount: parseStatus === "partial" ? 1 : 0, ...(parseStatus === "partial" ? { unrecognizedText: "Unrecognized remainder" } : {}) });
}

test("existing policies default to protecting even small unmodeled passive nodes", () => {
  const input = fixture(); addPassiveLine(coverage(input), "n", "Recover Life on a trigger");
  const report = evaluateBuildRequirements(input);
  assert.deepEqual(report.requirements.effectCoverage, { allowedPassiveEffectLosses: [] });
  assert.equal(report.candidates[1].decision, "rejected");
  assert.ok(report.candidates[1].failures.some((entry) => entry.code === "preserve_unmodeled_passive" && entry.actual === 0 && entry.minimum === 1));
  assert.equal(report.candidates[0].decision, "eligible");
});

test("partial and unavailable original passive effects are protected too", () => {
  for (const status of ["partial", "unavailable"]) {
    const input = fixture(); addPassiveLine(coverage(input), "n", "Unmodeled effect", status);
    assert.deepEqual(evaluateBuildRequirements(input).ranking, ["Original"]);
  }
});

test("exact retained effect passes even if parser status or line index changes", () => {
  const input = fixture();
  addPassiveLine(coverage(input), "g", "Trigger effect", "partial");
  addPassiveLine(coverage(input, 2, 1), "g", "Trigger effect", "parsed", 3);
  const report = evaluateBuildRequirements(input);
  assert.equal(report.candidates[1].decision, "eligible");
  assert.equal(report.candidates[1].passiveEffectProtection[0].lostOccurrences, 0);
});

test("same text on another node is not silently treated as an equivalent mechanic", () => {
  const input = fixture(); addPassiveLine(coverage(input), "n", "Trigger effect");
  addPassiveLine(coverage(input, 2, 1), "g", "Trigger effect");
  assert.equal(evaluateBuildRequirements(input).candidates[1].decision, "rejected");
});

test("duplicate effect occurrences and exact text changes cannot hide a loss", () => {
  const input = fixture();
  addPassiveLine(coverage(input), "g", "Recover 2% Life", "unparsed", 1);
  addPassiveLine(coverage(input), "g", "Recover 2% Life", "parsed", 2);
  addPassiveLine(coverage(input, 2, 1), "g", "Recover 2% Life", "parsed", 1);
  const report = evaluateBuildRequirements(input);
  assert.equal(report.candidates[1].passiveEffectProtection[0].originalOccurrences, 2);
  assert.equal(report.candidates[1].passiveEffectProtection[0].retainedOccurrences, 1);
  assert.equal(report.candidates[1].decision, "rejected");
  coverage(input, 2, 1).lines[0].text = "Recover 1% Life";
  assert.equal(evaluateBuildRequirements(input).candidates[1].passiveEffectProtection[0].retainedOccurrences, 0);
});

test("an exact reasoned exception allows only its reviewed loss and keeps warnings", () => {
  const input = fixture(); addUnsupportedGrant(coverage(input)); allow(input, [exception()]);
  const report = evaluateBuildRequirements(input);
  assert.equal(report.candidates[1].decision, "eligible");
  assert.equal(report.rankingStatus, "provisional");
  assert.equal(report.candidates[1].passiveEffectProtection[0].reason, exception().reason);
  assert.equal(report.candidates[1].passiveEffectProtection[0].allowedLoss, true);
  assert.ok(report.candidates[1].checks.some((entry) => entry.code === "unmodeled_passive_loss_allowed" && entry.passed));
  assert.ok(report.runtimeEffectCoverage.findings.length > 0);
});

test("permission for W1 cannot waive a W2 loss; disjoint exceptions are supported", () => {
  const input = fixture(); addUnsupportedGrant(coverage(input, 1)); addUnsupportedGrant(coverage(input, 2));
  allow(input, [exception({ weaponSets: [1] })]);
  let report = evaluateBuildRequirements(input);
  assert.equal(report.candidates[1].decision, "rejected");
  assert.ok(report.candidates[1].failures.some((entry) => entry.label.startsWith("W2:")));
  allow(input, [exception({ weaponSets: [1] }), exception({ weaponSets: [2] })]);
  report = evaluateBuildRequirements(input);
  assert.equal(report.candidates[1].decision, "eligible");
});

test("effect exceptions never waive required nodes, numeric floors, or equipment requirements", () => {
  for (const change of [
    (input) => input.requirements.requiredNodeIds = ["n"],
    (input) => input.requirements.minimums = [{ metric: "FullDPS", value: 101 }],
    (input) => input.result.weaponSetResults[2].candidates[1].reloadOutput.ReqStr = 21,
  ]) {
    const input = fixture(); addUnsupportedGrant(coverage(input)); allow(input, [exception()]); change(input);
    assert.equal(evaluateBuildRequirements(input).candidates[1].decision, "rejected");
  }
});

test("stale, wrong-text, wrong-node and unevaluated-set exceptions are rejected", () => {
  for (const changes of [{ text: "Different effect" }, { nodeId: "n" }, { weaponSets: [1] }, { weaponSets: [1, 2] }]) {
    const input = fixture(); addUnsupportedGrant(coverage(input)); allow(input, [exception(changes)]);
    assert.throws(() => evaluateBuildRequirements(input), /stale or does not match/);
  }
});

test("malformed and broad exceptions fail parsing rather than disabling protection", () => {
  for (const policy of [null, false, [], {}, { allowedPassiveEffectLosses: "all" },
    { allowedPassiveEffectLosses: [], mode: "ignore" },
    ...[{}, null, exception({ nodeId: "*" }), exception({ text: "*" }), exception({ reason: " " }),
      exception({ weaponSets: [] }), exception({ weaponSets: [1, 1] }), exception({ weaponSets: ["2"] }),
      exception({ ignore: true })].map((rule) => ({ allowedPassiveEffectLosses: [rule] })),
    { allowedPassiveEffectLosses: [exception(), exception({ weaponSets: [2] })] }]) {
    const input = fixture(); input.requirements.effectCoverage = policy;
    assert.throws(() => parseBuildRequirements(input.requirements, input.audit));
  }
});

test("explicit permission cannot bypass missing coverage or arithmetic evidence", () => {
  const input = fixture(); addUnsupportedGrant(coverage(input)); allow(input, [exception()]);
  delete coverage(input).version;
  assert.equal(evaluateBuildRequirements(input).rankingStatus, "not_ranked");
  input.verification.passed = false;
  assert.equal(evaluateBuildRequirements(input).status, "invalid_audit");
});

test("adding an unmodeled effect or removing only item/custom warnings is not a passive loss", () => {
  const input = fixture(); addUnsupportedGrant(coverage(input, 2, 1));
  const c = coverage(input);
  c.customLineCount = 1;
  c.lines.push({ kind: "custom", ownerId: "active-config", ownerName: "Custom", index: 1, text: "Unknown custom effect", parseStatus: "unparsed", parsedModCount: 0 });
  const before = JSON.stringify(input);
  const report = evaluateBuildRequirements(input);
  assert.equal(report.candidates[1].decision, "eligible");
  assert.equal(report.rankingStatus, "provisional");
  assert.equal(JSON.stringify(input), before);
});

test("partial item and active custom modifiers retain exact source text and ownership", () => {
  const input = fixture(); const c = coverage(input);
  c.items.push({ id: "27", name: "Amulet", slot: "Amulet", lineCount: 1 });
  c.lines.push({ kind: "item", ownerId: "27", ownerName: "Amulet", slot: "Amulet", category: "explicitModLines", index: 1,
    text: "+5 Strength and an unknown effect", parseStatus: "partial", parsedModCount: 1, unrecognizedText: "and an unknown effect" });
  c.customLineCount = 1;
  c.lines.push({ kind: "custom", ownerId: "active-config", ownerName: "Active custom modifiers", index: 1,
    text: "Unsupported custom effect", parseStatus: "unparsed", parsedModCount: 0 });
  const r = inspectRuntimeEffectCoverage(input.audit, input.result);
  assert.equal(r.evidenceComplete, true);
  assert.deepEqual(r.findings.map((entry) => entry.code), ["partially_parsed_effect", "unparsed_effect"]);
  assert.equal(r.findings[0].ownerId, "27");
});

test("unresolved or unapplied grants produce warnings, not fake free or paid nodes", () => {
  const input = fixture(); const c = coverage(input);
  c.grants.push({ name: "Unknown notable", structured: false, resolvedNodeIds: [], appliedNodeIds: [] });
  c.grants.push({ name: "Not applied", structured: false, resolvedNodeIds: ["123"], appliedNodeIds: [] });
  const report = inspectRuntimeEffectCoverage(input.audit, input.result);
  assert.equal(report.evidenceComplete, true);
  assert.deepEqual(report.findings.map((entry) => entry.code), ["unresolved_grant", "grant_not_applied"]);
  assert.equal(c.nodes.some((node) => node.id === "123"), false);
});

test("duplicate grants do not duplicate the same node-effect warning", () => {
  const input = fixture(); const c = coverage(input); addUnsupportedGrant(c); c.grants.push(structuredClone(c.grants[0]));
  assert.equal(inspectRuntimeEffectCoverage(input.audit, input.result).findings.length, 1);
});

test("missing, stale, mislabeled or malformed coverage blocks ranking despite arithmetic success", () => {
  const changes = [
    (c) => delete c.version, (c) => c.sourceXmlSha256 = "stale", (c) => c.weaponSet = 1,
    (c) => c.engineVersion = "old", (c) => c.candidateLabel = "different", (c) => c.items = {},
    (c) => c.nodes.pop(), (c) => c.nodes[0] = null, (c) => c.lines.push(null),
    (c) => c.customLineCount = 1, (c) => c.grants.push(null),
  ];
  for (const change of changes) {
    const input = fixture(); change(coverage(input));
    const report = evaluateBuildRequirements(input);
    assert.equal(report.status, "unverified_effect_coverage");
    assert.deepEqual(report.ranking, []);
    assert.equal(report.bestEligibleLabel, null);
    assert.ok(report.candidates.every((entry) => entry.decision === "unverified"));
  }
});

test("dropping a warning line or relabeling it as parsed does not hide evidence gaps", () => {
  for (const change of [(c) => c.lines.pop(), (c) => c.lines[0].parseStatus = "parsed", (c) => c.lines.push({ ...c.lines[0] })]) {
    const input = fixture(); const c = coverage(input); addUnsupportedGrant(c); change(c);
    assert.equal(inspectRuntimeEffectCoverage(input.audit, input.result).evidenceComplete, false);
  }
});

test("a saved complete flag or empty warning list is not trusted", () => {
  const input = fixture(); addUnsupportedGrant(coverage(input));
  input.verification.effectCoverage = { evidenceComplete: true, findings: [] };
  assert.equal(evaluateBuildRequirements(input).rankingStatus, "provisional");
  delete coverage(input).version;
  assert.equal(evaluateBuildRequirements(input).rankingStatus, "not_ranked");
});

test("checks preserve inputs and do not borrow coverage from another weapon set", () => {
  const input = fixture(); const before = JSON.stringify(input);
  inspectRuntimeEffectCoverage(input.audit, input.result);
  assert.equal(JSON.stringify(input), before);
  delete input.result.weaponSetResults[1];
  assert.equal(inspectRuntimeEffectCoverage(input.audit, input.result).evidenceComplete, false);
});

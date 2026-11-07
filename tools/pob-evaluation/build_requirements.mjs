import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { verifyRealAudit } from "./verify_real_audit.mjs";
import { inspectAuditJob, isPreflightReady } from "./import_preflight.mjs";
import { inspectRuntimeEffectCoverage } from "./effect_coverage.mjs";
import { parsePassiveEffectPolicy, evaluatePassiveEffectPolicy } from "./passive_effect_policy.mjs";

const metrics = new Map([
  ["FullDPS", "Full DPS"], ["CombinedDPS", "Combined DPS"],
  ["TotalEHP", "Configured effective hit pool"],
  ["Life", "Life"], ["Mana", "Mana"], ["EnergyShield", "Energy Shield"],
  ["sharedMindOverMatter", "Damage taken from Mana before Life (%)"],
  ["sharedManaEffectiveLife", "Life/mana resource pool"],
  ["Str", "Strength"], ["Dex", "Dexterity"], ["Int", "Intelligence"],
  ["LifeRegenRecovery", "Life regeneration/recovery per second"],
  ["ManaRegenRecovery", "Mana regeneration/recovery per second"],
]);
const signedMetrics = new Set(["LifeRegenRecovery", "ManaRegenRecovery"]);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonnegative = (value) => Number.isFinite(value) && value >= 0;
const has = (object, key) => Object.hasOwn(object, key);

function knownKeys(object, keys, label) {
  if (!isObject(object) || Object.keys(object).some((key) => !keys.includes(key))) {
    throw new Error(`${label} has an invalid shape or an unknown field.`);
  }
}

export function parseBuildRequirements(input, audit) {
  knownKeys(input, ["version", "name", "requiredNodeIds", "minimums", "effectCoverage"], "Requirements");
  if (input.version !== 1) throw new Error("Requirements version must be 1.");
  if (typeof input.name !== "string" || !input.name.trim()) throw new Error("Requirements need a nonempty name.");
  if (!Array.isArray(input.requiredNodeIds) || !Array.isArray(input.minimums)) throw new Error("Required nodes and minimums must be arrays.");
  const original = new Set(audit.originalMainNodeIds);
  if (input.requiredNodeIds.some((id) => typeof id !== "string" || !original.has(id))) {
    throw new Error("Protected nodes must belong to the original main tree.");
  }
  if (new Set(input.requiredNodeIds).size !== input.requiredNodeIds.length) throw new Error("Protected nodes must not be duplicated.");
  const seenMetrics = new Set();
  const minimums = input.minimums.map((rule) => {
    knownKeys(rule, ["metric", "value", "baselineFraction", "weaponSets"], "Minimum");
    if (!metrics.has(rule.metric)) throw new Error(`Unsupported requirement metric: ${rule.metric}`);
    if (seenMetrics.has(rule.metric)) throw new Error(`Duplicated requirement metric: ${rule.metric}`);
    seenMetrics.add(rule.metric);
    if (has(rule, "value") === has(rule, "baselineFraction")) throw new Error("A minimum needs exactly one of value or baselineFraction.");
    const key = has(rule, "value") ? "value" : "baselineFraction";
    if (!nonnegative(rule[key])) throw new Error(`Minimum ${key} must be a finite nonnegative number.`);
    if (rule.metric === "sharedMindOverMatter" && key === "value" && rule.value > 100) throw new Error("Mana protection cannot exceed 100%.");
    if (has(rule, "weaponSets") && (!Array.isArray(rule.weaponSets) || !rule.weaponSets.length
      || rule.weaponSets.some((set) => set !== 1 && set !== 2) || new Set(rule.weaponSets).size !== rule.weaponSets.length)) {
      throw new Error("weaponSets must be a nonempty list of distinct 1/2 set numbers.");
    }
    return { metric: rule.metric, [key]: rule[key], ...(rule.weaponSets ? { weaponSets: [...rule.weaponSets] } : {}) };
  });
  return { version: 1, name: input.name.trim(), requiredNodeIds: [...input.requiredNodeIds], minimums,
    effectCoverage: parsePassiveEffectPolicy(input.effectCoverage) };
}

export function evaluateBuildRequirements({ audit, result, verification, preflight, requirements: input, graph }) {
  const requirements = parseBuildRequirements(input, audit);
  const original = audit.candidates.find((candidate) => candidate.label === "Original");
  const duplicateLabels = (entries) => new Set(entries.map((entry) => entry.label)).size !== entries.length;
  const recordedChecks = Array.isArray(verification?.checks) ? verification.checks : [];
  const integrityChecks = recordedChecks.filter((check) => check.category !== "requirement");
  const auditFailures = integrityChecks.filter((check) => check.passed !== true).map((check) => check.name);
  if (!(verification?.passed === true || verification?.integrityPassed === true) || verification?.integrityPassed === false) auditFailures.push("Audit integrity did not pass");
  if (!integrityChecks.length || verification?.checkCount !== recordedChecks.length) auditFailures.push("Audit evidence is missing or incomplete");
  if (duplicateLabels(audit.candidates) || duplicateLabels(result.candidates)) auditFailures.push("Candidate labels are ambiguous");
  if (!original || !result.candidates.some((candidate) => candidate.label === "Original")) auditFailures.push("Original control is missing");
  const verified = auditFailures.length === 0;
  const generationPolicyMatches = audit.generation?.phase !== "coverage_constrained"
    || isDeepStrictEqual(audit.generation.effectCoveragePolicy, requirements.effectCoverage);
  const compatible = isPreflightReady(preflight, audit.sourceXmlSha256) && preflight.graphVersion === audit.graphVersion;
  // Derive coverage again from native records, never a persisted warning/complete flag.
  const runtimeEffectCoverage = inspectRuntimeEffectCoverage(audit, result, graph);
  const covered = runtimeEffectCoverage.evidenceComplete;
  const readyToRank = verified && compatible && covered && generationPolicyMatches;
  const passiveEffectPolicy = readyToRank ? evaluatePassiveEffectPolicy(audit, result, requirements.effectCoverage) : [];
  const scenarios = result.weaponSetResults ?? { [String(result.originalActiveWeaponSet ?? 1)]: result };
  const candidates = audit.candidates.map((candidate) => {
    const evaluated = result.candidates.find((entry) => entry.label === candidate.label);
    const output = evaluated?.reloadOutput ?? {};
    const checks = [];
    const add = (code, label, passed, actual, minimum) => checks.push({
      code, label, passed: passed === true, actual: actual ?? null, minimum: minimum ?? null,
    });
    if (!compatible) {
      add("import_incompatible", "Import compatibility preflight must pass for this source and graph", false);
    } else if (!verified) {
      add("audit_failed", "Audit must pass before judging candidate performance", false);
    } else if (!covered) {
      add("effect_coverage_missing", "Re-run the native audit to capture complete source-bound effect coverage before ranking", false);
    } else if (!generationPolicyMatches) {
      add("generation_policy_mismatch", "Regenerate routes using the same effect-loss exceptions as this comparison", false);
    } else {
      const nodes = new Set(candidate.nodeIds);
      // Audit goals remain mandatory even when the policy adds no extra protected nodes.
      for (const id of new Set([...audit.goalNodeIds, ...audit.pinnedAttributeNodeIds, ...requirements.requiredNodeIds])) {
        add("required_node", `Retain required node ${id}`, nodes.has(id), nodes.has(id), true);
      }
      for (const effect of passiveEffectPolicy.find((entry) => entry.label === candidate.label).effects) {
        add(effect.allowedLoss ? "unmodeled_passive_loss_allowed" : "preserve_unmodeled_passive",
          `W${effect.weaponSet}: retain ${effect.nodeName} (${effect.nodeId}): ${effect.text}${effect.allowedLoss ? `; explicitly allowed loss: ${effect.reason}` : ""}`,
          effect.passed, effect.retainedOccurrences, effect.originalOccurrences);
      }
      for (const [set, scenario] of Object.entries(scenarios)) {
        const measured = scenario.candidates.find((entry) => entry.label === candidate.label);
        const scenarioOutput = measured?.reloadOutput ?? {};
        const points = measured?.pobPointCounts?.nonWeaponMain ?? measured?.pobPointCounts?.main;
        add("point_cost", `W${set}: verified non-weapon main point cost`, Number.isSafeInteger(candidate.pointCost) && candidate.pointCost >= 0
          && points === candidate.pointCost, points, candidate.pointCost);
        for (const attribute of ["Str", "Dex", "Int"]) {
          const actual = scenarioOutput[attribute];
          const required = scenarioOutput[`Req${attribute}`];
          add("attribute_requirement", `W${set}: meet ${metrics.get(attribute)} equipment/gem requirements`,
            nonnegative(actual) && nonnegative(required) && actual >= required, actual, required);
        }
      }
      for (const rule of requirements.minimums) {
        for (const set of rule.weaponSets?.map(String) ?? Object.keys(scenarios)) {
          const scenario = scenarios[set];
          const actual = scenario?.candidates.find((entry) => entry.label === candidate.label)?.reloadOutput?.[rule.metric];
          const baseline = scenario?.baseline?.[rule.metric];
          const relativeMinimum = has(rule, "baselineFraction");
          const minimum = relativeMinimum && nonnegative(baseline) ? baseline * rule.baselineFraction : rule.value;
          const label = `W${set}: ${metrics.get(rule.metric)} minimum${relativeMinimum ? ` (${rule.baselineFraction * 100}% of original W${set})` : ""}`;
          const valid = Number.isFinite(actual) && (signedMetrics.has(rule.metric) || actual >= 0) && nonnegative(minimum)
            && (!relativeMinimum || nonnegative(baseline))
            && (!signedMetrics.has(rule.metric) || scenario?.recoveryCaptured === true)
            && !(relativeMinimum && ["FullDPS", "CombinedDPS"].includes(rule.metric) && baseline === 0);
          add(valid ? "metric_minimum" : "missing_or_invalid_metric", label, valid && actual >= minimum, actual, minimum);
        }
      }
    }
    const failures = checks.filter((check) => !check.passed);
    return {
      label: candidate.label, original: candidate.label === "Original", pointCost: candidate.pointCost,
      pointChange: original ? candidate.pointCost - original.pointCost : null,
      decision: !readyToRank ? "unverified" : failures.length ? "rejected" : "eligible",
      metrics: Object.fromEntries([...metrics.keys()].map((metric) => [metric, Number.isFinite(output[metric]) ? output[metric] : null])),
      auditWarnings: verification?.summaries?.find((entry) => entry.label === candidate.label)?.warnings ?? [],
      effectCoverageWarnings: runtimeEffectCoverage.findings.filter((finding) => finding.candidateLabel === candidate.label),
      effectCoverageChanges: runtimeEffectCoverage.candidates.filter((entry) => entry.label === candidate.label)
        .map(({ weaponSet, changesFromOriginal }) => ({ weaponSet, ...changesFromOriginal })),
      passiveEffectProtection: passiveEffectPolicy.find((entry) => entry.label === candidate.label)?.effects ?? [],
      performanceConfidence: !readyToRank ? "unverified" : runtimeEffectCoverage.findings.length ? "provisional" : "scoped_parser_checks_only",
      weaponSetMetrics: Object.fromEntries(Object.entries(scenarios).map(([set, scenario]) => [set,
        scenario.candidates.find((entry) => entry.label === candidate.label)?.reloadOutput ?? null])),
      checks, failures,
    };
  });
  const eligible = candidates.filter((candidate) => candidate.decision === "eligible");
  const ranking = [...eligible].sort((a, b) => a.pointCost - b.pointCost
    || (b.metrics[audit.damageMetric ?? "FullDPS"] ?? 0) - (a.metrics[audit.damageMetric ?? "FullDPS"] ?? 0) || a.label.localeCompare(b.label)).map((candidate) => candidate.label);
  return {
    status: !compatible ? "incompatible_import" : !verified ? "invalid_audit" : !covered ? "unverified_effect_coverage" : !generationPolicyMatches ? "generation_policy_mismatch" : eligible.length ? "evaluated" : "no_eligible_candidates",
    requirements, preflight: preflight ?? null, originalRetained: original !== undefined,
    auditVerification: { passed: verified, checkCount: verification?.checkCount ?? 0, integrityCheckCount: integrityChecks.length,
      deferredRequirementCheckCount: recordedChecks.length - integrityChecks.length, failedChecks: auditFailures },
    eligibleCount: eligible.length, rejectedCount: candidates.filter((candidate) => candidate.decision === "rejected").length,
    runtimeEffectCoverage,
    passiveEffectPolicy: { mode: "preserve_unmodeled_passives", evaluated: readyToRank,
      allowedPassiveEffectLosses: requirements.effectCoverage.allowedPassiveEffectLosses,
      meaning: "Retain original unmodeled passive effects by source node, exact text and occurrence count in each set unless a specific loss is explicitly allowed. Exceptions do not waive numeric minima, required nodes or evidence checks." },
    rankingStatus: !readyToRank || !ranking.length ? "not_ranked" : runtimeEffectCoverage.findings.length ? "provisional" : "scoped",
    rankingWarning: runtimeEffectCoverage.findings.length ? "Known parser gaps remain. This is a provisional ordering of modeled outputs, not proof that removed or unparsed effects have no value." : "Parser checks do not establish complete mechanic support or in-game viability.",
    ranking, bestEligibleLabel: ranking[0] ?? null, candidates,
    rankingBasis: `Fewest non-weapon main points among eligible candidates; ${audit.damageMetric ?? "FullDPS"} in the original active set breaks equal-cost ties. No preference score or optimality proof.`,
    scope: "Offline policy checks for the audited fixture, not a general build viability guarantee or independent validation of full DPS/EHP/total sustain.",
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [jobDirectory, policyPath, reportName = "build.requirements-report.json"] = process.argv.slice(2);
    if (!jobDirectory || !policyPath) throw new Error("Usage: node build_requirements.mjs JOB_DIRECTORY REQUIREMENTS.json [NAME.requirements-report.json]");
    const job = resolve(jobDirectory);
    const withinVar = relative(resolve("var"), job);
    if (!withinVar || withinVar.startsWith("..") || isAbsolute(withinVar)) throw new Error("Audit job must be a subdirectory of var.");
    if (basename(reportName) !== reportName || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.requirements-report\.json$/.test(reportName)) {
      throw new Error("Report name must be a plain filename ending in .requirements-report.json.");
    }
    const read = (name) => readFileSync(resolve(job, name));
    const savedPath = resolve(job, "import-preflight.json");
    const saved = existsSync(savedPath) ? JSON.parse(readFileSync(savedPath, "utf8")) : undefined;
    const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
    const blocked = (preflight) => {
      const report = { status: "incompatible_import", preflight, ranking: [], bestEligibleLabel: null, candidates: [],
        scope: "No performance ranking was performed. Existing candidate results must not be used for this blocked import." };
      writeFileSync(resolve(job, reportName), `${JSON.stringify(report, null, 2)}\n`);
      console.log(JSON.stringify(report, null, 2));
      process.exitCode = 1;
    };
    if (saved && !isPreflightReady(saved, saved.sourceXmlSha256)) {
      blocked(saved);
    } else {
      const sourceXml = read("source-build.xml");
      const auditBytes = read("audit-input.json");
      const audit = JSON.parse(auditBytes);
      const generationPath = resolve(job, "generation-preflight.json");
      if (audit.generation || existsSync(generationPath)) {
        const generation = existsSync(generationPath) ? JSON.parse(readFileSync(generationPath, "utf8")) : undefined;
        if (generation?.version !== 1 || generation.status !== "ready" || generation.auditInputSha256 !== hash(auditBytes)) {
          writeFileSync(resolve(job, reportName), `${JSON.stringify({ status: "blocked_generation", ranking: [], bestEligibleLabel: null,
            candidates: [], scope: "Generation preparation is missing, blocked or stale. Use a fresh job before ranking." }, null, 2)}\n`);
          throw new Error("Generation preparation is missing, blocked or stale; no ranking was performed.");
        }
      }
      const graphBytes = readFileSync("data/tree-graph.json");
      const graph = JSON.parse(graphBytes);
      const preflight = inspectAuditJob(sourceXml.toString("utf8"), graph, audit, saved);
      if (!isPreflightReady(preflight, hash(sourceXml))) {
        blocked(preflight);
      } else {
        const resultBytes = read("real-build-results.json");
        const policyBytes = readFileSync(resolve(policyPath));
        const result = JSON.parse(resultBytes);
        const invalidRequirements = (error) => {
          writeFileSync(resolve(job, reportName), `${JSON.stringify({ status: "invalid_requirements", error: error.message,
            ranking: [], bestEligibleLabel: null, candidates: [], sourceXmlSha256: hash(sourceXml), policySha256: hash(policyBytes),
            scope: "No ranking was performed. The policy or its exceptions must be corrected before reusing any previous comparison." }, null, 2)}\n`);
          throw error;
        };
        let policy;
        try { policy = JSON.parse(policyBytes); parseBuildRequirements(policy, audit); }
        catch (error) { invalidRequirements(error); }
        // Re-run the audit; a saved 'passed' flag is not trusted as current evidence.
        const verification = verifyRealAudit(audit, result, sourceXml, graph);
        let report;
        try { report = evaluateBuildRequirements({ audit, result, verification, preflight, graph, requirements: policy }); }
        catch (error) { invalidRequirements(error); }
        report.provenance = {
          sourceUrl: audit.sourceUrl, sourceXmlSha256: hash(sourceXml), auditInputSha256: hash(auditBytes),
          resultSha256: hash(resultBytes), policySha256: hash(policyBytes), graphSha256: hash(graphBytes),
          engineVersion: result.engineVersion, graphVersion: audit.graphVersion,
        };
        writeFileSync(resolve(job, reportName), `${JSON.stringify(report, null, 2)}\n`);
        console.log(JSON.stringify({ status: report.status, policy: report.requirements.name,
          preflight: { status: preflight.status, warnings: preflight.findings.filter((finding) => finding.severity === "warning").map((finding) => finding.message) },
          auditChecks: report.auditVerification.checkCount,
          runtimeEffectCoverage: { status: report.runtimeEffectCoverage.status, warningCount: report.runtimeEffectCoverage.findings.length,
            warningMessages: [...new Set(report.runtimeEffectCoverage.findings.map((finding) => finding.message))],
            perCandidate: report.runtimeEffectCoverage.candidates.map(({ label, weaponSet, warningCount }) => ({ label, weaponSet, warningCount })),
            failedChecks: report.runtimeEffectCoverage.checks.filter((check) => !check.passed), scope: report.runtimeEffectCoverage.scope },
          rankingStatus: report.rankingStatus, rankingWarning: report.rankingWarning, ranking: report.ranking,
          passiveEffectPolicy: report.passiveEffectPolicy,
          candidates: report.candidates.map(({ label, pointCost, decision, failures }) => ({ label, pointCost, decision, failures })) }, null, 2));
        if (["invalid_audit", "incompatible_import", "unverified_effect_coverage", "generation_policy_mismatch"].includes(report.status)) process.exitCode = 1;
        else if (report.status === "no_eligible_candidates") process.exitCode = 2;
      }
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}

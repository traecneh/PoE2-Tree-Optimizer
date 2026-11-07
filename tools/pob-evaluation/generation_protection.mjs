import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { collectProtectedPassiveEffects } from "./passive_effect_policy.mjs";
import { inspectRuntimeEffectCoverage } from "./effect_coverage.mjs";
import { inspectAuditJob, isPreflightReady } from "./import_preflight.mjs";
import { verifyRealAudit } from "./verify_real_audit.mjs";
import { parseBuildRequirements } from "./build_requirements.mjs";

export const fingerprint = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const sourceHash = (xml) => createHash("sha256").update(xml).digest("hex");
const sameIds = (a, b) => Array.isArray(a) && Array.isArray(b) && isDeepStrictEqual([...a].sort(), [...b].sort());

export function classifyGenerationProtection(audit, result, requirements) {
  const coverage = inspectRuntimeEffectCoverage(audit, result);
  if (!coverage.evidenceComplete) throw new Error("Generation requires complete, source-bound original runtime coverage.");
  const effects = collectProtectedPassiveEffects(result, requirements.effectCoverage);
  const scenarios = result.weaponSetResults ?? { [String(result.originalActiveWeaponSet ?? 1)]: result };
  const shared = new Set(audit.originalMainNodeIds);
  const ascendancy = new Set(audit.preservedAscendancyNodeIds ?? []);
  const mandatory = new Set(requirements.requiredNodeIds);
  const classified = effects.map((effect) => {
    const original = scenarios[String(effect.weaponSet)].candidates.find((entry) => entry.label === "Original").effectCoverage;
    const node = original.nodes.find((node) => node.id === effect.nodeId);
    let disposition;
    if (effect.lossAllowed) disposition = "explicitly_allowed";
    else if (node?.granted) disposition = "retained_grant";
    else if (shared.has(effect.nodeId)) { disposition = "main_tree_goal"; mandatory.add(effect.nodeId); }
    else if ((audit.preservedWeaponSets?.[effect.weaponSet] ?? []).includes(effect.nodeId)) disposition = "preserved_weapon";
    else if (ascendancy.has(effect.nodeId)) disposition = "preserved_ascendancy";
    else throw new Error(`Cannot preserve unknown allocation context for passive ${effect.nodeId}.`);
    return { ...effect, disposition };
  });
  return { mandatoryNodeIds: [...mandatory].sort(), effects: classified };
}

export function deriveGenerationProtection({ audit, xml, graph, baselineAudit, baselineResult, baselineXml, baselinePreflight, policy }) {
  const hash = sourceHash(xml);
  if (hash !== audit.sourceXmlSha256 || sourceHash(baselineXml) !== hash || baselineAudit.sourceXmlSha256 !== hash) {
    throw new Error("Baseline coverage belongs to a different source XML.");
  }
  if (audit.graphFingerprint !== fingerprint(graph) || baselineAudit.graphFingerprint !== audit.graphFingerprint
    || baselineAudit.graphVersion !== audit.graphVersion) throw new Error("Baseline coverage uses a different or unrecorded game graph fingerprint.");
  for (const key of ["baseNodeId", "activeSpecIndex", "className", "ascendancyName", "validationProfile"]) {
    if (baselineAudit[key] !== audit[key]) throw new Error(`Baseline context differs: ${key}.`);
  }
  for (const key of ["originalMainNodeIds", "preservedAscendancyNodeIds", "preservedWeaponNodeIds"]) {
    if (!sameIds(baselineAudit[key], audit[key])) throw new Error(`Baseline allocation differs: ${key}.`);
  }
  for (const set of [1, 2]) if (!sameIds(baselineAudit.preservedWeaponSets?.[set], audit.preservedWeaponSets?.[set])) {
    throw new Error(`Baseline W${set} allocation differs.`);
  }
  if (baselineAudit.generation?.phase !== "baseline_only" || baselineAudit.candidates.length !== 1 || baselineAudit.candidates[0].label !== "Original"
    || !sameIds(baselineAudit.candidates[0].nodeIds, audit.originalMainNodeIds)) throw new Error("Use a baseline-only audit of the unchanged original build.");
  const preflight = inspectAuditJob(baselineXml.toString(), graph, baselineAudit, baselinePreflight);
  if (!isPreflightReady(preflight, hash)) throw new Error("Baseline import preflight no longer passes.");
  const verification = verifyRealAudit(baselineAudit, baselineResult, baselineXml, graph);
  if (!verification.integrityPassed || !verification.effectCoverage.evidenceComplete) {
    const failures = [...verification.checks.filter((check) => check.category !== "requirement"), ...verification.effectCoverage.checks]
      .filter((check) => !check.passed).map((check) => check.name);
    throw new Error(`Baseline arithmetic/state or runtime-coverage evidence did not pass: ${failures.join("; ")}`);
  }
  const requirements = parseBuildRequirements(policy ?? { version: 1, name: "Conservative generation", requiredNodeIds: [], minimums: [] }, audit);
  return { version: 1, phase: "coverage_constrained", ...classifyGenerationProtection(baselineAudit, baselineResult, requirements),
    effectCoveragePolicy: requirements.effectCoverage, requirements,
    engineVersion: baselineResult.engineVersion, treeVersion: baselineResult.treeVersion,
    baselineSourceXmlSha256: hash, baselineAuditFingerprint: fingerprint(baselineAudit), baselineResultFingerprint: fingerprint(baselineResult),
    originalActiveWeaponSet: baselineResult.originalActiveWeaponSet ?? 1,
    coverageMeaning: "Protected shared passives are goals; fixed weapon/ascendancy allocations and item grants are not converted to paid main goals. Post-evaluation preservation still applies." };
}

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { regenerationFromInputs } from "./recovery_checks.mjs";
import { isDeepStrictEqual } from "node:util";
import { inspectRuntimeEffectCoverage } from "./effect_coverage.mjs";

export function numbersAgree(actual, expected, tolerance = 1e-8) {
  return Number.isFinite(actual) && Number.isFinite(expected)
    && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected));
}

// Resource conservation only: this does not include mitigation, avoidance, or recovery.
export function lifeManaHitPool(life, mana, manaPercent) {
  if (![life, mana, manaPercent].every(Number.isFinite) || life < 0 || mana < 0 || manaPercent < 0 || manaPercent > 100) return undefined;
  return manaPercent === 100 ? life + mana : Math.min(life + mana, life / (1 - manaPercent / 100));
}

export function auditConnected(nodeIds, edgeKeys, root) {
  const ids = new Set(nodeIds);
  if (!ids.has(root)) return false;
  const adjacency = new Map([...ids].map((id) => [id, []]));
  for (const key of edgeKeys) {
    const [from, to, extra] = key.split("::");
    if (extra !== undefined || !ids.has(from) || !ids.has(to)) return false;
    adjacency.get(from).push(to);
    adjacency.get(to).push(from);
  }
  const visited = new Set([root]);
  for (const id of visited) for (const next of adjacency.get(id)) visited.add(next);
  return visited.size === ids.size;
}

function verifyScenario(audit, result, sourceXml, graph) {
  const checks = [];
  const add = (name, passed, detail, category = "integrity") => checks.push({ name, passed: passed === true, category, ...(detail ? { detail } : {}) });
  const numeric = (name, actual, expected) => add(name, numbersAgree(actual, expected), { actual: actual ?? null, expected: expected ?? null });
  if (audit.validationProfile === "life-armour") add("Life/armour profile requires recovery evidence", result.recoveryCaptured === true);
  add("source XML unchanged", createHash("sha256").update(sourceXml).digest("hex") === audit.sourceXmlSha256);
  add("game graph version unchanged", graph.gameVersion === audit.graphVersion);
  if (audit.graphFingerprint) add("game graph fingerprint unchanged", createHash("sha256").update(JSON.stringify(graph)).digest("hex") === audit.graphFingerprint);
  if (audit.generation?.phase === "coverage_constrained") {
    add("same PoB engine as original coverage", result.engineVersion === audit.generation.engineVersion && result.treeVersion === audit.generation.treeVersion);
    add("mandatory generation goals remain declared", Array.isArray(audit.generation.mandatoryNodeIds)
      && audit.generation.mandatoryNodeIds.every((id) => audit.goalNodeIds.includes(id) && audit.originalMainNodeIds.includes(id)));
  }
  add("protected context unchanged during calculator overrides", result.contextUnchangedAfterOverrides);
  add("original allocation unchanged during calculator overrides", result.allocationUnchangedAfterOverrides);
  add("protected context restored at end", result.finalContextPreserved);
  add("original allocation restored at end", result.finalAllocationRestored);
  const metrics = ["Life", "Mana", "EnergyShield", "CombinedDPS", "TotalEHP", "Str", "Dex", "Int", "ReqStr", "ReqDex", "ReqInt", "sharedMindOverMatter", "sharedManaEffectiveLife"];
  if ((audit.damageMetric ?? "FullDPS") === "FullDPS" || Number.isFinite(result.baseline?.FullDPS)) metrics.push("FullDPS");
  if (result.recoveryCaptured) metrics.push("Armour", "Evasion", "LifeRegen", "ManaRegen", "LifeRegenRecovery", "ManaRegenRecovery");
  for (const metric of ["ManaPerSecondCost", "LifePerSecondCost"]) if (Number.isFinite(result.baseline?.[metric])) metrics.push(metric);
  for (const metric of metrics) {
    numeric(`baseline after overrides: ${metric}`, result.baselineAfterOverrides?.[metric], result.baseline?.[metric]);
    numeric(`final baseline: ${metric}`, result.finalBaseline?.[metric], result.baseline?.[metric]);
  }
  const originalMain = new Set(audit.originalMainNodeIds);
  const edgeKey = (from, to) => [from, to].sort().join("::");
  const graphEdges = new Set(graph.edges.map((edge) => edgeKey(edge.from, edge.to)));
  const originalCounts = result.candidates.find((candidate) => candidate.label === "Original")?.pobPointCounts;
  const originalRecoveryInputs = result.candidates.find((candidate) => candidate.label === "Original")?.recoveryInputs;
  const summaries = [];
  const manaSplit = (ids) => ids.reduce((sum, id) => sum + (graph.nodes[id]?.stats ?? []).reduce((total, stat) => {
    const match = /^(\d+)% of Damage is taken from Mana before Life$/.exec(stat);
    return total + (match ? Number(match[1]) : 0);
  }, 0), 0);
  for (const candidate of audit.candidates) {
    const actual = result.candidates.find((entry) => entry.label === candidate.label);
    add(`${candidate.label}: evaluated`, Boolean(actual));
    const ids = new Set(candidate.nodeIds);
    add(`${candidate.label}: all goals retained`, audit.goalNodeIds.every((id) => ids.has(id)));
    add(`${candidate.label}: pinned attribute nodes retained`, audit.pinnedAttributeNodeIds.every((id) => ids.has(id)));
    add(`${candidate.label}: connected`, auditConnected(candidate.nodeIds, candidate.edgeKeys, audit.baseNodeId));
    add(`${candidate.label}: edges exist in game graph`, candidate.edgeKeys.every((key) => {
      const [from, to, extra] = key.split("::");
      return extra === undefined && graphEdges.has(edgeKey(from, to));
    }));
    add(`${candidate.label}: main nodes only`, [...ids].every((id) => graph.nodes[id] && !graph.nodes[id].flags.ascendancy));
    numeric(`${candidate.label}: unique point cost`, candidate.pointCost, ids.size - 1);
    numeric(`${candidate.label}: PoB point cost agrees`, actual?.pobPointCounts?.nonWeaponMain ?? actual?.pobPointCounts?.main, candidate.pointCost);
    if (audit.preservedWeaponSets) {
      const expectedUnionCost = candidate.pointCost + audit.preservedWeaponSets["1"].length + audit.preservedWeaponSets["2"].length;
      numeric(`${candidate.label}: PoB union cost agrees`, actual?.pobPointCounts?.main, expectedUnionCost);
      for (const set of ["1", "2"]) {
        const expected = audit.preservedWeaponSets[set];
        const sameIds = (ids) => Array.isArray(ids) && ids.length === expected.length && [...expected].sort().join(",") === [...ids].sort().join(",");
        add(`${candidate.label}: exact W${set} assignment retained`, sameIds(result.weaponNodeIds?.[set]) && sameIds(actual?.weaponNodeIdsOnReload?.[set]));
        const combined = [...candidate.nodeIds, ...expected];
        const edges = graph.edges.filter((edge) => combined.includes(edge.from) && combined.includes(edge.to)).map((edge) => edgeKey(edge.from, edge.to));
        add(`${candidate.label}: W${set} connected without the other set`, auditConnected(combined, edges, audit.baseNodeId));
        add(`${candidate.label}: reserved W${set} nodes not converted to shared nodes`, !expected.some((id) => ids.has(id)));
      }
    }
    for (const key of ["ascendancy", "sockets", "weapon1", "weapon2"]) numeric(`${candidate.label}: preserved ${key} count`, actual?.pobPointCounts?.[key], originalCounts?.[key]);
    add(`${candidate.label}: non-tree context preserved on reload`, actual?.contextPreservedOnReload);
    add(`${candidate.label}: source attribute choices preserved`, actual?.attributeChoicesPreserved && actual?.attributeChoicesPreservedOnReload);
    add(`${candidate.label}: all requested passives loaded`, Array.isArray(actual?.missingAllocationsOnReload) && actual.missingAllocationsOnReload.length === 0);
    const added = [...ids].filter((id) => !originalMain.has(id));
    const removed = [...originalMain].filter((id) => !ids.has(id));
    numeric(`${candidate.label}: added-node delta`, actual?.addedCount, added.length);
    numeric(`${candidate.label}: removed-node delta`, actual?.removedCount, removed.length);
    for (const metric of metrics) numeric(`${candidate.label}: override versus full XML reload: ${metric}`, actual?.overrideOutput?.[metric], actual?.reloadOutput?.[metric]);
    const output = actual?.reloadOutput ?? {};
    for (const attribute of ["Str", "Dex", "Int"]) {
      add(`${candidate.label}: meets ${attribute} requirements`, Number.isFinite(output[attribute]) && Number.isFinite(output[`Req${attribute}`]) && output[attribute] >= output[`Req${attribute}`], undefined, "requirement");
    }
    if ((audit.validationProfile ?? "ci-mana") === "ci-mana") {
      const expectedSplit = Math.max(0, Math.min(100, result.baselineUncappedManaBeforeLife + manaSplit(added) - manaSplit(removed)));
      numeric(`${candidate.label}: game-text mana redirection delta`, output.sharedMindOverMatter, expectedSplit);
      numeric(`${candidate.label}: zero remaining ES in this fixture`, output.EnergyShield, 0);
      numeric(`${candidate.label}: independently derived life/mana pool`, output.sharedManaEffectiveLife,
        lifeManaHitPool(output.LifeRecoverable, output.ManaUnreserved, expectedSplit));
    } else {
      add(`${candidate.label}: life/armour fixture has positive Life and Armour`, output.Life > 1 && output.Armour > 0);
    }
    if (result.recoveryCaptured) for (const resource of ["Life", "Mana"]) {
      const inputs = actual?.recoveryInputs?.[resource];
      const expected = regenerationFromInputs(inputs);
      numeric(`${candidate.label}: ${resource} regeneration input pool agrees`, inputs?.pool, output[resource]);
      numeric(`${candidate.label}: independent ${resource} regeneration arithmetic`, output[`${resource}Regen`], expected?.regeneration);
      numeric(`${candidate.label}: independent ${resource} recovery arithmetic`, output[`${resource}RegenRecovery`], expected?.recovery);
    }
    if (result.recoveryCaptured && (audit.validationProfile ?? "ci-mana") === "ci-mana") {
      const regenIncrease = (nodeIds) => nodeIds.reduce((sum, id) => sum + (graph.nodes[id]?.stats ?? []).reduce((total, stat) => {
        const match = /^(\d+)% increased Mana (?:Regeneration|Recovery) Rate$/.exec(stat);
        return total + (match ? Number(match[1]) : 0);
      }, 0), 0);
      numeric(`${candidate.label}: game-text mana regeneration increase delta in CI fixture`, actual?.recoveryInputs?.Mana?.increased,
        originalRecoveryInputs?.Mana?.increased + regenIncrease(added) - regenIncrease(removed));
    }
    const warnings = [];
    if (output.Life === 1 && output.EnergyShield === 0 && output.sharedMindOverMatter < result.baseline.sharedMindOverMatter) {
      warnings.push("Lost a build-critical Mana-before-Life threshold with Chaos Inoculation and no remaining ES.");
    }
    const damageMetric = audit.damageMetric ?? "FullDPS";
    summaries.push({ label: candidate.label, points: candidate.pointCost, fullDPS: output.FullDPS,
      damageMetric, damage: output[damageMetric],
      dpsChangePercent: result.baseline[damageMetric] > 0 ? (output[damageMetric] / result.baseline[damageMetric] - 1) * 100 : null,
      effectiveHitPool: output.TotalEHP, manaBeforeLifePercent: output.sharedMindOverMatter,
      lifeManaPool: output.sharedManaEffectiveLife, lifeRecovery: output.LifeRegenRecovery, manaRecovery: output.ManaRegenRecovery, warnings });
  }
  return { passed: checks.every((entry) => entry.passed),
    integrityPassed: checks.filter((entry) => entry.category !== "requirement").every((entry) => entry.passed),
    checkCount: checks.length, checks, summaries,
    scope: "Arithmetic and adapter checks for this public fixture; not independent validation of full DPS or EHP." };
}

function verifyArithmeticAudit(audit, result, sourceXml, graph) {
  if (audit.validationProfile && !["ci-mana", "life-armour"].includes(audit.validationProfile)) throw new Error("Unsupported audit profile.");
  if (!result.weaponSetResults) return verifyScenario(audit, result, sourceXml, graph);
  const reports = Object.fromEntries(Object.entries(result.weaponSetResults).map(([set, scenario]) => [set, verifyScenario(audit, scenario, sourceXml, graph)]));
  const checks = Object.entries(reports).flatMap(([set, report]) => report.checks.map((check) => ({ ...check, name: `W${set}: ${check.name}` })));
  const add = (name, passed) => checks.push({ name, passed: passed === true, category: "integrity" });
  if (audit.preservedWeaponNodeIds?.length) add("Both weapon-set scenarios evaluated", ["1", "2"].every((set) => reports[set]));
  if (audit.preservedWeaponNodeIds?.length) add("Explicit weapon assignments available", audit.preservedWeaponSets !== undefined);
  for (const [set, scenario] of Object.entries(result.weaponSetResults)) add(`W${set} uses the requested active weapon set`, scenario.activeWeaponSet === Number(set));
  add("Original selection and context restored after weapon scenarios", result.finalOriginalContextPreserved && result.finalOriginalAllocationRestored);
  add("Original calculated outputs restored after weapon scenarios", isDeepStrictEqual(result.finalOriginalBaseline, result.baseline));
  const active = result.weaponSetResults[String(result.originalActiveWeaponSet)];
  add("Top-level engine and tree match original active scenario", active !== undefined && result.engineVersion === active.engineVersion && result.treeVersion === active.treeVersion);
  add("Top-level results match original active weapon scenario", active !== undefined && isDeepStrictEqual(result.baseline, active.baseline)
    && isDeepStrictEqual(result.candidates, active.candidates));
  return { passed: checks.every((check) => check.passed), integrityPassed: checks.filter((check) => check.category !== "requirement").every((check) => check.passed),
    checkCount: checks.length, checks, summaries: reports[String(result.originalActiveWeaponSet)]?.summaries ?? [],
    weaponSetSummaries: Object.fromEntries(Object.entries(reports).map(([set, report]) => [set, report.summaries])),
    scope: "Adapter and narrow arithmetic checks across explicit weapon scenarios; not independent validation of full DPS, EHP, or in-game sustain." };
}

export function verifyRealAudit(audit, result, sourceXml, graph) {
  return { ...verifyArithmeticAudit(audit, result, sourceXml, graph), effectCoverage: inspectRuntimeEffectCoverage(audit, result, graph) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const job = process.argv[2];
  if (!job) throw new Error("Usage: node verify_real_audit.mjs JOB_DIRECTORY");
  const read = (name) => JSON.parse(readFileSync(resolve(job, name), "utf8"));
  const report = verifyRealAudit(read("audit-input.json"), read("real-build-results.json"), readFileSync(resolve(job, "source-build.xml")), JSON.parse(readFileSync("data/tree-graph.json", "utf8")));
  writeFileSync(resolve(job, "real-build-verification.json"), `${JSON.stringify(report, null, 2)}\n`);
  for (const check of report.checks.filter((entry) => !entry.passed)) console.error(JSON.stringify(check));
  console.log(JSON.stringify({ arithmeticPassed: report.passed, checks: report.checkCount,
    effectCoverage: { status: report.effectCoverage.status, warnings: report.effectCoverage.findings.length,
      failedChecks: report.effectCoverage.checks.filter((check) => !check.passed) }, summaries: report.summaries }, null, 2));
  if (!report.passed || !report.effectCoverage.evidenceComplete) process.exitCode = 1;
}

import { isDeepStrictEqual } from "node:util";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const count = (value) => Number.isSafeInteger(value) && value >= 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const ids = (value) => Array.isArray(value) && value.every(text) && new Set(value).size === value.length;
const sameIds = (a, b) => ids(a) && ids(b) && isDeepStrictEqual([...a].sort(), [...b].sort());
const lineKey = (line) => JSON.stringify([line.kind, line.ownerId, line.slot ?? "", line.category ?? "", line.index]);

export function inspectRuntimeEffectCoverage(audit, result, graph) {
  const checks = [], findings = [], candidates = [];
  const add = (name, passed) => checks.push({ name, passed: passed === true });
  const scenarios = result.weaponSetResults ?? { [String(result.originalActiveWeaponSet ?? 1)]: result };
  if (audit.preservedWeaponNodeIds?.length) add("Runtime coverage includes both weapon sets", scenarios[1] !== undefined && scenarios[2] !== undefined);
  for (const [set, scenario] of Object.entries(scenarios)) {
    add(`W${set}: valid scenario identity`, ["1", "2"].includes(set) && (!result.weaponSetResults || scenario.activeWeaponSet === Number(set)));
    for (const candidate of audit.candidates) {
      const entries = scenario.candidates?.filter((entry) => entry.label === candidate.label) ?? [];
      const coverage = entries[0]?.effectCoverage;
      const prefix = `W${set} ${candidate.label}`;
      add(`${prefix}: source-bound runtime coverage`, entries.length === 1 && coverage?.version === 1
        && coverage.sourceXmlSha256 === audit.sourceXmlSha256 && text(scenario.engineVersion)
        && coverage.engineVersion === scenario.engineVersion && text(scenario.treeVersion) && coverage.treeVersion === scenario.treeVersion
        && coverage.candidateLabel === candidate.label && coverage.weaponSet === Number(set));
      const shape = Array.isArray(coverage?.lines) && Array.isArray(coverage?.nodes) && Array.isArray(coverage?.items) && Array.isArray(coverage?.grants)
        && count(coverage?.customLineCount);
      add(`${prefix}: complete coverage collections`, shape);
      if (!shape) continue;
      const lines = coverage.lines, nodes = coverage.nodes, items = coverage.items;
      const validNodes = nodes.every((node) => object(node) && text(node.id) && text(node.name) && typeof node.granted === "boolean" && typeof node.paid === "boolean" && count(node.descriptionLineCount))
        && ids(nodes.map((node) => node.id));
      const validItems = items.every((item) => object(item) && text(item.id) && text(item.name) && text(item.slot) && count(item.lineCount))
        && new Set(items.map((item) => `${item.slot}:${item.id}`)).size === items.length;
      add(`${prefix}: valid node/item inventories`, validNodes && validItems);
      if (!validNodes || !validItems) continue;
      const expectedNodes = [...new Set([...candidate.nodeIds, ...(audit.preservedAscendancyNodeIds ?? []), ...(audit.preservedWeaponSets?.[set] ?? [])])];
      add(`${prefix}: exact active paid-tree inventory`, sameIds(nodes.filter((node) => !node.granted).map((node) => node.id), expectedNodes));
      const validLine = (line) => object(line) && text(line.ownerId) && text(line.ownerName) && text(line.text) && Number.isSafeInteger(line.index) && line.index > 0
        && count(line.parsedModCount) && ["parsed", "partial", "unparsed", "unavailable"].includes(line.parseStatus)
        && (line.parseStatus !== "partial" || line.parsedModCount > 0 && text(line.unrecognizedText))
        && (line.parseStatus !== "parsed" || !text(line.unrecognizedText))
        && (line.parseStatus !== "unparsed" || line.parsedModCount === 0)
        && (line.kind === "passive" && nodes.some((node) => node.id === line.ownerId && node.granted === line.granted)
          || line.kind === "item" && ["enchantModLines", "implicitModLines", "explicitModLines", "runeModLines"].includes(line.category)
            && items.some((item) => item.id === line.ownerId && item.slot === line.slot)
          || line.kind === "custom" && line.ownerId === "active-config");
      const validLines = lines.every(validLine) && new Set(lines.map(lineKey)).size === lines.length;
      add(`${prefix}: valid unique native parser records`, validLines);
      if (!validLines) continue;
      add(`${prefix}: all inventoried description lines retained`, nodes.every((node) => lines.filter((line) => line.kind === "passive" && line.ownerId === node.id).length === node.descriptionLineCount)
        && items.every((item) => lines.filter((line) => line.kind === "item" && line.ownerId === item.id && line.slot === item.slot).length === item.lineCount)
        && lines.filter((line) => line.kind === "custom").length === coverage.customLineCount);
      const warnings = lines.filter((line) => line.parseStatus !== "parsed").map((line) => ({
        code: line.parseStatus === "partial" ? "partially_parsed_effect" : line.parseStatus === "unavailable" ? "missing_parse_evidence" : "unparsed_effect",
        severity: "warning", weaponSet: Number(set), candidateLabel: candidate.label, ...line,
        message: `${line.ownerName}: ${line.parseStatus === "partial" ? "PoB only partially parses" : line.parseStatus === "unavailable" ? "PoB has no parser evidence for" : "PoB does not parse"} "${line.text}". Its full benefit is not established by these outputs.`,
      }));
      const grantedNodes = nodes.filter((node) => node.granted);
      for (const grant of coverage.grants) {
        const valid = object(grant) && text(grant.name) && typeof grant.structured === "boolean" && ids(grant.resolvedNodeIds) && ids(grant.appliedNodeIds)
          && grant.appliedNodeIds.every((id) => grant.resolvedNodeIds.includes(id) && grantedNodes.some((node) => node.id === id));
        add(`${prefix}: valid grant resolution ${grant?.name ?? "unknown"}`, valid);
        if (!valid) continue;
        if (!grant.resolvedNodeIds.length || !sameIds(grant.resolvedNodeIds, grant.appliedNodeIds)) warnings.push({
          code: !grant.resolvedNodeIds.length ? "unresolved_grant" : "grant_not_applied", severity: "warning", weaponSet: Number(set), candidateLabel: candidate.label,
          ownerName: grant.name, message: `Grant "${grant.name}" ${!grant.resolvedNodeIds.length ? "could not be resolved against PoB's full passive catalog" : "did not apply every resolved passive"}; its benefit is unverified.`,
        });
      }
      // Duplicate grants can refer to the same notable, but must not duplicate effect warnings.
      const uniqueWarnings = [...new Map(warnings.map((warning) => [JSON.stringify([warning.code, warning.kind, warning.ownerId, warning.slot, warning.category, warning.index, warning.ownerName]), warning])).values()];
      const grants = grantedNodes.map((node) => ({ ...node,
        ...(graph ? { inRoutingGraph: Object.hasOwn(graph.nodes, node.id) } : {}),
        effectWarnings: uniqueWarnings.filter((warning) => warning.kind === "passive" && warning.ownerId === node.id).length }));
      candidates.push({ label: candidate.label, weaponSet: Number(set), warningCount: uniqueWarnings.length, warnings: uniqueWarnings, grantedNodes: grants,
        inspectedLineCount: lines.length, status: uniqueWarnings.length ? "warnings" : "no_parser_gaps_detected" });
      findings.push(...uniqueWarnings);
    }
  }
  const warningKey = (warning) => JSON.stringify([warning.code, warning.kind, warning.ownerId, warning.slot, warning.category, warning.index, warning.ownerName, warning.text]);
  for (const candidate of candidates) {
    const baseline = candidates.find((entry) => entry.weaponSet === candidate.weaponSet && entry.label === "Original");
    add(`W${candidate.weaponSet} ${candidate.label}: original coverage available for comparison`, baseline !== undefined);
    const originalKeys = new Set((baseline?.warnings ?? []).map(warningKey));
    const currentKeys = new Set(candidate.warnings.map(warningKey));
    candidate.changesFromOriginal = {
      addedWarnings: candidate.warnings.filter((warning) => !originalKeys.has(warningKey(warning))),
      removedWarnings: (baseline?.warnings ?? []).filter((warning) => !currentKeys.has(warningKey(warning))),
      meaning: "A removed warning may mean an unmodeled effect was removed from the tree, not that its loss is harmless.",
    };
  }
  const passed = checks.length > 0 && checks.every((check) => check.passed);
  return { version: 1, evidenceComplete: passed, status: !passed ? "missing_or_invalid_evidence" : findings.length ? "warnings" : "no_parser_gaps_detected",
    checks, findings, candidates, scope: {
      checked: ["Active paid and granted passive description parser records", "Equipped item and active flask/charm modifier parser records", "Active custom modifier parsing", "Native granted-passive resolution"],
      notChecked: ["Every skill/support modifier", "Whether parsed modifiers are fully implemented or useful to this skill", "Charge/buff uptime, rotations, total sustain", "Independent full damage or EHP correctness"],
      meaning: "Parser coverage only. A parsed line is not proof of full mechanic support; an unparsed effect is not proof of no in-game value.",
    } };
}

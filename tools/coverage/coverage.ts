import { passivePreferenceCatalog, passivePreferenceValues } from "../../src/tree/passivePreferences";
import { skillPreferencePresets } from "../../src/tree/skillPreferencePresets";
import { reviewedSkillSupports } from "../../src/tree/skillSupportPreferences";
import { mortarCannonGrenades } from "../../src/tree/mortarCannonPreferences";
import { utilityTriggerSocketChoices } from "../../src/tree/utilityTriggerSkillPreferencePresets";
import type { TreeGraph } from "../../src/tree/types";

export type Status = "reviewed" | "partial" | "unsupported" | "not-applicable";
export type GemEntry = { id: string; name: string; effectId: string; type: string; tier: number; support: boolean; family?: string };
export type Catalog = { schemaVersion: 1; source: { kind: string; pobVersion: string; file: string; sha256: string; capturedAt: string; referenceUrl: string }; entries: GemEntry[] };
export type Fingerprints = { graphSha256: string; catalogSha256: string };
export type Baseline = { schemaVersion: 1; fingerprints: Fingerprints; graphVersion: string; lines: string[]; contexts: Record<string, number[]> };
const percent = (n: number, d: number) => d ? Math.round(n / d * 1000) / 10 : 0;
const statuses = (rows: { status: Status }[]) => Object.fromEntries((["reviewed", "partial", "unsupported", "not-applicable"] as Status[]).map((s) => [s, rows.filter((r) => r.status === s).length]));

export function parseCatalog(value: unknown): Catalog {
  const catalog = value as Catalog;
  if (!catalog || catalog.schemaVersion !== 1 || !catalog.source || !/^[a-f0-9]{64}$/.test(catalog.source.sha256)
    || [catalog.source.kind, catalog.source.pobVersion, catalog.source.file, catalog.source.referenceUrl].some((s) => typeof s !== "string" || !s)
    || !Number.isFinite(Date.parse(catalog.source.capturedAt))
    || !Array.isArray(catalog.entries) || catalog.entries.length === 0) throw new Error("Invalid coverage catalog/provenance.");
  const ids = new Set<string>();
  for (const entry of catalog.entries) {
    if (!entry || [entry.id, entry.name, entry.effectId, entry.type].some((v) => typeof v !== "string" || !v)
      || typeof entry.support !== "boolean" || !Number.isInteger(entry.tier) || entry.tier < 0 || ids.has(entry.id)) throw new Error("Invalid or duplicate coverage catalog entry.");
    ids.add(entry.id);
  }
  return catalog;
}

export function buildCoverageReport(graph: TreeGraph, catalog: Catalog, fingerprints: Fingerprints) {
  const contexts = [{ id: "manual", focusSkillId: undefined }, ...skillPreferencePresets.map((p) => ({ id: p.id, focusSkillId: p.id })),
    ...mortarCannonGrenades.map((p) => ({ id: `mortar-cannon/${p.id}`, focusSkillId: "mortar-cannon", socketedGrenadeId: p.id })),
    ...Object.entries(utilityTriggerSocketChoices).flatMap(([focusSkillId,ids]) => ids.map(socketedProxySkillId => ({
      id: `${focusSkillId}/${socketedProxySkillId}`, focusSkillId, socketedProxySkillId })))];
  const sourceNodes = Object.values(graph.nodes).sort((a, b) => a.id.localeCompare(b.id));
  const main = sourceNodes.filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery);
  const mainIds = new Set(main.map((n) => n.id));
  const lines = [...new Set(main.flatMap((n) => n.stats))].sort();
  // Parse each distinct wording once per focus, rather than once per occurrence,
  // category and metric. Socket flags must not make unrelated lines look parsed.
  const values = new Map(contexts.map((c) => [c.id, new Map(lines.map((line) => [line,
    passivePreferenceValues({ id: "coverage", stats: [line], flags: {}, position: { x: 0, y: 0 } }, c)]))]));
  const matched = (line: string, id: string) => Object.keys(values.get(id)!.get(line)!).length > 0;
  const union = new Set(lines.filter((line) => contexts.some((c) => matched(line, c.id))));
  const nodes = sourceNodes.map((n) => {
    const applicable = !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery;
    const recognized = applicable ? n.stats.filter((s) => union.has(s)).length : 0;
    const status: Status = !applicable ? "not-applicable" : n.stats.length === 0
      ? n.flags.jewelSocket ? "reviewed" : "not-applicable"
      : recognized === n.stats.length ? "reviewed" : recognized > 0 ? "partial" : "unsupported";
    return { id: n.id, name: n.name ?? "", status, recognizedLines: recognized, stats: n.stats };
  });
  const statNodes = main.filter((n) => n.stats.length > 0);
  const occurrences = statNodes.flatMap((n) => n.stats);
  const totalMatched = occurrences.filter((s) => union.has(s)).length;
  const backlog = new Map<string, { template: string; occurrences: number; nodeIds: Set<string>; examples: string[] }>();
  for (const n of main) for (const line of n.stats) {
    if (union.has(line)) continue;
    const template = line.replace(/[+-]?\d+(?:\.\d+)?/g, "#");
    const row = backlog.get(template) ?? { template, occurrences: 0, nodeIds: new Set<string>(), examples: [] };
    row.occurrences += 1; row.nodeIds.add(n.id);
    if (row.examples.length < 3 && !row.examples.includes(line)) row.examples.push(line);
    backlog.set(template, row);
  }
  const skills = catalog.entries.filter((g) => !g.support).map((g) => {
    const preset = skillPreferencePresets.find((p) => p.gemId === g.id);
    return { ...g, status: (preset ? "reviewed" : "unsupported") as Status, presetId: preset?.id };
  });
  const supports = catalog.entries.filter((g) => g.support).map((g) => {
    const support = reviewedSkillSupports.find((s) => s.effectId === g.effectId);
    const overrides = Object.values(support?.skillOverrides ?? {});
    const capabilities = {
      context: !!support,
      priorities: !!support && (support.priorities.length > 0 || overrides.some(o => !!o.priorities?.length)),
      constraints: !!support && (!!support.exclusions?.length || overrides.some(o => !!o.exclusions?.length)),
      passiveScopeFilter: !!support?.disabledPassiveStatScopes?.length,
      fullDps: false,
    };
    const behavior = !support ? "none" : capabilities.priorities ? "priorities" : capabilities.passiveScopeFilter ? "scope-filter" : capabilities.constraints ? "constraints" : "context-only";
    return { ...g, status: (!support ? "unsupported" : capabilities.priorities || capabilities.passiveScopeFilter ? "reviewed" : "partial") as Status,
      behavior, capabilities, supportId: support?.id, skillIds: support ? [...support.skillIds] : [] };
  });
  const integrityErrors = [
    ...skillPreferencePresets.filter((p) => !skills.some((g) => g.id === p.gemId)).map((p) => `Preset ${p.id} is absent from the source catalog.`),
    ...reviewedSkillSupports.filter((s) => !supports.some((g) => g.effectId === s.effectId)).map((s) => `Support ${s.id} is absent from the source catalog.`),
    ...reviewedSkillSupports.flatMap((s) => s.skillIds.filter((id) => !skillPreferencePresets.some((p) => p.id === id)).map((id) => `Support ${s.id} references unknown focus ${id}.`)),
  ];
  const totals = (rows: { status: Status; tier: number }[]) => ({ total: rows.length, configured: rows.filter((r) => r.status === "reviewed" || r.status === "partial").length,
    percent: percent(rows.filter((r) => r.status === "reviewed" || r.status === "partial").length, rows.length), statuses: statuses(rows),
    positiveTierTotal: rows.filter((r) => r.tier > 0).length,
    positiveTierConfigured: rows.filter((r) => r.tier > 0 && r.status !== "unsupported").length });
  return {
    schemaVersion: 1 as const, fingerprints, source: { graphVersion: graph.gameVersion, graphNodes: sourceNodes.length, graphEdges: graph.edges.length, catalog: catalog.source },
    qualifications: ["Catalog entries are not a verified list of live obtainable gems; tier-zero entries require triage.",
      "Reviewed means recognized within the existing heuristic scope, not complete gem mechanics, Full DPS or actual defensive benefit.",
      "Passive coverage is the union of manual, reviewed base-skill and explicit socketed-recipient contexts; a specific build can match less. Support combinations are not exhaustively modeled.",
      "Partial means mixed recognized/unrecognized node lines, or a support with context/constraints but no priority or scope-filter refinement. Not-applicable regions are excluded from main-tree weighting."],
    summary: { skills: totals(skills), supports: totals(supports), preferences: passivePreferenceCatalog.length,
      supportFamiliesConfigured: new Set(supports.filter((s) => s.supportId).flatMap((s) => (s.family ?? s.name).split(",").map((family) => family.trim()))).size,
      reviewedSupportPairs: reviewedSkillSupports.reduce((sum, s) => sum + s.skillIds.length, 0),
      supportCapabilities: {
        context: supports.filter(s => s.capabilities.context).length,
        priorities: supports.filter(s => s.capabilities.priorities).length,
        constraints: supports.filter(s => s.capabilities.constraints).length,
        passiveScopeFilter: supports.filter(s => s.capabilities.passiveScopeFilter).length,
        fullDps: supports.filter(s => s.capabilities.fullDps).length,
      },
      mainNodes: main.length, mainStatNodes: statNodes.length, statOccurrences: occurrences.length, recognizedOccurrences: totalMatched,
      recognizedOccurrencePercent: percent(totalMatched, occurrences.length), uniqueLines: lines.length, recognizedUniqueLines: union.size,
      mainNodeStatuses: statuses(nodes.filter((n) => mainIds.has(n.id))),
      excludedNodes: sourceNodes.length - main.length },
    contexts: contexts.map((c) => ({ id: c.id, coveredLines: lines.filter((line) => matched(line, c.id)),
      recognizedOccurrences: occurrences.filter((line) => matched(line, c.id)).length })),
    effects: passivePreferenceCatalog.map((effect) => ({ id: effect.id, label: effect.label,
      nodes: main.filter((n) => effect.id === "jewelSockets" ? n.flags.jewelSocket : n.stats.some((line) => contexts.some((c) => Object.hasOwn(values.get(c.id)!.get(line)!, effect.id)))).length })),
    backlog: [...backlog.values()].map((r) => ({ ...r, nodeIds: [...r.nodeIds], nodes: r.nodeIds.size, status: "unsupported" as const }))
      .sort((a, b) => b.occurrences - a.occurrences || a.template.localeCompare(b.template)),
    skills, supports, nodes, integrityErrors,
  };
}
export type CoverageReport = ReturnType<typeof buildCoverageReport>;

export function makeBaseline(report: CoverageReport): Baseline {
  const lines = [...new Set(report.contexts.flatMap((c) => c.coveredLines))].sort();
  const indexes = new Map(lines.map((line, i) => [line, i]));
  return { schemaVersion: 1, fingerprints: report.fingerprints, graphVersion: report.source.graphVersion, lines,
    contexts: Object.fromEntries(report.contexts.map((c) => [c.id, c.coveredLines.map((line) => indexes.get(line)!)])) };
}

export function compareBaseline(report: CoverageReport, baseline: Baseline): string[] {
  if (!baseline || baseline.schemaVersion !== 1 || !baseline.fingerprints || !Array.isArray(baseline.lines) || !baseline.contexts
    || !Object.keys(baseline.contexts).length || !baseline.lines.every((s) => typeof s === "string")) return ["Invalid coverage baseline."];
  if (Object.entries(report.fingerprints).some(([key, hash]) => baseline.fingerprints[key as keyof Fingerprints] !== hash)) {
    return ["Tree or catalog snapshot changed. Review the coverage report and explicitly run coverage:baseline; check never updates it."];
  }
  const errors: string[] = [];
  for (const [id, indexes] of Object.entries(baseline.contexts)) {
    if (!Array.isArray(indexes) || indexes.some((i) => !Number.isInteger(i) || i < 0 || i >= baseline.lines.length)) return ["Invalid coverage baseline indexes."];
    const current = report.contexts.find((c) => c.id === id);
    if (!current) { errors.push(`Removed focus context: ${id}`); continue; }
    const covered = new Set(current.coveredLines);
    for (const index of indexes) if (!covered.has(baseline.lines[index])) errors.push(`${id} no longer recognizes: ${baseline.lines[index]}`);
  }
  return errors;
}

export function renderCoverageReport(r: CoverageReport): string {
  const s = r.summary;
  return ["# Optimizer Coverage", "", `Tree: ${r.source.graphVersion}. PoB catalog snapshot: ${r.source.catalog.pobVersion}.`, "",
    ...r.qualifications.map((q) => `- ${q}`), "", "## Snapshot", "",
    "| Area | Configured / Recognized | Total | Percent |", "| --- | ---: | ---: | ---: |",
    `| Skill presets | ${s.skills.configured} | ${s.skills.total} | ${s.skills.percent}% |`,
    `| Support choices (tiers separate) | ${s.supports.configured} | ${s.supports.total} | ${s.supports.percent}% |`,
    `| Main-tree stat occurrences | ${s.recognizedOccurrences} | ${s.statOccurrences} | ${s.recognizedOccurrencePercent}% |`, "",
    `${s.preferences} preference categories; ${s.supportFamiliesConfigured} configured support families; ${s.reviewedSupportPairs} reviewed skill/support pairs.`,
    `Positive-tier entries: skills ${s.skills.positiveTierConfigured}/${s.skills.positiveTierTotal}, supports ${s.supports.positiveTierConfigured}/${s.supports.positiveTierTotal}.`,
    "", "## Support Capability Coverage", "",
    "These categories overlap; compatibility/context review is not numerical damage modeling. Priority changes are opt-in. Constraints retain manual weights with warnings; scope filters can change eligible stat matching. Full DPS counts only evaluation wired into the app, not offline research.", "",
    "| Capability | Configured support entries |", "| --- | ---: |",
    `| Compatibility/context review | ${s.supportCapabilities.context} |`,
    `| Suggested-priority adjustments | ${s.supportCapabilities.priorities} |`,
    `| Suggestion constraints/cautions | ${s.supportCapabilities.constraints} |`,
    `| Passive-stat scope filtering | ${s.supportCapabilities.passiveScopeFilter} |`,
    `| In-app full-build DPS evaluation | ${s.supportCapabilities.fullDps} |`, "",
    `Main-node statuses (sockets included): ${JSON.stringify(s.mainNodeStatuses)}. ${s.excludedNodes} non-main/start nodes are not applicable.`, "",
    "## Highest-Frequency Unsupported Wording", "", ...r.backlog.slice(0, 25).map((b) => `- ${b.occurrences} occurrences / ${b.nodes} nodes: ${b.template.replace(/\n/g, " ")}`), "",
    "## Focus Coverage", "", ...r.contexts.map((c) => `- ${c.id}: ${c.recognizedOccurrences} stat occurrences; ${c.coveredLines.length} distinct lines.`), "",
    "## Configured Skills", "", ...r.skills.filter((g) => g.presetId).map((g) => `- ${g.name}: ${g.status} (scoped heuristic preset).`), "",
    "## Configured Supports", "", ...r.supports.filter((g) => g.supportId).map((g) => `- ${g.name}: ${g.status}; ${g.behavior}; ${g.skillIds.length} reviewed focuses; capabilities: ${Object.entries(g.capabilities).filter(([, active]) => active).map(([name]) => name).join(", ")}.`), "",
    "## Preferences With No Current Main-Tree Match", "", ...r.effects.filter((e) => e.nodes === 0).map((e) => `- ${e.label}`), "",
    ...(r.integrityErrors.length ? ["## Integrity Errors", "", ...r.integrityErrors.map((e) => `- ${e}`), ""] : []),
    "Full entry/node statuses, source hashes, missing catalog entries and all unmatched templates are in report.json.", ""].join("\n");
}

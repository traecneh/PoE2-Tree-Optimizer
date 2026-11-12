import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildCoverageReport, compareBaseline, makeBaseline, parseCatalog, renderCoverageReport } from "./coverage";
import type { Baseline, Catalog } from "./coverage";
import type { TreeGraph, TreeNode } from "../../src/tree/types";

const fingerprints = { graphSha256: "graph", catalogSha256: "catalog" };
const catalog = parseCatalog(JSON.parse(readFileSync(new URL("./catalog.json", import.meta.url), "utf8")));
const node = (id: string, stats: string[], flags: TreeNode["flags"] = {}): TreeNode => ({ id, name: id, stats, flags, position: { x: 0, y: 0 } });
function graph(): TreeGraph {
  return { schemaVersion: 1, gameVersion: "fixture", extractedAt: "fixture", source: { kind: "fixture", path: "fixture" },
    nodes: Object.fromEntries([
      node("start", [], { classStart: true }),
      node("partial", ["10% increased Spell Damage", "10% increased Spell Damage while stationary"]),
      node("scoped", ["Spell Skills have 10% reduced Area of Effect", "35% increased Spell Area Damage"]),
      node("unsupported", ["10% increased Unreviewed Fixture Effect"]),
      node("socket", [], { jewelSocket: true }),
      node("socket-with-text", ["Unmodeled socket mechanic"], { jewelSocket: true }),
      node("ascendancy", ["10% increased Spell Damage"], { ascendancy: true }),
    ].map((n) => [n.id, n])), edges: [], groups: {}, classStarts: { witch: "start" }, bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 } };
}
describe("optimizer coverage", () => {
  it("counts shared support families once rather than treating a combined label as another family", () => {
    const selected: Catalog = { ...catalog, entries: catalog.entries.filter(g => ["SupportNovaProjectilesPlayer", "SupportNovaProjectilesTwoPlayer", "SupportMultishotPlayer", "SupportMultishotPlayerTwo"].includes(g.effectId)) };
    const report = buildCoverageReport(graph(), selected, fingerprints);
    expect(report.summary.supports.configured).toBe(4);
    expect(report.summary.supportFamiliesConfigured).toBe(2);
  });
  it("separates statuses and does not let socket flags or excluded ascendancy lines inflate word coverage", () => {
    const report = buildCoverageReport(graph(), catalog, fingerprints);
    expect(Object.fromEntries(report.nodes.map((n) => [n.id, n.status]))).toEqual({ ascendancy: "not-applicable", partial: "partial",
      scoped: "reviewed", socket: "reviewed", "socket-with-text": "unsupported", start: "not-applicable", unsupported: "unsupported" });
    expect(report.summary).toMatchObject({ mainNodes: 5, mainStatNodes: 4, statOccurrences: 6, recognizedOccurrences: 3, recognizedOccurrencePercent: 50, excludedNodes: 2 });
    expect(report.summary.mainNodeStatuses).toEqual({ reviewed: 2, partial: 1, unsupported: 2, "not-applicable": 0 });
    expect(report.effects.find((e) => e.id === "jewelSockets")?.nodes).toBe(2);
    expect(report.integrityErrors).toEqual([]);
  });
  it("shows per-focus scope and negative matches without presenting union coverage as build coverage", () => {
    const report = buildCoverageReport(graph(), catalog, fingerprints);
    expect(report.contexts.find((c) => c.id === "fireball")?.recognizedOccurrences).toBe(3);
    expect(report.contexts.find((c) => c.id === "spark")?.recognizedOccurrences).toBe(1);
    expect(report.contexts.find((c) => c.id === "manual")?.recognizedOccurrences).toBe(1);
    expect(report.backlog.some((b) => b.template.includes("reduced Area"))).toBe(false);
    expect(renderCoverageReport(report)).toContain("not complete gem mechanics");
  });
  it("tracks Mortar's socketed variants separately instead of assuming one Grenade for every build", () => {
    const g = graph();
    g.nodes.grenade = node("grenade", ["20% increased Grenade Damage", "10% increased Elemental Damage with Attacks"]);
    const report = buildCoverageReport(g, catalog, fingerprints);
    expect(report.contexts.find((c) => c.id === "mortar-cannon")?.recognizedOccurrences).toBe(1);
    expect(report.contexts.find((c) => c.id === "mortar-cannon/explosive-grenade")?.recognizedOccurrences).toBe(3);
    expect(report.contexts.find((c) => c.id === "mortar-cannon/gas-grenade")?.recognizedOccurrences).toBe(2);
    expect(report.contexts.filter((c) => c.id.startsWith("mortar-cannon/")).length).toBe(6);
  });
  it("reports zero-valued recognized wording as covered rather than confusing coverage with benefit", () => {
    const g = graph();
    g.nodes.zero = node("zero", ["0% increased Damage over Time"]);
    const report = buildCoverageReport(g, catalog, fingerprints);
    expect(report.nodes.find((n) => n.id === "zero")?.status).toBe("reviewed");
    expect(report.effects.find((e) => e.id === "damageOverTime")?.nodes).toBe(1);
  });
  it("groups repeated unsupported numbers without losing their conditions or all distinct examples", () => {
    const g = graph();
    g.nodes.another = node("another", ["20% increased Unreviewed Fixture Effect", "10% increased Unreviewed Fixture Effect while stationary"]);
    const report = buildCoverageReport(g, catalog, fingerprints);
    expect(report.backlog.find((b) => b.template === "#% increased Unreviewed Fixture Effect")).toMatchObject({ occurrences: 2, nodes: 2,
      examples: ["20% increased Unreviewed Fixture Effect", "10% increased Unreviewed Fixture Effect"] });
    expect(report.backlog.some((b) => b.template.endsWith("while stationary"))).toBe(true);
  });
  it("counts configured catalog entries separately from complete support simulation and does not discard tier zero", () => {
    const report = buildCoverageReport(graph(), catalog, fingerprints);
    const skills = catalog.entries.filter((g) => !g.support);
    const supports = catalog.entries.filter((g) => g.support);
    expect(report.summary.skills).toMatchObject({ total: skills.length, positiveTierTotal: skills.filter((g) => g.tier > 0).length });
    expect(report.summary.supports).toMatchObject({ total: supports.length, positiveTierTotal: supports.filter((g) => g.tier > 0).length });
    expect(report.supports.find((s) => s.supportId === "rapid-attacks-i")).toMatchObject({ status: "partial", behavior: "context-only" });
    expect(report.supports.find((s) => s.supportId === "controlled-destruction")).toMatchObject({ status: "reviewed", behavior: "scope-filter" });
    expect(report.skills.some((s) => s.tier === 0 && s.status === "unsupported")).toBe(true);
  });
  it("reports configured IDs absent from a refreshed catalog rather than increasing its percentage", () => {
    const changed: Catalog = { ...catalog, entries: catalog.entries.filter((g) => !g.id.endsWith("SkillGemFireball")) };
    expect(buildCoverageReport(graph(), changed, fingerprints).integrityErrors).toContain("Preset fireball is absent from the source catalog.");
  });
  it("separates context, suggestion constraints and direct scope filters from in-app Full DPS", () => {
    const report = buildCoverageReport(graph(), catalog, fingerprints);
    const byId = (id: string) => report.supports.find(s => s.supportId === id)!;
    expect(byId("brutality-i")).toMatchObject({ status: "partial",behavior: "constraints",capabilities: {
      context: true,priorities: false,constraints: true,passiveScopeFilter: false,fullDps: false,
    } });
    expect(byId("rapid-attacks-i").capabilities).toEqual({ context: true,priorities: false,constraints: false,passiveScopeFilter: false,fullDps: false });
    expect(byId("concentrated-area").capabilities.priorities).toBe(true);
    expect(byId("controlled-destruction").capabilities.passiveScopeFilter).toBe(true);
    expect(report.summary.supportCapabilities.context).toBe(report.summary.supports.configured);
    expect(report.summary.supportCapabilities.fullDps).toBe(0);
    expect(report.supports.filter(s => !s.supportId).every(s => Object.values(s.capabilities).every(v => !v))).toBe(true);
    expect(renderCoverageReport(report)).toContain("categories overlap");
    expect(renderCoverageReport(report)).toContain("In-app full-build DPS evaluation | 0");
  });
  it("round-trips a baseline, allows additions, and catches loss even if another line replaces it", () => {
    const original = buildCoverageReport(graph(), catalog, fingerprints);
    const baseline = JSON.parse(JSON.stringify(makeBaseline(original))) as Baseline;
    expect(compareBaseline(original, baseline)).toEqual([]);
    const changed = structuredClone(original);
    changed.contexts.find((c) => c.id === "fireball")!.coveredLines = ["different line"];
    expect(compareBaseline(changed, baseline)).toContain("fireball no longer recognizes: 35% increased Spell Area Damage");
    const added = structuredClone(original);
    added.contexts[0].coveredLines.push("a new supported line");
    expect(compareBaseline(added, baseline)).toEqual([]);
  });
  it("requires deliberate baseline review after tree/catalog changes and rejects corrupt snapshots", () => {
    const report = buildCoverageReport(graph(), catalog, fingerprints);
    const baseline = makeBaseline(report);
    expect(compareBaseline({ ...report, fingerprints: { ...fingerprints, graphSha256: "changed" } }, baseline)[0]).toContain("explicitly run coverage:baseline");
    expect(compareBaseline(report, { ...baseline, contexts: { manual: [9999] } })).toEqual(["Invalid coverage baseline indexes."]);
    expect(compareBaseline(report, {} as Baseline)).toEqual(["Invalid coverage baseline."]);
    expect(() => parseCatalog({ ...catalog, entries: [catalog.entries[0], catalog.entries[0]] })).toThrow("duplicate");
    expect(() => parseCatalog({ ...catalog, entries: [] })).toThrow("Invalid");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCoverage } from "./cli";

const folders: string[] = [];
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }); });
describe("coverage CLI file behavior", () => {
  it("writes reports but never replaces a baseline during check, including CRLF and stale-data cases", () => {
    const root = mkdtempSync(join(tmpdir(), "poe-coverage-")); folders.push(root);
    mkdirSync(join(root, "tools/coverage"), { recursive: true });
    mkdirSync(join(root, "data"));
    const graph = { nodes: { test: { id: "test", stats: ["10% increased Spell Damage"], flags: {}, position: { x: 0, y: 0 } } }, edges: [], gameVersion: "fixture" };
    writeFileSync(join(root, "data/tree-graph.json"), JSON.stringify(graph));
    writeFileSync(join(root, "tools/coverage/catalog.json"), readFileSync(new URL("./catalog.json", import.meta.url)));
    const baseline = join(root, "tools/coverage/baseline.json");
    runCoverage("report", root);
    expect(existsSync(join(root, "var/coverage/report.md"))).toBe(true);
    expect(existsSync(baseline)).toBe(false);
    expect(() => runCoverage("check", root)).toThrow("Missing or unreadable");
    runCoverage("baseline", root);
    const original = readFileSync(baseline, "utf8");
    writeFileSync(join(root, "data/tree-graph.json"), JSON.stringify(graph, null, 2).replace(/\n/g, "\r\n"));
    expect(() => runCoverage("check", root)).not.toThrow();
    expect(readFileSync(baseline, "utf8")).toBe(original);
    graph.nodes.test.stats = ["20% increased Spell Damage"];
    writeFileSync(join(root, "data/tree-graph.json"), JSON.stringify(graph));
    expect(() => runCoverage("check", root)).toThrow("snapshot changed");
    expect(readFileSync(baseline, "utf8")).toBe(original);
    expect(() => runCoverage("unknown", root)).toThrow("Usage");
  });
});

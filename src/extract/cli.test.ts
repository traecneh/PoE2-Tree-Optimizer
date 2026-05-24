import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import type { TreeGraph } from "../tree/types";

const repoRoot = process.cwd();
const tsxCli = join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const cliPath = join(repoRoot, "src", "extract", "cli.ts");

describe("extract CLI", () => {
  it("exits 2 when a known flag is missing its value", () => {
    const result = runCli(["graph", "--install"]);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--install requires a value");
    expect(result.stderr).toContain("Usage:");
  });

  it("exits 2 when a flag value is another flag", () => {
    const result = runCli(["validate", "--graph", "--report", "out.json"]);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--graph requires a value");
    expect(result.stderr).toContain("Usage:");
  });

  it("exits 2 for unknown flags", () => {
    const result = runCli(["validate", "--unknown", "value"]);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Unknown option: --unknown");
    expect(result.stderr).toContain("Usage:");
  });

  it("exits 1 with concise output for malformed raw JSON", () => {
    const workspace = mkdtempSync(join(tmpdir(), "poe2-cli-"));
    const installPath = join(workspace, "fake-poe2");
    const rawPath = join(workspace, "raw-passive-tree.json");
    const graphPath = join(workspace, "tree-graph.json");

    mkdirSync(installPath, { recursive: true });
    writeFileSync(join(installPath, "Content.ggpk"), "", "utf8");
    writeFileSync(rawPath, "{ malformed json", "utf8");

    const result = runCli(["graph", "--install", installPath, "--raw", rawPath, "--graph", graphPath]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`Could not parse JSON file: ${rawPath}`);
    expect(result.stderr).not.toContain("SyntaxError");
    expect(result.stderr).not.toContain("at ");
  });

  it("exits 1 when validation reports issues", () => {
    const workspace = mkdtempSync(join(tmpdir(), "poe2-cli-"));
    const graphPath = join(workspace, "tree-graph.json");
    const reportPath = join(workspace, "validation-report.json");
    const graph: TreeGraph = {
      schemaVersion: 1,
      gameVersion: "test",
      extractedAt: "2026-05-24T00:00:00.000Z",
      source: { kind: "fixture", path: "test" },
      nodes: {
        "100": {
          id: "100",
          stats: ["Starting point"],
          position: { x: 0, y: 0 },
          flags: { classStart: true },
        },
      },
      groups: {},
      edges: [{ from: "100", to: "missing" }],
      classStarts: { Mercenary: "100" },
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    };

    writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`, "utf8");

    const result = runCli(["validate", "--graph", graphPath, "--report", reportPath]);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain(`Wrote ${reportPath}`);
    expect(result.stderr).toBe("");
  });
});

function runCli(args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [tsxCli, cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

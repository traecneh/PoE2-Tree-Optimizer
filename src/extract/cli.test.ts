import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import type { TreeGraph } from "../tree/types";

const repoRoot = process.cwd();
const tsxCli = join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const cliPath = join(repoRoot, "src", "extract", "cli.ts");
const tempRoot = realpathSync(tmpdir());
const originalDeployFiles = deployFileHashes();
let workspace: string;

describe("extract CLI", () => {
  beforeEach(() => {
    workspace = mkdtempSync(join(tempRoot, "poe2-cli-"));
  });

  afterEach(() => {
    const target = realpathSync(workspace);
    if (dirname(target) !== tempRoot || !basename(target).startsWith("poe2-cli-")) {
      throw new Error(`Refusing to remove a directory outside the CLI test workspace: ${target}`);
    }
    rmSync(target, { recursive: true, force: true });
  });

  afterAll(() => {
    expect(deployFileHashes()).toEqual(originalDeployFiles);
  });

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

  it("exits 2 when PSG graph extraction is missing the skills table", () => {
    const result = runCli(["graph", "--install", join(tmpdir(), "missing-poe2-install"), "--psg", "tree.psg"]);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--psg and --skills must be provided together");
    expect(result.stderr).toContain("Usage:");
  });

  it("exits 2 when stat descriptions are provided without a stats table", () => {
    const result = runCli([
      "graph",
      "--install",
      join(tmpdir(), "missing-poe2-install"),
      "--psg",
      "tree.psg",
      "--skills",
      "PassiveSkills.json",
      "--stat-descriptions",
      "stat_descriptions.csd",
    ]);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--stats and --stat-descriptions must be provided together");
    expect(result.stderr).toContain("Usage:");
  });

  it("exits 1 with concise output for malformed raw JSON", () => {
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

  it("exits 1 with concise output for malformed PSG data", () => {
    const installPath = join(workspace, "fake-poe2");
    const psgPath = join(workspace, "passive-tree.psg");
    const skillsPath = join(workspace, "PassiveSkills.json");
    const graphPath = join(workspace, "tree-graph.json");

    mkdirSync(installPath, { recursive: true });
    writeFileSync(join(installPath, "Content.ggpk"), "", "utf8");
    writeFileSync(psgPath, Buffer.from([4]));
    writeFileSync(skillsPath, "[]", "utf8");

    const result = runCli(["graph", "--install", installPath, "--psg", psgPath, "--skills", skillsPath, "--graph", graphPath]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`Could not parse PSG file: ${psgPath}`);
    expect(result.stderr).not.toContain("Error:");
    expect(result.stderr).not.toContain("at ");
  });

  it("uses an explicit game version when extracting a graph", () => {
    const installPath = join(workspace, "fake-poe2");
    const rawPath = join(workspace, "raw-passive-tree.json");
    const graphPath = join(workspace, "tree-graph.json");

    mkdirSync(installPath, { recursive: true });
    writeFileSync(join(installPath, "Content.ggpk"), "", "utf8");
    writeFileSync(rawPath, "{}", "utf8");

    const result = runCli([
      "graph",
      "--install",
      installPath,
      "--raw",
      rawPath,
      "--graph",
      graphPath,
      "--game-version",
      "0.5.0",
    ]);

    expect(result.status).toBe(0);
    const graph = JSON.parse(readFileSync(graphPath, "utf8")) as TreeGraph;
    expect(graph.gameVersion).toBe("0.5.0");
    expect(JSON.parse(readFileSync(join(workspace, "public", "tree-graph.json"), "utf8"))).toEqual(graph);
  });

  it("keeps relative inputs and default graph outputs inside the test workspace", () => {
    mkdirSync(join(workspace, "fake-poe2"));
    writeFileSync(join(workspace, "fake-poe2", "Content.ggpk"), "", "utf8");
    mkdirSync(join(workspace, "var", "cache"), { recursive: true });
    writeFileSync(join(workspace, "var", "cache", "raw-passive-tree.json"), "{}", "utf8");

    const result = runCli(["graph", "--install", "fake-poe2", "--game-version", "test-isolated"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const output = JSON.parse(readFileSync(join(workspace, "var", "output", "tree-graph.json"), "utf8")) as TreeGraph;
    const preview = JSON.parse(readFileSync(join(workspace, "public", "tree-graph.json"), "utf8")) as TreeGraph;
    expect(output.gameVersion).toBe("test-isolated");
    expect(preview).toEqual(output);
    expect(deployFileHashes()).toEqual(originalDeployFiles);
  });

  it("keeps the default inventory report inside the test workspace", () => {
    mkdirSync(join(workspace, "fake-poe2"));
    writeFileSync(join(workspace, "fake-poe2", "Content.ggpk"), "", "utf8");

    const result = runCli(["inventory", "--install", "fake-poe2"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(existsSync(join(workspace, "var", "output", "local-data-inventory.json"))).toBe(true);
  });

  it("exits 1 when validation reports issues", () => {
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

  it("exits 0 when validation only reports missing stat warnings", () => {
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
          stats: [],
          position: { x: 0, y: 0 },
          flags: {},
        },
        "101": {
          id: "101",
          stats: ["10% increased Damage"],
          position: { x: 10, y: 0 },
          flags: {},
        },
      },
      groups: {},
      edges: [{ from: "100", to: "101" }],
      classStarts: {},
      bounds: { minX: 0, maxX: 10, minY: 0, maxY: 0 },
    };

    writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`, "utf8");

    const result = runCli(["validate", "--graph", graphPath, "--report", reportPath]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`Wrote ${reportPath}`);
    expect(result.stderr).toBe("");
  });
});

function runCli(args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [tsxCli, cliPath, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function deployFileHashes(): Record<string, string | null> {
  return Object.fromEntries([
    "data/tree-graph.json",
    "data/tree-assets/icon-manifest.json",
    "public/tree-graph.json",
    "public/tree-assets/icon-manifest.json",
  ].map((path) => {
    const absolutePath = join(repoRoot, path);
    return [path, existsSync(absolutePath) ? createHash("sha256").update(readFileSync(absolutePath)).digest("hex") : null];
  }));
}

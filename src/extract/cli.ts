import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { discoverPoe2Install } from "./discovery";
import { ExtractionError } from "./errors";
import { inventoryGameData } from "./inventory";
import { normalizePassiveTreePayload } from "./normalize";
import { exportPassiveIconAssets, readTreeGraph } from "./passiveIconAssets";
import { normalizePoe2PassiveTreeData, parsePassiveSkillGraph } from "./psg";
import { createStatDescriptionFormatter, decodeStatDescriptionText } from "./statDescriptions";
import { validateTreeGraph } from "../tree/validateTreeGraph";
import type { TreeGraph } from "../tree/types";

const usage =
  "Usage: tsx src/extract/cli.ts <inventory|graph|validate|icons> [--install PATH] [--raw PATH] [--psg PATH] [--skills PATH] [--stats PATH] [--stat-descriptions PATH] [--graph PATH] [--report PATH] [--assets PATH] [--workdir PATH] [--limit COUNT]";
const knownFlags = new Set([
  "--install",
  "--raw",
  "--psg",
  "--skills",
  "--stats",
  "--stat-descriptions",
  "--graph",
  "--report",
  "--assets",
  "--workdir",
  "--limit",
]);
const command = process.argv[2];

class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode: 1 | 2,
  ) {
    super(message);
    this.name = "CliError";
  }
}

try {
  const args = readArgs(process.argv.slice(3));
  const explicitPath = args.install;
  const rawPath = args.raw ?? "var/cache/raw-passive-tree.json";
  const graphPath = args.graph ?? "var/output/tree-graph.json";
  const reportPath = args.report ?? "var/output/validation-report.json";
  const assetsPath = args.assets ?? "public/tree-assets";
  const workDir = args.workdir ?? "var/icon-export";

  if (command === "inventory") {
    const install = discoverPoe2Install({ explicitPath });
    const inventory = inventoryGameData(install.installPath);
    writeJson("var/output/local-data-inventory.json", inventory);
    console.log(`Wrote var/output/local-data-inventory.json`);
  } else if (command === "graph") {
    validateGraphArgs(args);
    const install = discoverPoe2Install({ explicitPath });
    const graph =
      args.psg || args.skills
        ? normalizeFromPsg({
            gameVersion: install.gameVersion ?? "unknown",
            psgPath: args.psg,
            skillsPath: args.skills,
            statsPath: args.stats,
            statDescriptionPaths: args.statDescriptions,
          })
        : normalizeFromRawPayload({ gameVersion: install.gameVersion ?? "unknown", rawPath });
    writeJson(graphPath, graph);
    writeJson("public/tree-graph.json", graph);
    console.log(`Wrote ${graphPath} and public/tree-graph.json`);
  } else if (command === "validate") {
    const graph = readJson(graphPath) as TreeGraph;
    const report = validateTreeGraph(graph);
    writeJson(reportPath, report);
    console.log(`Wrote ${reportPath}`);
    if (report.issues.some((issue) => issue.code !== "missing-stats")) process.exitCode = 1;
  } else if (command === "icons") {
    const install = discoverPoe2Install({ explicitPath });
    const graph = readTreeGraph(args.graph ?? "public/tree-graph.json");
    const result = exportPassiveIconAssets({
      graph,
      installPath: install.installPath,
      assetsDir: assetsPath,
      workDir,
      limit: parseLimit(args.limit),
    });
    console.log(`Wrote ${result.copiedIcons} icons to ${result.assetsDir} and ${result.manifestPath}`);
  } else {
    console.error(usage);
    process.exitCode = 2;
  }
} catch (error) {
  if (error instanceof ExtractionError) {
    console.error(`${error.code}: ${error.message}`);
    process.exitCode = 1;
  } else if (error instanceof CliError) {
    console.error(error.message);
    if (error.exitCode === 2) console.error(usage);
    process.exitCode = error.exitCode;
  } else if (isErrnoException(error)) {
    console.error(`${error.code}: ${error.message}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}

type CliArgs = {
  install?: string;
  raw?: string;
  psg?: string;
  skills?: string;
  stats?: string;
  statDescriptions?: string[];
  graph?: string;
  report?: string;
  assets?: string;
  workdir?: string;
  limit?: string;
};

function readArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!knownFlags.has(flag)) {
      throw new CliError(flag.startsWith("--") ? `Unknown option: ${flag}` : `Unexpected argument: ${flag}`, 2);
    }

    const value = argv[index + 1];
    if (value === undefined || value.trim() === "" || value.startsWith("--")) {
      throw new CliError(`${flag} requires a value`, 2);
    }

    if (flag === "--install") args.install = value;
    else if (flag === "--raw") args.raw = value;
    else if (flag === "--psg") args.psg = value;
    else if (flag === "--skills") args.skills = value;
    else if (flag === "--stats") args.stats = value;
    else if (flag === "--stat-descriptions") {
      args.statDescriptions ??= [];
      args.statDescriptions.push(value);
    }
    else if (flag === "--graph") args.graph = value;
    else if (flag === "--report") args.report = value;
    else if (flag === "--assets") args.assets = value;
    else if (flag === "--workdir") args.workdir = value;
    else if (flag === "--limit") args.limit = value;
  }

  return args;
}

function parseLimit(limit: string | undefined): number | undefined {
  if (limit === undefined) return undefined;
  const value = Number(limit);
  if (!Number.isInteger(value) || value < 1) {
    throw new CliError("--limit must be a positive integer", 2);
  }
  return value;
}

function validateGraphArgs(args: CliArgs): void {
  if ((args.psg && !args.skills) || (!args.psg && args.skills)) {
    throw new CliError("--psg and --skills must be provided together", 2);
  }
  if ((args.stats && !args.statDescriptions?.length) || (!args.stats && args.statDescriptions?.length)) {
    throw new CliError("--stats and --stat-descriptions must be provided together", 2);
  }
  if ((args.stats || args.statDescriptions?.length) && (!args.psg || !args.skills)) {
    throw new CliError("--stats and --stat-descriptions can only be used with --psg and --skills", 2);
  }
}

function normalizeFromRawPayload(input: { gameVersion: string; rawPath: string }): TreeGraph {
  const payload = readJson(input.rawPath);
  return normalizePassiveTreePayload({
    gameVersion: input.gameVersion,
    sourcePath: input.rawPath,
    payload: payload as Parameters<typeof normalizePassiveTreePayload>[0]["payload"],
  });
}

function normalizeFromPsg(input: {
  gameVersion: string;
  psgPath?: string;
  skillsPath?: string;
  statsPath?: string;
  statDescriptionPaths?: string[];
}): TreeGraph {
  if (!input.psgPath || !input.skillsPath) {
    throw new CliError("--psg and --skills must be provided together", 2);
  }

  const passiveSkills = readJson(input.skillsPath);
  if (!Array.isArray(passiveSkills)) {
    throw new CliError(`Could not parse PassiveSkills table: ${input.skillsPath} must contain a JSON array`, 1);
  }

  const statFormatter =
    input.statsPath && input.statDescriptionPaths?.length
      ? createStatDescriptionFormatter({
          stats: readStatsTable(input.statsPath),
          descriptions: input.statDescriptionPaths.map((path) => decodeStatDescriptionText(readBinary(path))),
        })
      : undefined;

  return normalizePoe2PassiveTreeData({
    gameVersion: input.gameVersion,
    sourcePath: input.psgPath,
    graph: parsePsgFile(input.psgPath),
    passiveSkills,
    statFormatter,
  });
}

function readStatsTable(path: string): Parameters<typeof createStatDescriptionFormatter>[0]["stats"] {
  const stats = readJson(path);
  if (!Array.isArray(stats)) {
    throw new CliError(`Could not parse Stats table: ${path} must contain a JSON array`, 1);
  }
  return stats as Parameters<typeof createStatDescriptionFormatter>[0]["stats"];
}

function parsePsgFile(path: string): ReturnType<typeof parsePassiveSkillGraph> {
  try {
    return parsePassiveSkillGraph(readBinary(path));
  } catch (error) {
    throw new CliError(`Could not parse PSG file: ${path}${formatErrorDetail(error)}`, 1);
  }
}

function readJson(path: string): unknown {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    throw new CliError(`Could not read file: ${path}${formatErrorDetail(error)}`, 1);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new CliError(`Could not parse JSON file: ${path}`, 1);
    }
    throw error;
  }
}

function readBinary(path: string): Uint8Array {
  try {
    return readFileSync(path);
  } catch (error) {
    throw new CliError(`Could not read file: ${path}${formatErrorDetail(error)}`, 1);
  }
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function formatErrorDetail(error: unknown): string {
  return error instanceof Error && error.message.length > 0 ? ` (${error.message})` : "";
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && typeof error.code === "string";
}

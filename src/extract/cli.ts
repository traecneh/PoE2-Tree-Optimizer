import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { discoverPoe2Install } from "./discovery";
import { ExtractionError } from "./errors";
import { inventoryGameData } from "./inventory";
import { normalizePassiveTreePayload } from "./normalize";
import { validateTreeGraph } from "../tree/validateTreeGraph";
import type { TreeGraph } from "../tree/types";

const usage =
  "Usage: tsx src/extract/cli.ts <inventory|graph|validate> [--install PATH] [--raw PATH] [--graph PATH] [--report PATH]";
const knownFlags = new Set(["--install", "--raw", "--graph", "--report"]);
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

  if (command === "inventory") {
    const install = discoverPoe2Install({ explicitPath });
    const inventory = inventoryGameData(install.installPath);
    writeJson("var/output/local-data-inventory.json", inventory);
    console.log(`Wrote var/output/local-data-inventory.json`);
  } else if (command === "graph") {
    const install = discoverPoe2Install({ explicitPath });
    const payload = readJson(rawPath);
    const graph = normalizePassiveTreePayload({
      gameVersion: install.gameVersion ?? "unknown",
      sourcePath: rawPath,
      payload: payload as Parameters<typeof normalizePassiveTreePayload>[0]["payload"],
    });
    writeJson(graphPath, graph);
    writeJson("public/tree-graph.json", graph);
    console.log(`Wrote ${graphPath} and public/tree-graph.json`);
  } else if (command === "validate") {
    const graph = readJson(graphPath) as TreeGraph;
    const report = validateTreeGraph(graph);
    writeJson(reportPath, report);
    console.log(`Wrote ${reportPath}`);
    if (report.issues.length > 0) process.exitCode = 1;
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
  graph?: string;
  report?: string;
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
    else if (flag === "--graph") args.graph = value;
    else if (flag === "--report") args.report = value;
  }

  return args;
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

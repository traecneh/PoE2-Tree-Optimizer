import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { discoverPoe2Install } from "./discovery";
import { ExtractionError } from "./errors";
import { inventoryGameData } from "./inventory";
import { normalizePassiveTreePayload } from "./normalize";
import { validateTreeGraph } from "../tree/validateTreeGraph";

const command = process.argv[2];
const explicitPath = readArg("--install");
const rawPath = readArg("--raw") ?? "var/cache/raw-passive-tree.json";
const graphPath = readArg("--graph") ?? "var/output/tree-graph.json";
const reportPath = readArg("--report") ?? "var/output/validation-report.json";

try {
  if (command === "inventory") {
    const install = discoverPoe2Install({ explicitPath });
    const inventory = inventoryGameData(install.installPath);
    writeJson("var/output/local-data-inventory.json", inventory);
    console.log(`Wrote var/output/local-data-inventory.json`);
  } else if (command === "graph") {
    const install = discoverPoe2Install({ explicitPath });
    const payload = JSON.parse(readFileSync(rawPath, "utf8")) as unknown;
    const graph = normalizePassiveTreePayload({
      gameVersion: install.gameVersion ?? "unknown",
      sourcePath: rawPath,
      payload: payload as Parameters<typeof normalizePassiveTreePayload>[0]["payload"],
    });
    writeJson(graphPath, graph);
    writeJson("public/tree-graph.json", graph);
    console.log(`Wrote ${graphPath} and public/tree-graph.json`);
  } else if (command === "validate") {
    const graph = JSON.parse(readFileSync(graphPath, "utf8"));
    const report = validateTreeGraph(graph);
    writeJson(reportPath, report);
    console.log(`Wrote ${reportPath}`);
    if (report.issues.length > 0) process.exitCode = 1;
  } else {
    console.error(
      "Usage: tsx src/extract/cli.ts <inventory|graph|validate> [--install PATH] [--raw PATH] [--graph PATH] [--report PATH]",
    );
    process.exitCode = 2;
  }
} catch (error) {
  if (error instanceof ExtractionError) {
    console.error(`${error.code}: ${error.message}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

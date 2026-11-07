import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve, extname } from "node:path";
import { parseArgs } from "node:util";
import { tsImport } from "tsx/esm/api";
import { inspectPobImport } from "./import_preflight.mjs";

const { decodePobBuildCode } = await tsImport("../../src/tree/pobBuildImport.ts", import.meta.url);
const [source, directory, ...args] = process.argv.slice(2);
if (!source || !directory) throw new Error("Usage: node preflight_import.mjs CODE_OR_XML JOB_DIRECTORY [--profile ci-mana|life-armour]");
const { values } = parseArgs({ args, options: { profile: { type: "string", default: "ci-mana" } } });
const job = resolve(directory);
const withinVar = relative(resolve("var"), job);
if (!withinVar || withinVar.startsWith("..") || isAbsolute(withinVar)) throw new Error("Preflight output must be a job subdirectory of var.");
const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8"));
let report;
try {
  const input = readFileSync(source, "utf8");
  const xml = extname(source).toLowerCase() === ".xml" ? input : decodePobBuildCode(input);
  report = inspectPobImport(xml, graph, { profile: values.profile });
} catch (error) {
  report = { version: 1, status: "blocked", canGenerateRoutes: false, requestedProfile: values.profile, findings: [
    { code: "unreadable_export", severity: "blocker", message: error.message, action: "Provide a readable PoB code or XML export." },
  ], blockerCount: 1, warningCount: 0 };
}
mkdirSync(job, { recursive: true });
writeFileSync(resolve(job, "import-preflight.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.canGenerateRoutes) process.exitCode = 2;

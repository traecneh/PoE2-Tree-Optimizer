import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCoverageReport, compareBaseline, makeBaseline, parseCatalog, renderCoverageReport } from "./coverage";
import type { Baseline } from "./coverage";
import type { TreeGraph } from "../../src/tree/types";

export function runCoverage(command: string, root: string) {
  if (!["report", "check", "baseline"].includes(command)) throw new Error("Usage: coverage report|check|baseline");
  const graphBytes = readFileSync(join(root, "data/tree-graph.json"));
  const catalogBytes = readFileSync(join(root, "tools/coverage/catalog.json"));
  const graph = JSON.parse(graphBytes.toString("utf8")) as TreeGraph;
  if (!graph?.nodes || !Object.keys(graph.nodes).length || !Array.isArray(graph.edges)) throw new Error("Missing or empty tree graph.");
  const catalog = parseCatalog(JSON.parse(catalogBytes.toString("utf8")));
  // Hash parsed data so CRLF/LF checkout differences do not invalidate a baseline.
  const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  const report = buildCoverageReport(graph, catalog, { graphSha256: hash(graph), catalogSha256: hash(catalog) });
  const output = join(root, "var/coverage");
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(output, "report.md"), renderCoverageReport(report));
  if (report.integrityErrors.length) throw new Error(report.integrityErrors.join("\n"));
  const baselinePath = join(root, "tools/coverage/baseline.json");
  if (command === "baseline") {
    writeFileSync(baselinePath, `${JSON.stringify(makeBaseline(report), null, 2)}\n`);
    console.log("Updated coverage baseline. Review the diff before committing.");
  } else if (command === "check") {
    let baseline: Baseline;
    try { baseline = JSON.parse(readFileSync(baselinePath, "utf8")) as Baseline; }
    catch { throw new Error("Missing or unreadable coverage baseline. Review coverage:report, then explicitly run coverage:baseline."); }
    const errors = compareBaseline(report, baseline);
    if (errors.length) throw new Error(errors.join("\n"));
    console.log("Coverage baseline passed (no previously covered wording lost).");
  }
  console.log(`Coverage: ${report.summary.skills.configured} skill presets, ${report.summary.supports.configured} support choices; ${report.summary.recognizedOccurrences}/${report.summary.statOccurrences} main-tree stat occurrences (${report.summary.recognizedOccurrencePercent}%).`);
  console.log("Reports: var/coverage/report.md and report.json. These are heuristic/catalog coverage, not Full DPS or overall project completion.");
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error("Usage: coverage report|check|baseline");
    runCoverage(process.argv[2], resolve(dirname(fileURLToPath(import.meta.url)), "../.."));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

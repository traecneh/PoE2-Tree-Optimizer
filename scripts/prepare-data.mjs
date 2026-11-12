import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function prepareData(repoRoot, { graphOnly = false } = {}) {
  const sourceGraph = join(repoRoot, "data/tree-graph.json");
  const sourceAssets = join(repoRoot, "data/tree-assets");
  const publicGraph = join(repoRoot, "public/tree-graph.json");
  const publicAssets = join(repoRoot, "public/tree-assets");
  if (!existsSync(sourceGraph) || (!graphOnly && !existsSync(sourceAssets))) {
    if (existsSync(publicGraph) && (graphOnly || existsSync(publicAssets))) {
      console.warn("Tracked deploy data is missing; using existing public tree data.");
      return;
    }
    throw new Error("Missing deploy data. Expected data/tree-graph.json" + (graphOnly ? "." : " and data/tree-assets/."));
  }
  let graph;
  try {
    graph = JSON.parse(readFileSync(sourceGraph, "utf8"));
  } catch (error) {
    throw new Error(`data/tree-graph.json could not be read: ${error.message}`);
  }

  const nodeCount = Object.keys(graph?.nodes ?? {}).length;
  const classStartCount = Object.keys(graph?.classStarts ?? {}).length;
  if (nodeCount === 0 || classStartCount === 0) {
    throw new Error(`data/tree-graph.json is not usable. Found ${nodeCount} nodes and ${classStartCount} class starts. Refusing to overwrite public/tree-graph.json with empty tree data.`);
  }
  if (!graphOnly && !statSync(sourceAssets).isDirectory()) throw new Error("data/tree-assets exists but is not a directory.");
  mkdirSync(dirname(publicGraph), { recursive: true });
  copyFileSync(sourceGraph, publicGraph);
  if (!graphOnly) {
    rmSync(publicAssets, { recursive: true, force: true });
    cpSync(sourceAssets, publicAssets, { recursive: true });
  }
  console.log(graphOnly ? "Prepared public/tree-graph.json (images unchanged)." : "Prepared public/tree-graph.json and public/tree-assets/.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some((arg) => arg !== "--graph-only")) throw new Error("Usage: prepare-data.mjs [--graph-only]");
    prepareData(dirname(fileURLToPath(new URL("../package.json", import.meta.url))), { graphOnly: process.argv.includes("--graph-only") });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

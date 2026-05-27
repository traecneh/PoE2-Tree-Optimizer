import { cpSync, copyFileSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const sourceGraph = join(repoRoot, "data", "tree-graph.json");
const sourceAssets = join(repoRoot, "data", "tree-assets");
const publicGraph = join(repoRoot, "public", "tree-graph.json");
const publicAssets = join(repoRoot, "public", "tree-assets");

function hasUsablePublicData() {
  return existsSync(publicGraph) && existsSync(publicAssets);
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!existsSync(sourceGraph) || !existsSync(sourceAssets)) {
  if (hasUsablePublicData()) {
    console.warn("Tracked deploy data is missing; using existing public tree data.");
    process.exit(0);
  }

  fail([
    "Missing deploy data.",
    "Expected data/tree-graph.json and data/tree-assets/.",
    "Generate them from a local PoE2 install, or copy an existing public/tree-graph.json and public/tree-assets/ into data/.",
  ].join("\n"));
} else {
  const assetStat = statSync(sourceAssets);
  if (!assetStat.isDirectory()) {
    fail("data/tree-assets exists but is not a directory.");
  } else {
    mkdirSync(dirname(publicGraph), { recursive: true });
    copyFileSync(sourceGraph, publicGraph);
    rmSync(publicAssets, { recursive: true, force: true });
    cpSync(sourceAssets, publicAssets, { recursive: true });
    console.log("Prepared public/tree-graph.json and public/tree-assets/.");
  }
}

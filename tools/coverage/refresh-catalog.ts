import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseCatalog } from "./coverage";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--runtime") throw new Error("Usage: npm run coverage:refresh-catalog -- --runtime var/ISOLATED/runtime");
  const runtime = resolve(root, args[1]);
  const sourcePath = join(runtime, "Data/Gems.lua");
  const bytes = readFileSync(sourcePath);
  const metadata = JSON.parse(readFileSync(join(runtime, ".pob-evaluation-runtime.json"), "utf8").replace(/^\uFEFF/, ""));
  mkdirSync(join(root, "var"), { recursive: true });
  const job = mkdtempSync(join(root, "var", "coverage-catalog-"));
  // The existing runner enforces marked isolated runtimes and keeps personal
  // installs, builds and user settings out of native evaluation.
  const result = spawnSync(process.env.PYTHON ?? "python", [join(root, "tools/pob-evaluation/run_headless.py"), runtime,
    "--driver", join(root, "tools/coverage/export-catalog.lua"), "--job", job], { cwd: root, stdio: "inherit", windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Catalog export failed (${result.status}). Snapshot unchanged.`);
  if (!bytes.equals(readFileSync(sourcePath))) throw new Error("PoB catalog changed during export. Snapshot unchanged.");
  const entries = JSON.parse(readFileSync(join(job, "gems.json"), "utf8"));
  if (!Array.isArray(entries) || entries.length === 0) throw new Error("Empty catalog export. Snapshot unchanged.");
  const source = { kind: "isolated-local-pob", pobVersion: metadata.version, file: "Data/Gems.lua",
    sha256: createHash("sha256").update(bytes).digest("hex"), capturedAt: new Date().toISOString(),
    referenceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua" };
  parseCatalog({ schemaVersion: 1, source, entries });
  const output = `{\n  "schemaVersion": 1,\n  "source": ${JSON.stringify(source, null, 2).replace(/\n/g, "\n  ")},\n  "entries": [\n${entries.map((entry) => `    ${JSON.stringify(entry)}`).join(",\n")}\n  ]\n}\n`;
  writeFileSync(join(root, "tools/coverage/catalog.json"), output);
  console.log("Updated tools/coverage/catalog.json. Review the diff, then explicitly refresh the coverage baseline.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

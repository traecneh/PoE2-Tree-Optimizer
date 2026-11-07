import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { compressSync, strToU8 } from "fflate";

test("preparation requires original coverage, captures baseline without routing, and blocks stale reuse", () => {
  const parent = resolve("var"); mkdirSync(parent, { recursive: true });
  const folder = mkdtempSync(join(parent, "generation-protection-test-"));
  try {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8"));
    const root = graph.classStarts.MARAUDER;
    const xml = `<PathOfBuilding2><Build className="Warrior" ascendClassName="None" targetVersion="0_1" mainSocketGroup="1"/>
      <Tree activeSpec="1"><Spec treeVersion="0_5" nodes="${root}"/></Tree>
      <Items activeItemSet="1"><ItemSet id="1"/></Items>
      <Skills activeSkillSet="1"><SkillSet id="1"><Skill enabled="true" includeInFullDPS="true"><Gem nameSpec="Synthetic test skill"/></Skill></SkillSet></Skills>
      <Config activeConfigSet="1"><ConfigSet id="1"/></Config></PathOfBuilding2>`;
    const code = join(folder, "code.txt"); writeFileSync(code, Buffer.from(compressSync(strToU8(xml))).toString("base64url"));
    const prep = (job, args = []) => spawnSync(process.execPath,
      ["node_modules/tsx/dist/cli.mjs", "tools/pob-evaluation/prepare_real_audit.ts", code, job, "https://example.invalid/fixture", ...args], { encoding: "utf8" });
    const missing = join(folder, "missing");
    const noCoverage = prep(missing);
    assert.notEqual(noCoverage.status, 0);
    assert.match(noCoverage.stderr, /baseline-only first/);
    assert.equal(existsSync(join(missing, "audit-input.json")), false);
    assert.equal(JSON.parse(readFileSync(join(missing, "generation-preflight.json"))).status, "blocked");

    const job = join(folder, "baseline");
    const captured = prep(job, ["--baseline-only"]);
    assert.equal(captured.status, 0, captured.stderr);
    const manifestText = readFileSync(join(job, "audit-input.json"), "utf8");
    const manifest = JSON.parse(manifestText);
    assert.equal(manifest.generation.phase, "baseline_only");
    assert.equal(manifest.search.iterations, 0);
    assert.equal(manifest.candidates.length, 1);
    assert.deepEqual(manifest.candidates[0].nodeIds, [root]);
    assert.equal(manifest.candidates[0].pointCost, 0);
    assert.equal(JSON.parse(readFileSync(join(job, "generation-preflight.json"))).status, "ready");
    const overwrite = prep(job, ["--baseline-only"]);
    assert.notEqual(overwrite.status, 0);
    assert.match(overwrite.stderr, /fresh job directory/);
    assert.equal(readFileSync(join(job, "audit-input.json"), "utf8"), manifestText);
    assert.equal(readFileSync(join(job, "source-build.xml"), "utf8"), xml);

    const runtime = join(folder, "runtime"); mkdirSync(runtime);
    writeFileSync(join(runtime, ".pob-evaluation-runtime.json"), JSON.stringify({ kind: "isolated-pob-evaluation-copy" }));
    writeFileSync(join(runtime, "HeadlessWrapper.lua"), "");
    const native = spawnSync("python", ["tools/pob-evaluation/run_headless.py", runtime, "--driver", "tools/pob-evaluation/evaluate_real_build.lua", "--job", job], { encoding: "utf8" });
    assert.equal(native.status, 2);
    assert.match(native.stderr, /Generation preparation is blocked/);
    assert.equal(existsSync(join(runtime, "lua51.dll")), false);
    writeFileSync(join(job, "test.requirements-report.json"), JSON.stringify({ ranking: ["old winner"] }));
    const ranking = spawnSync(process.execPath, ["tools/pob-evaluation/build_requirements.mjs", job, "unused-policy.json", "test.requirements-report.json"], { encoding: "utf8" });
    assert.notEqual(ranking.status, 0);
    const blocked = JSON.parse(readFileSync(join(job, "test.requirements-report.json")));
    assert.equal(blocked.status, "blocked_generation");
    assert.deepEqual(blocked.ranking, []);
    assert.equal(blocked.bestEligibleLabel, null);
  } finally {
    const inside = relative(parent, resolve(folder));
    assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside));
    rmSync(folder, { recursive: true, force: true });
  }
});

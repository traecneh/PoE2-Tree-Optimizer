import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { inspectPobImport } from "./import_preflight.mjs";
import { attachFixtureCoverage } from "./effect-coverage.fixture.mjs";

test("CLI enables conservative defaults and clears stale rankings for invalid or stale exceptions", () => {
  const parent = resolve("var"); mkdirSync(parent, { recursive: true });
  const job = mkdtempSync(join(parent, "passive-effect-policy-test-"));
  try {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8"));
    const root = graph.classStarts.MARAUDER;
    assert.ok(root);
    const xml = `<PathOfBuilding2><Build className="Warrior" ascendClassName="None" targetVersion="0_1" mainSocketGroup="1"/>
      <Tree activeSpec="1"><Spec treeVersion="0_5" nodes="${root}"/></Tree>
      <Items activeItemSet="1"><ItemSet id="1"/></Items>
      <Skills activeSkillSet="1"><SkillSet id="1"><Skill enabled="true" includeInFullDPS="true"><Gem nameSpec="Synthetic test skill"/></Skill></SkillSet></Skills>
      <Config activeConfigSet="1"><ConfigSet id="1"/></Config></PathOfBuilding2>`;
    const preflight = inspectPobImport(xml, graph);
    assert.equal(preflight.status, "ready_for_audit", JSON.stringify(preflight.findings));
    const audit = { sourceXmlSha256: createHash("sha256").update(xml).digest("hex"), graphVersion: graph.gameVersion,
      baseNodeId: root, originalMainNodeIds: [root], goalNodeIds: [], pinnedAttributeNodeIds: [],
      candidates: [{ label: "Original", nodeIds: [root], edgeKeys: [], pointCost: 0 }] };
    const baseline = { Life: 1, LifeRecoverable: 1, Mana: 100, ManaUnreserved: 100, EnergyShield: 0,
      FullDPS: 100, CombinedDPS: 100, TotalEHP: 101, Str: 7, Dex: 7, Int: 7, ReqStr: 1, ReqDex: 1, ReqInt: 1,
      sharedMindOverMatter: 100, sharedManaEffectiveLife: 101 };
    const result = { baseline, baselineAfterOverrides: { ...baseline }, finalBaseline: { ...baseline }, baselineUncappedManaBeforeLife: 100,
      contextUnchangedAfterOverrides: true, allocationUnchangedAfterOverrides: true, finalContextPreserved: true, finalAllocationRestored: true,
      candidates: [{ label: "Original", addedCount: 0, removedCount: 0, pobPointCounts: { main: 0, ascendancy: 0, sockets: 0, weapon1: 0, weapon2: 0 },
        overrideOutput: { ...baseline }, reloadOutput: { ...baseline }, contextPreservedOnReload: true,
        attributeChoicesPreserved: true, attributeChoicesPreservedOnReload: true, missingAllocationsOnReload: [] }] };
    attachFixtureCoverage({ audit, result });
    const files = { "source-build.xml": xml, "audit-input.json": JSON.stringify(audit), "real-build-results.json": JSON.stringify(result),
      "import-preflight.json": JSON.stringify(preflight) };
    for (const [name, value] of Object.entries(files)) writeFileSync(join(job, name), value);
    const policyPath = join(job, "policy.json");
    const reportPath = join(job, "test.requirements-report.json");
    const policy = { version: 1, name: "Synthetic CLI fixture", requiredNodeIds: [], minimums: [] };
    const run = () => spawnSync(process.execPath, ["tools/pob-evaluation/build_requirements.mjs", job, policyPath, "test.requirements-report.json"], { encoding: "utf8" });
    writeFileSync(policyPath, JSON.stringify(policy));
    const valid = run();
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(JSON.parse(readFileSync(reportPath)).passiveEffectPolicy.mode, "preserve_unmodeled_passives");
    for (const effectCoverage of [false, { allowedPassiveEffectLosses: [{ nodeId: "56666", text: "Stale effect", reason: "Intentional negative test" }] }]) {
      writeFileSync(reportPath, JSON.stringify({ ranking: ["old winner"] }));
      writeFileSync(policyPath, JSON.stringify({ ...policy, effectCoverage }));
      const invalid = run();
      assert.equal(invalid.status, 2, invalid.stderr);
      const report = JSON.parse(readFileSync(reportPath));
      assert.equal(report.status, "invalid_requirements");
      assert.deepEqual(report.ranking, []);
      assert.equal(report.bestEligibleLabel, null);
    }
    for (const [name, value] of Object.entries(files)) assert.equal(readFileSync(join(job, name), "utf8"), value);
  } finally {
    const inside = relative(parent, resolve(job));
    assert.ok(inside && !inside.startsWith("..") && !isAbsolute(inside));
    rmSync(job, { recursive: true, force: true });
  }
});

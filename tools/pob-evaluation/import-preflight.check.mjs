import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { compressSync, strToU8 } from "fflate";
import { inspectPobImport, inspectAuditJob, isPreflightReady } from "./import_preflight.mjs";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
function fixture() {
  const node = (id, name, flags = {}) => ({ id, name, position: { x: Number(id) * 10, y: 0 }, stats: [], flags });
  return {
    graph: { gameVersion: "0.5.5f", classStarts: { MARAUDER: "1", RANGER: "10" }, groups: {},
      nodes: { 1: node("1", "Warrior start", { classStart: true }), 2: node("2", "Travel", { small: true }),
        3: node("3", "Target", { notable: true }), 4: node("4", "Jewel", { jewelSocket: true }),
        5: node("5", "Granted", { notable: true }), 10: node("10", "Ranger start", { classStart: true }) },
      edges: [{ from: "1", to: "2" }, { from: "2", to: "3" }, { from: "3", to: "4" }, { from: "10", to: "2" }] },
    xml: `<PathOfBuilding2><Build className="Warrior" ascendClassName="None" targetVersion="0_1" mainSocketGroup="1"/>
      <Tree activeSpec="1"><Spec treeVersion="0_5" secondaryAscendClassId="nil" nodes="1,2,3"><Sockets/><Overrides><AttributeOverride strNodes="" dexNodes="" intNodes=""/></Overrides></Spec></Tree>
      <Items activeItemSet="1"><ItemSet id="1"/></Items>
      <Skills activeSkillSet="1"><SkillSet id="1"><Skill enabled="true" includeInFullDPS="true"><Gem nameSpec="Test skill"/></Skill></SkillSet></Skills>
      <Config activeConfigSet="1"><ConfigSet id="1"/></Config></PathOfBuilding2>`,
  };
}
function edit(data, change) {
  const dom = new JSDOM(data.xml, { contentType: "text/xml" });
  change(dom.window.document);
  data.xml = dom.serialize();
  dom.window.close();
  return data;
}
function item(data, name, mods = "", { equipped = true, socket = false } = {}) {
  return edit(data, (doc) => {
    const record = doc.createElement("Item");
    record.setAttribute("id", "20");
    record.textContent = `Rarity: UNIQUE\n${name}\nDiamond\n${mods}`;
    doc.querySelector("Items").append(record);
    if (socket) {
      doc.querySelector("Spec").setAttribute("nodes", "1,2,3,4");
      const entry = doc.createElement("Socket");
      entry.setAttribute("nodeId", "4"); entry.setAttribute("itemId", "20");
      doc.querySelector("Sockets").append(entry);
    } else if (equipped) {
      const slot = doc.createElement("Slot");
      slot.setAttribute("name", "Amulet"); slot.setAttribute("itemId", "20");
      doc.querySelector("ItemSet").append(slot);
    }
  });
}
const inspect = (data) => inspectPobImport(data.xml, data.graph);
const hasCode = (report, code, severity = "blocker") => report.findings.some((finding) => finding.code === code && finding.severity === severity);

test("plain connected imports are ready for a scoped audit, not universally certified", () => {
  const data = fixture();
  const report = inspect(data);
  assert.equal(report.status, "ready_for_audit");
  assert.equal(isPreflightReady(report, createHash("sha256").update(data.xml).digest("hex")), true);
  assert.ok(report.coverage.notChecked.includes("Every item/skill modifier"));
  assert.equal(hasCode(report, "limited_calculation_coverage", "warning"), true);
});

test("build format and passive-tree versions are checked separately", () => {
  const data = fixture();
  assert.equal(inspect(data).selection.buildFormatVersion, "0_1");
  edit(data, (doc) => doc.querySelector("Spec").setAttribute("treeVersion", "0_4"));
  assert.equal(hasCode(inspect(data), "tree_version"), true);
  assert.equal(hasCode(inspect(data), "build_conversion_required"), false);
});

test("missing target or invalid active tree does not silently select a fallback", () => {
  for (const mutate of [(doc) => doc.querySelector("Build").removeAttribute("targetVersion"),
    (doc) => doc.querySelector("Tree").setAttribute("activeSpec", "9")]) {
    const report = inspect(edit(fixture(), mutate));
    assert.equal(report.status, "blocked");
  }
});

test("unknown classes/ascendancies and extra starts need explicit support", () => {
  for (const [mutate, code] of [
    [(doc) => doc.querySelector("Build").setAttribute("ascendClassName", "Unknown ascendancy"), "class_start_unresolved"],
    [(doc) => doc.querySelector("Build").removeAttribute("className"), "class_start_unresolved"],
    [(doc) => doc.querySelector("Spec").setAttribute("nodes", "1,2,3,10"), "alternate_start_nodes"],
  ]) assert.equal(hasCode(inspect(edit(fixture(), mutate)), code), true);
});

test("Huntress and Ranger can share a physical root without guessing a different class", () => {
  const data = edit(fixture(), (doc) => {
    doc.querySelector("Build").setAttribute("className", "Huntress");
    doc.querySelector("Spec").setAttribute("nodes", "10,2,3");
  });
  const report = inspect(data);
  assert.equal(report.status, "ready_for_audit");
  assert.equal(report.selection.startNodeId, "10");
  assert.equal(report.selection.className, "Huntress");
});

test("missing passives and disconnected serialized nodes are named, not dropped", () => {
  const missing = inspect(edit(fixture(), (doc) => doc.querySelector("Spec").setAttribute("nodes", "1,2,3,999")));
  assert.equal(hasCode(missing, "missing_passives"), true);
  const gap = inspect(edit(fixture(), (doc) => doc.querySelector("Spec").setAttribute("nodes", "1,3")));
  assert.equal(hasCode(gap, "disconnected_shared_passives"), true);
  assert.ok(gap.findings.find((finding) => finding.code === "disconnected_shared_passives").nodes.some((node) => node.id === "3" && node.name === "Target"));
});

test("shared paths cannot consume reserved weapon nodes as shortcuts", () => {
  const data = edit(fixture(), (doc) => {
    const set = doc.createElement("WeaponSet1"); set.setAttribute("nodes", "2"); doc.querySelector("Spec").append(set);
  });
  assert.equal(hasCode(inspect(data), "shared_route_unreachable"), true);
});

test("unsupported, overlapping, or unallocated weapon declarations are blocked", () => {
  for (const text of ["<WeaponSet3 nodes='2'/>", "<WeaponSet1 nodes='2'/><WeaponSet2 nodes='2'/>", "<WeaponSet1 nodes='5'/>"]) {
    const data = fixture(); data.xml = data.xml.replace("<Sockets/>", `${text}<Sockets/>`);
    assert.equal(inspect(data).status, "blocked");
  }
});

test("known disconnected-allocation items block only when referenced by the active context", () => {
  assert.equal(hasCode(inspect(item(fixture(), "From Nothing")), "disconnected_allocation"), true);
  const inactive = inspect(item(fixture(), "From Nothing", "", { equipped: false }));
  assert.equal(inactive.status, "ready_for_audit");
  assert.equal(inactive.ignoredInactiveItemCount, 1);
  assert.equal(inactive.inspectedItems.length, 0);
});

test("socketed allocation jewels are detected without being equipment slots", () => {
  const report = inspect(item(fixture(), "Controlled Metamorphosis", "", { socket: true }));
  assert.equal(hasCode(report, "disconnected_allocation"), true);
  assert.deepEqual(report.inspectedItems[0].locations, ["Jewel socket 4"]);
});

test("an item in another saved item set is not treated as equipped", () => {
  const data = item(fixture(), "Split Personality", "", { equipped: false });
  edit(data, (doc) => {
    const set = doc.createElement("ItemSet"); set.setAttribute("id", "2");
    const slot = doc.createElement("Slot"); slot.setAttribute("itemId", "20"); set.append(slot);
    doc.querySelector("Items").append(set);
  });
  assert.equal(inspect(data).status, "ready_for_audit");
});

test("alternate starts, generated sockets and seeded replacements are classified", () => {
  for (const [name, code] of [["Split Personality", "alternate_start"], ["Voices", "generated_sockets"],
    ["Heroic Tragedy", "transformed_passives"], ["Undying Hate", "transformed_passives"]]) {
    assert.equal(hasCode(inspect(item(fixture(), name)), code), true);
  }
});

test("renamed items are still caught by their allocation modifier text", () => {
  const report = inspect(item(fixture(), "Unknown jewel", "Passives in Radius can be Allocated\nwithout being connected to your tree"));
  assert.equal(hasCode(report, "allocation_rule"), true);
  const transformed = inspect(item(fixture(), "Unknown jewel", "Increases and Reductions to Life in Radius are Transformed to apply to Mana at 100% of their value"));
  assert.equal(hasCode(transformed, "allocation_rule"), true);
});

test("ordinary item-granted notables stay outside purchased goals", () => {
  const data = item(fixture(), "Megalomaniac", "{enchant}Allocates Granted");
  const report = inspect(data);
  assert.equal(report.status, "ready_for_audit");
  assert.equal(hasCode(report, "retained_item_grant", "info"), true);
  assert.deepEqual(report.itemGrants[0].nodeIds, ["5"]);
  assert.equal(report.sharedNodeIds.includes("5"), false);
});

test("unknown grants are explicit coverage warnings; overlaps with paid nodes block cost assumptions", () => {
  assert.equal(hasCode(inspect(item(fixture(), "Amulet", "Allocates Not in graph")), "unresolved_item_grant", "warning"), true);
  assert.equal(hasCode(inspect(item(fixture(), "Amulet", "Allocates Target")), "ambiguous_item_grant_cost"), true);
});

test("invalid socket bindings and missing selected item records are blocked", () => {
  const badSocket = item(fixture(), "Jewel", "", { socket: true });
  edit(badSocket, (doc) => doc.querySelector("Spec").setAttribute("nodes", "1,2,3"));
  assert.equal(hasCode(inspect(badSocket), "invalid_jewel_socket"), true);
  const badItem = item(fixture(), "Jewel");
  edit(badItem, (doc) => doc.querySelector("Item").remove());
  assert.equal(hasCode(inspect(badItem), "missing_item_record"), true);
});

test("secondary nil is absent, but secondary ascendancies and unsupported overrides block", () => {
  assert.equal(hasCode(inspect(fixture()), "secondary_ascendancy"), false);
  assert.equal(hasCode(inspect(edit(fixture(), (doc) => doc.querySelector("Spec").setAttribute("secondaryAscendClassId", "2"))), "secondary_ascendancy"), true);
  assert.equal(hasCode(inspect(edit(fixture(), (doc) => doc.querySelector("Overrides").append(doc.createElement("TattooOverride")))), "tree_overrides"), true);
});

test("allocation-changing custom modifiers are checked only in the active config set", () => {
  const data = fixture();
  edit(data, (doc) => {
    const input = doc.createElement("Input"); input.setAttribute("name", "customMods");
    input.setAttribute("string", "Passives in Radius can be Allocated without being connected to your tree");
    doc.querySelector("ConfigSet").append(input);
  });
  assert.equal(hasCode(inspect(data), "custom_allocation_rule"), true);
  edit(data, (doc) => { doc.querySelector("ConfigSet").setAttribute("id", "2");
    const active = doc.createElement("ConfigSet"); active.setAttribute("id", "1"); doc.querySelector("Config").append(active); });
  assert.equal(hasCode(inspect(data), "custom_allocation_rule"), false);
});

test("allocation-changing passives themselves are not overlooked", () => {
  const data = fixture(); data.graph.nodes[3].stats = ["Passives in Radius can be Allocated without being connected to your tree"];
  assert.equal(hasCode(inspect(data), "passive_allocation_rule"), true);
});

test("malformed XML, entity declarations, and unknown profiles do not become ready", () => {
  for (const text of ["not XML", "<PathOfBuilding/>", "<!DOCTYPE foo><PathOfBuilding2/>", "<PathOfBuilding2>"]) {
    assert.equal(inspectPobImport(text, fixture().graph).status, "blocked");
  }
  assert.equal(inspectPobImport(fixture().xml, fixture().graph, { profile: "guess" }).status, "blocked");
});

test("static checks leave the source and graph unchanged", () => {
  const data = item(fixture(), "Megalomaniac", "Allocates Granted");
  const before = JSON.stringify(data); inspect(data); assert.equal(JSON.stringify(data), before);
});

test("a blocked or mismatched persisted job cannot reuse a ready result", () => {
  const data = fixture(); const ready = inspect(data); const audit = { validationProfile: "ci-mana" };
  for (const old of [{ ...ready, sourceXmlSha256: "other" }, { ...ready, canGenerateRoutes: false }, { ...ready, requestedProfile: "life-armour" }]) {
    assert.equal(inspectAuditJob(data.xml, data.graph, audit, old).status, "blocked");
  }
});

test("blocked preparation preserves old inputs but clears stale performance ranking", () => {
  const parent = resolve("var"); mkdirSync(parent, { recursive: true });
  const job = mkdtempSync(join(parent, "preflight-test-"));
  try {
    const original = fixture(); const bad = item(fixture(), "From Nothing");
    const codePath = join(job, "code.txt");
    writeFileSync(codePath, Buffer.from(compressSync(strToU8(bad.xml))).toString("base64url"));
    writeFileSync(join(job, "audit-input.json"), "old manifest");
    writeFileSync(join(job, "real-build-results.json"), "old results");
    writeFileSync(join(job, "source-build.xml"), original.xml);
    writeFileSync(join(job, "test.requirements-report.json"), JSON.stringify({ ranking: ["old winner"] }));
    const prep = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "tools/pob-evaluation/prepare_real_audit.ts", codePath, job, "https://example.invalid/public-build"], { encoding: "utf8" });
    assert.notEqual(prep.status, 0);
    const preflight = JSON.parse(readFileSync(join(job, "import-preflight.json"), "utf8"));
    assert.equal(hasCode(preflight, "disconnected_allocation"), true);
    assert.equal(readFileSync(join(job, "audit-input.json"), "utf8"), "old manifest");
    assert.equal(readFileSync(join(job, "real-build-results.json"), "utf8"), "old results");
    writeFileSync(codePath, "not a valid PoB code");
    const badCode = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "tools/pob-evaluation/prepare_real_audit.ts", codePath, job, "https://example.invalid/public-build"], { encoding: "utf8" });
    assert.notEqual(badCode.status, 0);
    assert.equal(hasCode(JSON.parse(readFileSync(join(job, "import-preflight.json"), "utf8")), "unreadable_export"), true);
    const rank = spawnSync(process.execPath, ["tools/pob-evaluation/build_requirements.mjs", job, "unused-policy.json", "test.requirements-report.json"], { encoding: "utf8" });
    assert.equal(rank.status, 1, rank.stderr);
    const report = JSON.parse(readFileSync(join(job, "test.requirements-report.json"), "utf8"));
    assert.equal(report.status, "incompatible_import"); assert.deepEqual(report.ranking, []);
    assert.equal(readFileSync(join(job, "source-build.xml"), "utf8"), original.xml);
    const runtime = join(job, "runtime"); mkdirSync(runtime);
    writeFileSync(join(runtime, ".pob-evaluation-runtime.json"), JSON.stringify({ kind: "isolated-pob-evaluation-copy" }));
    writeFileSync(join(runtime, "HeadlessWrapper.lua"), "");
    const native = spawnSync("python", ["tools/pob-evaluation/run_headless.py", runtime, "--driver", "tools/pob-evaluation/evaluate_real_build.lua", "--job", job], { encoding: "utf8" });
    assert.equal(native.status, 2, native.stderr);
    assert.match(native.stderr, /preflight blocked/);
    assert.equal(existsSync(join(runtime, "lua51.dll")), false);
    writeFileSync(join(job, "import-preflight.json"), JSON.stringify({ ...inspect(original), sourceXmlSha256: "other source" }));
    const mismatch = spawnSync("python", ["tools/pob-evaluation/run_headless.py", runtime, "--driver", "tools/pob-evaluation/evaluate_real_build.lua", "--job", job], { encoding: "utf8" });
    assert.equal(mismatch.status, 2, mismatch.stderr);
    assert.match(mismatch.stderr, /does not match/);
  } finally {
    const within = relative(parent, resolve(job));
    assert.ok(within && !within.startsWith("..") && !isAbsolute(within));
    rmSync(job, { recursive: true, force: true });
  }
});

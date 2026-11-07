import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { JSDOM } from "jsdom";

const targetId = "56666";
const controlId = "25482";
const variants = ["Original", "Without grant", "Beef control", "Original restored"];
const metrics = ["Str", "Dex", "Int", "Life", "Mana", "EnergyShield", "Armour", "CombinedDPS", "TotalEHP"];
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const nodeIds = (text) => [...new Set((text ?? "").match(/\d+/g) ?? [])].sort();
const sameIds = (a, b) => Array.isArray(a) && Array.isArray(b)
  && isDeepStrictEqual([...a].sort(), [...b].sort());

// A fixture audit, not a general model of item-granted passives or timed buffs.
export function verifyItemGrantAudit(audit, result, sourceXml, graph, passiveRows) {
  const checks = [];
  const add = (name, passed, detail) => checks.push({ name, passed: passed === true, ...(detail === undefined ? {} : { detail }) });
  const numeric = (name, actual, expected) => add(name, Number.isFinite(actual) && Number.isFinite(expected)
    && Math.abs(actual - expected) <= 1e-8 * Math.max(1, Math.abs(expected)), { actual: actual ?? null, expected: expected ?? null });
  const document = new JSDOM(sourceXml, { contentType: "text/xml" }).window.document;
  const tree = document.querySelector("Tree");
  const spec = document.querySelectorAll("Tree > Spec")[Number(tree?.getAttribute("activeSpec") ?? 1) - 1];
  const items = document.querySelector("Items");
  const itemSet = [...(items?.children ?? [])].find((entry) => entry.tagName === "ItemSet"
    && entry.getAttribute("id") === (items.getAttribute("activeItemSet") ?? "1"));
  const amuletId = itemSet?.querySelector('Slot[name="Amulet"]')?.getAttribute("itemId");
  const amulet = [...(items?.children ?? [])].find((entry) => entry.tagName === "Item" && entry.getAttribute("id") === amuletId);
  const allocatedIds = nodeIds(spec?.getAttribute("nodes"));
  const w1 = nodeIds(spec?.querySelector("WeaponSet1")?.getAttribute("nodes"));
  const w2 = nodeIds(spec?.querySelector("WeaponSet2")?.getAttribute("nodes"));
  const paid = allocatedIds.filter((id) => graph.nodes[id]?.flags.classStart === false);
  const asc = paid.filter((id) => graph.nodes[id]?.flags.ascendancy === true);
  const main = paid.filter((id) => graph.nodes[id]?.flags.ascendancy === false);
  const shared = main.filter((id) => !w1.includes(id) && !w2.includes(id));
  const expectedCounts = { unionMain: main.length, nonWeaponMain: shared.length, ascendancy: asc.length,
    secondaryAscendancy: 0, sockets: paid.filter((id) => graph.nodes[id]?.flags.jewelSocket === true).length,
    weapon1: w1.length, weapon2: w2.length };
  add("source XML matches preparation and runtime evidence", sha256(sourceXml) === audit.sourceXmlSha256 && result.sourceXmlSha256 === audit.sourceXmlSha256);
  add("graph and tree versions match", graph.gameVersion === audit.graphVersion && spec?.getAttribute("treeVersion") === result.treeVersion);
  add("source allocations known; ordinary paid-cost fixture only", allocatedIds.length > 0 && allocatedIds.every((id) => graph.nodes[id])
    && paid.every((id) => !graph.nodes[id].flags.mastery && !graph.nodes[id].isMultipleChoiceOption));
  add("weapon sets are disjoint paid main allocations", !w1.some((id) => w2.includes(id)) && [...w1, ...w2].every((id) => main.includes(id)));
  add("manifest shared IDs match serialized source", sameIds(audit.originalMainNodeIds, allocatedIds.filter((id) => !graph.nodes[id]?.flags.ascendancy && !w1.includes(id) && !w2.includes(id))));
  add("amulet and source grant match", amuletId === result.amuletItemId
    && amulet?.textContent.split(/\r?\n/).filter((line) => line.trim() === "{enchant}Allocates Thaumaturgic Generator").length === 1);
  add("probe notables are not serialized paid nodes", !allocatedIds.includes(targetId) && !allocatedIds.includes(controlId));
  add("source weapon selection matches audit", result.originalActiveWeaponSet === (itemSet?.getAttribute("useSecondWeaponSet") === "true" ? 2 : 1));

  const gameRows = passiveRows.filter((row) => String(row.PassiveSkillGraphId) === targetId);
  const gameNode = gameRows[0];
  add("game data uniquely identifies anoint-only notable", gameRows.length === 1 && gameNode.Name === "Thaumaturgic Generator"
    && gameNode.IsAnointmentOnly === true && gameNode.IsNotable === true);
  add("anoint-only node is outside routable graph", graph.nodes[targetId] === undefined);
  add("PoB identifies the same node and buff text", result.target?.id === targetId && result.target.name === "Thaumaturgic Generator"
    && isDeepStrictEqual(result.target.descriptions, ["Grants Thaumaturgical Dynamism"]));
  add("PoB parses allocation grant", result.target?.grantLineFullyParsed === true
    && result.target.parsedGrantModCount === 1 && isDeepStrictEqual(result.target.grantModNames, ["GrantedPassive"]));
  add("PoB reports buff text as unsupported, not zero-valued", result.target?.parsedEffectModCount === 0 && result.target.definitionModCount === 0
    && result.target.unrecognizedEffectText?.trim() === "Grants Thaumaturgical Dynamism");
  add("control independently specifies +25 Strength", result.control?.id === controlId && result.control.name === "Beef"
    && isDeepStrictEqual(result.control.descriptions, ["+25 to Strength"]));
  add("exactly eight scenario records", result.cases?.length === 8);
  const summaries = [];
  for (const set of [1, 2]) {
    const cases = new Map();
    for (const variant of variants) {
      const matches = (result.cases ?? []).filter((entry) => entry.weaponSet === set && entry.variant === variant);
      add(`W${set} ${variant}: exactly one record`, matches.length === 1);
      const entry = matches[0];
      if (!entry) continue;
      cases.set(variant, entry);
      const prefix = `W${set} ${variant}`;
      for (const flag of ["paidContextPreserved", "nonAnointItemTextPreserved", "nonAnointParsedModsPreserved"]) add(`${prefix}: ${flag}`, entry[flag] === true);
      numeric(`${prefix}: intended anoint edit count`, entry.changedAnointLineCount, ["Without grant", "Beef control"].includes(variant) ? 1 : 0);
      numeric(`${prefix}: implicit metadata edit count`, entry.implicitCountChanges, variant === "Without grant" ? 1 : 0);
      for (const [key, value] of Object.entries(expectedCounts)) numeric(`${prefix}: independently counted ${key}`, entry.counts?.[key], value);
      const targetActive = variant === "Original" || variant === "Original restored";
      add(`${prefix}: expected calculation grant`, entry.targetGrantedInCalculation === targetActive
        && entry.targetInCalculationNodes === targetActive && entry.controlGrantedInCalculation === (variant === "Beef control"));
      add(`${prefix}: no paid probe allocation`, entry.targetInPaidAllocation === false && entry.controlInPaidAllocation === false);
      add(`${prefix}: target resolves uniquely`, sameIds(entry.resolvedTargetIds, [targetId]));
      add(`${prefix}: granted IDs agree`, Array.isArray(entry.grantedNodeIds)
        && entry.grantedNodeIds.includes(targetId) === targetActive && entry.grantedNodeIds.includes(controlId) === (variant === "Beef control"));
      for (const metric of metrics) add(`${prefix}: measured ${metric}`, Number.isFinite(entry.output?.[metric]));
      numeric(`${prefix}: separate environment Strength agrees`, entry.envStrength, entry.output?.Str);
      numeric(`${prefix}: separate environment damage agrees`, entry.envDamage, entry.output?.CombinedDPS);
    }
    const original = cases.get("Original");
    const removed = cases.get("Without grant");
    const control = cases.get("Beef control");
    const restored = cases.get("Original restored");
    add(`W${set}: all captured scalar outputs unchanged without grant`, Boolean(original?.output && removed?.output)
      && isDeepStrictEqual(original?.output, removed?.output));
    add(`W${set}: all captured scalar outputs restored`, Boolean(original?.output && restored?.output)
      && isDeepStrictEqual(original?.output, restored?.output));
    numeric(`W${set}: independent control Strength addition`, control?.output?.Str, Number.isFinite(original?.output?.Str) ? original.output.Str + 25 : undefined);
    summaries.push({ weaponSet: set, scalarOutputCount: Object.keys(original?.output ?? {}).length,
      allCapturedOutputsUnchanged: Boolean(original?.output && removed?.output) && isDeepStrictEqual(original?.output, removed?.output),
      counts: expectedCounts, activeMainPoints: shared.length + (set === 1 ? w1.length : w2.length),
      original: Object.fromEntries(metrics.map((key) => [key, original?.output?.[key] ?? null])),
      control: { Strength: control?.output?.Str ?? null, Life: control?.output?.Life ?? null } });
  }
  for (const key of ["originalContextRestored", "originalOutputsRestored", "originalWeaponSelectionRestored"]) add(key, result[key] === true);
  return { version: 1, passed: checks.every((check) => check.passed), engineVersion: result.engineVersion,
    sourceXmlSha256: sha256(sourceXml), graphVersion: graph.gameVersion, checks, summaries,
    coverage: "The anoint is granted with zero paid passive cost, but this PoB version does not parse its buff effect. Unchanged outputs do not mean no in-game benefit. This audit does not verify charge uptime, general damage or EHP." };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [directory, passivePath] = process.argv.slice(2);
  if (!directory || !passivePath) throw new Error("Usage: node verify_item_grant.mjs JOB PASSIVE_SKILLS.json");
  const job = resolve(directory);
  const inside = relative(resolve("var"), job);
  if (!inside || inside.startsWith("..") || isAbsolute(inside)) throw new Error("Audit job must remain under var.");
  const read = (name) => readFileSync(resolve(job, name), "utf8");
  const graphText = readFileSync("data/tree-graph.json", "utf8");
  const passiveText = readFileSync(passivePath, "utf8");
  const resultText = read("item-grant-audit.json");
  const report = verifyItemGrantAudit(JSON.parse(read("audit-input.json")), JSON.parse(resultText), read("source-build.xml"), JSON.parse(graphText), JSON.parse(passiveText));
  report.evidence = { resultSha256: sha256(resultText), graphSha256: sha256(graphText), passiveSkillsSha256: sha256(passiveText) };
  writeFileSync(resolve(job, "item-grant-verification.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length,
    failed: report.checks.filter((check) => !check.passed), summaries: report.summaries }, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}

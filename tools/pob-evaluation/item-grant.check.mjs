import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { verifyItemGrantAudit } from "./verify_item_grant.mjs";

function fixture() {
  const sourceXml = `<PathOfBuilding2><Tree activeSpec="1"><Spec treeVersion="0_5" nodes="1,2,3,4,5,6">
    <WeaponSet1 nodes="3"/><WeaponSet2 nodes="4"/></Spec></Tree>
    <Items activeItemSet="4"><Item id="27">Rare Amulet
{enchant}Allocates Thaumaturgic Generator</Item><ItemSet id="4" useSecondWeaponSet="true"><Slot name="Amulet" itemId="27"/></ItemSet></Items></PathOfBuilding2>`;
  const node = (changes = {}) => ({ flags: { classStart: false, ascendancy: false, mastery: false, jewelSocket: false, ...changes } });
  const graph = { gameVersion: "fixture", nodes: { 1: node({ classStart: true }), 2: node({ jewelSocket: true }), 3: node(), 4: node(),
    5: node({ ascendancy: true }), 6: node({ ascendancy: true, classStart: true }) } };
  const audit = { sourceXmlSha256: createHash("sha256").update(sourceXml).digest("hex"), graphVersion: "fixture", originalMainNodeIds: ["1", "2"] };
  const target = { id: "56666", name: "Thaumaturgic Generator", descriptions: ["Grants Thaumaturgical Dynamism"],
    grantLineFullyParsed: true, parsedGrantModCount: 1, grantModNames: ["GrantedPassive"], parsedEffectModCount: 0, definitionModCount: 0,
    unrecognizedEffectText: "Grants Thaumaturgical Dynamism " };
  const result = { sourceXmlSha256: audit.sourceXmlSha256, engineVersion: "fixture", treeVersion: "0_5", amuletItemId: "27", originalActiveWeaponSet: 2,
    target, control: { id: "25482", name: "Beef", descriptions: ["+25 to Strength"] }, cases: [],
    originalContextRestored: true, originalOutputsRestored: true, originalWeaponSelectionRestored: true };
  for (const weaponSet of [1, 2]) for (const variant of ["Original", "Without grant", "Beef control", "Original restored"]) {
    const targetActive = variant === "Original" || variant === "Original restored";
    const controlActive = variant === "Beef control";
    const output = { Str: 199 + (controlActive ? 25 : 0), Dex: 52, Int: 90, Life: 3054, Mana: 0, EnergyShield: 0,
      Armour: 9159, CombinedDPS: weaponSet === 1 ? 0 : 389098, TotalEHP: 18760, testFlag: true, testLabel: "unchanged" };
    result.cases.push({ weaponSet, variant, output, paidContextPreserved: true, nonAnointItemTextPreserved: true, nonAnointParsedModsPreserved: true,
      changedAnointLineCount: ["Without grant", "Beef control"].includes(variant) ? 1 : 0, implicitCountChanges: variant === "Without grant" ? 1 : 0,
      counts: { unionMain: 3, nonWeaponMain: 1, ascendancy: 1, secondaryAscendancy: 0, sockets: 1, weapon1: 1, weapon2: 1 },
      targetGrantedInCalculation: targetActive, targetInCalculationNodes: targetActive, controlGrantedInCalculation: controlActive,
      targetInPaidAllocation: false, controlInPaidAllocation: false, resolvedTargetIds: ["56666"],
      grantedNodeIds: targetActive ? ["56666"] : controlActive ? ["25482"] : [], envStrength: output.Str, envDamage: output.CombinedDPS });
  }
  // IsFree is not the cost of an item-granted allocation.
  const rows = [{ PassiveSkillGraphId: 56666, Name: "Thaumaturgic Generator", IsAnointmentOnly: true, IsNotable: true, IsFree: false }];
  return { sourceXml, audit, graph, result, rows };
}
const verify = (f) => verifyItemGrantAudit(f.audit, f.result, f.sourceXml, f.graph, f.rows);
const fails = (change, pattern) => {
  const data = fixture(); change(data);
  const report = verify(data);
  assert.equal(report.passed, false);
  assert.ok(report.checks.some((check) => !check.passed && pattern.test(check.name)), JSON.stringify(report.checks.filter((check) => !check.passed)));
};

test("anoint fixture verifies grants, both sets, independent costs and control Strength", () => {
  const report = verify(fixture());
  assert.equal(report.passed, true);
  assert.equal(report.checks.length, 248);
  assert.deepEqual(report.summaries.map((entry) => entry.activeMainPoints), [2, 2]);
  assert.match(report.coverage, /do not mean no in-game benefit/);
});

test("double counting and charging the granted notable fail", () => {
  fails(({ result }) => result.cases[0].counts.nonWeaponMain++, /counted nonWeaponMain/);
  fails(({ result }) => result.cases[0].targetInPaidAllocation = true, /no paid probe/);
  fails(({ result }) => delete result.cases[0].counts.weapon2, /counted weapon2/);
});

test("missing or incorrect grant/effect evidence cannot certify coverage", () => {
  fails(({ result }) => result.target.definitionModCount = 1, /buff text as unsupported/);
  fails(({ result }) => delete result.target.unrecognizedEffectText, /buff text as unsupported/);
  fails(({ result }) => result.cases[0].targetGrantedInCalculation = false, /expected calculation grant/);
  fails(({ result }) => result.target.grantModNames = [], /parses allocation grant/);
  fails(({ result }) => result.cases[0].resolvedTargetIds.push("123"), /resolves uniquely/);
});

test("unchanged unsupported effect must not hide a broken positive control", () => {
  fails(({ result }) => result.cases[2].output.Str = 199, /control Strength addition/);
  fails(({ result }) => result.control.descriptions = ["+24 to Strength"], /independently specifies/);
});

test("equal missing values and zero-baseline damage do not bypass measurement checks", () => {
  fails(({ result }) => result.cases.forEach((entry) => delete entry.output.TotalEHP), /measured TotalEHP/);
  fails(({ result }) => result.cases[0].envDamage = undefined, /environment damage agrees/);
  fails(({ result }) => result.cases[1].output.testFlag = false, /scalar outputs unchanged/);
});

test("both sets, full restoration and non-anoint context are mandatory", () => {
  fails(({ result }) => result.cases.pop(), /eight scenario|exactly one record/);
  fails(({ result }) => result.cases[1] = structuredClone(result.cases[0]), /exactly one record/);
  fails(({ result }) => result.originalWeaponSelectionRestored = false, /originalWeaponSelectionRestored/);
  fails(({ result }) => result.cases[1].nonAnointParsedModsPreserved = false, /nonAnointParsedModsPreserved/);
  fails(({ result }) => result.cases[3].output.Life++, /scalar outputs restored/);
});

test("source and primary game-data identity cannot drift silently", () => {
  fails((f) => f.sourceXml += " ", /source XML/);
  fails(({ rows }) => rows[0].IsAnointmentOnly = false, /anoint-only notable/);
  fails(({ rows }) => rows.push({ ...rows[0] }), /anoint-only notable/);
  fails(({ graph }) => graph.nodes[56666] = { flags: {} }, /outside routable graph/);
});

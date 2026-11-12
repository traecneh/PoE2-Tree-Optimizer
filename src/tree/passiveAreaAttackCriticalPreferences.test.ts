import { spellUtilityAreaIds } from "./spellUtilitySkills.fixtures";
import { attackClosureIds, attackClosureAreaIds } from "./attackClosureSkills.fixtures";
import { maceShieldIds } from "./maceShieldSkills.fixtures";
import { monkPrimaryIds } from "./monkPrimarySkills.fixtures";
import { spearPrimaryIds, spearPrimaryAreaIds } from "./spearPrimarySkills.fixtures";
import { bowPrimaryHitIds, bowPrimaryAreaDamageIds } from "./bowPrimarySkills.fixtures";
import { quarterstaffPrimaryIds } from "./quarterstaffPrimarySkills.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";
import { remainingAttackIds, remainingAreaIds } from "./remainingAttackSkills.fixtures";
import { ballistaIds } from "./ballistaSkills.fixtures";
import { fireLightningAreaDamageIds } from "./fireLightningSkills.fixtures";
import { plantIds } from "./plantSkills.fixtures";
import { plantBowHitIds } from "./plantBowSkills.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { macePrimaryIds } from "./macePrimarySkills.fixtures";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const areaIds = ["fireball", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "frost-bomb", "flameblast", "frost-wall",
  "bonestorm", "bone-cage", "hexblast", "unearth", "dark-effigy", "ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "rain-of-arrows", "explosive-spear", "explosive-shot", "explosive-grenade", "rake", "maul", "shred", ...remainingAreaIds, ...fireLightningAreaDamageIds, ...plantBowHitIds, ...poisonBowIds, ...macePrimaryIds, ...quarterstaffPrimaryIds, ...bowPrimaryAreaDamageIds, "tornado-shot", ...spearPrimaryAreaIds, ...monkPrimaryIds, ...maceShieldIds, ...attackClosureAreaIds, ...spellUtilityAreaIds, "shockwave-totem", "herald-of-ice", "arctic-howl"];
const attackIds = ["lightning-arrow", "ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear", "galvanic-shards", "explosive-shot", "explosive-grenade", "rake", "maul", "shred", ...remainingAttackIds, ...macePrimaryIds, ...quarterstaffPrimaryIds, ...bowPrimaryHitIds, ...spearPrimaryIds, ...monkPrimaryIds, ...maceShieldIds, ...attackClosureIds, "shockwave-totem", "herald-of-ice", "herald-of-thunder"];
const cases = [
  ["areaDamage", "Area Damage", [...areaIds, ...ballistaIds, ...plantIds]],
  ["criticalDamageBonus", "Critical Damage Bonus for Attack Damage", [...attackIds, ...ballistaIds, "toxic-domain", ...plantBowHitIds]],
] as const;

describe("generic area and attack-only critical damage preferences", () => {
  it("uses reviewed damaging components, not Area tags or targeting radii", () => {
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.some((s) => s === "spellAreaDamage" || s === "attackAreaDamage" || s === "areaDamageOverTime" || s === "secondaryAreaDamage"))
      .map((p) => p.id).sort()).toEqual([...areaIds, ...ballistaIds, ...plantIds].sort());
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes("attackCriticalDamageBonus"))
      .map((p) => p.id).sort()).toEqual([...attackIds, ...ballistaIds, "toxic-domain", ...plantBowHitIds].sort());
    for (const focusSkillId of ["contagion", "despair", "vulnerability", "enfeeble", "lightning-spear", "ice-shot", "detonate-dead", "skeletal-frost-mage"]) {
      expect(passivePreferenceValues(node("10% increased Area Damage"), { focusSkillId })).toEqual({});
    }
  });
  it.each(cases)("admits %s only for its explicit reviewed focuses", (id, wording, allowed) => {
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Fireball", "__proto__"]) {
      const expected = allowed.includes(focusSkillId ?? "") ? { [id]: 12.5 } : {};
      expect(passivePreferenceValues(node(`12.5% increased ${wording}`), { focusSkillId }), focusSkillId).toEqual(expected);
      expect(scorePassiveNode(node(`12.5% increased ${wording}`), [{ id, weight: 2 }], { focusSkillId }))
        .toBeCloseTo(Object.keys(expected).length ? 2.5 : 0);
    }
  });
  it.each(cases)("retains signed %s arithmetic without cross-scoring", (id, wording, allowed) => {
    const context = { focusSkillId: allowed[0] };
    const passive = node(`  12.5%   INCREASED ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive, context)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 3 }], context)).toBeCloseTo(-2.25);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    expect(scorePassiveNode(passive, (["genericDamage", "attackDamage", "spellDamage", "areaOfEffect", "attackAreaDamage", "spellAreaDamage", "criticalChance"] as const)
      .map((id) => ({ id, weight: 3 })), context)).toBe(0);
    expect(passivePreferenceValues(node(`0% increased ${wording}`), context)).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`), context)).toEqual({ [id]: 0 });
  });
  it.each(cases)("rejects conditional, other-owner, more/less, flat and malformed %s lines", (_id, wording, allowed) => {
    for (const line of [`10% increased ${wording} while stationary`, `10% increased ${wording}\nif you've Crit Recently`,
      `10% increased ${wording} per Charge`, `10% increased ${wording} with Ailments`, `10% increased ${wording} and Area of Effect`,
      `Minions have 10% increased ${wording}`, `Companions deal 10% increased ${wording}`, `Enemies have 10% increased ${wording}`,
      `Totems have 10% increased ${wording}`, `10% more ${wording}`, `10% less ${wording}`, `+10% to ${wording}`,
      `-10% increased ${wording}`, `1.2.3% increased ${wording}`, `NaN% increased ${wording}`, `Infinity% increased ${wording}`]) {
      expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] }), line).toEqual({});
    }
  });
  it("keeps generic and scoped area damage in separate preferences without fanout", () => {
    const passive = node("10% increased Area Damage", "5% reduced Area Damage", "20% increased Attack Area Damage",
      "30% increased Spell Area Damage", "4% increased Area of Effect", "7% increased Damage");
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-strike" }))
      .toEqual({ areaDamage: 5, attackAreaDamage: 20, areaOfEffect: 4, genericDamage: 7 });
    expect(passivePreferenceValues(passive, { focusSkillId: "fireball" }))
      .toEqual({ areaDamage: 5, spellAreaDamage: 30, areaOfEffect: 4, genericDamage: 7 });
    expect(scorePassiveNode(node("10% increased Area Damage"), [{ id: "areaDamage", weight: 1 },
      { id: "attackAreaDamage", weight: 3 }, { id: "spellAreaDamage", weight: 3 }], { focusSkillId: "ice-strike" })).toBe(1);
  });
  it("adds genuine generic/attack critical lines once, excluding spell-only, conditional and flat bonuses", () => {
    const passive = node("10% increased Critical Damage Bonus", "20% increased Critical Damage Bonus for Attack Damage",
      "5% reduced Critical Damage Bonus for Attack Damage", "30% increased Critical Spell Damage Bonus",
      "+25% to Critical Damage Bonus against Stunned Enemies", "10% increased Critical Hit Chance for Attacks");
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-shot" })).toEqual({ criticalDamageBonus: 25, criticalChance: 10 });
    expect(passivePreferenceValues(passive, { focusSkillId: "fireball" })).toEqual({ criticalDamageBonus: 40 });
    expect(passivePreferenceValues(passive)).toEqual({ criticalDamageBonus: 10 });
  });
  it("does not invent support compatibility or suppress area damage under Controlled Destruction", () => {
    const passive = node("10% increased Area Damage", "20% increased Critical Damage Bonus for Attack Damage", "30% increased Critical Spell Damage Bonus");
    expect(passivePreferenceValues(passive, { focusSkillId: "fireball", supportGemIds: ["controlled-destruction"] })).toEqual({ areaDamage: 10 });
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-strike", supportGemIds: ["controlled-destruction"] }))
      .toEqual({ areaDamage: 10, criticalDamageBonus: 20 });
  });
  it("keeps preferences optional and limits generic Area Damage suggestions to the reviewed Tornado DoT", () => {
    const settings = { mode: "weighted", extraPointBudget: 5, focusSkillId: "ice-strike",
      preferences: [{ id: "areaDamage", weight: 2 }, { id: "criticalDamageBonus", weight: 3 }] };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    expect(skillPreferencePresets.filter((p) => p.suggestions.some((s) => s.id === "areaDamage")).map(p => p.id)).toEqual(["tornado-shot","arctic-howl"]);
  });
  it("covers 13 native occurrences and six wordings, retaining unrelated effects separately", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const totals = { areaDamage: 0, criticalDamageBonus: 0 };
    const wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      for (const line of n.stats) for (const [id, wording, allowed] of cases) {
        if (new RegExp(`^\\d+% increased ${wording}$`, "i").test(line)) {
          expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] })).toEqual({ [id]: Number(line.match(/^\d+/)![0]) });
          totals[id]++;
          wordings.add(line);
        }
      }
    }
    expect(totals).toEqual({ areaDamage: 6, criticalDamageBonus: 7 });
    expect(wordings.size).toBe(6);
    expect(passivePreferenceValues(graph.nodes["2511"], { focusSkillId: "boneshatter" })).toEqual({ criticalDamageBonus: 25 });
    expect(passivePreferenceValues(graph.nodes["57388"], { focusSkillId: "boneshatter" })).toEqual({ criticalDamageBonus: 20, criticalChance: 15 });
    expect(passivePreferenceValues(graph.nodes["15913"], { focusSkillId: "fireball" })).toEqual({ areaDamage: 5, areaOfEffect: 4 });
    expect(passivePreferenceValues(graph.nodes["12893"], { focusSkillId: "fireball" })).toEqual({ areaDamage: 6, companionAreaOfEffect: 10 });
  });
});

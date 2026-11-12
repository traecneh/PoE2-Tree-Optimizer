import { monkPrimaryIds, monkPrimaryAccuracyIds } from "./monkPrimarySkills.fixtures";
import { bowPrimaryHitIds } from "./bowPrimarySkills.fixtures";
import { quarterstaffPrimaryIds } from "./quarterstaffPrimarySkills.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";
import { remainingCrossbowIds } from "./remainingAttackSkills.fixtures";
import { ballistaIds } from "./ballistaSkills.fixtures";
import { plantBowHitIds } from "./plantBowSkills.fixtures";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const cases = [
  ["attackDamage", "Damage with Two Handed Weapons", "twoHandedWeaponDamage", ["lightning-arrow", "ice-shot", "rain-of-arrows", "ice-strike", "tempest-flurry", "galvanic-shards", "explosive-shot", "explosive-grenade", ...remainingCrossbowIds, ...ballistaIds, ...plantBowHitIds, "supercharged-slam", ...quarterstaffPrimaryIds, ...bowPrimaryHitIds, ...monkPrimaryIds, "escape-shot"], 15],
  ["accuracy", "Accuracy Rating with Two Handed Melee Weapons", "twoHandedMeleeAccuracy", ["ice-strike", "tempest-flurry", "supercharged-slam", ...quarterstaffPrimaryIds, ...monkPrimaryAccuracyIds], 2],
] as const;

describe("reviewed two-handed passive preferences", () => {
  it.each(cases)("admits %s from %s only for explicit verified handedness", (id, wording, scope, allowed) => {
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes(scope)).map((p) => p.id).sort()).toEqual([...allowed].sort());
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Ice Strike", "__proto__"]) {
      const expected = (allowed as readonly string[]).includes(focusSkillId ?? "") ? { [id]: 12.5 } : {};
      expect(passivePreferenceValues(node(`12.5% increased ${wording}`), { focusSkillId }), focusSkillId).toEqual(expected);
      expect(scorePassiveNode(node(`12.5% increased ${wording}`), [{ id, weight: 2 }], { focusSkillId }))
        .toBeCloseTo(Object.keys(expected).length ? 2.5 : 0);
    }
  });
  it.each(cases)("retains signed %s arithmetic from %s without cross-category fanout", (id, wording, _scope, allowed) => {
    const context = { focusSkillId: allowed[0] };
    const passive = node(`  12.5%   INCREASED ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive, context)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 3 }], context)).toBeCloseTo(-2.25);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    expect(scorePassiveNode(passive, (["genericDamage", "projectileDamage", "spellDamage", "physicalDamage", "elementalDamage",
      "criticalChance", "attackSpeed"] as const).map((id) => ({ id, weight: 3 })), context)).toBe(0);
    expect(passivePreferenceValues(node(`0% increased ${wording}`), context)).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`), context)).toEqual({ [id]: 0 });
  });
  it.each(cases)("rejects conditional, other-owner, composite, more/less and malformed %s from %s", (_id, wording, _scope, allowed) => {
    for (const line of [`10% increased ${wording} while stationary`, `10% increased ${wording}\nif you've Stunned Recently`,
      `10% increased ${wording} per Charge`, `10% increased ${wording} with Ailments`, `10% increased ${wording} and Attack Speed`,
      `Minions deal 10% increased ${wording}`, `Companions have 10% increased ${wording}`, `Totems have 10% increased ${wording}`,
      `Enemies have 10% reduced ${wording}`, `10% more ${wording}`, `10% less ${wording}`, `+10 to ${wording}`,
      `+10% increased ${wording}`, `-10% increased ${wording}`, `1.2.3% increased ${wording}`,
      `NaN% increased ${wording}`, `Infinity% increased ${wording}`]) {
      expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] }), line).toEqual({});
    }
  });
  it("does not infer a mace loadout, grant melee-weapon accuracy to bows or grant weapon damage to spells", () => {
    const passive = { ...node("40% increased Damage with Two Handed Weapons", "16% increased Accuracy Rating with Two Handed Melee Weapons"), name: "Two Handed Mace Damage and Accuracy" };
    for (const focusSkillId of ["boneshatter", "rolling-slam", "lightning-spear", "explosive-spear", "fireball", "spark", "skeletal-brute", "warrior", "monk", undefined]) {
      expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({});
    }
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-shot" })).toEqual({ attackDamage: 40 });
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-strike" })).toEqual({ attackDamage: 40, accuracy: 16 });
  });
  it("keeps unreviewed handedness aliases, attack speed, typed damage and one-handed sources excluded", () => {
    const passive = node("10% increased Damage with Two-Handed Weapons", "10% increased Damage with Two Handed Melee Weapons",
      "10% increased Physical Damage with Two Handed Weapons", "10% increased Damage with One Handed Weapons",
      "10% increased Attack Speed with Two Handed Weapons", "10% increased Accuracy Rating with Two Handed Weapons",
      "10% increased Accuracy Rating with One Handed Melee Weapons", "10% increased Damage while wielding a Two Handed Weapon");
    for (const focusSkillId of ["ice-strike", "tempest-flurry", "lightning-arrow", "boneshatter"]) {
      expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({});
    }
  });
  it("adds distinct generic, melee, matching weapon and handedness sources once", () => {
    const passive = node("10% increased Attack Damage", "20% increased Damage with Quarterstaves", "30% increased Damage with Two Handed Weapons",
      "5% reduced Damage with Two Handed Weapons", "12% increased Melee Damage", "100% increased Damage with Bows",
      "10% increased Accuracy Rating", "20% increased Accuracy Rating with Quarterstaves", "30% increased Accuracy Rating with Two Handed Melee Weapons",
      "5% reduced Accuracy Rating with Two Handed Melee Weapons", "100% increased Accuracy Rating with One Handed Melee Weapons");
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-strike" })).toEqual({ attackDamage: 67, accuracy: 55 });
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-shot" })).toEqual({ attackDamage: 135, accuracy: 10 });
    expect(passivePreferenceValues(passive, { focusSkillId: "boneshatter" })).toEqual({ attackDamage: 22, accuracy: 10 });
    expect(passivePreferenceValues(passive)).toEqual({ attackDamage: 10, accuracy: 10 });
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 1 }, { id: "accuracy", weight: 1 }], { focusSkillId: "ice-strike" })).toBeCloseTo(12.2);
    expect(scorePassiveNode(node("10% increased Damage with Two Handed Weapons"), [{ id: "attackDamage", weight: 1 },
      { id: "genericDamage", weight: 3 }, { id: "projectileDamage", weight: 3 }], { focusSkillId: "ice-shot" })).toBe(1);
  });
  it("preserves manual priorities and support compatibility without new preference IDs or automatic accuracy", () => {
    const settings = normalizePassiveOptimizationSettings({ mode: "weighted", extraPointBudget: 5, focusSkillId: "ice-strike",
      preferences: [{ id: "attackDamage", weight: 2 }, { id: "accuracy", weight: 3 }] });
    expect(settings.preferences).toEqual([{ id: "attackDamage", weight: 2 }, { id: "accuracy", weight: 3 }]);
    for (const preset of skillPreferencePresets) {
      expect(preset.suggestions.some((s) => s.id === "accuracy")).toBe(false);
      expect(addSkillPresetPreferences(settings, preset).preferences.slice(0, 2)).toEqual(settings.preferences);
    }
    expect(passivePreferenceValues(node("10% increased Damage with Two Handed Weapons", "16% increased Accuracy Rating with Two Handed Melee Weapons"),
      { focusSkillId: "ice-strike", supportGemIds: ["controlled-destruction"] })).toEqual({ attackDamage: 10, accuracy: 16 });
  });
  it("covers seventeen native occurrences and four wordings, preserving penalties and not counting both handedness lines", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const wordings = new Set<string>();
    let occurrences = 0;
    for (const [id, wording, , allowed, expected] of cases) {
      let count = 0;
      for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
        for (const line of n.stats) if (new RegExp(`^\\d+% increased ${wording}$`, "i").test(line)) {
          expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] })).toEqual({ [id]: Number(line.match(/^\d+/)![0]) });
          expect(passivePreferenceValues(node(line))).toEqual({});
          wordings.add(line); count++;
        }
      }
      expect(count).toBe(expected); occurrences += count;
    }
    expect(occurrences).toBe(17);
    expect(wordings.size).toBe(4);
    for (const id of ["25513", "52392"]) {
      expect(passivePreferenceValues(graph.nodes[id], { focusSkillId: "ice-shot" })).toEqual({ attackDamage: 40, attackSpeed: -5, stunBuildup: 20 });
      expect(passivePreferenceValues(graph.nodes[id], { focusSkillId: "boneshatter" })).toEqual({ attackSpeed: -5, stunBuildup: 20 });
    }
    expect(passivePreferenceValues(graph.nodes["38888"], { focusSkillId: "ice-strike" })).toEqual({ accuracy: 16 });
    expect(passivePreferenceValues(graph.nodes["9941"], { focusSkillId: "tempest-flurry" })).toEqual({ accuracy: 8 });
    expect(passivePreferenceValues(graph.nodes["38888"], { focusSkillId: "ice-shot" })).toEqual({});
  });
});

import { attackClosureSpearIds, attackClosureMeleeIds } from "./attackClosureSkills.fixtures";
import { spearPrimaryIds, spearPrimaryMeleeIds } from "./spearPrimarySkills.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const focusIds = ["lightning-spear", "explosive-spear", "rake", ...spearPrimaryIds, ...attackClosureSpearIds];
const cases = [
  ["attackDamage", "Damage with One Handed Weapons", "oneHandedWeaponDamage", 10, 11],
  ["attackSpeed", "Attack Speed with One Handed Weapons", "oneHandedWeaponAttackSpeed", 3, 2],
  ["attackSpeed", "Attack Speed with One Handed Melee Weapons", "oneHandedMeleeAttackSpeed", 3, 5],
  ["accuracy", "Accuracy Rating with One Handed Melee Weapons", "oneHandedMeleeAccuracy", 10, 5],
] as const;

describe("reviewed one-handed spear passive preferences", () => {
  it.each(cases)("admits %s from %s only for the explicit reviewed spear focuses", (id, wording, scope, scale) => {
    const eligible = scope === "oneHandedMeleeAccuracy" ? focusIds.filter(id => !["spear-of-solaris","cull-the-weak"].includes(id)) : focusIds;
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes(scope)).map((p) => p.id).sort()).toEqual([...eligible].sort());
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Lightning Spear", "__proto__"]) {
      const expected = eligible.includes(focusSkillId ?? "") ? { [id]: 12.5 } : {};
      expect(passivePreferenceValues(node(`12.5% increased ${wording}`), { focusSkillId }), focusSkillId).toEqual(expected);
      expect(scorePassiveNode(node(`12.5% increased ${wording}`), [{ id, weight: 2 }], { focusSkillId }))
        .toBeCloseTo(Object.keys(expected).length ? 12.5 / scale * 2 : 0);
    }
  });
  it.each(cases)("retains signed %s arithmetic from %s without cross-category fanout", (id, wording, _scope, scale) => {
    const context = { focusSkillId: "lightning-spear" };
    const passive = node(`  12.5%   INCREASED ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive, context)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 3 }], context)).toBeCloseTo(-7.5 / scale * 3);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    expect(scorePassiveNode(passive, (["attackDamage", "attackSpeed", "accuracy", "genericDamage", "projectileDamage", "spellDamage", "castSpeed", "skillSpeed"] as const)
      .filter((other) => other !== id).map((id) => ({ id, weight: 3 })), context)).toBe(0);
    expect(passivePreferenceValues(node(`0% increased ${wording}`), context)).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`), context)).toEqual({ [id]: 0 });
  });
  it.each(cases)("rejects conditional, owned, composite, more/less and malformed %s from %s", (_id, wording) => {
    for (const line of [`10% increased ${wording} while stationary`, `10% increased ${wording}\nif you've Crit Recently`,
      `10% increased ${wording} per Charge`, `10% increased ${wording} with Ailments`, `10% increased ${wording} and Spell Damage`,
      `Minions have 10% increased ${wording}`, `Companions deal 10% increased ${wording}`, `Totems have 10% increased ${wording}`,
      `Enemies have 10% reduced ${wording}`, `10% more ${wording}`, `10% less ${wording}`, `+10 to ${wording}`,
      `+10% increased ${wording}`, `-10% increased ${wording}`, `1.2.3% increased ${wording}`,
      `NaN% increased ${wording}`, `Infinity% increased ${wording}`]) {
      expect(passivePreferenceValues(node(line), { focusSkillId: "lightning-spear" }), line).toEqual({});
    }
  });
  it("does not infer mace handedness, class, gear, aliases or other one-handed families", () => {
    const passive = { ...node(...cases.map(([, wording]) => `10% increased ${wording}`)), name: "One Handed Mace Damage Attack Speed Accuracy" };
    for (const focusSkillId of ["boneshatter", "rolling-slam", "ice-strike", "tempest-flurry", "ice-shot", "spark", "enfeeble", "skeletal-brute", "huntress", undefined]) {
      expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({});
    }
    const unsupported = node("10% increased Damage with One-Handed Weapons", "10% increased Damage with One Handed Melee Weapons",
      "10% increased Physical Damage with One Handed Weapons", "10% increased Cast Speed with One Handed Weapons",
      "10% increased Skill Speed with One Handed Melee Weapons", "10% increased Accuracy Rating with One Handed Weapons",
      "10% increased Damage with Two Handed Weapons", "10% increased Accuracy Rating with Two Handed Melee Weapons",
      "10% increased Attack Speed while wielding a One Handed Weapon", "10% increased Attack Speed with One Handed Weapons and Spears");
    for (const focusSkillId of focusIds) expect(passivePreferenceValues(unsupported, { focusSkillId })).toEqual({});
  });
  it.each(focusIds)("adds generic, spear and handedness sources once for %s, not again under Skill Speed or Cast Speed", (focusSkillId) => {
    const passive = node("10% increased Attack Damage", "20% increased Damage with Spears", "30% increased Damage with One Handed Weapons",
      "5% reduced Damage with One Handed Weapons", "10% increased Melee Damage", "100% increased Damage with Two Handed Weapons",
      "3% increased Attack Speed", "6% increased Attack Speed with Spears", "4% increased Attack Speed with One Handed Weapons",
      "5% increased Attack Speed with One Handed Melee Weapons", "2% reduced Attack Speed with One Handed Weapons",
      "1% reduced Attack Speed with One Handed Melee Weapons", "7% increased Skill Speed",
      "10% increased Accuracy Rating", "20% increased Accuracy Rating with Spears", "30% increased Accuracy Rating with One Handed Melee Weapons",
      "5% reduced Accuracy Rating with One Handed Melee Weapons", "100% increased Accuracy Rating with Two Handed Melee Weapons");
    const melee = focusSkillId === "rake" || spearPrimaryMeleeIds.includes(focusSkillId as typeof spearPrimaryMeleeIds[number]) || attackClosureMeleeIds.includes(focusSkillId);
    const accuracy = ["spear-of-solaris","cull-the-weak"].includes(focusSkillId) ? 10 : 55;
    expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ attackDamage: melee ? 65 : 55, attackSpeed: 15, accuracy, skillSpeed: 7 });
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 1 }, { id: "attackSpeed", weight: 1 }, { id: "accuracy", weight: 1 }], { focusSkillId })).toBe((melee ? 65 : 55)/10 + 5 + accuracy/10);
    expect(passivePreferenceValues(passive)).toEqual({ attackDamage: 10, attackSpeed: 3, accuracy: 10, skillSpeed: 7 });
    expect(scorePassiveNode(node("3% increased Attack Speed with One Handed Melee Weapons"), [{ id: "attackSpeed", weight: 1 },
      { id: "castSpeed", weight: 3 }, { id: "skillSpeed", weight: 3 }], { focusSkillId })).toBe(1);
  });
  it("preserves manual priorities and existing support compatibility without automatic accuracy", () => {
    const settings = normalizePassiveOptimizationSettings({ mode: "weighted", extraPointBudget: 5, focusSkillId: "lightning-spear",
      preferences: [{ id: "attackDamage", weight: 2 }, { id: "attackSpeed", weight: 3 }, { id: "accuracy", weight: 1 }] });
    expect(settings.preferences).toEqual([{ id: "attackDamage", weight: 2 }, { id: "attackSpeed", weight: 3 }, { id: "accuracy", weight: 1 }]);
    for (const preset of skillPreferencePresets) {
      expect(preset.suggestions.some((s) => s.id === "accuracy")).toBe(false);
      expect(addSkillPresetPreferences(settings, preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
    expect(passivePreferenceValues(node("10% increased Damage with One Handed Weapons", "3% increased Attack Speed with One Handed Melee Weapons"),
      { focusSkillId: "lightning-spear", supportGemIds: ["controlled-destruction"] })).toEqual({ attackDamage: 10, attackSpeed: 3 });
  });
  it("covers 23 native occurrences and ten wordings, without counting both handedness lines or unrelated effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const wordings = new Set<string>();
    let occurrences = 0;
    for (const [id, wording, , , expected] of cases) {
      let count = 0;
      for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
        for (const line of n.stats) if (new RegExp(`^\\d+% increased ${wording}$`, "i").test(line)) {
          expect(passivePreferenceValues(node(line), { focusSkillId: "lightning-spear" })).toEqual({ [id]: Number(line.match(/^\d+/)![0]) });
          expect(passivePreferenceValues(node(line))).toEqual({});
          wordings.add(line); count++;
        }
      }
      expect(count).toBe(expected); occurrences += count;
    }
    expect(occurrences).toBe(23);
    expect(wordings.size).toBe(10);
    for (const focusSkillId of focusIds) {
      expect(passivePreferenceValues(graph.nodes["4238"], { focusSkillId })).toEqual({ attackSpeed: 6, ...(["spear-of-solaris","cull-the-weak"].includes(focusSkillId) ? {} : { accuracy: 15 }), attributes: 20 });
      expect(passivePreferenceValues(graph.nodes["10602"], { focusSkillId })).toEqual({ attackSpeed: 8, attributes: 15 });
      expect(passivePreferenceValues(graph.nodes["38888"], { focusSkillId })).toEqual(["spear-of-solaris","cull-the-weak"].includes(focusSkillId) ? {} : { accuracy: 16 });
      expect(passivePreferenceValues(graph.nodes["9941"], { focusSkillId })).toEqual(["spear-of-solaris","cull-the-weak"].includes(focusSkillId) ? {} : { accuracy: 8 });
      expect(passivePreferenceValues(graph.nodes["44330"], { focusSkillId })).toEqual({ attackDamage: 25, ailmentChance: 20 });
      expect(passivePreferenceValues(graph.nodes["46696"], { focusSkillId })).toEqual({ attackDamage: 25, maimChance: 10 });
    }
  });
});

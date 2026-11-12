import { attackClosureSpearIds } from "./attackClosureSkills.fixtures";
import { spearPrimaryIds } from "./spearPrimarySkills.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const focuses = ["lightning-spear", "explosive-spear", "rake", ...spearPrimaryIds, ...attackClosureSpearIds];
const cases = [
  ["criticalChance", "Critical Hit Chance with One Handed Melee Weapons", "oneHandedMeleeCriticalChance", 15, 2],
  ["criticalDamageBonus", "Critical Damage Bonus with One Handed Melee Weapons", "oneHandedMeleeCriticalDamageBonus", 10, 1],
  ["ailmentChance", "Chance to inflict Ailments", "oneHandedAttackAilmentChance", 10, 3],
] as const;
const line = (wording: string, value: number | string, sign = "increased") =>
  `${wording === "Chance to inflict Ailments" ? "Attacks with One-Handed Weapons have " : ""}${value}% ${sign} ${wording}`;

describe("reviewed one-handed critical and ailment preferences", () => {
  it.each(cases)("admits %s only for the explicit reviewed spear scopes", (id, wording, scope, scale) => {
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes(scope)).map((p) => p.id).sort()).toEqual([...focuses].sort());
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Lightning Spear", "__proto__"]) {
      const eligible = focuses.includes(focusSkillId ?? "");
      expect(passivePreferenceValues(node(line(wording, 12.5)), { focusSkillId }), focusSkillId).toEqual(eligible ? { [id]: 12.5 } : {});
      expect(scorePassiveNode(node(line(wording, 12.5)), [{ id, weight: 2 }], { focusSkillId })).toBeCloseTo(eligible ? 25 / scale : 0);
    }
  });
  it.each(cases)("retains signed, decimal and zero %s without cross-category fanout", (id, wording, _scope, scale) => {
    const context = { focusSkillId: "lightning-spear" };
    const passive = node(`  ${line(wording, 12.5).toUpperCase().replace(/ /g, "   ")}  `, line(wording, 20, "reduced"));
    expect(passivePreferenceValues(passive, context)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 3 }], context)).toBeCloseTo(-22.5 / scale);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    expect(scorePassiveNode(passive, (["criticalChance", "criticalDamageBonus", "ailmentChance", "poisonChance", "bleedingChance", "dazeChance", "stunBuildup", "freezeBuildup", "attackDamage"] as const)
      .filter((other) => other !== id).map((id) => ({ id, weight: 3 })), context)).toBe(0);
    expect(passivePreferenceValues(node(line(wording, 0)), context)).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(line(wording, 10), line(wording, 10, "reduced")), context)).toEqual({ [id]: 0 });
  });
  it.each(cases)("rejects owned, conditional, composite, flat and malformed %s", (_id, wording) => {
    const base = line(wording, 10);
    for (const stat of [`${base} while stationary`, `${base}\nif you've Crit Recently`, `${base} per Charge`,
      `${base} and Attack Speed`, `Minions have ${base}`, `Companions have ${base}`, `Totems have ${base}`, `Enemies have ${base}`,
      line(wording, 10, "more"), line(wording, 10, "less"), line(wording, "+10"), line(wording, "-10"),
      line(wording, "1.2.3"), line(wording, "NaN"), line(wording, "Infinity"), base.replace("increased ", ""),
      base.replace("One Handed", "One-Handed").replace("One-Handed Weapons have", "One Handed Weapons have")]) {
      expect(passivePreferenceValues(node(stat), { focusSkillId: "lightning-spear" }), stat).toEqual({});
    }
  });
  it("does not infer handedness or application from labels, class, gear or unreviewed wording", () => {
    const passive = { ...node(...cases.map(([, wording]) => line(wording, 10))), name: "Huntress One Handed Mace Critical Poison" };
    for (const focusSkillId of ["boneshatter", "rolling-slam", "ice-strike", "lightning-arrow", "spark", "enfeeble", "skeletal-brute", "huntress", undefined]) {
      expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({});
    }
    expect(passivePreferenceValues(node("10% increased Critical Hit Chance with One Handed Weapons",
      "10% increased Critical Strike Chance with One Handed Melee Weapons", "10% increased Critical Damage Bonus with Two Handed Melee Weapons",
      "Attacks with One-Handed Weapons have 10% increased chance to Poison", "Attacks with One-Handed Weapons have 10% increased Ailment Buildup",
      "Attacks with One-Handed Weapons have 10% chance to inflict Ailments", "10% increased chance to inflict Ailments with One-Handed Weapons"),
    { focusSkillId: "lightning-spear" })).toEqual({});
  });
  it.each(focuses)("adds distinct generic, attack, spear and handedness sources exactly once for %s", (focusSkillId) => {
    const passive = node("15% increased Critical Hit Chance", "15% increased Critical Hit Chance for Attacks",
      "10% increased Critical Hit Chance with Spears", line(cases[0][1], 25), line(cases[0][1], 5, "reduced"),
      "10% increased Critical Damage Bonus", "20% increased Critical Damage Bonus for Attack Damage",
      "30% increased Critical Damage Bonus with Spears", line(cases[1][1], 40), line(cases[1][1], 5, "reduced"),
      "10% increased chance to inflict Ailments", line(cases[2][1], 20), line(cases[2][1], 5, "reduced"),
      "100% increased Critical Hit Chance for Spells", "100% increased Critical Spell Damage Bonus", "100% increased Critical Damage Bonus with Bows");
    expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ criticalChance: 60, criticalDamageBonus: 95, ailmentChance: 25 });
    expect(scorePassiveNode(passive, cases.map(([id]) => ({ id, weight: 1 })), { focusSkillId })).toBe(16);
    expect(passivePreferenceValues(passive)).toEqual({ criticalChance: 15, criticalDamageBonus: 10, ailmentChance: 10 });
    expect(passivePreferenceValues(node(line(cases[2][1], 20), "5% chance to Poison on Hit", "6% chance to inflict Bleeding on Hit", "7% chance to Daze on Hit"),
      { focusSkillId })).toEqual({ ailmentChance: 20, poisonChance: 5, bleedingChance: 6, dazeChance: 7 });
  });
  it("preserves optional preferences, manual generic values and reviewed support compatibility", () => {
    const settings = normalizePassiveOptimizationSettings({ mode: "weighted", extraPointBudget: 5, focusSkillId: "lightning-spear",
      preferences: cases.map(([id]) => ({ id, weight: 2 })) });
    for (const preset of skillPreferencePresets) {
      expect(preset.suggestions.some((s) => cases.some(([id]) => s.id === id))).toBe(false);
      expect(addSkillPresetPreferences(settings, preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
    expect(passivePreferenceValues(node(...cases.map(([, wording]) => line(wording, 10))),
      { focusSkillId: "lightning-spear", supportGemIds: ["controlled-destruction"] })).toEqual({ criticalChance: 10, criticalDamageBonus: 10, ailmentChance: 10 });
  });
  it("covers all six source occurrences and four wordings, including Coated Arms without duplicate damage", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const wordings = new Set<string>();
    let occurrences = 0;
    for (const [id, wording, , , expected] of cases) {
      let count = 0;
      for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
        for (const stat of n.stats) if (stat === line(wording, Number(stat.match(/\d+/)?.[0]))) {
          const value = Number(stat.match(/\d+/)![0]);
          for (const focusSkillId of focuses) expect(passivePreferenceValues(node(stat), { focusSkillId })).toEqual({ [id]: value });
          expect(passivePreferenceValues(node(stat))).toEqual({});
          wordings.add(stat); count++;
        }
      }
      expect(count).toBe(expected); occurrences += count;
    }
    expect(occurrences).toBe(6); expect(wordings.size).toBe(4);
    for (const focusSkillId of focuses) {
      expect(passivePreferenceValues(graph.nodes["44330"], { focusSkillId })).toEqual({ attackDamage: 25, ailmentChance: 20 });
      expect(passivePreferenceValues(graph.nodes["6229"], { focusSkillId })).toEqual({ criticalDamageBonus: 40 });
      for (const id of ["12751", "26490"]) expect(passivePreferenceValues(graph.nodes[id], { focusSkillId })).toEqual({ criticalChance: 10 });
      for (const id of ["47733", "5108"]) expect(passivePreferenceValues(graph.nodes[id], { focusSkillId })).toEqual({ ailmentChance: 15 });
    }
  });
});

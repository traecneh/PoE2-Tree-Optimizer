import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const forms = [
  ["ailmentMagnitude", "", "Magnitude of Ailments you inflict"],
  ["immobilisationBuildup", "", "Immobilisation buildup"],
  ["slowMagnitude", "Debuffs you inflict have ", "Slow Magnitude"],
] as const;
const ids = forms.map(([id]) => id);
const lines = forms.map(([, prefix, wording]) => `${prefix}10% increased ${wording}`);
const specific = ["damagingAilmentMagnitude", "poisonMagnitude", "bleedingMagnitude", "igniteMagnitude", "chillMagnitude", "shockMagnitude",
  "freezeBuildup", "electrocuteBuildup", "pinBuildup", "stunBuildup", "slowPotencyReduction", "curseMagnitude", "debuffExpirySpeed",
  "ailmentDurationReduction", "igniteEffectReduction", "chillEffectReduction", "shockEffectReduction", "skillDuration", "damagingAilmentDuration", "ailmentChance", "genericDamage"] as const;

describe("generic outgoing ailment magnitude, immobilisation and slow preferences", () => {
  it.each(forms)("keeps %s signed, decimal and opt-in without granting application", (id, prefix, wording) => {
    const positive = `${prefix}12.5% increased ${wording}`, negative = `${prefix}20% reduced ${wording}`;
    const passive = node(`  ${positive.toUpperCase().replaceAll(" ", "   ")}  `, negative);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`${prefix}0% increased ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(positive, negative.replace("20", "12.5")))).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(`${prefix}150% increased ${wording}`), [{ id, weight: 1 }])).toBe(15);
  });
  it.each(forms)("requires complete unconditional player wording for %s", (id, prefix, wording) => {
    const line = `${prefix}10% increased ${wording}`;
    for (const text of [`${line} while stationary`, `${line}\nif you've Crit Recently`, `${line} per Power Charge`, `${line} against Marked Enemies`,
      `${line} with Bows`, `Minions have ${line}`, `Companions have ${line}`, `Totems have ${line}`, `Allies in your Presence have ${line}`,
      `Enemies have ${line}`, `You and your Minions have ${line}`, `${line} and an unknown effect`,
      line.replace("10", "1.2.3"), line.replace("10", ".5"), line.replace("10", "NaN"), line.replace("10", "Infinity"), line.replace("10", "+10"), line.replace("10", "-10"),
      line.replace("increased", "more"), line.replace("increased", "less")]) {
      expect(passivePreferenceValues(node(text))[id], text).toBeUndefined();
    }
  });
  it("scores each generic line once without copying it into specific, incoming, duration or damage preferences", () => {
    const passive = node(...lines);
    expect(passivePreferenceValues(passive)).toEqual({ ailmentMagnitude: 10, immobilisationBuildup: 10, slowMagnitude: 10 });
    expect(scorePassiveNode(passive, [...ids, ...specific].map((id) => ({ id, weight: 1 })))).toBe(3);
    expect(scorePassiveNode(passive, specific.map((id) => ({ id, weight: 3 })))).toBe(0);
    const distinct = node(...lines, "10% increased Magnitude of Damaging Ailments you inflict", "10% increased Magnitude of Chill you inflict",
      "10% increased Freeze Buildup", "10% reduced Slowing Potency of Debuffs on You", "Debuffs on you expire 10% faster");
    expect(passivePreferenceValues(distinct)).toEqual({ ailmentMagnitude: 10, immobilisationBuildup: 10, slowMagnitude: 10,
      damagingAilmentMagnitude: 10, chillMagnitude: 10, freezeBuildup: 10, slowPotencyReduction: 10, debuffExpirySpeed: 10 });
    expect(scorePassiveNode(distinct, [...ids, ...specific].map((id) => ({ id, weight: 1 })))).toBe(8);
    expect(scorePassiveNode(node(...distinct.stats.slice(3)), ids.map((id) => ({ id, weight: 3 })))).toBe(0);
  });
  it("keeps specific ailments, slow protection, aliases and application mechanics separate", () => {
    for (const text of ["10% increased Magnitude of Non-Damaging Ailments you inflict", "10% increased Ailment Effect", "10% increased Immobilization Buildup",
      "10% increased Ballista Immobilisation buildup", "10% increased Hazard Immobilisation buildup", "Debuffs inflicted by Hazards have 10% increased Slow Magnitude",
      "10% increased Slow Magnitude", "Debuffs on you have 10% increased Slow Magnitude", "10% increased Effect of Slows you inflict",
      "Enemies in your Presence have 10% reduced Movement Speed", "10% increased chance to inflict Ailments", "10% increased Duration of Ailments you inflict",
      "All Damage from Hits Contributes to Freeze Buildup", "You cannot inflict Ailments", "10% increased Magnitude of Ailments on you"]) {
      const values = passivePreferenceValues(node(text));
      for (const id of ids) expect(values[id], text).toBeUndefined();
    }
  });
  it("preserves manual settings across all focuses without adding priorities automatically", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "frostbolt", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: i + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(node(...lines), { focusSkillId: preset.id })).toEqual(passivePreferenceValues(node(...lines)));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id))).toBe(false);
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
  });
  it("matches all 28 game occurrences while preserving real mixed-node penalties and separate benefits", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ ailmentMagnitude: 8, immobilisationBuildup: 8, slowMagnitude: 12 });
    expect(wordings.size).toBe(11);
    expect(passivePreferenceValues(graph.nodes["18496"])).toEqual({ ailmentMagnitude: 30, damagingAilmentDuration: 20, attackSpeed: -5 });
    expect(passivePreferenceValues(graph.nodes["1773"])).toEqual({ ailmentMagnitude: 5, damagingAilmentDuration: 5 });
    expect(passivePreferenceValues(graph.nodes["13233"])).toEqual({ areaOfEffect: 10, immobilisationBuildup: 12 });
    expect(passivePreferenceValues(graph.nodes["34308"])).toEqual({ attackDamage: 20, immobilisationBuildup: 12 });
    expect(passivePreferenceValues(graph.nodes["24240"])).toEqual({ slowMagnitude: 10, debuffExpirySpeed: 20 });
    expect(passivePreferenceValues(graph.nodes["39990"])).toEqual({ slowMagnitude: 10, skillDuration: 20 });
    expect(passivePreferenceValues(graph.nodes["17867"])).toEqual({ slowMagnitude: 7, exposureEffect: 7 });
    expect(passivePreferenceValues(graph.nodes["54805"])).toEqual({ slowMagnitude: 10 });
  });
});

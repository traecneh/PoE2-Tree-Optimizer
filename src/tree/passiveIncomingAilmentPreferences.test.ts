import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const forms = [
  ["freezeThreshold", "Freeze Threshold", "increased", "reduced"],
  ["igniteEffectReduction", "Magnitude of Ignite on you", "reduced", "increased"],
  ["ailmentDurationReduction", "Duration of Ailments on You", "reduced", "increased"],
] as const;
const ids = forms.map(([id]) => id);
const lines = forms.map(([, wording, positive]) => `10% ${positive} ${wording}`);

describe("Freeze Threshold and incoming Ignite magnitude/ailment duration preferences", () => {
  it.each(forms)("keeps %s signed, decimal and opt-in without calculating capped protection", (id, wording, positive, negative) => {
    const first = `12.5% ${positive} ${wording}`, second = `20% ${negative} ${wording}`;
    const passive = node(`  ${first.toUpperCase().replaceAll(" ", "   ")}  `, second);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`0% ${positive} ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(first, second.replace("20", "12.5")))).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(`150% ${positive} ${wording}`), [{ id, weight: 1 }])).toBe(15);
  });
  it.each(forms)("requires complete unconditional player wording for %s", (id, wording, positive) => {
    const line = `10% ${positive} ${wording}`;
    for (const text of [`${line} while stationary`, `${line}\nif you've been Hit Recently`, `${line} per Power Charge`, `${line} while Shapeshifted`,
      `Minions have ${line}`, `Companions have ${line}`, `Totems have ${line}`, `Allies in your Presence have ${line}`,
      `Enemies have ${line}`, `You and your Minions have ${line}`, `${line} and an unknown effect`,
      line.replace("10", "1.2.3"), line.replace("10", ".5"), line.replace("10", "NaN"), line.replace("10", "Infinity"), line.replace("10", "+10"), line.replace("10", "-10"),
      line.replace(positive, "more"), line.replace(positive, "less")]) {
      expect(passivePreferenceValues(node(text))[id], text).toBeUndefined();
    }
  });
  it("keeps incoming threshold, magnitude and duration separate from outgoing effects and expiry", () => {
    const passive = node(...lines);
    expect(passivePreferenceValues(passive)).toEqual({ freezeThreshold: 10, igniteEffectReduction: 10, ailmentDurationReduction: 10 });
    expect(scorePassiveNode(passive, ids.map((id) => ({ id, weight: 1 })))).toBe(3);
    const other = ["elementalAilmentThreshold", "freezeBuildup", "igniteMagnitude", "igniteDuration", "damagingAilmentDuration", "skillDuration",
      "debuffExpirySpeed", "fireResistance", "coldResistance", "chillEffectReduction", "shockEffectReduction"] as const;
    expect(scorePassiveNode(passive, other.map((id) => ({ id, weight: 3 })))).toBe(0);
    const distinct = node(...lines, "10% increased Elemental Ailment Threshold", "10% increased Freeze Buildup", "10% increased Ignite Magnitude",
      "10% increased Ignite Duration on Enemies", "10% increased Duration of Damaging Ailments on Enemies", "10% increased Skill Effect Duration", "Debuffs on you expire 10% faster");
    expect(passivePreferenceValues(distinct)).toEqual({ freezeThreshold: 10, igniteEffectReduction: 10, ailmentDurationReduction: 10,
      elementalAilmentThreshold: 10, freezeBuildup: 10, igniteMagnitude: 10, igniteDuration: 10, damagingAilmentDuration: 10, skillDuration: 10, debuffExpirySpeed: 10 });
    expect(scorePassiveNode(distinct, [...ids, ...other].map((id) => ({ id, weight: 1 })))).toBe(10);
    expect(scorePassiveNode(node("10% increased Elemental Ailment Threshold", "10% increased Ignite Magnitude", "Debuffs on you expire 10% faster"),
      ids.map((id) => ({ id, weight: 3 })))).toBe(0);
  });
  it("does not infer immunity, conversions, aliases or specific ailments from a generic modifier", () => {
    for (const text of ["Cannot be Frozen", "Unaffected by Ignite", "Immune to Ailments", "20% chance to Avoid being Ignited",
      "Gain 50% of maximum Energy Shield as additional Freeze Threshold", "Gain additional Ailment Threshold equal to 30% of maximum Energy Shield",
      "10% reduced Effect of Ignite on you", "10% reduced Ignite Magnitude", "10% reduced Ignite Duration on you", "10% reduced Freeze Duration on you",
      "10% reduced Poison Duration on you", "10% reduced Duration of Elemental Ailments on You", "10% reduced Duration of Damaging Ailments on you",
      "10% reduced Duration of Ailments inflicted on you", "10% reduced Duration of Ailments on Enemies", "10% increased Freeze Threshold per 10 Intelligence",
      "Ignites you cause are reflected back to you", "Ailments on you expire 10% faster", "Debuffs you inflict expire 10% slower"]) {
      const values = passivePreferenceValues(node(text));
      for (const id of ids) expect(values[id], text).toBeUndefined();
    }
  });
  it("preserves manual settings across focuses without automatic priorities", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "fireball", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: i + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(node(...lines), { focusSkillId: preset.id })).toEqual(passivePreferenceValues(node(...lines)));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id))).toBe(false);
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
  });
  it("matches all 19 game occurrences and preserves separate mixed-node effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ freezeThreshold: 8, igniteEffectReduction: 8, ailmentDurationReduction: 3 });
    expect(wordings.size).toBe(12);
    expect(passivePreferenceValues(graph.nodes["5686"])).toEqual({ armour: 10, freezeThreshold: 30, chillEffectReduction: 30 });
    expect(passivePreferenceValues(graph.nodes["35618"])).toEqual({ freezeThreshold: 25, freezeBuildup: 25 });
    expect(passivePreferenceValues(graph.nodes["12998"])).toEqual({ freezeThreshold: 60 });
    expect(passivePreferenceValues(graph.nodes["52669"])).toEqual({ fireDamage: 20, igniteEffectReduction: 30, igniteMagnitude: 15 });
    expect(passivePreferenceValues(graph.nodes["15644"])).toEqual({ elementalAilmentThreshold: 40, ailmentDurationReduction: 10 });
    expect(passivePreferenceValues(graph.nodes["45370"])).toEqual({ attributes: 10, ailmentDurationReduction: 15 });
    expect(passivePreferenceValues(graph.nodes["5335"])).toEqual({ ailmentDurationReduction: 10 });
    expect(passivePreferenceValues(graph.nodes["4031"])).toEqual({});
  });
});

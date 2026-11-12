import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceCatalog, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const modifiers = [
  ["flammabilityMagnitude", "Flammability Magnitude", 38], ["igniteMagnitude", "Ignite Magnitude", 17],
  ["shockMagnitude", "Magnitude of Shock you inflict", 16], ["poisonMagnitude", "Magnitude of Poison you inflict", 18],
  ["bleedingMagnitude", "Magnitude of Bleeding you inflict", 9], ["shockChance", "chance to Shock", 26],
  ["igniteDuration", "Ignite Duration on Enemies", 6], ["poisonDuration", "Poison Duration", 9],
  ["bleedingDuration", "Bleeding Duration", 5], ["shockDuration", "Shock Duration", 6],
  ["freezeDuration", "Freeze Duration on Enemies", 2],
] as const;
const penetration = [
  ["firePenetration", "Fire Resistance", 19], ["coldPenetration", "Cold Resistance", 18],
  ["lightningPenetration", "Lightning Resistance", 26], ["elementalPenetration", "of Enemy Elemental Resistances", 5],
] as const;
const newIds = [...modifiers, ...penetration].map(([id]) => id);

describe("elemental penetration and ailment preferences", () => {
  it.each(modifiers)("keeps %s signed, exact and opt-in without inventing damage or application", (id, wording) => {
    const passive = node(`  12.5%   increased ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(passivePreferenceCatalog.find((p) => p.id === id)).toMatchObject({ scale: 10, unit: `10% increased ${wording}` });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBeCloseTo(-1.5);
    expect(scorePassiveNode(passive, [{ id: "fireDamage", weight: 3 }, { id: "coldDamage", weight: 3 }, { id: "curseMagnitude", weight: 3 }])).toBe(0);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`0% increased ${wording}`))).toEqual({ [id]: 0 });
    for (const line of [`10% increased ${wording} while stationary`, `10% increased ${wording}\nwhile Shapeshifted`,
      `10% increased ${wording} with Bows`, `10% increased ${wording} per Power Charge`, `10% increased ${wording} with Critical Hits`,
      `Minions have 10% increased ${wording}`, `Enemies have 10% reduced ${wording}`, `10% more ${wording}`, `10% less ${wording}`,
      `10% increased ${wording} on you`, `+10% to ${wording}`, `..% increased ${wording}`, `1.2.3% increased ${wording}`,
      `NaN% increased ${wording}`, `Infinity% increased ${wording}`, `-10% increased ${wording}`, `+10% increased ${wording}`]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it.each(penetration)("keeps %s as flat penetration, separate from other elements, reductions, exposure and DoT", (id, wording) => {
    const passive = node(`  Damage   Penetrates 2.5% ${wording.toUpperCase()}  `, `Damage Penetrates 5% ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: 7.5 });
    expect(passivePreferenceCatalog.find((p) => p.id === id)?.scale).toBe(5);
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(3);
    expect(scorePassiveNode(passive, [{ id: "elementalDamage", weight: 3 }, { id: "damageOverTime", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node(`Damage Penetrates 0% ${wording}`))).toEqual({ [id]: 0 });
    for (const line of [`Damage Penetrates 5% ${wording} while Shapeshifted`, `Damage Penetrates 5% ${wording} with Attacks`,
      `Minions' Damage Penetrates 5% ${wording}`, `Damage over Time Penetrates 5% ${wording}`,
      `Damage Penetrates -5% ${wording}`, `Damage Penetrates +5% ${wording}`, `Damage Penetrates ..% ${wording}`,
      `Damage Penetrates 1.2.3% ${wording}`, `5% increased ${wording} Penetration`, `5% reduced ${wording} Penetration`]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it("keeps incoming protection separate and rejects unreviewed mechanics and inherited lookup keys", () => {
    expect(passivePreferenceValues(node("20% reduced effect of Shock on you", "25% reduced Poison Duration on you",
      "20% reduced Magnitude of Ignite on you", "20% reduced Enemy Fire Resistance", "Fire Exposure applies an extra -10% to Fire Resistance",
      "Ignites you inflict deal Damage 18% faster", "Damaging Ailments deal damage 12% faster",
      "Targets can be affected by +1 of your Poisons at the same time", "20% increased Duration of Damaging Ailments on Enemies",
      "10% increased Magnitude of Ailments you inflict", "20% increased chance to inflict Ailments",
      "10% increased constructor", "10% increased toString", "Damage Penetrates 5% constructor"))).toEqual({ ailmentChance: 20, ailmentMagnitude: 10, damagingAilmentDuration: 20, shockEffectReduction: 20, igniteEffectReduction: 20 });
  });
  it("counts elemental penetration once in its own preference and keeps chance, magnitude and duration independent", () => {
    const passive = node("Damage Penetrates 5% of Enemy Elemental Resistances", "Damage Penetrates 10% Fire Resistance",
      "30% increased chance to Shock", "20% increased Magnitude of Shock you inflict", "10% reduced Shock Duration");
    expect(passivePreferenceValues(passive)).toEqual({ elementalPenetration: 5, firePenetration: 10, shockChance: 30, shockMagnitude: 20, shockDuration: -10 });
    expect(scorePassiveNode(passive, [{ id: "elementalPenetration", weight: 1 }, { id: "firePenetration", weight: 1 },
      { id: "shockChance", weight: 1 }, { id: "shockMagnitude", weight: 1 }, { id: "shockDuration", weight: 1 }])).toBe(7);
  });
  it("retains edited preferences and limits ailment suggestions to explicitly reviewed Poison focuses", () => {
    const preferences = newIds.map((id, i) => ({ id, weight: i % 3 + 1 }));
    const settings = { mode: "weighted" as const, extraPointBudget: 7, focusSkillId: "fireball", supportGemIds: ["controlled-destruction"], preferences };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...modifiers.map(([, wording]) => `10% increased ${wording}`), ...penetration.map(([, wording]) => `Damage Penetrates 5% ${wording}`));
    expect(passivePreferenceValues(passive, settings)).toEqual(passivePreferenceValues(passive));
    for (const preset of skillPreferencePresets) {
      const suggested = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] }, preset);
      const expected = ["poisonburst-arrow", "gas-arrow"].includes(preset.id)
        ? [{ id: "poisonMagnitude", weight: 3 }, { id: "poisonDuration", weight: 2 }]
        : preset.id === "herald-of-ash" ? [{ id: "igniteMagnitude", weight: 3 }, { id: "igniteDuration", weight: 2 }] : [];
      expect(suggested.preferences.filter((p) => newIds.some((id) => id === p.id)), preset.id).toEqual(expected);
    }
  });
  it("matches the 0.5.5f source counts and preserves real node penalties and excluded mechanics", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const main = Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery);
    for (const [id, , count] of [...modifiers, ...penetration]) {
      expect(main.filter((n) => Object.hasOwn(passivePreferenceValues(n), id)).length, id).toBe(count);
    }
    expect(passivePreferenceValues(graph.nodes["12337"])).toEqual({ lightningPenetration: 15, shockChance: 30 });
    expect(passivePreferenceValues(graph.nodes["22873"])).toEqual({ elementalPenetration: 4 });
    expect(passivePreferenceValues(graph.nodes["1073"])).toEqual({ igniteMagnitude: 6, poisonMagnitude: 6 });
    expect(passivePreferenceValues(graph.nodes["11525"])).toEqual({ flammabilityMagnitude: 15, igniteMagnitude: 8 });
    expect(passivePreferenceValues(graph.nodes["15083"])).toEqual({ shockMagnitude: 25, shockDuration: 25 });
    expect(passivePreferenceValues(graph.nodes["63759"])).toEqual({ poisonMagnitude: -20 });
    expect(passivePreferenceValues(graph.nodes["15986"])).toEqual({ poisonDuration: -25 });
    expect(passivePreferenceValues(graph.nodes["38329"])).toEqual({ freezeDuration: -20 });
    expect(passivePreferenceValues(graph.nodes["47270"])).toEqual({ freezeBuildup: 40, freezeDuration: 20 });
  });
});

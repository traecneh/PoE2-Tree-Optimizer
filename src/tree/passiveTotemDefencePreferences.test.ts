import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const elemental = ["totemFireResistance", "totemColdResistance", "totemLightningResistance"] as const;
const maximum = ["totemMaximumFireResistance", "totemMaximumColdResistance", "totemMaximumLightningResistance"] as const;
const ids = ["totemAreaOfEffect", "totemPlacementRange", ...elemental, ...maximum, "totemPhysicalDamageReduction", "totemLifeRegeneration"] as const;

describe("Totem coverage, defence and recovery preferences", () => {
  it.each([
    ["totemAreaOfEffect", "Area of Effect for Skills used by Totems"], ["totemPlacementRange", "Totem Placement range"],
  ] as const)("retains signed %s without copying player/minion area or speed", (id, wording) => {
    expect(passivePreferenceValues(node(`  12.5%  INCREASED ${wording.toUpperCase()} `, `20% reduced ${wording}`))).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(node(`10% increased ${wording}`), [{ id, weight: 3 }])).toBe(3);
    expect(scorePassiveNode(node(`10% increased ${wording}`), [{ id: "areaOfEffect", weight: 3 }, { id: "totemPlacementSpeed", weight: 3 },
      { id: "minionAreaOfEffect", weight: 3 }, { id: "attackDamage", weight: 3 }, { id: "spellDamage", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`0% increased ${wording}`))).toEqual({ [id]: 0 });
    for (const line of [`10% increased ${wording} per Summoned Totem`, `10% increased ${wording} while stationary`,
      `10% increased ${wording}\nif you've summoned a Totem Recently`, `Minions have 10% increased ${wording}`,
      `10% increased ${wording} and Area of Effect`, `10% more ${wording}`, `10% less ${wording}`, `1.2.3% increased ${wording}`,
      `+10% increased ${wording}`, `-10% increased ${wording}`, `NaN% increased ${wording}`, `Infinity% increased ${wording}`]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it.each([["Fire", "totemFireResistance"], ["Cold", "totemColdResistance"], ["Lightning", "totemLightningResistance"]] as const)
    ("matches %s resistance separately and preserves the dedicated-stat negative sign", (element, id) => {
      expect(passivePreferenceValues(node(`Totems gain +12.5% to ${element} Resistance`, `Totems gain -20% to ${element} Resistance`))).toEqual({ [id]: -7.5 });
      expect(scorePassiveNode(node(`Totems gain +5% to ${element} Resistance`), [{ id, weight: 2 }])).toBe(2);
    });
  it("fans all-elemental and maximum resistance into distinct selected categories once, never Chaos or other owners", () => {
    const passive = node("Totems gain +20% to all Elemental Resistances", "Totems gain -2% to all Maximum Elemental Resistances");
    expect(passivePreferenceValues(passive)).toEqual({ totemFireResistance: 20, totemColdResistance: 20, totemLightningResistance: 20,
      totemMaximumFireResistance: -2, totemMaximumColdResistance: -2, totemMaximumLightningResistance: -2 });
    expect(scorePassiveNode(passive, [{ id: "totemFireResistance", weight: 1 }])).toBe(4);
    expect(scorePassiveNode(passive, [...elemental, ...maximum].map((id) => ({ id, weight: 1 })))).toBe(6);
    expect(scorePassiveNode(passive, [{ id: "minionFireResistance", weight: 3 }, { id: "companionFireResistance", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node("Totems gain +0% to all Maximum Elemental Resistances"))).toEqual(Object.fromEntries(maximum.map((id) => [id, 0])));
    expect(passivePreferenceValues(node("Totems gain +20% to all Elemental Resistances", "Totems gain -20% to all Elemental Resistances")))
      .toEqual(Object.fromEntries(elemental.map((id) => [id, 0])));
    for (const line of ["Totems gain +20% to all Elemental Resistances per Summoned Totem", "Totems gain +2% to all Maximum Elemental Resistances while stationary",
      "Totems have +20% to all Elemental Resistances", "Totems gain 20% to all Elemental Resistances", "Totems gain +20% increased Elemental Resistances",
      "Totems gain +20% to Chaos Resistance", "Totems gain +2% to Maximum Fire Resistance", "Totems gain +2% to all maximum Resistances",
      "Totems gain +20% to all Elemental Resistances and an unknown effect", "Totems gain +1.2.3% to all Elemental Resistances"]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it("keeps raw resistance and physical reduction preferences distinct from capped mitigation", () => {
    const passive = node("Totems have 12.5% additional Physical Damage Reduction", "Totems have -20% additional Physical Damage Reduction");
    expect(passivePreferenceValues(passive)).toEqual({ totemPhysicalDamageReduction: -7.5 });
    expect(scorePassiveNode(passive, [{ id: "totemPhysicalDamageReduction", weight: 2 }])).toBe(-5);
    expect(scorePassiveNode(node("Totems have 120% additional Physical Damage Reduction"), [{ id: "totemPhysicalDamageReduction", weight: 1 }])).toBe(40);
    expect(passivePreferenceValues(node("Totems gain +100% to all Maximum Elemental Resistances")))
      .toEqual(Object.fromEntries(maximum.map((id) => [id, 100])));
    expect(scorePassiveNode(node("Totems have 12% additional Physical Damage Reduction"), [{ id: "armour", weight: 3 }, { id: "minionPhysicalDamageReduction", weight: 3 }])).toBe(0);
    for (const line of ["Totems have 12% additional Physical Damage Reduction while on Full Life", "Totems have 12% reduced Physical Damage taken",
      "Totems have 12% increased Physical Damage Reduction", "Totems have 12% additional Physical Damage Reduction and an unknown effect"]) {
      expect(passivePreferenceValues(node(line))).toEqual({});
    }
  });
  it("scores displayed Totem percent-Life regeneration per second once, not the raw per-minute stat or player recovery", () => {
    const passive = node("Regenerate 1% of maximum Life per second while you have a Totem", "Totems Regenerate 3% of maximum Life per second");
    expect(passivePreferenceValues(passive)).toEqual({ totemLifeRegeneration: 3 });
    expect(scorePassiveNode(passive, [{ id: "totemLifeRegeneration", weight: 2 }])).toBe(6);
    expect(scorePassiveNode(passive, [{ id: "lifeRegenerationRate", weight: 3 }, { id: "totemLife", weight: 3 }, { id: "life", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node("Totems Regenerate 0.5% of maximum Life per second", "Totems Regenerate 1% of maximum Life per second"))).toEqual({ totemLifeRegeneration: 1.5 });
    for (const line of ["Totems Regenerate -3% of maximum Life per second", "Totems Regenerate +3% of maximum Life per second",
      "Totems Regenerate 180% of maximum Life per minute", "Totems Regenerate 3 Life per second", "Totems have 3% increased Life Regeneration Rate",
      "Totems Regenerate 3% of maximum Life per second while stationary", "You and your Totems Regenerate 3% of maximum Life per second",
      "Totems Regenerate 3% of maximum Life per second\nper Summoned Totem", "Minions have Totems Regenerate 3% of maximum Life per second"]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it("preserves manual preferences in every focus without introducing automatic priorities", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "dark-effigy", preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node("Totems gain +2% to all Maximum Elemental Resistances", "20% increased Totem Placement range");
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(preset.suggestions.some((p) => ids.some((id) => p.id === id))).toBe(["artillery-ballista", "siege-ballista", "shockwave-totem"].includes(preset.id));
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 10)).toEqual(settings.preferences);
    }
  });
  it("recognizes 13 actual occurrences once for coverage, despite elemental stat fan-out", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0]));
    let occurrences = 0; const lines = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      if (ids.some((id) => Object.hasOwn(values, id))) { occurrences++; lines.add(line); }
      for (const id of ids) if (Object.hasOwn(values, id)) counts[id]++;
    }
    expect(counts).toEqual({ totemAreaOfEffect: 2, totemPlacementRange: 2, totemFireResistance: 2, totemColdResistance: 2, totemLightningResistance: 2,
      totemMaximumFireResistance: 4, totemMaximumColdResistance: 4, totemMaximumLightningResistance: 4, totemPhysicalDamageReduction: 2, totemLifeRegeneration: 1 });
    expect(occurrences).toBe(13); expect(lines.size).toBe(12);
    expect(passivePreferenceValues(graph.nodes["18419"])).toEqual({ totemLifeRegeneration: 3 });
  });
});

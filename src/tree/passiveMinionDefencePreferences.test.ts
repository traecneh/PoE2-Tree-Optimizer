import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const maxima = [["minionMaximumFireResistance", "Fire"], ["minionMaximumColdResistance", "Cold"],
  ["minionMaximumLightningResistance", "Lightning"]] as const;
const ids = ["minionEvasion", "minionPhysicalDamageReduction", "minionLifeRecoup", ...maxima.map(([id]) => id)] as const;

describe("unconditional minion defence preferences", () => {
  it("keeps increased/reduced Evasion Rating signed, separate from player evasion and evade chance", () => {
    const passive = node("  MINIONS have 12.5% INCREASED Evasion Rating  ", "Minions have 20% reduced Evasion Rating");
    expect(passivePreferenceValues(passive)).toEqual({ minionEvasion: -7.5 });
    expect(scorePassiveNode(passive, [{ id: "minionEvasion", weight: 2 }])).toBe(-1.25);
    expect(scorePassiveNode(passive, [{ id: "evasion", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node("Minions have 12% increased Evasion Rating", "Minions have 12% reduced Evasion Rating"))).toEqual({ minionEvasion: 0 });
    for (const line of ["Minions have 20% increased Evasion Rating while on Full Life", "Minions have 20% increased Evasion Rating per Charge",
      "Minions have 20% increased Evasion Rating\nwhile stationary", "Minions have 20% more Evasion Rating", "Minions have 20% less Evasion Rating",
      "Minions have 20% increased Evasion Rating and an unknown modifier", "Minions have 1.2.3% increased Evasion Rating", "Minions have +20% increased Evasion Rating",
      "Companions have 20% increased Evasion Rating", "Minions have +200 to Evasion Rating", "Minions have +20% chance to Evade"]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it("scores signed additional physical reduction points without treating them as Armour or a mitigation percentage multiplier", () => {
    const passive = node("Minions have 12% additional Physical Damage Reduction", "Minions have -18% additional Physical Damage Reduction",
      "Minions have +1.5% additional Physical Damage Reduction");
    expect(passivePreferenceValues(passive)).toEqual({ minionPhysicalDamageReduction: -4.5 });
    expect(scorePassiveNode(passive, [{ id: "minionPhysicalDamageReduction", weight: 2 }])).toBe(-3);
    expect(passivePreferenceValues(node("Minions have 0% additional Physical Damage Reduction"))).toEqual({ minionPhysicalDamageReduction: 0 });
    expect(passivePreferenceValues(node("Minions have 3% additional Physical Damage Reduction", "Minions have -3% additional Physical Damage Reduction"))).toEqual({ minionPhysicalDamageReduction: 0 });
    for (const line of ["Minions have 12% increased Physical Damage Reduction", "Minions have 12% reduced Physical Damage Reduction",
      "Minions take 12% reduced Physical Damage", "Minions have 12% additional Physical Damage Reduction while on Full Life",
      "Minions have 12% additional Physical Damage Reduction per Charge", "Minions have 12% additional Physical Damage Reduction and Armour",
      "Minions have 1.2.3% additional Physical Damage Reduction", "Companions have 12% additional Physical Damage Reduction",
      "12% additional Physical Damage Reduction", "Minions have 12% additional Elemental Damage Reduction"]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it("scores recoup amount only, without inventing regeneration, instant recovery or a timing bonus", () => {
    const passive = node("  Minions Recoup 12.5% of Damage taken as Life  ", "Minions Recoup 15% of Damage taken as Life");
    expect(passivePreferenceValues(passive)).toEqual({ minionLifeRecoup: 27.5 });
    expect(scorePassiveNode(passive, [{ id: "minionLifeRecoup", weight: 2 }])).toBeCloseTo(55 / 3);
    expect(scorePassiveNode(passive, [{ id: "lifeRecoup", weight: 3 }, { id: "lifeRegenerationRate", weight: 3 }, { id: "minionLife", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node("Minions Recoup 0% of Damage taken as Life"))).toEqual({ minionLifeRecoup: 0 });
    for (const line of ["Minions Recoup -5% of Damage taken as Life", "Minions Recoup +5% of Damage taken as Life",
      "Minions Recoup 15% of Physical Damage taken as Life", "Minions Recoup 15% of Damage taken as Mana",
      "Minions Recoup 15% of Damage taken as Life while on Low Life", "Minions Recoup 15% of Damage taken as Life\nwhile stationary",
      "Minions Recoup 15% of Damage taken as Life over 4 seconds", "Minions Recoup 1.2.3% of Damage taken as Life",
      "Minions Recoup 15% of Damage taken as Life and regenerate Life", "Minions Recoup Effects instead occur over 4 seconds",
      "Minions have 20% increased speed of Recoup Effects", "Minions have 20% increased Life Recovery Rate"]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it.each(maxima)("scores signed %s separately from ordinary resistance and all other caps", (id, element) => {
    const passive = node(`Minions have +2.5% to Maximum ${element} Resistances`, `Minions have -4% to Maximum ${element} Resistances`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -1.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-3);
    expect(passivePreferenceValues(node(`Minions have +0% to Maximum ${element} Resistances`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`Minions have +3% to Maximum ${element} Resistances`, `Minions have -3% to Maximum ${element} Resistances`))).toEqual({ [id]: 0 });
    for (const line of [`Minions have 3% to Maximum ${element} Resistances`, `Minions have 3% increased Maximum ${element} Resistances`,
      `Minions have +3% to Maximum ${element} Resistances while on Full Life`, `Minions have +3% to Maximum ${element} Resistances per Charge`,
      `Minions have +3% to Maximum ${element} Resistances\nwhile stationary`, `Minions have +3% to Maximum ${element} Resistances and an unknown effect`,
      `Minions have +1.2.3% to Maximum ${element} Resistances`, `Companions have +3% to Maximum ${element} Resistances`,
      `+3% to Maximum ${element} Resistances`, "Minions have +3% to Maximum Chaos Resistances", "Minions have +3% to constructor"]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it("fans all maximum elemental resistance into three cap channels, never into ordinary resistance or Chaos", () => {
    const passive = node("Minions have +3% to all Maximum Elemental Resistances", "Minions have -1% to all Maximum Elemental Resistances",
      "Minions have +2% to Maximum Cold Resistances", "Minions have +20% to all Elemental Resistances");
    expect(passivePreferenceValues(passive)).toEqual({ minionMaximumFireResistance: 2, minionMaximumColdResistance: 4, minionMaximumLightningResistance: 2,
      minionFireResistance: 20, minionColdResistance: 20, minionLightningResistance: 20 });
    expect(scorePassiveNode(passive, maxima.map(([id]) => ({ id, weight: 1 })))).toBe(8);
    expect(scorePassiveNode(passive, [{ id: "minionChaosResistance", weight: 3 }])).toBe(0);
  });
  it("leaves mitigation and recovery calculations outside the scalar heuristic", () => {
    const passive = node("Minions have +30% to all Maximum Elemental Resistances", "Minions have 120% additional Physical Damage Reduction",
      "Minions Recoup 15% of Damage taken as Life", "20% increased Evasion Rating", "15% of Damage taken Recouped as Life");
    expect(passivePreferenceValues(passive)).toEqual({ minionMaximumFireResistance: 30, minionMaximumColdResistance: 30,
      minionMaximumLightningResistance: 30, minionPhysicalDamageReduction: 120, minionLifeRecoup: 15, evasion: 20, lifeRecoup: 15 });
    // Raw modifier scoring is intentionally not effective capped mitigation or healing per second.
    expect(scorePassiveNode(passive, [{ id: "minionPhysicalDamageReduction", weight: 1 }])).toBe(40);
    expect(scorePassiveNode(passive, [{ id: "minionLifeRecoup", weight: 1 }])).toBe(5);
    expect(scorePassiveNode(passive, [])).toBe(0);
  });
  it("preserves manual settings without changing suggestions in any focus", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "skeletal-cleric", supportGemIds: ["rapid-casting-ii"],
      preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node("Minions have 12% additional Physical Damage Reduction", "Minions Recoup 15% of Damage taken as Life");
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] }, preset).preferences
        .filter((p) => ids.some((id) => id === p.id)), preset.id).toEqual([]);
    }
  });
  it("matches the current graph inventory while counting multi-effect nodes and all-elemental wording accurately", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0]));
    let occurrences = 0, affectedNodes = 0;
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      const values = passivePreferenceValues(n);
      if (ids.some((id) => Object.hasOwn(values, id))) affectedNodes++;
      for (const id of ids) if (Object.hasOwn(values, id)) counts[id]++;
      for (const line of n.stats) if (ids.some((id) => Object.hasOwn(passivePreferenceValues(node(line)), id))) occurrences++;
    }
    expect(counts).toEqual({ minionEvasion: 2, minionPhysicalDamageReduction: 4, minionLifeRecoup: 2,
      minionMaximumFireResistance: 4, minionMaximumColdResistance: 4, minionMaximumLightningResistance: 4 });
    expect(occurrences).toBe(16);
    expect(affectedNodes).toBe(15);
    expect(passivePreferenceValues(graph.nodes["4407"])).toEqual({ minionPhysicalDamageReduction: 12, minionEvasion: 25 });
    expect(passivePreferenceValues(graph.nodes["20388"]).minionLifeRecoup).toBe(15);
    expect(passivePreferenceValues(graph.nodes["61026"])).toMatchObject({ minionMaximumFireResistance: 5,
      minionMaximumColdResistance: 5, minionMaximumLightningResistance: 5, minionFireResistance: 20, minionColdResistance: 20, minionLightningResistance: 20 });
  });
});

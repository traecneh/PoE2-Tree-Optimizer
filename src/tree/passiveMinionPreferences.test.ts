import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceCatalog, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const modifiers = [["minionCriticalChance", "Critical Hit Chance", 15], ["minionCriticalDamageBonus", "Critical Damage Bonus", 10],
  ["minionAreaOfEffect", "Area of Effect", 10], ["minionMovementSpeed", "Movement Speed", 5]] as const;
const resistances = [["minionFireResistance", "Fire"], ["minionColdResistance", "Cold"],
  ["minionLightningResistance", "Lightning"], ["minionChaosResistance", "Chaos"]] as const;
const ids = [...modifiers.map(([id]) => id), ...resistances.map(([id]) => id)];

describe("unconditional minion preferences", () => {
  it.each(modifiers)("scores signed %s exactly once without player inheritance", (id, wording, scale) => {
    const passive = node(`  MINIONS have 12.5% INCREASED ${wording}  `, `Minions have 20% reduced ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-15 / scale);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`Minions have 0% increased ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`Minions have 10% increased ${wording}`, `Minions have 10% reduced ${wording}`))).toEqual({ [id]: 0 });
    for (const line of [`Minions have 10% increased ${wording} while on Full Life`, `Minions have 10% increased ${wording} if you've Crit Recently`,
      `Minions have 10% increased ${wording}\nwhile stationary`, `Minions have 10% increased ${wording} per Charge`,
      `Minions have 10% more ${wording}`, `Minions have 10% less ${wording}`, `Minions have +10% increased ${wording}`,
      `Minions have -10% increased ${wording}`, `Minions have 1.2.3% increased ${wording}`, `Minions have NaN% increased ${wording}`,
      `Minions have 10% increased ${wording} and an unknown effect`, `Minions have 10% increased constructor`,
      `Minions created Recently have 10% increased ${wording}`, `Companions have 10% increased ${wording}`,
      `You and your Minions have 10% increased ${wording}`]) {
      const companionId = id === "minionAreaOfEffect" ? "companionAreaOfEffect" : id === "minionMovementSpeed" ? "companionMovementSpeed" : undefined;
      expect(passivePreferenceValues(node(line)), line).toEqual(line === `Companions have 10% increased ${wording}` && companionId ? { [companionId]: 10 } : {});
      expect(scorePassiveNode(node(line), [{ id, weight: 3 }]), line).toBe(0);
    }
  });
  it.each(resistances)("scores signed %s as flat points, never an increased modifier or maximum", (id, element) => {
    const passive = node(`Minions have +12.5% to ${element} Resistance`, `Minions have -20% to ${element} Resistance`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-3);
    expect(passivePreferenceValues(node(`Minions have +0% to ${element} Resistance`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`Minions have +10% to ${element} Resistance`, `Minions have -10% to ${element} Resistance`))).toEqual({ [id]: 0 });
    for (const line of [`Minions have +10% to Maximum ${element} Resistances`, `Minions have 10% increased ${element} Resistance`,
      `Minions have 10% reduced ${element} Resistance`, `Minions have 10% to ${element} Resistance`,
      `Minions have +10% to ${element} Resistance while on Full Life`, `Minions have +10% to ${element} Resistance per Charge`,
      `Minions have +10% to ${element} Resistance and an unknown effect`, `Minions have +1.2.3% to ${element} Resistance`,
      `Minions have +10% to ${element} Resistance\nwhile stationary`, `Companions have +10% to ${element} Resistance`,
      `+10% to ${element} Resistance`, `Minions have +10% to constructor`]) {
      const maximumIds = { Fire: "minionMaximumFireResistance", Cold: "minionMaximumColdResistance", Lightning: "minionMaximumLightningResistance" } as const;
      const maximumId = element === "Chaos" ? undefined : maximumIds[element];
      const companionIds = { Fire: "companionFireResistance", Cold: "companionColdResistance", Lightning: "companionLightningResistance", Chaos: "companionChaosResistance" } as const;
      const playerIds = { Fire: "fireResistance", Cold: "coldResistance", Lightning: "lightningResistance", Chaos: "chaosResistance" } as const;
      const expected = line === `Minions have +10% to Maximum ${element} Resistances` && maximumId ? { [maximumId]: 10 }
        : line === `Companions have +10% to ${element} Resistance` ? { [companionIds[element]]: 10 }
        : line === `+10% to ${element} Resistance` ? { [playerIds[element]]: 10 } : {};
      expect(passivePreferenceValues(node(line)), line).toEqual(expected);
      expect(scorePassiveNode(node(line), [{ id, weight: 3 }]), line).toBe(0);
    }
  });
  it("fans all Elemental Resistances into only three selected resistance channels, once each", () => {
    const passive = node("Minions have +20% to all Elemental Resistances", "Minions have -5% to all Elemental Resistances",
      "Minions have +7% to Cold Resistance", "Minions have -3% to Chaos Resistance");
    expect(passivePreferenceValues(passive)).toEqual({ minionFireResistance: 15, minionColdResistance: 22, minionLightningResistance: 15, minionChaosResistance: -3 });
    expect(scorePassiveNode(passive, [{ id: "minionColdResistance", weight: 1 }])).toBe(4.4);
    expect(scorePassiveNode(passive, [{ id: "minionFireResistance", weight: 1 }, { id: "minionColdResistance", weight: 1 },
      { id: "minionLightningResistance", weight: 1 }, { id: "minionChaosResistance", weight: 1 }])).toBeCloseTo(9.8);
    expect(passivePreferenceValues(node("Minions have +5% to all Maximum Elemental Resistances", "Minions have 0% to Chaos Resistance",
      "Minions have +10% to all Resistances", "Minions have +10% to Fire and Cold Resistances", "Minions have 10% increased Elemental Resistances")))
      .toEqual({ minionMaximumFireResistance: 5, minionMaximumColdResistance: 5, minionMaximumLightningResistance: 5 });
  });
  it("keeps player, minion action speed, area damage and resistance ownership independent", () => {
    const passive = node("Minions have 15% increased Critical Hit Chance", "Minions have 10% increased Critical Damage Bonus",
      "Minions have 10% increased Area of Effect", "Minions have 5% increased Movement Speed", "Minions have +5% to Chaos Resistance",
      "30% increased Critical Hit Chance", "20% increased Critical Damage Bonus", "20% increased Area of Effect", "10% increased Movement Speed");
    expect(passivePreferenceValues(passive)).toEqual({ minionCriticalChance: 15, minionCriticalDamageBonus: 10, minionAreaOfEffect: 10,
      minionMovementSpeed: 5, minionChaosResistance: 5, criticalChance: 30, criticalDamageBonus: 20, areaOfEffect: 20, movementSpeed: 10 });
    expect(passivePreferenceValues(node("Minions have 20% increased Area Damage", "Minions have +20% to Critical Hit Chance",
      "Minions have +20% to Critical Damage Bonus", "Minions have 20% increased Movement Speed Penalty", "Minions never deal Critical Hits"))).toEqual({});
    expect(scorePassiveNode(passive, [{ id: "minionSpeed", weight: 3 }, { id: "minionAttackSpeed", weight: 3 },
      { id: "minionCastSpeed", weight: 3 }, { id: "spellAreaDamage", weight: 3 }])).toBe(0);
  });
  it("retains opt-in settings and focus/support context without changing preset suggestions", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "skeletal-arsonist", supportGemIds: ["feeding-frenzy-i"],
      preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node("Minions have 20% reduced Area of Effect", "Minions have +10% to all Elemental Resistances");
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      const defaults = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] }, preset);
      expect(defaults.preferences.filter((p) => ids.some((id) => id === p.id)), preset.id).toEqual(preset.id === "ravenous-swarm" ? [{ id: "minionAreaOfEffect", weight: 1 }] : []);
    }
    for (const id of ids) expect(passivePreferenceCatalog.find((entry) => entry.id === id)?.scale).toBeGreaterThan(0);
  });
  it("matches the reviewed current tree inventory without counting all-elemental lines three times as wording coverage", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0]));
    let occurrences = 0;
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      const values = passivePreferenceValues(n);
      for (const id of ids) if (Object.hasOwn(values, id)) counts[id]++;
      for (const stat of n.stats) if (ids.some((id) => Object.hasOwn(passivePreferenceValues(node(stat)), id))) occurrences++;
    }
    expect(counts).toEqual({ minionCriticalChance: 5, minionCriticalDamageBonus: 3, minionAreaOfEffect: 6, minionMovementSpeed: 2,
      minionFireResistance: 9, minionColdResistance: 9, minionLightningResistance: 9, minionChaosResistance: 7 });
    expect(occurrences).toBe(38);
    expect(passivePreferenceValues(graph.nodes["5777"]).minionCriticalChance).toBe(20);
    expect(passivePreferenceValues(graph.nodes["61026"])).toMatchObject({ minionFireResistance: 20, minionColdResistance: 20, minionLightningResistance: 20 });
    expect(passivePreferenceValues(graph.nodes["30554"])).not.toHaveProperty("minionChaosResistance");
  });
});

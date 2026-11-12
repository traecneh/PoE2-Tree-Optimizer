import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const modifiers = [["companionDamage", "deal", "Damage", 10], ["companionLife", "have", "maximum Life", 10],
  ["companionAttackSpeed", "have", "Attack Speed", 3], ["companionMovementSpeed", "have", "Movement Speed", 5],
  ["companionAreaOfEffect", "have", "Area of Effect", 10]] as const;
const resistances = [["companionFireResistance", "Fire"], ["companionColdResistance", "Cold"],
  ["companionLightningResistance", "Lightning"], ["companionChaosResistance", "Chaos"]] as const;
const ids = [...modifiers.map(([id]) => id), ...resistances.map(([id]) => id), "companionReservationEfficiency"] as const;

describe("Companion-specific preferences", () => {
  it.each(modifiers)("retains signed %s values without changing ownership or implying full performance", (id, verb, wording, scale) => {
    const passive = node(`  COMPANIONS ${verb} 12.5% INCREASED ${wording}  `, `Companions ${verb} 20% reduced ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-15 / scale);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`Companions ${verb} 0% increased ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`Companions ${verb} 10% increased ${wording}`, `Companions ${verb} 10% reduced ${wording}`))).toEqual({ [id]: 0 });
    for (const line of [`Companions ${verb} 20% increased ${wording} while in your Presence`, `Companions ${verb} 20% increased ${wording} per Charge`,
      `Companions ${verb} 20% increased ${wording}\nif you've Crit Recently`, `Companions ${verb} 20% increased ${wording} and an unknown effect`,
      `Companions ${verb} 20% more ${wording}`, `Companions ${verb} 20% less ${wording}`, `Companions ${verb} +20% increased ${wording}`,
      `Companions ${verb} -20% increased ${wording}`, `Companions ${verb} 1.2.3% increased ${wording}`, `Companions ${verb} NaN% increased ${wording}`,
      `Companions ${verb} 20% increased constructor`, `You and your Companions ${verb} 20% increased ${wording}`]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it.each(resistances)("keeps %s as signed flat points, not increased or maximum resistance", (id, element) => {
    const passive = node(`Companions have +12.5% to ${element} Resistance`, `Companions have -20% to ${element} Resistance`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-3);
    expect(passivePreferenceValues(node(`Companions have +0% to ${element} Resistance`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`Companions have +10% to ${element} Resistance`, `Companions have -10% to ${element} Resistance`))).toEqual({ [id]: 0 });
    for (const line of [`Companions have +10% to Maximum ${element} Resistances`, `Companions have 10% increased ${element} Resistance`,
      `Companions have 10% reduced ${element} Resistance`, `Companions have 10% to ${element} Resistance`,
      `Companions have +10% to ${element} Resistance while on Full Life`, `Companions have +10% to ${element} Resistance per Charge`,
      `Companions have +10% to ${element} Resistance\nwhile stationary`, `Companions have +10% to ${element} Resistance and an unknown effect`,
      `Companions have +1.2.3% to ${element} Resistance`, `+10% to ${element} Resistance`, `Companions have +10% to constructor`]) {
      const playerIds = { Fire: "fireResistance", Cold: "coldResistance", Lightning: "lightningResistance", Chaos: "chaosResistance" } as const;
      expect(passivePreferenceValues(node(line)), line).toEqual(line === `+10% to ${element} Resistance` ? { [playerIds[element]]: 10 } : {});
      expect(scorePassiveNode(node(line), [{ id, weight: 3 }]), line).toBe(0);
    }
  });
  it("retains efficiency reductions as penalties without treating them as Spirit, costs, more efficiency or Companion limits", () => {
    const passive = node("25% increased Reservation Efficiency of Companion Skills", "20% reduced Reservation Efficiency of Companion Skills");
    expect(passivePreferenceValues(passive)).toEqual({ companionReservationEfficiency: 5 });
    expect(scorePassiveNode(passive, [{ id: "companionReservationEfficiency", weight: 2 }])).toBe(2);
    expect(scorePassiveNode(node("25% reduced Reservation Efficiency of Companion Skills"), [{ id: "companionReservationEfficiency", weight: 3 }])).toBe(-15);
    expect(passivePreferenceValues(node("0% increased Reservation Efficiency of Companion Skills"))).toEqual({ companionReservationEfficiency: 0 });
    expect(passivePreferenceValues(node("20% increased Reservation Efficiency of Companion Skills", "20% reduced Reservation Efficiency of Companion Skills"))).toEqual({ companionReservationEfficiency: 0 });
    expect(passivePreferenceValues(node("20% more Reservation Efficiency of Companion Skills", "20% less Reservation Efficiency of non-Companion Skills",
      "20% increased Reservation Efficiency of Companion Skills while on Full Life", "20% reduced Reservation of Companion Skills", "+20 to Spirit",
      "Companions have 20% increased Reservation Efficiency", "You can have two Companions of different types\n30% more Reservation Efficiency of Companion Skills\n20% less Reservation Efficiency of non-Companion Skills"))).toEqual({});
  });
  it("keeps Companion-only, broader minion and player lines in their own channels without copying a line", () => {
    const passive = node("Companions deal 10% increased Damage", "Companions have 10% increased maximum Life", "Companions have 3% increased Attack Speed",
      "Companions have 5% increased Movement Speed", "Companions have 10% increased Area of Effect", "Companions have +5% to Chaos Resistance",
      "5% increased Reservation Efficiency of Companion Skills", "Minions deal 20% increased Damage", "Minions have 20% increased maximum Life",
      "Minions have 6% increased Attack Speed", "10% increased Reservation Efficiency of Minion Skills", "30% increased Attack Damage", "30% increased maximum Life");
    expect(passivePreferenceValues(passive)).toEqual({ companionDamage: 10, companionLife: 10, companionAttackSpeed: 3, companionMovementSpeed: 5,
      companionAreaOfEffect: 10, companionChaosResistance: 5, companionReservationEfficiency: 5, minionDamage: 20, minionLife: 20,
      minionSpeed: 6, minionAttackSpeed: 6, minionReservationEfficiency: 10, attackDamage: 30, life: 30 });
    expect(scorePassiveNode(node("Companions deal 10% increased Damage", "Companions have 3% increased Attack Speed", "Companions have 10% increased maximum Life"),
      [{ id: "minionDamage", weight: 3 }, { id: "minionLife", weight: 3 }, { id: "minionAttackSpeed", weight: 3 }, { id: "attackDamage", weight: 3 }, { id: "life", weight: 3 }])).toBe(0);
    expect(scorePassiveNode(node("Minions deal 20% increased Damage", "20% increased Attack Damage", "20% increased Reservation Efficiency of Minion Skills"),
      [{ id: "companionDamage", weight: 3 }, { id: "companionReservationEfficiency", weight: 3 }])).toBe(0);
  });
  it("fans all-elemental resistance into selected Companion elements once, not Chaos, minion or player channels", () => {
    const passive = node("Companions have +20% to all Elemental Resistances", "Companions have -5% to all Elemental Resistances",
      "Companions have +7% to Cold Resistance", "Companions have -3% to Chaos Resistance");
    expect(passivePreferenceValues(passive)).toEqual({ companionFireResistance: 15, companionColdResistance: 22, companionLightningResistance: 15, companionChaosResistance: -3 });
    expect(scorePassiveNode(passive, [{ id: "companionColdResistance", weight: 1 }])).toBe(4.4);
    expect(scorePassiveNode(passive, resistances.map(([id]) => ({ id, weight: 1 })))).toBeCloseTo(9.8);
    expect(scorePassiveNode(passive, [{ id: "minionFireResistance", weight: 3 }, { id: "minionColdResistance", weight: 3 }, { id: "minionChaosResistance", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node("Companions have +5% to all Maximum Elemental Resistances", "Companions have 0% to Chaos Resistance",
      "Companions have +10% to all Resistances", "Companions have +10% to Fire and Cold Resistances"))).toEqual({});
  });
  it("does not infer Presence conditions, transfers, damage-as-extra, flask sharing, ailments, buffs or Cast Speed", () => {
    expect(passivePreferenceValues(node("10% increased Damage while your Companion is in your Presence", "Companions deal 60% increased damage against Immobilised enemies",
      "10% increased Armour, Evasion and Energy Shield while your Companion is in your Presence", "Companions gain 4% Damage as extra Chaos Damage",
      "Companions gain 4% Damage as extra Cold Damage", "Increases and Reductions to Companion Damage also apply to you", "Companions gain your Strength",
      "Life Recovery from your Flasks also applies to your Companions", "Companions have 50% chance to gain Onslaught on Kill", "Companions have a 40% chance to Poison on Hit",
      "5% of Damage from Hits is taken from your Damageable Companion's Life before you", "Companions in your Presence have Onslaught while you are Shapeshifted",
      "Companions have 20% increased Cast Speed", "Companions have 20% increased Attack and Cast Speed", "Minions Revive 35% faster if all your Minions are Companions"))).toEqual({});
  });
  it("preserves manual choices and limits Companion suggestions to reviewed Rhoa and Wolf components", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId: "skeletal-sniper",
      supportGemIds: ["feeding-frenzy-ii"], preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node("Companions deal 20% increased Damage", "Companions have +10% to all Elemental Resistances");
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] }, preset).preferences
        .filter((p) => ids.some((id) => id === p.id)), preset.id).toEqual(["rhoa-mount","wolf-pack"].includes(preset.id)
          ? [{ id: "companionAttackSpeed", weight: 2 },{ id: "companionDamage", weight: 3 },{ id: "companionLife", weight: 2 },{ id: "companionMovementSpeed", weight: 1 }] : []);
    }
  });
  it("matches the reviewed inventory without triple-counting all-elemental wording coverage or admitting conditionals", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0]));
    let occurrences = 0, affectedNodes = 0;
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      const values = passivePreferenceValues(n);
      if (ids.some((id) => Object.hasOwn(values, id))) affectedNodes++;
      for (const id of ids) if (Object.hasOwn(values, id)) counts[id]++;
      for (const line of n.stats) if (ids.some((id) => Object.hasOwn(passivePreferenceValues(node(line)), id))) occurrences++;
    }
    expect(counts).toEqual({ companionDamage: 16, companionLife: 14, companionAttackSpeed: 2, companionMovementSpeed: 3,
      companionAreaOfEffect: 4, companionFireResistance: 5, companionColdResistance: 5, companionLightningResistance: 5, companionChaosResistance: 1, companionReservationEfficiency: 3 });
    expect(occurrences).toBe(48);
    expect(affectedNodes).toBe(44);
    expect(passivePreferenceValues(graph.nodes["33585"])).toEqual({ companionFireResistance: 30, companionColdResistance: 30, companionLightningResistance: 30, companionChaosResistance: 30 });
    expect(passivePreferenceValues(graph.nodes["8789"])).toEqual({ companionDamage: 12, companionLife: 12 });
    expect(passivePreferenceValues(graph.nodes["41861"])).toEqual({});
  });
});

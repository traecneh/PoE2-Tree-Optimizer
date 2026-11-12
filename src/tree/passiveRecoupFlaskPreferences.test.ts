import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceCatalog, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const recoupCases = [["lifeRecoup", "Life"], ["manaRecoup", "Mana"], ["energyShieldRecoup", "Energy Shield"]] as const;
const chargeCases = [["flaskChargesGained", "Flask"], ["lifeFlaskChargesGained", "Life Flask"], ["manaFlaskChargesGained", "Mana Flask"]] as const;
const generationCases = [["lifeFlaskChargeGeneration", "Life"], ["manaFlaskChargeGeneration", "Mana"]] as const;
const ids = [...recoupCases, ...chargeCases, ...generationCases].map(([id]) => id);

describe("unconditional recoup and flask charge preferences", () => {
  it.each(recoupCases)("adds literal %s percentages once, without inventing increased/reduced recoup", (id, pool) => {
    const passive = node(`  2.5% of Damage taken Recouped as ${pool.toUpperCase()}  `, `3% of Damage taken Recouped as ${pool}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: 5.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 3 }])).toBeCloseTo(5.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`0% of Damage taken Recouped as ${pool}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceCatalog.find((p) => p.id === id)?.scale).toBe(3);
    for (const line of [`10% of Damage taken Recouped as ${pool} while Channelling`, `Minions Recoup 10% of Damage taken as ${pool}`,
      `10% of Physical Damage taken Recouped as ${pool}`, `10% of Elemental Damage taken Recouped as ${pool}`,
      `10% of Damage taken from Deflected Hits Recouped as ${pool}`, `10% of Physical Damage prevented Recouped as ${pool}`,
      `10% of Damage taken Recouped as ${pool}\nwhile stationary`, `10% increased ${pool} Recoup`, `10% reduced ${pool} Recoup`,
      `+10% of Damage taken Recouped as ${pool}`, `-10% of Damage taken Recouped as ${pool}`, `1.2.3% of Damage taken Recouped as ${pool}`,
      `.5% of Damage taken Recouped as ${pool}`, `10% of Damage taken Recouped as ${pool} and an unknown effect`]) {
      expect(passivePreferenceValues(node(line)), line).toEqual(line === "Minions Recoup 10% of Damage taken as Life" ? { minionLifeRecoup: 10 } : {});
      expect(scorePassiveNode(node(line), [{ id, weight: 3 }]), line).toBe(0);
    }
  });
  it.each(chargeCases)("keeps %s modifiers signed and separate from recovery, flat generation and charge costs", (id, flask) => {
    const passive = node(`12.5% increased ${flask.toUpperCase()} Charges gained`, `20% reduced ${flask} Charges gained`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`10% increased ${flask} Charges gained`, `10% reduced ${flask} Charges gained`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`0% increased ${flask} Charges gained`))).toEqual({ [id]: 0 });
    expect(passivePreferenceCatalog.find((p) => p.id === id)?.scale).toBe(10);
    for (const line of [`10% increased ${flask} Charges gained while stationary`, `10% increased ${flask} Charges gained from Kills`,
      `Minions have 10% increased ${flask} Charges gained`, `10% increased ${flask} Charges gained\nif you've Crit Recently`,
      `10% more ${flask} Charges gained`, `10% less ${flask} Charges gained`, `10% reduced ${flask} Charges used while stationary`,
      `1.2.3% increased ${flask} Charges gained`, `NaN% increased ${flask} Charges gained`, `+10% increased ${flask} Charges gained`,
      `10% increased ${flask} Charges gained and an unknown effect`]) expect(passivePreferenceValues(node(line)), line).toEqual({});
  });
  it.each(generationCases)("keeps %s in charges per second, without percentage conversion or conditional generation", (id, pool) => {
    const passive = node(`  ${pool.toUpperCase()} Flasks gain 0.15 charges per Second  `, `${pool} Flasks gain 0.1 charge per Second`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: 0.25 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBeCloseTo(5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`${pool} Flasks gain 0 charges per Second`))).toEqual({ [id]: 0 });
    expect(passivePreferenceCatalog.find((p) => p.id === id)?.scale).toBe(0.1);
    for (const line of [`${pool} Flasks gain 0.1 charges per Second while stationary`, `${pool} Flasks gain 0.1 charges per Second\nwhile Shapeshifted`,
      `${pool} Flasks gain -0.1 charges per Second`, `${pool} Flasks gain +0.1 charges per Second`, `${pool} Flasks gain 1.2.3 charges per Second`,
      `${pool} Flasks gain .1 charges per Second`, `${pool} Flasks gain 10% charges per Second`, `${pool} Flasks gain 1 charge every 10 seconds`,
      `${pool} Flasks gain 0.1 charges per Second and an unknown effect`]) expect(passivePreferenceValues(node(line)), line).toEqual({});
  });
  it("keeps reviewed combined recoup and genuine Flask-and-Charm benefits in their own categories", () => {
    const passive = node("3% of Damage Taken Recouped as Life, Mana and Energy Shield", "2.5% of Damage taken Recouped as Life",
      "8% increased Flask and Charm Charges gained", "20% reduced Flask and Charm Charges gained");
    expect(passivePreferenceValues(passive)).toEqual({ lifeRecoup: 5.5, manaRecoup: 3, energyShieldRecoup: 3, flaskChargesGained: -12, charmChargesGained: -12 });
    expect(scorePassiveNode(passive, [{ id: "manaRecoup", weight: 2 }, { id: "energyShieldRecoup", weight: 1 }])).toBe(3);
    expect(scorePassiveNode(passive, [{ id: "flaskChargesGained", weight: 2 }])).toBeCloseTo(-2.4);
    expect(passivePreferenceValues(node("3% of Damage Taken Recouped as Life, Mana and Energy Shield while Channelling",
      "Minions have 3% of Damage Taken Recouped as Life, Mana and Energy Shield", "3% of Damage Taken Recouped as Life and Mana",
      "3% of Damage Taken Recouped as Life, Mana and Energy Shield and an unknown effect",
      "20% increased Flask and Charm Charges gained while stationary", "20% increased Flask, Charm and Unknown Charges gained"))).toEqual({});
  });
  it("keeps generic and flask-specific modifiers separate without deriving actual generation or sustain", () => {
    const passive = node("10% increased Flask Charges gained", "15% increased Life Flask Charges gained", "10% reduced Mana Flask Charges gained",
      "Life Flasks gain 0.1 charges per Second", "Mana Flasks gain 0.15 charges per Second");
    expect(passivePreferenceValues(passive)).toEqual({ flaskChargesGained: 10, lifeFlaskChargesGained: 15, manaFlaskChargesGained: -10,
      lifeFlaskChargeGeneration: 0.1, manaFlaskChargeGeneration: 0.15 });
    expect(scorePassiveNode(passive, [{ id: "lifeFlaskChargeGeneration", weight: 1 }])).toBe(1);
    expect(scorePassiveNode(passive, [{ id: "lifeFlaskRecovery", weight: 3 }, { id: "manaFlaskRecovery", weight: 3 },
      { id: "life", weight: 3 }, { id: "mana", weight: 3 }, { id: "energyShield", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node("20% increased speed of Recoup Effects", "Recoup Effects instead occur over 4 seconds",
      "10% chance for Flasks you use to not consume Charges", "20% increased Charm Charges gained", "Charms gain 0.1 charges per Second",
      "5% reduced Flask Charges used while stationary", "4% reduced Flask Charges used from Mana Flasks while stationary", "Flasks gain 0.1 charges per Second",
      "10% of Damage taken Recouped as constructor", "10% increased constructor"))).toEqual({ recoupSpeed: 20, charmChargesGained: 20, charmChargeGeneration: 0.1 });
  });
  it("retains opt-in priorities, supports and budgets but never adds them from a preset automatically", () => {
    const settings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId: "frostbolt",
      supportGemIds: ["controlled-destruction"], preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    expect(normalizePassiveOptimizationSettings({ mode: "weighted", preferences: [{ id: "energyShield", weight: 3 }] }).preferences)
      .toEqual([{ id: "energyShield", weight: 3 }]);
    const passive = node("3% of Damage Taken Recouped as Life, Mana and Energy Shield", "Life Flasks gain 0.1 charges per Second");
    expect(passivePreferenceValues(passive, settings)).toEqual(passivePreferenceValues(passive));
    for (const preset of skillPreferencePresets) {
      expect(addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 9, preferences: [] }, preset).preferences.filter((p) => ids.some((id) => id === p.id)), preset.id)
        .toEqual([]);
    }
  });
  it("matches the reviewed 0.5.5f main-tree inventory and leaves scoped mechanics unmodeled", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0]));
    const matched = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      const values = passivePreferenceValues(n);
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; matched.add(n.id); }
    }
    expect(counts).toEqual({ lifeRecoup: 24, manaRecoup: 5, energyShieldRecoup: 1, flaskChargesGained: 10, lifeFlaskChargesGained: 5,
      manaFlaskChargesGained: 1, lifeFlaskChargeGeneration: 4, manaFlaskChargeGeneration: 3 });
    expect(matched.size).toBe(51);
    expect(passivePreferenceValues(graph.nodes["23939"])).toEqual({ lifeRecoup: 3, manaRecoup: 3, energyShieldRecoup: 3 });
    expect(passivePreferenceValues(graph.nodes["20388"])).toEqual({ lifeRecoup: 6, minionLifeRecoup: 15 });
    expect(passivePreferenceValues(graph.nodes["4295"])).toEqual({ lifeRegenerationRate: -20, manaRecoup: 20 });
    expect(passivePreferenceValues(graph.nodes["46692"])).toEqual({ flaskChargesGained: 20, charmChargesGained: 20 });
    expect(passivePreferenceValues(graph.nodes["52803"])).toEqual({ lifeFlaskRecovery: 20, lifeFlaskChargeGeneration: 0.1 });
    expect(passivePreferenceValues(graph.nodes["45244"])).toEqual({ lifeFlaskChargeGeneration: 0.15 });
    expect(passivePreferenceValues(graph.nodes["46224"])).toEqual({ manaFlaskChargeGeneration: 0.1, attributes: 10 });
    expect(passivePreferenceValues(graph.nodes["1603"])).toEqual({});
    expect(passivePreferenceValues(graph.nodes["34940"])).toEqual({});
  });
});

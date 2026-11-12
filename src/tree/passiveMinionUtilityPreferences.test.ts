import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const cases = [
  ["minionCommandDamage", "Minions deal ", " Damage with Command Skills", 10],
  ["minionCommandCooldownRecovery", "Minions have ", " Cooldown Recovery Rate for Command Skills", 10],
  ["minionDuration", "", " Minion Duration", 10],
  ["minionReservationEfficiency", "", " Reservation Efficiency of Minion Skills", 5],
] as const;
const ids = cases.map(([id]) => id);

describe("minion command, duration and reservation preferences", () => {
  it.each(cases)("scores signed %s without broadening its explicit scope", (id, prefix, suffix, scale) => {
    const positive = `${prefix}12.5% increased${suffix}`;
    const negative = `${prefix}20% reduced${suffix}`;
    const passive = node(`  ${positive.toUpperCase()}  `, negative);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-15 / scale);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`${prefix}0% increased${suffix}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`${prefix}10% increased${suffix}`, `${prefix}10% reduced${suffix}`))).toEqual({ [id]: 0 });
    for (const line of [`${positive} while on Full Life`, `${positive} per Charge`, `${positive}\nif you've Crit Recently`,
      `${positive} for each different type of Persistent Minion in your Presence`, `${positive} and an unknown modifier`,
      `${prefix}20% more${suffix}`, `${prefix}20% less${suffix}`, `${prefix}+20% increased${suffix}`, `${prefix}-20% increased${suffix}`,
      `${prefix}1.2.3% increased${suffix}`, `${prefix}NaN% increased${suffix}`, `${prefix}10% increased constructor`]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it("keeps command damage and cooldown recovery separate from basic minion/player damage and action speed", () => {
    const passive = node("Minions deal 20% increased Damage with Command Skills", "Minions deal 10% increased Damage",
      "Minions have 20% reduced Cooldown Recovery Rate for Command Skills", "Minions have 3% increased Attack and Cast Speed",
      "10% increased Attack Damage", "20% increased Cooldown Recovery Rate");
    expect(passivePreferenceValues(passive)).toEqual({ minionCommandDamage: 20, minionDamage: 10, minionCommandCooldownRecovery: -20,
      minionSpeed: 6, minionAttackSpeed: 3, minionCastSpeed: 3, attackDamage: 10, cooldownRecoveryRate: 20 });
    expect(scorePassiveNode(node("Minions deal 20% increased Damage with Command Skills"), [{ id: "minionDamage", weight: 3 }, { id: "attackDamage", weight: 3 }])).toBe(0);
    expect(scorePassiveNode(node("Minions have 20% increased Cooldown Recovery Rate for Command Skills"), [{ id: "cooldownRecoveryRate", weight: 3 },
      { id: "minionAttackSpeed", weight: 3 }, { id: "minionCastSpeed", weight: 3 }])).toBe(0);
    expect(scorePassiveNode(node("Minions deal 30% increased Damage", "30% increased Cooldown Recovery Rate", "Minions have 30% increased Attack Speed"),
      [{ id: "minionCommandDamage", weight: 3 }, { id: "minionCommandCooldownRecovery", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node("Minions have 20% increased Cooldown Recovery Rate", "Minions have 20% increased Skill Speed with Command Skills",
      "20% increased Damage with Command Skills", "20% increased Cooldown Recovery Rate for Command Skills",
      "Companions deal 20% increased Damage with Command Skills", "Minions deal 10% increased Damage with Command Skills for each different type of Persistent Minion in your Presence"))).toEqual({});
  });
  it("does not turn minion lifetime into persistent uptime, revival speed, curse duration or Offering duration", () => {
    const passive = node("20% increased Minion Duration", "10% increased Skill Effect Duration", "20% increased Curse Duration");
    expect(passivePreferenceValues(passive)).toEqual({ minionDuration: 20, skillDuration: 10, curseDuration: 20 });
    expect(scorePassiveNode(node("20% increased Minion Duration"), [{ id: "skillDuration", weight: 3 }, { id: "curseDuration", weight: 3 }])).toBe(0);
    expect(scorePassiveNode(node("20% increased Skill Effect Duration"), [{ id: "minionDuration", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node("Minions Revive 20% faster", "Minions Revive 20% slower", "20% increased Persistent Minion Duration",
      "20% increased duration of Minion Commands", "Minions have 20% increased Duration", "Temporary Minion Skills have +1 to Limit of Minions summoned"))).toEqual({ minionRevivalSpeed: 0 });
  });
  it("retains reservation-efficiency penalties without treating efficiency as flat Spirit, cost reduction or more summons", () => {
    const passive = node("40% increased Reservation Efficiency of Minion Skills", "25% reduced Reservation Efficiency of Minion Skills");
    expect(passivePreferenceValues(passive)).toEqual({ minionReservationEfficiency: 15 });
    expect(scorePassiveNode(passive, [{ id: "minionReservationEfficiency", weight: 2 }])).toBe(6);
    expect(scorePassiveNode(node("25% reduced Reservation Efficiency of Minion Skills"), [{ id: "minionReservationEfficiency", weight: 3 }])).toBe(-15);
    expect(passivePreferenceValues(node("20% increased Reservation Efficiency", "20% reduced Reservation of Minion Skills", "+20 to Spirit",
      "20% increased Spirit", "20% increased Mana Cost Efficiency of Command Skills", "20% increased Reservation Efficiency of Persistent Skills",
      "20% increased Reservation Efficiency of Minion Skills while on Low Life", "Minions have 20% increased Reservation Efficiency"))).toEqual({});
  });
  it("keeps manual choices and limits temporary Minion duration suggestions to the reviewed Zombie", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId: "skeletal-sniper",
      supportGemIds: ["feeding-frenzy-ii"], preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...cases.map(([, prefix, suffix]) => `${prefix}20% increased${suffix}`));
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] }, preset).preferences
        .filter((p) => ids.some((id) => id === p.id)), preset.id).toEqual(["raise-zombie","raging-spirits","ravenous-swarm"].includes(preset.id) ? [{ id: "minionDuration", weight: 1 }] : []);
    }
  });
  it("matches the reviewed tree inventory, preserving real penalties and excluding state-dependent command bonuses", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0]));
    let occurrences = 0, affectedNodes = 0;
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      const values = passivePreferenceValues(n);
      if (ids.some((id) => Object.hasOwn(values, id))) affectedNodes++;
      for (const id of ids) if (Object.hasOwn(values, id)) counts[id]++;
      for (const line of n.stats) if (ids.some((id) => Object.hasOwn(passivePreferenceValues(node(line)), id))) occurrences++;
    }
    expect(counts).toEqual({ minionCommandDamage: 4, minionCommandCooldownRecovery: 8, minionDuration: 7, minionReservationEfficiency: 4 });
    expect(occurrences).toBe(23);
    expect(affectedNodes).toBe(23);
    expect(passivePreferenceValues(graph.nodes["46365"])).toMatchObject({ minionReservationEfficiency: -25 });
    expect(passivePreferenceValues(graph.nodes["39857"])).toMatchObject({ minionCommandDamage: 100 });
    expect(passivePreferenceValues(graph.nodes["752"])).toMatchObject({ minionDuration: 6 });
    expect(passivePreferenceValues(graph.nodes["35560"])).not.toHaveProperty("minionCommandDamage");
    expect(passivePreferenceValues(graph.nodes["64139"])).not.toHaveProperty("minionCommandDamage");
    expect(passivePreferenceValues(graph.nodes["62210"])).not.toHaveProperty("minionReservationEfficiency");
  });
});

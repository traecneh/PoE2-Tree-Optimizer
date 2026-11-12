import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const cases = [
  ["accuracy", "Accuracy Rating"], ["blockChance", "Block chance"], ["stunThreshold", "Stun Threshold"],
  ["criticalDamageBonus", "Critical Damage Bonus"], ["stunBuildup", "Stun Buildup"], ["freezeBuildup", "Freeze Buildup"],
] as const;

describe("unconditional combat modifier preferences", () => {
  it.each(cases)("retains increases/reductions/decimals for %s and only scores selected preferences", (id, wording) => {
    const passive = node(`  12.5%   increased ${wording}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBeCloseTo(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }, { id: "criticalChance", weight: 3 }, { id: "life", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`0% increased ${wording}`))).toEqual({ [id]: 0 });
  });
  it.each(cases)("rejects conditional, enemy, more/less and malformed modifiers for player %s while keeping minion ownership separate", (id, wording) => {
    const passive = node(
      `10% increased ${wording} while stationary`, `10% increased ${wording}\nwhile Shapeshifted`,
      `10% increased ${wording} if you've Blocked Recently`, `10% increased ${wording} per Power Charge`,
      `Minions have 10% increased ${wording}`, `Enemies have 10% reduced ${wording}`,
      `10% more ${wording}`, `10% less ${wording}`, `..% increased ${wording}`, `NaN% increased ${wording}`,
      `Infinity% increased ${wording}`, `-10% increased ${wording}`, `+10% increased ${wording}`,
      `10% increased ${wording} and an unknown modifier`,
    );
    expect(passivePreferenceValues(passive)).toEqual(id === "criticalDamageBonus" ? { minionCriticalDamageBonus: 10 } : {});
    expect(scorePassiveNode(passive, [{ id, weight: 3 }])).toBe(0);
  });
  it("keeps matching weapon accuracy separate from flat, other-weapon, block and threshold mechanics", () => {
    expect(passivePreferenceValues(node("+30 to Accuracy Rating", "10% increased Accuracy Rating with Bows",
      "25% increased Accuracy Rating with Quarterstaves", "25% increased Accuracy Rating with Spears",
      "16% increased Accuracy Rating at Close Range", "30% increased penalty to Accuracy Rating at range",
      "+2% to maximum Block chance", "+4% to Block chance", "10 Life gained when you Block", "10% increased Spell Block chance",
      "Gain additional Stun Threshold equal to 12% of maximum Energy Shield", "Stun Threshold is based on 30% of your Energy Shield instead of Life",
      "20% increased Enemy Stun Threshold", "20% increased Projectile Stun Buildup", "20% increased Stun Recovery while stationary", "Cannot be Stunned",
      "10% increased Stun Threshold while Parrying", "Every Rage also grants 2% increased Stun Threshold",
    ), { focusSkillId: "ice-strike" })).toEqual({ accuracy: 25 });
  });
  it("does not mix outgoing critical/buildup stats with scoped, incoming, flat, duration or conversion effects", () => {
    const passive = node("+20% to Critical Damage Bonus", "20% increased Critical Damage Bonus with Quarterstaves",
      "20% increased Critical Damage Bonus for Attack Damage", "Invocation Spells have 50% increased Critical Damage Bonus",
      "Hits against you have 25% reduced Critical Damage Bonus", "Minions have 40% increased Critical Damage Bonus",
      "Critical Damage Bonus vs full life enemies@100%", "Minions cause 15% increased Stun Buildup",
      "30% increased Stun Buildup with Quarterstaves", "20% increased Freeze Buildup with Quarterstaves",
      "30% increased Stun Buildup with Melee Damage", "20% increased Freeze Buildup with Empowered Attacks",
      "Parry has 25% increased Stun Buildup", "20% increased Stun Duration on Enemies", "20% reduced Freeze Duration on you",
      "Your Heavy Stun buildup empties 50% faster", "Modifiers to Stun Buildup apply to Freeze Buildup instead for Glacial Cascade",
      "Cannot inflict Freeze", "Your Critical Hits do not deal extra Damage");
    expect(passivePreferenceValues(passive)).toEqual({ minionCriticalDamageBonus: 40 });
    expect(passivePreferenceValues(passive, { focusSkillId: "ice-strike" })).toEqual({ minionCriticalDamageBonus: 40, criticalDamageBonus: 40, stunBuildup: 60, freezeBuildup: 20 });
    expect(scorePassiveNode(passive, [{ id: "criticalDamageBonus", weight: 3 }, { id: "stunBuildup", weight: 3 }, { id: "freezeBuildup", weight: 3 }])).toBe(0);
  });
  it("keeps critical damage and both buildup rewards independent of chance, resistance and elemental damage", () => {
    const passive = node("20% increased Critical Damage Bonus", "10% reduced Critical Damage Bonus",
      "35% increased Stun Buildup", "5% reduced Stun Buildup", "35% increased Freeze Buildup", "15% reduced Freeze Buildup");
    expect(passivePreferenceValues(passive)).toEqual({ criticalDamageBonus: 10, stunBuildup: 30, freezeBuildup: 20 });
    expect(scorePassiveNode(passive, [{ id: "criticalDamageBonus", weight: 3 }, { id: "stunBuildup", weight: 2 }, { id: "freezeBuildup", weight: 1 }])).toBe(11);
    expect(scorePassiveNode(passive, [{ id: "criticalChance", weight: 3 }, { id: "stunThreshold", weight: 3 }, { id: "coldDamage", weight: 3 }])).toBe(0);
  });
  it("sums independent real effects once rather than treating modifier percentages as final probability", () => {
    const passive = node("10% increased Accuracy Rating", "20% reduced Accuracy Rating", "30% increased Block chance", "16% increased Stun Threshold", "12% increased Armour");
    expect(passivePreferenceValues(passive)).toEqual({ accuracy: -10, blockChance: 30, stunThreshold: 16, armour: 12 });
    expect(scorePassiveNode(passive, [{ id: "accuracy", weight: 1 }, { id: "blockChance", weight: 1 }, { id: "stunThreshold", weight: 1 }])).toBeCloseTo(3.6);
  });
  it("preserves opt-in priorities across focus/support contexts without selecting them automatically", () => {
    const preferences = cases.map(([id], i) => ({ id, weight: i % 3 + 1 }));
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "fireball", supportGemIds: ["controlled-destruction"], preferences };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    expect(normalizePassiveOptimizationSettings({ mode: "weighted", preferences: [{ id: "attackDamage", weight: 3 }] }).preferences).toEqual([{ id: "attackDamage", weight: 3 }]);
    const passive = node(...cases.map(([, wording]) => `10% increased ${wording}`));
    expect(passivePreferenceValues(passive, settings)).toEqual(passivePreferenceValues(passive));
  });
  it("matches the reviewed 0.5.5f main-tree batches including Frantic Reach and Careful Assassin penalties", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(cases.map(([id]) => [id, 0]));
    const ids = new Set<string>();
    for (const passive of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      const values = passivePreferenceValues(passive);
      for (const [id] of cases) if (Object.hasOwn(values, id)) { counts[id] += 1; ids.add(passive.id); }
    }
    expect(counts).toEqual({ accuracy: 53, blockChance: 51, stunThreshold: 43, criticalDamageBonus: 39, stunBuildup: 48, freezeBuildup: 47 });
    expect(ids.size).toBe(271);
    expect(passivePreferenceValues(graph.nodes["39911"], { focusSkillId: "lightning-arrow" })).toEqual({ areaOfEffect: 18, accuracy: -20 });
    expect(passivePreferenceValues(graph.nodes["19104"])).toEqual({ accuracy: 10 });
    expect(passivePreferenceValues(graph.nodes["6133"])).toEqual({ blockChance: 30, energyShield: -20 });
    expect(passivePreferenceValues(graph.nodes["25429"])).toEqual({ skillDuration: 16, stunThreshold: 16 });
    expect(passivePreferenceValues(graph.nodes["22967"])).toEqual({ blockChance: 12 });
    expect(passivePreferenceValues(graph.nodes["46197"])).toEqual({ criticalDamageBonus: -20, criticalChance: 50 });
    expect(passivePreferenceValues(graph.nodes["56265"])).toEqual({ criticalDamageBonus: 60, criticalChance: -20 });
    expect(passivePreferenceValues(graph.nodes["28329"])).toEqual({ stunBuildup: 35, freezeBuildup: 35 });
    expect(passivePreferenceValues(graph.nodes["3700"])).toEqual({ stunBuildup: 15, freezeBuildup: 15 });
    expect(passivePreferenceValues(graph.nodes["28267"])).toEqual({ criticalDamageBonus: 25 });
    expect(passivePreferenceValues(graph.nodes["64327"])).toEqual({ blockChance: 12 });
    expect(passivePreferenceValues(graph.nodes["47270"])).toEqual({ freezeBuildup: 40, freezeDuration: 20 });
    expect(passivePreferenceValues(graph.nodes["34316"], { focusSkillId: "ice-strike" })).toEqual({ dazeChance: 10, stunBuildup: 30, freezeBuildup: 30 });
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const modifiers = [["stunRecovery", "Stun Recovery"], ["presenceArea", "Presence Area of Effect"],
  ["lifeLeechAmount", "amount of Life Leeched"], ["manaLeechAmount", "amount of Mana Leeched"]] as const;
const costs = [["flaskChargeCostReduction", "Flask Charges used"], ["manaFlaskChargeCostReduction", "Flask Charges used from Mana Flasks"]] as const;
const ids = [...modifiers, ...costs].map(([id]) => id);
const allIds = [...ids, "skillMovementPenaltyReduction", "lifeLeechSpeed"] as const;

describe("unconditional utility and recovery preferences", () => {
  it.each(modifiers)("keeps %s increases/reductions signed without granting actual recovery or area benefits", (id, wording) => {
    const passive = node(`  12.5% increased ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`0% increased ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`))).toEqual({ [id]: 0 });
    for (const line of [`10% increased ${wording} while Shapeshifted`, `10% increased ${wording} if you've Crit Recently`,
      `10% increased ${wording}\nwhile stationary`, `Minions have 10% increased ${wording}`, `Enemies have 10% reduced ${wording}`,
      `10% increased ${wording} per Charge`, `10% more ${wording}`, `10% less ${wording}`, `1.2.3% increased ${wording}`,
      `NaN% increased ${wording}`, `+10% increased ${wording}`, `-10% increased ${wording}`, `10% increased ${wording} and an unknown effect`]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it.each(costs)("inverts the %s cost modifier, never mixing it with generation or recovery", (id, wording) => {
    const passive = node(`12.5% reduced ${wording}`, `20% increased ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 3 }])).toBe(-2.25);
    expect(scorePassiveNode(node(`10% reduced ${wording}`), [{ id, weight: 2 }])).toBe(2);
    expect(passivePreferenceValues(node(`10% reduced ${wording}`, `10% increased ${wording}`))).toEqual({ [id]: 0 });
    for (const line of [`10% reduced ${wording} while stationary`, `10% less ${wording}`, `10% more ${wording}`,
      `Minions have 10% reduced ${wording}`, `1.2.3% reduced ${wording}`, `10% reduced ${wording} and an unknown effect`]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it("rewards only the reviewed generic skill-use penalty reduction, not global movement or scoped alternatives", () => {
    const passive = node("  2.5% REDUCED Movement Speed Penalty from using Skills while moving  ", "5% reduced Movement Speed Penalty from using Skills while moving");
    expect(passivePreferenceValues(passive)).toEqual({ skillMovementPenaltyReduction: 7.5 });
    expect(scorePassiveNode(passive, [{ id: "skillMovementPenaltyReduction", weight: 2 }])).toBe(1.5);
    expect(scorePassiveNode(passive, [{ id: "movementSpeed", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node("0% reduced Movement Speed Penalty from using Skills while moving"))).toEqual({ skillMovementPenaltyReduction: 0 });
    expect(passivePreferenceValues(node("10% increased Movement Speed Penalty from using Skills while moving",
      "10% less Movement Speed Penalty from using Skills while moving", "5% reduced Movement Speed Penalty from using Fire Skills while moving",
      "5% reduced Movement Speed Penalty from using Cold Skills while moving", "10% reduced Movement Speed Penalty while Actively Blocking",
      "10% reduced Movement Speed Penalty from using Skills while moving if you've Crit Recently",
      "1.2.3% reduced Movement Speed Penalty from using Skills while moving", "-10% reduced Movement Speed Penalty from using Skills while moving"))).toEqual({});
  });
  it("keeps Life leech delivery speed separate from amount and retains slower-leech penalties", () => {
    const passive = node("Leech Life 12.5% faster", "Leech Life 20% slower", "35% increased amount of Life Leeched");
    expect(passivePreferenceValues(passive)).toEqual({ lifeLeechSpeed: -7.5, lifeLeechAmount: 35 });
    expect(scorePassiveNode(passive, [{ id: "lifeLeechSpeed", weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [{ id: "lifeLeechAmount", weight: 1 }])).toBe(3.5);
    expect(passivePreferenceValues(node("Leech Life 10% faster", "Leech Life 10% slower"))).toEqual({ lifeLeechSpeed: 0 });
    expect(passivePreferenceValues(node("Leech Life 5% faster while Shapeshifted", "Leech Mana 10% faster", "Leech Life 67% less quickly",
      "20% increased total Recovery per second from Life Leech", "Minions Leech Life 10% faster", "Leech Life 1.2.3% faster"))).toEqual({});
  });
  it("keeps slow protection separate from ownership, immunity, gear conversions and recoup-speed effects", () => {
    expect(passivePreferenceValues(node("Cannot be Stunned", "20% increased Stun and Block Recovery", "20% reduced Enemy Stun Recovery",
      "20% increased Presence Radius", "20% increased Area of Effect of Presence Skills", "20% increased Minion Presence Area of Effect",
      "20% reduced Slowing Potency of Debuffs on You", "20% increased speed of Recoup Effects",
      "50% more amount of Life Leeched\nLeech Life 67% less quickly\nCannot Recover Life other than from Leech",
      "Leeching Life from your Hits causes your Companion to also Leech the same amount of Life",
      "20% increased amount of Life and Mana Leeched", "Life Leech is instant", "5% reduced Flask Charges used from Life Flasks",
      "10% reduced Charm Charges used", "10% reduced constructor"))).toEqual({ slowPotencyReduction: 20, recoupSpeed: 20, charmChargeCostReduction: 10 });
  });
  it("keeps Presence area, global area and enemy/minion effects independent", () => {
    const passive = node("20% increased Area of Effect", "15% reduced Presence Area of Effect", "40% increased Presence Area of Effect while stationary");
    expect(passivePreferenceValues(passive)).toEqual({ areaOfEffect: 20, presenceArea: -15 });
    expect(scorePassiveNode(passive, [{ id: "presenceArea", weight: 2 }])).toBe(-3);
    expect(scorePassiveNode(passive, [{ id: "areaOfEffect", weight: 1 }])).toBe(2);
  });
  it("retains opt-in settings across contexts without adding preferences automatically", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "fireball", supportGemIds: ["controlled-destruction"],
      preferences: allIds.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node("10% increased Presence Area of Effect", "5% reduced Movement Speed Penalty from using Skills while moving");
    expect(passivePreferenceValues(passive, settings)).toEqual(passivePreferenceValues(passive));
    for (const preset of skillPreferencePresets) {
      expect(addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] }, preset).preferences
        .filter((p) => allIds.some((id) => id === p.id)), preset.id).toEqual(["grim-feast","overwhelming-presence","withering-presence","alchemists-boon"].includes(preset.id) ? [{ id: "presenceArea", weight: 2 }] : preset.id === "attrition" ? [{ id: "presenceArea", weight: 1 }] : ["plague-bearer","mantra-of-destruction","savage-fury","arctic-howl"].includes(preset.id) ? [{ id: "skillMovementPenaltyReduction", weight: 1 }] : []);
    }
  });
  it("matches the reviewed 0.5.5f inventory, retaining real node penalties", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(allIds.map((id) => [id, 0]));
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      const values = passivePreferenceValues(n);
      for (const id of allIds) if (Object.hasOwn(values, id)) counts[id]++;
    }
    expect(counts).toEqual({ stunRecovery: 8, presenceArea: 34, skillMovementPenaltyReduction: 17,
      lifeLeechAmount: 20, manaLeechAmount: 14, lifeLeechSpeed: 7, flaskChargeCostReduction: 1, manaFlaskChargeCostReduction: 5 });
    expect(passivePreferenceValues(graph.nodes["11463"])).toEqual({ presenceArea: -25 });
    expect(passivePreferenceValues(graph.nodes["18397"])).toEqual({ lifeLeechAmount: 35, lifeLeechSpeed: -20 });
    expect(passivePreferenceValues(graph.nodes["16329"])).toEqual({ flaskChargeCostReduction: 5 });
    expect(passivePreferenceValues(graph.nodes["47418"])).toEqual({ manaFlaskChargeCostReduction: 10 });
  });
});

import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import type { TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "node", stats, flags: {}, position: { x: 0, y: 0 } });

describe("passive preferences", () => {
  it("scores explicit effects with priorities and consistent normalization", () => {
    expect(scorePassiveNode(node("12% increased maximum Energy Shield", "+5 to any Attribute"), [
      { id: "energyShield", weight: 2 }, { id: "attributes", weight: 1 },
    ])).toBe(3);
    expect(scorePassiveNode(node("+10 to maximum Life", "3% increased maximum Life"), [{ id: "life", weight: 1 }])).toBe(2);
  });
  it("does not mistake minion life, conditionals, conversions, or names for player bonuses", () => {
    expect(passivePreferenceValues(node(
      "Minions have 10% increased maximum Life", "30% increased maximum Energy Shield if you've consumed a Power Charge Recently",
      "Gain 50% of maximum Energy Shield as additional Freeze Threshold", "30% increased Armour and Evasion Rating while stationary",
      "30% increased maximum Energy Shield\nif you've consumed a Power Charge Recently",
    ))).toEqual({});
  });
  it("handles combined explicit effects, negative effects and each attribute once", () => {
    expect(passivePreferenceValues(node("8% increased Attack and Cast Speed"))).toEqual({ attackSpeed: 8, castSpeed: 8 });
    expect(passivePreferenceValues(node("3% increased maximum Life, Mana and Energy Shield", "+10 to Strength and Dexterity", "20% reduced maximum Energy Shield")))
      .toEqual({ life: 3, mana: 3, energyShield: -17, attributes: 20 });
    expect(passivePreferenceValues(node("Minions have 3% increased Attack and Cast Speed", "Minions have 15% reduced Attack Speed")))
      .toEqual({ minionSpeed: -9 });
  });
  it("normalizes unknown, duplicate, invalid and unbounded settings", () => {
    expect(normalizePassiveOptimizationSettings({ mode: "weighted", extraPointBudget: -5, preferences: [
      { id: "life", weight: 2 }, { id: "life", weight: 3 }, { id: "bogus", weight: 1 }, { id: "mana", weight: Infinity },
    ] })).toEqual({ mode: "weighted", extraPointBudget: 0, preferences: [{ id: "life", weight: 3 }] });
  });
});

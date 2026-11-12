import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const ids = ["charmChargesGained", "charmChargeGeneration", "charmChargeCostReduction", "charmEffectDuration"] as const;
const lines = ["10% increased Charm Charges gained", "Charms gain 0.1 charges per Second", "10% reduced Charm Charges used", "10% increased Charm Effect Duration"];
const flaskIds = ["flaskChargesGained", "lifeFlaskChargesGained", "manaFlaskChargesGained", "lifeFlaskChargeGeneration", "manaFlaskChargeGeneration",
  "flaskChargeCostReduction", "manaFlaskChargeCostReduction", "flaskEffectDuration", "lifeFlaskRecovery", "manaFlaskRecovery", "skillDuration"] as const;

describe("Charm charge gain, generation, cost and duration preferences", () => {
  it.each([
    ["charmChargesGained", "12.5% increased Charm Charges gained", "20% reduced Charm Charges gained"],
    ["charmChargeCostReduction", "12.5% reduced Charm Charges used", "20% increased Charm Charges used"],
    ["charmEffectDuration", "12.5% increased Charm Effect Duration", "20% reduced Charm Effect Duration"],
  ] as const)("keeps signed %s opt-in without deriving actual costs or uptime", (id, positive, negative) => {
    const passive = node(`  ${positive.toUpperCase().replaceAll(" ", "   ")}  `, negative);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(positive.replace("12.5", "0")))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(positive, negative.replace("20", "12.5")))).toEqual({ [id]: 0 });
  });
  it("scores displayed flat charges per second once without a second per-minute conversion", () => {
    const passive = node("  CHARMS gain 0.15 charges per Second  ", "Charms gain 0.1 charge per Second");
    expect(passivePreferenceValues(passive)).toEqual({ charmChargeGeneration: 0.25 });
    expect(scorePassiveNode(passive, [{ id: "charmChargeGeneration", weight: 2 }])).toBeCloseTo(5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node("Charms gain 0 charges per Second"))).toEqual({ charmChargeGeneration: 0 });
    for (const text of ["Charms gain -0.1 charges per Second", "Charms gain +0.1 charges per Second", "Charms lose 0.1 charges per Second",
      "Charms gain .1 charges per Second", "Charms gain 1.2.3 charges per Second", "Charms gain 10% charges per Second", "Charms gain 1 charge every 10 seconds"]) {
      expect(passivePreferenceValues(node(text)), text).toEqual({});
    }
  });
  it.each(lines)("requires full unconditional player wording for %s", (line) => {
    for (const text of [`${line} while stationary`, `${line}\nif you've used a Charm Recently`, `${line} per Power Charge`, `${line} from Kills`,
      `Minions have ${line}`, `Companions have ${line}`, `Totems have ${line}`, `Allies in your Presence have ${line}`, `Enemies have ${line}`,
      `You and your Minions have ${line}`, `${line} and an unknown effect`, line.replace(/0\.1|10/, "NaN"), line.replace(/0\.1|10/, "Infinity"),
      line.replace(/0\.1|10/, "1.2.3"), line.replace("increased", "more").replace("reduced", "less")]) {
      if (text === line) continue;
      const values = passivePreferenceValues(node(text));
      for (const id of ids) expect(values[id], text).toBeUndefined();
    }
  });
  it("keeps Charm-only and Flask-only modifiers separate in both directions", () => {
    const charm = node(...lines);
    expect(passivePreferenceValues(charm)).toEqual({ charmChargesGained: 10, charmChargeGeneration: 0.1, charmChargeCostReduction: 10, charmEffectDuration: 10 });
    expect(scorePassiveNode(charm, [...ids, ...flaskIds].map((id) => ({ id, weight: 1 })))).toBe(4);
    expect(scorePassiveNode(charm, flaskIds.map((id) => ({ id, weight: 3 })))).toBe(0);
    const flasks = node("10% increased Flask Charges gained", "Life Flasks gain 0.1 charges per Second", "10% reduced Flask Charges used", "10% increased Flask Effect Duration");
    expect(scorePassiveNode(flasks, ids.map((id) => ({ id, weight: 3 })))).toBe(0);
    const combined = node(...charm.stats, ...flasks.stats);
    expect(scorePassiveNode(combined, [...ids, ...flaskIds].map((id) => ({ id, weight: 1 })))).toBe(8);
    for (const text of ["Charms applied to you have 20% increased Effect", "Charms use no Charges", "10% chance for Charms you use to not consume Charges",
      "Cannot use Charms", "+1 Charm Slot", "10% increased Charm Cooldown Recovery Rate", "Charms gain 1 charge when you are Hit",
      "10% increased Charm Charges", "10% increased Flask and Charm Charges used", "10% increased Flask and Charm Effect Duration"]) {
      const values = passivePreferenceValues(node(text));
      for (const id of ids) expect(values[id], text).toBeUndefined();
    }
  });
  it("counts each genuine item-type benefit of shared wording once without deriving generation or duration", () => {
    const passive = node("8% increased Flask and Charm Charges gained", "20% reduced Flask and Charm Charges gained");
    expect(passivePreferenceValues(passive)).toEqual({ flaskChargesGained: -12, charmChargesGained: -12 });
    expect(scorePassiveNode(passive, [{ id: "flaskChargesGained", weight: 1 }, { id: "charmChargesGained", weight: 1 }])).toBe(-2.4);
    const distinct = node("10% increased Flask and Charm Charges gained", "10% increased Charm Charges gained", "10% increased Flask Charges gained");
    expect(passivePreferenceValues(distinct)).toEqual({ flaskChargesGained: 20, charmChargesGained: 20 });
    for (const text of ["10% increased Flask and Charm Charges gained while stationary", "Minions have 10% increased Flask and Charm Charges gained",
      "10% increased Flask, Charm and Unknown Charges gained"]) expect(passivePreferenceValues(node(text)), text).toEqual({});
  });
  it("preserves manual priorities across focuses without automatic selection", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(node(...lines), { focusSkillId: preset.id })).toEqual(passivePreferenceValues(node(...lines)));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id))).toBe(false);
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 4)).toEqual(settings.preferences);
    }
  });
  it("matches 14 Charm-only occurrences and three shared charge-gain occurrences with separate effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ charmChargesGained: 10, charmChargeGeneration: 1, charmChargeCostReduction: 3, charmEffectDuration: 3 });
    expect(wordings.size).toBe(8);
    expect(passivePreferenceValues(graph.nodes["31364"])).toEqual({ charmChargesGained: 40, charmEffectDuration: 40 });
    expect(passivePreferenceValues(graph.nodes["12750"])).toEqual({ charmChargeGeneration: 0.15 });
    expect(scorePassiveNode(graph.nodes["12750"], [{ id: "charmChargeGeneration", weight: 1 }])).toBeCloseTo(1.5);
    expect(passivePreferenceValues(graph.nodes["14001"])).toEqual({ charmChargeCostReduction: 6 });
    expect(passivePreferenceValues(graph.nodes["46692"])).toEqual({ flaskChargesGained: 20, charmChargesGained: 20 });
    expect(passivePreferenceValues(graph.nodes["12322"])).toEqual({ flaskChargesGained: 8, charmChargesGained: 8 });
  });
});

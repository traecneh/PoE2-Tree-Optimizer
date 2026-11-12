import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const ids = ["lifeRegenerationPercent", "manaCostEfficiency", "debuffExpirySpeed"] as const;
const lines = ["Regenerate 0.2% of maximum Life per second", "10% increased Mana Cost Efficiency", "Debuffs on you expire 10% faster"];

describe("percentage-Life regeneration, Mana efficiency and incoming expiry preferences", () => {
  it("scores literal per-second regeneration once without a second raw-data unit conversion", () => {
    expect(passivePreferenceValues(node("  REGENERATE 0.25%   OF MAXIMUM LIFE PER SECOND  ", "Regenerate 0.75% of maximum Life per second")))
      .toEqual({ lifeRegenerationPercent: 1 });
    expect(scorePassiveNode(node(lines[0]), [{ id: "lifeRegenerationPercent", weight: 1 }])).toBe(1);
    expect(scorePassiveNode(node("Regenerate 0.35% of maximum Life per second"), [{ id: "lifeRegenerationPercent", weight: 2 }])).toBeCloseTo(3.5);
    expect(passivePreferenceValues(node("Regenerate 0% of maximum Life per second"))).toEqual({ lifeRegenerationPercent: 0 });
    expect(scorePassiveNode(node(lines[0]), [])).toBe(0);
    for (const line of ["Regenerate -1% of maximum Life per second", "Regenerate +1% of maximum Life per second", "Lose 1% of maximum Life per second",
      "Regenerate 5 Life per second", "Regenerate 1% of maximum Life per minute", "1% increased Life Regeneration Rate"]) {
      expect(passivePreferenceValues(node(line)).lifeRegenerationPercent, line).toBeUndefined();
    }
  });
  it.each([
    ["manaCostEfficiency", "12.5% increased Mana Cost Efficiency", "20% reduced Mana Cost Efficiency", "0% increased Mana Cost Efficiency"],
    ["debuffExpirySpeed", "Debuffs on you expire 12.5% faster", "Debuffs on you expire 20% slower", "Debuffs on you expire 0% faster"],
  ] as const)("keeps %s signed and opt-in, not a calculated cost/duration percentage", (id, positive, negative, zero) => {
    const passive = node(positive, negative);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(zero))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(positive, negative.replace("20", "12.5")))).toEqual({ [id]: 0 });
  });
  it.each(lines)("requires complete unconditional player wording for %s", (line) => {
    for (const text of [`${line} while stationary`, `${line}\nif you've been Hit Recently`, `${line} per Power Charge`, `${line} during a Mana Flask Effect`,
      `${line} of Command Skills`, `Minions have ${line}`, `Minions ${line}`, `Companions have ${line}`, `Totems have ${line}`,
      `Allies in your Presence ${line}`, `Enemies have ${line}`, `You and your Minions have ${line}`, `${line} and an unknown effect`,
      line.replace(/0\.2|10/, "1.2.3"), line.replace(/0\.2|10/, "NaN"), line.replace(/0\.2|10/, "Infinity")]) {
      const values = passivePreferenceValues(node(text));
      for (const id of ids) expect(values[id], text).toBeUndefined();
    }
  });
  it("keeps sources/rates, costs/reservation and expiry/effect/duration separate", () => {
    const passive = node(...lines);
    expect(passivePreferenceValues(passive)).toEqual({ lifeRegenerationPercent: 0.2, manaCostEfficiency: 10, debuffExpirySpeed: 10 });
    expect(scorePassiveNode(passive, ids.map((id) => ({ id, weight: 1 })))).toBe(3);
    const others = ["lifeRegenerationRate", "manaRegenerationRate", "life", "mana", "skillDuration", "slowPotencyReduction", "curseEffectReduction",
      "chillEffectReduction", "shockEffectReduction", "minionLife", "totemLifeRegeneration", "minionReservationEfficiency"] as const;
    expect(scorePassiveNode(passive, others.map((id) => ({ id, weight: 3 })))).toBe(0);
    const sourceAndRate = node(lines[0], "10% increased Life Regeneration Rate");
    expect(passivePreferenceValues(sourceAndRate)).toEqual({ lifeRegenerationPercent: 0.2, lifeRegenerationRate: 10 });
    expect(scorePassiveNode(sourceAndRate, [{ id: "lifeRegenerationPercent", weight: 1 }, { id: "lifeRegenerationRate", weight: 1 }])).toBe(2);
    for (const text of ["10% more Mana Cost Efficiency", "10% less Mana Cost Efficiency", "+10% increased Mana Cost Efficiency", "-10% increased Mana Cost Efficiency",
      "10% increased Mana Cost Efficiency of Command Skills", "10% reduced Mana Cost", "10% increased Reservation Efficiency of Skills",
      "Debuffs you inflict expire 10% slower", "Buffs on you expire 10% slower", "10% reduced Debuff Duration on you", "Debuffs on you expire -10% faster",
      "Debuffs on you expire +10% faster", "Regenerate 1% of maximum Life over 1 second when Stunned"]) {
      const values = passivePreferenceValues(node(text));
      for (const id of ids) expect(values[id], text).toBeUndefined();
    }
  });
  it("preserves manual settings across all focuses without automatic priorities", () => {
    const settings = { mode: "weighted", extraPointBudget: 8, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: i + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...lines);
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(preset.suggestions.filter((p) => ids.some((id) => id === p.id)).map(({ id,weight }) => ({ id,weight })))
        .toEqual(["archmage","emergency-reload","arctic-howl","lunar-blessing"].includes(preset.id) ? [{ id: "manaCostEfficiency", weight: 1 }] : ["berserk","savage-fury"].includes(preset.id) ? [{ id: "lifeRegenerationPercent", weight: 2 }] : []);
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
  });
  it("matches all 32 extracted game occurrences and keeps mixed-node effects independent", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ lifeRegenerationPercent: 12, manaCostEfficiency: 11, debuffExpirySpeed: 9 });
    expect(wordings.size).toBe(14);
    expect(passivePreferenceValues(graph.nodes["7721"])).toEqual({ armour: 15, lifeRegenerationPercent: 0.5, attributes: 10 });
    expect(passivePreferenceValues(graph.nodes["34340"])).toEqual({ lifeRegenerationPercent: 0.5 });
    expect(passivePreferenceValues(graph.nodes["16790"])).toEqual({ manaCostEfficiency: 20, manaRegenerationRate: 15 });
    expect(passivePreferenceValues(graph.nodes["3355"])).toEqual({ debuffExpirySpeed: 3, slowPotencyReduction: 4 });
    expect(passivePreferenceValues(graph.nodes["59438"])).toEqual({ debuffExpirySpeed: 10, recoupSpeed: 20 });
    expect(passivePreferenceValues(graph.nodes["52971"])).toEqual({ energyShieldRechargeStart: 8, manaCostEfficiency: 10, minionReservationEfficiency: 10 });
  });
});

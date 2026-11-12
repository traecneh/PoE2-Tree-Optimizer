import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const ids = ["recoupSpeed", "lifeRecoveryOnKill", "manaRecoveryOnKill", "flaskEffectDuration"] as const;
const lines = ["10% increased speed of Recoup Effects", "Recover 1% of maximum Life on Kill", "Recover 1% of maximum Mana on Kill", "10% increased Flask Effect Duration"];

describe("Recoup speed, on-Kill recovery and Flask Effect Duration preferences", () => {
  it.each([
    ["recoupSpeed", "12.5% increased speed of Recoup Effects", "20% reduced speed of Recoup Effects", 10],
    ["flaskEffectDuration", "12.5% increased Flask Effect Duration", "20% reduced Flask Effect Duration", 10],
    ["lifeRecoveryOnKill", "Recover 12.5% of maximum Life on Kill", "Lose 20% of maximum Life on Kill", 1],
    ["manaRecoveryOnKill", "Recover 12.5% of maximum Mana on Kill", "Lose 20% of maximum Mana on Kill", 1],
  ] as const)("scores signed %s once, only when selected", (id, positive, negative, scale) => {
    expect(passivePreferenceValues(node(`  ${positive.toUpperCase().replaceAll(" ", "   ")}  `, negative))).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(node(positive, negative), [{ id, weight: 2 }])).toBe(-15 / scale);
    expect(scorePassiveNode(node(positive), [])).toBe(0);
    expect(passivePreferenceValues(node(positive.replace("12.5", "0")))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(positive, negative.replace("20", "12.5")))).toEqual({ [id]: 0 });
  });
  it.each(lines)("requires complete unconditional player wording for %s", (line) => {
    for (const text of [`${line} while stationary`, `${line}\nif you've Killed Recently`, `${line} per Power Charge`, `${line} during a Flask Effect`,
      `${line} for Minions`, `Minions have ${line}`, `Minions ${line}`, `Companions have ${line}`, `Totems have ${line}`,
      `Allies in your Presence ${line}`, `Enemies have ${line}`, `You and your Minions have ${line}`, `${line} and an unknown effect`,
      line.replace(/10|1/, "1.2.3"), line.replace(/10|1/, "NaN"), line.replace(/10|1/, "Infinity")]) {
      const values = passivePreferenceValues(node(text));
      for (const id of ids) expect(values[id], text).toBeUndefined();
    }
  });
  it("does not turn delivery speed, event amounts or duration into recovery rates or event frequency", () => {
    const passive = node(...lines);
    expect(passivePreferenceValues(passive)).toEqual({ recoupSpeed: 10, lifeRecoveryOnKill: 1, manaRecoveryOnKill: 1, flaskEffectDuration: 10 });
    expect(scorePassiveNode(passive, ids.map((id) => ({ id, weight: 1 })))).toBe(4);
    const others = ["lifeRecoup", "manaRecoup", "energyShieldRecoup", "lifeRegenerationPercent", "lifeRegenerationRate", "manaRegenerationRate",
      "life", "mana", "lifeFlaskRecovery", "manaFlaskRecovery", "flaskChargesGained", "lifeFlaskChargeGeneration", "manaFlaskChargeGeneration", "skillDuration"] as const;
    expect(scorePassiveNode(passive, others.map((id) => ({ id, weight: 3 })))).toBe(0);
    expect(passivePreferenceValues(node(lines[0], "3% of Damage taken Recouped as Life"))).toEqual({ recoupSpeed: 10, lifeRecoup: 3 });
    expect(passivePreferenceValues(node(lines[3], "10% increased Life and Mana Recovery from Flasks", "10% increased Flask Charges gained")))
      .toEqual({ flaskEffectDuration: 10, lifeFlaskRecovery: 10, manaFlaskRecovery: 10, flaskChargesGained: 10 });
    for (const line of ["Recover -1% of maximum Life on Kill", "Recover +1% of maximum Mana on Kill", "Lose -1% of maximum Life on Kill",
      "Recover 10 Life on Kill", "Recover 1% of Life on Kill", "Recover 1% of maximum Life on Hit", "Recover 1% of maximum Mana when you Kill a Cursed Enemy",
      "Recover 1% of maximum Life on Killing a Poisoned Enemy", "Recover 1% of maximum Life per second", "Recover 1% of maximum Life over 1 second on Kill",
      "10% increased Life gained on Kill", "10% more Flask Effect Duration", "10% less speed of Recoup Effects", "10% faster Recoup Effects",
      "10% increased Life Flask Effect Duration", "+10% increased Flask Effect Duration", "-10% increased speed of Recoup Effects"]) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) expect(values[id], line).toBeUndefined();
    }
  });
  it("preserves opt-in settings across all focuses without adding automatic priorities", () => {
    const settings = { mode: "weighted", extraPointBudget: 8, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: (i % 3) + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(node(...lines), { focusSkillId: preset.id })).toEqual(passivePreferenceValues(node(...lines)));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id))).toBe(false);
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 4)).toEqual(settings.preferences);
    }
  });
  it("matches all 28 extracted occurrences and keeps mixed-node effects independent", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ recoupSpeed: 10, lifeRecoveryOnKill: 6, manaRecoveryOnKill: 6, flaskEffectDuration: 6 });
    expect(wordings.size).toBe(12);
    expect(passivePreferenceValues(graph.nodes["38111"])).toEqual({ lifeRecoup: 6, recoupSpeed: 25 });
    expect(passivePreferenceValues(graph.nodes["21792"])).toEqual({ lifeRecoveryOnKill: 1, manaRecoveryOnKill: 1 });
    expect(passivePreferenceValues(graph.nodes["94"])).toEqual({ manaRecoveryOnKill: 2, manaRegenerationRate: 15 });
    expect(passivePreferenceValues(graph.nodes["15829"])).toEqual({ manaRecoveryOnKill: 2, manaLeechAmount: 25 });
    expect(passivePreferenceValues(graph.nodes["44527"])).toEqual({ flaskEffectDuration: 15, flaskChargesGained: 15 });
    expect(passivePreferenceValues(graph.nodes["45100"])).toEqual({ attackSpeed: 2, flaskEffectDuration: 5 });
    expect(passivePreferenceValues(graph.nodes["59438"])).toEqual({ recoupSpeed: 20, debuffExpirySpeed: 10 });
  });
});

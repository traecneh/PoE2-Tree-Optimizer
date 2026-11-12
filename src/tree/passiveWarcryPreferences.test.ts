import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const forms = [
  ["warcrySpeed", "", "Warcry Speed"],
  ["warcryCooldownRecoveryRate", "", "Warcry Cooldown Recovery Rate"],
  ["warcryAreaOfEffect", "Warcry Skills have ", "Area of Effect"],
] as const;
const ids = forms.map(([id]) => id);
const lines = forms.map(([, prefix, wording]) => `${prefix}10% increased ${wording}`);

describe("unconditional Warcry utility preferences", () => {
  it.each(forms)("keeps %s signed, decimal and opt-in without calculating time or radius", (id, prefix, wording) => {
    const positive = `${prefix}12.5% increased ${wording}`, negative = `${prefix}20% reduced ${wording}`;
    const passive = node(`  ${positive.toUpperCase().replaceAll(" ", "   ")}  `, negative);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`${prefix}0% increased ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(positive, negative.replace("20", "12.5")))).toEqual({ [id]: 0 });
  });
  it.each(forms)("requires complete unconditional player wording for %s", (id, prefix, wording) => {
    const line = `${prefix}10% increased ${wording}`;
    for (const text of [`${line} while stationary`, `${line}\nif you've Warcried Recently`, `${line} per Power Charge`, `${line} with Maces`,
      `Minions have ${line}`, `Minions ${line}`, `Companions have ${line}`, `Totems have ${line}`, `Allies in your Presence have ${line}`,
      `Enemies have ${line}`, `You and your Minions have ${line}`, `${line} and an unknown effect`, `${line} for Command Skills`,
      line.replace("10", "1.2.3"), line.replace("10", "NaN"), line.replace("10", "Infinity"), line.replace("10", "+10"), line.replace("10", "-10"),
      line.replace("increased", "more"), line.replace("increased", "less"), `Socketed ${line}`]) {
      expect(passivePreferenceValues(node(text))[id], text).toBeUndefined();
    }
  });
  it("scores generic and Warcry-specific lines once in their own categories, never in both", () => {
    const generic = ["skillSpeed", "cooldownRecoveryRate", "areaOfEffect"] as const;
    const general = ["3% increased Skill Speed", "10% increased Cooldown Recovery Rate", "10% increased Area of Effect"];
    const preferences = [...ids, ...generic].map((id) => ({ id, weight: 1 }));
    expect(passivePreferenceValues(node(...general))).toEqual({ skillSpeed: 3, cooldownRecoveryRate: 10, areaOfEffect: 10 });
    expect(scorePassiveNode(node(...general), preferences)).toBe(3);
    expect(scorePassiveNode(node(...general), ids.map((id) => ({ id, weight: 3 })))).toBe(0);
    expect(passivePreferenceValues(node(...lines))).toEqual({ warcrySpeed: 10, warcryCooldownRecoveryRate: 10, warcryAreaOfEffect: 10 });
    expect(scorePassiveNode(node(...lines), preferences)).toBe(3);
    expect(scorePassiveNode(node(...lines), generic.map((id) => ({ id, weight: 3 })))).toBe(0);
    expect(scorePassiveNode(node(...general, ...lines), preferences)).toBe(6);
    const other = ["attackSpeed", "castSpeed", "totemPlacementSpeed", "minionCommandCooldownRecovery", "minionAreaOfEffect", "presenceArea",
      "genericDamage", "attackDamage", "attackAreaDamage", "skillDuration", "lifeRecoveryOnKill"] as const;
    expect(scorePassiveNode(node(...lines), other.map((id) => ({ id, weight: 3 })))).toBe(0);
    expect(scorePassiveNode(node("3% reduced Skill Speed", lines[0]), preferences)).toBe(0);
  });
  it("leaves damage, empowerment, recovery events, overrides and unreviewed aliases separate", () => {
    for (const text of ["40% increased Damage with Warcries", "Empowered Attacks deal 30% increased Damage", "Warcries Debilitate Enemies",
      "20% increased Damage for each different Warcry you've used Recently", "Recover 2% of maximum Life and Mana when you use a Warcry",
      "Warcry Skills' Cooldowns are 4 seconds", "Ignore Warcry Cooldowns", "Warcries are Instant", "10% increased Warcry Area of Effect",
      "Warcry Skills have 10% increased Radius", "Warcries have 10% increased Area of Effect", "Warcry Skills have 10% increased Area Damage",
      "10% faster Warcry Speed", "10% reduced Warcry Cooldown", "Warcry Skills have 10% increased Area of Effect for Empowered Attacks"]) {
      const values = passivePreferenceValues(node(text));
      for (const id of ids) expect(values[id], text).toBeUndefined();
    }
  });
  it("preserves manual priorities across all focuses without assuming minion Warcries qualify", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "skeletal-brute",
      preferences: ids.map((id, i) => ({ id, weight: i + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(node(...lines), { focusSkillId: preset.id })).toEqual(passivePreferenceValues(node(...lines)));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id)))
        .toBe(["infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar", "arctic-howl", "lunar-blessing"].includes(preset.id));
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
  });
  it("matches all 28 extracted occurrences without borrowing mixed-node effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ warcrySpeed: 13, warcryCooldownRecoveryRate: 12, warcryAreaOfEffect: 3 });
    expect(wordings.size).toBe(10);
    expect(passivePreferenceValues(graph.nodes["1169"])).toEqual({ warcrySpeed: 24, warcryCooldownRecoveryRate: 18 });
    expect(passivePreferenceValues(graph.nodes["17999"])).toEqual({ warcrySpeed: 8, warcryCooldownRecoveryRate: 6 });
    expect(passivePreferenceValues(graph.nodes["6514"])).toEqual({ warcryAreaOfEffect: 25 });
    expect(passivePreferenceValues(graph.nodes["26070"])).toEqual({ warcryAreaOfEffect: 30 });
    expect(passivePreferenceValues(graph.nodes["29762"])).toEqual({ warcrySpeed: 25, warcryAreaOfEffect: 25 });
    expect(passivePreferenceValues(graph.nodes["9187"])).toEqual({ warcrySpeed: 25 });
  });
});

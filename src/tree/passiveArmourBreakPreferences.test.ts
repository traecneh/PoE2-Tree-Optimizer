import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const forms = [["armourBreakAmount", "Break ", "Armour"], ["fullyBrokenArmourEffect", "", "effect of Fully Broken Armour"],
  ["armourBreakDuration", "", "Armour Break Duration"]] as const;
const ids = forms.map(([id]) => id);

describe("Armour Break amount, effect and duration preferences", () => {
  it.each(forms)("retains signed %s without conflating amount, effect, duration or defence", (id, prefix, wording) => {
    const line = (amount: string, sign: string) => `${prefix}${amount}% ${sign} ${wording}`;
    const passive = node(`  ${line("12.5", "INCREASED").toUpperCase()}  `, line("20", "reduced"));
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(line("0", "increased")))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(line("10", "increased"), line("10", "reduced")))).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(line("200", "increased")), [{ id, weight: 1 }])).toBe(20);
    expect(scorePassiveNode(passive, [{ id: "armour", weight: 3 }, { id: "physicalDamage", weight: 3 }, { id: "skillDuration", weight: 3 }])).toBe(0);
  });
  it.each(forms)("requires complete unconditional outgoing wording for %s", (id, prefix, wording) => {
    const line = `${prefix}20% increased ${wording}`;
    for (const text of [`${line} while stationary`, `${line}\nif you've Heavy Stunned an Enemy Recently`, `${line} per Power Charge`,
      `${line} with Maces`, `${line} on enemies affected by Ailments`, `${line} against enemies with Fully Broken Armour`,
      `Minions have ${line}`, `Companions have ${line}`, `Totems have ${line}`, `Allies in your Presence have ${line}`,
      `Enemies have ${line}`, `You and your Minions have ${line}`, `${line} and an unknown effect`,
      `${prefix}20% more ${wording}`, `${prefix}20% less ${wording}`, `${prefix}+20% increased ${wording}`, `${prefix}-20% increased ${wording}`,
      `${prefix}1.2.3% increased ${wording}`, `${prefix}.5% increased ${wording}`, `${prefix}NaN% increased ${wording}`, `${prefix}Infinity% increased ${wording}`]) {
      expect(passivePreferenceValues(node(text))[id], text).toBeUndefined();
    }
  });
  it("keeps application, damage-type extensions, incoming break, faster expiry and aliases unmodeled", () => {
    for (const text of ["Break 50% of Armour on Heavy Stunning an Enemy", "Break Armour equal to 10% of Hit Damage dealt", "Break 100 Armour on Hit",
      "Hits Break 30% increased Armour on targets with Ailments", "30% reduced Armour Break taken", "20% increased Armour Break Amount",
      "20% increased Armour Break Effect", "Armour Break you inflict expires 20% slower", "20% increased Armour Break Duration on you",
      "You can Break enemy Armour to below 0", "Fully Broken Armour you inflict also increases Fire Damage Taken from Hits",
      "Fully Broken Armour you inflict increases all Damage Taken from Hits instead"]) {
      const values = passivePreferenceValues(node(text));
      for (const id of ids) expect(values[id], text).toBeUndefined();
    }
  });
  it("scores each real modifier once without copying it into amount, effect or duration siblings", () => {
    const passive = node("Break 10% increased Armour", "10% increased effect of Fully Broken Armour", "10% increased Armour Break Duration");
    expect(passivePreferenceValues(passive)).toEqual({ armourBreakAmount: 10, fullyBrokenArmourEffect: 10, armourBreakDuration: 10 });
    expect(scorePassiveNode(passive, ids.map((id) => ({ id, weight: 1 })))).toBe(3);
    for (const [id, prefix, wording] of forms) {
      expect(scorePassiveNode(node(`${prefix}10% increased ${wording}`), ids.map((id) => ({ id, weight: 1 })))).toBe(1);
      expect(scorePassiveNode(node(`${prefix}10% increased ${wording}`), ids.filter((key) => key !== id).map((id) => ({ id, weight: 3 })))).toBe(0);
    }
  });
  it("preserves manual preferences and limits suggestions to explicitly reviewed Armour Break sources", () => {
    const settings = { mode: "weighted", extraPointBudget: 8, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: i + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...forms.map(([, prefix, wording]) => `${prefix}10% increased ${wording}`));
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id))).toBe(["armour-piercing-rounds", "armour-breaker", "resonating-shield"].includes(preset.id));
      if (["armour-breaker", "resonating-shield"].includes(preset.id)) {
        expect(preset.suggestions.filter((p) => ids.some((id) => id === p.id)).map((p) => p.id)).toEqual(["armourBreakAmount"]);
      }
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
  });
  it("matches all 35 game occurrences without inferring their other node effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ armourBreakAmount: 21, fullyBrokenArmourEffect: 10, armourBreakDuration: 4 });
    expect(wordings.size).toBe(12);
    expect(passivePreferenceValues(graph.nodes["10286"])).toEqual({ armourBreakAmount: 15, armour: 10 });
    expect(passivePreferenceValues(graph.nodes["21453"])).toEqual({ armourBreakAmount: 60 });
    expect(passivePreferenceValues(graph.nodes["28542"])).toEqual({ fullyBrokenArmourEffect: 15, fireResistance: 10 });
    expect(passivePreferenceValues(graph.nodes["22626"])).toEqual({ armourBreakDuration: 100 });
    expect(passivePreferenceValues(graph.nodes["8831"])).toEqual({ fullyBrokenArmourEffect: 15, physicalDamage: 20, attributes: 10 });
  });
});

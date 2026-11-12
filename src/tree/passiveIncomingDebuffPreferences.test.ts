import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const forms = [
  ["slowPotencyReduction", "Slowing Potency of Debuffs on You"], ["curseEffectReduction", "effect of Curses on you"],
  ["chillEffectReduction", "Effect of Chill on you"], ["shockEffectReduction", "effect of Shock on you"],
] as const;
const ids = forms.map(([id]) => id);

describe("incoming debuff protection preferences", () => {
  it.each(forms)("inverts %s so reduced incoming effect is beneficial and increases are penalties", (id, wording) => {
    const passive = node(`  12.5%   REDUCED ${wording.toUpperCase()}  `, `20% increased ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`0% reduced ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% reduced ${wording}`, `10% increased ${wording}`))).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(`10% reduced ${wording}`), [{ id, weight: 3 }])).toBe(3);
    expect(scorePassiveNode(node(`150% reduced ${wording}`), [{ id, weight: 1 }])).toBe(15);
  });
  it.each(forms)("requires complete unconditional player wording for %s", (id, wording) => {
    for (const line of [`20% reduced ${wording} while stationary`, `20% reduced ${wording}\nif you've used a Charm Recently`,
      `20% reduced ${wording} per Power Charge`, `20% reduced ${wording} with Bows`, `20% reduced ${wording} during Dodge Roll`,
      `Minions have 20% reduced ${wording}`, `Companions have 20% reduced ${wording}`, `Totems have 20% reduced ${wording}`,
      `Allies in your Presence have 20% reduced ${wording}`, `Enemies have 20% reduced ${wording}`, `You and your Minions have 20% reduced ${wording}`,
      `20% more ${wording}`, `20% less ${wording}`, `+20% reduced ${wording}`, `-20% reduced ${wording}`,
      `1.2.3% reduced ${wording}`, `.5% reduced ${wording}`, `NaN% reduced ${wording}`, `Infinity% reduced ${wording}`,
      `20% reduced ${wording} and an unknown effect`]) {
      expect(passivePreferenceValues(node(line))[id], line).toBeUndefined();
    }
  });
  it("does not turn protection into outgoing damage, curse or ailment strength", () => {
    const protection = node(...forms.map(([, wording]) => `10% reduced ${wording}`));
    expect(passivePreferenceValues(protection)).toEqual({ slowPotencyReduction: 10, curseEffectReduction: 10, chillEffectReduction: 10, shockEffectReduction: 10 });
    expect(scorePassiveNode(protection, ids.map((id) => ({ id, weight: 1 })))).toBe(4);
    expect(scorePassiveNode(protection, [{ id: "curseMagnitude", weight: 3 }, { id: "chillMagnitude", weight: 3 }, { id: "shockMagnitude", weight: 3 },
      { id: "movementSpeed", weight: 3 }, { id: "skillMovementPenaltyReduction", weight: 3 }, { id: "elementalAilmentThreshold", weight: 3 }])).toBe(0);
    const mixed = node("15% reduced Effect of Chill on you", "15% increased Magnitude of Chill you inflict");
    expect(passivePreferenceValues(mixed)).toEqual({ chillEffectReduction: 15, chillMagnitude: 15 });
    expect(scorePassiveNode(mixed, [{ id: "chillEffectReduction", weight: 1 }, { id: "chillMagnitude", weight: 1 }])).toBe(3);
  });
  it("keeps immunity, avoidance, duration, generic slow and combined aliases separate", () => {
    for (const line of ["Immune to Curses", "Unaffected by Chill", "Cannot be Shocked", "20% chance to Avoid being Chilled",
      "20% reduced Chill Duration on you", "20% reduced Effect of Non-Damaging Ailments on you", "20% reduced effect of Chill and Shock on you",
      "20% reduced Curse Effect", "20% reduced Chill Effect", "20% reduced Slow Potency", "Debuffs on you expire 20% faster",
      "Debuffs you inflict have 20% increased Slow Magnitude", "20% increased Curse Magnitudes", "20% increased Magnitude of Shock you inflict"]) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) expect(values[id], line).toBeUndefined();
    }
  });
  it("preserves manual priorities across focuses without adding automatic preferences", () => {
    const settings = { mode: "weighted", extraPointBudget: 8, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...forms.map(([, wording]) => `10% reduced ${wording}`));
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id))).toBe(false);
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 4)).toEqual(settings.preferences);
    }
  });
  it("matches all 59 game occurrences, preserving independent benefits, penalties and unsupported effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ slowPotencyReduction: 32, curseEffectReduction: 12, chillEffectReduction: 8, shockEffectReduction: 7 });
    expect(wordings.size).toBe(25);
    expect(passivePreferenceValues(graph.nodes["675"])).toEqual({ slowPotencyReduction: 5, armour: 10 });
    expect(passivePreferenceValues(graph.nodes["35581"])).toEqual({ skillDuration: -16, slowPotencyReduction: 10 });
    expect(passivePreferenceValues(graph.nodes["23907"])).toEqual({ chillEffectReduction: 15, chillMagnitude: 15 });
    expect(passivePreferenceValues(graph.nodes["47387"])).toEqual({ lightningDamage: 20, shockEffectReduction: 30, shockMagnitude: 15 });
    expect(passivePreferenceValues(graph.nodes["42078"])).toEqual({ curseEffectReduction: 50 });
    expect(passivePreferenceValues(graph.nodes["32543"])).toEqual({ skillMovementPenaltyReduction: 6, slowPotencyReduction: 20 });
  });
});

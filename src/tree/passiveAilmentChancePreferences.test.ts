import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const flatForms = [["poisonChance", "Poison"], ["bleedingChance", "inflict Bleeding"], ["dazeChance", "Daze"]] as const;
const ids = ["poisonChance", "bleedingChance", "dazeChance", "ailmentChance"] as const;

describe("outgoing ailment chance preferences", () => {
  it.each(flatForms)("keeps signed flat %s points distinct from relative increases", (id, wording) => {
    const passive = node(`  +12.5%   CHANCE TO ${wording.toUpperCase()} ON HIT  `, `-5% chance to ${wording} on Hit`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: 7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(3);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`0% chance to ${wording} on Hit`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% chance to ${wording} on Hit`, `-10% chance to ${wording} on Hit`))).toEqual({ [id]: 0 });
    for (const line of [`10% increased chance to ${wording} on Hit`, `10% reduced chance to ${wording} on Hit`,
      `10% more chance to ${wording} on Hit`, `1.2.3% chance to ${wording} on Hit`, `NaN% chance to ${wording} on Hit`,
      `Infinity% chance to ${wording} on Hit`, `10% chance to ${wording}`]) {
      expect(passivePreferenceValues(node(line))[id], line).toBeUndefined();
    }
  });
  it("handles increased/reduced generic chance without turning it into flat application", () => {
    expect(passivePreferenceValues(node("12.5% increased chance to inflict Ailments", "20% reduced chance to inflict Ailments"))).toEqual({ ailmentChance: -7.5 });
    expect(scorePassiveNode(node("20% reduced chance to inflict Ailments"), [{ id: "ailmentChance", weight: 2 }])).toBe(-4);
    expect(passivePreferenceValues(node("0% increased chance to inflict Ailments"))).toEqual({ ailmentChance: 0 });
    for (const line of ["10% chance to inflict Ailments", "+10% chance to inflict Ailments", "10% more chance to inflict Ailments",
      "10% less chance to inflict Ailments", "+10% increased chance to inflict Ailments", "-10% increased chance to inflict Ailments",
      "10% increased chance to inflict Elemental Ailments", "10% increased chance to inflict Damaging Ailments"]) {
      expect(passivePreferenceValues(node(line)).ailmentChance, line).toBeUndefined();
    }
  });
  it("does not fan generic chance into specific chances, multiply them, or treat scores as capped probabilities", () => {
    const preferences = ids.map((id) => ({ id, weight: 1 }));
    const generic = node("50% increased chance to inflict Ailments");
    expect(passivePreferenceValues(generic)).toEqual({ ailmentChance: 50 });
    expect(scorePassiveNode(generic, preferences)).toBe(5);
    expect(scorePassiveNode(generic, preferences.slice(0, 3))).toBe(0);
    const flat = node("20% chance to Poison on Hit");
    expect(passivePreferenceValues(flat)).toEqual({ poisonChance: 20 });
    expect(scorePassiveNode(flat, preferences)).toBe(4);
    expect(scorePassiveNode(flat, preferences.slice(1))).toBe(0);
    const mixed = node(...flat.stats, ...generic.stats);
    expect(passivePreferenceValues(mixed)).toEqual({ poisonChance: 20, ailmentChance: 50 });
    expect(scorePassiveNode(mixed, preferences)).toBe(9);
    expect(scorePassiveNode(node("150% chance to Poison on Hit"), preferences)).toBe(30);
    expect(passivePreferenceValues(node("Always Poison on Hit", "Always inflict Bleeding", "Dazes on Hit"))).toEqual({});
  });
  it("requires complete unconditional outgoing wording and keeps other owners separate", () => {
    const lines = [...flatForms.map(([, wording]) => `10% chance to ${wording} on Hit`), "10% increased chance to inflict Ailments"];
    for (const line of lines) for (const scoped of [`${line} while stationary`, `${line}\nif you've Crit Recently`, `${line} per Power Charge`,
      `${line} with Bows`, `${line} against Dazed Enemies`, `${line} with an unknown effect`, `Minions have ${line}`, `Companions have ${line}`,
      `Allies in your Presence have ${line}`, `Enemies have ${line}`, `You and your Minions have ${line}`, `Totems have ${line}`]) {
      const values = passivePreferenceValues(node(scoped));
      for (const id of ids) expect(values[id], scoped).toBeUndefined();
    }
  });
  it("does not borrow magnitude, duration, buildup, immunity or damage bonuses", () => {
    const passive = node("15% increased Magnitude of Poison you inflict", "15% increased Magnitude of Bleeding you inflict",
      "25% increased Daze Duration", "20% increased Stun Buildup", "20% increased Damage against Dazed Enemies",
      "20% chance to Avoid being Poisoned", "20% reduced Duration of Ailments on you", "20% increased Damage over Time");
    for (const id of ids) expect(passivePreferenceValues(passive)[id]).toBeUndefined();
    expect(scorePassiveNode(passive, ids.map((id) => ({ id, weight: 3 })))).toBe(0);
    expect(scorePassiveNode(node("10% chance to Poison on Hit", "10% chance to inflict Bleeding on Hit", "10% chance to Daze on Hit"), [
      { id: "poisonMagnitude", weight: 3 }, { id: "bleedingMagnitude", weight: 3 }, { id: "stunBuildup", weight: 3 },
      { id: "physicalDamage", weight: 3 }, { id: "chaosDamage", weight: 3 }, { id: "damageOverTime", weight: 3 },
    ])).toBe(0);
  });
  it("preserves manual selections across all focuses without adding automatic suggestions", () => {
    const settings = { mode: "weighted", extraPointBudget: 8, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: (i % 3) + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...flatForms.map(([, wording]) => `10% chance to ${wording} on Hit`), "10% increased chance to inflict Ailments");
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id))).toBe(false);
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 4)).toEqual(settings.preferences);
    }
  });
  it("matches all 68 game occurrences and keeps mixed-node conditions separate", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0]));
    const wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); }
    }
    expect(counts).toEqual({ poisonChance: 13, bleedingChance: 17, dazeChance: 17, ailmentChance: 21 });
    expect(wordings.size).toBe(11);
    expect(passivePreferenceValues(graph.nodes["2091"])).toEqual({ poisonChance: 8 });
    expect(passivePreferenceValues(graph.nodes["54990"])).toEqual({ bleedingChance: 10, bleedingMagnitude: 15 });
    expect(passivePreferenceValues(graph.nodes["5009"])).toEqual({ dazeChance: 10, dazeDuration: 25 });
    expect(passivePreferenceValues(graph.nodes["38342"])).toEqual({ dazeChance: 10 });
    expect(passivePreferenceValues(graph.nodes["43383"])).toEqual({ ailmentChance: 15 });
    expect(passivePreferenceValues(graph.nodes["46182"])).toEqual({ ailmentChance: 20, damagingAilmentDuration: 15 });
  });
});

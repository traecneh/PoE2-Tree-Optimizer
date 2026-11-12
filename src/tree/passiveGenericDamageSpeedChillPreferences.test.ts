import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const forms = [["genericDamage", "Damage", 10], ["skillSpeed", "Skill Speed", 3], ["chillMagnitude", "Magnitude of Chill you inflict", 10]] as const;
const ids = forms.map(([id]) => id);

describe("unconditional generic Damage, Skill Speed and Chill Magnitude", () => {
  it.each(forms)("scores signed %s once with zero/decimal arithmetic and no unselected reward", (id, wording, scale) => {
    const passive = node(`  12.5%   INCREASED ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 3 }])).toBeCloseTo(-22.5 / scale);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`0% increased ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`))).toEqual({ [id]: 0 });
  });
  it.each(forms)("does not promote conditional, scoped, shared or malformed wording into %s", (id, wording) => {
    for (const line of [`20% increased ${wording} while stationary`, `20% increased ${wording}\nif you've Crit Recently`,
      `20% increased ${wording} per Summoned Totem`, `20% increased ${wording} with Bows`, `20% increased ${wording} for Spells`,
      `Allies in your Presence have 20% increased ${wording}`, `Allies in your Presence deal 20% increased ${wording}`,
      `Minions have 20% increased ${wording}`, `Minions deal 20% increased ${wording}`, `Companions have 20% increased ${wording}`,
      `Companions deal 20% increased ${wording}`, `Totems have 20% increased ${wording}`, `Spells Cast by Totems deal 20% increased ${wording}`,
      `You and your Minions have 20% increased ${wording}`, `Enemies have 20% increased ${wording}`,
      `20% more ${wording}`, `20% less ${wording}`, `+20% increased ${wording}`, `-20% increased ${wording}`,
      `1.2.3% increased ${wording}`, `NaN% increased ${wording}`, `Infinity% increased ${wording}`, `20% increased ${wording} and an unknown effect`]) {
      expect(passivePreferenceValues(node(line))[id], line).toBeUndefined();
    }
  });
  it("does not fan one Skill Speed line into attack/cast/totem speed preferences", () => {
    const passive = node("3% increased Skill Speed");
    const preferences = [{ id: "skillSpeed" as const, weight: 1 }, { id: "attackSpeed" as const, weight: 1 }, { id: "castSpeed" as const, weight: 1 },
      { id: "totemPlacementSpeed" as const, weight: 1 }, { id: "totemAttackSpeed" as const, weight: 1 }, { id: "totemCastSpeed" as const, weight: 1 },
      { id: "minionAttackSpeed" as const, weight: 1 }, { id: "minionCastSpeed" as const, weight: 1 }, { id: "warcrySpeed" as const, weight: 1 }];
    expect(passivePreferenceValues(passive)).toEqual({ skillSpeed: 3 });
    expect(scorePassiveNode(passive, preferences)).toBe(1);
    expect(scorePassiveNode(passive, preferences.slice(1))).toBe(0);
    const distinct = node("3% increased Skill Speed", "3% increased Attack Speed", "3% increased Cast Speed", "10% increased Totem Placement speed");
    expect(passivePreferenceValues(distinct)).toEqual({ skillSpeed: 3, attackSpeed: 3, castSpeed: 3, totemPlacementSpeed: 10 });
    expect(scorePassiveNode(distinct, preferences)).toBe(4);
    expect(scorePassiveNode(node("3% reduced Skill Speed", "3% increased Attack Speed"), preferences)).toBe(0);
  });
  it("keeps genuine generic/minion damage lines separate without copying damage into other categories", () => {
    const passive = node("15% increased Damage", "Minions deal 15% increased Damage");
    expect(passivePreferenceValues(passive)).toEqual({ genericDamage: 15, minionDamage: 15 });
    expect(scorePassiveNode(passive, [{ id: "genericDamage", weight: 1 }, { id: "minionDamage", weight: 1 }])).toBe(3);
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }, { id: "spellDamage", weight: 3 }, { id: "physicalDamage", weight: 3 },
      { id: "elementalDamage", weight: 3 }, { id: "damageOverTime", weight: 3 }, { id: "totemDamage", weight: 3 }, { id: "companionDamage", weight: 3 }])).toBe(0);
  });
  it("separates outgoing Chill magnitude from incoming Chill, duration, Freeze and damage", () => {
    expect(passivePreferenceValues(node("15% reduced Effect of Chill on you", "15% increased Magnitude of Chill you inflict"))).toEqual({ chillEffectReduction: 15, chillMagnitude: 15 });
    const passive = node("1000% increased Magnitude of Chill you inflict");
    expect(scorePassiveNode(passive, [{ id: "chillMagnitude", weight: 1 }])).toBe(100);
    expect(scorePassiveNode(passive, [{ id: "coldDamage", weight: 3 }, { id: "freezeBuildup", weight: 3 }, { id: "skillDuration", weight: 3 }])).toBe(0);
    for (const line of ["20% increased Chill Effect", "20% increased Chill Duration on Enemies", "+20% to maximum Chill Effect",
      "Minions have 20% increased Magnitude of Chill you inflict", "20% increased Magnitude of Chill on you", "20% increased Magnitude of Chill you inflict on Frozen Enemies"]) {
      expect(passivePreferenceValues(node(line)).chillMagnitude, line).toBeUndefined();
    }
  });
  it("preserves manual preferences in all focuses without automatic priorities or support multipliers", () => {
    const settings = { mode: "weighted", extraPointBudget: 8, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: i + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...forms.map(([, wording]) => `10% increased ${wording}`));
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(preset.suggestions.filter((p) => ids.some((id) => id === p.id)).map(({ id,weight }) => ({ id,weight })))
        .toEqual(["herald-of-blood","herald-of-ice","herald-of-thunder"].includes(preset.id) ? [{ id: "genericDamage", weight: 2 }] : []);
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
  });
  it("recognizes all 53 native occurrences, including six penalties, and leaves mixed-node effects separate", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), negative = Object.fromEntries(ids.map((id) => [id, 0]));
    const wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); if (values[id]! < 0) negative[id]++; }
    }
    expect(counts).toEqual({ genericDamage: 21, skillSpeed: 19, chillMagnitude: 13 });
    expect(negative).toEqual({ genericDamage: 3, skillSpeed: 3, chillMagnitude: 0 });
    expect(wordings.size).toBe(22);
    expect(passivePreferenceValues(graph.nodes["20963"])).toEqual({ criticalChance: 50, skillSpeed: -5 });
    expect(passivePreferenceValues(graph.nodes["48160"])).toEqual({ genericDamage: -10 });
    expect(passivePreferenceValues(graph.nodes["13108"])).toEqual({ skillSpeed: -3 });
    expect(passivePreferenceValues(graph.nodes["23907"])).toEqual({ chillEffectReduction: 15, chillMagnitude: 15 });
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const forms = [
  ["totemDamage", "", " Totem Damage", 10], ["totemLife", "", " Totem Life", 10],
  ["totemPlacementSpeed", "", " Totem Placement speed", 10], ["totemDuration", "", " Totem Duration", 10],
  ["totemAttackSpeed", "Attacks used by Totems have ", " Attack Speed", 3],
  ["totemCastSpeed", "Spells Cast by Totems have ", " Cast Speed", 3],
] as const;
const ids = forms.map(([id]) => id);

describe("explicit Totem preferences", () => {
  it.each(forms)("scores signed %s once without borrowing player or minion preferences", (id, prefix, suffix, scale) => {
    const passive = node(`  ${prefix}12.5%   INCREASED ${suffix.toUpperCase()}  `, `${prefix}20% reduced${suffix}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBeCloseTo(-15 / scale);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(scorePassiveNode(passive, [{ id: "life", weight: 3 }, { id: "attackDamage", weight: 3 }, { id: "spellDamage", weight: 3 },
      { id: "attackSpeed", weight: 3 }, { id: "castSpeed", weight: 3 }, { id: "skillDuration", weight: 3 },
      { id: "minionDamage", weight: 3 }, { id: "minionLife", weight: 3 }, { id: "minionSpeed", weight: 3 }])).toBe(0);
    expect(passivePreferenceValues(node(`${prefix}0% increased${suffix}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`${prefix}10% increased${suffix}`, `${prefix}10% reduced${suffix}`))).toEqual({ [id]: 0 });
  });
  it.each(forms)("excludes conditional, composite, transferred and malformed %s effects", (_id, prefix, suffix) => {
    for (const line of [`${prefix}20% increased${suffix} per Summoned Totem`, `${prefix}20% increased${suffix} while on Full Life`,
      `${prefix}20% increased${suffix}\nif you've summoned a Totem Recently`, `${prefix}20% increased${suffix} and an unknown effect`,
      `${prefix}20% more${suffix}`, `${prefix}20% less${suffix}`, `${prefix}+20% increased${suffix}`, `${prefix}-20% increased${suffix}`,
      `${prefix}1.2.3% increased${suffix}`, `${prefix}NaN% increased${suffix}`, `${prefix}Infinity% increased${suffix}`,
      `Minions have ${prefix}20% increased${suffix}`, `Companions have ${prefix}20% increased${suffix}`,
      `You and your Totems have ${prefix}20% increased${suffix}`]) {
      expect(passivePreferenceValues(node(line)), line).toEqual({});
    }
  });
  it("keeps genuine generic, minion and Totem lines in separate categories", () => {
    expect(passivePreferenceValues(node("10% increased Totem Damage", "10% increased Attack Damage", "Minions deal 10% increased Damage",
      "10% increased Totem Life", "10% increased maximum Life", "Minions have 10% increased maximum Life",
      "Attacks used by Totems have 3% increased Attack Speed", "Spells Cast by Totems have 4% reduced Cast Speed",
      "3% increased Attack Speed", "3% increased Cast Speed", "Minions have 3% increased Attack and Cast Speed",
      "10% increased Totem Duration", "10% increased Skill Effect Duration", "10% increased Minion Duration",
      "10% increased Totem Placement speed"))).toEqual({
      totemDamage: 10, attackDamage: 10, minionDamage: 10, totemLife: 10, life: 10, minionLife: 10,
      totemAttackSpeed: 3, totemCastSpeed: -4, attackSpeed: 3, castSpeed: 3, minionSpeed: 6, minionAttackSpeed: 3, minionCastSpeed: 3,
      totemDuration: 10, skillDuration: 10, minionDuration: 10, totemPlacementSpeed: 10,
    });
    const wrong = node("20% increased Damage", "20% increased Skill Speed", "Totems have 20% increased Attack and Cast Speed",
      "Attacks used by Ballistas have 20% increased Attack Speed", "Spells Cast by Totems have 20% increased Cast Speed per Summoned Totem",
      "Totems have 20% additional Physical Damage Reduction", "Totems Regenerate 3% of maximum Life per second");
    expect(passivePreferenceValues(wrong)).toEqual({ genericDamage: 20, skillSpeed: 20, totemPhysicalDamageReduction: 20, totemLifeRegeneration: 3 });
  });
  it("retains manual Totem settings and limits new suggestions to reviewed Ballista focuses", () => {
    const settings = { mode: "weighted", extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId: "dark-effigy",
      preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...forms.map(([, prefix, suffix]) => `${prefix}10% increased${suffix}`));
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(preset.suggestions.some((p) => ids.some((id) => p.id === id))).toBe(["artillery-ballista", "siege-ballista", "shockwave-totem"].includes(preset.id));
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 6)).toEqual(settings.preferences);
    }
  });
  it("matches the 56 reviewed native occurrences and leaves state-dependent or other Totem mechanics unsupported", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const totals = Object.fromEntries(ids.map((id) => [id, 0]));
    const wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      for (const line of n.stats) {
        const values = passivePreferenceValues(node(line));
        for (const id of ids) if (Object.hasOwn(values, id)) { totals[id]++; wordings.add(line); }
      }
    }
    expect(totals).toEqual({ totemDamage: 17, totemLife: 9, totemPlacementSpeed: 13, totemDuration: 1, totemAttackSpeed: 8, totemCastSpeed: 8 });
    expect(wordings.size).toBe(15);
  });
});

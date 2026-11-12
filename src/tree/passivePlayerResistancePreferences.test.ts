import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const ordinary = [["fireResistance", "Fire Resistance", 5], ["coldResistance", "Cold Resistance", 5],
  ["lightningResistance", "Lightning Resistance", 5], ["chaosResistance", "Chaos Resistance", 5]] as const;
const maximum = [["maximumFireResistance", "Maximum Fire Resistance", 1], ["maximumColdResistance", "Maximum Cold Resistance", 1],
  ["maximumLightningResistance", "Maximum Lightning Resistance", 1]] as const;
const forms = [...ordinary, ...maximum], ids = forms.map(([id]) => id);

describe("player ordinary and maximum resistance preferences", () => {
  it.each(forms)("keeps signed flat %s values and scores only selected priorities", (id, wording, scale) => {
    const passive = node(`  +12.5%   TO ${wording.toUpperCase()}  `, `-20% to ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-15 / scale);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`+0% to ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`+5% to ${wording}`, `-5% to ${wording}`))).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(`+200% to ${wording}`), [{ id, weight: 1 }])).toBe(200 / scale);
  });
  it.each(forms)("rejects wrong-owner, conditional, percentage-scaling and malformed forms of %s", (id, wording) => {
    for (const line of [`+5% to ${wording} while Shapeshifted`, `+5% to ${wording}\nif you have at least 5 Blue Support Gems Socketed`,
      `+5% to ${wording} per Power Charge`, `+5% to ${wording} during Dodge Roll`, `Minions have +5% to ${wording}`,
      `Companions have +5% to ${wording}`, `Totems gain +5% to ${wording}`, `Allies in your Presence have +5% to ${wording}`,
      `Enemies have -5% to ${wording}`, `You and your Minions have +5% to ${wording}`, `5% increased ${wording}`, `5% reduced ${wording}`,
      `5% more ${wording}`, `5% less ${wording}`, `5% to ${wording}`, `+1.2.3% to ${wording}`, `+.5% to ${wording}`,
      `+NaN% to ${wording}`, `+Infinity% to ${wording}`, `+5% to ${wording} and an unknown effect`]) {
      expect(passivePreferenceValues(node(line))[id], line).toBeUndefined();
    }
  });
  it("fans all-elemental bonuses and penalties out once per selected element, never Chaos or caps", () => {
    const passive = node("+5% to all Elemental Resistances", "-10% to all Elemental Resistances", "+2% to Fire Resistance");
    expect(passivePreferenceValues(passive)).toEqual({ fireResistance: -3, coldResistance: -5, lightningResistance: -5 });
    expect(scorePassiveNode(passive, ids.map((id) => ({ id, weight: 1 })))).toBe(-2.6);
    expect(scorePassiveNode(passive, [{ id: "chaosResistance", weight: 3 }, ...maximum.map(([id]) => ({ id, weight: 3 }))])).toBe(0);
    const caps = node("+2% to all Maximum Elemental Resistances", "-1% to all Maximum Elemental Resistances");
    expect(passivePreferenceValues(caps)).toEqual({ maximumFireResistance: 1, maximumColdResistance: 1, maximumLightningResistance: 1 });
    expect(scorePassiveNode(caps, maximum.map(([id]) => ({ id, weight: 1 })))).toBe(3);
    expect(scorePassiveNode(caps, ordinary.map(([id]) => ({ id, weight: 3 })))).toBe(0);
    expect(scorePassiveNode(node("+5% to all Elemental Resistances", "+1% to all Maximum Elemental Resistances"), ids.map((id) => ({ id, weight: 1 })))).toBe(6);
  });
  it("does not infer penetration, exposure, overrides, unreviewed grouped aliases or maximum Chaos resistance", () => {
    for (const line of ["Damage Penetrates 5% Fire Resistance", "Fire Exposure applies an extra -10% to Fire Resistance", "Your Maximum Resistances are 90%",
      "+5% to all Resistances", "+5% to Fire and Cold Resistances", "+1% to Maximum Chaos Resistance", "+1% to all Maximum Resistances",
      "+1% to Maximum Resistances of each Elemental Damage Type you have been Hit with Recently",
      "+1% to all Maximum Elemental Resistances if you have at\nleast 5 Red, Green and Blue Support Gems Socketed"]) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) expect(values[id], line).toBeUndefined();
    }
    expect(scorePassiveNode(node("+5% to Fire Resistance", "+1% to Maximum Fire Resistance"), [
      { id: "firePenetration", weight: 3 }, { id: "minionFireResistance", weight: 3 }, { id: "totemFireResistance", weight: 3 }, { id: "companionFireResistance", weight: 3 },
    ])).toBe(0);
  });
  it("preserves manual priorities across all focuses without automatic preset additions", () => {
    const settings = { mode: "weighted", extraPointBudget: 8, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...forms.map(([, wording]) => `+5% to ${wording}`));
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id))).toBe(false);
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 7)).toEqual(settings.preferences);
    }
  });
  it("recognizes all 45 game lines including two penalty lines without losing real mixed-node effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    let occurrences = 0, negative = 0;
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      if (ids.some((id) => Object.hasOwn(values, id))) { occurrences++; wordings.add(line); if (ids.some((id) => (values[id] ?? 0) < 0)) negative++; }
      for (const id of ids) if (Object.hasOwn(values, id)) counts[id]++;
    }
    expect(counts).toEqual({ fireResistance: 12, coldResistance: 16, lightningResistance: 16, chaosResistance: 9,
      maximumFireResistance: 0, maximumColdResistance: 1, maximumLightningResistance: 1 });
    expect(occurrences).toBe(45); expect(negative).toBe(2); expect(wordings.size).toBe(24);
    expect(passivePreferenceValues(graph.nodes["9928"])).toEqual({ coldResistance: 10, maximumColdResistance: 1 });
    expect(passivePreferenceValues(graph.nodes["4547"])).toEqual({ fireResistance: 3, coldResistance: 3, lightningResistance: 3 });
    expect(passivePreferenceValues(graph.nodes["56988"])).toEqual({ shockEffectReduction: 50, maximumLightningResistance: 1 });
    expect(passivePreferenceValues(graph.nodes["53910"])).toEqual({ fireResistance: -10, coldResistance: -10, lightningResistance: -10, minionLifeRecoup: 30, life: -5 });
    expect(passivePreferenceValues(graph.nodes["34473"])).toMatchObject({ chaosResistance: -7, attributes: 39, chaosDamage: 29, movementSpeed: 3 });
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const forms = [
  ["electrocuteBuildup", "Electrocute Buildup"], ["pinBuildup", "Pin Buildup"], ["dazeDuration", "Daze Duration"],
  ["damagingAilmentMagnitude", "Magnitude of Damaging Ailments you inflict"], ["damagingAilmentDuration", "Duration of Damaging Ailments on Enemies"],
] as const;
const ids = forms.map(([id]) => id);

describe("ailment buildup, Daze duration and generic damaging-ailment preferences", () => {
  it.each(forms)("keeps signed %s values exact and opt-in", (id, wording) => {
    const passive = node(`  12.5%   INCREASED ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`0% increased ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`))).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(`200% increased ${wording}`), [{ id, weight: 1 }])).toBe(20);
  });
  it.each(forms)("rejects conditional, wrong-owner, alias and malformed wording for %s", (id, wording) => {
    for (const line of [`20% increased ${wording} while stationary`, `20% increased ${wording}\nif you've Crit Recently`,
      `20% increased ${wording} per Power Charge`, `20% increased ${wording} with Bows`, `20% increased ${wording} for Spells`,
      `20% increased ${wording} with Critical Hits`, `20% increased ${wording} against Shocked Enemies`,
      `Minions have 20% increased ${wording}`, `Companions have 20% increased ${wording}`, `Totems have 20% increased ${wording}`,
      `Allies in your Presence have 20% increased ${wording}`, `Enemies have 20% increased ${wording}`, `You and your Minions have 20% increased ${wording}`,
      `20% more ${wording}`, `20% less ${wording}`, `+20% increased ${wording}`, `-20% increased ${wording}`,
      `1.2.3% increased ${wording}`, `.5% increased ${wording}`, `NaN% increased ${wording}`, `Infinity% increased ${wording}`,
      `20% increased ${wording} and an unknown effect`]) {
      expect(passivePreferenceValues(node(line))[id], line).toBeUndefined();
    }
  });
  it("keeps generic magnitude and duration in their own categories without ailment fan-out", () => {
    const generic = node("10% increased Magnitude of Damaging Ailments you inflict", "10% increased Duration of Damaging Ailments on Enemies");
    const specific = ["poisonMagnitude", "bleedingMagnitude", "igniteMagnitude", "poisonDuration", "bleedingDuration", "igniteDuration",
      "chillMagnitude", "shockMagnitude", "freezeBuildup", "genericDamage", "damageOverTime", "skillDuration", "ailmentChance"] as const;
    expect(passivePreferenceValues(generic)).toEqual({ damagingAilmentMagnitude: 10, damagingAilmentDuration: 10 });
    const preferences = [...ids, ...specific].map((id) => ({ id, weight: 1 }));
    expect(scorePassiveNode(generic, preferences)).toBe(2);
    expect(scorePassiveNode(generic, specific.map((id) => ({ id, weight: 3 })))).toBe(0);
    const mixed = node(...generic.stats, "10% increased Magnitude of Poison you inflict", "10% increased Poison Duration");
    expect(passivePreferenceValues(mixed)).toEqual({ damagingAilmentMagnitude: 10, damagingAilmentDuration: 10, poisonMagnitude: 10, poisonDuration: 10 });
    expect(scorePassiveNode(mixed, preferences)).toBe(4);
    for (const line of ["10% increased Magnitude of Ailments you inflict", "10% increased Magnitude of Non-Damaging Ailments you inflict",
      "10% increased Duration of Damaging Ailments on you", "10% increased Duration of Ailments on Enemies",
      "Damaging Ailments deal damage 10% faster", "10% increased Damaging Ailment Duration"]) {
      const values = passivePreferenceValues(node(line));
      expect(values.damagingAilmentMagnitude, line).toBeUndefined(); expect(values.damagingAilmentDuration, line).toBeUndefined();
    }
  });
  it("does not confuse buildup, duration, application, damage or incoming protection", () => {
    const passive = node("10% increased Electrocute Buildup", "10% increased Pin Buildup", "10% increased Daze Duration");
    expect(passivePreferenceValues(passive)).toEqual({ electrocuteBuildup: 10, pinBuildup: 10, dazeDuration: 10 });
    expect(scorePassiveNode(passive, [{ id: "lightningDamage", weight: 3 }, { id: "physicalDamage", weight: 3 }, { id: "stunBuildup", weight: 3 },
      { id: "dazeChance", weight: 3 }, { id: "ailmentChance", weight: 3 }, { id: "skillDuration", weight: 3 }])).toBe(0);
    const unsupported = node("20% increased Electrocute Duration", "20% increased Pin Duration", "20% chance to Electrocute on Hit", "20% chance to Pin on Hit",
      "20% reduced Daze Duration on you", "20% increased Damage against Dazed Enemies", "Cannot be Electrocuted", "Projectile Damage Builds Pin");
    for (const id of ids) expect(passivePreferenceValues(unsupported)[id]).toBeUndefined();
  });
  it("preserves manual preferences across all focuses without automatic preset additions", () => {
    const settings = { mode: "weighted", extraPointBudget: 8, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id, i) => ({ id, weight: i % 3 + 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    const passive = node(...forms.map(([, wording]) => `10% increased ${wording}`));
    for (const preset of skillPreferencePresets) {
      expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual(passivePreferenceValues(passive));
      expect(preset.suggestions.some((p) => ids.some((id) => id === p.id))).toBe(preset.id === "artillery-ballista");
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 5)).toEqual(settings.preferences);
    }
  });
  it("matches all 35 game occurrences, retaining mixed-node penalties and excluding unrelated effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const line of n.stats) {
      const values = passivePreferenceValues(node(line));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(line); }
    }
    expect(counts).toEqual({ electrocuteBuildup: 11, pinBuildup: 10, dazeDuration: 1, damagingAilmentMagnitude: 4, damagingAilmentDuration: 9 });
    expect(wordings.size).toBe(14);
    expect(passivePreferenceValues(graph.nodes["43090"])).toEqual({ electrocuteBuildup: 30, skillSpeed: 5 });
    expect(passivePreferenceValues(graph.nodes["50687"])).toEqual({ electrocuteBuildup: 40 });
    expect(passivePreferenceValues(graph.nodes["9290"])).toEqual({ pinBuildup: 30 });
    expect(passivePreferenceValues(graph.nodes["5009"])).toEqual({ dazeChance: 10, dazeDuration: 25 });
    expect(passivePreferenceValues(graph.nodes["14343"])).toEqual({ damagingAilmentMagnitude: 20 });
    expect(passivePreferenceValues(graph.nodes["18496"])).toEqual({ ailmentMagnitude: 30, damagingAilmentDuration: 20, attackSpeed: -5 });
    expect(passivePreferenceValues(graph.nodes["54998"])).toEqual({ damagingAilmentDuration: 15, skillDuration: 20 });
  });
});

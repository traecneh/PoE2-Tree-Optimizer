import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const forms = [
  ["markEffect", (n: number | string, sign = "increased") => `${n}% ${sign} Effect of your Mark Skills`],
  ["markUseSpeed", (n: number | string, sign = "increased") => `Mark Skills have ${n}% ${sign} Use Speed`],
  ["markDuration", (n: number | string, sign = "increased") => `Mark Skills have ${n}% ${sign} Skill Effect Duration`],
  ["exposureEffect", (n: number | string, sign = "increased") => `${n}% ${sign} Exposure Effect`],
] as const;
const ids = forms.map(([id]) => id);

describe("Mark effect/timing and outgoing Exposure Effect preferences", () => {
  it.each(forms)("keeps %s signed, decimal, zero and opt-in as a source modifier", (id, line) => {
    const passive = node(`  ${line(12.5).toUpperCase().replaceAll(" ", "   ")}  `, line(20, "reduced"));
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(line(0)))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(line(10), line(10, "reduced")))).toEqual({ [id]: 0 });
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Mark", "__proto__"]) {
      expect(passivePreferenceValues(passive, { focusSkillId }), focusSkillId).toEqual({ [id]: -7.5 });
    }
  });
  it.each(forms)("requires exact unconditional outgoing player wording for %s", (_id, line) => {
    const text = line(10);
    for (const raw of [`${text} while stationary`, `${text}\nif you've used a Mark Recently`, `${text} per Charge`, `${text} against Bosses`,
      `Minions have ${text}`, `Companions have ${text}`, `Totems have ${text}`, `Allies have ${text}`, `Enemies have ${text}`,
      `You and your Minions have ${text}`, `${text} on you`, `${text} and an unknown effect`,
      line(10, "more"), line(10, "less"), line("+10"), line("-10"), line("1.2.3"), line("NaN"), line("Infinity")]) {
      expect(passivePreferenceValues(node(raw)), raw).toEqual({});
    }
  });
  it("keeps Mark-only timing and Exposure strength separate from generic speed/duration, curses and penetration", () => {
    const passive = node(forms[0][1](20), forms[0][1](5, "reduced"), forms[1][1](30), forms[1][1](10, "reduced"),
      forms[2][1](25), forms[2][1](5, "reduced"), forms[3][1](10), forms[3][1](20), forms[3][1](5, "reduced"));
    expect(passivePreferenceValues(passive)).toEqual({ markEffect: 15, markUseSpeed: 20, markDuration: 20, exposureEffect: 25 });
    expect(scorePassiveNode(passive, ids.map((id) => ({ id, weight: 1 })))).toBe(8);
    const others = ["skillSpeed", "castSpeed", "attackSpeed", "skillDuration", "curseMagnitude", "curseDuration", "curseActivation", "firePenetration",
      "coldPenetration", "lightningPenetration", "elementalPenetration", "fireResistance", "coldResistance", "lightningResistance", "slowMagnitude", "genericDamage"] as const;
    expect(scorePassiveNode(passive, others.map((id) => ({ id, weight: 3 })))).toBe(0);
    const distinct = node(...passive.stats, "3% increased Skill Speed", "10% increased Skill Effect Duration", "6% increased Curse Magnitudes",
      "20% increased Curse Duration", "Damage Penetrates 5% Fire Resistance");
    expect(passivePreferenceValues(distinct)).toEqual({ markEffect: 15, markUseSpeed: 20, markDuration: 20, exposureEffect: 25,
      skillSpeed: 3, skillDuration: 10, curseMagnitude: 6, curseDuration: 20, firePenetration: 5 });
    expect(scorePassiveNode(distinct, [...ids, ...others].map((id) => ({ id, weight: 1 })))).toBe(13);
    expect(scorePassiveNode(node("10% increased Exposure Effect"), [...ids, ...others].map((id) => ({ id, weight: 1 })))).toBe(1);
  });
  it("does not infer application, aliases, enemy states, flat extra Exposure or incoming protection", () => {
    for (const raw of ["20% increased effect of your Marks", "10% increased Mark Effect", "10% increased Mark Use Speed", "10% increased Mark Duration",
      "10% increased Fire Exposure Effect", "10% increased Cold Exposure Effect", "10% increased Lightning Exposure Effect",
      "Exposure you inflict lowers Resistances by an additional 5%", "10% reduced effect of Exposure on you", "Immune to Exposure",
      "Inflict Cold Exposure on Hit", "Nearby Enemies have Cold Exposure", "10% increased Critical Hit Chance against Marked Enemies",
      "10% increased Critical Hit Chance against enemies with Exposure", "Culling Strike against Enemies you Mark",
      "Enemies you Mark take 10% increased Damage", "Enemies near Enemies you Mark are Blinded",
      "Mark Skills have 10% increased Cooldown Recovery Rate", "10% increased Duration of Ailments against Enemies with Exposure"]) {
      expect(passivePreferenceValues(node(raw)), raw).toEqual({});
    }
    expect(passivePreferenceValues({ ...node(), name: "Mark Exposure Effect Speed Duration" })).toEqual({});
  });
  it("retains manual secondary-skill priorities and limits Mark suggestions to the separately reviewed utility presets", () => {
    const settings = normalizePassiveOptimizationSettings({ mode: "weighted", extraPointBudget: 7, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id) => ({ id, weight: 2 })) });
    expect(settings.preferences).toEqual(ids.map((id) => ({ id, weight: 2 })));
    for (const preset of skillPreferencePresets) {
      const isMark = ["snipers-mark", "bloodhounds-mark", "freezing-mark", "voltaic-mark"].includes(preset.id);
      expect(preset.suggestions.some((s) => ids.some((id) => id === s.id))).toBe(isMark);
      expect(preset.suggestions.some((s) => s.id === "exposureEffect")).toBe(false);
      expect(addSkillPresetPreferences(settings, preset).preferences.slice(0, 4)).toEqual(settings.preferences);
      expect(passivePreferenceValues(node(...forms.map(([, line]) => line(10))), { focusSkillId: preset.id, supportGemIds: ["controlled-destruction"] }))
        .toEqual({ markEffect: 10, markUseSpeed: 10, markDuration: 10, exposureEffect: 10 });
    }
  });
  it("covers all eighteen game occurrences and seven wordings, preserving independent mixed-node effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const stat of n.stats) {
      const values = passivePreferenceValues(node(stat));
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(stat); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ markEffect: 4, markUseSpeed: 4, markDuration: 2, exposureEffect: 8 }); expect(wordings.size).toBe(7);
    expect(passivePreferenceValues(graph.nodes["21279"])).toEqual({ markEffect: 8, blindEffect: 10 });
    expect(passivePreferenceValues(graph.nodes["44280"], { focusSkillId: "lightning-arrow" })).toEqual({ markEffect: 8, blindChance: 5 });
    expect(passivePreferenceValues(graph.nodes["44280"], { focusSkillId: "spark" })).toEqual({ markEffect: 8 });
    for (const id of ["17867", "37092"]) expect(passivePreferenceValues(graph.nodes[id])).toEqual({ exposureEffect: 7, slowMagnitude: 7 });
    for (const id of ["13624", "44841"]) expect(passivePreferenceValues(graph.nodes[id])).toEqual({ markDuration: 25 });
    for (const id of ["23305", "35534", "36927", "45390"]) expect(passivePreferenceValues(graph.nodes[id])).toEqual({ markUseSpeed: 10 });
    expect(passivePreferenceValues(graph.nodes["52199"])).toEqual({ exposureEffect: 30 });
    expect(passivePreferenceValues(graph.nodes["10423"])).toEqual({ firePenetration: 18 });
    expect(passivePreferenceValues(graph.nodes["40990"])).toEqual({ lightningPenetration: 18 });
    expect(passivePreferenceValues(graph.nodes["55835"])).toEqual({ coldPenetration: 18 });
    expect(passivePreferenceValues(graph.nodes["2745"])).toEqual({ attributes: 10 });
    for (const id of ["33922", "44756", "36976", "51602", "63830"]) expect(passivePreferenceValues(graph.nodes[id])).toEqual({});
  });
});

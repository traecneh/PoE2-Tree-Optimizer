import { attackClosureIds } from "./attackClosureSkills.fixtures";
import { maceShieldIds } from "./maceShieldSkills.fixtures";
import { monkPrimaryIds } from "./monkPrimarySkills.fixtures";
import { spearPrimaryIds } from "./spearPrimarySkills.fixtures";
import { bowPrimaryHitIds } from "./bowPrimarySkills.fixtures";
import { quarterstaffPrimaryIds } from "./quarterstaffPrimarySkills.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import type { TreeGraph, TreeNode } from "./types";
import { remainingAttackIds } from "./remainingAttackSkills.fixtures";
import { plantBowHitIds } from "./plantBowSkills.fixtures";
import { macePrimaryIds } from "./macePrimarySkills.fixtures";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const attacks = ["lightning-arrow", "ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear", "galvanic-shards", "explosive-shot", "explosive-grenade", "rake", "maul", "shred", ...remainingAttackIds, ...plantBowHitIds, ...macePrimaryIds, ...quarterstaffPrimaryIds, ...bowPrimaryHitIds, ...spearPrimaryIds, ...monkPrimaryIds, ...maceShieldIds, ...attackClosureIds];
const forms = [
  ["maimChance", "attackMaimChance", (n: number | string) => `Attacks have ${n}% chance to Maim on Hit`],
  ["incisionChance", "attackIncisionChance", (n: number | string) => `${n}% chance for Attack Hits to apply Incision`],
] as const;
const ids = ["knockbackDistance", "maimChance", "incisionChance"] as const;

describe("Knockback Distance and attack-hit Maim/Incision preferences", () => {
  it("keeps signed distance modifiers separate from application and incoming protection", () => {
    const passive = node("  12.5%   INCREASED KNOCKBACK DISTANCE  ", "20% reduced Knockback Distance");
    expect(passivePreferenceValues(passive)).toEqual({ knockbackDistance: -7.5 });
    expect(scorePassiveNode(passive, [{ id: "knockbackDistance", weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node("0% increased Knockback Distance"))).toEqual({ knockbackDistance: 0 });
    expect(passivePreferenceValues(node("10% increased Knockback Distance", "10% reduced Knockback Distance"))).toEqual({ knockbackDistance: 0 });
    for (const preset of skillPreferencePresets) expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual({ knockbackDistance: -7.5 });
  });
  it.each(forms)("admits %s only for the explicit reviewed player attack-hit focuses", (id, scope, line) => {
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes(scope)).map((p) => p.id).sort()).toEqual([...attacks].sort());
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Lightning Arrow", "__proto__"]) {
      expect(passivePreferenceValues(node(line(12.5)), { focusSkillId }), focusSkillId).toEqual(attacks.includes(focusSkillId ?? "") ? { [id]: 12.5 } : {});
    }
    const context = { focusSkillId: "lightning-arrow" };
    const passive = node(`  ${line("+12.5").toUpperCase().replaceAll(" ", "   ")}  `, line(-5));
    expect(passivePreferenceValues(passive, context)).toEqual({ [id]: 7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }], context)).toBe(3);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    expect(passivePreferenceValues(node(line(0)), context)).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(line(10), line(-10)), context)).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(line(150)), [{ id, weight: 1 }], context)).toBe(30);
    for (const invalid of [line("1.2.3"), line("NaN"), line("Infinity"), line(10).replace("chance", "increased chance"),
      line(10).replace("chance", "reduced chance"), line(10).replace("chance", "more chance")]) {
      expect(passivePreferenceValues(node(invalid), context), invalid).toEqual({});
    }
  });
  it("requires complete unconditional player wording, not ownership, aliases or enemy states", () => {
    const lines = ["10% increased Knockback Distance", ...forms.map(([, , line]) => line(10))];
    for (const text of lines) for (const raw of [`${text} while stationary`, `${text}\nif you've Hit Recently`, `${text} per Charge`, `${text} against Poisoned Enemies`,
      `Minions have ${text}`, `Companions have ${text}`, `Totems have ${text}`, `Allies have ${text}`, `Enemies have ${text}`, `You and your Minions have ${text}`,
      `${text} on you`, `${text} and an unknown effect`]) {
      expect(passivePreferenceValues(node(raw), { focusSkillId: "lightning-arrow" }), raw).toEqual({});
    }
    for (const raw of ["10% more Knockback Distance", "10% less Knockback Distance", "+10 to Knockback Distance", "+10% increased Knockback Distance",
      "-10% increased Knockback Distance", "1.2.3% increased Knockback Distance", "Cannot be Knocked Back", "Cannot Knock Enemies Back",
      "80% less Knockback Distance for Blocked Hits", "20% chance to Knock Enemies Back with Hits at Close Range", "Immune to Maim",
      "10% chance to Maim Enemies on Hit", "10% chance for Attacks to Maim on Hit against Poisoned Enemies",
      "10% increased Attack Damage against Maimed Enemies", "Enemies you Fully Armour Break are Maimed",
      "10% chance for Attack Hits to apply ten Incision", "50% increased effect of Incision",
      "Enemies you apply Incision to take 2% increased Physical Damage per Incision",
      "15% increased Magnitude of Bleeding you inflict against Enemies affected by Incision"]) {
      expect(passivePreferenceValues(node(raw), { focusSkillId: "lightning-arrow" }), raw).toEqual({});
    }
  });
  it("keeps distance, Maim chance and Incision chance once each without damage/slow/bleed fanout", () => {
    const passive = node("20% increased Knockback Distance", "5% reduced Knockback Distance",
      forms[0][2](10), forms[0][2](15), forms[0][2](-5), forms[1][2](20), forms[1][2](40), forms[1][2](-10),
      "100% increased Attack Damage against Maimed Enemies", "50% increased effect of Incision");
    const context = { focusSkillId: "lightning-spear" };
    expect(passivePreferenceValues(passive, context)).toEqual({ knockbackDistance: 15, maimChance: 20, incisionChance: 50 });
    expect(scorePassiveNode(passive, ids.map((id) => ({ id, weight: 1 })), context)).toBe(15.5);
    expect(scorePassiveNode(passive, (["bleedingChance", "bleedingMagnitude", "bleedingDuration", "slowMagnitude", "stunBuildup", "pinBuildup", "ailmentChance", "physicalDamage", "attackDamage"] as const)
      .map((id) => ({ id, weight: 3 })), context)).toBe(0);
    expect(passivePreferenceValues(node(...passive.stats, "5% chance to inflict Bleeding on Hit", "10% increased Bleeding Duration"), context))
      .toEqual({ knockbackDistance: 15, maimChance: 20, incisionChance: 50, bleedingChance: 5, bleedingDuration: 10 });
  });
  it("preserves priorities and support compatibility without automatic control or stack assumptions", () => {
    const settings = normalizePassiveOptimizationSettings({ mode: "weighted", extraPointBudget: 7, focusSkillId: "lightning-arrow",
      preferences: ids.map((id) => ({ id, weight: 2 })) });
    expect(settings.preferences).toEqual(ids.map((id) => ({ id, weight: 2 })));
    for (const preset of skillPreferencePresets) {
      expect(preset.suggestions.some((s) => ids.some((id) => id === s.id))).toBe(false);
      expect(addSkillPresetPreferences(settings, preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
    expect(passivePreferenceValues(node(forms[0][2](10), forms[1][2](20)), { focusSkillId: "lightning-arrow", supportGemIds: ["controlled-destruction"] }))
      .toEqual({ maimChance: 10, incisionChance: 20 });
  });
  it("matches all 21 source occurrences and seven wordings while preserving mixed-node effects", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const stat of n.stats) {
      const values = passivePreferenceValues(node(stat), { focusSkillId: "lightning-spear" });
      for (const id of ids) if (Object.hasOwn(values, id)) { counts[id]++; wordings.add(stat); expect(values[id]).toBeGreaterThan(0); }
    }
    expect(counts).toEqual({ knockbackDistance: 10, maimChance: 2, incisionChance: 9 }); expect(wordings.size).toBe(7);
    expect(passivePreferenceValues(graph.nodes["2361"], { focusSkillId: "ice-strike" })).toEqual({ stunBuildup: 20, knockbackDistance: 20 });
    expect(passivePreferenceValues(graph.nodes["39881"])).toEqual({ physicalDamage: 25, dazeChance: 10, knockbackDistance: 20 });
    expect(passivePreferenceValues(graph.nodes["48103"])).toEqual({ physicalDamage: 20, stunBuildup: 20, knockbackDistance: 20 });
    expect(passivePreferenceValues(graph.nodes["57805"])).toEqual({ knockbackDistance: 20 });
    expect(passivePreferenceValues(graph.nodes["41580"], { focusSkillId: "lightning-arrow" })).toEqual({ attackDamage: 25, maimChance: 25 });
    expect(passivePreferenceValues(graph.nodes["46696"], { focusSkillId: "lightning-spear" })).toEqual({ attackDamage: 25, maimChance: 10 });
    expect(passivePreferenceValues(graph.nodes["46696"], { focusSkillId: "ice-shot" })).toEqual({ maimChance: 10 });
    expect(passivePreferenceValues(graph.nodes["8248"], { focusSkillId: "lightning-arrow" })).toEqual({ bleedingDuration: 10, incisionChance: 20 });
    expect(passivePreferenceValues(graph.nodes["60014"], { focusSkillId: "lightning-arrow" })).toEqual({ bleedingDuration: 20, movementSpeed: 3, incisionChance: 40 });
    expect(passivePreferenceValues(graph.nodes["43677"], { focusSkillId: "lightning-arrow" })).toEqual({ poisonMagnitude: 25 });
    for (const id of ["22817", "36630", "42714", "10576"]) expect(passivePreferenceValues(graph.nodes[id], { focusSkillId: "lightning-arrow" })).toEqual({});
  });
});

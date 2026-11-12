import { spellUtilityHitIds } from "./spellUtilitySkills.fixtures";
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
import { fireLightningHitIds } from "./fireLightningSkills.fixtures";
import { plantSpellIds } from "./plantSkills.fixtures";
import { plantBowHitIds } from "./plantBowSkills.fixtures";
import { macePrimaryIds } from "./macePrimarySkills.fixtures";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const attacks = ["lightning-arrow", "ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear", "galvanic-shards", "explosive-shot", "explosive-grenade", "rake", "maul", "shred", ...remainingAttackIds, ...plantBowHitIds, ...macePrimaryIds, ...quarterstaffPrimaryIds, ...bowPrimaryHitIds, ...spearPrimaryIds, ...monkPrimaryIds, ...maceShieldIds, ...attackClosureIds];
const spells = ["spark", "fireball", "essence-drain", "arc", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "eye-of-winter", "frost-bomb", "flameblast", "frost-wall", "bonestorm", "bone-cage", "hexblast", "unearth", "detonate-dead", ...fireLightningHitIds, ...plantSpellIds, ...spellUtilityHitIds];
const modifiers = [["blindEffect", "Blind Effect"], ["blindDuration", "Blind duration"], ["hinderDuration", "Hinder Duration"]] as const;
const chances = [
  ["blindChance", "chance to Blind Enemies on Hit", undefined, 5],
  ["blindChance", "chance to Blind Enemies on Hit with Attacks", "lightning-arrow", 5],
  ["hinderChance", "chance to Hinder Enemies on Hit with Spells", "spark", 5],
] as const;
const ids = ["blindChance", "blindEffect", "blindDuration", "hinderChance", "hinderDuration"] as const;

describe("outgoing Blind and Hinder preferences", () => {
  it.each(modifiers)("keeps %s increased/reduced, signed, decimal, zero and opt-in", (id, wording) => {
    const passive = node(`  12.5%   INCREASED ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }])).toBe(-1.5);
    expect(scorePassiveNode(passive, [])).toBe(0);
    expect(passivePreferenceValues(node(`0% increased ${wording}`))).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`))).toEqual({ [id]: 0 });
    for (const preset of skillPreferencePresets) expect(passivePreferenceValues(passive, { focusSkillId: preset.id })).toEqual({ [id]: -7.5 });
  });
  it.each(chances)("keeps flat %s points separate from increased chance and final probability", (id, wording, focusSkillId, scale) => {
    const context = { focusSkillId };
    const passive = node(`  7.5%   ${wording.toUpperCase()}  `, `10% ${wording}`);
    expect(passivePreferenceValues(passive, context)).toEqual({ [id]: 17.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 2 }], context)).toBe(17.5 / scale * 2);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    expect(passivePreferenceValues(node(`0% ${wording}`), context)).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`+12.5% ${wording}`, `-5% ${wording}`), context)).toEqual({ [id]: 7.5 });
    expect(passivePreferenceValues(node(`10% ${wording}`, `-10% ${wording}`), context)).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(`150% ${wording}`), [{ id, weight: 1 }], context)).toBe(30);
    for (const text of [`10% increased ${wording}`, `10% reduced ${wording}`, `10% more ${wording}`, `10% less ${wording}`,
      `1.2.3% ${wording}`, `NaN% ${wording}`, `Infinity% ${wording}`]) {
      expect(passivePreferenceValues(node(text), context)).toEqual({});
    }
  });
  it("admits attack Blind and spell Hinder only for explicit reviewed player-hit scopes", () => {
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes("attackBlindChance")).map((p) => p.id).sort()).toEqual([...attacks].sort());
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes("spellHinderChance")).map((p) => p.id).sort()).toEqual([...spells].sort());
    const passive = node("5% chance to Blind Enemies on Hit", "10% chance to Blind Enemies on Hit with Attacks", "15% chance to Hinder Enemies on Hit with Spells");
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Spark", "__proto__"]) {
      const values = { blindChance: attacks.includes(focusSkillId ?? "") ? 15 : 5, ...(spells.includes(focusSkillId ?? "") ? { hinderChance: 15 } : {}) };
      expect(passivePreferenceValues(passive, { focusSkillId }), focusSkillId).toEqual(values);
    }
    expect(passivePreferenceValues(node("15% chance to Hinder Enemies on Hit with Spells"), { focusSkillId: "spark", supportGemIds: ["controlled-destruction"] })).toEqual({ hinderChance: 15 });
    expect(skillPreferencePresets.find((p) => p.id === "detonate-dead")!.passiveStatScopes).not.toContain("spellCriticalDamageBonus");
    expect(skillPreferencePresets.find((p) => p.id === "essence-drain")!.passiveStatScopes).not.toContain("spellCriticalChance");
  });
  it("rejects conditional/owned/incoming/aliased lines instead of assuming application or immunity", () => {
    const lines = [...modifiers.map(([, wording]) => `10% increased ${wording}`), ...chances.map(([, wording]) => `10% ${wording}`)];
    for (const text of lines) for (const raw of [`${text} while stationary`, `${text}\nif you've been Hit Recently`, `${text} per Charge`, `${text} against Bosses`,
      `Minions have ${text}`, `Companions have ${text}`, `Totems have ${text}`, `Allies have ${text}`, `Enemies have ${text}`, `You and your Minions have ${text}`,
      `${text} on you`, `${text} and an unknown effect`]) {
      for (const focusSkillId of ["spark", "lightning-arrow"]) expect(passivePreferenceValues(node(raw), { focusSkillId }), raw).toEqual({});
    }
    for (const raw of ["Cannot be Blinded", "Immune to Hinder", "Enemies near Enemies you Mark are Blinded", "Blind Enemies when they Stun you",
      "10% increased Damage with Hits against Blinded Enemies", "10% increased Critical Hit Chance against Blinded Enemies",
      "10% increased Damage with Hits against Hindered Enemies", "10% reduced Effect of Blind on you", "10% reduced Blind Duration on you",
      "Debuffs you inflict have 10% increased Hinder Duration", "10% increased Hinder Effect", "10% chance to Hinder Enemies on Hit",
      "10% chance to Blind Enemies on Hit with Spells", "Attacks have 10% chance to Blind on Hit", "10% chance to Hinder Enemies on Hit with Attacks"]) {
      expect(passivePreferenceValues(node(raw), { focusSkillId: "spark" }), raw).toEqual({});
    }
    for (const [, wording] of modifiers) for (const raw of [`10% more ${wording}`, `10% less ${wording}`, `+10 to ${wording}`, `-10% increased ${wording}`, `1.2.3% increased ${wording}`]) {
      expect(passivePreferenceValues(node(raw)), raw).toEqual({});
    }
  });
  it("counts application, effect, duration and slow strength once without ailment or Skill Effect Duration fanout", () => {
    const passive = node("5% chance to Blind Enemies on Hit", "10% chance to Blind Enemies on Hit with Attacks",
      "20% increased Blind Effect", "5% reduced Blind Effect", "25% increased Blind duration", "5% reduced Blind duration",
      "30% increased Hinder Duration", "10% reduced Hinder Duration", "Debuffs you inflict have 4% increased Slow Magnitude",
      "100% increased Damage with Hits against Blinded Enemies", "100% increased Damage with Hits against Hindered Enemies");
    expect(passivePreferenceValues(passive, { focusSkillId: "lightning-arrow" })).toEqual({ blindChance: 15, blindEffect: 15, blindDuration: 20, hinderDuration: 20, slowMagnitude: 4 });
    expect(scorePassiveNode(passive, [...ids, "slowMagnitude" as const].map((id) => ({ id, weight: 1 })), { focusSkillId: "lightning-arrow" })).toBe(8.9);
    expect(scorePassiveNode(passive, (["ailmentChance", "skillDuration", "dazeDuration", "chillMagnitude", "curseMagnitude", "genericDamage", "debuffExpirySpeed"] as const)
      .map((id) => ({ id, weight: 3 })), { focusSkillId: "lightning-arrow" })).toBe(0);
    expect(passivePreferenceValues(node("15% chance to Hinder Enemies on Hit with Spells"), { focusSkillId: "spark" })).toEqual({ hinderChance: 15 });
  });
  it("preserves manual priorities and does not auto-suggest control or infer minion/player ownership", () => {
    const settings = normalizePassiveOptimizationSettings({ mode: "weighted", extraPointBudget: 7, focusSkillId: "spark", supportGemIds: ["controlled-destruction"],
      preferences: ids.map((id) => ({ id, weight: 2 })) });
    expect(settings.preferences).toEqual(ids.map((id) => ({ id, weight: 2 })));
    for (const preset of skillPreferencePresets) {
      expect(preset.suggestions.some((s) => ids.some((id) => id === s.id))).toBe(preset.id === "flash-grenade");
      expect(addSkillPresetPreferences(settings, preset).preferences.slice(0, 5)).toEqual(settings.preferences);
    }
  });
  it("covers all 21 game occurrences and thirteen wordings without conditional damage or immunity bonuses", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const counts = Object.fromEntries(ids.map((id) => [id, 0])), wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const stat of n.stats) {
      const attack = passivePreferenceValues(node(stat), { focusSkillId: "lightning-arrow" });
      const spell = passivePreferenceValues(node(stat), { focusSkillId: "spark" });
      for (const id of ids) if (Object.hasOwn(attack, id) || Object.hasOwn(spell, id)) {
        counts[id]++; wordings.add(stat); expect(attack[id] ?? spell[id]).toBeGreaterThan(0);
      }
    }
    expect(counts).toEqual({ blindChance: 10, blindEffect: 6, blindDuration: 1, hinderChance: 2, hinderDuration: 2 });
    expect(wordings.size).toBe(13);
    expect(passivePreferenceValues(graph.nodes["20916"], { focusSkillId: "lightning-arrow" })).toEqual({ attackDamage: 24, blindChance: 10 });
    expect(passivePreferenceValues(graph.nodes["25619"], { focusSkillId: "lightning-arrow" })).toEqual({ attackSpeed: 10, blindChance: 15 });
    expect(passivePreferenceValues(graph.nodes["42347"])).toEqual({ blindChance: 12 });
    expect(passivePreferenceValues(graph.nodes["42354"])).toEqual({ blindEffect: 20 });
    expect(passivePreferenceValues(graph.nodes["38459"])).toEqual({ blindDuration: 25 });
    expect(passivePreferenceValues(graph.nodes["61444"], { focusSkillId: "spark" })).toEqual({ hinderChance: 15 });
    for (const id of ["44563", "59053"]) expect(passivePreferenceValues(graph.nodes[id])).toEqual({ hinderDuration: 20, slowMagnitude: 4 });
    expect(passivePreferenceValues(graph.nodes["54805"])).toEqual({ slowMagnitude: 10 });
  });
});

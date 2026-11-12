import { spellUtilityHitIds } from "./spellUtilitySkills.fixtures";
import { attackClosureAreaIds, attackClosureElementalIds } from "./attackClosureSkills.fixtures";
import { maceShieldIds, maceShieldFireIds } from "./maceShieldSkills.fixtures";
import { monkPrimaryIds, monkPrimaryColdIds } from "./monkPrimarySkills.fixtures";
import { spearPrimaryAreaIds, spearPrimaryElementalIds } from "./spearPrimarySkills.fixtures";
import { bowPrimaryAreaDamageIds, bowPrimaryElementalIds } from "./bowPrimarySkills.fixtures";
import { quarterstaffPrimaryIds, quarterstaffElementalIds } from "./quarterstaffPrimarySkills.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, skillPreferencePresets } from "./skillPreferencePresets";
import { skillPassiveStatScopes } from "./skillSupportPreferences";
import type { TreeGraph, TreeNode } from "./types";
import { remainingAreaIds, remainingElementalIds } from "./remainingAttackSkills.fixtures";
import { ballistaIds } from "./ballistaSkills.fixtures";
import { fireLightningHitIds } from "./fireLightningSkills.fixtures";
import { plantSpellIds } from "./plantSkills.fixtures";
import { plantBowHitIds } from "./plantBowSkills.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { macePrimaryIds } from "./macePrimarySkills.fixtures";

const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const areaIds = ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "rain-of-arrows", "explosive-spear", "explosive-shot", "explosive-grenade", "rake", "maul", "shred", ...remainingAreaIds, "toxic-domain", ...plantBowHitIds, ...poisonBowIds, ...macePrimaryIds, ...quarterstaffPrimaryIds, ...bowPrimaryAreaDamageIds, ...spearPrimaryAreaIds, ...monkPrimaryIds, ...maceShieldIds, ...attackClosureAreaIds, "shockwave-totem", "herald-of-ice"];
const elementalIds = ["lightning-arrow", "ice-strike", "tempest-flurry", "ice-shot", "lightning-spear", "explosive-spear", "galvanic-shards", "explosive-shot", "explosive-grenade", ...remainingElementalIds, "volcanic-fissure", ...quarterstaffElementalIds, ...bowPrimaryElementalIds, ...spearPrimaryElementalIds, ...monkPrimaryColdIds, ...maceShieldFireIds, ...attackClosureElementalIds, "herald-of-ice", "herald-of-thunder"];
const criticalIds = ["spark", "fireball", "arc", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "eye-of-winter",
  "frost-bomb", "flameblast", "frost-wall", "bonestorm", "bone-cage", "hexblast", "unearth", "dark-effigy", ...fireLightningHitIds, ...plantSpellIds, ...spellUtilityHitIds, "arctic-armour"];
const unreviewedControlledDestructionIds = ["dark-effigy", ...fireLightningHitIds, ...plantSpellIds.filter((id) => !["entangle", "thrashing-vines"].includes(id))];
const cases = [
  ["attackAreaDamage", "attackAreaDamage", "Attack Area Damage", [...areaIds, ...ballistaIds]],
  ["elementalDamage", "attackElementalDamage", "Elemental Damage with Attacks", [...elementalIds, "siege-ballista"]],
  ["criticalDamageBonus", "spellCriticalDamageBonus", "Critical Spell Damage Bonus", criticalIds],
] as const;

describe("reviewed skill-scoped damage preferences", () => {
  it.each(cases)("admits %s only for the explicit reviewed component allowlist", (id, scope, wording, allowed) => {
    expect(skillPreferencePresets.filter((p) => p.passiveStatScopes?.includes(scope)).map((p) => p.id).sort()).toEqual([...allowed].sort());
    for (const focusSkillId of [...skillPreferencePresets.map((p) => p.id), undefined, "unknown", "Fireball", "__proto__"]) {
      const expected = allowed.includes(focusSkillId ?? "") ? { [id]: 12.5 } : {};
      expect(passivePreferenceValues(node(`12.5% increased ${wording}`), { focusSkillId }), focusSkillId).toEqual(expected);
      expect(scorePassiveNode(node(`12.5% increased ${wording}`), [{ id, weight: 2 }], { focusSkillId }))
        .toBeCloseTo(Object.keys(expected).length ? 2.5 : 0);
    }
  });
  it.each(cases)("retains reductions, zero and decimal arithmetic for %s without cross-scoring", (id, _scope, wording, allowed) => {
    const context = { focusSkillId: allowed[0] };
    const passive = node(`  12.5%   INCREASED ${wording.toUpperCase()}  `, `20% reduced ${wording}`);
    expect(passivePreferenceValues(passive, context)).toEqual({ [id]: -7.5 });
    expect(scorePassiveNode(passive, [{ id, weight: 3 }], context)).toBeCloseTo(-2.25);
    expect(scorePassiveNode(passive, [], context)).toBe(0);
    expect(scorePassiveNode(passive, [{ id: "attackDamage", weight: 3 }, { id: "spellDamage", weight: 3 },
      { id: "fireDamage", weight: 3 }, { id: "coldDamage", weight: 3 }, { id: "lightningDamage", weight: 3 },
      { id: "criticalChance", weight: 3 }, { id: "areaOfEffect", weight: 3 }], context)).toBe(0);
    expect(passivePreferenceValues(node(`0% increased ${wording}`), context)).toEqual({ [id]: 0 });
    expect(passivePreferenceValues(node(`10% increased ${wording}`, `10% reduced ${wording}`), context)).toEqual({ [id]: 0 });
  });
  it.each(cases)("rejects conditional, owned, composite, more/less and malformed %s wording", (_id, _scope, wording, allowed) => {
    for (const line of [`10% increased ${wording} while stationary`, `10% increased ${wording}\nif you've Crit Recently`,
      `10% increased ${wording} per Charge`, `10% increased ${wording} with Ailments`, `10% increased ${wording} and Area of Effect`,
      `Minions have 10% increased ${wording}`, `Minions deal 10% increased ${wording}`, `Companions have 10% increased ${wording}`,
      `Enemies have 10% increased ${wording}`, `10% more ${wording}`, `10% less ${wording}`, `+10% increased ${wording}`,
      `-10% increased ${wording}`, `1.2.3% increased ${wording}`, `NaN% increased ${wording}`, `Infinity% increased ${wording}`]) {
      expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] }), line).toEqual({});
    }
  });
  it("adds scoped and generic modifiers once in their own preferences", () => {
    expect(passivePreferenceValues(node("10% increased Attack Area Damage", "12% increased Elemental Damage with Attacks",
      "8% increased Elemental Damage", "4% reduced Elemental Damage with Attacks", "20% increased Attack Damage",
      "10% increased Area of Effect"), { focusSkillId: "ice-strike" }))
      .toEqual({ attackAreaDamage: 10, elementalDamage: 16, attackDamage: 20, areaOfEffect: 10 });
    expect(passivePreferenceValues(node("15% increased Critical Spell Damage Bonus", "10% increased Critical Damage Bonus",
      "5% reduced Critical Spell Damage Bonus", "15% increased Critical Hit Chance for Spells"), { focusSkillId: "fireball" }))
      .toEqual({ criticalDamageBonus: 20, criticalChance: 15 });
  });
  it.each(criticalIds.filter((id) => !unreviewedControlledDestructionIds.includes(id)))("blocks %s spell critical bonus under Controlled Destruction, retaining manual generic weights", (focusSkillId) => {
    const preset = skillPreferencePresets.find((p) => p.id === focusSkillId)!;
    const context = { focusSkillId, supportGemIds: ["controlled-destruction"] };
    expect(skillPassiveStatScopes(preset, context.supportGemIds)).not.toContain("spellCriticalDamageBonus");
    const passive = node("15% increased Critical Spell Damage Bonus", "10% increased Critical Damage Bonus");
    expect(passivePreferenceValues(passive, context)).toEqual({ criticalDamageBonus: 10 });
    expect(scorePassiveNode(passive, [{ id: "criticalDamageBonus", weight: 2 }], context)).toBe(2);
    expect(passivePreferenceValues(passive, { focusSkillId })).toEqual({ criticalDamageBonus: 25 });
  });
  it.each(unreviewedControlledDestructionIds)("does not apply unreviewed support compatibility to %s or attacks", (focusSkillId) => {
    expect(passivePreferenceValues(node("15% increased Critical Spell Damage Bonus"), {
      focusSkillId, supportGemIds: ["controlled-destruction"],
    })).toEqual({ criticalDamageBonus: 15 });
    expect(passivePreferenceValues(node("12% increased Elemental Damage with Attacks"), {
      focusSkillId: "ice-strike", supportGemIds: ["brutality-i"],
    })).toEqual({ elementalDamage: 12 });
  });
  it("keeps the new area preference optional and preserves settings without new automatic weights", () => {
    const settings = { mode: "weighted", extraPointBudget: 7, focusSkillId: "ice-strike",
      preferences: [{ id: "attackAreaDamage", weight: 2 }, { id: "elementalDamage", weight: 3 }, { id: "criticalDamageBonus", weight: 1 }] };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
    for (const preset of skillPreferencePresets) {
      expect(preset.suggestions.some((p) => p.id === "attackAreaDamage")).toBe(["explosive-shot", "explosive-grenade", "rake", "maul", "shred", ...remainingAreaIds, ...ballistaIds, "toxic-domain", ...plantBowHitIds, ...poisonBowIds, ...macePrimaryIds, ...quarterstaffPrimaryIds, ...bowPrimaryAreaDamageIds, ...spearPrimaryAreaIds, ...monkPrimaryIds, ...maceShieldIds, ...attackClosureAreaIds, "shockwave-totem", "herald-of-ice"].includes(preset.id));
      expect(addSkillPresetPreferences(normalizePassiveOptimizationSettings(settings), preset).preferences.slice(0, 3)).toEqual(settings.preferences);
    }
  });
  it("covers the reviewed 49 native occurrences without admitting different or conditional wording", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json", "utf8")) as TreeGraph;
    const totals = { attackAreaDamage: 0, elementalDamage: 0, criticalDamageBonus: 0 };
    const wordings = new Set<string>();
    for (const n of Object.values(graph.nodes).filter((n) => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) {
      for (const line of n.stats) for (const [id, , wording, allowed] of cases) {
        if (new RegExp(`^\\d+% increased ${wording}$`, "i").test(line)) {
          const value = Number(line.match(/^\d+/)![0]);
          expect(passivePreferenceValues(node(line), { focusSkillId: allowed[0] })).toEqual({ [id]: value });
          expect(passivePreferenceValues(node(line))).toEqual({});
          totals[id]++;
          wordings.add(line);
        }
      }
    }
    expect(totals).toEqual({ attackAreaDamage: 23, elementalDamage: 14, criticalDamageBonus: 12 });
    expect(wordings.size).toBe(8);
  });
});

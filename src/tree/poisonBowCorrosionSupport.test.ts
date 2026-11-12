import { describe, expect, it } from "vitest";
import { poisonBowCorrosionSupportFixture as support, poisonBowCorrosionNativeFixtures as native, poisonBowCorrosionFireFixture as fire } from "./poisonBowCorrosionSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const preset = (skill: string) => getSkillPreferencePreset(skill)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "poisonMagnitude", weight: 2 }, { id: "armourBreakAmount", weight: 1 }, { id: "fullyBrokenArmourEffect", weight: 1 },
    { id: "armourBreakDuration", weight: 1 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Corrosion for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("admits %s's parent without conflating Armour Break, no-hit Poison and runtime effect coverage", (skill) => {
    const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === support.id)!;
    expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(resolved.summary).toContain("80% of Poison damage, not 80% more Poison DPS or 80% of enemy Armour");
    expect(resolved.summary).toContain("Adds no Poison chance");
    expect(resolved.summary).toContain("Cannot support skills that Consume Fully Broken Armour");
    expect(resolved.summary).toContain("parent is compatible through its arrow-hit skill");
    expect(resolved.summary).toContain(skill === "gas-arrow" ? "cloud still poisons without hitting" : "no-hit burst remains separate");
    expect(resolved.summary).toContain("runtime does not calculate this support's Armour Break amount/timing");
    expect(resolved.summary).toContain("zero output is not zero game effect");
    expect(resolved.summary).toContain("No assumed Fully Broken Armour, Corrosion stacks or uptime");
    expect(resolved.priorities).toEqual([]);
    const current = settings(skill);
    const selected = setSkillSupport(current, support.id, true);
    expect(selected).toEqual({ ...current, supportGemIds: [support.id] });
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
    expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
    expect(addSkillPresetPreferences(selected, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    expect(setSkillSupport(selected, support.id, false)).toEqual({ ...current, supportGemIds: [] });
  });

  it.each(poisonBowIds)("saves %s's Corrosion and existing ailment families without editing goals, budget or weights", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["poison-iii", "bleed-iii", "admixture", "efficiency-ii"] };
    const selected = setSkillSupport(current, support.id, true);
    expect(selected).toEqual({ ...current, supportGemIds: [...current.supportGemIds, support.id] });
    expect(normalizeSkillSupportIds(skill, [support.id, support.id, "poison-iii", "bleed-iii", "admixture", "bad", null]))
      .toEqual([support.id, "poison-iii", "bleed-iii", "admixture"]);
    expect(setSkillSupport(selected, "bleed-ii", true).supportGemIds).toEqual(["poison-iii", "admixture", "efficiency-ii", support.id, "bleed-ii"]);
    expect(setSkillSupport(selected, support.id, false)).toEqual(current);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(restored.state.selectedClassStartId).toBe("ranger");
  });

  it.each(native)("keeps $skill's Poison and eligible-hit boundary unchanged with Corrosion while charging its Mana cost", (f) => {
    expect(f.supportedPoison).toBe(f.poison);
    expect(f.supportedArrowHasPoison).toBe(f.arrowHasPoison);
    expect(f.arrowHasPoison).toBe(false);
    expect(f.rawArrowChance).toBe(0);
    expect(f.supportedRawArrowChance).toBe(f.rawArrowChance);
    expect(f.supportedPoison3ArrowChance).toBe(f.poison3ArrowChance);
    expect(f.poison3ArrowChance).toBe(60);
    expect(f.supportedPoison3ArrowPoison).toBe(f.poison3ArrowPoison);
    for (const [supported, baseline] of [[f.supportedHit, f.hit], [f.supportedArrowHit, f.arrowHit], [f.supportedMagnitude, f.magnitude],
      [f.supportedDuration, f.duration], [f.supportedPoisonDuration, f.poisonDuration], [f.supportedStacks, f.stacks],
      [f.supportedChance, f.chance], [f.supportedRadius, f.radius], [f.supportedRate, f.rate]]) expect(supported).toBe(baseline);
    expect(f.supportedMana).toBe(Math.floor(f.mana * (1 + support.manaMultiplier / 100)));
    expect(f.efficiencyMana).toBe(Math.ceil(f.supportedMana * .6));
    // Cost multipliers combine before rounding; do not multiply an already-rounded Poison III cost.
    expect(f.supportedPoison3Mana).toBe(Math.floor(f.mana * 1.2 * 1.1));
    expect(f.supportedTrioMana).toBe(Math.floor(f.mana * 1.2 * 1.2 * 1.1));
  });

  it("keeps the source ratio in Armour units rather than converting it into bonus Poison DPS", () => {
    const poisonDamageActuallyDealt = 100;
    const nominalArmourBreakBeforeCaps = poisonDamageActuallyDealt * support.poisonDamageAsArmourBreak / 100;
    expect(nominalArmourBreakBeforeCaps).toBe(80);
    // A unit check, not an app damage/timing simulation or a claim about enemy Armour, duration or uptime.
  });

  it.each(native)("reports $skill's missing native Armour Break amount/timing without assuming a fully broken target", (f) => {
    expect(f.baseBreakPerHit).toBe(0);
    expect(f.supportedBreakPerHit).toBe(0);
    expect(f.supportedCanArmourBreak).toBe(f.canArmourBreak);
    expect(f.supportedCanCorrode).toBe(f.canCorrode);
    expect(f.enemyFullyBroken).toBe(false);
    expect(f.enemyArmour).toBeGreaterThan(0);
    expect(f.supportedEnemyArmour).toBe(f.enemyArmour);
    expect(f.increasedBreakPercent).toBe(100);
    expect(f.increasedBreakPerHit).toBe(0);
    expect(f.increasedBreakPoison).toBe(f.poison);
    expect(f.supportedDoubledMagnitudePoison).toBe(f.doubledMagnitudePoison);
    expect(f.doubledMagnitudePoison).toBeCloseTo(f.poison * 2);
    expect(f.supportedDoubledDurationPoison).toBe(f.doubledDurationPoison);
    expect(f.supportedDoubledPoisonDuration).toBe(f.doubledPoisonDuration);
    expect(f.doubledPoisonDuration).toBe(f.poisonDuration * 2);
  });

  it.each(native)("does not let $skill's Corrosion activate Poison III/Admixture conditions or feed back into Poison", (f) => {
    expect(f.trioEnemyBleeding).toBe(false);
    expect(f.trioEnemyPoisoned).toBe(false);
    expect(f.trioPoison).toBe(f.poison);
    expect(f.supportedTrioPoison).toBe(f.trioPoison);
    expect(f.supportedTrioBothPoison).toBe(f.trioBothPoison);
    expect(f.trioBothMagnitude).toBe(1.44);
    expect(f.trioBothPoison).toBeCloseTo(f.poison * 1.2 * 1.2);
  });

  it("does not grant Poison to Gas Arrow's conditional Fire explosion", () => {
    expect(fire.supportedHit).toBe(fire.hit);
    expect(fire.hasPoison).toBe(false);
    expect(fire.supportedHasPoison).toBe(false);
  });

  it.each(poisonBowIds)("keeps %s's chosen Armour Break priorities, scopes and scores unchanged", (skill) => {
    const current = settings(skill);
    for (const supportGemIds of [[support.id], [support.id, "poison-iii", "bleed-iii", "admixture"]]) {
      const selected = { ...current, supportGemIds };
      for (const p of [node("20% increased Magnitude of Poison you inflict"), node("Break 20% increased Armour"),
        node("20% increased effect of Fully Broken Armour", "20% increased Armour Break Duration"), node("20% increased Attack Damage"),
        node("20% increased Spell Damage"), node("Minions deal 100% increased Damage", "100% increased Damage with Plant Skills")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(preset(skill), supportGemIds)).toEqual(preset(skill));
    }
  });

  it("does not infer other skill-pair reviews from Poison tags or an unrelated Corrosion-stack configuration", () => {
    expect(reviewedSkillSupports.find((s) => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "entangle", "fireball", "skeletal-sniper", "contagion"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
  });
});

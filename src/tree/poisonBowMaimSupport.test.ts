import { describe, expect, it } from "vitest";
import { poisonBowMaimSupportFixture as support, poisonBowMaimEnemyFixtures as enemies,
  poisonBowMaimComponentFixtures as components, poisonBowMaimPoisonFixtures as poisons } from "./poisonBowMaimSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "maimChance", weight: 1 }, { id: "slowMagnitude", weight: 2 }, { id: "poisonMagnitude", weight: 3 }, { id: "evasion", weight: 1 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Maim for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("adds %s's eligible-attack support without promising contact, Poison scaling or native application", (skill) => {
    const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === support.id)!;
    expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(resolved.summary).toContain(`${support.chanceOnAttackHit}% chance to Maim on eligible attack hits, not guaranteed contact or uptime`);
    expect(resolved.summary).toContain(`${support.enemyMovementReduction}% reduced Movement Speed and ${support.enemyEvasionReduction}% reduced Evasion`);
    expect(resolved.summary).toContain("additive with increases/reductions, not less multipliers");
    expect(resolved.summary).toContain("not player Movement Speed/Evasion, an action-speed slow or direct Poison/Physical damage");
    expect(resolved.summary).toContain(skill === "gas-arrow" ? "no-hit cloud and its Poison cannot apply Maim" : "no-hit burst and linked Poison cannot apply Maim");
    expect(resolved.summary).toContain("does not map its Maim-on-hit chance");
    expect(resolved.summary).toContain("enemy penalties require explicit Maim configuration");
    expect(resolved.summary).toContain("not real burst/cloud hits or a Poison multiplier");
    expect(resolved.summary).toContain("No added Mana cost multiplier");
    expect(resolved.summary).toContain("no debuff uptime, chase time or boss benefit is assumed");
    expect(resolved.priorities).toEqual([]);
    const current = settings(skill), selected = setSkillSupport(current, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(selected).toEqual({ ...current, supportGemIds: [support.id] });
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
    expect(addSkillPresetPreferences(selected, preset).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    expect(setSkillSupport(selected, support.id, false)).toEqual({ ...current, supportGemIds: [] });
  });

  it.each(poisonBowIds)("round-trips %s's class/goals/budget and other links while preserving Blindside's prohibition", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["blindside", "blind-ii", "poison-iii", "efficiency-ii"] };
    const selected = setSkillSupport(current, support.id, true);
    expect(setSkillSupport(selected, support.id, true)).toEqual(selected);
    expect(selected.supportGemIds).toEqual([...current.supportGemIds, support.id]);
    expect(selectedSkillSupports(getSkillPreferencePreset(skill)!, selected.supportGemIds).find((s) => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(restored.state.selectedClassStartId).toBe("ranger");
    expect(normalizeSkillSupportIds(skill, ["maim", "maim", "maim-ii", "blindside", null])).toEqual(["maim", "blindside"]);
    expect(setSkillSupport(selected, support.id, false)).toEqual(current);
  });

  it.each(enemies)("checks additive enemy reductions at +$increased%, Maim=$maimed without altering player ratings", (f) => {
    const evasionFactor = 1 + f.increased / 100 - (f.maimed ? support.enemyEvasionReduction / 100 : 0);
    const movementFactor = 1 + f.increased / 100 - (f.maimed ? support.enemyMovementReduction / 100 : 0);
    expect(f.evasion).toBeCloseTo(996 * evasionFactor, 9);
    expect(f.evasionInc).toBe(f.increased - (f.maimed ? 15 : 0));
    expect(f.movementInc).toBe(f.increased - (f.maimed ? 30 : 0));
    expect(f.movementFactor).toBeCloseTo(movementFactor, 9);
    expect(f.evasionMore).toBe(1);
    if (f.increased && f.maimed) {
      expect(evasionFactor).not.toBe((1 + f.increased / 100) * 0.85);
      expect(movementFactor).not.toBe((1 + f.increased / 100) * 0.7);
    }
  });

  it.each(components)("separates $skill's $component hit eligibility from configured hit/crit estimates", (f) => {
    // Accuracy-restricted native fixture: only explicit enemy Maim changes these hit-weighted estimates.
    expect(f.hit[0]).toBeCloseTo(f.physical * 1.043 + f.fire * 1.043, 9);
    expect(f.hit[1]).toBeCloseTo(f.physical * 1.045 + f.fire * 1.045, 9);
    expect(support.manaMultiplier).toBe(0);
    expect(f.mana).toBe(f.skill === "gas-arrow" ? 62 : 38);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find((s) => s.id === support.id)!.summary).toContain("cannot apply Maim");
    if (f.component === "conditional Fire explosion") expect(reviewedSkillSupportsFor(f.skill).find((s) => s.id === support.id)!.summary).toContain("ignition/detonation and contact are not supplied");
  });

  it.each(poisons)("keeps %s's Poison timers and direct magnitude separate from explicit-state model estimates", (f) => {
    expect(support.nativeChanceMapped).toBe(false);
    expect(support.nativeSupportTypeAdded).toBe(true);
    expect(support.automaticEnemyCondition).toBe(false);
    expect(f.nativePoisonEstimate[1]).toBeGreaterThan(f.nativePoisonEstimate[0]);
    expect(f.nativeArrowPoisonIIIEstimate[1]).toBeGreaterThan(f.nativeArrowPoisonIIIEstimate[0]);
    // These model differences are not a universal Poison multiplier or proof of no-hit component crits.
    expect(f.nativePoisonEstimate[1] / f.nativePoisonEstimate[0]).toBeLessThan(1.02);
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.skillTimer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
    expect(f.arrowMana).toBe(f.skill === "gas-arrow" ? 74 : 45);
  });

  it.each(poisonBowIds)("preserves %s's manual values/scopes and route scores without treating support text as unconditional passives", (skill) => {
    const current = settings(skill), selected = setSkillSupport(current, support.id, true);
    for (const p of [node("20% increased Movement Speed"), node("20% increased Evasion Rating"), node("20% increased Magnitude of Poison you inflict"),
      node("Debuffs you inflict have 20% increased Slow Magnitude"), node("Attacks have 10% chance to Maim on Hit"),
      node("10% increased Attack Damage against Maimed Enemies"), node("Minions have 20% increased Movement Speed")]) {
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
    }
    expect(passivePreferenceValues(node("Attacks have 10% chance to Maim on Hit"), selected)).toEqual({});
    expect(passivePreferenceValues(node("Debuffs you inflict have 20% increased Slow Magnitude"), selected)).toEqual({ slowMagnitude: 20 });
    expect(passivePreferenceValues(node("Supported Attacks always Maim on Hit"), selected)).toEqual({});
    expect(getSkillPreferencePreset(skill)!.passiveStatScopes ?? []).not.toContain("attackMaimChance");
  });

  it("does not auto-admit unreviewed parents or invented Maim tiers", () => {
    expect(reviewedSkillSupports.find((s) => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
    for (const skill of poisonBowIds) for (const id of ["maim-i", "maim-ii"])
      expect(setSkillSupport(settings(skill), id, true)).toEqual(settings(skill));
  });
});

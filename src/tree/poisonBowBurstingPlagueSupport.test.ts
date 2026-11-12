import { describe, expect, it } from "vitest";
import { poisonBowBurstingPlagueSupportFixture as support, poisonBowBurstingPlagueNativeFixtures as native,
  poisonBowBurstingPlagueChildFixtures as children, poisonBowBurstingPlagueHitFixtures as hits } from "./poisonBowBurstingPlagueSupport.fixtures";
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
  preferences: [{ id: "poisonMagnitude", weight: 2 }, { id: "physicalDamage", weight: 1 }, { id: "areaOfEffect", weight: 1 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Bursting Plague for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("admits %s with enemy-owned storage and a separate player burst, not free Poison or boss DPS", (skill) => {
    const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === support.id)!;
    expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(resolved.summary).toContain("20% of that enemy's maximum Life");
    expect(resolved.summary).toContain("player-owned Physical area hit triggers on that enemy's death");
    expect(resolved.summary).toContain("not an extra Poison-DPS bonus");
    expect(resolved.summary).toContain("PoB does not calculate Plague buildup or burst damage");
    expect(resolved.summary).toContain("kills, cap saturation and boss uptime are not assumed");
    expect(resolved.summary).toContain(skill === "gas-arrow" ? "not Gas Arrow's conditional Fire explosion" : "initial arrow must hit");
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

  it.each(poisonBowIds)("round-trips %s with its other support families, goal, class and budget intact", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["escalating-poison", "deadly-poison-ii", "prolonged-duration-ii", "efficiency-ii"] };
    const selected = setSkillSupport(current, support.id, true);
    expect(selected.supportGemIds).toEqual([...current.supportGemIds, support.id]);
    expect(normalizeSkillSupportIds(skill, [support.id, support.id, "unreviewed-swift-affliction", null, "bad"])).toEqual([support.id]);
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

  it.each(native)("keeps $skill's Poison, hit damage, duration and coverage unchanged while charging the parent", (f) => {
    for (const [actual, baseline] of [[f.supportedPoison, f.poison], [f.supportedHit, f.hit], [f.supportedDuration, f.duration],
      [f.supportedPoisonDuration, f.poisonDuration], [f.supportedMagnitude, f.magnitude], [f.supportedStacks, f.stacks],
      [f.supportedRate, f.rate], [f.supportedRadius, f.radius]]) expect(actual).toBe(baseline);
    expect(f.childEffectId).toBe(support.childEffectId);
    expect(f.ownerIsPlayer).toBe(true);
    expect(f.hasMinion).toBe(false);
    expect(f.supportedMana).toBe(Math.floor(f.mana * (1 + support.manaMultiplier / 100)));
    expect(f.efficiencyMana).toBe(Math.ceil(f.supportedMana * .6));
    expect(f.burstingEscalatingPoison).toBe(f.escalatingOnlyPoison);
    expect(f.burstingDeadlyPoison).toBe(f.deadlyOnlyPoison);
    expect(f.combinedMagnitude).toBe(2);
    expect(f.combinedStacks).toBe(2);
    expect(f.combinedPoisonDuration).toBeCloseTo(f.poisonDuration * .8 * (f.skill === "poisonburst-arrow" ? 1.35 : 1));
    expect(f.combinedMana).toBe(Math.ceil(Math.floor(f.mana * 1.2 * 1.2) * .6));
  });

  it.each(children)("records $parent's granted child as unmodeled damage, not a verified zero-damage burst", (f) => {
    expect(f.selected).toBe(support.childEffectId);
    expect(f.ownerIsPlayer).toBe(true);
    expect(f.hasMinion).toBe(false);
    expect(f.attack).toBe(false);
    expect(f.spell).toBe(false);
    expect(f.area).toBe(true);
    expect(f.triggered).toBe(true);
    expect(Object.values(support.coverage)).toEqual([false, false, false, false, false]);
    expect(f.nativeDamage).toBe(0);
    expect(f.nativeDPS).toBe(0);
    expect(f.nativeMana).toBe(0);
    expect(f.nativeCooldown).toBeGreaterThan(support.childBaseCooldown);
    expect(f.radius).toBe(support.childBaseRadius);
    expect(f.magnifiedRadius).toBe(Math.floor(f.radius * Math.sqrt(f.magnifiedArea)));
    // Maximum-Plague area and burst cadence are not evaluated by these ordinary area/cooldown outputs.
    expect(f.magnifiedRadius).toBeLessThan(f.radius * 2);
  });

  it("keeps source storage/cap/conversion units distinct without inventing a time-to-cap or burst-DPS calculation", () => {
    expect(support.storagePercent).toBe(100);
    expect(support.physicalFromStoredPercent).toBe(100);
    expect(support.ignoreMinionTypes).toBe(true);
    const enemyLife = 10000;
    const storageCap = enemyLife * support.enemyLifeCapPercent / 100;
    expect(storageCap).toBe(2000);
    expect(500 * support.physicalFromStoredPercent / 100).toBe(500);
    expect(Math.floor(support.childBaseRadius * Math.sqrt(1 + support.childMaximumAreaMore / 100))).toBe(25);
    expect(support.coverage.plagueStorage).toBe(false);
    expect(support.coverage.burstDamageFromStorage).toBe(false);
    // This source-unit arithmetic is not a simulator or a promise that a living boss supplies a burst.
  });

  it.each(hits)("does not mix $skill / $component into the separately granted Physical burst", (f) => {
    expect(f.supportedHit).toBe(f.hit);
    expect(f.supportedMana).toBe(Math.floor(f.mana * 1.2));
  });

  it.each(poisonBowIds)("does not inflate %s's passive scores or transfer Bow, Spell, Plant or minion scopes to the burst", (skill) => {
    const current = settings(skill);
    const selected = setSkillSupport(current, support.id, true);
    for (const p of [node("20% increased Magnitude of Poison you inflict"), node("20% increased Physical Damage"), node("10% increased Area of Effect"),
      node("20% increased Attack Damage"), node("20% increased Spell Damage"), node("Minions deal 100% increased Damage", "100% increased Damage with Plant Skills")]) {
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
    }
    expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).passiveStatScopes).toEqual(preset(skill).passiveStatScopes);
    expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).exclusions).toEqual(preset(skill).exclusions);
  });

  it("admits only the reviewed parents, not other Poison users, minions or held focuses", () => {
    expect(reviewedSkillSupports.find((s) => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "entangle", "fireball", "skeletal-sniper", "contagion"]) {
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
      expect(reviewedSkillSupportsFor(skill).some((s) => s.id === support.id)).toBe(false);
    }
  });
});

import { describe, expect, it } from "vitest";
import { poisonBowBlindSupportFixtures as supports, poisonBowBlindEnemyFixture as enemy,
  poisonBowBlindComponentFixtures as components, poisonBowBlindPoisonFixtures as poisons } from "./poisonBowBlindSupports.fixtures";
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
  preferences: [{ id: "blindChance", weight: 1 }, { id: "blindEffect", weight: 2 }, { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Blind I/II for reviewed Poison bow focuses", () => {
  it.each(supports)("admits $name with eligible-hit application, enemy ownership and no automatic Poison boost", (f) => {
    for (const skill of poisonBowIds) {
      const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(resolved.summary).toContain(`${f.chance}% chance to Blind on eligible hits, not guaranteed contact or uptime`);
      expect(resolved.summary).toContain(skill === "gas-arrow" ? "no-hit cloud and its Poison cannot apply Blind" : "no-hit burst and linked Poison cannot apply Blind");
      expect(resolved.summary).toContain("enemy ratings, not player ratings or direct Poison damage");
      expect(resolved.summary).toContain("synthetic source-hit Blind fields and hit/crit-based Poison estimates are not real burst/cloud hits or a Poison multiplier");
      expect(resolved.summary).toContain(`${f.manaMultiplier}% higher Mana cost before rounding`);
      expect(resolved.summary).toContain("no debuff uptime or sustain is assumed");
      expect(resolved.priorities).toEqual([]);
      if (f.increasedEffect) expect(resolved.summary).toContain(`${f.increasedEffect}% increased Blind effect gives enemies 24% less Accuracy and Evasion without other effect modifiers, not 40% less`);
      else expect(resolved.summary).toContain("Base Blind gives enemies 20% less Accuracy and Evasion");
      const current = settings(skill);
      const selected = setSkillSupport(current, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
      expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
      expect(addSkillPresetPreferences(selected, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
      expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
    }
  });

  it.each(poisonBowIds)("replaces only %s's Blind tier and round-trips both tiers, other links, goals, class and point budget", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["poison-iii", "culling-strike-ii", "compressed-duration-ii", "efficiency-ii"] };
    let selected: PassiveOptimizationSettings = current;
    for (const f of supports) {
      selected = setSkillSupport(selected, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [...current.supportGemIds, f.id] });
      const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
        selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
        allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
      } }]);
      const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
      expect(restored.state.optimizerSettings).toEqual(selected);
      expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
      expect(restored.state.selectedClassStartId).toBe("ranger");
    }
    expect(normalizeSkillSupportIds(skill, ["blind-ii", "blind-i", "blind-ii", "culling-strike-ii", null, "bad"]))
      .toEqual(["blind-ii", "culling-strike-ii"]);
    expect(setSkillSupport(selected, "blind-ii", false)).toEqual(current);
  });

  it("checks multiplicative enemy rating reductions without treating effect, application or uptime as interchangeable", () => {
    for (let i = 0; i < enemy.effectIncrease.length; i++) {
      const less = i === 0 ? 0 : 20 * (1 + enemy.effectIncrease[i] / 100);
      expect(enemy.ratingMore[i]).toBeCloseTo(1 - less / 100);
      expect(enemy.accuracy[i]).toBeCloseTo(enemy.accuracy[0] * enemy.ratingMore[i]);
      expect(enemy.evasion[i]).toBeCloseTo(enemy.evasion[0] * enemy.ratingMore[i]);
      expect(enemy.playerAccuracy[i]).toBe(657);
      expect(enemy.playerEvasion[i]).toBe(1007);
      expect(enemy.playerEffectIncrease[i]).toBe(0);
    }
    expect(enemy.tierIIOffRatings).toEqual([enemy.accuracy[0], enemy.evasion[0]]);
    expect(enemy.explicitIPlus20Ratings).toEqual([enemy.accuracy[2], enemy.evasion[2]]);
    expect(enemy.explicitIPlus20HitChance).toBe(enemy.hitChance[2]);
    expect(enemy.chanceWithSupport).toBe(100);
    expect(enemy.chanceWithoutSupport).toBe(0);
    expect(enemy.hitChance.every((chance) => chance < enemy.chanceWithSupport)).toBe(true);
    expect(enemy.hitChance).toEqual([86, 92, 93, 94]);
    expect(enemy.evadeChance).toEqual([9, 11, 12, 12]);
    expect(enemy.ratingMore[2]).not.toBe(.6);
    expect(enemy.ratingMore[3]).not.toBe(.8 * .76);
    // Explicitly enabled Blind is a condition/control, not a guaranteed outcome of selecting the support.
  });

  it.each(components)("keeps $skill's $component hit/crit estimate, base damage and cost distinctions explicit", (f) => {
    for (const [i, s] of supports.entries()) expect(f.tierMana[i]).toBe(Math.floor(f.mana * (1 + s.manaMultiplier / 100)));
    expect(f.physicalHit.every((value) => value === f.physicalHit[0])).toBe(true);
    expect(f.fireHit.every((value) => value === f.fireHit[0])).toBe(true);
    for (let i = 0; i < f.averageHit.length; i++) expect(f.totalDPS[i]).toBeCloseTo(f.averageHit[i] * 1.2 * enemy.hitChance[i] / 100, 10);
    expect(f.averageHit[2]).toBeGreaterThan(f.averageHit[0]);
    if (!f.actualHit) {
      const summary = reviewedSkillSupportsFor(f.skill).find((s) => s.id === "blind-ii")!.summary;
      expect(summary).toContain("synthetic source-hit Blind fields");
      expect(summary).toContain("not real burst/cloud hits or a Poison multiplier");
    }
  });

  it.each(poisons)("does not claim $skill's condition-dependent native Poison estimate is direct magnitude or no-hit Blind", (f) => {
    expect(f.offTierPoison).toEqual([f.offPoison, f.offPoison]);
    expect(f.magnitude).toEqual([1, 1, 1]);
    expect(f.chance).toEqual([100, 100, 100]);
    expect(f.stacks).toEqual([1, 1, 1]);
    expect(f.duration.every((v) => v === f.duration[0])).toBe(true);
    expect(f.skillDuration.every((v) => v === f.skillDuration[0])).toBe(true);
    expect(f.onPoison[0]).toBeGreaterThan(f.offPoison);
    expect(f.onPoison[1]).toBeGreaterThan(f.onPoison[0]);
    expect(f.explicitIPlus20Poison).toBe(f.onPoison[1]);
    expect(f.explicitIIPlus20Poison).toBeGreaterThan(f.onPoison[1]);
    expect(f.onPoison[1]).not.toBeCloseTo(f.offPoison * 1.2);
    expect(f.arrowOffTierPoison).toEqual([f.arrowOffPoison, f.arrowOffPoison]);
    expect(f.arrowChance).toEqual([60, 60]);
    expect(f.arrowDuration).toEqual([2, 2]);
    for (let i = 0; i < supports.length; i++) {
      expect(f.arrowOnPoison[i]).toBeGreaterThan(f.arrowOffPoison);
      expect(f.arrowBothMana[i]).toBe(Math.floor(f.baseMana * 1.2 * 1.1));
    }
    expect(f.arrowPoisonMana).toBe(Math.floor(f.baseMana * 1.2));
  });

  it("keeps the Fire explosion's conditional hit separate from no-hit Poison and does not supply ignition", () => {
    const f = components.find((row) => row.component === "conditional Fire explosion")!;
    expect(f.actualHit).toBe(true);
    expect(f.suppliesPoison).toBe(false);
    for (const s of supports) {
      const summary = reviewedSkillSupportsFor("gas-arrow").find((entry) => entry.id === s.id)!.summary;
      expect(summary).toContain("separately triggered Fire explosion can hit");
      expect(summary).toContain("ignition/detonation and contact are not supplied");
    }
  });

  it.each(poisonBowIds)("preserves %s's existing scope/ownership, manual Blind priorities and route scores", (skill) => {
    const current = settings(skill);
    for (const s of supports) for (const supportGemIds of [[s.id], [s.id, "culling-strike-ii", "poison-iii"]]) {
      const selected = { ...current, supportGemIds };
      for (const p of [node("10% chance to Blind Enemies on Hit"), node("10% chance to Blind Enemies on Hit with Attacks"),
        node("20% increased Blind Effect", "20% increased Blind duration"), node("20% increased Accuracy Rating", "20% increased Evasion Rating"),
        node("20% increased Magnitude of Poison you inflict"), node("20% increased Damage over Time"),
        node("20% increased Damage with Hits against Blinded Enemies"), node("20% reduced Effect of Blind on you"),
        node("Minions have 10% chance to Blind Enemies on Hit", "100% increased Damage with Plant Skills")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(preset(skill), supportGemIds)).toEqual(preset(skill));
    }
  });

  it("does not auto-admit unreviewed hit/DoT/minion parents or unknown tiers", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.find((entry) => entry.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "blind-unknown", true)).toEqual(settings(skill));
  });
});

import { describe, expect, it } from "vitest";
import { poisonBowPoisonSupportFixtures as supports, poisonBowPoisonNativeFixtures as native,
  poisonBowPoisonArrowFixtures as arrows, poisonBowPoisonFireFixture as fire } from "./poisonBowPoisonSupports.fixtures";
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
  preferences: [{ id: "poisonChance", weight: 1 }, { id: "poisonMagnitude", weight: 2 }, { id: "bleedingChance", weight: 1 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Poison I/II/III for reviewed Poison bow focuses", () => {
  it.each(supports)("admits $name for both parents without treating on-hit chance as inherent Poison magnitude", (f) => {
    for (const skill of poisonBowIds) {
      const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(resolved.summary).toContain(`${f.chance}% chance to Poison on eligible hits, not ${f.chance}% increased chance`);
      expect(resolved.summary).toContain("Inherent burst/cloud Poison does not need this chance");
      expect(resolved.summary).toContain(skill === "gas-arrow" ? "chance alone does not let Fire damage Poison" : "separate on-hit Poison is outside this burst focus");
      if (f.bleedingMagnitudeMore) {
        expect(resolved.summary).toContain("20% more Poison magnitude only against Bleeding enemies");
        expect(resolved.summary).toContain("this support does not cause Bleeding");
        expect(resolved.summary).toContain("Bleeding and its uptime are not assumed");
      } else expect(resolved.summary).not.toContain("20% more Poison magnitude");
      expect(resolved.priorities).toEqual([]);
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

  it.each(poisonBowIds)("replaces only %s's Poison tier and round-trips the selected tier, goals and budget", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["escalating-poison", "deadly-poison-ii", "efficiency-ii"] };
    let selected: PassiveOptimizationSettings = current;
    for (const f of supports) {
      selected = setSkillSupport(selected, f.id, true);
      expect(selected.supportGemIds).toEqual([...current.supportGemIds, f.id]);
      expect(selected.preferences).toEqual(current.preferences);
    }
    expect(normalizeSkillSupportIds(skill, ["poison-ii", "poison-i", "poison-iii", "poison-ii", "bad", null])).toEqual(["poison-ii"]);
    expect(setSkillSupport(selected, "poison-iii", false)).toEqual(current);
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

  it.each(native)("keeps $skill's inherent Poison capped and unchanged without Bleeding, including per-use cost", (f) => {
    expect(f.noHitComponent).toBe(true);
    supports.forEach((s, index) => {
      expect(f.rawTierChance[index]).toBe(100 + s.chance);
      expect(f.tierChance[index]).toBe(Math.min(100, f.rawTierChance[index]));
      expect(f.tierPoison[index]).toBe(f.poison);
      expect(f.tierMagnitude[index]).toBe(1);
      expect(f.tierDuration[index]).toBe(f.duration);
      expect(f.tierPoisonDuration[index]).toBe(f.poisonDuration);
      expect(f.tierHit[index]).toBe(f.hit);
      expect(f.tierRate[index]).toBe(f.rate);
      expect(f.tierRadius[index]).toBe(f.radius);
      expect(f.tierStacks[index]).toBe(f.stacks);
      expect(f.tierMana[index]).toBe(Math.floor(f.mana * (1 + s.manaMultiplier / 100)));
    });
    expect(f.extraChanceRaw).toBe(100 + supports[2].chance + 60);
    expect(f.extraChanceFinal).toBe(Math.min(100, f.extraChanceRaw));
    expect(f.extraChancePoison).toBe(f.poison);
    expect(f.efficiencyMana).toBe(Math.ceil(f.tierMana[2] * .6));
  });

  it.each(native)("checks $skill's explicitly enabled Bleeding modifier against an independent magnitude-only control", (f) => {
    expect(f.tier3Bleeding).toBe(true);
    expect(f.bleedingOnlyPoison).toBe(f.poison);
    expect(f.tier2BleedingPoison).toBe(f.poison);
    expect(f.tier3BleedingMagnitude).toBe(1 + supports[2].bleedingMagnitudeMore / 100);
    expect(f.tier3BleedingPoison).toBeCloseTo(f.poison * f.tier3BleedingMagnitude);
    expect(f.magnitudeOnlyPoison).toBe(f.tier3BleedingPoison);
    expect(f.escalatingBleedingPoison).toBeCloseTo(f.escalatingPoison * 1.2);
    expect(f.escalatingBleedingMagnitude).toBe(1.2);
    expect(f.escalatingStacks).toBe(2);
    expect(f.escalatingPoisonDuration).toBeCloseTo(f.poisonDuration * .8);
    expect(f.combinedMagnitude).toBeCloseTo(2 * 1.2);
    expect(f.combinedHit).toBeLessThan(f.hit);
    expect(f.combinedMana).toBe(f.efficiencyMana);
    // The checked PoB condition is an input, not evidence this skill applies or sustains Bleeding.
  });

  it.each(arrows)("keeps %s's separately enabled arrow Poison outside its inherent Poison focus", (f) => {
    expect(f.baseChance).toBe(0);
    supports.forEach((s, index) => {
      expect(f.tierChance[index]).toBe(s.chance);
      expect(f.tierHit[index]).toBe(f.hit);
    });
    expect(f.tierPoison[0]).toBeGreaterThan(0);
    expect(f.tierPoison[1]).toBe(f.tierPoison[2]);
    expect(f.tier3BleedingPoison).toBeCloseTo(f.tierPoison[2] * 1.2);
    expect(f.extraChanceRaw).toBe(supports[2].chance + 60);
    expect(f.extraChanceFinal).toBe(Math.min(100, f.extraChanceRaw));
    if (f.skill === "poisonburst-arrow") expect(f.poisonDuration).not.toBe(f.inherentPoisonDuration);
  });

  it("does not mistake Gas Arrow's Fire-explosion chance/magnitude fields for actual Poison damage", () => {
    expect(fire.tierHit).toEqual([fire.hit, fire.hit, fire.hit]);
    expect(fire.tierChance).toEqual(supports.map((s) => s.chance));
    expect(fire.tierHasPoisonDamage).toEqual([false, false, false]);
    expect(fire.tier3BleedingMagnitude).toBe(1.2);
    expect(fire.tier3BleedingHasPoisonDamage).toBe(false);
  });

  it.each(poisonBowIds)("does not assume Bleeding in %s's route score, overwrite manual chance or broaden hit/owner scopes", (skill) => {
    const current = settings(skill);
    for (const s of supports) {
      const selected = setSkillSupport(current, s.id, true);
      for (const p of [node("20% increased Magnitude of Poison you inflict"), node("10% chance to Poison on Hit"), node("10% chance to inflict Bleeding on Hit"),
        node("20% increased Attack Damage"), node("20% increased Spell Damage"), node("Minions deal 100% increased Damage", "100% increased Damage with Plant Skills")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).passiveStatScopes).toEqual(preset(skill).passiveStatScopes);
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).exclusions).toEqual(preset(skill).exclusions);
    }
  });

  it("does not infer these tiers for other Poison-capable, minion or held focuses", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.find((entry) => entry.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow", "toxic-growth", "entangle", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
  });
});

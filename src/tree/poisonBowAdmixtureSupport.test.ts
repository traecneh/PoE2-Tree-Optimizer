import { describe, expect, it } from "vitest";
import { poisonBowAdmixtureSupportFixture as support, poisonBowAdmixtureNativeFixtures as native,
  poisonBowAdmixtureArrowFixtures as arrows, poisonBowAdmixtureFireFixture as fire } from "./poisonBowAdmixtureSupport.fixtures";
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
  preferences: [{ id: "poisonMagnitude", weight: 2 }, { id: "bleedingChance", weight: 1 }, { id: "bleedingMagnitude", weight: 1 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Admixture for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("admits %s without treating reciprocal conditions as reciprocal ailment application", (skill) => {
    const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === support.id)!;
    expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(resolved.summary).toContain("20% more Poison magnitude against Bleeding enemies");
    expect(resolved.summary).toContain("20% more Bleeding magnitude from supported hits against Poisoned enemies");
    expect(resolved.summary).toContain("Admixture itself adds neither ailment chance");
    expect(resolved.summary).toContain("conditional 1.44 multiplier, not an unconditional route-score bonus");
    expect(resolved.summary).toContain("Enemy conditions and uptime are not assumed");
    expect(resolved.summary).toContain(skill === "gas-arrow" ? "Fire explosion does not become eligible just by adding chance" : "Bleeding needs eligible hits, not burst hits");
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

  it.each(poisonBowIds)("round-trips %s's Admixture and Poison tier as distinct families with goals/budget intact", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["poison-iii", "deadly-poison-ii", "efficiency-ii"] };
    const selected = setSkillSupport(current, support.id, true);
    expect(selected.supportGemIds).toEqual([...current.supportGemIds, support.id]);
    expect(normalizeSkillSupportIds(skill, [support.id, support.id, "poison-iii", "poison-i", null, "bad"])).toEqual([support.id, "poison-iii"]);
    expect(setSkillSupport(selected, "poison-ii", true).supportGemIds).toEqual(["deadly-poison-ii", "efficiency-ii", support.id, "poison-ii"]);
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

  it.each(native)("checks $skill's Poison condition independently of the Poisoned-only reverse condition", (f) => {
    const more = 1 + support.poisonMoreAgainstBleeding / 100;
    expect(f.supportedPoison).toBe(f.poison);
    expect(f.bleedingOnlyPoison).toBe(f.poison);
    expect(f.supportedPoisonedPoison).toBe(f.poison);
    expect(f.supportedMagnitude).toBe(1);
    expect(f.supportedPoisonedMagnitude).toBe(1);
    expect(f.supportedBleedingMagnitude).toBe(more);
    expect(f.supportedBleedingPoison).toBeCloseTo(f.poison * more);
    expect(f.supportedBothPoison).toBe(f.supportedBleedingPoison);
    expect(f.supportedRawPoisonChance).toBe(f.rawPoisonChance);
    expect(f.supportedRawBleedChance).toBe(0);
    for (const [actual, baseline] of [[f.supportedDuration, f.duration], [f.supportedPoisonDuration, f.poisonDuration], [f.supportedHit, f.hit],
      [f.supportedRate, f.rate], [f.supportedRadius, f.radius], [f.supportedStacks, f.stacks]]) expect(actual).toBe(baseline);
    expect(f.supportedMana).toBe(Math.floor(f.mana * (1 + support.manaMultiplier / 100)));
  });

  it.each(native)("verifies $skill's Poison III combination against 40% and 44% magnitude controls without applying it unconditionally", (f) => {
    const combined = (1 + support.poisonMoreAgainstBleeding / 100) * 1.2;
    expect(combined).toBe(1.44);
    expect(f.pairWithoutConditionsPoison).toBe(f.poison);
    expect(f.pairWithoutConditionsMagnitude).toBe(1);
    expect(f.poison3BleedingPoison).toBe(f.supportedBleedingPoison);
    expect(f.pairMagnitude).toBeCloseTo(combined);
    expect(f.pairBleedingPoison).toBeCloseTo(f.poison * combined);
    expect(f.pairBothPoison).toBe(f.pairBleedingPoison);
    expect(f.magnitude44Poison).toBe(f.pairBleedingPoison);
    expect(f.magnitude40Poison).not.toBeCloseTo(f.pairBleedingPoison);
    expect(f.pairRawPoisonChance).toBe(f.rawPoisonChance + 60);
    expect(f.pairMana).toBe(Math.floor(f.mana * 1.2 * 1.2));
    expect(f.pairEfficiencyMana).toBe(Math.ceil(f.pairMana * .6));
  });

  it.each(arrows)("isolates %s's reverse Bleeding bonus using explicitly supplied on-hit chance and enemy Poisoned input", (f) => {
    expect(f.supportedRawPoisonChance).toBe(f.baseRawPoisonChance);
    expect(f.supportedRawBleedChance).toBe(f.baseRawBleedChance);
    expect(f.baseRawPoisonChance).toBe(0);
    expect(f.baseRawBleedChance).toBe(0);
    expect(f.suppliedBleedChance).toBe(100);
    expect(f.supportedHit).toBe(f.hit);
    expect(f.supportedNoConditionsBleed).toBe(f.suppliedBleed);
    expect(f.supportedBleedingOnlyBleed).toBe(f.suppliedBleed);
    expect(f.supportedBleedingOnlyMagnitude).toBe(1);
    expect(f.supportedPoisonedMagnitude).toBe(1 + support.bleedMoreAgainstPoisoned / 100);
    expect(f.supportedPoisonedBleed).toBeCloseTo(f.suppliedBleed * f.supportedPoisonedMagnitude);
    expect(f.supportedBothBleed).toBe(f.supportedPoisonedBleed);
    expect(f.pairBothBleed).toBe(f.supportedBothBleed);
    expect(f.pairBleedMagnitude).toBe(1.2);
    expect(f.pairPoisonMagnitude).toBe(1.44);
    expect(f.pairPoisonChance).toBe(60);
    // Poison III adds Poison chance, not another Bleeding modifier or an automatic enemy-condition input.
  });

  it("does not treat a Bleeding chance/magnitude field as eligible Fire-explosion damage", () => {
    expect(fire.suppliedBleedChance).toBe(100);
    expect(fire.bleedMagnitude).toBe(1.2);
    expect(fire.hasBleedDamage).toBe(false);
    expect(fire.hasPoisonDamage).toBe(false);
    expect(fire.supportedHit).toBe(fire.hit);
  });

  it.each(poisonBowIds)("leaves %s's route scores, manual Bleeding weights and owner/hit scopes unchanged", (skill) => {
    const current = settings(skill);
    for (const supportGemIds of [[support.id], [support.id, "poison-iii"]]) {
      const selected = { ...current, supportGemIds };
      for (const p of [node("20% increased Magnitude of Poison you inflict"), node("10% chance to inflict Bleeding on Hit"), node("20% increased Magnitude of Bleeding you inflict"),
        node("20% increased Attack Damage"), node("20% increased Spell Damage"), node("Minions deal 100% increased Damage", "100% increased Damage with Plant Skills")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(preset(skill), supportGemIds).passiveStatScopes).toEqual(preset(skill).passiveStatScopes);
      expect(refineSkillPreferencePreset(preset(skill), supportGemIds).exclusions).toEqual(preset(skill).exclusions);
    }
  });

  it("does not infer reviews for other Poison users, minions or held focuses", () => {
    expect(reviewedSkillSupports.find((s) => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "entangle", "fireball", "skeletal-sniper", "contagion"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
  });
});

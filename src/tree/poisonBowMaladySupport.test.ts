import { describe, expect, it } from "vitest";
import { poisonBowMaladySupportFixture as support, poisonBowMaladyLinkedChanceFixtures as links,
  poisonBowMaladyChanceExamples as examples, poisonBowMaladyNativeFixtures as natives,
  poisonBowMaladyNativeChanceFixture as nativeChance } from "./poisonBowMaladySupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "poisonChance", weight: 1 }, { id: "bleedingChance", weight: 2 }, { id: "poisonMagnitude", weight: 3 }, { id: "bleedingMagnitude", weight: 1 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Malady for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("adds %s's chance-swap context without inventing hits, inherent Poison conversion or automatic scores", (skill) => {
    const resolved = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(support.catalogTier).toBe(0);
    expect(resolved.summary.startsWith("Catalog-only review: tier 0 in the frozen data; current availability is unverified.")).toBe(true);
    expect(resolved.summary).toContain("Swaps base on-hit Poison and Bleeding chance, rather than adding or copying both");
    expect(resolved.summary).toContain("Increased chance, damage types, magnitude, duration and stack capacity are not swapped");
    expect(resolved.summary).toContain(skill === "gas-arrow" ? "separate from inherent cloud Poison" : "separate from inherent burst Poison");
    expect(resolved.summary).toContain("No-hit Poison does not become a Bleeding hit");
    expect(resolved.summary).toContain("unchanged chance fields are not game behavior");
    expect(resolved.summary).toContain("not assumed uptime or a self-sustaining loop");
    expect(resolved.summary).toContain("No added Mana cost multiplier");
    expect(resolved.priorities).toEqual([]);
    const current = settings(skill), selected = setSkillSupport(current, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(selected).toEqual({ ...current, supportGemIds: [support.id] });
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
    expect(addSkillPresetPreferences(selected, preset).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
  });

  it.each(links)("updates $name's chance direction for both focuses only while Malady is selected", f => {
    for (const skill of poisonBowIds) {
      const original = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
      const paired = reviewedSkillSupportsFor(skill, [support.id, f.id]).find(s => s.id === f.id)!;
      expect(paired.summary.startsWith("Malady is selected:")).toBe(true);
      expect(paired.summary).toContain(f.from === "Poison"
        ? `${f.amount}% base chance to Poison contributes to base Bleeding chance instead, not both`
        : `${f.amount}% base chance to inflict Bleeding contributes to base Poison chance instead, not both`);
      expect(paired.summary).toContain("PoB runtime does not calculate Malady's swap");
      if (f.conditionalPoisonMore) {
        expect(paired.summary).toContain("20% more Poison magnitude remains Poison-only and requires a Bleeding enemy");
        expect(paired.summary).not.toContain("this support does not cause Bleeding");
      }
      expect(paired.priorities).toEqual(original.priorities);
      expect(paired.effectId).toBe(original.effectId);
      expect(reviewedSkillSupportsFor(skill, [f.id]).find(s => s.id === f.id)!.summary).toBe(original.summary);
      expect(selectedSkillSupports(getSkillPreferencePreset(skill)!, [f.id, support.id]).find(s => s.id === f.id)!.summary).toBe(paired.summary);
    }
  });

  it.each(poisonBowIds)("round-trips %s's links, class/goals/budget and preserves both independent combination warnings", skill => {
    const current = { ...settings(skill), supportGemIds: ["blindside", "blind-ii", "poison-iii", "bleed-ii", "admixture", "efficiency-ii"] };
    const selected = setSkillSupport(current, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(setSkillSupport(selected, support.id, true)).toEqual(selected);
    const resolved = selectedSkillSupports(preset, selected.supportGemIds);
    expect(resolved.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
    for (const id of ["poison-iii", "bleed-ii"]) expect(resolved.find(s => s.id === id)!.summary).toContain("Malady is selected");
    expect(resolved.find(s => s.id === "admixture")!.summary).toContain("Enemy conditions and uptime are not assumed");
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(restored.state.selectedClassStartId).toBe("ranger");
    expect(normalizeSkillSupportIds(skill, [support.id, support.id, "malady-ii", "bleed-ii", "bleed-i", null])).toEqual([support.id, "bleed-ii"]);
    expect(setSkillSupport(selected, support.id, false)).toEqual(current);
    expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
  });

  it("checks simultaneous base-chance exchange before destination modifiers/caps without adding chance or converting damage", () => {
    for (const f of examples) {
      expect(f.swappedBase).toEqual([f.baseBleed, f.basePoison]);
      expect(f.finalChance).toEqual([
        Math.min(100, f.baseBleed * (1 + f.poisonInc / 100)),
        Math.min(100, f.basePoison * (1 + f.bleedInc / 100)),
      ]);
    }
    expect(examples[4].finalChance).toEqual([90, 40]);
    expect(examples[5].finalChance).toEqual([50, 100]);
    // Abstract arithmetic does not establish hit eligibility, actual applications or debuff uptime.
  });

  it("distinguishes unmapped native swap fields from independently supplied chance-direction controls", () => {
    expect(support.nativeSwapMapped).toBe(false);
    expect(support.swapStats).toHaveLength(2);
    expect(nativeChance.poisonIII).toEqual([60, 0]);
    expect(nativeChance.bleedII).toEqual([0, 75]);
    expect(nativeChance.paired).toEqual([60, 75]);
    expect(nativeChance.syntheticSourcePaired).toEqual([160, 75]);
    expect(nativeChance.sourcePoisonCap).toBe(100);
    expect(nativeChance.explicitSwappedControl).toEqual([...nativeChance.explicitOriginalControl].reverse());
    expect(nativeChance.magnitudeOff).toEqual([1, 1]);
    expect(nativeChance.magnitudeBothConditions[0]).toBeCloseTo(1.2 * 1.2, 9);
    expect(nativeChance.magnitudeBothConditions[1]).toBe(1.2);
  });

  it.each(natives)("keeps $skill's source estimates and timers separate from on-hit application and assumed conditional benefits", f => {
    expect(f.arrowHit).toBeCloseTo(f.physicalArrow * 1.05, 9);
    expect(f.conditionalPoison).toBeCloseTo(f.inherentPoison * 1.44, 9);
    expect(f.poison3Mana).toBe(Math.floor(f.baseMana * 1.2));
    expect(f.trioMana).toBe(Math.floor(f.baseMana * 1.2 ** 2));
    expect(f.poisonDuration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.skillTimer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
    expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("No-hit Poison does not become a Bleeding hit");
  });

  it.each(poisonBowIds)("preserves %s's manual chance/magnitude ownership, passive values and route scores", skill => {
    const current = settings(skill);
    for (const supportGemIds of [[support.id], [support.id, "poison-iii", "bleed-ii", "admixture"]]) {
      const selected = { ...current, supportGemIds };
      for (const p of [node("10% chance to Poison on Hit"), node("10% chance to inflict Bleeding on Hit"),
        node("20% increased chance to Poison"), node("20% increased Magnitude of Poison you inflict"),
        node("20% increased Bleeding Duration"), node("Minions have 10% chance to Poison on Hit"), node("20% increased Attack Speed")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(getSkillPreferencePreset(skill)!, supportGemIds).passiveStatScopes).toEqual(getSkillPreferencePreset(skill)!.passiveStatScopes);
    }
  });

  it("does not auto-admit unreviewed parents or invented tiers", () => {
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
    for (const skill of poisonBowIds) for (const id of ["malady-i", "malady-ii"])
      expect(setSkillSupport(settings(skill), id, true)).toEqual(settings(skill));
  });
});

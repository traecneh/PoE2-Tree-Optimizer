import { describe, expect, it } from "vitest";
import { poisonBowCullingSupportFixtures as supports, poisonBowCullingRarityFixture as rarity,
  poisonBowCullingNativeFixtures as native, poisonBowCullingPoisonFixtures as poisons } from "./poisonBowCullingStrikeSupports.fixtures";
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
  preferences: [{ id: "attackSpeed", weight: 1 }, { id: "poisonMagnitude", weight: 2 }, { id: "poisonDuration", weight: 2 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Culling Strike I/II for reviewed Poison bow focuses", () => {
  it.each(supports)("admits $name with hit/rarity restrictions, not automatic Poison power", (f) => {
    for (const skill of poisonBowIds) {
      const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(resolved.summary).toContain("base Life thresholds 10%/5%");
      expect(resolved.summary).toContain("not Normal/Magic");
      expect(resolved.summary).toContain("Poison cannot Cull");
      expect(resolved.summary).toContain("initial arrow must hit");
      expect(resolved.summary).toContain(skill === "gas-arrow" ? "no-hit cloud and its Poison cannot trigger culling" : "no-hit burst and linked Poison cannot trigger culling");
      expect(resolved.summary).toContain("synthetic source-hit culling fields are not actual burst/cloud hits or more Poison DPS");
      expect(resolved.summary).toContain("No contact, threshold timing or buff uptime is assumed");
      expect(resolved.summary).toContain("No added Mana cost multiplier");
      expect(resolved.priorities).toEqual([]);
      if (f.thresholdBuff) {
        expect(resolved.summary).toContain("After Culling with supported skills");
        expect(resolved.summary).toContain(`${f.thresholdBuff}% increased threshold for ${f.buffSeconds} seconds`);
        expect(resolved.summary).toContain("12%/6% without other modifiers, not +20 percentage points");
        expect(resolved.summary).toContain("PoB runtime does not calculate this conditional bonus");
      } else expect(resolved.summary).not.toContain("12%/6%");
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

  it.each(poisonBowIds)("replaces only %s's culling tier and round-trips both tiers, goals, class, budget and other links", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["poison-iii", "swift-affliction-ii", "compressed-duration-ii", "efficiency-ii"] };
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
    expect(normalizeSkillSupportIds(skill, ["culling-strike-ii", "culling-strike-i", "culling-strike-ii", "poison-iii", null, "bad"]))
      .toEqual(["culling-strike-ii", "poison-iii"]);
    expect(setSkillSupport(selected, "culling-strike-ii", false)).toEqual(current);
  });

  it("distinguishes rarity-gated support thresholds from generic culling constants and Tier II's unmodeled buff", () => {
    expect(rarity.rareOrUnique).toEqual([false, true, true]);
    expect(rarity.unique).toEqual([false, false, true]);
    expect(rarity.canCull).toEqual([false, true, true]);
    expect(rarity.tier1Threshold).toEqual([0, rarity.genericConstants.Rare, rarity.genericConstants.Unique]);
    expect(rarity.tier2Threshold).toEqual(rarity.tier1Threshold);
    expect(rarity.tier2Increase).toEqual([0, 0, 0]);
    expect(rarity.tier1Threshold).not.toContain(rarity.genericConstants.Normal);
    expect(rarity.tier1Threshold).not.toContain(rarity.genericConstants.Magic);
    for (const [i, base] of [rarity.genericConstants.Rare, rarity.genericConstants.Unique].entries()) {
      expect(rarity.explicitThreshold[i]).toBeCloseTo(base * (1 + rarity.explicitIncrease / 100));
      expect(rarity.explicitThreshold[i]).not.toBe(base + supports[1].thresholdBuff);
    }
    // Explicit +20% controls check arithmetic, not actual Tier II buff coverage, target Life or uptime.
  });

  it.each(native)("checks $skill's $component native culling estimate without mistaking it for damage", (f) => {
    for (let i = 0; i < rarity.rarity.length; i++) {
      expect(rarity.multiplier[i]).toBeCloseTo(100 / (100 - rarity.tier1Threshold[i]), 10);
      for (const [combined, culling] of [[f.tier1Combined, f.tier1Culling], [f.tier2Combined, f.tier2Culling]]) {
        expect(combined[i]).toBeCloseTo(f.baselineCombined[i] * rarity.multiplier[i], 10);
        expect(culling[i]).toBeCloseTo(combined[i] - f.baselineCombined[i], 10);
      }
    }
    expect(f.tier1Hit).toEqual(f.hit);
    expect(f.tier2Hit).toEqual(f.hit);
    for (const [i, s] of supports.entries()) expect(f.tierMana[i]).toBe(f.mana * (1 + s.manaMultiplier / 100));
    if (!f.actualHit) {
      expect(f.tier1Culling[1]).toBeGreaterThan(0);
      const summary = reviewedSkillSupportsFor(f.skill).find((s) => s.id === "culling-strike-ii")!.summary;
      expect(summary).toContain("synthetic source-hit culling fields are not actual burst/cloud hits");
    }
  });

  it.each(poisons)("keeps $skill's raw Poison magnitude, timers, chance and stacks separate from cull estimates", (f) => {
    for (let i = 0; i < supports.length; i++) {
      expect(f.tierPoison[i]).toBe(f.poison);
      expect(f.tierDuration[i]).toBe(f.duration);
      expect(f.tierSkillDuration[i]).toBe(f.skillDuration);
      expect(f.magnitude[i]).toBe(1);
      expect(f.chance[i]).toBe(100);
      expect(f.stacks[i]).toBe(1);
      expect(f.speed[i]).toBe(1.2);
      expect(f.radius[i]).toBe(f.skill === "gas-arrow" ? 18 : 24);
      expect(f.arrowTierPoison[i]).toBe(f.arrowPoison);
      expect(f.arrowChance[i]).toBe(60);
      expect(f.arrowDuration[i]).toBe(2);
      expect(f.explicitPoison[i]).toBe(f.poison);
    }
  });

  it("keeps the conditional Fire explosion hit distinct from no-hit Poison and unprovided detonation", () => {
    const f = native.find((row) => row.component === "conditional Fire explosion")!;
    expect(f.actualHit).toBe(true);
    expect(f.hasPoison).toEqual([false, false, false]);
    for (const s of supports) {
      const summary = reviewedSkillSupportsFor("gas-arrow").find((entry) => entry.id === s.id)!.summary;
      expect(summary).toContain("separately triggered Fire explosion can hit");
      expect(summary).toContain("ignition/detonation and contact are not supplied");
    }
  });

  it.each(poisonBowIds)("leaves %s's passive values and route scores unchanged, including unrelated ownership", (skill) => {
    const current = settings(skill);
    for (const s of supports) for (const supportGemIds of [[s.id], [s.id, "poison-iii", "compressed-duration-ii"]]) {
      const selected = { ...current, supportGemIds };
      for (const p of [node("20% increased Attack Speed"), node("20% increased Poison Duration"), node("20% increased Damage over Time"),
        node("20% increased Magnitude of Poison you inflict"), node("20% increased Attack Damage"), node("20% increased Spell Damage"),
        node("20% increased Culling Strike Threshold"), node("Minions deal 100% increased Damage", "100% increased Damage with Plant Skills")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(preset(skill), supportGemIds)).toEqual(preset(skill));
    }
  });

  it("does not auto-admit unreviewed attacks or spell/minion/DoT parents", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.find((entry) => entry.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "culling-strike-unknown", true)).toEqual(settings(skill));
  });
});

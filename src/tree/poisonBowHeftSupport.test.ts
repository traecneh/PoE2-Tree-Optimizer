import { describe, expect, it } from "vitest";
import { poisonBowHeftSupportFixture as support, poisonBowHeftComponentFixtures as components, poisonBowHeftPoisonFixtures as poisons } from "./poisonBowHeftSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "physicalDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "skillDuration", weight: 2 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Heft for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("adds %s's maximum-only damage context without a blanket Poison multiplier or automatic priority edits", skill => {
    const resolved = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(support.catalogTier).toBeGreaterThan(0);
    expect(resolved.summary).toContain(`${support.maximumPhysicalMore}% more maximum Physical hit damage, not minimum damage or 30% more average/Poison damage`);
    expect(resolved.summary).toContain("Physical Poison-source ceiling, not Poison magnitude");
    expect(resolved.summary).toContain("not real burst/cloud hits or crits, guaranteed contacts or Full DPS");
    expect(resolved.summary).toContain("Added Chaos damage is not increased");
    expect(resolved.summary).toContain(`${support.manaMultiplier}% higher Mana cost before rounding`);
    expect(resolved.summary).toContain("Efficiency II offsets cost separately, not guaranteed sustain");
    expect(resolved.summary).toContain(skill === "gas-arrow" ? "cloud lifetime and outgoing Poison duration are unchanged" : "linked Poison duration is unchanged");
    expect(resolved.priorities).toEqual([]);
    const current = settings(skill), selected = setSkillSupport(current, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(selected).toEqual({ ...current, supportGemIds: [support.id] });
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
    expect(addSkillPresetPreferences(selected, preset).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
  });

  it.each(poisonBowIds)("round-trips %s's links/class/goals/budget and retains independent Malady/Blindside warnings", skill => {
    const current = { ...settings(skill), supportGemIds: ["malady", "poison-iii", "bleed-ii", "blindside", "blind-ii", "efficiency-ii"] };
    const selected = setSkillSupport(current, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(setSkillSupport(selected, support.id, true)).toEqual(selected);
    expect(selected.supportGemIds).toEqual([...current.supportGemIds, support.id]);
    const resolved = selectedSkillSupports(preset, selected.supportGemIds);
    expect(resolved.find(s => s.id === "poison-iii")!.summary).toContain("Malady is selected");
    expect(resolved.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(restored.state.selectedClassStartId).toBe("ranger");
    expect(normalizeSkillSupportIds(skill, [support.id, support.id, "heft-ii", "malady", null])).toEqual([support.id, "malady"]);
    expect(setSkillSupport(selected, support.id, false)).toEqual(current);
  });

  it.each(components)("checks $skill's $component maximum-only range separately from whole Physical damage", f => {
    expect(f.heftRange[0]).toBe(f.range[0]);
    if (f.range[1] > 0) {
      expect(f.heftRange[1]).toBeGreaterThan(f.range[1]);
      // Same mitigation/critical context in this frozen fixture, with native range rounding already applied.
      expect(f.hit[1] / f.hit[0]).toBeCloseTo((f.heftRange[0] + f.heftRange[1]) / (f.range[0] + f.range[1]), 9);
      expect(f.hit[1]).toBeLessThan(f.wholePhysicalHit);
      expect(f.hit[1] / f.hit[0]).not.toBeCloseTo(1.3, 4);
    } else {
      expect(f.hit).toEqual([22.05, 22.05]);
      expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("fully converted Fire explosion is unchanged; ignition/detonation is not supplied");
    }
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("not real burst/cloud hits");
  });

  it.each(poisons)("independently checks $skill's weighted source estimate without double-counting hit and Poison bonuses", f => {
    const weight = f.roll / 100;
    const source = (min: number, max: number) => min + (max - min) * weight;
    expect(weight).toBeCloseTo(f.potential / (f.potential + 1), 9);
    expect(f.poison[1] / f.poison[0]).toBeCloseTo(source(f.sourceMin, f.sourceMax[1]) / source(f.sourceMin, f.sourceMax[0]), 9);
    expect(f.poison[1]).toBeLessThan(f.wholePhysicalPoison);
    expect(f.poison[1] / f.poison[0]).not.toBeCloseTo(1.3, 4);
    expect(f.withChaos[1] / f.withChaos[0]).toBeCloseTo(
      source(f.sourceMin + f.chaosRange[0], f.sourceMax[1] + f.chaosRange[1]) /
      source(f.sourceMin + f.chaosRange[0], f.sourceMax[0] + f.chaosRange[1]), 9);
    expect(f.withChaos[1] / f.withChaos[0]).toBeLessThan(f.poison[1] / f.poison[0]);
    expect(f.deadlyPoison[1] / f.deadlyPoison[0]).toBeCloseTo(
      source(f.heftDeadlyRange[0], f.heftDeadlyRange[1]) / source(f.deadlyRange[0], f.deadlyRange[1]), 9);
    expect(f.arrowPoisonIII[1]).toBeGreaterThan(f.arrowPoisonIII[0]);
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.skillTimer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
  });

  it.each(poisons)("checks $skill's Mana combinations without estimating sustain from rounded cost", f => {
    expect(f.heftMana).toBe(Math.floor(f.baseMana * (1 + support.manaMultiplier / 100)));
    expect(f.poisonIIIMana).toBe(Math.floor(f.baseMana * 1.2 ** 2));
    expect(f.efficiencyMana).toEqual([Math.ceil(f.baseMana * 0.6), Math.ceil(f.heftMana * 0.6)]);
    expect(f.efficiencyMana[1]).toBeLessThan(f.heftMana);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("preserves %s's manual Physical/Poison values, ownership and route scores", skill => {
    const current = settings(skill), selected = setSkillSupport(current, support.id, true);
    for (const p of [node("20% increased Physical Damage"), node("20% increased Magnitude of Poison you inflict"),
      node("20% increased Attack Speed"), node("20% increased Skill Effect Duration"), node("Minions deal 20% increased Physical Damage"),
      node("30% more Maximum Physical Attack Damage")]) {
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
    }
    expect(passivePreferenceValues(node("30% more Maximum Physical Attack Damage"), selected)).toEqual({});
  });

  it("does not admit unreviewed parents or invented tiers", () => {
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
    for (const skill of poisonBowIds) for (const id of ["heft-i", "heft-ii"])
      expect(setSkillSupport(settings(skill), id, true)).toEqual(settings(skill));
  });
});

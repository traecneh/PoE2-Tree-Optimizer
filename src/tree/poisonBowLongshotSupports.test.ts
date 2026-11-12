import { describe, expect, it } from "vitest";
import { poisonBowLongshotSupportFixtures as supports, poisonBowLongshotDistanceFixtures as distances,
  poisonBowLongshotComponentFixtures as components, poisonBowLongshotPoisonFixtures as poisons } from "./poisonBowLongshotSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "attackDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "accuracy", weight: 2 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Longshot I/II for reviewed Poison bow focuses", () => {
  it.each(supports)("adds $name's bounded distance context without assuming maximum-range Poison uptime", f => {
    for (const skill of poisonBowIds) {
      const resolved = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
      expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(f.catalogTier).toBeGreaterThan(0);
      expect(resolved.summary).toContain(`Up to ${f.maxMore}% more Attack Damage at 7 metres and beyond`);
      expect(resolved.summary).toContain("no bonus at 3.5 metres or closer");
      expect(resolved.summary).toContain("configured distance, not Poison magnitude");
      expect(resolved.summary).toContain("player-to-enemy separation, not projectile travel distance or cloud age");
      expect(resolved.summary).toContain("Distance-dependent Accuracy loss remains separate; Longshot adds no Accuracy");
      expect(resolved.summary).toContain("not real burst/cloud hits or crits");
      expect(resolved.summary).toContain("Movement, Poison snapshotting and maximum-range uptime are not simulated");
      expect(resolved.summary).toContain(`${f.manaMultiplier}% higher Mana cost even at close range`);
      expect(resolved.summary).toContain("not guaranteed sustain");
      expect(resolved.summary).toContain(skill === "gas-arrow" ? "ignition/detonation is not supplied" : "linked Poison duration is unchanged");
      const current = settings(skill), selected = setSkillSupport(current, f.id, true), preset = getSkillPreferencePreset(skill)!;
      expect(resolved.priorities).toEqual([]);
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
      expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(preset);
      expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
      expect(addSkillPresetPreferences(selected, preset).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    }
  });

  it.each(poisonBowIds)("round-trips %s's tiers, preserves links/class/goals/budget and keeps prior warnings", skill => {
    const current = { ...settings(skill), supportGemIds: ["malady", "poison-iii", "blindside", "blind-ii", "efficiency-ii"] };
    let selected: PassiveOptimizationSettings = current;
    for (const f of supports) {
      selected = setSkillSupport(selected, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [...current.supportGemIds, f.id] });
      const resolved = selectedSkillSupports(getSkillPreferencePreset(skill)!, selected.supportGemIds);
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
    }
    expect(normalizeSkillSupportIds(skill, ["longshot-ii", "longshot-i", "longshot-ii", "malady", null])).toEqual(["longshot-ii", "malady"]);
    expect(setSkillSupport(selected, "longshot-ii", false)).toEqual(current);
  });

  it.each(distances)("checks the ramp, metre/unit conversion and native rounding at $metres metres", f => {
    expect(f.nativeUnits).toBe(f.metres * 10);
    expect(f.ramp).toBe(Math.max(0, Math.min(1, (f.metres - 3.5) / 3.5)));
    for (const [i, s] of supports.entries()) {
      expect(f.rawMore[i]).toBe(s.maxMore * f.ramp);
      expect(f.nativeFactors[i]).toBe(Math.round((1 + f.rawMore[i] / 100) * 100) / 100);
    }
    if (f.metres === 5.25) expect(f.nativeFactors).toEqual([1.13, 1.18]);
    // Native rounding is model behavior, not a claim that the game rounds identically.
  });

  it.each(components)("keeps $skill's $component full-range hit/source result separate from contact and Poison magnitude", f => {
    for (const tier of [1, 2]) {
      expect(f.hits[tier] / f.hits[0]).toBeCloseTo((f.ranges[tier][0] + f.ranges[tier][1]) / (f.ranges[0][0] + f.ranges[0][1]), 9);
      expect(f.hits[tier]).toBeGreaterThan(f.hits[0]);
    }
    if (!f.actualHit) for (const s of supports) expect(reviewedSkillSupportsFor(f.skill).find(x => x.id === s.id)!.summary).toContain("not real burst/cloud hits");
    if (f.component === "conditional Fire explosion") for (const s of supports) expect(reviewedSkillSupportsFor(f.skill).find(x => x.id === s.id)!.summary).toContain("Fire-explosion damage also scales, but ignition/detonation is not supplied");
  });

  it.each(poisons)("independently checks $skill's same-range source ratios, cost and separate distance/Accuracy effects", f => {
    const base = components.find(x => x.skill === f.skill && !x.actualHit)!;
    const weighted = (range: readonly number[]) => range[0] + (range[1] - range[0]) * f.roll / 100;
    for (const [i, s] of supports.entries()) {
      expect(f.midpointPoison[i] / f.nearPoison).toBeCloseTo(weighted(f.midpointRanges[i]) / weighted(base.ranges[0]), 9);
      expect(f.fullPoison[i] / f.nearPoison).toBeCloseTo(weighted(base.ranges[i + 1]) / weighted(base.ranges[0]), 9);
      expect(f.mana[i + 1]).toBe(Math.floor(f.mana[0] * (1 + s.manaMultiplier / 100)));
      expect(f.efficiencyMana[i + 1]).toBe(Math.ceil(f.mana[i + 1] * .6));
      expect(f.arrowPoisonMana[i + 1]).toBe(Math.floor(f.mana[0] * 1.2 ** 2));
      expect(f.arrowPoison[i + 1]).toBeGreaterThan(f.arrowPoison[0]);
      expect(f.beyondPoison[i]).toBeLessThan(f.fullPoison[i]);
    }
    expect(f.restrictedFarPotential).toBeCloseTo(f.potential * .22, 9);
    expect(f.restrictedFarPoison).toBeLessThan(f.restrictedNearPoison);
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.skillTimer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
    // Same-range native multipliers are not net uptime/DPS predictions across changing distances.
  });

  it.each(poisonBowIds)("preserves %s's manual values/ownership/scopes and route scores without scoring distance conditions", skill => {
    const current = settings(skill);
    for (const s of supports) {
      const selected = setSkillSupport(current, s.id, true);
      for (const p of [node("20% increased Attack Damage"), node("20% increased Magnitude of Poison you inflict"), node("20% increased Accuracy Rating"),
        node("20% increased Projectile Speed"), node("Minions deal 20% increased Attack Damage"), node("25% more Attack Damage to enemies further than 7 metres from you")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(getSkillPreferencePreset(skill)!, selected.supportGemIds).passiveStatScopes).toEqual(getSkillPreferencePreset(skill)!.passiveStatScopes);
    }
  });

  it("does not auto-admit unreviewed parents or fictional tiers", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.find(x => x.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "longshot-iii", true)).toEqual(settings(skill));
  });
});

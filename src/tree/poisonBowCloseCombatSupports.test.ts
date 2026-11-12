import { describe, expect, it } from "vitest";
import { poisonBowCloseCombatSupportFixtures as supports, poisonBowCloseCombatDistanceFixtures as distances,
  poisonBowCloseCombatNativeFixtures as native } from "./poisonBowCloseCombatSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "attackDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "accuracy", weight: 2 }] });

describe("Close Combat I/II for reviewed Poison bow focuses", () => {
  it.each(supports)("reviews $name without treating nearby damage as permanent Poison magnitude", f => {
    for (const skill of poisonBowIds) {
      const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
      expect({ name: s.name, effectId: s.effectId, family: s.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(f.catalogTier).toBeGreaterThan(0);
      expect(s.sourceUrl).toContain("sup_dex.lua#L");
      for (const text of [`Up to ${f.maxMore}% more Attack Damage at 1 metre or closer`, "no bonus at 3.5 metres and beyond",
        "configured distance, not Poison magnitude", "not melee-only", "adds no Accuracy or protection", "not real burst/cloud hits or crits",
        "Poison snapshotting and near-range uptime are not simulated", "20% higher Mana cost even outside the damage range", "not guaranteed sustain",
        skill === "gas-arrow" ? "ignition/detonation is not supplied" : "linked Poison duration is unchanged"]) expect(s.summary).toContain(text);
      const current = settings(skill), selected = setSkillSupport(current, f.id, true), preset = getSkillPreferencePreset(skill)!;
      expect(s.priorities).toEqual([]);
      expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current, supportGemIds: [f.id] });
      expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(preset);
      expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
    }
  });

  it.each(distances)("independently checks both ramps and all four tier combinations at $metres metres", f => {
    expect(Math.max(0, Math.min(1, (3.5 - f.metres) / 2.5))).toBe(f.closeRamp);
    expect(Math.max(0, Math.min(1, (f.metres - 3.5) / 3.5))).toBe(f.longRamp);
    for (const [i, cc] of supports.entries()) {
      expect(Math.round((1 + cc.maxMore * f.closeRamp / 100) * 100) / 100).toBe(f.nativeFactors[i]);
      for (const ls of [25, 35]) {
        const closeMore = cc.maxMore * f.closeRamp, farMore = ls * f.longRamp;
        expect(closeMore * farMore).toBe(0);
        const combined = (1 + closeMore / 100) * (1 + farMore / 100);
        expect(combined).toBeCloseTo(1 + Math.max(closeMore, farMore) / 100, 12);
        expect(combined).toBeLessThan((1 + cc.maxMore / 100) * (1 + ls / 100));
        if (f.metres === 3.5) expect(combined).toBe(1);
      }
    }
  });

  it.each(native)("checks $skill's rounded native source/hit ratios and independent cost, not net Poison uptime", f => {
    const weighted = (r: readonly number[]) => r[0] + (r[1] - r[0]) * f.roll / 100;
    for (const i of [1, 2]) {
      expect(f.poison[i] / f.poison[0]).toBeCloseTo(weighted(f.ranges[i]) / weighted(f.ranges[0]), 9);
      expect(f.defaultPoison[i - 1] / f.poison[0]).toBeCloseTo(weighted(f.defaultRanges[i - 1]) / weighted(f.ranges[0]), 9);
      expect(f.sourceHits[i] / f.sourceHits[0]).toBeCloseTo((f.ranges[i][0] + f.ranges[i][1]) / (f.ranges[0][0] + f.ranges[0][1]), 9);
    }
    expect(f.arrowHits[1] / f.arrowHits[0]).toBeCloseTo((f.arrowRanges[1][0] + f.arrowRanges[1][1]) / (f.arrowRanges[0][0] + f.arrowRanges[0][1]), 9);
    expect(f.arrowPoison[1]).toBeGreaterThan(f.arrowPoison[0]);
    expect(f.mana[1]).toBe(Math.floor(f.mana[0] * 1.2));
    expect(f.mana[2]).toBe(Math.floor(f.mana[0] * 1.2 ** 2));
    expect(f.mana[2]).not.toBe(Math.floor(f.mana[0] * 1.4));
    for (const i of [0, 1, 2]) expect(f.efficiencyMana[i]).toBe(Math.ceil(f.mana[i] * .6));
    expect(f.pairedMidPoison).toBeCloseTo(f.defaultPoison[1], 10);
    expect(f.pairedFarPoison).toBeGreaterThan(f.poison[0]);
    expect(f.poisonDuration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.skillTimer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
  });

  it.each(poisonBowIds)("keeps %s's paired cautions reversible, tier-specific and compatible with previous warnings", skill => {
    for (const cc of supports) for (const ls of ["longshot-i", "longshot-ii"]) {
      const current = { ...settings(skill), supportGemIds: ["malady", "poison-iii", "blindside", "blind-ii", "efficiency-ii", ls] };
      const selected = setSkillSupport(current, cc.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [...current.supportGemIds, cc.id] });
      const resolved = selectedSkillSupports(getSkillPreferencePreset(skill)!, selected.supportGemIds);
      for (const id of [cc.id, ls]) {
        const note = resolved.find(s => s.id === id)!.summary;
        expect(note).toContain("at the same distance their damage bonuses do not overlap");
        expect(note).toContain("Both give zero at 3.5 metres; both Mana cost multipliers still apply");
      }
      expect(resolved.find(s => s.id === "poison-iii")!.summary).toContain("Malady is selected");
      expect(resolved.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
      const removed = setSkillSupport(selected, cc.id, false);
      expect(removed).toEqual(current);
      expect(selectedSkillSupports(getSkillPreferencePreset(skill)!, removed.supportGemIds).find(s => s.id === ls)!.summary)
        .toBe(reviewedSkillSupportsFor(skill).find(s => s.id === ls)!.summary);
      const withoutLongshot = setSkillSupport(selected, ls, false);
      expect(selectedSkillSupports(getSkillPreferencePreset(skill)!, withoutLongshot.supportGemIds).find(s => s.id === cc.id)!.summary)
        .toBe(reviewedSkillSupportsFor(skill).find(s => s.id === cc.id)!.summary);
    }
    expect(normalizeSkillSupportIds(skill, ["close-combat-ii", "close-combat-i", "close-combat-ii", "longshot-ii", null]))
      .toEqual(["close-combat-ii", "longshot-ii"]);
    const first = setSkillSupport({ ...settings(skill), supportGemIds: ["longshot-ii", "close-combat-i"] }, "close-combat-ii", true);
    expect(first.supportGemIds).toEqual(["longshot-ii", "close-combat-ii"]);
    expect(reviewedSkillSupportsFor(skill, ["close-combat-ii", "longshot-iii"]).find(s => s.id === "close-combat-ii")!.summary).not.toContain("are selected:");
  });

  it.each(poisonBowIds)("round-trips %s's paired links without changing class/goals/budget/manual scores", skill => {
    const current = settings(skill), selected = { ...current, supportGemIds: ["longshot-ii", "close-combat-ii", "efficiency-ii"] };
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.selectedClassStartId).toBe("ranger");
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    for (const stats of [["20% increased Attack Damage"], ["20% increased Magnitude of Poison you inflict"], ["20% increased Accuracy Rating"],
      ["Minions deal 20% increased Attack Damage"], ["30% more Attack Damage to enemies within 1 metre of you"]]) {
      const node: TreeNode = { id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats };
      expect(passivePreferenceValues(node, selected)).toEqual(passivePreferenceValues(node, current));
      expect(scorePassiveNode(node, selected.preferences, selected)).toBe(scorePassiveNode(node, current.preferences, current));
    }
  });

  it("does not admit unreviewed parents, missing input or fictional tiers", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.filter(x => x.id === s.id)).toHaveLength(1);
      expect(reviewedSkillSupports.find(x => x.id === s.id)?.skillIds).toEqual(s.id === "close-combat-i" ? poisonBowIds : ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", ...poisonBowIds]);
      for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
    for (const skill of poisonBowIds) {
      expect(setSkillSupport(settings(skill), "close-combat-iii", true)).toEqual(settings(skill));
      for (const invalid of [undefined, null, "close-combat-ii", {}]) expect(reviewedSkillSupportsFor(skill, invalid).find(s => s.id === "longshot-i")!.summary).not.toContain("are selected:");
    }
    for (const skill of ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"]) {
      expect(setSkillSupport(settings(skill), "close-combat-i", true)).toEqual(settings(skill));
      expect(reviewedSkillSupportsFor(skill).find(s => s.id === "close-combat-ii")!.summary)
        .toBe("Attack damage benefit depends on distance to the target. Proximity and uptime are not modeled, so this does not add unconditional passive damage or change priorities.");
    }
  });
});

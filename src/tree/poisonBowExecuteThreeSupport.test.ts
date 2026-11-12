import { describe, expect, it } from "vitest";
import { poisonBowExecuteThreeSupportFixture as support, poisonBowExecuteThreeConditions as conditions,
  poisonBowExecuteThreeComponents as components, poisonBowExecuteThreePoisonFixtures as poisons } from "./poisonBowExecuteThreeSupport.fixtures";
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

describe("Execute III for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's separate conditions without making either automatic or changing scores", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name, effectId: s.effectId, family: s.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(support.catalogTier).toBe(5);
    expect(s.sourceUrl).toContain("sup_str.lua#L3207");
    for (const text of ["30% more damage with Hits against enemies on Low Life", "a separate 30% more while you are on Low Life",
      "Neither condition: no bonus; either alone: 30% more; both: 1.3 x 1.3 = 1.69", "69% more, not 60%",
      "attack-derived Poison-source estimate under the configured conditions", "not Poison magnitude or a second multiplier on Poison DPS",
      "Real burst/cloud hits, snapshotting and either condition's uptime are not established", "not a defensive benefit or recommendation to lower Life",
      "No Culling Strike", "One 10% higher Mana cost applies in all four states, not twice", "not guaranteed sustain",
      skill === "gas-arrow" ? "Ignition/detonation is not supplied" : "application chance and Poison duration are unchanged"]) expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current, supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
    for (const stats of [["20% increased Attack Damage"], ["20% increased Magnitude of Poison you inflict"], ["20% increased Accuracy Rating"],
      ["Minions deal 20% increased Attack Damage"], ["30% more Damage with Hits while on Low Life"]]) {
      const n: TreeNode = { id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats };
      expect(passivePreferenceValues(n, selected)).toEqual(passivePreferenceValues(n, current));
      expect(scorePassiveNode(n, selected.preferences, selected)).toBe(scorePassiveNode(n, current.preferences, current));
    }
  });

  it.each(conditions)("independently checks the $label condition factor, not additive bonuses or assumed uptime", f => {
    const enemy = f.enemyLowLife ? 1 + support.enemyMoreHit / 100 : 1;
    const player = f.playerLowLife ? 1 + support.playerMoreHit / 100 : 1;
    expect(f.factor).toBeCloseTo(enemy * player, 12);
    if (f.enemyLowLife && f.playerLowLife) {
      expect(f.factor).not.toBe(1 + (support.enemyMoreHit + support.playerMoreHit) / 100);
      expect(f.factor).not.toBe(1.3 ** 3);
    }
  });

  it.each(components)("independently checks $skill's $component rounded baseline/single/both hit or source values", f => {
    for (const i of [1, 2]) {
      expect(f.hits[i] / f.hits[0]).toBeCloseTo((f.ranges[i][0] + f.ranges[i][1]) / (f.ranges[0][0] + f.ranges[0][1]), 9);
      expect(f.hits[i]).toBeGreaterThan(f.hits[i - 1]);
    }
    const note = reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary;
    if (!f.actualHit) expect(note).toContain("Real burst/cloud hits");
    if (f.component === "conditional Fire explosion") expect(note).toContain("conditional Fire-explosion hits are separate from the no-hit cloud");
  });

  it.each(poisons)("reproduces $skill's source ratios once, with a single cost multiplier in every condition state", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    const weighted = (r: readonly number[], roll: number) => r[0] + (r[1] - r[0]) * roll / 100;
    for (const i of [1, 2]) {
      expect(f.poison[i] / f.poison[0]).toBeCloseTo(weighted(source.ranges[i], f.roll) / weighted(source.ranges[0], f.roll), 9);
      expect(f.arrowPoison[i] / f.arrowPoison[0]).toBeCloseTo(weighted(arrow.ranges[i], f.arrowRoll) / weighted(arrow.ranges[0], f.arrowRoll), 9);
    }
    for (const [i] of conditions.entries()) expect(f.manaByState[i]).toBe(Math.floor(f.baseMana * 1.1));
    expect(f.manaByState[3]).not.toBe(Math.floor(f.baseMana * 1.1 ** 2));
    expect(f.baseArrowPoisonMana).toBe(Math.floor(f.baseMana * 1.2));
    expect(f.arrowPoisonMana).toBe(Math.floor(f.baseMana * 1.2 * 1.1));
    expect(f.baseEfficiencyMana).toBe(Math.ceil(f.baseMana * .6));
    expect(f.efficiencyMana).toBe(Math.ceil(Math.floor(f.baseMana * 1.1) * .6));
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.skillTimer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("switches all %s's Execute tiers and round-trips III while retaining old warnings and manual state", skill => {
    const initial = { ...settings(skill), supportGemIds: ["malady", "poison-iii", "blindside", "blind-ii", "longshot-ii", "close-combat-ii", "efficiency-ii"] };
    let selected: PassiveOptimizationSettings = initial;
    for (const id of ["execute-i", "execute-ii", "execute-iii", "execute-i", "execute-iii"]) {
      selected = setSkillSupport(selected, id, true);
      expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds, id] });
    }
    const resolved = selectedSkillSupports(getSkillPreferencePreset(skill)!, selected.supportGemIds);
    expect(resolved.find(s => s.id === "poison-iii")!.summary).toContain("Malady is selected");
    expect(resolved.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
    for (const id of ["longshot-ii", "close-combat-ii"]) expect(resolved.find(s => s.id === id)!.summary).toContain("their damage bonuses do not overlap");
    expect(normalizeSkillSupportIds(skill, ["execute-iii", "execute-i", "execute-iii", "execute-ii", null])).toEqual(["execute-iii"]);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.selectedClassStartId).toBe("ranger");
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(setSkillSupport(selected, support.id, false)).toEqual(initial);
  });

  it("admits only the two reviewed parents and preserves I/II's distinct enemy-only behavior", () => {
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
    for (const skill of poisonBowIds) {
      expect(setSkillSupport(settings(skill), "execute-iv", true)).toEqual(settings(skill));
      for (const id of ["execute-i", "execute-ii"]) expect(reviewedSkillSupportsFor(skill).find(s => s.id === id)!.summary)
        .toContain("your own Low Life does not activate Execute I/II");
    }
  });
});

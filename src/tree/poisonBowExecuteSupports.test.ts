import { describe, expect, it } from "vitest";
import { poisonBowExecuteSupportFixtures as supports, poisonBowExecuteComponentFixtures as components,
  poisonBowExecutePoisonFixtures as poisons } from "./poisonBowExecuteSupports.fixtures";
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

describe("Execute I/II for reviewed Poison bow focuses", () => {
  it.each(supports)("reviews $name's enemy-Low-Life hit modifier, source estimates and persistent cost without assigning uptime", f => {
    for (const skill of poisonBowIds) {
      const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
      expect({ name: s.name, effectId: s.effectId, family: s.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(f.catalogTier).toBeGreaterThan(0);
      expect(s.sourceUrl).toContain("sup_str.lua#L");
      for (const text of [`${f.moreHit}% more damage with Hits against enemies on Low Life`, "No damage bonus outside that enemy condition",
        "your own Low Life does not activate Execute I/II", "attack-derived Poison-source estimate under that condition",
        "not Poison magnitude or a second multiplier on Poison DPS", "does not establish real burst/cloud hits, snapshotting or low-life uptime",
        "No Culling Strike or automatic execute threshold", "10% higher Mana cost even outside Low Life", "not guaranteed sustain",
        skill === "gas-arrow" ? "Ignition/detonation is not supplied" : "application chance and Poison duration are unchanged"]) expect(s.summary).toContain(text);
      const current = settings(skill), selected = setSkillSupport(current, f.id, true), preset = getSkillPreferencePreset(skill)!;
      expect(s.priorities).toEqual([]);
      expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current, supportGemIds: [f.id] });
      expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(preset);
      expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
    }
  });

  it.each(components)("independently checks $skill's $component conditional rounded hit/source ratios", f => {
    for (const i of [1, 2]) {
      expect(f.hits[i] / f.hits[0]).toBeCloseTo((f.ranges[i][0] + f.ranges[i][1]) / (f.ranges[0][0] + f.ranges[0][1]), 9);
      expect(f.hits[i]).toBeGreaterThan(f.hits[0]);
    }
    for (const s of supports) {
      const note = reviewedSkillSupportsFor(f.skill).find(x => x.id === s.id)!.summary;
      if (!f.actualHit) expect(note).toContain("does not establish real burst/cloud hits");
      if (f.component === "conditional Fire explosion") {
        expect(note).toContain("conditional Fire-explosion hits are separate from the no-hit cloud");
        expect(note).toContain("Ignition/detonation is not supplied");
      }
    }
  });

  it.each(poisons)("reproduces $skill's conditional native Poison-source ratios once and separates cost from magnitude/timing", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    const weighted = (r: readonly number[], roll: number) => r[0] + (r[1] - r[0]) * roll / 100;
    for (const i of [1, 2]) {
      expect(f.poison[i] / f.poison[0]).toBeCloseTo(weighted(source.ranges[i], f.roll) / weighted(source.ranges[0], f.roll), 9);
      expect(f.arrowPoison[i] / f.arrowPoison[0]).toBeCloseTo(weighted(arrow.ranges[i], f.arrowRoll) / weighted(arrow.ranges[0], f.arrowRoll), 9);
      expect(f.mana[i]).toBe(Math.floor(f.mana[0] * (1 + supports[i - 1].manaMultiplier / 100)));
      // Poison III's separate multiplier applies before native cost rounding.
      expect(f.arrowPoisonMana[i]).toBe(Math.floor(f.mana[0] * 1.2 * 1.1));
    }
    for (const i of [0, 1, 2]) expect(f.efficiencyMana[i]).toBe(Math.ceil(f.mana[i] * .6));
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.skillTimer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
    // These outputs are conditional native observations, not permanent Poison multipliers.
  });

  it.each(poisonBowIds)("keeps %s's existing warnings/links while replacing, deduplicating and removing Execute tiers", skill => {
    const current = { ...settings(skill), supportGemIds: ["malady", "poison-iii", "blindside", "blind-ii", "longshot-ii", "close-combat-ii", "efficiency-ii"] };
    let selected: PassiveOptimizationSettings = current;
    for (const f of supports) {
      selected = setSkillSupport(selected, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [...current.supportGemIds, f.id] });
      const resolved = selectedSkillSupports(getSkillPreferencePreset(skill)!, selected.supportGemIds);
      expect(resolved.find(s => s.id === "poison-iii")!.summary).toContain("Malady is selected");
      expect(resolved.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
      for (const id of ["longshot-ii", "close-combat-ii"]) expect(resolved.find(s => s.id === id)!.summary).toContain("their damage bonuses do not overlap");
    }
    expect(normalizeSkillSupportIds(skill, ["execute-ii", "execute-i", "execute-ii", "malady", null])).toEqual(["execute-ii", "malady"]);
    expect(setSkillSupport(selected, "execute-ii", false)).toEqual(current);
  });

  it.each(poisonBowIds)("round-trips %s without changing class/goals/budget or manual/conditional route scores", skill => {
    for (const f of supports) {
      const current = settings(skill), selected = { ...current, supportGemIds: ["poison-iii", "efficiency-ii", f.id] };
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
        ["Minions deal 20% increased Attack Damage"], ["50% more Damage with Hits against Enemies that are on Low Life"]]) {
        const n: TreeNode = { id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats };
        expect(passivePreferenceValues(n, selected)).toEqual(passivePreferenceValues(n, current));
        expect(scorePassiveNode(n, selected.preferences, selected)).toBe(scorePassiveNode(n, current.preferences, current));
      }
    }
  });

  it("does not admit unreviewed parents or a fictional Execute IV", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.filter(x => x.id === s.id)).toHaveLength(1);
      expect(reviewedSkillSupports.find(x => x.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "execute-iv", true)).toEqual(settings(skill));
  });
});

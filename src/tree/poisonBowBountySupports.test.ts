import { describe, expect, it } from "vitest";
import { poisonBowBountySupportFixtures as supports, poisonBowBountyRewardFixture as reward,
  poisonBowBountyComponentFixtures as components, poisonBowBountyPoisonFixtures as poisons } from "./poisonBowBountySupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const preset = (skill: string) => getSkillPreferencePreset(skill)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "flaskChargesGained", weight: 1 }, { id: "charmChargesGained", weight: 2 }, { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Bounty I/II for reviewed Poison bow focuses", () => {
  it.each(supports)("admits $name with supported-hit kill credit, separate reward channels and no automatic Poison/uptime bonus", (f) => {
    for (const skill of poisonBowIds) {
      const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(resolved.summary).toContain(`${f.moreLife}% more Life Flask, Mana Flask and Charm charges from enemies killed by Hits of the supported skill`);
      expect(resolved.summary).toContain(`(${1 + f.moreLife / 100}x eligible reward), not flat charges or Poison damage`);
      expect(resolved.summary).toContain("Poison damage-over-time kills are not hit kills");
      expect(resolved.summary).toContain(skill === "gas-arrow" ? "no-hit cloud and its Poison do not supply that killing hit" : "no-hit burst and linked Poison do not supply that killing hit");
      expect(resolved.summary).toContain("Separate reward channels, not three stacked multipliers");
      expect(resolved.summary).toContain("Not healing amount or charge generation per second");
      expect(resolved.summary).toContain("not three stacked multipliers or charges from every party/minion/other-skill kill");
      expect(resolved.summary).toContain("PoB runtime does not calculate these on-kill rewards");
      expect(resolved.summary).toContain("unchanged native modifiers do not mean zero game effect");
      expect(resolved.summary).toContain("No added Mana cost multiplier");
      expect(resolved.summary).toContain("no kill rate, Flask/Charm uptime or boss sustain is assumed");
      expect(resolved.priorities).toEqual([]);
      const current = settings(skill), selected = setSkillSupport(current, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
      expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
      expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
      expect(addSkillPresetPreferences(selected, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
      expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
    }
  });

  it.each(poisonBowIds)("replaces only %s's Bounty tier and round-trips other links, Blindside warnings, goals, class and budget", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["blindside", "blind-ii", "poison-iii", "efficiency-ii"] };
    let selected: PassiveOptimizationSettings = current;
    for (const f of supports) {
      selected = setSkillSupport(selected, f.id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [...current.supportGemIds, f.id] });
      expect(selectedSkillSupports(preset(skill), selected.supportGemIds).find((s) => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
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
    expect(normalizeSkillSupportIds(skill, ["bounty-ii", "bounty-i", "bounty-ii", "blindside", null, "bad"]))
      .toEqual(["bounty-ii", "blindside"]);
    expect(setSkillSupport(selected, "bounty-ii", false)).toEqual(current);
  });

  it("checks more-reward arithmetic per channel without inventing flat charges, three multipliers or a kill rate", () => {
    expect(reward.requirement).toBe("Enemies killed by Hits from Supported Skills");
    expect(reward.sourceStats).toHaveLength(3);
    for (const [tier, f] of supports.entries()) for (const [channel, more] of [f.moreLife, f.moreMana, f.moreCharm].entries()) {
      const factor = 1 + more / 100, base = reward.hypotheticalBaseCharges[channel];
      expect(reward.explicitMoreControl[tier][channel]).toBe(factor);
      expect(reward.hypotheticalTierCharges[tier][channel]).toBe(base * factor);
      expect(reward.hypotheticalTierCharges[tier][channel]).not.toBe(base + more);
      expect(reward.hypotheticalTierCharges[tier][channel]).not.toBe(base * factor ** 3);
    }
    expect(reward.nativeKillEventsSimulated).toBe(false);
    // Abstract eligible-event examples are not actual enemy payouts, capacity/rounding or uptime predictions.
  });

  it("distinguishes unmapped native on-kill rewards from separate explicit charge-modifier controls", () => {
    expect(reward.nativeBountyRewardMore).toEqual([1, 1, 1]);
    expect(reward.nativeBountyRewardIncrease).toEqual([0, 0, 0]);
    expect(reward.nativeGenericFlaskMore).toBe(1);
    expect(reward.explicitMoreControl).toEqual([[1.5, 1.5, 1.5], [2, 2, 2]]);
    for (const skill of poisonBowIds) for (const f of supports) expect(reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!.summary)
      .toContain("unchanged native modifiers do not mean zero game effect");
  });

  it.each(components)("keeps $skill's $component damage, speed, cost and actual-hit boundary separate from rewards", (f) => {
    expect(f.tierHit).toEqual([f.hit, f.hit]);
    expect(f.speed).toEqual([1.2, 1.2]);
    for (const [i, s] of supports.entries()) expect(f.tierMana[i]).toBe(f.mana * (1 + s.manaMultiplier / 100));
    if (!f.actualHit) for (const s of supports) expect(reviewedSkillSupportsFor(f.skill).find((entry) => entry.id === s.id)!.summary)
      .toContain("do not supply that killing hit");
    if (f.component === "conditional Fire explosion") {
      expect(f.hasPoison).toBe(false);
      for (const s of supports) expect(reviewedSkillSupportsFor(f.skill).find((entry) => entry.id === s.id)!.summary).toContain("Ignition/detonation is not supplied");
    }
  });

  it.each(poisons)("does not turn $skill's inherent or separately enabled arrow Poison into a charge reward, damage or recovery bonus", (f) => {
    expect(f.tierPoison).toEqual([f.poison, f.poison]);
    expect(f.duration[1]).toBe(f.duration[0]);
    expect(f.skillDuration[1]).toBe(f.skillDuration[0]);
    expect(f.chance).toEqual([100, 100]);
    expect(f.magnitude).toEqual([1, 1]);
    expect(f.stacks).toEqual([1, 1]);
    expect(f.radius[1]).toBe(f.radius[0]);
    expect(f.arrowTierPoison).toEqual([f.arrowPoison, f.arrowPoison]);
    expect(f.arrowChance).toEqual([60, 60]);
    expect(f.arrowDuration).toEqual([2, 2]);
    expect(f.arrowPoisonMana).toEqual(f.skill === "gas-arrow" ? [74, 74] : [45, 45]);
    expect(f.lifeRegen).toEqual([0, 0]);
    expect(f.manaRegen).toEqual([101.6, 101.6]);
  });

  it.each(poisonBowIds)("preserves %s's manual Flask/Charm values, ownership and route scores without treating reward text as a passive", (skill) => {
    const current = settings(skill);
    for (const s of supports) for (const supportGemIds of [[s.id], [s.id, "blindside", "blind-ii", "poison-iii"]]) {
      const selected = { ...current, supportGemIds };
      for (const p of [node("20% increased Flask Charges gained"), node("20% increased Life Flask Charges gained", "20% increased Mana Flask Charges gained"),
        node("20% increased Flask and Charm Charges gained"), node("0.2 Life Flask Charges gained per Second"),
        node("20% increased Magnitude of Poison you inflict"), node("20% increased Damage over Time"), node("20% increased Life Recovery from Flasks"),
        node("Minions have 100% increased Damage", "20% increased Charm Effect Duration")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      for (const channel of ["Life Flask Charges", "Mana Flask Charges", "Charm charges"]) expect(passivePreferenceValues(node(`Enemies killed by Hits from Supported Skills grant 50% more ${channel}`), selected)).toEqual({});
      expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
    }
  });

  it("does not auto-admit other hit/DoT/minion parents or unknown tiers", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.find((entry) => entry.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "bounty-iii", true)).toEqual(settings(skill));
  });
});

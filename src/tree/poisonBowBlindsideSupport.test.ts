import { describe, expect, it } from "vitest";
import { poisonBowBlindsideSupportFixture as support, poisonBowBlindsideCritFixture as crit,
  poisonBowBlindsideComponentFixtures as components, poisonBowBlindsidePoisonFixtures as poisons } from "./poisonBowBlindsideSupport.fixtures";
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
  preferences: [{ id: "blindChance", weight: 1 }, { id: "criticalChance", weight: 3 }, { id: "criticalDamageBonus", weight: 2 }, { id: "poisonMagnitude", weight: 2 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Blindside for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("admits %s with the Blind prohibition before conditional critical-hit benefits", (skill) => {
    const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === support.id)!;
    expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(support.prohibitsBlind).toBe(true);
    expect(resolved.summary.startsWith("Cannot inflict Blind, even with Blind I/II; a different source must Blind the enemy first")).toBe(true);
    expect(resolved.summary).toContain(`Against Blinded enemies only: ${support.moreCriticalChance}% more Critical Hit Chance and ${support.moreCriticalDamageBonus}% more Critical Damage Bonus`);
    expect(resolved.summary).toContain("not +15 percentage points or 15% more Poison damage");
    expect(resolved.summary).toContain("PoB runtime does not enforce the Blind prohibition");
    expect(resolved.summary).toContain("Native source-hit/Poison crit estimates are not actual burst/cloud crits");
    expect(resolved.summary).toContain(`${support.manaMultiplier}% higher Mana cost before rounding`);
    expect(resolved.summary).toContain("no contact, external Blind uptime or net DPS is assumed");
    expect(resolved.priorities).toEqual([]);
    const current = settings(skill), selected = setSkillSupport(current, support.id, true);
    expect(selected).toEqual({ ...current, supportGemIds: [support.id] });
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const refined = refineSkillPreferencePreset(preset(skill), selected.supportGemIds);
    expect(refined.suggestions).toEqual(preset(skill).suggestions);
    expect(refined.passiveStatScopes).toEqual(preset(skill).passiveStatScopes);
    expect(refined.exclusions).toEqual([...preset(skill).exclusions, ...resolved.exclusions!]);
    expect(refined.exclusions.find((x) => x.id === "blindChance")!.reason).toContain("manual weight is retained");
    expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
    expect(addSkillPresetPreferences(selected, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    expect(setSkillSupport(selected, support.id, false)).toEqual({ ...current, supportGemIds: [] });
  });

  it.each(poisonBowIds)("warns on both %s Blind tiers in either selection order without removing links or leaking warnings after removal", (skill) => {
    for (const id of ["blind-i", "blind-ii"]) for (const order of [[id, "blindside"], ["blindside", id]]) {
      let current = settings(skill);
      for (const selected of order) current = setSkillSupport(current, selected, true);
      expect(current.supportGemIds).toEqual(order);
      const resolved = selectedSkillSupports(preset(skill), current.supportGemIds).find((s) => s.id === id)!;
      expect(resolved.summary.startsWith("Blindside is selected: this supported skill cannot inflict Blind")).toBe(true);
      expect(resolved.summary).toContain("cannot supply Blindside's condition or strengthen a different source's Blind");
      expect(resolved.summary).toContain("10% higher Mana cost before rounding still applies");
      expect(resolved.summary).not.toContain("100% chance to Blind");
      const removed = setSkillSupport(current, "blindside", false);
      expect(removed).toEqual({ ...settings(skill), supportGemIds: [id] });
      expect(selectedSkillSupports(preset(skill), removed.supportGemIds)[0].summary).toContain("100% chance to Blind");
      expect(refineSkillPreferencePreset(preset(skill), removed.supportGemIds)).toEqual(preset(skill));
    }
    expect(reviewedSkillSupportsFor(skill).find((s) => s.id === "blind-i")!.summary).toContain("100% chance to Blind");
  });

  it.each(poisonBowIds)("round-trips %s's selected supports, cautions, manual weights, class, goals and budget", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["blind-ii", "poison-iii", "culling-strike-ii", "efficiency-ii"] };
    const selected = setSkillSupport(current, "blindside", true);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(restored.state.selectedClassStartId).toBe("ranger");
    expect(selectedSkillSupports(preset(skill), restored.state.optimizerSettings?.supportGemIds).find((s) => s.id === "blind-ii")!.summary)
      .toContain("Blindside is selected");
    expect(normalizeSkillSupportIds(skill, ["blindside", "blindside", "blind-i", "blind-ii", "poison-iii", null, "bad"]))
      .toEqual(["blindside", "blind-i", "poison-iii"]);
    expect(setSkillSupport(selected, "blindside", false)).toEqual(current);
  });

  it("checks conditional more modifiers against independently frozen chance/bonus arithmetic, not flat points or total critical damage", () => {
    expect(crit.offMore).toEqual([1, 1]);
    expect(crit.onMore).toEqual([1 + support.moreCriticalChance / 100, 1 + support.moreCriticalDamageBonus / 100]);
    expect(crit.preChance[1]).toBe(crit.preChance[0] * crit.onMore[0]);
    expect(crit.preChance[1]).not.toBe(crit.preChance[0] + support.moreCriticalChance);
    expect(crit.totalCritMultiplier[1]).toBe(1 + (crit.totalCritMultiplier[0] - 1) * crit.onMore[1]);
    expect(crit.totalCritMultiplier[1]).not.toBe(crit.totalCritMultiplier[0] * crit.onMore[1]);
    for (let i = 0; i < 2; i++) {
      expect(crit.effectiveChance[i]).toBeCloseTo(crit.preChance[i] * crit.hitChance / 100);
      expect(crit.critEffect[i]).toBeCloseTo(1 + crit.effectiveChance[i] / 100 * (crit.totalCritMultiplier[i] - 1));
    }
    expect(crit.noCritChance).toEqual([0, 0]);
    expect(crit.noCritEffect).toEqual([1, 1]);
  });

  it("does not accept the runtime's unmapped Blind prohibition or same-skill Blind II effect as an external supply", () => {
    expect(crit.nativeBlindProhibitionMapped).toBe(false);
    expect(crit.blindChanceAlone).toEqual([0, 0]);
    expect([crit.rawBlindChanceWithBlindI, crit.rawBlindChanceWithBlindII]).toEqual([100, 100]);
    expect(crit.rawPairedBlindIIOffEffect).toBe(20);
    expect(crit.rawPairedBlindIIOnHitChance).toBe(93);
    for (const skill of poisonBowIds) for (const id of ["blind-i", "blind-ii"]) {
      const caution = reviewedSkillSupportsFor(skill, ["blindside", id]).find((s) => s.id === id)!.summary;
      expect(caution).toContain("cannot inflict Blind");
      expect(caution).toContain("cannot supply Blindside's condition or strengthen a different source's Blind");
    }
  });

  it.each(components)("checks $skill's $component estimates against explicit critical modifiers and no-crit controls", (f) => {
    expect(f.sideMana).toBe(Math.floor(f.baseMana * (1 + support.manaMultiplier / 100)));
    expect(f.averageHit[0]).toBeCloseTo((f.physical + f.fire) * 1.043);
    expect(f.averageHit[1]).toBeCloseTo((f.physical + f.fire) * crit.critEffect[0]);
    expect(f.averageHit[2]).toBeCloseTo((f.physical + f.fire) * crit.critEffect[1]);
    expect(f.explicitCritHit).toBe(f.averageHit[2]);
    for (let i = 0; i < 3; i++) expect(f.totalDPS[i]).toBeCloseTo(f.averageHit[i] * 1.2 * (i === 0 ? .86 : .92));
    expect(f.neverCritHit).toEqual([f.physical + f.fire, f.physical + f.fire]);
    expect(f.neverCritDPS[1]).toBe(f.neverCritDPS[0]);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find((s) => s.id === "blindside")!.summary)
      .toContain("Native source-hit/Poison crit estimates are not actual burst/cloud crits");
  });

  it.each(poisons)("keeps $skill's native source-crit estimates separate from direct Poison magnitude, contact and timers", (f) => {
    expect(f.offPoison[1]).toBe(f.offPoison[0]);
    expect(f.onPoison[1]).toBeGreaterThan(f.onPoison[0]);
    expect(f.onPoison[1]).not.toBeCloseTo(f.onPoison[0] * 1.15);
    expect(f.explicitCritPoison).toBe(f.onPoison[1]);
    expect(f.neverCritPoison[1]).toBe(f.neverCritPoison[0]);
    expect(f.magnitude).toEqual([1, 1]);
    expect(f.chance).toEqual([100, 100]);
    expect(f.stacks).toEqual([1, 1]);
    expect(f.duration[1]).toBe(f.duration[0]);
    expect(f.skillDuration[1]).toBe(f.skillDuration[0]);
    expect(f.arrowOffPoison[1]).toBe(f.arrowOffPoison[0]);
    expect(f.arrowOnPoison[1]).toBeGreaterThan(f.arrowOnPoison[0]);
    expect(f.arrowChance).toEqual([60, 60]);
    expect(f.arrowDuration).toEqual([2, 2]);
    const baseMana = f.skill === "gas-arrow" ? 62 : 38;
    expect(f.bothPoisonCost).toBe(Math.floor(baseMana * 1.2 * 1.2));
    expect(f.bothBlindCost).toEqual([Math.floor(baseMana * 1.2 * 1.1), Math.floor(baseMana * 1.2 * 1.1)]);
  });

  it.each(poisonBowIds)("preserves %s's manual Blind/crit priorities, passive ownership and route scores", (skill) => {
    const current = settings(skill);
    for (const supportGemIds of [["blindside"], ["blindside", "blind-ii", "poison-iii"]]) {
      const selected = { ...current, supportGemIds };
      for (const p of [node("10% chance to Blind Enemies on Hit"), node("10% chance to Blind Enemies on Hit with Attacks"),
        node("20% increased Blind Effect", "20% increased Blind duration"), node("20% increased Critical Hit Chance"),
        node("20% increased Critical Damage Bonus"), node("20% increased Critical Hit Chance against Blinded Enemies"),
        node("20% increased Magnitude of Poison you inflict"), node("20% increased Damage over Time"),
        node("Minions have 100% increased Critical Hit Chance", "100% increased Damage with Plant Skills")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      const refined = refineSkillPreferencePreset(preset(skill), supportGemIds);
      expect(refined.suggestions).toEqual(preset(skill).suggestions);
      expect(refined.passiveStatScopes).toEqual(preset(skill).passiveStatScopes);
      expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
    }
  });

  it("keeps the conditional Fire explosion separate and does not auto-admit unreviewed parents or support variants", () => {
    expect(reviewedSkillSupports.find((s) => s.id === "blindside")?.skillIds).toEqual(poisonBowIds);
    expect(reviewedSkillSupportsFor("gas-arrow").find((s) => s.id === "blindside")!.summary).toContain("ignition/detonation is not supplied");
    for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion"]) {
      expect(setSkillSupport(settings(skill), "blindside", true)).toEqual(settings(skill));
      expect(reviewedSkillSupportsFor(skill, ["blindside"])).toEqual(reviewedSkillSupportsFor(skill));
    }
    for (const skill of poisonBowIds) {
      expect(setSkillSupport(settings(skill), "blindside-ii", true)).toEqual(settings(skill));
      expect(reviewedSkillSupportsFor(skill, "blindside")).toEqual(reviewedSkillSupportsFor(skill));
    }
  });
});

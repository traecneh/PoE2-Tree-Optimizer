import { describe, expect, it } from "vitest";
import { poisonBowCompressedSupportFixtures as supports, poisonBowCompressedNativeFixtures as native, poisonBowCompressedHitFixtures as hits } from "./poisonBowCompressedDurationSupports.fixtures";
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
  preferences: [{ id: "skillDuration", weight: 1 }, { id: "poisonDuration", weight: 2 }, { id: "poisonMagnitude", weight: 2 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });
const nativeTickRound = (seconds: number) => Math.ceil(seconds / .033) * .033;
const nativeMoreRound = (more: number) => Math.round(more * 100) / 100;

describe("Compressed Duration I/II for reviewed Poison bow focuses", () => {
  it.each(supports)("admits $name for both parents with linked/separate timer notes, not an implicit Poison upgrade", (f) => {
    for (const skill of poisonBowIds) {
      const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(resolved.summary).toContain(`${f.lessDuration}% less skill-effect duration, not faster Poison damage`);
      expect(resolved.summary).toContain("No damage bonus or direct damaging-ailment-duration penalty");
      expect(resolved.summary).toContain(skill === "gas-arrow" ? "shortens cloud lifetime, not the outgoing Poison timer" : "shortens the linked burst Poison");
      expect(resolved.summary).toContain("Separate arrow-hit Poison and Bleeding timers are unchanged");
      expect(resolved.summary).toContain("not a Poison-damage recommendation");
      expect(resolved.summary).toContain("no contacts, uptime or net-DPS gain is assumed");
      expect(resolved.priorities).toEqual([]);
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

  it.each(poisonBowIds)("replaces only %s's Compressed tier and round-trips every tier with other families, goals and budget", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["swift-affliction-ii", "prolonged-duration-ii", "poison-iii", "efficiency-ii"] };
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
    expect(normalizeSkillSupportIds(skill, ["compressed-duration-ii", "compressed-duration-i", "compressed-duration-ii", "swift-affliction-ii", null, "bad"]))
      .toEqual(["compressed-duration-ii", "swift-affliction-ii"]);
    expect(setSkillSupport(selected, "compressed-duration-ii", false)).toEqual(current);
  });

  it.each(native)("checks $skill's single skill-only penalty against independent controls, not Swift's two-name penalty", (f) => {
    supports.forEach((s, i) => {
      const single = 1 - s.lessDuration / 100;
      expect(f.durationMod[i]).toBeCloseTo(single);
      expect(f.damagingAilmentMore[i]).toBe(1);
      expect(f.tierDuration[i]).toBeCloseTo(nativeTickRound(f.baseSeconds * single));
      expect(f.tierDuration[i]).toBe(f.singleSkillDuration[i]);
      expect(f.tierPoisonDuration[i]).toBe(f.singleSkillPoisonDuration[i]);
      expect(f.tierPoison[i]).toBe(f.singleSkillPoison[i]);
      if (f.skill === "poisonburst-arrow") expect(f.tierPoisonDuration[i]).toBeCloseTo(f.poisonDuration * single);
      else expect(f.tierPoisonDuration[i]).toBe(f.poisonDuration);
    });
  });

  it.each(native)("does not turn $skill's shorter persistence into hit damage, magnitude, chance, speed or a cost increase", (f) => {
    supports.forEach((s, i) => {
      expect(f.hitDamageMore[i]).toBe(1 + s.damageMore / 100);
      expect(f.dotMore[i]).toBe(1);
      expect(f.poisonMagnitude[i]).toBe(1);
      expect(f.poisonChance[i]).toBe(100);
      expect(f.poisonStacks[i]).toBe(1);
      expect(f.tierMana[i]).toBe(Math.floor(f.mana * (1 + s.manaMultiplier / 100)));
      expect(f.tierHit[i]).toBe(f.hit);
      expect(f.tierRate[i]).toBe(f.rate);
      expect(f.tierRadius[i]).toBe(f.radius);
      if (f.skill === "poisonburst-arrow") expect(f.tierPoison[i]).toBeLessThan(f.poison);
      else expect(f.tierPoison[i]).toBe(f.poison);
    });
    // These are native per-Poison roll estimates, not cloud uptime or complete-lifetime damage guarantees.
  });

  it.each(native)("keeps $skill's skill-duration and Poison-duration increases separate with Prolonged Duration rounding", (f) => {
    supports.forEach((s, i) => {
      const single = 1 - s.lessDuration / 100;
      expect(f.duration100Mod[i]).toBeCloseTo(2 * single);
      expect(f.duration100Skill[i]).toBeCloseTo(nativeTickRound(f.baseSeconds * f.duration100Mod[i]));
      const prolonged = nativeMoreRound(single * 1.35);
      expect(f.prolongedMod[i]).toBeCloseTo(prolonged);
      expect(f.prolongedSkill[i]).toBeCloseTo(nativeTickRound(f.baseSeconds * prolonged));
      expect(f.prolongedMana[i]).toBe(Math.floor(f.mana * 1.2));
      if (f.skill === "poisonburst-arrow") {
        expect(f.duration100Poison[i]).toBeCloseTo(f.poisonDuration * 2 * single);
        expect(f.prolongedPoison[i]).toBeCloseTo(f.poisonDuration * prolonged);
      } else {
        expect(f.duration100Poison[i]).toBe(f.poisonDuration);
        expect(f.prolongedPoison[i]).toBe(f.poisonDuration);
      }
    });
    expect(f.poison100Skill).toBe(f.duration);
    expect(f.poison100Duration).toBe(f.poisonDuration * 2);
    expect(f.tier2Poison100Skill).toBe(f.tierDuration[1]);
    if (f.skill === "poisonburst-arrow") expect(f.tier2Poison100Duration).toBeCloseTo(f.poisonDuration * 2 * .65);
    else expect(f.tier2Poison100Duration).toBe(f.poison100Duration);
  });

  it.each(native)("does not shorten $skill's separately enabled actual-arrow Poison or Bleeding", (f) => {
    supports.forEach((_, i) => {
      expect(f.arrowTierPoisonDuration[i]).toBe(f.arrowPoisonDuration);
      expect(f.arrowTierBleedDuration[i]).toBe(f.arrowBleedDuration);
      expect(f.arrowTierPoison[i]).toBe(f.arrowPoison);
      expect(f.arrowTierBleed[i]).toBe(f.arrowBleed);
      expect(f.arrowPoisonChance[i]).toBe(60);
      expect(f.arrowPoisonMana[i]).toBe(Math.floor(f.mana * 1.2));
      expect(f.arrowPoisonMagnitude[i]).toBe(1);
      expect(f.arrowBleedMagnitude[i]).toBe(1);
    });
  });

  it.each(hits)("keeps $skill's $component damage unchanged and does not supply Poison", (f) => {
    expect(f.tierHit).toEqual([f.hit, f.hit]);
    expect(f.tierHasPoison).toEqual([false, false]);
  });

  it.each(native)("keeps $skill's Swift interaction explicit instead of making Compressed add another ailment-duration penalty", (f) => {
    expect(f.swift2Mod).toBe(.81);
    const durationMore = nativeMoreRound(.65 * .9);
    expect(f.tier2Swift2DurationMod).toBeCloseTo(durationMore * .9);
    expect(f.tier2Swift2Skill).toBeCloseTo(nativeTickRound(f.baseSeconds * durationMore * .9));
    if (f.skill === "poisonburst-arrow") expect(f.tier2Swift2PoisonDuration).toBeCloseTo(f.poisonDuration * durationMore * .9);
    else expect(f.tier2Swift2PoisonDuration).toBe(f.swift2PoisonDuration);
    // Swift's reviewed native overlap remains a model observation, not verified exact game timing.
  });

  it.each(poisonBowIds)("preserves %s's chosen duration priorities, scopes and route scores", (skill) => {
    const current = settings(skill);
    for (const s of supports) for (const supportGemIds of [[s.id], [s.id, "swift-affliction-ii", "prolonged-duration-ii"]]) {
      const selected = { ...current, supportGemIds };
      for (const p of [node("20% increased Skill Effect Duration"), node("20% increased Poison Duration"), node("20% increased Damage over Time"),
        node("20% increased Magnitude of Poison you inflict"), node("20% increased Attack Damage"), node("20% increased Spell Damage"),
        node("Minions deal 100% increased Damage", "100% increased Damage with Plant Skills")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(preset(skill), supportGemIds)).toEqual(preset(skill));
    }
  });

  it("does not auto-admit other Duration skills or infer unreviewed variants", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.find((entry) => entry.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow", "toxic-growth", "entangle", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "compressed-duration-unknown", true)).toEqual(settings(skill));
  });
});

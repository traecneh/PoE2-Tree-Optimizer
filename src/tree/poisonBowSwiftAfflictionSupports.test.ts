import { describe, expect, it } from "vitest";
import { poisonBowSwiftSupportFixtures as supports, poisonBowSwiftNativeFixtures as native, poisonBowSwiftHitFixtures as hits } from "./poisonBowSwiftAfflictionSupports.fixtures";
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
  preferences: [{ id: "skillDuration", weight: 1 }, { id: "poisonDuration", weight: 2 }, { id: "poisonMagnitude", weight: 2 }, { id: "damageOverTime", weight: 1 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });
const nativeTickRound = (seconds: number) => Math.ceil(seconds / .033) * .033;

describe("Swift Affliction I/II for reviewed Poison bow focuses", () => {
  it.each(supports)("admits $name without inheriting non-ailment damage or the older intrinsic-DoT duration priority", (f) => {
    for (const skill of poisonBowIds) {
      const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(resolved.summary).toContain("30% more non-ailment DoT, not Poison magnitude");
      expect(resolved.summary).toContain(`${f.lessDuration}% less skill-effect and damaging-ailment duration in the source`);
      expect(resolved.summary).toContain("no intrinsic non-ailment DoT to boost");
      expect(resolved.summary).toContain(skill === "gas-arrow" ? "outgoing Poison takes one ailment-duration penalty" : "combines both duration penalties for the linked burst Poison");
      expect(resolved.summary).toContain("unverified");
      expect(resolved.summary).toContain("Not a Poison-damage recommendation");
      expect(resolved.summary).toContain("No guaranteed contacts or uptime");
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

  it.each(poisonBowIds)("replaces only %s's Swift tier and persists each tier with manual priorities, goals and budget", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["poison-iii", "bleed-iii", "prolonged-duration-ii", "efficiency-ii"] };
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
    expect(normalizeSkillSupportIds(skill, ["swift-affliction-ii", "swift-affliction-i", "swift-affliction-iii", "swift-affliction-ii", "poison-iii", null]))
      .toEqual(["swift-affliction-ii", "poison-iii"]);
    expect(setSkillSupport(selected, "swift-affliction-ii", false)).toEqual(current);
  });

  it.each(native)("does not turn $skill's non-ailment damage modifier into Poison magnitude, hit damage or a cost increase", (f) => {
    expect(f.directDotControlPoison).toBe(f.poison);
    expect(f.directDotControlDuration).toBe(f.duration);
    expect(f.directDotControlPoisonDuration).toBe(f.poisonDuration);
    supports.forEach((s, i) => {
      expect(f.dotMore[i]).toBe(1 + s.nonAilmentDotMore / 100);
      expect(f.poisonMagnitude[i]).toBe(1);
      expect(f.tierPoison[i]).toBeLessThan(f.poison);
      expect(f.poisonChance[i]).toBe(100);
      expect(f.poisonStacks[i]).toBe(1);
      expect(f.tierMana[i]).toBe(f.mana);
      expect(f.tierHit[i]).toBe(f.hit);
      expect(f.tierRate[i]).toBe(f.rate);
      expect(f.tierRadius[i]).toBe(f.radius);
    });
    // Duration-dependent roll selection in native estimates is not Poison magnitude or a 30% DPS bonus.
  });

  it.each(native)("separates $skill's source-stated duration penalty from PoB's double-name calculation", (f) => {
    expect(f.exactGameDurationVerified).toBe(false);
    supports.forEach((s, i) => {
      const single = 1 - s.lessDuration / 100;
      expect(f.durationMore[i]).toBe(single);
      expect(f.damagingAilmentMore[i]).toBe(single);
      expect(f.durationMod[i]).toBeCloseTo(single * single);
      expect(f.tierDuration[i]).toBeCloseTo(nativeTickRound(f.baseSeconds * single * single));
      expect(f.singleSkillDuration[i]).toBeCloseTo(nativeTickRound(f.baseSeconds * single));
      expect(f.tierDuration[i]).not.toBe(f.singleSkillDuration[i]);
      expect(f.singleAilmentSkillDuration[i]).toBe(f.duration);
      expect(f.singleAilmentPoisonDuration[i]).toBeCloseTo(f.poisonDuration * single);
      if (f.skill === "poisonburst-arrow") {
        expect(f.tierPoisonDuration[i]).toBeCloseTo(f.poisonDuration * single * single);
        expect(f.singleSkillPoisonDuration[i]).toBeCloseTo(f.poisonDuration * single);
      } else {
        expect(f.tierPoisonDuration[i]).toBeCloseTo(f.poisonDuration * single);
        expect(f.singleSkillPoisonDuration[i]).toBe(f.poisonDuration);
      }
    });
  });

  it.each(native)("checks $skill's duration increases and Prolonged Duration without conflating cloud lifetime and outgoing Poison", (f) => {
    supports.forEach((s, i) => {
      const single = 1 - s.lessDuration / 100;
      expect(f.duration100Mod[i]).toBeCloseTo(2 * single * single);
      expect(f.duration100Skill[i]).toBeCloseTo(nativeTickRound(f.baseSeconds * f.duration100Mod[i]));
      // PoB rounds the combined Duration-more factor to percentage precision before combining the ailment name.
      const nativeRoundedMore = Math.round(single * 1.35 * 100) / 100;
      expect(f.prolongedDurationMod[i]).toBeCloseTo(nativeRoundedMore * single);
      expect(f.prolongedSkill[i]).toBeCloseTo(nativeTickRound(f.baseSeconds * f.prolongedDurationMod[i]));
      expect(f.prolongedMana[i]).toBe(Math.floor(f.mana * 1.2));
      if (f.skill === "poisonburst-arrow") {
        expect(f.duration100Poison[i]).toBeCloseTo(2 * f.poisonDuration * single * single);
        expect(f.prolongedPoison[i]).toBeCloseTo(f.poisonDuration * nativeRoundedMore * single);
      } else {
        expect(f.duration100Poison[i]).toBe(f.tierPoisonDuration[i]);
        expect(f.prolongedPoison[i]).toBe(f.tierPoisonDuration[i]);
      }
    });
  });

  it.each(native)("keeps $skill's separately enabled actual-arrow Poison and Bleeding in their own duration/magnitude scopes", (f) => {
    supports.forEach((s, i) => {
      const single = 1 - s.lessDuration / 100;
      expect(f.arrowTierPoisonDuration[i]).toBeCloseTo(f.arrowPoisonDuration * single);
      expect(f.arrowTierBleedDuration[i]).toBeCloseTo(f.arrowBleedDuration * single);
      expect(f.arrowPoisonChance[i]).toBe(60);
      expect(f.arrowPoisonMana[i]).toBe(Math.floor(f.mana * 1.2));
      expect(f.arrowPoisonMagnitude[i]).toBe(1);
      expect(f.arrowBleedMagnitude[i]).toBe(1);
      expect(f.arrowTierPoison[i]).toBeLessThan(f.arrowPoison);
      expect(f.arrowTierBleed[i]).toBeLessThan(f.arrowBleed);
    });
  });

  it.each(hits)("does not add Poison or direct damage to $skill's $component", (f) => {
    expect(f.tierHit).toEqual([f.hit, f.hit]);
    expect(f.tierHasPoison).toEqual([false, false]);
  });

  it.each(poisonBowIds)("keeps %s's manual DoT/duration choices and scores without broadening hit or ownership scopes", (skill) => {
    const current = settings(skill);
    for (const s of supports) {
      const selected = setSkillSupport(current, s.id, true);
      for (const p of [node("20% increased Damage over Time"), node("20% increased Skill Effect Duration"), node("20% increased Poison Duration"),
        node("20% increased Magnitude of Poison you inflict"), node("20% increased Attack Damage"), node("20% increased Spell Damage"),
        node("Minions deal 100% increased Damage", "100% increased Damage with Plant Skills")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds)).toEqual(preset(skill));
    }
  });

  it("preserves the older intrinsic-DoT reviews rather than overriding their duration priorities with Poison-focus notes", () => {
    for (const s of supports) {
      for (const skill of ["essence-drain", "contagion", "vine-arrow"]) {
        const resolved = reviewedSkillSupportsFor(skill).find((entry) => entry.id === s.id)!;
        expect(resolved.priorities).toMatchObject([{ id: "skillDuration", weight: 3 }]);
        expect(resolved.summary).not.toContain("Not a Poison-damage recommendation");
      }
      expect(reviewedSkillSupportsFor("vine-arrow").find((entry) => entry.id === s.id)?.summary).toContain("Boosts intrinsic vine DoT");
    }
  });

  it("keeps I/II scopes frozen and rejects unknown variants rather than inferring generic DoT pairs", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.find((entry) => entry.id === s.id)?.skillIds).toEqual(["essence-drain", "contagion", "vine-arrow", ...poisonBowIds]);
      for (const skill of ["toxic-growth", "entangle", "fireball", "skeletal-sniper"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "unreviewed-swift-affliction", true)).toEqual(settings(skill));
  });
});

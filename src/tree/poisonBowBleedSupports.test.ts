import { describe, expect, it } from "vitest";
import { poisonBowBleedSupportFixtures as supports, poisonBowBleedNativeFixtures as native, poisonBowBleedFireFixture as fire } from "./poisonBowBleedSupports.fixtures";
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
  preferences: [{ id: "poisonMagnitude", weight: 2 }, { id: "bleedingChance", weight: 1 }, { id: "bleedingMagnitude", weight: 1 }, { id: "life", weight: 3 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats });

describe("Bleed I/II/III for reviewed Poison bow focuses", () => {
  it.each(supports)("admits $name for both parents without promoting no-hit source fields or assuming uptime", (f) => {
    for (const skill of poisonBowIds) {
      const resolved = reviewedSkillSupportsFor(skill).find((s) => s.id === f.id)!;
      expect({ name: resolved.name, effectId: resolved.effectId, family: resolved.family }).toEqual({ name: f.name, effectId: f.effectId, family: f.family });
      expect(resolved.summary).toContain(`${f.chance}% chance to inflict Bleeding on eligible hits, not increased chance or Bleeding magnitude`);
      expect(resolved.summary).toContain("initial arrow must hit and deal eligible Physical damage");
      expect(resolved.summary).toContain(skill === "gas-arrow" ? "no-hit cloud cannot inflict Bleeding" : "no-hit burst cannot inflict Bleeding");
      expect(resolved.summary).toContain("contact and uptime are not assumed");
      expect(resolved.summary).toContain("Admixture's reverse bonus still needs Poisoned");
      expect(resolved.summary).toContain("synthetic source-hit Bleeding fields are not actual burst/cloud Bleeding");
      expect(resolved.summary).toContain(f.manaMultiplier ? "Higher Mana cost" : "No added Mana cost multiplier");
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

  it.each(poisonBowIds)("replaces only %s's Bleed tier and saves every tier independently of Poison and Admixture", (skill) => {
    const current = { ...settings(skill), supportGemIds: ["poison-iii", "admixture", "efficiency-ii"] };
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
    expect(normalizeSkillSupportIds(skill, ["bleed-ii", "bleed-i", "bleed-iii", "bleed-ii", "poison-iii", "admixture", "bleed-iv", null]))
      .toEqual(["bleed-ii", "poison-iii", "admixture"]);
    expect(setSkillSupport(selected, "bleed-iii", false)).toEqual(current);
  });

  it.each(native)("checks $skill's actual arrow-hit Bleeding against independent flat-chance controls and caps", (f) => {
    expect(f.baselineHasBleedDamage).toBe(false);
    supports.forEach((s, index) => {
      expect(f.tierRawChance[index]).toBe(s.chance);
      expect(f.tierChance[index]).toBe(Math.min(100, f.tierRawChance[index]));
      expect(f.tierBleed[index]).toBe(f.independentChanceBleed[index]);
      expect(f.tierBleed[index]).toBeGreaterThan(0);
      expect(f.tierBleedMagnitude[index]).toBe(1);
      expect(f.tierBleedDuration[index]).toBe(5);
      expect(f.tierHit[index]).toBe(f.hit);
      expect(f.tierRate[index]).toBe(f.rate);
      expect(f.tierHasPoisonDamage[index]).toBe(false);
      expect(f.enemyBleeding[index]).toBe(false);
      expect(f.enemyPoisoned[index]).toBe(false);
      expect(f.tierMana[index]).toBe(Math.floor(f.mana * (1 + s.manaMultiplier / 100)));
    });
    expect(f.overcapRaw).toBe(supports[2].chance + 50);
    expect(f.overcapFinal).toBe(Math.min(100, f.overcapRaw));
    expect(f.overcapBleed).toBe(f.tierBleed[2]);
    expect(f.efficiencyMana).toBe(Math.ceil(f.tierMana[1] * .6));
    // PoB's roll/application estimates are not verified contacts or a sustained-uptime guarantee.
  });

  it.each(native)("keeps $skill's inherent no-hit Poison unchanged and does not validate synthetic Bleeding as real hits", (f) => {
    expect(f.inherentNoHit).toBe(true);
    expect(f.sourceNoHitStats).toContain("display_fake_attack_hit_poison");
    expect(f.sourceNoHitStats).toContain("display_skill_poisons_without_hit");
    supports.forEach((_, index) => {
      expect(f.tierInherentPoison[index]).toBe(f.inherentPoison);
      expect(f.tierInherentPoisonDuration[index]).toBe(f.inherentPoisonDuration);
      expect(f.tierSkillDuration[index]).toBe(f.skillDuration);
      expect(f.tierRadius[index]).toBe(f.radius);
      expect(f.tierPoisonMagnitude[index]).toBe(1);
      expect(f.tierPoisonChance[index]).toBe(100);
      expect(f.tierPoisonStacks[index]).toBe(1);
      expect(f.syntheticBleedFields[index]).toBeGreaterThan(0);
    });
    // The source explicitly poisons without hits; these native fields must not become app Bleeding/DPS scores.
  });

  it.each(native)("does not auto-enable $skill's Poison III/Admixture conditions just because Bleed III is linked", (f) => {
    expect(f.trioEnemyBleeding).toBe(false);
    expect(f.trioEnemyPoisoned).toBe(false);
    expect(f.admixtureArrowBleed).toBe(f.tierBleed[2]);
    expect(f.trioArrowBleed).toBe(f.tierBleed[2]);
    expect(f.trioInherentPoison).toBe(f.inherentPoison);
    expect(f.trioPoisonedInherentPoison).toBe(f.inherentPoison);
    expect(f.trioBleedingArrowBleed).toBe(f.trioArrowBleed);
    expect(f.trioPoisonedArrowPoison).toBe(f.trioArrowPoison);
    expect(f.trioBleedingMagnitude).toBeCloseTo(1.2 * 1.2);
    expect(f.trioBleedingInherentPoison).toBeCloseTo(f.inherentPoison * 1.2 * 1.2);
    expect(f.trioBleedingArrowPoison).toBeCloseTo(f.trioArrowPoison * 1.2 * 1.2);
    expect(f.trioPoisonedBleedMagnitude).toBe(1.2);
    expect(f.trioPoisonedArrowBleed).toBeCloseTo(f.trioArrowBleed * 1.2);
    expect(f.trioBothArrowBleed).toBe(f.trioPoisonedArrowBleed);
    expect(f.trioBothArrowPoison).toBe(f.trioBleedingArrowPoison);
    expect(f.trioBothInherentPoison).toBe(f.trioBleedingInherentPoison);
    expect(f.trioMana).toBe(Math.floor(f.mana * 1.2 * 1.2));
  });

  it("does not turn Gas Arrow's Fire-explosion chance field into eligible Physical Bleeding or Poison", () => {
    expect(fire.physicalHit).toBe(0);
    expect(fire.tierHit).toEqual([fire.hit, fire.hit, fire.hit]);
    expect(fire.tierChance).toEqual(supports.map((s) => s.chance));
    expect(fire.tierHasBleedDamage).toEqual([false, false, false]);
    expect(fire.tierHasPoisonDamage).toEqual([false, false, false]);
  });

  it.each(poisonBowIds)("preserves %s's manual weights and scores without broadening ailment, hit or ownership scopes", (skill) => {
    const current = settings(skill);
    for (const s of supports) for (const supportGemIds of [[s.id], [s.id, "admixture", "poison-iii"]]) {
      const selected = { ...current, supportGemIds };
      for (const p of [node("20% increased Magnitude of Poison you inflict"), node("10% chance to inflict Bleeding on Hit"), node("20% increased Magnitude of Bleeding you inflict"),
        node("20% increased Attack Damage"), node("20% increased Spell Damage"), node("Minions deal 100% increased Damage", "100% increased Damage with Plant Skills")]) {
        expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
        expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      }
      expect(refineSkillPreferencePreset(preset(skill), supportGemIds)).toEqual(preset(skill));
    }
  });

  it("keeps I/II/III scopes narrow while admitting the separately reviewed Tier IV", () => {
    for (const s of supports) {
      expect(reviewedSkillSupports.find((entry) => entry.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow", "toxic-growth", "entangle", "fireball", "skeletal-sniper", "contagion"])
        expect(setSkillSupport(settings(skill), s.id, true)).toEqual(settings(skill));
    }
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "bleed-iv", true)).toEqual({ ...settings(skill),supportGemIds:["bleed-iv"] });
  });
});

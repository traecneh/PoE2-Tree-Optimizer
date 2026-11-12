import { describe, expect, it } from "vitest";
import { poisonBowWitheringTouchSupportFixture as support, poisonBowWitheringComponents as components, poisonBowWitheringSources as sources } from "./poisonBowWitheringTouchSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7,
  preferences: [{ id: "physicalDamage", weight: 2 }, { id: "chaosDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }] });

describe("Withering Touch for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's actual Chaos-hit requirement and penalty without assuming Wither uptime", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name, effectId: s.effectId, family: s.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect([support.catalogTier,support.lessDamage,support.witherBaseMs,support.chancePerThreshold,support.manaMultiplier]).toEqual([1,25,4000,175,0]);
    expect(s.sourceUrl).toContain("sup_int.lua#L8730");
    for (const text of ["25% less Damage", "Actual Chaos hit damage is required", "175% Wither chance per full enemy Ailment Threshold",
      "chance able to surpass 100%", "four-second base Wither duration", "adds no Chaos damage", "including Poison from Physical sources",
      "can-Wither flag does not establish hit eligibility, application chance or uptime", "no stacks or uptime are assumed",
      "No added Mana cost multiplier", skill === "gas-arrow" ? "Fire-only explosions do not qualify" : "not real burst hits"])
      expect(s.summary).toContain(text);
    expect(s.priorities).toEqual([]);
    const current = settings(skill), selected = setSkillSupport(current, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current, supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
    for (const stat of ["20% increased Physical Damage", "20% increased Chaos Damage", "20% increased Magnitude of Poison you inflict", "Minions deal 20% increased Damage"]) {
      const n: TreeNode = { id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats: [stat] };
      expect(passivePreferenceValues(n, selected)).toEqual(passivePreferenceValues(n, current));
      expect(scorePassiveNode(n, selected.preferences, selected)).toBe(scorePassiveNode(n, current.preferences, current));
    }
  });

  it.each(components)("keeps $skill's $component damage loss separate from Chaos-hit eligibility", f => {
    expect(f.hits[1]).toBeLessThan(f.hits[0]);
    expect(f.source[1][0]).toBeLessThan(f.source[0][0]);
    expect(f.source[1][1]).toBeLessThan(f.source[0][1]);
    expect(f.chaosHit).toEqual([0,0]);
    expect(support.chanceCanSurpass100).toBe(true);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("cannot apply Wither on Hit");
  });

  it.each(sources)("independently checks %s's penalty and explicit Wither scenarios, not automatic stacks", f => {
    const component = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const weighted = (range: readonly number[]) => range[0] + (range[1] - range[0]) * f.roll / 100;
    expect(f.poison[1] / f.poison[0]).toBeCloseTo(weighted(component.source[1]) / weighted(component.source[0]), 9);
    expect(f.mixedPoison[1]).toBeLessThan(f.mixedPoison[0]);
    for (const [index, stacks] of [1,10,20].entries())
      expect(f.explicitStacks[index]).toBeCloseTo(f.poison[1] * (1 + Math.min(stacks, support.modeledStackCap) * support.takenPerStack / 100), 9);
    expect(f.explicitStacks[1]).toBe(f.explicitStacks[2]);
    expect(f.efficiencyMana).toBe(Math.ceil(f.mana * .6));
    expect(f.mixedMana).toBe(Math.floor(f.mana * 1.2));
    expect(f.poisonIIIMana).toBe(Math.floor(f.mana * 1.2));
    expect(f.poisonIIIChance).toBe(60);
    expect(f.poisonIIIDuration).toBe(2);
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("round-trips %s's support while retaining manual state, mixed-source caution and prior warnings", skill => {
    const initial = { ...settings(skill), supportGemIds: ["chaos-attunement", "malady", "poison-iii", "blindside", "blind-ii", "longshot-ii", "close-combat-ii", "corrosion", "exploit-weakness"] };
    const selected = setSkillSupport(initial, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds, support.id] });
    expect(normalizeSkillSupportIds(skill, [support.id,support.id,"chaos-attunement",null])).toEqual([support.id,"chaos-attunement"]);
    expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset, initial.supportGemIds));
    expect(refineSkillPreferencePreset(preset, selected.supportGemIds).exclusions.find(e => e.id === "chaosDamage")!.reason).toContain("Chaos Damage can scale that portion");
    const resolved = selectedSkillSupports(preset, selected.supportGemIds);
    expect(resolved.find(s => s.id === "poison-iii")!.summary).toContain("Malady is selected");
    expect(resolved.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
    for (const id of ["longshot-ii","close-combat-ii"]) expect(resolved.find(s => s.id === id)!.summary).toContain("their damage bonuses do not overlap");
    for (const id of ["corrosion","exploit-weakness"]) expect(resolved.find(s => s.id === id)!.summary).toContain("Incompatible pair selected");
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))[0].state.optimizerSettings).toEqual(selected);
    expect(setSkillSupport(selected, support.id, false)).toEqual(initial);
  });

  it("does not expand to unreviewed skills or invent support tiers", () => {
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow","toxic-growth","lightning-arrow","fireball","skeletal-sniper","contagion"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "withering-touch-ii", true)).toEqual(settings(skill));
  });
});

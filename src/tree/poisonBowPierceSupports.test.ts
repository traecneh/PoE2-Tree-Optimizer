import { describe, expect, it } from "vitest";
import { poisonBowPierceSupportFixtures as supports, poisonBowPierceComponents as components, poisonBowPierceSources as sources } from "./poisonBowPierceSupports.fixtures";
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

describe("Pierce tiers for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds.flatMap(skill => supports.map(support => ({ skill,support }))))("reviews $support.name for $skill without inventing contacts or score multipliers", ({ skill,support }) => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${support.line}`);
    expect(s.priorities).toEqual([]);
    for (const text of ["No extra contacts, Poison applications or uptime are assumed", "Poison chance, duration and maximum stacks are unchanged",
      "No added Mana cost multiplier", "Manual weights and route scores stay unchanged",
      skill === "gas-arrow" ? "does not supply ignition/detonation or guarantee extra clouds" : "extra burst contacts or overlaps are not inferred"])
      expect(s.summary).toContain(text);
    if (support.tier === 2) expect(s.summary).toContain("without a damage penalty");
    else {
      expect(s.summary).toContain("20% less");
      expect(s.summary).toContain("also lowers its weapon-derived Poison-source estimate");
      expect(s.summary).toContain("not a second Poison penalty");
      expect(s.summary).toContain("not real burst/cloud hits or proof of live-game source inheritance");
    }
    if (support.tier === 1) expect(s.summary).toContain("No post-pierce penalty applies before a prior pierce");
    if (support.tier === 3) expect(s.summary).toContain("Prior-pierce count is conditional");
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Physical Damage","20% increased Projectile Damage","20% increased Magnitude of Poison you inflict","Minions deal 20% increased Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
    const [saved] = normalizeSavedBuilds([{ id: skill,name: skill,createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))[0].state.optimizerSettings).toEqual(selected);
    expect(setSkillSupport(selected,support.id,false)).toEqual({ ...current,supportGemIds: [] });
  });

  it.each(components)("keeps $skill's $component native post-pierce estimates distinct from actual contact count", f => {
    expect(f.hits[1]).toBeLessThan(f.hits[0]);
    expect(f.hits[2]).toBeLessThan(f.hits[1]);
    expect(f.ranges[1][0]).toBeLessThan(f.ranges[0][0]);
    expect(f.ranges[2][1]).toBeLessThan(f.ranges[1][1]);
    if (!f.actualHit) for (const support of supports.filter(s => s.tier !== 2))
      expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("Native source-hit fields are not real burst/cloud hits");
  });

  it.each(sources)("independently checks %s's once-only Poison penalty and unchanged costs", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const weighted = (range: readonly number[]) => range[0]+(range[1]-range[0])*f.roll/100;
    for (const index of [1,2]) expect(f.poison[index]/f.poison[0]).toBeCloseTo(weighted(source.ranges[index])/weighted(source.ranges[0]),9);
    expect(f.arrowPoison[1]).toBeLessThan(f.arrowPoison[0]);
    expect(f.efficiencyMana).toBe(Math.ceil(f.mana*.6));
    expect(f.poisonIIIMana).toBe(Math.floor(f.mana*1.2));
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("replaces %s's Pierce family only, retaining earlier warnings and mixed-source caution", skill => {
    const initial = { ...settings(skill),supportGemIds: ["chaos-attunement","withering-touch","malady","poison-iii","blindside","blind-ii","longshot-ii","close-combat-ii","corrosion","exploit-weakness"] };
    const preset = getSkillPreferencePreset(skill)!;
    let selected = initial;
    for (const support of supports) {
      selected = setSkillSupport(selected,support.id,true) as typeof initial;
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds,support.id] });
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,initial.supportGemIds));
      const resolved = selectedSkillSupports(preset,selected.supportGemIds);
      expect(resolved.filter(s => s.family === "Pierce")).toHaveLength(1);
      expect(resolved.find(s => s.id === "poison-iii")!.summary).toContain("Malady is selected");
      expect(resolved.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
      expect(resolved.find(s => s.id === "withering-touch")!.summary).toContain("no stacks or uptime are assumed");
      for (const id of ["longshot-ii","close-combat-ii"]) expect(resolved.find(s => s.id === id)!.summary).toContain("their damage bonuses do not overlap");
      for (const id of ["corrosion","exploit-weakness"]) expect(resolved.find(s => s.id === id)!.summary).toContain("Incompatible pair selected");
    }
    expect(setSkillSupport(selected,"pierce-iii",false)).toEqual(initial);
    expect(normalizeSkillSupportIds(skill,["pierce-i","pierce-ii","pierce-iii","pierce-i",null])).toEqual(["pierce-i"]);
  });

  it("restricts each tier to the two reviewed focuses", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([1,3,5]);
    for (const support of supports) {
      expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
      expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","lightning-arrow","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
    }
  });
});

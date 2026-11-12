import { describe, expect, it } from "vitest";
import { poisonBowMomentumSupportFixture as support, poisonBowMomentumComponents as components, poisonBowMomentumSources as sources } from "./poisonBowMomentumSupport.fixtures";
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

describe("Momentum for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's movement condition and always-paid cost without assuming uptime or changing scores", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${support.line}`);
    for (const text of ["40% more Damage only if you move 2 metres during the supported skill's use", "teleportation does not count",
      "General Moving, projectile travel or increased Movement Speed does not establish this condition", "Uptime is not assumed",
      "eligible pre-mitigation Poison source once, not again as a separate Poison multiplier", "Source-hit fields are not real burst/cloud hits or proof of live-game source timing",
      "20% higher Mana cost before rounding applies even when the damage condition is inactive", "Mobility and Deliberation do not automatically satisfy the distance condition",
      "No extra hits, Poison applications, stacks or duration are credited", "Manual weights and route scores stay unchanged",
      skill === "gas-arrow" ? "extra clouds, overlap and detonation are not inferred" : "on-hit Poison stay separate from the no-hit Poison burst"])
      expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Physical Damage","20% increased Movement Speed","20% increased Magnitude of Poison you inflict","Minions deal 20% increased Damage"]) {
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

  it.each(components)("keeps $skill's $component conditional source separate from guaranteed contacts", f => {
    expect(f.hits[1]).toBe(f.hits[0]);
    expect(f.hits[2]).toBeGreaterThan(f.hits[0]);
    for (const [i,index] of [[0,0],[2,1]]) expect(f.hits[i]).toBeCloseTo((f.ranges[index][0]+f.ranges[index][1])/2*1.05*(f.component.includes("Fire") ? 1 : .25),9);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(r => r.id === support.id)!.summary).toContain("Source-hit fields are not real burst/cloud hits");
  });

  it.each(sources)("independently checks %s's once-only conditional source scaling and unconditional cost", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const modeled = (range: readonly number[]) => {
      const potential = 1.2*f.duration, roll = potential/(potential+1), critical = 1-Math.pow(.95,potential);
      return (range[0]+(range[1]-range[0])*roll)*(1+critical)*.2;
    };
    expect(f.poison[0]).toBeCloseTo(modeled(source.ranges[0]),9);
    expect(f.poison[1]).toBe(f.poison[0]);
    expect(f.poison[2]).toBeCloseTo(modeled(source.ranges[1]),9);
    expect(f.poison[2]).not.toBeCloseTo(modeled(source.ranges[1])*1.4,3);
    expect(f.deliberation[0]).toBeCloseTo(modeled(f.deliberationRanges[0]),9);
    expect(f.deliberation[1]).toBe(f.deliberation[0]);
    expect(f.deliberation[2]).toBeCloseTo(modeled(f.deliberationRanges[1]),9);
    expect(f.momentumMana).toBe(Math.floor(f.mana*1.2));
    expect(f.efficiencyMana).toBe(Math.ceil(f.momentumMana*.6));
    expect(f.poisonIIIMana).toBe(Math.floor(f.mana*1.44));
    expect(f.poisonIII[1]).toBeGreaterThan(f.poisonIII[0]);
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("preserves %s's movement, delivery and prior warnings when toggling Momentum", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    const peers = ["mobility","deliberation","chaos-attunement","withering-touch","malady","poison-iii","blindside","blind-ii", "longshot-ii","close-combat-ii","corrosion","exploit-weakness","fork","pierce-iii","chain-iii","ricochet-ii"];
    for (const delivery of [["salvo","nova-projectiles-i"],["multishot-ii","nova-projectiles-i"],["nova-projectiles-ii"]]) {
      const initial = { ...settings(skill),supportGemIds: [...peers,...delivery] };
      const selected = setSkillSupport(initial,support.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds,support.id] });
      const original = selectedSkillSupports(preset,initial.supportGemIds);
      const resolved = selectedSkillSupports(preset,selected.supportGemIds);
      for (const peer of original) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,initial.supportGemIds));
      expect(setSkillSupport(selected,support.id,false)).toEqual(initial);
    }
    expect(normalizeSkillSupportIds(skill,["momentum","momentum",null,"momentum-ii"])).toEqual(["momentum"]);
    expect(normalizeSkillSupportIds(skill,["momentum","mobility","deliberation","salvo","nova-projectiles-i"]))
      .toEqual(["momentum","mobility","deliberation","salvo","nova-projectiles-i"]);
  });

  it("does not broaden compatibility or invent Momentum tiers", () => {
    expect(support.catalogTier).toBe(2);
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.some(s => /^momentum-/.test(s.id))).toBe(false);
    expect(reviewedSkillSupports.find(r => r.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow","toxic-growth","lightning-arrow","fireball","skeletal-sniper","contagion"])
      expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
  });
});

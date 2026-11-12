import { describe, expect, it } from "vitest";
import { poisonBowMultishotSupportFixtures as supports, poisonBowMultishotComponents as components, poisonBowMultishotSources as sources } from "./poisonBowMultishotSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7,
  preferences: [{ id: "physicalDamage", weight: 2 }, { id: "attackSpeed", weight: 1 }, { id: "poisonMagnitude", weight: 3 }] });

describe("Multishot tiers for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds.flatMap(skill => supports.map(support => ({ skill,support }))))("reviews $support.name for $skill without multiplying contacts or scores", ({ skill,support }) => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${support.line}`);
    for (const text of [`+${support.extraProjectiles} Projectiles`,`${support.lessDamage}% less Damage`,`${support.lessSpeed}% less Skill Speed`,
      "Projectile count is not hit count, extra Poison stacks or three times the DPS", "damage penalty reduces the eligible Poison source once",
      "not Poison tick speed or duration", "not guaranteed contacts or uptime", "Native source-hit fields are not real burst/cloud hits",
      "No extra hits, Poison stacks or cloud coverage are credited", "Poison chance, duration and maximum stacks are unchanged",
      "No added Mana cost multiplier", "Manual weights and route scores stay unchanged",
      skill === "gas-arrow" ? "Extra cloud placements, overlaps, terrain attachment and ignition/detonation are not inferred" : "Extra bursts or overlapping contacts are not inferred"])
      expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Physical Damage","20% increased Attack Speed","20% increased Magnitude of Poison you inflict","Minions deal 20% increased Damage"]) {
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

  it.each(components)("keeps $skill's $component damage penalty separate from firing speed and actual contacts", f => {
    expect(f.hits[1]).toBeLessThan(f.hits[2]);
    expect(f.hits[2]).toBeLessThan(f.hits[0]);
    for (const index of [0,1,2]) {
      const baseCritWeightedHit = (f.ranges[index][0]+f.ranges[index][1])/2*1.05;
      expect(f.hits[index]).toBeCloseTo(baseCritWeightedHit*(f.skill === "gas-arrow" && f.actualHit && f.component.includes("Fire") ? 1 : .25),9);
    }
    if (!f.actualHit) for (const s of supports) expect(reviewedSkillSupportsFor(f.skill).find(r => r.id === s.id)!.summary).toContain("Native source-hit fields are not real burst/cloud hits");
  });

  it.each(sources)("independently separates %s's damage, repeated-source selection and projectile count", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    // Native repeated-application estimate includes a changing critical-Poison presence.
    const weightedSource = (range: readonly number[], speed: number) => {
      const potential = speed*f.duration, roll = potential/(potential+1), criticalPresence = 1-Math.pow(.95,potential);
      const hit = range[0]+(range[1]-range[0])*roll;
      return hit*(1-criticalPresence)+2*hit*criticalPresence;
    };
    const baseline = weightedSource(source.ranges[0],1.2);
    for (const index of [0,1,2]) {
      const speed = index === 0 ? 1.2 : 1.2*.8;
      expect(f.potential[index]).toBeCloseTo(speed*f.duration,9);
      expect(f.roll[index]).toBeCloseTo(100*f.potential[index]/(f.potential[index]+1),9);
      expect(f.poison[index]/f.poison[0]).toBeCloseTo(weightedSource(source.ranges[index],speed)/baseline,9);
      if (index) {
        expect(f.damageOnly[index-1]/f.poison[0]).toBeCloseTo(weightedSource(source.ranges[index],1.2)/baseline,9);
        expect(f.arrowPoison[index]).toBeLessThan(f.arrowPoison[0]);
      }
    }
    expect(f.speedOnly/f.poison[0]).toBeCloseTo(weightedSource(source.ranges[0],.96)/baseline,9);
    expect(f.speedOnly/f.poison[0]).not.toBeCloseTo(.8,3);
    expect(f.projectilesOnly).toBe(f.poison[0]);
    expect(f.efficiencyMana).toBe(Math.ceil(f.mana*.6));
    expect(f.poisonIIIMana).toBe(Math.floor(f.mana*1.2));
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("replaces only %s's Multishot tier and preserves all other warnings", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    const initial = { ...settings(skill),supportGemIds: ["rapid-attacks-ii","chaos-attunement","withering-touch","malady","poison-iii","blindside","blind-ii",
      "longshot-ii","close-combat-ii","corrosion","exploit-weakness","fork","pierce-iii","chain-iii"] };
    let selected: PassiveOptimizationSettings = initial;
    const original = selectedSkillSupports(preset,initial.supportGemIds);
    for (const s of supports) {
      selected = setSkillSupport(selected,s.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds,s.id] });
      const resolved = selectedSkillSupports(preset,selected.supportGemIds);
      expect(resolved.filter(r => r.family === "AdditionalProjectiles")).toHaveLength(1);
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,initial.supportGemIds));
      for (const peer of original) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
      expect(setSkillSupport(selected,s.id,false)).toEqual(initial);
    }
    expect(normalizeSkillSupportIds(skill,["multishot-i","multishot-ii","multishot-i",null])).toEqual(["multishot-i"]);
  });

  it("does not expand legal supports to unreviewed focuses or fictional tiers", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([1,2]);
    expect(reviewedSkillSupports.some(s => s.id === "multishot-iii")).toBe(false);
    for (const s of supports) {
      expect(reviewedSkillSupports.filter(r => r.id === s.id)).toHaveLength(1);
      expect(reviewedSkillSupports.find(r => r.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","lightning-arrow","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),s.id,true)).toEqual(settings(skill));
    }
  });
});

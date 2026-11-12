import { describe, expect, it } from "vitest";
import { poisonBowNovaSupportFixtures as supports, poisonBowNovaComponents as components, poisonBowNovaSources as sources } from "./poisonBowNovaSupports.fixtures";
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
const [novaI,novaII] = supports.map(s => s.id);

describe("Nova Projectiles for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds.flatMap(skill => supports.map(support => ({ skill,support }))))("reviews $support.name for $skill without adding contacts or changing scores", ({ skill,support }) => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family,additionalFamilies: s.additionalFamilies ?? [] })
      .toEqual({ name: support.name,effectId: support.effectId,family: support.family,additionalFamilies: support.additionalFamilies });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${support.line}`);
    for (const text of ["Circular delivery is not guaranteed extra contacts, overlapping Poison, stacks or uptime",
      "Native source-hit fields are not real burst/cloud hits", "Poison chance, duration and maximum stacks stay unchanged",
      "Manual weights and route scores stay unchanged", skill === "gas-arrow" ? "Extra clouds, overlaps, ignition and detonation are not inferred" : "Extra bursts or overlapping contacts are not inferred"])
      expect(s.summary).toContain(text);
    for (const text of support.baseCooldown ? ["+6 Projectiles", "50% less Damage", "eight-second base cooldown", "no added Skill Speed penalty or Mana multiplier",
      "selecting this replaces Nova I and Multishot, not stacks them", "damage penalty reduces the eligible Poison source once", "Cooldown recovery is separate from firing speed and Poison duration"]
      : ["no added projectiles, damage penalty, cooldown or Mana multiplier", "Can coexist with Multishot; its damage and speed penalties still apply"])
      expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Physical Damage","20% increased Cooldown Recovery Rate","20% increased Magnitude of Poison you inflict","Minions deal 20% increased Damage"]) {
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

  it.each(components)("keeps $skill's $component delivery, source and cooldown separate", f => {
    expect(f.hits[1]).toBe(f.hits[0]);
    expect(f.hits[2]).toBeLessThan(f.hits[0]);
    for (const index of [0,1,2]) expect(f.hits[index]).toBeCloseTo((f.ranges[index][0]+f.ranges[index][1])/2*1.05*(f.component.includes("Fire") ? 1 : .25),9);
    if (!f.actualHit) for (const s of supports) expect(reviewedSkillSupportsFor(f.skill).find(r => r.id === s.id)!.summary).toContain("Native source-hit fields are not real burst/cloud hits");
  });

  it.each(sources)("independently checks %s's cooldown-limited Poison model without crediting seven hits", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const modeled = (range: readonly number[], speed: number) => {
      const potential = speed*f.duration, roll = potential > 1 ? potential/(potential+1) : .5;
      const critical = 1-Math.pow(.95,Math.max(potential,1));
      const hit = range[0]+(range[1]-range[0])*roll;
      return hit*(1+critical)*.2*Math.min(potential,1);
    };
    const cooldown = Math.ceil(8/.033)*.033, recovered = Math.ceil(4/.033)*.033;
    expect(cooldown).toBeCloseTo(8.019,9);
    expect(recovered).toBeCloseTo(4.026,9);
    expect(f.poison[0]).toBeCloseTo(modeled(source.ranges[0],1.2),9);
    expect(f.poison[1]).toBe(f.poison[0]);
    expect(f.poison[2]).toBeCloseTo(modeled(source.ranges[2],1/cooldown),9);
    expect(f.damageOnly).toBeCloseTo(modeled(source.ranges[2],1.2),9);
    expect(f.recovery100).toBeCloseTo(modeled(source.ranges[2],1/recovered),9);
    expect(f.poison[2]).toBeLessThan(f.damageOnly);
    expect(f.efficiencyMana).toBe(Math.ceil(f.mana*.6));
    expect(f.poisonIIIMana).toBe(Math.floor(f.mana*1.2));
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("replaces every shared family for %s without discarding unrelated links or warnings", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    const peers = ["rapid-attacks-ii","chaos-attunement","withering-touch","malady","poison-iii","blindside","blind-ii", "longshot-ii","close-combat-ii","corrosion","exploit-weakness","fork","pierce-iii","chain-iii"];
    const initial = { ...settings(skill),supportGemIds: peers };
    const original = selectedSkillSupports(preset,peers);
    let selected = setSkillSupport(initial,novaI,true);
    for (const multishot of ["multishot-i","multishot-ii"]) {
      selected = setSkillSupport(selected,multishot,true);
      expect(selected.supportGemIds).toEqual([...peers,novaI,multishot]);
      selected = setSkillSupport(selected,novaII,true);
      expect(selected.supportGemIds).toEqual([...peers,novaII]);
      const resolved = selectedSkillSupports(preset,selected.supportGemIds);
      for (const peer of original) expect(resolved.find(s => s.id === peer.id)!.summary).toBe(peer.summary);
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,peers));
      expect(setSkillSupport(selected,novaII,false)).toEqual(initial);
      selected = setSkillSupport(selected,multishot,true);
      expect(selected.supportGemIds).toEqual([...peers,multishot]);
      selected = setSkillSupport(selected,novaI,true);
      expect(selected.supportGemIds).toEqual([...peers,multishot,novaI]);
      selected = setSkillSupport(initial,novaI,true);
    }
    expect(setSkillSupport(setSkillSupport(initial,novaII,true),novaI,true).supportGemIds).toEqual([...peers,novaI]);
  });

  it.each(poisonBowIds)("normalizes %s's saved overlapping families deterministically without blocking legal pairs", skill => {
    const cases: [unknown[],string[]][] = [
      [[novaI,"multishot-i",novaII],[novaI,"multishot-i"]],
      [["multishot-i",novaI,novaII],["multishot-i",novaI]],
      [[novaII,"multishot-i",novaI],[novaII]],
      [["multishot-i",novaII,novaI],["multishot-i",novaI]],
      [[novaI,novaII,"multishot-ii"],[novaI,"multishot-ii"]],
      [[novaII,novaII,null,"nova-projectiles-iii","fireball"],[novaII]],
    ];
    for (const [input,expected] of cases) {
      expect(normalizeSkillSupportIds(skill,input)).toEqual(expected);
      expect(normalizePassiveOptimizationSettings({ ...settings(skill),supportGemIds: input }).supportGemIds).toEqual(expected);
    }
  });

  it("does not broaden skill compatibility or invent tiers", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([2,4]);
    expect(reviewedSkillSupports.some(s => s.id === "nova-projectiles-iii")).toBe(false);
    for (const s of supports) {
      expect(reviewedSkillSupports.filter(r => r.id === s.id)).toHaveLength(1);
      expect(reviewedSkillSupports.find(r => r.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","lightning-arrow","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),s.id,true)).toEqual(settings(skill));
    }
  });
});

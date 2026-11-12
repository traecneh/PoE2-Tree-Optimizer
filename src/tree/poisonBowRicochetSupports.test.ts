import { describe, expect, it } from "vitest";
import { poisonBowRicochetSupportFixtures as supports, poisonBowRicochetComponents as components, poisonBowRicochetSources as sources } from "./poisonBowRicochetSupports.fixtures";
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

describe("Ricochet tiers for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds.flatMap(skill => supports.map(support => ({ skill,support }))))("reviews $support.name for $skill without supplying walls or changing scores", ({ skill,support }) => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${support.line}`);
    for (const text of [`${support.chance}% chance for projectiles to Chain an additional time from terrain`,
      "Requires a terrain collision; suitable walls, targets and repeat hits are not supplied", "not ordinary Chain count or Poison chance",
      "PoB caps displayed terrain-chain chance at 100%", "even 100% does not supply a collision or valid target",
      "No extra contacts, Poison applications, stacks or uptime are credited", "No added damage/speed penalty, cooldown or Mana multiplier",
      "other links retain their costs, penalties and collision rules", "Poison duration and maximum stacks stay unchanged",
      "Manual weights and route scores stay unchanged",
      skill === "gas-arrow" ? "Compatibility does not prove a terrain bounce creates another cloud, overlap or detonation" : "Ricochet does not turn the burst into a hit or guarantee another burst"])
      expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
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

  it.each(components)("keeps $skill's $component unchanged instead of multiplying by terrain chance", f => {
    expect(f.hits).toEqual([f.hits[0],f.hits[0],f.hits[0]]);
    expect(f.hits[0]).toBeCloseTo((f.range[0]+f.range[1])/2*1.05*(f.component.includes("Fire") ? 1 : .25),9);
    if (!f.actualHit) for (const s of supports) expect(reviewedSkillSupportsFor(f.skill).find(r => r.id === s.id)!.summary).toContain(f.skill === "gas-arrow" ? "no-hit cloud Poison" : "no-hit Poison burst");
  });

  it.each(sources)("independently checks %s's unchanged Poison, costs and separate probability cap", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const potential = 1.2*f.duration, roll = potential/(potential+1), critical = 1-Math.pow(.95,potential);
    const hit = source.range[0]+(source.range[1]-source.range[0])*roll;
    expect(f.roll).toBeCloseTo(roll*100,9);
    expect(f.poison[0]).toBeCloseTo(hit*(1+critical)*.2,9);
    for (const values of [f.poison,f.deliveryPoison,f.novaPoison]) expect(values).toEqual([values[0],values[0],values[0]]);
    expect(supports.map(s => Math.min(60+s.chance,100))).toEqual([100,100]);
    expect(f.efficiencyMana).toBe(Math.ceil(f.mana*.6));
    expect(f.poisonIIIMana).toBe(Math.floor(f.mana*1.2));
    expect(f.deliveryMana).toBe(Math.floor(f.mana*1.1));
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("replaces only %s's Ricochet tier, preserving delivery families and previous warnings", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    const peers = ["chaos-attunement","withering-touch","malady","poison-iii","blindside","blind-ii", "longshot-ii","close-combat-ii","corrosion","exploit-weakness","fork","pierce-iii","chain-iii"];
    for (const delivery of [["nova-projectiles-i","multishot-ii"],["nova-projectiles-ii"]]) {
      const initial = { ...settings(skill),supportGemIds: [...peers,...delivery] };
      let selected: PassiveOptimizationSettings = initial;
      const original = selectedSkillSupports(preset,initial.supportGemIds);
      for (const s of supports) {
        selected = setSkillSupport(selected,s.id,true);
        expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds,s.id] });
        const resolved = selectedSkillSupports(preset,selected.supportGemIds);
        expect(resolved.filter(r => r.family === "Ricochet")).toHaveLength(1);
        for (const peer of original) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
        expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,initial.supportGemIds));
        expect(setSkillSupport(selected,s.id,false)).toEqual(initial);
      }
    }
    expect(normalizeSkillSupportIds(skill,["ricochet-i","ricochet-ii","ricochet-i",null])).toEqual(["ricochet-i"]);
    expect(normalizeSkillSupportIds(skill,["ricochet-ii","nova-projectiles-i","multishot-i"])).toEqual(["ricochet-ii","nova-projectiles-i","multishot-i"]);
  });

  it("does not broaden skill compatibility or invent tiers", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([2,4]);
    expect(reviewedSkillSupports.some(s => s.id === "ricochet-iii")).toBe(false);
    for (const s of supports) {
      expect(reviewedSkillSupports.filter(r => r.id === s.id)).toHaveLength(1);
      expect(reviewedSkillSupports.find(r => r.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","lightning-arrow","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),s.id,true)).toEqual(settings(skill));
    }
  });
});

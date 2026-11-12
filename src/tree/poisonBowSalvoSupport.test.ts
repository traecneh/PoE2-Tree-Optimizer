import { describe, expect, it } from "vitest";
import { poisonBowSalvoSupportFixture as support, poisonBowSalvoComponents as components, poisonBowSalvoSources as sources } from "./poisonBowSalvoSupport.fixtures";
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

describe("Salvo for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's Seal data without assuming cap, extra hits or changing scores", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family,additionalFamilies: s.additionalFamilies })
      .toEqual({ name: support.name,effectId: support.effectId,family: support.family,additionalFamilies: support.additionalFamilies });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${support.line}`);
    for (const text of ["gain a Seal each second, up to six", "+1 Projectile per Seal", "fired in random directions",
      "Actual Seals depend on waiting and use; maximum Seals and extra hits are not assumed", "maps the Seal cap but not Salvo's interval, per-Seal projectiles or random delivery",
      "zero Seal timer is missing modeling, not instant gain", "max-Seals toggle does not establish a damage bonus",
      "Requires self-used Projectile Attacks without an existing cooldown, Combo requirement or other Seals",
      "replaces Multishot and Nova II, but can coexist with Nova I", "No added Mana multiplier, cooldown or damage/speed penalty",
      "No extra Poison applications, stacks or uptime are credited", "Manual weights and route scores stay unchanged",
      skill === "gas-arrow" ? "extra clouds, overlap, ignition or detonation are not inferred" : "extra bursts or overlapping contacts are not inferred"])
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

  it.each(components)("does not interpret %s's $component unchanged native output as complete Seal simulation", f => {
    expect(f.hits[1]).toBe(f.hits[0]);
    expect(f.hits[0]).toBeCloseTo((f.range[0]+f.range[1])/2*1.05*(f.component.includes("Fire") ? 1 : .25),9);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(r => r.id === support.id)!.summary).toContain(f.skill === "gas-arrow" ? "no-hit cloud Poison" : "no-hit burst");
  });

  it.each(sources)("independently checks %s's unchanged model without treating zero timing as instant Seals", f => {
    expect(support.intervalMs/1000).toBe(1);
    expect(f.nativeSealMax).toBe(support.maximumSeals);
    expect(f.nativeSealTimer).not.toBe(support.intervalMs/1000);
    expect(f.nativeProjectiles).toBe(1);
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const modeled = (speed: number) => {
      const potential = speed*f.duration, roll = potential/(potential+1), critical = 1-Math.pow(.95,potential);
      return (source.range[0]+(source.range[1]-source.range[0])*roll)*(1+critical)*.2;
    };
    expect(f.poison[0]).toBeCloseTo(modeled(1.2),9);
    expect(f.rapidPoison[0]).toBeCloseTo(modeled(1.5),9);
    expect(f.poison[1]).toBe(f.poison[0]);
    expect(f.rapidPoison[1]).toBe(f.rapidPoison[0]);
    expect(f.efficiencyMana).toBe(Math.ceil(f.mana*.6));
    expect(f.poisonIIIMana).toBe(Math.floor(f.mana*1.2));
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("enforces %s's AdditionalProjectiles conflict while retaining Nova I and unrelated warnings", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    const peers = ["chaos-attunement","withering-touch","malady","poison-iii","blindside","blind-ii", "longshot-ii","close-combat-ii","corrosion","exploit-weakness","fork","pierce-iii","chain-iii","ricochet-ii"];
    for (const delivery of [["multishot-i","nova-projectiles-i"],["multishot-ii","nova-projectiles-i"],["nova-projectiles-ii"]]) {
      const initial = { ...settings(skill),supportGemIds: [...peers,...delivery] };
      const selected = setSkillSupport(initial,support.id,true);
      const remaining = delivery.includes("nova-projectiles-i") ? ["nova-projectiles-i"] : [];
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,...remaining,support.id] });
      const original = selectedSkillSupports(preset,[...peers,...remaining]);
      const resolved = selectedSkillSupports(preset,selected.supportGemIds);
      for (const peer of original) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,original.map(s => s.id)));
      expect(setSkillSupport(selected,support.id,false).supportGemIds).toEqual([...peers,...remaining]);
      expect(setSkillSupport(selected,delivery[0],true).supportGemIds).toEqual([...peers,...remaining,delivery[0]]);
      expect(setSkillSupport(selected,"nova-projectiles-ii",true).supportGemIds).toEqual([...peers,"nova-projectiles-ii"]);
    }
    for (const [input,expected] of [
      [["salvo","multishot-i","nova-projectiles-i"],["salvo","nova-projectiles-i"]],
      [["nova-projectiles-ii","salvo","nova-projectiles-i"],["nova-projectiles-ii"]],
      [["nova-projectiles-i","salvo","nova-projectiles-ii"],["nova-projectiles-i","salvo"]],
      [["multishot-i","salvo","nova-projectiles-ii","nova-projectiles-i"],["multishot-i","nova-projectiles-i"]],
    ]) expect(normalizeSkillSupportIds(skill,input)).toEqual(expected);
    expect(normalizeSkillSupportIds(skill,["salvo","salvo",null,"salvo-ii"])).toEqual(["salvo"]);
  });

  it("does not broaden compatibility or invent Salvo tiers", () => {
    expect(support.catalogTier).toBe(3);
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.some(s => /^salvo-/.test(s.id))).toBe(false);
    expect(reviewedSkillSupports.find(r => r.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow","toxic-growth","lightning-arrow","fireball","skeletal-sniper","contagion"])
      expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
  });
});

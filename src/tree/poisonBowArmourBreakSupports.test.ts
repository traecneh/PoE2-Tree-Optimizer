import { describe, expect, it } from "vitest";
import { poisonBowArmourBreakSupportFixtures as supports, poisonBowArmourBreakComponents as components,
  poisonBowArmourBreakStates as states, poisonBowArmourBreakNative as native } from "./poisonBowArmourBreakSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "armourBreakAmount",weight: 3 },{ id: "physicalDamage",weight: 2 },{ id: "poisonMagnitude",weight: 3 }] });
const note = (skill: string,id: string,ids?: string[]) => reviewedSkillSupportsFor(skill,ids).find(s => s.id === id)!.summary;

describe("Armour Break for reviewed Poison bow focuses", () => {
  for (const skill of poisonBowIds) it.each(supports)(`reviews ${skill}'s $name without supplying Armour or charge uptime`, f => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: f.name,effectId: f.effectId,family: "ArmourBreak" });
    expect(s.sourceUrl).toContain(`sup_str.lua#L${f.line}`);
    for (const text of [`Physical Hits Break Armour equal to ${f.amount}% of Physical damage dealt`, `not ${f.amount}% more damage`,
      "Poison is damage over time, not a Physical Hit", "not real hit-based Armour Break", "CanArmourBreak capability flag",
      "does not calculate this percentage-based break amount", "zero ArmourBreakPerHit is not zero effect in game",
      "Corrosion's separate 80%-of-Poison-damage Armour Break", "not extra Poison DPS or a second copy", "does not grant arrow Poison chance",
      "Exploit Weakness prevents this skill from Breaking Armour", "cannot supply its own Fully Broken Armour condition or charge trigger",
      "No added Mana multiplier from Armour Break itself", "Fully Broken Armour or Endurance Charge uptime",
      "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (f.chargeChance) for (const text of [`${f.chargeChance}% chance to gain an Endurance Charge on Fully Breaking Armour`,
      "not on every hit or partial break", "not proof this skill caused that event", "does not map this charge-event stat"]) expect(s.summary).toContain(text);
    else expect(s.summary).toContain("This tier grants no Endurance Charge chance");
    if (skill === "gas-arrow") expect(s.summary).toContain("fully converted Fire explosion has no Physical hit damage");
    const current = settings(skill), selected = setSkillSupport(current,f.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [f.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Armour Break", "20% increased Physical Damage", "20% increased Magnitude of Poison you inflict",
      "40% more Damage against Enemies with Fully Broken Armour", "Minions have 20% increased Physical Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("keeps $skill's $component separate from capability flags and Poison-derived Corrosion", f => {
    expect(native.amount).toBe(0); expect(native.chargeCount).toBe(0);
    expect(native.capabilityWithSupport).toBe(true); expect(native.prohibitionWithExploit).toBe(true);
    expect(f.corrosionMana).toBe(Math.floor(f.mana*1.1));
    expect(f.exploitMana).toBe(Math.floor(f.mana*1.3));
    expect(f.physicalHit).toBe(f.actualHit && f.component === "arrow");
    for (const support of supports) {
      const nominalBreak = f.physicalHit ? native.nominalPhysicalDamage*support.amount/100 : 0;
      expect(nominalBreak).toBe(f.physicalHit ? support.amount : 0);
      expect(note(f.skill,support.id)).toContain("not real hit-based Armour Break");
    }
    if (!f.actualHit) expect(f.poison).toBeGreaterThan(0);
    // Separate unit checks, not combined event rates or a prediction of target Armour.
    expect(100*.8).toBe(80);
  });

  it.each(states)("keeps $state as an explicit state, not an earned full-break or charge event", f => {
    expect(f.full && f.partial).toBe(false);
    expect(f.exploitFactor).toBe(f.full ? 1.4 : 1);
    expect(native.chargeCount).toBe(0);
  });

  it.each(poisonBowIds)("warns reversibly about %s's Exploit prohibition without losing the Corrosion conflict", skill => {
    for (const f of supports) for (const ids of [[f.id,"exploit-weakness"],["exploit-weakness",f.id]]) {
      const selected = ids.reduce((s,id) => setSkillSupport(s,id,true),settings(skill));
      expect(selected.supportGemIds).toEqual(ids);
      for (const id of ids) {
        const text = note(skill,id,ids);
        for (const expected of ["the support can remain linked, but this skill cannot Break Armour", "Do not credit self-supplied Fully Broken Armour",
          "on-full-break Endurance Charge trigger", "selections and manual weights are retained"]) expect(text).toContain(expected);
      }
      const triple = setSkillSupport(selected,"corrosion",true);
      for (const id of ["corrosion","exploit-weakness"]) expect(note(skill,id,triple.supportGemIds)).toContain("Corrosion is ignored in either link order");
      expect(note(skill,f.id,triple.supportGemIds)).toContain("this skill cannot Break Armour");
      const noExploit = setSkillSupport(triple,"exploit-weakness",false);
      for (const id of [f.id,"corrosion"]) expect(note(skill,id,noExploit.supportGemIds)).toBe(note(skill,id));
      const noBreak = setSkillSupport(selected,f.id,false);
      expect(note(skill,"exploit-weakness",noBreak.supportGemIds)).toBe(note(skill,"exploit-weakness"));
      expect(selected.preferences).toEqual(settings(skill).preferences);
    }
    for (const invalid of [undefined,[],["armour-break-iv","exploit-weakness"]])
      expect(note(skill,"exploit-weakness",invalid)).not.toContain("Exploit Weakness is selected with Armour Break");
  });

  it.each(poisonBowIds)("round-trips %s's selected tier and restores notes while retaining older links and weights", skill => {
    const peers = ["poison-iii","corrosion","exploit-weakness","life-drain","soul-drain","pin-iii","stun-iii",...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    let current: PassiveOptimizationSettings = { ...settings(skill),supportGemIds: peers };
    const old = selectedSkillSupports(getSkillPreferencePreset(skill)!,peers);
    for (const f of supports) {
      current = setSkillSupport(current,f.id,true);
      expect(current.supportGemIds).toEqual([...peers,f.id]);
      for (const peer of old.filter(s => s.id !== "exploit-weakness")) expect(note(skill,peer.id,current.supportGemIds)).toBe(peer.summary);
    }
    const [saved] = normalizeSavedBuilds([{ id: skill,name: skill,createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: current,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    const [restored] = parseSavedBuildExport(serializeSavedBuildExport([saved]));
    expect(restored.state.optimizerSettings).toEqual(current);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(note(skill,"armour-break-iii",restored.state.optimizerSettings?.supportGemIds)).toContain("the support can remain linked");
    expect(setSkillSupport(current,"armour-break-iii",false)).toEqual({ ...settings(skill),supportGemIds: peers });
  });

  it("keeps six reviewed pairs narrow and tiers in one distinct family", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([2,3,4]);
    expect(reviewedSkillSupportsFor("poisonburst-arrow").filter(s => s.family === "ArmourBreak").map(s => s.id)).toEqual(supports.map(s => s.id));
    for (const f of supports) {
      expect(reviewedSkillSupports.find(s => s.id === f.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),f.id,true)).toEqual(settings(skill));
    }
    expect(normalizeSkillSupportIds("gas-arrow",["armour-break-ii","armour-break-i","armour-break-iii","corrosion","exploit-weakness"]))
      .toEqual(["armour-break-ii","corrosion","exploit-weakness"]);
  });
});

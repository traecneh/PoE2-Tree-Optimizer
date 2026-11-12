import { describe, expect, it } from "vitest";
import { poisonBowArmourDemolisherSupportFixtures as supports, poisonBowArmourDemolisherComponents as components,
  poisonBowArmourDemolisherNative as native } from "./poisonBowArmourDemolisherSupports.fixtures";
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

describe("Armour Demolisher for reviewed Poison bow focuses", () => {
  for (const skill of poisonBowIds) it.each(supports)(`reviews ${skill}'s $name as break strength, not damage or an application source`, f => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: f.name,effectId: f.effectId,family: "ArmourDemolisher" });
    expect(s.sourceUrl).toContain(`sup_str.lua#L${f.line}`);
    for (const text of [`${f.amount}% more Armour Break (${f.factor}x break strength)`, "not more Hit damage, Poison DPS",
      "Does not grant an Armour Break source", "Armour Break support uses eligible Physical Hits", "Corrosion uses supported Poison damage as a separate source",
      "does not multiply Poison damage again or supply arrow Poison chance", "ArmourBreakEffect More modifier separately from ArmourBreakPerHit",
      "break amounts remain uncalculated", "Unchanged native break output is not zero effect in game",
      "stronger break cannot bypass that prohibition", "Corrosion remains ineligible with Exploit Weakness", "No added Mana multiplier from Demolisher itself",
      "Fully Broken Armour, Endurance Charge uptime or damage bonus", "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (skill === "gas-arrow") expect(s.summary).toContain("fully converted Fire explosion supplies no Physical hit-based break");
    else expect(s.summary).toContain("native synthetic source-hit fields are not extra applications");
    const current = settings(skill), selected = setSkillSupport(current,f.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [f.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["Break 20% increased Armour", "20% increased Physical Damage", "20% increased Magnitude of Poison you inflict",
      "40% more Damage against Enemies with Fully Broken Armour", "Minions have 20% increased Physical Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(supports)("checks $name's nominal units separately from native event coverage", f => {
    expect(f.factor).toBe(1+f.amount/100);
    const i = supports.findIndex(s => s.id === f.id);
    expect(native.nominalHitBreak*f.factor).toBe(native.nominalHitResults[i]);
    expect(native.nominalCorrosionBreak*f.factor).toBe(native.nominalCorrosionResults[i]);
    expect(native.breakPerHitMore).not.toBe(f.factor);
    expect(native.breakPerHit).toBe(0); expect(native.parsedBreakIncrease).toBe(100);
    expect(native.capabilityAlone).toBe(false); expect(native.capabilityWithBreak).toBe(true);
    expect(native.charges).toBe(0);
  });

  it.each(components)("keeps $skill's $component damage and costs separate from stronger break", f => {
    expect(f.corrosionMana).toBe(Math.floor(f.mana*1.1));
    expect(f.exploitMana).toBe(Math.floor(f.mana*1.3));
    expect(f.hit).toBeGreaterThan(0);
    if (!f.actualHit) expect(f.poison).toBeGreaterThan(0);
    for (const s of supports) expect(note(f.skill,s.id)).toContain("not more Hit damage, Poison DPS");
  });

  it.each(poisonBowIds)("retains %s's Break/Corrosion families and reverses only the new Exploit warning", skill => {
    for (const f of supports) for (const ids of [["exploit-weakness",f.id],[f.id,"exploit-weakness"]]) {
      const selected = ids.reduce((s,id) => setSkillSupport(s,id,true),settings(skill));
      expect(selected.supportGemIds).toEqual(ids);
      expect(note(skill,f.id,ids)).toContain("Exploit Weakness is selected: this skill cannot Break Armour");
      expect(note(skill,f.id,ids)).toContain("does not bypass that prohibition or establish full-break/charge events");
      expect(note(skill,"exploit-weakness",ids)).toBe(note(skill,"exploit-weakness"));
      const all = setSkillSupport(setSkillSupport(selected,"armour-break-iii",true),"corrosion",true);
      for (const id of ["exploit-weakness","corrosion"]) expect(note(skill,id,all.supportGemIds)).toContain("Corrosion is ignored in either link order");
      expect(note(skill,"armour-break-iii",all.supportGemIds)).toContain("the support can remain linked, but this skill cannot Break Armour");
      const noExploit = setSkillSupport(all,"exploit-weakness",false);
      for (const id of [f.id,"armour-break-iii","corrosion"]) expect(note(skill,id,noExploit.supportGemIds)).toBe(note(skill,id));
      expect(selected.preferences).toEqual(settings(skill).preferences);
    }
    for (const invalid of [undefined,[],["exploit-weakness-ii"]])
      expect(note(skill,"armour-demolisher-ii",invalid)).toBe(note(skill,"armour-demolisher-ii"));
  });

  it.each(poisonBowIds)("round-trips %s's selected tier while retaining older warnings and manual settings", skill => {
    const peers = ["armour-break-iii","corrosion","exploit-weakness","poison-iii","life-drain","soul-drain",...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    const initial = { ...settings(skill),supportGemIds: peers };
    const previous = selectedSkillSupports(getSkillPreferencePreset(skill)!,peers);
    let current: PassiveOptimizationSettings = initial;
    for (const f of supports) {
      current = setSkillSupport(current,f.id,true);
      expect(current.supportGemIds).toEqual([...peers,f.id]);
      for (const s of previous) expect(note(skill,s.id,current.supportGemIds)).toBe(s.summary);
    }
    const [saved] = normalizeSavedBuilds([{ id: skill,name: skill,createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: current,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    const [restored] = parseSavedBuildExport(serializeSavedBuildExport([saved]));
    expect(restored.state.optimizerSettings).toEqual(current);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(note(skill,"armour-demolisher-ii",restored.state.optimizerSettings?.supportGemIds)).toContain("Exploit Weakness is selected");
    expect(setSkillSupport(current,"armour-demolisher-ii",false)).toEqual(initial);
  });

  it("keeps four reviewed pairs narrow and Demolisher distinct from Armour Break", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([1,3]);
    expect(reviewedSkillSupports.filter(s => s.family === "ArmourDemolisher").map(s => s.id)).toEqual(supports.map(s => s.id));
    for (const f of supports) {
      expect(reviewedSkillSupports.find(s => s.id === f.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),f.id,true)).toEqual(settings(skill));
    }
    expect(normalizeSkillSupportIds("gas-arrow",["armour-demolisher-ii","armour-demolisher-i","armour-break-iii","corrosion","exploit-weakness"]))
      .toEqual(["armour-demolisher-ii","armour-break-iii","corrosion","exploit-weakness"]);
  });
});

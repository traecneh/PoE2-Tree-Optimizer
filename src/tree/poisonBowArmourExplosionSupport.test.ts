import { describe, expect, it } from "vitest";
import { poisonBowArmourExplosionSupportFixture as support, poisonBowArmourExplosionComponents as components,
  poisonBowArmourExplosionChild as child, poisonBowArmourExplosionStates as states } from "./poisonBowArmourExplosionSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "armourBreakAmount",weight: 3 },{ id: "fireDamage",weight: 2 },{ id: "poisonMagnitude",weight: 3 }] });
const note = (skill: string,id: string,ids?: string[]) => reviewedSkillSupportsFor(skill,ids).find(s => s.id === id)!.summary;

describe("Armour Explosion for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's separate Fire attack and supported-skill event without adding priorities", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_str.lua#L${support.line}`);
    for (const text of ["separate player-owned Fire Area Attack", "only when this supported skill Fully Breaks",
      "Partial break, an already Fully Broken target or another skill/minion's full break", "Does not grant a break source or more Poison DPS",
      "own attack scaling, not the parent's Poison DPS", "cannot Break Armour itself: no self-triggering break loop",
      "Corrosion's Poison-based break is separate", "event ownership and timing still need to be established",
      "does not map the full-break trigger linkage/chance", "child hit/DPS even without a qualifying event",
      "not verified trigger frequency or guaranteed extra damage", "cannot supply its own explosion event",
      "Corrosion remains ineligible with Exploit Weakness", "zero Mana cost does not waive parent firing",
      "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (skill === "gas-arrow") expect(s.summary).toContain("Gas Arrow's own conditional Fire detonation are separate from this granted explosion");
    else expect(s.summary).toContain("synthetic source-hit fields are not real burst hits");
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["Break 20% increased Armour", "20% increased Fire Damage", "20% increased Area Damage",
      "20% increased Magnitude of Poison you inflict", "Minions deal 20% increased Fire Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("keeps $skill's $component hit/Poison and cost separate from the granted child", f => {
    expect(f.corrosionMana).toBe(Math.floor(f.mana*1.1)); expect(f.exploitMana).toBe(Math.floor(f.mana*1.3));
    expect(f.hit).not.toBe(child.averageHit);
    if (!f.actualHit) expect(f.poison).toBeGreaterThan(0);
    expect(note(f.skill,support.id)).toContain("not the parent's Poison DPS");
  });

  it.each(poisonBowIds)("checks %s's actual granted child fields without treating native attack speed as a trigger rate", skill => {
    expect(support.childId).toBe("ArmourExplosionPlayer");
    expect(child.owner).toBe("player"); expect(child.attack).toBe(true); expect(child.spell).toBe(false);
    expect(child.area && child.triggered && support.cannotBreakArmour).toBe(true);
    const average = (range: readonly number[]) => (range[0]+range[1])/2*1.05;
    expect(child.averageHit).toBeCloseTo(average(child.fireRange),10);
    expect(child.fireIncrease100Hit).toBeCloseTo(average(child.fireIncrease100Range),10);
    expect(child.fireIncrease100Hit).toBe(child.averageHit*2);
    expect(child.physicalIncrease100Hit).toBe(child.averageHit); expect(child.poisonIncrease100Hit).toBe(child.averageHit);
    expect(child.poison).toBe(0); expect(child.poisonLinkedChance).toBe(60); expect(child.poisonLinkedDps).toBe(0);
    expect(child.nativeDps).toBe(child.averageHit*child.nativeRate);
    expect(note(skill,support.id)).toContain("not verified trigger frequency");
  });

  it.each(states)("keeps $state as a configuration, not proof of full-break event ownership", f => {
    expect(f.full && f.partial).toBe(false);
    expect(f.childHit).toBe(child.averageHit);
    expect(f.exploitChildHit).toBe(f.full ? child.explicitFullExploitHit : child.averageHit);
    expect(support.linkStatMapped || support.triggerStatMapped).toBe(false);
  });

  it("checks declared scaling, conversion, area and separate zero child cost", () => {
    expect(support.catalogTier).toBe(1); expect(support.baseMultiplier).toBe(.3); expect(support.physicalToFire).toBe(100);
    expect(support.magnifiedRadius).toBe(Math.floor(support.baseRadius*Math.sqrt(support.magnifiedArea)));
    expect(child.mana).toBe(0); expect(support.addedManaMultiplier).toBe(0);
    expect(components.every(c => c.mana > child.mana)).toBe(true);
  });

  it.each(poisonBowIds)("warns reversibly about %s's prohibited trigger while retaining other conflict notes", skill => {
    for (const ids of [["exploit-weakness",support.id],[support.id,"exploit-weakness"]]) {
      const selected = ids.reduce((s,id) => setSkillSupport(s,id,true),settings(skill));
      expect(selected.supportGemIds).toEqual(ids);
      expect(note(skill,support.id,ids)).toContain("this parent cannot Break Armour and cannot supply Armour Explosion's supported-skill full-break event");
      expect(note(skill,"exploit-weakness",ids)).toBe(note(skill,"exploit-weakness"));
      const all = ["armour-break-iii","armour-demolisher-ii","corrosion"].reduce((s,id) => setSkillSupport(s,id,true),selected);
      for (const id of ["exploit-weakness","corrosion"]) expect(note(skill,id,all.supportGemIds)).toContain("Corrosion is ignored in either link order");
      expect(note(skill,"armour-break-iii",all.supportGemIds)).toContain("this skill cannot Break Armour");
      expect(note(skill,"armour-demolisher-ii",all.supportGemIds)).toContain("Demolisher's strength modifier does not bypass that prohibition");
      const removed = setSkillSupport(all,"exploit-weakness",false);
      for (const id of [support.id,"armour-break-iii","armour-demolisher-ii","corrosion"]) expect(note(skill,id,removed.supportGemIds)).toBe(note(skill,id));
    }
    expect(note(skill,support.id,["exploit-weakness-ii"])).toBe(note(skill,support.id));
  });

  it.each(poisonBowIds)("round-trips %s's goal/weights/links and leaves prior selected notes unchanged", skill => {
    const peers = ["armour-break-iii","armour-demolisher-ii","corrosion","exploit-weakness","poison-iii","bursting-plague",...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    const initial = { ...settings(skill),supportGemIds: peers }, current = setSkillSupport(initial,support.id,true);
    const prior = selectedSkillSupports(getSkillPreferencePreset(skill)!,peers);
    for (const s of prior) expect(note(skill,s.id,current.supportGemIds)).toBe(s.summary);
    const [saved] = normalizeSavedBuilds([{ id: skill,name: skill,createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: current,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    const [restored] = parseSavedBuildExport(serializeSavedBuildExport([saved]));
    expect(restored.state.optimizerSettings).toEqual(current); expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(note(skill,support.id,restored.state.optimizerSettings?.supportGemIds)).toContain("this parent cannot Break Armour");
    expect(setSkillSupport(current,support.id,false)).toEqual(initial);
  });

  it("keeps two reviewed pairs narrow and distinct from other granted-explosion supports", () => {
    expect(reviewedSkillSupports.filter(s => s.family === support.family).map(s => s.id)).toEqual([support.id]);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
      expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
    expect(normalizeSkillSupportIds("gas-arrow",[support.id,support.id,"armour-break-iii","armour-demolisher-ii","bursting-plague"]))
      .toEqual([support.id,"armour-break-iii","armour-demolisher-ii","bursting-plague"]);
  });
});

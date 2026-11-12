import { spellUtilityBrutalityIds } from "./spellUtilitySkills.fixtures";
import { attackClosureIds } from "./attackClosureSkills.fixtures";
import { maceShieldIds } from "./maceShieldSkills.fixtures";
import { monkPrimaryIds } from "./monkPrimarySkills.fixtures";
import { spearPrimaryIds } from "./spearPrimarySkills.fixtures";
import { bowPrimaryIds } from "./bowPrimarySkills.fixtures";
import { quarterstaffPrimaryIds } from "./quarterstaffPrimarySkills.fixtures";
import { describe, expect, it } from "vitest";
import { poisonBowBrutalitySupports as supports, poisonBowBrutalityComponents as components, poisonBowBrutalityInteractions as interactions,
  poisonBowBrutalitySuppressedSuggestions as suppressed } from "./poisonBowBrutalitySupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";
import { macePrimaryFixtures } from "./macePrimarySkills.fixtures";

const settings=(focusSkillId: string): PassiveOptimizationSettings => ({mode:"weighted",focusSkillId,extraPointBudget:7,
  preferences:[{id:"poisonMagnitude",weight:3},{id:"physicalDamage",weight:2},{id:"bleedingMagnitude",weight:3},{id:"fireDamage",weight:1},{id:"life",weight:3}]});
const note=(skill: string,id: string,ids?: string[]) => reviewedSkillSupportsFor(skill,ids).find(s=>s.id===id)!.summary;

describe("Brutality for reviewed Poison bow focuses",()=>{
  for(const skill of poisonBowIds) it.each(supports)(`reviews ${skill}'s $name without turning Physical gains into Poison or a new focus`,f=>{
    const s=reviewedSkillSupportsFor(skill).find(s=>s.id===f.id)!;
    expect({name:s.name,effectId:s.effectId,family:s.family}).toEqual({name:f.name,effectId:f.effectId,family:f.family});
    expect(s.sourceUrl).toContain(`sup_str.lua#L${f.line}`);
    expect(s.summary.startsWith("Disables this focus's Poison damage")).toBe(true);
    for(const text of [`${f.morePhysical}% more Physical Damage`,"no Chaos or Elemental damage","not a recommendation for a Poison build",
      "separate Bleeding chance source is required","not more Bleeding magnitude","Synthetic source-hit/Bleed fields",
      "Poison III, Deadly Poison, added Chaos and Poison magnitude cannot bypass","Deep Cuts' hit penalty and Bleeding magnitude remain separate",
      "20% higher Mana cost","even when their damage is disabled","No automatic arrow-hit/Bleeding focus switch or score multiplier",
      "manual weights remain and still affect routing"]) expect(s.summary).toContain(text);
    if(f.ignoreChance) for(const text of ["20% chance to ignore Physical Damage Reduction","not unconditional penetration","or a Bleeding bypass"])expect(s.summary).toContain(text);
    else expect(s.summary).not.toContain("Tier III gives");
    if(skill==="gas-arrow")expect(s.summary).toContain("blocking Fire does not restore Physical damage after conversion");
    const current=settings(skill),selected=setSkillSupport(current,f.id,true),preset=getSkillPreferencePreset(skill)!;
    const refined=refineSkillPreferencePreset(preset,selected.supportGemIds);
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({...current,supportGemIds:[f.id]});
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for(const id of [...suppressed,...(skill==="poisonburst-arrow"?["skillDuration" as const]:[])]) {
      expect(refined.suggestions.some(s=>s.id===id)).toBe(false);
      expect(refined.exclusions.filter(e=>e.id===id)).toHaveLength(1);
      expect(refined.exclusions.find(e=>e.id===id)?.reason).toContain("still affects routing");
    }
    expect(refined.suggestions.map(s=>s.id)).toEqual(skill==="gas-arrow"?["skillDuration","areaOfEffect","attackSpeed"]:["areaOfEffect","attackSpeed"]);
    expect(refined.exclusions.map(e=>e.id)).toEqual(expect.arrayContaining(["fireDamage","coldDamage","lightningDamage","elementalDamage","chaosDamage","poisonChance"]));
    const added=addSkillPresetPreferences({...selected,preferences:[]},preset);
    expect(added.preferences.map(p=>p.id)).toEqual(refined.suggestions.map(s=>s.id));
    expect(addSkillPresetPreferences(selected,preset).preferences.slice(0,current.preferences.length)).toEqual(current.preferences);
    expect(refineSkillPreferencePreset(preset,setSkillSupport(selected,f.id,false).supportGemIds)).toEqual(preset);
    for(const stat of ["20% increased Magnitude of Poison you inflict","20% increased Physical Damage","20% increased Magnitude of Bleeding you inflict","20% increased Fire Damage"]) {
      const n: TreeNode={id:"fixture",flags:{},position:{x:0,y:0},stats:[stat]};
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("independently checks $skill's $component source, Bleed fields and prohibitions",f=>{
    const potential=1.2*5,roll=potential/(potential+1),crit=1-.95**potential;
    for(const [i,[min,max]] of f.range.entries()) {
      expect(f.bleed[i]).toBeCloseTo((min+(max-min)*roll)*(1+crit)*.15,10);
      if(i)expect(f.poison[i]).toBe(0);
    }
    expect(f.bleed[3]).toBe(f.bleed[2]);
    if(!f.actualHit)for(const s of supports)expect(note(f.skill,s.id)).toContain("do not make the no-hit burst/cloud Hit or Bleed");
    if(f.component==="conditional Fire detonation")expect(f.hit.slice(1)).toEqual([0,0,0]);
    else expect(f.hit[3]).toBeGreaterThan(f.hit[2]);
  });

  it.each(interactions)("checks %s's conditional hit mitigation without an extra Bleed multiplier or waived costs",f=>{
    const raw=(f.range[0]+f.range[1])/2*1.05;
    for(const [i,ignore]of [0,.2,1].entries())expect(f.pdrHits[i]).toBeCloseTo(raw*(1-.5*(1-ignore)),10);
    const arrow=components.find(c=>c.skill===f.skill&&c.component==="arrow")!;
    expect(f.bleed).toBe(arrow.bleed[2]);expect(f.bleed).toBe(arrow.bleed[3]);
    const p=1.2*5,roll=p/(p+1),crit=1-.95**p;
    expect(f.deepBleed).toBeCloseTo((f.deepRange[0]+(f.deepRange[1]-f.deepRange[0])*roll)*(1+crit)*.15*2,10);
    expect(f.brutalityCost).toBe(Math.floor(f.mana*1.2));
    expect(f.efficiencyCost).toBe(Math.ceil(f.brutalityCost*.6));
    expect(f.poisonCost).toBe(Math.floor(f.mana*1.2*1.2));
    expect(f.poisonEfficiencyCost).toBe(Math.ceil(f.poisonCost*.6));
  });

  it.each(poisonBowIds)("round-trips %s's tier replacement without changing peers, priorities or goals",skill=>{
    const peers=["bleed-iii","poison-iii","deadly-poison-ii","deep-cuts-ii","pin-i","stun-iii","rupture","rusted-spikes",...(skill==="gas-arrow"?["overabundance-ii"]:[])];
    const initial={...settings(skill),supportGemIds:peers};
    const prior=selectedSkillSupports(getSkillPreferencePreset(skill)!,peers);
    let current: PassiveOptimizationSettings=initial;
    for(const s of supports) {
      current=setSkillSupport(current,s.id,true);
      expect(current.supportGemIds).toEqual([...peers,s.id]);
      for(const p of prior)expect(note(skill,p.id,current.supportGemIds)).toBe(p.summary);
    }
    const [saved]=normalizeSavedBuilds([{id:skill,name:skill,createdAt:"test",updatedAt:"test",state:{
      selectedClassStartId:"ranger",pathStartNodeId:"start",nodeVisualScale:3,buildGoalNodeIds:["required"],ascendancyAllocationNodeIds:[],
      activeAllocationMode:"main",weaponSetAllocationNodeIds:{1:[],2:[]},optimizerSettings:current,
      allocationPlan:{committedNodePath:["start"],committedEdgeKeys:[],previewNodePath:[],previewEdgeKeys:[],previewRouteNodePath:[]},
    }}]);
    const [restored]=parseSavedBuildExport(serializeSavedBuildExport([saved]));
    expect(restored.state.optimizerSettings).toEqual(current);expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(setSkillSupport(current,"brutality-iii",false)).toEqual(initial);
  });

  it("reuses the existing three-choice family, preserves older skill overrides and rejects unrelated scopes",()=>{
    expect(supports.map(s=>s.catalogTier)).toEqual([1,2,5]);
    expect(reviewedSkillSupports.filter(s=>s.family==="Brutality").map(s=>s.id)).toEqual(supports.map(s=>s.id));
    for(const s of supports) {
      expect(reviewedSkillSupports.find(r=>r.id===s.id)?.skillIds).toEqual(["bonestorm","bone-cage","unearth","detonate-dead","entangle","briarpatch","thrashing-vines","toxic-domain",...poisonBowIds,...macePrimaryFixtures.map(f=>f.id),...quarterstaffPrimaryIds,...bowPrimaryIds,...spearPrimaryIds,...monkPrimaryIds,...maceShieldIds, ...attackClosureIds,...spellUtilityBrutalityIds,"raise-zombie","rhoa-mount","shockwave-totem","wolf-pack","iron-ward","wind-dancer","herald-of-blood","raging-spirits","ravenous-swarm"]);
      for(const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])expect(setSkillSupport(settings(skill),s.id,true)).toEqual(settings(skill));
      expect(note("entangle",s.id)).toContain("fissure/vine hits");
      expect(note("toxic-domain",s.id)).toContain("prevents its Poison damage");
      expect(note("bone-cage",s.id)).not.toContain("Disables this focus's Poison damage");
    }
    expect(normalizeSkillSupportIds("gas-arrow",["brutality-ii","brutality-i","brutality-ii","bleed-iii"])).toEqual(["brutality-ii","bleed-iii"]);
  });
});

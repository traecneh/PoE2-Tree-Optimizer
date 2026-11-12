import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { elementalSupportFixtures as fixtures,elementalNativeObservations,elementalSupportWording,elemental50Ids,elemental50SupportIdsFor } from "./elementalSupportBatch.fixtures";
import { elementalSkillSupports } from "./elementalSupportBatch";
import { getSkillPreferencePreset,skillPreferencePresets } from "./skillPreferencePresets";
import { reviewedSkillSupports,reviewedSkillSupportsFor,normalizeSkillSupportIds,setSkillSupport,applySkillSupportPriorities,refineSkillPreferencePreset } from "./skillSupportPreferences";
import { passivePreferenceValues,scorePassiveNode,normalizePassiveOptimizationSettings,type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport,serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeWeightedBuildGoals,runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import type { TreeGraph,TreeNode } from "./types";

type Observation={focus:string;support:string;other?:string;options:Record<string,unknown>;player:Record<string,number>&{flags:Record<string,boolean>};effects:{effect:string;supports:string[]}[]};
const native=elementalNativeObservations as unknown as Observation[];
const observed=(focus:string,support="base",options:Record<string,unknown>={},other?:string)=>native.find(n=>n.focus===focus&&n.support===support&&n.other===other&&JSON.stringify(n.options)===JSON.stringify(Object.keys(options).length?options:[]))!;
const support=(id:string)=>reviewedSkillSupports.find(s=>s.id===id)!;
const resolved=(focus:string,id:string,ids:string[])=>reviewedSkillSupportsFor(focus,ids).find(s=>s.id===id)!;
const preset=(id:string)=>getSkillPreferencePreset(id)!;
const fresh=(id:string):PassiveOptimizationSettings=>({mode:"weighted",extraPointBudget:7,pointBudgetMode:"all-available",focusSkillId:id,preferences:[{id:"energyShield",weight:3}]});
const node=(...stats:string[]):TreeNode=>({id:"test",flags:{},stats,position:{x:0,y:0}});
const constants=(id:string):readonly (readonly (string|number)[])[]=>{
  const set=fixtures.find(f=>f.supportId===id)!.sets[0];return "constants" in set ? set.constants : [];
};

describe("50 elemental and ailment support variants",()=>{
  it("adds exactly 50 positive-tier variants and 738 explicit component-reviewed pairs",()=>{
    expect(elementalSkillSupports).toHaveLength(50);
    expect(reviewedSkillSupports).toHaveLength(452);
    expect(new Set(reviewedSkillSupports.map(s=>s.effectId)).size).toBe(452);
    expect(elementalSkillSupports.reduce((n,s)=>n+s.skillIds.length,0)).toBe(738);
    for(const p of skillPreferencePresets)expect(reviewedSkillSupportsFor(p.id).filter(s=>elemental50Ids.has(s.id)).map(s=>s.id)).toEqual(elemental50SupportIdsFor(p.id));
    const catalog=JSON.parse(readFileSync(new URL("../../tools/coverage/catalog.json",import.meta.url),"utf8"));
    expect(fixtures.every(f=>catalog.entries.some((g:{effectId:string;tier:number})=>g.effectId===f.effectId&&g.tier>0))).toBe(true);
  });

  it.each(fixtures)("pins $name source identity, family and positive/negative reviewed scope",f=>{
    const s=support(f.supportId);
    expect(s).toMatchObject({name:f.name,effectId:f.effectId,family:f.families[0],skillIds:[...f.reviewedSkillIds]});
    expect(s.summary.length).toBeGreaterThan(100);
    expect(s.sourceUrl).toMatch(/sup_\w+\.lua#L\d+$/);
    for(const id of f.reviewedSkillIds){
      expect((f.legal as readonly string[]).includes(id),f.name+"/"+id).toBe(true);
      expect(getSkillPreferencePreset(id)).toBeDefined();
      expect(normalizeSkillSupportIds(id,[f.supportId])).toEqual([f.supportId]);
    }
    for(const p of skillPreferencePresets)if(!(f.reviewedSkillIds as readonly string[]).includes(p.id))
      expect(normalizeSkillSupportIds(p.id,[f.supportId]),p.id).toEqual([]);
  });

  it.each(fixtures)("pins an accepted native link for $name without asserting complete simulation",f=>{
    const row=native.find(n=>n.support===f.effectId&&!n.other)!;
    expect(row).toBeDefined();
    expect(row.effects.some(e=>e.supports.includes(f.effectId))).toBe(true);
  });

  it.each(fixtures)("roundtrips $name preserving manual weights, goals, allocations and W1/W2",f=>{
    const current=fresh(f.reviewedSkillIds[0]),selected=setSkillSupport(current,f.supportId,true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const [saved]=normalizeSavedBuilds([{id:"elemental",name:f.name,createdAt:"test",updatedAt:"test",state:{
      selectedClassStartId:"witch",pathStartNodeId:"start",nodeVisualScale:3,buildGoalNodeIds:["goal"],ascendancyAllocationNodeIds:[],
      activeAllocationMode:"main",weaponSetAllocationNodeIds:{1:["w1"],2:["w2"]},optimizerSettings:selected,
      allocationPlan:{committedNodePath:["start"],committedEdgeKeys:[],previewNodePath:[],previewEdgeKeys:[],previewRouteNodePath:[]},
    }}]);
    expect(saved.state.optimizerSettings).toEqual(selected);
    expect(saved.state.buildGoalNodeIds).toEqual(["goal"]);
    expect(saved.state.weaponSetAllocationNodeIds).toEqual({1:["w1"],2:["w2"]});
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    expect(setSkillSupport(selected,f.supportId,false).preferences).toEqual(current.preferences);
  });

  it("replaces source families even when the names or tier effects differ",()=>{
    expect(normalizeSkillSupportIds("spark",["electrocute","neural-overload"])).toEqual(["electrocute"]);
    expect(setSkillSupport({...fresh("spark"),supportGemIds:["electrocute"]},"neural-overload",true).supportGemIds).toEqual(["neural-overload"]);
    expect(normalizeSkillSupportIds("eye-of-winter",["elemental-discharge","catalysing-elements"])).toEqual(["elemental-discharge"]);
    expect(setSkillSupport({...fresh("eye-of-winter"),supportGemIds:["elemental-discharge"]},"catalysing-elements",true).supportGemIds).toEqual(["catalysing-elements"]);
    expect(setSkillSupport({...fresh("war-banner"),supportGemIds:["refraction-i"]},"refraction-iii",true).supportGemIds).toEqual(["refraction-iii"]);
  });

  it("requires explicit Apply, preserves manual weights and never inserts gem damage multipliers",()=>{
    const selected=setSkillSupport(fresh("fireball"),"eternal-flame-ii",true);
    expect(selected.preferences).toEqual(fresh("fireball").preferences);
    const applied=applySkillSupportPriorities(selected,preset("fireball"));
    expect(applied.preferences).toEqual([...selected.preferences,{id:"igniteDuration",weight:2}]);
    expect(passivePreferenceValues(node("10% increased Ignite Duration on Enemies"),selected)).toEqual({igniteDuration:10});
    expect(scorePassiveNode(node("10% increased Ignite Duration on Enemies"),[{id:"igniteDuration",weight:2}],selected)).toBe(2);
    expect(applied.extraPointBudget).toBe(7);
    expect(setSkillSupport(applied,"eternal-flame-ii",false).preferences).toEqual(applied.preferences);
  });

  it("separates Ignite duration, Flammability reduction and critical refresh",()=>{
    const base=observed("fireball").player;
    expect(observed("fireball","SupportIgniteDurationPlayer").player.IgniteDuration).toBe(base.IgniteDuration*2);
    expect(observed("fireball","SupportIgniteDurationPlayerTwo").player.IgniteDuration).toBe(base.IgniteDuration*2);
    expect(observed("fireball","SupportIgniteDurationPlayer").player.ManaCost).toBe(Math.floor(base.ManaCost*1.2));
    expect(observed("fireball","SupportIgniteDurationPlayer",{mods:"10% reduced Ignite Duration on Enemies"}).player.IgniteDuration).toBeCloseTo(base.IgniteDuration*(1+1-.1),10);
    expect(observed("fireball","SupportIgniteDurationPlayer").player.IgniteChance).toBeCloseTo(observed("fireball","SupportIgniteDurationPlayerTwo").player.IgniteChance*.75,10);
    expect(observed("fireball","SupportIgniteDurationPlayerThree").player.IgniteDuration).toBe(base.IgniteDuration);
    expect(constants("eternal-flame-iii")).toContainEqual(["refresh_ignite_duration_on_critical_strike_chance_%",20]);
    expect(support("eternal-flame-i").summary).toContain("Flammability");
    expect(support("eternal-flame-iii").priorities).toEqual([]);
  });

  it("keeps Immolate's external Ignite condition separate from its own application prohibition",()=>{
    expect(observed("lightning-arrow","SupportImmolatePlayer").player.hit).toBe(observed("lightning-arrow").player.hit);
    const row=observed("lightning-arrow","SupportImmolatePlayer",{conditionEnemyIgnited:true},"SupportIgnitePlayer");
    expect(row.player.flags.CannotIgnite).toBe(true);
    expect(row.player.hit).toBe(25.2);
    expect(normalizeSkillSupportIds("explosive-spear",["immolate","ignite-i"])).toEqual(["immolate","ignite-i"]);
    const refined=refineSkillPreferencePreset(preset("explosive-spear"),["immolate","ignite-i"]);
    expect(refined.suggestions.some(s=>s.id==="igniteMagnitude")).toBe(false);
    expect(resolved("explosive-spear","ignite-i",["immolate","ignite-i"]).summary).toContain("prevent");
    expect(support("immolate").priorities).toEqual([]);
  });

  it.each(["elemental-focus","elemental-armament-iii"])("makes %s prohibitions win in either order while preserving manual weights",id=>{
    for(const ids of [[id,"ice-bite-i"],["ice-bite-i",id]]){
      const focus="ice-shot",current={...fresh(focus),supportGemIds:ids,preferences:[{id:"freezeBuildup" as const,weight:3}]};
      expect(normalizeSkillSupportIds(focus,ids)).toEqual(ids);
      const refined=refineSkillPreferencePreset(preset(focus),ids);
      for(const blocked of ["freezeBuildup","freezeDuration","chillMagnitude","shockChance","igniteMagnitude","electrocuteBuildup"])
        expect(refined.suggestions.some(s=>s.id===blocked),blocked).toBe(false);
      expect(resolved(focus,"ice-bite-i",ids).summary).toContain("prevent");
      expect(applySkillSupportPriorities(current,preset(focus)).preferences).toEqual(current.preferences);
    }
    const nativeRow=id==="elemental-focus"?native[81]:native[66];
    for(const flag of ["CannotIgnite","CannotFreeze","CannotChill","CannotShock","CannotElectrocute"])expect(nativeRow.player.flags[flag]).toBe(true);
  });

  it("does not extend Discharge's three prohibitions to Chill and Electrocute",()=>{
    const row=observed("fireball","SupportElementalDischargePlayer").player.flags;
    expect(row).toMatchObject({CannotIgnite:true,CannotFreeze:true,CannotShock:true,CannotChill:false,CannotElectrocute:false});
    expect(support("elemental-discharge").exclusions?.map(s=>s.id)).not.toContain("chillMagnitude");
    expect(support("elemental-discharge").exclusions?.map(s=>s.id)).not.toContain("electrocuteBuildup");
    expect(support("elemental-discharge").priorities).toEqual([]);
  });

  it("does not combine conflicting consumers or turn external Freeze into an own Freeze event",()=>{
    for(const ids of [["frostfire","elemental-discharge"],["elemental-discharge","frostfire"]]){
      expect(resolved("fireball","frostfire",ids).summary).toContain("only the first");
      expect(resolved("fireball","frostfire",ids).priorities).toEqual([]);
    }
    for(const ids of [["biting-frost-i","deep-freeze"],["deep-freeze","biting-frost-i"]])
      expect(resolved("frostbolt","deep-freeze",ids).priorities).toEqual([]);
    expect(native[76].effects.some(e=>e.supports.includes("SupportFrostfirePlayer"))).toBe(false);
    expect(native[77].effects.some(e=>e.supports.includes("SupportElementalDischargePlayer"))).toBe(false);
    expect(observed("frostbolt","SupportBitingFrostPlayer",{conditionEnemyFrozen:true}).player.AverageHit).toBeCloseTo(201.6*1.4,10);
    expect(native[74].player.AverageHit).toBe(338.8);
    expect(observed("frostbolt","SupportBitingFrostPlayer").player.flags.CannotFreeze).toBe(true);
  });

  it("keeps own Freeze buffs separate from an assumed permanent Cold gain",()=>{
    expect(observed("frostbolt","SupportIceBitePlayer").player.AverageHit).toBe(observed("frostbolt").player.AverageHit);
    expect(observed("frostbolt","SupportIceBitePlayer",{conditionFrozenEnemyRecently:true}).player.AverageHit).toBe(observed("frostbolt").player.AverageHit*1.25);
    expect(support("ice-bite-i").priorities).toEqual([]);
    expect(support("ice-bite-i").summary).toContain("Freeze");
    expect(normalizeSkillSupportIds("fireball",["ice-bite-i"])).toEqual([]);
  });

  it("separates Shock duration, effect, Electrocute, Primed finishers and external Shock kill conditions",()=>{
    expect(constants("lasting-shock")).toEqual([["shock_duration_+%",100],["support_lasting_shock_chance_to_shock_+%_final",-30]]);
    expect(support("lasting-shock").priorities.map(p=>p.id)).toEqual(["shockDuration"]);
    expect(support("overcharge").priorities.map(p=>p.id)).toEqual(["shockMagnitude"]);
    expect(support("overcharge").summary).toContain("reflect");
    expect(support("neural-overload").priorities).toEqual([]);
    expect(observed("spark","SupportElectrocutePlayer").player.flags.CannotShock).toBe(true);
    expect(native[79].player.flags.CannotShock).toBe(true);
    expect(resolved("spark","lasting-shock",["lasting-shock","electrocute"]).priorities).toEqual([]);
    expect(resolved("spark","stormfire",["stormfire","electrocute"]).summary).toContain("own");
    expect(resolved("spark","innervate",["innervate","electrocute"]).summary).not.toContain("prevent this skill");
    expect(support("innervate").priorities).toEqual([]);
  });

  it("does not assume ground boosts, Drenched packs, rift thresholds, charges, extra hits or trigger uptime",()=>{
    for(const id of ["fan-the-flames","fan-the-flames-ii","wildfire","fiery-death","frost-nexus","creeping-chill","crystalline-shards","verglas","innervate","neural-overload","shock-conduction","coursing-current","static-shocks","electromagnetism","volt","stormfire","catalysing-elements","blazing-critical","chaotic-freeze","drain-ailments"])
      expect(support(id).priorities,id).toEqual([]);
    expect(support("coursing-current").summary).toContain("Drenched");
    expect(support("electromagnetism").summary).toContain("three");
    expect(constants("volt")).toContainEqual(["support_static_charge_maximum_charge",30]);
    expect(support("volt").summary).toContain("1%");
    expect(observed("lightning-arrow","SupportVoltPlayer").player.hit).toBe(observed("lightning-arrow").player.hit);
    expect(support("stormfire").summary).toContain("20%");
  });

  it("reviews Runic Inscription, Crystal and Chaos DoT components rather than broad tags",()=>{
    expect(normalizeSkillSupportIds("fireball",["burning-inscription","glacier","chaotic-freeze"])).toEqual([]);
    expect(normalizeSkillSupportIds("poisonburst-arrow",["chaotic-freeze","drain-ailments"])).toEqual([]);
    expect(normalizeSkillSupportIds("gas-arrow",["chaotic-freeze","drain-ailments"])).toEqual([]);
    expect(normalizeSkillSupportIds("despair",["burning-inscription"])).toEqual(["burning-inscription"]);
    expect(normalizeSkillSupportIds("contagion",["chaotic-freeze"])).toEqual(["chaotic-freeze"]);
    expect(support("burning-inscription").priorities).toEqual([]);
    expect(observed("frost-wall","SupportGlacierPlayer").player.IceCrystalLife).toBe(observed("frost-wall").player.IceCrystalLife*2);
    expect(support("glacier").priorities).toEqual([]);
    expect(support("chaotic-freeze").summary).toContain("separate Chaos Hits");
    expect(support("chaotic-freeze").summary).toContain("DoT ticks themselves do not Freeze");
  });

  it("keeps Embitter a gain redirect, preserves Attunement penalties and respects Brutality",()=>{
    for(const pair of [["embitter","fire-attunement"],["fire-attunement","embitter"]]){
      expect(resolved("fireball","fire-attunement",pair).priorities.map(s=>s.id)).toEqual(["coldDamage"]);
      expect(resolved("fireball","fire-attunement",pair).summary).toContain("penalties remain");
    }
    for(const ids of [["embitter","fire-attunement","brutality-i"],["brutality-i","fire-attunement","embitter"]]){
      expect(normalizeSkillSupportIds("bonestorm",ids)).toEqual(ids);
      expect(resolved("bonestorm","fire-attunement",ids).priorities).toEqual([]);
    }
    expect(native[70].player.AverageHit).toBe(337.05);
    expect(native[71].player.AverageHit).toBe(187.25);
    expect(native[72].player.AverageHit).toBe(0);
    for(const flag of ["DealNoFire","DealNoCold","DealNoLightning","DealNoChaos"])expect(native[72].player.flags[flag]).toBe(true);
    expect(support("embitter").priorities).toEqual([]);
  });

  it("does not mistake Tier III Armament for Elemental-only damage or supply an ailment count",()=>{
    expect(observed("lightning-arrow","SupportElementalArmamentPlayerThree").player.hit).toBe(observed("lightning-arrow").player.hit);
    expect(native[67].player.hit).toBe(5.25);
    expect(normalizeSkillSupportIds("snipe",["elemental-armament-iii","brutality-i"])).toEqual(["elemental-armament-iii","brutality-i"]);
    expect(resolved("snipe","elemental-armament-iii",["elemental-armament-iii","brutality-i"]).summary).toContain("Physical hits");
    expect(support("elemental-armament-iii").priorities).toEqual([]);
    expect(constants("elemental-armament-iii")).toContainEqual(["support_elemental_armament_attack_damage_+%_final_per_elemental_ailment_on_target",12]);
  });

  it("requires a reviewed Exposure application and keeps application prohibitions effective",()=>{
    expect(resolved("fireball","potent-exposure",["potent-exposure"]).priorities).toEqual([]);
    expect(resolved("frost-bomb","potent-exposure",["potent-exposure"]).priorities.map(p=>p.id)).toEqual(["exposureEffect"]);
    expect(resolved("fireball","potent-exposure",["potent-exposure","fire-exposure"]).priorities.map(p=>p.id)).toEqual(["exposureEffect"]);
    expect(resolved("fireball","potent-exposure",["potent-exposure","fire-exposure","elemental-discharge"]).priorities).toEqual([]);
    expect(resolved("spark","potent-exposure",["potent-exposure","lightning-exposure","electrocute"]).priorities).toEqual([]);
    expect(resolved("frostbolt","potent-exposure",["potent-exposure","cold-exposure","controlled-destruction"]).priorities).toEqual([]);
    expect(resolved("frost-bomb","potent-exposure",["potent-exposure","elemental-discharge"]).priorities.map(p=>p.id)).toEqual(["exposureEffect"]);
    expect(observed("frost-bomb","SupportPotentExposurePlayer").player.AverageHit).toBeGreaterThan(observed("frost-bomb").player.AverageHit);
  });

  it("prevents crit-event benefits with Controlled Destruction but preserves other actors and external ailments",()=>{
    for(const [focus,id] of [["fireball","eternal-flame-iii"],["fireball","blazing-critical"],["bonestorm","concussive-spells"]]){
      const s=resolved(focus,id,[id,"controlled-destruction"]);
      expect(s.summary).toContain("cannot supply");
      expect(s.priorities).toEqual([]);
    }
    expect(native[69].player.flags.NeverCrit).toBe(true);
    expect(native[83].player.flags.NeverCrit).toBe(true);
    expect(resolved("fireball","eternal-flame-iii",["eternal-flame-iii","elemental-discharge"]).summary).not.toContain("own damaging Ignite");
    expect(resolved("bonestorm","blazing-critical",["blazing-critical","brutality-i"]).summary).toContain("different eligible Attack");
    expect(normalizeSkillSupportIds("briarpatch",["blazing-critical"])).toEqual([]);
  });

  it("separates incoming protection and flat Spirit from outgoing duration and avoids duplicated priority entries",()=>{
    for(const [id,effect] of [["cool-headed","SupportCoolheadedPlayer"],["warm-blooded","SupportWarmbloodedPlayer"]]){
      expect(observed("berserk",effect).player.SpiritReserved).toBe(observed("berserk").player.SpiritReserved+15);
      expect(support(id).priorities.map(p=>p.id)).toEqual(["ailmentDurationReduction"]);
    }
    const current={...fresh("berserk"),supportGemIds:["cool-headed","warm-blooded"]};
    expect(applySkillSupportPriorities(current,preset("berserk")).preferences).toEqual([...current.preferences,{id:"ailmentDurationReduction",weight:1}]);
  });

  it("separates Refraction's flat reservation, defensive Plating and replacement Exposure cap",()=>{
    for(const effect of ["SupportRefractionPlayer","SupportRefractionPlayerTwo","SupportRefractionPlayerThree"])
      expect(observed("war-banner",effect).player.SpiritReserved).toBe(observed("war-banner").player.SpiritReserved+10);
    expect(support("refraction-i").priorities.map(p=>p.id)).toEqual(["armour","evasion"]);
    expect(support("refraction-iii").priorities.map(p=>p.id)).toEqual(["armour"]);
    expect(support("refraction-iii").summary).toContain("Replaces Plating");
    expect(elementalSupportWording.find(w=>w.name==="Refraction III")?.wording[0].text[0]).toContain("up to 80%");
    expect(normalizeSkillSupportIds("skeletal-arsonist",["refraction-iii","cool-headed","warm-blooded"])).toEqual([]);
    expect(support("refraction-iii").summary).toContain("actual mitigation is assumed");
  });

  it("checks Burgeon's time ramp and shared cap without assuming maximum channel time",()=>{
    expect(constants("burgeon-i")).toContainEqual(["support_channelling_damage_cap",40]);
    expect(constants("burgeon-ii")).toContainEqual(["support_channelling_damage_cap",40]);
    expect(native[86].player.AverageHit).toBe(observed("flameblast").player.AverageHit);
    expect(native[87].player.AverageHit).toBeGreaterThan(native[86].player.AverageHit);
    expect(native[88].player.AverageHit).toBeGreaterThan(native[87].player.AverageHit);
    expect(native[89].player.AverageHit).toBe(native[88].player.AverageHit);
    expect(support("burgeon-i").priorities).toEqual([]);
    expect(support("burgeon-ii").priorities).toEqual([]);
  });

  it("routes toward optional duration within budget and leaves Shortest unchanged",()=>{
    const graph:TreeGraph={schemaVersion:1,gameVersion:"test",extractedAt:"test",source:{kind:"fixture",path:"test"},nodes:Object.fromEntries(
      ["start","plain","good","bridge","goal"].map(id=>[id,{...node(...(id==="good"?["10% increased Ignite Duration on Enemies"]:[])),id,flags:id==="start"?{classStart:true}:{}}])),
      edges:[["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]].map(([from,to])=>({from,to})),groups:{},classStarts:{witch:"start"},bounds:{minX:0,minY:0,maxX:100,maxY:100}};
    const settings=applySkillSupportPriorities(setSkillSupport({...fresh("fireball"),preferences:[]},"eternal-flame-ii",true),preset("fireball"));
    const request={...settings,mode:"weighted" as const,extraPointBudget:1,graph,baseNodeIds:["start"],baseEdgeKeys:[],goalNodeIds:["goal"]};
    expect(optimizeWeightedBuildGoals(request,undefined,{maxIterations:8})).toMatchObject({status:"success",pointCost:3,weighted:{score:2}});
    const shortest={...request,mode:"shortest" as const};
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

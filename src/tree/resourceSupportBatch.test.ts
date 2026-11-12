import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { resourceSupportFixtures as fixtures,resourceNativeObservations,resourceSupportWording,resource50Ids,resource50SupportIdsFor } from "./resourceSupportBatch.fixtures";
import { resourceSkillSupports } from "./resourceSupportBatch";
import { getSkillPreferencePreset,skillPreferencePresets } from "./skillPreferencePresets";
import { reviewedSkillSupports,reviewedSkillSupportsFor,normalizeSkillSupportIds,setSkillSupport,applySkillSupportPriorities } from "./skillSupportPreferences";
import { passivePreferenceValues,scorePassiveNode,normalizePassiveOptimizationSettings,type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport,serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeWeightedBuildGoals,runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import type { TreeGraph,TreeNode } from "./types";

type Observation={focus:string;support:string;other?:string;selected:string;options:Record<string,unknown>;player:Record<string,number>&{flags:Record<string,boolean>};effects:{effect:string;supports:string[]}[]};
const native=resourceNativeObservations as unknown as Observation[];
const canonical=(value:Record<string,unknown>)=>JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))));
const observed=(focus:string,support="base",options:Record<string,unknown>={},other?:string)=>native.find(n=>n.focus===focus&&n.support===support&&n.other===other&&canonical(n.options)===canonical(options))!;
const support=(id:string)=>reviewedSkillSupports.find(s=>s.id===id)!;
const resolved=(focus:string,id:string,ids:string[])=>reviewedSkillSupportsFor(focus,ids).find(s=>s.id===id)!;
const preset=(id:string)=>getSkillPreferencePreset(id)!;
const fresh=(id:string):PassiveOptimizationSettings=>({mode:"weighted",extraPointBudget:7,pointBudgetMode:"all-available",focusSkillId:id,preferences:[{id:"energyShield",weight:3}]});
const node=(...stats:string[]):TreeNode=>({id:"test",flags:{},stats,position:{x:0,y:0}});
const constants=(id:string):readonly (readonly (string|number)[])[]=>{
  const set=fixtures.find(f=>f.supportId===id)!.sets[0];return "constants" in set ? set.constants : [];
};

describe("50 resource, recovery and defensive utility support variants",()=>{
  it("adds exactly 50 positive-tier variants and 1366 explicit component-reviewed pairs",()=>{
    expect(resourceSkillSupports).toHaveLength(50);
    expect(reviewedSkillSupports).toHaveLength(452);
    expect(new Set(reviewedSkillSupports.map(s=>s.effectId)).size).toBe(452);
    expect(resourceSkillSupports.reduce((n,s)=>n+s.skillIds.length,0)).toBe(1366);
    for(const p of skillPreferencePresets)expect(reviewedSkillSupportsFor(p.id).filter(s=>resource50Ids.has(s.id)).map(s=>s.id)).toEqual(resource50SupportIdsFor(p.id));
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
    const [saved]=normalizeSavedBuilds([{id:"resource",name:f.name,createdAt:"test",updatedAt:"test",state:{
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

  it("replaces source families and preserves their exact identities",()=>{
    expect(normalizeSkillSupportIds("berserk",["upwelling-i","upwelling-ii"])).toEqual(["upwelling-i"]);
    expect(support("upwelling-ii").family).toBe("Upwellling");
    expect(setSkillSupport({...fresh("berserk"),supportGemIds:["herbalism-i"]},"herbalism-ii",true).supportGemIds).toEqual(["herbalism-ii"]);
    expect(setSkillSupport({...fresh("mana-remnants"),supportGemIds:["remnant-potency-ii"]},"remnant-potency-iii",true).supportGemIds).toEqual(["remnant-potency-iii"]);
  });

  it("requires explicit Apply and does not turn recovery or gem magnitudes into score multipliers",()=>{
    const selected=setSkillSupport(fresh("berserk"),"cannibalism-ii",true),applied=applySkillSupportPriorities(selected,preset("berserk"));
    expect(selected.preferences).toEqual(fresh("berserk").preferences);
    expect(applied.preferences).toEqual([...selected.preferences,{id:"lifeRecoveryOnKill",weight:2}]);
    const n=node("Recover 1% of maximum Life on Kill");
    expect(passivePreferenceValues(n,selected)).toEqual({lifeRecoveryOnKill:1});
    expect(scorePassiveNode(n,[{id:"lifeRecoveryOnKill",weight:2}],selected)).toBe(2);
    expect(applied.extraPointBudget).toBe(7);
    expect(setSkillSupport(applied,"cannibalism-ii",false).preferences).toEqual(applied.preferences);
  });

  it("keeps actual flask charges and conditional gains separate from cost and recharge",()=>{
    expect(constants("ambrosia")).toEqual([["consume_%_of_maximum_mana_flask_charges_on_skill_use",14],["gain_%_damage_as_lighting_per_mana_flask_charge_consumed",2]]);
    expect(constants("ambrosia-ii")).toEqual([["consume_%_of_maximum_mana_flask_charges_on_skill_use",35],["gain_%_damage_as_lighting_per_mana_flask_charge_consumed",1]]);
    expect(observed("lightning-arrow","SupportAmbrosiaPlayer").player.hit).toBe(observed("lightning-arrow").player.hit);
    expect(resolved("poisonburst-arrow","ambrosia",["ambrosia","brutality-i"]).priorities).toEqual([]);
    expect(resolved("poisonburst-arrow","ambrosia",["ambrosia","brutality-i"]).summary).toContain("Flask-charge drain");
    expect(resolved("lightning-arrow","ambrosia",["ambrosia","embitter"]).summary).toContain("redirects eligible gained damage");
    expect(support("ambrosia").priorities.map(s=>s.id)).toEqual(["flaskChargesGained"]);
  });

  it("checks percentage-Life recovery per kill without inventing regeneration or kill rate",()=>{
    const base=observed("berserk").player;
    expect(observed("berserk","SupportCannibalismPlayer").player.LifeOnKill).toBe(Math.ceil(base.Life*.02));
    expect(observed("berserk","SupportCannibalismPlayerTwo").player.LifeOnKill).toBe(Math.ceil(base.Life*.03));
    expect(observed("berserk","SupportCannibalismPlayerTwo").player.LifeRegen).toBe(base.LifeRegen);
    expect(observed("berserk","SupportCannibalismPlayerTwo").player.SpiritReserved).toBe(base.SpiritReserved+30);
    expect(normalizeSkillSupportIds("skeletal-arsonist",["cannibalism-ii"])).toEqual([]);
  });

  it("keeps Life Flask recovery amount, reservation and charge generation separate",()=>{
    expect(constants("herbalism-i")).toContainEqual(["support_herbalism_life_recovery_+%_from_life_flasks",30]);
    expect(constants("herbalism-ii")).toContainEqual(["support_herbalism_life_recovery_+%_from_life_flasks",50]);
    expect(observed("berserk","SupportHerbalismPlayer").player.SpiritReserved).toBe(observed("berserk").player.SpiritReserved+15);
    expect(observed("berserk","SupportHerbalismPlayerTwo").player.SpiritReserved).toBe(observed("berserk").player.SpiritReserved+30);
    expect(support("herbalism-ii").priorities.map(p=>p.id)).toEqual(["lifeFlaskRecovery"]);
    expect(constants("gorge")).toEqual([["support_grants_X_life_flask_charges_on_using_corpse",10],["support_grants_X_mana_flask_charges_on_using_corpse",10]]);
    expect(normalizeSkillSupportIds("fireball",["gorge"])).toEqual([]);
    expect(support("gorge").priorities).toEqual([]);
  });

  it("converts a Mana cost to Life without merging Life sacrifice, Mana consumption or reservation",()=>{
    expect(observed("fireball","SupportBloodMagicPlayer").player).toMatchObject({ManaCost:0,LifeCost:104,SpiritReserved:0});
    expect(native[64].player).toMatchObject({ManaCost:0,LifeCost:73});
    expect(native[65].player).toMatchObject({ManaCost:0,LifeCost:104});
    expect(native[65].player.AverageHit).toBeCloseTo(observed("fireball").player.AverageHit*1.35,10);
    expect(constants("extraction")).toContainEqual(["sacrifice_%_life_on_skill_use",10]);
    expect(observed("fireball","SupportExtractionPlayer").player.LifeCost).toBe(0);
    expect(normalizeSkillSupportIds("berserk",["lifetap","extraction"])).toEqual([]);
    expect(resolved("fireball","mana-flare",["mana-flare","lifetap"]).summary).toContain("current-Mana consumption");
  });

  it("preserves outgoing prohibitions and gain redirection without erasing sacrifice",()=>{
    const ids=["extraction","brutality-i"];
    expect(normalizeSkillSupportIds("bonestorm",ids)).toEqual(ids);
    expect(resolved("bonestorm","extraction",ids).summary).toContain("Life sacrifice");
    expect(resolved("bonestorm","extraction",ids).priorities).toEqual([]);
    expect(native[70].player.flags.DealNoChaos).toBe(true);
    expect(resolved("bonestorm","extraction",["extraction","embitter"]).summary).toContain("not base damage");
    expect(support("extraction").priorities).toEqual([]);
  });

  it("keeps Mana Flare's child, current-Mana consumption, cooldown and trigger eligibility separate",()=>{
    expect(native[67].selected).toBe("TriggeredManaFlarePlayer");
    expect(native[67].player.AverageHit).toBeGreaterThan(0);
    expect(native[68].player).toMatchObject({ManaCost:0,LifeCost:0});
    expect(native[68].player.AverageHit).toBe(native[67].player.AverageHit);
    expect(native[69].player.AverageHit).toBe(0);
    expect(native[66].player.flags.NeverCrit).toBe(true);
    expect(resolved("fireball","mana-flare",["mana-flare","controlled-destruction"]).summary).toContain("cannot trigger Mana Flare");
    expect(support("mana-flare").summary).toContain("25% of current Mana");
    expect(support("mana-flare").priorities).toEqual([]);
  });

  it("requires own Heavy Stun for Practical Magic instead of automatic Spell or Minion damage",()=>{
    expect(constants("practical-magic-ii")).toEqual([["support_stunning_magic_grant_spell_damage_+%_buff_on_heavy_stunning",40],["support_stunning_magic_buff_duration_ms",8000]]);
    expect(observed("fireball","SupportPracticalMagicPlayerTwo").player.AverageHit).toBe(observed("fireball").player.AverageHit);
    expect(native[84].player.flags.CannotStun).toBe(true);
    const ids=["practical-magic-ii","pin-i"];
    expect(normalizeSkillSupportIds("poisonburst-arrow",ids)).toEqual(ids);
    expect(resolved("poisonburst-arrow","practical-magic-ii",ids).summary).toContain("does not supply this skill's own Stun");
    expect(support("practical-magic-ii").priorities).toEqual([]);
  });

  it("checks player Accuracy and flat reservation without treating it as hit chance",()=>{
    const base=observed("berserk").player;
    expect(observed("berserk","SupportPrecisionPlayer").player.Accuracy).toBe(Math.floor(base.Accuracy*1.3));
    expect(observed("berserk","SupportPrecisionPlayerTwo").player.Accuracy).toBe(base.Accuracy*1.5);
    expect(observed("berserk","SupportPrecisionPlayerTwo").player.SpiritReserved).toBe(base.SpiritReserved+20);
    expect(support("precision-ii").priorities.map(s=>s.id)).toEqual(["accuracy"]);
  });

  it("preserves the different recipients and conditions for Mysticism, Upwelling and Thorns",()=>{
    for(const id of ["mysticism-i","mysticism-ii","upwelling-i","upwelling-ii","thornskin-i","thornskin-ii"])expect(support(id).priorities).toEqual([]);
    expect(observed("berserk","SupportMysticismPlayerTwo").player.SpiritReserved).toBe(observed("berserk").player.SpiritReserved+30);
    expect(observed("berserk","SupportThornskinPlayerTwo").player.SpiritReserved).toBe(observed("berserk").player.SpiritReserved+40);
    expect(support("upwelling-ii").summary).toContain("player is missing Mana");
    expect(support("mysticism-ii").summary).toContain("Full Energy Shield");
    expect(normalizeSkillSupportIds("skeletal-arsonist",["upwelling-ii","precision-ii","thornskin-ii"])).toEqual([]);
  });

  it("counts charge types, not charge quantities, and retains consumption prohibitions",()=>{
    expect(native[72].player.AverageHit).toBe(native[73].player.AverageHit);
    expect(native[74].player.AverageHit).toBeGreaterThan(native[72].player.AverageHit);
    expect(native[74].player.flags).toMatchObject({"Condition:CannotConsumeCharges":true,"Condition:CannotConsumeInfusion":true});
    for(const ids of [["inhibitor","heightened-charges"],["heightened-charges","inhibitor"],["inhibitor","perpetual-charge"]]){
      expect(normalizeSkillSupportIds("bonestorm",ids)).toEqual(ids);
      expect(resolved("bonestorm",ids[1],ids).summary).toContain("prevents charge/Infusion consumption");
    }
    expect(resolved("enfeeble","abiding-hex",["abiding-hex","inhibitor"]).summary).toContain("does not override this prohibition");
    expect(resolved("siphoning-strike","charge-profusion-ii",["charge-profusion-ii","inhibitor"]).summary).toContain("not generation");
  });

  it("does not turn charge chance, skip-spending and perfect timing into guaranteed resources",()=>{
    expect(constants("charge-profusion-ii")).toEqual([["chance_to_gain_1_more_charge_%",30],["chance_to_gain_1_more_random_charge_%",15]]);
    expect(constants("heightened-charges")).toContainEqual(["chance_%_to_double_effect_of_removing_charges",20]);
    expect(constants("perpetual-charge")).toContainEqual(["charge_skip_consume_chance_%",25]);
    expect(observed("snipers-mark","SupportChargeProfusionPlayerTwo").player.ManaCost).toBe(Math.floor(observed("snipers-mark").player.ManaCost*1.2));
    expect(observed("perfect-strike","SupportPerfectEndurancePlayer").player.EnduranceCharges).toBe(0);
    expect(support("perfected-endurance").summary).toContain("Perfect-Timing hits");
    expect(normalizeSkillSupportIds("fireball",["charge-profusion-i","heightened-charges","perfected-endurance"])).toEqual([]);
  });

  it("keeps Remnant creation, pickup range, effect and post-collection delays distinct",()=>{
    expect(constants("harmonic-remnants-ii")).toEqual([["remnant_pickup_range_+%",35],["chance_%_to_create_additional_remnant",20]]);
    expect(constants("remnant-potency-ii")).toEqual([["remnant_delay_X_ms",4000],["remnant_effect_+%",30]]);
    expect(constants("remnant-potency-iii")).toEqual([["remnant_effect_+%",40],["remnant_delay_X_ms",3000]]);
    expect(resourceSupportWording.find(w=>w.name==="Remnant Potency II")?.wording[0].text[0]).toContain("after being collected");
    for(const id of ["harmonic-remnants-i","harmonic-remnants-ii","remnant-potency-i","remnant-potency-ii","remnant-potency-iii"])expect(support(id).priorities).toEqual([]);
    expect(resolved("mana-remnants","remnant-potency-iii",["remnant-potency-iii","selfless-remnants"]).summary).toContain("instead of the player");
    expect(support("selfless-remnants").priorities.map(s=>s.id)).toEqual(["presenceArea"]);
    expect(normalizeSkillSupportIds("grim-feast",["selfless-remnants"])).toEqual([]);
  });

  it("warns about Catharsis use-condition conflicts but does not invent Volatility or conflict with plain cooldowns",()=>{
    expect(constants("catharsis")).toEqual([["skill_conditional_requires_X_volatility",20]]);
    for(const ids of [["catharsis","hit-and-run"],["hit-and-run","catharsis"],["catharsis","combo-finisher-i"]]){
      expect(normalizeSkillSupportIds("ice-strike",ids)).toEqual(ids);
      expect(resolved("ice-strike","catharsis",ids).summary).toContain("conflicts");
    }
    expect(native[81].effects[0].supports).not.toContain("SupportHitAndRunPlayer");
    expect(native[82].effects[0].supports).not.toContain("SupportCatharsisPlayer");
    expect(resolved("fireball","catharsis",["catharsis","excise"]).summary).toContain("separate gates");
    expect(normalizeSkillSupportIds("ancestral-cry",["catharsis"])).toEqual([]);
  });

  it("separates incoming channel protection from outgoing Stun and flags incomplete native thresholds",()=>{
    expect(constants("steadfast-ii")).toEqual([["support_steadfast_ailment_threshold_+%_final_while_channelling",100],["support_steadfast_stun_threshold_+%_final_while_channelling",50]]);
    expect(support("steadfast-ii").priorities.map(s=>s.id)).toEqual(["stunThreshold"]);
    expect(support("steadfast-ii").summary).toContain("Native threshold coverage is incomplete");
    expect(normalizeSkillSupportIds("spark",["steadfast-ii"])).toEqual([]);
    expect(observed("flameblast","SupportSteadfastPlayerTwo").player.StunThreshold).toBe(observed("flameblast").player.StunThreshold);
  });

  it("does not assume permanent Stoicism ramp or free Life costs from Defy",()=>{
    expect(constants("stoicism-i")).toEqual([["support_no_fear_damage_+%_final_per_second_up_to_30%",1]]);
    expect(constants("stoicism-ii")).toEqual([["support_no_fear_damage_+%_final_per_second_up_to_30%",2]]);
    expect(resolved("leap-slam","stoicism-ii",["stoicism-ii"]).summary).toContain("resets Stoicism");
    expect(native[88].player.hit).toBeGreaterThan(observed("ice-strike").player.hit);
    expect(native[98].player).toMatchObject({LifeCost:36,ManaCost:0});
    expect(resolved("ice-strike","defy-ii",["defy-ii","lifetap"]).summary).toContain("not a Life-cost exemption");
    expect(support("defy-ii").priorities).toEqual([]);
  });

  it("adds ordinary and Heavy-Stun Guard correctly without claiming mitigation uptime",()=>{
    const first=constants("vanguard-i"),second=constants("vanguard-ii");
    expect(first).toContainEqual(["gain_X_guard_on_stun_per_10_strength",2]);
    expect(first).toContainEqual(["gain_X_guard_on_heavy_stun_per_10_strength",4]);
    expect(second).toContainEqual(["gain_X_guard_on_heavy_stun_per_10_strength",6]);
    expect((2+4)*100/10).toBe(60);
    expect((2+6)*100/10).toBe(80);
    expect(resourceSupportWording.find(w=>w.name==="Vanguard II")?.wording[0].text[0]).toContain("additional");
    expect(native[85].player.flags.CannotStun).toBe(true);
    expect(support("vanguard-ii").skillIds).toEqual(["resonating-shield","shield-charge","shield-wall"]);
    expect(support("vanguard-ii").priorities.map(s=>s.id)).toEqual(["stunBuildup"]);
    expect(support("strong-hearted").priorities.map(s=>s.id)).toEqual(["ailmentDurationReduction"]);
  });

  it("keeps Warcry empowerment and hit-count objects separate from resource supply and object Life",()=>{
    expect(constants("tireless")).toEqual([["chance_for_exerted_attacks_to_not_reduce_count_%",25]]);
    expect(observed("infernal-cry","SupportTirelessPlayer").player.ManaCost).toBe(Math.floor(observed("infernal-cry").player.ManaCost*1.2));
    expect(support("durability").skillIds).toEqual(["lightning-rod","tornado-shot","shockchain-arrow","tempest-bell"]);
    expect(fixtures.find(f=>f.supportId==="durability")!.level1).toMatchObject({reservationMultiplier:10});
    expect(observed("lightning-rod","SupportDurabilityPlayer").player.ManaCost).toBe(observed("lightning-rod").player.ManaCost);
    expect(normalizeSkillSupportIds("frost-wall",["durability"])).toEqual([]);
    expect(support("durability").priorities).toEqual([]);
  });

  it("does not credit rare-modifier kills, Culls, self-ailments or Frozen-kill children as passive DPS",()=>{
    expect(constants("behead-ii")).toContainEqual(["support_executioner_gain_two_rare_monster_mod_on_kill_ms",20000]);
    expect(constants("thrill-of-the-kill-ii")).toContainEqual(["support_thrill_of_the_kill_buff_shock_chance_+%",40]);
    for(const id of ["behead-i","behead-ii","thrill-of-the-kill","thrill-of-the-kill-ii","commiserate","frozen-spite"])expect(support(id).priorities).toEqual([]);
    expect(resolved("poisonburst-arrow","thrill-of-the-kill-ii",["thrill-of-the-kill-ii","culling-strike-ii"]).summary).toContain("not proof of a Cull");
    expect(resolved("spark","commiserate",["commiserate","electrocute"]).summary).toContain("prohibitions still win");
    expect(resolved("ice-shot","frozen-spite",["frozen-spite","elemental-armament-iii"]).summary).toContain("external Freeze");
    expect(native[96].selected).toBe("TriggeredSupportFrozenSpiteIceFragmentPlayer");
    expect(native[96].effects[1].supports).not.toContain("SupportBrutalityPlayer");
    expect(native[96].player.AverageHit).toBe(0);
    expect(support("frozen-spite").summary).toContain("slain-enemy Life");
  });

  it("routes toward optional Life recovery per kill inside budget and leaves Shortest unchanged",()=>{
    const graph:TreeGraph={schemaVersion:1,gameVersion:"test",extractedAt:"test",source:{kind:"fixture",path:"test"},nodes:Object.fromEntries(
      ["start","plain","good","bridge","goal"].map(id=>[id,{...node(...(id==="good"?["Recover 1% of maximum Life on Kill"]:[])),id,flags:id==="start"?{classStart:true}:{}}])),
      edges:[["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]].map(([from,to])=>({from,to})),groups:{},classStarts:{witch:"start"},bounds:{minX:0,minY:0,maxX:100,maxY:100}};
    const settings=applySkillSupportPriorities(setSkillSupport({...fresh("berserk"),preferences:[]},"cannibalism-ii",true),preset("berserk"));
    const request={...settings,mode:"weighted" as const,extraPointBudget:1,graph,baseNodeIds:["start"],baseEdgeKeys:[],goalNodeIds:["goal"]};
    expect(optimizeWeightedBuildGoals(request,undefined,{maxIterations:8})).toMatchObject({status:"success",pointCost:3,weighted:{score:2}});
    const shortest={...request,mode:"shortest" as const};
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

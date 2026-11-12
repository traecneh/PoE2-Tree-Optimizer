import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {specialistSupportFixtures as fixtures,specialistChildFixtures as children,specialistNativeObservations,specialist50Ids,specialist50SupportIdsFor} from "./specialistSupportBatch.fixtures";
import {specialistSkillSupports,specialistSupportOverride} from "./specialistSupportBatch";
import {getSkillPreferencePreset,skillPreferencePresets} from "./skillPreferencePresets";
import {reviewedSkillSupports,reviewedSkillSupportsFor,normalizeSkillSupportIds,setSkillSupport,applySkillSupportPriorities} from "./skillSupportPreferences";
import {scorePassiveNode,normalizePassiveOptimizationSettings,type PassiveOptimizationSettings} from "./passivePreferences";
import {normalizeSavedBuilds} from "./savedBuilds";
import {parseSavedBuildExport,serializeSavedBuildExport} from "./savedBuildTransfer";
import {optimizeWeightedBuildGoals,runOptimizerRequest} from "./weightedBuildGoalsOptimizer";
import {optimizeBuildGoals} from "./buildGoalsOptimizer";
import type {TreeGraph,TreeNode} from "./types";

type Observation={focus:string;support:string;other?:string;selected:string;options:Record<string,unknown>;player:Record<string,number>&{flags:Record<string,boolean>};effects:{effect:string;supports:string[]}[]};
const native=specialistNativeObservations as unknown as Observation[];
const support=(id:string)=>reviewedSkillSupports.find(s=>s.id===id)!;
const resolved=(focus:string,id:string,selected:string[])=>reviewedSkillSupportsFor(focus,selected).find(s=>s.id===id)!;
const preset=(id:string)=>getSkillPreferencePreset(id)!;
const fresh=(id:string):PassiveOptimizationSettings=>({mode:"weighted",extraPointBudget:7,pointBudgetMode:"all-available",focusSkillId:id,preferences:[{id:"energyShield",weight:3}]});
const node=(...stats:string[]):TreeNode=>({id:"test",flags:{},stats,position:{x:0,y:0}});
const constants=(id:string):readonly (readonly (string|number)[])[]=>{const set=fixtures.find(f=>f.supportId===id)!.sets[0];return "constants" in set ? set.constants : [];};
const child=(id:string)=>children.find(c=>c.effectId===id)!;
const observed=(focus:string,id="base")=>native.find(n=>n.focus===focus&&n.support===id&&!n.other&&!Object.keys(n.options).length)!;

describe("final 50 specialist and conditional support variants",()=>{
  it("closes the frozen positive-tier catalog without claiming complete mechanics",()=>{
    expect(specialistSkillSupports).toHaveLength(50);expect(reviewedSkillSupports).toHaveLength(452);
    expect(new Set(reviewedSkillSupports.map(s=>s.effectId)).size).toBe(452);
    expect(specialistSkillSupports.reduce((n,s)=>n+s.skillIds.length,0)).toBe(565);
    const catalog=JSON.parse(readFileSync(new URL("../../tools/coverage/catalog.json",import.meta.url),"utf8"));
    const positive=catalog.entries.filter((g:{support:boolean;tier:number})=>g.support&&g.tier>0);
    expect(positive).toHaveLength(450);
    for(const gem of positive)expect(reviewedSkillSupports.some(s=>s.effectId===gem.effectId),gem.name).toBe(true);
    expect(skillPreferencePresets).toHaveLength(239);
    for(const p of skillPreferencePresets)expect(reviewedSkillSupportsFor(p.id).filter(s=>specialist50Ids.has(s.id)).map(s=>s.id)).toEqual(specialist50SupportIdsFor(p.id));
  });

  it.each(fixtures)("pins $name identity, all families and positive/negative reviewed cohorts",f=>{
    const s=support(f.supportId);
    expect(s).toMatchObject({name:f.name,effectId:f.effectId,family:f.families[0],skillIds:[...f.reviewedSkillIds]});
    expect([s.family,...(s.additionalFamilies??[])]).toEqual(f.families);
    expect(s.summary.length).toBeGreaterThan(150);expect(s.sourceUrl).toMatch(/sup_\w+\.lua#L\d+$/);
    for(const id of f.reviewedSkillIds){expect((f.legal as readonly string[]).includes(id),f.name+"/"+id).toBe(true);expect(getSkillPreferencePreset(id)).toBeDefined();}
    for(const p of skillPreferencePresets)expect(normalizeSkillSupportIds(p.id,[f.supportId])).toEqual((f.reviewedSkillIds as readonly string[]).includes(p.id)?[f.supportId]:[]);
  });

  it.each(fixtures)("has an applied native link on a reviewed focus for $name",f=>{
    expect(native.some(n=>n.support===f.effectId&&!n.other&&(f.reviewedSkillIds as readonly string[]).includes(n.focus)&&n.effects.some(e=>e.supports.includes(f.effectId)))).toBe(true);
  });

  it.each(fixtures)("roundtrips $name with goals, manual weights, budgets and W1/W2 intact",f=>{
    const current=fresh(f.reviewedSkillIds[0]),selected=setSkillSupport(current,f.supportId,true);
    expect(selected.preferences).toEqual(current.preferences);expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const [saved]=normalizeSavedBuilds([{id:"specialist",name:f.name,createdAt:"test",updatedAt:"test",state:{
      selectedClassStartId:"witch",pathStartNodeId:"start",nodeVisualScale:3,buildGoalNodeIds:["goal"],ascendancyAllocationNodeIds:[],
      activeAllocationMode:"main",weaponSetAllocationNodeIds:{1:["w1"],2:["w2"]},optimizerSettings:selected,
      allocationPlan:{committedNodePath:["start"],committedEdgeKeys:[],previewNodePath:[],previewEdgeKeys:[],previewRouteNodePath:[]},
    }}]);
    expect(saved.state.optimizerSettings).toEqual(selected);expect(saved.state.buildGoalNodeIds).toEqual(["goal"]);
    expect(saved.state.weaponSetAllocationNodeIds).toEqual({1:["w1"],2:["w2"]});
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
  });

  it("adds seven optional priority sets only with explicit Apply",()=>{
    expect(specialistSkillSupports.filter(s=>s.priorities.length).map(s=>s.id)).toEqual(["hourglass","execrate","derange","expanse","zenith-ii","crackling-barrier","deadly-resolve"]);
    for(const s of specialistSkillSupports){
      const current=fresh(s.skillIds[0]),selected=setSkillSupport(current,s.id,true);
      expect(selected.preferences).toBe(current.preferences);
      const applied=applySkillSupportPriorities(selected,preset(s.skillIds[0]));
      if(!s.priorities.some(p=>p.id===current.preferences[0].id))expect(applied.preferences[0]).toEqual(current.preferences[0]);
      expect(applied.extraPointBudget).toBe(7);expect(applied.pointBudgetMode).toBe("all-available");
      expect(scorePassiveNode(node("10% increased Spell Damage"),[{id:"spellDamage",weight:1}],selected)).toBe(1);
    }
    expect(resolved("fireball","zenith-ii",["zenith-ii","lifetap"]).priorities).toEqual([]);
  });

  it("uses both Alignment III and Expand families and preserves Nova I's distinct family",()=>{
    expect(normalizeSkillSupportIds("lightning-arrow",["alignment-i","alignment-iii"])).toEqual(["alignment-i"]);
    const initial={...fresh("lightning-arrow"),supportGemIds:["alignment-i","multishot-ii"]};
    expect(setSkillSupport(initial,"alignment-iii",true).supportGemIds).toEqual(["alignment-iii"]);
    expect(setSkillSupport({...fresh("comet"),supportGemIds:["unleash","magnified-area-i"]},"expand",true).supportGemIds).toEqual(["expand"]);
    expect(support("wildshards-i").family).toBe(support("multishot-ii").family);
    expect(support("nova-projectiles-i").family).not.toBe(support("wildshards-i").family);
    expect(setSkillSupport({...fresh("fireball"),supportGemIds:["wildshards-i"]},"wildshards-ii",true).supportGemIds).toEqual(["wildshards-ii"]);
    expect(constants("alignment-iii")).toContainEqual(["support_called_shots_additional_projectiles_when_matching_indicated_direction",4]);
    expect(constants("alignment-iii").some(([key])=>String(key).includes("damage"))).toBe(false);
    expect(normalizeSkillSupportIds("escape-shot",["alignment-iii"])).toEqual([]);
  });

  it("keeps actual Nova/cascade area penalties separate from hits and radius",()=>{
    const nova=observed("ice-nova"),astral=observed("ice-nova","SupportAstralProjectionPlayer");
    expect(astral.player.AreaOfEffectMod).toBe(nova.player.AreaOfEffectMod*.75);expect(astral.player.AverageHit).toBe(nova.player.AverageHit);
    const comet=observed("comet"),cascade=observed("comet","SupportSpellCascadePlayer");
    expect(cascade.player.AreaOfEffectMod).toBe(.8);expect(Math.abs(cascade.player.AverageHit-comet.player.AverageHit*.7)).toBeLessThan(.25);
    expect(support("spell-cascade").summary).toContain("random axis");expect(support("spell-cascade").summary).toContain("Not three guaranteed hits");
    expect(normalizeSkillSupportIds("skeletal-frost-mage",["spell-cascade","wildshards-i"])).toEqual([]);
  });

  it("retains cooldown rejection and gates instead of multiplying repeated casts",()=>{
    expect(constants("unleash")).toContainEqual(["base_maximum_seals_for_skill",2]);
    expect(constants("expand")).toContainEqual(["base_maximum_seals_for_skill",3]);
    expect(observed("fireball","SupportUnleashPlayer").player.ManaCost).toBe(156);
    expect(observed("fireball","SupportExpandPlayer").player.ManaCost).toBe(124);
    for(const index of [76,77,78,79,80,81])expect(native[index].effects[0].supports).toEqual(["SupportHourglassPlayer"]);
    expect(resolved("fireball","unleash",["unleash","hourglass"]).summary).toContain("ineligible");
    expect(resolved("comet","spell-echo",["spell-echo","hourglass"]).summary).toContain("ineligible");
    expect(observed("fireball","SupportHourglassPlayer").player.Cooldown).toBeGreaterThanOrEqual(10);
    expect(observed("fireball","SupportExecratePlayer").player.Cooldown).toBeGreaterThanOrEqual(8);
    expect(observed("fireball","SupportHourglassPlayer").player.AverageHit).toBeCloseTo(299.6*1.3);
    expect(support("unleash").summary).toContain("Waiting");
  });

  it("requires Power generation and keeps granted Sparks distinct from ordinary Spark",()=>{
    expect(support("empowered-sparks-i").skillIds).not.toContain("snipers-mark");
    expect(support("empowered-sparks-i").skillIds).toContain("profane-ritual");
    expect(child("TriggeredSparkEmpowerPlayer").sets[0].constants).toContainEqual(["support_empower_X_attacks_with_spark_on_power_charge_gain",3]);
    expect(child("TriggeredEmpoweredSparkPlayer").sets[0].flags).toEqual({duration:true,hit:true,projectile:true});
    expect(support("empowered-sparks-i").summary).toContain("Power Charge");
    expect(resolved("siphoning-strike","empowered-sparks-i",["empowered-sparks-i","inhibitor"]).summary).toContain("not generation");
  });

  it("keeps Living Lightning minions and Skittering Stone caps distinct from parent damage",()=>{
    expect(child("TriggeredLivingLightningPlayerTwo").sets[0].constants).toContainEqual(["base_number_of_living_lightning_allowed",8]);
    expect(child("TriggeredLivingLightningPlayerTwo").sets[0].constants).toContainEqual(["minion_1%_damage_+%_per_X_player_strength",5]);
    expect(observed("spark","SupportLivingLightningPlayerTwo").player.AverageHit).toBe(observed("spark").player.AverageHit);
    expect(support("living-lightning-ii").priorities).toEqual([]);
    expect(resolved("lightning-rod","living-lightning",["living-lightning","brutality-i"]).summary).toContain("cannot supply this trigger");
    expect(resolved("arc","living-lightning",["living-lightning","elemental-focus"]).summary).toContain("not inability to deal Lightning");
    expect(child("TriggeredSkitteringStonePlayer").sets[0].constants).toContainEqual(["maximum_hatching_elementals_allowed",8]);
    expect(child("TriggeredSkitteringStonePlayerTwo").sets[0].constants).toContainEqual(["support_hatching_elementals_number_of_elementals_per_hatch",2]);
    expect(child("TriggeredSkitteringStonePlayerTwo").sets[0].constants).toContainEqual(["base_skill_effect_duration",20000]);
    expect(native[106].selected).toBe("TriggeredSkitteringStonePlayer");expect(native[106].player.AverageHit).toBe(0);
  });

  it("separates crystal Life and wall geometry from player and explosion damage",()=>{
    const base=observed("frost-wall"),icicle=observed("frost-wall","SupportIciclePlayer");
    expect(icicle.player.IceCrystalLife).toBe(base.player.IceCrystalLife*.5);expect(icicle.player.AverageHit).toBe(base.player.AverageHit);
    expect(support("icicle").priorities).toEqual([]);expect(constants("fortress-ii")).toContainEqual(["support_wall_fortress_hit_damage_+%_final",-30]);
    expect(resolved("flame-wall","fortress-i",["fortress-i"]).summary).toContain("broader native damage map differ");
  });

  it("requires Overgrowth for Growth but actual Plant hits for Poison Spores",()=>{
    expect(child("TriggeredExplosiveGrowthPlayerTwo").sets[0].constants).toContainEqual(["global_chance_to_blind_on_hit_%",100]);
    expect(child("TriggeredExplosiveGrowthPlayer").sets[0].constants).toContainEqual(["support_explosive_growth_explosion_delay_X_ms",1200]);
    expect(support("accelerated-growth-ii").summary).toContain("Overgrowth");
    expect(support("poison-spores").summary).toContain("Overgrowth is not the trigger");
    expect(support("poison-spores").skillIds).not.toContain("toxic-domain");
    const pustule=child("TriggeredPoisonSporesPustule");
    expect(pustule.sets[0].stats).toContain("base_deal_no_damage");
    expect(pustule.sets[1]!.constants).toContainEqual(["base_chance_to_poison_on_hit_%",100]);
    expect(pustule.sets[1]!.constants).toContainEqual(["base_skill_detonation_time",15000]);
    expect(support("poison-spores").priorities).toEqual([]);
  });

  it("keeps Caltrops delivery and capped ground growth separate from damage rate",()=>{
    expect(child("TriggeredCaltropsPlayer").sets[0].constants).toContainEqual(["base_skill_effect_duration",8000]);
    expect(observed("lightning-spear","SupportCaltropsPlayer").player.ManaCost).toBe(Math.floor(46*1.2));
    expect(constants("encroaching-ground")).toContainEqual(["support_ground_effect_area_of_effect_+%_final_per_second_max",100]);
    expect(observed("gas-arrow","SupportEncroachingGroundPlayer").player.AreaOfEffectMod).toBe(1);
    expect(resolved("gas-arrow","encroaching-ground",["encroaching-ground","compressed-duration-i"]).summary).toContain("actual ground lifetime");
  });

  it("keeps non-ailment DoT thresholds, enemy Full Life and regeneration suppression separate",()=>{
    expect(constants("swift-affliction-iii")).toContainEqual(["support_swift_affliction_skill_effect_and_damaging_ailment_duration_+%_final",-30]);
    expect(support("swift-affliction-iii").summary).toContain("Poison and Bleeding are not non-ailment DoT");
    expect(resolved("gas-arrow","swift-affliction-iii",["swift-affliction-iii","prolonged-duration-i"]).summary).toContain("can cross it");
    expect(constants("intense-agony")).toContainEqual(["support_chaotic_assassination_damage_over_time_+%_final_against_full_life_enemies",50]);
    expect(support("acrimony").summary).toContain("Only the strongest");
    expect(support("acrimony").skillIds).not.toContain("herald-of-ash");
    expect(support("acrimony").priorities).toEqual([]);
    expect(constants("execrate")).toContainEqual(["support_ailment_cooldown_ailment_chance_+%_final",100]);
    expect(resolved("fireball","execrate",["execrate","elemental-focus"]).summary).toContain("bypass prohibitions");
  });

  it("does not turn heavier requirements, timing, criticals or target states into free events",()=>{
    expect(constants("delayed-gratification")).toContainEqual(["difficulty_of_meeting_conditional_requirement_+%",150]);
    expect(constants("delayed-gratification")).toContainEqual(["conditional_skill_additional_usages_duration_ms",10000]);
    expect(resolved("ice-strike","practical-magic-i",["brink-i","practical-magic-i"]).summary).toContain("finishing Heavy Stun");
    expect(resolved("ice-strike","enduring-impact-ii",["brink-i","enduring-impact-ii"]).priorities).toEqual([]);
    expect(support("perfection").summary).toContain("failing any Perfect Timing");
    expect(resolved("perfect-strike","perfection",["perfection","window-of-opportunity-ii"]).summary).toContain("narrows");
    expect(support("syzygy").summary).toContain("both Ignited and Fully Armour Broken");
    expect(resolved("fireball","volatility",["volatility","controlled-destruction"]).summary).toContain("cannot generate Volatility");
    expect(resolved("fireball","volatility",["volatility","catharsis"]).summary).toContain("before the first use");
    expect(constants("window-of-opportunity-ii")).toContainEqual(["gain_%_of_evasion_as_deflection_rating_on_perfect_timing_for_8_seconds",15]);
  });

  it("keeps added ES costs distinct from Lifetap and native non-ailment scaling",()=>{
    expect(native[116].player).toMatchObject({ESCost:1015,ManaCost:65,LifeCost:0});
    expect(native[117].player).toMatchObject({ESCost:1015,ManaCost:0,LifeCost:65});
    expect(native[116].player.TotalDot).toBeCloseTo(native[101].player.TotalDot*1.8);
    expect(resolved("essence-drain","derange",["derange","lifetap"]).summary).toContain("ES cost equal to Intelligence remains");
    expect(normalizeSkillSupportIds("gas-arrow",["derange"])).toEqual([]);
  });

  it("keeps Zenith's strict Mana condition and efficiency separate from sustain",()=>{
    expect(native[114].player.AverageHit).toBe(299.6);expect(native[85].player.AverageHit).toBeCloseTo(299.6*1.3);
    expect(native[86].player.ManaCost).toBeCloseTo(104/1.25);
    expect(native[115].player.ManaCost).toBe(native[86].player.ManaCost);
    expect(support("zenith-i").summary).toContain("above 90%");expect(support("zenith-ii").summary).toContain("not 25% less cost");
  });

  it("keeps triggered Fluke effects and flat Herald reservation on their actual recipients",()=>{
    expect(native[103].effects.some(e=>e.supports.includes("SupportFlukePlayer"))).toBe(true);
    expect(support("fluke").summary).toContain("triggered-child");expect(support("fluke").priorities).toEqual([]);
    expect(observed("herald-of-ash","SupportDeadlyHeraldsPlayer").player.SpiritReserved-observed("herald-of-ash").player.SpiritReserved).toBe(20);
    expect(normalizeSkillSupportIds("herald-of-plague",["deadly-herald"])).toEqual([]);
  });

  it("keeps armour consumption, retaliation, landing and crit-created ground distinct",()=>{
    expect(observed("seismic-cry","SupportBattershoutPlayer").player.flags.CannotArmourBreak).toBe(true);
    expect(child("TriggeredBattershoutExplosionPlayer").sets[0].constants).toContainEqual(["support_battershout_physical_damage_equal_to_%_of_broken_armour",40]);
    expect(child("TriggeredDeadlyResolvePlayer").sets[0].flags).toEqual({nonWeaponAttack:true});
    expect(constants("deadly-resolve")).toContainEqual(["dangerous_resolve_explosion_cooldown_ms",300]);
    expect(support("crackling-barrier").summary).toContain("valid retaliation event");
    expect(support("holy-descent").summary).toContain("Landing");
    expect(support("shocking-leap").summary).toContain("first critical hit");
    expect(specialistSupportOverride(support("shocking-leap"),["shocking-leap","elemental-focus"],"leap-slam")!.summary).toContain("separate from a hit");
  });

  it("does not assume Cadence stacks, rotation uptime or linear skill-level damage",()=>{
    expect(constants("cadence")).toContainEqual(["support_measured_speed_maximum_stacks",6]);
    expect(constants("cadence")).toContainEqual(["support_measured_speed_disabled_ms",10000]);
    expect(constants("physical-mastery")).toEqual([["supported_physical_skill_gem_level_+",1]]);
    expect(observed("bonestorm","SupportPhysicalMasteryPlayer").player.AverageHit).toBeGreaterThan(observed("bonestorm").player.AverageHit);
    expect(observed("fireball","SupportTempestuousTempoPlayer").player.AverageHit).toBe(299.6);
    expect(Math.abs(native[100].player.AverageHit-299.6*1.36)).toBeLessThan(.5);
    expect(support("rising-tempest").priorities).toEqual([]);
  });

  it("routes optional cooldown recovery within budget and keeps Shortest unchanged",()=>{
    const graph:TreeGraph={schemaVersion:1,gameVersion:"test",extractedAt:"test",source:{kind:"fixture",path:"test"},nodes:Object.fromEntries(
      ["start","plain","good","bridge","goal"].map(id=>[id,{...node(...(id==="good"?["10% increased Cooldown Recovery Rate"]:[])),id,flags:id==="start"?{classStart:true}:{}}])),
      edges:[["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]].map(([from,to])=>({from,to})),groups:{},classStarts:{witch:"start"},bounds:{minX:0,minY:0,maxX:100,maxY:100}};
    const settings=applySkillSupportPriorities(setSkillSupport({...fresh("fireball"),preferences:[]},"hourglass",true),preset("fireball"));
    const request={...settings,mode:"weighted" as const,extraPointBudget:1,graph,baseNodeIds:["start"],baseEdgeKeys:[],goalNodeIds:["goal"]};
    expect(optimizeWeightedBuildGoals(request,undefined,{maxIterations:8})).toMatchObject({status:"success",pointCost:3,weighted:{score:2}});
    const shortest={...request,mode:"shortest" as const};expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

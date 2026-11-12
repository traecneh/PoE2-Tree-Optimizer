import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { deploymentSupportFixtures as fixtures,deploymentNativeObservations,deployment45Ids,deployment45SupportIdsFor } from "./deploymentSupportBatch.fixtures";
import { deploymentSkillSupports } from "./deploymentSupportBatch";
import { getSkillPreferencePreset,skillPreferencePresets } from "./skillPreferencePresets";
import { reviewedSkillSupports,reviewedSkillSupportsFor,normalizeSkillSupportIds,setSkillSupport,applySkillSupportPriorities } from "./skillSupportPreferences";
import { passivePreferenceValues,scorePassiveNode,normalizePassiveOptimizationSettings,type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport,serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeWeightedBuildGoals,runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import type { TreeGraph,TreeNode } from "./types";

type Observation={focus:string;support:string;other?:string;options:Record<string,unknown>;player:Record<string,number>;effects:{effect:string;supports:string[]}[]};
const native=deploymentNativeObservations as unknown as Observation[];
const observed=(focus:string,support="base",options:Record<string,unknown>={},other?:string)=>native.find(n=>n.focus===focus&&n.support===support&&n.other===other&&JSON.stringify(n.options)===JSON.stringify(Object.keys(options).length?options:[]))!;
const support=(id:string)=>reviewedSkillSupports.find(s=>s.id===id)!;
const preset=(id:string)=>getSkillPreferencePreset(id)!;
const fresh=(id:string):PassiveOptimizationSettings=>({mode:"weighted",extraPointBudget:7,pointBudgetMode:"all-available",focusSkillId:id,preferences:[{id:"energyShield",weight:3}]});
const node=(...stats:string[]):TreeNode=>({id:"test",flags:{},stats,position:{x:0,y:0}});

describe("45 deployment and Combo support variants",()=>{
  it("adds the approved 45 positive-tier variants and 533 explicit reviewed pairs",()=>{
    expect(deploymentSkillSupports).toHaveLength(45);
    expect(reviewedSkillSupports).toHaveLength(452);
    expect(new Set(deploymentSkillSupports.map(s=>s.effectId)).size).toBe(45);
    expect(deploymentSkillSupports.reduce((n,s)=>n+s.skillIds.length,0)).toBe(533);
    for(const p of skillPreferencePresets)expect(reviewedSkillSupportsFor(p.id).filter(s=>deployment45Ids.has(s.id)).map(s=>s.id)).toEqual(deployment45SupportIdsFor(p.id));
    const catalog=JSON.parse(readFileSync(new URL("../../tools/coverage/catalog.json",import.meta.url),"utf8"));
    expect(fixtures.every(f=>catalog.entries.some((g:{effectId:string;tier:number})=>g.effectId===f.effectId&&g.tier>0))).toBe(true);
  });

  it.each(fixtures)("pins $name identity, family, positive and negative component scopes",f=>{
    const s=support(f.supportId);
    expect(s).toMatchObject({name:f.name,effectId:f.effectId,family:f.families[0],skillIds:[...f.reviewedSkillIds]});
    expect(s.summary.length).toBeGreaterThan(80);
    expect(s.sourceUrl).toMatch(/sup_\w+\.lua#L\d+$/);
    for(const id of f.reviewedSkillIds){
      expect((f.legal as readonly string[]).includes(id),f.name+"/"+id).toBe(true);
      expect(getSkillPreferencePreset(id)).toBeDefined();
      expect(normalizeSkillSupportIds(id,[f.supportId])).toEqual([f.supportId]);
    }
    for(const p of skillPreferencePresets)if(!(f.reviewedSkillIds as readonly string[]).includes(p.id))expect(normalizeSkillSupportIds(p.id,[f.supportId]),p.id).toEqual([]);
  });

  it.each(fixtures)("has a native accepted-link observation for $name without assuming its effect is fully modeled",f=>{
    const row=native.find(n=>n.support===f.effectId&&!n.other)!;
    expect(row).toBeDefined();
    expect(row.effects.some(e=>e.supports.includes(f.effectId))).toBe(true);
  });

  it.each(fixtures)("roundtrips $name without changing manual priorities, goals, budgets or W1/W2",f=>{
    const current=fresh(f.reviewedSkillIds[0]),selected=setSkillSupport(current,f.supportId,true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const [saved]=normalizeSavedBuilds([{id:"deployment",name:f.name,createdAt:"test",updatedAt:"test",state:{
      selectedClassStartId:"witch",pathStartNodeId:"start",nodeVisualScale:3,buildGoalNodeIds:["goal"],ascendancyAllocationNodeIds:[],
      activeAllocationMode:"main",weaponSetAllocationNodeIds:{1:["w1"],2:["w2"]},optimizerSettings:selected,
      allocationPlan:{committedNodePath:["start"],committedEdgeKeys:[],previewNodePath:[],previewEdgeKeys:[],previewRouteNodePath:[]},
    }}]);
    expect(saved.state.optimizerSettings).toEqual(selected);
    expect(saved.state.buildGoalNodeIds).toEqual(["goal"]);
    expect(saved.state.weaponSetAllocationNodeIds).toEqual({1:["w1"],2:["w2"]});
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
  });

  it("replaces tiers and the shared Hazard family without inventing cross-family exclusivity",()=>{
    expect(normalizeSkillSupportIds("rolling-slam",["fist-of-war-i","fist-of-war-iii"])).toEqual(["fist-of-war-i"]);
    const current={...fresh("rolling-slam"),supportGemIds:["fist-of-war-i"]};
    expect(setSkillSupport(current,"fist-of-war-iii",true).supportGemIds).toEqual(["fist-of-war-iii"]);
    expect(setSkillSupport({...fresh("spearfield"),supportGemIds:["controlled-hazard"]},"delayed-reaction",true).supportGemIds).toEqual(["delayed-reaction"]);
    expect(normalizeSkillSupportIds("explosive-grenade",["long-fuse-i","short-fuse-ii"])).toEqual(["long-fuse-i","short-fuse-ii"]);
  });

  it("requires explicit Apply for reload priorities and keeps manual weights",()=>{
    const current=fresh("galvanic-shards"),selected=setSkillSupport(current,"nimble-reload",true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(applySkillSupportPriorities(selected,preset("galvanic-shards")).preferences).toEqual([...current.preferences,{id:"crossbowReloadSpeed",weight:2}]);
    const manual={...selected,preferences:[{id:"crossbowReloadSpeed" as const,weight:3}]};
    expect(manual.preferences).toEqual([{id:"crossbowReloadSpeed",weight:3}]);
    expect(applySkillSupportPriorities(manual,preset("galvanic-shards")).preferences).toEqual([{id:"crossbowReloadSpeed",weight:2}]);
    expect(scorePassiveNode(node("15% increased Crossbow Reload Speed"),[{id:"crossbowReloadSpeed",weight:2}],selected)).toBe(3);
    for(const id of ["galvanic-shards","explosive-shot","armour-piercing-rounds"])
      expect(preset(id).suggestions.find(s=>s.id==="attackSpeed")?.reason).toContain("also affect native Crossbow reload rate");
    for(const s of deploymentSkillSupports)if(!["nimble-reload","streamlined-rounds","ammo-conservation-iii"].includes(s.id)&&!s.id.startsWith("double-barrel"))expect(s.priorities).toEqual([]);
  });

  it("parses only finite, unconditional player Crossbow reload values and counts generic speed separately",()=>{
    expect(passivePreferenceValues(node("15% increased Crossbow Reload Speed","20% reduced Crossbow Reload Speed"))).toEqual({crossbowReloadSpeed:-5});
    expect(passivePreferenceValues(node("15% increased Crossbow Reload Speed","3% increased Attack Speed","3% increased Skill Speed"))).toEqual({crossbowReloadSpeed:15,attackSpeed:3,skillSpeed:3});
    for(const line of ["15% more Crossbow Reload Speed","15% increased Crossbow Reload Speed if you've Reloaded Recently","Minions have 15% increased Crossbow Reload Speed","15% chance to Reload instantly","15% increased Reload Speed","15% increased Crossbow Reload Speed for Minions","Infinity% increased Crossbow Reload Speed", "9".repeat(400)+"% increased Crossbow Reload Speed"])
      expect(passivePreferenceValues(node(line))).not.toHaveProperty("crossbowReloadSpeed");
    const graph=JSON.parse(readFileSync(new URL("../../public/tree-graph.json",import.meta.url),"utf8")) as TreeGraph;
    const lines=Object.values(graph.nodes).filter(n=>!n.flags.ascendancy&&!n.flags.classStart&&!n.flags.mastery).flatMap(n=>(n.stats??[]).filter(s=>/^\d+% increased Crossbow Reload Speed$/.test(s)));
    expect(lines.filter(s=>s==="15% increased Crossbow Reload Speed")).toHaveLength(6);
    expect(lines.filter(s=>s==="40% increased Crossbow Reload Speed")).toHaveLength(1);
  });

  it("checks reload math independently without treating clip capacity as simultaneous projectiles",()=>{
    const base=observed("galvanic-shards").player;
    expect(base.ReloadTime).toBe(.8);
    expect(observed("galvanic-shards","SupportNimbleReloadPlayer").player.ReloadTime).toBeCloseTo(base.ReloadTime/1.6,10);
    expect(observed("galvanic-shards","base",{mods:"40% increased Crossbow Reload Speed"}).player.ReloadRate).toBeCloseTo(base.ReloadRate*1.4,10);
    expect(observed("galvanic-shards","base",{mods:"20% reduced Crossbow Reload Speed"}).player.ReloadTime).toBeCloseTo(base.ReloadTime/.8,10);
    expect(observed("galvanic-shards","SupportAmmoConservationPlayerThree").player).toMatchObject({BoltCount:1,ChanceToNotConsumeAmmo:30,ReloadTime:1});
    expect(observed("galvanic-shards","SupportAmmoConservationPlayerThree",{},"SupportNimbleReloadPlayer").player.ReloadRate).toBeCloseTo(base.ReloadRate*.8*1.6,10);
    expect(observed("galvanic-shards","SupportDoubleBarrelPlayer").player).toMatchObject({BoltCount:2,ManaCost:48});
    expect(observed("galvanic-shards","SupportDoubleBarrelPlayer").player.ReloadTime).toBeCloseTo(base.ReloadTime/.7,10);
    expect(observed("galvanic-shards","SupportStreamlinedRoundsPlayer").player).toMatchObject({BoltCount:6,ManaCost:52});
    expect(observed("galvanic-shards","SupportStreamlinedRoundsPlayer",{},"SupportDoubleBarrelPlayerTwo").player).toMatchObject({BoltCount:7,ManaCost:58});
    // Streamlined's Attack Speed multiplier also feeds native reload rate.
    expect(observed("galvanic-shards","SupportStreamlinedRoundsPlayer").player.ReloadRate).toBeCloseTo(base.ReloadRate*1.5*.5,10);
  });

  it("keeps fuse time, cooldown recovery and Hazard duration distinct from damage and Poison timers",()=>{
    const base=observed("explosive-grenade").player;
    expect(observed("explosive-grenade","SupportLongFusePlayer").player.DetonationTime).toBe(base.DetonationTime*1.5);
    expect(observed("explosive-grenade","SupportShortFusePlayerTwo").player.DetonationTime).toBeCloseTo(base.DetonationTime*.2,10);
    expect(observed("explosive-grenade","SupportLongFusePlayer",{},"SupportShortFusePlayerTwo").player.DetonationTime).toBeCloseTo(base.DetonationTime*1.5*.2,10);
    expect(observed("explosive-grenade","SupportPayloadPlayer").player.Cooldown).toBeCloseTo(base.Cooldown/(1-.7),10);
    expect(observed("spearfield","SupportDelayedReactionPlayer").player.Duration).toBeCloseTo(3,1);
    expect(observed("spearfield","SupportRearmPlayerTwo").player.Duration).toBe(observed("spearfield").player.Duration);
    expect(support("long-fuse-i").summary).toContain("native damage coverage is incomplete");
    expect(observed("briarpatch","SupportPersistentGroundPlayer").player.Duration).toBe(observed("briarpatch").player.Duration);
    expect(support("persistent-ground-iii").summary).toContain("enemy Cooldown");
    expect(normalizeSkillSupportIds("gas-arrow",["persistent-ground-i","long-fuse-i"])).toEqual([]);
    expect(normalizeSkillSupportIds("mortar-cannon",["adhesive-grenades-ii","payload"])).toEqual([]);
  });

  it("keeps Combo conditional, refuses to combine mutually incompatible Combo bonuses, and separates Strike sequences",()=>{
    const base=observed("ice-strike").player;
    expect(observed("ice-strike","SupportCulminationPlayer",{multiplierCombo:0}).player.hit).toBe(base.hit);
    expect(observed("ice-strike","SupportCulminationPlayer",{multiplierCombo:10}).player.hit).toBeCloseTo(base.hit*1.3,10);
    expect(observed("ice-strike","SupportCulminationPlayerTwo",{multiplierCombo:10}).player.hit).toBeCloseTo(base.hit*1.4,10);
    for(const ids of [["combo-finisher-i","culmination-ii"],["culmination-ii","combo-finisher-i"]]){
      expect(normalizeSkillSupportIds("ice-strike",ids)).toEqual(ids);
      expect(reviewedSkillSupportsFor("ice-strike",ids).find(s=>s.id===ids[0])?.summary).toContain("Incompatible Combo pair");
    }
    for(const row of native.filter(n=>n.other&&/ComboFinisher|Culmination/.test(n.support)))expect(row.effects[0].supports).toEqual([row.support]);
    expect(observed("ice-strike","SupportCrescendoPlayerTwo").player.Speed).toBeCloseTo(base.Speed*1.15,10);
    expect(support("crescendo-iii").summary).toContain("instead of");
    expect(normalizeSkillSupportIds("pounce",["combo-finisher-i","culmination-ii"])).toEqual([]);
    expect(normalizeSkillSupportIds("skeletal-brute",["culmination-ii","ancestral-call-ii","impact-shockwave"])).toEqual([]);
  });

  it("keeps boost intervals, charge consumption, Bleeding and Poison sources separate",()=>{
    const base=observed("rolling-slam").player;
    expect(observed("rolling-slam","FistOfWarSupportPlayerTwo").player.ManaCost).toBe(base.ManaCost*1.5);
    expect(observed("rolling-slam","FistOfWarSupportPlayerThree").player.ManaCost).toBe(base.ManaCost*2);
    expect(support("fist-of-war-iii").summary).toContain("14 seconds");
    expect(support("jagged-ground-i").summary).toContain("consume 1 Endurance Charge");
    expect(support("jagged-ground-ii").summary).toContain("No Tier I Endurance Charge cost");
    expect(support("concoct-ii").summary).toContain("Not Poison scaling");
    expect(observed("poisonburst-arrow","SupportConcoctPlayerTwo").player.hit).toBe(observed("poisonburst-arrow").player.hit);
    const entangle=observed("entangle").player;
    expect(observed("entangle","SupportUpheavalPlayerTwo").player.Speed).toBeCloseTo(entangle.Speed*.8,10);
    expect(observed("entangle","SupportUpheavalPlayerTwo").player.Duration).toBe(entangle.Duration);
    expect(support("upheaval-ii").summary).toContain("Plant DoT");
  });

  it("uses reload preferences within the same extra-point cap while leaving Shortest unchanged",()=>{
    const graph:TreeGraph={schemaVersion:1,gameVersion:"test",extractedAt:"test",source:{kind:"fixture",path:"test"},nodes:Object.fromEntries(
      ["start","plain","good","bridge","goal"].map(id=>[id,{...node(...(id==="good"?["20% increased Crossbow Reload Speed"]:[])),id,flags:id==="start"?{classStart:true}:{}}])),
      edges:[["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]].map(([from,to])=>({from,to})),groups:{},classStarts:{witch:"start"},bounds:{minX:0,minY:0,maxX:100,maxY:100}};
    const settings=applySkillSupportPriorities(setSkillSupport({...fresh("galvanic-shards"),preferences:[]},"nimble-reload",true),preset("galvanic-shards"));
    const request={...settings,mode:"weighted" as const,extraPointBudget:1,graph,baseNodeIds:["start"],baseEdgeKeys:[],goalNodeIds:["goal"]};
    expect(optimizeWeightedBuildGoals(request,undefined,{maxIterations:8})).toMatchObject({status:"success",pointCost:3,weighted:{score:4}});
    const shortest={...request,mode:"shortest" as const};
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

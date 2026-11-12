import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { commonSupportFixtures as fixtures,commonSupportNativeObservations,commonSupport45Ids,common45SupportIdsFor } from "./commonSupportBatch.fixtures";
import { commonSkillSupports } from "./commonSupportBatch";
import { getSkillPreferencePreset,addSkillPresetPreferences,skillPreferencePresets } from "./skillPreferencePresets";
import { reviewedSkillSupports,reviewedSkillSupportsFor,normalizeSkillSupportIds,setSkillSupport,refineSkillPreferencePreset,applySkillSupportPriorities,skillSupportPriorityChanges } from "./skillSupportPreferences";
import { passivePreferenceValues,scorePassiveNode,normalizePassiveOptimizationSettings,type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport,serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeWeightedBuildGoals,runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import type { TreeGraph,TreeNode } from "./types";
type Observation={focus:string;support:string;other?:string;resistance:number;arcane:boolean;player:Record<string,number>;minion?:Record<string,number>};
const native=commonSupportNativeObservations as unknown as Observation[];
const observed=(focus:string,support="base",extra:Partial<Observation>={})=>native.find(n=>n.focus===focus&&n.support===support&&n.other===undefined&&n.resistance===0&&!n.arcane
  && Object.entries(extra).every(([key,value])=>n[key as keyof Observation]===value))
  ?? native.find(n=>n.focus===focus&&n.support===support&&Object.entries({other:undefined,resistance:0,arcane:false,...extra}).every(([key,value])=>n[key as keyof Observation]===value))!;
const fixture=(id:string)=>fixtures.find(f=>f.supportId===id)!;
const constants=(id:string)=>{const set=fixture(id).sets[0];return "constants" in set ? set.constants : [];};
const support=(id:string)=>reviewedSkillSupports.find(s=>s.id===id)!;
const preset=(id:string)=>getSkillPreferencePreset(id)!;
const fresh=(id:string):PassiveOptimizationSettings=>({mode:"weighted",extraPointBudget:7,pointBudgetMode:"all-available",focusSkillId:id,preferences:[{id:"energyShield",weight:3}]});
const node=(...stats:string[]):TreeNode=>({id:"test",flags:{},stats,position:{x:0,y:0}});
describe("45 cross-skill support variants",()=>{
  it("adds exactly the approved 45 positive-tier entries and 550 explicit pairs",()=>{
    expect(commonSkillSupports).toHaveLength(45);
    expect(reviewedSkillSupports).toHaveLength(452);
    expect(new Set(commonSkillSupports.map(s=>s.effectId)).size).toBe(45);
    expect(commonSkillSupports.reduce((n,s)=>n+s.skillIds.length,0)).toBe(550);
    for(const p of skillPreferencePresets) expect(reviewedSkillSupportsFor(p.id).filter(s=>commonSupport45Ids.has(s.id)).map(s=>s.id)).toEqual(common45SupportIdsFor(p.id));
    const catalog=JSON.parse(readFileSync(new URL("../../tools/coverage/catalog.json",import.meta.url),"utf8"));
    expect(fixtures.every(f=>catalog.entries.some((g:{effectId:string;tier:number})=>g.effectId===f.effectId&&g.tier>0))).toBe(true);
  });

  it.each(fixtures)("pins $name's identity, shared family and complete reviewed native-compatible cohort",f=>{
    const s=support(f.supportId);
    expect(s).toMatchObject({name:f.name,effectId:f.effectId,family:f.families[0],skillIds:[...f.reviewedSkillIds]});
    expect(s.summary.trim().length).toBeGreaterThan(40);
    expect(s.sourceUrl).toMatch(/sup_\w+\.lua#L\d+$/);
    for(const id of f.reviewedSkillIds) {
      expect((f.legal as readonly string[]).includes(id),f.supportId+"/"+id).toBe(true);
      expect(getSkillPreferencePreset(id)).toBeDefined();
      expect(normalizeSkillSupportIds(id,[f.supportId])).toEqual([f.supportId]);
      expect(reviewedSkillSupportsFor(id).some(s=>s.id===f.supportId)).toBe(true);
    }
    for(const p of skillPreferencePresets) if(!(f.reviewedSkillIds as readonly string[]).includes(p.id)) {
      expect(normalizeSkillSupportIds(p.id,[f.supportId]),p.id).toEqual([]);
    }
  });

  it.each(fixtures)("preserves $name selection, manual priorities, budgets and build state through save/export",f=>{
    const p=preset(f.reviewedSkillIds[0]),current=fresh(p.id),selected=setSkillSupport(current,f.supportId,true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const [saved]=normalizeSavedBuilds([{id:"common",name:f.name,createdAt:"test",updatedAt:"test",state:{
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

  it("requires explicit application for new priorities and never adds gem magnitudes as passive-score multipliers",()=>{
    const current=fresh("fireball"),selected=setSkillSupport(current,"cold-attunement",true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(refineSkillPreferencePreset(preset("fireball"),selected.supportGemIds).suggestions).toContainEqual(expect.objectContaining({id:"coldDamage",weight:2}));
    expect(applySkillSupportPriorities(selected,preset("fireball")).preferences).toEqual([...current.preferences,{id:"coldDamage",weight:2}]);
    const line=node("10% increased Cold Damage");
    expect(scorePassiveNode(line,[{id:"coldDamage",weight:2}],selected)).toBe(2);
    expect(passivePreferenceValues(line,selected)).toEqual({coldDamage:10});
    expect(skillSupportPriorityChanges({...fresh("fireball"),supportGemIds:["elemental-focus"]},preset("fireball"))).toEqual([]);
  });

  it.each(["clarity-i","clarity-ii","vitality-i","vitality-ii","meat-shield-i","meat-shield-ii","hulking-minions","minion-splash-ii","heightened-accuracy-i","heightened-accuracy-ii"])
    ("offers %s's scoped optional preference without inventing a numerical score multiplier",id=>{
      const s=support(id),current=setSkillSupport(fresh(s.skillIds[0]),id,true),applied=applySkillSupportPriorities(current,preset(s.skillIds[0]));
      expect(current.preferences).toEqual(fresh(s.skillIds[0]).preferences);
      expect(applied.preferences[0]).toEqual({id:"energyShield",weight:3});
      expect(applied.preferences.length).toBeGreaterThan(current.preferences.length);
    });

  it("keeps elemental prohibition independent of selection order and preserves manual weights",()=>{
    for(const ids of [["cold-attunement","brutality-i"],["brutality-i","cold-attunement"]]){
      const current={...fresh("bonestorm"),supportGemIds:ids,preferences:[{id:"coldDamage" as const,weight:3},{id:"energyShield" as const,weight:1}]};
      expect(refineSkillPreferencePreset(preset("bonestorm"),ids).suggestions.some(s=>s.id==="coldDamage")).toBe(false);
      expect(skillSupportPriorityChanges(current,preset("bonestorm"))).toEqual([]);
      expect(applySkillSupportPriorities(current,preset("bonestorm")).preferences).toEqual(current.preferences);
      expect(reviewedSkillSupportsFor("bonestorm",ids).find(s=>s.id==="cold-attunement")?.summary).toContain("Brutality prohibits");
    }
    const current={...fresh("fireball"),supportGemIds:["elemental-focus"],preferences:[{id:"igniteMagnitude" as const,weight:3}]};
    const refined=refineSkillPreferencePreset(preset("fireball"),current.supportGemIds);
    expect(refined.exclusions.some(e=>e.id==="igniteMagnitude")).toBe(true);
    expect(refined.exclusions.some(e=>e.id==="poisonMagnitude")).toBe(false);
    expect(refined.exclusions.some(e=>e.id==="ailmentChance")).toBe(false);
    expect(applySkillSupportPriorities(current,preset("fireball")).preferences).toEqual(current.preferences);
    for(const id of ["ignite-iii","searing-flame-ii","fire-exposure"]) expect(reviewedSkillSupportsFor("fireball",["elemental-focus",id]).find(s=>s.id===id)?.summary).toContain("cannot supply");
    expect(reviewedSkillSupportsFor("frostbolt",["controlled-destruction","cold-exposure"]).find(s=>s.id==="cold-exposure")?.summary).toContain("cannot supply Cold Exposure");
    expect(refineSkillPreferencePreset(preset("fireball"),["fire-penetration-ii"]).suggestions.some(s=>s.id==="firePenetration")).toBe(false);
    expect(reviewedSkillSupportsFor("fireball",["fire-penetration-ii","fire-exposure"]).find(s=>s.id==="fire-exposure")?.summary).toContain("may still affect applicable Ignite/DoT");
  });

  it("replaces each new tier family without disturbing other links or weights",()=>{
    const groups=new Map<string,typeof fixtures[number][]>();
    for(const f of fixtures){const group=groups.get(f.families[0])??[];group.push(f);groups.set(f.families[0],group);}
    for(const siblings of groups.values())if(siblings.length>1){
      const focus=siblings[0].reviewedSkillIds.find(id=>siblings.every(s=>(s.reviewedSkillIds as readonly string[]).includes(id)));
      if(!focus)continue;
      let current=fresh(focus);
      for(const s of siblings){current=setSkillSupport(current,s.supportId,true);expect(current.supportGemIds).toEqual([s.supportId]);expect(current.preferences).toEqual(fresh(focus).preferences);}
      expect(normalizeSkillSupportIds(focus,siblings.map(s=>s.supportId))).toEqual([siblings[0].supportId]);
    }
    const current=setSkillSupport({...fresh("ice-strike"),supportGemIds:["rapid-attacks-ii","cold-mastery"]},"rapid-attacks-iii",true);
    expect(current.supportGemIds).toEqual(["cold-mastery","rapid-attacks-iii"]);
    for(const id of ["cold-mastery","fire-mastery","lightning-mastery","minion-mastery"])expect(support(id).family).toBe("Mastery");
  });

  it("checks gained Elements and their cross-penalties without assuming net benefit",()=>{
    const base=observed("fireball").player.AverageHit;
    expect(observed("fireball","SupportAddedFireDamagePlayer").player.AverageHit).toBeCloseTo(base*1.25,9);
    expect(observed("fireball","SupportAddedColdDamagePlayer").player.AverageHit).toBeCloseTo(base*(.5+.25),9);
    expect(observed("fireball","SupportAddedLightningDamagePlayer").player.AverageHit).toBeCloseTo(base*(.5+.25),9);
    expect(observed("fireball","SupportAddedColdDamagePlayer",{other:"SupportAddedLightningDamagePlayer"}).player.AverageHit).toBeCloseTo(base*(.25+.125+.125),9);
    expect(observed("fireball","SupportAddedColdDamagePlayer",{other:"SupportBrutalityPlayer"}).player.AverageHit).toBe(0);
    expect(observed("fireball","SupportElementalFocusPlayer").player.AverageHit).toBeCloseTo(base*1.25,9);
  });

  it("checks gem-level changes and costs separately from flat damage multipliers",()=>{
    for(const [focus,id,hit,cost] of [["fireball","SupportFireMasteryPlayer",338.12,115],["frostbolt","SupportColdMasteryPlayer",227.36,65],["arc","SupportLightningMasteryPlayer",251.79,90]] as const){
      expect(observed(focus,id).player).toMatchObject({AverageHit:hit,ManaCost:cost});
      expect(observed(focus,id).player.AverageHit).toBeGreaterThan(observed(focus).player.AverageHit);
    }
    expect(observed("skeletal-arsonist","SupportMinionMasteryPlayer").minion?.Life).toBe(1340);
    expect(observed("skeletal-arsonist","SupportMinionMasteryPlayer").player.SpiritReserved).toBe(38);
  });

  it("distinguishes penetration from resistance ignoring, including negative resistance and DoT",()=>{
    for(const r of [25,-25]){
      const base=observed("fireball","base",{resistance:r}),pen=observed("fireball","SupportFirePenetrationPlayer",{resistance:r}),ignore=observed("fireball","SupportFirePenetrationPlayerTwo",{resistance:r});
      expect(ignore.player.AverageHit).toBe(299.6);
      expect(pen.player.AverageHit).toBe(r===25?299.6:374.5);
      expect(pen.player.IgniteDPS).toBe(base.player.IgniteDPS);
      expect(ignore.player.IgniteDPS).toBe(base.player.IgniteDPS);
      expect(ignore.player.ManaCost).toBe(124);
    }
  });

  it("separates ailment chance, faster delivery, hit penalties and prohibitions",()=>{
    const base=observed("fireball");
    for(const [effect,multiplier] of [["SupportIgnitePlayer",2],["SupportIgnitePlayerTwo",2.5],["SupportIgnitePlayerThree",3]] as const){
      expect(observed("fireball",effect).player.IgniteChance).toBeCloseTo(base.player.IgniteChance*multiplier,10);
      expect(observed("fireball",effect).player.AverageHit).toBe(base.player.AverageHit);
    }
    expect(observed("fireball","SupportIgnitePlayerThree").player.IgniteDuration).toBeCloseTo(4/1.15,10);
    expect(observed("fireball","SupportDeadlyIgnitesPlayer").player.AverageHit).toBeCloseTo(base.player.AverageHit*.75,9);
    expect(observed("fireball","SupportDeadlyIgnitesPlayerTwo").player.AverageHit).toBeCloseTo(base.player.AverageHit*.7,9);
    expect(observed("arc","SupportShockPlayer").player.ShockChance).toBeCloseTo(observed("arc").player.ShockChance*2,10);
    expect(observed("fireball","SupportElementalFocusPlayer",{other:"SupportIgnitePlayerThree"}).player.IgniteChance).toBeUndefined();
    expect(observed("fireball","SupportFireExposurePlayer").player.AverageHit).toBe(base.player.AverageHit);
    expect(constants("freeze")).toContainEqual(["support_hypothermia_hit_damage_freeze_multiplier_+%_final",50]);
  });

  it("checks player recovery sources and reservation without applying them to Minions",()=>{
    const base=observed("berserk");
    expect(observed("berserk","SupportClarityPlayer").player).toMatchObject({ManaRegen:132.1,SpiritReserved:40});
    expect(observed("berserk","SupportClarityPlayerTwo").player).toMatchObject({ManaRegen:152.5,SpiritReserved:50});
    expect(observed("berserk","SupportClarityPlayer").player.ManaRegen).toBeCloseTo(base.player.ManaRegen*1.3,1);
    expect(observed("berserk","SupportVitalityPlayer").player).toMatchObject({LifeRegenPercent:1,LifeRegen:32.9,SpiritReserved:50});
    expect(observed("berserk","SupportVitalityPlayerTwo").player).toMatchObject({LifeRegenPercent:2,LifeRegen:65.7,SpiritReserved:70});
    expect(observed("berserk","SupportVitalityPlayerTwo").player.LifeRegen).toBeCloseTo(base.player.Life*.02,1);
    expect(observed("fireball","SupportArcaneSurgePlayer").player.Speed).toBe(observed("fireball").player.Speed);
    expect(observed("fireball","SupportArcaneSurgePlayer",{arcane:true}).player.Speed).toBeCloseTo(observed("fireball").player.Speed*1.15,10);
  });

  it("does not turn stored uses, resource capacity or configured buffs into sustained frequency",()=>{
    const base=observed("frost-bomb");
    expect(observed("frost-bomb","SupportCooldownRecoveryPlayer").player).toMatchObject({Cooldown:4.818,ManaCost:128});
    expect(observed("frost-bomb","SupportCooldownRecoveryPlayerTwo").player).toMatchObject({Cooldown:4.62,ManaCost:128});
    expect(observed("frost-bomb","SupportSecondWindPlayer").player.Cooldown).toBe(base.player.Cooldown/.5);
    expect(observed("frost-bomb","SupportSecondWindPlayerTwo").player.Cooldown).toBeCloseTo(6/.6,1);
    expect(observed("frost-bomb","SupportSecondWindPlayer").player.StoredUses).toBe(1);
    expect(support("second-wind-iii").summary).toContain("does not implement the extra-use counter");
    expect(constants("energy-retention")).toContainEqual(["trigger_skills_refund_half_energy_spent_chance_%",35]);
    for(const id of ["boundless-energy-i","boundless-energy-ii","energy-capacitor","energy-retention"])expect(support(id).priorities).toEqual([]);
    expect(normalizeSkillSupportIds("cast-on-critical",["second-wind-iii","energy-capacitor","arcane-surge"])).toEqual([]);
    expect(normalizeSkillSupportIds("feral-invocation",["meat-shield-i","minion-mastery","hulking-minions"])).toEqual([]);
  });

  it("keeps Minion protection, levels, splash and capped resistances distinct from player stats",()=>{
    const base=observed("skeletal-arsonist");
    expect(observed("skeletal-arsonist","SupportMeatShieldPlayer").minion?.hit).toBe(97.125);
    expect(observed("skeletal-arsonist","SupportMeatShieldPlayerTwo").minion?.hit).toBe(89.25);
    expect(observed("skeletal-arsonist","SupportHulkingMinionsPlayer").minion?.Life).toBe(1479);
    expect(observed("skeletal-arsonist","SupportHulkingMinionsPlayer").player.SpiritReserved).toBe(51);
    expect(observed("skeletal-arsonist","SupportElementalArmyPlayer").minion).toMatchObject({FireResist:75,ColdResist:30,LightningResist:30,ChaosResist:0});
    expect(observed("skeletal-arsonist","SupportElementalArmyPlayer").player.FireResist).toBe(base.player.FireResist);
    expect(observed("raise-zombie","SupportMinionMeleeSplashPlayerTwo").minion?.hit).toBe(observed("raise-zombie").minion?.hit);
    expect(normalizeSkillSupportIds("sacrifice",["hulking-minions","minion-mastery","elemental-army"])).toEqual([]);
  });

  it("does not turn more Accuracy or Attack Speed into a flat damage bonus or Poison tick rate",()=>{
    const base=observed("lightning-arrow");
    expect(observed("lightning-arrow","SupportHeightenedAccuracyPlayer").player.accuracy).toBe(base.player.accuracy*1.5);
    expect(observed("lightning-arrow","SupportHeightenedAccuracyPlayerTwo").player.HitChance).toBe(100);
    expect(observed("lightning-arrow","SupportRapidAttacksPlayerThree").player.Speed).toBeCloseTo(base.player.Speed*1.35,10);
    expect(observed("lightning-arrow","SupportRapidAttacksPlayerThree").player.hit).toBe(9.45);
    expect(observed("lightning-arrow","SupportRapidAttacksPlayerThree").player.ManaCost).toBe(base.player.ManaCost);
    expect(normalizeSkillSupportIds("contagion",["rapid-attacks-iii","heightened-accuracy-i","cold-attunement"])).toEqual([]);
    expect(normalizeSkillSupportIds("poisonburst-arrow",["cold-attunement","fire-penetration-i","ignite-iii"])).toEqual([]);
    for(const id of ["gas-arrow","vine-arrow","toxic-growth"]) expect(normalizeSkillSupportIds(id,["heightened-accuracy-i","heightened-accuracy-ii"])).toEqual([]);
    expect(normalizeSkillSupportIds("poisonburst-arrow",["heightened-accuracy-i"])).toEqual(["heightened-accuracy-i"]);
  });

  it("scores new optional hit preferences within the same budget while keeping Shortest unchanged",()=>{
    const graph:TreeGraph={schemaVersion:1,gameVersion:"test",extractedAt:"test",source:{kind:"fixture",path:"test"},nodes:Object.fromEntries(
      ["start","plain","good","bridge","goal"].map(id=>[id,{...node(...(id==="good"?["20% increased Cold Damage"]:[])),id,flags:id==="start"?{classStart:true}:{}}])),
      edges:[["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]].map(([from,to])=>({from,to})),groups:{},classStarts:{witch:"start"},bounds:{minX:0,minY:0,maxX:100,maxY:100}};
    const settings=applySkillSupportPriorities(setSkillSupport({...fresh("fireball"),preferences:[]},"cold-attunement",true),preset("fireball"));
    const request={...settings,mode:"weighted" as const,extraPointBudget:1,graph,baseNodeIds:["start"],baseEdgeKeys:[],goalNodeIds:["goal"]};
    const result=optimizeWeightedBuildGoals(request,undefined,{maxIterations:8});
    expect(result).toMatchObject({status:"success",pointCost:3,weighted:{score:4}});
    expect(result.totalNodeIds).toContain("good");
    const shortest={...request,mode:"shortest" as const};
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { proxyDebuffSupportFixtures as fixtures,proxyDebuffNativeObservations,proxyDebuffProhibitionObservations,proxyDebuffWording,proxyDebuff45Ids,proxyDebuff45SupportIdsFor } from "./proxyDebuffSupportBatch.fixtures";
import { proxyDebuffSkillSupports } from "./proxyDebuffSupportBatch";
import { getSkillPreferencePreset,skillPreferencePresets } from "./skillPreferencePresets";
import { reviewedSkillSupports,reviewedSkillSupportsFor,normalizeSkillSupportIds,setSkillSupport,applySkillSupportPriorities,refineSkillPreferencePreset } from "./skillSupportPreferences";
import { passivePreferenceValues,scorePassiveNode,normalizePassiveOptimizationSettings,type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport,serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeWeightedBuildGoals,runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import type { TreeGraph,TreeNode } from "./types";

type Observation={focus:string;support:string;other?:string;options:Record<string,unknown>;player:Record<string,number>;minion?:Record<string,number>;effects:{effect:string;supports:string[]}[]};
const native=proxyDebuffNativeObservations as unknown as Observation[];
const observed=(focus:string,support="base",options:Record<string,unknown>={},other?:string)=>native.find(n=>n.focus===focus&&n.support===support&&n.other===other&&JSON.stringify(n.options)===JSON.stringify(Object.keys(options).length?options:[]))!;
const support=(id:string)=>reviewedSkillSupports.find(s=>s.id===id)!;
const preset=(id:string)=>getSkillPreferencePreset(id)!;
const fresh=(id:string):PassiveOptimizationSettings=>({mode:"weighted",extraPointBudget:7,pointBudgetMode:"all-available",focusSkillId:id,preferences:[{id:"energyShield",weight:3}]});
const node=(...stats:string[]):TreeNode=>({id:"test",flags:{},stats,position:{x:0,y:0}});
const constants=(id:string):readonly (readonly (string|number)[])[]=>{
  const set=fixtures.find(f=>f.supportId===id)!.sets[0];return "constants" in set ? set.constants : [];
};

describe("45 proxy and debuff support variants",()=>{
  it("adds exactly 45 positive-tier variants and 302 explicit component-reviewed pairs",()=>{
    expect(proxyDebuffSkillSupports).toHaveLength(45);
    expect(reviewedSkillSupports).toHaveLength(452);
    expect(new Set(proxyDebuffSkillSupports.map(s=>s.effectId)).size).toBe(45);
    expect(proxyDebuffSkillSupports.reduce((n,s)=>n+s.skillIds.length,0)).toBe(302);
    for(const p of skillPreferencePresets)expect(reviewedSkillSupportsFor(p.id).filter(s=>proxyDebuff45Ids.has(s.id)).map(s=>s.id)).toEqual(proxyDebuff45SupportIdsFor(p.id));
    const catalog=JSON.parse(readFileSync(new URL("../../tools/coverage/catalog.json",import.meta.url),"utf8"));
    expect(fixtures.every(f=>catalog.entries.some((g:{effectId:string;tier:number})=>g.effectId===f.effectId&&g.tier>0))).toBe(true);
  });

  it.each(fixtures)("pins $name identity, source family and complete positive/negative reviewed scopes",f=>{
    const s=support(f.supportId);
    expect(s).toMatchObject({name:f.name,effectId:f.effectId,family:f.families[0],skillIds:[...f.reviewedSkillIds]});
    expect(s.summary.length).toBeGreaterThan(100);
    expect(s.sourceUrl).toMatch(/sup_\w+\.lua#L\d+$/);
    for(const id of f.reviewedSkillIds){
      expect((f.legal as readonly string[]).includes(id),f.name+"/"+id).toBe(true);
      expect(getSkillPreferencePreset(id)).toBeDefined();
      expect(normalizeSkillSupportIds(id,[f.supportId])).toEqual([f.supportId]);
    }
    for(const p of skillPreferencePresets)if(!(f.reviewedSkillIds as readonly string[]).includes(p.id))expect(normalizeSkillSupportIds(p.id,[f.supportId]),p.id).toEqual([]);
  });

  it.each(fixtures)("pins an accepted native link for $name without asserting complete effect simulation",f=>{
    const row=native.find(n=>n.support===f.effectId&&!n.other)!;
    expect(row).toBeDefined();
    expect(row.effects.some(e=>e.supports.includes(f.effectId))).toBe(true);
  });

  it.each(fixtures)("roundtrips $name without altering manual settings, goals, base allocation or W1/W2",f=>{
    const current=fresh(f.reviewedSkillIds[0]),selected=setSkillSupport(current,f.supportId,true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const [saved]=normalizeSavedBuilds([{id:"proxy-debuff",name:f.name,createdAt:"test",updatedAt:"test",state:{
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

  it("preserves native family replacement, including the two different Font names",()=>{
    expect(normalizeSkillSupportIds("shockwave-totem",["font-of-blood","font-of-mana"])).toEqual(["font-of-blood"]);
    expect(setSkillSupport({...fresh("shockwave-totem"),supportGemIds:["font-of-blood"]},"font-of-mana",true).supportGemIds).toEqual(["font-of-mana"]);
    expect(normalizeSkillSupportIds("skeletal-arsonist",["bidding-iii","bidding-ii","bidding-i"])).toEqual(["bidding-iii"]);
    expect(setSkillSupport({...fresh("shockwave-totem"),supportGemIds:["splinter-totem-i"]},"splinter-totem-ii",true).supportGemIds).toEqual(["splinter-totem-ii"]);
  });

  it("keeps Command bonuses distinct from basic attacks and Tier III free of a damage suggestion",()=>{
    expect(constants("bidding-iii")).toEqual([["minion_command_skill_cooldown_speed_+%",80]]);
    expect(support("bidding-iii").priorities.map(p=>p.id)).toEqual(["minionCommandCooldownRecovery"]);
    expect(support("bidding-ii").priorities.map(p=>p.id)).toEqual(["minionCommandDamage","minionCommandCooldownRecovery"]);
    for(const effect of ["SupportBiddingPlayer","SupportBiddingPlayerTwo","SupportBiddingPlayerThree"])
      expect(observed("skeletal-arsonist",effect).minion?.hit).toBe(observed("skeletal-arsonist").minion?.hit);
    expect(normalizeSkillSupportIds("skeletal-cleric",["bidding-i"])).toEqual([]);
  });

  it("requires explicit priority Apply, preserves unrelated weights and never inserts support multipliers",()=>{
    const selected=setSkillSupport(fresh("shockwave-totem"),"hardy-totems-ii",true);
    expect(selected.preferences).toEqual(fresh("shockwave-totem").preferences);
    expect(applySkillSupportPriorities(selected,preset("shockwave-totem")).preferences).toEqual([...selected.preferences,{id:"totemLife",weight:2}]);
    expect(scorePassiveNode(node("20% increased Totem Life"),[{id:"totemLife",weight:2}],selected)).toBe(4);
    expect(passivePreferenceValues(node("20% increased Totem Life"),selected)).toEqual({totemLife:20});
    expect(setSkillSupport(selected,"hardy-totems-ii",false).preferences).toEqual(selected.preferences);
  });

  it("separates Minion explosion/Ignite sources from basic attacks and respects Fire resistance caps",()=>{
    const base=observed("skeletal-arsonist");
    expect(constants("infernal-legion-i")).toContainEqual(["minion_fire_damage_%_of_maximum_life_taken_per_minute",600]);
    expect(600/60).toBe(10);
    expect(constants("infernal-legion-i")).toContainEqual(["support_minions_ignite_for_%_max_life",10]);
    expect(observed("skeletal-arsonist","SupportInfernalLegionPlayerTwo").minion?.FireResist).toBe(base.minion!.FireResist+20);
    expect(observed("skeletal-arsonist","SupportInfernalLegionPlayerTwo",{mods:"Minions have +80% to Fire Resistance"}).minion?.FireResist).toBe(75);
    expect(observed("skeletal-arsonist","SupportMinionInstabilityPlayer",{mods:"Minions have 20% increased maximum Life"}).minion?.Life).toBe(1479);
    for(const id of ["minion-instability","infernal-legion-i","infernal-legion-ii"]){
      expect(support(id).priorities.some(p=>p.id==="minionDamage"||p.id==="fireDamage"||p.id==="igniteMagnitude")).toBe(false);
      expect(support(id).summary).toMatch(/separate|not|Not/);
    }
    const combo=reviewedSkillSupportsFor("skeletal-arsonist",["minion-instability","infernal-legion-ii"]);
    expect(combo.find(s=>s.id==="minion-instability")?.summary).toContain("does not guarantee");
  });

  it("keeps revival, variety, grace windows and death recovery conditional and recipient-specific",()=>{
    expect(observed("skeletal-arsonist","SupportCrazedMinionsPlayer").minion?.hit).toBe(observed("skeletal-arsonist").minion?.hit);
    expect(constants("last-gasp")).toEqual([["support_last_gasp_duration_ms",4000]]);
    for(const id of ["last-gasp","crazed-minions","deathmarch","muster","sacrificial-lamb-i","sacrificial-lamb-ii"])expect(support(id).priorities).toEqual([]);
    expect(support("muster").summary).toContain("not per individual Minion or Wolf");
    expect(support("deathmarch").summary).toContain("dying Minion");
    expect(support("deathmarch").summary).toContain("Not player healing");
    expect(normalizeSkillSupportIds("raging-spirits",["crazed-minions","last-gasp","essence-harvest"])).toEqual([]);
    expect(normalizeSkillSupportIds("grim-feast",["crazed-minions","deathmarch"])).toEqual([]);
  });

  it("treats Minion Pact as a full self-use Life drain requirement, not damage to all Minions",()=>{
    expect(constants("minion-pact-ii")).toContainEqual(["support_minion_pact_user_life_%_removed_from_nearby_minion",150]);
    for(const id of ["minion-pact-i","minion-pact-ii"])expect(support(id).priorities).toEqual([]);
    expect(observed("fireball","SupportMinionPactPlayerTwo").player.AverageHit).toBe(observed("fireball").player.AverageHit);
    expect(normalizeSkillSupportIds("shockwave-totem",["minion-pact-i"])).toEqual([]);
    expect(normalizeSkillSupportIds("skeletal-arsonist",["minion-pact-i"])).toEqual([]);
    expect(support("minion-pact-i").summary).toContain("raising player maximum Life");
  });

  it("retains Loyalty's Life penalty and hit-only protection without inventing a captured beast",()=>{
    const base=observed("wolf-pack");
    expect(observed("wolf-pack","SupportLoyaltyPlayer").minion?.Life).toBe(Math.floor(base.minion!.Life*.7));
    expect(observed("wolf-pack","SupportLoyaltyPlayer").minion?.hit).toBe(base.minion?.hit);
    expect(observed("wolf-pack","SupportLoyaltyPlayer").player.Life).toBe(base.player.Life);
    expect(support("loyalty").summary).toContain("damage over time");
    expect(normalizeSkillSupportIds("tame-beast",["loyalty","minion-instability"])).toEqual([]);
  });

  it("checks Totem Life and reciprocal placement timing independently",()=>{
    const base=observed("shockwave-totem").player;
    expect(observed("shockwave-totem","SupportHardyTotemsPlayer").player.TotemLife).toBe(base.TotemLife*1.4);
    expect(observed("shockwave-totem","SupportHardyTotemsPlayerTwo").player.TotemLife).toBe(base.TotemLife*1.5);
    expect(observed("shockwave-totem","SupportHardyTotemsPlayerTwo",{mods:"20% increased Totem Life"}).player.TotemLife).toBe(base.TotemLife*1.2*1.5);
    expect(observed("shockwave-totem","SupportHardyTotemsPlayerTwo").player.ManaCost).toBe(Math.floor(base.ManaCost*1.1));
    expect(observed("shockwave-totem","SupportUrgentTotemsPlayer").player.TotemPlacementTime).toBeCloseTo(base.TotemPlacementTime/1.8,10);
    expect(observed("shockwave-totem","SupportUrgentTotemsPlayerTwo").player.TotemPlacementTime).toBeCloseTo(base.TotemPlacementTime/2,10);
    expect(observed("shockwave-totem","SupportUrgentTotemsPlayerThree").player.TotemPlacementTime).toBeCloseTo(base.TotemPlacementTime/2,10);
    expect(support("urgent-totems-iii").priorities.map(p=>p.id)).toEqual(["totemPlacementSpeed"]);
    expect(reviewedSkillSupportsFor("dark-effigy").find(s=>s.id==="urgent-totems-iii")?.priorities.map(p=>p.id)).toEqual(["totemPlacementSpeed","totemCastSpeed"]);
    expect(reviewedSkillSupportsFor("shockwave-totem").find(s=>s.id==="urgent-totems-iii")?.priorities.map(p=>p.id)).toEqual(["totemPlacementSpeed","totemAttackSpeed"]);
    expect(refineSkillPreferencePreset(preset("spell-totem"),["urgent-totems-iii"]).suggestions.map(s=>s.id)).toEqual(["totemPlacementSpeed"]);
  });

  it("keeps ordinary and maximum Totem resistance separate and identifies incomplete native support display",()=>{
    expect(constants("reinforced-totems-ii")).toContainEqual(["totem_maximum_all_elemental_resistances_%",10]);
    expect(observed("shockwave-totem","base",{mods:"Totems gain +80% to all Elemental Resistances"}).player.TotemFireResist).toBe(75);
    expect(observed("shockwave-totem","SupportReinforcedTotemsPlayerTwo",{mods:"Totems gain +150% to all Elemental Resistances\nTotems gain +100% to all Maximum Elemental Resistances"}).player.TotemFireResist).toBe(90);
    expect(observed("shockwave-totem","SupportReinforcedTotemsPlayerTwo").player.TotemFireResist).toBe(observed("shockwave-totem").player.TotemFireResist);
    expect(support("reinforced-totems-ii").summary).toContain("coverage is incomplete");
    expect(support("reinforced-totems-ii").priorities).toHaveLength(6);
  });

  it("does not multiply splinter counts or misread Font leech as regeneration or personal attack leech",()=>{
    const base=observed("shockwave-totem").player;
    for(const id of ["splinter-totem-i","splinter-totem-ii","font-of-blood","font-of-mana"])expect(support(id).priorities).toEqual([]);
    expect(observed("shockwave-totem","SupportSplinteringTotemPlayerTwo").player.ActiveTotemLimit).toBe(1);
    expect(observed("shockwave-totem","SupportBloodFountainPlayer").player.LifeRegen).toBe(base.LifeRegen);
    expect(observed("shockwave-totem","SupportManaFountainPlayer").player.ManaRegen).toBe(base.ManaRegen);
    expect(constants("font-of-blood")).toContainEqual(["allies_in_font_of_blood_radius_leech_%_of_my_physical_damage_as_life",12]);
    expect(support("font-of-blood").summary).toContain("dealt by the supported Totem");
    expect(support("font-of-blood").summary).toContain("Not regeneration");
  });

  it("checks outgoing Curse effect, costs and aura reservation without a final-damage multiplier",()=>{
    expect(observed("despair","SupportCurseEffectPlayer").player.CurseEffectMod).toBe(1.25);
    expect(observed("despair","SupportCurseEffectPlayer",{mods:"20% increased Curse Magnitudes"}).player.CurseEffectMod).toBe(1+.25+.2);
    expect(observed("despair","SupportCurseEffectPlayer").player.ManaCost).toBe(Math.floor(178*1.4));
    expect(observed("blasphemy","SupportCurseEffectPlayer").player.SpiritReserved).toBe(observed("blasphemy").player.SpiritReserved*1.4);
    expect(support("heightened-curse").priorities.map(p=>p.id)).toEqual(["curseMagnitude"]);
    expect(support("heightened-curse").summary).toContain("not 25% more final damage");
  });

  it("separates charge-dependent Curse duration, ground occupancy and triggered child damage",()=>{
    for(const id of ["hex-bloom","cursed-ground","decaying-hex","impending-doom"])expect(support(id).priorities).toEqual([]);
    expect(observed("despair","SupportAbidingHexPlayer").player.Duration).toBe(observed("despair").player.Duration);
    expect(observed("despair","SupportDecayingHexPlayer").player.TotalDot).toBe(0);
    expect(support("decaying-hex").summary).toContain("separate Profane Decay");
    const selected=["impending-doom","abiding-hex"],rows=reviewedSkillSupportsFor("despair",selected);
    expect(rows.find(s=>s.id==="impending-doom")?.summary).toContain("can delay");
    expect(reviewedSkillSupportsFor("despair",["impending-doom","cursed-ground"]).find(s=>s.id==="impending-doom")?.summary).toContain("does not establish Curse expiry");
    expect(normalizeSkillSupportIds("blasphemy",["impending-doom","abiding-hex","cursed-ground","decaying-hex"])).toEqual([]);
  });

  it("retains Offering resource requirements and does not turn recipient stats into buff strength",()=>{
    for(const id of ["danse-macabre","sacrificial-offering"])expect(support(id).priorities).toEqual([]);
    expect(observed("pain-offering","SupportSacrificalOfferingPlayer").player.AverageHit).toBe(0);
    expect(support("danse-macabre").summary).toContain("only if that extra target exists");
    expect(support("sacrificial-offering").summary).toContain("sacrifices 15% of your Life");
    expect(reviewedSkillSupportsFor("soul-offering",["danse-macabre","sacrificial-offering"]).find(s=>s.id==="danse-macabre")?.summary).toContain("15% player Life sacrifice");
  });

  it("does not assume corpses, Mark activation, Fully Broken Armour, leech or sustained recoup",()=>{
    for(const id of ["profanity-i","profanity-ii","corpse-conservation","charged-mark","eternal-mark","mark-for-death","mark-for-death-ii","mark-of-siphoning","mark-of-siphoning-ii"])expect(support(id).priorities).toEqual([]);
    expect(observed("essence-drain","SupportProfanityPlayerTwo").player.AverageHit).toBe(observed("essence-drain").player.AverageHit);
    expect(observed("snipers-mark","SupportMarkOfSiphoningPlayerTwo").player.ManaLeechRate).toBe(0);
    expect(800/100).toBe(8);
    expect(support("mark-of-siphoning-ii").summary).toContain("8% Life and Mana leech, not 800%");
    expect(observed("skeletal-arsonist","SupportEssenceHarvestPlayer").player).toMatchObject({SpiritReserved:43,ManaRecoup:0,ManaRegen:101.6});
    expect(support("essence-harvest").priorities.map(p=>p.id)).toEqual(["minionReservationEfficiency"]);
    expect(support("essence-harvest").summary).toContain("Not damage-taken Mana Recoup");
    expect(normalizeSkillSupportIds("rhoa-mount",["essence-harvest"])).toEqual([]);
    expect(proxyDebuffWording.find(w=>w.name==="Font of Mana")?.wording[0].text[0]).toContain("Physical Damage dealt by Supported Totem");
  });

  it("offers Slow Magnitude only for reviewed intrinsic slows, not hypothetical quality or Poison damage",()=>{
    expect(support("slow-potency").skillIds).toEqual(["temporal-chains","entangle","vine-arrow"]);
    expect(normalizeSkillSupportIds("briarpatch",["slow-potency"])).toEqual([]);
    expect(normalizeSkillSupportIds("poisonburst-arrow",["slow-potency"])).toEqual([]);
    expect(support("slow-potency").priorities.map(p=>p.id)).toEqual(["slowMagnitude"]);
  });

  it.each(["minion-instability","infernal-legion-i","infernal-legion-ii","profanity-i","profanity-ii"])
    ("keeps Brutality's prohibition effective for %s in either link order without deleting manual weights",id=>{
      const focus=id.startsWith("profanity")?"gas-arrow":"wolf-pack";
      for(const ids of [[id,"brutality-i"],["brutality-i",id]]){
        const current={...fresh(focus),supportGemIds:ids,preferences:[{id:"minionLife" as const,weight:3},{id:"chaosDamage" as const,weight:3}]};
        expect(normalizeSkillSupportIds(focus,ids)).toEqual(ids);
        const s=reviewedSkillSupportsFor(focus,ids).find(s=>s.id===id)!;
        expect(s.summary).toContain("Brutality is selected");
        expect(s.priorities.map(p=>p.id)).toEqual(id.startsWith("infernal-legion")?["minionFireResistance"]:[]);
        expect(applySkillSupportPriorities(current,preset(focus)).preferences.slice(0,2)).toEqual(current.preferences);
      }
    });

  it("pins outgoing prohibition flags without treating incoming self-damage as prohibited",()=>{
    for(const row of proxyDebuffProhibitionObservations){
      const actor="minion" in row?row.minion:row.player;
      expect(actor.dealNoFire).toBe(true);
      expect(actor.dealNoChaos).toBe(true);
    }
    expect(reviewedSkillSupportsFor("wolf-pack",["infernal-legion-ii","brutality-i"]).find(s=>s.id==="infernal-legion-ii")?.summary).toContain("self-Fire damage");
  });

  it("routes toward optional Totem Life within the extra-point budget while leaving Shortest unchanged",()=>{
    const graph:TreeGraph={schemaVersion:1,gameVersion:"test",extractedAt:"test",source:{kind:"fixture",path:"test"},nodes:Object.fromEntries(
      ["start","plain","good","bridge","goal"].map(id=>[id,{...node(...(id==="good"?["20% increased Totem Life"]:[])),id,flags:id==="start"?{classStart:true}:{}}])),
      edges:[["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]].map(([from,to])=>({from,to})),groups:{},classStarts:{witch:"start"},bounds:{minX:0,minY:0,maxX:100,maxY:100}};
    const settings=applySkillSupportPriorities(setSkillSupport({...fresh("shockwave-totem"),preferences:[]},"hardy-totems-ii",true),preset("shockwave-totem"));
    const request={...settings,mode:"weighted" as const,extraPointBudget:1,graph,baseNodeIds:["start"],baseEdgeKeys:[],goalNodeIds:["goal"]};
    expect(optimizeWeightedBuildGoals(request,undefined,{maxIterations:8})).toMatchObject({status:"success",pointCost:3,weighted:{score:4}});
    const shortest={...request,mode:"shortest" as const};
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { physicalSupportFixtures as fixtures,physicalNativeObservations,physicalSupportWording,physicalChildObservations,physical50Ids,physical50SupportIdsFor } from "./physicalSupportBatch.fixtures";
import { physicalSkillSupports } from "./physicalSupportBatch";
import { getSkillPreferencePreset,skillPreferencePresets } from "./skillPreferencePresets";
import { reviewedSkillSupports,reviewedSkillSupportsFor,normalizeSkillSupportIds,setSkillSupport,applySkillSupportPriorities,refineSkillPreferencePreset } from "./skillSupportPreferences";
import { passivePreferenceValues,scorePassiveNode,normalizePassiveOptimizationSettings,type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport,serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeWeightedBuildGoals,runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import type { TreeGraph,TreeNode } from "./types";

type Observation={focus:string;support:string;other?:string;options:Record<string,unknown>;player:Record<string,number>&{flags:Record<string,boolean>};effects:{effect:string;supports:string[]}[]};
const native=physicalNativeObservations as unknown as Observation[];
const observed=(focus:string,support="base",options:Record<string,unknown>={},other?:string)=>native.find(n=>n.focus===focus&&n.support===support&&n.other===other&&JSON.stringify(n.options)===JSON.stringify(Object.keys(options).length?options:[]))!;
const support=(id:string)=>reviewedSkillSupports.find(s=>s.id===id)!;
const resolved=(focus:string,id:string,ids:string[])=>reviewedSkillSupportsFor(focus,ids).find(s=>s.id===id)!;
const preset=(id:string)=>getSkillPreferencePreset(id)!;
const fresh=(id:string):PassiveOptimizationSettings=>({mode:"weighted",extraPointBudget:7,pointBudgetMode:"all-available",focusSkillId:id,preferences:[{id:"energyShield",weight:3}]});
const node=(...stats:string[]):TreeNode=>({id:"test",flags:{},stats,position:{x:0,y:0}});
const constants=(id:string):readonly (readonly (string|number)[])[]=>{
  const set=fixtures.find(f=>f.supportId===id)!.sets[0];return "constants" in set ? set.constants : [];
};

describe("50 Physical, weapon and positional support variants",()=>{
  it("adds exactly 50 positive-tier variants and 1595 explicit component-reviewed pairs",()=>{
    expect(physicalSkillSupports).toHaveLength(50);
    expect(reviewedSkillSupports).toHaveLength(452);
    expect(new Set(reviewedSkillSupports.map(s=>s.effectId)).size).toBe(452);
    expect(physicalSkillSupports.reduce((n,s)=>n+s.skillIds.length,0)).toBe(1595);
    for(const p of skillPreferencePresets)expect(reviewedSkillSupportsFor(p.id).filter(s=>physical50Ids.has(s.id)).map(s=>s.id)).toEqual(physical50SupportIdsFor(p.id));
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
    const [saved]=normalizeSavedBuilds([{id:"physical",name:f.name,createdAt:"test",updatedAt:"test",state:{
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

  it("respects source-family replacement with existing supports",()=>{
    expect(normalizeSkillSupportIds("poisonburst-arrow",["bleed-iii","bleed-iv"])).toEqual(["bleed-iii"]);
    expect(setSkillSupport({...fresh("poisonburst-arrow"),supportGemIds:["bleed-iii"]},"bleed-iv",true).supportGemIds).toEqual(["bleed-iv"]);
    expect(normalizeSkillSupportIds("poisonburst-arrow",["projectile-acceleration-i"])).toEqual(["projectile-acceleration-i"]);
    expect(setSkillSupport({...fresh("poisonburst-arrow"),supportGemIds:["projectile-acceleration-i"]},"projectile-deceleration-ii",true).supportGemIds).toEqual(["projectile-deceleration-ii"]);
    expect(setSkillSupport({...fresh("rolling-slam"),supportGemIds:["aftershock-i"]},"tectonic-slams",true).supportGemIds).toEqual(["tectonic-slams"]);
    expect(setSkillSupport({...fresh("rolling-slam"),supportGemIds:["magnified-area-i"]},"overreach",true).supportGemIds).toEqual(["overreach"]);
  });

  it("applies only listed optional priorities and never inserts gem damage multipliers",()=>{
    const selected=setSkillSupport(fresh("fireball"),"knockback",true),applied=applySkillSupportPriorities(selected,preset("fireball"));
    expect(selected.preferences).toEqual(fresh("fireball").preferences);
    expect(applied.preferences).toEqual([...selected.preferences,{id:"knockbackDistance",weight:2}]);
    expect(passivePreferenceValues(node("20% increased Knockback Distance"),selected)).toEqual({knockbackDistance:20});
    expect(scorePassiveNode(node("20% increased Knockback Distance"),[{id:"knockbackDistance",weight:2}],selected)).toBe(4);
    expect(applied.extraPointBudget).toBe(7);
    expect(setSkillSupport(applied,"knockback",false).preferences).toEqual(applied.preferences);
  });

  it("keeps Thorns retaliation, empowered-contact counts and separate children distinct",()=>{
    expect(constants("barbs-i")).toEqual([["deal_thorns_damage_on_hit_for_X_hits_after_thorns_trigger",4]]);
    expect(constants("barbs-ii")).toEqual([["deal_thorns_damage_on_hit_for_X_hits_after_thorns_trigger",6]]);
    expect(constants("barbs-iii")).toEqual([["deal_thorns_damage_twice_on_hit_for_X_hits_after_thorns_trigger",1]]);
    expect(constants("quill-burst")).toEqual([["trigger_spiked_gauntlets_for_X_hits_after_thorns_trigger",3]]);
    for(const id of ["barbs-i","barbs-ii","barbs-iii","quill-burst"])expect(support(id).priorities).toEqual([]);
    expect(observed("ice-strike","SupportBarbsPlayerThree",{mods:"+100 to Thorns"}).player.hit).toBe(observed("ice-strike").player.hit);
    expect(observed("ice-strike","SupportQuillburstPlayer",{mods:"+100 to Thorns"}).effects.some(e=>e.effect==="TriggeredQuillburstPlayer")).toBe(true);
    expect(normalizeSkillSupportIds("lightning-arrow",["quill-burst","barbs-i"])).toEqual([]);
  });

  it("keeps Bleed IV's conditional Melee Physical bonus separate from Bleeding and Poison",()=>{
    expect(observed("ice-strike","SupportBleedPlayerFour").player.flags.CannotBleed).toBe(true);
    expect(observed("ice-strike","SupportBleedPlayerFour",{conditionEnemyBleeding:true}).player.hit).toBe(29.15);
    expect(observed("ice-strike","SupportBleedPlayerFour").player.hit).toBe(observed("ice-strike").player.hit);
    expect(support("bleed-iv").exclusions?.map(s=>s.id)).toEqual(["bleedingChance","bleedingMagnitude","bleedingDuration"]);
    expect(support("bleed-iv").priorities).toEqual([]);
    expect(resolved("gas-arrow","bleed-iv",["bleed-iv"]).summary).toContain("Projectile/Poison");
  });

  it("keeps external Bleeding consumption separate from applying it and preserves manual weights",()=>{
    for(const ids of [["haemocrystals","bleed-iii"],["bleed-iii","haemocrystals"]]){
      expect(normalizeSkillSupportIds("poisonburst-arrow",ids)).toEqual(ids);
      expect(resolved("poisonburst-arrow","bleed-iii",ids).summary).toContain("prevent this skill");
      expect(refineSkillPreferencePreset(preset("poisonburst-arrow"),ids).suggestions.some(s=>s.id==="bleedingMagnitude")).toBe(false);
      const current={...fresh("poisonburst-arrow"),supportGemIds:ids,preferences:[{id:"bleedingMagnitude" as const,weight:3}]};
      expect(applySkillSupportPriorities(current,preset("poisonburst-arrow")).preferences).toEqual(current.preferences);
    }
    expect(native[59].player.flags.CannotBleed).toBe(true);
    expect(constants("haemocrystals")).toContainEqual(["support_haemocrystals_maximum_allowed_crystals",20]);
    expect(normalizeSkillSupportIds("blood-hunt",["haemocrystals"])).toEqual([]);
    expect(resolved("poisonburst-arrow","incision",["incision","haemocrystals"]).summary).toContain("consumption event");
  });

  it("retains Malady's separate swapped Poison chance warning rather than restoring Bleeding",()=>{
    const ids=["haemocrystals","bleed-iii","malady"];
    expect(normalizeSkillSupportIds("poisonburst-arrow",ids)).toEqual(ids);
    const s=resolved("poisonburst-arrow","bleed-iii",ids);
    expect(s.summary).toContain("swapped on-hit Poison chance");
    expect(s.summary).toContain("does not restore Bleeding");
    expect(s.summary).toContain("base Poison chance instead");
  });

  it("pins Incision's bounded magnitude without inventing consumed stacks or own application",()=>{
    expect(constants("incision")).toContainEqual(["support_incision_bleeding_effect_+%_final_per_incision_consumed_recently_up_to_30%",3]);
    expect(support("incision").summary).toContain("capped at 30%");
    expect(support("incision").priorities).toEqual([]);
    expect(native[58].player.flags.CannotBleed).toBe(true);
    expect(support("impale").summary).toContain("cannot Extract");
    expect(observed("ice-strike","SupportImpalePlayer").player.ImpaleChance).toBe(0);
    expect(support("impale").priorities).toEqual([]);
  });

  it("makes Bone Shrapnel's Pin prohibition win without restoring Pin's lost Stun",()=>{
    for(const ids of [["bone-shrapnel","pin-i"],["pin-i","bone-shrapnel"]]){
      expect(resolved("poisonburst-arrow","pin-i",ids).summary).toContain("still prevents Stun");
      expect(refineSkillPreferencePreset(preset("poisonburst-arrow"),ids).suggestions.some(s=>s.id==="pinBuildup")).toBe(false);
    }
    expect(native[61].player.flags).toMatchObject({CannotPin:true,CannotStun:true});
    expect(native[61].effects.some(e=>e.effect==="TriggeredBoneShrapnelPlayer")).toBe(true);
    expect(support("bone-shrapnel").priorities).toEqual([]);
  });

  it("requires own Heavy Stun for Enduring Impact and keeps Unique/non-Unique rewards separate",()=>{
    expect(constants("enduring-impact-i")).toContainEqual(["chance_to_gain_endurance_charge_on_heavy_stunning_non_unique_enemy_%",30]);
    expect(constants("enduring-impact-ii")).toContainEqual(["gain_x_endurance_charges_on_heavy_stunning_unique_enemy",3]);
    for(const ids of [["enduring-impact-ii","pin-i"],["pin-i","enduring-impact-ii"]]){
      expect(resolved("poisonburst-arrow","enduring-impact-ii",ids).priorities).toEqual([]);
      expect(resolved("poisonburst-arrow","enduring-impact-ii",ids).summary).toContain("not this skill causing Heavy Stun");
    }
    expect(native[62].player.flags.CannotStun).toBe(true);
  });

  it("keeps Rip's increased regeneration, collection, time windows and Tear's reward chance separate",()=>{
    expect(constants("rip")).toContainEqual(["rip_support_life_regeneration_rate_+%",10]);
    expect(support("rip").summary).toContain("1.5 metres");
    expect(support("rip").summary).toContain("capped at 100%");
    expect(physicalSupportWording.find(w=>w.name==="Rip")?.wording[0].text[0]).toContain("maximum of 100%");
    expect(observed("ice-strike","SupportRipPlayer").player.LifeRegen).toBe(observed("ice-strike").player.LifeRegen);
    expect(support("rip").priorities).toEqual([]);
    expect(support("tear").priorities).toEqual([]);
    expect(support("tear").summary).toContain("Not double damage");
  });

  it("checks Excise's more-critical chance and real cooldown without claiming sustained DPS",()=>{
    expect(observed("fireball","SupportExcisePlayer").player.CritChance).toBeCloseTo(observed("fireball").player.CritChance*1.4,10);
    expect(observed("fireball","SupportExcisePlayer").player.Cooldown).toBe(8.019);
    expect(observed("fireball","SupportExcisePlayer").player.ManaCost).toBe(observed("fireball").player.ManaCost);
    expect(native[63].player.flags.NeverCrit).toBe(true);
    expect(resolved("fireball","excise",["excise","controlled-destruction"]).priorities.map(p=>p.id)).toEqual(["cooldownRecoveryRate"]);
    expect(normalizeSkillSupportIds("frost-bomb",["excise"])).toEqual([]);
    expect(native[66].player.Cooldown).toBeGreaterThan(observed("fireball","SupportExcisePlayer").player.Cooldown);
  });

  it("does not assume completed Final Strikes or generic hit-based full Armour Break",()=>{
    expect(support("rending-apex").skillIds).toEqual(["ice-strike","tempest-flurry","shred","primal-strikes"]);
    expect(constants("rending-apex")).toEqual([["final_strike_attack_damage_%_dealt_as_armour_break",75]]);
    expect(support("rending-apex").summary).toContain("not only Physical damage");
    expect(normalizeSkillSupportIds("boneshatter",["rending-apex"])).toEqual([]);
    expect(support("rending-apex").priorities.map(p=>p.id)).toEqual(["armourBreakAmount"]);
  });

  it("keeps delayed Brambles, branched fissure penalties and Entangle vines separate",()=>{
    expect(constants("brambleslam")).toEqual([["create_X_briar_thorns_on_slam",3]]);
    expect(support("brambleslam").priorities).toEqual([]);
    expect(constants("branching-fissures-i")).toContainEqual(["branching_fissure_damage_+%_final",-40]);
    expect(constants("branching-fissures-ii")).toContainEqual(["branching_fissure_damage_+%_final",-30]);
    expect(observed("entangle","SupportBranchingFissuresPlayer").player.AverageHit).toBe(observed("entangle").player.AverageHit);
    expect(observed("entangle","SupportBranchingFissuresPlayer").player.ManaCost).toBe(Math.floor(observed("entangle").player.ManaCost*1.2));
    expect(support("branching-fissures-i").summary).toContain("attached vines");
    expect(normalizeSkillSupportIds("shockwave-totem",["brambleslam","tectonic-slams"])).toEqual([]);
  });

  it("warns when Crater makes Tectonic Slams ineligible in either link order",()=>{
    for(const ids of [["crater","tectonic-slams"],["tectonic-slams","crater"]]){
      expect(resolved("leap-slam","tectonic-slams",ids).summary).toContain("makes Tectonic Slams ineligible");
      expect(resolved("leap-slam","crater",ids).summary).toContain("makes Tectonic Slams ineligible");
    }
    expect(native[89].effects.some(e=>e.supports.includes("SupportSlamAftershocksPlayer"))).toBe(false);
    expect(native[91].effects.some(e=>e.supports.includes("SupportSlamAftershocksPlayer"))).toBe(false);
    expect(native[88].effects.some(e=>e.supports.includes("SupportBranchingFissuresPlayer"))).toBe(true);
    expect(support("tectonic-slams").summary).toContain("15% less Attack Speed");
    expect(support("tectonic-slams").summary).toContain("coverage is incomplete");
  });

  it("does not convert Travel steps or a separate Eruption into automatic parent damage",()=>{
    expect(support("stomping-ground").priorities).toEqual([]);
    expect(support("volcanic-eruption").priorities).toEqual([]);
    expect(observed("ice-strike","SupportVolcanicEruptionPlayer",{conditionEnemyIgnited:true}).player.hit).toBe(observed("ice-strike").player.hit);
    expect(physicalChildObservations[0].effects.find(e=>e.effect==="TriggeredVolcanicEruptionPlayer")?.supports).toContain("SupportBrutalityPlayer");
    expect(normalizeSkillSupportIds("perfect-strike",["volcanic-eruption","brutality-i"])).toEqual(["volcanic-eruption","brutality-i"]);
    expect(resolved("perfect-strike","volcanic-eruption",["volcanic-eruption","brutality-i"]).summary).toContain("Brutality prohibits");
  });

  it("checks Overreach's area increase and near-target multiplicative Accuracy penalty",()=>{
    expect(constants("overreach")).toEqual([["base_skill_area_of_effect_+%",40],["support_reach_accuracy_within_2m_+%_final",-80]]);
    expect(native[67].player.accuracy).toBe(Math.floor(native[68].player.accuracy*.2));
    expect(support("overreach").priorities.map(p=>p.id)).toEqual(["areaOfEffect","accuracy"]);
    expect(normalizeSkillSupportIds("fireball",["overreach"])).toEqual([]);
    expect(support("punch-through").summary).toContain("next Projectile Attack hit");
    expect(support("punch-through").priorities).toEqual([]);
  });

  it("does not assume maximum Rage alongside below-maximum speed or sustainable spending",()=>{
    expect(native[69].player.Speed).toBeCloseTo(observed("ice-strike").player.Speed*1.15,10);
    expect(native[70].player.Speed).toBe(observed("ice-strike").player.Speed);
    expect(native[72].player.hit).toBeGreaterThan(native[71].player.hit);
    expect(constants("rageforged-ii")).toContainEqual(["support_rageforged_consumes_X_rage_to_enrage_skill_use",10]);
    expect(constants("rageforged-ii")).toContainEqual(["rage_skip_consume_chance_%",30]);
    expect(resolved("ice-strike","rage-iii",["rage-iii","rageforged-ii"]).summary).toContain("does not prove a sustainable use rate");
    for(const id of ["rage-i","rage-ii","rage-iii","rageforged-i","rageforged-ii"])expect(support(id).priorities).toEqual([]);
  });

  it("separates Persistent Buff flat Spirit and conditional player damage from the buff's own damage",()=>{
    expect(observed("berserk","SupportDirestrikePlayer").player.SpiritReserved).toBe(observed("berserk").player.SpiritReserved+20);
    expect(observed("berserk","SupportDirestrikePlayerTwo").player.SpiritReserved).toBe(observed("berserk").player.SpiritReserved+40);
    expect(observed("berserk","SupportDirestrikePlayerTwo").player.AverageHit).toBe(0);
    expect(support("direstrike-ii").priorities).toEqual([]);
    expect(normalizeSkillSupportIds("skeletal-arsonist",["direstrike-i"])).toEqual([]);
  });

  it("keeps relative Life, incoming Stun Bar, Parried consumption and opening Full Life as separate conditions",()=>{
    expect(native[74].player.hit).toBe(observed("ice-strike").player.hit*1.4);
    expect(native[75].player.hit).toBe(observed("ice-strike").player.hit*.8);
    expect(support("clash").summary).toContain("percentages, not raw Life");
    expect(support("retaliate-ii").summary).toContain("player's Stun Bar");
    expect(support("frenzied-riposte").priorities).toEqual([]);
    expect(support("opening-move").priorities.map(p=>p.id)).toEqual(["dazeDuration"]);
    expect(normalizeSkillSupportIds("fireball",["opening-move","retaliate-i","frenzied-riposte"])).toEqual([]);
  });

  it("does not mistake Hit and Run's action speed for movement-gated throughput or accept added cooldowns",()=>{
    expect(observed("ice-strike","SupportHitAndRunPlayer").player.Speed).toBeCloseTo(observed("ice-strike").player.Speed*1.4,10);
    expect(constants("hit-and-run")).toContainEqual(["skill_unusable_until_moved_X_distance",100]);
    for(const ids of [["hit-and-run","excise"],["excise","hit-and-run"]]){
      expect(resolved("ice-strike","hit-and-run",ids).summary).toContain("conflicts");
      expect(resolved("ice-strike","excise",ids).priorities).toEqual([]);
    }
    expect(native[64].effects[0].supports).not.toContain("SupportHitAndRunPlayer");
    expect(native[65].effects[0].supports).not.toContain("SupportHitAndRunPlayer");
    expect(resolved("poisonburst-arrow","hit-and-run",["hit-and-run","nova-projectiles-i"]).summary).not.toContain("conflicts");
    expect(physicalChildObservations[1].effects[0].supports).toContain("SupportHitAndRunPlayer");
    for(const ids of [["hit-and-run","combo-finisher-i"],["combo-finisher-i","hit-and-run"]])
      expect(resolved("ice-strike","hit-and-run",ids).summary).toContain("conflicts");
  });

  it("separates alternation windows and prohibits scoring the same mixed hit both ways",()=>{
    expect(constants("retreat-iii")).toContainEqual(["support_retreating_assault_projectile_damage_+%_final_if_melee_hit_in_past_2_seconds",30]);
    expect(constants("pursuit-iii")).toContainEqual(["support_advancing_assault_melee_damage_+%_final_if_projectile_attack_damage_hit_in_past_2_seconds",30]);
    expect(native[78].player.hit).toBe(observed("ice-strike").player.hit*1.2);
    expect(native[80].player.hit).toBe(0);
    for(const ids of [["retreat-i","pursuit-i"],["pursuit-i","retreat-i"]])
      expect(resolved("falling-thunder","retreat-i",ids).summary).toContain("disable this skill");
    const current=fresh("falling-thunder"),selected={...current,supportGemIds:["retreat-i"]};
    expect(passivePreferenceValues(node("20% increased Melee Damage"),current)).toEqual({attackDamage:20});
    expect(passivePreferenceValues(node("20% increased Melee Damage"),selected)).toEqual({});
    expect(refineSkillPreferencePreset(preset("falling-thunder"),["pursuit-i"]).suggestions.some(p=>p.id==="projectileDamage")).toBe(false);
  });

  it("keeps Charged Shots' third-shot gain, Tier I refund and prohibitions separate",()=>{
    expect(constants("charged-shots-i")).toContainEqual(["support_charged_shots_recover_%_mana_cost_on_use",100]);
    expect(constants("charged-shots-ii").some(s=>s[0]==="support_charged_shots_recover_%_mana_cost_on_use")).toBe(false);
    expect(observed("lightning-arrow","SupportChargedShotsPlayer").player.ManaCost).toBe(44);
    expect(observed("lightning-arrow","SupportChargedShotsPlayerTwo").player.ManaCost).toBe(48);
    expect(resolved("poisonburst-arrow","charged-shots-i",["charged-shots-i","brutality-i"]).summary).toContain("Mana recovery");
    expect(resolved("lightning-arrow","charged-shots-i",["charged-shots-i","embitter"]).summary).toContain("redirects");
    expect(support("charged-shots-i").priorities).toEqual([]);
    expect(normalizeSkillSupportIds("lightning-spear",["charged-shots-i"])).toEqual([]);
  });

  it("checks slower projectile speed as a multiplier, not extra hits or slower actions",()=>{
    expect(observed("lightning-arrow","SupportProjectileDecelerationPlayer").player.ProjectileSpeedMod).toBe(.75);
    expect(observed("lightning-arrow","SupportProjectileDecelerationPlayerTwo").player.ProjectileSpeedMod).toBe(.7);
    expect(native[81].player.ProjectileSpeedMod).toBeCloseTo(1.2*.7,10);
    expect(native[81].player.Speed).toBe(observed("lightning-arrow").player.Speed);
    expect(support("projectile-deceleration-ii").priorities).toEqual([]);
    expect(resolved("poisonburst-arrow","gambleshot",["gambleshot","pierce-iii"]).summary).toContain("Collision priority");
    expect(normalizeSkillSupportIds("gas-arrow",["gambleshot"])).toEqual([]);
  });

  it("pins Spectral limits and non-Spectral penalties without claiming complete native simulation",()=>{
    expect(constants("spectral-volley")).toContainEqual(["support_spectral_arrows_damage_+%_final_with_non_spectral_projectiles",-60]);
    expect(constants("spectral-volley")).toContainEqual(["support_spectral_arrows_maximum_spectral_arrows",5]);
    expect(constants("spectral-volley")).toContainEqual(["support_spectral_arrows_base_duration_ms",3000]);
    expect(observed("lightning-arrow","SupportSpectralVolleyPlayer").player.hit).toBe(observed("lightning-arrow").player.hit);
    expect(support("spectral-volley").summary).toContain("native parent damage is incomplete");
    expect(support("spectral-volley").priorities).toEqual([]);
    expect(normalizeSkillSupportIds("rain-of-arrows",["spectral-volley"])).toEqual([]);
    expect(normalizeSkillSupportIds("snipe",["spectral-volley"])).toEqual([]);
  });

  it("routes toward optional Knockback distance inside budget and leaves Shortest unchanged",()=>{
    const graph:TreeGraph={schemaVersion:1,gameVersion:"test",extractedAt:"test",source:{kind:"fixture",path:"test"},nodes:Object.fromEntries(
      ["start","plain","good","bridge","goal"].map(id=>[id,{...node(...(id==="good"?["20% increased Knockback Distance"]:[])),id,flags:id==="start"?{classStart:true}:{}}])),
      edges:[["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]].map(([from,to])=>({from,to})),groups:{},classStarts:{witch:"start"},bounds:{minX:0,minY:0,maxX:100,maxY:100}};
    const settings=applySkillSupportPriorities(setSkillSupport({...fresh("fireball"),preferences:[]},"knockback",true),preset("fireball"));
    const request={...settings,mode:"weighted" as const,extraPointBudget:1,graph,baseNodeIds:["start"],baseEdgeKeys:[],goalNodeIds:["goal"]};
    expect(optimizeWeightedBuildGoals(request,undefined,{maxIterations:8})).toMatchObject({status:"success",pointCost:3,weighted:{score:4}});
    const shortest={...request,mode:"shortest" as const};
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

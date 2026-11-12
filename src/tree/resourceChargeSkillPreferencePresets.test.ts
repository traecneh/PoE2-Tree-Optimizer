import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resourceChargeFixtures as fixtures, resourceChargeNativeObservations, resourceChargeSecondaryTimers } from "./resourceChargeSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceCatalog, passivePreferenceValues, scorePassiveNode, type PassivePreferenceId, type PassiveOptimizationSettings } from "./passivePreferences";
import { applySkillSupportPriorities, normalizeSkillSupportIds, setSkillSupport } from "./skillSupportPreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals, type BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, stats, position: { x: 0, y: 0 } });
const fresh = (id: string) => addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] },preset(id));
type Observation = { id: string; support: string; extra?: string; state: string; child: boolean; disabled: boolean; recipient?: string;
  output: Record<string, unknown>; mods: Record<string,{ base: number; inc: number }> };
const native = resourceChargeNativeObservations as unknown as Observation[];
const timers = resourceChargeSecondaryTimers as unknown as Observation[];
const observed = (id: string, support = "base", extra?: string, criteria: Partial<Observation> = {}) => native.find(n =>
  n.id === fixtures.find(f => f.id === id)!.effectId && n.support === support && n.extra === extra
  && Object.entries(criteria).every(([key,value]) => n[key as keyof Observation] === value))!;
const summary = (id: string, support: string) => preCommon45SupportsFor(id).find(s => s.id === support)!.summary;
const duration = ["prolonged-duration-i","prolonged-duration-ii"];
const reviewed: Record<string,string[]> = {
  "alchemists-boon": [], attrition: [], berserk: [], "charge-regulation": [], "combat-frenzy": [], "elemental-conflux": duration,
  "emergency-reload": [...duration,"efficiency-i","efficiency-ii"], "eternal-rage": [], "mana-remnants": [],
  "mantra-of-destruction": [...duration,"mobility"], "savage-fury": [...duration,"mobility"], "shard-scavenger": duration, "siphon-elements": [], trinity: [],
};
const resourceIds = ["maximumRage","maximumFrenzyCharges","maximumPowerCharges","maximumEnduranceCharges","frenzyChargeDuration","powerChargeDuration",
  "enduranceChargeDuration","remnantPickupRange","remnantEffect","additionalRemnantChance","elementalInfusionDuration"] as const;

describe("fourteen resource and charge focuses", () => {
  it.each(fixtures)("keeps $name's independent source identity, utility ownership and support subset", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: [...f.tags], passiveStatScopes: [] });
    expect(p.description.trim().split(/\s+/).length).toBeLessThanOrEqual(40);
    const links = preCommon45SupportsFor(f.id);
    expect(links.map(s => s.id).sort()).toEqual([...reviewed[f.id]].sort());
    const legal = new Set<string>([...f.legal,...f.children.flatMap(c => c.legal)]);
    for (const link of links) {
      expect(legal.has(link.effectId),`${f.id}: ${link.effectId}`).toBe(true);
      const current = fresh(f.id), selected = setSkillSupport(current,link.id,true);
      expect(selected.preferences).toEqual(current.preferences);
      expect(applySkillSupportPriorities(selected,p).preferences).toEqual(current.preferences);
    }
    expect(normalizeSkillSupportIds(f.id,["magnified-area-ii","controlled-destruction","rapid-casting-i","rapid-attacks-ii","brutality-iii","feeding-frenzy-ii"])).toEqual([]);
    expect(scorePassiveNode(node("100% increased Attack Damage","100% increased Spell Damage","100% increased Elemental Damage","100% increased Chaos Damage",
      "100% increased Critical Hit Chance","Minions deal 100% increased Damage"),fresh(f.id).preferences,fresh(f.id))).toBe(0);
  });

  it("adds fourteen curated pairs without calling zero-cost activations or Persistent toggles Efficiency upgrades", () => {
    expect(fixtures.reduce((sum,f) => sum + preCommon45SupportsFor(f.id).length,0)).toBe(14);
    for (const f of fixtures) expect(normalizeSkillSupportIds(f.id,["efficiency-i","efficiency-ii"])).toEqual(f.id === "emergency-reload" ? ["efficiency-i"] : []);
    let current = fresh("mantra-of-destruction");
    current = setSkillSupport(current,"prolonged-duration-i",true);
    current = setSkillSupport(current,"prolonged-duration-ii",true);
    expect(current.supportGemIds).toEqual(["prolonged-duration-ii"]);
    expect(observed("mantra-of-destruction","SupportEfficiencyPlayerTwo").output.ManaCost).toBe(0);
    expect(observed("savage-fury","SupportEfficiencyPlayerTwo").output.ManaCost).toBe(0);
  });

  it.each(fixtures)("preserves $name, manual weights, goals, weapon branches and budget through save/export", f => {
    const current: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 8, pointBudgetMode: "all-available", preferences: [{ id: "energyShield", weight: 1 },{ id: "maximumFrenzyCharges", weight: 3 }] };
    const selected = addSkillPresetPreferences(current,preset(f.id));
    expect(selected.preferences.slice(0,2)).toEqual(current.preferences);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const [saved] = normalizeSavedBuilds([{ id: "resources", name: f.name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "witch", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: ["weapon-a"], 2: ["weapon-b"] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(saved.state.optimizerSettings).toEqual(selected);
    expect(saved.state.buildGoalNodeIds).toEqual(["goal"]);
    expect(saved.state.weaponSetAllocationNodeIds).toEqual({ 1: ["weapon-a"], 2: ["weapon-b"] });
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
  });

  it.each([
    ["maximumRage","+5 to Maximum Rage","-5 to Maximum Rage",5],
    ["maximumFrenzyCharges","+1 to Maximum Frenzy Charges","-1 to Maximum Frenzy Charges",1],
    ["maximumPowerCharges","+1 to Maximum Power Charges","-1 to Maximum Power Charges",1],
    ["maximumEnduranceCharges","+1 to Maximum Endurance Charges","-1 to Maximum Endurance Charges",1],
    ["frenzyChargeDuration","10% increased Frenzy Charge Duration","10% reduced Frenzy Charge Duration",10],
    ["powerChargeDuration","10% increased Power Charge Duration","10% reduced Power Charge Duration",10],
    ["enduranceChargeDuration","10% increased Endurance Charge Duration","10% reduced Endurance Charge Duration",10],
    ["remnantEffect","Remnants you create have 10% increased effect","Remnants you create have 10% reduced effect",10],
    ["elementalInfusionDuration","10% increased Elemental Infusion duration","10% reduced Elemental Infusion duration",10],
  ] as const)("keeps %s signed, opt-in and separate from other resource effects", (id,positive,negative,value) => {
    expect(passivePreferenceValues(node(positive))).toEqual({ [id]: value });
    expect(passivePreferenceValues(node(negative))).toEqual({ [id]: -value });
    expect(passivePreferenceValues(node(positive,negative))).toEqual({ [id]: 0 });
    expect(scorePassiveNode(node(positive),[{ id,weight: 2 }])).toBe(2);
    expect(scorePassiveNode(node(negative),[{ id,weight: 2 }])).toBe(-2);
    expect(scorePassiveNode(node(positive),[])).toBe(0);
  });

  it("keeps charge-duration fanout explicit and Remnant chance flat, without inventing resource generation or duplicate score", () => {
    expect(passivePreferenceValues(node("20% increased Endurance, Frenzy and Power Charge Duration","5% reduced Frenzy Charge Duration")))
      .toEqual({ enduranceChargeDuration: 20, frenzyChargeDuration: 15, powerChargeDuration: 20 });
    expect(scorePassiveNode(node("20% increased Endurance, Frenzy and Power Charge Duration"),[{ id: "frenzyChargeDuration",weight: 1 }])).toBe(2);
    expect(passivePreferenceValues(node("5% chance to create an additional Remnant","Remnants can be collected from 20% further away")))
      .toEqual({ additionalRemnantChance: 5, remnantPickupRange: 20 });
    expect(passivePreferenceValues(node("Remnants you create have 2.5% reduced effect","1.5% reduced Elemental Infusion duration")))
      .toEqual({ remnantEffect: -2.5, elementalInfusionDuration: -1.5 });
    for (const id of resourceIds) {
      const effect = passivePreferenceCatalog.find(p => p.id === id)!;
      expect("description" in effect ? effect.description : "").toBeTruthy();
    }
    const settings = { mode: "weighted", extraPointBudget: 9, preferences: resourceIds.map(id => ({ id,weight: 1 })) };
    expect(normalizePassiveOptimizationSettings(settings)).toEqual(settings);
  });

  it("rejects conditional, other-owner, conversion, increased-chance, malformed, unknown and non-finite resource wording", () => {
    const lines = ["+5 to Maximum Rage while Shapeshifted","+1 to Maximum Power Charges if you have Crit Recently","Minions have +5 to Maximum Rage",
      "Your Companion has +1 to Maximum Frenzy Charges","Allies have 20% increased Power Charge Duration","Gain 2 Rage when Hit by an Enemy",
      "Gain 1 Rage on Melee Hit","20% increased Frenzy Charge Duration while on Full Life","10% increased chance to create an additional Remnant",
      "10% reduced chance to create an additional Remnant","Remnants can be collected from +20% further away","Remnants you create have 10% more effect",
      "Minions have 10% chance to create an additional Remnant","Remnants you create have 10% increased effect and an unknown effect",
      "+1.5 to Maximum Frenzy Charges","1 to Maximum Power Charges","+1 to Maximum constructor","20% increased Charge Duration",
      "1.2.3% increased Power Charge Duration","Remnants you create have .5% increased effect","Remnants can be collected from 1.% further away",
      `${"9".repeat(400)}% increased Power Charge Duration`,`+${"9".repeat(400)} to Maximum Rage`];
    for (const text of lines) {
      const values = passivePreferenceValues(node(text));
      for (const id of resourceIds) expect(values[id],text).toBeUndefined();
    }
  });

  it("checks Berserk's Rage effect and Life loss independently without treating capacity as current Rage", () => {
    const base = observed("berserk","base","Gain 1 Rage on Melee Hit",{ state: "rage-20" }).output;
    expect(base).toMatchObject({ Rage: 20, MaximumRage: 30, Life: 3287 });
    expect(base.RageEffect).toBe(Math.floor(20 * 1.59));
    expect(base.LifeDegen).toBeCloseTo(3287 * (6 / 60 / 100) * 20);
    const capacity = observed("berserk","base","Gain 1 Rage on Melee Hit\n+5 to Maximum Rage",{ state: "capacity" }).output;
    expect(capacity).toMatchObject({ Rage: 20, MaximumRage: 35, RageEffect: base.RageEffect, LifeDegen: base.LifeDegen });
    expect(observed("berserk","base","Gain 1 Rage on Melee Hit\nRegenerate 1% of maximum Life per second",{ state: "recovery" }).output).toMatchObject({ LifeRegenPercent: -1 });
    expect(observed("eternal-rage").mods.RageRegen.base).toBe(300 / 60);
    expect(observed("eternal-rage").output).toMatchObject({ Rage: 0, MaximumRage: 30, SpiritReserved: 100 });
    expect(preset("eternal-rage").exclusions.some(e => e.id === "manaRegenerationRate")).toBe(true);
  });

  it("checks charge reservoirs and binary buff conditions separately from generation and consumption", () => {
    const base = observed("charge-regulation","base",undefined,{ state: "no-charges" }).output;
    const one = observed("charge-regulation","base",undefined,{ state: "one-each" }).output;
    expect(one.Speed).toBeCloseTo(Number(base.Speed) * 1.25);
    expect(one.CritChance).toBeCloseTo(Number(base.CritChance) * 1.26);
    expect(one.EnergyShield).toBe(Number(base.EnergyShield) * 1.2);
    expect(observed("charge-regulation","base","20% increased Endurance, Frenzy and Power Charge Duration").output)
      .toMatchObject({ FrenzyChargesDuration: 18, PowerChargesDuration: 18, EnduranceChargesDuration: 18, FrenzyCharges: 0, PowerCharges: 0, EnduranceCharges: 0 });
    expect(observed("charge-regulation","base","+1 to Maximum Endurance Charges\n+1 to Maximum Frenzy Charges\n+1 to Maximum Power Charges").output)
      .toMatchObject({ FrenzyChargesMax: 4, PowerChargesMax: 4, EnduranceChargesMax: 4, FrenzyCharges: 0, PowerCharges: 0, EnduranceCharges: 0 });
    for (const extra of [undefined,"20% increased Cooldown Recovery Rate","20% increased Skill Effect Duration"]) expect(observed("combat-frenzy","base",extra).mods.CombatFrenzyCooldown.base).toBe(6.1);
    expect(preset("combat-frenzy").suggestions.some(s => ["cooldownRecoveryRate","freezeBuildup","pinBuildup","electrocuteBuildup"].includes(s.id))).toBe(false);
  });

  it("keeps Alchemist sharing unmodeled and does not automatically recommend the anomalous native Aura-generation control", () => {
    expect(observed("alchemists-boon").mods.FlaskChargesGenerated.base).toBeCloseTo(14 / 60);
    expect(observed("alchemists-boon","base","Aura Skills have 20% increased Magnitudes").output.AuraEffectMod).toBe(1.2);
    expect(observed("alchemists-boon","base","Aura Skills have 20% increased Magnitudes").mods.FlaskChargesGenerated.base).toBeLessThan(14 / 60);
    expect(preset("alchemists-boon").suggestions.map(s => s.id)).toEqual(["lifeFlaskRecovery","manaFlaskRecovery","presenceArea"]);
    expect(preset("alchemists-boon").exclusions.find(e => e.id === "auraMagnitude")?.reason).toContain("unexpectedly decreases");
  });

  it("checks Mana per pickup independently, not a guaranteed drop rate, regeneration or Infusion count", () => {
    const base = observed("mana-remnants").output, effect = observed("mana-remnants","base","Remnants you create have 20% increased effect").output;
    expect(base.ManaGainPerRemnant).toBe(281);
    expect(effect.ManaGainPerRemnant).toBe(Math.floor(281 * 1.2));
    for (const extra of ["10% chance to create an additional Remnant","Remnants can be collected from 20% further away","20% increased Skill Effect Duration"]) {
      expect(observed("mana-remnants","base",extra).output.ManaGainPerRemnant).toBe(281);
    }
    expect(fresh("siphon-elements").preferences.map(p => p.id)).toEqual(["remnantPickupRange","additionalRemnantChance","elementalInfusionDuration"]);
    expect(preset("siphon-elements").suggestions.some(s => s.id === "remnantEffect")).toBe(false);
  });

  it("keeps real reload cost/cooldown separate from zero-cost Combo/Fury actions and double-edged secondary timers", () => {
    expect(observed("emergency-reload").output).toMatchObject({ ManaCost: 82, Cooldown: 45.012, Duration: 6.006 });
    expect(observed("emergency-reload","SupportEfficiencyPlayerTwo").output).toMatchObject({ ManaCost: 50, Cooldown: 45.012 });
    expect(observed("emergency-reload","base","20% increased Cooldown Recovery Rate").output.Cooldown).toBeCloseTo(45 / 1.2,1);
    const mantra = timers.filter(n => n.id === "MantraOfDestructionPlayer");
    expect(mantra.map(n => n.output.DurationSecondary)).toEqual([20.031,27.027]);
    const shard = timers.filter(n => n.id === "ShardScavengerPlayer");
    expect(shard.map(n => n.output.Duration)).toEqual([3.003,4.059]);
    expect(shard.map(n => n.output.DurationSecondary)).toEqual([6.072,8.184]);
    expect(fresh("shard-scavenger").preferences).toEqual([]);
    expect(summary("shard-scavenger","prolonged-duration-ii")).toContain("both grow");
    expect(observed("savage-fury","base",undefined,{ child: true }).output).toMatchObject({ Duration: 0.528, SpiritReserved: 30 });
    expect(observed("savage-fury","ProlongedDurationSupportPlayerTwo").output.Duration).toBe(0.693);
    expect(preset("savage-fury").suggestions.some(s => s.id === "skillDuration")).toBe(false);
  });

  it("does not turn configured encounter time, a preferred Element or Affinity into supplied runtime uptime", () => {
    expect(observed("attrition","base",undefined,{ state: "boss-0", recipient: "FireballPlayer", disabled: false }).output.AverageHit).toBe(299.6);
    expect(observed("attrition","base",undefined,{ state: "boss-10", recipient: "FireballPlayer", disabled: false }).output.AverageHit).toBe(314.58);
    expect(observed("elemental-conflux","base",undefined,{ state: "average" }).output.AverageHit).toBe(359.52);
    expect(observed("elemental-conflux","base",undefined,{ state: "fire" }).output.AverageHit).toBe(476.15);
    expect(observed("trinity","base",undefined,{ state: "affinity-0" }).output.AverageHit).toBe(299.6);
    expect(observed("trinity","base",undefined,{ state: "affinity-50" }).output.AverageHit).toBeGreaterThan(299.6);
    for (const id of ["elemental-conflux","shard-scavenger","trinity"]) {
      expect(preset(id).suggestions).toEqual([]);
      expect(preset(id).description).toContain("Context-only");
    }
  });

  it("matches the independent real-tree resource inventory without counting combined charge duration three times as wording coverage", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json","utf8")) as TreeGraph;
    const counts = Object.fromEntries(resourceIds.map(id => [id,0]));
    const wordings = new Set<string>(); let occurrences = 0;
    for (const n of Object.values(graph.nodes).filter(n => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const text of n.stats) {
      const values = passivePreferenceValues(node(text)); let matched = false;
      for (const id of resourceIds) if (values[id] !== undefined) { counts[id]++; matched = true; }
      if (matched) { wordings.add(text); occurrences++; }
    }
    expect(counts).toEqual({ maximumRage: 10, maximumFrenzyCharges: 4, maximumPowerCharges: 4, maximumEnduranceCharges: 4,
      frenzyChargeDuration: 12, powerChargeDuration: 12, enduranceChargeDuration: 9, remnantPickupRange: 8, remnantEffect: 2,
      additionalRemnantChance: 3, elementalInfusionDuration: 8 });
    expect(wordings.size).toBe(31); expect(occurrences).toBe(68);
  });

  it("routes for reviewed capacity within budget while Shortest remains unchanged", () => {
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "fixture", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start","plain","goal","charge","bridge"].map(id => [id,{ ...node(),id,flags: id === "start" ? { classStart: true } : {}, stats: id === "charge" ? ["+1 to Maximum Frenzy Charges"] : [] }])),
      edges: [["start","plain"],["plain","goal"],["start","charge"],["charge","bridge"],["bridge","goal"]].map(([from,to]) => ({ from,to })),
      groups: {}, classStarts: { witch: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request: BuildGoalsOptimizeRequest = { graph, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3,...fresh("combat-frenzy"), extraPointBudget: 1 };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.totalNodeIds).toContain("charge"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(1);
    expect(runOptimizerRequest({ ...request, mode: "shortest" })).toMatchObject(optimizeBuildGoals({ ...request, mode: "shortest" }));
    expect(resourceIds.every(id => passivePreferenceCatalog.some(p => p.id === id))).toBe(true);
  });
});

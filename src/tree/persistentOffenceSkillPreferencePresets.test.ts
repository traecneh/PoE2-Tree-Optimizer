import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { persistentOffenceFixtures as fixtures, persistentOffenceNativeObservations, mirageSocketFixtures } from "./persistentOffenceSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset, resolveSkillPreferencePreset } from "./skillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, setSkillSupport } from "./skillSupportPreferences";
import { normalizeSocketedProxySkillId, proxySocketedSkillIds } from "./proxySkillPreferencePresets";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals, type BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, stats, position: { x: 0, y: 0 } });
const fresh = (id: string) => addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] },preset(id));
type Metric = Record<string, unknown>;
type Observation = { id: string; support: string; extra?: string; child: boolean; disabled: boolean; socket?: string; recipient?: string; player: Metric; minion?: Metric; enemy: Metric };
const native = persistentOffenceNativeObservations as unknown as Observation[];
const observed = (id: string, support = "base", extra?: string, criteria: Partial<Observation> = {}) => native.find(n =>
  n.id === fixtures.find(f => f.id === id)!.effectId && n.support === support && n.extra === extra
  && Object.entries(criteria).every(([key,value]) => n[key as keyof Observation] === value))!;
const summary = (id: string, support: string) => preCommon45SupportsFor(id).find(s => s.id === support)!.summary;
const area = ["magnified-area-i","magnified-area-ii"], duration = ["prolonged-duration-i","prolonged-duration-ii"];
const brutality = ["brutality-i","brutality-ii","brutality-iii"], speed = ["rapid-attacks-i","rapid-attacks-ii"], feeding = ["feeding-frenzy-i","feeding-frenzy-ii"];
const reviewed: Record<string, string[]> = {
  "herald-of-ash": [...area,...duration], "herald-of-blood": [...area,"concentrated-area",...brutality], "herald-of-ice": [...area,"concentrated-area"],
  "herald-of-plague": [], "herald-of-thunder": area, "plague-bearer": [...area,"mobility","concentrated-area"],
  "raging-spirits": [...duration,...speed,...feeding,...brutality], "ravenous-swarm": [...area,...duration,...speed,...feeding,"concentrated-area",...brutality,"deadly-poison-i","deadly-poison-ii"],
  "mirage-archer": duration, archmage: [], "overwhelming-presence": [], "withering-presence": duration,
};

describe("twelve persistent offence and Minion focuses", () => {
  it.each(fixtures)("keeps $name's independent source identity and reviewed support subset", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: [...f.tags] });
    const links = preCommon45SupportsFor(f.id);
    expect(links.map(s => s.id).sort()).toEqual([...reviewed[f.id]].sort());
    const legal = new Set<string>([...f.legal,...f.children.flatMap(c => c.legal)]);
    for (const link of links) {
      expect(legal.has(link.effectId),`${f.id}: ${link.effectId}`).toBe(true);
      const settings = fresh(f.id), selected = setSkillSupport(settings,link.id,true);
      expect(selected.preferences).toEqual(settings.preferences);
      expect(applySkillSupportPriorities(selected,p).preferences).toEqual(settings.preferences);
      expect(link.summary).toBeTruthy();
    }
    expect(normalizeSkillSupportIds(f.id,["efficiency-i","efficiency-ii","rapid-casting-i","spell-echo","swift-affliction-ii"])).toEqual([]);
  });

  it("adds exactly 46 reviewed links, not every type-legal support or a new support family", () => {
    expect(fixtures.reduce((sum,f) => sum + preCommon45SupportsFor(f.id).length,0)).toBe(46);
    for (const id of ["herald-of-ice","herald-of-thunder"]) expect(normalizeSkillSupportIds(id,brutality)).toEqual([]);
    expect(normalizeSkillSupportIds("herald-of-blood",["deadly-poison-ii"])).toEqual([]);
  });

  it.each(fixtures)("preserves $name, manual weights, goals and budgets through save/export", f => {
    const current: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 8, pointBudgetMode: "all-available", preferences: [{ id: "energyShield", weight: 1 },{ id: "criticalChance", weight: 2 }] };
    const selected = { ...addSkillPresetPreferences(current,preset(f.id)), ...(f.id === "mirage-archer" ? { socketedProxySkillId: "ice-shot" } : {}) };
    expect(selected.preferences.slice(0,2)).toEqual(current.preferences);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const [saved] = normalizeSavedBuilds([{ id: "persistent", name: f.name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "witch", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(saved.state.optimizerSettings).toEqual(selected);
    expect(saved.state.buildGoalNodeIds).toEqual(["goal"]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
  });

  it("counts complete signed Herald modifiers once, without inventing flat critical conversion or leaking ownership", () => {
    const passive = node("10% increased Damage","Herald Skills deal 20% increased Damage","Herald Skills deal 5% reduced Damage",
      "10% increased Area of Effect","Herald Skills have 20% increased Area of Effect","Herald Skills have 5% reduced Area of Effect",
      "20% increased Reservation Efficiency of Herald Skills","5% reduced Reservation Efficiency of Herald Skills");
    expect(passivePreferenceValues(passive,{ focusSkillId: "herald-of-ice" })).toEqual({ genericDamage: 25, areaOfEffect: 25, heraldReservationEfficiency: 15 });
    expect(passivePreferenceValues(passive,{ focusSkillId: "fireball" })).toEqual({ genericDamage: 10, areaOfEffect: 10, heraldReservationEfficiency: 15 });
    expect(scorePassiveNode(node("Herald Skills deal 20% increased Damage"),[{ id: "genericDamage", weight: 2 },{ id: "attackDamage", weight: 3 },{ id: "elementalDamage", weight: 3 }],{ focusSkillId: "herald-of-ice" })).toBe(4);
    for (const text of ["Herald Skills have +8% to Critical Hit Chance","Herald Skills deal 10% increased Damage while on Full Life","Allies have 10% increased Reservation Efficiency of Herald Skills",
      "Minions have 10% increased Reservation Efficiency of Herald Skills","10% more Reservation Efficiency of Herald Skills","Herald Skills have 10% increased Damage",
      "Herald Skills deal 10% increased Area of Effect","Herald Skills deal 1.2.3% increased Damage","1.% increased Reservation Efficiency of Herald Skills","Herald Skills have 10% increased Area of Effect and an unknown effect"]) {
      expect(passivePreferenceValues(node(text),{ focusSkillId: "herald-of-blood" }),text).toEqual({});
    }
    expect(passivePreferenceValues(node("Herald Skills deal 2.5% reduced Damage","1.5% reduced Reservation Efficiency of Herald Skills"),{ focusSkillId: "herald-of-blood" }))
      .toEqual({ genericDamage: -2.5, heraldReservationEfficiency: -1.5 });
    for (const f of fixtures.filter(f => f.id.startsWith("herald-"))) {
      expect(observed(f.id).player.SpiritReserved).toBe(30);
      expect(observed(f.id,"base","20% increased Reservation Efficiency of Herald Skills").player.SpiritReserved).toBe(30 / 1.2);
    }
  });

  it("keeps unmodeled Overkill, Blood Loss and stored-Poison damage explicit", () => {
    expect(fresh("herald-of-plague").preferences).toEqual([{ id: "heraldReservationEfficiency", weight: 1 }]);
    expect(preset("herald-of-ash").description).toContain("incomplete");
    expect(observed("herald-of-ash").player).toMatchObject({ AverageHit: 0, TotalDot: 0, Duration: 3.003 });
    expect(observed("herald-of-ash","ProlongedDurationSupportPlayerTwo").player.Duration).toBe(4.059);
    expect(preset("herald-of-blood").passiveStatScopes).toEqual(["heraldDamage","heraldAreaOfEffect"]);
    expect(observed("herald-of-blood","base","30% increased Attack Damage").player.AverageHit).toBe(observed("herald-of-blood").player.AverageHit);
    expect(observed("herald-of-blood","SupportConcentratedAreaPlayer").player).toMatchObject({ AverageHit: 140.175, AreaOfEffectMod: 0.5 });
    expect(observed("herald-of-blood","base","Herald Skills deal 30% increased Damage").player.AverageHit).toBeCloseTo(140.175 * 1.3,0);
    expect(summary("herald-of-blood","concentrated-area")).toContain("unchanged");
    expect(fresh("plague-bearer").preferences.map(p => p.id)).toEqual(["areaOfEffect","skillMovementPenaltyReduction"]);
    expect(observed("plague-bearer").player).toMatchObject({ effect: "PlagueBearerNovaPlayer", AverageHit: 0, AreaOfEffectRadius: 18, SpiritReserved: 30 });
  });

  it("distinguishes Cold area damage from Lightning bolt coverage and forbids their self-supplied trigger ailments", () => {
    expect(preset("herald-of-ice").exclusions.some(e => e.id === "freezeBuildup")).toBe(true);
    expect(preset("herald-of-thunder").exclusions.some(e => e.id === "shockMagnitude")).toBe(true);
    expect(observed("herald-of-ice","SupportConcentratedAreaPlayer").player.hit).toBeCloseTo(29.4);
    expect(observed("herald-of-thunder","SupportConcentratedAreaPlayer").player.hit).toBe(observed("herald-of-thunder").player.hit);
    for (const id of ["herald-of-ice","herald-of-thunder"]) {
      expect(observed(id,"SupportBrutalityPlayerThree").player.hit).toBe(0);
      expect(preset(id).suggestions.some(s => ["attackSpeed","castSpeed","physicalDamage"].includes(s.id))).toBe(false);
    }
  });

  it.each(["raging-spirits","ravenous-swarm"])("keeps %s Minion damage and speed separate from player, Totem and Companion modifiers", id => {
    const current = fresh(id), base = observed(id).minion!;
    expect(scorePassiveNode(node("100% increased Attack Damage","100% increased Spell Damage","100% increased Fire Damage","100% increased Chaos Damage",
      "100% increased Attack Speed","Companions deal 100% increased Damage","100% increased Totem Damage"),current.preferences,current)).toBe(0);
    expect(passivePreferenceValues(node("Minions have 10% increased Attack and Cast Speed","Minions have 2% reduced Attack Speed"),current))
      .toEqual({ minionAttackSpeed: 8, minionCastSpeed: 10, minionSpeed: 18 });
    expect(scorePassiveNode(node("Minions have 10% increased Attack and Cast Speed"),current.preferences,current)).toBeCloseTo(10 / 3 * 2);
    expect(observed(id,"base","Companions deal 30% increased Damage").minion!.hit).toBe(base.hit);
    expect(observed(id,"base","30% increased Attack Damage\n30% increased Spell Damage\n30% increased Fire Damage\n30% increased Chaos Damage").minion!.hit).toBe(base.hit);
    expect(observed(id,"SupportFeedingFrenzyPlayerTwo").minion!.hit).toBeGreaterThan(Number(base.hit));
    expect(observed(id,"SupportRapidAttacksPlayerTwo").minion!.Speed).toBeCloseTo(Number(base.Speed) * 1.25);
    expect(refineSkillPreferencePreset(preset(id),["feeding-frenzy-ii"]).suggestions.some(s => s.id === "minionLife")).toBe(false);
    expect(preset(id).suggestions.some(s => ["minionCastSpeed","minionLife","poisonMagnitude"].includes(s.id))).toBe(false);
  });

  it("does not restore Raging Spirits' Fire conversion or bypass Swarm Poison's Chaos prohibition", () => {
    expect(observed("raging-spirits","SupportBrutalityPlayerThree").minion!.hit).toBeCloseTo(58.275);
    expect(summary("raging-spirits","brutality-iii")).toContain("without restoring Physical damage");
    expect(observed("ravenous-swarm").minion).toMatchObject({ PoisonChance: 100, hit: 179.025 });
    expect(observed("ravenous-swarm","SupportBrutalityPlayerThree").minion!.PoisonDPS).toBeUndefined();
    expect(observed("ravenous-swarm","SupportDeadlyPoisonPlayerTwo").minion).toMatchObject({ hit: 124.95, PoisonDPS: 57.509 });
    expect(summary("ravenous-swarm","deadly-poison-ii")).toContain("100% more Minion Poison magnitude with 30% less hit damage");
    expect(summary("ravenous-swarm","deadly-poison-i")).toContain("75% more Minion Poison magnitude with 25% less hit damage");
    expect(observed("ravenous-swarm","base","20% increased Cooldown Recovery Rate").player).toMatchObject({ Cooldown: 5.016, Duration: 9.801 });
    expect(observed("ravenous-swarm","ProlongedDurationSupportPlayerTwo").player).toMatchObject({ Cooldown: 6.006, Duration: 13.233 });
  });

  it("requires a reviewed Mirage Bow choice and inherits that component without Totem/Minion or player-only hit-debuff scopes", () => {
    expect(preset("mirage-archer").suggestions).toEqual([]);
    expect(proxySocketedSkillIds("mirage-archer")).toEqual(["lightning-arrow","ice-shot","rain-of-arrows","freezing-salvo"]);
    for (const value of [undefined,"fireball","armour-breaker","gas-arrow","__proto__",{}]) expect(normalizeSocketedProxySkillId("mirage-archer",value)).toBeUndefined();
    for (const [index,socketedProxySkillId] of proxySocketedSkillIds("mirage-archer").entries()) {
      const context = { focusSkillId: "mirage-archer", socketedProxySkillId }, p = resolveSkillPreferencePreset(context)!;
      expect(resolveSkillPreferencePreset(context)).toBe(p);
      expect(p.suggestions.find(s => s.id === "skillDuration")?.weight).toBe(2);
      expect(p.exclusions.some(e => e.id === "skillDuration")).toBe(false);
      expect(p.suggestions.some(s => /^(totem|minion)/.test(s.id))).toBe(false);
      expect(p.passiveStatScopes?.some(s => ["attackBlindChance","attackMaimChance","attackIncisionChance"].includes(s))).toBe(false);
      expect(mirageSocketFixtures[index].metaCompatibility.legal).toBe(true);
      expect(passivePreferenceValues(node("30% increased Damage with Bows","Minions deal 30% increased Damage"),context)).toMatchObject({ attackDamage: 30, minionDamage: 30 });
    }
    expect(observed("mirage-archer","base",undefined,{ socket: "LightningArrowPlayer" }).player).toMatchObject({ hit: 13.65, SpiritReserved: 60 });
    expect(observed("mirage-archer","base","30% increased Damage with Bows").player.hit).toBeGreaterThan(13.65);
    expect(observed("mirage-archer","base","Minions deal 30% increased Damage").player.hit).toBe(13.65);
    expect(observed("mirage-archer","base","30% increased Totem Damage").player.hit).toBe(13.65);
    expect(observed("mirage-archer","ProlongedDurationSupportPlayerTwo").player).toMatchObject({ Duration: 8.118, Cooldown: 10.032 });
  });

  it("independently checks Archmage Mana-derived damage and cost without empowering channels or assuming sustain", () => {
    const before = observed("archmage","base",undefined,{ recipient: "FireballPlayer", disabled: true }).player;
    const after = observed("archmage","base",undefined,{ recipient: "FireballPlayer", disabled: false }).player;
    expect(after.AverageHit).toBeCloseTo(Number(before.AverageHit) * (1 + Math.floor(Number(after.Mana) / 100) * 0.04));
    expect(after.ManaCost).toBe(Number(before.ManaCost) + Math.ceil(Number(after.Mana) * 0.061));
    const extra = observed("archmage","base","+100 to maximum Mana",{ recipient: "FireballPlayer" }).player;
    expect(extra.ManaCost).toBe(Number(before.ManaCost) + Math.ceil(Number(extra.Mana) * 0.061));
    expect(Math.abs(Number(extra.AverageHit) - Number(before.AverageHit) * (1 + Math.floor(Number(extra.Mana) / 100) * 0.04))).toBeLessThan(1);
    expect(observed("archmage","base","20% increased Mana Cost Efficiency",{ recipient: "FireballPlayer" }).player.ManaCost).toBeCloseTo(Number(after.ManaCost) / 1.2);
    for (const disabled of [true,false]) expect(observed("archmage","base",undefined,{ recipient: "FlameblastPlayer", disabled }).player).toMatchObject({ AverageHit: 577.26, ManaPerSecondCost: 57 });
    expect(fresh("archmage").preferences.map(p => p.id)).toEqual(["mana","manaRegenerationRate","manaCostEfficiency"]);
  });

  it("separates enemy Presence debuffs from player thresholds and a fixed Wither interval from cooldown recovery", () => {
    expect(fresh("overwhelming-presence").preferences.map(p => p.id)).toEqual(["auraMagnitude","presenceArea"]);
    expect(fresh("withering-presence").preferences.map(p => p.id)).toEqual(["presenceArea","skillDuration"]);
    expect(observed("overwhelming-presence","base","Aura Skills have 20% increased Magnitudes").player.AuraEffectMod).toBe(1.2);
    expect(observed("withering-presence","base","20% increased Cooldown Recovery Rate").player.Duration).toBe(6.006);
    expect(observed("withering-presence","ProlongedDurationSupportPlayerTwo").player.Duration).toBe(8.118);
    expect(scorePassiveNode(node("100% increased Stun Threshold","100% increased Elemental Ailment Threshold","100% increased Chaos Damage"),fresh("overwhelming-presence").preferences,fresh("overwhelming-presence"))).toBe(0);
    expect(preset("withering-presence").exclusions.find(e => e.id === "auraMagnitude")?.reason).toContain("does not prove");
  });

  it("matches only reviewed real-tree Herald wordings", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json","utf8")) as TreeGraph;
    const texts = [...new Set(Object.values(graph.nodes).filter(n => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery).flatMap(n => n.stats))];
    const matched = texts.filter(text => /herald/i.test(text) && Object.keys(passivePreferenceValues(node(text),{ focusSkillId: "herald-of-ice" })).length);
    expect(matched.sort()).toEqual(["Herald Skills deal 20% increased Damage","Herald Skills deal 30% increased Damage","Herald Skills have 25% increased Area of Effect",
      "20% increased Reservation Efficiency of Herald Skills","6% increased Reservation Efficiency of Herald Skills","8% increased Reservation Efficiency of Herald Skills"].sort());
  });

  it("routes for Herald-specific value within budget while Shortest stays identical and Mirage requires a valid source", () => {
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "fixture", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start","plain","goal","herald","bridge"].map(id => [id,{ ...node(),id,flags: id === "start" ? { classStart: true } : {}, stats: id === "herald" ? ["Herald Skills deal 20% increased Damage"] : [] }])),
      edges: [["start","plain"],["plain","goal"],["start","herald"],["herald","bridge"],["bridge","goal"]].map(([from,to]) => ({ from,to })),
      groups: {}, classStarts: { witch: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request: BuildGoalsOptimizeRequest = { graph, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3,...fresh("herald-of-ice"), extraPointBudget: 1 };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.totalNodeIds).toContain("herald"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(4);
    expect(runOptimizerRequest({ ...request, mode: "shortest" })).toMatchObject(optimizeBuildGoals({ ...request, mode: "shortest" }));
    for (const socketedProxySkillId of [undefined,"fireball","__proto__"]) expect(runOptimizerRequest({ ...request, focusSkillId: "mirage-archer", socketedProxySkillId }).status).toBe("error");
    expect(optimizeWeightedBuildGoals({ ...request, focusSkillId: "mirage-archer", socketedProxySkillId: "ice-shot" },undefined,{ maxIterations: 8 }).status).toBe("success");
  });
});

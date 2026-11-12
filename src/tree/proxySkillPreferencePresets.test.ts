import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { proxyFixtures as fixtures, proxyNativeObservations as native } from "./proxySkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset, resolveSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, setSkillSupport } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSocketedProxySkillId, proxySocketedSkillIds } from "./proxySkillPreferencePresets";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { createBuildGoalsValidation } from "./buildGoalsValidation";
import { optimizeBuildGoals, type BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, stats, position: { x: 0, y: 0 } });
const fresh = (focusSkillId: string, socketedProxySkillId?: string) => addSkillPresetPreferences({ mode: "weighted", focusSkillId,
  extraPointBudget: 7, preferences: [], ...(socketedProxySkillId ? { socketedProxySkillId } : {}) },preset(focusSkillId));
const observed = (id: string, support = "base", extra?: string, socket?: string) => native.find(n => n.id === id && n.support === support
  && ("extra" in n ? n.extra : undefined) === extra && ("socket" in n ? n.socket : undefined) === socket && !("weapon" in n))!;
const hit = (n: ReturnType<typeof observed>): number => ("minion" in n && n.minion ? n.minion.hit : "hit" in n.player ? n.player.hit : "AverageHit" in n.player ? n.player.AverageHit : 0) ?? 0;
const summary = (id: string, support: string) => preCommon45SupportsFor(id).find(s => s.id === support)!.summary;

describe("remaining proxy, Totem and Minion focus batch", () => {
  it.each(fixtures)("keeps $name's frozen identity and independent support eligibility", f => {
    expect(preset(f.id)).toMatchObject({ name: f.name, gemId: f.gemId, tags: [...f.tags] });
    const excluded = f.id === "soul-offering" ? ["SupportFeedingFrenzyPlayer","SupportFeedingFrenzyPlayerTwo"] : [];
    const links = preCommon45SupportsFor(f.id);
    expect(links.map(s => s.effectId).sort()).toEqual(f.legalSupports.filter(id => !excluded.includes(id)).sort());
    for (const link of links) {
      const settings = fresh(f.id);
      const selected = setSkillSupport(settings,link.id,true);
      expect(selected.preferences).toEqual(settings.preferences);
      expect(link.summary).toBeTruthy();
      if (!link.id.startsWith("feeding-frenzy")) expect(applySkillSupportPriorities(selected,preset(f.id)).preferences).toEqual(settings.preferences);
    }
    expect(normalizeSkillSupportIds(f.id,["rapid-casting-i","controlled-destruction","spell-echo","considered-casting"])).toEqual([]);
  });

  it.each(["raise-zombie","rhoa-mount","wolf-pack"])("keeps %s's Minion attacks separate from player damage and counts combined speed once", id => {
    const settings = fresh(id);
    expect(scorePassiveNode(node("100% increased Attack Damage","100% increased Spell Damage","100% increased Physical Damage",
      "30% increased Attack Speed","30% increased Cast Speed"),settings.preferences,settings)).toBe(0);
    expect(scorePassiveNode(node("Minions have 6% increased Attack and Cast Speed"),settings.preferences,settings)).toBe(4);
    expect(scorePassiveNode(node("Minions have 6% reduced Attack Speed"),settings.preferences,settings)).toBe(-4);
    expect(settings.preferences.some(p => ["minionSpeed","minionCastSpeed","areaOfEffect","minionAreaOfEffect"].includes(p.id))).toBe(false);
    const baseline = observed(id);
    expect(hit(observed(id,"base","30% increased Attack Damage\n30% increased Spell Damage\n30% increased Attack Speed"))).toBe(hit(baseline));
    expect(hit(observed(id,"base","Minions deal 30% increased Damage"))).toBeGreaterThan(hit(baseline));
    for (const support of ["SupportMagnifiedAreaPlayerTwo","SupportConcentratedAreaPlayer"]) expect(hit(observed(id,support))).toBe(hit(baseline));
    expect(summary(id,"concentrated-area")).toContain("single-target");
  });

  it("admits Companion-specific stats only for Rhoa and Wolf, not ordinary Zombies", () => {
    for (const id of ["rhoa-mount","wolf-pack"]) {
      const settings = fresh(id);
      expect(scorePassiveNode(node("Companions deal 20% increased Damage","Companions have 10% increased maximum Life"),settings.preferences,settings)).toBe(8);
      expect(hit(observed(id,"base","Companions deal 30% increased Damage"))).toBeGreaterThan(hit(observed(id)));
      expect(settings.preferences.some(p => p.id === "skillDuration" || p.id === "minionDuration")).toBe(false);
    }
    expect(hit(observed("raise-zombie","base","Companions deal 30% increased Damage"))).toBe(hit(observed("raise-zombie")));
    expect(scorePassiveNode(node("Companions deal 20% increased Damage"),fresh("raise-zombie").preferences)).toBe(0);
    expect(preset("wolf-pack").description).toContain("one Companion");
    expect(preset("rhoa-mount").description).toContain("not the player's mounted");
  });

  it("keeps temporary Zombie, Offering and capture timers separate from persistent Companions and buff magnitude", () => {
    const zombie = observed("raise-zombie","ProlongedDurationSupportPlayerTwo");
    expect(zombie.player).toMatchObject({ Duration: 27.027, ManaCost: 122 });
    expect(observed("soul-offering","ProlongedDurationSupportPlayerTwo").player).toMatchObject({ Duration: 8.118, ManaCost: 169 });
    expect(observed("tame-beast","ProlongedDurationSupportPlayerTwo").player).toMatchObject({ Duration: 15.939, ManaCost: 118 });
    const soul = fresh("soul-offering");
    expect(scorePassiveNode(node("100% increased Spell Damage","Minions deal 100% increased Damage"),soul.preferences,soul)).toBe(0);
    expect(soul.preferences.map(p => p.id)).toEqual(["minionLife","skillDuration","castSpeed"]);
    expect(preset("tame-beast").suggestions.map(p => p.id)).toEqual(["skillDuration"]);
    expect(preset("tame-beast").description).toContain("Capture-action focus only");
    expect(preset("soul-offering").description).toContain("player Spell Damage");
  });

  it("scores Shockwave's inherited attack scopes but not an assumed Mace, spell or Minion", () => {
    const settings = fresh("shockwave-totem");
    expect(passivePreferenceValues(node("20% increased Melee Damage","5% reduced Attack Area Damage","10% increased Critical Hit Chance for Attacks",
      "20% increased Damage with Maces","20% increased Damage with Two Handed Weapons","20% increased Critical Hit Chance for Spells"),settings))
      .toEqual({ attackDamage: 20, attackAreaDamage: -5, criticalChance: 10 });
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","100% increased Spell Damage"),settings.preferences,settings)).toBe(0);
    expect(observed("shockwave-totem").player).toMatchObject({ Speed: 0.725, hit: 5.775 });
    expect(observed("shockwave-totem","SupportRapidAttacksPlayerTwo").player.Speed).toBe(0.90625);
    expect(observed("shockwave-totem","SupportConcentratedAreaPlayer").player).toMatchObject({ hit: 7.35, AreaOfEffectMod: 0.5, AreaOfEffectRadius: 21 });
    expect(summary("shockwave-totem","concentrated-area")).toContain("50% less area");
    expect(hit(observed("shockwave-totem","base","Minions deal 30% increased Damage"))).toBe(5.775);
  });

  it.each(["ancestral-warrior-totem","spell-totem"])("requires an explicit reviewed source for %s and preserves selection in saves", id => {
    expect(fresh(id).preferences).toEqual([]);
    expect(proxySocketedSkillIds(id).length).toBe(id === "spell-totem" ? 4 : 6);
    for (const socketedProxySkillId of proxySocketedSkillIds(id)) {
      const current: PassiveOptimizationSettings = { ...fresh(id,socketedProxySkillId), pointBudgetMode: "all-available" };
      expect(current.preferences).toContainEqual({ id: "totemDamage", weight: 3 });
      expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
      const resolved = resolveSkillPreferencePreset(current)!;
      expect(resolved).toBe(resolveSkillPreferencePreset(current));
      expect(resolved.passiveStatScopes?.some(s => ["spellHinderChance","attackBlindChance","attackMaimChance","attackIncisionChance"].includes(s))).toBe(false);
      const [saved] = normalizeSavedBuilds([{ id: "proxy", name: "Proxy", createdAt: "test", updatedAt: "test", state: {
        selectedClassStartId: "witch", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
        allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
      } }]);
      expect(saved.state.optimizerSettings).toEqual(current);
      expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    }
    for (const value of [undefined, "__proto__", "constructor", {}, 2, "mortar-cannon"]) expect(normalizeSocketedProxySkillId(id,value)).toBeUndefined();
    expect(normalizeSocketedProxySkillId("__proto__","fireball")).toBeUndefined();
    expect(normalizePassiveOptimizationSettings({ ...fresh(id,proxySocketedSkillIds(id)[0]), focusSkillId: "spark" })).not.toHaveProperty("socketedProxySkillId");
  });

  it("retains socketed hit/DoT ownership and independent Totem lifetime limits", () => {
    const fire = fresh("spell-totem","fireball"), chaos = fresh("spell-totem","contagion"), mace = fresh("ancestral-warrior-totem","armour-breaker");
    expect(fire.preferences.map(p => p.id)).toContain("fireDamage");
    expect(chaos.preferences.map(p => p.id)).toContain("damageOverTime");
    expect(chaos.preferences.map(p => p.id)).not.toContain("criticalChance");
    expect(passivePreferenceValues(node("20% increased Damage with Maces","10% increased Critical Hit Chance for Spells"),mace)).toEqual({ attackDamage: 20 });
    expect(passivePreferenceValues(node("20% increased Damage with Maces","10% increased Critical Hit Chance for Spells"),fire)).toEqual({ criticalChance: 10 });
    expect(observed("spell-totem","base",undefined,"ContagionPlayer").player.TotalDot).toBeGreaterThan(0);
    for (const id of ["spell-totem","ancestral-warrior-totem"]) {
      expect(observed(id,"ProlongedDurationSupportPlayerTwo").player.TotemDuration).toBe(observed(id).player.TotemDuration);
      expect(summary(id,"prolonged-duration-ii")).toContain("remained 8.019 seconds");
    }
    expect(observed("spell-totem","base",undefined,"FireballPlayer").player).toMatchObject({ AverageHit: 299.6 });
    expect(observed("spell-totem","base","30% increased Totem Damage","FireballPlayer").player).toMatchObject({ AverageHit: 389.48 });
    expect(observed("spell-totem","base","Minions deal 30% increased Damage","FireballPlayer").player).toMatchObject({ AverageHit: 299.6 });
  });

  it("rejects missing or incompatible proxy selections only in weighted mode", () => {
    const request = routeRequest();
    for (const socketedProxySkillId of [undefined,"spark","__proto__",2,{}]) {
      const invalid = { ...request, socketedProxySkillId } as BuildGoalsOptimizeRequest;
      expect(createBuildGoalsValidation(invalid).issues).toContainEqual(expect.objectContaining({ code: "socketed-proxy" }));
      expect(optimizeWeightedBuildGoals(invalid,undefined,{ maxIterations: 1 }).status).toBe("error");
      expect(runOptimizerRequest({ ...invalid, mode: "shortest" })).toMatchObject(optimizeBuildGoals({ ...request, mode: "shortest" }));
    }
    expect(createBuildGoalsValidation(request).issues).toEqual([]);
    expect(createBuildGoalsValidation({ ...request, focusSkillId: "arc" }).issues).toContainEqual(expect.objectContaining({ code: "socketed-proxy" }));
  });

  it.each(["fireball","arc"])("passes %s into weighted route scoring without changing Shortest or budgets", socketedProxySkillId => {
    const request = { ...routeRequest(), ...fresh("spell-totem",socketedProxySkillId), extraPointBudget: 1 };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success");
    expect(result.totalNodeIds).toContain(socketedProxySkillId === "fireball" ? "fire" : "lightning");
    expect(result.totalNodeIds).not.toContain(socketedProxySkillId === "fireball" ? "lightning" : "fire");
    expect(result.pointCost).toBe(3);
    expect(result.weighted?.score).toBe(6);
    expect(runOptimizerRequest({ ...request, mode: "shortest" })).toMatchObject(optimizeBuildGoals({ ...request, mode: "shortest" }));
  });
});

function routeRequest(): BuildGoalsOptimizeRequest {
  const edges = [["start","plain"],["plain","goal"],["start","fire"],["fire","bridge"],["bridge","goal"],["start","lightning"],["lightning","bridge"]];
  const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
    nodes: Object.fromEntries(["start","plain","goal","fire","lightning","bridge"].map(id => [id,{ ...node(), id,
      stats: id === "fire" ? ["20% increased Fire Damage"] : id === "lightning" ? ["20% increased Lightning Damage"] : [], flags: id === "start" ? { classStart: true } : {} }])),
    edges: edges.map(([from,to]) => ({ from,to })), groups: {}, classStarts: { witch: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
  return { graph, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3,
    ...fresh("spell-totem","fireball"), extraPointBudget: 1 };
}

import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defensiveBuffFixtures as fixtures, defensiveBuffNativeObservations as native } from "./defensiveBuffSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset, skillPreferencePresets } from "./skillPreferencePresets";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, setSkillSupport } from "./skillSupportPreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals, type BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", flags: {}, stats, position: { x: 0, y: 0 } });
const fresh = (id: string) => addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [] },preset(id));
const observed = (id: string, support = "base", extra?: string, state = "baseline", child?: boolean) => native.find(n => n.id === id && n.support === support
  && n.state === state && (child === undefined || n.child === child) && ("extra" in n ? n.extra : undefined) === extra)!;
const summary = (id: string, support: string) => preCommon45SupportsFor(id).find(s => s.id === support)!.summary;
const banners = ["war-banner","defiance-banner","dread-banner"];
const area = ["magnified-area-i","magnified-area-ii"], duration = ["prolonged-duration-i","prolonged-duration-ii"];
const brutality = ["brutality-i","brutality-ii","brutality-iii"];
const reviewed: Record<string, string[]> = {
  "war-banner": [...area,...duration,"mobility"], "defiance-banner": [...area,...duration,"mobility"], "dread-banner": [...area,...duration,"mobility"],
  "arctic-armour": ["controlled-destruction"], "barkskin": duration, "ghost-dance": [], "grim-feast": ["mobility","rapid-casting-i","rapid-casting-ii"],
  "iron-ward": [...area,"mobility","concentrated-area",...brutality], "magma-barrier": [...area,"concentrated-area"],
  "scavenged-plating": duration, "time-of-need": [], "wind-dancer": [...area,"concentrated-area",...brutality],
};

describe("twelve Banner and defensive/recovery focuses", () => {
  it.each(fixtures)("keeps $name's independent source identity, scoped ownership and reviewed support subset", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: [...f.tags] });
    const links = preCommon45SupportsFor(f.id);
    expect(links.map(s => s.id).sort()).toEqual([...reviewed[f.id]].sort());
    const legal = new Set<string>([...f.parentLegal,...f.children.flatMap(c => c.legal)]);
    for (const link of links) {
      expect(legal.has(link.effectId),`${f.id}: ${link.effectId}`).toBe(true);
      const settings = fresh(f.id), selected = setSkillSupport(settings,link.id,true);
      expect(selected.preferences).toEqual(settings.preferences);
      expect(applySkillSupportPriorities(selected,p).preferences).toEqual(settings.preferences);
      expect(link.summary).toBeTruthy();
    }
    expect(normalizeSkillSupportIds(f.id,["efficiency-i","efficiency-ii","considered-casting","spell-echo","feeding-frenzy-i","rapid-attacks-ii"])).toEqual([]);
    expect(p.passiveStatScopes ?? []).toEqual(banners.includes(f.id) ? ["bannerAuraMagnitude","bannerAreaOfEffect","bannerGloryGeneration"]
      : f.id === "arctic-armour" ? ["spellCriticalChance","spellCriticalDamageBonus"] : []);
  });

  it.each(fixtures)("preserves $name, manual priorities, goals and budgets through save/export round-trips", f => {
    const current: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 8, pointBudgetMode: "all-available",
      preferences: [{ id: "energyShield", weight: 1 },{ id: "cooldownRecoveryRate", weight: 1 },{ id: "auraMagnitude", weight: 2 }] };
    const selected = addSkillPresetPreferences(current,preset(f.id));
    expect(selected.preferences.slice(0,3)).toEqual(current.preferences);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    const [saved] = normalizeSavedBuilds([{ id: "defence", name: f.name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "witch", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    expect(saved.state.optimizerSettings).toEqual(selected);
    expect(saved.state.buildGoalNodeIds).toEqual(["goal"]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
  });

  it.each(banners)("scores %s's Aura, Glory, area and duration separately, never recipient damage or defence", id => {
    const current = fresh(id);
    expect(current.preferences).toEqual([{ id: "auraMagnitude", weight: 3 },{ id: "gloryGeneration", weight: 2 },{ id: "skillDuration", weight: 2 },{ id: "areaOfEffect", weight: 1 }]);
    expect(scorePassiveNode(node("100% increased Attack Damage","30% increased Attack Speed","100% increased Accuracy Rating",
      "100% increased Armour","100% increased Evasion Rating","+5% to all Maximum Elemental Resistances","Minions deal 100% increased Damage"),current.preferences,current)).toBe(0);
    const base = observed(id,"base",undefined,"planted").output;
    expect(observed(id,"base","Aura Skills have 20% increased Magnitudes","planted").output).toMatchObject({ AuraEffectMod: 1.2 });
    expect(observed(id,"base","Banner Skills have 20% increased Aura Magnitudes","planted").output).toMatchObject({ AuraEffectMod: 1.2 });
    expect(observed(id,"base","Banner Skills have 20% reduced Aura Magnitudes","planted").output).toMatchObject({ AuraEffectMod: 0.8 });
    expect(observed(id,"base","Banner Skills have 20% increased Area of Effect","planted").output).toMatchObject({ AreaOfEffectMod: 1.2, AuraEffectMod: base.AuraEffectMod });
    expect(observed(id,"ProlongedDurationSupportPlayerTwo").output).toMatchObject({ Duration: 13.233, SpiritReserved: 30, ManaCost: 0 });
    expect(base).toMatchObject({ Duration: 9.801, SpiritReserved: 30, ManaCost: 0 });
    expect(summary(id,"magnified-area-ii")).toContain("not its recipient stats or Glory rate");
    expect(preset(id).suggestions.find(s => s.id === "gloryGeneration")?.reason).toContain("not immediate or maximum Glory");
  });

  it("counts signed generic and reviewed Banner modifiers once without leaking scope or ownership", () => {
    const passive = node("Aura Skills have 20% increased Magnitudes","Banner Skills have 15% increased Aura Magnitudes","Banner Skills have 5% reduced Aura Magnitudes",
      "10% increased Glory generation","15% increased Glory generation for Banner Skills","5% reduced Glory generation for Banner Skills",
      "10% increased Area of Effect","Banner Skills have 12% increased Area of Effect","Banner Skills have 2% reduced Area of Effect");
    expect(passivePreferenceValues(passive,{ focusSkillId: "war-banner" })).toEqual({ auraMagnitude: 30, gloryGeneration: 20, areaOfEffect: 20 });
    expect(scorePassiveNode(passive,[{ id: "auraMagnitude", weight: 3 },{ id: "gloryGeneration", weight: 2 },{ id: "areaOfEffect", weight: 1 }],{ focusSkillId: "war-banner" })).toBe(15);
    for (const focusSkillId of [...skillPreferencePresets.map(p => p.id),undefined,"__proto__"]) {
      const values = passivePreferenceValues(passive,{ focusSkillId });
      expect(values).toEqual(banners.includes(focusSkillId ?? "") ? { auraMagnitude: 30, gloryGeneration: 20, areaOfEffect: 20 } : { auraMagnitude: 20, gloryGeneration: 10, areaOfEffect: 10 });
    }
    expect(passivePreferenceValues(node("Aura Skills have 2.5% reduced Magnitudes","1.5% reduced Glory generation"))).toEqual({ auraMagnitude: -2.5, gloryGeneration: -1.5 });
    for (const text of ["Allies in your Presence have 30% increased Glory generation","Body Armour grants 60% increased Glory generation",
      "Banner Skills have 20% increased Aura Magnitudes while on Full Life","Aura Skills have 20% more Magnitudes","20% increased Glory generation per Charge",
      "Minions have 20% increased Glory generation","10% increased Glory generation and an unknown effect","Aura Skills have +10% increased Magnitudes",
      "1.2.3% increased Glory generation","1.% increased Glory generation","Aura Skills have 1.2.3% increased Magnitudes"]) {
      expect(passivePreferenceValues(node(text),{ focusSkillId: "war-banner" }),text).toEqual({});
    }
  });

  it("keeps Barkskin's ES-loss and Item Armour cap separate from old Bark/Evasion and free generation", () => {
    expect(preset("barkskin").suggestions.map(s => s.id)).toEqual(["armour","energyShield","skillDuration"]);
    expect(preset("barkskin").description).toContain("capped by Item Armour");
    expect(preset("barkskin").description).toContain("native gain is unmodeled");
    expect(observed("barkskin","ProlongedDurationSupportPlayerTwo").output).toMatchObject({ Duration: 8.118, SpiritReserved: 30 });
    expect(observed("barkskin").output).toMatchObject({ Duration: 6.006, Armour: 63 });
  });

  it.each([["ghost-dance",10.131,8.448],["time-of-need",8.118,6.765]] as const)("uses %s cooldown-scaled repeat timing, not generic duration or regeneration", (id,base,faster) => {
    expect(observed(id).output).toMatchObject({ Cooldown: base, LifeRegen: 0 });
    expect(observed(id,"base","20% increased Cooldown Recovery Rate").output).toMatchObject({ Cooldown: faster });
    expect(observed(id,"base","30% increased Skill Effect Duration").output).toMatchObject({ Cooldown: base });
    expect(observed(id,"base","30% increased Life Regeneration Rate").output).toMatchObject({ Cooldown: base, LifeRegen: 0 });
    expect(preset(id).suggestions.map(s => s.id)).not.toContain("lifeRegenerationRate");
    expect(preset(id).suggestions.map(s => s.id)).not.toContain("skillDuration");
    expect(preset(id).description.toLowerCase()).toContain("native");
  });

  it("does not turn current Grim Feast into ES overflow, generic damage or free resurrection count", () => {
    const current = fresh("grim-feast");
    expect(current.preferences.map(p => p.id)).toEqual(["presenceArea","castSpeed","cooldownRecoveryRate"]);
    expect(preset("grim-feast").description).toContain("Not the old ES-overflow mechanic");
    expect(preset("grim-feast").description).toContain("higher Minion Life does not guarantee more revivals");
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","Minions have 100% increased maximum Life","100% increased Spell Damage"),current.preferences,current)).toBe(0);
    expect(observed("grim-feast","base",undefined,"baseline",true).output).toMatchObject({ effect: "GrimFeastResummonPlayer", Cooldown: 1.023, ManaCost: 0, SpiritReserved: 30 });
    expect(observed("grim-feast","SupportRapidCastingPlayerTwo").output.Speed).toBe(observed("grim-feast","base",undefined,"baseline",true).output.Speed);
    expect(summary("grim-feast","rapid-casting-ii")).toContain("capped by its cooldown");
  });

  it("keeps Arctic's source-based Cold spell retaliation and critical prohibition separate from cast cadence or Armour", () => {
    expect(preset("arctic-armour").suggestions.map(s => s.id)).toEqual(["coldDamage","spellDamage","elementalDamage","cooldownRecoveryRate"]);
    expect(preset("arctic-armour").description).toContain("stage damage is missing");
    expect(observed("arctic-armour").output).toMatchObject({ AverageHit: 0, Speed: 0, CritChance: 11, SpiritReserved: 30 });
    expect(observed("arctic-armour","SupportControlledDestructionPlayer").output.CritChance).toBe(0);
    expect(passivePreferenceValues(node("20% increased Critical Hit Chance for Spells","20% increased Attack Damage"),{ focusSkillId: "arctic-armour" })).toEqual({ criticalChance: 20, attackDamage: 20 });
    expect(refineSkillPreferencePreset(preset("arctic-armour"),["controlled-destruction"]).passiveStatScopes).toEqual([]);
    expect(passivePreferenceValues(node("20% increased Critical Hit Chance for Spells"),{ focusSkillId: "arctic-armour", supportGemIds: ["controlled-destruction"] })).toEqual({});
  });

  it("separates conditional mitigation/storage, Shield block and stage Evasion from granted hit damage", () => {
    expect(fresh("iron-ward").preferences.map(p => p.id)).toEqual(["armour","areaOfEffect"]);
    expect(fresh("magma-barrier").preferences.map(p => p.id)).toEqual(["blockChance","areaOfEffect"]);
    expect(fresh("wind-dancer").preferences.map(p => p.id)).toEqual(["evasion","areaOfEffect"]);
    expect(observed("magma-barrier").output.BlockChance).toBe(32.5);
    expect(observed("wind-dancer","base",undefined,"one-stack").output.Evasion).toBe(1108);
    expect(observed("wind-dancer").output.Evasion).toBe(1007);
    for (const id of ["iron-ward","magma-barrier","wind-dancer"]) {
      const settings = fresh(id);
      expect(scorePassiveNode(node("100% increased Physical Damage","100% increased Attack Damage","100% increased Fire Damage","100% increased Area Damage"),settings.preferences,settings)).toBe(0);
      expect(summary(id,"concentrated-area")).toContain("Persistent defence");
      expect(summary(id,"concentrated-area")).toContain("50% less area");
      expect(normalizeSkillSupportIds(id,["rapid-attacks-i","rapid-casting-i"])).toEqual([]);
    }
    expect(preset("scavenged-plating").description).toContain("Fully Breaking enemy Armour");
    expect(observed("scavenged-plating").output).toMatchObject({ Armour: 63, Duration: 8.019 });
    expect(observed("scavenged-plating","base",undefined,"one-stack").output.Armour).toBe(66);
    expect(observed("scavenged-plating","ProlongedDurationSupportPlayerTwo").output.Duration).toBe(10.824);
  });

  it("matches only the reviewed complete Aura/Glory main-tree wordings", () => {
    const graph = JSON.parse(readFileSync("data/tree-graph.json","utf8")) as TreeGraph;
    const matches = new Set<string>();
    for (const n of Object.values(graph.nodes).filter(n => !n.flags.ascendancy && !n.flags.classStart && !n.flags.mastery)) for (const text of n.stats) {
      const v = passivePreferenceValues(node(text),{ focusSkillId: "war-banner" });
      if (v.auraMagnitude !== undefined || v.gloryGeneration !== undefined) matches.add(text);
    }
    expect([...matches].sort()).toEqual(["15% increased Glory generation","20% increased Glory generation","20% increased Glory generation for Banner Skills","8% increased Glory generation",
      "Aura Skills have 10% increased Magnitudes","Aura Skills have 12% increased Magnitudes","Aura Skills have 14% increased Magnitudes","Aura Skills have 5% increased Magnitudes","Aura Skills have 6% increased Magnitudes",
      "Banner Skills have 12% increased Aura Magnitudes","Banner Skills have 15% increased Aura Magnitudes"].sort());
  });

  it("uses Banner-only value in weighted routing within the same budget, leaving Shortest unchanged", () => {
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "fixture", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start","plain","goal","aura","bridge"].map(id => [id,{ ...node(),id,flags: id === "start" ? { classStart: true } : {},
        stats: id === "aura" ? ["Banner Skills have 20% increased Aura Magnitudes"] : [] }])),
      edges: [["start","plain"],["plain","goal"],["start","aura"],["aura","bridge"],["bridge","goal"]].map(([from,to]) => ({ from,to })),
      groups: {}, classStarts: { witch: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request: BuildGoalsOptimizeRequest = { graph, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3,
      ...fresh("war-banner"), extraPointBudget: 1 };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.totalNodeIds).toContain("aura"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(6);
    expect(runOptimizerRequest({ ...request, mode: "shortest" })).toMatchObject(optimizeBuildGoals({ ...request, mode: "shortest" }));
    expect(optimizeWeightedBuildGoals({ ...request, focusSkillId: "time-of-need" },undefined,{ maxIterations: 8 }).weighted?.score).toBe(0);
  });
});

import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { spellUtilityFixtures as fixtures, spellUtilityDamageObservations, spellUtilityDotObservations } from "./spellUtilitySkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset, skillPreferencePresets } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, setSkillSupport } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals, type BuildGoalsOptimizeRequest } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7,
  preferences: [{ id: "energyShield", weight: 3 },{ id: "criticalChance", weight: 2 }] });
type Native = { support: string; ManaCost: number; AverageHit?: number; TotalDot: number; SpiritReserved: number; CritChance: number; Speed: number;
  Duration?: number; AreaOfEffectRadius?: number; ProjectileSpeedMod?: number; ManaPerSecondCost: number };
const observed = (id: string, support = "base"): Native => fixtures.find(f => f.id === id)!.native.find(n => n.support === support)!;
const summary = (id: string, support: string) => preCommon45SupportsFor(id).find(s => s.id === support)!.summary;

describe("remaining spell and utility breadth batch", () => {
  it.each(fixtures)("keeps $name's exact identity and selected component separate from tags and granted children", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: f.tags });
    for (const scope of ["spellCriticalChance","spellCriticalDamageBonus","spellHinderChance"] as const) expect(p.passiveStatScopes?.includes(scope)).toBe(f.hit);
    expect(p.passiveStatScopes?.includes("spellAreaDamage")).toBe(f.area);
    expect(p.passiveStatScopes?.includes("spellAreaOfEffect")).toBe(f.coverage);
    expect(p.passiveStatScopes?.includes("spellProjectileSpeed")).toBe(f.projectile);
    expect(p.passiveStatScopes?.some(s => s.startsWith("attack") || s.startsWith("quarterstaff") || s.startsWith("bow"))).toBe(false);
    expect(p.suggestions.some(s => s.id === "spellDamage")).toBe(f.hit || f.dot);
    expect(p.suggestions.some(s => s.id === "damageOverTime")).toBe(f.dot);
    expect(p.suggestions.some(s => s.id === "curseMagnitude")).toBe(f.curse);
    expect(p.suggestions.some(s => s.id === "spellAreaDamage")).toBe(f.area);
    expect(p.suggestions.some(s => s.id === "castSpeed")).toBe(f.id !== "charged-staff");
    expect(p.suggestions.some(s => ["criticalChance","criticalDamageBonus","attackDamage","attackSpeed","minionDamage"].includes(s.id))).toBe(false);
    if (f.utility || f.curse) expect(p.exclusions.map(e => e.id)).toEqual(expect.arrayContaining(["spellDamage","damageOverTime","criticalChance","criticalDamageBonus"]));
  });

  it.each(fixtures)("scores $name's signed scoped modifiers once without crossing owners or secondary components", f => {
    const current = addSkillPresetPreferences(settings(f.id),preset(f.id));
    expect(passivePreferenceValues(node("20% increased Critical Hit Chance for Spells","5% reduced Critical Hit Chance for Spells",
      "20% increased Critical Spell Damage Bonus","5% reduced Critical Spell Damage Bonus","10% increased Spell Area Damage",
      "10% increased Area Damage","15% increased Projectile Speed for Spell Skills","Spell Skills have 10% reduced Area of Effect"),current))
      .toEqual({ ...(f.hit ? { criticalChance: 15, criticalDamageBonus: 15 } : {}), ...(f.area ? { spellAreaDamage: 10, areaDamage: 10 } : {}),
        ...(f.projectile ? { projectileSpeed: 15 } : {}), ...(f.coverage ? { areaOfEffect: -10 } : {}) });
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","Totems deal 100% increased Damage","100% increased Damage with Quarterstaves"),current.preferences,current)).toBe(0);
    expect(passivePreferenceValues(node("20% increased Spell Area Damage while Channelling","20% increased Critical Hit Chance for Spells per Power Charge"),current)).toEqual({});
  });

  it.each(fixtures)("offers $name's native-compatible reviewed links without silently applying priorities", f => {
    const links = preCommon45SupportsFor(f.id);
    expect(links.map(s => s.effectId).sort()).toEqual([...f.supports].sort());
    for (const link of links) {
      const before = addSkillPresetPreferences(settings(f.id),preset(f.id));
      const selected = setSkillSupport(before,link.id,true);
      expect(selected.preferences).toEqual(before.preferences);
      const value = node("20% increased Spell Damage");
      expect(scorePassiveNode(value,selected.preferences,selected)).toBe(scorePassiveNode(value,before.preferences,before));
      const applied = applySkillSupportPriorities(selected,preset(f.id));
      if (["considered-casting","spell-echo"].includes(link.id)) expect(applied.preferences).toContainEqual({ id: "castSpeed", weight: 2 });
      else if (link.id === "ritualistic-curse") expect(applied.preferences).toContainEqual({ id: "curseActivation", weight: 2 });
      else if (link.id === "concentrated-area" && f.area) expect(applied.preferences).toContainEqual({ id: "areaOfEffect", weight: 2 });
      else expect(applied.preferences).toEqual(before.preferences);
      if (link.id.startsWith("brutality")) {
        const refined = refineSkillPreferencePreset(preset(f.id),[link.id]);
        expect(refined.suggestions.some(s => ["fireDamage","coldDamage","chaosDamage","elementalDamage"].includes(s.id))).toBe(false);
        if (f.id !== "tornado") expect(refined.suggestions.some(s => ["spellDamage","spellAreaDamage","projectileDamage","damageOverTime"].includes(s.id))).toBe(false);
      }
      if (link.id === "controlled-destruction") {
        const refined = refineSkillPreferencePreset(preset(f.id),[link.id]);
        expect(refined.passiveStatScopes).not.toContain("spellCriticalChance");
        expect(refined.passiveStatScopes).not.toContain("spellCriticalDamageBonus");
        expect(selected.preferences).toContainEqual({ id: "criticalChance", weight: 2 });
      }
    }
    expect(normalizeSkillSupportIds(f.id,["rapid-casting-ii","rapid-casting-i","rapid-casting-iii","efficiency-ii","efficiency-i"]))
      .toEqual(["rapid-casting-ii","efficiency-ii"]);
    if (!f.hit) expect(links.some(s => s.id === "considered-casting" || s.id === "controlled-destruction")).toBe(false);
  });

  it.each(fixtures)("independently checks $name's native Mana, duration and area rounding", f => {
    const base = observed(f.id);
    expect(observed(f.id,"SupportEfficiencyPlayerTwo").ManaCost).toBe(Math.ceil(base.ManaCost*.6));
    const area = f.native.find(n => n.support === "SupportMagnifiedAreaPlayerTwo") as Native | undefined;
    if (area) {
      expect(area.ManaCost).toBe(Math.floor(base.ManaCost*1.3));
      if (base.AreaOfEffectRadius) expect(area.AreaOfEffectRadius).toBe(Math.floor(base.AreaOfEffectRadius*1.2));
    }
    if ("durationBase" in f) {
      expect(base.Duration).toBeCloseTo(Math.ceil(f.durationBase/.033)*.033,10);
      expect(observed(f.id,"ProlongedDurationSupportPlayerTwo").Duration).toBeCloseTo(Math.ceil(f.durationBase*1.35/.033)*.033,10);
    }
    if (f.curse) {
      expect(observed(f.id,"SupportFocusedCursePlayer").ManaCost).toBe(Math.floor(base.ManaCost*1.2));
      expect(summary(f.id,"focused-curse")).toContain("750 ms");
      expect(summary(f.id,"ritualistic-curse")).toContain("1950 ms");
      expect(1500*.5).toBe(750); expect(1500*1.3).toBe(1950);
    }
    const brute = f.native.find(n => n.support === "SupportBrutalityPlayerThree") as Native | undefined;
    if (brute) expect(brute.ManaCost).toBe(Math.floor(base.ManaCost*1.2));
  });

  it.each(spellUtilityDamageObservations)("independently checks $id's hits and support penalties without estimating repeated damage", f => {
    expect(f.hit).toBeCloseTo((f.source[0]+f.source[1])/2*(1+f.crit/100),10);
    expect(f.controlled).toBe(f.source.map(v => Math.round(v*1.25)).reduce((a,b) => a+b,0)/2);
    expect(f.considered).toBeCloseTo(f.source.map(v => Math.round(v*1.35)).reduce((a,b) => a+b,0)/2*(1+f.crit/100),10);
    expect(f.concentrated).toBeCloseTo(f.id === "frost-darts" ? f.hit : f.source.map(v => Math.round(v*1.3)).reduce((a,b) => a+b,0)/2*(1+f.crit/100),10);
    expect(observed(f.id).AverageHit).toBe(f.hit);
    expect(observed(f.id,"SupportControlledDestructionPlayer").CritChance).toBe(0);
    expect(observed(f.id,"SupportBrutalityPlayerThree").AverageHit).toBe(0);
  });

  it.each(spellUtilityDotObservations)("keeps $id's DoT rate, duration, area and hit mechanics separate", f => {
    expect(f.dot).toBeCloseTo(f.perMinute/60,9);
    expect(f.spell).toBeCloseTo(f.dot*2,9); expect(f.increasedDot).toBeCloseTo(f.dot*2,9);
    expect(f.area).toBe(f.dot); expect(f.spellArea).toBe(f.dot); expect(f.minion).toBe(f.dot);
    expect(f.brutality).toBeCloseTo(f.id === "tornado" ? f.dot*1.3 : 0,9);
    expect(observed(f.id).TotalDot).toBe(f.dot);
    expect(observed(f.id,"ProlongedDurationSupportPlayerTwo").TotalDot).toBe(f.dot);
    expect(observed(f.id,"SupportConcentratedAreaPlayer").TotalDot).toBe(f.dot);
    expect(preset(f.id).passiveStatScopes).not.toContain("areaDamageOverTime");
    expect(summary(f.id,"concentrated-area")).toContain("no native damage benefit");
  });

  it("preserves non-damage utility limits and native-source disagreements instead of inventing benefit", () => {
    expect(observed("convalescence").SpiritReserved).toBe(30);
    expect(observed("convalescence","SupportEfficiencyPlayerTwo")).toMatchObject({ ManaCost: 12, SpiritReserved: 30 });
    expect(summary("convalescence","efficiency-ii")).toContain("parent still reserves 30 Spirit");
    expect(preset("convalescence").suggestions.map(s => s.id)).toContain("energyShieldRechargeRate");
    expect(preset("convalescence").exclusions.find(e => e.id === "energyShieldRechargeStart")).toBeDefined();
    expect(preset("charged-staff").description).toContain("separately granted attack shockwave");
    expect(observed("charged-staff","SupportRapidCastingPlayerTwo").Speed).toBe(observed("charged-staff").Speed);
    expect(preset("mana-tempest").suggestions.map(s => s.id)).toEqual(["manaRegenerationRate","castSpeed"]);
    expect(observed("mana-tempest")).toMatchObject({ ManaCost: 0, ManaPerSecondCost: 0 });
    expect(summary("mana-tempest","efficiency-ii")).toContain("no free upkeep");
    expect(summary("volcano","projectile-acceleration-ii")).toContain("Only affects the separate sprays");
    expect(summary("frost-darts","concentrated-area")).toContain("initial dart damage is unchanged");
    expect(summary("profane-ritual","prolonged-duration-ii")).toContain("delays completion");
    for (const id of ["elemental-weakness","temporal-chains"]) expect(summary(id,"spell-echo")).toContain("Repeated curses replace");
    expect(fixtures.reduce((n,f) => n+f.supports.length,0)).toBe(142);
  });

  it("round-trips the twelve choices and common tiers while preserving manual priorities and budgets", () => {
    for (const f of fixtures) {
      const current = addSkillPresetPreferences(setSkillSupport(setSkillSupport(settings(f.id),"rapid-casting-i",true),"rapid-casting-ii",true),preset(f.id));
      expect(current.preferences.slice(0,2)).toEqual(settings(f.id).preferences); expect(current.supportGemIds).toEqual(["rapid-casting-ii"]);
      expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
      const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
        selectedClassStartId: "sorceress", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
        allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
      } }]);
      expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    }
  });

  it("closes the frozen positive-tier Spell group without redefining all catalog entries as live skills", () => {
    const catalog = JSON.parse(readFileSync("tools/coverage/catalog.json","utf8")) as { entries: { id: string; tier: number; type: string; support: boolean }[] };
    expect(catalog.entries.filter(e => !e.support && e.tier > 0 && e.type === "Spell" && !skillPreferencePresets.some(p => p.gemId === e.id))).toEqual([]);
  });

  it.each(["tornado","convalescence","elemental-weakness"])("routes %s with the existing budget and leaves Shortest unchanged", focusSkillId => {
    const edges = [["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]];
    const stat = focusSkillId === "tornado" ? "20% increased Spell Damage" : focusSkillId === "convalescence" ? "20% increased Energy Shield Recharge Rate" : "20% increased Curse Magnitudes";
    const preference = focusSkillId === "tornado" ? "spellDamage" : focusSkillId === "convalescence" ? "energyShieldRechargeRate" : "curseMagnitude";
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "fixture", extractedAt: "fixture", source: { kind: "fixture", path: "fixture" },
      nodes: Object.fromEntries(["start","plain","goal","good","bridge"].map(id => [id,{ ...node(), id, stats: id === "good" ? [stat] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from,to]) => ({ from,to })), groups: {}, classStarts: { sorceress: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request: BuildGoalsOptimizeRequest = { graph, mode: "weighted", baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], focusSkillId, extraPointBudget: 1, preferences: [{ id: preference, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBeCloseTo(focusSkillId === "elemental-weakness" ? 20/6 : 2,10);
    const shortest = { ...request, mode: "shortest" as const }; expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
});

import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { spearPrimaryFixtures as fixtures, spearPrimarySupportIds as supportIds, spearNativeControls } from "./spearPrimarySkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, setSkillSupport } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, preferences: [{ id: "life", weight: 3 }] });

describe("reviewed spear primary breadth batch", () => {
  it.each(fixtures)("preserves $name's identity and explicit component/handedness scopes", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: f.tags });
    for (const scope of ["spearAttackDamage","spearAttackSpeed","spearCriticalChance","spearCriticalDamageBonus","oneHandedWeaponDamage","oneHandedWeaponAttackSpeed","oneHandedMeleeAttackSpeed","oneHandedMeleeCriticalChance","oneHandedMeleeCriticalDamageBonus","oneHandedAttackAilmentChance"] as const) {
      expect(p.passiveStatScopes).toContain(scope);
    }
    expect(p.passiveStatScopes?.includes("spearAccuracy")).toBe(f.accuracy);
    expect(p.passiveStatScopes?.includes("oneHandedMeleeAccuracy")).toBe(f.accuracy);
    expect(p.passiveStatScopes?.includes("meleeDamage")).toBe(f.melee);
    expect(p.passiveStatScopes?.includes("meleeStunBuildup")).toBe(f.melee);
    expect(p.passiveStatScopes?.includes("attackAreaDamage")).toBe(f.areaDamage);
    expect(p.passiveStatScopes?.includes("attackElementalDamage")).toBe(Boolean(f.element));
    expect(p.passiveStatScopes?.includes("twoHandedWeaponDamage")).toBe(false);
    expect(p.suggestions.some(s => s.id === "projectileDamage")).toBe(f.projectile);
    expect(p.suggestions.some(s => s.id === "physicalDamage")).toBe(f.conversion !== 1);
    expect(p.suggestions.some(s => ["criticalChance","criticalDamageBonus","accuracy","skillDuration","damageOverTime"].includes(s.id))).toBe(false);
  });

  it.each(fixtures)("matches $name's signed weapon, melee and area effects once without ownership leakage", f => {
    const current = addSkillPresetPreferences(settings(f.id),preset(f.id));
    expect(passivePreferenceValues(node("20% increased Damage with Spears","5% reduced Damage with Spears","10% increased Melee Damage",
      "20% increased Attack Area Damage","5% reduced Attack Area Damage","20% increased Elemental Damage with Attacks",
      "100% increased Damage with Bows","100% increased Spell Area Damage"),current))
      .toEqual({ attackDamage: f.melee ? 25 : 15, ...(f.areaDamage ? { attackAreaDamage: 15 } : {}), ...(f.element ? { elementalDamage: 20 } : {}) });
    expect(passivePreferenceValues(node("12% increased Critical Hit Chance with Spears","5% reduced Critical Hit Chance with Spears",
      "20% increased Critical Damage Bonus with One Handed Melee Weapons","3% increased Attack Speed with Spears","5% increased Attack Speed with One Handed Weapons"),current))
      .toEqual({ criticalChance: 7, criticalDamageBonus: 20, attackSpeed: 8 });
    expect(passivePreferenceValues(node("12% increased Accuracy Rating with Spears","5% reduced Accuracy Rating with Spears","10% increased Accuracy Rating with One Handed Melee Weapons"),current))
      .toEqual(f.accuracy ? { accuracy: 17 } : {});
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","Totems deal 100% increased Damage","100% increased Spell Damage"),current.preferences,current)).toBe(0);
    expect(passivePreferenceValues(node("20% increased Damage with Spears per Frenzy Charge","20% increased Area Damage while Channelling"),current)).toEqual({});
    expect(passivePreferenceValues(node("20% increased Area Damage","5% reduced Area Damage"),current)).toEqual(f.areaDamage ? { areaDamage: 15 } : {});
  });

  it.each(fixtures)("offers $name's reviewed supports without changing manual priorities or applying damage multipliers", f => {
    const expected = supportIds.filter(id => f.projectileSupport || !id.startsWith("projectile-acceleration"));
    expect(preCommon45SupportsFor(f.id).map(s => s.id)).toEqual(expected);
    for (const support of expected) {
      const before = addSkillPresetPreferences(settings(f.id),preset(f.id));
      const selected = setSkillSupport(before,support,true);
      expect(selected.preferences).toEqual(before.preferences);
      const refined = refineSkillPreferencePreset(preset(f.id),[support]);
      const value = node("20% increased Damage with Spears");
      expect(scorePassiveNode(value,before.preferences,before)).toBe(scorePassiveNode(value,selected.preferences,selected));
      const applied = applySkillSupportPriorities(selected,preset(f.id));
      if (support === "concentrated-area" && f.areaDamage) expect(applied.preferences).toContainEqual({ id: "areaOfEffect", weight: 2 });
      else expect(applied.preferences).toEqual(before.preferences);
      if (support.startsWith("brutality")) {
        expect(refined.suggestions.some(s => ["fireDamage","coldDamage","lightningDamage","elementalDamage"].includes(s.id))).toBe(false);
        if (f.conversion === 1) expect(refined.suggestions.some(s => ["attackDamage","projectileDamage"].includes(s.id))).toBe(false);
      }
    }
    expect(normalizeSkillSupportIds(f.id,["rapid-attacks-ii","rapid-attacks-i","projectile-acceleration-i","projectile-acceleration-ii","brutality-ii","brutality-iii","spell-echo"]))
      .toEqual(["rapid-attacks-ii",...(f.projectileSupport ? ["projectile-acceleration-i"] : []),"brutality-ii"]);
  });

  it.each(fixtures)("independently checks $name's native stored ranges, timing, area and cost arithmetic", f => {
    expect(f.phys).toEqual([5,9].map(v => Math.round(v*f.multiplier*(1-f.conversion))));
    expect(f.elemental).toEqual([5,9].map(v => Math.round(v*f.multiplier*f.conversion)));
    // Keep observed native enemy-effect scaling distinct from stored damage and app scores.
    expect(f.hit).toBeCloseTo(((f.phys[0]+f.phys[1])+(f.elemental[0]+f.elemental[1])*f.nativeElementalEffect)/2*1.05,10);
    expect(f.effCost).toBe(Math.ceil(f.mana*.6)); expect(f.magCost).toBe(Math.floor(f.mana*1.3)); expect(f.brutCost).toBe(Math.floor(f.mana*1.2));
    if ("radius" in f) {
      // PoB truncates the square-root multiplier to two decimals before radius flooring.
      expect(f.magRadius).toBe(Math.floor(f.radius*Math.floor(100*Math.sqrt(1.45))/100));
      expect(f.concRadius).toBe(Math.floor(f.radius*Math.floor(100*Math.sqrt(.5))/100));
    }
    if ("cooldown" in f) {
      expect(1/f.speed).toBeCloseTo(f.cooldown,10); expect(f.rapid).toBe(f.speed);
    } else expect(1/f.rapid).toBeCloseTo((1/f.speed-f.fixedTime)/1.25+f.fixedTime,10);
    if (f.areaDamage) expect(f.concHit).toBeGreaterThan(f.hit);
    else expect(f.concHit).toBe(f.hit);
    if (f.conversion === 1) expect(f.brutHit).toBe(0);
    if ("projectileSpeed" in f && f.projectile) expect(f.projectileSpeed).toBe(1.4);
  });

  it("retains independent native controls for non-melee hazards, non-area bolts and one-handed weapon crit", () => {
    for (const c of spearNativeControls) {
      const f = fixtures.find(f => f.id === c.id)!;
      if (c.modifier === "100% increased Melee Damage" || c.modifier === "100% increased Accuracy Rating with One Handed Melee Weapons"
        || c.id === "storm-lance" && c.modifier === "100% increased Area Damage"
        || c.id === "spearfield" && c.modifier === "100% increased Projectile Damage") expect(c.hit).toBe(f.hit);
      else expect(c.hit).toBeGreaterThan(f.hit);
      if (c.modifier === "100% increased Critical Hit Chance with One Handed Melee Weapons") expect(c.crit).toBe(10);
    }
  });

  it("keeps Glory, intrinsic prohibitions, combo effects and collapse delivery distinct", () => {
    expect(preset("spear-of-solaris").exclusions.find(e => e.id === "accuracy")?.reason).toContain("always hits");
    expect(preset("spear-of-solaris").exclusions.find(e => e.id === "cooldownRecoveryRate")?.reason).toContain("not a use cooldown");
    expect(preset("blood-hunt").exclusions.find(e => e.id === "bleedingChance")?.reason).toContain("cannot cause Bleeding");
    expect(preset("primal-strikes").exclusions.find(e => e.id === "shockChance")?.reason).toContain("cannot Shock");
    expect(preset("spearfield").description).toContain("non-damaging stab");
    expect(preset("rapid-assault").description).toContain("sixth/final");
    expect(preset("disengage").suggestions.find(s => s.id === "attackSpeed")?.reason).toContain("cooldown-capped");
    expect(preCommon45SupportsFor("whirlwind-lance").find(s => s.id === "projectile-acceleration-ii")?.summary).toContain("does not improve the selected melee Whirlwind collapse");
    for (const id of ["storm-lance","glacial-lance"]) expect(preCommon45SupportsFor(id).find(s => s.id === "concentrated-area")?.summary).toContain("damage is unchanged");
  });

  it("round-trips all ten focuses, goals and support tier replacement without changing manual preferences", () => {
    for (const f of fixtures) {
      const current = addSkillPresetPreferences(setSkillSupport(setSkillSupport(settings(f.id),"rapid-attacks-i",true),"rapid-attacks-ii",true),preset(f.id));
      expect(current.preferences[0]).toEqual({ id: "life", weight: 3 }); expect(current.supportGemIds).toEqual(["rapid-attacks-ii"]);
      expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
      const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
        selectedClassStartId: "huntress", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
        allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
      } }]);
      expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    }
  });

  it.each(["spearfield","storm-lance"])("routes %s with existing point limits while keeping Shortest unchanged", focusSkillId => {
    const edges = [["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "fixture", extractedAt: "fixture", source: { kind: "fixture", path: "fixture" },
      nodes: Object.fromEntries(["start","plain","goal","good","bridge"].map(id => [id,{ ...node(), id, stats: id === "good" ? ["20% increased Damage with Spears"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from,to]) => ({ from,to })), groups: {}, classStarts: { huntress: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], focusSkillId, extraPointBudget: 1, preferences: [{ id: "attackDamage" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(2);
    const shortest = { ...request, mode: "shortest" as const }; expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
});

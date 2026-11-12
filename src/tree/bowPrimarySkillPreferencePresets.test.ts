import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { bowPrimaryFixtures as fixtures, bowPrimarySupportIds as supportIds, tornadoDotControls } from "./bowPrimarySkills.fixtures";
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

describe("reviewed bow primary breadth batch", () => {
  it.each(fixtures)("preserves $name's identity and explicit component, not tag-derived damage", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: f.tags });
    expect(p.passiveStatScopes?.includes("bowAttackDamage")).toBe(f.hitFocus);
    expect(p.passiveStatScopes?.includes("bowAttackSpeed")).toBe(true);
    for (const scope of ["attackCriticalChance","attackCriticalDamageBonus","bowAccuracy","bowCriticalDamageBonus","twoHandedWeaponDamage"] as const) {
      expect(p.passiveStatScopes?.includes(scope)).toBe(f.hitFocus);
    }
    expect(p.passiveStatScopes?.includes("attackAreaDamage")).toBe(f.areaDamage);
    expect(p.passiveStatScopes?.includes("attackAreaOfEffect")).toBe(f.coverage);
    expect(p.passiveStatScopes?.includes("attackElementalDamage")).toBe(Boolean(f.element));
    expect(p.passiveStatScopes?.includes("areaDamageOverTime")).toBe(f.id === "tornado-shot");
    expect(p.suggestions.some(s => s.id === "physicalDamage")).toBe(f.conversion !== 1);
    expect(p.suggestions.some(s => ["criticalChance","criticalDamageBonus","poisonChance","cooldownRecoveryRate"].includes(s.id))).toBe(false);
  });

  it.each(fixtures)("matches signed $name scopes once with ownership and conditional rejection", f => {
    const current = addSkillPresetPreferences(settings(f.id),preset(f.id));
    expect(passivePreferenceValues(node("20% increased Damage with Bows","5% reduced Damage with Bows","3% increased Attack Speed with Bows",
      "20% increased Attack Area Damage","5% reduced Attack Area Damage","20% increased Elemental Damage with Attacks",
      "10% increased Area of Damage","100% increased Damage with Quarterstaves","100% increased Spell Area Damage"),current))
      .toEqual({ ...(f.hitFocus ? { attackDamage: 15 } : {}), attackSpeed: 3, ...(f.areaDamage ? { attackAreaDamage: 15 } : {}), ...(f.element ? { elementalDamage: 20 } : {}) });
    expect(passivePreferenceValues(node("12% increased Critical Hit Chance for Attacks","5% reduced Critical Hit Chance for Attacks","20% increased Critical Damage Bonus with Bows"),current))
      .toEqual(f.hitFocus ? { criticalChance: 7, criticalDamageBonus: 20 } : {});
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","Totems deal 100% increased Damage","100% increased Spell Damage"),current.preferences,current)).toBe(0);
    expect(passivePreferenceValues(node("20% increased Damage with Bows per Frenzy Charge","20% increased Area Damage while Channelling"),current)).toEqual({});
    expect(passivePreferenceValues(node("20% increased Area Damage","5% reduced Area Damage"),current)).toEqual(f.areaDamage || !f.hitFocus ? { areaDamage: 15 } : {});
  });

  it.each(fixtures)("reuses reviewed supports for $name without silently editing priorities or route scores", f => {
    const expected = f.id === "spiral-volley" ? supportIds.filter(id => !id.startsWith("magnified-area") && id !== "concentrated-area") : supportIds;
    expect(preCommon45SupportsFor(f.id).map(s => s.id)).toEqual(expected);
    for (const support of expected) {
      const before = addSkillPresetPreferences(settings(f.id),preset(f.id));
      const selected = setSkillSupport(before,support,true);
      expect(selected.preferences).toEqual(before.preferences);
      const refined = refineSkillPreferencePreset(preset(f.id),[support]);
      const value = node("20% increased Projectile Damage");
      expect(scorePassiveNode(value,before.preferences,before)).toBe(scorePassiveNode(value,selected.preferences,selected));
      const applied = applySkillSupportPriorities(selected,preset(f.id));
      if (support === "concentrated-area" && (f.areaDamage || !f.hitFocus)) expect(applied.preferences).toContainEqual({ id: "areaOfEffect", weight: 2 });
      else expect(applied.preferences).toEqual(before.preferences);
      if (support.startsWith("brutality")) {
        expect(refined.suggestions.some(s => ["fireDamage","coldDamage","lightningDamage","elementalDamage"].includes(s.id))).toBe(false);
        if (f.conversion === 1) expect(refined.suggestions.some(s => ["attackDamage","projectileDamage","attackAreaDamage"].includes(s.id))).toBe(false);
      }
    }
    expect(normalizeSkillSupportIds(f.id,["rapid-attacks-ii","rapid-attacks-i","projectile-acceleration-i","projectile-acceleration-ii","brutality-ii","brutality-iii","spell-echo"]))
      .toEqual(["rapid-attacks-ii","projectile-acceleration-i","brutality-ii"]);
  });

  it.each(fixtures)("checks $name's frozen native hit, cost, coverage and timing independently", f => {
    if (f.hitFocus) {
      expect(f.phys).toEqual([6,9].map(v => Math.round(v*f.multiplier*(1-f.conversion))));
      expect(f.elemental).toEqual([6,9].map(v => Math.round(v*f.multiplier*(f.conversion+f.gainFire))));
      expect(f.hit).toBeCloseTo((f.phys[0]+f.phys[1]+f.elemental[0]+f.elemental[1])/2*1.05,10);
      if ("concHit" in f) {
        if (f.areaDamage) expect(f.concHit).toBeGreaterThan(f.hit);
        else expect(f.concHit).toBe(f.hit);
      }
      if (f.conversion === 1) expect(f.brutHit).toBe(0);
    }
    expect(f.effCost).toBe(Math.ceil(f.mana*.6));
    expect(f.brutCost).toBe(Math.floor(f.mana*1.2));
    if ("magCost" in f) expect(f.magCost).toBe(Math.floor(f.mana*1.3));
    if ("magRadius" in f) {
      expect(f.magRadius).toBe(Math.floor(f.radius*Math.sqrt(1.45)));
      expect(f.concRadius).toBe(Math.floor(f.radius*Math.sqrt(.5)));
    }
    expect(1/f.rapid).toBeCloseTo((1/f.speed-f.fixedTime)/1.25+f.fixedTime,10);
    expect(f.projectileSpeed).toBe(1.4);
    if ("perMinute" in f) {
      expect(f.mana).toBe(0); expect(f.channel).toBe(Math.floor(f.perMinute/60));
      // Native costs document possible integer-rounding differences; do not invent sustain.
      expect(Math.abs(f.effChannel-f.perMinute*.6/60)).toBeLessThan(1);
      expect(Math.abs(f.magChannel-f.perMinute*1.3/60)).toBeLessThan(1);
      expect(Math.abs(f.brutChannel-f.perMinute*1.2/60)).toBeLessThan(1);
      expect(f.rapidChannel).toBe(f.channel);
    }
  });

  it("keeps native Tornado DoT separate from displayed hit fields and weapon-hit modifiers", () => {
    const f = fixtures.find(f => f.id === "tornado-shot")!;
    expect(f.dot).toBeCloseTo(12522/60,10);
    expect(f.concDot).toBeCloseTo(f.dot*1.3,10); expect(f.brutDot).toBeCloseTo(f.dot*1.3,10);
    expect(f.rapidDot).toBe(f.dot); expect(f.projectileDot).toBe(f.dot);
    for (const c of tornadoDotControls) expect(c.dot).toBeCloseTo(f.dot*(["100% increased Attack Damage","100% increased Damage with Bows"].includes(c.modifier) ? 1 : 2),10);
    const current = addSkillPresetPreferences(settings(f.id),preset(f.id));
    expect(current.preferences.some(p => ["attackDamage","attackAreaDamage","criticalChance","accuracy"].includes(p.id))).toBe(false);
    expect(passivePreferenceValues(node("10% increased Area Damage","5% reduced Area Damage","20% increased Attack Area Damage","30% increased Spell Area Damage"),current)).toEqual({ areaDamage: 5 });
    expect(scorePassiveNode(node("10% increased Area Damage"),[{ id: "areaDamage", weight: 1 },{ id: "attackAreaDamage", weight: 3 },{ id: "spellAreaDamage", weight: 3 }],current)).toBe(1);
  });

  it("keeps conditions and prohibitions visible without replacing the chosen component", () => {
    expect(preset("snipe").exclusions.find(e => e.id === "freezeBuildup")?.reason).toContain("cannot Freeze");
    expect(preset("shockchain-arrow").exclusions.find(e => e.id === "shockChance")?.reason).toContain("cannot Shock");
    expect(preset("stormcaller-arrow").exclusions.find(e => e.id === "skillDuration")?.reason).toContain("delays the Bolt");
    expect(preset("spiral-volley").description).toContain("only be hit once");
    expect(preset("freezing-salvo").description).toContain("cannot Chain");
    expect(preset("detonating-arrow").description).toContain("One-stage");
    for (const id of ["electrocuting-arrow","magnetic-salvo","shockchain-arrow","snipe","detonating-arrow"]) {
      expect(preCommon45SupportsFor(id).find(s => s.id === "concentrated-area")?.summary).toContain("is unchanged");
    }
    expect(preCommon45SupportsFor("electrocuting-arrow").find(s => s.id === "projectile-acceleration-ii")?.summary).toContain("cannot Pierce");
  });

  it("round-trips every new focus, support tier, goal and budget through existing storage", () => {
    for (const f of fixtures) {
      const current = addSkillPresetPreferences(setSkillSupport(setSkillSupport(settings(f.id),"rapid-attacks-i",true),"rapid-attacks-ii",true),preset(f.id));
      expect(current.preferences[0]).toEqual({ id: "life", weight: 3 }); expect(current.supportGemIds).toEqual(["rapid-attacks-ii"]);
      expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
      const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
        selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
        allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
      } }]);
      expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    }
  });

  it.each(["lightning-rod","tornado-shot"])("routes %s with its reviewed preferences without changing Shortest or point limits", focusSkillId => {
    const edges = [["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "fixture", extractedAt: "fixture", source: { kind: "fixture", path: "fixture" },
      nodes: Object.fromEntries(["start","plain","goal","good","bridge"].map(id => [id,{ ...node(), id, stats: id === "good" ? ["20% increased Area Damage"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from,to]) => ({ from,to })), groups: {}, classStarts: { ranger: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], focusSkillId, extraPointBudget: 1, preferences: [{ id: "areaDamage" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(2);
    const shortest = { ...request, mode: "shortest" as const }; expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
});

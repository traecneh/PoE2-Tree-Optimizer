import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { monkPrimaryFixtures as fixtures, monkPrimarySupportIds as supportIds, monkNativeOwnershipControls, monkSecondaryObservations } from "./monkPrimarySkills.fixtures";
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
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, preferences: [{ id: "energyShield", weight: 3 }, { id: "accuracy", weight: 2 }] });

describe("reviewed Monk primary breadth batch", () => {
  it.each(fixtures)("preserves $name's identity and explicit Quarterstaff/component scopes", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: f.tags });
    for (const scope of ["quarterstaffAttackDamage","quarterstaffAttackSpeed","quarterstaffCriticalChance","quarterstaffCriticalDamageBonus","quarterstaffStunBuildup","twoHandedWeaponDamage","attackAreaDamage","attackCriticalChance","attackCriticalDamageBonus","attackBlindChance","attackMaimChance","attackIncisionChance"] as const) expect(p.passiveStatScopes).toContain(scope);
    expect(p.passiveStatScopes?.includes("quarterstaffAccuracy")).toBe(f.accuracy);
    expect(p.passiveStatScopes?.includes("twoHandedMeleeAccuracy")).toBe(f.accuracy);
    expect(p.passiveStatScopes?.includes("meleeDamage")).toBe(f.melee);
    expect(p.passiveStatScopes?.includes("meleeStunBuildup")).toBe(f.melee);
    expect(p.passiveStatScopes?.includes("attackElementalDamage")).toBe(f.element === "cold");
    expect(p.passiveStatScopes?.includes("quarterstaffFreezeBuildup")).toBe(f.element === "cold");
    expect(p.passiveStatScopes?.includes("oneHandedWeaponDamage")).toBe(false);
    expect(p.suggestions.some(s => s.id === "physicalDamage")).toBe(f.conversion !== 1);
    expect(p.suggestions.some(s => ["projectileDamage","projectileSpeed","skillDuration","criticalChance","criticalDamageBonus","accuracy","freezeBuildup","damageOverTime"].includes(s.id))).toBe(false);
    if (!f.accuracy) expect(p.exclusions.find(e => e.id === "accuracy")?.reason).toContain("always hits");
  });

  it.each(fixtures)("matches $name's signed sources once without unarmed or other-owner leakage", f => {
    const current = addSkillPresetPreferences(settings(f.id),preset(f.id));
    expect(passivePreferenceValues(node("20% increased Damage with Quarterstaves","5% reduced Damage with Quarterstaves",
      "10% increased Melee Damage","20% increased Damage with Two Handed Weapons","5% reduced Damage with Two Handed Weapons",
      "20% increased Attack Area Damage","5% reduced Attack Area Damage","20% increased Elemental Damage with Attacks",
      "100% increased Damage with Spears","100% increased Spell Area Damage","100% increased Unarmed Attack Damage"),current))
      .toEqual({ attackDamage: f.melee ? 40 : 30, attackAreaDamage: 15, ...(f.element === "cold" ? { elementalDamage: 20 } : {}) });
    expect(passivePreferenceValues(node("12% increased Critical Hit Chance with Quarterstaves","5% reduced Critical Hit Chance with Quarterstaves",
      "20% increased Critical Damage Bonus for Attack Damage","3% increased Attack Speed with Quarterstaves"),current))
      .toEqual({ criticalChance: 7, criticalDamageBonus: 20, attackSpeed: 3 });
    expect(passivePreferenceValues(node("12% increased Accuracy Rating with Quarterstaves","5% reduced Accuracy Rating with Quarterstaves",
      "10% increased Accuracy Rating with Two Handed Melee Weapons"),current)).toEqual(f.accuracy ? { accuracy: 17 } : {});
    expect(passivePreferenceValues(node("20% increased Freeze Buildup with Quarterstaves","5% reduced Freeze Buildup with Quarterstaves"),current))
      .toEqual(f.element === "cold" ? { freezeBuildup: 15 } : {});
    expect(passivePreferenceValues(node("20% increased Area Damage","5% reduced Area Damage"),current)).toEqual({ areaDamage: 15 });
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","Totems deal 100% increased Damage","100% increased Spell Damage"),current.preferences,current)).toBe(0);
    expect(passivePreferenceValues(node("20% increased Damage with Quarterstaves per Power Charge","20% increased Area Damage while Channelling"),current)).toEqual({});
  });

  it.each(fixtures)("offers $name's reviewed support families without silent priority or score changes", f => {
    const expected = supportIds.filter(id => "durationBase" in f || !id.startsWith("prolonged-duration"));
    expect(preCommon45SupportsFor(f.id).map(s => s.id)).toEqual(expected);
    expect(expected).toHaveLength(f.supportCount);
    for (const support of expected) {
      const before = addSkillPresetPreferences(settings(f.id),preset(f.id));
      const selected = setSkillSupport(before,support,true);
      expect(selected.preferences).toEqual(before.preferences);
      const value = node("20% increased Damage with Quarterstaves");
      expect(scorePassiveNode(value,selected.preferences,selected)).toBe(scorePassiveNode(value,before.preferences,before));
      const applied = applySkillSupportPriorities(selected,preset(f.id));
      if (support === "concentrated-area") expect(applied.preferences).toContainEqual({ id: "areaOfEffect", weight: 2 });
      else expect(applied.preferences).toEqual(before.preferences);
      expect(applied.preferences.slice(0,2)).toEqual(settings(f.id).preferences);
      if (support.startsWith("brutality")) {
        const refined = refineSkillPreferencePreset(preset(f.id),[support]);
        expect(refined.suggestions.some(s => ["coldDamage","chaosDamage","elementalDamage"].includes(s.id))).toBe(false);
        if (f.conversion === 1) expect(refined.suggestions.some(s => ["attackDamage","attackAreaDamage"].includes(s.id))).toBe(false);
      }
    }
    expect(normalizeSkillSupportIds(f.id,["rapid-attacks-ii","rapid-attacks-i","prolonged-duration-i","prolonged-duration-ii","brutality-ii","brutality-iii","projectile-acceleration-i","spell-echo"]))
      .toEqual(["rapid-attacks-ii",...("durationBase" in f ? ["prolonged-duration-i"] : []),"brutality-ii"]);
  });

  it.each(fixtures)("independently checks $name's native ranges, conversion, cost and timing", f => {
    expect(f.phys).toEqual([7,12].map(v => Math.round(v*f.multiplier*(1-f.conversion))));
    expect(f.converted).toEqual([7,12].map(v => Math.round(v*f.multiplier*f.conversion)));
    expect(f.hit).toBeCloseTo((f.phys[0]+f.phys[1]+f.converted[0]+f.converted[1])/2*1.1,10);
    expect(f.effCost).toBe(Math.ceil(f.mana*.6)); expect(f.magCost).toBe(Math.floor(f.mana*1.3)); expect(f.brutCost).toBe(Math.floor(f.mana*1.2));
    if ("radius" in f) {
      expect(f.magRadius).toBe(Math.floor(f.radius*Math.floor(100*Math.sqrt(1.45))/100));
      expect(f.concRadius).toBe(Math.floor(f.radius*Math.floor(100*Math.sqrt(.5))/100));
    }
    if ("durationBase" in f) {
      expect(f.duration).toBeCloseTo(Math.ceil(f.durationBase/.033)*.033,10);
      expect(f.prolonged).toBeCloseTo(Math.ceil(f.durationBase*1.35/.033)*.033,10);
    }
    if ("cooldown" in f) expect(f.rapid).toBeCloseTo(Math.min(f.speed*1.25,1/f.cooldown),10);
    else expect(1/f.rapid).toBeCloseTo((1/f.speed-f.fixedTime)/1.25+f.fixedTime,10);
    expect(f.concHit).toBeGreaterThan(f.hit);
    if (f.conversion === 1) expect(f.brutHit).toBe(0);
    else expect(f.brutHit).toBeCloseTo([7,12].map(v => Math.round(v*f.multiplier*(1-f.conversion)*1.3)).reduce((a,b) => a+b,0)/2*1.1,10);
  });

  it("retains independent native ownership controls and distinct secondary components", () => {
    for (const c of monkNativeOwnershipControls) {
      const f = fixtures.find(f => f.id === c.id)!;
      expect(c.unarmed).toBe(f.hit); expect(c.minion).toBe(f.hit); expect(c.totem).toBe(f.hit);
      expect(c.melee > f.hit).toBe(f.melee);
      expect(c.quarterstaff).toBeGreaterThan(f.hit); expect(c.twoHanded).toBeGreaterThan(f.hit); expect(c.area).toBeGreaterThan(f.hit);
    }
    for (const s of monkSecondaryObservations) {
      expect(s.phys).toEqual([7,12].map(v => Math.round(v*s.multiplier*(1-s.conversion))));
      expect(s.cold).toEqual([7,12].map(v => Math.round(v*s.multiplier*s.conversion)));
      expect(s.hit).toBeCloseTo((s.phys[0]+s.phys[1]+s.cold[0]+s.cold[1])/2*1.1,10);
    }
    expect(preset("shattering-palm").description).toContain("separately triggered");
    expect(preset("staggering-palm").description).toContain("other Quarterstaff attacks");
    expect(preset("tempest-bell").description).toContain("300 ms shockwave limit");
    expect(preset("hand-of-chayula").description).toContain("Socketed Marks and Curses are separate");
    expect(preset("killing-palm").description).toContain("enemy rarity");
    expect(preset("wave-of-frost").description).toContain("Primed for Freeze");
  });

  it("keeps duration utility opt-in and does not infer projectile support from a buff or gem tag", () => {
    for (const id of ["frozen-locus","staggering-palm","tempest-bell"]) {
      const support = preCommon45SupportsFor(id).find(s => s.id === "prolonged-duration-ii")!;
      expect(support.summary).toContain("20% higher Mana cost");
      expect(support.priorities).toEqual([]);
    }
    for (const f of fixtures) {
      expect(preCommon45SupportsFor(f.id).some(s => s.id.startsWith("projectile-acceleration") || s.id === "spell-echo")).toBe(false);
    }
    expect(preCommon45SupportsFor("frozen-locus").find(s => s.id === "brutality-iii")?.summary).toContain("fully Cold crystal explosion deals no damage");
    expect(preCommon45SupportsFor("shattering-palm").find(s => s.id === "brutality-iii")?.summary).toContain("fully Cold secondary explosion also deals no damage");
    expect(preCommon45SupportsFor("hand-of-chayula").find(s => s.id === "rapid-attacks-ii")?.summary).toContain("fixed 350 ms");
  });

  it("round-trips the whole batch with tier replacement and manual preferences intact", () => {
    for (const f of fixtures) {
      const current = addSkillPresetPreferences(setSkillSupport(setSkillSupport(settings(f.id),"rapid-attacks-i",true),"rapid-attacks-ii",true),preset(f.id));
      expect(current.preferences.slice(0,2)).toEqual(settings(f.id).preferences); expect(current.supportGemIds).toEqual(["rapid-attacks-ii"]);
      expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
      const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
        selectedClassStartId: "monk", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
        allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
      } }]);
      expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    }
  });

  it.each(["frozen-locus","tempest-bell"])("routes %s within the current budget while leaving Shortest unchanged", focusSkillId => {
    const edges = [["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "fixture", extractedAt: "fixture", source: { kind: "fixture", path: "fixture" },
      nodes: Object.fromEntries(["start","plain","goal","good","bridge"].map(id => [id,{ ...node(), id, stats: id === "good" ? ["20% increased Damage with Quarterstaves"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from,to]) => ({ from,to })), groups: {}, classStarts: { monk: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], focusSkillId, extraPointBudget: 1, preferences: [{ id: "attackDamage" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(2);
    const shortest = { ...request, mode: "shortest" as const }; expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
});

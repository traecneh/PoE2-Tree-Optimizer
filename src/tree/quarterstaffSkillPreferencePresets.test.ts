import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { quarterstaffPrimaryFixtures as fixtures, quarterstaffCommonSupportIds as commonSupportIds } from "./quarterstaffPrimarySkills.fixtures";
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
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, preferences: [{ id: "life", weight: 3 },{ id: "attackDamage", weight: 1 }] });

describe("reviewed quarterstaff primary batch", () => {
  it.each(fixtures)("preserves $name's independent identity, tags and selected component scopes", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: f.tags });
    expect(p.sourceUrl).toContain("act_int.lua#L");
    expect(p.passiveStatScopes).toEqual(expect.arrayContaining(["attackCriticalChance","attackAreaDamage","quarterstaffAttackDamage","quarterstaffAttackSpeed","quarterstaffAccuracy","quarterstaffCriticalChance","quarterstaffCriticalDamageBonus","quarterstaffStunBuildup","twoHandedWeaponDamage","twoHandedMeleeAccuracy"]));
    expect(p.passiveStatScopes?.includes("meleeDamage")).toBe(f.melee);
    expect(p.passiveStatScopes?.includes("meleeStunBuildup")).toBe(f.melee);
    expect(p.passiveStatScopes?.includes("attackElementalDamage")).toBe(Boolean(f.element));
    expect(p.passiveStatScopes?.includes("quarterstaffFreezeBuildup")).toBe(false);
    if (f.element) expect(p.suggestions.find(s => s.id === "physicalDamage")?.reason).toContain("not the converted Elemental damage");
    expect(p.suggestions.some(s => ["criticalChance","criticalDamageBonus","skillDuration","cooldownRecoveryRate","projectileDamage"].includes(s.id))).toBe(false);
  });

  it.each(fixtures)("matches signed $name weapon/area stats once without ownership, element or melee leakage", f => {
    const current = addSkillPresetPreferences(settings(f.id),preset(f.id));
    expect(passivePreferenceValues(node("20% increased Damage with Quarterstaves","5% reduced Damage with Quarterstaves",
      "10% increased Melee Damage","20% increased Attack Area Damage","5% reduced Attack Area Damage",
      "20% increased Elemental Damage with Attacks","100% increased Damage with Maces","100% increased Spell Area Damage"),current))
      .toEqual({ attackDamage: f.melee ? 25 : 15, attackAreaDamage: 15, ...(f.element ? { elementalDamage: 20 } : {}) });
    expect(passivePreferenceValues(node("12% increased Critical Hit Chance with Quarterstaves","5% reduced Critical Hit Chance with Quarterstaves",
      "3% increased Attack Speed with Quarterstaves","20% increased Critical Damage Bonus with Quarterstaves"),current))
      .toEqual({ criticalChance: 7, attackSpeed: 3, criticalDamageBonus: 20 });
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","Totems deal 100% increased Damage","100% increased Spell Damage"),current.preferences,current)).toBe(0);
    expect(passivePreferenceValues(node("20% increased Damage with Quarterstaves per Power Charge","20% increased Attack Area Damage while Channelling"),current)).toEqual({});
    expect(scorePassiveNode(node("12% increased Critical Hit Chance with Quarterstaves"),current.preferences,current)).toBe(0);
  });

  it.each(fixtures)("offers reviewed shared supports for $name without changing manual priorities or score multipliers", f => {
    const supportIds = f.id === "falling-thunder" ? [...commonSupportIds.slice(0,7),"projectile-acceleration-i","projectile-acceleration-ii",...commonSupportIds.slice(7)] : commonSupportIds;
    expect(preCommon45SupportsFor(f.id).map(s => s.id)).toEqual(supportIds);
    const before = settings(f.id);
    for (const support of supportIds) {
      const selected = setSkillSupport(before,support,true);
      expect(selected.preferences).toEqual(before.preferences);
      const refined = refineSkillPreferencePreset(preset(f.id),[support]);
      expect(refined.id).toBe(f.id);
      expect(scorePassiveNode(node("20% increased Damage with Quarterstaves"),before.preferences,before))
        .toBe(scorePassiveNode(node("20% increased Damage with Quarterstaves"),selected.preferences,selected));
      if (support === "concentrated-area") {
        expect(applySkillSupportPriorities(selected,preset(f.id)).preferences).toContainEqual({ id: "areaOfEffect", weight: 2 });
        expect(refined.suggestions.find(s => s.id === "areaOfEffect")?.reason).toContain("reviewed hit's area");
      }
      else expect(applySkillSupportPriorities(selected,preset(f.id)).preferences).toEqual(before.preferences);
      if (support.startsWith("brutality")) {
        expect(refined.suggestions.some(s => ["elementalDamage","lightningDamage","coldDamage"].includes(s.id))).toBe(false);
        expect(refined.suggestions.some(s => s.id === "physicalDamage")).toBe(true);
      }
    }
    expect(normalizeSkillSupportIds(f.id,["brutality-ii","brutality-iii","rapid-attacks-i","rapid-attacks-ii","spell-echo","prolonged-duration-i"]))
      .toEqual(["brutality-ii","rapid-attacks-i"]);
  });

  it.each(fixtures)("independently checks $name's native weapon conversion, hit, cost, area and timing arithmetic", f => {
    expect(f.phys).toEqual([7,12].map(v => Math.round(v*f.multiplier*(1-f.conversion))));
    expect(f.elemental).toEqual([7,12].map(v => Math.round(v*f.multiplier*f.conversion)));
    expect(f.hit).toBeCloseTo((f.phys[0]+f.phys[1]+f.elemental[0]+f.elemental[1])/2*1.1,10);
    expect(f.magCost).toBe(Math.floor(f.mana*1.3));
    expect(f.effCost).toBe(Math.ceil(f.mana*.6));
    expect(f.brutCost).toBe(Math.floor(f.mana*1.2));
    expect(f.magArea).toBeCloseTo(f.area*1.45,10);
    expect(f.concArea).toBeCloseTo(f.area*.5,10);
    if ("radius" in f) {
      expect(f.magRadius).toBe(Math.floor(f.radius*Math.sqrt(1.45)));
      expect(f.concRadius).toBe(Math.floor(f.radius*Math.sqrt(.5)));
    }
    // Flicker's native speed is millisecond-quantised; neither value proves charge sustain.
    if (f.id === "flicker-strike") expect(f.rapid).toBeCloseTo(f.speed*1.25,2);
    else expect(1/f.rapid).toBeCloseTo((1/f.speed-f.fixedTime)/1.25+f.fixedTime,10);
    if ("channel" in f) {
      expect(f.magChannel).toBe(Math.floor(3203*1.3/60));
      expect(f.effChannel).toBe(Math.ceil(f.channel*.6));
      expect(f.brutChannel).toBe(Math.floor(3203*1.2/60));
    }
  });

  it("keeps charges, external debuffs and conditional components distinct", () => {
    expect(preset("glacial-cascade").exclusions.find(e => e.id === "freezeBuildup")?.reason).toContain("cannot Freeze");
    expect(preset("siphoning-strike").exclusions.find(e => e.id === "shockChance")?.reason).toContain("cannot Shock");
    expect(preset("vaulting-impact").exclusions.find(e => e.id === "dazeChance")?.reason).toContain("cannot Daze");
    expect(preset("gathering-storm").description).toContain("Normal Dash");
    expect(preset("flicker-strike").description).toContain("cannot be gained during this skill");
    const projectile = preCommon45SupportsFor("falling-thunder").find(s => s.id === "projectile-acceleration-ii")!;
    expect(projectile.summary).toContain("already always Pierce");
    expect(projectile.summary).toContain("unchanged priorities");
    for (const id of ["falling-thunder","siphoning-strike"]) {
      expect(preCommon45SupportsFor(id).find(s => s.id === "brutality-iii")?.summary).toContain("fully Lightning secondary component deals no damage");
    }
  });

  it("round-trips all new focuses with goals, budget and support tier replacement unchanged", () => {
    for (const f of fixtures) {
      const initial = settings(f.id);
      const current = addSkillPresetPreferences(setSkillSupport(setSkillSupport(initial,"rapid-attacks-i",true),"rapid-attacks-ii",true),preset(f.id));
      expect(current.preferences.slice(0,2)).toEqual(initial.preferences);
      expect(current.supportGemIds).toEqual(["rapid-attacks-ii"]);
      expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
      const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
        selectedClassStartId: "monk", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
        allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
      } }]);
      expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    }
  });

  it.each(["glacial-cascade","falling-thunder"])("uses %s in weighted routing without changing Shortest or the point budget", focusSkillId => {
    const edges = [["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "fixture", extractedAt: "fixture", source: { kind: "fixture", path: "fixture" },
      nodes: Object.fromEntries(["start","plain","goal","good","bridge"].map(id => [id,{ ...node(), id, stats: id === "good" ? ["20% increased Damage with Quarterstaves"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from,to]) => ({ from,to })), groups: {}, classStarts: { monk: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], focusSkillId, extraPointBudget: 1, preferences: [{ id: "attackDamage" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(2);
    const shortest = { ...request, mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
});

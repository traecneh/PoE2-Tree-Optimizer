import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { macePrimaryFixtures as fixtures, macePrimarySupportIds as supportIds, macePrimaryGemIds as gemIds } from "./macePrimarySkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, setSkillSupport } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { optimizeBuildGoals } from "./buildGoalsOptimizer";
import { optimizeWeightedBuildGoals, runOptimizerRequest } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture",stats,flags: {},position: { x: 0,y: 0 } });
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,preferences: [{ id: "life",weight: 3 },{ id: "attackDamage",weight: 1 }] });

describe("reviewed mace primary skill batch", () => {
  it.each(fixtures)("keeps $name's frozen identity and explicit player attack component", f => {
    const p = preset(f.id);
    expect(p.name).toBe(f.name); expect(p.tags).toEqual(f.tags);
    expect(p.gemId).toBe(gemIds[f.id]);
    expect(p.sourceUrl).toContain("act_str.lua#L");
    expect(p.passiveStatScopes).toEqual(expect.arrayContaining(["maceAttackDamage","meleeDamage","attackAreaDamage"]));
    expect(p.passiveStatScopes?.includes("twoHandedWeaponDamage")).toBe(f.id === "supercharged-slam");
    expect(p.passiveStatScopes?.includes("attackElementalDamage")).toBe(f.id === "volcanic-fissure");
    expect(p.suggestions.some(s => s.id === "attackSpeed")).toBe(f.id !== "supercharged-slam");
    expect(p.suggestions.some(s => s.id === "skillDuration" || s.id === "cooldownRecoveryRate")).toBe(false);
  });

  it.each(fixtures)("matches $name's signed Mace/melee/area wording once without proxy or tag leakage", f => {
    const current = addSkillPresetPreferences(settings(f.id),preset(f.id));
    expect(passivePreferenceValues(node("20% increased Damage with Maces","5% reduced Damage with Maces","10% increased Melee Damage",
      "20% increased Attack Area Damage","5% reduced Attack Area Damage","20% increased Elemental Damage with Attacks",
      "100% increased Damage with Bows","100% increased Spell Area Damage"),current))
      .toEqual({ attackDamage: 25,attackAreaDamage: 15,...(f.id === "volcanic-fissure" ? { elementalDamage: 20 } : {}) });
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","Totems deal 100% increased Damage","100% increased Spell Damage","100% increased Cast Speed"),current.preferences,current)).toBe(0);
    expect(passivePreferenceValues(node("20% increased Damage with Maces if you've Stunned Recently","20% increased Attack Area Damage per Charge"),current)).toEqual({});
  });

  it.each(fixtures)("uses five shared support families for $name without automatic damage multipliers", f => {
    expect(preCommon45SupportsFor(f.id).map(s => s.id)).toEqual(supportIds);
    const before = settings(f.id);
    for (const support of supportIds) {
      const selected = setSkillSupport(before,support,true);
      expect(selected.preferences).toEqual(before.preferences);
      const refined = refineSkillPreferencePreset(preset(f.id),[support]);
      expect(refined.id).toBe(f.id);
      expect(scorePassiveNode(node("20% increased Damage with Maces"),before.preferences,before))
        .toBe(scorePassiveNode(node("20% increased Damage with Maces"),selected.preferences,selected));
      if (support === "concentrated-area") {
        expect(applySkillSupportPriorities(selected,preset(f.id)).preferences).toContainEqual({ id: "areaOfEffect",weight: 2 });
      } else expect(applySkillSupportPriorities(selected,preset(f.id)).preferences).toEqual(before.preferences);
    }
    expect(normalizeSkillSupportIds(f.id,["brutality-ii","brutality-iii","rapid-attacks-i","rapid-attacks-ii","spell-echo","mobility"]))
      .toEqual(["brutality-ii","rapid-attacks-i"]);
    if (f.id === "volcanic-fissure") {
      expect(refineSkillPreferencePreset(preset(f.id),["brutality-iii"]).suggestions.some(s => s.id === "fireDamage")).toBe(false);
      expect(preCommon45SupportsFor(f.id).find(s => s.id === "brutality-iii")?.summary).toContain("only the unconverted Physical portion remains");
    }
  });

  it.each(fixtures)("independently checks $name's frozen native cost, area and stored-hit arithmetic", f => {
    expect(f.hit).toBeCloseTo(((f.phys[0]+f.phys[1]+f.fire[0]+f.fire[1])/2)*1.05,10);
    if ("radius" in f) {
      expect(f.magRadius).toBe(Math.floor(f.radius*Math.sqrt(1.45)));
      expect(f.concRadius).toBe(Math.floor(f.radius*Math.sqrt(.5)));
    }
    if ("magCost" in f) {
      expect(f.magCost).toBe(Math.floor(f.mana*1.3)); expect(f.effCost).toBe(Math.ceil(f.mana*.6)); expect(f.brutCost).toBe(Math.floor(f.mana*1.2));
    } else {
      expect(f.magChannel).toBe(Math.floor(3203*1.3/60)); expect(f.effChannel).toBe(Math.ceil(f.channelCost*.6)); expect(f.brutChannel).toBe(Math.floor(3203*1.2/60));
    }
    if (f.id === "leap-slam") expect(1/f.rapid).toBeCloseTo((1/f.speed-.65)/1.25+.65,10);
    else expect(f.rapid).toBeCloseTo(f.speed*1.25,10);
  });

  it("does not confuse modeled generic speed with fixed channels, charge travel, Glory or secondary triggers", () => {
    expect(preset("supercharged-slam").exclusions.find(e => e.id === "attackSpeed")?.reason).toContain("cannot be modified");
    expect(preset("hammer-of-the-gods").exclusions.find(e => e.id === "cooldownRecoveryRate")?.reason).toContain("requires Glory");
    expect(preset("hammer-of-the-gods").exclusions.find(e => e.id === "accuracy")?.reason).toContain("always hits");
    expect(preset("stampede").suggestions.find(e => e.id === "movementSpeed")?.reason).toContain("Movement-Speed-governed charge");
    for (const id of ["sunder","leap-slam"]) expect(preset(id).exclusions.find(e => e.id === "armourBreakAmount")?.reason).toContain("cannot Break Armour");
    expect(preset("sunder").description).toContain("separately flagged shockwave");
    expect(preset("earthshatter").description).toContain("require a nearby Warcry");
    expect(preset("earthquake").exclusions.find(e => e.id === "skillDuration")?.reason).toContain("delays the Aftershock");
  });

  it("round-trips the whole batch through the existing storage contract, preserving manual weights, goals and tier choices", () => {
    for (const f of fixtures) {
      const initial = settings(f.id);
      const current = addSkillPresetPreferences(setSkillSupport(setSkillSupport(initial,"rapid-attacks-i",true),"rapid-attacks-ii",true),preset(f.id));
      expect(current.preferences.slice(0,2)).toEqual(initial.preferences);
      expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
      const [saved] = normalizeSavedBuilds([{ id: f.id,name: f.name,createdAt: "test",updatedAt: "test",state: {
        selectedClassStartId: "warrior",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["goal"],ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: current,
        allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
      } }]);
      expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    }
  });

  it.each(["earthquake","volcanic-fissure"])("routes %s within the same budget without changing Shortest", focusSkillId => {
    const edges = [["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]];
    const graph: TreeGraph = { schemaVersion: 1,gameVersion: "fixture",extractedAt: "fixture",source: { kind: "fixture",path: "fixture" },
      nodes: Object.fromEntries(["start","plain","goal","good","bridge"].map(id => [id,{ ...node(),id,stats: id === "good" ? ["20% increased Damage with Maces"] : [],flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from,to]) => ({ from,to })),groups: {},classStarts: { warrior: "start" },bounds: { minX: 0,minY: 0,maxX: 100,maxY: 100 } };
    const request = { graph,mode: "weighted" as const,baseNodeIds: ["start"],baseEdgeKeys: [],goalNodeIds: ["goal"],focusSkillId,extraPointBudget: 1,preferences: [{ id: "attackDamage" as const,weight: 1 }] };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(2);
    const shortest = { ...request,mode: "shortest" as const };
    expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
});

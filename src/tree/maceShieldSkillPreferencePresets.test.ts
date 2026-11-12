import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { maceShieldFixtures as fixtures, maceShieldSupportIds as supportIds, maceShieldProjectileIds, maceShieldDurationIds, shieldEquipmentControls, maceShieldOwnershipControls, maceShieldSecondaryObservations } from "./maceShieldSkills.fixtures";
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
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, preferences: [{ id: "energyShield", weight: 3 }] });

describe("reviewed mace/shield/Wyvern breadth batch", () => {
  it.each(fixtures)("preserves $name's identity without inferring its source from its name or appearance", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: f.tags });
    for (const scope of ["attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackAreaDamage","attackBlindChance","attackMaimChance","attackIncisionChance"] as const) expect(p.passiveStatScopes).toContain(scope);
    for (const scope of ["maceAttackDamage","maceAttackSpeed","maceStunBuildup"] as const) expect(p.passiveStatScopes?.includes(scope)).toBe(f.mace);
    expect(p.passiveStatScopes?.includes("meleeDamage")).toBe(f.melee);
    expect(p.passiveStatScopes?.includes("meleeStunBuildup")).toBe(f.melee);
    expect(p.passiveStatScopes?.includes("attackElementalDamage")).toBe(f.conversion > 0);
    expect(p.passiveStatScopes?.includes("oneHandedWeaponDamage")).toBe(false);
    expect(p.passiveStatScopes?.includes("twoHandedWeaponDamage")).toBe(false);
    expect(p.suggestions.some(s => s.id === "projectileDamage")).toBe(f.projectile);
    expect(p.suggestions.some(s => s.id === "physicalDamage")).toBe(f.conversion !== 1);
    expect(p.suggestions.some(s => ["criticalChance","criticalDamageBonus","accuracy","damageOverTime","skillDuration","armour"].includes(s.id))).toBe(false);
    expect(p.suggestions.some(s => s.id === "armourBreakAmount")).toBe(["armour-breaker","resonating-shield"].includes(f.id));
  });

  it.each(fixtures)("scores $name's signed and overlapping sources once with ownership checks", f => {
    const current = addSkillPresetPreferences(settings(f.id),preset(f.id));
    expect(passivePreferenceValues(node("10% increased Attack Damage","20% increased Damage with Maces","5% reduced Damage with Maces",
      "10% increased Melee Damage","20% increased Attack Area Damage","5% reduced Attack Area Damage","20% increased Elemental Damage with Attacks",
      "100% increased Damage with Spears","100% increased Spell Area Damage"),current))
      .toEqual({ attackDamage: 10+(f.mace ? 15 : 0)+(f.melee ? 10 : 0), attackAreaDamage: 15, ...(f.conversion ? { elementalDamage: 20 } : {}) });
    expect(passivePreferenceValues(node("12% increased Attack Speed with Maces","5% reduced Attack Speed with Maces"),current))
      .toEqual(f.mace ? { attackSpeed: 7 } : {});
    expect(passivePreferenceValues(node("20% increased Stun Buildup with Maces","10% increased Stun Buildup with Melee Damage"),current))
      .toEqual(f.mace || f.melee ? { stunBuildup: (f.mace ? 20 : 0)+(f.melee ? 10 : 0) } : {});
    expect(passivePreferenceValues(node("20% increased Area Damage","5% reduced Area Damage"),current)).toEqual({ areaDamage: 15 });
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","Totems deal 100% increased Damage","100% increased Spell Damage"),current.preferences,current)).toBe(0);
    expect(passivePreferenceValues(node("20% increased Damage with Maces while Channelling","20% increased Area Damage per Endurance Charge"),current)).toEqual({});
    if (f.shield) {
      expect(passivePreferenceValues(node("100% increased Damage with Maces","100% increased Attack Speed with Maces"),current)).toEqual({});
      expect(scorePassiveNode(node("20% increased Armour"),[{ id: "attackDamage", weight: 3 }],current)).toBe(0);
    }
  });

  it.each(fixtures)("offers $name's common support tiers without silent priority or damage-score edits", f => {
    const expected = supportIds.filter(id => (!id.startsWith("projectile-acceleration") || maceShieldProjectileIds.includes(f.id))
      && (!id.startsWith("prolonged-duration") || maceShieldDurationIds.includes(f.id)));
    expect(preCommon45SupportsFor(f.id).map(s => s.id)).toEqual(expected);
    expect(expected).toHaveLength(f.supportCount);
    for (const support of expected) {
      const before = addSkillPresetPreferences(settings(f.id),preset(f.id));
      const selected = setSkillSupport(before,support,true);
      expect(selected.preferences).toEqual(before.preferences);
      const value = node("20% increased Attack Damage");
      expect(scorePassiveNode(value,selected.preferences,selected)).toBe(scorePassiveNode(value,before.preferences,before));
      const applied = applySkillSupportPriorities(selected,preset(f.id));
      if (support === "concentrated-area") expect(applied.preferences).toContainEqual({ id: "areaOfEffect", weight: 2 });
      else expect(applied.preferences).toEqual(before.preferences);
      if (support.startsWith("brutality")) {
        const refined = refineSkillPreferencePreset(preset(f.id),[support]);
        expect(refined.suggestions.some(s => ["fireDamage","elementalDamage"].includes(s.id))).toBe(false);
        if (f.conversion === 1) expect(refined.suggestions.some(s => ["attackDamage","attackAreaDamage","projectileDamage"].includes(s.id))).toBe(false);
      }
    }
    expect(normalizeSkillSupportIds(f.id,["rapid-attacks-ii","rapid-attacks-i","prolonged-duration-i","prolonged-duration-ii","projectile-acceleration-i","projectile-acceleration-ii","brutality-ii","brutality-iii","spell-echo"]))
      .toEqual(["rapid-attacks-ii",...(maceShieldDurationIds.includes(f.id) ? ["prolonged-duration-i"] : []),...(f.projectile ? ["projectile-acceleration-i"] : []),"brutality-ii"]);
  });

  it.each(fixtures)("independently checks $name's native source, conversion, cost, radius and timing arithmetic", f => {
    if ("shieldBase" in f) expect(f.source).toEqual(f.shieldBase.map((v,i) => v+Math.floor(18/15)*f.per15Armour[i]));
    expect(f.phys).toEqual(f.source.map(v => Math.round(v*f.multiplier*(1-f.conversion))));
    expect(f.fire).toEqual(f.source.map(v => Math.round(v*f.multiplier*f.conversion)));
    expect(f.hit).toBeCloseTo((f.phys[0]+f.phys[1]+f.fire[0]+f.fire[1])/2*(1+f.crit/100),10);
    if ("mana" in f) {
      expect(f.effCost).toBe(Math.ceil(f.mana*.6)); expect(f.magCost).toBe(Math.floor(f.mana*1.3)); expect(f.brutCost).toBe(Math.floor(f.mana*1.2));
    } else {
      expect(f.perSecond).toBe(Math.floor(f.manaPerMinute/60)); expect(f.magPerSecond).toBe(Math.floor(f.manaPerMinute*1.3/60));
      expect(f.effPerSecond).toBe(Math.floor(f.manaPerMinute*.6/60)); expect(f.brutPerSecond).toBe(Math.floor(f.manaPerMinute*1.2/60));
    }
    if ("radius" in f) {
      expect(f.magRadius).toBe(Math.floor(f.radius*Math.floor(100*Math.sqrt(1.45))/100));
      expect(f.concRadius).toBe(Math.floor(f.radius*Math.floor(100*Math.sqrt(.5))/100));
    }
    if ("durationBase" in f) {
      expect(f.duration).toBeCloseTo(Math.ceil(f.durationBase/.033)*.033,10);
      expect(f.prolonged).toBeCloseTo(Math.ceil(f.durationBase*1.35/.033)*.033,10);
    }
    if ("cooldown" in f) { expect(1/f.speed).toBeCloseTo(f.cooldown,10); expect(f.rapid).toBe(f.speed); }
    else expect(f.rapid).toBeCloseTo(f.speed*1.25,10);
    expect(f.concHit).toBeGreaterThan(f.hit);
    if (f.conversion === 1) expect(f.brutHit).toBe(0);
    else expect(f.brutHit).toBeCloseTo(f.source.map(v => Math.round(v*f.multiplier*(1-f.conversion)*1.3)).reduce((a,b) => a+b,0)/2*(1+f.crit/100),10);
  });

  it("checks shield Armour scaling without borrowing the main-hand weapon's damage", () => {
    for (const c of shieldEquipmentControls) {
      const f = fixtures.find(f => f.id === c.id)!;
      if (!("shieldBase" in f)) throw new Error("Expected a shield fixture");
      expect(c.paintedPhys).toEqual(f.shieldBase.map((v,i) => Math.round((v+Math.floor(33/15)*f.per15Armour[i])*f.multiplier)));
      expect(c.paintedHit).toBeCloseTo((c.paintedPhys[0]+c.paintedPhys[1])/2*1.05,10);
      expect(c.paintedHit).toBeGreaterThan(f.hit); expect(c.otherWeaponHit).toBe(f.hit);
    }
    for (const c of maceShieldOwnershipControls) {
      const f = fixtures.find(f => f.id === c.id)!;
      expect(c.mace).toBe(f.hit); expect(c.maceSpeed).toBe(f.speed); expect(c.minion).toBe(f.hit);
      expect(c.melee > f.hit).toBe(f.melee); expect(c.projectile > f.hit).toBe(f.projectile); expect(c.area).toBeGreaterThan(f.hit);
    }
  });

  it("keeps Perfect Timing, shrapnel and fissures separate from the selected component", () => {
    for (const s of maceShieldSecondaryObservations) {
      expect(s.phys).toEqual([6,10].map(v => Math.round(v*s.multiplier*(1-s.conversion))));
      expect(s.fire).toEqual([6,10].map(v => Math.round(v*s.multiplier*s.conversion)));
      expect(s.hit).toBeCloseTo((s.phys[0]+s.phys[1]+s.fire[0]+s.fire[1])/2*1.05,10);
    }
    // Native Collision uses different flat damage, Armour scaling and multiplier from the area hit.
    expect([85+6,128+8].map(v => Math.round(v*2.54))).toEqual([231,345]);
    expect((231+345)/2*1.05).toBeCloseTo(302.4,10);
    expect(preset("perfect-strike").description).toContain("Normal-release");
    expect(preset("molten-blast").description).toContain("shrapnel has different conversion");
    expect(preset("shield-charge").description).toContain("Collision is a separate");
    expect(preset("forge-hammer").exclusions.find(e => e.id === "cooldownRecoveryRate")?.reason).toContain("does not run while the hammer is lodged");
    expect(preCommon45SupportsFor("resonating-shield").find(s => s.id === "rapid-attacks-ii")?.summary).toContain("native baseline leaves that cost unchanged");
    expect(preCommon45SupportsFor("rolling-magma").find(s => s.id === "brutality-iii")?.summary).toContain("fully Fire-converted Rolling Magma focus deals no damage");
    for (const id of maceShieldDurationIds) expect(preCommon45SupportsFor(id).find(s => s.id === "prolonged-duration-ii")?.priorities).toEqual([]);
  });

  it("round-trips all eight focuses and shared support tiers without changing existing manual choices", () => {
    for (const f of fixtures) {
      const current = addSkillPresetPreferences(setSkillSupport(setSkillSupport(settings(f.id),"rapid-attacks-i",true),"rapid-attacks-ii",true),preset(f.id));
      expect(current.preferences[0]).toEqual({ id: "energyShield", weight: 3 }); expect(current.supportGemIds).toEqual(["rapid-attacks-ii"]);
      expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
      const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
        selectedClassStartId: "warrior", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
        allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
      } }]);
      expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    }
  });

  it.each(["resonating-shield","rolling-magma"])("routes %s within the existing point budget without changing Shortest", focusSkillId => {
    const edges = [["start","plain"],["plain","goal"],["start","good"],["good","bridge"],["bridge","goal"]];
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "fixture", extractedAt: "fixture", source: { kind: "fixture", path: "fixture" },
      nodes: Object.fromEntries(["start","plain","goal","good","bridge"].map(id => [id,{ ...node(), id, stats: id === "good" ? ["20% increased Attack Damage"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: edges.map(([from,to]) => ({ from,to })), groups: {}, classStarts: { warrior: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], focusSkillId, extraPointBudget: 1, preferences: [{ id: "attackDamage" as const, weight: 1 }] };
    const result = optimizeWeightedBuildGoals(request,undefined,{ maxIterations: 8 });
    expect(result.status).toBe("success"); expect(result.pointCost).toBe(3); expect(result.weighted?.score).toBe(2);
    const shortest = { ...request, mode: "shortest" as const }; expect(runOptimizerRequest(shortest)).toMatchObject(optimizeBuildGoals(shortest));
  });
});

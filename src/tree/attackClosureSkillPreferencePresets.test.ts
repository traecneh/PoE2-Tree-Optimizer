import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { attackClosureFixtures as fixtures, attackClosureSupportIds as supportIds, attackClosureProjectileIds, attackClosureDurationIds, attackClosureOwnershipControls } from "./attackClosureSkills.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, setSkillSupport } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7,
  preferences: [{ id: "energyShield", weight: 3 },{ id: "accuracy", weight: 2 }] });

describe("remaining non-totem attack focus closure batch", () => {
  it.each(fixtures)("preserves $name's identity, ownership and selected component", f => {
    const p = preset(f.id);
    expect(p).toMatchObject({ name: f.name, gemId: f.gemId, tags: f.tags });
    for (const scope of ["attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackBlindChance","attackMaimChance","attackIncisionChance"] as const) expect(p.passiveStatScopes).toContain(scope);
    expect(p.passiveStatScopes?.includes("attackAreaDamage")).toBe(f.area);
    expect(p.passiveStatScopes?.includes("meleeDamage")).toBe(f.melee);
    expect(p.passiveStatScopes?.includes("meleeStunBuildup")).toBe(f.stun);
    expect(p.passiveStatScopes?.includes("attackElementalDamage")).toBe(f.conversion > 0);
    for (const scope of ["spearAttackDamage","spearAttackSpeed","spearCriticalChance","spearCriticalDamageBonus","oneHandedWeaponDamage","oneHandedMeleeCriticalChance","oneHandedAttackAilmentChance"] as const) expect(p.passiveStatScopes?.includes(scope)).toBe(f.spear);
    for (const scope of ["spearAccuracy","oneHandedMeleeAccuracy"] as const) expect(p.passiveStatScopes?.includes(scope)).toBe(f.spear && f.id !== "cull-the-weak");
    for (const scope of ["bowAttackDamage","bowAttackSpeed","bowAccuracy","bowCriticalDamageBonus","twoHandedWeaponDamage"] as const) expect(p.passiveStatScopes?.includes(scope)).toBe(f.bow);
    expect(p.passiveStatScopes?.includes("maceAttackDamage")).toBe(false);
    expect(p.suggestions.some(s => s.id === "physicalDamage")).toBe(f.conversion !== 1);
    expect(p.suggestions.some(s => s.id === "projectileDamage")).toBe(f.projectile);
    expect(p.suggestions.some(s => s.id === "attackSpeed")).toBe(f.id !== "trail-of-caltrops");
    expect(p.suggestions.some(s => ["criticalChance","criticalDamageBonus","accuracy","damageOverTime","skillDuration","minionDamage"].includes(s.id))).toBe(false);
  });

  it.each(fixtures)("scores $name's signed overlapping wording once and keeps ownership separate", f => {
    const current = addSkillPresetPreferences(settings(f.id),preset(f.id));
    expect(passivePreferenceValues(node("10% increased Attack Damage","20% increased Damage with Spears","5% reduced Damage with Spears",
      "10% increased Melee Damage","20% increased Attack Area Damage","5% reduced Attack Area Damage","20% increased Elemental Damage with Attacks",
      "100% increased Damage with Maces","100% increased Spell Area Damage"),current))
      .toEqual({ attackDamage: 10+(f.spear ? 15 : 0)+(f.melee ? 10 : 0), ...(f.area ? { attackAreaDamage: 15 } : {}), ...(f.conversion ? { elementalDamage: 20 } : {}) });
    expect(passivePreferenceValues(node("12% increased Attack Speed with Spears","5% reduced Attack Speed with Spears"),current)).toEqual(f.spear ? { attackSpeed: 7 } : {});
    expect(passivePreferenceValues(node("10% increased Stun Buildup with Melee Damage"),current)).toEqual(f.stun ? { stunBuildup: 10 } : {});
    expect(passivePreferenceValues(node("20% increased Area Damage","5% reduced Area Damage"),current)).toEqual(f.area ? { areaDamage: 15 } : {});
    expect(scorePassiveNode(node("Minions deal 100% increased Damage","Totems deal 100% increased Damage","100% increased Spell Damage"),current.preferences,current)).toBe(0);
    expect(passivePreferenceValues(node("20% increased Damage with Spears per Frenzy Charge","20% increased Area Damage while Channelling"),current)).toEqual({});
  });

  it.each(fixtures)("offers $name's reviewed support families without silently changing manual weights", f => {
    const expected = supportIds.filter(id => (!id.startsWith("projectile-acceleration") || attackClosureProjectileIds.includes(f.id))
      && (!id.startsWith("prolonged-duration") || attackClosureDurationIds.includes(f.id))
      && (!id.startsWith("rapid-attacks") || f.id !== "trail-of-caltrops"));
    expect(preCommon45SupportsFor(f.id).map(s => s.id)).toEqual(expected);
    expect(expected).toHaveLength(f.supportCount);
    for (const support of expected) {
      const before = addSkillPresetPreferences(settings(f.id),preset(f.id));
      const selected = setSkillSupport(before,support,true);
      expect(selected.preferences).toEqual(before.preferences);
      const value = node("20% increased Attack Damage");
      expect(scorePassiveNode(value,selected.preferences,selected)).toBe(scorePassiveNode(value,before.preferences,before));
      const applied = applySkillSupportPriorities(selected,preset(f.id));
      if (support === "concentrated-area" && f.area) expect(applied.preferences).toContainEqual({ id: "areaOfEffect", weight: 2 });
      else expect(applied.preferences).toEqual(before.preferences);
      if (support.startsWith("brutality")) {
        const refined = refineSkillPreferencePreset(preset(f.id),[support]);
        expect(refined.suggestions.some(s => ["fireDamage","coldDamage","lightningDamage","elementalDamage"].includes(s.id))).toBe(false);
        if (f.conversion === 1) expect(refined.suggestions.some(s => ["attackDamage","attackAreaDamage"].includes(s.id))).toBe(false);
      }
    }
    expect(normalizeSkillSupportIds(f.id,["rapid-attacks-ii","rapid-attacks-i","prolonged-duration-i","prolonged-duration-ii","projectile-acceleration-i","projectile-acceleration-ii","brutality-ii","brutality-iii","spell-echo"]))
      .toEqual([...(f.id !== "trail-of-caltrops" ? ["rapid-attacks-ii"] : []),...(attackClosureDurationIds.includes(f.id) ? ["prolonged-duration-i"] : []),...(f.projectile ? ["projectile-acceleration-i"] : []),"brutality-ii"]);
  });

  it.each(fixtures)("independently checks $name's recorded native hit, conversion, costs, radius and timing", f => {
    expect(f.phys).toEqual(f.source.map(v => Math.round(v*f.multiplier*(1-f.conversion))));
    if (f.conversion) expect(f.converted).toEqual(f.source.map(v => Math.round(v*f.multiplier*f.conversion)));
    const hit = (f.phys[0]+f.phys[1]+(f.conversion ? f.converted[0]+f.converted[1] : 0))/2*(1+f.crit/100);
    expect(f.hit).toBeCloseTo(hit,10);
    expect(f.effCost).toBe(Math.ceil(f.mana*.6)); expect(f.magCost).toBe(Math.floor(f.mana*1.3)); expect(f.brutCost).toBe(Math.floor(f.mana*1.2));
    if ("radius" in f) {
      expect(f.magRadius).toBe(Math.floor(f.radius*Math.floor(100*Math.sqrt(1.45))/100));
      expect(f.concRadius).toBe(Math.floor(f.radius*Math.floor(100*Math.sqrt(.5))/100));
    }
    if (f.id === "trail-of-caltrops") { expect(f.concHit).toBe(f.hit); expect(f.speed).toBe(0); }
    else expect(f.concHit).toBeGreaterThan(f.hit);
    expect(f.brutHit).toBeCloseTo(f.source.map(v => Math.round(v*f.multiplier*(1-f.conversion)*1.3)).reduce((a,b) => a+b,0)/2*(1+f.crit/100),10);
    const fixed = f.id === "escape-shot" ? .7 : f.id === "thunderous-leap" ? 1.1 : f.id === "wing-blast" ? .3 : 0;
    if (f.speed) expect(f.rapid).toBeCloseTo(1/((1/f.speed-fixed)/1.25+fixed),10);
    if ("duration" in f) {
      const base = f.id === "trail-of-caltrops" ? 8 : 3;
      expect(f.duration).toBeCloseTo(Math.ceil(base/.033)*.033,10);
      expect(f.prolonged).toBeCloseTo(Math.ceil(base*1.35/.033)*.033,10);
    }
  });

  it("records native ownership discrepancies instead of converting uncertain behavior into suggestions", () => {
    expect(attackClosureOwnershipControls).toEqual([
      { id: "elemental-sundering", values: [105,210,210,105,105] },
      { id: "trail-of-caltrops", values: [308.7,616.875,308.7,616.875,308.7] },
      { id: "twister", values: [17.325,34.125,34.125,34.125,17.325] },
    ]);
    const trail = preset("trail-of-caltrops");
    expect(trail.description).toContain("area/weapon handling disagrees");
    expect(trail.passiveStatScopes).not.toContain("spearAttackDamage");
    expect(trail.exclusions.find(e => e.id === "areaDamage")?.reason).toContain("no effect");
    expect(preCommon45SupportsFor(trail.id).find(s => s.id === "efficiency-ii")?.summary).toContain("still reserves 30 Spirit");
    expect(preCommon45SupportsFor(trail.id).find(s => s.id === "concentrated-area")?.summary).toContain("hit damage is unchanged");
    expect(preCommon45SupportsFor(trail.id).find(s => s.id === "concentrated-area")?.priorities).toEqual([]);
    expect(preset("elemental-sundering").description).toContain("initial pulse is non-damaging");
    expect(preset("elemental-sundering").exclusions.map(e => e.id)).toEqual(expect.arrayContaining(["freezeBuildup","shockChance","igniteMagnitude"]));
    expect(preset("wing-blast").exclusions.find(e => e.id === "stunBuildup")?.reason).toContain("externally Primed");
    expect(preset("cull-the-weak").exclusions.find(e => e.id === "accuracy")?.reason).toContain("always hits");
    for (const id of attackClosureDurationIds) expect(preCommon45SupportsFor(id).find(s => s.id === "prolonged-duration-ii")?.priorities).toEqual([]);
    expect(preCommon45SupportsFor("flame-breath").find(s => s.id === "prolonged-duration-ii")?.summary).toContain("does not extend the minimum channel");
    expect(fixtures.reduce((n,f) => n+f.supportCount,0)).toBe(132);
  });

  it("round-trips all twelve focuses and common supports without changing manual choices", () => {
    for (const f of fixtures) {
      const current = addSkillPresetPreferences(setSkillSupport(setSkillSupport(settings(f.id),"brutality-i",true),"brutality-ii",true),preset(f.id));
      expect(current.preferences.slice(0,2)).toEqual(settings(f.id).preferences); expect(current.supportGemIds).toEqual(["brutality-ii"]);
      expect(normalizePassiveOptimizationSettings(current)).toEqual(current);
      const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
        selectedClassStartId: "huntress", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["goal"], ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: current,
        allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
      } }]);
      expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))).toEqual([saved]);
    }
  });
});

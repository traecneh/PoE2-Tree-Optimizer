import { describe, expect, it } from "vitest";
import { poisonBowStunSupportFixtures as supports, poisonBowStunComponents as components, poisonBowStunControls as controls } from "./poisonBowStunSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "stunBuildup",weight: 3 },{ id: "poisonMagnitude",weight: 3 },{ id: "manaCostEfficiency",weight: 2 }] });

describe("Stun supports for reviewed Poison bow focuses", () => {
  for (const skill of poisonBowIds) it.each(supports)(`reviews ${skill}'s $name without treating Poison as hit buildup or assuming uptime`, f => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: f.name,effectId: f.effectId,family: f.family });
    expect(s.sourceUrl).toContain(`sup_str.lua#L${f.line}`);
    for (const text of [`${f.more}% more Stun Buildup for actual Hits`, "not percentage points of Stun chance", "supplies no Stun Buildup",
      "synthetic burst/cloud source-hit buildup fields are not real stuns", "20% higher Mana cost before rounding",
      "other support cost multipliers combine before rounding", "Cannot Immobilise Enemies still prevents Heavy Stun",
      "Buildup is not Stun duration, guaranteed Heavy Stun or uptime", "No extra contacts, threshold crossings, stun lock or Heavy-Stunned-enemy benefits",
      "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (f.lessDamage) for (const text of ["50% less Damage is a broad penalty, not Hits-only", "reduces the supported skill's weapon-derived Poison source",
      "not 4x the original total buildup", "final values need not be exactly halved", "do not apply the damage penalty twice"]) expect(s.summary).toContain(text);
    else expect(s.summary).toContain("No added damage penalty or Poison damage bonus");
    if (skill === "gas-arrow") expect(s.summary).toContain("conditional Fire explosion");
    const current = settings(skill), selected = setSkillSupport(current,f.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [f.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Stun Buildup", "20% increased Mana Cost Efficiency", "20% increased Magnitude of Poison you inflict",
      "20% increased Physical Damage", "Minions have 20% increased Stun Buildup"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("checks $skill's $component damage and buildup without inventing real no-hit stuns", f => {
    const fire = f.component.includes("Fire"), hitFactor = (fire ? 1 : .25)*1.05, typeBuildup = fire ? 1 : 1.5;
    expect(f.hit).toBeCloseTo((f.range[0]+f.range[1])/2*hitFactor,9);
    expect(f.tierIIIHit).toBeCloseTo((f.tierIIIRange[0]+f.tierIIIRange[1])/2*hitFactor,9);
    expect(f.buildup).toBeCloseTo(f.hit*typeBuildup*.58/271810*100,12);
    expect(f.tierIIIBuildup).toBeCloseTo(f.tierIIIHit*typeBuildup*.58/271810*4*100,12);
    expect(f.tierIIIBuildup).not.toBeCloseTo(f.buildup*4,8);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === "stun-iii")!.summary).toContain("source-hit buildup fields are not real stuns");
  });

  it.each(controls)("reconstructs %s's Poison tradeoffs, increased/More buildup and compounded Mana cost", f => {
    const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const poison = (range: readonly number[],duration: number,chance: number) => {
      const potential = 1.2*duration*chance, roll = potential/(potential+1), critPresence = 1-.95**potential;
      return (range[0]+(range[1]-range[0])*roll)*(1+critPresence)*.2;
    };
    expect(f.sourcePoison).toBeCloseTo(poison(source.range,f.sourceDuration,1),9);
    expect(f.tierIIISourcePoison).toBeCloseTo(poison(source.tierIIIRange,f.sourceDuration,1),9);
    expect(f.arrowPoison).toBeCloseTo(poison(arrow.range,2,.6),9);
    expect(f.tierIIIArrowPoison).toBeCloseTo(poison(arrow.tierIIIRange,2,.6),9);
    expect(f.moreMagnitudePoison).toBeCloseTo(f.tierIIISourcePoison*1.2,9);
    expect(f.supportedCost).toBe(Math.floor(f.cost*1.2));
    expect(f.doubleSupportedCost).toBe(Math.floor(f.cost*1.2*1.2));
    expect(f.increasedBuildup[0]).toBeCloseTo(arrow.buildup*2,12);
    expect(f.increasedBuildup[1]).toBeCloseTo(arrow.buildup*2*1.5,12);
    expect(f.increasedBuildup[2]).toBeCloseTo(arrow.buildup*2*1.7,12);
    expect(f.increasedBuildup[3]).toBeCloseTo(arrow.tierIIIBuildup*2,12);
    expect(f.blockedBuildup).toBe(0);
  });

  it.each(poisonBowIds)("replaces only %s's Stun tier and preserves recovery families, warnings, weights and saved goals", skill => {
    const peers = ["life-leech-iii","mana-leech","ambush","poison-iii","corrosion","inexorable-critical-ii",...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    const preset = getSkillPreferencePreset(skill)!, initial = { ...settings(skill),supportGemIds: peers };
    let selected: PassiveOptimizationSettings = initial;
    for (const f of supports) {
      selected = setSkillSupport(selected,f.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,f.id] });
      expect(normalizeSkillSupportIds(skill,[f.id,f.id,null,"stun-iv"])).toEqual([f.id]);
      const resolved = selectedSkillSupports(preset,selected.supportGemIds);
      for (const peer of selectedSkillSupports(preset,peers)) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,peers));
      const [saved] = normalizeSavedBuilds([{ id: skill,name: skill,createdAt: "test",updatedAt: "test",state: {
        selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
        activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: selected,
        allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
      } }]);
      const [restored] = parseSavedBuildExport(serializeSavedBuildExport([saved]));
      expect(restored.state.optimizerSettings).toEqual(selected);
      expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
      expect(setSkillSupport(selected,f.id,false)).toEqual(initial);
    }
  });

  it("keeps six reviewed pairs narrow without deriving a global Hit-skill allowlist", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([2,4,5]);
    expect(reviewedSkillSupports.filter(s => s.family === "Stun")).toHaveLength(3);
    for (const f of supports) {
      expect(reviewedSkillSupports.find(s => s.id === f.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),f.id,true)).toEqual(settings(skill));
    }
    expect(normalizeSkillSupportIds("gas-arrow",["stun-i","stun-ii","stun-iii"])).toHaveLength(1);
  });
});

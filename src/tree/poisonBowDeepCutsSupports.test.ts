import { describe, expect, it } from "vitest";
import { poisonBowDeepCutsSupports as supports, poisonBowDeepCutsComponents as components, poisonBowDeepCutsInteractions as interactions } from "./poisonBowDeepCutsSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "bleedingMagnitude",weight: 3 },{ id: "poisonMagnitude",weight: 3 },{ id: "attackDamage",weight: 2 }] });
const note = (skill: string,id: string,ids?: string[]) => reviewedSkillSupportsFor(skill,ids).find(s => s.id === id)!.summary;

describe("Deep Cuts for reviewed Poison bow focuses", () => {
  for (const skill of poisonBowIds) it.each(supports)(`reviews ${skill}'s $name without treating Bleeding magnitude as Poison or ignoring hit penalties`, f => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: f.name,effectId: f.effectId,family: f.family });
    expect(s.sourceUrl).toContain(`sup_str.lua#L${f.line}`);
    for (const text of [`${f.lessHit}% less Damage with Hits`,`${f.moreBleed}% more Bleeding magnitude, not Poison magnitude`,
      "Does not grant Bleeding chance", "separate source is required", "reduces the stored damage used for weapon-derived Poison",
      "The Bleeding bonus does not compensate Poison", "stage rounding", "Poison III", "condition is not supplied or assumed",
      "Deadly Poison", "both hit penalties still apply", "Synthetic source-hit Bleeding is not real burst/cloud Bleeding",
      "does not Aggravate Bleeding", "No extra hits, stacks or Bleeding/aggravation uptime", "No added Mana multiplier from Deep Cuts",
      "One Deep Cuts tier at a time", "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (skill === "gas-arrow") expect(s.summary).toContain("fully converted Fire detonation has no Physical Bleeding source");
    const current = settings(skill), selected = setSkillSupport(current,f.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [f.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Magnitude of Bleeding you inflict", "20% increased Magnitude of Poison you inflict",
      "20% increased Attack Damage", "Minions deal 20% increased Physical Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("independently separates $skill's $component stored source and actual applications", f => {
    for (const [i,mag] of [1,1.75,2].entries()) {
      const [min,max] = f.range[i], potential = 1.2*5, roll = potential/(potential+1), crit = 1-.95**potential;
      expect(f.bleed[i]).toBeCloseTo((min+(max-min)*roll)*(1+crit)*.15*mag,10);
      if (f.duration) {
        const potential = 1.2*f.duration, roll = potential/(potential+1), crit = 1-.95**potential;
        expect(f.poison[i]).toBeCloseTo((min+(max-min)*roll)*(1+crit)*.2,10);
        if (i) expect(f.poison[i]).toBeLessThan(f.poison[0]);
        expect(f.actualHit).toBe(false);
      }
      if (i) expect(f.hit[i]).toBeLessThan(f.hit[0]);
    }
    if (!f.actualHit) for (const s of supports) expect(note(f.skill,s.id)).toContain("Synthetic source-hit Bleeding is not real");
    if (f.actualHit && !f.physical) expect(f.bleed).toEqual([0,0,0]);
  });

  it.each(interactions)("checks %s's separate Bleeding multiplier, optional aggravation and Poison penalties", f => {
    const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    for (const [i,mag] of [1.75,2].entries()) {
      expect(arrow.bleed[i+1]).toBeCloseTo(f.hitOnlyBleed[i]*mag,10);
      expect(f.aggravated[i]).toBeCloseTo(arrow.bleed[i+1]*2,10);
      expect(arrow.bleed[i+1]).not.toBeCloseTo(arrow.bleed[0]*mag,8);
      expect(f.arrowPoison[i+1]).toBeLessThan(f.arrowPoison[0]);
      expect(f.deadlyPoison[i+1]).toBeLessThan(f.deadlyPoison[0]);
    }
    expect(f.poisonCost).toBe(Math.floor(arrow.mana*1.2));
  });

  it.each(poisonBowIds)("round-trips %s's tier replacement without changing peers, warnings, priorities or goals", skill => {
    const peers = ["bleed-iii","poison-iii","deadly-poison-ii","pin-i","stun-iii","rupture","rusted-spikes",...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    const initial = { ...settings(skill),supportGemIds: peers };
    const prior = selectedSkillSupports(getSkillPreferencePreset(skill)!,peers);
    const first = setSkillSupport(initial,"deep-cuts-i",true), current = setSkillSupport(first,"deep-cuts-ii",true);
    expect(first.supportGemIds).toEqual([...peers,"deep-cuts-i"]);
    expect(current.supportGemIds).toEqual([...peers,"deep-cuts-ii"]);
    for (const s of prior) expect(note(skill,s.id,current.supportGemIds)).toBe(s.summary);
    const [saved] = normalizeSavedBuilds([{ id: skill,name: skill,createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: current,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    const [restored] = parseSavedBuildExport(serializeSavedBuildExport([saved]));
    expect(restored.state.optimizerSettings).toEqual(current); expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(setSkillSupport(current,"deep-cuts-ii",false)).toEqual(initial);
  });

  it("keeps one family and four reviewed pairs narrow, rejecting duplicates, conflicting tiers and unrelated focuses", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([3,5]);
    expect(reviewedSkillSupports.filter(s => s.family === "DeepCuts").map(s => s.id)).toEqual(supports.map(s => s.id));
    for (const s of supports) {
      expect(reviewedSkillSupports.find(r => r.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),s.id,true)).toEqual(settings(skill));
    }
    expect(normalizeSkillSupportIds("gas-arrow",["deep-cuts-i","deep-cuts-i","deep-cuts-ii","bleed-iii"]))
      .toEqual(["deep-cuts-i","bleed-iii"]);
  });
});

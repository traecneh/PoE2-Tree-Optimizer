import { describe, expect, it } from "vitest";
import { poisonBowPinSupportFixtures as supports, poisonBowPinComponents as components, poisonBowPinControls as controls } from "./poisonBowPinSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "pinBuildup",weight: 3 },{ id: "stunBuildup",weight: 2 },{ id: "criticalChance",weight: 2 },{ id: "poisonMagnitude",weight: 3 }] });

describe("Pin supports for reviewed Poison bow focuses", () => {
  for (const skill of poisonBowIds) it.each(supports)(`reviews ${skill}'s $name without assuming immobilisation uptime`, f => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: f.name,effectId: f.effectId,family: f.family });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${f.line}`);
    for (const text of ["Physical damage from actual Hits can build Pin", "this supported skill cannot Stun", "Generic Stun Buildup modifiers redirect to Pin instead",
      "not a second Heavy Stun benefit", "supplies no Pin Buildup", "source-hit fields are not real Pin applications or proof of critical-state inheritance",
      "Cannot Immobilise Enemies still prevents Pin", "Linking Stun III keeps its damage penalty and higher Mana cost", "redirected modifiers are counted once",
      "No added Mana multiplier from Pin itself", "No extra contacts, threshold crossings, guaranteed Pin or immobilisation uptime",
      "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (f.tier === 2) for (const text of ["50% increased Critical Hit Chance only against Immobilised enemies", "5% becomes 7.5% before caps",
      "not 50 percentage points or a More multiplier", "adds to other increased chance", "cannot restore prohibited critical hits", "fixed snapshot"]) expect(s.summary).toContain(text);
    if (f.tier === 3) for (const text of ["60% less Pin Buildup (0.4x)", "30% more Pin duration", "does not map this duration stat",
      "no live duration in seconds is claimed"]) expect(s.summary).toContain(text);
    if (f.tier === 1) expect(s.summary).toContain("No conditional critical-chance bonus or duration modifier");
    if (skill === "gas-arrow") expect(s.summary).toContain("fully converted Fire explosion supplies no Physical Pin buildup");
    const current = settings(skill), selected = setSkillSupport(current,f.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [f.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Pin Buildup", "20% increased Stun Buildup", "20% increased Critical Hit Chance", "20% increased Magnitude of Poison you inflict",
      "20% increased Physical Damage", "Minions have 20% increased Critical Hit Chance"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("checks $skill's $component Pin estimate without applying it to Poison", f => {
    const buildup = (chance: number) => (f.physicalHit*(1-chance)+f.physicalCrit*chance)*4.2/271810*100;
    expect(f.pin).toBeCloseTo(buildup(.05),12);
    expect(f.tierIII).toBeCloseTo(buildup(.05)*.4,12);
    expect(f.immobilisedPin).toBeCloseTo(buildup(.075),12);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === "pin-iii")!.summary).toContain("not real Pin applications");
    if (f.component.includes("Fire")) expect(f.pin).toBe(0);
  });

  it.each(controls)("reconstructs %s's conditional critical snapshot without assuming first-hit or sustained activation", f => {
    const poison = (range: readonly number[],duration: number,chance: number,poisonChance: number) => {
      const potential = 1.2*duration*poisonChance, roll = potential/(potential+1), critPresence = 1-(1-chance)**potential;
      return (range[0]+(range[1]-range[0])*roll)*(1+critPresence)*.2;
    };
    expect(f.sourcePoison).toBeCloseTo(poison(f.sourceRange,f.sourceDuration,.05,1),9);
    expect(f.immobilisedSourcePoison).toBeCloseTo(poison(f.sourceRange,f.sourceDuration,.075,1),9);
    expect(f.arrowPoison).toBeCloseTo(poison(f.arrowRange,2,.05,.6),9);
    expect(f.immobilisedArrowPoison).toBeCloseTo(poison(f.arrowRange,2,.075,.6),9);
    expect(5*(1+(100+50)/100)).toBe(12.5);
    expect(f.mappedPinDurationMore).toBe(1);
    expect(f.linkedCost).toBe(Math.floor(f.cost*1.2));
  });

  it.each(controls)("checks %s's Stun conversion once, preserves costs/penalties and restores warnings on removal", f => {
    expect(f.stunPairs[0]).toBeCloseTo(f.basePin*1.5,12);
    expect(f.stunPairs[1]).toBeCloseTo(f.basePin*1.7,12);
    const changedHit = (f.stunIIIRange[0]+f.stunIIIRange[1])/2*.25*1.05;
    expect(f.stunPairs[2]).toBeCloseTo(changedHit*4.2/271810*4*100,12);
    expect(f.pinIIIStunIII).toBeCloseTo(f.stunPairs[2]*.4,12);
    expect(f.increasedStun).toBeCloseTo(f.basePin*2,12);
    expect(f.increasedBoth).toBeCloseTo(f.basePin*3,12);
    const initial = { ...settings(f.skill),supportGemIds: ["stun-iii","mana-leech","pinpoint-critical"] };
    const preset = getSkillPreferencePreset(f.skill)!, before = selectedSkillSupports(preset,initial.supportGemIds);
    const selected = setSkillSupport(initial,"pin-i",true), resolved = selectedSkillSupports(preset,selected.supportGemIds);
    expect(resolved.find(s => s.id === "stun-iii")!.summary).toContain("Pin is selected: this supported skill cannot Stun");
    expect(resolved.find(s => s.id === "stun-iii")!.summary).toContain("Stun III's damage penalty and all Stun tiers' Mana multipliers still apply");
    for (const s of before.filter(s => s.family !== "Stun")) expect(resolved.find(r => r.id === s.id)!.summary).toBe(s.summary);
    expect(selectedSkillSupports(preset,setSkillSupport(selected,"pin-i",false).supportGemIds)).toEqual(before);
    const reversed = selectedSkillSupports(preset,["pin-i","stun-iii"]).find(s => s.family === "Stun")!;
    expect(reversed.summary).toBe(resolved.find(s => s.id === "stun-iii")!.summary);
  });

  it.each(poisonBowIds)("replaces only %s's Pin tier and preserves other families, weights and saved goals", skill => {
    const peers = ["stun-iii","pinpoint-critical","life-leech-iii","mana-leech","poison-iii",...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    const preset = getSkillPreferencePreset(skill)!, initial = { ...settings(skill),supportGemIds: peers };
    let selected: PassiveOptimizationSettings = initial;
    for (const f of supports) {
      selected = setSkillSupport(selected,f.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,f.id] });
      expect(normalizeSkillSupportIds(skill,[f.id,f.id,null,"pin-iv"])).toEqual([f.id]);
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

  it("keeps six pairs narrow and Pin distinct from Pinpoint Critical", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([1,2,5]);
    expect(reviewedSkillSupports.filter(s => s.family === "Pin")).toHaveLength(3);
    for (const f of supports) {
      expect(reviewedSkillSupports.find(s => s.id === f.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),f.id,true)).toEqual(settings(skill));
    }
    expect(normalizeSkillSupportIds("gas-arrow",["pinpoint-critical","pin-i","pin-ii","pin-iii"])).toEqual(["pinpoint-critical","pin-i"]);
  });
});

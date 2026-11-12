import { describe, expect, it } from "vitest";
import { poisonBowBleedAggravationSupports as supports, poisonBowBleedAggravationComponents as components,
  poisonBowBleedAggravationStates as states, poisonBowBleedAggravationControls as controls } from "./poisonBowBleedAggravationSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "bleedingMagnitude",weight: 3 },{ id: "poisonMagnitude",weight: 3 },{ id: "pinBuildup",weight: 2 }] });
const note = (skill: string,id: string,ids?: string[]) => reviewedSkillSupportsFor(skill,ids).find(s => s.id === id)!.summary;

describe("Rupture and Rusted Spikes for reviewed Poison bow focuses", () => {
  for (const skill of poisonBowIds) it.each(supports)(`reviews ${skill}'s $name without turning aggravation into Poison or guaranteed events`, f => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: f.name,effectId: f.effectId,family: f.family });
    expect(s.sourceUrl).toContain(`sup_str.lua#L${f.line}`);
    for (const text of ["existing Bleeding", "Neither support supplies Bleeding chance, Heavy Stun or Pin", "Aggravation affects Bleeding, not Poison",
      "does not establish Poison III/Admixture's enemy conditions", "does not map either support's aggravation stat",
      "unchanged Bleed output with Heavy Stun/Pinned flags is not zero effect in game", "A manually aggravated Bleed is a separate control",
      "one existing damage factor in this model, not two stacking bonuses", "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (f.id === "rupture") {
      expect(s.summary).toContain("when they Hit a Heavily Stunned enemy");
      expect(s.summary).toContain("Merely Stunned or Pinned is not the Heavy Stun requirement");
      expect(s.summary).toContain("No added Mana multiplier from Rupture");
    } else {
      expect(s.summary.startsWith("Catalog-only review: tier 0")).toBe(true);
      for (const text of ["current availability is unverified", "when this supported skill Pins an enemy", "not 100% chance to inflict Pin or Bleeding",
        "Hitting an already Pinned enemy or another source's Pin", "10% higher Mana cost even without a qualifying Pin event", "Cannot Immobilise Enemies"]) expect(s.summary).toContain(text);
    }
    if (skill === "poisonburst-arrow") expect(s.summary).toContain("synthetic source-hit Bleeding is not real burst Bleeding");
    else expect(s.summary).toContain(f.id === "rupture" ? "Fire detonation can Hit an already Heavily Stunned target" : "Fire detonation supplies no Physical Pin buildup");
    const current = settings(skill), selected = setSkillSupport(current,f.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [f.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Magnitude of Bleeding you inflict", "20% increased Magnitude of Poison you inflict",
      "20% increased Pin Buildup", "20% increased Stun Buildup", "Minions deal 20% increased Physical Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("keeps $skill's $component fields separate from real Hit/Pin applications", f => {
    expect(f.spikesMana).toBe(Math.floor(f.mana*1.1));
    if (!f.actualHit) { expect(f.poison).toBeGreaterThan(0); expect(f.bleed).toBeGreaterThan(0); }
    if (f.actualHit && !f.physical) expect(f.bleed).toBe(0);
    for (const s of supports) expect(note(f.skill,s.id)).toContain("not proof of a trigger");
  });

  it.each(states)("keeps the native $state snapshot unaggravated rather than inventing an event mapping", f => {
    expect(f.aggravated).toBe(false); expect(f.factor).toBe(1);
  });

  it.each(controls)("checks %s's explicit aggravation/moving overlap and independent Stun/Pin costs", f => {
    expect(f.aggravated).toBeCloseTo(f.bleed*2,10);
    expect(f.moving).toBe(f.aggravated); expect(f.both).toBe(f.aggravated);
    expect(f.both).not.toBeCloseTo(f.bleed*4,8);
    expect(f.pin).toBeGreaterThan(0); expect(f.heavyWithPin).toBe(0); expect(f.cannotPin).toBe(0);
    expect(f.stunIIIBleed).toBeLessThan(f.bleed);
    const base = components.find(c => c.skill === f.skill && c.component === "arrow")!.mana;
    expect(f.stunIIICost).toBe(Math.floor(base*1.2*1.1));
    expect(f.efficiencyCost).toBe(Math.ceil(Math.floor(base*1.1)*.6));
  });

  it.each(poisonBowIds)("reverses %s's Pin-specific notes without claiming Rupture is globally incompatible", skill => {
    const ids = supports.map(s => s.id);
    for (const pin of ["pin-i","pin-ii","pin-iii"]) {
      const chosen = [...ids,pin];
      expect(note(skill,"rupture",chosen)).toContain("cannot supply its own Heavy Stun for Rupture");
      expect(note(skill,"rupture",chosen)).toContain("can still Hit a target Heavily Stunned by a separate source");
      expect(note(skill,"rusted-spikes",chosen).startsWith("Catalog-only review: tier 0")).toBe(true);
      expect(note(skill,"rusted-spikes",chosen)).toContain("does not prove a new supported-skill Pin event");
      const state = chosen.reduce((s,id) => setSkillSupport(s,id,true),settings(skill));
      const removed = setSkillSupport(state,pin,false);
      for (const id of ids) expect(note(skill,id,removed.supportGemIds)).toBe(note(skill,id));
    }
    for (const invalid of [undefined,[],["pin-iv"]]) expect(note(skill,"rupture",invalid)).toBe(note(skill,"rupture"));
  });

  it.each(poisonBowIds)("round-trips %s's two families while preserving earlier links, goal and priorities", skill => {
    const peers = ["pin-i","stun-iii","bleed-iii","poison-iii","armour-explosion","corrosion","exploit-weakness",...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    const initial = { ...settings(skill),supportGemIds: peers };
    const prior = selectedSkillSupports(getSkillPreferencePreset(skill)!,peers);
    const current = supports.reduce<PassiveOptimizationSettings>((s,f) => setSkillSupport(s,f.id,true),initial);
    expect(current.supportGemIds).toEqual([...peers,...supports.map(s => s.id)]);
    for (const s of prior) expect(note(skill,s.id,current.supportGemIds)).toBe(s.summary);
    const [saved] = normalizeSavedBuilds([{ id: skill,name: skill,createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: current,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    const [restored] = parseSavedBuildExport(serializeSavedBuildExport([saved]));
    expect(restored.state.optimizerSettings).toEqual(current); expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(note(skill,"rupture",restored.state.optimizerSettings?.supportGemIds)).toContain("Pin is selected");
    const noRupture = setSkillSupport(current,"rupture",false);
    expect(noRupture.supportGemIds).toEqual([...peers,"rusted-spikes"]);
    expect(setSkillSupport(noRupture,"rusted-spikes",false)).toEqual(initial);
  });

  it("keeps two distinct families and four reviewed pairs narrow, including catalog-only availability", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([3,0]);
    for (const s of supports) {
      expect(reviewedSkillSupports.filter(r => r.family === s.family)).toHaveLength(1);
      expect(reviewedSkillSupports.find(r => r.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),s.id,true)).toEqual(settings(skill));
    }
    expect(normalizeSkillSupportIds("gas-arrow",["rupture","rusted-spikes","rupture","pin-iii","stun-iii","bleed-iii"]))
      .toEqual(["rupture","rusted-spikes","pin-iii","stun-iii","bleed-iii"]);
  });
});

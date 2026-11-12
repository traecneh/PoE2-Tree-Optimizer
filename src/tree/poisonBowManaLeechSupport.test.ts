import { describe, expect, it } from "vitest";
import { poisonBowManaLeechSupportFixture as support, poisonBowManaLeechComponents as components, poisonBowManaLeechControls as controls } from "./poisonBowManaLeechSupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "manaLeechAmount",weight: 3 },{ id: "manaCostEfficiency",weight: 2 },{ id: "poisonMagnitude",weight: 3 }] });

describe("Mana Leech for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's Physical hit recovery without inventing Poison recovery or sustainable firing", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_int.lua#L${support.line}`);
    for (const text of ["8% of Physical Attack Damage Leeched as Mana from actual arrow Hits", "not total damage or instant Mana on Hit",
      "Poison is Chaos damage over time", "generates no recovery from this support", "source-hit leech fields are not real Mana recovery",
      "Recovery amount, delivery speed, duration and caps are separate", "Cannot Leech Mana and Cannot Gain Mana still prevent recovery",
      "No added Mana multiplier is not a refund", "upfront Mana expenditure and later hit recovery remain separate", "other supports still cost Mana",
      "No guaranteed hits, recovery uptime, sustainable firing", "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (skill === "gas-arrow") expect(s.summary).toContain("converts all its Physical damage to Fire and supplies no Physical-hit leech");
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased amount of Mana Leeched", "20% increased Mana Cost Efficiency", "20% increased Magnitude of Poison you inflict",
      "20% increased Physical Damage", "Minions have 20% increased Physical Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("separates $skill's $component estimate from actual recovery eligibility", f => {
    const packet = (f.physicalHit*.95+f.physicalCrit*.05)*support.percent/100;
    expect(f.packet).toBeCloseTo(packet,9);
    expect(f.rate).toBeCloseTo(packet*1.2,9);
    const note = reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary;
    if (!f.actualHit) expect(note).toContain("source-hit leech fields are not real Mana recovery");
    if (f.component.includes("Fire")) expect(packet).toBe(0);
  });

  it.each(controls)("checks %s's caps, restrictions and Mana expenditure without a sustain claim", f => {
    const mana = 2541, instanceRate = mana*.02, instanceCap = mana*.1, totalCap = mana*.2;
    const duration = f.packet/instanceRate;
    expect(f.rate).toBeCloseTo(Math.min(duration*1.2*instanceRate,totalCap),9);
    expect(f.spend).toBeCloseTo(f.cost*1.2,9);
    expect(f.linkedCost).toBe(Math.floor(f.cost*1.2));
    expect(f.linkedSpend).toBeCloseTo(f.linkedCost*1.2,9);
    expect(f.linkedSpend).toBeGreaterThan(f.rate);
    expect(f.stressHit*.08).toBeGreaterThan(instanceCap);
    const packet = Math.min(f.stressHit*.08,instanceCap)*.95+Math.min(f.stressCrit*.08,instanceCap)*.05;
    expect(f.stressPacket).toBeCloseTo(packet,9);
    expect(f.stressDuration).toBeCloseTo(packet/instanceRate,9);
    expect(f.stressRate).toBeCloseTo(Math.min(packet/.033,totalCap),9);
    expect(f.stressSpend).toBeCloseTo(f.cost/.033,8);
    expect(f.stressSpend).toBeGreaterThan(f.stressRate);
    expect(f.cannotLeech).toBe(0); expect(f.cannotGain).toBe(0);
    expect(f.morePoison).toBeCloseTo(f.poison*1.2,9);
    expect(f.packet).toBe(components.find(c => c.skill === f.skill && c.component === "arrow")!.packet);
  });

  it.each(poisonBowIds)("preserves %s's Life Leech family, previous warnings, weights and saved goals", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    for (const life of ["life-leech-i","life-leech-ii","life-leech-iii"]) {
      const peers = [life,"ambush","poison-iii","corrosion","inexorable-critical-ii","momentum",...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
      const initial = { ...settings(skill),supportGemIds: peers }, selected = setSkillSupport(initial,support.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,support.id] });
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
      expect(setSkillSupport(selected,support.id,false)).toEqual(initial);
    }
  });

  it("keeps two reviewed pairs narrow without inventing extra Mana Leech tiers", () => {
    expect(support.catalogTier).toBe(2);
    expect(reviewedSkillSupports.filter(s => s.family === "ManaLeech")).toHaveLength(1);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    expect(normalizeSkillSupportIds("gas-arrow",[support.id,support.id,null,"mana-leech-ii"])).toEqual([support.id]);
    for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
      expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
  });
});

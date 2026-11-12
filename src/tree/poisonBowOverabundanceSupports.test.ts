import { describe, expect, it } from "vitest";
import { poisonBowOverabundanceSupportFixtures as supports, gasArrowOverabundanceComponents as components, gasArrowOverabundanceNative as native } from "./poisonBowOverabundanceSupports.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId = "gas-arrow"): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7,
  preferences: [{ id: "physicalDamage", weight: 2 }, { id: "skillDuration", weight: 1 }, { id: "poisonMagnitude", weight: 3 }] });

describe("Gas Arrow Overabundance and Poisonburst rejection", () => {
  it.each(supports)("reviews $name without counting cloud capacity as Poison stacks or changing scores", support => {
    const s = reviewedSkillSupportsFor("gas-arrow").find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${support.line}`);
    for (const text of ["+1 to the cloud Limit (base six to seven)", `${support.lessDuration}% less skill-effect duration`,
      "separate two-second Poison duration is unchanged", "higher cloud cap is not current cloud count, extra Poison stacks or a damage multiplier",
      "Shorter persistence can reduce coverage and growth opportunity", "cloud placement, overlap, ignition and detonation are not simulated",
      "limit/charge fields do not simulate cloud occupancy or validate extra cooldown uses", "Poisonburst Arrow is ineligible",
      "No added Mana multiplier or damage/speed bonus", "Manual weights and route scores stay unchanged"])
      expect(s.summary).toContain(text);
    const current = settings(), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset("gas-arrow")!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Skill Effect Duration","20% increased Physical Damage","20% increased Magnitude of Poison you inflict","Minions deal 20% increased Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
    const [saved] = normalizeSavedBuilds([{ id: "gas",name: "gas",createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))[0].state.optimizerSettings).toEqual(selected);
    expect(setSkillSupport(selected,support.id,false)).toEqual({ ...current,supportGemIds: [] });
  });

  it.each(components)("keeps $component damage separate from cloud persistence", f => {
    expect(f.hits).toEqual([f.hits[0],f.hits[0],f.hits[0]]);
    expect(f.hits[0]).toBeCloseTo((f.range[0]+f.range[1])/2*1.05*(f.component.includes("Fire") ? 1 : .25),9);
  });

  it("independently checks duration, native rounding and the Nova bookkeeping caveat without extra Poison stacks", () => {
    expect(native.baseLimit+native.addedLimit).toBe(7);
    for (const [i,s] of supports.entries()) {
      expect(native.sourceSeconds*s.durationMore).toBe(s.seconds);
      expect(native.duration[i+1]).toBeCloseTo(Math.ceil(s.seconds/.033)*.033,9);
      const prolonged = Math.round(1.35*s.durationMore*100)/100;
      const compressed = Math.round(.65*s.durationMore*100)/100;
      expect(native.prolongedMore[i+1]).toBe(prolonged);
      expect(native.compressedMore[i+1]).toBe(compressed);
      expect(native.prolongedDuration[i+1]).toBeCloseTo(Math.ceil(4*prolonged/.033-1e-10)*.033,9);
      expect(native.compressedDuration[i+1]).toBeCloseTo(Math.ceil(4*compressed/.033-1e-10)*.033,9);
    }
    expect(native.poisonDuration).toEqual([2,2,2]);
    expect(native.poisonStackLimit).toEqual([1,1,1]);
    expect(native.poison).toEqual([native.poison[0],native.poison[0],native.poison[0]]);
    expect(native.mana).toEqual([62,62,62]);
    expect(native.efficiencyMana).toEqual([38,38,38]);
    expect(native.prolongedMana).toEqual([74,74,74]);
    expect(native.poisonIIIMana).toEqual([74,74,74]);
    expect(native.novaCooldown).toEqual([8.019,8,8]);
    expect(native.novaStoredUses).toEqual([1,2,2]);
    const expected = (8.5*1.05*.2)*2/8;
    expect(native.novaPoison[1]).toBeCloseTo(expected,9);
    expect(native.novaPoison[2]).toBe(native.novaPoison[1]);
  });

  it("rejects Poisonburst even though it has duration, and clears ineligible imported support IDs", () => {
    const current = settings("poisonburst-arrow");
    for (const s of supports) {
      expect(reviewedSkillSupportsFor("poisonburst-arrow").some(r => r.id === s.id)).toBe(false);
      expect(setSkillSupport(current,s.id,true)).toBe(current);
    }
    expect(normalizeSkillSupportIds("poisonburst-arrow",["overabundance-i","momentum","overabundance-ii"])).toEqual(["momentum"]);
    expect(normalizePassiveOptimizationSettings({ ...current,supportGemIds: ["overabundance-ii","momentum"] }).supportGemIds).toEqual(["momentum"]);
  });

  it("replaces only the Overabundance tier without losing movement or delivery choices", () => {
    const preset = getSkillPreferencePreset("gas-arrow")!;
    const peers = ["momentum","mobility","deliberation","prolonged-duration-ii","compressed-duration-ii","malady","poison-iii","fork","pierce-iii","chain-iii","ricochet-ii","salvo","nova-projectiles-i"];
    const initial = { ...settings(),supportGemIds: peers };
    let selected: PassiveOptimizationSettings = initial;
    const original = selectedSkillSupports(preset,peers);
    for (const s of supports) {
      selected = setSkillSupport(selected,s.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,s.id] });
      const resolved = selectedSkillSupports(preset,selected.supportGemIds);
      for (const peer of original) expect(resolved.find(r => r.id === peer.id)!.summary).toBe(peer.summary);
      expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,peers));
      expect(setSkillSupport(selected,s.id,false)).toEqual(initial);
    }
    expect(normalizeSkillSupportIds("gas-arrow",["overabundance-i","overabundance-ii","overabundance-i",null])).toEqual(["overabundance-i"]);
  });

  it("warns only for a valid selected Nova II and restores standalone notes after removal", () => {
    const preset = getSkillPreferencePreset("gas-arrow")!;
    for (const s of supports) {
      const standalone = reviewedSkillSupportsFor("gas-arrow").find(r => r.id === s.id)!.summary;
      const initial = { ...settings(),supportGemIds: ["nova-projectiles-ii",s.id] };
      const summary = selectedSkillSupports(preset,initial.supportGemIds).find(r => r.id === s.id)!.summary;
      expect(summary).toContain("With Nova II selected");
      expect(summary).toContain("not validated extra cooldown uses or extra Poison applications");
      const without = setSkillSupport(initial,"nova-projectiles-ii",false);
      expect(selectedSkillSupports(preset,without.supportGemIds).find(r => r.id === s.id)!.summary).toBe(standalone);
      expect(selectedSkillSupports(preset,["salvo","nova-projectiles-ii",s.id]).find(r => r.id === s.id)!.summary).toBe(standalone);
      expect(selectedSkillSupports(preset,[s.id,"nova-projectiles-ii"]).find(r => r.id === s.id)!.summary).toBe(summary);
    }
  });

  it("keeps the allowlist Gas-only and does not invent a third tier", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([1,4]);
    expect(reviewedSkillSupports.some(s => s.id === "overabundance-iii")).toBe(false);
    for (const s of supports) {
      expect(reviewedSkillSupports.filter(r => r.id === s.id)).toHaveLength(1);
      expect(reviewedSkillSupports.find(r => r.id === s.id)?.skillIds).toEqual(["gas-arrow"]);
      for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),s.id,true)).toEqual(settings(skill));
    }
  });
});

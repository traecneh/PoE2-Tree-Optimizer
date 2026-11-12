import { describe, expect, it } from "vitest";
import { poisonBowForkSupportFixture as support,poisonBowForkComponents as components,poisonBowForkSources as sources } from "./poisonBowForkSupport.fixtures";
import { poisonBowPierceSupportFixtures as pierces } from "./poisonBowPierceSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities,normalizeSkillSupportIds,refineSkillPreferencePreset,reviewedSkillSupports,reviewedSkillSupportsFor,
  selectedSkillSupports,setSkillSupport,skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings,passivePreferenceValues,scorePassiveNode,type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport,serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "physicalDamage",weight: 2 },{ id: "chaosDamage",weight: 1 },{ id: "poisonMagnitude",weight: 3 }] });

describe("Fork for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's post-fork penalty and cost without changing weights or assuming applications", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect([support.catalogTier,support.afterForkLess,support.manaMultiplier,support.maxForks]).toEqual([3,30,10,1]);
    expect(s.sourceUrl).toContain("sup_dex.lua#L2245");
    for (const text of ["30% less Damage applies after Forking, not before it", "not twice the Poison DPS", "not as a second Poison penalty",
      "not real burst/cloud hits or proof of live-game source inheritance", "No extra contacts, Poison applications or uptime are assumed",
      "10% higher Mana cost before rounding", "not guaranteed sustain", "Manual weights and route scores stay unchanged",
      skill === "gas-arrow" ? "Terrain attachment is not modeled" : "Extra bursts or overlaps are not inferred"])
      expect(s.summary).toContain(text);
    expect(s.priorities).toEqual([]);
    const current = settings(skill),selected = setSkillSupport(current,support.id,true),preset = getSkillPreferencePreset(skill)!;
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased Physical Damage","20% increased Projectile Damage","20% increased Magnitude of Poison you inflict","Minions deal 20% increased Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
    const [saved] = normalizeSavedBuilds([{ id: skill,name: skill,createdAt: "test",updatedAt: "test",state: {
      selectedClassStartId: "ranger",pathStartNodeId: "start",nodeVisualScale: 3,buildGoalNodeIds: ["required"],ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main",weaponSetAllocationNodeIds: { 1: [],2: [] },optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"],committedEdgeKeys: [],previewNodePath: [],previewEdgeKeys: [],previewRouteNodePath: [] },
    } }]);
    expect(parseSavedBuildExport(serializeSavedBuildExport([saved]))[0].state.optimizerSettings).toEqual(selected);
    expect(normalizeSkillSupportIds(skill,[support.id,support.id,null])).toEqual([support.id]);
    expect(setSkillSupport(selected,support.id,false)).toEqual({ ...current,supportGemIds: [] });
  });

  it.each(components)("keeps $skill's $component conditional native damage separate from contact counts", f => {
    expect(f.hits[1]).toBeLessThan(f.hits[0]);
    expect(f.hits[2]).toBeLessThan(f.hits[1]);
    expect(f.ranges[1][0]).toBeLessThan(f.ranges[0][0]);
    if (!f.actualHit) expect(reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary).toContain("Native source-hit fields are not real burst/cloud hits");
  });

  it.each(sources)("independently checks %s's once-only source penalty and Mana rounding", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const weighted = (r: readonly number[]) => r[0]+(r[1]-r[0])*f.roll/100;
    for (const index of [1,2]) expect(f.poison[index]/f.poison[0]).toBeCloseTo(weighted(source.ranges[index])/weighted(source.ranges[0]),9);
    expect(f.arrowPoison[1]).toBeLessThan(f.arrowPoison[0]);
    expect(f.mana[1]).toBe(Math.floor(f.mana[0]*1.1));
    expect(f.efficiencyMana[1]).toBe(Math.ceil(f.mana[1]*.6));
    expect(f.poisonIIIMana[1]).toBe(Math.floor(f.mana[0]*1.1*1.2));
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds.flatMap(skill => pierces.map(pierce => ({ skill,pierce }))))("warns for $skill's $pierce.name pairing in either order without removing either selection", ({ skill,pierce }) => {
    const preset = getSkillPreferencePreset(skill)!;
    const links = ["chaos-attunement","withering-touch","malady","poison-iii","blindside","blind-ii","longshot-ii","close-combat-ii","corrosion","exploit-weakness"];
    const plainPierce = reviewedSkillSupportsFor(skill).find(s => s.id === pierce.id)!.summary;
    for (const order of [[support.id,pierce.id],[pierce.id,support.id]]) {
      const initial = { ...settings(skill),supportGemIds: [...links,...order] };
      const selected = selectedSkillSupports(preset,initial.supportGemIds);
      for (const id of order) {
        const note = selected.find(s => s.id === id)!.summary;
        expect(note).toContain(pierce.tier === 3 ? "piercing enemy collisions cannot also Fork" : "A pierced enemy does not also trigger Fork on that collision");
        expect(note).toContain("Both selections and Fork's Mana multiplier are retained");
        expect(note).toContain("Configured counters are not extra contacts");
      }
      expect(refineSkillPreferencePreset(preset,initial.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,links));
      expect(selected.find(s => s.id === "poison-iii")!.summary).toContain("Malady is selected");
      expect(selected.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
      expect(selected.find(s => s.id === "longshot-ii")!.summary).toContain("their damage bonuses do not overlap");
      expect(selected.find(s => s.id === "corrosion")!.summary).toContain("Incompatible pair selected");
      const removed = setSkillSupport(initial,support.id,false);
      expect(removed.supportGemIds).toEqual([...links,pierce.id]);
      expect(selectedSkillSupports(preset,removed.supportGemIds).find(s => s.id === pierce.id)!.summary).toBe(plainPierce);
      expect(selectedSkillSupports(preset,setSkillSupport(initial,pierce.id,false).supportGemIds).find(s => s.id === support.id)!.summary)
        .toBe(reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!.summary);
    }
    const malformed = selectedSkillSupports(preset,["fork","pierce-i","pierce-iii"]);
    expect(malformed.find(s => s.id === "fork")!.summary).not.toContain("Fork and Pierce III are selected");
  });

  it("restricts Fork to reviewed skills and does not invent tiers", () => {
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow","toxic-growth","lightning-arrow","fireball","skeletal-sniper","contagion"])
      expect(setSkillSupport(settings(skill),support.id,true)).toEqual(settings(skill));
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill),"fork-ii",true)).toEqual(settings(skill));
  });
});

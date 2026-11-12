import { describe, expect, it } from "vitest";
import { poisonBowChainSupportFixtures as supports, poisonBowChainComponents as components, poisonBowChainSources as sources } from "./poisonBowChainSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7,
  preferences: [{ id: "physicalDamage", weight: 2 }, { id: "chaosDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }] });

describe("Chain tiers for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds.flatMap(skill => supports.map(support => ({ skill,support }))))("reviews $support.name for $skill without adding repeat hits or changing scores", ({ skill,support }) => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: support.name,effectId: support.effectId,family: support.family });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${support.line}`);
    expect(s.summary).toContain(`+${support.chains} Chain`);
    expect(s.summary).toContain(`${support.lessHit}% less Hit Damage`);
    for (const text of ["applies before any chain occurs", "Hit-only does not mean Poison is unaffected", "source is reduced once, not again as a separate Poison penalty",
      "not real burst/cloud hits or proof of live-game source inheritance", "same enemy cannot be targeted twice in the same Chain",
      "No repeat hits, extra contacts, Poison applications or uptime are assumed", "No added Mana cost multiplier", "Manual weights and route scores stay unchanged",
      skill === "gas-arrow" ? "terrain chaining are not supplied" : "separately enabled on-hit Poison remain distinct from the no-hit Poison burst"])
      expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current,support.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
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
    expect(setSkillSupport(selected,support.id,false)).toEqual({ ...current,supportGemIds: [] });
  });

  it.each(components)("keeps $skill's $component reduced native source separate from actual contacts", f => {
    for (const index of [1,2,3]) expect(f.hits[index]).toBeLessThan(f.hits[0]);
    expect(f.hits[2]).toBeLessThan(f.hits[3]);
    expect(f.hits[3]).toBeLessThan(f.hits[1]);
    if (!f.actualHit) for (const s of supports) expect(reviewedSkillSupportsFor(f.skill).find(r => r.id === s.id)!.summary).toContain("Native source-hit fields are not real burst/cloud hits");
  });

  it.each(sources)("independently checks %s's once-only Poison source reduction without a direct non-hit penalty", f => {
    const source = components.find(c => c.skill === f.skill && !c.actualHit)!;
    const weighted = (r: readonly number[]) => r[0]+(r[1]-r[0])*f.roll/100;
    expect(f.nonHitMore).toEqual([1,1,1]);
    expect(f.hitMore).toEqual([.7,.5,.6]);
    for (const index of [1,2,3]) {
      expect(f.poison[index]/f.poison[0]).toBeCloseTo(weighted(source.ranges[index])/weighted(source.ranges[0]),9);
      expect(f.arrowPoison[index]).toBeLessThan(f.arrowPoison[0]);
    }
    expect(f.efficiencyMana).toBe(Math.ceil(f.mana*.6));
    expect(f.poisonIIIMana).toBe(Math.floor(f.mana*1.2));
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.timer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
    expect(f.radius).toBe(f.skill === "gas-arrow" ? 18 : 24);
  });

  it.each(poisonBowIds)("replaces %s's Chain tier and restores peer warnings without discarding other selections", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    const links = ["chaos-attunement","withering-touch","malady","poison-iii","blindside","blind-ii","longshot-ii","close-combat-ii","corrosion","exploit-weakness"];
    for (const peers of [["fork"],["pierce-i"],["pierce-ii"],["pierce-iii"],["fork","pierce-iii"]]) {
      const initial = { ...settings(skill),supportGemIds: [...links,...peers] };
      let selected: PassiveOptimizationSettings = initial;
      for (const s of supports) {
        selected = setSkillSupport(selected,s.id,true);
        expect(selected).toEqual({ ...initial,supportGemIds: [...initial.supportGemIds,s.id] });
        const resolved = selectedSkillSupports(preset,selected.supportGemIds);
        const summary = resolved.find(r => r.id === s.id)!.summary;
        expect(summary).toContain("Splitting, Piercing and Forking take priority over Chaining");
        expect(summary).toContain("separate counters do not prove a feasible sequence");
        expect(summary.includes("While always-Pierce is active")).toBe(peers.includes("pierce-iii"));
        expect(resolved.filter(r => r.family === "Chain")).toHaveLength(1);
        expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(refineSkillPreferencePreset(preset,initial.supportGemIds));
        for (const id of initial.supportGemIds) expect(resolved.find(r => r.id === id)!.summary).toBe(selectedSkillSupports(preset,initial.supportGemIds).find(r => r.id === id)!.summary);
        const reversed = selectedSkillSupports(preset,[s.id,...initial.supportGemIds]);
        expect(reversed.find(r => r.id === s.id)!.summary).toBe(summary);
        expect(setSkillSupport(selected,s.id,false)).toEqual(initial);
        let withoutPeers = selected;
        for (const peer of peers) withoutPeers = setSkillSupport(withoutPeers,peer,false);
        expect(selectedSkillSupports(preset,withoutPeers.supportGemIds).find(r => r.id === s.id)!.summary).toBe(reviewedSkillSupportsFor(skill).find(r => r.id === s.id)!.summary);
      }
    }
    expect(normalizeSkillSupportIds(skill,["chain-i","chain-iii","chain-ii","chain-i",null])).toEqual(["chain-i"]);
  });

  it("does not expand legal supports to unreviewed focuses or fictional tiers", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([1,2,5]);
    for (const s of supports) {
      expect(reviewedSkillSupports.filter(r => r.id === s.id)).toHaveLength(1);
      expect(reviewedSkillSupports.find(r => r.id === s.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","lightning-arrow","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),s.id,true)).toEqual(settings(skill));
    }
  });
});

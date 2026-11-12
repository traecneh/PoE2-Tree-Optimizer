import { describe, expect, it } from "vitest";
import { poisonBowLifeLeechSupportFixtures as supports, poisonBowLifeLeechComponents as components, poisonBowLifeLeechControls as controls } from "./poisonBowLifeLeechSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "lifeLeechAmount",weight: 3 },{ id: "lifeLeechSpeed",weight: 2 },{ id: "poisonMagnitude",weight: 3 }] });

describe("Life Leech for reviewed Poison bow focuses", () => {
  for (const skill of poisonBowIds) it.each(supports)(`reviews ${skill}'s $name without awarding Poison healing or sustain`, f => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: f.name,effectId: f.effectId,family: f.family });
    expect(s.sourceUrl).toContain(`sup_str.lua#L${f.line}`);
    for (const text of [`${f.percent}% of Physical Attack Damage Leeched as Life from actual arrow Hits`, "not total damage or instant Life on Hit",
      "Poison is Chaos damage over time", "generates no recovery from this support", "synthetic burst/cloud source-hit leech fields are not real healing",
      "Recovery amount, delivery speed, duration and caps are separate", "leech restrictions still apply", "No sustained hits, recovery uptime",
      "No damage or Poison bonus", "No added Mana multiplier; other supports still cost Mana", "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (f.retains) for (const text of ["not removed at player Full Life", "source-specific retention", "not global leech retention, enemy Full Life or overhealing",
      "runtime does not model this source-specific retention stat", "equal Tier II/III recovery fields do not prove equal in-game behavior"]) expect(s.summary).toContain(text);
    else expect(s.summary).toContain("does not grant retention");
    if (skill === "gas-arrow") expect(s.summary).toContain("converts all its Physical damage to Fire and supplies no Physical-hit leech");
    const current = settings(skill), selected = setSkillSupport(current,f.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [f.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["20% increased amount of Life Leeched", "Leech Life 20% faster", "20% increased Magnitude of Poison you inflict",
      "20% increased Physical Damage", "Minions have 20% increased Physical Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("separates $skill's $component native leech estimate from actual recovery eligibility", f => {
    for (const [i,s] of supports.entries()) {
      const packet = (f.physicalHit*.95+f.physicalCrit*.05)*s.percent/100;
      expect(f.packets[i]).toBeCloseTo(packet,9);
      expect(f.rates[i]).toBeCloseTo(packet*1.2,9);
      const note = reviewedSkillSupportsFor(f.skill).find(r => r.id === s.id)!.summary;
      if (!f.actualHit) expect(note).toContain("synthetic burst/cloud source-hit leech fields are not real healing");
      if (f.component.includes("Fire")) expect(packet).toBe(0);
    }
  });

  it.each(controls)("checks %s's native caps and Full Life modeling gap without implying sustain", f => {
    const life = 3287, ratePerInstance = life*.02, instanceCap = life*.1, totalCap = life*.2;
    const duration = f.packet/ratePerInstance, instances = duration*1.2;
    expect(f.rate).toBeCloseTo(Math.min(instances*ratePerInstance,totalCap),9);
    expect(f.fullII).toBe(f.packet); expect(f.fullIII).toBe(f.packet);
    expect(f.retentionFlagII).toBe(false); expect(f.retentionFlagIII).toBe(false); expect(f.globalControl).toBe(true);
    expect(f.stressHit*.16).toBeGreaterThan(instanceCap);
    const cappedPacket = Math.min(f.stressHit*.16,instanceCap)*.95+Math.min(f.stressCrit*.16,instanceCap)*.05;
    expect(cappedPacket).toBeCloseTo(328.7,9);
    expect(cappedPacket/ratePerInstance).toBeCloseTo(5,9);
    expect(Math.min(cappedPacket/0.033,totalCap)).toBeCloseTo(657.4,9);
    expect(f.morePoison).toBeCloseTo(f.poison*1.2,9);
    const ordinary = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    expect(f.packet).toBe(ordinary.packets[2]); expect(f.rate).toBe(ordinary.rates[2]);
    expect(f.mana).toBe(f.skill === "gas-arrow" ? 62 : 38);
  });

  it.each(poisonBowIds)("replaces only %s's Life Leech tier and preserves peers, weights and saved goals", skill => {
    const peers = ["ambush","supercritical","inexorable-critical-ii","poison-iii","corrosion","momentum","blindside","malady","fork","pierce-iii","chain-iii",
      ...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
    const preset = getSkillPreferencePreset(skill)!, initial = { ...settings(skill),supportGemIds: peers };
    let selected: PassiveOptimizationSettings = initial;
    for (const f of supports) {
      selected = setSkillSupport(selected,f.id,true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,f.id] });
      expect(normalizeSkillSupportIds(skill,[f.id,f.id,null,"life-leech-iv"])).toEqual([f.id]);
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

  it("keeps six reviewed pairs narrow without treating Attack tags as a global allowlist", () => {
    expect(supports.map(f => f.catalogTier)).toEqual([2,3,5]);
    expect(reviewedSkillSupports.filter(s => s.family === "LifeLeech")).toHaveLength(3);
    for (const f of supports) {
      expect(reviewedSkillSupports.find(s => s.id === f.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),f.id,true)).toEqual(settings(skill));
    }
    expect(normalizeSkillSupportIds("gas-arrow",["life-leech-i","life-leech-ii","life-leech-iii"])).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import { poisonBowDrainSupportFixtures as supports, poisonBowDrainComponents as components, poisonBowDrainRarities as rarities, poisonBowDrainControls as controls } from "./poisonBowDrainSupports.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, reviewedSkillSupportsFor,
  selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted",focusSkillId,extraPointBudget: 7,
  preferences: [{ id: "lifeRecoveryOnKill",weight: 3 },{ id: "manaRecoveryOnKill",weight: 3 },{ id: "lifeLeechAmount",weight: 2 },{ id: "poisonMagnitude",weight: 3 }] });

describe("Life Drain and Soul Drain for reviewed Poison bow focuses", () => {
  for (const skill of poisonBowIds) it.each(supports)(`reviews ${skill}'s $name without converting kills or leech into guaranteed Cull recovery`, f => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === f.id)!;
    expect({ name: s.name,effectId: s.effectId,family: s.family }).toEqual({ name: f.name,effectId: f.effectId,family: f.family });
    expect(s.sourceUrl).toContain(`sup_dex.lua#L${f.line}`);
    for (const text of [`Recover 12% of maximum ${f.resource} when this supported skill Culls`, "not Leech, recovery on Hit or recovery on every kill",
      "Neither Drain grants Culling Strike", "a separate eligible Cull source is required", "With Culling Strike I/II, only Rare/Unique enemies qualify",
      "Tier II's unmodeled on-Cull threshold buff", "Poison deaths, ordinary kills and Culls by another skill, party member or minion",
      "Synthetic burst/cloud source-hit fields are not real Culls or recovery events", "Recovery is limited by missing resource",
      "No added Mana multiplier", "separate leech remain unchanged", "No extra contacts, guaranteed kills, event frequency, boss sustain",
      "Manual weights and route scores stay unchanged"]) expect(s.summary).toContain(text);
    if (f.resource === "Life") for (const text of ["generic LifeOnKill field even when no Cull is possible", "does not prove recovery from ordinary or Poison kills"]) expect(s.summary).toContain(text);
    else for (const text of ["does not map Soul Drain's on-Cull recovery stat", "zero ManaOnKill is not proof of zero effect in game",
      "Upfront Mana expenditure remains separate"]) expect(s.summary).toContain(text);
    if (skill === "gas-arrow") expect(s.summary).toContain("separately triggered Fire explosion");
    const current = settings(skill), selected = setSkillSupport(current,f.id,true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current,supportGemIds: [f.id] });
    expect(refineSkillPreferencePreset(preset,selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected,preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected,preset)).toEqual(selected);
    for (const stat of ["Recover 1% of maximum Life on Kill", "Recover 1% of maximum Mana on Kill", "20% increased amount of Life Leeched",
      "20% increased Magnitude of Poison you inflict", "Minions have 20% increased Physical Damage"]) {
      const n: TreeNode = { id: "fixture",flags: {},position: { x: 0,y: 0 },stats: [stat] };
      expect(passivePreferenceValues(n,selected)).toEqual(passivePreferenceValues(n,current));
      expect(scorePassiveNode(n,selected.preferences,selected)).toBe(scorePassiveNode(n,current.preferences,current));
    }
  });

  it.each(components)("keeps $skill's $component fields separate from a real supported-skill Cull", f => {
    expect(f.nativeLifeOnKill).toBe(Math.ceil(3287*.12));
    expect(f.nativeManaOnKill).toBe(0);
    for (const s of supports) {
      const note = reviewedSkillSupportsFor(f.skill).find(r => r.id === s.id)!.summary;
      expect(note).toContain("a separate eligible Cull source is required");
      if (!f.actualHit) expect(note).toContain("not real Culls or recovery events");
    }
  });

  it.each(rarities)("preserves Culling Strike I/II's $rarity eligibility without deriving recovery frequency", f => {
    expect(f.canCull).toBe(f.rarity !== "Normal");
    expect(f.threshold).toBe(f.canCull ? f.rarity === "Rare" ? 10 : 5 : 0);
    expect(f.multiplier).toBeCloseTo(100/(100-f.threshold),10);
    expect(f.thresholdIncrease).toBe(0);
    expect(f.nativeLifeOnKill).toBe(395);
    expect(f.nativeManaOnKill).toBe(0);
  });

  it.each(controls)("checks %s's native mapping gaps, restrictions, separate leech and unchanged Mana cost", f => {
    expect(f.lifeOnKill).toBe(Math.ceil(f.life*.12));
    expect(f.scalarManaOnKill).toBe(Math.ceil(f.mana*.12));
    expect(f.manaOnKill).toBe(0);
    expect(f.cannotLife).toBe(0); expect(f.onlyLeechLife).toBe(0); expect(f.cannotManaScalar).toBe(0);
    const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    expect(f.lifeLeechPerHit).toBeCloseTo(arrow.hit*.16,10);
    expect(f.manaLeechPerHit).toBeCloseTo(arrow.hit*.08,10);
    expect(f.lifeLeechRate).toBeCloseTo(f.lifeLeechPerHit*1.2,10);
    expect(f.manaLeechRate).toBeCloseTo(f.manaLeechPerHit*1.2,10);
    expect(f.poisonLinkedManaCost).toBe(Math.floor(f.manaCost*1.2));
    expect(f.lifeOnKill).not.toBe(f.lifeLeechPerHit);
  });

  it.each(poisonBowIds)("preserves %s's culling tiers, earlier notes, weights and saved goals with both recovery families", skill => {
    const preset = getSkillPreferencePreset(skill)!;
    for (const cull of ["culling-strike-i","culling-strike-ii"]) {
      const peers = [cull,"life-leech-iii","mana-leech","pin-iii","stun-iii","poison-iii",...(skill === "gas-arrow" ? ["overabundance-ii"] : [])];
      const initial = { ...settings(skill),supportGemIds: peers };
      const selected = setSkillSupport(setSkillSupport(initial,"life-drain",true),"soul-drain",true);
      expect(selected).toEqual({ ...initial,supportGemIds: [...peers,"life-drain","soul-drain"] });
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
      const noLife = setSkillSupport(selected,"life-drain",false);
      expect(noLife.supportGemIds).toEqual([...peers,"soul-drain"]);
      expect(setSkillSupport(noLife,"soul-drain",false)).toEqual(initial);
    }
  });

  it("keeps four reviewed pairs narrow and Drain families distinct from leech and each other", () => {
    expect(supports.map(s => s.catalogTier)).toEqual([1,3]);
    for (const f of supports) {
      expect(reviewedSkillSupports.filter(s => s.family === f.family)).toHaveLength(1);
      expect(reviewedSkillSupports.find(s => s.id === f.id)?.skillIds).toEqual(poisonBowIds);
      for (const skill of ["vine-arrow","toxic-growth","fireball","skeletal-sniper","contagion"])
        expect(setSkillSupport(settings(skill),f.id,true)).toEqual(settings(skill));
    }
    expect(normalizeSkillSupportIds("gas-arrow",["life-drain","life-drain","soul-drain","life-leech-iii","mana-leech","life-drain-ii"]))
      .toEqual(["life-drain","soul-drain","life-leech-iii","mana-leech"]);
  });
});

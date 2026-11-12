import { describe, expect, it } from "vitest";
import { poisonBowChaosMasterySupportFixture as support, poisonBowChaosMasteryComponents as components,
  poisonBowChaosMasterySourceFixtures as sources, poisonBowChaosMasteryLinkFixtures as links } from "./poisonBowChaosMasterySupport.fixtures";
import { poisonBowIds } from "./poisonBowSkills.fixtures";
import { getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, selectedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "attackDamage", weight: 1 }, { id: "poisonMagnitude", weight: 3 }, { id: "areaOfEffect", weight: 2 }] });

describe("Chaos Mastery for reviewed Poison bow focuses", () => {
  it.each(poisonBowIds)("reviews %s's +1 skill level without adding Chaos damage, fixed percentage or free-cost assumptions", skill => {
    const s = reviewedSkillSupportsFor(skill).find(s => s.id === support.id)!;
    expect({ name: s.name, effectId: s.effectId, family: s.family }).toEqual({ name: support.name, effectId: support.effectId, family: support.family });
    expect(support.levelBonus).toBe(1);
    expect(support.manaMultiplier).toBe(0);
    expect(support.catalogTier).toBe(5);
    expect(s.sourceUrl).toContain("sup_int.lua#L1771");
    for (const text of ["+1 level to the supported Chaos skill", "not a blanket Chaos Damage or Poison-magnitude multiplier",
      "No separate Mana multiplier, but the higher-level skill can cost more Mana", "no fixed damage percentage is applied",
      "Source estimates are not real burst/cloud hits or Full DPS", "Poison chance, duration, magnitude and stacks stay unchanged in reviewed cases",
      skill === "gas-arrow" ? "Mana 62 -> 67" : "Mana 38 -> 41",
      skill === "gas-arrow" ? "conditional Fire-explosion damage can rise, not just Chaos damage" : "increased burst radius"]) expect(s.summary).toContain(text);
    const current = settings(skill), selected = setSkillSupport(current, support.id, true), preset = getSkillPreferencePreset(skill)!;
    expect(s.priorities).toEqual([]);
    expect(normalizePassiveOptimizationSettings(selected)).toEqual({ ...current, supportGemIds: [support.id] });
    expect(refineSkillPreferencePreset(preset, selected.supportGemIds)).toEqual(preset);
    expect(skillSupportPriorityChanges(selected, preset)).toEqual([]);
    expect(applySkillSupportPriorities(selected, preset)).toEqual(selected);
    for (const stats of [["20% increased Attack Damage"], ["20% increased Chaos Damage"], ["20% increased Magnitude of Poison you inflict"],
      ["20% increased Area of Effect"], ["Minions deal 20% increased Damage"]]) {
      const n: TreeNode = { id: "fixture", flags: {}, position: { x: 0, y: 0 }, stats };
      expect(passivePreferenceValues(n, selected)).toEqual(passivePreferenceValues(n, current));
      expect(scorePassiveNode(n, selected.preferences, selected)).toBe(scorePassiveNode(n, current.preferences, current));
    }
  });

  it.each(components)("independently checks $skill's $component level-20/21 weapon scaling and native rounding", f => {
    for (const i of [0, 1]) expect(f.ranges[i]).toEqual([Math.round(6 * f.coefficients[i]), Math.round(9 * f.coefficients[i])]);
    expect(f.hits[1] / f.hits[0]).toBeCloseTo((f.ranges[1][0] + f.ranges[1][1]) / (f.ranges[0][0] + f.ranges[0][1]), 9);
    const note = reviewedSkillSupportsFor(f.skill).find(s => s.id === support.id)!.summary;
    if (!f.actualHit) expect(note).toContain("not real burst/cloud hits");
    if (f.component === "conditional Fire explosion") expect(note).toContain("ignition/detonation is not supplied");
  });

  it.each(sources)("reproduces $skill level $level's native Poison-source change once and distinguishes base Mana from support multipliers", f => {
    const weighted = (r: readonly number[]) => r[0] + (r[1] - r[0]) * f.roll / 100;
    for (const i of [0, 1]) expect(f.ranges[i]).toEqual([Math.round(6 * f.coefficients[i]), Math.round(9 * f.coefficients[i])]);
    expect(f.poison[1] / f.poison[0]).toBeCloseTo(weighted(f.ranges[1]) / weighted(f.ranges[0]), 9);
    expect(f.mana[1]).toBeGreaterThan(f.mana[0]);
    if (f.skill === "poisonburst-arrow") expect(f.radius[1]).toBe(f.radius[0] + 1);
    else expect(f.radius[1]).toBe(f.radius[0]);
    // Native results vary by level and rounded component, not a fixed damage percentage.
  });

  it.each(links)("checks %s's separately linked Poison III and Efficiency II costs and source, without changing chance or timers", f => {
    const source = sources.find(s => s.skill === f.skill && s.level === 20)!;
    const arrow = components.find(c => c.skill === f.skill && c.component === "arrow")!;
    const weighted = (r: readonly number[]) => r[0] + (r[1] - r[0]) * f.arrowRoll / 100;
    expect(f.arrowPoison[1] / f.arrowPoison[0]).toBeCloseTo(weighted(arrow.ranges[1]) / weighted(arrow.ranges[0]), 9);
    for (const i of [0, 1]) {
      expect(f.poisonMana[i]).toBe(Math.floor(source.mana[i] * 1.2));
      expect(f.efficiencyMana[i]).toBe(Math.ceil(source.mana[i] * .6));
    }
    expect(f.duration).toBe(f.skill === "gas-arrow" ? 2 : 3);
    expect(f.skillTimer).toBe(f.skill === "gas-arrow" ? 4.026 : 3.003);
  });

  it.each(poisonBowIds)("round-trips %s's new review while retaining state, other supports and earlier compatibility warnings", skill => {
    const initial = { ...settings(skill), supportGemIds: ["malady", "poison-iii", "blindside", "blind-ii", "longshot-ii", "close-combat-ii", "efficiency-ii", "corrosion", "exploit-weakness"] };
    const selected = setSkillSupport(initial, support.id, true);
    expect(selected).toEqual({ ...initial, supportGemIds: [...initial.supportGemIds, support.id] });
    expect(normalizeSkillSupportIds(skill, [support.id, support.id, null, "efficiency-ii"])).toEqual([support.id, "efficiency-ii"]);
    const resolved = selectedSkillSupports(getSkillPreferencePreset(skill)!, selected.supportGemIds);
    expect(resolved.find(s => s.id === "poison-iii")!.summary).toContain("Malady is selected");
    expect(resolved.find(s => s.id === "blind-ii")!.summary).toContain("Blindside is selected");
    for (const id of ["longshot-ii", "close-combat-ii"]) expect(resolved.find(s => s.id === id)!.summary).toContain("their damage bonuses do not overlap");
    for (const id of ["exploit-weakness", "corrosion"]) expect(resolved.find(s => s.id === id)!.summary).toContain("Incompatible pair selected");
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.selectedClassStartId).toBe("ranger");
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    expect(setSkillSupport(selected, support.id, false)).toEqual(initial);
  });

  it("admits only reviewed parents, not every Chaos-tagged skill or fictional tier", () => {
    expect(reviewedSkillSupports.filter(s => s.id === support.id)).toHaveLength(1);
    expect(reviewedSkillSupports.find(s => s.id === support.id)?.skillIds).toEqual(poisonBowIds);
    for (const skill of ["vine-arrow", "toxic-growth", "lightning-arrow", "fireball", "skeletal-sniper", "contagion", "despair"])
      expect(setSkillSupport(settings(skill), support.id, true)).toEqual(settings(skill));
    for (const skill of poisonBowIds) expect(setSkillSupport(settings(skill), "chaos-mastery-ii", true)).toEqual(settings(skill));
  });
});

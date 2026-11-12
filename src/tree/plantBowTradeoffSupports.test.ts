import { describe, expect, it } from "vitest";
import { plantBowTradeoffSupports as fixtures, vineAfflictionNative as vine, toxicConcentratedComponents as toxic,
  plantBowTradeoffControls as controls } from "./plantBowTradeoffSupports.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  reviewedSkillSupportsFor, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import { runOptimizerRequest, optimizeWeightedBuildGoals } from "./weightedBuildGoalsOptimizer";
import type { TreeGraph, TreeNode } from "./types";

const preset = (skill: string) => getSkillPreferencePreset(skill)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "skillDuration", weight: 1 }, { id: "areaOfEffect", weight: 1 }, { id: "life", weight: 3 }, { id: "poisonMagnitude", weight: 2 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });

describe("reviewed Plant bow duration and area trade-offs", () => {
  it.each(fixtures)("admits $skill / $id with frozen identity, scope and an explicit priority action", (f) => {
    const resolved = reviewedSkillSupportsFor(f.skill).find((s) => s.id === f.id)!;
    expect({ effectId: resolved.effectId, name: resolved.name, family: resolved.family }).toEqual({ effectId: f.effectId, name: f.name, family: f.family });
    expect(resolved.priorities).toMatchObject([{ id: f.preference, weight: f.weight }]);
    expect(resolved.summary).toContain(`${f.moreDamage}% more ${f.skill === "vine-arrow" ? "non-ailment DoT" : "Area Damage"}`);
    const current = settings(f.skill);
    const selected = setSkillSupport(current, f.id, true);
    expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
    expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    expect(skillSupportPriorityChanges(selected, preset(f.skill))).toMatchObject([{ id: f.preference, weight: f.weight }]);
    const refined = refineSkillPreferencePreset(preset(f.skill), selected.supportGemIds);
    expect(refined.passiveStatScopes).toEqual(preset(f.skill).passiveStatScopes);
    expect(refined.suggestions.find((s) => s.id === f.preference)?.weight).toBe(f.weight);
    expect(refined.exclusions).toEqual(preset(f.skill).exclusions);
    expect(addSkillPresetPreferences(selected, preset(f.skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    const applied = applySkillSupportPriorities(selected, preset(f.skill));
    expect(applied.preferences).toEqual(current.preferences.map((p) => p.id === f.preference ? { ...p, weight: f.weight } : p));
    expect(applied.extraPointBudget).toBe(7);
    expect(applied.pointBudgetMode).toBe("all-available");
    expect(applySkillSupportPriorities(applied, preset(f.skill))).toEqual(applied);
    const removed = setSkillSupport(applied, f.id, false);
    expect(removed.preferences).toEqual(applied.preferences);
    expect(refineSkillPreferencePreset(preset(f.skill), removed.supportGemIds)).toEqual(preset(f.skill));
    expect(current.preferences).toEqual(settings(f.skill).preferences);
  });

  it.each(fixtures)("round-trips $skill / $id and preserves other support families, goals and preferences", (f) => {
    const current = { ...settings(f.skill), supportGemIds: ["efficiency-ii", "magnified-area-ii", "rapid-attacks-ii", "projectile-acceleration-ii"] };
    const selected = setSkillSupport(current, f.id, true);
    expect(selected.supportGemIds).toEqual([...current.supportGemIds, f.id]);
    const [saved] = normalizeSavedBuilds([{ id: f.id, name: f.name, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual(selected);
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
  });

  it("keeps cross-focus eligibility distinct from admission and replaces Swift tiers without dropping utility families", () => {
    expect(controls.allSixPairsNativelyCompatible).toBe(true);
    expect(normalizeSkillSupportIds("toxic-growth", ["swift-affliction-i", "swift-affliction-ii"])).toEqual([]);
    expect(normalizeSkillSupportIds("vine-arrow", ["concentrated-area"])).toEqual([]);
    expect(normalizeSkillSupportIds("fireball", ["concentrated-area"])).toEqual([]);
    const current = { ...settings("vine-arrow"), supportGemIds: ["efficiency-ii", "prolonged-duration-ii", "swift-affliction-i"] };
    expect(setSkillSupport(current, "swift-affliction-ii", true)).toEqual({ ...current, supportGemIds: ["efficiency-ii", "prolonged-duration-ii", "swift-affliction-ii"] });
    expect(normalizeSkillSupportIds("vine-arrow", ["swift-affliction-ii", "swift-affliction-i", "swift-affliction-iii", "__proto__"]))
      .toEqual(["swift-affliction-ii"]);
    for (const skill of ["essence-drain", "contagion"]) for (const id of ["swift-affliction-i", "swift-affliction-ii"])
      expect(reviewedSkillSupportsFor(skill).find((s) => s.id === id)?.priorities).toEqual(reviewedSkillSupports.find((s) => s.id === id)?.priorities);
    for (const skill of ["rain-of-arrows", "rolling-slam"])
      expect(reviewedSkillSupportsFor(skill).find((s) => s.id === "concentrated-area")?.priorities).toEqual(reviewedSkillSupports.find((s) => s.id === "concentrated-area")?.priorities);
  });

  it("checks Swift's intrinsic non-ailment damage but flags the native double-duration mapping instead of treating it as game truth", () => {
    expect(vine.dot * 1.3).toBeCloseTo(vine.swiftIDot);
    expect(vine.swiftIIDot).toBe(vine.swiftIDot);
    expect(Math.ceil(vine.baseDuration * .8 / .033) * .033).toBeCloseTo(vine.singlePenaltyI);
    expect(Math.ceil(vine.baseDuration * .9 / .033) * .033).toBeCloseTo(vine.singlePenaltyII);
    expect(.8 * .8).toBeCloseTo(vine.nativeDurationModI);
    expect(.9 * .9).toBeCloseTo(vine.nativeDurationModII);
    expect(Math.ceil(vine.baseDuration * vine.nativeDurationModI / .033) * .033).toBeCloseTo(vine.nativeDurationI);
    expect(Math.ceil(vine.baseDuration * vine.nativeDurationModII / .033) * .033).toBeCloseTo(vine.nativeDurationII);
    expect(vine.nativeDurationI).not.toBe(vine.singlePenaltyI);
    expect(vine.nativeDurationII).not.toBe(vine.singlePenaltyII);
    expect(Math.ceil(vine.baseDuration * vine.nativeDurationModII * 2 / .033) * .033).toBeCloseTo(vine.increased100NativeDurationII);
    expect(Math.ceil(vine.baseDuration * vine.combinedNativeDurationMod / .033) * .033).toBeCloseTo(vine.combinedProlongedIINativeDuration);
    expect(vine.exactGameLifetimeVerified).toBe(false);
    expect(vine.suppliedPoisonModeled).toBe(false);
    expect(vine.swiftMana).toBe(vine.mana);
    expect(vine.swiftRate).toBe(vine.rate);
    expect(vine.supportedImpactHit).toBe(vine.impactHit);
    for (const id of ["swift-affliction-i", "swift-affliction-ii"]) {
      const support = reviewedSkillSupportsFor("vine-arrow").find((s) => s.id === id)!;
      expect(support.summary).toContain("exact game lifetime is unverified");
      expect(support.summary).toContain("not impact hits or Poison");
      expect(support.priorities[0].reason).toContain("not more DoT per second");
    }
  });

  it.each(toxic)("checks Concentrated Area's $component coverage separately from hit damage, Poison and detonation", (f) => {
    expect(Math.floor(f.radius * Math.sqrt(.5))).toBe(f.concentratedRadius);
    expect(f.concentratedRadius).not.toBe(f.radius * .5);
    expect(Math.floor(f.radius * Math.sqrt((1 + 1) * .5))).toBe(f.increased100Radius);
    expect(f.concentratedHit).toBeGreaterThan(f.hit);
    expect(f.concentratedHit).not.toBeCloseTo(f.hit * 1.3);
    expect(f.concentratedMana).toBe(f.mana);
    expect(f.concentratedRate).toBe(f.rate);
    expect(f.concentratedDetonation).toBe(f.detonation);
    if ("poisonDuration" in f) {
      expect(f.concentratedPoisonDuration).toBe(f.poisonDuration);
      expect(f.concentratedOutgoingPoisonDps).toBeGreaterThan(f.outgoingPoisonDps);
      expect(Math.floor(f.radius * Math.sqrt(1.45 * .5))).toBe(f.combinedMagnifiedIIRadius);
      expect(f.combinedMagnifiedIIRadius).toBeLessThan(f.radius);
    }
    expect(reviewedSkillSupportsFor("toxic-growth").find((s) => s.id === "concentrated-area")?.summary).toContain("not 50% less radius");
  });

  it("does not promote cross-focus controls or supported own Poison duration to externally supplied Poison", () => {
    expect(controls.vineConcentratedDot).toBe(vine.dot);
    expect(controls.vineConcentratedRadius).toBeLessThan(vine.radius);
    expect(controls.toxicSwiftHit).toBe(toxic[0].hit);
    expect(controls.toxicSwiftDetonation).toBe(toxic[0].detonation);
    expect(controls.vineOwnImpactPoisonDuration * .8).toBeCloseTo(controls.vineOwnSwiftIPoisonDuration);
    expect(controls.vineOwnImpactPoisonDuration * .9).toBeCloseTo(controls.vineOwnSwiftIIPoisonDuration);
    expect(controls.vineOwnSupportedPoisonMagnitude).toBe(controls.vineOwnPoisonMagnitude);
    expect(controls.toxicSwiftIPoisonDuration).not.toBe(controls.toxicSwiftDetonation);
  });

  it.each(fixtures)("does not multiply $skill / $id into passive values, manual scores, owner scopes or point costs", (f) => {
    const current = settings(f.skill);
    const selected = setSkillSupport(current, f.id, true);
    const p = node("20% increased Damage with Plant Skills", "10% increased Skill Effect Duration", "10% increased Area of Effect", "10% reduced Area of Effect",
      "Minions deal 100% increased Damage", "100% increased Damage with Plant Skills while Overgrown");
    expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
    expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
    const graph: TreeGraph = { schemaVersion: 1, gameVersion: "test", extractedAt: "test", source: { kind: "fixture", path: "test" },
      nodes: Object.fromEntries(["start", "plain", "goal", "plant", "bridge"].map((id) => [id, { ...node(), id,
        stats: id === "plant" ? ["20% increased Damage with Plant Skills"] : [], flags: id === "start" ? { classStart: true } : {} }])),
      edges: [["start", "plain"], ["plain", "goal"], ["start", "plant"], ["plant", "bridge"], ["bridge", "goal"]].map(([from, to]) => ({ from, to })),
      groups: {}, classStarts: { ranger: "start" }, bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } };
    const request = { graph, mode: "weighted" as const, focusSkillId: f.skill, preferences: [{ id: "plantDamage" as const, weight: 3 }], extraPointBudget: 1,
      baseNodeIds: ["start"], baseEdgeKeys: [], goalNodeIds: ["goal"], totalPointLimit: 3 };
    const base = optimizeWeightedBuildGoals(request, undefined, { maxIterations: 8 });
    const supported = optimizeWeightedBuildGoals({ ...request, supportGemIds: [f.id] }, undefined, { maxIterations: 8 });
    expect(supported.totalNodeIds).toEqual(base.totalNodeIds);
    expect(supported.pointCost).toBe(3);
    expect(supported.weighted?.score).toBe(6);
    expect(supported.totalNodeIds).toContain("goal");
    const shortest = { ...request, mode: "shortest" as const };
    expect(runOptimizerRequest({ ...shortest, supportGemIds: [f.id] })).toMatchObject(runOptimizerRequest(shortest));
    expect(runOptimizerRequest(shortest).pointCost).toBe(2);
  });
});

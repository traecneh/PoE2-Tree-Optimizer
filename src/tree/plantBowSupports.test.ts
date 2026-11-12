import { preCommon45SupportsFor } from "./commonSupportBatch.testHelpers";
import { describe, expect, it } from "vitest";
import { plantBowSupportFixtures as supports, plantBowSupportCompatibility as pairs,
  plantBowSupportComponents as components, plantBowCombinedSupportFixtures as combined } from "./plantBowSupports.fixtures";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports,
  setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { normalizeSavedBuilds } from "./savedBuilds";
import { parseSavedBuildExport, serializeSavedBuildExport } from "./savedBuildTransfer";
import type { TreeNode } from "./types";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const settings = (focusSkillId: string): PassiveOptimizationSettings => ({ mode: "weighted", focusSkillId, extraPointBudget: 7, pointBudgetMode: "all-available",
  preferences: [{ id: "plantDamage", weight: 1 }, { id: "life", weight: 3 }, { id: "poisonMagnitude", weight: 2 }, { id: "poisonDuration", weight: 1 }] });
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });

describe("reviewed Plant bow utility supports", () => {
  it.each(supports)("retains $id's frozen identity, family and context-only behavior", (f) => {
    const support = reviewedSkillSupports.find((s) => s.id === f.id)!;
    expect({ effectId: support.effectId, family: support.family, name: support.name }).toEqual({ effectId: f.effectId, family: f.family, name: f.name });
    expect(support.priorities).toEqual([]);
    for (const pair of pairs) if ((pair.allowed as readonly string[]).includes(f.id)) {
      const resolved = preCommon45SupportsFor(pair.skill).find((s) => s.id === f.id)!;
      const effect = f.kind === "area" ? "increased area" : f.kind === "duration" ? "more skill-effect duration" : f.kind === "cost" ? "less supported-skill cost" : "less movement-speed penalty";
      expect(resolved.summary).toContain(`${f.amount}% ${effect}`);
      expect(resolved.summary.toLowerCase()).toContain("priorities stay unchanged");
      expect(refineSkillPreferencePreset(preset(pair.skill), [f.id])).toEqual(preset(pair.skill));
      expect(resolved.summary).not.toContain("Bloom");
    }
  });

  it.each(pairs)("admits only $skill's frozen legal pairs without tag-derived or stale saved compatibility", ({ skill, allowed }) => {
    expect(preCommon45SupportsFor(skill).map((s) => s.id)).toEqual(allowed);
    const valid = allowed as readonly string[];
    const current = settings(skill);
    for (const f of supports) {
      const selected = setSkillSupport(current, f.id, true);
      if (valid.includes(f.id)) {
        expect(selected).toEqual({ ...current, supportGemIds: [f.id] });
        expect(setSkillSupport(selected, f.id, false)).toEqual({ ...current, supportGemIds: [] });
        expect(applySkillSupportPriorities(selected, preset(skill))).toEqual(selected);
        expect(skillSupportPriorityChanges(selected, preset(skill))).toEqual([]);
      } else {
        expect(selected).toBe(current);
        expect(normalizeSkillSupportIds(skill, [f.id])).toEqual([]);
      }
    }
    for (const unsupported of ["brutality-i", "projectile-acceleration-iii", "controlled-destruction", "spell-echo", "constructor"])
      expect(setSkillSupport(current, unsupported, true)).toBe(current);
  });

  it.each(pairs)("preserves $skill's manual preferences, goals, point budget and one tier per family through saved JSON", ({ skill, allowed }) => {
    const current = { ...settings(skill), goals: ["required"] };
    let selected = current;
    for (const f of supports) if ((allowed as readonly string[]).includes(f.id)) selected = setSkillSupport(selected, f.id, true) as typeof current;
    const expected = combined.find((f) => f.skill === skill)!.applied;
    expect(selected).toEqual({ ...current, supportGemIds: expected });
    expect(normalizeSkillSupportIds(skill, ["efficiency-ii", "efficiency-i", "mobility", null, {}, "bad"]))
      .toEqual(skill === "vine-arrow" ? ["efficiency-ii", "mobility"] : ["efficiency-ii"]);
    expect(normalizePassiveOptimizationSettings(selected)).toMatchObject({ ...settings(skill), supportGemIds: expected });
    expect(addSkillPresetPreferences(selected, preset(skill)).preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    const [saved] = normalizeSavedBuilds([{ id: skill, name: skill, createdAt: "test", updatedAt: "test", state: {
      selectedClassStartId: "ranger", pathStartNodeId: "start", nodeVisualScale: 3, buildGoalNodeIds: ["required"], ascendancyAllocationNodeIds: [],
      activeAllocationMode: "main", weaponSetAllocationNodeIds: { 1: [], 2: [] }, optimizerSettings: selected,
      allocationPlan: { committedNodePath: ["start"], committedEdgeKeys: [], previewNodePath: [], previewEdgeKeys: [], previewRouteNodePath: [] },
    } }]);
    const restored = parseSavedBuildExport(serializeSavedBuildExport([saved]))[0];
    expect(restored.state.optimizerSettings).toEqual({ ...settings(skill), supportGemIds: expected });
    expect(restored.state.buildGoalNodeIds).toEqual(["required"]);
    const stale = normalizePassiveOptimizationSettings({ ...settings(skill), supportGemIds: ["prolonged-duration-ii", "mobility", "efficiency-ii"] });
    expect(stale.supportGemIds).toEqual(skill === "vine-arrow" ? ["prolonged-duration-ii", "mobility", "efficiency-ii"] : ["efficiency-ii"]);
    expect(stale.preferences).toEqual(current.preferences);
  });

  it.each(components)("independently checks $skill / $component coverage, duration, cost and movement boundaries", (f) => {
    expect(Math.floor(f.radius * Math.sqrt(1.35))).toBe(f.magnifiedI);
    expect(Math.floor(f.radius * Math.sqrt(1.45))).toBe(f.magnifiedII);
    expect(Math.ceil(f.manaCost * 0.7)).toBe(f.efficiencyI);
    expect(Math.ceil(f.manaCost * 0.6)).toBe(f.efficiencyII);
    expect(f.magnifiedCost).toBeGreaterThan(f.manaCost);
    if ("duration" in f) {
      expect(Math.ceil(f.duration / .033) * .033).toBeCloseTo(f.roundedDuration);
      expect(Math.ceil(f.duration * 1.3 / .033) * .033).toBeCloseTo(f.prolongedI);
      expect(Math.ceil(f.duration * 1.35 / .033) * .033).toBeCloseTo(f.prolongedII);
      expect(100 - (100 - f.retainedSpeed) * .75).toBe(f.mobilityRetainedSpeed);
      expect(f.prolongedCost).toBeGreaterThan(f.manaCost);
    }
    if ("intrinsicDoT" in f) {
      expect(f.intrinsicDoTWithEachSupport).toBe(f.intrinsicDoT);
      expect(Math.floor(f.radius * Math.sqrt(1 + 1 + .45))).toBe(f.area100WithMagnifiedII);
      expect(Math.ceil(f.duration * 2 * 1.35 / .033) * .033).toBeCloseTo(f.duration100WithProlongedII);
    }
    if ("detonation" in f) {
      expect(f.detonationWithEachSupport).toBe(f.detonation);
      expect(f.rejectedDurationCost).toBe(f.manaCost);
      expect(f.rejectedMobilityCost).toBe(f.manaCost);
      expect(f.hitWithEachSupport).toBe(f.hit);
    }
    if ("outgoingPoison" in f) {
      expect(f.outgoingPoisonWithEachSupport).toBe(f.outgoingPoison);
      expect(f.poisonDurationWithEachSupport).toBe(f.poisonDuration);
      expect(f.poisonDuration).not.toBe(f.detonation);
    }
    expect(f.rate).toBe(1.2);
  });

  it("keeps lifetime, detonation, Poison supply and use-action movement distinct in contextual notes", () => {
    const text = (skill: string, support: string) => preCommon45SupportsFor(skill).find((s) => s.id === support)!.summary;
    expect(text("vine-arrow", "magnified-area-ii")).toContain("not intrinsic vine-DoT damage");
    expect(text("vine-arrow", "prolonged-duration-ii")).toContain("not intrinsic vine-DoT rate");
    expect(text("vine-arrow", "prolonged-duration-i")).toContain("Supplied Poison duration and storage are separate");
    expect(text("vine-arrow", "mobility")).toContain("not global Movement Speed or Attack Speed");
    expect(text("toxic-growth", "magnified-area-ii")).toContain("outgoing Poison duration stay separate");
    expect(text("toxic-growth", "efficiency-ii")).toContain("not Poison-supply costs");
    expect(text("toxic-growth", "efficiency-i")).toContain("15-second base detonation timer");
    expect(preCommon45SupportsFor("toxic-growth").some((s) => s.id.startsWith("prolonged") || s.id === "mobility")).toBe(false);
  });

  it.each(pairs)("does not change $skill's passive scoring, component scopes, owner checks or manual Poison warnings", ({ skill, allowed }) => {
    const current = addSkillPresetPreferences(settings(skill), preset(skill));
    const p = node("12% increased Damage with Plant Skills", "2% reduced Damage with Plant Skills", "20% increased Damage with Bows", "10% increased Attack Area Damage",
      "10% increased Chaos Damage", "10% increased Damage over Time", "Minions deal 100% increased Damage", "100% increased Damage with Plant Skills while Overgrown");
    for (const id of allowed) {
      const selected = setSkillSupport(current, id, true);
      expect(passivePreferenceValues(p, selected)).toEqual(passivePreferenceValues(p, current));
      expect(scorePassiveNode(p, selected.preferences, selected)).toBe(scorePassiveNode(p, current.preferences, current));
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).passiveStatScopes).toEqual(preset(skill).passiveStatScopes);
      expect(refineSkillPreferencePreset(preset(skill), selected.supportGemIds).exclusions.map((e) => e.id))
        .toEqual(expect.arrayContaining(["poisonChance", "poisonMagnitude", "poisonDuration"]));
    }
  });
});

import { commonSupport45Ids } from "./commonSupportBatch.fixtures";
import { proxyDebuff45Ids } from "./proxyDebuffSupportBatch.fixtures";
import { specialist50Ids } from "./specialistSupportBatch.fixtures";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports as currentReviewedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import type { TreeNode } from "./types";

// Frozen capture assertions exclude additions covered by commonSupportBatch.test.ts.
const reviewedSkillSupports = currentReviewedSkillSupports.filter(s=>!commonSupport45Ids.has(s.id) && !proxyDebuff45Ids.has(s.id) && !specialist50Ids.has(s.id));
const ids = ["skeletal-sniper", "skeletal-frost-mage", "skeletal-storm-mage", "skeletal-brute", "skeletal-cleric", "skeletal-reaver", "bone-offering", "pain-offering"];
const skeletons = ids.slice(0, 6);
const attacks = ["skeletal-sniper", "skeletal-brute", "skeletal-reaver"];
const casters = ["skeletal-frost-mage", "skeletal-storm-mage", "skeletal-cleric"];
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });
const preset = (id: string) => getSkillPreferencePreset(id)!;
const fresh = (id: string) => addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 5, preferences: [] }, preset(id));

describe("minion and Offering preset ownership", () => {
  it.each(ids)("adds %s only explicitly and preserves manual priorities, goals and budgets", (id) => {
    const current = { mode: "weighted" as const, extraPointBudget: 9, pointBudgetMode: "all-available" as const, goalNodeIds: ["required"], preferences: [{ id: "spellDamage" as const, weight: 1 }, { id: "energyShield" as const, weight: 3 }] };
    const selected = addSkillPresetPreferences(current, preset(id));
    expect(selected.preferences.slice(0, 2)).toEqual(current.preferences);
    expect(selected).toHaveProperty("goalNodeIds", current.goalNodeIds);
    expect(selected.extraPointBudget).toBe(9);
    expect(selected.pointBudgetMode).toBe("all-available");
    expect(normalizePassiveOptimizationSettings(selected)).toMatchObject({ focusSkillId: id, preferences: selected.preferences, extraPointBudget: 9 });
    expect(preset(id).passiveStatScopes ?? []).toEqual([]);
    expect(passivePreferenceValues(node("30% increased Critical Hit Chance for Spells", "Spell Skills have 10% reduced Area of Effect", "15% increased Projectile Speed for Spell Skills", "35% increased Spell Area Damage"), { focusSkillId: id })).toEqual({});
  });
  it.each(skeletons)("does not transfer player damage or speed into %s's minion suggestions", (id) => {
    const selected = fresh(id);
    const player = node("100% increased Spell Damage", "100% increased Attack Damage", "100% increased Physical Damage", "100% increased Cold Damage", "100% increased Lightning Damage", "100% increased Fire Damage", "30% increased Attack Speed", "30% increased Cast Speed");
    expect(scorePassiveNode(player, selected.preferences, { focusSkillId: id })).toBe(0);
    expect(preset(id).exclusions.map((e) => e.id)).toEqual(expect.arrayContaining(["spellDamage", "attackDamage", "castSpeed", "attackSpeed"]));
    expect(selected.preferences.some((p) => p.id === "skillDuration")).toBe(false);
  });
  it.each(attacks)("scores only %s's attack cadence, counting a combined minion speed line once", (id) => {
    expect(fresh(id).preferences.map((p) => p.id)).toEqual(["minionDamage", "minionAttackSpeed", "minionLife"]);
    expect(scorePassiveNode(node("Minions have 6% increased Attack and Cast Speed"), fresh(id).preferences, { focusSkillId: id })).toBe(4);
    expect(scorePassiveNode(node("Minions have 6% increased Cast Speed"), fresh(id).preferences, { focusSkillId: id })).toBe(0);
    expect(scorePassiveNode(node("Minions have 6% reduced Attack Speed"), fresh(id).preferences, { focusSkillId: id })).toBe(-4);
  });
  it.each(["skeletal-frost-mage", "skeletal-storm-mage"])("scores only %s's minion spell cadence without player spell scopes", (id) => {
    expect(fresh(id).preferences.map((p) => p.id)).toEqual(["minionDamage", "minionCastSpeed", "minionLife"]);
    expect(scorePassiveNode(node("Minions have 6% increased Attack and Cast Speed"), fresh(id).preferences, { focusSkillId: id })).toBe(4);
    expect(scorePassiveNode(node("Minions have 6% increased Attack Speed"), fresh(id).preferences, { focusSkillId: id })).toBe(0);
    expect(scorePassiveNode(node("Minions have 6% reduced Cast Speed"), fresh(id).preferences, { focusSkillId: id })).toBe(-4);
  });
  it("keeps Cleric healing and missing revival mechanics distinct from damage or player regeneration", () => {
    const selected = fresh("skeletal-cleric");
    expect(selected.preferences).toEqual([{ id: "minionLife", weight: 3 }, { id: "minionCastSpeed", weight: 1 }]);
    expect(scorePassiveNode(node("Minions deal 100% increased Damage", "100% increased Life Regeneration Rate"), selected.preferences)).toBe(0);
    expect(preset("skeletal-cleric").description).toContain("missing native revival calculations");
    expect(preset("skeletal-cleric").suggestions.find((s) => s.id === "minionCastSpeed")?.reason).toContain("not more regeneration per second");
    expect(normalizeSkillSupportIds("skeletal-cleric", ["feeding-frenzy-i", "rapid-casting-i"])).toEqual(["rapid-casting-i"]);
  });
  it.each(["bone-offering", "pain-offering"])("keeps %s utility separate from player damage and recipient minion damage/speed", (id) => {
    const selected = fresh(id);
    expect(scorePassiveNode(node("100% increased Physical Damage", "100% increased Spell Damage", "Minions deal 100% increased Damage", "Minions have 30% increased Attack and Cast Speed"), selected.preferences, { focusSkillId: id })).toBe(0);
    expect(scorePassiveNode(node("10% increased Skill Effect Duration", "3% increased Cast Speed"), selected.preferences, { focusSkillId: id })).toBe(4);
    expect(preset(id).suggestions.some((s) => s.id === "minionDamage")).toBe(false);
    expect(normalizeSkillSupportIds(id, ["feeding-frenzy-i", "prolonged-duration-i", "efficiency-i", "mobility"])).toEqual(["prolonged-duration-i", "efficiency-i", "mobility"]);
  });
  it("reviews Pain Offering coverage but does not infer Bone Offering shield radius or player-spell area", () => {
    expect(fresh("pain-offering").preferences).toContainEqual({ id: "areaOfEffect", weight: 1 });
    expect(fresh("bone-offering").preferences.some((p) => p.id === "areaOfEffect")).toBe(false);
    expect(scorePassiveNode(node("10% increased Area of Effect"), fresh("pain-offering").preferences)).toBe(1);
    expect(scorePassiveNode(node("Spell Skills have 10% increased Area of Effect"), fresh("pain-offering").preferences, { focusSkillId: "pain-offering" })).toBe(0);
  });
  it.each(ids)("offers only reviewed companion supports for %s without implicit weight changes", (id) => {
    const expected = [
      ...(["skeletal-sniper", "skeletal-frost-mage", "skeletal-storm-mage", "skeletal-brute", "skeletal-reaver"].includes(id) ? ["feeding-frenzy-i", "feeding-frenzy-ii"] : []),
      ...(casters.includes(id) ? ["rapid-casting-i", "rapid-casting-ii"] : []),
      ...(id.endsWith("offering") ? ["prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility"] : []),
    ].sort();
    expect(reviewedSkillSupports.filter((s) => s.skillIds.includes(id)).map((s) => s.id).sort()).toEqual(expected);
    const current = fresh(id);
    for (const support of expected) {
      const selected = setSkillSupport(current, support, true);
      expect(selected.preferences).toEqual(current.preferences);
      if (support.startsWith("feeding-frenzy")) {
        expect(applySkillSupportPriorities(selected, preset(id)).preferences).toContainEqual({ id: "minionLife", weight: 2 });
        expect(refineSkillPreferencePreset(preset(id), selected.supportGemIds).suggestions.find((s) => s.id === "minionLife")?.weight).toBe(2);
      } else {
        expect(skillSupportPriorityChanges(selected, preset(id))).toEqual([]);
        expect(applySkillSupportPriorities(selected, preset(id))).toEqual(selected);
        expect(refineSkillPreferencePreset(preset(id), selected.supportGemIds)).toEqual(preset(id));
      }
    }
    expect(normalizeSkillSupportIds(id, ["controlled-destruction", "spell-echo", "concentrated-area", "brutality-i", "projectile-acceleration-iii"])).toEqual([]);
  });
});

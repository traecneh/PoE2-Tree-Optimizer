import { commonSupport45Ids } from "./commonSupportBatch.fixtures";
import { proxyDebuff45Ids } from "./proxyDebuffSupportBatch.fixtures";
import { resource50Ids } from "./resourceSupportBatch.fixtures";
import { specialist50Ids } from "./specialistSupportBatch.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { addSkillPresetPreferences, getSkillPreferencePreset, skillPreferencePresets } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports as currentReviewedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import type { TreeNode } from "./types";

// Keep the original capture separate from subsequently reviewed support batches.
const reviewedSkillSupports = currentReviewedSkillSupports.filter(s=>!commonSupport45Ids.has(s.id) && !proxyDebuff45Ids.has(s.id) && !resource50Ids.has(s.id) && !specialist50Ids.has(s.id));
const ids = ["snipers-mark", "bloodhounds-mark", "freezing-mark", "voltaic-mark"];
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });
const preset = (id: string) => getSkillPreferencePreset(id)!;
const fresh = (id: string) => addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 5, preferences: [] }, preset(id));
const expected = [
  { id: "markEffect", weight: 3 }, { id: "markUseSpeed", weight: 1 }, { id: "markDuration", weight: 1 },
];

describe("reviewed Mark utility presets", () => {
  it("keeps four Mark utility focuses distinct from Pounce's combined gem tags", () => {
    const catalog = JSON.parse(readFileSync("tools/coverage/catalog.json", "utf8")) as { entries: { id: string; name: string; support: boolean; tier: number }[] };
    expect(skillPreferencePresets.filter((p) => p.tags.includes("mark")).map((p) => p.id)).toEqual([...ids, "pounce"]);
    expect(preset("pounce").suggestions.some((s) => s.id === "markEffect")).toBe(false);
    const metadata = [
      ["snipers-mark", "Sniper's Mark", "SnipersMark", 7, ["dexterity", "duration", "grants_active_skill", "mark"]],
      ["bloodhounds-mark", "Bloodhound's Mark", "BloodhoundsMark", 9, ["area", "attack", "dexterity", "duration", "grants_active_skill", "mark", "payoff", "physical", "trigger"]],
      ["freezing-mark", "Freezing Mark", "FreezingMark", 7, ["buff", "cold", "dexterity", "duration", "grants_active_skill", "intelligence", "mark"]],
      ["voltaic-mark", "Voltaic Mark", "VoltaicMark", 7, ["buff", "dexterity", "duration", "grants_active_skill", "lightning", "mark"]],
    ] as const;
    for (const [id, name, gem, tier, tags] of metadata) {
      expect(preset(id)).toMatchObject({ id, name, gemId: `Metadata/Items/Gems/SkillGem${gem}`, tags, passiveStatScopes: [] });
      expect(catalog.entries.find((g) => g.id === preset(id).gemId)).toMatchObject({ name, support: false, tier });
      expect(preset(id).sourceUrl).toContain("PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/");
    }
    expect(getSkillPreferencePreset("Sniper's Mark")).toBeUndefined();
    expect(getSkillPreferencePreset("BloodExplosionPlayer")).toBeUndefined();
  });
  it.each(ids)("adds %s's utility suggestions only explicitly and preserves goals, budgets and priorities", (id) => {
    expect(fresh(id).preferences).toEqual(expected);
    const current = { mode: "weighted" as const, extraPointBudget: 9, pointBudgetMode: "all-available" as const, goalNodeIds: ["required"],
      preferences: [{ id: "spellDamage" as const, weight: 1 }, { id: "energyShield" as const, weight: 3 }, { id: "markEffect" as const, weight: 1 }] };
    const selected = addSkillPresetPreferences(current, preset(id));
    expect(selected.preferences.slice(0, 3)).toEqual(current.preferences);
    expect(selected.preferences.slice(3)).toEqual(expected.slice(1));
    expect(selected).toMatchObject({ focusSkillId: id, extraPointBudget: 9, pointBudgetMode: "all-available", goalNodeIds: ["required"] });
    expect(normalizePassiveOptimizationSettings(selected)).toMatchObject({ focusSkillId: id, preferences: selected.preferences, extraPointBudget: 9 });
    expect(addSkillPresetPreferences(selected, preset(id))).toEqual(selected);
    expect(new Set(selected.preferences.map((p) => p.id)).size).toBe(selected.preferences.length);
  });
  it.each(ids)("scores Mark utility once for %s without treating tags, a buff or a trigger as its own hit", (id) => {
    const selected = fresh(id);
    const utility = node("10% increased Effect of your Mark Skills", "Mark Skills have 10% increased Use Speed", "Mark Skills have 10% increased Skill Effect Duration");
    expect(scorePassiveNode(utility, selected.preferences, { focusSkillId: id })).toBe(5);
    expect(scorePassiveNode(node("10% reduced Effect of your Mark Skills"), selected.preferences, { focusSkillId: id })).toBe(-3);
    const unrelated = node("100% increased Spell Damage", "100% increased Attack Damage", "100% increased Physical Damage", "100% increased Cold Damage",
      "100% increased Lightning Damage", "Minions deal 100% increased Damage", "30% increased Cast Speed", "30% increased Attack Speed",
      "100% increased Critical Hit Chance", "100% increased Critical Damage Bonus", "30% increased Curse Magnitudes", "30% increased Freeze Buildup",
      "30% increased Electrocute Buildup", "30% increased Exposure Effect");
    expect(scorePassiveNode(unrelated, selected.preferences, { focusSkillId: id })).toBe(0);
    expect(preset(id).exclusions.map((e) => e.id)).toEqual(expect.arrayContaining(["spellDamage", "attackDamage", "minionDamage", "criticalChance", "criticalDamageBonus"]));
    expect(passivePreferenceValues(node("30% increased Critical Hit Chance for Spells", "30% increased Critical Hit Chance for Attacks",
      "10% increased Spell Area Damage", "10% increased Attack Area Damage", "10% chance to Hinder Enemies on Hit with Spells",
      "Attacks have 10% chance to Maim on Hit", "10% chance for Attack Hits to apply Incision"), { focusSkillId: id })).toEqual({});
    expect(scorePassiveNode(node("10% increased Spell Damage"), [{ id: "spellDamage", weight: 1 }], { focusSkillId: id })).toBe(1);
  });
  it.each(ids)("offers only the reviewed utility supports without silently changing %s's priorities", (id) => {
    expect(reviewedSkillSupports.filter((s) => s.skillIds.includes(id)).map((s) => s.id)).toEqual(["prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility"]);
    expect(normalizeSkillSupportIds(id, reviewedSkillSupports.map((s) => s.id))).toEqual(["prolonged-duration-i", "efficiency-i", "mobility"]);
    expect(refineSkillPreferencePreset(preset(id), reviewedSkillSupports.map((s) => s.id)).suggestions).toEqual(preset(id).suggestions);
    expect(refineSkillPreferencePreset(preset(id), reviewedSkillSupports.map((s) => s.id)).passiveStatScopes).toEqual([]);
  });
  it.each(ids)("retains %s's priorities, ownership and scope when selecting or combining reviewed utility supports", (id) => {
    const current = { ...fresh(id), goalNodeIds: ["required"], pointBudgetMode: "all-available" as const };
    const allowed = ["prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility"];
    for (const support of reviewedSkillSupports) {
      const selected = setSkillSupport(current, support.id, true);
      if (!allowed.includes(support.id)) {
        expect(selected).toBe(current);
        continue;
      }
      expect(selected).toEqual({ ...current, supportGemIds: [support.id] });
      expect(normalizePassiveOptimizationSettings(selected)).toMatchObject({ focusSkillId: id, preferences: expected, supportGemIds: [support.id], pointBudgetMode: "all-available", extraPointBudget: 5 });
      expect(refineSkillPreferencePreset(preset(id), [support.id])).toEqual(preset(id));
      expect(skillSupportPriorityChanges(selected, preset(id))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(id))).toEqual(selected);
      expect(addSkillPresetPreferences(selected, preset(id))).toEqual(selected);
      expect(setSkillSupport(selected, support.id, false)).toEqual({ ...current, supportGemIds: [] });
      expect(scorePassiveNode(node("10% increased Effect of your Mark Skills", "Mark Skills have 10% increased Use Speed", "Mark Skills have 10% increased Skill Effect Duration"), selected.preferences, selected)).toBe(5);
    }
    let combined: PassiveOptimizationSettings = current;
    for (const support of ["mobility", "efficiency-i", "prolonged-duration-i", "efficiency-ii", "prolonged-duration-ii"]) combined = setSkillSupport(combined, support, true);
    expect(combined).toEqual({ ...current, supportGemIds: ["mobility", "efficiency-ii", "prolonged-duration-ii"] });
    expect(normalizeSkillSupportIds(id, ["efficiency-i", "efficiency-ii", "prolonged-duration-ii", "prolonged-duration-i", "mobility", "mobility"]))
      .toEqual(["efficiency-i", "prolonged-duration-ii", "mobility"]);
    expect(refineSkillPreferencePreset(preset(id), combined.supportGemIds)).toEqual(preset(id));
  });
  it("documents application cost, movement and both timers without inventing damage or guaranteed uptime", () => {
    const support = (id: string) => reviewedSkillSupports.find((s) => s.id === id)!;
    for (const [id, value] of [["efficiency-i", "30%"], ["efficiency-ii", "40%"]]) {
      expect(support(id).summary).toContain(`${value} less supported-skill cost`);
      expect(support(id).summary).toContain("application cost, not triggered damage or buff strength");
    }
    for (const [id, value] of [["prolonged-duration-i", "30%"], ["prolonged-duration-ii", "35%"]]) {
      expect(support(id).summary).toContain(`${value} more duration`);
      expect(support(id).summary).toContain("lengthen the secondary buff, not its strength");
      expect(support(id).summary).toContain("consumption, re-marking and uptime are not simulated");
    }
    expect(support("mobility").summary).toContain("25% less movement-speed penalty");
    expect(support("mobility").summary).toContain("player application movement, not the consuming hit or Blood Explosion");
    for (const id of ["freezing-mark", "voltaic-mark"]) expect(preset(id).suggestions.find((s) => s.id === "markDuration")?.reason).toContain("Native checks also lengthen the separate post-consumption buff timer");
  });
  it("keeps Sniper's critical-hit consumption and Frenzy Charge separate from critical/projectile priorities", () => {
    expect(preset("snipers-mark").description).toContain("Frenzy Charge");
    expect(preset("snipers-mark").description).toContain("six-second cooldown");
    expect(preset("snipers-mark").suggestions.find((s) => s.id === "markDuration")?.reason).toContain("Critical Hit consumes");
    expect(preset("snipers-mark").suggestions.some((s) => ["criticalChance", "projectileDamage", "cooldownRecoveryRate"].includes(s.id))).toBe(false);
  });
  it("keeps Bloodhound's externally supplied Blood Loss and paused timer distinct from Blood Explosion ownership", () => {
    expect(preset("bloodhounds-mark").description).toContain("external Blood Loss");
    expect(preset("bloodhounds-mark").description).toContain("separate non-weapon attack");
    expect(preset("bloodhounds-mark").suggestions.find((s) => s.id === "markDuration")?.reason).toContain("does not expire");
    expect(preset("bloodhounds-mark").tags).toContain("attack");
    expect(preset("bloodhounds-mark").exclusions.find((s) => s.id === "physicalDamage")?.reason).toContain("triggered non-weapon");
    expect(preset("bloodhounds-mark").suggestions.some((s) => ["bleedingChance", "stunBuildup", "physicalDamage", "attackDamage"].includes(s.id))).toBe(false);
  });
  it.each(["freezing-mark", "voltaic-mark"])("requires external control activation and keeps %s's conditional player buff separate", (id) => {
    expect(preset(id).description).toContain("marking another target removes that buff");
    expect(preset(id).suggestions.find((s) => s.id === "markDuration")?.reason).toContain("separate post-consumption buff timer");
    expect(preset(id).tags).not.toContain("spell");
    expect(preset(id).suggestions.slice(0, 2)).toEqual(preset("snipers-mark").suggestions.slice(0, 2));
    expect(preset(id).suggestions.some((s) => ["coldDamage", "lightningDamage", "freezeBuildup", "electrocuteBuildup", "shockChance", "minionDamage"].includes(s.id))).toBe(false);
  });
});

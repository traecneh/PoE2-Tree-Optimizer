import { commonSupport45Ids } from "./commonSupportBatch.fixtures";
import { resource50Ids } from "./resourceSupportBatch.fixtures";
import { specialist50Ids } from "./specialistSupportBatch.fixtures";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode, type PassiveOptimizationSettings } from "./passivePreferences";
import { addSkillPresetPreferences, getSkillPreferencePreset, skillPreferencePresets } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports as currentReviewedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";
import type { TreeNode } from "./types";

// Keep the original capture separate from subsequently reviewed support batches.
const reviewedSkillSupports = currentReviewedSkillSupports.filter(s=>!commonSupport45Ids.has(s.id) && !resource50Ids.has(s.id) && !specialist50Ids.has(s.id));
const ids = ["infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar"];
const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "fixture", stats, flags: {}, position: { x: 0, y: 0 } });
const fresh = (id: string) => addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 5, preferences: [] }, preset(id));
const supports = (id: string) => ["magnified-area-i", "magnified-area-ii",
  ...(["infernal-cry", "ancestral-cry", "fortifying-cry"].includes(id) ? ["prolonged-duration-i", "prolonged-duration-ii"] : []),
  "efficiency-i", "efficiency-ii", ...(id === "ferocious-roar" ? [] : ["mobility"]),
  "raging-cry", ...(id === "seismic-cry" ? ["exposing-cry"] : []), ...(id === "ancestral-cry" ? [] : ["enraged-warcry-i", "enraged-warcry-ii"]),
  ...(id === "ancestral-cry" ? [] : ["echoing-cry"]), "corrupting-cry-i", "corrupting-cry-ii"];
function expectUnchangedUtility(id: string, supportIds: string[]) {
  const base = preset(id);
  const refined = refineSkillPreferencePreset(base, supportIds);
  if (id !== "seismic-cry" || !supportIds.includes("exposing-cry")) { expect(refined).toEqual(base); return; }
  expect({ ...refined, exclusions: base.exclusions }).toEqual(base);
  expect(refined.exclusions.filter((e) => e.id !== "skillDuration")).toEqual(base.exclusions.filter((e) => e.id !== "skillDuration"));
  expect(refined.exclusions.find((e) => e.id === "skillDuration")?.reason).toContain("Exposing Cry adds a Duration type for its on-hit Exposure");
}

describe("reviewed player Warcry utility presets", () => {
  it("registers five distinct positive-tier gems without treating linked attack tags as parent hit scopes", () => {
    const catalog = JSON.parse(readFileSync("tools/coverage/catalog.json", "utf8")) as { entries: { id: string; name: string; support: boolean; tier: number }[] };
    expect(skillPreferencePresets.filter((p) => ids.includes(p.id)).map((p) => p.id)).toEqual(ids);
    for (const [id, tier] of [["infernal-cry", 3], ["seismic-cry", 11], ["ancestral-cry", 13], ["fortifying-cry", 9], ["ferocious-roar", 7]] as const) {
      expect(catalog.entries.find((e) => e.id === preset(id).gemId)).toMatchObject({ name: preset(id).name, tier, support: false });
      expect(preset(id).tags).toContain("warcry");
      expect(preset(id).passiveStatScopes).toEqual([]);
      expect(preset(id).sourceUrl).toContain("/act_str.lua#L");
    }
    expect(preset("infernal-cry").gemId).toBe("Metadata/Items/Gems/SkillGemInfernallCry");
    expect(preset("ancestral-cry").tags).toEqual(expect.arrayContaining(["attack", "projectile", "conditional"]));
    expect(preset("fortifying-cry").tags).toContain("attack");
    expect(preset("ferocious-roar").tags).toEqual(expect.arrayContaining(["bear", "shapeshift", "meta"]));
    expect(preset("skeletal-brute").suggestions.some((s) => s.id.startsWith("warcry"))).toBe(false);
  });
  it.each(ids)("adds %s's utility preferences explicitly without changing existing priorities, goals or budgets", (id) => {
    const expected = id === "ancestral-cry"
      ? [{ id: "warcrySpeed", weight: 2 }, { id: "warcryAreaOfEffect", weight: 1 }, { id: "skillDuration", weight: 1 }]
      : [{ id: "warcrySpeed", weight: 2 }, { id: "warcryCooldownRecoveryRate", weight: 2 }, { id: "warcryAreaOfEffect", weight: 1 }];
    expect(fresh(id).preferences).toEqual(expected);
    const current = { mode: "weighted" as const, extraPointBudget: 9, pointBudgetMode: "all-available" as const, goals: ["required"],
      preferences: [{ id: "warcrySpeed" as const, weight: 1 }, { id: "armour" as const, weight: 3 }, { id: "spellDamage" as const, weight: 1 }] };
    const selected = addSkillPresetPreferences(current, preset(id));
    expect(selected).toMatchObject({ goals: ["required"], extraPointBudget: 9, pointBudgetMode: "all-available", focusSkillId: id });
    expect(selected.preferences.slice(0, 3)).toEqual(current.preferences);
    expect(selected.preferences.slice(3)).toEqual(expected.slice(1));
    expect(normalizePassiveOptimizationSettings(selected)).toMatchObject({ focusSkillId: id, preferences: selected.preferences });
    expect(addSkillPresetPreferences(selected, preset(id))).toEqual(selected);
  });
  it.each(ids)("keeps %s's player utility, damage, minion ownership and generic overlap separate", (id) => {
    const settings = fresh(id);
    const utility = node("10% increased Warcry Speed", "10% increased Warcry Cooldown Recovery Rate", "Warcry Skills have 10% increased Area of Effect", "10% increased Skill Effect Duration");
    expect(scorePassiveNode(utility, settings.preferences, settings)).toBe(id === "ancestral-cry" ? 4 : 5);
    expect(scorePassiveNode(node("10% reduced Warcry Speed"), settings.preferences, settings)).toBe(-2);
    expect(scorePassiveNode(node("100% increased Spell Damage", "100% increased Attack Damage", "100% increased Physical Damage", "100% increased Fire Damage",
      "Minions deal 100% increased Damage", "Minions have 100% increased Warcry Speed", "100% increased Cast Speed", "100% increased Attack Speed",
      "100% increased Critical Hit Chance", "100% increased Stun Buildup", "Break 100% increased Armour"), settings.preferences, settings)).toBe(0);
    expect(passivePreferenceValues(node("30% increased Critical Hit Chance for Spells", "30% increased Critical Hit Chance for Attacks", "10% increased Attack Area Damage",
      "10% increased Spell Area Damage", "10% increased Damage with Maces", "10% increased Damage with Two Handed Weapons"), settings)).toEqual({});
    const generic = node("3% increased Skill Speed", "10% increased Cooldown Recovery Rate", "10% increased Area of Effect");
    expect(scorePassiveNode(generic, settings.preferences, settings)).toBe(0);
    expect(scorePassiveNode(generic, [...settings.preferences, { id: "skillSpeed", weight: 1 }, { id: "cooldownRecoveryRate", weight: 1 }, { id: "areaOfEffect", weight: 1 }], settings)).toBe(3);
    expect(scorePassiveNode(node("10% increased Spell Damage"), [{ id: "spellDamage", weight: 1 }], settings)).toBe(1);
    expect(preset(id).exclusions.some((e) => ["armour", "life", "energyShield"].includes(e.id))).toBe(false);
  });
  it.each(ids)("offers only %s's reviewed base-use supports without mixing Ferocious meta triggering", (id) => {
    const all = reviewedSkillSupports.map((s) => s.id);
    expect(reviewedSkillSupports.filter((s) => s.skillIds.includes(id)).map((s) => s.id)).toEqual(supports(id));
    const normalized = supports(id).filter((s) => !s.endsWith("-ii"));
    expect(normalizeSkillSupportIds(id, [...all, "SupportFerociousRoarPlayer"])).toEqual(normalized);
    expectUnchangedUtility(id, all);
    expect(normalizePassiveOptimizationSettings({ ...fresh(id), supportGemIds: all })).toHaveProperty("supportGemIds", normalized);
  });
  it.each(ids)("retains %s's priorities, ownership and budgets when selecting, combining and removing reviewed supports", (id) => {
    const current = { ...fresh(id), goals: ["required"], pointBudgetMode: "all-available" as const };
    for (const support of reviewedSkillSupports) {
      const selected = setSkillSupport(current, support.id, true);
      if (!supports(id).includes(support.id)) { expect(selected).toBe(current); continue; }
      expect(selected).toEqual({ ...current, supportGemIds: [support.id] });
      expect(normalizePassiveOptimizationSettings(selected)).toMatchObject({ focusSkillId: id, supportGemIds: [support.id], preferences: current.preferences, extraPointBudget: 5, pointBudgetMode: "all-available" });
      expectUnchangedUtility(id, [support.id]);
      expect(skillSupportPriorityChanges(selected, preset(id))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(id))).toEqual(selected);
      expect(addSkillPresetPreferences(selected, preset(id))).toEqual(selected);
      expect(setSkillSupport(selected, support.id, false)).toEqual({ ...current, supportGemIds: [] });
    }
    let combined: PassiveOptimizationSettings = current;
    for (const supportId of supports(id)) combined = setSkillSupport(combined, supportId, true);
    const finalIds = supports(id).filter((s) => !s.endsWith("-i"));
    expect(combined).toEqual({ ...current, supportGemIds: finalIds });
    expectUnchangedUtility(id, combined.supportGemIds!);
    expect(scorePassiveNode(node("10% increased Warcry Speed", "Warcry Skills have 10% increased Area of Effect"), combined.preferences, combined)).toBe(3);
  });
  it("documents Warcry area, timers and movement without assuming empowerment, Guard or replacement-mode benefits", () => {
    const support = (id: string) => reviewedSkillSupports.find((s) => s.id === id)!;
    for (const id of ["magnified-area-i", "magnified-area-ii"]) expect(support(id).summary).toContain("Warcry coverage is not empowered-attack area or enemy Power");
    for (const id of ["prolonged-duration-i", "prolonged-duration-ii"]) expect(support(id).summary).toContain("Warcry timers do not guarantee empowerment, Guard strength or Glory");
    for (const id of ["efficiency-i", "efficiency-ii"]) expect(support(id).summary).toContain("application cost, not triggered damage or buff strength");
    expect(support("mobility").summary).toContain("base human-form use, not Ferocious Roar or socketed replacement");
    expect(ids.reduce((count, id) => count + supports(id).length, 0)).toBe(58);
  });
  it("registers fourteen Power, hit and cooldown-aware pairs without assuming native resource transactions", () => {
    const catalog = JSON.parse(readFileSync("tools/coverage/catalog.json", "utf8")) as { entries: { id: string; name: string; support: boolean; tier: number; effectId: string }[] };
    const cases = [
      ["raging-cry", "SupportRagingCryPlayer", "RagingCry", 2, ids, "4 Rage per 5 counted enemy Power"],
      ["exposing-cry", "SupportExposingCryPlayer", "ExposingCry", 4, ["seismic-cry"], "Exposure on Hit for 5 seconds"],
      ["enraged-warcry-i", "SupportEnragedWarcryPlayer", "EnragedWarcry", 4, ids.filter((id) => id !== "ancestral-cry"), "Spends 20 Rage instead of an Endurance Charge"],
      ["enraged-warcry-ii", "SupportEnragedWarcryPlayerTwo", "EnragedWarcry", 5, ids.filter((id) => id !== "ancestral-cry"), "Spends 15 Rage instead of an Endurance Charge"],
    ] as const;
    let pairs = 0;
    for (const [id, effectId, family, tier, skillIds, detail] of cases) {
      const s = reviewedSkillSupports.find((s) => s.id === id)!;
      expect(s).toMatchObject({ effectId, family, skillIds, priorities: [] });
      expect(catalog.entries.find((e) => e.effectId === effectId)).toMatchObject({ name: s.name, support: true, tier });
      expect(s.summary).toContain(detail); expect(s.summary).toContain("PoB");
      expect(s.sourceUrl).toContain("/sup_str.lua#L");
      for (const p of skillPreferencePresets) expect(normalizeSkillSupportIds(p.id, [id])).toEqual(skillIds.some((skill) => skill === p.id) ? [id] : []);
      pairs += s.skillIds.length;
    }
    expect(pairs).toBe(14);
    const current = { ...fresh("seismic-cry"), supportGemIds: ["raging-cry", "exposing-cry", "enraged-warcry-i"] };
    const upgraded = setSkillSupport(current, "enraged-warcry-ii", true);
    expect(upgraded).toEqual({ ...current, supportGemIds: ["raging-cry", "exposing-cry", "enraged-warcry-ii"] });
    expect(normalizeSkillSupportIds("seismic-cry", [...current.supportGemIds, "enraged-warcry-ii"])).toEqual(current.supportGemIds);
    expect(setSkillSupport(upgraded, "enraged-warcry-ii", false)).toEqual({ ...current, supportGemIds: ["raging-cry", "exposing-cry"] });
    expect(refineSkillPreferencePreset(preset("seismic-cry"), ["exposing-cry"]).suggestions.some((s) => s.id === "skillDuration")).toBe(false);
  });
  it("registers fourteen repeat and separate Corrupted Blood pairs without granting hit, ailment or DPS scopes", () => {
    const catalog = JSON.parse(readFileSync("tools/coverage/catalog.json", "utf8")) as { entries: { name: string; support: boolean; tier: number; effectId: string }[] };
    const cases = [
      ["echoing-cry", "SupportEchoingCryPlayer", "EchoingCry", 4, ids.filter((id) => id !== "ancestral-cry"), "Two echoes 1.3 seconds apart"],
      ["corrupting-cry-i", "SupportCorruptingCryPlayer", "CorruptingCry", 3, ids, "Tier I has 30% less Warcry area"],
      ["corrupting-cry-ii", "SupportCorruptingCryPlayerTwo", "CorruptingCry", 5, ids, "Tier II has no Tier-I Warcry-area penalty"],
    ] as const;
    let pairs = 0;
    for (const [id, effectId, family, tier, skillIds, detail] of cases) {
      const s = reviewedSkillSupports.find((s) => s.id === id)!;
      expect(s).toMatchObject({ effectId, family, skillIds, priorities: [] });
      expect(catalog.entries.find((e) => e.effectId === effectId)).toMatchObject({ name: s.name, support: true, tier });
      expect(s.summary).toContain(detail); expect(s.sourceUrl).toContain("/sup_str.lua#L");
      for (const p of skillPreferencePresets) expect(normalizeSkillSupportIds(p.id, [id])).toEqual(skillIds.some((skill) => skill === p.id) ? [id] : []);
      pairs += s.skillIds.length;
    }
    expect(pairs).toBe(14);
    const current = { ...fresh("seismic-cry"), supportGemIds: ["echoing-cry", "corrupting-cry-i"] };
    const upgraded = setSkillSupport(current, "corrupting-cry-ii", true);
    expect(upgraded).toEqual({ ...current, supportGemIds: ["echoing-cry", "corrupting-cry-ii"] });
    expect(normalizeSkillSupportIds("seismic-cry", [...current.supportGemIds, "corrupting-cry-ii"])).toEqual(current.supportGemIds);
    expect(setSkillSupport(upgraded, "corrupting-cry-ii", false)).toEqual({ ...current, supportGemIds: ["echoing-cry"] });
    for (const id of ["seismic-cry", "ferocious-roar"]) {
      expect(preset(id).exclusions.find((e) => e.id === "skillDuration")?.reason).toContain("Corrupted Blood");
      for (const tier of ["i", "ii"]) expect(refineSkillPreferencePreset(preset(id), [`corrupting-cry-${tier}`]).suggestions.some((s) => s.id === "skillDuration")).toBe(false);
    }
    expect(refineSkillPreferencePreset(preset("ancestral-cry"), ["corrupting-cry-ii"]).suggestions.some((s) => s.id === "skillDuration")).toBe(true);
    const echo = reviewedSkillSupports.find((s) => s.id === "echoing-cry")!;
    expect(echo.summary).toContain("moving 10 metres before use"); expect(echo.summary).toContain("existing use condition excludes it");
    for (const id of ["corrupting-cry-i", "corrupting-cry-ii"]) {
      const s = reviewedSkillSupports.find((s) => s.id === id)!;
      expect(s.summary).toContain("separate player-owned Physical Corrupted Blood");
      expect(s.summary).toContain("1 stack per trigger, a 10-stack cap");
      expect(s.summary).toContain("parent use still costs Mana");
    }
  });
  it("keeps Ancestral Cry Glory-gated, not cooldown-gated or an unconditional Fire/projectile attack", () => {
    const p = preset("ancestral-cry");
    expect(p.description).toContain("100 Glory from Ignites");
    expect(p.description).toContain("melee martial weapon or unarmed");
    expect(p.suggestions.some((s) => s.id === "warcryCooldownRecoveryRate")).toBe(false);
    expect(p.suggestions.find((s) => s.id === "skillDuration")?.reason).toContain("eight-second Kaom embodiment");
    expect(p.exclusions.find((e) => e.id === "warcryCooldownRecoveryRate")?.reason).toContain("no base cooldown");
  });
  it("retains Bear/Talisman and Armoured Shield requirements without presenting a form or equipment validator", () => {
    expect(preset("ferocious-roar").description).toContain("Standalone Bear-form Warcry requiring a Talisman");
    expect(preset("ferocious-roar").description).toContain("Socketed human-form Warcry replacement is outside this focus");
    expect(preset("ferocious-roar").suggestions.find((s) => s.id === "warcrySpeed")?.reason).toContain("0.8-second Warcry base despite the skill's 1.1-second source");
    expect(preset("fortifying-cry").description).toContain("requiring an Armoured Shield");
    expect(preset("fortifying-cry").exclusions.find((e) => e.id === "physicalDamage")?.reason).toContain("Player Armour is not local shield Armour");
    expect(preset("seismic-cry").description).toContain("secondary-damage hit");
    expect(preset("seismic-cry").description).toContain("Primed/Heavy Stun");
    expect(preset("infernal-cry").description).toContain("Combust on death");
  });
});

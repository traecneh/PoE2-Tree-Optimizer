import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, scorePassiveNode } from "./passivePreferences";
import { addSkillPresetPreferences, getSkillPreferencePreset } from "./skillPreferencePresets";
import { normalizeSkillSupportIds, reviewedSkillSupports } from "./skillSupportPreferences";
import type { TreeNode } from "./types";

const ids = ["contagion", "bonestorm", "bone-cage", "despair", "vulnerability", "hexblast", "unearth", "detonate-dead", "dark-effigy"];
const hitIds = ["bonestorm", "bone-cage", "hexblast", "unearth", "dark-effigy"];
const preset = (id: string) => getSkillPreferencePreset(id)!;
const node = (...stats: string[]): TreeNode => ({ id: "test", stats, flags: {}, position: { x: 0, y: 0 } });
const suggestions = (id: string) => preset(id).suggestions.map((s) => s.id);

describe("chaos/physical spell and curse preset batch", () => {
  it.each(ids)("applies %s only on command, preserving manual weights, goals and point settings", (id) => {
    const current = { mode: "weighted" as const, extraPointBudget: 9, pointBudgetMode: "all-available" as const, goals: ["required"],
      preferences: [{ id: "spellDamage" as const, weight: 1 }, { id: "energyShield" as const, weight: 3 }, { id: "criticalChance" as const, weight: 2 }] };
    const selected = addSkillPresetPreferences(current, preset(id));
    expect(selected.preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    expect(selected).toHaveProperty("goals", current.goals);
    expect(selected.extraPointBudget).toBe(9);
    expect(selected.pointBudgetMode).toBe("all-available");
    expect(selected.focusSkillId).toBe(id);
    expect(suggestions(id)).not.toContain("criticalChance");
    expect(normalizePassiveOptimizationSettings({ ...selected, supportGemIds: ["efficiency-i"] })).toMatchObject({ focusSkillId: id, preferences: selected.preferences, supportGemIds: ["efficiency-i"] });
    const values = passivePreferenceValues(node("Spell Skills have 10% reduced Area of Effect", "35% increased Spell Area Damage", "30% increased Critical Hit Chance for Spells"), { focusSkillId: id });
    expect(values).toEqual({ areaOfEffect: -10, ...(hitIds.includes(id) ? { spellAreaDamage: 35, criticalChance: 30 } : {}) });
    expect(normalizeSkillSupportIds(id, ["concentrated-area"])).toEqual([]);
  });
  it.each(["despair", "vulnerability"])("keeps %s non-damaging and separate from the damage type in its tags", (id) => {
    expect(suggestions(id)).toEqual(["curseMagnitude", "curseDuration", "curseArea", "curseActivation", "castSpeed"]);
    const effects = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 5, preferences: [] }, preset(id)).preferences;
    expect(scorePassiveNode(node("100% increased Spell Damage", "100% increased Physical Damage", "100% increased Chaos Damage", "100% increased Critical Damage Bonus"), effects, { focusSkillId: id })).toBe(0);
    expect(preset(id).suggestions.find((s) => s.id === "curseActivation")?.reason).toContain("1500 ms");
    expect(normalizeSkillSupportIds(id, ["controlled-destruction", "ritualistic-curse", "focused-curse"]))
      .toEqual(["ritualistic-curse", "focused-curse"]);
  });
  it("does not turn Contagion's spread area into area damage, projectile delivery or critical hits", () => {
    expect(suggestions("contagion")).toEqual(["chaosDamage", "spellDamage", "damageOverTime", "skillDuration", "areaOfEffect", "castSpeed"]);
    expect(preset("contagion").suggestions.find((s) => s.id === "spellDamage")?.reason).toContain("explicitly applies spell damage");
    expect(preset("contagion").passiveStatScopes).toEqual(["spellAreaOfEffect"]);
    expect(normalizeSkillSupportIds("contagion", ["controlled-destruction", "swift-affliction-i", "swift-affliction-ii"]))
      .toEqual(["swift-affliction-i"]);
    expect(suggestions("contagion")).not.toContain("spellAreaDamage");
  });
  it("reviews Bonestorm's projectile delivery and explosion as separate components, without stage or Impale multipliers", () => {
    expect(preset("bonestorm").passiveStatScopes).toEqual(["spellProjectileSpeed", "spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"]);
    expect(preset("bonestorm").suggestions.find((s) => s.id === "spellAreaDamage")?.reason).toContain("travelling spike does not");
    expect(suggestions("bonestorm")).not.toContain("skillDuration");
    expect(suggestions("bonestorm")).not.toContain("attackDamage");
    expect(passivePreferenceValues(node("15% increased Projectile Speed for Spell Skills"), { focusSkillId: "bonestorm" })).toEqual({ projectileSpeed: 15 });
  });
  it("keeps player Unearth hits, totem Effusion hits and their conditional/minion components separate", () => {
    for (const id of ["unearth", "dark-effigy"]) {
      const effects = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 5, preferences: [] }, preset(id)).preferences;
      expect(scorePassiveNode(node("Minions deal 100% increased Damage", "100% increased Damage over Time", "Minions have 100% increased Attack Speed"), effects, { focusSkillId: id })).toBe(0);
      expect(suggestions(id)).not.toContain("minionDamage");
    }
    expect(preset("unearth").description).toContain("not the summoned Bone Constructs");
    expect(preset("dark-effigy").description).toContain("Requires enemy Chaos DoT debuffs");
    expect(suggestions("dark-effigy")).toContain("projectileDamage");
    expect(suggestions("dark-effigy")).not.toContain("castSpeed");
    expect(preset("dark-effigy").passiveStatScopes).not.toContain("spellProjectileSpeed");
  });
  it("keeps Detonate Dead's corpse-physical focus conservative instead of treating all corpse damage as spell-area damage", () => {
    expect(suggestions("detonate-dead")).toEqual(["physicalDamage", "fireDamage", "areaOfEffect", "castSpeed"]);
    expect(preset("detonate-dead").passiveStatScopes).toEqual(["spellAreaOfEffect", "spellHinderChance"]);
    expect(preset("detonate-dead").exclusions.find((e) => e.id === "spellAreaDamage")?.reason).toContain("separate scope review");
    const effects = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 5, preferences: [] }, preset("detonate-dead")).preferences;
    expect(scorePassiveNode(node("10% increased Physical Damage", "10% increased Fire Damage", "35% increased Spell Area Damage", "100% increased Spell Damage"), effects, { focusSkillId: "detonate-dead" })).toBe(4);
  });
  it("does not reward curse duration or magnitude as unconditional Hexblast hit damage", () => {
    const effects = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 5, preferences: [] }, preset("hexblast")).preferences;
    expect(scorePassiveNode(node("100% increased Curse Magnitudes", "100% increased Curse Duration", "100% increased Damage over Time"), effects, { focusSkillId: "hexblast" })).toBe(0);
    expect(preset("hexblast").description).toContain("Half-expired curse requirements");
    expect(reviewedSkillSupports.find((s) => s.id === "swift-affliction-i")?.skillIds).not.toContain("hexblast");
  });
});

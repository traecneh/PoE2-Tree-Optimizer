import { describe, expect, it } from "vitest";
import { remainingAttackIds } from "./remainingAttackSkills.fixtures";
import { ballistaIds } from "./ballistaSkills.fixtures";
import { normalizePassiveOptimizationSettings, passivePreferenceCatalog, type PassiveOptimizationSettings } from "./passivePreferences";
import { addSkillPresetPreferences, getSkillPreferencePreset, skillPreferencePresets } from "./skillPreferencePresets";
import { applySkillSupportPriorities, normalizeSkillSupportIds, refineSkillPreferencePreset, reviewedSkillSupports, setSkillSupport, skillSupportPriorityChanges } from "./skillSupportPreferences";

const preset = (id: string) => getSkillPreferencePreset(id)!;
const settings = (focusSkillId = "spark"): PassiveOptimizationSettings => ({
  mode: "weighted", extraPointBudget: 7, pointBudgetMode: "all-available", focusSkillId,
  preferences: [{ id: "energyShield", weight: 3 }, { id: "projectileSpeed", weight: 1 }],
});
const chaosPhysicalSkills = ["contagion", "bonestorm", "bone-cage", "despair", "vulnerability", "hexblast", "unearth", "detonate-dead", "dark-effigy"];
const chaosUtilitySupports = ["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "mobility", "rapid-casting-i", "rapid-casting-ii", "rapid-casting-iii"];
const hitSupportIds = ["considered-casting", "spell-echo", "projectile-acceleration-i", "projectile-acceleration-ii", "projectile-acceleration-iii", "brutality-i", "brutality-ii", "brutality-iii"];

describe("reviewed skill supports", () => {
  it.each(chaosPhysicalSkills)("keeps the hit-support allowlist explicit for %s", (skillId) => {
    const expected = [
      ...(["bonestorm", "bone-cage", "hexblast", "unearth", "detonate-dead"].includes(skillId) ? ["considered-casting"] : []),
      ...(["bone-cage", "despair", "vulnerability", "hexblast", "detonate-dead"].includes(skillId) ? ["spell-echo"] : []),
      ...(skillId === "bonestorm" ? ["projectile-acceleration-i", "projectile-acceleration-ii"] : []),
      ...(["bonestorm", "bone-cage", "unearth", "detonate-dead"].includes(skillId) ? ["brutality-i", "brutality-ii", "brutality-iii"] : []),
    ].sort();
    const offered = reviewedSkillSupports.filter((s) => hitSupportIds.includes(s.id) && s.skillIds.includes(skillId));
    expect(offered.map((s) => s.id).sort()).toEqual(expected);
    const current = { ...settings(skillId), goalNodeIds: ["required"] };
    for (const id of expected) {
      const selected = setSkillSupport(current, id, true);
      expect(selected).toEqual({ ...current, supportGemIds: [id] });
      expect(normalizePassiveOptimizationSettings(selected)).toMatchObject({ supportGemIds: [id], preferences: current.preferences, extraPointBudget: 7, pointBudgetMode: "all-available" });
      expect(refineSkillPreferencePreset(preset(skillId), [id]).passiveStatScopes).toEqual(preset(skillId).passiveStatScopes);
    }
    for (const id of hitSupportIds.filter((id) => !expected.includes(id))) expect(setSkillSupport(current, id, true)).toBe(current);
  });
  it.each([
    ["bonestorm", "considered-casting"], ["bone-cage", "considered-casting"], ["hexblast", "considered-casting"], ["unearth", "considered-casting"], ["detonate-dead", "considered-casting"],
    ["bone-cage", "spell-echo"], ["despair", "spell-echo"], ["vulnerability", "spell-echo"], ["hexblast", "spell-echo"], ["detonate-dead", "spell-echo"],
  ])("changes %s's cast-speed priority for %s only on explicit apply", (skillId, supportId) => {
    const current: PassiveOptimizationSettings = { ...settings(skillId), preferences: [{ id: "castSpeed", weight: 1 }, { id: "curseActivation", weight: 3 }, { id: "energyShield", weight: 3 }] };
    const selected = setSkillSupport(current, supportId, true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(skillSupportPriorityChanges(selected, preset(skillId)).map((s) => s.id)).toEqual(["castSpeed"]);
    expect(applySkillSupportPriorities(selected, preset(skillId))).toEqual({ ...selected, preferences: [{ id: "castSpeed", weight: 2 }, ...current.preferences.slice(1)] });
    expect(addSkillPresetPreferences(selected, preset(skillId)).preferences.slice(0, 3)).toEqual(current.preferences);
  });
  it.each(["brutality-i", "brutality-ii", "brutality-iii"])("removes only incompatible suggestions for %s, preserving and warning about manual weights", (supportId) => {
    for (const skillId of ["bonestorm", "bone-cage", "unearth", "detonate-dead"]) {
      const current: PassiveOptimizationSettings = { ...settings(skillId), preferences: [{ id: "fireDamage", weight: 1 }, { id: "chaosDamage", weight: 2 }, { id: "firePenetration", weight: 3 }, { id: "energyShield", weight: 3 }] };
      const selected = setSkillSupport(current, supportId, true);
      expect(selected.preferences).toEqual(current.preferences);
      const refined = refineSkillPreferencePreset(preset(skillId), [supportId]);
      expect(refined.suggestions.map((s) => s.id)).not.toContain("fireDamage");
      expect(refined.suggestions.map((s) => s.id)).toContain("physicalDamage");
      expect(refined.exclusions.map((s) => s.id)).toEqual(expect.arrayContaining(["fireDamage", "coldDamage", "lightningDamage", "elementalDamage", "chaosDamage", "firePenetration", "coldPenetration", "lightningPenetration", "elementalPenetration"]));
      expect(refined.exclusions.find((e) => e.id === "fireDamage")?.reason).toContain("still affects routing");
      expect(skillSupportPriorityChanges(selected, preset(skillId))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(skillId))).toEqual(selected);
      expect(addSkillPresetPreferences({ ...selected, preferences: [] }, preset(skillId)).preferences.some((p) => p.id === "fireDamage")).toBe(false);
      expect(setSkillSupport(selected, supportId, false).preferences).toEqual(current.preferences);
    }
    expect(preset("detonate-dead").suggestions.map((s) => s.id)).toContain("fireDamage");
  });
  it("replaces Brutality tiers without stacking penalties and keeps unsupported or held scopes out", () => {
    const current = settings("detonate-dead");
    const selected = setSkillSupport(setSkillSupport(setSkillSupport(current, "brutality-i", true), "brutality-ii", true), "brutality-iii", true);
    expect(selected).toEqual({ ...current, supportGemIds: ["brutality-iii"] });
    expect(normalizeSkillSupportIds("detonate-dead", ["brutality-i", "brutality-iii"])).toEqual(["brutality-i"]);
    expect(refineSkillPreferencePreset(preset("detonate-dead"), selected.supportGemIds).exclusions.filter((s) => s.id === "fireDamage")).toHaveLength(1);
    expect(normalizeSkillSupportIds("bonestorm", ["projectile-acceleration-i", "projectile-acceleration-ii", "projectile-acceleration-iii"])).toEqual(["projectile-acceleration-i"]);
    expect(reviewedSkillSupports.find((s) => s.id === "projectile-acceleration-iii")?.summary).toContain("Spell-only conversion remains unverified");
    expect(reviewedSkillSupports.find((s) => s.id === "brutality-iii")?.summary).toContain("not unconditional penetration");
    expect(normalizeSkillSupportIds("fireball", ["concentrated-area"])).toEqual([]);
  });
  it.each(chaosPhysicalSkills)("offers only reviewed utility/casting components for %s without changing weights, scopes or goals", (skillId) => {
    const hasReviewedDuration = ["contagion", "bone-cage", "despair", "vulnerability"].includes(skillId);
    const expected = chaosUtilitySupports.filter((id) => !id.startsWith("prolonged-duration") || hasReviewedDuration);
    const offered = reviewedSkillSupports.filter((s) => chaosUtilitySupports.includes(s.id) && s.skillIds.includes(skillId));
    expect(offered.map((s) => s.id)).toEqual(expected);
    const current = { ...settings(skillId), goalNodeIds: ["required-goal"], preferences: [
      { id: "castSpeed" as const, weight: 1 }, { id: "skillDuration" as const, weight: 3 },
      { id: "areaOfEffect" as const, weight: 2 }, { id: "energyShield" as const, weight: 3 },
    ] };
    for (const supportId of expected) {
      const selected = setSkillSupport(current, supportId, true);
      expect(selected, supportId).toEqual({ ...current, supportGemIds: [supportId] });
      expect(normalizePassiveOptimizationSettings(selected)).toMatchObject({ preferences: current.preferences, supportGemIds: [supportId], extraPointBudget: 7, pointBudgetMode: "all-available" });
      expect(refineSkillPreferencePreset(preset(skillId), selected.supportGemIds), supportId).toEqual(preset(skillId));
      expect(skillSupportPriorityChanges(selected, preset(skillId))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(skillId))).toEqual(selected);
      expect(setSkillSupport(selected, supportId, false)).toEqual({ ...current, supportGemIds: [] });
    }
  });
  it.each(["bonestorm", "hexblast", "unearth", "detonate-dead", "dark-effigy"])("does not offer Prolonged Duration for the unreviewed %s duration component", (id) => {
    const current = settings(id);
    expect(normalizeSkillSupportIds(id, ["prolonged-duration-i", "prolonged-duration-ii"])).toEqual([]);
    expect(setSkillSupport(current, "prolonged-duration-i", true)).toBe(current);
  });
  it.each([["magnified-area-i", "magnified-area-ii"], ["prolonged-duration-i", "prolonged-duration-ii"], ["rapid-casting-i", "rapid-casting-iii"]])
    ("replaces %s on Contagion without stacking tiers or affecting manual priorities", (first, last) => {
      const current = settings("contagion");
      const selected = setSkillSupport(setSkillSupport(current, first, true), last, true);
      expect(selected).toEqual({ ...current, supportGemIds: [last] });
      expect(normalizeSkillSupportIds("contagion", [first, last])).toEqual([first]);
    });
  it("documents proxy, uptime and conditional support boundaries without adding Arcane Tempo duplicates", () => {
    const support = (id: string) => reviewedSkillSupports.find((s) => s.id === id)!;
    expect(support("magnified-area-i").summary).toContain("Vile Effusion rather than Dark Effigy deployment");
    expect(support("prolonged-duration-i").summary).toContain("not higher damage per second, curse magnitude or faster activation");
    expect(support("mobility").summary).toContain("deployment movement, not Vile Effusion firing");
    expect(support("rapid-casting-i").summary).toContain("DoT ticks, curse activation, channel stages");
    expect(support("rapid-casting-iii").summary).toContain("Conditional");
    expect(reviewedSkillSupports.filter((s) => s.family === "RapidCasting").map((s) => s.id)).toEqual(["rapid-casting-i", "rapid-casting-ii", "rapid-casting-iii"]);
    expect(normalizeSkillSupportIds("fireball", ["concentrated-area"])).toEqual([]);
  });
  it.each(["despair", "vulnerability"])("refines %s activation only on explicit support-priority apply", (id) => {
    const current: PassiveOptimizationSettings = { ...settings(id), preferences: [{ id: "curseMagnitude", weight: 1 }, { id: "curseActivation", weight: 1 }, { id: "energyShield", weight: 3 }] };
    const selected = setSkillSupport(current, "ritualistic-curse", true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(applySkillSupportPriorities(selected, preset(id)).preferences).toEqual([{ id: "curseMagnitude", weight: 1 }, { id: "curseActivation", weight: 2 }, { id: "energyShield", weight: 3 }]);
    expect(setSkillSupport(current, "focused-curse", true).preferences).toEqual(current.preferences);
    expect(setSkillSupport(current, "controlled-destruction", true)).toBe(current);
  });
  it("keeps Contagion's duration tradeoff distinct from hit-only supports and preserves manual priorities", () => {
    const current: PassiveOptimizationSettings = { ...settings("contagion"), preferences: [{ id: "skillDuration", weight: 1 }, { id: "chaosDamage", weight: 2 }] };
    const selected = setSkillSupport(current, "swift-affliction-i", true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(applySkillSupportPriorities(selected, preset("contagion")).preferences).toEqual([{ id: "skillDuration", weight: 3 }, { id: "chaosDamage", weight: 2 }]);
    expect(setSkillSupport(current, "controlled-destruction", true)).toBe(current);
    expect(normalizeSkillSupportIds("dark-effigy", ["controlled-destruction", "efficiency-i"])).toEqual(["efficiency-i"]);
  });
  it.each(["bonestorm", "bone-cage", "hexblast", "unearth", "detonate-dead"])("retains %s manual crit while warning about Controlled Destruction", (id) => {
    const current: PassiveOptimizationSettings = { ...settings(id), preferences: [{ id: "criticalChance", weight: 3 }, { id: "criticalDamageBonus", weight: 2 }] };
    const selected = setSkillSupport(current, "controlled-destruction", true);
    expect(selected.preferences).toEqual(current.preferences);
    expect(refineSkillPreferencePreset(preset(id), selected.supportGemIds).passiveStatScopes).not.toContain("spellCriticalChance");
    expect(refineSkillPreferencePreset(preset(id), selected.supportGemIds).exclusions.map((e) => e.id)).toEqual(expect.arrayContaining(["criticalChance", "criticalDamageBonus"]));
  });
  it.each(["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility"])
    ("keeps %s context-only without changing manual priorities, scopes or budgets", (supportId) => {
      const skillId = supportId.startsWith("prolonged") ? "firestorm" : "frostbolt";
      const current: PassiveOptimizationSettings = { ...settings(skillId), preferences: [{ id: "areaOfEffect", weight: 3 },
        { id: "skillDuration", weight: 1 }, { id: "skillMovementPenaltyReduction", weight: 2 }, { id: "manaRegenerationRate", weight: 3 }] };
      const selected = setSkillSupport(current, supportId, true);
      expect(selected.supportGemIds).toEqual([supportId]);
      expect(selected.preferences).toEqual(current.preferences);
      expect(skillSupportPriorityChanges(selected, preset(skillId))).toEqual([]);
      expect(applySkillSupportPriorities(selected, preset(skillId))).toEqual(selected);
      expect(refineSkillPreferencePreset(preset(skillId), selected.supportGemIds)).toEqual(preset(skillId));
      expect(normalizePassiveOptimizationSettings(selected)).toEqual(selected);
    });
  it.each([["magnified-area-i", "magnified-area-ii", "frostbolt"], ["prolonged-duration-i", "prolonged-duration-ii", "firestorm"],
    ["efficiency-i", "efficiency-ii", "comet"]])("replaces the %s tier and retains only the first family member on load", (first, second, skillId) => {
    const current = settings(skillId);
    const selected = setSkillSupport(setSkillSupport(current, first, true), second, true);
    expect(selected.supportGemIds).toEqual([second]);
    expect(selected.preferences).toEqual(current.preferences);
    expect(normalizeSkillSupportIds(skillId, [first, second])).toEqual([first]);
    expect(normalizeSkillSupportIds(skillId, [second, first])).toEqual([second]);
  });
  it("keeps utility-support eligibility explicit rather than accepting every legal duration or area tag", () => {
    const ids = (skillId: string) => reviewedSkillSupports.filter((s) => s.skillIds.includes(skillId)).map((s) => s.id);
    for (const skillId of ["ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "frost-bomb", "flameblast", "frost-wall"]) {
      expect(ids(skillId)).toEqual(expect.arrayContaining(["magnified-area-i", "magnified-area-ii", "efficiency-i", "efficiency-ii"]));
    }
    for (const skillId of ["arc", "eye-of-winter"]) expect(ids(skillId)).not.toContain("magnified-area-i");
    for (const skillId of ["ball-lightning", "ice-nova", "frost-bomb", "frostbolt"]) expect(ids(skillId)).not.toContain("prolonged-duration-i");
    expect(ids("comet")).not.toContain("mobility");
    expect(ids("firestorm")).toEqual(expect.arrayContaining(["prolonged-duration-i", "prolonged-duration-ii", "mobility"]));
    expect(ids("frost-wall")).toContain("prolonged-duration-ii");
    expect(normalizeSkillSupportIds("fireball", ["concentrated-area", "magnified-area-i"])).toEqual([]);
  });
  it.each(["arc", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "eye-of-winter", "frost-bomb", "flameblast", "frost-wall"])
    ("keeps %s supports explicitly reviewed, including crit prohibition and manual priority preservation", (id) => {
      const current: PassiveOptimizationSettings = { ...settings(id), preferences: [{ id: "castSpeed", weight: 1 }, { id: "criticalChance", weight: 3 }, { id: "criticalDamageBonus", weight: 2 }] };
      const supported = setSkillSupport(current, "controlled-destruction", true);
      expect(supported.preferences).toEqual(current.preferences);
      expect(refineSkillPreferencePreset(preset(id), supported.supportGemIds).passiveStatScopes).not.toContain("spellCriticalChance");
      expect(refineSkillPreferencePreset(preset(id), supported.supportGemIds).exclusions.map((e) => e.id)).toEqual(expect.arrayContaining(["criticalChance", "criticalDamageBonus"]));
      const considered = setSkillSupport(current, "considered-casting", true);
      expect(considered.preferences).toEqual(current.preferences);
      expect(applySkillSupportPriorities(considered, preset(id)).preferences).toEqual([{ id: "castSpeed", weight: 2 }, ...current.preferences.slice(1)]);
      const allowed = reviewedSkillSupports.filter((s) => s.skillIds.includes(id)).map((s) => s.id);
      expect(allowed).toEqual(expect.arrayContaining(["controlled-destruction", "considered-casting", "rapid-casting-i", "rapid-casting-ii", "rapid-casting-iii"]));
      expect(allowed.includes("spell-echo")).toBe(["ice-nova", "comet", "firestorm", "frost-bomb", "frost-wall"].includes(id));
      expect(allowed.includes("projectile-acceleration-iii")).toBe(id === "frostbolt");
      expect(allowed).not.toContain("concentrated-area");
      expect(setSkillSupport(current, "concentrated-area", true)).toBe(current);
    });
  it.each([
    ["rapid-casting-i", "rapid-casting-ii", "rapid-casting-iii"],
    ["projectile-acceleration-i", "projectile-acceleration-ii", "projectile-acceleration-iii"],
  ])("replaces %s tiers without rewriting weights or stacking a family", (first, second, third) => {
    const current = settings("frostbolt");
    const next = setSkillSupport(setSkillSupport(setSkillSupport(current, first, true), second, true), third, true);
    expect(next.supportGemIds).toEqual([third]);
    expect(next.preferences).toEqual(current.preferences);
    expect(normalizeSkillSupportIds("frostbolt", [first, second, third])).toEqual([first]);
  });
  it("keeps conditional Rapid Casting and early acceleration tiers context-only, without adding native magnitudes to scores", () => {
    for (const supportId of ["rapid-casting-i", "rapid-casting-ii", "rapid-casting-iii", "projectile-acceleration-i", "projectile-acceleration-ii"]) {
      const current = setSkillSupport(settings("frostbolt"), supportId, true);
      expect(skillSupportPriorityChanges(current, preset("frostbolt"))).toEqual([]);
      expect(refineSkillPreferencePreset(preset("frostbolt"), current.supportGemIds).suggestions).toEqual(preset("frostbolt").suggestions);
    }
    expect(reviewedSkillSupports.find((s) => s.id === "rapid-casting-iii")?.summary).toContain("Conditional");
    expect(reviewedSkillSupports.find((s) => s.id === "projectile-acceleration-ii")?.summary).toContain("already pierces");
    expect(reviewedSkillSupports.find((s) => s.id === "spell-echo")?.summary).toContain("Echo-only area");
    expect(normalizeSkillSupportIds("fireball", ["concentrated-area"])).toEqual([]);
  });
  it("retains Fireball explosion damage and area scopes without multiplying their priorities by supports", () => {
    const current: PassiveOptimizationSettings = { ...settings("fireball"), preferences: [{ id: "spellAreaDamage", weight: 2 }, { id: "areaOfEffect", weight: 3 }] };
    const selected = setSkillSupport(setSkillSupport(current, "controlled-destruction", true), "projectile-acceleration-iii", true);
    const refined = refineSkillPreferencePreset(preset("fireball"), selected.supportGemIds);
    expect(refined.passiveStatScopes).toEqual(expect.arrayContaining(["spellAreaDamage", "spellAreaOfEffect"]));
    expect(refined.passiveStatScopes).not.toContain("spellCriticalChance");
    expect(selected.preferences).toEqual(current.preferences);
    const applied = applySkillSupportPriorities(selected, preset("fireball"));
    expect(applied.preferences).toContainEqual({ id: "spellAreaDamage", weight: 2 });
    expect(applied.preferences).toContainEqual({ id: "areaOfEffect", weight: 3 });
  });
  it("reviews projectile and attack supports for the bow/spear batch without promoting targeting area to area damage", () => {
    for (const id of ["ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear"]) {
      const supported = reviewedSkillSupports.filter((entry) => entry.skillIds.includes(id)).map((entry) => entry.id);
      expect(supported).toEqual(expect.arrayContaining(["projectile-acceleration-iii", "rapid-attacks-i", "rapid-attacks-ii"]));
      expect(supported).not.toContain("heavy-swing");
      expect(supported).not.toContain("fist-of-war-i");
      expect(supported.includes("concentrated-area")).toBe(["rain-of-arrows", "explosive-spear"].includes(id));
    }
  });
  it.each(["ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear"])("only explicitly applies projectile-speed priorities for %s, keeping manual defenses and budgets", (id) => {
    const initial = addSkillPresetPreferences(settings(id), preset(id));
    const selected = setSkillSupport(initial, "projectile-acceleration-iii", true);
    expect(selected.preferences).toEqual(initial.preferences);
    expect(selected.preferences).toContainEqual({ id: "projectileSpeed", weight: 1 });
    const applied = applySkillSupportPriorities(selected, preset(id));
    expect(applied.preferences).toContainEqual({ id: "projectileSpeed", weight: 3 });
    expect(applied.preferences).toContainEqual({ id: "energyShield", weight: 3 });
    expect(applied.extraPointBudget).toBe(initial.extraPointBudget);
    expect(applied.pointBudgetMode).toBe(initial.pointBudgetMode);
    const rapid = setSkillSupport(setSkillSupport(applied, "rapid-attacks-i", true), "rapid-attacks-ii", true);
    expect(rapid.supportGemIds).toEqual(["projectile-acceleration-iii", "rapid-attacks-ii"]);
    expect(rapid.preferences).toEqual(applied.preferences);
    expect(setSkillSupport(rapid, "projectile-acceleration-iii", false).preferences).toEqual(applied.preferences);
  });
  it("keeps melee support scopes reviewed rather than allowing all legal tag combinations", () => {
    const ids = (skill: string) => reviewedSkillSupports.filter((entry) => !commonSupport45Ids.has(entry.id) && !deployment45Ids.has(entry.id) && !proxyDebuff45Ids.has(entry.id) && !elemental50Ids.has(entry.id) && !physical50Ids.has(entry.id) && !resource50Ids.has(entry.id) && !specialist50Ids.has(entry.id) && entry.skillIds.includes(skill)).map((entry) => entry.id);
    expect(ids("ice-strike")).toEqual(["rapid-attacks-i", "rapid-attacks-ii", "concentrated-area", "close-combat-ii"]);
    expect(ids("tempest-flurry")).not.toContain("heavy-swing");
    expect(ids("boneshatter")).toContain("heavy-swing");
    expect(ids("boneshatter")).not.toContain("fist-of-war-i");
    expect(ids("rolling-slam")).toContain("fist-of-war-i");
    expect(ids("spark")).not.toContain("concentrated-area");
  });
  it("replaces a Rapid Attacks tier without adding the gem's own speed to passive preferences", () => {
    const current = { ...settings("ice-strike"), supportGemIds: ["rapid-attacks-i"] };
    const next = setSkillSupport(current, "rapid-attacks-ii", true);
    expect(next.supportGemIds).toEqual(["rapid-attacks-ii"]);
    expect(next.preferences).toEqual(current.preferences);
    expect(refineSkillPreferencePreset(preset("ice-strike"), next.supportGemIds).suggestions).toEqual(preset("ice-strike").suggestions);
  });
  it("applies melee coverage and speed tradeoff priorities only on explicit request", () => {
    const current = addSkillPresetPreferences({ mode: "weighted", focusSkillId: "rolling-slam", extraPointBudget: 7,
      preferences: [{ id: "energyShield", weight: 3 }] }, preset("rolling-slam"));
    const selected = { ...current, supportGemIds: ["heavy-swing", "concentrated-area", "fist-of-war-i"] };
    expect(selected.preferences).toContainEqual({ id: "attackSpeed", weight: 1 });
    const applied = applySkillSupportPriorities(selected, preset("rolling-slam"));
    expect(applied.preferences).toContainEqual({ id: "attackSpeed", weight: 2 });
    expect(applied.preferences).toContainEqual({ id: "areaOfEffect", weight: 2 });
    expect(applied.preferences).toContainEqual({ id: "energyShield", weight: 3 });
    expect(applied.extraPointBudget).toBe(7);
    expect(applied.mode).toBe("weighted");
    expect(refineSkillPreferencePreset(preset("rolling-slam"), ["fist-of-war-i"]).suggestions).toEqual(preset("rolling-slam").suggestions);
  });
  it("does not turn proximity or periodic boosts into unconditional score multipliers", () => {
    for (const id of ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam"]) {
      expect(refineSkillPreferencePreset(preset(id), ["close-combat-ii"]).suggestions).toEqual(preset(id).suggestions);
    }
    expect(normalizeSkillSupportIds("rolling-slam", ["rapid-attacks-ii", "rapid-attacks-i", "fist-of-war-i"]))
      .toEqual(["rapid-attacks-ii", "fist-of-war-i"]);
  });
  it("contains uniquely identified supports, bounded priorities and only reviewed skill/effect IDs", () => {
    expect(new Set(reviewedSkillSupports.map((entry) => entry.id)).size).toBe(reviewedSkillSupports.length);
    expect(new Set(reviewedSkillSupports.map((entry) => entry.effectId)).size).toBe(reviewedSkillSupports.length);
    for (const support of reviewedSkillSupports) {
      expect(support.sourceUrl).toMatch(/^https:\/\/github.com\/PathOfBuildingCommunity\/PathOfBuilding-PoE2\/blob\/dev\/src\/Data\/Skills\/sup_\w+.lua#L\d+/);
      expect(support.skillIds.length).toBeGreaterThan(0);
      for (const id of support.skillIds) expect(getSkillPreferencePreset(id)).toBeDefined();
      for (const entry of [...support.priorities, ...Object.values(support.skillOverrides ?? {}).flatMap((override) => override.priorities ?? [])]) {
        expect(passivePreferenceCatalog.some((effect) => effect.id === entry.id)).toBe(true);
        expect([1, 2, 3]).toContain(entry.weight);
        expect(entry.reason).not.toBe("");
      }
    }
    expect(skillPreferencePresets.filter((skill) => !reviewedSkillSupports.some((support) => support.skillIds.includes(skill.id))).map((skill) => skill.id))
      .toEqual(["galvanic-shards", "explosive-shot", "explosive-grenade", "rake", "maul", "shred", ...remainingAttackIds, ...ballistaIds, "mortar-cannon",
          "ember-fusillade", "living-bomb", "incinerate", "flame-wall", "orb-of-storms", "lightning-conduit", "lightning-warp", "thunderstorm", "ghost-dance", "time-of-need", "herald-of-plague", "archmage", "overwhelming-presence", "alchemists-boon", "attrition", "berserk", "charge-regulation", "combat-frenzy", "eternal-rage", "mana-remnants", "siphon-elements", "trinity", "barrier-invocation", "blink", "cast-on-critical", "cast-on-dodge", "cast-on-elemental-ailment", "cast-on-minion-death", "elemental-invocation", "feral-invocation", "reapers-invocation", "sacrifice"].filter(id=>common45SupportIdsFor(id).length===0 && deployment45SupportIdsFor(id).length===0 && proxyDebuff45SupportIdsFor(id).length===0 && elemental50SupportIdsFor(id).length===0 && physical50SupportIdsFor(id).length===0 && resource50SupportIdsFor(id).length===0 && specialist50SupportIdsFor(id).length===0));
  });
  it("drops unknown, malformed, duplicate and out-of-scope supports and retains one tier per family", () => {
    expect(normalizeSkillSupportIds("spark", ["controlled-destruction", "controlled-destruction", "swift-affliction-ii", "__proto__", null, {}])).toEqual(["controlled-destruction"]);
    expect(normalizeSkillSupportIds("essence-drain", ["swift-affliction-i", "swift-affliction-ii"])).toEqual(["swift-affliction-i"]);
    for (const value of [null, {}, "controlled-destruction", 5]) expect(normalizeSkillSupportIds("spark", value)).toEqual([]);
    for (const skill of [undefined, null, {}, "unknown"]) expect(normalizeSkillSupportIds(skill, ["controlled-destruction"])).toEqual([]);
  });
  it("selecting another tier replaces the old one without changing weights or budgets", () => {
    const current = { ...settings("essence-drain"), supportGemIds: ["swift-affliction-i"] };
    const next = setSkillSupport(current, "swift-affliction-ii", true);
    expect(next).toEqual({ ...current, supportGemIds: ["swift-affliction-ii"] });
    expect(setSkillSupport(next, "swift-affliction-ii", false)).toEqual({ ...current, supportGemIds: [] });
    expect(current.supportGemIds).toEqual(["swift-affliction-i"]);
    expect(setSkillSupport(current, "feeding-frenzy-ii", true)).toBe(current);
    expect(setSkillSupport(current, "unknown", true)).toBe(current);
  });
  it("refines projectile speed for reviewed hit builds, not Essence Drain's debuff", () => {
    for (const id of ["spark", "fireball", "lightning-arrow"]) {
      expect(refineSkillPreferencePreset(preset(id), ["projectile-acceleration-iii"]).suggestions)
        .toContainEqual(expect.objectContaining({ id: "projectileSpeed", weight: 3 }));
    }
    expect(refineSkillPreferencePreset(preset("essence-drain"), ["projectile-acceleration-iii"])).toBe(preset("essence-drain"));
    expect(preset("spark").suggestions.find((entry) => entry.id === "projectileSpeed")?.weight).toBe(1);
  });
  it("warns about prevented critical hits without rewriting manual preferences or applying gem damage multipliers", () => {
    const current = { ...settings(), supportGemIds: ["controlled-destruction"], preferences: [{ id: "criticalChance" as const, weight: 3 }] };
    const refined = refineSkillPreferencePreset(preset("spark"), current.supportGemIds);
    expect(refined.exclusions.find((entry) => entry.id === "criticalChance")?.reason).toContain("prevents");
    expect(refined.suggestions).toEqual(preset("spark").suggestions);
    expect(refined.passiveStatScopes).not.toContain("spellCriticalChance");
    expect(refined.passiveStatScopes).toContain("spellProjectileSpeed");
    expect(preset("spark").passiveStatScopes).toContain("spellCriticalChance");
    expect(applySkillSupportPriorities(current, preset("spark"))).toEqual(current);
    expect(addSkillPresetPreferences(current, preset("spark")).preferences).toContainEqual({ id: "criticalChance", weight: 3 });
  });
  it("separates curse delay from magnitude and preserves combined Focused/Ritualistic supports", () => {
    const ids = ["ritualistic-curse", "focused-curse"];
    expect(normalizeSkillSupportIds("enfeeble", ids)).toEqual(ids);
    const refined = refineSkillPreferencePreset(preset("enfeeble"), ids);
    expect(refined.suggestions.find((entry) => entry.id === "curseActivation")?.weight).toBe(2);
    expect(refined.suggestions.find((entry) => entry.id === "curseMagnitude")?.weight).toBe(3);
    expect(refineSkillPreferencePreset(preset("enfeeble"), ["focused-curse"]).suggestions).toEqual(preset("enfeeble").suggestions);
  });
  it("reviews the duration tradeoff only for the DoT preset and minion survival only for minions", () => {
    expect(refineSkillPreferencePreset(preset("essence-drain"), ["swift-affliction-ii"]).suggestions)
      .toContainEqual(expect.objectContaining({ id: "skillDuration", weight: 3 }));
    const minion = refineSkillPreferencePreset(preset("skeletal-arsonist"), ["feeding-frenzy-ii"]);
    expect(minion.suggestions).toContainEqual(expect.objectContaining({ id: "minionLife", weight: 2 }));
    expect(minion.suggestions.map((entry) => entry.id)).not.toContain("life");
    expect(minion.suggestions.map((entry) => entry.id)).not.toContain("fireDamage");
    expect(refineSkillPreferencePreset(preset("spark"), ["swift-affliction-ii", "feeding-frenzy-ii"])).toBe(preset("spark"));
  });
  it("adds support-refined suggestions but does not overwrite an existing manual weight", () => {
    const current = { ...settings(), supportGemIds: ["projectile-acceleration-iii"] };
    const merged = addSkillPresetPreferences(current, preset("spark"));
    expect(merged.preferences).toContainEqual({ id: "projectileSpeed", weight: 1 });
    const fresh = addSkillPresetPreferences({ ...current, preferences: [] }, preset("spark"));
    expect(fresh.preferences).toContainEqual({ id: "projectileSpeed", weight: 3 });
    expect(merged.extraPointBudget).toBe(7);
    expect(merged.pointBudgetMode).toBe("all-available");
  });
  it("only explicitly applies the listed support priorities, immutably and idempotently", () => {
    const current = { ...settings(), supportGemIds: ["projectile-acceleration-iii"] };
    Object.freeze(current.preferences[0]);
    Object.freeze(current.preferences[1]);
    Object.freeze(current.preferences);
    Object.freeze(current);
    expect(skillSupportPriorityChanges(current, preset("spark")).map((entry) => entry.id)).toEqual(["projectileSpeed"]);
    const applied = applySkillSupportPriorities(current, preset("spark"));
    expect(applied).toEqual({ ...current, preferences: [{ id: "energyShield", weight: 3 }, { id: "projectileSpeed", weight: 3 }] });
    expect(current.preferences[1].weight).toBe(1);
    expect(skillSupportPriorityChanges(applied, preset("spark"))).toEqual([]);
    expect(applySkillSupportPriorities(applied, preset("spark"))).toEqual(applied);
    const disabled = setSkillSupport(applied, "projectile-acceleration-iii", false);
    expect(disabled.preferences).toEqual(applied.preferences);
  });
  it("normalizes save data without auto-applying support priorities or changing legacy shapes", () => {
    const current = { ...settings("essence-drain"), supportGemIds: ["swift-affliction-ii", "swift-affliction-i", "controlled-destruction", "bad"] };
    expect(normalizePassiveOptimizationSettings(current)).toEqual({ ...current, supportGemIds: ["swift-affliction-ii"] });
    expect(normalizePassiveOptimizationSettings({ ...current, focusSkillId: "bad" })).not.toHaveProperty("supportGemIds");
    expect(normalizePassiveOptimizationSettings(settings())).not.toHaveProperty("supportGemIds");
    expect(normalizePassiveOptimizationSettings({ ...settings(), supportGemIds: [] })).not.toHaveProperty("supportGemIds");
  });
});
import { commonSupport45Ids,common45SupportIdsFor } from "./commonSupportBatch.fixtures";
import { deployment45Ids,deployment45SupportIdsFor } from "./deploymentSupportBatch.fixtures";
import { proxyDebuff45Ids,proxyDebuff45SupportIdsFor } from "./proxyDebuffSupportBatch.fixtures";
import { elemental50Ids,elemental50SupportIdsFor } from "./elementalSupportBatch.fixtures";
import { physical50Ids,physical50SupportIdsFor } from "./physicalSupportBatch.fixtures";
import { resource50Ids,resource50SupportIdsFor } from "./resourceSupportBatch.fixtures";
import { specialist50Ids,specialist50SupportIdsFor } from "./specialistSupportBatch.fixtures";

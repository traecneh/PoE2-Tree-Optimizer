import { resourceChargeFixtures } from "./resourceChargeSkills.fixtures";
import { utilityTriggerFixtures } from "./utilityTriggerSkills.fixtures";
import { persistentOffenceFixtures } from "./persistentOffenceSkills.fixtures";
import { defensiveBuffFixtures } from "./defensiveBuffSkills.fixtures";
import { proxyFixtures } from "./proxySkills.fixtures";
import { spellUtilityFixtures, spellUtilityHitIds, spellUtilityAreaIds, spellUtilityCoverageIds } from "./spellUtilitySkills.fixtures";
import { attackClosureFixtures, attackClosureIds, attackClosureSpearIds, attackClosureMeleeIds } from "./attackClosureSkills.fixtures";
import { maceShieldFixtures, maceShieldIds, maceShieldMeleeIds, maceShieldWeaponIds } from "./maceShieldSkills.fixtures";
import { monkPrimaryFixtures, monkPrimaryIds, monkPrimaryMeleeIds } from "./monkPrimarySkills.fixtures";
import { spearPrimaryFixtures, spearPrimaryIds, spearPrimaryMeleeIds } from "./spearPrimarySkills.fixtures";
import { bowPrimaryFixtures, bowPrimaryHitIds, bowPrimaryIds, bowPrimaryCoverageIds } from "./bowPrimarySkills.fixtures";
import { quarterstaffPrimaryFixtures, quarterstaffPrimaryIds, quarterstaffMeleeIds } from "./quarterstaffPrimarySkills.fixtures";
import { describe, expect, it } from "vitest";
import { normalizePassiveOptimizationSettings, passivePreferenceValues, type PassiveOptimizationSettings, type PassivePreferenceId } from "./passivePreferences";
import { normalizeSkillSupportIds } from "./skillSupportPreferences";
import { addSkillPresetPreferences, getSkillPreferencePreset, reviewedWeaponPassiveScopes, skillPreferencePresets } from "./skillPreferencePresets";
import type { SkillPreferencePreset } from "./skillPreferencePresets";
import { remainingAttackSkillFixtures, remainingAttackIds, remainingAreaIds, remainingMeleeIds } from "./remainingAttackSkills.fixtures";
import { ballistaIds, ballistaSkillFixtures } from "./ballistaSkills.fixtures";
import { fireLightningIds, fireLightningHitIds, fireLightningAreaDamageIds, fireLightningSkillFixtures } from "./fireLightningSkills.fixtures";
import { plantSpellIds, plantSkillFixtures } from "./plantSkills.fixtures";
import { plantBowIds, plantBowHitIds, plantBowSkillFixtures } from "./plantBowSkills.fixtures";
import { poisonBowIds, poisonBowSkillFixtures } from "./poisonBowSkills.fixtures";
import { macePrimaryFixtures, macePrimaryIds, macePrimaryGemIds } from "./macePrimarySkills.fixtures";

function preset(id: string): SkillPreferencePreset {
  const result = getSkillPreferencePreset(id);
  expect(result).toBeDefined();
  return result!;
}

const suggestionIds = (id: string) => preset(id).suggestions.map((suggestion) => suggestion.id);
const exclusionIds = (id: string) => preset(id).exclusions.map((exclusion) => exclusion.id);
const spellIds = ["arc", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "eye-of-winter", "frost-bomb", "flameblast", "frost-wall"];
const areaSpellIds = ["ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "frost-bomb", "flameblast", "frost-wall"];
const chaosPhysicalIds = ["contagion", "bonestorm", "bone-cage", "despair", "vulnerability", "hexblast", "unearth", "detonate-dead", "dark-effigy"];
const chaosPhysicalHitIds = ["bonestorm", "bone-cage", "hexblast", "unearth", "dark-effigy"];
const crossbowIds = ["galvanic-shards", "explosive-shot", "explosive-grenade"];
const addedAttackIds = [...crossbowIds, "rake", "maul", "shred", ...remainingAttackIds, ...ballistaIds, ...macePrimaryIds, ...quarterstaffPrimaryIds, ...bowPrimaryHitIds, ...spearPrimaryIds, ...monkPrimaryIds, ...maceShieldIds, ...attackClosureIds];
const addedAreaIds = ["explosive-shot", "explosive-grenade", "rake", "maul", "shred", ...remainingAreaIds, ...ballistaIds, ...macePrimaryIds, ...quarterstaffPrimaryIds, ...bowPrimaryCoverageIds, ...spearPrimaryIds, ...monkPrimaryIds, ...maceShieldIds, ...attackClosureIds];

describe("reviewed base-skill preference catalog", () => {
  it.each(spellIds)("adds the reviewed %s hit preset without overwriting manual priorities, budgets or goals", (id) => {
    const current = { mode: "weighted" as const, extraPointBudget: 9, pointBudgetMode: "all-available" as const, goals: ["required"],
      preferences: [{ id: "spellDamage" as const, weight: 1 }, { id: "energyShield" as const, weight: 3 }, { id: "criticalChance" as const, weight: 2 }] };
    const result = addSkillPresetPreferences(current, preset(id));
    expect(result.preferences.slice(0, current.preferences.length)).toEqual(current.preferences);
    expect(result.focusSkillId).toBe(id);
    expect(result).toHaveProperty("goals", current.goals);
    expect(result.extraPointBudget).toBe(9);
    expect(result.pointBudgetMode).toBe("all-available");
    expect(result.mode).toBe("weighted");
    expect(suggestionIds(id)).not.toContain("criticalChance");
    expect(exclusionIds(id)).toEqual(expect.arrayContaining(["attackDamage", "attackSpeed"]));
    expect(preset(id).passiveStatScopes).toContain("spellCriticalChance");
    const passive = { id: "crit", stats: ["30% increased Critical Hit Chance for Spells", "15% reduced Critical Hit Chance for Spells"], flags: {}, position: { x: 0, y: 0 } };
    expect(passivePreferenceValues(passive, { focusSkillId: id })).toEqual({ criticalChance: 15 });
    expect(normalizePassiveOptimizationSettings({ ...result, supportGemIds: ["controlled-destruction", "concentrated-area"] })).toMatchObject({ focusSkillId: id, preferences: result.preferences });
    expect(normalizeSkillSupportIds(id, ["controlled-destruction", "concentrated-area", "projectile-acceleration-iii"]))
      .toEqual(id === "frostbolt" ? ["controlled-destruction", "projectile-acceleration-iii"] : ["controlled-destruction"]);
  });
  it.each(areaSpellIds)("scopes %s to reviewed area components and retains Roil/Ruin reductions independently", (id) => {
    const passive = { id: "area", stats: ["Spell Skills have 10% reduced Area of Effect", "35% increased Spell Area Damage"], flags: {}, position: { x: 0, y: 0 } };
    expect(passivePreferenceValues(passive, { focusSkillId: id })).toEqual({ areaOfEffect: -10, spellAreaDamage: 35 });
    expect(preset(id).suggestions.find((s) => s.id === "spellAreaDamage")).toMatchObject({ weight: 1 });
  });
  it("does not infer Arc or Eye area damage or faster projectile benefit from a projectile tag", () => {
    for (const id of ["arc", "eye-of-winter"]) {
      expect(suggestionIds(id)).toContain("projectileDamage");
      expect(suggestionIds(id)).not.toContain("areaOfEffect");
      expect(preset(id).passiveStatScopes).not.toContain("spellAreaDamage");
      expect(preset(id).passiveStatScopes).not.toContain("spellProjectileSpeed");
    }
    expect(exclusionIds("ball-lightning")).toContain("projectileSpeed");
    expect(preset("ball-lightning").passiveStatScopes).not.toContain("spellProjectileSpeed");
    expect(preset("ball-lightning").suggestions.find((s) => s.id === "castSpeed")?.reason).toContain("200 ms");
  });
  it("reviews Frostbolt's lifetime and explosion separately from its missing Duration tag and travelling hit", () => {
    expect(preset("frostbolt").tags).not.toContain("duration");
    expect(suggestionIds("frostbolt")).toContain("skillDuration");
    expect(preset("frostbolt").suggestions.find((s) => s.id === "spellAreaDamage")?.reason).toContain("travelling projectile does not");
    const passive = { id: "speed", stats: ["15% increased Projectile Speed for Spell Skills"], flags: {}, position: { x: 0, y: 0 } };
    expect(passivePreferenceValues(passive, { focusSkillId: "frostbolt" })).toEqual({ projectileSpeed: 15 });
    for (const id of ["arc", "ball-lightning", "eye-of-winter"]) expect(passivePreferenceValues(passive, { focusSkillId: id })).toEqual({});
  });
  it("does not treat Firestorm's falling bolts or a Frostbolt-origin Ice Nova as damaging projectiles", () => {
    for (const id of ["firestorm", "ice-nova", "comet", "frost-bomb", "flameblast", "frost-wall"]) {
      expect(suggestionIds(id)).not.toContain("projectileDamage");
      expect(exclusionIds(id)).toContain("projectileDamage");
    }
    expect(suggestionIds("firestorm")).toContain("skillDuration");
    for (const id of ["ice-nova", "ball-lightning", "frost-bomb", "flameblast", "frost-wall"]) {
      expect(suggestionIds(id)).not.toContain("skillDuration");
      expect(exclusionIds(id)).toContain("skillDuration");
    }
    expect(suggestionIds("comet")).not.toContain("fireDamage");
    expect(suggestionIds("firestorm")).not.toContain("coldDamage");
    expect(suggestionIds("firestorm")).not.toContain("lightningDamage");
  });
  it("records timing and conditional component limits without granting unreviewed support compatibility", () => {
    expect(preset("comet").suggestions.find((s) => s.id === "castSpeed")?.reason).toContain("1000 ms");
    expect(preset("frost-bomb").description).toContain("non-damaging exposure pulses");
    expect(preset("flameblast").description).toContain("maximum-stage");
    expect(preset("frost-wall").description).toContain("early-destruction penalties");
    expect(normalizeSkillSupportIds("fireball", ["concentrated-area"])).toEqual([]);
  });
  it("offers explosion-only Spell Area Damage for Fireball on explicit suggestion apply, preserving manual priorities", () => {
    expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes("spellAreaDamage")).map((entry) => entry.id)).toEqual(["fireball", ...areaSpellIds, ...chaosPhysicalHitIds, ...fireLightningAreaDamageIds, ...spellUtilityAreaIds, ...plantSpellIds]);
    expect(skillPreferencePresets.filter((entry) => suggestionIds(entry.id).includes("spellAreaDamage")).map((entry) => entry.id)).toEqual(["fireball", ...areaSpellIds, ...chaosPhysicalHitIds, ...fireLightningAreaDamageIds, ...spellUtilityAreaIds, ...plantSpellIds]);
    const suggestion = preset("fireball").suggestions.find((entry) => entry.id === "spellAreaDamage");
    expect(suggestion).toMatchObject({ weight: 1 });
    expect(suggestion?.reason).toContain("explosion only");
    expect(suggestion?.reason).toContain("not the travelling projectile, firebolts or ignite");
    const old: PassiveOptimizationSettings = { mode: "weighted", focusSkillId: "fireball", extraPointBudget: 7, preferences: [{ id: "areaOfEffect", weight: 3 }] };
    expect(old.preferences.some((entry) => entry.id === "spellAreaDamage")).toBe(false);
    expect(addSkillPresetPreferences(old, preset("fireball")).preferences).toContainEqual({ id: "spellAreaDamage", weight: 1 });
    const custom = { ...old, preferences: [...old.preferences, { id: "spellAreaDamage" as const, weight: 2 }] };
    const result = addSkillPresetPreferences(custom, preset("fireball"));
    expect(result.preferences.filter((entry) => entry.id === "spellAreaDamage")).toEqual([{ id: "spellAreaDamage", weight: 2 }]);
    expect(result.preferences).toContainEqual({ id: "areaOfEffect", weight: 3 });
    expect(result.extraPointBudget).toBe(7);
  });
  it("reviews explicit spell-area components without changing Fireball's suggested priorities", () => {
    expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes("spellAreaOfEffect")).map((entry) => entry.id)).toEqual(["fireball", ...areaSpellIds, ...chaosPhysicalIds, ...fireLightningIds, ...spellUtilityCoverageIds, ...plantSpellIds]);
    expect(preset("fireball").suggestions.find((entry) => entry.id === "areaOfEffect")).toMatchObject({ weight: 1 });
    const settings: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 7, preferences: [{ id: "areaOfEffect", weight: 3 }] };
    const result = addSkillPresetPreferences(settings, preset("fireball"));
    expect(result.preferences.filter((entry) => entry.id === "areaOfEffect")).toEqual([{ id: "areaOfEffect", weight: 3 }]);
    expect(result.extraPointBudget).toBe(7);
  });
  it("reviews hit crit and attack coverage separately from tags and DoT delivery", () => {
    expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes("spellCriticalChance")).map((entry) => entry.id)).toEqual(["spark", "fireball", ...spellIds, ...chaosPhysicalHitIds, ...fireLightningHitIds, ...spellUtilityHitIds, "arctic-armour", ...plantSpellIds]);
    expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes("attackCriticalChance")).map((entry) => entry.id))
      .toEqual(["lightning-arrow", "ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear", ...addedAttackIds, "shockwave-totem", "herald-of-ice", "herald-of-thunder", "toxic-domain", ...plantBowHitIds]);
    expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes("attackAreaOfEffect")).map((entry) => entry.id))
      .toEqual(["lightning-arrow", "ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "rain-of-arrows", "lightning-spear", "explosive-spear", ...addedAreaIds, "shockwave-totem", "herald-of-ice", "herald-of-thunder", "toxic-domain", ...plantBowIds, ...poisonBowIds]);
    expect(suggestionIds("lightning-arrow")).not.toContain("areaOfEffect");
    for (const id of ["spark", "fireball", "lightning-arrow"]) expect(suggestionIds(id)).not.toContain("criticalChance");
  });
  it("enables spell-projectile passive matching only for explicitly reviewed scopes", () => {
    expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes("spellProjectileSpeed")).map((entry) => entry.id))
      .toEqual(["spark", "fireball", "essence-drain", "frostbolt", "bonestorm", "ember-fusillade", "frost-darts"]);
    expect(preset("essence-drain").suggestions.map((entry) => entry.id)).not.toContain("projectileSpeed");
  });
  it("retains stable IDs and the native gem catalog's display names and keys", () => {
    expect(skillPreferencePresets.map(({ id, name, gemId }) => ({ id, name, gemId }))).toEqual([
      { id: "enfeeble", name: "Enfeeble", gemId: "Metadata/Items/Gems/SkillGemEnfeeble" },
      { id: "spark", name: "Spark", gemId: "Metadata/Items/Gems/SkillGemSpark" },
      { id: "fireball", name: "Fireball", gemId: "Metadata/Items/Gems/SkillGemFireball" },
      { id: "lightning-arrow", name: "Lightning Arrow", gemId: "Metadata/Items/Gems/SkillGemLightningArrow" },
      { id: "essence-drain", name: "Essence Drain", gemId: "Metadata/Items/Gems/SkillGemEssenceDrain" },
      { id: "skeletal-arsonist", name: "Skeletal Arsonist", gemId: "Metadata/Items/Gems/SkillGemSkeletalArsonist" },
      { id: "ice-strike", name: "Ice Strike", gemId: "Metadata/Items/Gems/SkillGemIceStrike" },
      { id: "tempest-flurry", name: "Tempest Flurry", gemId: "Metadata/Items/Gems/SkillGemTempestFlurry" },
      { id: "boneshatter", name: "Boneshatter", gemId: "Metadata/Items/Gems/SkillGemBoneshatter" },
      { id: "rolling-slam", name: "Rolling Slam", gemId: "Metadata/Items/Gems/SkillGemRollingSlam" },
      { id: "ice-shot", name: "Ice Shot", gemId: "Metadata/Items/Gems/SkillGemIceShot" },
      { id: "rain-of-arrows", name: "Rain of Arrows", gemId: "Metadata/Items/Gems/SkillGemRainOfArrows" },
      { id: "lightning-spear", name: "Lightning Spear", gemId: "Metadata/Items/Gems/SkillGemLightningSpear" },
      { id: "explosive-spear", name: "Explosive Spear", gemId: "Metadata/Items/Gems/SkillGemExplosiveSpear" },
      { id: "arc", name: "Arc", gemId: "Metadata/Items/Gems/SkillGemArc" },
      { id: "ball-lightning", name: "Ball Lightning", gemId: "Metadata/Items/Gems/SkillGemBallLightning" },
      { id: "frostbolt", name: "Frostbolt", gemId: "Metadata/Items/Gems/SkillGemFrostBolt" },
      { id: "ice-nova", name: "Ice Nova", gemId: "Metadata/Items/Gems/SkillGemIceNova" },
      { id: "comet", name: "Comet", gemId: "Metadata/Items/Gems/SkillGemComet" },
      { id: "firestorm", name: "Firestorm", gemId: "Metadata/Items/Gems/SkillGemFirestorm" },
      { id: "eye-of-winter", name: "Eye of Winter", gemId: "Metadata/Items/Gems/SkillGemEyeOfWinter" },
      { id: "frost-bomb", name: "Frost Bomb", gemId: "Metadata/Items/Gems/SkillGemFrostBomb" },
      { id: "flameblast", name: "Flameblast", gemId: "Metadata/Items/Gems/SkillGemFlameblast" },
      { id: "frost-wall", name: "Frost Wall", gemId: "Metadata/Items/Gems/SkillGemFrostWall" },
      { id: "contagion", name: "Contagion", gemId: "Metadata/Items/Gems/SkillGemContagion" },
      { id: "bonestorm", name: "Bonestorm", gemId: "Metadata/Items/Gems/SkillGemBonestorm" },
      { id: "bone-cage", name: "Bone Cage", gemId: "Metadata/Items/Gems/SkillGemBoneCage" },
      { id: "despair", name: "Despair", gemId: "Metadata/Items/Gems/SkillGemDespair" },
      { id: "vulnerability", name: "Vulnerability", gemId: "Metadata/Items/Gems/SkillGemVulnerability" },
      { id: "hexblast", name: "Hexblast", gemId: "Metadata/Items/Gems/SkillGemHexblast" },
      { id: "unearth", name: "Unearth", gemId: "Metadata/Items/Gems/SkillGemUnearth" },
      { id: "detonate-dead", name: "Detonate Dead", gemId: "Metadata/Items/Gems/SkillGemDetonateDead" },
      { id: "dark-effigy", name: "Dark Effigy", gemId: "Metadata/Items/Gems/SkillGemDarkEffigy" },
      { id: "skeletal-sniper", name: "Skeletal Sniper", gemId: "Metadata/Items/Gems/SkillGemSkeletalSniper" },
      { id: "skeletal-frost-mage", name: "Skeletal Frost Mage", gemId: "Metadata/Items/Gems/SkillGemSkeletalFrostMage" },
      { id: "skeletal-storm-mage", name: "Skeletal Storm Mage", gemId: "Metadata/Items/Gems/SkillGemSkeletalStormMage" },
      { id: "skeletal-brute", name: "Skeletal Brute", gemId: "Metadata/Items/Gems/SkillGemSkeletalBrute" },
      { id: "skeletal-cleric", name: "Skeletal Cleric", gemId: "Metadata/Items/Gems/SkillGemSkeletalCleric" },
      { id: "skeletal-reaver", name: "Skeletal Reaver", gemId: "Metadata/Items/Gems/SkillGemSkeletalReaver" },
      { id: "bone-offering", name: "Bone Offering", gemId: "Metadata/Items/Gems/SkillGemBoneOffering" },
      { id: "pain-offering", name: "Pain Offering", gemId: "Metadata/Items/Gems/SkillGemPainOffering" },
      { id: "snipers-mark", name: "Sniper's Mark", gemId: "Metadata/Items/Gems/SkillGemSnipersMark" },
      { id: "bloodhounds-mark", name: "Bloodhound's Mark", gemId: "Metadata/Items/Gems/SkillGemBloodhoundsMark" },
      { id: "freezing-mark", name: "Freezing Mark", gemId: "Metadata/Items/Gems/SkillGemFreezingMark" },
      { id: "voltaic-mark", name: "Voltaic Mark", gemId: "Metadata/Items/Gems/SkillGemVoltaicMark" },
      { id: "infernal-cry", name: "Infernal Cry", gemId: "Metadata/Items/Gems/SkillGemInfernallCry" },
      { id: "seismic-cry", name: "Seismic Cry", gemId: "Metadata/Items/Gems/SkillGemSeismicCry" },
      { id: "ancestral-cry", name: "Ancestral Cry", gemId: "Metadata/Items/Gems/SkillGemAncestralCry" },
      { id: "fortifying-cry", name: "Fortifying Cry", gemId: "Metadata/Items/Gems/SkillGemFortifyingCry" },
      { id: "ferocious-roar", name: "Ferocious Roar", gemId: "Metadata/Items/Gems/SkillGemFerociousRoar" },
      { id: "galvanic-shards", name: "Galvanic Shards", gemId: "Metadata/Items/Gems/SkillGemGalvanicShards" },
      { id: "explosive-shot", name: "Explosive Shot", gemId: "Metadata/Items/Gems/SkillGemExplosiveShot" },
      { id: "explosive-grenade", name: "Explosive Grenade", gemId: "Metadata/Items/Gems/SkillGemExplosiveGrenade" },
      { id: "rake", name: "Rake", gemId: "Metadata/Items/Gems/SkillGemRake" },
      { id: "maul", name: "Maul", gemId: "Metadata/Items/Gems/SkillGemBearMaul" },
      { id: "shred", name: "Shred", gemId: "Metadata/Items/Gems/SkillGemWolfShred" },
      ...remainingAttackSkillFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...ballistaSkillFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      { id: "mortar-cannon", name: "Mortar Cannon", gemId: "Metadata/Items/Gems/SkillGemMortarCannon" },
      ...fireLightningSkillFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...macePrimaryFixtures.map(({ id, name }) => ({ id, name, gemId: macePrimaryGemIds[id] })),
      ...quarterstaffPrimaryFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...bowPrimaryFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...spearPrimaryFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...monkPrimaryFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...maceShieldFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...attackClosureFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...spellUtilityFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...proxyFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...defensiveBuffFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...persistentOffenceFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...resourceChargeFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...utilityTriggerFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...plantSkillFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...plantBowSkillFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
      ...poisonBowSkillFixtures.map(({ id, name, gemId }) => ({ id, name, gemId })),
    ]);
  });

  it("has unique IDs, tags and preferences with scoped explanations and valid heuristic weights", () => {
    expect(new Set(skillPreferencePresets.map(({ id }) => id)).size).toBe(skillPreferencePresets.length);
    expect(new Set(skillPreferencePresets.map(({ gemId }) => gemId)).size).toBe(skillPreferencePresets.length);
    const defensiveOrUtility: readonly PassivePreferenceId[] = [
      "life", "energyShield", "armour", "evasion", "mana", "attributes", "movementSpeed", "jewelSockets", "minionLife",
    ];
    for (const entry of skillPreferencePresets) {
      expect(entry.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.description.trim().split(/\s+/).length).toBeLessThanOrEqual(40);
      expect(entry.sourceUrl).toMatch(/^https:\/\/github\.com\/PathOfBuildingCommunity\/PathOfBuilding-PoE2\/blob\/dev\/src\/Data\/Skills\/\w+\.lua#L\d+/);
      expect(new Set(entry.tags).size).toBe(entry.tags.length);
      expect(entry.tags.length).toBeGreaterThan(0);
      expect(new Set(entry.suggestions.map(({ id }) => id)).size).toBe(entry.suggestions.length);
      expect(new Set(entry.exclusions.map(({ id }) => id)).size).toBe(entry.exclusions.length);
      for (const suggestion of entry.suggestions) {
        expect([1, 2, 3]).toContain(suggestion.weight);
        expect(suggestion.reason.length).toBeGreaterThan(0);
        expect(entry.exclusions.some(({ id }) => id === suggestion.id)).toBe(false);
      }
      for (const exclusion of entry.exclusions) {
        expect(exclusion.reason.length).toBeGreaterThan(0);
        expect(defensiveOrUtility).not.toContain(exclusion.id);
      }
    }
  });

  it("copies actual gem tags without inventing damage-over-time or spell tags", () => {
    expect(skillPreferencePresets.map(({ id, tags }) => [id, tags])).toEqual([
      ["enfeeble", ["intelligence", "grants_active_skill", "spell", "area", "duration", "curse", "repeatable"]],
      ["spark", ["intelligence", "grants_active_skill", "spell", "projectile", "lightning", "duration", "repeatable"]],
      ["fireball", ["intelligence", "grants_active_skill", "spell", "area", "projectile", "fire", "repeatable"]],
      ["lightning-arrow", ["dexterity", "grants_active_skill", "attack", "area", "projectile", "lightning", "chaining", "repeatable"]],
      ["essence-drain", ["intelligence", "grants_active_skill", "spell", "projectile", "chaos", "duration", "repeatable"]],
      ["skeletal-arsonist", ["intelligence", "grants_active_skill", "minion", "persistent", "fire", "detonator"]],
      ["ice-strike", ["dexterity", "intelligence", "grants_active_skill", "attack", "area", "melee", "strike", "cold"]],
      ["tempest-flurry", ["dexterity", "intelligence", "grants_active_skill", "attack", "area", "melee", "strike", "lightning"]],
      ["boneshatter", ["strength", "grants_active_skill", "attack", "area", "melee", "strike"]],
      ["rolling-slam", ["strength", "grants_active_skill", "attack", "area", "melee", "slam"]],
      ["ice-shot", ["dexterity", "grants_active_skill", "attack", "projectile", "cold", "repeatable"]],
      ["rain-of-arrows", ["dexterity", "grants_active_skill", "attack", "area", "projectile", "sustained"]],
      ["lightning-spear", ["dexterity", "grants_active_skill", "attack", "area", "projectile", "lightning", "repeatable"]],
      ["explosive-spear", ["dexterity", "grants_active_skill", "attack", "area", "projectile", "fire", "duration", "detonator", "repeatable"]],
      ["arc", ["intelligence", "grants_active_skill", "spell", "projectile", "lightning", "chaining", "repeatable"]],
      ["ball-lightning", ["intelligence", "grants_active_skill", "spell", "area", "projectile", "lightning", "duration", "chaining", "sustained", "repeatable"]],
      ["frostbolt", ["intelligence", "grants_active_skill", "spell", "area", "projectile", "cold", "repeatable"]],
      ["ice-nova", ["intelligence", "grants_active_skill", "spell", "area", "cold", "duration", "nova", "repeatable"]],
      ["comet", ["intelligence", "grants_active_skill", "spell", "area", "cold", "repeatable"]],
      ["firestorm", ["intelligence", "grants_active_skill", "spell", "area", "fire", "duration", "storm", "sustained", "repeatable"]],
      ["eye-of-winter", ["intelligence", "grants_active_skill", "spell", "projectile", "cold"]],
      ["frost-bomb", ["intelligence", "grants_active_skill", "spell", "area", "cold", "duration", "orb", "remnant"]],
      ["flameblast", ["intelligence", "grants_active_skill", "spell", "area", "fire", "channelling", "stages", "nova"]],
      ["frost-wall", ["intelligence", "grants_active_skill", "spell", "area", "cold", "duration"]],
      ["contagion", ["area", "chaos", "duration", "grants_active_skill", "intelligence", "repeatable", "spell"]],
      ["bonestorm", ["area", "channelling", "grants_active_skill", "intelligence", "physical", "projectile", "spell"]],
      ["bone-cage", ["area", "duration", "grants_active_skill", "intelligence", "nova", "physical", "repeatable", "spell"]],
      ["despair", ["area", "chaos", "curse", "duration", "grants_active_skill", "intelligence", "repeatable", "spell"]],
      ["vulnerability", ["area", "curse", "duration", "grants_active_skill", "intelligence", "physical", "repeatable", "spell"]],
      ["hexblast", ["area", "chaos", "grants_active_skill", "intelligence", "payoff", "repeatable", "spell"]],
      ["unearth", ["area", "duration", "grants_active_skill", "intelligence", "minion", "physical", "repeatable", "spell"]],
      ["detonate-dead", ["area", "detonator", "fire", "grants_active_skill", "intelligence", "physical", "repeatable", "spell"]],
      ["dark-effigy", ["area", "chaos", "duration", "grants_active_skill", "intelligence", "projectile", "spell", "totem"]],
      ["skeletal-sniper", ["chaos", "fire", "grants_active_skill", "intelligence", "minion", "persistent", "physical"]],
      ["skeletal-frost-mage", ["cold", "grants_active_skill", "intelligence", "minion", "persistent"]],
      ["skeletal-storm-mage", ["grants_active_skill", "intelligence", "lightning", "minion", "persistent"]],
      ["skeletal-brute", ["grants_active_skill", "intelligence", "minion", "payoff", "persistent", "physical", "warcry"]],
      ["skeletal-cleric", ["grants_active_skill", "intelligence", "minion", "persistent"]],
      ["skeletal-reaver", ["grants_active_skill", "intelligence", "minion", "persistent", "physical"]],
      ["bone-offering", ["area", "buff", "duration", "grants_active_skill", "intelligence", "minion", "physical"]],
      ["pain-offering", ["area", "buff", "duration", "grants_active_skill", "intelligence", "minion"]],
      ["snipers-mark", ["dexterity", "duration", "grants_active_skill", "mark"]],
      ["bloodhounds-mark", ["area", "attack", "dexterity", "duration", "grants_active_skill", "mark", "payoff", "physical", "trigger"]],
      ["freezing-mark", ["buff", "cold", "dexterity", "duration", "grants_active_skill", "intelligence", "mark"]],
      ["voltaic-mark", ["buff", "dexterity", "duration", "grants_active_skill", "lightning", "mark"]],
      ["infernal-cry", ["area", "duration", "fire", "grants_active_skill", "nova", "strength", "trigger", "warcry"]],
      ["seismic-cry", ["area", "grants_active_skill", "nova", "physical", "strength", "warcry"]],
      ["ancestral-cry", ["area", "attack", "buff", "conditional", "duration", "fire", "grants_active_skill", "melee", "nova", "projectile", "slam", "strength", "trigger", "warcry"]],
      ["fortifying-cry", ["area", "attack", "duration", "grants_active_skill", "melee", "nova", "physical", "strength", "trigger", "warcry"]],
      ["ferocious-roar", ["area", "bear", "grants_active_skill", "intelligence", "meta", "nova", "shapeshift", "strength", "warcry"]],
      ["galvanic-shards", ["ammunition", "attack", "chaining", "dexterity", "grants_active_skill", "lightning", "merging", "projectile", "strength"]],
      ["explosive-shot", ["ammunition", "area", "attack", "detonator", "dexterity", "fire", "grants_active_skill", "projectile", "strength"]],
      ["explosive-grenade", ["area", "attack", "detonator", "dexterity", "fire", "grants_active_skill", "grenade", "projectile", "strength"]],
      ["rake", ["area", "attack", "dexterity", "grants_active_skill", "melee", "physical", "strike"]],
      ["maul", ["area", "attack", "bear", "grants_active_skill", "melee", "shapeshift", "strike"]],
      ["shred", ["area", "attack", "cold", "grants_active_skill", "melee", "payoff", "projectile", "shapeshift", "strike", "trigger", "wolf"]],
      ...remainingAttackSkillFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...ballistaSkillFixtures.map(({ id, tags }) => [id, [...tags]]),
      ["mortar-cannon", ["dexterity", "duration", "grants_active_skill", "grenade", "meta", "strength", "totem"]],
      ...fireLightningSkillFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...macePrimaryFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...quarterstaffPrimaryFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...bowPrimaryFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...spearPrimaryFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...monkPrimaryFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...maceShieldFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...attackClosureFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...spellUtilityFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...proxyFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...defensiveBuffFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...persistentOffenceFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...resourceChargeFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...utilityTriggerFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...plantSkillFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...plantBowSkillFixtures.map(({ id, tags }) => [id, [...tags]]),
      ...poisonBowSkillFixtures.map(({ id, tags }) => [id, [...tags]]),
    ]);
  });

  it("maps non-damaging Enfeeble to outgoing curses and distinguishes self-cast and activation", () => {
    expect(suggestionIds("enfeeble")).toEqual(["curseMagnitude", "curseDuration", "curseArea", "curseActivation", "castSpeed"]);
    expect(exclusionIds("enfeeble")).toEqual(expect.arrayContaining(["spellDamage", "criticalChance"]));
    expect(preset("enfeeble").suggestions.find(({ id }) => id === "curseMagnitude")?.reason).toContain("effect of curses on you is a different stat");
    expect(preset("enfeeble").suggestions.find(({ id }) => id === "castSpeed")?.reason).toContain("does not increase trigger frequency");
  });
  it.each(["ice-strike", "tempest-flurry"])("keeps %s a converted attack focus, not a spell or projectile", (id) => {
    expect(suggestionIds(id)).toEqual(["attackDamage", id === "ice-strike" ? "coldDamage" : "lightningDamage", "elementalDamage", "attackSpeed", "areaOfEffect"]);
    expect(suggestionIds(id)).not.toContain("physicalDamage");
    expect(exclusionIds(id)).toEqual(["spellDamage", "castSpeed", "projectileDamage", "projectileSpeed"]);
    expect(preset(id).passiveStatScopes).toEqual(["attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage", "attackElementalDamage", "meleeDamage", "quarterstaffAttackDamage", "quarterstaffAttackSpeed", "quarterstaffCriticalChance", "quarterstaffAccuracy", "quarterstaffCriticalDamageBonus", "meleeStunBuildup", "quarterstaffStunBuildup", ...(id === "ice-strike" ? ["quarterstaffFreezeBuildup"] : []), "twoHandedWeaponDamage", "twoHandedMeleeAccuracy", "attackBlindChance", "attackMaimChance", "attackIncisionChance"]);
  });
  it("scopes Boneshatter to physical hits and conditional shockwave coverage", () => {
    expect(suggestionIds("boneshatter")).toEqual(["attackDamage", "physicalDamage", "attackSpeed", "areaOfEffect"]);
    expect(preset("boneshatter").description).toContain("Primed for Stun");
    expect(preset("boneshatter").suggestions.find((entry) => entry.id === "attackSpeed")?.reason).toContain("does not prime");
  });
  it.each(["ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear"])("keeps %s a hit-focused projectile attack without inventing spell or DoT scaling", (id) => {
    expect(suggestionIds(id)).toEqual(expect.arrayContaining(["attackDamage", "projectileDamage", "attackSpeed", "projectileSpeed"]));
    for (const unsupported of ["spellDamage", "castSpeed", "damageOverTime", "skillDuration", "criticalChance"]) {
      expect(suggestionIds(id)).not.toContain(unsupported);
    }
    expect(exclusionIds(id)).toEqual(expect.arrayContaining(["spellDamage", "castSpeed"]));
  });
  it("does not infer area from Ice Shot's cone or area damage from Lightning Spear's targeting radius", () => {
    expect(preset("ice-shot").passiveStatScopes).toEqual(["attackCriticalChance", "attackCriticalDamageBonus", "attackElementalDamage", "bowAttackDamage", "bowAttackSpeed", "bowAccuracy", "bowCriticalDamageBonus", "twoHandedWeaponDamage", "attackBlindChance", "attackMaimChance", "attackIncisionChance"]);
    expect(exclusionIds("ice-shot")).toContain("areaOfEffect");
    expect(suggestionIds("lightning-spear")).not.toContain("areaOfEffect");
    expect(preset("lightning-spear").description).toContain("targeting area is not area damage");
  });
  it("keeps sustained rain and detonation timing separate from throwing or attack speed", () => {
    expect(suggestionIds("rain-of-arrows")).toContain("physicalDamage");
    expect(preset("rain-of-arrows").suggestions.find((entry) => entry.id === "attackSpeed")?.weight).toBe(1);
    expect(preset("rain-of-arrows").suggestions.find((entry) => entry.id === "areaOfEffect")?.reason).toContain("hit concentration");
    expect(suggestionIds("explosive-spear")).toContain("fireDamage");
    expect(exclusionIds("explosive-spear")).toContain("skillDuration");
    expect(preset("explosive-spear").suggestions.find((entry) => entry.id === "attackSpeed")?.reason).toContain("2500 ms");
  });
  it("explicitly reviews weapon damage and speed scopes without inferring them from tags", () => {
    for (const scope of ["bowAttackDamage", "bowAttackSpeed"] as const) {
      expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes(scope)).map((entry) => entry.id))
        .toEqual(["lightning-arrow", "ice-shot", "rain-of-arrows", ...(scope === "bowAttackSpeed" ? bowPrimaryIds : bowPrimaryHitIds), "escape-shot", ...(scope === "bowAttackSpeed" ? plantBowIds : plantBowHitIds), ...poisonBowIds]);
    }
    for (const scope of ["spearAttackDamage", "spearAttackSpeed"] as const) {
      expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes(scope)).map((entry) => entry.id))
        .toEqual(["lightning-spear", "explosive-spear", "rake", ...spearPrimaryIds, ...attackClosureSpearIds]);
    }
    for (const scope of ["quarterstaffAttackDamage", "quarterstaffAttackSpeed"] as const) {
      expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes(scope)).map((entry) => entry.id))
        .toEqual(["ice-strike", "tempest-flurry", ...quarterstaffPrimaryIds, ...monkPrimaryIds]);
    }
    for (const scope of ["maceAttackDamage", "maceAttackSpeed"] as const) {
      expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes(scope)).map((entry) => entry.id))
        .toEqual(["boneshatter", "rolling-slam", ...macePrimaryIds, ...maceShieldWeaponIds]);
    }
    expect(reviewedWeaponPassiveScopes.map((entry) => entry.wording)).toEqual(["bows", "spears", "quarterstaves", "maces", "crossbows"]);
    for (const entry of skillPreferencePresets) {
      expect(reviewedWeaponPassiveScopes.filter((weapon) => entry.passiveStatScopes?.includes(weapon.damage) || entry.passiveStatScopes?.includes(weapon.speed)).length)
        .toBeLessThanOrEqual(1);
    }
  });
  it("opts only reviewed melee attack components into Melee Damage matching", () => {
    expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes("meleeDamage")).map((entry) => entry.id))
      .toEqual(["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "rake", "maul", "shred", ...remainingMeleeIds, ...macePrimaryIds, ...quarterstaffMeleeIds, ...spearPrimaryMeleeIds, ...monkPrimaryMeleeIds, ...maceShieldMeleeIds, ...attackClosureMeleeIds, "shockwave-totem"]);
  });
  it("reviews weapon crit only for the quarterstaff and spear hit focuses", () => {
    expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes("quarterstaffCriticalChance")).map((entry) => entry.id))
      .toEqual(["ice-strike", "tempest-flurry", ...quarterstaffPrimaryIds, ...monkPrimaryIds]);
    expect(skillPreferencePresets.filter((entry) => entry.passiveStatScopes?.includes("spearCriticalChance")).map((entry) => entry.id))
      .toEqual(["lightning-spear", "explosive-spear", "rake", ...spearPrimaryIds, ...attackClosureSpearIds]);
    expect(reviewedWeaponPassiveScopes.filter((entry) => entry.criticalChance).map((entry) => entry.wording))
      .toEqual(["spears", "quarterstaves", "crossbows"]);
  });
  it.each(["ice-strike", "tempest-flurry", "lightning-spear", "explosive-spear"])("does not automatically add Critical Hit Chance for %s", (id) => {
    const result = addSkillPresetPreferences({ mode: "weighted", extraPointBudget: 7, preferences: [{ id: "energyShield", weight: 3 }] }, preset(id));
    expect(result.preferences.some((entry) => entry.id === "criticalChance")).toBe(false);
    const manual = addSkillPresetPreferences({ ...result, preferences: [...result.preferences, { id: "criticalChance", weight: 2 }] }, preset(id));
    expect(manual.preferences.filter((entry) => entry.id === "criticalChance")).toEqual([{ id: "criticalChance", weight: 2 }]);
    expect(manual.preferences).toContainEqual({ id: "energyShield", weight: 3 });
    expect(manual.extraPointBudget).toBe(7);
  });
  it("keeps Rolling Slam's speed priority conservative because of its fixed added time", () => {
    expect(suggestionIds("rolling-slam")).toEqual(["attackDamage", "physicalDamage", "areaOfEffect", "attackSpeed"]);
    expect(preset("rolling-slam").suggestions.find((entry) => entry.id === "attackSpeed")).toMatchObject({ weight: 1 });
    expect(preset("rolling-slam").suggestions.find((entry) => entry.id === "attackSpeed")?.reason).toContain("1000 ms");
  });

  it("maps base Spark and Fireball to their damaging spell projectiles without assuming infusions", () => {
    expect(suggestionIds("spark")).toEqual([
      "spellDamage", "lightningDamage", "elementalDamage", "projectileDamage", "castSpeed", "projectileSpeed", "skillDuration",
    ]);
    expect(suggestionIds("fireball")).toEqual(["spellDamage", "spellAreaDamage", "fireDamage", "elementalDamage", "projectileDamage", "castSpeed", "areaOfEffect"]);
    expect(suggestionIds("spark")).not.toContain("coldDamage");
    expect(suggestionIds("fireball")).not.toContain("damageOverTime");
    expect(preset("fireball").suggestions.find(({ id }) => id === "areaOfEffect")?.reason).toContain("rather than increasing its damage per hit");
  });

  it("treats Lightning Arrow's lightning beams as bow attacks, not spells", () => {
    expect(suggestionIds("lightning-arrow")).toEqual([
      "attackDamage", "lightningDamage", "elementalDamage", "attackSpeed", "projectileDamage", "projectileSpeed",
    ]);
    expect(exclusionIds("lightning-arrow")).toEqual(["spellDamage", "castSpeed"]);
  });

  it("uses Essence Drain's explicit spell-to-DoT scaling without promoting its delivery hit", () => {
    expect(suggestionIds("essence-drain")).toEqual(["chaosDamage", "spellDamage", "skillDuration"]);
    expect(exclusionIds("essence-drain")).toEqual(expect.arrayContaining(["projectileDamage", "criticalChance"]));
    expect(preset("essence-drain").suggestions.find(({ id }) => id === "spellDamage")?.reason).toContain("spell_damage_modifiers_apply_to_skill_dot");
    expect(suggestionIds("essence-drain")).not.toContain("damageOverTime");
  });

  it("selects minion attack speed for Arsonist's native bomb instead of player or minion cast speed", () => {
    expect(suggestionIds("skeletal-arsonist")).toEqual(["minionDamage", "minionAttackSpeed", "minionLife"]);
    expect(exclusionIds("skeletal-arsonist")).toEqual(expect.arrayContaining([
      "fireDamage", "spellDamage", "attackDamage", "attackSpeed", "castSpeed", "minionCastSpeed",
    ]));
    expect(suggestionIds("skeletal-arsonist")).not.toContain("minionSpeed");
  });

  it("only looks up exact stable string IDs, returning undefined for unknown or hostile input", () => {
    for (const entry of skillPreferencePresets) expect(getSkillPreferencePreset(entry.id)).toBe(entry);
    for (const unknown of [undefined, null, false, 0, [], {}, "", "Spark", "SPARK", " spark ", "unknown", "__proto__", "constructor", "toString"]) {
      expect(getSkillPreferencePreset(unknown)).toBeUndefined();
    }
    expect(getSkillPreferencePreset({ toString: () => { throw new Error("must not coerce"); } })).toBeUndefined();
  });
});

describe("addSkillPresetPreferences", () => {
  it.each(["shortest", "weighted"] as const)("immutably appends missing suggestions while preserving %s settings and existing priorities", (mode) => {
    const settings: PassiveOptimizationSettings = {
      mode,
      extraPointBudget: 17,
      pointBudgetMode: "all-available",
      focusSkillId: "fireball",
      preferences: [
        { id: "life", weight: 3 }, { id: "energyShield", weight: 2 }, { id: "armour", weight: 1 }, { id: "evasion", weight: 2 },
        { id: "spellDamage", weight: 1 }, { id: "attackDamage", weight: 3 },
      ],
    };
    const before = structuredClone(settings);
    settings.preferences.forEach(Object.freeze);
    Object.freeze(settings.preferences);
    Object.freeze(settings);
    const entry = preset("spark");
    const presetBefore = structuredClone(entry);
    const result = addSkillPresetPreferences(settings, entry);
    expect(result).not.toBe(settings);
    expect(result.preferences).not.toBe(settings.preferences);
    expect(result).toEqual({
      ...before,
      focusSkillId: "spark",
      preferences: [
        ...before.preferences,
        { id: "lightningDamage", weight: 3 }, { id: "elementalDamage", weight: 2 }, { id: "projectileDamage", weight: 2 },
        { id: "castSpeed", weight: 2 }, { id: "projectileSpeed", weight: 1 }, { id: "skillDuration", weight: 1 },
      ],
    });
    expect(settings).toEqual(before);
    expect(entry).toEqual(presetBefore);
    expect(result.preferences.every((preference) => Object.keys(preference).sort().join(",") === "id,weight")).toBe(true);
    result.preferences[0].weight = 1;
    expect(settings.preferences[0].weight).toBe(3);
  });

  it("preserves unmodeled settings and goals without adding source-tracking fields", () => {
    const goals = Object.freeze(["required-node"]);
    const settings = { mode: "shortest" as const, extraPointBudget: 0, preferences: [], goals, futureSetting: { preserved: true } };
    const result = addSkillPresetPreferences(settings, preset("essence-drain"));
    expect(result).toEqual({
      ...settings, focusSkillId: "essence-drain",
      preferences: [{ id: "chaosDamage", weight: 3 }, { id: "spellDamage", weight: 3 }, { id: "skillDuration", weight: 2 }],
    });
    expect(Object.keys(result).sort()).toEqual([...Object.keys(settings), "focusSkillId"].sort());
    expect(settings.preferences).toEqual([]);
    expect(goals).toEqual(["required-node"]);
  });

  it("is idempotent and does not share appended preference objects with the preset", () => {
    const entry = preset("enfeeble");
    const settings: PassiveOptimizationSettings = { mode: "shortest", extraPointBudget: 5, pointBudgetMode: "extra", preferences: [] };
    const first = addSkillPresetPreferences(settings, entry);
    const second = addSkillPresetPreferences(first, entry);
    expect(second).toEqual(first);
    expect(second.preferences[0]).not.toBe(first.preferences[0]);
    first.preferences[0].weight = 1;
    expect(entry.suggestions[0].weight).toBe(3);
    expect(second.preferences[0].weight).toBe(3);
  });

  it("never removes preferences, even when a new preset excludes them", () => {
    const initial: PassiveOptimizationSettings = { mode: "weighted", extraPointBudget: 8, preferences: [{ id: "criticalChance", weight: 3 }] };
    const fireball = addSkillPresetPreferences(initial, preset("fireball"));
    const drain = addSkillPresetPreferences(fireball, preset("essence-drain"));
    expect(drain.focusSkillId).toBe("essence-drain");
    expect(drain.preferences.slice(0, fireball.preferences.length)).toEqual(fireball.preferences);
    expect(drain.preferences).toContainEqual({ id: "projectileDamage", weight: 2 });
    expect(drain.preferences).toContainEqual({ id: "criticalChance", weight: 3 });
    expect(drain.extraPointBudget).toBe(8);
    expect(drain.mode).toBe("weighted");
  });

  it("keeps existing duplicate entries as supplied and deduplicates repeated missing suggestions", () => {
    const settings: PassiveOptimizationSettings = {
      mode: "shortest", extraPointBudget: 4,
      preferences: [{ id: "life", weight: 3 }, { id: "life", weight: 1 }],
    };
    const entry: SkillPreferencePreset = {
      ...preset("enfeeble"),
      suggestions: [
        { id: "curseMagnitude", weight: 2, reason: "First suggestion" },
        { id: "curseMagnitude", weight: 3, reason: "Repeated suggestion" },
      ],
    };
    expect(addSkillPresetPreferences(settings, entry).preferences).toEqual([
      ...settings.preferences, { id: "curseMagnitude", weight: 2 },
    ]);
  });
});

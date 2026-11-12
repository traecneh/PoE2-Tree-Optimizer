// Independent identities, source component flags and isolated PoB 0.23.1 outputs.
export const poisonBowIds = ["poisonburst-arrow", "gas-arrow"];
export const poisonBowSkillFixtures = [
  { id: "poisonburst-arrow", name: "Poisonburst Arrow", gemId: "Metadata/Items/Gems/SkillGemPoisonBurstArrow",
    tags: ["area", "attack", "chaos", "dexterity", "duration", "grants_active_skill", "projectile", "repeatable"],
    components: ["Arrow", "Poison Burst"], sourceDuration: 3, sourceRadius: 24, poisonUsesSkillDuration: true,
    noHitPoison: true, suppliedPoisonModeled: false },
  { id: "gas-arrow", name: "Gas Arrow", gemId: "Metadata/Items/Gems/SkillGemGasArrow",
    tags: ["area", "attack", "chaos", "dexterity", "duration", "fire", "grants_active_skill", "projectile", "repeatable"],
    components: ["Arrow", "Poison Cloud", "Explosion"], sourceDuration: 4, sourceRadius: 18, poisonUsesSkillDuration: false,
    noHitPoison: true, suppliedPoisonModeled: false, cloudLimit: 6, areaGrowthPerSecond: 20, areaGrowthCap: 80, explosionPhysicalToFire: 100 },
] as const;

export const poisonBowScopes = ["bowAttackDamage", "bowAttackSpeed", "attackAreaOfEffect", "attackAreaDamage"] as const;
export const poisonBowSuggestionIds = ["poisonMagnitude", "attackDamage", "physicalDamage", "projectileDamage", "attackAreaDamage", "poisonDuration", "skillDuration", "areaOfEffect", "attackSpeed"];

export const poisonBowNativeFixtures = [
  { skill: "poisonburst-arrow", poison: 5.385766215481, magnitude20: 6.4629194585772, reducedMagnitude20: 4.3086129723848,
    generic20: 6.5035667507695, attack20: 6.5035667507695, bow20: 6.5035667507695, physical20: 6.5035667507695, projectile20: 6.5035667507695, area20: 6.5035667507695,
    chaos20: 5.385766215481, dot20: 5.385766215481, fire20: 5.385766215481, minion100: 5.385766215481, plant100: 5.385766215481, spell20: 5.385766215481,
    poisonChance: 100, chance20: 100, duration: 3.003, poisonDuration: 3, poisonDuration20: 3.6, poison20SkillDuration: 3.003,
    skillDuration20: 3.63, skill20PoisonDuration: 3.6, radius: 24, area20Radius: 26, attackArea20Radius: 26,
    deployRate: 1.2, attackSpeed20: 1.44, bowSpeed20: 1.44, hit: 5.38125, hitMagnitude20: 5.38125, poisonAttackSpeed20: 5.5881756777715 },
  { skill: "gas-arrow", poison: 4.0038541776187, magnitude20: 4.8046250131425, reducedMagnitude20: 3.203083342095,
    generic20: 4.8308797946351, attack20: 4.8308797946351, bow20: 4.8308797946351, physical20: 4.8308797946351, projectile20: 4.8308797946351, area20: 4.8308797946351,
    chaos20: 4.0038541776187, dot20: 4.0038541776187, fire20: 4.0038541776187, minion100: 4.0038541776187, plant100: 4.0038541776187, spell20: 4.0038541776187,
    poisonChance: 100, chance20: 100, duration: 4.026, poisonDuration: 2, poisonDuration20: 2.4, poison20SkillDuration: 4.026,
    skillDuration20: 4.818, skill20PoisonDuration: 2, radius: 18, area20Radius: 19, attackArea20Radius: 19,
    deployRate: 1.2, attackSpeed20: 1.44, bowSpeed20: 1.44, hit: 4.33125, hitMagnitude20: 4.33125, poisonAttackSpeed20: 4.1389483438309 },
] as const;

export const poisonBowSeparateHitControls = {
  poisonburstArrowHit: 5.38125, poisonburstArrowHitPhysical20: 6.5625, poisonburstArrowPoisonsByDefault: false,
  gasArrowHit: 1.8375, gasArrowHitPhysical20: 2.23125, gasArrowPoisonsByDefault: false,
  gasExplosionHit: 11.025, gasExplosionHitFire20: 13.125, gasExplosionPhysicalHit: 0, gasExplosionFireHit: 10.5,
  gasExplosionPoisonsByDefault: false,
} as const;

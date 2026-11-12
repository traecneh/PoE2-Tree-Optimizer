// Independent frozen gem/component facts from the isolated PoB 0.23.1 export.
export const plantBowIds = ["vine-arrow", "toxic-growth"];
export const plantBowHitIds = ["toxic-growth"];
export const plantBowSkillFixtures = [
  { id: "vine-arrow", name: "Vine Arrow", gemId: "Metadata/Items/Gems/SkillGemVineArrow",
    tags: ["area", "attack", "chaos", "dexterity", "duration", "grants_active_skill", "plant", "projectile", "repeatable"],
    scopes: ["plantDamage", "attackAreaOfEffect", "bowAttackSpeed"],
    suggestions: ["plantDamage", "chaosDamage", "damageOverTime", "skillDuration", "areaOfEffect", "attackSpeed"],
    components: ["Impact", "Vines"], duration: 8, intrinsicChaosPerMinute: 16278, suppliedPoisonModeled: false },
  { id: "toxic-growth", name: "Toxic Growth", gemId: "Metadata/Items/Gems/SkillGemToxicGrowth",
    tags: ["area", "attack", "chaos", "dexterity", "grants_active_skill", "plant", "projectile", "repeatable"],
    scopes: ["plantDamage", "attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage", "bowAttackDamage", "bowAttackSpeed",
      "bowAccuracy", "bowCriticalDamageBonus", "twoHandedWeaponDamage", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    suggestions: ["plantDamage", "attackDamage", "physicalDamage", "projectileDamage", "attackAreaDamage", "areaOfEffect", "attackSpeed"],
    components: ["Pustules", "Explosion"], explosionPoisonChance: 100, detonationSeconds: 15, suppliedPoisonModeled: false },
] as const;

export const plantBowNativeFixture = {
  vineDot: 271.3, plant20Dot: 325.56, generic20Dot: 325.56, chaos20Dot: 325.56, dot20Dot: 325.56, reducedPlant20Dot: 217.04,
  attack20Dot: 271.3, projectile20Dot: 271.3, bow20Dot: 271.3, spell20Dot: 271.3, area20Dot: 271.3, poisonMagnitude20Dot: 271.3, minion100Dot: 271.3,
  vineDuration: 8.019, duration20: 9.603, vineRadius: 24, attackArea20Radius: 26, deployRate: 1.2, bowSpeed20Rate: 1.44,
  toxicExplosionHit: 1.3125, toxicPlant20Hit: 1.44375, toxicGeneric20Hit: 1.44375, toxicReducedPlant20Hit: 0.91875,
  toxicAttack20Hit: 1.44375, toxicProjectile20Hit: 1.44375, toxicBow20Hit: 1.44375, toxicArea20Hit: 1.44375, toxicPhysical20Hit: 1.44375,
  toxicChaos20Hit: 1.3125, toxicDot20Hit: 1.3125, toxicSpell20Hit: 1.3125, toxicPoisonMagnitude20Hit: 1.3125, toxicMinion100Hit: 1.3125,
  toxicOutgoingPoison: 1.2077199486588, toxicPoisonMagnitude20: 1.4492639383905, toxicBasePoisonDuration: 2, toxicPoisonDuration20: 2.4,
  toxicDetonation: 15, toxicSkillDuration20Detonation: 15, toxicPoisonDuration20Detonation: 15,
} as const;

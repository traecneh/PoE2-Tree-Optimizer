// Independent source identity and isolated PoB 0.23.1 observations from 26 MAIN calculations.
export const poisonBowBurstingPlagueSupportFixture = {
  id: "bursting-plague", name: "Bursting Plague", effectId: "SupportBurstingPlaguePlayer", family: "BurstingPlague",
  childEffectId: "PlagueBurstPlayer", storagePercent: 100, enemyLifeCapPercent: 20, physicalFromStoredPercent: 100,
  manaMultiplier: 20, ignoreMinionTypes: true, childBaseRadius: 18, childMaximumAreaMore: 100, childBaseCooldown: .1,
  coverage: { plagueStorage: false, enemyLifeCap: false, burstDamageFromStorage: false, maximumPlagueArea: false, deathTrigger: false },
} as const;

export const poisonBowBurstingPlagueNativeFixtures = [
  { skill: "poisonburst-arrow", component: "Poison Burst", childEffectId: "PlagueBurstPlayer", ownerIsPlayer: true, hasMinion: false,
    poison: 5.385766215481, supportedPoison: 5.385766215481, hit: 5.38125, supportedHit: 5.38125,
    duration: 3.003, supportedDuration: 3.003, poisonDuration: 3, supportedPoisonDuration: 3,
    magnitude: 1, supportedMagnitude: 1, stacks: 1, supportedStacks: 1, rate: 1.2, supportedRate: 1.2,
    radius: 24, supportedRadius: 24, mana: 38, supportedMana: 45, efficiencyMana: 27,
    escalatingOnlyPoison: 9.2211585994231, burstingEscalatingPoison: 9.2211585994231,
    deadlyOnlyPoison: 7.4384544711926, burstingDeadlyPoison: 7.4384544711926,
    combinedPoison: 13.546703108305, combinedPoisonDuration: 3.24, combinedMagnitude: 2, combinedStacks: 2, combinedMana: 33 },
  { skill: "gas-arrow", component: "Poison Cloud", childEffectId: "PlagueBurstPlayer", ownerIsPlayer: true, hasMinion: false,
    poison: 4.0038541776187, supportedPoison: 4.0038541776187, hit: 4.33125, supportedHit: 4.33125,
    duration: 4.026, supportedDuration: 4.026, poisonDuration: 2, supportedPoisonDuration: 2,
    magnitude: 1, supportedMagnitude: 1, stacks: 1, supportedStacks: 1, rate: 1.2, supportedRate: 1.2,
    radius: 18, supportedRadius: 18, mana: 62, supportedMana: 74, efficiencyMana: 45,
    escalatingOnlyPoison: 6.6528, burstingEscalatingPoison: 6.6528,
    deadlyOnlyPoison: 5.5922684579199, burstingDeadlyPoison: 5.5922684579199,
    combinedPoison: 9.2736, combinedPoisonDuration: 1.6, combinedMagnitude: 2, combinedStacks: 2, combinedMana: 54 },
] as const;

export const poisonBowBurstingPlagueChildFixtures = [
  { parent: "poisonburst-arrow", selected: "PlagueBurstPlayer", ownerIsPlayer: true, hasMinion: false,
    attack: false, spell: false, area: true, triggered: true, nativeDamage: 0, nativeDPS: 0,
    nativeMana: 0, nativeCooldown: .132, radius: 18, magnifiedRadius: 21, magnifiedArea: 1.45 },
  { parent: "gas-arrow", selected: "PlagueBurstPlayer", ownerIsPlayer: true, hasMinion: false,
    attack: false, spell: false, area: true, triggered: true, nativeDamage: 0, nativeDPS: 0,
    nativeMana: 0, nativeCooldown: .132, radius: 18, magnifiedRadius: 21, magnifiedArea: 1.45 },
] as const;

export const poisonBowBurstingPlagueHitFixtures = [
  { skill: "poisonburst-arrow", component: "Arrow", hit: 5.38125, supportedHit: 5.38125, mana: 38, supportedMana: 45 },
  { skill: "gas-arrow", component: "Arrow", hit: 1.8375, supportedHit: 1.8375, mana: 62, supportedMana: 74 },
  { skill: "gas-arrow", component: "conditional Fire Explosion", hit: 11.025, supportedHit: 11.025, mana: 62, supportedMana: 74 },
] as const;

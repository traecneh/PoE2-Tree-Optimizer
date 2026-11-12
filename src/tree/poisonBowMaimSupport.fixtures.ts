// Independent generated-source facts and frozen PoB 0.23.1 observations, not production metadata.
export const poisonBowMaimSupportFixture = {
  id: "maim", name: "Maim", effectId: "SupportMaimPlayer", family: "Maim",
  chanceOnAttackHit: 100, sourceStat: "maim_on_hit_%", manaMultiplier: 0,
  enemyMovementReduction: 30, enemyEvasionReduction: 15, automaticEnemyCondition: false,
  nativeChanceMapped: false, nativeSupportTypeAdded: true,
} as const;

export const poisonBowMaimEnemyFixtures = [
  { increased: 0, maimed: false, evasion: 996, evasionInc: 0, movementFactor: 1, movementInc: 0, evasionMore: 1 },
  { increased: 0, maimed: true, evasion: 846.6, evasionInc: -15, movementFactor: 0.7, movementInc: -30, evasionMore: 1 },
  { increased: 100, maimed: false, evasion: 1992, evasionInc: 100, movementFactor: 2, movementInc: 100, evasionMore: 1 },
  { increased: 100, maimed: true, evasion: 1842.6, evasionInc: 85, movementFactor: 1.7, movementInc: 70, evasionMore: 1 },
] as const;

// Arrays are explicit enemy-Maim OFF/ON. Linking Maim matches each same-state baseline exactly.
export const poisonBowMaimComponentFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, mana: 38, hit: [5.345375, 5.355625], physical: 5.125, fire: 0 },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, mana: 38, hit: [5.345375, 5.355625], physical: 5.125, fire: 0 },
  { skill: "gas-arrow", component: "arrow", actualHit: true, mana: 62, hit: [1.82525, 1.82875], physical: 1.75, fire: 0 },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, mana: 62, hit: [4.302375, 4.310625], physical: 4.125, fire: 0 },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, mana: 62, hit: [21.903, 21.945], physical: 0, fire: 21 },
] as const;

export const poisonBowMaimPoisonFixtures = [
  { skill: "poisonburst-arrow", nativePoisonEstimate: [5.1407527211226, 5.209577111068], duration: 3, skillTimer: 3.003, radius: 24,
    nativeArrowPoisonIIIEstimate: [4.4181304728428, 4.4602514354125], arrowMana: 45 },
  { skill: "gas-arrow", nativePoisonEstimate: [3.8503496414138, 3.8936968711447], duration: 2, skillTimer: 4.026, radius: 18,
    nativeArrowPoisonIIIEstimate: [1.4965946562522, 1.5083759399759], arrowMana: 74 },
] as const;

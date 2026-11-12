// Independent source identity and isolated PoB 0.23.1 observations from 45 MAIN calculations.
export const poisonBowAdmixtureSupportFixture = {
  id: "admixture", name: "Admixture", effectId: "SupportAdmixturePlayer", family: "Admixture",
  poisonMoreAgainstBleeding: 20, bleedMoreAgainstPoisoned: 20, manaMultiplier: 20,
} as const;

export const poisonBowAdmixtureNativeFixtures = [
  { skill: "poisonburst-arrow", poison: 5.385766215481, supportedPoison: 5.385766215481, bleedingOnlyPoison: 5.385766215481,
    supportedBleedingPoison: 6.4629194585772, supportedPoisonedPoison: 5.385766215481, supportedBothPoison: 6.4629194585772,
    supportedMagnitude: 1, supportedBleedingMagnitude: 1.2, supportedPoisonedMagnitude: 1,
    pairWithoutConditionsPoison: 5.385766215481, pairWithoutConditionsMagnitude: 1, poison3BleedingPoison: 6.4629194585772,
    pairBleedingPoison: 7.7555033502926, pairBothPoison: 7.7555033502926, pairMagnitude: 1.44,
    magnitude40Poison: 7.5400727016733, magnitude44Poison: 7.7555033502926,
    rawPoisonChance: 100, supportedRawPoisonChance: 100, supportedRawBleedChance: 0, pairRawPoisonChance: 160,
    duration: 3.003, supportedDuration: 3.003, poisonDuration: 3, supportedPoisonDuration: 3,
    hit: 5.38125, supportedHit: 5.38125, rate: 1.2, supportedRate: 1.2, radius: 24, supportedRadius: 24, stacks: 1, supportedStacks: 1,
    mana: 38, supportedMana: 45, pairMana: 54, pairEfficiencyMana: 33 },
  { skill: "gas-arrow", poison: 4.0038541776187, supportedPoison: 4.0038541776187, bleedingOnlyPoison: 4.0038541776187,
    supportedBleedingPoison: 4.8046250131425, supportedPoisonedPoison: 4.0038541776187, supportedBothPoison: 4.8046250131425,
    supportedMagnitude: 1, supportedBleedingMagnitude: 1.2, supportedPoisonedMagnitude: 1,
    pairWithoutConditionsPoison: 4.0038541776187, pairWithoutConditionsMagnitude: 1, poison3BleedingPoison: 4.8046250131425,
    pairBleedingPoison: 5.765550015771, pairBothPoison: 5.765550015771, pairMagnitude: 1.44,
    magnitude40Poison: 5.6053958486662, magnitude44Poison: 5.765550015771,
    rawPoisonChance: 100, supportedRawPoisonChance: 100, supportedRawBleedChance: 0, pairRawPoisonChance: 160,
    duration: 4.026, supportedDuration: 4.026, poisonDuration: 2, supportedPoisonDuration: 2,
    hit: 4.33125, supportedHit: 4.33125, rate: 1.2, supportedRate: 1.2, radius: 18, supportedRadius: 18, stacks: 1, supportedStacks: 1,
    mana: 62, supportedMana: 74, pairMana: 89, pairEfficiencyMana: 54 },
] as const;

export const poisonBowAdmixtureArrowFixtures = [
  { skill: "poisonburst-arrow", hit: 5.38125, supportedHit: 5.38125, baseRawPoisonChance: 0, baseRawBleedChance: 0,
    supportedRawPoisonChance: 0, supportedRawBleedChance: 0, suppliedBleedChance: 100,
    suppliedBleed: 4.4994588462054, supportedNoConditionsBleed: 4.4994588462054, supportedBleedingOnlyBleed: 4.4994588462054,
    supportedPoisonedBleed: 5.3993506154464, supportedBothBleed: 5.3993506154464, pairBothBleed: 5.3993506154464,
    supportedPoisonedMagnitude: 1.2, supportedBleedingOnlyMagnitude: 1,
    pairPoisonChance: 60, pairPoisonMagnitude: 1.44, pairBleedMagnitude: 1.2, pairPoison: 6.5747123318647, bleedDuration: 5 },
  { skill: "gas-arrow", hit: 1.8375, supportedHit: 1.8375, baseRawPoisonChance: 0, baseRawBleedChance: 0,
    supportedRawPoisonChance: 0, supportedRawBleedChance: 0, suppliedBleedChance: 100,
    suppliedBleed: 1.4636793837054, supportedNoConditionsBleed: 1.4636793837054, supportedBleedingOnlyBleed: 1.4636793837054,
    supportedPoisonedBleed: 1.7564152604464, supportedBothBleed: 1.7564152604464, pairBothBleed: 1.7564152604464,
    supportedPoisonedMagnitude: 1.2, supportedBleedingOnlyMagnitude: 1,
    pairPoisonChance: 60, pairPoisonMagnitude: 1.44, pairBleedMagnitude: 1.2, pairPoison: 2.215172308736, bleedDuration: 5 },
] as const;

export const poisonBowAdmixtureFireFixture = {
  hit: 11.025, supportedHit: 11.025, suppliedBleedChance: 100, hasBleedDamage: false, hasPoisonDamage: false, bleedMagnitude: 1.2,
} as const;

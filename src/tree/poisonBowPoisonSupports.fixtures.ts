// Independent source identities and isolated PoB 0.23.1 observations from 43 MAIN calculations.
export const poisonBowPoisonSupportFixtures = [
  { id: "poison-i", name: "Poison I", effectId: "SupportPoisonPlayer", family: "Poison", chance: 40, bleedingMagnitudeMore: 0, manaMultiplier: 20 },
  { id: "poison-ii", name: "Poison II", effectId: "SupportPoisonPlayerTwo", family: "Poison", chance: 60, bleedingMagnitudeMore: 0, manaMultiplier: 20 },
  { id: "poison-iii", name: "Poison III", effectId: "SupportPoisonPlayerThree", family: "Poison", chance: 60, bleedingMagnitudeMore: 20, manaMultiplier: 20 },
] as const;

export const poisonBowPoisonNativeFixtures = [
  { skill: "poisonburst-arrow", noHitComponent: true, poison: 5.385766215481,
    tierPoison: [5.385766215481, 5.385766215481, 5.385766215481], tierChance: [100, 100, 100], rawTierChance: [140, 160, 160],
    tierMagnitude: [1, 1, 1], tier3Bleeding: true, tier3BleedingMagnitude: 1.2, tier3BleedingPoison: 6.4629194585772,
    bleedingOnlyPoison: 5.385766215481, tier2BleedingPoison: 5.385766215481, magnitudeOnlyPoison: 6.4629194585772,
    duration: 3.003, tierDuration: [3.003, 3.003, 3.003], poisonDuration: 3, tierPoisonDuration: [3, 3, 3],
    hit: 5.38125, tierHit: [5.38125, 5.38125, 5.38125], rate: 1.2, tierRate: [1.2, 1.2, 1.2],
    radius: 24, tierRadius: [24, 24, 24], stacks: 1, tierStacks: [1, 1, 1], mana: 38, tierMana: [45, 45, 45], efficiencyMana: 27,
    extraChanceRaw: 220, extraChanceFinal: 100, extraChancePoison: 5.385766215481,
    escalatingPoison: 9.2211585994231, escalatingBleedingPoison: 11.065390319308,
    escalatingBleedingMagnitude: 1.2, escalatingPoisonDuration: 2.4, escalatingStacks: 2,
    combinedBleedingPoison: 15.494196839922, combinedMagnitude: 2.4, combinedHit: 3.80625, combinedMana: 27 },
  { skill: "gas-arrow", noHitComponent: true, poison: 4.0038541776187,
    tierPoison: [4.0038541776187, 4.0038541776187, 4.0038541776187], tierChance: [100, 100, 100], rawTierChance: [140, 160, 160],
    tierMagnitude: [1, 1, 1], tier3Bleeding: true, tier3BleedingMagnitude: 1.2, tier3BleedingPoison: 4.8046250131425,
    bleedingOnlyPoison: 4.0038541776187, tier2BleedingPoison: 4.0038541776187, magnitudeOnlyPoison: 4.8046250131425,
    duration: 4.026, tierDuration: [4.026, 4.026, 4.026], poisonDuration: 2, tierPoisonDuration: [2, 2, 2],
    hit: 4.33125, tierHit: [4.33125, 4.33125, 4.33125], rate: 1.2, tierRate: [1.2, 1.2, 1.2],
    radius: 18, tierRadius: [18, 18, 18], stacks: 1, tierStacks: [1, 1, 1], mana: 62, tierMana: [74, 74, 74], efficiencyMana: 45,
    extraChanceRaw: 220, extraChanceFinal: 100, extraChancePoison: 4.0038541776187,
    escalatingPoison: 6.6528, escalatingBleedingPoison: 7.98336,
    escalatingBleedingMagnitude: 1.2, escalatingPoisonDuration: 1.6, escalatingStacks: 2,
    combinedBleedingPoison: 11.12832, combinedMagnitude: 2.4, combinedHit: 3.01875, combinedMana: 45 },
] as const;

export const poisonBowPoisonArrowFixtures = [
  { skill: "poisonburst-arrow", hit: 5.38125, tierHit: [5.38125, 5.38125, 5.38125], baseChance: 0, tierChance: [40, 60, 60],
    tierPoison: [4.1328, 4.5657724526838, 4.5657724526838], tier3BleedingPoison: 5.4789269432206,
    poisonDuration: 2, inherentPoisonDuration: 3, extraChanceRaw: 120, extraChanceFinal: 100 },
  { skill: "gas-arrow", hit: 1.8375, tierHit: [1.8375, 1.8375, 1.8375], baseChance: 0, tierChance: [40, 60, 60],
    tierPoison: [1.4112, 1.5383141032889, 1.5383141032889], tier3BleedingPoison: 1.8459769239466,
    poisonDuration: 2, inherentPoisonDuration: 2, extraChanceRaw: 120, extraChanceFinal: 100 },
] as const;

export const poisonBowPoisonFireFixture = {
  skill: "gas-arrow", hit: 11.025, tierHit: [11.025, 11.025, 11.025], tierChance: [40, 60, 60],
  tierHasPoisonDamage: [false, false, false], tier3BleedingMagnitude: 1.2, tier3BleedingHasPoisonDamage: false,
} as const;

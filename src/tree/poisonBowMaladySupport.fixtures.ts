// Independent generated-source facts and isolated PoB 0.23.1 observations.
export const poisonBowMaladySupportFixture = {
  id: "malady", name: "Malady (catalog review)", sourceName: "Malady", effectId: "SupportMaladyPlayer", family: "Malady", manaMultiplier: 0, catalogTier: 0,
  swapStats: ["base_bleed_chance_is_poison_chance_instead", "base_poison_chance_is_bleed_chance_instead"],
  nativeSwapMapped: false,
} as const;

export const poisonBowMaladyLinkedChanceFixtures = [
  { id: "poison-i", name: "Poison I", from: "Poison", to: "Bleeding", amount: 40, conditionalPoisonMore: 0 },
  { id: "poison-ii", name: "Poison II", from: "Poison", to: "Bleeding", amount: 60, conditionalPoisonMore: 0 },
  { id: "poison-iii", name: "Poison III", from: "Poison", to: "Bleeding", amount: 60, conditionalPoisonMore: 20 },
  { id: "bleed-i", name: "Bleed I", from: "Bleeding", to: "Poison", amount: 50, conditionalPoisonMore: 0 },
  { id: "bleed-ii", name: "Bleed II", from: "Bleeding", to: "Poison", amount: 75, conditionalPoisonMore: 0 },
  { id: "bleed-iii", name: "Bleed III", from: "Bleeding", to: "Poison", amount: 100, conditionalPoisonMore: 0 },
] as const;

// Abstract eligible-hit chance arithmetic, not real application, contact, or debuff uptime.
export const poisonBowMaladyChanceExamples = [
  { basePoison: 0, baseBleed: 0, poisonInc: 0, bleedInc: 0, swappedBase: [0, 0], finalChance: [0, 0] },
  { basePoison: 40, baseBleed: 0, poisonInc: 0, bleedInc: 0, swappedBase: [0, 40], finalChance: [0, 40] },
  { basePoison: 0, baseBleed: 75, poisonInc: 0, bleedInc: 0, swappedBase: [75, 0], finalChance: [75, 0] },
  { basePoison: 60, baseBleed: 75, poisonInc: 0, bleedInc: 0, swappedBase: [75, 60], finalChance: [75, 60] },
  { basePoison: 40, baseBleed: 75, poisonInc: 20, bleedInc: 0, swappedBase: [75, 40], finalChance: [90, 40] },
  { basePoison: 140, baseBleed: 50, poisonInc: 0, bleedInc: 0, swappedBase: [50, 140], finalChance: [50, 100] },
] as const;

export const poisonBowMaladyNativeFixtures = [
  { skill: "poisonburst-arrow", baseMana: 38, poison3Mana: 45, trioMana: 54, physicalArrow: 5.125, arrowHit: 5.38125,
    inherentPoison: 5.385766215481, conditionalPoison: 7.7555033502926, poisonDuration: 3, skillTimer: 3.003, radius: 24 },
  { skill: "gas-arrow", baseMana: 62, poison3Mana: 74, trioMana: 89, physicalArrow: 1.75, arrowHit: 1.8375,
    inherentPoison: 4.0038541776187, conditionalPoison: 5.765550015771, poisonDuration: 2, skillTimer: 4.026, radius: 18 },
] as const;

export const poisonBowMaladyNativeChanceFixture = {
  // Actual Malady leaves these values unchanged: a model gap, NOT the expected game swap.
  poisonIII: [60, 0], bleedII: [0, 75], paired: [60, 75], syntheticSourcePaired: [160, 75], sourcePoisonCap: 100,
  explicitOriginalControl: [40, 75], explicitSwappedControl: [75, 40],
  magnitudeOff: [1, 1], magnitudeBothConditions: [1.44, 1.2],
} as const;

// Independent generated-source facts and frozen PoB 0.23.1 observations.
export const poisonBowCloseCombatSupportFixtures = [
  { id: "close-combat-i", name: "Close Combat I", effectId: "SupportCloseCombatPlayer", family: "CloseCombat", maxMore: 20, manaMultiplier: 20, catalogTier: 3 },
  { id: "close-combat-ii", name: "Close Combat II", effectId: "SupportCloseCombatPlayerTwo", family: "CloseCombat", maxMore: 30, manaMultiplier: 20, catalogTier: 5 },
] as const;

export const poisonBowCloseCombatDistanceFixtures = [
  { metres: 0, closeRamp: 1, longRamp: 0, nativeFactors: [1.2, 1.3] },
  { metres: 1, closeRamp: 1, longRamp: 0, nativeFactors: [1.2, 1.3] },
  { metres: 2, closeRamp: .6, longRamp: 0, nativeFactors: [1.12, 1.18] },
  { metres: 2.25, closeRamp: .5, longRamp: 0, nativeFactors: [1.1, 1.15] },
  { metres: 3.5, closeRamp: 0, longRamp: 0, nativeFactors: [1, 1] },
  { metres: 5.25, closeRamp: 0, longRamp: .5, nativeFactors: [1, 1] },
  { metres: 7, closeRamp: 0, longRamp: 1, nativeFactors: [1, 1] },
  { metres: 12, closeRamp: 0, longRamp: 1, nativeFactors: [1, 1] },
] as const;

// Source baseline/I/II at 1m. Synthetic source fields do not establish real hits.
export const poisonBowCloseCombatNativeFixtures = [
  { skill: "poisonburst-arrow", ranges: [[16, 25], [20, 30], [21, 32]], poison: [5.385766215481, 6.5035667507695, 6.9202014957406],
    defaultPoison: [6.0361228905579, 6.2698448206637], defaultRanges: [[18, 28], [19, 29]], roll: 78.260869565217,
    sourceHits: [5.38125, 6.5625, 6.95625], mana: [38, 45, 54], efficiencyMana: [23, 27, 33],
    arrowRanges: [[16, 25], [21, 32]], arrowHits: [5.38125, 6.95625], arrowPoison: [4.5657724526838, 5.8898464639622],
    pairedFarPoison: 7.1539234258464, pairedMidPoison: 6.2698448206637, poisonDuration: 3, skillTimer: 3.003, radius: 24 },
  { skill: "gas-arrow", ranges: [[13, 20], [16, 24], [17, 26]], poison: [4.0038541776187, 4.8308797946351, 5.2115741262775],
    defaultPoison: [4.4501854629926, 4.6077141519481], defaultRanges: [[15, 22], [15, 23]], roll: 70.588235294118,
    sourceHits: [4.33125, 5.25, 5.64375], mana: [62, 74, 89], efficiencyMana: [38, 45, 54],
    arrowRanges: [[6, 8], [7, 11]], arrowHits: [1.8375, 2.3625], arrowPoison: [1.5383141032889, 2.005427746525],
    pairedFarPoison: 5.2772110800089, pairedMidPoison: 4.6077141519481, poisonDuration: 2, skillTimer: 4.026, radius: 18 },
] as const;

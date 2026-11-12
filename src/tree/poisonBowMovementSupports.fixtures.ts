// Independent source identities and isolated PoB 0.23.1 observations from 32 MAIN calculations.
export const poisonBowMovementSupportFixtures = [
  { id: "mobility", name: "Mobility", effectId: "SupportMobilityPlayer", family: "Mobility", penaltyMultiplier: .75, damageMore: 0 },
  { id: "deliberation", name: "Deliberation", effectId: "SupportDeliberationPlayer", family: "Deliberation", penaltyMultiplier: 1.3, damageMore: 20 },
] as const;

// Raw source factors multiply to .975; this PoB's ModList rounds them to .98.
export const poisonBowMovementNative = {
  baseRetained: .3, mobilityRetained: .475, deliberationRetained: .09, bothRetained: .314,
  bothPenalty: .98, global20: 1.2, global20Retained: .3, global20Speed: .36, bothGlobal20Retained: .314, bothGlobal20Speed: .3768,
  penaltyReductionInc: -20, penaltyReductionRetained: .44, deliberationReducedRetained: .272,
} as const;

export const poisonBowMovementPoisonFixtures = [
  { skill: "poisonburst-arrow", component: "Poison Burst", poison: 5.385766215481, mobilityPoison: 5.385766215481,
    deliberationPoison: 6.5035667507695, bothPoison: 6.5035667507695, damageOnlyPoison: 6.5035667507695, global20Poison: 5.385766215481,
    bothGlobal20Poison: 6.5035667507695, reductionOnlyPoison: 5.385766215481, deliberationReducedPoison: 6.5035667507695,
    sourceHit: 5.38125, mobilitySourceHit: 5.38125, deliberationSourceHit: 6.5625, damageOnlySourceHit: 6.5625,
    combinedPoison: 9.1049934510772, combinedSourceHit: 4.59375, combinedMagnitude: 2, combinedMana: 23,
    base: { duration: 3.003, poisonDuration: 3, rate: 1.2, radius: 24, mana: 38, magnitude: 1, chance: 100, stackLimit: 1, roll: 78.260869565217, stackPotential: 3.6 },
    mobility: { duration: 3.003, poisonDuration: 3, rate: 1.2, radius: 24, mana: 38, magnitude: 1, chance: 100, stackLimit: 1, roll: 78.260869565217, stackPotential: 3.6 },
    deliberation: { duration: 3.003, poisonDuration: 3, rate: 1.2, radius: 24, mana: 38, magnitude: 1, chance: 100, stackLimit: 1, roll: 78.260869565217, stackPotential: 3.6 },
    both: { duration: 3.003, poisonDuration: 3, rate: 1.2, radius: 24, mana: 38, magnitude: 1, chance: 100, stackLimit: 1, roll: 78.260869565217, stackPotential: 3.6 } },
  { skill: "gas-arrow", component: "Poison Cloud", poison: 4.0038541776187, mobilityPoison: 4.0038541776187,
    deliberationPoison: 4.8308797946351, bothPoison: 4.8308797946351, damageOnlyPoison: 4.8308797946351, global20Poison: 4.0038541776187,
    bothGlobal20Poison: 4.8308797946351, reductionOnlyPoison: 4.0038541776187, deliberationReducedPoison: 4.8308797946351,
    sourceHit: 4.33125, mobilitySourceHit: 4.33125, deliberationSourceHit: 5.25, damageOnlySourceHit: 5.25,
    combinedPoison: 6.4849310286677, combinedSourceHit: 3.54375, combinedMagnitude: 2, combinedMana: 38,
    base: { duration: 4.026, poisonDuration: 2, rate: 1.2, radius: 18, mana: 62, magnitude: 1, chance: 100, stackLimit: 1, roll: 70.588235294118, stackPotential: 2.4 },
    mobility: { duration: 4.026, poisonDuration: 2, rate: 1.2, radius: 18, mana: 62, magnitude: 1, chance: 100, stackLimit: 1, roll: 70.588235294118, stackPotential: 2.4 },
    deliberation: { duration: 4.026, poisonDuration: 2, rate: 1.2, radius: 18, mana: 62, magnitude: 1, chance: 100, stackLimit: 1, roll: 70.588235294118, stackPotential: 2.4 },
    both: { duration: 4.026, poisonDuration: 2, rate: 1.2, radius: 18, mana: 62, magnitude: 1, chance: 100, stackLimit: 1, roll: 70.588235294118, stackPotential: 2.4 } },
] as const;

export const poisonBowMovementHitFixtures = [
  { skill: "poisonburst-arrow", component: "Arrow", hit: 5.38125, mobilityHit: 5.38125, deliberationHit: 6.5625, bothHit: 6.5625 },
  { skill: "gas-arrow", component: "Arrow", hit: 1.8375, mobilityHit: 1.8375, deliberationHit: 2.23125, bothHit: 2.23125 },
  { skill: "gas-arrow", component: "conditional Explosion", hit: 11.025, mobilityHit: 11.025, deliberationHit: 13.125, bothHit: 13.125 },
] as const;

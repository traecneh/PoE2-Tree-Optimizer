// Independent source identity and isolated PoB 0.23.1 observations from 32 MAIN calculations.
export const poisonBowEscalatingSupportFixture = {
  id: "escalating-poison", name: "Escalating Poison", effectId: "SupportEscalatingPoisonPlayer", family: "EscalatingPoison",
  additionalStacks: 1, durationLess: 20,
} as const;

export const poisonBowEscalatingNativeFixtures = [
  { skill: "poisonburst-arrow", component: "Poison Burst", linkedSkillDuration: true, noHitSource: true,
    duration: 3.003, supportedDuration: 3.003, poisonDuration: 3, supportedPoisonDuration: 2.4,
    stacks: 1, supportedStacks: 2, rate: 1.2, supportedRate: 1.2, magnitude: 1, supportedMagnitude: 1,
    hit: 5.38125, supportedHit: 5.38125, mana: 38, supportedMana: 38, radius: 24, supportedRadius: 24,
    poison: 5.385766215481, supportedPoison: 9.2211585994231, syntheticPoison: 9.2211585994231,
    durationOnlyPoison: 5.1590290971264, stackOnlyPoison: 9.6044940572613,
    potential: 3.6, supportedPotential: 1.44, roll: 78.260869565217, supportedRoll: 61.340206185567,
    slowRate: .24, slowPotential: .72, slowPoison: 3.0996, slowSupportedPotential: .288, slowSupportedPoison: 2.47968, slowRoll: 50, slowSupportedRoll: 50,
    poison100Duration: 4.8, poison100SkillDuration: 3.003, skill100PoisonDuration: 4.8, skill100Duration: 6.006,
    prolongedPoisonDuration: 3.24, prolongedSkillDuration: 4.059, prolongedPoison: 9.7394480387375, prolongedMana: 45,
    rapidRate: 1.5, rapidPoisonDuration: 2.4, rapidPotential: 1.8, rapidPoison: 9.6044940572613,
    deadlyMagnitude: 2, deadlyStacks: 2, deadlyPoisonDuration: 2.4, deadlyHit: 3.80625, deadlyPoison: 12.911830699935,
    combinedMagnitude: 2, combinedStacks: 2, combinedPoisonDuration: 3.24, combinedPoison: 13.546703108305, combinedMana: 27 },
  { skill: "gas-arrow", component: "Poison Cloud", linkedSkillDuration: false, noHitSource: true,
    duration: 4.026, supportedDuration: 4.026, poisonDuration: 2, supportedPoisonDuration: 1.6,
    stacks: 1, supportedStacks: 2, rate: 1.2, supportedRate: 1.2, magnitude: 1, supportedMagnitude: 1,
    hit: 4.33125, supportedHit: 4.33125, mana: 62, supportedMana: 62, radius: 18, supportedRadius: 18,
    poison: 4.0038541776187, supportedPoison: 6.6528, syntheticPoison: 6.6528,
    durationOnlyPoison: 3.8507366706811, stackOnlyPoison: 7.1685311382763,
    potential: 2.4, supportedPotential: .96, roll: 70.588235294118, supportedRoll: 50,
    slowRate: .24, slowPotential: .48, slowPoison: 1.6632, slowSupportedPotential: .192, slowSupportedPoison: 1.33056, slowRoll: 50, slowSupportedRoll: 50,
    poison100Duration: 3.2, poison100SkillDuration: 4.026, skill100PoisonDuration: 1.6, skill100Duration: 8.019,
    prolongedPoisonDuration: 1.6, prolongedSkillDuration: 5.412, prolongedPoison: 6.6528, prolongedMana: 74,
    rapidRate: 1.5, rapidPoisonDuration: 1.6, rapidPotential: 1.2, rapidPoison: 7.1685311382763,
    deadlyMagnitude: 2, deadlyStacks: 2, deadlyPoisonDuration: 1.6, deadlyHit: 3.01875, deadlyPoison: 9.2736,
    combinedMagnitude: 2, combinedStacks: 2, combinedPoisonDuration: 1.6, combinedPoison: 9.2736, combinedMana: 45 },
] as const;

export const poisonBowEscalatingHitFixtures = [
  { skill: "poisonburst-arrow", component: "Arrow", hit: 5.38125, supportedHit: 5.38125, hasPoisonOutput: false },
  { skill: "gas-arrow", component: "Arrow", hit: 1.8375, supportedHit: 1.8375, hasPoisonOutput: false },
  { skill: "gas-arrow", component: "conditional Explosion", hit: 11.025, supportedHit: 11.025, hasPoisonOutput: false },
] as const;

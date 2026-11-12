// Frozen source identities and independent isolated PoB 0.23.1 observations from 31 MAIN checks.
export const poisonBowDeadlySupportFixtures = [
  { id: "deadly-poison-i", name: "Deadly Poison I", effectId: "SupportDeadlyPoisonPlayer", family: "DeadlyPoison", poisonMore: 75, hitLess: 25 },
  { id: "deadly-poison-ii", name: "Deadly Poison II", effectId: "SupportDeadlyPoisonPlayerTwo", family: "DeadlyPoison", poisonMore: 100, hitLess: 30 },
] as const;

export const poisonBowDeadlyNativeFixtures = [
  { skill: "poisonburst-arrow", baselinePoison: 5.385766215481, sourceHit: 5.38125, hitI: 3.9375, hitII: 3.80625,
    hitOnlyIPoison: 3.9021400504617, hitOnlyIIPoison: 3.7192272355963,
    magnitudeOnlyIPoison: 9.4250908770917, magnitudeOnlyIIPoison: 10.771532430962,
    supportIPoison: 6.8287450883079, supportIIPoison: 7.4384544711926,
    syntheticIPoison: 6.8287450883079, syntheticIIPoison: 7.4384544711926,
    magnitudeI: 1.75, magnitudeII: 2, increasedMagnitude100: 4, increasedMagnitude100Poison: 14.876908942385,
    baseDuration: 3.003, supportedDuration: 3.003, poisonDuration: 3, supportedPoisonDuration: 3,
    radius: 24, supportedRadius: 24, mana: 38, supportedMana: 38, rate: 1.2, supportedRate: 1.2,
    poisonChance: 100, supportedPoisonChance: 100, stackLimit: 1, supportedStackLimit: 1,
    combinedPoison: 8.2621988314247, combinedPoisonDuration: 4.05, combinedSkillDuration: 4.059, combinedMana: 27, combinedRate: 1.5 },
  { skill: "gas-arrow", baselinePoison: 4.0038541776187, sourceHit: 4.33125, hitI: 3.28125, hitII: 3.01875,
    hitOnlyIPoison: 3.0192998716469, hitOnlyIIPoison: 2.79613422896,
    magnitudeOnlyIPoison: 7.0067448108328, magnitudeOnlyIIPoison: 8.0077083552375,
    supportIPoison: 5.2837747753821, supportIIPoison: 5.5922684579199,
    syntheticIPoison: 5.2837747753821, syntheticIIPoison: 5.5922684579199,
    magnitudeI: 1.75, magnitudeII: 2, increasedMagnitude100: 4, increasedMagnitude100Poison: 11.18453691584,
    baseDuration: 4.026, supportedDuration: 4.026, poisonDuration: 2, supportedPoisonDuration: 2,
    radius: 18, supportedRadius: 18, mana: 62, supportedMana: 62, rate: 1.2, supportedRate: 1.2,
    poisonChance: 100, supportedPoisonChance: 100, stackLimit: 1, supportedStackLimit: 1,
    combinedPoison: 5.8273875, combinedPoisonDuration: 2, combinedSkillDuration: 5.412, combinedMana: 45, combinedRate: 1.5 },
] as const;

export const poisonBowDeadlyHitControls = [
  { skill: "poisonburst-arrow", component: "Arrow", base: 5.38125, tierI: 3.9375, tierII: 3.80625, hasDefaultPoisonOutput: false },
  { skill: "gas-arrow", component: "Arrow", base: 1.8375, tierI: 1.3125, tierII: 1.3125, hasDefaultPoisonOutput: false },
  { skill: "gas-arrow", component: "Explosion", base: 11.025, tierI: 8.4, tierII: 7.875, hasDefaultPoisonOutput: false },
] as const;

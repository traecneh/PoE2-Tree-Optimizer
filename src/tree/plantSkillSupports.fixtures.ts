// Frozen from the isolated PoB 0.23.1 support tables and MAIN component checks.
export const plantSupportFixtures = [
  { id: "magnified-area-i", effectId: "SupportMagnifiedAreaPlayer", family: "IncreasedAreaOfEffect", amount: 35, kind: "area", manaMultiplier: 30 },
  { id: "magnified-area-ii", effectId: "SupportMagnifiedAreaPlayerTwo", family: "IncreasedAreaOfEffect", amount: 45, kind: "area", manaMultiplier: 30 },
  { id: "prolonged-duration-i", effectId: "ProlongedDurationSupportPlayer", family: "ProlongedDuration", amount: 30, kind: "duration", manaMultiplier: 20 },
  { id: "prolonged-duration-ii", effectId: "ProlongedDurationSupportPlayerTwo", family: "ProlongedDuration", amount: 35, kind: "duration", manaMultiplier: 20 },
  { id: "brutality-i", effectId: "SupportBrutalityPlayer", family: "Brutality", amount: 25, kind: "physical", manaMultiplier: 20 },
  { id: "brutality-ii", effectId: "SupportBrutalityPlayerTwo", family: "Brutality", amount: 30, kind: "physical", manaMultiplier: 20 },
  { id: "brutality-iii", effectId: "SupportBrutalityPlayerThree", family: "Brutality", amount: 30, kind: "physical", manaMultiplier: 20, ignoreReductionChance: 20 },
] as const;

export const plantSupportComponentFixtures = [
  { skill: "entangle", component: "Fissures", radius: 80, magnifiedI: 92, magnifiedII: 96, duration: 8, prolongedI: 10.428, prolongedII: 10.824 },
  { skill: "entangle", component: "Vines", radius: 20, magnifiedI: 23, magnifiedII: 24 },
  { skill: "briarpatch", component: "Briarpatch", radius: 30, magnifiedI: 34, magnifiedII: 36, duration: 6, prolongedI: 7.821, prolongedII: 8.118,
    spiritWithoutSupport: 30, spiritWithAllSevenIndividualSupports: 30 },
  { skill: "thrashing-vines", component: "Thrashing Vines", radius: 25, magnifiedI: 29, magnifiedII: 30, duration: 8, prolongedI: 10.428, prolongedII: 10.824,
    secondaryDuration: 5, secondaryProlongedI: 6.501, secondaryProlongedII: 6.765 },
  { skill: "toxic-domain", component: "Toxic Bloom", radius: 30, magnifiedI: 34, magnifiedII: 36, duration: 8, prolongedI: 10.428, prolongedII: 10.824 },
  { skill: "toxic-domain", component: "Pustule Explosion", radius: 16, magnifiedI: 18, magnifiedII: 19, duration: 8, prolongedI: 10.428, prolongedII: 10.824,
    detonationWithoutSupport: 15, detonationWithProlongedI: 15, detonationWithProlongedII: 15,
    poisonDpsWithoutSupport: 0.8764289602613, poisonDpsWithBrutality: 0 },
] as const;

// Independent allowlist and native outputs from plant-utility-supports-20261108.
export const plantUtilitySupportFixtures = [
  { id: "efficiency-i", effectId: "SupportEfficiencyPlayer", family: "Efficiency", amount: 30, multiplier: 0.7 },
  { id: "efficiency-ii", effectId: "SupportEfficiencyPlayerTwo", family: "Efficiency", amount: 40, multiplier: 0.6 },
  { id: "mobility", effectId: "SupportMobilityPlayer", family: "Mobility", amount: 25, multiplier: 0.75 },
] as const;

export const plantUtilityCompatibilityFixtures = [
  { skill: "entangle", allowed: ["efficiency-i", "efficiency-ii", "mobility"] },
  { skill: "briarpatch", allowed: [] },
  { skill: "thrashing-vines", allowed: ["efficiency-i", "efficiency-ii"] },
  { skill: "toxic-domain", allowed: ["efficiency-i", "efficiency-ii"] },
] as const;

export const plantUtilityCostFixtures = [
  { skill: "entangle", baseline: 95, efficiencyI: 67, efficiencyII: 57 },
  { skill: "thrashing-vines", baseline: 152, efficiencyI: 107, efficiencyII: 92 },
  { skill: "toxic-domain", baseline: 106, efficiencyI: 75, efficiencyII: 64 },
] as const;

export const plantMobilityFixture = { penalty: 70, baselineRetainedSpeed: 30, supportedRetainedSpeed: 47.5,
  globalSpeedBefore: 1, globalSpeedAfter: 1, castRateBefore: 1.1111111111111, castRateAfter: 1.1111111111111 } as const;

// Frozen independently from the 33-case Plant casting review, not app allowlists.
export const plantCastingSkillIds = ["entangle", "thrashing-vines"] as const;
export const plantCastingSupportFixtures = [
  { id: "rapid-casting-i", effectId: "SupportRapidCastingPlayer", family: "RapidCasting", increasedSpeed: 15, manaMultiplier: 100 },
  { id: "rapid-casting-ii", effectId: "SupportRapidCastingPlayerTwo", family: "RapidCasting", increasedSpeed: 20, manaMultiplier: 100 },
  { id: "rapid-casting-iii", effectId: "SupportRapidCastingPlayerThree", family: "RapidCasting", increasedSpeedPerDifferentSpell: 10, windowSeconds: 8, manaMultiplier: 100 },
  { id: "considered-casting", effectId: "SupportConsideredCastingPlayer", family: "ConsideredCasting", moreDamage: 35, lessSpeed: 15, manaMultiplier: 115 },
] as const;

export const plantCastingComponentFixtures = [
  { skill: "entangle", component: "Fissures", castTime: 0.9, baselineRate: 1.1111111111111,
    rapidI: 1.2777777777778, rapidII: 1.3333333333333, rapidIII0: 1.1111111111111, rapidIII1: 1.2222222222222, rapidIII3: 1.4444444444444,
    increased100: 2.2222222222222, increased100WithII: 2.4444444444444, considered: 0.94444444444444,
    rapidIIWithConsidered: 1.1333333333333, rapidIII3WithConsidered: 1.2333333333333,
    baselineCost: 95, rapidCost: 95, consideredCost: 109, baselineDuration: 8.019, supportedDuration: 8.019, vineApplyMs: 100 },
  { skill: "entangle", component: "Vines", castTime: 0.9, baselineRate: 1.1111111111111,
    rapidI: 1.2777777777778, rapidII: 1.3333333333333, rapidIII0: 1.1111111111111, rapidIII1: 1.2222222222222, rapidIII3: 1.4444444444444,
    increased100: 2.2222222222222, increased100WithII: 2.4444444444444, considered: 0.94444444444444,
    rapidIIWithConsidered: 1.1333333333333, rapidIII3WithConsidered: 1.2333333333333,
    baselineCost: 95, rapidCost: 95, consideredCost: 109, vineApplyMs: 100 },
  { skill: "thrashing-vines", component: "Slams", castTime: 1, baselineRate: 1,
    rapidI: 1.15, rapidII: 1.2, rapidIII0: 1, rapidIII1: 1.1, rapidIII3: 1.3,
    increased100: 2, increased100WithII: 2.2, considered: 0.85,
    rapidIIWithConsidered: 1.02, rapidIII3WithConsidered: 1.11,
    baselineCost: 152, rapidCost: 152, consideredCost: 174, baselineDuration: 8.019, supportedDuration: 8.019,
    baselineSecondaryDuration: 5.016, supportedSecondaryDuration: 5.016, minimumChannelTime: 0.5, retargetMs: 500, spawnCastTimePercent: 50 },
] as const;

// Frozen from the isolated 26-case critical-hit / Echo native review.
export const plantCritEchoCompatibilityFixtures = [
  { skill: "entangle", allowed: ["controlled-destruction"] },
  { skill: "thrashing-vines", allowed: ["controlled-destruction", "spell-echo"] },
  { skill: "briarpatch", allowed: [] },
  { skill: "toxic-domain", allowed: [] },
] as const;

export const plantCritEchoSupportFixtures = [
  { id: "controlled-destruction", effectId: "SupportControlledDestructionPlayer", family: "ControlledDestruction", moreHitDamage: 25, cannotCrit: true, manaMultiplier: 100 },
  { id: "spell-echo", effectId: "SupportSpellEchoPlayer", family: "SpellEcho", additionalEchoes: 1, lessCastSpeed: 30, echoAreaIncrease: 40, manaMultiplier: 150 },
] as const;

export const plantCritComponentFixtures = [
  { skill: "entangle", component: "Fissures", baseCrit: 10, highCrit: 100, controlledCrit: 0, controlledHighCrit: 0, baselineRate: 1.1111111111111,
    controlledRate: 1.1111111111111, baselineCost: 95, controlledCost: 95, echoApplied: false, echoRate: 1.1111111111111, echoCost: 95, echoRepeats: 1 },
  { skill: "entangle", component: "Vines", baseCrit: 10, highCrit: 100, controlledCrit: 0, controlledHighCrit: 0, baselineRate: 1.1111111111111,
    controlledRate: 1.1111111111111, baselineCost: 95, controlledCost: 95, echoApplied: false, echoRate: 1.1111111111111, echoCost: 95, echoRepeats: 1 },
  { skill: "thrashing-vines", component: "Slams", baseCrit: 10, highCrit: 100, controlledCrit: 0, controlledHighCrit: 0, baselineRate: 1,
    controlledRate: 1, baselineCost: 152, controlledCost: 152, echoApplied: true, echoRate: 0.7, echoCost: 228, echoRepeats: 2 },
] as const;

export const plantEchoAreaFixture = { radius: 25, noneRadius: 25, averageRadius: 27, finalRadius: 29, echoOnlyAreaIncrease: 40,
  durationBefore: 8.019, durationWithEcho: 8.019, secondaryBefore: 5.016, secondaryWithEcho: 5.016 } as const;

// Independent generated-source facts and frozen PoB 0.23.1 observations.
export const poisonBowLongshotSupportFixtures = [
  { id: "longshot-i", name: "Longshot I", effectId: "SupportFarCombatPlayer", family: "Longshot", maxMore: 25, manaMultiplier: 20, catalogTier: 2 },
  { id: "longshot-ii", name: "Longshot II", effectId: "SupportFarCombatPlayerTwo", family: "Longshot", maxMore: 35, manaMultiplier: 20, catalogTier: 3 },
] as const;

export const poisonBowLongshotDistanceFixtures = [
  { metres: 2, nativeUnits: 20, ramp: 0, rawMore: [0, 0], nativeFactors: [1, 1] },
  { metres: 3.5, nativeUnits: 35, ramp: 0, rawMore: [0, 0], nativeFactors: [1, 1] },
  { metres: 5.25, nativeUnits: 52.5, ramp: 0.5, rawMore: [12.5, 17.5], nativeFactors: [1.13, 1.18] },
  { metres: 7, nativeUnits: 70, ramp: 1, rawMore: [25, 35], nativeFactors: [1.25, 1.35] },
  { metres: 12, nativeUnits: 120, ramp: 1, rawMore: [25, 35], nativeFactors: [1.25, 1.35] },
] as const;

// Full-range baseline/I/II. Native synthetic fields do not establish real burst/cloud hits.
export const poisonBowLongshotComponentFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, ranges: [[16, 25], [21, 31], [22, 33]], hits: [5.38125, 6.825, 7.21875] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, ranges: [[16, 25], [21, 31], [22, 33]], hits: [5.38125, 6.825, 7.21875] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, ranges: [[6, 8], [7, 11], [8, 11]], hits: [1.8375, 2.3625, 2.49375] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, ranges: [[13, 20], [16, 25], [18, 26]], hits: [4.33125, 5.38125, 5.775] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, ranges: [[17, 25], [21, 31], [23, 34]], hits: [22.05, 27.3, 29.925] },
] as const;

export const poisonBowLongshotPoisonFixtures = [
  { skill: "poisonburst-arrow", nearPoison: 5.385766215481, midpointPoison: [6.0869320057983, 6.2698448206637],
    midpointRanges: [[19, 28], [19, 29]], fullPoison: [6.7372886808752, 7.1539234258464],
    beyondBasePoison: 5.1407527211226, beyondPoison: [6.4383799818633, 6.8342289494255],
    roll: 78.260869565217, potential: 3.6, duration: 3, skillTimer: 3.003, radius: 24,
    mana: [38, 45, 45], efficiencyMana: [23, 27, 27], arrowPoisonMana: [45, 54, 54],
    arrowPoison: [4.5657724526838, 5.7634096883494, 6.1040865559727],
    restrictedNearPoison: 5.1407527211226, restrictedFarPoison: 4.403916, restrictedFarPotential: 0.792 },
  { skill: "gas-arrow", nearPoison: 4.0038541776187, midpointPoison: [4.4501854629926, 4.6077141519481],
    midpointRanges: [[15, 22], [15, 23]], fullPoison: [4.9884084835905, 5.2772110800089],
    beyondBasePoison: 3.8503496414138, beyondPoison: [4.7952033117092, 5.0834829900936],
    roll: 70.588235294118, potential: 2.4, duration: 2, skillTimer: 4.026, radius: 18,
    mana: [62, 74, 74], efficiencyMana: [38, 45, 45], arrowPoisonMana: [74, 89, 89],
    arrowPoison: [1.5383141032889, 2.005427746525, 2.0932310629227],
    restrictedNearPoison: 3.8503496414138, restrictedFarPoison: 2.3487552, restrictedFarPotential: 0.528 },
] as const;

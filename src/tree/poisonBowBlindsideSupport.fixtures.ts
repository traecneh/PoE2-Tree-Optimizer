// Independent generated-source facts and isolated PoB 0.23.1 observations, not production metadata imports.
export const poisonBowBlindsideSupportFixture = {
  id: "blindside", name: "Blindside", effectId: "SupportBlindsidePlayer", family: "Blindside",
  moreCriticalChance: 15, moreCriticalDamageBonus: 15, manaMultiplier: 20, prohibitsBlind: true,
} as const;

export const poisonBowBlindsideCritFixture = {
  offMore: [1, 1], onMore: [1.15, 1.15], preChance: [5, 5.75], effectiveChance: [4.6, 5.29],
  hitChance: 92, totalCritMultiplier: [2, 2.15], critEffect: [1.046, 1.060835],
  noCritChance: [0, 0], noCritEffect: [1, 1], blindChanceAlone: [0, 0],
  rawBlindChanceWithBlindI: 100, rawBlindChanceWithBlindII: 100,
  rawPairedBlindIIOffEffect: 20, rawPairedBlindIIOnHitChance: 93,
  nativeBlindProhibitionMapped: false,
} as const;

// Arrays: Blind off; external base Blind on without Blindside; external base Blind on with Blindside.
export const poisonBowBlindsideComponentFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, baseMana: 38, sideMana: 45,
    physical: 5.125, fire: 0, averageHit: [5.345375, 5.36075, 5.436779375], totalDPS: [5.516427, 5.918268, 6.00220443],
    explicitCritHit: 5.436779375, neverCritHit: [5.125, 5.125], neverCritDPS: [5.658, 5.658] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, baseMana: 38, sideMana: 45,
    physical: 5.125, fire: 0, averageHit: [5.345375, 5.36075, 5.436779375], totalDPS: [5.516427, 5.918268, 6.00220443],
    explicitCritHit: 5.436779375, neverCritHit: [5.125, 5.125], neverCritDPS: [5.658, 5.658] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, baseMana: 62, sideMana: 74,
    physical: 1.75, fire: 0, averageHit: [1.82525, 1.8305, 1.85646125], totalDPS: [1.883658, 2.020872, 2.04953322],
    explicitCritHit: 1.85646125, neverCritHit: [1.75, 1.75], neverCritDPS: [1.932, 1.932] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, baseMana: 62, sideMana: 74,
    physical: 4.125, fire: 0, averageHit: [4.302375, 4.31475, 4.375944375], totalDPS: [4.440051, 4.763484, 4.83104259],
    explicitCritHit: 4.375944375, neverCritHit: [4.125, 4.125], neverCritDPS: [4.554, 4.554] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, baseMana: 62, sideMana: 74,
    physical: 0, fire: 21, averageHit: [21.903, 21.966, 22.277535], totalDPS: [22.603896, 24.250464, 24.59439864],
    explicitCritHit: 22.277535, neverCritHit: [21, 21], neverCritDPS: [23.184, 23.184] },
] as const;

export const poisonBowBlindsidePoisonFixtures = [
  { skill: "poisonburst-arrow", offPoison: [5.1407527211226, 5.1407527211226], onPoison: [5.2443412172508, 5.4507174778217],
    explicitCritPoison: 5.4507174778217, neverCritPoison: [4.582560296846, 4.582560296846],
    magnitude: [1, 1], chance: [100, 100], stacks: [1, 1], duration: [3, 3], skillDuration: [3.003, 3.003],
    arrowOffPoison: [4.4181304728428, 4.4181304728428], arrowOnPoison: [4.4813157279847, 4.5633485510359],
    arrowChance: [60, 60], arrowDuration: [2, 2], bothPoisonCost: 54, bothBlindCost: [50, 50] },
  { skill: "gas-arrow", offPoison: [3.8503496414138, 3.8503496414138], onPoison: [3.9155138751918, 4.0270279561623],
    explicitCritPoison: 4.0270279561623, neverCritPoison: [3.5635910224439, 3.5635910224439],
    magnitude: [1, 1], chance: [100, 100], stacks: [1, 1], duration: [2, 2], skillDuration: [4.026, 4.026],
    arrowOffPoison: [1.4965946562522, 1.4965946562522], arrowOnPoison: [1.5143051909483, 1.5420253377344],
    arrowChance: [60, 60], arrowDuration: [2, 2], bothPoisonCost: 89, bothBlindCost: [81, 81] },
] as const;

// Independent generated-source facts and isolated PoB 0.23.1 observations.
export const poisonBowHeftSupportFixture = {
  id: "heft", name: "Heft", effectId: "SupportHeftPlayer", family: "Heft", catalogTier: 5,
  maximumPhysicalMore: 30, manaMultiplier: 20, sourceStat: "support_heft_maximum_physical_damage_+%_final",
} as const;

// Ranges are native stored Physical hit sources, not a real extra burst/cloud hit.
export const poisonBowHeftComponentFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, range: [16, 25], heftRange: [16, 32], hit: [5.38125, 6.3], wholePhysicalHit: 6.95625 },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, range: [16, 25], heftRange: [16, 32], hit: [5.38125, 6.3], wholePhysicalHit: 6.95625 },
  { skill: "gas-arrow", component: "arrow", actualHit: true, range: [6, 8], heftRange: [6, 11], hit: [1.8375, 2.23125], wholePhysicalHit: 2.3625 },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, range: [13, 20], heftRange: [13, 26], hit: [4.33125, 5.11875], wholePhysicalHit: 5.64375 },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, range: [0, 0], heftRange: [0, 0], hit: [22.05, 22.05], wholePhysicalHit: 22.05 },
] as const;

export const poisonBowHeftPoisonFixtures = [
  { skill: "poisonburst-arrow", sourceMin: 16, sourceMax: [25, 32], poison: [5.385766215481, 6.6661559195387], wholePhysicalPoison: 6.9202014957406,
    roll: 78.260869565217, potential: 3.6, duration: 3, skillTimer: 3.003, radius: 24,
    baseMana: 38, heftMana: 45, poisonIIIMana: 54, efficiencyMana: [23, 27],
    arrowPoisonIII: [4.5657724526838, 5.4508298819733], chaosRange: [110, 110], withChaos: [31.095178527116, 32.375568231174],
    deadlyRange: [12, 17], heftDeadlyRange: [12, 22], deadlyPoison: [7.4384544711926, 9.2675826198465] },
  { skill: "gas-arrow", sourceMin: 13, sourceMax: [20, 26], poison: [4.0038541776187, 4.9490263113517], wholePhysicalPoison: 5.2115741262775,
    roll: 70.588235294118, potential: 2.4, duration: 2, skillTimer: 4.026, radius: 18,
    baseMana: 62, heftMana: 74, poisonIIIMana: 89, efficiencyMana: [38, 45],
    arrowPoisonIII: [1.5383141032889, 1.9176244301272], chaosRange: [87, 87], withChaos: [23.419265091383, 24.364437225116],
    deadlyRange: [9, 14], heftDeadlyRange: [9, 18], deadlyPoison: [5.5922684579199, 6.8524979695639] },
] as const;

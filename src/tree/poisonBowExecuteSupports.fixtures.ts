// Independent generated-source facts and unmodified frozen PoB 0.23.1 outputs.
export const poisonBowExecuteSupportFixtures = [
  { id: "execute-i", name: "Execute I", effectId: "SupportExecutePlayer", family: "Execute", moreHit: 40, manaMultiplier: 10, catalogTier: 1 },
  { id: "execute-ii", name: "Execute II", effectId: "SupportExecutePlayerTwo", family: "Execute", moreHit: 50, manaMultiplier: 10, catalogTier: 4 },
] as const;

// Baseline/I/II with enemy Low Life enabled. Outside it all damage equals baseline.
// Synthetic source fields are not proof of real burst/cloud hits or combat uptime.
export const poisonBowExecuteComponentFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, ranges: [[16, 25], [23, 35], [25, 37]], hits: [5.38125, 7.6125, 8.1375] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, ranges: [[16, 25], [23, 35], [25, 37]], hits: [5.38125, 7.6125, 8.1375] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, ranges: [[6, 8], [8, 12], [8, 13]], hits: [1.8375, 2.625, 2.75625] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, ranges: [[13, 20], [18, 27], [20, 29]], hits: [4.33125, 5.90625, 6.43125] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, ranges: [[17, 25], [24, 35], [26, 38]], hits: [22.05, 30.975, 33.6] },
] as const;

export const poisonBowExecutePoisonFixtures = [
  { skill: "poisonburst-arrow", poison: [5.385766215481, 7.5705581708176, 8.0380020310291], roll: 78.260869565217,
    arrowPoison: [4.5657724526838, 6.444763423596, 6.8732436076171], arrowRoll: 59.016393442623,
    mana: [38, 41, 41], arrowPoisonMana: [45, 50, 50], efficiencyMana: [23, 25, 25],
    duration: 3, skillTimer: 3.003, radius: 24, potential: 3.6 },
  { skill: "gas-arrow", poison: [4.0038541776187, 5.4347397689644, 5.8810710543383], roll: 70.588235294118,
    arrowPoison: [1.5383141032889, 2.2196678385355, 2.3461046141483], arrowRoll: 59.016393442623,
    mana: [62, 68, 68], arrowPoisonMana: [74, 81, 81], efficiencyMana: [38, 41, 41],
    duration: 2, skillTimer: 4.026, radius: 18, potential: 2.4 },
] as const;

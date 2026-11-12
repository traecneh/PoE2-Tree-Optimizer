// Independent generated-source facts and unmodified frozen PoB 0.23.1 outputs.
export const poisonBowExecuteThreeSupportFixture = {
  id: "execute-iii", name: "Execute III", effectId: "SupportExecutePlayerThree", family: "Execute",
  enemyMoreHit: 30, playerMoreHit: 30, manaMultiplier: 10, catalogTier: 5,
} as const;

export const poisonBowExecuteThreeConditions = [
  { label: "neither", enemyLowLife: false, playerLowLife: false, factor: 1 },
  { label: "enemy only", enemyLowLife: true, playerLowLife: false, factor: 1.3 },
  { label: "player only", enemyLowLife: false, playerLowLife: true, factor: 1.3 },
  { label: "both", enemyLowLife: true, playerLowLife: true, factor: 1.69 },
] as const;

// Neither/one/both conditions; the two single-condition native results are equal.
// Synthetic source fields do not establish actual burst/cloud hits.
export const poisonBowExecuteThreeComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, ranges: [[16, 25], [21, 32], [28, 42]], hits: [5.38125, 6.95625, 9.1875] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, ranges: [[16, 25], [21, 32], [28, 42]], hits: [5.38125, 6.95625, 9.1875] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, ranges: [[6, 8], [7, 11], [10, 14]], hits: [1.8375, 2.3625, 3.15] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, ranges: [[13, 20], [17, 26], [22, 33]], hits: [4.33125, 5.64375, 7.21875] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, ranges: [[17, 25], [22, 33], [29, 42]], hits: [22.05, 28.875, 37.275] },
] as const;

export const poisonBowExecuteThreePoisonFixtures = [
  { skill: "poisonburst-arrow", poison: [5.385766215481, 6.9202014957406, 9.1049934510772], roll: 78.260869565217,
    arrowPoison: [4.5657724526838, 5.8898464639622, 7.7688374348743], arrowRoll: 59.016393442623,
    baseMana: 38, manaByState: [41, 41, 41, 41], baseArrowPoisonMana: 45, arrowPoisonMana: 50,
    baseEfficiencyMana: 23, efficiencyMana: 25, duration: 3, skillTimer: 3.003, radius: 24 },
  { skill: "gas-arrow", poison: [4.0038541776187, 5.2115741262775, 6.6424597176232], roll: 70.588235294118,
    arrowPoison: [1.5383141032889, 2.005427746525, 2.6481480225566], arrowRoll: 59.016393442623,
    baseMana: 62, manaByState: [68, 68, 68, 68], baseArrowPoisonMana: 74, arrowPoisonMana: 81,
    baseEfficiencyMana: 38, efficiencyMana: 41, duration: 2, skillTimer: 4.026, radius: 18 },
] as const;

// Independent frozen PoB 0.23.1 observations: empty Witch, Physical Crude Bow.
export const poisonBowMultishotSupportFixtures = [
  { id: "multishot-i", name: "Multishot I", effectId: "SupportMultishotPlayer", family: "AdditionalProjectiles", catalogTier: 1, lessDamage: 35, lessSpeed: 20, extraProjectiles: 2, line: 3135 },
  { id: "multishot-ii", name: "Multishot II", effectId: "SupportMultishotPlayerTwo", family: "AdditionalProjectiles", catalogTier: 2, lessDamage: 25, lessSpeed: 20, extraProjectiles: 2, line: 3179 },
] as const;

// Baseline / I / II. Burst/cloud source fields are not real contacts.
export const poisonBowMultishotComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, hits: [5.38125,3.54375,3.9375], ranges: [[16,25],[11,16],[12,18]] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, hits: [5.38125,3.54375,3.9375], ranges: [[16,25],[11,16],[12,18]] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, hits: [1.8375,1.18125,1.3125], ranges: [[6,8],[4,5],[4,6]] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, hits: [4.33125,2.8875,3.28125], ranges: [[13,20],[9,13],[10,15]] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, hits: [22.05,14.175,16.8], ranges: [[17,25],[11,16],[13,19]] },
] as const;

export const poisonBowMultishotSources = [
  { skill: "poisonburst-arrow", poison: [5.385766215481,3.3463338734543,3.7426411086426],
    roll: [78.260869565217,74.226804123711,74.226804123711], potential: [3.6,2.88,2.88],
    damageOnly: [3.4855053054905,3.9021400504617], speedOnly: 5.1590290971264, projectilesOnly: 5.385766215481,
    arrowPoison: [4.5657724526838,2.8922628169825,3.2169446716751], mana: 38, efficiencyMana: 23, poisonIIIMana: 45,
    duration: 3, timer: 3.003, radius: 24 },
  { skill: "gas-arrow", poison: [4.0038541776187,2.5441832166601,2.9067817669733],
    roll: [70.588235294118,65.753424657534,65.753424657534], potential: [2.4,1.92,1.92],
    damageOnly: [2.6386055400045,3.0192998716469], speedOnly: 3.8507366706811, projectilesOnly: 4.0038541776187,
    arrowPoison: [1.5383141032889,.95910862645248,1.0723148905584], mana: 62, efficiencyMana: 38, poisonIIIMana: 74,
    duration: 2, timer: 4.026, radius: 18 },
] as const;

// Independent frozen PoB 0.23.1 observations. Prior-pierce counters are scenarios,
// not contacts, Poison applications or a verified live-game cumulative formula.
export const poisonBowPierceSupportFixtures = [
  { id: "pierce-i", name: "Pierce I", effectId: "SupportPiercePlayer", family: "Pierce", tier: 1, catalogTier: 1, pierces: 1, penalty: 20, line: 3648 },
  { id: "pierce-ii", name: "Pierce II", effectId: "SupportPiercePlayerTwo", family: "Pierce", tier: 2, catalogTier: 3, pierces: 1, penalty: 0, line: 3680 },
  { id: "pierce-iii", name: "Pierce III", effectId: "SupportPiercePlayerThree", family: "Pierce", tier: 3, catalogTier: 5, pierces: "all", penalty: 20, line: 3711 },
] as const;

// Columns: no prior pierce, native 0.8 modifier, native 0.6 modifier.
export const poisonBowPierceComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, hits: [5.38125,4.33125,3.28125], ranges: [[16,25],[13,20],[10,15]] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, hits: [5.38125,4.33125,3.28125], ranges: [[16,25],[13,20],[10,15]] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, hits: [1.8375,1.575,1.05], ranges: [[6,8],[5,7],[3,5]] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, hits: [4.33125,3.4125,2.625], ranges: [[13,20],[10,16],[8,12]] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, hits: [22.05,17.85,13.125], ranges: [[17,25],[14,20],[10,15]] },
] as const;

export const poisonBowPierceSources = [
  { skill: "poisonburst-arrow", roll: 78.260869565217, poison: [5.385766215481,4.3187747954328,3.2517833753847],
    arrowPoison: [4.5657724526838,3.6701786254266], mana: 38, efficiencyMana: 23, poisonIIIMana: 45,
    duration: 3, timer: 3.003, radius: 24 },
  { skill: "gas-arrow", roll: 70.588235294118, poison: [4.0038541776187,3.1768285606024,2.4154398973175],
    arrowPoison: [1.5383141032889,1.3240740112783], mana: 62, efficiencyMana: 38, poisonIIIMana: 74,
    duration: 2, timer: 4.026, radius: 18 },
] as const;

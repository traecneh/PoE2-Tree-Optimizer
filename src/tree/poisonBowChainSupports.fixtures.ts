// Independent frozen PoB 0.23.1 observations, empty Witch and Physical Crude Bow.
// Chain's hit penalty changes the eligible source once, not a second Poison modifier.
export const poisonBowChainSupportFixtures = [
  { id: "chain-i", name: "Chain I", effectId: "SupportChainPlayer", family: "Chain", chains: 1, lessHit: 30, catalogTier: 1, line: 808 },
  { id: "chain-ii", name: "Chain II", effectId: "SupportChainPlayerTwo", family: "Chain", chains: 2, lessHit: 50, catalogTier: 2, line: 844 },
  { id: "chain-iii", name: "Chain III", effectId: "SupportChainPlayerThree", family: "Chain", chains: 2, lessHit: 40, catalogTier: 5, line: 880 },
] as const;

// Baseline / I / II / III. Source fields for the burst/cloud are not real hits.
export const poisonBowChainComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, hits: [5.38125,3.80625,2.625,3.28125], ranges: [[16,25],[12,17],[8,12],[10,15]] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, hits: [5.38125,3.80625,2.625,3.28125], ranges: [[16,25],[12,17],[8,12],[10,15]] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, hits: [1.8375,1.3125,.91875,1.05], ranges: [[6,8],[4,6],[3,4],[3,5]] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, hits: [4.33125,3.01875,2.23125,2.625], ranges: [[13,20],[9,14],[7,10],[8,12]] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, hits: [22.05,15.75,11.55,13.125], ranges: [[17,25],[12,18],[9,13],[10,15]] },
] as const;

export const poisonBowChainSources = [
  { skill: "poisonburst-arrow", roll: 78.260869565217, poison: [5.385766215481,3.7192272355963,2.6014267003078,3.2517833753847],
    arrowPoison: [4.5657724526838,3.2030649821905,2.2196678385355,2.7745847981694],
    hitMore: [.7,.5,.6], nonHitMore: [1,1,1], mana: 38, efficiencyMana: 23, poisonIIIMana: 45,
    duration: 3, timer: 3.003, radius: 24 },
  { skill: "gas-arrow", roll: 70.588235294118, poison: [4.0038541776187,2.79613422896,2.0347455656751,2.4154398973175],
    arrowPoison: [1.5383141032889,1.1098339192678,.76915705164443,.89559382725721],
    hitMore: [.7,.5,.6], nonHitMore: [1,1,1], mana: 62, efficiencyMana: 38, poisonIIIMana: 74,
    duration: 2, timer: 4.026, radius: 18 },
] as const;

// Independent frozen PoB 0.23.1 observations: explicit Moved2m off/on, empty Witch and Physical Crude Bow.
export const poisonBowMomentumSupportFixture = {
  id: "momentum", name: "Momentum", effectId: "SupportMomentumPlayer", family: "Momentum", catalogTier: 2,
  distanceMetres: 2, moreDamage: 40, manaMultiplier: 20, line: 3098,
} as const;

export const poisonBowMomentumComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, hits: [5.38125,5.38125,7.6125], ranges: [[16,25],[23,35]] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, hits: [5.38125,5.38125,7.6125], ranges: [[16,25],[23,35]] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, hits: [1.8375,1.8375,2.625], ranges: [[6,8],[8,12]] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, hits: [4.33125,4.33125,5.90625], ranges: [[13,20],[18,27]] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, hits: [22.05,22.05,30.975], ranges: [[17,25],[24,35]] },
] as const;

export const poisonBowMomentumSources = [
  { skill: "poisonburst-arrow", poison: [5.385766215481,5.385766215481,7.5705581708176], poisonIII: [4.5657724526838,6.444763423596],
    deliberation: [6.5035667507695,6.5035667507695,8.9220806362119], deliberationRanges: [[20,30],[28,41]],
    mana: 38, momentumMana: 45, efficiencyMana: 27, poisonIIIMana: 54, duration: 3, timer: 3.003, radius: 24 },
  { skill: "gas-arrow", poison: [4.0038541776187,4.0038541776187,5.4347397689644], poisonIII: [1.5383141032889,2.2196678385355],
    deliberation: [4.8308797946351,4.8308797946351,6.6424597176232], deliberationRanges: [[16,24],[22,33]],
    mana: 62, momentumMana: 74, efficiencyMana: 45, poisonIIIMana: 89, duration: 2, timer: 4.026, radius: 18 },
] as const;

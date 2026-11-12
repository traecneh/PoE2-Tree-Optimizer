// Independent PoB 0.23.1 observations: level-20/quality-0 skill, empty Witch,
// Physical Crude Bow. Combined counters are arithmetic scenarios, not collisions.
export const poisonBowForkSupportFixture = {
  id: "fork", name: "Fork", effectId: "SupportForkPlayer", family: "Fork", catalogTier: 3,
  afterForkLess: 30, manaMultiplier: 10, maxForks: 1, terrainAttachmentStat: 100,
} as const;

// Columns: baseline, configured post-fork, configured post-fork + post-pierce I/III.
export const poisonBowForkComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,hits: [5.38125,3.80625,3.01875],ranges: [[16,25],[12,17],[9,14]] },
  { skill: "poisonburst-arrow",component: "burst source",actualHit: false,hits: [5.38125,3.80625,3.01875],ranges: [[16,25],[12,17],[9,14]] },
  { skill: "gas-arrow",component: "arrow",actualHit: true,hits: [1.8375,1.3125,1.05],ranges: [[6,8],[4,6],[3,5]] },
  { skill: "gas-arrow",component: "cloud source",actualHit: false,hits: [4.33125,3.01875,2.3625],ranges: [[13,20],[9,14],[7,11]] },
  { skill: "gas-arrow",component: "conditional Fire explosion",actualHit: true,hits: [22.05,15.75,12.6],ranges: [[17,25],[12,18],[10,14]] },
] as const;

export const poisonBowForkSources = [
  { skill: "poisonburst-arrow",roll: 78.260869565217,poison: [5.385766215481,3.7192272355963,3.018061445279],
    mana: [38,41],efficiencyMana: [23,25],poisonIIIMana: [45,50],arrowPoison: [4.5657724526838,3.2030649821905],
    duration: 3,timer: 3.003,radius: 24 },
  { skill: "gas-arrow",roll: 70.588235294118,poison: [4.0038541776187,2.79613422896,2.1922742546306],
    mana: [62,68],efficiencyMana: [38,41],poisonIIIMana: [74,81],arrowPoison: [1.5383141032889,1.1098339192678],
    duration: 2,timer: 4.026,radius: 18 },
] as const;

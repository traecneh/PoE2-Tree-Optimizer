// Frozen PoB 0.23.1, empty Witch, level-20/quality-0 skill, Physical Crude Bow.
// Explicit Wither counters are scenarios, never measured application or uptime.
export const poisonBowWitheringTouchSupportFixture = {
  id: "withering-touch", name: "Withering Touch", effectId: "SupportWitheringTouchPlayer", family: "WitheringTouch",
  catalogTier: 1, lessDamage: 25, witherBaseMs: 4000, chancePerThreshold: 175, manaMultiplier: 0,
  chanceCanSurpass100: true, takenPerStack: 5, modeledStackCap: 10,
} as const;

export const poisonBowWitheringComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, hits: [5.38125, 3.9375], source: [[16,25],[12,18]], chaosHit: [0,0] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, hits: [5.38125, 3.9375], source: [[16,25],[12,18]], chaosHit: [0,0] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, hits: [1.8375, 1.3125], source: [[6,8],[4,6]], chaosHit: [0,0] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, hits: [4.33125, 3.28125], source: [[13,20],[10,15]], chaosHit: [0,0] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, hits: [22.05, 16.8], source: [[17,25],[13,19]], chaosHit: [0,0] },
] as const;

export const poisonBowWitheringSources = [
  { skill: "poisonburst-arrow", roll: 78.260869565217, poison: [5.385766215481,3.9021400504617],
    explicitStacks: [4.0972470529848,5.8532100756925,5.8532100756925], mixedPoison: [3.9021400504617,3.018061445279],
    mana: 38, mixedMana: 45, efficiencyMana: 23, poisonIIIMana: 45, poisonIIIChance: 60, poisonIIIDuration: 2,
    duration: 3, timer: 3.003, radius: 24 },
  { skill: "gas-arrow", roll: 70.588235294118, poison: [4.0038541776187,3.0192998716469],
    explicitStacks: [3.1702648652293,4.5289498074704,4.5289498074704], mixedPoison: [3.0192998716469,2.1922742546306],
    mana: 62, mixedMana: 74, efficiencyMana: 38, poisonIIIMana: 74, poisonIIIChance: 60, poisonIIIDuration: 2,
    duration: 2, timer: 4.026, radius: 18 },
] as const;

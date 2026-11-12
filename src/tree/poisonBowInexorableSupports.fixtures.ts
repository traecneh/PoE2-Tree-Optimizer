// Independent frozen PoB 0.23.1 snapshots, not simulated reset cycles or live critical uptime.
export const poisonBowInexorableSupportFixtures = [
  { id: "inexorable-critical-i", name: "Inexorable Critical I", effectId: "SupportInevitableCriticalsPlayer", family: "InexorableCritical", catalogTier: 3,
    chancePerSecond: 10, chanceCap: 100, lessBonusPerSecond: 0, lessBonusCap: 0, line: 5938 },
  { id: "inexorable-critical-ii", name: "Inexorable Critical II", effectId: "SupportInevitableCriticalsPlayerTwo", family: "InexorableCritical", catalogTier: 4,
    chancePerSecond: 40, chanceCap: 200, lessBonusPerSecond: 10, lessBonusCap: 50, line: 5979 },
] as const;

// Hits: baseline/reset, I at 2s, I capped, II at 2s, II capped. Scalar probes cover 5s.
export const poisonBowInexorableComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, range: [16,25], hits: [5.38125,5.4325,5.6375,5.494,5.509375], scalar5: 5.509375 },
  { skill: "poisonburst-arrow", component: "no-hit burst source", actualHit: false, range: [16,25], hits: [5.38125,5.4325,5.6375,5.494,5.509375], scalar5: 5.509375 },
  { skill: "gas-arrow", component: "arrow", actualHit: true, range: [6,8], hits: [1.8375,1.855,1.925,1.876,1.88125], scalar5: 1.88125 },
  { skill: "gas-arrow", component: "no-hit cloud source", actualHit: false, range: [13,20], hits: [4.33125,4.3725,4.5375,4.422,4.434375], scalar5: 4.434375 },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, range: [17,25], hits: [22.05,22.26,23.1,22.512,22.575], scalar5: 22.575 },
] as const;

export const poisonBowInexorableSources = [
  { skill: "poisonburst-arrow", duration: 3, mana: 38, supportedMana: 45, combinedPoisonMana: 54,
    poisonI: [5.385766215481,5.528988851137,5.7365175925189,6.0634684714579],
    poisonII: [5.385766215481,5.6701219104496,5.6293652774555],
    superPoison: [6.4492820501001,6.3085793324403], neverPoison: 4.6086956521739,
    arrowPoison: [4.5657724526838,4.7149179699004,4.7069798060107] },
  { skill: "gas-arrow", duration: 2, mana: 62, supportedMana: 74, combinedPoisonMana: 89,
    poisonI: [4.0038541776187,4.0834147359121,4.2005518211566,4.3899456363791],
    poisonII: [4.0038541776187,4.1696946617191,4.1676884390039],
    superPoison: [4.5785941777066,4.5362553895401], neverPoison: 3.5882352941176,
    arrowPoison: [1.5383141032889,1.5885646698587,1.5858901192559] },
] as const;

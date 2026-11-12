// Independent frozen PoB 0.23.1 observations. Gas has Limit; Poisonburst does not.
export const poisonBowOverabundanceSupportFixtures = [
  { id: "overabundance-i", name: "Overabundance I", effectId: "SupportIncreaseLimitPlayer", family: "Overabundance", catalogTier: 1, lessDuration: 50, durationMore: .5, seconds: 2, nativeDuration: 2.013, line: 3380 },
  { id: "overabundance-ii", name: "Overabundance II", effectId: "SupportIncreaseLimitPlayerTwo", family: "Overabundance", catalogTier: 4, lessDuration: 40, durationMore: .6, seconds: 2.4, nativeDuration: 2.409, line: 3416 },
] as const;

export const gasArrowOverabundanceComponents = [
  { component: "arrow", hits: [1.8375,1.8375,1.8375], range: [6,8] },
  { component: "no-hit cloud source", hits: [4.33125,4.33125,4.33125], range: [13,20] },
  { component: "conditional Fire explosion", hits: [22.05,22.05,22.05], range: [17,25] },
] as const;

export const gasArrowOverabundanceNative = {
  baseLimit: 6, addedLimit: 1, sourceSeconds: 4, duration: [4.026,2.013,2.409],
  poison: [4.0038541776187,4.0038541776187,4.0038541776187], poisonDuration: [2,2,2], poisonStackLimit: [1,1,1],
  mana: [62,62,62], efficiencyMana: [38,38,38], prolongedMana: [74,74,74], poisonIIIMana: [74,74,74],
  prolongedDuration: [5.412,2.739,3.267], prolongedMore: [1.35,.68,.81],
  compressedDuration: [2.607,1.32,1.584], compressedMore: [.65,.33,.39],
  novaCooldown: [8.019,8,8], novaStoredUses: [1,2,2], novaPoison: [.44519266741489,.44625,.44625],
} as const;

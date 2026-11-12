// Independent frozen PoB 0.23.1 observations; data describes behavior the runtime only partly maps.
export const poisonBowSalvoSupportFixture = {
  id: "salvo", name: "Salvo", effectId: "SupportSalvoPlayer", family: "Seal", additionalFamilies: ["AdditionalProjectiles"],
  catalogTier: 3, intervalMs: 1000, maximumSeals: 6, projectilesPerSeal: 1, randomDirections: true, line: 5032,
} as const;

export const poisonBowSalvoComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, hits: [5.38125,5.38125], range: [16,25] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, hits: [5.38125,5.38125], range: [16,25] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, hits: [1.8375,1.8375], range: [6,8] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, hits: [4.33125,4.33125], range: [13,20] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, hits: [22.05,22.05], range: [17,25] },
] as const;

export const poisonBowSalvoSources = [
  { skill: "poisonburst-arrow", poison: [5.385766215481,5.385766215481], rapidPoison: [5.6358581778053,5.6358581778053],
    nativeSealMax: 6, nativeSealTimer: 0, nativeProjectiles: 1, mana: 38, efficiencyMana: 23, poisonIIIMana: 45, duration: 3, timer: 3.003, radius: 24 },
  { skill: "gas-arrow", poison: [4.0038541776187,4.0038541776187], rapidPoison: [4.17058125,4.17058125],
    nativeSealMax: 6, nativeSealTimer: 0, nativeProjectiles: 1, mana: 62, efficiencyMana: 38, poisonIIIMana: 74, duration: 2, timer: 4.026, radius: 18 },
] as const;

// Independent source facts and isolated PoB 0.23.1 observations; no runtime/network dependency in tests.
export const poisonBowCullingSupportFixtures = [
  { id: "culling-strike-i", name: "Culling Strike I", effectId: "SupportCullingStrikePlayer", family: "CullingStrike", thresholdBuff: 0, buffSeconds: 0, manaMultiplier: 0 },
  { id: "culling-strike-ii", name: "Culling Strike II", effectId: "SupportCullingStrikePlayerTwo", family: "CullingStrike", thresholdBuff: 20, buffSeconds: 20, manaMultiplier: 0 },
] as const;

// Rarity arrays are Normal, Rare, Unique. The custom +20% control is NOT the native Tier II effect.
export const poisonBowCullingRarityFixture = {
  rarity: ["Normal", "Rare", "Unique"], rareOrUnique: [false, true, true], unique: [false, false, true],
  canCull: [false, true, true], tier1Threshold: [0, 10, 5], tier2Threshold: [0, 10, 5], tier2Increase: [0, 0, 0],
  multiplier: [1, 1.1111111111111, 1.0526315789474], explicitIncrease: 20, explicitThreshold: [12, 6],
  genericConstants: { Normal: 35, Magic: 20, Rare: 10, Unique: 5 },
} as const;

export const poisonBowCullingNativeFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, mana: 38, tierMana: [38, 38], hit: [5.38125, 5.38125, 5.38125],
    tier1Hit: [5.38125, 5.38125, 5.38125], tier2Hit: [5.38125, 5.38125, 5.38125],
    baselineCombined: [6.4575, 6.4575, 6.4575], tier1Combined: [6.4575, 7.175, 6.7973684210526], tier2Combined: [6.4575, 7.175, 6.7973684210526],
    tier1Culling: [0, .7175, .33986842105263], tier2Culling: [0, .7175, .33986842105263], hasPoison: [false, false, false] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, mana: 38, tierMana: [38, 38], hit: [5.38125, 5.38125, 5.38125],
    tier1Hit: [5.38125, 5.38125, 5.38125], tier2Hit: [5.38125, 5.38125, 5.38125],
    baselineCombined: [11.843266215481, 11.843266215481, 11.843266215481], tier1Combined: [11.843266215481, 13.159184683868, 12.466596016296],
    tier2Combined: [11.843266215481, 13.159184683868, 12.466596016296], tier1Culling: [0, 1.3159184683868, .62332980081479],
    tier2Culling: [0, 1.3159184683868, .62332980081479], hasPoison: [true, true, true] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, mana: 62, tierMana: [62, 62], hit: [1.8375, 1.8375, 1.8375],
    tier1Hit: [1.8375, 1.8375, 1.8375], tier2Hit: [1.8375, 1.8375, 1.8375],
    baselineCombined: [2.205, 2.205, 2.205], tier1Combined: [2.205, 2.45, 2.3210526315789], tier2Combined: [2.205, 2.45, 2.3210526315789],
    tier1Culling: [0, .245, .11605263157895], tier2Culling: [0, .245, .11605263157895], hasPoison: [false, false, false] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, mana: 62, tierMana: [62, 62], hit: [4.33125, 4.33125, 4.33125],
    tier1Hit: [4.33125, 4.33125, 4.33125], tier2Hit: [4.33125, 4.33125, 4.33125],
    baselineCombined: [9.2013541776187, 9.2013541776187, 9.2013541776187], tier1Combined: [9.2013541776187, 10.223726864021, 9.6856359764408],
    tier2Combined: [9.2013541776187, 10.223726864021, 9.6856359764408], tier1Culling: [0, 1.0223726864021, .48428179882204],
    tier2Culling: [0, 1.0223726864021, .48428179882204], hasPoison: [true, true, true] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, mana: 62, tierMana: [62, 62], hit: [22.05, 22.05, 15.435],
    tier1Hit: [22.05, 22.05, 15.435], tier2Hit: [22.05, 22.05, 15.435],
    baselineCombined: [26.461217662286, 26.461217662286, 18.5228523636], tier1Combined: [26.461217662286, 29.401352958095, 19.497739330105],
    tier2Combined: [26.461217662286, 29.401352958095, 19.497739330105], tier1Culling: [0, 2.9401352958095, .97488696650526],
    tier2Culling: [0, 2.9401352958095, .97488696650526], hasPoison: [false, false, false] },
] as const;

// Normal/Rare/Unique and both tiers all preserve these raw Poison fields.
export const poisonBowCullingPoisonFixtures = [
  { skill: "poisonburst-arrow", poison: 5.385766215481, tierPoison: [5.385766215481, 5.385766215481],
    duration: 3, tierDuration: [3, 3], skillDuration: 3.003, tierSkillDuration: [3.003, 3.003],
    magnitude: [1, 1], chance: [100, 100], stacks: [1, 1], speed: [1.2, 1.2], radius: [24, 24],
    arrowPoison: 4.5657724526838, arrowTierPoison: [4.5657724526838, 4.5657724526838], arrowChance: [60, 60], arrowDuration: [2, 2],
    explicitPoison: [5.385766215481, 5.385766215481] },
  { skill: "gas-arrow", poison: 4.0038541776187, tierPoison: [4.0038541776187, 4.0038541776187],
    duration: 2, tierDuration: [2, 2], skillDuration: 4.026, tierSkillDuration: [4.026, 4.026],
    magnitude: [1, 1], chance: [100, 100], stacks: [1, 1], speed: [1.2, 1.2], radius: [18, 18],
    arrowPoison: 1.5383141032889, arrowTierPoison: [1.5383141032889, 1.5383141032889], arrowChance: [60, 60], arrowDuration: [2, 2],
    explicitPoison: [4.0038541776187, 4.0038541776187] },
] as const;

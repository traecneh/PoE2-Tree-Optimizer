// Independent generated-source facts and isolated PoB 0.23.1 observations from 47 MAIN calculations.
export const poisonBowCompressedSupportFixtures = [
  { id: "compressed-duration-i", name: "Compressed Duration I", effectId: "CompressedDurationSupportPlayer", family: "CompressedDuration", lessDuration: 30, damageMore: 0, manaMultiplier: 0 },
  { id: "compressed-duration-ii", name: "Compressed Duration II", effectId: "CompressedDurationSupportPlayerTwo", family: "CompressedDuration", lessDuration: 35, damageMore: 0, manaMultiplier: 0 },
] as const;

export const poisonBowCompressedNativeFixtures = [
  { skill: "poisonburst-arrow", baseSeconds: 3, duration: 3.003, poisonDuration: 3, poison: 5.385766215481,
    tierDuration: [2.112, 1.98], tierPoisonDuration: [2.1, 1.95], tierPoison: [5.0329003494532, 4.9656386715656],
    durationMod: [.7, .65], damagingAilmentMore: [1, 1], hitDamageMore: [1, 1], dotMore: [1, 1],
    poisonMagnitude: [1, 1], poisonChance: [100, 100], poisonStacks: [1, 1], mana: 38, tierMana: [38, 38],
    hit: 5.38125, tierHit: [5.38125, 5.38125], rate: 1.2, tierRate: [1.2, 1.2], radius: 24, tierRadius: [24, 24],
    singleSkillDuration: [2.112, 1.98], singleSkillPoisonDuration: [2.1, 1.95], singleSkillPoison: [5.0329003494532, 4.9656386715656],
    duration100Mod: [1.4, 1.3], duration100Skill: [4.224, 3.927], duration100Poison: [4.2, 3.9],
    prolongedMod: [.95, .88], prolongedSkill: [2.871, 2.64], prolongedPoison: [2.85, 2.64], prolongedMana: [45, 45],
    poison100Duration: 6, poison100Skill: 3.003, tier2Poison100Duration: 3.9, tier2Poison100Skill: 1.98,
    swift2PoisonDuration: 2.43, swift2Skill: 2.442, swift2Mod: .81,
    tier2Swift2DurationMod: .531, tier2Swift2Skill: 1.617, tier2Swift2PoisonDuration: 1.593,
    arrowPoisonDuration: 2, arrowTierPoisonDuration: [2, 2], arrowPoison: 4.5657724526838, arrowTierPoison: [4.5657724526838, 4.5657724526838],
    arrowPoisonChance: [60, 60], arrowPoisonMana: [45, 45], arrowPoisonMagnitude: [1, 1],
    arrowBleedDuration: 5, arrowTierBleedDuration: [5, 5], arrowBleed: 4.4994588462054, arrowTierBleed: [4.4994588462054, 4.4994588462054], arrowBleedMagnitude: [1, 1] },
  { skill: "gas-arrow", baseSeconds: 4, duration: 4.026, poisonDuration: 2, poison: 4.0038541776187,
    tierDuration: [2.805, 2.607], tierPoisonDuration: [2, 2], tierPoison: [4.0038541776187, 4.0038541776187],
    durationMod: [.7, .65], damagingAilmentMore: [1, 1], hitDamageMore: [1, 1], dotMore: [1, 1],
    poisonMagnitude: [1, 1], poisonChance: [100, 100], poisonStacks: [1, 1], mana: 62, tierMana: [62, 62],
    hit: 4.33125, tierHit: [4.33125, 4.33125], rate: 1.2, tierRate: [1.2, 1.2], radius: 18, tierRadius: [18, 18],
    singleSkillDuration: [2.805, 2.607], singleSkillPoisonDuration: [2, 2], singleSkillPoison: [4.0038541776187, 4.0038541776187],
    duration100Mod: [1.4, 1.3], duration100Skill: [5.61, 5.214], duration100Poison: [2, 2],
    prolongedMod: [.95, .88], prolongedSkill: [3.828, 3.531], prolongedPoison: [2, 2], prolongedMana: [74, 74],
    poison100Duration: 4, poison100Skill: 4.026, tier2Poison100Duration: 4, tier2Poison100Skill: 2.607,
    swift2PoisonDuration: 1.8, swift2Skill: 3.267, swift2Mod: .81,
    tier2Swift2DurationMod: .531, tier2Swift2Skill: 2.145, tier2Swift2PoisonDuration: 1.8,
    arrowPoisonDuration: 2, arrowTierPoisonDuration: [2, 2], arrowPoison: 1.5383141032889, arrowTierPoison: [1.5383141032889, 1.5383141032889],
    arrowPoisonChance: [60, 60], arrowPoisonMana: [74, 74], arrowPoisonMagnitude: [1, 1],
    arrowBleedDuration: 5, arrowTierBleedDuration: [5, 5], arrowBleed: 1.4636793837054, arrowTierBleed: [1.4636793837054, 1.4636793837054], arrowBleedMagnitude: [1, 1] },
] as const;

export const poisonBowCompressedHitFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", hit: 5.38125, tierHit: [5.38125, 5.38125], tierHasPoison: [false, false] },
  { skill: "gas-arrow", component: "arrow", hit: 1.8375, tierHit: [1.8375, 1.8375], tierHasPoison: [false, false] },
  { skill: "gas-arrow", component: "Fire explosion", hit: 11.025, tierHit: [11.025, 11.025], tierHasPoison: [false, false] },
] as const;

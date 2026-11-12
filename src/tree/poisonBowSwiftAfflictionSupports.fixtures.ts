// Independent source facts and isolated PoB 0.23.1 observations from 45 MAIN calculations.
export const poisonBowSwiftSupportFixtures = [
  { id: "swift-affliction-i", name: "Swift Affliction I", effectId: "SupportSwiftAfflictionPlayer", family: "SwiftAffliction", nonAilmentDotMore: 30, lessDuration: 20 },
  { id: "swift-affliction-ii", name: "Swift Affliction II", effectId: "SupportSwiftAfflictionPlayerTwo", family: "SwiftAffliction", nonAilmentDotMore: 30, lessDuration: 10 },
] as const;

export const poisonBowSwiftNativeFixtures = [
  { skill: "poisonburst-arrow", baseSeconds: 3, duration: 3.003, poisonDuration: 3, poison: 5.385766215481,
    tierDuration: [1.947, 2.442], tierPoisonDuration: [1.92, 2.43], tierPoison: [4.9517994298936, 5.1711055644165],
    durationMod: [.64, .81], durationMore: [.8, .9], damagingAilmentMore: [.8, .9], dotMore: [1.3, 1.3],
    poisonMagnitude: [1, 1], poisonChance: [100, 100], poisonStacks: [1, 1], mana: 38, tierMana: [38, 38],
    hit: 5.38125, tierHit: [5.38125, 5.38125], rate: 1.2, tierRate: [1.2, 1.2], radius: 24, tierRadius: [24, 24],
    directDotControlPoison: 5.385766215481, directDotControlDuration: 3.003, directDotControlPoisonDuration: 3,
    singleSkillDuration: [2.409, 2.706], singleSkillPoisonDuration: [2.4, 2.7],
    singleAilmentSkillDuration: [3.003, 3.003], singleAilmentPoisonDuration: [2.4, 2.7],
    duration100Mod: [1.28, 1.62], duration100Skill: [3.861, 4.884], duration100Poison: [3.84, 4.86],
    prolongedDurationMod: [.864, 1.098], prolongedSkill: [2.607, 3.3], prolongedPoison: [2.592, 3.294], prolongedMana: [45, 45],
    arrowPoisonDuration: 2, arrowTierPoisonDuration: [1.6, 1.8], arrowPoison: 4.5657724526838, arrowTierPoison: [4.4024658263393, 4.4871805708713],
    arrowPoisonChance: [60, 60], arrowPoisonMana: [45, 45], arrowPoisonMagnitude: [1, 1],
    arrowBleedDuration: 5, arrowTierBleedDuration: [4, 4.5], arrowBleed: 4.4994588462054, arrowTierBleed: [4.28484502372, 4.3952792669188],
    arrowBleedMagnitude: [1, 1], exactGameDurationVerified: false },
  { skill: "gas-arrow", baseSeconds: 4, duration: 4.026, poisonDuration: 2, poison: 4.0038541776187,
    tierDuration: [2.574, 3.267], tierPoisonDuration: [1.6, 1.8], tierPoison: [3.8507366706811, 3.9300035445447],
    durationMod: [.64, .81], durationMore: [.8, .9], damagingAilmentMore: [.8, .9], dotMore: [1.3, 1.3],
    poisonMagnitude: [1, 1], poisonChance: [100, 100], poisonStacks: [1, 1], mana: 62, tierMana: [62, 62],
    hit: 4.33125, tierHit: [4.33125, 4.33125], rate: 1.2, tierRate: [1.2, 1.2], radius: 18, tierRadius: [18, 18],
    directDotControlPoison: 4.0038541776187, directDotControlDuration: 4.026, directDotControlPoisonDuration: 2,
    singleSkillDuration: [3.201, 3.63], singleSkillPoisonDuration: [2, 2],
    singleAilmentSkillDuration: [4.026, 4.026], singleAilmentPoisonDuration: [1.6, 1.8],
    duration100Mod: [1.28, 1.62], duration100Skill: [5.148, 6.501], duration100Poison: [1.6, 1.8],
    prolongedDurationMod: [.864, 1.098], prolongedSkill: [3.465, 4.422], prolongedPoison: [1.6, 1.8], prolongedMana: [74, 74],
    arrowPoisonDuration: 2, arrowTierPoisonDuration: [1.6, 1.8], arrowPoison: 1.5383141032889, arrowTierPoison: [1.4952660717317, 1.5174828839674],
    arrowPoisonChance: [60, 60], arrowPoisonMana: [74, 74], arrowPoisonMagnitude: [1, 1],
    arrowBleedDuration: 5, arrowTierBleedDuration: [4, 4.5], arrowBleed: 1.4636793837054, arrowTierBleed: [1.398875875391, 1.4321042379629],
    arrowBleedMagnitude: [1, 1], exactGameDurationVerified: false },
] as const;

export const poisonBowSwiftHitFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", hit: 5.38125, tierHit: [5.38125, 5.38125], tierHasPoison: [false, false] },
  { skill: "gas-arrow", component: "arrow", hit: 1.8375, tierHit: [1.8375, 1.8375], tierHasPoison: [false, false] },
  { skill: "gas-arrow", component: "Fire explosion", hit: 11.025, tierHit: [11.025, 11.025], tierHasPoison: [false, false] },
] as const;

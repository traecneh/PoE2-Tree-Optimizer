// Independent source facts and isolated PoB 0.23.1 observations; no production metadata imports.
export const poisonBowBountySupportFixtures = [
  { id: "bounty-i", name: "Bounty I", effectId: "SupportBountyPlayer", family: "Bounty", moreLife: 50, moreMana: 50, moreCharm: 50, manaMultiplier: 0 },
  { id: "bounty-ii", name: "Bounty II", effectId: "SupportBountyPlayerTwo", family: "Bounty", moreLife: 100, moreMana: 100, moreCharm: 100, manaMultiplier: 0 },
] as const;

export const poisonBowBountyRewardFixture = {
  requirement: "Enemies killed by Hits from Supported Skills",
  sourceStats: ["support_life_flask_charges_gained_+%_final_from_killing_blow", "support_mana_flask_charges_gained_+%_final_from_killing_blow", "support_charm_charges_gained_+%_final_from_killing_blow"],
  nativeBountyRewardMore: [1, 1, 1], nativeBountyRewardIncrease: [0, 0, 0], nativeGenericFlaskMore: 1,
  explicitMoreControl: [[1.5, 1.5, 1.5], [2, 2, 2]], nativeKillEventsSimulated: false,
  // Abstract, uncapped eligible-kill rewards: arithmetic examples, NOT real enemy payouts or charge-rate predictions.
  hypotheticalBaseCharges: [2, 4, 6], hypotheticalTierCharges: [[3, 6, 9], [4, 8, 12]],
} as const;

export const poisonBowBountyComponentFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, mana: 38, tierMana: [38, 38], hit: 5.38125, tierHit: [5.38125, 5.38125], speed: [1.2, 1.2], hasPoison: false },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, mana: 38, tierMana: [38, 38], hit: 5.38125, tierHit: [5.38125, 5.38125], speed: [1.2, 1.2], hasPoison: true },
  { skill: "gas-arrow", component: "arrow", actualHit: true, mana: 62, tierMana: [62, 62], hit: 1.8375, tierHit: [1.8375, 1.8375], speed: [1.2, 1.2], hasPoison: false },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, mana: 62, tierMana: [62, 62], hit: 4.33125, tierHit: [4.33125, 4.33125], speed: [1.2, 1.2], hasPoison: true },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, mana: 62, tierMana: [62, 62], hit: 22.05, tierHit: [22.05, 22.05], speed: [1.2, 1.2], hasPoison: false },
] as const;

export const poisonBowBountyPoisonFixtures = [
  { skill: "poisonburst-arrow", poison: 5.385766215481, tierPoison: [5.385766215481, 5.385766215481],
    duration: [3, 3], skillDuration: [3.003, 3.003], chance: [100, 100], magnitude: [1, 1], stacks: [1, 1], radius: [24, 24],
    arrowPoison: 4.5657724526838, arrowTierPoison: [4.5657724526838, 4.5657724526838], arrowChance: [60, 60], arrowDuration: [2, 2],
    arrowPoisonMana: [45, 45], lifeRegen: [0, 0], manaRegen: [101.6, 101.6] },
  { skill: "gas-arrow", poison: 4.0038541776187, tierPoison: [4.0038541776187, 4.0038541776187],
    duration: [2, 2], skillDuration: [4.026, 4.026], chance: [100, 100], magnitude: [1, 1], stacks: [1, 1], radius: [18, 18],
    arrowPoison: 1.5383141032889, arrowTierPoison: [1.5383141032889, 1.5383141032889], arrowChance: [60, 60], arrowDuration: [2, 2],
    arrowPoisonMana: [74, 74], lifeRegen: [0, 0], manaRegen: [101.6, 101.6] },
] as const;

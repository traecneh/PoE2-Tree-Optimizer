// Independent generated-source facts and unmodified frozen PoB 0.23.1 outputs.
export const poisonBowChaosMasterySupportFixture = {
  id: "chaos-mastery", name: "Chaos Mastery", effectId: "SupportChaosMasteryPlayer", family: "Mastery",
  levelBonus: 1, manaMultiplier: 0, catalogTier: 5,
} as const;

// Level 20/21 native component coefficients, rounded source ranges and averages.
export const poisonBowChaosMasteryComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, coefficients: [2.74, 2.88], ranges: [[16, 25], [17, 26]], hits: [5.38125, 5.64375] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, coefficients: [2.74, 2.88], ranges: [[16, 25], [17, 26]], hits: [5.38125, 5.64375] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, coefficients: [.94, .98], ranges: [[6, 8], [6, 9]], hits: [1.8375, 1.96875] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, coefficients: [2.18, 2.29], ranges: [[13, 20], [14, 21]], hits: [4.33125, 4.59375] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, coefficients: [2.81, 2.95], ranges: [[17, 25], [18, 27]], hits: [22.05, 23.625] },
] as const;

// Baseline versus +1: same effective level as directly levelling the active gem.
export const poisonBowChaosMasterySourceFixtures = [
  { skill: "poisonburst-arrow", level: 10, coefficients: [1.69, 1.77], ranges: [[10, 15], [11, 16]], poison: [3.2517833753847, 3.4855053054905], roll: 78.260869565217, mana: [16, 18], radius: [19, 20] },
  { skill: "poisonburst-arrow", level: 20, coefficients: [2.74, 2.88], ranges: [[16, 25], [17, 26]], poison: [5.385766215481, 5.6194881455867], roll: 78.260869565217, mana: [38, 41], radius: [24, 25] },
  { skill: "poisonburst-arrow", level: 24, coefficients: [3.34, 3.5], ranges: [[20, 30], [21, 32]], poison: [6.5035667507695, 6.9202014957406], roll: 78.260869565217, mana: [52, 55], radius: [26, 27] },
  { skill: "gas-arrow", level: 10, coefficients: [1.34, 1.41], ranges: [[8, 12], [8, 13]], poison: [2.4154398973175, 2.572968586273], roll: 70.588235294118, mana: [26, 29], radius: [18, 18] },
  { skill: "gas-arrow", level: 20, coefficients: [2.18, 2.29], ranges: [[13, 20], [14, 21]], poison: [4.0038541776187, 4.2270198203057], roll: 70.588235294118, mana: [62, 67], radius: [18, 18] },
  { skill: "gas-arrow", level: 24, coefficients: [2.65, 2.79], ranges: [[16, 24], [17, 25]], poison: [4.8308797946351, 5.054045437322], roll: 70.588235294118, mana: [84, 90], radius: [18, 18] },
] as const;

export const poisonBowChaosMasteryLinkFixtures = [
  { skill: "poisonburst-arrow", arrowPoison: [4.5657724526838, 4.7800125446944], arrowRoll: 59.016393442623, poisonMana: [45, 49], efficiencyMana: [23, 25], duration: 3, skillTimer: 3.003 },
  { skill: "gas-arrow", arrowPoison: [1.5383141032889, 1.6647508789016], arrowRoll: 59.016393442623, poisonMana: [74, 80], efficiencyMana: [38, 41], duration: 2, skillTimer: 4.026 },
] as const;

// Independent generated-source facts and unmodified frozen PoB 0.23.1 outputs.
export const poisonBowChaosAttunementSupportFixture = {
  id: "chaos-attunement", name: "Chaos Attunement", effectId: "SupportAddedChaosDamagePlayer", family: "ChaosAttunement",
  gainAsChaos: 25, lessNonChaos: 50, manaMultiplier: 20, catalogTier: 3,
} as const;

// Level-20 baseline/support ranges. Hit mitigation is type-dependent; do not
// infer Poison value from total hit gain or count Fire as a Poison source.
export const poisonBowChaosAttunementComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, physical: [[16,25],[8,12]], fire: [[0,0],[0,0]], chaos: [[0,0],[4,6]], hits: [5.38125,7.875] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, physical: [[16,25],[8,12]], fire: [[0,0],[0,0]], chaos: [[0,0],[4,6]], hits: [5.38125,7.875] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, physical: [[6,8],[3,4]], fire: [[0,0],[0,0]], chaos: [[0,0],[1,2]], hits: [1.8375,2.49375] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, physical: [[13,20],[7,10]], fire: [[0,0],[0,0]], chaos: [[0,0],[3,5]], hits: [4.33125,6.43125] },
  { skill: "gas-arrow", component: "conditional explosion", actualHit: true, physical: [[0,0],[0,0]], fire: [[17,25],[9,13]], chaos: [[0,0],[4,6]], hits: [22.05,16.8] },
] as const;

export const poisonBowChaosAttunementSourceFixtures = [
  { skill: "poisonburst-arrow", poison: [5.385766215481,3.9021400504617], roll: 78.260869565217,
    gainOnly: 6.6864795656349, penaltyOnly: 2.6014267003078, chaosProbe: [5.385766215481,5.2028534006156],
    doubledChaos: [8,12], arrowPoison: [4.5657724526838,3.3295017578033], arrowRoll: 59.016393442623,
    mana: [38,45], poisonMana: [45,54], efficiencyMana: [23,27], masteryMana: [41,49],
    masteryPoison: [5.6194881455867,4.1358619805675], duration: 3, timer: 3.003, radius: 24 },
  { skill: "gas-arrow", poison: [4.0038541776187,3.0192998716469], roll: 70.588235294118,
    gainOnly: 4.9884084835905, penaltyOnly: 2.0347455656751, chaosProbe: [4.0038541776187,4.0694911313502],
    doubledChaos: [7,10], arrowPoison: [1.5383141032889,1.1098339192678], arrowRoll: 59.016393442623,
    mana: [62,74], poisonMana: [74,89], efficiencyMana: [38,45], masteryMana: [67,80],
    masteryPoison: [4.2270198203057,3.0192998716469], duration: 2, timer: 4.026, radius: 18 },
] as const;

export const poisonBowChaosAttunementExplosionFixture = {
  withoutChancePoison: 0, separateChance: 60, separatePoisonDuration: 2,
  eligibleChaos: [4,6], poisonWithSeparateChance: 1.1098339192678, manaWithSeparateChance: 89,
} as const;

// Independent generated-source facts and isolated PoB 0.23.1 observations, not imports from production metadata.
export const poisonBowBlindSupportFixtures = [
  { id: "blind-i", name: "Blind I", effectId: "SupportBlindPlayer", family: "Blind", chance: 100, increasedEffect: 0, manaMultiplier: 10 },
  { id: "blind-ii", name: "Blind II", effectId: "SupportBlindPlayerTwo", family: "Blind", chance: 100, increasedEffect: 20, manaMultiplier: 10 },
] as const;

// States: Blind off, base Blind explicitly on, II explicitly on, II on plus separate +20% effect control.
export const poisonBowBlindEnemyFixture = {
  effectIncrease: [0, 0, 20, 40], ratingMore: [1, .8, .76, .72],
  accuracy: [2357, 1885.6, 1791.32, 1697.04], evasion: [996, 796.8, 756.96, 717.12],
  playerAccuracy: [657, 657, 657, 657], playerEvasion: [1007, 1007, 1007, 1007],
  hitChance: [86, 92, 93, 94], evadeChance: [9, 11, 12, 12], playerEffectIncrease: [0, 0, 0, 0],
  chanceWithSupport: 100, chanceWithoutSupport: 0, tierIIOffRatings: [2357, 996],
  explicitIPlus20Ratings: [1791.32, 756.96], explicitIPlus20HitChance: 93,
} as const;

export const poisonBowBlindComponentFixtures = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, mana: 38, tierMana: [41, 41],
    physicalHit: [5.125, 5.125, 5.125], fireHit: [0, 0, 0], averageHit: [5.345375, 5.36075, 5.3633125],
    totalDPS: [5.516427, 5.918268, 5.98545675], suppliesPoison: false },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, mana: 38, tierMana: [41, 41],
    physicalHit: [5.125, 5.125, 5.125], fireHit: [0, 0, 0], averageHit: [5.345375, 5.36075, 5.3633125],
    totalDPS: [5.516427, 5.918268, 5.98545675], suppliesPoison: true },
  { skill: "gas-arrow", component: "arrow", actualHit: true, mana: 62, tierMana: [68, 68],
    physicalHit: [1.75, 1.75, 1.75], fireHit: [0, 0, 0], averageHit: [1.82525, 1.8305, 1.831375],
    totalDPS: [1.883658, 2.020872, 2.0438145], suppliesPoison: false },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, mana: 62, tierMana: [68, 68],
    physicalHit: [4.125, 4.125, 4.125], fireHit: [0, 0, 0], averageHit: [4.302375, 4.31475, 4.3168125],
    totalDPS: [4.440051, 4.763484, 4.81756275], suppliesPoison: true },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, mana: 62, tierMana: [68, 68],
    physicalHit: [0, 0, 0], fireHit: [21, 21, 21], averageHit: [21.903, 21.966, 21.9765],
    totalDPS: [22.603896, 24.250464, 24.525774], suppliesPoison: false },
] as const;

export const poisonBowBlindPoisonFixtures = [
  { skill: "poisonburst-arrow", offPoison: 5.1407527211226, offTierPoison: [5.1407527211226, 5.1407527211226],
    onPoison: [5.2443412172508, 5.2618120321071], explicitIPlus20Poison: 5.2618120321071, explicitIIPlus20Poison: 5.2793421553063,
    duration: [3, 3, 3], skillDuration: [3.003, 3.003, 3.003], chance: [100, 100, 100], magnitude: [1, 1, 1], stacks: [1, 1, 1],
    arrowOffPoison: 4.4181304728428, arrowOffTierPoison: [4.4181304728428, 4.4181304728428], arrowOnPoison: [4.4813157279847, 4.491852282099],
    arrowChance: [60, 60], arrowDuration: [2, 2], baseMana: 38, arrowPoisonMana: 45, arrowBothMana: [50, 50] },
  { skill: "gas-arrow", offPoison: 3.8503496414138, offTierPoison: [3.8503496414138, 3.8503496414138],
    onPoison: [3.9155138751918, 3.9264606411955], explicitIPlus20Poison: 3.9264606411955, explicitIIPlus20Poison: 3.937433730761,
    duration: [2, 2, 2], skillDuration: [4.026, 4.026, 4.026], chance: [100, 100, 100], magnitude: [1, 1, 1], stacks: [1, 1, 1],
    arrowOffPoison: 1.4965946562522, arrowOffTierPoison: [1.4965946562522, 1.4965946562522], arrowOnPoison: [1.5143051909483, 1.5172801597027],
    arrowChance: [60, 60], arrowDuration: [2, 2], baseMana: 62, arrowPoisonMana: 74, arrowBothMana: [81, 81] },
] as const;

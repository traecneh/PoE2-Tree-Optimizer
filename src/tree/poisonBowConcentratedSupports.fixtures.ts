// Independent frozen source identity and isolated PoB 0.23.1 observations from 26 MAIN checks.
export const poisonBowConcentratedSupportFixture = {
  id: "concentrated-area", name: "Concentrated Area", effectId: "SupportConcentratedAreaPlayer", family: "ConcentratedEffect",
  areaDamageMore: 30, areaLess: 50, preference: "areaOfEffect", priority: 2,
} as const;

export const poisonBowConcentratedNativeFixtures = [
  { skill: "poisonburst-arrow", component: "Poison Burst", radius: 24, concentratedRadius: 16, increased100Radius: 24, magnifiedRadius: 20,
    basePoison: 5.385766215481, concentratedPoison: 6.9202014957406, areaOnlyPoison: 5.385766215481, damageOnlyPoison: 6.9202014957406,
    syntheticPoison: 6.9202014957406, magnifiedPoison: 6.9202014957406, areaOnlyRadius: 16, damageOnlyRadius: 24,
    sourceHit: 5.38125, concentratedSourceHit: 6.95625, syntheticSourceHit: 6.95625,
    mana: 38, concentratedMana: 38, magnifiedMana: 49, combinedMana: 30,
    duration: 3.003, concentratedDuration: 3.003, poisonDuration: 3, concentratedPoisonDuration: 3,
    rate: 1.2, concentratedRate: 1.2, magnitude: 1, concentratedMagnitude: 1, stackLimit: 1, concentratedStackLimit: 1,
    deadlyOnlyPoison: 7.4384544711926, deadlyConcentratedPoison: 9.5724373112888, combinedPoison: 9.5724373112888, combinedMagnitude: 2 },
  { skill: "gas-arrow", component: "Poison Cloud", radius: 18, concentratedRadius: 12, increased100Radius: 18, magnifiedRadius: 15,
    basePoison: 4.0038541776187, concentratedPoison: 5.2115741262775, areaOnlyPoison: 4.0038541776187, damageOnlyPoison: 5.2115741262775,
    syntheticPoison: 5.2115741262775, magnifiedPoison: 5.2115741262775, areaOnlyRadius: 12, damageOnlyRadius: 18,
    sourceHit: 4.33125, concentratedSourceHit: 5.64375, syntheticSourceHit: 5.64375,
    mana: 62, concentratedMana: 62, magnifiedMana: 80, combinedMana: 48,
    duration: 4.026, concentratedDuration: 4.026, poisonDuration: 2, concentratedPoisonDuration: 2,
    rate: 1.2, concentratedRate: 1.2, magnitude: 1, concentratedMagnitude: 1, stackLimit: 1, concentratedStackLimit: 1,
    deadlyOnlyPoison: 5.5922684579199, deadlyConcentratedPoison: 7.2463196919526, combinedPoison: 7.2463196919526, combinedMagnitude: 2 },
] as const;

export const poisonBowConcentratedHitControls = [
  { skill: "poisonburst-arrow", component: "Arrow", areaEnabled: false, hit: 5.38125, concentratedHit: 5.38125 },
  { skill: "gas-arrow", component: "Arrow", areaEnabled: true, hit: 1.8375, concentratedHit: 2.3625 },
  { skill: "gas-arrow", component: "Explosion", areaEnabled: true, hit: 11.025, concentratedHit: 14.4375 },
] as const;

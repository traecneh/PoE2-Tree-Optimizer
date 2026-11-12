// Independent frozen PoB 0.23.1 observations; native Poison values assume sustained application.
export const poisonBowSupercriticalSupportFixture = {
  id: "supercritical", name: "Supercritical", effectId: "SupportIncreasedCriticalDamagePlayer", family: "Supercritical",
  catalogTier: 3, increasedBonus: 100, lessChance: 20, line: 8277,
} as const;

// Order: baseline, Supercritical, never-crit, high increased bonus, high plus Supercritical.
export const poisonBowSupercriticalComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, range: [16,25], hits: [5.38125,5.535,5.125,6.40625,6.355] },
  { skill: "poisonburst-arrow", component: "no-hit burst source", actualHit: false, range: [16,25], hits: [5.38125,5.535,5.125,6.40625,6.355] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, range: [6,8], hits: [1.8375,1.89,1.75,2.1875,2.17] },
  { skill: "gas-arrow", component: "no-hit cloud source", actualHit: false, range: [13,20], hits: [4.33125,4.455,4.125,5.15625,5.115] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, range: [17,25], hits: [22.05,22.68,21,26.25,26.04] },
] as const;

export const poisonBowSupercriticalSources = [
  { skill: "poisonburst-arrow", duration: 3, timer: 3.003, radius: 24, mana: 38, poisonIIIMana: 45,
    poison: [5.385766215481,5.8684437337938,4.6086956521739,8.4940484687091,8.3879398970335],
    arrowPoison: [4.5657724526838,4.7489577542346] },
  { skill: "gas-arrow", duration: 2, timer: 4.026, radius: 18, mana: 62, poisonIIIMana: 74,
    poison: [4.0038541776187,4.2579896248619,3.5882352941176,5.6663297116231,5.5974982863503],
    arrowPoison: [1.5383141032889,1.6000334587344] },
] as const;

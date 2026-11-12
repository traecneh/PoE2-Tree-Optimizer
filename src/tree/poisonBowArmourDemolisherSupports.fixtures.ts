// Independent frozen PoB 0.23.1 observations, not observed break or charge events.
export const poisonBowArmourDemolisherSupportFixtures = [
  { id: "armour-demolisher-i",name: "Armour Demolisher I",effectId: "SupportArmourDemolisherPlayer",catalogTier: 1,amount: 50,factor: 1.5,line: 290 },
  { id: "armour-demolisher-ii",name: "Armour Demolisher II",effectId: "SupportArmourDemolisherPlayerTwo",catalogTier: 3,amount: 70,factor: 1.7,line: 325 },
] as const;
export const poisonBowArmourDemolisherComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,hit: 5.38125,poison: 0,mana: 38,corrosionMana: 41,exploitMana: 49 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,hit: 5.38125,poison: 5.385766215481,mana: 38,corrosionMana: 41,exploitMana: 49 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,hit: 1.8375,poison: 0,mana: 62,corrosionMana: 68,exploitMana: 80 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,hit: 4.33125,poison: 4.0038541776187,mana: 62,corrosionMana: 68,exploitMana: 80 },
  { skill: "gas-arrow",component: "conditional Fire explosion",actualHit: true,hit: 22.05,poison: 0,mana: 62,corrosionMana: 68,exploitMana: 80 },
] as const;
export const poisonBowArmourDemolisherNative = {
  breakPerHitMore: 1,breakPerHit: 0,charges: 0,parsedBreakIncrease: 100,capabilityAlone: false,capabilityWithBreak: true,
  nominalHitBreak: 20,nominalCorrosionBreak: 80,nominalHitResults: [30,34],nominalCorrosionResults: [120,136],
  arrowPoison: [4.5657724526838,1.5383141032889],arrowPoisonMana: [45,74],
} as const;

// Independent frozen PoB 0.23.1 observations; capability flags are not simulated break events.
export const poisonBowArmourBreakSupportFixtures = [
  { id: "armour-break-i",name: "Armour Break I",effectId: "SupportArmourBreakPlayer",catalogTier: 2,amount: 15,chargeChance: 0,line: 198 },
  { id: "armour-break-ii",name: "Armour Break II",effectId: "SupportArmourBreakPlayerTwo",catalogTier: 3,amount: 15,chargeChance: 15,line: 228 },
  { id: "armour-break-iii",name: "Armour Break III",effectId: "SupportArmourBreakPlayerThree",catalogTier: 4,amount: 20,chargeChance: 20,line: 259 },
] as const;
export const poisonBowArmourBreakComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,physicalHit: true,hit: 5.38125,poison: 0,mana: 38,corrosionMana: 41,exploitMana: 49 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,physicalHit: false,hit: 5.38125,poison: 5.385766215481,mana: 38,corrosionMana: 41,exploitMana: 49 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,physicalHit: true,hit: 1.8375,poison: 0,mana: 62,corrosionMana: 68,exploitMana: 80 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,physicalHit: false,hit: 4.33125,poison: 4.0038541776187,mana: 62,corrosionMana: 68,exploitMana: 80 },
  { skill: "gas-arrow",component: "conditional Fire explosion",actualHit: true,physicalHit: false,hit: 22.05,poison: 0,mana: 62,corrosionMana: 68,exploitMana: 80 },
] as const;
export const poisonBowArmourBreakStates = [
  { state: "none",partial: false,full: false,exploitFactor: 1 },
  { state: "partial",partial: true,full: false,exploitFactor: 1 },
  { state: "full",partial: false,full: true,exploitFactor: 1.4 },
] as const;
export const poisonBowArmourBreakNative = { amount: 0,chargeCount: 0,capabilityWithSupport: true,prohibitionWithExploit: true,
  poisonArrow: [4.5657724526838,1.5383141032889],poisonCorrosionMana: [50,81],nominalPhysicalDamage: 100 } as const;

// Independent frozen PoB 0.23.1 observations. Child hit/DPS fields are not full-break events.
export const poisonBowArmourExplosionSupportFixture = {
  id: "armour-explosion",name: "Armour Explosion",effectId: "SupportArmourExplosionPlayer",family: "ArmourExplosion",catalogTier: 1,line: 360,
  childId: "ArmourExplosionPlayer",baseMultiplier: .3,physicalToFire: 100,baseRadius: 14,magnifiedArea: 1.45,magnifiedRadius: 16,
  cannotBreakArmour: true,triggerStatMapped: false,linkStatMapped: false,addedManaMultiplier: 0,
} as const;
export const poisonBowArmourExplosionComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,hit: 5.38125,poison: 0,mana: 38,corrosionMana: 41,exploitMana: 49 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,hit: 5.38125,poison: 5.385766215481,mana: 38,corrosionMana: 41,exploitMana: 49 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,hit: 1.8375,poison: 0,mana: 62,corrosionMana: 68,exploitMana: 80 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,hit: 4.33125,poison: 4.0038541776187,mana: 62,corrosionMana: 68,exploitMana: 80 },
  { skill: "gas-arrow",component: "Gas conditional Fire detonation",actualHit: true,hit: 22.05,poison: 0,mana: 62,corrosionMana: 68,exploitMana: 80 },
] as const;
export const poisonBowArmourExplosionChild = {
  owner: "player",attack: true,spell: false,area: true,triggered: true,fireRange: [2,3],averageHit: 2.625,
  fireIncrease100Range: [4,6],fireIncrease100Hit: 5.25,physicalIncrease100Hit: 2.625,poisonIncrease100Hit: 2.625,
  poison: 0,poisonLinkedChance: 60,poisonLinkedDps: 0,mana: 0,nativeRate: 1.2,nativeDps: 3.15,
  explicitFullExploitRange: [3,4],explicitFullExploitHit: 3.675,
} as const;
export const poisonBowArmourExplosionStates = [
  { state: "none",partial: false,full: false,childHit: 2.625,exploitChildHit: 2.625 },
  { state: "partial",partial: true,full: false,childHit: 2.625,exploitChildHit: 2.625 },
  { state: "full",partial: false,full: true,childHit: 2.625,exploitChildHit: 3.675 },
] as const;

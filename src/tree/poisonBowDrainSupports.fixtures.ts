// Independent frozen PoB 0.23.1 fields; displayed on-kill values are not observed Cull recovery events.
export const poisonBowDrainSupportFixtures = [
  { id: "life-drain",name: "Life Drain",effectId: "SupportLifeOnCullPlayer",family: "LifeDrain",resource: "Life",catalogTier: 1,line: 2747 },
  { id: "soul-drain",name: "Soul Drain",effectId: "SupportManaOnCullPlayer",family: "SoulDrain",resource: "Mana",catalogTier: 3,line: 5260 },
] as const;
export const poisonBowDrainComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,hit: 5.38125,poison: 0,nativeLifeOnKill: 395,nativeManaOnKill: 0 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,hit: 5.38125,poison: 5.385766215481,nativeLifeOnKill: 395,nativeManaOnKill: 0 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,hit: 1.8375,poison: 0,nativeLifeOnKill: 395,nativeManaOnKill: 0 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,hit: 4.33125,poison: 4.0038541776187,nativeLifeOnKill: 395,nativeManaOnKill: 0 },
  { skill: "gas-arrow",component: "conditional Fire explosion",actualHit: true,hit: 22.05,poison: 0,nativeLifeOnKill: 395,nativeManaOnKill: 0 },
] as const;
export const poisonBowDrainRarities = [
  { rarity: "Normal",canCull: false,threshold: 0,multiplier: 1,thresholdIncrease: 0,nativeLifeOnKill: 395,nativeManaOnKill: 0 },
  { rarity: "Rare",canCull: true,threshold: 10,multiplier: 1.1111111111111,thresholdIncrease: 0,nativeLifeOnKill: 395,nativeManaOnKill: 0 },
  { rarity: "Unique",canCull: true,threshold: 5,multiplier: 1.0526315789474,thresholdIncrease: 0,nativeLifeOnKill: 395,nativeManaOnKill: 0 },
] as const;
export const poisonBowDrainControls = [
  { skill: "poisonburst-arrow",life: 3287,mana: 2541,lifeOnKill: 395,manaOnKill: 0,scalarManaOnKill: 305,
    cannotLife: 0,onlyLeechLife: 0,cannotManaScalar: 0,lifeLeechPerHit: .861,manaLeechPerHit: .4305,lifeLeechRate: 1.0332,manaLeechRate: .5166,
    manaCost: 38,poisonLinkedManaCost: 45,arrowPoison: 4.5657724526838 },
  { skill: "gas-arrow",life: 3287,mana: 2541,lifeOnKill: 395,manaOnKill: 0,scalarManaOnKill: 305,
    cannotLife: 0,onlyLeechLife: 0,cannotManaScalar: 0,lifeLeechPerHit: .294,manaLeechPerHit: .147,lifeLeechRate: .3528,manaLeechRate: .1764,
    manaCost: 62,poisonLinkedManaCost: 74,arrowPoison: 1.5383141032889 },
] as const;

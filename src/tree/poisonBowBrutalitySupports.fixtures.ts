// Independent frozen PoB 0.23.1 observations; synthetic source fields are not real Hits.
export const poisonBowBrutalitySupports = [
  { id: "brutality-i",name: "Brutality I",effectId: "SupportBrutalityPlayer",family: "Brutality",catalogTier: 1,morePhysical: 25,ignoreChance: 0,line: 1216 },
  { id: "brutality-ii",name: "Brutality II",effectId: "SupportBrutalityPlayerTwo",family: "Brutality",catalogTier: 2,morePhysical: 30,ignoreChance: 0,line: 1253 },
  { id: "brutality-iii",name: "Brutality III",effectId: "SupportBrutalityPlayerThree",family: "Brutality",catalogTier: 5,morePhysical: 30,ignoreChance: 20,line: 1290 },
] as const;
export const poisonBowBrutalityComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,mana: 38,
    hit: [5.38125,6.825,6.95625,11.13],range: [[16,25],[21,31],[21,32],[21,32]],
    bleed: [4.4994588462054,5.6107709708705,5.7734020135045,5.7734020135045],poison: [0,0,0,0] },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,mana: 38,
    hit: [5.38125,6.825,6.95625,11.13],range: [[16,25],[21,31],[21,32],[21,32]],
    bleed: [4.4994588462054,5.6107709708705,5.7734020135045,5.7734020135045],poison: [5.385766215481,0,0,0] },
  { skill: "gas-arrow",component: "arrow",actualHit: true,mana: 62,
    hit: [1.8375,2.3625,2.3625,3.78],range: [[6,8],[7,11],[7,11],[7,11]],
    bleed: [1.4636793837054,1.9786776853795,1.9786776853795,1.9786776853795],poison: [0,0,0,0] },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,mana: 62,
    hit: [4.33125,5.38125,5.64375,9.03],range: [[13,20],[16,25],[17,26],[17,26]],
    bleed: [3.6049881117188,4.4994588462054,4.6891950626116,4.6891950626116],poison: [4.0038541776187,0,0,0] },
  { skill: "gas-arrow",component: "conditional Fire detonation",actualHit: true,mana: 62,
    hit: [22.05,0,0,0],range: [[0,0],[0,0],[0,0],[0,0]],bleed: [0,0,0,0],poison: [0,0,0,0] },
] as const;
export const poisonBowBrutalityInteractions = [
  { skill: "poisonburst-arrow",range: [21,32],pdrHits: [13.9125,16.695,27.825],bleed: 5.7734020135045,
    deepBleed: 7.9689210890625,deepRange: [15,22],mana: 38,brutalityCost: 45,efficiencyCost: 27,poisonCost: 54,poisonEfficiencyCost: 33 },
  { skill: "gas-arrow",range: [7,11],pdrHits: [4.725,5.67,9.45],bleed: 1.9786776853795,
    deepBleed: 2.8731484198661,deepRange: [5,8],mana: 62,brutalityCost: 74,efficiencyCost: 45,poisonCost: 89,poisonEfficiencyCost: 54 },
] as const;
export const poisonBowBrutalitySuppressedSuggestions = ["poisonMagnitude","poisonDuration","attackDamage","physicalDamage","projectileDamage","attackAreaDamage"] as const;

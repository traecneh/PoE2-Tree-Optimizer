// Independent frozen PoB 0.23.1 snapshots: synthetic source-hit buildup is not actual Poison stunning.
export const poisonBowStunSupportFixtures = [
  { id: "stun-i",name: "Stun I",effectId: "SupportStunPlayer",family: "Stun",catalogTier: 2,more: 50,lessDamage: false,line: 7155 },
  { id: "stun-ii",name: "Stun II",effectId: "SupportStunPlayerTwo",family: "Stun",catalogTier: 4,more: 70,lessDamage: false,line: 7190 },
  { id: "stun-iii",name: "Stun III",effectId: "SupportStunPlayerThree",family: "Stun",catalogTier: 5,more: 300,lessDamage: true,line: 7225 },
] as const;
export const poisonBowStunComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,range: [16,25],tierIIIRange: [8,12],hit: 5.38125,tierIIIHit: 2.625,buildup: .0017224117950039,tierIIIBuildup: .0033608035024466 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,range: [16,25],tierIIIRange: [8,12],hit: 5.38125,tierIIIHit: 2.625,buildup: .0017224117950039,tierIIIBuildup: .0033608035024466 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,range: [6,8],tierIIIRange: [3,4],hit: 1.8375,tierIIIHit: .91875,buildup: .00058814061292815,tierIIIBuildup: .0011762812258563 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,range: [13,20],tierIIIRange: [7,10],hit: 4.33125,tierIIIHit: 2.23125,buildup: .0013863314447592,tierIIIBuildup: .0028566829770796 },
  { skill: "gas-arrow",component: "conditional Fire explosion",actualHit: true,range: [17,25],tierIIIRange: [9,13],hit: 22.05,tierIIIHit: 11.55,buildup: .0047051249034252,tierIIIBuildup: .0098583569405099 },
] as const;
export const poisonBowStunControls = [
  { skill: "poisonburst-arrow",cost: 38,supportedCost: 45,doubleSupportedCost: 54,sourceDuration: 3,
    sourcePoison: 5.385766215481,tierIIISourcePoison: 2.6014267003078,moreMagnitudePoison: 3.1217120403693,
    arrowPoison: 4.5657724526838,tierIIIArrowPoison: 2.2196678385355,
    increasedBuildup: [.0034448235900077,.0051672353850116,.0058562001030131,.0067216070048931],blockedBuildup: 0 },
  { skill: "gas-arrow",cost: 62,supportedCost: 74,doubleSupportedCost: 89,sourceDuration: 2,
    sourcePoison: 4.0038541776187,tierIIISourcePoison: 2.0347455656751,moreMagnitudePoison: 2.4416946788101,
    arrowPoison: 1.5383141032889,tierIIIArrowPoison: .76915705164443,
    increasedBuildup: [.0011762812258563,.0017644218387844,.0019996780839557,.0023525624517126],blockedBuildup: 0 },
] as const;

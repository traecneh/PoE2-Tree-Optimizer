// Independently frozen PoB 0.23.1 MAIN observations, not live-game DPS or uptime.
export const poisonBowDeepCutsSupports = [
  { id: "deep-cuts-i",name: "Deep Cuts I",effectId: "SupportDeepCutsPlayer",family: "DeepCuts",catalogTier: 3,lessHit: 25,moreBleed: 75,line: 2347 },
  { id: "deep-cuts-ii",name: "Deep Cuts II",effectId: "SupportDeepCutsPlayerTwo",family: "DeepCuts",catalogTier: 5,lessHit: 30,moreBleed: 100,line: 2386 },
] as const;
export const poisonBowDeepCutsComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,physical: true,mana: 38,
    hit: [5.38125,3.9375,3.80625],range: [[16,25],[12,18],[12,17]],bleed: [4.4994588462054,5.6920864921875,6.1799796200893],poison: [0,0,0],duration: 0 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,physical: false,mana: 38,
    hit: [5.38125,3.9375,3.80625],range: [[16,25],[12,18],[12,17]],bleed: [4.4994588462054,5.6920864921875,6.1799796200893],poison: [5.385766215481,3.9021400504617,3.7192272355963],duration: 3 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,physical: true,mana: 62,
    hit: [1.8375,1.3125,1.3125],range: [[6,8],[4,6],[4,6]],bleed: [1.4636793837054,1.8973621640625,2.1684139017857],poison: [0,0,0],duration: 0 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,physical: false,mana: 62,
    hit: [4.33125,3.28125,3.01875],range: [[13,20],[10,15],[9,14]],bleed: [3.6049881117188,4.7434054101563,5.0415623216518],poison: [4.0038541776187,3.0192998716469,2.79613422896],duration: 2 },
  { skill: "gas-arrow",component: "conditional Fire detonation",actualHit: true,physical: false,mana: 62,
    hit: [22.05,16.8,15.75],range: [[0,0],[0,0],[0,0]],bleed: [0,0,0],poison: [0,0,0],duration: 0 },
] as const;
export const poisonBowDeepCutsInteractions = [
  { skill: "poisonburst-arrow",hitOnlyBleed: [3.2526208526786,3.0899898100446],aggravated: [11.384172984375,12.359959240179],
    arrowPoison: [4.5657724526838,3.3295017578033,3.2030649821905],poisonCost: 45,deadlyPoison: [7.4384544711926,5.6702972608271,5.2028534006156] },
  { skill: "gas-arrow",hitOnlyBleed: [1.0842069508929,1.0842069508929],aggravated: [3.794724328125,4.3368278035714],
    arrowPoison: [1.5383141032889,1.1098339192678,1.1098339192678],poisonCost: 74,deadlyPoison: [5.5922684579199,4.0694911313502,3.9382172238873] },
] as const;

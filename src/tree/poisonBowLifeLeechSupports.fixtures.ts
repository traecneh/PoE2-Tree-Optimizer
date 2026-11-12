// Independent frozen PoB 0.23.1 snapshots: source-hit estimates are not no-hit healing or live sustain.
export const poisonBowLifeLeechSupportFixtures = [
  { id: "life-leech-i",name: "Life Leech I",effectId: "SupportLifeLeechPlayer",family: "LifeLeech",catalogTier: 2,percent: 12,retains: false,line: 4924 },
  { id: "life-leech-ii",name: "Life Leech II",effectId: "SupportLifeLeechPlayerTwo",family: "LifeLeech",catalogTier: 3,percent: 16,retains: false,line: 4955 },
  { id: "life-leech-iii",name: "Life Leech III",effectId: "SupportLifeLeechPlayerThree",family: "LifeLeech",catalogTier: 5,percent: 16,retains: true,line: 4986 },
] as const;
export const poisonBowLifeLeechComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,physicalHit: 5.125,physicalCrit: 10.25,packets: [.64575,.861,.861],rates: [.7749,1.0332,1.0332],poison: 0 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,physicalHit: 5.125,physicalCrit: 10.25,packets: [.64575,.861,.861],rates: [.7749,1.0332,1.0332],poison: 5.385766215481 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,physicalHit: 1.75,physicalCrit: 3.5,packets: [.2205,.294,.294],rates: [.2646,.3528,.3528],poison: 0 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,physicalHit: 4.125,physicalCrit: 8.25,packets: [.51975,.693,.693],rates: [.6237,.8316,.8316],poison: 4.0038541776187 },
  { skill: "gas-arrow",component: "conditional Fire explosion",actualHit: true,physicalHit: 0,physicalCrit: 0,packets: [0,0,0],rates: [0,0,0],poison: 0 },
] as const;
export const poisonBowLifeLeechControls = [
  { skill: "poisonburst-arrow",mana: 38,packet: .861,rate: 1.0332,fullII: .861,fullIII: .861,retentionFlagII: false,retentionFlagIII: false,globalControl: true,
    poison: 5.385766215481,morePoison: 6.4629194585772,stressHit: 19954.044621805,stressCrit: 40515.167163357 },
  { skill: "gas-arrow",mana: 62,packet: .294,rate: .3528,fullII: .294,fullIII: .294,retentionFlagII: false,retentionFlagIII: false,globalControl: true,
    poison: 4.0038541776187,morePoison: 4.8046250131425,stressHit: 6474.000519987,stressCrit: 13505.881284111 },
] as const;

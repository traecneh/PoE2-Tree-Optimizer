// Independent frozen PoB 0.23.1 snapshots; native source-hit fields are not real no-hit recovery.
export const poisonBowManaLeechSupportFixture = {
  id: "mana-leech",name: "Mana Leech",effectId: "SupportManaLeechPlayer",family: "ManaLeech",catalogTier: 2,percent: 8,line: 6833,
} as const;
export const poisonBowManaLeechComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,physicalHit: 5.125,physicalCrit: 10.25,packet: .4305,rate: .5166 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,physicalHit: 5.125,physicalCrit: 10.25,packet: .4305,rate: .5166 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,physicalHit: 1.75,physicalCrit: 3.5,packet: .147,rate: .1764 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,physicalHit: 4.125,physicalCrit: 8.25,packet: .3465,rate: .4158 },
  { skill: "gas-arrow",component: "conditional Fire explosion",actualHit: true,physicalHit: 0,physicalCrit: 0,packet: 0,rate: 0 },
] as const;
export const poisonBowManaLeechControls = [
  { skill: "poisonburst-arrow",cost: 38,spend: 45.6,linkedCost: 45,linkedSpend: 54,packet: .4305,rate: .5166,
    poison: 5.385766215481,morePoison: 6.4629194585772,stressHit: 19954.044621805,stressCrit: 40515.167163357,
    stressPacket: 254.1,stressDuration: 5,stressRate: 508.2,stressSpend: 1151.5151515152,cannotLeech: 0,cannotGain: 0 },
  { skill: "gas-arrow",cost: 62,spend: 74.4,linkedCost: 74,linkedSpend: 88.8,packet: .147,rate: .1764,
    poison: 4.0038541776187,morePoison: 4.8046250131425,stressHit: 6474.000519987,stressCrit: 13505.881284111,
    stressPacket: 254.1,stressDuration: 5,stressRate: 508.2,stressSpend: 1878.7878787879,cannotLeech: 0,cannotGain: 0 },
] as const;

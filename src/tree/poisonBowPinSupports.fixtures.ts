// Independent frozen PoB 0.23.1 snapshots: no-hit source fields and fixed target states are not uptime.
export const poisonBowPinSupportFixtures = [
  { id: "pin-i",name: "Pin I",effectId: "SupportPinPlayer",family: "Pin",catalogTier: 1,tier: 1,line: 3747 },
  { id: "pin-ii",name: "Pin II",effectId: "SupportPinPlayerTwo",family: "Pin",catalogTier: 2,tier: 2,line: 3779 },
  { id: "pin-iii",name: "Pin III",effectId: "SupportPinPlayerThree",family: "Pin",catalogTier: 5,tier: 3,line: 3812 },
] as const;
export const poisonBowPinComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,physicalHit: 5.125,physicalCrit: 10.25,
    pin: .0083150914241566,tierIII: .0033260365696626,immobilisedPin: .0085130697913984 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,physicalHit: 5.125,physicalCrit: 10.25,
    pin: .0083150914241566,tierIII: .0033260365696626,immobilisedPin: .0085130697913984 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,physicalHit: 1.75,physicalCrit: 3.5,
    pin: .0028392995106876,tierIII: .001135719804275,immobilisedPin: .0029069018799897 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,physicalHit: 4.125,physicalCrit: 8.25,
    pin: .0066926345609065,tierIII: .0026770538243626,immobilisedPin: .0068519830028329 },
  { skill: "gas-arrow",component: "conditional Fire explosion",actualHit: true,physicalHit: 0,physicalCrit: 0,
    pin: 0,tierIII: 0,immobilisedPin: 0 },
] as const;
export const poisonBowPinControls = [
  { skill: "poisonburst-arrow",cost: 38,linkedCost: 45,sourceDuration: 3,sourceRange: [16,25],arrowRange: [16,25],
    sourcePoison: 5.385766215481,immobilisedSourcePoison: 5.7365175925189,arrowPoison: 4.5657724526838,immobilisedArrowPoison: 4.7149179699004,
    basePin: .0083150914241566,stunPairs: [.012472637136235,.014135655421066,.016224568632501],
    pinIIIStunIII: .0064898274530003,increasedStun: .016630182848313,increasedBoth: .02494527427247,
    stunIIIRange: [8,12],mappedPinDurationMore: 1 },
  { skill: "gas-arrow",cost: 62,linkedCost: 74,sourceDuration: 2,sourceRange: [13,20],arrowRange: [6,8],
    sourcePoison: 4.0038541776187,immobilisedSourcePoison: 4.2005518211566,arrowPoison: 1.5383141032889,immobilisedArrowPoison: 1.5885646698587,
    basePin: .0028392995106876,stunPairs: [.0042589492660314,.0048268091681689,.0056785990213752],
    pinIIIStunIII: .0022714396085501,increasedStun: .0056785990213752,increasedBoth: .0085178985320628,
    stunIIIRange: [3,4],mappedPinDurationMore: 1 },
] as const;

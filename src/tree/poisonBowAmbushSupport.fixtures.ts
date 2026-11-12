// Independent frozen PoB 0.23.1 snapshots; Full Life is held fixed, not a live opener timeline.
export const poisonBowAmbushSupportFixture = {
  id: "ambush", name: "Ambush", effectId: "SupportAmbushPlayer", family: "Ambush", catalogTier: 1, moreChance: 100, line: 524,
} as const;
export const poisonBowAmbushComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, range: [16,25], hits: [5.38125,5.6375] },
  { skill: "poisonburst-arrow", component: "no-hit burst source", actualHit: false, range: [16,25], hits: [5.38125,5.6375] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, range: [6,8], hits: [1.8375,1.925] },
  { skill: "gas-arrow", component: "no-hit cloud source", actualHit: false, range: [13,20], hits: [4.33125,4.5375] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, range: [17,25], hits: [22.05,23.1] },
] as const;
export const poisonBowAmbushCriticalContexts = [
  { id: "super",chance: .04,multiplier: 3,seconds: 0 },
  { id: "pinpoint",chance: .08,multiplier: 1.7,seconds: 0 },
  { id: "superPinpoint",chance: .064,multiplier: 2.4,seconds: 0 },
  { id: "inexI",chance: .075,multiplier: 2,seconds: 5 },
  { id: "inexII",chance: .15,multiplier: 1.5,seconds: 5 },
] as const;
export const poisonBowAmbushSources = [
  { skill: "poisonburst-arrow", duration: 3, mana: 38, linkedMana: 45,
    poison: [5.385766215481,6.0634684714579], neverPoison: 4.6086956521739, cappedPoison: 9.2173913043478,
    criticalPairs: [[5.8684437337938,6.9988621525034], [5.4452539272892,6.1125908799838], [5.9757739851985,7.1202418210849],
      [5.7365175925189,6.6500349027371], [5.6293652774555,6.2749255042932]],
    arrowPoison: [4.5657724526838,4.8623002024632] },
  { skill: "gas-arrow", duration: 2, mana: 62, linkedMana: 74,
    poison: [4.0038541776187,4.3899456363791], neverPoison: 3.5882352941176, cappedPoison: 7.1764705882353,
    criticalPairs: [[4.2579896248619,4.8897894289995], [4.0437792413263,4.4470898741553], [4.3255789737228,4.9955974185022],
      [4.2005518211566,4.7471415838902], [4.1676884390039,4.6201226319602]],
    arrowPoison: [1.5383141032889,1.6382211451376] },
] as const;

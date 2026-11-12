// Independent frozen PoB 0.23.1 observations, not live critical uptime or reset simulations.
export const poisonBowPinpointSupportFixture = {
  id: "pinpoint-critical", name: "Pinpoint Critical", effectId: "SupportPinpointCriticalPlayer", family: "PinpointCritical",
  catalogTier: 2, moreChance: 60, lessBonus: 30, line: 7342,
} as const;
export const poisonBowPinpointComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, range: [16,25], hits: [5.38125,5.412] },
  { skill: "poisonburst-arrow", component: "no-hit burst source", actualHit: false, range: [16,25], hits: [5.38125,5.412] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, range: [6,8], hits: [1.8375,1.848] },
  { skill: "gas-arrow", component: "no-hit cloud source", actualHit: false, range: [13,20], hits: [4.33125,4.356] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, range: [17,25], hits: [22.05,22.176] },
] as const;

// Inexorable arrays are paired without/with Pinpoint at explicit 0/2/5/10 seconds.
export const poisonBowPinpointSources = [
  { skill: "poisonburst-arrow", duration: 3, mana: 38, inexMana: 45,
    poison: [5.385766215481,5.4452539272892], superPoison: [5.8684437337938,5.9757739851985],
    cappedPoison: [9.2173913043478,7.8347826086957], neverPoison: 4.6086956521739,
    inexI: [[5.385766215481,5.528988851137,5.7365175925189,6.0634684714579], [5.4452539272892,5.5915081119931,5.7986142283604,6.1125908799838]],
    inexII: [[5.385766215481,5.6701219104496,5.6293652774555,5.6293652774555], [5.4452539272892,5.7149741149075,5.6211534049711,5.6211534049711]],
    superInex: [[6.4492820501001,6.5743205718122], [6.3085793324403,6.337316617168]],
    arrowPoison: [4.5657724526838,4.5998639591403] },
  { skill: "gas-arrow", duration: 2, mana: 62, inexMana: 74,
    poison: [4.0038541776187,4.0437792413263], superPoison: [4.2579896248619,4.3255789737228],
    cappedPoison: [7.1764705882353,6.1], neverPoison: 3.5882352941176,
    inexI: [[4.0038541776187,4.0834147359121,4.2005518211566,4.3899456363791], [4.0437792413263,4.1285617124513,4.2518493609133,4.4470898741553]],
    inexII: [[4.0038541776187,4.1696946617191,4.1676884390039,4.1676884390039], [4.0437792413263,4.2140616419373,4.1941352735025,4.1941352735025]],
    superInex: [[4.5785941777066,4.6688881307849], [4.5362553895401,4.5942037213723]],
    arrowPoison: [1.5383141032889,1.5498003185411] },
] as const;

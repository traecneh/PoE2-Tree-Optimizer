// Independent frozen PoB 0.23.1 observations: empty Witch, Physical Crude Bow.
export const poisonBowRicochetSupportFixtures = [
  { id: "ricochet-i", name: "Ricochet I", effectId: "SupportRicochetPlayer", family: "Ricochet", catalogTier: 2, chance: 40, line: 4922 },
  { id: "ricochet-ii", name: "Ricochet II", effectId: "SupportRicochetPlayerTwo", family: "Ricochet", catalogTier: 4, chance: 50, line: 4952 },
] as const;

// Baseline / I / II are identical: native chance is not a contact multiplier.
export const poisonBowRicochetComponents = [
  { skill: "poisonburst-arrow", component: "arrow", actualHit: true, hits: [5.38125,5.38125,5.38125], range: [16,25] },
  { skill: "poisonburst-arrow", component: "burst source", actualHit: false, hits: [5.38125,5.38125,5.38125], range: [16,25] },
  { skill: "gas-arrow", component: "arrow", actualHit: true, hits: [1.8375,1.8375,1.8375], range: [6,8] },
  { skill: "gas-arrow", component: "cloud source", actualHit: false, hits: [4.33125,4.33125,4.33125], range: [13,20] },
  { skill: "gas-arrow", component: "conditional Fire explosion", actualHit: true, hits: [22.05,22.05,22.05], range: [17,25] },
] as const;

export const poisonBowRicochetSources = [
  { skill: "poisonburst-arrow", poison: [5.385766215481,5.385766215481,5.385766215481],
    deliveryPoison: [3.2517833753847,3.2517833753847,3.2517833753847], novaPoison: [.78563411896745,.78563411896745,.78563411896745],
    roll: 78.260869565217, duration: 3, mana: 38, efficiencyMana: 23, poisonIIIMana: 45, deliveryMana: 41, timer: 3.003, radius: 24 },
  { skill: "gas-arrow", poison: [4.0038541776187,4.0038541776187,4.0038541776187],
    deliveryPoison: [2.4154398973175,2.4154398973175,2.4154398973175], novaPoison: [.44519266741489,.44519266741489,.44519266741489],
    roll: 70.588235294118, duration: 2, mana: 62, efficiencyMana: 38, poisonIIIMana: 74, deliveryMana: 68, timer: 4.026, radius: 18 },
] as const;

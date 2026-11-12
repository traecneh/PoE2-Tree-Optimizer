// Frozen source identities and isolated PoB 0.23.1 observations, independent of the catalog implementation.
export const poisonBowSupportFixtures = [
  { id: "magnified-area-i", name: "Magnified Area I", effectId: "SupportMagnifiedAreaPlayer", family: "IncreasedAreaOfEffect", amount: 35, kind: "area" },
  { id: "magnified-area-ii", name: "Magnified Area II", effectId: "SupportMagnifiedAreaPlayerTwo", family: "IncreasedAreaOfEffect", amount: 45, kind: "area" },
  { id: "prolonged-duration-i", name: "Prolonged Duration I", effectId: "ProlongedDurationSupportPlayer", family: "ProlongedDuration", amount: 30, kind: "duration" },
  { id: "prolonged-duration-ii", name: "Prolonged Duration II", effectId: "ProlongedDurationSupportPlayerTwo", family: "ProlongedDuration", amount: 35, kind: "duration" },
  { id: "efficiency-i", name: "Efficiency I", effectId: "SupportEfficiencyPlayer", family: "Efficiency", amount: 30, kind: "cost" },
  { id: "efficiency-ii", name: "Efficiency II", effectId: "SupportEfficiencyPlayerTwo", family: "Efficiency", amount: 40, kind: "cost" },
] as const;

export const poisonBowSupportIds = ["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii"];
export const poisonBowCombinedSupportIds = ["magnified-area-ii", "prolonged-duration-ii", "efficiency-ii"];
export const poisonBowSupportComponents = [
  { skill: "poisonburst-arrow", component: "Poison Burst", linkedPoisonDuration: true,
    radius: 24, magnifiedI: 27, magnifiedII: 28, area100WithMagnifiedII: 37,
    sourceDuration: 3, roundedDuration: 3.003, prolongedI: 3.927, prolongedII: 4.059, duration100WithProlongedII: 8.118,
    poisonDuration: 3, prolongedIPoison: 3.9, prolongedIIPoison: 4.05, duration100Poison: 8.1, poison100Poison: 8.1,
    manaCost: 38, magnifiedCost: 49, prolongedCost: 45, efficiencyI: 27, efficiencyII: 23, combinedCost: 36,
    poison: 5.385766215481, prolongedIPoisonDPS: 5.68253518591, prolongedIIPoisonDPS: 5.7282710959283,
    magnitudeUnaffectedPoison: 5.385766215481, hit: 5.38125, hitWithEachSupport: 5.38125, rate: 1.2, rateWithEachSupport: 1.2 },
  { skill: "gas-arrow", component: "Poison Cloud", linkedPoisonDuration: false,
    radius: 18, magnifiedI: 20, magnifiedII: 21, area100WithMagnifiedII: 28,
    sourceDuration: 4, roundedDuration: 4.026, prolongedI: 5.214, prolongedII: 5.412, duration100WithProlongedII: 10.824,
    poisonDuration: 2, prolongedIPoison: 2, prolongedIIPoison: 2, duration100Poison: 2, poison100Poison: 4,
    manaCost: 62, magnifiedCost: 80, prolongedCost: 74, efficiencyI: 44, efficiencyII: 38, combinedCost: 58,
    poison: 4.0038541776187, prolongedIPoisonDPS: 4.0038541776187, prolongedIIPoisonDPS: 4.0038541776187,
    magnitudeUnaffectedPoison: 4.0038541776187, hit: 4.33125, hitWithEachSupport: 4.33125, rate: 1.2, rateWithEachSupport: 1.2 },
] as const;

export const poisonBowSupportHitControls = [
  { skill: "poisonburst-arrow", component: "Arrow", hit: 5.38125, hitWithEachSupport: 5.38125, hasPoisonOutput: false },
  { skill: "gas-arrow", component: "Arrow", hit: 1.8375, hitWithEachSupport: 1.8375, hasPoisonOutput: false },
  { skill: "gas-arrow", component: "Explosion", hit: 11.025, hitWithEachSupport: 11.025, hasPoisonOutput: false },
] as const;

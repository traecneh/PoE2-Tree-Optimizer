// Frozen from the isolated PoB 0.23.1 fourteen-pair / 36-component support review.
// Expectations are independent of the app allowlists and text generation.
export const plantBowSupportFixtures = [
  { id: "magnified-area-i", name: "Magnified Area I", effectId: "SupportMagnifiedAreaPlayer", family: "IncreasedAreaOfEffect", amount: 35, kind: "area" },
  { id: "magnified-area-ii", name: "Magnified Area II", effectId: "SupportMagnifiedAreaPlayerTwo", family: "IncreasedAreaOfEffect", amount: 45, kind: "area" },
  { id: "prolonged-duration-i", name: "Prolonged Duration I", effectId: "ProlongedDurationSupportPlayer", family: "ProlongedDuration", amount: 30, kind: "duration" },
  { id: "prolonged-duration-ii", name: "Prolonged Duration II", effectId: "ProlongedDurationSupportPlayerTwo", family: "ProlongedDuration", amount: 35, kind: "duration" },
  { id: "efficiency-i", name: "Efficiency I", effectId: "SupportEfficiencyPlayer", family: "Efficiency", amount: 30, kind: "cost" },
  { id: "efficiency-ii", name: "Efficiency II", effectId: "SupportEfficiencyPlayerTwo", family: "Efficiency", amount: 40, kind: "cost" },
  { id: "mobility", name: "Mobility", effectId: "SupportMobilityPlayer", family: "Mobility", amount: 25, kind: "movement" },
] as const;

// Current union also includes the separate speed and three-pair trade-off reviews.
export const plantBowSupportCompatibility = [
  { skill: "vine-arrow", allowed: ["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii", "mobility",
    "swift-affliction-i", "swift-affliction-ii", "rapid-attacks-i", "rapid-attacks-ii", "projectile-acceleration-i", "projectile-acceleration-ii"] },
  { skill: "toxic-growth", allowed: ["magnified-area-i", "magnified-area-ii", "efficiency-i", "efficiency-ii",
    "rapid-attacks-i", "rapid-attacks-ii", "concentrated-area", "projectile-acceleration-i", "projectile-acceleration-ii"] },
] as const;

export const plantBowSupportComponents = [
  { skill: "vine-arrow", component: "Impact", radius: 8, magnifiedI: 9, magnifiedII: 9, duration: 8, roundedDuration: 8.019, prolongedI: 10.428, prolongedII: 10.824,
    manaCost: 47, magnifiedCost: 61, prolongedCost: 56, efficiencyI: 33, efficiencyII: 29, retainedSpeed: 30, mobilityRetainedSpeed: 47.5, rate: 1.2 },
  { skill: "vine-arrow", component: "Vines", radius: 24, magnifiedI: 27, magnifiedII: 28, duration: 8, roundedDuration: 8.019, prolongedI: 10.428, prolongedII: 10.824,
    manaCost: 47, magnifiedCost: 61, prolongedCost: 56, efficiencyI: 33, efficiencyII: 29, retainedSpeed: 30, mobilityRetainedSpeed: 47.5, rate: 1.2,
    intrinsicDoT: 271.3, intrinsicDoTWithEachSupport: 271.3, area100WithMagnifiedII: 37, duration100WithProlongedII: 21.615 },
  { skill: "toxic-growth", component: "Pustules", radius: 8, magnifiedI: 9, magnifiedII: 9, manaCost: 98, magnifiedCost: 127, efficiencyI: 69, efficiencyII: 59,
    rate: 1.2, detonation: 15, detonationWithEachSupport: 15, rejectedDurationCost: 98, rejectedMobilityCost: 98, hit: 1.3125, hitWithEachSupport: 1.3125 },
  { skill: "toxic-growth", component: "Explosion", radius: 8, magnifiedI: 9, magnifiedII: 9, manaCost: 98, magnifiedCost: 127, efficiencyI: 69, efficiencyII: 59,
    rate: 1.2, detonation: 15, detonationWithEachSupport: 15, rejectedDurationCost: 98, rejectedMobilityCost: 98, hit: 1.3125, hitWithEachSupport: 1.3125,
    outgoingPoison: 1.2077199486588, outgoingPoisonWithEachSupport: 1.2077199486588, poisonDuration: 2, poisonDurationWithEachSupport: 2 },
] as const;

export const plantBowCombinedSupportFixtures = [
  { skill: "vine-arrow", applied: ["magnified-area-ii", "prolonged-duration-ii", "efficiency-ii", "mobility"], manaCost: 44,
    radius: 28, duration: 10.824, retainedSpeed: 47.5, rate: 1.2, intrinsicDoT: 271.3 },
  { skill: "toxic-growth", applied: ["magnified-area-ii", "efficiency-ii"], manaCost: 77,
    radius: 9, detonation: 15, poisonDuration: 2, rate: 1.2, hit: 1.3125 },
] as const;

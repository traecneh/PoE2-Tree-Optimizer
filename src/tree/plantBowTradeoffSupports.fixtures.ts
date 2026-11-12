// Independent PoB 0.23.1 source facts and 26 MAIN component/control outputs.
export const plantBowTradeoffSupports = [
  { skill: "vine-arrow", id: "swift-affliction-i", name: "Swift Affliction I", effectId: "SupportSwiftAfflictionPlayer", family: "SwiftAffliction",
    moreDamage: 30, lessDuration: 20, preference: "skillDuration", weight: 3 },
  { skill: "vine-arrow", id: "swift-affliction-ii", name: "Swift Affliction II", effectId: "SupportSwiftAfflictionPlayerTwo", family: "SwiftAffliction",
    moreDamage: 30, lessDuration: 10, preference: "skillDuration", weight: 3 },
  { skill: "toxic-growth", id: "concentrated-area", name: "Concentrated Area", effectId: "SupportConcentratedAreaPlayer", family: "ConcentratedEffect",
    moreDamage: 30, lessArea: 50, preference: "areaOfEffect", weight: 2 },
] as const;

export const vineAfflictionNative = {
  dot: 271.3, swiftIDot: 352.69, swiftIIDot: 352.69, radius: 24, swiftRadius: 24, mana: 47, swiftMana: 47, rate: 1.2, swiftRate: 1.2,
  baseDuration: 8, roundedDuration: 8.019,
  singlePenaltyI: 6.402, singlePenaltyII: 7.227,
  nativeDurationI: 5.148, nativeDurationII: 6.501, nativeDurationModI: .64, nativeDurationModII: .81,
  increased100NativeDurationII: 12.969, combinedProlongedIINativeDuration: 8.811, combinedNativeDurationMod: 1.10, combinedEfficiencyIIMana: 34,
  impactHit: 4.33125, supportedImpactHit: 4.33125,
  suppliedPoisonModeled: false, exactGameLifetimeVerified: false,
} as const;

export const toxicConcentratedComponents = [
  { component: "Pustules", radius: 8, concentratedRadius: 5, increased100Radius: 8, hit: 1.3125, concentratedHit: 1.575,
    mana: 98, concentratedMana: 98, rate: 1.2, concentratedRate: 1.2, detonation: 15, concentratedDetonation: 15 },
  { component: "Explosion", radius: 8, concentratedRadius: 5, increased100Radius: 8, hit: 1.3125, concentratedHit: 1.575,
    mana: 98, concentratedMana: 98, rate: 1.2, concentratedRate: 1.2, detonation: 15, concentratedDetonation: 15,
    poisonDuration: 2, concentratedPoisonDuration: 2, outgoingPoisonDps: 1.2077199486588, concentratedOutgoingPoisonDps: 1.4308855913457,
    combinedMagnifiedIIRadius: 6, combinedEfficiencyIIMana: 77 },
] as const;

export const plantBowTradeoffControls = {
  allSixPairsNativelyCompatible: true,
  vineConcentratedDot: 271.3, vineConcentratedRadius: 16,
  toxicSwiftHit: 1.3125, toxicSwiftDetonation: 15, toxicSwiftIPoisonDuration: 1.6, toxicSwiftIIPoisonDuration: 1.8,
  vineOwnImpactPoisonDuration: 2, vineOwnSwiftIPoisonDuration: 1.6, vineOwnSwiftIIPoisonDuration: 1.8,
  vineOwnPoisonMagnitude: 1, vineOwnSupportedPoisonMagnitude: 1,
} as const;

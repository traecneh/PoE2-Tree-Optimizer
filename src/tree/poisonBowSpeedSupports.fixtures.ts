// Independent frozen identities and isolated PoB 0.23.1 observations from 40 MAIN component checks.
export const poisonBowSpeedSupportFixtures = [
  { id: "rapid-attacks-i", name: "Rapid Attacks I", effectId: "SupportRapidAttacksPlayer", family: "RapidAttacks", kind: "attack", amount: 15 },
  { id: "rapid-attacks-ii", name: "Rapid Attacks II", effectId: "SupportRapidAttacksPlayerTwo", family: "RapidAttacks", kind: "attack", amount: 25 },
  { id: "projectile-acceleration-i", name: "Projectile Acceleration I", effectId: "SupportProjectileAccelerationPlayer", family: "ProjectileSpeed", kind: "projectile", amount: 40 },
  { id: "projectile-acceleration-ii", name: "Projectile Acceleration II", effectId: "SupportProjectileAccelerationPlayerTwo", family: "ProjectileSpeed", kind: "projectile", amount: 40 },
] as const;

export const poisonBowReviewedSupportIds = ["magnified-area-i", "magnified-area-ii", "prolonged-duration-i", "prolonged-duration-ii", "efficiency-i", "efficiency-ii",
  "mobility", "swift-affliction-i", "swift-affliction-ii", "rapid-attacks-i", "rapid-attacks-ii", "concentrated-area", "close-combat-i", "close-combat-ii", "projectile-acceleration-i", "projectile-acceleration-ii", "brutality-i", "brutality-ii", "brutality-iii", "deadly-poison-i", "deadly-poison-ii", "deliberation", "escalating-poison", "bursting-plague", "poison-i", "poison-ii", "poison-iii", "admixture", "bleed-i", "bleed-ii", "bleed-iii", "corrosion", "compressed-duration-i", "compressed-duration-ii", "culling-strike-i", "culling-strike-ii", "blind-i", "blind-ii", "blindside", "bounty-i", "bounty-ii", "maim", "malady", "heft", "longshot-i", "longshot-ii", "execute-i", "execute-ii", "execute-iii", "exploit-weakness", "chaos-mastery", "chaos-attunement", "withering-touch", "pierce-i", "pierce-ii", "pierce-iii", "fork", "chain-i", "chain-ii", "chain-iii", "multishot-i", "multishot-ii", "nova-projectiles-i", "nova-projectiles-ii", "ricochet-i", "ricochet-ii", "salvo", "momentum", "supercritical", "inexorable-critical-i", "inexorable-critical-ii", "pinpoint-critical", "ambush",
  "life-leech-i", "life-leech-ii", "life-leech-iii", "mana-leech", "stun-i", "stun-ii", "stun-iii", "pin-i", "pin-ii", "pin-iii", "life-drain", "soul-drain", "armour-break-i", "armour-break-ii", "armour-break-iii", "armour-demolisher-i", "armour-demolisher-ii", "armour-explosion", "rupture", "rusted-spikes", "deep-cuts-i", "deep-cuts-ii"];

export function poisonBowReviewedSupportIdsFor(skill: string): string[] {
  return [...poisonBowReviewedSupportIds, ...(skill === "gas-arrow" ? ["overabundance-i", "overabundance-ii"] : [])];
}

export const poisonBowSpeedNative = {
  baseRate: 1.2, rapidI: 1.38, rapidII: 1.5, increasedAttack100WithII: 2.7,
  projectileBase: 1, projectileI: 1.4, projectileII: 1.4, increasedProjectile100WithII: 2.8,
  nativePierceCountI: 0, nativePierceCountII: .4, tierIIPierceChance: 40, speedToDamageConversion: false,
} as const;

export const poisonBowSpeedComponents = [
  { skill: "poisonburst-arrow", component: "Arrow", mana: 38, rapidMana: 38, projectileMana: 45, combinedWithEfficiencyII: 27, hit: 5.38125, supportedHit: 5.38125 },
  { skill: "poisonburst-arrow", component: "Poison Burst", mana: 38, rapidMana: 38, projectileMana: 45, combinedWithEfficiencyII: 27,
    hit: 5.38125, supportedHit: 5.38125, duration: 3.003, supportedDuration: 3.003, poisonDuration: 3, supportedPoisonDuration: 3, radius: 24, supportedRadius: 24,
    projectilePoisonDPS: 5.385766215481, baselinePoisonDPS: 5.385766215481 },
  { skill: "gas-arrow", component: "Arrow", mana: 62, rapidMana: 62, projectileMana: 74, combinedWithEfficiencyII: 45, hit: 1.8375, supportedHit: 1.8375 },
  { skill: "gas-arrow", component: "Poison Cloud", mana: 62, rapidMana: 62, projectileMana: 74, combinedWithEfficiencyII: 45,
    hit: 4.33125, supportedHit: 4.33125, duration: 4.026, supportedDuration: 4.026, poisonDuration: 2, supportedPoisonDuration: 2, radius: 18, supportedRadius: 18,
    projectilePoisonDPS: 4.0038541776187, baselinePoisonDPS: 4.0038541776187 },
  { skill: "gas-arrow", component: "Explosion", mana: 62, rapidMana: 62, projectileMana: 74, combinedWithEfficiencyII: 45, hit: 11.025, supportedHit: 11.025 },
] as const;

// Native repeated-application roll selection is not Poison tick speed, magnitude or guaranteed cloud contacts.
export const poisonBowSpeedPoisonFixtures = [
  { skill: "poisonburst-arrow", duration: 3, maxStacks: 1, magnitude: 1,
    rows: [{ rate: 1.2, potential: 3.6, roll: 78.260869565217, dps: 5.385766215481 },
      { rate: 1.38, potential: 4.14, roll: 80.544747081712, dps: 5.5394146805986 },
      { rate: 1.5, potential: 4.5, roll: 81.818181818182, dps: 5.6358581778053 }] },
  { skill: "gas-arrow", duration: 2, maxStacks: 1, magnitude: 1,
    rows: [{ rate: 1.2, potential: 2.4, roll: 70.588235294118, dps: 4.0038541776187 },
      { rate: 1.38, potential: 2.76, roll: 73.404255319149, dps: 4.1065293049709 },
      { rate: 1.5, potential: 3, roll: 75, dps: 4.17058125 }] },
] as const;

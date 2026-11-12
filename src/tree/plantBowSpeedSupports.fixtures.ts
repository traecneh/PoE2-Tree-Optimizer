// Independent frozen PoB 0.23.1 identities and 32 MAIN component checks.
export const plantBowSpeedSupportFixtures = [
  { id: "rapid-attacks-i", name: "Rapid Attacks I", effectId: "SupportRapidAttacksPlayer", family: "RapidAttacks", kind: "attack", amount: 15 },
  { id: "rapid-attacks-ii", name: "Rapid Attacks II", effectId: "SupportRapidAttacksPlayerTwo", family: "RapidAttacks", kind: "attack", amount: 25 },
  { id: "projectile-acceleration-i", name: "Projectile Acceleration I", effectId: "SupportProjectileAccelerationPlayer", family: "ProjectileSpeed", kind: "projectile", amount: 40 },
  { id: "projectile-acceleration-ii", name: "Projectile Acceleration II", effectId: "SupportProjectileAccelerationPlayerTwo", family: "ProjectileSpeed", kind: "projectile", amount: 40 },
] as const;

export const plantBowSpeedComponents = [
  { skill: "vine-arrow", component: "Impact", mana: 47, rapidMana: 47, projectileMana: 56, combinedWithEfficiencyII: 34, hit: 4.33125, supportedHit: 4.33125,
    duration: 8.019, supportedDuration: 8.019 },
  { skill: "vine-arrow", component: "Vines", mana: 47, rapidMana: 47, projectileMana: 56, combinedWithEfficiencyII: 34,
    duration: 8.019, supportedDuration: 8.019, intrinsicDoT: 271.3, supportedIntrinsicDoT: 271.3 },
  { skill: "toxic-growth", component: "Pustules", mana: 98, rapidMana: 98, projectileMana: 117, combinedWithEfficiencyII: 71, hit: 1.3125, supportedHit: 1.3125,
    detonation: 15, supportedDetonation: 15 },
  { skill: "toxic-growth", component: "Explosion", mana: 98, rapidMana: 98, projectileMana: 117, combinedWithEfficiencyII: 71, hit: 1.3125, supportedHit: 1.3125,
    detonation: 15, supportedDetonation: 15, poisonDuration: 2, supportedPoisonDuration: 2 },
] as const;

export const plantBowSpeedNative = {
  baseRate: 1.2, rapidI: 1.38, rapidII: 1.5, increasedAttack100WithII: 2.7,
  projectileBase: 1, projectileI: 1.4, projectileII: 1.4, increasedProjectile100WithII: 2.8,
  nativePierceCountI: 0, nativePierceCountII: 0.4, tierIIPierceChance: 40, speedToDamageConversion: false,
} as const;

// PoB's repeated-hit roll selection is not supplied-Poison storage or stronger base hits.
export const plantBowOutgoingPoisonFixtures = [
  { probe: "baseline", rate: 1.2, duration: 2, maxStacks: 1, potential: 2.4, rollPercent: 70.588235294118, magnitudeEffect: 1, dps: 1.2077199486588 },
  { probe: "rapid-i", rate: 1.38, duration: 2, maxStacks: 1, potential: 2.76, rollPercent: 73.404255319149, magnitudeEffect: 1, dps: 1.2379800954575 },
  { probe: "rapid-ii", rate: 1.5, duration: 2, maxStacks: 1, potential: 3, rollPercent: 75, magnitudeEffect: 1, dps: 1.2568875 },
] as const;

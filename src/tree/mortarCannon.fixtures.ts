// Isolated PoB 0.23.1 metadata/native compatibility capture, not derived from presets.
export const mortarGrenadeFixtures = [
  { id: "explosive-grenade", name: "Explosive Grenade", effectId: "ExplosiveGrenadePlayer", damage: "fireDamage", cooldown: 2.5 },
  { id: "flash-grenade", name: "Flash Grenade", effectId: "FlashGrenadePlayer", damage: "physicalDamage", cooldown: 2.508 },
  { id: "gas-grenade", name: "Gas Grenade", effectId: "ToxicGrenadePlayer", damage: "physicalDamage", cooldown: 1.5 },
  { id: "voltaic-grenade", name: "Voltaic Grenade", effectId: "ShockGrenadePlayer", damage: "lightningDamage", cooldown: 2 },
  { id: "oil-grenade", name: "Oil Grenade", effectId: "OilGrenadePlayer", damage: "physicalDamage", cooldown: 2 },
  { id: "cluster-grenade", name: "Cluster Grenade", effectId: "ClusterGrenadePlayer", damage: "fireDamage", cooldown: 5.016 },
] as const;

export const mortarNativeFixture = {
  effectId: "MetaMortarCannonPlayer", supportId: "SupportMortarCannonPlayer", durationMs: 8000,
  requiredType: "Grenade", addedTypes: ["UsedByTotem", "UsedByProxy", "SupportedByMortarTotem"],
  excludedTypes: ["Meta", "HasUsageCondition", "Triggered", "Persistent"],
  moreDamage: -50, moreAttackSpeed: -50, increasedGrenadeCooldownRecovery: 100,
  explosive: { firingSpeed: 0.4, placementSpeed: 5 / 3, cooldown: 2.5, cooldownWith20Recovery: 25 / 11 },
} as const;

// Frozen PoB 0.23.1 generated game metadata, independent of preset construction.
export const ballistaSkillFixtures = [
  { id: "artillery-ballista", name: "Artillery Ballista", gemId: "Metadata/Items/Gems/SkillGemArtilleryBallista",
    tags: ["area", "attack", "dexterity", "duration", "grants_active_skill", "projectile", "strength", "sustained", "totem"],
    deployEffect: "ArtilleryBallistaPlayer", durationMs: 12000, deployDealsNoDamage: true,
    firingEffect: "ArtilleryBallistaProjectilePlayer", weapon: "Crossbow", types: ["Attack", "UsedByTotem", "UsedByProxy"],
    sets: [{ label: "Bolts", attack: true, projectile: true, totem: true, nativeAreaFlag: true, areaDamageStat: true, allDamageCanPin: true, fireConversion: [] }],
  },
  { id: "siege-ballista", name: "Siege Ballista", gemId: "Metadata/Items/Gems/SkillGemSiegeBallista",
    tags: ["area", "attack", "dexterity", "duration", "fire", "grants_active_skill", "projectile", "repeatable", "strength", "sustained", "totem"],
    deployEffect: "SiegeBallistaPlayer", durationMs: 8000, deployDealsNoDamage: true,
    firingEffect: "SiegeBallistaProjectilePlayer", weapon: "Crossbow", types: ["Attack", "UsedByTotem", "UsedByProxy"],
    sets: [
      { label: "Artillery", attack: true, projectile: true, totem: true, nativeAreaFlag: false, areaDamageStat: true, allDamageCanPin: false, fireConversion: [60] },
      { label: "Explosion", attack: true, projectile: true, totem: true, nativeAreaFlag: false, areaDamageStat: true, allDamageCanPin: false, fireConversion: [60, 40] },
    ],
  },
] as const;

export const ballistaIds = ["artillery-ballista", "siege-ballista"];

// Frozen metadata from the isolated PoB 0.23.1 source; no runtime or network dependency.
export const remainingAttackSkillFixtures = [
  {
    "id": "armour-piercing-rounds",
    "name": "Armour Piercing Rounds",
    "gemId": "Metadata/Items/Gems/SkillGemArmourPiercingRounds",
    "tags": [
      "ammunition",
      "attack",
      "dexterity",
      "grants_active_skill",
      "physical",
      "projectile",
      "strength"
    ],
    "nativeEffect": "ArmourPiercingBoltsPlayer",
    "family": "crossbow",
    "damage": "physicalDamage",
    "area": false,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      }
    ]
  },
  {
    "id": "fragmentation-rounds",
    "name": "Fragmentation Rounds",
    "gemId": "Metadata/Items/Gems/SkillGemFragmentationRounds",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "dexterity",
      "grants_active_skill",
      "merging",
      "payoff",
      "projectile",
      "strength"
    ],
    "nativeEffect": "FragmentationRoundsPlayer",
    "family": "crossbow",
    "damage": "physicalDamage",
    "area": false,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      },
      {
        "label": "Vs Frozen",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "permafrost-bolts",
    "name": "Permafrost Bolts",
    "gemId": "Metadata/Items/Gems/SkillGemPermafrostBolts",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "cold",
      "dexterity",
      "grants_active_skill",
      "merging",
      "projectile",
      "strength"
    ],
    "nativeEffect": "PermafrostBoltsPlayer",
    "family": "crossbow",
    "damage": "coldDamage",
    "area": false,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      }
    ]
  },
  {
    "id": "high-velocity-rounds",
    "name": "High Velocity Rounds",
    "gemId": "Metadata/Items/Gems/SkillGemHighVelocityRounds",
    "tags": [
      "ammunition",
      "attack",
      "dexterity",
      "duration",
      "grants_active_skill",
      "payoff",
      "physical",
      "projectile",
      "strength"
    ],
    "nativeEffect": "HighVelocityRoundsPlayer",
    "family": "crossbow",
    "damage": "physicalDamage",
    "area": false,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      },
      {
        "label": "Vs Armour Broken",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      }
    ]
  },
  {
    "id": "incendiary-shot",
    "name": "Incendiary Shot",
    "gemId": "Metadata/Items/Gems/SkillGemIncendiaryShot",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "dexterity",
      "fire",
      "grants_active_skill",
      "merging",
      "projectile",
      "strength"
    ],
    "nativeEffect": "IncendiaryShotPlayer",
    "family": "crossbow",
    "damage": "fireDamage",
    "area": false,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      }
    ]
  },
  {
    "id": "ice-shards",
    "name": "Ice Shards",
    "gemId": "Metadata/Items/Gems/SkillGemIceShards",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "cold",
      "dexterity",
      "grants_active_skill",
      "hazard",
      "projectile",
      "strength",
      "sustained"
    ],
    "nativeEffect": "IceShardsPlayer",
    "family": "crossbow",
    "damage": "coldDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      },
      {
        "label": "Shard",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "rapid-shot",
    "name": "Rapid Shot",
    "gemId": "Metadata/Items/Gems/SkillGemRapidShot",
    "tags": [
      "ammunition",
      "attack",
      "dexterity",
      "fire",
      "grants_active_skill",
      "projectile",
      "strength"
    ],
    "nativeEffect": "RapidShotPlayer",
    "family": "crossbow",
    "damage": "fireDamage",
    "area": false,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      }
    ]
  },
  {
    "id": "glacial-bolt",
    "name": "Glacial Bolt",
    "gemId": "Metadata/Items/Gems/SkillGemGlacialBolt",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "cold",
      "dexterity",
      "duration",
      "grants_active_skill",
      "projectile",
      "strength"
    ],
    "nativeEffect": "GlacialBoltPlayer",
    "family": "crossbow",
    "damage": "coldDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      },
      {
        "label": "Wall",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "stormblast-bolts",
    "name": "Stormblast Bolts",
    "gemId": "Metadata/Items/Gems/SkillGemStormblastBolts",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "dexterity",
      "duration",
      "grants_active_skill",
      "lightning",
      "projectile",
      "strength"
    ],
    "nativeEffect": "StormblastBoltsPlayer",
    "family": "crossbow",
    "damage": "lightningDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Impact",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      },
      {
        "label": "Explosion",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "hailstorm-rounds",
    "name": "Hailstorm Rounds",
    "gemId": "Metadata/Items/Gems/SkillGemHailstormRounds",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "cold",
      "dexterity",
      "grants_active_skill",
      "projectile",
      "strength",
      "sustained"
    ],
    "nativeEffect": "HailstormRoundsPlayer",
    "family": "crossbow",
    "damage": "coldDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Impact",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "shockburst-rounds",
    "name": "Shockburst Rounds",
    "gemId": "Metadata/Items/Gems/SkillGemShockburstRounds",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "dexterity",
      "grants_active_skill",
      "lightning",
      "payoff",
      "projectile",
      "strength"
    ],
    "nativeEffect": "ShockburstRoundsPlayer",
    "family": "crossbow",
    "damage": "lightningDamage",
    "area": false,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      },
      {
        "label": "Pulse",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "plasma-blast",
    "name": "Plasma Blast",
    "gemId": "Metadata/Items/Gems/SkillGemPlasmaBlast",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "channelling",
      "dexterity",
      "grants_active_skill",
      "lightning",
      "projectile",
      "strength"
    ],
    "nativeEffect": "PlasmaBlastPlayer",
    "family": "crossbow",
    "damage": "lightningDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Projectile",
        "flags": {
          "attack": true,
          "channelRelease": true,
          "projectile": true
        },
        "areaStat": false
      },
      {
        "label": "Explosion",
        "flags": {
          "area": true,
          "attack": true,
          "channelRelease": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "siege-cascade",
    "name": "Siege Cascade",
    "gemId": "Metadata/Items/Gems/SkillGemSiegeCascade",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "dexterity",
      "grants_active_skill",
      "projectile",
      "strength",
      "sustained"
    ],
    "nativeEffect": "SiegeCascadePlayer",
    "family": "crossbow",
    "damage": "physicalDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Impact",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      },
      {
        "label": "Explosion",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "flash-grenade",
    "name": "Flash Grenade",
    "gemId": "Metadata/Items/Gems/SkillGemFlashGrenade",
    "tags": [
      "area",
      "attack",
      "dexterity",
      "grants_active_skill",
      "grenade",
      "projectile",
      "strength"
    ],
    "nativeEffect": "FlashGrenadePlayer",
    "family": "grenade",
    "damage": "physicalDamage",
    "area": true,
    "speed": 1,
    "cooldown": true,
    "nativeSets": [
      {
        "label": "Flash Grenade",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "gas-grenade",
    "name": "Gas Grenade",
    "gemId": "Metadata/Items/Gems/SkillGemToxicGrenade",
    "tags": [
      "area",
      "attack",
      "chaos",
      "dexterity",
      "duration",
      "fire",
      "grants_active_skill",
      "grenade",
      "projectile",
      "strength"
    ],
    "nativeEffect": "ToxicGrenadePlayer",
    "family": "grenade",
    "damage": "physicalDamage",
    "area": true,
    "speed": 1,
    "cooldown": true,
    "nativeSets": [
      {
        "label": "Impact",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "projectile": true
        },
        "areaStat": true
      },
      {
        "label": "Poison Cloud",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "projectile": true
        },
        "areaStat": true
      },
      {
        "label": "Explosion",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "voltaic-grenade",
    "name": "Voltaic Grenade",
    "gemId": "Metadata/Items/Gems/SkillGemShockGrenade",
    "tags": [
      "area",
      "attack",
      "dexterity",
      "duration",
      "grants_active_skill",
      "grenade",
      "lightning",
      "projectile",
      "strength"
    ],
    "nativeEffect": "ShockGrenadePlayer",
    "family": "grenade",
    "damage": "lightningDamage",
    "area": true,
    "speed": 1,
    "cooldown": true,
    "nativeSets": [
      {
        "label": "Voltaic Grenade",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "oil-grenade",
    "name": "Oil Grenade",
    "gemId": "Metadata/Items/Gems/SkillGemOilGrenade",
    "tags": [
      "area",
      "attack",
      "dexterity",
      "duration",
      "fire",
      "grants_active_skill",
      "grenade",
      "projectile",
      "strength"
    ],
    "nativeEffect": "OilGrenadePlayer",
    "family": "grenade",
    "damage": "physicalDamage",
    "area": true,
    "speed": 1,
    "cooldown": true,
    "nativeSets": [
      {
        "label": "Primary Grenade",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "projectile": true
        },
        "areaStat": true
      },
      {
        "label": "Oil Ground",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "cluster-grenade",
    "name": "Cluster Grenade",
    "gemId": "Metadata/Items/Gems/SkillGemClusterGrenade",
    "tags": [
      "area",
      "attack",
      "dexterity",
      "fire",
      "grants_active_skill",
      "grenade",
      "projectile",
      "strength"
    ],
    "nativeEffect": "ClusterGrenadePlayer",
    "family": "grenade",
    "damage": "fireDamage",
    "area": true,
    "speed": 1,
    "cooldown": true,
    "nativeSets": [
      {
        "label": "Primary Grenade",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "projectile": true
        },
        "areaStat": true
      },
      {
        "label": "Mini Grenades",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "crossbow-shot",
    "name": "Crossbow Shot",
    "gemId": "Metadata/Items/Gems/SkillGemPlayerDefaultCrossbow",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "grants_active_skill",
      "projectile"
    ],
    "nativeEffect": "MeleeCrossbowPlayer",
    "family": "crossbow",
    "damage": "physicalDamage",
    "area": false,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Crossbow Shot",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": false
      }
    ]
  },
  {
    "id": "requiem",
    "name": "Requiem",
    "gemId": "Metadata/Items/Gems/SkillGemCrossbowRequiem",
    "tags": [
      "ammunition",
      "area",
      "attack",
      "cold",
      "conditional",
      "grants_active_skill",
      "projectile"
    ],
    "nativeEffect": "CrossbowRequiemPlayer",
    "family": "crossbow",
    "damage": "coldDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Requiem",
        "flags": {
          "area": true,
          "attack": true,
          "projectile": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "furious-slam",
    "name": "Furious Slam",
    "gemId": "Metadata/Items/Gems/SkillGemFuriousSlam",
    "tags": [
      "area",
      "attack",
      "bear",
      "grants_active_skill",
      "intelligence",
      "melee",
      "shapeshift",
      "slam",
      "strength"
    ],
    "nativeEffect": "FuriousSlamPlayer",
    "family": "melee-form",
    "damage": "physicalDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Base",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "melee": true
        },
        "areaStat": true
      },
      {
        "label": "Enraged",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "melee": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "fury-of-the-mountain",
    "name": "Fury of the Mountain",
    "gemId": "Metadata/Items/Gems/SkillGemBearFuryOfTheMountain",
    "tags": [
      "area",
      "attack",
      "bear",
      "channelling",
      "duration",
      "grants_active_skill",
      "intelligence",
      "melee",
      "shapeshift",
      "slam",
      "strength",
      "sustained"
    ],
    "nativeEffect": "BearFuryOfTheMountainPlayer",
    "family": "melee-form",
    "damage": "fireDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Fury of the Mountain",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "melee": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "rampage",
    "name": "Rampage",
    "gemId": "Metadata/Items/Gems/SkillGemBearRampage",
    "tags": [
      "area",
      "attack",
      "bear",
      "channelling",
      "grants_active_skill",
      "intelligence",
      "melee",
      "shapeshift",
      "slam",
      "strength",
      "sustained",
      "travel"
    ],
    "nativeEffect": "BearRampagePlayer",
    "family": "melee-form",
    "damage": "physicalDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Rampage",
        "flags": {
          "area": true,
          "attack": true,
          "melee": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "molten-crash",
    "name": "Molten Crash",
    "gemId": "Metadata/Items/Gems/SkillGemMoltenCrash",
    "tags": [
      "area",
      "attack",
      "bear",
      "grants_active_skill",
      "melee",
      "shapeshift",
      "slam",
      "travel"
    ],
    "nativeEffect": "MoltenCrashPlayer",
    "family": "melee-form",
    "damage": "physicalDamage",
    "area": true,
    "speed": 1,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Molten Crash",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "melee": true
        },
        "areaStat": true
      },
      {
        "label": "Fissures",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true,
          "melee": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "lunar-assault",
    "name": "Lunar Assault",
    "gemId": "Metadata/Items/Gems/SkillGemLunarAssault",
    "tags": [
      "area",
      "attack",
      "cold",
      "grants_active_skill",
      "intelligence",
      "melee",
      "shapeshift",
      "strength",
      "strike",
      "wolf"
    ],
    "nativeEffect": "LunarAssaultPlayer",
    "family": "melee-form",
    "damage": "coldDamage",
    "area": true,
    "speed": 2,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Base",
        "flags": {
          "area": true,
          "attack": true,
          "melee": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "pounce",
    "name": "Pounce",
    "gemId": "Metadata/Items/Gems/SkillGemWolfPounce",
    "tags": [
      "area",
      "attack",
      "duration",
      "grants_active_skill",
      "intelligence",
      "mark",
      "melee",
      "meta",
      "minion",
      "shapeshift",
      "slam",
      "strength",
      "travel",
      "trigger",
      "wolf"
    ],
    "nativeEffect": "WolfPouncePlayer",
    "family": "melee-form",
    "damage": "physicalDamage",
    "area": true,
    "speed": 1,
    "cooldown": true,
    "nativeSets": [
      {
        "label": "Pounce",
        "flags": {
          "area": true,
          "attack": true,
          "melee": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "cross-slash",
    "name": "Cross Slash",
    "gemId": "Metadata/Items/Gems/SkillGemWolfCrossSlash",
    "tags": [
      "area",
      "attack",
      "grants_active_skill",
      "intelligence",
      "melee",
      "shapeshift",
      "strength",
      "wolf"
    ],
    "nativeEffect": "WolfCrossSlashPlayer",
    "family": "melee-form",
    "damage": "physicalDamage",
    "area": true,
    "speed": 1,
    "cooldown": true,
    "nativeSets": [
      {
        "label": "Cross Slash",
        "flags": {
          "area": true,
          "attack": true,
          "melee": true
        },
        "areaStat": true
      },
      {
        "label": "Shockwave",
        "flags": {
          "area": true,
          "attack": true,
          "melee": true
        },
        "areaStat": true
      }
    ]
  },
  {
    "id": "walking-calamity",
    "name": "Walking Calamity",
    "gemId": "Metadata/Items/Gems/SkillGemWalkingCalamity",
    "tags": [
      "area",
      "attack",
      "bear",
      "buff",
      "conditional",
      "duration",
      "fire",
      "grants_active_skill",
      "intelligence",
      "shapeshift",
      "strength",
      "trigger"
    ],
    "nativeEffect": "WalkingCalamityMeteorPlayer",
    "family": "meteor",
    "damage": "fireDamage",
    "area": true,
    "speed": 0,
    "cooldown": false,
    "nativeSets": [
      {
        "label": "Small Meteor",
        "flags": {
          "area": true,
          "attack": true
        },
        "areaStat": true
      },
      {
        "label": "Large Meteor",
        "flags": {
          "area": true,
          "attack": true,
          "duration": true
        },
        "areaStat": true
      }
    ]
  }
] as const;

export const remainingAttackIds: readonly string[] = remainingAttackSkillFixtures.map((f) => f.id);
export const remainingCrossbowIds: readonly string[] = remainingAttackSkillFixtures.filter((f) => f.family === "crossbow" || f.family === "grenade").map((f) => f.id);
export const remainingMeleeIds: readonly string[] = remainingAttackSkillFixtures.filter((f) => f.family === "melee-form").map((f) => f.id);
export const remainingAreaIds: readonly string[] = remainingAttackSkillFixtures.filter((f) => f.area).map((f) => f.id);
export const remainingElementalIds: readonly string[] = remainingAttackSkillFixtures.filter((f) => f.damage !== "physicalDamage").map((f) => f.id);
export const remainingCooldownIds: readonly string[] = remainingAttackSkillFixtures.filter((f) => f.cooldown).map((f) => f.id);

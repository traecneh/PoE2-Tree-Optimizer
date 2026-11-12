// Independent PoB 0.23.1 / tree 0.5.5f observations, level 20 / zero quality.
// Normal Wooden Club 6-10 Physical / 5% crit; Rolling Magma uses Changeling Talisman 9-15 / 8%.
// Shield components use their own base plus local shield Armour, never the Club's damage.
export const maceShieldFixtures = [
  { id: "armour-breaker", name: "Armour Breaker", gemId: "Metadata/Items/Gems/SkillGemArmourBreaker", effectId: "ArmourBreakerPlayer",
    tags: ["area","attack","grants_active_skill","melee","physical","strength","strike"], mace: true, shield: false, melee: true, projectile: false, conversion: 0, multiplier: 1.81,
    source: [6,10], phys: [11,18], fire: [0,0], crit: 5, hit: 15.225, concHit: 19.95, brutHit: 19.95, speed: 1.16, rapid: 1.45, mana: 38, magCost: 49, effCost: 23, brutCost: 45, supportCount: 10 },
  { id: "perfect-strike", name: "Perfect Strike", gemId: "Metadata/Items/Gems/SkillGemPerfectStrike", effectId: "PerfectStrikePlayer",
    tags: ["area","attack","channelling","fire","grants_active_skill","melee","strength","strike"], mace: true, shield: false, melee: true, projectile: false, conversion: .4, multiplier: 3.43,
    source: [6,10], phys: [12,21], fire: [8,14], crit: 5, hit: 28.875, concHit: 37.275, brutHit: 22.575, speed: .435, rapid: .54375, manaPerMinute: 2515, perSecond: 41, magPerSecond: 54, effPerSecond: 25, brutPerSecond: 50, supportCount: 10 },
  { id: "molten-blast", name: "Molten Blast", gemId: "Metadata/Items/Gems/SkillGemMoltenBlast", effectId: "MoltenBlastPlayer",
    tags: ["area","attack","fire","grants_active_skill","projectile","strength"], mace: true, shield: false, melee: false, projectile: true, conversion: .6, multiplier: 2.65,
    source: [6,10], phys: [6,11], fire: [10,16], crit: 5, hit: 22.575, concHit: 29.4, brutHit: 11.55, speed: 1.0875, rapid: 1.359375, mana: 40, magCost: 52, effCost: 24, brutCost: 48, radius: 16, magRadius: 19, concRadius: 11, supportCount: 12 },
  { id: "rolling-magma", name: "Rolling Magma", gemId: "Metadata/Items/Gems/SkillGemRollingMagma", effectId: "RollingMagmaPlayer",
    tags: ["area","attack","detonator","fire","grants_active_skill","intelligence","projectile","shapeshift","strength","wyvern"], mace: false, shield: false, melee: false, projectile: true, conversion: 1, multiplier: 2.18,
    source: [9,15], phys: [0,0], fire: [20,33], crit: 8, hit: 28.62, concHit: 37.26, brutHit: 0, speed: 1.0625, rapid: 1.328125, mana: 83, magCost: 107, effCost: 50, brutCost: 99, radius: 18, magRadius: 21, concRadius: 12, supportCount: 12 },
  { id: "forge-hammer", name: "Forge Hammer", gemId: "Metadata/Items/Gems/SkillGemForgeHammer", effectId: "ForgeHammerPlayer",
    tags: ["area","attack","duration","fire","grants_active_skill","melee","slam","strength"], mace: true, shield: false, melee: true, projectile: false, conversion: .3, multiplier: 5.77,
    source: [6,10], phys: [24,40], fire: [10,17], crit: 5, hit: 47.775, concHit: 63, brutHit: 44.625, speed: .12470382840753, rapid: .12470382840753, cooldown: 8.019, mana: 60, magCost: 78, effCost: 36, brutCost: 72,
    radius: 18, magRadius: 21, concRadius: 12, durationBase: 12, duration: 12.012, prolonged: 16.203, supportCount: 12 },
  { id: "resonating-shield", name: "Resonating Shield", gemId: "Metadata/Items/Gems/SkillGemResonatingShield", effectId: "ResonatingShieldPlayer",
    tags: ["area","attack","channelling","grants_active_skill","melee","physical","strength","sustained"], mace: false, shield: true, melee: true, projectile: false, conversion: 0, multiplier: .94,
    source: [108,162], shieldBase: [103,155], per15Armour: [5,7], phys: [102,152], fire: [0,0], crit: 5, hit: 133.35, concHit: 173.25, brutHit: 173.25, speed: 1.25, rapid: 1.5625,
    manaPerMinute: 2816, perSecond: 46, magPerSecond: 61, effPerSecond: 28, brutPerSecond: 56, radius: 23, magRadius: 27, concRadius: 16, supportCount: 10 },
  { id: "shield-charge", name: "Shield Charge", gemId: "Metadata/Items/Gems/SkillGemShieldCharge", effectId: "ShieldChargePlayer",
    tags: ["area","attack","channelling","grants_active_skill","melee","physical","strength","travel"], mace: false, shield: true, melee: true, projectile: false, conversion: 0, multiplier: .94,
    source: [88,133], shieldBase: [85,128], per15Armour: [3,5], phys: [83,125], fire: [0,0], crit: 5, hit: 109.2, concHit: 142.275, brutHit: 142.275, speed: 1.6666666666667, rapid: 2.0833333333333,
    manaPerMinute: 2921, perSecond: 48, magPerSecond: 63, effPerSecond: 29, brutPerSecond: 58, radius: 24, magRadius: 28, concRadius: 16, supportCount: 10 },
  { id: "shield-wall", name: "Shield Wall", gemId: "Metadata/Items/Gems/SkillGemShieldWall", effectId: "ShieldWallPlayer",
    tags: ["area","attack","duration","grants_active_skill","melee","physical","strength"], mace: false, shield: true, melee: true, projectile: false, conversion: 0, multiplier: 2.35,
    source: [108,162], shieldBase: [103,155], per15Armour: [5,7], phys: [254,381], fire: [0,0], crit: 5, hit: 333.375, concHit: 433.125, brutHit: 433.125, speed: .8, rapid: 1, mana: 92, magCost: 119, effCost: 56, brutCost: 110,
    radius: 40, magRadius: 48, concRadius: 28, durationBase: 6, duration: 6.006, prolonged: 8.118, supportCount: 12 },
] as const;
export const maceShieldIds = maceShieldFixtures.map(f => f.id);
export const maceShieldMeleeIds = maceShieldFixtures.filter(f => f.melee).map(f => f.id);
export const maceShieldWeaponIds = maceShieldFixtures.filter(f => f.mace).map(f => f.id);
export const maceShieldFireIds = maceShieldFixtures.filter(f => f.conversion > 0).map(f => f.id);
export const maceShieldProjectileIds = ["molten-blast","rolling-magma"];
export const maceShieldDurationIds = ["forge-hammer","shield-wall"];
export const maceShieldSupportIds = ["magnified-area-i","magnified-area-ii","prolonged-duration-i","prolonged-duration-ii","efficiency-i","efficiency-ii","rapid-attacks-i","rapid-attacks-ii","concentrated-area","projectile-acceleration-i","projectile-acceleration-ii","brutality-i","brutality-ii","brutality-iii"];
export const shieldEquipmentControls = [
  { id: "resonating-shield", paintedPhys: [106,159], paintedHit: 139.125, otherWeaponHit: 133.35 },
  { id: "shield-charge", paintedPhys: [86,130], paintedHit: 113.4, otherWeaponHit: 109.2 },
  { id: "shield-wall", paintedPhys: [266,397], paintedHit: 348.075, otherWeaponHit: 333.375 },
];
export const maceShieldOwnershipControls = [
  { id: "rolling-magma", melee: 28.62, mace: 28.62, maceSpeed: 1.0625, projectile: 57.24, area: 57.24, minion: 28.62 },
  { id: "resonating-shield", melee: 266.7, mace: 133.35, maceSpeed: 1.25, projectile: 133.35, area: 266.7, minion: 133.35 },
  { id: "shield-wall", melee: 666.225, mace: 333.375, maceSpeed: .8, projectile: 333.375, area: 666.225, minion: 333.375 },
];
export const maceShieldSecondaryObservations = [
  { id: "perfect-strike", set: 2, multiplier: 11.32, conversion: .8, phys: [14,23], fire: [54,91], hit: 95.55, area: true },
  { id: "molten-blast", set: 2, multiplier: 2.65, conversion: 1, phys: [0,0], fire: [16,27], hit: 22.575, area: false },
  { id: "forge-hammer", set: 2, multiplier: 1.98, conversion: 1, phys: [0,0], fire: [12,20], hit: 16.8, area: true },
] as const;

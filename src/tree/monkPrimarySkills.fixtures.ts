// Independent frozen PoB 0.23.1 / tree 0.5.5f observations, level 20 and zero quality.
// Empty level-90 Monk, normal 7-12 Physical / 10% crit Wrapped Quarterstaff, zero enemy Armour.
export const monkPrimaryFixtures = [
  { id: "frozen-locus", name: "Frozen Locus", gemId: "Metadata/Items/Gems/SkillGemFrozenLocus", effectId: "FrozenLocusPlayer", set: 2, label: "Explosion",
    tags: ["area","attack","cold","dexterity","duration","grants_active_skill","intelligence","melee"], melee: false, accuracy: true, element: "cold", conversion: 1, multiplier: 6.12,
    phys: [0,0], converted: [43,73], hit: 63.8, concHit: 83.05, brutHit: 0, speed: .98, rapid: 1.225, fixedTime: 0,
    mana: 81, magCost: 105, effCost: 49, brutCost: 97, radius: 34, magRadius: 40, concRadius: 23, durationBase: 10, duration: 10.032, prolonged: 13.53, supportCount: 12 },
  { id: "killing-palm", name: "Killing Palm", gemId: "Metadata/Items/Gems/SkillGemKillingPalm", effectId: "KillingPalmPlayer", set: 1, label: "Killing Palm",
    tags: ["area","attack","dexterity","grants_active_skill","intelligence","melee","physical","strike"], melee: true, accuracy: false, element: null, conversion: 0, multiplier: 2.81,
    phys: [20,34], converted: [0,0], hit: 29.7, concHit: 38.5, brutHit: 38.5, speed: 1.05, rapid: 1.3125, fixedTime: 0,
    mana: 42, magCost: 54, effCost: 26, brutCost: 50, supportCount: 10 },
  { id: "shattering-palm", name: "Shattering Palm", gemId: "Metadata/Items/Gems/SkillGemShatteringPalm", effectId: "ShatteringPalmPlayer", set: 1, label: "Melee",
    tags: ["area","attack","cold","dexterity","grants_active_skill","intelligence","melee","strike","trigger"], melee: true, accuracy: false, element: "cold", conversion: .6, multiplier: 1.09,
    phys: [3,5], converted: [5,8], hit: 11.55, concHit: 15.4, brutHit: 6.05, speed: 1.05, rapid: 1.3125, fixedTime: 0,
    mana: 40, magCost: 52, effCost: 24, brutCost: 48, radius: 38, magRadius: 45, concRadius: 26, supportCount: 10 },
  { id: "staggering-palm", name: "Staggering Palm", gemId: "Metadata/Items/Gems/SkillGemStaggeringPalm", effectId: "StaggeringPalmPlayer", set: 1, label: "Staggering Palm",
    tags: ["area","attack","buff","dexterity","duration","grants_active_skill","intelligence","melee","physical","projectile","strike","wind"], melee: true, accuracy: false, element: null, conversion: 0, multiplier: 2.5,
    phys: [18,30], converted: [0,0], hit: 26.4, concHit: 34.1, brutHit: 34.1, speed: 1.05, rapid: 1.3125, fixedTime: 0,
    mana: 47, magCost: 61, effCost: 29, brutCost: 56, durationBase: 7.5, duration: 7.524, prolonged: 10.131, supportCount: 12 },
  { id: "hand-of-chayula", name: "Hand of Chayula", gemId: "Metadata/Items/Gems/SkillGemHandOfChayula", effectId: "HandOfChayulaPlayer", set: 1, label: "Strike",
    tags: ["area","attack","chaos","dexterity","grants_active_skill","intelligence","melee","meta","strike"], melee: true, accuracy: false, element: "chaos", conversion: .73, multiplier: 2.09,
    phys: [4,7], converted: [11,18], hit: 22, concHit: 28.05, brutHit: 7.7, speed: .86762760253464, rapid: 1.0080090607556, fixedTime: .35,
    mana: 79, magCost: 102, effCost: 48, brutCost: 94, supportCount: 10 },
  { id: "wave-of-frost", name: "Wave of Frost", gemId: "Metadata/Items/Gems/SkillGemWaveOfFrost", effectId: "WaveOfFrostPlayer", set: 1, label: "Wave of Frost",
    tags: ["area","attack","cold","dexterity","grants_active_skill","intelligence","melee"], melee: true, accuracy: true, element: "cold", conversion: .8, multiplier: 2.35,
    phys: [3,6], converted: [13,23], hit: 24.75, concHit: 31.9, brutHit: 6.05, speed: .77, rapid: .9625, fixedTime: 0,
    mana: 100, magCost: 130, effCost: 60, brutCost: 120, radius: 60, magRadius: 72, concRadius: 42, supportCount: 10 },
  { id: "tempest-bell", name: "Tempest Bell", gemId: "Metadata/Items/Gems/SkillGemTempestBell", effectId: "TempestBellPlayer", set: 3, label: "Shockwave",
    tags: ["area","attack","conditional","dexterity","duration","grants_active_skill","intelligence","melee","sustained"], melee: true, accuracy: true, element: null, conversion: 0, multiplier: 1.19,
    phys: [8,14], converted: [0,0], hit: 12.1, concHit: 16.5, brutHit: 16.5, speed: 1.68, rapid: 1.8939393939394, fixedTime: 0, cooldown: .528,
    mana: 98, magCost: 127, effCost: 59, brutCost: 117, radius: 26, magRadius: 31, concRadius: 18, durationBase: 6, duration: 6.006, prolonged: 8.118, supportCount: 12 },
] as const;
export const monkPrimaryIds = monkPrimaryFixtures.map(f => f.id);
export const monkPrimaryMeleeIds = monkPrimaryFixtures.filter(f => f.melee).map(f => f.id);
export const monkPrimaryColdIds = monkPrimaryFixtures.filter(f => f.element === "cold").map(f => f.id);
export const monkPrimaryAccuracyIds = monkPrimaryFixtures.filter(f => f.accuracy).map(f => f.id);
export const monkPrimaryAlwaysHitIds = monkPrimaryFixtures.filter(f => !f.accuracy).map(f => f.id);
export const monkPrimaryDurationIds = ["frozen-locus","staggering-palm","tempest-bell"];
export const monkPrimarySupportIds = ["magnified-area-i","magnified-area-ii","prolonged-duration-i","prolonged-duration-ii","efficiency-i","efficiency-ii","rapid-attacks-i","rapid-attacks-ii","concentrated-area","brutality-i","brutality-ii","brutality-iii"];
export const monkNativeOwnershipControls = [
  { id: "frozen-locus", melee: 63.8, quarterstaff: 127.6, twoHanded: 127.6, unarmed: 63.8, area: 127.6, minion: 63.8, totem: 63.8 },
  { id: "killing-palm", melee: 58.3, quarterstaff: 58.3, twoHanded: 58.3, unarmed: 29.7, area: 58.3, minion: 29.7, totem: 29.7 },
  { id: "tempest-bell", melee: 25.3, quarterstaff: 25.3, twoHanded: 25.3, unarmed: 12.1, area: 25.3, minion: 12.1, totem: 12.1 },
];
export const monkSecondaryObservations = [
  { id: "ShatteringPalmExplosionPlayer", melee: false, projectile: false, multiplier: 3.74, conversion: 1, phys: [0,0], cold: [26,45], hit: 39.05 },
  { id: "StaggeringPalmProjectilePlayer", melee: false, projectile: true, multiplier: 2.04, conversion: 0, phys: [14,24], cold: [0,0], hit: 20.9 },
] as const;

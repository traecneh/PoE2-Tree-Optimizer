// Frozen from the isolated PoB 0.23.1 generated gem/component data, not the preset catalog.
export const fireLightningSkillFixtures = [
  { id: "ember-fusillade", name: "Ember Fusillade", gemId: "Metadata/Items/Gems/SkillGemEmberFusillade",
    tags: ["area", "duration", "fire", "grants_active_skill", "intelligence", "projectile", "repeatable", "spell"],
    castTime: 0.4, nativeCritChance: 7, focus: "hit", element: "fireDamage", areaDamage: true, projectile: true,
    timing: { releaseMs: 1300, firingIntervalMs: 100 },
    suggestions: ["spellDamage", "fireDamage", "elementalDamage", "projectileDamage", "spellAreaDamage", "castSpeed", "projectileSpeed", "areaOfEffect"] },
  { id: "living-bomb", name: "Living Bomb", gemId: "Metadata/Items/Gems/SkillGemLivingBombPlayer",
    tags: ["area", "duration", "fire", "grants_active_skill", "intelligence", "remnant", "spell"],
    castTime: 0.6, nativeCritChance: 7, focus: "hit", element: "fireDamage", areaDamage: true, projectile: false,
    timing: { applicationWindowMs: 15000 },
    suggestions: ["spellDamage", "fireDamage", "elementalDamage", "spellAreaDamage", "areaOfEffect", "castSpeed"] },
  { id: "incinerate", name: "Incinerate", gemId: "Metadata/Items/Gems/SkillGemIncinerate",
    tags: ["area", "channelling", "duration", "fire", "grants_active_skill", "intelligence", "spell", "sustained"],
    castTime: 0.25, nativeCritChance: 6, focus: "burning", element: "fireDamage", areaDamage: false, projectile: false,
    timing: { stageIntervalMs: 250, infusionGroundMs: 8000 },
    suggestions: ["fireDamage", "elementalDamage", "damageOverTime", "areaOfEffect"] },
  { id: "flame-wall", name: "Flame Wall", gemId: "Metadata/Items/Gems/SkillGemFlameWall",
    tags: ["area", "duration", "fire", "grants_active_skill", "intelligence", "repeatable", "spell"],
    castTime: 1, nativeCritChance: 5, focus: "burning", element: "fireDamage", areaDamage: false, projectile: false,
    timing: { wallLifetimeMs: 6400 },
    suggestions: ["fireDamage", "elementalDamage", "damageOverTime", "areaOfEffect", "skillDuration", "castSpeed"] },
  { id: "orb-of-storms", name: "Orb of Storms", gemId: "Metadata/Items/Gems/SkillGemOrbOfStorms",
    tags: ["area", "chaining", "duration", "grants_active_skill", "intelligence", "lightning", "orb", "remnant", "repeatable", "spell", "sustained"],
    castTime: 0.8, nativeCritChance: 10, focus: "hit", element: "lightningDamage", areaDamage: false, projectile: false,
    timing: { lifetimeMs: 12000, boltIntervalMs: 4000, maxHits: 6 },
    suggestions: ["spellDamage", "lightningDamage", "elementalDamage", "castSpeed", "skillDuration", "areaOfEffect"] },
  { id: "lightning-conduit", name: "Lightning Conduit", gemId: "Metadata/Items/Gems/SkillGemLightningConduit",
    tags: ["area", "grants_active_skill", "intelligence", "lightning", "spell"],
    castTime: 1, nativeCritChance: 10, focus: "hit", element: "lightningDamage", areaDamage: false, projectile: false,
    timing: { cooldownSeconds: 8, fixedAddedCastMs: 1000 },
    suggestions: ["spellDamage", "lightningDamage", "elementalDamage", "cooldownRecoveryRate", "castSpeed", "areaOfEffect"] },
  { id: "lightning-warp", name: "Lightning Warp", gemId: "Metadata/Items/Gems/SkillGemLightningWarp",
    tags: ["area", "duration", "grants_active_skill", "intelligence", "lightning", "remnant", "repeatable", "spell"],
    castTime: 0.5, nativeCritChance: 11, focus: "hit", element: "lightningDamage", areaDamage: true, projectile: false,
    timing: { groundMs: 4000, debuffMs: 8000 },
    suggestions: ["spellDamage", "lightningDamage", "elementalDamage", "spellAreaDamage", "areaOfEffect", "castSpeed"] },
  { id: "thunderstorm", name: "Thunderstorm", gemId: "Metadata/Items/Gems/SkillGemThunderstorm",
    tags: ["area", "duration", "grants_active_skill", "intelligence", "lightning", "spell", "storm", "strength", "sustained"],
    castTime: 0.9, nativeCritChance: 9, focus: "hit", element: "lightningDamage", areaDamage: true, projectile: false,
    timing: { lifetimeMs: 12000, strikeIntervalMs: 350, hitPreventionMs: 500 },
    suggestions: ["spellDamage", "lightningDamage", "elementalDamage", "spellAreaDamage", "areaOfEffect", "skillDuration", "castSpeed"] },
] as const;

export const fireLightningIds = fireLightningSkillFixtures.map((f) => f.id);
export const fireLightningHitIds = fireLightningSkillFixtures.filter((f) => f.focus === "hit").map((f) => f.id);
export const fireLightningAreaDamageIds = fireLightningSkillFixtures.filter((f) => f.areaDamage).map((f) => f.id);

// Small synthetic modifier probes: relative output, not game DPS or proof that a native virtual hit is a real hit.
export const burningComponentProbe = {
  incinerate: { baseFireDot: 28.775, spellDamage20FireDot: 28.775, areaDamage20FireDot: 28.775, criticalChance100FireDot: 28.775,
    castSpeed20FireDot: 28.775, fireDamage20FireDot: 34.53, damageOverTime20FireDot: 34.53 },
  "flame-wall": { baseFireDot: 29.791666666667, spellDamage20FireDot: 29.791666666667, areaDamage20FireDot: 29.791666666667,
    criticalChance100FireDot: 29.791666666667, castSpeed20FireDot: 29.791666666667, fireDamage20FireDot: 35.75, damageOverTime20FireDot: 35.75 },
} as const;

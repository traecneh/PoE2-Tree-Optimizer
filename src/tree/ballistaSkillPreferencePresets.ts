import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";

// These are the granted firing attacks, not the non-damaging deployment skill.
const firingScopes: readonly SkillPassiveStatScope[] = [
  "attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage",
  "crossbowAttackDamage", "crossbowAttackSpeed", "crossbowAccuracy", "crossbowCriticalChance", "crossbowCriticalDamageBonus", "twoHandedWeaponDamage",
];
const sharedSuggestions: SkillPreferencePreset["suggestions"] = [
  { id: "totemDamage", weight: 3, reason: "Damage of the Totem's firing attacks, not deployment, player self-use or Minions. No assumed number of active Totems or hits." },
  { id: "attackDamage", weight: 2, reason: "Inherited attack, Crossbow and two-handed weapon modifiers benefit the granted firing attack. Each stat line stays in its own category, not also Totem Damage." },
  { id: "projectileDamage", weight: 2, reason: "The Totem's granted attacks deal projectile damage. Projectile count, overlap and target contacts are not simulated." },
  { id: "totemAttackSpeed", weight: 2, reason: "Speeds the Totem's firing attacks only, not player deployment, Totem spell casting or delayed explosions." },
  { id: "attackSpeed", weight: 1, reason: "Generic and matching Crossbow attack speed is inherited by firing attacks. Totem-specific speed is scored separately, never copied here; no reload or sustained-DPS assumption." },
  { id: "totemPlacementSpeed", weight: 1, reason: "Player deployment utility only, not increased firing speed, damage per hit or faster detonation." },
  { id: "totemLife", weight: 1, reason: "Totem survival only, not player maximum Life or an assumed DPS multiplier." },
  { id: "totemDuration", weight: 1, reason: "Extends the native Totem lifetime, not the delay before bolts explode or guaranteed damage uptime." },
  { id: "totemAreaOfEffect", weight: 1, reason: "Coverage for the Totem-used area attacks, not player-only or minion area. No guaranteed extra hits or overlaps." },
  { id: "areaOfEffect", weight: 1, reason: "Generic and attack-scoped coverage for the firing component. Totem-only area stays in its separate preference; coverage is not damage per hit." },
  { id: "attackAreaDamage", weight: 1, reason: "The granted firing stat sets explicitly contain is_area_damage. Scores applicable attack-area modifiers once, not a projectile-count or explosion-frequency multiplier." },
];
const sharedExclusions: SkillPreferencePreset["exclusions"] = [
  { id: "spellDamage", reason: "The Ballista fires attacks, not spells. Its non-damaging deployment is not spell damage." },
  { id: "castSpeed", reason: "Cast speed does not accelerate these firing attacks or Totem placement." },
  { id: "totemCastSpeed", reason: "These Totems attack rather than cast spells; use Totem Attack Speed for their firing cadence." },
  { id: "minionDamage", reason: "A Ballista is a Totem, not a Minion. Minion damage is not inherited." },
  { id: "minionSpeed", reason: "Minion speed does not become Totem attack or player placement speed." },
  { id: "skillDuration", reason: "This focus uses explicit Totem Duration for lifetime, not generic Skill Effect Duration or the delay before explosions." },
  { id: "projectileSpeed", reason: "Travel speed is not assumed to shorten rain, salvo or detonation timing or guarantee more damage." },
];

export const ballistaSkillPreferencePresets: readonly SkillPreferencePreset[] = [
  {
    id: "artillery-ballista", name: "Artillery Ballista", gemId: "Metadata/Items/Gems/SkillGemArtilleryBallista",
    tags: ["area", "attack", "dexterity", "duration", "grants_active_skill", "projectile", "strength", "sustained", "totem"],
    passiveStatScopes: firingScopes,
    description: "Physical Ballista bolt-hit focus. Totem firing, survival and lifetime are separate from player placement and defences. Pin Buildup is eligible; salvo overlap, Maim uptime, Totem limits, gear damage and total DPS are not simulated.",
    suggestions: [
      ...sharedSuggestions,
      { id: "physicalDamage", weight: 3, reason: "The reviewed bolts have no native elemental conversion. Gear-added damage, ailments and enemy mitigation are not inferred." },
      { id: "pinBuildup", weight: 2, reason: "The granted bolt skill explicitly allows all its damage to Pin. This is buildup amount, not guaranteed Pin uptime or additional damage." },
    ],
    exclusions: sharedExclusions,
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L923",
  },
  {
    id: "siege-ballista", name: "Siege Ballista", gemId: "Metadata/Items/Gems/SkillGemSiegeBallista",
    tags: ["area", "attack", "dexterity", "duration", "fire", "grants_active_skill", "projectile", "repeatable", "strength", "sustained", "totem"],
    passiveStatScopes: [...firingScopes, "attackElementalDamage"],
    description: "Fire-converted Ballista hit/explosion focus. Totem firing, survival and lifetime are separate from player placement and defences. Detonation delay, overlaps, Totem limits, gear damage and total DPS are not simulated.",
    suggestions: [
      ...sharedSuggestions.map((s) => s.id === "attackAreaDamage" ? { ...s,
        reason: "Both granted firing stat sets explicitly contain is_area_damage and area radii. Area eligibility follows generated game stats despite PoB's missing area flag; native PoB area-DPS validation is incomplete." } : s),
      { id: "fireDamage", weight: 3, reason: "The granted attack stat sets explicitly convert Physical Damage to Fire. No assumed gear damage, Ignite scaling, full-build conversion or explosion overlap." },
      { id: "elementalDamage", weight: 2, reason: "Generic and attack-scoped Elemental Damage benefits the Fire hit portion. Each modifier is counted once, not also as Totem or projectile damage." },
    ],
    exclusions: sharedExclusions,
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L17746",
  },
];

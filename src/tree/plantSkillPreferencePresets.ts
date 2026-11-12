import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";

const spellHitScopes: readonly SkillPassiveStatScope[] = [
  "plantDamage", "spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance",
];
const plantDamage: SkillPreferencePreset["suggestions"][number] = {
  id: "plantDamage", weight: 3,
  reason: "Unconditional Damage with Plant Skills applies to this reviewed damaging Plant component. Counted once, not also as generic, Spell, Attack or Physical Damage. Overgrowth bonuses are not assumed.",
};
const spellExclusions: SkillPreferencePreset["exclusions"] = [
  { id: "attackDamage", reason: "This focus is the player's Plant spell hits, not attacks used to supply another component or Minion damage." },
  { id: "attackSpeed", reason: "Attack speed does not accelerate the reviewed spell's own cast action or damage events." },
  { id: "projectileDamage", reason: "The reviewed fissures, ground and vines do not have damaging-projectile flags." },
  { id: "damageOverTime", reason: "Persistent Plants and recurring hits are not automatically damage over time. This preset targets the native hit component." },
];

export const plantSkillPreferencePresets: readonly SkillPreferencePreset[] = [
  {
    id: "entangle", name: "Entangle", gemId: "Metadata/Items/Gems/SkillGemEntangle",
    tags: ["area", "duration", "grants_active_skill", "intelligence", "physical", "plant", "repeatable", "spell", "strength", "sustained"],
    passiveStatScopes: spellHitScopes,
    description: "Physical fissure/vine spell-hit focus. Area damage applies to fissures, not attached vine hits. Duration is uptime, not damage rate. Overgrowth, extra fissures, vine limits, slow stacks and full DPS are not simulated.",
    suggestions: [
      plantDamage,
      { id: "physicalDamage", weight: 3, reason: "Both native fissure and attached-vine components deal Physical spell-hit damage." },
      { id: "spellDamage", weight: 3, reason: "Both reviewed damaging components are player spells, not attacks or Minions." },
      { id: "spellAreaDamage", weight: 1, reason: "Only fissures explicitly have is_area_damage; attached-vine hits do not. No extra hit or fissure count is assumed." },
      { id: "areaOfEffect", weight: 1, reason: "Coverage and targeting utility, not greater damage per hit or guaranteed vine contacts." },
      { id: "skillDuration", weight: 1, reason: "Extends applicable eight-second fissure uptime, not the separate 100 ms vine-application interval or guaranteed vine lifetime/stack count." },
      { id: "castSpeed", weight: 1, reason: "Speeds the 0.9-second cast action, not the fixed vine-application interval, crawling distance or repeated-hit frequency." },
    ],
    exclusions: spellExclusions,
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L4598",
  },
  {
    id: "briarpatch", name: "Briarpatch", gemId: "Metadata/Items/Gems/SkillGemBriarpatch",
    tags: ["area", "buff", "duration", "grants_active_skill", "intelligence", "persistent", "physical", "plant", "spell", "strength", "sustained"],
    passiveStatScopes: spellHitScopes,
    description: "Conditional Thorny Ground spell-hit focus. Physical attacks supply stored damage; spell use creates ground that damages moving enemies. Storage caps, Thorns transfer, enemy movement, reservation, creation delay and total DPS are not simulated.",
    suggestions: [
      plantDamage,
      { id: "physicalDamage", weight: 2, reason: "Targets the ground's stored-Physical-damage component, not an assumed amount of supplied attack damage or a full storage bar." },
      { id: "spellDamage", weight: 2, reason: "The created ground deals spell-hit damage. The attack supplying storage is a separate component, not an extra copy of this bonus." },
      { id: "spellAreaDamage", weight: 1, reason: "The ground explicitly has is_area_damage. Movement contacts and stored damage must still exist; zero supply means no invented damage." },
      { id: "areaOfEffect", weight: 1, reason: "Widens ground coverage, not guaranteed enemy movement, stored damage or additional hits." },
      { id: "skillDuration", weight: 1, reason: "Extends applicable six-second ground uptime, not the eight-second creation-delay stat, reservation or damage per contact." },
    ],
    exclusions: [...spellExclusions,
      { id: "castSpeed", reason: "The persistent skill has zero native cast time. Speeding the separate spell that creates its ground is not modeled as this skill's own cast or trigger cadence." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L2014",
  },
  {
    id: "thrashing-vines", name: "Thrashing Vines", gemId: "Metadata/Items/Gems/SkillGemThrashingVines",
    tags: ["area", "duration", "grants_active_skill", "intelligence", "physical", "plant", "spell", "strength", "sustained"],
    passiveStatScopes: spellHitScopes,
    description: "Physical vine-slam spell-hit focus. Lifetime, placement and coverage are distinct from spawn/retarget timing. Random vine contacts, overlap, minimum channel time, Overgrown damage/area bonuses and total DPS are not simulated.",
    suggestions: [
      plantDamage,
      { id: "physicalDamage", weight: 3, reason: "The native vine slams deal Physical spell-hit damage, not weapon or Minion damage." },
      { id: "spellDamage", weight: 3, reason: "Targets the player's damaging spell component, without inferring projectile or attack scaling from the slam animation." },
      { id: "spellAreaDamage", weight: 1, reason: "The damaging slams explicitly have is_area_damage; random spawns and overlap are not guaranteed hits." },
      { id: "areaOfEffect", weight: 1, reason: "Coverage only, not increased spawn density or guaranteed additional single-target contacts." },
      { id: "skillDuration", weight: 1, reason: "Extends applicable eight-second lifetime, not the separate five-second timer or 500 ms retarget cooldown. Hit count is not estimated." },
      { id: "castSpeed", weight: 1, reason: "Speeds casting; spawn timing references 50% of cast time, but minimum channel time, retargeting, enemy contacts and sustained DPS are not calculated." },
    ],
    exclusions: spellExclusions,
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L19062",
  },
  {
    id: "toxic-domain", name: "Toxic Domain", gemId: "Metadata/Items/Gems/SkillGemToxicDomain",
    tags: ["area", "attack", "buff", "chaos", "dexterity", "duration", "grants_active_skill", "physical", "plant"],
    passiveStatScopes: ["plantDamage", "attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage"],
    description: "Conditional Pustule attack-explosion focus, not the non-damaging Bloom. Projectile attacks supply Pustules; explosions are not projectiles. Weapon choice, stored Poison, Overgrowth, detonation timing, Bloom healing/costs and full DPS are not simulated.",
    suggestions: [
      plantDamage,
      { id: "attackDamage", weight: 3, reason: "The Pustule Explosion has native attack flags. The Bloom explicitly deals no damage; no weapon, gear damage or Poison storage is assumed." },
      { id: "attackAreaDamage", weight: 1, reason: "The Pustule Explosion explicitly deals area damage, not the Bloom buff or every projectile used to attach a Pustule." },
      { id: "areaOfEffect", weight: 1, reason: "Coverage utility for Bloom and explosion areas, not extra damage, Poison storage or guaranteed target contacts." },
      { id: "cooldownRecoveryRate", weight: 2, reason: "Improves the native 11-second skill cooldown, not Pustule growth, the 15-second base detonation timer or the eight-second Bloom lifetime." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The damaging Pustule component is an attack, not a spell. Bloom is non-damaging." },
      { id: "castSpeed", reason: "Native NoAttackOrCastTime means a cast-time field is not proof of a scalable spell action." },
      { id: "attackSpeed", reason: "The skill has NoAttackOrCastTime. Another attack supplies Pustules; its cadence and stored Poison are outside this focus." },
      { id: "projectileDamage", reason: "Projectile attacks attach Pustules, but the explosion itself has no projectile flag." },
      { id: "skillDuration", reason: "Bloom uptime and the delayed explosion are different timers. Longer duration is not assumed to improve explosion throughput." },
      { id: "chaosDamage", reason: "The Chaos tag concerns Poison interactions. This explosion focus does not assume stored Poison or a particular weapon's damage types." },
      { id: "damageOverTime", reason: "Poison application, stacking, stored damage and growth are separate from this attack-explosion focus." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L9349",
  },
];

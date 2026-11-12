import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";

type ReviewedAttack = {
  id: string; name: string; gemId: string; tags: readonly string[];
  family: "crossbow" | "grenade" | "melee-form" | "meteor";
  damage: "physicalDamage" | "fireDamage" | "coldDamage" | "lightningDamage";
  speed: 0 | 1 | 2; area?: string; cooldown?: boolean; description: string;
  extras?: SkillPreferencePreset["suggestions"];
  excluded?: SkillPreferencePreset["exclusions"];
  sourceUrl: string;
};

const playerHitScopes: readonly SkillPassiveStatScope[] = [
  "attackCriticalChance", "attackCriticalDamageBonus", "attackBlindChance", "attackMaimChance", "attackIncisionChance",
];
const crossbowScopes: readonly SkillPassiveStatScope[] = [
  "crossbowAttackDamage", "crossbowAttackSpeed", "crossbowAccuracy", "crossbowCriticalChance", "crossbowCriticalDamageBonus", "twoHandedWeaponDamage",
];

// Component eligibility is explicitly reviewed below, never inferred from gem tags.
function reviewedAttack(spec: ReviewedAttack): SkillPreferencePreset {
  const crossbow = spec.family === "crossbow" || spec.family === "grenade";
  const elemental = spec.damage !== "physicalDamage";
  const passiveStatScopes: SkillPassiveStatScope[] = [...playerHitScopes];
  if (crossbow) passiveStatScopes.push(...crossbowScopes);
  if (spec.family === "melee-form") passiveStatScopes.push("meleeDamage", "meleeStunBuildup");
  if (elemental) passiveStatScopes.push("attackElementalDamage");
  if (spec.area) passiveStatScopes.push("attackAreaOfEffect", "attackAreaDamage");
  if (spec.family === "grenade") passiveStatScopes.push("grenadeDamage", "grenadeAreaOfEffect", "grenadeCooldownRecovery");
  const suggestions: SkillPreferencePreset["suggestions"][number][] = [
    { id: "attackDamage", weight: 3, reason: "Reviewed player attack hits only. Matching weapon/melee/Grenade sources add once; loading, buffs, minions and excluded components are not hit damage." },
    { id: spec.damage, weight: 3, reason: elemental
      ? "The reviewed hit component has native conversion to this element. Conversion amounts, gear damage, ailments and excluded components are not calculated."
      : "The reviewed base hit has no native elemental conversion. Gear-added elements, ailments and excluded components are not inferred." },
  ];
  if (elemental) suggestions.push({ id: "elementalDamage", weight: 2, reason: "Benefits the reviewed native elemental hit portion, not an assumed full conversion, ailment or external skill." });
  if (crossbow) suggestions.push({ id: "projectileDamage", weight: 2, reason: "The reviewed firing/explosion component has native projectile damage flags. No assumed projectile count, overlap, reload cycle or extra hits." });
  if (spec.area) {
    suggestions.push({ id: "attackAreaDamage", weight: 1, reason: spec.area });
    suggestions.push({ id: "areaOfEffect", weight: 1, reason: "Coverage for the reviewed area component only, not guaranteed overlaps, contact count, damage per hit or additional triggers." });
  }
  if (spec.speed) suggestions.push({ id: "attackSpeed", weight: spec.speed, reason: spec.family === "crossbow"
    ? "Scales firing actions and can also affect native Crossbow reload rate; not clip capacity, extra hits or guaranteed sustained DPS."
    : "Changes the scalable attack action, not fuse/arming delays, fixed added time, trigger intervals or guaranteed sustained DPS." });
  if (spec.family === "grenade" || spec.cooldown) suggestions.push({ id: "cooldownRecoveryRate", weight: 2, reason: "Improves the native use cooldown/stored-use recharge, not fuse time, reload speed, buff duration or attack animation." });
  suggestions.push(...(spec.extras ?? []));
  const exclusions: SkillPreferencePreset["exclusions"][number][] = [
    { id: "spellDamage", reason: "The reviewed component is player attack damage, not spell damage." },
    { id: "castSpeed", reason: "Casting speed does not accelerate the reviewed attack or triggered hit." },
  ];
  if (!crossbow) exclusions.push({ id: "projectileDamage", reason: "The reviewed player melee/meteor component has no projectile damage; separate projectiles and minions are not included." });
  if (spec.family === "grenade") exclusions.push({ id: "skillDuration", reason: "Grenade fuses are not Skill Effect Duration. Separate cloud/ground lifetime is outside this reviewed hit focus." });
  exclusions.push(...(spec.excluded ?? []));
  return { id: spec.id, name: spec.name, gemId: spec.gemId, tags: spec.tags, passiveStatScopes,
    description: spec.description, suggestions, exclusions, sourceUrl: spec.sourceUrl };
}

const reviewedAttacks: readonly ReviewedAttack[] = [
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
    "family": "crossbow",
    "damage": "physicalDamage",
    "speed": 1,
    "description": "Physical crossbow bolt-hit focus. Armour Break amount is eligible, but armour removal, magazine uptime, reload speed and enemy mitigation are not calculated.",
    "extras": [
      {
        "id": "armourBreakAmount",
        "weight": 2,
        "reason": "The firing skill natively applies Armour Break on hit; amount is not Fully Broken Armour uptime or damage."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L8421"
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
    "family": "crossbow",
    "damage": "physicalDamage",
    "speed": 1,
    "description": "Physical projectile-hit focus. The Frozen-enemy shrapnel payoff, consumed Freeze and Ice Crystal explosions are excluded. The Area tag does not give the ordinary bolts area damage.",
    "excluded": [
      {
        "id": "coldDamage",
        "reason": "Cold conversion belongs to the Frozen-enemy payoff, not the reviewed ordinary bolts."
      },
      {
        "id": "areaOfEffect",
        "reason": "This preset excludes the conditional Frozen-enemy shrapnel area."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L9026"
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
    "family": "crossbow",
    "damage": "coldDamage",
    "speed": 1,
    "description": "Cold-converted crossbow projectile hits. Cone visuals do not create an area-damage component. Reloads, merging, hit overlap and guaranteed Freeze are not simulated.",
    "excluded": [
      {
        "id": "areaOfEffect",
        "reason": "The reviewed projectile stat set has no area-damage flag despite the Area tag and cone visual."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L11314"
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
    "family": "crossbow",
    "damage": "physicalDamage",
    "speed": 1,
    "description": "Physical piercing-bolt hit focus. Fully Broken Armour and Riven Armour are external prerequisites, not guaranteed damage multipliers. This skill cannot itself Break Armour; reload and debuff uptime are not simulated.",
    "excluded": [
      {
        "id": "armourBreakAmount",
        "reason": "The native firing skill cannot Break Armour; another skill must provide that setup."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L10339"
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
    "family": "crossbow",
    "damage": "fireDamage",
    "speed": 1,
    "description": "Fire-converted projectile-hit focus, not an Ignite calculation. Heat consumption, faster burning, merging and pellet overlap are excluded. The cone does not establish an area-damage component.",
    "excluded": [
      {
        "id": "areaOfEffect",
        "reason": "The reviewed shot has no area-damage flag; the cone visual and Area tag alone do not qualify."
      },
      {
        "id": "damageOverTime",
        "reason": "This preset scores hits, not the separate Ignite magnitude, duration or faster-burning mechanics."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L11041"
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
    "family": "crossbow",
    "damage": "coldDamage",
    "speed": 1,
    "area": "Armed shard explosion only, not the travelling bolt. Arming, ageing bonuses and contact frequency are not assumed.",
    "description": "Cold projectile and armed-shard hit focus. Area damage applies only to shard explosions. Arming delay, ageing bonuses, early-detonation penalties, hazard limits and enemy contact frequency are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L10688"
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
    "family": "crossbow",
    "damage": "fireDamage",
    "speed": 1,
    "description": "Fire-converted crossbow bolt-hit focus. Heat buildup, overheating lockout, Heat consumption by other skills, magazine capacity and reload uptime are not calculated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L11924"
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
    "family": "crossbow",
    "damage": "coldDamage",
    "speed": 1,
    "area": "Wall explosions only, not the travelling bolt. Destruction requirements and early-destruction penalties remain separate.",
    "description": "Cold projectile and Ice Crystal explosion hit focus. Area damage targets wall explosions only. Crystal destruction, early-destruction penalties, wall lifetime, reloads and overlap are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L9728"
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
    "family": "crossbow",
    "damage": "lightningDamage",
    "speed": 1,
    "area": "Impact and explosion area hits; planted-bolt explosions still require a Detonator.",
    "description": "Lightning-converted impact/explosion hit focus. Planted-bolt explosions require another Detonator skill. Bolt limits, duration, setup cadence, reloads and explosion overlap are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L12875"
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
    "family": "crossbow",
    "damage": "coldDamage",
    "speed": 1,
    "area": "The native falling-bolt impacts deal area damage; larger coverage does not guarantee more hits on one target.",
    "description": "Cold-converted falling-bolt area hits. Reload-based bolt generation, stored bolt count, rain delay and single-target overlap are not calculated. Attack speed is not passive bolt-generation speed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L10084"
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
    "family": "crossbow",
    "damage": "lightningDamage",
    "speed": 1,
    "description": "Lightning-converted projectile-hit focus. Lightning-ailment-triggered pulses are excluded; the ordinary bolts are not area damage. Shock/Electrocute uptime, pulse counts and reloads are not assumed.",
    "excluded": [
      {
        "id": "areaOfEffect",
        "reason": "Area belongs to pulses requiring a Lightning Ailment; this preset reviews the ordinary projectile hits only."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L12188"
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
    "family": "crossbow",
    "damage": "lightningDamage",
    "speed": 1,
    "area": "Terrain-impact explosion only, not the travelling bolt or channel action.",
    "description": "Lightning projectile and terrain-impact explosion hits. Full charging is required. Area damage targets the explosion; attack speed does not remove the fixed added attack time. Reloads, terrain contact and total DPS are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L11580"
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
    "family": "crossbow",
    "damage": "physicalDamage",
    "speed": 1,
    "area": "Both impact and explosion stat sets deal area damage. Target count, delayed explosions and overlap are not multiplied into the score.",
    "description": "Physical crossbow impact/explosion hit focus. Enemy-seeking target counts, fall delay, planted-bolt explosion delay, overlap and reload uptime are not calculated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L12533"
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
    "family": "grenade",
    "damage": "physicalDamage",
    "speed": 1,
    "area": "The physical Grenade explosion deals area damage; coverage does not guarantee extra targets or Stuns.",
    "description": "Physical Grenade explosion with native Blind and Stun utility. Cooldown recovery replenishes uses, not fuse speed. Stun thresholds, Blind uptime, immunity and sustained DPS are not calculated.",
    "extras": [
      {
        "id": "stunBuildup",
        "weight": 2,
        "reason": "The native hit has increased Stun buildup; this does not guarantee a Heavy Stun or model enemy thresholds."
      },
      {
        "id": "blindEffect",
        "weight": 1,
        "reason": "The explosion supplies Blind itself; effect is not application chance, immunity bypass or guaranteed uptime."
      },
      {
        "id": "blindDuration",
        "weight": 1,
        "reason": "Extends its native on-hit Blind, not the Grenade fuse or Stun duration."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L5695"
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
    "family": "grenade",
    "damage": "physicalDamage",
    "speed": 1,
    "area": "Initial physical impact only. The Poison cloud and externally detonated fire explosion are outside this focus.",
    "description": "Initial physical Grenade-impact hit focus, not Poison cloud or externally detonated fire explosion. The Chaos/Fire tags do not imply unconditional damage of those types. Cloud growth, Poison scaling and detonator setup remain unmodeled.",
    "excluded": [
      {
        "id": "chaosDamage",
        "reason": "This focus does not model Poison cloud damage; the initial impact has no native Chaos conversion."
      },
      {
        "id": "fireDamage",
        "reason": "Fire conversion belongs to the separate explosion requiring external detonation, not the initial impact."
      },
      {
        "id": "damageOverTime",
        "reason": "The Poison cloud requires a separate ailment-focused review; this preset only scores the initial hit."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L6637"
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
    "family": "grenade",
    "damage": "lightningDamage",
    "speed": 1,
    "area": "The native Lightning Grenade explosion is an area hit; coverage does not predict Electrocution uptime.",
    "description": "Lightning-converted Grenade explosion hit focus. Electrocution debuff uptime and contributions from other skills are not calculated. Cooldown recovery replenishes uses, not fuse speed or debuff duration.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L20414"
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
    "family": "grenade",
    "damage": "physicalDamage",
    "speed": 1,
    "area": "Initial Grenade hit only; Oil Ground, external ignition and Ignite damage are excluded.",
    "description": "Initial physical Grenade-hit focus. Oil Ground, external ignition, Ignite, slowing and resistance changes are excluded. The Fire tag does not establish fire conversion on the initial hit.",
    "excluded": [
      {
        "id": "fireDamage",
        "reason": "The fire conversion and unscalable Ignite calculation belong to Oil Ground, not the reviewed initial physical hit."
      },
      {
        "id": "damageOverTime",
        "reason": "External Oil ignition and its unscalable Ignite need separate evaluation; hit bonuses are not claimed as Ignite scaling."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L14670"
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
    "family": "grenade",
    "damage": "fireDamage",
    "speed": 1,
    "area": "Primary and mini-Grenade explosion hits; no assumed mini-Grenade count, simultaneous hits or overlap gain.",
    "description": "Fire-converted primary/mini-Grenade explosion hits. Fuse lengths, mini-Grenade count, flight changes from area modifiers, Heat and overlap are not simulated. Cooldown recovery restores uses, not detonation speed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L2641"
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
    "family": "crossbow",
    "damage": "physicalDamage",
    "speed": 1,
    "description": "Item-granted basic crossbow bolt-hit focus. The native Area flag is not treated as proof of area damage without an area-damage stat. Ammunition replacement, reloads and weapon stats are not simulated.",
    "excluded": [
      {
        "id": "areaOfEffect",
        "reason": "The basic shot has no is_area_damage stat; this conservative projectile focus does not infer area damage from flags alone."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/other.lua#L3901"
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
    "family": "crossbow",
    "damage": "coldDamage",
    "speed": 1,
    "area": "The granted bombardment's impact hits deal area damage, not the non-damaging Compose Requiem action.",
    "description": "Item-granted cold bombardment hit focus while Requiem is active. Anguish accumulation, activation availability and its fixed active window are not simulated. No ammunition or reload benefit is assumed.",
    "excluded": [
      {
        "id": "skillDuration",
        "reason": "The source specifies a fixed Requiem window; Skill Effect Duration is not assumed to extend it."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L2998"
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
    "family": "melee-form",
    "damage": "physicalDamage",
    "speed": 1,
    "area": "The base slam shockwaves deal area damage; the Rage-enhanced variant and Jagged Ground are not assumed.",
    "description": "Bear physical slam/shockwave hits. Rage-enhanced area, Jagged Ground, aftershock timing and transformation additions are excluded. Unconditional melee bonuses apply to player hits, not an equipped Claw weapon.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L6307"
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
    "family": "melee-form",
    "damage": "fireDamage",
    "speed": 1,
    "area": "The reviewed melee fissure hits have area damage; fissure paths, limits and repeated contacts are not converted into DPS.",
    "description": "Bear fire-converted fissure-hit focus. Channel timing, fissure limits, random travel, Rage generation and contact frequency are not simulated. Attack-speed changes to channel cost do not establish sustainable DPS.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L6504"
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
    "family": "melee-form",
    "damage": "physicalDamage",
    "speed": 1,
    "area": "The running slams deal melee area damage; movement, repeats and aftershock contacts are not scored as extra hits.",
    "description": "Bear physical running-slam hit focus. Rage consumption, minimum channel time, transformation additions, travel speed and repeated contacts are not simulated. Attack speed is not charge movement speed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L15698"
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
    "family": "melee-form",
    "damage": "physicalDamage",
    "speed": 1,
    "area": "Landing slams only; the separate fire-converted fissure stat set is excluded.",
    "description": "Item-granted Bear landing-slam physical hits, not fire-converted fissures. Rage-dependent fissure counts, fixed/distance-added attack time, travel, repeated landings and form uptime are not simulated.",
    "excluded": [
      {
        "id": "fireDamage",
        "reason": "Fire conversion belongs to the separate fissure component, not the reviewed landing slams."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L13908"
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
    "family": "melee-form",
    "damage": "coldDamage",
    "speed": 2,
    "area": "The crescent is a native melee area hit, not a projectile inferred from its visual.",
    "description": "Werewolf cold-converted melee crescent hit. Despite its forward arc, the native damage component is not a projectile. Freeze thresholds, gear damage, transformation uptime and actual DPS are not calculated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L13080"
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
    "family": "melee-form",
    "damage": "physicalDamage",
    "speed": 1,
    "area": "Player landing hit only, not Predator's Mark, a socketed Mark or summoned/commanded Wolf Minions.",
    "cooldown": true,
    "description": "Werewolf player landing-hit focus. Predator's Mark, socketed Marks and Wolf Minions are separate effects/owners. Cooldown recovery affects leap availability; fixed added attack time, mark activation and minion damage are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L15212"
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
    "family": "melee-form",
    "damage": "physicalDamage",
    "speed": 1,
    "area": "Player claw-gouge hits only. The Marked-enemy shockwave, Mark activation and detonated Ice Fragments are not assumed.",
    "cooldown": true,
    "description": "Werewolf physical claw-gouge hit focus. Marked-enemy shockwaves, Mark activation, pulled Ice Fragments and simultaneous gouge hits are excluded. Cooldown recovery affects use availability, not a guaranteed combo rate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L3252"
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
    "family": "meteor",
    "damage": "fireDamage",
    "speed": 0,
    "area": "Player-owned meteor hits only, not the non-damaging activation or its separate fire/Rage buffs.",
    "description": "Bear-gated triggered meteor-hit focus, not the non-damaging activation. Glory generation, Bear-form uptime, enemy-dependent meteor rate, large-meteor cadence and ground effects are not calculated. Attack speed does not accelerate meteor triggers.",
    "extras": [
      {
        "id": "skillDuration",
        "weight": 1,
        "reason": "Extends the active effect's uptime, not meteor frequency, Glory generation or damage per hit."
      }
    ],
    "excluded": [
      {
        "id": "attackSpeed",
        "reason": "Meteor triggers have their own timing; player attack speed is not their trigger frequency."
      }
    ],
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L20797"
  }
];

export const remainingAttackSkillPreferencePresets: readonly SkillPreferencePreset[] = reviewedAttacks.map(reviewedAttack);

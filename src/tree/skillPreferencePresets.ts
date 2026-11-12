import type { PassiveOptimizationSettings, PassivePreferenceId } from "./passivePreferences";
import { refineSkillPreferencePreset } from "./skillSupportPreferences";
import { attackSkillPreferencePresets } from "./attackSkillPreferencePresets";
import { remainingAttackSkillPreferencePresets } from "./remainingAttackSkillPreferencePresets";
import { ballistaSkillPreferencePresets } from "./ballistaSkillPreferencePresets";
import { mortarCannonPreset, mortarCannonSkillPreferencePreset } from "./mortarCannonPreferences";
import { fireLightningSkillPreferencePresets } from "./fireLightningSkillPreferencePresets";
import { plantSkillPreferencePresets } from "./plantSkillPreferencePresets";
import { plantBowSkillPreferencePresets } from "./plantBowSkillPreferencePresets";
import { poisonBowSkillPreferencePresets } from "./poisonBowSkillPreferencePresets";
import { maceSkillPreferencePresets } from "./maceSkillPreferencePresets";
import { quarterstaffSkillPreferencePresets } from "./quarterstaffSkillPreferencePresets";
import { bowPrimarySkillPreferencePresets } from "./bowPrimarySkillPreferencePresets";
import { spearPrimarySkillPreferencePresets } from "./spearPrimarySkillPreferencePresets";
import { monkPrimarySkillPreferencePresets } from "./monkPrimarySkillPreferencePresets";
import { maceShieldSkillPreferencePresets } from "./maceShieldSkillPreferencePresets";
import { attackClosureSkillPreferencePresets } from "./attackClosureSkillPreferencePresets";
import { spellUtilitySkillPreferencePresets } from "./spellUtilitySkillPreferencePresets";
import { isSocketedProxyFocus, normalizeSocketedProxySkillId, proxySkillPreferencePresets, socketedProxyPreset } from "./proxySkillPreferencePresets";
import { defensiveBuffSkillPreferencePresets } from "./defensiveBuffSkillPreferencePresets";
import { persistentOffenceSkillPreferencePresets } from "./persistentOffenceSkillPreferencePresets";
import { resourceChargeSkillPreferencePresets } from "./resourceChargeSkillPreferencePresets";
import { utilityTriggerSkillPreferencePresets } from "./utilityTriggerSkillPreferencePresets";

export type SkillPassiveStatScope = "spellProjectileSpeed" | "spellCriticalChance" | "spellCriticalDamageBonus" | "spellAreaOfEffect" | "spellAreaDamage" | "attackCriticalChance" | "attackCriticalDamageBonus" | "attackAreaOfEffect" | "attackAreaDamage" | "attackElementalDamage" | "meleeDamage"
  | "bowAttackDamage" | "bowAttackSpeed" | "spearAttackDamage" | "spearAttackSpeed"
  | "crossbowAttackDamage" | "crossbowAttackSpeed" | "crossbowAccuracy" | "crossbowCriticalChance" | "crossbowCriticalDamageBonus"
  | "grenadeDamage" | "grenadeAreaOfEffect" | "grenadeCooldownRecovery"
  | "bannerAuraMagnitude" | "bannerAreaOfEffect" | "bannerGloryGeneration"
  | "heraldDamage" | "heraldAreaOfEffect"
  | "quarterstaffAttackDamage" | "quarterstaffAttackSpeed" | "maceAttackDamage" | "maceAttackSpeed"
  | "quarterstaffCriticalChance" | "spearCriticalChance"
  | "bowAccuracy" | "spearAccuracy" | "quarterstaffAccuracy"
  | "bowCriticalDamageBonus" | "spearCriticalDamageBonus" | "quarterstaffCriticalDamageBonus"
  | "meleeStunBuildup" | "quarterstaffStunBuildup" | "maceStunBuildup" | "quarterstaffFreezeBuildup"
  | "twoHandedWeaponDamage" | "twoHandedMeleeAccuracy"
  | "oneHandedWeaponDamage" | "oneHandedWeaponAttackSpeed" | "oneHandedMeleeAttackSpeed" | "oneHandedMeleeAccuracy"
  | "oneHandedMeleeCriticalChance" | "oneHandedMeleeCriticalDamageBonus" | "oneHandedAttackAilmentChance"
  | "attackBlindChance" | "spellHinderChance" | "attackMaimChance" | "attackIncisionChance" | "plantDamage" | "areaDamageOverTime" | "triggeredSpellDamage" | "secondaryAreaDamage";

export const reviewedWeaponPassiveScopes: readonly {
  wording: string; label: string; damage: SkillPassiveStatScope; speed: SkillPassiveStatScope; criticalChance?: SkillPassiveStatScope;
  accuracy?: SkillPassiveStatScope; criticalDamageBonus?: SkillPassiveStatScope;
  stunBuildup?: SkillPassiveStatScope; freezeBuildup?: SkillPassiveStatScope;
}[] = [
  { wording: "bows", label: "Bows", damage: "bowAttackDamage", speed: "bowAttackSpeed", accuracy: "bowAccuracy", criticalDamageBonus: "bowCriticalDamageBonus" },
  { wording: "spears", label: "Spears", damage: "spearAttackDamage", speed: "spearAttackSpeed", criticalChance: "spearCriticalChance", accuracy: "spearAccuracy", criticalDamageBonus: "spearCriticalDamageBonus" },
  { wording: "quarterstaves", label: "Quarterstaves", damage: "quarterstaffAttackDamage", speed: "quarterstaffAttackSpeed", criticalChance: "quarterstaffCriticalChance", accuracy: "quarterstaffAccuracy", criticalDamageBonus: "quarterstaffCriticalDamageBonus", stunBuildup: "quarterstaffStunBuildup", freezeBuildup: "quarterstaffFreezeBuildup" },
  { wording: "maces", label: "Maces", damage: "maceAttackDamage", speed: "maceAttackSpeed", stunBuildup: "maceStunBuildup" },
  { wording: "crossbows", label: "Crossbows", damage: "crossbowAttackDamage", speed: "crossbowAttackSpeed", accuracy: "crossbowAccuracy", criticalChance: "crossbowCriticalChance", criticalDamageBonus: "crossbowCriticalDamageBonus" },
];

export type SkillPreferencePreset = {
  id: string;
  name: string;
  gemId: string;
  tags: readonly string[];
  passiveStatScopes?: readonly SkillPassiveStatScope[];
  description: string;
  suggestions: readonly { id: PassivePreferenceId; weight: number; reason: string }[];
  exclusions: readonly { id: PassivePreferenceId; reason: string }[];
  sourceUrl: string;
};

const chaosPhysicalSkillPreferencePresets: readonly SkillPreferencePreset[] = [
  {
    id: "contagion", name: "Contagion", gemId: "Metadata/Items/Gems/SkillGemContagion",
    tags: ["area", "chaos", "duration", "grants_active_skill", "intelligence", "repeatable", "spell"],
    passiveStatScopes: ["spellAreaOfEffect"],
    description: "Chaos damage-over-time debuff with on-death spreading. Spell damage explicitly scales its DoT. Duration improves uptime and area improves spread coverage, not damage per second. Spread chains, transferred curses and other debuffs are not simulated.",
    suggestions: [
      { id: "chaosDamage", weight: 3, reason: "The native debuff deals Chaos damage over time." },
      { id: "spellDamage", weight: 3, reason: "The native stat explicitly applies spell damage modifiers to this skill's DoT; this is not inferred from a Spell tag." },
      { id: "damageOverTime", weight: 3, reason: "Targets the debuff's damage over time, not an invented delivery hit." },
      { id: "skillDuration", weight: 2, reason: "Extends the five-second base debuff and reduces refresh pressure; not a damage-per-second multiplier." },
      { id: "areaOfEffect", weight: 1, reason: "Widens spreading coverage, not a damaging area hit or a guaranteed chain count." },
      { id: "castSpeed", weight: 1, reason: "Shortens application casting, not the debuff's damage ticks or spread rate." },
    ],
    exclusions: [
      { id: "criticalChance", reason: "The reviewed skill is DoT-only with no damaging hit to critically strike." },
      { id: "criticalDamageBonus", reason: "The debuff does not deal critical-hit damage." },
      { id: "spellAreaDamage", reason: "Spread area is not area-hit damage; the native skill has no is_area_damage stat." },
      { id: "projectileDamage", reason: "The debuff is not delivered by a damaging projectile." },
      { id: "attackDamage", reason: "The debuff is not attack damage." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L3937",
  },
  {
    id: "bonestorm", name: "Bonestorm", gemId: "Metadata/Items/Gems/SkillGemBonestorm",
    tags: ["area", "channelling", "grants_active_skill", "intelligence", "physical", "projectile", "spell"],
    passiveStatScopes: ["spellProjectileSpeed", "spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Channelled physical spell projectiles and explosions. Area damage targets explosions only. Channel stages, Power Charges, Impale benefits to subsequent attacks, release timing and total DPS are not simulated.",
    suggestions: [
      { id: "physicalDamage", weight: 3, reason: "Both native projectile and explosion stat sets deal physical damage." },
      { id: "spellDamage", weight: 3, reason: "Both reviewed hit components carry native spell flags." },
      { id: "projectileDamage", weight: 2, reason: "Both the travelling spike and explosion carry projectile damage flags." },
      { id: "spellAreaDamage", weight: 1, reason: "The explosion explicitly has is_area_damage; the travelling spike does not." },
      { id: "castSpeed", weight: 1, reason: "Native channel-start timing and over-time cost scale with cast speed. Minimum channel time, release and stage count are not converted into DPS." },
      { id: "projectileSpeed", weight: 1, reason: "Changes projectile delivery speed, not the number of stored spikes or guaranteed hits." },
      { id: "areaOfEffect", weight: 1, reason: "Widens explosion coverage, without assuming consumed Power Charges or extra damage per hit." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The spell hits are not attacks; later attack benefits from Impale are outside this focus." },
      { id: "attackSpeed", reason: "Attack speed does not speed the spell channel." },
      { id: "skillDuration", reason: "Channel stages and release timing are not ordinary skill-effect duration." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L1806",
  },
  {
    id: "bone-cage", name: "Bone Cage", gemId: "Metadata/Items/Gems/SkillGemBoneCage",
    tags: ["area", "duration", "grants_active_skill", "intelligence", "nova", "physical", "repeatable", "spell"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Physical spell-hit focus on spikes that damage enemies on contact. Area improves coverage, not guaranteed contacts. Ring replacement, lifetime, Pinning and enemy movement are not simulated.",
    suggestions: [
      { id: "physicalDamage", weight: 3, reason: "The native spikes deal physical spell-hit damage." },
      { id: "spellDamage", weight: 3, reason: "The reviewed spikes are spell hits, not attacks." },
      { id: "spellAreaDamage", weight: 1, reason: "The native hit explicitly has is_area_damage." },
      { id: "areaOfEffect", weight: 1, reason: "Widens ring coverage without assuming more contacts, spikes or damage per hit." },
      { id: "castSpeed", weight: 1, reason: "Speeds raising the ring, not enemy contact or the lifetime before replacement." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The spikes deal spell damage, not attack damage." },
      { id: "attackSpeed", reason: "Attack speed does not speed casting." },
      { id: "projectileDamage", reason: "The native ring hit is not projectile damage." },
      { id: "skillDuration", reason: "Longer ring lifetime may provide utility, but is not assumed to improve contact-hit damage in this focus." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L1544",
  },
  {
    id: "despair", name: "Despair", gemId: "Metadata/Items/Gems/SkillGemDespair",
    tags: ["area", "chaos", "curse", "duration", "grants_active_skill", "intelligence", "repeatable", "spell"],
    passiveStatScopes: ["spellAreaOfEffect"],
    description: "Non-damaging curse that lowers enemy Chaos Resistance after an activation delay. Prioritizes outgoing curse magnitude, duration and coverage. Enemy resistance, curse limits and resulting build DPS are not calculated.",
    suggestions: [
      { id: "curseMagnitude", weight: 3, reason: "Scales the outgoing curse's resistance-reduction magnitude, not your Chaos Damage." },
      { id: "curseDuration", weight: 2, reason: "Extends curse uptime, not damage per second or a curse limit." },
      { id: "curseArea", weight: 2, reason: "Widens the area where this curse applies." },
      { id: "curseActivation", weight: 1, reason: "Shortens the native 1500 ms activation delay, separately from the cast action." },
      { id: "castSpeed", weight: 1, reason: "Speeds self-casting, not curse activation or trigger frequency." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The native curse deals no damage; Spell Damage does not scale its magnitude." },
      { id: "chaosDamage", reason: "The Chaos tag does not turn this non-damaging curse into Chaos damage." },
      { id: "criticalChance", reason: "The curse has no damaging hit to critically strike." },
      { id: "criticalDamageBonus", reason: "The curse does not deal critical-hit damage." },
      { id: "attackDamage", reason: "Attack damage does not strengthen this curse." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L5199",
  },
  {
    id: "vulnerability", name: "Vulnerability", gemId: "Metadata/Items/Gems/SkillGemVulnerability",
    tags: ["area", "curse", "duration", "grants_active_skill", "intelligence", "physical", "repeatable", "spell"],
    passiveStatScopes: ["spellAreaOfEffect"],
    description: "Non-damaging curse that lets hits ignore part of enemy Armour after an activation delay. Prioritizes outgoing curse strength and uptime, not player Physical Damage. Armour, curse limits and resulting damage are not calculated.",
    suggestions: [
      { id: "curseMagnitude", weight: 3, reason: "Scales the outgoing Armour-ignoring curse effect; it is not your Physical Damage." },
      { id: "curseDuration", weight: 2, reason: "Extends uptime without estimating enemy Armour or damage gained." },
      { id: "curseArea", weight: 2, reason: "Widens the area where the curse applies." },
      { id: "curseActivation", weight: 1, reason: "Shortens the native 1500 ms activation delay, separately from casting." },
      { id: "castSpeed", weight: 1, reason: "Speeds the self-cast action, not activation or the curse effect's magnitude." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The native curse explicitly deals no damage." },
      { id: "physicalDamage", reason: "A Physical tag does not make player damage scale this non-damaging curse." },
      { id: "criticalChance", reason: "The curse has no damaging hit to critically strike." },
      { id: "criticalDamageBonus", reason: "The curse does not deal critical-hit damage." },
      { id: "attackDamage", reason: "Attack damage does not strengthen the curse." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L22612",
  },
  {
    id: "hexblast", name: "Hexblast", gemId: "Metadata/Items/Gems/SkillGemHexblast",
    tags: ["area", "chaos", "grants_active_skill", "intelligence", "payoff", "repeatable", "spell"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Chaos spell explosions that consume eligible Curses. Hits are the focus, not curse magnitude. Half-expired curse requirements, curse setup, explosion count and total DPS are not simulated.",
    suggestions: [
      { id: "chaosDamage", weight: 3, reason: "The native explosions deal Chaos hit damage, not Chaos DoT." },
      { id: "spellDamage", weight: 3, reason: "The damaging explosions carry native spell flags." },
      { id: "spellAreaDamage", weight: 1, reason: "The explosion explicitly has is_area_damage." },
      { id: "areaOfEffect", weight: 1, reason: "Widens coverage without guaranteeing ten explosions or overlap." },
      { id: "castSpeed", weight: 1, reason: "Speeds self-casting only; curse eligibility and setup cadence are separate." },
    ],
    exclusions: [
      { id: "curseMagnitude", reason: "This skill consumes curses but is not itself a curse; their magnitude is not an unconditional hit multiplier." },
      { id: "curseDuration", reason: "Longer curse duration can delay the required halfway-expired state, rather than directly improving this hit focus." },
      { id: "damageOverTime", reason: "The base explosion is a hit, not damage over time." },
      { id: "attackDamage", reason: "The explosions are spells, not attacks." },
      { id: "projectileDamage", reason: "The native explosions are not projectile damage." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L11926",
  },
  {
    id: "unearth", name: "Unearth", gemId: "Metadata/Items/Gems/SkillGemUnearth",
    tags: ["area", "duration", "grants_active_skill", "intelligence", "minion", "physical", "repeatable", "spell"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Player physical spell-hit focus, not the summoned Bone Constructs. Area improves cone coverage. Corpse availability, minion damage, construct limits and lifetime are not simulated.",
    suggestions: [
      { id: "physicalDamage", weight: 3, reason: "Targets the player's native physical cone hit, not damage inherited by constructs." },
      { id: "spellDamage", weight: 3, reason: "The player's cone is a spell hit; this is not a minion-damage recommendation." },
      { id: "spellAreaDamage", weight: 1, reason: "The player's cone explicitly has is_area_damage." },
      { id: "areaOfEffect", weight: 1, reason: "Widens cone coverage, not guaranteed corpse consumption or minion count." },
      { id: "castSpeed", weight: 1, reason: "Speeds the player's cast action, not construct attacks." },
    ],
    exclusions: [
      { id: "minionDamage", reason: "Bone Construct damage is a different component from this player-hit focus." },
      { id: "minionAttackSpeed", reason: "Construct attack cadence is outside this player spell-hit focus." },
      { id: "attackDamage", reason: "The player's cone is spell damage, not attack damage." },
      { id: "skillDuration", reason: "The duration concerns construct lifetime, not direct cone-hit damage." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L21924",
  },
  {
    id: "detonate-dead", name: "Detonate Dead", gemId: "Metadata/Items/Gems/SkillGemDetonateDead",
    tags: ["area", "detonator", "fire", "grants_active_skill", "intelligence", "physical", "repeatable", "spell"],
    passiveStatScopes: ["spellAreaOfEffect", "spellHinderChance"],
    description: "Corpse-physical explosion focus with a separate flat fire component. Prioritizes Physical Damage and coverage without assuming spell damage scales the entire corpse-Life portion. Corpse Life, availability, delay and total DPS are not calculated.",
    suggestions: [
      { id: "physicalDamage", weight: 3, reason: "The native corpse-Life stat supplies a physical explosion component; its size depends on the corpse, not your Life." },
      { id: "fireDamage", weight: 1, reason: "Scores the separate flat fire component, not the corpse-Life physical portion." },
      { id: "areaOfEffect", weight: 1, reason: "Widens explosion coverage, not damage per hit or corpse supply." },
      { id: "castSpeed", weight: 1, reason: "Speeds casting, not the fixed 400 ms explosion delay or corpse generation." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "Spell-damage scaling of the corpse-Life physical component is not assumed; a manual weight may still serve the flat fire component." },
      { id: "spellAreaDamage", reason: "Corpse-Life component applicability needs a separate scope review before this preference is enabled for the physical focus." },
      { id: "attackDamage", reason: "The corpse explosion is not a weapon attack." },
      { id: "damageOverTime", reason: "This explosion focus does not assume Ignite or transferred Contagion damage." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L5333",
  },
  {
    id: "dark-effigy", name: "Dark Effigy", gemId: "Metadata/Items/Gems/SkillGemDarkEffigy",
    tags: ["area", "chaos", "duration", "grants_active_skill", "intelligence", "projectile", "spell", "totem"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage"],
    description: "Totem-fired Vile Effusion Chaos spell-hit focus, not minion damage or damage over time. Requires enemy Chaos DoT debuffs. Debuff count, deployment timing, totem uptime, projectile count and total DPS are not simulated.",
    suggestions: [
      { id: "chaosDamage", weight: 3, reason: "The linked native Vile Effusion component deals Chaos hits, not the prerequisite DoT." },
      { id: "spellDamage", weight: 3, reason: "Vile Effusion is a totem-used spell, not a Minion skill." },
      { id: "projectileDamage", weight: 2, reason: "The linked damaging component explicitly carries projectile damage flags." },
      { id: "spellAreaDamage", weight: 1, reason: "The linked Vile Effusion component explicitly has is_area_damage." },
      { id: "areaOfEffect", weight: 1, reason: "Targets the reviewed area-enabled component, without promising more targets, projectiles or hits." },
    ],
    exclusions: [
      { id: "minionDamage", reason: "The damaging proxy is a Totem, not a Minion; minion damage is not copied to it." },
      { id: "damageOverTime", reason: "Chaos DoT is a targeting prerequisite, not the damage dealt by these projectiles." },
      { id: "attackDamage", reason: "Vile Effusion deals spell-hit damage, not attack damage." },
      { id: "castSpeed", reason: "Rapid Casting affects the linked Vile Effusion spell, not deployment. Actual targeting and totem firing cadence remain unmodeled; no automatic cast-speed priority or guaranteed hit rate is recommended here." },
      { id: "projectileSpeed", reason: "A beneficial projectile-speed scope has not been reviewed for the auto-targeting proxy." },
      { id: "skillDuration", reason: "Totem lifetime is outside this hit-focused preset, not an assumed damage-per-second gain." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L4851",
  },
];

const warcrySpeedSuggestion: SkillPreferencePreset["suggestions"][number] = {
  id: "warcrySpeed", weight: 2, reason: "Prioritizes the player's Warcry use action, not Attack/Cast Speed or cooldown recovery. Resource gates, instant/triggered use and actual repeat frequency are not simulated.",
};
const warcryCooldownSuggestion: SkillPreferencePreset["suggestions"][number] = {
  id: "warcryCooldownRecoveryRate", weight: 2, reason: "Improves the baseline eight-second cooldown when it is not bypassed. Endurance Charge availability, overrides and actual repeat frequency are not simulated.",
};
const warcryAreaSuggestion: SkillPreferencePreset["suggestions"][number] = {
  id: "warcryAreaOfEffect", weight: 1, reason: "Prioritizes Warcry coverage, not radius percentage, buff strength or an empowered/triggered attack's area. Requires valid equipment and form; enemy Power and actual target coverage are not simulated.",
};
const warcryUtilityExclusions: SkillPreferencePreset["exclusions"] = [
  ...(["spellDamage", "attackDamage", "minionDamage", "criticalChance", "criticalDamageBonus"] as const).map((id) => ({
    id, reason: "This utility focus concerns the player's Warcry, not damage from its parent hit, empowered attacks, triggered components or minion actions. Manual priorities remain available for other skills.",
  })),
  ...(["attackSpeed", "castSpeed"] as const).map((id) => ({
    id, reason: "Warcry use speed is separate from Attack/Cast Speed. Empowering or triggering an attack does not turn the Warcry's use action into that attack. Manual priorities are retained.",
  })),
];
const warcrySkillPreferencePresets: readonly SkillPreferencePreset[] = [
  {
    id: "infernal-cry", name: "Infernal Cry", gemId: "Metadata/Items/Gems/SkillGemInfernallCry",
    tags: ["area", "duration", "fire", "grants_active_skill", "nova", "strength", "trigger", "warcry"], passiveStatScopes: [],
    description: "Self-used human-form Warcry utility. Nearby enemies enable empowered melee attacks; destabilised enemies Combust on death. Endurance Charges can bypass its cooldown. Enemy Power, consuming attacks, corpses and explosion damage are not simulated.",
    suggestions: [warcrySpeedSuggestion, warcryCooldownSuggestion, warcryAreaSuggestion],
    exclusions: [...warcryUtilityExclusions,
      { id: "fireDamage", reason: "Combust and the extra Fire damage of empowered attacks are separate from this Warcry utility focus. No corpse, consuming attack or Fire-damage multiplier is assumed." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L7667",
  },
  {
    id: "seismic-cry", name: "Seismic Cry", gemId: "Metadata/Items/Gems/SkillGemSeismicCry",
    tags: ["area", "grants_active_skill", "nova", "physical", "strength", "warcry"], passiveStatScopes: [],
    description: "Self-used human-form Warcry utility, not its secondary-damage hit. Requires Primed/Heavy Stun conditions to empower later Slams with Aftershocks. Endurance Charges can bypass cooldown. Stun state, empowered attacks and damage are not simulated.",
    suggestions: [warcrySpeedSuggestion, warcryCooldownSuggestion, warcryAreaSuggestion],
    exclusions: [...warcryUtilityExclusions,
      { id: "physicalDamage", reason: "The Warcry has a secondary Physical hit, not an Attack or Spell. This preset prioritizes utility, not its hit damage or subsequent Slam/Aftershock damage." },
      { id: "stunBuildup", reason: "Primed/Heavy Stun state and empowerment requirements are not supplied or solved by selecting this focus. Hit-based Stun Buildup is a separate manual choice." },
      { id: "skillDuration", reason: "Base Seismic Cry has no intrinsic duration timer; later Slam/Aftershock behavior is not an assumed Warcry duration. Support-granted timers such as Corrupted Blood are separate and do not add automatic Duration suggestions." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L16755",
  },
  {
    id: "ancestral-cry", name: "Ancestral Cry", gemId: "Metadata/Items/Gems/SkillGemAncestralCry",
    tags: ["area", "attack", "buff", "conditional", "duration", "fire", "grants_active_skill", "melee", "nova", "projectile", "slam", "strength", "trigger", "warcry"], passiveStatScopes: [],
    description: "Human-form activation requires a melee martial weapon or unarmed and 100 Glory from Ignites. Kaom embodiment, charge-scaled duration, Volcanic Steps/Eruption and empowered attacks are conditional; Glory generation, actual uptime and damage are not simulated.",
    suggestions: [warcrySpeedSuggestion, warcryAreaSuggestion,
      { id: "skillDuration", weight: 1, reason: "Extends the eight-second Kaom embodiment in native checks, not Glory generation or trigger frequency. Endurance Charge scaling, consuming attacks and actual uptime are not simulated." },
    ],
    exclusions: [...warcryUtilityExclusions,
      { id: "warcryCooldownRecoveryRate", reason: "The reviewed parent has no base cooldown: its activation is Glory-gated. Cooldown recovery does not generate Glory or bypass that requirement. Manual priorities remain available for other Warcries." },
      { id: "fireDamage", reason: "Fire conversion, Volcanic Steps/Eruption and empowered attacks are outside this parent utility focus, not an always-on damage bonus." },
      { id: "projectileDamage", reason: "The gem's projectile tag describes a linked attack component, not the non-damaging parent Warcry." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L9",
  },
  {
    id: "fortifying-cry", name: "Fortifying Cry", gemId: "Metadata/Items/Gems/SkillGemFortifyingCry",
    tags: ["area", "attack", "duration", "grants_active_skill", "melee", "nova", "physical", "strength", "trigger", "warcry"], passiveStatScopes: [],
    description: "Self-used human-form Warcry requiring an Armoured Shield. Grants Guard and enables Shield Wave on subsequent Shield Attack damage. Power, Guard strength, trigger timing, charge bypasses and Shield Wave damage are not simulated.",
    suggestions: [warcrySpeedSuggestion, warcryCooldownSuggestion, warcryAreaSuggestion],
    exclusions: [...warcryUtilityExclusions,
      { id: "physicalDamage", reason: "Shield Wave is a separate triggered non-weapon Shield Attack. Its damage and shield-Armour scaling are outside this utility focus. Player Armour is not local shield Armour or Guard strength; manual defence priorities remain available." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L6045",
  },
  {
    id: "ferocious-roar", name: "Ferocious Roar", gemId: "Metadata/Items/Gems/SkillGemFerociousRoar",
    tags: ["area", "bear", "grants_active_skill", "intelligence", "meta", "nova", "shapeshift", "strength", "warcry"], passiveStatScopes: [],
    description: "Standalone Bear-form Warcry requiring a Talisman. Nearby enemies supply Rage and empowered Armour Break attacks. Socketed human-form Warcry replacement is outside this focus; form availability, Power, charges, trigger timing and damage are not simulated.",
    suggestions: [
      { ...warcrySpeedSuggestion, reason: "Prioritizes roar responsiveness. PoB uses a 0.8-second Warcry base despite the skill's 1.1-second source castTime; no exact action time or socketed-Warcry cadence is promised." },
      warcryCooldownSuggestion, warcryAreaSuggestion,
    ],
    exclusions: [...warcryUtilityExclusions,
      { id: "armourBreakAmount", reason: "Armour Break comes from later empowered attacks, not the roar itself. Attack availability, Power, empowered count and actual Armour Break are not simulated." },
      { id: "skillDuration", reason: "The standalone base parent has no intrinsic duration timer. Support-granted Corrupted Blood is separate and does not add automatic Duration suggestions. A socketed human-form Warcry and its durations require a separate component review." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L5316",
  },
];

const markUtilitySuggestions: SkillPreferencePreset["suggestions"] = [
  { id: "markEffect", weight: 3, reason: "Prioritizes outgoing Mark strength, not a hit or a DPS estimate. Native Mark-effect scaling is incomplete." },
  { id: "markUseSpeed", weight: 1, reason: "Speeds Mark application, not its cooldown, trigger condition or guaranteed uptime." },
];
const markUtilityExclusions: SkillPreferencePreset["exclusions"] = (["spellDamage", "attackDamage", "minionDamage", "criticalChance", "criticalDamageBonus"] as const).map((id) => ({
  id, reason: "The parent Mark applies a non-damaging debuff, not an attack, spell or minion hit. Activating hits, triggered damage and conditional buffs are outside this utility focus. Manual priorities remain available for other skills.",
}));
const markSkillPreferencePresets: readonly SkillPreferencePreset[] = [
  {
    id: "snipers-mark", name: "Sniper's Mark", gemId: "Metadata/Items/Gems/SkillGemSnipersMark",
    tags: ["dexterity", "duration", "grants_active_skill", "mark"],
    passiveStatScopes: [],
    description: "Non-damaging Mark consumed by the next qualifying Critical Hit for extra damage and a Frenzy Charge. Utility focus only; activation ownership, the six-second cooldown, charge generation and resulting damage are not simulated.",
    suggestions: [...markUtilitySuggestions,
      { id: "markDuration", weight: 1, reason: "Extends the eight-second setup window before a Critical Hit consumes the Mark; not guaranteed charges or faster cooldown recovery." },
    ],
    exclusions: [...markUtilityExclusions,
      { id: "projectileDamage", reason: "The name does not make Mark application a projectile hit or transfer projectile damage to the debuff." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L7520",
  },
  {
    id: "bloodhounds-mark", name: "Bloodhound's Mark", gemId: "Metadata/Items/Gems/SkillGemBloodhoundsMark",
    tags: ["area", "attack", "dexterity", "duration", "grants_active_skill", "mark", "payoff", "physical", "trigger"],
    passiveStatScopes: [],
    description: "Non-damaging Mark uses external Blood Loss to build Heavy Stun, then consumes itself on Heavy Stun or a qualifying death to trigger Blood Explosion. The separate non-weapon attack, buildup, threshold and trigger frequency are not modeled.",
    suggestions: [...markUtilitySuggestions,
      { id: "markDuration", weight: 1, reason: "Extends the setup window; the timer does not expire while the target suffers Blood Loss. This is not explosion frequency or guaranteed uptime." },
    ],
    exclusions: [...markUtilityExclusions,
      { id: "physicalDamage", reason: "Blood Explosion is a separate triggered non-weapon physical attack, not damage from Mark application. Its damage is outside this utility focus." },
      { id: "bleedingChance", reason: "The Mark requires external Blood Loss; it does not supply a hit or Bleeding chance by itself." },
      { id: "stunBuildup", reason: "Blood-Loss-derived Mark buildup is not inferred from player hit-based Stun Buildup. Trigger thresholds and external hits are not simulated." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L496",
  },
  {
    id: "freezing-mark", name: "Freezing Mark", gemId: "Metadata/Items/Gems/SkillGemFreezingMark",
    tags: ["buff", "cold", "dexterity", "duration", "grants_active_skill", "intelligence", "mark"],
    passiveStatScopes: [],
    description: "Non-damaging Mark increases susceptibility to Freeze. Freeze consumes it to grant a conditional extra-Cold player buff; marking another target removes that buff. Freeze application, separate buff timing and resulting damage are not simulated.",
    suggestions: [...markUtilitySuggestions,
      { id: "markDuration", weight: 1, reason: "Extends the Mark's setup window before Freeze consumes it. Native checks also lengthen the separate post-consumption buff timer, not its strength. Activation, re-marking and buff uptime are not simulated." },
    ],
    exclusions: [...markUtilityExclusions,
      { id: "coldDamage", reason: "A Cold tag and conditional damage-gain buff do not make Mark application a cold hit or guarantee a damage increase for another skill." },
      { id: "freezeBuildup", reason: "Freeze must come from other capable hits. The utility preset does not infer player or minion Freeze Buildup from target susceptibility." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L8755",
  },
  {
    id: "voltaic-mark", name: "Voltaic Mark", gemId: "Metadata/Items/Gems/SkillGemVoltaicMark",
    tags: ["buff", "dexterity", "duration", "grants_active_skill", "lightning", "mark"],
    passiveStatScopes: [],
    description: "Non-damaging Mark increases susceptibility to Electrocute. Electrocute consumes it to grant a conditional extra-Lightning player buff; marking another target removes that buff. Application, separate buff timing and resulting damage are not simulated.",
    suggestions: [...markUtilitySuggestions,
      { id: "markDuration", weight: 1, reason: "Extends the Mark's setup window before Electrocute consumes it. Native checks also lengthen the separate post-consumption buff timer, not its strength. Activation, re-marking and buff uptime are not simulated." },
    ],
    exclusions: [...markUtilityExclusions,
      { id: "lightningDamage", reason: "A Lightning tag and conditional damage-gain buff do not make the parent Mark a damaging lightning spell or guarantee another skill's damage." },
      { id: "electrocuteBuildup", reason: "Electrocute must come from other capable hits; no player or minion application source is inferred from the Mark." },
      { id: "shockChance", reason: "Electrocute consumption is not Shock application. The Lightning tag does not grant a shock-capable hit." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L10397",
  },
];

const minionPlayerExclusions: SkillPreferencePreset["exclusions"] = (["spellDamage", "attackDamage", "physicalDamage", "elementalDamage", "fireDamage", "coldDamage", "lightningDamage", "chaosDamage", "projectileDamage", "criticalChance", "criticalDamageBonus"] as const).map((id) => ({
  id, reason: "This is a player damage preference, not an explicit minion modifier. It does not transfer to this minion merely because its skill shares that damage type or tag. Manual priorities are retained for other skills.",
}));
const minionPlayerSpeedExclusions: SkillPreferencePreset["exclusions"] = [
  { id: "attackSpeed", reason: "Player attack speed does not speed this minion's actions; explicit minion speed is separate." },
  { id: "castSpeed", reason: "Player cast speed does not speed this minion's actions or its persistent summon activation." },
  { id: "skillDuration", reason: "This persistent skeleton is not a temporary duration minion. Command and buff durations are separate and not modeled." },
];

const minionSkillPreferencePresets: readonly SkillPreferencePreset[] = [
  {
    id: "skeletal-sniper", name: "Skeletal Sniper", gemId: "Metadata/Items/Gems/SkillGemSkeletalSniper",
    tags: ["chaos", "fire", "grants_active_skill", "intelligence", "minion", "persistent", "physical"],
    description: "Persistent minion bow-attack focus, not player bow damage. Prioritizes minion damage, attack speed and survival. Gas Arrow, poison clouds, detonations, commands, reservation and actual minion count are not simulated.",
    suggestions: [
      { id: "minionDamage", weight: 3, reason: "Explicit minion damage scales the Sniper's own attacks, not the player's damage types." },
      { id: "minionAttackSpeed", weight: 2, reason: "The native basic bow shot is an attack. Attack speed improves its cadence, not command cooldowns or cloud ticks." },
      { id: "minionLife", weight: 1, reason: "Separate minion survival priority; player maximum Life does not increase this minion's Life." },
    ],
    exclusions: [...minionPlayerExclusions, ...minionPlayerSpeedExclusions,
      { id: "minionCastSpeed", reason: "The reviewed basic bow shot is an attack, not a minion spell." },
      { id: "projectileSpeed", reason: "Player projectile speed is not an explicit minion projectile-speed preference." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L18677",
  },
  {
    id: "skeletal-frost-mage", name: "Skeletal Frost Mage", gemId: "Metadata/Items/Gems/SkillGemSkeletalFrostMage",
    tags: ["cold", "grants_active_skill", "intelligence", "minion", "persistent"],
    description: "Persistent minion Ice Shard spell-hit focus, not player Cold or Spell Damage. Prioritizes minion damage, cast speed and survival. Ice Armour, commands, Freeze, projectile overlap, reservation and actual minion count are not simulated.",
    suggestions: [
      { id: "minionDamage", weight: 3, reason: "Explicit minion damage scales the Mage's native Ice Shard hits; player Cold or Spell Damage does not transfer by default." },
      { id: "minionCastSpeed", weight: 2, reason: "Ice Shard is a minion spell. Its native cast cadence responds to minion cast speed, not player cast speed." },
      { id: "minionLife", weight: 1, reason: "Minion survival is separate from its spell damage and the player's Life or Energy Shield." },
    ],
    exclusions: [...minionPlayerExclusions, ...minionPlayerSpeedExclusions,
      { id: "minionAttackSpeed", reason: "The reviewed Ice Shard is a spell, not an attack." },
      { id: "projectileSpeed", reason: "Player projectile speed does not establish minion travel-speed or overlap benefit." },
      { id: "spellAreaDamage", reason: "Player Spell Area Damage is not minion damage, and this focus does not model Ice Armour." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L18419",
  },
  {
    id: "skeletal-storm-mage", name: "Skeletal Storm Mage", gemId: "Metadata/Items/Gems/SkillGemSkeletalStormMage",
    tags: ["grants_active_skill", "intelligence", "lightning", "minion", "persistent"],
    description: "Persistent minion Arc spell-hit focus, not player Lightning or Spell Damage. Prioritizes minion damage, cast speed and survival. Death Storm, Shock pulses, commands, chains, reservation and actual minion count are not simulated.",
    suggestions: [
      { id: "minionDamage", weight: 3, reason: "Explicit minion damage scales the Mage's Arc hits; the Lightning tag does not transfer player Lightning Damage." },
      { id: "minionCastSpeed", weight: 2, reason: "The native Arc is a minion spell, so minion cast speed changes its cast cadence." },
      { id: "minionLife", weight: 1, reason: "Separate minion survival priority, not player Life or Energy Shield scaling." },
    ],
    exclusions: [...minionPlayerExclusions, ...minionPlayerSpeedExclusions,
      { id: "minionAttackSpeed", reason: "The reviewed Arc is a spell, not an attack." },
      { id: "spellAreaDamage", reason: "Player spell-area modifiers do not transfer to this minion's spells." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L18800",
  },
  {
    id: "skeletal-brute", name: "Skeletal Brute", gemId: "Metadata/Items/Gems/SkillGemSkeletalBrute",
    tags: ["grants_active_skill", "intelligence", "minion", "payoff", "persistent", "physical", "warcry"],
    description: "Persistent minion basic melee-attack focus, not player melee damage. Prioritizes minion damage, attack speed and survival. Bonebreaker, Shattering Roar, stun priming, Freeze consumption, commands, reservation and actual minion count are not simulated.",
    suggestions: [
      { id: "minionDamage", weight: 3, reason: "Explicit minion damage scales the Brute's own basic physical attack, not player weapon or Physical Damage." },
      { id: "minionAttackSpeed", weight: 2, reason: "The reviewed melee action is an attack; command cooldowns and warcry timing are not inferred from its speed." },
      { id: "minionLife", weight: 1, reason: "Separate minion survival priority, not player Life or a guaranteed stun/warcry benefit." },
    ],
    exclusions: [...minionPlayerExclusions, ...minionPlayerSpeedExclusions,
      { id: "minionCastSpeed", reason: "The reviewed basic melee action is an attack, not a spell." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L18171",
  },
  {
    id: "skeletal-cleric", name: "Skeletal Cleric", gemId: "Metadata/Items/Gems/SkillGemSkeletalCleric",
    tags: ["grants_active_skill", "intelligence", "minion", "persistent"],
    description: "Persistent healing and revival utility minion, not a damage focus. Prioritizes minion survival and heal-cast responsiveness. Healing magnitude, buff uptime, revival timing, missing native revival calculations, reservation and actual minion count are not simulated.",
    suggestions: [
      { id: "minionLife", weight: 3, reason: "Keeps the Cleric alive as a separate survival priority; does not increase player Life or healing magnitude." },
      { id: "minionCastSpeed", weight: 1, reason: "The native Heal Buff spell casts faster with minion cast speed. This is application responsiveness, not more regeneration per second, faster revival or guaranteed uptime." },
    ],
    exclusions: [...minionPlayerExclusions, ...minionPlayerSpeedExclusions,
      { id: "minionDamage", reason: "Minion damage does not make this non-damaging heal or revival stronger." },
      { id: "minionAttackSpeed", reason: "The reviewed heal is a spell, not an attack." },
      { id: "lifeRegenerationRate", reason: "This preference concerns the player's regeneration, not the Cleric's outgoing heal buff on other minions." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L18295",
  },
  {
    id: "skeletal-reaver", name: "Skeletal Reaver", gemId: "Metadata/Items/Gems/SkillGemSkeletalReaver",
    tags: ["grants_active_skill", "intelligence", "minion", "persistent", "physical"],
    description: "Persistent minion basic melee-attack focus, not player attacks. Prioritizes minion damage, attack speed and survival. Enrage, Rage, Life loss, revive timing, commands, reservation and actual minion count are not simulated.",
    suggestions: [
      { id: "minionDamage", weight: 3, reason: "Explicit minion damage scales the Reaver's own basic attack; player Physical or Attack Damage does not transfer." },
      { id: "minionAttackSpeed", weight: 2, reason: "The reviewed basic action is a minion attack. Enrage uptime and command timing are not calculated." },
      { id: "minionLife", weight: 1, reason: "Separate minion survival priority; this does not solve Enrage Life loss or guarantee continuous uptime." },
    ],
    exclusions: [...minionPlayerExclusions, ...minionPlayerSpeedExclusions,
      { id: "minionCastSpeed", reason: "The reviewed basic melee action is an attack, not a spell." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L18543",
  },
  {
    id: "bone-offering", name: "Bone Offering", gemId: "Metadata/Items/Gems/SkillGemBoneOffering",
    tags: ["area", "buff", "duration", "grants_active_skill", "intelligence", "minion", "physical"],
    description: "Minion-shield uptime focus, not player defence or explosion damage. Prioritizes duration, minion survival and recasting. Shield thresholds, spike Life, absorption, explosions, sacrifice availability and actual uptime are not simulated.",
    suggestions: [
      { id: "skillDuration", weight: 3, reason: "Extends the native eight-second Offering lifetime, subject to the spike surviving; not stronger shields or guaranteed uptime." },
      { id: "minionLife", weight: 2, reason: "Separate survival priority for the protected minions. The spike's own Life and shield thresholds are not calculated or inferred from player Life." },
      { id: "castSpeed", weight: 1, reason: "Native player cast speed shortens the Offering's use action, not the minions' actions or shield mechanics." },
    ],
    exclusions: [...minionPlayerExclusions,
      { id: "minionDamage", reason: "Minion damage does not strengthen the shield buff in this uptime focus; shield-loss explosions are a separate, unmodeled component." },
      { id: "minionAttackSpeed", reason: "Minion attack speed does not strengthen or refresh this shield buff." },
      { id: "minionCastSpeed", reason: "The player uses the Offering; minion cast speed does not shorten that action." },
      { id: "areaOfEffect", reason: "A native Area flag alone does not establish shield coverage; its radius and explosion component are not reviewed here." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L1682",
  },
  {
    id: "pain-offering", name: "Pain Offering", gemId: "Metadata/Items/Gems/SkillGemPainOffering",
    tags: ["area", "buff", "duration", "grants_active_skill", "intelligence", "minion"],
    description: "Minion-buff uptime and coverage focus, not player damage. Prioritizes duration, area, minion survival and recasting. Buff strength, spike Life, minion-count coverage, sacrifice availability and actual uptime are not simulated.",
    suggestions: [
      { id: "skillDuration", weight: 3, reason: "Extends the native six-second Offering lifetime while the spike remains alive, not its damage or speed buff magnitude." },
      { id: "areaOfEffect", weight: 1, reason: "Widens the native buff radius for nearby minions, not damage per hit or a guaranteed number of affected minions." },
      { id: "minionLife", weight: 1, reason: "Separate minion survival preference; this does not increase the Offering's damage/speed buff or calculate spike Life." },
      { id: "castSpeed", weight: 1, reason: "Shortens the player's Offering use action. It does not increase the buff's minion attack/cast-speed modifier." },
    ],
    exclusions: [...minionPlayerExclusions,
      { id: "minionDamage", reason: "This directly scales beneficiary minion damage, not the Offering's buff magnitude. This utility focus leaves direct damage priorities manual." },
      { id: "minionAttackSpeed", reason: "Minion attack speed benefits recipient attacks independently; it does not scale the Offering's speed buff." },
      { id: "minionCastSpeed", reason: "Minion cast speed benefits recipient spells independently; it does not scale the Offering's speed buff or the player's use action." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L15720",
  },
];

// Tags are literal Gems.lua tag keys, not compatibility rules. Weights and reasons
// are manually reviewed base-skill heuristics, not game data or a DPS calculation.
export const skillPreferencePresets: readonly SkillPreferencePreset[] = [
  {
    id: "enfeeble",
    name: "Enfeeble",
    gemId: "Metadata/Items/Gems/SkillGemEnfeeble",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "duration", "curse", "repeatable"],
    description: "Non-damaging area curse that reduces enemies' damage after an activation delay. Prioritizes outgoing curse strength, duration and coverage; cast speed is a self-cast convenience, not trigger speed.",
    suggestions: [
      { id: "curseMagnitude", weight: 3, reason: "Outgoing Curse Magnitudes strengthen Enfeeble's damage reduction; effect of curses on you is a different stat." },
      { id: "curseDuration", weight: 2, reason: "Longer curse duration keeps affected enemies Enfeebled between applications." },
      { id: "curseArea", weight: 2, reason: "Area of Effect of Curses widens the area in which Enfeeble applies." },
      { id: "curseActivation", weight: 1, reason: "Faster Curse Activation shortens the native delay before the curse applies, separately from cast time." },
      { id: "castSpeed", weight: 1, reason: "Shortens the self-cast action; does not increase trigger frequency or replace curse activation speed." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "Enfeeble deals no damage; its Spell type does not make spell damage scale the curse's magnitude." },
      { id: "criticalChance", reason: "The base curse has no damaging hit to critically strike; this does not restrict other skills in the build." },
      { id: "attackDamage", reason: "Enfeeble is not a damaging attack; attack damage does not strengthen its curse." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L6374-L6510",
  },
  {
    id: "spark",
    passiveStatScopes: ["spellProjectileSpeed", "spellCriticalChance", "spellCriticalDamageBonus", "spellHinderChance"],
    name: "Spark",
    gemId: "Metadata/Items/Gems/SkillGemSpark",
    tags: ["intelligence", "grants_active_skill", "spell", "projectile", "lightning", "duration", "repeatable"],
    description: "Base lightning spell projectiles travel along the ground until they hit or expire. Self-cast speed, projectile speed and duration improve delivery or coverage, without guaranteeing extra hits.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "Spark's native lightning hits deal spell damage." },
      { id: "lightningDamage", weight: 3, reason: "The base projectile deals lightning damage, without assuming an infusion or conversion." },
      { id: "elementalDamage", weight: 2, reason: "Lightning is elemental damage, so this scales the base hits." },
      { id: "projectileDamage", weight: 2, reason: "The damaging sparks are spell projectiles." },
      { id: "castSpeed", weight: 2, reason: "Increases self-cast frequency; trigger cadence and mana sustain are outside this preset." },
      { id: "projectileSpeed", weight: 1, reason: "General and spell-only projectile speed change how quickly sparks cover ground during their lifetime; neither is a flat DPS multiplier." },
      { id: "skillDuration", weight: 1, reason: "The native spark lifetime is a skill effect duration; longer lifetime can improve coverage, without guaranteeing repeat hits." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The base sparks are spell hits, not attacks." },
      { id: "attackSpeed", reason: "Attack speed does not shorten Spark's self-cast action." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L19893",
  },
  {
    id: "fireball",
    passiveStatScopes: ["spellProjectileSpeed", "spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    name: "Fireball",
    gemId: "Metadata/Items/Gems/SkillGemFireball",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "projectile", "fire", "repeatable"],
    description: "Hit-focused fire spell with a projectile and impact explosion. Self-cast speed improves delivery; area of effect widens the explosion rather than increasing damage per hit.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "The projectile and explosion have native spell damage flags." },
      { id: "spellAreaDamage", weight: 1, reason: "Scores increased and reduced Spell Area Damage for the explosion only, not the travelling projectile, firebolts or ignite. Kept separate from coverage and general Spell Damage; not a Full DPS estimate." },
      { id: "fireDamage", weight: 3, reason: "Both base hit stat sets deal fire damage." },
      { id: "elementalDamage", weight: 2, reason: "Fire is elemental damage, so this scales the base fire hits." },
      { id: "projectileDamage", weight: 2, reason: "Both the native projectile and impact explosion carry projectile damage flags; this is a hit-focused suggestion, not ignite scaling." },
      { id: "castSpeed", weight: 2, reason: "Shortens the self-cast action; does not promise faster triggers or sustainable casting." },
      { id: "areaOfEffect", weight: 1, reason: "Widens the native impact explosion's coverage, rather than increasing its damage per hit." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The base projectile and explosion deal spell damage, not attack damage." },
      { id: "attackSpeed", reason: "Attack speed does not shorten Fireball's self-cast action." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L7374",
  },
  {
    id: "lightning-arrow",
    passiveStatScopes: ["attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackElementalDamage", "bowAttackDamage", "bowAttackSpeed", "bowAccuracy", "bowCriticalDamageBonus", "twoHandedWeaponDamage", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    name: "Lightning Arrow",
    gemId: "Metadata/Items/Gems/SkillGemLightningArrow",
    tags: ["dexterity", "grants_active_skill", "attack", "area", "projectile", "lightning", "chaining", "repeatable"],
    description: "Bow attack whose arrow creates chaining lightning beams on impact. Focuses on weapon-based attack hits and lightning damage, not spell scaling.",
    suggestions: [
      { id: "attackDamage", weight: 3, reason: "The arrow and beam stat sets are native attacks using the bow's damage." },
      { id: "lightningDamage", weight: 3, reason: "Native physical-to-lightning conversion supplies lightning damage to the base attack." },
      { id: "elementalDamage", weight: 2, reason: "Scales the lightning portion, not any remaining physical portion of the arrow." },
      { id: "attackSpeed", weight: 2, reason: "Increases the frequency of the bow attack; resource sustain is not modeled." },
      { id: "projectileDamage", weight: 2, reason: "The native arrow and beam stat sets both carry attack and projectile flags." },
      { id: "projectileSpeed", weight: 1, reason: "General projectile speed improves arrow travel time, without assuming a speed-to-damage conversion." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The base arrow and chaining beams are attacks, not spells." },
      { id: "castSpeed", reason: "Cast speed does not speed up this bow attack; use attack speed for the base action." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L4152",
  },
  {
    id: "essence-drain",
    passiveStatScopes: ["spellProjectileSpeed", "spellHinderChance"],
    name: "Essence Drain",
    gemId: "Metadata/Items/Gems/SkillGemEssenceDrain",
    tags: ["intelligence", "grants_active_skill", "spell", "projectile", "chaos", "duration", "repeatable"],
    description: "Chaos damage-over-time debuff delivered by a spell projectile. Native spell damage scaling applies to the DoT; duration extends uptime, while projectile damage and critical chance apply only to the delivery hit.",
    suggestions: [
      { id: "chaosDamage", weight: 3, reason: "The debuff's native damage over time is chaos damage." },
      { id: "spellDamage", weight: 3, reason: "The DoT stat set explicitly enables spell_damage_modifiers_apply_to_skill_dot; this is not inferred from the Spell tag." },
      { id: "skillDuration", weight: 2, reason: "Extends the native four-second debuff and reduces refresh pressure; does not increase its damage per second." },
    ],
    exclusions: [
      { id: "projectileDamage", reason: "Projectile damage can scale the delivery hit, not the chaos debuff targeted by this preset." },
      { id: "criticalChance", reason: "The initial hit can crit, but the base debuff's damage over time cannot; this is not a ban on hit-focused builds." },
      { id: "attackDamage", reason: "Neither the native spell delivery nor its chaos debuff is attack damage." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L6511",
  },
  {
    id: "skeletal-arsonist",
    name: "Skeletal Arsonist",
    gemId: "Metadata/Items/Gems/SkillGemSkeletalArsonist",
    tags: ["intelligence", "grants_active_skill", "minion", "persistent", "fire", "detonator"],
    description: "Persistent reviving minions whose native Fire Bomb is an attack, not a spell. Prioritizes minion damage, attack speed and survival, not player damage or speed.",
    suggestions: [
      { id: "minionDamage", weight: 3, reason: "Explicit minion damage scales the Arsonists' own bomb damage; player fire or spell damage does not transfer by default." },
      { id: "minionAttackSpeed", weight: 2, reason: "Native Fire Bomb is an attack, so use minion attack speed rather than player speed or combined attack/cast scoring." },
      { id: "minionLife", weight: 1, reason: "Improves the summoned Arsonists' survival; this is not a claim that their own Life scales every bomb or a sacrificed ally's explosion." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "Player spell damage does not directly scale these minions' bomb attacks." },
      { id: "fireDamage", reason: "Generic player fire damage does not transfer to minions merely because the gem has a Fire tag." },
      { id: "attackDamage", reason: "Player attack damage does not directly scale the minions' attacks." },
      { id: "attackSpeed", reason: "Player attack speed does not speed the minions' bomb attacks; use minion attack speed." },
      { id: "castSpeed", reason: "Player cast speed does not speed the minions' bomb attacks." },
      { id: "minionCastSpeed", reason: "The native Fire Bomb is an attack, so minion cast speed does not speed that attack; command timing is outside this preset." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L18047",
  },
  {
    id: "ice-strike", name: "Ice Strike",
    gemId: "Metadata/Items/Gems/SkillGemIceStrike",
    tags: ["dexterity", "intelligence", "grants_active_skill", "attack", "area", "melee", "strike", "cold"],
    passiveStatScopes: ["attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage", "attackElementalDamage", "meleeDamage", "quarterstaffAttackDamage", "quarterstaffAttackSpeed", "quarterstaffCriticalChance", "quarterstaffAccuracy", "quarterstaffCriticalDamageBonus", "meleeStunBuildup", "quarterstaffStunBuildup", "quarterstaffFreezeBuildup", "twoHandedWeaponDamage", "twoHandedMeleeAccuracy", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    description: "Cold-focused quarterstaff melee combo with a heavier third strike. Prioritizes cold attack hits, attack speed and coverage; combo timing, Freeze and gear are not simulated.",
    suggestions: [
      { id: "attackDamage", weight: 3, reason: "Both the normal and third strikes are native attacks; this scales their weapon-based hits." },
      { id: "coldDamage", weight: 3, reason: "Both strike stat sets convert 80% of physical damage to cold. This targets the cold portion, not every possible added damage type." },
      { id: "elementalDamage", weight: 2, reason: "Scales the native cold portion, not the remaining physical portion." },
      { id: "attackSpeed", weight: 2, reason: "Speeds up the attack actions; the heavier third strike has its own speed modifier. Combo uptime and mana sustain are not calculated." },
      { id: "areaOfEffect", weight: 1, reason: "Both native strike stat sets have area flags. Area improves coverage, not damage per hit or a guaranteed extra target count." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The icy strikes are attacks, not damaging spells." },
      { id: "castSpeed", reason: "Cast speed does not speed up the melee combo." },
      { id: "projectileDamage", reason: "The reviewed native strikes are melee area attacks, not projectiles." },
      { id: "projectileSpeed", reason: "The reviewed melee combo has no projectile whose travel speed can be improved." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L13021-L13264",
  },
  {
    id: "tempest-flurry", name: "Tempest Flurry",
    gemId: "Metadata/Items/Gems/SkillGemTempestFlurry",
    tags: ["dexterity", "intelligence", "grants_active_skill", "attack", "area", "melee", "strike", "lightning"],
    passiveStatScopes: ["attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage", "attackElementalDamage", "meleeDamage", "quarterstaffAttackDamage", "quarterstaffAttackSpeed", "quarterstaffCriticalChance", "quarterstaffAccuracy", "quarterstaffCriticalDamageBonus", "meleeStunBuildup", "quarterstaffStunBuildup", "twoHandedWeaponDamage", "twoHandedMeleeAccuracy", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    description: "Lightning-focused quarterstaff combo ending in a shocking final attack. Prioritizes lightning attack hits, attack speed and coverage; combo timing and Shock magnitude are not simulated.",
    suggestions: [
      { id: "attackDamage", weight: 3, reason: "The normal, third and final strike stat sets are native melee attacks, including the lightning-themed finisher." },
      { id: "lightningDamage", weight: 3, reason: "Native strikes convert physical damage to lightning; the final strike adds further conversion. This targets lightning damage, not spell damage." },
      { id: "elementalDamage", weight: 2, reason: "Scales the lightning portion without assuming every strike deals only elemental damage." },
      { id: "attackSpeed", weight: 2, reason: "Speeds the attack actions, not an independent spell cast. Third and final strike timing and resource sustain remain outside this score." },
      { id: "areaOfEffect", weight: 1, reason: "Improves coverage of the area-enabled normal strikes. It is not a claim that every strike or the finisher gains extra damage from area." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The lightning-themed finisher is in the native attack stat sets, not a separate damaging spell." },
      { id: "castSpeed", reason: "Cast speed does not accelerate these melee attack actions." },
      { id: "projectileDamage", reason: "The reviewed strike stat sets do not have projectile damage flags." },
      { id: "projectileSpeed", reason: "The reviewed combo has no projectile-speed benefit; a lightning visual does not establish projectile mechanics." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L21381-L21690",
  },
  {
    id: "boneshatter", name: "Boneshatter",
    gemId: "Metadata/Items/Gems/SkillGemBoneshatter",
    tags: ["strength", "grants_active_skill", "attack", "area", "melee", "strike"],
    passiveStatScopes: ["attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage", "meleeDamage", "maceAttackDamage", "maceAttackSpeed", "meleeStunBuildup", "maceStunBuildup", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    description: "Physical melee strike with a conditional shockwave against enemies Primed for Stun. Prioritizes hit damage and shockwave coverage; priming, Heavy Stun timing and shockwave frequency are not simulated.",
    suggestions: [
      { id: "attackDamage", weight: 3, reason: "Both the initial strike and shockwave are native melee attacks using weapon damage." },
      { id: "physicalDamage", weight: 3, reason: "The reviewed base strike and shockwave have no native elemental conversion. This is a physical-hit focus, not a bleed or conversion build." },
      { id: "attackSpeed", weight: 1, reason: "Speeds up the strike action, but does not prime an enemy for Stun or guarantee additional shockwaves." },
      { id: "areaOfEffect", weight: 1, reason: "Improves the shockwave's coverage. Area does not remove its Primed for Stun requirement or directly increase damage per hit." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The strike and shockwave are attacks, not spells." },
      { id: "castSpeed", reason: "Cast speed does not speed up the strike action." },
      { id: "projectileDamage", reason: "The native shockwave is a melee area attack, not a projectile." },
      { id: "projectileSpeed", reason: "The reviewed strike and shockwave have no projectile-speed benefit." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L1815-L1996",
  },
  {
    id: "rolling-slam", name: "Rolling Slam",
    gemId: "Metadata/Items/Gems/SkillGemRollingSlam",
    tags: ["strength", "grants_active_skill", "attack", "area", "melee", "slam"],
    passiveStatScopes: ["attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage", "meleeDamage", "maceAttackDamage", "maceAttackSpeed", "meleeStunBuildup", "maceStunBuildup", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    description: "Two-part physical mace slam with a fixed added attack-time component. Prioritizes physical attack damage and slam coverage; attack speed does not proportionally shorten the entire sequence.",
    suggestions: [
      { id: "attackDamage", weight: 3, reason: "Both slam stat sets are native melee area attacks using weapon damage." },
      { id: "physicalDamage", weight: 3, reason: "The base slams have no native elemental conversion. This targets physical hits, without assuming added elemental damage or a conversion setup." },
      { id: "areaOfEffect", weight: 2, reason: "Improves coverage of both slam areas, not their damage per hit or a guaranteed number of enemies hit." },
      { id: "attackSpeed", weight: 1, reason: "Can improve the scalable attack-time portion, but the native extra 1000 ms is added after speed scaling in PoB. This is not proportional whole-sequence DPS scaling." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The ground slams are attacks, not spells." },
      { id: "castSpeed", reason: "Cast speed does not shorten the melee slam actions." },
      { id: "projectileDamage", reason: "The reviewed native slams are not projectiles." },
      { id: "projectileSpeed", reason: "The reviewed slams have no projectile-speed benefit." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L16108-L16406",
  },
  {
    id: "ice-shot", name: "Ice Shot",
    gemId: "Metadata/Items/Gems/SkillGemIceShot",
    tags: ["dexterity", "grants_active_skill", "attack", "projectile", "cold", "repeatable"],
    passiveStatScopes: ["attackCriticalChance", "attackCriticalDamageBonus", "attackElementalDamage", "bowAttackDamage", "bowAttackSpeed", "bowAccuracy", "bowCriticalDamageBonus", "twoHandedWeaponDamage", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    description: "Cold-focused bow attack whose arrow releases ice-shard projectiles. Prioritizes cold attack hits and projectile delivery; the shard cone is not treated as area damage, and Freeze or hit overlap are not simulated.",
    suggestions: [
      { id: "attackDamage", weight: 3, reason: "The arrow and shards are native attacks using bow damage, not spell hits." },
      { id: "coldDamage", weight: 3, reason: "The arrow converts 80% of physical damage to cold; the shards have additional conversion. This targets the cold portion without assuming a conversion build." },
      { id: "elementalDamage", weight: 2, reason: "Scales the cold portion of the attack, not any remaining physical damage." },
      { id: "projectileDamage", weight: 2, reason: "Both the arrow and secondary shards have native projectile damage flags. Their geometry does not guarantee multiple hits on one target." },
      { id: "attackSpeed", weight: 2, reason: "Speeds up the bow attack; sustainable firing, Freeze and shard overlap are not calculated." },
      { id: "projectileSpeed", weight: 1, reason: "Improves projectile travel and delivery, not an unconditional damage multiplier or extra hit count." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The icy arrow and shards are attacks, not spells." },
      { id: "castSpeed", reason: "Cast speed does not accelerate the bow attack." },
      { id: "areaOfEffect", reason: "The reviewed arrow and shards have projectile flags, not area flags. A cone-shaped shard spread does not establish area scaling." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L3699-L3900",
  },
  {
    id: "rain-of-arrows", name: "Rain of Arrows",
    gemId: "Metadata/Items/Gems/SkillGemRainOfArrows",
    tags: ["dexterity", "grants_active_skill", "attack", "area", "projectile", "sustained"],
    passiveStatScopes: ["attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage", "bowAttackDamage", "bowAttackSpeed", "bowAccuracy", "bowCriticalDamageBonus", "twoHandedWeaponDamage", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    description: "Sustained bow attack that rains physical projectile hits over an area. Prioritizes physical attack hits and coverage; rain timing, Frenzy Charge supply and overlapping hits are not calculated as DPS.",
    suggestions: [
      { id: "attackDamage", weight: 3, reason: "The native rain hits are attacks using bow damage." },
      { id: "physicalDamage", weight: 3, reason: "The base rain has no native elemental conversion. This is a physical-hit focus, not a bleed or added-elemental build." },
      { id: "projectileDamage", weight: 2, reason: "The rain's native damage flags include projectile as well as attack and area." },
      { id: "attackSpeed", weight: 1, reason: "Improves the attack action, not the rain's per-arrow timing or a guaranteed increase in sustained hits. The native rain limit is not simulated." },
      { id: "areaOfEffect", weight: 1, reason: "Changes rain and impact coverage. Wider spread can alter hit concentration, so this is not an assumed single-target damage increase." },
      { id: "projectileSpeed", weight: 1, reason: "The native skill supports projectile speed for delivery. Rain hit-rate limits, overlap and total DPS are not inferred from it." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The falling arrows are attack hits, not spells." },
      { id: "castSpeed", reason: "Cast speed does not speed the bow attack or the rain." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L6213-L6361",
  },
  {
    id: "lightning-spear", name: "Lightning Spear",
    gemId: "Metadata/Items/Gems/SkillGemLightningSpear",
    tags: ["dexterity", "grants_active_skill", "attack", "area", "projectile", "lightning", "repeatable"],
    passiveStatScopes: ["attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackElementalDamage", "spearAttackDamage", "spearAttackSpeed", "spearCriticalChance", "spearAccuracy", "spearCriticalDamageBonus", "oneHandedWeaponDamage", "oneHandedWeaponAttackSpeed", "oneHandedMeleeAttackSpeed", "oneHandedMeleeAccuracy", "oneHandedMeleeCriticalChance", "oneHandedMeleeCriticalDamageBonus", "oneHandedAttackAilmentChance", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    description: "Thrown spear attack that releases secondary lightning projectiles. Prioritizes lightning attack hits and projectile delivery; its targeting area is not area damage, and Frenzy Charge splits or Shock uptime are not simulated.",
    suggestions: [
      { id: "attackDamage", weight: 3, reason: "The main spear and lightning bolts are native attacks using spear damage, not lightning spells." },
      { id: "lightningDamage", weight: 3, reason: "The spear converts 80% of physical damage to lightning; the secondary bolts have additional conversion. This targets lightning hits without assuming permanent Frenzy Charges." },
      { id: "elementalDamage", weight: 2, reason: "Scales the lightning portion, not every possible added or remaining physical damage type." },
      { id: "projectileDamage", weight: 2, reason: "Both main and secondary hit stat sets have projectile flags. Splits and target availability are not counted as guaranteed extra damage." },
      { id: "attackSpeed", weight: 2, reason: "Speeds up the spear-throw action, without assuming charge supply or sustainable repeat attacks." },
      { id: "projectileSpeed", weight: 1, reason: "Improves projectile delivery, not Shock magnitude, guaranteed splits or a flat damage multiplier." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The lightning bolts remain projectile attacks, not spells." },
      { id: "castSpeed", reason: "Cast speed does not accelerate these spear attacks." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L4495-L4718",
  },
  {
    id: "explosive-spear", name: "Explosive Spear",
    gemId: "Metadata/Items/Gems/SkillGemExplosiveSpear",
    tags: ["dexterity", "grants_active_skill", "attack", "area", "projectile", "fire", "duration", "detonator", "repeatable"],
    passiveStatScopes: ["attackCriticalChance", "attackCriticalDamageBonus", "attackAreaOfEffect", "attackAreaDamage", "attackElementalDamage", "spearAttackDamage", "spearAttackSpeed", "spearCriticalChance", "spearAccuracy", "spearCriticalDamageBonus", "oneHandedWeaponDamage", "oneHandedWeaponAttackSpeed", "oneHandedMeleeAttackSpeed", "oneHandedMeleeAccuracy", "oneHandedMeleeCriticalChance", "oneHandedMeleeCriticalDamageBonus", "oneHandedAttackAilmentChance", "attackBlindChance", "attackMaimChance", "attackIncisionChance"],
    description: "Fire-focused thrown spear with a delayed attack explosion. Prioritizes fire attack hits and explosion coverage; detonation timing, lodged-spear limits, Frenzy Charges and Ignited Ground damage are not simulated.",
    suggestions: [
      { id: "attackDamage", weight: 3, reason: "The spear and both explosion stat sets are native attacks, not spells or generic mine damage." },
      { id: "fireDamage", weight: 3, reason: "The spear converts physical damage to fire, with further conversion on the explosions. This preset targets hits, not Ignited Ground or ignite DPS." },
      { id: "elementalDamage", weight: 2, reason: "Scales the native fire-hit portion without assuming added damage or a different conversion setup." },
      { id: "projectileDamage", weight: 2, reason: "The spear and its explosions carry native projectile damage flags. The ground effect is not scored as extra projectile damage." },
      { id: "attackSpeed", weight: 1, reason: "Speeds up throwing, not the native 2500 ms detonation delay. Lodged-spear limits and charge-based instant explosions are not modeled." },
      { id: "areaOfEffect", weight: 1, reason: "Widens explosion coverage, not damage per hit or a guaranteed number of targets." },
      { id: "projectileSpeed", weight: 1, reason: "Improves spear delivery, not the detonation timer or the number of spears that can be lodged." },
    ],
    exclusions: [
      { id: "spellDamage", reason: "The spear's explosions are attacks, despite their fire visual." },
      { id: "castSpeed", reason: "Cast speed does not speed the throw or detonation." },
      { id: "skillDuration", reason: "The native duration concerns a charge-dependent ground effect. Longer duration is not assumed to improve hit damage or shorten detonation time." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L2225-L2513",
  },
  {
    id: "arc", name: "Arc", gemId: "Metadata/Items/Gems/SkillGemArc",
    tags: ["intelligence", "grants_active_skill", "spell", "projectile", "lightning", "chaining", "repeatable"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellHinderChance"],
    description: "Lightning spell focused on chaining hits. Native hits carry projectile damage flags; chain availability and Lightning Infusion are not simulated. Projectile travel-speed benefit is not assumed.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "The native chaining hit is spell damage, not an attack." },
      { id: "lightningDamage", weight: 3, reason: "The base stat set deals lightning damage; no Infusion is assumed." },
      { id: "elementalDamage", weight: 2, reason: "Scales the base lightning hit without estimating chain count or Infusion uptime." },
      { id: "projectileDamage", weight: 2, reason: "The native hit explicitly has projectile flags and a projectile damage chain modifier; this is not inferred from the gem tag." },
      { id: "castSpeed", weight: 2, reason: "Speeds the self-cast action, not chain availability, trigger cadence or guaranteed sustainable DPS." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The reviewed chaining hits are spells, not attacks." },
      { id: "attackSpeed", reason: "Attack speed does not speed the spell's self-cast action." },
      { id: "projectileSpeed", reason: "Projectile damage flags do not establish a beneficial travel-speed modifier for this contact-targeted chain. Speed is not reviewed here." },
      { id: "areaOfEffect", reason: "The reviewed chaining hit has no area-damage component; chaining is not Area of Effect." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L8",
  },
  {
    id: "ball-lightning", name: "Ball Lightning", gemId: "Metadata/Items/Gems/SkillGemBallLightning",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "projectile", "lightning", "duration", "chaining", "sustained", "repeatable"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Lightning-hit focus on the ball's repeated bolts, not the non-hitting ball itself. Area affects coverage; projectile dwell time, fixed bolt interval, Fire Infusion, Ignited Ground and total hit count are not simulated.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "The base lightning bolts have native spell damage flags." },
      { id: "lightningDamage", weight: 3, reason: "Targets the base lightning bolts, not Fire-Infused explosion or ground damage." },
      { id: "elementalDamage", weight: 2, reason: "Scales the base lightning hits without assuming Fire Infusion." },
      { id: "projectileDamage", weight: 2, reason: "The base bolt stat set explicitly carries projectile damage flags, despite the travelling ball not hitting directly." },
      { id: "spellAreaDamage", weight: 1, reason: "The reviewed base bolt stat set explicitly has is_area_damage. This does not model Infused ground damage or total bolt hits." },
      { id: "castSpeed", weight: 1, reason: "Speeds self-cast delivery, not the native 200 ms bolt interval or projectile dwell time." },
      { id: "areaOfEffect", weight: 1, reason: "Changes the bolt coverage radius. Target dwell and repeat hits are not converted into guaranteed damage." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The lightning bolts are damaging spells, not attacks." },
      { id: "attackSpeed", reason: "Attack speed does not speed the cast or bolt interval." },
      { id: "projectileSpeed", reason: "Faster travel can reduce target dwell and bolt opportunities. Speed is not treated as a universally beneficial score or reviewed spell-speed scope here." },
      { id: "skillDuration", reason: "The reviewed duration component belongs to conditional Ignited Ground, not the base lightning-bolt interval." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L407",
  },
  {
    id: "frostbolt", name: "Frostbolt", gemId: "Metadata/Items/Gems/SkillGemFrostBolt",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "projectile", "cold", "repeatable"],
    passiveStatScopes: ["spellProjectileSpeed", "spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Cold projectile with a terrain-collision explosion. Projectile speed and lifetime affect delivery; spell area damage and area coverage concern the explosion only. Terrain contact and guaranteed extra hits are not simulated.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "Both the native projectile and collision explosion are cold spell hits." },
      { id: "coldDamage", weight: 3, reason: "Both reviewed stat sets deal base cold damage." },
      { id: "elementalDamage", weight: 2, reason: "Scales the base cold hits without assuming conversion or ground effects." },
      { id: "projectileDamage", weight: 2, reason: "Both stat sets carry native projectile damage flags." },
      { id: "castSpeed", weight: 2, reason: "Speeds self-cast delivery, not terrain collision or a guaranteed explosion count." },
      { id: "projectileSpeed", weight: 1, reason: "Improves projectile delivery, including reviewed spell-only speed. Travel distance and collision timing are not a flat DPS multiplier." },
      { id: "skillDuration", weight: 1, reason: "The projectile explicitly has a four-second skill-effect lifetime despite lacking a Duration gem tag. Longer lifetime is travel utility, not explosion damage." },
      { id: "spellAreaDamage", weight: 1, reason: "The terrain-collision explosion has is_area_damage; the travelling projectile does not. Only the explosion is reviewed for this modifier." },
      { id: "areaOfEffect", weight: 1, reason: "Widens the terrain-collision explosion, not projectile hit damage or guaranteed terrain contact." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The projectile and explosion are spells, not attacks." },
      { id: "attackSpeed", reason: "Attack speed does not accelerate the self-cast action." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L9690",
  },
  {
    id: "ice-nova", name: "Ice Nova", gemId: "Metadata/Items/Gems/SkillGemIceNova",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "cold", "duration", "nova", "repeatable"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Cold nova-hit focus. Casting from a Frostbolt changes its origin, not its damage into a projectile. Cold-Infused ground, knockback, Freeze and Infusion uptime are not simulated.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "The native nova deals cold spell-hit damage." },
      { id: "coldDamage", weight: 3, reason: "Targets the nova's native cold hits, not conditional ground utility." },
      { id: "elementalDamage", weight: 2, reason: "Scales the base cold hit without assuming an Infusion." },
      { id: "spellAreaDamage", weight: 1, reason: "The nova explicitly has is_area_damage; this does not score Chilled Ground as hit damage." },
      { id: "castSpeed", weight: 2, reason: "Speeds self-cast nova actions, not Infusion supply, triggered cadence or guaranteed Freeze." },
      { id: "areaOfEffect", weight: 1, reason: "Widens the nova's coverage, not its damage per hit or guaranteed targets." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The nova is a spell hit, not an attack." },
      { id: "attackSpeed", reason: "Attack speed does not shorten the cast." },
      { id: "projectileDamage", reason: "Originating from a Frostbolt does not add projectile damage flags to Ice Nova." },
      { id: "projectileSpeed", reason: "The nova itself is not a travelling projectile." },
      { id: "skillDuration", reason: "The duration tag includes conditional Cold-Infused ground, not increased base nova-hit damage." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L12800",
  },
  {
    id: "comet", name: "Comet", gemId: "Metadata/Items/Gems/SkillGemComet",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "cold", "repeatable"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Cold area-hit focus. Cast speed affects the scalable cast action, not fixed added cast time or fall delay. Fire-Infused damage, positioning, repeats and triggered cadence are not simulated.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "The base impact is a native cold spell hit." },
      { id: "coldDamage", weight: 3, reason: "The uninfused stat set deals cold damage; Fire Infusion is not assumed." },
      { id: "elementalDamage", weight: 2, reason: "Scales the base cold impact without presuming conditional fire damage." },
      { id: "spellAreaDamage", weight: 1, reason: "The native impact explicitly has is_area_damage." },
      { id: "castSpeed", weight: 1, reason: "Speeds only the scalable cast component, not the extra 1000 ms cast time or 550 ms fall delay. No linear total-DPS gain is assumed." },
      { id: "areaOfEffect", weight: 1, reason: "Widens impact coverage, not damage per hit or a guaranteed number of repeats." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The impact deals spell damage, not attack damage." },
      { id: "attackSpeed", reason: "Attack speed does not speed the cast or fall delay." },
      { id: "projectileDamage", reason: "The falling impact has no native projectile damage flag." },
      { id: "projectileSpeed", reason: "A falling comet is not a reviewed projectile-speed component." },
      { id: "fireDamage", reason: "Fire damage belongs to the conditional Fire-Infused stat set, not this base cold-hit focus." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L3724",
  },
  {
    id: "firestorm", name: "Firestorm", gemId: "Metadata/Items/Gems/SkillGemFirestorm",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "fire", "duration", "storm", "sustained", "repeatable"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Fire area-hit focus on a sustained storm, not projectile damage. Duration extends storm uptime; area changes hit spread. The one-storm limit, fixed bolt interval, overlap and conditional infused bolts are not simulated.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "The native falling bolts deal area spell damage, with no projectile flags." },
      { id: "fireDamage", weight: 3, reason: "Targets the base fire bolts; conditional Cold/Lightning Infusions are not assumed." },
      { id: "elementalDamage", weight: 2, reason: "Scales the base fire hits without adding hypothetical infused damage." },
      { id: "spellAreaDamage", weight: 1, reason: "The base storm explicitly has is_area_damage. Hit overlap and total bolt count are not scored." },
      { id: "castSpeed", weight: 1, reason: "Speeds storm placement, not its native 200 ms bolt interval or the one-storm limit." },
      { id: "skillDuration", weight: 1, reason: "Extends the native six-second storm for uptime; does not shorten the bolt interval or increase damage per hit." },
      { id: "areaOfEffect", weight: 1, reason: "Changes storm and impact coverage, including hit spread; larger coverage does not guarantee more hits on one target." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The falling bolts are spells, not attacks." },
      { id: "attackSpeed", reason: "Attack speed does not speed placement or the storm interval." },
      { id: "projectileDamage", reason: "The native falling-bolt stat sets have no projectile damage flags." },
      { id: "projectileSpeed", reason: "The visual falling bolts do not establish projectile-speed scaling." },
      { id: "coldDamage", reason: "Cold bolts require a conditional Infusion, outside this base fire focus." },
      { id: "lightningDamage", reason: "Lightning bolts require a conditional Infusion, outside this base fire focus." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L7876",
  },
  {
    id: "eye-of-winter", name: "Eye of Winter", gemId: "Metadata/Items/Gems/SkillGemEyeOfWinter",
    tags: ["intelligence", "grants_active_skill", "spell", "projectile", "cold"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellHinderChance"],
    description: "Cold projectile-hit focus on damaging shards, not the non-hitting Eye. The ten-second cooldown, first-hit bonus, shard trajectories and elemental ground/orb interactions are not simulated.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "The damaging shard stat set has native spell flags." },
      { id: "coldDamage", weight: 3, reason: "Targets the base cold shards without assuming a ground-surface or orb interaction." },
      { id: "elementalDamage", weight: 2, reason: "Scales the base cold shard hits, not hypothetical extra elemental damage." },
      { id: "projectileDamage", weight: 2, reason: "The damaging shards carry native projectile damage flags; the Eye itself is not counted as another hit." },
      { id: "castSpeed", weight: 1, reason: "Speeds self-cast delivery, not the native ten-second cooldown or guaranteed shard/first-hit count." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The cold shards are spell hits, not attacks." },
      { id: "attackSpeed", reason: "Attack speed does not speed the cast or cooldown." },
      { id: "projectileSpeed", reason: "Speed changes delivery and trajectories, not guaranteed shard hits. This preset does not assume that faster travel is universally better or enable spell-only speed." },
      { id: "areaOfEffect", reason: "The reviewed shard stat set has no area damage flag; a spiral visual is not area damage." },
      { id: "spellAreaDamage", reason: "The reviewed damaging shards are projectile spell hits, not spell-area damage." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L6937",
  },
  {
    id: "frost-bomb", name: "Frost Bomb", gemId: "Metadata/Items/Gems/SkillGemFrostBomb",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "cold", "duration", "orb", "remnant"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Cold detonation-hit focus, separate from non-damaging exposure pulses. The four-second detonation timer, six-second cooldown, exposure buildup/caps and Cold Infusion are not simulated.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "Scales the native cold detonation hit, not exposure magnitude or pulse frequency." },
      { id: "coldDamage", weight: 3, reason: "The damaging detonation deals cold damage; exposure is not another cold hit." },
      { id: "elementalDamage", weight: 2, reason: "Scales the base cold detonation without turning exposure pulses into damage." },
      { id: "spellAreaDamage", weight: 1, reason: "The detonation explicitly has is_area_damage; pulse exposure strength is separate." },
      { id: "castSpeed", weight: 1, reason: "Speeds orb placement, not the four-second detonation timer or six-second cooldown." },
      { id: "areaOfEffect", weight: 1, reason: "Widens coverage, not exposure magnitude, detonation damage per hit or guaranteed pulse uptime." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The detonation is a spell hit, not an attack." },
      { id: "attackSpeed", reason: "Attack speed does not speed placement, pulses or the cooldown." },
      { id: "projectileDamage", reason: "The orb and detonation do not carry projectile damage flags." },
      { id: "projectileSpeed", reason: "The placed orb is not a travelling projectile." },
      { id: "skillDuration", reason: "Duration affects the orb/debuff timing, not a guaranteed detonation-DPS gain; longer duration is not assumed to be beneficial." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L9024",
  },
  {
    id: "flameblast", name: "Flameblast", gemId: "Metadata/Items/Gems/SkillGemFlameblast",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "fire", "channelling", "stages", "nova"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Fire area-hit focus on the channel release. Cast speed affects channel responsiveness, not a guaranteed maximum-stage blast. The ten-second cooldown, minimum channel time, release animation, stages and Ignite damage are not simulated.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "The native channel-release explosion is spell damage." },
      { id: "fireDamage", weight: 3, reason: "Targets the base fire explosion, not inferred Ignite damage." },
      { id: "elementalDamage", weight: 2, reason: "Scales the base fire hit without assuming a maximum-stage release." },
      { id: "spellAreaDamage", weight: 1, reason: "The native release explicitly has is_area_damage; stage count is not multiplied into this heuristic." },
      { id: "castSpeed", weight: 1, reason: "The native channel start scales with cast speed. Minimum channel time, the 600 ms release animation, stage count and cooldown prevent a simple total-DPS claim." },
      { id: "areaOfEffect", weight: 1, reason: "Widens release coverage without assuming ten stages or more damage per hit." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The release is a spell explosion, not an attack." },
      { id: "attackSpeed", reason: "Attack speed does not accelerate the spell channel." },
      { id: "projectileDamage", reason: "The release has no projectile damage flag." },
      { id: "projectileSpeed", reason: "The release is not a travelling projectile." },
      { id: "skillDuration", reason: "Channelled stages and release timing are not treated as ordinary skill-effect duration." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L8460",
  },
  {
    id: "frost-wall", name: "Frost Wall", gemId: "Metadata/Items/Gems/SkillGemFrostWall",
    tags: ["intelligence", "grants_active_skill", "spell", "area", "cold", "duration"],
    passiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus", "spellAreaOfEffect", "spellAreaDamage", "spellHinderChance"],
    description: "Cold spell focus on crystal explosions. Area widens explosions; cast speed improves placement only. Crystal destruction, wall Life, early-destruction penalties, cooldown and Lightning Infusion are not simulated.",
    suggestions: [
      { id: "spellDamage", weight: 3, reason: "The native crystal explosions deal spell-hit damage; wall Life is a separate mechanic." },
      { id: "coldDamage", weight: 3, reason: "Targets the base cold explosions without assuming the Lightning-Infused stat set." },
      { id: "elementalDamage", weight: 2, reason: "Scales the cold hit portion, not hypothetical infused lightning damage." },
      { id: "spellAreaDamage", weight: 1, reason: "The crystal explosions explicitly have is_area_damage. Destruction requirements and early-destruction penalties remain unmodeled." },
      { id: "castSpeed", weight: 1, reason: "Speeds wall placement, not the five-second cooldown, crystal destruction or explosion frequency." },
      { id: "areaOfEffect", weight: 1, reason: "Widens crystal-explosion coverage; wall length, crystal count and overlap are not converted into guaranteed damage." },
    ],
    exclusions: [
      { id: "attackDamage", reason: "The crystal explosions are spells, not attacks." },
      { id: "attackSpeed", reason: "Attack speed does not speed placement or the cooldown." },
      { id: "projectileDamage", reason: "The wall's native explosions have no projectile damage flag." },
      { id: "projectileSpeed", reason: "The placed crystals are not travelling projectiles." },
      { id: "skillDuration", reason: "Longer wall lifetime may serve barrier utility, but is not an assumed hit-damage or detonation-frequency benefit in this focus." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L9460",
  },
  ...chaosPhysicalSkillPreferencePresets,
  ...minionSkillPreferencePresets,
  ...markSkillPreferencePresets,
  ...warcrySkillPreferencePresets,
  ...attackSkillPreferencePresets,
  ...remainingAttackSkillPreferencePresets,
  ...ballistaSkillPreferencePresets,
  mortarCannonSkillPreferencePreset,
  ...fireLightningSkillPreferencePresets,
  ...maceSkillPreferencePresets,
  ...quarterstaffSkillPreferencePresets,
  ...bowPrimarySkillPreferencePresets,
  ...spearPrimarySkillPreferencePresets,
  ...monkPrimarySkillPreferencePresets,
  ...maceShieldSkillPreferencePresets,
  ...attackClosureSkillPreferencePresets,
  ...spellUtilitySkillPreferencePresets,
  ...proxySkillPreferencePresets,
  ...defensiveBuffSkillPreferencePresets,
  ...persistentOffenceSkillPreferencePresets,
  ...resourceChargeSkillPreferencePresets,
  ...utilityTriggerSkillPreferencePresets,
  ...plantSkillPreferencePresets,
  ...plantBowSkillPreferencePresets,
  ...poisonBowSkillPreferencePresets,
];

export function getSkillPreferencePreset(id: unknown): SkillPreferencePreset | undefined {
  return typeof id === "string" ? skillPreferencePresets.find((preset) => preset.id === id) : undefined;
}

export function resolveSkillPreferencePreset(context: { focusSkillId?: string; socketedGrenadeId?: string; socketedProxySkillId?: string }): SkillPreferencePreset | undefined {
  if (context.focusSkillId === "mortar-cannon") return mortarCannonPreset(context.socketedGrenadeId);
  const base = getSkillPreferencePreset(context.focusSkillId);
  return base && isSocketedProxyFocus(base.id) ? socketedProxyPreset(base,getSkillPreferencePreset(normalizeSocketedProxySkillId(base.id,context.socketedProxySkillId))) : base;
}

export function addSkillPresetPreferences(
  settings: PassiveOptimizationSettings,
  preset: SkillPreferencePreset,
): PassiveOptimizationSettings {
  const preferences = settings.preferences.map((preference) => ({ ...preference }));
  const existing = new Set(preferences.map((preference) => preference.id));
  const resolved = preset.id === "mortar-cannon" || isSocketedProxyFocus(preset.id)
    ? resolveSkillPreferencePreset({ ...settings, focusSkillId: preset.id })! : preset;
  for (const { id, weight } of refineSkillPreferencePreset(resolved, settings.supportGemIds).suggestions) {
    if (existing.has(id)) continue;
    preferences.push({ id, weight });
    existing.add(id);
  }
  return { ...settings, preferences, focusSkillId: preset.id };
}

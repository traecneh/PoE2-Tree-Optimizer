import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

type MaceReview = {
  id: string; name: string; effectId: string; tags: readonly string[]; line: number;
  description: string; timing: string; speed: "action" | "startup" | "fixed";
  durationReason: string; twoHandOnly?: boolean; fire?: boolean;
};

// Explicit component reviews, not automatic support/scoring approval from gem tags.
const reviews: readonly MaceReview[] = [
  { id: "earthquake",name: "Earthquake",effectId: "EarthquakePlayer",line: 4060,
    tags: ["area","attack","duration","grants_active_skill","melee","slam","strength"],speed: "action",
    description: "Physical impact focus. The delayed Aftershock, Jagged Ground limits, enemy slowing and repeated contacts are separate; no Aftershock frequency or total DPS is assumed.",
    timing: "Attack speed changes the attack action, not the four-second Jagged Ground delay or Aftershock frequency.",
    durationReason: "The ground duration delays the Aftershock; longer is not automatically better damage or uptime." },
  { id: "earthshatter",name: "Earthshatter",effectId: "EarthshatterPlayer",line: 4284,
    tags: ["area","attack","duration","grants_active_skill","melee","slam","strength"],speed: "action",
    description: "Physical fissure/Slam focus. Spike explosions require a nearby Warcry. Spike count, six-second lifetime, explosion overlap and Warcry supply are not converted into DPS.",
    timing: "Attack speed changes deployment, not spike lifetime, supplied Warcries or explosion frequency.",
    durationReason: "Spike lifetime is not damage per second or guaranteed Warcry-triggered explosions." },
  { id: "sunder",name: "Sunder",effectId: "SunderPlayer",line: 18622,
    tags: ["area","attack","duration","grants_active_skill","melee","payoff","slam","strength"],speed: "action",
    description: "Physical melee wave focus, not the separately flagged shockwave. Fully Broken Armour, Sundered Armour and secondary contacts are conditional. This skill cannot Break Armour itself.",
    timing: "Attack speed changes the wave's use, not a guaranteed cascade count or Fully Broken Armour setup.",
    durationReason: "The duration is Sundered Armour's conditional window, not wave hit damage or guaranteed uptime." },
  { id: "supercharged-slam",name: "Supercharged Slam",effectId: "SuperchargedSlamPlayer",line: 18827,
    tags: ["area","attack","channelling","grants_active_skill","melee","slam","stages","strength"],speed: "fixed",twoHandOnly: true,
    description: "Physical impact focus with fixed attack timing. Channel stages, release timing and Aftershock count are separate; maximum stages, repeated hits and total DPS are not assumed.",
    timing: "Its attack time cannot be modified; Attack Speed is not credited as faster charging, release or Aftershocks. Native channel-start fields do not prove whole-cycle acceleration.",
    durationReason: "Minimum channel time, stages and Aftershock delays are not ordinary Skill Effect Duration." },
  { id: "stampede",name: "Stampede",effectId: "StampedePlayer",line: 18349,
    tags: ["area","attack","duration","grants_active_skill","melee","slam","strength","travel"],speed: "startup",
    description: "Physical final-Slam focus. Movement Speed governs the charge after startup. Footsteps, ground explosions, overlap and charge distance are not assumed to multiply damage.",
    timing: "Attack Speed concerns startup, not the Movement-Speed-governed charge. Movement Speed is travel utility, not more hit damage or guaranteed contacts.",
    durationReason: "Jagged Ground lifetime is not charge speed or guaranteed ground-explosion damage." },
  { id: "leap-slam",name: "Leap Slam",effectId: "LeapSlamPlayer",line: 8161,
    tags: ["area","attack","grants_active_skill","melee","payoff","slam","strength","travel"],speed: "startup",
    description: "Physical landing-hit focus. Fixed and distance-dependent added attack time remain separate. Fully Broken Armour consumption, bonus Stun Buildup and repeated landings are not assumed.",
    timing: "Attack Speed affects only the scalable action, not the fixed 650 ms or distance-dependent added travel time.",
    durationReason: "Added attack/travel time is not Skill Effect Duration." },
  { id: "hammer-of-the-gods",name: "Hammer of the Gods",effectId: "HammerOfTheGodsPlayer",line: 7127,
    tags: ["area","attack","conditional","duration","grants_active_skill","melee","slam","strength"],speed: "startup",
    description: "Conditional Physical hammer-hit focus. Use requires Glory from Heavy Stuns. The falling delay, Glory supply and enemy availability are not modeled as a repeatable DPS cycle.",
    timing: "Attack Speed concerns using the skill, not its falling delay, Glory generation or repeated availability.",
    durationReason: "The 2.5-second duration is the falling delay, not extra damage or a beneficial lifetime." },
  { id: "volcanic-fissure",name: "Volcanic Fissure",effectId: "VolcanicFissurePlayer",line: 20040,
    tags: ["area","attack","duration","fire","grants_active_skill","melee","slam","strength","sustained"],speed: "action",fire: true,
    description: "Player fissure-hit focus with 80% native Physical-to-Fire conversion. Other Slams trigger separate Aftershocks. Branching, twelve-second persistence, overlap, Ignite and trigger frequency are not assumed.",
    timing: "Attack Speed changes fissure deployment, not travel contacts or Aftershocks triggered by another Slam.",
    durationReason: "Fissure persistence can matter, but extra contacts, triggers and total damage are not modeled by this hit focus." },
];

export const reviewedMacePrimarySkillIds = reviews.map(r => r.id);
const hitScopes: readonly SkillPassiveStatScope[] = ["attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackAreaDamage",
  "attackBlindChance","attackMaimChance","attackIncisionChance","meleeDamage","meleeStunBuildup","maceAttackDamage","maceAttackSpeed","maceStunBuildup"];

export const maceSkillPreferencePresets: readonly SkillPreferencePreset[] = reviews.map(r => ({
  id: r.id,name: r.name,gemId: `Metadata/Items/Gems/SkillGem${r.effectId.slice(0,-6)}`,tags: r.tags,
  passiveStatScopes: [...hitScopes,...(r.twoHandOnly ? ["twoHandedWeaponDamage","twoHandedMeleeAccuracy"] as const : []),...(r.fire ? ["attackElementalDamage"] as const : [])],
  description: r.description,
  suggestions: [
    { id: "attackDamage",weight: 3,reason: "Reviewed player melee/area attack hits, including Mace Damage, counted once per modifier. No minion, totem or secondary-contact transfer." },
    { id: "physicalDamage",weight: r.fire ? 2 : 3,reason: r.fire ? "Physical weapon source can scale the converted Fire portion; conversion is not applied again as a score multiplier." : "The reviewed base Mace supplies Physical hit damage; gear-added elements and ailments are not inferred." },
    ...(r.fire ? [{ id: "fireDamage" as const,weight: 3,reason: "Targets the native Fire-converted portion, not automatic Ignite or pure Fire conversion." },
      { id: "elementalDamage" as const,weight: 2,reason: "Benefits the Fire portion, including reviewed Elemental Damage with Attacks, not the unconverted Physical remainder." }] : []),
    { id: "attackAreaDamage",weight: 1,reason: "The selected component explicitly deals area damage. Coverage, repeats and overlapping secondary components are separate." },
    { id: "areaOfEffect",weight: 1,reason: "Widens hit coverage, not damage per hit, guaranteed targets or extra contacts." },
    ...(r.speed !== "fixed" ? [{ id: "attackSpeed" as const,weight: r.speed === "action" ? 2 : 1,reason: r.timing }] : []),
    ...(r.id === "stampede" ? [{ id: "movementSpeed" as const,weight: 1,reason: r.timing }] : []),
  ],
  exclusions: [
    { id: "spellDamage",reason: "These are player weapon attacks, not spells or minion/totem damage." },
    { id: "castSpeed",reason: "Cast Speed does not accelerate the reviewed attack." },
    { id: "projectileDamage",reason: "The reviewed melee/ground/landing component is not a damaging projectile." },
    { id: "skillDuration",reason: r.durationReason },
    { id: "damageOverTime",reason: "This preset targets hits, not an assumed damaging ailment or intrinsic damage-over-time build." },
    ...(r.speed === "fixed" ? [{ id: "attackSpeed" as const,reason: r.timing }] : []),
    ...(["sunder","leap-slam"].includes(r.id) ? [{ id: "armourBreakAmount" as const,reason: "This skill cannot Break Armour itself. An externally supplied Fully Broken Armour state is not assumed." }] : []),
    ...(r.id === "hammer-of-the-gods" ? [{ id: "cooldownRecoveryRate" as const,reason: "The reviewed version requires Glory, not a use cooldown. Cooldown recovery does not supply Glory or Heavy Stuns." },
      { id: "accuracy" as const,reason: "The native hammer hit always hits. Accuracy does not supply Glory or increase this component's hit damage." }] : []),
  ],
  sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L${r.line}`,
}));

export function maceSkillSupportOverrides(kind: "area" | "cost" | "speed" | "concentrated" | "brutality", amount: number, tierIII = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(reviews.map(r => {
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage; 30% higher Mana cost. Coverage does not guarantee contacts or secondary explosions. `
      : kind === "cost" ? `${amount}% less supported-skill cost, not Mana regeneration or cooldown/Glory recovery. Channel cost and fixed delays are separate; no sustained use is assumed. `
      : kind === "speed" ? `${amount}% increased Attack Speed. ${r.timing} Legal support does not prove a timing benefit for every component. `
      : kind === "concentrated" ? "30% more Area Damage and 50% less area, not radius. Applies to the reviewed area hit; no overlap, target count or repeated damage is assumed. High area priority is opt-in coverage, not a DPS multiplier. "
      : `${amount}% more Physical Damage, with 20% higher Mana cost; no Elemental or Chaos damage. No Bleeding chance or extra contacts are supplied. ${tierIII ? "Hits have a 20% chance to ignore Physical Damage Reduction, not an ailment bypass or unconditional penetration. " : ""}${r.fire ? "Blocks Volcanic Fissure's converted Fire damage; only the unconverted Physical portion remains. This is not a recommendation for its Fire focus. " : "Gear-added Elemental/Chaos damage and Poison would be prevented; external skills are separate. "}`;
    return [r.id,{ summary: summary + "Delays, stages, secondary triggers and Glory are not supplied. Existing manual weights are retained; support magnitudes are not multiplied into route scores." }];
  }));
}

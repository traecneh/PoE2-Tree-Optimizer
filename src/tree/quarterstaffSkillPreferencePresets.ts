import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

type QuarterstaffReview = {
  id: string; name: string; gem: string; line: number; tags: readonly string[];
  description: string; timing: string; element?: "cold" | "lightning"; nonMelee?: boolean; fixedTime?: number;
};

// Selected native components are reviewed explicitly; gem tags do not grant scoring scopes.
const reviews: readonly QuarterstaffReview[] = [
  { id: "falling-thunder", name: "Falling Thunder", gem: "FallingThunder", line: 7078,
    tags: ["area","attack","dexterity","grants_active_skill","intelligence","lightning","melee","projectile","slam"], element: "lightning",
    description: "Melee Slam focus with 60% Physical-to-Lightning conversion. The separate, fully Lightning projectiles require consumed Power Charges; their count, charge bonuses and repeated contacts are not assumed.",
    timing: "Attack Speed changes the Slam action, not Power Charge supply or guaranteed projectile contacts." },
  { id: "glacial-cascade", name: "Glacial Cascade", gem: "GlacialCascade", line: 10920,
    tags: ["area","attack","cold","dexterity","grants_active_skill","intelligence","melee","payoff"], element: "cold", nonMelee: true,
    description: "Wave-hit focus with 80% Physical-to-Cold conversion. Wave and final burst are not Melee Damage despite the Melee tag; neither can Freeze. Final-burst Freeze consumption and Ice Crystal explosions need external setup. No extra contacts or uptime are assumed.",
    timing: "Attack Speed changes the attack action, not guaranteed burst overlap, supplied Freeze or Ice Crystal explosions." },
  { id: "storm-wave", name: "Storm Wave", gem: "StormWave", line: 20976,
    tags: ["area","attack","dexterity","grants_active_skill","intelligence","lightning","melee"], element: "lightning",
    description: "Melee area-hit focus with 80% Physical-to-Lightning conversion. The ground fissure is not a projectile. Extra Shock chance is not guaranteed Shock magnitude, uptime or repeated contacts.",
    timing: "Attack Speed changes wave use, not guaranteed hits along the fissure or Shock uptime." },
  { id: "flicker-strike", name: "Flicker Strike", gem: "FlickerStrike", line: 8613,
    tags: ["area","attack","dexterity","grants_active_skill","intelligence","melee","strike"],
    description: "Physical teleporting Strike focus. Additional Strikes consume Power Charges; Power Charges cannot be gained during this skill. Charge supply, nearby targets and a sustained Strike count are not assumed.",
    timing: "Attack Speed changes Strike timing, not Power Charge supply or a guaranteed number of teleporting Strikes." },
  { id: "gathering-storm", name: "Gathering Storm", gem: "GatheringStorm", line: 10437,
    tags: ["area","attack","channelling","dexterity","duration","grants_active_skill","intelligence","lightning","melee","travel"], element: "lightning", fixedTime: 800,
    description: "Normal Dash focus with 20% Physical-to-Lightning conversion. Perfect Dash, enemy shockwaves and Tempest Bell explosions are separate components, not unconditional damage. Perfect Timing, Bell supply and Shocked Ground uptime are not assumed.",
    timing: "Attack Speed affects scalable timing, not the fixed 800 ms, Perfect Timing success, supplied Bells or guaranteed shockwaves." },
  { id: "siphoning-strike", name: "Siphoning Strike", gem: "SiphoningStrike", line: 17854,
    tags: ["area","attack","dexterity","grants_active_skill","intelligence","lightning","melee","payoff","strike"],
    description: "Physical Dash-hit focus. Consuming externally supplied Shock releases a separate fully Lightning, non-melee shockwave and grants a Power Charge. This skill cannot Shock; shockwave frequency and charge sustain are not assumed.",
    timing: "Attack Speed changes the Dash action, not external Shock supply or guaranteed shockwave and Power Charge generation." },
  { id: "vaulting-impact", name: "Vaulting Impact", gem: "VaultingImpact", line: 22180,
    tags: ["area","attack","dexterity","duration","grants_active_skill","intelligence","melee","payoff","physical","slam","travel"], fixedTime: 1000,
    description: "Physical landing-hit focus. Broken Stance requires an already Dazed enemy; this skill cannot Daze. The conditional hit-limited debuff, travel and repeat landings are not converted into always-active damage.",
    timing: "Attack Speed affects scalable timing, not the fixed 1000 ms, supplied Daze or guaranteed Broken Stance uptime." },
  { id: "whirling-assault", name: "Whirling Assault", gem: "WhirlingAssault", line: 22868,
    tags: ["area","attack","dexterity","grants_active_skill","intelligence","melee","strike"], fixedTime: 1000,
    description: "Physical spinning Strike focus. Successive contacts, movement distance and enemy availability are not assumed to multiply per-hit damage or yield a full-DPS estimate.",
    timing: "Attack Speed affects scalable timing, not the fixed 1000 ms or a guaranteed number of spinning contacts." },
  { id: "wind-blast", name: "Wind Blast", gem: "WindBlast", line: 23001,
    tags: ["area","attack","dexterity","grants_active_skill","intelligence","melee","wind"],
    description: "Physical melee-area gust focus, not a projectile or spell. Daze and Knockback depend on hit application and distance; enemy proximity and debuff uptime are not assumed.",
    timing: "Attack Speed changes attack use, not enemy proximity, repeated contacts or guaranteed Daze uptime." },
];

export const reviewedQuarterstaffPrimarySkillIds = reviews.map(r => r.id);
const hitScopes: readonly SkillPassiveStatScope[] = ["attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackAreaDamage",
  "attackBlindChance","attackMaimChance","attackIncisionChance","quarterstaffAttackDamage","quarterstaffAttackSpeed",
  "quarterstaffCriticalChance","quarterstaffAccuracy","quarterstaffCriticalDamageBonus","quarterstaffStunBuildup","twoHandedWeaponDamage","twoHandedMeleeAccuracy"];

export const quarterstaffSkillPreferencePresets: readonly SkillPreferencePreset[] = reviews.map(r => ({
  id: r.id, name: r.name, gemId: `Metadata/Items/Gems/SkillGem${r.gem}`, tags: r.tags, description: r.description,
  passiveStatScopes: [...hitScopes,...(!r.nonMelee ? ["meleeDamage","meleeStunBuildup"] as const : []),...(r.element ? ["attackElementalDamage"] as const : [])],
  suggestions: [
    { id: "attackDamage", weight: 3, reason: "Reviewed player Quarterstaff attack hit. Weapon, area and melee scopes apply only where explicitly reviewed; no minion or totem transfer." },
    { id: "physicalDamage", weight: r.element ? 2 : 3, reason: r.element ? "Physical Damage modifiers benefit only the remaining Physical portion, not the converted Elemental damage. This priority is a heuristic, not the conversion percentage or a DPS multiplier." : "Benefits the selected Physical hit, not an assumed damaging ailment or secondary-component uptime." },
    ...(r.element ? [{ id: (r.element === "cold" ? "coldDamage" : "lightningDamage") as "coldDamage" | "lightningDamage", weight: 3, reason: "Benefits the selected hit's native converted portion, not automatic ailments or secondary-component uptime." },
      { id: "elementalDamage" as const, weight: 2, reason: "Benefits the converted Elemental portion, including reviewed attack-specific wording, not the remaining Physical damage." }] : []),
    { id: "attackAreaDamage", weight: 1, reason: "The selected component explicitly deals area damage; coverage, extra contacts and secondary components stay separate." },
    { id: "areaOfEffect", weight: 1, reason: "Widens coverage, not hit damage, guaranteed overlaps or enemy count." },
    { id: "attackSpeed", weight: r.fixedTime || ["flicker-strike","siphoning-strike"].includes(r.id) ? 1 : 2, reason: r.timing },
  ],
  exclusions: [
    { id: "spellDamage", reason: "These are player Quarterstaff attack hits, not spells or proxy damage." },
    { id: "castSpeed", reason: "Cast Speed does not accelerate the reviewed attack." },
    { id: "projectileDamage", reason: r.id === "falling-thunder" ? "This focus scores the melee Slam, not the separate Power-Charge-dependent projectiles." : "The selected component is not a damaging projectile." },
    { id: "projectileSpeed", reason: r.id === "falling-thunder" ? "Projectile delivery only concerns the charge-dependent secondary component, not this melee focus." : "Ground waves, gusts and teleporting Strikes are not projectile travel." },
    { id: "skillDuration", reason: "Channel/release timing, charge supply and conditional debuff or ground lifetimes are not automatically beneficial hit damage or sustained uptime." },
    { id: "damageOverTime", reason: "This focus scores hits, not an assumed ailment or damage-over-time build." },
    ...(r.id === "glacial-cascade" ? [{ id: "freezeBuildup" as const, reason: "Both native components cannot Freeze; the final burst consumes externally supplied Freeze instead." }] : []),
    ...(r.id === "siphoning-strike" ? [{ id: "shockChance" as const, reason: "This skill cannot Shock. Its shockwave needs externally supplied Shock." },
      { id: "lightningDamage" as const, reason: "The selected Dash has no native conversion; the separate Lightning shockwave requires external Shock." }] : []),
    ...(r.id === "vaulting-impact" ? [{ id: "dazeChance" as const, reason: "This skill cannot Daze; Broken Stance needs an externally Dazed enemy." }] : []),
  ],
  sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L${r.line}`,
}));

export function quarterstaffSkillSupportOverrides(kind: "area" | "cost" | "speed" | "concentrated" | "brutality", amount: number, tierIII = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(reviews.map(r => {
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage; 30% higher Mana cost. Coverage does not guarantee extra contacts. `
      : kind === "cost" ? `${amount}% less supported-skill cost, not Mana regeneration, charge supply or sustained use. Gathering Storm's channel cost is separate from a per-use cost. `
      : kind === "speed" ? `${amount}% increased Attack Speed. ${r.timing} `
      : kind === "concentrated" ? "30% more Area Damage and 50% less area, not radius, for the reviewed area hit. High area priority is opt-in coverage, not a score multiplier or guaranteed overlap. "
      : `${amount}% more Physical Damage, with 20% higher Mana cost; no Elemental or Chaos damage. ${tierIII ? "Hits have a 20% chance to ignore Physical Damage Reduction, not unconditional penetration or ailment bypass. " : ""}${r.element ? "Blocks the selected hit's converted Elemental damage; only its unconverted Physical portion remains. " : "Gear-added Elemental/Chaos damage is blocked. "}${["falling-thunder","siphoning-strike"].includes(r.id) ? "The fully Lightning secondary component deals no damage; it is not replaced with Physical damage. " : ""}`;
    return [r.id,{ summary: summary + "Charge supply, Perfect Timing, debuff uptime and repeated contacts are not assumed. Manual priorities are retained; support magnitudes are not multiplied into route scores.",
      ...(kind === "concentrated" ? { priorities: [{ id: "areaOfEffect" as const, weight: 2, reason: "Concentrated Area halves the reviewed hit's area. High priority favors coverage, not damage, guaranteed contacts or a calculated restoration of the lost area." }] } : {}) }];
  }));
}

export function fallingThunderProjectileSupportOverride(tierII = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return { "falling-thunder": { summary: `40% more projectile speed with 20% higher Mana cost, only for the secondary projectiles requiring Power Charges. ${tierII ? "The added 40% Pierce chance is redundant: these projectiles already always Pierce. " : ""}Does not speed the melee Slam, grant charges or guarantee extra hits. This remains a melee-hit focus with unchanged priorities and route scores.` } };
}

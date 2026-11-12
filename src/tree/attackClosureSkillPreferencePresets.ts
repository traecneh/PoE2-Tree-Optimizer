import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

type AttackReview = {
  id: string; name: string; gem: string; line: number; file?: "act_str";
  tags: readonly string[]; description: string; timing: string;
  spear?: boolean; bow?: boolean; melee?: boolean; noStun?: boolean; alwaysHits?: boolean;
  projectile?: boolean; element?: "coldDamage" | "lightningDamage" | "fireDamage";
  fullyConverted?: boolean; duration?: string; triggered?: boolean;
};

// Each focus selects one player-owned component, not every effect sharing the gem's tags.
const reviews: readonly AttackReview[] = [
  { id: "cull-the-weak", name: "Cull The Weak", gem: "CullTheWeak", line: 999, spear: true, melee: true, alwaysHits: true,
    tags: ["area","attack","dexterity","grants_active_skill","melee","strike"],
    description: "Always-hitting Physical Spear strike. Culling depends on enemy rarity and remaining Life; Frenzy Charges require actual kills. Neither repeated kills nor charge uptime is assumed.",
    timing: "Attack Speed changes strike use, not cull eligibility, kills, Frenzy generation or dash availability." },
  { id: "elemental-sundering", name: "Elemental Sundering", gem: "ElementalSundering", line: 1653, spear: true, element: "coldDamage", fullyConverted: true,
    tags: ["area","attack","cold","dexterity","fire","grants_active_skill","lightning","melee","nova","payoff"],
    description: "Cold-explosion focus, fully Cold-converted and not Melee Damage. The initial pulse is non-damaging; Fire and Lightning explosions are separate. Requires externally supplied Freeze to consume. Explosion counts, unique-enemy bonuses and ailment uptime are not assumed.",
    timing: "Attack Speed changes use timing, not Freeze supply or explosion count. The selected explosion cannot Freeze, Shock or Ignite." },
  { id: "escape-shot", name: "Escape Shot", gem: "EscapeShot", line: 1965, bow: true, projectile: true, element: "coldDamage",
    tags: ["area","attack","cold","dexterity","grants_active_skill","projectile","trigger"],
    description: "Bow arrow-impact focus with 80% Cold conversion. Ground-targeted delivery and separate Ice Fragments are not extra assumed hits. Projectile count cannot be modified; Freeze, fragments and repeated escape uptime remain separate.",
    timing: "Attack Speed changes the scalable action, not the fixed added 700 ms, guaranteed Freeze or extra Ice Fragment contacts." },
  { id: "fangs-of-frost", name: "Fangs of Frost", gem: "FangsOfFrost", line: 2515, spear: true, melee: true, element: "coldDamage",
    tags: ["area","attack","cold","dexterity","grants_active_skill","melee","strike"],
    description: "Initial Spear stab focus with 80% Cold conversion. Consuming Parried creates a separate fully Cold explosion and chilled ground. Parried supply, ground duration and secondary-hit uptime are not assumed.",
    timing: "Attack Speed accelerates the stab, not Parried supply or the separate eight-second chilled-ground lifetime." },
  { id: "oil-barrage", name: "Oil Barrage", gem: "OilBarrage", line: 14376, file: "act_str", projectile: true,
    tags: ["area","attack","channelling","grants_active_skill","intelligence","projectile","shapeshift","strength","sustained","wyvern"],
    description: "Unempowered Wyvern Physical projectile-hit focus, not a spell or Mace attack. Oil-ground Ignite storage and Power-Charge-empowered Lightning are separate. No oil debuff, Ignite, charge supply, projectile overlap or channel sustain is assumed.",
    timing: "Attack Speed changes channel attacks, not guaranteed projectile overlap or Power Charge supply. Startup, ending, upfront Mana and ongoing Mana cost are separate; native ongoing cost did not rise in the speed control." },
  { id: "thunderous-leap", name: "Thunderous Leap", gem: "ThunderousLeap", line: 9001, spear: true, melee: true, element: "lightningDamage",
    tags: ["area","attack","detonator","dexterity","grants_active_skill","lightning","melee","slam","travel"],
    description: "Spear melee-area impact focus with 70% Lightning conversion. Fixed added attack time and teleport delay remain separate. Detonator events, repeated contacts and Shock uptime are not assumed.",
    timing: "Attack Speed changes the scalable action, not the fixed added 1100 ms, separate teleport delay or guaranteed Detonator events." },
  { id: "trail-of-caltrops", name: "Trail of Caltrops", gem: "TrailOfCaltrops", line: 9784, triggered: true, projectile: true,
    tags: ["area","attack","buff","dexterity","duration","grants_active_skill","hazard","persistent","physical","projectile","trigger"],
    description: "Triggered Caltrops hit focus, not activating the persistent 30-Spirit buff. Dodge supply and enemy contact govern attacks, not Attack Speed. PoB area/weapon handling disagrees with source intent; uncertain area-damage and weapon-specific bonuses are not automatically suggested.",
    timing: "No attack or cast time: dodge supply and enemy contact govern activation, not Attack Speed or Cast Speed.",
    duration: "Extends the eight-second hazard lifetime, not hits per second, enemy contacts, the active-hazard limit or Poison duration." },
  { id: "twister", name: "Twister", gem: "Twister", line: 10033, spear: true, projectile: true,
    tags: ["area","attack","dexterity","duration","grants_active_skill","projectile","repeatable","wind"],
    description: "Unempowered Physical Spear projectile-area hit focus, not Melee Damage. Whirlwind stages and ground-supplied Elemental damage are conditional. Native Blind and always-Piercing delivery do not guarantee contacts, repeated hits or debuff uptime.",
    timing: "Attack Speed changes deployment, not the fixed 660 ms hit interval, Whirlwind stages or ground empowerment.",
    duration: "Extends the three-second Twister lifetime, not its fixed hit interval or guaranteed repeated enemy contact." },
  { id: "wind-serpents-fury", name: "Wind Serpent's Fury", gem: "WindSerpentsFury", line: 11255, spear: true, melee: true,
    tags: ["area","attack","conditional","dexterity","grants_active_skill","melee","sustained","wind"],
    description: "Physical Spear thrust focus requiring and consuming Frenzy Charges. Separate serpents are player-owned melee-area attacks, not minions or projectiles. Charge count, repeated availability and serpent contacts are not assumed.",
    timing: "Attack Speed changes the thrust, not the required Frenzy Charge supply, serpent contacts or sustained availability." },
  { id: "wing-blast", name: "Wing Blast", gem: "WingBlast", line: 21113, file: "act_str", melee: true, noStun: true,
    tags: ["area","attack","grants_active_skill","intelligence","melee","shapeshift","strength","wind","wyvern"],
    description: "Initial Wyvern Physical melee-area hit focus, not a weapon-specific attack. Initial damage supplies no Stun Buildup; forced Heavy Stun needs a Primed enemy. The stronger shockwave, unique-enemy bonus and Power Charge generation remain conditional.",
    timing: "Attack Speed changes the scalable action, not the fixed added 300 ms, externally Primed enemies or guaranteed shockwave and Power Charge uptime." },
  { id: "devour", name: "Devour", gem: "WyvernDevour", line: 3685, file: "act_str", melee: true,
    tags: ["area","attack","grants_active_skill","intelligence","melee","shapeshift","slam","strength","wyvern"],
    description: "Conditional Wyvern Physical landing-hit focus requiring a corpse or Cullable enemy. Nearby use does not leap or Slam. Corpse consumption, Life restoration and Power Charges are separate from damage, regeneration and guaranteed sustain.",
    timing: "Attack Speed changes scalable use timing; target distance and added travel time remain separate. Nearby corpse consumption does not guarantee a landing hit." },
  { id: "flame-breath", name: "Flame Breath", gem: "WyvernFlameBreath", line: 5557, file: "act_str", element: "fireDamage", fullyConverted: true,
    tags: ["area","attack","channelling","detonator","duration","fire","grants_active_skill","intelligence","shapeshift","strength","sustained","wyvern"],
    description: "Unempowered Wyvern area-attack hit focus, fully Fire-converted; not melee, projectile or spell damage. Channel minimum, cooldown, Rage spending, compounding Ignites and Power-Charge-empowered Lightning are separate. No Rage sustain, empowered state or Ignite uptime is assumed.",
    timing: "Attack Speed changes channel attacks, not the three-second minimum channel, four-second Rage grace period, ten-second cooldown or Rage supply.",
    duration: "Legal Duration compatibility does not establish a beneficial base skill-effect timer in the frozen native calculation. It does not extend the minimum channel or Rage grace period." },
];

export const reviewedAttackClosureIds = reviews.map(r => r.id);
export const reviewedAttackClosureSpeedIds = reviews.filter(r => !r.triggered).map(r => r.id);
export const reviewedAttackClosureProjectileIds = reviews.filter(r => r.projectile).map(r => r.id);
export const reviewedAttackClosureDurationIds = reviews.filter(r => r.duration).map(r => r.id);
const hitScopes: readonly SkillPassiveStatScope[] = ["attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackBlindChance","attackMaimChance","attackIncisionChance"];

export const attackClosureSkillPreferencePresets: readonly SkillPreferencePreset[] = reviews.map(r => ({
  id: r.id, name: r.name, gemId: `Metadata/Items/Gems/SkillGem${r.gem}`, tags: r.tags, description: r.description,
  passiveStatScopes: [...hitScopes,...(!r.triggered ? ["attackAreaDamage"] as const : []),
    ...(r.melee ? ["meleeDamage"] as const : []),...(r.melee && !r.noStun ? ["meleeStunBuildup"] as const : []),
    ...(r.element ? ["attackElementalDamage"] as const : []),
    ...(r.spear ? ["spearAttackDamage","spearAttackSpeed","spearCriticalChance","spearCriticalDamageBonus","oneHandedWeaponDamage","oneHandedWeaponAttackSpeed","oneHandedMeleeAttackSpeed","oneHandedMeleeCriticalChance","oneHandedMeleeCriticalDamageBonus","oneHandedAttackAilmentChance"] as const : []),
    ...(r.spear && !r.alwaysHits ? ["spearAccuracy","oneHandedMeleeAccuracy"] as const : []),
    ...(r.bow ? ["bowAttackDamage","bowAttackSpeed","bowAccuracy","bowCriticalDamageBonus","twoHandedWeaponDamage"] as const : [])],
  suggestions: [
    { id: "attackDamage", weight: 3, reason: "Benefits the selected player-owned attack hit, not spells, minions, totems or assumed secondary contacts." },
    ...(!r.fullyConverted ? [{ id: "physicalDamage" as const, weight: r.element ? 2 : 3, reason: "Benefits remaining Physical hit damage, not converted Elemental damage or an assumed Poison/Bleeding source." }] : []),
    ...(r.element ? [{ id: r.element, weight: 3, reason: "Benefits the selected component's native conversion, not all elements on the gem's tags or guaranteed ailments." },
      { id: "elementalDamage" as const, weight: 2, reason: "Benefits the selected Elemental attack portion once; does not supply empowerment, ailments or extra contacts." }] : []),
    ...(r.projectile ? [{ id: "projectileDamage" as const, weight: 2, reason: "The selected player hit is a projectile. Delivery and repeated contacts are not extra assumed damage." }] : []),
    ...(!r.triggered ? [{ id: "attackAreaDamage" as const, weight: 1, reason: "The selected native hit has explicit area-damage scaling, not merely an Area tag." }] : []),
    { id: "areaOfEffect", weight: 1, reason: "Coverage utility, not a damage multiplier, guaranteed overlap or additional targets and triggers." },
    ...(!r.triggered ? [{ id: "attackSpeed" as const, weight: 1, reason: r.timing }] : []),
    ...(r.projectile ? [{ id: "projectileSpeed" as const, weight: 1, reason: "Delivery utility, not deployment frequency, hazard lifetime, Twister hit interval or guaranteed contacts." }] : []),
  ],
  exclusions: [
    { id: "spellDamage", reason: "The selected component is a player attack, not spell, minion or totem damage." },
    { id: "castSpeed", reason: "Cast Speed does not accelerate these player attacks or dodge-triggered hazards." },
    { id: "damageOverTime", reason: "The focus selects hits, not assumed Ignite, Poison, Bleeding or oil-ground damage." },
    { id: "skillDuration", reason: r.duration || "Secondary ground timers, channel timing and travel do not establish a beneficial duration for this selected hit." },
    ...(!r.projectile ? [{ id: "projectileDamage" as const, reason: "The selected component is not projectile damage, even if a separate component or visual resembles one." },
      { id: "projectileSpeed" as const, reason: "Travel, charge supply and channel timing are not selected-projectile delivery." }] : []),
    ...(r.fullyConverted ? [{ id: "physicalDamage" as const, reason: "The selected hit is fully Elemental-converted. Physical Damage does not scale the converted portion." }] : []),
    ...(r.alwaysHits ? [{ id: "accuracy" as const, reason: "Cull The Weak always hits. Accuracy does not improve the hit or supply kills and charges." }] : []),
    ...(r.noStun ? [{ id: "stunBuildup" as const, reason: "The selected initial Wing Blast has 100% less hit-based Stun Buildup. Forced Heavy Stun requires an externally Primed target." }] : []),
    ...(r.id === "elemental-sundering" ? (["freezeBuildup","shockChance","igniteMagnitude"] as const).map(id => ({ id, reason: "Elemental Sundering explosions cannot Freeze, Shock or Ignite. The required consumed ailments must be supplied externally." })) : []),
    ...(r.id === "twister" ? [{ id: "blindChance" as const, reason: "The native Twister already has 100% Blind chance; extra chance supplies neither contact nor uptime." }] : []),
    ...(r.triggered ? [{ id: "attackSpeed" as const, reason: r.timing },
      ...(["areaDamage","attackAreaDamage"] as const).map(id => ({ id, reason: "Source describes an area hit, but native area-damage controls have no effect. Uncertain scaling is not automatically suggested." })),
      { id: "maimChance" as const, reason: "Caltrops already Maim on hit; extra chance does not supply dodge triggers or enemy contact." }] : []),
  ],
  sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/${r.file || "act_dex"}.lua#L${r.line}`,
}));

export function attackClosureSupportOverrides(kind: "area" | "cost" | "speed" | "concentrated" | "brutality" | "projectile" | "duration", amount: number, tierFlag = false, baseExclusions: SkillPreferencePreset["exclusions"] = []): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(reviews.filter(r => kind !== "speed" || !r.triggered).filter(r => kind !== "projectile" || r.projectile).filter(r => kind !== "duration" || r.duration).map(r => {
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage; 30% higher Mana cost where a Mana cost exists. No extra contacts or triggers are assumed. `
      : kind === "cost" ? `${amount}% less supported-skill cost, not Mana regeneration or sustain. ${r.triggered ? "The triggered Caltrops hit costs zero Mana; the persistent parent still reserves 30 Spirit. This support does not reduce that reservation. " : "Upfront, ongoing and non-Mana costs remain separate. "}`
      : kind === "speed" ? `${amount}% increased Attack Speed. ${r.timing} `
      : kind === "duration" ? `${amount}% more skill-effect duration; 20% higher Mana cost where a Mana cost exists. ${r.duration} `
      : kind === "projectile" ? `40% more projectile speed; 20% higher Mana cost where a Mana cost exists. Delivery is not trigger cadence, repeated hits or damage. ${tierFlag ? "40% added Pierce chance supplies no assumed extra contacts and is redundant for always-Piercing delivery. " : ""}`
      : kind === "concentrated" ? `30% more Area Damage and 50% less area, not radius. ${r.triggered ? "Native Caltrops hit damage is unchanged despite legal support compatibility; reduced coverage is not a proven damage upgrade. " : "Benefits the selected area hit, not assumed overlap, secondary effects or repeated contacts. "}`
      : `${amount}% more Physical Damage; 20% higher Mana cost where a Mana cost exists; no Elemental or Chaos damage. ${r.fullyConverted ? "This fully Elemental-converted focus deals no damage; conversion is not reversed and the focus does not switch components. " : r.element ? "Converted Elemental damage is lost; only remaining Physical damage survives. " : "Added Elemental/Chaos damage and conditional Elemental empowerment are blocked. "}${tierFlag ? "Hits have 20% chance to ignore Physical Damage Reduction, not unconditional penetration or DoT mitigation bypass. " : ""}`;
    return [r.id,{ summary: summary + "Manual priorities stay unchanged; support magnitudes are not route-score or Full DPS multipliers. Conditional resources, enemy debuffs and secondary uptime are not supplied.",
      ...(kind === "concentrated" ? { priorities: r.triggered ? [] : [{ id: "areaOfEffect" as const, weight: 2, reason: "Concentrated Area halves selected-hit coverage. High priority is opt-in utility, not restored radius or extra damage." }] } : {}),
      ...(kind === "brutality" && r.fullyConverted ? { exclusions: [...baseExclusions,...(["attackDamage","attackAreaDamage"] as const).map(id => ({ id,
        reason: "Brutality prevents all damage of the selected fully Elemental-converted hit. Manual weights remain for explicit review; the focus does not change." }))] } : {}),
    }];
  }));
}

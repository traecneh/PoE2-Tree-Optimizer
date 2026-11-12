import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

type SpearReview = {
  id: string; name: string; gem: string; line: number; tags: readonly string[];
  description: string; timing: string; areaDamage: boolean; melee?: boolean; projectile?: boolean;
  projectileSupport?: boolean; element?: "cold" | "lightning" | "fire"; fullyConverted?: boolean; alwaysHits?: boolean;
};

// Review the selected native component and explicit Spear weapon restriction, not tags alone.
const reviews: readonly SpearReview[] = [
  { id: "spearfield", name: "Spearfield", gem: "Spearfield", line: 7936, areaDamage: true,
    tags: ["area","attack","dexterity","duration","grants_active_skill","hazard","melee","sustained"],
    description: "Physical hazard-explosion focus, not the non-damaging stab. The explosion is not Melee Damage despite the gem tag. Enemy contact, early-detonation penalties, hazard limits, lifetime and Maim uptime are not assumed.",
    timing: "Attack Speed changes deployment, not enemy contact, the early-detonation penalty window or explosion frequency." },
  { id: "storm-lance", name: "Storm Lance", gem: "StormLance", line: 8280, areaDamage: false, projectile: true, projectileSupport: true, element: "lightning", fullyConverted: true,
    tags: ["area","attack","dexterity","duration","grants_active_skill","lightning","projectile","repeatable","sustained"],
    description: "Fully Lightning lodged-bolt focus, not the initial thrown spear. Native Area Damage does not scale these bolts. Frenzy consumption changes frequency and lifetime; external Detonators, bolt counts, Shocked Ground and repeated contacts are not assumed.",
    timing: "Attack Speed changes throwing, not the lodged bolts' separate 800 ms base interval, Frenzy supply or Detonation rate." },
  { id: "whirling-slash", name: "Whirling Slash", gem: "WhirlingSlash", line: 10529, areaDamage: true, melee: true,
    tags: ["area","attack","dexterity","grants_active_skill","melee","stages","strike","wind"],
    description: "Physical circular-slash focus, not the separate Whirlwind collapse. Stages, leaving the storm, elemental-ground empowerment, Knockback, Slow and Blind uptime are not assumed to multiply hit damage.",
    timing: "Attack Speed changes slash use, not collapse triggers, maximum stages or elemental-ground supply." },
  { id: "spear-of-solaris", name: "Spear of Solaris", gem: "SpearOfSolaris", line: 7653, areaDamage: true, projectile: true, projectileSupport: true, element: "fire", alwaysHits: true,
    tags: ["area","attack","conditional","dexterity","fire","grants_active_skill","projectile","sustained"],
    description: "Always-hitting impact focus with 75% Physical-to-Fire conversion. Use requires maximum Glory from elemental ailments. Fixed added timing, later pulses, Ignited Ground and Glory supply are separate; no repeated use or guaranteed ailment uptime is assumed.",
    timing: "Attack Speed affects scalable use timing, not the fixed 1400 ms, Glory generation, pulse interval or ground expansion." },
  { id: "blood-hunt", name: "Blood Hunt", gem: "BloodHunt", line: 302, areaDamage: true, melee: true,
    tags: ["area","attack","dexterity","grants_active_skill","melee","payoff","physical","strike"],
    description: "Physical Dash-hit focus. Blood Loss and externally supplied Bleeding enable a separate explosion and Bleeding consumption. This skill cannot cause Bleeding. Fixed added timing, Blood Loss supply and explosion frequency are not assumed.",
    timing: "Attack Speed affects scalable use timing, not the fixed 150 ms, external Bleeding or Blood Loss supply." },
  { id: "glacial-lance", name: "Glacial Lance", gem: "GlacialLance", line: 3142, areaDamage: false, projectile: true, projectileSupport: true, element: "cold",
    tags: ["area","attack","cold","dexterity","duration","grants_active_skill","projectile","repeatable"],
    description: "Piercing spear-hit focus with 80% Physical-to-Cold conversion, not the separate fragment explosion. Frenzy Charges enable delayed shrapnel. Fragment chilling, lifetime, explosion overlap and Freeze uptime are not assumed; projectile count cannot be modified.",
    timing: "Attack Speed changes throwing, not fragment lifetime, the separate explosion delay or Frenzy Charge supply." },
  { id: "primal-strikes", name: "Primal Strikes", gem: "PrimalStrikes", line: 5931, areaDamage: true, melee: true, element: "lightning",
    tags: ["area","attack","dexterity","grants_active_skill","lightning","melee","payoff","strike"],
    description: "Normal melee-strike focus with 40% Physical-to-Lightning conversion. Cannot Shock itself. Final-strike Exposure and player-owned attack spirits need combo/target setup, not Minion Damage. External Shock, spirit count and sustained Exposure are not assumed.",
    timing: "Attack Speed changes the reviewed strikes, not guaranteed combo completion, external Shock or spirit/Exposure uptime." },
  { id: "rapid-assault", name: "Rapid Assault", gem: "RapidAssault", line: 6502, areaDamage: true, melee: true,
    tags: ["area","attack","dexterity","duration","grants_active_skill","melee","physical","strike"],
    description: "Normal Physical stab-hit focus. The sixth/final stab separately inflicts Bleeding and attaches a spearhead; external Detonators trigger non-melee explosions. Combo completion, attachment limits, Bleeding sustain and explosion contacts are not assumed.",
    timing: "Attack Speed changes the stab sequence, not guaranteed completion, attached-spear lifetime or externally triggered explosions." },
  { id: "disengage", name: "Disengage", gem: "Disengage", line: 1307, areaDamage: true, melee: true,
    tags: ["area","attack","dexterity","grants_active_skill","melee","strike","travel"],
    description: "Physical initial-strike focus. Consuming external Parried enables a separate shockwave and Frenzy gain. The 1.5-second base cooldown, fixed added timing and jumping protection remain separate; no Parried supply or defensive uptime is assumed.",
    timing: "Attack Speed affects scalable action timing, not the fixed 200 ms or base cooldown. Native repeat-use rate remains cooldown-capped without recovery investment." },
  { id: "whirlwind-lance", name: "Whirlwind Lance", gem: "WhirlwindLance", line: 10745, areaDamage: true, melee: true, projectileSupport: true,
    tags: ["area","attack","dexterity","duration","grants_active_skill","projectile","repeatable","wind"],
    description: "Physical melee-area Whirlwind-collapse focus, not the thrown projectile or a DoT. Entering the storm triggers collapse. Frenzy stages, elemental-ground empowerment, lifetime, Slow and Blind uptime are not assumed.",
    timing: "Attack Speed changes deployment, not entering the Whirlwind, collapse frequency, extra Frenzy stages or elemental-ground supply." },
];

export const reviewedSpearPrimarySkillIds = reviews.map(r => r.id);
export const reviewedProjectileSpearPrimarySkillIds = reviews.filter(r => r.projectileSupport).map(r => r.id);
const hitScopes: readonly SkillPassiveStatScope[] = ["attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect",
  "spearAttackDamage","spearAttackSpeed","spearCriticalChance","spearCriticalDamageBonus",
  "oneHandedWeaponDamage","oneHandedWeaponAttackSpeed","oneHandedMeleeAttackSpeed","oneHandedMeleeCriticalChance","oneHandedMeleeCriticalDamageBonus",
  "oneHandedAttackAilmentChance","attackBlindChance","attackMaimChance","attackIncisionChance"];

export const spearPrimarySkillPreferencePresets: readonly SkillPreferencePreset[] = reviews.map(r => ({
  id: r.id, name: r.name, gemId: `Metadata/Items/Gems/SkillGem${r.gem}`, tags: r.tags, description: r.description,
  passiveStatScopes: [...hitScopes,...(!r.alwaysHits ? ["spearAccuracy","oneHandedMeleeAccuracy"] as const : []),
    ...(r.melee ? ["meleeDamage","meleeStunBuildup"] as const : []),...(r.areaDamage ? ["attackAreaDamage"] as const : []),
    ...(r.element ? ["attackElementalDamage"] as const : [])],
  suggestions: [
    { id: "attackDamage", weight: 3, reason: "Reviewed player Spear attack component. Spear, one-handed weapon and eligible melee modifiers join once, without Minion/Totem or secondary-component transfer." },
    ...(!r.fullyConverted ? [{ id: "physicalDamage" as const, weight: r.element ? 2 : 3, reason: r.element ? "Benefits only the remaining Physical damage, not converted Elemental damage. This is a heuristic priority, not a calculated damage share." : "Benefits the selected Physical hit, not automatically supplied Bleeding, Poison or repeated explosions." }] : []),
    ...(r.element ? [{ id: ({ cold: "coldDamage", lightning: "lightningDamage", fire: "fireDamage" } as const)[r.element], weight: 3, reason: "Benefits the selected component's native converted portion, not automatic ailment uptime or conditional secondary damage." },
      { id: "elementalDamage" as const, weight: 2, reason: "Benefits the Elemental portion, including reviewed attack wording, not a second application to remaining Physical damage." }] : []),
    ...(r.projectile ? [{ id: "projectileDamage" as const, weight: 2, reason: "The selected native component explicitly has projectile damage flags. No extra targets, Pierce contacts, bolt frequency or pulse count are assumed." }] : []),
    ...(r.areaDamage ? [{ id: "attackAreaDamage" as const, weight: 1, reason: "The selected native attack component deals area damage. Targeting radii, secondary components and overlap stay separate." }] : []),
    { id: "areaOfEffect", weight: 1, reason: r.areaDamage ? "Widens reviewed coverage, including attack-skill area wording, not damage per hit or guaranteed contacts." : "Targets lodged-spear or fragment coverage utility, not projectile damage, bolt rate or a guaranteed explosion." },
    { id: "attackSpeed", weight: 1, reason: r.timing },
    ...(r.projectile ? [{ id: "projectileSpeed" as const, weight: 1, reason: "Projectile delivery utility, not lodged-bolt intervals, post-landing timers, Glory/charge supply or extra contacts." }] : []),
  ],
  exclusions: [
    { id: "spellDamage", reason: "These are player Spear attack components, not spells, minions or totem damage." },
    { id: "castSpeed", reason: "Cast Speed does not accelerate Spear attacks." },
    { id: "damageOverTime", reason: "This focus targets a hit, not assumed Bleeding, Ignited Ground or another damaging ailment." },
    { id: "skillDuration", reason: "Hazard/fragment/storm/attachment lifetime is not damage per second or guaranteed contact and trigger uptime." },
    ...(!r.projectile ? [{ id: "projectileDamage" as const, reason: "The selected component is not a damaging projectile; gem tags and a separate thrown spear do not transfer projectile modifiers." },
      { id: "projectileSpeed" as const, reason: "Thrown-spear delivery is separate from the selected melee/hazard component and collapse/trigger timing." }] : []),
    ...(!r.areaDamage ? [{ id: "attackAreaDamage" as const, reason: "Native Area Damage does not scale this selected bolt/spear hit; coverage and separate explosions are not area-hit scaling." },
      { id: "areaDamage" as const, reason: "The selected component lacks native area-damage scaling; coverage is a separate utility." }] : []),
    ...(r.fullyConverted ? [{ id: "physicalDamage" as const, reason: "The selected lodged bolt is fully Lightning. Physical Damage modifiers do not scale the converted Lightning portion." }] : []),
    ...(r.alwaysHits ? [{ id: "accuracy" as const, reason: "The selected Solaris impact always hits. Accuracy does not improve it or supply Glory." },
      { id: "cooldownRecoveryRate" as const, reason: "Solaris requires Glory, not a use cooldown. Cooldown recovery does not supply Glory or ailments." }] : []),
    ...(r.id === "blood-hunt" ? [{ id: "bleedingChance" as const, reason: "Blood Hunt cannot cause Bleeding. Its Blood Loss/consumption condition needs an external source." }] : []),
    ...(r.id === "primal-strikes" ? [{ id: "shockChance" as const, reason: "Primal Strikes cannot Shock itself. Its spirit and final-strike mechanics require externally supplied Shock." }] : []),
    ...(r.id === "spearfield" ? [{ id: "maimChance" as const, reason: "Eligible native explosions already Maim; extra chance does not supply enemy contact or guarantee Maim uptime." }] : []),
  ],
  sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L${r.line}`,
}));

export function spearPrimarySupportOverrides(kind: "area" | "cost" | "speed" | "concentrated" | "brutality" | "projectile", amount: number, tierFlag = false, baseExclusions: SkillPreferencePreset["exclusions"] = []): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(reviews.filter(r => kind !== "projectile" || r.projectileSupport).map(r => {
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage; 30% higher Mana cost. Coverage does not supply enemy contact, extra hazards, bolts or collapse triggers. `
      : kind === "cost" ? `${amount}% less supported-skill cost, not Mana regeneration, Glory, charges, cooldown recovery or sustained use. `
      : kind === "speed" ? `${amount}% increased Attack Speed. ${r.timing} `
      : kind === "concentrated" ? `30% more Area Damage and 50% less area, not radius. ${r.areaDamage ? "Benefits the reviewed area hit, not guaranteed overlap or conditional hit counts. " : "Native selected-hit damage is unchanged; narrower coverage is not a bolt/spear damage upgrade. "}`
      : kind === "projectile" ? `40% more projectile speed with 20% higher Mana cost. ${r.projectile ? "Changes delivery, not post-landing timers, bolt intervals, Glory or charge supply. " : "Only concerns the initial thrown spear; it does not improve the selected melee Whirlwind collapse. "}${tierFlag ? "The added 40% Pierce chance is redundant for native always-Piercing spears and supplies no assumed extra contacts or Glory. " : ""}`
      : `${amount}% more Physical Damage; 20% higher Mana cost; no Elemental or Chaos damage. ${r.fullyConverted ? "The fully Lightning lodged-bolt focus deals no damage; conversion is not reversed and the focus does not switch to the initial spear. " : r.element ? "Converted Elemental damage is lost; only the remaining Physical portion survives. " : "Gear-added Elemental/Chaos damage and ground-empowered Elemental gains are blocked. "}${tierFlag ? "Hits have a 20% chance to ignore Physical Damage Reduction, not unconditional penetration or a DoT bypass. " : ""}`;
    return [r.id,{ summary: summary + "Required Glory, charges, enemy debuffs, combo completion and trigger uptime are not supplied. Manual priorities stay unchanged; support magnitudes are not route-score or Full DPS multipliers.",
      ...(kind === "concentrated" ? { priorities: r.areaDamage ? [{ id: "areaOfEffect" as const, weight: 2, reason: "Concentrated Area halves reviewed coverage. High priority is opt-in coverage, not damage, restored radius or guaranteed overlap." }] : [] } : {}),
      ...(kind === "brutality" && r.fullyConverted ? { exclusions: [...baseExclusions,...(["attackDamage","projectileDamage"] as const).map(id => ({ id,
        reason: "Brutality prevents all damage of this fully Lightning lodged-bolt focus. The focus is not changed; manual weights are retained for explicit review." }))] } : {}),
    }];
  }));
}

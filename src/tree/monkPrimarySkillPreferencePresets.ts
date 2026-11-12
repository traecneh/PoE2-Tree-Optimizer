import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

type MonkReview = {
  id: string; name: string; gem: string; line: number; tags: readonly string[];
  description: string; timing: string; duration?: string; element?: "cold" | "chaos";
  nonMelee?: boolean; fullyConverted?: boolean; alwaysHits?: boolean;
};

// Native Quarterstaff restrictions and selected damage flags take precedence over Palm names or gem tags.
const reviews: readonly MonkReview[] = [
  { id: "frozen-locus", name: "Frozen Locus", gem: "FrozenLocus", line: 9903, element: "cold", nonMelee: true, fullyConverted: true,
    tags: ["area","attack","cold","dexterity","duration","grants_active_skill","intelligence","melee"],
    description: "Fully Cold, non-melee crystal-explosion focus, not crystal placement. This player-owned Quarterstaff attack is not a spell or minion. Crystal destruction, lifetime, limits and Freeze uptime are not assumed.",
    timing: "Attack Speed changes placement, not crystal destruction, explosion frequency or Freeze uptime.",
    duration: "Extends the ten-second crystal lifetime, not crystal Life, damage per explosion or guaranteed destruction. Longer lifetime is utility, not an assumed damage gain." },
  { id: "killing-palm", name: "Killing Palm", gem: "KillingPalm", line: 13819, alwaysHits: true,
    tags: ["area","attack","dexterity","grants_active_skill","intelligence","melee","physical","strike"],
    description: "Always-hitting Physical melee-strike focus using Quarterstaff damage, not an assumed unarmed source. Culling thresholds depend on enemy rarity; kills, extra dashes and Power Charges are not guaranteed damage or sustain.",
    timing: "Attack Speed changes Strike timing, not Cull eligibility, kills, additional targets or Power Charge supply." },
  { id: "shattering-palm", name: "Shattering Palm", gem: "ShatteringPalm", line: 17347, element: "cold", alwaysHits: true,
    tags: ["area","attack","cold","dexterity","grants_active_skill","intelligence","melee","strike","trigger"],
    description: "Always-hitting melee Strike with 60% Physical-to-Cold conversion. Its separately triggered, fully Cold non-melee explosion requires enough damage to coated enemies. Threshold completion and explosion contacts are not assumed or added to the initial hit.",
    timing: "Attack Speed changes initial Strike use, not the shard damage threshold, triggered-explosion frequency or extra contacts." },
  { id: "staggering-palm", name: "Staggering Palm", gem: "StaggeringPalm", line: 20726, alwaysHits: true,
    tags: ["area","attack","buff","dexterity","duration","grants_active_skill","intelligence","melee","physical","projectile","strike","wind"],
    description: "Always-hitting Physical melee Strike. Instant Heavy Stun requires Primed for Stun. The resulting buff lets other Quarterstaff attacks fire separate projectiles, not this Strike. Buff uptime and extra contacts are not assumed.",
    timing: "Attack Speed changes Strike timing, not Primed for Stun, Heavy Stun success or projectiles from other attacks.",
    duration: "Extends the 7.5-second base projectile buff after a qualifying Heavy Stun. The separate 30-second extension cap, buff acquisition and other attacks' projectile contacts are not assumed." },
  { id: "hand-of-chayula", name: "Hand of Chayula", gem: "HandOfChayula", line: 11365, element: "chaos", alwaysHits: true,
    tags: ["area","attack","chaos","dexterity","grants_active_skill","intelligence","melee","meta","strike"],
    description: "Always-hitting melee Strike with 73% Physical-to-Chaos conversion. Socketed Marks and Curses are separate utility effects, not inherited Strike damage. No socketed utility skill, enemy-debuff uptime or unarmed damage source is assumed.",
    timing: "Attack Speed affects scalable Strike timing, not the fixed 350 ms or the separate socketed Marks and Curses. Cast Speed does not accelerate the attack." },
  { id: "wave-of-frost", name: "Wave of Frost", gem: "WaveOfFrost", line: 22737, element: "cold",
    tags: ["area","attack","cold","dexterity","grants_active_skill","intelligence","melee"],
    description: "Melee-area wave focus with 80% Physical-to-Cold conversion, not a projectile or spell. Instant Freeze requires Primed for Freeze. Freeze buildup, Chill and backward movement do not prove frozen-enemy uptime or extra hits.",
    timing: "Attack Speed changes wave use, not Primed for Freeze, guaranteed Freeze or defensive movement uptime." },
  { id: "tempest-bell", name: "Tempest Bell", gem: "TempestBell", line: 21105,
    tags: ["area","attack","conditional","dexterity","duration","grants_active_skill","intelligence","melee","sustained"],
    description: "Player-owned Physical melee-area shockwave focus, not a minion or totem. Combo, placement impact and other skills hitting the Bell remain separate. The 300 ms shockwave limit, conditional Elemental empowerment and repeated contacts are not guaranteed uptime.",
    timing: "Attack Speed changes placement, not Combo supply, other skills' Bell hits or the separate 300 ms shockwave limit. The placement cooldown is not guaranteed shockwave frequency.",
    duration: "Extends the six-second Bell lifetime, not the ten-hit durability limit, 300 ms shockwave limit or Combo supply. Extra triggers, ailment empowerment and Bell uptime are not assumed." },
];

export const reviewedMonkPrimarySkillIds = reviews.map(r => r.id);
export const reviewedDurationMonkPrimarySkillIds = reviews.filter(r => r.duration).map(r => r.id);
const hitScopes: readonly SkillPassiveStatScope[] = ["attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackAreaDamage",
  "attackBlindChance","attackMaimChance","attackIncisionChance","quarterstaffAttackDamage","quarterstaffAttackSpeed",
  "quarterstaffCriticalChance","quarterstaffCriticalDamageBonus","quarterstaffStunBuildup","twoHandedWeaponDamage"];

export const monkPrimarySkillPreferencePresets: readonly SkillPreferencePreset[] = reviews.map(r => ({
  id: r.id, name: r.name, gemId: `Metadata/Items/Gems/SkillGem${r.gem}`, tags: r.tags, description: r.description,
  passiveStatScopes: [...hitScopes,...(!r.alwaysHits ? ["quarterstaffAccuracy","twoHandedMeleeAccuracy"] as const : []),
    ...(!r.nonMelee ? ["meleeDamage","meleeStunBuildup"] as const : []),
    ...(r.element === "cold" ? ["attackElementalDamage","quarterstaffFreezeBuildup"] as const : [])],
  suggestions: [
    { id: "attackDamage", weight: 3, reason: "Reviewed player-owned Quarterstaff attack component. Weapon, melee and area modifiers join only within their explicit scopes; no Minion/Totem or other-skill transfer." },
    ...(!r.fullyConverted ? [{ id: "physicalDamage" as const, weight: r.element ? 2 : 3, reason: r.element ? "Only the remaining Physical portion benefits, not converted Cold or Chaos. This priority is a heuristic, not a calculated damage share." : "Benefits the selected Physical hit, not guaranteed Cull, Heavy Stun, Bell empowerment or secondary hits." }] : []),
    ...(r.element ? [{ id: r.element === "cold" ? "coldDamage" as const : "chaosDamage" as const, weight: 3, reason: "Benefits the selected hit's native converted portion, not automatic ailments or triggered utility effects." }] : []),
    ...(r.element === "cold" ? [{ id: "elementalDamage" as const, weight: 2, reason: "Benefits native Cold damage, including reviewed attack-specific wording, not remaining Physical damage or a second conversion bonus." }] : []),
    { id: "attackAreaDamage", weight: 1, reason: "The selected native component deals area damage. Coverage, object durability and secondary-trigger counts stay separate." },
    { id: "areaOfEffect", weight: 1, reason: "Widens reviewed coverage, not damage per hit or guaranteed contacts." },
    { id: "attackSpeed", weight: 1, reason: r.timing },
  ],
  exclusions: [
    { id: "spellDamage", reason: "The selected component is a player attack, not a spell, minion or totem. Socketed utility skills are separate." },
    { id: "castSpeed", reason: "Cast Speed does not accelerate the selected Quarterstaff attack." },
    { id: "damageOverTime", reason: "This focus targets hits, not an assumed damaging ailment or DoT." },
    { id: "projectileDamage", reason: r.id === "staggering-palm" ? "The selected Palm Strike is melee; its conditional buff's separate projectiles come from other attacks." : "The selected component is not projectile damage; waves, shard explosions and Bell shockwaves are not projectiles." },
    { id: "projectileSpeed", reason: "Does not accelerate the selected hit, destruction threshold or Bell shockwave interval. Separate projectiles are not this focus." },
    { id: "skillDuration", reason: r.duration || "This selected hit has no reviewed persistent timer. Shard damage thresholds and socketed utility skills are separate." },
    ...(r.alwaysHits ? [{ id: "accuracy" as const, reason: "The selected Palm Strike always hits. Accuracy does not improve it; separate secondary components are not this focus." }] : []),
    ...(r.fullyConverted ? [{ id: "physicalDamage" as const, reason: "The selected crystal explosion is fully Cold. Physical Damage modifiers do not scale the converted Cold portion." }] : []),
    ...(r.id === "tempest-bell" ? (["fireDamage","coldDamage","lightningDamage","elementalDamage"] as const).map(id => ({ id, reason: "Elemental gain needs the corresponding ailment on the Bell. This Physical shockwave focus does not assume that external setup or its uptime." })) : []),
  ],
  sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L${r.line}`,
}));

export function monkPrimarySupportOverrides(kind: "area" | "cost" | "speed" | "concentrated" | "brutality" | "duration", amount: number, tierIII = false, baseExclusions: SkillPreferencePreset["exclusions"] = []): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(reviews.filter(r => kind !== "duration" || r.duration).map(r => {
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage; 30% higher Mana cost. Coverage does not supply extra contacts or triggers. `
      : kind === "cost" ? `${amount}% less supported-skill cost, not Mana regeneration, Combo, kills, charges or sustained use. Socketed utility skills and other skills hitting the Bell have separate costs. `
      : kind === "speed" ? `${amount}% increased Attack Speed. ${r.timing} Cost per use stays unchanged; faster use can increase Mana demand. `
      : kind === "duration" ? `${amount}% more skill-effect duration; 20% higher Mana cost. ${r.duration} `
      : kind === "concentrated" ? "30% more Area Damage and 50% less area, not radius, for the selected area hit. Narrower coverage does not guarantee contacts or trigger frequency. "
      : `${amount}% more Physical Damage; 20% higher Mana cost; no Elemental or Chaos damage. ${r.fullyConverted ? "The fully Cold crystal explosion deals no damage; conversion is not reversed and placement is not substituted as a damage focus. " : r.element ? "The converted Cold/Chaos portion is lost; only remaining Physical damage survives. " : "Added Elemental/Chaos damage and the Bell's conditional Elemental empowerment are blocked. "}${r.id === "shattering-palm" ? "The fully Cold secondary explosion also deals no damage. " : ""}${tierIII ? "Hits have a 20% chance to ignore Physical Damage Reduction, not unconditional penetration or a DoT bypass. " : ""}`;
    return [r.id,{ summary: summary + "Manual priorities are retained; support magnitudes are not route-score or Full DPS multipliers. Conditional setup and secondary-component uptime are not supplied.",
      ...(kind === "concentrated" ? { priorities: [{ id: "areaOfEffect" as const, weight: 2, reason: "Concentrated Area halves coverage. High priority is opt-in utility, not restored radius, extra triggers or a damage multiplier." }] } : {}),
      ...(kind === "brutality" && r.fullyConverted ? { exclusions: [...baseExclusions,...(["attackDamage","attackAreaDamage"] as const).map(id => ({ id,
        reason: "Brutality prevents all damage of the fully Cold crystal-explosion focus. Manual weights stay for explicit review; no focus switch occurs." }))] } : {}),
    }];
  }));
}

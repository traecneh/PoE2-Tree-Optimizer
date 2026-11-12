import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

type MaceShieldReview = {
  id: string; name: string; gem: string; line: number; tags: readonly string[];
  description: string; timing: string; duration?: string; mace?: boolean; shield?: boolean;
  melee?: boolean; fire?: boolean; fullyConverted?: boolean; projectile?: boolean; breaksArmour?: boolean;
};

// Weapon, shield and shapeshift sources remain separate even when their components share hit scopes.
const reviews: readonly MaceShieldReview[] = [
  { id: "armour-breaker", name: "Armour Breaker", gem: "ArmourBreaker", line: 796, mace: true, melee: true, breaksArmour: true,
    tags: ["area","attack","grants_active_skill","melee","physical","strength","strike"],
    description: "Physical Mace melee-strike focus with on-hit Armour Break and Knockback. Breaking Armour is separate from damage, Fully Broken Armour uptime or a guaranteed follow-up payoff. Dual-wield bonuses and enemy displacement are not assumed.",
    timing: "Attack Speed changes Strike use, not guaranteed Armour Break uptime, dual-wield bonuses or follow-up damage." },
  { id: "perfect-strike", name: "Perfect Strike", gem: "PerfectStrike", line: 15009, mace: true, melee: true, fire: true,
    tags: ["area","attack","channelling","fire","grants_active_skill","melee","strength","strike"],
    description: "Normal-release Mace melee-hit focus with 40% Physical-to-Fire conversion. The separate Perfect Strike component has different damage and conversion. Perfect Timing, channel completion, Ignite and dual-wield uptime are not assumed.",
    timing: "Attack Speed changes scalable channel/release timing, not Perfect Timing success. Faster use can increase over-time Mana demand; the complete channel cycle is not modeled." },
  { id: "molten-blast", name: "Molten Blast", gem: "MoltenBlast", line: 13701, mace: true, fire: true, projectile: true,
    tags: ["area","attack","fire","grants_active_skill","projectile","strength"],
    description: "Mace projectile-explosion focus with 60% Physical-to-Fire conversion, not Melee Damage. Separate shrapnel has different conversion and no area-damage flag. Cone overlap, extra contacts, dual-wield projectiles and Ignite uptime are not assumed.",
    timing: "Attack Speed affects launching; native delivery also references attack timing. It does not guarantee shrapnel overlap, extra projectiles or Ignite uptime." },
  { id: "rolling-magma", name: "Rolling Magma", gem: "RollingMagma", line: 15968, fire: true, fullyConverted: true, projectile: true,
    tags: ["area","attack","detonator","fire","grants_active_skill","intelligence","projectile","shapeshift","strength","wyvern"],
    description: "Wyvern/Talisman projectile-impact focus, fully converted to Fire, not a Mace, melee attack or spell. Bounces, repeated enemy contacts, Ignite and activation of separate fissures or Volcanos are not assumed as extra damage.",
    timing: "Attack Speed changes launching, not guaranteed bounce contacts, Detonator events or the transformation cycle. Projectile delivery and native form timing stay separate." },
  { id: "forge-hammer", name: "Forge Hammer", gem: "ForgeHammer", line: 5836, mace: true, melee: true, fire: true,
    tags: ["area","attack","duration","fire","grants_active_skill","melee","slam","strength"],
    description: "Mace melee-impact focus with 30% Physical-to-Fire conversion, not a projectile despite the throw. Recall resets cooldown; nearby Warcries release separate fissures. Lodged lifetime, recall/Warcry supply, fissure overlap and repeated availability are not assumed.",
    timing: "Attack Speed changes deployment, not hammer flight, recall, Warcry supply or the eight-second cooldown. Cooldown recovery pauses while the hammer is lodged.",
    duration: "Extends the twelve-second lodged-hammer timer and separate eight-second fissures, not impact damage. Longer lodging can postpone cooldown recovery; recalls, Warcries and fissure contacts remain separate." },
  { id: "resonating-shield", name: "Resonating Shield", gem: "ResonatingShield", line: 15830, shield: true, melee: true, breaksArmour: true,
    tags: ["area","attack","channelling","grants_active_skill","melee","physical","strength","sustained"],
    description: "Player-owned Physical melee shockwaves using the shield's gem base and local Armour, not main-hand weapon damage. Channelled Armour Break and active Block remain separate; no Fully Broken Armour or defensive uptime is assumed.",
    timing: "Attack Speed accelerates channel attacks, not main-hand Mace modifiers. Source data links speed to channel cost, but the native baseline leaves that cost unchanged; do not infer sustain. Active Block is not guaranteed defence." },
  { id: "shield-charge", name: "Shield Charge", gem: "ShieldCharge", line: 17013, shield: true, melee: true,
    tags: ["area","attack","channelling","grants_active_skill","melee","physical","strength","travel"],
    description: "Shield-derived Physical melee-area focus, not main-hand damage. Collision is a separate, stronger component with different Armour scaling. Travel distance, full-charge bonuses, collisions, channel completion and active Block uptime are not assumed.",
    timing: "Attack Speed affects scalable action timing, not Movement-Speed-based travel, the minimum channel or guaranteed full-distance collision. Over-time Mana demand remains separate." },
  { id: "shield-wall", name: "Shield Wall", gem: "ShieldWall", line: 17263, shield: true, melee: true,
    tags: ["area","attack","duration","grants_active_skill","melee","physical","strength"],
    description: "Player-owned shield-derived Physical melee-area segment-explosion focus, not a minion, totem or main-hand weapon hit. Early enemy-destruction penalties, Slam empowerment, segment overlap, wall survival and externally supplied destruction are not assumed.",
    timing: "Attack Speed changes placement, not enemy destruction, Slam/Warcry/Shield Charge supply, segment overlap or explosion frequency.",
    duration: "Extends the six-second wall lifetime, not segment Life, explosion damage or destruction rate. Limits, early enemy-destruction penalties and externally empowered explosions stay separate." },
];

export const reviewedMaceShieldSkillIds = reviews.map(r => r.id);
export const reviewedProjectileMaceShieldSkillIds = reviews.filter(r => r.projectile).map(r => r.id);
export const reviewedDurationMaceShieldSkillIds = reviews.filter(r => r.duration).map(r => r.id);
const hitScopes: readonly SkillPassiveStatScope[] = ["attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackAreaDamage",
  "attackBlindChance","attackMaimChance","attackIncisionChance"];

export const maceShieldSkillPreferencePresets: readonly SkillPreferencePreset[] = reviews.map(r => ({
  id: r.id, name: r.name, gemId: `Metadata/Items/Gems/SkillGem${r.gem}`, tags: r.tags, description: r.description,
  passiveStatScopes: [...hitScopes,...(r.mace ? ["maceAttackDamage","maceAttackSpeed","maceStunBuildup"] as const : []),
    ...(r.melee ? ["meleeDamage","meleeStunBuildup"] as const : []),...(r.fire ? ["attackElementalDamage"] as const : [])],
  suggestions: [
    { id: "attackDamage", weight: 3, reason: r.shield ? "Generic player Attack Damage scales the shield component. Main-hand weapon and Mace modifiers do not transfer; shield-derived base damage stays separate." : "Reviewed player attack component. Mace modifiers apply only to explicit Mace focuses, not the Wyvern or a summoned proxy." },
    ...(!r.fullyConverted ? [{ id: "physicalDamage" as const, weight: r.fire ? 2 : 3, reason: r.fire ? "Only the remaining Physical portion benefits, not converted Fire. This weight is a heuristic, not a calculated damage share." : "Benefits the selected Physical hit. Shield skill base damage and local shield Armour are not global player Armour or assumed equipment values." }] : []),
    ...(r.fire ? [{ id: "fireDamage" as const, weight: 3, reason: "Benefits the selected component's native Fire conversion, not guaranteed Ignite or secondary-component uptime." },
      { id: "elementalDamage" as const, weight: 2, reason: "Benefits native Fire damage and reviewed attack-specific Elemental wording, not a second application to remaining Physical damage." }] : []),
    ...(r.projectile ? [{ id: "projectileDamage" as const, weight: 2, reason: "The selected native hit has projectile flags. Bounces, shrapnel and extra contacts are not assumed." }] : []),
    { id: "attackAreaDamage", weight: 1, reason: "The selected native component explicitly deals area damage. Coverage and secondary overlaps are not damage multipliers." },
    { id: "areaOfEffect", weight: 1, reason: "Widens reviewed hit coverage, not guaranteed contacts, collisions or segment explosions." },
    { id: "attackSpeed", weight: 1, reason: r.timing },
    ...(r.projectile ? [{ id: "projectileSpeed" as const, weight: 1, reason: "Projectile delivery utility, not launch speed, bounce count or guaranteed shrapnel and detonation contacts." }] : []),
    ...(r.breaksArmour ? [{ id: "armourBreakAmount" as const, weight: 2, reason: "The native hit explicitly Breaks Armour. More break amount is not damage, instant Fully Broken Armour or guaranteed payoff uptime." }] : []),
    ...(r.id === "shield-charge" ? [{ id: "movementSpeed" as const, weight: 1, reason: "Travel utility for charging, not a per-hit damage bonus, maximum-distance collision or guaranteed active Block uptime." }] : []),
  ],
  exclusions: [
    { id: "spellDamage", reason: "These are player attacks, not spells, minions or totems. Separate objects do not change damage ownership." },
    { id: "castSpeed", reason: "Cast Speed does not accelerate the reviewed attack or channel." },
    { id: "damageOverTime", reason: "This focus targets hits, not assumed Ignite or other damaging ailments." },
    { id: "skillDuration", reason: r.duration || "Channel timing, travel and collision distance are not a reviewed beneficial Skill Effect Duration timer." },
    ...(!r.projectile ? [{ id: "projectileDamage" as const, reason: "The selected native component is not projectile damage; hammer throws, shockwaves and segment explosions do not gain it from appearance." },
      { id: "projectileSpeed" as const, reason: "The selected component is not projectile travel; hammer flight and charge travel use separate timing." }] : []),
    ...(r.fullyConverted ? [{ id: "physicalDamage" as const, reason: "Rolling Magma is fully Fire-converted. Physical Damage modifiers do not scale the converted Fire portion." }] : []),
    ...(r.id === "forge-hammer" ? [{ id: "cooldownRecoveryRate" as const, reason: "Recovery does not run while the hammer is lodged. Recall resets cooldown; Warcry supply and reuse availability remain separate." }] : []),
  ],
  sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L${r.line}`,
}));

export function maceShieldSupportOverrides(kind: "area" | "cost" | "speed" | "concentrated" | "brutality" | "projectile" | "duration", amount: number, tierFlag = false, baseExclusions: SkillPreferencePreset["exclusions"] = []): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(reviews.filter(r => kind !== "projectile" || r.projectile).filter(r => kind !== "duration" || r.duration).map(r => {
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage; 30% higher Mana cost. No extra overlap, collisions or destroyed segments are assumed. `
      : kind === "cost" ? `${amount}% less supported-skill cost, not Mana regeneration or sustained channeling. Per-use and over-time costs remain distinct. `
      : kind === "speed" ? `${amount}% increased Attack Speed. ${r.timing} Legal compatibility does not establish a complete repeated-use cycle. `
      : kind === "duration" ? `${amount}% more skill-effect duration; 20% higher Mana cost. ${r.duration} `
      : kind === "projectile" ? `40% more projectile speed; 20% higher Mana cost. Changes delivery, not guaranteed extra impacts or source damage. ${tierFlag ? "The added 40% Pierce chance does not prove useful contacts for ground-impact/bouncing delivery. " : ""}`
      : kind === "concentrated" ? "30% more Area Damage and 50% less area, not radius, for the selected area hit. Extra overlaps, bounces and wall contacts are not assumed. "
      : `${amount}% more Physical Damage; 20% higher Mana cost; no Elemental or Chaos damage. ${r.fullyConverted ? "The fully Fire-converted Rolling Magma focus deals no damage; conversion is not reversed and no focus switch occurs. " : r.fire ? "The converted Fire portion is lost; only remaining Physical damage survives. " : "Added Elemental/Chaos damage is blocked; no Bleeding chance is supplied. "}${["molten-blast","forge-hammer"].includes(r.id) ? "Fully Fire secondary fissures/shrapnel also lose their damage. " : ""}${tierFlag ? "Hits have a 20% chance to ignore Physical Damage Reduction, not unconditional penetration or a DoT bypass. " : ""}`;
    return [r.id,{ summary: summary + "Manual priorities stay unchanged; support magnitudes are not route-score or Full DPS multipliers. Conditional setup and secondary-component uptime are not supplied.",
      ...(kind === "concentrated" ? { priorities: [{ id: "areaOfEffect" as const, weight: 2, reason: "Concentrated Area halves reviewed coverage. High priority is opt-in utility, not restored radius or guaranteed contacts." }] } : {}),
      ...(kind === "brutality" && r.fullyConverted ? { exclusions: [...baseExclusions,...(["attackDamage","attackAreaDamage","projectileDamage"] as const).map(id => ({ id,
        reason: "Brutality prevents this fully Fire-converted focus from dealing damage. Manual weights remain for explicit review, without changing the focus." }))] } : {}),
    }];
  }));
}

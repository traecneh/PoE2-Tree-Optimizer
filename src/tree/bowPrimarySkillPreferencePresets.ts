import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

type BowReview = {
  id: string; name: string; gem: string; line: number; tags: readonly string[];
  description: string; timing: string; areaDamage?: boolean; coverage?: boolean;
  element?: "cold" | "lightning" | "fire"; fullyConverted?: boolean; channel?: boolean; dot?: boolean;
};

// Curated native components, not automatic scoring/support approval from tags.
const reviews: readonly BowReview[] = [
  { id: "lightning-rod", name: "Lightning Rod", gem: "LightningRod", line: 4363,
    tags: ["area","attack","dexterity","duration","grants_active_skill","lightning","projectile","repeatable","sustained"],
    element: "lightning", fullyConverted: true, areaDamage: true, coverage: true,
    description: "Fully Lightning burst-hit focus. Later bursts require external Chaining Lightning beams. Rod lifetime, durability, limits and trigger delay do not establish repeated damage or Shock uptime.",
    timing: "Attack Speed changes deployment, not the delay between externally triggered bursts or Lightning Arrow supply." },
  { id: "stormcaller-arrow", name: "Stormcaller Arrow", gem: "StormcallerArrow", line: 8664,
    tags: ["area","attack","dexterity","duration","grants_active_skill","lightning","projectile","repeatable"],
    element: "lightning", fullyConverted: true, areaDamage: true, coverage: true,
    description: "Delayed, fully Lightning Bolt focus, not the initial arrow. The 1.5-second base duration delays the Bolt. Extra Shock chance and spread do not establish magnitude, uptime or additional hits.",
    timing: "Attack Speed changes firing, not the separate 1.5-second base Bolt delay or guaranteed Shock uptime." },
  { id: "freezing-salvo", name: "Freezing Salvo", gem: "FreezingSalvo", line: 2717,
    tags: ["area","attack","cold","dexterity","grants_active_skill","projectile","repeatable"],
    element: "cold", areaDamage: true, coverage: true,
    description: "Area-projectile hit focus with 80% Physical-to-Cold conversion. Seals generate over time; added projectiles become repeats. Seal availability, supplied Ice Fragments, detonation contacts and Freeze uptime are not assumed. Projectiles cannot Chain.",
    timing: "Attack Speed changes firing, not the 750 ms base Seal interval, maximum Seals or external Ice Fragment supply." },
  { id: "snipe", name: "Snipe", gem: "Snipe", line: 7217, channel: true,
    tags: ["area","attack","channelling","cold","dexterity","grants_active_skill","payoff","projectile","repeatable"],
    description: "Normal Physical arrow-hit focus. Perfect Timing enables a separate explosion; consuming external Freeze enables the fully Cold Icy Blast. All components cannot Freeze. No perfect release, supplied Freeze or guaranteed critical hit is assumed.",
    timing: "Attack Speed affects scalable channel timing, not guaranteed Perfect Timing or external Freeze. The minimum channel window and over-time Mana cost remain separate." },
  { id: "tornado-shot", name: "Tornado Shot", gem: "TornadoShot", line: 9128, dot: true, coverage: true,
    tags: ["area","attack","dexterity","duration","grants_active_skill","physical","projectile","repeatable","wind"],
    description: "Intrinsic Physical Tornado DoT focus, not the impact hit or copied projectiles. Generic Projectile and Area Damage explicitly scale this DoT. Attack/Bow hit damage, critical hits, copied-projectile supply and repeated contacts are separate.",
    timing: "Attack Speed changes deployment, not DoT ticks, Tornado limits or copied-projectile supply." },
  { id: "electrocuting-arrow", name: "Electrocuting Arrow", gem: "ElectrocutingArrow", line: 1506, element: "lightning", coverage: true,
    tags: ["area","attack","dexterity","duration","grants_active_skill","lightning","projectile","repeatable"],
    description: "Projectile-hit focus with 80% Physical-to-Lightning conversion. The attached rod enables incoming Lightning damage to build Electrocution. Native Area Damage does not scale this reviewed hit. Rod lifetime, external damage and Electrocution uptime are not assumed.",
    timing: "Attack Speed changes firing, not rod lifetime, external Lightning supply or guaranteed Electrocution." },
  { id: "detonating-arrow", name: "Detonating Arrow", gem: "DetonatingArrow", line: 1128, element: "fire", channel: true,
    tags: ["area","attack","channelling","detonator","dexterity","fire","grants_active_skill","projectile","repeatable","stages"],
    description: "One-stage arrow-hit focus with gained Fire damage, not conversion. Maximum stages enable a separate explosion. Further stage gains, Detonator interactions, overlap, Ignite and fully charged release frequency are not assumed.",
    timing: "Attack Speed affects channel timing, not an assumed maximum-stage release cycle or explosion contacts. Over-time Mana cost remains separate." },
  { id: "magnetic-salvo", name: "Magnetic Salvo", gem: "MagneticSalvo", line: 4720, element: "lightning", coverage: true,
    tags: ["area","attack","dexterity","grants_active_skill","lightning","projectile"],
    description: "Impact-projectile focus with 80% Physical-to-Lightning conversion. Nearby lingering Lightning bolts/arrows enable a stronger separate explosion. Native Area Damage does not scale the reviewed impact. External supply, missile overlap and explosions are not assumed.",
    timing: "Attack Speed changes firing, not lingering Lightning projectile supply or guaranteed missile contacts." },
  { id: "spiral-volley", name: "Spiral Volley", gem: "SpiralVolley", line: 8139,
    tags: ["attack","dexterity","grants_active_skill","projectile","sustained"],
    description: "Physical arrow-hit focus, not area damage. Each target can only be hit once per use. Frenzy Charges supply conditional damage and Chains; charge supply, maximum bonuses and extra contacts are not assumed.",
    timing: "Attack Speed affects scalable firing time, not the fixed 400 ms or guaranteed Frenzy Charge supply." },
  { id: "shockchain-arrow", name: "Shockchain Arrow", gem: "ShockchainArrow", line: 7007, element: "lightning",
    tags: ["area","attack","chaining","dexterity","grants_active_skill","lightning","payoff","projectile","repeatable"],
    description: "Projectile-hit focus with 80% Physical-to-Lightning conversion. Cannot Shock itself; conditional shockwaves/Chains need Lightning ailments. Consumes Shock, not Electrocution. The final Lightning Rod, shockwave count, external ailments and repeated contacts are not assumed.",
    timing: "Attack Speed changes firing, not Lightning ailment supply, conditional Chain count or guaranteed shockwaves." },
];

export const reviewedBowPrimarySkillIds = reviews.map(r => r.id);
export const reviewedAreaBowPrimarySkillIds = reviews.filter(r => r.id !== "spiral-volley").map(r => r.id);
const hitScopes: readonly SkillPassiveStatScope[] = ["attackCriticalChance","attackCriticalDamageBonus","bowAttackDamage","bowAttackSpeed",
  "bowAccuracy","bowCriticalDamageBonus","twoHandedWeaponDamage","attackBlindChance","attackMaimChance","attackIncisionChance"];

export const bowPrimarySkillPreferencePresets: readonly SkillPreferencePreset[] = reviews.map(r => ({
  id: r.id, name: r.name, gemId: `Metadata/Items/Gems/SkillGem${r.gem}`, tags: r.tags, description: r.description,
  passiveStatScopes: [...(r.dot ? ["bowAttackSpeed","areaDamageOverTime"] as const : hitScopes),
    ...(r.coverage ? ["attackAreaOfEffect"] as const : []), ...(r.areaDamage ? ["attackAreaDamage"] as const : []),
    ...(r.element ? ["attackElementalDamage"] as const : [])],
  suggestions: [
    ...(!r.dot ? [{ id: "attackDamage" as const, weight: 3, reason: "Reviewed player Bow attack hit, including weapon-specific and two-handed wording once. No minion, totem or intrinsic DoT transfer." }] : []),
    ...(!r.fullyConverted ? [{ id: "physicalDamage" as const, weight: r.element ? 2 : 3, reason: r.dot ? "The intrinsic Tornado deals Physical DoT independent of the weapon hit. Physical modifiers scale it; no copied projectile or ailment is assumed." : r.element ? "Benefits the Physical portion only, not converted Elemental damage or gained Fire. Priorities are heuristic, not calculated damage shares." : "Benefits the reviewed Physical arrow hit, not automatic Bleeding or Poison." }] : []),
    ...(r.element ? [{ id: ({ cold: "coldDamage", lightning: "lightningDamage", fire: "fireDamage" } as const)[r.element], weight: 3, reason: r.id === "detonating-arrow" ? "One native stage gains Fire from base damage. Maximum stages and Ignite are not assumed; Physical modifiers do not scale the gained Fire portion." : "Benefits the selected component's converted Elemental portion, not automatic ailments or external trigger supply." },
      { id: "elementalDamage" as const, weight: 2, reason: "Benefits the Elemental portion, including explicitly reviewed attack wording, not a second application to Physical damage." }] : []),
    { id: "projectileDamage", weight: 2, reason: r.dot ? "Native Projectile Damage modifiers explicitly apply to the Tornado's intrinsic DoT; this is not inferred from delivery tags or copied arrows." : "Benefits the reviewed projectile component, not a guarantee of extra projectiles, Chains, Pierce contacts or repeated hits." },
    ...(r.areaDamage ? [{ id: "attackAreaDamage" as const, weight: 1, reason: "The selected attack component explicitly deals area damage. No transfer to non-area delivery hits or extra overlap is assumed." }] : []),
    ...(r.dot ? [{ id: "damageOverTime" as const, weight: 3, reason: "Targets intrinsic Tornado DoT, not Poison, Bleeding or the displayed native hit fields." },
      { id: "areaDamage" as const, weight: 1, reason: "Native generic Area Damage scales this Tornado DoT; attack-only and spell-only area damage remain separate." },
      { id: "skillDuration" as const, weight: 2, reason: "Extends the fifteen-second base lifetime, not DoT per second, a higher Tornado limit or guaranteed contact uptime." }] : []),
    ...(r.coverage ? [{ id: "areaOfEffect" as const, weight: 1, reason: "Widens reviewed coverage, including attack-skill area wording, not damage per hit, DoT rate or guaranteed overlap." }] : []),
    { id: "attackSpeed", weight: 1, reason: r.timing },
    { id: "projectileSpeed", weight: 1, reason: "Projectile delivery utility only, not direct damage, charge/Seal supply, post-landing timers or extra contacts." },
  ],
  exclusions: [
    { id: "spellDamage", reason: "These are player Bow skills, not damaging spells or proxy damage." },
    { id: "castSpeed", reason: "Cast Speed does not accelerate Bow firing." },
    ...(!r.dot ? [{ id: "damageOverTime" as const, reason: "This focus targets an explicit attack hit, not automatic Ignite, Bleeding or Poison." },
      { id: "skillDuration" as const, reason: r.id === "stormcaller-arrow" ? "Longer Skill Effect Duration delays the Bolt; it is not more hit damage or faster firing." : "Rod lifetime, Seal recovery, channel timing and conditional ground effects are not automatically beneficial hit damage." }] : []),
    ...(!r.areaDamage && !r.dot ? [{ id: "attackAreaDamage" as const, reason: "The selected component lacks native area-damage scaling. Secondary components and targeting/coverage radii are not evidence for it." },
      { id: "areaDamage" as const, reason: "Native Area Damage does not scale the reviewed component; separate explosions are outside this focus." }] : []),
    ...(r.dot ? (["attackDamage","attackAreaDamage","spellAreaDamage","criticalChance","criticalDamageBonus","accuracy"] as const).map(id => ({ id,
      reason: "The intrinsic Tornado DoT is separate from attack hits, hit accuracy, critical hits and attack/spell-only area damage. Copied projectiles are outside this focus." })) : []),
    ...(r.fullyConverted ? [{ id: "physicalDamage" as const, reason: "The selected component is fully converted to Lightning; Physical Damage modifiers do not scale its converted Lightning damage." }] : []),
    ...(r.id === "snipe" ? [{ id: "coldDamage" as const, reason: "The normal arrow has no Cold conversion. The separate fully Cold Icy Blast requires Perfect Timing and external Freeze." },
      { id: "freezeBuildup" as const, reason: "All native Snipe components cannot Freeze. Consuming external Freeze does not grant Freeze application." }] : []),
    ...(r.id === "shockchain-arrow" ? [{ id: "shockChance" as const, reason: "Shockchain Arrow cannot Shock. External Shock/Electrocution and their uptime are not supplied by this focus." }] : []),
  ],
  sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L${r.line}`,
}));

export function bowPrimarySupportOverrides(kind: "area" | "cost" | "speed" | "concentrated" | "brutality" | "projectile", amount: number, tierFlag = false, baseExclusions: SkillPreferencePreset["exclusions"] = []): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(reviews.filter(r => !["area","concentrated"].includes(kind) || r.id !== "spiral-volley").map(r => {
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage; 30% higher Mana cost. ${r.coverage ? "Changes coverage, not guaranteed contacts or damage. " : "Only concerns separate/conditional explosions or shockwaves, not the selected non-area arrow. "}`
      : kind === "cost" ? `${amount}% less supported-skill cost. Channel cost is over time for Snipe/Detonating Arrow, not a firing cost. This does not grant Mana regeneration, charges, Seals or sustain. `
      : kind === "speed" ? `${amount}% increased Attack Speed. ${r.timing} ${r.dot ? "Tornado DoT rate is unchanged. " : ""}`
      : kind === "concentrated" ? `30% more Area Damage and 50% less area, not radius. ${r.dot ? "Scales intrinsic Tornado DoT, not attack-hit damage or copied-projectile supply. " : r.areaDamage ? "Scales the reviewed area hit, not extra overlap or repeated contacts. " : "Native damage of the selected component is unchanged; narrower coverage/secondary effects remain a trade-off, not a damage upgrade. "}`
      : kind === "projectile" ? `40% more projectile speed, with 20% higher Mana cost. ${tierFlag ? "Adds 40% Pierce chance; ground-targeted/non-colliding projectiles gain no assumed extra contacts, and Electrocuting Arrow cannot Pierce. " : ""}${r.dot ? "Changes delivery, not intrinsic Tornado DoT or copied-projectile supply. " : "Changes delivery, not post-landing timers, charge/Seal supply or assumed hits. "}`
      : `${amount}% more Physical Damage; 20% higher Mana cost; no Elemental or Chaos damage. ${r.fullyConverted ? "The fully Lightning focus deals no damage; conversion is not reversed and the focus does not switch to another component. " : r.dot ? "Scales intrinsic Physical Tornado DoT, not copied projectiles or guaranteed uptime. " : "Converted Elemental and gained Fire damage are blocked; only the Physical portion remains. "}${tierFlag ? "Hits have a 20% chance to ignore Physical Damage Reduction; this is not unconditional penetration or a DoT bypass. " : ""}`;
    return [r.id,{ summary: summary + "Manual priorities remain unchanged; support magnitudes are not route-score or Full DPS multipliers.",
      ...(kind === "concentrated" ? { priorities: r.areaDamage || r.dot ? [{ id: "areaOfEffect" as const, weight: 2, reason: "Concentrated Area halves reviewed coverage. High priority is opt-in coverage, not damage or guaranteed overlap." }] : [] } : {}),
      ...(kind === "brutality" && r.fullyConverted ? { exclusions: [...baseExclusions,...(["attackDamage","projectileDamage","attackAreaDamage"] as const).map(id => ({ id,
        reason: "Brutality prevents all damage of this fully Lightning focus. The focus is not changed; manual weights are retained for explicit review." }))] } : {}),
    }];
  }));
}

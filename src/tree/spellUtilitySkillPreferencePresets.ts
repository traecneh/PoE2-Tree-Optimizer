import type { PassivePreferenceId } from "./passivePreferences";
import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

type Review = {
  id: string; name: string; gem: string; line: number; file: "act_dex" | "act_int" | "act_str";
  tags: readonly string[]; description: string; timing: string;
  hit?: boolean; dot?: boolean; curse?: boolean; utility?: boolean; projectile?: boolean;
  area?: boolean; areaSupport?: boolean; duration?: string; moving?: boolean; echo?: boolean;
  element?: "coldDamage" | "fireDamage"; physical?: boolean; chaos?: boolean; cooldown?: string;
};

// Review components, not the catalog's broad Spell classification or every child granted by a gem.
const reviews: readonly Review[] = [
  { id: "barrage", name: "Barrage", gem: "Barrage", file: "act_dex", line: 145, utility: true, moving: true,
    tags: ["buff","dexterity","duration","grants_active_skill","spell"],
    description: "Non-damaging preparation buff for a later Repeatable Bow or Projectile Spear attack. Repeats, damage penalties, Frenzy consumption and attack-dependent cooldown are separate. Selecting Barrage does not choose the empowered attack or assume repeated hits.",
    timing: "Cast Speed concerns preparation, not the empowered attack, repeat count, Frenzy supply or cooldown-limited use frequency.",
    duration: "Extends the five-second empowerment window, not repeat count, damage per hit or guaranteed attack use.",
    cooldown: "Cooldown utility only: final Barrage recovery depends on the empowered attack's time and charge/repeat setup, with a maximum. No fixed repeated-use rate is assumed." },
  { id: "charged-staff", name: "Charged Staff", gem: "ChargedStaff", file: "act_int", line: 3252, utility: true,
    tags: ["area","attack","buff","conditional","dexterity","duration","grants_active_skill","intelligence","lightning","spell"],
    description: "Power-Charge-consuming Quarterstaff buff focus, not its separately granted attack shockwave. Added Lightning and shockwaves belong to later attacks. Charge count, repeated buff stacking and full-build damage are not assumed; native timing flags are inconsistent.",
    timing: "Source declares a spell cast, but native attack flags prevent the captured Cast Speed control from changing timing. No automatic Cast Speed preference is supplied.",
    duration: "Buff duration starts from six seconds per consumed Power Charge. Charge count and repeated stacking are not supplied; duration is utility, not more Lightning per hit." },
  { id: "convalescence", name: "Convalescence", gem: "Convalescence", file: "act_int", line: 4071, utility: true,
    tags: ["buff","duration","grants_active_skill","intelligence","persistent","spell"],
    description: "Granted active recovery-spell focus, not toggling the persistent 30-Spirit parent. Begins ES Recharge and protects it temporarily; ends at full ES and cannot activate there. Recharge amount, protection uptime and repeated availability are not guaranteed.",
    timing: "Cast Speed concerns the granted spell's activation, not recharge rate, the thirty-second cooldown or protection uptime.",
    duration: "Extends the active protection window, not Recharge rate or maximum ES. It ends at full ES, and cooldown recovery pauses while the buff remains active." },
  { id: "elemental-weakness", name: "Elemental Weakness", gem: "ElementalWeakness", file: "act_int", line: 5943, curse: true, moving: true, areaSupport: true, echo: true,
    tags: ["area","cold","curse","duration","fire","grants_active_skill","intelligence","lightning","repeatable","spell"],
    description: "Non-damaging Elemental-resistance curse. Curse magnitude, application coverage, duration and activation delay are separate. Elemental tags do not make player damage, Exposure or penetration strengthen the curse; enemy resistance and whole-build damage are not calculated.",
    timing: "Cast Speed changes application casting, not the separate 1500 ms curse activation delay or resistance-reduction magnitude.",
    duration: "Extends the 7.4-second curse, not its magnitude or activation speed. Curse limits, replacement and enemy uptime are not supplied." },
  { id: "frost-darts", name: "Frost Darts", gem: "FrostDarts", file: "act_int", line: 9166, hit: true, projectile: true, element: "coldDamage", moving: true, areaSupport: true,
    tags: ["area","cold","grants_active_skill","intelligence","payoff","projectile","repeatable","spell"],
    description: "Initial Cold projectile-hit focus, not conditional ice chunks or infusion explosions. The darts cannot Freeze or Chill themselves; their payoff requires external setup. Projectile count, overlap, infusion supply and repeated contacts are not assumed.",
    timing: "Cast Speed changes launching, not external Chill/Freeze, infusion supply, projectile overlap or guaranteed secondary hits." },
  { id: "ice-tipped-arrows", name: "Ice-Tipped Arrows", gem: "IceTippedArrows", file: "act_dex", line: 3903, utility: true, moving: true,
    tags: ["area","attack","buff","cold","dexterity","duration","grants_active_skill","projectile","spell","trigger"],
    description: "Non-damaging Bow/Spear empowerment focus, not the separately triggered Ice Fragments attack. Eligible later attacks convert Physical to Cold. Attack-use limits, Frenzy cooldown bypass, sustained-skill exclusion, fragments and repeated contacts remain separate.",
    timing: "Cast Speed concerns preparation, not Bow/Spear attack speed, Ice Fragment hits or the cooldown bypass condition.",
    duration: "Extends the twenty-second empowerment window, not its four-attack limit, fragment damage or guaranteed contacts.",
    cooldown: "Improves the twelve-second cooldown independently of casting; expending a Frenzy Charge can bypass it, but charges and sustained availability are not supplied." },
  { id: "mana-tempest", name: "Mana Tempest", gem: "ManaTempest", file: "act_int", line: 15203, utility: true, moving: true,
    tags: ["buff","grants_active_skill","intelligence","lightning","spell","storm"],
    description: "Non-damaging empowerment storm for other Mana-costing spells. Remaining inside and spending Mana govern its escalating drain; the native baseline omits that drain. No free sustain, always-on gained Lightning, split count or whole-build damage is assumed.",
    timing: "Cast Speed affects creating the storm, not Mana drain, other spells' casting or cooldown recovery paused during the buff." },
  { id: "profane-ritual", name: "Profane Ritual", gem: "ProfaneRitual", file: "act_int", line: 15985, dot: true, chaos: true, moving: true, areaSupport: true, echo: true,
    tags: ["area","chaos","duration","grants_active_skill","intelligence","repeatable","spell"],
    description: "Corpse-based Chaos DoT focus with explicit Spell Damage scaling, not a critical hit. Completion consumes the corpse and grants a Power Charge. Longer duration delays that reward; corpse supply, overlaps and charge uptime are not assumed.",
    timing: "Cast Speed changes marking the corpse, not DoT tick damage, ritual completion time or corpse and Power Charge supply.",
    duration: "Extends the two-second ritual DoT window but delays completion, corpse consumption and the Power Charge reward. Longer is not automatically better for charge generation." },
  { id: "snap", name: "Snap", gem: "Snap", file: "act_int", line: 19043, hit: true, area: true, element: "coldDamage", moving: true, areaSupport: true, echo: true,
    tags: ["area","cold","fire","grants_active_skill","intelligence","lightning","payoff","remnant","repeatable","spell"],
    description: "Cold-blast focus requiring external Freeze or Frostbolt. Fire and Lightning variants are separate; Snap cannot Freeze, Shock or Ignite itself. Ailment consumption, spread, unique-enemy bonuses, remnants and cooldown availability are not assumed.",
    timing: "Cast Speed changes casting, not external ailment/Frostbolt supply, propagation delays, guaranteed spread or the four-second cooldown.",
    cooldown: "Improves the four-second cooldown, not external Freeze/Frostbolt supply, propagation or the number of eligible enemies." },
  { id: "temporal-chains", name: "Temporal Chains", gem: "TemporalChains", file: "act_int", line: 21640, curse: true, moving: true, areaSupport: true, echo: true,
    tags: ["area","curse","duration","grants_active_skill","intelligence","repeatable","spell"],
    description: "Non-damaging curse affecting enemy action speed and how other effects expire. Curse magnitude is separate from player damage, outgoing ailment duration and incoming-debuff protection. Enemy caps, other debuff sources and uptime are not calculated.",
    timing: "Cast Speed changes application casting, not the separate 1500 ms activation delay or enemy effect-expiry rate.",
    duration: "Extends the 7.4-second curse itself. This is not the same as changing how other effects expire or their original source durations." },
  { id: "tornado", name: "Tornado", gem: "Tornado", file: "act_str", line: 19712, dot: true, physical: true, moving: true, areaSupport: true,
    tags: ["area","duration","grants_active_skill","intelligence","physical","spell","storm","strength","wind"],
    description: "Unempowered Physical DoT focus with explicit Spell Damage scaling, not a hit or projectile. Elemental-ground absorption is conditional. Native Area Damage controls leave DoT unchanged; pulling, slowing, contacts and ground debuffs are not guaranteed.",
    timing: "Cast Speed changes placing the Tornado, not DoT ticks, its fixed pull interval, movement speed or enemy contact time.",
    duration: "Extends the eight-second lifetime, not damage per second, pull frequency or guaranteed contacts. The one-Tornado limit still applies." },
  { id: "volcano", name: "Volcano", gem: "Volcano", file: "act_str", line: 20169, hit: true, area: true, element: "fireDamage", moving: true, areaSupport: true,
    tags: ["area","channelling","duration","fire","grants_active_skill","intelligence","projectile","spell","strength","sustained"],
    description: "Base Fire eruption-hit focus, not its separate projectile sprays. Extra channel stages empower the initial eruption, not later sprays. Slams, overlap, repeated projectiles, Ignite and sustained channel availability are not assumed.",
    timing: "Cast Speed changes channel startup, stage acquisition and ending, not the fixed 500 ms spray interval or external Slam supply. Source ties speed to ongoing Mana cost, but the frozen native output leaves that cost unchanged; do not infer free sustain.",
    duration: "Extends the eight-second volcano lifetime, not the initial eruption's damage, fixed spray interval or guaranteed Slam triggers." },
];

const suggestion = (id: PassivePreferenceId, weight: number, reason: string): SkillPreferencePreset["suggestions"][number] => ({ id, weight, reason });
export const spellUtilitySkillPreferencePresets: readonly SkillPreferencePreset[] = reviews.map(r => ({
  id: r.id, name: r.name, gemId: `Metadata/Items/Gems/SkillGem${r.gem}`, tags: r.tags, description: r.description,
  passiveStatScopes: [
    ...(r.hit ? ["spellCriticalChance","spellCriticalDamageBonus","spellHinderChance"] as const : []),
    ...(r.area ? ["spellAreaDamage"] as const : []),
    ...(["profane-ritual","snap","tornado","volcano"].includes(r.id) ? ["spellAreaOfEffect"] as const : []),
    ...(r.projectile ? ["spellProjectileSpeed"] as const : []),
  ] satisfies readonly SkillPassiveStatScope[],
  suggestions: [
    ...(r.hit || r.dot ? [suggestion("spellDamage",3,"Benefits the selected player component. DoT scaling is admitted only where the source explicitly applies Spell Damage to it.")] : []),
    ...(r.element ? [suggestion(r.element,3,"Benefits the selected native element, not other elements in the gem's tags or conditional variants."),suggestion("elementalDamage",2,"Benefits the selected Elemental hit, not assumed ailments, ground effects or repeated contacts.")] : []),
    ...(r.physical ? [suggestion("physicalDamage",3,"Benefits unempowered Physical DoT, not conditional ground-supplied Elemental damage.")] : []),
    ...(r.chaos ? [suggestion("chaosDamage",3,"Benefits intrinsic Chaos DoT, not a delivery hit, Poison or Power Charge generation.")] : []),
    ...(r.dot ? [suggestion("damageOverTime",3,"Benefits intrinsic non-ailment DoT rate, not duration, critical hits or guaranteed contacts.")] : []),
    ...(r.projectile ? [suggestion("projectileDamage",2,"Benefits the initial projectile hit; extra projectiles do not establish extra hits."),suggestion("projectileSpeed",1,"Delivery utility for the initial darts, not casts per second or guaranteed ice chunks.")] : []),
    ...(r.area ? [suggestion("spellAreaDamage",1,"Benefits the selected native area hit; coverage and secondary components are separate.")] : []),
    ...(["profane-ritual","snap","tornado","volcano"].includes(r.id) ? [suggestion("areaOfEffect",1,"Coverage utility, not a damage-per-second multiplier or guaranteed additional contacts.")] : []),
    ...(r.curse ? [suggestion("curseMagnitude",3,"Strengthens the outgoing curse's native effect, not player damage, Exposure or resistance penetration."),
      suggestion("curseDuration",2,r.duration!),suggestion("curseArea",2,"Widens curse application, not damage or effect magnitude."),
      suggestion("curseActivation",1,"Shortens the separate 1500 ms activation delay, not casting or effect magnitude.")] : []),
    ...(!r.curse && r.duration && r.id !== "volcano" ? [suggestion("skillDuration",r.id === "profane-ritual" ? 1 : 2,r.duration)] : []),
    ...(r.cooldown ? [suggestion("cooldownRecoveryRate",1,r.cooldown)] : []),
    ...(r.id === "convalescence" ? [suggestion("energyShield",3,"Recharge recovery scales with maximum Energy Shield, but the buff ends at full ES and does not guarantee defensive uptime."),suggestion("energyShieldRechargeRate",3,"Improves active ES Recharge rate, not the activation cost, protection duration or repeated availability.")] : []),
    ...(r.id === "mana-tempest" ? [suggestion("manaRegenerationRate",2,"Mana replenishment utility, not proof of sustaining the escalating percentage-based drain or the empowered spell costs.")] : []),
    ...(r.id !== "charged-staff" ? [suggestion("castSpeed",1,r.timing)] : []),
  ],
  exclusions: [
    { id: "attackDamage", reason: "This focus selects a spell component or utility buff, not empowered weapon attacks, Ice Fragments or Charged Shockwave." },
    { id: "attackSpeed", reason: "Attack Speed for a later empowered attack does not accelerate this selected spell or grant its resources." },
    ...(!r.hit ? (["criticalChance","criticalDamageBonus"] as const).map(id => ({ id, reason: "The selected utility/DoT component has no damaging hit that critically strikes. Separate granted attacks are not this focus." })) : []),
    ...(r.utility || r.curse ? [{ id: "spellDamage" as const, reason: "The selected cast deals no damage. A buff affecting later spells/attacks or an enemy curse is not its own damaging spell hit." },
      { id: "damageOverTime" as const, reason: "This selected utility or curse does not deal damage over time; other skills and debuffs remain separate." }] : []),
    ...(!r.projectile ? [{ id: "projectileDamage" as const, reason: "The selected component is not projectile damage. Volcano sprays and empowered/granted attacks are separate components." },
      { id: "projectileSpeed" as const, reason: "The selected component is not projectile delivery; separate spray/fragment utility does not accelerate the selected cast or DoT." }] : []),
    ...(!r.area ? (["spellAreaDamage","areaDamage"] as const).map(id => ({ id, reason: r.dot ? "The captured native area-damage controls do not increase this DoT. Coverage is not damage, even with an Area tag or source flag." : "The selected utility or initial projectile is not an area-damaging hit; secondary components remain separate." })) : []),
    ...(r.id === "charged-staff" ? [{ id: "castSpeed" as const, reason: r.timing }] : []),
    ...(r.id === "convalescence" ? [{ id: "energyShieldRechargeStart" as const, reason: "The active spell starts Recharge immediately. Faster natural Recharge start is separate and does not shorten this activation or cooldown." }] : []),
    ...(["frost-darts","snap"].includes(r.id) ? [{ id: "freezeBuildup" as const, reason: "The selected hit cannot Freeze itself; an external source must establish the payoff." },
      { id: "chillMagnitude" as const, reason: r.id === "frost-darts" ? "Frost Darts cannot Chill; extra outgoing Chill magnitude does not create its required external setup." : "This focus does not assume a sustained Chill or a supplied ailment source." }] : []),
    ...(r.id === "snap" ? (["shockChance","igniteMagnitude"] as const).map(id => ({ id, reason: "Snap cannot Shock or Ignite. Required consumed ailments and their uptime need separate sources." })) : []),
    ...(!r.duration || r.id === "volcano" ? [{ id: "skillDuration" as const, reason: r.duration || "The selected component has no reviewed beneficial Skill Effect Duration timer; fixed activation, channel and secondary timers are separate." }] : []),
  ],
  sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/${r.file}.lua#L${r.line}`,
}));

export type SpellUtilitySupportKind = "area" | "duration" | "cost" | "mobility" | "controlled" | "considered" | "rapid" | "echo" | "concentrated" | "brutality" | "projectile" | "curse";
function eligible(r: Review, kind: SpellUtilitySupportKind): boolean {
  if (kind === "cost" || kind === "rapid") return true;
  if (kind === "area" || kind === "concentrated") return !!r.areaSupport;
  if (kind === "duration") return !!r.duration;
  if (kind === "mobility") return !!r.moving;
  if (kind === "controlled" || kind === "considered") return !!r.hit;
  if (kind === "echo") return !!r.echo;
  if (kind === "brutality") return !!(r.hit || r.dot);
  if (kind === "projectile") return !!r.projectile || r.id === "volcano";
  return !!r.curse;
}
export const reviewedSpellUtilitySupportIds = (kind: SpellUtilitySupportKind): string[] => reviews.filter(r => eligible(r,kind)).map(r => r.id);

export function spellUtilitySupportOverrides(kind: SpellUtilitySupportKind, amount = 0, tierFlag = false, baseExclusions: SkillPreferencePreset["exclusions"] = []): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(reviews.filter(r => eligible(r,kind)).map(r => {
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage; 30% higher Mana cost. ${r.id === "frost-darts" ? "Only conditional explosion/ice-chunk coverage changes, not the initial dart. " : "Coverage does not supply contacts, curse magnitude or DoT rate. "}`
      : kind === "duration" ? `${amount}% more skill-effect duration; 20% higher Mana cost. ${r.duration} `
      : kind === "cost" ? `${amount}% less supported-skill cost, not Mana regeneration or guaranteed sustain. ${r.id === "convalescence" ? "Applies to the granted active spell's 20-Mana cost; the persistent parent still reserves 30 Spirit. " : r.id === "mana-tempest" ? "Native baseline cost is zero despite source-declared percentage drain and escalation; no free upkeep or sustained empowerment is inferred. " : "Charges, empowered attacks and other skills' costs remain separate. "}`
      : kind === "mobility" ? "25% less movement penalty during this supported action, not global Movement Speed, Cast Speed or damage. No uptime or Mana sustain is supplied. "
      : kind === "rapid" ? `${tierFlag ? "Conditional 10% increased Cast Speed per different spell cast in the last eight seconds; rotation and uptime are not supplied." : `${amount}% increased Cast Speed, not more Cast Speed.`} ${r.timing} Cost per use remains separate from demand over time. `
      : kind === "controlled" ? "25% more spell-hit damage; the selected hit cannot critically hit. Critical Chance and Critical Damage Bonus are inapplicable, but manual weights are retained with warnings. "
      : kind === "considered" ? `35% more damage, 15% less Cast Speed and 15% higher Mana cost. ${r.timing} Self-cast hit compatibility only; legal native type checks for non-hitting buffs/DoTs are not treated as approval. `
      : kind === "echo" ? "One Echo with 30% less Cast Speed and 50% higher Mana cost. The 40% area increase is Echo-only, not unconditional coverage. Repeated curses replace under normal limits; corpses, ailments, overlap and repeat success are not supplied. "
      : kind === "concentrated" ? `30% more Area Damage and 50% less area, not radius. ${r.area ? "Benefits the selected area hit, not extra stages or contacts. " : r.id === "frost-darts" ? "Only separate explosion/ice-chunk hits can benefit; initial dart damage is unchanged. " : "The selected curse/DoT gains no native damage benefit; reduced coverage is not a damage upgrade. "}`
      : kind === "projectile" ? `40% more projectile speed; 20% higher Mana cost. ${r.id === "volcano" ? "Only affects the separate sprays, not the initial eruption or fixed spray interval. " : "Delivery changes, not launch rate or guaranteed extra darts, chunks or infusion hits. "}${tierFlag ? "40% added Pierce chance does not prove extra useful collisions or contacts. " : ""}`
      : kind === "curse" ? amount === 50 ? "Halves curse activation delay to 750 ms with 20% higher Mana cost, not faster casting or greater curse magnitude. Enemy uptime, replacement and repeated application remain separate. " : "Adds 50% curse area and 30% longer activation delay (1950 ms), not curse magnitude. The suggested activation priority is an explicit opt-in responsiveness change. "
      : `${amount}% more Physical Damage and 20% higher Mana cost; no Elemental or Chaos damage. ${r.physical ? "Physical Tornado DoT remains; conditional Elemental ground damage is blocked. " : "The selected pure Elemental hit or Chaos DoT deals no damage; conversion and focus do not switch. "}${tierFlag ? "20% chance for hits to ignore Physical Damage Reduction is not a DoT mitigation bypass or unconditional penetration. " : ""}`;
    return [r.id,{ summary: summary + "Manual priorities remain unchanged unless explicitly applied; support magnitudes are not route-score or Full DPS multipliers.",
      ...(["considered","echo"].includes(kind) ? { priorities: [suggestion("castSpeed",2,"Opt-in responsiveness for the cast-speed penalty, not restored whole-cycle damage or guaranteed repeat/trigger uptime.")] } : {}),
      ...(kind === "curse" && amount !== 50 ? { priorities: [suggestion("curseActivation",2,"Opt-in responsiveness for Ritualistic Curse's longer activation delay, not a curse-magnitude increase.")] } : {}),
      ...(kind === "concentrated" ? { priorities: r.area ? [suggestion("areaOfEffect",2,"Opt-in coverage preference for Concentrated Area, not restored radius or a calculated net damage gain.")] : [] } : {}),
      ...(kind === "brutality" && !r.physical ? { exclusions: [...baseExclusions,...(["spellDamage","spellAreaDamage","projectileDamage","damageOverTime"] as const).map(id => ({ id,
        reason: "Brutality prohibits all damage of this selected Elemental hit or Chaos DoT. Manual weights remain for review, without changing components." }))] } : {}),
    }];
  }));
}

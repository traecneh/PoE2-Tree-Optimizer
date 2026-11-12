import type { PassivePreferenceId } from "./passivePreferences";
import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

const s = (id: PassivePreferenceId, weight: number, reason: string): SkillPreferencePreset["suggestions"][number] => ({ id,weight,reason });
const source = (file: string, line: number) => `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/${file}.lua#L${line}`;
const utilityExclusions: SkillPreferencePreset["exclusions"] = (["attackDamage","spellDamage","criticalChance","criticalDamageBonus","minionDamage","elementalDamage","chaosDamage"] as const).map(id => ({ id,
  reason: "This selected resource/buff action is not a damaging recipient skill. Recipient modifiers do not strengthen its grant or supply its required events; manual weights remain for other skills, not a calculated buff-DPS benefit." }));
const noCast = { id: "castSpeed" as const, reason: "This buff is not a self-cast damaging Spell. Cast Speed is not its generation rate, consumption interval, cooldown or buff strength." };
const noDuration = { id: "skillDuration" as const, reason: "This skill's persistent reservation, generation/consumption interval or resource lifetime is not generic Skill Effect Duration. Use an explicitly reviewed timer; longer duration does not supply the resource." };
const rage = s("maximumRage",1,"Rage storage capacity, not Rage gained or a damage multiplier. Requires a separate Rage source and retention; using more stored Rage can also increase Berserk's Life loss.");
const recovery = [s("lifeRegenerationPercent",2,"A supplied percentage-of-maximum-Life regeneration source can offset part of the described Life loss. More maximum Life also increases absolute percentage-Life loss; this is not mitigation, immunity or proof of positive net recovery."),
  s("lifeRegenerationRate",1,"Regeneration-rate modifiers require a regeneration source; they do not grant base regeneration or guarantee that Life loss can be sustained.")];
const pickup = s("remnantPickupRange",2,"Collection convenience for Remnants that actually exist, not Presence area, creation chance, recovery or guaranteed pickups. Native pickup behavior is unmodeled.");
const extraRemnant = s("additionalRemnantChance",1,"Flat extra-Remnant chance on an eligible creation event, not a guaranteed drop, ailment chance or sustained resource income. Original skill conditions and collection remain required.");
const chargeSuggestions = [
  s("maximumFrenzyCharges",1,"Frenzy reservoir for supplied charges, not generation or a per-charge speed multiplier. Charge Regulation's speed buff requires at least one charge; consumption still occurs."),
  s("maximumPowerCharges",1,"Power reservoir, not critical chance per charge. The buff checks charge presence; more capacity cannot generate or maintain charges by itself."),
  s("maximumEnduranceCharges",1,"Endurance reservoir, not extra defence per charge. The buff checks charge presence, and its independent consumption timer remains unchanged."),
  s("frenzyChargeDuration",1,"Frenzy holding time before natural expiration, not the ten-second charge-consumption interval or speed-buff strength."),
  s("powerChargeDuration",1,"Power holding time before expiration, not consumption interval or critical-buff strength."),
  s("enduranceChargeDuration",1,"Endurance holding time before expiration, not consumption interval, mitigation or the defensive-buff multiplier."),
];

export const resourceChargeSkillPreferencePresets: readonly SkillPreferencePreset[] = [
  { id: "alchemists-boon", name: "Alchemist's Boon", gemId: "Metadata/Items/Gems/SkillGemAlchemistsBoon",
    tags: ["aura","buff","dexterity","grants_active_skill","persistent"],
    description: "Passive Flask-charge Aura and sharing of your Life/Mana Flask recovery with allies in Presence. No inherent damage or guaranteed sustain. Charge generation, recovery amounts, Aura magnitude and ally coverage stay separate; native recovery-sharing calculations are incomplete.",
    passiveStatScopes: [], suggestions: [s("lifeFlaskRecovery",2,"Your eligible Life Flask recovery supplies the sharing effect; this is not Life regeneration, charge generation or automatic Minion recovery."),
      s("manaFlaskRecovery",2,"Your eligible Mana Flask recovery supplies sharing, not Mana regeneration or guaranteed recovery per second."),
      s("presenceArea",2,"Ally sharing coverage, not generic skill area, Flask recovery amount or guaranteed nearby allies.")],
    exclusions: [...utilityExclusions,noCast,noDuration,{ id: "auraMagnitude", reason: "Native Aura output increases, but captured passive Flask generation unexpectedly decreases under the same control. No automatic Aura priority or validated generation gain is claimed; recovery sharing is also incomplete." }], sourceUrl: source("act_dex",10) },
  { id: "attrition", name: "Attrition", gemId: "Metadata/Items/Gems/SkillGemAttrition",
    tags: ["buff","dexterity","grants_active_skill","persistent","strength"],
    description: "Rare/Unique encounter buff built from enemy time in Presence, later enabling Culling Strike. Not its own damaging hit. Presence coverage does not supply elapsed combat, maximum damage or Cull; recipient hit damage and actual encounter duration remain separate.",
    passiveStatScopes: [], suggestions: [s("presenceArea",1,"Coverage for the enemy-in-Presence condition, not faster stack generation per second, higher damage cap or immediate Culling Strike. No enemy rarity, elapsed time or continuous Presence assumed.")],
    exclusions: [...utilityExclusions,noCast,noDuration], sourceUrl: source("act_str",1192) },
  { id: "berserk", name: "Berserk", gemId: "Metadata/Items/Gems/SkillGemBerserk",
    tags: ["buff","grants_active_skill","persistent","strength"],
    description: "Strengthens separately supplied Rage but loses Life while not losing Rage. Not the older temporary Rage-spending attack-speed buff. Capacity is not current Rage or guaranteed damage; percentage-Life loss, regeneration sources and net sustain remain separate.",
    passiveStatScopes: [], suggestions: [rage,...recovery], exclusions: [...utilityExclusions,noCast,noDuration], sourceUrl: source("act_str",1438) },
  { id: "charge-regulation", name: "Charge Regulation", gemId: "Metadata/Items/Gems/SkillGemChargeRegulation",
    tags: ["buff","dexterity","grants_active_skill","intelligence","persistent"],
    description: "Separate speed, critical and defensive buffs require Frenzy, Power and Endurance Charges respectively. Maintaining them consumes charges periodically. Capacity and natural charge duration are reservoirs, not generation, per-charge buff multipliers or a longer consumption interval; no permanent buffs assumed.",
    passiveStatScopes: [], suggestions: chargeSuggestions, exclusions: [...utilityExclusions,noCast,noDuration,
      { id: "skillSpeed", reason: "Recipient Skill Speed does not strengthen Charge Regulation's speed grant or slow its consumption timer." }], sourceUrl: source("act_int",3119) },
  { id: "combat-frenzy", name: "Combat Frenzy", gemId: "Metadata/Items/Gems/SkillGemCombatFrenzy",
    tags: ["buff","dexterity","grants_active_skill","persistent"],
    description: "Freeze, Electrocute or Pin events can grant Frenzy Charges subject to a separate internal interval. Does not itself inflict those conditions. Charge capacity and holding time stay separate from event supply; generic cooldown recovery does not establish faster generation.",
    passiveStatScopes: [], suggestions: [s("maximumFrenzyCharges",1,"Storage for actually generated Frenzy Charges, not ailment application, faster generation or free damage."),
      s("frenzyChargeDuration",2,"Longer natural lifetime of supplied Frenzy Charges, not the internal generation interval or permanent charge uptime.")],
    exclusions: [...utilityExclusions,noCast,noDuration,{ id: "cooldownRecoveryRate", reason: "Combat Frenzy's mapped internal interval is not an ordinary skill cooldown; generic cooldown recovery does not shorten the captured interval." }], sourceUrl: source("act_dex",751) },
  { id: "elemental-conflux", name: "Elemental Conflux", gemId: "Metadata/Items/Gems/SkillGemElementalConflux",
    tags: ["buff","cold","duration","fire","grants_active_skill","intelligence","lightning","persistent"],
    description: "Randomly rotates the Element receiving more damage. Longer duration also holds an unwanted Element longer, not guaranteed higher DPS. Context-only: no automatic damage priorities without a recipient and rotation model; configured average or Fire selection is not actual uptime.",
    passiveStatScopes: [], suggestions: [], exclusions: [...utilityExclusions,noCast,{ id: "skillDuration", reason: "Longer duration extends each selected-element interval, including unfavourable rolls. No guaranteed positive weighting or permanent preferred Element is inferred." }], sourceUrl: source("act_int",5589) },
  { id: "emergency-reload", name: "Emergency Reload", gemId: "Metadata/Items/Gems/SkillGemEmergencyReload",
    tags: ["buff","dexterity","duration","grants_active_skill","strength"],
    description: "Instantly reloads Crossbow clips and temporarily empowers their ammunition. This action has Mana cost and a cooldown, not firing damage. Empowerment duration, restored clips and recipient attacks stay separate; no infinite ammunition, normal-reload speed benefit or sustainable uptime assumed.",
    passiveStatScopes: [], suggestions: [s("skillDuration",2,"Longer supplied ammunition-empowerment window, not extra bolts, stronger hits or guaranteed consumption before expiry."),
      s("cooldownRecoveryRate",2,"Recovery of the action's separate 45-second base cooldown, not firing cadence, restored Grenade uses or a linear percentage cut to seconds."),
      s("manaCostEfficiency",1,"Cost efficiency for this non-persistent reload action, not Spirit reservation, Mana regeneration or sustainable firing.")],
    exclusions: [...utilityExclusions,noCast,{ id: "attackSpeed", reason: "This reload is instant, not a firing attack. Attack Speed does not improve its cooldown or strengthen empowered ammunition." }], sourceUrl: source("act_str",4474) },
  { id: "eternal-rage", name: "Eternal Rage", gemId: "Metadata/Items/Gems/SkillGemEternalRage",
    tags: ["buff","grants_active_skill","persistent","strength"],
    description: "Regenerates Rage while reserving Spirit across both weapon sets. Rage is not Life or Mana regeneration. Capacity does not accelerate generation or prevent inherent loss; no maximum Rage, permanent damage bonus or weapon-set reservation bypass is assumed.",
    passiveStatScopes: [], suggestions: [rage], exclusions: [...utilityExclusions,noCast,noDuration,
      { id: "manaRegenerationRate", reason: "Mana Regeneration does not become Rage regeneration without a separately supplied conversion mechanic." },
      { id: "lifeRegenerationRate", reason: "Rage regeneration is not Life regeneration or recovery." }], sourceUrl: source("act_str",4812) },
  { id: "mana-remnants", name: "Mana Remnants", gemId: "Metadata/Items/Gems/SkillGemManaRemnants",
    tags: ["buff","grants_active_skill","intelligence","persistent","remnant"],
    description: "Eligible ailment-affected kills or critical hits can create collectible Mana Remnants, with a separate critical-trigger interval. Picking them up can overflow Mana. Not regeneration or guaranteed drops; per-pickup recovery stays separate from ground lifetime, collection frequency and sustained recovery.",
    passiveStatScopes: [], suggestions: [pickup,s("remnantEffect",2,"Native per-globe Mana scales with Remnant Effect, rounded down. This is not Mana regeneration, maximum Mana, more pickups or guaranteed overflow/sustain; collection frequency and available Remnants remain separate."),extraRemnant],
    exclusions: [...utilityExclusions,noCast,noDuration,{ id: "manaRegenerationRate", reason: "Collection recovery is not Mana regeneration and does not supply a base regeneration source." }], sourceUrl: source("act_int",15079) },
  { id: "mantra-of-destruction", name: "Mantra of Destruction", gemId: "Metadata/Items/Gems/SkillGemMantraOfDestruction",
    tags: ["buff","chaos","conditional","dexterity","duration","grants_active_skill","intelligence"],
    description: "Requires Combo from other strikes, then empowers the next Quarterstaff Attack with gained Chaos. Empowered kills can grant separate Purple Flames. This non-damaging action's timers and movement stay separate from recipient hits, Combo supply, kills and sustained Chaos damage.",
    passiveStatScopes: [], suggestions: [s("skillDuration",2,"Reviewed primary and secondary buff windows, not Combo decay, empowerment magnitude, automatic kills or guaranteed Purple Flames."),
      s("skillMovementPenaltyReduction",1,"Less movement penalty while performing the activation, not global Movement Speed, Combo generation or recipient attack speed.")],
    exclusions: [...utilityExclusions,noCast], sourceUrl: source("act_int",15331) },
  { id: "savage-fury", name: "Savage Fury", gemId: "Metadata/Items/Gems/SkillGemSavageFury",
    tags: ["buff","duration","grants_active_skill","intelligence","persistent","strength"],
    description: "Attack events build Fury for a separate animal-form frenzy granting damage and Onslaught while losing Life. Returning human ends it; Fury cannot build during frenzy. Activation movement and recovery utility do not imply maximum Fury, permanent frenzy or recipient DPS.",
    passiveStatScopes: [], suggestions: [...recovery,s("skillMovementPenaltyReduction",1,"Movement-penalty utility during the granted activation, not animal-form attack speed, Onslaught strength or Fury generation.")],
    exclusions: [...utilityExclusions,noCast,{ id: "skillDuration", reason: "The granted component's captured half-second timer is not a validated full-frenzy uptime model. No automatic duration priority, resource count or permanent animal form is inferred." }], sourceUrl: source("act_str",16376) },
  { id: "shard-scavenger", name: "Shard Scavenger", gemId: "Metadata/Items/Gems/SkillGemShardScavenger",
    tags: ["buff","cold","dexterity","duration","fire","grants_active_skill","lightning","persistent","physical","strength"],
    description: "Consuming specified enemy conditions can reload Crossbows, restore one Grenade cooldown use and briefly prevent ammunition consumption. Context-only: consumption events, ammo-free duration and a separate trigger lockout remain distinct; native timing is not guaranteed permanent ammo or Grenade supply.",
    passiveStatScopes: [], suggestions: [], exclusions: [...utilityExclusions,noCast,{ id: "cooldownRecoveryRate", reason: "Restoring a Grenade use is not generic cooldown recovery for this buff's internal trigger lockout." },
      { id: "skillDuration", reason: "Native primary and secondary timers both change with Duration. A longer ammo-free window does not establish a shorter lockout or a net uptime gain." }], sourceUrl: source("act_str",16893) },
  { id: "siphon-elements", name: "Siphon Elements", gemId: "Metadata/Items/Gems/SkillGemSiphonElements",
    tags: ["buff","cold","fire","grants_active_skill","intelligence","lightning","persistent","remnant"],
    description: "Freeze, Shock or Ignite can create matching Infusion Remnants. This buff supplies neither those ailments nor a consuming damage skill. Collection, eligible extra creations and held-Infusion lifetime stay separate; no guaranteed Infusions, increased Infusion count from effect or DPS assumed.",
    passiveStatScopes: [], suggestions: [pickup,extraRemnant,s("elementalInfusionDuration",1,"Holding time of collected Elemental Infusions, not ground Remnant lifetime, application chance or stronger recipient damage. Requires actual collection and an applicable consumer.")],
    exclusions: [...utilityExclusions,noCast,noDuration,{ id: "remnantEffect", reason: "A generic Remnant-effect modifier is not proven to increase discrete Infusion counts or their separate potency. This initial focus does not suggest it for Siphon Elements." }], sourceUrl: source("act_int",17735) },
  { id: "trinity", name: "Trinity", gemId: "Metadata/Items/Gems/SkillGemTrinity",
    tags: ["buff","cold","dexterity","fire","grants_active_skill","intelligence","lightning","persistent"],
    description: "Elemental-hit history builds Affinity that empowers recipient Elemental damage and is spent or decays separately. Context-only: no automatic damage priorities without a recipient and Affinity model. Configured Affinity is not generation, maximum-stack uptime or a guaranteed damage bonus.",
    passiveStatScopes: [], suggestions: [], exclusions: [...utilityExclusions,noCast,noDuration], sourceUrl: source("act_int",21777) },
];

type Kind = "duration" | "cost" | "mobility";
const ids: Record<Kind, readonly string[]> = {
  duration: ["elemental-conflux","emergency-reload","mantra-of-destruction","savage-fury","shard-scavenger"],
  cost: ["emergency-reload"], mobility: ["mantra-of-destruction","savage-fury"],
};
export const reviewedResourceChargeSupportIds = (kind: Kind): readonly string[] => ids[kind];
export function resourceChargeSupportOverrides(kind: Kind, amount = 0): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(ids[kind].map(id => {
    const summary = kind === "duration" ? `${amount}% more Skill Effect Duration. ${id === "elemental-conflux" ? "Extends the randomly chosen Element's interval, including unwanted rolls; not guaranteed more damage or preferred-element uptime." : id === "shard-scavenger" ? "Native primary and secondary timers both grow. This does not prove a shorter trigger lockout or improved ammo-free uptime; consumption events and restored Grenade uses are not supplied." : id === "savage-fury" ? "Changes the granted activation's short timer, not a validated full-frenzy duration. No maximum Fury, permanent animal form, repeated activation or damage multiplier is assumed." : id === "mantra-of-destruction" ? "Extends primary/secondary buff timers, not Combo decay, gained-Chaos magnitude, qualifying kills or guaranteed Purple Flames." : "Extends the supplied ammunition-empowerment window, not the independent reload cooldown, bolt count or guaranteed damage."} ${id === "emergency-reload" ? "The non-persistent activation's Mana cost rises by 20%." : "Persistent reservation is unchanged; zero-cost activations do not gain useful Efficiency by default."}`
      : kind === "cost" ? `${amount}% less Emergency Reload Mana cost before rounding, not regeneration or firing cost. This non-persistent instant action still has its cooldown and temporary ammunition-empowerment window; sustainable use is not assumed.`
      : `25% less movement penalty during ${id === "savage-fury" ? "the granted Savage Fury activation" : "Mantra activation"}, not global Movement Speed, recipient attack speed, Combo/Fury generation or a damage bonus. Zero activation Mana does not remove prerequisites or parent reservation.`;
    return [id,{ summary,priorities: [] }];
  }));
}

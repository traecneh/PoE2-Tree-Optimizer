import type { PassivePreferenceId } from "./passivePreferences";
import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

const s = (id: PassivePreferenceId, weight: number, reason: string): SkillPreferencePreset["suggestions"][number] => ({ id, weight, reason });
const source = (file: string, line: number) => `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/${file}.lua#L${line}`;
const utilityExclusions: SkillPreferencePreset["exclusions"] = (["spellDamage","attackDamage","criticalChance","criticalDamageBonus","minionDamage"] as const).map(id => ({ id,
  reason: "These modifiers do not strengthen this selected utility/buff effect. Recipient attacks, separately granted retaliation hits and recovery amounts are not its damage or buff magnitude." }));
const noDuration = { id: "skillDuration" as const, reason: "This persistent effect's generation, recovery or stack timer is not ordinary Skill Effect Duration. Reservation and separate granted components stay separate." };
const bannerTags = ["area","aura","banner","buff","conditional","dexterity","duration","grants_active_skill","persistent","strength"];
const bannerSuggestions: SkillPreferencePreset["suggestions"] = [
  s("auraMagnitude",3,"Strengthens the planted Banner's Aura. Generic Aura and Banner-only modifiers each count once, not again as recipient damage, speed or defence. No recipient gear, caps or guaranteed uptime assumed."),
  s("gloryGeneration",2,"Generation utility for the Banner's required attacking events, not immediate or maximum Glory. Faster generation does not guarantee a planted Banner or permanent uptime."),
  s("skillDuration",2,"Extends the planted Aura window, not its magnitude, passive reservation or Glory generation rate."),
  s("areaOfEffect",1,"Generic and Banner-only application coverage, not radius percentage, Aura strength or damage per hit."),
];

export const defensiveBuffSkillPreferencePresets: readonly SkillPreferencePreset[] = [
  { id: "war-banner", name: "War Banner", gemId: "Metadata/Items/Gems/SkillGemWarBanner", tags: bannerTags,
    description: "Planted Aura utility, not an attack. Attacking generates required Glory; the Aura grants Attack Damage, Attack Speed and Accuracy to you and allies. Recipient damage, 30-Spirit reservation, duration and planting availability are separate.",
    passiveStatScopes: ["bannerAuraMagnitude","bannerAreaOfEffect","bannerGloryGeneration"], suggestions: bannerSuggestions, exclusions: utilityExclusions, sourceUrl: source("act_str",20555) },
  { id: "defiance-banner", name: "Defiance Banner", gemId: "Metadata/Items/Gems/SkillGemDefianceBanner", tags: bannerTags,
    description: "Planted Aura utility granting Armour, Evasion and Movement Speed to you and allies. Attacks must generate the required Glory. Recipient defences do not strengthen the Aura; reservation, coverage, duration and sustained availability remain separate.",
    passiveStatScopes: ["bannerAuraMagnitude","bannerAreaOfEffect","bannerGloryGeneration"], suggestions: bannerSuggestions, exclusions: utilityExclusions, sourceUrl: source("act_str",3444) },
  { id: "dread-banner", name: "Dread Banner", gemId: "Metadata/Items/Gems/SkillGemDreadBanner", tags: bannerTags,
    description: "Planted Aura utility granting Elemental Ailment Threshold, maximum Elemental Resistances and Flask charges. Requires attack-generated Glory. Ordinary resistances, their caps, Flask recovery and recipient defence remain distinct; no permanent protection or charge sustain is assumed.",
    passiveStatScopes: ["bannerAuraMagnitude","bannerAreaOfEffect","bannerGloryGeneration"], suggestions: bannerSuggestions, exclusions: utilityExclusions, sourceUrl: source("act_str",3818) },
  { id: "arctic-armour", name: "Arctic Armour", gemId: "Metadata/Items/Gems/SkillGemArcticArmour",
    tags: ["buff","cold","grants_active_skill","intelligence","persistent","spell","stages","sustained"],
    description: "Cold spell-retaliation focus: enemy Melee hits consume barrier stages. Not Armour or automatic incoming-damage reduction. Source-based damage preferences are not native-validated DPS; stage damage is missing from captured PoB output. No maximum stages or hit frequency assumed.",
    passiveStatScopes: ["spellCriticalChance","spellCriticalDamageBonus"],
    suggestions: [s("coldDamage",3,"Source explicitly supplies Cold spell damage per stage. Native damage output is incomplete; no stage count, enemy hit rate, total damage or guaranteed retaliation assumed."),
      s("spellDamage",2,"Applies to the source-declared Cold spell retaliation, not a defensive barrier, Armour or player attacks. Captured native damage remains unmodeled."),
      s("elementalDamage",2,"Applicable to the source's Cold portion, not automatic Chill/Freeze uptime or incoming Elemental mitigation."),
      s("cooldownRecoveryRate",1,"Improves the separate retaliation cooldown, not stage generation, Cast Speed or guaranteed enemy Melee hits.")],
    exclusions: [{ id: "attackDamage", reason: "The retaliation is a spell, not an attack." },{ id: "castSpeed", reason: "The captured retaliation has no self-cast cadence; Cast Speed did not change its cooldown or zero action rate." },
      { id: "spellAreaDamage", reason: "No damaging area component is declared for the selected retaliation; a burst description alone is not an Area flag." },noDuration], sourceUrl: source("act_int",287) },
  { id: "barkskin", name: "Barkskin", gemId: "Metadata/Items/Gems/SkillGemBarkskin",
    tags: ["buff","duration","grants_active_skill","intelligence","persistent","strength"],
    description: "Enemy hits damaging Energy Shield grant temporary stacking Armour, capped by Item Armour on equipped armour items. Not the old Bark/Evasion mechanic. ES capacity, actual loss, item cap and six-second duration remain separate; native gain is unmodeled.",
    passiveStatScopes: [], suggestions: [s("armour",3,"Scales player Armour, not the Item Armour cap itself. Armour supplied by actual ES losses requires enemy hits and equipment; no capped stack amount or mitigation is calculated."),
      s("energyShield",2,"Defensive capacity for the required ES-loss setup, not automatic Armour generation, damage taken or a larger Item Armour cap."),
      s("skillDuration",2,"Extends the six-second gained-Armour window, not Armour per ES lost, the item-based cap or reservation.")],
    exclusions: utilityExclusions, sourceUrl: source("act_str",1323) },
  { id: "ghost-dance", name: "Ghost Dance", gemId: "Metadata/Items/Gems/SkillGemGhostDance",
    tags: ["buff","dexterity","grants_active_skill","intelligence","persistent"],
    description: "Ghost Shroud recovery utility using Evasion and Energy Shield. Hits consume Shrouds; cooldown recovery affects generation interval. Native recovery amount is incomplete. This is not ES Recharge, unconditional regeneration, guaranteed Shroud availability or damage.",
    passiveStatScopes: [], suggestions: [s("evasion",3,"Source ties Ghost Shroud recovery to Evasion. Native recovery amount/timing is incomplete; evasion avoidance and available Shrouds do not guarantee sustain."),
      s("energyShield",2,"ES capacity for the recovery setup, not a larger Evasion-based recovery amount or a recharge multiplier."),
      s("cooldownRecoveryRate",2,"Source explicitly applies cooldown recovery to the Shroud repeat interval; native 10.131 seconds falls to 8.448 with 20% increased recovery. No hit or Shroud uptime assumed.")],
    exclusions: [...utilityExclusions,noDuration,{ id: "energyShieldRechargeRate", reason: "Shroud recovery is not ES Recharge; recharge-rate bonuses do not increase this source." }], sourceUrl: source("act_int",10801) },
  { id: "grim-feast", name: "Grim Feast", gemId: "Metadata/Items/Gems/SkillGemGrimFeast",
    tags: ["buff","grants_active_skill","intelligence","minion","persistent","remnant","spell"],
    description: "Collect Life from dead reviving Minions, then spend it with Grim Resurrection. Not the old ES-overflow mechanic. Stored-Life cap, remnant supply, pickup and recipient revival costs remain separate; higher Minion Life does not guarantee more revivals.",
    passiveStatScopes: [], suggestions: [s("presenceArea",2,"Coverage for eligible Minion deaths in Presence, not remnant duration, pickup radius, stored-Life cap or more Life per corpse."),
      s("castSpeed",1,"Application responsiveness of granted Grim Resurrection, not the persistent parent. Its cooldown caps native repeated-use rate; no revival count or continuous use assumed."),
      s("cooldownRecoveryRate",1,"Cooldown utility for the granted resurrection action, not Minion revival rate, Life storage or corpse supply.")],
    exclusions: [...utilityExclusions,noDuration,{ id: "energyShieldRechargeRate", reason: "Current Grim Feast stores Minion Life for resurrection, not Energy Shield recovery or overflow." }], sourceUrl: source("act_int",11132) },
  { id: "iron-ward", name: "Iron Ward", gemId: "Metadata/Items/Gems/SkillGemIronWard",
    tags: ["area","buff","grants_active_skill","nova","persistent","physical","strength"],
    description: "Mitigated-Physical-damage storage with a separately released spike nova. Armour helps prevention; it is not free stored damage. This focus scores storage utility and nova coverage only: the native nova's stored-damage base is unmodeled. No always-full storage or DPS assumed.",
    passiveStatScopes: [], suggestions: [s("armour",3,"Physical mitigation contributes to the source's storage condition. Incoming Physical hits, hit size, stored cap and release damage are not calculated."),
      s("areaOfEffect",1,"Coverage of the granted spike nova, not stored damage, mitigation, damage per hit or guaranteed contacts.")],
    exclusions: [...utilityExclusions,{ id: "physicalDamage", reason: "Physical Damage does not increase incoming mitigation or storage. The nova's stored-damage base is not modeled by this utility focus." },noDuration], sourceUrl: source("act_str",7929) },
  { id: "magma-barrier", name: "Magma Barrier", gemId: "Metadata/Items/Gems/SkillGemMagmaBarrier",
    tags: ["area","attack","buff","fire","grants_active_skill","melee","persistent","strength","trigger"],
    description: "Shield-block utility, not a self-used attack. After lava charges, a raised-Shield Block triggers Magma Spray and an Endurance Charge. This focus scores Block and secondary coverage; shield damage, charge supply, full imbue and uptime are not assumed.",
    passiveStatScopes: [], suggestions: [s("blockChance",3,"Increased Block Chance for a block-capable Shield setup, not added percentage points, maximum Block Chance or guaranteed raised-Shield blocks."),
      s("areaOfEffect",1,"Coverage of separately triggered Magma Spray, not Block Chance, faster lava recharge or guaranteed spray contacts.")],
    exclusions: [...utilityExclusions,{ id: "attackSpeed", reason: "Triggered Magma Spray has no attack/cast time. Attack Speed does not shorten the parent's eight-second lava charge-up." },
      { id: "fireDamage", reason: "Fire Damage does not strengthen the block buff; shield-scaled Magma Spray damage is outside this utility focus." },noDuration], sourceUrl: source("act_str",13451) },
  { id: "scavenged-plating", name: "Scavenged Plating", gemId: "Metadata/Items/Gems/SkillGemScavengedPlating",
    tags: ["buff","duration","grants_active_skill","persistent","physical","strength"],
    description: "Temporary Armour/Thorns stacks require Fully Breaking enemy Armour. Enemy rarity changes stacks gained; the cap is ten. This focus scores Armour and eight-second stack duration, not automatic Armour Break, permanent maximum stacks or Thorns DPS.",
    passiveStatScopes: [], suggestions: [s("armour",3,"Player Armour benefits while stacks exist. Fully Broken Armour events and rarity are required; no automatic ten-stack mitigation or Thorns damage inferred."),
      s("skillDuration",2,"Extends the eight-second stack timer, not stacks gained, maximum stacks, Armour Break amount or Thorns per stack.")],
    exclusions: utilityExclusions, sourceUrl: source("act_str",16620) },
  { id: "time-of-need", name: "Time of Need", gemId: "Metadata/Items/Gems/SkillGemTimeOfNeed",
    tags: ["buff","grants_active_skill","intelligence","persistent","strength"],
    description: "Periodic flat-Life recovery and removal of Curses and Elemental Ailments. Cooldown recovery shortens the blessing interval, not healing per blessing. Not Life regeneration, percentage-Life recovery or permanent immunity; native recovery amount and actual sustain are incomplete.",
    passiveStatScopes: [], suggestions: [s("cooldownRecoveryRate",3,"Source explicitly applies cooldown recovery to the blessing repeat interval. Native 8.118 seconds falls to 6.765 with 20% increased recovery; recovery amount, missing Life and guaranteed protection are not calculated.")],
    exclusions: [...utilityExclusions,noDuration,{ id: "lifeRegenerationRate", reason: "The blessing is periodic flat recovery, not Life regeneration; this modifier did not change its captured interval or recovery output." }], sourceUrl: source("act_str",19592) },
  { id: "wind-dancer", name: "Wind Dancer", gemId: "Metadata/Items/Gems/SkillGemWindDancer",
    tags: ["area","attack","buff","dexterity","grants_active_skill","melee","persistent","stages","trigger"],
    description: "Stage-based Evasion utility. Enemy hits consume all stages and trigger Gale Force. This focus scores Evasion and secondary coverage, not equipped-weapon damage, guaranteed Knockback or repeated retaliation. The fixed stage timer is not ordinary duration or cooldown recovery.",
    passiveStatScopes: [], suggestions: [s("evasion",3,"Scales player Evasion under the stage-based multiplier, without assuming maximum stages, enemy contacts or exact avoidance."),
      s("areaOfEffect",1,"Coverage of separately triggered Gale Force, not Evasion, stage generation or guaranteed enemy hits.")],
    exclusions: [...utilityExclusions,noDuration,{ id: "attackSpeed", reason: "Gale Force is triggered with no attack/cast time; displayed weapon action speed is not retaliation frequency or the stage-generation timer." },
      { id: "cooldownRecoveryRate", reason: "The parent stage-generation timer is not marked as cooldown-scaled. The separate triggered hit cooldown does not speed stage recovery." }], sourceUrl: source("act_dex",10967) },
];

type Kind = "area" | "duration" | "mobility" | "rapid" | "controlled" | "concentrated" | "brutality";
const ids: Record<Kind, readonly string[]> = {
  area: ["war-banner","defiance-banner","dread-banner","iron-ward","magma-barrier","wind-dancer"],
  duration: ["war-banner","defiance-banner","dread-banner","barkskin","scavenged-plating"],
  mobility: ["war-banner","defiance-banner","dread-banner","grim-feast","iron-ward"],
  rapid: ["grim-feast"], controlled: ["arctic-armour"],
  concentrated: ["iron-ward","magma-barrier","wind-dancer"], brutality: ["iron-ward","wind-dancer"],
};
export const reviewedDefensiveBuffSupportIds = (kind: Kind): readonly string[] => ids[kind];
export function defensiveBuffSupportOverrides(kind: Kind, amount = 0, tierFlag = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(ids[kind].map(id => {
    const banner = id.endsWith("banner");
    const summary = kind === "area" ? `${amount}% increased area, not radius or magnitude. ${banner ? "Widens the planted Aura, not its recipient stats or Glory rate." : "Only the granted nova/retaliation coverage changes; it does not strengthen the persistent defensive buff."} The parent still reserves 30 Spirit; no extra targets or uptime assumed.`
      : kind === "duration" ? `${amount}% more Skill Effect Duration. ${banner ? "Extends planted Aura duration, not strength, Glory or reservation." : id === "barkskin" ? "Extends temporary Armour duration, not Armour per ES lost or its Item Armour cap." : "Extends temporary stack duration, not ten guaranteed stacks, Fully Broken Armour events or Thorns damage."} Parent reservation remains 30 Spirit; no permanent uptime assumed.`
      : kind === "mobility" ? `25% less movement penalty while ${banner ? "planting the Banner" : id === "grim-feast" ? "using Grim Resurrection" : "releasing the nova"}, not global Movement Speed, cooldown recovery, recipient speed or persistent buff magnitude. Zero action cost does not remove the parent's 30-Spirit reservation.`
      : kind === "rapid" ? `${amount}% increased Cast Speed for granted Grim Resurrection, not Minion casts or the persistent parent. Native repeated-use rate remains capped by its cooldown; remnant supply, stored Life and revival count are not assumed.`
      : kind === "controlled" ? "25% more spell-hit damage but no critical hits. Applies to source-declared Cold retaliation, not incoming mitigation or stage supply. Native stage damage is unmodeled; no net DPS gain or guaranteed contacts assumed. Manual crit priorities remain with warnings."
      : kind === "concentrated" ? `30% more area damage and 50% less area, not radius, for the separately granted ${id === "iron-ward" ? "spike nova" : id === "magma-barrier" ? "Magma Spray" : "Gale Force"}. Persistent defence, storage and stage generation are unchanged; native missing stored/shield damage is not a measured DPS gain.`
      : `${amount}% more Physical damage and no Elemental/Chaos damage for the granted ${id === "iron-ward" ? "nova, whose stored base damage is unmodeled" : "Gale Force hit"}. ${tierFlag ? "Hits have 20% chance to ignore Physical Damage Reduction, not unconditional penetration. " : ""}The persistent defensive buff is unchanged; no storage, stage or enemy-hit uptime assumed.`;
    return [id,{ summary, priorities: [] }];
  }));
}

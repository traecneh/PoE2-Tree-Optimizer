import type { PassivePreferenceId } from "./passivePreferences";
import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

const identities = [
  {
    "id": "barrier-invocation",
    "name": "Barrier Invocation",
    "gemId": "Metadata/Items/Gems/SkillGemBarrierInvocation",
    "tags": [
      "buff",
      "dexterity",
      "grants_active_skill",
      "intelligence",
      "invocation",
      "meta",
      "persistent",
      "trigger"
    ]
  },
  {
    "id": "blasphemy",
    "name": "Blasphemy",
    "gemId": "Metadata/Items/Gems/SkillGemBlasphemy",
    "tags": [
      "area",
      "aura",
      "buff",
      "grants_active_skill",
      "intelligence",
      "meta",
      "persistent"
    ]
  },
  {
    "id": "blink",
    "name": "Blink",
    "gemId": "Metadata/Items/Gems/SkillGemBlinkReservation",
    "tags": [
      "buff",
      "grants_active_skill",
      "intelligence",
      "persistent",
      "spell",
      "travel"
    ]
  },
  {
    "id": "cast-on-critical",
    "name": "Cast on Critical",
    "gemId": "Metadata/Items/Gems/SkillGemCastOnCriticalStrike",
    "tags": [
      "buff",
      "grants_active_skill",
      "intelligence",
      "meta",
      "persistent",
      "trigger"
    ]
  },
  {
    "id": "cast-on-dodge",
    "name": "Cast on Dodge",
    "gemId": "Metadata/Items/Gems/SkillGemCastOnDodge",
    "tags": [
      "buff",
      "dexterity",
      "grants_active_skill",
      "intelligence",
      "meta",
      "persistent",
      "trigger"
    ]
  },
  {
    "id": "cast-on-elemental-ailment",
    "name": "Cast on Elemental Ailment",
    "gemId": "Metadata/Items/Gems/SkillGemCastOnElementalAilment",
    "tags": [
      "buff",
      "cold",
      "fire",
      "grants_active_skill",
      "intelligence",
      "lightning",
      "meta",
      "persistent",
      "trigger"
    ]
  },
  {
    "id": "cast-on-minion-death",
    "name": "Cast on Minion Death",
    "gemId": "Metadata/Items/Gems/SkillGemCastOnMinionDeath",
    "tags": [
      "buff",
      "grants_active_skill",
      "intelligence",
      "meta",
      "minion",
      "persistent",
      "trigger"
    ]
  },
  {
    "id": "elemental-invocation",
    "name": "Elemental Invocation",
    "gemId": "Metadata/Items/Gems/SkillGemElementalInvocation",
    "tags": [
      "buff",
      "cold",
      "dexterity",
      "fire",
      "grants_active_skill",
      "intelligence",
      "invocation",
      "lightning",
      "meta",
      "persistent",
      "trigger"
    ]
  },
  {
    "id": "feral-invocation",
    "name": "Feral Invocation",
    "gemId": "Metadata/Items/Gems/SkillGemFeralInvocation",
    "tags": [
      "buff",
      "grants_active_skill",
      "intelligence",
      "invocation",
      "meta",
      "persistent",
      "strength"
    ]
  },
  {
    "id": "lingering-illusion",
    "name": "Lingering Illusion",
    "gemId": "Metadata/Items/Gems/SkillGemLingeringIllusion",
    "tags": [
      "buff",
      "dexterity",
      "duration",
      "grants_active_skill",
      "intelligence",
      "persistent",
      "remnant"
    ]
  },
  {
    "id": "reapers-invocation",
    "name": "Reaper's Invocation",
    "gemId": "Metadata/Items/Gems/SkillGemReapersInvocation",
    "tags": [
      "buff",
      "dexterity",
      "grants_active_skill",
      "intelligence",
      "invocation",
      "meta",
      "persistent",
      "trigger"
    ]
  },
  {
    "id": "sacrifice",
    "name": "Sacrifice",
    "gemId": "Metadata/Items/Gems/SkillGemSacrifice",
    "tags": [
      "buff",
      "grants_active_skill",
      "intelligence",
      "minion",
      "persistent"
    ]
  },
  {
    "id": "arctic-howl",
    "name": "Arctic Howl",
    "gemId": "Metadata/Items/Gems/SkillGemWolfArcticHowl",
    "tags": [
      "area",
      "buff",
      "cold",
      "duration",
      "grants_active_skill",
      "intelligence",
      "nova",
      "shapeshift",
      "strength",
      "warcry",
      "wolf"
    ]
  },
  {
    "id": "lunar-blessing",
    "name": "Lunar Blessing",
    "gemId": "Metadata/Items/Gems/SkillGemWolfLunarBlessing",
    "tags": [
      "area",
      "attack",
      "buff",
      "cold",
      "duration",
      "grants_active_skill",
      "intelligence",
      "shapeshift",
      "strength",
      "trigger",
      "warcry",
      "wolf"
    ]
  }
] as const;
const sourceLocations = [[ "act_int",713 ],[ "act_int",942 ],[ "act_int",1186 ],[ "act_int",2056 ],
  [ "act_int",2292 ],[ "act_int",2522 ],[ "act_int",2754 ],[ "act_int",5712 ],[ "act_str",5077 ],
  [ "act_int",14475 ],[ "act_int",16996 ],[ "act_int",17225 ],[ "act_str",648 ],[ "act_str",13203 ]] as const;
const s = (id: PassivePreferenceId, weight: number, reason: string): SkillPreferencePreset["suggestions"][number] => ({ id, weight, reason });
const energy = s("metaEnergyGain",2,"Meta Energy gain per eligible supplied event, not maximum Energy, trigger frequency or damage. Required events, spending and downtime are not simulated.");
const noCast = { id: "castSpeed" as const, reason: "This is not a self-cast recipient. Displayed cast speed does not establish trigger frequency, Energy supply or cooldown recovery." };
const utilityExclusions: SkillPreferencePreset["exclusions"] = (["attackDamage","spellDamage","minionDamage","totemDamage","criticalChance","criticalDamageBonus"] as const).map(id => ({ id,
  reason: "Recipient damage modifiers do not strengthen this non-damaging utility action. A recipient and actual triggering events must be supplied separately." }));
const descriptions: Record<string,string> = {
  "barrier-invocation": "Choose a triggered spell. Enemy Hit damage to Energy Shield supplies Energy; self-damage and ES expenditure are not supplied. Stored Energy, manual Invocation release and the recipient spell remain separate; no trigger rate or Full DPS is assumed.",
  blasphemy: "Choose a curse converted to a continuous Spirit-reserving aura. Curse magnitude and coverage matter, not self-cast speed, activation delay or finite curse duration. Per-curse reservation, curse limits and the native less-effect penalty remain separate.",
  blink: "Teleport replacing dodge roll while reserving Spirit. Cooldown recovery improves availability; native Cast Speed did not improve its cooldown-limited action. Not a damaging Spell or a free source of repeated dodge-trigger events.",
  "cast-on-critical": "Choose a triggered spell. Actual Critical Hits and enemy Power supply Energy; neither critical uptime nor an encounter target count is assumed. The socketed damage penalty is not fully modeled by the frozen native runtime.",
  "cast-on-dodge": "Choose a triggered spell. Distance actually travelled while dodge rolling supplies Energy, not stationary roll count or assumed Movement Speed. Energy requirements, triggered spell cost and repeated availability remain separate.",
  "cast-on-elemental-ailment": "Choose a triggered spell. Actual Ignite, Shock or Freeze events supply different Energy amounts based on enemy Power. Ailment magnitude does not establish application frequency, maximum Energy or permanent trigger uptime.",
  "cast-on-minion-death": "Choose a triggered player spell. Eligible Persistent Minion deaths supply Energy based on relative defensiveness and level. Temporary expiry, guaranteed deaths and unlimited revival cycles are not assumed; player spell damage is not Minion damage.",
  "elemental-invocation": "Choose a triggered spell. Actual elemental ailments supply Energy; spending stored Energy requires manual Invocation. No maximum Energy, free release, ailment uptime or automatic repeated casts is assumed.",
  "feral-invocation": "Choose a reviewed animal-form attack for a visage. Mana actually spent supplies Energy; each visage attacks once. Visages are not Minions or Totems. No channelled sequences, repeated contacts, free Mana or sustained DPS is assumed.",
  "lingering-illusion": "Dodge rolling leaves a short-lived illusion. Enemy destruction, not expiry alone, creates a collectible Power Charge Remnant. Lifetime, collection and charge holding time remain separate; no Minion damage, guaranteed destruction or permanent charges assumed.",
  "reapers-invocation": "Choose a triggered spell. Melee Attack kills supply Energy based on enemy Power; kills and an additional spell recipient are required. No kill supply against an isolated boss or maximum-Energy uptime is assumed.",
  sacrifice: "Allows reviving Undead Minions to substitute for corpses, but slows their revival. Faster revival can offset that penalty; this is not Minion damage, corpse-skill damage or guaranteed sustainable sacrifice cycles.",
  "arctic-howl": "Werewolf Cold-damage Warcry, neither Attack nor Spell. Freeze-dependent empowerment, enemy Power and Endurance-Charge cooldown bypass remain conditional. Cold area damage, coverage, Warcry cadence and buff duration stay separate; no guaranteed Freeze or recipient damage assumed.",
  "lunar-blessing": "Werewolf Warcry spends supplied Rage to extend its Cold-granting buff. Eligible melee hits trigger separate Moonbeams. Buff duration, Warcry cooldown, recipient attacks and beams stay separate; Rage capacity is not supplied Rage or permanent uptime.",
};
const suggestions: Record<string,SkillPreferencePreset["suggestions"]> = {
  "barrier-invocation": [energy,s("energyShield",1,"Defensive ES buffer against supplied Enemy Hits, not an Energy source, damage multiplier or guaranteed incoming Hit rate.")],
  blasphemy: [], blink: [s("cooldownRecoveryRate",3,"Recovery of Blink's separate teleport cooldown, not Cast Speed, travel distance or trigger Energy.")],
  "cast-on-critical": [energy], "cast-on-dodge": [energy], "cast-on-elemental-ailment": [energy], "cast-on-minion-death": [energy],
  "elemental-invocation": [energy], "feral-invocation": [energy],
  "lingering-illusion": [s("skillDuration",1,"Longer illusion lifetime, not guaranteed enemy destruction or a longer Remnant ground timer."),
    s("remnantPickupRange",2,"Collection utility for Remnants actually created, not generation or guaranteed Power Charges."),
    s("additionalRemnantChance",1,"Extra Remnant chance on an eligible creation event, not guaranteed illusion destruction."),
    s("maximumPowerCharges",1,"Capacity for collected charges, not charge generation or critical chance."),
    s("powerChargeDuration",1,"Natural holding time of supplied charges, not illusion lifetime or generation.")],
  "reapers-invocation": [energy],
  sacrifice: [s("minionRevivalSpeed",2,"Faster revival of eligible persistent Minions offsets part of Sacrifice's less-revival-speed penalty; not action speed, corpse availability or guaranteed sustain.")],
  "arctic-howl": [s("coldDamage",3,"The selected Warcry deals Cold damage; the empowerment recipient is separate."),
    s("elementalDamage",2,"Benefits the Warcry's Cold damage, not guaranteed Freeze or empowered attacks."),
    s("areaDamage",1,"Damage of the Cold Warcry area, neither Attack nor Spell Area Damage."),
    s("areaOfEffect",1,"Generic coverage, not radius percentage or extra targets."),
    s("warcrySpeed",1,"Warcry action time, not cooldown recovery or Freeze uptime."),
    s("warcryCooldownRecoveryRate",1,"Warcry cooldown recovery, not guaranteed Endurance-Charge bypass."),
    s("warcryAreaOfEffect",1,"Warcry-specific coverage, counted separately from generic area modifiers."),
    s("skillDuration",1,"Reviewed empowerment window, not Freeze uptime or extra hits."),
    s("manaCostEfficiency",1,"Warcry activation cost, not Mana regeneration or sustain."),
    s("skillMovementPenaltyReduction",1,"Movement penalty during activation, not global Movement Speed or Warcry cadence.")],
  "lunar-blessing": [s("skillDuration",2,"Buff window only, not Moonbeam frequency or guaranteed Rage supply."),
    s("warcrySpeed",1,"Parent Warcry activation, not Moonbeam attack speed."),
    s("warcryCooldownRecoveryRate",2,"Parent Warcry cooldown, not the separate Moonbeam cooldown."),
    s("manaCostEfficiency",1,"Parent activation cost, not free Moonbeams or sustained Mana."),
    s("maximumRage",1,"Rage capacity, not current Rage, generation or automatic maximum-duration buff.")],
};

export const utilityTriggerSkillPreferencePresets: readonly SkillPreferencePreset[] = identities.map((row,index) => ({
  ...row, description: descriptions[row.id], suggestions: suggestions[row.id],
  passiveStatScopes: row.id === "arctic-howl" ? ["secondaryAreaDamage"] : [],
  exclusions: row.id === "arctic-howl"
    ? [{ id: "attackDamage", reason: "The Warcry hit is not an Attack." },{ id: "spellDamage", reason: "The Warcry hit is not a Spell." },noCast]
    : [...utilityExclusions,noCast],
  sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/${sourceLocations[index][0]}.lua#L${sourceLocations[index][1]}`,
}));

const spells = ["fireball","arc","contagion","tornado"] as const;
export const utilityTriggerSocketChoices: Readonly<Record<string,readonly string[]>> = {
  "barrier-invocation": spells, "cast-on-critical": spells, "cast-on-dodge": spells,
  "cast-on-elemental-ailment": spells, "cast-on-minion-death": spells,
  "elemental-invocation": spells, "reapers-invocation": spells,
  "feral-invocation": ["maul","lunar-assault"], blasphemy: ["enfeeble","despair","vulnerability","temporal-chains"],
};
export const isUtilityTriggerFocus = (id: string) => Object.hasOwn(utilityTriggerSocketChoices,id);
const variants = new Map<string,SkillPreferencePreset>();
export function utilityTriggerSocketedPreset(base: SkillPreferencePreset, recipient: SkillPreferencePreset): SkillPreferencePreset {
  if (!isUtilityTriggerFocus(base.id) || !utilityTriggerSocketChoices[base.id].includes(recipient.id)) return base;
  const key = `${base.id}:${recipient.id}`, cached = variants.get(key);
  if (cached) return cached;
  const aura = base.id === "blasphemy", feral = base.id === "feral-invocation";
  const suggestions = aura ? [
    s("curseMagnitude",3,"Magnitude of the selected aura-converted curse, including its separate native less-effect penalty; generic Aura Magnitudes did not strengthen the captured curse."),
    s("curseArea",2,"Coverage of the selected curse aura, not self-cast activation delay."),
    s("areaOfEffect",1,"Generic curse-aura coverage, not damage or increased curse magnitude."),
  ] : [...base.suggestions, ...recipient.suggestions.filter(entry => !["castSpeed","skillMovementPenaltyReduction","manaCostEfficiency"].includes(entry.id))];
  if (feral) {
    const index = suggestions.findIndex(entry => entry.id === "attackSpeed");
    if (index >= 0) suggestions[index] = s("attackSpeed",1,"Visage single-attack action speed, not player activation, Energy generation, extra contacts or sustained DPS.");
  }
  const variant: SkillPreferencePreset = { ...base,
    description: `${recipient.name}: ${aura ? "continuous curse aura; magnitude and coverage only, not self-cast timing." : feral ? "single visage attack, not a Minion or Totem." : "triggered player spell; self-cast speed is not trigger frequency."} ${base.description}`,
    tags: [...new Set([...base.tags,...recipient.tags])].sort(),
    passiveStatScopes: aura ? [] : [
      ...(recipient.passiveStatScopes ?? []).filter(scope => !["spellHinderChance","attackBlindChance","attackMaimChance","attackIncisionChance"].includes(scope)),
      ...(!feral && recipient.suggestions.some(entry => entry.id === "spellDamage") ? ["triggeredSpellDamage"] as const : []),
    ],
    suggestions: [...new Map(suggestions.map(entry => [entry.id,entry])).values()],
    exclusions: aura ? [...utilityExclusions,noCast,
      { id: "auraMagnitude", reason: "Generic Aura Magnitudes did not increase the captured converted curse's effect." },
      { id: "curseDuration", reason: "A continuous curse aura has no self-cast finite curse timer." },
      { id: "curseActivation", reason: "Converted curse coverage is not delayed self-cast application." }]
      : [...recipient.exclusions.filter(entry => entry.id !== "castSpeed"),noCast,
        { id: "minionDamage", reason: "The selected recipient is a player spell or visage attack, not a Minion." },
        { id: "totemDamage", reason: "The recipient is not used by a Totem." }],
  };
  variants.set(key,variant);
  return variant;
}

type Kind = "area" | "duration" | "cost" | "mobility" | "concentrated";
const supportSkills: Record<Kind,readonly string[]> = {
  area: ["blasphemy","arctic-howl","lunar-blessing"], duration: ["lingering-illusion","arctic-howl","lunar-blessing"],
  cost: ["lingering-illusion","arctic-howl","lunar-blessing"], mobility: ["arctic-howl"],
  concentrated: ["arctic-howl","lunar-blessing"],
};
export const reviewedUtilityTriggerSupportIds = (kind: Kind): readonly string[] => supportSkills[kind];
export function utilityTriggerSupportOverrides(kind: Kind, amount = 0): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(supportSkills[kind].map(id => [id,{ priorities: [], summary:
    kind === "area" ? `${amount}% increased Area of Effect, not radius or damage. ${id === "blasphemy" ? "Coverage of the selected curse aura; Spirit reservation remains separate from displayed self-cast Mana." : id === "lunar-blessing" ? "Coverage of the separate Moonbeam, not buff strength, extra beams or guaranteed contacts." : "Warcry coverage, not guaranteed Freeze or empowered hits."}`
    : kind === "duration" ? `${amount}% more Skill Effect Duration, with 20% higher eligible Mana cost. ${id === "lingering-illusion" ? "Extends illusion lifetime, not the ground-Remnant timer or guaranteed enemy destruction." : id === "lunar-blessing" ? "Extends the parent buff window; Rage supply, beam frequency and the cooldown remain separate." : "Extends reviewed buff timers, not Freeze or charge supply."}`
    : kind === "cost" ? `${amount}% less eligible Mana cost before rounding, not Spirit reservation, regeneration or guaranteed sustain. ${id === "lingering-illusion" ? "Applies to the granted illusion action's cost, not dodge-roll cooldown or Remnant generation." : "Parent activation cost is separate from zero-cost secondary effects."}`
    : kind === "mobility" ? "25% less movement penalty during the Warcry activation, not global Movement Speed, damage or cooldown recovery."
    : `30% more eligible area damage and 50% less area, not radius. ${id === "lunar-blessing" ? "Applies to the separate Moonbeam hit, not the non-damaging parent buff or guaranteed repeated beams." : "Applies to the Cold Warcry, neither Attack nor Spell."} No extra contacts or sustained DPS assumed.`
  }]));
}

import type { PassivePreferenceId } from "./passivePreferences";
import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";
import { mirageArcherPreset, mirageArcherSocketIds } from "./persistentOffenceSkillPreferencePresets";
import { utilityTriggerSocketChoices, isUtilityTriggerFocus, utilityTriggerSocketedPreset } from "./utilityTriggerSkillPreferencePresets";

const s = (id: PassivePreferenceId, weight: number, reason: string): SkillPreferencePreset["suggestions"][number] => ({ id, weight, reason });
const minionExclusions: SkillPreferencePreset["exclusions"] = (["attackDamage", "spellDamage", "attackSpeed", "castSpeed"] as const).map(id => ({ id,
  reason: "Player damage and action speed are not Minion or Companion damage/speed. Summoning, mounted attacks and recipient buffs are separate components." }));
const minionSuggestions: SkillPreferencePreset["suggestions"] = [
  s("minionDamage",3,"Damage of the selected Minion's basic attack, not player damage or an assumed number of simultaneous attackers."),
  s("minionAttackSpeed",2,"Minion attack cadence only. Combined Attack and Cast Speed is scored once; player speed and summoning time remain separate."),
  s("minionLife",2,"Minion survival, not player Life, damage per hit or guaranteed uptime."),
];
const companionSuggestions: SkillPreferencePreset["suggestions"] = [
  ...minionSuggestions,
  s("companionAttackSpeed",2,"Separate Companion attack-speed modifiers improve this attack; combined Minion speed is not counted again here."),
  s("companionDamage",3,"Separate Companion-specific modifiers affect this Minion Companion. A single modifier is not copied into Minion Damage as well."),
  s("companionLife",2,"Companion-specific survival modifiers are distinct from generic Minion Life. Each actual stat line is counted once."),
  s("companionMovementSpeed",1,"Companion positioning utility, not attack speed, player mounted Movement Speed or guaranteed target contacts."),
];
const source = (file: string, line: number) => `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/${file}.lua#L${line}`;

export const proxySkillPreferencePresets: readonly SkillPreferencePreset[] = [
  { id: "ancestral-warrior-totem", name: "Ancestral Warrior Totem", gemId: "Metadata/Items/Gems/SkillGemAncestralWarriorTotem",
    tags: ["area","attack","conditional","duration","grants_active_skill","melee","meta","strength","totem"],
    description: "Select a socketed Mace attack. Spirit warriors are Totems, not Minions; each uses its skill once. Three Endurance Charges are required. Charge supply, idle animation, continuous attacks and total DPS are not assumed.",
    suggestions: [], exclusions: [], passiveStatScopes: [], sourceUrl: source("act_str",395) },
  { id: "spell-totem", name: "Spell Totem", gemId: "Metadata/Items/Gems/SkillGemMetaSpellTotem",
    tags: ["conditional","duration","grants_active_skill","intelligence","meta","spell","strength","totem"],
    description: "Select a socketed spell. Totem firing, placement and lifetime are separate. Consumes three Power/Endurance Charges; their mixture changes damage, Life and duration. No charge mixture, continuous supply, overlaps or total DPS is assumed.",
    suggestions: [], exclusions: [], passiveStatScopes: [], sourceUrl: source("act_str",18085) },
  { id: "raise-zombie", name: "Raise Zombie", gemId: "Metadata/Items/Gems/SkillGemRaiseZombie",
    tags: ["duration","grants_active_skill","intelligence","minion","physical"],
    description: "Unempowered Zombie basic Physical melee attack. A corpse or Power Charge is required. Temporary Minion lifetime, summoning and attacks are separate; empowered variants, ten-Zombie uptime and total DPS are not assumed.",
    passiveStatScopes: [], suggestions: [...minionSuggestions,
      s("minionDuration",1,"Temporary Minion lifetime only, not damage per hit, summoning speed or empowered-Zombie uptime."),
      s("skillDuration",1,"Generic Skill Effect Duration extends the captured temporary Zombie timer, independently of Minion-specific duration modifiers. No extra attacks are guaranteed.")],
    exclusions: minionExclusions, sourceUrl: source("act_int",16607) },
  { id: "rhoa-mount", name: "Rhoa Mount", gemId: "Metadata/Items/Gems/SkillGemRhoaMount",
    tags: ["buff","companion","dexterity","grants_active_skill","minion","persistent"],
    description: "Unmounted Rhoa Companion basic melee-hit focus, not the player's mounted Bow/Spear attacks. Persistent reservation, mounted movement penalties and Heavy Stun buildup are separate. No temporary Minion duration, mounted damage or total DPS is assumed.",
    passiveStatScopes: [], suggestions: companionSuggestions, exclusions: [...minionExclusions,
      { id: "skillDuration", reason: "The persistent Companion has no temporary summoning timer; mounted buffs and player skills are separate." }], sourceUrl: source("act_dex",6757) },
  { id: "shockwave-totem", name: "Shockwave Totem", gemId: "Metadata/Items/Gems/SkillGemShockwaveTotem",
    tags: ["area","attack","duration","grants_active_skill","melee","nova","slam","strength","totem"],
    description: "Totem Slam-hit focus, not its stronger Jagged Ground Eruption. The Totem cannot create Jagged Ground. Weapon damage depends on equipment; Mace and handedness are not inferred. Placement, twelve-second lifetime and repeated hits remain separate.",
    passiveStatScopes: ["attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackAreaDamage","meleeDamage","meleeStunBuildup"],
    suggestions: [s("totemDamage",3,"Benefits the Totem-used Slam, not player self-use, Minions or assumed external Jagged Ground."),
      s("attackDamage",2,"Generic Attack Damage is inherited by the selected Slam. Equipped weapon family and handedness are not supplied."),
      s("physicalDamage",3,"Benefits the reviewed base Physical Slam, not an assumed elemental weapon, conversion or secondary Eruption."),
      s("attackAreaDamage",1,"Area damage of the initial Slam, not coverage, Eruption availability or extra contacts."),
      s("areaOfEffect",1,"Generic and attack-scoped coverage, not damage per hit or guaranteed overlapping targets."),
      s("totemAreaOfEffect",1,"Totem-specific Slam coverage stays separate from generic area modifiers."),
      s("totemLife",1,"Totem survival, not player Life or an assumed damage multiplier."),
      s("totemPlacementSpeed",1,"Deployment utility, not the selected Slam's firing cadence."),
      s("attackSpeed",1,"Inherited generic Attack Speed changes Slam cadence, not player placement. No weapon family or sustained contacts assumed."),
      s("totemAttackSpeed",2,"Totem-specific attack cadence, separate from generic Attack Speed and player placement."),
      s("totemDuration",1,"Totem-specific lifetime modifiers, not Jagged Ground duration or Eruption frequency.")],
    exclusions: [{ id: "minionDamage", reason: "Totems are not Minions." },{ id: "spellDamage", reason: "The granted Slam is an attack, not a spell." },
      { id: "castSpeed", reason: "Cast Speed is neither placement nor Slam attack speed." },
      { id: "skillDuration", reason: "Use explicit Totem Duration for lifetime, not generic Skill Effect Duration or external Jagged Ground timers." }], sourceUrl: source("act_str",17403) },
  { id: "soul-offering", name: "Soul Offering", gemId: "Metadata/Items/Gems/SkillGemSoulOffering",
    tags: ["buff","duration","grants_active_skill","intelligence","minion"],
    description: "Sacrifice a Skeleton to create a Minion spike granting the player Spell Damage. The Offering itself deals no damage; the buff ends if the spike dies. Recipient damage, spike survival, duration and application are separate.",
    passiveStatScopes: [], suggestions: [s("minionLife",2,"Survival of the Offering spike, itself a Minion. This does not increase the player's received Spell Damage bonus."),
      s("skillDuration",2,"Extends the six-second Offering window, not buff strength; spike destruction can end it earlier."),
      s("castSpeed",1,"Player application speed only, not received buff magnitude or recipient spell damage.")],
    exclusions: [{ id: "spellDamage", reason: "The Offering grants Spell Damage to the player, but adding player Spell Damage does not strengthen this non-damaging buff." },
      { id: "minionDamage", reason: "The spike does not deal damage, and the buff recipient is the player, not Minions." },
      { id: "attackDamage", reason: "This selected Offering is not an attack." }], sourceUrl: source("act_int",19558) },
  { id: "tame-beast", name: "Tame Beast", gemId: "Metadata/Items/Gems/SkillGemTameBeast",
    tags: ["companion","dexterity","duration","grants_active_skill","minion","persistent"],
    description: "Capture-action focus only: Hinder a Rare Beast, then kill it within the capture window. The eventual Companion depends on the captured species. No beast attacks, stats, summon damage or sustained Companion behavior is invented.",
    passiveStatScopes: [], suggestions: [s("skillDuration",2,"Extends the 11.8-second capture window, not a summoned beast's lifetime, damage or guaranteed capture.")],
    exclusions: [...minionExclusions, { id: "minionDamage", reason: "No captured species or attacking Minion is supplied by the base capture action." },
      { id: "companionDamage", reason: "The eventual transformed beast is not selected; capture utility is not Companion attack damage." }], sourceUrl: source("act_dex",8874) },
  { id: "wolf-pack", name: "Wolf Pack", gemId: "Metadata/Items/Gems/SkillGemWolfPack",
    tags: ["companion","grants_active_skill","intelligence","minion","persistent","physical","strength"],
    description: "Wolf Companion basic melee-hit focus, not the separate leap. The entire pack counts as one Companion for limits and count-based effects. Persistent reviving Wolves do not imply temporary duration, simultaneous contacts or pack-multiplied DPS.",
    passiveStatScopes: [], suggestions: companionSuggestions, exclusions: [...minionExclusions,
      { id: "skillDuration", reason: "The reviving persistent pack has no temporary summoning timer; duration does not multiply pack size or contacts." }], sourceUrl: source("act_str",21319) },
];

const socketChoices: Readonly<Record<string, readonly string[]>> = {
  ...utilityTriggerSocketChoices,
  "mirage-archer": mirageArcherSocketIds,
  "ancestral-warrior-totem": ["armour-breaker","boneshatter","earthquake","leap-slam","rolling-slam","sunder"],
  "spell-totem": ["fireball","arc","contagion","tornado"],
};
export const isSocketedProxyFocus = (id: unknown): boolean => typeof id === "string" && Object.hasOwn(socketChoices,id);
export const proxySocketedSkillIds = (id: string): readonly string[] => Object.hasOwn(socketChoices,id) ? socketChoices[id] : [];
export function normalizeSocketedProxySkillId(focusId: unknown, value: unknown): string | undefined {
  return typeof focusId === "string" && typeof value === "string" && proxySocketedSkillIds(focusId).includes(value) ? value : undefined;
}
const variants = new Map<string, SkillPreferencePreset>();
export function socketedProxyPreset(base: SkillPreferencePreset, socketed: SkillPreferencePreset | undefined): SkillPreferencePreset {
  if (!socketed || !normalizeSocketedProxySkillId(base.id,socketed.id)) return base;
  if (base.id === "mirage-archer") return mirageArcherPreset(base,socketed);
  if (isUtilityTriggerFocus(base.id)) return utilityTriggerSocketedPreset(base,socketed);
  const key = `${base.id}:${socketed.id}`;
  const cached = variants.get(key);
  if (cached) return cached;
  const spell = base.id === "spell-totem";
  const suggestions = new Map(socketed.suggestions.map(entry => [entry.id,entry]));
  for (const entry of [s("totemDamage",3,"Totem-used damage of the selected socketed component, not deployment or Minion damage. Native penalties are not extra passive score multipliers."),
    s("totemLife",1,"Totem survival only; charge mixture and guaranteed uptime are not supplied."),
    s("totemPlacementSpeed",1,"Player placement utility, separate from Totem firing or the socketed skill's action time."),
    s("totemDuration",1,"Totem-specific lifetime utility. Generic Skill Effect Duration support left the captured parent Totem lifetime unchanged."),
    s(spell ? "totemCastSpeed" : "totemAttackSpeed",1,spell ? "Totem casting cadence, not player placement, DoT tick rate or guaranteed continuous charge supply." : "Totem attack action speed, not placement. Warriors act once and disappear; idle animation and Endurance Charge supply prevent assuming continuous attacks.")]) suggestions.set(entry.id,entry);
  const action = spell ? "castSpeed" : "attackSpeed";
  if (suggestions.has(action)) suggestions.set(action,s(action,1,"Inherited socketed action speed, not player placement, DoT ticks, idle time or guaranteed sustained Totem uptime."));
  if (suggestions.has("areaOfEffect")) suggestions.set("totemAreaOfEffect",s("totemAreaOfEffect",1,"Totem-specific coverage for the selected socketed component, not extra hits, overlaps or damage per second."));
  const exclusions = new Map(socketed.exclusions.map(e => [e.id,e]));
  exclusions.set("minionDamage",{ id: "minionDamage", reason: "These proxies are Totems, not Minions. The socketed skill inherits appropriate player modifiers, never Minion damage." });
  const variant: SkillPreferencePreset = { ...base,
    description: `${socketed.name} used by ${base.name}. Totem firing and placement remain separate. ${spell ? "Charge mixture, spell overlaps and continuous supply are not assumed." : "Each warrior attacks once; idle animation and three-Endurance-Charge supply are not sustained DPS."}`,
    tags: [...new Set([...base.tags,...socketed.tags])].sort(),
    passiveStatScopes: socketed.passiveStatScopes?.filter(scope => !["spellHinderChance","attackBlindChance","attackMaimChance","attackIncisionChance"].includes(scope)),
    suggestions: [...suggestions.values()], exclusions: [...exclusions.values()] };
  variants.set(key,variant);
  return variant;
}

type SupportKind = "area" | "duration" | "cost" | "mobility" | "rapid" | "concentrated" | "brutality" | "feeding";
const supportSkills: Record<SupportKind, readonly string[]> = {
  area: ["ancestral-warrior-totem","raise-zombie","rhoa-mount","shockwave-totem","wolf-pack"],
  duration: ["ancestral-warrior-totem","spell-totem","raise-zombie","shockwave-totem","soul-offering","tame-beast"],
  cost: ["ancestral-warrior-totem","spell-totem","raise-zombie","shockwave-totem","soul-offering","tame-beast"],
  mobility: ["spell-totem","raise-zombie","soul-offering"],
  rapid: ["raise-zombie","rhoa-mount","shockwave-totem","wolf-pack"],
  concentrated: ["ancestral-warrior-totem","raise-zombie","rhoa-mount","shockwave-totem","wolf-pack"],
  brutality: ["raise-zombie","rhoa-mount","shockwave-totem","wolf-pack"],
  feeding: ["raise-zombie","rhoa-mount","wolf-pack"],
};
export const reviewedProxySupportIds = (kind: SupportKind): readonly string[] => supportSkills[kind];
export function proxySupportOverrides(kind: SupportKind, amount = 0, tierFlag = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(supportSkills[kind].map(id => {
    const minion = ["raise-zombie","rhoa-mount","wolf-pack"].includes(id);
    const meta = isSocketedProxyFocus(id);
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage; higher cost where applicable. ${minion ? "The selected basic single-target Minion attack was unchanged; area eligibility alone does not make it area damage." : "Coverage of the eligible Totem-used component only; no overlaps or extra targets assumed."}`
      : kind === "duration" ? `${amount}% more Skill Effect Duration; 20% higher Mana cost. ${meta ? "The captured parent Totem lifetime remained 8.019 seconds; no generic-duration lifetime gain is claimed. Socketed spell timers are separate." : id === "shockwave-totem" ? "Compatibility does not prove an increase to the selected Slam's Totem lifetime; use explicit Totem Duration. Jagged Ground is external." : id === "tame-beast" ? "Extends the capture window, not an eventual beast's lifetime or damage." : id === "soul-offering" ? "Extends the Offering window, not player buff strength; spike death can end it early." : "Extends the temporary Zombie timer, not damage per hit or empowered-Zombie uptime."}`
      : kind === "cost" ? `${amount}% less supported action cost, not regeneration or sustain. ${meta ? "Charge requirements remain; the selected firing spell/attack and player deployment have separate costs." : id === "shockwave-totem" ? "Reduces parent deployment cost; the selected Slam's zero Mana output is not free deployment." : "Spirit reservation and costs of other actions remain separate."}`
      : kind === "mobility" ? "25% less movement penalty during player application, not global Movement Speed, Minion movement, Totem firing speed or damage."
      : kind === "rapid" ? `${amount}% increased supported attack speed. ${id === "shockwave-totem" ? "Affects the Totem's Slam cadence, not player placement, external Jagged Ground supply or guaranteed repeated contacts." : "Affects the Minion's basic attack, not player summoning. No attacker count, contact rate or sustained DPS assumed."}`
      : kind === "concentrated" ? `30% more area damage and 50% less area, not radius. ${minion ? "The selected basic single-target Minion hit was unchanged: do not score it as area damage." : "Applies only to eligible area hits of the selected socketed attack or Slam, not deployment or guaranteed targets."}`
      : kind === "brutality" ? `${amount}% more Physical damage; ${tierFlag ? "Hits have 20% chance to ignore Physical Damage Reduction, not guaranteed penetration; " : ""}Elemental and Chaos damage prohibited. ${minion ? "Applies to the Minion's attack, not player Physical Damage modifiers." : "Applies to the selected Physical Slam, not deployment."} Added damage, Poison and full-build conversion are not assumed; higher Mana cost where applicable.`
      : `30% more Minion damage but ${amount}% more damage taken. Minion survival is opt-in priority, not player damage, guaranteed uptime or a DPS simulation.`;
    return [id,{ summary, priorities: kind === "feeding" ? [s("minionLife",2,"Minion survival offsets exposure to Feeding Frenzy's increased damage taken; no guaranteed uptime or exact defensive equivalence.")] : [] }];
  }));
}

import type { PassivePreferenceId } from "./passivePreferences";
import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

const s = (id: PassivePreferenceId, weight: number, reason: string): SkillPreferencePreset["suggestions"][number] => ({ id, weight, reason });
const source = (file: string, line: number) => `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/${file}.lua#L${line}`;
const reservation = s("heraldReservationEfficiency",1,"Herald-specific reservation efficiency, not Mana-cost efficiency or a flat percentage of Spirit saved. Each actual modifier counts once, not once per active Herald.");
const coverage = s("areaOfEffect",1,"Generic and Herald-only coverage for this selected component, not radius percentage, extra targets or damage per hit.");
const heraldDamage = s("genericDamage",2,"Generic and Herald-specific damage modifiers count once here, not again in every damage-type preference. Trigger conditions, unscalable damage components and hit frequency remain separate.");
const noCasting = { id: "castSpeed" as const, reason: "This persistent buff or triggered attack is not a self-cast spell. Cast Speed is not reservation efficiency, trigger frequency or buff magnitude." };
const noAttackTiming = { id: "attackSpeed" as const, reason: "The granted Herald hit has no attack/cast time. Displayed action rate is not triggered-hit frequency or the supply of qualifying kills." };
const utilityExclusions: SkillPreferencePreset["exclusions"] = (["attackDamage","spellDamage","criticalChance","criticalDamageBonus","damageOverTime","poisonMagnitude","chaosDamage"] as const).map(id => ({ id,
  reason: "This focus describes a supplied buff, debuff, spread or storage action, not its own modeled damage. Recipient skills and their damage sources remain separate." }));
const minionSuggestions: SkillPreferencePreset["suggestions"] = [
  s("minionDamage",3,"Damage of the selected Minion's attacks, not player damage, Totem damage or Companion-only modifiers. No simultaneous-attacker count or sustained DPS assumed."),
  s("minionAttackSpeed",2,"Minion attack cadence only. A combined Minion Attack/Cast Speed line is counted once, not also as player or Minion Cast Speed."),
  s("minionDuration",1,"Temporary Minion lifetime, not attack damage, creation rate or guaranteed contacts. Replacement limits can prevent a proportional uptime benefit."),
  s("skillDuration",1,"Generic Skill Effect Duration changes the temporary Minion timer, separately from Minion-specific modifiers. It is not higher damage per second or faster generation."),
];
const minionExclusions: SkillPreferencePreset["exclusions"] = (["attackDamage","spellDamage","fireDamage","chaosDamage","attackSpeed","castSpeed","poisonMagnitude"] as const).map(id => ({ id,
  reason: "Player modifiers do not become Minion damage, attack speed or Poison magnitude. Use explicitly Minion-owned effects; creating or commanding a Minion does not change ownership." }));

export const persistentOffenceSkillPreferencePresets: readonly SkillPreferencePreset[] = [
  { id: "herald-of-ash", name: "Herald of Ash", gemId: "Metadata/Items/Gems/SkillGemHeraldOfAsh",
    tags: ["area","buff","duration","fire","grants_active_skill","herald","persistent","strength"],
    description: "Overkill-Ignite utility from qualifying non-Herald Attack kills. No hit, spell or automatic Overkill damage is invented. Ignite effect, explosion coverage and Spirit reservation stay separate; native Overkill-based burning and Ignite lifetime are incomplete.",
    passiveStatScopes: ["heraldAreaOfEffect"], suggestions: [s("igniteMagnitude",3,"Source explicitly inflicts Ignite from Overkill. This is outgoing Ignite magnitude, not a supplied Overkill amount, guaranteed kills or native-validated burning DPS."),
      s("igniteDuration",2,"Duration of supplied outgoing Ignites, not their damage per second. The native explosion timer does not establish complete Ignite-duration modeling."),coverage,reservation],
    exclusions: [{ id: "spellDamage", reason: "The Overkill-based Ignite is not a damaging spell hit." },{ id: "attackDamage", reason: "A qualifying attack supplies Overkill; the Herald's burning is not itself attack-hit damage." },
      { id: "damageOverTime", reason: "The described damage is Ignite, not an intrinsic non-ailment DoT. This preference is not inferred from the Duration tag." },noCasting], sourceUrl: source("act_str",7260) },
  { id: "herald-of-blood", name: "Herald of Blood", gemId: "Metadata/Items/Gems/SkillGemHeraldOfBlood",
    tags: ["area","attack","buff","dexterity","grants_active_skill","herald","payoff","persistent","physical","strength"],
    description: "Physical explosion after killing an enemy with Blood Loss. Not weapon-based; part of Blood Loss damage is unscalable. Cannot cause Bleeding. Native attack/area-specific scaling is incomplete, so this focus uses general/Herald damage, Physical damage and coverage.",
    passiveStatScopes: ["heraldDamage","heraldAreaOfEffect"], suggestions: [heraldDamage,
      s("physicalDamage",3,"Benefits the scalable Physical component, not the separate unscalable Blood Loss contribution. No weapon damage, accumulated Blood Loss or guaranteed kills assumed."),coverage,reservation],
    exclusions: [{ id: "attackDamage", reason: "Source calls this Attack damage, but the captured native Attack Damage control left the hit unchanged. Attack-specific scaling is outside this initial general/Herald-damage focus." },
      { id: "attackAreaDamage", reason: "The source declares area damage, but native Concentrated Area did not increase the captured explosion. Specific area-damage scaling remains incomplete." },
      { id: "bleedingChance", reason: "The explosion explicitly cannot cause Bleeding. Blood Loss and Aggravation require a separate Bleeding source." },
      { id: "spellDamage", reason: "The explosion is not a spell." },noCasting,noAttackTiming], sourceUrl: source("act_str",7457) },
  { id: "herald-of-ice", name: "Herald of Ice", gemId: "Metadata/Items/Gems/SkillGemHeraldOfIce",
    tags: ["area","attack","buff","cold","dexterity","grants_active_skill","herald","intelligence","payoff","persistent"],
    description: "Cold-converted explosion from Shattering with a qualifying non-Herald Attack Hit. The explosion cannot Freeze itself. Weapon damage, source Freeze, Shatter supply and repeated contacts are not assumed; attack damage and coverage remain separate from trigger frequency.",
    passiveStatScopes: ["heraldDamage","heraldAreaOfEffect","attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackAreaDamage","attackElementalDamage"],
    suggestions: [heraldDamage,s("attackDamage",2,"Benefits the Herald attack explosion. No equipped weapon family, melee classification or attack-speed-based trigger frequency is inferred."),
      s("coldDamage",3,"The selected explosion converts Physical damage fully to Cold. This does not supply the external Freeze or Shatter needed to activate it."),
      s("elementalDamage",2,"Benefits the Cold attack component; each modifier is counted once, not also as a Physical or Herald damage line."),
      s("attackAreaDamage",1,"Area damage of the explosion, not radius, Shatter availability or extra hits."),coverage,reservation],
    exclusions: [{ id: "freezeBuildup", reason: "The explosion cannot Freeze; an external qualifying attack must supply the Shatter condition." },
      { id: "spellDamage", reason: "The explosion is an attack, not a spell." },noCasting,noAttackTiming], sourceUrl: source("act_int",11727) },
  { id: "herald-of-plague", name: "Herald of Plague", gemId: "Metadata/Items/Gems/SkillGemHeraldOfPlague",
    tags: ["buff","chaos","dexterity","grants_active_skill","herald","persistent"],
    description: "Utility-only spread of an existing Poison after a poisoned enemy dies, with a separate Hinder chance. No new hit, Poison source or autonomous Chaos DPS is invented. Spread radius lacks reviewed generic-area scaling; source Poison and kills remain required.",
    passiveStatScopes: [], suggestions: [reservation], exclusions: [...utilityExclusions,{ id: "areaOfEffect", reason: "The source grants a Poison-spread radius, but has no Area skill type or reviewed generic-area scaling. A radius alone does not establish applicability." }], sourceUrl: source("act_dex",3369) },
  { id: "herald-of-thunder", name: "Herald of Thunder", gemId: "Metadata/Items/Gems/SkillGemHeraldOfThunder",
    tags: ["area","attack","buff","dexterity","grants_active_skill","herald","lightning","payoff","persistent"],
    description: "Lightning-converted bolts after qualifying Shocked-enemy kills and subsequent Attack Hits. Bolts cannot Shock. Coverage is not area damage; external Shock, bolt availability, hit frequency and weapon equipment are not assumed.",
    passiveStatScopes: ["heraldDamage","heraldAreaOfEffect","attackCriticalChance","attackCriticalDamageBonus","attackAreaOfEffect","attackElementalDamage"],
    suggestions: [heraldDamage,s("attackDamage",2,"Benefits the granted Lightning attack bolts, not the buff toggle or a guaranteed attack-hit trigger frequency."),
      s("lightningDamage",3,"Benefits fully Lightning-converted bolt damage, not an external Shock source or assumed weapon stats."),
      s("elementalDamage",2,"Benefits the Lightning attack component; conversion is not reversed and damage modifiers are not copied between categories."),coverage,reservation],
    exclusions: [{ id: "shockChance", reason: "The bolts cannot Shock; the triggering Shocked-enemy kill needs an external source." },
      { id: "shockMagnitude", reason: "The bolts cannot Shock, so stronger self-inflicted Shock is not supplied by this focus." },
      { id: "attackAreaDamage", reason: "The source has coverage radius but no damaging-area flag for the bolt; captured Concentrated Area left damage unchanged." },
      { id: "areaDamage", reason: "Coverage is not native area damage for these bolts." },{ id: "spellDamage", reason: "The bolts are attacks, not spells." },noCasting,noAttackTiming], sourceUrl: source("act_dex",3503) },
  { id: "plague-bearer", name: "Plague Bearer", gemId: "Metadata/Items/Gems/SkillGemPlagueBearer",
    tags: ["area","buff","chaos","dexterity","grants_active_skill","nova","persistent","physical"],
    description: "Stores Poison damage supplied by other skills, then releases a Poisoning nova. Its own Poison is not stored again. This focus scores release coverage and movement utility only; the stored-damage base is unmodeled, not guaranteed full storage or DPS.",
    passiveStatScopes: [], suggestions: [s("areaOfEffect",1,"Coverage of the granted release nova, not stored Poison, its cap, damage per hit or guaranteed contacts."),
      s("skillMovementPenaltyReduction",1,"Movement-penalty utility while releasing the nova, not global Movement Speed, storage generation or damage.")],
    exclusions: utilityExclusions, sourceUrl: source("act_dex",5471) },
  { id: "raging-spirits", name: "Raging Spirits", gemId: "Metadata/Items/Gems/SkillGemRagingSpirits",
    tags: ["buff","duration","fire","grants_active_skill","intelligence","minion","persistent"],
    description: "Temporary Minion basic attacks, with 70% Physical-to-Fire conversion. Your self-used Fire Spells must create them; the persistent parent is not damaging. Five-second lifetime, per-action summon limit, ten-Minion cap and enemy contacts do not imply sustained maximum Minions or DPS.",
    passiveStatScopes: [], suggestions: minionSuggestions, exclusions: minionExclusions, sourceUrl: source("act_int",16482) },
  { id: "ravenous-swarm", name: "Ravenous Swarm", gemId: "Metadata/Items/Gems/SkillGemRavenousSwarm",
    tags: ["buff","chaos","duration","grants_active_skill","intelligence","minion","persistent","physical"],
    description: "Temporary, untargetable Minions use area attacks that inherently Poison. Minion-owned damage and speed stay separate from player Chaos/Poison modifiers. Generation interval, lifetime, three-swarm cap and contacts do not establish maximum attackers, Poison stacks or sustained DPS.",
    passiveStatScopes: [], suggestions: [...minionSuggestions,s("minionAreaOfEffect",1,"Coverage of the Minion-owned area attack, not generic player area, Poison damage per second or guaranteed contacts."),
      s("areaOfEffect",1,"Parent swarm-emission coverage, not the Minion attack's separate area modifier, Presence or damage."),
      s("cooldownRecoveryRate",2,"Source explicitly applies cooldown recovery to the six-second generation interval, not Minion attack speed. Lifetime and the three-swarm limit remain separate.")],
    exclusions: minionExclusions, sourceUrl: source("act_int",16739) },
  { id: "mirage-archer", name: "Mirage Archer", gemId: "Metadata/Items/Gems/SkillGemMirageArcher",
    tags: ["buff","dexterity","duration","grants_active_skill","meta","persistent","trigger"],
    description: "Select a reviewed socketed Bow attack. Dodge rolling creates a temporary Mirage, not a Minion or Totem. No socketed skill is assumed. The 60-Spirit reservation, six-second lifetime, ten-second cooldown, charge prohibition and firing contacts remain separate.",
    passiveStatScopes: [], suggestions: [], exclusions: [], sourceUrl: source("act_dex",4908) },
  { id: "archmage", name: "Archmage", gemId: "Metadata/Items/Gems/SkillGemArchmage",
    tags: ["buff","grants_active_skill","intelligence","lightning","persistent"],
    description: "Mana-based empowerment for non-channelling spells, not its own damaging spell. More maximum Mana increases gained Lightning and additional Mana cost together. Recipient damage, 100-Spirit reservation and replenishment remain separate; no supplied spell, channel benefit or sustainable Full DPS is assumed.",
    passiveStatScopes: [], suggestions: [s("mana",3,"Maximum Mana supplies both the non-channelling spell's extra Lightning and extra Mana cost. It is not free damage or a whole-build DPS calculation."),
      s("manaRegenerationRate",2,"Replenishment utility for a supplied Mana-regeneration source, not proof of sustaining the extra cost or granting base regeneration."),
      s("manaCostEfficiency",1,"Native controls reduce the recipient non-channelling spell's total Mana cost, not gained Lightning, Spirit reservation or channel eligibility. No sustained casting rate is assumed.")],
    exclusions: [...utilityExclusions,noCasting], sourceUrl: source("act_int",162) },
  { id: "overwhelming-presence", name: "Overwhelming Presence", gemId: "Metadata/Items/Gems/SkillGemOverwhelmingPresence",
    tags: ["aura","buff","grants_active_skill","persistent","strength"],
    description: "Presence-based Aura lowering enemy Stun and Elemental Ailment thresholds. These are enemy debuffs, not your defensive thresholds or damage. Aura magnitude and Presence coverage remain separate; native enemy-threshold calculations are incomplete, with no guaranteed Stun or ailment uptime.",
    passiveStatScopes: [], suggestions: [s("auraMagnitude",3,"Source-defined Aura threshold debuffs, not player damage or defensive threshold increases. Native enemy-threshold output is incomplete, so no actual debuff amount, enemy cap or uptime is calculated."),
      s("presenceArea",2,"Presence coverage for the enemy debuff, not generic skill area, threshold magnitude or guaranteed affected targets.")],
    exclusions: [...utilityExclusions,{ id: "stunThreshold", reason: "Player Stun Threshold is defence, not reduced enemy Stun Threshold from this Aura." },
      { id: "elementalAilmentThreshold", reason: "Your defensive Elemental Ailment Threshold does not strengthen the enemy debuff." }], sourceUrl: source("act_str",14897) },
  { id: "withering-presence", name: "Withering Presence", gemId: "Metadata/Items/Gems/SkillGemWitheringPresence",
    tags: ["aura","buff","chaos","duration","grants_active_skill","intelligence","persistent"],
    description: "Periodically applies Wither to enemies in Presence. Wither duration is separate from its fixed application interval, stack limit and stack strength. No self-damage, maximum stacks, Aura-scaled Wither potency or sustained boss uptime is assumed; native debuff calculations are incomplete.",
    passiveStatScopes: [], suggestions: [s("presenceArea",2,"Presence coverage for periodic Wither applications, not generic skill area or assumed enemy contact time."),
      s("skillDuration",2,"Extends the six-second debuff timer, not the fixed application interval, Wither strength, stack cap or guaranteed maximum stacks.")],
    exclusions: [...utilityExclusions,{ id: "auraMagnitude", reason: "An Aura application tag does not prove that Aura Magnitude scales Wither's per-stack strength, frequency or maximum stacks. Those effects are not verified for this focus." },
      { id: "cooldownRecoveryRate", reason: "The periodic Wither interval is not marked as cooldown-scaled; captured cooldown-recovery controls left it unchanged." }], sourceUrl: source("act_int",23266) },
];

export const mirageArcherSocketIds: readonly string[] = ["lightning-arrow","ice-shot","rain-of-arrows","freezing-salvo"];
const mirageVariants = new Map<string, SkillPreferencePreset>();
export function mirageArcherPreset(base: SkillPreferencePreset, socketed: SkillPreferencePreset): SkillPreferencePreset {
  const cached = mirageVariants.get(socketed.id);
  if (cached) return cached;
  const suggestions = new Map(socketed.suggestions.map(entry => [entry.id,entry]));
  suggestions.set("skillDuration",s("skillDuration",2,"Temporary Mirage lifetime, not reservation, the separate spawn cooldown, Minion/Totem duration or guaranteed continuous firing."));
  suggestions.set("attackSpeed",s("attackSpeed",1,"Inherited firing cadence of the selected Bow attack, not dodge-roll speed, spawn cooldown or guaranteed contacts during Mirage lifetime."));
  const exclusions = new Map(socketed.exclusions.filter(e => e.id !== "skillDuration").map(e => [e.id,e]));
  for (const id of ["minionDamage","totemDamage"] as const) exclusions.set(id,{ id,reason: "The Mirage is a cloned proxy, not a Minion or Totem. Those damage modifiers do not transfer to its Bow attack." });
  const variant: SkillPreferencePreset = { ...base,
    description: `${socketed.name} fired by a dodge-created Mirage. Inherited Bow modifiers, six-second lifetime and ten-second spawn cooldown remain separate. Cannot consume Power, Frenzy or Endurance Charges. No permanent Mirage, maximum Seals, overlaps or Full DPS assumed.`,
    tags: [...new Set([...base.tags,...socketed.tags])].sort(),
    passiveStatScopes: socketed.passiveStatScopes?.filter(scope => !["attackBlindChance","attackMaimChance","attackIncisionChance"].includes(scope)),
    suggestions: [...suggestions.values()], exclusions: [...exclusions.values()] };
  mirageVariants.set(socketed.id,variant);
  return variant;
}

type Kind = "area" | "duration" | "mobility" | "speed" | "concentrated" | "brutality" | "feeding" | "deadly";
const ids: Record<Kind, readonly string[]> = {
  area: ["herald-of-ash","herald-of-blood","herald-of-ice","herald-of-thunder","plague-bearer","ravenous-swarm"],
  duration: ["herald-of-ash","raging-spirits","ravenous-swarm","mirage-archer","withering-presence"],
  mobility: ["plague-bearer"], speed: ["raging-spirits","ravenous-swarm"],
  concentrated: ["herald-of-blood","herald-of-ice","plague-bearer","ravenous-swarm"],
  brutality: ["herald-of-blood","raging-spirits","ravenous-swarm"], feeding: ["raging-spirits","ravenous-swarm"], deadly: ["ravenous-swarm"],
};
export const reviewedPersistentOffenceSupportIds = (kind: Kind): readonly string[] => ids[kind];
export function persistentOffenceSupportOverrides(kind: Kind, amount = 0, tierFlag = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return Object.fromEntries(ids[kind].map(id => {
    const summary = kind === "area" ? `${amount}% increased area, not radius or damage. ${id === "ravenous-swarm" ? "Affects parent emission coverage and the Minion's separate area attack, without guaranteeing more contacts or Poison stacks." : "Coverage of the selected explosion or release, not trigger supply, Overkill or stored damage."} Persistent reservation remains 30 Spirit.`
      : kind === "duration" ? `${amount}% more Skill Effect Duration. ${id === "herald-of-ash" ? "Changes the displayed explosion timer; complete Overkill-Ignite lifetime and damage are unmodeled, not a measured Ignite DPS gain." : id === "mirage-archer" ? "Extends the granted Mirage's lifetime, not its ten-second cooldown, firing speed or guaranteed uptime. Reservation remains 60 Spirit." : id === "withering-presence" ? "Extends the Wither debuff timer, not the fixed application interval, per-stack effect or guaranteed maximum stacks." : "Extends temporary Minion lifetime, not summon/generation rate, replacement limit, damage per hit or guaranteed contacts."} It does not reduce persistent reservation.`
      : kind === "mobility" ? "25% less movement penalty while releasing Plague Bearer's nova, not global Movement Speed, stored Poison or a DPS bonus. The zero-Mana action still requires the parent's 30-Spirit reservation."
      : kind === "speed" ? `${amount}% increased Minion attack speed, not player casting, creation or swarm generation. No Minion count, guaranteed contacts, Poison stack count or sustained DPS assumed.`
      : kind === "concentrated" ? `30% more area damage and 50% less area, not radius. ${id === "herald-of-blood" ? "Native Blood explosion damage remained unchanged because attack/area scaling is incomplete; narrower coverage is not a validated damage upgrade." : id === "plague-bearer" ? "The stored nova base is unmodeled; only coverage changes are captured, not a measured DPS gain." : id === "ravenous-swarm" ? "Native Minion hit and Poison output increase, but parent emission range and Minion area both shrink. No attacker count, contact rate or stack uptime assumed." : "Benefits the Cold explosion, not external Freeze/Shatter supply or guaranteed repeated kills."}`
      : kind === "brutality" ? `${amount}% more Physical damage; Elemental and Chaos damage prohibited. ${id === "raging-spirits" ? "Blocks the 70% Fire-converted portion without restoring Physical damage; native basic hit drops sharply. Not a recommendation for a Fire-Minion setup." : id === "ravenous-swarm" ? "Physical hits remain, but the Minion's inherent Poison damage is disabled; Poison-focused benefits cannot bypass this." : "Benefits scalable Physical explosion damage, not an assumed Blood Loss pool or added weapon damage."} ${tierFlag ? "Hits have 20% chance to ignore Physical Damage Reduction, not unconditional penetration or a DoT bypass." : ""} Reservation is unchanged.`
      : kind === "feeding" ? `30% more Minion damage but ${amount}% more damage taken. Not player damage or guaranteed uptime. Untargetable/non-engaged does not prove invulnerability; no speculative Life priority or simultaneous-attacker multiplier is applied.`
      : `${amount}% more Minion Poison magnitude with ${amount === 75 ? 25 : 30}% less hit damage, not player Poison magnitude. Native source damage and magnitude interact; this is not a net-DPS multiplier. The attack inherently Poisons; application rate, replacement, stack limit and boss uptime are not assumed. Parent Spirit reservation is unchanged.`;
    return [id,{ summary, priorities: [] }];
  }));
}

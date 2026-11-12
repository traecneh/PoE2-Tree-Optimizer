import type { TreeNode } from "./types";
import { maxPassiveAllocationPointCount } from "./passivePointBudget";
import { getSkillPreferencePreset, resolveSkillPreferencePreset, reviewedWeaponPassiveScopes } from "./skillPreferencePresets";
import { normalizeSocketedGrenadeId } from "./mortarCannonPreferences";
import { normalizeSocketedProxySkillId } from "./proxySkillPreferencePresets";
import { normalizeSkillSupportIds, skillPassiveStatScopes } from "./skillSupportPreferences";

const penetrationDescription = "Flat resistance penetration for applicable hits, not increased damage, exposure or resistance reduction. Does not scale damage over time. Enemy resistance/floors, hit proportions, gear and prohibitions are not simulated.";
const ailmentDurationDescription = "Duration of your ailments on enemies, not ailments on you. Does not grant application or increase damage per second. Prohibitions, replacement/stack limits and actual uptime are not simulated.";
const minionResistanceDescription = "Flat minion resistance percentage points, not player resistance, increased resistance or maximum resistance. All Elemental Resistances contributes once to each selected Fire/Cold/Lightning preference, never Chaos. Caps, overcapping, inheritance and actual mitigation are not simulated.";
const minionMaximumResistanceDescription = "Minion resistance cap modifier, not ordinary resistance or player defence. All Maximum Elemental Resistances contributes once to each selected maximum Fire/Cold/Lightning preference. Requires enough ordinary resistance to benefit; native cap is 90%. Caps, overrides and actual mitigation are not calculated by this heuristic.";
const companionScopeDescription = "Companion-only wording; broader minion bonuses can also apply and have separate preferences. Player-sharing and inheritance mechanics are not modeled. ";
const companionResistanceDescription = "Flat Companion resistance percentage points, not maximum resistance or player defence. All Elemental Resistances contributes once to each selected Companion Fire/Cold/Lightning preference, never Chaos. Broader minion resistance preferences are separate; caps, overcapping and actual mitigation are not simulated.";
const totemResistanceDescription = "Flat Totem resistance percentage points, not player/minion resistance, increased resistance or maximum resistance. All Elemental Resistances contributes once to each selected Totem Fire/Cold/Lightning preference, never Chaos. Overcapping, overrides and actual mitigation are not calculated.";
const totemMaximumResistanceDescription = "Totem resistance cap modifier, not ordinary resistance or player/minion defence. All Maximum Elemental Resistances contributes once to each selected Totem maximum Fire/Cold/Lightning preference. Native default maximum is 75%, capped at 90%; enough ordinary resistance is required to benefit. Raw preference scores are not capped mitigation.";
const playerResistanceDescription = "Flat player resistance percentage points, not increased resistance, penetration or maximum resistance. All Elemental Resistances contributes once to each selected Fire/Cold/Lightning preference, never Chaos. Gear, campaign penalties, overcapping, conversions and actual capped mitigation are not calculated.";
const playerMaximumResistanceDescription = "Player resistance cap modifier, not ordinary resistance or minion/Totem defence. All Maximum Elemental Resistances contributes once to each selected maximum Fire/Cold/Lightning preference. Native default maximum is 75%, capped at 90%; enough ordinary resistance is required to benefit. Overrides, conversions and actual capped mitigation are not calculated.";

export const passivePreferenceCatalog = [
  { id: "crossbowReloadSpeed", label: "Crossbow Reload Speed", group: "Utility", unit: "10% increased Crossbow Reload Speed", scale: 10,
    description: "Increased/reduced Crossbow reload rate, not firing Attack Speed, bolt capacity or chance to reload immediately. Generic speed bonuses are not counted again here. Reload penalties, clip history, Heavy Stun events, costs and actual sustained DPS are not calculated." },
  { id: "metaEnergyGain", label: "Meta Energy Gain", group: "Utility", unit: "Meta Skills gain 10% increased Energy", scale: 10,
    description: "Energy gained per eligible supplied event, not maximum Energy, cost, cooldown or actual trigger frequency. Conditional sources, spending, refunds, enemy Power and uptime are not simulated." },
  { id: "minionRevivalSpeed", label: "Minion Revival Speed", group: "Utility", unit: "Minions Revive 10% faster", scale: 10,
    description: "Faster/slower revival of eligible persistent Minions, not player summoning, Minion attack speed, Life recovery or damage. Requires reviving Minions; death frequency, penalties and sustainable corpse supply are not calculated." },
  { id: "life", label: "Maximum Life", group: "Defence", unit: "3% increased maximum Life or +10 Life", scale: 3 },
  { id: "energyShield", label: "Energy Shield", group: "Defence", unit: "12% increased Energy Shield or +20 Energy Shield", scale: 12 },
  { id: "energyShieldRechargeStart", label: "ES Recharge Start", group: "Defence", unit: "10% faster start of Energy Shield Recharge", scale: 10,
    description: "Faster starts add value; slower starts subtract it. This is not a linear percentage reduction in delay seconds. Separate from recharge rate and maximum ES; disabled or replaced recharge is not modeled." },
  { id: "energyShieldRechargeRate", label: "ES Recharge Rate", group: "Defence", unit: "10% increased Energy Shield Recharge Rate", scale: 10,
    description: "Increased/reduced recharge rate, separate from start delay and maximum ES. Recharge availability, interruptions and conversions are not modeled; this is not recovery per second." },
  { id: "lifeRegenerationRate", label: "Life Regeneration Rate", group: "Defence", unit: "10% increased Life Regeneration Rate", scale: 10,
    description: "Increased/reduced rate scales existing Life regeneration; it does not grant flat Life per second or maximum Life. Disabled regeneration, conversions and actual sustain are not modeled." },
  { id: "lifeRegenerationPercent", label: "Life Regeneration (% Life)", group: "Defence", unit: "0.2% of maximum Life regenerated per second", scale: 0.2,
    description: "Player regeneration source as a percentage of maximum Life per second, not increased Life Regeneration Rate, flat Life per second or maximum Life. The displayed per-second value is scored once, not divided by 60 again. Prohibitions, conversions, recovery modifiers and actual sustain are not calculated." },
  { id: "lifeRecoup", label: "Life Recoup", group: "Defence", unit: "3% of Damage taken Recouped as Life", scale: 3,
    description: "Unqualified damage taken recouped as Life, not mitigation, regeneration or instant recovery. Damage-type-specific and conditional recoup, speed, conversions, prohibitions and actual sustain are not simulated." },
  { id: "energyShieldRecoup", label: "Energy Shield Recoup", group: "Defence", unit: "3% of Damage taken Recouped as Energy Shield", scale: 3,
    description: "Unqualified damage taken recouped as Energy Shield, not recharge or mitigation. Damage-type-specific and conditional recoup, speed, conversions, prohibitions and actual sustain are not simulated." },
  { id: "recoupSpeed", label: "Recoup Speed", group: "Defence", unit: "10% increased speed of Recoup Effects", scale: 10,
    description: "Delivery speed of existing Recoup Effects, not recoup amount, mitigation or a recovery source. Requires applicable recoup and damage taken; does not grant recoup. Reductions subtract value. Native PoB does not model this modifier; actual timing, recovery rates, prohibitions and sustain are not calculated." },
  { id: "lifeRecoveryOnKill", label: "Life Recovery on Kill", group: "Defence", unit: "Recover 1% of maximum Life on Kill", scale: 1,
    description: "Percentage of maximum Life recovered per eligible Kill, not flat Life, regeneration or recovery per second. Lose-on-Kill wording subtracts value. Kill frequency, kill attribution, resource pools, overfill, prohibitions and actual sustain are not calculated; does not assume minion/proxy kills qualify." },
  { id: "armour", label: "Armour", group: "Defence", unit: "12% increased Armour", scale: 12 },
  { id: "evasion", label: "Evasion", group: "Defence", unit: "12% increased Evasion Rating", scale: 12 },
  { id: "fireResistance", label: "Fire Resistance", group: "Defence", unit: "+5% to Fire Resistance", scale: 5, description: playerResistanceDescription },
  { id: "coldResistance", label: "Cold Resistance", group: "Defence", unit: "+5% to Cold Resistance", scale: 5, description: playerResistanceDescription },
  { id: "lightningResistance", label: "Lightning Resistance", group: "Defence", unit: "+5% to Lightning Resistance", scale: 5, description: playerResistanceDescription },
  { id: "chaosResistance", label: "Chaos Resistance", group: "Defence", unit: "+5% to Chaos Resistance", scale: 5, description: playerResistanceDescription },
  { id: "maximumFireResistance", label: "Maximum Fire Resistance", group: "Defence", unit: "+1% to Maximum Fire Resistance", scale: 1, description: playerMaximumResistanceDescription },
  { id: "maximumColdResistance", label: "Maximum Cold Resistance", group: "Defence", unit: "+1% to Maximum Cold Resistance", scale: 1, description: playerMaximumResistanceDescription },
  { id: "maximumLightningResistance", label: "Maximum Lightning Resistance", group: "Defence", unit: "+1% to Maximum Lightning Resistance", scale: 1, description: playerMaximumResistanceDescription },
  { id: "blockChance", label: "Block Chance", group: "Defence", unit: "10% increased Block Chance", scale: 10,
    description: "Increased/reduced Block Chance modifier, not added percentage points or maximum Block Chance. Requires a block-capable setup; gear, caps, active block and actual probability are not simulated." },
  { id: "stunThreshold", label: "Stun Threshold", group: "Defence", unit: "10% increased Stun Threshold", scale: 10,
    description: "Increased/reduced threshold for resisting stuns, not Stun Buildup against enemies or Stun Recovery. Base threshold, conversions and stun immunity are not simulated." },
  { id: "stunRecovery", label: "Stun Recovery", group: "Defence", unit: "10% increased Stun Recovery", scale: 10,
    description: "Increased/reduced recovery from your stuns, not Stun Threshold or outgoing Stun Buildup. Requires being stunned; immunity, base duration and actual recovery time are not simulated." },
  { id: "lifeLeechAmount", label: "Life Leech Amount", group: "Defence", unit: "10% increased amount of Life Leeched", scale: 10,
    description: "Literal increased/reduced leech amount modifier, not a source of Life leech or its speed. Requires applicable leech; damage, caps, prohibitions and actual sustain are not simulated." },
  { id: "lifeLeechSpeed", label: "Life Leech Speed", group: "Defence", unit: "10% faster Life Leech", scale: 10,
    description: "Faster delivery scores positively; slower delivery negatively, separate from amount leeched. Requires Life leech. Slower leech can extend recovery duration; this preference favors delivery speed, not total recovery or sustain." },
  { id: "elementalAilmentThreshold", label: "Elemental Ailment Threshold", group: "Defence", unit: "10% increased Elemental Ailment Threshold", scale: 10,
    description: "Increased/reduced threshold for resisting elemental ailments, not outgoing buildup, resistance or ailment immunity. Base threshold, conversions, gear and actual protection are not simulated." },
  { id: "freezeThreshold", label: "Freeze Threshold", group: "Defence", unit: "10% increased Freeze Threshold", scale: 10,
    description: "Increased/reduced player threshold for resisting Freeze, not outgoing Freeze Buildup, Cold Resistance or incoming Freeze duration. Elemental Ailment Threshold is scored separately, never copied here. Reviewed native PoB parses this stat but has no player Freeze Threshold calculation. Base values, conversions, gear and actual protection or immunity are not calculated." },
  { id: "slowPotencyReduction", label: "Slow Potency Reduction", group: "Defence", unit: "10% reduced Slowing Potency of Debuffs on You", scale: 10,
    description: "Incoming slow potency from exact game wording. Reductions score positively; increases subtract value. Not Movement Speed, debuff expiry, outgoing slow or immunity. Native PoB parsing is unavailable; overlapping effects, floors and actual action speed or protection are not calculated." },
  { id: "curseEffectReduction", label: "Curse Effect Reduction", group: "Defence", unit: "10% reduced effect of Curses on you", scale: 10,
    description: "Incoming curse effect, not your outgoing Curse Magnitudes or curse avoidance. Reductions score positively; increases subtract value. Zero effect is not curse immunity. Actual curses, enemy bonuses, effect floors, overrides and beneficial self-curse interactions are not calculated." },
  { id: "chillEffectReduction", label: "Chill Effect Reduction", group: "Defence", unit: "10% reduced Effect of Chill on you", scale: 10,
    description: "Incoming Chill effect, not outgoing Chill magnitude, Chill duration, avoidance or immunity. Reductions score positively; increases subtract value. Raw scores are not capped protection or Movement Speed. Chill strength, overlapping slow protection, floors, caps and reversed self-Chill are not calculated." },
  { id: "shockEffectReduction", label: "Shock Effect Reduction", group: "Defence", unit: "10% reduced effect of Shock on you", scale: 10,
    description: "Incoming Shock effect, not outgoing Shock magnitude/chance, Lightning Resistance, avoidance or immunity. Reductions score positively; increases subtract value. Raw scores are not capped mitigation. Shock strength, other incoming effects, floors, overrides and actual damage taken are not calculated." },
  { id: "igniteEffectReduction", label: "Ignite Magnitude Reduction", group: "Defence", unit: "10% reduced Magnitude of Ignite on you", scale: 10,
    description: "Incoming Ignite magnitude, not your outgoing Ignite damage, incoming duration, Fire Resistance, avoidance or immunity. Reductions score positively; increases subtract value. Raw scores are not capped damage reduction. Self-reflection, beneficial self-ailment interactions, enemy magnitude, overrides and actual damage taken are not calculated." },
  { id: "ailmentDurationReduction", label: "Incoming Ailment Duration", group: "Defence", unit: "10% reduced Duration of Ailments on You", scale: 10,
    description: "Incoming ailment duration modifier, not outgoing ailment/Skill Effect Duration, incoming magnitude or reciprocal debuff expiry speed. Reductions score positively; increases subtract value. One generic line scores once here, not separately for each ailment. Base durations, overlapping modifiers, floors, overrides, self-ailment benefits and actual protection or immunity are not calculated." },
  { id: "lifeFlaskRecovery", label: "Life Flask Recovery", group: "Defence", unit: "10% increased Life Recovery from Flasks", scale: 10,
    description: "Increased/reduced Life recovered from flasks, not flask recovery rate, charges gained, regeneration or maximum Life. Requires applicable Life flask recovery; gear, flask uptime and actual recovery per second are not simulated." },
  { id: "genericDamage", label: "Generic Damage", group: "Offence", unit: "10% increased Damage", scale: 10,
    description: "Literal unqualified increased/reduced Damage, counted once here rather than copied into each damage type or attack/spell preference. Player-origin bonuses may be inherited by Totem/proxy skills, not automatically by minions or Companions. Applicability, ailments, conversions, mitigation and actual DPS are not calculated." },
  { id: "skillSpeed", label: "Skill Speed", group: "Utility", unit: "3% increased Skill Speed", scale: 3,
    description: "One generic increased/reduced Skill Speed modifier, counted once here, not again as Attack Speed, Cast Speed, Warcry Speed or Totem Placement Speed. Does not grant minion/Companion speed. Native action-specific benefits share this modifier; cooldowns, fixed timing, sustain and actual DPS are not calculated." },
  { id: "chillMagnitude", label: "Chill Magnitude", group: "Utility", unit: "10% increased Magnitude of Chill you inflict", scale: 10,
    description: "Outgoing Chill magnitude, not Cold Damage, Freeze Buildup, Chill duration or reduced Chill effect on you. Does not grant Chill application. Native default maximum Chill is 50%; enemy thresholds, prohibitions, cap overrides and actual slow/uptime are not calculated, and raw scores are not capped slow percentages." },
  { id: "totemDamage", label: "Totem Damage", group: "Offence", unit: "10% increased Totem Damage", scale: 10,
    description: "Increased/reduced damage of skills used by Totems, not player self-use or minion damage. Requires a damaging totem skill; components, enemy debuffs, hit counts, uptime and actual DPS are not simulated." },
  { id: "totemLife", label: "Totem Life", group: "Defence", unit: "10% increased Totem Life", scale: 10,
    description: "Increased/reduced Totem Life, not player or minion maximum Life. Base totem Life, rounding, damage sharing, survival and effective mitigation are not calculated." },
  { id: "totemPlacementSpeed", label: "Totem Placement Speed", group: "Utility", unit: "10% increased Totem Placement Speed", scale: 10,
    description: "Speeds placing a Totem, not its attacks or spell casting. Reduced speed is a penalty, not an equal percentage increase in placement time. Charges, cooldowns, Action Speed, deployment uptime and actual DPS are not simulated." },
  { id: "totemDuration", label: "Totem Duration", group: "Utility", unit: "10% increased Totem Duration", scale: 10,
    description: "Extends an applicable Totem's lifetime, not generic Skill Effect Duration, minion lifetime or damage per second. Requires a duration-based totem; server-tick rounding, replacement limits, early death and actual uptime are not simulated." },
  { id: "totemAttackSpeed", label: "Totem Attack Speed", group: "Offence", unit: "3% increased Attack Speed for attacks used by Totems", scale: 3,
    description: "Attack cadence for skills used by Totems only, not player or minion attack speed, totem spell casting or placement speed. Requires a totem attack; timing, cooldowns and actual DPS are not simulated." },
  { id: "totemCastSpeed", label: "Totem Cast Speed", group: "Offence", unit: "3% increased Cast Speed for spells cast by Totems", scale: 3,
    description: "Spell cadence for spells cast by Totems only, not player or minion cast speed, totem attacks or placement speed. Requires a totem spell; targeting, debuff prerequisites, cooldowns and actual DPS are not simulated." },
  { id: "totemAreaOfEffect", label: "Totem Area of Effect", group: "Utility", unit: "10% increased Area of Effect for Skills used by Totems", scale: 10,
    description: "Increased/reduced coverage of applicable skills used by Totems, not player/minion area, radius percentage or damage. Does not create an area for a single-target skill; overlap, target counts and actual DPS are not simulated." },
  { id: "totemPlacementRange", label: "Totem Placement Range", group: "Utility", unit: "10% increased Totem Placement range", scale: 10,
    description: "Literal increased/reduced placement-distance modifier, not Totem firing/activation range, placement speed or Area of Effect. Base distance, terrain, targeting restrictions and distance in metres are not calculated." },
  { id: "totemFireResistance", label: "Totem Fire Resistance", group: "Defence", unit: "+5% to Totem Fire Resistance", scale: 5, description: totemResistanceDescription },
  { id: "totemColdResistance", label: "Totem Cold Resistance", group: "Defence", unit: "+5% to Totem Cold Resistance", scale: 5, description: totemResistanceDescription },
  { id: "totemLightningResistance", label: "Totem Lightning Resistance", group: "Defence", unit: "+5% to Totem Lightning Resistance", scale: 5, description: totemResistanceDescription },
  { id: "totemMaximumFireResistance", label: "Totem Maximum Fire Resistance", group: "Defence", unit: "+1% to Totem Maximum Fire Resistance", scale: 1, description: totemMaximumResistanceDescription },
  { id: "totemMaximumColdResistance", label: "Totem Maximum Cold Resistance", group: "Defence", unit: "+1% to Totem Maximum Cold Resistance", scale: 1, description: totemMaximumResistanceDescription },
  { id: "totemMaximumLightningResistance", label: "Totem Maximum Lightning Resistance", group: "Defence", unit: "+1% to Totem Maximum Lightning Resistance", scale: 1, description: totemMaximumResistanceDescription },
  { id: "totemPhysicalDamageReduction", label: "Totem Physical Damage Reduction", group: "Defence", unit: "3% additional Totem Physical Damage Reduction", scale: 3,
    description: "Additional Totem physical reduction percentage points, not Armour, reduced damage taken or player/minion defence. Native general physical reduction cap is 90%; this heuristic does not calculate capped totem mitigation, Armour, hit size or overwhelm." },
  { id: "totemLifeRegeneration", label: "Totem Life Regeneration", group: "Defence", unit: "1% of Totem maximum Life regenerated per second", scale: 1,
    description: "Flat percentage of a Totem's maximum Life recovered per second, not increased regeneration rate or player/minion recovery. The displayed per-second value is scored once, not divided by 60 again. Totem Life, recovery modifiers, prohibitions and actual sustain are not calculated." },
  { id: "minionDamage", label: "Minion Damage", group: "Offence", unit: "10% increased Minion Damage", scale: 10 },
  { id: "minionSpeed", label: "Minion Attack / Cast Speed", group: "Offence", unit: "3% increased minion Attack or Cast Speed (each)", scale: 3 },
  { id: "attackDamage", label: "Attack Damage", group: "Offence", unit: "10% increased Attack Damage", scale: 10 },
  { id: "areaDamage", label: "Area Damage", group: "Offence", unit: "10% increased Area Damage", scale: 10,
    description: "Increased/reduced generic Area Damage on reviewed damaging area components, not Area of Effect coverage or all damage. An Area tag or targeting radius alone does not qualify. Does not score the same line again as Attack/Spell Area Damage. Component hit counts, ailments and actual DPS are not simulated." },
  { id: "attackAreaDamage", label: "Attack Area Damage", group: "Offence", unit: "10% increased Attack Area Damage", scale: 10,
    description: "Increased/reduced damage of reviewed attack-area hits only, not Area of Effect coverage, all attack damage or spell damage. Mixed-component skills benefit only on their area hits; overlap, conditional hit counts, ailments and actual DPS are not simulated." },
  { id: "spellDamage", label: "Spell Damage", group: "Offence", unit: "10% increased Spell Damage", scale: 10 },
  { id: "spellAreaDamage", label: "Spell Area Damage", group: "Offence", unit: "10% increased Spell Area Damage", scale: 10 },
  { id: "physicalDamage", label: "Physical Damage", group: "Offence", unit: "10% increased Physical Damage", scale: 10 },
  { id: "plantDamage", label: "Plant Damage", group: "Offence", unit: "10% increased Damage with Plant Skills", scale: 10,
    description: "Unconditional increased/reduced Damage with Plant Skills, only for an explicitly reviewed damaging Plant focus. Counted once, not copied into generic, attack, spell, physical or DoT damage. Plants are not Minions. Overgrowth, extra fissures, limits, enemy movement, stored damage, prohibitions and actual DPS are not simulated." },
  { id: "armourBreakAmount", label: "Armour Break Amount", group: "Offence", unit: "Break 10% increased Armour", scale: 10,
    description: "Relative amount of Armour broken, not flat Armour removed, player Armour or a source of Armour Break. Requires an Armour-breaking skill/effect. Native reduced-wording parsing is incomplete; signed game wording is matched. Enemy Armour, caps, below-zero rules and application frequency are not calculated." },
  { id: "fullyBrokenArmourEffect", label: "Fully Broken Armour Effect", group: "Offence", unit: "10% increased effect of Fully Broken Armour", scale: 10,
    description: "Relative effect of Fully Broken Armour, not flat added damage taken, break amount or duration. Requires the target's Armour to be Fully Broken; does not grant application. Native default affects Physical hits, not all damage or DoT; extensions, shared enemy debuffs, uptime and actual DPS are not calculated." },
  { id: "armourBreakDuration", label: "Armour Break Duration", group: "Utility", unit: "10% increased Armour Break Duration", scale: 10,
    description: "Outgoing Armour Break duration from exact game wording, not generic Skill Effect Duration, player Armour or effect strength. Does not grant application. Native PoB parsing is incomplete; base duration, refresh/consumption, enemy expiry modifiers and actual uptime are not calculated." },
  { id: "elementalDamage", label: "Elemental Damage", group: "Offence", unit: "10% increased Elemental Damage", scale: 10 },
  { id: "fireDamage", label: "Fire Damage", group: "Offence", unit: "10% increased Fire Damage", scale: 10 },
  { id: "coldDamage", label: "Cold Damage", group: "Offence", unit: "10% increased Cold Damage", scale: 10 },
  { id: "lightningDamage", label: "Lightning Damage", group: "Offence", unit: "10% increased Lightning Damage", scale: 10 },
  { id: "chaosDamage", label: "Chaos Damage", group: "Offence", unit: "10% increased Chaos Damage", scale: 10 },
  { id: "firePenetration", label: "Fire Penetration", group: "Offence", unit: "5% Fire Resistance penetration", scale: 5, description: penetrationDescription },
  { id: "coldPenetration", label: "Cold Penetration", group: "Offence", unit: "5% Cold Resistance penetration", scale: 5, description: penetrationDescription },
  { id: "lightningPenetration", label: "Lightning Penetration", group: "Offence", unit: "5% Lightning Resistance penetration", scale: 5, description: penetrationDescription },
  { id: "elementalPenetration", label: "Elemental Penetration", group: "Offence", unit: "5% Elemental Resistance penetration", scale: 5, description: penetrationDescription },
  { id: "igniteMagnitude", label: "Ignite Magnitude", group: "Offence", unit: "10% increased Ignite Magnitude", scale: 10,
    description: "Outgoing Ignite magnitude, not Flammability/application, duration or hit damage. Requires applicable Ignites; prohibitions, caps, conversions and actual damage are not simulated." },
  { id: "poisonMagnitude", label: "Poison Magnitude", group: "Offence", unit: "10% increased Magnitude of Poison you inflict", scale: 10,
    description: "Outgoing Poison magnitude, not Poison chance, duration, stack limit or Chaos Damage. Requires applicable Poisons; caps, stacking, prohibitions and actual damage are not simulated." },
  { id: "poisonChance", label: "Poison Chance on Hit", group: "Offence", unit: "5 percentage points of chance to Poison on Hit", scale: 5,
    description: "Flat outgoing Poison chance points, not increased ailment chance, Poison magnitude, duration or minion chance. Requires qualifying hit damage; sources, prohibitions, overrides and hit chance are not modeled. Native Poison probability caps at 100%; raw preference scores are not capped probabilities or DPS." },
  { id: "bleedingChance", label: "Bleeding Chance on Hit", group: "Offence", unit: "5 percentage points of chance to inflict Bleeding on Hit", scale: 5,
    description: "Flat outgoing Bleeding chance points, not increased ailment chance, Bleeding magnitude or minion chance. Requires qualifying hit damage; sources, prohibitions, overrides and hit chance are not modeled. Native Bleeding probability caps at 100%; raw preference scores are not capped probabilities or DPS." },
  { id: "dazeChance", label: "Daze Chance on Hit", group: "Utility", unit: "5 percentage points of chance to Daze on Hit", scale: 5,
    description: "Flat outgoing Daze chance points on hits, not generic increased ailment chance, Stun Buildup, Daze duration or damage against Dazed enemies. Minion/Companion chance is separate. Final Daze probability, application restrictions and uptime are not calculated." },
  { id: "ailmentChance", label: "Generic Ailment Chance", group: "Utility", unit: "10% increased chance to inflict Ailments", scale: 10,
    description: "Relative increased/reduced chance for applicable ailments, not flat added chance points or a source of application. Stored once here, not copied into Poison/Bleeding/Daze preferences; generic scaling of Daze is not assumed. Base chances, damage prerequisites, caps, prohibitions and actual probabilities are not calculated." },
  { id: "bleedingMagnitude", label: "Bleeding Magnitude", group: "Offence", unit: "10% increased Magnitude of Bleeding you inflict", scale: 10,
    description: "Outgoing Bleeding magnitude, not Bleeding chance, duration, aggravation or Physical Damage. Requires applicable Bleeding; prohibitions, conversions and actual damage are not simulated." },
  { id: "attackSpeed", label: "Attack Speed", group: "Offence", unit: "3% increased Attack Speed", scale: 3 },
  { id: "castSpeed", label: "Cast Speed", group: "Offence", unit: "3% increased Cast Speed", scale: 3 },
  { id: "criticalChance", label: "Critical Hit Chance", group: "Offence", unit: "15% increased Critical Hit Chance", scale: 15 },
  { id: "criticalDamageBonus", label: "Critical Damage Bonus", group: "Offence", unit: "10% increased Critical Damage Bonus", scale: 10,
    description: "Increased/reduced outgoing critical damage bonus, not Critical Hit Chance or flat added critical bonus. Attack/spell/weapon-only bonuses require a reviewed matching hit focus and count once here. Requires damaging critical hits; crit prohibitions, gear, conversions and actual DPS are not simulated. Incoming, minion and unreviewed weapon modifiers are excluded." },
  { id: "accuracy", label: "Accuracy Rating", group: "Offence", unit: "10% increased Accuracy Rating", scale: 10,
    description: "Increased/reduced attack Accuracy Rating, not hit chance. Weapon-only accuracy requires a reviewed matching attack focus; flat accuracy is excluded. Enemy evasion, distance falloff, caps and cannot-miss effects are not calculated; this is not spell damage." },
  { id: "attributes", label: "Attributes", group: "Utility", unit: "+5 total Attributes (any Attribute counts once)", scale: 5 },
  { id: "mana", label: "Maximum Mana", group: "Utility", unit: "10% increased maximum Mana or +15 Mana", scale: 10 },
  { id: "manaRegenerationRate", label: "Mana Regeneration Rate", group: "Utility", unit: "10% increased Mana Regeneration Rate", scale: 10,
    description: "Increased/reduced Mana regeneration rate, not flat recovery, maximum Mana, cost reduction or leech. Actual recovery, spending and conversions are not calculated." },
  { id: "manaCostEfficiency", label: "Mana Cost Efficiency", group: "Utility", unit: "10% increased Mana Cost Efficiency", scale: 10,
    description: "Relative efficiency of Mana skill costs, not flat Mana, cost reduction, reservation or a regeneration source. Requires a Mana cost. Increased efficiency divides cost, not an equal percentage subtraction; reduced efficiency is a penalty. Rounding, conversions and actual costs or sustain are not calculated." },
  { id: "debuffExpirySpeed", label: "Debuff Expiry Speed", group: "Defence", unit: "Debuffs on you expire 10% faster", scale: 10,
    description: "Incoming debuff expiry rate, not effect reduction, avoidance/immunity or outgoing duration. Faster scores positively; slower subtracts value. Duration changes reciprocally, not by the same percentage. Native slower-wording parsing is incomplete; game wording supplies that sign. Base durations, modifiers, refresh and actual protection are not calculated." },
  { id: "manaRecoup", label: "Mana Recoup", group: "Utility", unit: "3% of Damage taken Recouped as Mana", scale: 3,
    description: "Unqualified damage taken recouped as Mana, not regeneration, leech or instant recovery. Damage-type-specific and conditional recoup, speed, conversions, prohibitions and actual sustain are not simulated." },
  { id: "manaRecoveryOnKill", label: "Mana Recovery on Kill", group: "Utility", unit: "Recover 1% of maximum Mana on Kill", scale: 1,
    description: "Percentage of maximum Mana recovered per eligible Kill, not flat Mana, regeneration or recovery per second. Game-defined Lose-on-Kill wording subtracts value; native parsing does not model that penalty correctly. Kill frequency, attribution, resource pools, overfill, prohibitions and actual sustain are not calculated; does not assume minion/proxy kills qualify." },
  { id: "manaLeechAmount", label: "Mana Leech Amount", group: "Utility", unit: "10% increased amount of Mana Leeched", scale: 10,
    description: "Literal increased/reduced leech amount modifier, not a source of Mana leech or its speed. Requires applicable leech; damage, caps, prohibitions and actual sustain are not simulated." },
  { id: "presenceArea", label: "Presence Area of Effect", group: "Utility", unit: "10% increased Presence Area of Effect", scale: 10,
    description: "Increased/reduced Presence area, not generic skill Area of Effect or radius percentage. Requires an applicable Presence effect; its benefit, uptime and actual radius are not simulated." },
  { id: "maximumRage", label: "Maximum Rage", group: "Utility", unit: "+5 maximum Rage", scale: 5,
    description: "Flat Rage capacity, not Rage gained, regeneration, Rage effect or a guaranteed damage bonus. Requires a separate way to gain and retain Rage. Higher capacity does not fill itself and can increase Berserk's Life loss when used; actual Rage, inherent loss and uptime are not calculated." },
  { id: "maximumFrenzyCharges", label: "Maximum Frenzy Charges", group: "Utility", unit: "+1 maximum Frenzy Charge", scale: 1,
    description: "Flat Frenzy Charge capacity, not generation chance, current charges or buff strength. Requires a source and consumer. Charge Regulation needs a charge to enable its buff; more capacity is a reservoir, not a per-charge speed multiplier. Spending and sustained uptime are not calculated." },
  { id: "maximumPowerCharges", label: "Maximum Power Charges", group: "Utility", unit: "+1 maximum Power Charge", scale: 1,
    description: "Flat Power Charge capacity, not generation, current charges or automatic critical chance. Charge Regulation's Power buff has a charge-presence requirement, not a per-charge critical multiplier. Requires a source and consumer; spending and sustained uptime are not calculated." },
  { id: "maximumEnduranceCharges", label: "Maximum Endurance Charges", group: "Utility", unit: "+1 maximum Endurance Charge", scale: 1,
    description: "Flat Endurance Charge capacity, not generation, current charges or mitigation. Charge Regulation's defensive buff requires a charge, not maximum charges or a per-charge defensive multiplier. Requires a source and consumer; spending and sustained uptime are not calculated." },
  { id: "frenzyChargeDuration", label: "Frenzy Charge Duration", group: "Utility", unit: "10% increased Frenzy Charge Duration", scale: 10,
    description: "Signed Frenzy Charge lifetime modifier, not Skill Effect Duration, generation interval or Charge Regulation's consumption timer. Combined Endurance/Frenzy/Power wording contributes once to each separately selected charge-duration preference. Does not grant charges or assume permanent uptime." },
  { id: "powerChargeDuration", label: "Power Charge Duration", group: "Utility", unit: "10% increased Power Charge Duration", scale: 10,
    description: "Signed Power Charge lifetime modifier, not generation, spell duration or Charge Regulation's consumption timer. Combined charge-duration wording contributes once here, never as capacity or critical chance. Requires supplied charges; actual expiration, spending and uptime are not calculated." },
  { id: "enduranceChargeDuration", label: "Endurance Charge Duration", group: "Utility", unit: "10% increased Endurance Charge Duration", scale: 10,
    description: "Signed Endurance Charge lifetime modifier, not generation, mitigation, skill duration or Charge Regulation's consumption timer. Combined charge-duration wording contributes once here, never as capacity. Requires supplied charges; expiration, spending and uptime are not calculated." },
  { id: "remnantPickupRange", label: "Remnant Pickup Range", group: "Utility", unit: "Remnants collected from 10% further away", scale: 10,
    description: "Literal further-away collection modifier, not Presence, skill area, Remnant lifetime or effect. Requires a supplied Remnant and actual collection; it does not create Remnants, grant recovery or guarantee collection. Native pickup behavior is unmodeled; no radius/area conversion is invented." },
  { id: "remnantEffect", label: "Remnant Effect", group: "Utility", unit: "Remnants you create have 10% increased effect", scale: 10,
    description: "Signed effect of Remnants you create, not creation chance, collection range, Mana regeneration or damage. Native Mana per Remnant is rounded down after effect scaling; this preference does not calculate pickups, overflow or sustain. Not automatically applied to discrete Infusion counts." },
  { id: "additionalRemnantChance", label: "Additional Remnant Chance", group: "Utility", unit: "5% chance to create an additional Remnant", scale: 5,
    description: "Flat chance percentage points for an additional Remnant on an eligible creation event, not increased chance, on-hit ailment chance, guaranteed extra drops or recovery per second. Requires the original skill's creation conditions; event frequency, collection, replacement and sustained availability are not calculated." },
  { id: "elementalInfusionDuration", label: "Elemental Infusion Duration", group: "Utility", unit: "10% increased Elemental Infusion duration", scale: 10,
    description: "Signed lifetime modifier of held Elemental Infusions, not Remnant ground lifetime, creation chance, effect or Skill Effect Duration. Requires separately gained Infusions and an applicable consumer. Native timer calculation is incomplete; counts, damage and sustainable Infusion supply are not calculated." },
  { id: "heraldReservationEfficiency", label: "Herald Reservation Efficiency", group: "Utility", unit: "5% increased Herald Reservation Efficiency", scale: 5,
    description: "Signed Herald-only reservation efficiency, not Mana-cost efficiency, reduced reservation or a flat percentage of Spirit saved. Each modifier counts once, not once per Herald. Final reservation, rounding, available Spirit and actual ability to reserve another skill are not calculated." },
  { id: "auraMagnitude", label: "Aura Magnitude", group: "Utility", unit: "10% increased Aura Magnitudes", scale: 10,
    description: "Magnitude of a supplied Aura, not generic player damage, area, duration or Glory. Banner-only wording requires a reviewed Banner focus and joins this category once. Recipient stats, resistance caps, effect-specific scaling and uptime are not calculated." },
  { id: "gloryGeneration", label: "Glory Generation", group: "Utility", unit: "10% increased Glory generation", scale: 10,
    description: "Generation-rate modifier, not stored Glory, maximum Glory, buff strength or damage. Requires the skill's own generation events; Banner-only wording requires a reviewed Banner focus. Native PoB does not model Glory generation; event rate, thresholds and sustained uptime are not calculated." },
  { id: "skillMovementPenaltyReduction", label: "Skill Movement Penalty Reduction", group: "Utility", unit: "10% reduced Movement Speed Penalty from using Skills while moving", scale: 10,
    description: "Reduced skill-use movement penalty scores positively, not as global Movement Speed. Requires a usable-while-moving skill with a penalty. Skill-specific and active-block modifiers, caps and actual movement speed are not simulated." },
  { id: "manaFlaskRecovery", label: "Mana Flask Recovery", group: "Utility", unit: "10% increased Mana Recovery from Flasks", scale: 10,
    description: "Increased/reduced Mana recovered from flasks, not flask recovery rate, charges gained, regeneration or maximum Mana. Requires applicable Mana flask recovery; gear, flask uptime and actual recovery per second are not simulated." },
  { id: "flaskEffectDuration", label: "Flask Effect Duration", group: "Utility", unit: "10% increased Flask Effect Duration", scale: 10,
    description: "Duration of applicable flask effects, not recovery rate, charges gained or Skill Effect Duration. Longer duration can increase total recovery by lasting longer; scored only here, not again as flask recovery. Reductions subtract value. Flask items, instant recovery, removal at full resource, charges and actual uptime or sustain are not calculated." },
  { id: "cooldownRecoveryRate", label: "Cooldown Recovery Rate", group: "Utility", unit: "10% increased Cooldown Recovery Rate", scale: 10,
    description: "Increased/reduced generic cooldown recovery, not a linear reduction in cooldown seconds or cast speed. Requires an applicable cooldown; skill-specific, minion and enemy modifiers, overrides and actual uptime are not simulated." },
  { id: "warcrySpeed", label: "Warcry Speed", group: "Utility", unit: "10% increased Warcry Speed", scale: 10,
    description: "Increased/reduced speed of using player Warcries, not attack/cast speed, cooldown recovery or damage. Generic Skill Speed is scored separately, never copied here. Requires using a Warcry; instant/triggered use, Action Speed, timing limits and actual use frequency or DPS are not calculated." },
  { id: "warcryCooldownRecoveryRate", label: "Warcry Cooldown Recovery Rate", group: "Utility", unit: "10% increased Warcry Cooldown Recovery Rate", scale: 10,
    description: "Increased/reduced cooldown recovery for player Warcries, not Warcry Speed or a linear percentage reduction in cooldown seconds. Generic cooldown recovery is scored separately, never copied here. Requires a cooldown; bypasses, overrides, charges, tick rounding and actual use frequency or uptime are not calculated." },
  { id: "warcryAreaOfEffect", label: "Warcry Area of Effect", group: "Utility", unit: "Warcry Skills have 10% increased Area of Effect", scale: 10,
    description: "Increased/reduced area of applicable player Warcry Skills, not radius percentage, damage, buff magnitude or empowered-attack area. Generic Area of Effect is scored separately, never copied here. Does not grant a Warcry area component; targets, positioning, minion/proxy ownership and actual coverage or DPS are not calculated." },
  { id: "flaskChargesGained", label: "Flask Charges Gained", group: "Utility", unit: "10% increased Flask Charges gained", scale: 10,
    description: "Generic increased/reduced charges gained, not flat generation, charges used or capacity. Flask-and-Charm lines score only their flask modifier here, once. Life/Mana-specific modifiers have separate preferences; actual flask uptime is not simulated." },
  { id: "lifeFlaskChargesGained", label: "Life Flask Charges Gained", group: "Utility", unit: "10% increased Life Flask Charges gained", scale: 10,
    description: "Life-specific increased/reduced charges gained, not flat generation or charges used. Generic modifiers are scored separately under Flask Charges Gained, not copied here. Actual charges and flask uptime are not simulated." },
  { id: "manaFlaskChargesGained", label: "Mana Flask Charges Gained", group: "Utility", unit: "10% increased Mana Flask Charges gained", scale: 10,
    description: "Mana-specific increased/reduced charges gained, not flat generation or charges used. Generic modifiers are scored separately under Flask Charges Gained, not copied here. Actual charges and flask uptime are not simulated." },
  { id: "lifeFlaskChargeGeneration", label: "Life Flask Charges per Second", group: "Utility", unit: "0.1 Life Flask charges generated per second", scale: 0.1,
    description: "Flat unconditional Life flask charge generation, not a percentage of charges gained or flask recovery. Charges-gained interactions, capacity, charges used and actual flask uptime are not simulated." },
  { id: "manaFlaskChargeGeneration", label: "Mana Flask Charges per Second", group: "Utility", unit: "0.1 Mana Flask charges generated per second", scale: 0.1,
    description: "Flat unconditional Mana flask charge generation, not a percentage of charges gained or flask recovery. Charges-gained interactions, capacity, charges used and actual flask uptime are not simulated." },
  { id: "flaskChargeCostReduction", label: "Flask Charge Cost Reduction", group: "Utility", unit: "10% reduced Flask Charges used", scale: 10,
    description: "Reduced charge cost scores positively; increased cost negatively. Generic charge-cost wording only, separate from Mana-specific cost, charges gained and generation. Rounding, minimum costs and actual flask uptime are not simulated." },
  { id: "manaFlaskChargeCostReduction", label: "Mana Flask Charge Cost Reduction", group: "Utility", unit: "10% reduced Flask Charges used from Mana Flasks", scale: 10,
    description: "Mana-specific reduced charge cost scores positively; increased cost negatively. Generic costs have a separate preference. Rounding, minimum costs, charges gained and actual flask uptime are not simulated." },
  { id: "charmChargesGained", label: "Charm Charges Gained", group: "Utility", unit: "10% increased Charm Charges gained", scale: 10,
    description: "Charm-specific increased/reduced charges gained, not flat charges per second, charges used, capacity or Flask-only charge gain. Combined Flask-and-Charm wording contributes its Charm modifier once here. Requires an applicable Charm; gain sources, interactions, triggers, prohibitions and actual uptime are not calculated." },
  { id: "charmChargeGeneration", label: "Charm Charges per Second", group: "Utility", unit: "0.1 Charm charges generated per second", scale: 0.1,
    description: "Flat unconditional Charm charge generation, not a percentage of charges gained or Flask generation. Displayed charges per second are scored once, not divided by 60 again. Requires an applicable Charm; charge-gain interactions, capacity, costs, triggers, prohibitions and actual uptime are not calculated." },
  { id: "charmChargeCostReduction", label: "Charm Charge Cost Reduction", group: "Utility", unit: "10% reduced Charm Charges used", scale: 10,
    description: "Reduced Charm charge cost scores positively; increased cost negatively. Not charges gained, flat generation, Charm effect duration or Flask charge cost. Requires an applicable Charm; item costs, rounding, minimum costs, no-charge overrides, prohibitions, triggers and actual uptime are not calculated." },
  { id: "charmEffectDuration", label: "Charm Effect Duration", group: "Utility", unit: "10% increased Charm Effect Duration", scale: 10,
    description: "Increased/reduced duration of applicable Charm effects, not effect magnitude, charge generation, Flask duration or Skill Effect Duration. Does not activate a Charm or strengthen its effect. Base durations, item modifiers, triggers, charges, prohibitions and actual protection or uptime are not calculated." },
  { id: "movementSpeed", label: "Movement Speed", group: "Utility", unit: "2% increased Movement Speed", scale: 2 },
  { id: "jewelSockets", label: "Jewel Sockets", group: "Utility", unit: "one empty Jewel Socket (not its jewel effects)", scale: 1 },
  { id: "curseMagnitude", label: "Curse Magnitudes", group: "Utility", unit: "6% increased Curse Magnitudes", scale: 6 },
  { id: "curseDuration", label: "Curse Duration", group: "Utility", unit: "20% increased Curse Duration", scale: 20 },
  { id: "curseArea", label: "Curse Area", group: "Utility", unit: "10% increased Area of Effect of Curses", scale: 10 },
  { id: "curseActivation", label: "Curse Activation Speed", group: "Utility", unit: "10% faster Curse Activation", scale: 10 },
  { id: "markEffect", label: "Mark Effect", group: "Utility", unit: "10% increased Effect of your Mark Skills", scale: 10,
    description: "Outgoing Mark strength, not generic Curse Magnitudes, application, duration or damage against Marked enemies. Requires an applicable player Mark; does not grant one or assume a target is Marked. Audited PoB maps this game wording to LocalEffect, not MarkEffect; the source stat supplies this preference. Mark-specific benefits, overrides, immunity and actual DPS or uptime are not calculated." },
  { id: "markUseSpeed", label: "Mark Use Speed", group: "Utility", unit: "Mark Skills have 10% increased Use Speed", scale: 10,
    description: "Relative speed of using player Mark Skills, not global Skill Speed, Cast Speed, Curse Activation Speed or cooldown recovery. Requires using a Mark. Generic Skill Speed remains a separate source, never copied here. Use time scales reciprocally; cooldowns, triggers, animation limits and actual application frequency are not calculated." },
  { id: "markDuration", label: "Mark Duration", group: "Utility", unit: "Mark Skills have 10% increased Skill Effect Duration", scale: 10,
    description: "Outgoing player Mark duration, not strength, Curse Duration, generic Skill Effect Duration or incoming protection. Requires a duration-based Mark; does not apply one. Generic duration stays separate, never copied here. Base duration, tick rounding, refresh, consumption, overrides and actual uptime are not calculated." },
  { id: "exposureEffect", label: "Exposure Effect", group: "Utility", unit: "10% increased Exposure Effect", scale: 10,
    description: "Relative outgoing Fire/Cold/Lightning Exposure strength, not penetration, added resistance-reduction points, chance, duration or incoming Exposure protection. Counted once here, not once per element. Requires applicable Exposure; does not grant it or assume it is active. Base strength, target restrictions, effect mitigation, rounding, source selection and actual resistance or DPS are not calculated." },
  { id: "skillDuration", label: "Skill Effect Duration", group: "Utility", unit: "10% increased Skill Effect Duration", scale: 10 },
  { id: "areaOfEffect", label: "Area of Effect", group: "Utility", unit: "10% increased Area of Effect", scale: 10 },
  { id: "stunBuildup", label: "Stun Buildup", group: "Utility", unit: "10% increased Stun Buildup", scale: 10,
    description: "Increased/reduced outgoing Stun Buildup, not your Stun Threshold, Stun Recovery or stun duration. Requires stun-capable hit components; melee/weapon-only lines need a reviewed matching focus. Cannot-stun effects, conversions, enemy thresholds and actual stun frequency are not simulated; this is not damage." },
  { id: "freezeBuildup", label: "Freeze Buildup", group: "Utility", unit: "10% increased Freeze Buildup", scale: 10,
    description: "Increased/reduced outgoing Freeze Buildup, not Cold Damage, freeze duration or freeze chance. Requires freeze-capable hits; weapon-only lines need a reviewed matching native-cold focus. Prohibitions, conversions, enemy thresholds and actual freeze frequency are not simulated." },
  { id: "electrocuteBuildup", label: "Electrocute Buildup", group: "Utility", unit: "10% increased Electrocute Buildup", scale: 10,
    description: "Outgoing Electrocute Buildup modifier, not Lightning Damage, Shock chance or Electrocute duration. Does not grant Electrocute application. Requires capable hits; prohibitions, conversions, enemy thresholds and actual buildup or uptime are not calculated." },
  { id: "pinBuildup", label: "Pin Buildup", group: "Utility", unit: "10% increased Pin Buildup", scale: 10,
    description: "Outgoing Pin Buildup modifier, not Physical Damage, Pin duration, chance or Stun Buildup. Does not grant Pin application. Requires capable hits; prohibitions, conversions, enemy thresholds and actual buildup or uptime are not calculated." },
  { id: "immobilisationBuildup", label: "Immobilisation Buildup", group: "Utility", unit: "10% increased Immobilisation buildup", scale: 10,
    description: "Generic outgoing Immobilisation buildup, counted once here, not copied into Freeze, Electrocute, Pin or Stun Buildup preferences. Does not grant application or damage. Requires capable hits; source damage, prohibitions, conversions, enemy thresholds and actual immobilisation frequency or uptime are not calculated." },
  { id: "ailmentMagnitude", label: "Ailment Magnitude", group: "Utility", unit: "10% increased Magnitude of Ailments you inflict", scale: 10,
    description: "Literal generic outgoing ailment magnitude, counted once here, not again as damaging-ailment or individual ailment magnitude. Does not grant application, chance, buildup, duration or hit damage. Minion/player ownership, applicable ailments, enemy thresholds, caps, prohibitions and actual DPS or control are not calculated." },
  { id: "slowMagnitude", label: "Outgoing Slow Magnitude", group: "Utility", unit: "Debuffs you inflict have 10% increased Slow Magnitude", scale: 10,
    description: "Outgoing slow strength of debuffs you inflict, not incoming slow protection, Chill-specific magnitude, Curse Magnitudes, duration or damage. Counted only here, not copied into specific bonuses. Requires an applicable slowing debuff. Reviewed native PoB cannot parse this wording; overlapping slows, caps, ownership and actual enemy speed or uptime are not calculated." },
  { id: "blindChance", label: "Blind Chance on Hit", group: "Utility", unit: "5 percentage points of chance to Blind Enemies on Hit", scale: 5,
    description: "Flat outgoing player Blind chance points, not increased ailment chance, Blind strength/duration or damage against Blinded enemies. Generic and applicable attack-only sources add once here. Requires eligible hits and enemies that can be Blinded; does not assume they are already Blinded. Not minion/proxy chance, capped probability, hit frequency or uptime." },
  { id: "blindEffect", label: "Blind Effect", group: "Utility", unit: "10% increased Blind Effect", scale: 10,
    description: "Outgoing Blind strength, not application chance, duration, outgoing Slow Magnitude or incoming Blind protection. Requires a source of Blind; does not grant it or assume an enemy is Blinded. Native PoB parses the increased form, not reduced; game wording supplies the reduction sign. Enemy stats, immunities, stacking and actual defence or uptime are not calculated." },
  { id: "blindDuration", label: "Blind Duration", group: "Utility", unit: "10% increased Blind duration", scale: 10,
    description: "Outgoing increased/reduced Blind duration, not chance, effect, generic Skill Effect Duration or duration of Blind on you. Requires applicable Blind; does not grant it. Native PoB does not fully parse this wording; source amounts, refresh, immunities and actual duration or uptime are not calculated." },
  { id: "hinderChance", label: "Hinder Chance on Spell Hit", group: "Utility", unit: "5 percentage points of chance to Hinder Enemies on Hit with Spells", scale: 5,
    description: "Flat outgoing Hinder chance points for reviewed player spell-hit components only, not attacks, DoT, curses without hits or minion/proxy hits. Not ailment chance, Slow Magnitude, duration or damage against Hindered enemies. Native PoB does not fully parse this wording; hit frequency, immunities, final probability and uptime are not calculated. Does not assume enemies are already Hindered." },
  { id: "hinderDuration", label: "Hinder Duration", group: "Utility", unit: "10% increased Hinder Duration", scale: 10,
    description: "Outgoing increased/reduced Hinder duration, not application chance, slow strength, generic Skill Effect Duration or incoming protection. Requires a source of Hinder; does not grant it. Native PoB does not fully parse this wording. Stored once here, never copied into Slow Magnitude; base duration, refresh, immunities and uptime are not calculated." },
  { id: "knockbackDistance", label: "Knockback Distance", group: "Utility", unit: "10% increased Knockback Distance", scale: 10,
    description: "Outgoing increased/reduced Knockback distance, not chance, damage, Stun Buildup or incoming Knockback protection. Requires an applicable Knockback source; does not grant it. Native raw modifiers are not proof of final distance. Base distance, rounding, direction, target restrictions, immunities, overrides and actual displacement are not calculated." },
  { id: "maimChance", label: "Maim Chance on Attack Hit", group: "Utility", unit: "5 percentage points of chance for Attacks to Maim on Hit", scale: 5,
    description: "Flat outgoing player attack-hit Maim chance points, not increased ailment chance, Slow Magnitude, incoming Maim protection or damage against Maimed enemies. Requires eligible attack hits and targets; does not assume they are Maimed. Native PoB does not fully parse this wording. Minion/proxy chance, final probability, immunities, duration and uptime are not calculated." },
  { id: "incisionChance", label: "Incision Chance on Attack Hit", group: "Utility", unit: "5 percentage points of chance for Attack Hits to apply Incision", scale: 5,
    description: "Flat outgoing player attack-hit Incision chance points, not Bleeding chance, Incision effect, stacks, ailment chance or damage against affected enemies. Native PoB reduces positive chance to a capability flag and discards its value; exact game wording supplies the numeric preference. The ten-Incision variant is excluded. Target restrictions, stacks, consumption, final probability and uptime are not calculated." },
  { id: "dazeDuration", label: "Daze Duration", group: "Utility", unit: "10% increased Daze Duration", scale: 10,
    description: "Outgoing Daze duration from exact game wording, not Daze chance, generic Skill Effect Duration or incoming protection. Does not grant Daze. Native PoB parsing is incomplete for this stat; final duration, prohibitions and uptime are not calculated." },
  { id: "damagingAilmentMagnitude", label: "Damaging Ailment Magnitude", group: "Offence", unit: "10% increased Magnitude of Damaging Ailments you inflict", scale: 10,
    description: "Generic outgoing damaging-ailment magnitude, counted once here, not copied into Poison, Bleeding or Ignite preferences. Not hit damage, chance, duration or non-damaging ailment magnitude. Requires applicable ailments; ownership, conversions, stack limits, prohibitions and actual DPS are not calculated." },
  { id: "damagingAilmentDuration", label: "Damaging Ailment Duration", group: "Utility", unit: "10% increased Duration of Damaging Ailments on Enemies", scale: 10,
    description: "Generic outgoing damaging-ailment duration, counted once here, not copied into Poison, Bleeding or Ignite duration preferences. Not generic Skill Effect Duration, incoming ailment duration, chance or a flat DPS bonus. Requires applicable ailments; replacement, stacking, prohibitions and actual uptime or DPS are not calculated." },
  { id: "flammabilityMagnitude", label: "Flammability Magnitude", group: "Utility", unit: "10% increased Flammability Magnitude", scale: 10,
    description: "Outgoing Flammability/application modifier, not Ignite damage, Ignite duration or a curse. Requires applicable hits; thresholds, conversions, prohibitions and actual Ignite chance are not simulated." },
  { id: "shockChance", label: "Shock Chance Modifier", group: "Utility", unit: "10% increased chance to Shock", scale: 10,
    description: "Increased/reduced outgoing chance to Shock, not added percentage points, Shock magnitude or Lightning Damage. Requires shock-capable hits; thresholds, prohibitions and actual probability are not simulated." },
  { id: "shockMagnitude", label: "Shock Magnitude", group: "Utility", unit: "10% increased Magnitude of Shock you inflict", scale: 10,
    description: "Outgoing Shock magnitude, not Shock chance, duration or Lightning Damage. Actual enemy damage taken, caps, prohibitions and build DPS are not simulated." },
  { id: "igniteDuration", label: "Ignite Duration", group: "Utility", unit: "10% increased Ignite Duration on Enemies", scale: 10, description: ailmentDurationDescription },
  { id: "poisonDuration", label: "Poison Duration", group: "Utility", unit: "10% increased Poison Duration", scale: 10, description: ailmentDurationDescription },
  { id: "bleedingDuration", label: "Bleeding Duration", group: "Utility", unit: "10% increased Bleeding Duration", scale: 10, description: ailmentDurationDescription },
  { id: "shockDuration", label: "Shock Duration", group: "Utility", unit: "10% increased Shock Duration", scale: 10, description: ailmentDurationDescription },
  { id: "freezeDuration", label: "Freeze Duration", group: "Utility", unit: "10% increased Freeze Duration on Enemies", scale: 10, description: ailmentDurationDescription },
  { id: "projectileDamage", label: "Projectile Damage", group: "Offence", unit: "10% increased Projectile Damage", scale: 10 },
  { id: "projectileSpeed", label: "Projectile Speed", group: "Utility", unit: "10% increased Projectile Speed", scale: 10 },
  { id: "damageOverTime", label: "Damage over Time", group: "Offence", unit: "10% increased Damage over Time", scale: 10 },
  { id: "minionLife", label: "Minion Maximum Life", group: "Defence", unit: "10% increased minion maximum Life", scale: 10 },
  { id: "minionAttackSpeed", label: "Minion Attack Speed", group: "Offence", unit: "3% increased minion Attack Speed", scale: 3 },
  { id: "minionCastSpeed", label: "Minion Cast Speed", group: "Offence", unit: "3% increased minion Cast Speed", scale: 3 },
  { id: "minionCriticalChance", label: "Minion Critical Hit Chance", group: "Offence", unit: "15% increased minion Critical Hit Chance", scale: 15,
    description: "Increased/reduced minion critical chance, not player critical chance or added percentage points. Requires crit-capable minion hits; base chance, prohibitions, caps and actual DPS are not simulated." },
  { id: "minionCriticalDamageBonus", label: "Minion Critical Damage Bonus", group: "Offence", unit: "10% increased minion Critical Damage Bonus", scale: 10,
    description: "Increased/reduced minion critical damage bonus, not player critical bonus, flat added bonus or critical chance. Requires damaging minion critical hits; prohibitions, base bonus and actual DPS are not simulated." },
  { id: "minionAreaOfEffect", label: "Minion Area of Effect", group: "Utility", unit: "10% increased minion Area of Effect", scale: 10,
    description: "Increased/reduced minion area, not player Area of Effect, radius percentage or area damage. Requires an applicable minion area component; overlap, covered targets and actual DPS are not simulated." },
  { id: "minionMovementSpeed", label: "Minion Movement Speed", group: "Utility", unit: "5% increased minion Movement Speed", scale: 5,
    description: "Increased/reduced minion movement, not player movement or minion attack/cast speed. Positioning, pathing, overrides and actual combat uptime are not simulated." },
  { id: "minionFireResistance", label: "Minion Fire Resistance", group: "Defence", unit: "+5% to minion Fire Resistance", scale: 5, description: minionResistanceDescription },
  { id: "minionColdResistance", label: "Minion Cold Resistance", group: "Defence", unit: "+5% to minion Cold Resistance", scale: 5, description: minionResistanceDescription },
  { id: "minionLightningResistance", label: "Minion Lightning Resistance", group: "Defence", unit: "+5% to minion Lightning Resistance", scale: 5, description: minionResistanceDescription },
  { id: "minionChaosResistance", label: "Minion Chaos Resistance", group: "Defence", unit: "+5% to minion Chaos Resistance", scale: 5, description: minionResistanceDescription },
  { id: "minionEvasion", label: "Minion Evasion Rating", group: "Defence", unit: "12% increased minion Evasion Rating", scale: 12,
    description: "Increased/reduced minion Evasion Rating, not player evasion or added evade chance. Requires base minion evasion; enemy accuracy, caps, conversions and actual chance to evade are not calculated." },
  { id: "minionPhysicalDamageReduction", label: "Minion Physical Damage Reduction", group: "Defence", unit: "3% additional minion Physical Damage Reduction", scale: 3,
    description: "Additional minion physical damage reduction percentage points, not Armour, reduced damage taken or player defence. Native total reduction caps at 90%; Armour, hit size, overwhelm, damage types and actual mitigation are not calculated by this heuristic." },
  { id: "minionLifeRecoup", label: "Minion Life Recoup", group: "Defence", unit: "3% of minion Damage taken Recouped as Life", scale: 3,
    description: "Unqualified minion Life recoup, not player recoup, regeneration, instant recovery or mitigation. Native default recovery is over 8 seconds; timing overrides, recovery rates, damage taken, survival and actual sustain are not simulated." },
  { id: "minionMaximumFireResistance", label: "Minion Maximum Fire Resistance", group: "Defence", unit: "+1% to minion Maximum Fire Resistance", scale: 1, description: minionMaximumResistanceDescription },
  { id: "minionMaximumColdResistance", label: "Minion Maximum Cold Resistance", group: "Defence", unit: "+1% to minion Maximum Cold Resistance", scale: 1, description: minionMaximumResistanceDescription },
  { id: "minionMaximumLightningResistance", label: "Minion Maximum Lightning Resistance", group: "Defence", unit: "+1% to minion Maximum Lightning Resistance", scale: 1, description: minionMaximumResistanceDescription },
  { id: "minionCommandDamage", label: "Minion Command Skill Damage", group: "Offence", unit: "10% increased minion Damage with Command Skills", scale: 10,
    description: "Increased/reduced damage of damaging minion Command Skills only, not basic attacks, all minion damage or player damage. Requires using an applicable command; command mix, supply, ailments and actual DPS are not simulated." },
  { id: "minionCommandCooldownRecovery", label: "Minion Command Cooldown Recovery", group: "Utility", unit: "10% increased minion Cooldown Recovery Rate for Command Skills", scale: 10,
    description: "Command-only increased/reduced cooldown recovery, not minion attack/cast speed, player cooldowns or a linear reduction in cooldown seconds. Requires a command with a cooldown; tick rounding, charges, resource supply and actual uptime are not simulated." },
  { id: "minionDuration", label: "Temporary Minion Duration", group: "Utility", unit: "10% increased Minion Duration", scale: 10,
    description: "Increased/reduced lifetime of applicable temporary summons, not persistent-minion uptime, revive speed, command cooldown or generic skill duration. Requires a duration-based summon; early death, supply, replacement limits and actual uptime are not simulated." },
  { id: "minionReservationEfficiency", label: "Minion Reservation Efficiency", group: "Utility", unit: "5% increased Reservation Efficiency of Minion Skills", scale: 5,
    description: "Increased efficiency scores positively; reduced efficiency is a penalty. Applies to reserving Minion Skills, not non-minion buffs, flat Spirit or command Mana costs. Reservation uses reciprocal scaling and rounding, not equal percentage cost reduction; actual summon counts and resource budgets are not calculated." },
  { id: "companionDamage", label: "Companion Damage", group: "Offence", unit: "10% increased Companion Damage", scale: 10,
    description: companionScopeDescription + "Increased/reduced damage modifier, not damage-as-extra, damage transfer to you or full Companion DPS. Components, conversions and conditional effects are not simulated." },
  { id: "companionLife", label: "Companion Maximum Life", group: "Defence", unit: "10% increased Companion maximum Life", scale: 10,
    description: companionScopeDescription + "Increased/reduced maximum Life, not player Life, recovery or damage-sharing mitigation. Base Life, inheritance, revival and actual survival are not calculated." },
  { id: "companionAttackSpeed", label: "Companion Attack Speed", group: "Offence", unit: "3% increased Companion Attack Speed", scale: 3,
    description: companionScopeDescription + "Attack cadence only, not Companion cast speed, movement, commands or cooldown recovery. Requires attacks; skill timing and actual DPS are not simulated." },
  { id: "companionMovementSpeed", label: "Companion Movement Speed", group: "Utility", unit: "5% increased Companion Movement Speed", scale: 5,
    description: companionScopeDescription + "Movement only, not attack/cast speed. Positioning, pathing, mounted-player movement and actual combat uptime are not simulated." },
  { id: "companionAreaOfEffect", label: "Companion Area of Effect", group: "Utility", unit: "10% increased Companion Area of Effect", scale: 10,
    description: companionScopeDescription + "Requires an applicable Companion area component; not radius percentage, area damage or guaranteed coverage. Basic single-target attacks do not gain an area from this preference." },
  { id: "companionFireResistance", label: "Companion Fire Resistance", group: "Defence", unit: "+5% to Companion Fire Resistance", scale: 5, description: companionResistanceDescription },
  { id: "companionColdResistance", label: "Companion Cold Resistance", group: "Defence", unit: "+5% to Companion Cold Resistance", scale: 5, description: companionResistanceDescription },
  { id: "companionLightningResistance", label: "Companion Lightning Resistance", group: "Defence", unit: "+5% to Companion Lightning Resistance", scale: 5, description: companionResistanceDescription },
  { id: "companionChaosResistance", label: "Companion Chaos Resistance", group: "Defence", unit: "+5% to Companion Chaos Resistance", scale: 5, description: companionResistanceDescription },
  { id: "companionReservationEfficiency", label: "Companion Reservation Efficiency", group: "Utility", unit: "5% increased Reservation Efficiency of Companion Skills", scale: 5,
    description: "Companion-skill efficiency, separate from broader Minion Reservation Efficiency. Increased efficiency scores positively; reductions are penalties. Not flat Spirit or equal percentage cost reduction: reciprocal scaling, rounding, resource supply and Companion limits determine actual counts, which are not calculated." },
] as const;

export type PassivePreferenceId = typeof passivePreferenceCatalog[number]["id"];
export type PassivePreference = { id: PassivePreferenceId; weight: number };
export type PassiveOptimizationSettings = {
  mode: "shortest" | "weighted";
  extraPointBudget: number;
  pointBudgetMode?: "extra" | "all-available";
  preferences: PassivePreference[];
  focusSkillId?: string;
  supportGemIds?: string[];
  socketedGrenadeId?: string;
  socketedProxySkillId?: string;
};
export type PassivePreferenceContribution = { id: PassivePreferenceId; label: string; score: number; nodeCount: number };
export type WeightedRouteScore = {
  score: number;
  baselinePointCost: number;
  maxPointCost: number;
  baselineExact: boolean;
  contributions: PassivePreferenceContribution[];
  stage?: "baseline" | "preferences";
  pointBudgetMode?: "all-available";
  basePointCost?: number;
  totalPointLimit?: number;
};

export function defaultPassiveOptimizationSettings(): PassiveOptimizationSettings {
  return { mode: "shortest", extraPointBudget: 5, preferences: [] };
}

export function normalizePassiveOptimizationSettings(value: unknown): PassiveOptimizationSettings {
  const defaults = defaultPassiveOptimizationSettings();
  if (!value || typeof value !== "object") return defaults;
  const record = value as Record<string, unknown>;
  const preferences = new Map<PassivePreferenceId, PassivePreference>();
  if (Array.isArray(record.preferences)) {
    for (const item of record.preferences) {
      if (!item || typeof item !== "object") continue;
      const { id, weight } = item as Record<string, unknown>;
      if (!passivePreferenceCatalog.some((effect) => effect.id === id)) continue;
      if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) continue;
      preferences.set(id as PassivePreferenceId, { id: id as PassivePreferenceId, weight: Math.min(3, Math.max(1, Math.round(weight))) });
    }
  }
  const supportGemIds = normalizeSkillSupportIds(record.focusSkillId, record.supportGemIds);
  const socketedGrenadeId = normalizeSocketedGrenadeId(record.focusSkillId, record.socketedGrenadeId);
  const socketedProxySkillId = normalizeSocketedProxySkillId(record.focusSkillId, record.socketedProxySkillId);
  return {
    mode: record.mode === "weighted" ? "weighted" : "shortest",
    extraPointBudget: typeof record.extraPointBudget === "number" && Number.isFinite(record.extraPointBudget)
      ? Math.min(maxPassiveAllocationPointCount, Math.max(0, Math.floor(record.extraPointBudget))) : defaults.extraPointBudget,
    ...(record.pointBudgetMode === "all-available" ? { pointBudgetMode: "all-available" as const } : {}),
    preferences: [...preferences.values()],
    ...(getSkillPreferencePreset(record.focusSkillId) ? { focusSkillId: record.focusSkillId as string } : {}),
    ...(supportGemIds.length > 0 ? { supportGemIds } : {}),
    ...(socketedGrenadeId ? { socketedGrenadeId } : {}),
    ...(socketedProxySkillId ? { socketedProxySkillId } : {}),
  };
}

export type PassivePreferenceContext = Pick<PassiveOptimizationSettings, "focusSkillId" | "supportGemIds" | "socketedGrenadeId" | "socketedProxySkillId">;

const ailmentModifierIds: Readonly<Record<string, PassivePreferenceId>> = {
  "flammability magnitude": "flammabilityMagnitude", "ignite magnitude": "igniteMagnitude",
  "magnitude of shock you inflict": "shockMagnitude", "magnitude of poison you inflict": "poisonMagnitude",
  "magnitude of bleeding you inflict": "bleedingMagnitude", "chance to shock": "shockChance",
  "ignite duration on enemies": "igniteDuration", "poison duration": "poisonDuration", "bleeding duration": "bleedingDuration",
  "shock duration": "shockDuration", "freeze duration on enemies": "freezeDuration",
};
const penetrationIds: Readonly<Record<string, PassivePreferenceId>> = {
  "fire resistance": "firePenetration", "cold resistance": "coldPenetration", "lightning resistance": "lightningPenetration",
  "of enemy elemental resistances": "elementalPenetration",
};
const playerResistanceIds: Readonly<Record<string, readonly PassivePreferenceId[]>> = {
  "fire resistance": ["fireResistance"], "cold resistance": ["coldResistance"],
  "lightning resistance": ["lightningResistance"], "chaos resistance": ["chaosResistance"],
  "all elemental resistances": ["fireResistance", "coldResistance", "lightningResistance"],
  "maximum fire resistance": ["maximumFireResistance"], "maximum cold resistance": ["maximumColdResistance"],
  "maximum lightning resistance": ["maximumLightningResistance"],
  "all maximum elemental resistances": ["maximumFireResistance", "maximumColdResistance", "maximumLightningResistance"],
};
const unconditionalModifierIds: Readonly<Record<string, readonly PassivePreferenceId[]>> = {
  // Keep generic speed as one preference despite the native action-stat fan-out.
  "damage": ["genericDamage"], "skill speed": ["skillSpeed"], "magnitude of chill you inflict": ["chillMagnitude"],
  "chance to inflict ailments": ["ailmentChance"],
  "electrocute buildup": ["electrocuteBuildup"], "pin buildup": ["pinBuildup"], "daze duration": ["dazeDuration"],
  "magnitude of damaging ailments you inflict": ["damagingAilmentMagnitude"],
  "magnitude of ailments you inflict": ["ailmentMagnitude"], "immobilisation buildup": ["immobilisationBuildup"],
  "duration of damaging ailments on enemies": ["damagingAilmentDuration"],
  "effect of fully broken armour": ["fullyBrokenArmourEffect"], "armour break duration": ["armourBreakDuration"],
  "mana cost efficiency": ["manaCostEfficiency"],
  "speed of recoup effects": ["recoupSpeed"], "flask effect duration": ["flaskEffectDuration"],
  "totem damage": ["totemDamage"], "totem life": ["totemLife"],
  "totem placement speed": ["totemPlacementSpeed"], "totem duration": ["totemDuration"],
  "totem placement range": ["totemPlacementRange"], "area of effect for skills used by totems": ["totemAreaOfEffect"],
  "minion duration": ["minionDuration"], "reservation efficiency of minion skills": ["minionReservationEfficiency"],
  "reservation efficiency of companion skills": ["companionReservationEfficiency"],
  "stun recovery": ["stunRecovery"], "presence area of effect": ["presenceArea"],
  "amount of life leeched": ["lifeLeechAmount"], "amount of mana leeched": ["manaLeechAmount"],
  "elemental ailment threshold": ["elementalAilmentThreshold"], "cooldown recovery rate": ["cooldownRecoveryRate"],
  "freeze threshold": ["freezeThreshold"],
  "warcry speed": ["warcrySpeed"], "warcry cooldown recovery rate": ["warcryCooldownRecoveryRate"],
  "life recovery from flasks": ["lifeFlaskRecovery"], "mana recovery from flasks": ["manaFlaskRecovery"],
  "life and mana recovery from flasks": ["lifeFlaskRecovery", "manaFlaskRecovery"],
  "flask charges gained": ["flaskChargesGained"], "flask and charm charges gained": ["flaskChargesGained", "charmChargesGained"],
  "charm charges gained": ["charmChargesGained"], "charm effect duration": ["charmEffectDuration"],
  "life flask charges gained": ["lifeFlaskChargesGained"], "mana flask charges gained": ["manaFlaskChargesGained"],
};
const recoupIds: Readonly<Record<string, readonly PassivePreferenceId[]>> = {
  life: ["lifeRecoup"], mana: ["manaRecoup"], "energy shield": ["energyShieldRecoup"],
  "life, mana and energy shield": ["lifeRecoup", "manaRecoup", "energyShieldRecoup"],
};
const chargeCostReductionIds: Readonly<Record<string, PassivePreferenceId>> = {
  "flask charges used": "flaskChargeCostReduction", "flask charges used from mana flasks": "manaFlaskChargeCostReduction",
  "charm charges used": "charmChargeCostReduction",
};
const incomingDebuffEffectIds: Readonly<Record<string, PassivePreferenceId>> = {
  "slowing potency of debuffs on you": "slowPotencyReduction", "effect of curses on you": "curseEffectReduction",
  "effect of chill on you": "chillEffectReduction", "effect of shock on you": "shockEffectReduction",
  "magnitude of ignite on you": "igniteEffectReduction", "duration of ailments on you": "ailmentDurationReduction",
};
const minionModifierIds: Readonly<Record<string, PassivePreferenceId>> = {
  "critical hit chance": "minionCriticalChance", "critical damage bonus": "minionCriticalDamageBonus",
  "area of effect": "minionAreaOfEffect", "movement speed": "minionMovementSpeed", "evasion rating": "minionEvasion",
  "cooldown recovery rate for command skills": "minionCommandCooldownRecovery",
};
const minionResistanceIds: Readonly<Record<string, readonly PassivePreferenceId[]>> = {
  "fire resistance": ["minionFireResistance"], "cold resistance": ["minionColdResistance"],
  "lightning resistance": ["minionLightningResistance"], "chaos resistance": ["minionChaosResistance"],
  "all elemental resistances": ["minionFireResistance", "minionColdResistance", "minionLightningResistance"],
  "maximum fire resistances": ["minionMaximumFireResistance"], "maximum cold resistances": ["minionMaximumColdResistance"],
  "maximum lightning resistances": ["minionMaximumLightningResistance"],
  "all maximum elemental resistances": ["minionMaximumFireResistance", "minionMaximumColdResistance", "minionMaximumLightningResistance"],
};
const resourceCapIds: Readonly<Record<string, PassivePreferenceId>> = {
  "rage": "maximumRage", "frenzy charges": "maximumFrenzyCharges", "power charges": "maximumPowerCharges", "endurance charges": "maximumEnduranceCharges",
};
const resourceDurationIds: Readonly<Record<string, readonly PassivePreferenceId[]>> = {
  "frenzy charge duration": ["frenzyChargeDuration"], "power charge duration": ["powerChargeDuration"],
  "endurance charge duration": ["enduranceChargeDuration"],
  "endurance, frenzy and power charge duration": ["enduranceChargeDuration","frenzyChargeDuration","powerChargeDuration"],
  "elemental infusion duration": ["elementalInfusionDuration"],
};
const companionModifierIds: Readonly<Record<string, PassivePreferenceId>> = {
  "maximum life": "companionLife", "attack speed": "companionAttackSpeed",
  "movement speed": "companionMovementSpeed", "area of effect": "companionAreaOfEffect",
};
const companionResistanceIds: Readonly<Record<string, readonly PassivePreferenceId[]>> = {
  "fire resistance": ["companionFireResistance"], "cold resistance": ["companionColdResistance"],
  "lightning resistance": ["companionLightningResistance"], "chaos resistance": ["companionChaosResistance"],
  "all elemental resistances": ["companionFireResistance", "companionColdResistance", "companionLightningResistance"],
};
const totemResistanceIds: Readonly<Record<string, readonly PassivePreferenceId[]>> = {
  "fire resistance": ["totemFireResistance"], "cold resistance": ["totemColdResistance"], "lightning resistance": ["totemLightningResistance"],
  "all elemental resistances": ["totemFireResistance", "totemColdResistance", "totemLightningResistance"],
  "all maximum elemental resistances": ["totemMaximumFireResistance", "totemMaximumColdResistance", "totemMaximumLightningResistance"],
};

// Only full, unconditional stat lines are recognized. Skill-scoped lines also
// require an explicitly reviewed preset scope, not a node name or gem tag match.
export function passivePreferenceValues(node: TreeNode, context: PassivePreferenceContext = {}): Partial<Record<PassivePreferenceId, number>> {
  const values: Partial<Record<PassivePreferenceId, number>> = {};
  const preset = resolveSkillPreferencePreset(context);
  const scopes = preset ? skillPassiveStatScopes(preset, context.supportGemIds) : [];
  const add = (id: PassivePreferenceId, value: number) => { values[id] = (values[id] ?? 0) + value; };
  const stats: Record<string, PassivePreferenceId> = {
    "maximum life": "life", "maximum mana": "mana", "maximum energy shield": "energyShield",
    "energy shield": "energyShield", armour: "armour", "evasion rating": "evasion", evasion: "evasion",
    "minion damage": "minionDamage", "attack damage": "attackDamage", "spell damage": "spellDamage",
    "physical damage": "physicalDamage", "elemental damage": "elementalDamage", "fire damage": "fireDamage",
    "cold damage": "coldDamage", "lightning damage": "lightningDamage", "chaos damage": "chaosDamage",
    "attack speed": "attackSpeed", "cast speed": "castSpeed", "movement speed": "movementSpeed",
    "critical hit chance": "criticalChance", "critical strike chance": "criticalChance",
    "curse magnitudes": "curseMagnitude", "curse duration": "curseDuration", "area of effect of curses": "curseArea",
    "skill effect duration": "skillDuration", "area of effect": "areaOfEffect",
    "projectile damage": "projectileDamage", "projectile speed": "projectileSpeed", "damage over time": "damageOverTime",
  };
  for (const rawLine of node.stats) {
    const line = rawLine.trim().replace(/\s+/g, " ").toLowerCase();
    const percent = /^([\d.]+)% (increased|reduced) (.+)$/.exec(line);
    if (percent) {
      const value = Number(percent[1]) * (percent[2] === "reduced" ? -1 : 1);
      const labels = percent[3].replace(/^maximum life, mana and energy shield$/, "maximum life, maximum mana and maximum energy shield")
        .replace(/^attack and cast speed$/, "attack speed and cast speed")
        .split(/,\s*(?:and\s+)?| and /);
      for (const label of labels.every((label) => Object.hasOwn(stats, label)) ? labels : []) {
        const id = stats[label];
        if (id) add(id, value);
      }
    }
    const minionDamage = /^minions deal ([\d.]+)% (increased|reduced) damage$/.exec(line);
    const heraldReservation = /^(\d+(?:\.\d+)?)% (increased|reduced) reservation efficiency of herald skills$/.exec(line);
    if (heraldReservation) add("heraldReservationEfficiency", Number(heraldReservation[1]) * (heraldReservation[2] === "reduced" ? -1 : 1));
    const heraldModifier = /^herald skills (deal|have) (\d+(?:\.\d+)?)% (increased|reduced) (damage|area of effect)$/.exec(line);
    if (heraldModifier) {
      const damage = heraldModifier[1] === "deal" && heraldModifier[4] === "damage";
      const area = heraldModifier[1] === "have" && heraldModifier[4] === "area of effect";
      if (damage && scopes.includes("heraldDamage") || area && scopes.includes("heraldAreaOfEffect")) {
        add(damage ? "genericDamage" : "areaOfEffect", Number(heraldModifier[2]) * (heraldModifier[3] === "reduced" ? -1 : 1));
      }
    }
    const gloryGeneration = /^(\d+(?:\.\d+)?)% (increased|reduced) glory generation$/.exec(line);
    if (gloryGeneration) add("gloryGeneration", Number(gloryGeneration[1]) * (gloryGeneration[2] === "reduced" ? -1 : 1));
    const auraMagnitude = /^aura skills have (\d+(?:\.\d+)?)% (increased|reduced) magnitudes$/.exec(line);
    if (auraMagnitude) add("auraMagnitude", Number(auraMagnitude[1]) * (auraMagnitude[2] === "reduced" ? -1 : 1));
    const bannerModifier = /^banner skills have (\d+(?:\.\d+)?)% (increased|reduced) (aura magnitudes|area of effect)$/.exec(line);
    if (bannerModifier) {
      const magnitude = bannerModifier[3] === "aura magnitudes";
      if (scopes.includes(magnitude ? "bannerAuraMagnitude" : "bannerAreaOfEffect")) {
        add(magnitude ? "auraMagnitude" : "areaOfEffect", Number(bannerModifier[1]) * (bannerModifier[2] === "reduced" ? -1 : 1));
      }
    }
    const bannerGlory = /^(\d+(?:\.\d+)?)% (increased|reduced) glory generation for banner skills$/.exec(line);
    if (bannerGlory && scopes.includes("bannerGloryGeneration")) add("gloryGeneration", Number(bannerGlory[1]) * (bannerGlory[2] === "reduced" ? -1 : 1));
    if (minionDamage) add("minionDamage", Number(minionDamage[1]) * (minionDamage[2] === "reduced" ? -1 : 1));
    const totemAttackSpeed = /^attacks used by totems have (\d+(?:\.\d+)?)% (increased|reduced) attack speed$/.exec(line);
    if (totemAttackSpeed) add("totemAttackSpeed", Number(totemAttackSpeed[1]) * (totemAttackSpeed[2] === "reduced" ? -1 : 1));
    const totemCastSpeed = /^spells cast by totems have (\d+(?:\.\d+)?)% (increased|reduced) cast speed$/.exec(line);
    if (totemCastSpeed) add("totemCastSpeed", Number(totemCastSpeed[1]) * (totemCastSpeed[2] === "reduced" ? -1 : 1));
    const warcryArea = /^warcry skills have (\d+(?:\.\d+)?)% (increased|reduced) area of effect$/.exec(line);
    if (warcryArea) add("warcryAreaOfEffect", Number(warcryArea[1]) * (warcryArea[2] === "reduced" ? -1 : 1));
    const playerResistance = /^([+-]\d+(?:\.\d+)?)% to (.+)$/.exec(line);
    if (playerResistance && Object.hasOwn(playerResistanceIds, playerResistance[2])) {
      for (const id of playerResistanceIds[playerResistance[2]]) add(id, Number(playerResistance[1]));
    }
    const totemResistance = /^totems gain ([+-]\d+(?:\.\d+)?)% to (.+)$/.exec(line);
    if (totemResistance && Object.hasOwn(totemResistanceIds, totemResistance[2])) {
      for (const id of totemResistanceIds[totemResistance[2]]) add(id, Number(totemResistance[1]));
    }
    const totemPhysicalReduction = /^totems have ([+-]?\d+(?:\.\d+)?)% additional physical damage reduction$/.exec(line);
    if (totemPhysicalReduction) add("totemPhysicalDamageReduction", Number(totemPhysicalReduction[1]));
    const totemRegeneration = /^totems regenerate (\d+(?:\.\d+)?)% of maximum life per second$/.exec(line);
    if (totemRegeneration) add("totemLifeRegeneration", Number(totemRegeneration[1]));
    const lifeRegeneration = /^regenerate (\d+(?:\.\d+)?)% of maximum life per second$/.exec(line);
    if (lifeRegeneration) add("lifeRegenerationPercent", Number(lifeRegeneration[1]));
    const recoveryOnKill = /^(recover|lose) (\d+(?:\.\d+)?)% of maximum (life|mana) on kill$/.exec(line);
    if (recoveryOnKill) add(recoveryOnKill[3] === "life" ? "lifeRecoveryOnKill" : "manaRecoveryOnKill",
      Number(recoveryOnKill[2]) * (recoveryOnKill[1] === "lose" ? -1 : 1));
    const debuffExpiry = /^debuffs on you expire (\d+(?:\.\d+)?)% (faster|slower)$/.exec(line);
    if (debuffExpiry) add("debuffExpirySpeed", Number(debuffExpiry[1]) * (debuffExpiry[2] === "slower" ? -1 : 1));
    const slowMagnitude = /^debuffs you inflict have (\d+(?:\.\d+)?)% (increased|reduced) slow magnitude$/.exec(line);
    if (slowMagnitude) add("slowMagnitude", Number(slowMagnitude[1]) * (slowMagnitude[2] === "reduced" ? -1 : 1));
    const markEffect = /^(\d+(?:\.\d+)?)% (increased|reduced) effect of your mark skills$/.exec(line);
    if (markEffect) add("markEffect", Number(markEffect[1]) * (markEffect[2] === "reduced" ? -1 : 1));
    const markTiming = /^mark skills have (\d+(?:\.\d+)?)% (increased|reduced) (use speed|skill effect duration)$/.exec(line);
    if (markTiming) add(markTiming[3] === "use speed" ? "markUseSpeed" : "markDuration", Number(markTiming[1]) * (markTiming[2] === "reduced" ? -1 : 1));
    const exposureEffect = /^(\d+(?:\.\d+)?)% (increased|reduced) exposure effect$/.exec(line);
    if (exposureEffect) add("exposureEffect", Number(exposureEffect[1]) * (exposureEffect[2] === "reduced" ? -1 : 1));
    const blindChance = /^([+-]?\d+(?:\.\d+)?)% chance to blind enemies on hit( with attacks)?$/.exec(line);
    if (blindChance && (!blindChance[2] || scopes.includes("attackBlindChance"))) add("blindChance", Number(blindChance[1]));
    const blindHinderModifier = /^(\d+(?:\.\d+)?)% (increased|reduced) (blind effect|blind duration|hinder duration)$/.exec(line);
    if (blindHinderModifier) {
      const id = blindHinderModifier[3] === "blind effect" ? "blindEffect" : blindHinderModifier[3] === "blind duration" ? "blindDuration" : "hinderDuration";
      add(id, Number(blindHinderModifier[1]) * (blindHinderModifier[2] === "reduced" ? -1 : 1));
    }
    const spellHinderChance = /^([+-]?\d+(?:\.\d+)?)% chance to hinder enemies on hit with spells$/.exec(line);
    if (scopes.includes("spellHinderChance") && spellHinderChance) add("hinderChance", Number(spellHinderChance[1]));
    const knockbackDistance = /^(\d+(?:\.\d+)?)% (increased|reduced) knockback distance$/.exec(line);
    if (knockbackDistance) add("knockbackDistance", Number(knockbackDistance[1]) * (knockbackDistance[2] === "reduced" ? -1 : 1));
    const attackMaimChance = /^attacks have ([+-]?\d+(?:\.\d+)?)% chance to maim on hit$/.exec(line);
    if (scopes.includes("attackMaimChance") && attackMaimChance) add("maimChance", Number(attackMaimChance[1]));
    const attackIncisionChance = /^([+-]?\d+(?:\.\d+)?)% chance for attack hits to apply incision$/.exec(line);
    if (scopes.includes("attackIncisionChance") && attackIncisionChance) add("incisionChance", Number(attackIncisionChance[1]));
    const flatAilmentChance = /^([+-]?\d+(?:\.\d+)?)% chance to (poison|inflict bleeding|daze) on hit$/.exec(line);
    if (flatAilmentChance) {
      const id = flatAilmentChance[2] === "poison" ? "poisonChance" : flatAilmentChance[2] === "inflict bleeding" ? "bleedingChance" : "dazeChance";
      add(id, Number(flatAilmentChance[1]));
    }
    const armourBreakAmount = /^break (\d+(?:\.\d+)?)% (increased|reduced) armour$/.exec(line);
    if (armourBreakAmount) add("armourBreakAmount", Number(armourBreakAmount[1]) * (armourBreakAmount[2] === "reduced" ? -1 : 1));
    const minionCommandDamage = /^minions deal (\d+(?:\.\d+)?)% (increased|reduced) damage with command skills$/.exec(line);
    if (minionCommandDamage) add("minionCommandDamage", Number(minionCommandDamage[1]) * (minionCommandDamage[2] === "reduced" ? -1 : 1));
    const minionSpeed = /^minions have ([\d.]+)% (increased|reduced) (attack|cast|attack and cast) speed$/.exec(line);
    if (minionSpeed) {
      const value = Number(minionSpeed[1]) * (minionSpeed[2] === "reduced" ? -1 : 1);
      add("minionSpeed", value * (minionSpeed[3] === "attack and cast" ? 2 : 1));
      if (minionSpeed[3].includes("attack")) add("minionAttackSpeed", value);
      if (minionSpeed[3].includes("cast")) add("minionCastSpeed", value);
    }
    const minionLife = /^minions have (\d+(?:\.\d+)?)% (increased|reduced) maximum life$/.exec(line);
    if (minionLife) add("minionLife", Number(minionLife[1]) * (minionLife[2] === "reduced" ? -1 : 1));
    const minionModifier = /^minions have (\d+(?:\.\d+)?)% (increased|reduced) (.+)$/.exec(line);
    if (minionModifier && Object.hasOwn(minionModifierIds, minionModifier[3])) {
      add(minionModifierIds[minionModifier[3]], Number(minionModifier[1]) * (minionModifier[2] === "reduced" ? -1 : 1));
    }
    const minionResistance = /^minions have ([+-]\d+(?:\.\d+)?)% to (.+)$/.exec(line);
    if (minionResistance && Object.hasOwn(minionResistanceIds, minionResistance[2])) {
      for (const id of minionResistanceIds[minionResistance[2]]) add(id, Number(minionResistance[1]));
    }
    const minionPhysicalReduction = /^minions have ([+-]?\d+(?:\.\d+)?)% additional physical damage reduction$/.exec(line);
    if (minionPhysicalReduction) add("minionPhysicalDamageReduction", Number(minionPhysicalReduction[1]));
    const minionRecoup = /^minions recoup (\d+(?:\.\d+)?)% of damage taken as life$/.exec(line);
    if (minionRecoup) add("minionLifeRecoup", Number(minionRecoup[1]));
    const companionDamage = /^companions deal (\d+(?:\.\d+)?)% (increased|reduced) damage$/.exec(line);
    if (companionDamage) add("companionDamage", Number(companionDamage[1]) * (companionDamage[2] === "reduced" ? -1 : 1));
    const companionModifier = /^companions have (\d+(?:\.\d+)?)% (increased|reduced) (.+)$/.exec(line);
    if (companionModifier && Object.hasOwn(companionModifierIds, companionModifier[3])) {
      add(companionModifierIds[companionModifier[3]], Number(companionModifier[1]) * (companionModifier[2] === "reduced" ? -1 : 1));
    }
    const companionResistance = /^companions have ([+-]\d+(?:\.\d+)?)% to (.+)$/.exec(line);
    if (companionResistance && Object.hasOwn(companionResistanceIds, companionResistance[2])) {
      for (const id of companionResistanceIds[companionResistance[2]]) add(id, Number(companionResistance[1]));
    }
    const rechargeStart = /^(\d+(?:\.\d+)?)% (faster|slower) start of energy shield recharge$/.exec(line);
    if (rechargeStart) add("energyShieldRechargeStart", Number(rechargeStart[1]) * (rechargeStart[2] === "slower" ? -1 : 1));
    const recoveryRate = /^(\d+(?:\.\d+)?)% (increased|reduced) (energy shield recharge|life regeneration|mana regeneration) rate$/.exec(line);
    if (recoveryRate) {
      const id = recoveryRate[3] === "energy shield recharge" ? "energyShieldRechargeRate" : recoveryRate[3] === "life regeneration" ? "lifeRegenerationRate" : "manaRegenerationRate";
      add(id, Number(recoveryRate[1]) * (recoveryRate[2] === "reduced" ? -1 : 1));
    }
    const unconditionalModifier = /^(\d+(?:\.\d+)?)% (increased|reduced) (.+)$/.exec(line);
    if (unconditionalModifier && Object.hasOwn(resourceDurationIds, unconditionalModifier[3])) {
      const value = Number(unconditionalModifier[1]) * (unconditionalModifier[2] === "reduced" ? -1 : 1);
      if (Number.isFinite(value)) for (const id of resourceDurationIds[unconditionalModifier[3]]) add(id,value);
    }
    const resourceCap = /^([+-]\d+) to maximum (rage|frenzy charges|power charges|endurance charges)$/.exec(line);
    if (resourceCap && Number.isFinite(Number(resourceCap[1]))) add(resourceCapIds[resourceCap[2]],Number(resourceCap[1]));
    const remnantEffect = /^remnants you create have (\d+(?:\.\d+)?)% (increased|reduced) effect$/.exec(line);
    if (remnantEffect && Number.isFinite(Number(remnantEffect[1]))) add("remnantEffect",Number(remnantEffect[1]) * (remnantEffect[2] === "reduced" ? -1 : 1));
    const remnantPickup = /^remnants can be collected from (\d+(?:\.\d+)?)% further away$/.exec(line);
    if (remnantPickup && Number.isFinite(Number(remnantPickup[1]))) add("remnantPickupRange",Number(remnantPickup[1]));
    const metaEnergy = /^meta skills gain (\d+(?:\.\d+)?)% (increased|reduced) energy$/.exec(line);
    if (metaEnergy && Number.isFinite(Number(metaEnergy[1]))) add("metaEnergyGain",Number(metaEnergy[1]) * (metaEnergy[2] === "reduced" ? -1 : 1));
    const revival = /^minions revive (\d+(?:\.\d+)?)% (faster|slower)$/.exec(line);
    const reload = /^(\d+(?:\.\d+)?)% (increased|reduced) crossbow reload speed$/.exec(line);
    if (reload && Number.isFinite(Number(reload[1]))) add("crossbowReloadSpeed", Number(reload[1]) * (reload[2] === "reduced" ? -1 : 1));
    if (revival && Number.isFinite(Number(revival[1]))) add("minionRevivalSpeed",Number(revival[1]) * (revival[2] === "slower" ? -1 : 1));
    const triggered = /^triggered spells deal (\d+(?:\.\d+)?)% (increased|reduced) spell damage$/.exec(line);
    if (scopes.includes("triggeredSpellDamage") && triggered && Number.isFinite(Number(triggered[1]))) add("spellDamage",Number(triggered[1]) * (triggered[2] === "reduced" ? -1 : 1));
    const additionalRemnant = /^(\d+(?:\.\d+)?)% chance to create an additional remnant$/.exec(line);
    if (additionalRemnant && Number.isFinite(Number(additionalRemnant[1]))) add("additionalRemnantChance",Number(additionalRemnant[1]));
    if (unconditionalModifier && Object.hasOwn(unconditionalModifierIds, unconditionalModifier[3])) {
      const value = Number(unconditionalModifier[1]) * (unconditionalModifier[2] === "reduced" ? -1 : 1);
      for (const id of unconditionalModifierIds[unconditionalModifier[3]]) add(id, value);
    }
    if (unconditionalModifier && Object.hasOwn(chargeCostReductionIds, unconditionalModifier[3])) {
      add(chargeCostReductionIds[unconditionalModifier[3]], Number(unconditionalModifier[1]) * (unconditionalModifier[2] === "reduced" ? 1 : -1));
    }
    if (unconditionalModifier && Object.hasOwn(incomingDebuffEffectIds, unconditionalModifier[3])) {
      add(incomingDebuffEffectIds[unconditionalModifier[3]], Number(unconditionalModifier[1]) * (unconditionalModifier[2] === "reduced" ? 1 : -1));
    }
    const movementPenalty = /^(\d+(?:\.\d+)?)% reduced movement speed penalty from using skills while moving$/.exec(line);
    if (movementPenalty) add("skillMovementPenaltyReduction", Number(movementPenalty[1]));
    const lifeLeechSpeed = /^leech life (\d+(?:\.\d+)?)% (faster|slower)$/.exec(line);
    if (lifeLeechSpeed) add("lifeLeechSpeed", Number(lifeLeechSpeed[1]) * (lifeLeechSpeed[2] === "slower" ? -1 : 1));
    const recoup = /^(\d+(?:\.\d+)?)% of damage taken recouped as (.+)$/.exec(line);
    if (recoup && Object.hasOwn(recoupIds, recoup[2])) for (const id of recoupIds[recoup[2]]) add(id, Number(recoup[1]));
    const flaskGeneration = /^(life|mana) flasks gain (\d+(?:\.\d+)?) charges? per second$/.exec(line);
    if (flaskGeneration) add(flaskGeneration[1] === "life" ? "lifeFlaskChargeGeneration" : "manaFlaskChargeGeneration", Number(flaskGeneration[2]));
    const charmGeneration = /^charms gain (\d+(?:\.\d+)?) charges? per second$/.exec(line);
    if (charmGeneration) add("charmChargeGeneration", Number(charmGeneration[1]));
    const combatModifier = /^(\d+(?:\.\d+)?)% (increased|reduced) (accuracy rating|block chance|stun threshold)$/.exec(line);
    if (combatModifier) {
      const id = combatModifier[3] === "accuracy rating" ? "accuracy" : combatModifier[3] === "block chance" ? "blockChance" : "stunThreshold";
      add(id, Number(combatModifier[1]) * (combatModifier[2] === "reduced" ? -1 : 1));
    }
    const criticalBuildup = /^(\d+(?:\.\d+)?)% (increased|reduced) (critical damage bonus|stun buildup|freeze buildup)$/.exec(line);
    if (criticalBuildup) {
      const id = criticalBuildup[3] === "critical damage bonus" ? "criticalDamageBonus" : criticalBuildup[3] === "stun buildup" ? "stunBuildup" : "freezeBuildup";
      add(id, Number(criticalBuildup[1]) * (criticalBuildup[2] === "reduced" ? -1 : 1));
    }
    const ailment = /^(\d+(?:\.\d+)?)% (increased|reduced) (.+)$/.exec(line);
    if (ailment && Object.hasOwn(ailmentModifierIds, ailment[3])) add(ailmentModifierIds[ailment[3]], Number(ailment[1]) * (ailment[2] === "reduced" ? -1 : 1));
    const penetration = /^damage penetrates (\d+(?:\.\d+)?)% (.+)$/.exec(line);
    if (penetration && Object.hasOwn(penetrationIds, penetration[2])) add(penetrationIds[penetration[2]], Number(penetration[1]));
    const curseActivation = /^(\d+(?:\.\d+)?)% (faster|slower) curse activation$/.exec(line);
    if (curseActivation) add("curseActivation", Number(curseActivation[1]) * (curseActivation[2] === "slower" ? -1 : 1));
    const scopedProjectileSpeed = /^(\d+(?:\.\d+)?)% (increased|reduced) projectile speed for spell skills$/.exec(line);
    const plantDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) damage with plant skills$/.exec(line);
    if (scopes.includes("plantDamage") && plantDamage) add("plantDamage", Number(plantDamage[1]) * (plantDamage[2] === "reduced" ? -1 : 1));
    if (scopes.includes("spellProjectileSpeed") && scopedProjectileSpeed) add("projectileSpeed", Number(scopedProjectileSpeed[1]) * (scopedProjectileSpeed[2] === "reduced" ? -1 : 1));
    const scopedCriticalChance = /^(\d+(?:\.\d+)?)% (increased|reduced) critical hit chance for (spells|attacks)$/.exec(line);
    if (scopedCriticalChance && scopes.includes(scopedCriticalChance[3] === "spells" ? "spellCriticalChance" : "attackCriticalChance")) {
      add("criticalChance", Number(scopedCriticalChance[1]) * (scopedCriticalChance[2] === "reduced" ? -1 : 1));
    }
    const weaponCriticalChance = /^(\d+(?:\.\d+)?)% (increased|reduced) critical hit chance with ([a-z]+)$/.exec(line);
    if (weaponCriticalChance) {
      const weapon = reviewedWeaponPassiveScopes.find((entry) => entry.wording === weaponCriticalChance[3]);
      if (weapon?.criticalChance && scopes.includes(weapon.criticalChance)) {
        add("criticalChance", Number(weaponCriticalChance[1]) * (weaponCriticalChance[2] === "reduced" ? -1 : 1));
      }
    }
    const weaponCombat = /^(\d+(?:\.\d+)?)% (increased|reduced) (accuracy rating|critical damage bonus) with ([a-z]+)$/.exec(line);
    if (weaponCombat) {
      const accuracy = weaponCombat[3] === "accuracy rating";
      const weapon = reviewedWeaponPassiveScopes.find((entry) => entry.wording === weaponCombat[4]);
      const scope = accuracy ? weapon?.accuracy : weapon?.criticalDamageBonus;
      if (scope && scopes.includes(scope)) {
        add(accuracy ? "accuracy" : "criticalDamageBonus", Number(weaponCombat[1]) * (weaponCombat[2] === "reduced" ? -1 : 1));
      }
    }
    const oneHandedDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) damage with one handed weapons$/.exec(line);
    if (scopes.includes("oneHandedWeaponDamage") && oneHandedDamage) add("attackDamage", Number(oneHandedDamage[1]) * (oneHandedDamage[2] === "reduced" ? -1 : 1));
    const oneHandedAttackSpeed = /^(\d+(?:\.\d+)?)% (increased|reduced) attack speed with one handed( melee)? weapons$/.exec(line);
    if (oneHandedAttackSpeed && scopes.includes(oneHandedAttackSpeed[3] ? "oneHandedMeleeAttackSpeed" : "oneHandedWeaponAttackSpeed")) {
      add("attackSpeed", Number(oneHandedAttackSpeed[1]) * (oneHandedAttackSpeed[2] === "reduced" ? -1 : 1));
    }
    const oneHandedMeleeAccuracy = /^(\d+(?:\.\d+)?)% (increased|reduced) accuracy rating with one handed melee weapons$/.exec(line);
    if (scopes.includes("oneHandedMeleeAccuracy") && oneHandedMeleeAccuracy) add("accuracy", Number(oneHandedMeleeAccuracy[1]) * (oneHandedMeleeAccuracy[2] === "reduced" ? -1 : 1));
    const oneHandedMeleeCritical = /^(\d+(?:\.\d+)?)% (increased|reduced) (critical hit chance|critical damage bonus) with one handed melee weapons$/.exec(line);
    if (oneHandedMeleeCritical) {
      const chance = oneHandedMeleeCritical[3] === "critical hit chance";
      if (scopes.includes(chance ? "oneHandedMeleeCriticalChance" : "oneHandedMeleeCriticalDamageBonus")) {
        add(chance ? "criticalChance" : "criticalDamageBonus", Number(oneHandedMeleeCritical[1]) * (oneHandedMeleeCritical[2] === "reduced" ? -1 : 1));
      }
    }
    const oneHandedAttackAilmentChance = /^attacks with one-handed weapons have (\d+(?:\.\d+)?)% (increased|reduced) chance to inflict ailments$/.exec(line);
    if (scopes.includes("oneHandedAttackAilmentChance") && oneHandedAttackAilmentChance) add("ailmentChance", Number(oneHandedAttackAilmentChance[1]) * (oneHandedAttackAilmentChance[2] === "reduced" ? -1 : 1));
    const twoHandedDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) damage with two handed weapons$/.exec(line);
    if (scopes.includes("twoHandedWeaponDamage") && twoHandedDamage) add("attackDamage", Number(twoHandedDamage[1]) * (twoHandedDamage[2] === "reduced" ? -1 : 1));
    const twoHandedMeleeAccuracy = /^(\d+(?:\.\d+)?)% (increased|reduced) accuracy rating with two handed melee weapons$/.exec(line);
    if (scopes.includes("twoHandedMeleeAccuracy") && twoHandedMeleeAccuracy) add("accuracy", Number(twoHandedMeleeAccuracy[1]) * (twoHandedMeleeAccuracy[2] === "reduced" ? -1 : 1));
    const scopedAttackArea = /^(\d+(?:\.\d+)?)% (increased|reduced) area of effect for attacks$/.exec(line);
    const grenadeEffect = /^(\d+(?:\.\d+)?)% (increased|reduced) (grenade damage|grenade area of effect|cooldown recovery rate for grenade skills)$/.exec(line);
    if (grenadeEffect) {
      const grenadeScopes = {
        "grenade damage": ["grenadeDamage", "attackDamage"],
        "grenade area of effect": ["grenadeAreaOfEffect", "areaOfEffect"],
        "cooldown recovery rate for grenade skills": ["grenadeCooldownRecovery", "cooldownRecoveryRate"],
      } as const;
      const [scope, effect] = grenadeScopes[grenadeEffect[3] as keyof typeof grenadeScopes];
      if (scopes.includes(scope)) add(effect, Number(grenadeEffect[1]) * (grenadeEffect[2] === "reduced" ? -1 : 1));
    }
    if (scopes.includes("attackAreaOfEffect") && scopedAttackArea) add("areaOfEffect", Number(scopedAttackArea[1]) * (scopedAttackArea[2] === "reduced" ? -1 : 1));
    const scopedSpellArea = /^spell skills have (\d+(?:\.\d+)?)% (increased|reduced) area of effect$/.exec(line);
    if (scopes.includes("spellAreaOfEffect") && scopedSpellArea) add("areaOfEffect", Number(scopedSpellArea[1]) * (scopedSpellArea[2] === "reduced" ? -1 : 1));
    const genericAreaDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) area damage$/.exec(line);
    if (genericAreaDamage && (scopes.includes("spellAreaDamage") || scopes.includes("attackAreaDamage") || scopes.includes("areaDamageOverTime") || scopes.includes("secondaryAreaDamage"))) {
      add("areaDamage", Number(genericAreaDamage[1]) * (genericAreaDamage[2] === "reduced" ? -1 : 1));
    }
    const scopedSpellAreaDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) spell area damage$/.exec(line);
    if (scopes.includes("spellAreaDamage") && scopedSpellAreaDamage) add("spellAreaDamage", Number(scopedSpellAreaDamage[1]) * (scopedSpellAreaDamage[2] === "reduced" ? -1 : 1));
    const scopedAttackAreaDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) attack area damage$/.exec(line);
    if (scopes.includes("attackAreaDamage") && scopedAttackAreaDamage) add("attackAreaDamage", Number(scopedAttackAreaDamage[1]) * (scopedAttackAreaDamage[2] === "reduced" ? -1 : 1));
    const scopedAttackElementalDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) elemental damage with attacks$/.exec(line);
    if (scopes.includes("attackElementalDamage") && scopedAttackElementalDamage) add("elementalDamage", Number(scopedAttackElementalDamage[1]) * (scopedAttackElementalDamage[2] === "reduced" ? -1 : 1));
    const scopedSpellCriticalDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) critical spell damage bonus$/.exec(line);
    if (scopes.includes("spellCriticalDamageBonus") && scopedSpellCriticalDamage) add("criticalDamageBonus", Number(scopedSpellCriticalDamage[1]) * (scopedSpellCriticalDamage[2] === "reduced" ? -1 : 1));
    const scopedAttackCriticalDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) critical damage bonus for attack damage$/.exec(line);
    if (scopes.includes("attackCriticalDamageBonus") && scopedAttackCriticalDamage) add("criticalDamageBonus", Number(scopedAttackCriticalDamage[1]) * (scopedAttackCriticalDamage[2] === "reduced" ? -1 : 1));
    const meleeStunBuildup = /^(\d+(?:\.\d+)?)% (increased|reduced) stun buildup with melee damage$/.exec(line);
    if (scopes.includes("meleeStunBuildup") && meleeStunBuildup) add("stunBuildup", Number(meleeStunBuildup[1]) * (meleeStunBuildup[2] === "reduced" ? -1 : 1));
    const weaponBuildup = /^(\d+(?:\.\d+)?)% (increased|reduced) (stun|freeze) buildup with ([a-z]+)$/.exec(line);
    if (weaponBuildup) {
      const stun = weaponBuildup[3] === "stun";
      const weapon = reviewedWeaponPassiveScopes.find((entry) => entry.wording === weaponBuildup[4]);
      const scope = stun ? weapon?.stunBuildup : weapon?.freezeBuildup;
      if (scope && scopes.includes(scope)) {
        add(stun ? "stunBuildup" : "freezeBuildup", Number(weaponBuildup[1]) * (weaponBuildup[2] === "reduced" ? -1 : 1));
      }
    }
    const scopedMeleeDamage = /^(\d+(?:\.\d+)?)% (increased|reduced) melee damage$/.exec(line);
    if (scopes.includes("meleeDamage") && scopedMeleeDamage) {
      add("attackDamage", Number(scopedMeleeDamage[1]) * (scopedMeleeDamage[2] === "reduced" ? -1 : 1));
    }
    const scopedWeaponAttack = /^(\d+(?:\.\d+)?)% (increased|reduced) (damage|attack speed) with ([a-z]+)$/.exec(line);
    if (scopedWeaponAttack) {
      const damage = scopedWeaponAttack[3] === "damage";
      const weapon = reviewedWeaponPassiveScopes.find((entry) => entry.wording === scopedWeaponAttack[4]);
      // Weapon hit damage joins Attack Damage once, not each damage-type or
      // projectile preference. This is a reviewed hit focus, not ailment scaling.
      if (weapon && scopes.includes(damage ? weapon.damage : weapon.speed)) {
        add(damage ? "attackDamage" : "attackSpeed", Number(scopedWeaponAttack[1]) * (scopedWeaponAttack[2] === "reduced" ? -1 : 1));
      }
    }
    const attributes = /^([+-][\d.]+) to (strength|dexterity|intelligence|any attribute|all attributes|(?:strength|dexterity|intelligence) and (?:strength|dexterity|intelligence))$/.exec(line);
    if (attributes) add("attributes", Number(attributes[1]) * (attributes[2] === "all attributes" ? 3 : attributes[2].includes(" and ") ? 2 : 1));
    const flat = /^([+-][\d.]+) to maximum (life|mana|energy shield)$/.exec(line);
    if (flat) {
      const id = flat[2] === "life" ? "life" : flat[2] === "mana" ? "mana" : "energyShield";
      const divisor = id === "life" ? 10 / 3 : id === "mana" ? 15 / 10 : 20 / 12;
      add(id, Number(flat[1]) / divisor);
    }
  }
  if (node.flags.jewelSocket) add("jewelSockets", 1);
  return values;
}

export function scorePassiveNode(node: TreeNode, preferences: PassivePreference[], context: PassivePreferenceContext = {}): number {
  const values = passivePreferenceValues(node, context);
  return preferences.reduce((score, preference) => score + (values[preference.id] ?? 0)
    / passivePreferenceCatalog.find((effect) => effect.id === preference.id)!.scale * preference.weight, 0);
}

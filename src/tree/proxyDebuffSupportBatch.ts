import type { PassivePreferenceId } from "./passivePreferences";
import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

const scopes = {
  "command": [
    "skeletal-arsonist",
    "skeletal-sniper",
    "skeletal-frost-mage",
    "skeletal-storm-mage",
    "skeletal-brute",
    "skeletal-reaver"
  ],
  "reviving": [
    "skeletal-arsonist",
    "skeletal-sniper",
    "skeletal-frost-mage",
    "skeletal-storm-mage",
    "skeletal-brute",
    "skeletal-cleric",
    "skeletal-reaver",
    "wolf-pack"
  ],
  "persistent": [
    "skeletal-arsonist",
    "skeletal-sniper",
    "skeletal-frost-mage",
    "skeletal-storm-mage",
    "skeletal-brute",
    "skeletal-cleric",
    "skeletal-reaver",
    "rhoa-mount",
    "wolf-pack"
  ],
  "minion": [
    "skeletal-arsonist",
    "skeletal-sniper",
    "skeletal-frost-mage",
    "skeletal-storm-mage",
    "skeletal-brute",
    "skeletal-cleric",
    "skeletal-reaver",
    "rhoa-mount",
    "wolf-pack",
    "raise-zombie"
  ],
  "pact": [
    "spark",
    "fireball",
    "arc",
    "frostbolt",
    "ice-nova",
    "bonestorm",
    "bone-cage",
    "essence-drain",
    "contagion",
    "hexblast",
    "ice-strike",
    "tempest-flurry",
    "rolling-slam",
    "lightning-arrow",
    "poisonburst-arrow",
    "gas-arrow"
  ],
  "offering": [
    "bone-offering",
    "pain-offering",
    "soul-offering"
  ],
  "companion": [
    "rhoa-mount",
    "wolf-pack"
  ],
  "totem": [
    "dark-effigy",
    "artillery-ballista",
    "siege-ballista",
    "mortar-cannon",
    "ancestral-warrior-totem",
    "spell-totem",
    "shockwave-totem"
  ],
  "curse": [
    "enfeeble",
    "despair",
    "vulnerability",
    "elemental-weakness",
    "temporal-chains"
  ],
  "curseAura": [
    "enfeeble",
    "despair",
    "vulnerability",
    "elemental-weakness",
    "temporal-chains",
    "blasphemy"
  ],
  "chaos": [
    "essence-drain",
    "contagion",
    "hexblast",
    "poisonburst-arrow",
    "gas-arrow"
  ],
  "mark": [
    "snipers-mark",
    "bloodhounds-mark",
    "freezing-mark",
    "voltaic-mark"
  ],
  "slow": [
    "temporal-chains",
    "entangle",
    "vine-arrow"
  ],
  "corpse": [
    "unearth",
    "detonate-dead",
    "devour",
    "profane-ritual",
    "raise-zombie"
  ]
} as const;
const reviews = [
  {
    "id": "bidding-i",
    "name": "Bidding I",
    "effectId": "SupportBiddingPlayer",
    "family": "Bidding",
    "group": "command",
    "summary": "20% more Command Skill damage and 20% increased Command Cooldown Recovery Rate, with 30% higher eligible Mana cost. Not a basic-Minion attack bonus or player cooldown recovery; Commands and their actual use remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L766"
  },
  {
    "id": "bidding-ii",
    "name": "Bidding II",
    "effectId": "SupportBiddingPlayerTwo",
    "family": "Bidding",
    "group": "command",
    "summary": "30% more Command Skill damage and 30% increased Command Cooldown Recovery Rate. Unlike Tier I, source has no Mana multiplier. Not basic-attack damage, an equal cooldown-seconds reduction or guaranteed Command uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L797"
  },
  {
    "id": "bidding-iii",
    "name": "Bidding III",
    "effectId": "SupportBiddingPlayerThree",
    "family": "Bidding",
    "group": "command",
    "summary": "80% increased Command Cooldown Recovery Rate, with no Tier I/II damage bonus. Does not speed basic attacks or player skills. Actual Commands, charges and use frequency remain required; no sustained DPS multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L828"
  },
  {
    "id": "crazed-minions",
    "name": "Crazed Minions",
    "effectId": "SupportCrazedMinionsPlayer",
    "family": "CrazedMinions",
    "group": "reviving",
    "summary": "30% more supported Minion damage only if that Minion Revived Recently. Summoning is not revival. 15% higher eligible Mana cost; no assumed death/revival cycle, permanent buff or extra Spirit reservation multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2434"
  },
  {
    "id": "last-gasp",
    "name": "Last Gasp",
    "effectId": "SupportLastGaspPlayer",
    "family": "LastGasp",
    "group": "persistent",
    "summary": "Persistent Minions die 4 seconds after reaching zero Life. This is a fatal-wound grace window, not extra Life, automatic revival or guaranteed attacks. Temporary Minion lifetime and death-trigger timing are separate; no uptime is supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6230"
  },
  {
    "id": "minion-instability",
    "name": "Minion Instability",
    "effectId": "SupportMinionInstabilityPlayer",
    "family": "MinionInstability",
    "group": "minion",
    "summary": "At Low Life, the supported Minion explodes for 15% of its maximum Life as separate Fire damage. Not the basic attack or a guaranteed event. Optional Minion Life affects this source; enemy contacts, death frequency and Full DPS are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6920"
  },
  {
    "id": "infernal-legion-i",
    "name": "Infernal Legion I",
    "effectId": "SupportInfernalLegionPlayer",
    "family": "InfernalLegion",
    "group": "minion",
    "summary": "Minions take 10% of maximum Life as Fire damage per second before mitigation. Nearby enemies are Ignited as if from base Fire damage equal to 10% of Minion maximum Life, not that much Ignite DPS. Radius 1.5 metres; no assumed survival, stacking or uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4614"
  },
  {
    "id": "infernal-legion-ii",
    "name": "Infernal Legion II",
    "effectId": "SupportInfernalLegionPlayerTwo",
    "family": "InfernalLegion",
    "group": "minion",
    "summary": "Same Life-based Ignite source and 10% maximum-Life Fire self-damage per second as Tier I, with radius 2 metres and +20% Minion Fire Resistance. Resistance caps remain; not player defence, direct basic-attack damage or guaranteed survival/uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4658"
  },
  {
    "id": "minion-pact-i",
    "name": "Minion Pact I",
    "effectId": "SupportMinionPactPlayer",
    "family": "MinionPact",
    "group": "pact",
    "summary": "On self-use, drain Life equal to 100% of your maximum Life from a nearby Minion for 30% more skill damage, only if it can supply the full amount. Not Minion damage or free sacrifice uptime; raising player maximum Life also raises the required drain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6986"
  },
  {
    "id": "minion-pact-ii",
    "name": "Minion Pact II",
    "effectId": "SupportMinionPactPlayerTwo",
    "family": "MinionPact",
    "group": "pact",
    "summary": "On self-use, drain Life equal to 150% of your maximum Life from a nearby Minion for 35% more skill damage, only if it can supply all of it. No assumed Minion Life pool, proximity, recovery or repeated-use sustain; not a Minion damage multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7023"
  },
  {
    "id": "muster",
    "name": "Muster",
    "effectId": "SupportMusterPlayer",
    "family": "Muster",
    "group": "minion",
    "summary": "7% more supported Minion damage per different type of Reviving Minion actually summoned, not per individual Minion or Wolf. Native default counts are not proof of a sustained army; no assumed types, Minion count or automatic DPS multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7106"
  },
  {
    "id": "deathmarch",
    "name": "Deathmarch",
    "effectId": "SupportDeathmarchPlayer",
    "family": "Deathmarch",
    "group": "persistent",
    "summary": "On the supported persistent Minion's death, heal allied Minions within 3 metres for 25% of the dying Minion's Life and remove their ailments. Not player healing, recipient maximum-Life scaling or permanent regeneration; deaths and nearby recipients are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2804"
  },
  {
    "id": "danse-macabre",
    "name": "Danse Macabre",
    "effectId": "SupportDanseMacabrePlayer",
    "family": "DanseMacabre",
    "group": "offering",
    "summary": "Offering targets an additional Skeleton; only if that extra target exists does it gain 30% more Offering damage and 30% increased buff effect. Does not turn a non-damaging Offering into a hit or player/minion recipient stats into buff strength.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2764"
  },
  {
    "id": "loyalty",
    "name": "Loyalty",
    "effectId": "SupportLoyaltyPlayer",
    "family": "Loyalty",
    "group": "companion",
    "summary": "Companion takes 10% of incoming Hit damage from its Life before you, but has 30% less maximum Life. Not unconditional player damage reduction or protection from damage over time. Companion availability, Life and actual survival remain required; capture-only Tame Beast is excluded.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6618"
  },
  {
    "id": "sacrificial-lamb-i",
    "name": "Sacrificial Lamb I",
    "effectId": "SupportSacrificialLambPlayer",
    "family": "SacrificialLamb",
    "group": "minion",
    "summary": "Prioritises supported Minions for skills that can target Minions, within the source's 6-metre range where possible. Does not grant targeting eligibility, create Minions or guarantee sacrifices, deaths or damage.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7737"
  },
  {
    "id": "sacrificial-lamb-ii",
    "name": "Sacrificial Lamb II",
    "effectId": "SupportSacrificialLambPlayerTwo",
    "family": "SacrificialLamb",
    "group": "minion",
    "summary": "Adds Tier I's targeting priority and makes those Minions count as Detonatable. Eligibility is not an actual detonation or repeated corpse supply. Does not change the selected basic attack into explosion DPS or guarantee death-trigger rewards.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7768"
  },
  {
    "id": "sacrificial-offering",
    "name": "Sacrificial Offering",
    "effectId": "SupportSacrificalOfferingPlayer",
    "family": "SacrificalOffering",
    "group": "offering",
    "summary": "Offering gains 30% more Offering damage and 30% increased buff effect, but sacrifices 15% of your Life on use. No bypass of its Skeleton requirement, free player recovery or guaranteed buff uptime; recipients and non-damaging Offerings remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7800"
  },
  {
    "id": "hardy-totems-i",
    "name": "Hardy Totems I",
    "effectId": "SupportHardyTotemsPlayer",
    "family": "HardyTotems",
    "group": "totem",
    "summary": "40% more Totem Life with 10% higher eligible Mana cost. Totem survival only, not player/Minion Life or more damage. Parent placement costs, socketed firing and actual survival remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4117"
  },
  {
    "id": "hardy-totems-ii",
    "name": "Hardy Totems II",
    "effectId": "SupportHardyTotemsPlayerTwo",
    "family": "HardyTotems",
    "group": "totem",
    "summary": "50% more Totem Life with 10% higher eligible Mana cost. Multiplies applicable increased Totem Life; not player Life, free deployment or guaranteed uptime. Parent and socketed action costs are separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4152"
  },
  {
    "id": "reinforced-totems-i",
    "name": "Reinforced Totems I",
    "effectId": "SupportReinforcedTotemsPlayer",
    "family": "ReinforcedTotems",
    "group": "totem",
    "summary": "+40% to Totem Elemental Resistances, not Chaos resistance or maximum resistance. Already capped Totems gain no extra capped mitigation; source support fields are not fully reflected in the native resistance display. No player/Minion defence transfer.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6078"
  },
  {
    "id": "reinforced-totems-ii",
    "name": "Reinforced Totems II",
    "effectId": "SupportReinforcedTotemsPlayerTwo",
    "family": "ReinforcedTotems",
    "group": "totem",
    "summary": "+40% Totem Elemental Resistances and +10% maximum Elemental Resistances. Enough ordinary resistance is required; the general cap remains 90%. Native support-resistance display coverage is incomplete; no player defence or flat mitigation multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6109"
  },
  {
    "id": "urgent-totems-i",
    "name": "Urgent Totems I",
    "effectId": "SupportUrgentTotemsPlayer",
    "family": "UrgentTotems",
    "group": "totem",
    "summary": "80% increased Totem Placement Speed, not Totem attack/cast cadence. Placement time changes reciprocally, not by subtracting 80% of seconds. Costs, charges, active limits and actual sustained firing remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7763"
  },
  {
    "id": "urgent-totems-ii",
    "name": "Urgent Totems II",
    "effectId": "SupportUrgentTotemsPlayerTwo",
    "family": "UrgentTotems",
    "group": "totem",
    "summary": "100% increased Totem Placement Speed, not firing speed or extra Totems. Placement time is divided by the speed modifier; charge supply, lifetime, costs and sustained contacts are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7793"
  },
  {
    "id": "urgent-totems-iii",
    "name": "Urgent Totems III",
    "effectId": "SupportUrgentTotemsPlayerThree",
    "family": "UrgentTotems",
    "group": "totem",
    "summary": "100% increased Totem Placement Speed plus 20% increased Totem Attack/Cast Speed. Deployment and eligible firing components are separate. No extra casts, faster DoT ticks or guaranteed repeats; unspecified socketed components receive placement priority only.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7823"
  },
  {
    "id": "splinter-totem-i",
    "name": "Splinter Totem I",
    "effectId": "SupportSplinteringTotemPlayer",
    "family": "TotemicControl",
    "group": "totem",
    "summary": "One active parent Totem, splintering after an action up to twice. Each split carries 10% less Skill Speed and 20% less damage, maximum Life and area per split; 20% higher Mana cost. No assumed splinter count, contacts or multiplied DPS.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6881"
  },
  {
    "id": "splinter-totem-ii",
    "name": "Splinter Totem II",
    "effectId": "SupportSplinteringTotemPlayerTwo",
    "family": "TotemicControl",
    "group": "totem",
    "summary": "One active parent Totem, splintering after an action up to twice. Each split carries 7% less Skill Speed and 15% less damage, maximum Life and area per split; 20% higher Mana cost. Not free extra Totems or guaranteed contacts.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6918"
  },
  {
    "id": "font-of-blood",
    "name": "Font of Blood",
    "effectId": "SupportBloodFountainPlayer",
    "family": "Font",
    "group": "totem",
    "summary": "Allies within the 4-metre Font leech Life equal to 12% of Physical damage dealt by the supported Totem. Not regeneration or leech from their own attacks. Requires Totem Physical damage and recipients in range; native event/leech coverage is incomplete.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3939"
  },
  {
    "id": "font-of-mana",
    "name": "Font of Mana",
    "effectId": "SupportManaFountainPlayer",
    "family": "Font",
    "group": "totem",
    "summary": "Allies within the 4-metre Font leech Mana equal to 12% of Physical damage dealt by the supported Totem. Not Mana regeneration or free casting. Damage, range, leech limits and recovery timing remain required; shares the Font family with Font of Blood.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4943"
  },
  {
    "id": "abiding-hex",
    "name": "Abiding Hex",
    "effectId": "SupportAbidingHexPlayer",
    "family": "AbidingHex",
    "group": "curse",
    "summary": "Self-cast Curse consumes a Power Charge for 80% more duration if one is consumed. No free charge supply or permanent duration bonus. Longer curses do not increase damage per second and can delay an expiry-triggered Doom Blast.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L9"
  },
  {
    "id": "heightened-curse",
    "name": "Heightened Curse",
    "effectId": "SupportCurseEffectPlayer",
    "family": "HeightenedCurse",
    "group": "curseAura",
    "summary": "25% increased Curse effect, not 25% more final damage or guaranteed mitigation. Adds 40% Mana cost and 40% reservation where applicable, including Blasphemy. Enemy curse effectiveness, caps, recipients and actual uptime remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5540"
  },
  {
    "id": "hex-bloom",
    "name": "Hex Bloom",
    "effectId": "SupportHexBloomPlayer",
    "family": "HexBloom",
    "group": "curse",
    "summary": "When a Cursed enemy dies, transfers the Curse to one nearby enemy, with 20% higher Mana cost. Does not grant more simultaneous Curses, guaranteed kills, contacts or a continuous spreading chain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5570"
  },
  {
    "id": "cursed-ground",
    "name": "Cursed Ground",
    "effectId": "SupportCursedGroundPlayer",
    "family": "CursedGround",
    "group": "curse",
    "summary": "Creates Cursed Ground that curses enemies while they remain inside; limit two areas, not two stacked Curses or guaranteed targets. Zone lifetime, curse duration and on-expiry events are not interchangeable; native generic Duration is not a complete zone simulation.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2733"
  },
  {
    "id": "decaying-hex",
    "name": "Decaying Hex",
    "effectId": "SupportDecayingHexPlayer",
    "family": "DecayingHex",
    "group": "curse",
    "summary": "Curse application triggers the separate Profane Decay damaging debuff, with 30% higher Mana cost. It is not the Curse's own damage or an automatic Intelligence/Chaos/DoT score multiplier; child damage, applications and uptime are not modeled.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2835"
  },
  {
    "id": "impending-doom",
    "name": "Impending Doom",
    "effectId": "ViciousHexSupportPlayer",
    "family": "ImpendingDoom",
    "group": "curse",
    "summary": "Self-cast Curse expiry can trigger separate Doom Blast, with 30% higher Mana cost. Casting, spreading or entering/leaving Cursed Ground does not prove an expiry event. No assumed trigger rate, repeated hits or automatic child-spell score.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5782"
  },
  {
    "id": "profanity-i",
    "name": "Profanity I",
    "effectId": "SupportProfanityPlayer",
    "family": "Profanity",
    "group": "chaos",
    "summary": "Self-use consumes one nearby corpse for 30% more Chaos damage only if consumption succeeds. Does not grant Chaos damage, scale non-Chaos components or guarantee corpses. Player skills only; no automatic damage multiplier or sustained corpse supply.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7468"
  },
  {
    "id": "profanity-ii",
    "name": "Profanity II",
    "effectId": "SupportProfanityPlayerTwo",
    "family": "Profanity",
    "group": "chaos",
    "summary": "Self-use consumes up to ten nearby corpses for 5% more Chaos damage per corpse actually consumed. Not Tier I plus a permanent maximum bonus. Does not grant Chaos damage or guarantee corpse count, repeated use, kills or sustain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7501"
  },
  {
    "id": "eternal-mark",
    "name": "Eternal Mark",
    "effectId": "SupportEternalMarkPlayer",
    "family": "EternalMark",
    "group": "mark",
    "summary": "Supported Mark avoids being consumed the first time it activates, with 10% higher Mana cost. Not endless reuse or automatic activation; actual hit/freeze/shock/bleed conditions, duration and later consumption remain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4483"
  },
  {
    "id": "charged-mark",
    "name": "Charged Mark",
    "effectId": "SupportChargedMarkPlayer",
    "family": "ChargedMark",
    "group": "mark",
    "summary": "Mark activation triggers Charged Mark's separate Shocked Ground effect at the target. Applying the Mark is not its activation; no assumed ground uptime, permanent Shock, extra damage multiplier or automatic repeated triggers.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L977"
  },
  {
    "id": "mark-for-death",
    "name": "Mark for Death",
    "effectId": "SupportMarkForDeathPlayer",
    "family": "MarkForDeath",
    "group": "mark",
    "summary": "Marked enemy has Armour broken equal to 10% of Physical damage it takes, with 20% higher Mana cost. The Mark itself need not Hit. Not guaranteed Fully Broken Armour, damage penetration or direct Poison damage; incoming Physical damage is required.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5116"
  },
  {
    "id": "mark-for-death-ii",
    "name": "Mark for Death II",
    "effectId": "SupportMarkForDeathPlayerTwo",
    "family": "MarkForDeath",
    "group": "mark",
    "summary": "Marked enemy has Armour broken equal to 15% of Physical damage it takes, with 20% higher Mana cost. Not guaranteed full-break uptime, an extra hit or a direct Poison damage bonus; other sources' restrictions remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5151"
  },
  {
    "id": "mark-of-siphoning",
    "name": "Mark of Siphoning",
    "effectId": "SupportMarkOfSiphoningPlayer",
    "family": "MarkOfSiphoning",
    "group": "mark",
    "summary": "Your Physical Attack Hit damage to the Marked enemy grants 8% Mana leech, not 800%. Adds 20% Mana cost. Not leech from Poison, Minion hits or the Mark's own damage; hits, mitigation, recovery limits and net sustain are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6890"
  },
  {
    "id": "mark-of-siphoning-ii",
    "name": "Mark of Siphoning II",
    "effectId": "SupportMarkOfSiphoningPlayerTwo",
    "family": "MarkOfSiphoning",
    "group": "mark",
    "summary": "Your Physical Attack Hits to the Marked enemy grant 8% Life and Mana leech, not 800%, with 40% higher Mana cost. Poison, Minion damage and merely applying the Mark do not recover resources; no guaranteed hits, leech or net sustain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6859"
  },
  {
    "id": "slow-potency",
    "name": "Slow Potency",
    "effectId": "SupportSlowPotencyPlayer",
    "family": "Encumberance",
    "group": "slow",
    "summary": "15% increased Slow Magnitude for the reviewed Curse/vine slow, not damage, slower Poison ticks or longer debuff duration. Does not grant a Slow or bypass immunity; application, enemy limits and actual uptime remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5231"
  },
  {
    "id": "corpse-conservation",
    "name": "Corpse Conservation",
    "effectId": "SupportCorpseConservationPlayer",
    "family": "CorpseConservation",
    "group": "corpse",
    "summary": "25% chance to take effect without destroying the consumed corpse. Does not create corpses, guarantee reuse or refund Power Charges. Raise Zombie's charge alternative and self-use corpse availability remain separate; no assumed sustained supply.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2214"
  },
  {
    "id": "essence-harvest",
    "name": "Essence Harvest",
    "effectId": "SupportEssenceHarvestPlayer",
    "family": "EssenceHarvest",
    "group": "reviving",
    "summary": "On a supported reviving persistent Minion's death, Recoup 8% of your maximum Mana, with 10% higher reservation. Not damage-taken Mana Recoup, instant recovery or regeneration. Death frequency, delivery timing and net sustain are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4452"
  }
] as const;
type Suggestion = SkillPreferencePreset["suggestions"][number];
const s = (id: PassivePreferenceId, weight: number, reason: string): Suggestion => ({id,weight,reason});

function priorities(id: string): Suggestion[] {
  if (id.startsWith("bidding-")) return [
    ...(id === "bidding-iii" ? [] : [s("minionCommandDamage",2,"Optional Command-only damage priority; not the selected Minion's basic attack or a guarantee of Command use.")]),
    s("minionCommandCooldownRecovery",2,"Command recharge utility, not basic attacks, player cooldowns or a linear reduction in seconds.")];
  if (id === "minion-instability") return [s("minionLife",2,"Life supplies the separate Low-Life explosion's base damage; no trigger, contacts or death frequency is assumed.")];
  if (id.startsWith("infernal-legion-")) return [
    s("minionLife",2,"Life-based Ignite source, not basic-attack damage or an assumption of survival against self-damage."),
    s("minionFireResistance",2,"Optional Minion self-Fire-damage protection, subject to caps; not player resistance or guaranteed uptime.")];
  if (id === "loyalty") return [s("minionLife",2,"Optional Companion survival against the Life penalty and redirected Hit damage; not a flat player mitigation bonus."),
    s("companionLife",2,"Separate Companion-specific Life sources; each actual passive modifier is scored once.")];
  if (id.startsWith("hardy-totems")) return [s("totemLife",2,"Totem survival, not player Life or an automatic damage multiplier.")];
  if (id.startsWith("reinforced-totems")) return [
    ...(["totemFireResistance","totemColdResistance","totemLightningResistance"] as const).map(id=>s(id,1,"Ordinary Totem resistance, distinct from the cap and not calculated mitigation.")),
    ...(id === "reinforced-totems-ii" ? (["totemMaximumFireResistance","totemMaximumColdResistance","totemMaximumLightningResistance"] as const)
      .map(id=>s(id,1,"Totem resistance-cap utility needs sufficient ordinary resistance; no capped mitigation is calculated.")) : [])];
  if (id.startsWith("urgent-totems")) return [s("totemPlacementSpeed",2,"Player deployment only, not Totem firing cadence or guaranteed continuous charge supply.")];
  if (id === "abiding-hex") return [s("curseDuration",2,"Curse lifetime utility; the support's Power Charge bonus remains conditional and longer duration can delay Doom Blast.")];
  if (id === "heightened-curse") return [s("curseMagnitude",2,"Outgoing Curse strength, not the recipient's damage or a guaranteed defensive/DPS multiplier.")];
  if (id === "slow-potency") return [s("slowMagnitude",2,"Existing Curse/vine slow strength, not application chance, duration or damage.")];
  if (id === "essence-harvest") return [s("minionReservationEfficiency",2,"Optional efficiency for the supported persistent Minion's higher reservation; not damage-taken recoup or free extra summons.")];
  return [];
}

// Reviewed recipients/components only. Support magnitudes are not route-score multipliers.
export const proxyDebuffSkillSupports: readonly ReviewedSkillSupport[] = reviews.map(review => {
  const basePriorities = priorities(review.id);
  const skillOverrides = review.id === "urgent-totems-iii" ? Object.fromEntries([
    ...["artillery-ballista","siege-ballista","shockwave-totem"].map(id => [id, {summary:review.summary,
      priorities:[...basePriorities,s("totemAttackSpeed",1,"Optional speed for this reviewed Totem attack; not player deployment, extra hits or a guaranteed action count.")]}]),
    ["dark-effigy",{summary:review.summary,priorities:[...basePriorities,s("totemCastSpeed",1,"Optional Totem spell cadence; enemy Chaos-debuff prerequisites and actual firing uptime remain required.")]}],
  ]) : undefined;
  return {id:review.id,name:review.name,effectId:review.effectId,family:review.family,skillIds:scopes[review.group],
    summary:review.summary,sourceUrl:review.sourceUrl,priorities:basePriorities,...(skillOverrides ? {skillOverrides} : {})};
});

export function proxyDebuffSupportOverride(support: ReviewedSkillSupport, selected: readonly string[]): {summary:string;priorities?:readonly Suggestion[]} | undefined {
  const brutality = selected.some(id=>/^brutality-(i|ii|iii)$/.test(id));
  if (brutality && ["MinionInstability","InfernalLegion","Profanity"].includes(support.family))
    return {summary: "Brutality is selected: the supported actor cannot deal Elemental or Chaos damage. Do not credit these Fire/Chaos effects as damage benefits. Infernal Legion self-Fire damage and Profanity's corpse consumption are not removed by an outgoing damage prohibition. Manual weights are retained for review.",
      priorities: support.family === "InfernalLegion" ? support.priorities.filter(p=>p.id==="minionFireResistance") : []};
  if (selected.includes("impending-doom") && selected.includes("cursed-ground") && ["ImpendingDoom","CursedGround"].includes(support.family))
    return {summary: "Cursed Ground and Impending Doom are selected: area occupancy does not establish Curse expiry or a Doom Blast trigger rate. Keep zone lifetime and child damage separate; no repeated-trigger benefit is assumed."};
  if (selected.includes("impending-doom") && selected.includes("abiding-hex") && ["ImpendingDoom","AbidingHex"].includes(support.family))
    return {summary: "Abiding Hex can extend a Curse when a Power Charge is consumed; that can delay an expiry-triggered Doom Blast. More duration is not automatically more trigger DPS."};
  if (selected.includes("danse-macabre") && selected.includes("sacrificial-offering") && ["DanseMacabre","SacrificalOffering"].includes(support.family))
    return {summary: "Both Offering supports are selected: the extra Skeleton requirement and 15% player Life sacrifice still apply. Bonuses do not supply sacrifices, recipients or uptime, and non-damaging Offerings remain non-damaging."};
  if (selected.includes("minion-instability") && selected.some(id=>id.startsWith("infernal-legion-")) && ["MinionInstability","InfernalLegion"].includes(support.family))
    return {summary: "Infernal Legion self-damage may help reach Low Life, but mitigation and recovery can prevent that. It does not guarantee Minion Instability explosions, repeated deaths or sustained Ignite."};
  return undefined;
}

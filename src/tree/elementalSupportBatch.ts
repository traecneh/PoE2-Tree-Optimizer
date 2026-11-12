import type { PassivePreferenceId } from "./passivePreferences";
import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

const scopes = {
  "attack": [
    "lightning-arrow",
    "ice-shot",
    "lightning-spear",
    "explosive-spear",
    "ice-strike",
    "tempest-flurry",
    "galvanic-shards",
    "explosive-shot",
    "permafrost-bolts",
    "glacial-bolt",
    "stormblast-bolts",
    "shockburst-rounds",
    "plasma-blast",
    "boneshatter",
    "rolling-slam",
    "rain-of-arrows",
    "snipe",
    "armour-piercing-rounds",
    "high-velocity-rounds",
    "rake"
  ],
  "elementalAttack": [
    "lightning-arrow",
    "ice-shot",
    "lightning-spear",
    "explosive-spear",
    "ice-strike",
    "tempest-flurry",
    "galvanic-shards",
    "explosive-shot",
    "permafrost-bolts",
    "glacial-bolt",
    "stormblast-bolts",
    "shockburst-rounds",
    "plasma-blast"
  ],
  "fire": [
    "fireball",
    "flameblast",
    "firestorm",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "explosive-spear",
    "explosive-shot",
    "explosive-grenade",
    "incendiary-shot",
    "molten-blast",
    "rolling-magma",
    "perfect-strike",
    "flame-breath",
    "volcano"
  ],
  "cold": [
    "frostbolt",
    "ice-nova",
    "comet",
    "frost-bomb",
    "frost-wall",
    "frost-darts",
    "ice-strike",
    "ice-shot",
    "permafrost-bolts",
    "glacial-bolt",
    "lunar-assault",
    "wave-of-frost"
  ],
  "lightning": [
    "spark",
    "arc",
    "ball-lightning",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "lightning-arrow",
    "lightning-spear",
    "tempest-flurry",
    "galvanic-shards",
    "stormblast-bolts",
    "shockburst-rounds",
    "plasma-blast",
    "stormcaller-arrow",
    "storm-wave"
  ],
  "wind": [
    "wind-blast",
    "whirling-slash",
    "whirlwind-lance",
    "twister",
    "wind-serpents-fury",
    "wing-blast"
  ],
  "rune": [
    "enfeeble",
    "despair",
    "vulnerability",
    "elemental-weakness",
    "profane-ritual",
    "temporal-chains"
  ],
  "crystal": [
    "frost-wall",
    "frozen-locus"
  ],
  "crystalHit": [
    "frost-wall",
    "frozen-locus",
    "frostbolt",
    "ice-shot",
    "ice-strike"
  ],
  "persistent": [
    "arctic-armour",
    "barkskin",
    "ghost-dance",
    "grim-feast",
    "iron-ward",
    "magma-barrier",
    "scavenged-plating",
    "time-of-need",
    "wind-dancer",
    "herald-of-ash",
    "herald-of-blood",
    "herald-of-ice",
    "herald-of-plague",
    "herald-of-thunder",
    "archmage",
    "berserk",
    "eternal-rage",
    "combat-frenzy",
    "blasphemy",
    "briarpatch"
  ],
  "projectileAttack": [
    "lightning-arrow",
    "ice-shot",
    "lightning-spear",
    "explosive-spear",
    "stormcaller-arrow",
    "freezing-salvo",
    "snipe",
    "electrocuting-arrow",
    "detonating-arrow",
    "magnetic-salvo",
    "spiral-volley",
    "shockchain-arrow",
    "storm-lance",
    "glacial-lance",
    "spear-of-solaris",
    "molten-blast",
    "rolling-magma"
  ],
  "spellHit": [
    "spark",
    "fireball",
    "arc",
    "ball-lightning",
    "frostbolt",
    "ice-nova",
    "comet",
    "firestorm",
    "frost-bomb",
    "flameblast",
    "frost-wall",
    "bonestorm",
    "bone-cage",
    "hexblast",
    "unearth",
    "detonate-dead",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "frost-darts",
    "volcano",
    "entangle",
    "thrashing-vines",
    "eye-of-winter"
  ],
  "groundBoost": [
    "eye-of-winter",
    "whirling-slash",
    "whirlwind-lance",
    "twister",
    "tornado"
  ],
  "chaosDot": [
    "essence-drain",
    "contagion",
    "profane-ritual"
  ],
  "dot": [
    "essence-drain",
    "contagion",
    "incinerate",
    "flame-wall",
    "profane-ritual",
    "tornado"
  ],
  "physicalSpell": [
    "bonestorm",
    "bone-cage",
    "unearth",
    "entangle",
    "thrashing-vines",
    "briarpatch"
  ],
  "banner": [
    "war-banner",
    "defiance-banner",
    "dread-banner"
  ],
  "channel": [
    "flameblast",
    "bonestorm",
    "fury-of-the-mountain",
    "rampage",
    "incinerate",
    "supercharged-slam",
    "gathering-storm",
    "snipe",
    "detonating-arrow",
    "perfect-strike",
    "resonating-shield",
    "shield-charge",
    "oil-barrage",
    "flame-breath",
    "volcano"
  ],
  "hit": [
    "fireball",
    "flameblast",
    "firestorm",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "explosive-spear",
    "explosive-shot",
    "explosive-grenade",
    "incendiary-shot",
    "molten-blast",
    "rolling-magma",
    "perfect-strike",
    "flame-breath",
    "volcano",
    "frostbolt",
    "ice-nova",
    "comet",
    "frost-bomb",
    "frost-wall",
    "frost-darts",
    "ice-strike",
    "ice-shot",
    "permafrost-bolts",
    "glacial-bolt",
    "lunar-assault",
    "wave-of-frost",
    "spark",
    "arc",
    "ball-lightning",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "lightning-arrow",
    "lightning-spear",
    "tempest-flurry",
    "galvanic-shards",
    "stormblast-bolts",
    "shockburst-rounds",
    "plasma-blast",
    "stormcaller-arrow",
    "storm-wave",
    "boneshatter",
    "rolling-slam",
    "rain-of-arrows",
    "snipe",
    "armour-piercing-rounds",
    "high-velocity-rounds",
    "rake",
    "bonestorm",
    "bone-cage",
    "unearth",
    "entangle",
    "thrashing-vines"
  ]
} as const;
const reviews = [
  {
    "id": "immolate",
    "name": "Immolate",
    "effectId": "SupportImmolatePlayer",
    "family": "Immolate",
    "group": "attack",
    "summary": "Against an already Ignited enemy, supported Attacks gain 30% of eligible damage as extra Fire, but cannot Ignite themselves. A separate Ignite source is required; not conversion, base Spell Fire damage or permanent uptime. Other damage prohibitions still apply.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4516"
  },
  {
    "id": "eternal-flame-i",
    "name": "Eternal Flame I",
    "effectId": "SupportIgniteDurationPlayer",
    "family": "EternalFlame",
    "group": "fire",
    "summary": "100% increased Ignite Duration, but 25% less Flammability Magnitude; 20% higher Mana cost. Longer delivery is not more Ignite damage per second or guaranteed application. Native legacy chance output is not a flat probability-point bonus.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3043"
  },
  {
    "id": "eternal-flame-ii",
    "name": "Eternal Flame II",
    "effectId": "SupportIgniteDurationPlayerTwo",
    "family": "EternalFlame",
    "group": "fire",
    "summary": "100% increased Ignite Duration with 20% higher Mana cost, without Tier I's Flammability penalty. Does not grant Ignite, increase its damage per second or guarantee uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3079"
  },
  {
    "id": "eternal-flame-iii",
    "name": "Eternal Flame III",
    "effectId": "SupportIgniteDurationPlayerThree",
    "family": "EternalFlame",
    "group": "fire",
    "summary": "20% chance to refresh Ignite duration on a Critical Hit, with 20% higher Mana cost. Not a guaranteed refresh, extra duration from Tier I/II or assumed critical uptime. Refreshing an existing Ignite is separate from applying a new one.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3109"
  },
  {
    "id": "fan-the-flames",
    "name": "Fan The Flames",
    "effectId": "SupportFanTheFlamesPlayer",
    "family": "FanTheFlames",
    "group": "wind",
    "summary": "A Wind skill Hit against an Ignited enemy triggers a separate fiery cone explosion. Does not supply that Ignite or guarantee additional targets, repeat triggers or extra hits on the original target. Parent and triggered Fire damage remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3314"
  },
  {
    "id": "fan-the-flames-ii",
    "name": "Fan The Flames II",
    "effectId": "SupportFanTheFlamesPlayerTwo",
    "family": "FanTheFlames",
    "group": "wind",
    "summary": "A Wind Hit against an Ignited enemy triggers the fiery cone and can spread the original Ignite to other enemies hit. Does not create the initial Ignite, multiply boss DPS or guarantee contacts, spread or uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3463"
  },
  {
    "id": "wildfire",
    "name": "Wildfire",
    "effectId": "SupportWildfirePlayer",
    "family": "Wildfire",
    "group": "fire",
    "summary": "Ignites this skill actually inflicts spread to nearby enemies after a delay, within a 1.5-metre radius; 20% higher Mana cost. Not immediate application, a new Ignite source or multiplied single-target DPS. Delay and target presence matter.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8634"
  },
  {
    "id": "burning-inscription",
    "name": "Burning Inscription",
    "effectId": "SupportBurningRunesPlayer",
    "family": "BurningInscription",
    "group": "rune",
    "summary": "Runic Inscription expiry triggers separate Burning Inscription Ignited Ground based on maximum Mana; 10% higher Mana cost. Curse/Ritual parent utility is not the child's damage. No assumed runes, expiry rate, Mana-to-DPS score or ground uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1214"
  },
  {
    "id": "fiery-death",
    "name": "Fiery Death",
    "effectId": "SupportFieryDeathPlayer",
    "family": "FieryDeath",
    "group": "fire",
    "summary": "Enemies this skill Ignites have a 60% chance to explode on death, with 20% higher Mana cost. Requires its own Ignite and actual deaths; no free kills, permanent boss damage, guaranteed explosions or direct parent-hit multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4775"
  },
  {
    "id": "ice-bite-i",
    "name": "Ice Bite I",
    "effectId": "SupportIceBitePlayer",
    "family": "IceBite",
    "group": "cold",
    "summary": "Freezing an enemy with this self-used skill grants a five-second buff gaining 25% of damage as Cold. Own Freeze application is required, not merely hitting an externally Frozen target. Buff recipients, actual activation and uptime remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5665"
  },
  {
    "id": "ice-bite-ii",
    "name": "Ice Bite II",
    "effectId": "SupportIceBitePlayerTwo",
    "family": "IceBite",
    "group": "cold",
    "summary": "Own Freeze grants a six-second buff gaining 30% of damage as Cold. Not Tier I plus another buff, permanent Cold damage or an automatic damage-score multiplier. Freeze eligibility and actual uptime are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5706"
  },
  {
    "id": "biting-frost-i",
    "name": "Biting Frost I",
    "effectId": "SupportBitingFrostPlayer",
    "family": "BitingFrost",
    "group": "cold",
    "summary": "Consumes an enemy's Freeze for a 40% more-damage rule; a separate 20% Frozen-Unique rule also exists. Cannot cause Freeze buildup itself; 20% higher Mana cost. Needs a separate Freeze source, not assumed sustained consumption or maximum combined bonuses.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L858"
  },
  {
    "id": "biting-frost-ii",
    "name": "Biting Frost II",
    "effectId": "SupportBitingFrostPlayerTwo",
    "family": "BitingFrost",
    "group": "cold",
    "summary": "Tier I's Freeze-consumption/Unique rules, leaving the consumed target Chilled. Cannot cause Freeze buildup; 20% higher Mana cost. Chilling after consumption is not a new Freeze, free repeat use or guaranteed Chill uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L898"
  },
  {
    "id": "deep-freeze",
    "name": "Deep Freeze",
    "effectId": "SupportLastingFrostPlayer",
    "family": "DeepFreeze",
    "group": "cold",
    "summary": "50% increased duration of Freeze this skill inflicts, with 20% higher Mana cost. Not Freeze Buildup, Cold damage or guaranteed immobilisation; application prohibitions, enemy thresholds and actual freezes still matter.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2986"
  },
  {
    "id": "frost-nexus",
    "name": "Frost Nexus",
    "effectId": "SupportChillingIcePlayer",
    "family": "FrostNexus",
    "group": "cold",
    "summary": "Freezing with this skill creates Chilled Ground around the enemy: source radius 3 metres and base duration 8 seconds. Costs 20% more Mana. Own Freeze events and ground presence are required; not guaranteed extra hits or permanent slowing.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5118"
  },
  {
    "id": "creeping-chill",
    "name": "Creeping Chill",
    "effectId": "SupportCreepingChillPlayer",
    "family": "CreepingChill",
    "group": "crystal",
    "summary": "An Ice Crystal skill can consume one Power Charge to create Chilled Ground around its Crystal. Does not generate charges or guarantee charged use, ground contacts or uptime. Crystal creation and charge consumption remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2464"
  },
  {
    "id": "crystalline-shards",
    "name": "Crystalline Shards",
    "effectId": "SupportCrystallineShardsPlayer",
    "family": "CrystallineShards",
    "group": "crystal",
    "summary": "Ice Crystal explosions can Impale with Cold damage and cannot consume Impale; 20% higher Mana cost. Not the player's initial Strike, guaranteed explosions or automatically multiplied Cold DPS. Destruction, Impale storage and later consuming sources are separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2701"
  },
  {
    "id": "glacier",
    "name": "Glacier",
    "effectId": "SupportGlacierPlayer",
    "family": "Glacier",
    "group": "crystal",
    "summary": "100% more Ice Crystal maximum Life, not player, Minion or Totem Life. More Crystal durability does not guarantee destruction, more damage or extra contacts; no generic Life preference or damage multiplier is inferred.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5187"
  },
  {
    "id": "verglas",
    "name": "Verglas",
    "effectId": "SupportVerglasPlayer",
    "family": "Verglas",
    "group": "crystalHit",
    "summary": "Destroying Ice Crystals grants a six-second Cold-gain buff: 1% extra Cold per 2,000 Crystal Life destroyed. Costs 20% more Mana. Not player maximum Life, free Crystals or guaranteed buff size/uptime; other damage prohibitions remain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8539"
  },
  {
    "id": "embitter",
    "name": "Embitter",
    "effectId": "SupportEmbitterPlayer",
    "family": "Embitter",
    "group": "hit",
    "summary": "Existing damage-gain sources become extra Cold instead of their original type; 20% higher Mana cost. Does not convert base damage or grant a gain source. Attunement penalties still apply and Brutality still prohibits the gained Element.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L3807"
  },
  {
    "id": "cool-headed",
    "name": "Cool Headed",
    "effectId": "SupportCoolheadedPlayer",
    "family": "CoolHeaded",
    "group": "persistent",
    "summary": "50% less Ignite duration on you while the supported Persistent Buff is active, with +15 flat Spirit reservation. Incoming duration only, not outgoing Ignite, magnitude, immunity or damage. Actual buff availability and self-ailment interactions remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1670"
  },
  {
    "id": "innervate",
    "name": "Innervate",
    "effectId": "SupportInnervatePlayer",
    "family": "Innervate",
    "group": "lightning",
    "summary": "Killing a Shocked enemy with this self-used skill grants a five-second buff gaining 25% of damage as Lightning. Shock may come from elsewhere, but the kill must qualify. Not free kills, continuous boss uptime or a direct damage multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2641"
  },
  {
    "id": "electrocute",
    "name": "Electrocute",
    "effectId": "SupportElectrocutePlayer",
    "family": "Electrocute",
    "group": "lightning",
    "summary": "Lightning damage can build Electrocute, but this skill cannot Shock. Does not grant Lightning damage or guarantee immobilisation. Shares the Electrocute family with Neural Overload; Shock-dependent effects need a different source where permitted.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1977"
  },
  {
    "id": "neural-overload",
    "name": "Neural Overload",
    "effectId": "SupportNeuralOverloadPlayer",
    "family": "Electrocute",
    "group": "lightning",
    "summary": "An actual Hit on a nearby enemy marked as Primed for Electrocution can Electrocute it. Does not supply the initial buildup, marked target or guaranteed finisher. Shares the Electrocute family with the Electrocute support, rather than stacking with it.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3256"
  },
  {
    "id": "lasting-shock",
    "name": "Lasting Shock",
    "effectId": "SupportLastingShockPlayer",
    "family": "LastingShock",
    "group": "lightning",
    "summary": "100% increased Shock Duration, but 30% less chance to Shock. Not extra chance percentage points, Shock magnitude or permanent uptime. This skill must still be able to apply Shock; longer duration does not create an application.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2682"
  },
  {
    "id": "overcharge",
    "name": "Overcharge",
    "effectId": "SupportOverchargePlayer",
    "family": "Overcharge",
    "group": "lightning",
    "summary": "50% increased Shock effect, but its Shocks are reflected to you. Stronger outgoing Shock is not free damage or guaranteed uptime, and reflected Shock is a player risk. Shock prohibitions and incoming protection remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3452"
  },
  {
    "id": "shock-conduction",
    "name": "Shock Conduction",
    "effectId": "SupportShockConductionPlayer",
    "family": "ShockConduction",
    "group": "lightning",
    "summary": "50% chance to also Shock a nearby enemy when this skill Shocks, within a 2.5-metre radius; 20% higher Mana cost. Does not grant the first Shock, guarantee nearby targets or multiply single-target hits.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7837"
  },
  {
    "id": "coursing-current",
    "name": "Coursing Current",
    "effectId": "SupportDeadlyCurrentPlayer",
    "family": "DeadlyCurrent",
    "group": "lightning",
    "summary": "Own Shock triggers separate Coursing Current projectiles toward nearby Drenched enemies. Requires the Shock event, Drenched recipients and contacts; no invented Drench, chains, repeated hits or parent-DPS multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2244"
  },
  {
    "id": "static-shocks",
    "name": "Static Shocks",
    "effectId": "SupportStaticShocksPlayer",
    "family": "GroundingShocks",
    "group": "lightning",
    "summary": "Shocking with a supported Hit triggers a separate pulsing Lightning source. Application is not permanent pulses or guaranteed nearby contacts; parent hits, triggered damage, duration and actual Shock uptime remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8050"
  },
  {
    "id": "electromagnetism",
    "name": "Electromagnetism",
    "effectId": "SupportShockingRiftPlayer",
    "family": "ShockingRift",
    "group": "lightning",
    "summary": "On Shocking near at least three qualifying Shocked enemies within 4 metres, consume their Shocks to trigger Shocking Rift. Not guaranteed packs, repeated triggers or permanent Shock; Hinder and interval Lightning damage are separate child effects.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L3418"
  },
  {
    "id": "volt",
    "name": "Volt",
    "effectId": "SupportVoltPlayer",
    "family": "Volt",
    "group": "projectileAttack",
    "summary": "Move to gain 2 Voltaic Charge per metre, capped at 30; use consumes it for 1% extra Lightning per Charge. Costs 20% more Mana. Not maximum charge on every shot, Frenzy/Power Charges or an assumed movement/damage uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5686"
  },
  {
    "id": "frostfire",
    "name": "Frostfire",
    "effectId": "SupportFrostfirePlayer",
    "family": "FrostFire",
    "group": "fire",
    "summary": "Igniting a Frozen enemy consumes Freeze for a 50% Ignite-magnitude rule, with a separate 25% Frozen-Unique rule. This skill cannot cause Freeze buildup. Requires its own Ignite and a separate Freeze source; no assumed simultaneous maximum bonuses or uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5149"
  },
  {
    "id": "stormfire",
    "name": "Stormfire",
    "effectId": "SupportStormfirePlayer",
    "family": "StormFire",
    "group": "lightning",
    "summary": "Enemies Shocked by this skill also take 20% of Ignite damage as Lightning. Not the old indefinite-Ignite mechanic, conversion or a free parent-hit bonus. Own Shock and an actual Ignite are required; the Ignite may come from elsewhere.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8207"
  },
  {
    "id": "elemental-discharge",
    "name": "Elemental Discharge",
    "effectId": "SupportElementalDischargePlayer",
    "family": "ElementalDischarge",
    "group": "spellHit",
    "summary": "A Spell Hit consumes Freeze, Shock and Ignite to trigger separate Elemental Discharge. It cannot itself inflict those three ailments, but this is not a blanket Chill/Electrocute prohibition. External ailments, actual consumption and child damage remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L3674"
  },
  {
    "id": "catalysing-elements",
    "name": "Catalysing Elements",
    "effectId": "SupportCatalysingElementsPlayer",
    "family": "ElementalDischarge",
    "group": "groundBoost",
    "summary": "Being boosted by an allied Elemental Ground Surface triggers a separate matching Catalysing Discharge. Does not create that surface or assume simultaneous boosts, repeat contacts or child DPS. Shares Elemental Discharge's support family.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1367"
  },
  {
    "id": "potent-exposure",
    "name": "Potent Exposure",
    "effectId": "SupportPotentExposurePlayer",
    "family": "PotentExposure",
    "group": "hit",
    "summary": "20% increased effect of Exposure actually applied by this skill. Does not grant Exposure, penetration or direct damage. Optional suggestions require a reviewed native application or selected eligible Exposure support; application prohibitions still win.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7376"
  },
  {
    "id": "elemental-armament-i",
    "name": "Elemental Armament I",
    "effectId": "SupportElementalArmamentPlayer",
    "family": "ElementalArmament",
    "group": "elementalAttack",
    "summary": "20% more Elemental Attack damage with 20% higher Mana cost. Not generic Physical/Chaos damage, ailments or extra contacts by tag alone. The reviewed native Elemental attack component and damage prohibitions determine applicability.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2820"
  },
  {
    "id": "elemental-armament-ii",
    "name": "Elemental Armament II",
    "effectId": "SupportElementalArmamentPlayerTwo",
    "family": "ElementalArmament",
    "group": "elementalAttack",
    "summary": "25% more Elemental Attack damage with 20% higher Mana cost. Not Tier I plus another multiplier, extra projectiles or a guaranteed net DPS gain. Does not bypass outgoing Elemental damage prohibitions.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2855"
  },
  {
    "id": "elemental-armament-iii",
    "name": "Elemental Armament III",
    "effectId": "SupportElementalArmamentPlayerThree",
    "family": "ElementalArmament",
    "group": "attack",
    "summary": "12% more Attack damage per Elemental Ailment on the target, but this skill cannot inflict Elemental Ailments. Costs 20% more Mana. Unlike I/II, the conditional bonus can affect Physical attacks; external ailments and their count are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2890"
  },
  {
    "id": "blazing-critical",
    "name": "Blazing Critical",
    "effectId": "SupportBlazingCriticalPlayer",
    "family": "BlazingCritical",
    "group": "hit",
    "summary": "Critical Hits with this self-used skill grant a five-second buff giving all your Attacks 15% extra Fire. The triggering Spell is not automatically the recipient. Requires actual crits; costs, outgoing prohibitions and uptime remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L939"
  },
  {
    "id": "chaotic-freeze",
    "name": "Chaotic Freeze",
    "effectId": "SupportChaoticFreezePlayer",
    "family": "ChaoticFreeze",
    "group": "chaosDot",
    "summary": "Non-ailment Chaos DoT debuffs let separate Chaos Hits from any source build Freeze on affected enemies. The DoT ticks themselves do not Freeze. Does not supply those hits, guarantee application or transfer another actor's Freeze modifiers to this caster.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1801"
  },
  {
    "id": "warm-blooded",
    "name": "Warm Blooded",
    "effectId": "SupportWarmbloodedPlayer",
    "family": "WarmBlooded",
    "group": "persistent",
    "summary": "50% less Freeze duration on you while the supported Persistent Buff is active, with +15 flat Spirit reservation. Not outgoing Freeze duration, avoidance, immunity or player damage. Actual buff availability and self-Freeze interactions remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5719"
  },
  {
    "id": "brittle-armour",
    "name": "Brittle Armour",
    "effectId": "SupportBrittleArmourPlayer",
    "family": "ArmourBreak",
    "group": "cold",
    "summary": "Supported Hits that actually Freeze make Physical damage against that enemy break Armour while it stays Frozen. Source break ratio is 100%, not direct extra Physical damage. Does not guarantee full-break uptime or let an external Freeze replace its own application event.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1104"
  },
  {
    "id": "drain-ailments",
    "name": "Drain Ailments",
    "effectId": "SupportDrainedAilmentPlayer",
    "family": "DrainAilments",
    "group": "dot",
    "summary": "Consuming an ailment when applying this Spell's non-ailment DoT grants 35% more DoT damage. Not Poison/Bleeding damage or a permanent bonus. External or non-elemental ailments may qualify; their supply, consumption and uptime are not assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L3383"
  },
  {
    "id": "concussive-spells",
    "name": "Concussive Spells",
    "effectId": "SupportConcussiveSpellsPlayer",
    "family": "ConcussiveSpells",
    "group": "physicalSpell",
    "summary": "Physical-damage Spell critical hits can Daze. Not generic on-hit Daze chance, extra damage or guaranteed uptime. Requires a Physical hit component and an actual crit; Controlled Destruction prevents this application.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2110"
  },
  {
    "id": "refraction-i",
    "name": "Refraction I",
    "effectId": "SupportRefractionPlayer",
    "family": "Refraction",
    "group": "banner",
    "summary": "Banner aura grants Refractive Plating: 20% of Armour applies to Elemental Hit damage and Deflection equal to 15% of Evasion. Adds 10 flat Spirit. Requires the recipient to receive the aura; not flat damage reduction, DoT protection or simulated mitigation.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5959"
  },
  {
    "id": "refraction-ii",
    "name": "Refraction II",
    "effectId": "SupportRefractionPlayerTwo",
    "family": "Refraction",
    "group": "banner",
    "summary": "Banner Plating uses 30% of Armour for Elemental Hits and grants Deflection equal to 20% of Evasion, with +10 flat Spirit. Not immunity or a linear mitigation percentage; aura recipients, Armour, hit size and uptime remain required.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6000"
  },
  {
    "id": "refraction-iii",
    "name": "Refraction III",
    "effectId": "SupportRefractionPlayerThree",
    "family": "Refraction",
    "group": "banner",
    "summary": "Replaces Plating with an enemy debuff: 2% Elemental Exposure per 1,000 player Armour, capped at 80%, with +10 flat Spirit. Not the earlier tiers' defensive buff too. Needs enemies in the Banner area; no Armour, cap saturation or actual mitigation is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6041"
  },
  {
    "id": "burgeon-i",
    "name": "Burgeon I",
    "effectId": "SupportBurgeonPlayer",
    "family": "Burgeon",
    "group": "channel",
    "summary": "10% more damage per second spent Channelling, capped at 40%, with 20% higher Mana cost. Not maximum power immediately, free channel time or guaranteed sustained damage. Action speed does not shorten the bonus's real-time ramp.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1134"
  },
  {
    "id": "burgeon-ii",
    "name": "Burgeon II",
    "effectId": "SupportBurgeonPlayerTwo",
    "family": "Burgeon",
    "group": "channel",
    "summary": "20% more damage per channelled second, capped at the same 40%, with 20% higher Mana cost. Reaches the source cap sooner, not a higher maximum or Tier I plus another bonus. No uninterrupted channel, survival or uptime is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1174"
  }
] as const;
type Suggestion = SkillPreferencePreset["suggestions"][number];
type Override = {summary:string;priorities?:readonly Suggestion[]};
const s=(id:PassivePreferenceId,reason:string,weight=2):Suggestion=>({id,reason,weight});
const igniteIds = ["flammabilityMagnitude","igniteMagnitude","igniteDuration"] as const;
const freezeIds = ["freezeBuildup","freezeDuration"] as const;
const shockIds = ["shockChance","shockMagnitude","shockDuration"] as const;
const elementalIds = [...igniteIds,...freezeIds,...shockIds,"chillMagnitude","electrocuteBuildup"] as const;

function prohibitedIds(id:string):readonly PassivePreferenceId[] {
  if(id==="immolate")return igniteIds;
  if(id.startsWith("biting-frost-")||id==="frostfire")return freezeIds;
  if(id==="electrocute")return shockIds;
  if(id==="elemental-discharge")return [...igniteIds,...freezeIds,...shockIds];
  if(id==="elemental-armament-iii")return elementalIds;
  return [];
}
function priorities(id:string):Suggestion[] {
  if(id==="eternal-flame-i"||id==="eternal-flame-ii")return [s("igniteDuration","Duration of actual outgoing Ignites, not damage per second or guaranteed application.")];
  if(id==="deep-freeze")return [s("freezeDuration","Duration of this skill's actual Freezes, not guaranteed buildup or permanent immobilisation.")];
  if(id==="lasting-shock")return [s("shockDuration","Duration of actual Shocks, not magnitude, application or a guaranteed compensation for reduced chance.")];
  if(id==="overcharge")return [s("shockMagnitude","Outgoing Shock strength, with its reflected-Shock player risk retained; not permanent uptime.")];
  if(id==="electrocute")return [s("electrocuteBuildup","Buildup from eligible Lightning hits, not Shock or a guarantee of reaching the enemy threshold.")];
  if(id==="frostfire")return [s("igniteMagnitude","Ignite strength requires a real own-Ignite event against an externally Frozen enemy; no assumed uptime.")];
  if(id==="elemental-armament-i"||id==="elemental-armament-ii")return [s("elementalDamage","The reviewed Elemental attack component, not an assumed conversion, ailment or guaranteed DPS multiplier.")];
  if(id==="concussive-spells")return [s("criticalChance","An actual Physical Spell critical hit is required for the Daze event."),s("dazeDuration","Duration of an actual Daze, not flat chance or a guaranteed event.",1)];
  if(id==="brittle-armour")return [s("freezeBuildup","Own Freeze application is required; external Freezes do not supply this event. No full-break uptime is assumed.")];
  if(id==="cool-headed"||id==="warm-blooded")return [s("ailmentDurationReduction","Optional incoming ailment-duration protection, not outgoing ailments, immunity or a reflection of the gem's magnitude.",1)];
  if(id==="refraction-i"||id==="refraction-ii")return [s("armour","Optional player-recipient Armour for Plating, not a calculated Elemental mitigation percentage.",1),s("evasion","Optional player-recipient Evasion for Plating's Deflection source, not a guaranteed avoidance rate.",1)];
  if(id==="refraction-iii")return [s("armour","Player Armour supplies the Banner's Exposure source; area, recipients, cap and effective damage remain unmodeled.")];
  return [];
}
const exposurePriority=()=>[s("exposureEffect","Strength of an actual reviewed Exposure source, not granting Exposure or assuming its event/uptime.")];

// Only reviewed player components/recipients. No gem magnitudes become route-score multipliers.
export const elementalSkillSupports:readonly ReviewedSkillSupport[]=reviews.map(review=>{
  const exclusions=prohibitedIds(review.id).map(id=>({id,reason:"A selected support prohibits this supported skill's outgoing ailment. Suggestions cannot bypass it; manual weights remain for review or other skills."}));
  return {id:review.id,name:review.name,effectId:review.effectId,family:review.family,skillIds:scopes[review.group],
    summary:review.summary,sourceUrl:review.sourceUrl,priorities:priorities(review.id),...(exclusions.length?{exclusions}:{}),
    ...(review.id==="potent-exposure"?{skillOverrides:{"frost-bomb":{summary:review.summary,priorities:exposurePriority()}}}:{})};
});

export function elementalSupportOverride(support:ReviewedSkillSupport,selected:readonly string[],focusId:string):Override|undefined {
  const has=(id:string)=>selected.includes(id),family=(prefix:string)=>selected.some(id=>id.startsWith(prefix));
  const noAll=has("elemental-focus")||has("elemental-armament-iii");
  const noIgnite=noAll||has("immolate")||has("elemental-discharge");
  const noFreeze=noAll||family("biting-frost-")||has("frostfire")||has("elemental-discharge");
  const noShock=noAll||has("electrocute")||has("elemental-discharge");
  const noCrit=has("controlled-destruction"),brutality=family("brutality-");
  const messages:string[]=[];
  let nextPriorities=support.priorities,changed=false;
  const block=(message:string)=>{messages.push(message);nextPriorities=[];changed=true;};
  const ownIgnite=(support.family==="EternalFlame"&&support.id!=="eternal-flame-iii")
    ||["Wildfire","FieryDeath","FrostFire","Ignite","SearingFlame"].includes(support.family)||support.id==="fire-exposure";
  const ownFreeze=["IceBite","DeepFreeze","FrostNexus","Freeze"].includes(support.family)||support.id==="brittle-armour";
  const ownShock=["LastingShock","Overcharge","ShockConduction","DeadlyCurrent","GroundingShocks","ShockingRift","StormFire","Shock"].includes(support.family)||support.id==="lightning-exposure";
  if(ownIgnite&&(noIgnite||brutality))block("Selected supports prevent this skill's own damaging Ignite application. Other links cannot supply that prohibited event; do not credit self-supplied Ignite, spread, death rewards or Exposure.");
  if(ownFreeze&&noFreeze)block("Selected supports prevent this skill from causing Freeze buildup. A configured or externally Frozen enemy is not this skill's own Freeze event; do not credit its application-dependent benefits.");
  if(ownShock&&(noShock||brutality))block("Selected supports prevent this skill's own damaging Shock application. An external Shock is not its own-Shock event; spread, reflected Shock, Exposure and triggered benefits are not assumed.");
  if(noAll&&["Electrocute"].includes(support.family))block("Selected supports prohibit this skill's Elemental Ailments, including Electrocute. Primed enemies or added buildup do not bypass that prohibition.");
  if(noCrit&&(support.id==="eternal-flame-iii"||support.id==="blazing-critical"||support.id==="concussive-spells"))
    block("Controlled Destruction prevents this skill from critically hitting. It cannot supply the required critical-hit refresh, buff or Daze event; other skills' effects are separate.");
  if(has("embitter")&&support.id.endsWith("-attunement")){
    messages.push("Embitter redirects this Attunement's gained damage to Cold, not its original Element. Base damage is not converted and cross-element damage penalties remain.");
    nextPriorities=brutality?[]:[s("coldDamage","Embitter redirects this reviewed gain source to Cold. Original Attunement penalties remain; no net DPS gain is assumed.")];changed=true;
  }
  if(brutality&&(support.id==="embitter"||support.id==="immolate"||support.id==="verglas"||support.id==="volt"||support.id==="elemental-armament-i"||support.id==="elemental-armament-ii")){
    block("Brutality prohibits this linked actor's Elemental damage, including gained or redirected Elements. Costs and other restrictions remain; no Elemental damage benefit is credited.");
  }
  if(brutality&&support.id==="elemental-armament-iii")
    messages.push("Brutality does not turn Tier III into the earlier Elemental-only bonus: its conditional Attack-damage bonus may benefit Physical hits against externally afflicted targets. No ailment count or uptime is supplied.");
  if(brutality&&support.id==="blazing-critical")
    messages.push("Brutality still prohibits this linked skill's Fire damage. A successfully triggered global buff may serve a different eligible Attack; no recipient or uptime is assumed.");
  if(support.id==="potent-exposure"){
    const canApply=focusId==="frost-bomb"||(!brutality&&((has("fire-exposure")&&!noIgnite)||(has("lightning-exposure")&&!noShock)||(has("cold-exposure")&&!noCrit)));
    nextPriorities=canApply?exposurePriority():[];changed=true;
    messages.push(canApply?"A reviewed Exposure application is selected. Its actual event, enemy conditions and uptime still matter.":"No active reviewed Exposure application is established for this focus. The support does not grant Exposure; no Exposure priority is added automatically.");
  }
  if(has("elemental-discharge")&&(has("frostfire")||family("biting-frost-"))
    &&(support.id==="elemental-discharge"||support.id==="frostfire"||support.family==="BitingFrost"))
    block("Conflicting ailment consumers selected: reviewed PoB accepts only the first applicable link. Do not combine both consumers' bonuses, prohibitions or trigger rates as a valid loadout. Selections and manual weights remain for review.");
  if(support.id==="cold-exposure"&&(noCrit||brutality))
    block("The required Cold critical-hit event is unavailable from this selected setup. A configured enemy debuff is not proof of this skill's Exposure application.");
  return messages.length||changed?{summary:messages.join(" "),...(changed?{priorities:nextPriorities}:{})}:undefined;
}

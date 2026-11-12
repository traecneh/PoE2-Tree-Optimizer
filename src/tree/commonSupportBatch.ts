import type { PassivePreferenceId } from "./passivePreferences";
import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

const scopes = {
  precision: ["ice-strike","tempest-flurry","boneshatter","rolling-slam","ice-shot","rain-of-arrows","lightning-spear","explosive-spear","maul","lunar-assault","armour-breaker","lightning-arrow","poisonburst-arrow"],
  "hit": [
    "spark",
    "fireball",
    "arc",
    "ball-lightning",
    "frostbolt",
    "ice-nova",
    "comet",
    "firestorm",
    "flameblast",
    "frost-wall",
    "bonestorm",
    "bone-cage",
    "hexblast",
    "ice-strike",
    "tempest-flurry",
    "boneshatter",
    "rolling-slam",
    "lightning-arrow",
    "ice-shot",
    "rain-of-arrows",
    "lightning-spear",
    "explosive-spear",
    "armour-breaker",
    "maul",
    "lunar-assault"
  ],
  "fire": [
    "fireball",
    "flameblast",
    "firestorm",
    "explosive-spear"
  ],
  "cold": [
    "frostbolt",
    "ice-nova",
    "comet",
    "frost-wall",
    "ice-strike",
    "ice-shot",
    "lunar-assault"
  ],
  "lightning": [
    "spark",
    "arc",
    "ball-lightning",
    "lightning-arrow",
    "lightning-spear",
    "tempest-flurry"
  ],
  "cast": [
    "spark",
    "fireball",
    "arc",
    "ball-lightning",
    "frostbolt",
    "ice-nova",
    "comet",
    "firestorm",
    "flameblast",
    "frost-wall",
    "contagion",
    "bonestorm",
    "bone-cage",
    "despair",
    "vulnerability",
    "enfeeble",
    "temporal-chains",
    "tornado",
    "entangle",
    "thrashing-vines"
  ],
  "persistent": [
    "berserk",
    "eternal-rage",
    "combat-frenzy",
    "charge-regulation",
    "mana-remnants",
    "siphon-elements",
    "sacrifice",
    "barrier-invocation",
    "cast-on-critical",
    "cast-on-minion-death",
    "cast-on-dodge",
    "cast-on-elemental-ailment",
    "elemental-invocation",
    "feral-invocation",
    "reapers-invocation",
    "blasphemy",
    "blink",
    "lingering-illusion",
    "archmage",
    "herald-of-ash",
    "herald-of-blood",
    "herald-of-ice",
    "herald-of-plague",
    "herald-of-thunder",
    "overwhelming-presence",
    "withering-presence",
    "alchemists-boon",
    "attrition",
    "arctic-armour",
    "barkskin",
    "ghost-dance",
    "wind-dancer",
    "time-of-need",
    "grim-feast"
  ],
  "cooldown": [
    "frost-bomb",
    "frost-wall",
    "snipers-mark",
    "bloodhounds-mark",
    "freezing-mark",
    "voltaic-mark",
    "infernal-cry",
    "seismic-cry",
    "fortifying-cry",
    "lightning-conduit",
    "arctic-howl",
    "lunar-blessing",
    "toxic-domain"
  ],
  "energy": [
    "barrier-invocation",
    "cast-on-critical",
    "cast-on-dodge",
    "cast-on-elemental-ailment",
    "cast-on-minion-death",
    "elemental-invocation",
    "feral-invocation",
    "reapers-invocation"
  ],
  "invocation": [
    "barrier-invocation",
    "elemental-invocation",
    "feral-invocation",
    "reapers-invocation"
  ],
  "minions": [
    "skeletal-arsonist",
    "skeletal-sniper",
    "skeletal-frost-mage",
    "skeletal-storm-mage",
    "skeletal-brute",
    "skeletal-cleric",
    "skeletal-reaver",
    "raise-zombie",
    "rhoa-mount",
    "wolf-pack",
    "bone-offering",
    "pain-offering",
    "soul-offering"
  ],
  "persistentMinions": [
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
  "splash": [
    "skeletal-brute",
    "skeletal-reaver",
    "raise-zombie",
    "rhoa-mount",
    "wolf-pack"
  ],
  "attack": [
    "ice-strike",
    "tempest-flurry",
    "boneshatter",
    "rolling-slam",
    "ice-shot",
    "rain-of-arrows",
    "lightning-spear",
    "explosive-spear",
    "maul",
    "lunar-assault",
    "armour-breaker",
    "lightning-arrow",
    "vine-arrow",
    "toxic-growth",
    "poisonburst-arrow",
    "gas-arrow"
  ]
} as const;
const reviews = [
  {
    "id": "cold-attunement",
    "name": "Cold Attunement",
    "effectId": "SupportAddedColdDamagePlayer",
    "family": "ColdAttunement",
    "group": "hit",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1905"
  },
  {
    "id": "fire-attunement",
    "name": "Fire Attunement",
    "effectId": "SupportAddedFireDamagePlayer",
    "family": "FireAttunement",
    "group": "hit",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3613"
  },
  {
    "id": "lightning-attunement",
    "name": "Lightning Attunement",
    "effectId": "SupportAddedLightningDamagePlayer",
    "family": "LightningAttunement",
    "group": "hit",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2778"
  },
  {
    "id": "cold-mastery",
    "name": "Cold Mastery",
    "effectId": "SupportColdMasteryPlayer",
    "family": "Mastery",
    "group": "cold",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1973"
  },
  {
    "id": "fire-mastery",
    "name": "Fire Mastery",
    "effectId": "SupportFireMasteryPlayer",
    "family": "Mastery",
    "group": "fire",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4845"
  },
  {
    "id": "lightning-mastery",
    "name": "Lightning Mastery",
    "effectId": "SupportLightningMasteryPlayer",
    "family": "Mastery",
    "group": "lightning",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6260"
  },
  {
    "id": "cold-exposure",
    "name": "Cold Exposure",
    "effectId": "SupportColdExposurePlayer",
    "family": "ColdExposure",
    "group": "cold",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1943"
  },
  {
    "id": "fire-exposure",
    "name": "Fire Exposure",
    "effectId": "SupportFireExposurePlayer",
    "family": "FireExposure",
    "group": "fire",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3651"
  },
  {
    "id": "lightning-exposure",
    "name": "Lightning Exposure",
    "effectId": "SupportLightningExposurePlayer",
    "family": "LightningExposure",
    "group": "lightning",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2816"
  },
  {
    "id": "cold-penetration",
    "name": "Cold Penetration",
    "effectId": "SupportColdPenetrationPlayer",
    "family": "ColdPenetration",
    "group": "cold",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2003"
  },
  {
    "id": "fire-penetration-i",
    "name": "Fire Penetration I",
    "effectId": "SupportFirePenetrationPlayer",
    "family": "FirePenetration",
    "group": "fire",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3681"
  },
  {
    "id": "fire-penetration-ii",
    "name": "Fire Penetration II",
    "effectId": "SupportFirePenetrationPlayerTwo",
    "family": "FirePenetration",
    "group": "fire",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3711"
  },
  {
    "id": "lightning-penetration",
    "name": "Lightning Penetration",
    "effectId": "SupportLightningPenetrationPlayer",
    "family": "LightningPenetration",
    "group": "lightning",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2846"
  },
  {
    "id": "elemental-focus",
    "name": "Elemental Focus",
    "effectId": "SupportElementalFocusPlayer",
    "family": "ElementalFocus",
    "group": "hit",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L3771"
  },
  {
    "id": "ignite-i",
    "name": "Ignite I",
    "effectId": "SupportIgnitePlayer",
    "family": "Ignite",
    "group": "fire",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4407"
  },
  {
    "id": "ignite-ii",
    "name": "Ignite II",
    "effectId": "SupportIgnitePlayerTwo",
    "family": "Ignite",
    "group": "fire",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4442"
  },
  {
    "id": "ignite-iii",
    "name": "Ignite III",
    "effectId": "SupportIgnitePlayerThree",
    "family": "Ignite",
    "group": "fire",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4477"
  },
  {
    "id": "searing-flame-i",
    "name": "Searing Flame I",
    "effectId": "SupportDeadlyIgnitesPlayer",
    "family": "SearingFlame",
    "group": "fire",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6519"
  },
  {
    "id": "searing-flame-ii",
    "name": "Searing Flame II",
    "effectId": "SupportDeadlyIgnitesPlayerTwo",
    "family": "SearingFlame",
    "group": "fire",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6558"
  },
  {
    "id": "freeze",
    "name": "Freeze",
    "effectId": "SupportFreezePlayer",
    "family": "Freeze",
    "group": "cold",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5057"
  },
  {
    "id": "shock",
    "name": "Shock",
    "effectId": "SupportShockPlayer",
    "family": "Shock",
    "group": "lightning",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5164"
  },
  {
    "id": "arcane-surge",
    "name": "Arcane Surge",
    "effectId": "SupportArcaneSurgePlayer",
    "family": "ArcaneSurge",
    "group": "cast",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L593"
  },
  {
    "id": "clarity-i",
    "name": "Clarity I",
    "effectId": "SupportClarityPlayer",
    "family": "Clarity",
    "group": "persistent",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1835"
  },
  {
    "id": "clarity-ii",
    "name": "Clarity II",
    "effectId": "SupportClarityPlayerTwo",
    "family": "Clarity",
    "group": "persistent",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1870"
  },
  {
    "id": "vitality-i",
    "name": "Vitality I",
    "effectId": "SupportVitalityPlayer",
    "family": "Vitality",
    "group": "persistent",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7985"
  },
  {
    "id": "vitality-ii",
    "name": "Vitality II",
    "effectId": "SupportVitalityPlayerTwo",
    "family": "Vitality",
    "group": "persistent",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L8021"
  },
  {
    "id": "cooldown-recovery-i",
    "name": "Cooldown Recovery I",
    "effectId": "SupportCooldownRecoveryPlayer",
    "family": "CooldownRecovery",
    "group": "cooldown",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1436"
  },
  {
    "id": "cooldown-recovery-ii",
    "name": "Cooldown Recovery II",
    "effectId": "SupportCooldownRecoveryPlayerTwo",
    "family": "CooldownRecovery",
    "group": "cooldown",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1467"
  },
  {
    "id": "second-wind-i",
    "name": "Second Wind I",
    "effectId": "SupportSecondWindPlayer",
    "family": "SecondWind",
    "group": "cooldown",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5067"
  },
  {
    "id": "second-wind-ii",
    "name": "Second Wind II",
    "effectId": "SupportSecondWindPlayerTwo",
    "family": "SecondWind",
    "group": "cooldown",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5099"
  },
  {
    "id": "second-wind-iii",
    "name": "Second Wind III",
    "effectId": "SupportSecondWindPlayerThree",
    "family": "SecondWind",
    "group": "cooldown",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5131"
  },
  {
    "id": "boundless-energy-i",
    "name": "Boundless Energy I",
    "effectId": "SupportBoundlessEnergyPlayer",
    "family": "BoundlessEnergy",
    "group": "energy",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1044"
  },
  {
    "id": "boundless-energy-ii",
    "name": "Boundless Energy II",
    "effectId": "SupportBoundlessEnergyPlayerTwo",
    "family": "BoundlessEnergy",
    "group": "energy",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1074"
  },
  {
    "id": "energy-capacitor",
    "name": "Energy Capacitor",
    "effectId": "SupportEnergyCapacitorPlayer",
    "family": "EnergyCapacitor",
    "group": "invocation",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4226"
  },
  {
    "id": "energy-retention",
    "name": "Energy Retention",
    "effectId": "SupportEnergyRetentionPlayer",
    "family": "EnergyRetention",
    "group": "energy",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4256"
  },
  {
    "id": "meat-shield-i",
    "name": "Meat Shield I",
    "effectId": "SupportMeatShieldPlayer",
    "family": "MeatShield",
    "group": "minions",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5181"
  },
  {
    "id": "meat-shield-ii",
    "name": "Meat Shield II",
    "effectId": "SupportMeatShieldPlayerTwo",
    "family": "MeatShield",
    "group": "minions",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5220"
  },
  {
    "id": "hulking-minions",
    "name": "Hulking Minions",
    "effectId": "SupportHulkingMinionsPlayer",
    "family": "HulkingMinions",
    "group": "persistentMinions",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5637"
  },
  {
    "id": "elemental-army",
    "name": "Elemental Army",
    "effectId": "SupportElementalArmyPlayer",
    "family": "ElementalArmy",
    "group": "minions",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L3644"
  },
  {
    "id": "minion-mastery",
    "name": "Minion Mastery",
    "effectId": "SupportMinionMasteryPlayer",
    "family": "Mastery",
    "group": "minions",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6956"
  },
  {
    "id": "minion-splash-i",
    "name": "Minion Splash I",
    "effectId": "SupportMinionMeleeSplashPlayer",
    "family": "MinionMeleeSplash",
    "group": "splash",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5259"
  },
  {
    "id": "minion-splash-ii",
    "name": "Minion Splash II",
    "effectId": "SupportMinionMeleeSplashPlayerTwo",
    "family": "MinionMeleeSplash",
    "group": "splash",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5287"
  },
  {
    "id": "heightened-accuracy-i",
    "name": "Heightened Accuracy I",
    "effectId": "SupportHeightenedAccuracyPlayer",
    "family": "HeightenedAccuracy",
    "group": "precision",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2429"
  },
  {
    "id": "heightened-accuracy-ii",
    "name": "Heightened Accuracy II",
    "effectId": "SupportHeightenedAccuracyPlayerTwo",
    "family": "HeightenedAccuracy",
    "group": "precision",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2465"
  },
  {
    "id": "rapid-attacks-iii",
    "name": "Rapid Attacks III",
    "effectId": "SupportRapidAttacksPlayerThree",
    "family": "RapidAttacks",
    "group": "attack",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4674"
  }
] as const;

const s = (id: PassivePreferenceId,weight: number,reason: string): SkillPreferencePreset["suggestions"][number] => ({ id,weight,reason });
const elementalAilmentIds = ["flammabilityMagnitude","igniteMagnitude","igniteDuration","chillMagnitude","shockChance","shockMagnitude",
  "shockDuration","freezeBuildup","freezeDuration","electrocuteBuildup"] as const;

function summary(id: string): string {
  const element = id.split("-")[0];
  if (id.endsWith("-attunement")) return `Gain 25% of eligible non-skill-base damage as ${element}; 50% less of the other two Elements. Gained damage is not conversion or guaranteed net gain. Reviewed hit component only, not intrinsic DoT or Poison. Multiple Attunements retain their cross-element penalties; no automatic DPS multiplier.`;
  if (id.endsWith("-mastery")) return "+1 level to the matching supported gem, not a percentage damage bonus. Costs, reservation and individual components can change; the Mastery family is shared across elements and Minions. No extra passive score or Full DPS multiplier is applied.";
  if (id.endsWith("-exposure")) return `Eight-second ${element} Exposure requires ${element === "cold" ? "a Cold critical hit" : element === "fire" ? "this skill to Ignite" : "this skill to Shock"}. It is not penetration, free damage or guaranteed uptime. 20% higher Mana cost where applicable; application prohibitions still win.`;
  if (id === "fire-penetration-ii") return "Fire Hits ignore enemy Fire Resistance, not 60% penetration. This can lose the benefit of negative resistance and makes extra Fire penetration redundant for those hits. Does not ignore resistance for Ignite/DoT. 20% higher Mana cost; no assumed enemy resistance or net DPS gain.";
  if (id.includes("-penetration")) return `30% ${element} Resistance penetration for eligible hits, not Exposure, resistance reduction or DoT scaling. Native penetration does not drive effective resistance below zero. Actual enemy resistance is not supplied; 20% higher Mana cost and no automatic damage score multiplier.`;
  if (id === "elemental-focus") return "25% more Elemental hit damage, but this supported skill cannot inflict Elemental Ailments. No self-supplied Ignite, Shock or Freeze uptime, including from other supports. Non-elemental ailments are not automatically prohibited. Manual weights remain; remove irrelevant ones. No Full DPS multiplier is applied.";
  if (id.startsWith("ignite-")) {
    const tier=id.endsWith("iii") ? 3 : id.endsWith("ii") ? 2 : 1;
    return `${[100,150,200][tier-1]}% more chance to Ignite, not flat chance, Ignite magnitude or a guaranteed application. ${tier === 3 ? "Ignites deal damage 15% faster: shorter delivery duration, not free total damage or permanent uptime. " : ""}Requires an eligible hit and does not override ailment prohibitions. 20% higher Mana cost; enemy thresholds and uptime are not simulated.`;
  }
  if (id.startsWith("searing-flame")) return `${id.endsWith("ii") ? "100% more Ignite magnitude, 30% less hit damage" : "75% more Ignite magnitude, 25% less hit damage"}. Hit damage and Ignite-source behavior stay separate. Native expected Ignite output can also fall as hit-based application changes; this is not a guaranteed DoT upgrade. No supplied uptime or extra score multiplier.`;
  if (id === "freeze") return "50% more Freeze Buildup from eligible hits, not Freeze chance, duration, damage or guaranteed immobilisation. Does not override Freeze/Elemental Ailment prohibitions. 20% higher Mana cost; enemy thresholds and actual uptime are not supplied.";
  if (id === "shock") return "100% more chance to Shock, not added percentage points or Shock magnitude. Requires eligible hits and does not override ailment prohibitions. 20% higher Mana cost; no automatic Shock uptime or damage-taken multiplier.";
  if (id === "arcane-surge") return "Self-cast Spell Mana spending must reach 100% of maximum Mana to grant ten-second Arcane Surge. Configuring the buff is not proof of activation or uptime. Recipient Cast Speed/Mana regeneration are separate from the supported action's damage; triggers and proxies do not supply self-casts. No automatic permanent-buff score.";
  if (id.startsWith("clarity")) return `${id.endsWith("ii") ? "50% increased player Mana Regeneration, +20 Spirit reservation" : "30% increased player Mana Regeneration, +10 Spirit reservation"} while the supported Persistent Buff is active. Player recovery, not Minion recovery or a free reservation discount. A regeneration source is required; no guaranteed sustain.`;
  if (id.startsWith("vitality")) return `${id.endsWith("ii") ? "2% of maximum player Life regenerated per second, +40 Spirit reservation" : "1% of maximum player Life regenerated per second, +20 Spirit reservation"} while active. Source data is per minute and divided by 60 once. Player recovery, not Minion regeneration, damage mitigation or guaranteed net sustain.`;
  if (id.startsWith("cooldown-recovery")) return `${id.endsWith("ii") ? 30 : 25}% increased supported cooldown recovery, not an equal percentage reduction in seconds. Adds 30% Mana cost where applicable. Does not modify Minion actions, ordinary cast time or guarantee sustained uses.`;
  if (id.startsWith("second-wind")) return `Source doubles stored cooldown uses but gives ${id.endsWith("-i") ? 50 : 40}% less cooldown recovery and 50% higher Mana cost. The frozen runtime does not implement the extra-use counter. ${id.endsWith("iii") ? "Life recovery requires actual skill use that starts its cooldown, not continuous regeneration. " : ""}Burst capacity is not sustained use rate; no permanent recovery or extra-hit credit.`;
  if (id.startsWith("boundless-energy")) return `${id.endsWith("ii") ? 45 : 35}% increased Meta Energy gained per eligible event, not maximum Energy or a direct trigger-rate multiplier. Requires actual source events; no native event-frequency simulation. 15% higher eligible Mana cost, not Spirit reservation.`;
  if (id === "energy-capacitor") return "80% increased maximum Invocation Energy: storage, not gain rate, an Energy source or guaranteed additional casts. 30% higher eligible Mana cost. Release conditions, socketed costs and event supply remain separate; native maximum-Energy behavior is not fully modeled.";
  if (id === "energy-retention") return "35% chance to refund half of spent Energy, not a guaranteed 50% refund or continuous generation. 10% higher eligible Mana cost. No average refund is treated as permanent trigger uptime; native event behavior is not fully modeled.";
  if (id.startsWith("meat-shield")) return `${id.endsWith("ii") ? 40 : 35}% less damage taken by eligible Minions, but ${id.endsWith("ii") ? 40 : 35}% less Minion damage. Does not grant Life or protect the player, Totems or Feral visages. Survival preference is opt-in, not a DPS benefit or guaranteed uptime.`;
  if (id === "hulking-minions") return "Gigantic grants 20% more eligible Minion Life and damage, with 30% more Spirit reservation. Size does not guarantee more contacts or larger damaging areas. Persistent summoned Minions only, not Minion-tagged utility buffs, Totems, visages or player damage; count/uptime are not supplied.";
  if (id === "elemental-army") return "+30% to eligible Minion Elemental Resistances, not player/Chaos/maximum resistances. Actual capped mitigation depends on existing resistances and caps; already capped Minions do not gain 30% more protection. No guaranteed survival or player-stat inheritance.";
  if (id.startsWith("minion-splash")) return `Minion Strikes gain Melee Splash. ${id.endsWith("ii") ? "Tier II also grants 20% increased Minion area. " : ""}The original single-target hit is not multiplied by nearby targets. Native selected basic-hit output remains unchanged; splash contacts/secondary damage are not a Full DPS simulation. 10% higher eligible Mana cost.`;
  if (id.startsWith("heightened-accuracy")) return `50% more Accuracy for the supported Attack, not Spell accuracy or a flat hit-chance gain. ${id.endsWith("ii") ? "Cannot miss applies only against Full Life enemies, not all subsequent hits. " : ""}10% higher Mana cost; actual enemy evasion, accuracy caps and uptime are not supplied.`;
  return "35% increased Attack Speed, but 50% less supported damage. Faster deployment is not Poison tick speed, more stacks or guaranteed extra contacts. Cost per attack stays unchanged; Mana demand can rise. Not an unconditional DPS upgrade, and no support multiplier is applied to passive scores.";
}

export const commonSkillSupports: readonly ReviewedSkillSupport[] = reviews.map(review => {
  const id = review.id, priorities: SkillPreferencePreset["suggestions"][number][] = [];
  const exclusions: SkillPreferencePreset["exclusions"][number][] = [];
  if (id.endsWith("-attunement")) priorities.push(s((id.startsWith("cold") ? "coldDamage" : id.startsWith("fire") ? "fireDamage" : "lightningDamage"),2,
    "The support supplies this Element to the reviewed hit component. Cross-element penalties and actual total damage remain separate; not intrinsic DoT or a guaranteed upgrade."));
  if (id.startsWith("clarity")) priorities.push(s("manaRegenerationRate",2,"Scales existing player Mana regeneration while active; increased rate is not base recovery, free Spirit or guaranteed sustain."));
  if (id.startsWith("vitality")) priorities.push(s("lifeRegenerationRate",2,"Scales the supplied player regeneration source, not maximum Life, Minion recovery or guaranteed net sustain."));
  if (id.startsWith("meat-shield")) priorities.push(s("minionLife",2,"Optional Minion survival priority; the support reduces damage taken and damage dealt, not a direct Life or DPS grant."));
  if (id === "hulking-minions") priorities.push(s("minionReservationEfficiency",2,"Efficiency can offset part of the increased Minion Spirit reservation; not flat Spirit, automatic extra summons or guaranteed affordability."));
  if (id === "minion-splash-ii") priorities.push(s("minionAreaOfEffect",1,"Coverage of newly granted Minion Melee Splash, not single-target hit damage or guaranteed nearby contacts."));
  if (id.startsWith("heightened-accuracy")) priorities.push(s("accuracy",2,"Accuracy utility for this player Attack, not guaranteed hit chance or permanent Full Life enemy conditions."));
  if (id === "fire-penetration-ii") exclusions.push({ id: "firePenetration",reason: "These Fire hits ignore resistance; additional Fire penetration does not improve them. Other Elements and DoT remain separate. Your manual weight is retained for other skills." });
  if (id === "elemental-focus") for (const effect of elementalAilmentIds) exclusions.push({ id: effect,reason: "Elemental Focus prohibits this supported skill's Elemental Ailments. Other supports do not bypass it. Your manual weight remains and still affects routing; remove it if it serves no other skill." });
  return { id, name: review.name,effectId: review.effectId,family: review.family,skillIds: scopes[review.group],
    summary: summary(id),priorities,...(exclusions.length ? { exclusions } : {}),sourceUrl: review.sourceUrl };
});

export function commonSupportInteractionSummary(support: ReviewedSkillSupport, selectedIds: readonly string[]): string | undefined {
  const elemental = selectedIds.includes("elemental-focus"), brutality = selectedIds.some(id => /^brutality-(i|ii|iii)$/.test(id));
  if (brutality && (support.id.endsWith("-attunement") || support.id === "elemental-focus")) return "Brutality prohibits Elemental damage from this skill, including Attunement's gained Element. Both selections and penalties are retained, not treated as a combined damage upgrade.";
  if (selectedIds.includes("fire-penetration-ii") && support.id === "fire-exposure") return "Fire hits ignore resistance with Fire Penetration II, so Fire Exposure does not improve those hits. It may still affect applicable Ignite/DoT. Application, separate recipients and uptime remain required.";
  if (elemental && (support.id.startsWith("ignite-") || support.id.startsWith("searing-flame") || ["freeze","shock","fire-exposure","lightning-exposure"].includes(support.id))) return "Elemental Focus is selected: this supported skill cannot supply the required Elemental Ailment, even with this support. Costs and penalties remain. No self-supplied ailment/Exposure uptime is credited; manual weights are retained for review.";
  if (support.id === "cold-exposure" && selectedIds.includes("controlled-destruction")) return "Controlled Destruction prevents this skill from critically hitting, so it cannot supply Cold Exposure's Cold-critical-hit event. A configured enemy condition is not this skill's application; costs and manual weights remain.";
  return undefined;
}

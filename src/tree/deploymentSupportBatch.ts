import type { ReviewedSkillSupport } from "./skillSupportPreferences";

const scopes = {
  "crossbow": [
    "galvanic-shards",
    "explosive-shot",
    "armour-piercing-rounds",
    "fragmentation-rounds",
    "permafrost-bolts",
    "high-velocity-rounds",
    "incendiary-shot",
    "ice-shards",
    "rapid-shot",
    "glacial-bolt",
    "stormblast-bolts",
    "hailstorm-rounds",
    "shockburst-rounds",
    "plasma-blast",
    "siege-cascade",
    "crossbow-shot",
    "requiem"
  ],
  "grenade": [
    "explosive-grenade",
    "flash-grenade",
    "gas-grenade",
    "voltaic-grenade",
    "oil-grenade",
    "cluster-grenade"
  ],
  "fuse": [
    "explosive-spear",
    "frost-bomb",
    "explosive-grenade",
    "flash-grenade",
    "gas-grenade",
    "voltaic-grenade",
    "oil-grenade",
    "cluster-grenade",
    "toxic-domain",
    "toxic-growth"
  ],
  "hazard": [
    "spearfield"
  ],
  "slam": [
    "rolling-slam",
    "earthquake",
    "earthshatter",
    "sunder",
    "supercharged-slam",
    "stampede",
    "leap-slam",
    "hammer-of-the-gods",
    "volcanic-fissure",
    "falling-thunder",
    "vaulting-impact",
    "forge-hammer",
    "furious-slam",
    "fury-of-the-mountain",
    "molten-crash",
    "rampage"
  ],
  "strike": [
    "ice-strike",
    "tempest-flurry",
    "boneshatter",
    "rake",
    "maul",
    "shred",
    "lunar-assault",
    "flicker-strike",
    "whirling-assault",
    "whirling-slash",
    "primal-strikes",
    "rapid-assault",
    "killing-palm",
    "shattering-palm",
    "staggering-palm",
    "hand-of-chayula",
    "armour-breaker",
    "cull-the-weak",
    "fangs-of-frost"
  ],
  "fissure": [
    "fury-of-the-mountain",
    "molten-crash",
    "earthshatter",
    "sunder",
    "volcanic-fissure",
    "glacial-cascade",
    "storm-wave",
    "forge-hammer",
    "entangle"
  ],
  "sequence": [
    "ice-strike",
    "tempest-flurry",
    "shred",
    "primal-strikes"
  ],
  "combo": [
    "ice-strike",
    "tempest-flurry",
    "boneshatter",
    "rolling-slam",
    "rake",
    "maul",
    "shred",
    "lunar-assault",
    "armour-breaker",
    "earthquake",
    "sunder",
    "whirling-slash",
    "primal-strikes",
    "wind-blast"
  ],
  "concoct": [
    "poisonburst-arrow",
    "gas-arrow",
    "rake",
    "maul",
    "boneshatter",
    "rolling-slam",
    "armour-breaker",
    "bonestorm",
    "bone-cage",
    "snipe",
    "armour-piercing-rounds",
    "high-velocity-rounds"
  ],
  "ground": [
    "briarpatch",
    "earthquake",
    "oil-grenade",
    "frozen-locus",
    "storm-lance",
    "spear-of-solaris"
  ],
  "impact": [
    "ice-strike",
    "tempest-flurry",
    "boneshatter",
    "rake",
    "maul",
    "shred",
    "lunar-assault",
    "flicker-strike",
    "whirling-assault",
    "whirling-slash",
    "primal-strikes",
    "rapid-assault",
    "killing-palm",
    "shattering-palm",
    "staggering-palm",
    "hand-of-chayula",
    "armour-breaker",
    "cull-the-weak",
    "fangs-of-frost",
    "wind-blast"
  ]
} as const;

const reviews = [
  {
    "id": "ammo-conservation-i",
    "name": "Ammo Conservation I",
    "effectId": "SupportAmmoConservationPlayer",
    "family": "AmmoConservation",
    "group": "crossbow",
    "summary": "20% chance not to consume a Crossbow bolt, not extra projectiles or guaranteed free attacks. Reloads, firing cadence and costs remain separate; no automatic sustained DPS or ammo uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L248"
  },
  {
    "id": "ammo-conservation-ii",
    "name": "Ammo Conservation II",
    "effectId": "SupportAmmoConservationPlayerTwo",
    "family": "AmmoConservation",
    "group": "crossbow",
    "summary": "25% chance not to consume a Crossbow bolt, not extra hits or guaranteed ammo conservation. Reloads and firing cadence remain separate; no automatic sustained DPS multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L283"
  },
  {
    "id": "ammo-conservation-iii",
    "name": "Ammo Conservation III",
    "effectId": "SupportAmmoConservationPlayerThree",
    "family": "AmmoConservation",
    "group": "crossbow",
    "summary": "30% chance not to consume a bolt, but 20% less Crossbow Reload Speed. Conservation is random and slower reloads remain a real trade-off; no assumed free attacks or sustain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L318"
  },
  {
    "id": "double-barrel-i",
    "name": "Double Barrel I",
    "effectId": "SupportDoubleBarrelPlayer",
    "family": "DoubleBarrel",
    "group": "crossbow",
    "summary": "+1 loaded bolt, but 30% less Crossbow Reload Speed and 10% higher Mana cost. Clip capacity is not extra simultaneous projectiles, contacts or free reloads.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2557"
  },
  {
    "id": "double-barrel-ii",
    "name": "Double Barrel II",
    "effectId": "SupportDoubleBarrelPlayerTwo",
    "family": "DoubleBarrel",
    "group": "crossbow",
    "summary": "+1 loaded bolt, but 20% less Crossbow Reload Speed and 10% higher Mana cost. Larger clips do not guarantee extra hits, sustained firing or a net DPS gain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2597"
  },
  {
    "id": "double-barrel-iii",
    "name": "Double Barrel III",
    "effectId": "SupportDoubleBarrelPlayerThree",
    "family": "DoubleBarrel",
    "group": "crossbow",
    "summary": "+1 loaded bolt, 20% less Crossbow Reload Speed and 10% higher Mana cost. Reload on Heavy Stun requires this skill's actual event; no assumed Heavy Stun uptime or free continuous reloads.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2637"
  },
  {
    "id": "fresh-clip-i",
    "name": "Fresh Clip I",
    "effectId": "SupportFreshClipPlayer",
    "family": "FreshClip",
    "group": "crossbow",
    "summary": "1% more damage per bolt reloaded in the past 6 seconds. Requires actual reload history, not loaded clip capacity or guaranteed uptime. No assumed count or automatic damage-score multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3976"
  },
  {
    "id": "fresh-clip-ii",
    "name": "Fresh Clip II",
    "effectId": "SupportFreshClipPlayerTwo",
    "family": "FreshClip",
    "group": "crossbow",
    "summary": "1% more damage per bolt reloaded in the past 8 seconds. The longer history is not guaranteed maximum stacks; costs, reload history and firing cadence stay separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4011"
  },
  {
    "id": "nimble-reload",
    "name": "Nimble Reload",
    "effectId": "SupportNimbleReloadPlayer",
    "family": "NimbleReload",
    "group": "crossbow",
    "summary": "60% increased Crossbow Reload Speed, additive with other increased/reduced reload modifiers, not 60% more firing speed. No extra bolts, free Mana or guaranteed sustained DPS.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3285"
  },
  {
    "id": "streamlined-rounds",
    "name": "Streamlined Rounds",
    "effectId": "SupportStreamlinedRoundsPlayer",
    "family": "StreamlinedRounds",
    "group": "crossbow",
    "summary": "+5 loaded bolts and 50% more Attack Speed, but 60% less damage, 50% less Reload Speed and 20% higher Mana cost. Clip capacity is not extra projectiles; faster firing is not automatically more DPS or sustain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5356"
  },
  {
    "id": "adhesive-grenades-i",
    "name": "Adhesive Grenades I",
    "effectId": "SupportAdhesiveGrenadesPlayer",
    "family": "AdhesiveGrenades",
    "group": "grenade",
    "summary": "Grenades do not bounce, but deal 10% less damage. Placement behavior is not an extra hit, guaranteed overlap or Poison-source upgrade. Mortar Cannon's socketed propagation is not reviewed here.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L8"
  },
  {
    "id": "adhesive-grenades-ii",
    "name": "Adhesive Grenades II",
    "effectId": "SupportAdhesiveGrenadesPlayerTwo",
    "family": "AdhesiveGrenades",
    "group": "grenade",
    "summary": "Grenades do not bounce, without Tier I's damage penalty. Placement is not guaranteed extra contacts or cloud stacking. Mortar Cannon's socketed propagation is not reviewed here.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L44"
  },
  {
    "id": "long-fuse-i",
    "name": "Long Fuse I",
    "effectId": "SupportLongFusePlayer",
    "family": "LongFuse",
    "group": "fuse",
    "summary": "30% more detonation damage with 50% increased Detonation Time. Grenades can only detonate at the end of their duration. Detonation, cloud lifetime and Poison duration are separate; native damage coverage is incomplete.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5052"
  },
  {
    "id": "long-fuse-ii",
    "name": "Long Fuse II",
    "effectId": "SupportLongFusePlayerTwo",
    "family": "LongFuse",
    "group": "fuse",
    "summary": "35% more detonation damage with 70% increased Detonation Time. Grenades cannot detonate early. This is not faster Poison ticks, longer Poison or guaranteed coverage; native damage coverage is incomplete.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5084"
  },
  {
    "id": "short-fuse-i",
    "name": "Short Fuse I",
    "effectId": "SupportShortFusePlayer",
    "family": "ShortFuse",
    "group": "fuse",
    "summary": "40% less Detonation Time with 15% higher Mana cost, not 40% faster skill use or shorter Poison duration. Deployment, delayed detonation and cloud lifetime remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6625"
  },
  {
    "id": "short-fuse-ii",
    "name": "Short Fuse II",
    "effectId": "SupportShortFusePlayerTwo",
    "family": "ShortFuse",
    "group": "fuse",
    "summary": "80% less Detonation Time, but 30% less damage and 15% higher Mana cost. A shorter fuse is not faster Poison ticks or a guaranteed Poison-source upgrade; cloud timers remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6660"
  },
  {
    "id": "payload",
    "name": "Payload",
    "effectId": "SupportPayloadPlayer",
    "family": "Payload",
    "group": "grenade",
    "summary": "50% chance for a Grenade to activate again, but 70% reduced Cooldown Recovery Rate. Reduced recovery is additive, not 70% less time. No guaranteed second hit, cloud stacking or extra Poison application.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3557"
  },
  {
    "id": "controlled-hazard",
    "name": "Controlled Hazard",
    "effectId": "SupportControlledHazardPlayer",
    "family": "DelayedReaction",
    "group": "hazard",
    "summary": "Hazards cannot trigger during their first 3 seconds. Spearfield only in this reviewed cohort, not Grenades. Delayed Reaction shares its support family and replaces it; no assumed enemy contacts.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1406"
  },
  {
    "id": "delayed-reaction",
    "name": "Delayed Reaction",
    "effectId": "SupportDelayedReactionPlayer",
    "family": "DelayedReaction",
    "group": "hazard",
    "summary": "Hazards trigger on creation or at duration end, with 70% less Hazard Duration and 15% more Hazard damage. Spearfield only, not Grenades. Shares Controlled Hazard's family; no guaranteed extra contacts.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1833"
  },
  {
    "id": "rearm-i",
    "name": "Rearm I",
    "effectId": "SupportRearmPlayer",
    "family": "Rearm",
    "group": "hazard",
    "summary": "20% chance for a triggered Hazard to rearm after a short delay, with 10% higher Mana cost. Spearfield only; rearming is not a guaranteed repeated hit or enemy remaining in the Hazard.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4745"
  },
  {
    "id": "rearm-ii",
    "name": "Rearm II",
    "effectId": "SupportRearmPlayerTwo",
    "family": "Rearm",
    "group": "hazard",
    "summary": "30% chance for a triggered Hazard to rearm after a short delay, with 10% higher Mana cost. Spearfield only; no assumed repeated contacts, guaranteed trigger count or uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4775"
  },
  {
    "id": "aftershock-i",
    "name": "Aftershock I",
    "effectId": "SupportAftershockChancePlayer",
    "family": "Aftershock",
    "group": "slam",
    "summary": "25% chance for a self-used Slam to cause an Aftershock. Does not grant minion/proxy hits or guarantee another contact. Aftershock damage, overlap and Jagged Ground creation require actual events.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L8"
  },
  {
    "id": "aftershock-ii",
    "name": "Aftershock II",
    "effectId": "SupportAftershockChancePlayerTwo",
    "family": "Aftershock",
    "group": "slam",
    "summary": "35% chance for a self-used Slam to cause an Aftershock. Extra contacts are not guaranteed; Jagged Ground II still needs an actual Aftershock. Not a flat 35% DPS multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L39"
  },
  {
    "id": "fist-of-war-ii",
    "name": "Fist of War II",
    "effectId": "FistOfWarSupportPlayerTwo",
    "family": "FistOfWar",
    "group": "slam",
    "summary": "Ancestral Boost for a self-used Slam every 4 seconds, storing one boost, with 50% higher Mana cost. This interval is not ordinary Cooldown Recovery; not every hit is boosted or guaranteed to connect.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3771"
  },
  {
    "id": "fist-of-war-iii",
    "name": "Fist of War III",
    "effectId": "FistOfWarSupportPlayerThree",
    "family": "FistOfWar",
    "group": "slam",
    "summary": "Double-effect Ancestral Boost every 14 seconds, storing one boost, with 100% higher Mana cost. Not Tier II's cadence plus double power. No assumed boosted-hit uptime or ordinary cooldown scaling.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3803"
  },
  {
    "id": "ancestral-call-i",
    "name": "Ancestral Call I",
    "effectId": "SupportAncestralCallPlayer",
    "family": "AncestralCall",
    "group": "strike",
    "summary": "Ancestral Boost for a self-used Strike every 5 seconds, with 20% higher Mana cost. Not extra ancestral clones, repeat hits or guaranteed every-hit uptime; no proxy/minion ownership transfer.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L134"
  },
  {
    "id": "ancestral-call-ii",
    "name": "Ancestral Call II",
    "effectId": "SupportAncestralCallPlayerTwo",
    "family": "AncestralCall",
    "group": "strike",
    "summary": "Ancestral Boost for a self-used Strike every 3 seconds, with 20% higher Mana cost. Boost availability is not a guaranteed contact or continuous uptime; no proxy/minion ownership transfer.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L166"
  },
  {
    "id": "impact-shockwave",
    "name": "Impact Shockwave",
    "effectId": "ImpactShockwaveSupportPlayer",
    "family": "ImpactShockwave",
    "group": "impact",
    "summary": "A supported Melee Strike or Wind Attack that actually Heavy Stuns creates a separate Aftershock with base radius 1.5 metres. No assumed Heavy Stun, extra targets or repeat hits; player-owned reviewed component only.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4548"
  },
  {
    "id": "jagged-ground-i",
    "name": "Jagged Ground I",
    "effectId": "SupportJaggedGroundPlayer",
    "family": "JaggedGround",
    "group": "slam",
    "summary": "Self-used Slams consume 1 Endurance Charge per use to create Jagged Ground for 4 seconds. Charge supply and ground contacts are not guaranteed; 20% higher Mana cost. Not an unconditional damage or generic-duration bonus.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4747"
  },
  {
    "id": "jagged-ground-ii",
    "name": "Jagged Ground II",
    "effectId": "SupportJaggedGroundPlayerTwo",
    "family": "JaggedGround",
    "group": "slam",
    "summary": "Aftershocks from supported self-used Slams create Jagged Ground for 4 seconds, with 20% higher Mana cost. No Tier I Endurance Charge cost, but an actual Aftershock is required; no guaranteed ground uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4780"
  },
  {
    "id": "upheaval-i",
    "name": "Upheaval I",
    "effectId": "SupportUpheavalPlayer",
    "family": "Fissures",
    "group": "fissure",
    "summary": "+1 fissure, but 20% less damage and 20% less Skill Speed. Extra paths are not guaranteed extra hits or attached vines. Entangle's deployment and intrinsic Plant DoT stay separate; no overlap multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7683"
  },
  {
    "id": "upheaval-ii",
    "name": "Upheaval II",
    "effectId": "SupportUpheavalPlayerTwo",
    "family": "Fissures",
    "group": "fissure",
    "summary": "+2 fissures, but 40% less damage and 20% less Skill Speed. No assumed extra contacts or attached vines. Entangle's intrinsic Plant DoT, deployment and fissure paths remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7723"
  },
  {
    "id": "crescendo-i",
    "name": "Crescendo I",
    "effectId": "SupportCrescendoPlayer",
    "family": "Crescendo",
    "group": "sequence",
    "summary": "Repeats the final Strike of a sequence, with 20% higher Mana cost. A Strike sequence is not accumulated Combo resource; repeats do not guarantee extra contacts or free actions.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2609"
  },
  {
    "id": "crescendo-ii",
    "name": "Crescendo II",
    "effectId": "SupportCrescendoPlayerTwo",
    "family": "Crescendo",
    "group": "sequence",
    "summary": "Repeats the final Strike and grants 15% more non-final Strike Attack Speed, with 20% higher Mana cost. The speed bonus is not global or final-Strike speed, and no extra contacts are assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2637"
  },
  {
    "id": "crescendo-iii",
    "name": "Crescendo III",
    "effectId": "SupportCrescendoPlayerThree",
    "family": "Crescendo",
    "group": "sequence",
    "summary": "Ancestrally Boosts the final Strike, instead of Tier I/II's repeat, with 20% higher Mana cost. Not a repeat plus boost, free Combo stacks or guaranteed damage uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2673"
  },
  {
    "id": "combo-finisher-i",
    "name": "Combo Finisher I",
    "effectId": "SupportComboFinisherPlayer",
    "family": "ComboFinisher",
    "group": "combo",
    "summary": "Requires 3 Combo before use for 25% more damage; Combo starts decaying after 4 seconds. Cannot support an already-Combo skill. No supplied Combo generation or assumed usable-on-cooldown uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1297"
  },
  {
    "id": "combo-finisher-ii",
    "name": "Combo Finisher II",
    "effectId": "SupportComboFinisherPlayerTwo",
    "family": "ComboFinisher",
    "group": "combo",
    "summary": "Requires 5 Combo before use for 40% more damage; Combo starts decaying after 4 seconds. Cannot support an already-Combo skill. No assumed resource supply or uninterrupted use.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1330"
  },
  {
    "id": "culmination-i",
    "name": "Culmination I",
    "effectId": "SupportCulminationPlayer",
    "family": "Culmination",
    "group": "combo",
    "summary": "Other Melee Attacks successfully Striking build Combo; this skill resets it on use. 3% more damage per Combo, maximum 10; decay starts after 4 seconds. Cannot modify minions or already-Combo skills; no assumed stacks.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1597"
  },
  {
    "id": "culmination-ii",
    "name": "Culmination II",
    "effectId": "SupportCulminationPlayerTwo",
    "family": "Culmination",
    "group": "combo",
    "summary": "Other Melee Attacks successfully Striking build Combo; this skill resets it on use. 4% more damage per Combo, maximum 10; decay starts after 6 seconds. Not minion Combo or guaranteed maximum uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1629"
  },
  {
    "id": "practiced-combo",
    "name": "Practiced Combo",
    "effectId": "SupportPracticedComboPlayer",
    "family": "PracticedCombo",
    "group": "strike",
    "summary": "40% chance for an additional Combo on a supported Strike hit. Does not itself grant a Combo spender, initial stacks or guaranteed maximum Combo; Strike sequences and resource accumulation are distinct.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4154"
  },
  {
    "id": "concoct-i",
    "name": "Concoct I",
    "effectId": "SupportConcoctPlayer",
    "family": "Concoct",
    "group": "concoct",
    "summary": "Consumes 20% of maximum Life Flask charges on use for 3% more Bleeding magnitude per charge consumed. Does not grant Bleeding, scale Poison or recover Life. No assumed full charges or sustained consumption.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1582"
  },
  {
    "id": "concoct-ii",
    "name": "Concoct II",
    "effectId": "SupportConcoctPlayerTwo",
    "family": "Concoct",
    "group": "concoct",
    "summary": "Consumes 30% of maximum Life Flask charges on use for 3% more Bleeding magnitude per charge consumed. Not Poison scaling or Flask recovery; no granted Bleeding, guaranteed full charges or sustained uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1626"
  },
  {
    "id": "persistent-ground-i",
    "name": "Persistent Ground I",
    "effectId": "SupportPersistentGroundPlayer",
    "family": "PersistentGround",
    "group": "ground",
    "summary": "50% increased Ground Surface duration, not generic Skill Effect Duration, Poison duration or damage over time. Only the reviewed surface component benefits; native generic Duration output is not proof of surface timing.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5512"
  },
  {
    "id": "persistent-ground-ii",
    "name": "Persistent Ground II",
    "effectId": "SupportPersistentGroundPlayerTwo",
    "family": "PersistentGround",
    "group": "ground",
    "summary": "50% increased Ground Surface duration, but surfaces cannot trigger and only end when duration expires. Not Tier I plus a free upgrade, generic duration, Poison duration or guaranteed contacts.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5542"
  },
  {
    "id": "persistent-ground-iii",
    "name": "Persistent Ground III",
    "effectId": "SupportPersistentGroundPlayerThree",
    "family": "PersistentGround",
    "group": "ground",
    "summary": "50% increased Ground Surface duration; surfaces cannot trigger and apply 30% less enemy Cooldown Recovery Speed. Not player cooldown recovery, Poison duration or damage; no assumed affected-enemy uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5573"
  }
] as const;

// These are reviewed components, not every type-legal parent skill or a Full DPS model.
export const deploymentSkillSupports: readonly ReviewedSkillSupport[] = reviews.map(review => ({
  id: review.id, name: review.name, effectId: review.effectId, family: review.family,
  skillIds: scopes[review.group], summary: review.summary, sourceUrl: review.sourceUrl,
  priorities: review.id === "nimble-reload" || review.id === "streamlined-rounds"
    || review.id === "ammo-conservation-iii" || review.id.startsWith("double-barrel")
    ? [{ id: "crossbowReloadSpeed", weight: 2,
      reason: "Optional reload-rate utility, not firing speed, extra bolts or guaranteed sustain. Support penalties still apply." }]
    : [],
}));

export function deploymentSupportInteractionSummary(support: ReviewedSkillSupport, selected: readonly string[]): string | undefined {
  const has = (family: string) => selected.some(id => id.startsWith(family));
  if ((support.family === "ComboFinisher" || support.family === "Culmination") && has("combo-finisher-") && has("culmination-"))
    return "Incompatible Combo pair selected: each adds Combo and excludes an already-Combo skill. Reviewed PoB accepts only the first applicable link, in either order; do not combine both damage bonuses. Selections and manual priorities are retained for review.";
  if ((support.family === "LongFuse" || support.family === "ShortFuse") && has("long-fuse-") && has("short-fuse-"))
    return "Long Fuse and Short Fuse are both selected: increased Detonation Time and less Detonation Time combine multiplicatively, not by subtracting percentages. Damage penalties, costs and the Grenade early-detonation restriction remain.";
  if (support.family === "JaggedGround" && support.id === "jagged-ground-ii" && has("aftershock-"))
    return "Aftershock is selected, but its chance is not a guaranteed trigger for Jagged Ground II or permanent ground coverage.";
  if ((support.family === "DoubleBarrel" || support.family === "StreamlinedRounds") && has("double-barrel-") && selected.includes("streamlined-rounds"))
    return "Extra loaded bolts add clip capacity, not simultaneous projectiles. Both reload penalties and Mana multipliers remain; no guaranteed net DPS or extra contacts.";
  return undefined;
}

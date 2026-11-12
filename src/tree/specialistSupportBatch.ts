import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

// Reviewed components, not a blanket approval of native parent-type compatibility.
const scopes = {
  "nova": [
    "ice-nova",
    "flameblast",
    "bone-cage",
    "infernal-cry",
    "seismic-cry",
    "ancestral-cry",
    "fortifying-cry",
    "ferocious-roar",
    "elemental-sundering",
    "arctic-howl"
  ],
  "powerGeneration": [
    "siphoning-strike",
    "killing-palm",
    "wing-blast",
    "devour",
    "profane-ritual",
    "lingering-illusion"
  ],
  "lightningHits": [
    "spark",
    "lightning-arrow",
    "tempest-flurry",
    "lightning-spear",
    "arc",
    "ball-lightning",
    "voltaic-grenade",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "falling-thunder",
    "storm-wave",
    "gathering-storm",
    "lightning-rod",
    "stormcaller-arrow",
    "electrocuting-arrow",
    "magnetic-salvo",
    "shockchain-arrow",
    "storm-lance",
    "primal-strikes",
    "thunderous-leap"
  ],
  "stoneObjects": [
    "earthshatter",
    "forge-hammer",
    "shield-wall"
  ],
  "cascade": [
    "enfeeble",
    "ice-nova",
    "comet",
    "firestorm",
    "frost-bomb",
    "frost-wall",
    "bone-cage",
    "despair",
    "vulnerability",
    "hexblast",
    "detonate-dead",
    "flame-wall",
    "thunderstorm",
    "elemental-weakness",
    "profane-ritual",
    "snap",
    "temporal-chains",
    "thrashing-vines"
  ],
  "unleash": [
    "enfeeble",
    "spark",
    "fireball",
    "essence-drain",
    "arc",
    "ball-lightning",
    "frostbolt",
    "ice-nova",
    "comet",
    "firestorm",
    "contagion",
    "bone-cage",
    "despair",
    "vulnerability",
    "hexblast",
    "unearth",
    "detonate-dead",
    "ember-fusillade",
    "flame-wall",
    "orb-of-storms",
    "lightning-warp",
    "elemental-weakness",
    "frost-darts",
    "profane-ritual",
    "temporal-chains",
    "entangle"
  ],
  "projectileSpells": [
    "spark",
    "fireball",
    "essence-drain",
    "arc",
    "ball-lightning",
    "frostbolt",
    "eye-of-winter",
    "bonestorm",
    "ember-fusillade",
    "frost-darts"
  ],
  "iceCrystals": [
    "frost-wall",
    "frozen-locus"
  ],
  "walls": [
    "frost-wall",
    "flame-wall",
    "shield-wall"
  ],
  "cooldownDamage": [
    "spark",
    "fireball",
    "essence-drain",
    "arc",
    "ball-lightning",
    "frostbolt",
    "ice-nova",
    "comet",
    "firestorm",
    "contagion",
    "bonestorm",
    "bone-cage",
    "hexblast",
    "unearth",
    "detonate-dead",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "flame-wall",
    "orb-of-storms",
    "lightning-warp",
    "thunderstorm",
    "frost-darts",
    "profane-ritual",
    "tornado",
    "volcano",
    "entangle",
    "thrashing-vines",
    "lightning-arrow",
    "ice-strike",
    "tempest-flurry",
    "boneshatter",
    "rolling-slam",
    "ice-shot",
    "lightning-spear",
    "explosive-spear",
    "earthquake",
    "earthshatter",
    "sunder",
    "primal-strikes",
    "frozen-locus",
    "shield-wall"
  ],
  "plants": [
    "entangle",
    "briarpatch",
    "thrashing-vines",
    "toxic-domain",
    "vine-arrow",
    "toxic-growth"
  ],
  "thrownSpears": [
    "lightning-spear",
    "explosive-spear",
    "storm-lance",
    "spear-of-solaris",
    "glacial-lance",
    "whirlwind-lance",
    "twister"
  ],
  "ground": [
    "gas-arrow",
    "gas-grenade",
    "oil-grenade",
    "briarpatch",
    "earthquake",
    "storm-lance",
    "spear-of-solaris",
    "frozen-locus",
    "gathering-storm",
    "explosive-spear",
    "incinerate",
    "lightning-warp",
    "stampede",
    "fangs-of-frost",
    "oil-barrage",
    "flame-breath"
  ],
  "cooldownAilments": [
    "spark",
    "fireball",
    "lightning-arrow",
    "ice-strike",
    "tempest-flurry",
    "ice-shot",
    "arc",
    "ball-lightning",
    "frostbolt",
    "ice-nova",
    "comet",
    "bonestorm",
    "bone-cage",
    "essence-drain",
    "poisonburst-arrow",
    "gas-arrow"
  ],
  "shortDot": [
    "essence-drain",
    "contagion",
    "incinerate",
    "profane-ritual",
    "tornado",
    "vine-arrow",
    "poisonburst-arrow",
    "gas-arrow"
  ],
  "openingDot": [
    "essence-drain",
    "contagion",
    "incinerate",
    "profane-ritual",
    "tornado"
  ],
  "bowDirection": [
    "lightning-arrow",
    "ice-shot",
    "stormcaller-arrow",
    "electrocuting-arrow",
    "magnetic-salvo",
    "shockchain-arrow"
  ],
  "bowCount": [
    "lightning-arrow",
    "ice-shot",
    "electrocuting-arrow",
    "shockchain-arrow"
  ],
  "meleeBuildup": [
    "ice-strike",
    "tempest-flurry",
    "armour-breaker",
    "rolling-slam",
    "earthquake",
    "earthshatter",
    "sunder",
    "glacial-cascade",
    "storm-wave",
    "wind-blast"
  ],
  "conditionalUse": [
    "ancestral-cry",
    "walking-calamity",
    "hammer-of-the-gods",
    "spear-of-solaris",
    "tempest-bell",
    "mantra-of-destruction",
    "charged-staff"
  ],
  "selfDot": [
    "essence-drain",
    "contagion",
    "profane-ritual"
  ],
  "sealArea": [
    "enfeeble",
    "despair",
    "vulnerability",
    "elemental-weakness",
    "temporal-chains",
    "ice-nova",
    "comet",
    "fireball",
    "firestorm",
    "bone-cage",
    "contagion",
    "profane-ritual"
  ],
  "cooldownArea": [
    "enfeeble",
    "despair",
    "vulnerability",
    "elemental-weakness",
    "temporal-chains",
    "contagion",
    "bone-cage",
    "flame-wall",
    "profane-ritual"
  ],
  "triggerParents": [
    "barrier-invocation",
    "cast-on-critical",
    "cast-on-dodge",
    "cast-on-elemental-ailment",
    "cast-on-minion-death",
    "elemental-invocation",
    "feral-invocation",
    "reapers-invocation"
  ],
  "perfectTiming": [
    "gathering-storm",
    "snipe",
    "perfect-strike"
  ],
  "slamStates": [
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
    "forge-hammer"
  ],
  "criticalHits": [
    "spark",
    "fireball",
    "arc",
    "ice-nova",
    "comet",
    "ice-strike",
    "tempest-flurry",
    "lightning-arrow",
    "ice-shot",
    "rolling-slam"
  ],
  "manaSpells": [
    "spark",
    "fireball",
    "arc",
    "ball-lightning",
    "frostbolt",
    "ice-nova",
    "comet",
    "firestorm",
    "eye-of-winter",
    "frost-bomb",
    "flameblast",
    "bonestorm",
    "bone-cage",
    "hexblast",
    "essence-drain",
    "contagion",
    "profane-ritual"
  ],
  "nonAilmentDot": [
    "essence-drain",
    "contagion",
    "incinerate",
    "profane-ritual",
    "tornado",
    "vine-arrow"
  ],
  "storms": [
    "firestorm",
    "thunderstorm",
    "mana-tempest",
    "tornado"
  ],
  "warcries": [
    "infernal-cry",
    "seismic-cry",
    "ancestral-cry",
    "fortifying-cry",
    "ferocious-roar",
    "arctic-howl",
    "lunar-blessing"
  ],
  "playerAttacks": [
    "lightning-arrow",
    "ice-shot",
    "rain-of-arrows",
    "lightning-spear",
    "explosive-spear",
    "ice-strike",
    "tempest-flurry",
    "boneshatter",
    "rolling-slam",
    "galvanic-shards",
    "explosive-shot",
    "armour-piercing-rounds",
    "high-velocity-rounds",
    "rake",
    "maul",
    "shred",
    "lunar-assault",
    "snipe",
    "sunder",
    "earthquake",
    "earthshatter",
    "leap-slam",
    "stampede",
    "falling-thunder",
    "flicker-strike",
    "siphoning-strike",
    "gathering-storm",
    "spearfield",
    "storm-lance",
    "whirling-slash",
    "primal-strikes",
    "rapid-assault",
    "armour-breaker",
    "perfect-strike",
    "poisonburst-arrow",
    "gas-arrow"
  ],
  "channels": [
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
  "heralds": [
    "herald-of-ash",
    "herald-of-blood",
    "herald-of-ice",
    "herald-of-thunder"
  ],
  "leaps": [
    "molten-crash",
    "pounce",
    "stampede",
    "leap-slam",
    "vaulting-impact",
    "disengage",
    "wave-of-frost",
    "escape-shot",
    "thunderous-leap",
    "devour"
  ],
  "physicalLevels": [
    "bonestorm",
    "bone-cage",
    "vulnerability",
    "unearth",
    "detonate-dead",
    "bone-offering",
    "bloodhounds-mark",
    "seismic-cry",
    "fortifying-cry",
    "rake",
    "vaulting-impact",
    "tornado-shot",
    "blood-hunt",
    "rapid-assault",
    "killing-palm",
    "staggering-palm",
    "armour-breaker",
    "resonating-shield",
    "shield-charge",
    "shield-wall",
    "tornado",
    "scavenged-plating",
    "herald-of-blood",
    "shard-scavenger",
    "entangle",
    "briarpatch",
    "thrashing-vines",
    "toxic-domain"
  ],
  "elementalRotation": [
    "spark",
    "fireball",
    "lightning-arrow",
    "ice-shot",
    "lightning-spear",
    "explosive-spear",
    "ice-strike",
    "tempest-flurry",
    "arc",
    "ball-lightning",
    "frostbolt",
    "ice-nova",
    "comet",
    "firestorm",
    "eye-of-winter",
    "frost-bomb",
    "flameblast",
    "frost-wall",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "falling-thunder",
    "glacial-cascade",
    "storm-wave",
    "gathering-storm",
    "lightning-rod",
    "stormcaller-arrow",
    "electrocuting-arrow",
    "magnetic-salvo",
    "shockchain-arrow",
    "storm-lance",
    "glacial-lance",
    "primal-strikes",
    "molten-blast",
    "rolling-magma",
    "thunderous-leap",
    "frost-darts"
  ],
  "plantHits": [
    "entangle",
    "briarpatch",
    "thrashing-vines",
    "vine-arrow",
    "toxic-growth"
  ]
} as const;
const reviews = [
  {
    "id": "astral-projection",
    "name": "Astral Projection",
    "effectId": "SupportAstralProjectionPlayer",
    "family": "AstralProjection",
    "group": "nova",
    "summary": "Moves eligible Nova targeting to the aimed location with 25% less Area of Effect, not 25% less damage or radius. Does not create Nova eligibility for other area skills, guarantee overlap or change Warcry Power. Existing recipients and costs stay separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L625"
  },
  {
    "id": "empowered-sparks-i",
    "name": "Empowered Sparks I",
    "effectId": "SupportEmpoweredSparksPlayer",
    "family": "EmpoweredSparks",
    "group": "powerGeneration",
    "summary": "Actual Power Charge generation with this skill empowers three Attacks to trigger separate Sparks. Other charge types or charge consumption do not qualify. Does not supply the Power event, empowered uses, Infusion, child ownership, contacts or sustained damage.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L3840"
  },
  {
    "id": "living-lightning",
    "name": "Living Lightning",
    "effectId": "SupportLivingLightningPlayer",
    "family": "LivingLightning",
    "group": "lightningHits",
    "summary": "Dealing Lightning damage creates separate Living Lightning Minions (cap five, three attacks each, up to 30 seconds). Their chaining Attacks are not the player's Spell or weapon hit. No Lightning source, living population, contacts or sustained trigger rate is supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6290"
  },
  {
    "id": "living-lightning-ii",
    "name": "Living Lightning II",
    "effectId": "SupportLivingLightningPlayerTwo",
    "family": "LivingLightning",
    "group": "lightningHits",
    "summary": "Lightning damage creates Tier II Living Lightning Minions (cap eight, three attacks, up to 30 seconds), with explicit player Strength/Dexterity scaling on the child. Replaces I. No full population, inherited player Spell damage or sustained trigger rate is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6449"
  },
  {
    "id": "skittering-stone-i",
    "name": "Skittering Stone I",
    "effectId": "SupportSkitteringStonePlayer",
    "family": "SkitteringStone",
    "group": "stoneObjects",
    "summary": "Eligible stone objects hatch after five nearby deaths within four metres. Real object lifetime, nearby kills and separate elemental summons are required. Does not grant five kills, treat the object as the player's Minion or count every hatch as sustained parent damage. The child hatches one Minion, capped at eight, lasting ten seconds.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6699"
  },
  {
    "id": "skittering-stone-ii",
    "name": "Skittering Stone II",
    "effectId": "SupportSkitteringStonePlayerTwo",
    "family": "SkitteringStone",
    "group": "stoneObjects",
    "summary": "Five nearby deaths within four metres shatter eligible stone objects to hatch two separate Minions, up to twelve lasting 20 seconds, replacing I's one/eight/ten-second values. No supplied kills, active population, preserved object lifetime or parent-hit bonus.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6775"
  },
  {
    "id": "spell-cascade",
    "name": "Spell Cascade",
    "effectId": "SupportSpellCascadePlayer",
    "family": "SpellCascade",
    "group": "cascade",
    "summary": "One cascade on either side along a random axis; 20% less supported area, a separate cascade-area penalty and 30% less damage. Not three guaranteed hits or stacked DoT. Native maps do not prove another global area penalty, minion inheritance or available corpses.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7971"
  },
  {
    "id": "unleash",
    "name": "Unleash",
    "effectId": "SupportUnleashPlayer",
    "family": "Seal",
    "group": "unleash",
    "summary": "Stores up to two Seals, gained over 200% of base cast time; broken Seals repeat at 50% less damage. Costs 50% more Mana. Waiting, repeat contacts and repeat eligibility are required. Cannot support an existing cooldown, channel, use condition or other Seals.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8408"
  },
  {
    "id": "wildshards-i",
    "name": "Wildshards I",
    "effectId": "SupportWildshardsPlayer",
    "family": "AdditionalProjectiles",
    "group": "projectileSpells",
    "summary": "20% chance to fire eight extra Spell projectiles in a nova; 20% more Mana cost. Projectile count is not repeated hits or extra ailment stacks on one target. Shares the Additional Projectiles family; native compatibility alone does not grant Minion ownership.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8664"
  },
  {
    "id": "wildshards-ii",
    "name": "Wildshards II",
    "effectId": "SupportWildshardsPlayerTwo",
    "family": "AdditionalProjectiles",
    "group": "projectileSpells",
    "summary": "25% chance to fire eight extra Spell projectiles in a nova, replacing I; no added Mana multiplier in this source. Extra projectiles do not guarantee overlap, contacts, Poison stacks or sustained damage, and the Additional Projectiles family still applies.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8694"
  },
  {
    "id": "icicle",
    "name": "Icicle",
    "effectId": "SupportIciclePlayer",
    "family": "Icicle",
    "group": "iceCrystals",
    "summary": "50% less Ice Crystal maximum Life, not less player Life, shorter skill duration or automatic crystal detonation. Only reviewed crystal-producing components qualify. Actual crystal damage taken, destruction timing, explosion contacts and uptime are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5747"
  },
  {
    "id": "fortress-i",
    "name": "Fortress I",
    "effectId": "SupportWallFortressPlayer",
    "family": "Fortress",
    "group": "walls",
    "summary": "Creates the reviewed Wall in a circle with 100% increased maximum length and 40% less hit damage. Geometry is not free area damage or guaranteed contacts. Flame Wall's damage-over-time component and Frost/Shield Wall hit components remain separate. Native maps use a broader damage filter than the hit-only wording; do not infer an in-game DoT penalty.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4979"
  },
  {
    "id": "fortress-ii",
    "name": "Fortress II",
    "effectId": "SupportWallFortressPlayerTwo",
    "family": "Fortress",
    "group": "walls",
    "summary": "Creates a circular Wall with 100% increased maximum length, 30% less hit damage and 20% less area, replacing I. Does not imply doubled hits, radius, wall health or damage over time. Native coverage of geometry and child effects is incomplete. Native damage/area output does not verify wall geometry; the damage map is broader than hit-only wording.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5016"
  },
  {
    "id": "hourglass",
    "name": "Hourglass",
    "effectId": "SupportHourglassPlayer",
    "family": "GrantsCooldown",
    "group": "cooldownDamage",
    "summary": "Adds a ten-second cooldown for 30% more damage, not sustained DPS. The cooldown is a real use gate and may disable repeats or Seals. Shares GrantsCooldown with other cooldown-adding supports. Existing native cooldown skills are not offered by this review.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5600"
  },
  {
    "id": "accelerated-growth",
    "name": "Accelerated Growth",
    "effectId": "SupportExplosiveGrowthPlayer",
    "family": "AcceleratedGrowth",
    "group": "plants",
    "summary": "Overgrown Plants trigger a separate Accelerated Growth explosion. Does not Overgrow the Plant, supply a hit/Poison source or turn plant lifetime into guaranteed detonations. The child's own damage, timer, recipients and contacts are separate from parent damage. The separate Physical Spell explosion is delayed 1.2 seconds.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L191"
  },
  {
    "id": "accelerated-growth-ii",
    "name": "Accelerated Growth II",
    "effectId": "SupportExplosiveGrowthPlayerTwo",
    "family": "AcceleratedGrowth",
    "group": "plants",
    "summary": "Overgrown Plants trigger Tier II's separate explosion with on-hit Blind, replacing I. It still requires Overgrowth and a real child hit; no parent Blind, free Poison, guaranteed extra applications or sustained child uptime is assumed. The separate Physical Spell child has 100% Blind chance on its actual hit and a 1.2-second delay.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L40"
  },
  {
    "id": "caltrops",
    "name": "Caltrops",
    "effectId": "SupportCaltropsPlayer",
    "family": "Caltrops",
    "group": "thrownSpears",
    "summary": "Eligible thrown Spear projectiles create separate Caltrops at the end of flight; 20% more Mana cost. Flight end, ground coverage and Caltrops damage are not the parent hit, Poison application or extra contacts on one enemy.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L732"
  },
  {
    "id": "encroaching-ground",
    "name": "Encroaching Ground",
    "effectId": "SupportEncroachingGroundPlayer",
    "family": "EncroachingGround",
    "group": "ground",
    "summary": "Ground-effect area grows by 20% more per second, up to 100% more, with 10% more Mana cost. Needs an existing ground effect and enough lifetime; growth is not radius, instant maximum coverage or increased damage per second.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4195"
  },
  {
    "id": "execrate",
    "name": "Execrate",
    "effectId": "SupportExecratePlayer",
    "family": "GrantsCooldown",
    "group": "cooldownAilments",
    "summary": "Adds an eight-second cooldown and 100% more ailment chance, not +100 percentage points or guaranteed application. Does not grant a base chance, valid damage source or bypass prohibitions. Shares GrantsCooldown; costs, thresholds and uptime remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4548"
  },
  {
    "id": "intense-agony",
    "name": "Intense Agony",
    "effectId": "SupportIntenseAgonyPlayer",
    "family": "IntenseAgony",
    "group": "openingDot",
    "summary": "50% more non-ailment damage over time against enemies on Full Life with 25% less skill duration. Enemy Full Life is an opening condition, not player Full Life or sustained boss uptime. Poison/Bleeding and a hit component are not credited this bonus.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6023"
  },
  {
    "id": "poison-spores",
    "name": "Poison Spores",
    "effectId": "SupportPoisonSpores",
    "family": "PoisonSpores",
    "group": "plantHits",
    "summary": "Actual Plant hits trigger separate Toxic Pustules; Overgrowth is not the trigger. Placement is non-damaging; delayed Pustule Explosions have their own Poison chance, damage and stored-Poison scaling. No parent Poison, extra stacks, maximum storage or immediate detonation is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3943"
  },
  {
    "id": "swift-affliction-iii",
    "name": "Swift Affliction III",
    "effectId": "SupportSwiftAfflictionPlayerThree",
    "family": "SwiftAffliction",
    "group": "shortDot",
    "summary": "30% less skill and damaging-ailment duration; conditional 50% more non-ailment DoT at the one-second duration threshold. Poison and Bleeding are not non-ailment DoT. Crossing the threshold and reducing total damage/lifetime are real trade-offs, not automatic DPS.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5476"
  },
  {
    "id": "alignment-i",
    "name": "Alignment I",
    "effectId": "SupportAlignmentPlayer",
    "family": "Alignment",
    "group": "bowDirection",
    "summary": "After a one-second aiming delay, eligible Bow projectiles fired within the indicated 40-degree allowance gain 30% more Projectile damage; 20% more Mana cost. Direction, waiting, contacts and damage-source applicability are not assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L149"
  },
  {
    "id": "alignment-ii",
    "name": "Alignment II",
    "effectId": "SupportAlignmentPlayerTwo",
    "family": "Alignment",
    "group": "bowDirection",
    "summary": "After a one-second aiming delay, eligible Bow projectiles within the indicated 40-degree allowance gain 40% more Projectile damage; 20% more Mana cost. Replaces I, not both bonuses. Directional uptime and extra contacts are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L182"
  },
  {
    "id": "alignment-iii",
    "name": "Alignment III",
    "effectId": "SupportAlignmentPlayerThree",
    "family": "Alignment",
    "additionalFamilies": [
      "AdditionalProjectiles"
    ],
    "group": "bowCount",
    "summary": "After a one-second aiming delay, firing within the indicated 40-degree allowance adds four projectiles, not I/II's damage bonus; 20% more Mana cost. Shares Alignment and Additional Projectiles families. No overlap, extra Poison applications or full uptime is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L215"
  },
  {
    "id": "brink-i",
    "name": "Brink I",
    "effectId": "SupportBrinkPlayer",
    "family": "Brink",
    "group": "meleeBuildup",
    "summary": "Melee hits build Heavy Stun 30% more effectively but cannot themselves cause Heavy Stun. Buildup is not more hit damage, an actual Stun event or a guaranteed reward. A different eligible skill must finish Heavy Stun; normal Stun rules remain distinct.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1157"
  },
  {
    "id": "brink-ii",
    "name": "Brink II",
    "effectId": "SupportBrinkPlayerTwo",
    "family": "Brink",
    "group": "meleeBuildup",
    "summary": "Melee hits build Heavy Stun 50% more effectively but cannot themselves cause Heavy Stun, replacing I. Not more damage or guaranteed Heavy Stun. Self-caused Heavy-Stun buffs, charge rewards and consumption requirements are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1188"
  },
  {
    "id": "delayed-gratification",
    "name": "Delayed Gratification",
    "effectId": "SupportDelayedGratificationPlayer",
    "family": "DelayedGratification",
    "group": "conditionalUse",
    "summary": "Makes a supported skill's conditional requirement 150% harder to meet, then allows one additional use within ten seconds. Does not generate Glory, Combo, charges or the first use; an additional permitted use is not a guaranteed repeat or free resource cost.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1801"
  },
  {
    "id": "derange",
    "name": "Derange",
    "effectId": "SupportDerangePlayer",
    "family": "Derange",
    "group": "selfDot",
    "summary": "Adds an Energy Shield cost equal to player Intelligence for 8% more non-ailment DoT per 100 Intelligence. Not Spell-hit, Poison or Bleeding damage. Does not grant Energy Shield or sustain; Lifetap does not convert this separate ES obligation to Life.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L3016"
  },
  {
    "id": "expand",
    "name": "Expand",
    "effectId": "SupportExpandPlayer",
    "family": "Seal",
    "additionalFamilies": [
      "IncreasedAreaOfEffect"
    ],
    "group": "sealArea",
    "summary": "Stores up to three Seals, gained over 200% of base cast time, for 30% increased area per broken Seal; 20% more Mana cost. Not Unleash repeats or automatic max Seals. Shares Seal and Increased Area families; waiting and valid area components remain required.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4588"
  },
  {
    "id": "expanse",
    "name": "Expanse",
    "effectId": "SupportExpansePlayer",
    "family": "GrantsCooldown",
    "group": "cooldownArea",
    "summary": "Adds an eight-second cooldown and 50% increased area, not radius or damage. Native-cooldown skills are excluded. Shares GrantsCooldown; cooldown recovery may reduce the gate but does not create repeat eligibility, overlap or guaranteed use on cooldown.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4630"
  },
  {
    "id": "fluke",
    "name": "Fluke",
    "effectId": "SupportFlukePlayer",
    "family": "Fluke",
    "group": "triggerParents",
    "summary": "Randomizes socketed triggered-child damage from 40% less to 60% more and refunds 0-20% of the child's own cost; 20% higher cost. Not parent damage, a guaranteed average refund, supplied Energy, trigger rate or resource sustain. Requires the selected child.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4875"
  },
  {
    "id": "perfection",
    "name": "Perfection",
    "effectId": "SupportPerfectionPlayer",
    "family": "Perfection",
    "group": "perfectTiming",
    "summary": "Successful Perfect Timing grants Perfection; failing any Perfect Timing loses all Perfection. Does not widen the timing window, supply successful actions or promise capped stacks, permanent buffs, damage or defensive uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3618"
  },
  {
    "id": "syzygy",
    "name": "Syzygy",
    "effectId": "SupportSyzygyPlayer",
    "family": "Syzygy",
    "group": "slamStates",
    "summary": "Eligible Slam hits are Crushing Blows only against enemies both Ignited and Fully Armour Broken. The supported skill's own Heavy Stun under those conditions permanently Intimidates. Neither condition, full-break event nor Heavy Stun is supplied automatically.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7267"
  },
  {
    "id": "volatility",
    "name": "Volatility",
    "effectId": "SupportVolatilityPlayer",
    "family": "Volatility",
    "group": "criticalHits",
    "summary": "Critical hits grant Volatility. Does not grant critical chance, usable stacks, a spender, guaranteed generation rate or permanent damage. A critical-hit prohibition still prevents the event; stored Volatility is separate from Catharsis consumption.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8603"
  },
  {
    "id": "window-of-opportunity-i",
    "name": "Window of Opportunity I",
    "effectId": "SupportWindowOfOpportunityPlayer",
    "family": "WindowOfOpportunity",
    "group": "perfectTiming",
    "summary": "35% narrower Perfect Timing window for 35% more damage on successful Perfect Timing. Not unconditional hit damage, action speed or automatic success. Failure rate, player timing and actual sustained output are not modeled.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5820"
  },
  {
    "id": "window-of-opportunity-ii",
    "name": "Window of Opportunity II",
    "effectId": "SupportWindowOfOpportunityPlayerTwo",
    "family": "WindowOfOpportunity",
    "group": "perfectTiming",
    "summary": "Same 35% narrower window and conditional 35% more damage, plus Deflection equal to 15% of Evasion for eight seconds after success. Not Evasion itself or permanent mitigation. Replaces I; timing, current Evasion and protection caps are not assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5856"
  },
  {
    "id": "zenith-i",
    "name": "Zenith I",
    "effectId": "SupportZenithPlayer",
    "family": "Zenith",
    "group": "manaSpells",
    "summary": "30% more supported Spell damage only above 90% of player maximum Mana, with 20% more Mana cost. Player Mana, not Minion Mana; spending can immediately lose the condition. No guaranteed Full Mana, leech, recovery or sustained damage is credited.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8904"
  },
  {
    "id": "zenith-ii",
    "name": "Zenith II",
    "effectId": "SupportZenithPlayerTwo",
    "family": "Zenith",
    "group": "manaSpells",
    "summary": "30% more supported Spell damage only above 90% of player maximum Mana and 25% increased Mana Cost Efficiency, replacing I. No I's added Mana multiplier. Efficiency is not 25% less cost, and the threshold is not guaranteed sustain or Minion damage.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8935"
  },
  {
    "id": "acrimony",
    "name": "Acrimony",
    "effectId": "SupportAcrimonyPlayer",
    "family": "Acrimony",
    "group": "nonAilmentDot",
    "summary": "Enemies affected by this skill's non-ailment DoT have 50% reduced Life regeneration rate; 10% more Mana cost. Not player regeneration, more DoT damage, Poison/Bleeding scaling or a guarantee the enemy has regeneration to suppress. Only the strongest regeneration-reduction instance applies; it is not additive stacking.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L341"
  },
  {
    "id": "advancing-storm",
    "name": "Advancing Storm",
    "effectId": "SupportAdvancingStormPlayer",
    "family": "MovingStorms",
    "group": "storms",
    "summary": "Reviewed Storms move toward the relevant target at 2.5 metres per second, with changed spawn/targeting behavior. Not player Movement Speed, more damage or extra contacts. Geometry, target movement, time in area and child delivery remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L372"
  },
  {
    "id": "battershout",
    "name": "Battershout",
    "effectId": "SupportBattershoutPlayer",
    "family": "Battershout",
    "group": "warcries",
    "summary": "Warcries consume Fully Broken Armour to trigger a separate explosion and cannot themselves Break Armour; 30% more Mana cost. Needs a separate break source. Consumption is not permanent full-break uptime, the parent Warcry hit or an extra guaranteed damage multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L727"
  },
  {
    "id": "cadence",
    "name": "Cadence",
    "effectId": "SupportCadencePlayer",
    "family": "Cadence",
    "group": "playerAttacks",
    "summary": "8% more Attack Speed per recent use, but six uses within four seconds lock the skill for ten seconds. Sustained skills gain stages periodically instead. Not free sustained Attack Speed, six permanently usable stacks or a guaranteed net DPS gain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L699"
  },
  {
    "id": "crackling-barrier",
    "name": "Crackling Barrier",
    "effectId": "SupportCracklingBarrierPlayer",
    "family": "CracklingBarrier",
    "group": "channels",
    "summary": "While channeling, gain Lightning Thorns equal to 15% of player maximum Mana. Thorns needs a valid retaliation event, not any incoming Hit; it is not the parent hit or guaranteed mitigation. No supplied contacts, safe retaliation or continuous damage is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2396"
  },
  {
    "id": "deadly-resolve",
    "name": "Deadly Resolve",
    "effectId": "SupportDeadlyResolvePlayer",
    "family": "DeadlyResolve",
    "group": "channels",
    "summary": "Channeling gains a stage each second, up to three lasting ten seconds; being Hit spends one for a separate armour-scaled slash, with a 0.3-second trigger gate. Not parent damage, supplied stages, automatic retaliation or permanent defensive benefit.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2181"
  },
  {
    "id": "deadly-herald",
    "name": "Deadly Herald",
    "effectId": "SupportDeadlyHeraldsPlayer",
    "family": "DeadlyHeralds",
    "group": "heralds",
    "summary": "30% more damage from the supported Herald with 20 additional flat Spirit reserved. Does not grant a Herald trigger, underlying attack damage or a free reservation. Herald-specific hits, burn/spread and minion/proxy ownership remain distinct.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1688"
  },
  {
    "id": "holy-descent",
    "name": "Holy Descent",
    "effectId": "SupportHolyDescentPlayer",
    "family": "HolyDescent",
    "group": "leaps",
    "summary": "Landing from an eligible leap creates Consecrated Ground for four seconds with 2.2-metre base radius. Not a built-in heal on every hit, player Life regeneration outside the ground or guaranteed landing/ground uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4367"
  },
  {
    "id": "physical-mastery",
    "name": "Physical Mastery",
    "effectId": "SupportPhysicalMasteryPlayer",
    "family": "Mastery",
    "group": "physicalLevels",
    "summary": "Adds one level to an eligible level-scaling Physical skill, not +1 to supports, every Physical damage component or a flat damage multiplier. Damage, costs, reservation and utility vary by skill and effective level; no automatic DPS or free sustain is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7307"
  },
  {
    "id": "shocking-leap",
    "name": "Shocking Leap",
    "effectId": "SupportShockingLeapPlayer",
    "family": "ShockingLeap",
    "group": "leaps",
    "summary": "The first critical hit of an eligible leap creates Shocked Ground, at most once per use, for four seconds with two-metre base radius. Not an automatic landing reward or hit-based Shock chance. Critical eligibility, enemy position and ground uptime are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5199"
  },
  {
    "id": "rising-tempest",
    "name": "Rising Tempest",
    "effectId": "SupportTempestuousTempoPlayer",
    "family": "RisingTempest",
    "group": "elementalRotation",
    "summary": "12% more Elemental damage per different Elemental skill used Recently, with 20% more Mana cost. Requires an actual rotation and relevant Elemental damage; not per hit or unconditional maximum stacks. Physical/Chaos damage and uptime remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7627"
  }
] as const;

type Suggestion = SkillPreferencePreset["suggestions"][number];
type Override = { summary: string; priorities?: readonly Suggestion[] };
const suggestion = (id: Suggestion["id"], reason: string, weight = 2): Suggestion => ({id,reason,weight});

function priorities(id: string): Suggestion[] {
  if (["hourglass","execrate","expanse"].includes(id)) return [
    suggestion("cooldownRecoveryRate","Optional recovery for an added cooldown; not repeat eligibility, stored uses or a guarantee of sustainable use on cooldown."),
  ];
  if (id === "derange") return [
    suggestion("energyShield","Optional pool for the separate ES cost, not Intelligence, ES recovery or guaranteed sustain.",1),
  ];
  if (id === "crackling-barrier") return [
    suggestion("mana","Optional maximum-Mana base for conditional Lightning Thorns, not damage of the channel or guaranteed retaliation.",1),
  ];
  if (id === "deadly-resolve") return [
    suggestion("armour","Optional player Armour for the separate triggered slash, not parent damage, guaranteed incoming hits or physical mitigation.",1),
  ];
  if (id === "zenith-ii") return [
    suggestion("manaCostEfficiency","Optional cost support for staying above the Mana threshold; efficiency is not recovery or guaranteed condition uptime."),
  ];
  return [];
}

export const specialistSkillSupports: readonly ReviewedSkillSupport[] = reviews.map(review => ({
  id:review.id,name:review.name,effectId:review.effectId,family:review.family,
  ...("additionalFamilies" in review ? {additionalFamilies:review.additionalFamilies} : {}),
  skillIds:scopes[review.group],summary:review.summary,sourceUrl:review.sourceUrl,priorities:priorities(review.id),
}));

export function specialistSupportOverride(support: ReviewedSkillSupport, selected: readonly string[], focusId: string): Override | undefined {
  const has = (id: string) => selected.includes(id);
  const family = (prefix: string) => selected.some(id => id.startsWith(prefix));
  const messages: string[] = [];
  let blocked = false;
  const block = (message: string) => {messages.push(message);blocked = true;};
  const addedCooldown = ["hourglass","expanse","execrate","excise","nova-projectiles-ii"].some(has);
  if (addedCooldown && ["unleash","expand","spell-echo","hit-and-run"].includes(support.id))
    block("A selected support adds a cooldown. This can make Unleash, Expand, Spell Echo or Hit and Run ineligible in native PoB; retained selections are not proof that both links apply. The cooldown and costs still matter.");
  if (["hourglass","expanse","execrate"].includes(support.id) && ["unleash","expand","spell-echo","hit-and-run"].some(has))
    messages.push("This added cooldown can disable a selected repeat, Seal or no-cooldown use condition. Native link acceptance is not a combined-loadout guarantee; no repeated hits or sustainable use frequency is supplied.");
  if (has("catharsis") && support.id === "delayed-gratification")
    messages.push("Catharsis adds a separate pre-use Volatility requirement. Additional-use permission does not supply Volatility, waive consumption or establish that combined requirement behavior is modeled.");
  if (has("volatility") && has("catharsis") && ["volatility","catharsis"].includes(support.id))
    messages.push("Catharsis needs 20 Volatility before the first use. Volatility can be generated only by eligible later critical hits; this pairing does not automatically start, refill or sustain itself.");
  if (has("controlled-destruction") && support.id === "volatility")
    block("Controlled Destruction prevents this skill from critically hitting, so it cannot generate Volatility. Having external resources does not restore its own critical-hit event.");
  if (family("brutality-") && support.family === "LivingLightning")
    block("Brutality prevents the linked parent from dealing Lightning damage, so it cannot supply this trigger. Do not assume the same restriction is inherited by a separately granted Minion; source, recipient and trigger are distinct.");
  if ((has("elemental-focus") || has("elemental-armament-iii")) && support.family === "LivingLightning")
    messages.push("Inability to Shock is not inability to deal Lightning damage. Living Lightning needs eligible Lightning damage, not Shock; no Minion trigger rate or active population is assumed.");
  if (support.id === "empowered-sparks-i" && (has("charge-profusion-i") || has("charge-profusion-ii") || has("inhibitor")))
    messages.push("Only actual Power Charge generation empowers these Attacks. Profusion still needs a generation event; Inhibitor blocks consumption, not generation. Neither a full charge counter nor charge retention supplies the required event.");
  if (family("brink-") && (support.family === "Brink" || support.family === "PracticalMagic" || support.family === "EnduringImpact" || support.id === "syzygy" || support.family === "Vanguard"))
    messages.push("Brink prevents this skill from finishing Heavy Stun. External Heavy Stun is not this skill's event for Practical Magic, Enduring Impact, Syzygy's Intimidate or Vanguard's Heavy-Stun reward. Ordinary-Stun behavior is not inferred; the separate Crushing Blow clause still needs its target states.");
  if (family("brink-") && support.family === "EnduringImpact") blocked = true;
  if (family("brink-") && family("pin-") && (support.family === "Brink" || support.family === "Pin"))
    messages.push("Pin prevents this skill's Stun plan; Brink's Heavy-Stun buildup benefit does not supply a Pin event or override the Stun prohibition. No finishing skill or immobilisation uptime is assumed.");
  if (support.id === "syzygy" && (has("elemental-focus") || has("elemental-armament-iii") || family("brutality-") || has("immolate")))
    messages.push("Selected damage/ailment prohibitions can prevent self-supplied Ignite. External Ignite can still satisfy that target state, but Fully Broken Armour and this skill's own Heavy Stun remain separate requirements.");
  if (support.id === "battershout" && (has("corrosion") || has("exploit-weakness")))
    messages.push("Battershout cannot itself Break Armour. A selected break-related modifier does not bypass that prohibition or supply the separate source's full-break event; consumption also prevents assuming permanent Fully Broken Armour.");
  if (support.id === "derange" && has("lifetap"))
    messages.push("Lifetap converts the Mana cost only. Derange's separate ES cost equal to Intelligence remains; ES, Life and any other sacrifices are not a free-cost or recovery loop.");
  if (support.id === "swift-affliction-iii" && (family("prolonged-duration-") || family("compressed-duration-") || family("swift-affliction-")))
    messages.push("The final non-ailment duration must meet the one-second threshold. Duration modifiers can cross it; Poison/Bleeding never gain this non-ailment bonus, but their durations can still be shortened. No crossing or damage uptime is assumed.");
  if (support.id === "intense-agony" && has("ambush"))
    messages.push("Enemy Full Life is transient. Ambush's opening hit is not the ongoing DoT recipient, and neither condition guarantees the other bonus's uptime.");
  if (support.id === "encroaching-ground" && (family("prolonged-duration-") || family("compressed-duration-")))
    messages.push("Growth is bounded by actual ground lifetime and 100% more area. Duration changes do not guarantee reaching the cap or maintaining coverage; Poison duration and ground lifetime remain distinct.");
  if (support.family === "Perfection" && family("window-of-opportunity-"))
    messages.push("Window of Opportunity narrows the success window; failing any Perfect Timing loses all Perfection. Neither support supplies a successful release, stacks or permanent Deflection.");
  if (support.id === "zenith-ii" && has("lifetap"))
    block("Lifetap removes the ordinary Mana cost, not a source of Mana recovery or proof of being above 90% Mana. Existing manual cost-efficiency priorities are retained; the linked zero Mana cost has no extra efficiency benefit.");
  if (support.family === "Fortress" && focusId === "flame-wall")
    messages.push("This focus reviews the burning component. Fortress's hit-only wording and broader native damage map differ; do not treat native DoT changes as verified in-game penalties or circular-wall geometry as extra damage.");
  if (support.id === "shocking-leap" && (has("elemental-focus") || has("elemental-armament-iii")))
    messages.push("Shocked Ground is separate from a hit inflicting Shock. Elemental Focus's hit-ailment prohibition alone does not prove the ground is removed; application, enemy position and ground uptime remain unmodeled.");
  if (support.id === "physical-mastery" && family("brutality-"))
    messages.push("An added skill level does not override Brutality's damage prohibitions or turn the skill's total level scaling into a flat damage multiplier. Separate components, costs and support levels remain distinct.");
  return messages.length ? {summary:messages.join(" "),...(blocked ? {priorities:[]} : {})} : undefined;
}

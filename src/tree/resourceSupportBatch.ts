import type { SkillPreferencePreset } from "./skillPreferencePresets";
import type { ReviewedSkillSupport } from "./skillSupportPreferences";

// Explicit player/resource recipients; native type compatibility alone is not approval.
const scopes = {
  "attack": [
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
  "spellHit": [
    "fireball",
    "spark",
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
    "bonestorm",
    "bone-cage",
    "hexblast",
    "essence-drain",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "frost-darts",
    "entangle",
    "thrashing-vines"
  ],
  "persistent": [
    "arctic-armour",
    "berserk",
    "wind-dancer",
    "ghost-dance",
    "time-of-need",
    "archmage",
    "overwhelming-presence",
    "grim-feast",
    "scavenged-plating",
    "iron-ward",
    "magma-barrier",
    "barkskin",
    "blasphemy",
    "withering-presence",
    "combat-frenzy",
    "elemental-conflux",
    "eternal-rage",
    "mana-remnants",
    "siphon-elements",
    "lingering-illusion"
  ],
  "corpse": [
    "unearth",
    "detonate-dead",
    "devour",
    "profane-ritual",
    "raise-zombie"
  ],
  "chargeGeneration": [
    "snipers-mark",
    "siphoning-strike",
    "disengage",
    "killing-palm",
    "cull-the-weak",
    "wing-blast",
    "devour",
    "profane-ritual",
    "magma-barrier",
    "combat-frenzy",
    "lingering-illusion"
  ],
  "chargeConsumption": [
    "rain-of-arrows",
    "lightning-spear",
    "explosive-spear",
    "bonestorm",
    "infernal-cry",
    "seismic-cry",
    "ancestral-cry",
    "fortifying-cry",
    "falling-thunder",
    "flicker-strike",
    "spiral-volley",
    "storm-lance",
    "glacial-lance",
    "whirlwind-lance",
    "oil-barrage",
    "wind-serpents-fury",
    "flame-breath",
    "barrage",
    "charged-staff",
    "ice-tipped-arrows",
    "arctic-howl"
  ],
  "perfectTiming": [
    "gathering-storm",
    "snipe",
    "perfect-strike"
  ],
  "remnants": [
    "frost-bomb",
    "living-bomb",
    "orb-of-storms",
    "lightning-warp",
    "snap",
    "grim-feast",
    "mana-remnants",
    "siphon-elements",
    "lingering-illusion"
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
  "shield": [
    "resonating-shield",
    "shield-charge",
    "shield-wall"
  ],
  "warcry": [
    "infernal-cry",
    "seismic-cry",
    "ancestral-cry",
    "fortifying-cry",
    "ferocious-roar",
    "arctic-howl",
    "lunar-blessing"
  ],
  "object": [
    "lightning-rod",
    "tornado-shot",
    "shockchain-arrow",
    "tempest-bell"
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
    "siphoning-strike",
    "whirling-assault",
    "whirling-slash",
    "blood-hunt",
    "primal-strikes",
    "rapid-assault",
    "armour-breaker",
    "perfect-strike",
    "cull-the-weak",
    "fangs-of-frost"
  ],
  "hit": [
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
    "gas-arrow",
    "fireball",
    "spark",
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
    "bonestorm",
    "bone-cage",
    "hexblast",
    "essence-drain",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "frost-darts",
    "entangle",
    "thrashing-vines"
  ],
  "selfless": [
    "frost-bomb",
    "living-bomb",
    "orb-of-storms",
    "lightning-warp",
    "snap",
    "mana-remnants",
    "siphon-elements",
    "lingering-illusion"
  ],
  "active": [
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
    "gas-arrow",
    "fireball",
    "spark",
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
    "bonestorm",
    "bone-cage",
    "hexblast",
    "essence-drain",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "frost-darts",
    "entangle",
    "thrashing-vines",
    "enfeeble",
    "despair",
    "vulnerability",
    "elemental-weakness",
    "temporal-chains",
    "snipers-mark",
    "bloodhounds-mark",
    "freezing-mark",
    "voltaic-mark",
    "infernal-cry",
    "seismic-cry",
    "ancestral-cry",
    "fortifying-cry",
    "ferocious-roar",
    "arctic-howl",
    "lunar-blessing"
  ],
  "inhibitor": [
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
    "gas-arrow",
    "fireball",
    "spark",
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
    "bonestorm",
    "bone-cage",
    "hexblast",
    "essence-drain",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "frost-darts",
    "entangle",
    "thrashing-vines",
    "enfeeble",
    "despair",
    "vulnerability",
    "elemental-weakness",
    "temporal-chains",
    "seismic-cry",
    "fortifying-cry",
    "arctic-howl",
    "spiral-volley",
    "glacial-lance",
    "whirlwind-lance",
    "oil-barrage",
    "flame-breath",
    "barrage",
    "ice-tipped-arrows"
  ],
  "catharsis": [
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
    "gas-arrow",
    "fireball",
    "spark",
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
    "bonestorm",
    "bone-cage",
    "hexblast",
    "essence-drain",
    "ember-fusillade",
    "living-bomb",
    "incinerate",
    "orb-of-storms",
    "lightning-conduit",
    "lightning-warp",
    "thunderstorm",
    "frost-darts",
    "entangle",
    "thrashing-vines",
    "enfeeble",
    "despair",
    "vulnerability",
    "elemental-weakness",
    "temporal-chains",
    "snipers-mark",
    "bloodhounds-mark",
    "freezing-mark",
    "voltaic-mark",
    "infernal-cry",
    "seismic-cry",
    "fortifying-cry",
    "ferocious-roar",
    "arctic-howl",
    "lunar-blessing"
  ]
} as const;

const reviews = [
  {
    "id": "ambrosia",
    "name": "Ambrosia",
    "effectId": "SupportAmbrosiaPlayer",
    "family": "Ambrosia",
    "group": "hit",
    "summary": "Consumes 14% of maximum Mana Flask charges on use, gaining 2% of damage as extra Lightning per charge actually consumed. No added Mana multiplier. No flask capacity, available charges, recharge, sustained uses or permanent damage bonus is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L481"
  },
  {
    "id": "ambrosia-ii",
    "name": "Ambrosia II",
    "effectId": "SupportAmbrosiaPlayerTwo",
    "family": "Ambrosia",
    "group": "hit",
    "summary": "Consumes 35% of maximum Mana Flask charges, gaining 1% extra Lightning per charge actually consumed. Not I's per-charge bonus too. No added Mana multiplier; larger drain and real charge supply remain separate from damage and sustain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L437"
  },
  {
    "id": "cannibalism-i",
    "name": "Cannibalism I",
    "effectId": "SupportCannibalismPlayer",
    "family": "Cannibalism",
    "group": "persistent",
    "summary": "While this Persistent Buff is active, eligible player kills recover 2% of maximum Life. Adds 15 flat Spirit. Recovery per kill is not regeneration per second, Minion kill credit or guaranteed sustain; actual kills and usable Life capacity are required.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1362"
  },
  {
    "id": "cannibalism-ii",
    "name": "Cannibalism II",
    "effectId": "SupportCannibalismPlayerTwo",
    "family": "Cannibalism",
    "group": "persistent",
    "summary": "While the Persistent Buff is active, eligible kills recover 3% of player maximum Life, with +30 flat Spirit. Replaces I, not both bonuses/reservations. No assumed kill frequency, Minion credit, overfill benefit or continuous healing.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1397"
  },
  {
    "id": "herbalism-i",
    "name": "Herbalism I",
    "effectId": "SupportHerbalismPlayer",
    "family": "Herbalism",
    "group": "persistent",
    "summary": "30% increased Life recovery from Flasks while the Persistent Buff is active, adding 15 flat Spirit. Not instant recovery, flask-charge generation or a source of Life regeneration. Flask availability, caps, recovery timing and actual sustain remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4297"
  },
  {
    "id": "herbalism-ii",
    "name": "Herbalism II",
    "effectId": "SupportHerbalismPlayerTwo",
    "family": "Herbalism",
    "group": "persistent",
    "summary": "50% increased Life Flask recovery with +30 flat Spirit while the buff is active. Replaces I rather than stacking reservations or granting free flask uses. Not charge generation, recovery speed, continuous sustain or player maximum Life.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4332"
  },
  {
    "id": "lifetap",
    "name": "Lifetap",
    "effectId": "SupportBloodMagicPlayer",
    "family": "Lifetap",
    "group": "active",
    "summary": "Converts 100% of this skill's Mana cost to a Life cost, without an added cost multiplier. Does not make it free or convert Spirit reservation, sacrifices or separate Mana consumption. Costs, rounding, available Life and actual recovery still matter.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5021"
  },
  {
    "id": "gorge",
    "name": "Gorge",
    "effectId": "SupportGorgePlayer",
    "family": "Gorge",
    "group": "corpse",
    "summary": "Consuming Corpses with this skill grants ten Life Flask and ten Mana Flask charges per Corpse consumed. Does not create Corpses, consume them automatically or grant Charm charges. Real consumption, flask caps and refill/use cadence are required.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5319"
  },
  {
    "id": "extraction",
    "name": "Extraction",
    "effectId": "SupportExtractionPlayer",
    "family": "Extraction",
    "group": "spellHit",
    "summary": "Sacrifices 10% of Life on use for 35% of damage gained as extra Chaos. Normal costs remain separate. Only reviewed self-cast damaging-hit Spells; no Minion, Persistent or Triggered parent. A sacrifice is not an ordinary Life cost or an assumed sustainable damage gain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4667"
  },
  {
    "id": "mana-flare",
    "name": "Mana Flare",
    "effectId": "SupportManaFlarePlayer",
    "family": "ManaFlare",
    "group": "spellHit",
    "summary": "Spell critical hits trigger a separate Fire Mana Flare: 25% of current Mana consumed and a one-second child cooldown. Not a free parent damage multiplier or guaranteed trigger rate. Current Mana, actual crits, child eligibility and repeated consumption are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6753"
  },
  {
    "id": "practical-magic-i",
    "name": "Practical Magic I",
    "effectId": "SupportPracticalMagicPlayer",
    "family": "PracticalMagic",
    "group": "hit",
    "summary": "Heavy Stun caused by this skill grants 30% increased player Spell Damage for eight seconds. It is not more damage, an automatic bonus to the triggering Attack or Minion damage. No Heavy Stun event, repeated refresh or sustained buff is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7406"
  },
  {
    "id": "practical-magic-ii",
    "name": "Practical Magic II",
    "effectId": "SupportPracticalMagicPlayerTwo",
    "family": "PracticalMagic",
    "group": "hit",
    "summary": "Own Heavy Stun grants 40% increased player Spell Damage for eight seconds. Replaces I and does not automatically improve an Attack that triggered it. Native condition and actual event are separate; Pin's Stun prohibition still applies.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7437"
  },
  {
    "id": "mysticism-i",
    "name": "Mysticism I",
    "effectId": "SupportMysticismPlayer",
    "family": "Mysticism",
    "group": "persistent",
    "summary": "While the Persistent Buff is active and the player is on Full Energy Shield, grants 30% increased player Spell Damage. Adds 15 flat Spirit. Not attack/Minion damage, ES recovery or a guarantee of keeping the shield full; conditional uptime is not scored.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7141"
  },
  {
    "id": "mysticism-ii",
    "name": "Mysticism II",
    "effectId": "SupportMysticismPlayerTwo",
    "family": "Mysticism",
    "group": "persistent",
    "summary": "While active on player Full Energy Shield, grants 40% increased Spell Damage and adds 30 flat Spirit. Not both tiers together, more final damage or a recovery source. Gear, incoming damage and Full-ES uptime are not supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7176"
  },
  {
    "id": "precision-i",
    "name": "Precision I",
    "effectId": "SupportPrecisionPlayer",
    "family": "Precision",
    "group": "persistent",
    "summary": "30% increased player Accuracy Rating while the Persistent Buff is active, with +10 flat Spirit. Not +30 hit-chance points, Spell damage or Minion Accuracy. Actual attacks, enemy Evasion, range and hit chance remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4184"
  },
  {
    "id": "precision-ii",
    "name": "Precision II",
    "effectId": "SupportPrecisionPlayerTwo",
    "family": "Precision",
    "group": "persistent",
    "summary": "50% increased player Accuracy Rating while active, adding 20 flat Spirit. Replaces I rather than granting both bonuses. Accuracy is not capped hit chance or damage by itself; player/Minion ownership and enemy conditions remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4219"
  },
  {
    "id": "inhibitor",
    "name": "Inhibitor",
    "effectId": "SupportChargeInhibitionPlayer",
    "family": "Inhibitor",
    "group": "inhibitor",
    "summary": "Prevents this skill consuming Charges or Infusions; cannot support a skill requiring them for use. Source grants 4% more damage per different type present, not per individual charge. Supply, retention and Infusion effect coverage are incomplete; no maximum state is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2601"
  },
  {
    "id": "charge-profusion-i",
    "name": "Charge Profusion I",
    "effectId": "SupportChargeProfusionPlayer",
    "family": "ChargeProfusion",
    "group": "chargeGeneration",
    "summary": "30% chance to gain an additional Charge when this skill actually generates one; costs 20% more Mana. Does not grant a generation event, bypass caps or turn capacity into current charges. Charge type, eligible events and sustained supply remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L916"
  },
  {
    "id": "charge-profusion-ii",
    "name": "Charge Profusion II",
    "effectId": "SupportChargeProfusionPlayerTwo",
    "family": "ChargeProfusion",
    "group": "chargeGeneration",
    "summary": "30% chance for an additional generated Charge plus a separate 15% chance for an extra random-type Charge; costs 20% more Mana. Not guaranteed two charges, generation from nothing or automatic sustain. Replaces I and respects caps.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L946"
  },
  {
    "id": "heightened-charges",
    "name": "Heightened Charges",
    "effectId": "SupportHeightenedChargesPlayer",
    "family": "Twofold",
    "group": "chargeConsumption",
    "summary": "20% chance for charge-consumption benefits to be doubled, with 15% higher Mana cost. Not twice the charge count, guaranteed double damage or a supplied consumption event. A charge and actual eligible consumption must exist; Inhibitor still wins.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2502"
  },
  {
    "id": "perfected-endurance",
    "name": "Perfected Endurance",
    "effectId": "SupportPerfectEndurancePlayer",
    "family": "PerfectedEndurance",
    "group": "perfectTiming",
    "summary": "Perfect-Timing hits grant at least one Endurance Charge, with 100% source chance. Does not supply Perfect Timing, hits, repeated charge events or cap bypass. Not a reward on ordinary uses; native link acceptance does not simulate timing.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3588"
  },
  {
    "id": "perpetual-charge",
    "name": "Perpetual Charge",
    "effectId": "SupportPerpetualChargePlayer",
    "family": "PerpetualCharge",
    "group": "chargeConsumption",
    "summary": "25% chance not to remove each consumed Power, Frenzy or Endurance Charge while retaining its consumption benefit. Costs 30% more Mana. Still needs available charges and eligible consumption; not unlimited uses, guaranteed refunds or a bypass of Inhibitor.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7277"
  },
  {
    "id": "harmonic-remnants-i",
    "name": "Harmonic Remnants I",
    "effectId": "SupportFleetingRemnantsPlayer",
    "family": "HarmonicRemnants",
    "group": "remnants",
    "summary": "35% increased collection range for this skill's Remnants. Not 35% more recovery, skill area or automatic collection. The correct Remnant must actually be created and collected; resource ownership and timing remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5222"
  },
  {
    "id": "harmonic-remnants-ii",
    "name": "Harmonic Remnants II",
    "effectId": "SupportFleetingRemnantsPlayerTwo",
    "family": "HarmonicRemnants",
    "group": "remnants",
    "summary": "35% increased Remnant collection range and a 20% chance to create an additional Remnant. Replaces I. Does not grant guaranteed double rewards, extra kills or automatic pickup; creation, collection and caps are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5252"
  },
  {
    "id": "remnant-potency-i",
    "name": "Remnant Potency I",
    "effectId": "SupportInterludePlayer",
    "family": "RemnantPower",
    "group": "remnants",
    "summary": "20% increased effect of this skill's Remnants, not direct skill damage or permanent player recovery. Requires actual creation, collection and an eligible recipient. Different Remnant resource types are not collapsed into Mana or Energy Shield.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6172"
  },
  {
    "id": "remnant-potency-ii",
    "name": "Remnant Potency II",
    "effectId": "SupportInterludePlayerTwo",
    "family": "RemnantPower",
    "group": "remnants",
    "summary": "30% increased Remnant effect, but its reward occurs four seconds after collection. Not instant recovery, faster creation or a four-second delay before pickup. No supply, collection or survival through the delay is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6202"
  },
  {
    "id": "remnant-potency-iii",
    "name": "Remnant Potency III",
    "effectId": "SupportInterludePlayerThree",
    "family": "RemnantPower",
    "group": "remnants",
    "summary": "40% increased Remnant effect with a three-second post-collection delay, replacing II's magnitude and delay. Not both tiers or immediate recovery. Actual creation, collection, recipients and survival still matter.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6233"
  },
  {
    "id": "selfless-remnants",
    "name": "Selfless Remnants",
    "effectId": "SupportSelflessRemnantsPlayer",
    "family": "SelflessRemnants",
    "group": "selfless",
    "summary": "Collected Remnants affect allies in your Presence instead of you. Does not grant the player their recovery, create allies or guarantee recipients in range. Grim Feast is excluded by source compatibility; optional Presence area is utility, not a recovery multiplier.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6597"
  },
  {
    "id": "catharsis",
    "name": "Catharsis",
    "effectId": "SupportCatharsisPlayer",
    "family": "Catharsis",
    "group": "catharsis",
    "summary": "Requires at least 20 Volatility to use the skill and detonates a random amount of existing Volatility. Does not generate it, provide guaranteed damage or remove another use condition. No added Mana multiplier; native damage output is not proof the skill is usable.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1699"
  },
  {
    "id": "upwelling-i",
    "name": "Upwelling I",
    "effectId": "SupportUpwellingPlayer",
    "family": "Upwellling",
    "group": "persistent",
    "summary": "While the Persistent Buff is active and the player is not on Full Mana, Minions deal 30% increased Damage. Adds 15 flat Spirit. The condition is player Mana, not Minion Mana; no automatic player damage or missing-Mana uptime is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8446"
  },
  {
    "id": "upwelling-ii",
    "name": "Upwelling II",
    "effectId": "SupportUpwellingPlayerTwo",
    "family": "Upwellling",
    "group": "persistent",
    "summary": "Minions deal 50% increased Damage while the buff is active and the player is missing Mana, with +30 flat Spirit. Not both tiers, more final damage or a player Spell bonus. Does not supply Minions, spend Mana automatically or guarantee uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8476"
  },
  {
    "id": "steadfast-i",
    "name": "Steadfast I",
    "effectId": "SupportSteadfastPlayer",
    "family": "Steadfast",
    "group": "channel",
    "summary": "50% more player Stun Threshold while Channelling the supported skill, with 10% higher Mana cost. Not outgoing Stun Buildup, flat Life or immunity. Native threshold coverage is incomplete; channel time, interruptions and incoming hits are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6955"
  },
  {
    "id": "steadfast-ii",
    "name": "Steadfast II",
    "effectId": "SupportSteadfastPlayerTwo",
    "family": "Steadfast",
    "group": "channel",
    "summary": "While Channelling, grants 50% more Stun Threshold and 100% more Ailment Threshold; costs 10% more Mana. Not immunity, outgoing ailments or permanent defence. Native threshold coverage is incomplete; generic Ailment Threshold is not duplicated into several scored effects.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6986"
  },
  {
    "id": "stoicism-i",
    "name": "Stoicism I",
    "effectId": "SupportStoicismPlayer",
    "family": "Stoicism",
    "group": "attack",
    "summary": "Damage ramps by 1% more per second to a 30% cap; Dodge Rolling or using a Travel skill resets it. Not maximum power immediately, Attack Speed or a recommendation to avoid necessary movement. No elapsed-state or survival uptime is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7018"
  },
  {
    "id": "stoicism-ii",
    "name": "Stoicism II",
    "effectId": "SupportStoicismPlayerTwo",
    "family": "Stoicism",
    "group": "attack",
    "summary": "Damage ramps by 2% more per second to the same 30% cap, resetting on Dodge Roll or Travel. Replaces I, reaches the cap sooner and does not raise it. No uninterrupted ramp or sustained full bonus is supplied.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7050"
  },
  {
    "id": "defy-i",
    "name": "Defy I",
    "effectId": "SupportDefyPlayer",
    "family": "Defy",
    "group": "attack",
    "summary": "Attack Hit damage is Lucky while Surrounded. Not lucky accuracy, critical chance or guaranteed enemy density. Lucky damage depends on the source range and is not a fixed multiplier on Poison or every skill component.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2428"
  },
  {
    "id": "defy-ii",
    "name": "Defy II",
    "effectId": "SupportDefyPlayerTwo",
    "family": "Defy",
    "group": "attack",
    "summary": "While Surrounded, Attack Hit damage is Lucky and insufficient Mana does not prevent use. Not global zero cost, Life-cost immunity or guaranteed sustain. Native displayed costs and actual usability remain separate; the surrounding condition must exist.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2457"
  },
  {
    "id": "vanguard-i",
    "name": "Vanguard I",
    "effectId": "SupportVanguardPlayer",
    "family": "Vanguard",
    "group": "shield",
    "summary": "Shield-skill Stuns grant two Guard per ten Strength, plus four more on Heavy Stun: six total per ten. Guard lasts four seconds and Mana cost rises 10%. Not mitigation uptime, Guard on every hit or a supplied Stun event.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7921"
  },
  {
    "id": "vanguard-ii",
    "name": "Vanguard II",
    "effectId": "SupportVanguardPlayerTwo",
    "family": "Vanguard",
    "group": "shield",
    "summary": "Shield Stuns grant two Guard per ten Strength plus six additional on Heavy Stun: eight total per ten. Four-second Guard; 10% higher Mana cost. Replaces I, not stacked Guard. Strength, actual Stuns, limits and repeated refresh are not simulated.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7953"
  },
  {
    "id": "thornskin-i",
    "name": "Thornskin I",
    "effectId": "SupportThornskinPlayer",
    "family": "Thornskin",
    "group": "persistent",
    "summary": "40% increased player Thorns Damage while the Persistent Buff is active, with +20 flat Spirit. Does not grant a Thorns source, retaliation or extra attacks. Thorns, player ownership and triggered child damage remain separate.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7439"
  },
  {
    "id": "thornskin-ii",
    "name": "Thornskin II",
    "effectId": "SupportThornskinPlayerTwo",
    "family": "Thornskin",
    "group": "persistent",
    "summary": "70% increased player Thorns Damage while active and +40 flat Spirit, replacing I. Not both buffs, a supplied retaliation or multiplied parent attack damage. Real Thorns sources and contacts are required; no sustained event rate is assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7474"
  },
  {
    "id": "strong-hearted",
    "name": "Strong Hearted",
    "effectId": "SupportStrongHeartedPlayer",
    "family": "StrongHearted",
    "group": "persistent",
    "summary": "50% less duration of Shock on the player while the Persistent Buff is active, adding 15 flat Spirit. Not reduced Shock magnitude, outgoing Shock duration or immunity. Optional generic incoming-duration protection does not represent the gem's numeric effect.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8237"
  },
  {
    "id": "tireless",
    "name": "Tireless",
    "effectId": "SupportTirelessPlayer",
    "family": "Tireless",
    "group": "warcry",
    "summary": "Empowered Attacks have a 25% chance not to reduce this Warcry's Empowerment count; costs 20% more Mana. Does not generate Empowerment, create free attacks or guarantee extra uses. Existing Glory, Rage, Power, form and Warcry requirements remain.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7509"
  },
  {
    "id": "durability",
    "name": "Durability",
    "effectId": "SupportDurabilityPlayer",
    "family": "Durability",
    "group": "object",
    "summary": "Objects survive two additional hits before expiry. Not more object Life, skill duration or guaranteed extra damaging contacts. Source has a 10% reservation multiplier where applicable, not +10 flat Spirit or a 10% Mana-cost multiplier. Only reviewed hit-count objects qualify.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1946"
  },
  {
    "id": "behead-i",
    "name": "Behead I",
    "effectId": "SupportBeheadPlayer",
    "family": "Behead",
    "group": "strike",
    "summary": "Strike kills of Rare monsters steal one modifier for 20 seconds. Does not supply a Rare kill, choose a modifier or promise a damage/defence increase. Minion kills, other rarity, stacking and sustained stolen-buff uptime are not assumed.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L796"
  },
  {
    "id": "behead-ii",
    "name": "Behead II",
    "effectId": "SupportBeheadPlayerTwo",
    "family": "Behead",
    "group": "strike",
    "summary": "Strike kills of Rares steal two modifiers for 20 seconds, replacing I. Not double damage, two kills or a 40-second buff. Actual kill ownership, available modifiers, their effects and uptime remain outside route scoring.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L826"
  },
  {
    "id": "thrill-of-the-kill",
    "name": "Thrill of the Kill",
    "effectId": "SupportThrillOfTheKillPlayer",
    "family": "ThrillOfTheKill",
    "group": "hit",
    "summary": "Culling a Shocked enemy with this skill grants all player Attacks 25% extra Lightning for eight seconds. Does not grant Cull or Shock; external Shock may qualify. The triggering Spell is not the Attack recipient, and Poison kills are not automatically Culls.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8343"
  },
  {
    "id": "thrill-of-the-kill-ii",
    "name": "Thrill of the Kill II",
    "effectId": "SupportThrillOfTheKillPlayerTwo",
    "family": "ThrillOfTheKill",
    "group": "hit",
    "summary": "An actual Cull of a Shocked enemy grants Attacks 25% extra Lightning for eight seconds; the buff also gives 40% increased Shock chance, not flat chance. Does not grant Cull, supply an eligible hit or assume boss thresholds, Shock or uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8375"
  },
  {
    "id": "commiserate",
    "name": "Commiserate",
    "effectId": "SupportCommiseratePlayer",
    "family": "Commiserate",
    "group": "hit",
    "summary": "Inflicting an ailment matching one currently on the player grants 40% more relevant ailment strength and removes that matching ailment from the player. Does not grant application, immunity or permanent magnitude. Prohibitions, source damage and transient self-ailment timing still matter.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1363"
  },
  {
    "id": "frozen-spite",
    "name": "Frozen Spite",
    "effectId": "SupportFrozenSpitePlayer",
    "family": "FrozenSpite",
    "group": "attack",
    "summary": "Supported Attack kills of Frozen enemies create separate Ice Fragments, whose delayed Cold explosion uses slain-enemy Life. Does not Freeze, supply kills, guarantee overlap or add parent damage. External Freeze may qualify; native child links are not proof of live inheritance or trigger uptime.",
    "sourceUrl": "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2313"
  }
] as const;

type Suggestion = SkillPreferencePreset["suggestions"][number];
type Override = {summary:string;priorities?:readonly Suggestion[]};
const suggestion=(id:Suggestion["id"],reason:string,weight=2):Suggestion=>({id,reason,weight});

function priorities(id:string):Suggestion[] {
  if(id==="ambrosia"||id==="ambrosia-ii")return [suggestion("flaskChargesGained","Optional refill support for the consumed Mana Flask pool, not flask capacity, supplied events or guaranteed damage.",1)];
  if(id.startsWith("cannibalism-"))return [suggestion("lifeRecoveryOnKill","Additional percentage-Life recovery per eligible player kill; no kill frequency or recovery per second is assumed.")];
  if(id.startsWith("herbalism-"))return [suggestion("lifeFlaskRecovery","Amount recovered from actual Life Flask uses, not charge generation, speed or guaranteed sustain.")];
  if(id.startsWith("precision-"))return [suggestion("accuracy","Optional player Attack Accuracy, not hit chance, Spell damage or Minion Accuracy.")];
  if(id==="selfless-remnants")return [suggestion("presenceArea","Eligible ally delivery area, not granting allies, self-recovery or a Remnant reward multiplier.")];
  if(id.startsWith("steadfast-"))return [suggestion("stunThreshold","Optional player incoming-Stun protection while using a reviewed channel; not outgoing Stun Buildup or permanent immunity.")];
  if(id.startsWith("vanguard-"))return [suggestion("stunBuildup","Own Stun events are needed for Guard; not incoming Stun Threshold, a Strength source or guaranteed Guard uptime.",1)];
  if(id==="strong-hearted")return [suggestion("ailmentDurationReduction","Optional incoming ailment-duration protection, not outgoing Shock, effect reduction or the support's actual magnitude.",1)];
  return [];
}

export const resourceSkillSupports:readonly ReviewedSkillSupport[]=reviews.map(review=>({
  id:review.id,name:review.name,effectId:review.effectId,family:review.family,skillIds:scopes[review.group],
  summary:review.summary,sourceUrl:review.sourceUrl,priorities:priorities(review.id),
}));

export function resourceSupportOverride(support:ReviewedSkillSupport,selected:readonly string[],focusId:string):Override|undefined {
  const has=(id:string)=>selected.includes(id),family=(prefix:string)=>selected.some(id=>id.startsWith(prefix));
  const messages:string[]=[];
  let changed=false,nextPriorities=support.priorities;
  const block=(message:string)=>{messages.push(message);nextPriorities=[];changed=true;};
  const brutality=family("brutality-");
  if(brutality&&(support.family==="Ambrosia"||support.id==="extraction"))
    block("Brutality prohibits this linked skill's gained Elemental/Chaos damage. Flask-charge drain, Life sacrifice and ordinary costs are separate and are not removed; no damage-source priority is added.");
  if(has("embitter")&&(support.family==="Ambrosia"||support.id==="extraction"))
    messages.push("Embitter redirects eligible gained damage to Cold, not base damage. It does not remove flask drain or Life sacrifice; Brutality still prohibits the redirected Element.");
  if(has("lifetap")&&(support.id==="extraction"||support.id==="lifetap"||support.id==="mana-flare"))
    messages.push("Lifetap converts the supported Mana cost to Life, not Extraction's separate Life sacrifice or Mana Flare's current-Mana consumption. These obligations remain separate; no free use or recovery sustain is assumed.");
  if(has("lifetap")&&support.id==="defy-ii")
    messages.push("Defy II's insufficient-Mana exception is not a Life-cost exemption. Lifetap's converted Life cost remains, including while Surrounded.");
  if(has("controlled-destruction")&&support.id==="mana-flare")
    block("Controlled Destruction prevents the parent from critically hitting, so it cannot trigger Mana Flare. A separately displayed child hit is not proof of a trigger or usable DPS.");
  if(brutality&&support.id==="mana-flare")
    messages.push("Reviewed native Mana Flare inherits Brutality and its Fire damage is disabled. Its Mana consumption is not converted to Life or assumed sustainable by that damage prohibition.");
  if(has("inhibitor")&&(["heightened-charges","perpetual-charge","abiding-hex","creeping-chill"].includes(support.id)||support.id==="inhibitor"))
    block("Inhibitor prevents charge/Infusion consumption. A stored charge does not supply a consumption event or its benefits, refunds or doubling; native link acceptance does not override this prohibition. Generation and manually chosen weights are not erased.");
  if(has("inhibitor")&&support.family==="ChargeProfusion")
    messages.push("Inhibitor stops consumption, not generation. Profusion still requires this skill's actual charge-generation event and available capacity; no event rate is supplied.");
  if(has("catharsis")&&(has("hit-and-run")||family("combo-finisher-"))
    &&(support.id==="catharsis"||support.id==="hit-and-run"||support.family==="ComboFinisher"))
    block("Catharsis conflicts with a selected use condition. Native PoB may retain only one applicable link; selections remain for review, not a valid combined loadout or a supplied Volatility/movement/Combo sequence.");
  if(has("excise")&&support.id==="catharsis")
    messages.push("The added cooldown and Volatility requirement are separate gates. Neither proves the skill can be used on cooldown or supplies Volatility.");
  if(family("pin-")&&(support.family==="PracticalMagic"||support.family==="Vanguard"))
    block("Pin prevents this skill from Stunning. An externally Stunned target does not supply this skill's own Stun/Heavy-Stun event, Spell-damage buff or Guard.");
  if((support.family==="Stoicism")&&["leap-slam","stampede","gathering-storm"].includes(focusId))
    messages.push("This reviewed focus is a Travel skill, so its use resets Stoicism's ramp. Do not assume the skill can sustain the capped bonus between its own uses.");
  if(has("selfless-remnants")&&["HarmonicRemnants","RemnantPower","SelflessRemnants"].includes(support.family))
    messages.push("These collected Remnants serve eligible allies in Presence instead of the player. Increased effect or delayed rewards do not become personal recovery; recipients and collection still need to exist.");
  if(support.family==="ThrillOfTheKill"&&(has("culling-strike-i")||has("culling-strike-ii")))
    messages.push("Culling support still needs an eligible hit and its enemy-rarity/Life threshold. The target must also be Shocked; a Poison kill or displayed damage is not proof of a Cull.");
  if(brutality&&support.family==="ThrillOfTheKill")
    messages.push("Brutality blocks the linked skill's gained Lightning damage. A successfully triggered global buff may serve another eligible Attack; its recipient, Cull event and uptime are not supplied.");
  if(support.id==="commiserate"&&(has("elemental-focus")||has("elemental-armament-iii")||has("electrocute")||has("immolate")||has("elemental-discharge")||has("bleed-iv")||has("haemocrystals")))
    messages.push("Selected ailment prohibitions still win. Having that ailment on the player cannot enable prohibited application or its matching cleanse; other eligible ailment types remain separate.");
  if(support.id==="frozen-spite"&&(has("elemental-focus")||has("elemental-armament-iii")||family("biting-frost-")))
    messages.push("This skill need not supply its own Freeze for a Frozen-target kill, but an external Freeze and eligible kill are still required. No fragments or boss uptime are guaranteed.");
  return messages.length||changed?{summary:messages.join(" "),...(changed?{priorities:nextPriorities}:{})}:undefined;
}

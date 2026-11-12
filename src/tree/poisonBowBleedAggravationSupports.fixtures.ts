// Independent frozen PoB 0.23.1 observations; configured states are not earned application events.
export const poisonBowBleedAggravationSupports = [
  { id: "rupture",name: "Rupture",effectId: "SupportRupturePlayer",family: "Rupture",catalogTier: 3,manaMultiplier: 0,line: 6419 },
  { id: "rusted-spikes",name: "Rusted Spikes (catalog review)",effectId: "SupportRustedSpikesPlayer",family: "RustedSpikes",catalogTier: 0,manaMultiplier: 10,line: 6447 },
] as const;
export const poisonBowBleedAggravationComponents = [
  { skill: "poisonburst-arrow",component: "arrow",actualHit: true,physical: true,hit: 5.38125,poison: 0,bleed: 4.4994588462054,mana: 38,spikesMana: 41 },
  { skill: "poisonburst-arrow",component: "no-hit burst source",actualHit: false,physical: false,hit: 5.38125,poison: 5.385766215481,bleed: 4.4994588462054,mana: 38,spikesMana: 41 },
  { skill: "gas-arrow",component: "arrow",actualHit: true,physical: true,hit: 1.8375,poison: 0,bleed: 1.4636793837054,mana: 62,spikesMana: 68 },
  { skill: "gas-arrow",component: "no-hit cloud source",actualHit: false,physical: false,hit: 4.33125,poison: 4.0038541776187,bleed: 3.6049881117188,mana: 62,spikesMana: 68 },
  { skill: "gas-arrow",component: "conditional Fire detonation",actualHit: true,physical: false,hit: 22.05,poison: 0,bleed: 0,mana: 62,spikesMana: 68 },
] as const;
export const poisonBowBleedAggravationStates = [
  { state: "none",heavy: false,pinned: false,aggravated: false,factor: 1 },
  { state: "Heavy Stunned",heavy: true,pinned: false,aggravated: false,factor: 1 },
  { state: "Pinned",heavy: false,pinned: true,aggravated: false,factor: 1 },
  { state: "both",heavy: true,pinned: true,aggravated: false,factor: 1 },
] as const;
export const poisonBowBleedAggravationControls = [
  { skill: "poisonburst-arrow",bleed: 4.4994588462054,aggravated: 8.9989176924107,moving: 8.9989176924107,both: 8.9989176924107,
    pin: .0083150914241566,heavyWithPin: 0,cannotPin: 0,stunIIIBleed: 2.1684139017857,stunIIICost: 50,efficiencyCost: 25 },
  { skill: "gas-arrow",bleed: 1.4636793837054,aggravated: 2.9273587674107,moving: 2.9273587674107,both: 2.9273587674107,
    pin: .0028392995106876,heavyWithPin: 0,cannotPin: 0,stunIIIBleed: .73183969185268,stunIIICost: 81,efficiencyCost: 41 },
] as const;

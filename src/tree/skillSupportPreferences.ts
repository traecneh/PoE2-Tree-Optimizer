import type { PassiveOptimizationSettings, PassivePreferenceId } from "./passivePreferences";
import { commonSkillSupports, commonSupportInteractionSummary } from "./commonSupportBatch";
import { deploymentSkillSupports, deploymentSupportInteractionSummary } from "./deploymentSupportBatch";
import { proxyDebuffSkillSupports, proxyDebuffSupportOverride } from "./proxyDebuffSupportBatch";
import { elementalSkillSupports, elementalSupportOverride } from "./elementalSupportBatch";
import { physicalSkillSupports, physicalSupportOverride } from "./physicalSupportBatch";
import { resourceSkillSupports, resourceSupportOverride } from "./resourceSupportBatch";
import { specialistSkillSupports, specialistSupportOverride } from "./specialistSupportBatch";
import { reviewedUtilityTriggerSupportIds, utilityTriggerSupportOverrides } from "./utilityTriggerSkillPreferencePresets";
import { reviewedResourceChargeSupportIds, resourceChargeSupportOverrides } from "./resourceChargeSkillPreferencePresets";
import { reviewedPersistentOffenceSupportIds, persistentOffenceSupportOverrides } from "./persistentOffenceSkillPreferencePresets";
import { reviewedDefensiveBuffSupportIds, defensiveBuffSupportOverrides } from "./defensiveBuffSkillPreferencePresets";
import { reviewedProxySupportIds, proxySupportOverrides } from "./proxySkillPreferencePresets";
import type { SkillPassiveStatScope, SkillPreferencePreset } from "./skillPreferencePresets";
import { reviewedMacePrimarySkillIds, maceSkillSupportOverrides } from "./maceSkillPreferencePresets";
import { reviewedQuarterstaffPrimarySkillIds, quarterstaffSkillSupportOverrides, fallingThunderProjectileSupportOverride } from "./quarterstaffSkillPreferencePresets";
import { reviewedBowPrimarySkillIds, reviewedAreaBowPrimarySkillIds, bowPrimarySupportOverrides } from "./bowPrimarySkillPreferencePresets";
import { reviewedSpearPrimarySkillIds, reviewedProjectileSpearPrimarySkillIds, spearPrimarySupportOverrides } from "./spearPrimarySkillPreferencePresets";
import { reviewedMonkPrimarySkillIds, reviewedDurationMonkPrimarySkillIds, monkPrimarySupportOverrides } from "./monkPrimarySkillPreferencePresets";
import { reviewedMaceShieldSkillIds, reviewedDurationMaceShieldSkillIds, reviewedProjectileMaceShieldSkillIds, maceShieldSupportOverrides } from "./maceShieldSkillPreferencePresets";
import { reviewedAttackClosureIds, reviewedAttackClosureSpeedIds, reviewedAttackClosureProjectileIds, reviewedAttackClosureDurationIds, attackClosureSupportOverrides } from "./attackClosureSkillPreferencePresets";
import { reviewedSpellUtilitySupportIds, spellUtilitySupportOverrides } from "./spellUtilitySkillPreferencePresets";

type Suggestion = SkillPreferencePreset["suggestions"][number];
export type ReviewedSkillSupport = {
  id: string;
  name: string;
  effectId: string;
  family: string;
  additionalFamilies?: readonly string[];
  skillIds: readonly string[];
  summary: string;
  priorities: readonly Suggestion[];
  exclusions?: SkillPreferencePreset["exclusions"];
  disabledPassiveStatScopes?: readonly SkillPassiveStatScope[];
  skillOverrides?: Readonly<Record<string, { summary: string; maladySummary?: string; exclusions?: SkillPreferencePreset["exclusions"]; priorities?: readonly Suggestion[] }>>;
  sourceUrl: string;
};

// This allowlist describes reviewed base-skill scopes, not all legal gem links.
// Support magnitudes are evidence for the explanation, never DPS score multipliers.
const reviewedCasterSkills = ["arc", "ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "eye-of-winter", "frost-bomb", "flameblast", "frost-wall"] as const;
const reviewedAreaCasterSkills = ["ball-lightning", "frostbolt", "ice-nova", "comet", "firestorm", "frost-bomb", "flameblast", "frost-wall"] as const;
const reviewedMovingCasterSkills = ["arc", "ball-lightning", "frostbolt", "ice-nova", "firestorm", "eye-of-winter", "frost-bomb", "flameblast", "frost-wall"] as const;
const reviewedChaosPhysicalSkills = ["contagion", "bonestorm", "bone-cage", "despair", "vulnerability", "hexblast", "unearth", "detonate-dead", "dark-effigy"] as const;
const reviewedPhysicalHitSkills = ["bonestorm", "bone-cage", "unearth", "detonate-dead"] as const;
const reviewedMinionHitSkills = ["skeletal-sniper", "skeletal-frost-mage", "skeletal-storm-mage", "skeletal-brute", "skeletal-reaver"] as const;
const reviewedMinionCasterSkills = ["skeletal-frost-mage", "skeletal-storm-mage", "skeletal-cleric"] as const;
const reviewedMarkUtilitySkills = ["snipers-mark", "bloodhounds-mark", "freezing-mark", "voltaic-mark"] as const;
const reviewedWarcryUtilitySkills = ["infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry", "ferocious-roar"] as const;
const reviewedDurationWarcries = ["infernal-cry", "ancestral-cry", "fortifying-cry"] as const;
const reviewedMovingWarcries = ["infernal-cry", "seismic-cry", "ancestral-cry", "fortifying-cry"] as const;
const reviewedCooldownWarcries = ["infernal-cry", "seismic-cry", "fortifying-cry", "ferocious-roar"] as const;
const reviewedPlantSkills = ["entangle", "briarpatch", "thrashing-vines", "toxic-domain"] as const;
const reviewedPlantBowSkills = ["vine-arrow", "toxic-growth"] as const;
const reviewedPoisonBowSkills = ["poisonburst-arrow", "gas-arrow"] as const;
const reviewedCostPlantSkills = ["entangle", "thrashing-vines", "toxic-domain"] as const;
const reviewedPlantCasterSkills = ["entangle", "thrashing-vines"] as const;
const brutalityExclusions: SkillPreferencePreset["exclusions"] = (["fireDamage", "coldDamage", "lightningDamage", "elementalDamage", "chaosDamage",
  "firePenetration", "coldPenetration", "lightningPenetration", "elementalPenetration"] as const).map((id) => ({
    id, reason: "Brutality prevents the supported skill from dealing Elemental or Chaos damage, so this preference does not benefit it. Your manual weight is retained and still affects routing; remove it if it serves no other skill.",
  }));

function plantAreaOverrides(amount: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% increased area, not radius or damage. `;
  return {
    entangle: { summary: prefix + "Widens fissure coverage and vine targeting, not attached-vine area damage or guaranteed contacts. Higher mana cost; no automatic priority change." },
    briarpatch: { summary: prefix + "Widens Thorny Ground coverage, not stored damage, movement contacts or creation speed. Native Spirit reservation stays unchanged; no automatic priority change." },
    "thrashing-vines": { summary: prefix + "Widens spawn/impact coverage, not guaranteed extra slams, overlap or Overgrowth. Higher mana cost; no automatic priority change." },
    "toxic-domain": { summary: prefix + "Widens Bloom and Pustule explosion coverage. Bloom remains non-damaging; stored Poison, growth and extra contacts are not assumed. Higher mana cost; no automatic priority change." },
    "vine-arrow": { summary: prefix + "Widens impact and vine targeting coverage, not intrinsic vine-DoT damage or guaranteed contacts. Supplied Poison and plant limits remain separate. Higher mana cost; priorities stay unchanged." },
    "toxic-growth": { summary: prefix + "Widens impact and explosion coverage, not hit damage, stored Poison or guaranteed overlap. Higher mana cost; the 15-second base detonation timer and outgoing Poison duration stay separate. Priorities stay unchanged." },
  };
}

function plantDurationOverrides(amount: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% more skill-effect duration, not damage per second. `;
  return {
    entangle: { summary: prefix + "Extends fissure uptime, not the 100 ms vine-application interval. Scaling of the separate one-second attached-vine timer is not verified. Higher mana cost; priorities stay unchanged." },
    briarpatch: { summary: prefix + "Extends Thorny Ground lifetime, not its creation delay, stored damage or movement contacts. Native Spirit reservation stays unchanged; priorities stay unchanged." },
    "thrashing-vines": { summary: prefix + "Native checks extend both the eight-second and five-second timers, not spawn rate, retarget cooldown or guaranteed contacts. Higher mana cost; priorities stay unchanged." },
    "toxic-domain": { summary: prefix + "Extends the eight-second Bloom. The separate 15-second base detonation timer and Poison-driven growth are not skill-effect duration. No duration preference is added to the explosion focus. Higher mana cost; priorities stay unchanged." },
    "vine-arrow": { summary: prefix + "Extends the eight-second plant lifetime, not intrinsic vine-DoT rate, attack speed or guaranteed contact time. Supplied Poison duration and storage are separate. Higher mana cost; priorities stay unchanged." },
  };
}

function plantEfficiencyOverrides(amount: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% less supported-skill cost, not Mana regeneration or maximum Mana. `;
  return {
    entangle: { summary: prefix + "Reduces the cast cost, not fissure upkeep, vine count or application speed. Whole-build sustain is not calculated; priorities stay unchanged." },
    "thrashing-vines": { summary: prefix + "Reduces the cast cost, not spawn rate, retarget speed or uptime. Whole-build sustain is not calculated; priorities stay unchanged." },
    "toxic-domain": { summary: prefix + "Reduces activation cost, not Bloom's increased costs for other skills. Poison supply, Pustule growth, detonation delay and cooldown stay separate. Whole-build sustain is not calculated; priorities stay unchanged." },
    "vine-arrow": { summary: prefix + "Reduces the bow deployment cost, not plant lifetime, intrinsic vine-DoT rate or the cost of supplying Poison with another skill. Whole-build sustain is not calculated; priorities stay unchanged." },
    "toxic-growth": { summary: prefix + "Reduces the bow firing cost, not Poison-supply costs, Pustule growth or the 15-second base detonation timer. Outgoing Poison remains separate. Whole-build sustain is not calculated; priorities stay unchanged." },
  };
}

function plantRapidCastingOverrides(amount: number, conditional = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = conditional
    ? `Conditional ${amount}% increased cast speed per different spell cast in the last eight seconds. Rotation and uptime are not assumed. `
    : `${amount}% increased cast speed, additive with other increased cast speed, not ${amount}% more. `;
  const cost = " Cost per cast is unchanged; faster use can increase Mana demand. No automatic priority or DPS adjustment.";
  return {
    entangle: { summary: prefix + "Speeds the cast action, not fissure travel or the fixed 100 ms vine-application interval. Extra contacts and vine ticks are not assumed." + cost },
    "thrashing-vines": { summary: prefix + "Speeds casting; spawn timing references 50% of cast time. The 500 ms minimum channel and retarget limits remain separate; contacts, overlap and total DPS are not modeled." + cost },
  };
}

function poisonBowAreaOverrides(amount: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% increased area, not radius or Poison magnitude. `;
  return {
    "poisonburst-arrow": { summary: prefix + "Widens burst coverage, not a new damaging hit or guaranteed contacts. The initial arrow must hit; linked Poison duration and external Poison feeding stay separate. Higher Mana cost; priorities stay unchanged." },
    "gas-arrow": { summary: prefix + "Widens cloud coverage, not Poison tick damage or guaranteed overlap. Cloud lifetime, outgoing Poison duration, area growth and conditional Fire detonation stay separate. Higher Mana cost; priorities stay unchanged." },
  };
}

function poisonBowDurationOverrides(amount: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% more skill-effect duration. `;
  return {
    "poisonburst-arrow": { summary: prefix + "Extends the burst's linked outgoing Poison duration, not Poison magnitude, tick speed or a real burst hit. Native roll-selection estimates are not a direct damage multiplier. External Poison feeding and uptime are not simulated. Higher Mana cost; priorities stay unchanged." },
    "gas-arrow": { summary: prefix + "Extends the four-second cloud lifetime, not its outgoing two-second Poison duration, magnitude or tick speed. Area growth, overlap, extra applications and conditional Fire detonation are not simulated. Higher Mana cost; priorities stay unchanged." },
  };
}

function poisonBowEfficiencyOverrides(amount: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% less supported-skill cost, not Mana regeneration or maximum Mana. `;
  return {
    "poisonburst-arrow": { summary: prefix + "Reduces arrow deployment cost, not outgoing Poison duration, magnitude or the cost of a separate Poison-feed skill. Whole-build sustain and application uptime are not calculated; priorities stay unchanged." },
    "gas-arrow": { summary: prefix + "Reduces bow firing cost, not cloud lifetime, outgoing Poison duration or the cost of a separate Detonator skill. Cloud overlap, Fire-explosion frequency and whole-build sustain are not calculated; priorities stay unchanged." },
  };
}

function poisonBowMovementOverrides(deliberation: boolean): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = deliberation
    ? "20% more damage; 30% more movement-speed penalty while firing, not 30% less global Movement Speed. Native PoB increases the derived Poison source, not Poison Magnitude. "
    : "25% less movement-speed penalty while firing, not global Movement Speed, Attack Speed or Poison-source damage. ";
  const suffix = " Cost per use and firing rate stay unchanged; actual movement, uptime and full DPS are not modeled. Priorities stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The initial arrow must hit; no new burst hit, faster Poison ticks or longer linked Poison duration is inferred." + suffix },
    "gas-arrow": { summary: prefix + "The cloud still poisons without hitting; outgoing Poison duration, cloud lifetime, growth and conditional Fire detonation stay separate." + suffix },
  };
}

function plantBowRapidAttacksOverrides(amount: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% increased attack speed, additive with other increases, not ${amount}% more. `;
  return {
    "vine-arrow": { summary: prefix + "Speeds bow deployment, not intrinsic vine-DoT rate, plant lifetime or supplied Poison. Cost per use stays unchanged; faster firing can increase Mana demand. Plant limits, contacts and full DPS are not modeled. Priorities stay unchanged." },
    "toxic-growth": { summary: prefix + "Speeds bow firing, not the 15-second base detonation timer or damage per hit. Outgoing Poison application remains separate from supplied Poison, growth and expiry speed. Cost per use stays unchanged; sustain and full DPS are not modeled. Priorities stay unchanged." },
  };
}

function plantBowProjectileOverrides(pierce: boolean): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "40% more projectile speed, not attack speed or a damage conversion. ";
  const pierceNote = pierce ? "Tier II adds 40% chance to Pierce, not guaranteed extra hits or plants. " : "";
  return {
    "vine-arrow": { summary: prefix + pierceNote + "Delivery utility is separate from vine targeting, intrinsic DoT and plant lifetime. Non-colliding rain delivery does not establish useful Pierce contacts. Higher mana cost; travel time, Poison supply and full DPS are not modeled. Priorities stay unchanged." },
    "toxic-growth": { summary: prefix + pierceNote + "Ground-targeted rain delivery is not guaranteed extra impacts or explosion overlap. The 15-second base detonation timer, outgoing Poison and supplied Poison stay separate. Higher mana cost; travel time, growth and full DPS are not modeled. Priorities stay unchanged." },
  };
}

function poisonBowRapidAttacksOverrides(amount: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% increased attack speed, additive with other increases, not ${amount}% more. `;
  const cost = " Cost per use stays unchanged; faster firing can increase Mana demand. Priorities stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Speeds arrow deployment, not Poison magnitude, tick speed or its linked duration. The arrow must hit; native roll-selection estimates do not guarantee stronger Poison or extra bursts. External Poison feeding and full DPS are not simulated." + cost },
    "gas-arrow": { summary: prefix + "Speeds bow firing, not Poison magnitude, tick speed, outgoing Poison duration or cloud lifetime. Cloud growth, overlap, limits and conditional Fire-explosion frequency are not simulated; native roll-selection estimates are not a direct damage bonus." + cost },
  };
}

function poisonBowProjectileOverrides(pierce: boolean): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "40% more projectile speed, not attack speed or a damage conversion. ";
  const pierceNote = pierce ? "Tier II adds 40% chance to Pierce, not guaranteed extra bursts, clouds or hits. " : "";
  return {
    "poisonburst-arrow": { summary: prefix + pierceNote + "Changes arrow delivery, not Poison magnitude, tick speed or linked duration. Initial hits and spreading contacts remain separate; no external Poison feeding or full DPS is inferred. Higher Mana cost; priorities stay unchanged." },
    "gas-arrow": { summary: prefix + pierceNote + "Ground-targeted delivery does not establish useful enemy Pierce contacts or extra clouds. Outgoing Poison duration, cloud lifetime, growth and conditional Fire detonation stay separate. Higher Mana cost; priorities stay unchanged." },
  };
}

function vineSwiftAfflictionOverride(lessDuration: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return { "vine-arrow": {
    summary: `30% more non-ailment DoT; ${lessDuration}% less skill-effect and damaging-ailment duration in the source data. Boosts intrinsic vine DoT, not impact hits or Poison. PoB's plant timer combines both duration penalties; exact game lifetime is unverified here. External Poison and contacts stay separate. Highest Skill Effect Duration is an opt-in uptime preference, not a net-DPS estimate.`,
    priorities: [{ id: "skillDuration", weight: 3, reason: `Swift Affliction shortens plant lifetime. Highest priority favors uptime and fewer replacements, not more DoT per second. The source states ${lessDuration}% less duration, but native PoB combines skill and ailment penalties; exact game lifetime is unverified.` }],
  } };
}

function poisonBowSwiftAfflictionOverrides(lessDuration: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `30% more non-ailment DoT, not Poison magnitude; ${lessDuration}% less skill-effect and damaging-ailment duration in the source. This Poison focus has no intrinsic non-ailment DoT to boost. `;
  const suffix = " Separate arrow-hit Poison/Bleeding needs eligible hits and chance; those ailment durations also shrink. No guaranteed contacts or uptime. Not a Poison-damage recommendation. Cost per use and existing priorities stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Native PoB combines both duration penalties for the linked burst Poison; exact game duration is unverified. The burst still poisons without hitting; no extra hit, magnitude or faster-tick benefit is inferred." + suffix, priorities: [] },
    "gas-arrow": { summary: prefix + "Native PoB combines both duration penalties for cloud lifetime, but outgoing Poison takes one ailment-duration penalty. Exact game cloud lifetime is unverified. The cloud still poisons without hitting; growth, overlap and conditional Fire detonation remain separate." + suffix, priorities: [] },
  };
}

function poisonBowDeadlyPoisonOverrides(poisonMore: number, hitLess: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${poisonMore}% more Poison magnitude; ${hitLess}% less damage with hits. Native PoB also reduces the derived Poison source, so this is not ${poisonMore}% more Poison DPS. `;
  return {
    "poisonburst-arrow": { summary: prefix + "The burst still poisons without hitting; initial-arrow hits lose damage. Poison duration, firing rate and cost per use stay unchanged. External Poison feeding and full DPS are not simulated; priorities stay unchanged." },
    "gas-arrow": { summary: prefix + "The cloud still poisons without hitting; arrow and conditional Fire-explosion hits lose damage. Cloud lifetime, outgoing Poison duration and cost per use stay unchanged. Growth, overlap and detonation frequency are not simulated; priorities stay unchanged." },
  };
}

function poisonBowConcentratedOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "30% more Area Damage; 50% less area, not 50% less radius. ";
  return {
    "poisonburst-arrow": {
      summary: prefix + "Native PoB boosts the burst's derived Poison source, not the initial arrow hit. The burst still poisons without hitting; smaller coverage does not guarantee contacts. Poison duration and cost per use stay unchanged. High Area of Effect is an opt-in coverage preference, not a DPS multiplier or calculated restoration of lost coverage.",
      priorities: [{ id: "areaOfEffect", weight: 2, reason: "Concentrated Area halves burst area. High priority favors coverage, not Poison magnitude, guaranteed applications or a calculated restoration of the lost area. Initial-arrow delivery and external Poison feeding remain separate." }],
    },
    "gas-arrow": {
      summary: prefix + "Native PoB boosts the cloud's derived Poison source and separate area-enabled hits. The cloud still poisons without hitting; overlap and detonation frequency are not assumed. Cloud lifetime, outgoing Poison duration and cost per use stay unchanged. High Area of Effect is an opt-in coverage preference, not a DPS multiplier or calculated restoration of lost coverage.",
      priorities: [{ id: "areaOfEffect", weight: 2, reason: "Concentrated Area halves cloud area. High priority favors coverage, not Poison magnitude, guaranteed overlap or a calculated restoration of lost area. Cloud growth and conditional Fire detonation remain separate." }],
    },
  };
}

function poisonBowEscalatingOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "One additional Poison stack; 20% less outgoing Poison duration, not more Poison Magnitude or faster ticks. Extra capacity does not guarantee sustained stacks or a damage gain. ";
  const suffix = " Native PoB models the no-hit Poison component; actual applications, uptime and full DPS are not simulated. Firing rate, hit damage and cost per use stay unchanged. Priorities stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Native base Poison duration falls from 3 to 2.4 seconds; Skill Effect Duration can still scale this linked Poison timer. The initial arrow must hit; no new burst hit or external Poison feeding is inferred." + suffix },
    "gas-arrow": { summary: prefix + "Native base Poison duration falls from 2 to 1.6 seconds, not the four-second cloud lifetime. Skill Effect Duration extends the cloud, not its outgoing Poison. The cloud still poisons without hitting; growth, overlap and conditional Fire detonation stay separate." + suffix },
  };
}

function poisonBowBurstingPlagueOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Plague accrues from supported Poison DPS, capped at 20% of that enemy's maximum Life. A separate player-owned Physical area hit triggers on that enemy's death, not an extra Poison-DPS bonus. ";
  const suffix = " PoB does not calculate Plague buildup or burst damage; kills, cap saturation and boss uptime are not assumed. Higher firing Mana cost; priorities stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The initial arrow must hit; linked Poison duration and external Poison feeding remain separate. The burst is not a Bow attack, Spell or minion skill." + suffix },
    "gas-arrow": { summary: prefix + "Cloud lifetime and outgoing Poison duration stay separate. Plague Burst is not Gas Arrow's conditional Fire explosion, a Bow attack, Spell or minion skill." + suffix },
  };
}

function poisonBowPoisonChanceOverrides(chance: number, bleedingBonus = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${chance}% chance to Poison on eligible hits, not ${chance}% increased chance or Poison magnitude. Inherent burst/cloud Poison does not need this chance. `;
  const conditional = bleedingBonus ? "20% more Poison magnitude only against Bleeding enemies; this support does not cause Bleeding. Bleeding and its uptime are not assumed. " : "";
  const suffix = " Higher Mana cost; no automatic priority or DPS adjustment.";
  const maladySummary = `Malady is selected: this support's ${chance}% base chance to Poison contributes to base Bleeding chance instead, not both. `
    + (bleedingBonus ? "Its 20% more Poison magnitude remains Poison-only and requires a Bleeding enemy; it is not swapped into Bleeding magnitude. " : "")
    + "Bleeding still needs a successful hit with eligible Physical damage; no-hit burst/cloud Poison cannot apply Bleeding. The reviewed PoB runtime does not calculate Malady's swap. Enemy conditions and uptime are not assumed." + suffix;
  return {
    "poisonburst-arrow": { summary: prefix + conditional + "The initial arrow still needs to hit; its separate on-hit Poison is outside this burst focus. Linked Poison duration, magnitude without Bleeding, firing rate and stack capacity stay unchanged." + suffix, maladySummary },
    "gas-arrow": { summary: prefix + conditional + "The cloud poisons without hitting. Separate arrow-hit Poison and the conditional Fire explosion are outside this focus; chance alone does not let Fire damage Poison. Cloud lifetime, outgoing Poison duration and stack capacity stay unchanged." + suffix, maladySummary },
  };
}

function poisonBowAdmixtureOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "20% more Poison magnitude against Bleeding enemies; 20% more Bleeding magnitude from supported hits against Poisoned enemies. Admixture itself adds neither ailment chance. ";
  const suffix = " PoB combines its Poison bonus with Poison III as a conditional 1.44 multiplier, not an unconditional route-score bonus. Enemy conditions and uptime are not assumed. Higher Mana cost; priorities stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Native PoB applies the Poison bonus to the no-hit burst; Bleeding needs eligible hits, not burst hits. The initial arrow still needs to connect; linked Poison duration and external Bleeding supply stay separate." + suffix },
    "gas-arrow": { summary: prefix + "Native PoB applies the Poison bonus to the no-hit cloud. Arrow-hit Bleeding needs a separate source of chance; the Fire explosion does not become eligible just by adding chance. Cloud lifetime and outgoing Poison duration stay separate." + suffix },
  };
}

function poisonBowBleedOverrides(chance: number, higherCost = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${chance}% chance to inflict Bleeding on eligible hits, not increased chance or Bleeding magnitude. The initial arrow must hit and deal eligible Physical damage. `;
  const suffix = " Bleeding may supply Poison III/Admixture's enemy condition, but contact and uptime are not assumed; Admixture's reverse bonus still needs Poisoned. PoB's synthetic source-hit Bleeding fields are not actual burst/cloud Bleeding. "
    + (higherCost ? "Higher Mana cost;" : "No added Mana cost multiplier;") + " priorities and route scores stay unchanged.";
  const maladySummary = `Malady is selected: this support's ${chance}% base chance to inflict Bleeding contributes to base Poison chance instead, not both. `
    + "This is on-hit application, not Poison magnitude, duration or a bonus to inherent burst/cloud Poison. A successful hit with eligible damage is still required; Fire-only explosion damage does not become eligible. The reviewed PoB runtime does not calculate Malady's swap. No Bleeding condition or uptime is supplied. "
    + (higherCost ? "Higher Mana cost;" : "No added Mana cost multiplier;") + " priorities and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The no-hit burst cannot inflict Bleeding. Arrow-hit Bleeding and the burst's linked Poison duration stay separate; inherent Poison is unchanged without explicit enemy conditions." + suffix, maladySummary },
    "gas-arrow": { summary: prefix + "The no-hit cloud cannot inflict Bleeding. Cloud lifetime and outgoing Poison duration stay separate; chance alone does not make Fire explosion damage eligible to Bleed." + suffix, maladySummary },
  };
}

function poisonBowCorrosionOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Supported Poison also Breaks Armour based on 80% of Poison damage, not 80% more Poison DPS or 80% of enemy Armour. Adds no Poison chance. Cannot support skills that Consume Fully Broken Armour. ";
  const suffix = " The reviewed PoB runtime does not calculate this support's Armour Break amount/timing; zero output is not zero game effect. No assumed Fully Broken Armour, Corrosion stacks or uptime. Higher Mana cost; priorities and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The parent is compatible through its arrow-hit skill; the no-hit burst remains separate. Its linked Poison duration is not Armour Break duration. Native synthetic hits are not real burst hits." + suffix },
    "gas-arrow": { summary: prefix + "The parent is compatible through its arrow-hit skill; the cloud still poisons without hitting. Cloud lifetime, outgoing Poison duration and Armour Break duration stay separate. The conditional Fire explosion does not gain Poison eligibility." + suffix },
  };
}

function poisonBowCompressedDurationOverrides(lessDuration: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${lessDuration}% less skill-effect duration, not faster Poison damage. No damage bonus or direct damaging-ailment-duration penalty. `;
  const suffix = " This is a duration trade-off, not a Poison-damage recommendation. Cost per use and existing priorities stay unchanged; no contacts, uptime or net-DPS gain is assumed.";
  return {
    "poisonburst-arrow": { summary: prefix + "Native PoB shortens the linked burst Poison. Separate arrow-hit Poison and Bleeding timers are unchanged; the burst remains no-hit. Displayed skill duration is tick-rounded, not the exact Poison timer." + suffix },
    "gas-arrow": { summary: prefix + "Native PoB shortens cloud lifetime, not the outgoing Poison timer. Separate arrow-hit Poison and Bleeding timers are unchanged. Faster growth or automatic Fire detonation is not assumed." + suffix },
  };
}

function poisonBowCullingOverrides(thresholdBuff = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Hits can Cull Rare/Unique enemies (base Life thresholds 10%/5%), not Normal/Magic enemies. Poison cannot Cull. ";
  const bonus = thresholdBuff ? "After Culling with supported skills, gain 20% increased threshold for 20 seconds: 12%/6% without other modifiers, not +20 percentage points. The reviewed PoB runtime does not calculate this conditional bonus. " : "";
  const suffix = " PoB's synthetic source-hit culling fields are not actual burst/cloud hits or more Poison DPS. No contact, threshold timing or buff uptime is assumed. No added Mana cost multiplier; priorities and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + bonus + "The initial arrow must hit; the no-hit burst and linked Poison cannot trigger culling." + suffix },
    "gas-arrow": { summary: prefix + bonus + "The initial arrow must hit; the no-hit cloud and its Poison cannot trigger culling. A separately triggered Fire explosion can hit, but ignition/detonation and contact are not supplied." + suffix },
  };
}

function poisonBowBlindOverrides(increasedEffect = 0): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "100% chance to Blind on eligible hits, not guaranteed contact or uptime. ";
  const effect = increasedEffect ? "20% increased Blind effect gives enemies 24% less Accuracy and Evasion without other effect modifiers, not 40% less. "
    : "Base Blind gives enemies 20% less Accuracy and Evasion. ";
  const suffix = " This affects enemy ratings, not player ratings or direct Poison damage. PoB's synthetic source-hit Blind fields and hit/crit-based Poison estimates are not real burst/cloud hits or a Poison multiplier. 10% higher Mana cost before rounding; no debuff uptime or sustain is assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + effect + "The initial arrow can Blind; the no-hit burst and linked Poison cannot apply Blind." + suffix },
    "gas-arrow": { summary: prefix + effect + "The initial arrow can Blind; the no-hit cloud and its Poison cannot apply Blind. A separately triggered Fire explosion can hit, but ignition/detonation and contact are not supplied." + suffix },
  };
}

function poisonBowBlindsideOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Cannot inflict Blind, even with Blind I/II; a different source must Blind the enemy first. Against Blinded enemies only: 15% more Critical Hit Chance and 15% more Critical Damage Bonus, not +15 percentage points or 15% more Poison damage. ";
  const suffix = " The reviewed PoB runtime does not enforce the Blind prohibition; its raw Blind-chance field is not usable application. Native source-hit/Poison crit estimates are not actual burst/cloud crits. 20% higher Mana cost before rounding; no contact, external Blind uptime or net DPS is assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The initial arrow can crit; the no-hit burst and linked Poison do not become critical hits." + suffix },
    "gas-arrow": { summary: prefix + "Arrow and separately triggered Fire-explosion crits are outside the no-hit cloud focus; ignition/detonation is not supplied." + suffix },
  };
}

function poisonBowBountyOverrides(moreCharges: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${moreCharges}% more Life Flask, Mana Flask and Charm charges from enemies killed by Hits of the supported skill (${1 + moreCharges / 100}x eligible reward), not flat charges or Poison damage. Poison damage-over-time kills are not hit kills. `;
  const suffix = " Separate reward channels, not three stacked multipliers or charges from every party/minion/other-skill kill. Not healing amount or charge generation per second. The reviewed PoB runtime does not calculate these on-kill rewards; unchanged native modifiers do not mean zero game effect. No added Mana cost multiplier; no kill rate, Flask/Charm uptime or boss sustain is assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The initial arrow must hit and kill; the no-hit burst and linked Poison do not supply that killing hit." + suffix },
    "gas-arrow": { summary: prefix + "An arrow or separately triggered Fire-explosion hit must kill; the no-hit cloud and its Poison do not supply that killing hit. Ignition/detonation is not supplied." + suffix },
  };
}

function poisonBowMaimOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "100% chance to Maim on eligible attack hits, not guaranteed contact or uptime. Maim gives enemies 30% reduced Movement Speed and 15% reduced Evasion, additive with increases/reductions, not less multipliers. ";
  const suffix = " Enemy movement/rating utility, not player Movement Speed/Evasion, an action-speed slow or direct Poison/Physical damage. The reviewed PoB runtime adds the support type but does not map its Maim-on-hit chance; enemy penalties require explicit Maim configuration. Native hit/crit-based Poison estimates are not real burst/cloud hits or a Poison multiplier. No added Mana cost multiplier; no debuff uptime, chase time or boss benefit is assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The initial arrow can Maim; the no-hit burst and linked Poison cannot apply Maim." + suffix },
    "gas-arrow": { summary: prefix + "The initial arrow can Maim; the no-hit cloud and its Poison cannot apply Maim. A separately triggered Fire explosion can hit, but ignition/detonation and contact are not supplied." + suffix },
  };
}

function poisonBowMaladyOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Catalog-only review: tier 0 in the frozen data; current availability is unverified. Swaps base on-hit Poison and Bleeding chance, rather than adding or copying both. Increased chance, damage types, magnitude, duration and stack capacity are not swapped. ";
  const suffix = " No-hit Poison does not become a Bleeding hit. Chance alone does not make Fire damage eligible. The reviewed PoB runtime does not calculate the swap; its unchanged chance fields are not game behavior. Poison III/Admixture bonuses still require their own enemy conditions, not assumed uptime or a self-sustaining loop. No added Mana cost multiplier; manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Initial-arrow ailments are separate from inherent burst Poison and its linked duration; synthetic 100% source chance is not an on-hit swap result." + suffix },
    "gas-arrow": { summary: prefix + "Initial-arrow ailments are separate from inherent cloud Poison; cloud lifetime and outgoing Poison duration stay separate. Ignition/detonation is not supplied." + suffix },
  };
}

function poisonBowHeftOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "30% more maximum Physical hit damage, not minimum damage or 30% more average/Poison damage. With the reviewed Physical Bow, native PoB raises the Physical Poison-source ceiling, not Poison magnitude. ";
  const suffix = " Native stronger-roll selection is a sustained-application estimate, not real burst/cloud hits or crits, guaranteed contacts or Full DPS. Added Chaos damage is not increased. Chance, magnitude, timers, stack capacity, area and attack speed stay separate. 20% higher Mana cost before rounding; Efficiency II offsets cost separately, not guaranteed sustain. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Initial-arrow hit damage and separately enabled on-hit Poison are outside the no-hit burst focus. Its linked Poison duration is unchanged." + suffix },
    "gas-arrow": { summary: prefix + "The cloud still poisons without hitting; cloud lifetime and outgoing Poison duration are unchanged. The reviewed fully converted Fire explosion is unchanged; ignition/detonation is not supplied." + suffix },
  };
}

function poisonBowLongshotOverrides(maxMore: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `Up to ${maxMore}% more Attack Damage at 7 metres and beyond, ramping from no bonus at 3.5 metres or closer. Native PoB scales the reviewed attack/Poison-source damage at the configured distance, not Poison magnitude. `;
  const suffix = " Distance is player-to-enemy separation, not projectile travel distance or cloud age. Distance-dependent Accuracy loss remains separate; Longshot adds no Accuracy. Native source estimates are not real burst/cloud hits or crits. Movement, Poison snapshotting and maximum-range uptime are not simulated. 20% higher Mana cost even at close range; Efficiency II offsets cost separately, not guaranteed sustain. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Initial-arrow hits and separately enabled on-hit Poison are outside the no-hit burst focus; linked Poison duration is unchanged." + suffix },
    "gas-arrow": { summary: prefix + "The cloud still poisons without hitting. Native conditional Fire-explosion damage also scales, but ignition/detonation is not supplied. Cloud lifetime and outgoing Poison duration are unchanged." + suffix },
  };
}

function poisonBowCloseCombatOverrides(maxMore: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `Up to ${maxMore}% more Attack Damage at 1 metre or closer, fading to no bonus at 3.5 metres and beyond. Native PoB scales the reviewed attack/Poison-source damage at the configured distance, not Poison magnitude. `;
  const suffix = " Distance is player-to-enemy separation, not projectile travel distance or cloud age. This is not melee-only, but adds no Accuracy or protection from nearby enemies. Native source estimates are not real burst/cloud hits or crits. Movement, Poison snapshotting and near-range uptime are not simulated. 20% higher Mana cost even outside the damage range; Efficiency II offsets cost separately, not guaranteed sustain. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Initial-arrow hits and separately enabled on-hit Poison are outside the no-hit burst focus; linked Poison duration is unchanged." + suffix },
    "gas-arrow": { summary: prefix + "The cloud still poisons without hitting. Native conditional Fire-explosion damage also scales, but ignition/detonation is not supplied. Cloud lifetime and outgoing Poison duration are unchanged." + suffix },
  };
}

function poisonBowExecuteOverrides(more: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${more}% more damage with Hits against enemies on Low Life. No damage bonus outside that enemy condition; your own Low Life does not activate Execute I/II. `;
  const suffix = " Native PoB also raises the attack-derived Poison-source estimate under that condition, not Poison magnitude or a second multiplier on Poison DPS. This does not establish real burst/cloud hits, snapshotting or low-life uptime. No Culling Strike or automatic execute threshold is granted. 10% higher Mana cost even outside Low Life; Efficiency II offsets cost separately, not guaranteed sustain. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The arrow hit is separate from the no-hit burst focus and any separately enabled on-hit Poison; application chance and Poison duration are unchanged." + suffix },
    "gas-arrow": { summary: prefix + "The arrow and conditional Fire-explosion hits are separate from the no-hit cloud. Ignition/detonation is not supplied; cloud lifetime and Poison duration are unchanged." + suffix },
  };
}

function poisonBowExecuteThreeOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "30% more damage with Hits against enemies on Low Life, and a separate 30% more while you are on Low Life. Neither condition: no bonus; either alone: 30% more; both: 1.3 x 1.3 = 1.69, or 69% more, not 60%. ";
  const suffix = " Native PoB also changes the attack-derived Poison-source estimate under the configured conditions, not Poison magnitude or a second multiplier on Poison DPS. Real burst/cloud hits, snapshotting and either condition's uptime are not established. Your Low Life is a requirement, not a defensive benefit or recommendation to lower Life. No Culling Strike is granted. One 10% higher Mana cost applies in all four states, not twice when both conditions hold; Efficiency II offsets cost separately, not guaranteed sustain. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The arrow hit is separate from the no-hit burst focus and any separately enabled on-hit Poison; application chance and Poison duration are unchanged." + suffix },
    "gas-arrow": { summary: prefix + "The arrow and conditional Fire-explosion hits are separate from the no-hit cloud. Ignition/detonation is not supplied; cloud lifetime and Poison duration are unchanged." + suffix },
  };
}

function poisonBowExploitWeaknessOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "40% more Damage against enemies with Fully Broken Armour in reviewed PoB. Partial Armour Break does not activate it. The supported skill cannot Break Armour, so the condition needs a separate source. ";
  const suffix = " Native PoB changes the attack-derived Poison-source estimate under that condition, not Poison magnitude or a second multiplier on Poison DPS. Synthetic source fields are not actual burst/cloud hits. No Armour Break amount, duration, consumption cycle or uptime is assumed. Corrosion cannot support the Exploit Weakness-modified skill. 30% higher Mana cost even without Fully Broken Armour; Efficiency II offsets cost separately, not guaranteed sustain. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The arrow hit is separate from the no-hit burst focus and any separately enabled on-hit Poison; Poison chance and duration are unchanged." + suffix },
    "gas-arrow": { summary: prefix + "The arrow and conditional Fire-explosion hits are separate from the no-hit cloud. Ignition/detonation is not supplied; cloud lifetime and Poison duration are unchanged." + suffix },
  };
}

function poisonBowChaosMasteryOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "+1 level to the supported Chaos skill, not a blanket Chaos Damage or Poison-magnitude multiplier. ";
  const suffix = " No separate Mana multiplier, but the higher-level skill can cost more Mana. Native damage changes depend on skill level, component and rounding; no fixed damage percentage is applied. Source estimates are not real burst/cloud hits or Full DPS. Poison chance, duration, magnitude and stacks stay unchanged in reviewed cases. No contacts or uptime are assumed; manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Reviewed level 20 -> 21: Mana 38 -> 41, with higher arrow/burst-source damage and increased burst radius. The arrow hit and separately enabled on-hit Poison remain distinct from the no-hit burst focus." + suffix },
    "gas-arrow": { summary: prefix + "Reviewed level 20 -> 21: Mana 62 -> 67. The whole skill levels up: arrow, cloud Poison source and conditional Fire-explosion damage can rise, not just Chaos damage. Cloud lifetime and radius are unchanged in reviewed cases; ignition/detonation is not supplied." + suffix },
  };
}

function poisonBowChaosAttunementOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Gain 25% of Damage as Extra Chaos Damage, with 50% less Physical, Fire, Cold and Lightning Damage. This is gained damage plus separate penalties, not conversion or 25% more Poison. ";
  const suffix = " In the reviewed Physical-bow fixture, Poison-source value falls despite higher arrow average hits; this is not a universal DPS recommendation. Native source fields are not real burst/cloud hits. Poison chance, magnitude, duration and stacks are unchanged in reviewed contexts. 20% higher Mana cost; Efficiency II and gem levels affect cost separately, not guaranteed sustain. Manual weights and route scores stay unchanged.";
  const exclusions: SkillPreferencePreset["exclusions"] = [{ id: "chaosDamage", reason: "Chaos Attunement supplies a gained Chaos portion. Chaos Damage can scale that portion in reviewed PoB, not the remaining Physical source or all Poison damage. Mixed-source composition, gear and mitigation are not fully evaluated; this retained manual priority is a partial heuristic, not a DPS ranking." }];
  return {
    "poisonburst-arrow": { summary: prefix + "The arrow hit and its separately enabled on-hit Poison remain distinct from the no-hit burst focus." + suffix, exclusions },
    "gas-arrow": { summary: prefix + "The cloud still poisons without hitting. The conditional explosion loses Fire damage but gains Chaos; a separate source of on-hit Poison chance can make that Chaos eligible for Poison. This support supplies neither Poison chance nor ignition/detonation." + suffix, exclusions },
  };
}

function poisonBowWitheringTouchOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "25% less Damage also reduces the reviewed Poison source; Wither is not a free damage bonus. ";
  const suffix = " Actual Chaos hit damage is required: 175% Wither chance per full enemy Ailment Threshold dealt as Chaos damage, with chance able to surpass 100% and four-second base Wither duration. This support adds no Chaos damage. Wither increases enemy Chaos damage taken, including Poison from Physical sources. PoB's can-Wither flag does not establish hit eligibility, application chance or uptime. Its explicit stack scenarios use 5% increased Chaos damage taken per stack, capped at ten; no stacks or uptime are assumed here. No added Mana cost multiplier; other links still affect cost. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The arrow needs a separate Chaos hit source, such as Chaos Attunement. The no-hit burst Poison cannot apply Wither on Hit; native source-hit fields are not real burst hits." + suffix },
    "gas-arrow": { summary: prefix + "The arrow or conditional explosion needs a separate Chaos hit source, such as Chaos Attunement. Fire-only explosions do not qualify. The no-hit cloud Poison cannot apply Wither on Hit; ignition/detonation is not supplied." + suffix },
  };
}

function poisonBowPierceOverrides(tier: 1 | 2 | 3): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = tier === 1 ? "Projectiles Pierce an enemy, with 20% less Projectile Damage after they have Pierced. No post-pierce penalty applies before a prior pierce. "
    : tier === 2 ? "Projectiles Pierce an enemy, without a damage penalty in reviewed data. Pierce is delivery, not a Poison damage bonus. "
    : "Projectiles Pierce all targets, with 20% less Damage for each enemy they Pierce. Prior-pierce count is conditional, not an unconditional damage penalty or Poison bonus. ";
  const penalty = tier === 2 ? "PoB's tested hit and Poison-source values stay unchanged. "
    : "PoB's configured post-pierce penalty also lowers its weapon-derived Poison-source estimate; this is not a second Poison penalty. Native source-hit fields are not real burst/cloud hits or proof of live-game source inheritance. ";
  const suffix = " No extra contacts, Poison applications or uptime are assumed. Poison chance, duration and maximum stacks are unchanged. No added Mana cost multiplier; other links still affect cost. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Arrow travel through enemies is separate from the no-hit Poison burst; extra burst contacts or overlaps are not inferred. " + penalty + suffix },
    "gas-arrow": { summary: prefix + "Arrow travel and ground placement are separate from the no-hit cloud and conditional Fire explosion. Pierce does not supply ignition/detonation or guarantee extra clouds. " + penalty + suffix },
  };
}

function poisonBowForkOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Projectiles can Fork once; 30% less Damage applies after Forking, not before it. Fork is delivery, not twice the Poison DPS. ";
  const suffix = " PoB's configured post-fork penalty lowers its weapon-derived Poison-source estimate once, not as a second Poison penalty. Native source-hit fields are not real burst/cloud hits or proof of live-game source inheritance. No extra contacts, Poison applications or uptime are assumed. Poison chance, duration and maximum stacks are unchanged. 10% higher Mana cost before rounding; Efficiency II and other links affect cost separately, not guaranteed sustain. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The arrow and its forked continuation are separate from the no-hit Poison burst. Extra bursts or overlaps are not inferred." + suffix },
    "gas-arrow": { summary: prefix + "Arrow delivery and ground placement are separate from the no-hit cloud and conditional Fire explosion. Terrain attachment is not modeled; extra clouds or ignition/detonation are not supplied." + suffix },
  };
}

function poisonBowChainOverrides(chains: number, lessHit: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `+${chains} Chain${chains === 1 ? "" : "s"}, with ${lessHit}% less Hit Damage. The hit penalty applies before any chain occurs, not only after chaining. `;
  const suffix = " Hit-only does not mean Poison is unaffected: the reviewed pre-mitigation Physical/Chaos source is reduced once, not again as a separate Poison penalty. Native source-hit fields are not real burst/cloud hits or proof of live-game source inheritance. Chain redirects to another target; the same enemy cannot be targeted twice in the same Chain. No repeat hits, extra contacts, Poison applications or uptime are assumed. Poison chance, duration and maximum stacks are unchanged. No added Mana cost multiplier; other supports still affect cost. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The actual arrow and separately enabled on-hit Poison remain distinct from the no-hit Poison burst; extra bursts and overlaps are not inferred." + suffix },
    "gas-arrow": { summary: prefix + "Arrow redirection and ground placement are separate from no-hit cloud Poison and the conditional Fire explosion. Extra clouds, ignition/detonation and terrain chaining are not supplied." + suffix },
  };
}

function poisonBowMultishotOverrides(lessDamage: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `+2 Projectiles, with ${lessDamage}% less Damage and 20% less Skill Speed. Projectile count is not hit count, extra Poison stacks or three times the DPS. `;
  const suffix = " The damage penalty reduces the eligible Poison source once. Slower firing changes PoB's repeated-application source-roll and critical-selection estimates, not Poison tick speed or duration. Those estimates assume repeated application, not guaranteed contacts or uptime. Native source-hit fields are not real burst/cloud hits. No extra hits, Poison stacks or cloud coverage are credited. Poison chance, duration and maximum stacks are unchanged. No added Mana cost multiplier; other links and actual use rate still matter for sustain. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The actual arrows and separately enabled on-hit Poison remain distinct from the no-hit Poison burst. Extra bursts or overlapping contacts are not inferred." + suffix },
    "gas-arrow": { summary: prefix + "Arrow delivery and ground placement remain separate from no-hit cloud Poison and the conditional Fire explosion. Extra cloud placements, overlaps, terrain attachment and ignition/detonation are not inferred." + suffix },
  };
}

function poisonBowNovaOverrides(tier: 1 | 2): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = tier === 1
    ? "Circular projectile delivery, with no added projectiles, damage penalty, cooldown or Mana multiplier. Can coexist with Multishot; its damage and speed penalties still apply. "
    : "+6 Projectiles in a circle, 50% less Damage and an eight-second base cooldown; no added Skill Speed penalty or Mana multiplier. Shares Nova Projectiles and Additional Projectiles families: selecting this replaces Nova I and Multishot, not stacks them. ";
  const suffix = " Circular delivery is not guaranteed extra contacts, overlapping Poison, stacks or uptime. Native source-hit fields are not real burst/cloud hits. "
    + (tier === 2 ? "The damage penalty reduces the eligible Poison source once. Cooldown recovery is separate from firing speed and Poison duration; PoB's repeated-application estimate is not measured coverage or sustainable uptime. " : "")
    + "Poison chance, duration and maximum stacks stay unchanged. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The actual arrows and separately enabled on-hit Poison remain distinct from the no-hit Poison burst. Extra bursts or overlapping contacts are not inferred." + suffix },
    "gas-arrow": { summary: prefix + "Arrow delivery and ground placement remain separate from no-hit cloud Poison and the conditional Fire explosion. Extra clouds, overlaps, ignition and detonation are not inferred." + suffix },
  };
}

function poisonBowRicochetOverrides(chance: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${chance}% chance for projectiles to Chain an additional time from terrain. Requires a terrain collision; suitable walls, targets and repeat hits are not supplied. This is not ordinary Chain count or Poison chance. `;
  const suffix = " PoB caps displayed terrain-chain chance at 100%; even 100% does not supply a collision or valid target. No extra contacts, Poison applications, stacks or uptime are credited. "
    + "No added damage/speed penalty, cooldown or Mana multiplier; other links retain their costs, penalties and collision rules. Poison duration and maximum stacks stay unchanged. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The actual arrow and separately enabled on-hit Poison remain distinct from the no-hit Poison burst. Ricochet does not turn the burst into a hit or guarantee another burst." + suffix },
    "gas-arrow": { summary: prefix + "Ground-targeted arrow delivery remains separate from no-hit cloud Poison and the conditional Fire explosion. Compatibility does not prove a terrain bounce creates another cloud, overlap or detonation." + suffix },
  };
}

function poisonBowSalvoOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Game data: gain a Seal each second, up to six; using the skill breaks Seals for +1 Projectile per Seal, fired in random directions. Actual Seals depend on waiting and use; maximum Seals and extra hits are not assumed. ";
  const suffix = " Reviewed PoB maps the Seal cap but not Salvo's interval, per-Seal projectiles or random delivery. Its zero Seal timer is missing modeling, not instant gain; the max-Seals toggle does not establish a damage bonus. "
    + "Requires self-used Projectile Attacks without an existing cooldown, Combo requirement or other Seals. Shares Seal and Additional Projectiles families: replaces Multishot and Nova II, but can coexist with Nova I. No added Mana multiplier, cooldown or damage/speed penalty. No extra Poison applications, stacks or uptime are credited. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Arrow delivery and separately enabled on-hit Poison stay separate from the no-hit burst; extra bursts or overlapping contacts are not inferred." + suffix },
    "gas-arrow": { summary: prefix + "Ground-targeted arrows, no-hit cloud Poison and the conditional Fire explosion remain separate; extra clouds, overlap, ignition or detonation are not inferred." + suffix },
  };
}

function poisonBowMomentumOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "40% more Damage only if you move 2 metres during the supported skill's use; teleportation does not count. General Moving, projectile travel or increased Movement Speed does not establish this condition. Uptime is not assumed. ";
  const suffix = " Native PoB increases the eligible pre-mitigation Poison source once, not again as a separate Poison multiplier. Source-hit fields are not real burst/cloud hits or proof of live-game source timing. "
    + "The 20% higher Mana cost before rounding applies even when the damage condition is inactive; other links and sustain still matter. Mobility and Deliberation do not automatically satisfy the distance condition. No extra hits, Poison applications, stacks or duration are credited. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The actual arrow and separately enabled on-hit Poison stay separate from the no-hit Poison burst." + suffix },
    "gas-arrow": { summary: prefix + "Arrow delivery, no-hit cloud Poison and the conditional Fire explosion remain separate; extra clouds, overlap and detonation are not inferred." + suffix },
  };
}

function gasArrowOverabundanceOverrides(lessDuration: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  return { "gas-arrow": { summary: `+1 to the cloud Limit (base six to seven), with ${lessDuration}% less skill-effect duration. The base four-second cloud becomes ${lessDuration === 50 ? "two" : "2.4"} seconds before other modifiers; its separate two-second Poison duration is unchanged. `
    + "A higher cloud cap is not current cloud count, extra Poison stacks or a damage multiplier. Shorter persistence can reduce coverage and growth opportunity; cloud placement, overlap, ignition and detonation are not simulated. "
    + "PoB's generic limit/charge fields do not simulate cloud occupancy or validate extra cooldown uses. Requires a skill with a Limit; Poisonburst Arrow is ineligible. No added Mana multiplier or damage/speed bonus. Manual weights and route scores stay unchanged." } };
}

function poisonBowSupercriticalOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "100% increased Critical Damage Bonus, with 20% less Critical Hit Chance. This increases the extra critical damage component, not total damage; the chance penalty is multiplicative (5% becomes 4%), not minus 20 percentage points. ";
  const suffix = " Native PoB's Poison estimate uses critical-weighted source damage and sustained-application assumptions. Source-hit fields are not real burst/cloud Hits or proof of live-game critical inheritance. A net benefit or critical uptime is not assumed, and this cannot restore prohibited critical hits. "
    + "No extra contacts, Poison applications, chance, magnitude, stacks or duration are credited. No added Mana multiplier. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Actual arrow hits and separately enabled on-hit Poison stay separate from the no-hit Poison burst." + suffix },
    "gas-arrow": { summary: prefix + "Actual arrow hits, separately enabled on-hit Poison, no-hit cloud Poison and the conditional Fire explosion remain separate; cloud uptime and detonation are not inferred." + suffix },
  };
}

function poisonBowInexorableOverrides(tier: 1 | 2): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = tier === 1
    ? "Gain 10% increased Critical Hit Chance each second, up to 100% after ten seconds. This is increased chance, not +100 percentage points or guaranteed critical hits. "
    : "Gain 40% increased Critical Hit Chance each second, up to 200% after five seconds, but also gain 10% less Critical Damage Bonus each second, up to 50% less. The penalty scales the extra critical damage component, not total damage; more buildup is not always better. ";
  const suffix = " Buildup resets whenever a skill supported by Inexorable Critical critically hits; Tier II's accumulated penalty resets too. Poison damage itself is not a critical Hit or a reset event. "
    + "PoB defaults to ten elapsed seconds, a configured snapshot rather than a simulated reset cycle. Maximum buildup and critical uptime are not assumed. Native source-hit fields are not real burst/cloud Hits or proof of live-game critical inheritance. "
    + "20% higher Mana cost before rounding applies even at zero buildup. No extra contacts, Poison applications, magnitude, stacks or duration are credited. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Actual arrow hits and separately enabled on-hit Poison stay separate from the no-hit Poison burst." + suffix },
    "gas-arrow": { summary: prefix + "Actual arrow hits, separately enabled on-hit Poison, no-hit cloud Poison and the conditional Fire explosion remain separate; cloud uptime and detonation are not inferred." + suffix },
  };
}

function poisonBowPinpointOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "60% more Critical Hit Chance (5% becomes 8%), with 30% less Critical Damage Bonus. The penalty affects the extra critical damage component, not total damage: a 2x critical multiplier becomes 1.7x. Chance is still capped; this cannot restore prohibited critical hits. ";
  const suffix = " With Supercritical, chance multipliers combine as 1.6 x 0.8; its increased critical bonus is separate. With capped Inexorable II, extra critical damage uses 0.7 x 0.5 = 0.35, not an additive 80% penalty. "
    + "Fixed elapsed-time comparisons do not simulate how changed crit chance affects Inexorable resets. Maximum buildup and critical uptime are not assumed. A better average hit need not improve native Poison estimates; source-hit fields are not real burst/cloud Hits or proof of live-game critical inheritance. "
    + "No extra contacts, Poison applications, magnitude, stacks or duration are credited. No added Mana multiplier; other supports still cost Mana. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Actual arrow hits and separately enabled on-hit Poison stay separate from the no-hit Poison burst." + suffix },
    "gas-arrow": { summary: prefix + "Actual arrow hits, separately enabled on-hit Poison, no-hit cloud Poison and the conditional Fire explosion remain separate; cloud uptime and detonation are not inferred." + suffix },
  };
}

function poisonBowAmbushOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "100% more Critical Hit Chance only against enemies on Full Life (5% becomes 10% before caps), not player Full Life or guaranteed critical hits. Opening hits may qualify while the target is still at Full Life; later hits must satisfy that condition again. ";
  const suffix = " Ongoing Poison is not a Hit and does not make new critical-hit rolls for this bonus. A damaging arrow does not establish Full Life for a later burst/cloud, and opener critical state is not assumed to carry into them. "
    + "PoB's enemy Full Life checkbox holds that condition fixed throughout the calculation; its source-hit fields are not real burst/cloud Hits or proof of live-game inheritance. Critical-support multipliers and caps still apply; fixed Inexorable buildup does not simulate resets. "
    + "No enemy Full Life or critical uptime, extra contacts, Poison applications, magnitude, stacks or duration are credited. No added Mana multiplier; other supports still cost Mana. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Actual arrow hits and separately enabled on-hit Poison stay separate from the no-hit Poison burst." + suffix },
    "gas-arrow": { summary: prefix + "Actual arrow hits, separately enabled on-hit Poison, no-hit cloud Poison and the conditional Fire explosion remain separate; cloud uptime and detonation are not inferred." + suffix },
  };
}

function poisonBowLifeLeechOverrides(percent: number, retains: boolean): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${percent}% of Physical Attack Damage Leeched as Life from actual arrow Hits, not total damage or instant Life on Hit. `;
  const retention = retains
    ? "Life Leeched by this supported skill is not removed at player Full Life: source-specific retention, not global leech retention, enemy Full Life or overhealing. The reviewed PoB runtime does not model this source-specific retention stat; equal Tier II/III recovery fields do not prove equal in-game behavior. "
    : "This tier does not grant retention of its leech at player Full Life. ";
  const suffix = " Poison is Chaos damage over time, not a Physical Attack Hit, and generates no recovery from this support. PoB's synthetic burst/cloud source-hit leech fields are not real healing. "
    + retention
    + "Recovery amount, delivery speed, duration and caps are separate; leech restrictions still apply. No sustained hits, recovery uptime, extra contacts or live leech-instance timeline are assumed. "
    + "No damage or Poison bonus. No added Mana multiplier; other supports still cost Mana. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The no-hit Poison burst is separate from the arrow." + suffix },
    "gas-arrow": { summary: prefix + "The no-hit cloud is separate; the reviewed conditional Fire explosion converts all its Physical damage to Fire and supplies no Physical-hit leech." + suffix },
  };
}

function poisonBowManaLeechOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "8% of Physical Attack Damage Leeched as Mana from actual arrow Hits, not total damage or instant Mana on Hit. ";
  const suffix = " Poison is Chaos damage over time, not a Physical Attack Hit, and generates no recovery from this support. PoB's synthetic burst/cloud source-hit leech fields are not real Mana recovery. "
    + "Recovery amount, delivery speed, duration and caps are separate; Cannot Leech Mana and Cannot Gain Mana still prevent recovery. No added Mana multiplier is not a refund: upfront Mana expenditure and later hit recovery remain separate, and other supports still cost Mana. "
    + "No guaranteed hits, recovery uptime, sustainable firing, extra contacts or damage/Poison bonus are assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The no-hit Poison burst is separate from the arrow." + suffix },
    "gas-arrow": { summary: prefix + "The no-hit cloud is separate; the reviewed conditional Fire explosion converts all its Physical damage to Fire and supplies no Physical-hit leech." + suffix },
  };
}

function poisonBowStunOverrides(moreBuildup: number, lessDamage: boolean): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${moreBuildup}% more Stun Buildup for actual Hits, not percentage points of Stun chance. `;
  const damage = lessDamage
    ? "50% less Damage is a broad penalty, not Hits-only: it also reduces the supported skill's weapon-derived Poison source. The 4x buildup multiplier is applied alongside reduced hit damage, not 4x the original total buildup. Native weapon rounding means final values need not be exactly halved; do not apply the damage penalty twice to an already-scaled Poison source. "
    : "No added damage penalty or Poison damage bonus. Increased buildup and More multipliers remain separate. ";
  const suffix = " Poison is damage over time, not a Hit, and supplies no Stun Buildup. PoB's synthetic burst/cloud source-hit buildup fields are not real stuns. "
    + damage
    + "20% higher Mana cost before rounding applies even when Heavy Stun cannot be inflicted; other support cost multipliers combine before rounding. Cannot Immobilise Enemies still prevents Heavy Stun. "
    + "Buildup is not Stun duration, guaranteed Heavy Stun or uptime. No extra contacts, threshold crossings, stun lock or Heavy-Stunned-enemy benefits are assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Actual arrow hits stay separate from the no-hit Poison burst." + suffix },
    "gas-arrow": { summary: prefix + "Actual arrow hits and the conditional Fire explosion stay separate from the no-hit cloud; detonation is not assumed." + suffix },
  };
}

function poisonBowPinOverrides(tier: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Physical damage from actual Hits can build Pin, but this supported skill cannot Stun. Generic Stun Buildup modifiers redirect to Pin instead, not a second Heavy Stun benefit. ";
  const extra = tier === 2
    ? "50% increased Critical Hit Chance only against Immobilised enemies (5% becomes 7.5% before caps), not 50 percentage points or a More multiplier. It adds to other increased chance and cannot restore prohibited critical hits. A configured immobilised target is a fixed snapshot, not proof this skill first Pins it or maintains that condition. "
    : tier === 3
      ? "60% less Pin Buildup (0.4x) trades against 30% more Pin duration, not more damage or guaranteed uptime. The reviewed PoB runtime does not map this duration stat or expose a Pin-duration result; no live duration in seconds is claimed. "
      : "No conditional critical-chance bonus or duration modifier is granted by this tier. ";
  const suffix = " Poison is damage over time, not a Physical Hit, and supplies no Pin Buildup. PoB's synthetic burst/cloud source-hit fields are not real Pin applications or proof of critical-state inheritance. "
    + extra
    + "Cannot Immobilise Enemies still prevents Pin. Linking Stun III keeps its damage penalty and higher Mana cost; redirected modifiers are counted once. No added Mana multiplier from Pin itself; other support costs remain. "
    + "No extra contacts, threshold crossings, guaranteed Pin or immobilisation uptime are assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Actual arrows remain separate from the no-hit Poison burst." + suffix },
    "gas-arrow": { summary: prefix + "The no-hit cloud is separate; the reviewed fully converted Fire explosion supplies no Physical Pin buildup, and detonation is not assumed." + suffix },
  };
}

function poisonBowDrainOverrides(resource: "Life" | "Mana"): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `Recover 12% of maximum ${resource} when this supported skill Culls an enemy. This is Cull-triggered recovery, not Leech, recovery on Hit or recovery on every kill. `;
  const coverage = resource === "Life"
    ? "Reviewed PoB maps Life Drain to a generic LifeOnKill field even when no Cull is possible; that displayed amount does not prove recovery from ordinary or Poison kills. "
    : "Reviewed PoB does not map Soul Drain's on-Cull recovery stat; zero ManaOnKill is not proof of zero effect in game. Upfront Mana expenditure remains separate from conditional recovery. ";
  const suffix = " Neither Drain grants Culling Strike: a separate eligible Cull source is required. With Culling Strike I/II, only Rare/Unique enemies qualify; thresholds and Tier II's unmodeled on-Cull threshold buff are not recovery frequency or amount. "
    + "Poison deaths, ordinary kills and Culls by another skill, party member or minion do not establish a Cull by this supported skill. Synthetic burst/cloud source-hit fields are not real Culls or recovery events. "
    + coverage
    + "Recovery is limited by missing resource and applicable recovery restrictions. No added Mana multiplier; other support costs and separate leech remain unchanged. No extra contacts, guaranteed kills, event frequency, boss sustain or recovery-per-second benefit is assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "An actual arrow hit can qualify; the no-hit Poison burst and its Poison cannot Cull." + suffix },
    "gas-arrow": { summary: prefix + "Actual arrow hits and a separately triggered Fire explosion can qualify; the no-hit cloud and its Poison cannot Cull. Detonation is not supplied." + suffix },
  };
}

function poisonBowArmourBreakOverrides(amount: number, chargeChance: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `Physical Hits Break Armour equal to ${amount}% of Physical damage dealt, not ${amount}% more damage or removal of ${amount}% of enemy Armour. `;
  const charges = chargeChance
    ? `${chargeChance}% chance to gain an Endurance Charge on Fully Breaking Armour with supported skills, not on every hit or partial break. A configured Fully Broken target is not proof this skill caused that event. The reviewed PoB runtime does not map this charge-event stat. `
    : "This tier grants no Endurance Charge chance. ";
  const suffix = " Poison is damage over time, not a Physical Hit; synthetic burst/cloud source-hit fields are not real hit-based Armour Break. " + charges
    + "Reviewed PoB sets a CanArmourBreak capability flag but does not calculate this percentage-based break amount; zero ArmourBreakPerHit is not zero effect in game. "
    + "Corrosion's separate 80%-of-Poison-damage Armour Break is not extra Poison DPS or a second copy of this hit-based effect. Corrosion does not grant arrow Poison chance, and its own Mana cost remains. "
    + "Exploit Weakness prevents this skill from Breaking Armour; this support cannot supply its own Fully Broken Armour condition or charge trigger. "
    + "No added Mana multiplier from Armour Break itself. No extra hits, break timing, below-zero Armour, Fully Broken Armour or Endurance Charge uptime is assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Actual arrow hits are separate from the no-hit Poison burst." + suffix },
    "gas-arrow": { summary: prefix + "Actual arrow hits are separate from the no-hit cloud; the reviewed fully converted Fire explosion has no Physical hit damage for this effect. Detonation is not supplied." + suffix },
  };
}

function poisonBowArmourDemolisherOverrides(amount: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% more Armour Break (${1+amount/100}x break strength), not more Hit damage, Poison DPS, or percentage points of enemy Armour removed. Does not grant an Armour Break source. `;
  const suffix = " Armour Break support uses eligible Physical Hits; Corrosion uses supported Poison damage as a separate source. Stronger Corrosion break does not multiply Poison damage again or supply arrow Poison chance. "
    + "Reviewed PoB stores an ArmourBreakEffect More modifier separately from ArmourBreakPerHit; percentage-based hit break and Corrosion break amounts remain uncalculated. Unchanged native break output is not zero effect in game. "
    + "Exploit Weakness prevents this skill from Breaking Armour; stronger break cannot bypass that prohibition or supply its own Fully Broken Armour condition. Corrosion remains ineligible with Exploit Weakness. "
    + "No added Mana multiplier from Demolisher itself; other support costs remain. No break timing, below-zero Armour, Fully Broken Armour, Endurance Charge uptime or damage bonus is assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Actual arrow hits are separate from the no-hit Poison burst; native synthetic source-hit fields are not extra applications." + suffix },
    "gas-arrow": { summary: prefix + "The no-hit cloud's supported Poison is separate from actual arrow hits. The reviewed fully converted Fire explosion supplies no Physical hit-based break; detonation is not supplied." + suffix },
  };
}

function poisonBowArmourExplosionOverrides(): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = "Triggers a separate player-owned Fire Area Attack only when this supported skill Fully Breaks an enemy's Armour. Partial break, an already Fully Broken target or another skill/minion's full break does not establish this supported-skill event. Does not grant a break source or more Poison DPS. ";
  const suffix = " The explosion uses its own attack scaling, not the parent's Poison DPS, and cannot Break Armour itself: no self-triggering break loop. Corrosion's Poison-based break is separate; qualifying event ownership and timing still need to be established. "
    + "Reviewed PoB does not map the full-break trigger linkage/chance. It exposes a child hit/DPS even without a qualifying event; displayed child DPS or attack rate is not verified trigger frequency or guaranteed extra damage. "
    + "Exploit Weakness prevents this parent skill from Breaking Armour, so it cannot supply its own explosion event. Corrosion remains ineligible with Exploit Weakness. "
    + "No added Mana multiplier; the child's zero Mana cost does not waive parent firing or other support costs. No extra hits, repeated full breaks, detonation chain, boss uptime or automatic Fire/Poison score bonus is assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "Actual arrow hits, the no-hit Poison burst and this granted Fire explosion remain separate; synthetic source-hit fields are not real burst hits." + suffix },
    "gas-arrow": { summary: prefix + "The no-hit Poison cloud, initial arrow and Gas Arrow's own conditional Fire detonation are separate from this granted explosion. Ignition/detonation is not supplied." + suffix },
  };
}

function poisonBowBleedAggravationOverrides(kind: "rupture" | "spikes"): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = kind === "rupture"
    ? "Supported hits Aggravate existing Bleeding when they Hit a Heavily Stunned enemy. Merely Stunned or Pinned is not the Heavy Stun requirement. "
    : "Catalog-only review: tier 0 in the frozen data; current availability is unverified. 100% chance to Aggravate existing Bleeding when this supported skill Pins an enemy, not 100% chance to inflict Pin or Bleeding. Hitting an already Pinned enemy or another source's Pin is not proof this skill caused a Pin event. ";
  const suffix = " Neither support supplies Bleeding chance, Heavy Stun or Pin. Aggravation affects Bleeding, not Poison; it does not establish Poison III/Admixture's enemy conditions or a self-sustaining ailment loop. "
    + "Reviewed PoB does not map either support's aggravation stat; unchanged Bleed output with Heavy Stun/Pinned flags is not zero effect in game. A manually aggravated Bleed is a separate control, not proof of a trigger. Moving and aggravated Bleeding share one existing damage factor in this model, not two stacking bonuses. "
    + (kind === "rupture" ? "No added Mana multiplier from Rupture;" : "10% higher Mana cost even without a qualifying Pin event; Cannot Immobilise Enemies still prevents that event;")
    + " other support costs remain. No extra contacts, aggravation frequency or Bleeding/Heavy Stun/Pin uptime is assumed. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The initial arrow can Hit; the no-hit Poison burst cannot Hit or supply a Pin event. Native synthetic source-hit Bleeding is not real burst Bleeding." + suffix },
    "gas-arrow": { summary: prefix + (kind === "rupture"
      ? "Initial arrows and a separately triggered Fire detonation can Hit an already Heavily Stunned target, but existing Bleeding and detonation are not supplied. The no-hit cloud cannot Hit."
      : "Initial-arrow Physical Pin is separate from the no-hit cloud; the reviewed fully converted Fire detonation supplies no Physical Pin buildup. Detonation is not supplied.") + suffix },
  };
}

function poisonBowDeepCutsOverrides(lessHit: number, moreBleed: number): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${lessHit}% less Damage with Hits; ${moreBleed}% more Bleeding magnitude, not Poison magnitude. Does not grant Bleeding chance: a separate source is required for eligible Physical arrow hits. `;
  const suffix = " Reviewed PoB also reduces the stored damage used for weapon-derived Poison, including the no-hit burst/cloud source. The Bleeding bonus does not compensate Poison; stage rounding means final damage is not simply multiplied by the displayed percentages. "
    + "Poison III can separately add arrow-hit Poison, but its enemy-Bleeding condition is not supplied or assumed. Deadly Poison's magnitude bonus is separate and both hit penalties still apply. "
    + "Synthetic source-hit Bleeding is not real burst/cloud Bleeding. Deep Cuts does not Aggravate Bleeding or supply Rupture's Heavy Stun/Rusted Spikes' Pin event. No extra hits, stacks or Bleeding/aggravation uptime is assumed. "
    + "No added Mana multiplier from Deep Cuts; other support costs remain. One Deep Cuts tier at a time. Manual weights and route scores stay unchanged.";
  return {
    "poisonburst-arrow": { summary: prefix + "The initial arrow hit and no-hit Poison burst remain separate." + suffix },
    "gas-arrow": { summary: prefix + "The arrow, no-hit Poison cloud and conditional Fire detonation remain separate. The reviewed fully converted Fire detonation has no Physical Bleeding source; detonation is not supplied." + suffix },
  };
}

function plantBrutalityOverrides(amount: number, ignoresReduction = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `${amount}% more Physical Damage; no Elemental or Chaos damage. `;
  const chance = ignoresReduction ? "Hits have a 20% chance to ignore Physical Damage Reduction, not unconditional penetration. " : "";
  const exclusions = [...brutalityExclusions, ...(["poisonChance", "poisonMagnitude", "poisonDuration"] as const).map((id) => ({ id,
    reason: "Brutality prevents this supported skill from dealing Poison damage because Poison deals Chaos damage. External Poison and other skills are separate. This manual weight is retained and still affects routing; remove it if unwanted.",
  }))];
  return {
    entangle: { summary: prefix + chance + "Applies to fissure/vine hits without inventing extra contacts or Overgrowth. Higher mana cost; conflicting manual weights are retained with warnings, not removed.", exclusions },
    briarpatch: { summary: prefix + chance + "Supports the conditional Thorny Ground hit, not the separate attack supplying stored damage. Native Spirit reservation stays unchanged. Storage, movement contacts and DPS remain unmodeled; conflicting manual weights are retained with warnings.", exclusions },
    "thrashing-vines": { summary: prefix + chance + "Applies to Physical slams, not guaranteed overlaps or Overgrowth. Higher mana cost; conflicting manual weights are retained with warnings, not removed.", exclusions },
    "toxic-domain": { summary: prefix + chance + "Legal for the attack explosion but prevents its Poison damage. External Poison supply, stored-Poison growth and total DPS are not modeled. This is not a recommendation for a Poison build. Higher mana cost; conflicting manual weights are retained with warnings.", exclusions },
  };
}

function poisonBowBrutalityOverrides(amount: number, ignoresReduction = false): NonNullable<ReviewedSkillSupport["skillOverrides"]> {
  const prefix = `Disables this focus's Poison damage. ${amount}% more Physical Damage, but no Chaos or Elemental damage. Legal support, not a recommendation for a Poison build. `;
  const suffix = " Physical arrow hits and their eligible Bleeding can benefit, but a separate Bleeding chance source is required. This is not more Bleeding magnitude, extra applications or aggravation. Synthetic source-hit/Bleed fields do not make the no-hit burst/cloud Hit or Bleed. "
    + (ignoresReduction ? "Tier III gives hits a 20% chance to ignore Physical Damage Reduction, not unconditional penetration, 20% more damage or a Bleeding bypass. " : "")
    + "Poison III, Deadly Poison, added Chaos and Poison magnitude cannot bypass the Chaos prohibition. External skills' Poison is separate. Deep Cuts' hit penalty and Bleeding magnitude remain separate. "
    + "20% higher Mana cost; other support costs still apply even when their damage is disabled. No extra contacts, Bleeding uptime or total DPS is assumed. Invalid suggestions are removed, not your manual weights. No automatic arrow-hit/Bleeding focus switch or score multiplier; manual weights remain and still affect routing.";
  const exclusions = [...brutalityExclusions,
    ...(["poisonChance", "poisonMagnitude", "poisonDuration"] as const).map(id => ({ id,
      reason: "Brutality prevents this supported skill's Poison damage because Poison deals Chaos damage. Inherent burst/cloud Poison and on-hit Poison cannot bypass it. External skills are separate. Your manual weight is retained and still affects routing; remove it if unwanted." })),
    ...(["attackDamage", "physicalDamage", "projectileDamage", "attackAreaDamage"] as const).map(id => ({ id,
      reason: "This suggestion targeted the selected Poison source, which Brutality disables. Separate Physical arrow hits/eligible Bleeding can benefit, but selecting Brutality does not switch this Poison focus to a hit/Bleeding build. Your manual weight is retained and still affects routing; remove it if unwanted." })),
  ];
  return {
    "poisonburst-arrow": { summary: prefix + "The initial Physical arrow remains separate from the no-hit Poison burst, whose Poison is disabled." + suffix,
      exclusions: [...exclusions, { id: "skillDuration", reason: "This focus's duration suggestion extended the burst's Poison, which Brutality disables. It does not become arrow-hit damage or Bleeding duration. Your manual weight is retained and still affects routing; remove it if unwanted." }] },
    "gas-arrow": { summary: prefix + "The no-hit cloud's Poison is disabled. The reviewed fully Physical-to-Fire converted detonation also deals no damage: blocking Fire does not restore Physical damage after conversion. Cloud lifetime/coverage is not damage, and detonation is not supplied." + suffix, exclusions },
  };
}
export const reviewedSkillSupports: readonly ReviewedSkillSupport[] = [
  ...commonSkillSupports,
  ...deploymentSkillSupports,
  ...proxyDebuffSkillSupports,
  ...elementalSkillSupports,
  ...physicalSkillSupports,
  ...resourceSkillSupports,
  ...specialistSkillSupports,
  {
    id: "magnified-area-i", name: "Magnified Area I", effectId: "SupportMagnifiedAreaPlayer", family: "IncreasedAreaOfEffect",
    skillIds: [...reviewedAreaCasterSkills, ...reviewedChaosPhysicalSkills, ...reviewedWarcryUtilitySkills, ...reviewedPlantSkills, ...reviewedPlantBowSkills, ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedAreaBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureIds, ...reviewedSpellUtilitySupportIds("area"), ...reviewedUtilityTriggerSupportIds("area"), ...reviewedProxySupportIds("area"), ...reviewedDefensiveBuffSupportIds("area"), ...reviewedPersistentOffenceSupportIds("area")], priorities: [],
    skillOverrides: { ...persistentOffenceSupportOverrides("area",35,false), ...defensiveBuffSupportOverrides("area",35,false), ...utilityTriggerSupportOverrides("area",35), ...proxySupportOverrides("area",35,false), ...spellUtilitySupportOverrides("area",35,false), ...plantAreaOverrides(35), ...poisonBowAreaOverrides(35), ...maceSkillSupportOverrides("area",35), ...quarterstaffSkillSupportOverrides("area",35), ...bowPrimarySupportOverrides("area",35), ...spearPrimarySupportOverrides("area",35), ...monkPrimarySupportOverrides("area",35), ...maceShieldSupportOverrides("area",35), ...attackClosureSupportOverrides("area",35) },
    summary: "35% increased area with higher mana cost for the reviewed area component, including Vile Effusion rather than Dark Effigy deployment. Not 35% more radius or damage; overlap, hit count and sustain are not calculated. Warcry coverage is not empowered-attack area or enemy Power. Existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6689",
  },
  {
    id: "magnified-area-ii", name: "Magnified Area II", effectId: "SupportMagnifiedAreaPlayerTwo", family: "IncreasedAreaOfEffect",
    skillIds: [...reviewedAreaCasterSkills, ...reviewedChaosPhysicalSkills, ...reviewedWarcryUtilitySkills, ...reviewedPlantSkills, ...reviewedPlantBowSkills, ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedAreaBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureIds, ...reviewedSpellUtilitySupportIds("area"), ...reviewedUtilityTriggerSupportIds("area"), ...reviewedProxySupportIds("area"), ...reviewedDefensiveBuffSupportIds("area"), ...reviewedPersistentOffenceSupportIds("area")], priorities: [],
    skillOverrides: { ...persistentOffenceSupportOverrides("area",45,false), ...defensiveBuffSupportOverrides("area",45,false), ...utilityTriggerSupportOverrides("area",45), ...proxySupportOverrides("area",45,false), ...spellUtilitySupportOverrides("area",45,false), ...plantAreaOverrides(45), ...poisonBowAreaOverrides(45), ...maceSkillSupportOverrides("area",45), ...quarterstaffSkillSupportOverrides("area",45), ...bowPrimarySupportOverrides("area",45), ...spearPrimarySupportOverrides("area",45), ...monkPrimarySupportOverrides("area",45), ...maceShieldSupportOverrides("area",45), ...attackClosureSupportOverrides("area",45) },
    summary: "45% increased area with higher mana cost for the reviewed area component, including Vile Effusion rather than Dark Effigy deployment. Not 45% more radius or damage; overlap, hit count and sustain are not calculated. Warcry coverage is not empowered-attack area or enemy Power. Existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6721",
  },
  {
    id: "prolonged-duration-i", name: "Prolonged Duration I", effectId: "ProlongedDurationSupportPlayer", family: "ProlongedDuration",
    skillIds: ["firestorm", "frost-wall", "contagion", "bone-cage", "despair", "vulnerability", "bone-offering", "pain-offering", ...reviewedMarkUtilitySkills, ...reviewedDurationWarcries, ...reviewedPlantSkills, "vine-arrow", ...reviewedPoisonBowSkills, ...reviewedDurationMonkPrimarySkillIds, ...reviewedDurationMaceShieldSkillIds, ...reviewedAttackClosureDurationIds, ...reviewedSpellUtilitySupportIds("duration"), ...reviewedUtilityTriggerSupportIds("duration"), ...reviewedProxySupportIds("duration"), ...reviewedDefensiveBuffSupportIds("duration"), ...reviewedPersistentOffenceSupportIds("duration"), ...reviewedResourceChargeSupportIds("duration")], priorities: [],
    skillOverrides: { ...resourceChargeSupportOverrides("duration",30), ...persistentOffenceSupportOverrides("duration",30,false), ...defensiveBuffSupportOverrides("duration",30,false), ...utilityTriggerSupportOverrides("duration",30), ...proxySupportOverrides("duration",30,false), ...spellUtilitySupportOverrides("duration",30,false), ...plantDurationOverrides(30), ...poisonBowDurationOverrides(30), ...monkPrimarySupportOverrides("duration",30), ...maceShieldSupportOverrides("duration",30), ...attackClosureSupportOverrides("duration",30) },
    summary: "30% more duration with higher mana cost for the reviewed debuff, ring, storm, wall, Offering, Mark or Warcry. Longer persistence is not higher damage per second, curse magnitude or faster activation; replacement limits and Offering-spike survival remain separate. Native Freezing/Voltaic Mark checks also lengthen the secondary buff, not its strength; consumption, re-marking and uptime are not simulated. Warcry timers do not guarantee empowerment, Guard strength or Glory. Existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5602",
  },
  {
    id: "prolonged-duration-ii", name: "Prolonged Duration II", effectId: "ProlongedDurationSupportPlayerTwo", family: "ProlongedDuration",
    skillIds: ["firestorm", "frost-wall", "contagion", "bone-cage", "despair", "vulnerability", "bone-offering", "pain-offering", ...reviewedMarkUtilitySkills, ...reviewedDurationWarcries, ...reviewedPlantSkills, "vine-arrow", ...reviewedPoisonBowSkills, ...reviewedDurationMonkPrimarySkillIds, ...reviewedDurationMaceShieldSkillIds, ...reviewedAttackClosureDurationIds, ...reviewedSpellUtilitySupportIds("duration"), ...reviewedUtilityTriggerSupportIds("duration"), ...reviewedProxySupportIds("duration"), ...reviewedDefensiveBuffSupportIds("duration"), ...reviewedPersistentOffenceSupportIds("duration"), ...reviewedResourceChargeSupportIds("duration")], priorities: [],
    skillOverrides: { ...resourceChargeSupportOverrides("duration",35), ...persistentOffenceSupportOverrides("duration",35,false), ...defensiveBuffSupportOverrides("duration",35,false), ...utilityTriggerSupportOverrides("duration",35), ...proxySupportOverrides("duration",35,false), ...spellUtilitySupportOverrides("duration",35,false), ...plantDurationOverrides(35), ...poisonBowDurationOverrides(35), ...monkPrimarySupportOverrides("duration",35), ...maceShieldSupportOverrides("duration",35), ...attackClosureSupportOverrides("duration",35) },
    summary: "35% more duration with higher mana cost for the reviewed debuff, ring, storm, wall, Offering, Mark or Warcry. Longer persistence is not higher damage per second, curse magnitude or faster activation; replacement limits and Offering-spike survival remain separate. Native Freezing/Voltaic Mark checks also lengthen the secondary buff, not its strength; consumption, re-marking and uptime are not simulated. Warcry timers do not guarantee empowerment, Guard strength or Glory. Existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5637",
  },
  {
    id: "efficiency-i", name: "Efficiency I", effectId: "SupportEfficiencyPlayer", family: "Efficiency",
    skillIds: [...reviewedCasterSkills, ...reviewedChaosPhysicalSkills, "bone-offering", "pain-offering", ...reviewedMarkUtilitySkills, ...reviewedWarcryUtilitySkills, ...reviewedCostPlantSkills, ...reviewedPlantBowSkills, ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureIds, ...reviewedSpellUtilitySupportIds("cost"), ...reviewedUtilityTriggerSupportIds("cost"), ...reviewedProxySupportIds("cost"), ...reviewedResourceChargeSupportIds("cost")], priorities: [],
    skillOverrides: { ...resourceChargeSupportOverrides("cost",30), ...utilityTriggerSupportOverrides("cost",30), ...proxySupportOverrides("cost",30,false), ...spellUtilitySupportOverrides("cost",30,false), ...plantEfficiencyOverrides(30), ...poisonBowEfficiencyOverrides(30), ...maceSkillSupportOverrides("cost",30), ...quarterstaffSkillSupportOverrides("cost",30), ...bowPrimarySupportOverrides("cost",30), ...spearPrimarySupportOverrides("cost",30), ...monkPrimarySupportOverrides("cost",30), ...maceShieldSupportOverrides("cost",30), ...attackClosureSupportOverrides("cost",30) },
    summary: "30% less supported-skill cost; cannot support Persistent skills. For Marks and reviewed Warcries this reduces application cost, not triggered damage or buff strength. This does not grant Mana regeneration, increase maximum Mana or remove cooldowns. Whole-build costs and sustain are not calculated; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2711",
  },
  {
    id: "efficiency-ii", name: "Efficiency II", effectId: "SupportEfficiencyPlayerTwo", family: "Efficiency",
    skillIds: [...reviewedCasterSkills, ...reviewedChaosPhysicalSkills, "bone-offering", "pain-offering", ...reviewedMarkUtilitySkills, ...reviewedWarcryUtilitySkills, ...reviewedCostPlantSkills, ...reviewedPlantBowSkills, ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureIds, ...reviewedSpellUtilitySupportIds("cost"), ...reviewedUtilityTriggerSupportIds("cost"), ...reviewedProxySupportIds("cost"), ...reviewedResourceChargeSupportIds("cost")], priorities: [],
    skillOverrides: { ...resourceChargeSupportOverrides("cost",40), ...utilityTriggerSupportOverrides("cost",40), ...proxySupportOverrides("cost",40,false), ...spellUtilitySupportOverrides("cost",40,false), ...plantEfficiencyOverrides(40), ...poisonBowEfficiencyOverrides(40), ...maceSkillSupportOverrides("cost",40), ...quarterstaffSkillSupportOverrides("cost",40), ...bowPrimarySupportOverrides("cost",40), ...spearPrimarySupportOverrides("cost",40), ...monkPrimarySupportOverrides("cost",40), ...maceShieldSupportOverrides("cost",40), ...attackClosureSupportOverrides("cost",40) },
    summary: "40% less supported-skill cost; cannot support Persistent skills. For Marks and reviewed Warcries this reduces application cost, not triggered damage or buff strength. This does not grant Mana regeneration, increase maximum Mana or remove cooldowns. Whole-build costs and sustain are not calculated; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2747",
  },
  {
    id: "mobility", name: "Mobility", effectId: "SupportMobilityPlayer", family: "Mobility",
    skillIds: [...reviewedMovingCasterSkills, ...reviewedChaosPhysicalSkills, "bone-offering", "pain-offering", ...reviewedMarkUtilitySkills, ...reviewedMovingWarcries, "entangle", "vine-arrow", ...reviewedPoisonBowSkills, ...reviewedSpellUtilitySupportIds("mobility"), ...reviewedUtilityTriggerSupportIds("mobility"), ...reviewedProxySupportIds("mobility"), ...reviewedDefensiveBuffSupportIds("mobility"), ...reviewedPersistentOffenceSupportIds("mobility"), ...reviewedResourceChargeSupportIds("mobility")], priorities: [],
    skillOverrides: { ...resourceChargeSupportOverrides("mobility",0), ...persistentOffenceSupportOverrides("mobility",0,false), ...defensiveBuffSupportOverrides("mobility",0,false), ...utilityTriggerSupportOverrides("mobility",0), ...proxySupportOverrides("mobility",0,false), ...spellUtilitySupportOverrides("mobility",0,false),
      ...poisonBowMovementOverrides(false),
      entangle: { summary: "25% less movement-speed penalty while using Entangle, not global Movement Speed or Cast Speed. Does not speed up fissure travel or the 100 ms vine-application interval. No damage or passive priority change is assumed." },
      "vine-arrow": { summary: "25% less movement-speed penalty while firing Vine Arrow, not global Movement Speed or Attack Speed. Plant lifetime, intrinsic vine-DoT rate and supplied Poison stay separate. Priorities stay unchanged." },
    },
    summary: "25% less movement-speed penalty while using the supported action, not global Movement Speed or damage. For Dark Effigy this affects deployment movement, not Vile Effusion firing. For Marks it affects player application movement, not the consuming hit or Blood Explosion. Warcry review covers base human-form use, not Ferocious Roar or socketed replacement. Comet is excluded natively. Actual speed and caps are not calculated; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3066",
  },
  {
    id: "projectile-acceleration-iii", name: "Projectile Acceleration III",
    effectId: "SupportProjectileAccelerationPlayerThree", family: "ProjectileSpeed",
    skillIds: ["spark", "fireball", "lightning-arrow", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear", "frostbolt"],
    summary: "Generic projectile-speed increases and reductions also apply to projectile damage. Spell-only conversion remains unverified. Suggests Highest projectile-speed priority for the reviewed hit focus, not a DPS estimate. Not yet offered for Bonestorm or Dark Effigy.",
    priorities: [{ id: "projectileSpeed", weight: 3, reason: "Projectile Acceleration III applies generic projectile-speed increases and reductions to projectile damage; spell-only conversion remains unverified. Highest priority is a heuristic, not a damage multiplier." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4326-L4362",
  },
  {
    id: "controlled-destruction", name: "Controlled Destruction",
    effectId: "SupportControlledDestructionPlayer", family: "ControlledDestruction",
    skillIds: ["spark", "fireball", ...reviewedCasterSkills, "bonestorm", "bone-cage", "hexblast", "unearth", "detonate-dead", ...reviewedPlantCasterSkills, ...reviewedSpellUtilitySupportIds("controlled"), ...reviewedDefensiveBuffSupportIds("controlled")],
    skillOverrides: { ...defensiveBuffSupportOverrides("controlled",0,false), ...spellUtilitySupportOverrides("controlled",0,false),
      entangle: { summary: "25% more spell-hit damage; supported fissure and vine hits cannot critically hit. Critical Hit Chance and Critical Damage Bonus do not benefit them. Vine-application timing, contacts and total DPS are not modeled. Manual critical priorities remain selected with warnings." },
      "thrashing-vines": { summary: "25% more spell-hit damage; supported vine slams cannot critically hit. Critical Hit Chance and Critical Damage Bonus do not benefit them. Extra slams, overlap and a net DPS gain are not assumed. Manual critical priorities remain selected with warnings." },
    },
    summary: "Boosts spell-hit damage but prevents critical hits. Critical Hit Chance is outside this supported skill's focus; any manual critical preference is kept for other skills.",
    priorities: [],
    disabledPassiveStatScopes: ["spellCriticalChance", "spellCriticalDamageBonus"],
    exclusions: [
      { id: "criticalChance", reason: "Controlled Destruction prevents this supported skill from critically hitting. This manual preference still affects routing and may serve another skill; remove it if unwanted." },
      { id: "criticalDamageBonus", reason: "The supported skill cannot critically hit, so its Critical Damage Bonus is inapplicable. Manual preferences are retained for other skills; this is not a whole-build damage calculation." },
    ],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2177-L2214",
  },
  {
    id: "ritualistic-curse", name: "Ritualistic Curse",
    effectId: "SupportRitualisticCursePlayer", family: "RitualisticCurse", skillIds: ["enfeeble", "despair", "vulnerability", ...reviewedSpellUtilitySupportIds("curse")],
    skillOverrides: spellUtilitySupportOverrides("curse",30,false),
    summary: "Adds curse area but makes activation take longer. Suggests High activation-speed priority to favor responsiveness; this is not extra curse magnitude.",
    priorities: [{ id: "curseActivation", weight: 2, reason: "Ritualistic Curse increases activation delay. High activation-speed priority favors responsiveness, without treating area or delay as curse magnitude." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7667-L7702",
  },
  {
    id: "focused-curse", name: "Focused Curse",
    effectId: "SupportFocusedCursePlayer", family: "FocussedCurse", skillIds: ["enfeeble", "despair", "vulnerability", ...reviewedSpellUtilitySupportIds("curse")],
    skillOverrides: spellUtilitySupportOverrides("curse",50,false),
    summary: "Halves the curse's activation delay, not its cast time. Activation speed still helps; no automatic priority change or instant-curse assumption is made.",
    priorities: [],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4908-L4944",
  },
  {
    id: "swift-affliction-i", name: "Swift Affliction I",
    effectId: "SupportSwiftAfflictionPlayer", family: "SwiftAffliction", skillIds: ["essence-drain", "contagion", "vine-arrow", ...reviewedPoisonBowSkills],
    skillOverrides: { ...vineSwiftAfflictionOverride(20), ...poisonBowSwiftAfflictionOverrides(20) },
    summary: "More non-ailment damage over time, with 20% less duration. Suggests Highest duration priority for debuff uptime, not damage per second.",
    priorities: [{ id: "skillDuration", weight: 3, reason: "Swift Affliction I shortens duration by 20%. Highest duration priority favors debuff uptime and fewer refreshes, not higher damage per second." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5403-L5438",
  },
  {
    id: "swift-affliction-ii", name: "Swift Affliction II",
    effectId: "SupportSwiftAfflictionPlayerTwo", family: "SwiftAffliction", skillIds: ["essence-drain", "contagion", "vine-arrow", ...reviewedPoisonBowSkills],
    skillOverrides: { ...vineSwiftAfflictionOverride(10), ...poisonBowSwiftAfflictionOverrides(10) },
    summary: "More non-ailment damage over time, with 10% less duration. Suggests Highest duration priority for debuff uptime, not damage per second.",
    priorities: [{ id: "skillDuration", weight: 3, reason: "Swift Affliction II shortens duration by 10%. Highest duration priority favors debuff uptime and fewer refreshes, not higher damage per second." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5439-L5474",
  },
  {
    id: "feeding-frenzy-i", name: "Feeding Frenzy I",
    effectId: "SupportFeedingFrenzyPlayer", family: "FeedingFrenzy", skillIds: ["skeletal-arsonist", ...reviewedMinionHitSkills, ...reviewedProxySupportIds("feeding"), ...reviewedPersistentOffenceSupportIds("feeding")],
    skillOverrides: { ...proxySupportOverrides("feeding",20,false), ...persistentOffenceSupportOverrides("feeding",20,false) },
    summary: "Minions deal more damage but take 20% more damage. Suggests High minion-Life priority for survival; player Life does not protect the minion.",
    priorities: [{ id: "minionLife", weight: 2, reason: "Feeding Frenzy I makes these minions take 20% more damage. High minion-Life priority favors survival; it is not player Life or a complete survivability calculation." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4698-L4737",
  },
  {
    id: "feeding-frenzy-ii", name: "Feeding Frenzy II",
    effectId: "SupportFeedingFrenzyPlayerTwo", family: "FeedingFrenzy", skillIds: ["skeletal-arsonist", ...reviewedMinionHitSkills, ...reviewedProxySupportIds("feeding"), ...reviewedPersistentOffenceSupportIds("feeding")],
    skillOverrides: { ...proxySupportOverrides("feeding",15,false), ...persistentOffenceSupportOverrides("feeding",15,false) },
    summary: "Minions deal more damage but take 15% more damage. Suggests High minion-Life priority for survival; player Life does not protect the minion.",
    priorities: [{ id: "minionLife", weight: 2, reason: "Feeding Frenzy II makes these minions take 15% more damage. High minion-Life priority favors survival; it is not player Life or a complete survivability calculation." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4738-L4776",
  },
  {
    id: "heavy-swing", name: "Heavy Swing",
    effectId: "SupportMeleePhysicalDamagePlayer", family: "HeavySwing", skillIds: ["boneshatter", "rolling-slam"],
    summary: "More melee physical damage with 10% less attack speed. Suggests High attack-speed priority for responsiveness; it does not calculate stun cadence or the slam's fixed added time.",
    priorities: [{ id: "attackSpeed", weight: 2, reason: "Heavy Swing lowers attack speed by 10%. High attack-speed priority favors responsiveness, without estimating whole-sequence DPS, stun priming or fixed added attack time." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4187-L4226",
  },
  {
    id: "rapid-attacks-i", name: "Rapid Attacks I",
    effectId: "SupportRapidAttacksPlayer", family: "RapidAttacks", skillIds: ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear", ...reviewedPlantBowSkills, ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureSpeedIds, ...reviewedProxySupportIds("rapid"), ...reviewedPersistentOffenceSupportIds("speed")],
    skillOverrides: { ...persistentOffenceSupportOverrides("speed",15,false), ...proxySupportOverrides("rapid",15,false), ...plantBowRapidAttacksOverrides(15), ...poisonBowRapidAttacksOverrides(15), ...maceSkillSupportOverrides("speed",15), ...quarterstaffSkillSupportOverrides("speed",15), ...bowPrimarySupportOverrides("speed",15), ...spearPrimarySupportOverrides("speed",15), ...monkPrimarySupportOverrides("speed",15), ...maceShieldSupportOverrides("speed",15), ...attackClosureSupportOverrides("speed",15) },
    summary: "Adds 15% increased attack speed to the supported attack. No automatic priority change: combo timing, fixed added attack time, mana sustain and total DPS are not calculated.",
    priorities: [],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4613-L4643",
  },
  {
    id: "rapid-attacks-ii", name: "Rapid Attacks II",
    effectId: "SupportRapidAttacksPlayerTwo", family: "RapidAttacks", skillIds: ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "ice-shot", "rain-of-arrows", "lightning-spear", "explosive-spear", ...reviewedPlantBowSkills, ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureSpeedIds, ...reviewedProxySupportIds("rapid"), ...reviewedPersistentOffenceSupportIds("speed")],
    skillOverrides: { ...persistentOffenceSupportOverrides("speed",25,false), ...proxySupportOverrides("rapid",25,false), ...plantBowRapidAttacksOverrides(25), ...poisonBowRapidAttacksOverrides(25), ...maceSkillSupportOverrides("speed",25), ...quarterstaffSkillSupportOverrides("speed",25), ...bowPrimarySupportOverrides("speed",25), ...spearPrimarySupportOverrides("speed",25), ...monkPrimarySupportOverrides("speed",25), ...maceShieldSupportOverrides("speed",25), ...attackClosureSupportOverrides("speed",25) },
    summary: "Adds 25% increased attack speed to the supported attack. No automatic priority change: combo timing, fixed added attack time, mana sustain and total DPS are not calculated.",
    priorities: [],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4644-L4673",
  },
  {
    id: "concentrated-area", name: "Concentrated Area",
    effectId: "SupportConcentratedAreaPlayer", family: "ConcentratedEffect", skillIds: ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", "rain-of-arrows", "explosive-spear", "toxic-growth", ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedAreaBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureIds, ...reviewedSpellUtilitySupportIds("concentrated"), ...reviewedUtilityTriggerSupportIds("concentrated"), ...reviewedProxySupportIds("concentrated"), ...reviewedDefensiveBuffSupportIds("concentrated"), ...reviewedPersistentOffenceSupportIds("concentrated")],
    skillOverrides: { ...persistentOffenceSupportOverrides("concentrated",30,false), ...defensiveBuffSupportOverrides("concentrated",30,false), ...utilityTriggerSupportOverrides("concentrated",30), ...proxySupportOverrides("concentrated",30,false), ...spellUtilitySupportOverrides("concentrated",0,false), ...poisonBowConcentratedOverrides(), ...maceSkillSupportOverrides("concentrated",30), ...quarterstaffSkillSupportOverrides("concentrated",30), ...bowPrimarySupportOverrides("concentrated",30), ...spearPrimarySupportOverrides("concentrated",30), ...monkPrimarySupportOverrides("concentrated",30), ...maceShieldSupportOverrides("concentrated",30), ...attackClosureSupportOverrides("concentrated",30), "toxic-growth": {
      summary: "30% more Area Damage, 50% less area, not 50% less radius. Applies to impact/explosion hits; smaller coverage does not guarantee overlap or extra contacts. Native outgoing Poison is separate from supplied Poison, growth and the 15-second base detonation timer. High Area of Effect is an opt-in coverage preference, not a damage multiplier or full-DPS estimate.",
      priorities: [{ id: "areaOfEffect", weight: 2, reason: "Concentrated Area halves impact/explosion area. High priority favors coverage, not damage, guaranteed overlap or a calculated restoration of the lost area. Supplied Poison and detonation timing stay separate." }],
    } },
    summary: "Less area with more area damage. Suggests High area priority for coverage; the damage bonus only concerns area-enabled hits and is not multiplied into route scores.",
    priorities: [{ id: "areaOfEffect", weight: 2, reason: "Concentrated Area reduces area by 50%. High area priority favors coverage, not a direct damage increase, guaranteed rain overlap or a promise that every component gains area damage." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2070-L2108",
  },
  {
    id: "close-combat-i", name: "Close Combat I", effectId: "SupportCloseCombatPlayer", family: "CloseCombat",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowCloseCombatOverrides(20),
    summary: "Up to 20% more Attack Damage by nearby enemy distance, not permanent Poison magnitude or near-range uptime. 20% higher Mana cost outside the damage range; manual priorities unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1225",
  },
  {
    id: "close-combat-ii", name: "Close Combat II",
    effectId: "SupportCloseCombatPlayerTwo", family: "CloseCombat", skillIds: ["ice-strike", "tempest-flurry", "boneshatter", "rolling-slam", ...reviewedPoisonBowSkills],
    skillOverrides: poisonBowCloseCombatOverrides(30),
    summary: "Attack damage benefit depends on distance to the target. Proximity and uptime are not modeled, so this does not add unconditional passive damage or change priorities.",
    priorities: [],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1261-L1296",
  },
  {
    id: "fist-of-war-i", name: "Fist of War I",
    effectId: "FistOfWarSupportPlayer", family: "FistOfWar", skillIds: ["rolling-slam"],
    summary: "Periodically grants an Ancestral Boost to a self-used Slam. Boost timing and uptime are not modeled; no always-on damage, area or speed bonus is added to scores.",
    priorities: [],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3739-L3770",
  },
  {
    id: "projectile-acceleration-i", name: "Projectile Acceleration I", effectId: "SupportProjectileAccelerationPlayer", family: "ProjectileSpeed",
    skillIds: ["frostbolt", "bonestorm", ...reviewedPlantBowSkills, ...reviewedPoisonBowSkills, "falling-thunder", ...reviewedBowPrimarySkillIds, ...reviewedProjectileSpearPrimarySkillIds, ...reviewedProjectileMaceShieldSkillIds, ...reviewedAttackClosureProjectileIds, ...reviewedSpellUtilitySupportIds("projectile")], priorities: [],
    skillOverrides: { ...spellUtilitySupportOverrides("projectile",40,false), ...plantBowProjectileOverrides(false), ...poisonBowProjectileOverrides(false), ...fallingThunderProjectileSupportOverride(), ...bowPrimarySupportOverrides("projectile",40), ...spearPrimarySupportOverrides("projectile",40), ...maceShieldSupportOverrides("projectile",40), ...attackClosureSupportOverrides("projectile",40) },
    summary: "40% more projectile speed and increased mana cost. Delivery changes, not a direct passive damage bonus; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4254",
  },
  {
    id: "projectile-acceleration-ii", name: "Projectile Acceleration II", effectId: "SupportProjectileAccelerationPlayerTwo", family: "ProjectileSpeed",
    skillIds: ["frostbolt", "bonestorm", ...reviewedPlantBowSkills, ...reviewedPoisonBowSkills, "falling-thunder", ...reviewedBowPrimarySkillIds, ...reviewedProjectileSpearPrimarySkillIds, ...reviewedProjectileMaceShieldSkillIds, ...reviewedAttackClosureProjectileIds, ...reviewedSpellUtilitySupportIds("projectile")], priorities: [],
    skillOverrides: { ...spellUtilitySupportOverrides("projectile",40,true), ...plantBowProjectileOverrides(true), ...poisonBowProjectileOverrides(true), ...fallingThunderProjectileSupportOverride(true), ...bowPrimarySupportOverrides("projectile",40,true), ...spearPrimarySupportOverrides("projectile",40,true), ...maceShieldSupportOverrides("projectile",40,true), ...attackClosureSupportOverrides("projectile",40,true) },
    summary: "40% more projectile speed and 40% chance to Pierce, with increased mana cost. Frostbolt already pierces; Bonestorm delivery does not guarantee extra hits, explosion overlap or Impale benefits. No passive damage bonus is assumed.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4290",
  },
  {
    id: "considered-casting", name: "Considered Casting", effectId: "SupportConsideredCastingPlayer", family: "ConsideredCasting",
    skillIds: [...reviewedCasterSkills, "bonestorm", "bone-cage", "hexblast", "unearth", "detonate-dead", ...reviewedPlantCasterSkills, ...reviewedSpellUtilitySupportIds("considered")],
    skillOverrides: { ...spellUtilitySupportOverrides("considered",0,false),
      entangle: { summary: "35% more damage, 15% less cast speed and a 115% Mana-cost multiplier for base self-cast hits. Slows the cast action, not the fixed 100 ms vine-application interval. Fissure travel, contacts and full DPS remain unmodeled. High cast-speed priority is an opt-in responsiveness suggestion, not compensation calculated for the whole build." },
      "thrashing-vines": { summary: "35% more damage, 15% less cast speed and a 115% Mana-cost multiplier for base self-cast slams. Spawn timing references 50% of cast time; minimum channel time, retargeting, overlap and full DPS remain unmodeled. High cast-speed priority is an opt-in responsiveness suggestion, not guaranteed extra slams or a net DPS gain." },
    },
    summary: "Self-cast hit support with 35% more damage, 15% less cast speed and increased mana cost. Suggests High cast-speed priority for responsiveness, not a damage multiplier, channel-stage count or cooldown reduction. Non-hitting curses and DoT-only focuses are excluded.",
    priorities: [{ id: "castSpeed", weight: 2, reason: "Considered Casting lowers cast speed by 15%. High priority favors self-cast responsiveness; fixed timing, channels, cooldowns and resource sustain are not converted into DPS." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2138",
  },
  {
    id: "rapid-casting-i", name: "Rapid Casting I", effectId: "SupportRapidCastingPlayer", family: "RapidCasting",
    skillIds: [...reviewedCasterSkills, ...reviewedChaosPhysicalSkills, ...reviewedMinionCasterSkills, ...reviewedPlantCasterSkills, ...reviewedSpellUtilitySupportIds("rapid"), ...reviewedDefensiveBuffSupportIds("rapid")], priorities: [],
    skillOverrides: { ...defensiveBuffSupportOverrides("rapid",15,false), ...plantRapidCastingOverrides(15), ...spellUtilitySupportOverrides("rapid",15,false) },
    summary: "Adds 15% increased cast speed to the supported spell component. Skeletal casters use minion spells; Dark Effigy uses Vile Effusion rather than deployment. No automatic priority or DPS change: DoT ticks, curse activation, channel stages, healing magnitude and cooldowns remain separate.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7534",
  },
  {
    id: "rapid-casting-ii", name: "Rapid Casting II", effectId: "SupportRapidCastingPlayerTwo", family: "RapidCasting",
    skillIds: [...reviewedCasterSkills, ...reviewedChaosPhysicalSkills, ...reviewedMinionCasterSkills, ...reviewedPlantCasterSkills, ...reviewedSpellUtilitySupportIds("rapid"), ...reviewedDefensiveBuffSupportIds("rapid")], priorities: [],
    skillOverrides: { ...defensiveBuffSupportOverrides("rapid",20,false), ...plantRapidCastingOverrides(20), ...spellUtilitySupportOverrides("rapid",20,false) },
    summary: "Adds 20% increased cast speed to the supported spell component. Skeletal casters use minion spells; Dark Effigy uses Vile Effusion rather than deployment. No automatic priority or DPS change: DoT ticks, curse activation, channel stages, healing magnitude and cooldowns remain separate.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7565",
  },
  {
    id: "rapid-casting-iii", name: "Rapid Casting III", effectId: "SupportRapidCastingPlayerThree", family: "RapidCasting",
    skillIds: [...reviewedCasterSkills, ...reviewedChaosPhysicalSkills, ...reviewedPlantCasterSkills, ...reviewedSpellUtilitySupportIds("rapid")], priorities: [],
    skillOverrides: { ...plantRapidCastingOverrides(10, true), ...spellUtilitySupportOverrides("rapid",10,true) },
    summary: "Conditional cast speed per different spell cast in the last eight seconds. Rotation and uptime are not modeled; no always-on speed, passive reward or automatic priority is added. For Dark Effigy, only Vile Effusion is eligible, not deployment.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7596",
  },
  {
    id: "spell-echo", name: "Spell Echo", effectId: "SupportSpellEchoPlayer", family: "SpellEcho",
    skillIds: ["ice-nova", "comet", "firestorm", "frost-bomb", "frost-wall", "bone-cage", "despair", "vulnerability", "hexblast", "detonate-dead", "thrashing-vines", ...reviewedSpellUtilitySupportIds("echo")],
    skillOverrides: { ...spellUtilitySupportOverrides("echo",0,false), "thrashing-vines": { summary: "Base self-cast Cascadable Thrashing Vines only. Adds one Echo with 30% less cast speed and a 150% Mana-cost multiplier. The 40% increased area is Echo-only, not 40% more radius or an unconditional area bonus. Placement limits, minimum channel time, retargeting, contacts and overlap remain separate. High cast-speed priority is opt-in; double hit count or DPS is not assumed." } },
    summary: "Self-used Cascadable spells Echo, with 30% less cast speed and increased mana cost. Echo-only area, extra hits, ring replacement, corpse/curse supply, activation, repeat cadence and total DPS are not modeled. No additional curse magnitude is assumed.",
    priorities: [{ id: "castSpeed", weight: 2, reason: "Spell Echo lowers cast speed by 30%. High priority favors responsiveness, not guaranteed repeats, overlap, cooldown recovery or total DPS. Echo-only area is not an unconditional passive bonus." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8012",
  },
  {
    id: "brutality-i", name: "Brutality I", effectId: "SupportBrutalityPlayer", family: "Brutality",
    skillIds: [...reviewedPhysicalHitSkills, ...reviewedPlantSkills, ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureIds, ...reviewedSpellUtilitySupportIds("brutality"), ...reviewedProxySupportIds("brutality"), ...reviewedDefensiveBuffSupportIds("brutality"), ...reviewedPersistentOffenceSupportIds("brutality")], priorities: [], exclusions: brutalityExclusions,
    skillOverrides: { ...persistentOffenceSupportOverrides("brutality",25,false), ...defensiveBuffSupportOverrides("brutality",25,false), ...proxySupportOverrides("brutality",25,false), ...spellUtilitySupportOverrides("brutality",25,false,brutalityExclusions), ...plantBrutalityOverrides(25), ...poisonBowBrutalityOverrides(25), ...maceSkillSupportOverrides("brutality",25), ...quarterstaffSkillSupportOverrides("brutality",25), ...bowPrimarySupportOverrides("brutality",25,false,brutalityExclusions), ...spearPrimarySupportOverrides("brutality",25,false,brutalityExclusions), ...monkPrimarySupportOverrides("brutality",25,false,brutalityExclusions), ...maceShieldSupportOverrides("brutality",25,false,brutalityExclusions), ...attackClosureSupportOverrides("brutality",25,false,brutalityExclusions) },
    summary: "25% more Physical Damage with higher mana cost. The supported skill deals no Elemental or Chaos damage. Incompatible suggestions are removed, but existing weights remain and still affect routing. Review those warnings; this is not a DPS multiplier.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1216",
  },
  {
    id: "brutality-ii", name: "Brutality II", effectId: "SupportBrutalityPlayerTwo", family: "Brutality",
    skillIds: [...reviewedPhysicalHitSkills, ...reviewedPlantSkills, ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureIds, ...reviewedSpellUtilitySupportIds("brutality"), ...reviewedProxySupportIds("brutality"), ...reviewedDefensiveBuffSupportIds("brutality"), ...reviewedPersistentOffenceSupportIds("brutality")], priorities: [], exclusions: brutalityExclusions,
    skillOverrides: { ...persistentOffenceSupportOverrides("brutality",30,false), ...defensiveBuffSupportOverrides("brutality",30,false), ...proxySupportOverrides("brutality",30,false), ...spellUtilitySupportOverrides("brutality",30,false,brutalityExclusions), ...plantBrutalityOverrides(30), ...poisonBowBrutalityOverrides(30), ...maceSkillSupportOverrides("brutality",30), ...quarterstaffSkillSupportOverrides("brutality",30), ...bowPrimarySupportOverrides("brutality",30,false,brutalityExclusions), ...spearPrimarySupportOverrides("brutality",30,false,brutalityExclusions), ...monkPrimarySupportOverrides("brutality",30,false,brutalityExclusions), ...maceShieldSupportOverrides("brutality",30,false,brutalityExclusions), ...attackClosureSupportOverrides("brutality",30,false,brutalityExclusions) },
    summary: "30% more Physical Damage with higher mana cost. The supported skill deals no Elemental or Chaos damage. Incompatible suggestions are removed, but existing weights remain and still affect routing. Review those warnings; this is not a DPS multiplier.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1253",
  },
  {
    id: "brutality-iii", name: "Brutality III", effectId: "SupportBrutalityPlayerThree", family: "Brutality",
    skillIds: [...reviewedPhysicalHitSkills, ...reviewedPlantSkills, ...reviewedPoisonBowSkills, ...reviewedMacePrimarySkillIds, ...reviewedQuarterstaffPrimarySkillIds, ...reviewedBowPrimarySkillIds, ...reviewedSpearPrimarySkillIds, ...reviewedMonkPrimarySkillIds, ...reviewedMaceShieldSkillIds, ...reviewedAttackClosureIds, ...reviewedSpellUtilitySupportIds("brutality"), ...reviewedProxySupportIds("brutality"), ...reviewedDefensiveBuffSupportIds("brutality"), ...reviewedPersistentOffenceSupportIds("brutality")], priorities: [], exclusions: brutalityExclusions,
    skillOverrides: { ...persistentOffenceSupportOverrides("brutality",30,true), ...defensiveBuffSupportOverrides("brutality",30,true), ...proxySupportOverrides("brutality",30,true), ...spellUtilitySupportOverrides("brutality",30,true,brutalityExclusions), ...plantBrutalityOverrides(30, true), ...poisonBowBrutalityOverrides(30, true), ...maceSkillSupportOverrides("brutality",30,true), ...quarterstaffSkillSupportOverrides("brutality",30,true), ...bowPrimarySupportOverrides("brutality",30,true,brutalityExclusions), ...spearPrimarySupportOverrides("brutality",30,true,brutalityExclusions), ...monkPrimarySupportOverrides("brutality",30,true,brutalityExclusions), ...maceShieldSupportOverrides("brutality",30,true,brutalityExclusions), ...attackClosureSupportOverrides("brutality",30,true,brutalityExclusions) },
    summary: "30% more Physical Damage and 20% chance for hits to ignore Physical Damage Reduction, not unconditional penetration. No Elemental or Chaos damage. Incompatible suggestions are removed; existing weights remain and still affect routing. Enemy mitigation and total DPS are unmodeled.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1290",
  },
  {
    id: "raging-cry", name: "Raging Cry", effectId: "SupportRagingCryPlayer", family: "RagingCry",
    skillIds: reviewedWarcryUtilitySkills, priorities: [],
    summary: "Grants 4 Rage per 5 counted enemy Power on use. Warcry area is not guaranteed Power or Rage supply. PoB exposes a Rage capability flag, not this Power-based transaction; generation, caps, decay and spend order are not simulated. No automatic Rage, damage or priority bonus is added.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5930",
  },
  {
    id: "exposing-cry", name: "Exposing Cry", effectId: "SupportExposingCryPlayer", family: "ExposingCry",
    skillIds: ["seismic-cry"], priorities: [],
    summary: "Exposure on Hit for 5 seconds with higher mana cost. Reviewed only for Seismic Cry's own secondary hit, not non-hitting Warcries or separately triggered attacks. PoB's capability flag does not verify application, strength, duration scaling or uptime. No automatic Exposure Effect, penetration or damage priority is added.",
    exclusions: [{ id: "skillDuration", reason: "Exposing Cry adds a Duration type for its on-hit Exposure, not a base Seismic Cry timer. Exposure duration scaling, uptime and linked-support combinations are not modeled. Your manual duration weight is retained; no duration suggestion is added." }],
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3285",
  },
  {
    id: "enraged-warcry-i", name: "Enraged Warcry I", effectId: "SupportEnragedWarcryPlayer", family: "EnragedWarcry",
    skillIds: reviewedCooldownWarcries, priorities: [],
    summary: "Spends 20 Rage instead of an Endurance Charge to bypass the supported Warcry's cooldown. Available Rage, generation/consumption order and bypass frequency are not simulated; this PoB snapshot does not calculate the transaction. Ancestral Cry's Glory gate is not a cooldown. Existing cooldown priorities remain for non-bypassed uses; no automatic speed or damage bonus is added.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2984",
  },
  {
    id: "enraged-warcry-ii", name: "Enraged Warcry II", effectId: "SupportEnragedWarcryPlayerTwo", family: "EnragedWarcry",
    skillIds: reviewedCooldownWarcries, priorities: [],
    summary: "Spends 15 Rage instead of an Endurance Charge to bypass the supported Warcry's cooldown. Available Rage, generation/consumption order and bypass frequency are not simulated; this PoB snapshot does not calculate the transaction. Ancestral Cry's Glory gate is not a cooldown. Existing cooldown priorities remain for non-bypassed uses; no automatic speed or damage bonus is added.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3014",
  },
  {
    id: "echoing-cry", name: "Echoing Cry", effectId: "SupportEchoingCryPlayer", family: "EchoingCry",
    skillIds: reviewedCooldownWarcries, priorities: [],
    summary: "Two echoes 1.3 seconds apart, with changing area, 50% less counted Power, 40% less damage and higher mana cost. Requires moving 10 metres before use and resets that condition after use. Ancestral Cry's existing use condition excludes it. This PoB snapshot does not calculate echoes, the travel gate or those area/Power/damage changes. No guaranteed extra hits, Corrupted Blood stacks or priority bonus is assumed.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2675",
  },
  {
    id: "corrupting-cry-i", name: "Corrupting Cry I", effectId: "SupportCorruptingCryPlayer", family: "CorruptingCry",
    skillIds: reviewedWarcryUtilitySkills, priorities: [],
    summary: "Triggers separate player-owned Physical Corrupted Blood, not a hit, Bleeding, Attack, Spell or minion damage. Source/native data has 1 stack per trigger, a 10-stack cap and 5-second base duration; actual stacking, uptime and Echo interactions are not simulated. Tier I has 30% less Warcry area. No added support Mana multiplier or child Mana cost; parent use still costs Mana. Existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1702",
  },
  {
    id: "corrupting-cry-ii", name: "Corrupting Cry II", effectId: "SupportCorruptingCryPlayerTwo", family: "CorruptingCry",
    skillIds: reviewedWarcryUtilitySkills, priorities: [],
    summary: "Triggers separate player-owned Physical Corrupted Blood, not a hit, Bleeding, Attack, Spell or minion damage. Source/native data has 1 stack per trigger, a 10-stack cap and 5-second base duration; actual stacking, uptime and Echo interactions are not simulated. Tier II has no Tier-I Warcry-area penalty. No added support Mana multiplier or child Mana cost; parent use still costs Mana. Existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1869",
  },
  {
    id: "deadly-poison-i", name: "Deadly Poison I", effectId: "SupportDeadlyPoisonPlayer", family: "DeadlyPoison",
    skillIds: [...reviewedPoisonBowSkills, ...reviewedPersistentOffenceSupportIds("deadly")], priorities: [], skillOverrides: { ...poisonBowDeadlyPoisonOverrides(75, 25), ...persistentOffenceSupportOverrides("deadly",75,false) },
    summary: "75% more Poison magnitude and 25% less damage with hits. The hit penalty and derived Poison source must both be considered; this is not a flat total-DPS multiplier. Existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1722",
  },
  {
    id: "deadly-poison-ii", name: "Deadly Poison II", effectId: "SupportDeadlyPoisonPlayerTwo", family: "DeadlyPoison",
    skillIds: [...reviewedPoisonBowSkills, ...reviewedPersistentOffenceSupportIds("deadly")], priorities: [], skillOverrides: { ...poisonBowDeadlyPoisonOverrides(100, 30), ...persistentOffenceSupportOverrides("deadly",100,false) },
    summary: "100% more Poison magnitude and 30% less damage with hits. The hit penalty and derived Poison source must both be considered; this is not a flat total-DPS multiplier. Existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1761",
  },
  {
    id: "deliberation", name: "Deliberation", effectId: "SupportDeliberationPlayer", family: "Deliberation",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowMovementOverrides(true),
    summary: "20% more damage with 30% more movement-speed penalty during the supported action, not less global Movement Speed. Existing priorities are unchanged; this is not a full-DPS estimate.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1872",
  },
  {
    id: "escalating-poison", name: "Escalating Poison", effectId: "SupportEscalatingPoisonPlayer", family: "EscalatingPoison",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowEscalatingOverrides(),
    summary: "One additional Poison stack with 20% less outgoing Poison duration, not a guaranteed damage gain. Actual application uptime and full DPS are not modeled; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2165",
  },
  {
    id: "bursting-plague", name: "Bursting Plague", effectId: "SupportBurstingPlaguePlayer", family: "BurstingPlague",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowBurstingPlagueOverrides(),
    summary: "Supported Poison can build enemy-capped Plague for a separate Physical area burst on death. Plague buildup, kills, burst damage and boss uptime are not modeled. Higher firing Mana cost; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L628",
  },
  {
    id: "poison-i", name: "Poison I", effectId: "SupportPoisonPlayer", family: "Poison",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowPoisonChanceOverrides(40),
    summary: "40% chance to Poison on eligible hits, not increased chance or Poison magnitude. Inherent Poison is separate. Higher Mana cost; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3846",
  },
  {
    id: "poison-ii", name: "Poison II", effectId: "SupportPoisonPlayerTwo", family: "Poison",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowPoisonChanceOverrides(60),
    summary: "60% chance to Poison on eligible hits, not increased chance or Poison magnitude. Inherent Poison is separate. Higher Mana cost; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3876",
  },
  {
    id: "poison-iii", name: "Poison III", effectId: "SupportPoisonPlayerThree", family: "Poison",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowPoisonChanceOverrides(60, true),
    summary: "60% chance to Poison on eligible hits and 20% more Poison magnitude only against Bleeding enemies. This does not supply Bleeding or guarantee its uptime. Higher Mana cost; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3906",
  },
  {
    id: "admixture", name: "Admixture", effectId: "SupportAdmixturePlayer", family: "Admixture",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowAdmixtureOverrides(),
    summary: "Conditional Poison magnitude against Bleeding enemies and supported-hit Bleeding magnitude against Poisoned enemies. Neither ailment chance nor condition uptime is supplied. Higher Mana cost; existing priorities are unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L76",
  },
  {
    id: "bleed-i", name: "Bleed I", effectId: "SupportBleedPlayer", family: "Bleed",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowBleedOverrides(50, true),
    summary: "50% chance to inflict Bleeding on eligible hits, not no-hit Poison. Higher Mana cost; no assumed enemy-condition uptime or automatic priority change.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L854",
  },
  {
    id: "bleed-ii", name: "Bleed II", effectId: "SupportBleedPlayerTwo", family: "Bleed",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowBleedOverrides(75),
    summary: "75% chance to inflict Bleeding on eligible hits, not no-hit Poison. No added Mana cost multiplier or assumed enemy-condition uptime; priorities stay unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L884",
  },
  {
    id: "bleed-iii", name: "Bleed III", effectId: "SupportBleedPlayerThree", family: "Bleed",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowBleedOverrides(100),
    summary: "100% chance to inflict Bleeding on eligible hits, not guaranteed contact or no-hit Poison. No added Mana cost multiplier or assumed uptime; priorities stay unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L914",
  },
  {
    id: "corrosion", name: "Corrosion", effectId: "SupportCorrosionPlayer", family: "Corrosion",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowCorrosionOverrides(),
    summary: "Armour Break based on supported Poison damage, not more Poison DPS. Rejects skills that Consume Fully Broken Armour. Native break amount/timing and uptime are not modeled; higher Mana cost, no automatic priority changes.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1498",
  },
  {
    id: "compressed-duration-i", name: "Compressed Duration I", effectId: "CompressedDurationSupportPlayer", family: "CompressedDuration",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowCompressedDurationOverrides(30),
    summary: "30% less skill-effect duration, not faster Poison damage or a damage bonus. Linked and separate timers differ; cost per use and existing priorities stay unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1507",
  },
  {
    id: "compressed-duration-ii", name: "Compressed Duration II", effectId: "CompressedDurationSupportPlayerTwo", family: "CompressedDuration",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowCompressedDurationOverrides(35),
    summary: "35% less skill-effect duration, not faster Poison damage or a damage bonus. Linked and separate timers differ; cost per use and existing priorities stay unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1543",
  },
  {
    id: "culling-strike-i", name: "Culling Strike I", effectId: "SupportCullingStrikePlayer", family: "CullingStrike",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowCullingOverrides(),
    summary: "Hit-based culling of Rare/Unique enemies at base 10%/5% Life thresholds, not Poison damage or Normal/Magic culling. No added Mana cost multiplier or automatic priority changes.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1528",
  },
  {
    id: "culling-strike-ii", name: "Culling Strike II", effectId: "SupportCullingStrikePlayerTwo", family: "CullingStrike",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowCullingOverrides(true),
    summary: "Rare/Unique hit culling plus 20% increased threshold for 20 seconds after a supported Cull, not +20 percentage points. Native conditional-bonus coverage is incomplete; priorities stay unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1561",
  },
  {
    id: "blind-i", name: "Blind I", effectId: "SupportBlindPlayer", family: "Blind",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowBlindOverrides(),
    summary: "100% chance to Blind on eligible hits, not no-hit Poison or guaranteed uptime. Enemy Accuracy/Evasion debuff, not direct Poison damage; 10% higher Mana cost before rounding, no automatic priority changes.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L464",
  },
  {
    id: "blind-ii", name: "Blind II", effectId: "SupportBlindPlayerTwo", family: "Blind",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowBlindOverrides(20),
    summary: "Hit-based Blind with 20% increased effect, not a direct Poison bonus or guaranteed uptime. Enemy ratings remain separate from player ratings; 10% higher Mana cost before rounding, priorities stay unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L494",
  },
  {
    id: "blindside", name: "Blindside", effectId: "SupportBlindsidePlayer", family: "Blindside",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowBlindsideOverrides(),
    exclusions: [{ id: "blindChance", reason: "Blindside prevents this supported skill from inflicting Blind, even with Blind I/II. A different source must supply Blind; uptime is not assumed. This manual weight is retained and still affects routing for other skills; remove it if unwanted." }],
    summary: "Cannot inflict Blind. Conditional critical-hit bonuses require a different Blind source; not automatic Poison damage or uptime. 20% higher Mana cost before rounding; priorities stay unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L525",
  },
  {
    id: "bounty-i", name: "Bounty I", effectId: "SupportBountyPlayer", family: "Bounty",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowBountyOverrides(50),
    summary: "50% more Life Flask, Mana Flask and Charm charges from supported-hit kills, not Poison damage, regeneration or guaranteed kills. No added Mana cost multiplier or automatic priority changes.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L565",
  },
  {
    id: "bounty-ii", name: "Bounty II", effectId: "SupportBountyPlayerTwo", family: "Bounty",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowBountyOverrides(100),
    summary: "100% more Life Flask, Mana Flask and Charm charges from supported-hit kills, not Poison damage, regeneration or guaranteed kills. No added Mana cost multiplier or automatic priority changes.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L597",
  },
  {
    id: "maim", name: "Maim", effectId: "SupportMaimPlayer", family: "Maim",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowMaimOverrides(),
    summary: "Maim on eligible attack hits; enemy movement and Evasion reductions require application, not Poison damage or assumed uptime.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2978",
  },
  {
    id: "malady", name: "Malady (catalog review)", effectId: "SupportMaladyPlayer", family: "Malady",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowMaladyOverrides(),
    summary: "Catalog-only review: tier 0; current availability is unverified. Swaps base on-hit Poison/Bleeding chances, not damage or inherent no-hit Poison. Native swap coverage is incomplete; no automatic priorities or uptime.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3008",
  },
  {
    id: "heft", name: "Heft", effectId: "SupportHeftPlayer", family: "Heft",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowHeftOverrides(),
    summary: "30% more maximum Physical hit damage, not all Physical/Poison damage; 20% higher Mana cost. Reviewed source ranges and component boundaries do not become automatic route-score multipliers.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4227",
  },
  {
    id: "longshot-i", name: "Longshot I", effectId: "SupportFarCombatPlayer", family: "Longshot",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowLongshotOverrides(25),
    summary: "Up to 25% more Attack Damage by enemy distance, not permanent Poison magnitude or maximum-range uptime. 20% higher Mana cost even at close range; manual priorities unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2906",
  },
  {
    id: "longshot-ii", name: "Longshot II", effectId: "SupportFarCombatPlayerTwo", family: "Longshot",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowLongshotOverrides(35),
    summary: "Up to 35% more Attack Damage by enemy distance, not permanent Poison magnitude or maximum-range uptime. 20% higher Mana cost even at close range; manual priorities unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2942",
  },
  {
    id: "execute-i", name: "Execute I", effectId: "SupportExecutePlayer", family: "Execute",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowExecuteOverrides(40),
    summary: "40% more damage with Hits against enemies on Low Life, not unconditional Poison magnitude or guaranteed uptime. 10% higher Mana cost regardless of enemy Life; manual priorities unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3137",
  },
  {
    id: "execute-ii", name: "Execute II", effectId: "SupportExecutePlayerTwo", family: "Execute",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowExecuteOverrides(50),
    summary: "50% more damage with Hits against enemies on Low Life, not unconditional Poison magnitude or guaranteed uptime. 10% higher Mana cost regardless of enemy Life; manual priorities unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3172",
  },
  {
    id: "execute-iii", name: "Execute III", effectId: "SupportExecutePlayerThree", family: "Execute",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowExecuteThreeOverrides(),
    summary: "Separate 30% more hit damage conditions for enemy and player Low Life; both combine to 69% more, not assumed uptime. One 10% higher Mana cost in every state; manual priorities unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3207",
  },
  {
    id: "exploit-weakness", name: "Exploit Weakness", effectId: "SupportExploitWeaknessPlayer", family: "ExploitWeakness",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowExploitWeaknessOverrides(),
    summary: "40% more Damage requires Fully Broken Armour; this skill cannot Break Armour and cannot use Corrosion. 30% higher Mana cost outside the condition; no assumed uptime or automatic priorities.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3246",
  },
  {
    id: "chaos-mastery", name: "Chaos Mastery", effectId: "SupportChaosMasteryPlayer", family: "Mastery",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowChaosMasteryOverrides(),
    summary: "+1 supported Chaos skill level, not a fixed damage bonus. No separate Mana multiplier, but higher-level base costs can rise; manual priorities unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1771",
  },
  {
    id: "chaos-attunement", name: "Chaos Attunement", effectId: "SupportAddedChaosDamagePlayer", family: "ChaosAttunement",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowChaosAttunementOverrides(),
    summary: "Gain 25% of Damage as Extra Chaos, but deal 50% less non-Chaos Damage. Poison-source trade-offs are not a blanket damage upgrade. 20% higher Mana cost; manual priorities unchanged.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1731",
  },
  {
    id: "withering-touch", name: "Withering Touch", effectId: "SupportWitheringTouchPlayer", family: "WitheringTouch",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowWitheringTouchOverrides(),
    summary: "25% less Damage with conditional Chaos-hit Wither application; no automatic stacks, uptime or route-score bonus.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8730",
  },
  ...([
    { id: "pierce-i", name: "Pierce I", effectId: "SupportPiercePlayer", tier: 1, line: 3648 },
    { id: "pierce-ii", name: "Pierce II", effectId: "SupportPiercePlayerTwo", tier: 2, line: 3680 },
    { id: "pierce-iii", name: "Pierce III", effectId: "SupportPiercePlayerThree", tier: 3, line: 3711 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "Pierce", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowPierceOverrides(entry.tier),
    summary: "Projectile delivery with tier-specific post-pierce penalties; no automatic extra contacts or Poison bonus.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L${entry.line}`,
  })),
  {
    id: "fork", name: "Fork", effectId: "SupportForkPlayer", family: "Fork", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowForkOverrides(),
    summary: "Conditional post-fork damage penalty and higher Mana cost; no automatic extra Poison applications.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2245",
  },
  ...([
    { id: "chain-i", name: "Chain I", effectId: "SupportChainPlayer", chains: 1, lessHit: 30, line: 808 },
    { id: "chain-ii", name: "Chain II", effectId: "SupportChainPlayerTwo", chains: 2, lessHit: 50, line: 844 },
    { id: "chain-iii", name: "Chain III", effectId: "SupportChainPlayerThree", chains: 2, lessHit: 40, line: 880 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "Chain", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowChainOverrides(entry.chains, entry.lessHit),
    summary: "Additional Chains with an unconditional hit-only penalty and separate Poison-source consequences; no assumed repeat hits.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L${entry.line}`,
  })),
  ...([
    { id: "multishot-i", name: "Multishot I", effectId: "SupportMultishotPlayer", lessDamage: 35, line: 3135 },
    { id: "multishot-ii", name: "Multishot II", effectId: "SupportMultishotPlayerTwo", lessDamage: 25, line: 3179 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "AdditionalProjectiles", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowMultishotOverrides(entry.lessDamage),
    summary: "Additional projectiles with separate damage and skill-speed penalties; no automatic extra hits, Poison stacks or clouds.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L${entry.line}`,
  })),
  ...([
    { id: "nova-projectiles-i", name: "Nova Projectiles I", effectId: "SupportNovaProjectilesPlayer", tier: 1, line: 3315 },
    { id: "nova-projectiles-ii", name: "Nova Projectiles II", effectId: "SupportNovaProjectilesTwoPlayer", tier: 2, line: 3343 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "NovaProjectiles",
    ...(entry.tier === 2 ? { additionalFamilies: ["AdditionalProjectiles"] } : {}), skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowNovaOverrides(entry.tier),
    summary: "Circular delivery with separate damage/cooldown and shared-family checks; no automatic extra contacts or Poison stacks.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L${entry.line}`,
  })),
  ...([
    { id: "ricochet-i", name: "Ricochet I", effectId: "SupportRicochetPlayer", chance: 40, line: 4922 },
    { id: "ricochet-ii", name: "Ricochet II", effectId: "SupportRicochetPlayerTwo", chance: 50, line: 4952 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "Ricochet", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowRicochetOverrides(entry.chance),
    summary: "Terrain-chain chance, not guaranteed walls, repeat hits or extra Poison applications.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L${entry.line}`,
  })),
  {
    id: "salvo", name: "Salvo", effectId: "SupportSalvoPlayer", family: "Seal", additionalFamilies: ["AdditionalProjectiles"], skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowSalvoOverrides(),
    summary: "Seal-dependent random projectile delivery; cap, waiting, shared families and native modeling gaps stay separate from extra hits or Poison.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5032",
  },
  {
    id: "momentum", name: "Momentum", effectId: "SupportMomentumPlayer", family: "Momentum", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowMomentumOverrides(),
    summary: "Conditional movement-during-use damage and unconditional higher Mana cost; no assumed uptime or automatic Poison multiplier.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3098",
  },
  {
    id: "supercritical", name: "Supercritical", effectId: "SupportIncreasedCriticalDamagePlayer", family: "Supercritical",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowSupercriticalOverrides(),
    summary: "Increased Critical Damage Bonus trades against less Critical Hit Chance, not guaranteed Poison damage or critical uptime.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8277",
  },
  ...([
    { id: "inexorable-critical-i", name: "Inexorable Critical I", effectId: "SupportInevitableCriticalsPlayer", tier: 1, line: 5938 },
    { id: "inexorable-critical-ii", name: "Inexorable Critical II", effectId: "SupportInevitableCriticalsPlayerTwo", tier: 2, line: 5979 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "InexorableCritical", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowInexorableOverrides(entry.tier),
    summary: "Time-based critical buildup resets on a supported critical hit; no maximum uptime or automatic Poison bonus is assumed.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L${entry.line}`,
  })),
  {
    id: "pinpoint-critical", name: "Pinpoint Critical", effectId: "SupportPinpointCriticalPlayer", family: "PinpointCritical",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowPinpointOverrides(),
    summary: "More critical chance trades against less extra critical damage, not guaranteed Poison gain or sustained Inexorable buildup.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7342",
  },
  {
    id: "ambush", name: "Ambush", effectId: "SupportAmbushPlayer", family: "Ambush",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowAmbushOverrides(),
    summary: "More critical chance requires enemy Full Life, not player Full Life or assumed continuing Poison uptime.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L524",
  },
  ...([
    { id: "life-leech-i", name: "Life Leech I", effectId: "SupportLifeLeechPlayer", percent: 12, retains: false, line: 4924 },
    { id: "life-leech-ii", name: "Life Leech II", effectId: "SupportLifeLeechPlayerTwo", percent: 16, retains: false, line: 4955 },
    { id: "life-leech-iii", name: "Life Leech III", effectId: "SupportLifeLeechPlayerThree", percent: 16, retains: true, line: 4986 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "LifeLeech", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowLifeLeechOverrides(entry.percent,entry.retains),
    summary: "Physical Attack hit leech is not Poison recovery or assumed sustain; Tier III's source-specific Full Life retention is unmodeled in reviewed PoB.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L${entry.line}`,
  })),
  {
    id: "mana-leech", name: "Mana Leech", effectId: "SupportManaLeechPlayer", family: "ManaLeech",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowManaLeechOverrides(),
    summary: "Physical arrow-hit Mana recovery is separate from Poison and Mana expenditure, not a refund or assumed sustain.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6833",
  },
  ...([
    { id: "stun-i", name: "Stun I", effectId: "SupportStunPlayer", moreBuildup: 50, lessDamage: false, line: 7155 },
    { id: "stun-ii", name: "Stun II", effectId: "SupportStunPlayerTwo", moreBuildup: 70, lessDamage: false, line: 7190 },
    { id: "stun-iii", name: "Stun III", effectId: "SupportStunPlayerThree", moreBuildup: 300, lessDamage: true, line: 7225 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "Stun", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowStunOverrides(entry.moreBuildup,entry.lessDamage),
    summary: "Hit-based Stun Buildup is not Poison buildup or Heavy Stun uptime; Tier III trades damage for buildup and all tiers increase Mana cost.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L${entry.line}`,
  })),
  ...([
    { id: "pin-i", name: "Pin I", effectId: "SupportPinPlayer", tier: 1, line: 3747 },
    { id: "pin-ii", name: "Pin II", effectId: "SupportPinPlayerTwo", tier: 2, line: 3779 },
    { id: "pin-iii", name: "Pin III", effectId: "SupportPinPlayerThree", tier: 3, line: 3812 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "Pin", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowPinOverrides(entry.tier),
    summary: "Physical-hit Pin replaces this skill's Stun; conditional critical chance and duration trade-offs do not establish immobilisation uptime.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L${entry.line}`,
  })),
  ...([
    { id: "life-drain", name: "Life Drain", effectId: "SupportLifeOnCullPlayer", family: "LifeDrain", resource: "Life", line: 2747 },
    { id: "soul-drain", name: "Soul Drain", effectId: "SupportManaOnCullPlayer", family: "SoulDrain", resource: "Mana", line: 5260 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: entry.family, skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowDrainOverrides(entry.resource),
    summary: "Supported-skill Cull recovery is not generic on-kill recovery or leech; reviewed PoB's recovery fields do not prove event eligibility or sustain.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L${entry.line}`,
  })),
  ...([
    { id: "armour-break-i", name: "Armour Break I", effectId: "SupportArmourBreakPlayer", amount: 15, chargeChance: 0, line: 198 },
    { id: "armour-break-ii", name: "Armour Break II", effectId: "SupportArmourBreakPlayerTwo", amount: 15, chargeChance: 15, line: 228 },
    { id: "armour-break-iii", name: "Armour Break III", effectId: "SupportArmourBreakPlayerThree", amount: 20, chargeChance: 20, line: 259 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "ArmourBreak", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowArmourBreakOverrides(entry.amount,entry.chargeChance),
    summary: "Physical-hit Armour Break is separate from Poison and Corrosion; conditional charge generation is not guaranteed uptime or a damage bonus.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L${entry.line}`,
  })),
  ...([
    { id: "armour-demolisher-i", name: "Armour Demolisher I", effectId: "SupportArmourDemolisherPlayer", amount: 50, line: 290 },
    { id: "armour-demolisher-ii", name: "Armour Demolisher II", effectId: "SupportArmourDemolisherPlayerTwo", amount: 70, line: 325 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "ArmourDemolisher", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowArmourDemolisherOverrides(entry.amount),
    summary: "More Armour Break strength needs an eligible source; it is not more Hit/Poison damage or guaranteed full-break uptime.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L${entry.line}`,
  })),
  {
    id: "armour-explosion", name: "Armour Explosion", effectId: "SupportArmourExplosionPlayer", family: "ArmourExplosion",
    skillIds: reviewedPoisonBowSkills, priorities: [], skillOverrides: poisonBowArmourExplosionOverrides(),
    summary: "A separate triggered Fire attack needs this supported skill's full-break event; native child DPS does not prove trigger frequency or extra Poison damage.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L360",
  },
  {
    id: "rupture", name: "Rupture", effectId: "SupportRupturePlayer", family: "Rupture", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowBleedAggravationOverrides("rupture"),
    summary: "A supported Hit against a Heavily Stunned enemy can Aggravate existing Bleeding, not Poison or guaranteed ailment uptime.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6419",
  },
  {
    id: "rusted-spikes", name: "Rusted Spikes (catalog review)", effectId: "SupportRustedSpikesPlayer", family: "RustedSpikes", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowBleedAggravationOverrides("spikes"),
    summary: "Catalog-only tier-zero review: supported-skill Pin events Aggravate existing Bleeding, not Poison; availability and uptime are unverified.",
    sourceUrl: "https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6447",
  },
  ...[
    { id: "deep-cuts-i", name: "Deep Cuts I", effectId: "SupportDeepCutsPlayer", lessHit: 25, moreBleed: 75, line: 2347 },
    { id: "deep-cuts-ii", name: "Deep Cuts II", effectId: "SupportDeepCutsPlayerTwo", lessHit: 30, moreBleed: 100, line: 2386 },
  ].map((entry): ReviewedSkillSupport => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "DeepCuts", skillIds: reviewedPoisonBowSkills,
    priorities: [], skillOverrides: poisonBowDeepCutsOverrides(entry.lessHit, entry.moreBleed),
    summary: "Separate hit-damage penalties, Bleeding magnitude and weapon-derived Poison source; no assumed Bleeding or automatic score bonus.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L${entry.line}`,
  })),
  ...([
    { id: "overabundance-i", name: "Overabundance I", effectId: "SupportIncreaseLimitPlayer", lessDuration: 50, line: 3380 },
    { id: "overabundance-ii", name: "Overabundance II", effectId: "SupportIncreaseLimitPlayerTwo", lessDuration: 40, line: 3416 },
  ] as const).map((entry) => ({
    id: entry.id, name: entry.name, effectId: entry.effectId, family: "Overabundance", skillIds: ["gas-arrow"],
    priorities: [], skillOverrides: gasArrowOverabundanceOverrides(entry.lessDuration),
    summary: "One higher cloud limit with shorter skill duration, not extra Poison stacks or guaranteed coverage; Gas Arrow only.",
    sourceUrl: `https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L${entry.line}`,
  })),
];

function supportFamilies(support: ReviewedSkillSupport): readonly string[] {
  return [support.family, ...(support.additionalFamilies ?? [])];
}

export function reviewedSkillSupportsFor(skillId: string, supportIds?: unknown): ReviewedSkillSupport[] {
  const supports = reviewedSkillSupports.filter((support) => support.skillIds.includes(skillId));
  const selectedIds = normalizeSkillSupportIds(skillId,supportIds);
  const pinSelected = supports.some((support) => support.family === "Pin" && Array.isArray(supportIds) && supportIds.includes(support.id));
  const overabundanceNova = supports.some((support) => support.family === "Overabundance")
    && normalizeSkillSupportIds(skillId, supportIds).includes("nova-projectiles-ii");
  const blindside = supports.some((support) => support.id === "blindside") && Array.isArray(supportIds) && supportIds.includes("blindside");
  const malady = supports.some((support) => support.id === "malady") && Array.isArray(supportIds) && supportIds.includes("malady");
  const rangePaired = Array.isArray(supportIds) && ["CloseCombat", "Longshot"].every((family) =>
    supports.some((support) => support.family === family && supportIds.includes(support.id)));
  const exploitCorrosionPaired = Array.isArray(supportIds) && ["exploit-weakness", "corrosion"].every((id) =>
    supports.some((support) => support.id === id) && supportIds.includes(id));
  const armourBreakWithExploit = Array.isArray(supportIds) && supportIds.includes("exploit-weakness")
    && supports.some((support) => support.id === "exploit-weakness")
    && supports.some((support) => support.family === "ArmourBreak" && supportIds.includes(support.id));
  const forkSelected = supports.some((support) => support.id === "fork") && Array.isArray(supportIds) && supportIds.includes("fork");
  const pierceWithFork = forkSelected && Array.isArray(supportIds)
    ? supportIds.find((id) => supports.some((support) => support.id === id && support.family === "Pierce")) : undefined;
  return supports.map((support) => {
    const override = support.skillOverrides?.[skillId];
    const base = override ? { ...support, ...override } : support;
    let resolved = armourBreakWithExploit && (support.family === "ArmourBreak" || support.id === "exploit-weakness")
      ? { ...base, summary: "Exploit Weakness is selected with Armour Break: the support can remain linked, but this skill cannot Break Armour. Do not credit self-supplied Fully Broken Armour or its on-full-break Endurance Charge trigger. A separate source must establish the damage condition; selections and manual weights are retained. " + base.summary }
      : base;
    const commonSummary = commonSupportInteractionSummary(support,selectedIds);
    if (commonSummary) resolved = { ...resolved,summary: commonSummary + " " + resolved.summary };
    const deploymentSummary = deploymentSupportInteractionSummary(support,selectedIds);
    if (deploymentSummary) resolved = { ...resolved, summary: deploymentSummary + " " + resolved.summary };
    const proxyDebuffOverride = proxyDebuffSupportOverride(resolved,selectedIds);
    if (proxyDebuffOverride) resolved = { ...resolved, ...proxyDebuffOverride, summary: proxyDebuffOverride.summary + " " + resolved.summary };
    const elementalOverride = elementalSupportOverride(resolved,selectedIds,skillId);
    if (elementalOverride) resolved = { ...resolved, ...elementalOverride, summary: [elementalOverride.summary,resolved.summary].filter(Boolean).join(" ") };
    const physicalOverride = physicalSupportOverride(resolved,selectedIds);
    if (physicalOverride) resolved = { ...resolved, ...physicalOverride, summary: [physicalOverride.summary,resolved.summary].filter(Boolean).join(" ") };
    const resourceOverride = resourceSupportOverride(resolved,selectedIds,skillId);
    if (resourceOverride) resolved = { ...resolved, ...resourceOverride, summary: [resourceOverride.summary,resolved.summary].filter(Boolean).join(" ") };
    const specialistOverride = specialistSupportOverride(resolved,selectedIds,skillId);
    if (specialistOverride) resolved = { ...resolved, ...specialistOverride, summary: [specialistOverride.summary,resolved.summary].filter(Boolean).join(" ") };
    if (support.family === "ArmourDemolisher" && Array.isArray(supportIds) && supportIds.includes("exploit-weakness")) return { ...resolved,
      summary: "Exploit Weakness is selected: this skill cannot Break Armour. Demolisher's strength modifier does not bypass that prohibition or establish full-break/charge events; selections and manual weights are retained. " + resolved.summary };
    if (support.id === "armour-explosion" && Array.isArray(supportIds) && supportIds.includes("exploit-weakness")) return { ...resolved,
      summary: "Exploit Weakness is selected: this parent cannot Break Armour and cannot supply Armour Explosion's supported-skill full-break event. A configured Fully Broken target or displayed child hit is not proof of a trigger; selections and manual weights are retained. " + resolved.summary };
    if (pinSelected && support.id === "rupture") return { ...resolved,
      summary: "Pin is selected: this supported skill cannot Stun and cannot supply its own Heavy Stun for Rupture. It can still Hit a target Heavily Stunned by a separate source; that condition and uptime are not supplied. " + resolved.summary };
    if (pinSelected && support.id === "rusted-spikes") return { ...resolved,
      summary: resolved.summary + " With Pin selected, eligible Physical hits can build Pin, but buildup or a configured Pinned target does not prove a new supported-skill Pin event. Selections and manual weights are retained." };
    if (pinSelected && support.family === "Stun") return { ...resolved,
      summary: "Pin is selected: this supported skill cannot Stun. Generic Stun Buildup modifiers redirect to Pin, not a separate Heavy Stun benefit. Stun III's damage penalty and all Stun tiers' Mana multipliers still apply; selections and manual weights are retained. " + resolved.summary };
    if (support.family === "Overabundance" && overabundanceNova) return { ...resolved,
      summary: "With Nova II selected, reviewed PoB's generic limit mapping changes stored-use and cooldown-rounding fields. These are not validated extra cooldown uses or extra Poison applications. " + resolved.summary };
    if (blindside && support.family === "Blind") return { ...resolved,
      summary: "Blindside is selected: this supported skill cannot inflict Blind, even with Blind I/II. This support cannot supply Blindside's condition or strengthen a different source's Blind. A different source and its uptime must be established separately. The 10% higher Mana cost before rounding still applies; manual weights and other links are retained." };
    if (malady && override?.maladySummary) return { ...resolved, summary: [override.maladySummary,physicalOverride?.summary].filter(Boolean).join(" ") };
    if (rangePaired && (support.family === "CloseCombat" || support.family === "Longshot")) return { ...resolved,
      summary: "Close Combat and Longshot are selected: at the same distance their damage bonuses do not overlap. Both give zero at 3.5 metres; both Mana cost multipliers still apply. " + resolved.summary };
    if (exploitCorrosionPaired && (support.id === "exploit-weakness" || support.id === "corrosion")) return { ...resolved,
      summary: "Incompatible pair selected: Exploit Weakness makes Corrosion ineligible in reviewed PoB. Corrosion is ignored in either link order; do not count its Armour Break or a combined Mana multiplier. Both selections are retained for review, not treated as a valid loadout. " + resolved.summary };
    if (pierceWithFork && (support.family === "Fork" || support.family === "Pierce")) return { ...resolved,
      summary: (pierceWithFork === "pierce-iii"
        ? "Fork and Pierce III are selected: while always-Pierce is active, piercing enemy collisions cannot also Fork. Do not credit enemy-hit Forks just because PoB allows a Forked counter. "
        : "Fork and Pierce are selected: Fork requires a collision that does not Split or Pierce. A pierced enemy does not also trigger Fork on that collision; later non-piercing collisions are not guaranteed. ")
        + "Both selections and Fork's Mana multiplier are retained. Configured counters are not extra contacts. " + resolved.summary };
    if (support.family === "Chain" && Array.isArray(supportIds) && supportIds.includes(support.id)) {
      const pierce = supportIds.find((id) => supports.some((entry) => entry.id === id && entry.family === "Pierce"));
      if (forkSelected || pierce) return { ...resolved,
        summary: "Projectile priority: Splitting, Piercing and Forking take priority over Chaining. A collision using one of those cannot also Chain. "
          + (pierce === "pierce-iii" ? "While always-Pierce is active, do not credit enemy-hit Chains on those piercing collisions. " : "")
          + "PoB's separate counters do not prove a feasible sequence. Other supports' costs and penalties remain; selections are retained. " + resolved.summary };
    }
    return resolved;
  });
}

export function normalizeSkillSupportIds(skillId: unknown, value: unknown): string[] {
  if (typeof skillId !== "string" || !Array.isArray(value)) return [];
  const families = new Set<string>();
  const ids: string[] = [];
  for (const id of value) {
    const support = reviewedSkillSupports.find((entry) => entry.id === id && entry.skillIds.includes(skillId));
    if (!support || supportFamilies(support).some((family) => families.has(family))) continue;
    ids.push(support.id);
    for (const family of supportFamilies(support)) families.add(family);
  }
  return ids;
}

export function selectedSkillSupports(preset: SkillPreferencePreset, value: unknown): ReviewedSkillSupport[] {
  const selected = new Set(normalizeSkillSupportIds(preset.id, value));
  return reviewedSkillSupportsFor(preset.id, value).filter((support) => selected.has(support.id));
}

export function skillPassiveStatScopes(preset: SkillPreferencePreset, supportIds: unknown): readonly SkillPassiveStatScope[] {
  const scopes = preset.passiveStatScopes ?? [];
  if (!Array.isArray(supportIds) || supportIds.length === 0) return scopes;
  const blocked = selectedSkillSupports(preset, supportIds).flatMap((support) => support.disabledPassiveStatScopes ?? []);
  return blocked.length > 0 ? scopes.filter((scope) => !blocked.includes(scope)) : scopes;
}

export function setSkillSupport(settings: PassiveOptimizationSettings, id: string, enabled: boolean): PassiveOptimizationSettings {
  const support = reviewedSkillSupports.find((entry) => entry.id === id && entry.skillIds.includes(settings.focusSkillId ?? ""));
  if (!support) return settings;
  const families = new Set(supportFamilies(support));
  const ids = normalizeSkillSupportIds(settings.focusSkillId, settings.supportGemIds)
    .filter((current) => enabled ? !supportFamilies(reviewedSkillSupports.find((entry) => entry.id === current)!).some((family) => families.has(family)) : current !== id);
  return { ...settings, supportGemIds: enabled ? [...ids, id] : ids };
}

export function refineSkillPreferencePreset(preset: SkillPreferencePreset, supportIds: unknown): SkillPreferencePreset {
  const supports = selectedSkillSupports(preset, supportIds);
  if (supports.length === 0) return preset;
  const suggestions = new Map(preset.suggestions.map((entry) => [entry.id, { ...entry }]));
  const exclusions = new Map(preset.exclusions.map((entry) => [entry.id, { ...entry }]));
  for (const support of supports) {
    for (const entry of support.priorities) suggestions.set(entry.id, { ...entry });
  }
  // Restrictions win regardless of the order in which supports were selected.
  for (const support of supports) {
    for (const entry of support.exclusions ?? []) {
      suggestions.delete(entry.id);
      exclusions.set(entry.id, { ...entry });
    }
  }
  return { ...preset, suggestions: [...suggestions.values()], exclusions: [...exclusions.values()],
    ...(preset.passiveStatScopes ? { passiveStatScopes: skillPassiveStatScopes(preset, supportIds) } : {}) };
}

export function skillSupportPriorityChanges(settings: PassiveOptimizationSettings, preset: SkillPreferencePreset): Suggestion[] {
  const priorities = new Map<PassivePreferenceId, Suggestion>();
  const supports = selectedSkillSupports(preset,settings.supportGemIds);
  const blocked = new Set(supports.flatMap(support => (support.exclusions ?? []).map(entry => entry.id)));
  for (const support of supports) {
    for (const entry of support.priorities) priorities.set(entry.id, entry);
  }
  return [...priorities.values()].filter((entry) => !blocked.has(entry.id)
    && !settings.preferences.some((current) => current.id === entry.id && current.weight === entry.weight));
}

// Only the explicit apply command changes existing priorities, and only the
// support-specific effects shown in its change list. Other manual choices survive.
export function applySkillSupportPriorities(settings: PassiveOptimizationSettings, preset: SkillPreferencePreset): PassiveOptimizationSettings {
  const preferences = settings.preferences.map((entry) => ({ ...entry }));
  for (const entry of skillSupportPriorityChanges(settings, preset)) {
    const current = preferences.find((preference) => preference.id === entry.id);
    if (current) current.weight = entry.weight;
    else preferences.push({ id: entry.id, weight: entry.weight });
  }
  return { ...settings, preferences };
}

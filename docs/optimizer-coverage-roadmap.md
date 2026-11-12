# Optimizer Coverage Roadmap

Updated 2026-11-10. This is the continuation plan for larger reviewed batches,
not a claim of 95-100% support for PoE2 or a Full DPS engine.

## Baseline and Completion Targets

Snapshot: PoE2 0.5.5f tree and PoB 0.23.1 catalog. Keep these full denominators
visible, including unsupported and tier-zero entries. Catalog entries are not
yet a verified list of obtainable live gems. Configured presets/support choices
mean scoped heuristic coverage, not complete gem mechanics.

| Measure | Starting baseline | Current | 95% of the current raw denominator | 100% |
| --- | ---: | ---: | ---: | ---: |
| Configured skill presets, all catalog IDs | 14/399 (3.5%) | 225/399 (56.4%) | 380/399 | 399/399 |
| Configured support choices, tiers separate | 14/567 (2.5%) | 117/567 (20.6%) | 539/567 | 567/567 |
| Positive-tier skill subtotal | 14/234 (6.0%) | 220/234 (94.0%) | 223/234 | 234/234 |
| Positive-tier support subtotal | 14/450 (3.1%) | 115/450 (25.6%) | 428/450 | 450/450 |
| Recognized distinct main-tree stat wording | 370/2,182 (17.0%) | 914/2,182 (41.9%) | 2,073/2,182 | 2,182/2,182 |
| Recognized main-tree stat occurrences | 2,129/5,451 (39.1%) | 3,566/5,451 (65.4%) | 5,179/5,451 | 5,451/5,451 |

These are transparent numerical aspirations, not permission to assign speculative
scores to reach a target. Many remaining lines require state, gear or complete
skill evaluation that the heuristic cannot safely supply. There is no meaningful
single overall completion percentage, and finishing a small batch does not make
the whole roadmap 95% complete. A changed source snapshot requires new counts.

Two separate completion gates apply:

1. **Review coverage:** source-review every one of the 2,182 distinct wordings and
   966 catalog IDs, recording supported scope or a specific research/exclusion
   reason. A generated inventory alone is not this review. Unsupported records
   have not all been adjudicated yet.
2. **Implementation coverage:** work toward 95-100% of the eligible, reviewed
   cohort once a complete eligibility review establishes its denominator. Publish
   that denominator and exclusions alongside the raw counts above; do not quietly
   redefine all-gem/mechanic completion as a narrower parser checklist.

## Execution Plan

| Workstream | Current state | Next measurable exit |
| --- | --- | --- |
| Inventory/regression tooling | Complete and in use | Every batch reports both wording and occurrence coverage; no unexplained losses |
| Elemental penetration + ailment batch | Complete and validated locally | 15 explicit preference categories; complete-line matching, signed modifier reductions, persistence and route tests |
| Broad unconditional passive families | Backlog ranked by report | Review each complete family and its tradeoffs, not isolated favorable nodes |
| Skill presets | 225 configured; fourteen resource/charge focuses added, including three explicitly context-only focuses | Next breadth batch: fourteen remaining positive-tier utility/trigger focuses, with recipients, generation and forms explicit |
| Support refinements | 117 choices / 71 unique families / 1,632 reviewed pairs | Resource/charge batch adds 14 pairs; continue whole reusable groups with common support rules rather than serial micro-batches |
| Scoped/composite modifiers | Partial | Review weapon/skill scope and multi-effect fanout, retaining penalties once without inventing aliases |
| State/gear/mechanic interactions | Research required | Define inputs, prerequisites, prohibitions and caps before claiming applicability |
| Actual build performance | Offline PoB audit only | Whole-route evaluation, runtime effect coverage and protected-node policy before any Full DPS ranking claim |

The completed combined effect batch is Fire/Cold/Lightning/Elemental
penetration; Flammability, Ignite, Shock, Poison and Bleeding magnitude;
increased/reduced chance to Shock; and separate Ignite, Poison, Bleeding, Shock
and Freeze duration. Scope may be narrowed if source/native checks fail; report
that explicitly rather than approximate the failed mechanic.

## Safe Work and Research Boundaries

Safe near-term work is literal unconditional numeric modifiers with independently
verified ownership, sign and units, plus already-reviewed skill scopes. Preferences
remain opt-in; no existing saved priorities or shortest-route behavior changes.
Duration, application, magnitude and damage must not be treated as interchangeable.
Penetration is not exposure, resistance reduction or damage-over-time scaling.

Deeper research is needed for conditional/recent-event effects, minion/totem
ownership, stat conversions, gear-derived Deflection Rating, Armour applying to
elemental damage, ailment-stack/override/faster-damage interactions, skill-specific
components, and untriaged catalog-only entries. Those remain visible in the full
backlog even when excluded from a particular safe batch.

**Explicit hold:** do not extend Fireball's Concentrated Area support review in
these batches. Existing reviewed behavior remains intact; this hold is not an
unreviewed compatibility approval.

## Batch Completion Gate

- Source/native checks for new or ambiguous modifier families, with local-copy
  provenance distinct from moving upstream references.
- Focused tests while editing; one final full release validation per combined
  batch. Reuse parameterized controls/storage cases instead of repetitive manual
  save/load and viewport runs for unchanged metadata-only controls.
- Browser/integration checks when routing contracts, shared controls, import,
  persistence implementation or layout actually changes.
- Review all newly recognized wording and preserve old matches before deliberately
  refreshing the baseline. Never reset a baseline to hide a regression.
- Record before/after counts, passed/failed/not-run checks, residual gaps and next
  larger batch. No commit, push, publish or deployment without explicit permission.

## Next Larger Batch and Remaining Work

The twelve-focus positive-tier non-totem `Attack` catalog group is now configured:
Cull The Weak, Elemental Sundering, Escape Shot, Fangs of Frost, Oil Barrage,
Thunderous Leap, Trail of Caltrops, Twister, Wind Serpent's Fury, Wing Blast,
Devour and Flame Breath, including 132 common-support pairs. Trail is a persistent
parent with a separate triggered attack; it is not a manual damage action.
Source/native area and weapon discrepancies are visible and not assigned
speculative scopes. Shockwave Totem is covered separately in the proxy batch. This is a
frozen-catalog cohort, not proof that all live primary skills are complete. See
[the attack closure checkpoint](build-focus-attack-closure-batch.md).

The twelve remaining positive-tier `Spell` entries are now configured together:
Barrage, Charged Staff, Convalescence, Elemental Weakness, Frost Darts,
Ice-Tipped Arrows, Mana Tempest, Profane Ritual, Snap, Temporal Chains, Tornado
and Volcano, with 142 common-support pairs. Buffs, recovery, intrinsic DoTs,
curse effects, hit components and costs stay separate. A catalog Spell class
does not imply every entry deals spell damage. Native type-only support acceptance
does not override descriptive hit requirements. See the
[spell/utility checkpoint](build-focus-spell-utility-batch.md).

The eight remaining positive-tier proxy entries are now configured together:
Ancestral Warrior Totem, Spell Totem, Raise Zombie, Rhoa Mount, Shockwave Totem,
Soul Offering, Tame Beast and Wolf Pack, with 68 common-support pairs. The two
meta Totems require explicit reviewed socketed sources; Tame Beast is capture-
action-only, not an invented transformed beast. See the
[proxy checkpoint](build-focus-proxy-batch.md).

The twelve-focus Banner/defensive batch is now configured: all three Banners
plus Arctic Armour, Barkskin, Ghost Dance, Grim Feast, Iron Ward, Magma Barrier,
Scavenged Plating, Time of Need and Wind Dancer. It adds two literal preference
categories and 39 common-support pairs, with current mechanics and native
missing-damage/recovery limits explicit. See the
[Banner/defensive checkpoint](build-focus-defensive-buff-batch.md).

The twelve persistent offence/minion focuses are now configured together: the
five Heralds, Plague Bearer, Raging Spirits, Ravenous Swarm, Mirage Archer,
Archmage, Overwhelming Presence and Withering Presence. Herald reservation
efficiency and scoped damage/area matching add six real-tree wordings and
fourteen occurrences, with no prior-context coverage losses. Native calculation
gaps remain explicit. See the [persistent offence checkpoint](build-focus-persistent-offence-batch.md).

The fourteen resource/charge/empowerment focuses are now configured together:
Alchemist's Boon, Attrition, Berserk, Charge Regulation, Combat Frenzy,
Elemental Conflux, Emergency Reload, Eternal Rage, Mana Remnants, Mantra of
Destruction, Savage Fury, Shard Scavenger, Siphon Elements and Trinity.
Eleven literal resource preferences and fourteen curated support pairs keep
capacity, generation, consumption, effect and duration separate. Conflux,
Shard Scavenger and Trinity are context-only, not inferred damage scoring.
See the [resource/charge checkpoint](build-focus-resource-charge-batch.md).

Next proposal: all fourteen remaining positive-tier utility/trigger focuses:
Barrier Invocation, Blasphemy, Blink, Cast on Critical, Cast on Dodge,
Cast on Elemental Ailment, Cast on Minion Death, Elemental Invocation,
Feral Invocation, Lingering Illusion, Reaper's Invocation, Sacrifice,
Arctic Howl and Lunar Blessing. Reviewed socketed recipients must be explicit;
energy generation, triggers, form restrictions and uptime are not automatic DPS.
No further batch has been started. Tier-zero and unreviewed support entries
still prevent calling the whole catalog or game mechanics complete.

Future breadth targets are 12-20 focuses when the existing scopes fit, or a
whole larger remaining group that reuses reviewed mechanics. Share descriptors,
one grouped UI/storage contract and one final release check per combined batch.
Do not turn each skill/support pair into its own follow-up batch. Split only for
genuinely new source/ownership behavior or an implementation blocker.

The eight-skill mace/shield/Wyvern batch adds Armour Breaker, Perfect Strike,
Molten Blast, Rolling Magma, Forge Hammer, Resonating Shield, Shield Charge and
Shield Wall with 88 pairs across seven existing support families. Rolling Magma
is Wyvern/Talisman, not Mace. Shield source, channel costs, Perfect Timing and
hammer recall/cooldown mechanics remain explicit. See
[the mace/shield checkpoint](build-focus-mace-shield-batch.md).

The seven-skill Monk/Palm/Bell batch adds Frozen Locus, Killing Palm, Shattering
Palm, Staggering Palm, Hand of Chayula, Wave of Frost and Tempest Bell, with 76
reviewed pairs across six shared support families. All seven native skills
explicitly require Quarterstaff, not an assumed unarmed source. Non-melee Cold
crystal explosions, always-hit Palms, triggered follow-ups and player-owned Bell
shockwaves retain separate boundaries. See [the Monk checkpoint](build-focus-monk-primary-batch.md).

The ten-skill spear batch adds Spearfield, Storm Lance, Whirling Slash, Spear of
Solaris, Blood Hunt, Glacial Lance, Primal Strikes, Rapid Assault, Disengage and
Whirlwind Lance with six shared support families and 108 new pairs. Non-melee
hazards, non-area lodged bolts, one-handed modifiers, Glory and cooldowns stay
explicit. No new wording or Full DPS engine is claimed. See
[the spear checkpoint](build-focus-spear-primary-batch.md).

The ten-skill bow batch adds Lightning Rod, Stormcaller Arrow, Freezing Salvo,
Snipe, Tornado Shot, Electrocuting Arrow, Detonating Arrow, Magnetic Salvo, Spiral
Volley and Shockchain Arrow with six shared support families and 117 new pairs.
Tornado Shot targets intrinsic Physical DoT with explicit generic Area Damage
scope, not attack/spell-only area damage. No new stat wording or Full DPS engine
is claimed. See [the bow checkpoint](build-focus-bow-primary-batch.md).

The nine-skill quarterstaff batch adds Falling Thunder, Glacial Cascade, Storm
Wave, Flicker Strike, Gathering Storm, Siphoning Strike, Vaulting Impact, Whirling
Assault and Wind Blast. Five shared families cover ten choices per focus;
Falling Thunder also receives delivery-only Projectile Acceleration I/II context.
No new passive wording or Full DPS engine is claimed. See
[the quarterstaff checkpoint](build-focus-quarterstaff-primary-batch.md).

The eight-skill mace batch adds Earthquake, Earthshatter, Sunder, Supercharged
Slam, Stampede, Leap Slam, Hammer of the Gods and Volcanic Fissure. Five common
support rules cover ten choices across all eight skills. Shared descriptors and
contracts replace per-pair boilerplate; exception checks protect fixed channels,
Movement-Speed-based charge travel, Glory and Fire conversion. No new passive
wording or Full DPS engine is claimed. See [the breadth checkpoint](build-focus-mace-primary-batch.md).

The support report now separates overlapping capabilities: 117 context-reviewed
entries, 10 opt-in priority refinements, 7 constraint/caution entries and 1 direct
passive-scope filter. In-app Full DPS remains 0. These are not additive completion
percentages. Positive-tier gem counts are still not a verified obtainable-primary
cohort. The proposed Poison bow Projectile Deceleration micro-batch is deferred,
not silently counted as reviewed.
Brutality I/II/III now add six pairs by extending the existing family, not
three new catalog choices. They disable Poison despite Physical source gains;
Gas's reviewed Fire-converted detonation also deals no damage. Eligible arrow
Bleeding needs a separate chance source. Tier III's mitigation bypass applies
to hits, not extra Bleed magnitude. Invalid Poison-source suggestions are
suppressed without deleting manual weights or switching to an arrow-hit focus.
See [the Brutality checkpoint](build-focus-poison-bow-brutality.md).
Deep Cuts I/II now add four context-only pairs: 25%/30% less hit damage and
75%/100% more Bleeding magnitude. The native weapon-derived burst/cloud Poison
source also decreases, without a Poison magnitude bonus. Bleeding chance,
aggravation and uptime are not supplied. Tier replacement leaves existing
links and weights unchanged. See [the Deep Cuts checkpoint](build-focus-poison-bow-deep-cuts.md).
Rupture/Rusted Spikes now add four context-only pairs. Rupture needs supported
hits against a Heavily Stunned target; Rusted Spikes needs a supported-skill
Pin event, not an already Pinned target. Both native event stats are unmapped.
Rusted Spikes is tier-zero catalog review, not verified currently obtainable.
Moving/aggravated Bleed share one existing factor, not stacked Poison bonuses.
Pin notes preserve the Stun prohibition and allow externally supplied Heavy
Stun for Rupture. No weights change. See
[the aggravation checkpoint](build-focus-poison-bow-bleed-aggravation.md).
Armour Explosion now adds two context-only pairs: a separate player-owned Fire
attack requires the supported skill's full-break event, not an already full
target or another skill's break. The child cannot Break Armour or self-chain.
Native trigger linkage/chance are unmapped; displayed child DPS is not trigger
frequency. Reversible warnings explain Exploit Weakness's prohibition while
retaining the older Corrosion conflict. No weights change. See
[the Armour Explosion checkpoint](build-focus-poison-bow-armour-explosion.md).
Armour Demolisher I/II now add four context-only pairs: 50%/70% more break
strength (1.5x/1.7x), not damage or a break source. Native PoB stores
ArmourBreakEffect separately from the displayed per-hit break field; percentage
and Corrosion amounts remain incomplete. Reversible Demolisher warnings preserve
the existing Exploit/Corrosion conflicts. No weights change. See
[the Demolisher checkpoint](build-focus-poison-bow-armour-demolisher.md).
Armour Break I/II/III now add six context-only pairs: 15%/15%/20% of Physical
hit damage as break, separate from Poison and Corrosion. II/III declare 15%/20%
charge chance on supported-skill full-break events, not every hit. Native PoB
maps capability but not percentage amount or charge events. Reversible warnings
explain Exploit Weakness's prohibition while preserving Corrosion's existing
incompatibility warning. No weights change. See
[the Armour Break checkpoint](build-focus-poison-bow-armour-break.md).
Life Drain and Soul Drain now add four context-only pairs. Their 12%-of-maximum
Life/Mana recovery requires an actual supported-skill Cull, not any Poison kill
or leech event. Culling Strike I/II rarity/threshold boundaries remain intact.
PoB maps Life Drain to an ungated LifeOnKill field and leaves Soul Drain's raw
stat unmapped; neither field proves game recovery or sustain. No weights change.
See [the Drain checkpoint](build-focus-poison-bow-drain.md).
Pin I/II/III now add six context-only pairs. Physical hit Pin eligibility is
separate from Poison; generic Stun modifiers redirect once, not into a second
Heavy Stun benefit. Tier II's increased crit is conditional and additive;
Tier III's 60%-less-buildup penalty is modeled but its declared 30%-more-duration
stat is unmapped in reviewed PoB. No uptime or route bonus is credited. Stun
notes update reversibly when Pin is selected. See
[the Pin checkpoint](build-focus-poison-bow-pin.md).
Stun I/II/III now add six context-only pairs. Hit buildup is separate from
Poison, synthetic native source-hit fields and Heavy Stun uptime. Tier III's
broad damage penalty also reduces the Poison source; its 4x buildup multiplier
is not 4x original total buildup after that penalty. All tiers increase Mana
cost. No route bonus or weight edits. See
[the Stun checkpoint](build-focus-poison-bow-stun.md).
Mana Leech now adds two context-only pairs. Actual Physical arrow-hit recovery
is separate from Poison, synthetic native source-hit fields and upfront Mana
expenditure. No cost multiplier is not a refund or sustain proof; other linked
costs and recovery restrictions still apply. No route bonus or weight edits.
See [the Mana Leech checkpoint](build-focus-poison-bow-mana-leech.md).
Life Leech I/II/III now add six context-only pairs. Physical arrow-hit recovery
is separate from Poison and synthetic native burst/cloud source-hit fields.
Tier III declares retention at player Full Life only for its supported source;
reviewed PoB does not model this exact stat, so equal II/III estimates are not
proof of equal game behavior. No automatic recovery score or sustain. See
[the Life Leech checkpoint](build-focus-poison-bow-life-leech.md).
Ambush now adds two context-only pairs. Enemy Full Life is separate from
player Full Life and ongoing Poison. Static native target-state estimates do
not establish an opening-hit timeline, burst/cloud inheritance or Full Life
uptime. No automatic route bonus or weight edits. See
[the Ambush checkpoint](build-focus-poison-bow-ambush.md).
Pinpoint Critical now adds two context-only pairs. More critical chance and
less extra critical damage combine multiplicatively with Supercritical and
explicit Inexorable snapshots. Capped-chance controls lose damage; a better
source-hit average need not improve native Poison. No reset-cycle uptime or
automatic route bonus. See [the Pinpoint checkpoint](build-focus-poison-bow-pinpoint.md).
Inexorable Critical I/II now add four context-only pairs. Time-based chance
and Tier II's extra-critical-damage penalty reset on a supported critical hit.
PoB's default ten-second snapshot is not measured uptime or a reset simulation;
the 20% higher Mana cost remains at zero buildup. Manual weights and scores
stay unchanged. See [the Inexorable checkpoint](build-focus-poison-bow-inexorable.md).
Supercritical now adds two context-only pairs: 100% increased Critical Damage
Bonus and 20% less Critical Hit Chance, not a flat bonus or double total damage.
Native normal/no-crit/high-increased-bonus controls show benefits are not
universal. No-hit source estimates are not proof of live critical inheritance
or sustained applications; manual weights and scores stay unchanged. See
[the Supercritical checkpoint](build-focus-poison-bow-supercritical.md).
Overabundance I/II now add two Gas-only context pairs. A six-to-seven cloud
capacity with 50%/40% less skill duration is not extra Poison stacks or
guaranteed coverage; Poisonburst lacks the required Limit type. Native generic
limit/cooldown fields with Nova II are not validated extra uses or applications.
See [the Overabundance checkpoint](build-focus-poison-bow-overabundance.md).
Bounty I/II now add four context-only pairs. Detailed reward stat text requires
kills by Hits from the supported skill, not Poison deaths or generic party/
minion kill credit. Three reward channels are separate from damage, healing,
flat generation and assumed boss sustain. Native reward events are unmodeled;
manual priorities and route scores remain unchanged.
See [the Bounty checkpoint](build-focus-poison-bow-bounty.md).
Blindside now adds two context-only pairs. Its prohibition comes before
conditional critical-hit benefits; paired Blind I/II notes explicitly cannot
supply or strengthen an external Blind source. The runtime's unmapped
prohibition is not accepted as legal application. Manual Blind/crit weights and
route scores remain unchanged; no automatic critical-hit recommendation.
See [the Blindside checkpoint](build-focus-poison-bow-blindside.md).
Blind I/II now add four context-only pairs. Eligible hits apply Blind; Poison
does not. Base enemy Accuracy/Evasion reductions are 20%, or 24% with II's
20% increased effect and no other modifiers. Conditional native hit/crit and
Poison estimates are not direct Poison magnitude or real burst/cloud hits.
Both tiers cost 10% more Mana before rounding; manual weights stay unchanged.
See [the Blind checkpoint](build-focus-poison-bow-blind.md).
Culling Strike I/II now add four context-only pairs. Rare/Unique hit thresholds
are 10%/5%; Tier II grants 20% increased threshold for 20 seconds after Culling,
not +20 percentage points or a permanent buff. Native conditional-bonus coverage
is incomplete and synthetic burst/cloud culling is not real Poison culling.
See [the Culling checkpoint](build-focus-poison-bow-culling-strike.md).
Compressed Duration I/II now add four context-only pairs. Their skill-only
penalty shortens linked burst Poison and cloud lifetime, not Gas's separate
outgoing Poison or actual-arrow ailments. No damage/tick-speed gain or automatic
detonation frequency is inferred. See
[the checkpoint](build-focus-poison-bow-compressed-duration.md).
Swift Affliction I/II now add four context-only pairs using existing choices.
Their non-ailment DoT bonus is not Poison magnitude. The native duration overlap
is explicit, not assumed game timing or compensation; older intrinsic-DoT
priorities remain intact, with no automatic priority for the two Poison focuses.
See [the checkpoint](build-focus-poison-bow-swift-affliction.md).
Corrosion is now reviewed as two context-only pairs. Both parents pass native
compatibility; Fully Broken Armour consumption is rejected. The supported
Poison-based Armour Break is not more Poison DPS. Native amount/timing are
unmodeled; zero output is not zero game effect or permission to configure a
Fully Broken target. See [the checkpoint](build-focus-poison-bow-corrosion.md).
Bleed I/II/III are now reviewed as six context-only pairs. Their 50/75/100%
chance applies to eligible arrow hits, not burst/cloud hits. Only I adds a
Mana multiplier in the reviewed source/runtime. Linking III does not set
either enemy condition for Poison III/Admixture. Native synthetic-source
Bleeding fields are not promoted to real no-hit Bleeding or route scores. See
[the checkpoint](build-focus-poison-bow-bleed-supports.md).
Admixture is now reviewed as two context-only pairs. Its Poison bonus requires
Bleeding; its supported-hit Bleeding bonus requires Poisoned. Neither grants
ailment chance or creates a reciprocal application loop. The isolated PoB
runtime combines it with Poison III as conditional 1.44 Poison magnitude;
the app does not apply that multiplier to route scores. See
[the checkpoint](build-focus-poison-bow-admixture.md).
Poison I/II/III are now reviewed as six context-only pairs. On-hit chance is
separate from inherent burst/cloud Poison; only explicit Bleeding activates
III's native magnitude modifier. Chance and conditional magnitude do not
multiply route scores or broaden hit scope. See
[the checkpoint](build-focus-poison-bow-poison-supports.md).
Bursting Plague is now reviewed as two context-only pairs, separating enemy-capped
storage and the granted player-owned Physical burst from Poison DPS. Native
storage/burst handlers are missing; zero native damage is not zero game damage.
No kills, cap saturation, burst cadence or boss uptime is assumed. See
[the checkpoint](build-focus-poison-bow-bursting-plague.md).
Escalating Poison is now reviewed
as two context-only pairs; native slow-firing controls show why extra capacity
is not a guaranteed damage gain. Skill Effect Duration affects Poisonburst's
linked Poison, not Gas cloud's separate outgoing Poison timer. See
[the checkpoint](build-focus-poison-bow-escalating-support.md).
Mobility and Deliberation are now reviewed
as four context-only pairs, keeping firing penalties, global Movement Speed and
Poison-source damage distinct. The isolated native check covers all five skill
components and records PoB's rounded combined penalty separately from raw
source arithmetic. See [the checkpoint](build-focus-poison-bow-movement-supports.md).
Older workstream proposals below remain backlog, not authorization to begin.

Next proposed coherent batch: Cooldown Recovery I/II and Second Wind I/II/III
for the reviewed base-use Warcries. Positive-tier catalog entries exist, but
cooldown eligibility, stored uses, recovery penalties, costs and charge/bypass
interactions require review before admitting pairs. This is a proposal, not
authorization to start. Echoing Cry and Corrupting Cry I/II now add fourteen
context-only pairs: Echoing excludes Ancestral's existing use condition, while
Corrupting covers all five parents with a separate player-owned Physical DoT.
Configured stack caps are not proof of sustained stacks or repeat cadence.
Raging Cry, Exposing Cry and Enraged Warcry now add fourteen context-only pairs:
all five parents for Raging, Seismic's own hit for Exposing, and the four
cooldown-based parents for Enraged. Native type compatibility is broader than
these useful scopes and does not prove resource transactions or on-hit Exposure.
Ferocious socketed replacement, the ten-Incision variant and Fireball
Concentrated Area remain separate, held reviews.

The ten-spell batch adds Arc, Ball Lightning, Frostbolt, Ice Nova, Comet,
Firestorm, Eye of Winter, Frost Bomb, Flameblast and Frost Wall after native
component review. All ten have positive-tier catalog entries. Their presets are
hit-focused heuristics, not complete component, Infusion or performance models.
Only Frostbolt gains spell-projectile-speed scope; Arc/Eye have no area scope.

Two support checkpoints now cover the original casting/projectile families and
four more area/duration/resource/movement families for reviewed focuses. The
nine-candidate chaos/physical batch is now reviewed: Contagion, Bonestorm,
Bone Cage, Despair, Vulnerability, Hexblast, Unearth, Detonate Dead and Dark Effigy.
Hit, DoT and non-damaging curses remain separate, with limited corpse/proxy
components documented. Magnified Area, Prolonged Duration, Mobility and Rapid
Casting (Arcane Tempo game IDs) are now reviewed across these focuses. The
Considered Casting, Spell Echo, Projectile Acceleration and Brutality review is
also complete, with explicit non-hit/proxy/damage-removal exclusions. Bonestorm
III remains held for a native spell-only speed/damage-conversion discrepancy.
The eight minion/Offering presets are now reviewed: Skeletal Sniper, Frost Mage,
Storm Mage, Brute, Cleric, Reaver, Bone Offering and Pain Offering. Native checks
separate player modifiers, minion attacks, minion spell actions and Offering
utility. Cleric revival, Offering-spike Life/shield strength, commands and full
minion DPS remain unmodeled. Twenty-six reviewed companion pairs extend existing
support choices. Fireball's Concentrated Area review remains explicitly on hold.

After the Companion batch, 1,604/2,182 distinct main-tree wordings and
2,742/5,451 occurrences remain unrecognized. Skills are 41/399 configured
(358 unconfigured; 193 of 234 positive-tier entries unconfigured); supports remain
31/567 choices (536 unconfigured). Of the
31 support choices, twenty are still context/warning-only or partial. Neither all remaining
wording nor all unconfigured entries is necessarily eligible for the current
heuristic. Their source review and the deeper-mechanic workstreams remain open.

The minion-effect batch adds eight opt-in categories for Critical Hit Chance,
Critical Damage Bonus, Area of Effect, Movement Speed and separate Fire/Cold/
Lightning/Chaos resistances. All-elemental wording contributes once to each
selected elemental channel, not an aggregate or Chaos. Maximum resistance stays
separate; no cap, mitigation or damage multiplier is inferred. The unsigned zero
Chaos-resistance line remains unscored after an incomplete native parse.
The minion-defence batch adds six opt-in preferences for Evasion Rating,
additional Physical Damage Reduction, Life Recoup and separate maximum elemental
resistances. Native cap/timing checks do not turn scalar scoring into actual
mitigation or sustain; recoup timing and maximum/ordinary resistance stay separate.
Negative recoup wording remains excluded after incomplete native parsing.
The minion command/utility batch adds four explicit categories for Command Skill
damage/cooldown recovery, temporary Minion Duration and Reservation Efficiency of
Minion Skills. Selected Gas Arrow and basic shots remain distinct; native lifetime
and rounded reciprocal reservation checks do not imply full DPS or summon counts.
Per-different-minion command bonuses and command Mana cost efficiency are excluded.
The Companion batch adds ten opt-in categories for damage, maximum Life, attack/
movement speed, Area of Effect, four resistances and reservation efficiency.
Native Companion-only bonuses exclude ordinary skeletons and player stats;
broader minion bonuses can also benefit Companions and remain separate choices.
Area modifiers do not create an area component on basic single-target attacks.
Presence conditions, transfers, damage-as-extra, cast speed and Trusted Kinship's
composite limits/more/less rules remain excluded.
Next recommended batch: Attack Area Damage, Elemental Damage with Attacks and
Critical Spell Damage Bonus, with explicit skill/component ownership checks.
Companion state/transfer mechanics and revival still require deeper review.
Gear-derived Deflection and Armour-to-elemental mitigation need a separate
applicability design, not automatic percentage scoring for coverage gains.

The latest passive batches complete literal Elemental Ailment Threshold,
generic Cooldown Recovery Rate, Life/Mana flask recovery, unqualified
Life/Mana/ES recoup, charges-gained modifiers and flat Life/Mana flask generation.
The broad utility/recovery checkpoint adds Stun Recovery, Presence area, generic
skill movement-penalty reduction, Life/Mana leech amount, Life leech delivery
speed and generic/Mana flask cost reductions. The area, duration, resource and
movement-handling support checkpoint is now complete as
compatibility/context coverage, not full effect simulation. The nine-candidate
spell/curse review, both utility and hit-support extensions, and the eight-preset
minion/Offering review are complete within their documented scopes.
Other recovery/utility families remain backlog.
In particular, 32 slowing-potency and ten recoup-speed occurrences were reviewed
but remain unscored because the local native parser does not fully recognize
their wording. Game descriptions alone do not establish their complete behavior.

## Batch Ledger

- Starting point: 44 preferences; 370/2,182 wordings; 2,129/5,451 occurrences;
  14/399 skill presets and 14/567 support choices.
- Casting-support checkpoint (retrospectively reconciled): choices 14/567 ->
  21/567; families 11 -> 14; curated pairs 44 -> 102. Seven new choices across
  five reviewed families, including existing families extended to new focuses.
  A fresh native rerun evaluated 90 base-self-cast pairs and four exclusions;
  all 58 newly admitted app pairs match the exported compatibility matrix.
  The preceding 1,059-test release included the support tests; the current
  combined 1,087-test release passed all tests, typecheck, production build,
  graph validation and coverage comparison alongside newer passive work.
  This does not claim a completed historical browser flow, native validation of
  all older pairs or complete support mechanics. Eleven choices supply explicit
  refinement/priority behavior and ten are context-only/partial. Nine otherwise
  legal new projectile pairs remain withheld. See
  `research/2026-11-07-casting-support-checkpoint.md` for evidence and limits.
- Elemental/ailment batch: 15 opt-in categories, 220 newly recognized occurrences
  across 203 nodes and 70 newly recognized wordings. After: 59 preferences;
  440/2,182 wordings (20.2%); 2,349/5,451 occurrences (43.1%). Skills/supports
  remain 14/399 and 14/567. Focused validation passed 581 tests plus typecheck
  and the prior coverage baseline. Final release validation passed 898 tests in
  59 files, typecheck, production build, graph validation and the reviewed new
  baseline. Native parser/ModDB checks passed all 26 forms/signs/ownership probes.
  No final checks failed. Browser matrix and real-character Full DPS evaluation
  were not run for this metadata/parser-only batch. No commit or deployment made.
- Ten-spell preset batch: skills 14/399 -> 24/399; positive-tier skills 14/234 ->
  24/234. Supports stay 14/567, with 11 families and 44 reviewed pairs. Preference
  categories stay 59; distinct wording stays 440/2,182; occurrences stay
  2,349/5,451. Existing union wording already covered the reused scopes, so no
  new passive coverage is claimed. All old contexts retain their matches; ten
  new focus contexts were reviewed before deliberate baseline refresh.
  Native component checks passed 40 assertions plus an exact identity/tag/scope
  comparison for all ten presets. Focused validation passed 663 tests, typecheck
  and the prior baseline. Edge smoke checks passed at 1100x760 and 390x844 with
  fitting updated tooltips, no horizontal overflow, explicit apply and preserved
  choices across a focus change. Only the existing favicon 404 appeared. Final
  release validation passed 980 tests in 59 files, typecheck, production build,
  graph validation and the refreshed baseline. No final checks failed. No full
  character DPS or cross-browser matrix was run, and no commit/push/deployment
  was performed.
- Threshold/cooldown/flask batch: four opt-in categories; 78 newly recognized
  occurrences on 78 nodes and 24 new wordings. Preferences 59 -> 63; wordings
  440/2,182 -> 464/2,182; occurrences 2,349/5,451 -> 2,427/5,451 (44.5%).
  Skills remain 24/399 and supports remain 21/567 in the current working copy;
  no gem/support definitions changed in this batch. Native parser/ModDB checks
  passed ten wording/sign probes. Focused validation passed 712 tests, typecheck
  and the prior baseline. All 24 additions were reviewed before baseline refresh.
  Final release validation passed 1,029 tests in 59 files, typecheck, production
  build, graph validation and the refreshed baseline. No final checks failed. See
  `research/2026-11-07-threshold-cooldown-flask-preferences.md` for exclusions,
  fixtures and final checks. No commit, push or deployment performed.
- Recoup/flask-charge batch: eight opt-in categories, 51 new recognized
  occurrences on 51 nodes and 16 new wordings. Preferences 63 -> 71; wordings
  464/2,182 -> 480/2,182 (22.0%); occurrences 2,427/5,451 -> 2,478/5,451
  (45.5%). Skills/supports are unchanged. Native parser/ModDB checks passed
  16 forms and independent arithmetic; focused validation passed 742 tests,
  typecheck and the prior baseline. All 16 additions were reviewed before
  baseline refresh. Final release validation passed 1,059 tests in 60 files,
  typecheck, production build, graph validation and the refreshed baseline.
  No final checks failed. See
  `research/2026-11-07-recoup-flask-charge-preferences.md` for exact units,
  exclusions and final checks. No commit, push or deployment performed.
- Broad utility/recovery checkpoint: eight preferences; 106 added occurrences
  on 102 nodes and 38 new wordings. Preferences 71 -> 79; wording
  480/2,182 -> 518/2,182 (23.7%); occurrences 2,478/5,451 -> 2,584/5,451
  (47.4%). All previous matches/fingerprints preserved. Native probes passed
  15 forms and independently confirmed three explicit deferrals. Focused checks
  passed 770 tests; release checks passed 1,087 tests in 61 files, typecheck,
  production build, graph validation and the refreshed baseline. Slowing
  protection, recoup speed and unreviewed movement aliases remain unsupported.
  No final checks failed; no commit, push, publish or deployment performed. See
  `research/2026-11-07-utility-recovery-preferences.md`.
- Utility-support checkpoint: seven context-only choices across four new
  families, 49 added curated pairs. Choices 21/567 -> 28/567 (4.9%); families
  14 -> 18; pairs 102 -> 151. Seventy native compatibility pairs and four
  exclusions checked; all 49 admitted app pairs independently compared to native
  data. Six legal duration pairs remain withheld for component review. No passive
  wording, preference priorities or shortest behavior changed. Focused validation
  passed 809 tests, typecheck and the unchanged baseline. Final release validation
  passed 1,126 tests in 61 files, typecheck, production build, graph validation
  and the unchanged baseline. No final checks failed; no commit or deployment.
  See `research/2026-11-07-utility-support-refinements.md`.
- Chaos/physical spell and curse checkpoint: nine presets, including five requested
  skills and four related roadmap candidates. Skills 24/399 -> 33/399 (8.3%);
  positive-tier skills 24/234 -> 33/234 (14.1%). Support choices remain 28/567
  across 18 families; 29 companion pairs raise the total 151 -> 180. Preferences
  remain 79; wording stays 518/2,182 and occurrences stay 2,584/5,451. All old
  matches/fingerprints preserved; nine new focus contexts reviewed before baseline
  refresh. Native checks passed 31 component assertions and 63 compatibility
  pairs; independent app comparisons verified nine identities/tag sets and all
  29 admitted new support pairs. Focused validation passed 873 tests; final release
  passed 1,190 tests in 62 files, typecheck, production build, graph validation
  and the refreshed baseline. Edge tooltip/opt-in/focus-switch smoke passed at
  1100x760 and 390x844 with no horizontal overflow; only the existing favicon 404.
  Corpse/proxy/duration limits and withheld pairs remain explicit; no full DPS
  or cross-browser matrix claimed. No final check failed; no commit/deployment.
  See `research/2026-11-07-chaos-physical-spell-presets.md`.
- Chaos/physical utility-support checkpoint: four existing families, eight
  choices, 62 new curated pairs; total 180 -> 242. Skills stay 33/399, support
  choices 28/567, families 18, preferences 79, wording 518/2,182 and occurrences
  2,584/5,451. Arcane Tempo game IDs map to existing Rapid Casting entries rather
  than duplicate choices. Native review evaluated 80 parent/linked-component
  pairs and passed 28 identity/type/constant assertions. Independent comparison
  verified 62 admitted pairs and eight catalog identities; 21 synthetic native
  cases passed 33 independent calculation checks. Four legal duration pairs stay
  withheld for out-of-focus or unconfirmed effects. Focused checks passed 910
  tests; final release passed 1,227 tests in 62 files, typecheck, production build,
  graph validation and unchanged coverage baseline. No shared-control/layout
  implementation changed, so no repeated browser matrix. No full-character DPS
  claim, final check failure, commit or deployment. See
  `research/2026-11-07-chaos-physical-utility-supports.md`.
- Chaos/physical hit-support checkpoint: 24 new curated pairs, total 242 -> 266.
  Three Brutality choices raise supports 28/567 -> 31/567 (5.5%) and families
  18 -> 19. Skills remain 33/399, preferences 79, wording 518/2,182 and occurrences
  2,584/5,451. Eighty native component pairs and 25 scope/constant assertions
  reviewed; independent app/catalog comparison verified 24 admitted pairs and
  eight identities. Forty-four synthetic cases passed 81 independent checks.
  Sixteen legal pairs remain withheld for explicit non-hit/proxy/damage-removal
  or projectile-scope concerns. Bonestorm III is not enabled after spell-only
  projectile speed changed delivery but not observed native damage. Brutality
  filters fresh suggestions and warns about retained manual weights, without
  inventing damage/penetration multipliers. Focused validation passed 954 tests;
  final release passed 1,271 tests in 62 files, typecheck, production build, graph
  validation and unchanged coverage baseline. No shared-control/layout or schema
  implementation changed; no repeated browser matrix, real-character DPS claim,
  final failure, commit or deployment. See
  `research/2026-11-07-chaos-physical-hit-supports.md`.
- Minion/Offering preset checkpoint: eight presets, skills 33/399 -> 41/399
  (10.3%), positive-tier 33/234 -> 41/234 (17.5%). Twenty-six companion pairs
  raise the total 266 -> 292; support choices stay 31/567 across 19 families.
  Preferences remain 79, wording 518/2,182 and occurrences 2,584/5,451. All old
  matches/fingerprints preserved; eight new contexts reviewed before baseline
  refresh. Native review checked 72 support pairs and eight component identities;
  66 synthetic cases passed 137 independent ownership/arithmetic checks. All 26
  admitted pairs and eight exact identities/tag sets agree with the app. Player,
  minion attack/spell and Offering utility ownership stay separate; Cleric
  revival and spike Life/shield strength remain unmodeled. Focused validation
  passed 1,027 tests; release passed 1,344 tests in 63 files, typecheck,
  production build, graph validation and the refreshed baseline. No shared
  UI/layout or schema implementation changed; no repeated browser matrix,
  real-character DPS claim, final failure, commit or deployment. See
  `research/2026-11-07-minion-offering-presets.md`.
- Minion-effect checkpoint: eight opt-in preferences, 79 -> 87; eighteen new
  wordings across 38 nodes. Wording 518/2,182 -> 536/2,182 (24.6%); occurrences
  2,584/5,451 -> 2,622/5,451 (48.1%). Skills stay 41/399, supports 31/567, families
  19 and pairs 292. All 42 contexts preserve old matches and gain exactly the
  reviewed eighteen wordings; fingerprints unchanged. Eighteen signed native
  forms, forty actor cases and 206 independent checks verify ownership, arithmetic
  and resistance fanout. Maximum resistance remains unscored; an unsigned zero
  line is explicitly deferred after incomplete native parsing. Focused validation
  passed 1,056 tests; release passed 1,373 tests in 64 files, typecheck,
  production build, graph validation and refreshed baseline. Shared/base-node
  rewards, reductions, UI controls and catalog-wide save/transfer checks pass.
  No shared UI/layout or schema implementation change, repeated browser matrix,
  Full DPS/mitigation claim, final failure, commit or deployment. See
  `research/2026-11-07-minion-effect-preferences.md`.
- Minion-defence checkpoint: six opt-in preferences, 87 -> 93; eleven new
  wordings across fifteen nodes add sixteen occurrences. Wording 536/2,182 ->
  547/2,182 (25.1%); occurrences 2,622/5,451 -> 2,638/5,451 (48.4%). Skills stay
  41/399, supports 31/567, families 19 and pairs 292. All 42 contexts preserve
  old matches and gain the eleven reviewed wordings; fingerprints unchanged.
  Fifteen native forms and 39 actor/cap/timing cases passed 304 independent
  checks. Maximum/ordinary resistance and recoup timing remain separate; raw
  scores are not capped mitigation or sustain. Negative recoup remains excluded
  after incomplete native parsing. A probe-only repeated-defence issue was fixed
  with once-per-actor pre-calculation injection and independently checked.
  Focused validation passed 1,079 tests; release passed 1,396 tests in 65 files,
  typecheck, production build, graph validation and refreshed baseline. No shared
  UI/layout, routing contract or schema implementation change, repeated browser
  matrix, real-character performance claim, final failure, commit or deployment.
  See `research/2026-11-07-minion-defence-preferences.md`.
- Minion command/utility checkpoint: four opt-in preferences, 93 -> 97; sixteen
  wordings across 23 nodes add 23 occurrences. Wording 547/2,182 -> 563/2,182
  (25.8%); occurrences 2,638/5,451 -> 2,661/5,451 (48.8%). Skills stay 41/399,
  supports 31/567, families 19 and pairs 292. All 42 contexts preserve old
  matches and gain the sixteen reviewed wordings; fingerprints unchanged.
  Eight signed/scoped native forms and 27 actor fixtures passed 119 independent
  checks, including actual selected Gas Arrow versus basic shots, temporary
  versus persistent duration and rounded reciprocal reservation costs. No forced
  conditions or engine patches in the final actor fixtures. State-dependent
  command bonuses and command Mana cost efficiency remain excluded. Focused
  validation passed 1,097 tests; release passed 1,414 tests in 66 files, typecheck,
  production build, graph validation and refreshed baseline. No shared UI/layout,
  routing contract or schema implementation change, repeated browser matrix,
  Full DPS/summon-count claim, final failure, commit or deployment. See
  `research/2026-11-07-minion-command-preferences.md`.
- Companion checkpoint: ten opt-in preferences, 97 -> 107; fifteen wordings
  across 44 nodes add 48 occurrences. Wording 563/2,182 -> 578/2,182 (26.5%);
  occurrences 2,661/5,451 -> 2,709/5,451 (49.7%). Skills stay 41/399, supports
  31/567, families 19 and pairs 292. All 42 contexts preserve old matches and
  gain the fifteen reviewed wordings; fingerprints unchanged. Twenty-two signed
  native scopes and 56 actor fixtures passed 268 independent checks. Real Rhoa,
  ordinary skeleton and player controls distinguish Companion-only effects while
  explicitly confirming broader minion bonuses can affect Companions. Area
  modifiers do not create an area for basic attacks; caps and rounded reciprocal
  reservation remain separate from raw score. Presence, transfers, conversions,
  cast speed and Trusted Kinship composites stay excluded. Focused validation
  passed 1,133 tests; release passed 1,450 tests in 67 files, typecheck,
  production build, graph validation and refreshed baseline. No shared UI/layout,
  routing contract or schema implementation change, repeated browser matrix,
  Full DPS/mitigation/count claim, final failure, commit or deployment. See
  `research/2026-11-07-companion-preferences.md`.
- Scoped attack/spell damage checkpoint: one opt-in preference, 107 -> 108;
  Attack Area Damage has six explicitly reviewed attack focuses, attack-only
  Elemental Damage six native-elemental focuses, and Critical Spell Damage
  Bonus seventeen spell-hit focuses. Eight new wordings add 49 occurrences;
  wording 578/2,182 -> 586/2,182 (26.9%), occurrences 2,709/5,451 ->
  2,758/5,451 (50.6%). Skills stay 41/399, supports 31/567, families 19 and
  pairs 292. All 42 contexts retain old matches and both source fingerprints.
  Native signed parser/ModDB and component allowlists passed; attack coverage
  is not assumed to imply area damage. Controlled Destruction blocks scoped
  spell critical bonus without deleting generic manual preferences. Focused
  validation passed 1,169 tests; final release passed 1,486 tests in 68 files,
  typecheck, production build, graph validation and refreshed coverage baseline.
  Shared tooltip additions received a local Edge smoke at 1280x720 and 1440x900;
  component warnings render and the blocked-crit tooltip fits its viewport.
  Existing favicon 404 is unrelated. No new automatic weights, routing/schema
  implementation change, Full DPS claim, commit or deployment. See
  `research/2026-11-07-scoped-attack-spell-damage.md`.
- Totem checkpoint: six opt-in preferences, 114 total; Damage, Life, Placement
  Speed, Duration and separate Attack/Cast Speed. Fifteen wordings add 56
  occurrences: wording 586/2,182 -> 601/2,182 (27.5%), occurrences 2,758/5,451
  -> 2,814/5,451 (51.6%). Skills stay 41/399, supports 31/567, families 19 and
  pairs 292. All 42 contexts preserve previous matches/fingerprints and gain
  exactly the reviewed fifteen lines. Twelve signed native parser forms and
  61 fresh actor fixtures passed 306 independent ownership/arithmetic checks.
  Linked totem spell/attack components, player self-use and ordinary minions
  stay separate. Placement time is reciprocal, Life rounded and duration
  tick-rounded; literal damage modifiers are not claimed to predict linear DPS.
  Focused validation passed 1,197 tests; final release passed 1,514 tests in
  69 files, typecheck, production build, graph validation and refreshed baseline.
  Existing parameterized control/storage checks cover the new metadata; no
  shared control/layout implementation changed and no repeated browser matrix
  was run. Local port 5174 restarted and verified HTTP 200. No automatic weights,
  routing/schema changes, Full DPS claim, commit or deployment. See
  `research/2026-11-07-totem-preferences.md`.
- Totem coverage/defence checkpoint: ten opt-in preferences, 124 total; Totem
  area, placement range, ordinary/maximum Fire/Cold/Lightning resistance, PDR
  and percent-Life regeneration. Twelve wordings add thirteen occurrences:
  wording 601/2,182 -> 613/2,182 (28.1%), occurrences 2,814/5,451 -> 2,827/5,451
  (51.9%). Skills stay 41/399, supports 31/567, families 19 and pairs 292.
  All 42 contexts preserve old matches/fingerprints. Thirty-five native fixtures
  and all thirteen extracted game-stat occurrences passed 624 independent
  ownership/cap/source-unit checks. Placement range and regeneration use
  confirmed game descriptors where native text parsing is incomplete; signed
  resistance text gaps are recorded rather than claimed as parsed. Ordinary
  resistance caps at 75 by default and at 90 with sufficient maximum resistance;
  caps alone do not supply ordinary resistance. Raw PDR/recovery weights are not
  actual totem mitigation/sustain calculations. Focused validation passed 1,228
  tests; final release passed 1,545 tests in 70 files, typecheck, production
  build, graph validation and refreshed baseline. Metadata-only picker/tooltips
  use existing controls and parameterized persistence tests, without a repeated
  browser matrix. Local port 5174 verified HTTP 200. No automatic priorities,
  routing/schema changes, Full DPS claim, commit or deployment. See
  `research/2026-11-07-totem-defence-preferences.md`.
- Generic damage/speed/Chill checkpoint: three opt-in preferences, 127 total.
  Twenty-two wordings add 53 occurrences, not the positive-only estimate of 47:
  generic Damage 21 (three penalties), Skill Speed 19 (three penalties), Chill
  Magnitude 13. Wording 613/2,182 -> 635/2,182 (29.1%), occurrences 2,827/5,451
  -> 2,880/5,451 (52.8%). Skills remain 41/399, supports 31/567, families 19,
  pairs 292. All 42 contexts preserve previous matches/fingerprints and gain
  exactly the reviewed twenty-two lines. Six signed native parser forms and
  31 fresh actor fixtures passed 220 independent ownership/fan-out/source-sign
  checks, including all 53 raw game stats. Skill Speed scores once rather than
  being copied into attack/cast/totem speed; separate genuine stat lines remain
  independent. Generic damage can be inherited by player-owned proxies, not
  ordinary minions. Chill modifier/cap checks do not claim actual generated
  enemy slow or a Full DPS model. Focused validation passed 1,246 tests; final
  release passed 1,563 tests in 71 files, typecheck, production build, graph
  validation and refreshed baseline. No shared-control/schema/solver changes,
  automatic priorities, repeated browser matrix, commit or deployment. Local
  port 5174 verified HTTP 200. See
  `research/2026-11-07-generic-damage-speed-chill-preferences.md`.
- Ailment chance checkpoint: four opt-in preferences, 131 total. Flat Poison,
  Bleeding and Daze chance remain separate from increased/reduced generic ailment
  chance. Eleven wordings add 68 occurrences (13/17/17/21), with no raw negative
  values in this snapshot. Wording 635/2,182 -> 646/2,182 (29.6%), occurrences
  2,880/5,451 -> 2,948/5,451 (54.1%). All 42 contexts preserve previous matches
  and source fingerprints. Eight signed native parser forms and 27 actor fixtures
  passed 277 independent type/ownership/arithmetic/source checks, including all
  68 raw stats. Poison/Bleeding caps and multiplicative base/relative arithmetic
  are verified; final Daze probability and actual ailment eligibility are not
  claimed. Minion raw modifiers are verified without fabricating omitted chance
  outputs. Focused validation passed 1,264 tests in 28 files and typecheck/no-loss
  coverage. Final release passed 1,581 tests in 72 files, typecheck, production
  build, graph validation and refreshed baseline; local port 5174 returns HTTP
  200. No automatic priorities, shared-control/schema/solver changes,
  repeated browser matrix, Full DPS claim, commit or deployment. See
  `research/2026-11-07-ailment-application-preferences.md` for limits and final checks.
- Ailment buildup/duration checkpoint: five opt-in preferences, 136 total.
  Electrocute/Pin Buildup, Daze Duration and generic damaging-ailment magnitude/
  duration add fourteen wordings and 35 occurrences (11/10/1/4/9). Wording
  646/2,182 -> 660/2,182 (30.2%), occurrences 2,948/5,451 -> 2,983/5,451 (54.7%).
  All 42 contexts retain previous matches/fingerprints. Eight complete signed
  native forms and 30 actor fixtures passed 651 independent ownership/type/
  arithmetic/source checks, including all 35 raw game stats. Daze parsing remains
  partial; exact game descriptors supply its literal preference, not an invented
  native duration calculation. Generic modifiers score once without copying to
  each ailment; mixed-node penalties remain. Actual buildup/application and
  final uptime are not calculated. Focused validation passed 1,289 tests in 29
  files, typecheck and no-loss coverage. Final release passed 1,606 tests in 73
  files, typecheck, production build, graph validation and refreshed baseline.
  Main bundle 501.20 kB triggers Vite's size warning, not a build failure; local
  port 5174 returns HTTP 200. No automatic priorities, shared-control/
  schema/solver changes, repeated browser matrix, Full DPS claim, commit or
  deployment. See `research/2026-11-07-ailment-buildup-duration-preferences.md`
  for native limitations and final checks.
- Incoming debuff checkpoint: four opt-in defensive preferences, 140 total.
  Slow potency, incoming Curse effect and incoming Chill/Shock effect add 25
  wordings and 59 occurrences (32/12/8/7). All 59 raw effects are negative
  reductions, inverted into beneficial preference values; increased incoming
  effect remains a penalty. Wording 660/2,182 -> 685/2,182 (31.4%), occurrences
  2,983/5,451 -> 3,042/5,451 (55.8%). All 42 contexts retain previous matches/
  fingerprints. Six complete signed native forms and 22 fixtures passed 406
  independent sign/ownership/floor/cap/source checks, including all 59 raw stats.
  Slowing Potency is descriptor-backed with no fabricated native effect. Zero
  curse/Chill effect is not immunity; raw and actual capped fields stay distinct.
  No outgoing fan-out or automatic priorities. Quick validation passed 1,310
  tests in 30 files, typecheck and no-loss coverage. Final release passed 1,627
  tests in 74 files, typecheck, production build, graph validation and refreshed
  baseline. Local port 5174 returns HTTP 200; existing main-chunk size warning
  remains at 503.23 kB minified, not a build failure. No shared-control/schema/
  solver changes, repeated browser matrix, Full DPS claim, commit or deployment.
  See `research/2026-11-07-incoming-debuff-protection.md` for limits and final checks.
- Player resistance checkpoint: seven opt-in defensive preferences, 147 total.
  Fire/Cold/Lightning/Chaos ordinary resistance and separate maximum elemental
  resistance add 24 wordings and 45 occurrences, including two penalty lines.
  Wording 685/2,182 -> 709/2,182 (32.5%), occurrences 3,042/5,451 -> 3,087/5,451
  (56.6%). All 42 contexts retain old matches/fingerprints. Eighteen signed
  native forms and 28 fixtures passed 955 independent ownership/cap/floor/source
  checks, including every raw graph line. All-elemental does not include Chaos;
  caps do not supply resistance. Native 75% default maximum, 90% upper maximum,
  lowered caps, -200% floor and truncation are verified, not installed as a
  gear-aware mitigation model. Conditional maximum bonuses remain excluded.
  Quick validation passed 1,343 tests in 31 files, typecheck and no-loss coverage.
  Final release passed 1,660 tests in 75 files, typecheck, production build, graph
  validation and refreshed baseline. Local port 5174 returns HTTP 200; existing
  main-chunk size warning remains at 505.46 kB minified, not a build failure.
  No automatic priorities, shared-control/schema/solver changes, repeated browser
  matrix, performance claim, commit or deployment. See
  `research/2026-11-07-player-resistance-preferences.md` for limits and final checks.
- Armour Break checkpoint: three opt-in preferences, 150 total. Amount, Fully
  Broken Armour effect and duration add twelve wordings and 35 occurrences
  (21/10/4). Wording 709/2,182 -> 721/2,182 (33.0%), occurrences 3,087/5,451 ->
  3,122/5,451 (57.3%). All 42 contexts preserve previous matches/fingerprints.
  Three complete native parser forms and 17 final valid-weapon actor/state cases
  pass 208 independent ownership/prerequisite/arithmetic/source checks. Native
  reduced amount and duration parser gaps are explicit; signed game descriptors
  supply the literal scorer, not fabricated runtime effects. Fully-broken target
  state is configured for native effect checks, not automatically granted by
  preferences. No application or guaranteed uptime/DPS is implied. Quick
  validation passed 1,360 tests in 32 files, typecheck and no-loss coverage.
  Final release passed 1,677 tests in 76 files, typecheck, production build, graph
  validation and refreshed baseline. Local port 5174 returns HTTP 200; existing
  main-chunk size warning remains at 507.02 kB minified, not a build failure.
  No automatic suggestions, shared-control/schema/solver changes, repeated browser
  matrix, commit or deployment. See
  `research/2026-11-08-armour-break-preferences.md` for limits and final checks.
- Resource sustain/expiry checkpoint: three opt-in preferences, 153 total.
  Percentage-Life regeneration source, Mana Cost Efficiency and incoming debuff
  expiry add fourteen wordings and 32 occurrences (12/11/9). Wording 721/2,182
  -> 735/2,182 (33.7%), occurrences 3,122/5,451 -> 3,154/5,451 (57.9%). All 42
  contexts preserve old matches/fingerprints. Four complete native forms and
  15 final actor fixtures passed 225 independent ownership/source/rate/reciprocal/
  source-unit checks, including every raw graph occurrence. Per-minute source
  values are converted before display, not divided again by the matcher.
  Efficiency and expiry are reciprocal, not flat subtractions. Native slower
  expiry is unparsed and game-backed; negative regeneration source is excluded.
  No actual sustain/cost/protection model is claimed. Quick validation passed
  1,376 tests in 33 files, typecheck and no-loss coverage.
  Final release passed 1,693 tests in 77 files, typecheck, production build, graph
  validation and refreshed baseline. Local port 5174 returns HTTP 200; existing
  main-chunk size warning remains at 508.73 kB minified, not a build failure.
  No automatic priorities, shared-control/schema/solver changes, repeated browser matrix, commit or
  deployment. See `research/2026-11-08-resource-sustain-expiry.md` for limits and
  final checks.
- Recoup/on-Kill/flask-duration checkpoint: four opt-in preferences, 157 total.
  Twelve wordings and 28 occurrences (10/6/6/6) added. Wording 735/2,182 ->
  747/2,182 (34.2%), occurrences 3,154/5,451 -> 3,182/5,451 (58.4%). All 42
  contexts preserve old matches and source fingerprints before deliberate
  baseline refresh. Five complete native forms, 18 actor fixtures and every raw
  source occurrence pass 159 independent checks. Recoup speed is game-backed
  but only partially parsed by PoB; negative Mana on Kill has a native parser
  mismatch. Both gaps are explicit, not counted as native mechanic support.
  Recovery per eligible event is not a kill rate or regeneration. Duration can
  extend flask total recovery without increasing per-second recovery, and is
  scored only as duration. Separate amount/rate/charge effects remain separate;
  no actual sustain or uptime simulation is claimed. Quick validation passed
  1,396 tests in 34 files, typecheck and no-loss coverage. One final release
  passed 1,713 tests in 78 files, typecheck, production build, graph validation
  and refreshed baseline. Local port 5174 returns HTTP 200. Existing main-chunk
  warning remains at 510.85 kB minified / 136.66 kB gzip, not a build failure.
  No automatic priorities, shared-control/schema/solver changes, repeated browser
  matrix, commit or deployment. See
  `research/2026-11-08-recoup-kill-flask-duration.md` for evidence and limits.
- Warcry utility checkpoint: three opt-in preferences, 160 total. Ten wordings
  and 28 occurrences (13/12/3) added across 24 nodes. Wording 747/2,182 ->
  757/2,182 (34.7%), occurrences 3,182/5,451 -> 3,210/5,451 (58.9%). All 42
  contexts preserve old matches and fingerprints before deliberate baseline
  refresh. Six complete native signed forms, 27 actor fixtures and all raw
  occurrences pass 142 independent scope/ownership/time/cooldown/area/overlap/
  source checks. Generic bonuses score only in generic categories; scoped
  bonuses score only in Warcry categories. Separate genuine lines add once.
  Speed, cooldown and coverage stay separate from damage/empowerment and actual
  use frequency. Instant-use and ignore-cooldown controls demonstrate limits
  that the raw scorer does not simulate. Quick validation passed 1,413 tests in
  35 files, typecheck and no-loss coverage. One final release passed 1,730 tests
  in 79 files, typecheck, production build, graph validation and refreshed
  baseline. Local port 5174 returns HTTP 200. Existing main-chunk warning remains
  at 512.46 kB minified / 136.95 kB gzip, not a build failure. No automatic
  priorities, shared-control/schema/solver changes, repeated browser matrix,
  commit or deployment. See `research/2026-11-08-warcry-utility-preferences.md`.
- Incoming ailment checkpoint: three opt-in preferences, 163 total. Twelve
  wordings and 19 occurrences (8/8/3) added. Wording 757/2,182 -> 769/2,182
  (35.2%), occurrences 3,210/5,451 -> 3,229/5,451 (59.2%). All 42 contexts
  preserve old matches and fingerprints before deliberate baseline refresh.
  Six complete signed native forms, 19 actor fixtures and all raw occurrences
  pass 375 independent sign/ownership/threshold-gap/magnitude/duration/expiry/
  source checks. Freeze Threshold parses but has no player calculation/output
  in the reviewed runtime; the tooltip discloses that gap. Incoming magnitude,
  duration and reciprocal expiry sources remain separate from outgoing effects,
  avoidance and immunity; raw scores are not capped protection. Generic duration
  scores once, not per ailment. Quick validation passed 1,430 tests in 36 files,
  typecheck and no-loss coverage. One final release passed 1,747 tests in 80
  files, typecheck, production build, graph validation and refreshed baseline.
  Local port 5174 returns HTTP 200. Existing main-chunk warning remains at
  514.14 kB minified / 137.23 kB gzip, not a build failure. No automatic
  priorities, shared-control/schema/solver changes, repeated browser matrix,
  commit or deployment. See `research/2026-11-08-incoming-ailment-preferences.md`.
- Generic ailment/control checkpoint: three opt-in preferences, 166 total.
  Eleven wordings and 28 occurrences (8/8/12) added. Wording 769/2,182 ->
  780/2,182 (35.7%), occurrences 3,229/5,451 -> 3,257/5,451 (59.8%). All 42
  contexts preserve old matches and fingerprints before deliberate baseline
  refresh. Four complete native signed forms, 21 actor fixtures and all raw
  occurrences pass 439 independent magnitude/buildup/ownership/stacking/
  application/source checks. Outgoing Slow Magnitude is a game-backed native
  parser gap disclosed in the tooltip, not a calculated enemy-speed benefit.
  Generic modifiers count once, not again in specific ailment preferences.
  Separate genuine lines add once; magnitude, buildup, slow, hit damage, duration
  and incoming protection remain distinct. Application/uptime/DPS is not inferred.
  Lasting Trauma retains its Attack Speed penalty. Quick validation passed
  1,447 tests in 37 files, typecheck and no-loss coverage. One final release
  passed 1,764 tests in 81 files, typecheck, production build, graph validation
  and refreshed baseline. Local port 5174 returns HTTP 200. Existing main-chunk
  warning remains at 515.86 kB minified / 137.56 kB gzip, not a build failure.
  No automatic priorities, shared-control/schema/solver changes, repeated browser
  matrix, commit or deployment. See
  `research/2026-11-08-generic-ailment-control-preferences.md`.
- Charm resource checkpoint: four opt-in preferences, 170 total. Six wordings
  and 14 previously unmatched occurrences (7/1/3/3) added. Three already-covered
  combined charge-gain occurrences now also supply their genuine Charm value,
  not extra recognized-wording coverage. Wording 780/2,182 -> 786/2,182 (36.0%),
  occurrences 3,257/5,451 -> 3,271/5,451 (60.0%). All 42 contexts preserve old
  matches and fingerprints before deliberate baseline refresh. Nine complete
  native forms, 24 actor/item fixtures and all 17 raw source occurrences pass
  691 independent type/ownership/item-separation/prohibition/source-unit checks.
  Raw generation 9 per minute is displayed/scored as 0.15 per second, once.
  Gain, flat generation, inverse cost and duration remain separate. Combined
  wording scores once for each selected genuine item-type benefit while point
  cost still counts the node once. Charm-only/Flask-only modifiers do not cross
  item namespaces. Disabled Charms retain sources without protection; no actual
  activation, resource-flow or uptime simulation is claimed. Quick validation
  passed 1,469 tests in 38 files, typecheck and no-loss coverage. One final release
  passed 1,786 tests in 82 files, typecheck, production build, graph validation
  and refreshed baseline. Local port 5174 returns HTTP 200. Existing main-chunk
  warning remains at 517.93 kB minified / 137.93 kB gzip, not a build failure.
  No automatic priorities, shared-control/schema/solver changes, repeated browser
  matrix, commit or deployment. See
  `research/2026-11-08-charm-resource-preferences.md`.
- Generic area/attack critical checkpoint: one new opt-in Area Damage preference,
  171 total; attack-only critical bonus joins the existing Critical Damage Bonus
  preference. Six wordings and 13 occurrences (6/7) added. Wording 786/2,182 ->
  792/2,182 (36.3%), occurrences 3,271/5,451 -> 3,284/5,451 (60.2%). All 42
  contexts preserve old matches and fingerprints; only the explicit 20 damaging
  area focuses and nine attack-hit focuses gain their respective wording.
  Four complete signed native forms, independent ModDB scope/additive checks,
  native component exports and all 13 raw-source checks passed. Generic area
  does not fan out into attack/spell area, damage or coverage preferences.
  Distinct matching generic/scoped sources add once; critical damage does not
  grant chance, and component hit counts, build-wide prohibitions and actual
  DPS are not inferred. Shared/base route nodes retain single point/reward
  accounting. Quick validation passed 1,486 tests in 39 files, typecheck and
  no-loss coverage. One final release passed 1,803 tests in 83 files, typecheck,
  production build, graph validation and refreshed baseline. Local port 5174
  returns HTTP 200. Existing main-chunk warning remains at 520.32 kB minified /
  138.44 kB gzip, not a build failure. No automatic priorities, shared-control
  contract/schema/solver changes, repeated browser matrix, commit or deployment.
  See `research/2026-11-08-area-attack-critical-damage.md`.
- Weapon accuracy/critical checkpoint: existing Accuracy Rating and Critical
  Damage Bonus preferences gain explicit Bow/Spear/Quarterstaff scopes, still
  171 preferences. Eight wordings and eleven occurrences (accuracy 2/2/1,
  critical bonus 2/1/3) added. Wording 792/2,182 -> 800/2,182 (36.7%), occurrences
  3,284/5,451 -> 3,295/5,451 (60.4%). All 42 contexts preserve old matches and
  fingerprints; only seven reviewed matching weapon focuses gain their exact
  two/three wordings. Twelve complete signed native forms, ModDB weapon/hit
  scope and additive checks, seven skill weapon requirements and all eleven raw
  sources passed. Accuracy is not hit chance; critical damage is not critical
  chance. Distinct generic, attack-only and matching weapon sources add once,
  with other weapon/owner/conditional effects excluded. Shared/base nodes retain
  single point/reward accounting. Gear, caps, prohibitions and DPS remain
  unmodeled. Quick validation passed 1,513 tests in 40 files, typecheck and no-loss
  coverage. One final release passed 1,830 tests in 84 files, typecheck, production
  build, graph validation and refreshed baseline. Local port 5174 returns HTTP
  200. Existing main-chunk warning remains at 522.09 kB minified / 138.80 kB gzip,
  not a build failure. No automatic priorities, new preference IDs, shared-control
  contract/schema/solver changes, repeated browser matrix, commit or deployment.
  See `research/2026-11-08-weapon-accuracy-critical-damage.md`.
- Scoped buildup checkpoint: existing Stun Buildup and Freeze Buildup preferences
  gain explicit melee/Quarterstaff/Mace scopes, still 171 preferences. Eight
  wordings and eleven occurrences (3/3/2/3) added. Wording 800/2,182 -> 808/2,182
  (37.0%), occurrences 3,295/5,451 -> 3,306/5,451 (60.6%). All 42 contexts preserve
  previous matches and fingerprints. Four reviewed focuses gain applicable
  Stun wording; quarterstaff Freeze is Ice Strike only, not Tempest Flurry's
  lightning focus. Boneshatter Stun benefit is shockwave-only, not its initial
  strike; priming and frequency remain unmodeled. Eight complete signed native
  forms, twelve fixed-gear component/application fixtures, independent additive
  ratios and all eleven raw-source occurrences passed. Cannot-apply fixtures
  retain raw modifiers but zero actual native buildup; the site does not gain
  a whole-build prohibition engine. Generic, melee and matching weapon sources
  add once, without damage/threshold/chance/duration or Immobilisation fanout.
  Shared/base nodes retain single point/reward accounting. Quick validation
  passed 1,538 tests in 41 files, typecheck and no-loss coverage. One final release
  passed 1,855 tests in 85 files, typecheck, production build, graph validation
  and refreshed baseline. Local port 5174 returns HTTP 200. Existing main-chunk
  warning remains at 524.40 kB minified / 139.38 kB gzip, not a build failure.
  No automatic priorities, new preference IDs, shared-control contract/schema/
  solver changes, repeated browser matrix, commit or deployment. See
  `research/2026-11-08-scoped-stun-freeze-buildup.md`.
- Two-handed checkpoint: existing Attack Damage and Accuracy Rating gain explicit
  handedness scopes, still 171 preferences. Four wordings and seventeen
  occurrences (15/2) added. Wording 808/2,182 -> 812/2,182 (37.2%), occurrences
  3,306/5,451 -> 3,323/5,451 (61.0%). All 42 contexts preserve old matches and
  fingerprints. Damage applies to three reviewed bow and two quarterstaff
  focuses; two-handed melee accuracy applies only to the quarterstaff focuses.
  Mace handedness is not inferred. Four signed native forms, five single-type
  skill requirements, ten fixed-gear actor fixtures and all seventeen raw-source
  occurrences passed. Changing Boneshatter from one- to two-handed mace changes
  native eligibility; holding a staff does not grant either bonus to Spark.
  Distinct generic/weapon/handedness sources add once, with no damage-category
  fanout or one-handed accuracy duplication. Overwhelm/Singular Purpose retain
  attack-speed penalties; shared/base nodes retain single point/reward accounting.
  Quick validation passed 1,557 tests in 42 files, typecheck and no-loss coverage.
  One final release passed 1,874 tests in 86 files, typecheck, production build,
  graph validation and refreshed baseline. Local port 5174 returns HTTP 200.
  Existing main-chunk warning remains at 525.67 kB minified / 139.65 kB gzip,
  not a build failure. No automatic priorities, new preference IDs, shared-control
  contract/schema/solver changes, repeated browser matrix, commit or deployment.
  See `research/2026-11-08-two-handed-preferences.md`.
- One-handed checkpoint: existing Attack Damage, Attack Speed and Accuracy Rating
  gain four explicit scopes for Lightning Spear and Explosive Spear, still 171
  preferences. Ten wordings and 23 occurrences (11/2/5/5) added. Wording 812/2,182
  -> 822/2,182 (37.7%), occurrences 3,323/5,451 -> 3,346/5,451 (61.4%). All 42
  contexts preserve previous matches and fingerprints; only the two spear
  focuses gain the ten expected wordings. Eight signed native forms, fourteen
  fixed-gear actor fixtures, independent overlap sums and all 23 raw sources
  passed. Spear projectile hits qualify by melee-weapon classification, not by
  melee damage. One-handed and melee-weapon speed lines are distinct sources,
  with no duplicate single-line reward or Cast/Skill Speed fanout. Mace
  handedness is not inferred; two-handed and spell controls reject the new
  sources. Versatile Arms keeps separate attributes/speed/accuracy, and mixed
  handedness nodes supply only the applicable accuracy line. Shared/base nodes
  retain single point/reward accounting. Quick validation passed 1,582 tests in
  43 files, typecheck and no-loss coverage. One final release passed 1,899 tests
  in 87 files, typecheck, production build, graph validation and refreshed
  baseline. Local port 5174 returns HTTP 200. Existing main-chunk warning remains
  at 527.34 kB minified / 139.92 kB gzip, not a build failure. No automatic
  priorities, new preference IDs, shared-control contract/schema/solver changes,
  repeated browser matrix, commit or deployment. See
  `research/2026-11-08-one-handed-preferences.md`.
- One-handed critical/ailment checkpoint: existing Critical Hit Chance, Critical
  Damage Bonus and Generic Ailment Chance gain three explicit scopes for the two
  reviewed spear focuses, still 171 preferences. Four wordings/six occurrences
  (2/1/3) added: wording 822 -> 826/2,182 (37.9%), occurrences 3,346 -> 3,352/5,451
  (61.5%). All 42 contexts preserve prior matches and fingerprints; only the
  spear contexts gain the four expected wordings. Six signed native forms,
  twenty fixed-gear actor fixtures, independent 60/95/25 overlap sums and six
  raw sources passed. Critical bonus scales extra damage, not the whole crit
  multiplier. Ailment INC does not grant Poison/Bleeding chance from zero; flat
  20 becomes 24/16 under increased/reduced 20 and flat 80 with increased 50 caps
  at 100. Native prohibitions zero actual crit/Shock or remove extra crit damage
  while retaining raw modifiers; website tooltips explain those unmodeled
  application limits. No flat-chance fanout or ambiguous mace handedness.
  Coated Arms retains separate damage and ailment sources. Shared/base nodes
  retain single point/reward accounting; shortest remains unchanged. Quick
  passed 1,603 tests in 44 files, typecheck and no-loss coverage. One final
  release passed 1,920 tests in 88 files, typecheck, production build, graph
  validation and refreshed baseline. Local port 5174 returns HTTP 200. Existing
  main-chunk warning remains at 529.42 kB minified / 140.35 kB gzip, not a build
  failure. No automatic priorities, new preference IDs, contract/schema/solver
  changes, repeated browser matrix, commit or deployment. See
  `research/2026-11-08-one-handed-critical-ailment.md`.
- Blind/Hinder checkpoint: five optional Utility preferences (171 -> 176) add
  thirteen wordings and 21 occurrences across six families. Wording 826 ->
  839/2,182 (38.5%); occurrences 3,352 -> 3,373/5,451 (61.9%). All 42 contexts
  retain old matches and fingerprints. Seven generic wordings are added to
  every context, four attack-only wordings only to nine reviewed attack focuses,
  and two spell-hit wordings only to eighteen reviewed player spell-hit focuses.
  All 21 raw sources, sixteen native parser probes and 29 actor fixtures were
  checked: eight forms parse completely, eight expose partial/unsupported PoB
  behavior. Game wording supplies Blind Effect reductions, Blind/Hinder duration
  and spell Hinder chance; partial generic Duration/LocalEffect modifiers are
  never reused. Native attack/spell Blind sums are 15/5; chance/effect does not
  assume enemy debuff state, and minion sources do not enter the player sum.
  Essence Drain's initial hit, Detonate Dead's spell-skill application and
  Unearth's player-versus-construct ownership are distinct from damage scaling
  or minion-summoning tags. Chance, effect, duration and Slow Magnitude remain
  separate, with no ailment/Skill Effect Duration fanout or assumed conditional
  damage. Shared/base point/reward accounting and shortest routing stay intact.
  Quick passed 1,630 tests in 45 files, typecheck and no-loss coverage before
  one further Unearth tooltip case. Final release passed 1,948 tests in 89
  files, typecheck, build, graph validation and refreshed baseline. Local port
  5174 returns HTTP 200. Existing main-chunk warning remains at 534.06 kB
  minified / 141.36 kB gzip, not a build failure. No automatic priorities,
  shared-control contract/schema/solver changes, repeated browser matrix,
  commit or deployment. See `research/2026-11-08-blind-hinder-preferences.md`.
- Knockback/Maim/Incision checkpoint: three optional Utility preferences
  (176 -> 179), seven wordings and 21 occurrences (10/2/9). Wording 839 ->
  846/2,182 (38.8%); occurrences 3,373 -> 3,394/5,451 (62.3%). All 42 contexts
  retain previous matches and fingerprints. Three distance wordings are added
  in every context; four Maim/Incision chance wordings only in nine reviewed
  player attack-hit focuses. All 21 raw sources, eleven native parser probes
  and fourteen fixed-weapon fixtures checked. Native Maim chance is incomplete;
  Incision 20/40 and ten-Incision chance become identical unscoped capability
  flags, so the site independently retains signed numeric chance and attack
  ownership, excluding the ten variant. No Bleeding chance/stack/damage inference.
  A configured native three-stack state supplies 30 enemy SelfBleedChance, not
  a conversion of application chance. Raw Knockback distance signs/ownership
  pass; Ice Nova's numeric 100 source versus zero output/absent flag exposes a
  native mismatch, not proof of final displacement. Application restrictions
  remain documented limits. Independent shared-node scores total 15.5, not
  damage; a real separate Bleeding chance source adds only its own score.
  Shared/base point/reward accounting and shortest behavior stay intact. Quick
  passed 1,647 tests in 46 files, typecheck and no-loss coverage. One final
  release passed 1,964 tests in 90 files, typecheck, build, graph validation and
  reviewed baseline. Local dev server restarted; port 5174 returns HTTP 200.
  Existing main-chunk warning remains at 536.95 kB minified / 141.97 kB gzip,
  not a build failure. No automatic priorities, contract/schema/solver changes,
  repeated browser matrix, commit or deployment. See
  `research/2026-11-08-knockback-maim-incision-preferences.md`.
- Mark/Exposure checkpoint: four optional Utility preferences (179 -> 183),
  seven wordings and eighteen occurrences (4/4/2/8). Wording 846 -> 853/2,182
  (39.1%); occurrences 3,394 -> 3,412/5,451 (62.6%). All 42 contexts retain old
  matches/fingerprints and gain exactly seven source wordings. All eighteen raw
  sources, thirteen native parser probes and fifteen actor fixtures checked.
  Game Mark-effect wording maps to LocalEffect rather than native MarkEffect;
  the independent literal scorer preserves the game stat and tooltips flag the
  mismatch. A reference-only native alias is not enabled as a new site alias.
  Mark timing is scoped correctly: generic and Mark +20 sources sum to 40,
  while Spark/Enfeeble receive zero Mark timing. Native use rate changes
  2 -> 2.4/1.6 but cooldown/effective time stays 6.006; duration agrees within
  one tick with independent 8/9.6/6.4/11.2 expectations. Exposure expands to
  three elemental native modifiers but earns one preference contribution.
  No-source inputs apply no Exposure; controlled Cold base 20 and fixture
  target multiplier 0.5 produce independently verified strengths 10/12/8 and
  resistance 40/38/42. Minion/incoming modifiers stay separate. No assumed
  application, conditional damage, generic timing duplication or penetration
  fanout. Independent shared-node score 8 becomes 13 only with five distinct
  additional generic/curse/penetration sources. Shared/base costs and shortest
  behavior unchanged. Quick passed 1,668 tests in 47 files, typecheck and
  no-loss coverage; final release passed 1,985 tests in 91 files, typecheck,
  build, graph validation and refreshed baseline. Local port 5174 returns
  HTTP 200. Existing main-chunk warning remains at 539.40 kB minified /
  142.50 kB gzip, not a build failure. No automatic priorities, skill presets,
  shared-control contract/schema/solver changes, repeated browser matrix,
  commit or deployment. See `research/2026-11-08-mark-exposure-preferences.md`.
- Mark utility preset checkpoint: Sniper's Mark, Bloodhound's Mark, Freezing
  Mark and Voltaic Mark add four positive-tier presets (41 -> 45/399, 11.3%;
  45/234 positive-tier, 19.2%). Optional suggestions use Mark Effect Highest,
  Use Speed Normal and Duration Normal; no automatic selection or overwritten
  priorities. All 42 existing contexts retain identical matches/fingerprints;
  four new contexts equal manual, preserving union 853 wordings/3,412 occurrences.
  Preferences stay 183 and support choices/pairs stay 31/292. Five native
  component exports and 24 isolated player actor fixtures verify non-hit Mark
  ownership, separate Blood Explosion non-weapon Attack, conditional buffs,
  application requirements and independent signed timing arithmetic. Native
  Mark-effect namespace and magnitude/event limitations remain documented,
  not treated as verified damage scaling. No generic speed, damage, minion or
  target-susceptibility bonuses inferred from gem tags. Required penalties,
  shared/base cost accounting and shortest behavior unchanged. Quick passed
  1,694 tests in 48 files; final release passed 2,011 tests in 92 files,
  typecheck, build, graph validation and deliberately reviewed baseline.
  Local port 5174 returns HTTP 200. Existing main-chunk warning 544.55 kB /
  143.59 kB gzip remains non-fatal. Metadata-only DOM/routing checks, no repeated
  browser matrix or claimed visual acceptance. Next proposal is Mobility,
  Efficiency I/II and Prolonged Duration I/II compatibility for these Marks;
  no pairs approved yet. No commit, push or deployment. See
  `research/2026-11-08-mark-utility-presets.md`.
- Mark utility support checkpoint: Mobility, Efficiency I/II and Prolonged
  Duration I/II add twenty reviewed pairs for the four Marks (292 -> 312).
  Support choices stay 31/567, families 19, presets 45/399 and preferences 183.
  All 46 contexts/fingerprints and union 853 wordings/3,412 occurrences stay
  identical, with no baseline refresh. Native checks cover 25 component pairs,
  twenty negative type controls and 36 player actor fixtures. All twenty Mark
  pairs apply; Blood Explosion remains separate. Mobility reduces the 70%
  fixture movement penalty to 52.5%, not global speed or faster application.
  Efficiency cost factors and Prolonged's cost multiplier agree with independent
  staged rounding. Prolonged scales both primary and Freezing/Voltaic secondary
  timers, not buff strength. The correct native output is DurationSecondary;
  the previous audit's SecondaryDuration probe was a field error, not missing
  runtime support, and its note is corrected. Consumption, re-marking, actual
  uptime and Full DPS remain unmodeled. Support choices are context-only and
  retain passive priorities, scopes, goal/budget/save settings and route scores.
  Quick passed 1,711 tests in 48 files; final release passed 2,028 tests in 92
  files, typecheck, build, graph validation and unchanged baseline. Local port
  5174 returns HTTP 200. Existing main-chunk warning remains non-fatal at
  545.30 kB minified / 143.77 kB gzip. Metadata-only DOM/routing validation,
  no repeated browser matrix, visual acceptance claim, commit or deployment.
  Next proposal is five Warcry utility presets; held reviews remain separate.
  See `research/2026-11-08-mark-utility-supports.md`.
- Warcry utility preset checkpoint: Infernal Cry, Seismic Cry, Ancestral Cry,
  Fortifying Cry and Ferocious Roar add five positive-tier presets (45 ->
  50/399, 12.5%; 50/234 positive-tier, 21.4%). Optional Warcry Speed High and
  Warcry Area Normal for all five; cooldown recovery High for four baseline
  eight-second cooldowns, but Ancestral suggests embodiment Duration Normal
  instead of inventing a cooldown for its Glory gate. Manual priorities,
  defence, goals and budgets remain intact; no inferred attack/spell scopes
  or support pairs. Preferences stay 183, supports 31/567 across 19 families
  and pairs 312. All 46 old contexts/fingerprints are unchanged; five new
  contexts equal manual, preserving union 853 wordings/3,412 occurrences.
  Ten native component exports, five player/minion meta predicates and 32
  actor/form/equipment fixtures verify ownership and independent signed use
  time, cooldown and radius arithmetic. Ferocious requires Talisman/Bear and
  excludes socketed-Warcry replacement from this focus; its source 1.1-second
  castTime versus native 0.8 Warcry base remains explicit. Fortifying's catalog
  shield requirement is not enforced by its native parent; form/hit flags and
  Ancestral's calculated use rate do not prove usable gear or supplied Glory.
  Secondary damage, empowerment, charges, Guard, Rage and actual uptime/DPS
  remain outside the utility heuristic. Shared/base cost/reward accounting and
  shortest routing unchanged. Quick passed 1,750 tests in 49 files; final
  release passed 2,067 tests in 93 files, typecheck, build, graph validation
  and deliberately reviewed baseline. Local port 5174 returns HTTP 200.
  Existing main-chunk warning non-fatal at 552.03 kB / 145.29 kB gzip.
  Metadata-only DOM/routing validation; no repeated browser matrix, claimed
  visual acceptance, commit or deployment. Next proposal: Magnified Area,
  Prolonged Duration, Efficiency and Mobility compatibility for these five
  focuses, not an assumption that every pair is valid. See
  `research/2026-11-08-warcry-utility-presets.md`.
- Warcry utility support checkpoint: Magnified Area I/II, Prolonged Duration
  I/II, Efficiency I/II and Mobility add thirty curated parent pairs (312 ->
  342). All five parents accept Magnified/Efficiency; Prolonged accepts Infernal,
  Ancestral and Fortifying only; Mobility accepts four human-form parents, not
  standalone Ferocious. Five rejected pairs remain excluded, and socketed
  replacement mode stays outside the base-use presets. Native evidence covers
  seven support definitions, 63 parent/child predicates, thirty negative type
  controls and fifty actor fixtures. Applied IDs, form/equipment state and
  independent area, staged-cost, movement-penalty and dual-duration arithmetic
  agree. Fortifying secondary timing scales without inferring Guard strength;
  child compatibility is not parent compatibility or damage ranking. Glory,
  Rage, Power, charge bypasses, actual usability and event uptime remain
  qualified limits. No support magnitude enters passive rewards or changes
  existing priorities, scopes, goals, budgets or point accounting. All 51
  contexts/fingerprints and union 853 wordings/3,412 occurrences remain identical;
  no baseline refresh. Presets stay 50/399, preferences 183, support choices
  31/567 across 19 families. Quick passed 1,771 tests in 49 files; final release
  passed 2,088 tests in 93 files, typecheck, build, graph validation and unchanged
  baseline. Local port 5174 returns HTTP 200. Existing main-chunk warning stays
  non-fatal at 552.65 kB / 145.50 kB gzip. Metadata-only DOM/routing checks,
  no repeated browser matrix, claimed visual acceptance, commit or deployment.
  Next proposal: Raging Cry, Exposing Cry and Enraged Warcry I/II with explicit
  hit/Power/Rage/cooldown-bypass requirements. See
  `research/2026-11-08-warcry-utility-supports.md`.
- Warcry Power/Rage/Exposure support checkpoint: Raging Cry, Exposing Cry and
  Enraged Warcry I/II add fourteen curated pairs (342 -> 356), four choices
  (31 -> 35/567, 6.2%; positive-tier 35/450, 7.8%) and three families (19 ->
  22). All five parents admit Raging; only Seismic's own secondary hit admits
  Exposing; four cooldown-based parents admit Enraged, excluding Ancestral's
  Glory gate. All twenty native parent type pairs are legal, but six have no
  reviewed useful parent scope. Sixteen child predicates and twenty negative
  type controls reject these Warcry-only supports. Fifty-seven actor fixtures
  and independent arithmetic separate Power-based source grants, 20/15-Rage
  spend thresholds, caps, configured Rage, actual hit eligibility, five-second
  Exposure source duration and native capability flags. Native generation/
  spending and automatic on-hit Exposure are not proven; explicit configured
  Exposure and zero-cooldown positive controls are not simulated hits or Rage
  transactions. No new passive scopes, rewards or priority/budget changes.
  Existing shortest routing and base/shared point accounting remain unchanged.
  Seismic's Exposing duration caution changes without adding suggestions or
  enabling unreviewed linked combinations. Save/JSON and one-tier replacement
  tests pass. Preferences stay 183, presets 50/399, 24 support choices partial.
  All 51 contexts and fingerprints remain identical, union 853 wordings/3,412
  occurrences; no baseline refresh. Quick passed 1,773 tests in 49 files; final
  release passed 2,090 in 93 files, typecheck, build, graph validation and
  unchanged baseline. Local port 5174 returns HTTP 200. Existing chunk warning
  non-fatal at 555.44 kB / 146.05 kB gzip; worker 207.30 kB. Metadata-only
  DOM/routing checks, no repeated browser matrix, visual acceptance claim,
  commit or deployment. Next proposal: Echoing Cry and Corrupting Cry I/II;
  repeats, DoT ownership, stacking and costs require review before pairing.
  See `research/2026-11-08-warcry-power-rage-exposure-supports.md`.
- Echoing/Corrupting Cry checkpoint: three choices add fourteen curated pairs
  (356 -> 370). Echoing accepts four base parents but rejects Ancestral's
  existing use condition; Corrupting I/II accept all five and grant separate
  player-owned Physical DoT children. Thirty-three component predicates,
  twenty negative and five positive type controls, and 64 actor fixtures pass
  independent assertions. Echoing cost rises 85 -> 127 Mana, or 77 with
  Efficiency II, but its native repeat/travel/area/Power/damage mechanics are
  unmapped. No repeated-hit or sustainable-stack bonus is invented. Corrupted
  Blood inherits parent level, costs zero child Mana while the parent pays,
  scales independently from 1 to 10 configured stacks and caps above ten.
  Native default ten is an assumed state, not supplied uptime. Physical,
  DoT and explicit Warcry-damage transfer apply; Attack/Spell/Minion/Bleeding
  controls do not. Child duration scaling does not increase per-second damage.
  Tier I's 30% less Warcry area is kept distinct from Tier II. All choices stay
  context-only with manual weights, scopes, goals, budgets, shortest routing
  and base/shared point accounting intact. One-tier selection, save and JSON
  tests pass; base-duration cautions distinguish support-granted timers.
  Support choices 35 -> 38/567 (6.7%), positive-tier 38/450 (8.4%), families
  22 -> 24; 27 choices partial. Presets stay 50/399 and preferences 183. All
  51 contexts/fingerprints and union 853 wordings/3,412 occurrences remain
  identical; no baseline refresh. Quick passed 1,774 tests in 49 files; final
  release passed 2,091 in 93 files, typecheck, build, graph and unchanged
  baseline. Local port 5174 returns HTTP 200. Existing chunk warning remains
  non-fatal at 557.65 kB / 146.49 kB gzip; worker 209.51 kB. Existing-control
  DOM/routing validation, no repeated browser matrix or visual acceptance
  claim, commit or deployment. Next proposal: Cooldown Recovery I/II and
  Second Wind I/II/III, with stored-use/recovery/bypass and cost checks. See
  `research/2026-11-08-warcry-echo-corruption-supports.md`.

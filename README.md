# PoE2 Tree Optimizer

A local-first Path of Exile 2 passive tree viewer and route optimizer. The tool can load the main passive tree, choose a class or ascendancy start, allocate routes, import Path of Building codes as build goals, summarize allocated passive stats, and optimize shortest routes to selected goal nodes.

## Current Status

This is an experimental fan tool. It is not affiliated with or endorsed by Grinding Gear Games.

The repository includes preprocessed passive tree data and icon assets so the app can be deployed as a static GitHub Pages site. The source app is MIT licensed; Path of Exile 2 names, icons, passive tree data, and related game assets belong to Grinding Gear Games.

Bundled tree data: **PoE2 0.5.5f**, refreshed from the local Steam installation on November 6, 2026. See [the refresh notes](docs/research/2026-11-06-tree-data-refresh.md) for the comparison and repeatable extraction steps. Tree data is bundled with each deployment; it does not update automatically.

## Local Setup

```bash
npm ci
npm run dev
```

The dev server runs Vite and opens the app at the local URL printed in the terminal.

## Verification

```bash
npm run validate:quick
npm run validate:release
npm run coverage:report
```

Quick checks cover preference/catalog batches. Release checks run every test,
typecheck, production build, graph validation and the coverage regression check.
Reports are written to `var/coverage/` and `var/validation/`, without adding site UI.
The full denominators, completion gates and larger-batch plan are in
`docs/optimizer-coverage-roadmap.md`; there is no invented overall completion score.
See [the developer workflow](docs/development-workflow.md) for status definitions,
baseline review, catalog refresh and when browser checks are needed.

`npm test`, `npm run build` and `npm run validate:graph` also remain available.
Data preparation copies tracked deploy data from `data/` into `public/`: only the
graph for tests/graph validation, and graph plus images for dev/build.

Extraction CLI tests run in separate temporary working folders, including their
generated preview data and reports. They check that the repository's tree data
and icon manifests remain unchanged and remove their temporary folders afterward.

The optional [PoB evaluation experiment](tools/pob-evaluation/README.md) tests
whole-route calculations and independent arithmetic checks offline. It is not
part of the deployed website; see [the investigation](docs/research/2026-11-06-pob-calculation-integration.md).

## Route Objectives

The default **Shortest** mode retains the existing point-minimizing search.
**Build Focus** is a separate heuristic objective. Select explicit effects
(for example Energy Shield, Attributes, Minion Damage or Life), choose Normal / High /
Highest priorities, and set an extra-point budget. The optimizer first finds a
shortest baseline, then searches alternate paths and optional branches while
keeping all required goals and the current visible allocation. New nodes are
counted and scored once; base nodes are free and are not rewarded again.

With **Extra points**, the cap is the baseline's added-node cost plus the extra-point
budget. The minus/plus controls adjust that allowance; zero still permits equal-cost
alternatives. **Use all available (123 total)** instead caps the completed tree at
123 character points, subtracting current main allocations and reserving the larger
weapon-set allocation. Ascendancy points are separate. It spends remaining points
on beneficial matching branches, without padding the route with unrelated nodes;
points can remain unused if no useful branch fits. Required goals that exceed the
remaining budget are reported without applying a partial route. These settings
are included in saved/exported builds.

For large goal sets, the shortest baseline found is not guaranteed
globally optimal. Weighted search stops after 60 seconds without a better score
(ties prefer fewer points); Cancel and Apply can stop it sooner. Candidates include
the shortest baseline for comparison.

Only supported, unconditional stat lines receive scores. The effect tooltip gives
the normalization unit; High and Highest multiply it by two and three. Conditional
effects, skills, gear, conversions and other interactions are not modeled. Inspect
the full route effects before applying. This mode does **not** calculate PoB Full
DPS, effective hit pool, or overall build power.

### Skill-Informed Presets

In Build Focus, choose a **Skill** to review its suggested effects
and the reason for each. **Add suggestions** merges missing preferences; existing
priorities, defenses, required goals and point budgets are preserved. Individual
suggestions can be toggled and their priorities remain editable. Focus selection
is included in saved/exported builds. Returning to manual focus does not remove
previously chosen effects.

The catalog includes 225 scoped skill presets. The first 56 include Enfeeble, Spark, Fireball,
Lightning Arrow, Essence Drain, Skeletal Arsonist, Ice Strike, Tempest Flurry,
Boneshatter, Rolling Slam, Ice Shot, Rain of Arrows, Lightning Spear and Explosive
Spear, Arc, Ball Lightning, Frostbolt, Ice Nova, Comet, Firestorm, Eye of Winter,
Frost Bomb, Flameblast, Frost Wall, Contagion, Bonestorm, Bone Cage, Despair,
Vulnerability, Hexblast, Unearth, Detonate Dead, Dark Effigy, Skeletal Sniper,
Skeletal Frost Mage, Skeletal Storm Mage, Skeletal Brute, Skeletal Cleric,
Skeletal Reaver, Bone Offering, Pain Offering, Sniper's Mark, Bloodhound's Mark,
Freezing Mark, Voltaic Mark, Infernal Cry, Seismic Cry, Ancestral Cry, Fortifying Cry,
Ferocious Roar, Galvanic Shards, Explosive Shot, Explosive Grenade, Rake, Maul and
Shred. This remains a curated list, not every primary skill in the game.
The [twelve-focus attack closure batch](docs/build-focus-attack-closure-batch.md)
closes the frozen positive-tier non-totem Attack group, including Spear/Bow,
Wyvern and triggered Caltrops components with common supports. Component choices,
conditional resources and source/runtime disagreements remain explicit.
The [twelve-focus spell/utility batch](docs/build-focus-spell-utility-batch.md)
closes the frozen positive-tier Spell group, including Tornado, Volcano, Frost
Darts, curses, recovery and empowerment buffs. Common supports retain component,
resource and ownership limits rather than turning every Spell tag into damage.
The [eight-focus proxy batch](docs/build-focus-proxy-batch.md) adds Zombie,
Rhoa, Wolf Pack, Shockwave, Offering and capture-action focuses. Ancestral Warrior
Totem and Spell Totem require an explicit reviewed socketed skill; Totem,
Companion, Minion and player effects stay separate. Tame Beast does not invent
the eventual captured species or its damage.
The [twelve-focus Banner/defensive batch](docs/build-focus-defensive-buff-batch.md)
adds all three Banners and nine buff/recovery focuses, with Aura Magnitude and
Glory Generation preferences. Current Grim Feast, Barkskin and retaliation
mechanics are kept distinct from their older versions and from Full DPS.
The [twelve-focus persistent offence/minion batch](docs/build-focus-persistent-offence-batch.md)
adds all five Heralds, Plague Bearer, Raging Spirits, Ravenous Swarm, Mirage
Archer, Archmage and both offensive Presences, with 46 common-support pairs.
Mirage Archer requires one of four reviewed Bow sources; Herald reservation,
Minion ownership and Mana empowerment do not imply trigger uptime or Full DPS.
The [fourteen-focus resource/charge batch](docs/build-focus-resource-charge-batch.md)
adds Rage, charge, Remnant, reload and empowerment contexts with eleven literal
resource preferences and fourteen common-support pairs. Conflux, Shard Scavenger
and Trinity remain context-only: no random-roll, trigger or Affinity DPS is guessed.
The [crossbow and bear/wolf expansion](docs/build-focus-skill-expansion.md) adds
28 more component-scoped presets: 15 crossbow firing skills, five Grenades and
eight bear/wolf damage focuses. [Artillery and Siege Ballista](docs/build-focus-ballistas.md)
add separate Totem damage, firing speed, survival, placement and lifetime preferences.
[Mortar Cannon](docs/build-focus-mortar-cannon.md) requires an explicit socketed-Grenade
selection, kept in saved/exported builds. Six reviewed Grenades are available;
placement, Totem firing and Grenade cooldown recovery remain distinct. Reload/activation
skills and form utility remain separate from direct player-hit scoring.
The [eight-spell Fire/Lightning batch](docs/build-focus-fire-lightning-spells.md) adds
Ember Fusillade, Living Bomb, Incinerate, Flame Wall, Orb of Storms, Lightning Conduit,
Lightning Warp and Thunderstorm. Burning, hits, targeting area, duration and fixed
timing remain separate; tags do not automatically enable every modifier or support.
The [Plant batch](docs/build-focus-plant-skills.md) adds Entangle, Briarpatch,
Thrashing Vines and Toxic Domain, with a separate Plant Damage preference for
reviewed damaging components. Overgrowth, extra fissures, stored damage and
Wildsurge's damage/duration trade-off are not assigned speculative scores.
The [Plant support review](docs/build-focus-plant-supports.md) adds Magnified Area
I/II, Prolonged Duration I/II and Brutality I/II/III for those four focuses.
Component-specific notes distinguish coverage, lifetime, reservation and Poison
conflicts without automatically changing priorities or multiplying route scores.
The [Plant utility support review](docs/build-focus-plant-utility-supports.md) adds
Efficiency I/II for Entangle, Thrashing Vines and Toxic Domain, and Mobility for
Entangle only. Persistent Briarpatch is excluded from Efficiency; a movement
stat alone does not establish Mobility compatibility.
The [Plant casting review](docs/build-focus-plant-casting-supports.md) adds Rapid
Casting I/II/III and Considered Casting for Entangle and Thrashing Vines. Notes
separate additive/conditional cast speed from fixed vine timing and damage;
Considered Casting's responsiveness priority remains opt-in.
The [Plant critical-hit/Echo review](docs/build-focus-plant-crit-echo-supports.md)
adds Controlled Destruction for both Plant spells and Spell Echo for Thrashing
Vines only. Critical-hit prohibitions warn without deleting manual priorities;
Echo-only area and repeats are not unconditional damage or hit-count bonuses.
The [Plant bow batch](docs/build-focus-plant-bow-skills.md) adds Vine Arrow's
intrinsic Chaos vine-DoT focus and Toxic Growth's bow impact/explosion focus.
Outgoing Poison, externally supplied Poison and plant growth are kept separate;
neither a Chaos tag nor attack delivery automatically transfers every damage bonus.
The [Plant bow utility support review](docs/build-focus-plant-bow-supports.md)
adds Magnified Area I/II and Efficiency I/II for both focuses, plus Prolonged
Duration I/II and Mobility for Vine Arrow only. Notes distinguish coverage,
plant lifetime, cost and while-firing movement from damage and detonation timing;
no priorities or route scores are automatically changed.
The [Plant bow speed review](docs/build-focus-plant-bow-speed-supports.md) adds
Rapid Attacks I/II and Projectile Acceleration I/II for both focuses. Deployment,
intrinsic DoT, outgoing versus supplied Poison and detonation remain separate;
Tier II Pierce is not assumed to create more hits or plants. No automatic
speed-to-damage conversion or priority adjustment is added.
The [Plant bow trade-off review](docs/build-focus-plant-bow-tradeoff-supports.md)
adds Swift Affliction I/II for Vine Arrow and Concentrated Area for Toxic Growth.
Duration/coverage priorities remain explicit opt-in changes. A native PoB duration
double-mapping discrepancy is disclosed; exact plant lifetime is not predicted.
The [Poison bow batch](docs/build-focus-poison-bow-skills.md) adds Poisonburst
Arrow's Poison burst and Gas Arrow's Poison cloud as separate reviewed focuses.
Bow-source damage, outgoing Poison magnitude, deployment and coverage are kept
distinct. Gas cloud lifetime is not Poison duration; the conditional Fire
explosion, fake calculation hits and externally supplied Poison are not inferred.
Their [utility support review](docs/build-focus-poison-bow-supports.md) adds
Magnified Area I/II, Prolonged Duration I/II and Efficiency I/II for both focuses.
Notes distinguish linked Poison persistence from cloud lifetime, coverage and
firing cost. Support selection does not automatically change passive priorities.
The [Poison bow delivery review](docs/build-focus-poison-bow-speed-supports.md)
adds Rapid Attacks I/II and Projectile Acceleration I/II for both focuses.
Notes separate firing rate, travel speed and Pierce chance from Poison magnitude,
cloud lifetime/growth, extra contacts and conditional Fire detonation.
The [Deadly Poison review](docs/build-focus-poison-bow-deadly-supports.md) adds
Deadly Poison I/II for both focuses. Notes retain the hit penalty, including
its effect on PoB's derived Poison source, rather than treating more Poison
magnitude as an equivalent total-DPS gain. Priorities remain unchanged.
The [Concentrated Area review](docs/build-focus-poison-bow-concentrated-supports.md)
adds it for both Poison bow focuses, with native Poison-source scaling kept
separate from reduced coverage. High Area of Effect is an explicit opt-in
coverage priority, not a DPS multiplier or calculated restoration of lost area.
Fireball's separate review remains on hold.
The [Poison bow movement review](docs/build-focus-poison-bow-movement-supports.md)
adds Mobility and Deliberation for both focuses. Firing movement penalties stay
separate from global Movement Speed, and Deliberation's native Poison-source
damage stays separate from Poison Magnitude. Neither changes priorities.
The [Escalating Poison review](docs/build-focus-poison-bow-escalating-support.md)
adds it for both focuses, keeping extra stack capacity separate from shorter
Poison duration and actual application uptime. No sustained-stack or fixed
damage bonus is assumed; priorities remain unchanged.
The [Bursting Plague review](docs/build-focus-poison-bow-bursting-plague.md)
adds it for both focuses, separating enemy-capped Plague and the on-death
Physical burst from ordinary Poison DPS. The native storage/burst calculation
gap is explicit; no kills, cap saturation or boss uptime is assumed.
The [Poison I/II/III review](docs/build-focus-poison-bow-poison-supports.md)
adds six pairs for these focuses. On-hit chance stays separate from inherent
Poison; Tier III's magnitude bonus requires Bleeding, which is not assumed.
One tier per family is retained without rewriting manual priorities.
The [Admixture review](docs/build-focus-poison-bow-admixture.md) adds two
context-only pairs. Poison magnitude requires a Bleeding enemy; supported-hit
Bleeding magnitude requires a Poisoned enemy. Neither ailment is supplied.
PoB's conditional combination with Poison III is documented without assuming
condition uptime or multiplying route scores.
The [Bleed I/II/III review](docs/build-focus-poison-bow-bleed-supports.md)
adds six pairs, separating eligible arrow-hit Bleeding from no-hit burst/cloud
Poison. Tier-specific chance and Mana costs are documented without inferring
condition uptime or trusting synthetic source-hit Bleeding fields as real hits.
The [Corrosion review](docs/build-focus-poison-bow-corrosion.md) adds two
context-only pairs. Armour Break based on supported Poison damage is separate
from Poison DPS; compatibility, costs and missing native break amount/timing
are explicit, without assuming Fully Broken Armour or uptime.
The [Poison-bow Swift Affliction review](docs/build-focus-poison-bow-swift-affliction.md)
adds four pairs with existing I/II choices. Non-ailment DoT is not Poison;
duration penalties and the native double-name calculation are documented with
exact game timing unverified. No Poison-score boost or automatic duration
priority is inherited from the earlier intrinsic-DoT focuses.
The [Compressed Duration review](docs/build-focus-poison-bow-compressed-duration.md)
adds four pairs. Skill-only duration penalties shorten linked burst Poison
and cloud lifetime, not Gas's separate outgoing Poison or arrow-hit ailments.
No damage, tick-speed, detonation-frequency or automatic priority gain is inferred.
The [Culling Strike review](docs/build-focus-poison-bow-culling-strike.md)
adds I/II for both focuses, separating Rare/Unique hit-based culling from Poison.
Tier II's on-cull threshold bonus and incomplete native coverage are explicit;
neither tier automatically increases route scores or changes manual weights.
The [Blind review](docs/build-focus-poison-bow-blind.md) adds I/II for both
focuses. Actual-hit application, enemy Accuracy/Evasion reductions, conditional
native hit/crit estimates and higher Mana cost stay separate from direct Poison
damage, player ratings and assumed uptime. Manual priorities remain unchanged.
The [Blindside review](docs/build-focus-poison-bow-blindside.md) adds both pairs.
Its Blind prohibition is shown before conditional critical-hit benefits and
overrides paired Blind I/II application notes. A separate Blind source is needed;
native prohibition gaps, Mana costs and Poison-source estimates stay explicit.
The [Bounty review](docs/build-focus-poison-bow-bounty.md) adds I/II for both
focuses. Detailed stat text requires supported-hit kills, not Poison deaths.
Life/Mana Flask and Charm rewards stay separate from damage, recovery, flat
generation and assumed uptime; native reward-event coverage is incomplete.
The [Maim review](docs/build-focus-poison-bow-maim.md) adds both pairs. Eligible
attack hits can apply enemy Movement Speed/Evasion reductions, not direct Poison
damage. No-hit burst/cloud Poison cannot apply it; native application coverage,
explicit enemy-state estimates and additive reductions stay separate from uptime.
The [Malady catalog review](docs/build-focus-poison-bow-malady.md) adds both pairs and
updates paired Poison/Bleed tier notes while selected. Base on-hit chances swap;
inherent burst/cloud Poison, conditional magnitude bonuses and native swap gaps
remain separate. The tier-zero entry is labeled with unverified current availability.
Manual priorities are retained, not silently exchanged.
The [Heft review](docs/build-focus-poison-bow-heft.md) adds both pairs. Maximum-only
Physical hit/source damage, native stronger-Poison-roll estimates and higher Mana
cost stay separate from Poison magnitude, added Chaos and Gas's converted Fire
explosion. No blanket damage multiplier is added to routing scores.
The [Longshot review](docs/build-focus-poison-bow-longshot.md) adds I/II for both
focuses. Distance-ramped hit/Poison-source scaling and higher Mana cost remain
separate from Accuracy falloff, Poison magnitude and assumed maximum-range uptime.
The [Close Combat review](docs/build-focus-poison-bow-close-combat.md) adds I/II
for both focuses while preserving II's existing melee coverage. Paired Longshot
notes explain their non-overlapping damage ranges and both Mana multipliers;
neither maximum bonus becomes an unconditional route score.
The [Execute I/II review](docs/build-focus-poison-bow-execute.md) separates
enemy-Low-Life hit bonuses and native Poison-source estimates from Poison
magnitude, Culling Strike and assumed uptime. Both tiers retain the higher Mana
cost outside the condition; manual priorities and route scores are unchanged.
The [Execute III review](docs/build-focus-poison-bow-execute-iii.md) keeps
player and enemy Low Life separate: either grants 30% more hit damage, both
combine to 69% more, with one Mana multiplier in every state. Neither condition
is assumed, and conditional native Poison-source estimates are not double-counted.
The [Exploit Weakness review](docs/build-focus-poison-bow-exploit-weakness.md)
requires Fully Broken Armour rather than partial break, retains the skill's
Armour Break prohibition and higher Mana cost, and warns on both selections if
Corrosion is also chosen. The selections remain review context, not a valid
combined loadout or automatic damage weighting.
The [Chaos Mastery review](docs/build-focus-poison-bow-chaos-mastery.md) checks
+1 skill level against directly levelled controls. Higher-level costs can rise
despite no separate Mana multiplier; Poisonburst's burst radius and Gas's
separate cloud/explosion scaling are not collapsed into a generic Chaos bonus.
The [Chaos Attunement review](docs/build-focus-poison-bow-chaos-attunement.md)
separates gained Chaos from non-Chaos penalties. The reviewed Physical bow loses
Poison-source value despite stronger arrow hits. Its mixed-source Chaos Damage
caution replaces the base preset's no-added-Chaos warning without changing weights.
The [Withering Touch review](docs/build-focus-poison-bow-withering-touch.md)
separates its damage penalty from Chaos-hit Wither eligibility. No-hit Poison
cannot apply on-hit Wither; explicit stack scenarios are not measured uptime.
No stacks, damage bonus or preference changes are assigned automatically.
The [Pierce I/II/III review](docs/build-focus-poison-bow-pierce.md) separates
projectile delivery and conditional post-pierce penalties from no-hit Poison.
Only one Pierce tier is retained at a time; extra contacts and Poison applications
are not inferred and manual weights remain unchanged.
The [Fork review](docs/build-focus-poison-bow-fork.md) separates post-fork
penalties and higher Mana cost from no-hit Poison. Paired Fork/Pierce selections
show reversible collision-priority warnings rather than crediting extra contacts
or treating PoB's manual counters as proof of a possible collision sequence.
The [Chain I/II/III review](docs/build-focus-poison-bow-chain.md) keeps hit-only
penalties separate from direct Poison modifiers: a smaller eligible pre-mitigation
source still lowers Poison once. Initial-hit penalties, unchanged Mana costs and
Fork/Pierce collision priority are documented without crediting repeated targets.
The [Multishot I/II review](docs/build-focus-poison-bow-multishot.md) separates
two additional projectiles from less Damage and less Skill Speed. Slower firing
changes PoB's repeated-source estimate, not Poison tick speed; extra hits,
Poison stacks, bursts and clouds are not automatically credited.
The [Nova Projectiles I/II review](docs/build-focus-poison-bow-nova.md) separates
circular delivery from extra contacts and Tier II's damage/cooldown trade-off.
Nova I can coexist with Multishot; Nova II replaces it through their shared
Additional Projectiles family. Neither choice changes manual weights.
The [Ricochet I/II review](docs/build-focus-poison-bow-ricochet.md) separates
terrain-chain chance from ordinary chain count and Poison chance. Suitable
walls, targets, repeat hits and extra Poison applications are not assumed.
The [Salvo review](docs/build-focus-poison-bow-salvo.md) separates Seal gain,
random delivery and shared-family restrictions from extra contacts. PoB's
unmapped interval/projectile behavior is called out rather than treating its
zero Seal timer as instant gain or crediting maximum Seals as a DPS bonus.
The [Momentum review](docs/build-focus-poison-bow-momentum.md) separates its
movement-during-use condition from general Moving and Movement Speed. Conditional
damage affects the eligible Poison source once; the higher Mana cost applies
even while inactive, without assuming uptime or changing manual priorities.
The [Overabundance I/II review](docs/build-focus-poison-bow-overabundance.md)
adds Gas-only cloud-limit choices with shorter cloud persistence, not extra
Poison stacks or guaranteed coverage. Poisonburst is ineligible. PoB's generic
Nova II limit/cooldown bookkeeping is flagged rather than counted as a benefit.
The [Supercritical review](docs/build-focus-poison-bow-supercritical.md)
separates increased Critical Damage Bonus from its multiplicative crit-chance
penalty. Native source-Poison estimates do not establish live critical uptime
or real burst/cloud Hits; manual priorities and route scores stay unchanged.
The [Inexorable Critical I/II review](docs/build-focus-poison-bow-inexorable.md)
keeps elapsed-time buildup and critical-hit resets separate from maximum uptime.
Tier II's penalty affects the extra critical damage component; both tiers cost
more Mana even at zero buildup. Native capped snapshots are not route bonuses.
The [Pinpoint Critical review](docs/build-focus-poison-bow-pinpoint.md)
separates more critical chance from less extra critical damage, including
Supercritical/Inexorable pairings. Capped chance can lose damage, and a better
source-hit average need not improve native Poison. No reset uptime is assumed.
The [Ambush review](docs/build-focus-poison-bow-ambush.md) separates enemy Full
Life opening-hit eligibility from player Full Life and continuing Poison.
PoB's fixed target-state checkbox does not establish source inheritance or
sustained Full Life uptime; manual weights and route scores remain unchanged.
The [Life Leech I/II/III review](docs/build-focus-poison-bow-life-leech.md)
separates 12%/16%/16% Physical arrow-hit recovery from no-hit burst/cloud
Poison. Tier III declares source-specific retention at player Full Life,
but reviewed PoB does not model that stat. No assumed sustain or route bonus.
The [Mana Leech review](docs/build-focus-poison-bow-mana-leech.md) separates
8% Physical arrow-hit Mana recovery from Poison and unchanged upfront Mana
expenditure. No refund, guaranteed recovery, sustainable firing or route bonus.
The [Stun I/II/III review](docs/build-focus-poison-bow-stun.md) keeps hit-based
buildup separate from Poison and Heavy Stun uptime. Tier III's broad damage
penalty also reduces the supported Poison source; all tiers cost more Mana.
The [Pin I/II/III review](docs/build-focus-poison-bow-pin.md) separates Physical
hit eligibility and Stun conversion from Poison. Conditional critical chance
does not establish immobilisation uptime; Tier III's duration stat is unmodeled
in the reviewed PoB runtime. Selected Stun notes explain redirected buildup.
The [Life Drain and Soul Drain review](docs/build-focus-poison-bow-drain.md)
separates 12%-of-maximum-resource Cull recovery from Poison kills and leech.
Neither grants Cull. Warnings identify PoB's ungated LifeOnKill mapping and
missing Soul Drain mapping; no guaranteed recovery, sustain or route bonus.
The [Armour Break I/II/III review](docs/build-focus-poison-bow-armour-break.md)
keeps Physical-hit break separate from Corrosion's Poison-based break. Warnings
cover Exploit Weakness's prohibition and incomplete native amount/charge-event
modeling, without assuming Fully Broken Armour or Endurance Charge uptime.
The [Armour Demolisher I/II review](docs/build-focus-poison-bow-armour-demolisher.md)
separates 50%/70% more break strength from damage and Poison DPS. It grants no
break source or Mana multiplier and cannot bypass Exploit Weakness's prohibition.
The [Armour Explosion review](docs/build-focus-poison-bow-armour-explosion.md)
keeps its granted Fire attack separate from Poison and Gas's own detonation.
The supported skill must cause the full-break event; native child DPS is not
proof of a trigger rate, and Exploit Weakness prevents self-supplied triggers.
The [Rupture/Rusted Spikes review](docs/build-focus-poison-bow-bleed-aggravation.md)
separates conditional Bleeding aggravation from Poison and checks Heavy Stun
versus supported-skill Pin events. Pin-specific notes are reversible. Rusted
Spikes is explicitly catalog-review only, with current availability unverified.
The [Deep Cuts I/II review](docs/build-focus-poison-bow-deep-cuts.md) separates
less hit damage from more Bleeding magnitude, checks reduced native Poison-source
damage and does not invent Bleeding chance, aggravation or an automatic score gain.
The [Brutality I/II/III review](docs/build-focus-poison-bow-brutality.md) warns
that these supports disable burst/cloud and on-hit Poison, plus the reviewed
Fire-converted Gas detonation. Physical arrow hits/eligible Bleeding remain
separate. Invalid Poison suggestions are suppressed, but manual weights survive.
The [eight-skill mace batch](docs/build-focus-mace-primary-batch.md) covers
Earthquake, Earthshatter, Sunder, Supercharged Slam, Stampede, Leap Slam,
Hammer of the Gods and Volcanic Fissure with five shared support families.
Fixed timing, charge travel, Glory and converted Fire remain explicit exceptions,
not automatic DPS multipliers. Developer coverage separates context, suggestions,
constraints and scope filtering from in-app Full DPS, which remains unimplemented.
The [nine-skill quarterstaff batch](docs/build-focus-quarterstaff-primary-batch.md)
adds Falling Thunder, Glacial Cascade, Storm Wave, Flicker Strike, Gathering Storm,
Siphoning Strike, Vaulting Impact, Whirling Assault and Wind Blast with 92 common
reviewed support pairings. Non-melee bursts, charge-dependent projectiles,
external debuff setup, Perfect Timing and fixed travel/action time stay separate.
The [ten-skill bow batch](docs/build-focus-bow-primary-batch.md) adds Lightning Rod,
Stormcaller Arrow, Freezing Salvo, Snipe, Tornado Shot, Electrocuting Arrow,
Detonating Arrow, Magnetic Salvo, Spiral Volley and Shockchain Arrow, with 117
common reviewed support pairs. Tornado Shot targets intrinsic Physical DoT;
other focuses keep normal arrows, delayed bolts and conditional explosions separate.
The [ten-skill spear batch](docs/build-focus-spear-primary-batch.md) adds Spearfield,
Storm Lance, Whirling Slash, Spear of Solaris, Blood Hunt, Glacial Lance, Primal
Strikes, Rapid Assault, Disengage and Whirlwind Lance with 108 reviewed support
pairs. Hazards, lodged bolts, one-handed weapon modifiers, Glory, cooldowns and
melee collapses retain explicit component and setup boundaries.
The [seven-skill Monk batch](docs/build-focus-monk-primary-batch.md) adds Frozen
Locus, Killing Palm, Shattering Palm, Staggering Palm, Hand of Chayula, Wave of
Frost and Tempest Bell with 76 reviewed support pairs. These native Quarterstaff
focuses keep non-melee crystal explosions, always-hit Palm strikes, triggered
secondary effects and player-owned Bell shockwaves distinct; no unarmed damage
source or conditional uptime is assumed.
The [eight-skill mace/shield batch](docs/build-focus-mace-shield-batch.md) adds
Armour Breaker, Perfect Strike, Molten Blast, Rolling Magma, Forge Hammer,
Resonating Shield, Shield Charge and Shield Wall with 88 common support pairs.
Rolling Magma is explicitly Wyvern/Talisman, not Mace. Shield sources, local
shield Armour, Perfect Timing, channels and recall/cooldown mechanics stay separate.
Gem tags come from the game-generated
PoB data; applicability and starting weights are reviewed heuristics, not a
gem-tag keyword match or game-supplied power score. Each preset links its source.
Warnings identify selected manual preferences outside the skill's focus,
without deleting those choices.
Crossbow ammunition presets score the granted firing skill, not the non-damaging
load action. Grenade damage penalties are included when Attack Damage is selected;
cooldown recovery is not fuse speed or reload speed. Rake is a spear dash-hit
focus, not a shapeshift or a complete Bleeding build. Maul and Shred cover player
melee hits without inferring equipped Claw weapons, Rage uptime or conditional
Ice Fragments. Shapeshift-conditional passives and new support compatibility are
not inferred. The source notes are in [the batch reference](docs/build-focus-skills.md).
The ten-spell batch targets reviewed base hit components, not conditional Infusion
damage or complete skill performance. It does not add support compatibility.
Timing, trajectory, crystal and area-component limits are recorded in
`docs/research/2026-11-07-elemental-spell-presets.md`.
The chaos/physical batch keeps Contagion's DoT and non-damaging curses separate
from spell hits. Unearth targets the player's cone, Dark Effigy targets its
totem-fired hit, and Detonate Dead has deliberately limited corpse-physical
scope. Companion allowlists add 29 reviewed pairs with existing support choices;
no full damage, minion or totem simulation is implied. See
`docs/research/2026-11-07-chaos-physical-spell-presets.md`.
Magnified Area, Prolonged Duration, Mobility and Rapid Casting (the Arcane Tempo
game-ID family) now have reviewed component-specific options for those focuses,
adding 62 pairs without altering passive priorities. Dark Effigy's linked spell
is distinct from deployment; unsupported lifetime assumptions remain excluded.
See `docs/research/2026-11-07-chaos-physical-utility-supports.md`.
The next hit-support review adds Considered Casting, Spell Echo and Bonestorm's
Projectile Acceleration I/II combinations, plus Brutality I/II/III for four
physical-hit focuses. Brutality filters incompatible suggestions but retains
manual weights with warnings. Bonestorm III remains withheld after a native
spell-only speed/conversion discrepancy; no damage multiplier is invented.
See `docs/research/2026-11-07-chaos-physical-hit-supports.md`.
The minion/Offering batch separates minion attack and cast speed from player
modifiers. Cleric targets survival and heal-action responsiveness, not damage or
modeled revival. Offerings target lifetime and player use speed; only Pain
Offering suggests area coverage. Spike Life, shield absorption and complete
minion DPS remain unmodeled. Twenty-six companion pairs extend existing Feeding
Frenzy, Rapid Casting, Prolonged Duration, Efficiency and Mobility choices.
See `docs/research/2026-11-07-minion-offering-presets.md` for ownership checks and
withheld combinations. Suggestions remain opt-in and do not replace manual weights.
Eight additional manual preferences cover minion Critical Hit Chance, Critical
Damage Bonus, Area of Effect, Movement Speed and separate Fire/Cold/Lightning/
Chaos resistances. Reductions subtract value. All-elemental resistance contributes
once to each selected elemental channel, not Chaos or an additional aggregate.
These do not grant player benefits or calculate DPS, resistance caps or mitigation.
Existing presets do not add
these preferences automatically. See `docs/research/2026-11-07-minion-effect-preferences.md`.
Six further opt-in preferences cover minion Evasion Rating, additional Physical
Damage Reduction, Life Recoup and separate maximum Fire/Cold/Lightning resistances.
Ordinary resistance and cap modifiers are separate, including all-elemental
fanout. Native cap/timing checks confirm the boundaries; scoring is still raw
modifier preference, not capped mitigation or healing per second. Tooltips explain
resistance requirements, the native 90% caps and delayed recoup. See
`docs/research/2026-11-07-minion-defence-preferences.md`.
Four manual preferences add minion Command Skill Damage, Command Cooldown
Recovery, Temporary Minion Duration and Minion Reservation Efficiency. Commands
are separate from basic minion actions; duration does not extend persistent
summons, and efficiency is not a linear cost reduction or guaranteed extra minion.
Reductions retain their penalties; existing preset suggestions stay unchanged.
Native selected-command, temporary/persistent and reservation-rounding checks
are recorded in `docs/research/2026-11-07-minion-command-preferences.md`.
Ten opt-in Companion preferences add damage, maximum Life, attack/movement speed,
area, Fire/Cold/Lightning/Chaos resistances and reservation efficiency. Their
wording is scored separately from ordinary minion/player lines; broader minion
bonuses may also benefit Companions and remain separately selectable. Presence,
transfer, damage-as-extra, cast-speed and composite Companion-limit mechanics
remain outside this batch. Native checks use a real Rhoa Companion, ordinary
skeleton and non-minion controls. See
`docs/research/2026-11-07-companion-preferences.md` for the scope and limits.

**Reviewed supports** provides a small allowlist for these skill focuses:
Projectile Acceleration III, Controlled Destruction, Ritualistic Curse, Focused
Curse, Swift Affliction I/II, Feeding Frenzy I/II, Heavy Swing, Rapid Attacks I/II,
Concentrated Area, Close Combat II and Fist of War I. Only reviewed combinations
are offered; this is not a complete support catalog or gem-loadout recommendation.
Selecting supports updates suggestions, matching eligibility and warnings, not existing priorities.
**Apply support priorities** previews and applies only the listed changes; **Add
suggestions** still preserves existing weights. Removing a support does not undo
preferences. Changing focus clears support selections but keeps preferences.
Support selections round-trip with saved/exported builds, with one tier per family.

Support effects inform editable heuristic priorities, not DPS multipliers. Gem
socket/attribute requirements, unlisted supports, conversions, triggered setups,
Infusions, unreviewed weapon-specific passive bonuses, stun/ailment mechanics, combo timing
and full build calculations are not modeled. Sources and scope decisions are
recorded in `docs/research/2026-11-07-support-preference-refinements.md` and
`docs/research/2026-11-07-melee-skill-presets.md` and
`docs/research/2026-11-07-bow-spear-skill-presets.md`. The bow/spear presets target
hits, not bleed, ignite or ground-effect DPS. Projectile supports are reviewed
individually; Concentrated Area is offered for Rain of Arrows and Explosive Spear,
not Ice Shot's shard spread or Lightning Spear's targeting radius. Rain overlap,
charge availability, detonation timing and lodged-spear limits are not simulated.

Projectile Speed also recognizes the exact unconditional **Projectile Speed for
Spell Skills** wording when the focus is Spark, Fireball, Essence Drain or Frostbolt.
Increases and reductions add to general Projectile Speed once, at its selected
priority. Essence Drain uses this only as delivery-speed utility when that
preference is explicitly selected, not as DoT damage. Manual/no-focus, attack,
curse and minion presets do not receive this spell-only bonus. Conditional lines
and other unreviewed skill-specific wording remain excluded. The preference
tooltip indicates whether the rule applies to the current focus.

The existing **Critical Hit Chance** preference also counts exact unconditional
increased/reduced variants **for Spells** with Spark/Fireball and the ten reviewed
elemental spell focuses, and **for Attacks**
with Lightning Arrow, the four melee presets and the four bow/spear presets.
**Area of Effect for Attacks** joins the Area of Effect preference for those
attack focuses except Ice Shot, whose reviewed native hits have no area flags.
Area is coverage, not hit damage; Lightning Spear's area is targeting utility
and is not suggested automatically. Scoped matching does not automatically
select crit or change priorities.
No focus, curses, minions and
Essence Drain's DoT focus do not receive these scoped bonuses. Controlled
Destruction disables scoped spell crit; generic manual crit remains unchanged
and can still serve other skills. Base-crit overrides, critical damage, area
damage, conditional lines and unreviewed scopes remain excluded.

The existing **Attack Damage** and **Attack Speed** preferences also recognize
exact unconditional increased/reduced **Damage with Bows** and **Attack Speed
with Bows** for Lightning Arrow, Ice Shot and Rain of Arrows, and the corresponding
**with Spears** wording for Lightning Spear and Explosive Spear. The same rules
apply to **with Quarterstaves** for Ice Strike and Tempest Flurry and **with Maces**
for Boneshatter and Rolling Slam. Weapon damage joins Attack Damage once; it is
not copied into physical or projectile damage. Generic staff wording is not
treated as Quarterstaff wording.
Generic and matching weapon bonuses add together, including reductions. Other
weapon types, manual/no-focus, spells and minions do not receive these scoped
bonuses. Physical-only weapon damage, unreviewed weapon critical stats, conversions and
conditional lines remain unreviewed. Tooltips explain the current focus without
adding controls. See `docs/research/2026-11-07-bow-spear-passive-matching.md` and
`docs/research/2026-11-07-quarterstaff-mace-passive-matching.md`. The bundled tree
currently has four Quarterstaff speed nodes and four Mace damage nodes, but no
unconditional Quarterstaff damage or Mace speed lines. Matching does not invent
missing stats or model stun, aftershocks, combo timing or unarmed gear setups.

For Ice Strike, Tempest Flurry, Boneshatter and Rolling Slam, **Attack Damage**
also includes exact unconditional increased/reduced **Melee Damage** lines.
General attack, matching weapon and melee bonuses add once in that preference;
Melee Damage is not copied into physical, elemental or projectile damage. Other
focuses and manual/no-focus do not receive it. Close-range, full-life, stunned,
immobilised and other conditional variants remain excluded. This adds matching
for 29 nodes in the bundled graph without changing priorities or shortest mode.
See `docs/research/2026-11-07-unconditional-melee-damage-matching.md`.

The optional **Critical Hit Chance** preference also recognizes exact
unconditional increased/reduced **Critical Hit Chance with Quarterstaves** for
Ice Strike/Tempest Flurry and **with Spears** for Lightning Spear/Explosive Spear.
Generic, attack-only and matching weapon crit values add once. Crit is never
automatically selected by a preset or Add suggestions; without that preference
these lines provide no route score. Wrong weapons, critical damage, base-crit
changes, more/less multipliers and conditional variants remain excluded.
These are heuristic priorities, not a calculation of actual crit chance or DPS.
See `docs/research/2026-11-07-optional-weapon-critical-chance.md`.

For **Fireball**, Area of Effect also counts exact unconditional **Spell Skills
have increased/reduced Area of Effect** lines. Generic and spell-only area add
once, including reductions, for explosion coverage rather than hit damage.
Unreviewed focuses, Echoed Spells and conditional modifiers do not gain this scope.
The eight area-enabled spells in the new batch also recognize reviewed spell area
damage and coverage. Frostbolt's area modifiers concern its collision explosion,
not its travelling hit; Arc and Eye of Winter do not gain area scopes.
Fireball also offers a separate **Spell Area Damage** preference at Normal.
Exact increased/reduced Spell Area Damage lines count only there, including
Ruin's +35% and Roil's -10%, without being copied into general Spell Damage,
Fire Damage, Projectile Damage or coverage. This concerns the explosion only,
not the travelling projectile, firebolts or ignite; it is not Full DPS.
For an existing Fireball setup, use Add suggestions or select Spell Area Damage
to include those tradeoffs. Existing saved preferences are not changed on load.
Manual priorities, point budgets and shortest mode remain unchanged.
See `docs/research/2026-11-07-spell-area-matching.md`.
The damage-scope review and native checks are in
`docs/research/2026-11-07-fireball-spell-area-damage.md`.

Four optional recovery preferences recognize unconditional percentage modifiers:
**ES Recharge Start**, **ES Recharge Rate**, **Life Regeneration Rate** and
**Mana Regeneration Rate**. Faster/increased values add score; slower/reduced
values subtract it. Each uses 10% per Normal score unit, separately from maximum
Life/Mana/ES and actual recovery per second. Add them through **Add effect
preference**; presets and saved priorities are not changed automatically.
Conditional recovery, flat regeneration, recovery conversions and disabled
recovery mechanics are not simulated. See
`docs/research/2026-11-07-unconditional-recovery-preferences.md`.

**Elemental Ailment Threshold**, **Cooldown Recovery Rate**, **Life Flask
Recovery** and **Mana Flask Recovery** are also opt-in preferences, at 10% per
Normal score unit. Exact unconditional increases/reductions remain signed.
Combined Life/Mana flask lines contribute once to each selected pool, without
counting the passive point twice. Conditional/scoped effects, threshold
conversions, flask recovery rate and charge generation remain separate and
unmodeled here. These are modifier scores, not actual cooldown seconds or
sustain. See `docs/research/2026-11-07-threshold-cooldown-flask-preferences.md`.

**Life Recoup**, **Mana Recoup** and **Energy Shield Recoup** match literal
unconditional damage-taken percentages, including the combined three-pool line.
Flask charge preferences distinguish generic/Life/Mana **Charges Gained**
modifiers (including reductions) from flat Life/Mana **Charges per Second**.
Combined effects do not double-count passive points; Flask-and-Charm lines score
only the flask modifier. Everything is opt-in, with units and exclusions in the
existing tooltips, not actual sustain or flask-uptime simulation. See
`docs/research/2026-11-07-recoup-flask-charge-preferences.md`.

**Stun Recovery**, **Presence Area of Effect** and **Skill Movement Penalty
Reduction** are opt-in, with ordinary reductions penalized and movement-penalty
reductions rewarded. The related recovery/utility batch adds separate **Life/Mana
Leech Amount**, **Life Leech Speed** and generic/Mana **Flask Charge Cost
Reduction** preferences. All use 10% per Normal score unit and retain literal
tradeoffs rather than calculating sustain or uptime. Slowing protection and
recoup speed remain unmodeled. See
`docs/research/2026-11-07-utility-recovery-preferences.md`.

Reviewed spell support context now also includes **Magnified Area I/II**,
**Prolonged Duration I/II**, **Efficiency I/II** and **Mobility**, only for the
explicitly reviewed focuses. These choices explain area, duration, resource and
movement constraints without adding gem magnitudes to passive scores or changing
your weights. See `docs/research/2026-11-07-utility-support-refinements.md`.

**Accuracy Rating**, **Block Chance** and **Stun Threshold** are also available
through **Add effect preference**. Exact unconditional increased/reduced
percentage modifiers score positively/negatively, at 10% per Normal score unit.
They are opt-in: preset suggestions and saved priorities are not changed.
Tooltips distinguish rating/modifier gains from actual hit/block probability
and stun resistance; flat accuracy, maximum block, conditional effects and
threshold conversions are excluded. See
`docs/research/2026-11-07-unconditional-combat-preferences.md`.

**Critical Damage Bonus**, **Stun Buildup** and **Freeze Buildup** are additional
opt-in preferences, including reductions, at 10% per Normal score unit.
Only exact unconditional percentage lines count. Critical damage stays separate
from critical chance; outgoing buildup stays separate from stun resistance,
duration and elemental damage. Tooltips explain the limits; presets and saved
priorities are unchanged. See
`docs/research/2026-11-07-critical-damage-and-buildup-preferences.md`.

The combined elemental/ailment batch adds **Fire, Cold, Lightning and Elemental
Penetration**; **Flammability, Ignite, Shock, Poison and Bleeding Magnitude**;
**Shock Chance Modifier**; and separate **Ignite, Poison, Bleeding, Shock and
Freeze Duration** preferences. Increased/reduced ailment modifiers remain signed;
penetration uses its separate flat stat wording, not invented increased/reduced
penetration aliases. Everything is opt-in through the existing effect picker.
Tooltips explain ownership, application and simulation limits. Preset suggestions,
saved priorities and shortest routing are unchanged. See
`docs/research/2026-11-07-elemental-ailment-preferences.md`.

## GitHub Pages

This repo is prepared for GitHub Pages at:

```text
https://traecneh.github.io/PoE2-Tree-Optimizer/
```

The Pages workflow is in `.github/workflows/pages.yml`. On pushes to `main`, it installs dependencies, runs release validation (all tests, build, graph and coverage checks), and deploys `dist/`.

Manual GitHub setup:

1. Push the repository to GitHub.
2. Open the GitHub repository settings.
3. Go to `Pages`.
4. Set `Build and deployment` source to `GitHub Actions`.
5. Push to `main` or run the `Deploy to GitHub Pages` workflow manually.

If the repository name changes, set `VITE_BASE_PATH` during build or update the default base in `vite.config.ts`.

## Data Layout

Tracked deploy data:

```text
data/tree-graph.json
data/tree-assets/
```

Generated public data:

```text
public/tree-graph.json
public/tree-assets/
```

The generated public files are ignored so they can be refreshed locally without duplicate source-of-truth churn.

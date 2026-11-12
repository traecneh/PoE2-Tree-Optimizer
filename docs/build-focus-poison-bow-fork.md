# Poison Bow Fork Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB 0.23.1,
tree 0.5.5f; moving upstream generated support data was also checked. Scope:
Poisonburst Arrow and Gas Arrow, not all legal Projectile skills or Full DPS.

## Source and Compatibility

`SupportForkPlayer`, family `Fork`, has one positive catalog tier-three entry,
named Fork (no invented I/II tiers). Generated data requires Projectile and
excludes ProjectileNoCollision. Both real parents pass compatibility; synthetic
missing-Projectile/no-collision probes fail. Fork can be linked alongside each
Pierce tier; compatibility does not prove a Fork occurs.

- 30% less Damage after Forking, not before it.
- 10% additional Mana cost multiplier, applied before native rounding.
- `projectiles_fork` maps to `ForkOnce` and `ForkCountMax` in the frozen
  `SkillStatMap.lua:1916-1918`.
- The generated 100-valued terrain-arrow-attachment reduction stat has no
  calculation mapping in this runtime. It is not treated as extra Gas cloud
  placement, a guaranteed detonation, or a modeled terrain interaction.

The game-authored Fork glossary (mirrored in PoE2DB) describes a fork on the
first enemy collision that does not Split or Pierce. Therefore a piercing
collision cannot also Fork. With always-Pierce active, enemy collisions that
pierce do not provide enemy-hit Forks. This is not gem incompatibility: choices
and Fork's Mana multiplier remain. Skill/item exceptions are not inferred.

Native `CalcOffence.lua:1325-1354` handles separate Fork and Pierce counters.
It accepts one configured fork alongside Pierce III's "All targets" sentinel.
This demonstrates a model limitation, not a valid same-collision sequence.
Paired UI warnings are shown on both selected supports. I/II warnings describe
the need for a non-piercing collision; III additionally warns against crediting
Forks merely because the native counter is configurable. Removing either
support restores the other's original summary; normalized first-family
selection is respected even with malformed duplicate tier IDs.

## Component and Poison Boundaries

Poisonburst's actual arrow and forked continuation are distinct from the no-hit
Poison burst. Gas delivery/ground placement are distinct from no-hit cloud Poison
and the conditional Fire explosion. No extra burst/cloud contacts, applications,
overlaps, enemy count, boss hits or uptime are assumed. Fork does not supply
Poison chance, ignition or a detonator.

The native conditional MORE modifier uses `ForkedCount >= 1`. All five component
calculations inherit it, including synthetic Poison-source fields. A post-fork
counter lowers those source estimates; it does not turn burst/cloud Poison into
hits or prove live-game source inheritance. The source reduction is counted
once, not again as a separate Poison multiplier or an assumed doubled DPS gain.

## Bounded Native and Independent Checks

58 MAIN calculations: empty level-90 Witch, level-20/quality-zero skill,
Physical Crude Bow (6-9 damage), sufficient attributes, boss None, distance 20,
explicit zero/one Fork/Pierce counters, enemy Bleeding/Poisoned false.
Installed PoB and user builds untouched; no runtime source modifications.

| Native source estimate | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Baseline Poison/s / before configured fork | 5.385766 | 4.003854 |
| After configured fork | 3.719227 | 2.796134 |
| Fork plus I/III, both counters one | 3.018061 | 2.192274 |

The last row is conditional arithmetic only, especially not evidence of a
possible Fork with active always-Pierce. Separate modifiers multiply to
`0.7 * 0.8 = 0.56`; they are not summed to 50% less. With Pierce II there is
no additional damage penalty. II/III reversed link orders give identical
damage/cost outputs while retaining both supports.

Arrow average hit baseline -> post-fork: Poisonburst 5.38125 -> 3.80625,
Gas 1.8375 -> 1.3125. Conditional Gas Fire explosion: 22.05 -> 15.75.
These are component estimates, not aggregate DPS or guaranteed contacts.

| Mana before/after adding Fork | Poisonburst | Gas |
| --- | ---: | ---: |
| No other cost-changing support | 38 -> 41 | 62 -> 68 |
| Efficiency II | 23 -> 25 | 38 -> 41 |
| Poison III | 45 -> 50 | 74 -> 81 |

The verifier reconstructs costs from raw base cost and combined multipliers,
not the previously rounded linked cost. Efficiency II applies its own reduction
after that rounding. No sustain claim is made.

Five `30% less Damage` scalar controls exactly match post-fork damage fields.
Independent verification reconstructs rounded weapon-derived Physical and
converted-Fire ranges, source-weighted Poison ratios once, crit-weighted hit
channel sums, costs, fork limits and reversed-order results. Poison III arrow
Poison is tested separately from inherent burst/cloud Poison. Chance, duration,
magnitude, max Poison stacks, speed, source rolls, Accuracy, critical chance,
projectile speed, radius and burst/cloud timers stay unchanged within context.

Ignored evidence: `var/poison-bow-fork-20261109/` contains driver, native JSON,
verifier and logs. Independent source fixtures/tests require no PoB/network.

- [Generated Fork data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2245)
- [Fork stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L1916)
- [Native counters](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L1325)
- [Game-authored Fork glossary mirror](https://poe2db.tw/us/Fork#ForkRef)

Moving links are not claimed byte-identical to the frozen runtime. The glossary
is used for its game-authored definition, not community guide analysis.

## Implementation and Coverage

One unique choice/two reviewed pairs. Existing normalization, selection/removal,
saved export and disabled controls are reused. Only contextual summaries change;
manual preferences, suggestions, exclusions, scopes, scores and shortest routing
stay unchanged. Chaos Attunement's mixed-source caution and prior Withering
Touch, Malady, Blindside, range and Exploit Weakness/Corrosion warnings survive.
No new controls, parser categories, schema or collision/DPS engine.

77/567 raw choices (13.6%); 76/450 positive-tier (16.9%); 48 families, 546 pairs;
54 choices per Poison bow focus. Skills remain 103/399 (98/234 positive-tier),
preferences 184, wording 864/2182 and occurrences 3444/5451. Counts describe
scoped review/heuristic coverage, not overall completion. No catalog refresh,
baseline reset or routing audit.

## Validation

Native verifier passed all 58 rows, compatibility probes and five scalar controls.
Focused regressions passed 311 tests across five files. The final paired-summary
lookup uses the first scoped Pierce ID directly rather than re-normalizing all
support families; the release run rechecks the equivalent selection behavior.
`npm run validate:release` passed: 3,224 tests in 148 files, typecheck, production
build, graph validation and coverage baseline; 68.954 seconds. The existing
large-chunk advisory remains nonblocking.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke checks passed both 54-choice lists, standalone Fork,
all three Pierce pairings, reverse-order III selection, removal/restoration,
conditional/cost/contact notes, unchanged weights, mixed-source caution and
earlier support warnings. Screenshot inspection confirms readable notes and a
rendered tree without overlap. After reload the console had zero errors/warnings
and there were no page errors. Initial launch had only the existing preview
`/favicon.ico` 404, inspected separately.

Evidence: `output/playwright/poison-bow-fork-20261109/`. These are local
source/native/runtime checks, not an in-game test or user acceptance. Nothing
committed, pushed or deployed.

## Next Proposed Batch

The subsequent [Chain I/II/III review](build-focus-poison-bow-chain.md) checks
hit-only penalties versus source-derived Poison, unchanged costs and collision
priority with Fork/Pierce without assuming repeated targets or extra applications.

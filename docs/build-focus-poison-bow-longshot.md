# Longshot I/II for Poison Bow Focuses

Two optional choices, one family and four reviewed pairs: Poisonburst Arrow and
Gas Arrow. Context-only distance scaling, not unconditional Poison DPS. Native
catalog tiers are 2/3. The tiers replace each other rather than stacking.

## Distance and Component Boundaries

- Generated I/II have up to 25%/35% more Attack Damage, with no bonus at 3.5
  metres or closer, a linear ramp to 7 metres, then a capped full bonus. Native
  units are ten per metre. The stat describes distance from the player to the
  enemy, not projectile travel distance, Projectile Speed, Pierce or cloud age.
- PoB's effective skill distance uses the explicit enemy-distance config, or
  its 20-unit placeholder when omitted. This default is two metres and grants
  no Longshot bonus, not an implicit maximum-range assumption. Missing modifier
  distance is also not a maximum-range instruction.
- The reviewed native attack source scales at the configured distance, including
  synthetic burst/cloud Poison sources. This changes source damage, not Poison
  magnitude, chance, timers, maximum stacks, area or firing speed. No second
  Poison multiplier or unconditional routing weight is added.
- Poisonburst's initial-arrow hits/separately enabled on-hit Poison remain
  outside the no-hit burst focus; linked Poison duration stays separate.
  Gas's no-hit cloud remains separate from initial-arrow and conditional Fire
  explosion hits. The native Fire explosion also scales, unlike Heft's
  maximum-Physical modifier; ignition/detonation and contacts are not supplied.
- PoB applies distance-dependent Accuracy loss separately. Longshot supplies no
  Accuracy and moving farther away can reduce native hit/crit/application and
  strongest-Poison-roll estimates even after its damage bonus has capped.
  Synthetic no-hit calculation fields do not establish real cloud/burst hits.
- Movement, contact, actual uptime, Poison snapshotting/dynamic recalculation
  after application, overlap and boss performance are not simulated. Configured
  distance is an input, not proof of maintaining that separation in game.
- Both tiers add 20% Mana cost even at close range with zero damage bonus.
  Efficiency II offsets cost separately, not guaranteed sustain or usable attack
  rate. Manual priorities, class/goals/budgets and other support families remain
  intact. Existing Malady/Blindside warnings are preserved. No new passive
  scopes/parser/solver, point-count changes or save schema; Shortest is unchanged.

## Native and Independent Evidence

63 isolated MAIN calculations in the frozen, unmodified PoB 0.23.1 runtime:
empty-tree Witch, level-20 skills, normal Crude Bow, sufficient attributes,
boss None and enemy Poisoned/Bleeding false. Actual equipped Bow, active/stat
set, effective mode, applied links, enemy flags and effective distance are
asserted. Installed PoB and user builds are untouched.

- 30 baseline/I/II source rows across both focuses and omitted/35/52.5/70/120 units.
- Nine actual-arrow and conditional Fire-explosion rows at 70 units.
- Six actual-arrow Poison III rows and six Efficiency II source rows at 70 units.
- Four independent scalar Attack Damage controls, midpoint/full range for both.
- Eight accuracy-restricted near/far controls, baseline/II for both focuses.
- Four compatible links and four missing-attack-type rejection controls.

The raw midpoint ramp is 12.5%/17.5% more at 5.25 metres. PoB rounds its MORE
factor to the nearest percent, producing 1.13/1.18 in this runtime. This is
native model behavior, not proof that the game rounds identically. Independent
18%/35%-more Attack Damage controls match II's same-range source/hit/Poison
output exactly, apart from Longshot's Mana cost. The initial attempted 17.5%
custom text was not parsed; initial JSON/logs are retained. The corrected scalar
control uses the observed rounded factor without altering runtime code/data.

| Native Poison/s estimate | Poisonburst I / II | Gas I / II |
| --- | ---: | ---: |
| Default two metres / 3.5 m (same as baseline) | 5.385766215481 / same | 4.0038541776187 / same |
| 5.25 metres | 6.0869320057983 / 6.2698448206637 | 4.4501854629926 / 4.6077141519481 |
| 7 metres | 6.7372886808752 / 7.1539234258464 | 4.9884084835905 / 5.2772110800089 |
| 12 metres, damage bonus already capped | 6.4383799818633 / 6.8342289494255 | 4.7952033117092 / 5.0834829900936 |

These are configured native estimates, not measured game DPS. Same-range
baseline comparisons isolate the support from Accuracy changes. The all-row
verifier independently reproduces support/base ratios from the rounded source
range and `min + (max - min) * roll`, without multiplying hit and Poison gains
twice. Default/close-range damage outputs match baseline while Mana still rises.

In a separate 90%-less-Accuracy fixture, near/far hit chance is 86%/22% with or
without II. Despite the full far-range 1.35 damage modifier, the native Poison
estimate drops from 5.1407527211226 to 4.403916 for Poisonburst, and from
3.8503496414138 to 2.3487552 for Gas. Potential applications drop to 0.792/0.528,
with roll average 50%. Neither the fixture nor the app assumes real uptime.

| Native cost or invariant | Poisonburst | Gas |
| --- | ---: | ---: |
| Base -> I or II Mana (all ranges) | 38 -> 45 | 62 -> 74 |
| With Poison III, base -> I or II Mana | 45 -> 54 | 74 -> 89 |
| With Efficiency II, base -> I or II Mana | 23 -> 27 | 38 -> 45 |
| Inherent Poison / displayed skill duration | 3 / 3.003 s | 2 / 4.026 s |
| Radius / firing speed / maximum Poison stacks | 24 / 1.2 / 1 | 18 / 1.2 / 1 |

Poison magnitude stays one and inherent chance 100%. Poison III supplies its own
60% arrow chance and separate two-second Poison; Bleeding is explicitly off.
At seven metres Gas's native Fire-explosion average hit goes 22.05 -> 27.3/29.925,
without granting Poison or a detonation trigger. Damage-range rounding means
final hit/Poison outputs need not be exact 1.25/1.35 multiples of displayed values.

Evidence: `var/poison-bow-longshot-20261109/` (driver, current/initial native JSON,
verifier/logs). Frozen facts: `src/tree/poisonBowLongshotSupports.fixtures.ts`.
Ordinary tests require no native PoB or network. Startup missing-node notices
are retained and do not affect the empty-tree fixture. Source/native checks are
not in-game distance, contact, snapshotting or sustained-performance tests.

- [Generated Longshot tiers](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2906)
- [Effective distance input and units](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua#L1621)
- [Distance-ramp interpolation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Classes/ModStore.lua#L577)
- [Native MORE-factor rounding](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Classes/ModList.lua#L119)

Moving upstream references are not claimed byte-identical to the frozen runtime.

## Coverage and Next Batch

Pairs 516 -> 520, choices 63 -> 65, families 40 -> 41. Each Poison focus has
41 choices including Malady's catalog-only review. Supports are 65/567 (11.5%);
positive-tier coverage is 64/450 (14.2%). Skills remain 103/399 (98/234
positive-tier), preferences 184, main-tree wording 864/2182 and occurrences
3444/5451. No catalog refresh or baseline reset.

Historical next proposal: Close Combat I/II for both focuses. Completed locally
in the [Close Combat successor review](build-focus-poison-bow-close-combat.md),
including same-distance pairing with Longshot. Counts above describe this earlier
Longshot batch, not current coverage. No push or deployment is implied.

## Verification

The corrected native 63-row verifier passed, as did focused regressions (208 tests
across four files). One `npm run validate:release` passed 3067 tests across 139
files, typecheck, production build, graph validation and the unchanged coverage
baseline in 73309 ms. Existing main-chunk advisory remains non-blocking (732.55 kB).
No catalog refresh, baseline reset or additional route audits.

An isolated Edge production-preview smoke passed I/II for both focuses: 41 choices
each, distance/component/Accuracy/Mana notes, tier replacement/removal, other
links and unchanged manual Attack Damage/Poison Magnitude/Accuracy Rating weights
on selection and Add suggestions. Prior Malady chance-direction notes remained
visible; no automatic support-priority action appeared. Final console: zero
errors/warnings and no page errors. An initial unrelated favicon 404 was absent
after reload. Screenshot inspected: nonblank tree and readable notes/controls,
without overlapping text. User saves were isolated and the browser session closed.
DOM/JSON tests cover disabled controls, class, goals, budget, both saved tiers and
independent Blindside warnings. Browser persistence/Firefox matrices were not
repeated because those implementations and layout did not change.

Logs: `var/poison-bow-longshot-20261109/`. Repeatable smoke and inspected screenshot:
`output/playwright/poison-bow-longshot-20261109/`. Existing preview reused; served
HTML and actual entry JS matched final dist. Entry returned HTTP 200 as JavaScript
(732554 bytes), not HTML fallback. Scoped `git diff --check` passed with only the
existing README line-ending advisory. Local preview:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. No commit, push or live deployment.

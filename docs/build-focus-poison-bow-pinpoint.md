# Poison Bow Pinpoint Critical Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f, plus moving upstream generated data. Two context-only
pairs, not a general Hit-skill allowlist or Full DPS model.

## Semantics and Compatibility

Pinpoint Critical (`SupportPinpointCriticalPlayer`, family PinpointCritical,
catalog tier 2) gives 60% more Critical Hit Chance and 30% less Critical Damage
Bonus. It has no added Mana multiplier. Chance is multiplicative (5% -> 8%),
not +60 percentage points, and remains capped. The penalty scales the extra
critical damage component: a 2x critical multiplier becomes 1.7x, not 1.4x.
It cannot restore prohibited critical hits or guarantee a net gain.

Requires Damage OR Attack OR CrossbowAmmoSkill with no prohibited types. Both
real parents pass native compatibility. Two groups reject missing requirements
and accept each synthetic fallback; controls do not expand the curated list.

Actual arrow hits and separately enabled on-hit Poison remain separate from
Poisonburst's no-hit burst and Gas's no-hit cloud. Gas's conditional Fire
explosion stays separate again. Source-hit fields are not real burst/cloud
Hits or proof of live critical inheritance, extra contacts or applications.

Sources:
- [Pinpoint data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7342)
- [Supercritical data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8277)
- [Inexorable data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5938)
- [Native critical/source calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving links are not claimed byte-identical to the frozen runtime.

## Support Pairings and Time

With Supercritical, chance multipliers are 1.6 * 0.8 = 1.28, not an additive
40% more. Its 100% increased Critical Damage Bonus remains separate: the normal
fixture's combined multiplier is 1 + 2 * 0.7 = 2.4x, not 3 * 0.7.

With capped Inexorable II, extra critical damage uses 0.5 * 0.7 = 0.35,
not an additive 80% penalty. The normal combined multiplier is 1.35x;
with Supercritical too it is 1 + 2 * 0.35 = 1.7x. Inexorable chance remains
increased chance, separate from the More factors. Explicit time examples:

| Supports | Time | Chance | Critical multiplier |
| --- | ---: | ---: | ---: |
| Pinpoint | 0s | 8% | 1.7x |
| Pinpoint + Supercritical | 0s | 6.4% | 2.4x |
| Pinpoint + Inexorable I | 2s | 9.6% | 1.7x |
| Pinpoint + Inexorable I | 10s | 16% | 1.7x |
| Pinpoint + Inexorable II | 2s | 14.4% | 1.56x |
| Pinpoint + Inexorable II | 5s | 24% | 1.35x |
| All three, Inexorable I | 5s | 9.6% | 2.4x |
| All three, Inexorable II | 5s | 19.2% | 1.7x |

These are fixed-time snapshots, not reset-cycle averages. Changed critical
chance can change Inexorable reset frequency, so using the same elapsed time
does not establish sustained uptime or relative real DPS. All time inputs are
explicit; PoB's ten-second default is not silently accepted as measured uptime.
No maximum buildup or rotation is supplied by selecting these supports.

## Native and Independent Checks

71 MAIN calculations use an empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None and enemy
Bleeding/Poisoned false. No installed PoB, user builds or runtime source changed.
Five components have baseline/Pinpoint/parsed-control rows (15). Burst/cloud
sources have Never Crit and capped-chance pairs, Supercritical pairs, both
Inexorable tiers at 0/2/5/10 seconds without/with Pinpoint, and triple-support
five-second pairs (52). Actual arrows with Poison III add four rows.

| Native Poison/s | Without Pinpoint | With Pinpoint |
| --- | ---: | ---: |
| Poisonburst burst source, baseline | 5.385766 | 5.445254 |
| Gas cloud source, baseline | 4.003854 | 4.043779 |
| Poisonburst + capped Inexorable II | 5.629365 | 5.621153 |
| Gas + capped Inexorable II | 4.167688 | 4.194135 |
| Poisonburst, 100% crit control | 9.217391 | 7.834783 |
| Gas, 100% crit control | 7.176471 | 6.100000 |

At capped Inexorable II, Poisonburst's source-hit average improves from
5.509375 to 5.555500 while its native Poison estimate declines slightly.
Thus a better hit average does not necessarily mean better Poison even in
the same native model. Both capped-chance controls lose damage, while both
Never Crit controls are unchanged. None is a live uptime measurement.

Independent verification reconstructs all rounded source ranges, chance caps,
separate increased/More modifiers, extra-bonus multipliers, critical-weighted
hits and native source-Poison math. The latter assumes sustained applications:
potential N, source-roll N/(N+1), and critical presence 1-(1-c)^N. The app does
not turn those assumptions or estimates into automatic route weights.

Poison chance, magnitude, duration, stack cap, source roll/application potential,
deployment speed, radii and skill timers are unchanged. Poison III on actual
arrows remains 60% chance with the Bleeding condition false. Pinpoint changes
none of the fixture costs: 38/62 ordinarily, 45/74 with Inexorable or Poison III.
Other supports' existing multipliers still apply. No extra clouds, detonation,
Poison applications, stacks or duration are inferred.

All 71 rows, two compatibility groups and five parsed modifier controls passed
independent checks. Ignored evidence: `var/poison-bow-pinpoint-20261110/`.
The frozen runtime's known startup missing-node messages are unrelated to
these empty-tree fixtures; user builds and runtime sources remain untouched.

## App Behavior and Coverage

Two context-only pairs. Toggling Pinpoint preserves Supercritical, either
Inexorable tier, older support warnings, manual weights, suggestions,
exclusions, scope, scores and budgets. Save/JSON round trips retain selected
IDs. No new uptime controls, automatic priority action or routing changes.

94/567 raw support choices (16.6%), 93/450 positive-tier (20.7%), 58 families
and 578 pairs. Poisonburst offers 69 choices; Gas offers 71. Skills stay
103/399 (98/234 positive), preferences 184, wording 864/2182 and occurrences
3444/5451. Scoped coverage, not overall completion; no baseline refresh.

## Validation

Focused regressions passed 296 tests in nine files, including twelve new pure
tests and two UI cases.

`npm run validate:release` passed 3,377 tests in 158 files, typecheck,
production build, graph validation and unchanged coverage baseline in 120.869
seconds. The existing large-chunk advisory remains nonblocking (main 777.21 kB,
191.58 kB gzip); no unrelated performance refactor or data refresh.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke passed both 69/71-choice lists, Pinpoint selection,
removal/restoration, preservation when changing Inexorable tiers, pairing/cost
notes and unchanged manual weights/earlier warnings. No unexpected priority
action or page errors. Screenshot inspection confirmed readable notes and a
rendered tree without overlap. After reload the console had zero errors/warnings;
the initial existing preview `/favicon.ico` 404 was inspected separately.

Browser evidence: `output/playwright/poison-bow-pinpoint-20261110/`.
These are source/native/regression/browser checks, not in-game tests or user
visual acceptance. No commit, push or deployment.

## Next Proposed Batch

The proposed Ambush review is now completed separately in
[the next checkpoint](build-focus-poison-bow-ambush.md). It keeps enemy versus
player Full Life, opening-hit eligibility and native continuing-Poison estimates
separate without assuming target-state uptime or source inheritance.

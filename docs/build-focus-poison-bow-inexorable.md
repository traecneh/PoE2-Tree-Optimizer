# Poison Bow Inexorable Critical Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f, plus moving upstream generated data. Four context-only
skill/support pairs, not a broad compatibility allowlist or Full DPS model.

## Buildup, Penalty and Reset

| Tier | Increased Critical Hit Chance per second | Chance cap | Less Critical Damage Bonus per second | Penalty cap | Mana multiplier |
| --- | ---: | ---: | ---: | ---: | ---: |
| I | 10% | 100% at 10s | None | None | 20% higher |
| II | 40% | 200% at 5s | 10% | 50% at 5s | 20% higher |

Increased chance is not flat percentage points or guaranteed critical hits.
Tier II scales the extra critical damage component, not total damage: with
100% base Critical Damage Bonus, 50% less changes a 2x critical multiplier
to 1.5x, not 1x. Its per-second penalty accumulates to a capped More modifier;
it is not 0.9 raised to elapsed seconds. More buildup need not improve damage.

Generated stat descriptions say the accumulated chance and Tier II penalty
are lost whenever a skill supported by Inexorable Critical critically hits.
Do not substitute all hits, all critical hits from unrelated skills, elapsed
cloud life, Poison ticks, or skill use for that reset event. No multi-skill
rotation, reset-cycle distribution or maximum uptime is inferred.

Both require Damage OR Attack OR CrossbowAmmoSkill and prohibit UsedByProxy,
Triggered and Persistent. Both real parents pass. Four native compatibility
groups reject missing requirements and every prohibition and accept each
synthetic required-type fallback. Catalog tiers are 3/4; both use generated
family InexorableCritical. Controls do not expand the curated allowlist.

Sources:
- [Tier I data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5938)
- [Tier II data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L5979)
- [Reset stat descriptions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/StatDescriptions/gem_stat_descriptions.lua#L24787)
- [PoB elapsed-time configuration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua#L449)

Moving links are not claimed byte-identical to the frozen runtime.

## Native Time Snapshots, Not Uptime

PoB defaults SecondsSinceInevitableCrit to ten seconds: enough to cap both
tiers. This is a configured snapshot, not evidence the build sustains that
state. Explicit nonzero times below four seconds also set native recently-crit
conditions; the reviewed zero input did not emit that condition. No such
conditions, timers or uptime are supplied by the app's support selection.

75 MAIN calculations use an empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None and enemy
Bleeding/Poisoned false. No installed PoB, user builds or runtime source changed.
Five components each have baseline, both tiers at 0/2/10 seconds and two parsed
five-second modifier controls (45 rows). Burst/cloud sources additionally cover
5/20 seconds, omitted/default time, Supercritical pairing and Never Crit; actual
arrows cover Poison III (30 rows). Zero rows restore baseline damage but keep
the cost multiplier. Those checks do not simulate an actual critical-hit reset.

| Explicit time | I crit chance / multiplier | II crit chance / multiplier |
| --- | --- | --- |
| 0s | 5% / 2x | 5% / 2x |
| 2s | 6% / 2x | 9% / 1.8x |
| 5s | 7.5% / 2x | 15% / 1.5x |
| 10s or 20s | 10% / 2x | 15% / 1.5x |

With Supercritical at five seconds: I is 6%/3x, II is 12%/2x. Never Crit
retains zero critical chance and unchanged damage. A support cannot restore
prohibited critical hits or guarantee a net gain from another support.

## Separate Poison Sources and Cost

Actual arrows and separately enabled on-hit Poison remain separate from
Poisonburst's no-hit burst and Gas's no-hit cloud. Gas's conditional Fire
explosion stays separate again. Native source-hit fields are not real
burst/cloud Hits or proof of live-game critical inheritance/reset events.
Poison damage is not itself a critical Hit.

| Native Poison/s | Baseline / zero | I at 2s | I capped | II at 2s | II capped |
| --- | ---: | ---: | ---: | ---: | ---: |
| Poisonburst burst source | 5.385766 | 5.528989 | 6.063468 | 5.670122 | 5.629365 |
| Gas cloud source | 4.003854 | 4.083415 | 4.389946 | 4.169695 | 4.167688 |

Tier II's capped estimate is slightly below its two-second estimate here;
do not presume longer buildup or the higher tier always wins. These are not
measured live DPS or route bonuses. PoB's sustained-application/critical-presence
assumptions are independently reconstructed, not adopted by the app.

Poison chance, magnitude, duration, one-stack cap, source roll, application
potential, deployment speed, radii and skill timers are unchanged. Poison III
on the actual arrows remains 60% chance with the Bleeding condition false.
The two tiers each raise fixture Mana from 38/62 to 45/74 at every sampled
time, including zero. With Poison III, costs are 54/89: multipliers combine
before native flooring. No extra contacts, clouds, Poison applications, stacks
or duration are credited.

Independent verification checks all 75 rows, four compatibility groups, ten
parsed controls, modifier/cap math, explicit/default time, critical-weighted
hits, once-only source-Poison arithmetic, no-crit controls and costs.
Ignored evidence: `var/poison-bow-inexorable-20261110/` (driver, JSON, verifier,
logs). The frozen runtime's known startup missing-node messages are unrelated
to these empty-tree fixtures; user builds and runtime sources stay untouched.

## App Behavior and Coverage

Four context-only pairs, replacing only their own tier. Manual weights,
suggestions, exclusions, scores, point budgets and shortest/manual routing stay
unchanged. Earlier selected-support warnings remain intact, including
Supercritical and Gas-only Overabundance/Nova II. Eligible selections survive
save/JSON round trips. No new uptime controls or automatic priority action.

93/567 raw support choices (16.4%), 92/450 positive-tier (20.4%), 57 families
and 576 pairs. Poisonburst offers 68 choices; Gas offers 70. Skills stay
103/399 (98/234 positive), preferences 184, wording 864/2182 and occurrences
3444/5451. Scoped counts, not overall completion; no baseline refresh.

## Validation

Independent verifier passed all native checks. Focused regressions passed
282 tests in eight files, including fourteen new pure tests and two UI cases.

`npm run validate:release` passed 3,363 tests in 157 files, typecheck,
production build, graph validation and unchanged coverage baseline in 92.357
seconds. The existing large-chunk advisory remains nonblocking (main 774.51 kB,
191.23 kB gzip); no unrelated performance refactor or data refresh.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke passed both 68/70-choice lists, tier replacement,
removal/restoration, buildup/reset/penalty/cost notes, unchanged manual weights
and all earlier selected-support warnings. No unexpected priority action or page
errors. Screenshot inspection confirmed readable notes and a rendered tree
without overlap. After reload the console had zero errors/warnings; the initial
launch's existing preview `/favicon.ico` 404 was inspected separately.

Browser evidence: `output/playwright/poison-bow-inexorable-20261110/`.
These are source/native/regression/browser checks, not in-game tests or user
visual acceptance. No commit, push or deployment.

## Next Proposed Batch

The proposed Pinpoint Critical review is now completed separately in
[the next checkpoint](build-focus-poison-bow-pinpoint.md). It keeps the
chance/extra-bonus trade-off and fixed buildup comparisons separate from
reset-cycle uptime and automatic route bonuses.

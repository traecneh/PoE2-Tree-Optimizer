# Poison Bow Ambush Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f, plus moving upstream generated data. Two context-only
pairs, not a general Hit-skill allowlist or Full DPS model.

## Enemy Full Life and Opening Hits

Ambush (`SupportAmbushPlayer`, family Ambush, catalog tier 1) gives 100% more
Critical Hit Chance only against enemies on Full Life. Chance is multiplicative
(5% -> 10% before caps), not +100 percentage points or guaranteed crits. There
is no added Mana multiplier. Player Full Life alone does not activate it.

Opening hits may qualify while the target is still at Full Life. Later hits
must satisfy that condition again; the bonus is not permanently earned by
starting combat against a full target. A damaging arrow does not guarantee a
later burst/cloud encounters the same state. Ongoing Poison is not a Hit and
does not make new critical-hit rolls for this bonus. This is not a claim that
an already-applied hit-based Poison loses its original source damage when
the target loses Life; no live source-snapshot timing was tested here.

Actual arrows and separately enabled on-hit Poison remain separate from
Poisonburst's no-hit burst, Gas's no-hit cloud and Gas's conditional Fire
explosion. Native source-hit fields are not real burst/cloud Hits or proof of
which opener state, critical roll or damage source carries into those effects.

Requires Attack OR Damage OR CrossbowAmmoSkill, with no excluded types. Both
real parents pass native compatibility; two groups reject missing requirements
and accept each synthetic fallback. These checks do not broaden the allowlist.

Sources:
- [Ambush generated data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L524)
- [Separate enemy Full Life configuration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua#L1670)
- [Native critical and ailment-source calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving references are not claimed byte-identical to the frozen runtime.

## Fixed-State Native Checks

73 MAIN calculations use an empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None and enemy
Bleeding/Poisoned false. No installed PoB, user builds or runtime source changed.
Enemy Full Life is explicitly false/true; player Full Life is independently
false except the five player-only negative controls. Inexorable time is explicit,
not its default ten-second snapshot. No enemy-health timeline is simulated.

Five components have baseline, Ambush inactive/active, parsed 100%-more-chance
control and player-only Full Life rows (25). Burst/cloud sources have Never
Crit and capped-chance baseline/off/on controls (12). Six link contexts each
have baseline/off/on for both parents (36): Supercritical, Pinpoint, both,
Inexorable I/II at five seconds, and Poison III on actual arrows.

All 21 inactive cases match their same-context baselines exactly, as do all
five player-only controls. The five parsed controls match active Ambush.
Never Crit remains zero and capped chance remains capped, with no damage
change in those four active controls.

| Context | Inactive crit chance / multiplier | Active crit chance / multiplier |
| --- | --- | --- |
| Baseline | 5% / 2x | 10% / 2x |
| Supercritical | 4% / 3x | 8% / 3x |
| Pinpoint | 8% / 1.7x | 16% / 1.7x |
| Supercritical + Pinpoint | 6.4% / 2.4x | 12.8% / 2.4x |
| Inexorable I, 5s | 7.5% / 2x | 15% / 2x |
| Inexorable II, 5s | 15% / 1.5x | 30% / 1.5x |

Critical-support factors combine multiplicatively, not by adding percentages.
Fixed Inexorable time is not a reset-cycle average or observed critical uptime.

## Continuing Poison Is Not a Full Life Timeline

PoB's enemy Full Life checkbox holds the condition fixed for the entire
calculation. It can change the critical-weighted source estimate used for
burst/cloud Poison. That is not proof that an enemy receiving hits and Poison
actually remains Full Life, or that opening arrow state is inherited by a
separate no-hit effect. Do not adopt the active result as sustained build DPS.

| Native source Poison/s | Enemy not Full Life | Fixed Full Life snapshot |
| --- | ---: | ---: |
| Poisonburst burst source | 5.385766 | 6.063468 |
| Gas cloud source | 4.003854 | 4.389946 |
| Poison III, actual Poisonburst arrow | 4.565772 | 4.862300 |
| Poison III, actual Gas arrow | 1.538314 | 1.638221 |

Independent arithmetic reconstructs rounded weapon-source ranges, capped
critical chance, increased/More combinations, critical-weighted hit values and
native source-Poison estimates. The latter assumes sustained applications and
critical presence from application potential; those assumptions are not live
Full Life uptime or an opening-hit simulation and are not route weights.

Poison chance, magnitude, duration, stack cap, application potential/source
roll, deployment speed, skill timers and radii remain unchanged. Poison III
on the actual arrows stays 60% chance with its Bleeding condition false.
Ambush changes no Mana costs: 38/62 ordinarily and 45/74 with Inexorable or
Poison III. No extra contacts, clouds, detonation, Poison applications, stacks
or duration are credited.

All 73 rows, two compatibility groups and five parsed modifier controls passed
independent verification. Evidence is ignored under
`var/poison-bow-ambush-20261110/` (driver, JSON, verifier and logs). Known frozen
runtime startup missing-node messages are unrelated to these empty-tree tests.

## App Behavior and Coverage

Two context-only pairs. Toggling Ambush preserves manual weights, suggestions,
exclusions, scope, scores, point budgets, shortest/manual routing and previous
support warnings. Eligible selections survive save/JSON round trips. No enemy
state controls, default Full Life assumption or automatic priority action.

95/567 raw support choices (16.8%), 94/450 positive-tier (20.9%), 59 families
and 580 pairs. Poisonburst offers 70 choices; Gas offers 72. Skills stay
103/399 (98/234 positive), preferences 184, wording 864/2182 and occurrences
3444/5451. Scoped coverage, not overall completion; no baseline refresh.

## Validation

Focused regressions passed 310 tests in ten files, including twelve new pure
tests and two UI cases.

`npm run validate:release` passed 3,391 tests in 159 files, typecheck,
production build, graph validation and unchanged coverage baseline in 123.503
seconds. The existing large-chunk advisory remains nonblocking (main 779.85 kB,
191.88 kB gzip); no unrelated performance refactor or data refresh.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke passed both 70/72-choice lists, selection/removal/
restoration, enemy-state/opening-hit/Poison/cost notes and unchanged manual
weights/earlier warnings. No unexpected priority action, enemy-state control
or page errors. Screenshot inspection confirmed readable notes and a rendered
tree without overlap. After reload the console had zero errors/warnings;
the initial existing preview `/favicon.ico` 404 was inspected separately.

Browser evidence: `output/playwright/poison-bow-ambush-20261110/`.
These are source/native/regression/browser checks, not in-game tests or user
visual acceptance. No commit, push or deployment.

## Next Proposed Batch

Review Life Leech I/II/III for both Poison bows: eligibility, Physical arrow-hit
recovery versus no-hit Poison, recovery amount/caps and Tier III's player Full
Life retention. Do not assume sustained hits, recovery or a damage bonus.
Proposal only in this batch; subsequently completed in
[the Life Leech checkpoint](build-focus-poison-bow-life-leech.md).

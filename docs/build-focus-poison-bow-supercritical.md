# Poison Bow Supercritical Review

Reviewed 2026-11-09/10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f, plus moving upstream generated support data. Only two
reviewed skill/support pairs, not a broad Hit-skill allowlist or Full DPS model.

## Modifier Semantics and Eligibility

Supercritical (`SupportIncreasedCriticalDamagePlayer`, family Supercritical,
catalog tier 3) grants 100% increased Critical Damage Bonus and 20% less
Critical Hit Chance. It has no added Mana multiplier. The generated stat
`base_critical_strike_multiplier_+` maps to CritMultiplier INC, not BASE: this
is not a flat +100 percentage points or 100% more total damage. It increases
the extra critical damage component, stacking with other increased bonuses.
The chance penalty is multiplicative: 5% becomes 4%, not -15%.

Requires Damage OR Attack OR CrossbowAmmoSkill, with no excluded types. Both
real parents pass native compatibility. Two compatibility groups reject missing
required types and accept each synthetic fallback. Controls do not authorize
unreviewed focuses or turn every component into a Hit.

Actual arrow hits and separately enabled on-hit Poison remain separate from
Poisonburst's no-hit burst and Gas's no-hit cloud. Gas's conditional Fire
explosion is separate again. Native source-hit fields are not real burst/cloud
Hits or proof of live-game critical inheritance, application frequency, cloud
occupancy or detonation. Supercritical does not grant Poison chance, magnitude,
stacks or duration, and cannot restore critical hits when prohibited.

Sources:
- [Supercritical generated data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8277)
- [Critical bonus stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua)
- [Native critical and ailment-source calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving links are not claimed byte-identical to the frozen runtime. No in-game
critical inheritance or uptime test was performed.

## Bounded Native and Independent Checks

44 MAIN calculations: empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None and enemy
Bleeding/Poisoned false. No installed PoB, user builds or runtime source changed.
Five components each have eight rows: baseline, Supercritical, parsed modifier
control, never-crit baseline/support, high-increased-bonus baseline/support and
its parsed control. Actual arrows also have Poison III baseline/support pairs.

Independent verification checks intended links, two compatibility groups,
raw modifier identities, CritMultiplier BASE/INC separation, multiplicative
chance, all five rounded weapon-source ranges, critical-weighted hit arithmetic,
costs, unchanged timing/area/stacks and ten parsed modifier controls.

### Critical-hit Trade-off

Normal fixture: 5% critical chance and 2x critical damage become 4% and 3x.
At +400% existing increased Critical Damage Bonus, 5%/6x becomes 4%/7x.
That existing increased bonus is not a flat +400 bonus. The support adds 100
increased, not another multiplier over all existing increased bonuses.

| Actual arrow average hit | Baseline | Supercritical | +400% increased bonus | +400% plus support |
| --- | ---: | ---: | ---: | ---: |
| Poisonburst | 5.381250 | 5.535000 | 6.406250 | 6.355000 |
| Gas | 1.837500 | 1.890000 | 2.187500 | 2.170000 |

With Never deal Critical Hits, baseline/support are identical across all five
components. Thus neither eligibility nor a larger critical bonus guarantees a
net gain. No current build's critical chance, enemy conditions or uptime is
silently supplied by the app.

### Native Poison-source Estimates

| Native Poison/s | Baseline | Supercritical | Never crit (both) | +400% increased bonus | +400% plus support |
| --- | ---: | ---: | ---: | ---: | ---: |
| Poisonburst burst source | 5.385766 | 5.868444 | 4.608696 | 8.494048 | 8.387940 |
| Gas cloud source | 4.003854 | 4.257990 | 3.588235 | 5.666330 | 5.597498 |
| Poison III, actual Poisonburst arrow | 4.565772 | 4.748958 | Not sampled | Not sampled | Not sampled |
| Poison III, actual Gas arrow | 1.538314 | 1.600033 | Not sampled | Not sampled | Not sampled |

Native PoB's one-stack calculation assumes sustained application. Its estimated
stack potential N is rate * Poison duration * application chance. For N > 1,
the source roll is N/(N+1) and critical-presence probability is
1-(1-criticalChance)^N. Independent arithmetic interpolates the non-critical
and critical Physical ranges, weights them by this probability and applies
the 20% Poison base coefficient once. The app does not adopt this assumed
presence or native DPS as route weights or verified live-game coverage.

Normal burst/cloud potential stays 3.6/2.4, stack cap one and Poison chance
100%; separate actual-arrow Poison III remains 60% chance and potential 1.44.
Enemy Bleeding is false, so Poison III's conditional bonus is not supplied.
Poison duration stays 3/2 seconds for burst/cloud, versus two seconds for the
separately enabled arrow Poison. Skill timers stay 3.003/4.026 seconds, radii
24/18 and rate 1.2/s. No new Poison applications or sustained stacks inferred.

Mana stays 38/62 across ordinary and critical controls. Poison III alone adds
its existing multiplier, giving 45/74; adding Supercritical changes neither.
These are isolated fixture costs, not universal build costs.

Ignored evidence: `var/poison-bow-supercritical-20261109/` contains the driver,
native JSON, independent verifier and logs. Startup's known missing-node
messages are from the frozen runtime; no user build or tree data was changed.

## App Behavior and Coverage

Two context-only pairs. Manual crit/Poison weights, suggestions, exclusions,
scope, route scores, point budget and shortest/manual routing stay unchanged.
Selection/removal and save/JSON round trips preserve state. Earlier support
warnings, delivery restrictions and Gas-only Overabundance behavior remain
intact; no new controls or automatic support-priority action.

91/567 raw support choices (16.0%), 90/450 positive-tier (20.0%), 56 unique
families, 572 reviewed pairs. Poisonburst has 66 choices; Gas has 68. Skills
stay 103/399 (98/234 positive), preferences 184, wording 864/2182 and occurrences
3444/5451. Scoped review counts, not overall completion. No baseline refresh.

## Validation

Independent verifier passed 44 rows, two compatibility groups and ten parsed
modifier controls. Focused regressions passed 266 tests in seven files,
including twelve new pure tests and two UI cases.

`npm run validate:release` passed 3,347 tests in 156 files, typecheck,
production build, graph validation and unchanged coverage baseline in
103.426 seconds. The existing large-chunk advisory remains nonblocking
(main 771.82 kB, 190.83 kB gzip); no unrelated performance refactor.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke passed the 66/68-choice lists, modifier/source/
cost notes, selection/removal/restoration and unchanged manual crit/Poison
weights and earlier warnings, including Gas's Overabundance/Nova II note.
No unexpected priority action or page errors. Screenshot inspection confirmed
readable notes and a rendered tree without overlap. After reload the console
had zero errors/warnings. Initial launch only had the existing preview
`/favicon.ico` 404, inspected separately.

Browser evidence: `output/playwright/poison-bow-supercritical-20261109/`.
These are source/native/regression/browser checks, not in-game tests or user
visual acceptance. No commit, push or deployment.

## Next Proposed Batch

The proposed Inexorable Critical I/II review is now completed separately in
[the next checkpoint](build-focus-poison-bow-inexorable.md). It keeps explicit
time snapshots and critical-hit resets separate from maximum uptime, without
automatic route bonuses.

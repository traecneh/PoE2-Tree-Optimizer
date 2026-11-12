# Poison Bow Multishot I/II Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB
0.23.1, tree 0.5.5f, with moving upstream generated support data checked.
Scope: Poisonburst Arrow and Gas Arrow, not every compatible skill or Full DPS.

## Source, Compatibility and Costs

| Choice | Effect | Catalog tier | Extra projectiles | Less Damage | Less Skill Speed |
| --- | --- | ---: | ---: | ---: | ---: |
| Multishot I | SupportMultishotPlayer | 1 | 2 | 35% | 20% |
| Multishot II | SupportMultishotPlayerTwo | 2 | 2 | 25% | 20% |

Family `AdditionalProjectiles`; requires Projectile OR ProjectileNumber and
excludes ProjectilesNumberModifiersNotApplied. Both real parents pass. A
synthetic ProjectileNumber fallback passes, missing both types and the excluded
type fail. These probes do not authorize other unreviewed skill focuses.

Neither tier adds a Mana multiplier. Native Mana stays 38 for Poisonburst,
62 for Gas; Efficiency II gives 23/38, Poison III gives 45/74. Other links and
actual use rate still matter for sustain. No new cost model is introduced.
The hidden terrain-attachment reduction stat is present but unmapped in this
runtime; it is not evidence of extra cloud placements or attachments.

Sources:
- [Multishot I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3135)
- [Multishot II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3179)
- [Native ailment calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L4990)

Moving source URLs are not claimed byte-identical to the frozen runtime.

## Three Separate Effects

1. Projectile count rises from one to three. This does not prove three contacts,
   Poison stacks, bursts, overlapping clouds or three times the DPS. A parsed
   projectile-only control leaves the native modeled Poison and hit values
   unchanged except for the count. Real coverage may differ; it is not modeled.
2. The generic less-Damage modifier reduces the eligible source once, including
   the source used by native burst/cloud Poison. It is not applied again as an
   additional Poison penalty. Poisonburst's actual arrow and separately enabled
   on-hit Poison stay separate from its no-hit burst; Gas arrow, no-hit cloud
   and conditional Fire explosion remain separate.
3. Less Skill Speed changes firing/deployment rate, not projectile travel speed,
   Poison tick rate, Poison duration, burst/cloud timers or global Movement
   Speed. It is not an automatic 20% less Poison DPS multiplier.

Slower application changes PoB's modeled strongest-source roll and chance of a
critical Poison being present. The native model assumes repeated application,
not measured contacts or guaranteed uptime. The independent verifier includes
both terms rather than attributing the change only to the range roll.

For these maximum-one-stack fixtures, `potential = rate * PoisonDuration`
(100% chance), source roll is `potential / (potential + 1)`, and critical
presence is `1 - (1 - critChance)^potential`. All tested source potentials
exceed one. The verifier weights stored noncritical and critical source ranges
by those probabilities. Damage reductions enter the stored range once, speed
enters the repeated-source estimate, and projectile count never multiplies it.
This is bounded native-model verification, not a universal in-game DPS formula.

## Native Results and Independent Checks

Empty level-90 Witch, level-20/quality-zero skills, normal Crude Bow (6-9
Physical), sufficient attributes, boss None, distance 20, Bleeding/Poisoned
false. No installed PoB, user builds or runtime source changed.

| Native source Poison/s | Baseline | Multishot I | Multishot II |
| --- | ---: | ---: | ---: |
| Poisonburst burst | 5.385766 | 3.346334 | 3.742641 |
| Gas cloud | 4.003854 | 2.544183 | 2.906782 |

Firing rate is 1.2 -> 0.96 for both tiers. Poisonburst duration stays 3 seconds,
Gas 2; maximum stacks stays one. Source-roll percentages change 78.260870 ->
74.226804 and 70.588235 -> 65.753425. Source-hit fields are not actual
burst/cloud hits. Burst/cloud timers and radii stay 3.003/24 and 4.026/18.

The 51 MAIN rows cover five components, both tiers, ten combined scalar
controls, separate damage/speed/projectile controls, Efficiency II, Poison III
and Rapid Attacks II. Four compatibility probes also pass. Independent checks
reconstruct rounded Physical and converted-Fire ranges, critical-weighted hit
sums, repeated-source Poison ratios and Mana costs. Full scalar controls
exactly match the actual gems. Rapid II's 25% increased Attack Speed gives
1.5 before Multishot and 1.2 after it; it does not remove Multishot's penalty.

Poison chance, duration, magnitude multiplier, maximum stacks, Accuracy,
crit chance/multiplier, areas, timers and projectile travel speed are unchanged
within each linked context. No guaranteed extra Poison applications or uptime.

Ignored evidence: `var/poison-bow-multishot-20261109/` contains driver, native
results, independent verifier and logs. The initial verifier omitted changing
critical-Poison presence; that was corrected and all 51 rows rerun successfully.
Source regression fixtures require neither PoB nor network access.

## App Behavior and Coverage

Two context-only support choices, four reviewed pairs. Tier switching replaces
only `AdditionalProjectiles`, retains other links and their warnings, and
persists through saved builds and JSON transfer. No automatic priority action,
new controls, schema, damage engine or contact model. Manual weights, scope,
suggestions, exclusions, route scores, budgets and shortest routing unchanged.

82/567 raw support choices (14.5%), 81/450 positive-tier (18.0%), 50 families,
556 pairs, 59 choices per Poison focus. Skills remain 103/399 (98/234 positive),
preferences 184, wording 864/2182 and occurrences 3444/5451. These are scoped
review/heuristic counts, not total completion. No catalog or baseline refresh.

## Validation

Native verifier passed all 51 rows, four compatibility probes and ten combined
scalar controls. Focused regressions passed 313 tests in five files, including
fourteen new pure tests and two UI cases. The initial UI fixture did not select
an outside-scope preference and incorrectly expected its caution; corrected
the fixture without changing production behavior.

`npm run validate:release` passed: 3,258 tests in 150 files, typecheck,
production build, graph validation and unchanged coverage baseline; 89.636
seconds. The existing large-chunk advisory is nonblocking (main 759.19 kB,
188.62 kB gzip). No unrelated performance refactor or data refresh.

The production asset served at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`
matches the built bytes. Edge smoke passed both 59-choice lists, tier
replacement/removal, separate projectile/damage/speed/cost notes, unchanged
manual weights, mixed-source caution and every previously selected support's
summary. Screenshot inspection confirms readable notes and a rendered tree
without overlap. After reload the console had zero errors/warnings and no
page errors. Initial launch only had the existing preview `/favicon.ico` 404,
inspected separately, not a failed app resource.

Browser evidence: `output/playwright/poison-bow-multishot-20261109/`. These
are source/native/regression/browser checks, not in-game tests or user visual
acceptance. Nothing committed, pushed or deployed.

## Next Proposed Batch

Review Nova Projectiles I/II for these focuses: circular delivery versus extra
contacts, Tier II's added cooldown and damage trade-off, and its shared
AdditionalProjectiles family with Multishot. Check actual compatibility and
family restrictions; do not assume overlaps, extra Poison stacks or cloud
coverage. Completed in the subsequent [Nova Projectiles review](build-focus-poison-bow-nova.md).

# Poison Bow Momentum Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f, plus moving upstream generated support data. Only
Poisonburst Arrow and Gas Arrow are added as reviewed pairs, not every legal
skill or Full DPS simulation.

## Condition and Eligibility

Momentum (`SupportMomentumPlayer`, family Momentum, catalog tier 2) grants
40% more Damage when two metres are travelled during the supported skill's
use. Teleportation does not count. This is not general Moving, moving recently,
projectile travel distance or a Movement Speed modifier. No carryover duration,
rotation, measured travel or uptime is inferred.

Generated data has a Moved2m condition; PoB exposes `momentumDamage` with the
label "Moved 2m during Skill use?" separately from `conditionMoving`. In the
native checks the former is explicitly false/true. General Moving alone and
100% increased Movement Speed do not enable it. A manually enabled condition
can exist with the general Moving checkbox off; that is a configuration
assumption, not evidence a stationary character travelled far enough.

Requires Damage OR Attack OR CrossbowAmmoSkill, excluding UsedByProxy,
Triggered and Persistent. Both real parents pass. Two compatibility groups
reject missing required types, accept each synthetic required-type fallback
and reject each prohibited type. These controls do not broaden the curated
skill allowlist. Both reviewed parents can be used while moving; Mobility and
Deliberation can change that movement but do not establish the distance travelled.

## Once-Only Poison Source and Always-Paid Mana

In reviewed native PoB the conditional generic Damage modifier changes the
eligible pre-mitigation source range used by Poison once. It does not also
supply another direct 40%-more Poison multiplier. Rounded ranges mean final
Poison/s is not always exactly 1.4 times the baseline. Poison magnitude,
application chance, duration, stack cap and source-selection roll stay unchanged.

The actual arrow and separately enabled on-hit Poison remain distinct from
Poisonburst's no-hit burst and Gas's no-hit cloud. Gas's conditional Fire
explosion stays separate. Native source-hit fields are not actual burst/cloud
hits or proof of live-game source timing/inheritance. No extra contacts,
clouds, overlap, ignition, detonation or sustained Poison applications assumed.

The 20% higher Mana multiplier applies with the condition false or true.
At the fixture levels, 38 -> 45 for Poisonburst and 62 -> 74 for Gas after
native flooring. Efficiency II gives 27/45. Poison III plus Momentum gives
54/89, not a claim that gem multipliers add. Other links and actual use rate
still matter for sustain; no automatic Mana or movement preference is added.

Sources:
- [Momentum generated data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3098)
- [Separate Momentum configuration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua#L483)
- [Native support Mana multipliers](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcActiveSkill.lua#L731)
- [Native Mana rounding](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L2060)

Moving source links are not claimed byte-identical to the frozen runtime.

## Bounded Native and Independent Checks

48 MAIN calculations: empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None, distance 20,
enemy Bleeding/Poisoned false. No installed PoB, user builds or runtime source
changed. Five components each have baseline, inactive, active and independent
parsed 40%-more-Damage controls. Additional rows cover general Moving and
global Movement Speed negative controls, Efficiency II, Poison III on actual
arrows, Mobility and Deliberation, with condition off/on in each context.

| Native source Poison/s | Baseline | Momentum inactive | Momentum active |
| --- | ---: | ---: | ---: |
| Poisonburst burst | 5.385766 | 5.385766 | 7.570558 |
| Gas cloud | 4.003854 | 4.003854 | 5.434740 |
| Poisonburst + Deliberation | 6.503567 | 6.503567 | 8.922081 |
| Gas + Deliberation | 4.830880 | 4.830880 | 6.642460 |

Both inactive movement controls match the inactive Momentum output. Mobility
does not activate the bonus. Deliberation's unconditional 20% more Damage is
kept separate; the active combined raw multiplier is 1.68, not an additive
60% or a second Poison multiplier. No assumed distance or uptime supplied.

Native speed remains 1.2/s. Poison duration stays 3/2 seconds, burst/cloud
timers 3.003/4.026 and radii 24/18. Same-context crit, Accuracy, projectiles,
Poison chance/magnitude/stacks and selection roll are unchanged. These are
bounded checks of PoB's assumptions, not measured in-game movement or DPS.

Independent verification reconstructs rounded Physical/converted-Fire ranges,
critical-weighted hit sums, source-roll/critical-presence Poison values and
support-cost multiplication/flooring plus Efficiency rounding. Five parsed
damage controls match the active component outputs except the gem's Mana cost.
Raw condition flags and all intended applied supports are checked explicitly.
Ignored evidence: `var/poison-bow-momentum-20261109/` (driver, native JSON,
verifier and logs). Source regression fixtures require no PoB or network.

## App Behavior and Coverage

One context-only choice, two reviewed pairs. Selection does not assume the
condition or change manual weights, suggestions, exclusions, scope, scores,
point budgets or shortest routing. Existing support choices, movement notes,
delivery family restrictions and earlier warnings remain intact. Save/JSON
state keeps the selected ID without a schema or UI-control change. No automatic
support-priority action or new damage engine.

88/567 raw choices (15.5%), 87/450 positive-tier (19.3%), 54 unique families,
568 pairs and 65 choices per Poison focus. Skills stay 103/399 (98/234 positive),
preferences 184, wording 864/2182 and occurrences 3444/5451. These are scoped
review/heuristic counts, not overall completion. No catalog/baseline refresh.

## Validation

Independent verifier passed all 48 rows, two compatibility groups and five
parsed damage controls. Focused regressions passed 319 tests in five files,
including twelve new pure tests and two UI cases.

`npm run validate:release` passed: 3,321 tests in 154 files, typecheck,
production build, graph validation and unchanged coverage baseline; 61.933
seconds. Existing large-chunk advisory remains nonblocking (main 767.96 kB,
190.13 kB gzip). No unrelated performance refactor or data refresh.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke passed both 65-choice lists, condition/source/cost
notes, selection/removal/restoration, unchanged manual weights, mixed-source
caution and all earlier selected support summaries. Movement and legal delivery
choices remain intact. Screenshot inspection confirms readable notes and a
rendered tree without overlap. After reload the console had zero errors/warnings
and no page errors. Initial launch only had the existing preview `/favicon.ico`
404, inspected separately.

Browser evidence: `output/playwright/poison-bow-momentum-20261109/`. These
are source/native/regression/browser checks, not in-game tests or user visual
acceptance. Nothing committed, pushed or deployed.

## Next Proposed Batch

The proposed Overabundance I/II review is now completed separately in
[the next checkpoint](build-focus-poison-bow-overabundance.md). It confirms
Gas-only eligibility and keeps cloud capacity separate from Poison stacks.

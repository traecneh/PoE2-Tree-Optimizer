# Poison Bow Stun Support Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f plus moving upstream data. Six context-only pairs, not a
Heavy Stun uptime model, Full DPS engine or global Hit-skill allowlist.

## Hit Buildup and Damage Trade-Off

| Support | Effect ID | Catalog tier | More Stun Buildup | Less Damage | Mana multiplier |
| --- | --- | ---: | ---: | ---: | ---: |
| Stun I | SupportStunPlayer | 2 | 50% | None | 1.2x |
| Stun II | SupportStunPlayerTwo | 4 | 70% | None | 1.2x |
| Stun III | SupportStunPlayerThree | 5 | 300% | 50% | 1.2x |

All share family Stun; one tier is retained. Attack OR Damage OR
CrossbowAmmoSkill is required, with no excluded types. Six native compatibility
groups accept both real parents and each synthetic fallback while rejecting
missing requirements. The app allowlist remains scoped to these two focuses.

Actual arrow hits can supply buildup. Gas's conditional Fire explosion is a
separate hit; detonation is not inferred. Poison is damage over time, not a
hit, and supplies no Stun Buildup. Poisonburst's no-hit burst and Gas's no-hit
cloud remain separate. PoB emits positive synthetic source-hit buildup fields
for them; those are not real Poison stuns or valid proof of live-game contacts.

I/II have no damage penalty or Poison damage bonus. III's 50% less Damage is
broad, not Hits-only: it reduces the supported skill's weapon-derived Poison
source as well as hit damage. It is applied once, not again to an already
scaled Poison source. A 4x buildup modifier alongside reduced hit damage is
not 4x the original total buildup. Native source/conversion rounding means
final tiny-weapon values need not be exactly halved.

All tiers raise Mana cost 20% before rounding. Other support multipliers
combine before rounding, not by summing percentages or rounding each link
separately. The cost remains when Heavy Stun is prohibited. Buildup, Stun
duration, threshold crossing, occurrence frequency and uptime are separate.
No guaranteed contacts, stun lock or Heavy-Stunned-enemy benefits are assumed.

Sources:
- [Stun I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7155),
  [II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7190),
  [III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7225)
- [Native hit, Poison and buildup calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving references are not claimed byte-identical to the frozen runtime.

## Native Checks and Independent Arithmetic

55 MAIN calculations use an empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None and enemy
Bleeding/Poisoned/Heavy-Stunned/Dazed false. No installed PoB, user builds or
native runtime source changed.

Five components each have baseline, I/II/III and corresponding parsed scalar
controls for buildup, damage and cost (35). Per parent: increased-buildup
baseline plus I/II/III (8 total), Cannot Immobilise Enemies with III (2),
20% Poison magnitude with III (2), and Poison III baseline plus I/II/III (8).
All 55 rows, six compatibility groups and fifteen scalar controls passed
independent verification.

| Native component | Baseline average hit | III average hit | Baseline source Poison/s | III source Poison/s |
| --- | ---: | ---: | ---: | ---: |
| Poisonburst arrow | 5.38125 | 2.625 | No inherent on-hit Poison | No inherent on-hit Poison |
| Poisonburst no-hit source | 5.38125 | 2.625 | 5.385766 | 2.601427 |
| Gas arrow | 1.8375 | 0.91875 | No inherent on-hit Poison | No inherent on-hit Poison |
| Gas no-hit cloud source | 4.33125 | 2.23125 | 4.003854 | 2.034746 |
| Gas conditional Fire explosion | 22.05 | 11.55 | Not credited | Not credited |

Source-hit averages for no-hit components are calculation artifacts, not hits.
I/II leave hit and Poison values unchanged. With separately linked Poison III,
the actual-arrow Poison estimates fall from 4.565772 to 2.219668 (Poisonburst)
and 1.538314 to 0.769157 (Gas) under Stun III. Those are native source estimates,
not measured sustained damage or proof of source inheritance.

Independent arithmetic reconstructs rounded weapon/source ranges, crit-weighted
average hits, Poison application-potential/source-roll estimates and buildup.
The frozen buildup model uses enemy level 85, poise 271810, scale 0.58 and a
separate 1.5x Physical-hit buildup factor; Fire does not get that factor. These
are reviewed PoB model values, not universal/live enemy thresholds or uptime.
The converted Fire control requires source rounding before its damage penalty;
the verifier accounts for this rather than assuming every output is half.

100% increased buildup doubles the same-tier estimate and combines
multiplicatively with each More modifier. Cannot Immobilise Enemies makes
Heavy Stun buildup zero despite Stun III's multiplier and cost remaining.
20% Poison magnitude raises native Poison 20% without changing buildup.
Heavy-Stunned/Dazed flags remain false in every row; no stun timeline is run.

Mana cost is 38 -> 45 for Poisonburst and 62 -> 74 for Gas with any tier.
With Poison III and Stun together, costs are floor(38 x 1.2 x 1.2) = 54
and floor(62 x 1.2 x 1.2) = 89. Speeds, skill timers/radii, Poison chance,
duration, magnitude, stack cap and delivery remain unchanged by the Stun tiers.

Ignored evidence: `var/poison-bow-stun-20261110/` (driver, native JSON,
independent verifier and logs). Known frozen-runtime startup missing-node
messages are unrelated to these empty-tree component checks.

## App Behavior and Coverage

Tier replacement/removal, duplication normalization, save/JSON round trips
and unsupported-focus rejection are covered. Existing Life/Mana Leech families,
warnings, manual weights, suggestions, scores, goals, point budgets and shortest/
manual routing remain unchanged. No new enemy-state controls, automatic priority
action, buildup/DPS multiplier or runtime patch.

102/567 raw support choices (18.0%), 101/450 positive-tier (22.4%), 62 families
and 594 pairs. Poisonburst offers 77 choices; Gas offers 79. Skills remain
103/399 (98/234 positive), preferences 184, wording 864/2182 and occurrences
3444/5451. Scoped heuristic/catalog coverage, not overall completion; no
coverage-baseline refresh.

## Validation

Focused regressions passed 367 tests in seven files, including sixteen new
pure tests and two UI cases.

`npm run validate:release` passed 3,441 tests in 162 files, typecheck,
production build, graph validation and unchanged coverage baseline in 87.818
seconds. The existing large-chunk advisory remains nonblocking (main 786.10 kB,
193.11 kB gzip); no unrelated performance refactor or data refresh.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built JavaScript bytes. Edge smoke passed both 77/79-choice lists, tier
replacement, selection/removal/restoration, hit/Poison/damage/cost/uptime notes
and unchanged manual weights/earlier warnings. No unexpected automatic priority
action, enemy-state control or page errors. Screenshot inspection confirmed
readable notes and a rendered tree without overlap. The final console had zero
errors/warnings after reload; the initial existing preview `/favicon.ico` 404
was inspected separately.

Browser evidence: `output/playwright/poison-bow-stun-20261110/`.
These are source/native/regression/browser checks, not live-game tests or user
visual acceptance. The local preview remains available. No commit, push or
deployment.

## Next Proposed Batch

Review [Pin I/II/III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3747)
for both Poison bows: Physical hit eligibility versus Poison, Stun prohibition
and buildup conversion, Tier II's conditional critical chance and Tier III's
buildup/duration trade-off, without assuming immobilisation uptime. Proposal
only in this batch; subsequently completed in
[the Pin checkpoint](build-focus-poison-bow-pin.md).

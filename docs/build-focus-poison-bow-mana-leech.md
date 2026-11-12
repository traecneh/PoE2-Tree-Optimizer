# Poison Bow Mana Leech Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f plus moving upstream data. Two context-only pairs, not a
sustain simulator, Full DPS engine or global Attack allowlist.

## Physical Recovery, Not Poison or a Refund

Mana Leech (`SupportManaLeechPlayer`, family ManaLeech, catalog tier 2) grants
8% of Physical Attack damage leeched as Mana. The raw value 800 is divided by
100 in the stat mapping, not interpreted as 0.8% or 800%. There is one reviewed
choice, not invented I/II/III tiers. It is separate from the LifeLeech family.

Attack OR CrossbowAmmoSkill is required, with no excluded types. Two native
compatibility groups accept both real parents and each synthetic fallback,
reject missing requirements and reject Damage-only. The app allowlist remains
limited to these two reviewed focuses.

Actual Physical arrow hits can generate recovery. Poison is Chaos damage over
time, not a Physical Attack Hit; Poisonburst's no-hit burst and Gas's no-hit
cloud do not generate this recovery. PoB emits synthetic source-hit leech
fields for them, which are not real Mana recovery and are not scored.
The reviewed conditional Gas Fire explosion converts all Physical damage to
Fire and produces zero Physical-hit leech in this isolated setup; arbitrary
gear/conversion changes are not modeled by this finding.

No added Mana multiplier is not a refund. Upfront Mana costs remain payable
separately from later qualifying-hit recovery. Linked support costs still
apply. Amount, delivery speed, duration and recovery caps are not interchangeable.
Cannot Leech Mana or Cannot Gain Mana prevents recovery despite the 8% modifier.
No hit contacts, continuous firing, recovery uptime, full-cap recovery,
self-funding skill, damage/Poison bonus or live resource timeline is assumed.

Sources:
- [Mana Leech generated data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6833)
- [Physical Attack Mana-leech mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L486)
- [Native leech and Mana expenditure calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving references are not claimed byte-identical to the frozen runtime.

## Native Checks and Independent Arithmetic

27 MAIN calculations use an empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None and enemy
Bleeding/Poisoned false. No installed PoB, user builds or runtime source changed.

Five components each have baseline, Mana Leech and a parsed 8% control (15).
Per parent: Cannot Leech Mana, Cannot Gain Mana, 20% Poison magnitude,
high-Physical/high-speed cap stress, and Poison III baseline/with Mana Leech
cost controls (12). All 27 rows passed independent verification, as did both
compatibility groups and all five parsed scalar comparisons.

| Actual-arrow native estimate | Amount/hit | Recovery/s | Mana/use | Expenditure/s | With Poison III: Mana/use / expenditure/s |
| --- | ---: | ---: | ---: | ---: | ---: |
| Poisonburst Arrow | 0.4305 | 0.5166 | 38 | 45.6 | 45 / 54 |
| Gas Arrow | 0.147 | 0.1764 | 62 | 74.4 | 74 / 88.8 |

These tiny empty-build estimates are not sustain recommendations. Poison III
raises cost by 20% before native rounding. Mana Leech changes neither its cost
nor its on-hit Poison estimate. The per-second fields assume repeated uses
in PoB; actual resource availability and real hit cadence are not simulated.

Independent arithmetic reconstructs crit-weighted Physical-hit packets, capping
noncritical and critical branches before weighting. The frozen model has
Mana 2541, instance rate 50.82/s, instance amount cap 254.1 and total rate cap
508.2/s. Duration is packet/instance-rate; instance count uses native hit rate;
the total recovery rate is separately capped. These are reviewed PoB model
fields, not universal/live PoE2 leech timing or cap claims.

Both stress controls bind both caps: amount 254.1, duration 5s, rate 508.2/s.
Even those native recovery rates are below the corresponding modeled Mana
expenditure (1151.5152/s and 1878.7879/s). Reaching a recovery cap is not proof
of sustain. Both recovery restrictions yield zero, as does the fully converted
Fire component. A 20% Poison-magnitude increase raises source Poison 20% with
no leech change. Ordinary damage, Life leech, skill timers, delivery, Poison
chance/magnitude/duration/stacks and Mana costs remain unchanged.

Ignored evidence: `var/poison-bow-mana-leech-20261110/` (driver, native JSON,
independent verifier and logs). Known frozen-runtime startup missing-node
messages are unrelated to these empty-tree component checks.

## App Behavior and Coverage

Manual weights, suggestions, scores, goals, budgets, earlier support notes and
shortest/manual routing stay unchanged. Mana Leech does not replace any Life
Leech tier. Selection/removal, duplication normalization, save/JSON round trips
and unsupported-focus rejection are tested. No new state controls, automatic
priority action, recovery multiplier or native-runtime patch.

99/567 raw support choices (17.5%), 98/450 positive-tier (21.8%), 61 families
and 588 pairs. Poisonburst offers 74 choices; Gas offers 76. Skills remain
103/399 (98/234 positive), preferences 184, wording 864/2182 and occurrences
3444/5451. Scoped heuristic/catalog coverage, not overall completion; no
coverage-baseline refresh.

## Validation

Focused regressions passed 349 tests in six files, including twelve new pure
tests and two UI cases.

`npm run validate:release` passed 3,423 tests in 161 files, typecheck,
production build, graph validation and unchanged coverage baseline in 74.627
seconds. The existing large-chunk advisory remains nonblocking (main 784.01 kB,
192.62 kB gzip); no unrelated performance refactor or data refresh.

The local production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`
matches the built JavaScript bytes. Edge smoke passed both 74/76-choice lists,
selection/removal/restoration, Physical-hit/Poison/converted-Fire/cost/sustain
notes, separate retained Life Leech III and unchanged weights/earlier notes.
No unexpected automatic priority action or page errors. Screenshot inspection
confirmed readable notes and a rendered tree without overlap. The final console
had zero errors/warnings after reload; the initial existing preview
`/favicon.ico` 404 was inspected separately.

Browser evidence: `output/playwright/poison-bow-mana-leech-20261110/`.
These are source/native/regression/browser checks, not live-game tests or user
visual acceptance. The preview remains available. No commit, push or deployment.

## Next Proposed Batch

Review [Stun I/II/III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L7155)
for both Poison bows, separating hit-based Stun Buildup
from Poison and checking Tier III's damage trade-off and Mana costs without
assuming Heavy Stun uptime. Proposal only in this batch; subsequently completed
in [the Stun checkpoint](build-focus-poison-bow-stun.md).

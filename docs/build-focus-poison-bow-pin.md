# Poison Bow Pin Support Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f plus moving upstream data. Six context-only pairs, not a
Pin-duration/immobilisation-uptime simulation, Full DPS model or global allowlist.

## Physical Hits, Not Poison

| Support | Effect ID | Catalog tier | Additional effect |
| --- | --- | ---: | --- |
| Pin I | SupportPinPlayer | 1 | Physical Hits can Pin; supported skill cannot Stun |
| Pin II | SupportPinPlayerTwo | 2 | Same; 50% increased critical chance against Immobilised enemies |
| Pin III | SupportPinPlayerThree | 5 | Same prohibition; 60% less Pin buildup, 30% more Pin duration |

All share family Pin, distinct from PinpointCritical. One Pin tier is retained.
Attack OR Damage OR CrossbowAmmoSkill is required, with no excluded types.
Six native groups accept both real parents and each synthetic fallback while
rejecting missing requirements. Eligibility is not a global approval or proof
that every component inflicts Pin.

Actual Physical arrow-hit damage can build Pin. Poison is Chaos damage over
time, not a Physical Hit, and supplies no Pin buildup. Poisonburst's no-hit
burst and Gas's no-hit cloud stay separate; native source-hit fields for them
are not real Pin applications. The reviewed fully Physical-to-Fire converted
Gas explosion supplies zero Physical Pin buildup, even in the configured
immobilised snapshot. Arbitrary gear/conversions and detonation are not inferred.

Pin itself adds no Mana multiplier. Other support costs remain, and its Stun
prohibition does not remove Stun III's damage penalty or Stun-family costs.

Sources:
- [Pin I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3747),
  [II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3779),
  [III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3812)
- [Physical eligibility, Stun prohibition and buildup mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L1644)
- [Conditional critical-chance mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L739)
- [Native modifier redirection and buildup calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving references are not claimed byte-identical to the frozen runtime.

## Stun Redirection Without Duplicate Benefits

Pin sets PhysicalCanPin, PinBuildupInsteadOfHeavyStunBuildup, CannotStun and
CannotHeavyStun. Generic increased/More Stun Buildup modifiers redirect to Pin;
they are not added as a second Heavy Stun benefit or copied twice. Type-specific
Physical-Stun modifiers are not assumed to become generic Pin bonuses.

With Pin I, Stun I/II give 1.5x/1.7x Pin buildup in the reviewed setup. Stun
III's 4x modifier still accompanies its broad 50%-less-damage penalty, so the
final buildup is not 4x the original. Pin III's 0.4x factor multiplies that
redirected modifier (0.4 x 4 = 1.6 before the damage penalty), not an additive
240%-more bonus. Pin I plus Stun III matches the reversed link order.

100% increased Stun Buildup doubles Pin buildup, as does 100% increased Pin
Buildup. Combining both gives 200% increased, or 3x, not 4x. Cannot Immobilise
Enemies makes Pin buildup zero. Every Pin-linked row has zero direct Heavy
Stun buildup. Pin's separate status effects and externally supplied conditions
are not a simulated sequence of supported-hit Stuns.

## Conditional Critical Chance and Duration Coverage

Pin II's 50% increased chance is not +50 percentage points or 50% More.
5% becomes 7.5% only with the configured immobilised condition true. With
100% existing increased chance, 10% becomes 12.5%, not 15%. Never Crit remains
zero. An external immobilisation can qualify, but no opening-hit activation,
self-Pin, critical-state inheritance, enemy state or uptime is assumed.

The native condition is held fixed, not earned by crossing a Pin threshold.
Pinned and Heavy-Stunned checkboxes are explicitly false in all rows. Native
burst/cloud Poison estimates can change under the fixed crit condition; those
source-hit fields do not prove real no-hit crit rolls or live inheritance.

Pin III declares `support_pin_pin_duration_+%_final = 30`, but the reviewed
runtime has no mapping for that stat and exposes no PinDuration/EnemyPinDuration
result. The probed EnemyPinDuration multiplier remains 1. Its 60%-less-buildup
stat is mapped correctly. The duration perk is not absent in game simply
because PoB does not model it. No live seconds, generic skill/Poison-duration
benefit, longer immobilisation uptime or damage benefit is invented.

## Native Checks and Independent Arithmetic

66 MAIN calculations use an empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None and enemy
Bleeding/Poisoned/Heavy-Stunned/Pinned/Dazed false. Immobilised is explicitly
false/true per row. No installed PoB, user builds or native runtime source changed.

Five components have baseline, I/II/III, II with immobilisation and Pin I plus a
parsed 50%-increased-crit scalar control (30). Eighteen further rows per parent
check an immobilised Pin I negative control, additive/never-crit cases, Stun
I/II/III pairings, Pin III + Stun III, reversed links, increased Stun/Pin/both,
two prohibition controls, Poison magnitude and Poison III off/on-target states.

All 66 rows, six compatibility groups and five parsed scalar comparisons passed
independent verification. Arithmetic reconstructs rounded source ranges,
crit-weighted Physical-hit Pin buildup, redirect composition, costs and native
Poison source estimates. The frozen model uses poise 271810 and Pin scale 4.2;
these are PoB model values, not universal/live enemy thresholds or uptime.

| Native actual-arrow snapshot | Pin I/II, target not immobilised | Pin III | Pin II, fixed immobilised target |
| --- | ---: | ---: | ---: |
| Poisonburst Pin buildup | 0.00831509 | 0.00332604 | 0.00851307 |
| Gas Pin buildup | 0.00283930 | 0.00113572 | 0.00290690 |
| Critical chance | 5% | 5% | 7.5% |

Buildup fields are native average-hit percentages, not occurrence chance or
measured application frequency. With immobilisation off, I/II/III leave damage
and Poison unchanged; III multiplies only buildup by 0.4. A 20% Poison-magnitude
control raises Poison 20% without changing Pin. Base Mana costs remain 38/62;
Stun or Poison III links cost 45/74. No extra contacts, threshold crossings,
guaranteed Pin, stun lock or self-sustained immobilisation is credited.

Ignored evidence: `var/poison-bow-pin-20261110/` (driver, native JSON,
independent verifier and logs). Known frozen-runtime startup missing-node
messages are unrelated to these empty-tree component checks.

## App Behavior and Coverage

Pin selections update Stun notes with a reversible conversion/prohibition
warning. Other support notes, manual weights, suggestions, scores, goals, point
budgets and shortest/manual routing stay unchanged. Tier replacement/removal,
normalization, distinct Pinpoint Critical family, save/JSON round trips and
unsupported-focus rejection are covered. No enemy-state controls, automatic
priority action, native-runtime patch or duration/DPS multiplier.

105/567 raw choices (18.5%), 104/450 positive-tier (23.1%), 63 families and
600 pairs. Poisonburst offers 80 choices; Gas offers 82. Skills remain
103/399 (98/234 positive), preferences 184, wording 864/2182 and occurrences
3444/5451. Scoped heuristic/catalog coverage, not overall completion; no
coverage-baseline refresh.

## Validation

Focused regressions passed 371 tests in seven files, including eighteen new
pure tests and two UI cases.

`npm run validate:release` passed 3,461 tests in 163 files, typecheck,
production build, graph validation and unchanged coverage baseline in 74.510
seconds. The existing large-chunk advisory remains nonblocking (main 788.97 kB,
193.71 kB gzip); no unrelated performance refactor or data refresh.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built JavaScript bytes. Edge smoke passed both 80/82-choice lists, tier
replacement, removal/restoration, Physical eligibility, conditional-crit and
unmodeled-duration notes, reversible Stun conversion warnings, preserved
Pinpoint Critical/recovery families and unchanged weights. No unexpected
automatic priority action, enemy-state control or page errors. Screenshot
inspection confirmed readable notes and a rendered tree without overlap. The
final console had zero errors/warnings after reload; the initial existing
preview `/favicon.ico` 404 was inspected separately.

Browser evidence: `output/playwright/poison-bow-pin-20261110/`.
These are source/native/regression/browser checks, not live-game tests or user
visual acceptance. The local preview remains available. No commit, push or
deployment.

## Next Proposed Batch

Review [Life Drain](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2747)
and [Soul Drain](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5260)
for both Poison bows, separating supported-hit Cull recovery from Poison kills,
leech and assumed sustain, including Culling Strike I/II links. Proposal only;
not implemented in this batch.

Completed in the subsequent [Drain checkpoint](build-focus-poison-bow-drain.md).

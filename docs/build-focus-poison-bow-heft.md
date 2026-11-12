# Heft for Poison Bow Focuses

One optional choice, one family and two reviewed pairs: Poisonburst Arrow and
Gas Arrow. Maximum-only Physical damage context, not a Full DPS calculation.
Heft is tier 5 in the frozen PoB 0.23.1 catalog, unlike tier-zero Malady.

## Modifier and Component Boundaries

- Heft grants 30% more maximum Physical damage of hits and adds a 20% Mana cost
  multiplier. It does not increase the minimum, all Physical damage by 30%,
  average damage by a fixed 30%, or Poison magnitude. Native compatibility
  accepts both parents and rejects controls with their qualifying types removed.
- The reviewed Physical Bow fixture raises the Physical source ceiling for
  native Poison calculations, including the no-hit burst/cloud's synthetic
  attack source. This does not turn those components into real hits or crits,
  nor supply initial-arrow contact or extra chances to Poison.
- PoB weights the damage range toward stronger rolls under constant application
  assumptions. Consequently the native Poison estimate changes by a different
  ratio than the averaged hit. Neither is a universal build multiplier or
  measured game DPS. No stack/contact/critical/uptime assumption is added to
  routing. The app does not multiply both a hit gain and a separate Poison gain.
- Added fixed Chaos source damage is unchanged by Heft in the separate mixed
  damage control. It is not raised by 30%. Poison chance, magnitude, durations,
  stack capacity, coverage and firing speed are distinct from source damage.
- Gas's reviewed fully converted Fire explosion remains unchanged. Physical
  source modifiers are not automatically credited to its Fire damage. Ignition,
  detonation, overlap and contacts remain separate and unmodeled. Poisonburst's
  linked Poison duration and Gas's cloud/outgoing-Poison timers remain distinct.
- Other support cost multipliers still apply. Efficiency II reduces cost
  separately; lower cost does not establish Mana sustain, usable firing rate or
  real sustained Poison application. No automatic priorities, passive scopes,
  parser/solver changes, point-count changes or save schema. Manual values,
  goals, class starts, budgets, other links and Shortest mode stay unchanged.
- Existing Malady chance-direction notes and Blindside's prohibition remain
  intact. No unreviewed skill pairs or fictional Heft tiers are admitted.

## Native and Independent Evidence

36 isolated MAIN calculations in the unmodified frozen PoB 0.23.1 runtime:
empty-tree Witch, level-20 parents, normal Crude Bow, sufficient attributes,
boss mode None and enemy Bleeding/Poisoned false. Actual active/stat set, Bow,
effective mode, applied links and enemy flags are asserted. Installed PoB and
user builds are untouched.

- 20 rows: five components with baseline, Heft, independent maximum-only
  Physical attack damage and whole-Physical-damage controls.
- Four mixed Physical/added-Chaos source rows, baseline/Heft for both focuses.
- Four actual-arrow Poison III rows, baseline/Heft for both focuses.
- Four Efficiency II and four Deadly Poison II rows, baseline/Heft for both.
- Two compatible links and two missing-type rejection controls.

Heft matches every maximum-only control's hit/source/Poison output exactly,
except for its added Mana cost. Whole-Physical controls also increase the minimum
and produce different results. Native ranges have already undergone internal
rounding; multiplying a displayed rounded maximum need not reproduce a new one.

| Native component | Stored Physical source, base -> Heft | Average hit, base -> Heft |
| --- | --- | --- |
| Poisonburst arrow / synthetic burst source | 16-25 -> 16-32 | 5.38125 -> 6.3 |
| Gas arrow | 6-8 -> 6-11 | 1.8375 -> 2.23125 |
| Gas synthetic cloud source | 13-20 -> 13-26 | 4.33125 -> 5.11875 |
| Gas conditional Fire explosion | No remaining Physical source | 22.05 -> 22.05 |

| Native Poison estimate or cost | Poisonburst base -> Heft | Gas base -> Heft |
| --- | ---: | ---: |
| Inherent source Poison/s estimate | 5.385766215481 -> 6.6661559195387 | 4.0038541776187 -> 4.9490263113517 |
| Same estimate with whole-Physical +30% control | 6.9202014957406 | 5.2115741262775 |
| Fixed added-Chaos source Poison/s estimate | 31.095178527116 -> 32.375568231174 | 23.419265091383 -> 24.364437225116 |
| Actual-arrow Poison III estimate | 4.5657724526838 -> 5.4508298819733 | 1.5383141032889 -> 1.9176244301272 |
| With Deadly Poison II | 7.4384544711926 -> 9.2675826198465 | 5.5922684579199 -> 6.8524979695639 |
| Base Mana cost | 38 -> 45 | 62 -> 74 |
| With Poison III, Mana | 45 -> 54 | 74 -> 89 |
| With Efficiency II, Mana | 23 -> 27 | 38 -> 45 |

Poison magnitude stays one with Heft alone, two with Deadly Poison II. The latter's
hit penalty still applies; Heft does not erase it. Poison III supplies its own
60% arrow chance and separate two-second Poison; no Bleeding bonus is enabled.
Inherent duration stays 3/2 seconds, displayed skill timers 3.003/4.026 seconds,
radii 24/18, stack cap one, chance 100% and firing speed 1.2. Native source
roll averages stay 78.260869565217%/70.588235294118%, with potentials 3.6/2.4.

The all-row verifier independently checks native source-range ratios using
`min + (max - min) * roll`, including fixed Chaos and Deadly Poison controls.
It reproduces the Poison-estimate ratios without a second damage multiplier.
For unchanged fixture mitigation/critical context, averaged-hit ratios match
the ratios of range midpoints instead. Independent fixtures also check source
identity, cost combinations/rounding, persistence, no automatic weights and
manual passive/ownership/route-score invariance. Ordinary tests need neither
native PoB nor network. These checks do not validate complete game performance.

Evidence: `var/poison-bow-heft-20261109/` (driver, native JSON, verifier/logs).
Frozen facts: `src/tree/poisonBowHeftSupport.fixtures.ts`. Startup missing-node
notices are retained and do not affect the empty-tree fixture.

- [Generated support and maximum-only mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4227)
- [Native min/max damage calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L139)
- [Native stronger-ailment-roll model](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L5134)

Moving upstream references are not claimed byte-identical to the frozen runtime.

## Coverage and Next Batch

Pairs 514 -> 516, choices 62 -> 63, families 39 -> 40. Each Poison focus has
39 choices including Malady's catalog-only review. Supports are 63/567 (11.1%);
positive-tier coverage is 62/450 (13.8%). Skills remain 103/399 (98/234
positive-tier), preferences 184, main-tree wording 864/2182 and occurrences
3444/5451. No catalog refresh or baseline reset.

The proposed successor is now covered in the [Longshot checkpoint](build-focus-poison-bow-longshot.md).
Counts and verification remain the historical Heft checkpoint.

## Verification

Native 36-row verification and focused regressions (198 tests across four files)
passed. One `npm run validate:release` passed 3046 tests across 138 files,
typecheck, production build, graph validation and the unchanged coverage baseline
in 72606 ms. The existing main-chunk advisory remains non-blocking (730.14 kB).
No catalog refresh, baseline reset or further route audits.

An isolated Edge production-preview smoke passed both focuses: 39 choices each,
Heft selection/removal, maximum-only/Poison-source/Chaos/Fire/Mana notes, other
links, preserved Malady chance-direction warnings and unchanged manual Physical
Damage/Poison Magnitude/Skill Effect Duration weights on selection and Add
suggestions. No automatic support-priority action appeared. Final console: zero
errors/warnings and no page errors; an initial unrelated favicon 404 was absent
after reload. Inspected screenshot: nonblank tree, readable controls/notes and
no overlapping text. User saves were isolated and the browser session closed.
DOM/JSON tests cover disabled controls, class, goals, budget, saved settings and
independent Blindside notes. Repeated browser persistence/Firefox matrices were
not needed because those implementations and layout did not change.

Logs: `var/poison-bow-heft-20261109/`. Repeatable smoke and inspected screenshot:
`output/playwright/poison-bow-heft-20261109/`. Existing preview reused; served
HTML and actual entry JavaScript matched final dist. Entry returned HTTP 200 as
JavaScript (730141 bytes), not HTML fallback. Scoped `git diff --check` passed
with only the existing README line-ending advisory. Local preview:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. No commit, push or live deployment.

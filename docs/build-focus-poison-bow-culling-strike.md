# Culling Strike I/II for Poison Bow Focuses

Two optional support choices, one family and four reviewed pairs for
Poisonburst Arrow and Gas Arrow. Hit-based finishing utility, not Poison
magnitude, Full DPS scoring or automatic priority changes.

## Effects and Boundaries

- Both parents satisfy the native Attack eligibility. Both tiers only grant
  culling against Rare/Unique enemies, with base Life thresholds 10%/5%.
  Generic Normal/Magic constants 35%/20% do not extend this support's rarity
  eligibility. Native calculations assert the actual enemy flags, not just
  requested XML settings; the default Pinnacle configuration is overridden.
- A qualifying supported hit is required. Poison damage over time cannot
  trigger culling. Poisonburst's burst and Gas's cloud remain no-hit. Their
  initial arrows can hit; Gas's separately triggered Fire explosion can hit
  but this support does not supply ignition/detonation or contacts. No target
  remaining-Life timeline, immunity, contact frequency or boss uptime is modeled.
- Tier II grants 20% increased Culling Strike Threshold for 20 seconds on
  Culling with supported skills. This is conditional, not a pre-first-cull
  bonus, +20 percentage points, permanent uptime or a presumed stack count.
  Without other threshold modifiers, 10 * 1.2 = 12% for Rare and 5 * 1.2 = 6%
  for Unique, not 30%/25%. Extra kills/refreshes are not simulated.
- The reviewed PoB 0.23.1 runtime maps rarity-gated CanCull for both tiers but
  does not calculate Tier II's on-cull threshold stat. Both tiers output
  10%/5% and zero threshold increase. A separate explicit +20% threshold
  custom modifier produces 12%/6%; that checks arithmetic, not native coverage
  of the actual conditional buff. This missing calculation is not zero effect
  in game. No runtime patch or invented condition input hides the gap.
- Neither tier adds a Mana multiplier, Poison chance/magnitude/duration,
  stack capacity, damage, area, rate or faster ticks. PoB's CullingDPS and
  CombinedDPS finishing estimates do not change its raw PoisonDPS field.
  Synthetic burst/cloud source hits also receive culling fields natively;
  these are not proof that those no-hit components or Poison can cull.
- Tier replacement/removal preserve other links, manual weights, required
  goals, class starts and budgets. No automatic priority action, new passive
  scope, parser, solver, point count, save schema or CSS. Shortest mode and
  unreviewed skill/support pairs stay unchanged.

## Native and Independent Checks

Isolated PoB 0.23.1: 67 MAIN calculations, all four links accepted, all four
missing-Attack/CrossbowAmmoSkill controls rejected. Empty-tree Witch,
level-20 skills, normal Crude Bow, sufficient attributes; installed PoB and
user builds are untouched. Active skill/stat set, Bow, effective mode,
actually applied supports and enemy rarity flags are asserted. Enemy
Poisoned/Bleeding conditions are explicitly off.

- 45 baseline/I/II rows: all five parent components and Normal/Rare/Unique.
- 10 explicit +20% threshold controls: all components, Rare/Unique.
- 12 actual-arrow Poison III rows: both parents, Rare/Unique, without/with
  each culling tier. Chance remains 60%, duration two seconds, no assumed
  Bleeding magnitude bonus or conversion of Poison into hits.

| Native threshold | Normal | Rare | Unique |
| --- | ---: | ---: | ---: |
| Without this support | 0% | 0% | 0% |
| Culling Strike I | 0% | 10% | 5% |
| Culling Strike II, conditional bonus unmodeled | 0% | 10% | 5% |
| II + explicit 20% threshold control | Not tested | 12% | 6% |

Independent arithmetic checks the native finishing multiplier
100 / (100 - threshold): 1.111111... for Rare and 1.052631... for Unique.
These are effective-finishing estimates, not more hit or Poison damage.
Normal support rows have multiplier one and CullingDPS zero. Comparisons use
the same rarity for baseline/support; Fire explosion hit damage differs across
Normal/Rare versus Unique because the explicit boss configuration changes
enemy resistance, not because culling alters damage.

| Native raw output | Without support | I | II |
| --- | ---: | ---: | ---: |
| Poisonburst burst Poison/s | 5.385766215481 | Same | Same |
| Gas outgoing Poison/s | 4.0038541776187 | Same | Same |
| Burst linked Poison / displayed skill duration | 3 / 3.003 s | Same | Same |
| Gas outgoing Poison / cloud duration | 2 / 4.026 s | Same | Same |
| Actual-arrow Poison III, Poisonburst | 4.5657724526838 | Same | Same |
| Actual-arrow Poison III, Gas | 1.5383141032889 | Same | Same |
| Base Mana cost, Poisonburst / Gas | 38 / 62 | Same | Same |

For example, the synthetic burst's Rare CombinedDPS rises from
11.843266215481 to 13.159184683868, while raw PoisonDPS remains
5.385766215481. Its synthetic CullingDPS 1.3159184683868 is not accepted as
real no-hit culling or fed into route scoring. Actual-arrow hits and a
triggered Fire explosion remain separate eligible-hit components.

Evidence: `var/poison-bow-culling-strike-20261109/`, including the repeatable
driver, native JSON and all-row verifier. Independent ordinary-test fixtures:
`src/tree/poisonBowCullingStrikeSupports.fixtures.ts`. Tests require neither
PoB nor network. This is source/native verification, not an in-game test or
whole-build uptime simulation. Existing native startup missing-node notices
do not affect the empty-tree fixture and are retained in its log.

- [Culling Strike I/II source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1528)
- [On-cull 20-second stat wording](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/StatDescriptions/gem_stat_descriptions.lua#L32820)
- [Rarity threshold constants](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Misc.lua#L104)
- [Native culling calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L3898)

Moving upstream links are not claimed byte-identical to the isolated runtime.

## Coverage and Next Batch

Reviewed pairs 496 -> 500; support choices 53 -> 55; families 33 -> 34.
Supports are 55/567 (9.7%), or 55/450 positive-tier (12.2%). Each Poison
focus now has 31 reviewed support choices. Skills remain 103/399
(98/234 positive-tier), preferences 184, main-tree wording 864/2182 and
occurrences 3444/5451. No catalog refresh or baseline reset.

Successor: [Blind I/II review](build-focus-poison-bow-blind.md) now separates
actual-hit application and enemy debuffs from Poison damage and assumed
uptime. This checkpoint's counts and verification remain historical.
No commit, push or deployment without authorization.

## Verification

Focused regressions passed 299 tests across six files. One
`npm run validate:release` passed 2933 tests across 132 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
78756 ms. The existing large-main-chunk advisory remains non-blocking
(715.37 kB). No catalog refresh, baseline reset or route-quality audit.
The separate native all-row verifier passed all 67 calculations.

An isolated Edge production-preview smoke check passed both tiers for both
focuses: 31 reviewed choices each, hit/rarity/conditional-bonus notes, tier
replacement, removal, other families and preserved manual Poison Magnitude/
Attack Speed weights on selection and Add suggestions. No automatic support
priority action appeared. Final console had zero errors/warnings and no
page errors; the initial unrelated favicon 404 was absent after reload.
The screenshot was inspected for a nonblank tree and readable, non-overlapping
notes/controls. User saves were isolated and the browser session closed.
DOM/JSON tests cover disabled controls, class, goals, budgets and every tier's
saved settings. Repetitive browser save/reload and Firefox checks were not
repeated: shared layout, persistence and browser-specific code did not change.

Logs: `var/poison-bow-culling-strike-20261109/`. Repeatable smoke script and
screenshot: `output/playwright/poison-bow-culling-strike-20261109/`.
Served HTML and actual entry JavaScript matched current dist. The entry
returned HTTP 200 as JavaScript (715379 bytes), not an HTML fallback.
Scoped `git diff --check` passed with only the existing README line-ending
advisory. Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

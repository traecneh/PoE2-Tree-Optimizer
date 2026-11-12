# Blind I/II for Poison Bow Focuses

Two optional choices, one family and four reviewed pairs for Poisonburst Arrow
and Gas Arrow. Enemy-debuff context, not automatic Poison or defence scoring.

## Effects and Boundaries

- Both parents pass native hit-parent compatibility. Both tiers have 100%
  chance to Blind on eligible hits, not 100% increased chance, guaranteed
  contact, immunity bypass or permanent enemy Blind. Initial arrows can
  apply Blind; the no-hit burst/cloud and Poison cannot. Gas's conditional
  Fire explosion can hit, but ignition/detonation and contact are not supplied.
- Base Blind gives the enemy 20% less Accuracy and Evasion. Tier II adds 20%
  increased Blind effect: 20 * 1.2 = 24% less, not 40% less or +20 percentage
  points. These are enemy-rating changes, not more player Accuracy/Evasion,
  a fixed increase in hit/evade chance or guaranteed damage avoidance.
- Only an explicitly enabled enemy-Blind condition activates the native
  rating reductions. Linking either tier does not enable it automatically.
  The support's chance and effect are separate from debuff duration, contact
  frequency, enemy susceptibility and uptime; none is inferred for routing.
- The native synthetic burst/cloud source calculations expose BlindChance
  and hit/crit-based Poison estimate changes when enemy Blind is explicitly
  enabled. Those are not actual burst/cloud hits or a direct Poison multiplier.
  No Poison chance, magnitude, stack, timer, speed or area bonus is supplied.
  Actual-arrow Poison still requires its separate source of chance; the Fire
  explosion gains no Poison eligibility merely by adding Blind.
- Both tiers carry a 1.1 Mana multiplier, meaning 10% higher cost before
  native integer rounding. This is not +10 Mana, cost efficiency, recovery
  or guaranteed sustain. Multipliers combine before rounding.
- Tiers replace each other only. Existing manual Blind/Poison priorities,
  other support families, starts, required goals and point budgets survive
  selection/removal, Add suggestions and JSON save/export/import. No automatic
  priority action, new passive scope, parser, solver, point count, save schema
  or CSS. Shortest mode and unreviewed pairs remain unchanged.

## Native and Independent Checks

The isolated PoB 0.23.1 runtime completed 52 MAIN calculations. All four
support links pass and all four controls lacking eligible hit-parent types
reject. Fixture: empty-tree Witch, level-20 skills, normal Crude Bow,
sufficient attributes, 90% less Accuracy Rating and +1000 Evasion Rating to
make hit/evade differences observable. Installed PoB and user builds untouched.
Active/stat set, equipped Bow, applied links, effective mode and actual enemy
Blind flags are asserted. Player Blind and enemy Poisoned/Bleeding are off;
the default boss configuration is overridden with None.

- 30 baseline/I/II rows: all five components, enemy Blind off/on.
- 10 independent effect controls: I +20% and II +20%, explicitly Blind on.
- 12 actual-arrow Poison III rows: both parents, Blind off/on, with neither
  culling nor any other assumed enemy condition.

| Explicit native condition | Blind off | Base Blind on | II on | II + separate 20% effect on |
| --- | ---: | ---: | ---: | ---: |
| Enemy Accuracy/Evasion multiplier | 1 | 0.8 | 0.76 | 0.72 |
| Enemy Accuracy | 2357 | 1885.6 | 1791.32 | 1697.04 |
| Enemy Evasion | 996 | 796.8 | 756.96 | 717.12 |
| Player hit chance in this fixture | 86% | 92% | 93% | 94% |
| Player evade chance in this fixture | 9% | 11% | 12% | 12% |

Player Accuracy 657 and Evasion 1007 stay unchanged in every state. Tier II
with Blind off leaves enemy ratings unchanged despite its 20% effect modifier.
I + explicit 20% effect exactly reproduces II's results; II + explicit 20%
combines additively as 40% increased effect, giving 28% less ratings, not two
independent multiplicative Blind debuffs. Independent arithmetic verifies
these factors and raw rating outputs without using production metadata.

### Poison Estimates and Cost

| Native Poison/s estimate | Blind off, with/without I/II | Base Blind explicitly on | II explicitly on |
| --- | ---: | ---: | ---: |
| Poisonburst synthetic burst | 5.1407527211226 | 5.2443412172508 | 5.2618120321071 |
| Gas synthetic cloud | 3.8503496414138 | 3.9155138751918 | 3.9264606411955 |
| Poisonburst actual-arrow Poison III | 4.4181304728428 | 4.4813157279847 | 4.491852282099 |
| Gas actual-arrow Poison III | 1.4965946562522 | 1.5143051909483 | 1.5172801597027 |

Poison magnitude remains one; inherent chance stays 100%, actual-arrow Poison
III chance stays 60%, stack cap stays one. Burst linked Poison stays three
seconds, Gas outgoing Poison two seconds, actual-arrow Poison two seconds.
Displayed burst/cloud timers remain 3.003/4.026 seconds. Native noncritical
Physical/Fire hit bases stay unchanged. Hit/crit-inclusive AverageHit and
TotalDPS change with explicit enemy Blind; arithmetic checks
AverageHit * 1.2 attacks/sec * hit chance. Conditional estimates are not
direct Poison damage, exact game cloud/burst behavior or modeled uptime.

Base costs 38/62 become 41/68 with either Blind tier. Poison III alone costs
45/74; with Blind the costs are floor(38 * 1.2 * 1.1) = 50 and
floor(62 * 1.2 * 1.1) = 81, not rounding intermediate support costs first.
No automatic priority adjustment compensates for these costs.

Evidence: `var/poison-bow-blind-20261109/` (driver, native JSON, all-row
verifier/logs). Independent ordinary-test fixtures:
`src/tree/poisonBowBlindSupports.fixtures.ts`. Tests require neither native
PoB nor network. Source/native verification, not in-game or whole-build
uptime verification. Existing runtime startup missing-node notices are
retained; they do not affect this empty-tree fixture.

- [Blind I/II generated source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L464)
- [Chance and enemy-debuff effect mappings](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L533)
- [PoB Blind calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua#L724)

Moving upstream links are not claimed byte-identical to the isolated runtime.

## Coverage and Next Batch

Reviewed pairs 500 -> 504; support choices 55 -> 57; families 34 -> 35.
Supports are 57/567 (10.1%), or 57/450 positive-tier (12.7%). Each Poison
focus now has 33 reviewed choices. Skills remain 103/399 (98/234 positive-tier),
preferences 184, main-tree wording 864/2182, occurrences 3444/5451. No catalog
refresh or baseline reset.

Successor: [Blindside review](build-focus-poison-bow-blindside.md) now checks
the supported skill's Blind prohibition before conditional critical-hit
benefits and replaces paired Blind I/II notes with an upfront warning.
This checkpoint's counts and verification remain historical. No deployment
without authorization.

## Verification

Focused regressions passed 296 tests across six files. One
`npm run validate:release` passed 2951 tests across 133 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
63543 ms. The existing main-chunk size advisory remains non-blocking
(717.56 kB). The native all-row verifier passed all 52 calculations.
No catalog refresh, baseline reset or route-quality audit.

An isolated Edge production-preview smoke check passed I/II for both focuses:
33 reviewed choices each, hit/debuff/cost notes, tier replacement, removal,
other families and preserved manual Blind Chance/Blind Effect/Poison Magnitude
weights on selection and Add suggestions. No automatic support-priority action
appeared. Final console: zero errors/warnings and no page errors; the initial
unrelated favicon 404 was absent after reload. Screenshot inspected for a
nonblank tree and readable, non-overlapping notes/controls. User saves were
isolated and the browser session closed. DOM/JSON tests cover disabled controls,
class, goals, budgets and both tiers' saved settings. Repetitive browser save/
reload and Firefox checks were not repeated: shared layout, persistence and
browser-specific code did not change.

Logs: `var/poison-bow-blind-20261109/`. Repeatable smoke script and screenshot:
`output/playwright/poison-bow-blind-20261109/`. The preview was started with the
project base path; served HTML and actual entry JavaScript matched current
dist. Entry returned HTTP 200 as JavaScript (717560 bytes), not HTML fallback.
Scoped `git diff --check` passed with only the existing README line-ending
advisory. Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

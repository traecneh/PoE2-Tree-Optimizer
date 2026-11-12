# Blindside for Poison Bow Focuses

One optional choice, one family and two reviewed pairs for Poisonburst Arrow
and Gas Arrow. Prohibition first; no automatic critical-hit or Poison weighting.

## Restrictions Before Benefits

- Both parents pass native hit-capable-parent eligibility; controls lacking
  those types or adding DegenOnlySpellDamage reject. The no-hit burst/cloud
  focus does not become an actual critical hit merely because the parent
  has a compatible arrow-hit component.
- Supported skills cannot inflict Blind. Blind I/II in the same skill does
  not bypass that prohibition or supply Blindside's condition. Its local
  Blind effect does not transfer to another skill/source's Blind. A genuinely
  different source must Blind the enemy; neither that source nor its uptime
  is assumed. Initial arrows and Gas's separately triggered Fire explosion
  remain distinct from no-hit Poison; ignition/detonation is not supplied.
- Against an already Blinded enemy, the source grants 15% more Critical Hit
  Chance and 15% more Critical Damage Bonus. These are not +15 percentage
  points, 15% more total critical-hit damage or 15% more Poison DPS. They do
  not enable critical hits when critical hits are prohibited.
- Either selected Blind tier receives replacement notes starting with the
  prohibition while Blindside is selected. Their links and manual weights
  remain intact; removing Blindside restores normal Blind notes. A manual
  Blind Chance preference receives the established retained-weight caution.
  Blind Effect/Duration may serve a different source and are not categorically
  banned. No automatic critical-hit suggestions, priority actions, passive
  scopes, parser/solver changes, point-count changes or save schema.
- Blindside's Mana multiplier is 1.2: 20% higher cost before integer rounding.
  Same-skill Blind links still cost Mana despite not bypassing the prohibition.
  No contact, external debuff uptime, net DPS, sustain or boss benefit assumed.

## Native Coverage Gap

PoB 0.23.1 contains cannot_inflict_blind in Blindside's source/stat text but
does not map/enforce it in calculations. With same-skill Blind I/II it still
exposes raw BlindChance = 100. With enemy Blind explicitly enabled, Blind II's
effect also changes native enemy-rating/hit estimates despite the unsupported
source attribution. These are coverage gaps, not legal Blind supply or a way
to strengthen a different source's Blind. UI notes override these implications;
the runtime is not patched and no condition is invented to hide the gap.

The native conditional critical calculations do work. We verify them against
separate explicit modifiers under the same enemy condition, not by trusting
that raw Blind chance implies actual contact or uptime.

## Native and Independent Checks

59 isolated MAIN calculations: empty-tree Witch, level-20 skills, normal Crude
Bow, sufficient attributes, 90% less Accuracy Rating and +1000 Evasion Rating
to expose hit/crit confirmation. Actual active/stat set, Bow, applied links,
effective mode and enemy Blind flags are asserted. Self Blind and enemy
Poisoned/Bleeding are off. Boss mode is explicitly None. Installed PoB and
user builds are untouched.

- 20 baseline/Blindside rows: all five components, external Blind off/on.
- 5 independent explicit +15%-more chance/bonus controls, external Blind on.
- 10 Never deal Critical Hits controls: baseline/Blindside, all components.
- 16 actual-arrow rows: both skills, Blind I/II without/with Blindside, off/on.
- 8 actual-arrow Poison III rows: both skills, without/with Blindside, off/on.
- Two compatible parents and four negative compatibility controls.

| Native critical value | External Blind on, no Blindside | External Blind on, Blindside |
| --- | ---: | ---: |
| Pre-hit-confirmation critical chance | 5% | 5.75% |
| Hit chance | 92% | 92% |
| Effective critical chance | 4.6% | 5.29% |
| Total critical-hit multiplier | 2 | 2.15 |
| Expected critical effect | 1.046 | 1.060835 |

Independent arithmetic: 5 * 1.15 = 5.75, then * 0.92 = 5.29. The bonus part
of total critical damage scales: 1 + (2 - 1) * 1.15 = 2.15, not 2 * 1.15.
Expected critical effect is 1 + critical chance * (multiplier - 1). With
Blind off the extra modifiers are both one and native damage stays unchanged
apart from Mana cost. Explicit critical-modifier controls reproduce Blindside's
hit/Poison estimates exactly; NeverCrit controls remove every observed damage
benefit while retaining cost. No generic Full DPS multiplier is added.

### Source-Hit and Poison Estimates

| Native Poison/s estimate | External Blind off, without/with Blindside | External Blind on, no Blindside | External Blind on, Blindside |
| --- | ---: | ---: | ---: |
| Poisonburst synthetic burst | 5.1407527211226 | 5.2443412172508 | 5.4507174778217 |
| Gas synthetic cloud | 3.8503496414138 | 3.9155138751918 | 4.0270279561623 |
| Poisonburst actual-arrow Poison III | 4.4181304728428 | 4.4813157279847 | 4.5633485510359 |
| Gas actual-arrow Poison III | 1.4965946562522 | 1.5143051909483 | 1.5420253377344 |

These are native source-crit estimates, not proof of real burst/cloud critical
hits, direct Poison multipliers or exact game behavior. Native Poison magnitude
stays one, stack cap one, inherent chance 100%, actual-arrow Poison III chance
60%. Burst linked Poison stays three seconds, Gas outgoing Poison two seconds,
actual-arrow Poison two seconds; displayed skill timers stay 3.003/4.026.
Noncritical Physical/Fire source damage, speed and area remain unchanged.
Initial-arrow and conditional Fire-explosion hits are outside these Poison
focuses. Existing manual critical priorities still affect routing with warnings,
not automatic promotion or removal.

Costs: 38/62 -> 45/74 with Blindside; with same-skill Blind I/II they become
floor(base * 1.2 * 1.1) = 50/81. With Poison III they become
floor(base * 1.2 * 1.2) = 54/89, not rounding intermediate costs first.

Evidence: `var/poison-bow-blindside-20261109/` (driver, native JSON, all-row
verifier/logs). Independent ordinary-test fixtures:
`src/tree/poisonBowBlindsideSupport.fixtures.ts`. Tests need neither native
PoB nor network. Source/native verification, not an in-game or whole-build
uptime test. Existing runtime startup missing-node notices are retained and
do not affect the empty-tree fixture.

- [Blindside generated source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L525)
- [Blind prohibition text](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/StatDescriptions/gem_stat_descriptions.lua#L9249)
- [Native critical calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving upstream links are not claimed byte-identical to the isolated runtime.

## Coverage and Next Batch

Reviewed pairs 504 -> 506; support choices 57 -> 58; families 35 -> 36.
Supports are 58/567 (10.2%), or 58/450 positive-tier (12.9%). Each Poison
focus now has 34 choices. Skills remain 103/399 (98/234 positive-tier),
preferences 184, main-tree wording 864/2182, occurrences 3444/5451. No catalog
refresh or baseline reset.

Successor: [Bounty I/II review](build-focus-poison-bow-bounty.md) now checks
supported-hit kills, Poison attribution and separate Life/Mana Flask and Charm
rewards. This checkpoint's counts and verification remain historical.
No commit, push or deployment without authorization.

## Verification

Focused regressions passed 300 tests across six files. One
`npm run validate:release` passed 2971 tests across 134 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
58173 ms. The existing main-chunk advisory remains non-blocking (720.25 kB).
The independent native all-row verifier passed all 59 calculations. No catalog
refresh, baseline reset or route-quality audit.

An isolated Edge production-preview smoke check passed both focuses: 34 choices
each, prohibition-first Blindside notes, paired Blind I/II warnings, normal-note
restoration after removal, retained manual Blind Chance/Critical Hit Chance/
Critical Damage Bonus/Poison Magnitude weights on selection and Add suggestions,
other links and the retained-weight caution. No automatic support-priority action
appeared. Final console: zero errors/warnings and no page errors; the initial
unrelated favicon 404 was absent after reload. Screenshot inspected for a
nonblank tree and readable, non-overlapping notes/controls. User saves isolated
and browser session closed. DOM/JSON checks cover disabled controls, both
selection orders, restored warnings, class, goals, budgets and saved links.
Repetitive browser save/reload and Firefox checks were not repeated: layout,
persistence and browser-specific code did not change.

Logs: `var/poison-bow-blindside-20261109/`. Repeatable smoke script and
screenshot: `output/playwright/poison-bow-blindside-20261109/`.
The preview was started with the project base path; served HTML and actual
entry JavaScript matched current dist. Entry returned HTTP 200 as JavaScript
(720255 bytes), not HTML fallback. Scoped `git diff --check` passed with only
the existing README line-ending advisory. Local preview:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

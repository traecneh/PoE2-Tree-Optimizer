# Warcry Utility Support Review

Reviewed 2026-11-08 against the isolated PoB 0.23.1 runtime/catalog and PoE2
0.5.5f graph. Adds thirty curated pairs across Infernal Cry, Seismic Cry,
Ancestral Cry, Fortifying Cry and standalone Ferocious Roar. No new support
IDs, preferences, passive scopes, solver, schema or shared UI controls.

## Pairing Decisions

| Family / choices | Admitted pairs | Reviewed base-use scope |
| --- | ---: | --- |
| Magnified Area I/II | 10 | All five parent Warcries; coverage, not linear radius, empowered-attack area or enemy Power |
| Prolonged Duration I/II | 6 | Infernal, Ancestral and Fortifying; both Fortifying timers scale, not Guard strength or guaranteed empowerment |
| Efficiency I/II | 10 | All five parent Warcries; lower application cost, not Glory, Rage, charge supply or sustainable frequency |
| Mobility | 4 | The four human-form base uses; movement penalty during the action, not action speed, cooldown or global speed |

Seismic Cry and standalone Ferocious Roar lack the Duration type, rejecting
both Prolonged tiers. Ferocious also lacks UsableWhileMoving and rejects
Mobility. These are five rejected native parent pairings, not arbitrary UI
restrictions. A support becoming legal through a different linked setup is not
covered by this base-use list. Unlisted supports are not generally declared
illegal; only these reviewed component boundaries are enforced by the allowlist.

All seven existing choices remain context-only: no automatic passive weights,
priority changes or support multipliers enter route scores. Existing manual
priorities, defence, required goals, extra/all-available budgets and empty
parent hit scopes survive selection/removal. One tier per family is retained.
Saved builds and JSON transfer use existing catalog-driven normalization.
The default source score stays 5, or Ancestral 4, rather than multiplying by
support strength. Shared/base point accounting and shortest routing are intact.

## Forms and Components

The review concerns self-used human-form parents and standalone Bear-form
Ferocious. Equipment and form requirements are not removed by compatible
supports. Positive native cases equip a normal Changeling Talisman for
Ferocious and a normal Splintered Tower Shield for Fortifying. A missing
Talisman still disables Ferocious even with accepted supports. Native Fortifying
still fails to enforce its catalog Armoured Shield requirement; that pre-existing
limitation is not mistaken for live usability. The website has no gear/form
validator, Glory/charge supply or complete combat-state simulation.

Twenty-eight additional native predicates check Combust, Volcanic Steps,
Volcanic Eruption and Shield Wave separately. Magnified Area and Efficiency
are legal for these children; Prolonged and Mobility are not. Child legality is
not substituted for parent legality, nor does a parent utility preference score
the child's damage/coverage. These are component type checks, not full linked-
child damage calculations. No new child focus is added.

Ferocious's internal socketed-Warcry trigger and replacement mode remain a
separate review; these seven choices do not enable that mode in the website.
Ancestral remains Glory-gated rather than cooldown-gated. Guard, Rage, enemy
Power, charge bypasses, empowerment counts, consuming attacks, corpses,
triggered-child cadence and actual uptime/DPS are not simulated. The previously
recorded Ferocious source castTime 1.1 versus native Warcry base 0.8 discrepancy
remains qualified; no native source was patched or personal PoB build changed.

## Native and Independent Checks

The native driver exports seven support definitions, evaluates 63 component
pairs (35 parents plus 28 children), asserts thirty negative type controls and
captures fifty actor fixtures. Controls remove the required Area, Duration or
UsableWhileMoving type or add excluded Persistent. Fixture skills are level
20/quality 0, supports level 1/quality 0, empty tree and sufficient attributes.

Actor cases cover every parent baseline, all seven individual links including
rejected ones, valid multi-family combinations, three generic-duration controls
and two missing-equipment controls. Applied effect IDs must agree with native
compatibility, not merely socketed support IDs. Rejected links leave the parent
outputs exactly at baseline. All tested parents remain player-owned with no
minion actor. Form, equipment selection, costs and both duration output keys
are captured explicitly.

- Magnified I/II give +35/+45% area, zero more-area-damage source and a 1.30
  support cost multiplier. Independent `floor(radius * sqrt(1 + area/100))`
  gives human radius 40 -> 46/48 and Ferocious 70 -> 81/84. Parent average
  damage, use time and cooldown do not change. Child damage is not inferred.
- Prolonged I/II give 30/35% more duration and a 1.20 cost multiplier.
  `ceil(base * more / .033) * .033` gives primary eight-second timers
  8.019 -> 10.428/10.824. Fortifying's secondary four-second timer becomes
  4.026 -> 5.214/5.412. With another +20% generic duration and Prolonged I,
  independent results are 12.507 primary and 6.270 Fortifying secondary.
  Neither raw buff strength nor actual empowerment uptime is calculated here.
- Efficiency I/II use 0.70/0.60 less-cost factors, not regeneration or cooldown
  recovery. Native stages floor support-adjusted base cost, then ceil the
  less-cost result. Baseline 85 Mana becomes 60/51; Ancestral's 44 becomes
  31/27. Combined Magnified II + Prolonged II + Efficiency II gives
  `ceil(floor(85 * 1.30 * 1.20) * .60) = 80`, or 41 for Ancestral. Without
  Prolonged, the Seismic/Ferocious combination costs 66. These are isolated
  native rounding checks, not a promise of universal in-game sustain/rounding.
- Mobility multiplies a 70% base action movement penalty by .75, giving 52.5%
  penalty and normalized minimum movement 30% -> 47.5%. The equipped shield's
  global movement modifier remains separate. Use time, cooldown, damage and
  global speed do not change. Acceleration and actual movement are not simulated.

## Provenance and Reproduction

Official references: [Magnified Area](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6689),
[Prolonged Duration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5602),
[Efficiency](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2711),
[Mobility](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3066)
and [native calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
Moving upstream references are not claimed identical to the local snapshot.

| Tested local file | SHA-256 |
| --- | --- |
| Data/Skills/sup_int.lua | 573766c7653ba612984b8e12bc70b77aa0e46f7aa217fe836fae539c7911c5af |
| Data/Skills/sup_str.lua | 370edb0f3c6475565c23057953de8af2d3ca851cf3a94a5818ae547ed179e13a |
| Data/Skills/sup_dex.lua | 0cb6d21a33eced70a49b537a9b6ad9841c43b70f7fdd8a88eae9435263eec4c6 |
| Modules/CalcOffence.lua | eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435 |
| Modules/CalcActiveSkill.lua | a94ef08b56ed23ae4e98618056d457fc7f5f6cf36f7436d86afcae328510c75c |

Ignored evidence is under `var/warcry-supports-20261108/`. The complete native
driver and independent audit pass. Fourteen pre-existing missing-node startup
messages are unrelated. Ordinary tests need no PoB, network or private builds.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/warcry-supports-20261108/review.lua --job var/warcry-supports-20261108
node --import tsx var/warcry-supports-20261108/verify.mjs
```

## Coverage and Validation

Reviewed pairs 312 -> 342. Support choices stay 31/567 across 19 families,
twenty context-only/partial; skills 50/399 and preferences 183. All 51 contexts,
both fingerprints, union 853/2,182 wordings (39.1%) and 3,412/5,451 occurrences
(62.6%) are unchanged. No baseline refresh is needed. These are scoped coverage
counts, not full mechanics or a project completion percentage.

Quick validation passed 1,771 tests in 49 files, typecheck and no-loss coverage.
Tests cover all thirty admitted pairs and five exclusions, explicit selection,
removal, tier replacement, preserved priorities/budgets/scopes, save/JSON
transfer and unchanged weighted route scores. Shortest behavior and existing
base/shared point checks remain intact. The native audit verifies all 63
component predicates, thirty negative controls and fifty actor fixtures with
independent arithmetic. One final release validation passed 2,088 tests in 93
files, typecheck, production build, graph validation and the unchanged coverage
baseline. Local port 5174 returns HTTP 200. The existing main-chunk warning
remains non-fatal at 552.65 kB minified / 145.50 kB gzip. `git diff --check`
passes with existing LF/CRLF conversion notices. No final validation step failed.
This is metadata in existing controls, not a changed shared control/layout
contract; no repeated real-browser matrix or visual acceptance is claimed.

Next proposal: review Raging Cry, Exposing Cry and Enraged Warcry I/II for these
five base-use focuses. Their positive-tier catalog entries exist, but no pairs
are approved yet. Keep Rage generation/consumption, enemy Power, actual hit
requirements for Exposure and cooldown bypasses explicit. This is not
authorization to implement that batch. Ferocious socketed replacement, Fireball
Concentrated Area and ten-Incision remain separate reviews. No commit, push or
deployment authorized or performed.

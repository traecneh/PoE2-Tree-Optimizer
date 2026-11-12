# Combined Elemental and Ailment Preferences

Reviewed 2026-11-07 against the PoE2 0.5.5f graph, official upstream PoB source,
and the isolated local PoB 0.23.1 parser/ModDB. This implements a coherent
15-category batch without changing shortest routing, worker contracts, source
data/assets, saved-build schema or any skill/support suggestions.

## Implemented Scope

All are opt-in through the existing picker, priority and remove controls.
Details stay in existing tooltips; no explanatory panels or new default weights.

| Preference | Exact numeric wording after the value/form | Normal score unit | Main-tree occurrences |
| --- | --- | --- | ---: |
| Fire Penetration | Damage Penetrates N% Fire Resistance | 5% penetration | 19 |
| Cold Penetration | Damage Penetrates N% Cold Resistance | 5% penetration | 18 |
| Lightning Penetration | Damage Penetrates N% Lightning Resistance | 5% penetration | 26 |
| Elemental Penetration | Damage Penetrates N% of Enemy Elemental Resistances | 5% penetration | 5 |
| Flammability Magnitude | N% increased/reduced Flammability Magnitude | 10% modifier | 38 |
| Ignite Magnitude | N% increased/reduced Ignite Magnitude | 10% modifier | 17 |
| Shock Magnitude | N% increased/reduced Magnitude of Shock you inflict | 10% modifier | 16 |
| Poison Magnitude | N% increased/reduced Magnitude of Poison you inflict | 10% modifier | 18 |
| Bleeding Magnitude | N% increased/reduced Magnitude of Bleeding you inflict | 10% modifier | 9 |
| Shock Chance Modifier | N% increased/reduced chance to Shock | 10% modifier | 26 |
| Ignite Duration | N% increased/reduced Ignite Duration on Enemies | 10% modifier | 6 |
| Poison Duration | N% increased/reduced Poison Duration | 10% modifier | 9 |
| Bleeding Duration | N% increased/reduced Bleeding Duration | 10% modifier | 5 |
| Shock Duration | N% increased/reduced Shock Duration | 10% modifier | 6 |
| Freeze Duration | N% increased/reduced Freeze Duration on Enemies | 10% modifier | 2 |

Increased/reduced modifiers retain their signs. Real penalties include Stacking
Toxins' -20 Poison magnitude (63759), Building Toxins' -25 Poison duration (15986)
and Biting Frost's -20 Freeze duration (38329). Their extra stacks or conditional
damage are not invented as compensating rewards. A required penalized goal stays
required; only selected effects contribute to the score.

Penetration is a flat modifier, not an increased percentage. Only the documented
nonnegative penetration forms match; no synthetic increased/reduced penetration
or signed-negative alias was invented. Decimal/zero values and case/whitespace
normalization are supported. The five-point penetration score unit is a relative
normalization, not five percent DPS or a comparison of real defensive/offensive
power. Other modifiers use the existing ten-percent heuristic convention.

Elemental Penetration has its own category and is not copied into three elemental
categories. Every line is counted once per matching category, and shared/new
nodes once per route. Already allocated base nodes do not gain new-node reward.

## Limits and Ownership

Flammability is application, not the Flammability curse or Ignite damage. Shock
application, magnitude and duration are separate. Poison/Bleeding magnitude is
not chance, duration, stack limits or their underlying damage type. Duration is
not damage per second; longer duration is only a selected preference, not a claim
of universal benefit. Penetration is for applicable hits, not damage over time,
exposure or resistance reduction. Tooltips state these limits.

Only full literal unconditional player-owned lines match. Conditions, weapon or
skill restrictions, minion/enemy ownership, ailments on you, more/less, faster
damage, extra stacks and unreviewed group/composite modifiers stay excluded.
Lookup whitelists use own keys so object prototype names cannot become effects;
the existing generic whitelist received the same narrow boundary check.

Gear, resistances/floors, damage proportions, prohibitions, thresholds, stacking,
replacement and actual uptime/DPS are not simulated. An explicitly chosen manual
preference can still be inapplicable to a real build. Review its other effects.
No preset/support adds these preferences automatically, including Fireball.
Fireball's Concentrated Area review remains on hold.

## Source and Native Evidence

PoB's [ailment mappings](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
separate application, ailment-owned magnitude and outgoing duration from self
protection. Its [offence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)
apply penetration in the hit-resistance calculation with floors/prohibitions,
rather than treating it as a damage percentage. Moving upstream references are
not claimed byte-identical to the copied 0.23.1 runtime.

The local native probe checked 26 complete parses: 11 modifiers in both signs
and four penetration forms. All produced expected names, types, values and
ownership. Magnitudes use ailment keyword flags; cross-querying a different
ailment returned zero. Increased/reduced forms were INC, not BASE; penetration
was BASE, not INC. Existing copied-runtime missing-node startup messages did not
prevent the checks. No personal PoB build or installed settings were modified.

Independent score arithmetic for Flash Storm (12337): +15 Lightning penetration
at five per unit gives 3, and +30 Shock application at ten per unit gives 3.
The route/scorer total is 6, from one new node, not six passive points. A mixed
fixture independently sums 5 Elemental penetration, 10 Fire penetration, +30
Shock application, +20 Shock magnitude and -10 Shock duration to 1+2+3+2-1=7.
These are score checks, not calculated build damage.

## Coverage and Validation

Before: 44 preferences, 370/2,182 distinct recognized wordings, and 2,129/5,451
main-tree stat occurrences (39.1%). After: 59 preferences, 440/2,182 wordings
(20.2%), and 2,349/5,451 occurrences (43.1%). Added: 70 exact wordings and 220
occurrences across 203 nodes. Skills remain 14/399, supports 14/567; no overall
completion percentage is inferred. The roadmap records all denominators and
remaining review/research work separately.

- Targeted parser checks: 37 tests passed across the new and existing combat files.
- `validate:quick`: 581 tests across 15 files, typecheck and prior baseline passed.
- `validate:release`: 898 tests across 59 files, typecheck, production build,
  graph validation and refreshed baseline passed. No final validation failed.
- Native probe: all 26 forms/signs/ownership checks passed.
- Parameterized route fixtures cover all 15 preferences, required negative goals,
  selected/unselected effects, shortest dispatch, point budgets and base exclusion.
  Flash Storm's shared branch counts both effects once on one node. Stacking
  Toxins remains a required negative contribution without an unmodeled bonus.
- Existing DOM controls exercise opt-in selection, tooltip scope/units, priority
  and remove for all 15 categories. All current preference IDs round-trip through
  storage and JSON transfer with unchanged focus/support/budget settings.
- The prior baseline lost no wording. All 70 new exact wordings were reviewed
  against the 15 literal forms before baseline refresh; source fingerprints did
  not change. No baseline reset is used to hide a loss.
- Repeated browser layout/save-load matrices are not needed for these unchanged
  metadata-only controls; no routing contract, layout, import or persistence
  implementation changed. No real-character Full DPS comparison was run.
- Local server returned HTTP 200 at `http://127.0.0.1:5174/`. This is not a browser
  rendering check or hosted verification. No commit, push or deployment performed.

Next larger batch: the eight catalog-confirmed elemental spell candidates in
`docs/optimizer-coverage-roadmap.md`, with component/scope review before presets.

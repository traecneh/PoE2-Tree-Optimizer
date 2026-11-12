# Plant Utility Support Review

Efficiency I/II and Mobility were checked for Entangle, Briarpatch, Thrashing
Vines and Toxic Domain. Seven pairs are admitted; five are excluded. Existing
Shortest/weighted routing, scores, point limits and passive matching are unchanged.

## Compatibility

| Skill | Efficiency I | Efficiency II | Mobility |
| --- | --- | --- | --- |
| Entangle | Yes | Yes | Yes |
| Briarpatch | No | No | No |
| Thrashing Vines | Yes | Yes | No |
| Toxic Domain | Yes | Yes | No |

Efficiency excludes Persistent skills, so Briarpatch's Spirit reservation is not
treated as a reducible cast cost. Mobility requires the explicit
`UsableWhileMoving` skill type. Only Entangle has it in this reviewed group.
Thrashing Vines and Toxic Domain have movement-related stats, but those are not
the required type: both the native predicate and actual applied-support lists
reject Mobility. `NoAttackOrCastTime` alone is not a Mobility prohibition; a
separate type control verifies that distinction. No game data was patched to
make a skill compatible.

## Effects and App Behavior

- Efficiency I/II give 30%/40% less supported-skill cost. They do not grant Mana
  regeneration, maximum Mana, faster casts, cooldown recovery or a DPS multiplier.
  Toxic Domain's cost for other skills, Poison supply, Pustule growth and
  detonation timing are separate.
- Mobility gives 25% less movement-speed penalty during Entangle's action, not
  25% global Movement Speed. Fissure travel, the 100 ms vine-application interval
  and cast speed are not sped up by this support.
- Context notes appear only for selected supports. Existing checkboxes handle
  one Efficiency tier per family, removal, disabled/running state and persistence.
  Other selected support families and all manual priorities remain intact.
- No automatic priority suggestion is added. These are reviewed compatibility
  refinements, not cost/sustain simulation or Full DPS integration.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime produced 12 compatibility checks, five type
controls and 26 MAIN calculation cases across all six Plant component sets.
The driver asserts the requested stat set. Evidence is retained under
`var/plant-utility-supports-20261108/`; installed PoB and user builds were untouched.

Frozen independent fixtures in `src/tree/plantSkillSupports.fixtures.ts` record
identities, legal pairs and compact native outputs. Ordinary tests use no PoB
installation or network.

| Skill | Native baseline Mana cost | Efficiency I | Efficiency II |
| --- | ---: | ---: | ---: |
| Entangle | 95 | 67 | 57 |
| Thrashing Vines | 152 | 107 | 92 |
| Toxic Domain | 106 | 75 | 64 |

Individual examples agree with applying 0.7/0.6 and rounding upward. This is not
a general formula based on already-rounded displayed costs: the combined
Entangle Efficiency II + Magnified Area II native case costs 74, while multiplying
the displayed 95 by 1.3 and 0.6 gives 74.1 before rounding. Native precision/order
matters; the app does not estimate those final costs.

Entangle's native while-using retained movement rises from 30% to 47.5%:
`100 - 70 * 0.75 = 47.5`. Global movement stays 1 and cast rate stays
1.1111111111111. Briarpatch retains 30 Spirit with rejected utilities. Fissure,
ground, vine and Bloom timers, Toxic Domain's cooldown and its 15-second Pustule
detonation output remain unchanged in these checks. No real-build DPS or live-game
timing is claimed.

- [Efficiency definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2711)
- [Mobility definition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3066)
- [Native support compatibility](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcTools.lua)

Upstream `dev` links can move and are not claimed byte-identical to the isolated
runtime. An explicit future game-data review can revisit withheld combinations.

## Coverage and Next Batch

Reviewed pairs increase from 398 to 405. The catalog remains 99 skill presets,
38 support choices, 24 families and 184 passive preferences. Passive coverage
stays 864/2182 distinct wordings and 3444/5451 main-tree occurrences; the baseline
is not reset.

Next proposed batch: review Rapid Casting I/II/III and Considered Casting for
Entangle and Thrashing Vines. Check the actual action/component eligibility and
trade-offs rather than inferring applicability from the Spell tag. This is a
proposal, not authorization for another batch or deployment.

The [casting follow-up](build-focus-plant-casting-supports.md) is now complete
separately. Counts and verification here retain the original utility checkpoint.

## Verification

The focused 267-test check passed, followed by one `npm run validate:release`:
2576 tests across 111 files, typecheck, production build, graph validation and
coverage baseline all passed. The existing large-chunk advisory remains
non-blocking (669.23 kB main chunk). No coverage baseline was reset.

Edge and Firefox production-preview smoke checks passed all four eligibility
lists (10/7/9/9 choices), Efficiency tier replacement, contextual notes/removal,
other-family and manual-priority preservation, disabled controls while running,
weighted preview/apply and saved-build load/reload. Both applied the 20-point
test route. Completion consoles had zero errors/warnings; the initial Edge
favicon 404 was unrelated and absent after reload. Screenshots were inspected.
Profiles were isolated from user saves, and both test sessions were closed.

One initial test incorrectly read a checkbox's own `disabled` property instead
of inherited disabled-fieldset behavior. The assertion now uses `:disabled`;
the application already handled this correctly and needed no UI fix.

Logs are retained in `var/plant-utility-supports-20261108/`; the repeatable smoke
script and screenshots are in `output/playwright/plant-utility-supports-20261108/`.
No route-quality audit/benchmark, commit, push or live deployment was performed.
Local preview remains `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

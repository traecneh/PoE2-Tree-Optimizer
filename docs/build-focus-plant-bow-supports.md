# Plant Bow Utility Support Review

Magnified Area I/II, Prolonged Duration I/II, Efficiency I/II and Mobility were
reviewed for Vine Arrow and Toxic Growth. Eleven of fourteen pairs are admitted.
Existing Shortest/weighted routing, passive matching, budgets and scores are
unchanged. Support selection supplies context, not automatic weight changes or
Full DPS simulation.

## Compatibility

| Focus | Magnified Area I/II | Prolonged Duration I/II | Efficiency I/II | Mobility |
| --- | --- | --- | --- | --- |
| Vine Arrow | Yes | Yes | Yes | Yes |
| Toxic Growth | Yes | No | Yes | No |

Both have Area and neither is Persistent. Only Vine Arrow has Duration and
UsableWhileMoving. Toxic Growth's DetonatesAfterTime type does not satisfy the
Duration predicate. Both the native predicate and actual applied-support lists
reject Prolonged Duration and Mobility for Toxic Growth. No type or source data
was patched to admit a pairing. Unreviewed attack/projectile supports stay absent.

## Component Boundaries

- Magnified Area I/II give 35%/45% increased area, not that much radius or damage.
  Vine targeting and impact coverage stay separate from intrinsic vine DoT.
  Toxic impact/explosion coverage is not stored Poison or guaranteed overlap.
- Prolonged Duration I/II give 30%/35% more skill-effect duration to Vine Arrow's
  eight-second plant lifetime. Neither its intrinsic DoT rate nor firing speed
  increases. Supplied Poison duration, storage and guaranteed enemy contact are
  not inferred. Rejected duration supports do not change Toxic Growth's separate
  15-second base detonation timer or its outgoing Poison duration.
- Efficiency I/II reduce the supported bow action's cost by 30%/40%, not global
  Mana needs, Mana regeneration or the cost of a separate Poison-supply skill.
  They do not accelerate growth, attacks or detonation. Whole-build sustain is
  not calculated.
- Mobility reduces Vine Arrow's while-firing movement penalty by 25%. It does
  not give global Movement Speed, Attack Speed or a damage multiplier.
- Notes appear only for selected supports. Family tier replacement, removal,
  disabled state and save/JSON behavior use the existing controls. Focus changes
  clear old support selections without deleting preferences. Manual Poison
  priorities and their warnings remain intact. No extra route points are awarded.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime checked fourteen pairs, six positive/negative
type controls and 36 MAIN component cases across Vine Arrow Impact/Vines and
Toxic Growth Pustules/Explosion. Each case asserts its stat-set index, equipped
Bow and agreement between native eligibility and applied supports. Installed PoB
and user builds were untouched. Evidence is retained in
`var/plant-bow-supports-20261109/`.

Independent frozen fixtures in `src/tree/plantBowSupports.fixtures.ts` record
identities, eligibility and compact outputs; ordinary tests require no native
installation or network.

| Component | Base radius | Magnified I | Magnified II |
| --- | ---: | ---: | ---: |
| Vine Arrow Impact | 8 | 9 | 9 |
| Vine Arrow Vines | 24 | 27 | 28 |
| Toxic Growth Pustules | 8 | 9 | 9 |
| Toxic Growth Explosion | 8 | 9 | 9 |

Independent checks use `floor(radius * sqrt(1 + increasedArea))`. The two tiers
can round to the same small radius. A separate 100% increased-area case with
Magnified II yields `floor(24 * sqrt(2.45)) = 37`, confirming additive increases,
not two multiplicative radius bonuses.

Vine lifetime is rounded to server ticks: base 8.019, Prolonged I 10.428 and
Prolonged II 10.824. Checks use `ceil(8 * moreDuration / .033) * .033`. With
100% increased duration plus Prolonged II it becomes 21.615, not a doubled base
DoT rate. Intrinsic Chaos DoT stays 271.3/s throughout all seven individual
supports and the combined case. Native attack/Poison fields exposed for the
hidden-hit Vines component are not interpreted as actual vine hits or Poison.

| Skill | Native Mana cost | Efficiency I | Efficiency II |
| --- | ---: | ---: | ---: |
| Vine Arrow | 47 | 33 | 29 |
| Toxic Growth | 98 | 69 | 59 |

These individual examples agree with upward rounding after 0.7/0.6. This is not
a general formula from already-rounded displayed costs: Vine Arrow with
Magnified costs 61, not `ceil(47 * 1.3)`. Internal precision/order matters. The
combined Vine Area II + Duration II + Efficiency II + Mobility case costs 44;
Toxic's Area II + Efficiency II costs 77, with the incompatible duration/mobility
links rejected. The app does not estimate final Mana costs.

Vine's retained while-firing movement rises from 30% to 47.5%:
`100 - 70 * .75 = 47.5`. Global movement stays 1 and attack rate stays 1.2.
Toxic's base hit remains 1.3125, outgoing Poison remains 1.2077199486588,
outgoing Poison duration stays two seconds and detonation stays fifteen seconds.
No Poison-supply, storage/growth, accelerated expiry, overlap, uptime or live-game
DPS simulation is claimed.

- [Active skill definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua)
- [Magnified Area](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6689)
- [Prolonged Duration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5602)
- [Efficiency](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2711)
- [Mobility](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3066)

Moving upstream links were reviewed, but are not claimed byte-identical to the
isolated snapshot.

## Coverage and Next Batch

Reviewed support pairs increase from 416 to 427. The catalog remains 101/399
skill presets (25.3%), 96/234 positive-tier skills (41.0%), 38 support choices,
24 families and 184 passive preferences. Passive coverage stays 864/2182 distinct
wordings and 3444/5451 occurrences. No coverage baseline reset.

Next proposed batch: review Rapid Attacks I/II and Projectile Acceleration I/II
for both bow focuses, separating deployment/delivery utility from intrinsic DoT,
stored Poison and detonation timing. Actual eligibility must be checked first.
This is a proposal only, not authorization for another batch or deployment.

The [speed support follow-up](build-focus-plant-bow-speed-supports.md) is now
complete separately. Counts and verification here retain the original utility
checkpoint.

## Verification

Focused checks passed 275 tests across five files. One final
`npm run validate:release` passed 2643 tests across 115 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
87173 ms. The existing large-chunk advisory remains non-blocking (main 679.88 kB).
No coverage baseline reset or route-quality audit was performed.

Isolated Edge and Firefox production-preview checks passed both support lists
(seven/four choices), all eleven selection/removal paths, family replacement,
component notes, manual-priority preservation, disabled controls during routing,
preview/apply and saved-build load/reload. Both applied a 20/123-point route to
Return to Nature; saved focus, supports, manual Poison priorities and allocation
survived reload. Completion consoles had zero errors or warnings. Both screenshots
were visually inspected for a nonblank tree and layout overlap. Profiles were
isolated from user saves and both test sessions were closed. The initial Edge
favicon 404 was unrelated and absent after reload.

Logs are retained under `var/plant-bow-supports-20261109/`. The repeatable browser
script and screenshots are under `output/playwright/plant-bow-supports-20261109/`.
Local preview remains `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

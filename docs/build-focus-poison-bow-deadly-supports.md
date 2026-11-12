# Deadly Poison for Poisonburst Arrow and Gas Arrow

Deadly Poison I/II are reviewed choices for the two existing Poison burst/cloud
focuses: four new pairs, two support choices and one family. These are contextual
support refinements, not a Full DPS integration or recommended gem loadout.

## Modifiers and Boundaries

- Tier I supplies 75% more Poison magnitude and 25% less damage with hits.
  Tier II supplies 100% more Poison magnitude and 30% less damage with hits.
  More magnitude is multiplicative with increased magnitude, not additive.
- Both pairs are natively eligible. The hit penalty reduces actual arrow hits
  and Gas Arrow's separate conditional Fire-explosion hit. Neither support
  grants Poison chance, extra stacks, duration, area, firing rate or cloud growth.
  No added support Mana multiplier is present in the reviewed source.
- Crucially, the native hit-only control also lowers the derived Poison source.
  The no-hit burst/cloud calculation does not discard the hit penalty. Both
  tiers improve Poison in this isolated fixture, but the more-magnitude number
  is not an equivalent Poison-DPS or whole-build gain. Do not multiply an
  optimized route score by 1.75 or 2, or assume the penalty is irrelevant.
- Summaries distinguish the actual arrow/explosion hit penalty from PoB's
  calculation-only Poison-source hit fields. No real cloud/burst hits, critical
  applicability, Poison feeding, growth, overlaps or detonation frequency are
  inferred. Exact equipped-build benefit and live-game timings are not claimed.
- Selection/removal and tier replacement preserve manual priorities, goals,
  budgets and older support families. Add suggestions preserves existing weights.
  No automatic priority changes, fabricated Apply support priorities command,
  new passive scopes, parser/optimizer/point-cost change, CSS or save schema.

## Evidence

The isolated PoB 0.23.1 runtime accepted all four pairs. Four type controls
remove all Attack/Damage/CrossbowAmmoSkill eligibility alternatives and reject
the links. Thirty-one MAIN calculations cover both Poisonburst sets and all
three Gas Arrow sets, plus hit-only, magnitude-only, synthetic combined-modifier,
increased-magnitude and multi-support controls on the Poison components.
Each asserts the selected stat set, equipped Bow and actual applied links.
The empty-tree Witch, level-20 skill and normal Crude Bow isolate effects;
installed PoB and user saves are untouched.

Evidence is under `var/poison-bow-deadly-supports-20261109/`. Frozen independent
fixtures are in `src/tree/poisonBowDeadlySupports.fixtures.ts`; ordinary tests
need no native installation or network.

| Native output | Poisonburst Poison Burst | Gas Arrow Poison Cloud |
| --- | ---: | ---: |
| Baseline Poison/s | 5.385766215481 | 4.0038541776187 |
| Deadly Poison I | 6.8287450883079 | 5.2837747753821 |
| Deadly Poison II | 7.4384544711926 | 5.5922684579199 |
| 25% less hit damage only | 3.9021400504617 | 3.0192998716469 |
| 30% less hit damage only | 3.7192272355963 | 2.79613422896 |
| 75% more Poison magnitude only | 9.4250908770917 | 7.0067448108328 |
| 100% more Poison magnitude only | 10.771532430962 | 8.0077083552375 |

Independent checks reproduce each tier from the hit-only result times its
magnitude factor (1.75/2), and reproduce magnitude-only results from baseline.
Synthetic independent hit+magnitude modifiers exactly reproduce the linked
supports. With 100% increased magnitude plus Tier II, magnitude becomes
`(1 + 1) * 2 = 4`, not 3; Poison output doubles relative to Tier II alone.

Native ailment source code consumes stored pre-resist/armour/penetration
hit min/max values. Hit modifiers therefore affect the source used in these
calculations. Small weapon values round at intermediate stages: do not force
the observed hit or Poison outputs to equal a single final 0.75/0.7 ratio.
This is observed source/native behavior, not a blanket live-game validation.

| Actual hit control | Baseline | Tier I | Tier II |
| --- | ---: | ---: | ---: |
| Poisonburst Arrow / Arrow | 5.38125 | 3.9375 | 3.80625 |
| Gas Arrow / Arrow | 1.8375 | 1.3125 | 1.3125 |
| Gas Arrow / conditional Explosion | 11.025 | 8.4 | 7.875 |

Those Arrow/Explosion stat-set controls have no default Poison output. The
Poison components keep 100% inherent application, one native maximum stack,
3/2-second Poison durations, 3.003/4.026-second displayed skill timers,
24/18 radii, 38/62 Mana cost and 1.2/s deployment unchanged with either tier.
Poison Magnitude multipliers are 1.75/2 for the linked support, not application
chance or a duration increase.

Combined Tier-II Deadly Poison + Prolonged Duration + Rapid Attacks + Efficiency
retains separate meanings: deployment 1.5/s, cost 27/45, outgoing Poison duration
4.05/2 seconds, displayed skill duration 4.059/5.412 seconds. Native Poison
estimates are 8.2621988314247/5.8273875, including PoB's rate/duration-dependent
roll-selection assumptions. No such estimate is applied to passive route scores.

- [Deadly Poison definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1722)
- [Stored hit values for ailments](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L4126)
- [Damaging-ailment source calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L4858)

Upstream links are moving references, not claimed byte-identical to the isolated
snapshot. Full equipped-build performance and no-hit game behavior remain outside
this heuristic's validation boundary.

## Coverage and Next Batch

Support choices increase 38 -> 40/567 (7.1%), positive-tier supports 38 ->
40/450 (8.9%), families 24 -> 25 and reviewed pairs 458 -> 462. Skills stay
103/399, positive-tier skills 98/234 and preferences 184. Confirmed main-tree
wording/occurrence coverage stays 864/2182 and 3444/5451. No source catalog refresh
or baseline reset.

Next proposal: Concentrated Area for both Poison bow focuses, checking native
Poison-source scaling and smaller coverage without treating overlap or extra
applications as guaranteed damage. Fireball's separate held review stays on hold.
Another batch or deployment requires authorization.
The subsequent authorized [Concentrated Area review](build-focus-poison-bow-concentrated-supports.md)
is documented separately; counts above preserve this Deadly Poison checkpoint.

## Verification

The focused check passed 276 tests across seven files. One
`npm run validate:release` passed 2741 tests across 121 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
72742 ms. The existing large-chunk advisory remains non-blocking (main
695.89 kB). No baseline reset, source catalog refresh or route-quality audit.

An isolated Edge production-preview smoke passed all four new combinations,
both hit/source-penalty notes, explicit non-flat-DPS wording, tier replacement,
removal, older utility-family preservation, unchanged manual priorities,
Add suggestions, goal/start/budget preservation and saved-build load/reload.
The completion console had zero errors and warnings. The initial unrelated
favicon 404 was absent after reload. The screenshot was visually checked for
a nonblank tree and readable, non-overlapping controls. User saves were isolated
and the test session was closed. No layout or browser-specific implementation
changed, so the existing Firefox checkpoint was not repeated for this extension.

Logs: `var/poison-bow-deadly-supports-20261109/`. Repeatable smoke script and
screenshot: `output/playwright/poison-bow-deadly-supports-20261109/`.
The preview listener was absent and restarted at
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

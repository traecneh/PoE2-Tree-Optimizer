# Close Combat I/II for Poison Bow Focuses

Reviewed 2026-11-09 against the frozen PoB 0.23.1 runtime/catalog and 0.5.5f tree.
Local only; no commit, push or deployment. These are scoped heuristic support
notes, not a live combat simulator or Full DPS calculation.

## Source and Component Boundaries

- Close Combat I/II support Attacks, not just melee. Both reviewed Bow parents
  pass native compatibility; removing their qualifying types rejects the link.
- I/II grant up to 20%/30% more Attack Damage at one metre or closer, linearly
  falling to zero at 3.5 metres and beyond. Native units are ten per metre.
  Omitted configuration resolves to two metres in this fixture, giving raw
  12%/18%, not an implicit maximum. Both tiers have a 20% Mana multiplier.
- Native same-distance attack/Poison-source scaling is not Poison magnitude.
  Poisonburst's burst and Gas's cloud still do not hit. Initial-arrow hit/linked
  Poison, no-hit source estimates and Gas's conditional Fire explosion are
  separate. Neither contact nor ignition/detonation is supplied by this support.
- Arrow Poison III remains 60% on-hit chance and two-second duration with enemy
  Bleeding off. Inherent burst/cloud Poison, its timing, cloud timer, radius,
  firing speed, stacks and magnitude are unchanged. No snapshotting, movement,
  near-range safety, enemy uptime or guaranteed Poison applications are inferred.
- Close Combat adds no Accuracy. Comparisons use the same distance so native
  Accuracy falloff is not misattributed to the support.

## Longshot Interaction

Longshot begins gaining damage beyond 3.5 metres, reaching its 25%/35% maximum
at seven metres. Its positive range and Close Combat's positive range do not
overlap. At the shared 3.5-metre boundary neither supplies damage. At a single
distance, do not multiply both maximum damage bonuses (for II/II, 1.3 * 1.35).

Both supports may be selected. Their contextual notes both warn about the
non-overlapping damage ranges and persistent Mana multipliers. Switching tiers
keeps the other family; removing either restores the standalone notes. The cost
factors multiply to 1.44 before native rounding, not 1.40, even at 3.5 metres.
Efficiency II offsets cost separately; this is not a sustain calculation.

## Native and Independent Checks

66 isolated MAIN calculations in the unmodified frozen runtime use level-20
skills, normal Crude Bow, empty Witch tree, level 90 and sufficient attributes.
Active skill/stat set, equipped Bow, effective MAIN mode, applied links,
enemy Poisoned/Bleeding false and actual configured distance are asserted.
No installed PoB or saved user builds are changed.

- 46 source rows: baseline/I/II/paired II at default two metres, one metre,
  3.5, 5.25 and seven metres; standalone Longshot II at the last three.
- Four actual-arrow and two conditional Fire-explosion rows at one metre.
- Six Efficiency II source rows, including paired cost; four arrow Poison III
  rows; four independent 18%/30%-more Attack Damage scalar controls.
- Four compatible pairs and four missing-type rejection controls.

| Native estimate at 1m | Poisonburst | Gas |
| --- | ---: | ---: |
| Baseline / I / II Poison per second | 5.385766 / 6.503567 / 6.920201 | 4.003854 / 4.830880 / 5.211574 |
| Physical source ranges, baseline / I / II | 16-25 / 20-30 / 21-32 | 13-20 / 16-24 / 17-26 |
| Mana, baseline / single / pair | 38 / 45 / 54 | 62 / 74 / 89 |
| With Efficiency II, baseline / single / pair | 23 / 27 / 33 | 38 / 45 / 54 |

At two metres I/II estimates are 6.036123/6.269845 for Poisonburst and
4.450185/4.607714 for Gas. Paired II output equals standalone Close Combat II
at one/two metres, baseline at 3.5 metres and standalone Longshot II at
5.25/seven metres, apart from the added Mana cost. Gas's conditional Fire
average hit goes 22.05 -> 28.875 with II at one metre, without granting Poison
or a detonation trigger.

The independent all-row verifier checks same-distance ramp factors and
reproduces Poison support/base ratios from rounded source ranges using
`min + (max - min) * PoisonRollAverage / 100`. It does not multiply hit and
Poison gains twice. Scalar controls reproduce II's source/hit/Poison output
without its Mana multiplier. All-row timing, chance, Accuracy and magnitude
invariants pass. Native rounding is model behavior, not a claim about the
game's rounding or sustained combat DPS.

Evidence: `var/poison-bow-close-combat-20261109/` contains the driver, native JSON,
log and independent verifier. Frozen observations are in
`src/tree/poisonBowCloseCombatSupports.fixtures.ts`; ordinary tests need no
native runtime or network. Native startup missing-node notices are retained;
they do not affect the empty-tree fixture.

- [Generated Close Combat tiers](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1225)
- [Generated Longshot tiers](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2906)
- [Distance ramp interpolation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Classes/ModStore.lua#L577)
- [Distance input units](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua#L1621)

Moving upstream links are not claimed byte-identical to the frozen runtime.

## Implementation and Coverage

I adds one choice to the existing family; II extends its existing choice with
two scoped overrides, preserving all four earlier melee pairs/notes. No duplicate
support identity, new preference, parser, solver, save schema or automatic damage
weight is introduced. Manual priorities, class/goals, budgets and other support
warnings remain intact. Both Poison bow focuses now have 43 reviewed choices.

Pairs 520 -> 524, choices 65 -> 66, families remain 41. Supports are 66/567
(11.6%); positive-tier coverage is 65/450 (14.4%). Malady remains explicitly
catalog-review-only. Skills remain 103/399 (98/234 positive-tier), preferences
184, main-tree wording 864/2182 and occurrences 3444/5451. No catalog refresh
or coverage baseline reset.

## Next Proposed Batch

Historical next proposal: Execute I/II for both focuses. Completed locally in
the [Execute successor review](build-focus-poison-bow-execute.md), including
the conditional native Poison-source observations. Counts above describe this
earlier Close Combat batch, not current coverage. No live push is implied.

## Verification

The independent 66-row native verifier passed. Focused regressions passed 268
tests across three files. One final `npm run validate:release` passed 3086 tests
across 140 files, typecheck, production build, graph validation and coverage
baseline in 58879 ms. No previously covered wording was lost. The existing
nonblocking chunk advisory remains (734.95 kB main chunk).

An isolated Edge production-preview smoke passed both focuses: 43 choices each,
I/II selection/replacement, component/range/Mana notes, reversible warnings on
both selected families, switching Longshot tiers, retained Malady/Poison III
warnings, unchanged manual weights after Add suggestions and retained other
links. The served HTML and JavaScript matched current `dist` bytes. The tree
rendered and the screenshot showed readable, non-overlapping notes; final
console had zero errors/warnings and no page errors were captured. Preview:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. Browser artifacts are under
`output/playwright/poison-bow-close-combat-20261109/`.

This is source/native and local-app verification, not in-game uptime testing
or user visual acceptance. No additional route audits, commit or live push.

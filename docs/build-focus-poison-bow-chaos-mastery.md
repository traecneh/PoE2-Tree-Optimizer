# Chaos Mastery for Poison Bow Focuses

Reviewed 2026-11-09 against frozen PoB 0.23.1 runtime/catalog and 0.5.5f tree.
Local only; no commit, push or deployment. This adds reviewed support context,
not gem-level inputs, Full DPS calculation or automatic route-score multipliers.

## What +1 Means

Chaos Mastery grants one level to a supported Chaos skill. Both reviewed Bow
parents have that type and pass native compatibility. Removing Chaos or adding
SingleLevelSkill rejects the link. Catalog tier five; family Mastery.

It does not add Chaos damage, grant a percentage MORE multiplier or add a level
to every linked support. The active gem's effective level is asserted: level L
with the support becomes L+1, and matches a directly levelled active gem with
otherwise identical links. Gem availability, gear, sockets and every level cap
are not validated by this review.

There is no separate support Mana multiplier, but the higher-level skill's base
Mana cost rises in the reviewed cases. That increase also feeds Poison III and
Efficiency II costs. No free-cost or sustain claim follows from the absent
multiplier.

## Component Differences

- Poisonburst's arrow and no-hit burst source both gain level-scaled damage in
  the frozen model. Burst radius changes too: native 19 -> 20 at level 10/11,
  24 -> 25 at 20/21, 26 -> 27 at 24/25. These are native radius units.
- Gas's whole skill levels up. Its arrow, cloud Poison source and conditional
  Fire-explosion damage all change, not just Chaos damage. The cloud source and
  explosion have their own coefficient overrides, distinct from the arrow.
- Gas's reviewed radius stays 18 and displayed cloud timer stays 4.026 seconds.
  No contacts, ignition, detonation trigger, overlap or uptime are supplied.
- Native attack-derived source estimates do not make burst/cloud components
  hit or establish real Full DPS. Damage changes depend on current gem level,
  coefficient and rounding, not a universal percentage or second Poison bonus.

## Native and Independent Checks

48 MAIN calculations in the unmodified frozen runtime: empty Witch tree,
level-90 character, normal Crude Bow, enough attributes, quality zero, enemy boss
None and fixed two-metre distance. Active/stat set, actual effective level,
equipped Bow, effective MAIN mode and applied links are asserted. Low Life,
Fully Broken Armour, enemy Bleeding and Poisoned are explicitly false.

- 30 component rows: five components at starting levels 10 and 20, each with
  baseline, +1 support and directly levelled control.
- Six separate arrow Poison III rows and six Efficiency II source rows at
  starting level 20, with baseline, +1 and matching direct-level controls.
- Six source rows at starting level 24, same three variants for both focuses.
- Two compatible parents and missing-Chaos/single-level rejection controls.

All 16 supported rows match their directly levelled controls exactly for the
captured damage, costs, timing and chance outputs. The independent verifier also
rebuilds rounded source ranges from the normal Bow's 6-9 Physical damage and
generated level coefficients, rather than just comparing two PoB outputs.

| Level 20 -> 21 component | Coefficient | Rounded source range | Native average hit |
| --- | --- | --- | --- |
| Poisonburst arrow/burst source | 2.74 -> 2.88 | 16-25 -> 17-26 | 5.38125 -> 5.64375 |
| Gas arrow | 0.94 -> 0.98 | 6-8 -> 6-9 | 1.8375 -> 1.96875 |
| Gas cloud source | 2.18 -> 2.29 | 13-20 -> 14-21 | 4.33125 -> 4.59375 |
| Gas conditional Fire explosion | 2.81 -> 2.95 | Fire 17-25 -> 18-27 | 22.05 -> 23.625 |

The synthetic source rows are not actual burst/cloud hits. Poisonburst source
Poison/s is 5.385766 -> 5.619488, Gas 4.003854 -> 4.227020. At level 10/11 it
is 3.251783 -> 3.485505 / 2.415440 -> 2.572969; at 24/25 it is 6.503567 ->
6.920201 / 4.830880 -> 5.054045. Different gains and rounded ranges preclude a
single percent score. Native MORE factor stays one and added Chaos ranges zero.

| Mana, baseline -> supported | Poisonburst | Gas |
| --- | ---: | ---: |
| Active gem level 10 -> 11 | 16 -> 18 | 26 -> 29 |
| Active gem level 20 -> 21 | 38 -> 41 | 62 -> 67 |
| Active gem level 24 -> 25 | 52 -> 55 | 84 -> 90 |
| With Poison III, level 20 -> 21 | 45 -> 49 | 74 -> 80 |
| With Efficiency II, level 20 -> 21 | 23 -> 25 | 38 -> 41 |

Poison III multiplies the higher base cost by 1.2 before native floor rounding;
Efficiency II applies its separate 40% reduction/rounding. No Chaos Mastery
percentage cost multiplier is present. The native rounding is model behavior,
not a claim that the game rounds identically.

Poison magnitude stays one; inherent chance 100%, maximum stacks one, duration
three/two seconds, firing speed 1.2 and skill timers 3.003/4.026 seconds remain
unchanged in tested contexts. Separate arrow Poison III stays 60% chance and
two-second duration with Bleeding off. Its native Poison/s is 4.565772 ->
4.780013 for Poisonburst and 1.538314 -> 1.664751 for Gas at level 20/21.
Accuracy, hit/critical chance, source roll averages, potential and zero cull
percent are unchanged within context.

The independent verifier reproduces hit ratios from rounded ranges and Poison
ratios with `min + (max - min) * PoisonRollAverage / 100`, counting level-scaled
source once. Poisonburst radius is separately checked against its generated
stat-set level value. No runtime patches, new damage rules or game-client tests.

Evidence: `var/poison-bow-chaos-mastery-20261109/` contains driver, native JSON,
generated level facts, independent verifier and log. Startup missing-node notices
are retained and do not affect this empty-tree fixture. Independent regression
facts: `src/tree/poisonBowChaosMasterySupport.fixtures.ts`. Ordinary tests need no
native runtime/network. Installed PoB and user builds are untouched.

- [Generated Chaos Mastery](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1771)
- [Poisonburst levels/components](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L5717)
- [Gas levels/components](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L2856)

Moving upstream links are not claimed byte-identical to the frozen runtime.

## Implementation and Coverage

One unique choice/two reviewed pairs, restricted to the Poison bow focuses.
The existing Mastery-family normalization is used; no other Mastery support is
silently admitted. Manual priorities, class/goals, budgets, scopes and route
scores are unchanged. Previous Malady/Blindside, range and Exploit Weakness/
Corrosion warnings survive selection/removal and saved-build/export round trips.
No preference/parser, optimizer, save schema or extra controls added.

Choices 70 -> 71; pairs 532 -> 534; families 43 -> 44. Each Poison focus has
48 choices. Raw support coverage 71/567 (12.5%); positive-tier 70/450 (15.6%).
Skills 103/399 (98/234 positive-tier), preferences 184, wording 864/2182 and
occurrences 3444/5451 are unchanged. Malady remains catalog-review-only. No
catalog refresh, baseline reset or routing audits.

## Next Proposed Batch

Historical next proposal: Chaos Attunement for both focuses. Completed locally in
the [Chaos Attunement successor review](build-focus-poison-bow-chaos-attunement.md),
including separate gain/penalty controls, mixed Poison sources and costs. Counts
above describe this earlier Chaos Mastery batch, not current coverage. No live push implied.

## App Verification

The independent 48-row native verifier and focused regressions (277 tests,
three files) passed. One `npm run validate:release` passed 3159 tests across
144 files, typecheck, production build, graph validation and coverage baseline
in 63239 ms, with no previously covered wording lost. The existing nonblocking
main-chunk advisory remains (744.36 kB).

An isolated Edge production-preview smoke passed both focuses with 48 choices:
+1-level/component/cost notes, Poisonburst radius versus Gas cloud/Fire boundaries,
selection/removal, retained earlier warnings/links and unchanged manual priorities
after Add suggestions. The served HTML and JavaScript matched current `dist`
bytes. The tree rendered, and the screenshot showed readable notes without
overlap. No page errors were captured. The initial preview-only `favicon.ico`
request returned 404; after reload the final console had zero errors/warnings.
Artifacts: `output/playwright/poison-bow-chaos-mastery-20261109/`. Preview:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

These are source/native and local-app checks, not in-game level/Poison testing,
user visual acceptance or deployment. Nothing committed or pushed.

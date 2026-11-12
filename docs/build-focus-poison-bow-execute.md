# Execute I/II for Poison Bow Focuses

Reviewed 2026-11-09 against the frozen PoB 0.23.1 runtime/catalog and 0.5.5f tree.
Local only; no commit, push or deployment. These choices supply scoped context,
not a Full DPS calculation, simulation of enemy Life, or unconditional weights.

## Reviewed Rules

- Execute I/II have 40%/50% more damage with Hits against enemies on Low Life.
  The generated modifier is Hit-flagged with an enemy `LowLife` actor condition.
  Both parents pass native compatibility; removing qualifying parent types
  rejects the links. Parent compatibility does not prove each component hits.
- Outside enemy Low Life the fixture gains no damage. Player Low Life alone
  does not activate these two tiers. No numerical low-life threshold or uptime
  is invented; this is not Culling Strike or an automatic killing threshold.
- Both cost 10% more Mana even when the damage condition is false. Efficiency II
  reduces cost separately, not by granting sustained firing or applications.
- Actual arrow hits and Gas's conditional Fire-explosion hit are separate from
  Poisonburst's no-hit burst and Gas's no-hit cloud. Execute supplies neither
  ignition/detonation nor Poison chance, duration, stacks or magnitude.

## Important Native Source Distinction

The frozen PoB runtime increases its attack-derived Poison-source estimates
under enemy Low Life as well as its displayed hits. Its offence calculation
stores damage before enemy mitigation and uses stored eligible damage for
ailment source ranges. The Hit flag must not be interpreted as proof that the
runtime leaves all Poison estimates unchanged.

That native observation is **not** a second 40%/50% Poison-magnitude multiplier,
proof that no-hit burst/cloud components now hit, or an independently verified
in-game interaction at a particular enemy Life boundary. No snapshots, duration
spent on Low Life, delayed gas contact or application uptime are simulated.
The site clearly labels the native source estimate and does not convert it
into an unconditional passive preference or route-score multiplier.

## Native and Independent Verification

53 isolated MAIN calculations in the unmodified frozen runtime: empty Witch
tree, character level 90, level-20 skills, normal Crude Bow, sufficient
attributes, enemy boss None, fixed two-metre distance. Active/stat set, equipped
Bow, effective MAIN mode, applied support links and actual enemy/player
conditions are asserted. Enemy Bleeding and Poisoned are explicitly false.

- 30 component rows: baseline/I/II, enemy Low Life false/true, across both arrows,
  both Poison-source components and Gas's conditional Fire explosion.
- 12 arrow Poison III rows under both enemy states, all three link variants.
- Six source rows with Efficiency II under enemy Low Life, baseline/I/II.
- Three independent 50%-more-Damage-with-Hits controls for both arrows and Gas's
  Fire explosion; they reproduce II's hit outputs without its Mana multiplier.
- Two player-only Low Life controls with II, enemy Low Life false.
- Four compatible pairs and four missing-type rejection controls.

| Conditional native estimate | Baseline / I / II |
| --- | ---: |
| Poisonburst burst-source Poison/s | 5.385766 / 7.570558 / 8.038002 |
| Gas cloud-source Poison/s | 4.003854 / 5.434740 / 5.881071 |
| Poisonburst arrow average hit | 5.38125 / 7.6125 / 8.1375 |
| Gas arrow average hit | 1.8375 / 2.625 / 2.75625 |
| Gas conditional Fire-explosion average hit | 22.05 / 30.975 / 33.6 |

Outside enemy Low Life every damage value equals its corresponding baseline,
while costs still rise. Native rounded source ranges are 16-25 -> 23-35/25-37
for Poisonburst, 13-20 -> 18-27/20-29 for Gas's cloud source, 6-8 -> 8-12/8-13
for Gas's arrow, and Fire 17-25 -> 24-35/26-38 for Gas's explosion.

| Native cost / invariant | Poisonburst | Gas |
| --- | ---: | ---: |
| Mana baseline -> I or II, either enemy state | 38 -> 41 | 62 -> 68 |
| With Poison III, Mana baseline -> I or II | 45 -> 50 | 74 -> 81 |
| With Efficiency II, Mana baseline -> I or II | 23 -> 25 | 38 -> 41 |
| Inherent Poison / displayed skill duration | 3 / 3.003 seconds | 2 / 4.026 seconds |
| Radius / firing speed / maximum Poison stacks | 24 / 1.2 / 1 | 18 / 1.2 / 1 |

Inherent Poison chance remains 100%, magnitude one. Separate arrow Poison III
stays 60% chance, two seconds, magnitude one with Bleeding false. At Low Life,
its native Poison/s goes 4.565772 -> 6.444763/6.873244 for Poisonburst and
1.538314 -> 2.219668/2.346105 for Gas. Gas's Fire explosion supplies no Poison.
Accuracy, hit/critical chance, timers, roll average, potential and zero cull
percent remain unchanged within each component/link context.

The all-row verifier independently reproduces hit ratios from rounded ranges
and Poison ratios with `min + (max - min) * PoisonRollAverage / 100`, counting
source scaling once, not multiplying hit gain by an extra Poison gain. Mana
multipliers combine before floor rounding; Efficiency II then uses its separate
cost reduction/rounding. Native rounding is not a claim about game rounding.

Evidence: `var/poison-bow-execute-20261109/` contains driver, native JSON,
independent verifier and logs. The first driver failed on a nonexistent
`skill.skillFlags` field; the corrected driver removes that unused field without
patching PoB. Initial log is retained. Startup missing-node notices are retained
and do not affect the empty-tree fixture. No installed PoB/user builds changed.
Frozen independent facts are in `src/tree/poisonBowExecuteSupports.fixtures.ts`;
ordinary regression tests need no PoB or network.

- [Generated Execute I/II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3137)
- [Enemy Low Life config](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua#L1666)
- [Stored damage before mitigation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L4088)
- [Ailment source ranges](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L4884)

Moving upstream references are not claimed byte-identical to the frozen runtime.

## Implementation and Coverage

Two unique choices restricted to these two reviewed focuses. Both use their own
tier values, share the Execute family and replace one another normally. No new
controls, parser, scoring rule, automatic priorities, save schema or solver
changes. Existing manual weights, class/goals, budgets, Malady/Blindside warnings
and the Close Combat/Longshot pairing remain intact.

Pairs 524 -> 528, choices 66 -> 68, families 41 -> 42. Each Poison focus has
45 choices. Supports 68/567 (12.0%); positive-tier supports 67/450 (14.9%). Malady
stays catalog-review-only. Skills 103/399 (98/234 positive-tier), preferences 184,
main-tree wording 864/2182 and occurrences 3444/5451 remain unchanged. No catalog
refresh, baseline reset or new routing audits.

## Next Proposed Batch

Historical next proposal: Execute III for both focuses. Completed locally in
the [Execute III successor review](build-focus-poison-bow-execute-iii.md),
including all four condition states. Counts above describe this earlier I/II
batch, not current coverage. No live push is implied.

## App Verification

The independent 53-row native verifier passed. Focused regressions passed 267
tests across three files. One `npm run validate:release` passed 3102 tests across
141 files, typecheck, production build, graph validation and coverage baseline
in 63160 ms. No previously covered wording was lost. The existing nonblocking
chunk advisory remains (737.29 kB main chunk).

An isolated Edge production-preview smoke passed both focuses with 45 choices
each: tier selection/replacement/removal, enemy-versus-player condition notes,
hit/source/Mana boundaries, retained Malady/Poison III and Close Combat/Longshot
warnings, retained other links and unchanged manual weights after Add suggestions.
Execute III was absent as intended. The served HTML and JavaScript matched
current `dist` bytes, the tree rendered, and the screenshot showed readable notes
without overlap. No page errors were captured. The initial preview-only
`favicon.ico` request returned 404; after reload the final console had zero
errors/warnings. Browser artifacts: `output/playwright/poison-bow-execute-20261109/`.
Preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

This is source/native and local-app verification, not in-game low-life/Poison
testing, live deployment or user visual acceptance. Nothing committed or pushed.

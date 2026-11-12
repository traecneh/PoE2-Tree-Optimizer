# Execute III for Poison Bow Focuses

Reviewed 2026-11-09 against the frozen PoB 0.23.1 runtime/catalog and 0.5.5f tree.
Local only; no commit, push or deployment. This is scoped heuristic context,
not a life-state simulator, Full DPS ranking or recommendation to lower Life.

## Separate Conditions and Costs

Execute III has two Hit-flagged MORE modifiers: 30% against enemies on Low Life
(`ActorCondition` on the enemy), and 30% while the player is on Low Life
(`Condition` on the player). Parent support compatibility passes for both Bow
skills; removing qualifying types rejects both. It is catalog tier five.

| Enemy Low Life | Player Low Life | Native hit modifier | Mana modifier |
| --- | --- | ---: | ---: |
| No | No | 1.00 | 1.10 |
| Yes | No | 1.30 | 1.10 |
| No | Yes | 1.30 | 1.10 |
| Yes | Yes | 1.69 | 1.10 |

The two damage modifiers multiply: 1.3 * 1.3 = 1.69, not 1.60, 1.90 or a third
application. Both active conditions still consume only one support gem and one
10% Mana multiplier. The higher cost persists when neither condition is true.
Execute I/II remain enemy-only; player-only native controls leave their damage
unchanged. III is not always better than II's enemy-only 50% bonus.

No numerical low-life threshold or uptime is invented. The site does not ask
the optimizer to lower Life, assume reservations, or assign defensive value to
being on Low Life. Execute does not grant Culling Strike.

## Component and Poison Boundaries

Actual arrow hits and Gas's conditional Fire-explosion hit remain separate from
Poisonburst's no-hit burst and Gas's no-hit cloud. No ignition, detonation,
Poison application, contact, snapshotting or condition uptime is supplied.

As in the I/II review, the frozen PoB runtime also changes attack-derived
Poison-source estimates under its configured conditions. Those estimates are
not a direct Poison-magnitude modifier, a second multiplication of hit and
Poison gains, proof of actual burst/cloud hits, or independently verified game
behavior at life-state transitions. Notes explicitly identify this native source
behavior. No automatic weights or route scores are changed.

## Bounded Native and Independent Checks

71 MAIN calculations in the unmodified frozen runtime: empty Witch tree,
character level 90, level-20 skills, normal Crude Bow and sufficient attributes,
enemy boss None and fixed two-metre distance. Actual active skill/stat set,
equipped Bow, effective MAIN mode, applied links and both Life-state flags are
asserted. Enemy Poisoned and Bleeding are false throughout.

- 40 component rows: five components, all four condition states, baseline/III.
- 16 separate arrow Poison III rows: both skills, all states, baseline/III.
- Eight Efficiency II source rows: both skills, neither/both states, baseline/III.
- Three independent 69%-more-Damage-with-Hits scalar controls, both arrows and
  Gas's Fire explosion. They reproduce III's both-state hits without its cost.
- Four earlier-tier player-only controls, I/II on both arrows.
- Two compatible pairs and two missing-type rejection controls.

| Native estimate | Neither | Either alone | Both |
| --- | ---: | ---: | ---: |
| Poisonburst burst-source Poison/s | 5.385766 | 6.920201 | 9.104993 |
| Gas cloud-source Poison/s | 4.003854 | 5.211574 | 6.642460 |
| Poisonburst arrow average hit | 5.38125 | 6.95625 | 9.1875 |
| Gas arrow average hit | 1.8375 | 2.3625 | 3.15 |
| Gas conditional Fire-explosion average hit | 22.05 | 28.875 | 37.275 |

Enemy-only and player-only outputs match each other. All unlinked baselines
match across Life states. Rounded source ranges are baseline/single/both:
Poisonburst 16-25 / 21-32 / 28-42; Gas cloud source 13-20 / 17-26 / 22-33;
Gas arrow 6-8 / 7-11 / 10-14; Gas Fire explosion 17-25 / 22-33 / 29-42.

In all four states Mana is 38 -> 41 for Poisonburst and 62 -> 68 for Gas.
With separate Poison III, Mana is 45 -> 50 / 74 -> 81. With Efficiency II,
neither/both-state costs are 23 -> 25 / 38 -> 41. Multipliers combine before
native floor rounding; Efficiency II then applies its separate reduction and
rounding. No sustain is inferred.

Magnitude stays one, inherent chance 100%, duration three/two seconds, firing
speed 1.2 and stacks one. Displayed skill timers remain 3.003/4.026 seconds,
radii 24/18. Arrow Poison III remains 60% chance/two seconds with enemy
Bleeding false. Its neither/single/both Poison/s estimates are
4.565772/5.889846/7.768837 for Poisonburst and 1.538314/2.005428/2.648148 for
Gas. Gas's Fire explosion supplies no Poison. Accuracy, hit/critical chance,
roll averages, potential and zero cull percent stay unchanged within context.

The independent all-row verifier checks condition factors and single cost,
reproduces hit ratios from rounded source ranges and Poison ratios using
`min + (max - min) * PoisonRollAverage / 100`, and checks all invariants. It
does not multiply source scaling twice or force displayed outputs to exact
1.30/1.69 ratios despite rounding. Native rounding is not a game-rounding claim.

Evidence: `var/poison-bow-execute-iii-20261109/` contains driver, native JSON,
independent verifier and logs. Startup missing-node notices are retained and do
not affect this empty-tree fixture. Installed PoB/user builds are untouched.
Independent regression facts: `src/tree/poisonBowExecuteThreeSupport.fixtures.ts`.
Ordinary tests require no PoB or network.

- [Generated Execute III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3207)
- [Player condition config](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua#L139)
- [Enemy condition config](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua#L1666)
- [Ailment source ranges](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L4884)

Moving upstream links are not claimed byte-identical to the frozen runtime.

## Implementation and Coverage

One unique choice/two reviewed pairs, sharing the existing Execute family.
Selecting I/II/III replaces the other tier; removal, disabled controls and saved
build/export round trips use existing behavior. I/II notes remain enemy-only.
Manual priorities, budgets, class/goals, other links and existing Malady,
Blindside and Close Combat/Longshot warnings are preserved. No parser, solver,
preference category or save schema change.

Choices 68 -> 69; pairs 528 -> 530; families remain 42. Each Poison focus now
has 46 choices. Raw support coverage 69/567 (12.2%); positive-tier 68/450
(15.1%). Skills 103/399 (98/234 positive-tier), preferences 184, main-tree
wording 864/2182 and occurrences 3444/5451 are unchanged. Malady remains
catalog-review-only. No catalog refresh, baseline reset or routing audits.

## Next Proposed Batch

Historical next proposal: Exploit Weakness for both focuses. Completed locally
in the [Exploit Weakness successor review](build-focus-poison-bow-exploit-weakness.md),
including partial/full armour states and Corrosion incompatibility. Counts above
describe this earlier Execute III batch, not current coverage. No live push implied.

## App Verification

The independent 71-row native verifier and focused regressions (285 tests,
four files) passed. One `npm run validate:release` passed 3120 tests across
142 files, typecheck, production build, graph validation and coverage baseline
in 62354 ms. No previously covered wording was lost. The existing nonblocking
main-chunk advisory remains (739.67 kB).

An isolated Edge production-preview smoke passed both focuses with 46 choices
each: separate/combined condition notes, single Mana multiplier, native source
boundaries, I/II/III family replacement/removal, preserved earlier-tier enemy-only
notes, previous Malady and range warnings, other links and manual priorities
after Add suggestions. The served HTML and JavaScript matched current `dist`
bytes. The tree rendered and the screenshot showed readable notes without
overlap. No page errors were captured. The initial preview-only `favicon.ico`
request returned 404; after reload the final console had zero errors/warnings.
Artifacts: `output/playwright/poison-bow-execute-iii-20261109/`. Preview:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

This is source/native and local-app verification, not in-game Life-state or
Poison testing, user visual acceptance or deployment. Nothing committed/pushed.

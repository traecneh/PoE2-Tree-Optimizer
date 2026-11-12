# Chaos Attunement for Poison Bow Focuses

Reviewed 2026-11-09 against frozen PoB 0.23.1 runtime/catalog and 0.5.5f tree.
Local only; no commit, push or deployment. This is scoped context and warnings,
not a universal support recommendation or Full DPS calculation.

## Source and Component Rules

Chaos Attunement gains 25% of Damage as Extra Chaos, but separately applies 50%
less Physical, Fire, Cold and Lightning Damage. Chaos has no corresponding LESS
modifier. It costs 20% more Mana. Both Bow parents pass native compatibility;
removing qualifying damage/attack types rejects them. The Chaos tag itself is
not required. Catalog tier three, family ChaosAttunement.

This is gained damage, not conversion, 25% more Poison magnitude or an additive
25-minus-50 calculation on displayed DPS. Gained Chaos is calculated separately
from the reduced non-Chaos parts. Gas's converted Fire goes through its native
rounding stage; gaining Chaos is not applied once for Physical and again for
the converted Fire.

The original Physical-only preset warning becomes inaccurate for a source that
now has gained Chaos. Selected support context replaces only its Chaos Damage
caution: the added portion can scale with Chaos Damage, but this is not all
Poison damage or the remaining Physical portion. Manual priorities are retained;
no Chaos Damage suggestion, score multiplier or automatic priority is added.
Removing the support restores the original caution. Other exclusions/scopes
are unchanged.

## Bounded Native Checks

58 MAIN calculations use the unmodified frozen runtime, empty Witch tree,
level-90 character, normal Crude Bow, sufficient attributes, quality zero,
boss None and two-metre distance. Actual skill/stat set, effective gem level,
equipped Bow, effective MAIN mode and applied links are asserted. Low Life,
Fully Broken Armour, enemy Bleeding and Poisoned are explicitly off.

- 25 level-20 component rows: five components with baseline/support and separate
  gain-only, penalty-only and combined scalar controls.
- Ten level-10 baseline/support component rows.
- Six separate arrow Poison III and six Efficiency II source rows, with
  baseline/support/combined-scalar variants.
- Four Chaos Mastery source rows at effective level 21, baseline/support.
- Four 100%-increased-Chaos-Damage source probes, baseline/support.
- Three conditional Gas explosion Poison III rows: baseline/support/scalar.
- Two compatible parents, missing-type and removed-Chaos-tag controls.

All ten combined scalar controls match the actual support's captured damage and
non-cost outputs without its Mana multiplier. Parsed gain and per-type LESS
modifiers are asserted, not assumed from custom text. The independent verifier
rebuilds Physical/Fire/Chaos ranges from normal Bow 6-9 damage, component
coefficients and separate modifiers, including the converted-Fire rounding
stage. No runtime patches, user build changes or in-game tests.

| Level-20 component | Physical range before/after | Fire before/after | Added Chaos | Native hit average before/after |
| --- | --- | --- | --- | --- |
| Poisonburst arrow/burst source | 16-25 / 8-12 | none | 4-6 | 5.38125 / 7.875 |
| Gas arrow | 6-8 / 3-4 | none | 1-2 | 1.8375 / 2.49375 |
| Gas cloud source | 13-20 / 7-10 | none | 3-5 | 4.33125 / 6.43125 |
| Gas conditional explosion | none | 17-25 / 9-13 | 4-6 | 22.05 / 16.8 |

Synthetic burst/cloud hit fields are not actual hits. A stronger arrow hit here
does not establish stronger Poison: damage channels face different mitigation.
For Poison, independently sum eligible Physical **plus Chaos** ranges, then use
`min + (max - min) * PoisonRollAverage / 100`. Do not include Fire or multiply
the total-hit gain into Poison a second time.

| Native source Poison/s | Baseline | Gain only | Penalty only | Actual support |
| --- | ---: | ---: | ---: | ---: |
| Poisonburst | 5.385766 | 6.686480 | 2.601427 | 3.902140 |
| Gas cloud | 4.003854 | 4.988408 | 2.034746 | 3.019300 |

With the level-10 gems, Poisonburst is 3.251783 -> 2.601427 and Gas
2.415440 -> 1.811580. These negative results belong to this Physical-bow fixture,
not every build. Native hit and Poison ratios are independently checked against
their separate ranges; no fixed percentage increase/decrease is assigned.

The 100% Chaos Damage control leaves the original Physical-only source unchanged,
but improves the new mixed source. Resulting support Poison/s is 5.202853 for
Poisonburst and 4.069491 for Gas. Rounding matters: Gas's added Chaos 3-5 becomes
7-10, not simply twice the already-rounded range. Source composition and gear
can change the trade-off, so neither blanket upgrade nor universal rejection
is justified.

## Gas Explosion and Separate Poison Chance

Chaos Attunement alone still supplies no Poison chance or detonation trigger.
With separately linked Poison III, the gained Chaos becomes an eligible native
on-hit Poison source: 60% chance, two-second duration and 1.109834 Poison/s.
The original all-Fire explosion with that chance link has no eligible source
and no Poison DPS. Fire 9-13 is **not** counted toward this new Poison; only
Chaos 4-6 is. No real explosion uptime or application is assumed.

The cloud remains no-hit and inherently poisons. Its lifetime is separate from
outgoing Poison duration. Native magnitude stays one, inherent chance 100%,
maximum stacks one and firing speed 1.2. Timers remain 3.003/4.026 seconds,
outgoing duration three/two seconds, radii 24/18. Accuracy, hit/critical chance,
source rolls, potential and zero cull percent stay unchanged within context.

## Costs and Chaos Mastery

| Native level-20 Mana before/after | Poisonburst | Gas |
| --- | ---: | ---: |
| No other link | 38 -> 45 | 62 -> 74 |
| With Poison III | 45 -> 54 | 74 -> 89 |
| With Efficiency II | 23 -> 27 | 38 -> 45 |
| With Chaos Mastery, effective level 21 | 41 -> 49 | 67 -> 80 |

Multipliers combine before native floor rounding; Efficiency II then applies
its separate reduction/rounding. This is not guaranteed sustain or the game's
rounding specification.

With Chaos Mastery, native Poison/s is 5.619488 -> 4.135862 for Poisonburst
and 4.227020 -> 3.019300 for Gas. Gas's support result equals its level-20
support result because the rounded mixed source remains unchanged, not because
the level bonus failed to apply. No guaranteed percentage gain from combining
these supports is inferred.

Evidence: `var/poison-bow-chaos-attunement-20261109/` contains driver, native JSON,
independent verifier and log. Startup missing-node notices are retained and do
not affect this empty-tree fixture. Independent regression facts:
`src/tree/poisonBowChaosAttunementSupport.fixtures.ts`. Ordinary tests need no
PoB/network; installed PoB and user builds remain untouched.

- [Generated Chaos Attunement](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L1731)
- [Gain-as-Chaos mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L1143)

Moving upstream links are not claimed byte-identical to the frozen runtime.

## Implementation and Coverage

One unique choice/two reviewed pairs restricted to the Poison bow focuses.
Existing family deduplication, normalization, selection/removal and saved-export
round trips are reused. Prior Malady/Blindside, range and Exploit Weakness/
Corrosion warnings survive. The changed Chaos Damage caution is reversible;
current weights, other suggestions, scopes and routing scores are unchanged.
No parser, optimizer, preference category, schema or new controls.

Choices 71 -> 72; pairs 534 -> 536; families 44 -> 45. Each Poison focus has
49 choices. Raw support coverage 72/567 (12.7%); positive-tier 71/450 (15.8%).
Skills 103/399 (98/234 positive-tier), preferences 184, wording 864/2182 and
occurrences 3444/5451 are unchanged. Malady remains catalog-review-only. No
catalog refresh, baseline reset or routing audits.

## Next Proposed Batch

The subsequent [Withering Touch review](build-focus-poison-bow-withering-touch.md)
checks actual Chaos-hit application, ailment-threshold requirements, its damage
penalty and explicit Wither scenarios without assuming maximum stacks or uptime.

## App Verification

The independent 58-row native verifier and focused regressions (286 tests,
four files) passed. Release validation passed, then passed again after a
wording-only clarification and regression assertion: 3,174 tests in 145 files,
typecheck, production build, graph validation and coverage baseline (67.914
seconds for the final run). The existing large-chunk advisory remains nonblocking.

The local production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`
matches the final built bytes. Edge smoke checks passed both 49-choice lists,
gain/penalty/Poison/cost notes, reversible mixed-source caution, unchanged manual
weights and retention of earlier support warnings. Final screenshot inspection
shows a rendered tree and readable notes without overlap. After reload the
console had zero errors/warnings and there were no page errors. Initial launch
had only the existing preview `/favicon.ico` 404, recorded separately.

Evidence: `output/playwright/poison-bow-chaos-attunement-20261109/` contains the
smoke driver and final screenshot. These are local source/native/runtime checks,
not an in-game test or user acceptance. Nothing committed, pushed or deployed.

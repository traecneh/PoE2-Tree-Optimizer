# Admixture for Poison Bow Focuses

Admixture is reviewed for Poisonburst Arrow's Poison burst and Gas Arrow's
Poison cloud: one choice, one family and two reviewed pairs. It supplies
context-only notes, not automatic conditional scores or a Full DPS calculation.

## Behavior and Boundaries

- 20% more Poison magnitude against a Bleeding enemy. The isolated PoB runtime
  applies this modifier to inherent no-hit burst/cloud Poison as well as
  eligible on-hit Poison. It does not supply Bleeding or assume its uptime.
- 20% more Bleeding magnitude from supported hits against a Poisoned enemy.
  This needs an eligible hit and a separate source of Bleeding chance; it does
  not make the no-hit burst/cloud hit or apply Bleeding. The initial arrows
  remain separate components. Poisoned alone does not activate the Poison bonus,
  and Bleeding alone does not activate the Bleeding bonus.
- Admixture grants neither ailment chance. Combining it with Poison III grants
  III's 60% on-hit Poison chance, not Bleeding chance or automatic condition
  supply. There is no inferred reciprocal application or self-sustaining loop.
- With Bleeding explicitly configured, native Admixture plus Poison III yields
  `1.2 * 1.2 = 1.44` Poison magnitude, not 1.4. Without that condition, both
  supports leave inherent Poison output unchanged. The reverse Bleeding bonus
  remains 1.2 when Poisoned is configured; Poison III adds no Bleeding multiplier.
  These scoped native observations are not verified whole-build/game DPS.
- Gas Arrow's Fire explosion is outside the cloud focus. Chance and magnitude
  fields alone do not establish eligible Poison/Bleeding damage. The reviewed
  Fire fixture has neither ailment's damage even with externally supplied
  Bleeding chance and both enemy conditions. Special damage eligibility and
  extra damage sources are not inferred.
- Hit damage, firing rate, area, stack capacity, linked Poison duration and
  cloud lifetime remain unchanged with Admixture alone. A 20-point Mana
  multiplier increases cost; total Mana sustain is not modeled.
- Admixture is a separate family from Poison. Tier replacement, removal,
  manual priorities, suggestions, goals, starts, budgets and existing support
  families remain intact. No new scopes, parser, optimizer, save schema or CSS
  changes; Shortest mode is unchanged. Other skill pairs are not auto-admitted.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime performed 45 MAIN calculations covering all
five parent components, both actual enemy-condition flags, Poison III, the
pair, separate 40%-more and 44%-more Poison controls, Efficiency II and actual
initial-arrow Bleeding with externally supplied 100% chance. Both links pass
native compatibility; four negative controls remove accepted parent types or
add the excluded DegenOnlySpellDamage type. Every calculation asserts the
requested active/stat set, equipped Bow, applied supports and both condition
flags. No-hit component display fields are not used as evidence of Bleeding hits.

Fixture: empty-tree Witch, level-20 skills, normal Crude Bow and sufficient
attributes. Installed PoB and user builds remain untouched. Evidence:
`var/poison-bow-admixture-20261109/`. Frozen independent observations:
`src/tree/poisonBowAdmixtureSupport.fixtures.ts`. Ordinary regressions need no
native PoB installation or network. Native estimates are not in-game testing.

| Native inherent-Poison output | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Baseline / Admixture without Bleeding, Poison per second | 5.385766215481 | 4.0038541776187 |
| Admixture with Bleeding, Poison per second | 6.4629194585772 | 4.8046250131425 |
| Admixture with Poisoned only, Poison per second | 5.385766215481 | 4.0038541776187 |
| Admixture + III without conditions, Poison per second | 5.385766215481 | 4.0038541776187 |
| Admixture + III with Bleeding, Poison per second | 7.7555033502926 | 5.765550015771 |
| Independent 40%-more control, Poison per second | 7.5400727016733 | 5.6053958486662 |
| Independent 44%-more control, Poison per second | 7.7555033502926 | 5.765550015771 |
| Baseline -> Admixture -> Admixture + III Mana | 38 -> 45 -> 54 | 62 -> 74 -> 89 |
| Admixture + III + Efficiency II Mana | 33 | 54 |
| Unchanged outgoing Poison duration | 3 s | 2 s |
| Unchanged displayed skill duration | 3.003 s | 4.026 s |

With both conditions configured, Poison output equals the Bleeding-only case;
Poisoned does not add another Poison multiplier. Raw inherent Poison chance
stays 100 with Admixture, or 160 capped at 100 with III. Raw arrow Poison and
Bleeding chance remain zero with Admixture alone; III adds 60 Poison chance.

For the actual initial arrows, with separate external 100% Bleeding chance:

| Native Bleeding output | Poisonburst arrow | Gas arrow |
| --- | ---: | ---: |
| Baseline / Admixture without Poisoned, Bleeding per second | 4.4994588462054 | 1.4636793837054 |
| Admixture with Poisoned, Bleeding per second | 5.3993506154464 | 1.7564152604464 |
| Admixture + III with both conditions, Bleeding per second | 5.3993506154464 | 1.7564152604464 |
| Unchanged Bleeding duration | 5 s | 5 s |
| Unchanged arrow-hit damage | 5.38125 | 1.8375 |

Independent arithmetic checks confirm Poison `base * 1.2 * 1.2`, Bleeding
`base * 1.2`, pair cost `floor(baseCost * 1.2 * 1.2)` and Efficiency II
`ceil(pairCost * .6)`. Contact frequency, ailment uptime, enemy configuration
and the source of external Bleeding remain explicit assumptions, not app inputs.

- [Admixture source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L76)
- [Poison III source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3906)

Moving upstream references are not claimed byte-identical to the frozen runtime.

## Coverage and Next Batch

Reviewed pairs 478 -> 480; support choices 46 -> 47; families 29 -> 30.
Skills remain 103/399 (98/234 positive-tier). Supports are 47/567 (8.3%), or
47/450 positive-tier (10.4%). Preferences remain 184, main-tree wording
864/2182 and occurrences 3444/5451. No catalog refresh or baseline reset.

The proposed successor, Bleed I/II/III, was subsequently reviewed for both
focuses. See [its checkpoint](build-focus-poison-bow-bleed-supports.md) for
arrow-hit application, synthetic-source boundaries and the next proposed batch.
The figures and verification below remain this batch's historical checkpoint.

## Verification

Focused regressions passed 364 tests across twelve files. One
`npm run validate:release` passed 2838 tests across 127 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
66622 ms. The existing large-chunk advisory remains non-blocking (main
706.08 kB). No catalog refresh, baseline reset or route-quality audit.

An isolated Edge production-preview check passed both pairs, reciprocal
condition and Poison III notes, family replacement, removal, other links,
manual-priority preservation on selection/Add suggestions, goals, class start,
budget and saved-build load/reload. Final console: zero errors and warnings.
The initial unrelated favicon 404 was absent after reload. Screenshot inspected
for a nonblank tree and readable, non-overlapping controls. User saves were
isolated and the browser session closed. No CSS or browser-specific code changed;
the existing Firefox checkpoint was not repeated for this metadata extension.

Logs: `var/poison-bow-admixture-20261109/`. Repeatable browser script and
screenshot: `output/playwright/poison-bow-admixture-20261109/`.
Preview HTML matched current dist; the entry JavaScript returned HTTP 200 as
JavaScript (706086 bytes), not an HTML fallback. Scoped `git diff --check`
passed, with only the existing README line-ending advisory.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

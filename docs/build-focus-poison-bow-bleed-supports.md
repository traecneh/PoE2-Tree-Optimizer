# Bleed I/II/III for Poison Bow Focuses

Three optional choices, one family and six reviewed pairs for Poisonburst
Arrow and Gas Arrow. The focus remains inherent burst/cloud Poison, not a
complete arrow-hit Bleeding build. These choices add notes, not automatic
scores, loadouts, conditional uptime or Full DPS.

## Behavior and Boundaries

| Tier | Flat chance to inflict Bleeding on eligible hits | Added Mana multiplier |
| --- | ---: | ---: |
| Bleed I | 50% | 20 points (120% cost factor) |
| Bleed II | 75% | None |
| Bleed III | 100% | None |

These are chance percentage points, not increased chance, Bleeding magnitude,
duration or attack speed. Chance caps at 100. Tier III still requires an actual
eligible hit: it does not guarantee contact, appropriate damage, applications
or sustained Bleeding. All three tiers share the Bleed family and replace only
that family's selected tier; Poison and Admixture remain separate.

The initial arrows can inflict Bleeding from eligible Physical hit damage.
The burst/cloud explicitly poisons without hitting and cannot inflict Bleeding.
Gas Arrow's separate Fire explosion does not become eligible merely by adding
chance: the reviewed fixture has no Physical hit damage and no Bleeding/Poison
damage there. Additional damage or special eligibility is not inferred.

Linking Bleed can provide a way to apply Bleeding, but it does not set PoB's
enemy Bleeding or Poisoned configuration. Without explicit enemy conditions,
even Bleed III + Admixture + Poison III leaves inherent Poison magnitude/output
unchanged. When Bleeding is explicitly configured, the two Poison bonuses
combine as 1.44. Admixture's reverse supported-hit Bleeding bonus needs Poisoned
and remains 1.2, not another bonus from Poison III. No reciprocal application
loop, guaranteed enemy state or conditional route-score bonus is assumed.

### Synthetic Source-Hit Caveat

Both no-hit components contain `display_statset_no_hit_damage`,
`display_fake_attack_hit_poison` and `display_skill_poisons_without_hit` in the
local generated source. PoB uses a synthetic weapon hit to derive Poison.
It also produces nonzero Bleeding output from that synthetic source when a
Bleed tier is linked. Those fields are not actual burst/cloud hits and must
not be interpreted as real no-hit Bleeding, summed with arrow output or used
to assume condition uptime. This discrepancy is recorded rather than hidden.

The app retains manual weights, scopes, exclusions, goals, starts and budgets.
No automatic Bleeding preferences are added, no conditional damage multiplier
is applied, and removal does not undo manual choices. No parser, optimizer,
point-counting, CSS, persistence-schema or Shortest-mode changes. Other skills
and Bleed IV are not auto-admitted; IV has materially different restrictions.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime completed 52 MAIN calculations: baseline and
three tiers across all five parent components, independent 50/75/100-point
chance controls, an over-cap control, Admixture, Poison III, all four explicit
enemy-condition combinations and Efficiency II. Six link predicates and six
missing-required-type negative controls pass. Every calculation checks the
actual active/stat set, equipped Bow, applied support IDs and both enemy flags.

Fixture: empty-tree Witch, level-20 skills, normal Crude Bow, sufficient
attributes. Installed PoB/user builds stay untouched. Evidence is in
`var/poison-bow-bleed-supports-20261109/`; independent frozen source identities
and output observations are in `src/tree/poisonBowBleedSupports.fixtures.ts`.
Ordinary regressions need no native runtime or network. Source/native checks
are not in-game testing or verification of contacts/uptime.

| Native observation | Poisonburst arrow / burst | Gas arrow / cloud |
| --- | ---: | ---: |
| Arrow Bleeding/s, Bleed I | 3.8992078125 | 1.285453125 |
| Arrow Bleeding/s, Bleed II | 4.226893633354 | 1.3815527828861 |
| Arrow Bleeding/s, Bleed III | 4.4994588462054 | 1.4636793837054 |
| Separate baseline -> all-tier inherent Poison/s | 5.385766215481 -> unchanged | 4.0038541776187 -> unchanged |
| Baseline / II / III Mana | 38 | 62 |
| Bleed I Mana | 45 | 74 |
| Bleed II + Efficiency II Mana | 23 | 38 |
| Unchanged arrow hit damage | 5.38125 | 1.8375 |
| Unchanged arrow Bleeding duration | 5 s | 5 s |
| Unchanged outgoing Poison duration | 3 s | 2 s |
| Unchanged displayed skill duration | 3.003 s | 4.026 s |

Each tier's actual-arrow output matches its independent flat-chance control.
III + 50 additional points gives raw 150 capped to 100 with unchanged Bleeding
output, not extra magnitude. PoB's roll/application estimates are not linear
chance multipliers or proof of sustained contacts. All tiers leave magnitude,
hit damage, area, speed, Poison stack cap and inherent Poison chance unchanged.

With Bleed III + Admixture + Poison III and no conditions, inherent Poison stays
at baseline. Explicit Bleeding changes it to 7.7555033502926 / 5.765550015771,
matching independent `base * 1.2 * 1.2` arithmetic. Poisoned alone does not do
that. Explicit Poisoned changes the actual arrow Bleeding to 5.3993506154464 /
1.7564152604464, matching `baseBleed * 1.2`; Bleeding alone does not do that.
Both inputs give the same two independent conditional results, not extra loops.
The trio Mana is 54 / 89: Bleed III adds no multiplier, while Admixture and
Poison III each add 20 points. Independent cost checks use
`floor(baseCost * factor)` and then Efficiency II's `ceil(cost * .6)`.

For transparency, native no-hit synthetic Bleeding fields for I/II/III are
3.8992078125 / 4.226893633354 / 4.4994588462054 (burst), and 3.1279359375 /
3.3880937294588 / 3.6049881117188 (cloud). These are explicitly excluded from
actual-hit interpretations and app score changes, not presented as game damage.

- [Bleed I source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L854)
- [Bleed II source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L884)
- [Bleed III source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L914)
- [Parent skill source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua)

Moving upstream references are not claimed byte-identical to the isolated runtime.

## Coverage and Next Batch

Reviewed pairs 480 -> 486; support choices 47 -> 50; families 30 -> 31.
Supports are 50/567 (8.8%), or 50/450 positive-tier (11.1%). Skills remain
103/399 (98/234 positive-tier), preferences 184, main-tree wording 864/2182
and occurrences 3444/5451. No source refresh or baseline reset.

The proposed successor, Corrosion, was subsequently reviewed for both focuses.
See [its checkpoint](build-focus-poison-bow-corrosion.md) for compatibility,
native effect coverage and the next proposed batch. The figures and verification
below remain this batch's historical checkpoint.

## Verification

Focused regressions passed 299 tests across seven files. One
`npm run validate:release` passed 2855 tests across 128 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
81340 ms. The existing main-chunk advisory remains non-blocking (708.25 kB).
No catalog refresh, baseline reset or route-quality audit.

An isolated Edge production-preview smoke check passed all six choices,
chance/cost/no-hit notes, tier replacement, removal and retention of Poison III
and Admixture. Final console: zero errors and warnings; the initial unrelated
favicon 404 was absent after reload. Screenshot inspected for a nonblank tree
and readable, non-overlapping controls. User saves were isolated and the browser
session closed. Parameterized DOM and JSON regressions cover manual priorities,
disabled controls and save/export/import for every tier. Repetitive browser
save/reload and Firefox checks were not rerun: shared layout, browser-specific
code and persistence implementation did not change.

Logs: `var/poison-bow-bleed-supports-20261109/`. Repeatable smoke script and
screenshot: `output/playwright/poison-bow-bleed-supports-20261109/`.
Served HTML matched the current dist; the actual entry JavaScript returned
HTTP 200 as JavaScript (708254 bytes), not an HTML fallback. Scoped
`git diff --check` passed with only the existing README line-ending advisory.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

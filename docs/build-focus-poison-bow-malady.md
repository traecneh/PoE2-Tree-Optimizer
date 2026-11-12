# Malady for Poison Bow Focuses

One optional catalog-review choice, one family and two reviewed pairs: Poisonburst
Arrow and Gas Arrow. Base-chance exchange context, not a Poison DPS calculator.
Local only. The frozen Gems/catalog entry has tier 0: current obtainability is
unverified. The checkbox is explicitly labeled "Malady (catalog review)" and its
notes lead with this warning. Native compatibility is not proof of availability.

## Chance Direction and Component Boundaries

- Generated Malady exchanges base Poison and base Bleeding chance for supported
  hit-capable skills. It is not a sum, copying both chances to both ailments,
  or converting one ailment's damage into the other. Native compatibility admits
  both parents and rejects controls with all qualifying parent types removed.
- Illustrative eligible-hit base chance: Poison 40%, Bleeding 75% becomes Poison
  75%, Bleeding 40%. With no other sources, Poison I's 40% contributes to Bleeding;
  Bleed II's 75% contributes to Poison. Poison III's 60% contributes to Bleeding,
  but its 20%-more Poison magnitude against Bleeding remains a Poison modifier.
  These are source-derived chance directions, not the current native results.
- Only base chances are exchanged. Increased chance, eligible damage types,
  magnitude, duration and maximum stacks are separate. Independent abstract
  arithmetic keeps destination increased-chance modifiers and the 100% cap
  separate from swapped base values; it does not simulate contacts or uptime.
- Initial-arrow on-hit ailments are separate from inherent no-hit burst/cloud
  Poison. The game's no-hit display/source flags are not proof of real hits,
  and Poison does not become a Bleeding hit. Physical/Chaos eligibility and
  actual successful hits still matter; chance alone does not let a Fire-only
  Gas explosion inflict either ailment. Ignition/detonation is not supplied.
- Burst linked-Poison duration and Gas's separate cloud/outgoing-Poison timers
  remain distinct. No bonus or penalty to inherent Poison is inferred from
  fake native 100% on-hit fields. Because the swap is unimplemented natively,
  unchanged native values are not proof of all in-game Malady interactions.
- Poison III and Admixture retain their own conditional magnitude bonuses.
  Swapped chance may help eligible arrow hits supply an enemy condition, but
  does not establish contact, Bleeding/Poisoned uptime, a self-sustaining loop,
  boss benefit, or an unconditional 1.44 Poison multiplier.
- Malady itself adds no Mana cost multiplier; other linked supports retain
  theirs. No automatic preference, scoring/scope/parser/solver changes, point
  changes or save schema. Manual chance/magnitude weights are not exchanged.
  Shortest remains unchanged and unreviewed skill pairs are not auto-admitted.

## Combination-Aware Notes

All six reviewed Poison I/II/III and Bleed I/II/III choices use alternate
summaries while Malady is selected. These show their new base-chance direction
without claiming that both ailments keep the same original chance. Poison III's
conditional Poison bonus, damage eligibility and native limitations stay visible.
Removing Malady restores the previous summaries. Tier changes retain Malady,
other families, manual priorities and the independent Blindside prohibition.

## Native Evidence and Independent Checks

The frozen PoB 0.23.1 runtime contains both swap flags in generated support data,
but has no mapping or calculation handling for them. Its chance fields and
outputs remain unchanged after linking Malady. This is a model gap, not game
semantics or proof that the support has no effect. No runtime patch or fabricated
Malady simulation is used.

38 isolated MAIN calculations on an empty-tree Witch: level-20 parents, normal
Crude Bow, sufficient attributes, boss mode None. The requested active/stat set,
actual Bow, effective mode, applied links and actual enemy condition flags are
asserted. Installed PoB and user builds are untouched.

- Ten baseline/Malady rows across all five parent components.
- Twelve actual-arrow Poison III, Bleed II and combined Admixture rows.
- Twelve combined rows across arrow/no-hit sources and explicit conditions.
- Four separate chance controls: Poison/Bleeding 40/75 versus 75/40, both parents.
- Two compatible links and two missing-type rejection controls.

The all-row verifier checks 17 same-state linked/baseline pairs. Actual native
Malady leaves arrow Poison III at Poison/Bleeding 60/0, Bleed II at 0/75, the
pair at 60/75, and synthetic source raw fields at 160/75 (Poison capped at 100).
Those are explicitly NOT the expected swapped on-hit directions. Separate
custom chance controls demonstrate 40/75 -> 75/40 only because those values were
independently supplied; they do not prove native Malady implementation.

| Native value | Without Malady | With Malady |
| --- | ---: | ---: |
| Burst inherent Poison/s estimate | 5.385766215481 | Same |
| Cloud inherent Poison/s estimate | 4.0038541776187 | Same |
| Combined Poison magnitude, conditions off / both on | 1 / 1.44 | Same |
| Combined Bleeding magnitude, conditions off / both on | 1 / 1.2 | Same |
| Burst linked Poison / skill timer | 3 / 3.003 s | Same |
| Gas outgoing Poison / cloud timer | 2 / 4.026 s | Same |
| Base Mana, Poisonburst / Gas | 38 / 62 | Same |
| Poison III Mana, Poisonburst / Gas | 45 / 74 | Same |
| Poison III + Bleed II + Admixture Mana | 54 / 89 | Same |

Same-state hits, speed, area, chance, magnitude, stack capacity, timers and costs
match exactly. Native synthetic Bleeding estimates do not turn no-hit components
into eligible Bleeding hits. Conditional bonuses are evaluated only with explicit
enemy flags; the app assigns no automatic route-score bonus from them.

Evidence: `var/poison-bow-malady-20261109/` (driver, native JSON, verifier/logs).
Independent ordinary-test facts: `src/tree/poisonBowMaladySupport.fixtures.ts`.
Tests need neither native PoB nor network. Startup missing-node notices are
retained and do not affect the empty-tree fixture. Source/native verification,
not measured in-game application, damage eligibility or sustained uptime.

- [Generated support](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3008)
- [Catalog entry, including tier zero](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua#L14090)
- [Base Bleeding chance source wording](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/StatDescriptions/gem_stat_descriptions.lua#L7305)
- [Native stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua)

Moving upstream references are not claimed byte-identical to the frozen runtime.

## Coverage and Next Batch

Pairs 512 -> 514, choices 61 -> 62, families 38 -> 39. Each Poison focus has
38 choices, including this catalog-only review. Supports are 62/567 (10.9%);
positive-tier coverage stays 61/450 (13.6%) because Malady is tier zero. Skills
remain 103/399 (98/234 positive-tier), preferences 184, main-tree wording
864/2182 and occurrences 3444/5451. No catalog refresh or baseline reset.

The proposed successor is now covered in the [Heft checkpoint](build-focus-poison-bow-heft.md).
Counts and verification remain the historical Malady checkpoint.

## Verification

Native 38-row verification and focused regressions (213 tests across five files)
passed. An initial release passed 3028 tests across 137 files, typecheck, build,
graph and baseline checks in 59254 ms. Its coverage report identified Malady as
tier zero, prompting the explicit catalog-review label/availability warning and
correction of the positive-tier subtotal, not a baseline or catalog change.
Final `npm run validate:release` passed all 3028 tests across 137 files,
typecheck, production build, graph validation and the unchanged coverage baseline
in 58735 ms, including the availability label and warning assertions. The existing
main-chunk advisory remains non-blocking (728.09 kB). No catalog refresh,
baseline reset or additional route audits.

An isolated Edge production-preview smoke passed both focuses: 38 choices each,
the catalog-review label and availability warning, paired Poison III/Bleed II
chance direction, Poison III's unchanged conditional magnitude, Bleed III tier
replacement, and normal-note restoration on Malady removal. Other links,
Blindside's independent prohibition and manual Poison/Bleeding chance/magnitude
weights remain intact on selection and Add suggestions. No automatic support
priority action appeared. Final console: zero errors/warnings and no page errors.
The initial unrelated favicon 404 was absent after reload. Inspected screenshot:
nonblank tree and readable controls/notes without overlapping text. User saves
were isolated and the browser session closed. DOM/JSON regressions cover disabled
controls, class, goals, budget and saved settings. Browser persistence/Firefox
matrices were not repeated because those implementations did not change.

Logs: `var/poison-bow-malady-20261109/`. Repeatable smoke and inspected screenshot:
`output/playwright/poison-bow-malady-20261109/`. Existing preview reused; served
HTML and actual entry JavaScript matched final dist. Entry returned HTTP 200 as
JavaScript (728092 bytes), not HTML fallback. Scoped `git diff --check` passed
with only the existing README line-ending advisory. Local preview:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. No commit, push or live deployment.

# Poison Bow Life Leech Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f plus moving upstream generated data. Six context-only
pairs, not a sustain simulator, Full DPS calculation or global Attack allowlist.

## Physical Hit Recovery, Not Poison

| Support | Effect ID | Catalog tier | Physical Attack damage leeched as Life |
| --- | --- | ---: | ---: |
| Life Leech I | SupportLifeLeechPlayer | 2 | 12% |
| Life Leech II | SupportLifeLeechPlayerTwo | 3 | 16% |
| Life Leech III | SupportLifeLeechPlayerThree | 5 | 16% |

All share the LifeLeech family: only one tier is retained. Attack OR
CrossbowAmmoSkill is required; both reviewed parents pass. Six native
compatibility groups accept each fallback, reject missing requirements and
reject Damage-only. This does not approve every skill with an Attack tag.
There is no added Mana multiplier, damage bonus or Poison bonus.

Actual arrows can leech from Physical hit damage. Poison is Chaos damage over
time, not a Physical Attack Hit, and does not generate this leech. Poisonburst's
no-hit burst and Gas's no-hit cloud are separate. PoB emits positive synthetic
source-hit leech fields for them; those are not real healing and are not scored.
The reviewed Gas Fire explosion converts all Physical damage to Fire and has
zero Physical-hit leech in this isolated setup. This is not a claim that
arbitrary gear/conversion changes can never supply a Physical component.

Sources:
- [Life Leech I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4924),
  [II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4955),
  [III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4986)
- [Physical Attack leech stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L502)
- [Native recovery calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Raw values 1200/1600/1600 are divided by 100 by the stat mapping, yielding
12%/16%/16%, not 1.2% or 1200%. Moving references are not claimed byte-identical
to the frozen runtime.

## Tier III Full Life Retention: Declared, Not Modeled

Tier III additionally declares `life_leech_from_source_not_removed_at_full_life`.
Its generated text says leech from the supported skill is not removed at full
Life. This is player Full Life and source-specific retention, not enemy Full
Life, global leech retention, instant recovery, overhealing or permanent sustain.

The reviewed runtime has no mapping for this exact source-specific stat.
Tier III leaves both global and skill `CanLeechLifeOnFullLife` flags false,
like Tier II. A distinct parsed global-retention control turns both flags on,
confirming the probe can detect the generic flag. The global mapping does not
implement Tier III's narrower source behavior.

Player Full Life true/false leaves II/III numeric leech estimates unchanged.
Even the global control does not change those estimates: these calculations
are not a health/instance-removal timeline. Equal native numbers do not prove
that II/III behave the same in game. The app explicitly warns about the gap;
no retention benefit, live timeline or measured sustain is invented.

## Native Checks and Independent Arithmetic

42 MAIN calculations: empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None and enemy
Bleeding/Poisoned false. No installed PoB, saved builds or runtime source changed.

Five components each have baseline, I/II/III and parsed 12%/16% controls (30).
Per parent: II/III at player Full Life, global retention, Cannot Leech Life,
20% Poison magnitude and high-Physical/high-speed cap controls (12).

| Actual-arrow native estimate | I amount/hit | II/III amount/hit | I rate/s | II/III rate/s | Mana cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| Poisonburst Arrow | 0.64575 | 0.861 | 0.7749 | 1.0332 | 38 |
| Gas Arrow | 0.2205 | 0.294 | 0.2646 | 0.3528 | 62 |

These tiny empty-build estimates are not build sustain recommendations.
Independent arithmetic reconstructs each row from Physical noncritical/critical
hit averages and crit probability, capping each branch before weighting.
The frozen model uses Life 3287, 2% Life/s per instance, a 328.7 per-instance
amount cap and 657.4/s total rate cap. Duration is amount/instance-rate;
instances are duration times hit rate; total recovery is separately rate-capped.
Those are reviewed PoB model fields, not universal/live PoE2 timing claims.

Both stress controls actually bind both caps: amount 328.7, duration 5s,
rate 657.4/s. Cannot Leech Life produces zero despite the modifier still being
present. The fully converted Fire component produces zero. All ten parsed
scalar controls match their support tier. Increasing Poison magnitude 20%
raises native source Poison by 20% but changes no leech field. Damage, costs,
timers, application potential, Poison chance/duration/stacks and delivery remain
unchanged for ordinary tiers. No extra contacts or continuous hits are assumed.

All 42 rows, six compatibility groups and ten scalar controls passed the
independent verifier. Ignored evidence: `var/poison-bow-life-leech-20261110/`
(driver, JSON, verifier and logs). Known frozen-runtime startup missing-node
messages are unrelated to these empty-tree component checks.

## App Behavior and Coverage

Tier replacement/removal, save/JSON round trips and unsupported-focus rejection
are covered. Manual weights, preset suggestions, scores, goals, point budgets,
previous support notes and shortest/manual routing remain unchanged. No new
state controls, automatic priority action, recovery multiplier or runtime patch.

98/567 raw support choices (17.3%), 97/450 positive-tier (21.6%), 60 families
and 586 pairs. Poisonburst offers 73 choices; Gas offers 75. Skills remain
103/399 (98/234 positive), preferences 184, wording 864/2182 and occurrences
3444/5451. Scoped coverage, not overall completion; no baseline refresh.

## Validation

Focused regressions passed 347 tests in six files, including sixteen new pure
tests and two UI cases. One initial test assumed an unrelated-preference warning
would always exist; the corrected assertion preserves its presence or absence.

`npm run validate:release` passed 3,409 tests in 160 files, typecheck,
production build, graph validation and unchanged coverage baseline in 72.907
seconds. The existing large-chunk advisory remains nonblocking (main 781.91 kB,
192.41 kB gzip); no unrelated performance refactor or data refresh.

The local preview had stopped. It was restarted with the explicit GitHub Pages
base path; the initial incorrectly based preview's missing-asset error was
resolved. The served JavaScript now matches `dist` byte-for-byte at
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/` and the server remains available.

Edge smoke passed both 73/75-choice lists, I/II/III family replacement,
selection/removal/restoration, hit/Poison/converted-Fire/cost notes and the
explicit Tier III modeling warning. Manual weights and earlier support notes
remained unchanged. No unexpected automatic priority action or page errors.
Screenshot inspection confirmed readable notes and a rendered tree without
overlap. The final console had zero errors/warnings. Browser evidence:
`output/playwright/poison-bow-life-leech-20261110/`.

These are source/native/regression/browser checks, not in-game tests or user
visual acceptance. No commit, push or deployment.

## Next Proposed Batch

Review [Mana Leech](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6833)
for both Poison bows, separating Physical arrow-hit recovery from Poison,
recovery amount/rate/caps and Mana expenditure. Do not assume sustained hits or
that leech pays for the skill. Proposal only in this batch; subsequently
completed in [the Mana Leech checkpoint](build-focus-poison-bow-mana-leech.md).

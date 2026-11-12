# Mark Utility Support Review

Reviewed 2026-11-08 against the isolated PoB 0.23.1 runtime/catalog and PoE2
0.5.5f graph. Adds twenty curated pairs: Mobility, Efficiency I/II and Prolonged
Duration I/II for Sniper's Mark, Bloodhound's Mark, Freezing Mark and Voltaic Mark.
No new support IDs, preferences, scopes, solver, storage schema or UI controls.

## Decisions

| Support | Curated pairs | Verified native effect | Website policy |
| --- | ---: | --- | --- |
| Mobility | 4 | 25% less movement penalty during Mark application | Context only; not global Movement Speed, action speed or consuming-hit/explosion damage |
| Efficiency I/II | 8 | 30%/40% less supported-skill cost | Context only; not Mana regeneration, buff strength, cooldown recovery or sustainable frequency |
| Prolonged Duration I/II | 8 | 30%/35% more primary duration; also scales Freezing/Voltaic's secondary buff duration | Context only; not buff strength, guaranteed activation, uptime or DPS |

All five require no automatic priority changes. Selection preserves required
goals, optional priorities, extra/all-available budgets and empty parent hit
scopes. Add suggestions retains existing weights. One tier per family is kept;
removing a support does not undo manual priorities. Existing saved builds and
JSON transfers normalize these pairs through the same catalog-driven path.

Support magnitudes are explanations, not route-score multipliers. A node with
10 Mark Effect, 10 Mark Use Speed and 10 Mark Duration still scores 5 under
the default 3/1/1 weights, with or without these supports. A shared node is
counted/rewarded once; allocated base nodes are not rewarded again. The pure
shortest router remains unchanged. These are not complete socket/loadout,
attribute, equipment, cross-skill or arbitrary support-combination checks.

## Native Compatibility and Ownership

All twenty Mark-parent pairs pass the native support predicate. Twenty negative
type controls also pass: removing UsableWhileMoving rejects Mobility, removing
Duration rejects each Prolonged tier, and adding Persistent rejects each
Efficiency tier. Blood Explosion is checked separately: it accepts Efficiency,
but not Mobility or Prolonged Duration. That does not make it a new focus or
transfer Mark utility to its attack damage.

Thirty-six player actor fixtures cover, for each Mark, baseline, five single
supports, a three-family combination, and Prolonged I plus either generic or
Mark-specific duration. Each support must actually appear in the parent's
applied effect list; being socketed alone is insufficient. Fixtures use level
20/quality 0 Marks, level 1/quality 0 supports, an empty tree and sufficient
attributes. Parent owner remains the player, no minion or hit, TotalDPS zero.

No test simulates Critical Hit/Freeze/Electrocute consumption, Blood Loss,
replacement or re-marking. Bloodhound's paused expiration during Blood Loss,
Sniper's consuming hit and charge generation, and Freezing/Voltaic's conditional
buff activation remain separate application requirements. Buff magnitudes do
not change merely because their duration or application cost changes.

## Independent Arithmetic and Corrected Secondary Probe

The previous Mark audit read `SecondaryDuration`, but PoB exposes
`DurationSecondary`. Its missing output was an audit-field error, not evidence
of missing native secondary timing. This batch reads the correct field and
verifies `Data/SkillStatMap.lua` maps the secondary base stat to
`skillData.durationSecondary`. No native source or installed PoB was changed.

Native durations round up to 0.033-second ticks:
`ceil(baseSeconds * (1 + increased/100) * more / .033) * .033`.

| Case | Primary base 8 seconds | Secondary base 10 seconds (Freezing/Voltaic only) |
| --- | ---: | ---: |
| Baseline | 8.019 | 10.032 |
| Prolonged I | 10.428 | 13.002 |
| Prolonged II | 10.824 | 13.530 |
| Prolonged I +20% generic duration | 12.507 | 15.609 |
| Prolonged I +20% Mark duration | 12.507 | 15.609 |

Mark-specific and generic duration each scale both timers in the tested runtime;
they are not two rewards for one passive source. Follow-up buff magnitudes stay
at the fixture's 30 Cold/Lightning gain. Native static buff presence is still not
proof of actual uptime or activation ownership. Sniper/Bloodhound have no
secondary timer in these exports.

Mobility independently changes the fixture's 70% penalty to `70% * .75 = 52.5%`,
so the minimum movement fraction while using the action changes 30% -> 47.5%.
Global movement remains 1; use rate 2, cooldown 6.006/0.528 and action time do
not change. Acceleration, real-character speed and gameplay are not simulated.

All four Marks cost 79 Mana in the baseline. Native support cost multiplier is
applied and floored before the less-cost stage, which rounds up: Efficiency I
`ceil(79 * .70) = 56`, II `ceil(79 * .60) = 48`; Prolonged alone
`floor(79 * 1.20) = 94`. Prolonged II plus Efficiency II gives
`ceil(floor(79 * 1.20) * .60) = 57`. These fixture calculations do not claim
universal in-game rounding or whole-build sustain.

## Provenance and Reproduction

Official references: [Mobility data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3066),
[Efficiency data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2711),
[Prolonged Duration data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5602),
and [duration/cost/movement calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
Moving references are not claimed byte-identical to this tested snapshot.

| Tested local file | SHA-256 |
| --- | --- |
| Data/Skills/sup_str.lua | 370edb0f3c6475565c23057953de8af2d3ca851cf3a94a5818ae547ed179e13a |
| Data/Skills/sup_dex.lua | 0cb6d21a33eced70a49b537a9b6ad9841c43b70f7fdd8a88eae9435263eec4c6 |
| Data/SkillStatMap.lua | 703857f0c20f7a6a079a5379562a888dca02a2921f4e0e5467f65c531398081c |
| Modules/CalcOffence.lua | eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435 |

Ignored evidence is under `var/mark-supports-20261108/`. The isolated native
startup's fourteen pre-existing missing-node messages are unrelated. An initial
probe failed on the wrong hit-flag object, was corrected to the existing stat-set
flag API, and the complete native driver then passed. Ordinary tests do not
depend on local PoB, private builds or these ignored artifacts.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/mark-supports-20261108/review.lua --job var/mark-supports-20261108
node --import tsx var/mark-supports-20261108/verify.mjs
```

## Coverage and Validation

Reviewed pairs 292 -> 312. Support choices remain 31/567 across 19 families,
twenty context-only/partial; skill presets stay 45/399, preferences 183. All 46
contexts and both fingerprints exactly match the reviewed baseline. Wording
853/2,182 (39.1%) and occurrences 3,412/5,451 (62.6%) are unchanged. No baseline
refresh is needed. These are scoped heuristic/catalog counts, not full mechanics.

Quick validation passed 1,711 tests in 48 files, typecheck and no-loss coverage.
Native/source audit passed all twenty curated pairs, 25 component pairs, twenty
negative controls and 36 actor fixtures, including independent arithmetic.
Tests cover support allowlists, selection/removal/tier replacement, primary and
secondary timing descriptions, unchanged priorities/scopes/route scores, and
save/JSON transfer for all twenty pairs. One final release validation passed
2,028 tests in 92 files, typecheck, production build, graph validation and the
unchanged coverage baseline. Local port 5174 returns HTTP 200. The existing
main-chunk warning remains at 545.30 kB minified / 143.77 kB gzip; the build
succeeds. `git diff --check` passes with existing LF/CRLF conversion notices.
No shared control/layout contract changed; DOM and routing checks cover this
metadata-only batch without a repeated real-browser matrix or claimed visual
acceptance. No final validation step failed.

Next proposal: a five-skill Warcry utility preset batch for Infernal Cry, Seismic
Cry, Ancestral Cry, Fortifying Cry and Ferocious Roar. All five positive-tier
catalog IDs exist but have no preset yet. Review Warcry speed, cooldown and area
alongside application/form restrictions, empowered attacks and separate damage
components before suggesting effects. This is not authorization to implement
that batch. Fireball Concentrated Area and ten-Incision remain held separately.
No commit, push or deployment authorized or performed.

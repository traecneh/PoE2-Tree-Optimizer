# Optimizer Allocation Safety

Subsequent work: [balanced weighted scheduling and paired frozen rerun](2026-11-08-balanced-weighted-search.md).
The safety results below are preserved as their original experiment.

Completed November 8, 2026, on the existing PoE2 0.5.5f graph and Node 22.18.0.
Follow-up to the [frozen imported-build benchmark](2026-11-08-imported-weighted-benchmark.md).
Implemented locally; not committed, pushed or deployed by this task.

## Behavior

- The website supplies its available main-tree point cap in both Shortest and
  Weighted modes. Extra Points is an allowance, not permission to exceed that
  cap. Existing committed/pending base points also consume the budget.
- The effective main cap is at most `123 - max(W1 points, W2 points)`, or a lower
  supplied cap. A caller supplying an already-adjusted cap is not charged twice.
  For example, 24 points in each set leave 99 main points, not 75.
- Fixed W1/W2 nodes are excluded from main routing. The optimizer does not score,
  add, remove, move or reroute either weapon branch.
- On PoB import, root-connected shared nodes touching a weapon branch are recorded
  as mandatory main-tree attachments. This conservatively preserves the existing
  boundaries, rather than choosing a new attachment or copying the whole source
  main tree. The Warbringer snapshot records 11 such nodes.
- Attachment metadata survives save/load and build transfer. Older saves derive
  it from their saved shared allocation when possible. Missing/stale connections
  cause a reconnect/reimport error instead of silently dropping weapon nodes.
- Request validation, progress/alternative validation and Apply all enforce these
  constraints. Infeasible results are not published as valid previews. A changed
  point cap or weapon allocation invalidates a stale route before Apply.

The exact solver's algorithm and ten audited helper/function bodies are unchanged;
only constraint preparation and admission changed. Uncapped low-level Shortest
developer/stress requests remain supported when no cap or weapon context is
supplied. The website always supplies a cap; Weighted defaults to the normal cap.
An over-cap provisional route may still guide internal shortest refinement, but
is not exposed as an applicable route.

## Frozen Rerun

Reused the four previously captured public builds: Spark Sorceress, totem
Warbringer, support Huntress and progression Monk. Source bytes, original imported
goals, class starts, gates, preferences, weapon assignments and graph are unchanged.
No recapture, repair or fresh online download was performed.

The same 24 cases, two seeds and three search arms ran at a common two-second
cutoff, with rotating arm order. Four current-only ten-second followups and the
same six targeted ten-second comparisons bring the total to **154 timed runs**.
All three arms now receive the same caps and protected weapon boundaries.

Independent raw-edge checks verified 434 preference-stage progress results for
unique costs, required goals/attachments, main connectivity, reserved-node overlap
and each weapon set's connection independently. Production validation additionally
checked each published result and its selectable alternatives.

| Allocation check | Before, current search | After, current search |
| --- | ---: | ---: |
| Over main cap, 48 matrix outputs | 8 | 0 |
| Detached weapon nodes, 12 Warbringer outputs | 12 | 0 |
| Reserved weapon overlap, 12 Warbringer outputs | 5 | 0 |

All 154 runs and 434 checked progress results had **zero** cap, overlap or weapon
attachment violations. Every matrix arm produced a preference-stage incumbent
before its common cutoff.

| Build | Main cap | Shortest baseline found | Current matrix output costs |
| --- | ---: | ---: | --- |
| Spark | 123 | 121 | 121, 123 |
| Warbringer | 99 | 96 | 96, 99 |
| Huntress | 123 | 119 | 119, 123 |
| Monk | 123 | 34 | 34, 39, 123 |

Spark Extra +5 now stops at 123 instead of 126; Huntress stops at 123 instead of
124. Warbringer's baseline rises from 90-91 to 96 because its original weapon
attachments must remain connected. Its earlier higher-scoring but detached routes
are not comparable valid alternatives. These changed constraints define a smaller
feasible problem, not a scoring or exact-algorithm change.

## Feasible Route Quality

Compare preference score first, then fewer points on a tie, within each identical
request only. All 48 matched matrix groups now pass allocation safety.

| Current search versus | Improved | Tied | Behind |
| --- | ---: | ---: | ---: |
| Earlier weighted greedy | 8 | 39 | 1 |
| Bundle lookahead without exchanges | 4 | 44 | 0 |

The 48 groups include related profiles, seeds and budgets, not 48 independent
builds. For Spark and Warbringer, capped Extra +5 and All Available have the same
effective budget. Do not treat these counts as a general superiority claim.

Within the same current-only ten-second run, All Available, seed 1701:

| Profile | Score at 2s | Score at 10s | Points |
| --- | ---: | ---: | ---: |
| Spark ES/Mana | 12.00 | 16.50 | 123 |
| Warbringer Life/Armour | 17.67 | 17.67 | 99 |
| Huntress Evasion/Life | 17.50 | 17.50 | 123 |
| Monk Evasion/Life | 71.25 | 72.17 | 123 |

The prior targeted ten-second cases were repeated, rather than selected anew:

- Spark Spell/Cast, tight: all three arms reached 20.87 at 121 points.
- Monk Evasion/Life, All Available: greedy reached 72.50; bundles and current
  reached 72.17, all at 123 points. This remains a useful search-scheduling case.

Two-second first-baseline medians were about 168-170 ms; first preference results
were about 471-473 ms across arms. Absolute process peak RSS across all runs was
about 312 MiB, including the loader, graph and retained evidence, not isolated
worker memory. Timing includes validation/baseline but excludes input loading and
post-checks. Cooperative-stop overrun candidates do not count toward checkpoints.
These are Node wall-time observations, not browser latency or significance tests.
Preference scores are not PoB DPS, build viability or proofs of global optimality.
The website's 60-second no-improvement timer is unchanged.

## Verification and Evidence

- `npm run validate:release`: 2,186 tests in 99 files, typecheck, production build,
  graph validation and coverage baseline passed. Existing bundle-size warning only.
- Five frozen-corpus checks and standalone research TypeScript checking passed.
- Seven protected graph/scoring/preset/original-evidence hashes remained unchanged.
- Browser smoke on Edge: import Warbringer, save before main allocation, New,
  load, optimize, cancel and Apply. Result: 99 main + 24 per weapon set, 123 total,
  eight ascendancy points. Spark Extra +5 also applied at 123 main points.
  No application console errors; existing favicon 404 only. Firefox not rerun.
- Exact core functions were compared with the task's pre-edit snapshots, not with
  an older committed baseline that predates the previous approved search work.

New raw evidence is isolated under ignored
`var/allocation-safety-20261108/benchmark/`: `benchmark.json`,
`results.partial.json` and `regression-followups.json`. Release/browser evidence is
in `var/allocation-safety-20261108/release.log` and
`output/playwright/allocation-safety-warbringer.png`. The original corpus and both
old result files remain unchanged under `var/weighted-corpus-20261108/`.

To rerun against the frozen captures, choose a **new** output directory:

```powershell
node --test tools/research/imported-weighted-corpus.check.mjs
node --import tsx tools/research/imported-weighted-benchmark.ts --output var/allocation-safety-20261108/rerun-02
node --import tsx tools/research/imported-weighted-benchmark.ts --case monk/evasion-life/available --arm current --seed 1701 --ms 10000
```

Do not run `--prepare` when reproducing this frozen experiment. The coordinator
refuses an existing output directory rather than overwriting previous evidence.

## Next Recommended Step

Improve weighted search scheduling: give fast greedy restarts a bounded share of
the search alongside bundle lookahead and branch exchanges, retain the best valid
candidate across strategies, and measure the same frozen checkpoints again. Target
the Monk Evasion/Life case without losing the Spark and Attack/Speed gains. Keep
the exact solver, preferences, weapon branches and new safety contract unchanged.
This is a measured follow-up proposal, not implemented in this batch.

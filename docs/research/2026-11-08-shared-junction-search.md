# Bounded Shared-Junction and Connected-Branch Search

Implemented after the [optimizer investigation](2026-11-08-github-optimizer-opportunities.md)
and [strict validation](2026-11-08-optimizer-validation.md). No new dependencies,
UI modes, saved-build fields or deployment are included.

## Behavior

The larger-goal anytime solver now explores two additional neighborhoods after
publishing the existing fast incumbents:

- **Shared junctions:** rank non-required graph junctions using nearby terminal
  distances; join the base and every required goal through a candidate junction.
  Measure the union's actual unique-node cost, remove unnecessary cycles/travel,
  and retain it only through the existing candidate-selection rules. The ranking
  estimate is a heuristic, not a bound or a substitute for counting allocations.
- **Connected branches:** compact a candidate while preserving all fixed base
  connections, then identify travel chains with no required/base interior nodes.
  Remove one chain and reconnect its components using a fresh multi-source
  shortest-path search. Retained nodes cost zero for this reconnection; genuinely
  new nodes cost one. Reject disconnected repairs or non-improving replacements.

Every four original restart iterations, at most two chain replacements and one
junction seed are attempted. Extra work is capped at 64 chain attempts and 32
junction seeds per run. The graph is not restricted to those seeds, and there is
no new goal-count limit. Existing randomized restarts continue after these caps.

Base nodes/edges and goals remain mandatory. Required nodes are never removable
chain interiors. Exclusions, visibility gates and unsupported pools are still
enforced by the shared validator. Spanning/leaf cleanup applies only to newly
generated candidate connections, not to committed/pending base allocations.

The old incumbent and the original seeded candidate stream remain available.
With equal iteration counts, the new search cannot worsen the retained best
cost. With equal wall time, added work can reduce the number of old restarts,
so quality must be measured rather than universally guaranteed.

`enableLocalSearch: false` in `BuildGoalsAnytimeOptions` disables the new moves
for developer ablation tests. It is not a site control. The worker enables them
by default. The synchronous bounded fallback is unchanged.

## Exact and Weighted Boundaries

The small-goal exact solver is unchanged, including the 10-goal/6,000,000-state
selection thresholds. AST-extracted SHA-256 comparisons confirmed identical
bodies for the exact solver, subset merge, relaxation, reconstruction, base
selection, graph indexing and heap push/pop functions (eight functions).
Small exact-mode results also match with the new option enabled or disabled.

Weighted effect matching and scoring were not changed. A larger weighted run's
shortest baseline can now benefit from these improvements, with the same
baseline-found-plus-extra or All Available semantics. A regression fixture
checks that a baseline formerly needing 17 points can fit a 16-point available
budget after refinement; required goals and score semantics remain intact.

The separate weighted greedy trap still scores 12 where an independent oracle
finds 20 at the same nine-point budget. This batch does not solve that problem.

## Regression Results

| Fixture | Local search off | Local search on | Independent minimum |
| --- | ---: | ---: | ---: |
| Original shared-trunk example, 11 goals | 17 | 16 | 16 |
| Retained-branch reconnection example, 11 goals | 18 | 17 | 17 |

Independent enumeration fixes the required nodes and enumerates optional node
subsets, checking raw-edge connectivity. Tests also cover fixed bases, excluded
and locked junctions, cancellation, zero iterations, deterministic seeds, budget
fit and 30 independently checked padded graphs. Every returned alternative
continues through the existing strict result validator.

## Real-Graph Paired Benchmark

Reproduce with existing dependencies:

```powershell
node --import tsx tools/research/junction-search-benchmark.ts
```

Raw evidence: ignored `var/junction-search-20261108/benchmark.json`. The script
replaces that generated output on rerun. Inputs and solver have SHA-256 hashes;
per-seed histories, request IDs, timing and absolute process peak RSS are retained.

The captured corpus uses PoE2 0.5.5f, Witch root, the same filtered main graph,
and the same requests/seeds for on/off runs. There were 108 fresh Node/tsx process
runs, or 54 matched pairs: two synthetic pairs, ten seeds for each real case at
64 restart iterations, and three seeds per real case at a common 500 ms cutoff.

| Case | Goal types | Median points off/on, 64 iterations | Median solve ms off/on |
| --- | --- | ---: | ---: |
| Compact 25 | 10 notables plus 15 other passives | 35 / 35 | 224.1 / 259.7 |
| Compact 50 | 10 notables plus 40 other passives | 53 / 53 | 671.3 / 739.3 |
| Spread-out 25 | 25 notables | 172 / 172 | 539.6 / 623.1 |
| Spread-out 50 | 50 notables | 283 / 281 | 1,631.2 / 1,755.9 |

The compact goal sets lie inside a known connected allocation of at most 99 paid
points. They are generated cases, not imported human builds. The spread-out
cases are deliberately **over the normal 123-point budget** and are stress tests,
not playable build recommendations. Shortest mode was not given a point cap.

At the common 500 ms checkpoint, the spread-out 50-goal median was 284 points
off versus 283 on, across three paired seeds. Timed comparisons use the last
published incumbent at or before the cutoff, not a result found during slight
cooperative-stop overrun. Other timed cases tied. Across all 54 sampled pairs:
15 improved, 39 tied, zero regressed. This is not a universal quality guarantee.

Timing includes the public solver's validation but excludes input loading and
independent post-checks. These are Windows/Node 22.18.0 measurements, not browser
latency measurements. Extra search raised fixed-iteration total runtime by about
8-16% in these real cases. The first valid route is emitted before the new work;
observed first-result p95 remained similar (largest increase: 140.1 to 143.6 ms).
Fresh-process timings remain sensitive to host load and are not significance
tests. Maximum observed process RSS in the largest fixed-iteration case rose
from 137.6 to 139.7 MiB, including the loader and graph, not just solver memory.

## Browser and Release Verification

- `npm run validate:release`: 2,146 tests across 96 files, typecheck, production
  build, graph validation and coverage checks passed. The pre-existing bundle-size
  warning remains non-fatal.
- The research benchmark script separately typechecked and all 108 outputs passed
  independent final connectivity/cost checks and the production result validator.
- Edge exercised a real 13-goal Minion Life search: progress 52 -> 51 -> 50 points,
  zoom during search, cancellation retaining the preview, alternate-route cycling,
  then apply at 50 points with all 13 goals still reached. No application console
  errors occurred in the final smoke test. Firefox was not retested in this batch.
- The smoke test exposed bulk goal-add including an ascendancy passive. The
  shared goal-eligibility predicate now rejects starts, masteries and ascendancies
  for all entry actions, matching the main-only optimizer contract. The All action
  now adds the 13 eligible matches rather than mixing in the 14th manual-only node.
- The existing local server serves the updated implementation. No commit, push,
  game-data extraction/update, dependency install or live deployment was performed.

## Next Recommended Step

Add bounded connected-bundle lookahead and optional-branch exchanges to weighted
mode. Keep shortest mode and preference semantics intact. The first concrete
acceptance target is the independently checked 12-to-20 score gap at the same
nine-point budget, preserving every required goal and fixed base allocation.

Follow-up: [connected-bundle lookahead](2026-11-08-weighted-bundle-lookahead.md)
now closes that nine-point gap. Optional-branch exchanges remain a separate next
step; the measurements above describe this earlier shortest-search batch.

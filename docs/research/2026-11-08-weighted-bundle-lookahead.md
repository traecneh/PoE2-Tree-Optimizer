# Connected-Bundle Lookahead for Weighted Routes

Follow-up to [shared-junction search](2026-11-08-shared-junction-search.md).
No new UI controls, preference definitions, saved-build fields or dependencies.

## Behavior

Weighted mode still publishes its existing fast shortest baseline and greedy
preference candidate first. It then tries a bounded beam of connected additions,
allowing shared travel to unlock several rewards that are unattractive one at a
time. Every retained route still includes all goals and fixed base nodes/edges.

- At most two distinct goal-route seeds per run: the shortest baseline first,
  then a different unaugmented goal route from the existing restart stream.
- Eligibility is checked every eight restart iterations, starting at iteration
  zero. Each seed has at most three lookahead layers and eight retained states.
- Each state expands at most twelve paths, mixing gain-per-point and total-gain
  rankings. Point-cost diversity preserves room for later shared additions.
- At most twelve retained prefixes receive deterministic greedy completion per
  seed. Deduplication uses unique node sets; cost and score count shared nodes
  once. Base nodes add neither new cost nor new reward.
- Negative travel effects are included. A prefix may have nonpositive immediate
  gain when its positive endpoint could unlock a worthwhile combined bundle.
- Exclusions, visibility gates, special-node restrictions, Extra and All Available
  budgets, and strict progress/result validation remain enforced.
- The new work checks cancellation and the existing inactivity deadline. Better
  incumbents use the existing timer-reset logic. Existing restarts continue after
  the bundle-work cap is reached.

`WeightedBuildGoalsOptions.enableBundleLookahead: false` is an internal ablation
switch, not a site setting. Bundle search consumes no random draws, preserving
the original candidate stream at equal iteration counts. The best incumbent and
shortest-baseline alternative remain available. With a fixed wall-time budget,
extra search work can displace restarts, so improvements are not guaranteed.

Shortest/exact routing and the preference parser, skill presets and support
matching are byte-for-byte unchanged from the start of this batch (four source
SHA-256 comparisons). This remains heuristic passive-preference scoring, not
PoB Full DPS or proof of a globally optimal weighted tree.

## Independent Regressions

The main fixture has one required point, four tempting two-point reward branches,
and five larger rewards sharing a three-node travel trunk. An independent oracle
enumerates optional node subsets, checks raw-edge connectivity and sums declared
literal rewards, without production search or scoring helpers.

| Fixture | Previous search | Bundle search | Independent optimum |
| --- | ---: | ---: | ---: |
| Nine-point budget | Score 12, 9 points | Score 20, 9 points | Score 20, 9 points |
| Negative gateway | Score 12, 9 points | Score 14, 9 points | Score 14, 9 points |
| Eight-point budget | Not an acceptance baseline | Score 16, 8 points | Score 16, 8 points |

Additional checks cover fixed bases, multiple goals, excluded/locked/keystone
gateways, both budget modes, cancellation, inactivity, zero-iteration fallback,
determinism, baseline retention and 30 seeded signed-reward tiny graphs. For
those graphs the new result is no worse than the original search and never
exceeds the independent oracle. Every published/returned alternative continues
through the production validator.

## Paired Real-Tree Benchmark

```powershell
node --import tsx tools/research/weighted-bundle-benchmark.ts
```

Evidence: ignored `var/weighted-bundles-20261108/benchmark.json`, including request,
graph and solver hashes, seed histories, timings and absolute process peak RSS.
The command replaces this generated report on rerun.

The captured corpus uses PoE2 0.5.5f, Witch root, fresh Node/tsx processes, three
seeds per real case at 32 restart iterations and two seeds per case at a common
500 ms cutoff. There are 42 runs / 21 pairs including the synthetic regression.
Real cases are generated inputs, not imported human builds.

| Case | Median score off/on | Median solve ms off/on |
| --- | ---: | ---: |
| Compact 25 goals, Attributes, +8 | 20 / 20 | 846.6 / 915.8 |
| Compact 25 goals, Energy Shield, +8 | 17.33 / 17.33 | 797.2 / 869.2 |
| All 13 Minion Life goals, +8 | 26.1 / 26.1 | 652.2 / 780.1 |
| Compact 25 goals, Minion Life, All Available | 33.5 / 33.5 | 1,214.9 / 1,473.4 |

All real score comparisons tied, including the 500 ms checkpoints. All Available
used 103 rather than 104 points at the same score in all three fixed-iteration
pairs; it is allowed to leave points unused when no further positive reward fits.
The synthetic pair improved 12 to 20. No sampled score regression occurred; this
does not establish general optimality or a universal runtime-quality guarantee.

Added fixed-iteration runtime was about 8-21%. First valid baseline medians stayed
around 126-147 ms in the fixed-iteration real cases. Maximum observed absolute
process peak RSS was 141.4 MiB off / 144.2 MiB on, including loader and graph.
Timing includes production validation, excludes input loading and independent
post-checks, and is sensitive to host load. Timed scores use only preference-stage
incumbents published before the shared cutoff, not cooperative-stop overruns.

## Verification and Boundaries

- `npm run validate:release`: 2,157 tests / 97 files, typecheck, production build,
  graph validation and coverage baseline passed. The existing nonfatal chunk-size
  warning remains. The benchmark script also separately typechecked.
- Edge worker smoke: 13 Minion Life goals, baseline 50, weighted preview 58 with
  eight extra points, score 26.1; zoom while running, cancellation preserving the
  preview, then Apply at 58/123 with all goals reached.
- No application console errors; the existing `/favicon.ico` 404 was observed.
  Firefox was not retested. An existing cramped header at the 1280px smoke
  viewport was also observed; this solver-only batch does not change layout.
- Local server serves the updated code at `http://127.0.0.1:5174/`. No commit,
  push, dependency install, game-data update or live deployment was performed.

## Next Recommended Step

Add bounded optional-branch exchanges to weighted mode. Remove only optional
non-base portions of a candidate, then test a stronger connected reward bundle
within the freed budget. Preserve every goal and fixed base connection, keep the
current incumbent as fallback, and target an independent regression that needs
replacement rather than addition. Keep shortest/exact and scoring unchanged.

Follow-up: [optional-branch exchanges](2026-11-08-weighted-branch-exchanges.md)
implements that pass and closes a score-62-to-63 gap at nine points within the
same 16-iteration work budget. The measurements above describe the prior batch.

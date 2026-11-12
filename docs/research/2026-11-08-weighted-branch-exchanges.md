# Optional-Branch Exchanges for Weighted Routes

Follow-up to [connected-bundle lookahead](2026-11-08-weighted-bundle-lookahead.md).
Enabled automatically in weighted mode, with no UI controls, dependencies,
saved-build changes or new scoring rules.

## Search Behavior

After eight original restart iterations, then every eight iterations, inspect
the current best weighted route. Build a deterministic rooted spanning tree of
its selected edges. A subtree is removable only when it contains no goal or
fixed base node. Removing that complete subtree leaves the spanning-tree
remainder connected, including when extra candidate edges form cycles.

Rank eligible branches by low reward per freed point and low total reward loss.
Try up to two removals from each of at most two distinct incumbents: at most four
distinct pruned seeds per run. Preserve the actual retained edge set, including
every base edge; do not rebuild or prune committed/pending base allocation.

Refill each seed using the existing connected-bundle machinery, with smaller
limits: two layers, four retained states, eight path alternatives per state and
four deterministic greedy completions. Shared travel/reward nodes count once;
negative travel effects remain included. Only publish exchange candidates that
beat their source incumbent's score, or tie its score using fewer new points.
The global best still uses the existing comparison and archive rules.

All goals, base connections, visibility/exclusion rules, special-node guards and
Extra/All Available budgets remain enforced. Cancellation and the existing
inactivity timer are checked during pruning and refill. Improvements use the
existing countdown-reset behavior; losing attempts do not reset the timer.

`WeightedBuildGoalsOptions.enableBranchExchanges: false` disables only this pass
for developer ablations. Original restarts and bundle lookahead remain available.
No additional random draws are consumed, preserving the prior candidate stream
at equal iteration counts. Shortest/exact routing, preference parsing, skill
presets and support matching are unchanged (four source SHA-256 checks).

This is bounded local search, not a global-optimality guarantee. It cannot
remove required travel, simultaneously remove multiple separate branches or
force every larger-route alternative to receive an exchange pass.

## Independent Regression

At 16 restart iterations with seed 1701, the previous weighted search retains a
score-62 route using nine points. It has a six-value optional node, while a
seven-value reward beside an already-reached shared junction remains unselected.
The exchange pass replaces the weaker node and scores **63 at nine points**.

A separate test oracle enumerates literal reward subsets and their unique
ancestor closures on the fixture's raw tree. It confirms the best possible score
is 63 at nine points, without using production scoring or routing helpers. The
oracle is cross-checked against full raw-node subset enumeration on 30 tiny
signed-reward trees. At 32 iterations the previous search can also reach 63;
the regression demonstrates an earlier improvement, not permanent failure of
the earlier randomized search.

Tests also cover both budgets, fixed base/goal protection, locked/excluded and
unrequested keystone rewards, shared required paths, cycles, base edges,
cancellation, inactivity, zero-iteration fallback, deterministic output,
baseline retention, unique counting and signed-reward comparisons. Positive
attribute fixture text was corrected to use the real `+N to Strength` wording,
so randomized checks exercise positive as well as negative matched effects.

## Real-Tree Benchmark

```powershell
node --import tsx tools/research/weighted-bundle-benchmark.ts --compare exchanges
```

This compares exchange off/on with bundle lookahead on in both arms. The default
bundle benchmark explicitly disables exchanges to keep that ablation isolated.
Generated evidence is ignored under `var/weighted-exchanges-20261108/benchmark.json`;
rerunning replaces it. Requests, graph/solver/helper hashes, seeds, progress,
timings and absolute process peak RSS are retained.

The final capture has 44 fresh Node/tsx processes / 22 pairs: two synthetic
fixtures, three fixed-32-iteration seeds per real case and two common-500ms
checkpoint seeds per real case. Real inputs use PoE2 0.5.5f, Witch root and
generated goals, not imported human builds.

| Real case | Median score off/on | Median points off/on | Median solve ms off/on |
| --- | ---: | ---: | ---: |
| Compact 25, Attributes, +8 | 20 / 20 | 43 / 43 | 928.8 / 971.9 |
| Compact 25, Energy Shield, +8 | 17.33 / 17.33 | 43 / 43 | 908.2 / 913.4 |
| All 13 Minion Life goals, +8 | 26.1 / 26.1 | 58 / 58 | 788.2 / 762.0 |
| Compact 25, Minion Life, All Available | 33.5 / 33.5 | 103 / 103 | 1,503.1 / 1,537.3 |

All fixed-iteration quality comparisons tied. One Attributes checkpoint improved
19 to 19.2 at the same 43 points; the other checkpoints tied. Runtime differences
are small and host-sensitive, not significance tests. Maximum observed absolute
process RSS was 141.4 MiB off / 140.7 MiB on, including loader and graph.

An earlier capture that scheduled exchanges immediately had one 500ms quality
regression, alongside a slower baseline before exchanges even ran. Its evidence
is preserved in `benchmark-before-warmup.json`. The warmup prioritizes the
original early restarts, but no wall-time quality guarantee follows from these
small samples. Timed quality counts only preference-stage incumbents published
before the common cutoff; cooperative-stop overruns are excluded.

## Verification

- `npm run validate:release`: 2,166 tests / 98 files, typecheck, production build,
  graph validation and coverage baseline passed. The existing nonfatal bundle-size
  warning remains. The benchmark script separately typechecked.
- Edge worker smoke at 1600x1000: 13 Minion Life goals, 50-point shortest baseline,
  +8 allowance, weighted preview at 58 points / score 26.1; zoom during search,
  Cancel retaining preview, then Apply at 58/123 with all goals reached.
- No application console errors; the existing `/favicon.ico` 404 remains. Firefox
  was not retested. No commit, push, deployment, dependency install or game-data
  update was performed. Local server: `http://127.0.0.1:5174/`.

## Next Recommended Step

Build a small, reproducible real-build weighted regression corpus across several
class starts, imported PoB goal sets, preferences and point budgets. Compare
score, cost and time to improvement at practical fixed-time checkpoints before
adding more search neighborhoods. The generated Witch cases mostly tie, so
broader representative evidence is more useful now than another heuristic.

Follow-up: [the imported PoB benchmark](2026-11-08-imported-weighted-benchmark.md)
covers four distinct class starts and identifies point-cap and retained weapon-set
constraints as the next priority, ahead of additional search neighborhoods.

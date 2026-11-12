# Bounded Two-Branch Exchanges

Completed November 8, 2026, against the frozen PoE2 0.5.5f imported-build corpus.
Follow-up to [deep-search seed refresh](2026-11-08-weighted-seed-refresh.md).
Implemented locally; no commit, push or deployment in this task.

## Implementation

Weighted search can now remove two weaker optional branches together before
looking for a stronger connected replacement within the same point budget.

- The existing single-branch function is unchanged. Pair generation reuses its
  spanning-tree safety checks and branch ranking to obtain at most six candidates.
- At most 15 combinations are examined. Nested/overlapping subtrees are rejected;
  removed points and signed score loss are counted from their unique union.
- Remaining nodes/edges are intersected from the two individually safe removals.
  This preserves the root-connected spanning-tree remainder, including required
  paths and fixed base edges, even when additional edges form cycles.
- Duplicate resulting seeds are rejected. Candidates are ordered by combined lost
  score per freed point, then absolute loss, freed points and deterministic key.
  At most two seeds are returned per attempt, even if a caller asks for more.
- Pair attempts wait for pending refinement/refresh phases, start from iteration
  16 and have a 16-fast-restart cooldown. A settled initial incumbent gets an
  opportunity; later rounds require a meaningful score/cost revision. Signature-only
  ties do not continually retrigger work.
- The existing scheduler provides the work credit and time slices. Bounded recent
  incumbent/seed caches prevent repeated work. Only a better completed route is
  published; temporary branch removals are never allocation previews.

Point caps, required goals/base nodes, W1/W2 reservations and mandatory attachments
are unchanged. Weapon branches are not optimized. Scoring, graph data, shortest/
exact mode, the inactivity timer and visible controls are unchanged. An internal
`enablePairedBranchExchanges: false` option retains the previous search as control.

## Independent Fixture

The literal fixture has one mandatory point and a seven-point total budget. Two
selected weak branches cost three points each and score ten each. A stronger
connected bundle costs six points and scores 24; reaching its first positive node
already costs five points.

Removing one weak branch leaves only three points free, so no single removal can
improve the incumbent score of 20. Removing both frees six unique points and lets
the exchange refinement reach **24 at seven points**. Independent reward-subset
ancestor closure and raw-node-subset enumeration both prove that optimum.

The isolated optimizer test disables the separate baseline-bundle strategy and
observes 20 to 24 with pair exchanges enabled. With all strategies enabled, that
small graph already reaches 24 without pairs. The fixture therefore proves the new
exchange mechanism, not a claim that every complete search must improve.

Tests cover both budget modes, signed losses, nested subtrees, deduplication,
hard limits, cycles, base edges, protected goals/weapon attachments, cancellation
at dispatch and after improvement, inactivity expiry, cooldowns and unchanged
incumbents. Seed-refresh lifecycle tests explicitly disable pairs to retain their
original controlled timing; combined-mode tests and the frozen corpus cover the
new default. Existing independent reward oracles were not relaxed.

## Frozen Experiment

Reused the same four public captures, 24 cases, class roots/gates, original imported
goals, preference profiles, point budgets and weapon assignments/attachments. No
recapture, download, source repair or new exclusion was performed.

The paired arms are `single` (the previous balanced search with seed refresh) and
`current` (that search plus two-branch exchanges). Request hashes, shortest
baselines and selected point budgets match within every comparison.

- 24 cases, two seeds, two arms, common two-second cutoff, rotating arm order:
  96 matrix runs.
- Four All Available profiles at seed 1701 extended to ten seconds in both arms,
  rotating arm order: eight runs.
- Both Monk Attack/Speed seeds and Spark Spell/Cast tight at seed 1701, ten seconds
  in both arms: six diagnostic runs.
- **110 final timed runs**. Four development pilots are retained separately.

Independent raw-edge checks verified **345 preference-stage progress results** for
unique costs, required goals/attachments, main connectivity, reserved weapon-node
overlap and each weapon set's connection separately. Production validation also
checked published results and selectable alternatives.

All runs had **zero cap, weapon-overlap or detached-branch violations**. Warbringer
retains all 11 shared attachment nodes and stays within 99 main points. The other
builds remain within 123 main points.

## Results

Score first, then fewer points on a score tie, within an identical request:

| Pairs versus single-branch search, 2s | Improved | Tied | Behind | Missing incumbent |
| --- | ---: | ---: | ---: | ---: |
| 48 matched comparisons | 0 | 48 | 0 | 0 |

| Paired 10s case / seed | Single branch | With pairs | Points |
| --- | ---: | ---: | ---: |
| Spark ES/Mana available / 1701 | 18.00 | 18.00 | 123 |
| Warbringer Life/Armour available / 1701 | 17.67 | 17.67 | 99 |
| Huntress Evasion/Life available / 1701 | 17.50 | 17.50 | 123 |
| Monk Evasion/Life available / 1701 | 71.75 | **73.58** | 123 |
| Monk Attack/Speed available / 1701 | 113.33 | 113.33 | 123 |
| Monk Attack/Speed available / 42 | 114.00 | 114.00 | 123 |
| Spark Spell/Cast tight / 1701 | 20.87 | 20.87 | 121 |

The longer comparisons had one improvement, six ties and no regressions. Eighteen
pair dispatches submitted 33 seeds before their cutoffs across final runs. Not
every attempted pair yielded a better route, which is why the incumbent is retained.

The separate Monk pilot reached 72.58 without pairs and 73.58 with pairs. The final
control reached 71.75 instead. The pair-enabled score was reproduced, but the gain
must not be interpreted as a fixed 1.83: host load and cutoff timing materially
affect late discoveries. Only four underlying builds and related cases/seeds are
represented; these are not independent significance tests or universal guarantees.

First-baseline medians were about 168 ms in both arms; first preference-result
medians were about 472 ms single and 470 ms paired. Absolute process peak RSS was
about 307 MiB, including loader, graph and retained evidence, not isolated worker
memory. The largest outlier occurred in the single-branch control; both arms had
outliers above 300 MiB, so these measurements do not isolate pair-search memory cost.

Timing includes validation/baseline but excludes input loading and independent
post-checks. Quality excludes cooperative-stop overruns. General work counters may
include overrun work; the dispatch/seed totals above are filtered to cutoffs. These
are Node observations, not browser latency, Full DPS, whole-build viability or
proofs of global optimality.

## Verification and Evidence

- `npm run validate:release`: **2,213 tests in 102 files**, typecheck, production
  build, graph validation and unchanged coverage baseline passed. Existing
  bundle-size warning only.
- Five frozen-corpus checks and standalone research TypeScript checking passed.
- Twelve pre-edit single-branch control results remain exactly reproducible at
  fixed iterations/seeds. The existing single-branch function's source body is
  unchanged; pair generation is an additional helper.
- Eleven protected exact/scheduling/validation/constraint/scoring/preset/graph/
  original-evidence files remained byte-identical. Timed runtime fingerprints
  remained unchanged through the matrix and diagnostics.
- Edge smoke: import Warbringer, select Life/Armour, optimize to a 99-point preview,
  zoom, cancel and Apply. Result: 99 main points, 24 per weapon set, 123 total and
  eight ascendancy points. No application console errors; existing favicon 404 only.
  Firefox was not rerun.

Local raw evidence is isolated under ignored `var/paired-exchanges-20261108/`:
`benchmark/benchmark.json`, `benchmark/followups.json`,
`benchmark/results.partial.json`, `benchmark/verified-summary.json`, `pilots.json`,
`release.log`, pre-edit source/control snapshots and protected hashes. Screenshot:
`output/playwright/paired-exchanges-warbringer.png`. Earlier experiments and the
original frozen corpus remain unchanged.

Reproduce with a **fresh** output directory and no `--prepare`:

```powershell
node --test tools/research/imported-weighted-corpus.check.mjs
node --import tsx tools/research/imported-weighted-benchmark.ts --arms single,current --output var/paired-exchanges-20261108/rerun-02
node --import tsx tools/research/imported-weighted-benchmark.ts --case monk/evasion-life/available --arm current --seed 1701 --ms 10000
```

## Next Recommended Step

Add bounded preference-aware travel-corridor rerouting between required goals.
Optional-branch exchanges cannot replace a corridor whose subtree contains a
required goal. The shortest search already has a travel-chain reconnection idea,
but admits only shorter connections rather than equal-cost, higher-value ones.
Adapt that idea for weighted candidates, protecting goals, committed base edges,
weapon attachments and caps; retain shortest/exact behavior. Start with an
independent small cyclic-graph oracle fixture and repeat the paired frozen corpus.
This is suggested, not implemented in this batch.

Follow-up: [preference-aware corridor rerouting](2026-11-08-weighted-corridor-rerouting.md)
implements that step and records a new matched rerun. The measurements above remain
the original paired-exchange experiment, with its original source fingerprints.

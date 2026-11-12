# Weighted Deep-Search Seed Refresh

Subsequent work: [bounded two-branch exchanges and frozen rerun](2026-11-08-weighted-paired-exchanges.md).
The results below remain the original pre-pair experiment; the harness's `single`
arm now retains that search with seed refresh but without pair exchanges.

Completed November 8, 2026, against the frozen PoE2 0.5.5f imported-build corpus.
Follow-up to [balanced scheduling](2026-11-08-balanced-weighted-search.md).
Implemented locally; no commit, push or deployment in this task.

## Behavior

The existing balanced search keeps its initial bundle/exchange attempts. After
warmup, a meaningful best-route improvement can replenish deeper work:

- A higher preference score, or fewer points on a score tie, advances an improvement
  revision. Signature-only ties do not trigger refreshes.
- Improvements arriving during pending work are coalesced. The next round uses the
  latest best route, not a backlog of intermediate candidates.
- New rounds wait for pending refinement to finish and have a 16-fast-restart
  cooldown. This is an iteration allowance, not a 16-second timer or goal-count cap.
- A round can submit one bundle when points remain, followed by up to two optional
  branch-exchange seeds. Exchanges select the latest incumbent after bundle work
  finishes, preserving the ordering correction from the previous batch.
- Recent bundle seeds, exchange incumbents and pruned seeds are deduplicated with
  bounded 256-entry caches. An unchanged incumbent does not continually requeue.
- Jobs still use the existing bounded scheduler and fast-work credit. Dispatching
  a refresh does not reset the 60-second inactivity timer; a genuine route
  improvement does, using the existing policy.

The shared best-route archive, point caps, required goals/base edges and fixed
W1/W2 attachment protection remain in force. No scores, presets, shortest/exact
solver behavior, weapon branches or visible site controls changed. An internal
`enableSeedRefresh: false` option retains the pre-refresh balanced control.

## Independent Regression

A literal signed-reward tree starts at score **84** through 16 fast iterations.
A late improvement reaches **86**, and a fresh exchange is dispatched at iteration
32 despite the initial refinement allowance having retired. The separate raw-tree
reward-subset oracle proves **86 at 11 points** is optimal for this fixture.

The old fast search also reaches 86 here. This fixture proves the refresh lifecycle,
deduplication, valid incumbent retention and budget behavior, not an additional
score gain over control. The real-build timing experiment below provides the
observed quality-gain evidence.

Tests also cover Extra/All Available modes, cancellation before and during dispatch,
inactivity expiry without resetting the timer, unchanged incumbents, disabled
strategies, and refreshed work with fixed base edges and a reserved weapon node.
The control exactly reproduces eight pre-edit fixture results at fixed iterations
and seeds. Existing bundle and exchange reward oracles remain unchanged.

## Frozen Benchmark

Reused all four captured public builds, the same 24 cases, original imported goals,
class roots/gates, preference profiles, budgets, W1/W2 assignments and mandatory
attachments. No recapture, download, source repair or new exclusion was performed.

The paired arms are pre-refresh balanced scheduling and current scheduling with
refresh enabled. Their other search options, request hashes, baseline costs and
point budgets match.

- 24 cases, two seeds, two arms, common two-second cutoff, rotating arm order:
  **96 matrix runs**.
- Four All Available profiles at seed 1701 extended to ten seconds in both arms,
  rotating arm order: eight runs.
- Ten-second diagnostics for both Monk Attack/Speed seeds and Spark Spell/Cast
  tight at seed 1701, both arms: six runs.
- **110 final timed runs**. Four development pilots are retained separately and
  are not included in the final comparison counts.

Independent raw-edge checks verified **343 preference-stage progress results** for
unique costs, required goals/attachments, main connectivity, reserved weapon-node
overlap and each weapon set's connection separately. Production validation also
checked published results and selectable alternatives.

All runs had **zero cap, weapon-overlap or detached-branch violations**. Warbringer
retains all 11 mandatory attachment nodes and stays within 99 main points; the
other builds remain within 123 main points.

## Results

Compare score first, then fewer points on a score tie, within the same request:

| Refresh versus pre-refresh balanced, 2s | Improved | Tied | Behind | Missing incumbent |
| --- | ---: | ---: | ---: | ---: |
| 48 matched comparisons | 2 | 46 | 0 | 0 |

Both improvements were Spark Spell/Cast, seed 42: **26.07 to 27.20** at 123 points,
in capped Extra +5 and All Available. These two budget cases have the same effective
cap and are related observations, not independent builds.

| Paired 10s case / seed | Before | With refresh | Points |
| --- | ---: | ---: | ---: |
| Spark ES/Mana available / 1701 | 16.50 | **18.00** | 123 |
| Warbringer Life/Armour available / 1701 | 17.67 | 17.67 | 99 |
| Huntress Evasion/Life available / 1701 | 17.50 | 17.50 | 123 |
| Monk Evasion/Life available / 1701 | 72.17 | **72.58** | 123 |
| Monk Attack/Speed available / 1701 | 113.33 | 113.33 | 123 |
| Monk Attack/Speed available / 42 | 114.00 | 114.00 | 123 |
| Spark Spell/Cast tight / 1701 | 20.87 | 20.87 | 121 |

The seven longer paired comparisons therefore have two improvements, five ties and
no regressions. Twelve refresh dispatch events occurred before their run cutoffs
across final runs; one round can have separate bundle and exchange phase events.
Unchanged builds did not receive refresh work merely to keep the worker busy.

First-baseline medians were about 166 ms control and 165 ms refresh; first
preference-result medians were about 463 and 464 ms. Absolute process peak RSS
across final runs was about 207 MiB, including the loader, graph and retained
evidence, not isolated browser-worker memory.

Timing includes validation/baseline and excludes input loading and independent
post-checks. Quality checkpoints exclude cooperative-stop overruns. General work
counters can include overrun work; the dispatch count above is filtered to the
cutoffs. These are Node measurements, not browser latency or significance tests.
Only four underlying builds are represented, with related cases/seeds. No observed
regression is not a universal guarantee. Preference scores are not Full DPS, total
defence, whole-build viability or optimality proofs.

## Verification and Evidence

- `npm run validate:release`: **2,200 tests in 101 files**, typecheck, production
  build, graph validation and unchanged coverage baseline passed. Existing
  bundle-size warning only.
- Five frozen-corpus checks and standalone research TypeScript checking passed.
- Twelve protected exact/scheduling/exchange/validation/constraint/scoring/preset/
  graph/original-evidence files remained byte-identical. Timed runtime source
  fingerprints remained unchanged through the matrix and diagnostics.
- Edge smoke: import Warbringer, choose Life/Armour, optimize to a 99-point preview,
  zoom while running, cancel and Apply. Result: 99 main, 24 per weapon set, 123 total
  and eight ascendancy points. No application console errors; the existing favicon
  404 remains. Firefox was not rerun.

Raw evidence is isolated under ignored `var/seed-refresh-20261108/`:
`benchmark/benchmark.json`, `benchmark/followups.json`,
`benchmark/results.partial.json`, `benchmark/verified-summary.json`, `pilots.json`,
`release.log`, pre-edit control snapshots/hashes and fixture-discovery evidence.
Screenshot: `output/playwright/seed-refresh-warbringer.png`.
All earlier frozen corpus and balanced/allocation-safety results remain unchanged.

Reproduce with a **fresh** output directory and no `--prepare`:

```powershell
node --test tools/research/imported-weighted-corpus.check.mjs
node --import tsx tools/research/imported-weighted-benchmark.ts --arms balanced,current --output var/seed-refresh-20261108/rerun-02
node --import tsx tools/research/imported-weighted-benchmark.ts --case monk/evasion-life/available --arm current --seed 1701 --ms 10000
```

## Next Recommended Step

Add bounded two-branch exchanges: remove two weaker optional branches together when
neither single removal frees enough points for a stronger connected reward bundle.
Keep required goals/base/weapon attachments fixed, deduplicate overlapping subtree
pairs and retain the current scheduler and point caps. Start with an independent
small-graph oracle fixture, then repeat the paired frozen corpus. This is suggested,
not implemented in this batch.

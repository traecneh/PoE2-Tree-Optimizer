# Balanced Weighted Search Scheduling

Subsequent work: [deep-search seed refresh and frozen rerun](2026-11-08-weighted-seed-refresh.md).
The measurements below remain the original pre-refresh experiment; the harness's
`balanced` arm now retains that schedule without refresh for comparison.

Completed November 8, 2026, against the frozen PoE2 0.5.5f imported-build corpus.
Follow-up to [allocation safety](2026-11-08-allocation-safety.md).
Implemented locally; no commit, push or deployment in this task.

## Implementation

Weighted search retains its existing fast restart strategy, bundle lookahead,
optional-branch exchanges, candidate ordering and common best-route archive.
The change is how these strategies share time:

- Bundle expansion and completion are resumable generator jobs, rather than one
  blocking block of refinement work between greedy restarts.
- Fast restart work earns refinement credit at a 2:1 ratio. While jobs are pending,
  this targets roughly two thirds fast work and one third deeper work. When no
  refinement is pending, fast restarts use the available time.
- Each refinement turn has a 16 ms time slice and a work-step guard. One indivisible
  graph-search step can overrun the slice; this is not a hard real-time guarantee.
  Pending jobs rotate rather than one job draining the whole queue.
- Exchanges wait until pending refinements finish before selecting their incumbent.
  This avoids spending the limited exchange attempts on an intermediate route that
  a queued bundle is still improving.
- Every strategy submits to the same validated, monotonic best-route archive.
  Cancellation, required goals, fixed base nodes, main point caps, W1/W2 reservations
  and their mandatory attachments remain enforced.
- Fixed-iteration tests use deterministic work quanta instead of host-speed timing.
  Internal legacy-schedule and work-counter options support research only; no new
  site setting or visible scoring explanation was added.

The shortest/exact solver, scoring rules, skill/support presets, graph and safety
contract were not changed. The existing 60-second no-improvement timer is unchanged.
No actual PoB DPS calculation or weapon-branch optimization was introduced.

## Development Finding

An initial four-arm rerun compared greedy, bundle-only, the old combined schedule
and the first interleaved schedule. Across 48 paired two-second comparisons with
the old combined schedule, the first attempt improved one, tied 45 and fell behind
two. The two deficits were Monk Attack/Speed, at both seeds, and persisted in
ten-second diagnostics.

Inspection and work traces showed that exchanges could consume their limited
incumbent attempts while bundle work was still pending. Deferring exchanges until
pending refinement completes restored those Attack/Speed scores. Regression tests
cover interleaving, ordering, cancellation, work credit, bounded turns, determinism
and the independent bundle/exchange reward fixtures.

The initial evidence was not overwritten or omitted. It contains 208 timed runs
under `var/balanced-search-20261108/benchmark/`, plus nine separately recorded
development pilots in `pilots.json` and `revised-pilots.json`. The final rerun below
is separate and uses the corrected source. This is an iterative correction, not
an independent statistical discovery/confirmation experiment.

## Final Frozen Rerun

Reused the same four public source captures, original imported goals, class roots,
gates, preferences, budgets, weapon sets and attachment boundaries. No recapture,
source repair, download or case exclusion was performed.

The final experiment focused on the changed scheduling policy:

- All 24 cases, both seeds, two freshly run paired arms: legacy and balanced.
- A common two-second cutoff and rotating arm order: 96 matrix runs.
- Four balanced-only ten-second All Available followups, one per build.
- Eight paired ten-second diagnostics: both Monk Attack/Speed seeds, Spark
  Spell/Cast tight and Monk Evasion/Life All Available at seed 1701.
- **108 final timed runs**, with identical request hashes, baseline costs and point
  budgets in matched groups. The unchanged greedy/bundle ablations were not repeated
  in this final pass; their first-pass results are not relabeled as final results.

Independent raw-edge checks verified **333 preference-stage progress results** for
unique costs, required goals/attachments, main connectivity, reserved weapon-node
overlap and each weapon set's connection separately. Production validation also
checked the published results and their selectable alternatives.

All final runs had **zero point-cap, weapon-overlap or detached-branch violations**.
Warbringer retains all 11 shared attachment nodes and stays within 99 main points.
The other three builds remain within 123 main points.

## Final Results

Score first, then fewer points on a score tie, within the same request only:

| Balanced versus legacy, 2s | Improved | Tied | Behind | Missing incumbent |
| --- | ---: | ---: | ---: | ---: |
| 48 matched comparisons | 1 | 47 | 0 | 0 |

The improvement was Monk Evasion/Life All Available, seed 1701: **70.83 to 71.25**
at 123 points. The work counters recorded 28 fast restarts for balanced versus 20
for legacy. Work counters include cooperative-stop overrun work; quality uses only
incumbents published before the cutoff.

Both Monk Attack/Speed seeds matched legacy in the final matrix: **113.33** and
**114.00**, at 123 points. All paired ten-second diagnostics also tied:

| Case / seed | Legacy score | Balanced score | Points |
| --- | ---: | ---: | ---: |
| Monk Attack/Speed / 1701 | 113.33 | 113.33 | 123 |
| Monk Attack/Speed / 42 | 114.00 | 114.00 | 123 |
| Spark Spell/Cast tight / 1701 | 20.87 | 20.87 | 121 |
| Monk Evasion/Life available / 1701 | 72.17 | 72.17 | 123 |

Within the same balanced-only ten-second run, seed 1701 and All Available:

| Profile | Score at 2s | Score at 10s | Points |
| --- | ---: | ---: | ---: |
| Spark ES/Mana | 12.00 | 16.50 | 123 |
| Warbringer Life/Armour | 17.67 | 17.67 | 99 |
| Huntress Evasion/Life | 17.50 | 17.50 | 123 |
| Monk Evasion/Life | 71.25 | 72.17 | 123 |

First-baseline medians were about 165 ms legacy and 162 ms balanced; first
preference-result medians were about 461 and 457 ms. Absolute process peak RSS
across final runs was about 207 MiB, including the loader, graph and retained
evidence, not isolated worker memory. Timing includes validation/baseline but
excludes input loading and independent post-checks. These are Node observations,
not browser latency measurements.

The cases include related profiles, budgets and seeds from only four builds.
Host/GC variation remains material: in a later Attack/Speed followup, a balanced
improvement arrived just after two seconds despite arriving before two seconds in
the matrix. No observed regression in the final matrix is not a universal quality
guarantee. Preference scores are not Full DPS, build viability or optimality proofs.

## Validation and Evidence

- Final `npm run validate:release` passed: **2,193 tests in 100 files**, typecheck,
  production build, graph validation and unchanged coverage baseline. Existing
  bundle-size warning only.
- Five frozen-corpus checks and standalone research TypeScript checking passed.
- The legacy control exactly reproduced four pre-edit fixture results at fixed
  iterations/seeds. Existing independent 12-to-20 bundle and 62-to-63 exchange
  reward oracles still pass; no oracle or reward definition was relaxed.
- Ten protected exact/validation/constraint/scoring/preset/graph/original-evidence
  files remained byte-identical. Final timed solver fingerprints also remained
  unchanged through the matrix and followups.
- Final Edge smoke: import Warbringer, choose Life/Armour, optimize, wait for a
  99-point preview, cancel and Apply. Result: 99 main points, 24 per weapon set,
  123 total and eight ascendancy points. No application console errors; the existing
  favicon 404 remains. Firefox was not rerun.

Final raw evidence: `var/balanced-search-20261108/final-benchmark/benchmark.json`,
`followups.json`, `results.partial.json` and `verified-summary.json`. Final release
log: `var/balanced-search-20261108/release-final.log`. All earlier corpus, allocation
safety and first-attempt evidence remains intact. These raw artifacts are local and
ignored by Git; this report and the research harness describe their provenance.

Reproduce using a **fresh** output directory, without `--prepare`:

```powershell
node --test tools/research/imported-weighted-corpus.check.mjs
node --import tsx tools/research/imported-weighted-benchmark.ts --arms legacy,current --output var/balanced-search-20261108/rerun-02
node --import tsx tools/research/imported-weighted-benchmark.ts --case monk/attack-speed/available --arm current --seed 42 --ms 10000
```

## Next Recommended Step

Refresh deep-search seeds after meaningful best-route improvements, rather than
exhausting the small initial seed allowance and leaving the rest of a long run to
fast restarts alone. Use the bounded scheduler, deduplication and current allocation
safety contract; leave scores, point budgets, exact mode and weapon branches alone.
Add a late-improvement regression fixture and repeat the focused paired corpus.
This follow-up is suggested, not implemented here.

# Preference-Aware Corridor Rerouting

## Scope

Added a bounded weighted-mode pass for replacing travel corridors that connect
required goals. Unlike optional-branch exchanges, it can remove a connector even
when that connector leads to a required goal, provided a complete replacement
reconnects every retained node. The shortest and exact solver, graph, scoring,
skill/support presets, available point caps and weapon-allocation rules are
unchanged. No new UI control is required.

`weightedCorridorReroute.ts` extracts degree-two travel chains between required
nodes, committed base nodes and junctions. It ranks weaker connectors first and
tries at most four required-separating corridors per pass, with four routing
strengths each. Optional-only branches and redundant cycles do not consume that
four-corridor allowance.

Required/base nodes, committed base edges and shared weapon attachments cannot be
removed; reserved weapon nodes, exclusions, locked nodes and unrequested special
nodes remain blocked. Every proposed replacement is checked for full connectivity
and its unique added-node cost before whole-route scoring. An improvement means
higher score, or fewer points at an equal score, within the existing allowance.
The best-so-far archive is retained throughout.

Proposal costs use signed affine preference discounts with a positive floor. This
can cross a modest negative-effect gateway for a stronger connected route without
introducing negative Dijkstra costs. These costs only propose paths; final score
still includes every selected node's signed effects using the existing catalog.
An over-budget proposal is discarded rather than treated as a valid route.

The existing balanced scheduler runs the resumable pass after pending deeper work
has settled, with a 16-fast-iteration warmup/cooldown and meaningful-incumbent
revision gate. An unchanged node set is not repeatedly queued. Each routing
proposal yields, including rejected proposals; one atomic graph search can still
overrun a scheduler slice. Dispatch alone does not reset the inactivity deadline.
The pass keeps junctions fixed and does not claim exhaustive or globally optimal
weighted routing.

## Independent Regression Evidence

A small cyclic graph has two goals sharing a junction. Its current connector
costs five points and scores zero. The alternative connector costs the same five
points and scores six. The corridor pass reaches **0 to 6 at five points**, and an
independent raw-node-subset oracle proves that optimum. Neither optional single-
nor paired-branch removal can delete the required connector in this fixture.

A longer variant includes a negative-effect gateway: the best score is five at
six points, but zero when capped at five. The pass finds the stronger route only
when that extra point is authorized. The earlier reciprocal proposal metric
over-penalized this gateway; the affine proposal costs resolve that case without
changing the oracle or the actual effect scores.

These fixtures demonstrate the new move in isolation. Existing greedy strategies
can already find their optimum in the combined search; they are not evidence of
an additional default-search gain on every build.

Fifteen tests cover both budget modes, signed effects, committed base nodes/edges,
shared-junction deduplication, blocked/locked/special nodes, fixed weapon nodes and
attachments, malformed/disconnected inputs, cycles, bounded work, cancellation,
inactivity expiry, unchanged-incumbent deduplication and immutable inputs.

## Frozen Experiment

Reused the original four public captures and 24 class/profile/budget cases without
recapturing sources or changing goals, preferences, root starts, selected gates,
weapon assignments or the three existing incompatible-export exclusions.

The paired arms are `paired` (all earlier searches, including seed refresh and
two-branch exchanges, with corridors disabled) and `current` (the same search plus
corridor rerouting). Both use fresh serial Node processes and the same cutoffs.

- 24 cases, two seeds, two arms, two-second common cutoff, rotating arm order:
  96 matrix runs.
- Four first-profile All Available cases extended to ten seconds in both arms:
  eight runs.
- Monk Attack/Speed All Available for both seeds and Spark Spell/Cast tight at
  seed 1701 extended to ten seconds in both arms: six diagnostic runs.
- Four development pilots are retained separately, not added to final totals.

**110 final timed runs** checked 350 preference-stage progress results against raw
edges, unique node costs, required goals/attachments and per-weapon-set
connectivity. Production validation also checks published selectable alternatives.
Request hashes, shortest baselines and point budgets match within every comparison.
There were **zero cap, reserved weapon-node overlap or detached-branch violations**.
Warbringer retains all 11 shared attachment nodes within 99 main points; the other
builds remain within 123 main points.

## Results

Quality compares preference score first, then fewer points on a score tie, within
an identical request. These are heuristic preference scores, not PoB Full DPS.

| Corridors versus previous search, 2s | Improved | Tied | Behind | Missing incumbent |
| --- | ---: | ---: | ---: | ---: |
| 48 matched comparisons | 1 | 47 | 0 | 0 |

The short improvement was Monk Attack/Speed All Available, seed 1701: score
113.33 at **122 points instead of 123**. Its lower-cost incumbent was published at
about 1.987 seconds, shortly after a corridor pass was dispatched at 1.975 seconds.
It is close to the cutoff; it should not be treated as a guaranteed two-second
discovery on every host.

| Paired 10s case / seed | Previous score | With corridors | Points, previous / new |
| --- | ---: | ---: | ---: |
| Spark ES/Mana available / 1701 | 18.00 | 18.00 | 123 / 123 |
| Warbringer Life/Armour available / 1701 | 17.67 | 17.67 | 99 / 99 |
| Huntress Evasion/Life available / 1701 | 17.50 | 17.50 | 123 / 123 |
| Monk Evasion/Life available / 1701 | 73.58 | 73.58 | 123 / 123 |
| Monk Attack/Speed available / 1701 | 113.33 | **114.00** | 123 / 123 |
| Monk Attack/Speed available / 42 | 114.00 | 114.00 | 123 / 123 |
| Spark Spell/Cast tight / 1701 | 20.87 | 20.87 | 121 / 121 |

The longer comparisons had **one improvement, six ties and no regressions**. The
seed-1701 corridor-enabled Attack/Speed run reached 114.00 around 2.275 seconds.
The same score is already reachable by the control with seed 42: the result shows
a useful search improvement for this case/seed, not a newly proven global optimum.
The two development pilot pairs tied, separately from the final totals.

There were 68 corridor dispatches before the common cutoffs across final runs.
Most attempts did not improve a route. First-baseline median latency was about
158 ms in both arms; first preference-result medians were about 441 ms in both.
Peak process RSS was about 314 MiB for the control and 321 MiB with corridors.
These absolute peaks include the loader, graph and retained evidence; they do not
isolate worker memory or establish a statistically significant memory difference.

Timing includes validation/baseline but excludes input loading and independent
post-checks. Quality excludes cooperative-stop overruns. General work counters can
include overrun work; dispatch totals above are filtered to cutoffs. Host load and
GC affect timing. Four underlying builds with related profiles/seeds are not
independent significance tests, universal performance guarantees, browser latency
measurements or whole-build viability checks.

## Verification

- `npm run validate:release`: **2,228 tests in 103 files**, type checking,
  production build, graph validation and unchanged coverage baseline passed.
  Existing bundle-size warning only.
- Five frozen-corpus checks and standalone research TypeScript checking passed.
- Sixteen pre-edit controls reproduce exactly with corridor rerouting disabled.
- Twelve protected solver/scheduler/validation/constraint/scoring/preset/graph/
  original-evidence files remain byte-identical. Nine runtime source fingerprints
  remain unchanged through the matrix and diagnostics.
- Edge smoke: import Warbringer, choose Life/Armour, optimize a 99-point preview,
  zoom, cancel and Apply. Result: 99 main, 24 points per weapon set, 123 total,
  eight ascendancy points. No application console errors; existing favicon 404
  only. Firefox was not rerun.
- Screenshot: `output/playwright/corridor-rerouting-warbringer.png`.

Raw evidence is isolated under ignored `var/corridor-rerouting-20261108/`:
`benchmark/benchmark.json`, `benchmark/followups.json`,
`benchmark/results.partial.json`, `benchmark/verified-summary.json`, `pilots.json`,
`release.log`, pre-edit controls/source snapshots and protected hashes. Earlier
experiments and the original frozen corpus remain unchanged.

Reproduce with a fresh output directory and no `--prepare`:

```powershell
node --test tools/research/imported-weighted-corpus.check.mjs
node --import tsx tools/research/imported-weighted-benchmark.ts --arms paired,current --output var/corridor-rerouting-20261108/rerun-02
node --import tsx tools/research/imported-weighted-benchmark.ts --case monk/evasion-life/available --arm current --seed 1701 --ms 10000
```

The harness's `current` arm now includes corridors. Historical results should be
interpreted using their retained fingerprints, not as runs of today's source.

## Next Recommended Step

Add bounded preference-aware shared-junction relocation. This pass deliberately
keeps junctions fixed, so it cannot replace an entire branching connector whose
better version moves the shared junction. Start with a small three-goal graph
whose independent optimum requires that move; preserve committed base nodes and
edges, goals, weapon attachments and caps. Then compare the new move against this
corridor-enabled control on the same frozen corpus before making broader claims.
Keep shortest/exact unchanged. This is a recommendation, not implemented here.

Follow-up: [bounded shared-junction relocation](2026-11-08-weighted-junction-relocation.md)
implements that step and records a new matched rerun. The measurements above remain
the original corridor experiment with its original retained source fingerprints.

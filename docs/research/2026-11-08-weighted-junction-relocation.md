# Bounded Preference-Aware Shared-Junction Relocation

## Scope

Added a weighted-mode refinement that can replace an unprotected branching
junction and its travel arms. Corridor rerouting keeps junctions fixed; this pass
can move the shared connection between several required goals. Shortest/exact
routing, effect scoring, skill/support presets, graph data, point caps and weapon
allocation rules remain unchanged. No new UI controls were added.

`weightedJunctionRelocation.ts` considers allocated degree-three/four junctions
that are not required goals, committed base nodes or protected weapon attachments.
It removes the junction and its degree-two arms up to fixed boundary nodes. A
neighborhood is eligible only when its removal separates three or four retained
components, at least three containing required nodes. All boundary nodes and
remaining edges stay allocated, including retained optional rewards and cycles.

At most two eligible neighborhoods are searched per pass, weakest signed value
per removed node first. Each uses four preference strengths. Multi-source searches
from each retained component rank up to three alternative junctions, reconstruct
their shared paths, and count actual unique nodes rather than summing path lengths.
The per-pass bound is **32 graph searches and 24 reconstruction proposals**;
searches and proposals yield separately to the existing balanced scheduler.

The positive-floor affine proposal costs are the same idea as the preceding
corridor pass, not a change to final scoring. Whole-route signed effect score and
unique added-point cost decide whether a candidate is useful. Over-budget,
disconnected, excluded, locked or reserved-weapon-node candidates are rejected.
Committed base edges and every required goal/attachment remain present. The
best-so-far archive is not replaced by a weaker candidate.

Dispatch waits for pending deeper work, uses a 16-fast-iteration warmup/cooldown,
and is gated by meaningful best-route revisions. A bounded recent-incumbent cache
avoids repeating unchanged node sets. Dispatch does not reset the inactivity
deadline; one atomic graph search can overrun a scheduler slice. The pass runs in
the existing optimizer worker, not the pan/zoom UI thread.

This is a bounded heuristic, not a global optimum proof. It does not remove
required junctions, search degree-five-or-higher neighborhoods, move several old
junctions at once, or explicitly target merging into an already retained junction.
New meeting-point proposals are outside the retained allocation; their paths may
share retained nodes and other connectors.

## Independent Regression Evidence

The three-goal fixture has two alternative four-arm stars. The incumbent star
scores zero at eight points. Relocating its center reaches **six at the same eight
points**, counting the shared center once. Raw-node-subset enumeration with literal
rewards independently proves that optimum. Optional paired-branch exchange cannot
remove a branch containing a required goal, and corridor-only rerouting cannot
replace one arm within this budget; the new move handles the whole junction.

A longer variant crosses a negative-effect gateway and reaches score five at
nine points. At eight points the independent optimum remains zero and the longer
proposal is rejected. A separate fixture covers degree-three junctions, and a
cyclic retained-component case verifies complete connectivity after replacement.

Seventeen tests cover both budget modes, signed effects, unique shared costs,
paid base nodes/edges, required junctions, blocked/locked/special nodes, weapon
reservations/attachments, malformed inputs, work bounds, cancellation, inactivity,
unchanged-incumbent deduplication and immutable inputs. The combined production
search can already solve the small oracle graph through other strategies; the
fixture proves the relocation mechanism, not a guaranteed new default-search gain.

## Frozen Experiment

The corpus is unchanged: four public captures, four physical class roots, eight
profiles and three budget modes, with original imported goals, class/gate metadata,
weapon assignments, shared attachments and the same three excluded exports.
Nothing was recaptured, downloaded, repaired or newly excluded.

`corridor` is the pre-edit control with every previous search enabled and junction
relocation disabled. `current` additionally enables relocation. The paired runs use
fresh serial Node processes, rotating arm order and equal cutoffs:

- 24 cases, two seeds, two arms, two-second common cutoff: 96 matrix runs.
- Four first-profile All Available cases extended to ten seconds in both arms:
  eight runs.
- Monk Attack/Speed All Available with both seeds and Spark Spell/Cast tight at
  seed 1701, ten seconds in both arms: six diagnostic runs.
- Four development pilots are retained separately, not counted as final runs.

**110 final planned runs** checked 351 preference-stage progress results for
unique costs, required goals/attachments, main connectivity, reserved-node overlap
and each weapon set's connection. Production validation also checked published
selectable alternatives. Request hashes, shortest baselines and point budgets
match within every comparison.

There were **zero cap, reserved weapon-node overlap or detached-branch violations**.
Warbringer retains all 11 shared attachment nodes within 99 main points; the other
builds remain within 123 main points. Four additional short-cutoff diagnostic
repeat runs are retained separately, as are the four development pilots.

## Results

Quality means preference score first, then fewer points on a score tie, within an
identical request. These are heuristic effect scores, not PoB Full DPS.

| Relocation versus corridor-enabled control, 2s | Improved | Tied | Behind | Missing incumbent |
| --- | ---: | ---: | ---: | ---: |
| 48 matched comparisons | 0 | 47 | 1 | 0 |

The behind case was Monk Attack/Speed All Available, seed 1701: 112.33 versus
113.33 at 123 points. Neither arm had dispatched corridor or junction work by
that cutoff. The relocation-enabled process's first baseline arrived at about
672 ms versus 556 ms in the control, so this result does not isolate relocation
cost or establish a relocation-caused regression.

Two separate repeat pairs, with arm order reversed between pairs, both tied at
113.33 and 122 points by two seconds; neither dispatched junction work. The
original matrix shortfall is retained rather than replaced with these repeats.

| Paired 10s case / seed | Control score | With relocation | Points, control / new |
| --- | ---: | ---: | ---: |
| Spark ES/Mana available / 1701 | 18.00 | 18.00 | 123 / 123 |
| Warbringer Life/Armour available / 1701 | 17.67 | 17.67 | 99 / 99 |
| Huntress Evasion/Life available / 1701 | 17.50 | 17.50 | 123 / 123 |
| Monk Evasion/Life available / 1701 | 73.58 | 73.58 | 123 / 123 |
| Monk Attack/Speed available / 1701 | 114.00 | 114.00 | 123 / 123 |
| Monk Attack/Speed available / 42 | 114.00 | 114.00 | 123 / 123 |
| Spark Spell/Cast tight / 1701 | 20.87 | 20.87 | 121 / 121 |

All seven longer pairs tied. In the seed-1701 Attack/Speed follow-up, the control
reached 114.00 at about 2.327 seconds and relocation-enabled search at 2.414 seconds.
The pilot pairs also tied. There were 64 junction-pass dispatches before final
cutoffs; a dispatch does not imply a successful relocation or quality improvement.

The independent fixture establishes a new valid move, but these imported builds
show **no additional preference-score or point-cost gain from this pass**. The
small corpus does not justify a broad claim of faster or better optimization.

Across final runs, first-baseline medians were about 161 ms control and 163 ms
with relocation; first preference-result medians were about 459 ms and 458 ms.
Absolute peak process RSS was about 320 MiB and 321 MiB respectively. These peaks
include loader, graph and retained evidence; they do not isolate worker memory.

Timing includes validation/baseline but excludes input loading and independent
post-checks. Quality excludes cooperative-stop overruns. General work counters
can include overrun work; dispatch counts above are filtered to cutoffs. Host load,
GC and cutoff timing vary. Four related build/profile/seed families are not
independent significance tests, browser-latency measurements, global optimality
proofs or whole-build viability checks. The ten-second results also do not prove
the searches would remain tied over the site's longer inactivity window.

## Verification

- `npm run validate:release`: **2,245 tests in 104 files**, type checking,
  production build, graph validation and unchanged coverage baseline passed.
  Existing bundle-size warning only.
- Five frozen-corpus checks and standalone research TypeScript checking passed.
- Sixteen pre-edit controls reproduce exactly with junction relocation disabled.
- Thirteen protected solver/scheduler/validation/constraint/scoring/preset/graph/
  original-evidence files remain byte-identical. Ten runtime source fingerprints
  remain unchanged through matrix, follow-ups and targeted repeats.
- Edge smoke: import Warbringer, select Life/Armour, optimize a 99-point preview,
  zoom, cancel and Apply. The result retains 99 main points, 24 per weapon set,
  123 total and eight ascendancy points. No application console errors; existing
  favicon 404 only. Firefox was not rerun.
- Screenshot: `output/playwright/weighted-junction-warbringer.png`.

Raw evidence is isolated under ignored `var/weighted-junction-20261108/`:
`benchmark/benchmark.json`, `benchmark/followups.json`,
`benchmark/results.partial.json`, `benchmark/verified-summary.json`, `pilots.json`,
`cutoff-repeats.json`, `release.log`, pre-edit controls/source snapshots and
protected hashes. Earlier experiments and the original frozen corpus are unchanged.

Reproduce with a fresh output directory and no `--prepare`:

```powershell
node --test tools/research/imported-weighted-corpus.check.mjs
node --import tsx tools/research/imported-weighted-benchmark.ts --arms corridor,current --output var/weighted-junction-20261108/rerun-02
node --import tsx tools/research/imported-weighted-benchmark.ts --case monk/attack-speed/available --arm current --seed 1701 --ms 10000
```

The harness's `current` arm now includes junction relocation. Historical results
must be interpreted with their original retained source fingerprints.

## Next Recommended Step

Add a versioned held-out benchmark batch with minion and damage-over-time builds,
partially allocated bases and a few longer convergence runs. Keep the present
frozen corpus intact as the regression control. Most current comparisons have
plateaued, so broader inputs would provide better evidence for choosing the next
search change than immediately adding another operator or tuning to one cutoff.
Only extend the algorithm once a reproducible route-quality gap is demonstrated.
This is recommended, not implemented in this batch.

Follow-up: [weighted holdout benchmark v1](2026-11-08-weighted-holdout-benchmark.md)
adds that separate corpus, committed-base scenarios and 60-second comparisons.
The measurements above remain the original junction experiment.

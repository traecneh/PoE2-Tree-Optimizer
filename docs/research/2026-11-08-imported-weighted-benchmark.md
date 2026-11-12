# Imported PoB Weighted Benchmark

Historical pre-constraint results. The subsequent
[allocation-safety implementation and frozen rerun](2026-11-08-allocation-safety.md)
address the cap and weapon-attachment findings below. The harness now enforces
those constraints and writes to a fresh output directory; these original evidence
files and measurements are preserved.

Completed November 8, 2026, on the existing PoE2 0.5.5f graph, Windows and Node
22.18.0. Optimizer, scoring, preset and importer code were not changed. No site
deployment, browser change, native PoB calculation or private-build discovery.

## Captured Inputs

Four public exports were decoded with the site's actual importer. Class metadata,
selected ascendancy/gates, exact imported goals and weapon-set assignments were
retained. Full source bytes/XML, hashes and compatibility reports are captured
under ignored `var/weighted-corpus-20261108/`. Public download hashes are locked
in `tools/research/imported-weighted-sources.lock.json`; changed shares require
explicit review, not silent replacement.

| Public snapshot | Start | Goals | Original shared / W1 / W2 points | Available main cap |
| --- | --- | ---: | --- | ---: |
| [Spark](https://poe.ninja/poe2/pob/28df3) | Sorceress - Stormweaver | 31 | 121 / 0 / 0 | 123 |
| [Earthshatter totems](https://poe.ninja/poe2/pob/2b47e) | Warrior - Warbringer | 24 | 96 / 24 / 24 | 99 |
| [Rarity/support](https://poe.ninja/poe2/pob/1e9d0) | Huntress - Ritualist | 25 | 119 / 0 / 0 | 123 |
| [Progression](https://poe.ninja/poe2/pob/1c002) | Monk - Martial Artist | 8 | 36 / 0 / 0 | 123 |

These span four distinct physical roots. The Monk All Available case projects to
the tool's endgame cap, not the points available at that character's current level.
The Warbringer's PoB base count is 120, not its 96 shared points: weapon accounting
must stay separate. Starts and ascendancies are not charged as main points.

Three other inputs were excluded before timing, without repairing them:
[Tactician](https://poe.ninja/poe2/pob/1dc96), transformed passives;
[Invoker](https://poe.ninja/poe2/pob/2560b), an unallocated jewel-socket reference;
[older Monk](https://poe.ninja/poe2/pob/1bf9e), unsupported tree version.
Accepted preflights retain warnings, including custom modifiers, unresolved
item-grant coverage and limited calculations. Ready means allocation-compatible
for this scoped experiment, not that the entire build is modeled.

## Method

- Two manual preference profiles per build: ES/Mana and Spell/Cast; Life/Armour
  and Totems; Evasion/Life and Attributes/Presence; Evasion/Life and Attack/Speed.
  Exact preferences and weights are in the captured corpus. No skill/support
  inference or actual offence/defence calculation is introduced.
- Three budgets: shortest-baseline-found +0, +5, and All Available. Each starts
  with only its class root and requires every imported goal. Existing site
  semantics are reproduced, including Extra mode's lack of a total-point cap.
- Three arms: earlier weighted greedy search; bundle lookahead; current search
  with bundle lookahead and optional-branch exchanges. The same shortest baseline
  engine remains enabled in all arms; shortest mode itself is not being ablated.
- 24 cases, two seeds, three arms: 144 fresh serial processes at a common two-second
  cutoff, with rotating arm order. Four current-only ten-second followups and six
  targeted ten-second comparisons bring the recorded total to **154 timed runs**.
- Timing includes public validation and baseline search, but excludes input loading
  and independent post-checks. Quality uses only preference-stage results published
  before the common cutoff; cooperative-stop overrun candidates are excluded.
- Each matched group has identical request hashes, baseline costs and point budgets.
  Independent raw-edge checks verify connectivity, unique costs, required nodes,
  weapon overlap and per-set attachment; the production validator also checks every
  recorded progress result and alternative. Preference parsing is not independently
  reimplemented, nor is this an audit of PoB Full DPS or build viability.

## Two-Second Results

Compare score first, then fewer points on a score tie, within the same case only.
Scores across different preference profiles are not comparable.

| Current search versus | Improved | Tied | Behind |
| --- | ---: | ---: | ---: |
| Earlier weighted greedy | 4 | 41 | 3 |
| Bundle lookahead without exchanges | 4 | 44 | 0 |

Only 28 matched groups pass the point-cap and reserved-weapon checks in every arm.
In that subset, current versus greedy is **3 improved / 22 tied / 3 behind**;
current versus bundles is **3 improved / 25 tied / 0 behind**. This does not prove
general superiority; short wall-time budgets displace different restart counts.

Examples that pass these allocation checks:

| Case / seed | Greedy score | Bundles score | Current score | Points |
| --- | ---: | ---: | ---: | ---: |
| Spark Spell/Cast, All Available / 1701 | 23.07 | 23.07 | 24.07 | 123 |
| Monk Attack/Speed, All Available / 1701 | 104.93 | 112.33 | 113.33 | 123 |
| Monk Attack/Speed, All Available / 42 | 104.93 | 113.33 | 114.00 | 123 |

First baseline medians were approximately 169-170 ms in all three arms; first
preference-stage medians were 477 ms. These are Node measurements, not browser
interaction latency. Absolute peak RSS reached about 359 MiB in a longer run,
including the loader, graph, temporary solver data and retained benchmark evidence;
it is not an isolated worker-memory measurement. Host load and runtime/GC noise
remain relevant; these small samples are not significance tests.

## More Time Helps, But Not Always

Within the same current-search ten-second run, same seed and All Available budget:

| Profile | Score at 2s | Score at 10s | Points |
| --- | ---: | ---: | ---: |
| Spark ES/Mana | 12.00 | 16.50 | 123 |
| Warbringer Life/Armour | 23.67 | 24.50 | 99 |
| Huntress Evasion/Life | 17.50 | 17.50 | 123 |
| Monk Evasion/Life | 70.83 | 72.17 | 123 |

The Warbringer result still fails the weapon-attachment check; its higher score
is not a usable whole-build improvement. The Monk's last recorded improvement
arrived about 8.24 seconds into its run.

Targeted ten-second rechecks of the two early-regression cases showed:

- Spark Spell/Cast, tight budget: all arms reached score 20.87 at 121 points.
  The earlier two-second current/bundle deficit did not recur in this followup,
  illustrating timing sensitivity rather than proving a fixed algorithmic loss.
- Monk Evasion/Life, All Available: greedy reached 72.50 versus 72.17 for bundles
  and current, all at 123 points. More search machinery is not uniformly better
  at a fixed wall time. These targeted rechecks are not an independent sample.

Benchmark time limits do not change the site's existing 60-second no-improvement
timer. None of these comparisons establishes a global optimum or actual DPS gain.

## Constraint Findings

1. **Extra-point mode can exceed the available main cap.** Eight of the 48 current
   matrix outputs do so. Spark +5 uses 126/123; Huntress +5 uses 124/123. These
   are flagged, not silently capped or counted as playable wins. All Available
   respects the supplied 123 or weapon-adjusted 99-point cap in these runs.
2. **Imported weapon sets are not preserved as routing constraints.** All twelve
   current Warbringer cases leave 15 original W1/W2 nodes detached. Five also
   allocate reserved weapon nodes into the main route. This is not caused solely
   by exchanges: earlier arms have the same attachment problem. The native offline
   audit already handles such boundaries; the site's goal-only request does not.

Main-route validation passes because its contract currently has neither a hard
total cap for Extra mode nor reserved-weapon attachment requirements. A connected,
high-scoring main route therefore need not preserve the complete imported build.

## Reproduce and Verify

```powershell
node --import tsx tools/research/imported-weighted-benchmark.ts --prepare
node --test tools/research/imported-weighted-corpus.check.mjs
node --import tsx tools/research/imported-weighted-benchmark.ts
node --import tsx tools/research/imported-weighted-benchmark.ts --case monk/evasion-life/available --arm current --seed 1701 --ms 10000
```

Preparation reuses the explicit public snapshots when present, otherwise downloads
the locked public shares. It refuses changed bytes and preserves captured source
files. The historical harness replaced its final report on rerun; the
allocation-safety follow-up now refuses existing output directories. Retain reports before
recapturing a different corpus. Per-run JSON, exact selected nodes/edges, preflight
decisions, exclusions, fingerprints and progress histories are retained in
`var/weighted-corpus-20261108/benchmark.json`; targeted rechecks are in
`regression-followups.json`. A partial-results file remains if a run fails.

All five focused research checks and standalone TypeScript checking passed.
Seven optimizer/scoring/import source hashes remained unchanged. No application
source or data changed, so the full application release suite and browser smoke
test were not repeated for this research-only step.

## Next Recommended Step

Add allocation-safety constraints before further search tuning: cap Extra mode
against remaining main points, reserve W1/W2 nodes from main routing and require
their shared attachment boundaries. Validate these conditions before preview and
Apply, without optimizing the weapon branches themselves. Re-run this frozen
corpus to verify both constraint fixes and their effect on feasible route quality.

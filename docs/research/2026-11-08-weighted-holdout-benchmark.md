# Weighted Holdout Benchmark V1

## Scope

Added a separate frozen research corpus and runner for minion, Companion and
damage-over-time preferences, including already committed main-tree allocations.
**No optimizer, scoring, graph, site or original benchmark code was changed.**
The earlier four-build corpus remains an immutable regression control.

This is a routing/heuristic preference-score experiment, not PoB Full DPS,
whole-build viability or a recommendation to play one of the source builds.
Allocation preflight is not a complete effect/calculation audit.

## Reviewed Sources

Public share bytes and decoded XML were captured, hashed and checked with the
existing compatibility preflight before any timed optimization. Selected tree and
skill sets are retained; no source nodes/items were repaired or silently dropped.

| Included source | Selected class/ascendancy | Imported goals | Preference profiles |
| --- | --- | ---: | --- |
| [Spectres, 22c49](https://poe.ninja/poe2/pob/22c49) | Witch - Infernalist | 28 | Minion Damage/Speed; Minion Life/Reservation |
| [Wolf Pack, 1c254](https://poe.ninja/poe2/pob/1c254) | Witch - Lich | 29 | Companion/Minion offence; Companion/Minion Life/Reservation |
| [Essence Drain/Contagion, 27c94](https://poe.ninja/poe2/pob/27c94) | Witch - Lich | 26 | Chaos/DoT/Duration; ES/Duration/Chaos Resistance |
| Original [Warbringer, 2b47e](https://poe.ninja/poe2/pob/2b47e), partial only | Warrior - Warbringer | 24 | Original Life/Armour profile |

The three new captures cover different skill/ownership patterns but share a Witch
start; they do not independently broaden class-start coverage. Warbringer retains
both original 24-point weapon sets and all 11 shared attachment requirements.

Eleven new shares were reviewed. Seven are explicitly blocked: `108a0`, `1bce2`
and `1bafc` use older trees; `2b4f9`, `1d3b5` and `298af` require disconnected
allocation permissions; `2868b` also contains transformed passives. Other blockers
are retained in the full preflight records. `20eb3` passes preflight but is not
included: it is the second Infernalist export from the same source guide, rather
than a separate archetype. It is recorded as eligible-unused, not falsely blocked.

Discovery links were used only to locate exports. Build classification is checked
against the captured active skill set (Vaal Guard, Wolf Pack, and Essence Drain
plus Contagion), not merely the guide title or search snippet.

## Committed Bases and Costs

Each new build has root-only and **20 paid points already committed** scenarios.
The partial base is a breadth-first prefix of the original serialized shared
allocation, using numeric node-ID ordering and its real edges. It is not selected
by the optimizer or tuned after observing scores. Both committed nodes and their
20 spanning edges must survive every candidate. Goals already reached by the
prefix stay in the request, with other goals still outstanding.

Prefixes exclude ascendancy and weapon-set nodes. Warbringer adds two partial-only
scenarios to exercise paid-base accounting and fixed weapon attachments together.

The independent audit now measures **paid base + unique additions** against the
main-point cap. A small regression fixture demonstrates why counting additions
alone is insufficient: one paid base point plus two additions exceeds a two-point
cap, despite the added-node count alone being two. Production validation and
raw-edge connectivity checks are also retained.

The three new builds have a 123-point main cap. Warbringer has 99 main points after
reserving the larger weapon set once. A partial base therefore leaves 103 or 79
available additions respectively, not a fresh 123/99-point allowance.

## Prespecified Experiment

- Three new builds, two profiles, root/prefix20, and tight/all-available budgets:
  24 cases. Tight uses zero extra points; all-available uses the existing cap.
- Warbringer prefix20 Life/Armour with the same two budgets: two cases.
- 26 cases, seeds 1701/42, corridor-enabled control versus current junction-enabled
  search, rotating arm order, common two-second cutoff: **104 matrix runs**.
- One offence profile per new build, prefix20/all-available, seed 1701, both arms
  at a common 60-second cutoff: **six convergence runs**.
- **110 planned runs**, each in a fresh serial Node process. One development smoke
  run is retained separately. Original scenarios/inputs are not overwritten.

Both arms use the same untouched optimizer and request. Only the existing
`enableJunctionRelocation` option differs. Sources, profiles, goals, bases and
budgets are frozen before measurement. Missing incumbents and returned errors are
recorded instead of excluding difficult cases after the fact.

Timings include validation and baseline search but exclude source loading/case
construction and independent post-checks. Quality excludes cooperative-stop
overrun results. Work/dispatch counters can include overrun work unless filtered
to the common cutoff. Memory is whole Node process RSS, not isolated worker memory.
Host/GC variability and the small, correlated corpus limit generalization.

## Results

All **110 planned runs** completed with valid incumbents, zero returned errors and
zero missing preference-stage incumbents. Independent raw-edge/cost checks and
production validation checked **290 preference-stage progress results**, including
committed base nodes/edges and required weapon attachments. There were zero cap,
reserved weapon-node overlap or detached-branch violations.

| Common cutoff | Matched pairs | Improved | Tied | Behind | Missing |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2 seconds | 52 | 0 | 52 | 0 | 0 |
| 60 seconds | 3 | 0 | 3 | 0 | 0 |

| Prefix20/all-available offence case | Control score | Current score | Added / total points | Last improvement, control / current |
| --- | ---: | ---: | ---: | ---: |
| Spectres | 42.67 | 42.67 | 103 / 123 | 0.82s / 0.75s |
| Wolf Pack | 38.60 | 38.60 | 103 / 123 | 1.13s / 1.12s |
| Chaos DoT | 72.50 | 72.50 | 103 / 123 | 0.35s / 0.38s |

All six long runs had the same score and point cost at two, ten, thirty and sixty
seconds. The latest meaningful improvement occurred at approximately 1.129
seconds. Extending these particular offence cases did not unlock a late gain;
this does not establish convergence for the other profiles, builds or budgets.
Equal quality also does not imply identical node sets.

The current arm recorded 62 junction-pass dispatches before the common cutoffs.
The strategy was exercised, but **no additional score or point-cost gain from it
was demonstrated on this holdout suite**. The independent synthetic fixtures from
the prior batch remain valid evidence for its move, not a general real-build win.

First-baseline medians were approximately 149 ms control and 151 ms current;
first preference-result medians were 425 ms and 423 ms. Peak process RSS was about
284 MiB in both arms. Process memory includes loading and all constructed case
requests, so it is not a worker-memory measurement or a comparison with the site's
browser memory use.

The new suite adds 26 configurations to the earlier 24 while preserving those
inputs. The combined corpus contains seven distinct included public exports;
the extra Warbringer partial cases reuse an existing export. Configuration counts
are not independent samples or a percentage of optimizer completeness.

## Validation and Reproduction

- Nine new holdout checks plus five original corpus checks passed.
- 428 focused optimizer/allocation tests passed; research TypeScript checking passed.
- The initial partial-tree smoke result had 20 committed plus 103 new points,
  correctly totaling 123.
- Eighteen protected optimizer/scoring/graph/original-evidence files remained
  byte-identical, as did all 38 frozen new input/tooling files throughout the run.
  Timed runner source fingerprints were also unchanged.
- No application code changed, so browser/UI smoke and the full release suite were
  not repeated in this research-only batch.

Local raw evidence is isolated under ignored `var/weighted-holdout-20261108/`:
`corpus-v1/corpus.json`, `corpus-v1/captured/`, `benchmark-v1/benchmark.json`,
`benchmark-v1/results.partial.json`, `benchmark-v1/verified-summary.json`,
`initial-smoke.json`, `protected-before.json` and `frozen-inputs.json`. The source
lock and research scripts are under `tools/research/`. Earlier benchmark data and
the original runner/helper remain unchanged.

Run from the active checkout with the frozen local capture files present, using a
fresh output directory:

```powershell
node --test tools/research/heldout-weighted-corpus.check.mjs tools/research/imported-weighted-corpus.check.mjs
node --import tsx tools/research/heldout-weighted-benchmark.ts --output var/weighted-holdout-20261108/rerun-02
node --import tsx tools/research/heldout-weighted-benchmark.ts --case chaos-dot/chaos-duration/prefix20/available --arm current --seed 1701 --ms 60000
```

The dedicated `--prepare` command refuses to overwrite corpus v1. A new capture
must match the reviewed source lock, or be explicitly reviewed as a new version.
The previous benchmark runner and original corpus are unchanged.

## Next Recommended Step

Add independent exact offline audits of a few small real-tree neighborhoods from
these cases. Hold the surrounding allocation, boundary connections, goals, weapon
attachments and point allowance fixed, then compare the heuristic's local choice
with the exact best preference score in that bounded region. Review the included
stat rewards independently rather than using the solver's score as the oracle.

This would distinguish a genuinely exhausted local opportunity from a heuristic
plateau. These broader and longer runs have not demonstrated a new quality gap,
so another search operator or a shorter website timeout is not justified yet.
Keep site behavior unchanged until a reproducible missed-value case is found.
This is recommended, not implemented in this batch.

Follow-up: [exact offline neighborhood audits](2026-11-08-exact-neighborhood-audits.md)
adds the independent real-tree checks. The benchmark measurements above and their
frozen inputs remain unchanged.

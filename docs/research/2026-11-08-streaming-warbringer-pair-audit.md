# Bounded-Memory Warbringer Pair Audit

## Result

Audited the previously excluded **22-node Warbringer junction/frontier pair**
under its original shared Main allocation budget. Both independent offline
implementations completed **4,194,304 subsets** and agree on the score, cost and
deterministic selected nodes.

There is **no higher preference score or cheaper equal-score allocation** within
this exact region and its fixed outside allocation. The winning node set is
unchanged: **99 Main points**, with both **24-point weapon sets** retained and
their eleven attachment nodes protected.

No production optimizer, website, reward model, benchmark corpus or earlier proof
was changed. The website's exact-solver limits remain unchanged. No audited route
was applied to a build.

## Frozen Input

The source is the saved current/seed-1701 two-second result for
`warbringer-partial/life-armour/prefix20/available`. The pair is exactly the union
of the earlier `warbringer-partial-junction` and
`warbringer-partial-effect-frontier` domains; it was selected because it is the
previously identified 22-node exclusion, not because of a favorable search result.

The complete twelve-node junction and ten-node frontier domains have no overlap.
There was no clipping or replacement of nodes. The 22 variables include eleven
currently allocated and eleven unallocated nodes. All 89 allocated nodes outside
the variables stay fixed, including the free class root. Thus the 99-point Main
allowance leaves **11 points** for the variable union:

```text
123 total allowance - max(24 W1, 24 W2) = 99 Main allowance
99 Main allowance - 88 fixed paid nodes = 11 shared variable points
```

The twenty committed base points/edges, required goals and eleven weapon
attachments cannot move. Reserved weapon nodes cannot enter the Main solution.
Both weapon branches are independently checked for connectivity after whole-route
reconstruction. Weapon branches themselves are not optimized.

Only the explicit union can change. Outside unallocated nodes cannot become
unreported connectors. All selected fixed and variable nodes must remain
connected through actual raw edges, including incidental links not present in a
saved route's spanning-edge list.

## Bounded-Memory Solver

`exact-neighborhood-streaming.ts` visits subsets in Gray-code order, changing one
variable at a time. Integer score and point count are updated incrementally.
Connectivity uses explicit adjacency arrays and reusable queue/visit buffers,
not a bitset containing every graph vertex. It therefore handles this
**111-node possible-allocation graph**, beyond the older oracle's 30-vertex
contracted-bitset limit.

There are **no per-subset score, point-count or connectivity arrays**. Retained
working storage grows with the input graph and variable count, not `2^variables`.
The solver still takes exponential time and is not a whole-tree exact method.

Resource safeguards are explicit:

- Primary domain maximum: 28 variables, 100,000 input nodes and 500,000 edges.
- Default work limit: 16,777,216 visited states per phase. A larger supported
  domain does not imply an unlimited default run.
- This audit command defaults to five minutes per primary/reference phase,
  checked every 4,096 subsets. Setup and small-domain cross-checks are outside
  those phase timers; this is not a hard wall-clock limit for the entire command.
- Reaching a state limit reports `limited`; cancellation reports `cancelled`.
  Neither status is an exact certificate. The wrapper requires both completed
  implementations to agree before recording a verified optimum.
- The independent raw reference supports at most 24 variables and the same
  default state allowance. These are offline safeguards, not UI limits.

The primary's reported active numeric buffers total **2,438 bytes** for this
domain. This is not total process memory: graph strings/maps, preprocessing
buffers, corpus data, the reference's transient Sets and module imports also use
memory. Whole-process peak RSS was about **212.6 MiB**, including those imports
and the full independent reference. No claim of a 2.4 KB total memory footprint
or a hard process-RAM cap is made.

## Independent Verification

The primary and reference have no runtime imports from production routing,
production scoring or one another. Both use the existing type-only input shape.

The new raw reference walks ordinary binary subset order, constructs complete
selected-node sets and traverses string-keyed raw adjacency. It does not use
Gray-code score updates, graph contraction or objective pruning. Budget-eligible
subsets are checked even when their objective cannot beat the current best. It
found **89 feasible assignments** and the same optimum as the primary.

Before the larger audit, the new primary replayed all **16 previously certified
single/paired real domains**. The new raw implementation also completely rechecked
the eleven smaller individual domains; the five larger paired results were
compared with their retained independent raw certificates. All agreed.

Regression fixtures compare both new implementations with both earlier oracles
on 100 seeded cyclic graphs with signed rewards. Additional cases cover a known
shared-budget sacrifice, fewer-point and ordinary-mask tie breaking, negative
gateways, reward islands, all held fixed components, invisible outside connectors,
more than thirty fixed components, duplicate/self-links, malformed inputs,
protected edges, cancellation and exact state-limit boundaries. A synthetic
22-variable run completes all 4,194,304 states without exponential subset buffers.

## Rewards and Measurements

The unchanged manually reviewed literal ledger covers the pair's fourteen
distinct stat lines. Arithmetic is in exact integer units at **60 units per
preference score**. Unknown effects block comparison. Production scoring is only
a separate consistency check against the reviewed rewards and full-route delta.

| Measure | Incumbent | Verified optimum |
| --- | ---: | ---: |
| Local integer reward | 315 | 315 |
| Local preference score | 5.25 | 5.25 |
| Junction points / reward units | 7 / 0 | 7 / 0 |
| Frontier points / reward units | 4 / 315 | 4 / 315 |
| Total Main points | 99 | 99 |
| W1 / W2 points | 24 / 24 | 24 / 24 |
| Added / removed Main nodes | - | 0 / 0 |

The local score excludes fixed outside rewards. Tiny floating-point differences
in the separate full-route production-score summation are not improvements:
the exact integer objective is identical. Unselected or conditional effects are
not being simulated, and these results do not establish actual build power or
Full DPS.

The primary took about **208 ms**, including its compile/preflight work. The
independent raw check took about **16.77 seconds**. Imports, plan/context loading,
small-domain verification and output writing are excluded from those timings.
These bounded-domain timings do not predict global exact-search performance.

## Validation and Evidence

- **74 research checks passed**, including sixteen new kernel checks and eight
  new frozen-Warbringer integration checks, plus the prior fifty checks.
- **440 focused optimizer/validation/allocation tests passed** across three files.
- Strict standalone TypeScript checking passed for the four new research modules.
- All **102 protected earlier source/data/evidence files** and **six frozen new
  plan/tool files** remain byte-identical. Completed source fingerprints match.
- Browser smoke, a full release build and fresh heuristic performance benchmarks
  were not repeated: this batch changes only offline research tools/tests/docs.

New files are under `tools/research/exact-neighborhood-streaming*`,
`exact-streaming-test-context.ts`, and `exact-warbringer-pair*`. Local ignored
evidence lives under `var/exact-streaming-warbringer-20261108/`: immutable
`plan.json`, protected/frozen hashes, `audit-v1/small-checks.json`,
`audit-v1/primary.json`, `audit-v1/audit.json`, verified summary and logs.

Reproduce from the active checkout using a fresh output directory:

```powershell
node --test tools/research/exact-neighborhood-streaming.check.mjs tools/research/exact-warbringer-pair-integration.check.mjs
node --import tsx tools/research/exact-warbringer-pair.ts --output var/exact-streaming-warbringer-20261108/rerun-02
```

The planner refuses to overwrite its plan, and each audit requires a fresh output
directory. Integration checks reference the retained `audit-v1` proof. Compare
fresh output explicitly; do not replace earlier proof artifacts.

## Next Recommended Step

Use the same bounded-memory tools to audit the **two remaining 21-node
Spectres/Wolf Pack junction-travel pairs**. They are the next smallest predeclared
exclusions and can close another coverage gap without increasing website search
complexity. Keep the much larger 27/28-node Warbringer pairs separate, with an
explicit runtime/reference strategy before attempting them.

Only turn a newly discovered, reproducible missed-value exchange into a targeted
production search change. This result certifies one local pair, not global
optimality. The next batch is recommended, not implemented here.

# Bounded-Memory Spectres and Wolf Pack Pair Audits

## Result

Both previously excluded **21-node junction/travel pairs** were completely
audited with the existing bounded-memory primary solver and independent raw
reference. Each implementation checked **2,097,152 subsets per pair**, or
**4,194,304 subset states across the two domains**.

Both implementations agree on score, point cost and deterministic selected
nodes. Neither pair offers a higher preference score or cheaper equal-score
route within its fixed outside allocation. Both full builds retain **123 Main
points**, their twenty committed base points/edges and every required goal.
No selected node changed and no route was applied.

The production optimizer, website, solver kernels, preference scoring, benchmark
corpora and earlier proof files are unchanged. Only a new offline audit runner,
its regression checks and this report were added.

## Frozen Scope

The inputs are exactly the two predeclared exclusions from the original paired
plan: `spectres-junction` + `spectres-travel`, and `wolfpack-junction` +
`wolfpack-travel`. Each is the complete union of its original individual domains;
no nodes were clipped, replaced or selected based on their reward.

Both contexts are the saved current/seed-1701 sixty-second results with a
20-point committed prefix and all available Main points. The Spectres profile
uses Minion Damage/Speed preferences. Wolf Pack uses the declared Companion
Damage/Attack Speed plus Minion Damage preferences; it does not silently inherit
every Minion Speed reward.

Each build has its own original **single 123-point Main allowance**. These are
not two separate local budgets added together, and points are not pooled between
the two different builds.

| Context | Variables | Fixed paid points | Shared variable allowance | Possible allocation-graph nodes |
| --- | ---: | ---: | ---: | ---: |
| Spectres junction + travel | 21 | 111 | 12 | 133 |
| Wolf Pack junction + travel | 21 | 112 | 11 | 134 |

The free class root is included in the fixed allocation but costs no point. All
allocated nodes outside each union remain selected. Required goals, committed
base nodes/edges and any attachment protections cannot move. These two builds
have no reserved weapon branches; this batch does not add fresh real weapon-set
coverage beyond the retained Warbringer audit.

Neither pair overlaps internally. Across the two different builds there are
29 unique variable IDs and 19 distinct reviewed stat lines, so these remain
correlated cases, not broad independent class/build coverage.

## Objective and Verification

The unchanged literal review ledger supplies exact integer rewards at 60 units
per preference score. All fourteen distinct stat lines within each pair are
reviewed; unknown lines or changed profile weights block a comparable audit.
Production scoring is only a separate consistency check against the ledger and
saved whole-route score, not the source of the exact oracle's rewards.

The unchanged streaming primary visits subsets in Gray-code order with
incremental score/point arithmetic and explicit adjacency arrays. The unchanged
reference constructs whole selected sets in ordinary binary order and walks raw
string-keyed adjacency without objective pruning or graph contraction. Both
require every selected outside component to remain connected. Outside unallocated
nodes cannot act as unreported connector paths.

An optimum is recorded as verified only when both implementations finish and
agree on reward, paid points and the selected-node tie break. Existing state,
graph-size and cancellation safeguards are preserved: defaults are 16,777,216
states and five minutes per primary/reference phase, checked every 4,096 states.
Setup is outside those timers. Cancelled/limited output is not a certificate.

## Detailed Results

| Pair | Exact local reward units | Local score | Local points | Feasible assignments | Score gain / point saving |
| --- | ---: | ---: | ---: | ---: | --- |
| Spectres junction + travel | 440 | 7.33 | 12 | 1 | 0 / 0 |
| Wolf Pack junction + travel | 300 | 5.00 | 11 | 134 | 0 / 0 |

Local rewards exclude the constant fixed outside contributions. Spectres keeps
five junction nodes worth zero selected reward units and seven travel nodes
worth 440 units. Wolf Pack keeps five junction nodes worth 180 units and six
travel nodes worth 120 units. Each selected point/reward is counted once.

**The Spectres pair has only one feasible allocation.** Its frozen outside
connections and allowance force the incumbent. This is a structural rigidity
result, not a meaningful comparison between competing preference choices. Wolf
Pack has 134 feasible assignments, but none has a higher score or cheaper
equal-score result. These counts are per-domain assignments, not 135 distinct
global builds.

| Pair | Primary elapsed | Raw-reference elapsed | Primary active numeric buffers |
| --- | ---: | ---: | ---: |
| Spectres | 58 ms | 10.51 s | 2,845 bytes |
| Wolf Pack | 36 ms | 16.70 s | 2,889 bytes |

Combined primary time was about 94 ms and independent reference time about
27.21 seconds, excluding imports, context loading and output writing. Neither
solver retains per-subset arrays. Numeric-buffer sizes are not total memory:
graph strings/maps, input evidence, imports and transient raw-reference Sets also
use RAM. Whole-process peak RSS was about 198.5 MiB. This is a measurement, not a
hard process-memory ceiling.

These are bounded local certificates for additive preference scores, not actual
build power, Full DPS, whole-tree optimality or a reason to shorten the site's
search timer. Unselected/conditional effects are not assumed worthless in-game.

## Cumulative Paired Coverage

Eight of the original ten planned paired domains are now completely audited:
five earlier small unions, the 22-node Warbringer pair, and these two 21-node
pairs. All eight match their incumbents on optimal score and point cost within
the frozen domain. Their total is **10,747,904 per-domain subset states**; this
is not a count of unique global builds.

The two remaining exclusions are explicitly **not audited**:

- Warbringer junction + travel: 28 variables, including one shared variable.
- Warbringer travel + frontier: 27 variables.

The current independent raw reference supports at most 24 variables, and the
default state allowance is also below the full 27/28-variable search spaces.
They cannot be called verified merely by raising a command-line state allowance
or assuming smaller-domain ties generalize.

## Validation and Evidence

- **86 research checks passed**, including four new frozen-selection checks and
  eight new real-pair integration checks, plus the prior 74 checks.
- **440 focused optimizer/validation/allocation tests passed** across three files.
- Strict standalone TypeScript checking passed for the two new research modules.
- All **119 protected earlier source/data/evidence files** and **four frozen new
  plan/tool files** remain byte-identical. Source fingerprints match.
- Integration checks replay the fast primary searches against the retained full
  raw certificates; they do not repeat the 27-second raw run on every test pass.
  Existing signed-graph, known-improvement, resource-limit and independent
  reference regression fixtures still run.
- Browser smoke, full release validation and a fresh heuristic performance
  benchmark were not repeated because neither application nor solver/scoring
  code changed.

New tools are `tools/research/exact-minion-pairs.ts`, its test context, and
unit/integration checks. Local ignored evidence is retained under
`var/exact-streaming-minion-pairs-20261108/`: immutable `plan.json`, protected and
frozen input hashes, per-pair primary snapshots and full input/results,
`audit-v1/audit.json`, verified summary and validation logs. Earlier evidence was
not overwritten.

Reproduce from the active checkout with a fresh output directory:

```powershell
node --test tools/research/exact-minion-pairs.check.mjs tools/research/exact-minion-pairs-integration.check.mjs
node --import tsx tools/research/exact-minion-pairs.ts --output var/exact-streaming-minion-pairs-20261108/rerun-02
```

The planner refuses to overwrite its frozen plan. Integration tests reference
the retained `audit-v1` proof; compare fresh outputs explicitly rather than
replacing earlier evidence.

## Next Recommended Step

Audit a predeclared batch of **branch-complete donor/recipient regions** with
genuine structural flexibility. Include the full optional selected branch and
its descendants, not merely a radius around a travel node that leaves those
descendants fixed outside. Keep all committed/base/goal/weapon protections.

Require multiple feasible point splits between the areas before treating a case
as a useful point-trading comparison. Choose domains deterministically using
topology, not preference reward or whether the heuristic loses; freeze the
domains/profiles before the scored audit and report rejected/rigid candidates.
The Spectres one-assignment result explains why this can provide more useful
missed-value coverage than simply increasing region size.

Keep the two larger Warbringer cases explicitly open pending a suitable exact
reference/runtime strategy. Do not add production search complexity unless a
reproducible missed-value exchange justifies it. This next batch is recommended,
not implemented here.

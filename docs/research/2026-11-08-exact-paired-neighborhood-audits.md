# Exact Paired-Neighborhood Audits

## Result

Implemented an offline paired-region audit using **one shared point allowance**.
Five real pairs were completely checked: **2,359,296 subset states**, with the
primary exact enumerator and a separate raw-graph implementation agreeing on
score, point cost and deterministic winner in every case.

No pair improved the saved incumbent's preference score or saved points at the
same score. All five winners have exactly the incumbent node set. This is useful
negative evidence, not proof of global optimality or that another search strategy
could never improve these builds. The website, production optimizer, production
exact-solver limits, scoring and saved benchmark results are unchanged. No route
was applied.

## Shared Budget and Coverage

The plan was frozen before running the paired searches. It considers every
unordered pair of the prior single-region domains within the same saved case.
Roots, allocation, committed edges, protected nodes and total allowance must
agree. The previous complete domains are combined without shrinking them or
selecting subsets based on reward.

All allocated nodes outside the union remain fixed. The pair receives the
original total allowance minus those fixed paid nodes, **not the sum of the two
individual region allowances**. Only the class root is free in this offline
unit-cost model. Newly selected nodes, fixed components and every held goal must
remain connected in the raw graph; outside unallocated nodes cannot serve as
unreported connectors. Committed base nodes/edges cannot be removed.

The two areas may overlap. Their union is deduplicated and reported as three
disjoint buckets: left-only, right-only and shared. This prevents counting shared
points or rewards twice and avoids falsely attributing a shared change to both
areas.

Ten pairs were considered. Five fit the unchanged offline bounds of at most
20 variable nodes and 30 contracted vertices. These cover Spectres Infernalist,
Wolf Pack Lich and Chaos DoT Lich, all with a committed 20-point prefix and the
123-point available-points budget. The pairs contain 45 unique variable IDs and
22 literal stat lines. These are overlapping, correlated samples of three Witch
build contexts, not broad class coverage.

Five pairs were excluded intact:

| Saved context / pair | Union size | Shared nodes |
| --- | ---: | ---: |
| Spectres junction + travel | 21 | 0 |
| Wolf Pack junction + travel | 21 | 0 |
| Partial Warbringer junction + travel | 28 | 1 |
| Partial Warbringer junction + frontier | 22 | 0 |
| Partial Warbringer travel + frontier | 27 | 0 |

All three real weapon-set pairs are therefore **untested by this paired exact
run**. Earlier single-region weapon protections and synthetic protected-node
checks still pass, but are not substitutes for that missing paired coverage.
The earlier unavailable Chaos DoT frontier slot remains unavailable; no favorable
replacement region was handpicked.

## Objective and Independent Check

The unchanged literal reward ledger supplies exact integer rewards at 60 units
per preference score. Unknown effects block a comparable claim. Rewards for
fixed outside nodes are constant and cancel. Production scoring is used only as
a separate consistency check against the reviewed ledger and full-route delta,
not as the oracle's reward source.

This remains additive preference optimization, not Full DPS or simulated build
power. Effects not selected by the profile do not acquire value merely because
the audit can move more nodes. They are not assumed worthless in-game.

The primary enumerator contracts fixed raw-connected components, then considers
every subset with safe budget/objective pruning. The second implementation walks
raw adjacency for whole selected-node sets without contraction, bitset
connectivity or objective pruning. It checks all budget-eligible subsets and
found **495 feasible per-pair assignments**. This is not 495 distinct whole-tree
builds, since domains overlap.

Cancellation of a primary search is reported as cancelled, never as an exact
certificate. The optional `--max-ms` applies to the primary search; a completed
primary search is followed by a full independent reference check, so it is not
a hard wall-clock limit for the entire command.

## Results

| Pair | Variables | Overlap | Shared allowance / used | Exact local score | Gain / saving |
| --- | ---: | ---: | ---: | ---: | --- |
| Spectres junction + frontier | 19 | 0 | 10 / 10 | 10.67 | 0 / 0 |
| Spectres travel + frontier | 17 | 7 | 8 / 8 | 10.67 | 0 / 0 |
| Wolf Pack junction + frontier | 19 | 0 | 8 / 8 | 5.00 | 0 / 0 |
| Wolf Pack travel + frontier | 17 | 7 | 6 / 6 | 2.00 | 0 / 0 |
| Chaos DoT junction + travel | 20 | 0 | 12 / 12 | 5.60 | 0 / 0 |

Local scores include each selected variable once, not fixed outside rewards.
Every reconstructed full winner costs 123 points and retains its required goals,
committed allocation and edges. The recorded donor, recipient and shared buckets
are unchanged in all five real cases.

The primary searches took about **68 ms combined**, and the independent raw
reference about **21.0 seconds combined**, excluding setup/imports. These small
bounded-domain measurements do not predict whole-tree exact-search time.

## Regression Fixtures and Verification

A separate synthetic fixture confirms the intended mechanism: each area is
optimal alone, but their union can drop a four-unit branch and add eight units
elsewhere, moving from **six to ten reward units at the same three-point cost**.
It is checked against the independent raw implementation. This is a known
fixture improvement, not a gain found in the real builds.

Other fixtures check overlapping nodes, one-time use of the allowance, complete
union-size eligibility, deterministic planning, incompatible source contexts and
protection of committed/weapon-attachment nodes.

- **50 research checks passed**, including 14 new paired unit/integration checks
  and the previous 36 neighborhood/corpus checks. Integration replays the fast
  primary searches against the completed raw certificates rather than repeating
  the 21-second full raw pass on every test run. Existing small-reference and
  seeded cyclic-graph regression checks still execute independently.
- **440 focused optimizer/validation/allocation tests passed** across three files.
- Standalone strict TypeScript checking passed for the new research modules.
- All **82 protected earlier source/data/evidence files** and **four frozen paired
  input/tool files** remain byte-identical. Proof source fingerprints match.
- No application code changed, so browser smoke, full release validation and a
  fresh performance benchmark were not repeated. This offline audit consumes the
  saved benchmark results rather than altering or re-running the benchmark.

New tools are `tools/research/exact-paired-neighborhoods.ts`, its paired test
context and unit/integration checks. Local ignored evidence is retained in
`var/exact-paired-neighborhoods-20261108/`: immutable plan, protected/frozen hashes,
`audit-v1/audit.json`, each pair's exact input/result, verified summary and logs.
The parent single-region evidence is unchanged.

From the active checkout, reproduce with a fresh output directory:

```powershell
node --test tools/research/exact-paired-neighborhoods.check.mjs tools/research/exact-paired-neighborhoods-integration.check.mjs
node --import tsx tools/research/exact-paired-neighborhoods.ts --output var/exact-paired-neighborhoods-20261108/rerun-02
```

The planner refuses to overwrite its plan; audit runs require a fresh output
directory. Tests reference the retained `audit-v1` proof set. Fresh outputs must
be compared explicitly rather than replacing that evidence.

## Next Recommended Step

Close the real weapon-set coverage gap with a **bounded-memory offline exact
auditor**, starting with the excluded 22-node Warbringer junction/frontier pair.
Use an explicit adjacency representation that does not rely on the current
30-vertex bitset bound, retain cancellation/resource limits, and cross-check its
small-domain results against both existing independent implementations before
auditing the larger pair.

Keep the website's exact solver and heuristic search unchanged. If that audit
finds a reproducible missed-value exchange, it becomes evidence for a targeted
production improvement. Merely increasing search complexity after another tie
would not demonstrate a benefit. This recommendation is not implemented here.

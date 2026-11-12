# Exact Offline Real-Tree Neighborhood Audits

## Scope and Result

Added a standalone offline exact enumerator and independent raw-graph reference
for bounded regions of saved real-tree results. **Optimizer, scoring, site and
benchmark code/data are unchanged. No audited route was applied to a build.**

Eleven explicit domains were completely audited, accounting for **161,536 subset
states**. Both independent connectivity implementations agree on all eleven:
there is **no higher proxy score and no cheaper equal-score allocation** than the
saved incumbent within these domains and their fixed outside allocations.

This is a local certificate, not a whole-tree optimum, a Full DPS calculation, a
proof that the preference model measures in-game power, or a reason to shorten the
website's inactivity timeout.

## Frozen Selection

Used the current/seed-1701 saved 60-second prefix20/all-available results for
Spectres, Wolf Pack and Chaos DoT, plus the saved two-second partial Warbringer
result. The surrounding allocation, twenty committed base points/edges, goals,
weapon attachments and applicable 123/99-point allowance stay fixed.

The selection rule was frozen before exact results: first eligible numeric-ID
center for each junction, travel and effect-frontier policy. Each domain contains
the complete eligible radius-two ball, with radius-three fallback, restricted to
8..18 variables, at least two currently allocated and two unallocated nodes.
Required/base/attachment nodes are excluded from the variable set. Reserved weapon
nodes, other class starts/ascendancies/masteries, locked nodes and new unrequested
keystones are excluded. Objective values are not used to select centers.

Eleven of twelve planned slots qualified. The Chaos DoT effect-frontier slot had
two candidate centers but no distinct complete ball satisfying the bounds; that
unavailability is recorded, not replaced with a favorable handpicked sample.

The domains contain 83 unique graph nodes and 46 distinct stat lines, with overlap
between regions and builds. These are targeted, correlated cases, not eleven
independent samples or coverage of every possible local change.

## Independent Rewards

`exact-neighborhood-rewards.json` is a literal review ledger, not a call into the
production scoring function. Every included stat line is explicitly covered with
an arithmetic/scope explanation; a new unknown line blocks a comparable claim.
Seven lines have nonzero rewards in at least one selected profile; the remaining
39 lines are explicitly outside the chosen preferences or conditional/scoped.

For example, the Spectres profile values `Minions deal 10% increased Damage` at
`10 / 10 * 2 = 2` proxy units. Its combined Minion Speed preference values five
percent attack and cast speed separately: `5 / 3 + 5 / 3`. The Wolf Pack profile
uses different declared preferences, so the same stat text does not automatically
receive a Companion-specific speed reward. Conditional Armour is not silently
treated as unconditional increased Armour.

All arithmetic uses literal integer rewards at **60 units per proxy score**.
Signed rewards are supported. Rewards outside the variable domain are constant
and cancel in the local comparison. A separate production-score cross-check must
agree with the reviewed values and saved incumbent score; a mismatch blocks the
claim rather than overwriting the independent reward ledger.

Unselected effects are not assumed worthless in-game. Recovery, Command-specific
damage, conditional effects, inheritance, gear and actual attack/cast usage are
not simulated by this additive preference objective.

## Exact Domain and Topology

All allocated nodes outside a domain remain selected. Only its explicit variable
nodes may change; outside unallocated nodes cannot become hidden connector paths.
Every held outside component must remain connected, not merely the root and goal
nodes. Real graph edges between selected nodes are available, including incidental
links omitted from a saved route's spanning edge list. Fixed base edges survive.

The primary oracle contracts connected fixed components, then enumerates every
variable subset using exact integer rewards and unit passive costs. Safe budget
and objective pruning avoids unnecessary connectivity checks. The graph is bounded
to 20 variables and 30 contracted vertices before any exponential allocation;
the actual real domains have 8..17 variables. Cancellation returns `cancelled`,
never a partially searched optimum.

The second implementation builds whole selected-node sets and walks raw adjacency,
without contraction, bitset connectivity or objective pruning. It independently
checks all budget-eligible subsets. It found 151 feasible per-domain assignments
across the eleven domains and the same score/cost/tie-break optima as the first
oracle. These are not 151 distinct global builds.

The frozen graph contains the self-link `35653 -> 35653`. The initial strict
adapter rejected it before producing any proof. Self-links are now explicitly
connectivity-neutral in the independent compiler and regression tests. No graph
data was edited, no distinct-node connections were invented, and unknown endpoints
still cause rejection. The failed attempt/log is retained separately.

## Results

| Saved context / policy | Center ID | Variables | Fixed components | Exact local score | Local points | Gain / saving |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Spectres junction | 7424 | 8 | 6 | 0.00 | 5 | 0 / 0 |
| Spectres travel | 95 | 13 | 6 | 7.33 | 7 | 0 / 0 |
| Spectres frontier | 8737 | 11 | 3 | 10.67 | 5 | 0 / 0 |
| Wolf Pack junction | 3443 | 8 | 3 | 3.00 | 5 | 0 / 0 |
| Wolf Pack travel | 95 | 13 | 3 | 2.00 | 6 | 0 / 0 |
| Wolf Pack frontier | 8737 | 11 | 3 | 2.00 | 3 | 0 / 0 |
| Chaos DoT junction | 7424 | 8 | 5 | 0.00 | 5 | 0 / 0 |
| Chaos DoT travel | 858 | 12 | 2 | 5.60 | 7 | 0 / 0 |
| Warbringer junction | 18448 | 12 | 8 | 0.00 | 7 | 0 / 0 |
| Warbringer travel | 1200 | 17 | 5 | 0.00 | 3 | 0 / 0 |
| Warbringer frontier | 10362 | 10 | 2 | 5.25 | 4 | 0 / 0 |

Scores above are only variable-domain contributions, not the whole build score.
Four zero-reward domains still check minimal connectivity cost; seven include
positive selected rewards. The exact winner equals the incumbent node set in all
eleven cases. All reconstructed whole allocations passed the existing structural
validator and independent checks for unique point counts, committed edges, goals,
weapon reservations/attachments and separate W1/W2 connectivity.

The primary enumerations took about 34 ms combined and the raw reference about
323 ms in a separate verification run, excluding setup/imports and reward review.
These tiny-domain timings do not predict whole-tree exact-search performance.

## Verification and Evidence

- **36 audit/corpus checks** passed, including 100 seeded tiny cyclic graphs
  checked against independent subset/edge scanning, known improving fixtures,
  signed gateways, isolated reward rejection, protected edges, cancellation,
  the highest permitted bit and a complete 1,048,576-state 20-variable fixture.
- **428 focused optimizer/allocation tests** and research TypeScript checking
  passed. Browser/UI smoke and the full release suite were not repeated because
  no application code changed.
- The integration harness initially spent over two minutes in repeated scoped
  module loading. One shared test import reduced the integration check to about
  5.5 seconds; the final 36-check run took about 6.6 seconds. Audit results and
  runtime optimizer code were not changed to obtain that reduction.
- All 58 protected optimizer/scoring/graph/corpus/tooling/earlier-evidence files
  remain byte-identical. Completed proof source fingerprints also match.

New tools are under `tools/research/exact-neighborhood*`. Local evidence is under
ignored `var/exact-neighborhoods-20261108/`: immutable `plan.json`,
`review-input.json`, `audit-v2/audit.json`, each per-region input/result JSON,
`audit-v2/verified-summary.json`, validation logs and protected hashes. The empty
failed `audit-v1/` attempt and its log are retained; no exact result came from it.

Re-run against the frozen local data from the active checkout, using a fresh output
directory:

```powershell
node --test tools/research/exact-neighborhood.check.mjs tools/research/exact-neighborhood-integration.check.mjs tools/research/heldout-weighted-corpus.check.mjs tools/research/imported-weighted-corpus.check.mjs
node --import tsx tools/research/exact-neighborhood-audit.ts --output var/exact-neighborhoods-20261108/rerun-03
```

The planner refuses to overwrite its plan/review files. The integration checks
refer to the retained `audit-v2` proof set; fresh audit outputs must be compared
explicitly rather than replacing that evidence.

## Next Recommended Step

Audit pairs of neighborhoods under one shared point allowance, keeping the union
within the exact solver's 20-variable bound. An improvement could require losing
a little value in one area to fund a stronger choice elsewhere; a single-domain
check with the surrounding allocation fixed cannot certify those exchanges.

Keep this offline and preserve the current site behavior. Only add another search
strategy after such an audit produces a reproducible missed-value counterexample.
This is recommended, not implemented in this batch.

Follow-up: the paired audit is now recorded separately in
[Exact Paired-Neighborhood Audits](2026-11-08-exact-paired-neighborhood-audits.md).
The single-region results and proof artifacts above remain unchanged.

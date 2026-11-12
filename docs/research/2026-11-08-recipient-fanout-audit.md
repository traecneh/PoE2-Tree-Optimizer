# Frozen-Donor Recipient Fanout Audit

## Result

Audited **all 252 declared bounded recipient alternatives** for the four donor
branches frozen in the preceding branch-complete audit. Every case finished with
both independent exact implementations agreeing on score, point cost and chosen
variable nodes. **No higher preference score or cheaper equal-score route was
found within these domains.** Every winning node set equals its incumbent.

The batch covers **84,192 per-domain subset states**, **2,765 feasible assignments**
and **756 independently validated full-budget point-transfer witnesses**. No
case was excluded because of its score, and the command did not stop at a good
or bad result. No missed-value counterexample was found or manufactured.

The website, production optimizer, existing exact solver kernels, preference
scoring, profile weights, benchmark corpora and earlier evidence are unchanged.
No route was applied. These are local additive-score certificates, not Full DPS,
whole-tree optimality or actual in-game power measurements.

## Frozen Selection and Coverage

The donor nodes and anchors are exactly the previous four frozen choices. Only
the list of recipient alternatives expands. The structural enumerator accepts no
stat text, names, scores or reward callbacks.

For each donor it enumerates every complete connected component of eligible
unallocated nodes. A recipient must contain 2..8 nodes, attach to a selected node
outside the donor, and fit the existing variable-domain bound. All original
goals, committed base nodes/edges, weapon attachments and outside allocations
remain fixed. Each candidate demonstrates connected zero/one/two-point transfers
at the original whole-build point allowance.

The full topology-only plan was written before collecting new review text.
Its parent donor plan, graph, benchmark and enumerator are pinned by hash. The
plan includes every structural rejection, with no clipping, reward filter or
unreported truncation.

| Context | All eligible off-allocation components | Bounded with selected attachment | Accepted for frozen donor | Rejected overall |
| --- | ---: | ---: | ---: | ---: |
| Spectres | 104 | 79 | 76 | 28 |
| Wolf Pack | 89 | 68 | 64 | 25 |
| Chaos DoT | 72 | 61 | 61 | 11 |
| Warbringer | 71 | 51 | 51 | 20 |
| Total | 336 | 259 | 252 | 84 |

Of the 84 exclusions, 77 fail the component-size or selected-attachment rules.
The remaining seven bounded components depend entirely on the removable donor:
three Spectres and four Wolf Pack components. These dependencies are recorded,
not treated as scored losses or silently dropped.

Variables range from 4 to 11 nodes per domain. The underlying Main point caps are
123/123/123/99, including each build's twenty committed base points. Warbringer's
24-point W1 and 24-point W2 branches remain untouched and connected through their
eleven protected attachment nodes in every witness and winner.

## Literal Reward Review

The batch contains **820 unique node IDs** and **576 distinct stat lines**. Fifty
lines already had literal reviews; the other **526 lines** were explicitly added
after the topology freeze. Earlier review files were not edited.

The additions contain twelve valued literal lines and 514 documented zero
contributions under these four specific profiles. The combined ledger now
explicitly covers 585 literal lines; nine earlier lines are unused in this batch.
There is no automatic zero fallback for unknown future text. Duplicate reviews,
changed review-input bytes or a missing line block comparison before any case
is optimized.

Examples at 60 integer units per preference score:

- `25% increased Armour`: 125 units for Warbringer, with conditional Armour still
  separate and not granted an assumed uptime.
- `16% reduced Skill Effect Duration`: -96 units for Chaos DoT. Reductions are
  signed costs, not silently ignored.
- `Companions deal 12% increased Damage`: 144 units for the selected Companion
  Damage preference, not automatically expanded to every Minion preference.
- `Minions have 3% increased Attack Speed`: 60 units for Spectres' combined Minion
  Speed preference; zero for Wolf Pack's different Companion Attack Speed choice.
- Enemy Chaos Resistance reductions, Minion Duration, extra damage, special buffs
  and recovery effects are not relabeled as generic Chaos Damage, player Skill
  Effect Duration, increased Minion Damage or Maximum Life.

All 526 new lines have scope/arithmetic explanations. Their zero contribution
does not mean they are worthless in-game. Production scoring is only a separate
consistency check against this ledger and the saved whole-route scores; it is
not the independent oracle's reward source. Every declared node passes that
preflight before optimization begins.

## Results

| Context | Verified domains | States | Feasible assignments | Full-budget witnesses | Positive / zero / negative-only recipients | Gain / saving cases |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Spectres | 76 | 36,160 | 1,060 | 228 | 3 / 73 / 0 | 0 / 0 |
| Wolf Pack | 64 | 15,600 | 483 | 192 | 0 / 64 / 0 | 0 / 0 |
| Chaos DoT | 61 | 19,840 | 859 | 183 | 0 / 60 / 1 | 0 / 0 |
| Warbringer | 51 | 12,592 | 363 | 153 | 5 / 46 / 0 | 0 / 0 |

Recipient categories describe the reviewed contributions present in the complete
component, not a claim that every valued node is affordable within the donor's
two/three-point allowance. All **eight positive**, **243 all-zero** and **one
negative-only** alternatives were audited. The reference checks every
budget-eligible subset without objective pruning. Scores, fewer-point ties and
deterministic variable-node tie breaks agree with the primary in every row.

The exact phases took about **277 ms combined for the primary** and **479 ms for
the independent reference**. These timings exclude imports, complete reward
preflight, whole-route/witness validation and file writing; they are not an
end-to-end runtime or a prediction for whole-tree exact search. Existing
linear-memory kernels, cancellation and resource limits remain unchanged.

## Coverage Gap

The whole-component rule still limits what the audit can conclude. A separate
post-audit structural check found eligible unallocated nodes outside the audited
domains containing already reviewed positive selected-effect lines:

| Context | Such excluded nodes | Reason |
| --- | ---: | --- |
| Spectres | 19 | Oversized components |
| Wolf Pack | 22 | Oversized components |
| Chaos DoT | 11 | Ten in oversized components, one singleton |
| Warbringer | 42 | Oversized components |

These are per-context node counts and can overlap between builds. They are not
complete net node scores, reachability proofs, affordable route improvements or
newly audited domains. Some carry additional effects not needed for this
positive-line check. `coverage-gap.json` records the qualifications, component
sizes and example positive lines.

This explains why the Wolf Pack and Chaos DoT fanouts contain no positive
recipient choices despite completing the declared batch. It does not establish
that a better route exists. In particular, the earlier unaudited 27/28-node
Warbringer radius-pairs are still open; this audit does not certify them.

## Compact Evidence and Verification

Parent topology is shared by hash rather than copied per candidate. The output
stores four reviewed contexts once in `shared-contexts.json` (1,230,984 bytes),
and all 252 result/proof rows in `results.jsonl` (389,101 bytes). Each row resolves
its explicit domain from the frozen plan. The runner would save a complete input
fixture for every verified gain/saving, but its counterexample list is empty.

- **120 research checks passed**: eight new structural/review checks, eight new
  integration checks and the previous 104 checks.
- **440 focused optimizer/validation/allocation tests passed** across three files.
- Strict standalone TypeScript checking passed for the three new research modules.
- Independent component enumeration accounts for all 336 components and 84
  exclusions. Integration replays every fast primary result against its completed
  raw certificate and independently checks all 756 full-budget witnesses.
- All **156 protected earlier source/data/evidence files** and **seven frozen new
  plan/review/tool files** remain byte-identical. Source/result hashes match.
- A new review-list check initially compared insertion-order arrays against
  numerically ordered JSON object keys. The unfrozen test harness now compares
  those entries by node ID. The failed `validation.log` is retained separately
  from passing `validation-v2.log`; no audit input, reward or solver result was
  changed to fix the comparison.
- Browser smoke, full release validation and a new heuristic benchmark were not
  repeated because this batch changes only offline tooling/tests/docs.

New files are under `tools/research/recipient-fanout-*`. Local ignored evidence
is under `var/exact-recipient-fanout-20261108/`: immutable plan and review input,
protected/frozen hashes, coverage-gap analysis, `audit-v1` compact proof set,
verified summary and logs. Earlier evidence was not overwritten.

Reproduce from the active checkout with a fresh output directory:

```powershell
node --test tools/research/recipient-fanout-plan.check.mjs tools/research/recipient-fanout-integration.check.mjs
node --import tsx tools/research/recipient-fanout-audit.ts --output var/exact-recipient-fanout-20261108/rerun-02
```

The planner refuses to overwrite its plan. Integration tests reference the
retained `audit-v1` proofs; compare fresh outputs explicitly rather than replacing
them. A cancelled/limited row is never recorded as a verified certificate.

## Next Recommended Step

Audit **bounded connected recipient bundles inside oversized components**, also
including single-node choices, while keeping the donors complete and frozen.
An unallocated component need not be purchased in full to use a connected part
of it; the current whole-component rule misses that possibility.

Freeze topology-based bundle generation and exclusions before scoring, preserve
all outside/base/goal/weapon protections, and prove actual fixed-allocation
attachment and affordability. A singleton can demonstrate two full-budget splits
rather than the three used by the current 2..8-node policy. Do not select bundles
only because their scores beat the incumbent.

Keep the production optimizer unchanged until an independently verified
counterexample supports a targeted improvement. This next recommendation is not
implemented in this batch.

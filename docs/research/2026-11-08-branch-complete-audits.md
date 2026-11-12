# Branch-Complete Donor/Recipient Audits

## Result

Four structurally flexible real-tree domains were frozen and audited. Each
includes an entire optional selected donor branch and an entire eligible
unallocated recipient component, with **three independently verified full-budget
point splits**: transfer zero, one or two points from donor to recipient.

The unchanged streaming exact solver and independent raw reference agree in all
four cases. **No higher preference score or cheaper equal-score route was found**
within these domains. All winning node sets equal their incumbents. No route was
applied, and the website, production optimizer, existing exact solvers, preference
scoring, benchmark corpora and earlier proof artifacts are unchanged.

The four domains contain **672 subset states**, including **36 feasible
per-domain assignments**. Unlike the earlier rigid Spectres pair, all four admit
genuine alternatives. The twelve legal full-budget witnesses are checked against
whole-route and weapon-attachment invariants, not just local point arithmetic.

## Structural Selection

The four saved contexts are the previously used current/seed-1701
prefix20/all-available results: Spectres Infernalist, Wolf Pack Lich, Chaos DoT
Lich and partial Warbringer. The first three use their saved sixty-second result;
Warbringer uses its saved two-second result. These are existing frozen cases,
not newly sourced or reoptimized builds.

The selector accepts only node IDs, raw edges, incumbent IDs, protected IDs,
eligible IDs, root and point limit. It has no stat text, node names, preferences,
reward callback or objective values. Eligibility comes from the existing visible
request graph, allocation flags and reservations, not from whether a node scores.

Selection rules were fixed before running the scored audit:

1. Examine selected anchors in numeric-ID order. Remove an anchor and find whole
   connected components in the selected raw graph.
2. A donor is an entire 2..8-node component containing no protected/ineligible
   node. It includes every selected descendant of that cut; no descendant stays
   fixed outside the proposed donor. Duplicate complete branches are rejected.
3. A recipient is an entire 2..8-node connected component of eligible unallocated
   nodes, ordered by its first numeric ID. Components outside the size bounds
   are rejected, not clipped.
4. The recipient must attach to a selected node outside the removable donor.
   Components dependent entirely on the donor are rejected.
5. Select the first qualifying donor/recipient pair, with at most 16 variables
   and 256 pair candidates examined per case. Verify connected, full-cost
   zero/one/two-point transfer witnesses before accepting it.

Every outside allocated node, committed base node/edge, required goal and weapon
attachment remains fixed. Other unallocated nodes cannot become hidden connector
paths. Removing a complete pendant donor leaves its fixed outside allocation
connected. The free root is counted once and costs no point.

The selector enumerated **24 eligible donor branches** and **259 eligible
recipient components** across the four contexts. It retained **987 rejection
records**, including protected/ineligible descendants and whole components
outside the bounds. All four first pair candidates qualified; no unavailable
context or post-score replacement was hidden. This batch audited only one pair
per context, not all donor/recipient combinations.

## Frozen Domains

| Context | Donor anchor | Donor nodes | Recipient nodes | Variables | Full-budget splits |
| --- | --- | ---: | ---: | ---: | --- |
| Spectres | 95 | 3 | 6 | 9 | 3/0, 2/1, 1/2 |
| Wolf Pack | 1433 | 2 | 3 | 5 | 2/0, 1/1, 0/2 |
| Chaos DoT | 858 | 3 | 3 | 6 | 3/0, 2/1, 1/2 |
| Warbringer | 10362 | 2 | 4 | 6 | 2/0, 1/1, 0/2 |

Splits are selected donor/recipient points. They share one original Main point
allowance per build, not two added local allowances. The twenty committed base
points remain included in each whole build. The first three Main caps are 123;
Warbringer's Main cap is 99 with its separate 24/24 weapon branches unchanged.
All eleven Warbringer attachment nodes remain protected in all three witnesses
and the exact winner.

The domains contain 22 unique graph node IDs and 19 distinct stat lines. They
overlap across builds, use only two class-root regions, and are not a random or
representative sample of every possible exchange.

## Independent Reward Review

The topology-only `plan.json` was written before collecting reward-review text.
`review-input.json` records that plan's hash. The source graph, benchmark and
selector also have frozen hashes. Rerunning selection reproduces the complete
domains and rejection records without inspecting rewards.

The nineteen stat lines include thirteen absent from the earlier literal ledger.
A separate additions file explicitly reviews them without changing that ledger,
any profile weight, or production matching. Unconditional `12% increased Armour`
has 60 integer units under the selected Warbringer profile:
`12 / 12 * 1 * 60 = 60`.

The other twelve new lines have documented zero contributions under these four
specific profiles: unselected player Energy Shield, Mana regeneration/recovery,
Freeze Buildup/Threshold, incoming debuff mechanics, and conditional
Defend-with-Armour. They are not treated as unconditional increased Armour,
Maximum Life, generic Chaos damage, or effects inherited by Minions/Companions.
Zero selected proxy contribution is not a claim of zero in-game value.

The combined review now has 59 explicitly covered literal lines. Unknown lines
and duplicate reviews block comparison. All arithmetic uses exact integers at
60 units per preference score. Production scoring is checked separately against
the reviewed rewards and saved incumbent; it is not the exact oracle's reward
source.

## Exact Results

| Context | Local reward units / score | Variable points | Feasible assignments | Whole Main points | Score gain / point saving |
| --- | ---: | ---: | ---: | ---: | --- |
| Spectres | 520 / 8.67 | 3 | 14 | 123 | 0 / 0 |
| Wolf Pack | 120 / 2.00 | 2 | 6 | 123 | 0 / 0 |
| Chaos DoT | 252 / 4.20 | 3 | 10 | 123 | 0 / 0 |
| Warbringer | 240 / 4.00 | 2 | 6 | 99 | 0 / 0 |

Local scores exclude constant fixed outside rewards. These are 36 per-domain
feasible assignments, not 36 unique global builds. The raw reference considers
all budget-eligible subsets, including under-spent allocations, and agrees with
the primary's score/fewer-points/lowest-mask tie break. No donor was traded in
the winning allocations.

**Coverage limitation:** the first numeric-ID recipient components have zero
selected proxy value in Spectres, Wolf Pack and Chaos DoT. Warbringer's recipient
does include valued Armour but does not beat the existing donor. The domains
prove that real point trading is legal; they do not thoroughly sample attractive
alternatives. This was not corrected by swapping in favorable regions after
seeing their scores.

Combined primary time was about 11.4 ms and independent reference time about
15.6 ms, excluding imports, structural preparation, source verification and
output writing. These small-domain timings do not predict whole-tree exact
performance. Existing linear-memory solver kernels and resource/cancellation
limits are unchanged. Cancelled/limited results would not be certificates.

## Verification and Evidence

- **104 research checks passed**, including ten new structural/review checks,
  eight new real-domain integration checks and the prior 86 checks.
- **440 focused optimizer/validation/allocation tests passed** across three files.
- Strict standalone TypeScript checking passed for three new research modules.
- Independent repeated edge scans prove donor/component completeness and all
  twelve full-budget witnesses, without reusing the selector's adjacency walker.
- The fast primary results also agree with the two earlier contracted/raw
  oracles on all four domains. A synthetic complete-branch fixture independently
  confirms a six-to-ten reward improvement at the same three-point total cost.
- All **136 protected earlier source/data/evidence files** and **seven frozen new
  plan/review/tool inputs** remain byte-identical. Source fingerprints match.
- Browser smoke, a full release build and a new heuristic benchmark were not
  repeated because this batch changes only offline research tools/tests/docs.

New tools are under `tools/research/branch-complete-*`. Local ignored evidence
is under `var/exact-branch-complete-20261108/`: immutable topology plan and review
input, protected/frozen hashes, per-case full input/result files,
`audit-v1/audit.json`, verified summary and logs. The thirteen new reviews are in
`tools/research/branch-complete-reward-additions.json`. No earlier evidence was
overwritten.

Reproduce from the active checkout using a fresh output directory:

```powershell
node --test tools/research/branch-complete-plan.check.mjs tools/research/branch-complete-integration.check.mjs
node --import tsx tools/research/branch-complete-audit.ts --output var/exact-branch-complete-20261108/rerun-02
```

The planner refuses to overwrite its plan/review input. Integration checks use
the retained `audit-v1` proof. Compare fresh outputs explicitly rather than
replacing earlier artifacts.

## Next Recommended Step

Freeze a batch covering **all bounded eligible recipient alternatives for these
same four donor branches**, not just the first numeric-ID component. Keep the
domain/protection rules and exact kernels unchanged, and record any dependent or
oversized exclusions before scoring. Store shared graph/context data once rather
than duplicating it in every case.

That can test attractive alternatives without selecting only favorable scores
or expanding production search complexity on the strength of another tie. Audit
the complete declared batch, including zero-reward cases, and use any reproducible
missed-value exchange as evidence for a targeted optimizer improvement.

The earlier unaudited 27/28-node Warbringer radius-pairs remain explicitly open;
this new structural batch does not certify them. This next recommendation is not
implemented here. None of these local additive-score results establishes Full
DPS, whole-tree optimality or actual in-game build power.

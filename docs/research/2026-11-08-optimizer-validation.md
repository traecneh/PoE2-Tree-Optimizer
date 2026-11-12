# Strict Optimizer Request and Result Validation

Implemented as the first follow-up to
[the GitHub optimizer investigation](2026-11-08-github-optimizer-opportunities.md).
This is a main-tree optimizer boundary, not a new solver, scoring system or
universal game-mechanics validator.

## Request Contract

`src/tree/buildGoalsValidation.ts` prepares a legal search graph and validates
the caller's declared constraints before any public solver runs:

- Required base/goal IDs and optional excluded IDs must exist. Unknown goals are
  errors, not silently removed or reported as already reached.
- The explicit root, or first base ID for legacy callers, must belong to the
  base. Base nodes must already be connected by valid supplied base edges.
- Duplicate input IDs/edges retain their existing set semantics. Returned route
  IDs/edges must be unique.
- Required and excluded allocations cannot conflict. Excluded, foreign class
  roots, ascendancy/mastery nodes and locked nodes cannot be used as transit.
- Ascendancy-gated main nodes require the selected ascendancy and required unlock
  in the supplied visibility context. Context IDs must belong to that ascendancy.
- Optimizer allocation pools other than `main` are explicitly unsupported.
  Existing weapon-set and ascendancy allocation remain manual-only.
- Declared budgets must be integral and in range. Existing Extra Points versus
  All Available semantics remain distinct; shortest/relative searches do not
  acquire a new implicit 123-point ceiling.

New optional request fields are `rootNodeId`, `allocationPool`,
`excludedNodeIds`, `treeFingerprint`, and `visibility`. The app supplies the main
pool, current path start, gate context and tree fingerprint automatically.
There is no new exclusion UI in this batch.

The fingerprint detects changes to nodes, effects, flags, positions, connections,
class roots and version. It is a deterministic non-cryptographic change detector,
not a security signature or saved-build migration format. Legacy callers may
omit an expected fingerprint; successful public solver results still include it.

## Result Contract

Before publication, every successful result and every alternative is checked for:

- Required/base preservation, permitted nodes and root-connected supplied edges.
- Exact new-node/new-edge differences from the fixed base; no duplicate counts.
- A complete, connected apply/prune order beginning at the root.
- Independently recounted new main-passive cost and the declared available budget.
- Consistent best-route cost/score and weighted baseline/budget metadata. The
  relative budget is checked against the actual retained shortest-baseline route,
  not just the result's self-reported baseline number.

Validation failures use the existing `error` status, a readable message and
structured `validationIssues` with invalid/unsupported classifications. No
invalid result is offered for preview or apply.

Public exact/bounded, anytime and weighted entry points use the same boundary.
The worker client rechecks progress/completion against its original snapshot.
Cancellation settles the pending promise and late worker messages are ignored;
startup/serialization failures become normal error results.

The hook also validates injected/custom runners and rechecks current tree,
root, gate and budget state on progress, route selection and apply. A rejected
preview restores the pre-run allocation when appropriate; it does not overwrite
a newer committed allocation. The legality context is reused while its inputs
are unchanged, avoiding a full graph rebuild for each progress message.

Weighted baseline discovery remains an unconstrained shortest search internally.
Over-budget baseline progress is not exposed as a weighted candidate; final
weighted candidates must meet the selected budget. This avoids prematurely
rejecting a search just because an early shortest incumbent is over budget.

## Scope Limits

The caller still owns the selected class and valid manual ascendancy/weapon
allocations. This validator checks the supplied main-tree model and visibility
prerequisites; it does not recalculate all ascendancy choice costs or both weapon
configurations. The app continues to derive All Available's main limit from its
existing weapon-set budget logic.

Special jewel/alternate-root mechanisms not represented in the graph are not
newly supported. The existing offline PoB import preflight and protected-effect
policy remain necessary. Passing validation proves neither global optimality nor
live-game completeness, Full DPS, or a patch-safe saved-build migration.

## Regression Evidence

- Literal graph/result fixtures do not use solver reconstruction helpers.
- An independent raw-edge/subset oracle checks 100 seeded tiny graphs and exact
  point minima. Each trial also exercises malformed counts, duplicates, unknown
  IDs, disconnected results, invalid roots/edges, exclusions, locked/foreign
  nodes, unsupported pools and budget violations.
- Focused cases cover required gate unlocks, stale snapshots, malformed
  alternatives, inflated weighted baselines, benign duplicate inputs, pending
  bases, zero-cost/already-reached routes, and malformed payloads.
- Fake-worker tests cover valid progress/completion, rejection before preview,
  stale results, cancellation/late messages, startup/serialization errors and the
  no-Worker fallback. Hook tests cover late progress after a graph change and
  revalidation at apply.
- Older mocked routes with incomplete goals/inaccurate costs, and two budget
  fixtures missing base edges, were corrected to declare valid allocations.
  Their assertions were not weakened to bypass validation.

Browser smoke: Edge loaded the real `0.5.5f` tree; two goals previewed/applied as
22 points; weighted Attributes with one extra point preserved that base and
applied as 23 total points. The only console error was a missing `favicon.ico`.
Firefox automation could not launch because the installed Playwright CLI expects
a different Firefox revision than the cached browser; no browser was installed
or cross-browser success claimed.

Final verification: `npm run validate:release` passed 2,133 tests across 95 files,
typecheck, production build, graph validation and the coverage baseline check.
The existing bundle-size warning remains non-fatal. The final-source Edge worker
flow was repeated after a clean app reload, including shortest preview/apply and
the weighted extension. No new dependencies, commits or deployment were made.

## Next Recommended Batch

Add a bounded shared-junction/connected-branch candidate strategy for larger
shortest-route searches. Preserve the current exact solver, fast incumbent and
weighted scoring. Its first measurable target is the research shared-trunk
fixture: improve 17 points to the independently proven 16, then compare realistic
builds at equal runtime. Connected-bundle weighted lookahead follows afterward.

Follow-up completed: [shared-junction and branch search](2026-11-08-shared-junction-search.md)
reaches that target. Weighted connected-bundle lookahead is now the recommendation.

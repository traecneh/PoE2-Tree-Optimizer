# GitHub Research: Optimizer Improvement Opportunities

Research date: November 8, 2026. Status: investigation and isolated experiments,
not an implementation or deployment proposal already accepted by the user.

Follow-up: [strict optimizer validation](2026-11-08-optimizer-validation.md) was
subsequently authorized and implemented. The findings and measurements below
remain the original pre-change snapshot; the search-quality gaps are not fixed
by validation alone.

Further follow-up: [shared-junction/branch search](2026-11-08-shared-junction-search.md)
now addresses the demonstrated shortest-route gap. The weighted bundle gap
remains the next proposed algorithm batch.

## Executive Assessment

Keep our current architecture and both optimization modes. We already have a
joint, node-cost Steiner-style exact solver for small goal sets, an improving
heuristic for larger sets, budgeted passive preferences, alternative routes,
worker isolation, and unusually careful offline PoB effect-protection tooling.
None of the reviewed projects is a demonstrated drop-in upgrade for all of this.

The best opportunities are narrower:

1. Validate requests and complete allocations centrally, rather than relying on
   each UI/import/generator boundary to supply legal inputs.
2. Expand shortest-route candidate generation beyond cached terminal-to-terminal
   shortest paths. Search shared non-goal junctions and replace connected branches.
3. Add connected-bundle lookahead and branch exchanges to weighted optimization.
4. Attach tree fingerprints to saved builds and offer copy-and-review migrations.
5. Measure route quality against independent oracles, not just expected examples.

Two isolated counterexamples make the search recommendations concrete: our
11-goal heuristic finds **17 points where exhaustive enumeration proves 16**;
our weighted heuristic scores **12 where enumeration proves 20 at the same
9-point budget**. These are small artificial graphs, not claims about the typical
gap on a real build. Conversely, the current optimizer beats independent shortest
path unions on every sampled real-tree case below.

Do not replace routing with a generic greedy PoB optimizer, raise exact search
to 25/50 goals, import another application's UI, or ship a native solver in the
Pages site without evidence that the change helps.

## 1. Scope, Provenance and Verification

### Our Snapshot

- Checkout: `.worktrees/main-tree-viewer`; HEAD
  `710dc5eb521be1788011c22b1051e299a5508022`, **plus the existing uncommitted work**.
  HEAD alone does not reproduce the working-tree algorithms reviewed here.
- Source graph: PoE2 `0.5.5f`, 4,762 nodes and 5,426 links before visibility and
  main-tree filtering. Raw `data/tree-graph.json` SHA-256:
  `75d9579d3c23cc5c091d102e391425241df0b01fbac580b7637f65f9f01b5425`.
- `src/tree/buildGoalsOptimizer.ts` SHA-256:
  `8aff43a872a0cebc9b2078feadfd64150946bcbe4afa01b5c444c8abf6f3cdfc`.
- `src/tree/weightedBuildGoalsOptimizer.ts` SHA-256:
  `f1b788f0378bbe59503011833a1e5c2eb5bad426b352c2258c13b5f915602467`.
- These identify our reviewed inputs; the research did not independently certify
  that every game mechanic or live patch is represented by this graph.

### Research Method

Reviewed local production code and tests first, then public GitHub source,
licenses, manifests and CI configuration at the pinned commits below. Additional
repositories were independently located through GitHub/web searches. Foreign
applications, dependency installers, test suites and PoB runtimes were **not run**.
Test and CI observations describe checked-in code, not verified green CI runs.
Repository dates are HEAD commit dates, not guarantees of ongoing maintenance.

Experiments execute our own existing TypeScript solvers through a research-only
script. No production behavior, saved build, installed PoB, game file, deployment
or dependency manifest was changed. Public shallow clones and raw output are
under ignored `var/github-research-20261108/`. Existing dirty work was preserved.

## 2. Current-State Assessment

### Architecture and Responsibilities

| Layer | Current implementation | Assessment |
| --- | --- | --- |
| Data and geometry | `src/extract/psg.ts`, table joins, `src/tree/types.ts`; PSG groups, orbits, signed connection-orbit data and visibility metadata | Preserve the source-derived geometry; do not replace accurate curves with layout guesses. |
| Manual allocation | `src/tree/pathAllocation.ts`, app allocation/weapon-set helpers | Multi-source BFS to the closest allocation; separate manual W1/W2 and ascendancy behavior. Already substantially implemented. |
| Joint shortest optimization | `src/tree/buildGoalsOptimizer.ts` | Node-cost subset DP for small sets; metric-MST/marginal randomized search for larger ones. Shared nodes counted once. |
| Weighted optimization | `src/tree/weightedBuildGoalsOptimizer.ts`, preference/preset/support modules | Additive, scoped, reviewed passive preferences with travel and budget constraints; not a character DPS calculator. |
| Execution and preview | optimizer client/module worker, `src/app/useBuildGoalsState.ts` | Progress, cancellation, preview before apply, and the current visible allocation as fixed base. |
| Tree interface | React/SVG `src/viewer/TreeViewer.tsx` with memoized node components | Not a Canvas application. No rendering rewrite justified by this investigation. |
| Saved/imported builds | `savedBuilds.ts`, transfer/import modules, saved-build workflow | PoB metadata, weapon allocation and local saves already exist; patch-aware migration remains weaker. |
| Native evaluation | `tools/pob-evaluation/` and existing PoB research docs | Isolated whole-build evaluation, import preflight, unmodeled-effect protection, protected generation and a one-command audit already exist offline. |

### What Shortest Mode Actually Optimizes

For a supplied graph, base allocation B, and exact required goals T, it minimizes
the number of distinct new nodes in a connected extension of B containing T.
Base nodes cost zero; new nodes cost one. Branching and shared travel are allowed.
The base is preserved, including any pending route being used as the visible base.
This is **not** a respec of all previously allocated nodes.

Exact search is selected only when the number of remaining goals is at most 10
and `2^goals * graphNodeCount <= 6,000,000`. It uses node-cost subset dynamic
programming with merge and shortest-path relaxation, not one independent path
per goal. Its exactness concerns this static additive graph model with a valid
connected base. It is not a proof of legality or optimality for arbitrary jewels,
gates, weapon pools, attribute choices or unmodeled game effects.

The larger-set anytime implementation builds shortest-path tables from the base
and each goal, forms a terminal metric graph, and tries an MST plus marginal
greedy construction. Restarts randomize marginal choices and metric-edge costs.
Ordinary browser runs stop after 60 seconds without a better point count, not
after the first feasible route. New best results reset that inactivity window.
The separate synchronous `optimizeBuildGoals` entry point uses a bounded heuristic
for large sets; callers must not confuse it with the worker's anytime entry point.

The important limitation is **where paths come from**: the larger shortest solver
reuses a single cached predecessor route for each terminal pair. Marginal cost is
recalculated on those paths, but shortest paths are not regenerated from every
new Steiner junction. Randomizing which cached paths are joined cannot discover
every useful shared trunk. Nonterminal leaves are trimmed; there is no general
connected-branch replacement or global respec search.

### What Weighted Mode Actually Optimizes

For each newly added node, supported effect values are normalized by each
preference's scale and multiplied by its user weight. The objective is the sum
over unique newly added nodes; fixed base nodes receive no new reward. Scope,
ownership, application and overlap checks reside in the preference/preset layers.
This is a useful surrogate, **not Full DPS, EHP, or a universal power score**.

The shortest baseline gets at most 32 heuristic iterations when it is not exact.
The relative budget is the shortest baseline **found**, plus Extra Points; its
metadata records whether that baseline was exact. All Available instead uses the
remaining main-tree limit, normally derived from 123 minus the larger weapon-set
allocation. Relative Extra Points mode does not itself impose that total limit;
keep this distinction explicit rather than silently changing existing semantics.

Weighted construction tries several positive node-cost transformations, rebuilds
goal routes, then greedily augments useful endpoint paths by gain per new node.
Randomized augmentation chooses among the top three paths. This can miss a group
of good nodes behind shared travel if each individual endpoint initially looks
worse than nearby bait. It cannot subsequently replace a chosen optional branch
with a better connected bundle. Weighted search is heuristic even for one goal.

### Correctness, Alternatives and Boundaries

- `Set`-based materialization counts shared new nodes once. Existing tests cover
  shared nodes, branching, zero-cost bases, unreachable goals and deterministic
  reconstruction. Pool-specific point counting also exists outside the kernel.
- Alternatives are capped at 18, with up to three per point-cost bucket. Shortest
  signatures distinguish edge sets; weighted signatures distinguish node sets.
  There is no structural-distance selection, so minor variants can dominate.
- The optimizer request has no explicit exclusion list, allocation-rule context,
  tree fingerprint or point-pool identity. `isAllocatableTreeEdge` is a useful
  structural filter, not a complete game-rules validator.
- Unknown goal IDs are silently filtered; disconnected base components are all
  treated as free sources. The boundary probes below reproduce both behaviors.
  These are kernel-contract weaknesses, **not evidence that normal UI clicks
  currently create disconnected builds**.
- Visibility gating and import/weapon/ascendancy sanitization provide important
  defenses, but do not replace a final validator shared by every generator/apply.
- Worker cancellation terminates the worker, but does not settle its returned
  promise. The UI discards its run reference; improve the contract and test stale
  messages before introducing persistent workers. No visible cancellation bug
  was reproduced here.

### Performance: Evidence Versus Hypotheses

Measured: exact DP has a much higher peak process footprint in the nine-goal
probe than the heuristic probes. Cost arrays plus object parent records are a
plausible source; the state-count guard is not a browser heap guarantee.

Not measured separately: graph structured-cloning on each new worker, repeated
graph indexing, preference lookup, augmentation path reconstruction/sorting,
progress rendering, and the growing set of previously seen candidate signatures.
Profile these before optimizing them. Retaining 18 routes does not mean all
search bookkeeping is bounded to 18 entries. The no-Worker fallback executes on
the main thread and cannot promise interactive cancellation during synchronous
work; it deserves an explicit fallback policy, not a claim of worker isolation.

## 3. Isolated Benchmark Results

### Reproduction and Limits

Run from the active checkout, using existing dependencies:

```powershell
node --import tsx tools/research/optimizer-baseline-20261108.ts
```

The script is outside application imports and CI/release workflows. It writes
`var/github-research-20261108/benchmark.json`; rerunning overwrites that ignored
research output. Keep dated copies if comparing future implementations.

Captured November 8 at 16:24 UTC: Node 22.18.0, Windows x64,
Intel Core i9-11900K. Fresh Node/tsx subprocess for each case. Times below are
solver-only single trials, not browser benchmarks or statistically stable
performance estimates. Peak RSS is the **absolute process peak**, including the
loader and graph; it is neither incremental solver memory nor browser heap.
Shortest heuristic probes use 128 iterations, weighted uses 256. These are not
60-second runs. Production input hashes are recorded above; each request also
gets a SHA-256 fingerprint in the JSON output.

### Independent Correctness and Search-Gap Probes

| Probe | Production result | Independent oracle | Meaning |
| --- | --- | --- | --- |
| 30 seeded small graphs, 10 nodes, 3 goals | All exact costs agree | Exhaustive enumeration of connected node subsets | Useful independent check of the small exact kernel; not a general proof or coverage of special mechanics. |
| Shared-trunk fixture, 23 nodes, 11 goals | 17 new nodes; one retained candidate | 16 new nodes | Heuristic misses a shared non-goal junction structure. |
| Shared-reward fixture, 18 nodes, 1 goal, 9 new-point ceiling | Score 12 at 9 points | Score 20 at 9 points | Endpoint-greedy augmentation misses a connected reward bundle. |
| Unknown requested goal | `success`, zero new nodes | Missing requested goal detected | Do not silently normalize away mandatory requirements. |
| Disconnected two-component base | `success` | Result not connected to the declared root | Validate the base before treating all of it as free sources. |

Shared-trunk construction: three goals each have a private three-point route
from the root. A two-point common trunk followed by a two-point spoke per goal
costs eight, rather than nine. Eight mandatory root leaves bring the case to
11 goals and exercise the heuristic: 8 + 8 = 16 versus 9 + 8 = 17. Individual
terminal shortest paths prefer the private routes or goal-to-goal connectors;
merely selecting different MST edges cannot introduce the needed root-to-hub
connection. A dynamic nearest-goal BFS baseline also returns 17: recomputing the
nearest path alone is insufficient without junction/bundle lookahead.

Weighted construction: one mandatory point plus eight optional points. Four
two-point bait branches each score three, for twelve. A shared three-point
travel trunk plus five one-point reward leaves scores twenty using the same
eight optional points. Rewards are simple supported Strength values, not PoB
synergy. Exhaustive enumeration checks all optional subsets for connectivity
and budget. This gap is in candidate search, not the effect parser.

Both production routes passed the experiment's structural validator. That
validator checks required/base inclusion, unique nodes, supplied edge validity,
root connectivity and new-node counts; it does not certify all PoE mechanics.

### Real Main-Tree Samples

Filtered graph: 3,912 nodes, 4,543 links, Witch root `54447`; no unlocked Oracle
nodes, ascendancy/mastery nodes, or foreign class roots. Seed `20261108` selects
nested notable goal sets within 28 hops. Baselines use the same graph and goals.
Root path union deduplicates separate root-to-goal paths. Dynamic marginal BFS
reconnects the nearest outstanding goal from the entire current allocation.

| Goals | Our new points | Root path union | Dynamic marginal BFS | Our time, ms | Process peak, MiB | Method |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 3 | 42 | 47 | 43 | 48.5 | 101.2 | Exact |
| 6 | 70 | 83 | 73 | 142.6 | 119.0 | Exact |
| 9 | 87 | 108 | 90 | 909.4 | 215.5 | Exact |
| 11 | 96 | 121 | 96 | 329.9 | 107.9 | Anytime, 128 iterations |
| 25 | 172 | 203 | 174 | 793.3 | 108.7 | Anytime, 128 iterations |
| 50 | 283 | 318 | 283 | 2,769.1 | 110.8 | Anytime, 128 iterations |

The 25/50-goal samples are deliberately spread-out **stress cases above a
123-point build budget**, not feasible character builds or evidence of budget
enforcement. Shortest mode received no budget constraint in these probes.
They test search scaling and continuing improvement. Realistic under-budget
25/50-goal benchmark builds are still needed.

Observed incumbent histories:

- 11 goals: 100 at 36.7 ms -> 96 at 39.0 ms.
- 25 goals: 180 at 51.2 ms -> 174 at 56.8 ms -> 173 at 68.8 ms -> 172 at 359.4 ms.
- 50 goals: 287 at 64.0 ms -> 285 at 85.1 ms -> 284 at 355.5 ms -> 283 at 737.0 ms.

This demonstrates continued improvement, not a global optimum for those cases.
No external repository's optimizer was executed or timed against ours. We have
not established any cross-project speed or quality winner.

## 4. Repository Comparison

License findings are practical screening, not legal advice. Our code is MIT.
MIT reuse requires preserving applicable copyright/license notices. Project code
licenses do not grant redistribution rights to GGG art/data, PoB's other
components, or all transitive dependencies. No external implementation was copied
into production in this investigation.

### Snapshot and Maintenance Inventory

| Repository | Pinned commit | HEAD date | Code license | Relevant stack and verification observations |
| --- | --- | --- | --- | --- |
| [etancik/poe2-forge](https://github.com/etancik/poe2-forge) | `6b923fbc1a8f16e1f92ff60db5759224fe50bf37` | 2026-08-12 | [MIT](https://github.com/etancik/poe2-forge/blob/6b923fbc1a8f16e1f92ff60db5759224fe50bf37/LICENSE) | Node/CommonJS plus external native PoB; optimizer tests present; no GitHub CI workflow observed. |
| [MaxWilk/poe2-build-mcp](https://github.com/MaxWilk/poe2-build-mcp) | `2414ef8105d4e620c8ca0e0a2cebd604eee0722a` | 2026-06-23 | [MIT](https://github.com/MaxWilk/poe2-build-mcp/blob/2414ef8105d4e620c8ca0e0a2cebd604eee0722a/LICENSE) | Python/MCP, LuaJIT headless process; golden/integration tests and cross-platform CI configuration. |
| [cvenzin/poe2-skilltree](https://github.com/cvenzin/poe2-skilltree) | `6cee084f926706a41434cf85b05701139e386e69` | 2026-11-07 | [MIT; GGG reservation](https://github.com/cvenzin/poe2-skilltree/blob/6cee084f926706a41434cf85b05701139e386e69/LICENSE) | React/TypeScript, Zustand, Canvas; deployment workflow includes tests, lint and build. |
| [poe2-tools/poe2-build-planner](https://github.com/poe2-tools/poe2-build-planner) | `a173f7b0d398951693fee83ee5ee40f327d4a749` | 2026-06-23 | [MIT code; GGG exclusions](https://github.com/poe2-tools/poe2-build-planner/blob/a173f7b0d398951693fee83ee5ee40f327d4a749/LICENSE) | React/Zustand/Vite; unit/round-trip tests present, inspected deploy workflow builds but does not run tests. |
| [rajtik76/poe2-toolkit](https://github.com/rajtik76/poe2-toolkit) | `6a76992a93d21af87c941d9e8b8cbd8a7fa0df64` | 2026-10-14 | [MIT](https://github.com/rajtik76/poe2-toolkit/blob/6a76992a93d21af87c941d9e8b8cbd8a7fa0df64/LICENSE) | TypeScript monorepo; Node GGPK/table tooling and separate browser core; unit/characterization tests and CI. |
| [juddisjudd/ggpk-explorer](https://github.com/juddisjudd/ggpk-explorer) | `30ef53b5c09ad5bb5a4c53dcaff4394497c91d08` | 2026-10-28 | [GPL-3.0](https://github.com/juddisjudd/ggpk-explorer/blob/30ef53b5c09ad5bb5a4c53dcaff4394497c91d08/LICENSE) | Rust/egui with compression, HTTP and indexing libraries; inline Rust tests and CI/release workflows. |
| [JavelinSx/poe2lab](https://github.com/JavelinSx/poe2lab) | `983443c2ff825bb2a8a6a30d2f3acad411b97ef5` | 2026-10-25 | [MIT](https://github.com/JavelinSx/poe2lab/blob/983443c2ff825bb2a8a6a30d2f3acad411b97ef5/LICENSE) | Python/local web and native PoB; substantial engine/tree tests, no GitHub CI workflow observed at this pin. |

All seven were available. Recent activity is encouraging, but no project's HEAD
date proves compatibility with our exact `0.5.5f` extraction. Compatibility needs
matched graph/schema/runtime fixtures, not a shared `0.5` label.

### 4.1 poe2-forge: Best Source of Validation and Search Ideas

The [candidate model](https://github.com/etancik/poe2-forge/blob/6b923fbc1a8f16e1f92ff60db5759224fe50bf37/scripts/lib/passive-optimizer/model.js)
includes tree identity, allocation choices, point pools and required/forbidden
state. Its [validator](https://github.com/etancik/poe2-forge/blob/6b923fbc1a8f16e1f92ff60db5759224fe50bf37/scripts/lib/passive-optimizer/validator.js)
checks roots, connectivity, budgets, choices, gates and graph identity; special
generated cases can require PoB rather than being declared fully validated.
This is stronger than our kernel's assumption that its base is already legal.

The [rerouter](https://github.com/etancik/poe2-forge/blob/6b923fbc1a8f16e1f92ff60db5759224fe50bf37/scripts/lib/passive-optimizer/reroute.js)
tries several terminal orders with point/respec priorities. It is heuristic, and
deliberately avoids traversing some unallocated attribute/choice structures. It
is not a general exact replacement for our small-goal DP. Its sorted queue also
isn't an obvious upgrade over our heap-based shortest paths.

The [search](https://github.com/etancik/poe2-forge/blob/6b923fbc1a8f16e1f92ff60db5759224fe50bf37/scripts/lib/passive-optimizer/search.js)
and [medium-search transactions](https://github.com/etancik/poe2-forge/blob/6b923fbc1a8f16e1f92ff60db5759224fe50bf37/scripts/lib/passive-optimizer/medium-search.js)
are more relevant: bounded beams, connected branch/bundle edits, connectivity
repair, deduplication and candidate diversity. These explore changes our
construct-only approach misses. They still provide no global proof.

[Selective evaluation](https://github.com/etancik/poe2-forge/blob/6b923fbc1a8f16e1f92ff60db5759224fe50bf37/scripts/lib/passive-optimizer/selective-evaluation.js)
mixes predicted quality, uncertainty, structure and exploration, with native
verification/cache identity. Its [third-party policy](https://github.com/etancik/poe2-forge/blob/6b923fbc1a8f16e1f92ff60db5759224fe50bf37/THIRD_PARTY.md)
separates code from locally provided game/PoB data.

**Decision:** independently implement a small validator and connected-edit search
in our TypeScript types; benchmark against our baseline. Consider an attributed
MIT helper only if demonstrably simpler. Do not import the whole workflow or
assume its engine results establish game truth.

### 4.2 poe2-build-mcp: Useful Evaluation Runtime, Not Better Joint Routing

The actual [Lua passive optimizer](https://github.com/MaxWilk/poe2-build-mcp/blob/2414ef8105d4e620c8ca0e0a2cebd604eee0722a/pob/pob_headless.lua)
greedily evaluates candidate paths with PoB calculations, normally considering
the nearest 50 candidates. Selection uses positive raw objective gain, not a
global joint-route solve. Relative weighted metrics have a special arbitrary
normalization when baseline values are zero. A balanced objective does not
guarantee a minimum Life/EHP floor.

Mandatory requirements have materially different semantics: on a fresh/reset
tree it attempts sequential required paths, but requirements may be skipped
when over budget or when optimizing an existing tree. That is not acceptable as
a substitute for our hard selected-goal contract. Broad optimizer descriptions
must be read alongside these implementation details.

The [Python engine](https://github.com/MaxWilk/poe2-build-mcp/blob/2414ef8105d4e620c8ca0e0a2cebd604eee0722a/server/compute/engine.py)
uses a persistent synchronized JSON-RPC process. This could amortize native PoB
startup if later measurements show it dominates whole-candidate evaluation.
[PINNED.md](https://github.com/MaxWilk/poe2-build-mcp/blob/2414ef8105d4e620c8ca0e0a2cebd604eee0722a/pob/PINNED.md)
documents upstream `a82a33b`, local patches and runtime limitations. Its actual
CI obtains pinned upstream code and applies patches; do not infer byte identity
with our installed/runtime snapshot from its README or coarse `0_5` tree folder.
[Passive tests](https://github.com/MaxWilk/poe2-build-mcp/blob/2414ef8105d4e620c8ca0e0a2cebd604eee0722a/tests/test_passives.py)
exercise engine/path/pool behavior, but were not executed here.

**Decision:** retain our routing, guarded offline evaluator and effect policy.
Investigate persistent evaluation later as an optional local companion. Native
LuaJIT/Python/MCP cannot simply execute in GitHub Pages. Do not add MCP or AI
dependencies merely to obtain a local scoring function.

### 4.3 cvenzin/poe2-skilltree: Allocation Rules and Safe Patch Changes

[Pathing](https://github.com/cvenzin/poe2-skilltree/blob/6cee084f926706a41434cf85b05701139e386e69/src/interaction/pathing.ts)
uses multi-source BFS with class, mode and gate filtering, plus special Oracle
handling. This is adjacent to what our manual pathing already does, not a
multi-goal optimizer. Special radius/noncontiguous rules need independent game
and PoB fixtures before borrowing them.

[Build rules](https://github.com/cvenzin/poe2-skilltree/blob/6cee084f926706a41434cf85b05701139e386e69/src/state/buildRules.ts)
centralize pool, choice and cascade-connectivity rules. The more valuable feature
is [version changes](https://github.com/cvenzin/poe2-skilltree/blob/6cee084f926706a41434cf85b05701139e386e69/src/state/buildVersionChange.ts):
copy-to-version, reconciliation/loss reporting, and guards against stale async
requests. Our current load-time filtering can discard now-missing node/goal IDs
without an equivalent tree-version migration review.

The [version catalog](https://github.com/cvenzin/poe2-skilltree/blob/6cee084f926706a41434cf85b05701139e386e69/src/data/versions.ts)
includes a `0.5.5` default, not proof of equality to our lettered graph snapshot.
Its tests and deployment gates are worth emulating; Canvas/Zustand are not
reasons to rewrite our React/SVG viewer.

**Decision:** independently adapt the migration/central-rule pattern. Preserve
original saves, report dropped and semantically changed allocations, and require
confirmation before saving a migrated copy.

### 4.4 poe2-build-planner: Native Build Codec and Point-Pool Examples

[Allocation](https://github.com/poe2-tools/poe2-build-planner/blob/a173f7b0d398951693fee83ee5ee40f327d4a749/src/tree/allocation.ts)
provides BFS connection, root-connected cascade removal and point classification,
including free starts/choice options. These are reference fixtures for a common
rules layer, not proof that our existing point counter is wrong. Its June update
targets `0.5.2`, so newer mechanics must be checked.

Weapon sets are not a reason to replace our stricter allocation layer. Its
[click handler](https://github.com/poe2-tools/poe2-build-planner/blob/a173f7b0d398951693fee83ee5ee40f327d4a749/src/state/store.ts)
tags newly added paths with the selected weapon set while routing through one
combined allocation set. The reviewed counter separates main/ascendancy points,
not per-weapon limits; no 24-point enforcement was found in this allocation path.
Its [range tests](https://github.com/poe2-tools/poe2-build-planner/blob/a173f7b0d398951693fee83ee5ee40f327d4a749/src/state/ranges.test.ts)
check tag preservation/dimming, which is different from proving each weapon
configuration is independently connected and within budget.

The [native build parser](https://github.com/poe2-tools/poe2-build-planner/blob/a173f7b0d398951693fee83ee5ee40f327d4a749/src/buildfile/parse.ts)
and [serializer](https://github.com/poe2-tools/poe2-build-planner/blob/a173f7b0d398951693fee83ee5ee40f327d4a749/src/buildfile/serialize.ts)
preserve unknown fields while handling records such as weapon sets, level
intervals and inventory slots. This is a useful interoperability opportunity,
but native GGG `.build`, PoB XML/share codes and our saved JSON are distinct
formats. Test ID mapping, attribute choices, gates and round trips with actual
game-exported fixtures before claiming compatibility.

**Decision:** medium-priority optional codec, preferably a small attributed MIT
adapter or independent implementation. Do not import its whole store/renderer.
Keep unknown fields intact and never auto-overwrite an imported source file.

### 4.5 poe2-toolkit: Independent Data Oracle, Not a Needed Runtime Rewrite

Its [source boundary](https://github.com/rajtik76/poe2-toolkit/blob/6a76992a93d21af87c941d9e8b8cbd8a7fa0df64/packages/poe2-ggpk/src/source.ts)
separates decoded table/file access from extraction. The
[CDN source](https://github.com/rajtik76/poe2-toolkit/blob/6a76992a93d21af87c941d9e8b8cbd8a7fa0df64/packages/poe2-ggpk/src/cdnSource.ts)
uses patch-scoped caching, in-flight request deduplication, checked HTTP failures
and temporary-write/rename persistence. These are good infrastructure patterns.
Node-side GGPK acquisition brings `pathofexile-dat` and filesystem requirements;
browser core packages are separate. Do not bundle acquisition into the site.

The [PSG parser](https://github.com/rajtik76/poe2-toolkit/blob/6a76992a93d21af87c941d9e8b8cbd8a7fa0df64/packages/poe2-tree-extractor/src/psg.ts)
preserves signed connection-orbit/unknown fields and checks input consumption.
Our extractor already handles source-based geometry; an independently derived
graph is valuable for differential tests, not evidence that replacing ours is
necessary. The monorepo also has gem/item extractors, but adding a catalog entry
is not the same as reviewing its skill/support semantics for weighted scoring.

**Decision:** an isolated dev-time comparison adapter on the same raw inputs.
Compare IDs, edges, geometry, gates and free-choice classification. Record schema
and input hashes; manually investigate differences instead of accepting whichever
extractor produces more nodes. Check package/transitive licenses before reuse.

### 4.6 ggpk-explorer: Patch Forensics with a Different License

The [bundle index parser](https://github.com/juddisjudd/ggpk-explorer/blob/30ef53b5c09ad5bb5a4c53dcaff4394497c91d08/src/bundles/index.rs)
and [PSG reader](https://github.com/juddisjudd/ggpk-explorer/blob/30ef53b5c09ad5bb5a4c53dcaff4394497c91d08/src/dat/psg.rs)
can provide independent extraction evidence. They reinforce that packed bundle
index/path information matters; a Content.ggpk filename alone is not a complete
decoded table/path dataset.

[Diffing](https://github.com/juddisjudd/ggpk-explorer/blob/30ef53b5c09ad5bb5a4c53dcaff4394497c91d08/src/diff.rs)
distinguishes content modifications from entries merely touched/repacked.
[Patch checks](https://github.com/juddisjudd/ggpk-explorer/blob/30ef53b5c09ad5bb5a4c53dcaff4394497c91d08/src/patch_check.rs)
report schema fit, unresolved layout and version discrepancies instead of
assuming that successful decoding proves the schema is correct. Inline Rust
tests exist; absence of a separate test directory would be a misleading metric.

**Decision:** use as a separately run developer cross-check when needed. Do not
copy/link GPL code into our MIT distribution without deliberate license review.
Independently implementing hash manifests and reviewed patch reports is simpler
than bringing in the desktop Rust GUI and its dependency tree.

### 4.7 poe2lab: Connected Respec Packages and Conservative Protection

[Tree analysis](https://github.com/JavelinSx/poe2lab/blob/983443c2ff825bb2a8a6a30d2f3acad411b97ef5/poe2lab/analysis/tree.py)
evaluates path growth, travel-inclusive value/cost and connected branch removal.
Its respec loop tries bounded randomized weak-branch removal and greedy regrowth,
then rolls back if improvement is insufficient. That is useful local search,
not an exact whole-build optimizer. It distinguishes road-only and target
benefits and conservatively protects certain unmodeled/attribute effects.

[Engine state](https://github.com/JavelinSx/poe2lab/blob/983443c2ff825bb2a8a6a30d2f3acad411b97ef5/poe2lab/engine/pob.py)
snapshots attribute overrides and weapon allocation modes in addition to nodes.
We must preserve equivalent state in any future respec evaluator. Its custom
uptime/resource assumptions are not automatically game truth.
[Tests](https://github.com/JavelinSx/poe2lab/blob/983443c2ff825bb2a8a6a30d2f3acad411b97ef5/tests/test_tree.py)
cover travel, protection and rollback; one link-integrity assertion is neutralized
by `or True`, illustrating why test presence alone cannot establish correctness.

**Decision:** learn the connected-edit/rollback pattern. Retain our existing
fail-closed effect policy and native reload cross-checks; do not adopt broad
offence/defence or uptime weights without explicit scenario inputs.

## 5. Additional Projects Found Independently

### PoESkillTree/PoESkillTree

Pinned `459df43fcd7a00c43285fe488bc0a2b4f6421921` (2022-02-20),
[MIT](https://github.com/PoESkillTree/PoESkillTree/blob/459df43fcd7a00c43285fe488bc0a2b4f6421921/LICENSE.md).
The [Steiner solver](https://github.com/PoESkillTree/PoESkillTree/blob/459df43fcd7a00c43285fe488bc0a2b4f6421921/WPFSKillTree/TreeGenerator/Solver/SteinerSolver.cs)
searches additional junction nodes with a genetic representation and reconstructs
metric MST routes. This is heuristic, despite optimistic comments about finding
an optimum. Its [preprocessor](https://github.com/PoESkillTree/PoESkillTree/blob/459df43fcd7a00c43285fe488bc0a2b4f6421921/WPFSKillTree/TreeGenerator/Algorithm/SteinerPreprocessor.cs)
contracts/reduces the graph and explicitly limits reductions for weighted
variants. Algorithm tests exist; old PoE1/WPF models and dependencies are not
current PoE2 compatibility evidence.

**Use:** junction-search and reversible reduction ideas. Do not port PoE1
masteries, attribute rules or desktop architecture. Genetic search is a later
benchmark candidate, not the first fix for the demonstrated shared-trunk miss.

### Lilylicious/PathofPathing

Pinned `b2c4a1da516da64a57b5f932b80335970ab1bd6a` (2026-07-22),
[MIT](https://github.com/Lilylicious/PathofPathing/blob/b2c4a1da516da64a57b5f932b80335970ab1bd6a/LICENSE.md).
The [reviewed group allocator](https://github.com/Lilylicious/PathofPathing/blob/b2c4a1da516da64a57b5f932b80335970ab1bd6a/models/algorithms/AllocateNodeGroupsAlgorithm.ts)
merges desired groups and shortest connectors with heuristic group weights and
mandatory articulation handling. It contains PoE1/Atlas-specific life/travel
preferences. The reviewed path is not an exact Steiner solver; older external
descriptions of genetic optimization are not evidence that this file uses it.
No external tests were run or current PoE2 mapping established.

**Use:** group-aware connector generation as another seed strategy; independently
derive weights and legality from our current graph. Not a renderer/data replacement.

### alecrivet/poe-optimizer

Pinned `19fce64c7412a80ec3076c9207761390f96cfc6b` (2026-09-10).
The [tree optimizer](https://github.com/alecrivet/poe-optimizer/blob/19fce64c7412a80ec3076c9207761390f96cfc6b/src/optimizer/tree_optimizer.py)
uses greedy/paired add-remove exploration with persistent PoB worker machinery;
other search modules also exist. Its single/pair improvement approach is useful
inspiration, not evidence of a global result. This is a PoE1 Python/native-PoB
system. Test files are present; no inspected CI established their current health.
The README says MIT, but no standalone license file was found at this pin and
GitHub license metadata was unset. Direct reuse needs license clarification.

**Use:** independently implement point-neutral connected swaps if benchmarks
justify them. Do not copy code based solely on the README license label or adopt
its character-calculation assumptions without a separate audit.

### philipxjm/poe-atlas-planner

Pinned `db411c3a13ea942ff07f9b5e094830f657848d24` (2026-08-21),
[MIT code with asset exclusions](https://github.com/philipxjm/poe-atlas-planner/blob/db411c3a13ea942ff07f9b5e094830f657848d24/LICENSE).
Its [exact solver](https://github.com/philipxjm/poe-atlas-planner/blob/db411c3a13ea942ff07f9b5e094830f657848d24/js/steiner-exact.js)
uses partition-state DP over a bounded-width tree decomposition, rather than an
exponential goal-mask table. This is interesting for many goals **if our graph
has manageable decomposition width**; that width has not been measured here.
The implementation caps bag size and uses an edge-cost/root model that needs a
careful transformation for our zero-cost multi-node base and node rewards.

Its [worker orchestration](https://github.com/philipxjm/poe-atlas-planner/blob/db411c3a13ea942ff07f9b5e094830f657848d24/js/solver.js)
also has time/width fallbacks. Consequently README wording suggesting every
answer is exact overstates the full execution path. No automated test suite was
located at the inspected pin, and no results were reproduced here.

**Use:** a bounded, isolated treewidth feasibility experiment after immediate
quality fixes. Never assume the PoE1 Atlas graph's width or exact guarantees
transfer to our PoE2 graph.

## 6. Algorithm Recommendations

| Method | Already used? | Proposed role | Caveat / priority |
| --- | --- | --- | --- |
| BFS | Yes, manual routing/distances | Keep for unit-cost nearest allocation; independent baseline | One-source-per-goal union is not joint optimization. |
| Multi-source heap Dijkstra | Yes | Keep for zero/positive node costs; regenerate paths when the candidate frontier changes | Need new junctions/bundles as well as dynamic paths. High. |
| A* | No | Only benchmark for a proven admissible multi-target lower bound | Screen/Euclidean distance is not automatically an admissible passive-point heuristic. Low for current task. |
| Subset Steiner DP | Yes, small goals | Preserve as exact oracle/production small mode; compact state/parent records only if profiled | Exponential states/merges; do not raise cap to 25. |
| Metric-MST and randomized marginal seeds | Yes | Retain fast incumbents; add new candidate neighborhoods | Cached shortest paths exclude useful shared structures. |
| Junction insertion and connected branch replacement | No general implementation | Try nonterminal hubs, remove/reconnect redundant branch packages, accept only valid improvements | Directly targets shared-trunk probe. High. |
| Connected-bundle beam search | No | Width 8-32, depth 2-3 as initial experimental settings; budget-feasible bundle growth/exchange | Settings are proposals, not measured winners. High for weighted quality. |
| Group-aware/Steiner genetic search | No | Alternative seeded strategy after simpler neighborhoods | More state/tuning; needs equal-budget multi-seed comparisons. Medium. |
| Integer programming / branch-and-cut | No | Offline reference solve and certified bound/gap for realistic fixtures | Model node/pool/gate semantics correctly; not an immediate browser dependency. Medium research priority. |
| Tree-decomposition DP | No | Measure decomposition width and state counts on our graph | Exact only on supported model when completed; width/time fallback must be explicit. Medium research priority. |
| Whole-route PoB reranking | Offline evaluator exists, not browser mode | Evaluate a small legal shortlist with fixed build/scenario/runtime | Surrogate routing scores and real character metrics are distinct; retain protection. Later. |

### Objective and Model Discipline

Keep two explicit mathematical problems:

- Shortest: minimize new paid nodes with required nodes included, prohibited nodes
  excluded, and a legal connected extension of the fixed base.
- Weighted: maximize the supported sum of passive benefits under a specified
  paid-node budget, with all required goals and fixed allocations preserved.
  Break score ties by point cost and deterministic identity.

Do not make useful nodes negatively priced and then feed them to Dijkstra.
Our current positive cost transformation is a heuristic guide, not an exact
reformulation of budgeted reward maximization. Include intermediate travel
benefits once, and preserve separate bonus ownership/scope.

For an offline MIP reference, use binary node decisions, forced base/goals,
forbidden decisions fixed to zero, pool-budget constraints, and root-connectivity
flow/cuts on selected nodes. Minimize new-node cost or maximize selected-node
reward subject to budget. Add choices/gates explicitly or reject unsupported
fixtures. Validate reconstructed allocations independently. A time-limited solve
must record incumbent, lower/upper bound as appropriate, gap and termination
reason; only a closed, valid bound supports an optimality claim.

[SCIP-Jack's primary documentation](https://www.scipopt.org/doc-6.0.1/html/STP_MAIN.php)
describes Steiner-specific construction, local/recombination heuristics and
branch-and-cut. It is a useful offline reference, not an installation decision.
Importantly, [SCIP-Jack's current site](https://scipjack.zib.de/)
lists an academic/non-commercial license; the base
[SCIP framework's Apache license](https://www.scipopt.org/)
does not automatically license SCIP-Jack. Select an appropriately licensed solver
and verify the exact package/dependencies before distributing any benchmark tool.

[NetworkX's Steiner API](https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.approximation.steinertree.steiner_tree.html)
is a useful edge-weighted approximation baseline, not a ready-made solution for
our node-cost/base/reward problem. Its published approximation factor must not
be attached to our different heuristic or an unproven graph transformation.

## 7. Ranked Opportunities and Acceptance Gates

Complexity is relative engineering effort, not a calendar estimate. High value
does not mean authorization to implement the entire list.

| Priority | Opportunity | Expected benefit | Complexity |
| --- | --- | --- | --- |
| High H1 | Shared request/result allocation validator and explicit exclusions | No silent goal loss; common legality contract for every generator/apply/import | Medium |
| High H2 | Shared-junction candidate generation and connected branch replacement | Escape the demonstrated shortest-route blind spot | Medium-high |
| High H3 | Connected weighted bundles, lookahead and budget-neutral exchanges | Escape the demonstrated weighted greedy trap | Medium-high |
| High H4 | Tree identity and non-destructive saved-build migration | Prevent silent patch-induced build loss or reinterpretation | Medium |
| High H5 | Reproducible oracle/quality/performance benchmark lane | Measure real gains and distinguish exact results from heuristics | Small-medium initially |
| Medium | Structural alternative selection and bounded Pareto archive | More meaningful routes instead of cosmetic variations | Small-medium |
| Medium | Patch-source manifests and independent extraction comparisons | Catch data/schema/geometry drift before publication | Medium |
| Medium | Profiled worker/index/scoring cache and compact DP storage | Lower repeated startup/memory cost if confirmed | Medium |
| Medium | Offline MIP/treewidth experiments | Reference bounds; investigate scalable exact solving without raising goal-mask cap | Medium-high |
| Medium | Native `.build` import/export | Useful game interoperability independent of PoB | Medium |
| Medium, later | Persistent whole-candidate PoB evaluation | Actual scenario-specific character ranking | High for reliable site/local-companion integration |
| Low now | A*, population-scale genetic search, more random restarts alone | Uncertain incremental gain before fixing candidate neighborhoods | Medium-high |
| Low / avoid | Whole viewer/framework rewrite, broad AI/MCP stack, generic offence/defence formulas | No measured advantage; substantial compatibility and maintenance cost | High |

### H1: Central Validity Contract

Use an explicit root, graph fingerprint, allocation pools, required and forbidden
IDs, and supported gate/choice state. Keep validation separate from search.
Reject unknown mandatory IDs; report unsupported mechanics rather than quietly
dropping them. Structural connectivity must account for deliberately modeled
alternate roots/exceptions, not merely ban every special game mechanic.

Acceptance criteria:

- The unknown-goal and disconnected-base probes are rejected with actionable
  reasons before search; valid existing fixtures remain accepted.
- Independently recompute unique paid points by pool, goal/base preservation,
  permitted edges, root connectivity and exclusions for every emitted/applied
  candidate. No invalid result can become an applied allocation.
- Add fixtures for ordinary/W1/W2/ascendancy counts, free roots/options, gates,
  duplicate IDs, missing nodes, prohibited transit and stale graph identity.
  Preserve current manual-only weapon-set optimization policy.
- Deterministically generated tiny valid/invalid cases agree with an independent
  checker, not just the solver's own materializer. Initial gate: 100 cases per
  relevant rule family; failures retain their seed/minimized fixture.
- No unrelated UI redesign. Error details can remain in compact tooltips/details.

### H2: Better Shortest Candidate Neighborhoods

Preserve the existing exact kernel and incumbent generator. Add one bounded
strategy at a time: generate non-goal junction connections; reconnect selected
branches from the complete frontier; remove redundant travel packages and repair
connectivity. Never remove the fixed base unless a separate respec mode is chosen.

Acceptance criteria:

- Shared-trunk fixture reaches 16 points, validated independently. The unchanged
  small exact mode continues matching exhaustive enumeration.
- Under equal runtime and identical seeds/requests, retain the old incumbent:
  no benchmark result is worse than the old valid route.
- On a reviewed under-budget 25/50-goal corpus, report point improvement and
  time-to-best distributions; do not call unchanged results an improvement.
- Profile cancellation and input responsiveness in Chromium and Firefox. Proposed
  gate: p95 time-to-first-valid route no more than 10% worse than baseline on the
  declared test machine, while later quality demonstrably improves. If not,
  defer expensive neighborhoods until after publishing the fast incumbent.

### H3: Better Weighted Candidate Neighborhoods

Search connected packages behind shared travel, not just single endpoints.
Retain several partial candidates with different remaining budgets/structures,
and try optional-branch replacement. Keep score interpretation, skill/support
scope checks and shortest mode unchanged.

Acceptance criteria:

- Shared-reward fixture reaches score 20 at no more than nine new points;
  mandatory goal remains included and shared travel/rewards are counted once.
- Fixed-base, required/excluded nodes, negative trade-offs, zero-score travel and
  total/relative budget fixtures pass independent validation.
- Retain the shortest baseline and old best weighted incumbent. No regression in
  modeled score under matched budget/seed/time; compare score and point count,
  not incomparable raw scores from different preferences/builds.
- Exhaustive small weighted cases agree when an exact result is claimed;
  bounded beam results are always labeled heuristic, including when they happen
  to match the oracle. Bound memory, checkpoint progress and support cancellation.

### H4: Patch-Safe Builds

Store graph version/hash and a migration schema in new saves. Existing unversioned
saves remain loadable as legacy/unknown provenance, without inventing their patch.
Diff IDs plus relevant edges, descriptions, flags and choice/gate semantics.

Acceptance criteria:

- Same-fingerprint round trips preserve all supported build state.
- Removed IDs, same-ID changed effects, changed connections and altered gates
  produce a readable migration review; name similarity never auto-remaps nodes.
- Original saved content is retained. A migrated copy gets a new identity and
  must pass H1 before becoming the active saved build.
- Tests cover legacy saves, canceled migrations, stale async loads, goals,
  attribute choices, ascendancy allocation and both weapon sets.
- Every deployed graph has a checked source/schema/input-hash manifest; missing
  provenance is surfaced rather than presented as a verified patch identity.

### H5: Quality and Performance Evidence

Turn the research fixtures into a small separate benchmark/regression lane.
Capture graph/request hashes, solver revision, objective/constraints, seed,
termination reason, exactness/bound, incumbents over time and invalid candidates.

Acceptance criteria:

- Independently exhaustive tiny shortest and weighted fixtures, including the
  two traps, can be reproduced without private builds or native PoB.
- Include real feasible build-derived cases with 1/3/6/9/11/25/50 goals, root-only
  and established fixed bases, alternative routes and several preference sets.
  Keep deliberately infeasible stress cases in a separately labeled group.
- At least ten fixed seeds per heuristic case; compare incumbent quality at
  0.1/1/5/30/60 seconds and time-to-first/time-to-best. Report median/p95 time,
  score/cost distributions, memory and all failures. No cherry-picking a seed.
- Use equal total budgets, including preprocessing, serialization and native
  evaluation where applicable. Report solver-only and end-to-end times separately.
- A one-command report can be retained as a CI artifact. Small deterministic
  correctness fixtures run on routine relevant changes; multi-minute browser,
  native-PoB and statistical benchmarks stay scheduled/manual or release-gated.

## 8. Fair External Benchmark Protocol

Adapters must use the identical graph snapshot, root, fixed base, required goals,
excluded nodes, point-pool rules, choices and available budget. A tool that cannot
preserve mandatory goals is marked unsupported for that case, not given a higher
score for solving an easier problem. Match weighted normalization and supported
effects, or compare only their search operators under our scorer.

Compare these first: our current solver; dynamic marginal BFS; junction/branch
candidate prototype; connected-bundle beam prototype. Only then adapt a small
forge/PoESkillTree-inspired operator or an offline reference solver. None needs
another project's renderer, MCP service, extraction pipeline or broad build model.

For every candidate record legality, new and total unique points by pool, required
goal coverage, preference score, optional-branch shape, and structural distance.
For alternatives, measure Jaccard distance on *added allocations* rather than
different edge serialization of the same selected nodes. Keep cost buckets; a
weighted Pareto archive can retain nondominated cost/score choices while keeping
the baseline accessible. Do not promise every possible route or unlimited memory.

For exact reference solves, record bounds and certify the encoded model. A
heuristic matching the current best known value remains a heuristic. For speed
work, separately measure worker startup/clone/index, solve, progress rendering
and apply. This investigation measured only solve/process probes, so no current
claim that caching or a new renderer will be faster is justified.

For native PoB comparison, freeze the full build XML, items, gems, supports,
configuration, enemy conditions, weapon modes, attribute choices, tree/runtime
hashes and effect-protection policy. Compare whole allocations, enforce hard
defensive floors if requested, verify fresh reload agreement, and retain narrow
independent arithmetic checks. A PoB number is a result of those assumptions,
not an independent proof of live-game behavior. Unsupported effects remain
protected or require explicit exception; do not silently reward their omission.

## 9. Integration Decisions and Staged Roadmap

### Reuse Versus Independent Implementation

| Component | Decision |
| --- | --- |
| forge validation / connected transactions | Implement the small concepts in our types; attribute any substantial MIT code adapted. |
| cvenzin patch migration / centralized rules | Implement the pattern independently, preserving our saves and UI conventions. |
| planner native `.build` codec | Later evaluate a focused MIT adapter with full notices and game fixtures. |
| toolkit extraction / CDN access | Optional isolated dev dependency after input/license review; use for differential evidence, not browser acquisition. |
| ggpk-explorer | Separate developer tool; GPL review before any code linkage/distribution. |
| headless PoB runtimes | Keep our current guarded pipeline. Prototype persistence only when startup is measured as material. |
| PoE1 solvers | Reuse algorithm concepts, not game rules or full application dependencies. |
| SCIP-Jack / other MIP engines | Offline oracle research only after package/license/model review; no large production dependency now. |

### Small, Independently Testable Sequence

1. **Validity foundation:** promote the two boundary probes and independent
   checker into focused tests; implement H1 with explicit supported-model errors.
   Keep search algorithms and UI behavior otherwise unchanged.
2. **Benchmark baseline:** establish H5's compact fixture corpus and retained
   JSON/report artifacts, starting with the already reproducible research script.
3. **Shortest quality:** implement one H2 junction/branch strategy behind an
   internal option, compare under equal budgets, and adopt only demonstrated wins.
4. **Weighted quality:** implement H3 bundle lookahead and optional-branch swaps;
   keep shortest output and effect semantics unchanged.
5. **Alternative quality:** structural diversity across cost buckets, bounded
   retention and clearer exact/heuristic metadata without expanding the main UI.
6. **Patch safety:** H4 save fingerprints, source manifests and migration review;
   differential extraction checks on the next real data refresh.
7. **Profile-driven speed:** worker lifetime/cancellation contract first, then
   measured graph/index/scoring caches or compact exact-state storage. Every
   cache key includes graph, rules, objective and build state; no stale results.
8. **Optional interoperability/evaluation:** native `.build` codec, then a local
   persistent PoB shortlist evaluator if wanted. Only afterward consider real
   Full DPS/Life optimization or a browser/local-companion protocol.

**Recommended next implementation:** the focused allocation validator and
regression fixtures in step 1. The next quality batch after that should be
shared-junction/connected-branch shortest search, not additional gem matching or
simply a longer inactivity timer. These directly address observed failures while
preserving the parts that already work.

## 10. Verification Performed for This Research

- Ran the isolated script against current production solvers: eight timed probes,
  30 independently enumerated exact cases, and two boundary probes. All expected
  experiment assertions passed; measured gaps and missing boundary checks are
  intentionally reported rather than hidden.
- Typechecked the research script and its imported solver modules with the local
  TypeScript compiler using an isolated command-line configuration.
- Checked all 46 pinned GitHub file links against the inspected Git snapshots;
  every referenced path exists at its stated commit.
- Inspected the existing release-validation artifact, which records passing
  tests/typecheck/build/graph/coverage steps from prior work. The full release
  suite was **not rerun for this research-only change**, and its earlier success
  is not proof that the new search-quality cases were already covered.
- Did not run external projects, install their dependencies, change production
  code, launch a new browser test, commit, push or deploy.

The report and benchmark script are the deliverables. Algorithm integrations,
new dependencies and roadmap batches remain proposals pending authorization.

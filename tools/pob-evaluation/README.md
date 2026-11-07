# PoB Calculation Feasibility Experiment

This is offline research tooling, not a browser feature or a new optimization
mode. It uses a copied Windows PoB runtime with controlled synthetic builds and
explicitly supplied public exports. It does not discover or load personal builds,
account responses, settings, or credentials.

## Run

Requires Windows, Python 3.9 or newer of the same architecture as PoB, PowerShell
7, the app's existing Node dependencies, and an installed PoB for PoE2.

From the repository root, prepare a fresh ignored output directory:

```powershell
./tools/pob-evaluation/prepare_runtime.ps1 -InstallPath "C:/path/to/Path of Building Community (PoE2)"
node node_modules/tsx/dist/cli.mjs tools/pob-evaluation/make_route_fixtures.ts var/pob-evaluation-spike/route-fixtures.json
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike/runtime
node tools/pob-evaluation/verify_results.mjs var/pob-evaluation-spike/route-fixtures.json var/pob-evaluation-spike/pob-results.json var/pob-evaluation-spike/independent-checks.json
node --test tools/pob-evaluation/independent-checks.check.mjs
```

Preparation refuses existing destinations and only permits output under `var/`.
It copies program code/data, not `installed.cfg`, saved builds, settings, or the
installation's cached account response. The optional headless helpers are pinned
to an official source commit and checked against recorded SHA-256 hashes. The
runner refuses installation directories and unmarked copies. Update checks,
browser launching, background scripts, and access to the normal user-data path
are disabled in the experiment. No HTTP service is started.

The install must be trusted: its Lua modules and native libraries execute locally.
This is isolation of files and experiment state, not a security sandbox for
untrusted code or arbitrary imported builds.

## One-Command Workflow

After preparing the trusted isolated runtime, the complete real-build audit can
be run with one command:

```powershell
npm run audit:pob -- --code var/public-build.txt --runtime var/pob-evaluation-spike/runtime --requirements tools/pob-evaluation/examples/warbringer-recovery.requirements.json --profile life-armour --attribute Strength
```

The example policy/profile is specific to the audited Warbringer fixture, not a
universal policy for arbitrary builds. Choose requirements appropriate to the
provided export. `node tools/pob-evaluation/run_audit.mjs --help` lists options.

The workflow captures immutable copies of the input code and requirements, then
runs the existing tools in order: baseline preparation/evaluation/verification,
protected generation, candidate evaluation/verification, and comparison. Each
child runs without a shell. Native windows stay hidden, and cancellation waits
for the active child to exit before recording a cancelled result.

Default output is a fresh uniquely named directory under `var/pob-audit-runs/`.
Optional `--output var/FRESH_RUN` must not exist. Runtime and run directories must
stay separate, inside this workspace's `var/`, including resolved links. Relative
input/output paths are resolved from the caller; tool execution uses the workspace
root even when the command is launched elsewhere. No runtime installation or
personal build discovery is performed.

Outputs:

- `workflow.json`: phase states, timings, captured-input hashes, result or failure.
- `summary.txt`: readable ranking, point costs, exact rejection values, coverage
  qualification, and structured import/verification failure explanations.
- `inputs/`: exact captured code and policy, not modified originals.
- `baseline/` and `routes/`: normal source, audit, native, verification and comparison artifacts.
- `logs/`: stdout/stderr for every invoked step; native startup noise stays out of the summary.

Exit `0` means a completed comparison with eligible candidates, not necessarily an
improvement. Exit `2` means completed with none eligible. Exit `1` means validation
or execution failed; `130` means cancelled. Failed/cancelled workflows never expose
a winner in their run summary. Setup errors before creating a run print a direct
error without creating a report. No automatic resume, timeout, or cleanup is added.

The orchestrator retains the existing preflight, native-state/arithmetic, coverage,
generation and effect-preservation checks. Deferred equipment/gem requirement
failures remain comparison decisions rather than masquerading as arithmetic
corruption; they are not waived. Captured inputs and graph changes invalidate the
run. A completed ranking with parser gaps remains provisional.

This remains offline research, not a website optimization mode or a security
sandbox. Run one workflow at a time per copied runtime; caches/runtime files are
shared, while run artifacts are isolated. See [the measured workflow report](../../docs/research/2026-11-07-pob-one-command-workflow.md).

## Import Compatibility Preflight

Before generating real-build routes, `prepare_real_audit.ts` now writes
`import-preflight.json`. Known unsupported allocation rules stop preparation before
the optimizer runs. The report names affected items/passives and explains the next
action; it does not invent edges, drop required nodes, or charge item-granted nodes
as paid points.

For a read-only inspection without route generation:

```powershell
node tools/pob-evaluation/preflight_import.mjs var/public-code.txt var/public-preflight --profile life-armour
# Existing jobs can be inspected directly from their captured XML.
node tools/pob-evaluation/preflight_import.mjs var/pob-real-build-audit/source-build.xml var/pob-real-build-audit --profile ci-mana
```

Only the active tree, active item/config/skill sets, and socketed jewels are
inspected. Both weapon loadouts in the active equipment set are included; unused
item records and other saved sets are not treated as equipped. The checks reuse
the app's class mapping, visibility rules, and allocatable-edge path logic.

Known unsupported cases include From Nothing / Controlled Metamorphosis allocation,
alternate starts, generated sockets, conquered/transformed passives, secondary
ascendancies, and non-attribute tree overrides. Ordinary anoint/Megalomaniac grants
are recorded separately and retained in PoB context. Unknown/ambiguous grant names
are coverage warnings; a grant also present in the serialized paid tree blocks
cost assumptions until resolved. The catalog is not exhaustive.

Reports distinguish blockers, warnings, and information. `ready_for_audit` means
no known static allocation blocker, not that every mechanic or modifier is verified.
Warnings such as custom modifiers and unmapped grants remain visible in preparation
and requirement summaries. The copied runtime currently uses build-format target
`0_1` and passive-tree version `0_5`; these are different version fields. Its literal
secondary-ascendancy value `nil` is treated as absent.

Blocked standalone preflight exits `2`. Blocked preparation does not replace old
inputs/results. The new blocked report prevents the real-build runner from loading
native code for that job; source hashes and preparation metadata must match before
execution. Requirement comparisons rerun static checks against current source and
graph data and require matching preflight evidence. A blocked import writes an
`incompatible_import` report with an empty ranking, replacing a stale winner.
Use a fresh job directory to retry a failed import; do not repurpose its old route
results. This guard is workflow validation, not a sandbox for untrusted native code.

See [the measured preflight results](../../docs/research/2026-11-07-pob-import-preflight.md).

## Real-Build Audit

Use a trusted public PoB for PoE2 export saved under `var/`. This fixture currently
requires a `0_5` tree, explicit class metadata, all allocated IDs in the game graph,
and original runtime coverage before generating candidates. It is not a general import service.

```powershell
$job = "var/pob-real-build-audit"
$baseline = "var/pob-real-build-baseline"
$source = "https://poe.ninja/poe2/pob/28df3"
New-Item -ItemType Directory -Force $job | Out-Null
Invoke-WebRequest "https://poe.ninja/poe2/pob/raw/28df3" -OutFile "$job/code.txt"
node node_modules/tsx/dist/cli.mjs tools/pob-evaluation/prepare_real_audit.ts "$job/code.txt" $baseline $source --baseline-only
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike/runtime --driver tools/pob-evaluation/evaluate_real_build.lua --job $baseline
node node_modules/tsx/dist/cli.mjs tools/pob-evaluation/prepare_real_audit.ts "$job/code.txt" $job $source --coverage-job $baseline
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike/runtime --driver tools/pob-evaluation/evaluate_real_build.lua --job $job
node tools/pob-evaluation/verify_real_audit.mjs $job

# Repeat while requiring the two build-critical small nodes in this example.
node node_modules/tsx/dist/cli.mjs tools/pob-evaluation/prepare_real_audit.ts "$job/code.txt" "$job/protected" $source 50817,61355 --coverage-job $baseline
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike/runtime --driver tools/pob-evaluation/evaluate_real_build.lua --job "$job/protected"
node tools/pob-evaluation/verify_real_audit.mjs "$job/protected"

node --test tools/pob-evaluation/independent-checks.check.mjs tools/pob-evaluation/real-audit.check.mjs
```

`prepare_real_audit.ts` retains the full original XML, pins original notable,
keystone, socket, attribute, and protected unmodeled shared nodes. It generates up
to two distinct alternatives using the existing anytime router, without relaxing
protections to fill a quota. The optional positional argument is a comma-separated
list of additional original main-tree nodes to protect. New attribute travel
nodes choose Intelligence by default (or the explicit `--attribute` choice);
source attribute choices remain unchanged.

`evaluate_real_build.lua` compares additions **and removals** against a complete
XML reload for each tree. It preserves non-tree context, jewels, ascendancy, weapon
allocations, and restores the original state. The verifier checks actual graph
edges and point counts, adapter agreement, attribute requirements, and the narrow
life/mana resource calculation appropriate to this fixture. A passing audit is
**not** an endorsement of candidate viability: build-breaking mana-threshold
changes are separately reported as warnings. These scripts do not save a candidate
into the source installation or generate a browser scoring feature.

Reports are written to the job directory. Public shares may change: retain the
captured code and XML hash for reproducible comparisons. The measured example and
limitations are in [the real-build report](../../docs/research/2026-11-06-pob-real-build-audit.md).

## Must-Preserve Filter

This next offline step checks explicit requirements before comparing point costs.
It does not add a website mode, preference weights, or a universal viability score.
Use the same captured original and protected jobs from the real-build audit:

```powershell
node tools/pob-evaluation/build_requirements.mjs $job tools/pob-evaluation/examples/spark-strict.requirements.json strict.requirements-report.json
node tools/pob-evaluation/build_requirements.mjs "$job/protected" tools/pob-evaluation/examples/spark-strict.requirements.json strict.requirements-report.json
node tools/pob-evaluation/build_requirements.mjs $job tools/pob-evaluation/examples/spark-allow-10-percent-loss.requirements.json allow-10-percent.requirements-report.json
node tools/pob-evaluation/build_requirements.mjs "$job/protected" tools/pob-evaluation/examples/spark-allow-10-percent-loss.requirements.json allow-10-percent.requirements-report.json
node --test tools/pob-evaluation/independent-checks.check.mjs tools/pob-evaluation/real-audit.check.mjs tools/pob-evaluation/build-requirements.check.mjs tools/pob-evaluation/recovery.check.mjs tools/pob-evaluation/import-preflight.check.mjs
```

The CLI recomputes audit evidence from source XML, candidate outputs, and the
current game graph. It does not trust a previously saved verification flag.
Any integrity failure blocks ranking for the entire job. An attribute shortfall
with valid arithmetic/adapter evidence instead rejects that candidate, as a build
requirement failure. Missing numeric evidence never passes a minimum.

Policies have version `1`, a `name`, `requiredNodeIds`, and `minimums`. Each minimum
uses one supported metric and either an absolute `value` or a `baselineFraction`:
`0.95` means at least 95% of the original value; `1.05` requires a 5% improvement.
Bounds use unrounded numbers. The example 5% and 10% damage allowances are explicit
test policies, not recommendations for arbitrary builds. Unknown fields/metrics,
duplicate rules, and invalid numbers are rejected. Extra protected nodes must
already belong to the original main tree. Existing audit goals, pinned attribute
nodes, and each candidate's equipment/gem attribute requirements remain mandatory.

The original is retained and judged by the same requirements; it is not forced to
pass. Results distinguish `eligible`, `rejected`, and `unverified`, with failed
checks, original audit warnings, point counts, and separate metrics. Eligible trees
are ordered by fewest main points, with Full DPS breaking equal-cost ties. This is
only a comparison order among tested candidates, not a global optimum or a claim
that the first route is best in-game. No preference ranking or automatic apply is
implemented.

The default output is `build.requirements-report.json` inside the job directory.
An optional plain filename ending in `.requirements-report.json` keeps separate
policy reports without overwriting input files. Source, graph, policy, manifest,
and result hashes identify what was checked. Exit `0` means a completed comparison
with at least one eligible tree, `1` an integrity or import-compatibility failure, and `2` invalid input or
no eligible candidate. Reports remain under ignored `var/`.

The verifier has two narrow profiles, `ci-mana` and `life-armour`, not support for
arbitrary mechanics. Full DPS/EHP still come from PoB. Recovery arithmetic now has
separate checks; total sustain does not. See [the filter experiment](../../docs/research/2026-11-06-pob-build-requirements.md)
and [the weapon/recovery follow-up](../../docs/research/2026-11-07-pob-weapon-set-recovery-audit.md).

## Weapon Sets and Recovery

Run a fresh job when updating the audit tooling; old outputs may lack required
evidence. The public Warbringer example uses 24 W1 and 24 W2 allocations:

```powershell
$job = "var/pob-weapon-recovery-audit"
$baseline = "var/pob-weapon-recovery-baseline"
New-Item -ItemType Directory -Force $job | Out-Null
Invoke-WebRequest "https://poe.ninja/poe2/pob/raw/2b47e" -OutFile "$job/code.txt"
node node_modules/tsx/dist/cli.mjs tools/pob-evaluation/prepare_real_audit.ts "$job/code.txt" $baseline https://poe.ninja/poe2/pob/2b47e --profile life-armour --attribute Strength --baseline-only
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike/runtime --driver tools/pob-evaluation/evaluate_real_build.lua --job $baseline
node node_modules/tsx/dist/cli.mjs tools/pob-evaluation/prepare_real_audit.ts "$job/code.txt" $job https://poe.ninja/poe2/pob/2b47e --profile life-armour --attribute Strength --coverage-job $baseline --requirements tools/pob-evaluation/examples/warbringer-recovery.requirements.json
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike/runtime --driver tools/pob-evaluation/evaluate_real_build.lua --job $job
node tools/pob-evaluation/verify_real_audit.mjs $job
node tools/pob-evaluation/build_requirements.mjs $job tools/pob-evaluation/examples/warbringer-recovery.requirements.json preserve-recovery.requirements-report.json
```

The generator excludes reserved weapon nodes from main-tree routing and pins their
original shared attachment nodes. It does not optimize W1/W2. Exact per-set node
assignments, separate root connectivity, and counts are checked on both calculator
overrides and full XML reloads. Each scenario changes only the active weapon
selection. The original source selection, outputs, allocation, gear, skills,
configuration, jewels, and attribute choices must restore afterward. A disconnected
shared tree or unsupported special allocation is not silently forced into a route.

`pointCost` means non-weapon shared points. The saved raw PoB `main` counter includes
the union of W1/W2 nodes; `nonWeaponMain` subtracts both reserved sets. The Warbringer
has 96 shared points plus 24 in either active set (120), not 144 shared points.

Minimums apply to **every evaluated set by default**, using that set's original
baseline. A rule can explicitly include `"weaponSets": [2]`, as the Warbringer's
selected-skill damage floor does. Attributes are always checked in every set.
Missing requested sets fail closed. A relative damage floor with a zero baseline
does not silently pass: choose an appropriate metric/set or an explicit absolute
rule. This build has no Full DPS groups enabled, so `CombinedDPS` is used without
changing the author's skill setup.

`LifeRegenRecovery` and `ManaRegenRecovery` are supported minimums. Negative net
recovery is a deficit, not a missing value or an invented zero. The independent
checker reconstructs regeneration, tenths rounding, degeneration, added recovery,
overflow, and positive Life-to-ES transfer from resolved PoB inputs. It does not
independently parse every modifier or prove total in-game sustain. Missing input
fields/flags fail verification. The Spark fixture also checks the simple
game-text mana-regeneration increase delta against resolved inputs.

Use `examples/spark-preserve-recovery.requirements.json` on a fresh protected Spark
job to require its original mana regeneration in addition to its other floors.
Selected-skill life/mana costs are captured and cross-checked between evaluation
paths when available, but no leech/flask/recoup/rotation budget is inferred.

## Item-Grant Support Audit

`audit_item_grant.lua` is a narrow Thaumaturgic Generator experiment using a
prepared public Warbringer job. It requires the same source-bound preflight as
the real-build evaluator. It reloads original, removed-anoint, Beef-control, and
restored variants in both weapon sets without modifying paid allocations or
non-anoint item stats. The control independently checks `+25 Strength`; unique
paid costs are checked against source IDs and the game graph.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike/runtime --driver tools/pob-evaluation/audit_item_grant.lua --job var/pob-item-grant-audit
node tools/pob-evaluation/verify_item_grant.mjs var/pob-item-grant-audit var/refresh-0.5.5f/tables/English/PassiveSkills.json
node --test tools/pob-evaluation/item-grant.check.mjs
```

The result separates a correctly recognized zero-cost anoint from an unsupported
buff effect. Unchanged calculated output is not proof of no in-game value. This is
not a general grant evaluator or charge simulation, and does not change ranking
policies. See [the measured results](../../docs/research/2026-11-07-pob-thaumaturgic-generator-audit.md).

## Runtime Effect Coverage Before Ranking

Every fresh real-build audit now records native parser evidence in each
candidate's `effectCoverage`, separately for W1/W2. It inspects active paid/granted
passive descriptions, equipped item modifiers and active flask/charm variants,
active custom modifiers, and granted-passive resolution against PoB's full catalog.
Combined passive descriptions use PoB's existing parse results rather than
reparsing continuation lines and inventing unsupported-text warnings.

`verify_real_audit.mjs` reports arithmetic and coverage separately.
`build_requirements.mjs` derives coverage warnings again from the native records
before ranking; it does not trust a saved complete flag or empty warning list.

- Known unparsed/partially parsed effects make the ranking explicitly
  `provisional`. Exact effect text, source node/item, weapon set, candidate, and
  added/removed warning differences remain in the report.
- Missing/stale/malformed coverage returns `unverified_effect_coverage`, exits `1`,
  and produces no ranking. Re-run native evaluation for older audit outputs.
- No parser gaps gives `scoped`, not a full-support certificate. Parsed effects
  can still need conditions, specialized code, timing, or other validation.
- A granted node outside our routing graph is not automatically a missing paid
  node. Runtime identity, application, parser coverage, and paid cost stay separate.

The CLI prints deduplicated messages before the ranking. The JSON report retains
all per-candidate/per-set details. The conservative passive-effect policy below
also rejects loss of an original unmodeled passive effect unless specifically
allowed. Item/custom-modifier warnings remain diagnostic. Numeric requirement
minima still apply independently.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike/runtime --driver tools/pob-evaluation/effect_coverage.check.lua --job var/pob-real-build-audit
node --test tools/pob-evaluation/effect-coverage.check.mjs
```

See [the runtime coverage report](../../docs/research/2026-11-07-pob-runtime-effect-coverage.md)
for fresh public-build results, scope, and reproduction commands. This remains
offline tooling; the website has no PoB performance-ranking UI yet.

## Conservative Passive-Effect Policy

Existing version-1 requirement files now default to retaining every original
passive description with unparsed, partially parsed, or unavailable parser
evidence. Protection is per source node ID, exact effect text, occurrence count,
and evaluated weapon set; it includes granted passives. A different node with
similar text is not silently considered equivalent. A retained exact description
does not fail merely because its line index or parser status changes.

To deliberately permit a specific loss, add an optional requirements field:

```json
"effectCoverage": {
  "allowedPassiveEffectLosses": [
    {
      "nodeId": "56666",
      "text": "Grants Thaumaturgical Dynamism",
      "reason": "Reviewed for this specific build; deliberately accepting this loss.",
      "weaponSets": [2]
    }
  ]
}
```

This demonstrates syntax, not a recommendation to remove that anoint. Copy exact
identity/text from the original native report. Omitting `weaponSets` permits the
specified loss in every evaluated set where that original effect exists. Explicit
sets must each have that original effect. No global disable or wildcard exists.
An exception allows the selected effect's occurrence losses in its selected sets;
the report records actual original/retained/lost counts and the reason.

Exceptions require a reason; malformed, stale, overlapping, wrong-node, wrong-text,
and wrong-set exceptions fail validation. The CLI writes `invalid_requirements`
with an empty ranking rather than leaving an old winner in the requested report.
Exceptions never waive required nodes, numeric floors, source compatibility,
arithmetic integrity, or complete coverage. Accepted losses remain provisional.

Candidates expose `passiveEffectProtection`; failed preservation checks use
`preserve_unmodeled_passive`, and applied exceptions use
`unmodeled_passive_loss_allowed`. The post-evaluation filter remains independent
of the generation constraints below. See [the policy report](../../docs/research/2026-11-07-pob-conservative-effect-policy.md).

## Protected Candidate Generation

First prepare `--baseline-only` and evaluate the unchanged original in the copied
runtime. Then prepare a **fresh** job with `--coverage-job BASELINE_JOB`, optionally
using `--requirements POLICY.json`. Generation without one of these phases refuses
to run. Baseline capture performs no optimization and produces only Original.

Coverage-backed preparation rechecks source XML, graph fingerprint, class/start,
active spec, allocation, weapon assignments, profile, native arithmetic/state,
and original coverage. It uses the same exact-effect exception logic as ranking:
unallowed shared passives become mandatory router goals. One allowed effect does
not unpin a node with another protected effect, or a node required by the normal
notable/attribute/socket/weapon-attachment/explicit requirement rules.

Weapon and ascendancy nodes remain fixed; grants stay in item/config context and
never become paid shared goals. If a shared node is protected in either evaluated
weapon set, it remains mandatory. The manifest records the classification and
baseline/policy provenance. Full candidate evaluation still enforces numeric
requirements and the independent passive-effect preservation filter.

New jobs also use a source/manifest-bound `generation-preflight.json` guard.
Failed or superseded preparation blocks native evaluation and ranking instead of
reusing stale artifacts. Existing source/audit inputs are never overwritten by a
new preparation attempt. Fewer alternatives, including none beyond Original, are
valid results; protection is never relaxed to create more candidates.

Use matching effect-loss exceptions when ranking a generated job. Changed numeric
floors may be compared afterward, but changed exception permissions require fresh
generation; a mismatch produces no ranking. See [the measured generation results](../../docs/research/2026-11-07-pob-protected-generation.md).

## Synthetic Checks

- Direct attribute addition, flat ES, additive increased ES, and multiplicative
  more ES, using independently specified expected arithmetic.
- Attack-speed scaling and damage-component rounding in a deliberately simple
  unarmed fixture. This is not a general damage model.
- Added Lightning damage range sums.
- Three complete trees generated by our existing routing engine. All required
  goals are retained; connectivity and point cost are checked separately.
- Route ES and attributes are independently recomputed from game-extracted node
  text for these supported fixtures. Attribute travel nodes explicitly choose
  Strength; a production integration must preserve the user's actual choices.
- Calculating a candidate must not change the original allocation or baseline.

The verifier includes negative tests for deliberately wrong results and missing
fields. Results are only as broad as these controlled cases. Arbitrary conditional
mods, skills, items, minions, recovery interactions, and EHP are not independently
verified. Do not apply this narrow verifier to arbitrary builds and claim complete
validation.

See [the investigation](../../docs/research/2026-11-06-pob-calculation-integration.md)
for measured results and hosting implications.

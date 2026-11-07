# Protected Candidate Generation

Implemented November 7, 2026, following the
[conservative passive-effect policy](2026-11-07-pob-conservative-effect-policy.md).
This changes offline PoB audit preparation, not website routing, saved builds,
installed PoB files, or public source builds.
The subsequent [one-command workflow](2026-11-07-pob-one-command-workflow.md)
now orchestrates the phases below with isolated inputs, logs, and a readable result.

## Workflow

Generation needs native original coverage, which cannot be known before loading
the build in PoB. Preparation now has two explicit phases:

1. `--baseline-only`: preserve the full original XML and create only the Original
   candidate. No optimizer runs. Evaluate this baseline in the isolated runtime.
2. `--coverage-job BASELINE_JOB`: in a fresh directory, validate that original
   evidence and generate routes with protected shared nodes as mandatory goals.
   Optional `--requirements POLICY.json` supplies the same exact-effect exceptions
   and additional required nodes used by the post-evaluation filter.

Preparation without either phase refuses to generate routes. Older audit jobs
without the new original/graph/preparation evidence need a fresh baseline capture;
old display flags are not treated as proof of current coverage.

Validation rechecks source XML hash, canonical game-graph fingerprint, explicit
class/start and ascendancy, active spec, profile, exact shared/ascendancy/weapon
allocations, import preflight, native arithmetic/state preservation, and complete
runtime coverage. A baseline must contain only the unchanged Original. The
manifest records original engine/tree identity, evidence fingerprints, effective
requirements, and per-effect protection decisions. Graph fingerprinting uses the
parsed graph's JSON representation; this is distinct from raw-file hashes.

## Mandatory Goals

Generation and ranking now share the same original-effect collector and exception
validation; they do not implement separate interpretations of permitted loss.

- Unallowed shared passive effects become mandatory router nodes, including small
  passives that are not notable/keystone/socket/attribute goals.
- A shared node stays mandatory if any effect or evaluated weapon set still
  protects it. Allowing one effect does not waive another effect on that node.
- Original notable, keystone, socket, attribute, weapon-attachment, manually pinned,
  and policy-required goals remain mandatory independently of an effect exception.
- Weapon-set and ascendancy nodes remain in their original fixed allocations.
- Calculation-granted nodes remain in their item/configuration context, including
  anoint-only nodes outside the routing graph. They are not converted into paid
  shared goals or used as invented travel connections.

Every selected route is checked against the full mandatory goal set before its
manifest is written. Preparation can return zero, one, or two distinct alternatives
alongside Original. It does not relax constraints merely to fill a comparison
quota, and does not claim a global optimum or exhaustive route enumeration.

Full native evaluation and the independent passive-effect filter still run after
generation. Numeric performance/recovery floors are not inferred to be satisfied
just because all protected nodes are retained. Ranking requires the same normalized
effect-loss exceptions used by generation; a changed exception policy yields
`generation_policy_mismatch` and no ranking. Numeric minima can still be tightened
or relaxed independently, subject to normal evaluation.

## Failed Preparation

New jobs use `generation-preflight.json`, bound to the audit-input file hash.
Native evaluation checks it before loading LuaJIT; ranking checks it before using
old result files. Missing, blocked, or superseded preparation does not reuse a
previous success. A ranking attempt writes an empty `blocked_generation` report.

Preparation refuses to overwrite existing source/audit inputs. A failed retry can
mark that job blocked, so use fresh job directories. Existing source files and
captured native results remain intact.

Candidate XML cloning now uses deep copies, keeping mutable tree/attribute and
weapon-selection XML separate between variants. Native checks continue to require
restoration of the original allocation, context, active selection, and outputs.
An absent ascendancy is represented explicitly as PoB's `None` value.

## Measured Results

Fresh baseline and constrained jobs are under
`var/pob-generation-protection-20261107/`, using the existing isolated PoB 0.23.1
runtime and captured public Warbringer/Spark exports. No personal build or
configuration was loaded. All generated candidates retain the mandatory nodes.

| Build | Automatic protected shared nodes | Mandatory goals | Candidate shared costs | Native verification |
| --- | ---: | ---: | --- | --- |
| Warbringer | 7 unique, including 4 new mandatory targets | 60 -> 64 | Original 96; alternatives 96 and 97 | 432 checks passed; both weapon sets |
| Spark Stormweaver | 3 unique, plus 2 policy-required nodes | 62 -> 66 | Original 121; alternatives 119 and 120 | 235 checks passed; active W1 |

Warbringer classifies 26 protected effect/set records: 14 shared-goal records,
8 fixed weapon records, 2 fixed ascendancy records, and 2 retained-grant records.
Thaumaturgic Generator remains granted, not paid, in both sets. Spark's 4 original
gap records comprise 3 shared passives and 1 ascendancy passive. Repeated records
across sets/effects do not add duplicate routing goals or passive costs.

All four jobs complete native evaluation: each unchanged baseline and each
constrained candidate batch. Original state/outputs restore successfully. Rankings
remain provisional because parser coverage gaps still exist:

- Warbringer preserve-recovery policy ranks Original then Candidate 2. Candidate 1
  still fails original EHP minima in both weapon sets.
- Spark preserve-recovery policy retains only Original. Both alternatives retain
  protected effects but still lose mana recovery and are rejected by its floor.

This is a protection improvement, not a claim that these samples found a better
build. Prior ignored research jobs were not overwritten.

## Verification

All 119 offline Node tests pass, including 8 new generation tests. Coverage includes
the real routing engine on a synthetic graph where the unprotected route skips a
small node at cost 1, but protection forces retaining it at cost 2. Other tests
cover scoped/partial exceptions, multiple protected effects on a node, fixed
weapon/ascendancy context, grants, source/graph/profile/allocation drift, failed
native evidence, policy mismatch, non-mutation, and blocked stale-artifact reuse.

The CLI test proves baseline capture performs zero optimizer iterations and
produces only Original. Its fake marked runtime has no native DLL; blocked
preparation prevents it from reaching native loading. The blocked ranking test
also clears a deliberately seeded old winner.

No frontend code changed, so browser and frontend test/build runs were not needed.
The native audits and focused offline suite exercise the changed workflow.

## Reproduction

Use fresh output directories. These commands reuse the captured Warbringer code:

```powershell
$code = "var/pob-second-build-audit-20261107/sources/warbringer.txt"
$baseline = "var/new-warbringer-baseline"
$job = "var/new-warbringer-routes"
$runtime = "var/pob-evaluation-spike-20261106/runtime"
$policy = "tools/pob-evaluation/examples/warbringer-recovery.requirements.json"
$source = "https://poe.ninja/poe2/pob/2b47e"
node node_modules/tsx/dist/cli.mjs tools/pob-evaluation/prepare_real_audit.ts $code $baseline $source --profile life-armour --attribute Strength --baseline-only
python tools/pob-evaluation/run_headless.py $runtime --driver tools/pob-evaluation/evaluate_real_build.lua --job $baseline
node node_modules/tsx/dist/cli.mjs tools/pob-evaluation/prepare_real_audit.ts $code $job $source --profile life-armour --attribute Strength --coverage-job $baseline --requirements $policy
python tools/pob-evaluation/run_headless.py $runtime --driver tools/pob-evaluation/evaluate_real_build.lua --job $job
node tools/pob-evaluation/verify_real_audit.mjs $job
node tools/pob-evaluation/build_requirements.mjs $job $policy protected.requirements-report.json
node --test tools/pob-evaluation/*.check.mjs
```

## Next Recommendation

Add one offline command that performs baseline capture, protected generation,
native evaluation, and requirement comparison in an isolated fresh run directory.
It should report phase failures and candidate rejection reasons together. This
would reduce manual orchestration errors without changing the browser or weakening
the separate preflight, coverage, arithmetic, and preservation checks.

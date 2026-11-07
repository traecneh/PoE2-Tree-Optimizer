# One-Command PoB Audit Workflow

Implemented November 7, 2026, following
[protected candidate generation](2026-11-07-pob-protected-generation.md).
This is offline tooling, not a change to website optimization, saved builds,
installed PoB, or user profiles.

## Entry Point

`tools/pob-evaluation/run_audit.mjs` and the `npm run audit:pob -- ...` alias
orchestrate the existing tools. They do not implement another router, PoB adapter,
compatibility parser, scoring formula, or policy engine.

Required inputs are a captured build-code file, a marked isolated runtime, and an
explicit requirements file. Profile defaults to `ci-mana`, new travel attributes
to Intelligence. `--profile life-armour --attribute Strength` matches the public
Warbringer fixture. Optional `--source-url` is provenance text, not a fetch request.
There is no network import, runtime installation, account lookup, or personal-build
discovery. The copied runtime's existing user-profile/update/browser restrictions
remain in effect.

Seven steps cover the requested four phases:

1. Capture the unchanged original with baseline-only preparation.
2. Evaluate the baseline through the isolated native PoB runner.
3. Verify original arithmetic/state and runtime coverage.
4. Generate candidates with mandatory protected nodes and the captured policy.
5. Evaluate candidate routes through the same native runner.
6. Verify candidate arithmetic/state and runtime coverage.
7. Apply the independent preservation/requirements filter and compare.

Progress is concise. Child stdout/stderr is retained in per-step log files instead
of flooding the console. Each process receives an argument array, without shell
interpretation, and uses the workspace as its working directory. Native windows
are hidden. An explicit Python executable can be selected with `--python`.

## Isolation and Failure Behaviour

Each invocation uses a fresh output directory under this worktree's ignored
`var/`. By default its name includes a UTC timestamp and random suffix. An explicit
output path must not exist. Resolved path checks reject escapes and paths inside
the copied runtime, including junction aliases. The tool never deletes old runs.

Code and policy are captured byte-for-byte under `inputs/`; both hashes and the
current graph hash are recorded. Child steps read the captured copies. Changed
snapshots or graph data invalidate the workflow; originals are never overwritten.
Preparation, native and comparison evidence retain their normal format/hash guards.

Steps are checkpointed as pending, running, succeeded, failed/cancelled, or skipped.
A failure stops later steps. Structured compatibility blockers, preparation errors,
verification check failures, and log locations are surfaced in the readable summary.
A failed/cancelled run has no usable ranking or winner, even if a partial child
comparison artifact exists. Original artifacts are retained for diagnosis.

Ctrl+C stops the active child and waits for its close event before saving the
cancelled result; the orchestrator does not leave it running intentionally. An
unrecoverable OS kill can leave a run marked running, not falsely completed. No
automatic resume or timeout is introduced. Runtime caches are shared; run one
workflow at a time per copied runtime. This is not a sandbox for untrusted code.

## Verification and Result Semantics

The wrapper invokes the existing CLI checks and reads their structured evidence.
It requires complete successful integrity and coverage checks, not only an exit
code or a saved boolean. Verifier exit 1 is accepted only when integrity and
coverage pass and remaining failed checks are deferred requirements. Those
requirements still apply independently in the final comparison.

The comparison must have internally consistent eligibility/ranking/winner fields,
verified preservation evidence, and hashes matching the actual source, manifest,
native result, and captured policy. An unrelated/invalid report cannot become a
winner. Parser gaps still mean a provisional ranking, not complete support or
proof of in-game viability.

Exit/status meanings:

| Exit | Workflow status | Meaning |
| --- | --- | --- |
| 0 | `completed` | At least one tested candidate is eligible; Original may be best. |
| 2 | `completed_no_eligible` | All steps completed, but the requirements admitted no candidate. |
| 1 | `failed` | Validation/execution failed; later steps were skipped and no winner is exposed. |
| 130 | `cancelled` | Cancellation stopped the active workflow; no winner is exposed. |

Setup errors before a run directory is created print a direct error and exit 1.
Completed with no eligible candidate is not misreported as an infrastructure error.

## Outputs

- `workflow.json`: machine-readable state, per-step timing/log paths, captured-input
  hashes, comparison summary or failure, and overall duration.
- `summary.txt`: readable phase/result summary, shared point costs, exact candidate
  rejection values and minima, and coverage confidence.
- `baseline/`: original preparation, source XML, native outputs and verification.
- `routes/`: protected-generation metadata, source XML, native outputs,
  verification, and `workflow.requirements-report.json`.
- `logs/`: step-specific stdout/stderr; `inputs/`: exact captured code and policy.

The best tested eligible route is not necessarily an improvement or a global
optimum. Weapon/ascendancy/grant distinctions and unique shared-point cost semantics
are unchanged. Full failure/metric/effect data remains in the comparison artifact.

## Measured Runs

Artifacts are under `var/pob-one-command-20261107/`. The two completed public
examples use the copied PoB 0.23.1 runtime and existing captured exports:

| Run | Outcome |
| --- | --- |
| Warbringer | All seven steps complete. Original remains best at 96 shared points; Candidate 1 fails W1/W2 EHP floors; Candidate 2 uses 97 points and remains eligible. Ranking provisional. |
| Spark Stormweaver | All seven steps complete. Original remains best at 121 shared points; the 119/120-point alternatives fail the original mana-recovery floor. Ranking provisional. |
| Titan with From Nothing | Stops during original import preparation. Summary names unsupported disconnected allocation/connectivity. No native PoB step or comparison runs; no winner. |

The Titan failure was exercised both before and after adding structured failure
details. It is an expected safety result, not an unexplained pipeline failure.
No source build, prior research job, installed runtime or saved build was changed.

Controlled executor tests cover phase order, failures at every step, completed
comparisons without an eligible candidate, invalid provenance, inconsistent
rankings, failed/missing verification, deferred requirements, cancellation,
mutated snapshots/graph, output reuse, path/junction boundaries, and unique default
run names. Real child-process tests also exercise literal arguments with spaces
and shell characters, missing executables, log capture, and cancellation with
process completion. These fixtures test orchestration, not PoB formulas.
All 131 offline Node tests pass, including 12 new workflow tests. The npm help
entry point and the two real completed pipelines were also verified.

## Reproduction

From this worktree, using the captured Warbringer code and prepared runtime:

```powershell
npm run audit:pob -- --code var/pob-second-build-audit-20261107/sources/warbringer.txt --runtime var/pob-evaluation-spike-20261106/runtime --requirements tools/pob-evaluation/examples/warbringer-recovery.requirements.json --profile life-armour --attribute Strength --source-url https://poe.ninja/poe2/pob/2b47e
node --test tools/pob-evaluation/*.check.mjs
```

The default creates a fresh run, so repeating the command does not overwrite the
measured examples. There is no new browser/server component; frontend smoke tests
are not needed for this orchestration-only change.

## Next Recommendation

Export eligible candidate routes as PoB build codes while preserving the original
gear, skills, configuration, weapon assignments, ascendancy and attribute choices.
That would let the user inspect proposed trees directly in PoB before relying on
their provisional numeric comparison. This workflow does not yet create those exports.

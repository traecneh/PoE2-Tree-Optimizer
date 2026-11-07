# Conservative Passive-Effect Policy

Implemented November 7, 2026, after [runtime effect coverage](2026-11-07-pob-runtime-effect-coverage.md).
This changes the offline requirement/ranking workflow only, not website routing,
saved builds, native PoB calculations, installed PoB files, or public source builds.
The later [protected generation follow-up](2026-11-07-pob-protected-generation.md)
now also makes the corresponding shared nodes mandatory while searching; this
post-evaluation filter remains an independent backstop.

## Default Protection

Before ordering eligible candidates, retain original passive effects with native
parser gaps: unparsed, partially parsed, or unavailable evidence. Existing
version-1 requirement files automatically receive the conservative default;
no opt-in field or migration is needed.

Protection uses source node ID and exact description text, separately in each
evaluated weapon set. It includes ordinary/ascendancy passives and item/config-
granted passives present in the native calculation environment. Granted effects
remain separate from paid point costs. If any original occurrence of identical
node/text has a gap, all its original occurrences are protected. Duplicate lines
cannot make a partial loss look like full retention.

Candidates must retain the original occurrence count. Identical text on another
node is not presumed equivalent, and weaker/different text is a loss. Conversely,
the same node/text still counts as retained if a line index changes or the native
parser now recognizes it completely. The rule does not merely compare how many
warnings disappeared.

A failure rejects that candidate, not the whole valid audit. Reports name the
node, exact effect, weapon set, and original/retained/lost counts. Existing
connectivity, unique point-cost, attribute, required-node, and numeric minimum
checks continue independently. The original is judged by those same requirements.

## Explicit Exceptions

The optional requirements field `effectCoverage.allowedPassiveEffectLosses` is a
list of exact `{nodeId, text, reason, weaponSets?}` exceptions. Each requires a
nonempty reason. Explicit weapon sets must each contain that original unmodeled
effect; an omitted set list applies to evaluated sets where it exists. An
exception permits occurrence losses for that one node/text identity in its scope,
not every effect on the node. Reports preserve actual counts and the stated reason.

Wrong-node, wrong-text, stale, malformed, duplicate, and overlapping exceptions
are rejected. No wildcard, global disable, automatic effect substitution, or
invented benefit score exists. Exceptions do not turn unsupported effects into
supported ones or remove warnings. Any accepted comparison with known coverage
gaps remains provisional.

The requirements parser validates shape; evaluation also validates identity and
scope against original source-bound native coverage. Missing coverage still
blocks ranking. The CLI replaces the requested report with
`status="invalid_requirements"`, an empty ranking, and no winner when policy
validation fails, then exits 2. It does not leave an earlier ranking looking valid.

See the [tool README](../../tools/pob-evaluation/README.md#conservative-passive-effect-policy)
for the JSON syntax. Example exceptions are not gameplay recommendations.

## Verification

All 111 offline Node tests pass, including 12 new policy cases and the new CLI
end-to-end test. Whitespace checks pass for the touched tooling and documents.

Controlled tests demonstrate that a cheaper candidate with unchanged numeric
outputs is rejected when it loses an unmodeled passive. The same loss is admitted
only with its matching reasoned exception; warnings remain. Other tests cover
per-set scope, granted passives, partially parsed text, duplicate occurrences,
changed text, false equivalence across nodes, malformed/stale exceptions, and
non-mutation. An exception cannot waive equipment/gem requirements, damage floors,
required nodes, failed audit evidence, or missing coverage.

An end-to-end CLI fixture checks both default activation and stale-ranking
replacement for malformed/stale exceptions, preserving all input files. It uses
synthetic calculation records and is not presented as a real-build measurement.

The captured real native outputs in `var/pob-effect-coverage-20261107/` were
reverified and re-filtered, not recalculated or overwritten:

- Warbringer, preserve-recovery policy: Original and Candidate 2 remain eligible;
  Candidate 1 still fails EHP minima. All tested routes retain original unmodeled
  passive effects. The new report is `conservative.requirements-report.json`.
- Spark, 10%-damage-loss policy: both alternatives and Original remain eligible;
  tested alternatives retain original unmodeled passive effects. The new report
  is `conservative-allow-10.requirements-report.json`.
- Rankings remain provisional because parser gaps still exist. These real samples
  establish no unintended outcome change; controlled loss tests establish rejection.

No native evaluator or browser code changed, so native recalculation and frontend
test/build/browser runs are not necessary for this filter-only step. Prior native
outputs remain hash-bound and independently checked by the comparison command.

```powershell
node --test tools/pob-evaluation/*.check.mjs
node tools/pob-evaluation/build_requirements.mjs var/pob-effect-coverage-20261107/warbringer tools/pob-evaluation/examples/warbringer-recovery.requirements.json conservative.requirements-report.json
node tools/pob-evaluation/build_requirements.mjs var/pob-effect-coverage-20261107/spark tools/pob-evaluation/examples/spark-allow-10-percent-loss.requirements.json conservative-allow-10.requirements-report.json
```

## Limits and Next Step

This protects literal original passive effects with known parser gaps, not every
unsupported game mechanic or semantic interaction. Scaling/uptime can change
without the passive text changing. Item/custom-modifier gaps and unresolved grants
without a passive identity remain warnings, not extra automatic protection rules.
Evidence and policy scope must not be described as complete in-game validation.

Recommended next: feed these protected passive nodes into offline candidate
generation as mandatory constraints, accounting for explicit exceptions. Keep
this independent post-evaluation filter as a backstop. That would search for safe
candidates directly instead of generating candidates that must later be rejected.
This task does not change generation or introduce a website optimization mode.

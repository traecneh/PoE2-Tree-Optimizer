# Runtime Effect Coverage

Implemented November 7, 2026, for the offline PoB evaluation workflow, following
the [Thaumaturgic Generator audit](2026-11-07-pob-thaumaturgic-generator-audit.md).
The later [conservative policy follow-up](2026-11-07-pob-conservative-effect-policy.md)
now rejects removal of original unmodeled passive effects unless specifically
allowed. The warning-only ranking behaviour below records this step's baseline.
No website feature, original public build, personal build, or installed PoB file
was changed. The runtime remains the isolated PoB for PoE2 0.23.1 copy.

## Behaviour

Each fully reloaded candidate now captures `effectCoverage` from the same fresh
calculation environment used for recovery evidence. Coverage is separate for
every evaluated weapon set. It includes:

- Native passive description parsing for the active shared/weapon/ascendancy nodes
  and calculation-granted passives. The opposite weapon set is not treated as active.
- Parsed lines from equipped items, active flasks/charms, and selected item variants.
  Unused inventory and inactive variants are not scanned as equipped effects.
- The active configuration's custom modifier parsing.
- Native granted-passive requests, their resolution against PoB's full catalog,
  and whether the resolved nodes entered the calculation environment.

PoB's per-line `mods` records already handle combined passive descriptions; the
collector uses those results directly. A successfully parsed continuation is not
mistaken for a separate unsupported line. Exact original text and any native
unrecognized remainder are retained, including partially parsed item effects.

The JavaScript inspector derives warnings from these records. It verifies source
hash, engine/tree/candidate/set identity, complete active node inventory, unique
line records, inventory line counts, grant identities, and original coverage for
comparison. Saved warning lists or `complete` flags are not trusted.

## Ranking Contract

Arithmetic validation, import compatibility, and effect coverage are distinct.

| Situation | Ranking behaviour |
| --- | --- |
| Import or arithmetic validation fails | Existing block/rejection behaviour remains. |
| Coverage absent, stale, incomplete, or malformed | `unverified_effect_coverage`; empty ranking, no winner, candidates unverified, CLI exit 1. |
| Known parser gaps remain | Requirement minima still apply, but any ranking is explicitly `provisional` and carries warnings. |
| No parser gaps detected in this scope | Ranking is `scoped`, never described as full mechanic or in-game validation. |

Reports expose `runtimeEffectCoverage` before the ranking, candidate-specific
`effectCoverageWarnings`, and `effectCoverageChanges` relative to the original in
each weapon set. Removing an unmodeled node can remove its warning, but the
comparison retains the original effect as a removed warning. That is not evidence
that the loss is harmless. Baseline gaps keep the comparison provisional even if
the candidate itself has fewer warnings.

Warnings are not automatically assigned zero value, assigned invented scores, or
turned into hard policy rejections. Current numeric requirements and required-node
rules remain unchanged. The CLI deduplicates warning messages for readability;
the JSON report preserves all per-set/per-candidate detail.

## Fresh Public-Build Results

Ignored evidence is under `var/pob-effect-coverage-20261107/`. Original source XML,
preflight, and manifest were copied from previously approved captured jobs into
fresh directories; prior reports were not overwritten.

| Build | Arithmetic checks | Coverage checks | Original parser-gap records | Policy result |
| --- | ---: | ---: | --- | --- |
| Warbringer | 425 passed | 69 passed | W1: 18; W2: 19 | Original, then Candidate 2; provisional. Candidate 1 still fails original EHP minima. |
| Spark Stormweaver | 231 passed | 34 passed | Active W1: 7 | Only Original passes preserve-recovery policy; provisional. |

Across all tested candidate/set contexts, the Warbringer report has 111 warning
records and Spark has 23. These are not 111/23 unique mechanics: a retained effect
appears in each relevant candidate/set. The report does not conflate this with
point cost or count a granted passive multiple times.

Thaumaturgic Generator resolves to node 56666 in both Warbringer weapon sets,
is marked granted and not paid, and remains outside the routable game graph.
Its `Grants Thaumaturgical Dynamism` effect is flagged as unparsed. Pack
Encouragement and Swift Claw also resolve as grants, but show no description-parser
gaps. No fake travel connection or paid goal is created for the anoint-only node.

Other measured native parser gaps include charge-triggered recovery, certain
totem effects, and Runic Ward item text. Spark reports include meta-skill energy
text and partially parsed mana-cost efficiency. These observations establish
parser limitations in the tested runtime, not that an effect is irrelevant or that
no separate specialized implementation exists elsewhere in PoB.

Original allocation, equipment/skill/configuration context, weapon selection, and
baseline outputs restore after both real-build audits. Existing point counts and
requirement outcomes are unchanged. Source XML hashes still match their manifests.

## Verification

- 98 offline Node tests passed, including 10 new coverage tests.
- Native Lua collector checks passed: combined descriptions, inactive item variants,
  opposite weapon sets, custom modifiers, partial parsing, grants, and non-mutation.
- Fresh real-build native evaluation, verification, and requirement comparison
  completed for Warbringer and Spark.
- Missing coverage, deliberately stale IDs/versions, dropped warning records,
  duplicate lines, malformed collections, and fake saved completion flags do not
  produce a ranking in negative tests.

No browser smoke test was needed: this change adds no browser code or server.
The frontend test/build suite was not rerun for this offline-only change.

Using the existing fresh jobs and isolated runtime:

```powershell
$runtime = "var/pob-evaluation-spike-20261106/runtime"
$job = "var/pob-effect-coverage-20261107/warbringer"
python tools/pob-evaluation/run_headless.py $runtime --driver tools/pob-evaluation/evaluate_real_build.lua --job $job
node tools/pob-evaluation/verify_real_audit.mjs $job
node tools/pob-evaluation/build_requirements.mjs $job tools/pob-evaluation/examples/warbringer-recovery.requirements.json coverage.requirements-report.json

$job = "var/pob-effect-coverage-20261107/spark"
python tools/pob-evaluation/run_headless.py $runtime --driver tools/pob-evaluation/evaluate_real_build.lua --job $job
node tools/pob-evaluation/verify_real_audit.mjs $job
node tools/pob-evaluation/build_requirements.mjs $job tools/pob-evaluation/examples/spark-preserve-recovery.requirements.json coverage.requirements-report.json
python tools/pob-evaluation/run_headless.py $runtime --driver tools/pob-evaluation/effect_coverage.check.lua --job $job
node --test tools/pob-evaluation/*.check.mjs
```

Older outputs without coverage must be re-evaluated before requirement ranking.
Arithmetic-only historical evidence remains historical evidence, not a new
coverage certificate.

## Limits and Next Step

This checks parser coverage, not every skill/support, every specialized modifier
implementation, charge/buff uptime, rotations, full sustain, or independent full
damage/EHP correctness. Fully parsed text can still be unsupported or irrelevant
in a specific configuration; unparsed text can still matter greatly in-game.

Recommended next: add an explicit conservative coverage policy that rejects a
candidate dropping an unmodeled passive effect unless that loss is deliberately
allowed. Existing required-node protection can preserve a known critical node;
the new before/after warning records provide the basis for systematic review
without inventing replacement scores. This task does not implement that policy.

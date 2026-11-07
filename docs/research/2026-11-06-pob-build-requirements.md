# Offline Build Requirements Filter

Implemented and tested November 6, 2026. This follows the
[public Spark build audit](2026-11-06-pob-real-build-audit.md). The website and
shortest-route optimizer are unchanged; these are offline evaluation tools only.

Follow-up: [weapon-set and recovery checks](2026-11-07-pob-weapon-set-recovery-audit.md)
now cover a second public build and explicit regeneration floors, with the scope
and remaining compatibility limitations recorded separately.

## Behaviour

`tools/pob-evaluation/build_requirements.mjs` applies explicit must-preserve rules
to already calculated complete trees, before ordering eligible candidates by point
cost. It does not sum individual node power, invent a combined offence/defence
score, generate new routes, or automatically apply anything.

Mandatory checks are:

- Retain all audit goals and pinned attribute nodes.
- Retain any additional original main-tree nodes listed by the policy.
- Meet each candidate's own equipment/gem Strength, Dexterity, and Intelligence
  requirements, not just the original tree's requirements.
- Satisfy explicit absolute or original-relative metric minimums.
- Retain the original tree as a comparison candidate, evaluating it honestly by
  the same rules rather than guaranteeing it a pass.

The CLI recomputes the audit against the current captured XML, results, and game
graph. A failed integrity check blocks the whole comparison as `invalid_audit`;
no candidate is ranked. A legitimate attribute shortfall is a requirement failure,
not an engine failure: it rejects only that candidate when adapter/arithmetic
checks pass. The existing verifier still reports its combined `passed` flag and
also exposes `integrityPassed` so those two cases remain distinct.

Each candidate has `eligible`, `rejected`, or `unverified` status, detailed checks,
failed requirements with actual/minimum values, point change, separate metric
values, and existing audit warnings. Missing/nonfinite values do not satisfy a
requirement. Numeric thresholds are applied before display rounding. Unsupported
rules, duplicate metrics, unknown fields, and malformed numbers are errors rather
than silently ignored settings.

Reports include hashes of the captured source XML, graph, policy, candidate
manifest, and PoB results plus engine/data versions. Outputs are separate ignored
files; installed PoB files, input exports, and user saves are not modified.

## Two Explicit Test Policies

Both example policies require:

- Original small nodes `50817` and `61355`, each granting 4% mana protection.
- At least 100% damage taken from Mana before Life.
- At least the original configured PoB effective hit pool.

The strict example additionally requires at least **95% of original Full DPS**.
The second example changes only that limit to **90%**, explicitly allowing up to
10% less damage. These are demonstration choices, not inferred universal defaults.
Full DPS and EHP are still PoB outputs under the unchanged build configuration.

## Measured Results

Both original and protected jobs were freshly recalculated in the isolated PoB
0.23.1 runtime before applying both policies. Each comparison recomputed the
145-check audit: 136 integrity checks and 9 attribute requirement checks.

| Candidate | Main points | Full DPS versus original | 95% damage floor | 90% damage floor |
| --- | ---: | ---: | --- | --- |
| Original | 121 | 100% | Eligible | Eligible |
| Unprotected alternative 1 | 119 | 91.94% | Rejected: nodes, protection, hit pool, damage | Rejected: nodes, protection, hit pool |
| Unprotected alternative 2 | 120 | 90.88% | Rejected: nodes, protection, hit pool, damage | Rejected: nodes, protection, hit pool |
| Protected alternative 1 | 119 | 91.94% | Rejected: damage | Eligible |
| Protected alternative 2 | 120 | 90.88% | Rejected: damage | Eligible |

Thus the strict policy keeps only the original tree. With the explicitly larger
damage allowance, the protected alternatives become eligible and the comparison
order is 119, 120, then the original 121 points. The cheaper broken routes never
become eligible just because damage requirements are loosened.

This is filtering a small tested candidate set, not proving there is no better
route or that an eligible alternative is the best in-game build. In particular,
the protected alternatives still remove two mana-regeneration passives: passing
hit-capacity and damage thresholds does not prove sustained mana recovery.

## Verification

The offline suites pass **42 tests**, including:

- Critical nodes, separate minimums, and attributes reject unsuitable candidates.
- A damage allowance does not alter defence requirements.
- A verified attribute deficit rejects only that candidate, while an integrity
  failure blocks all ranking.
- Missing evidence, malformed rules, missing/nonfinite metrics, overflowed
  thresholds, and missing original controls fail closed.
- Exact threshold boundaries and equal-cost ordering are deterministic.
- The original is not automatically passed, inputs remain unchanged, audit
  warnings remain visible, and output traversal/input overwrite is refused.

All four real-job/policy combinations match the expected eligibility and ordering.
The CLI records the result hash it actually evaluated. The earlier synthetic
42-check arithmetic report remains a separate fixture, not extra validation of
general PoB damage or EHP.

Repository verification also passes: all 300 app tests, the production build, and
graph validation (0.5.5f, 4,762 nodes, no reported issues). No browser-facing file
was changed by this requirements-filter step.

## Next Recommended Step

Before website integration or preference ranking, audit a second public build
with a different defence model and positive weapon-set allocations. Add explicit
recovery metrics/checks so a route preserving hit capacity cannot hide a broken
sustained resource budget. Generalize the fixture-specific verifier only when
those additional cases have independent evidence.

After those checks, preferences such as more ES within a small extra-point budget
can rank complete candidates that pass their chosen hard requirements. The
calculator delivery question (local helper versus separate service or browser
port) is still unresolved; no service or upload path is introduced here.

## Reproduce

Commands and policy format are in
[the tool instructions](../../tools/pob-evaluation/README.md#must-preserve-filter).
This run's four reports are in `var/pob-real-build-audit-20261107/` and its
`protected/` subdirectory, named `strict.requirements-report.json` and
`allow-10-percent.requirements-report.json`. The large runtime and public build
export stay out of the shipped site.

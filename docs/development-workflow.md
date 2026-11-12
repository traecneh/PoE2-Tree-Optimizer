# Coverage and Validation

These are developer tools, not site panels or new scoring mechanics. They do not
change shortest routing, preferences, saved builds or PoB support compatibility.
The coverage snapshot is separate from the deployed `data/tree-graph.json`.

## Routine Commands

| Command | Use |
| --- | --- |
| `npm run coverage:report` | Generate the current coverage/backlog inventory. |
| `npm run coverage:check` | Generate reports and check against the reviewed baseline. |
| `npm run validate:quick` | Focused preference, persistence, control and tooling tests; typecheck; coverage check. |
| `npm run validate:release` | Every test; typecheck; full asset preparation; production build; graph validation; coverage check. |
| `npm run test:node` | Pure/extraction/tooling test project, without jsdom. |
| `npm run test:dom` | Component, hook and browser-storage tests in jsdom. |

`npm test`, `npm run build` and `npm run validate:graph` remain available. Test and
graph-validation preparation copy only the graph; dev/build still prepare all
images and remove obsolete generated assets. Quick validation does not recopy
images, build production bundles or imply that every test was run.

The validation runner uses argument arrays without shell commands, stops on the
first failure, waits for its current child and records passed/failed/skipped steps
and timings under `var/validation/quick.json` or `release.json`. A cancelled run
is failed, not a partial success. The scripts locate the checkout from their own
paths; no local PoB installation, network access or private build is needed for
ordinary coverage reports and validation.

GitHub Pages now runs release validation before deployment and retains coverage
and validation artifacts for seven days, including when validation fails. This
workflow change takes effect when pushed; local success is not a hosted deploy.

## Coverage Meaning

`var/coverage/report.md` is the concise summary; `report.json` contains the full
catalog, node statuses, per-focus matches, effects with zero matches, missing
catalog IDs, all unsupported templates and their example/node lists. Output is
ignored by Git and is not bundled into the site.

The four statuses have deliberately limited meanings:

- `reviewed`: a configured scoped skill preset, implemented support refinement,
  or main-tree node whose stat lines are all recognized by the existing parser.
- `partial`: a node with both recognized and unrecognized lines, or an explicitly
  reviewed support that currently supplies context/warnings only.
- `unsupported`: no configured preset/support or no recognized stat wording. It
  does not mean the passive is missing from the viewer or cannot be allocated.
- `not-applicable`: class starts, ascendancies and mastery regions are excluded
  from main-tree preference scoring. Empty jewel sockets are recognized by their
  socket flag, not by inventing a stat line or modeling a socketed jewel.

Recognized lines are tested across manual and all reviewed base-skill focuses.
Union coverage can exceed any particular build's coverage. Support-combination,
gear, conditional-effect and complete DPS/defence modeling are not implied.
Repeated nodes count as stat occurrences; distinct wordings are reported separately.
Increases and reductions both count as recognized, including zero-net values.

Catalog percentages count entry IDs, with support tiers separate. Positive-tier
subtotals are also shown. Tier-zero entries are retained for triage, not silently
marked inapplicable. The PoB catalog is not a verified list of obtainable live
gems, so there is no invented overall "project finished" percentage.

## Baseline and Data Updates

`tools/coverage/baseline.json` records the graph/catalog fingerprints and covered
wording for each focus. Losing an old match fails the check, even when another
match keeps the total count unchanged. New matches are allowed. Numeric scores
and route quality remain the responsibility of scorer/routing tests; this is not
instrumented code coverage or a proof of mathematical correctness.

If the graph/catalog changes, or a deliberate scope correction removes a match:

1. Run `npm run coverage:report` and inspect the affected wording and contexts.
2. Review the source change; fix accidental losses and update relevant tests.
3. Run `npm run coverage:baseline` explicitly and review its Git diff.
4. Run release validation before committing the updated baseline.

Neither check nor CI updates a baseline automatically. JSON formatting and CRLF/LF
differences do not invalidate it. Ordinary additions do not require accepting a
new baseline, but refreshing it after reviewing a batch protects new matches too.

## Catalog Provenance

The tracked catalog is an export of `Data/Gems.lua` from a marked isolated local
PoB copy. It records the PoB version, original source-file SHA-256 and capture
time. The GitHub source link is a reference, not a claim that a moving `dev`
branch is byte-identical to that snapshot. No Git commit is inferred from the
installed PoB version. Gem data belongs to Grinding Gear Games; PoB is the source
reference, not an endorsement of this project.

To refresh after updating a trusted isolated copy, use the existing native runner:

```powershell
npm run coverage:refresh-catalog -- --runtime var/ISOLATED/runtime
```

Windows/Python matching the native runtime are needed only for this explicit
refresh. `PYTHON` can specify its executable. The runner refuses normal installs
and unmarked/out-of-workspace copies. Exports are retained under a fresh ignored
`var/coverage-catalog-*` directory. Review the catalog diff and coverage report,
then deliberately refresh the baseline. Native export executes trusted PoB code;
it is not a security sandbox for arbitrary Lua.

## Batch Validation Policy

Default to coherent breadth batches: target 12-20 missing skill focuses when
existing scoring scopes fit, including common supports in the same batch. A
whole remaining weapon/form group can exceed that target when it reuses reviewed
mechanics. Keep a smaller batch only for a new damage source, ownership model or
other genuinely high-risk behavior; the eight-skill shield-source batch is one
such boundary. Related support-only work should cover 5-10 families across all
reviewed eligible focuses, not a recurring two-skill series. Passive batches can
cover 3-5 effect families. These are planning targets, not permission to invent
mechanics. Prioritize closing skill-group backlogs over polishing one skill.

When adding a whole skill group, include the global scope/catalog allowlist tests
in the focused run before release validation. Extend their independent fixture
groups explicitly; do not derive expected scopes from the production presets or
remove rejection assertions to make new scopes pass.

Use targeted Vitest file filters while editing. `validate:quick` is available
for broader preference changes but is not mandatory after every data row.
Share review descriptors and table-driven contracts across mechanically related
skills; source-derived compatibility shortlists candidates, but does not approve
components from tags alone. Preserve existing tests; do not delete independent
fixtures to make the suite smaller. Keep native parser/component spot checks for
new mechanics or ambiguous scopes. Pure matching additions do not require
repeated desktop/mobile screenshots, save/load click-throughs or asset rebuilds.

Changes to routing/worker contracts, allocation, import, persistence or shared
controls require affected integration tests and a real-browser smoke check.
Changes to layout/tooltips require relevant viewport checks. Run release
validation once the batch is complete, and before committing/deploying. Use
targeted Vitest file filters for unrelated feature work; quick is specifically a
preference/catalog workflow, not a universal substitute for affected tests.

For a new skill group using unchanged controls/storage, one shared parameterized
contract and a representative browser check are sufficient; do not duplicate the
same UI/storage suite for every support tier. Run the final release command once
after the combined batch is ready. Preserve source/native checks that protect
ownership, component scope, prohibitions and important numerical trade-offs.

Coverage now separates overlapping support capabilities: compatibility/context,
opt-in priority adjustments, suggestion constraints/cautions and direct passive
scope filtering. In-app Full DPS is reported separately as zero until actually
wired into the app. A native research probe or more warning text does not count
as a new scoring category or Full DPS implementation. Per-entry details include
skill overrides; Brutality's exclusions are no longer labeled context-only.

Chromium/Firefox end-to-end automation and performance/route-quality benchmarks
are still separate future work; this change does not pretend to add them.

## Initial Verification

On November 7, 2026, the full release command passed 783 tests across 56 files,
typecheck, the production build, graph validation and baseline comparison. The
suite took about 37 seconds; the complete release command about 43 seconds.
An initial quick run took about 8 seconds. Timings depend on host/cache state.
The pre-existing 28 pure test files passed in Node without jsdom; new tooling
tests also use Node. No assertions were removed to obtain the split.

The report reproduced 14 skill presets, 14 support choices, 34 preferences and
1,666/5,451 recognized main-tree stat occurrences (30.6%). CLI fixture checks
verified that report/check never create or overwrite a baseline, stale data
fails without accepting it, and CRLF/LF formatting does not cause false drift.
No application UI change was made, so repeated browser/layout screenshots were
not part of this developer-tooling batch. Hosted deployment was not performed.

# PoB Whole-Route Calculation Investigation

Investigated November 6, 2026. This is a successful offline feasibility experiment,
not a shipped scoring mode, website integration, or independent audit of all PoB
calculations. The existing shortest-route optimizer is unchanged.

Follow-up: [the public real-build audit](2026-11-06-pob-real-build-audit.md) now
tests additions and removals against full XML reloads. It also demonstrates why
critical small nodes and build requirements must precede preference scoring.

## Sources and Isolation

The local installed PoB manifest reports **0.23.1**, branch `master`, platform
`win32`. The uninstall registry's older version field was not used as the engine
version. Program modules, libraries, and tree data were copied to the ignored
`var/pob-evaluation-spike-20261106/runtime` directory. The source installation is
not edited. Personal builds, settings, `installed.cfg`, and the cached account
response are excluded from the copy.

PoB's official headless helpers are pinned to commit
`bb52d6b368307457eb9c54bb13f1829993d390b1`; helper SHA-256 values are checked by
the repeatable preparation script. These helpers provide UI stubs; calculation
modules and tree data come from the copied installed release, not the online dev
branch. Python calls the copied LuaJIT C API, without launching the desktop UI.
The runner only accepts marked copies under this repository's `var/` directory.
Update checks and normal user-profile access are disabled. No network service is
started. This is not a sandbox for untrusted Lua or native libraries.

Fingerprints confirmed equal between the installed source and isolated copy:

| File | SHA-256 |
| --- | --- |
| `manifest.xml` | `EC506DC4B48EC93A82041BB7E9C5F1BBBFAD22C886066DABB2BD827D77EFC8EB` |
| `lua51.dll` | `2E4E58E4CC6F6CB01D119FF3715253108041F6C59F9A6A464A62B2F70623BCA6` |
| `Modules/Calcs.lua` | `79E30097B96BAF189EF7A71248D6E10E33AA15A6C8D74C01604D62D11BAE09FB` |
| `Modules/CalcDefence.lua` | `7884220A9744297BC62DE7D67112173D4BA28FFB35C848E9418031E6F68B1CC7` |
| `Modules/CalcOffence.lua` | `EB76D3D8BE967C5BCA79062C79CF4693D182B652BB2B2418C07FA7DA16F91435` |
| `Classes/CalcsTab.lua` | `F021E4957D0ECE3FF6602154E420A0A7331438E8039C1AFD3F19176AF56203CA` |

## Calculator Interface

`calcs.getMiscCalculator(build)` returns a baseline output and a callable accepting
sets of `addNodes` and `removeNodes`, as well as overrides for other build inputs.
This lets us evaluate a whole candidate without summing individual Node Power
scores. A full candidate must be expressed as a difference from the imported
baseline: additions alone would retain obsolete main-tree passives.

For this experiment, a controlled level-90 Witch is loaded through PoB build XML.
The fixture has no equipment or selected gem setup; it uses the default unarmed
attack for basic damage checks. ES fixtures provide a known flat amount through
custom modifiers. Attribute travel nodes explicitly choose Strength. These are
not representative character-performance benchmarks.

## Independent Checks

The JavaScript verifier does not call PoB's scoring functions or our Build Summary
aggregator. It separately calculates expected arithmetic from declared fixture
inputs and, for the route examples, the game-extracted passive descriptions.

**42 checks pass**, including:

- Direct +10 Strength and +10 Intelligence.
- 100 flat ES with 20% increased ES = 120.
- 100 flat ES with 20% and 30% increased ES = 150, not 156.
- 100 flat ES with 20% increased and 30% more ES = 156.
- Two flat 100 ES contributions with 20% increased ES = 240.
- Two 50% increased attack-speed contributions double speed and DPS in this fixture.
- Added Lightning ranges 1-7, 1-7, and 1-37 combine to 3-51.
- Damage-component rounding explains the controlled 20% more Attack Damage result.
- Every candidate includes both required goals, is connected to the chosen root,
  and counts shared nodes once.
- ES and attributes agree with independent sums for the supported route fixtures.
- Candidate evaluation leaves the original allocation and baseline outputs unchanged.

There are also **9 verifier tests**, including deliberate wrong ES totals, wrong
damage ranges, omitted attribute choices, disconnected routes, missing goals,
mutated baselines, and missing output fields. These test that the verifier can
reject incorrect results rather than merely printing comparisons.

Two integration details were caught during the experiment and corrected:

- Missing the build's target-version attribute opened a conversion state instead
  of fully loading its tree/configuration. Assertions now check the loaded class
  and custom modifiers.
- Changing an attribute override does not immediately refresh the effective node
  modifiers. Rebuilding PoB's dependency/path state is needed before calculation.

Neither finding is evidence of a PoB calculation defect.

## Whole-Tree Results

Our current exact router generated a route from the Witch start to **Melding**
and **Patient Barrier** using the game's 0.5.5f graph. Two comparison routes retain
those same mandatory goals and add a nearby ES target. They demonstrate candidate
evaluation; they are not produced by a new weighted optimizer.

The baseline has 100 flat ES. All attribute travel nodes choose Strength.

| Candidate | Added points | Calculated ES | Strength | Intelligence |
| --- | ---: | ---: | ---: | ---: |
| Shortest | 22 | 259 | 77 | 23 |
| Via Energy Shield, ID 19355 | 23 | 259 | 82 | 23 |
| Via Pure Energy, ID 2254 | 23 | 292 | 77 | 33 |

The shortest route contributes 10 flat ES and 135% increased maximum ES:
`round(110 * 2.35) = 259`. The Pure Energy alternative contributes the same flat
amount and 165% increased maximum ES: `round(110 * 2.65) = 292`.

The final sample measured approximately 2-4 milliseconds of CPU time per warm
candidate calculation. Initializing the runtime and running all fixtures took
several seconds. A complex real build, Full DPS, minions, or EHP may be much more
expensive; these numbers must not be used as production performance estimates.

PoB logged 14 missing-node references while loading its copied tree. All IDs used
by these three candidates were found and evaluated. The broader warnings need
triage before trusting arbitrary imported trees.

## Scope of Confidence

These checks establish arithmetic consistency and basic adapter correctness for
the selected fixtures. They do **not** establish that PoB matches the game for
every mechanic. General DPS, minion behavior, conditional modifiers, jewels,
recovery interactions, damage conversion, EHP, and multi-weapon-set behavior have
not been independently validated here. A real-build audit should preserve its
assumptions and compare selected results with game observations where feasible.

No universal Offence/Defence/Utility score has been invented. Prefer explicit
outputs such as ES, attributes, and Full DPS, with documented configuration.

## Hosting and Next Step

GitHub Pages serves static assets; it cannot host the copied native calculator or
launch a visitor's installed PoB. The browser-to-calculator connection is not
implemented or browser-tested.

Plausible delivery approaches are an opt-in local helper, a separately hosted
calculation service, or a future browser-compatible port. A local helper best
matches the current local-first approach, but requires installation, a narrowly
scoped local protocol, origin checks, request limits, and explicit permission
before processing builds. A server approach adds hosting and privacy decisions;
a browser port requires substantial runtime/native-dependency work.

Recommended next experiment: load one user-supplied real PoB build and compare
two complete candidate trees. Retain its full XML, not just goals. Preserve gear,
skills, active configurations, class/ascendancy, attribute choices, weapon sets,
and jewels. Reject missing/mismatched tree IDs instead of silently ignoring them.
Verify main-tree additions **and removals**, state restoration, and unchanged
baseline outputs before adding a website scoring mode. Cache results only with
the full build context, engine/data fingerprints, and candidate choices in the key.

## Reproduce and Sources

See [the experiment instructions](../../tools/pob-evaluation/README.md). Raw
fixtures and reports remain under ignored `var/`; no personal build was loaded.

- [Official headless wrapper](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/HeadlessWrapper.lua).
- [Calculator interface](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Modules/Calcs.lua).
- [Node Power calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Classes/CalcsTab.lua).
- [GitHub Pages is static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

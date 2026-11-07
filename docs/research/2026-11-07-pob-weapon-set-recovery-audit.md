# Weapon-Set and Recovery Audit

Completed November 7, 2026, with the isolated PoB 0.23.1 runtime and the game's
0.5.5f graph. This extends the [offline requirements filter](2026-11-06-pob-build-requirements.md).
No website mode, weapon-set optimizer, local service, or upload endpoint was added.

Follow-up: [import compatibility preflight](2026-11-07-pob-import-preflight.md)
now explains known allocation blockers before route generation or ranking, and
keeps unresolved item-grant coverage visible.

## Second Public Build

[Public level-96 Warbringer export](https://poe.ninja/poe2/pob/2b47e), with an
Earthshatter totem selected-skill setup, uses a life/armour defence model rather
than the first Spark build's CI/mana model. All 154 allocated IDs exist in our
graph. Source XML SHA-256:
`e73f5da708627c43124bef7b310baa86b16c3dd78d8c75990e8f14abd52dd7e8`.

The source contains:

- 96 shared non-weapon paid points, 24 W1 points, and 24 W2 points.
- 8 paid ascendancy points and 4 jewel sockets.
- 34 main-tree travel-attribute choices, all retained.
- 3,054 Life, 9,159 Armour, no ES, and no Mana in the evaluated contexts.
- W2 originally selected. No groups are enabled for Full DPS, so the adapter uses
  the selected skill's `CombinedDPS` rather than changing the author's skill setup.

The raw PoB union counter is 144 main-tree points: shared 96 plus both reserved
sets. Either active tree has 120 points, before ascendancy. Class/ascendancy roots
are not paid points. Do not compare the union counter with shared routing cost.

A level-89 Titan export was also inspected but rejected by conservative shared-only
route generation. It contains a From Nothing disconnected-allocation jewel, and a
required shared node was unreachable after reserving the weapon nodes. This audit
does not establish which special-allocation dependency caused that failure. It was
not repaired by inventing edges, dropping goals, or altering the source build.

## Adapter Changes

The generator keeps weapon nodes out of shared routing and pins 11 original
shared boundary nodes so the fixed weapon branches retain their attachment points.
Both W1 and W2 are calculated independently. Their exact node IDs and assignments
are checked, not merely their counts. Connectivity is verified separately for
shared+W1 and shared+W2, without borrowing nodes from the other set.

For each scenario, additions/removals are compared with a complete XML reload.
Only the active weapon selection changes between scenarios; gear, skill selection,
configuration, jewels, ascendancy, and source attribute choices stay fixed.
The original selection, complete allocation, context, and calculated outputs restore
afterward. New travel choices are explicit (Strength for this job).

Requirements apply to every evaluated set by default and compare with the matching
original set's baseline. An explicit `weaponSets: [2]` scope is supported. The
Warbringer's selected skill reports zero damage in W1, so its damage floor explicitly
targets W2; its life, hit-capacity, and regeneration floors apply to both sets.
A zero original damage value cannot silently satisfy a relative damage floor.

## Warbringer Results

The policy requires original Life, configured PoB hit capacity, and Life
regeneration/recovery in both sets, nonnegative Mana recovery, and original W2
selected-skill damage. These are chosen demonstration requirements, not universal
recommendations or a claim that these outputs establish complete viability.

| Tree | Shared points | W1/W2 points | W2 selected-skill DPS | W2 PoB hit pool | W1/W2 Life regeneration per sec | Result |
| --- | ---: | --- | ---: | ---: | --- | --- |
| Original | 96 | 24 / 24 | 389,098.89 | 18,760.08 | 147.7 / 184.3 | Eligible |
| Alternative 1 | 96 | 24 / 24 | 389,098.89 | 18,693.08 | 147.7 / 184.3 | Rejected: hit capacity |
| Alternative 2 | 97 | 24 / 24 | 396,142.61 | 18,760.08 | 147.7 / 184.3 | Eligible |

Alternative 1 also reduces W1 hit capacity from 21,025.28 to 20,947.83; the policy
rejects both small reductions. Alternative 2 adds one shared point and raises W2
selected-skill damage by **1.81%**, while retaining the checked hit-capacity and
regeneration values in both sets. The original still ranks first on point cost.
These are a few heuristic candidates, not an exact optimum or an in-game test.

## Independent Recovery Checks

The checker does not call the Build Summary or PoB's calculation functions. It
independently computes, from recorded resolved modifier inputs:

```text
regen = round((flat + pool * percent / 100) * (1 + increased / 100) * more, 1)
recovery = usable regen - degeneration + added recovery * recovery rate + overflow
```

Disabled/unaffected regeneration and positive Life regeneration transferred to ES
are handled explicitly. Negative recovery remains negative. Missing/nonfinite
inputs or missing boolean flags do not count as verified.

For this build, the recorded inputs give:

```text
W1: round(3,054 * 0.0403 * 1.20, 1) = 147.7 Life/sec
W2: round(3,054 * 0.0503 * 1.20, 1) = 184.3 Life/sec
```

These agree with PoB. This validates the selected arithmetic and adapter inputs,
not the correctness of every modifier's resolution. It is not an independent
implementation of PoB's entire defence system.

## Spark Recovery Regression

The protected [public Spark build](https://poe.ninja/poe2/pob/28df3) was regenerated
and recalculated with the extended harness. The original mana regeneration is:

```text
round(365.36 * 6.23 * 1.38, 1) = 3,141.1 Mana/sec
```

Both cheaper routes remove two game-extracted 10% mana-regeneration passives.
The independent delta check confirms the resolved increased factor drops from
523% to 503%. Flat and more factors remain explicit, rather than assuming every
percentage multiplies independently.

| Tree | Shared points | Mana regeneration per sec | Retain original regeneration |
| --- | ---: | ---: | --- |
| Original | 121 | 3,141.1 | Pass |
| Protected alternative 1 | 119 | 3,040.3 | Fail |
| Protected alternative 2 | 120 | 3,055.0 | Fail |

Without the regeneration floor, the previous 10%-damage-loss policy still admits
both protected alternatives. Adding that floor rejects both. This is an explicit
tradeoff, not proof that the smaller regeneration value breaks the build.

## Verification and Limits

- **425 checks** pass for the Warbringer's two weapon scenarios.
- **231 checks** pass for the freshly generated protected Spark job.
- **57 offline tests** pass, including deliberate wrong regen inputs, swapped
  weapon IDs with unchanged counts, connectivity through the wrong set, missing
  scenarios, wrong active selection, missing evidence, and per-set requirement floors.
- Four real-job/policy comparisons reproduce the expected eligible/rejected results.

All 300 application tests, the production build, and graph validation also pass.
The graph reports 4,762 nodes and 5,426 edges with no validation issues. No
browser-facing source file changed in this step.

Full damage and EHP still rely on PoB, not independently reproduced game mechanics.
Selected-skill life/mana costs are cross-checked between adapter and reload outputs
when available, but total sustain is not inferred. For example, the Warbringer
reports about 712.53 Life/sec cost at the selected skill's modeled use rate, versus
184.3 Life/sec regeneration in W2. Totem placement duty cycle and other recovery
sources matter; this report does not assume continuous use, unlimited flasks, or
that regeneration alone funds a full rotation. Leech, recoup, flask uptime,
multiple skills, and recovery while taking damage need separate work.

The same 14 PoB missing-node references appear at runtime startup, but none belongs
to these evaluated routes. Disconnected/alternate allocation mechanics are not
generally supported just because two public builds passed their scoped checks.

## Next Recommended Step

Add a compatibility preflight that explicitly identifies special allocation rules,
alternate starts, disconnected item-granted passives, and missing calculation
coverage. Explain unsupported cases before generating performance-ranked routes.
The rejected Titan is a useful regression case; do not silently force it into
ordinary root-connected routing.

Keep preferences and website integration behind that compatibility boundary. A
future sustain requirement must separately specify skill-use assumptions and
allowed recovery sources instead of labeling a simple regen floor as complete
survivability or sustain.

## Reproduce

See [the tool instructions](../../tools/pob-evaluation/README.md#weapon-sets-and-recovery).
The current capture and reports are under ignored
`var/pob-second-build-audit-20261107/warbringer/` and `spark-protected/`.
The native runtime, source exports, and result files are not bundled into the site.

# Mace Primary Breadth Batch

2026-11-10. Implements the approved move from serial two-skill support reviews
to broader coherent skill groups, shared mechanics and proportionate validation.
Local only; no commit, push or deployment.

## Delivered Scope

Eight previously missing positive-tier primary presets: Earthquake, Earthshatter,
Sunder, Supercharged Slam, Stampede, Leap Slam, Hammer of the Gods and Volcanic
Fissure. A shared reviewed descriptor builds Mace/melee/area scopes, suggestions
and exclusions; component exceptions remain explicit rather than inferred from tags.

Five existing support families cover all eight skills: Magnified Area I/II,
Efficiency I/II, Rapid Attacks I/II, Concentrated Area and Brutality I/II/III.
Ten choices times eight skills adds 80 reviewed pairs, not ten new catalog gems.
Support descriptions share five rules instead of eighty handwritten pair entries.
No unrelated skill's existing support overrides are replaced.

Concentrated Area retains its opt-in coverage-priority action. Other selected
supports do not edit priorities. Native magnitudes are evidence for descriptions,
not multipliers applied to route scores. Existing manual priorities, goals,
point budgets, weapon sets, storage and Shortest behavior are preserved.

## Important Boundaries

| Skill | Reviewed focus | Explicit exception |
| --- | --- | --- |
| Earthquake | Physical initial impact | Ground duration delays Aftershock; no assumed repeats/patch availability |
| Earthshatter | Physical fissure/Slam | Spike explosions need a Warcry; lifetime and overlap are not DPS |
| Sunder | Physical melee wave | Secondary shockwave lacks melee flag; cannot supply its own Armour Break |
| Supercharged Slam | Physical impact | Fixed timing described by native source; stages/Aftershocks are not assumed |
| Stampede | Physical final Slam | Charge travel uses Movement Speed after startup; no assumed contact count |
| Leap Slam | Physical landing | Fixed/distance-added time and external Fully Broken Armour remain separate |
| Hammer of the Gods | Conditional Physical hit | Current source uses Glory, not cooldown; always hits; no supplied Heavy Stuns |
| Volcanic Fissure | Native converted hit | 80% Physical-to-Fire; other Slams trigger Aftershocks; no assumed Ignite/overlap |

Supercharged Slam is the only new focus restricted to a two-handed Mace, so only
it automatically enables two-handed-only passive scopes. Other skills accept
one- or two-handed Maces and do not assume equipment handedness. Mace/melee
damage joins Attack Damage once; Elemental Damage with Attacks applies only to
the explicitly converted Fire focus. Proxy, spell and conditional wording stays
out. No new generic passive wording is added in this batch.

Brutality removes Volcanic Fissure's converted Fire, leaving only its unconverted
Physical portion in the reviewed setup. It is not recommended as a Fire upgrade.
Manual conflicting weights remain with cautions. Supercharged Slam gets no
automatic Attack Speed suggestion: the runtime's generic speed field changes
with Rapid Attacks despite the source's fixed-timing description. This unresolved
runtime/game discrepancy is not converted into a claimed cycle-speed benefit.

## Evidence and Lean Validation

Snapshot: marked isolated native PoB 0.23.1/tree 0.5.5f; no installed source or
user save modified. Moving upstream references are separate from the frozen copy:
[mace skill data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua),
[Strength supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua),
[Dexterity supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua),
[Intelligence supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua).

Ignored source/native artifacts: `var/mace-primary-batch-20261110/`. Export records
all eight identities/tags, weapon constraints, component flags/stats, and 80
actual native compatibility decisions. Efficiency correctly permits empty type
sets (its rule is exclusion-based); required-type supports reject them.

54 MAIN calculations use an isolated empty level-90 Warrior, normal zero-quality
Felled Greatclub (13-18 Physical), enough attributes, level-20 zero-quality skills,
level-1 supports and zero enemy Armour. Player ownership, active component,
weapon type and support application are asserted. All 14 base stat sets are
recorded; five representative support tiers are checked on each selected focus.
No optimizer benchmark, neighborhood audit or sustained-DPS claim is involved.

The independent verifier reconstructs AverageHit from stored Physical/Fire
ranges with the fixture's 5% critical chance/2x multiplier, area-to-radius square
roots, rounded Mana factors and the fixed added Leap Slam time. Channel cost
uses its per-minute source, not ordinary firing cost. Volcanic's native radius
is absent, so no radius value is invented. Native speed/trigger fields are not
proof of whole-cycle timing, stages, Glory, external Warcries or contacts.

One pure fixture/test file covers the group: identities, signed scope matching,
owner/condition rejection, family replacement, manual priorities, shared storage
roundtrip and two representative weighted/Shortest route contracts. One UI
contract checks the eight dropdown choices, common support controls and key
exceptions. Existing regressions remain; no previous tests were removed to
improve timing. Routine policy is documented in `docs/development-workflow.md`:
focused checks while editing, one final release run, representative UI checks
instead of per-pair repeated browser/storage workflows.

## Honest Coverage

| Measure | Before | After |
| --- | ---: | ---: |
| All-catalog skill presets | 103/399 (25.8%) | 111/399 (27.8%) |
| Positive-tier skill presets | 98/234 (41.9%) | 106/234 (45.3%) |
| Configured support choices | 117/567 (20.6%) | 117/567 (20.6%) |
| Reviewed skill/support pairs | 630 | 710 |
| Recognized distinct passive wording | 864/2,182 (39.6%) | Unchanged |
| Recognized passive occurrences | 3,444/5,451 (63.2%) | Unchanged |

The developer report now tracks overlapping support capabilities, including
skill overrides: 117 context-reviewed entries, 10 opt-in priority refinements,
7 constraint/caution entries and 1 passive-scope filter. Brutality is correctly
reported as constraints rather than context-only. In-app Full DPS is separately
zero; offline probes do not count as an app damage engine. Totals are not additive
percentages or a verified obtainable-primary-skill completion metric. Existing
coverage baseline is not refreshed to hide losses.

Validation completed:

- Eight native identities, 80 parent compatibility decisions and 54 MAIN
  component/support calculations passed the independent verifier.
- New grouped pure/UI contracts and coverage tooling passed focused checks.
  The first release attempt identified 18 stale exhaustive expectations in
  seven existing scope/catalog allowlist test files. They were extended using
  the independent mace fixture group, retaining strict ordering, ownership,
  signed matching and rejection checks. Those seven files passed 153 tests.
  An earlier UI test-only `exact` option type error was also corrected.
- The final release command passed 3,633 tests in 171 files, typecheck, asset
  preparation, production build, graph validation and unchanged baseline in
  83.686 seconds. Both attempt logs are preserved; the successful run is
  `var/mace-primary-batch-20261110/release-final.log`. Existing large-chunk
  advisory remains nonblocking (main 819.24 kB, 200.43 kB gzip); no unrelated
  performance refactor.
- Preview JavaScript bytes match the new dist asset at
  `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. One representative Edge workflow
  passed Earthquake, Supercharged Slam and Volcanic Fissure: ten shared choices,
  opt-in coverage adjustment, fixed-channel caution, Fire prohibition and
  preserved manual priorities. No page errors or final console errors/warnings.
  The initial existing `/favicon.ico` 404 was inspected separately.
- One desktop screenshot confirmed readable notes and a nonblank tree without
  overlap. No mobile/layout or repeated per-tier save/load browser checks were
  needed because those implementations did not change. Browser artifacts:
  `output/playwright/mace-primary-batch-20261110/`.
- Scoped `git diff --check` passed. Local checks are not user visual acceptance,
  live-game timing verification or deployed-site validation. Preview remains
  available. No commit, push or deployment.

## Next Broad Batch

Select 8-12 missing quarterstaff/Monk primary focuses from the frozen inventory,
grouped by reviewed hit/projectile components, then extend common support rules
across eligible members. Keep charge consumption, combinations, secondary
objects, travel and triggers explicit. Do not resume the deferred two-bow
Projectile Deceleration micro-batch by default. Proposal only.

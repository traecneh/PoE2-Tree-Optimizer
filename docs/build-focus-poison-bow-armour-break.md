# Poison Bow Armour Break Support Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f and moving upstream sources. Six context-only pairs, not a
break/charge-event timeline, enemy Armour solver, Full DPS model or global allowlist.

## Tiers and Components

| Support | Effect ID | Catalog tier | Physical damage dealt as break | Charge chance on Fully Breaking Armour |
| --- | --- | ---: | ---: | ---: |
| Armour Break I | SupportArmourBreakPlayer | 2 | 15% | None |
| Armour Break II | SupportArmourBreakPlayerTwo | 3 | 15% | 15% |
| Armour Break III | SupportArmourBreakPlayerThree | 4 | 20% | 20% |

All share family ArmourBreak; selecting a tier replaces the earlier one.
Attack OR Damage OR CrossbowAmmoSkill is required, with no excluded types.
Six native compatibility groups accept both actual parents, each fallback and
Exploit Weakness's modified types; missing all requirements rejects the link.
Link eligibility does not guarantee each component can apply the effect.

Actual Physical arrow Hits can apply break based on damage dealt, not raw
weapon damage, a percentage of enemy Armour or a damage bonus. For a nominal
100 eligible Physical damage, the declared pre-cap break is 15/15/20 units,
not 115/115/120 damage. Poison is Chaos damage over time, not a Physical Hit.
The no-hit burst/cloud and synthetic native source-hit fields are not extra
applications. The reviewed fully Physical-to-Fire converted Gas explosion has
no eligible Physical hit damage; gear/conversions and detonation are not inferred.

II/III require Fully Breaking Armour with supported skills for a chance of an
Endurance Charge. A hit, partial break, an already configured full-break state
or another skill's event does not establish that trigger. No successful event,
charge generation rate, charge consumption, defensive benefit or uptime is assumed.
None of these tiers adds a Mana multiplier; other supports' costs remain.

Sources: [I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L198),
[II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L228),
[III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L259).
Moving references are not claimed byte-identical to the frozen runtime.

## Corrosion and Exploit Weakness

Corrosion's separate 80%-of-supported-Poison-damage break is not another copy
of this hit-based effect or extra Poison DPS. It grants no Poison chance to
the initial arrow. Both sources may be linked without Exploit Weakness, but
the app does not calculate combined delivery, caps, target Armour, timing or
time to Fully Broken. Corrosion's 1.10 Mana factor still applies separately.

Exploit Weakness remains linked with Armour Break in either native link order,
but supplies CannotArmourBreak. This prohibition prevents self-supplying its
own full-break damage condition and this support's charge trigger. A separate
source must establish the condition. New reversible warnings appear on both
selected notes; manual settings are retained. No implied application loop.

Corrosion remains ineligible for the Exploit-modified parent. Native triple
links drop Corrosion in both orders, retain Armour Break and Exploit, and cost
only Exploit's 1.30 factor, not 1.30 x 1.10. The existing incompatible-pair
warning remains on both Corrosion and Exploit, alongside the new prohibition
warning. Removing Exploit restores standalone notes.

See [Corrosion](build-focus-poison-bow-corrosion.md) and
[Exploit Weakness](build-focus-poison-bow-exploit-weakness.md).

## Native Coverage Gaps

The reviewed percentage-break stat maps only to Condition:CanArmourBreak,
not an amount calculation. Native ArmourBreakPerHit remains zero for all three
tiers even with a positive Physical hit, and also after a parsed 100%-increased
Armour Break control. This is incomplete native coverage, not zero game effect.
The capability flag remains set alongside Exploit's prohibition; it does not
override CannotArmourBreak or prove legal application.

The charge-event stat is unmapped in the reviewed runtime and upstream stat map.
No charge-event simulation is invented. All native rows explicitly disable
Endurance Charge use and return zero current charges. A separately configured
full-break row still does not demonstrate the skill earned a charge.

[Stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L2970)
and [native output calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
No installed/frozen runtime source or saved user build was changed.

## Checks and Coverage

75 MAIN calculations use empty level-90 Witch builds, level-20/quality-zero
skills, normal Physical Crude Bow, sufficient attributes, boss None and fixed
two-metre distance. Five components each have baseline, I/II/III, Corrosion,
III+Corrosion, Exploit and both III/Exploit link orders (45). Per-parent arrow
partial/full controls add six rows, II+Exploit and explicitly full II add two,
Poison III with/without III/Corrosion adds three, two no-hit source scalar
controls add two, and both invalid triple orders add two (30). Six compatibility
groups and four parsed scalar controls are included.

All 75 rows passed independent verification of constants, actual applied links,
costs, configured state/prohibition, zero assumed charges, unchanged source hits,
Poison arithmetic and component timers. Twenty-four rows retain Armour Break
alongside the prohibition. Four triple rows reject Corrosion. The first verifier
run's expected prohibited-row count was corrected from 28 to 24 to match the
matrix (10 normal, 8 partial/full, 2 tier-II and 4 triple); no native/app behavior changed.

Base Mana stays 38/62; Corrosion costs 41/68; Exploit costs 49/80. Arrow Poison
III + Armour Break stays 45/74, or 50/81 with Corrosion, multiplying before
rounding. Separate arrow Poison DPS stays 4.56577245/1.53831410, no-hit source
Poison stays 5.38576622/4.00385418. Doubling Poison magnitude doubles the latter
without calculating break amount. Increasing break leaves those Poison outputs
unchanged. Explicit partial/full states are compared against same-state Exploit
baselines: only full enables its 1.40 modifier, independently of Armour Break.
Full-state mitigation changes are not credited as support damage gains.

Evidence: ignored `var/poison-bow-armour-break-20261110/` driver, native JSON,
independent verifier and logs. Known frozen startup missing-node notices are
retained; these empty-tree checks are not live-game tests or real-build imports.

110/567 support choices (19.4%), 109/450 positive-tier (24.2%), 66 families and
610 reviewed pairs. Poisonburst/Gas offer 85/87 choices. Skills remain 103/399
(98/234 positive), preferences 184, wording 864/2182 and occurrences 3444/5451.
No catalog refresh or coverage-baseline reset. These are scoped heuristic counts,
not overall completion. Priorities, route scores, goals, budgets, routing and
persistence implementation stay unchanged.

## Validation

Focused regressions passed 368 tests in six files, including nineteen new pure
tests and two UI cases. One `npm run validate:release` passed 3,501 tests in
165 files, typecheck, production build, graph validation and the unchanged
coverage baseline in 79.732 seconds. The existing large-chunk advisory remains
nonblocking (main 794.19 kB, 194.91 kB gzip); no unrelated performance refactor.

The local production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`
matches the built JavaScript bytes. Edge smoke passed both 85/87-choice lists,
tier replacement, removal/restoration, prohibition and retained Corrosion
incompatibility warnings, component/model-gap notes, earlier links and unchanged
manual weights. No automatic support-priority action, enemy-state input or page
errors. Screenshot inspection confirmed a nonblank tree and readable notes
without overlap. Final console: zero errors/warnings after reload. The initial
existing preview `/favicon.ico` 404 was inspected separately.

Browser evidence: `output/playwright/poison-bow-armour-break-20261110/`.
Scoped `git diff --check` passed. Tests verify source/native and local app
behavior, not live-game uptime or user visual acceptance. Preview remains
available. No commit, push or deployment.

## Next Proposed Batch

Review [Armour Demolisher I/II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L290)
for both Poison bows, separating break-amount multipliers from damage,
supported Corrosion sources and Exploit Weakness's prohibition. No assumed
Fully Broken Armour, below-zero Armour or Endurance Charge uptime. Proposal only.

Completed subsequently in the [Armour Demolisher checkpoint](build-focus-poison-bow-armour-demolisher.md).

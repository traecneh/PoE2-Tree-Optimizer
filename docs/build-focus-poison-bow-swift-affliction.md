# Swift Affliction I/II for Poison Bow Focuses

Four reviewed pairs extend the existing Swift Affliction I/II choices to
Poisonburst Arrow and Gas Arrow. They are context-only for these Poison focuses,
not a recommended Poison loadout, Full DPS calculation or automatic priority.
Essence Drain, Contagion and Vine Arrow retain their earlier intrinsic-DoT
behavior and duration priorities.

## Effects and Boundaries

- Both tiers specify 30% more non-ailment damage over time. Poison is an ailment,
  not intrinsic non-ailment DoT. Neither native Poison magnitude nor hit damage
  gets that bonus; neither focus gains a new generic-DoT suggestion or scope.
- Source penalties are 20%/10% less skill-effect and damaging-ailment duration.
  Shorter Poison is not faster ticks, increased magnitude or a guaranteed DPS
  gain. Poisonburst's linked burst Poison, Gas cloud lifetime, separate outgoing
  Poison and actual-arrow ailments are distinguished below.
- Native parent compatibility passes through Attack even without a
  DamageOverTime type. Four missing-required-type controls reject the links.
  Legal compatibility does not imply a beneficial support for the chosen focus.
- Neither support adds Poison/Bleeding chance. Actual-arrow controls explicitly
  supply Poison III or Bleed III; their applications, contacts and uptime are
  not inferred. No-hit burst/cloud Poison stays no-hit. Gas Fire explosion,
  growth, overlap, Poison feeding and full DPS remain separate.
- Cost per use, attack rate, hit damage, area, chance and stack capacity stay
  unchanged with Swift alone. Prolonged Duration II retains its own cost.
- The per-skill override deliberately has no automatic duration priority. It
  cannot inherit Highest Skill Effect Duration from the existing intrinsic-DoT
  focuses. Manual duration, Poison, DoT and other weights, existing support
  families, goals, starts and budgets remain intact. Selection/removal does not
  rewrite weights or multiply route scores. No parser, routing, point-counting,
  CSS or save-schema change. Shortest mode is unchanged; III remains unreviewed.

## Native Duration Overlap

The shared source maps the one penalty to both Duration and
DamagingAilmentDuration. Native skill-duration calculations combine both names,
giving factors 0.64/0.81 instead of single factors 0.8/0.9. Poisonburst's
poison_duration_is_skill_duration also makes its outgoing Poison combine both.
Gas cloud Poison has a separate base timer and takes only the ailment penalty.
This reproduces the overlap seen in the earlier Vine Arrow checkpoint. Exact
game duration is unverified; the app does not adopt these outputs as game truth.

| Timer | Baseline | Swift I native | Swift II native |
| --- | ---: | ---: | ---: |
| Poisonburst displayed skill timer | 3.003 s | 1.947 s | 2.442 s |
| Poisonburst linked outgoing Poison | 3 s | 1.92 s | 2.43 s |
| Gas cloud lifetime | 4.026 s | 2.574 s | 3.267 s |
| Gas outgoing Poison | 2 s | 1.6 s | 1.8 s |
| Actual-arrow Poison III duration, either skill | 2 s | 1.6 s | 1.8 s |
| Actual-arrow Bleed III duration, either skill | 5 s | 4 s | 4.5 s |

Independent arithmetic: a single 0.8/0.9 factor applied to Poisonburst's
three-second base gives 2.4/2.7 seconds before tick rounding, not 1.92/2.43.
For Gas cloud's four-second base it gives 3.2/3.6 seconds before rounding, not
2.56/3.24. Native skill displays round up to 0.033-second ticks. Single custom
Skill Effect Duration controls reproduce rounded timers 2.409/2.706 (burst)
and 3.201/3.630 (cloud). They affect linked burst Poison but not Gas's separate
outgoing Poison. A custom ailment-only control instead uses EnemyPoisonDuration;
it changes outgoing Poison without changing skill lifetime. This distinction
is not a patch to PoB or proof of an exact game duration rule.

With 100% increased Skill Effect Duration, native factors become 1.28/1.62;
burst Poison becomes 3.84/4.86 seconds while Gas outgoing Poison stays 1.6/1.8.
With Prolonged II, native factors are 0.864/1.098, burst Poison 2.592/3.294,
and cloud lifetime 3.465/4.422 seconds. The underlying combined Duration-more
factor is rounded to percentage precision before combining the ailment name;
for II, 0.9 * 1.35 becomes 1.22 natively, then * 0.9 = 1.098. These are recorded
model outputs, not calculated restoration of lost game uptime.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime completed 45 MAIN calculations: baseline/two
tiers across all five parent components; separate 30%-more DoT control; single
skill/ailment-duration controls; 100% increased Skill Effect Duration; Prolonged
II; and actual-arrow Poison III/Bleed III with both tiers. Four link predicates,
four negative type controls and four without-DoT-type controls pass. Each
calculation checks the active/stat set, equipped Bow and actually applied
supports; enemy Bleeding and Poisoned flags remain false.

Fixture: empty-tree Witch, level-20 skills, normal Crude Bow and sufficient
attributes. Installed PoB/user builds stay untouched. Evidence:
`var/poison-bow-swift-affliction-20261109/`; independent frozen facts/outputs:
`src/tree/poisonBowSwiftAfflictionSupports.fixtures.ts`. Ordinary regressions
need no native installation or network. These are not live-game tests.

| Native Poison output | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Baseline / independent 30%-more non-ailment DoT control | 5.385766215481 | 4.0038541776187 |
| Swift I | 4.9517994298936 | 3.8507366706811 |
| Swift II | 5.1711055644165 | 3.9300035445447 |
| Poison magnitude, all cases | 1 | 1 |
| Mana, baseline / either Swift | 38 | 62 |
| Mana with Prolonged II | 45 | 74 |

Swift adds a native non-ailment Damage-more factor of 1.3, but not Poison
magnitude or stronger source hits. Duration-dependent continuous-application
roll selection changes the displayed native Poison estimates. These are not
Poison tick-speed changes, contact/uptime guarantees or whole-build multipliers.
No complete-lifetime damage estimate or benefit is assigned to route scores.
Separate initial arrow and Fire-explosion hit damage also remain unchanged;
Swift alone gives them no Poison output. Arrow Poison/Bleeding magnitude stays
one in the explicitly enabled ailment controls.

- [Swift I/II definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5403)
- [Shared duration mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L778)
- [Duration calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L1848)
- [Linked ailment duration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L5053)

Moving upstream links are not claimed byte-identical to the isolated runtime.

## Coverage and Next Batch

Reviewed pairs 488 -> 492. Support choices stay 51/567 (9.0%), 51/450
positive-tier (11.3%), with 32 families: these were existing choices. Skills
remain 103/399 (98/234 positive-tier), preferences 184, main-tree wording
864/2182 and occurrences 3444/5451. No catalog refresh or baseline reset.

The proposed successor, Compressed Duration I/II, was subsequently reviewed
for both focuses. See [its checkpoint](build-focus-poison-bow-compressed-duration.md)
for the skill-only duration comparison and next proposed batch. The figures
and verification below remain this batch's historical checkpoint.

## Verification

The initial focused run passed 347 tests with four historical rejection
expectations failing after Swift I became reviewed. The first full-suite run
found eight more instances of that same historical rejection in older support
tests. Those negative controls now reject unreviewed III instead, without
removing the negative check. Targeted compatibility reruns passed 43 and 56
tests. The new mechanic/control cases and existing intrinsic-DoT cases passed.

Final `npm run validate:release` passed 2893 tests across 130 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
60581 ms. The existing main-chunk advisory remains non-blocking (711.40 kB).
No catalog refresh, baseline reset or route-quality audit.

An isolated Edge production-preview smoke check passed all four pairs, source
penalty and unverified-timing notes, tier replacement, removal, prior families
and manual Skill Effect Duration/Poison Duration/DoT weights on selection and
Add suggestions. No inherited intrinsic-DoT priority action appeared. Final
console: zero errors and warnings; the initial unrelated favicon 404 was absent
after reload. Screenshot inspected for a nonblank tree and readable,
non-overlapping controls. User saves were isolated and the browser session closed.
Parameterized DOM/JSON checks cover disabled controls, goals, budget and every
tier's saved settings. Repetitive browser save/reload and Firefox checks were
not repeated: shared layout, browser-specific code and persistence implementation
did not change.

Logs: `var/poison-bow-swift-affliction-20261109/`. Final release log:
`release-validation-final.log`; earlier failure logs are retained separately.
Repeatable smoke script/screenshot: `output/playwright/poison-bow-swift-affliction-20261109/`.
Served HTML matched current dist; actual entry JavaScript returned HTTP 200 as
JavaScript (711405 bytes), not an HTML fallback. Scoped `git diff --check`
passed with only the existing README line-ending advisory.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

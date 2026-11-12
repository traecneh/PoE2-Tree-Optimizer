# Plant Bow Duration and Area Trade-offs

Swift Affliction I/II are now reviewed choices for Vine Arrow's intrinsic
non-ailment Chaos DoT focus. Concentrated Area is reviewed for Toxic Growth's
impact/explosion hit focus. Three pairs are added; this is not a recommended
loadout or a Full DPS integration. Fireball's separate Concentrated Area review
remains on hold.

## Effects and Controls

- Swift Affliction I/II grant 30% more non-ailment DoT. The source specifies
  20%/10% less skill-effect and damaging-ailment duration. Intrinsic vine damage
  and plant uptime are distinct; the initial hit and Poison are not granted that
  non-ailment bonus. Another skill's externally supplied Poison is not modified
  by this link. PoB's plant-duration output has a discrepancy detailed below,
  so the selected note explicitly says exact game lifetime is unverified.
- Swift suggests Highest Skill Effect Duration for plant uptime and fewer
  replacements. This is a heuristic, not calculated compensation, a damage
  multiplier or a claim that the full-duration damage is higher.
- Concentrated Area grants 30% more Area Damage and 50% less area, not 50%
  less radius. Both Toxic Growth hit components gain damage with smaller
  coverage. Overlap, extra contacts, externally supplied Poison, storage,
  growth and accelerated expiry remain unmodeled; its 15-second base detonation
  timer is separate. High Area of Effect is an opt-in coverage preference, not
  a calculated restoration of coverage or a guaranteed DPS improvement.
- Selection updates suggestions and contextual notes, not existing weights.
  Add suggestions preserves manual priorities. Apply support priorities changes
  only the displayed Duration or Area priority. Removal does not undo manually
  adopted preferences. Other support families, goals, budgets and saves survive.
- A narrow typed per-skill priority override supplies plant/impact-specific
  explanations through the existing support resolver. Older Essence Drain,
  Contagion and melee/rain support reasons remain unchanged. No optimizer,
  passive parser, point-counting, CSS or layout implementation changed.

## Eligibility Is Not Focus Admission

The native predicates accept all six cross-combinations of these supports and
the two skills. Three requested combinations are admitted to the app; the others
were cross-focus scope controls, not additions. Toxic Growth can legally link Swift
Affliction through its Attack type, but its reviewed base-hit focus has no
intrinsic non-ailment DoT to improve. Concentrated Area on Vine Arrow shrinks
targeting without improving its reviewed intrinsic DoT. Neither is offered by
tag inference. Swift Affliction III remains unreviewed.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime checked three requested pairs, three cross-focus
controls, six type controls and 26 MAIN calculation cases across Vine Arrow
Impact/Vines and Toxic Growth Pustules/Explosion. Each calculation asserts its
stat-set index, real equipped Bow and applied-support eligibility. An empty-tree
Witch, level-20 skill and normal Crude Bow isolate the modifiers. Installed PoB
and user builds were untouched. Evidence is in
`var/plant-bow-tradeoff-supports-20261109/`.

Independent fixtures in `src/tree/plantBowTradeoffSupports.fixtures.ts` require
no native installation or network during ordinary tests.

Vine DoT changes from 271.3 to 352.69/s for either tier, matching `271.3 * 1.3`.
Impact hit 4.33125, attack rate 1.2, targeting radius 24 and Mana cost 47 are
unchanged. A supported skill's own Poison-duration controls change from 2 to
1.6/1.8 seconds, without a Poison-magnitude increase. Those controls do not model
Poison supplied to the plant by another source.

### Duration Discrepancy

The source maps the shared penalty to both `Duration` and
`DamagingAilmentDuration`. The native skill-duration calculation combines both
names. Swift I/II therefore expose duration modifiers 0.64/0.81 and plant
timers 5.148/6.501 seconds. Applying a single source-stated 0.8/0.9 factor to
the eight-second base and rounding upward to 0.033-second ticks instead gives
6.402/7.227 seconds. Separate custom-mod controls reproduce those single-penalty
outputs. Both local source inspection and current upstream code show the
overlapping mapping/calculation; this is a suspected PoB double-application
issue, not verified game behavior.

With 100% increased duration, native Swift II reports 12.969 seconds. With
Prolonged II it reports duration modifier 1.10 and 8.811 seconds; native modifier
precision and tick rounding also matter. These are recorded observations, not
adopted plant-lifetime predictions. No runtime files were patched and no whole-
lifetime damage estimate or route score is derived from either interpretation.

### Area and Hit Checks

For each Toxic Growth component, radius 8 becomes 5 with Concentrated:
`floor(8 * sqrt(.5)) = 5`. Adding 100% increased area restores radius 8; adding
Magnified II instead gives `floor(8 * sqrt(1.45 * .5)) = 6`, still below baseline.
Increased and more/less area are not merged additively or treated as radius.

The native hit changes from 1.3125 to 1.575. Do not force that small, rounded,
mitigated Bow output to have an exact 1.3 ratio; the source modifier is applied
before those calculations. Mana cost stays 98 and attack rate stays 1.2.
Outgoing Poison DPS changes from 1.2077199486588 to 1.4308855913457, while its
duration stays two seconds and detonation stays fifteen seconds. This is not a
bonus to externally supplied Poison. Combined Concentrated + Magnified II +
Efficiency II costs 77 Mana. No extra damage/contact or storage multiplier is
assigned to passive scores.

- [Swift Affliction definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5403)
- [Concentrated Area definition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2069)
- [Shared duration mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L778)
- [Native duration calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L1932)

Moving upstream links are not claimed byte-identical to the isolated snapshot.
Exact game lifetime remains unverified; native outputs are not full live-game
simulation.

## Coverage and Next Batch

Reviewed support pairs increase from 435 to 438. The catalog remains 101/399
skill presets, 96/234 positive-tier skills, 38 support choices, 24 families and
184 passive preferences. Passive coverage stays 864/2182 distinct wordings and
3444/5451 main-tree occurrences. No coverage baseline reset.

Next proposed batch: add Poisonburst Arrow and Gas Arrow as reviewed bow focuses,
separating hit damage, outgoing Poison and gas-cloud behavior. Both are present
in the frozen catalog but absent from the current preset list. A skill focus
must not automatically establish a working Poison-feed setup for Plant skills.
This is a proposal only, not authorization for another batch or deployment.
The subsequent authorized [Poison bow batch](build-focus-poison-bow-skills.md)
is documented separately; counts above preserve this support checkpoint.

## Verification

The initial focused check passed 263 tests with two UI-label expectation failures.
The expectations now use the existing Skill Effect Duration label; all 112 UI
tests passed on rerun. One `npm run validate:release` passed 2679 tests across
117 files, typecheck, production build, graph validation and the unchanged
coverage baseline in 124444 ms. The existing large-chunk advisory remains
non-blocking (main 682.89 kB). No baseline reset or route-quality audit was done.

A targeted isolated Edge production-preview smoke passed both admission lists
(13/9 choices), Swift tier replacement, trade-off notes, preservation of manual
weights through selection/Add suggestions, explicit target-only priority apply,
removal without undoing adopted preferences and saved-build load/reload. Other
support families, manual Poison preferences, goal, class start and budget were
preserved. Completion console: zero errors and warnings. The screenshot was
visually checked for a nonblank tree and layout overlap. The initial favicon
404 was unrelated and absent after reload. The profile was isolated from user
saves and the test session was closed. No layout or browser-specific code
changed; the previous Firefox checkpoint was not rerun for this extension.

Logs are under `var/plant-bow-tradeoff-supports-20261109/`; the repeatable browser
script and screenshot are under `output/playwright/plant-bow-tradeoff-supports-20261109/`.
Local preview remains `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

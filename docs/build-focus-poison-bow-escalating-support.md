# Escalating Poison for Poison Bow Focuses

Escalating Poison is now reviewed for Poisonburst Arrow's Poison burst and
Gas Arrow's Poison cloud. One support choice/family and two reviewed pairs.
These are scoped heuristic notes, not a recommended loadout or Full DPS engine.

## Behavior and Boundaries

- The source supplies one additional Poison stack and 20% less outgoing Poison
  duration. Capacity is not guaranteed sustained stacks, Poison Magnitude,
  faster damage, increased application rate or a fixed damage multiplier.
- Native PoB raises the reviewed components' cap from one to two. Poisonburst's
  base Poison falls from 3 to 2.4 seconds; its linked timer still responds to
  Skill Effect Duration. Gas cloud Poison falls from 2 to 1.6 seconds, not the
  four-second cloud lifetime. Skill Effect Duration/Prolonged Duration extend
  that cloud, not its outgoing Poison. Poison Duration affects both Poisons.
- Both parent skills pass the native compatibility predicate. Removing Attack,
  Damage and CrossbowAmmoSkill types rejects the link. Source descriptions
  mention hitting, while both Poison components explicitly poison without a
  hit and use fake attack-hit calculation fields. Native PoB models the support
  in those components; that is not proof of complete live-game application,
  real burst/cloud hits, crit behavior or stack sustain. Poisonburst's initial
  arrow still needs to hit. Gas growth, overlap, cloud limits and conditional
  Fire detonation remain outside the model.
- Firing rate, direct-hit damage, area, magnitude and per-use cost are unchanged
  by this support alone. Other links retain separate effects and costs.
- Selection, Add suggestions and removal preserve manual weights. No support
  priority changes are proposed. Existing goals, budgets, starts, allocation,
  other support families, passive scopes and exclusions survive. No parser,
  optimizer, point-accounting, CSS or save-schema changes; shortest is unchanged.

## Source and Independent Checks

The isolated PoB 0.23.1 runtime performed 32 MAIN calculations: baseline and
support on all five components, plus eleven controls per Poison component.
Controls separate duration-only, stack-only and synthetic combined modifiers;
slow firing with/without the support; increased Poison/Skill Effect Duration;
Prolonged Duration II; Deadly Poison II; Rapid Attacks II; and combined
Prolonged/Deadly/Efficiency links. Every calculation asserts the requested stat
set, actual equipped Bow and actual applied supports. Two native type-removal
controls reject the link.

Empty-tree Witch, level-20 skills and a normal Crude Bow isolate effects.
Installed PoB and user builds are untouched. Evidence lives under
`var/poison-bow-escalating-support-20261109/`; independent frozen observations
are `src/tree/poisonBowEscalatingSupport.fixtures.ts`. Ordinary tests require
no native PoB or network. Source/type/native observations are not game testing.

| Native output | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Base -> supported Poison duration | 3 -> 2.4 s | 2 -> 1.6 s |
| Base -> supported cap | 1 -> 2 | 1 -> 2 |
| Unchanged displayed skill duration | 3.003 s | 4.026 s |
| Unchanged Mana cost / firing rate | 38 / 1.2 per s | 62 / 1.2 per s |
| Base -> supported Poison output per s | 5.385766215481 -> 9.2211585994231 | 4.0038541776187 -> 6.6528 |
| Stack-only control Poison per s | 9.6044940572613 | 7.1685311382763 |
| Duration-only control Poison per s | 5.1590290971264 | 3.8507366706811 |
| Supported stack potential | 1.44 | 0.96 |
| Slow firing: base -> supported Poison per s | 3.0996 -> 2.47968 | 1.6632 -> 1.33056 |
| Slow firing: supported stack potential | 0.288 | 0.192 |

The synthetic combined control exactly reproduces the linked support. Native
Poison output sums its estimated active stacks, not just one Poison. Even
under PoB's continuous-application assumption, Gas's potential is below one
(1.92 estimated active Poisons divided by a cap of two). This calculation
uses deployment/attack speed; actual cloud-contact cadence is not verified.

Independent checks use `duration * applicationRate / cap` for the native
potential and `min(duration * applicationRate, cap)` for estimated active
stacks. The native roll-selection estimate also changes with this ratio. At
the synthetic 0.24/s slow rate, both remain below the cap before and after
linking, with the same 50% average roll; shorter duration reduces estimated
output by 20% despite the extra capacity. This is not a universal performance
claim, but demonstrates why neither `2x` nor `2 * .8` is a safe damage bonus.

With +100% Poison Duration, supported durations become 4.8/3.2 seconds without
changing displayed skill timers. With +100% Skill Effect Duration, they are
4.8/1.6 seconds: Gas's cloud extends independently. With Prolonged II they are
3.24/1.6 seconds. Rapid II changes deployment to 1.5/s, not magnitude or the
duration penalty. Deadly II changes magnitude to 2 with its separate hit penalty;
it does not add another stack. Combined Prolonged/Deadly/Efficiency costs 27/45,
using the native intermediate multiplier floor then less-cost ceiling. None of
these PoB estimates multiply the app's passive scores.

- [Escalating Poison source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2165)
- [Native ailment calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)
- [Skill components](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua)

Moving upstream references are not claimed byte-identical to the local snapshot.

## Coverage and Next Batch

Reviewed pairs 468 -> 470; choices 41 -> 42; families 26 -> 27. Skills stay
103/399 (98/234 positive-tier); supports become 42/567 (42/450 positive-tier).
Preferences remain 184, main-tree wording 864/2182 and occurrences 3444/5451.
No source refresh or baseline reset.

The subsequent authorized [Bursting Plague review](build-focus-poison-bow-bursting-plague.md)
is recorded separately. Counts and checks here describe this historical
Escalating checkpoint; further batches or deployment require approval.

## Verification

Focused regressions passed 314 tests across nine files. One
`npm run validate:release` passed 2788 tests across 124 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
87084 ms. The existing large-chunk advisory remains non-blocking (main
700.45 kB); no catalog refresh, baseline reset or route-quality audit.

An isolated Edge production-preview check passed both focuses, explicit
capacity/duration notes, no sustained-stack promise, selection/removal,
other support families, manual-priority preservation on selection/Add
suggestions, goals, class start, budget and saved-build load/reload.
Completion console: zero errors and warnings. The initial unrelated favicon
404 was absent after reload. The screenshot was visually checked for a
nonblank tree and readable, non-overlapping controls. User saves were isolated
and the test session closed. No CSS or browser-specific code changed; the
existing Firefox checkpoint was not repeated for this metadata extension.

Logs: `var/poison-bow-escalating-support-20261109/`. Repeatable browser script
and screenshot: `output/playwright/poison-bow-escalating-support-20261109/`.
The local production preview returned HTTP 200 and matched the current dist:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. No commit, push or live deployment.

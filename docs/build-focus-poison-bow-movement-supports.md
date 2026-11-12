# Mobility and Deliberation for Poison Bow Focuses

Reviewed for Poisonburst Arrow's Poison burst and Gas Arrow's Poison cloud.
Four new reviewed pairs; Deliberation is a new support choice/family. These
are optional context notes, not an automatic loadout or Full DPS calculation.

## Behavior

- Mobility supplies 25% less movement-speed penalty during firing, not 25%
  increased global Movement Speed, 25 percentage points of retained speed,
  Attack Speed or Poison-source damage.
- Deliberation supplies 20% more Damage and 30% more firing movement penalty,
  not 30% less global Movement Speed. Its generic damage modifier increases
  the native derived Poison source, not the Poison Magnitude modifier. The
  separate actual arrow/conditional explosion hits also gain damage; no real
  burst/cloud hit or critical-hit scope is invented.
- Both require UsableWhileMoving. They belong to different families and can
  coexist. Deliberation is admitted only for these two reviewed focuses, not
  every moving skill. Older Mobility explanations remain unchanged.
- Neither changes firing rate, per-use cost, area, Poison duration, magnitude,
  chance or stack limit. Poisonburst's arrow still needs to hit. Gas cloud
  lifetime, outgoing Poison duration, growth and conditional Fire detonation
  stay separate. Movement ramping, application uptime and whole-build DPS
  are not modeled.
- Selection/removal does not change weights, suggestions, scopes or exclusions.
  Global Movement Speed and Skill Movement Penalty Reduction remain separate
  opt-in preferences. No automatic compensation, damage score multiplier,
  parser change, save migration or optimizer/point-accounting change.

## Sources and Native Check

An isolated PoB 0.23.1 run performed 32 MAIN calculations: baseline, each
support and both together on all five components, plus global Movement Speed,
damage-only, reduced-penalty and combined Deadly Poison II/Efficiency II
controls for both Poison components. Four type-removal controls reject the
supports without UsableWhileMoving. Each calculation asserts the requested
stat set, equipped Bow and actual applied support IDs.

The fixture is an empty-tree Witch, level-20 skills, normal Crude Bow and
attributes sufficient for equipment. Installed PoB and user builds are not
modified. Local evidence: `var/poison-bow-movement-supports-20261109/`.
Frozen independent observations: `src/tree/poisonBowMovementSupports.fixtures.ts`.
Ordinary regressions need no native installation or network.

| Minimum retained normal movement in native PoB | Both skills |
| --- | ---: |
| Baseline | 30% |
| Mobility | 47.5% |
| Deliberation | 9% |
| Both | 31.4% |
| 20% reduced firing penalty | 44% |
| Deliberation + 20% reduced firing penalty | 27.2% |

Independent source arithmetic is `1 - (1 - .3) * (1 + inc/100) * more`.
More/less penalty factors multiply: `.75 * 1.3 = .975`, not additive 1.05.
Unrounded arithmetic would retain 31.75%. This PoB snapshot's
`Classes/ModList.lua:MoreInternal` rounds the combined multiplier to .98,
giving 31.4%. That implementation detail is not claimed as verified live-game
rounding. Global +20% Movement Speed changes the global multiplier to 1.2
without changing retained percentages: baseline final modifier .36; both
supports .3768. Absolute game movement and ramping are not simulated here.

| Native Poison-component output | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Baseline / Mobility Poison per second | 5.385766215481 | 4.0038541776187 |
| Deliberation / both / damage-only control | 6.5035667507695 | 4.8308797946351 |
| Both + Deadly Poison II + Efficiency II | 9.1049934510772 | 6.4849310286677 |
| Baseline / either / both Mana cost | 38 | 62 |
| Combined-link Mana cost | 23 | 38 |
| Displayed skill duration | 3.003 s | 4.026 s |
| Outgoing Poison duration | 3 s | 2 s |

Global speed and penalty-reduction-only controls leave Poison unchanged;
Deliberation matches the independent 20% more Damage control. Low Bow damage
rounding prevents an exact final 1.2 output ratio. Native hit fields for the
Poison components are source-calculation proxies, not actual burst/cloud hits.
Magnitude stays 1 except with Deadly II (2); deployment stays 1.2/s and maximum
Poison stacks stay 1. Efficiency II alone accounts for the combined cost change.

- [Mobility source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3066)
- [Deliberation source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1872)
- [Movement calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving upstream references are not claimed byte-identical to the local runtime.
Source/native observations do not establish complete live-game performance.

## Coverage and Next Batch

Reviewed pairs 464 -> 468, choices 40 -> 41, families 25 -> 26. Skills remain
103/399 (98/234 positive-tier); supports 41/567 (41/450 positive-tier).
Preferences remain 184, main-tree wording 864/2182 and occurrences 3444/5451.
No catalog refresh or baseline reset.

The subsequent authorized [Escalating Poison review](build-focus-poison-bow-escalating-support.md)
is recorded separately. The counts and checks here describe the historical
movement-support checkpoint; further batches or deployment require approval.

## Verification

Focused regressions passed 296 tests across eight files. One
`npm run validate:release` passed 2770 tests across 123 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
88438 ms. The existing large-chunk advisory remains non-blocking (main
698.69 kB); no source refresh, baseline reset or route-quality audit.

An isolated Edge production-preview smoke passed both focuses, distinct
movement/source notes, simultaneous selection, independent removal, prior
families, manual-priority preservation on selection/Add suggestions, goals,
class start, point budget and saved-build load/reload. Completion console:
zero errors and warnings. The initial unrelated favicon 404 was absent after
reload. The screenshot was visually checked for a nonblank tree and readable,
non-overlapping controls. User saves were isolated and the test session closed.
No CSS or browser-specific code changed; the existing Firefox checkpoint was
not repeated for this allowlist/metadata extension.

Logs: `var/poison-bow-movement-supports-20261109/`. Repeatable browser script
and screenshot: `output/playwright/poison-bow-movement-supports-20261109/`.
The local production preview returned HTTP 200 and matched the current dist:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. No commit, push or live deployment.

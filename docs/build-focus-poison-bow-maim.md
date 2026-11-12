# Maim for Poison Bow Focuses

One optional choice, one family and two reviewed pairs: Poisonburst Arrow and
Gas Arrow. Enemy movement/rating utility, not direct Poison scaling. Local only.

## Application and Effects

- The generated support is Maim, not Maim I/II. Native compatibility admits
  both attack parents and rejects controls with their qualifying attack/ammo
  types removed. The source has 100% Maim-on-hit chance and no added Mana cost
  multiplier. That chance requires an eligible successful hit; it does not
  guarantee contact, bypass immunity or establish debuff duration/uptime.
- Initial arrows can apply Maim. Poisonburst's no-hit burst/linked Poison and
  Gas's no-hit cloud/Poison cannot. A separately triggered Gas Fire explosion
  can hit, but ignition/detonation and contact are not provided by this support.
- The reviewed runtime defines Maim as 30% reduced Movement Speed and 15%
  reduced Evasion on the affected enemy. These are additive increases/reductions,
  not less multipliers. With no other modifiers the factors are 0.7/0.85; with
  +100% to each, they are 1.7/1.85, not 1.4/1.7.
- Enemy ratings are not player Evasion or Movement Speed. Movement slowing is
  not attack/cast/action-speed slowing, outgoing damage, incoming damage
  reduction or increased Physical damage taken. No legacy Maim damage stats
  are attached to this source. No chase time, boss benefit, contacts, effect
  duration, immunity result or sustained Maim uptime is assumed.
- Manual priorities, other links and previous Blindside prohibitions are
  preserved. No new automatic preference, passive scope, parser/solver change,
  point-count change or save schema. Shortest mode stays unchanged. In particular,
  this support does not turn the no-hit Poison focus into attack-Maim scoring.

## Native Coverage Boundary

The isolated PoB 0.23.1 runtime adds the AppliesMaim skill type when linked, but
does not map `maim_on_hit_%` into an application calculation. Linking it leaves
the actual enemy Maim condition off and calculation outputs unchanged. This is
incomplete application coverage, not proof of no game effect. The config toggle
explicitly enables the enemy condition and computes the reductions even without
the support. It is a separately supplied state, not evidence of real hit events.

An accuracy-restricted fixture shows enemy Evasion 996 -> 846.6, displayed hit
chance 86 -> 90%, and native effective crit chance 4.3 -> 4.5% under that explicit
state. Physical/Fire source averages, Poison magnitude, chance, stack cap, timers,
area, skill speed and costs do not gain a direct Maim modifier. Native averaged
hit and Poison estimates do move with hit/crit assumptions, including synthetic
no-hit source fields. These are not actual burst/cloud hits or crits, or a
universal Poison multiplier. The app does not convert them into routing weights.

## Evidence and Independent Checks

32 isolated MAIN calculations: empty-tree Witch, level-20 skills, normal Crude
Bow and sufficient attributes. Boss mode None, enemy Poisoned/Bleeding false,
player Maim false. The active/stat set, actual equipped Bow, effective mode,
applied links and actual enemy condition are asserted. Installed PoB and user
builds are untouched; runtime code is not patched.

- 20 baseline/Maim rows across all five components with enemy Maim off/on.
- Eight actual-arrow Poison III rows, baseline/Maim with enemy Maim off/on.
- Four independently configured +100% enemy Evasion/Movement Speed controls.
- Two compatible links and two missing-attack-type rejection controls.

The all-row verifier checks same-state linked/baseline output equality and
additive arithmetic. The +100% controls yield enemy Evasion 1992 -> 1842.6 and
movement factor 2 -> 1.7. Evasion's MORE factor stays one; player's Evasion
stays 1007 and movement INC zero. Physical-damage-taken INC stays zero.

| Poison estimate / timer | Explicit Maim off | Explicit Maim on |
| --- | ---: | ---: |
| Poisonburst source Poison/s estimate | 5.1407527211226 | 5.209577111068 |
| Gas source Poison/s estimate | 3.8503496414138 | 3.8936968711447 |
| Actual-arrow Poison III, Poisonburst | 4.4181304728428 | 4.4602514354125 |
| Actual-arrow Poison III, Gas | 1.4965946562522 | 1.5083759399759 |
| Burst Poison / skill timer, seconds | 3 / 3.003 | Same |
| Gas Poison / cloud timer, seconds | 2 / 4.026 | Same |

Maim and same-state baseline are identical throughout. Poison magnitude is one,
stack cap one, inherent source chance 100%, actual-arrow Poison III chance 60%
with its separate two-second duration. Base Mana costs remain 38/62; with
Poison III they remain 45/74. Native estimates are not measured in-game DPS.

Evidence: `var/poison-bow-maim-20261109/` (driver, native JSON, verifier/logs).
Independent ordinary-test facts: `src/tree/poisonBowMaimSupport.fixtures.ts`.
Tests do not require native PoB or network. Startup missing-node notices are
retained and do not affect the empty-tree fixture. Source/native verification
does not verify in-game movement, contact, immunity or debuff uptime.

- [Generated Maim support](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2978)
- [Maim reductions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcSetup.lua#L68)
- [Explicit enemy condition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua#L1734)

Moving upstream links are not claimed byte-identical to the frozen runtime.

## Coverage and Next Batch

Pairs 510 -> 512, choices 60 -> 61, families 37 -> 38. Each Poison focus has
37 choices. Supports are 61/567 (10.8%), or 61/450 positive-tier (13.6%). Skills
remain 103/399 (98/234 positive-tier), preferences 184, main-tree wording
864/2182 and occurrences 3444/5451. No catalog refresh or baseline reset.

The proposed successor is now covered in the [Malady checkpoint](build-focus-poison-bow-malady.md).
Counts and verification remain the historical Maim checkpoint.

## Verification

Native 32-row verification passed. Focused regressions initially passed 191 tests
across four files; the final release also includes the subsequent exact passive
wording assertions. One `npm run validate:release` passed 3009 tests across 136
files, typecheck, production build, graph validation and the unchanged coverage
baseline in 59096 ms. Existing main-chunk advisory remains non-blocking (724.68 kB).

An isolated Edge production-preview smoke passed both focuses: 37 choices each,
Maim selection/removal, application/ownership/explicit-state notes, other links,
preserved Blindside prohibitions, no automatic support-priority action and
unchanged manual Maim/Slow/Poison/Evasion weights on selection/Add suggestions.
Final console: zero errors/warnings and no page errors. An initial unrelated
favicon 404 was absent after reload. Screenshot inspected: nonblank tree and
readable notes/controls with no overlapping text. User saves were isolated and
the browser session closed. DOM/JSON tests cover disabled controls, class, goals,
budgets and saved settings. No repeated browser persistence/Firefox matrix:
layout, persistence and browser-specific implementations did not change.

Logs: `var/poison-bow-maim-20261109/`. Smoke script and inspected screenshot:
`output/playwright/poison-bow-maim-20261109/`. Served HTML and actual entry JS
matched current dist. Entry returned HTTP 200 as JavaScript (724680 bytes), not
HTML fallback. Scoped `git diff --check` passed with only the existing README
line-ending advisory. No catalog refresh, baseline reset, route audit, commit,
push or deployment. Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

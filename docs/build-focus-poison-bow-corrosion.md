# Corrosion for Poison Bow Focuses

One optional choice, one family and two reviewed pairs for Poisonburst Arrow
and Gas Arrow. Context-only notes, not an Armour Break simulation, Full DPS
multiplier or automatic priority change.

## Behavior and Boundaries

- Source effect: supported Poison also Breaks Armour based on 80% of Poison
  damage. This is not 80% more Poison DPS, 80% increased Armour Break or an
  immediate removal of 80% of the target's Armour. Break amount, delivery,
  enemy Armour, caps, consumption and uptime are not calculated by the app.
- Both parents pass PoB's compatibility predicate through their Attack type.
  Adding ConsumesFullyBrokenArmour rejects the link, as does removing every
  accepted parent type. This parent-level compatibility does not turn burst or
  cloud Poison into a hit. The source effect refers to supported Poison; native
  runtime gaps must not be used to claim the no-hit effect is zero in game.
- Corrosion grants no Poison chance. Initial-arrow Poison still needs a source
  of chance and an eligible hit. The separate Fire explosion does not gain
  Poison eligibility. Poisonburst's linked Poison duration, Gas cloud lifetime,
  outgoing Poison duration and Armour Break duration remain separate.
- No automatic Fully Broken Armour, below-zero Armour, enemy Bleeding/Poisoned,
  or Corrosion-stack configuration. The separately gated native Corrosion-stack
  Armour/Evasion debuff is not treated as this support's break formula.
- A 10-point Mana multiplier increases cost (110% factor). Full sustain,
  contact frequency, kill/refresh cycles and time to Fully Broken are unmodeled.
- Corrosion is separate from Poison, Bleed and Admixture families. Selection,
  removal and tier replacement retain existing links, manual priorities, goals,
  class start and point budget. No new passive scopes or automatic Armour Break
  suggestions; existing manual weights remain usable and are not rewritten.
  No parser, routing, point-counting, CSS or persistence-schema changes;
  Shortest mode is unchanged. Other skill pairs are not auto-admitted.

## Native Effect Coverage

The isolated PoB 0.23.1 runtime applies Corrosion and its Mana multiplier but
does not calculate its Poison-derived Armour Break amount/timing in the reviewed
fixtures. ArmourBreakPerHit is zero, CanArmourBreak/CanCorrode flags stay false,
enemy Armour stays 8063 and Fully Broken remains false. These are not claims
that the game effect is zero. The same stat ID appears in Poisonburst Arrow's
own Arrow stat-map/alternate-quality data; that does not establish a functioning
Corrosion amount/timing calculation in these linked fixtures.

Adding a separately recognized 100% increased Armour Break modifier still gives
zero native break output; doubling Poison magnitude or duration changes Poison
as expected but does not produce a native break amount. No artificial enemy
Armour reduction is configured to hide the missing calculation. The app exposes
the boundary in the support note and gives no speculative score bonus.

## Native and Independent Checks

34 MAIN calculations: baseline/Corrosion across all five parent components;
actual-arrow Poison III with/without Corrosion; Efficiency II; paired independent
Poison magnitude and duration modifiers; increased Armour Break; and the
Bleed III/Admixture/Poison III combination with and without explicit Bleeding
and Poisoned flags. Both native links pass, plus four negative type controls.
Every calculation asserts active/stat set, equipped Bow, actually applied
support IDs and enemy flags, including no assumed Fully Broken Armour.

Fixture: empty-tree Witch, level-20 skills, normal Crude Bow, sufficient
attributes. Installed PoB/user builds stay untouched. Evidence:
`var/poison-bow-corrosion-20261109/`; independent identities/observations:
`src/tree/poisonBowCorrosionSupport.fixtures.ts`. Ordinary regressions need no
native PoB or network. Source/native checks are not in-game validation.

| Native observation | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Poison/s, baseline and Corrosion | 5.385766215481 | 4.0038541776187 |
| Baseline -> Corrosion Mana | 38 -> 41 | 62 -> 68 |
| Corrosion + Efficiency II Mana | 25 | 41 |
| Unchanged Poison duration | 3 s | 2 s |
| Unchanged displayed skill duration | 3.003 s | 4.026 s |
| 100% increased Poison magnitude, with/without Corrosion | 10.771532430962 | 8.0077083552375 |
| 100% increased Poison duration, with/without Corrosion, Poison/s | 6.2566550491228 | 4.578903015544 |
| Doubled Poison duration | 6 s | 4 s |
| Trio without enemy conditions, with/without Corrosion, Poison/s | 5.385766215481 | 4.0038541776187 |
| Trio with both explicit conditions, with/without Corrosion, Poison/s | 7.7555033502926 | 5.765550015771 |
| Trio -> Trio + Corrosion Mana | 54 -> 60 | 89 -> 98 |

Separate actual-arrow Poison III output remains 4.5657724526838 /
1.5383141032889 with Corrosion and still needs the supplied 60% chance. Mana
changes from 45 -> 50 / 74 -> 81. Without Poison III, Corrosion alone leaves
arrow chance zero and supplies no arrow Poison output. The Fire explosion's
11.025 hit remains unchanged with no Poison output in the reviewed fixture.
Synthetic burst/cloud source hits are not additional real hits or extra DPS.

Independent arithmetic checks confirm that 100 units of eligible Poison damage
correspond to 80 nominal units of Armour Break before caps, not 80 bonus DPS.
This is a unit check, not an app simulation or guarantee that all that damage
occurs. Costs multiply before rounding: `floor(baseCost * 1.1)`, Poison III
`floor(baseCost * 1.2 * 1.1)`, trio
`floor(baseCost * 1.2 * 1.2 * 1.1)`, then Efficiency II
`ceil(multipliedCost * .6)`. Multiplying already-rounded costs is incorrect.
The conditional trio Poison factor remains `1.2 * 1.2`, not multiplied again
by Corrosion. Native roll/application estimates are not proof of uptime.

- [Corrosion source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1498)
- [Stat wording](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/StatDescriptions/gem_stat_descriptions.lua)
- [Parent source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua)

Moving upstream references are not claimed byte-identical to the isolated runtime.

## Coverage and Next Batch

Reviewed pairs 486 -> 488; support choices 50 -> 51; families 31 -> 32.
Supports are 51/567 (9.0%), or 51/450 positive-tier (11.3%). Skills remain
103/399 (98/234 positive-tier), preferences 184, main-tree wording 864/2182
and occurrences 3444/5451. No catalog refresh or baseline reset.

The proposed successor, Swift Affliction I/II, was subsequently reviewed for
both focuses. See [its checkpoint](build-focus-poison-bow-swift-affliction.md)
for non-ailment/Poison scope, native duration overlap and the next proposed batch.
The figures and verification below remain this batch's historical checkpoint.

## Verification

Focused regressions passed 316 tests across eight files. One
`npm run validate:release` passed 2872 tests across 129 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
65529 ms. The existing main-chunk advisory remains non-blocking (710.14 kB).
No catalog refresh, baseline reset or route-quality audit.

An isolated Edge production-preview smoke check passed both choices, amount/
compatibility/coverage notes, removal and retention of Poison III, Bleed III
and Admixture, with no automatic priority action. Final console: zero errors
and warnings; the initial unrelated favicon 404 was absent after reload.
Screenshot inspected for a nonblank tree and readable, non-overlapping controls.
User saves were isolated and the browser session closed. Parameterized DOM/JSON
tests cover manual priorities, family retention, removal, disabled controls,
goals and saved settings. Repetitive browser save/reload and Firefox checks were
not rerun: shared layout, browser-specific code and persistence implementation
did not change.

Logs: `var/poison-bow-corrosion-20261109/`. Repeatable smoke script and screenshot:
`output/playwright/poison-bow-corrosion-20261109/`. Served HTML matched current
dist; actual entry JavaScript returned HTTP 200 as JavaScript (710140 bytes),
not an HTML fallback. Scoped `git diff --check` passed with only the existing
README line-ending advisory.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

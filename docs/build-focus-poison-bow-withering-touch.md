# Poison Bow Withering Touch Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB 0.23.1,
tree 0.5.5f; moving upstream source was also checked. Scope: Poisonburst Arrow
and Gas Arrow, not every legal skill. This is support context, not Full DPS.

## Source and Application

`SupportWitheringTouchPlayer`, family `WitheringTouch`, is a positive tier-one
catalog entry. Generated data requires Damage, Attack or Crossbow Ammo, adds
Duration, and has no added Mana multiplier. Both parent skills pass native
compatibility even without the Chaos tag. Compatibility is not application.

- 25% less Damage, including the reviewed weapon-derived Poison source.
- Four-second base Wither duration.
- 175% chance per full enemy Ailment Threshold dealt as Chaos hit damage.
  For example, Chaos hit damage equal to 1% of threshold corresponds to 1.75%
  chance before any other applicable changes, not a flat 175% chance per hit.
- Generated text explicitly allows chance to surpass 100%. No one-stack-per-hit
  cap or stack-arrival model is invented here.
- The support does not supply Chaos damage, Poison chance, or detonation.

An actual arrow hit needs another Chaos damage source, such as Chaos Attunement.
Gas's conditional explosion can qualify if it gains Chaos; Fire-only damage
cannot. Burst/cloud Poison does not hit and cannot apply on-hit Wither. Native
source-hit fields do not change that fact. Poison itself deals Chaos, so existing
Wither can benefit Poison whose eligible source damage was Physical.

The frozen `SkillStatMap.lua:2909-2913` maps chance and rollover stats only to
`Condition:CanWither`. It does not calculate the actual chance from Chaos hit
damage/enemy threshold. `support_withered_base_duration_ms` has no calculation
mapping. `CalcPerform.lua:707-710,2507-2509` installs 5% increased enemy Chaos
damage taken per configured stack, capped at ten. The flag on a Physical-only
skill is not proof of successful application, four-second uptime or ten stacks.
No automatic counter/default is used: native jobs explicitly configure zero,
one, ten or twenty stacks. Nonzero counters are hypothetical/external scenarios.

## Bounded Native Checks and Independent Calculations

46 MAIN calculations, empty level-90 Witch, level-20/quality-zero skill, normal
Crude Bow (6-9 Physical), sufficient attributes, enemy distance 20 and boss None.
Enemy Bleeding and Poisoned are false. Installed PoB and user builds untouched.

| Zero configured Wither: base -> supported | Poisonburst burst source | Gas cloud source |
| --- | ---: | ---: |
| Native Poison/s | 5.385766 -> 3.902140 | 4.003854 -> 3.019300 |
| Mana | 38 -> 38 | 62 -> 62 |
| Mana with Efficiency II | 23 -> 23 | 38 -> 38 |
| Mana with Poison III | 45 -> 45 | 74 -> 74 |
| With Chaos Attunement, Poison/s | 3.902140 -> 3.018061 | 3.019300 -> 2.192274 |
| With Chaos Attunement, Mana | 45 -> 45 | 74 -> 74 |

Arrow average hits fall 5.38125 -> 3.9375 and 1.8375 -> 1.3125; Gas's conditional
Fire explosion falls 22.05 -> 16.8. At zero stacks all ten separate `25% less
Damage` scalar controls exactly reproduce support output, with and without
Chaos Attunement. Support presence and modifier values are asserted natively.

Independent verification reconstructs all rounded Physical/Fire/Chaos ranges
from weapon damage and component coefficients, once-only Poison source ratios,
costs and hit-channel sums. With Attunement, explicit one-stack Gas hit scenarios
increase only the Chaos hit channel by 5%, not the Physical/Fire channels.

Explicit 1/10/20-stack Poison/s scenarios: Poisonburst 4.097247 / 5.853210 /
5.853210; Gas 3.170265 / 4.528950 / 4.528950. In this otherwise clean fixture,
these independently equal the zero-stack supported value times 1.05/1.50/1.50.
This is increased damage taken, not a universal more-damage multiplier in builds
with other taken modifiers. Even a favorable ten-stack scenario does not
establish actual application or net value over a fight.

Poison chance, duration, magnitude, maximum stacks, source rolls, speed, Accuracy,
critical chance, radii and burst/cloud timers stay unchanged within each tested
context. Four-second base Wither is not Poison duration or cloud lifetime. No
Wither probability, contact rate, maintained stack count or total DPS is inferred.

Ignored evidence: `var/poison-bow-withering-touch-20261109/` contains driver,
native results, independent verifier and logs. Ordinary regression fixtures are
separate from production data and require no PoB or network.

- [Generated support](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8730)
- [Application flag mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L2909)
- [Explicit Wither calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua#L707)

## Implementation and Coverage

One unique choice, two reviewed pairs. Selection/removal, deduplication and saved
export reuse existing code. Manual priorities, suggestions, scopes, scores and
shortest routing are unchanged. Withering Touch does not replace the base
no-added-Chaos caution or Chaos Attunement's mixed-source caution. Existing
Malady/Blindside, distance and Exploit Weakness/Corrosion warnings are retained.
No new controls, preference categories, parser rules or runtime integration.

73/567 raw support choices (12.9%); 72/450 positive-tier (16.0%); 46 families,
538 pairs; 50 choices per Poison bow focus. Skills remain 103/399 (98/234
positive-tier), preferences 184, recognized wording 864/2182 and occurrences
3444/5451. These are scoped review/heuristic counts, not overall completion.
No catalog refresh, baseline reset or routing audit.

## Validation

Independent native verifier passed all 46 rows, ten scalar controls and explicit
stack-cap scenarios. Focused regressions passed 287 tests across four files.
`npm run validate:release` passed: 3,188 tests in 146 files, typecheck, production
build, graph validation and coverage baseline; 82.591 seconds. The existing
large-chunk advisory remains nonblocking.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke checks passed both 50-choice lists, support
selection/removal, eligibility/penalty/Wither/cost notes, unchanged priorities,
base/mixed-source cautions and earlier support warnings. Screenshot inspection
confirms readable notes and a rendered tree without overlap. After reload the
console had zero errors/warnings and no page errors; initial launch had only
the existing preview `/favicon.ico` 404, retained separately.

Evidence: `output/playwright/poison-bow-withering-touch-20261109/`. These are
source/native/local runtime checks, not in-game testing or user acceptance.
Nothing committed, pushed or deployed.

## Next Proposed Batch

The subsequent [Pierce I/II/III review](build-focus-poison-bow-pierce.md) checks
compatibility, arrow delivery and conditional post-pierce penalties separately
from no-hit Poison, without assuming extra contacts.

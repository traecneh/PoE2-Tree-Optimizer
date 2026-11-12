# Poisonburst Arrow and Gas Arrow Focuses

Two reviewed skill focuses are added locally. Poisonburst Arrow targets its
Poison burst; Gas Arrow targets its Poison cloud, not the separate conditional
Fire explosion. These are passive-preference heuristics, not Full DPS evaluation.

## Component Boundaries

- Both suggest Poison Magnitude, reviewed weapon-source Attack/Bow and Physical
  Damage, Projectile Damage, Attack Area Damage, Poison Duration, Skill Effect
  Duration, coverage and deployment speed. Each modifier line is counted once.
  Initial-arrow hits and hit-trigger effects are not inferred for no-hit Poison.
- Poisonburst Arrow's initial arrow must hit. The burst explicitly sets
  `poison_duration_is_skill_duration`; Skill Effect Duration can extend outgoing
  Poison. Deployment rate is not Poison tick speed or guaranteed stack uptime.
- Gas Arrow's cloud poisons without hitting. Its four-second cloud lifetime and
  two-second outgoing Poison timer are separate. Skill Effect Duration extends
  the cloud; Poison Duration extends Poison. Area growth, overlap, six-cloud
  limit utilization, contact frequency and uptime are not simulated.
- Gas Arrow's Explosion requires a Detonator skill or contact with an Ignited
  enemy. Its 100% Physical-to-Fire conversion does not turn the cloud into Fire
  damage. No explosion frequency or Fire benefit is automatically scored.
- The native Poison calculation exposes fake hit and critical fields for the
  no-hit components. Those fields alone do not establish real burst/cloud hits,
  critical applicability or on-hit effects. Critical and Accuracy scopes are
  deliberately withheld; the arrow's need to hit is disclosed, not denied.
- The reviewed normal Bow supplies Physical source damage. Generic Chaos Damage
  and Damage over Time do not improve these native source calculations. This is
  not a universal claim about added Chaos, conversion or fully equipped builds.
  A Chaos tag does not establish those inputs.
- Poison supplied to a separate Plant skill, its storage and damage bonus are
  not modeled. Neither skill is assigned Plant-specific passive scopes.

Manual preferences remain available and are never silently deleted. Selecting
a focus changes no weights; Add suggestions preserves existing priorities,
goals, point budgets and saved builds. Outside-focus Fire, critical, Chaos and
other preferences receive contextual warnings. No support compatibility is
inferred in this batch. Shortest routing and the passive parser are unchanged.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime ran 125 bounded modifier checks across five MAIN
component sets: Poisonburst Arrow's Arrow and Poison Burst, and Gas Arrow's
Arrow, Poison Cloud and Explosion. Each calculation asserts the selected
stat-set and equipped Bow. An empty-tree Witch, level-20 skill, normal Crude Bow
and sufficient attributes isolate the modifiers. Installed PoB and user builds
were untouched. Evidence is under `var/poison-bow-skills-20261109/`.

Frozen independent fixtures are in `src/tree/poisonBowSkills.fixtures.ts` and
ordinary tests need no native installation or network.

| Probe | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Baseline outgoing Poison/s | 5.385766215481 | 4.0038541776187 |
| Generic/Attack/Bow/Physical/Projectile/Area Damage +20% | 6.5035667507695 | 4.8308797946351 |
| Outgoing Poison duration | 3 seconds | 2 seconds |
| Skill Effect Duration +20%: outgoing Poison | 3.6 seconds | 2 seconds |
| Poison Duration +20%: outgoing Poison | 3.6 seconds | 2.4 seconds |
| Skill Effect Duration +20%: native skill timer | 3.63 seconds | 4.818 seconds |
| Base radius -> +20% area radius | 24 -> 26 | 18 -> 19 |
| Deployment rate -> +20% Attack/Bow Speed | 1.2 -> 1.44 | 1.2 -> 1.44 |

Independent checks verify magnitude multipliers 1.2/0.8, radius
`floor(baseRadius * sqrt(1.2))`, deployment `1.2 * 1.2` and skill timers rounded
up to 0.033-second ticks. Poison Magnitude leaves the fake source hit unchanged.
Generic Chaos/DoT/Fire, Spell, Minion and Plant probes leave this Physical-weapon
Poison source unchanged. Both chosen Poison components inherently have 100%
application chance; extra Poison chance on Hit does not increase magnitude.

Native Attack Speed can change Poison DPS through repeated-hit roll-selection
assumptions. That is not a faster Poison tick, plant-feed multiplier or guarantee
of application uptime, and no such damage conversion is added to route scores.
Real-arrow controls respond to Physical Damage; the Fire explosion responds to
Fire Damage and has zero remaining Physical hit damage. These controls stay
separate from the chosen Poison components.

- [Poisonburst Arrow source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L5715)
- [Gas Arrow source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L2854)
- [Gem identities and tags](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua)

Moving upstream references are not claimed byte-identical to the isolated
snapshot. Source/native evidence is not a blanket live-game simulation claim.

## Coverage and Next Batch

Skill presets increase 101 -> 103/399 (25.8%); positive-tier presets increase
96 -> 98/234 (41.9%). Support choices stay 38, families 24 and reviewed pairs 438.
Passive preferences stay 184; confirmed wording/occurrence coverage remains
864/2182 and 3444/5451. No coverage baseline reset or source catalog refresh.

Next proposed batch: review Magnified Area I/II, Prolonged Duration I/II and
Efficiency I/II for both focuses. Keep Poisonburst's linked Poison duration
separate from Gas Arrow's cloud lifetime and outgoing Poison. This is a proposal
only, not authorization to add another batch or deploy.
The subsequent authorized [utility support review](build-focus-poison-bow-supports.md)
is documented separately; counts above preserve the original skill checkpoint.

## Verification

The initial focused run passed 455 tests with two incorrect UI-warning phrase
expectations; those expectations were corrected to match the existing warning
interface. The first full run found one older global expectation that no preset
suggested ailment effects. That assertion now allows exactly Poison Magnitude
and Poison Duration for these two reviewed focuses, and no other presets.

The final `npm run validate:release` passed 2693 tests across 118 files,
typecheck, production build, graph validation and the unchanged coverage baseline
in 92732 ms. The existing large-chunk advisory remains non-blocking (main
690.59 kB). No baseline reset, parser/solver change or route-quality audit.

An isolated Edge production-preview smoke passed both focuses, component notes,
withheld support lists, manual-priority preservation, explicit Add suggestions,
goal/start/budget preservation and saved-build load/reload. The completion console
had zero errors and warnings; the initial unrelated favicon 404 was absent after
reload. The screenshot was visually checked for a nonblank tree and readable,
non-overlapping controls. User saves were isolated and the test session closed.
No CSS or browser-specific implementation changed; the previous Firefox
checkpoint was not rerun for this catalog extension.

Validation logs and native evidence: `var/poison-bow-skills-20261109/`.
Repeatable browser script and screenshot:
`output/playwright/poison-bow-skills-20261109/`.
The production preview was restarted because the old listener was absent and is
available at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

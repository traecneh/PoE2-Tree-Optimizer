# Minion Command, Duration and Reservation Preferences

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph and isolated PoB 0.23.1
runtime. Adds four opt-in categories without changing routing, preset suggestions,
support compatibility, shared controls, saved schema, graph or assets. Existing
priorities and shortest routing are unchanged. Raw preference scoring is not a
full command rotation, DPS, lifetime, Spirit-budget or summon-count calculator.

## Scope and Units

| Preference | Normal score unit | Boundary |
| --- | --- | --- |
| Minion Command Skill Damage | 10% increased | Damaging minion commands, not basic actions or player damage |
| Minion Command Cooldown Recovery | 10% increased | Command cooldown recovery, not attack/cast speed or a linear reduction in seconds |
| Temporary Minion Duration | 10% increased | Applicable temporary summon lifetime, not persistent uptime, revival or generic skill duration |
| Minion Reservation Efficiency | 5% increased | Reserving Minion Skills, not non-minion buffs, flat Spirit or command Mana costs |

Increased/reduced forms retain their sign. High/Highest use the existing 2x/3x
priority multipliers. All four remain manual, explicit choices; no preset selects
them automatically or changes existing weights. A persistent-skeleton basic-hit
focus is not silently converted into a command or temporary-summon focus.

Only complete lines with these exact reviewed scopes are admitted. Additional
conditions, per-charge scaling, per-different-minion-type command bonuses,
companions, more/less forms, malformed composites, generic minion cooldowns,
command Mana cost efficiency and unreviewed aliases are excluded. Command damage
does not duplicate a line into generic Minion Damage; duration and reservation
do not duplicate into generic skill duration or resource modifiers.

## Source and Native Evidence

Official references:
[modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[offence/cooldown/duration calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua),
[reservation calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua).
Moving upstream references are not claimed byte-identical to the isolated copy.

| Local source | SHA-256 |
| --- | --- |
| ModParser.lua | `01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247` |
| CalcOffence.lua | `eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435` |
| CalcDefence.lua | `7884220a9744297bc62de7d67112173d4ba28ffb35c848e9418031e6f68b1cc7` |

Eight signed native forms passed parser and ModDB scope checks, then independent
app comparisons. Commands wrap minion Damage/CooldownRecovery modifiers with a
CommandableSkill condition. They do not reach player damage/cooldowns and are
inactive without the command condition. Minion Duration is a parent Duration
modifier scoped to CreatesMinion, while reservation efficiency is a parent
ReservationEfficiency modifier scoped to Minion skills. Neither is inferred
from gem name, node name or a broad damage tag.

Twenty-seven native actor fixtures passed 119 independent comparisons:

- Selected `GasShotSkeletonSniperMinion` uses the native command condition. Its
  command-only damage modifier responds to +20/-20, with unchanged action speed
  and cooldown; the basic bow shot remains unaffected. Native damage moves in the
  expected direction, but its result is not treated as an exact 1.2/0.8 DPS factor
  because mitigation, crit and component effects are separate calculations.
- Gas Arrow's raw six-second cooldown becomes 6.006 seconds after native ticks.
  +20% cooldown recovery gives 5.016; -20% gives 7.524. Independent checks use
  ceil((6 / (1 + modifier/100)) * tickRate) / tickRate, not 20% fewer/more seconds.
  The basic shot and player's outputs are unchanged by these command modifiers.
- Raise Zombie's raw twenty-second lifetime becomes 20.031 seconds after ticks;
  +20/-20 Minion Duration gives 24.024/16.005. Its minion hit output is unchanged.
  The persistent Sniper still has no lifetime, even though its parent DurationMod
  can change. Enfeeble's duration remains unchanged by Minion Duration.
- The level-20 Sniper fixture reserves 30 Spirit at baseline. +20% reservation
  efficiency gives 25; -20% gives 38 after whole-point rounding. +10/+12 both give
  27, +40 gives 21, and the real -25 penalty gives 40. Independent checks use
  round(30 / (1 + efficiency/100)); this is not equal percentage cost reduction.
- Arctic Armour, a non-minion reservation control, remains at 30 Spirit under
  either minion-efficiency sign. The Sniper's minion damage/speed/Life are unchanged
  by reservation efficiency. No extra minions or full resource budget is inferred.

Native skill selection uses PoB's existing `skillMinionSkill` and
`skillMinionSkillCalcs` fields; no command conditions, skill data or calculations
are patched/injected in the final fixtures. The preliminary forced-condition
probe was replaced with the actual selected Gas Arrow component before the final
audit. Installed PoB builds/settings and source files were untouched.

Ignored reproduction/evidence:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/minion-command-20261107/native-check.lua --job var/minion-command-20261107
npx tsx var/minion-command-20261107/verify.ts
```

Existing native missing-node startup messages did not prevent these checks.
Fresh-checkout tests do not require ignored artifacts. This is not a real-
character Full DPS, complete command-rotation or live-game equivalence audit.

## Coverage and Validation

Preferences 93 -> 97. Sixteen new wordings across 23 nodes add 23 stat occurrences.
Wording 547/2,182 -> 563/2,182 (25.8%); occurrences 2,638/5,451 -> 2,661/5,451
(48.8%). All 42 contexts gain exactly these sixteen wordings without losing old
matches; graph/catalog fingerprints remain unchanged. The reviewed baseline is
refreshed to protect the additions. Skills stay 41/399, supports 31/567,
families 19 and curated pairs 292. No overall completion percentage is implied.

Focused validation passed 1,097 tests in 22 files, typecheck and the old baseline.
Tests cover both signs, zero cancellation, complete-line/scope exclusions,
current inventory and the real reservation penalty, explicit picker/help/priority/
removal, catalog-wide storage/export and five routing fixtures. Route tests retain
required goals, costs, shared/base-node reward rules and shortest behavior.
No shared UI/layout, routing contract or persistence implementation changed, so
no repeated interactive browser/viewport matrix under the lean validation policy.
Final release validation passed 1,414 tests in 66 files, typecheck, production
build, graph validation and refreshed coverage baseline. No final checks failed.
The existing local server returned HTTP 200; graph/assets remained unchanged.
No commit, push or deployment requested or performed.

Raw backlog: 1,619 unrecognized wordings and 2,790 occurrences, not a reviewed
eligibility count. Next recommended batch: unconditional Companion damage,
maximum Life, attack/movement speed, Area of Effect, resistances and reservation
efficiency, with separate companion/minion/player ownership checks. Presence
conditionals, damage-as-extra conversions and revival need deeper review.
Fireball's Concentrated Area review remains on hold.

# Critical Damage and Buildup Preferences

Reviewed on 2026-11-07 against the bundled PoE2 0.5.5f graph, official PoB source
and the isolated local PoB 0.23.1 native parser. No graph, assets, shortest solver,
weighted algorithm, gem/support allowlists or preset suggestions changed.

## Scope and Interface

Three opt-in preferences use the existing picker and priority/remove controls.
Each Normal score unit represents 10% of its literal modifier; High/Highest
multiply the heuristic score by two/three. Increases add score; reductions
subtract score. Only complete unconditional increased/reduced percentage lines
match, with case/whitespace normalization and decimal support.

| Preference | Group | Separate from |
| --- | --- | --- |
| Critical Damage Bonus | Offence | Critical Hit Chance, flat added critical bonus, incoming critical damage |
| Stun Buildup | Utility | Your Stun Threshold, recovery and stun duration |
| Freeze Buildup | Utility | Cold Damage, freeze chance and freeze duration |

Weapon-specific, projectile-only, attack/spell-only, Empowered, Parry, conditional,
enemy/minion-owned, more/less, conversion and override lines are not included.
No flat critical bonus or partial substring is mistaken for the reviewed modifier.
Desensitisation's incoming critical protection is not an outgoing penalty.

Tooltips explain that these are not DPS or crowd-control frequency calculations.
Critical damage needs damaging critical hits; buildup needs applicable hits.
Cannot-crit/stun/freeze mechanics, damage conversions, enemy thresholds and gear
interactions are not simulated. A selected manual preference can therefore be
inapplicable to a real build. Review the build and other node effects before
applying; unselected penalties have no score, as with all existing preferences.

No preset or support automatically selects these effects or edits existing
priorities. Storage and JSON transfer retain their IDs without a schema change.
Required goals, point budgets and base-allocation behavior remain unchanged.

## Source and Native Check

PoB's [critical parser mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L756-L766)
distinguishes CritMultiplier from CritChance. The
[buildup mappings](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L876-L882)
use EnemyHeavyStunBuildup and EnemyFreezeBuildup, not the character's threshold.
Its [critical calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L3853-L3859)
applies increased/reduced critical bonus to the extra damage portion, rather
than treating it as overall DPS or an increase in critical chance.
These moving upstream references are not claimed byte-identical to the local copy.

The isolated native parser/ModDB probe consumed all six tested lines, an increase
and reduction for each effect, with the correct signed INC value and zero BASE.
A seventh probe confirmed that flat added critical bonus is a distinct BASE
modifier. Synthetic reduced buildup wording was checked because none occurs
unconditionally in the current main-tree batch. Existing missing-node startup
messages did not prevent the checks; installed PoB settings/builds were untouched.

Independent arithmetic: with a synthetic 100% base extra critical bonus, a 20%
increase gives 1 + 1 * 1.2 = 2.2 times normal hit damage, not a 20% overall DPS
increase. Separately, the heuristic scores +10 critical bonus at Highest,
+30 stun at High and +20 freeze at Normal as 3 + 6 + 2 = 11. The scorer matches.
Neither example estimates a real character's damage or control performance.

## Coverage and Fixtures

The batch adds 134 recognized stat occurrences across 127 main-tree nodes:

- Critical Damage Bonus: 39 occurrences, including Careful Assassin's reduction.
- Stun Buildup: 48 occurrences.
- Freeze Buildup: 47 occurrences.

Careful Assassin (46197) retains -20 critical damage and +50 critical chance
independently. Throatseeker (56265) retains +60 damage and -20 chance.
Pressure Points (28329) has two independent +35 buildup lines on one node;
Stun and Freeze Buildup (3700) has two +15 lines. Inescapable Cold (47270) scores
its +40 freeze buildup but not freeze duration. One with the River (34316) remains
excluded because its buildup is quarterstaff-specific.

The tracker advances from 41 to 44 preferences and from 1,995/5,451 (36.6%) to
2,129/5,451 (39.1%) recognized main-tree stat occurrences. Distinct recognized
wording increases from 348 to 370. The prior baseline passed with unchanged
graph/catalog fingerprints, then the 22 new exact wordings were reviewed before
deliberately refreshing it. This is heuristic effect coverage, not an overall
project-completion percentage or complete PoB simulation.

## Verification

- `validate:quick`: 528 tests across 14 files, typecheck and prior baseline passed.
- `validate:release`: 845 tests across 58 files, typecheck, production build,
  graph validation and refreshed coverage baseline passed.
- Native parser/ModDB checks passed for the three effects and both signs.
- Existing parameterized parser tests now cover all six combat preferences,
  including decimals, zero/cancellation, strict boundaries and ownership/scope.
- Routing fixtures verify Careful Assassin/Throatseeker priority tradeoffs,
  required negative goals, Pressure Points' two contributions on one shared node,
  allocated-base exclusions, budgets and unchanged shortest results.
- Existing DOM controls and persistence/JSON-transfer tests cover the three
  added options without a repeated browser layout/save-load matrix. No shared
  control, layout, worker contract or storage implementation changed.

Next recommended batch: unconditional Fire, Cold and Lightning Resistance
Penetration, kept separate from resistance reduction, exposure and damage over
time. The current backlog has 19, 18 and 26 occurrences respectively, useful
across existing elemental hit presets. This is proposed, not implemented here.

# Generic Damage, Skill Speed and Chill Magnitude

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph, extracted game tables
and existing isolated PoB runtime. Three opt-in preferences; no graph/assets,
solver, point cost, gem/support catalog, storage schema or shared UI changes.

## Literal Matching and Scoring

| Preference | Complete unconditional line | Normal score unit |
| --- | --- | --- |
| Generic Damage | N% increased/reduced Damage | 10% |
| Skill Speed | N% increased/reduced Skill Speed | 3% |
| Chill Magnitude | N% increased/reduced Magnitude of Chill you inflict | 10% |

Reductions retain a negative score. High/Highest multiply by two/three. Generic
Damage is not copied into Attack/Spell, damage-type, projectile, minion or Totem
Damage preference values. Generic damage can benefit player-owned totem/proxy
skills natively, but this is not justification to score one line twice or assume
it transfers to ordinary minions/Companions. Separate real stat lines can each
score: Sentinels' generic and minion damage are independent modifiers.

PoB parses Skill Speed into Speed, WarcrySpeed and TotemPlacementSpeed. Those
represent action-specific uses of the same generic modifier. The app stores one
`skillSpeed` value and does not copy it into attack speed, cast speed or totem
placement/attack/cast speed categories. Selecting those preferences alongside
Skill Speed still rewards one 3% Skill Speed line only once. A separate genuine
3% Attack Speed line may score separately. No universal DPS multiplier, cooldown
recovery, fixed-animation scaling or minion speed inheritance is implied.

Chill magnitude is outgoing ailment magnitude, not Cold Damage, Freeze Buildup,
Chill duration, incoming Chill protection, application chance or maximum Chill.
Ice Storm's incoming-Chill reduction remains separate from its outgoing-Chill
increase. The native default maximum Chill is 50%; raw magnitude preference
scores are not capped slow percentages. Damage thresholds, application,
prohibitions, cap overrides, enemy state and actual slow/uptime remain unmodeled.

Only literal full increased/reduced lines match. Conditional/recent, per-charge,
weapon/skill scoped, ally/minion/Companion/enemy-owned, more/less, malformed,
unknown composite and unreviewed alias forms are not promoted into these three
categories. Existing more specific matchers remain independent. Old saved
preferences, manually edited weights, budgets and shortest behavior are intact;
no preset automatically adds a new preference. Existing picker/tooltip/priority
controls and catalog-wide persistence paths handle the new IDs.

## Evidence

Primary references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[offence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)
and [ailment data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/Data.lua).
Moving upstream links do not establish byte identity with the tested local
snapshot. Native checks use the existing isolated runtime; no personal builds
or installed PoB settings are edited.

All six signed native forms parse completely. Generic Damage maps to one Damage
INC modifier with no attack/spell restriction. Skill Speed maps to exactly three
distinct native action stats, each receiving the signed value once. Chill maps
to EnemyChillMagnitude, not SelfChillEffect, duration, Freeze or Cold Damage.
None of these lines is a MinionModifier.

Thirty-one fresh actor fixtures cover Frostbolt, player Spark, Dark Effigy's
actual Vile Effusion component and an ordinary Skeletal Sniper. Generic damage
changes player/proxy damage in the signed direction; generic speed changes cast
cadence once and totem placement time reciprocally. Neither is copied to the
ordinary minion. Positive minion-only controls affect the skeleton, not player
or proxy outputs. A large Chill modifier changes the raw magnitude stat but
does not raise native MaximumChill or add hit damage.

The Chill fixtures validate the native modifier and cap fields, not an actual
generated enemy slow: these fixtures do not expose a computed ChillEffectMod
for the tested hits. No forced application, fabricated enemy debuff or assumed
50% Chill is used. This limit is distinct from the valid source/parser match.
Likewise damage direction/raw units are checked without assuming a universally
linear final-DPS response under rounding and mitigation.

All 53 graph occurrences were independently traced to raw `damage_+%`,
`skill_speed_+%` and `chill_effect_+%` in the extracted local PassiveSkills/Stats
tables, including the six negative values. The initial backlog estimate of 47
covered positive templates only; the full batch adds their penalties too.

Evidence is retained under ignored `var/generic-damage-speed-chill-20261107/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/generic-damage-speed-chill-20261107/native-check.lua --job var/generic-damage-speed-chill-20261107
node var/generic-damage-speed-chill-20261107/verify.mjs
```

All six native parser/fan-out/ownership forms pass; independent JavaScript checks
pass 220 ownership, action-fan-out and source-sign assertions across 31 fixtures
and 53 extracted stats. Existing fourteen missing-node startup messages remain
unrelated to these final checks.

## Inventory and Validation

Preferences 124 -> 127. Generic Damage: 21 occurrences, including three penalties;
Skill Speed: 19, including three penalties; Chill Magnitude: 13. Twenty-two new
wordings add 53 occurrences: wording 613 -> 635 of 2,182 (29.1%); occurrences
2,827 -> 2,880 of 5,451 (52.8%). Skills stay 41/399, supports 31/567, families
19 and reviewed pairs 292. This is heuristic wording coverage, not overall
completion or performance accuracy.

All 42 contexts retain every old match and both source fingerprints, gaining
exactly the reviewed twenty-two wordings before deliberate baseline refresh.
Focused validation passed 1,246 tests in 27 files, typechecking and no-loss
coverage. Tests cover signs/zero/decimals, ownership/condition exclusions,
actual mixed nodes, raw-vs-cap separation, all-focus manual preservation,
picker/tooltip/priority/remove controls and catalog-wide save/transfer behavior.

Routing fixtures retain negative-value required goals, compare unchanged shortest
results, count shared nodes once, and avoid already allocated base-node rewards.
Skill Speed has one scored contribution even with five other speed preferences
selected. The existing contribution API includes zero-valued rows for unproductive
preferences; the test checks those rows stay zero rather than changing the API
to satisfy an incorrect length assumption. Separate genuine Attack Speed can
then add its own contribution. No solver/UI contract changed.

No repeated browser matrix was needed for these metadata-only additions. Local
port 5174 returns HTTP 200. Final `npm run validate:release` passed 1,563 tests
in 71 files, typechecking, production build, graph validation and the refreshed
coverage baseline. `git diff --check` passed with existing line-ending warnings
only. No commit, push or deployment performed.

## Next Proposed Batch

Generic increased/reduced ailment chance and flat chance to Poison, inflict
Bleeding or Daze on Hit. The four positive templates cover 68 current occurrences;
inventory negative forms as well. Keep added chance points separate from
increased chance, with ownership, application prerequisites, prohibitions and
caps reviewed. This is a proposal only. Fireball Concentrated Area remains on hold.

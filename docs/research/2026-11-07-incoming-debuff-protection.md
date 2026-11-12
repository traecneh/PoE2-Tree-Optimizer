# Incoming Debuff Protection Preferences

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph, extracted game tables
and existing isolated PoB runtime. Four opt-in defensive preferences; no graph,
assets, solver, point-cost, storage-schema, gem/support or shared-control changes.

## Matching and Direction

| Preference | Complete increased/reduced wording | Normal unit |
| --- | --- | --- |
| Slow Potency Reduction | Slowing Potency of Debuffs on You | 10% reduced |
| Curse Effect Reduction | effect of Curses on you | 10% reduced |
| Chill Effect Reduction | Effect of Chill on you | 10% reduced |
| Shock Effect Reduction | effect of Shock on you | 10% reduced |

These four preferences intentionally reverse the incoming modifier sign:
reduced incoming effect adds value, increased incoming effect subtracts value.
High/Highest multiply Normal by two/three. Zero/decimal/cancelling modifiers
remain literal raw values. These are user-selected preferences, not calibrated
mitigation, movement speed, immunity or performance estimates.

Incoming protection does not score as outgoing curse/ailment/slow strength,
Movement Speed, ailment threshold, duration, debuff expiry or avoidance. Each
real stat line contributes only to its own category. Distinct genuine incoming
and outgoing lines can each score; overlapping slow and Chill preferences are
not converted into a calculated combined protection percentage.

Only complete unconditional wording matches. Conditional/recent-event,
per-charge, weapon/skill, minion/Companion/ally/enemy-owned, more/less, malformed,
unknown composite, immunity/unaffected and unreviewed combined aliases remain
separate. In particular, generic non-damaging ailment effect on self and combined
Chill/Shock wording are not silently promoted into these single-effect matchers.
No new automatic skill/support priorities are added. Manual settings, budgets
and shortest mode remain unchanged; existing catalog-driven controls and
save/transfer paths handle the new IDs.

## Evidence and Native Limits

Primary references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[defence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua)
and [effect processing](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua).
Moving upstream links do not establish byte identity with the tested local
snapshot. Existing isolated native fixtures do not edit personal builds or
installed PoB settings.

Six signed forms parse completely: incoming curse effect maps to INC
CurseEffectOnSelf, incoming Chill/Shock to INC SelfChillEffect/SelfShockEffect.
Reduced forms produce negative native modifier values. Those are inverted for
beneficial preference scores, not misrepresented as native positive modifiers.
They do not alter outgoing CurseEffect/EnemyChillMagnitude/EnemyShockMagnitude,
debuff expiry, movement speed or avoidance and are not MinionModifiers.

Twenty-two fresh actor fixtures cover Spark, an ordinary Skeletal Sniper,
combined real protection lines, configured 20% Chill, large modifiers and
positive minion-only controls. Native remaining-effect fields change from 100
to 80 or 120 for 20% reduced/increased incoming effect. Without an active debuff,
Life, damage and cadence stay unchanged. Player bonuses do not transfer to the
ordinary minion; minion-only control bonuses change minion effect fields rather
than the player's fields.

Independent arithmetic checks distinguish raw fields from actual native
behavior. With a configured 20% Chill, the baseline action-speed factor is 0.8;
20% reduced incoming Chill gives 0.84, and 20% increased gives 0.76. Native actual
slow floors at zero for 150% reduced incoming Chill and caps at 50% in the tested
300% increased case. The Chill condition remains active and avoidance/immunity
are not granted. The raw SelfChillEffect output can be negative even when actual
slow is floored; it must not be reported as negative slow or excess immunity.
CurseEffectOnSelf similarly floors at zero in the 150%-reduced fixture without
granting curse avoidance or setting CurseImmune.

These are isolated native checks, not a new full-build defence simulation. The
tool does not calculate current curse/Chill/Shock strength, enemy increases,
combined slow effects, overrides, reversed self-Chill, beneficial self-curse
interactions, actual damage taken or final mitigation. Native Shock modifier and
remaining-effect fields are verified; actual enemy Shock damage mitigation is
not claimed as a runtime-tested result. A reduction is not immunity, even if
effect reaches zero in an isolated case. Scores remain uncapped raw preferences,
not net remaining effects or final protection percentages.

Slowing Potency is a documented native parser gap: both signed forms produce
no parsed modifier and retain an unparsed remainder. The app uses the exact
game descriptor `base_slow_potency_+%`, its sign transform and extracted passive
value. It does not invent or patch a native PoB slow-potency effect, infer all
slow stacking rules, or claim to calculate action speed from this preference.
That limitation is stated in its tooltip.

All 59 main-tree occurrences independently trace to extracted PassiveSkills/Stats:

| Raw game stat | Occurrences |
| --- | ---: |
| base_slow_potency_+% | 32 |
| curse_effect_on_self_+% | 12 |
| chill_effectiveness_on_self_+% | 8 |
| shocked_effect_on_self_+% | 7 |

Every raw value is negative in this snapshot, displaying a favorable reduced
effect. All four descriptors provide the opposite increased form too, explicitly
tested as a preference penalty. Exact mixed nodes retain independent bonuses,
penalties and unsupported effects: Near at Hand retains -16% Skill Effect
Duration; Ice Storm and Stormkeeper keep separate incoming/outgoing effects;
The Hollowkeeper's broader non-damaging-ailment protection remains unreviewed;
Unhindered keeps its separate skill movement penalty reduction.

Evidence is retained under ignored `var/incoming-debuff-protection-20261107/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/incoming-debuff-protection-20261107/native-check.lua --job var/incoming-debuff-protection-20261107
node var/incoming-debuff-protection-20261107/verify.mjs
```

Six complete signed parser forms passed; independent JavaScript validation
passed 406 sign/ownership/floor/cap/source checks across 22 fixtures and all 59
raw game stats. Slowing Potency's unparsed forms are not counted as passed native
effects. Existing fourteen missing-node startup messages are unrelated.

## Inventory and Validation

Preferences 136 -> 140. Twenty-five new wordings add 59 occurrences: wording
660 -> 685 of 2,182 (31.4%); occurrences 2,983 -> 3,042 of 5,451 (55.8%). Skills
stay 41/399, supports 31/567, families 19 and reviewed pairs 292. These are
heuristic coverage measures, not overall project completion or Full DPS accuracy.

All 42 contexts preserve every old match and both source fingerprints, gaining
exactly the reviewed twenty-five wordings before deliberate baseline refresh.
Quick validation passed 1,310 tests in 30 files, typecheck and no-loss coverage.
Tests cover reversed sign/zero/decimals, complete-wording/ownership checks,
incoming/outgoing isolation, non-immunity and raw-vs-cap distinction, real mixed
nodes, all-focus manual preservation and catalog-wide controls/persistence.
Five stale expected-value assertions in four older files were updated for newly
supported lines rather than removing the original scope checks.

Routing fixtures retain required incoming-effect penalties, compare unchanged
shortest results, count shared stats/nodes once and exclude already allocated
base rewards. Genuine separate outgoing lines can still score separately.
No shared layout or route contract changed, so no repeated browser matrix was
run. Final `npm run validate:release` passed 1,627 tests in 74 files, typechecking,
production build, graph validation and the deliberately refreshed coverage
baseline. Local port 5174 returns HTTP 200. `git diff --check` passed with existing
line-ending warnings only. Main production chunk is 503.23 kB minified (135.24 kB
gzip); the existing Vite 500 kB size warning remains, not a build failure or a
measured runtime regression. No warning limit was raised. No commit, push or
deployment performed.

## Next Proposed Batch

Player Fire/Cold/Lightning/Chaos resistances and maximum elemental resistances.
Review signed ordinary/maximum values, grouped all-elemental wording, ownership,
caps and the requirement for sufficient ordinary resistance to benefit from
maximum resistance. Do not treat cap increases as resistance, all-elemental as
Chaos, or raw resistance weights as actual capped mitigation. Inventory grouped
and negative forms before declaring a batch total. Proposal only; Fireball
Concentrated Area remains on hold.

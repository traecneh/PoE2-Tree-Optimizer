# Player Ordinary and Maximum Resistance Preferences

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph, extracted game tables
and existing isolated PoB runtime. Seven opt-in defensive preferences; no graph,
assets, solver, point-cost, storage-schema, gem/support or shared-control changes.

## Literal Matching and Scoring

| Preferences | Exact signed BASE wording | Normal unit |
| --- | --- | --- |
| Fire/Cold/Lightning/Chaos Resistance | +N% or -N% to the named Resistance | 5 percentage points |
| Maximum Fire/Cold/Lightning Resistance | +N% or -N% to the named Maximum Resistance | 1 percentage point |

All Elemental Resistances contributes once to each selected ordinary
Fire/Cold/Lightning channel, never Chaos or maximum resistance. All Maximum
Elemental Resistances contributes once to each selected maximum
Fire/Cold/Lightning channel, never ordinary resistance. A grouped line is counted
once for wording coverage and once for node cost, even when several preference
channels are selected. Separate genuine single-element bonuses can also score.
High/Highest multiply Normal by two/three. Signed penalties and decimal raw
values are retained; preference values are not actual capped mitigation.

Only complete, explicitly signed unconditional wording matches. Increased/reduced
resistance modifiers, maximum Chaos resistance, unreviewed combined/all-resistance
aliases, overrides, penetration, exposure, unknown composites, malformed numbers,
minion/Companion/Totem/ally/enemy ownership and conditional/recent/per-charge
wording remain separate. The current main-tree grouped ordinary wording is all
Elemental Resistances; combined two-element aliases are not needed to cover this
snapshot and have not been added speculatively.

Several real maximum-resistance effects require support-gem colors, shapeshifting,
being Ignited or recent elemental hits. Those are excluded rather than treated
as unconditional. This batch does not implement those prerequisites. The new
maximum Fire preference is verified against native/game definitions even though
the current graph has no unconditional maximum Fire occurrence. No new automatic
skill/support priorities are added; existing manual priorities, budgets, shortest
behavior and catalog-driven controls/persistence remain intact.

## Evidence and Cap Boundaries

Primary references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [defence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua).
Moving upstream links do not establish byte identity with the isolated tested
snapshot. No installed PoB settings or personal build was modified.

Eighteen signed literal forms parse completely to BASE ordinary or maximum
resistance stats, not INC modifiers. All-elemental wording maps to ElementalResist
or ElementalResistMax, not Chaos. No tested player line is a MinionModifier.
Twenty-eight fresh actor fixtures cover Spark, an ordinary Skeletal Sniper,
signed real penalties, fractional inputs, sufficiently high resistance, maximum
bonuses without resistance, lowered caps, floors and positive minion controls.

Independent checks reproduce native arithmetic separately from the optimizer:

- Ordinary resistance changes its uncapped total without changing maximum
  resistance. Maximum resistance changes the cap base without supplying ordinary
  resistance. All-elemental changes leave Chaos untouched.
- With sufficient ordinary resistance, the default maximum is 75%; additional
  maximum resistance is capped at native 90%. +200% all-elemental with +50% all
  maximum elemental resistance reaches 90%, not 125% or 150% mitigation.
- The same maximum bonus alone leaves actual resistance unchanged when below
  the cap. Negative maximum resistance lowers the cap: the tested -10% maximum
  case with sufficient ordinary resistance results in 65%.
- The native floor is -200% in this snapshot; -999% Fire resistance retains its
  uncapped negative total but floors effective resistance. This is not a score
  floor. Actual -7% Chaos and -10% all-elemental penalties are separately checked.
- Native fractional resistance totals truncate toward zero before clamping;
  the scorer retains literal decimal units rather than pretending to calculate
  final resistance or apply a second rounding step.
- Ordinary minions do not inherit these player bonuses. Positive minion-only
  controls affect the minion, not the player. Life, cadence and hit damage are
  unchanged by the isolated resistance inputs.

The local blank player fixture begins with -50 elemental resistance and zero
Chaos resistance. Arithmetic uses the captured baseline; this is not a claim
that every live character or campaign state has those penalties. The app does
not evaluate gear, campaign penalties, overcapping, conversions, resistance
overrides, maximum-sharing mechanics, penetration or actual incoming damage.
It does not automatically stop rewarding resistance at a hypothetical cap or
assume a maximum bonus benefits a character lacking ordinary resistance. These
remain explicit raw preferences with applicability/cap limits in their tooltips.

All 45 current graph lines independently trace to raw game stats:

| Raw game stat | Occurrences | Negative values |
| --- | ---: | ---: |
| base_fire_damage_resistance_% | 7 | 0 |
| base_cold_damage_resistance_% | 11 | 0 |
| base_lightning_damage_resistance_% | 11 | 0 |
| base_chaos_damage_resistance_% | 9 | 1 |
| base_resist_all_elements_% | 5 | 1 |
| base_maximum_fire_damage_resistance_% | 0 | 0 |
| base_maximum_cold_damage_resistance_% | 1 | 0 |
| base_maximum_lightning_damage_resistance_% | 1 | 0 |
| additional_maximum_all_elemental_resistances_% | 0 | 0 |

Each descriptor uses signed BASE units. Spaghettification retains its -7% Chaos
Resistance; Forbidden Path retains -10% all Elemental Resistances and its
separate -5% maximum Life penalty. Embracing Frost and Electric Blood keep their
ordinary/maximum/other effects in independent categories. No conditional maximum
effect is silently included.

Evidence is retained under ignored `var/player-resistance-preferences-20261107/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/player-resistance-preferences-20261107/native-check.lua --job var/player-resistance-preferences-20261107
node var/player-resistance-preferences-20261107/verify.mjs
```

Eighteen signed parser forms passed; independent JavaScript validation passed
955 ownership/cap/floor/source checks across 28 fixtures and all 45 raw game
occurrences. Existing fourteen missing-node startup messages are unrelated.

## Inventory and Validation

Preferences 140 -> 147. Twenty-four new wordings add 45 occurrences: wording
685 -> 709 of 2,182 (32.5%); occurrences 3,042 -> 3,087 of 5,451 (56.6%). Skills
stay 41/399, supports 31/567, families 19 and reviewed pairs 292. These are
heuristic coverage measures, not overall completion or performance accuracy.

All 42 contexts retain every prior match and both source fingerprints, gaining
exactly the reviewed twenty-four wordings before deliberate baseline refresh.
Quick validation passed 1,343 tests in 31 files, typecheck and no-loss coverage.
Tests cover signs/zero/decimals, ownership/scope exclusions, exact mixed nodes,
ordinary/max separation, no elemental-to-Chaos fan-out, real penalties, all-focus
manual preservation and catalog-wide control/persistence paths. Two older
parameterized ownership checks now recognize player resistance while still
asserting it does not reward minion/Companion preferences.

Routing fixtures retain required penalty nodes, compare unchanged shortest
results, count shared/base nodes correctly and distinguish ordinary/maximum
contributions. Grouped bonuses may reward three selected channels without
tripling node cost. No route contract or shared layout changed; no repeated
browser matrix was run. Final `npm run validate:release` passed 1,660 tests in
75 files, typechecking, production build, graph validation and the deliberately
refreshed coverage baseline. Local port 5174 returns HTTP 200. `git diff --check`
passed with existing line-ending warnings only. Main production chunk is
505.46 kB minified (135.49 kB gzip); the existing Vite 500 kB size warning remains,
not a build failure or a measured runtime regression. No warning limit was
raised. No commit, push or deployment performed.

## Next Proposed Batch

Armour Break amount, effect of Fully Broken Armour and Armour Break duration.
The three current favorable unconditional templates cover 35 occurrences
(21/10/4); review opposite signs, source units, ownership and application
prerequisites before implementation. Keep amount, debuff effect and duration
separate; none should grant Armour Break or imply guaranteed uptime/mitigation.
Proposal only; Fireball Concentrated Area remains on hold.

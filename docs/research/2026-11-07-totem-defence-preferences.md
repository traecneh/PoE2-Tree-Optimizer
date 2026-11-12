# Totem Coverage, Defence and Regeneration

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph, extracted local game
tables and existing isolated PoB runtime. Ten opt-in preference categories cover
the requested six families. No routing algorithm, point cost, graph, assets,
gem/support catalog, save schema or shared UI implementation changed.

## Rules and Units

| Preference | Reviewed wording | Normal score unit |
| --- | --- | --- |
| Totem Area of Effect | increased/reduced Area of Effect for Skills used by Totems | 10% |
| Totem Placement Range | increased/reduced Totem Placement range | 10% |
| Totem Fire/Cold/Lightning Resistance | Totems gain signed % to the named resistance or all Elemental Resistances | +5 percentage points each |
| Totem Maximum Fire/Cold/Lightning Resistance | Totems gain signed % to all Maximum Elemental Resistances | +1 cap point each |
| Totem Physical Damage Reduction | Totems have signed % additional Physical Damage Reduction | 3 percentage points |
| Totem Life Regeneration | Totems Regenerate unsigned % of maximum Life per second | 1% of maximum Life per second |

Signed resistance/PDR penalties and reduced area/range are preserved. Regeneration
admits only the positive/zero displayed form, not unsupported negative recovery,
flat Life per second, increased regeneration rate or per-minute text. High and
Highest multiply the raw score by two and three. Unselected effects never score.

All-elemental resistance contributes once to each selected elemental preference,
never Chaos. Ordinary and maximum resistance are distinct; cap bonuses do not
grant ordinary resistance. This multi-stat fan-out does not multiply coverage
occurrence counts. Individual maximum-resistance aliases, Chaos, conditional,
per-totem, more/less, composite unknown labels and player/minion/Companion-owned
forms are excluded. Existing generic preferences retain their separate behavior.

Area is coverage of an applicable totem skill, not hit damage or a linear radius
increase; it cannot create area for a single-target skill. Placement range is
deployment distance, not firing/activation range or placement speed. Regeneration
uses the already displayed per-second percentage once; it is not divided by 60
again or treated as player Life recovery. The first line of Ancestral Mending is
conditional player recovery and remains excluded; its second line scores Totem
regeneration only.

## Source and Native Evidence

Primary references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[defence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua),
[game stat descriptions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/StatDescriptions/stat_descriptions.lua)
and [skill stat map](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua).
Moving upstream links are not claimed to be byte-identical to the locally tested
runtime. Actual source evidence and checks use the isolated local files and
`var/refresh-0.5.5f/tables/English/{PassiveSkills,Stats}.json`.

All thirteen graph occurrences were traced to six exact raw game stat IDs:

- `totem_skill_area_of_effect_+%`
- `totem_placement_range_+%`
- `totem_elemental_resistance_%`
- `totem_maximum_all_elemental_resistances_%`
- `totem_additional_physical_damage_reduction_%`
- `totems_regenerate_%_life_per_minute`

Ancestral Reach stores 50 on the placement-range stat; Ancestral Artifice stores
20. These are not the separate `totem_range_+%` firing-range stat. Ancestral Mending
stores 180 on the per-minute regeneration stat. The game description converts
per-minute to per-second, and PoB's skill stat map also divides by 60: 180/60 =
3% maximum Totem Life per second. This establishes literal units and ownership,
not a full recovery calculation.

Nine native text forms parse completely: increased/reduced Totem area, positive
all-elemental and maximum resistance, three named elemental resistances, and
positive/negative additional physical reduction. Area and PDR use the Totem
keyword; resistances use dedicated Totem stat names, not a MinionModifier or
player resistance. Native ModDB queries test these restrictions.

Three native text-parser gaps remain explicit:

1. Placement-range text returns an unparsed remainder and no modifier. The app's
   literal utility preference is based on the confirmed raw game stat and both
   signed game description forms; it does not claim native placement-distance
   evaluation or invent a base distance.
2. Totem regeneration text is unparsed. Its per-second units and Totem keyword
   are verified through the raw stat, game description and existing skill stat
   map. An isolated semantic-modifier query gives 180/60 = 3 to Totem recovery
   and zero to ordinary player recovery. No actor recovery calculation is patched.
3. Negative resistance text is unparsed, despite the game descriptions explicitly
   supporting signed values. Dedicated signed native stat queries verify negative
   storage and owner separation; negative-text native actor outputs are not claimed.

Thirty-five fresh actor/cap fixtures use Dark Effigy's actual linked Vile Effusion,
ordinary player Spark and Skeletal Sniper controls. No personal builds/settings
are changed. Independent JavaScript validation passed 624 ownership/cap/source-unit
checks. Non-area skills remain without an area output; a probe's initial numeric
comparison of an absent field was corrected to assert absence rather than assume
every skill has an area. No application matching changed to accommodate that probe.

## Caps and Limits

The native baseline is 40 ordinary elemental Totem resistance and 75 maximum.
Adding 100 ordinary resistance produces 140 total but 75 effective. Adding only
maximum resistance leaves effective resistance at 40. Adding both reaches 90,
not 175 or 140. All-elemental modifiers leave Chaos unchanged. Player/minion
resistance modifiers do not transfer to Totem resistance.

Native general physical reduction caps at 90; PDR ownership is tested as a
Totem-keyword raw modifier. The native runtime does not expose a complete separate
Totem PDR/recovery calculation in these fixtures, so no claim of actual capped
Totem mitigation or regeneration per second is made. The app retains raw values,
not clamped scores: base stats, Armour, hit size, overwhelm, overrides, recovery
rates, prohibitions and uptime would require a whole-build evaluator.

Evidence is retained under ignored `var/totem-defence-preferences-20261107/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/totem-defence-preferences-20261107/review.lua --job var/totem-defence-preferences-20261107
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/totem-defence-preferences-20261107/native-check.lua --job var/totem-defence-preferences-20261107
node var/totem-defence-preferences-20261107/verify.mjs
```

Existing fourteen missing-node startup messages do not prevent the final checks.

## Coverage and Validation

Preferences 114 -> 124. Twelve distinct wordings add thirteen occurrences:
area 2, range 2, ordinary resistance 2, maximum resistance 4, PDR 2, regeneration
1. Wordings 601 -> 613 of 2,182 (28.1%); occurrences 2,814 -> 2,827 of 5,451
(51.9%). Skills remain 41/399, supports 31/567, families 19 and reviewed pairs
292. This is heuristic wording coverage, not overall completion or performance.
All 42 contexts preserve previous matches/fingerprints and gain only these twelve
reviewed wordings before deliberate baseline refresh.

Focused validation passed 1,228 tests in 26 files, typechecking and no-loss
baseline validation. Tests cover signed/zero/decimal matching, rejected ownership
and conditions, cap-vs-raw-score separation, element fan-out, regeneration units,
native inventory and unchanged manual priorities in every focus. Routing tests
retain negative-value required goals, score a shared branch once per selected
category, avoid base-node rewards and compare unchanged shortest output.
Existing catalog-wide storage/transfer and parameterized picker/tooltip/priority/
remove tests cover the ten new IDs. No automatic suggestions or new panels were
added. No shared UI/layout implementation changed, so no repeated browser matrix
was run for metadata-only additions. Final `npm run validate:release` passed
1,545 tests in 70 files, typechecking, production build, graph validation and the
refreshed coverage baseline. `git diff --check` passed with existing line-ending
warnings only. Local port 5174 returns HTTP 200. No commit, push or deployment
performed.

## Next Proposed Batch

Unconditional generic Damage, Skill Speed and Magnitude of Chill you inflict:
47 current occurrences across three families (18/16/13). Review ownership, speed
fan-out and ailment caps without triple-rewarding one Skill Speed line or
claiming actual DPS/Chill uptime. This is a proposal only; Fireball Concentrated
Area remains on hold.

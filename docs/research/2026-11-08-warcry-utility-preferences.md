# Warcry Speed, Cooldown Recovery and Area

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and isolated PoB runtime. Three opt-in preferences. No graph/assets, point-cost,
solver, shared-control, storage-schema, gem or support changes. Shortest routing
and existing saved priorities remain unchanged.

## Matching and Double-Counting Policy

| Preference | Complete unconditional wording | Normal unit |
| --- | --- | --- |
| Warcry Speed | N% increased/reduced Warcry Speed | 10% increased |
| Warcry Cooldown Recovery Rate | N% increased/reduced Warcry Cooldown Recovery Rate | 10% increased |
| Warcry Area of Effect | Warcry Skills have N% increased/reduced Area of Effect | 10% increased |

Reductions subtract value. Zero, decimal and cancelling values are tested.
Normal units are manual heuristic normalization, not calibrated power or DPS;
High/Highest multiply by two/three. Requires a relevant player Warcry, which may
be a secondary skill. No focus or support automatically selects these priorities.
A minion gem carrying a warcry tag is not evidence that player effects transfer
to it. Existing manual preferences remain usable across all reviewed focuses.

Each literal line scores only its own category. Generic Skill Speed, Cooldown
Recovery Rate and Area of Effect retain their existing categories and are never
copied into the Warcry preferences. Warcry lines never become generic bonuses.
If a node really has separate generic and scoped lines, each genuine modifier
may score once under its selected preference. Native generic speed fanout into
WarcrySpeed/Speed/TotemPlacementSpeed does not create multiple scorer rewards.
Shared route nodes count once, and allocated base nodes do not earn new rewards.

Warcry speed changes action time, not cooldown. Cooldown recovery changes the
recharge rate, not an equal percentage subtraction in seconds. Neither implies
more use when cooldowns, action timing, overrides, charges or bypasses dominate.
Area changes coverage, not an equal radius percentage, per-hit damage, buff
magnitude or empowered-attack area. Actual targets, use frequency, buff uptime,
damage and Full DPS are not simulated. Tooltips carry these qualifications.

Only complete unconditional player wording matches. Conditional/recent/per-charge,
minion/Companion/Totem/ally/enemy and shared-ownership lines remain excluded.
More/less, signed increased syntax, unknown composites, skill-name-specific or
socketed aliases and malformed text are not broadened into these preferences.
Damage with Warcries, empowered attacks, Debilitate, on-use recovery and instant/
fixed-cooldown/ignore-cooldown mechanics remain separate unscored effects.

## Source and Native Evidence

Primary references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[offence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)
and [Warcry skill data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua).
Moving upstream references do not establish byte identity with the tested local
snapshot. Personal PoB builds/settings are untouched.

All six signed native forms parse completely. Speed uses INC WarcrySpeed with
Warcry keyword scope; cooldown uses INC CooldownRecovery with that scope. Area
uses INC AreaOfEffect with a Warcry SkillType tag. Native scoped modifiers apply
to Seismic Cry, not the non-Warcry Fireball control or ordinary Skeletal Sniper.
The existing Fireball Concentrated Area review remains on hold and was not used.

Independent checks reproduce these isolated native outputs:

- Seismic Cry's 0.8-second action becomes 0.8 / 1.2 = 0.666... with 20% increased
  Warcry Speed, or 0.8 / 0.8 = 1 with 20% reduced. Cooldown remains unchanged.
  In this cooldown-limited fixture, speed alone does not increase native use rate.
- Its base eight-second cooldown is divided by 1.2 or 0.8 for signed recovery,
  then rounded up to the runtime's server ticks: 6.699 or 10.032 seconds. The
  baseline also rounds to 8.019. These are snapshot-specific native results,
  not a claim about measured live-game timing.
- 20% increased area yields an area multiplier of 1.2 and rounded radius 43
  from base 40, not radius 48. Reduced area gives multiplier 0.8 and radius 35.
  Native radius rounds the square-root area factor before multiplying/flooring.
- A genuine generic 20% modifier plus a scoped 20% modifier adds to 40%, not two
  multiplicative 1.2 factors. Combined action time is 0.8 / 1.4, cooldown 5.742
  after tick rounding, area multiplier 1.4 and radius 47. Per-hit damage is unchanged.
- A verified ignore-cooldown override yields zero despite positive recovery;
  a verified instant-use flag yields zero action time despite positive speed.
  The initial unreviewed 'Warcries are Instant' alias did not set that flag; the
  final control uses completely parsed 'Using Warcries is Instant'. No failed
  alias is presented as positive evidence. Neither flag is modeled by the app.

All current raw stat values are positive; descriptor and native synthetic
reductions validate penalty handling. Source provenance independently confirms:

| Raw stat ID | Main-tree occurrences |
| --- | ---: |
| warcry_speed_+% | 13 |
| warcry_cooldown_speed_+% | 12 |
| warcry_skill_area_of_effect_+% | 3 |

Urgent Call keeps recovery-on-use unmodeled; Cacophony keeps Warcry damage
separate; Bolstering Yell does not score empowered damage as area; Guttural Roar
keeps Debilitate separate; Escalation does not assume a Recently multiplier.
Ten distinct wordings cover these 28 occurrences across 24 nodes.

Ignored reproducible evidence: `var/warcry-preferences-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/warcry-preferences-20261108/native-check.lua --job var/warcry-preferences-20261108
node var/warcry-preferences-20261108/verify.mjs
```

Six complete forms, 27 native actor fixtures and all 28 raw stat occurrences
passed 142 independent scope/ownership/time/cooldown/area/overlap/source checks.
Existing fourteen missing-node startup messages are unrelated.

## Inventory and Validation

Preferences 157 -> 160. Wordings 747 -> 757 / 2,182 (34.7%); occurrences
3,182 -> 3,210 / 5,451 (58.9%). Every old match and both source fingerprints are
preserved across all 42 contexts. Each gains exactly the ten reviewed wordings
before deliberate baseline refresh. Skills remain 41/399, supports 31/567,
families 19 and reviewed pairs 292. This is heuristic coverage, not overall
project completion or a guarantee of applicability to any particular build.

Quick validation passed 1,413 tests in 35 files, typecheck and no-loss coverage.
Tests cover signs, units, full wording, ownership, zero/decimals, mixed nodes,
manual priorities, catalog-driven controls/save/transfer, required route penalties,
unchanged shortest dispatch and shared/base-node counting. Pure and route tests
select both generic and Warcry preferences to prove no duplicate reward; distinct
genuine modifiers remain independent. One earlier recovery test now recognizes
Warcry cooldowns without promoting them into the generic preference.

One final release validation passed 1,730 tests in 79 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk size warning remains
at 512.46 kB minified / 136.95 kB gzip; the build succeeds. No shared layout,
control or routing contract changed, so no repeated browser matrix was run.

Next proposal: Freeze Threshold and incoming Ignite magnitude/ailment-duration
reductions, keeping threshold, magnitude, duration and expiry rate separate.
Not implemented without approval. Fireball Concentrated Area remains on hold.
No commit, push or deployment authorized by this batch.

# Freeze Threshold and Incoming Ailment Protection

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and isolated PoB runtime. Three opt-in preferences using unchanged controls,
save/transfer schema, point costs and routing engine. No graph/assets, gem or
support changes. Shortest routing and existing saved priorities are unchanged.

## Matching and Units

| Preference | Complete unconditional wording | Normal unit |
| --- | --- | --- |
| Freeze Threshold | N% increased/reduced Freeze Threshold | 10% increased |
| Ignite Magnitude Reduction | N% reduced/increased Magnitude of Ignite on you | 10% reduced |
| Incoming Ailment Duration | N% reduced/increased Duration of Ailments on You | 10% reduced |

Threshold increases are favorable; reductions penalize. Incoming magnitude and
duration reductions are favorable; increases penalize. The units are manual
heuristic normalization, not calibrated power or final protection. High/Highest
multiply by two/three. Raw values above 100 are not capped scores or a claim of
immunity. Immunity, avoidance, current ailment state and beneficial self-ailment
interactions are not modeled. Tooltips describe these limits.

Only complete unconditional player wording matches. Conditional/recent/per-charge,
minion/Companion/Totem/ally/enemy/shared ownership, more/less, signed increased
syntax, unknown composites and malformed numbers remain excluded. Incoming
Freeze/Poison/Ignite-specific durations, elemental-only ailment duration, native
aliases and Energy Shield-derived threshold conversions are not added by this
batch. Existing source/preset/support scope is not broadened automatically.

Each line scores only its own category. Freeze Threshold does not also score as
Elemental Ailment Threshold, Freeze Buildup, incoming Freeze duration or Cold
Resistance. Incoming Ignite magnitude does not score as outgoing Ignite
magnitude, duration or Fire Resistance. A generic incoming ailment-duration line
scores once, not per ailment, as outgoing duration or as debuff expiry speed.
Separate genuine lines may each contribute independently. Shared route nodes
count once; allocated base nodes do not earn new rewards.

Duration reduction and expiry speed are different source types, not interchangeable
percentages. Actual duration can combine them, but the scorer does not multiply
them into a simulated benefit. No current enemy, ailment application, base
duration, cap, conversion, override, final threshold or damage taken is calculated.

## Primary Sources and Native Evidence

Reviewed PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [defence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua),
plus the local game stat descriptors. Moving upstream links do not establish
byte identity with the tested isolated snapshot. Personal builds/settings remain
unchanged. Fireball is only a native non-minion control here; its Concentrated
Area support review remains on hold and was not used.

All six signed forms parse completely as unqualified INC FreezeThreshold,
SelfIgniteEffect or SelfAilmentDuration, with no minion or skill tags. Parsing
does not imply complete native calculation coverage:

- FreezeThreshold retains its signed source in ModDB, but no player output or
  calculation is present in the reviewed runtime. Both positive and negative
  fixtures leave the generic AilmentThreshold and avoidance outputs unchanged.
  The game descriptor backs the literal preference. No final Freeze threshold
  or Freeze protection formula is invented or presented as native-verified.
- 20% reduced incoming Ignite magnitude produces native SelfIgniteEffect 80;
  20% increased produces 120. Duration and outgoing damage are unchanged. A
  genuine outgoing Ignite magnitude line affects outgoing Ignite damage through
  its own Ignite-keyword AilmentMagnitude modifier, not SelfIgniteEffect.
- 20% reduced incoming ailment duration produces 80% duration, and 20% increased
  produces 120%. Ignite, Freeze, Chill, Shock, Poison and Bleed controls agree.
  Blind is a non-ailment debuff control and remains unchanged.
- 20% faster debuff expiry instead gives 100 / 1.2 = 83.333... percent duration.
  With a separate 20% reduced ailment-duration source, the result is 80 / 1.2 =
  66.666... percent. Blind still follows only expiry. INC duration and BASE
  expiry remain separate in native sources and the app scorer.
- Native 100% reduction endpoints give zero incoming duration or zero Ignite
  effect, but do not set avoidance/immunity. Zero effect does not remove the
  duration modifier. Raw preference scores are not equivalent to those flags.
- Player protection does not transfer to an ordinary Skeletal Sniper. Existing
  outgoing Ignite/Freeze/duration and resource-pool fields remain unchanged in
  the signed player fixtures. No minion incoming-protection matcher is added.

All 19 source occurrences independently trace to extracted game stats:

| Raw stat ID | Occurrences | Current raw sign |
| --- | ---: | --- |
| freeze_threshold_+% | 8 | Positive |
| ignite_effect_on_self_+% | 8 | Negative |
| base_all_ailment_duration_on_self_+% | 3 | Negative |

All are favorable despite different raw signs. Twelve distinct wordings are
added. Opposite signs, decimals, zero and cancellation remain tested. Chillproof
keeps Armour/Chill protection separate, Cold Coat keeps outgoing Freeze Buildup
separate, Flamekeeper keeps outgoing Ignite/Fire Damage separate, Shedding Skin
keeps Elemental Ailment Threshold separate, and The Raging Ox keeps Strength
separate. Energy Shield-derived threshold and reflected-Ignite mechanics remain
unmodeled rather than inferred from node names.

Ignored reproducible evidence: `var/incoming-ailment-preferences-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/incoming-ailment-preferences-20261108/native-check.lua --job var/incoming-ailment-preferences-20261108
node var/incoming-ailment-preferences-20261108/verify.mjs
```

Six complete signed forms, 19 actor fixtures and all 19 raw source occurrences
passed 375 independent sign/ownership/threshold-gap/magnitude/duration/expiry/
source checks. Existing fourteen missing-node startup messages are unrelated.

## Coverage and Validation

Preferences 160 -> 163. Wordings 757 -> 769 / 2,182 (35.2%); occurrences
3,210 -> 3,229 / 5,451 (59.2%). All 42 contexts preserve every old match and
both source fingerprints, gaining exactly the twelve reviewed wordings before
deliberate baseline refresh. Skills remain 41/399, supports 31/567, families 19
and reviewed pairs 292. These are heuristic measures, not overall completion.

Quick validation passed 1,430 tests in 36 files, typecheck and no-loss coverage.
Tests cover signs, ownership, zero/decimals, unclamped raw scores, complete
wording, mixed nodes, manual settings, catalog-driven controls/save/transfer,
required route penalties, unchanged shortest, no outgoing/expiry double counting
and shared/base-node rewards. An earlier elemental-ailment test now recognizes
incoming Ignite protection without promoting it into outgoing categories.

One final release validation passed 1,747 tests in 80 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk size warning remains
at 514.14 kB minified / 137.23 kB gzip; the build succeeds. No shared layout,
control or routing contract changed, so no repeated browser matrix was run.

Next proposal: generic outgoing Ailment Magnitude, Immobilisation Buildup and
outgoing Slow Magnitude, reviewing generic/specific overlap and keeping incoming
protection separate. Not implemented without approval. Fireball Concentrated
Area remains on hold. No commit, push or deployment authorized by this batch.

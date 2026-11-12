# Generic Ailment Magnitude, Immobilisation and Outgoing Slow

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and isolated PoB runtime. Three opt-in Utility preferences. No graph/assets,
point-cost, solver, shared-control, storage-schema, gem or support changes.
Shortest routing and existing saved priorities remain unchanged.

## Matching and Double-Counting Policy

| Preference | Complete unconditional wording | Normal unit |
| --- | --- | --- |
| Ailment Magnitude | N% increased/reduced Magnitude of Ailments you inflict | 10% increased |
| Immobilisation Buildup | N% increased/reduced Immobilisation buildup | 10% increased |
| Outgoing Slow Magnitude | Debuffs you inflict have N% increased/reduced Slow Magnitude | 10% increased |

Increases score positively; reductions penalize. Decimal/zero/cancelling values
are tested. Raw scores above 100 are not capped damage, immunity or guaranteed
control. Normal units are manual normalization, not calibrated power; High and
Highest multiply by two/three. Requires applicable player-origin effects/hits.
No focus or support automatically selects these preferences.

Each generic line scores once in its own category. It is not copied into
damaging-ailment, Poison, Bleeding, Ignite, Chill or Shock magnitude, nor into
Freeze, Electrocute, Pin or Stun Buildup. Outgoing Slow is not incoming slow
protection, Curse Magnitudes, Chill-specific magnitude, duration, expiry or damage.
Specific lines do not become generic rewards either. Separate genuine generic
and specific lines can each contribute once under selected preferences. Shared
route nodes count once; allocated base nodes do not earn new rewards.

Generic magnitude does not grant application, chance, buildup, duration or extra
hit damage. Generic Immobilisation buildup requires eligible hits and allowed
application; it does not grant Pin/Electrocute/Freeze or damage. Outgoing Slow
requires an applicable slowing debuff. Enemy thresholds, conversions, prohibitions,
ailment/slow caps, target state, ownership/inheritance and actual DPS or control
frequency/uptime are not simulated. Tooltips carry these limits.

Only complete unconditional wording matches. Conditional/recent/per-charge,
marked-enemy, weapon-specific, minion/Companion/Totem/ally/enemy/shared ownership,
more/less, signed increased syntax, unknown composites and malformed values are
excluded. Non-damaging-ailment aliases, American 'Immobilization', Ballista/Hazard
scope, generic 'Ailment Effect', incoming slow and direct enemy movement reduction
are not inferred or silently added by this batch.

## Primary Sources and Native Checks

Reviewed PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [offence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua),
plus local game stat descriptors. Moving upstream links do not establish byte
identity with the tested local snapshot. Personal builds/settings are unchanged.

Four signed forms parse completely as INC AilmentMagnitude or
EnemyImmobilisationBuildup, with no keyword, ownership or skill tags. Generic
native magnitude can contribute to multiple applicable ailment calculations;
that does not create multiple independent scorer rewards. A raw ModDB query with
the Hit keyword also sees the unqualified AilmentMagnitude stat, but native hit
damage is unchanged: matching a keyword query is not extra hit-damage scaling.

Independent checks reproduce these isolated native results:

- Bonestorm fixtures have explicit 20% Poison/Bleeding chance controls and real
  Physical source damage. Generic 20% increased/reduced magnitude multiplies
  their Poison and Bleed DPS by 1.2/0.8; hit damage, chance, durations and buildup
  remain unchanged. This fixture arithmetic is not a universal Full DPS formula.
- Generic 20% increased/reduced Immobilisation buildup multiplies Frostbolt's
  positive Freeze buildup and Bonestorm's positive Heavy Stun buildup by 1.2/0.8.
  Pin/Electrocute remain zero in these fixtures. Non-hit Enfeeble does not acquire
  buildup. The modifier does not create otherwise unavailable application.
- A genuine generic 20% buildup line plus 20% Freeze Buildup produces 40% total
  Freeze scaling, not two multiplicative factors or duplicate generic bonuses.
- Generic magnitude plus a separate Chill-specific line contributes 20 + 20 to
  the native modifier sources. The default Frostbolt fixture does not produce a
  final Chill-effect output at its current damage/threshold; this source check
  is not presented as a measured final Chill/slow result.
- Player modifiers do not transfer to an ordinary Skeletal Sniper. A completely
  parsed positive minion-only control supplies its own magnitude/buildup sources
  and scales its eligible Heavy Stun buildup by 1.2 without granting player stats.

Outgoing Slow Magnitude is a disclosed native gap. Both exact increased/reduced
game forms return no modifiers and an unparsed remainder. Fresh native fixtures
match baseline outputs, which does not prove the game effect is absent: the
runtime cannot model this wording. The game descriptor backs the literal app
preference. No enemy speed, stacking or uptime formula is invented.

All current raw values are favorable; native/synthetic reductions remain tested.
Source provenance independently confirms every occurrence:

| Raw stat ID | Main-tree occurrences |
| --- | ---: |
| ailment_effect_+% | 8 |
| hit_damage_immobilisation_multiplier_+% | 8 |
| base_debuff_slow_magnitude_+% | 12 |

Eleven wordings cover 28 occurrences. Lasting Trauma retains its -5% Attack Speed
penalty and separate damaging-ailment duration; Radial Force retains Area of
Effect; Personal Touch retains Attack Damage; Time Manipulation retains incoming
debuff expiry; Chronomancy retains Skill Effect Duration. Exposure, conditional
damage against Hindered/Immobilised enemies and Hinder Duration remain unmodeled.

Ignored reproducible evidence: `var/generic-ailment-control-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/generic-ailment-control-20261108/native-check.lua --job var/generic-ailment-control-20261108
node var/generic-ailment-control-20261108/verify.mjs
```

Four complete signed native forms, 21 actor fixtures and all 28 raw occurrences
passed 439 independent magnitude/buildup/ownership/stacking/application/source
checks. Existing fourteen missing-node startup messages are unrelated.

## Inventory and Validation

Preferences 163 -> 166. Wordings 769 -> 780 / 2,182 (35.7%); occurrences
3,229 -> 3,257 / 5,451 (59.8%). All 42 contexts retain every old match and both
source fingerprints, gaining exactly the eleven reviewed wordings before
deliberate baseline refresh. Skills remain 41/399, supports 31/567, families 19
and reviewed pairs 292. These are heuristic coverage, not overall completion.

Quick validation passed 1,447 tests in 37 files, typecheck and no-loss coverage.
Tests cover signs, units, ownership, complete wording, zero/decimals, raw scores,
mixed-node penalties, manual settings, catalog-driven controls/save/transfer,
required route penalties, unchanged shortest and shared/base rewards. Generic
and specific preferences selected together do not double-count. Separate genuine
lines remain independent. Two earlier expectations now recognize generic
magnitude without removing their scope, duration or penalty guards.

One final release validation passed 1,764 tests in 81 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk size warning remains
at 515.86 kB minified / 137.56 kB gzip; the build succeeds. No shared layout,
control or routing contract changed, so no repeated browser matrix was run.

Next proposal: Charm charge gain/generation, charge-cost reduction and effect
duration, reviewing Flask/Charm separation and combined wording. Not implemented
without approval. Fireball Concentrated Area remains on hold. No commit, push
or deployment authorized by this batch.

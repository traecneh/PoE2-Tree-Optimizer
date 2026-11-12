# Casting Support Checkpoint Reconciliation

This records the support work already present before the utility/recovery batch.
The coverage report showed 21 choices, 14 families and 102 reviewed pairs, but
the roadmap ledger omitted the preceding seven-choice casting checkpoint.
No older support definitions were undone or retroactively claimed as new here.

## Existing Implemented Batch

Five families were reviewed together for the ten elemental spell presets:
Controlled Destruction, Projectile Acceleration, Considered Casting, Rapid
Casting and Spell Echo. Seven choices were added: Acceleration I/II, Considered
Casting, Rapid Casting I/II/III and Echo. Acceleration III and Controlled
Destruction were extended within their existing families.

The batch changes choices 14/567 -> 21/567, configured families 11 -> 14 and
curated pairs 44 -> 102. Positive-tier choices 14/450 -> 21/450. Skills stay
24/399. Base-focus passive wording coverage does not increase: support context
and compatibility are different measures from the passive wording union.
At that checkpoint, choices comprised 11 implemented-priority/refinement entries and ten
context-only/partial entries; none represents complete support mechanics.

## Verified Native Evidence

The isolated PoB 0.23.1 driver evaluated 90 base-self-cast skill/support pairs
through calcLib.canGrantedEffectSupportActiveSkill. Four negative probes passed:
triggered Comet rejects Considered Casting/Echo; fixed-speed Frostbolt rejects
Acceleration III; fixed-cast-time Comet rejects Rapid Casting III. These checks
were rerun during reconciliation, not inferred from an old note.

A fresh comparison mapped presets through the catalog effect IDs and confirmed
all 58 newly admitted curated pairs against that native matrix. The app's whole
allowlist totals 102 pairs; this matrix specifically covers the added 58, not a
fresh native audit of every older pair or every possible combination.

- Controlled Destruction covers all ten new damaging spell focuses, warns about
  manual crit chance/bonus and blocks reviewed spell-critical scope only.
- Acceleration I/II/III is limited to Frostbolt in the new spell batch. Nine
  other legal projectile pairs remain withheld because speed benefits, dwell or
  delivery are not yet reviewed. Legal linking alone is not a passive benefit.
- Considered Casting and Rapid Casting I/II/III cover all ten base self-cast
  focuses. Considered suggests High cast-speed priority only when explicitly
  applied; Rapid choices do not invent passive bonuses. III is rotation-dependent.
- Echo covers Ice Nova, Comet, Firestorm, Frost Bomb and Frost Wall, matching
  Cascadable eligibility. Echo-only area, repeat cadence and DPS are not scored.

Sources are the isolated native checker plus upstream
[support Int data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua),
[support Dex data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua)
and [native checker](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcTools.lua).
Moving upstream references are not claimed byte-identical to the local snapshot.
Support magnitudes are explanatory evidence, never DPS score multipliers.

## Validation and Limits

Existing focused tests cover tier replacement, first-family load normalization,
explicit apply, preserved manual weights/budgets, saved/JSON transfer, scoped
crit blocking and Fireball's Concentrated Area hold. The preceding release
validation passed 1,059 tests including these support tests; the current combined
release will revalidate them alongside the newer utility/recovery work.
No historical completed browser flow is asserted: this metadata-only batch
changed no shared control implementation, and DOM workflow checks cover it.

The local native rerun and 58-pair comparison passed. Current combined release
validation passed 1,087 tests in 61 files, typecheck, production build, graph
validation and the refreshed baseline. No commit, push, publish or deployment was performed.
At that checkpoint the raw denominator left 546/567 support choices unconfigured, including
catalog-only/zero-tier entries needing eligibility review. No overall 95-100%
completion claim follows from this checkpoint.

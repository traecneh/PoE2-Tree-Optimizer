# Percentage-Life Regeneration, Mana Efficiency and Debuff Expiry

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and existing isolated PoB runtime. Three opt-in preferences; no graph/assets,
solver, point-cost, storage-schema, gem/support or shared-control changes.

## Literal Matching and Units

| Preference | Complete unconditional wording | Normal unit |
| --- | --- | --- |
| Life Regeneration (% Life) | Regenerate N% of maximum Life per second | 0.2% of maximum Life per second |
| Mana Cost Efficiency | N% increased/reduced Mana Cost Efficiency | 10% increased |
| Debuff Expiry Speed | Debuffs on you expire N% faster/slower | 10% faster |

The Life preference represents a regeneration source, not increased regeneration
rate, flat Life per second or maximum Life. Raw game values use per-minute units,
but displayed graph wording is already per second. The matcher scores the
displayed numeric value once, without dividing by 60 again. Life source, existing
Life Regeneration Rate and maximum Life remain independent preference categories.
Separate genuine source and rate lines may each score; they are not multiplied
inside the raw node scorer. The Normal unit is a manual normalization choice,
not a calibrated power/performance estimate.

Efficiency is a relative modifier to Mana skill costs, not a regeneration source,
flat cost reduction, reservation efficiency or increased maximum Mana. Increased
efficiency scores positively, reduced negatively. Expiry is incoming debuff rate,
not duration percentage, effect reduction, avoidance/immunity or outgoing skill
duration. Faster scores positively, slower negatively. High/Highest multiply
Normal by two/three. Scores do not calculate current costs or debuff durations.

Only full unconditional player wording matches. Conditional/recent/per-charge,
minion/Companion/Totem/ally/enemy ownership, more/less, malformed, unknown composite
and unreviewed aliases remain separate. Command/Mark/attack-specific efficiency,
flat Life regeneration, temporary or conditional regeneration, outgoing debuff
expiry, buff expiry and incoming effect reduction are not promoted into these
three preferences. Negative/signed Regenerate wording is not implemented; it is
not claimed as a native parsed form or silently converted into degeneration.
No current source in this batch has that negative raw value.

Manual settings persist across all focuses; no automatic preset/support priorities
change. Requires a Mana-costing skill to benefit from efficiency. Regeneration
prohibitions/conversions, gear, recovery modifiers, final costs, duration bounds,
debuff refresh and actual sustain/protection are not calculated by this heuristic.

## Source and Native Evidence

Primary references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[defence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua)
and [cost calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
Moving upstream references do not establish byte identity with the isolated
tested local snapshot. Personal builds and installed PoB settings are unchanged.

Four forms parse completely: Life source -> BASE LifeRegenPercent; signed Mana
efficiency -> INC ManaCostEfficiency; faster expiry -> BASE SelfDebuffExpirationRate.
Each retains its own native type and does not create a MinionModifier. Fifteen
fresh actor fixtures cover Spark, an ordinary Skeletal Sniper, rate without a
source, source plus rate, larger Life pool, disabled regeneration and a positive
minion-only source control.

Independent arithmetic checks reproduce these isolated native outputs:

- A player with 1,187 final Life and a 1%-per-second source regenerates 11.9 Life
  per second after native one-decimal rounding. A 20% rate increase alone still
  regenerates zero without a source. Source plus that rate gives 14.2, calculated
  from unrounded source amount before rounding, not from 11.9 rounded twice.
- A larger final Life pool changes recovery according to the final pool, not an
  assumption that flat added Life bypasses native pool modifiers. The native
  NoLifeRegen prohibition sets recovery to zero despite the retained source.
- Spark's 56 Mana cost becomes 56 / 1.2 = 46.666... with 20% increased efficiency,
  or 56 / 0.8 = 70 with 20% reduced efficiency. This is not 20% flat cost reduction.
  Other cost modifiers and rounding can interact; these exact fixtures do not
  justify a universal final-cost formula for every build. A zero-Mana-cost
  summoning skill stays at zero and its Spirit reservation is unchanged.
- 20% faster expiry changes the native duration modifier from 100 to 100 / 1.2
  = 83.333... percent. Incoming Poison/Chill duration fields follow that rate;
  outgoing Spark duration and incoming Shock effect remain unchanged. It is not
  a 20% duration subtraction or an effect reduction.
- Player modifiers do not transfer to ordinary minions. The positive minion-only
  source uses the minion's own final Life pool and does not supply player recovery.

The first minion control used an unreviewed 'their maximum Life' alias and did
not provide a valid positive control. Final evidence corrects it to the fully
parsed native wording without 'their', asserts MinionModifier and verifies actual
minion recovery. No failed control is presented as successful ownership evidence.

Slower expiry is a native parser gap: it returns no modifiers and an unparsed
remainder. Its exact game descriptor supplies the app's literal negative form;
no native slower-duration result is claimed. Signed negative regeneration also
does not parse and remains excluded from the app source matcher. These gaps do
not count as fully supported native forms. The tooltips distinguish raw units,
reciprocal behavior and unmodeled prohibitions/limits without adding simulation.

All 32 main-tree occurrences trace independently to extracted raw stats:

| Raw stat | Occurrences | Native/display distinction |
| --- | ---: | --- |
| life_regeneration_rate_per_minute_% | 12 | Raw value / 60 becomes displayed % per second |
| base_mana_cost_efficiency_+% | 11 | Increased/reduced efficiency, not flat cost |
| debuff_time_passed_+% | 9 | Faster/slower BASE expiry rate |

All current raw values are favorable. Native and synthetic negative efficiency,
synthetic slower expiry, zero and decimal matcher cases remain tested. Life
source values 6/12/30/45/60 per minute render as 0.1/0.2/0.5/0.75/1 per second.
Mass Rejuvenation's ally source, Hard to Kill's flask recovery rate, Flow of Life's
recoup speed, Sanguimantic Rituals' Arcane Surge conversion and triggered spell
damage remain independent unmodeled effects. Separate existing Mana regeneration,
slow protection, minion reservation efficiency and Strength remain intact.

Evidence is retained under ignored `var/resource-sustain-expiry-20261108/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/resource-sustain-expiry-20261108/native-check.lua --job var/resource-sustain-expiry-20261108
node var/resource-sustain-expiry-20261108/verify.mjs
```

Four complete native forms and 15 final actor fixtures passed 225 independent
ownership/source/rate/reciprocal/source-unit checks, including all 32 raw graph
occurrences. Existing fourteen missing-node startup messages are unrelated.

## Inventory and Validation

Preferences 150 -> 153. Fourteen new wordings add 32 occurrences: wording
721 -> 735 of 2,182 (33.7%); occurrences 3,122 -> 3,154 of 5,451 (57.9%). Skills
stay 41/399, supports 31/567, families 19 and reviewed pairs 292. These are
heuristic coverage measures, not overall completion or performance accuracy.

All 42 contexts preserve every old match and both source fingerprints, gaining
exactly the reviewed fourteen wordings before deliberate baseline refresh.
Quick validation passed 1,376 tests in 33 files, typecheck and no-loss coverage.
Tests cover complete wording, ownership, zero/decimals, signed efficiency/expiry,
unimplemented negative sources, separate categories, exact mixed nodes, manual
settings and catalog-wide control/persistence paths. One earlier recovery test
now recognizes the source while retaining its rate/pool/conversion checks.

Routing fixtures retain required efficiency/expiry penalties, choose sources
without borrowing rate-only or minion bonuses, compare unchanged shortest
results and count shared/base nodes correctly. Distinct source/rate lines can
score independently. No shared layout or route contract changed; no repeated
browser matrix was run. Final `npm run validate:release` passed 1,693 tests in
77 files, typechecking, production build, graph validation and the deliberately
refreshed coverage baseline. Local port 5174 returns HTTP 200. `git diff --check`
passed with existing line-ending warnings only. Main production chunk is
508.73 kB minified (136.22 kB gzip); the existing Vite 500 kB warning remains,
not a build failure or measured runtime regression. No warning limit was raised.
No commit, push or deployment performed.

## Next Proposed Batch

Recoup speed, Life/Mana recovery on Kill and Flask Effect Duration. Their four
favorable unconditional templates cover 28 current occurrences (10/6/6/6);
review opposite signs, units, ownership and recovery/duration interactions before
implementation. Keep per-event recovery, delivery speed, duration and total
amount separate, without assuming kill rate, active flasks or guaranteed sustain.
Proposal only; Fireball Concentrated Area remains on hold.

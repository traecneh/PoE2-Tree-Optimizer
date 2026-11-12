# Ailment Application Chance Preferences

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph, extracted game tables
and existing isolated PoB runtime. Four opt-in preferences; no solver, graph,
assets, point-cost, storage-schema, gem/support or shared-control changes.

## Literal Matching and Scoring

| Preference | Complete unconditional line | Normal score unit |
| --- | --- | --- |
| Poison Chance on Hit | N% chance to Poison on Hit | 5 percentage points |
| Bleeding Chance on Hit | N% chance to inflict Bleeding on Hit | 5 percentage points |
| Daze Chance on Hit | N% chance to Daze on Hit | 5 percentage points |
| Generic Ailment Chance | N% increased/reduced chance to inflict Ailments | 10% relative increase |

Flat signed numbers, including negative and decimal values, stay in their
specific category. Increased/reduced generic chance stays in `ailmentChance`;
reductions subtract value. High/Highest multiply the normal score by two/three.
These units are user preference weights, not calibrated performance estimates.
No increased-specific wording is interpreted as flat chance. No flat generic
wording is interpreted as relative chance. Generic chance is not copied into
Poison/Bleeding/Daze values or used as a multiplier inside this raw-stat scorer.

One 20% flat Poison line plus a 50% increased generic chance line stores
`poisonChance: 20, ailmentChance: 50`. With both Normal preferences selected the
heuristic score is 4 + 5 = 9, not a probability. The native Poison/Bleeding
calculation for this fixture is 20 * (1 + 50 / 100) = 30%, not 70%. Generic
increased chance without any base chance remains zero in the native fixtures.

Only complete outgoing unconditional wording matches. Conditional/recent-event,
per-charge, weapon/skill scoped, minion/Companion/ally/enemy-owned, malformed,
more/less and unreviewed composite wording are excluded from these preferences.
Always-Poison/Bleed and Dazes-on-Hit aliases/overrides are deliberately not added.
Duration, magnitude, damage, incoming ailment protection and buildup are separate.
No automatic focus/support priorities are added; manual selections persist across
all focuses. The unchanged catalog-driven picker, tooltips and save/transfer paths
handle the new IDs.

## Native and Source Evidence

Primary references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [offence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
Moving upstream references are not byte-identity claims about the tested local
snapshot. Existing isolated runtime fixtures do not edit personal builds or
installed PoB settings.

Eight signed native forms parse completely. Flat Poison/Bleed map to BASE
PoisonChance/BleedChance; flat Daze maps to BASE DazeChance with the Hit flag.
Generic chance maps to INC AilmentChance, including a negative value for reduced
chance. Both spell-hit and attack-hit ModDB lookups preserve the signed values;
Daze does not match a non-Hit lookup. No tested player line is a MinionModifier.
Negative flat forms are parser/ModDB checks, not claims about negative final
application probability.

Twenty-seven fresh actor fixtures cover Bonestorm, Dark Effigy's actual Vile
Effusion hit component, ordinary Skeletal Sniper ownership controls, non-hitting
Enfeeble, mixed base/relative modifiers and over-100% inputs. Independent arithmetic
checks confirm 20% base with +50% increased gives 30%, with 50% reduced gives 10%,
and the tested Poison/Bleeding hit/crit chance fields cap at 100%. Neither cadence
nor Life changes. Player bonuses do not transfer to the ordinary minion. Positive
minion-only controls supply raw minion Poison/Bleed base and generic increased
chance without transferring to the player.

Important limits:

- The runtime does not expose a final Daze probability here. Its flat Hit modifier
  is verified, but generic scaling of Daze and Daze uptime are not assumed.
- The tested minion exports raw modifier values but omits final ailment chance
  fields. Positive ownership controls are not claimed as a computed 30% minion
  application probability.
- Poison/Bleeding chance fields alone do not prove damage eligibility. For
  example, a Bleed chance field on a Chaos-only hit is not evidence that this hit
  can actually inflict Bleeding. Damage prerequisites, hit chance, conversions,
  stack/replacement limits, overrides and actual probabilities remain unmodeled.
- Native source contains CannotPoison/CannotBleed and non-hit guards. The
  non-hit guard is runtime-tested; prohibition literals were not available as
  reviewed parsed fixtures. Prohibitions are source-reviewed, not claimed as
  successful runtime cases or implemented applicability logic.
- Raw preference values are not capped probabilities, actual damage or Full DPS.

All 68 graph occurrences trace independently to extracted PassiveSkills/Stats
entries: `base_chance_to_poison_on_hit_%` (13),
`base_chance_to_inflict_bleeding_%` (17), `base_chance_to_daze_%` (17), and
`ailment_chance_+%` (21). No negative values occur in these four main-tree stat
families in this snapshot; signed forms remain explicitly tested.

Evidence is retained under ignored `var/ailment-application-preferences-20261107/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/ailment-application-preferences-20261107/native-check.lua --job var/ailment-application-preferences-20261107
node var/ailment-application-preferences-20261107/verify.mjs
```

Eight parser/type/ownership forms passed, with 277 independent JavaScript
type/ownership/arithmetic/source checks across 27 actor fixtures and all 68
extracted stats. Existing fourteen missing-node startup messages are unrelated
to these checks.

## Inventory and Validation

Preferences 127 -> 131. Eleven new wordings add 68 occurrences: wording
635 -> 646 of 2,182 (29.6%); occurrences 2,880 -> 2,948 of 5,451 (54.1%). Skills
stay 41/399, supports 31/567, families 19 and reviewed pairs 292. These are
heuristic wording-coverage measures, not overall completion or performance accuracy.

All 42 contexts retain every previous match and both source fingerprints, gaining
exactly the reviewed eleven wordings before deliberate baseline refresh. Quick
validation passed 1,264 tests in 28 files, typechecking and no-loss coverage.
Tests cover signs/zero/decimals, flat-vs-relative separation, ownership/condition
exclusions, mixed real nodes, raw-score-vs-cap distinction, manual preference
preservation and catalog-wide control/persistence behavior. Three earlier
unsupported-wording expectations were updated for newly supported chance lines.

Routing checks retain required negative-value goals, compare unchanged shortest
results, count shared nodes once, avoid already allocated base-node rewards and
keep generic chance from creating duplicate specific-chance contributions. No
solver or route contract changed. No repeated browser matrix is required for
metadata-only additions using unchanged controls.

Final `npm run validate:release` passed 1,581 tests in 72 files, typechecking,
production build, graph validation and the deliberately refreshed coverage
baseline. Local port 5174 returns HTTP 200. `git diff --check` passed with existing
line-ending warnings only. No commit, push or deployment performed.

## Next Proposed Batch

Electrocute and Pin Buildup, Daze Duration, and generic damaging-ailment magnitude
and duration. These five unconditional positive templates cover 35 current
occurrences (11/10/1/4/9); review negative forms and native applicability too.
Keep buildup separate from chance, duration and magnitude, and avoid copying
generic bonuses into each specific ailment score. This is a proposal only;
Fireball Concentrated Area remains on hold.

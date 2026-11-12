# Armour Break Amount, Effect and Duration

Reviewed across 2026-11-07/08 against the bundled PoE2 0.5.5f graph, extracted
game tables and existing isolated PoB runtime. Three opt-in preferences; no
graph/assets, solver, point-cost, storage-schema, gem/support or shared-control
changes. This review does not enable Armour Break automatically for any preset.

## Matching and Scoring

| Preference | Complete unconditional wording | Normal unit |
| --- | --- | --- |
| Armour Break Amount | Break N% increased/reduced Armour | 10% increased |
| Fully Broken Armour Effect | N% increased/reduced effect of Fully Broken Armour | 10% increased |
| Armour Break Duration | N% increased/reduced Armour Break Duration | 10% increased |

Reductions retain negative values; High/Highest multiply Normal by two/three.
These are raw relative preference units, not flat Armour removed, percentage
points of damage taken or calculated uptime. Each real modifier scores once in
its own category, not as a sibling category, player Armour, Physical Damage or
generic Skill Effect Duration. Separate genuine stat lines may score separately.

Only complete unconditional wording matches. Conditional/recent-event,
per-charge, weapon/skill scoped, minion/Companion/ally/enemy-owned, malformed,
more/less, unknown composite and unreviewed alias forms remain excluded. Incoming
Armour Break taken, triggers that grant break, below-zero permissions, elemental/
all-damage extensions and faster expiry are not promoted into these preferences.
Manual choices persist across all focuses, but selecting a preference does not
validate that a build can apply it. No automatic skill/support suggestions change.

Application requirements are explicit in tooltips:

- Amount needs an Armour-breaking skill/effect; an increased amount modifier
  alone is not a source of Armour Break and is not flat Armour removed per hit.
- Fully Broken Armour effect needs that enemy state. The native default affects
  Physical hits, not all damage types or damage over time. Special damage-type
  extensions and shared enemy debuffs are not simulated by this preference.
- Duration needs outgoing Armour Break. Base duration, consumption/refresh,
  enemy expiry modifiers and actual uptime are not calculated.

## Source and Native Evidence

Primary references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[offence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua),
[effect processing](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua)
and [skill stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua).
Moving upstream links do not imply byte identity with the isolated local
snapshot. No personal builds or installed PoB settings were modified.

Three forms parse completely: increased amount -> INC ArmourBreakPerHit;
increased/reduced fully-broken effect -> signed INC FullyBrokenArmourEffect.
These are not BASE application, generic Armour, Physical Damage or MinionModifier
stats. Seventeen fresh fixtures use Bonestorm, Armour Breaker, ordinary Skeletal
Sniper, a configured fully-broken enemy, an explicit Fire extension and a positive
minion-only raw-stat control.

The initial Armour Breaker probe lacked a usable weapon and supplied no actual
attack output. The final evidence corrects that fixture with the established
plain Wooden Club setup, verifying a real native base break value of 4,918 and
the CanArmourBreak flag. +20% amount yields 5,901.6 = 4,918 * 1.2. Bonestorm's
base break remains zero under the same amount increase; no application flag or
damage boost is invented. Effect alone does not change amount or force the enemy
state. Life, attack/cast cadence and damage remain unchanged in unbroken cases.

With the fully-broken target state explicitly configured, native Physical hit
damage taken is 20 at baseline, 24 at +20% effect, and 16 at 20% reduced effect.
This is relative scaling, not 20 extra percentage points or a universal 20% DPS
gain. Independent arithmetic reproduces both those values and the isolated
Bonestorm hit result from their separate remaining damage factors. Default
Physical DoT, Fire and all-hit damage-taken channels remain unchanged. Fire
requires the separate explicit extension fixture; that is not enabled by the
numeric effect preference itself. Configuring the enemy state is not evidence
that Bonestorm acquired a source of Armour Break or can maintain it.

Player numeric modifiers do not transfer to ordinary minion stat lists. The
positive minion control changes its raw effect modifier, not the player's.
This does not claim that a real applied enemy debuff cannot benefit minion hits:
shared debuff attribution, application and ownership interactions are unmodeled.

Native parsing gaps are preserved rather than patched or hidden:

- Reduced amount does not parse, but its exact game descriptor has a signed
  reduced form. The app uses that verified literal form for negative values.
- Armour Break Duration partially parses as generic Armour with an unparsed
  Break Duration remainder. That is not accepted as duration support or scored
  as player Armour. The app uses its exact signed game descriptor; no native
  duration result is exposed or claimed by these fixtures.
- The game fully-broken effect descriptor has only an increased template in
  this snapshot. Reduced wording is independently accepted by the complete
  native parser and receives a verified negative effect calculation. No
  nonexistent reduced game template is claimed.

Enemy Armour, default or below-zero limits, consumption, thresholds, target state,
hit frequency, final duration and actual uptime/DPS remain outside this heuristic.
No additional prerequisite UI or automatic build applicability is introduced.

All 35 current graph occurrences independently trace to extracted raw stats:

| Raw game stat | Occurrences | Negative values |
| --- | ---: | ---: |
| armour_break_amount_+% | 21 | 0 |
| broken_armour_and_sundered_armour_debuff_effect_+% | 10 | 0 |
| armour_break_and_sundered_armour_duration_+% | 4 | 0 |

Amount and duration game descriptors include positive/negative forms with the
negative display transform. Current raw values are positive; synthetic negative
app cases and the available native reduced-effect case are tested separately.
Breakage's chance to defend with extra Armour, The Molten One's Gift's Fire
extension, and application triggers remain unmodeled distinct effects. Tempered
Mind retains its separate Physical Damage and Strength lines.

Evidence is retained under the ignored directory started on November 7:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/armour-break-preferences-20261107/native-check.lua --job var/armour-break-preferences-20261107
node var/armour-break-preferences-20261107/verify.mjs
```

Three complete native forms and 17 actor/state cases pass 208 independent
ownership/prerequisite/arithmetic/source checks, including every raw graph
occurrence. Unparsed reduced amount and partial duration are not counted as
successful native forms. Existing fourteen missing-node startup messages remain
unrelated. The final valid-weapon fixtures replace the incomplete initial probe.

## Inventory and Validation

Preferences 147 -> 150. Twelve new wordings add 35 occurrences: wording
709 -> 721 of 2,182 (33.0%); occurrences 3,087 -> 3,122 of 5,451 (57.3%). Skills
stay 41/399, supports 31/567, families 19 and reviewed pairs 292. These measures
are heuristic coverage, not overall completion or a Full DPS calculation.

All 42 contexts preserve every previous match and both source fingerprints,
gaining exactly the reviewed twelve wordings before deliberate baseline refresh.
Quick validation passed 1,360 tests in 32 files, typecheck and no-loss coverage.
Tests cover signs/zero/decimals, exact wording, ownership/conditions, real mixed
nodes, amount/effect/duration separation, manual settings and catalog-wide
control/persistence paths. No old expectations needed updating for this batch.

Routing checks retain required penalty nodes, compare unchanged shortest
results, count shared nodes once, exclude base rewards and prevent generic
Armour/Physical Damage/duration fan-out. Genuine separate Armour lines can still
score. No route contract or shared layout changed, so no repeated browser matrix
was run. Final `npm run validate:release` passed 1,677 tests in 76 files,
typechecking, production build, graph validation and the deliberately refreshed
coverage baseline. Local port 5174 returns HTTP 200. `git diff --check` passed
with existing line-ending warnings only. Main production chunk is 507.02 kB
minified (135.86 kB gzip); the existing Vite 500 kB warning remains, not a build
failure or measured runtime regression. No warning threshold was raised.
No commit, push or deployment performed.

## Next Proposed Batch

Percentage-of-maximum-Life regeneration, Mana Cost Efficiency and incoming debuff
expiry speed. Their favorable unconditional templates cover 32 current
occurrences (12/11/9); review opposite signs and native units before setting the
complete batch total. Keep regeneration sources separate from regeneration-rate
modifiers, efficiency separate from flat cost reduction, and expiry rate separate
from effect reduction or literal duration percentages. Proposal only; Fireball
Concentrated Area remains on hold.

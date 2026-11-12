# Ailment Buildup, Daze Duration and Damaging Ailments

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph, extracted game tables
and existing isolated PoB runtime. Five opt-in preferences; no solver, graph,
assets, point-cost, storage-schema, gem/support or shared-control changes.

## Matching and Scoring

| Preference | Complete unconditional increased/reduced wording | Normal unit |
| --- | --- | --- |
| Electrocute Buildup | Electrocute Buildup | 10% |
| Pin Buildup | Pin Buildup | 10% |
| Daze Duration | Daze Duration | 10% |
| Damaging Ailment Magnitude | Magnitude of Damaging Ailments you inflict | 10% |
| Damaging Ailment Duration | Duration of Damaging Ailments on Enemies | 10% |

Reductions retain negative values; High/Highest multiply the normal score by
two/three. These remain raw user preference weights, not performance estimates.
Generic damaging-ailment bonuses score once in their own preference, not again
as Poison, Bleeding and Ignite bonuses. Separate genuine specific ailment lines
may score separately. Buildup, application chance, magnitude and duration are
not interchangeable. None of these modifiers grants application.

Only complete unconditional literal wording matches. Conditional/recent-event,
per-charge, weapon/skill/critical-hit scoped, minion/Companion/ally/enemy-owned,
more/less, malformed and unknown composite forms are excluded. Broader magnitude
of all ailments and non-damaging ailments remain unreviewed separate families.
Incoming ailment duration, generic Skill Effect Duration, damage against affected
enemies and faster ailment damage are not promoted into these categories.

Manual settings persist across all focuses; there are no new automatic skill or
support suggestions. Shared controls and catalog-wide save/transfer paths are
unchanged. Route budgets and shortest mode remain intact.

## Evidence and Limits

Primary references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [offence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
Moving upstream links do not imply byte identity with the isolated tested local
snapshot. No personal build or installed PoB settings were edited.

Eight signed forms for Electrocute/Pin Buildup and generic damaging-ailment
magnitude/duration parse completely. Buildup maps to INC EnemyElectrocuteBuildup
or EnemyPinBuildup. Generic magnitude maps to one INC AilmentMagnitude restricted
to Poison/Bleed/Ignite keywords, not hit or non-damaging ailment magnitude.
Generic duration maps to three distinct INC enemy duration stats, each receiving
the value once. This native stat fan-out is not a reason to triple-score one
generic line in the optimizer. Attack/spell ModDB checks preserve both signs;
no tested player line is a MinionModifier.

Thirty fresh actor fixtures cover Bonestorm, Spark, ordinary Skeletal Sniper,
non-hitting Enfeeble, combined magnitude/duration and minion-only positive
controls. Independent arithmetic confirms the isolated signed magnitude effect
on Bonestorm's Poison/Bleed outputs and separate duration factors: baseline
2-second Poison and 5-second Bleed become 2.4/6 seconds at +20%, or 1.6/4 at
20% reduced. Hit damage, chance, Life and cadence stay unchanged. Duration can
interact with native damage outputs, so no universal duration-to-DPS multiplier
or claim of unchanged ailment DPS is made.

Player modifiers do not transfer to the ordinary minion. Positive minion-only
controls change its raw buildup, damaging-ailment magnitude and duration stats,
not the player's stats. They do not claim actual minion application probability.
Bonestorm/Spark blank fixtures do not grant Pin or Electrocute application: their
final buildup outputs stay zero despite valid raw modifiers. Non-hit Enfeeble
also remains zero. Positive actual buildup/application, immunity/prohibitions,
conversions, enemy thresholds and frequency/uptime are not established by these
fixtures and are not calculated by this heuristic.

Daze Duration is deliberately different: native parsing is partial, returning a
generic Duration modifier with an unparsed Daze remainder. Neither signed form
is accepted as a complete native effect. The app instead uses the exact signed
game descriptor `daze_duration_+%` and extracted node value, never generic Skill
Effect Duration. Native final Daze duration and uptime remain unmodeled, with the
parser limitation stated in the preference tooltip. No native parser is patched
or unknown effect silently promoted to a runtime calculation.

All 35 graph occurrences independently trace to extracted PassiveSkills/Stats:

| Raw game stat | Main-tree occurrences |
| --- | ---: |
| hit_damage_electrocute_multiplier_+% | 11 |
| hit_damage_pin_multiplier_+% | 10 |
| daze_duration_+% | 1 |
| base_damaging_ailment_effect_+% | 4 |
| damaging_ailment_duration_+% | 9 |

All five game descriptors include increased/reduced forms with a negative-value
display transform. No negative raw values occur in these families in this
main-tree snapshot; synthetic signed app/native cases remain explicitly tested.
Lasting Trauma retains its separate -5% Attack Speed penalty. Seeing Stars keeps
its distinct flat Daze chance. Deterioration's incoming restriction, Rusted Pins'
aggravation and Coursing Energy's conditional Shock line remain unmodeled.

Evidence is retained under ignored `var/ailment-buildup-duration-20261107/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/ailment-buildup-duration-20261107/native-check.lua --job var/ailment-buildup-duration-20261107
node var/ailment-buildup-duration-20261107/verify.mjs
```

Eight complete signed parser forms passed; independent JavaScript validation
passed 651 ownership/type/arithmetic/source checks across 30 native fixtures and
all 35 raw game stats. Daze partial parsing is recorded rather than counted as a
passed native form. Existing fourteen missing-node startup messages are unrelated.

## Inventory and Validation

Preferences 131 -> 136. Fourteen new wordings add 35 occurrences: wording
646 -> 660 of 2,182 (30.2%); occurrences 2,948 -> 2,983 of 5,451 (54.7%). Skills
stay 41/399, supports 31/567, families 19 and reviewed pairs 292. These measures
are heuristic coverage, not overall completion or a Full DPS claim.

All 42 contexts preserve every previous match and both source fingerprints,
gaining exactly the reviewed fourteen wordings before deliberate baseline
refresh. Quick validation passed 1,289 tests in 29 files, typecheck and no-loss
coverage. Tests cover signs/zero/decimals, ownership/scope exclusions, complete
wording, exact mixed nodes, generic/specific separation, manual-setting
preservation and catalog-wide control/persistence paths. Earlier expectations in
two files were updated for newly supported mixed-node and generic-duration lines.

Routing checks retain required negative-value goals, compare unchanged shortest
results, count shared nodes once, exclude already allocated base rewards and
avoid copying generic bonuses into specific ailment contributions. Separate
real specific-duration lines can still contribute. No solver/route contract or
shared layout implementation changed; no repeated browser matrix was run.

Final `npm run validate:release` passed 1,606 tests in 73 files, typechecking,
production build, graph validation and the deliberately refreshed coverage
baseline. Local port 5174 returns HTTP 200. `git diff --check` passed with
existing line-ending warnings only. The production main chunk is 501.20 kB
minified (134.83 kB gzip), just above Vite's 500 kB warning threshold. This is a
bundle-size warning, not a build failure or measured runtime regression; chunk
splitting is separate follow-up work, not hidden by raising the warning limit.
No commit, push or deployment performed.

## Next Proposed Batch

Incoming debuff protection: reduced Slowing Potency of Debuffs on You, reduced
effect of Curses, and reduced effect of Chill/Shock on you. The four favorable
templates cover 59 current occurrences (32/12/8/7); review opposite-sign forms,
ownership, caps and overlaps before implementing. These must not score as
outgoing slow, curse or ailment strength, or imply immunity. Proposal only;
Fireball Concentrated Area remains on hold.

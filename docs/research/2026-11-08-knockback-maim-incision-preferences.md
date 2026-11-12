# Knockback Distance and Attack-Hit Maim/Incision

Reviewed 2026-11-08 against the PoE2 0.5.5f graph/extracted tables and isolated
PoB 0.23.1 runtime. Three optional Utility preferences, no automatic priorities,
support compatibility, solver, allocation-cost, schema, graph/assets or shortest
route changes.

## Exact Matching and Application

| Complete wording | Preference | Normal score unit | Occurrences |
| --- | --- | --- | ---: |
| N% increased/reduced Knockback Distance | Knockback Distance | 10% | 10 |
| Attacks have N% chance to Maim on Hit | Maim Chance on Attack Hit | 5 chance points | 2 |
| N% chance for Attack Hits to apply Incision | Incision Chance on Attack Hit | 5 chance points | 9 |

Full-line matching, normalized for case/whitespace. Distance increases add and
reductions subtract. Flat chances accept signed/decimal values, not relative
increased chance. Zero is retained. High/Highest remain x2/x3. More/less,
conditional/recent/per-charge, composite, owned, incoming and unreviewed alias
wording remains excluded.

Distance is a manual source preference across focuses for applicable player
Knockback; it does not grant application or assign the source to a minion/proxy.
Maim and Incision require explicit scopes on the same nine reviewed player
attack-hit focuses: Lightning Arrow, Ice Shot, Rain of Arrows, Lightning Spear,
Explosive Spear, Ice Strike, Tempest Flurry, Boneshatter and Rolling Slam.
Actual damaging hit components qualify, not non-damaging sequence wrappers.
Spells, non-hit curses, DoT, minion/proxy and manual/unknown focuses gain neither
attack-only chance. No node-name, class, equipment or gem-tag inference.
Existing support compatibility and manual priorities are preserved.

Tooltips explain that source scores are not final capped probabilities,
displacement, debuff uptime, DPS or defence. Requires suitable hits/targets and,
for distance, an applicable Knockback source. Target restrictions, immunities,
direction/overrides, rounding, base distance, Maim duration and Incision
stacking/consumption are not calculated. No enemy debuff state is assumed.

## Ownership and Overlap

Distance is not Knockback chance, Stun Buildup or incoming protection. Maim
chance is not Slow Magnitude, generic ailment chance or conditional damage.
Incision chance is not a flat Bleeding chance, Incision effect, stacks or
damage against affected enemies. The separate ten-Incision chance wording,
conditional Maim against Poisoned enemies, and conditionally applied Maim
remain unmatched. Incoming immunity and minion/Companion/Totem/allied sources
remain distinct; no new owner-specific values are inferred.

Independent mixed-source arithmetic for a reviewed attack at Normal:

- Knockback Distance 20 -5 = 15, score 1.5.
- Maim chance 10 +15 -5 = 20 chance points, score 4.
- Incision chance 20 +40 -10 = 50 chance points, score 10.

Total 15.5, not a multiplicative control/damage estimate. Adding a genuine 5-point
Bleeding chance source supplies one separate Bleeding score, giving 16.5 when
that preference is selected. Shared branch nodes still cost one point and
receive one contribution per selected preference, not per goal; allocated base
nodes earn no new reward. Required negative sources remain required.

Mixed-node checks retain existing effects: Quarterstaff Stun and Knockback
20/20, Staggering Palm distance 20 + Physical Damage 25 + Daze chance 10,
Forcewave distance 20 + Stun Buildup 20 + Physical Damage 20, Maiming Strike
damage 25 + Maim chance 25, Impair one-handed damage 25 (only matching spear
focuses) + attack Maim chance 10. Scent of Blood retains Bleeding duration 20
and movement speed 3 alongside Incision chance 40. Clear Space gains distance
20, not conditional close-range Knockback chance. Crippling Toxins retains
Poison magnitude 25 but not conditional Maim. No incoming Hunker Down
Knockback modifier or conditional bleed-magnitude source leaks into these IDs.

## Source and Native Audit

All 21 occurrences independently trace through extracted English PassiveSkills
and Stats in `var/refresh-0.5.5f/tables/English/`:

| Raw stat ID | Occurrences | Values |
| --- | ---: | --- |
| knockback_distance_+% | 10 | 8, 10, 20 |
| maim_on_hit_% | 2 | 10, 25 |
| chance_to_inflict_incision_on_attack_hit_% | 9 | 20, 40 |

Reviewed official PoB [parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[offence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)
and [effect calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua).
Moving upstream links do not prove byte identity with the tested isolated copy.
Personal PoB builds/settings were not changed.

| Tested local file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Modules/CalcOffence.lua | eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435 |
| Modules/CalcPerform.lua | b5955d4eaed31c01ea85e551a5eef46b6f006d7ebe3e8722993b69a425666b31 |
| Data/SkillStatMap.lua | 703857f0c20f7a6a079a5379562a888dca02a2921f4e0e5467f65c531398081c |

Eleven native parser probes and fourteen fixed-weapon actor fixtures record
supported raw modifiers and application gaps, not eleven fully modeled mechanics:

- Distance +/-20 parses as signed INC EnemyKnockbackDistance. Minion distance
  becomes a MinionModifier, not player distance. Spark and Ice Nova actor
  +/-50 distance inputs retain those raw modifiers; minion distance does not
  enter the player sum.
- Maim 10/25 and negative Maim chance leave residual text: native parsing is
  incomplete, so exact game wording supplies numeric values. No enemy/player
  Maim state is assumed from those partial native inputs.
- Incision chance 20, chance 40 and the ten-Incision variant all parse to the
  same unscoped boolean capability flag, not their numeric chance or quantity.
  Negative Incision chance is unparsed. The site independently scores signed
  numeric chance with explicit attack ownership, excluding the ten variant.
- The native capability flag is present on Spark as well as Lightning Arrow;
  it cannot establish attack-hit eligibility. With zero configured stacks,
  the tested 20/40 sources yield zero enemy SelfBleedChance. Explicitly setting
  three Incision stacks yields 30 SelfBleedChance. This is a configured-state
  calculation, not proof of chance, generated stacks or expected uptime.
- Ice Nova carries raw EnemyKnockbackChance 100 but the audited calculation
  outputs KnockbackChance 0 and no distance. Its stat map uses numeric chance,
  while the inspected calculation gate checks a Knockback flag. This mismatch
  prevents validation of final displacement from these fixtures. The separate
  CannotKnockback flag parses, but an already-zero result cannot prove its
  behavior. No native code was patched to manufacture a passing result.

Existing fourteen missing-node native startup messages are unrelated. Evidence:
`var/knockback-maim-incision-20261108/` (ignored).

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/knockback-maim-incision-20261108/native-check.lua --job var/knockback-maim-incision-20261108
node var/knockback-maim-incision-20261108/verify.mjs
```

## Coverage and Verification

Preferences 176 -> 179. Seven new wordings/21 occurrences: wording 839 ->
846/2,182 (38.8%); occurrences 3,373 -> 3,394/5,451 (62.3%). All 42 contexts
retain previous matches and graph/catalog fingerprints. Three distance wordings
are added in every context; four chance wordings only in nine attack focuses.
Skills remain 41/399, supports 31/567, reviewed pairs 292. These are scoped
heuristic/catalog coverage measures, not complete mechanic support.

Quick validation passed 1,647 tests in 46 files, typecheck and no-loss coverage.
Tests cover all focuses, signs/units/zero, ownership/conditions, source inventory,
independent overlap sums, optional priorities, existing catalog-driven storage,
tooltips, shared/base costs, required penalties and unchanged shortest routing.
The initial quick run found one earlier source fixture expecting only Stun
Buildup on a node that now also supplies Knockback Distance; that assertion was
updated to preserve both effects. One final release validation passed 1,964
tests in 90 files, typecheck, production build, graph validation and the reviewed
baseline. The local dev server was restarted and port 5174 returns HTTP 200.
The existing main-chunk warning remains at 536.95 kB minified / 141.97 kB gzip;
the build succeeds. No shared layout, control contract or storage implementation
changed, so no repeated browser matrix was run for metadata/tooltips in the
existing controls. `git diff --check` passed with existing LF/CRLF notices.

Next proposed batch: Mark effect, use speed and duration, plus Exposure Effect,
keeping application, magnitude, timing and generic modifiers separate. Not
implemented without approval. Ten-Incision needs its own review; Fireball
Concentrated Area remains on hold. No commit, push or deployment authorized.

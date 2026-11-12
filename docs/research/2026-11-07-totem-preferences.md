# Explicit Totem Preferences

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph, PoB 0.23.1 catalog
and existing isolated native runtime. Six new opt-in preferences; no graph,
assets, routing algorithm, point cost, save schema or support pairing changes.

## Scope and Units

| Preference | Accepted complete unconditional wording | Normal score unit |
| --- | --- | --- |
| Totem Damage | N% increased/reduced Totem Damage | 10% |
| Totem Life | N% increased/reduced Totem Life | 10% |
| Totem Placement Speed | N% increased/reduced Totem Placement speed | 10% |
| Totem Duration | N% increased/reduced Totem Duration | 10% |
| Totem Attack Speed | Attacks used by Totems have N% increased/reduced Attack Speed | 3% |
| Totem Cast Speed | Spells Cast by Totems have N% increased/reduced Cast Speed | 3% |

Reductions are negative. High/Highest multiply the raw preference score by two
or three. Player, minion and Companion wording is not copied into these six
categories. Actual generic player modifiers can benefit a totem in PoB through
inheritance; that does not justify duplicating one line into several heuristic
categories. Existing manual generic preferences keep their behavior.

Totem Life is not player or minion Life. Placement speed changes deployment time,
not firing cadence. Duration concerns lifetime and is not increased damage per
second. Attack speed and cast speed are separate, requiring the corresponding
totem action. Selecting an irrelevant preference cannot make a non-damaging,
non-attacking or durationless totem benefit. This tool does not evaluate gear,
cooldowns, Charges, Action Speed, enemy prerequisites, survival or uptime.

Matching is literal and complete-line only: no per-summoned-totem/recent-summon
conditions, more/less, unknown composite labels, player-sharing, minion/Companion
ownership, ballista-only aliases, regeneration, placement range or malformed
numbers. Those are distinct backlog mechanics, not implied support. Only these
reviewed wordings are admitted, not every synonym the native parser accepts.

The existing category picker, priority controls and descriptive tooltips expose
the six effects. No new controls, layout or visible detail panels were added.
No preset automatically gains a preference; old builds, priorities and budgets
stay unchanged until explicitly edited. All focuses can retain manual totem
preferences for auxiliary totems without inventing new skill presets.

## Primary and Native Evidence

PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [offence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)
are the primary references, alongside its generated
[Intelligence](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua)
and [Strength](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua)
skill definitions. Moving upstream links are not claimed to be byte-identical
to the locally tested snapshot.

Native parser/ModDB checks consumed all twelve signed forms completely:

- Totem Damage is Damage INC with the Totem keyword, not a MinionModifier.
- Totem Life, placement speed and duration are dedicated stat names; storing
  them on a player database does not make them player Life/cast speed/duration.
- Attack Speed requires Attack plus the Totem keyword. Cast Speed requires
  Spell plus Cast flags and the Totem keyword. A parser probe initially omitted
  the Cast flag and was corrected before relying on the results.
- Player attack/spell configurations and minion modifier lists are explicit
  negative controls. No engine code or calculated actor is patched.

Sixty-one fresh synthetic actor fixtures cover actual Dark Effigy Vile Effusion,
Shockwave Totem's linked Slam, an ordinary Skeletal Sniper and player Spark,
with a plain Wooden Club and no passive allocation. Deployment is checked
separately from the linked hit. The fixture needed calculation-view selection
and the gem's normal enableGlobal2 setting to activate the linked spell; the
correct selected effect IDs and nonzero damage are asserted. Earlier probes
with inactive/wrong components were not accepted as hit/cadence evidence.

An independent JavaScript verifier passed 306 checks for owner separation,
signed raw modifiers, attack/spell cadence, reciprocal placement time, rounded
Totem Life and duration rounded up to the server tick. Minion-only controls
change the skeleton, not totem or player outputs. Totem modifiers leave the
ordinary minion and player self-use unchanged.

The checker deliberately does not assert that a damage increase causes the same
linear final-DPS increase: initial ratio probes did not hold. Signed damage
modifier deltas and output direction are checked instead; numerical Life,
placement, duration and cadence checks retain their independently derived
formulas. Enemy mitigation, damage rounding, component proportions and actual
build performance are not modeled by the site's heuristic scores.

Evidence is retained under ignored `var/totem-preferences-20261107/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/totem-preferences-20261107/native-check.lua --job var/totem-preferences-20261107
node var/totem-preferences-20261107/verify.mjs
```

The isolated runtime prints its existing fourteen missing-node startup messages;
final assertions pass. No installed PoB settings or personal builds were edited.

## Inventory and Verification

Exactly fifteen new wordings add 56 main-tree occurrences: Damage 17, Life 9,
Placement Speed 13, Duration 1, Attack Speed 8 and Cast Speed 8. All 42 contexts
preserve every old match and gain exactly these fifteen lines; source graph and
catalog fingerprints are unchanged. Preferences 108 -> 114, distinct wording
586 -> 601 of 2,182 (27.5%), occurrences 2,758 -> 2,814 of 5,451 (51.6%).
Skills remain 41/399, supports 31/567, families 19 and reviewed pairs 292.
Coverage measures recognized heuristic wording, not overall completion or DPS.

Focused validation passed 1,197 tests in 25 files, typechecking and the no-loss
baseline check. Tests cover signed/zero/decimal values, complete ownership,
excluded mechanics, mixed genuine stat lines, all-focus manual preservation and
native inventory. Route fixtures retain required negative-value goals, score
shared nodes once, exclude already allocated base-node rewards and compare
unchanged shortest output. Existing catalog-wide save/export tests cover all
six IDs. Parameterized control tests verify selection, tooltip text, priorities
and removal. No shared control/layout implementation changed, so no repeated
browser screenshot matrix was run for this metadata-only batch.

Final `npm run validate:release` passed 1,514 tests in 69 files, typechecking,
production build, graph validation and the refreshed coverage baseline.
`git diff --check` passed with only existing Git line-ending warnings. The local
server was no longer listening; it was restarted hidden on port 5174 and returns
HTTP 200 with an empty error log. No commit, push or deployment performed.

## Next Proposed Batch

Totem Area of Effect, Placement Range, ordinary/maximum elemental resistances,
additional Physical Damage Reduction and Life regeneration. These six families
have thirteen current occurrences. Verify ownership, caps, applicability and
recovery units rather than implying player defence or guaranteed totem uptime.
This is a proposal only; Fireball Concentrated Area remains explicitly on hold.

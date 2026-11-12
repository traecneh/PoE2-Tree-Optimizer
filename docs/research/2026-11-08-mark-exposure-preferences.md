# Mark Effect, Use Speed, Duration and Exposure Effect

Reviewed 2026-11-08 against the PoE2 0.5.5f graph/extracted tables and isolated
PoB 0.23.1 runtime. Four optional Utility preferences, no automatic priorities,
skill presets, support compatibility, solver, allocation-cost, storage-schema,
graph/assets or shortest-route changes.

## Literal Matching and Limits

| Complete increased/reduced wording | Preference | Normal unit | Occurrences |
| --- | --- | --- | ---: |
| N% Effect of your Mark Skills | Mark Effect | 10% | 4 |
| Mark Skills have N% Use Speed | Mark Use Speed | 10% | 4 |
| Mark Skills have N% Skill Effect Duration | Mark Duration | 10% | 2 |
| N% Exposure Effect | Exposure Effect | 10% | 8 |

The first/last use `N% increased/reduced ...`; Mark timing uses the same signed
modifier after its prefix. Full lines only, case/whitespace normalized, decimals
and zero retained. Increases add, reductions subtract; High/Highest remain x2/x3.
More/less, flat, malformed, conditional/recent/per-charge, owned, incoming,
composite and unreviewed alias wording does not match.

Manual source preferences work across all current focuses, including secondary
player utility skills. This does not assert the focus is a Mark or owns an
Exposure source. No Mark preset, support pair, application source, enemy debuff
state or minion/proxy modifier is inferred. Existing manual priorities remain.
Tooltips carry application requirements and native limitations without new panels.

- Mark Effect requires an applicable player Mark and is not generic Curse
  Magnitudes, duration or damage against Marked enemies. Particular Mark
  benefits, caps/overrides, consumption and actual DPS are not calculated.
- Mark Use Speed changes using the skill, not cooldown recovery or global
  Skill/Cast Speed. Use time is reciprocal to speed; triggers, animation limits,
  cooldowns and actual application frequency are not calculated.
- Mark Duration requires a duration-based Mark. It does not apply one, increase
  its strength or supply generic Skill Effect Duration/Curse Duration. Base
  duration, tick rounding, consumption, replacement/refresh and uptime are not
  calculated.
- Exposure Effect is relative outgoing Fire/Cold/Lightning Exposure strength,
  counted once for the source line, not once per element. It grants no Exposure
  and is not penetration, additional reduction points, chance/duration, Chaos
  resistance reduction or incoming protection. Base strength, target restrictions,
  source selection, mitigation, rounding and actual resistance/DPS are not modeled.

## Ownership, Overlap and Real Nodes

Mark-specific and generic speed/duration are separate genuine source lines.
Neither is copied into the other preference. Mark strength does not fan out into
Curse Magnitudes. Exposure Effect does not fan out into three elemental
preferences, penetration, generic damage or ordinary resistance values. Incoming
Exposure protection and minion/Companion/Totem/allied sources remain excluded.
No conditional damage, critical chance, Culling Strike, Blind or ailment bonus
is awarded merely because a Mark/Exposure preference is selected.

Independent Normal-score example:

- Mark Effect 20 -5 = 15, score 1.5.
- Mark Use Speed 30 -10 = 20, score 2.
- Mark Duration 25 -5 = 20, score 2.
- Exposure Effect 10 +20 -5 = 25, score 2.5 once, not three times.

Total 8, not a DPS estimate. Separate Skill Speed 3, Skill Effect Duration 10,
Curse Magnitudes 6, Curse Duration 20 and Fire penetration 5 each add their own
Normal score, making 13 when selected. Shared branch nodes cost one point and
receive each contribution once, not per goal; base nodes earn no new reward.
Required negative sources remain required, and unselected categories score zero.

Mixed-node checks retain Mark Effect 8 plus Blind Effect 10 on node 21279;
Mark Effect 8 plus attack Blind chance 5 on 44280 for matching attack focuses;
Exposure Effect 7 plus Slow Magnitude 7 on 17867/37092. Stripped Defences'
additional 5% Exposure reduction remains separate/unreviewed. Conditional
Exposed-to-the-* bonuses remain excluded while their actual 18% penetration
sources stay intact. The Noble Wolf supplies its +10 Dexterity, not its
conditional critical/ailment bonuses. Marked Agility, Unsight, Marked for Death
and Marked for Sickness gain no unrelated effects from this batch.

## Source and Native Evidence

All eighteen occurrences independently trace to English PassiveSkills and Stats
under `var/refresh-0.5.5f/tables/English/`:

| Raw stat ID | Occurrences | Values |
| --- | ---: | --- |
| mark_effect_+% | 4 | 8, 10 |
| mark_use_speed_+% | 4 | 10 |
| mark_skill_duration_+% | 2 | 25 |
| exposure_effect_+% | 8 | 7, 10, 30 |

Reviewed official PoB [parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[offence](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)
and [effect calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua).
Moving upstream references do not prove byte identity with the tested isolated
copy. Personal PoB builds/settings were not changed.

| Tested local native file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Modules/CalcOffence.lua | eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435 |
| Modules/CalcPerform.lua | b5955d4eaed31c01ea85e551a5eef46b6f006d7ebe3e8722993b69a425666b31 |
| Data/Skills/act_dex.lua | d36694d3168f733be34b711f42953b0186685a14d60402ba42cf1d08c13971f9 |

Thirteen parser probes and fifteen isolated actor fixtures expose both correct
scope and limitations; syntactic parsing alone is not effect validation:

- Exact game Mark-effect wording maps to Mark-scoped `LocalEffect`, not the
  `MarkEffect` consumed by native calculation. +/-20 therefore leaves Sniper's
  Mark's `MarkEffectMod` at 1. A reference-only native alias, "effect of your
  Marks", yields `MarkEffect` and 1.2. The site uses the exact game stat to score
  source strength independently; it neither reuses the wrong native field nor
  enables that unreviewed alias. No native code was patched.
- Mark use speed/duration map to Mark-scoped INC Speed/Duration. Sniper's Mark
  receives +/-20; Spark and Enfeeble receive zero of these scoped modifiers.
  Distinct +20 generic plus +20 Mark sources yield 40, not 60 or multiplicative 44.
- Sniper's Mark raw use rate is 2, 2.4 or 1.6 under baseline/+20/-20. Its cooldown
  and effective repeated-use time remain 6.006 seconds, demonstrating why use
  speed is not cooldown recovery. Adding both generic/Mark +20 gives rate 2.8.
  Duration outputs 8.019, 9.603, 6.402 and 11.22 are within one native tick of
  independent pre-rounding expectations 8, 9.6, 6.4 and 11.2.
- Generic Exposure Effect parses to three INC elemental effect modifiers with
  +/-20 each; the website source preference counts one line once. Incoming
  ExposureEffectOnSelf and minion-owned modifiers remain separate.
- With no Exposure source, +/-20 effect does not apply any Exposure or alter the
  fixture's 50 elemental resistance. A controlled nearby Cold Exposure source
  has base 20, target effect multiplier 0.5 and modifiers 0/+20/-20. Independent
  `floor(20 * (1 + modifier/100) * 0.5)` gives strength 10/12/8 and Cold resistance
  40/38/42, matching native output. Fire/Lightning remain unaffected. This target
  multiplier is fixture evidence, not a universal rule for enemies.
- Minion Exposure effect does not enter the player effect sum or apply Exposure.

Existing fourteen missing-node native startup messages are unrelated. Ignored
reproducible evidence: `var/mark-exposure-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/mark-exposure-20261108/native-check.lua --job var/mark-exposure-20261108
node var/mark-exposure-20261108/verify.mjs
```

## Coverage and Verification

Preferences 179 -> 183. Seven wordings/eighteen occurrences added: wording
846 -> 853/2,182 (39.1%); occurrences 3,394 -> 3,412/5,451 (62.6%). All 42
contexts retain old matches and both fingerprints and gain exactly the seven
reviewed wordings. Skills remain 41/399, supports 31/567, reviewed pairs 292.
These are scoped heuristic/catalog counts, not complete mechanic support.

Quick validation passed 1,668 tests in 47 files, typecheck and no-loss coverage.
Tests cover source inventory, all contexts, signs/units/zero, ownership/conditions,
no implicit application or aliases, independent overlap, generic timing/elemental
fanout, optional priorities, existing catalog-driven storage and tooltips,
shared/base costs, required penalties and unchanged shortest routing. One final
release validation passed 1,985 tests in 91 files, typecheck, production build,
graph validation and the deliberately reviewed baseline. Local port 5174 returns
HTTP 200. The existing main-chunk warning remains at 539.40 kB minified /
142.50 kB gzip; the build succeeds. No shared layout, control contract or storage
implementation changed, so no repeated browser matrix was run for metadata and
tooltips in the existing controls. `git diff --check` passed with existing
LF/CRLF conversion notices.

Next proposal: utility presets for Sniper's Mark, Bloodhound's Mark, Freezing
Mark and Voltaic Mark, with application/consumption/triggered-hit ownership review.
Their positive-tier catalog IDs were verified; presets are not implemented yet.
Ten-Incision and Fireball Concentrated Area remain separate held reviews.
No commit, push or deployment authorized by this batch.

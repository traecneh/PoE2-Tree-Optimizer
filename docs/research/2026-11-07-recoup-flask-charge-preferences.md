# Recoup and Flask Charge Preferences

Reviewed against the bundled PoE2 0.5.5f graph and the isolated local PoB 0.23.1
native parser. Eight opt-in categories use the existing effect picker and help.
No graph, assets, routing algorithm, worker, storage schema or preset priorities
changed. These are literal modifier heuristics, not actual sustain or flask uptime.

## Units and Exact Scope

| Preferences | Normal score unit | Accepted wording |
| --- | --- | --- |
| Life / Mana / Energy Shield Recoup | 3% of damage taken recouped | N% of Damage taken Recouped as the named pool |
| Flask / Life Flask / Mana Flask Charges Gained | 10% increased charges gained | N% increased/reduced charges gained |
| Life / Mana Flask Charges per Second | 0.1 charge per second | Named Flasks gain N charges per Second |

High/Highest multiply those heuristic scores by two/three. Recoup uses the
literal damage fraction, not invented increased/reduced-recoup wording. Charges-
gained reductions subtract score. Flat generation stays in charges per second,
never a percentage. Case, whitespace and decimal normalization are supported;
only complete reviewed lines match. Generic flat-generation/every-N-seconds
aliases absent from this tree snapshot are not added speculatively.

Combined Life/Mana/ES recoup contributes once to each selected pool; a shared
passive still costs one point. Flask-and-Charm charge wording contributes only
to the generic Flask Charges Gained preference, not a Charm score. Generic and
Life/Mana-specific charge modifiers are separate opt-in categories, not copied
between them. Their mathematical interactions with flat generation are not
calculated. The tooltip on each category describes that scope.

Conditional, minion/enemy/totem-owned, damage-type-specific, Deflected/prevented-
damage, more/less, conversion and override recoup are excluded. Recoup speed,
recovery timing, pool restrictions, prohibitions and actual damage taken are not
simulated. Flask capacity, charges used, free-use chance, conditional charges
and Charms remain separate mechanics. Selecting a weight is not proof that it
benefits the character; review other effects on the whole node.

## Native Evidence and Independent Checks

The upstream [recoup mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L438-L448)
separates generic LifeRecoup/ManaRecoup/EnergyShieldRecoup from typed recoup.
The [charge modifier mappings](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L945-L961)
and [flat generation forms](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L5561-L5569)
use distinct stats for gained modifiers and generated charges. Moving upstream
links are references, not claimed byte-identical to the isolated snapshot.

All 16 native parser/ModDB probes passed: four recoup forms (including combined),
eight increased/reduced charge forms (including Flask-and-Charm), and four
Life/Mana decimal-generation forms. Each consumed its complete line with the
expected number, names, units, zero scope flags/tags and no duplicate modifiers.
Recoup/generation returned BASE values; charges-gained returned signed INC values.
Native reductions and standalone generic ES recoup were synthetic checks because
those exact forms are absent from the current main-tree inventory. Existing
missing-node startup messages did not prevent the checks. Installed PoB settings
and builds were not touched.

Independent arithmetic: a synthetic 3% of 100 is 3 for each applicable pool, not
9 Life. Combined +3% recoup scores 3 at Life Highest, 2 at Mana High and 1 at ES
Normal: score 6 on one node. Flat generation 0.1 + 0.15 = 0.25; at High and the
0.1 scale it scores 5. These examples do not estimate real recovery or uptime.

## Coverage and Fixtures

The batch adds 51 recognized main-tree occurrences on 51 nodes, across 16
distinct wordings:

- Recoup: 23 Life-only, four Mana-only and one combined Life/Mana/ES occurrence.
- Charges-gained modifiers: seven generic, five Life-specific, one Mana-specific
  and three Flask-and-Charm occurrences (flask portion only).
- Flat generation: four Life and three Mana occurrences.

Glazed Flesh (23939) contributes all three pools once. Regenerative Flesh (20388)
contributes your Life recoup but not minion recoup. Adverse Growth (4295) retains
its -20% Life regeneration penalty alongside +20% Mana recoup. Efficient Alchemy
(46692) now contributes its unconditional charge modifier, not conditional flask
recovery. Hale Traveller (52803) keeps recovery amount and flat generation
separate. Arcane Alchemy (46224) retains +10 Intelligence alongside Mana charges.
Storm Driven's typed ES recoup and Meditative Focus's conditional recoup remain
unmodeled. Energy Shield Recoup currently has one main-tree match: the combined line.

Preferences increase 63 -> 71. Main-tree occurrence coverage increases
2,427/5,451 (44.5%) -> 2,478/5,451 (45.5%). Distinct wording increases
464/2,182 (21.3%) -> 480/2,182 (22.0%). Fingerprints are unchanged; all 16 new
wordings were reviewed after the prior baseline passed, before deliberate refresh.
Skill presets remain 24/399 and support choices remain 21/567. This is not overall
project completion or complete effect simulation, even for a recognized line.

## Verification

- Focused validation: 742 tests in 16 files, typecheck and the prior baseline passed.
- Native checks: all 16 forms plus independent arithmetic passed.
- Matching tests cover strict scope/ownership, decimals/zero, reductions,
  combined effects, separate units, current-tree counts and preserved priorities.
- Routing tests cover negative charge tradeoffs, required goals, shared recoup,
  committed-base exclusions, budgets, unselected effects and unchanged shortest.
- Existing parameterized picker, catalog storage and JSON-transfer tests cover
  all eight IDs. No new controls, layout or persistence implementation required
  a repeated browser matrix under the lean validation policy.
- Final release validation passed 1,059 tests in 60 files, typecheck, production
  build, graph validation and the refreshed coverage baseline. No final checks
  failed. No real-character performance or browser matrix was run for this
  metadata/parser-only batch. No commit, push or deployment was performed.

Next recommended batch: unconditional Stun Recovery, Presence Area of Effect
and movement-speed penalty reductions while using skills. Slowing protection,
gear-derived Deflection and Armour-to-elemental mitigation require further
applicability review; Fireball's Concentrated Area review remains on hold.

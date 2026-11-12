# Threshold, Cooldown and Flask Preferences

Reviewed against the bundled PoE2 0.5.5f graph and isolated local PoB 0.23.1.
Four opt-in preferences use the existing effect picker, priorities and help.
Each Normal score unit represents 10% of its literal modifier; High/Highest
multiply that score by two/three. Increases add value and reductions subtract it.
These are heuristic modifier scores, not actual defence, sustain or Full DPS.

## Exact Scope

Only complete unconditional increased/reduced percentage lines match, with case,
whitespace and decimal normalization:

- Elemental Ailment Threshold, separate from outgoing ailments and Stun Threshold.
- Cooldown Recovery Rate, not cast speed or cooldown seconds.
- Life Recovery from Flasks, separate from Life regeneration and maximum Life.
- Mana Recovery from Flasks, separate from Mana regeneration and maximum Mana.
- Life and Mana Recovery from Flasks: one contribution to each selected pool.

Conditional, minion/enemy-owned, skill-specific, more/less, flat, conversion and
override wording is excluded. Generic aliases absent from this tree snapshot
are not invented. Flask recovery rate, charges gained, Guard and flask uptime
are not modeled. Threshold conversions from Energy Shield, Dexterity or gear
are not treated as unconditional threshold percentages. Builds without applicable
cooldowns or flask recovery may gain no real benefit despite a selected weight.
Unselected effects have no score; review other effects on the whole node.

No preset automatically adds these preferences. Existing saved priorities,
supports, required goals, point budgets and shortest routing remain unchanged.
Storage and JSON transfer already use the catalog IDs; no schema migration or
new shared-control implementation is needed.

## Source and Native Evidence

PoB's [threshold mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L449-L450),
[cooldown mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L670-L672)
and [flask mappings](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L930-L944)
keep AilmentThreshold, CooldownRecovery, FlaskLifeRecovery and FlaskManaRecovery
distinct. Combined Life/Mana recovery produces two modifiers, not a double
allocation cost. The moving upstream source is not claimed byte-identical to
the isolated local copy.

Native parser/ModDB checks passed all ten probes: increased and reduced forms
for each of the five wordings. They consumed complete lines and returned signed
INC values, no BASE values, no tags/ownership flags and no unrelated recovery,
cast-speed or threshold modifiers. Reductions are synthetic fixtures because
none of these exact reduced forms occurs in the current main-tree snapshot.
The runtime's pre-existing missing-node startup messages did not prevent the
checks. Installed PoB settings and builds were untouched.

Independent arithmetic: a synthetic five-second cooldown with +20% recovery is
5/1.2 = 4.1667 seconds, not 4 seconds. A synthetic 100 recovery amount with +20%
is 120. These examples do not claim actual flask or cooldown performance. The
route fixture scores a combined +20 flask node as 4 for Life at High and 2 for
Mana at Normal: score 6, one new passive point, not two.

## Coverage and Fixtures

Adds 78 recognized occurrences on 78 main-tree nodes and 24 distinct wordings:

- Elemental Ailment Threshold: 23 occurrences.
- Cooldown Recovery Rate: 17 occurrences.
- Life-only flask recovery: 23 occurrences.
- Mana-only flask recovery: 10 occurrences.
- Combined Life/Mana recovery: five occurrences, counted once in coverage.

Combat Alchemy (10053) contributes both flask pools; Distracting Presence
(44765) contributes your cooldown recovery but not its enemy debuff. Heavy
Drinker (15617) does not invent a Guard score. Altered Brain Chemistry (48974)
does not include its conditional recovery-rate effect. Efficient Alchemy
(46692), Low-Life flask nodes and threshold conversions remain excluded.

Preferences increase 59 -> 63. Main-tree occurrence coverage increases
2,349/5,451 (43.1%) -> 2,427/5,451 (44.5%); distinct wording coverage increases
440/2,182 (20.2%) -> 464/2,182 (21.3%). Graph/catalog fingerprints are unchanged.
Skill presets (24/399) and support choices (21/567) are unchanged by this batch.
All 24 additions were reviewed after the old baseline passed, before refresh.

## Verification

- Focused validation passed 712 tests in 15 files, typecheck and the prior baseline.
- Native parser/ModDB checks passed all ten forms/signs plus synthetic arithmetic.
- Parameterized parser and routing tests cover reductions, decimals, cancellation,
  opt-in scoring, required negative goals, scopes/ownership and unchanged shortest.
- Combined flask routing verifies shared-node cost, committed-base exclusions,
  both selected contributions and the extra-point budget.
- Existing parameterized DOM, catalog storage and JSON-transfer tests cover all
  four IDs. No UI layout, persistence implementation or worker contract changed;
  a repeated browser/layout matrix is not required by the lean validation policy.
- Final release validation passed 1,029 tests in 59 files, typecheck, production
  build, graph validation and the refreshed coverage baseline. No final checks
  failed. No real-character performance or browser matrix was run for this
  metadata/parser-only batch. No commit, push or deployment was performed.

Next recommended batch: unconditional Life/Mana/Energy Shield recoup and flask
charge generation, with combined wording reviewed separately. Recoup percentages
are not invented increased/reduced aliases. Gear-derived Deflection, Armour-to-
elemental mitigation and Fireball's Concentrated Area review remain on hold.

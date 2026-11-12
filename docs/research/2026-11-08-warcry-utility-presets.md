# Reviewed Warcry Utility Presets

Reviewed 2026-11-08 against the PoE2 0.5.5f graph and isolated PoB 0.23.1
catalog/runtime. Adds Infernal Cry, Seismic Cry, Ancestral Cry, Fortifying Cry
and Ferocious Roar to the existing focus selector. No scorer, solver,
allocation-cost, schema, graph/assets, shared controls or shortest-route changes.

## Scope and Suggested Priorities

All five optionally suggest Warcry Speed High (2) and Warcry Area of Effect
Normal (1). Infernal, Seismic, Fortifying and standalone Ferocious also suggest
Warcry Cooldown Recovery High (2). Ancestral has no base cooldown and instead
suggests Skill Effect Duration Normal (1) for its eight-second embodiment.
These are editable utility heuristics, not game-supplied power or DPS scores.

Selecting a focus alone adds nothing. Individual effects or Add suggestions
explicitly add preferences without overwriting existing weights, manual defence,
required goals or extra/all-available point budgets. Manual choices still work
for other skills; cautions do not silently remove or disable them. All five
have empty attack/spell/weapon passive scopes and no reviewed support pairs yet.
Unreviewed supports are not necessarily illegal.

| Preset / catalog tier | Application and ownership boundary |
| --- | --- |
| Infernal Cry / 3 | Self-used human-form utility. Nearby enemies enable empowered melee attacks; destabilised enemies Combust on death. Corpses, consuming attacks and the separate secondary Fire explosion are not assumed |
| Seismic Cry / 11 | Self-used human-form utility. Its parent has a secondary Physical hit, not an Attack or Spell hit. Primed/Heavy Stun requirements, later Slam empowerment and Aftershocks remain separate |
| Ancestral Cry / 13 | Human-form activation with a melee martial weapon or unarmed; requires 100 Glory from Ignites. Kaom embodiment, Endurance Charge duration scaling, Volcanic Steps/Eruption and empowered attacks are conditional |
| Fortifying Cry / 9 | Catalog requires an Armoured Shield. Guard and the subsequent Shield Attack that triggers Shield Wave are separate; player Armour is not local shield Armour or Guard strength |
| Ferocious Roar / 7 | Standalone Bear-form utility requiring a Talisman. Nearby enemies supply Rage and empowered Armour Break attacks. Socketed human-form Warcry replacement is outside this preset |

Human-form labels distinguish base use from Ferocious's socketed-Warcry mode;
they do not imply a new equipment/form selector or validator. Preset selection
does not equip a weapon/shield, change form, supply Glory or charges, assume
enemy Power, grant buffs or validate actual usability. Full combat-state, gear,
form/rotation and damage evaluation remain outside the website's heuristic.

Ancestral's gem Attack/Projectile tags describe linked components, not the
non-damaging parent. Fortifying's Shield Wave is a separate triggered non-weapon
Shield Attack. Infernal's Combust is a separate secondary-damage component.
Seismic is genuinely damaging, but this utility focus does not automatically
reward Physical Damage, stun priming, Attack Damage or Spell Damage. Warcry
area does not imply empowered/triggered attack area, buff strength or radius
percentage. Generic speed/cooldown/area source lines remain separate from their
Warcry-specific counterparts and are never copied into both categories.

## Source, Form and Native Evidence

Official [Strength skill data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua),
[gem metadata](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua),
[actor/form handling](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua)
and [timing calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)
are references, not proof that moving upstream files equal the local snapshot.
The catalog key really is `SkillGemInfernallCry`; it is not silently corrected
to a different inferred ID. All five names, keys, positive tiers and tags agree
with the native export. Personal PoB builds/settings and native source were not
modified.

Ten component exports cover five parents plus Combust, Volcanic Steps,
Volcanic Eruption, Shield Wave and the internal Ferocious support. Native type
predicates accept the four human Warcries for Ferocious's internal trigger,
reject Ferocious self-nesting, and reject minion ownership for all five. That
source predicate review does not approve meta-mode website support compatibility
or simulate socketed Warcry firing. Child components are not themselves Warcries.

Thirty-two isolated level-20/quality-0 player fixtures use an empty tree and
sufficient attributes: baseline, signed +/-20 Warcry utility, generic utility,
minion control and duration control for each parent, plus missing-Talisman and
missing-shield controls. Positive Ferocious cases equip a normal Changeling
Talisman; positive Fortifying cases equip a normal Splintered Tower Shield.

- The player owns every tested parent; no minion is present. Minion damage and
  attack/cast speed do not enter player Warcry speed, area or cooldown sums.
  These ownership checks do not imply that a minion's own Warcry uses player
  modifiers. Skeletal Brute remains a minion focus with no player Warcry defaults.
- Ferocious sets native BearForm/Shapeshifted conditions and is disabled without
  a Talisman. Its form condition still appears while disabled, so a form flag is
  not usability proof. The other base fixtures do not set those form conditions.
- The native Fortifying parent is not disabled without a shield even though the
  gem catalog requires an Armoured Shield. Its resolved hit flag is true despite
  `display_statset_no_hit_damage` and zero parent damage output. Neither flag is
  treated as proof of live-game usability or a new damage source.
- Ancestral reports no cooldown but can calculate a use rate with no simulated
  Glory acquisition. That is not permission to use it continuously. Its source
  Glory gate and charge-scaled embodiment remain explicit requirements.
- Ferocious source `castTime` is 1.1 seconds, while the tested native
  `WarcryCastTime` base is the generic 0.8. The preset reason flags this timing
  discrepancy rather than inventing exact live action time. No native patch.

## Independent Arithmetic

Native BASE WarcryCastTime is 0.8 for all five tested parents. Independent
`base / (1 + increasedSpeed/100)` gives 0.8, 0.666667 and 1 seconds for
baseline/+20/-20; all native results agree. The Ferocious source discrepancy
above remains qualified. Speed is not cooldown recovery or guaranteed cadence.

For the four cooldown-based parents, independent
`ceil((8 / (1 + increasedRecovery/100)) / .033) * .033` gives cooldowns
8.019, 6.699 and 10.032 seconds. Ancestral has no cooldown output in all cases.
Endurance Charge bypasses, overrides and charge availability are not simulated.

Area modifier is 1/1.2/0.8. Independent `floor(baseRadius * sqrt(areaModifier))`
gives 40/43/35 for the human Warcries and 70/76/62 for Ferocious. This is area
scaling, not linear radius scaling, enemy count or extra damage per hit.

Duration controls change eight-second Infernal/Ancestral/Fortifying timers to
9.603 seconds after native tick rounding. Fortifying's separate four-second
timer changes 4.026 -> 4.818. Seismic/Ferocious have no duration output. Only
Ancestral's embodiment duration is suggested automatically; the others' timer,
empowerment and Guard interactions are not claimed as full uptime models.

Seismic's average damage stays constant while cooldown-based reported DPS
changes; the website does not use this synthetic DPS as a passive reward.
The other parent outputs remain zero damage. Independent default utility score
for 10% of each selected source is 5 (2+2+1), or Ancestral 4 (2+1+1). Three
distinct selected generic speed/cooldown/area sources add 3, not duplicated
Warcry bonuses. Shared nodes cost/reward once; base nodes earn no new reward;
required negative sources stay required.

## Provenance and Reproduction

| Tested local file | SHA-256 |
| --- | --- |
| Data/Skills/act_str.lua | adab68bd650f7d7dceb3cc71dbbb412acc3013628fd059fd75bbd70123eb24ba |
| Data/Gems.lua | 1ccea00a77c66dded39ee6c5d477d705c0e2602348d752982d075ac56136ffe1 |
| Modules/CalcActiveSkill.lua | a94ef08b56ed23ae4e98618056d457fc7f5f6cf36f7436d86afcae328510c75c |
| Modules/CalcPerform.lua | b5955d4eaed31c01ea85e551a5eef46b6f006d7ebe3e8722993b69a425666b31 |
| Modules/CalcOffence.lua | eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435 |
| Modules/CalcTools.lua | 52e0c84a9fb1058ab922ebfe670ad57ca1c6906ed5f9774fe8a919b80e23b1d9 |

Ignored evidence is under `var/warcry-presets-20261108/`. An initial meta
predicate probe lacked its required actor identity and was corrected to provide
explicit player/minion identities before the complete driver passed. A later
overbroad no-hit assertion was corrected to preserve Fortifying's actual native
flag/zero-output distinction. Fourteen existing missing-node startup messages
are unrelated. Ordinary tests do not require these ignored artifacts or PoB.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/warcry-presets-20261108/review.lua --job var/warcry-presets-20261108
node --import tsx var/warcry-presets-20261108/verify.mjs
```

## Coverage and Validation

Presets 45 -> 50/399 (12.5%); positive-tier presets 50/234 (21.4%). All 46 old
contexts retain identical matches and both fingerprints; each of the five new
contexts equals the 743-wording manual context. Preferences stay 183, supports
31/567 across 19 families and reviewed pairs 312. Union wording 853/2,182
(39.1%) and occurrences 3,412/5,451 (62.6%) are unchanged. These are scoped
heuristic/catalog counts, not complete Warcry mechanics or overall completion.

Quick validation passed 1,750 tests in 49 files, typecheck and no-loss coverage.
The source/native/per-context audit passed before deliberate baseline acceptance.
Tests cover opt-in weights and retained priorities/budgets, catalog normalization,
no inferred support/hit scopes, ownership, form/equipment notes, Glory versus
cooldown, generic overlap, controls, save/JSON transfer, route point/reward
accounting, required penalties and unchanged shortest routing. One final release
validation passed 2,067 tests in 93 files, typecheck, production build, graph
validation and the deliberately reviewed baseline. The post-baseline source/
native/context audit passes. Local port 5174 returns HTTP 200. The existing
main-chunk warning remains at 552.03 kB minified / 145.29 kB gzip; build succeeds.
`git diff --check` passes with existing LF/CRLF conversion notices. No shared
layout/control contract changed; no repeated real-browser matrix or visual
acceptance claimed. No final validation step failed.

Next proposal: review Magnified Area I/II, Prolonged Duration I/II, Efficiency
I/II and Mobility for these five Warcries. Check each component/form gate rather
than assuming all thirty-five potential pairs are valid. Ferocious socketed-
Warcry mode is a separate review, not automatically enabled by support metadata.
Fireball Concentrated Area and ten-Incision remain held separately. No commit,
push or deployment authorized or performed.

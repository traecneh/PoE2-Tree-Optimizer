# Monk Primary Breadth Batch

2026-11-10. Seven missing positive-tier focuses with common reviewed supports.
Local only; no commit, push or deployment.

## Delivered Scope

Frozen Locus, Killing Palm, Shattering Palm, Staggering Palm, Hand of Chayula,
Wave of Frost and Tempest Bell.

All seven receive Magnified Area I/II, Efficiency I/II, Rapid Attacks I/II,
Concentrated Area and Brutality I/II/III. Frozen Locus, Staggering Palm and Tempest
Bell also receive Prolonged Duration I/II. Total: 76 reviewed pairs across six
existing families, not new support catalog entries. Parent-level compatibility
does not approve all damage components or prove usefulness.

## Source and Component Boundaries

Despite the earlier "Monk/unarmed" planning label, these frozen native skills
explicitly require `Staff`, used by Quarterstaff attack bases. They are not
assigned an unarmed damage source from their names. The normal equipped
Quarterstaff baseline and weapon-modifier controls support the implemented
scopes; alternative item/mechanic overrides remain unmodeled.

| Focus | Selected component | Explicit boundaries |
| --- | --- | --- |
| Frozen Locus | Fully Cold, non-melee crystal explosion | Non-damaging placement, crystal Life, destruction, ten-second lifetime, limits and Freeze uptime are separate |
| Killing Palm | Always-hitting Physical melee Strike | Rarity-dependent Cull eligibility, kills, extra dashes and Power Charges are not guaranteed |
| Shattering Palm | Always-hitting melee Strike, 60% Cold conversion | Separate fully Cold non-melee shard explosion needs enough damage to coated enemies; not added to initial-hit value |
| Staggering Palm | Always-hitting Physical melee Strike | Primed for Stun enables instant Heavy Stun; conditional buff projectiles belong to other Quarterstaff attacks |
| Hand of Chayula | Always-hitting melee Strike, 73% Chaos conversion | Fixed 350 ms and socketed Marks/Curses are separate; no utility skill or debuff uptime is assumed |
| Wave of Frost | Melee-area wave, 80% Cold conversion | Not a projectile/spell; instant Freeze requires Primed for Freeze, not assumed frozen-enemy uptime |
| Tempest Bell | Player-owned Physical melee-area shockwave | Not a minion/totem or the skill hitting the Bell; Combo, impact, ten-hit durability, 300 ms trigger limit and ailment empowerment stay separate |

All seven admit reviewed Quarterstaff damage, attack speed, crit, critical bonus,
Stun Buildup and two-handed weapon damage. Only Frozen Locus, Wave of Frost and
Tempest Bell admit scoped Accuracy; the four always-hit Palm focuses warn about
manual Accuracy rather than remove it. Six admit Melee Damage and melee Stun
Buildup; Frozen Locus's explosion does not. Three native Cold focuses admit
attack-specific Elemental Damage and Quarterstaff Freeze Buildup. No automatic
crit, accuracy, ailment, duration, projectile or DoT priorities are added.

Physical Damage targets only the unconverted Physical portion. Chaos is not
Elemental Damage. The Bell's externally enabled Elemental gain does not justify
automatic Elemental weights in the selected Physical shockwave focus.

## Shared Support Rules

Area increases coverage, not hit count. Concentrated Area's damage/coverage
trade-off has an explicit opt-in area priority; selection alone does not change
manual weights. Rapid Attacks affects attack use, not crystal destruction,
threshold completion, charge/Combo supply, socketed Curses or the Bell's separate
trigger interval. Fixed timing and placement cooldown caps remain distinct.

Prolonged Duration is utility context only. It extends the crystal, conditional
Staggering Palm buff or Bell lifetime, not damage per hit, the separate buff
extension cap, Bell durability or trigger limits. Its 20% Mana multiplier remains
even without useful uptime. No automatic duration priority or DPS gain is inferred.

Brutality blocks Cold/Chaos damage and Bell empowerment. Frozen Locus's fully
Cold explosion deals zero damage, so incompatible damage suggestions are
suppressed without switching to placement. Converted Palm/wave components lose
their converted part; Shattering Palm's fully Cold secondary explosion is also
blocked. Tier III's chance to ignore Physical Damage Reduction is not unconditional
penetration. Manual preferences remain for explicit review.

Projectile Acceleration is not approved for these parent focuses, including
Staggering Palm despite its projectile gem tag; the separate buff projectile is
not this melee focus. Spell Echo is rejected for all seven. No support multiplier
is applied to route scores, and this is not in-app Full DPS.

## Evidence and Validation

Frozen isolated PoB 0.23.1 / tree 0.5.5f; no installed PoB or user save changed.
Moving upstream references are not asserted byte-identical to the frozen copy:
[skill source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
[Quarterstaff bases](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Bases/staff.lua),
[Strength supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua),
[Dexterity supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua),
[Intelligence supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua).

Ignored evidence: `var/monk-primary-batch-20261110/`. Native export records seven
identities/tags/weapon restrictions, ten parent stat sets and 105 support
decisions: 76 allowed, 29 rejected. Seventy-two MAIN observations include all ten
parent components, 38 representative support cases, 21 ownership/weapon controls,
one extra Bell setup-duration check and two independent secondary effects.
The baseline is a level-90 Monk with no allocated tree, sufficient attributes,
zero enemy Armour and a normal zero-quality Wrapped Quarterstaff: 7-12 Physical,
10% critical chance. Skills are level 20, zero quality. Player ownership, selected
stat set, weapon type and support application are asserted.

Independent fixtures check range/conversion rounding, 10% crit arithmetic, signed
matching/ownership, Mana costs, fixed/capped timing, area-radius truncation and
33 ms duration quantization. Native Bell setup displays fallback damage fields
despite its non-damaging setup stat; those are not credited as real placement
damage. Selected shockwave and separate impact observations stay distinct.
The high-attribute baseline caps hit chance; this does not verify live Accuracy
or uncapped hit rates. Secondary-effect observations do not prove trigger uptime.

Grouped checks cover all seven support lists, family replacement, manual
preferences, one storage round-trip contract and two weighted/Shortest route
fixtures. Existing independent global scope allowlists and ownership rejections
remain active. Initial focused failures were the old unique-gem count and the
existing 40-word description cap; the count and descriptions were corrected,
not the assertions. Final focused checks: 317/317 tests, one grouped UI test
with unrelated tests filtered out, and typecheck passed.

Final `npm run validate:release` passed: 3,820 tests across 175 files, typecheck,
full asset preparation, production build, graph validation and unchanged
coverage baseline. Complete release-check time was 102.198 seconds. The existing
large-bundle advisory remains non-blocking; no unrelated bundling refactor.

A representative Edge smoke check verified all seven dropdown options and
Frozen Locus, Killing Palm and Tempest Bell support lists/component cautions.
Manual Energy Shield/Accuracy priorities survived focus/support changes,
coverage adjustment remained explicit, and fully Cold Brutality warnings and
Bell duration/trigger limits displayed correctly. No page errors or final console
messages. An initial unrelated `/favicon.ico` 404 did not recur after reload.
The 1,440 x 1,000 screenshot shows a nonblank tree and readable right-pane text
without overlap. Browser evidence is under
`output/playwright/monk-primary-batch-20261110/`; unchanged layout/storage did not
require another mobile or per-tier browser matrix.

The served bundle matched final `dist/assets/index-BsGhVVhi.js` byte-for-byte.
Local preview remains at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. Scoped
whitespace and new-file ASCII checks passed. Nothing was committed or pushed.

## Coverage

| Measure | Before | After |
| --- | ---: | ---: |
| All-catalog skill presets | 140/399 (35.1%) | 147/399 (36.8%) |
| Positive-tier skill presets | 135/234 (57.7%) | 142/234 (60.7%) |
| Configured support choices | 117/567 (20.6%) | Unchanged |
| Reviewed skill/support pairs | 1,027 | 1,103 |
| Recognized distinct main-tree wording | 864/2,182 (39.6%) | Unchanged |
| Recognized stat occurrences | 3,444/5,451 (63.2%) | Unchanged |

No generic parser wording, raw-tree/catalog update, baseline reset, exact-solver
change, point-limit change, W1/W2 optimization or save-format change. These are
scoped heuristic/catalog metrics, not complete gem mechanics or a verified live
obtainable-primary completion percentage. No route-quality research audit ran.

## Next Broad Batch

Review eight remaining mace/shield attacks with common supports: Armour Breaker,
Perfect Strike, Molten Blast, Rolling Magma, Forge Hammer, Resonating Shield,
Shield Charge and Shield Wall. Keep weapon damage, shield-derived sources,
channels and secondary objects distinct. Proposal only; not started here.

# Remaining Non-Totem Attack Focuses

2026-11-10. Twelve focuses and common supports delivered as one local batch.
No commit, push or deployment. Shortest and the optimization engines are unchanged.

## Selected Components

| Focus | Selected component | Separate mechanics |
| --- | --- | --- |
| Cull The Weak | Always-hitting Physical Spear melee strike | Cull eligibility depends on rarity and Life; Frenzy requires kills; no Accuracy suggestion |
| Elemental Sundering | Fully Cold explosion, not melee | Initial pulse does no damage; Fire/Lightning are separate; requires external Freeze and cannot itself Freeze/Shock/Ignite |
| Escape Shot | Bow impact, 80% Cold conversion | Fixed 700 ms, ground-targeted arrow and separate Ice Fragments; no extra projectile/contact assumption |
| Fangs of Frost | Initial Spear melee stab, 80% Cold | Parried consumption creates a separate fully Cold explosion and eight-second chilled ground |
| Oil Barrage | Unempowered Wyvern Physical projectile hit | Oil Ignite storage, enemy debuffs, Power-Charge-empowered Lightning and channel phases are separate |
| Thunderous Leap | Spear melee-area impact, 70% Lightning | Fixed 1100 ms, teleport delay, Detonator events and Shock uptime are separate |
| Trail of Caltrops | Player-owned triggered Caltrops hit | Not activating the persistent 30-Spirit parent; dodge/contact governs attacks; native source discrepancies below |
| Twister | Unempowered Physical Spear projectile-area hit | Not melee; fixed 660 ms hit interval, Whirlwind stages, elemental ground gains and repeated contact are separate |
| Wind Serpent's Fury | Physical Spear melee thrust | Requires and consumes Frenzy; serpents are player-owned melee attacks, not minions/projectiles |
| Wing Blast | Initial Wyvern Physical melee-area hit | Initial hit cannot build Stun from damage; forced Heavy Stun requires Primed; shockwave and charge gain are conditional |
| Devour | Conditional Wyvern Physical landing hit | Needs corpse/Cullable enemy; nearby consumption does not leap/Slam; Life restoration is not regeneration/sustain |
| Flame Breath | Unempowered fully Fire area-attack hit | Not melee/projectile/spell; channel minimum, cooldown, Rage, compounding Ignites and empowered Lightning are separate |

Six explicit Spear focuses receive reviewed Spear and one-handed scopes, but
Cull The Weak does not receive scoped Accuracy. Escape Shot receives Bow and
two-handed weapon damage. No weapon family or handedness is inferred for Wyvern
or Caltrops. Six hits receive Melee Damage, but only five receive melee Stun
Buildup: initial Wing Blast is excluded. Five have selected Elemental conversion.
No automatic crit, Accuracy, ailment, duration or complete sustain assumption.

## Common Supports and Constraints

Magnified Area I/II, Efficiency I/II, Concentrated Area and Brutality I/II/III
are reviewed for all twelve selected components. Rapid Attacks I/II applies to
eleven, not Caltrops. Projectile Acceleration I/II applies to Escape Shot, Oil
Barrage, Caltrops and Twister. Prolonged Duration I/II applies to Caltrops,
Twister and Flame Breath. Spell Echo is rejected throughout. Total: 132 pairs,
seven existing families; no new support catalog choice.

Support magnitudes are not route-score or Full DPS multipliers. Selecting a
support preserves manual weights. Concentrated Area offers an explicit coverage
priority action only for verified area-damaging hits. Duration and projectile
supports do not assume more contacts, extra damage, charge supply or sustain.
Fully converted Cold Sundering and Fire Breath deal no damage with Brutality;
incompatible suggestions disappear without switching focus or deleting weights.

### Native Limitations Kept Explicit

Trail of Caltrops grants a separate triggered attack. The parent accepts none of
the fifteen tested support choices; the child accepts twelve. Tests link the
real parent gem and select its granted child, rather than creating a fake manual
attack. The child costs zero Mana and the parent still reserves 30 Spirit with
Efficiency II; Rapid Attacks is incompatible and activation speed stays zero.

The child description calls its hit area damage, but it lacks the native area
damage flag. Concentrated Area and generic Area Damage change coverage or nothing,
respectively, without raising captured hit damage. No area-damage scope or
automatic area-damage priority is assigned. Source also requests weapon replacement,
but the frozen runtime retains equipped base damage and weapon-family scaling:
Spear 5-9 is added to gem 159-238 before the 1.43 multiplier. Warpick changes the
hit, and Spear damage applies while equipped. These are recorded discrepancies,
not evidence to hard-code Spear/handedness into a weapon-unrestricted focus.
Special Thorns-to-Attack transfer is not modeled. Generic player attack,
Physical/projectile hits and coverage remain scoped heuristics, not exact damage.

Fangs and Oil Barrage have secondary ground timers but reject Prolonged Duration.
Flame Breath accepts it but exposes no beneficial native base-duration timer;
it does not extend minimum channel or Rage grace. Oil Barrage's native ongoing
Mana cost stays 40 when Rapid Attacks II raises attack speed from 3.75 to 4.6875;
the tooltip does not turn that observation into a sustain guarantee. Devour's
native baseline omits target-distance adjustments; its speed is not a complete
corpse-to-landing cycle.

## Evidence and Validation

Frozen isolated PoB 0.23.1 / tree 0.5.5f, not installed PoB or user saves.
Moving source references:
[Dexterity skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua),
[Strength skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua).
Local evidence: `var/attack-closure-batch-20261110/`.

Export covers twelve parents, the granted Caltrops child and 195 support
decisions. Native calculation capture contains 103 component, support, ownership
and equipment observations. Selected effect/stat set, player ownership and
support application are asserted. Level-20, zero-quality, empty level-90 Huntress
with sufficient attributes and zero enemy Armour; normal Hardwood Spear 5-9,
Crude Bow 6-9 or Changeling Talisman 9-15. Capped hit chance is not a live
Accuracy audit. No route-quality or Full DPS research audit was performed.

Independent fixtures recompute recorded source/conversion ranges, crit averages,
Mana rounding, area-radius truncation, fixed-time versus scalable attack speed,
and 33 ms duration quantization. Native discrepancies are preserved, not forced
to match intended game behavior. Signed scoped/generic effects, overlap,
ownership, support-family replacement, manual priorities and storage transfer
are grouped. Independent existing allowlists remain explicit.

Focused validation: 399 pure tests across thirteen files, one grouped shared UI
test and typecheck passed. Final release and browser results are recorded below.

`npm run validate:release` passed: 3,921 tests across 177 files, typecheck, asset
preparation, production build, graph validation and unchanged coverage baseline.
One complete release pass took 107.828 seconds. The existing large-chunk advisory
remains non-blocking; no unrelated bundling changes were made.

Edge smoke on the rebuilt preview confirmed all twelve entries and representative
Cull The Weak, Cold Sundering, triggered Caltrops and Flame Breath contracts.
Manual ES, Accuracy and Attack weights survive focus/support changes. Native
area discrepancies, reservation boundaries, incompatible Rapid Attacks, full
conversion with Brutality and duration/channel distinctions display correctly.
Zero page errors and final console messages. Initial unrelated favicon 404 was
absent after reload. The 1,440 x 1,000 screenshot shows a nonblank tree and readable
scrolling right-pane content without overlap. Evidence:
`output/playwright/attack-closure-batch-20261110/`.

Final preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`; its served
`assets/index-CHcs6aUs.js` matches the rebuilt local file byte-for-byte. New-file
ASCII and scoped whitespace checks passed. No commit, push or deployment.

## Coverage and Next Batch

155 to 167 configured skill presets: 167/399 (41.9%) raw catalog and 162/234
(69.2%) positive-tier entries. Reviewed pairs rise from 1,191 to 1,323. Support
choices stay 117/567 across 71 families; 184 preference categories, 864/2,182
distinct wordings and 3,444/5,451 occurrences remain unchanged. No baseline reset,
raw-data refresh, save-format change, W1/W2 optimization or in-app Full DPS.

The frozen positive-tier Attack catalog now has only Shockwave Totem missing;
it belongs to the separate proxy group. Next proposed batch: all twelve remaining
positive-tier Spell catalog entries, with common supports and separate damage,
buff and utility checks: Barrage, Charged Staff, Convalescence, Elemental Weakness,
Frost Darts, Ice-Tipped Arrows, Mana Tempest, Profane Ritual, Snap, Temporal Chains,
Tornado and Volcano. This is a proposal, not authorization to start that batch.

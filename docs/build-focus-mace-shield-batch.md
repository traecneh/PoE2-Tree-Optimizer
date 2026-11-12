# Mace, Shield and Wyvern Breadth Batch

2026-11-10. Eight requested focuses delivered together, with common supports.
Local only; no commit, push or deployment.

## Scope and Sources

| Focus | Selected damage component | Separate mechanics |
| --- | --- | --- |
| Armour Breaker | Physical Mace melee Strike | On-hit Armour Break, Knockback, dual-wield bonuses and Fully Broken Armour payoff |
| Perfect Strike | Normal melee release, 40% Fire conversion | Separate Perfect Timing release has different damage and 80% conversion; channel completion and Ignite are not assumed |
| Molten Blast | Mace projectile explosion, 60% Fire conversion | Non-area shrapnel is fully Fire; no melee transfer, cone overlap or extra contacts |
| Rolling Magma | Fully Fire Wyvern/Talisman projectile impact | Not Mace, melee or spell damage; bounces and Detonator activation do not guarantee repeated damage |
| Forge Hammer | Mace melee impact, 30% Fire conversion | Throw is not projectile damage; Warcry fissures are fully Fire; recall resets cooldown and lodged time pauses recovery |
| Resonating Shield | Shield-derived Physical melee shockwaves | Main-hand damage/speed does not transfer; channelled Armour Break and active Block are separate |
| Shield Charge | Shield-derived Physical melee-area hit | Collision uses different multiplier and shield Armour scaling; minimum channel, travel distance and active Block are separate |
| Shield Wall | Player-owned shield-derived Physical melee-area segment explosion | Not minion/totem damage; wall survival, early enemy-destruction penalty, Slam empowerment and segment overlap are conditional |

All eight retain generic player attack/area/crit and reviewed hit-debuff scopes.
Only four receive Mace damage/speed/Stun Buildup; six receive melee damage/Stun
Buildup; four receive attack-specific Elemental Damage. Neither shield skills
nor Rolling Magma inherit Mace modifiers. No handedness is inferred for skills
that admit multiple loadouts, and no new generic passive wording is introduced.

Shield base damage is gem flat damage plus discrete local shield Armour scaling,
not the main-hand weapon's damage or global player Armour. No automatic Armour
weight is presented as a shield damage upgrade. On-hit Armour Break amount is
suggested only for Armour Breaker and Resonating Shield, not assumed damage or
Fully Broken Armour uptime. Shield Charge's Movement Speed suggestion is travel
utility, not a maximum-distance hit multiplier. No automatic crit, Accuracy,
ailment, DoT, duration or channel-sustain benefit is claimed.

## Common Supports

Magnified Area I/II, Efficiency I/II, Rapid Attacks I/II, Concentrated Area and
Brutality I/II/III cover all eight. Projectile Acceleration I/II extend to Molten
Blast and Rolling Magma; Prolonged Duration I/II extend to Forge Hammer and
Shield Wall. This adds 88 reviewed pairs across seven existing families, not
new support catalog choices. Spell Echo is rejected for all eight.

Area remains coverage, not guaranteed contacts. Concentrated Area has an explicit
opt-in coverage-priority action; support selection alone preserves manual weights.
Projectile speed changes delivery, not bounce counts or guaranteed shrapnel
contacts. Longer hammer/wall lifetime does not guarantee damage and can delay
hammer recovery. Faster actions do not supply Perfect Timing, recalls, Warcries,
enemy collisions or a complete repeat-use cycle.

Brutality prevents Fire/Chaos damage without reversing conversion. Rolling
Magma's selected fully Fire focus deals no damage, so incompatible damage
suggestions disappear without changing focus or deleting manual preferences.
Other Fire-converted focuses retain only their Physical remainder; fully Fire
shrapnel/fissures also lose damage. Tier III's chance to ignore Physical Damage
Reduction is not unconditional penetration. No support multiplier becomes a
route-score or Full DPS multiplier.

## Evidence and Lean Validation

Frozen isolated PoB 0.23.1 / tree 0.5.5f; no installed PoB or user saves changed.
Moving upstream references are not a claim of byte-identical source:
[skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua),
[Mace bases](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Bases/mace.lua),
[shield bases](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Bases/shield.lua),
[Talisman bases](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Bases/talisman.lua).

Ignored evidence: `var/mace-shield-batch-20261110/`. Export records eight gem
identities/tags, twelve stat sets and 120 native support decisions: 88 allowed,
32 rejected. Eighty MAIN observations cover twelve components, 44 representative
support cases, eighteen source/ownership controls and six equipment controls.
Level-20 zero-quality skills use an empty level-90 Warrior with sufficient
attributes, zero enemy Armour and normal zero-quality equipment: Wooden Club
(6-10 Physical, 5% crit), Changeling Talisman (9-15 Physical, 8% crit), and
Splintered Tower Shield (18 Armour) for shield skills. Swapping to Painted Tower
Shield (33 Armour) raises shield damage; swapping only the Club to a Warpick does
not. Selected stat set, player ownership, source item type and support application
are asserted. High-attribute capped Accuracy is not a live hit-rate audit.

Independent fixtures recompute gem/weapon and shield-per-15-Armour ranges,
conversion, crit averages, Mana rounding, radius truncation and 33 ms timer
quantization. They retain distinct Perfect Strike, shrapnel, fissure and Collision
values rather than adding them to the selected hit. Generic, scoped, conditional
and other-owner passive lines stay separate. One grouped storage contract, two
weighted/Shortest route fixtures and the independent global allowlists remain.

**Native cost caveat:** Resonating Shield's source includes
`attack_speed_modifiers_apply_to_over_time_cost`, but its captured Mana-per-second
output remains 46 when Rapid Attacks II raises speed from 1.25 to 1.5625. Applying
the source-declared 25% speed increase to the unrounded 2816/60 cost would instead
produce 58.67 Mana/second before rounding. This is a source/runtime inconsistency,
not proof that faster attacks are free. Its tooltip warns about that limitation;
whole-build sustain is not modeled or ranked. Perfect Strike and Shield Charge
have separate cost rules; the warning is not generalized into invented formulas.

Focused checks passed: 295 pure tests across nine files, one grouped shared-control
test with unrelated tests filtered out, and typecheck. No previous assertions
were removed. No route-quality research audits or per-support browser matrix ran.

The first release attempt passed 3,857/3,858 tests and found one older Armour
Break suggestion allowlist. It was extended only for the two native on-hit break
sources, retaining manual-priority assertions and explicitly rejecting automatic
break-duration/Fully Broken Armour effect suggestions. The targeted correction
passed 47/47 tests; the first log is retained as `release-first.log`.

Final `npm run validate:release` passed: 3,858 tests in 176 files, typecheck,
full asset preparation, production build, graph validation and unchanged coverage
baseline. Complete successful release-check time: 95.205 seconds. The existing
large-bundle advisory remains non-blocking; no unrelated bundling changes.

One Edge smoke check confirmed all eight dropdown entries, plus representative
Resonating Shield, Rolling Magma and Forge Hammer support lists, source/cost
warnings and manual-priority preservation. Area-priority application remained
explicit; full-conversion Brutality restrictions and hammer duration/cooldown
cautions displayed correctly. No page errors or final console messages. The
initial unrelated `/favicon.ico` 404 did not recur after reload. The 1,440 x 1,000
screenshot shows a nonblank tree and readable right-pane text without overlap.
Evidence: `output/playwright/mace-shield-batch-20261110/`. No new layout required
another mobile or per-tier browser matrix.

The preview serves final `dist/assets/index-U_xalj8g.js` byte-for-byte at
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. Scoped whitespace and new-file ASCII
checks passed. No commit, push or deployment was performed.

## Coverage and Next Batch

Skill presets: 147/399 (36.8%) to 155/399 (38.8%). Positive-tier presets:
142/234 (60.7%) to 150/234 (64.1%). Reviewed pairs: 1,103 to 1,191. Support
choices stay 117/567 across 71 families; 184 preference categories, 864/2,182
distinct recognized wordings and 3,444/5,451 stat occurrences remain unchanged.
No raw-data update, baseline reset, allocation/save change, exact-solver change
or W1/W2 optimization. Full DPS remains unimplemented. These are frozen catalog
and heuristic metrics, not an overall project-finished percentage.

Next: the twelve remaining positive-tier non-totem Attack focuses in one batch:
Cull The Weak, Elemental Sundering, Escape Shot, Fangs of Frost, Oil Barrage,
Thunderous Leap, Trail of Caltrops, Twister, Wind Serpent's Fury, Wing Blast,
Devour and Flame Breath, including common supports. Future targets are 12-20
skills or a whole larger reusable-mechanic group, with one combined release
check. Split only for a genuinely new source/ownership model or blocker.
Proposal only; the next twelve are not implemented here.

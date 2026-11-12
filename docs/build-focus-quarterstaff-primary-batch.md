# Quarterstaff Primary Breadth Batch

2026-11-10. Local-only addition of nine missing positive-tier skills, with common
reviewed supports included in the same batch. No commit, push or deployment.

## Delivered Scope

Falling Thunder, Glacial Cascade, Storm Wave, Flicker Strike, Gathering Storm,
Siphoning Strike, Vaulting Impact, Whirling Assault and Wind Blast.

Shared support rules extend Magnified Area I/II, Efficiency I/II, Rapid Attacks
I/II, Concentrated Area and Brutality I/II/III to all nine focuses. Projectile
Acceleration I/II are also reviewed for Falling Thunder's secondary projectiles:
92 new pairs, not 92 new gems. Existing family/tier restrictions remain intact.
Concentrated Area's coverage-priority change is still opt-in; other selections
do not alter manual priorities or multiply route scores by support magnitudes.

## Component Boundaries

| Skill | Selected component | Exceptions kept explicit |
| --- | --- | --- |
| Falling Thunder | Melee Slam, 60% Physical-to-Lightning | Fully Lightning secondary projectiles need consumed Power Charges; no assumed count or charge supply |
| Glacial Cascade | Wave, 80% Physical-to-Cold | Wave/final burst lack melee damage flags and cannot Freeze; final burst consumes external Freeze; no assumed crystal explosions |
| Storm Wave | Melee area hit, 80% Physical-to-Lightning | Fissure is not a projectile; Shock chance does not establish uptime or magnitude |
| Flicker Strike | Physical teleporting Strike | Additional Strikes consume charges; cannot gain Power Charges during use; no sustained Strike count |
| Gathering Storm | Normal Dash, 20% Physical-to-Lightning | Perfect Dash, shockwaves and Tempest Bell explosions are separate; fixed 800 ms and channel cost remain separate |
| Siphoning Strike | Physical Dash hit | Cannot Shock; consuming external Shock supplies a separate fully Lightning non-melee shockwave and Power Charge |
| Vaulting Impact | Physical landing hit | Fixed 1000 ms; cannot Daze; Broken Stance requires externally Dazed enemies and has a hit limit |
| Whirling Assault | Physical spinning Strike | Fixed 1000 ms; no assumed number of contacts or travel distance |
| Wind Blast | Physical melee-area gust | Not a projectile; Daze/Knockback depend on application and distance |

All nine require a Quarterstaff, so matching weapon and two-handed scopes are
enabled. Melee Damage/Stun Buildup is deliberately excluded for Glacial Cascade's
non-melee component. Elemental attack wording is enabled only for the four
selected converted hits. No automatic Critical Hit Chance/Bonus, charge uptime,
damage-over-time, secondary-hit count or duration-based damage is suggested.
Existing generic manual categories are not silently removed or rewritten.
Physical Damage preference text explicitly targets the unconverted Physical
remainder; it does not claim that Physical modifiers scale converted Elemental
damage. The heuristic priorities are not calculated damage shares.

Brutality suppresses incompatible elemental suggestions and warns that converted
damage is lost, not converted back to Physical. Falling Thunder and Siphoning
Strike's fully Lightning secondary components deal no damage under it. Falling
Thunder's Projectile Acceleration remains delivery-only context for the secondary
component; Tier II's added Pierce chance is redundant with native always-Pierce.
It does not change this preset into a projectile focus or score extra contacts.
Duration, mobility and additional support families are not auto-approved by tags.

## Evidence and Validation

Source snapshot: isolated PoB 0.23.1 / tree 0.5.5f. No installed PoB source or user
save changed. Upstream references are moving sources, not a claim that they are
byte-identical to the frozen copy:
[skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
[Dexterity supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua),
[Strength supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua),
[Intelligence supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua).

Ignored evidence: `var/quarterstaff-primary-batch-20261110/`. Native export records
nine gem identities, tags, weapon constraints, all 16 components and 108 support
eligibility decisions (92 allowed, 16 rejected). Efficiency permits empty skill
types because its rule is exclusion-based; required-type supports reject them.

61 native MAIN cases cover all 16 base components and five representative support
tiers on each of nine focuses. The isolated level-90 Monk has no allocated tree,
charges or conditional enemy setup, enough attributes, zero enemy Armour and a
normal zero-quality Wrapped Quarterstaff (7-12 Physical, 10% critical chance).
Player ownership, selected component, weapon type and applied supports are
asserted. Frozen independent fixtures check weapon conversion/rounding, AverageHit
with the fixture's 2x critical multiplier, area-to-radius square roots, rounded
Mana costs and fixed/scalable timing. Gathering Storm's cost uses its per-minute
source; Flicker speed is quantised. Missing native radii are not invented.

One grouped pure test covers identities, signed scopes, ownership/conditional
rejection, support tiers, manual priorities, storage and representative weighted
versus Shortest routes. One grouped UI test checks all nine dropdown choices and
common controls. Exhaustive existing scope allowlists remain strict and use the
independent fixture groups. No route-quality or neighborhood research audits.

## Coverage

| Measure | Before | After |
| --- | ---: | ---: |
| All-catalog skill presets | 111/399 (27.8%) | 120/399 (30.1%) |
| Positive-tier skill presets | 106/234 (45.3%) | 115/234 (49.1%) |
| Configured support choices | 117/567 (20.6%) | Unchanged |
| Reviewed skill/support pairs | 710 | 802 |
| Recognized passive wording | 864/2,182 (39.6%) | Unchanged |
| Recognized passive occurrences | 3,444/5,451 (63.2%) | Unchanged |

These are scoped heuristic/catalog metrics, not obtainable-primary completion
or Full DPS coverage. Passive wording, coverage baseline, raw tree, routing
algorithms, point budgets, W1/W2 and saved-build formats are unchanged.

Validation completed:

- Focused tests initially passed 543/544; one description exceeded the existing
  40-word limit. It was shortened, and all 58 catalog tests passed on rerun.
- `npm run validate:release` passed 3,674 tests in 172 files, typechecking,
  production build, graph validation and the unchanged coverage baseline in
  93.030 seconds. Existing large-chunk advisory remains nonblocking.
- Representative Edge checks passed Falling Thunder, Gathering Storm and
  Glacial Cascade: support counts, charge/projectile cautions, fixed timing,
  opt-in coverage changes, elemental prohibition and retained manual priorities.
  No page errors or final console errors/warnings. The initial existing
  `/favicon.ico` 404 was inspected separately. A test-script selector typo was
  corrected before the successful smoke; it was not an application failure.
- A desktop screenshot confirmed readable notes and a nonblank tree. No layout
  implementation changed, so no repeated mobile/per-tier browser matrix.
  Browser artifacts: `output/playwright/quarterstaff-primary-batch-20261110/`.
- Final wording fixes clarify Physical-versus-converted damage and replace the
  inherited rain-specific coverage note with a reviewed-component note. The
  affected pure preset/support contracts passed 191 tests; final typecheck/build
  passed. This text-only follow-up did not repeat the full suite.
- Final preview JavaScript matches dist byte-for-byte at
  `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`; asset `index-d8EnsVZD.js`.
  Scoped `git diff --check` passed. Local checks are not user visual acceptance
  or live-game timing validation. No commit, push or deployment.

## Next Broad Batch

Review 8-10 remaining bow primary focuses with shared supports: Lightning Rod,
Stormcaller Arrow, Electrocuting Arrow, Detonating Arrow, Freezing Salvo, Magnetic
Salvo, Snipe, Spiral Volley, Tornado Shot and Shockchain Arrow. Shortlist from the
missing positive-tier inventory, then gate actual components, charge/Infusion
requirements, target overlap and detonation timing. Proposal only.

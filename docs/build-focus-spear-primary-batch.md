# Spear Primary Breadth Batch

2026-11-10. Ten missing positive-tier focuses with common reviewed supports in
one local batch. No commit, push or deployment.

## Delivered Scope

Spearfield, Storm Lance, Whirling Slash, Spear of Solaris, Blood Hunt, Glacial
Lance, Primal Strikes, Rapid Assault, Disengage and Whirlwind Lance.

Five shared support families extend to all ten focuses: Magnified Area I/II,
Efficiency I/II, Rapid Attacks I/II, Concentrated Area and Brutality I/II/III.
Projectile Acceleration I/II also extend to the four eligible parent skills:
Storm Lance, Spear of Solaris, Glacial Lance and Whirlwind Lance. Total: 108 new
reviewed pairs, six families, no new support catalog entries. Selected components
still gate actual benefit; parent compatibility is not a damage-scope approval.

## Explicit Components

| Focus | Selected component | Boundaries |
| --- | --- | --- |
| Spearfield | Physical hazard explosion | Initial stab deals no damage; explosion is non-melee; contact, early-detonation penalty and hazard limits are separate |
| Storm Lance | Fully Lightning lodged bolt | Not the initial 30%-converted thrown spear; no Area Damage scaling; Frenzy frequency/lifetime and external Detonation remain separate |
| Whirling Slash | Physical melee circular slash | Not the separate collapse; stages, elemental-ground empowerment, Slow/Blind and leaving the storm are not assumed |
| Spear of Solaris | Always-hitting impact, 75% Fire conversion | Requires maximum Glory; fixed 1,400 ms, pulses and Ignited Ground are not a repeatable hit/DPS cycle |
| Blood Hunt | Physical melee Dash hit | Cannot cause Bleeding; external Bleeding/Blood Loss enable a separate explosion; fixed 150 ms stays separate |
| Glacial Lance | Piercing spear hit, 80% Cold conversion | No Area Damage scaling; Frenzy-enabled delayed shrapnel, fragment Chill and explosion contacts are separate |
| Primal Strikes | Normal melee strikes, 40% Lightning conversion | Cannot Shock itself; player-owned attack spirits are not minions; final Exposure/combo completion and external Shock are not assumed |
| Rapid Assault | Normal Physical stabs | Final stab separately inflicts Bleeding and attaches spearheads; external Detonators trigger non-melee explosions |
| Disengage | Physical initial strike | External Parried supplies shockwave/Frenzy gain; 1.5-second base cooldown, fixed 200 ms and jumping defence remain separate |
| Whirlwind Lance | Physical melee-area collapse | Not the thrown spear or a DoT; entering the storm triggers collapse; Frenzy stages and elemental-ground empowerment are not assumed |

All ten explicitly require the one-handed Spear weapon family. Matching one-handed
weapon modifiers are enabled without inferring handedness from class, equipped
gear or a Melee tag. Spearfield's explosion, Storm Lance's bolt, Solaris's impact
and Glacial Lance's spear do not receive Melee Damage or melee Stun Buildup.
Eight focuses receive Attack Area Damage; Storm/Glacial Lance receive coverage
utility only. Solaris's always-hitting impact receives no weapon-specific
Accuracy scopes and warns about manual Accuracy, but critical modifiers remain
independent. No automatic crit/accuracy, ailment chance, duration or DoT weights.

Physical modifiers target the unconverted Physical portion, not converted
Elemental damage. Ground-empowered damage, initial/secondary components, minion
ownership, hazard contact and repeated hits are not inferred from names or tags.
This batch is not an exhaustive approval of every Spear skill or support.

## Shared Support Behavior

Concentrated Area offers an explicit coverage-priority adjustment for the eight
area-damage components only. It does not change native lodged-bolt/Glacial spear
damage or silently change their priorities. Magnified Area concerns coverage,
not an area-damage bonus or guaranteed contacts. Rapid Attacks does not supply
Glory, debuffs, charges, hazards, combo completion or collapse triggers; Disengage
remains cooldown-capped in the native baseline despite faster action timing.

Projectile Acceleration affects delivery rather than bolt intervals or Glory.
For Whirlwind Lance it concerns the initial throw, not the selected melee
collapse; no projectile damage/speed preference is automatically added to that
collapse. Tier II does not add value for already always-Piercing spears or prove
extra contacts. Costs and family/tier replacement still apply.

Brutality removes incompatible Elemental suggestions. Storm Lance's fully
Lightning lodged-bolt focus deals no damage with it; damage suggestions are
suppressed without switching to the initial spear or reversing conversion.
Other converted portions and ground-empowered Elemental gains are lost. Tier III
does not grant unconditional mitigation bypass or a DoT benefit. Manual weights
remain for explicit review, and support magnitudes are not route-score or Full
DPS multipliers. Existing saved-build and routing contracts are unchanged.

## Evidence and Lean Validation

Frozen isolated PoB 0.23.1 / tree 0.5.5f. No installed PoB source or user save
changed. Moving upstream references are separate from the frozen local snapshot:
[skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua),
[Spear bases](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Bases/spear.lua),
[Dexterity supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua),
[Strength supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua),
[Intelligence supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua).

Ignored evidence: `var/spear-primary-batch-20261110/`. Export records ten gem
identities/tags/weapon restrictions, 25 stat sets and 120 compatibility decisions:
108 allowed, twelve Projectile Acceleration rejections. Ninety-seven native MAIN
cases inspect all 25 components, 54 representative support cases and eighteen
controls for hazard/bolt/impact damage and one-handed modifiers. The empty
level-90 Huntress has sufficient attributes, zero enemy Armour and a normal
zero-quality Hardwood Spear (5-9 Physical, 5% critical chance); skills are level
20, quality zero. Player ownership, active component, Spear weapon type and
support application are asserted. Conditional stat sets are inspected separately,
not credited as always available. High fixture Accuracy already caps hit chance;
the Accuracy controls do not prove uncapped accuracy or live-game hit rates.

Independent fixtures check stored conversion ranges, critical arithmetic, costs,
signed scope matching, other-owner/conditional rejection, tier replacement,
manual priorities, storage and representative weighted/Shortest route contracts.
Primal Strikes' native effective Lightning contribution has an observed extra
1.5 factor beyond stored ranges. It is recorded separately rather than treated
as proof of sustained Exposure or copied into route scores; no complete native
combat/condition equivalence is claimed for that average.

One focused assertion caught a radius boundary: PoB truncates the square-root
area multiplier to two decimals before flooring the final radius. The independent
formula was corrected from the native `calcRadius` source, not by changing the
frozen result or relaxing the assertion. Spearfield's 69-unit native radius
therefore becomes 82, not 83, with Magnified Area II. Primary and secondary radius
fields are not claims about exact in-game contact area or target counts.

The first focused pure run passed 370/371 tests; all 45 grouped tests passed
after the arithmetic correction. The targeted shared-control contract and
typecheck passed. Existing exhaustive scope allowlists were extended using
independent fixture groups, retaining ownership and duplicate-counting checks.
No previous tests were removed, and no route-quality/neighborhood audits ran.

Final release and browser checks:

- `npm run validate:release` passed: 3,786 tests in 174 files, typecheck,
  production build, graph validation and unchanged coverage baseline. Total
  release-check time: 117.955 seconds. The existing large-chunk advisory remains
  non-blocking; no unrelated bundling changes were made.
- A representative Edge smoke check covered Solaris, Storm Lance and Whirlwind
  Lance, their twelve reviewed support choices, explicit support-priority
  application and preservation of manual Energy Shield/Accuracy priorities.
  Always-hit/Glory, non-area lodged-bolt, fully-converted Brutality and
  throw-versus-collapse cautions passed. No page errors or final console messages.
  An initial `/favicon.ico` 404 was unrelated to the app and did not recur on reload.
- The 1,440 x 1,000 screenshot shows the tree and readable right-pane controls
  without overlap. Evidence is under
  `output/playwright/spear-primary-batch-20261110/`. No layout changes required
  another mobile or per-tier browser matrix.
- Served JavaScript matched the final production bundle byte-for-byte
  (`index-BGj2OXsm.js`). Local preview remains available at
  `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
- Scoped whitespace and new-file ASCII checks passed. No commit, push or
  deployment was performed.

## Coverage

| Measure | Before | After |
| --- | ---: | ---: |
| All-catalog skill presets | 130/399 (32.6%) | 140/399 (35.1%) |
| Positive-tier skill presets | 125/234 (53.4%) | 135/234 (57.7%) |
| Configured support choices | 117/567 (20.6%) | Unchanged |
| Reviewed skill/support pairs | 919 | 1,027 |
| Recognized distinct main-tree wording | 864/2,182 (39.6%) | Unchanged |
| Recognized stat occurrences | 3,444/5,451 (63.2%) | Unchanged |

No new generic passive wording, raw tree update, coverage-baseline reset, exact
solver change, point-limit change, W1/W2 optimization or save-format change.
These are scoped catalog/heuristic metrics, not overall completion or verified
live obtainable-primary coverage. In-app Full DPS remains unimplemented.

## Next Broad Batch

Finish the seven remaining Monk/unarmed focuses together: Frozen Locus, Killing
Palm, Shattering Palm, Staggering Palm, Hand of Chayula, Wave of Frost and Tempest
Bell. Review common supports in the same batch, keeping unarmed damage sources,
conditional effects and Bell/other secondary-object ownership explicit. This is
a coherent seven-skill group, not padded with unrelated skills to reach ten.
Proposal only; none implemented by this batch.

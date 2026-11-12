# Spell and Utility Breadth Batch

2026-11-10. Twelve focuses delivered together, including common supports.
Local only. No commit, push, deployment, optimizer algorithm or Shortest change.

## Component Choices

| Focus | Selected component | Boundaries |
| --- | --- | --- |
| Barrage | Non-damaging preparation buff | Later Repeatable Bow/Projectile Spear attack, Frenzy consumption, repeat penalty and attack-dependent cooldown are not this cast's damage |
| Charged Staff | Power-Charge-consuming Quarterstaff buff | Separately granted Charged Shockwave and later attacks retain their own damage; charge count/stacking are not supplied |
| Convalescence | Granted active recovery spell | Not toggling the persistent 30-Spirit parent; protection ends at full ES; cooldown recovery pauses during buff |
| Elemental Weakness | Non-damaging resistance curse | Curse magnitude is not player Elemental damage, Exposure or penetration; activation delay differs from cast time |
| Frost Darts | Initial Cold projectile hit | Conditional ice chunks/infusion explosion are separate; cannot Freeze or Chill; no extra contacts assumed |
| Ice-Tipped Arrows | Non-damaging empowerment cast | Separately triggered Ice Fragments are attack damage; attack-use limit, Frenzy bypass and sustained-skill exclusion stay explicit |
| Mana Tempest | Non-damaging empowerment storm | Other Mana-costing spells benefit; percentage drain/escalation, staying inside and paused cooldown are separate |
| Profane Ritual | Corpse-based intrinsic Chaos DoT | Explicit Spell Damage-to-DoT scaling; longer lifetime delays corpse consumption and Power Charge reward |
| Snap | Conditional Cold blast | Needs external Freeze or Frostbolt; Fire/Lightning variants, spread, unique bonuses and remnants are separate; cannot Freeze/Shock/Ignite |
| Temporal Chains | Non-damaging enemy curse | Action speed and other-effect expiry differ from damage, incoming debuff protection and original ailment duration |
| Tornado | Unempowered Physical DoT | Explicit Spell Damage-to-DoT scaling; no hit/crit; Elemental ground absorption, pull and contact uptime are conditional |
| Volcano | Base Fire eruption hit | Sprays are separate projectiles; extra channel stages empower initial eruption, not later sprays; no Slams/overlap/stages assumed |

Only Frost Darts, Snap and Volcano receive spell hit-crit/Hinder scopes. Only
Snap and Volcano receive Spell Area Damage. Frost Darts alone receives reviewed
spell-projectile speed for its selected component; Volcano's optional projectile
support concerns separate sprays. Profane Ritual, Snap, Tornado and Volcano
receive spell-area coverage. Curses instead use their existing curse-specific
preferences. No weapon family, handedness, minion or attack scope is inferred
from buff tags or a granted attack's appearance.

Convalescence suggests maximum ES and recharge rate, not an assumed instant-full
recovery or defensive uptime. Natural recharge-start speed is separate from its
active instant start. Mana Tempest suggests replenishment utility without claiming
that it sustains escalating percentage costs or that maximum Mana is free damage.
Suggestions never overwrite existing manual weights or budgets.

## Common Support Review

142 reviewed pairs across existing choices/families. Efficiency I/II and Rapid
Casting I/II/III apply to all selected components, with context warnings where
native output is limited. Magnified Area I/II and Concentrated Area cover seven
entries, Prolonged Duration I/II nine and Mobility ten. Controlled Destruction
and Considered Casting cover the three hit focuses. Spell Echo covers Elemental
Weakness, Profane Ritual, Snap and Temporal Chains. Brutality I/II/III covers
the three hits plus both DoTs. Projectile Acceleration I/II covers Frost Darts
and Volcano's separate sprays. Ritualistic/Focused Curse cover both curses.

Source descriptions require self-cast hitting spells for Considered Casting.
Frozen native type checks also accept nine non-hitting selected components;
those nine links are deliberately not offered. Legal type acceptance is recorded
separately from semantic review, not treated as approval or a damage score.
Spell Echo is rejected for channelled Volcano, Tornado and the utility buffs.
It does not double curse strength, supply corpses or guarantee repeated Snap hits.

Support selection alone preserves priorities. The explicit apply-priorities
action offers cast responsiveness for Considered Casting/Echo, curse activation
for Ritualistic Curse and coverage only for verified selected area hits under
Concentrated Area. No support magnitude becomes a route-score or Full DPS multiplier.
Controlled Destruction disables scoped crit matching while retaining manual weights
with warnings. Brutality removes incompatible suggestions for pure Cold/Fire hits
and Chaos DoT; Physical Tornado remains, without conditional Elemental ground gain.

Ritualistic Curse adds 50% curse area and 30% longer activation delay: 1500 to
1950 ms. Focused Curse halves delay to 750 ms and raises Mana cost by 20%.
Neither changes cast time or native curse magnitude. Curse refreshes/replacement
and enemy limits remain separate.

## Native Limitations

- Charged Staff is typed as a Spell but uses native attack flags. Captured Rapid
  Casting II does not change its timing; no automatic Cast Speed priority is
  supplied. Per-charge buff duration remains source context, not an invented
  charge count, shockwave damage or sustained-use calculation.
- Convalescence is tested through its parent gem and granted active spell. The
  active costs 20 Mana, reduced to 12 by Efficiency II, while the parent still
  reserves 30 Spirit. No Mobility support is offered for the active child merely
  because a movement stat exists. Protection duration is not recharge rate.
- Mana Tempest source declares 60% maximum Mana per minute plus escalating costs
  from spending; the captured baseline reports zero cost. The tooltip explicitly
  refuses to infer free upkeep, sustained empowerment or actual build DPS.
- Generic and Spell Area Damage controls leave both DoTs unchanged in this frozen
  runtime, including Tornado despite its area-damage source flag. No speculative
  area-damage scope/priority is admitted. Spell Damage and DoT controls double
  their recorded rates; minion damage does not. Concentrated Area only narrows
  captured DoT/curse coverage; it is not a proven DoT damage upgrade.
- Frost Darts' Concentrated Area support does not raise initial-dart damage; its
  possible secondary-hit benefits are separate. Volcano's projectile support does
  not improve its initial eruption. Source-declared cast-speed-to-ongoing-cost
  coupling is not reflected by Volcano's captured Rapid Casting II cost; that
  discrepancy is not a sustain guarantee.

## Evidence and Lean Validation

Frozen isolated PoB 0.23.1 / tree 0.5.5f; installed PoB and user saves untouched.
Moving upstream references were checked but do not identify the frozen bytes:
[Intelligence](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
[Dexterity](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua),
[Strength](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua).
Ignored evidence: `var/spell-utility-batch-20261110/`.

Export includes twelve parents, three granted children and 315 native common-link
decisions. 107 MAIN observations cover all stat sets, granted components,
representative supports and ten DoT ownership/scope controls. Effect/stat-set,
player ownership and applied support count are asserted. Empty level-90 Sorceress,
level-20 zero-quality gems, sufficient attributes and zero enemy resistances/Armour;
normal Bow/Quarterstaff only for required loadouts. No charge, stage or contact
uptime is invented. This is not a route-quality or Full DPS research audit.

Independent fixtures recompute spell ranges/crit averages, native rounding,
Mana multipliers, area-radius truncation, per-minute DoT rates and 33 ms timer
quantization. Signed/generic/scoped modifiers, other-owner exclusions, common
support replacement, manual priorities and all twelve saved-build transfers are
grouped. Three narrow route fixtures cover hit-independent DoT, recharge and
curse preferences within existing budgets and verify unchanged Shortest dispatch.
The catalog test independently checks that no positive-tier Spell ID remains
missing. It does not redefine tier-zero entries or certify obtainable live gems.

Focused checks passed: 297 pure tests across seven files, one representative
shared-control test and typecheck. One initial assertion used the generic 10%
score scale for Curse Magnitudes (actual existing scale: 6%); it was corrected
without changing the matcher or optimizer. A UI assertion was aligned with the
existing crit-prohibition warning wording. Final release/browser results follow.

Release checks found an older recovery-suggestion allowlist and a widened string
type in the new route fixture. The allowlist was extended only for the five
explicitly reviewed cooldown/recovery recommendations; normalization assertions
remain intact. The fixture now uses the public request type. The correction
passed 80 tests across two files and `npx tsc -b`. Earlier attempted release logs
are retained as `release-first.log` and `release-typecheck.log`; no failed or
skipped stage is counted as passed. Use `npx tsc -b` for focused project checking:
the solution-root `tsc --noEmit` command does not check the same project graph.

Final `npm run validate:release` passed: 3,984 tests across 178 files, typecheck,
asset preparation, production build, graph validation and unchanged coverage
baseline. The successful complete run took 100.146 seconds. The existing large
bundle advisory remains non-blocking; no unrelated bundling changes were made.

One Edge smoke check confirmed all twelve dropdown entries and representative
Convalescence, Elemental Weakness, Frost Darts, Tornado and Volcano contracts.
Manual ES, critical and Spell Damage priorities survive selection changes.
Reservation versus active cost, curse activation delay, hit-only support review,
crit prohibition, DoT-area limitations, separate projectile sprays and Brutality
constraints display correctly. Zero page errors and final console messages. An
initial unrelated favicon 404 was absent after reload. The 1,440 x 1,000 screenshot
shows a nonblank tree and readable right-pane controls without overlap. No new
layout justified another mobile or per-support browser matrix.

Browser evidence: `output/playwright/spell-utility-batch-20261110/`. The preview
at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` serves final
`assets/index-Dt1x3RTj.js` byte-for-byte. Scoped whitespace and new-file ASCII
checks passed. No commit, push or deployment was performed.

## Coverage and Next Batch

167 to 179 configured presets: 179/399 (44.9%) raw catalog and 174/234 (74.4%)
positive-tier. Reviewed pairs rise from 1,323 to 1,465. Support choices stay
117/567 across 71 families. 184 preferences, 864/2,182 distinct wordings and
3,444/5,451 occurrences remain unchanged. No raw-source update, coverage-baseline
reset, save-format change, W1/W2 optimization or in-app Full DPS calculation.

Next proposed whole group: the eight remaining minion/totem/proxy focuses,
Ancestral Warrior Totem, Spell Totem, Raise Zombie, Rhoa Mount, Shockwave Totem,
Soul Offering, Tame Beast and Wolf Pack, with common supports and explicit source
selection/ownership. This is a proposal, not authorization to start that batch.

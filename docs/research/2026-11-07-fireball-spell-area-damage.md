# Fireball Spell Area Damage

Reviewed on 2026-11-07 against the bundled PoE2 0.5.5f graph, current official PoB
source and the isolated local native PoB runtime. No graph, assets, optimizer
algorithm or saved-build schema changed.

## Evidence and Scope

PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L731)
maps Spell Area Damage to Damage with both Spell and Area flags. Its
[Fireball definition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L7373)
has separate Projectile, Explosion and Firebolts stat sets. The reviewed
Explosion has both flags; Projectile and Firebolts have no Area base flag.

An isolated native parser/ModDB probe checked increased and reduced modifiers
against those actual component flags. Ruin gives +35 increased Damage to
Explosion, Roil gives -10, a small node gives +10 and Repulsion gives +20.
Projectile, Firebolts and an Area Attack configuration each receive zero from
these modifiers. Parsing consumed the full lines and retained both flags.

The probe is under ignored `var/spell-area-damage-review-20261107/native-check.lua`.
It ran through the existing isolated runner, without loading personal builds or
changing the installed PoB:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/spell-area-damage-review-20261107/native-check.lua --job var/spell-area-damage-review-20261107
```

The copied runtime prints its existing missing-node startup messages; the focused
parser/component assertions completed successfully. This is not a complete
native Fireball DPS comparison or evidence about projectile overlap/hit counts.

## Preference Rules

`spellAreaDamage` is a separate Offence preference, labelled Spell Area Damage.
One Normal score unit is 10% increased Spell Area Damage, with reductions
negative; High/Highest multiply by two/three. It is enabled by an explicit
Fireball-only reviewed scope, never by gem tags, class, or node name.

Only full unconditional `N% increased/reduced Spell Area Damage` lines match.
Generic Area Damage, Attack Area Damage, minion-owned, Echoed, per-charge,
conditional, more/less, ailment and malformed lines are not added by this rule.
The parser does not copy the value into Spell/Fire/Projectile Damage or Area of
Effect. Separate genuine stat lines still contribute to their selected categories.

Fireball offers it at Normal through the existing suggestions interface. Focus
selection or loading an older saved Fireball build does not add it automatically.
Add suggestions adds the missing preference, preserving edited priorities. It
can also be selected or removed individually. An unselected preference has no
reward or penalty, as with every other preference. Controlled Destruction and
Projectile Acceleration III do not disable this scope or multiply its values.

The bundled graph has eight matches:

| Nodes | Name | Damage value | Spell coverage value |
| --- | --- | --- | --- |
| 8483 | Ruin | +35% | -10% |
| 10029 | Repulsion | +20% | none |
| 11788, 14355, 17107 | Spell Area Damage | +10% each | none |
| 19277, 44783 | Area Damage | +10% each | none |
| 60269 | Roil | -10% | +25% |

Repulsion's knockback chance is not a damage reward. Node display names do not
affect parsing, including the two nodes labelled Area Damage.

At Normal damage and coverage priorities, Ruin scores 35/10 - 10/10 = 2.5 and
Roil scores -10/10 + 25/10 = 1.5. Coverage alone instead favors Roil. At Highest
coverage and Normal damage, Roil scores 6.5 and Ruin scores 0.5. These are
explicit user-weighted tradeoffs, not claims that one is universally better.

## Compatibility and Interface

Existing saves/exports retain their original preference lists until edited.
The new ID uses the existing settings normalization, storage and transfer paths;
no migration is required. Shortest routing, goals, point costs, extra/all-available
budgets and existing allocation protection are unchanged. Shared nodes score
once and already allocated base nodes do not receive new-route rewards.

Only one suggested effect/priority row is added for Fireball. Existing tooltips
explain explosion-only damage, coverage separation, opt-in scoring and the two
tradeoffs. No extra score panels or detailed on-screen explanations were added.

## Verification

Tests cover the eight native lines, reductions, decimals/zero, scope allowlisting,
excluded mechanics, selected/unselected scores, no copied damage, support
compatibility, manual priority preservation and save/export round trips. Routing
fixtures compare Ruin/Roil with both preferences, reverse their priorities, retain
required reduced-damage goals, verify shared/base counting and compare unchanged
shortest results. Local browser results are recorded after verification.

### Results

- Focused checks: 441 tests across seven files passed.
- `npm test`: 766 tests across 52 files passed.
- Production build, graph validation and `git diff --check`: passed.
- Native parser/ModDB component probe: passed for all four distinct magnitudes,
  including both tradeoff nodes. Whole-graph matching confirmed all eight nodes
  and zero Spell Area Damage score for Spark.
- Local Edge: Witch/Fireball, Ruin and Roil required, zero extra points, Controlled
  Destruction selected and Normal damage/coverage priorities produced a 21-point
  route at the exact shortest baseline. Three +10% damage smalls, Ruin's +35%
  and Roil's -10% gave 55% net damage, score 5.5 across five nodes. Three +6%
  area smalls, Roil's +25% and Ruin's -10% gave 33% net area, score 3.3 across
  five nodes. Independent total 5.5 + 3.3 = 8.8 matched the UI breakdown.
- Apply retained both goals, 21 allocated points and the positive/negative stat
  lines in Build Summary. Editing Spell Area Damage to High then using Add
  suggestions preserved High. Save/new/load and full reload retained damage and
  coverage priorities, support, zero budget and allocation. Focus switching kept
  the manual priority and displayed the unsupported-focus tooltip for Spark.
- Desktop/mobile screenshots were reviewed. No horizontal document overflow at
  1440x1000, 1100x760 or 390x844. The new tooltip fit when its trigger was centered.
  No application console errors or warnings; the existing initial favicon 404
  was absent after reload. The existing bottom-edge tooltip limitation was not
  changed in this pass.

These establish scoped heuristic values, arithmetic and workflows, not actual
Fireball DPS, a radius/hit-overlap simulation or globally optimal weighted routes.

The next recommended extension is reviewing Concentrated Area support for
Fireball using these separate explosion-damage and coverage preferences. Its
current reviewed support list has not been expanded in this pass.

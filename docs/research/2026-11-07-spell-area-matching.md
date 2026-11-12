# Fireball Spell Area Matching

Reviewed on 2026-11-07 against the bundled PoE2 0.5.5f graph and native PoB
Fireball/modifier definitions. No graph, assets, save schema or routing algorithm
changed.

## Scope

Fireball explicitly enables `spellAreaOfEffect`. The existing Area of Effect
preference recognizes complete unconditional `Spell Skills have N% increased
Area of Effect` and `Spell Skills have N% reduced Area of Effect` lines. General
and matching spell-area values add once, with reductions retained. Normal still
means one heuristic score per 10% area; High/Highest multiply by two/three.

There is no inference from tags, class, node names or the word Spell. This scope
is only reviewed for Fireball. Spark, Essence Drain, Enfeeble, minions and attacks
retain their earlier rules. Existing Fireball suggestions still select Area of
Effect at Normal; Add suggestions preserves any manually edited priority.
Removing the preference removes its score. Controlled Destruction blocks scoped
spell crit, not spell area. Existing allocations are not counted as new rewards.

## Evidence

PoB's [Fireball definition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L7373)
has separate Projectile, Explosion and Firebolts stat sets. Only Explosion has an
area base flag in the reviewed definition, alongside spell/projectile flags. It
has a base area radius of 17 game units. Area here is explosion coverage, not
damage per hit or guaranteed additional hits. Radius/overlap and DPS are not
computed by this preference.

PoB's [spell-skills modifier prefix](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L1295)
restricts modifiers to Spell skills. This supports the prefix-form matching used
by the actual graph, rather than inventing an `Area of Effect for Spells` line.

The bundled graph has these ten unconditional matching nodes:

| Nodes | Name | Spell area value |
| --- | --- | --- |
| 8483 | Ruin | -10% |
| 8660 | Reverberation | +15% |
| 17711, 18846, 22949, 33180, 35171, 46989, 52615 | Spell Area of Effect | +6% each |
| 60269 | Roil | +25% |

Echoing Pulse (7302) is excluded: its effect applies to Echoed Spells, which this
base Fireball preset does not assume. Conditional, per-charge, minion-owned,
more/less and malformed modifiers remain excluded.

Follow-up: [Spell Area Damage matching](2026-11-07-fireball-spell-area-damage.md)
now provides a separate opt-in damage preference for Fireball. The limitations
below describe the initial coverage-only implementation, not that later pass.

## Limitations and Interface

Area is not Area Damage. Ruin also grants increased Spell Area Damage and Roil
also has reduced Spell Area Damage. Those damage modifiers are not modeled by
the current preferences, so these nodes need manual tradeoff review. An area
score is deliberately not copied into Spell/Fire/Projectile Damage. Reviewing
their explosion-specific damage tradeoffs is the next recommended extension.

Only the existing Area of Effect tooltip changes: Fireball applicability,
reductions, coverage and the unscored damage tradeoffs are explained there.
There are no extra controls or score panels. Shortest routing, required goals,
point budgets and saved-build fields are unchanged.

## Checks

Tests cover all ten native lines, positive/reduced/zero/decimal values,
generic/scoped aggregation, the explicit preset allowlist, support compatibility,
unselected preferences, conditional exclusions and tooltip behavior. Routing
fixtures cover equal-cost choices, budgets, shared-node counting, existing
allocations, required reduced-area goals and unchanged shortest results.

## Verification Results

- Focused checks: 341 tests across four files passed.
- `npm test`: 728 tests across 52 files passed.
- `npm run build`, `npm run validate:graph` and `git diff --check`: passed.
- A whole-graph audit confirmed nine positive matches and one reduction for
  Fireball, zero on Echoing Pulse and no new spell-area reward for Spark.
- Local Edge: Witch/Fireball, Reverberation required, zero extra points and only
  Area of Effect at Highest produced an 18-point route (exact shortest baseline).
  Three 6% small nodes plus Reverberation's 15% gave 33% total spell area across
  four nodes. Independently, 33 / 10 * 3 = 9.9, matching the route breakdown.
  Controlled Destruction was selected and did not disable the area contribution.
- Applying that route retained 18 allocated points and the 33% summary. Add
  suggestions preserved Highest rather than resetting Area of Effect to Normal.
  Save/new/load and full reload retained focus, support, budget, allocation and
  the manual area priority.
- The existing tooltip displayed the new scope and damage-tradeoff caveat.
  Desktop/mobile screenshots were reviewed, with no horizontal document overflow
  at 1440x1000, 1100x760 or 390x844. No application console errors or warnings;
  only the existing initial favicon 404, absent after reload.

These checks establish heuristic matching, score arithmetic and workflows, not
Fireball DPS, overlap behavior or a globally optimal weighted route.

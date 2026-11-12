# Optional Weapon Critical Chance

Reviewed on 2026-11-07 against the bundled PoE2 0.5.5f graph and native PoB
modifier scoping. No graph, assets, optimizer algorithms or save schema changed.

## Rules

The existing optional Critical Hit Chance preference now counts complete
unconditional increased/reduced Critical Hit Chance lines with:

- Quarterstaves for Ice Strike and Tempest Flurry.
- Spears for Lightning Spear and Explosive Spear.

Explicit preset scopes and the shared reviewed weapon registry control this.
There is no inference from a class, Path start, node name or gem tag. Other
presets, manual/no-focus, the wrong weapon, Crossbows, Bows, Maces and generic
Staves receive no new weapon-critical bonus. Existing generic and attack/spell
critical rules are unchanged.

Generic, attack-only and matching weapon values add once, including reductions.
The normalization stays 15% increased Critical Hit Chance per Normal score unit.
These are relative increased/reduced values, not added percentage points of base
crit, actual final critical probability or estimated DPS.

## Explicit Selection

No preset suggests or automatically selects Critical Hit Chance. Add suggestions,
changing focus and loading settings without it do not add it. If already selected,
its manual priority is retained. Removing the preference removes all its score
contributions, and Add suggestions does not restore it.

The pure parser still describes a node's applicable values independently of
selected preferences. The existing scorer/worker sums only selected preferences,
so an unselected crit line has no reward and no crit contribution row. A node may
still be required as a goal or for connectivity; this is not a ban on allocating
crit nodes. Existing allocations are excluded from added-route rewards as before.

## Evidence and Coverage

PoB's [modifier-name mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L750-L770)
distinguishes critical chance from critical damage. Its
[weapon flags](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L984-L1020)
keep Quarterstaff/Staff and Spear hit modifiers scoped to their respective weapons.
The normal weapon requirements for the four reviewed skills were already
qualified in the earlier preset/weapon-matching passes.

The bundled graph contains two 10% Quarterstaff critical-chance nodes (326,
31449) and two 10% Spear critical-chance nodes (18910, 38369). Each focus matches
only its own pair, and the default suggested preferences score those nodes at 0.
With Critical Hit Chance explicitly selected, each 10% line gives 2/3 Normal
score or 2 Highest score. These counts do not establish reachability/net benefit.

Critical Damage Bonus, accuracy, base-crit overrides or flat additions, Lucky crit,
more/less multipliers, minion-owned effects and conditional/per-charge bonuses
remain excluded. Martial Artistry and Javelin do not gain a critical-chance score
from their critical-damage effects. Gear, caps, crit uptime and alternate unarmed
setups are not simulated.

## Interface and Tests

Only the existing selected Critical Hit Chance tooltip gains a weapon-scope
explanation. No new controls, priority changes or score panels were introduced.
The existing no-crit and selected-crit saved-build shapes remain compatible.

Tests cover the four-preset allowlist, no automatic suggestion, exact native
wording, reductions/decimals/zero-net values, generic/attack/weapon aggregation,
unsupported scopes and special effects. Routing checks explicitly add/remove the
preference, compare equal-cost routes, preserve goals/budgets, exclude existing
allocations and compare shortest results with the unchanged solver. App checks
cover manual priority, focus changes, save/load, removal, and Add suggestions not
restoring crit.

## Verification Results

- Focused checks: 308 tests across four files passed.
- `npm test`: 695 tests across 52 files passed.
- `npm run build`, `npm run validate:graph` and `git diff --check`: passed.
- Whole-graph audit confirmed exactly the expected two nodes per matching
  weapon focus and zero score for the default, non-crit suggested preferences.
- Local Edge: Monk/Ice Strike with both Quarterstaff crit nodes as goals used
  the 20-point exact shortest baseline with zero extra points. Explicit Highest
  crit gave a contribution of 20 / 15 * 3 = 4 from two nodes. Add suggestions
  did not select crit. Apply and save/new/load preserved the manual selection.
- Local Edge: Huntress/Lightning Spear with both Spear crit nodes as goals used
  the 18-point exact baseline with zero extra points. Crit contributed 4, plus
  3 Attack Damage and 2 Projectile Damage, total 9. After removing crit, resetting
  allocation and optimizing the same goals, the point limit stayed 18 and score
  became 5 with no Critical Hit Chance contribution row. Both crit goals remained
  required and connected. Full-page reload retained the saved selected priority.
- All four supported focuses showed their correct weapon tooltip and retained
  the manually selected priority. Removing crit and changing focus/Add suggestions
  did not restore the preference.
- Screenshots reviewed at 1440x1000, 1100x760 and 390x844 without horizontal
  document overflow. Tooltip triggers were centered; the existing bottom-edge
  tooltip positioning limitation is unchanged. No application console errors or
  warnings; only the existing initial `favicon.ico` 404, absent after reload.

These verify heuristic scoring and workflows, not actual crit probability/DPS or
globally optimal weighted routes. A separate read-only audit found ten plain
Spell Skills area modifiers (nine increased, one reduced), plus an Echoed Spells
conditional. Reviewing spell-area matching, starting with Fireball, is a possible
next extension; no spell-area rules were added here.

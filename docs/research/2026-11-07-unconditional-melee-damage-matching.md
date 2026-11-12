# Unconditional Melee Damage Matching

Reviewed on 2026-11-07 against the bundled PoE2 0.5.5f graph and native PoB
definitions. No graph, assets, categories, optimizer algorithm or save schema
were changed.

## Policy

Ice Strike, Tempest Flurry, Boneshatter and Rolling Slam explicitly opt into a
`meleeDamage` scope. Only a complete numeric increased/reduced Melee Damage line
adds to the existing Attack Damage value, using its unchanged normalization and
selected priority. No scope is inferred from a node name or gem tag.

General attack, matching weapon and melee bonuses add once. A melee bonus is not
also copied into Physical Damage, elemental damage, Projectile Damage or Damage
over Time. Independent effects may share one node, but its point cost and the
contribution's node count are not duplicated. Already allocated effects do not
become new-route rewards. Existing manual priorities and required goals remain
unchanged; shortest mode is untouched.

Manual/no-focus, unreviewed IDs, spells, minions and all reviewed bow/spear focuses
ignore the new scope. Conditional and unreviewed wording stays excluded, including
close-range hits, full Life, recent projectile hits, Stunned/Immobilised enemies,
weapon-qualified melee damage, stun buildup, physical melee damage, minion-owned
effects and more/less multipliers. Smash's unconditional 20% line counts; its
40% Heavy-Stun conditional does not.

## Evidence

The native [PoB modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L712-L728)
keeps melee damage scoped to `ModFlag.Melee`, distinct from physical melee
damage. The reviewed local skill stat sets all have attack and melee flags:
Ice Strike normal/third strike; Tempest Flurry normal/third/fourth strike;
Boneshatter initial strike/shockwave; Rolling Slam's slam stat sets.

These definitions are in `Data/Skills/act_int.lua` and `act_str.lua` under
`var/pob-evaluation-spike-20261106/runtime/`. Mapping the relevant melee effect
into the Attack Damage preference is an editable heuristic, not a DPS estimate
or an assertion that physical damage scales converted hits.

A read-only graph audit found 29 exact unconditional nodes, totaling 326 raw
percentage points across the entire graph. Each matching preset recognizes
those lines once. This is a parser coverage total, not a reachable build or
overall damage estimate. Actual forms are 8%, 10%, 12%, 15%, 16%, 20% and 25%.
Tests include Brutal 5710, Reaching Strike 17372, Heavy Weaponry 41512 and Smash
45363, as well as small nodes. Conditional variants are not included in the 29.

## Interface and Limits

Only the existing Attack Damage tooltip gains one explanatory sentence. No new
controls, preference rows or score panels appear automatically. Support choices,
existing suggestions/weights, budgets and saved-build compatibility are retained.
Conditional uptime, stun priming, gear, unarmed exceptions, damage conversion,
combo timing and Full DPS remain unmodeled. Rolling Slam keeps its fixed-time
caveat and conservative speed priority.

## Regression Checks

Tests cover the exact four-preset allowlist, unsupported focuses, real wording,
decimal/reduced/zero-net values, combined attack/melee/weapon effects, conditional
exclusions and no damage-type duplication. Route fixtures cover fixed-cost
alternatives, reductions, required goals, optional branches, base allocation
exclusion and unchanged shortest behavior. Tooltip checks verify existing
controls and settings remain unchanged.

## Verification Results

- `npm test`: 642 tests across 52 files passed.
- `npm run build`, `npm run validate:graph` and `git diff --check`: passed.
- Whole-graph coverage audit verified the 29 exact nodes for each of the four
  focuses. Their melee percentages were added once on top of generic/matching
  weapon values, with no copied damage-type values.
- Local Edge: Warrior/Rolling Slam/Smash, zero extra points, optimization and
  apply passed at the seven-point exact baseline. The applied summary showed
  66% unconditional Melee Damage from five nodes: 66 / 10 * priority 3 = 19.8,
  matching the route breakdown. Smash's separate 40% Heavy-Stun bonus and the
  path's Stun Buildup were excluded from that score. Physical Damage remained 0.
- Switching through all four melee focuses showed the matching tooltip;
  Lightning Arrow did not. Manual Energy Shield and Attack Damage priorities,
  goals and point budget were preserved. Save/new/load and full-page reload
  retained the focus, applied route and settings.
- Screenshots reviewed at 1440x1000, 1100x760 and 390x844 without horizontal
  document overflow. Preference tooltip triggers were centered in the scroll
  pane; the pre-existing bottom-edge tooltip placement limitation is unchanged.
- No application console errors or warnings; only the existing initial
  `favicon.ico` 404, with none after reload.

This validates heuristic matching and workflow behavior, not Full DPS or globally
optimal weighted scores. A separate read-only audit found four weapon-critical
chance nodes still outside current matching: two Quarterstaff and two Spear
nodes. Supporting those in the existing optional Critical Hit Chance preference
is a possible next bounded extension; this pass does not implement it.

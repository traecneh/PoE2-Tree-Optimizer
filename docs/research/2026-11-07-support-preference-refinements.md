# Reviewed Support Preference Refinements

Reviewed 2026-11-07 against the existing native PoB reference in
`var/pob-evaluation-spike-20261106/runtime/Data/Skills/`. The corresponding
upstream `dev` support definitions were also checked. Source links are moving
upstream references, not pinned copies. The bundled passive graph is 0.5.5f.

## Scope

This is a curated allowlist for the six existing base-skill presets, not a full
support-compatibility engine or recommended gem loadout. Internal skill types,
minion scope, stat sets and support requirements were reviewed rather than
matching display tags alone. Equipment, socket limits, attributes, resource
sustain, triggers, Infusions and other linked gems are not validated.

Actual support effects motivate suggested priorities. Priorities remain manual
heuristics on the existing 1-3 scale, not game-provided weights, marginal damage
estimates or PoB Full DPS. Gem modifiers are never added to the passive summary
or multiplied into route scores. The routing engine and shortest mode are unchanged.

## Decisions

| Support | Reviewed scope | Native evidence and refinement |
| --- | --- | --- |
| [Projectile Acceleration III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4326-L4362) | Spark, Fireball and Lightning Arrow hit presets | Requires projectiles or projectile-speed skills, excludes fixed-speed projectiles. `projectile_speed_additive_modifiers_also_apply_to_projectile_damage` enables speed-to-damage scaling. Suggests projectile-speed priority 3, including adding it to Fireball. Its 40% more speed is not a passive bonus or score multiplier. Not offered for Essence Drain's DoT focus, even though the delivery projectile can be supported. |
| [Controlled Destruction](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2177-L2214) | Spark, Fireball hit presets | Requires damaging spells. Its hit-damage modifier and `global_cannot_crit` apply to the supported skill. Adds an explicit Critical Hit Chance warning; no arbitrary increase to spell-damage preference weight. Not offered for non-damaging Enfeeble, attacks, minions or the Essence Drain DoT preset. |
| [Ritualistic Curse](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7667-L7702) | Enfeeble | Requires curse application. Adds curse area and increases activation delay by 30%. Suggests activation-speed priority 2 for responsiveness, not increased curse magnitude. |
| [Focused Curse](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4908-L4944) | Enfeeble | Requires curse application; reduces activation delay by 50%. Explains the distinction from cast time. Keeps existing priorities; does not assume zero delay or that activation passives stop helping. May coexist with Ritualistic Curse. |
| [Swift Affliction I/II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5403-L5474) | Essence Drain DoT preset | Non-ailment DoT damage benefit with 20%/10% less duration, respectively. Suggests skill-duration priority 3 as an uptime preference, not damage-per-second scaling. Not offered for damaging-hit presets merely because they can legally link it. Tier III's duration-threshold mechanic is deliberately unreviewed. |
| [Feeding Frenzy I/II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L4698-L4776) | Skeletal Arsonist | Requires minion creation and excludes undamageable minions. Minions take 20%/15% more damage, respectively. Suggests minion-Life priority 2 for survival, not player Life or player damage. Does not calculate effective health or apply its damage multiplier to scores. |

`gemFamily` identities and exact native effect IDs are kept in the catalog.
Only one tier of a family survives normalization. Selecting a new tier explicitly
replaces the prior tier. Unknown or out-of-scope IDs are discarded on save/load.

## Interaction Policy

- Selecting a support updates suggestions, explanations, reviewed matching
  eligibility and warnings, without changing weights.
- Add suggestions appends missing support-refined preferences without changing weights.
- Apply support priorities lists each missing/different support-specific effect and
  changes only those effects when explicitly clicked. Defence, other manual weights,
  goals, allocation and point budgets remain intact.
- Controlled Destruction does not silently delete manual critical priorities:
  another skill may use them. The warning explicitly states they still affect routing.
  With the later critical/area matching rules, it disables scoped spell-crit
  matching for the focused skill. Existing generic manual crit is unchanged.
- Removing supports or changing focus never reverts edited preferences. Changing
  focus clears the previous support selection to avoid accidental carryover.
- Saved builds and JSON exports retain reviewed selections and the actual weights.

## Verification

Pure tests cover normalization, family replacement, scope, immutability,
support-aware merging, explicit application, warnings and legacy settings.
UI tests cover selection, change lists, disabled controls and focus changes.
Persistence tests cover saved builds and export/import. The routing regression
uses two equal-cost routes: the base Spark preset prefers spell damage, then the
explicitly applied projectile-speed refinement prefers the speed route. Both
routes cost two points, with no gem multiplier added. These are heuristic and
software checks, not live-game or Full DPS validation.

`npm test` passed 411 tests across 52 files; `npm run build` passed. Graph
validation reported no issues. Edge browser checks covered support selection,
explicit priority application, a retained manual Energy Shield priority,
critical-hit warnings, worker-disabled controls, optimization/application and
saved-build restoration after a page reload. The real-tree sample reached Kite
Runner with a 20-point exact shortest baseline and a 25-point selected route
within five extra points. Desktop (1440 px), windowed (1100 px) and mobile
(390 px) checks showed no horizontal overflow in the support controls.

Local reference fingerprints (SHA-256):

| Source | Hash |
| --- | --- |
| `Data/Skills/sup_int.lua` | `573766C7653BA612984B8E12BC70B77AA0E46F7AA217FE836FAE539C7911C5AF` |
| `Data/Skills/sup_dex.lua` | `0CB6D21A33ECED70A49B537A9B6AD9841C43B70F7FDD8A88EAE9435263EEC4C6` |

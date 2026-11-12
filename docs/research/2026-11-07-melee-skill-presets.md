# Reviewed Melee Skill Presets

Reviewed on 2026-11-07 against the existing native reference in
`var/pob-evaluation-spike-20261106/runtime/`. Corresponding upstream native
definitions were also checked. Linked `dev` sources are moving references.
The bundled passive graph remains 0.5.5f.

## Scope

Adds four base-skill presets and six reviewed support options using the existing
Focus skill, supports and preference controls. No new panel, scoring mode or
preference category is added. Weights remain editable heuristics, not game-supplied
power scores, marginal damage estimates or PoB Full DPS.

Every new preset explicitly opts into attack critical-chance and attack-area
matching, but not spell or projectile scopes. Optional critical chance is not
added to their suggestions automatically. Area is coverage utility, not hit
damage. Existing shortest behavior, goal requirements, budgets and manual
priorities are unchanged.

## Native Skills

| Preset | Native evidence | Reviewed preferences and limits |
| --- | --- | --- |
| [Ice Strike](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L13021-L13264) | Normal and third-strike stat sets have attack, melee and area flags; both convert 80% physical damage to cold. Gems.lua record starts at local line 4234. | Attack damage 3, cold 3, elemental 2, attack speed 2, area 1. Third-strike timing, Freeze, added weapon damage and conversion interactions are not simulated. No automatic physical, spell or projectile suggestion. |
| [Tempest Flurry](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L21381-L21690) | Normal, third and final strike stat sets are melee attacks. Native strikes convert physical to lightning, with additional conversion on the finisher. Only the normal-strike set carries the area base flag. Gems.lua record starts at local line 5762. | Attack damage 3, lightning 3, elemental 2, attack speed 2, area 1. Area suggestion is scoped to area-enabled strikes, not all combo hits. The final lightning visual is not treated as a spell/projectile; Shock magnitude and combo cadence are not modeled. |
| [Boneshatter](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L1815-L1996) | Strike and shockwave have attack/melee/area flags and no native elemental conversion. Shockwave depends on Heavy Stunning an enemy Primed for Stun; the initial strike has its own stun-buildup limitation. Gems.lua record starts at local line 3743. | Attack damage 3, physical 3, attack speed 1, area 1. Speed does not prime an enemy or guarantee shockwaves. Stun thresholds, priming and shockwave frequency remain unmodeled. |
| [Rolling Slam](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L16108-L16406) | Both slam stat sets are melee area attacks with no native elemental conversion and `total_attack_time_+_ms = 1000`. Gems.lua record starts at local line 4110. | Attack damage 3, physical 3, area 2, attack speed 1. Its extra time is not proportionally shortened by attack speed. Stun, added damage, dual wield and combo/build configuration are not calculated. |

Gem IDs and full literal true tag keys come from the corresponding
`Data/Gems.lua` records, including attribute/metadata keys. Visible tag labels
continue using the existing metadata filter. No compatibility is inferred merely
from a display tag.

Rolling Slam's time stat maps to `TotalAttackTime` in
[SkillStatMap](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L2244)
and [CalcOffence](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L2830-L2845)
adds it after speed scaling. The lower speed priority is a conservative heuristic,
not a measured DPS slope for a real weapon setup.

## Reviewed Supports

| Support | Offered for | Decision |
| --- | --- | --- |
| [Heavy Swing](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L4187-L4226) | Boneshatter, Rolling Slam | Melee physical damage benefit with 10% less attack speed. Suggests attack-speed priority 2 for responsiveness, only on explicit application. Not offered for the cold/lightning-focused presets merely because it can legally link to them. |
| [Rapid Attacks I/II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4613-L4673) | All four new skills | Native 15%/25% increased attack speed. Context only: gem speed is not added to passive totals or route scores and does not change priorities. The family rule permits one tier. Tier III's different damage tradeoff is not included. |
| [Concentrated Area](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2070-L2108) | All four new skills | 50% less area with an area-damage benefit. Suggests area priority 2 for coverage, not direct DPS; only area-enabled components receive its area-damage modifier. Does not promise that every combo hit benefits. |
| [Close Combat II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L1261-L1296) | All four new skills | Distance-dependent attack damage. Context only; no unconditional score multiplier or assumed proximity uptime. Other legal attack links are not automatically added to this reviewed allowlist. |
| [Fist of War I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L3739-L3770) | Rolling Slam only | Requires a self-used Slam and has a periodic Ancestral Boost interval. Context only; no permanent damage/area/speed bonus or assumed boost uptime. Boneshatter is a Strike, not a Slam. |

Add suggestions still merges missing effects without overwriting existing weights.
Apply support priorities lists the exact changes. Selecting, removing or replacing
a tier never silently changes weights, defenses, goals or point budgets.

## Passive Coverage and Remaining Limits

Read-only audit of `passivePreferenceValues` against the bundled graph found
positive matches for every suggested preference. Distinct positive-node counts
are 79 attack damage, 39 cold, 51 lightning, 54 elemental, 59 physical, 60 attack
speed and 74 general-plus-attack area. Counts do not establish reachability, net
node benefit or visible main-tree availability.

Weapon-specific, melee-only and conditional passive wording is still outside the
existing parser's coverage. Bleed, Freeze, Shock, stun priming, conversion setups,
support uptime, combo timing, gear and resource sustain are not simulated. The
focus tooltip and preset explanations retain these limits; selecting a melee
preset does not make all melee/weapon passives score automatically.

The subsequent [quarterstaff/mace matching pass](2026-11-07-quarterstaff-mace-passive-matching.md)
adds exact unconditional weapon damage and attack-speed lines for these presets.
Other weapon-only, melee-only and conditional wording remains outside coverage.

The subsequent [unconditional Melee Damage pass](2026-11-07-unconditional-melee-damage-matching.md)
also enables plain increased/reduced Melee Damage for these four presets.
Conditional and typed melee variants remain outside coverage.

## Tests

Tests verify native identities/tags, safe scopes, unchanged original presets,
support allowlists, family replacement, explicit priority application, save/load
and JSON transfer. Routing fixtures select relevant cold/lightning/physical
bonuses over player spell, minion or projectile stats, at the same point cost.
An Ice Strike fixture changes from an attack-damage path to an attack-area path
only after applying Concentrated Area's coverage priority. No support damage
multiplier enters the score.

`npm test`: 474 tests across 52 files passed. Production build passed. These
checks validate software behavior and heuristic policies, not live-game or Full DPS.

`npm run validate:graph` passed. Local Edge browser smoke checks covered adding
Ice Strike suggestions, explicit Concentrated Area priority changes while
preserving a manual Energy Shield priority, Rapid Attacks tier replacement,
optimizing and applying a required Catapult goal, and save/new/load plus reload.
The weighted run applied 31 points against a 29-point exact shortest baseline
with two extra points. This verifies the workflow, not globally optimal weighted
scoring or Ice Strike DPS. Rolling Slam's Heavy Swing and Fist of War controls
were also checked. Screenshots at 1440x1000, 1100x760 and 390x844 showed the
controls without horizontal document overflow; browser console reported no
errors or warnings.

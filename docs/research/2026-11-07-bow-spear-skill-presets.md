# Reviewed Bow and Spear Presets

Reviewed on 2026-11-07 against the existing native PoB reference in
`var/pob-evaluation-spike-20261106/runtime/`. The four native skill blocks and
four reused support blocks match current upstream `dev` definitions byte for
byte after newline normalization. Linked upstream lines may move. The bundled
passive graph remains PoE2 0.5.5f; no extracted data or assets were replaced.

## Scope

Four more choices use the existing Focus skill picker. No new panel, category,
optimizer mode or score display was added. Starting weights remain editable
heuristics, not native power scores or Full DPS. Shortest routing, required goals,
extra-point budgets, manual priorities and existing presets are unchanged.

A subsequent [weapon-matching pass](2026-11-07-bow-spear-passive-matching.md)
adds explicit bow/spear damage and attack-speed wording to these focuses. The
limits below describe the original preset batch unless updated by that pass.

## Native Skill Decisions

| Preset | Source and native evidence | Reviewed preferences |
| --- | --- | --- |
| Ice Shot | [Native skill](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L3699-L3900). Arrow and shard sets are attack/projectile, not area; the arrow has 80% physical-to-cold conversion and shards add another 20%. | Attack damage 3, cold 3, elemental 2, projectile damage 2, attack speed 2, projectile speed 1. No area suggestion or attack-area scope merely because the shards form a cone. |
| Rain of Arrows | [Native skill](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L6213-L6361). Attack/projectile/area hit flags, no native elemental conversion. Sustained rain has its own per-arrow timing, hit-rate constraint and one-rain limit. | Attack damage 3, physical 3, projectile damage 2, attack speed 1, area 1, projectile speed 1. Coverage can change concentration; no promised single-target gain from spread or proportional rain DPS from attack speed. |
| Lightning Spear | [Native skill](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L4495-L4718). Spear and bolts are attack/projectile hits. Spear converts 80% physical to lightning; bolts add 20%. Area type/radius provides targeting utility, not an area-damage flag. | Attack damage 3, lightning 3, elemental 2, projectile damage 2, attack speed 2, projectile speed 1. Attack-area scope is available when manually selected, but area is not auto-suggested. Charge splits and Shock uptime are not assumed. |
| Explosive Spear | [Native skill](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L2225-L2513). Spear and explosions have attack/projectile flags; explosions also have area. Native fire conversion and 2500 ms detonation delay; charged form includes a duration/ground effect. | Attack damage 3, fire 3, elemental 2, projectile damage 2, attack speed 1, area 1, projectile speed 1. Hit focus, not ignite or Ignited Ground DPS. Duration is not suggested, and faster throwing is not faster detonation. |

Gem keys and literal true tag keys come from
[Gems.lua](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua),
not guesses from names. Local records start at 11147, 1050, 4035 and 7078
respectively. All four explicitly opt into attack critical-chance matching;
none receives spell crit or spell-projectile speed. Critical chance is not
automatically added as a preference.

## Reused Reviewed Supports

- [Projectile Acceleration III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4327-L4363): offered for all four projectile focuses. Its projectile-speed-to-damage rule justifies an editable priority of 3, not a new damage multiplier in scores.
- [Rapid Attacks I/II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4614-L4674): offered for all four attacks. Context only, no automatic weight change or assumed speedup of the rain/charge/detonation mechanics. Selecting a tier replaces the other.
- [Concentrated Area](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2071-L2109): offered for Rain of Arrows and Explosive Spear, suggesting area priority 2 for coverage. Not offered for Ice Shot or Lightning Spear just because one has a cone visual or the other an Area tag. No assumed overlap gain or gem damage added to scores.

Selection alone does not overwrite existing priorities. Add suggestions only
fills missing effects; Apply support priorities only applies its listed changes.
Removing a support does not undo manual settings. Saved and exported builds
retain the focus and reviewed support IDs.

## Limits

These presets do not simulate gear, accuracy, damage conversion interactions,
Frenzy Charge generation, repeats, projectile counts/splits, hit overlap, ailment
or ground-effect damage, limits, support uptime or resource sustain. Weapon-only
and conditional passive wording remains outside current parser coverage.
No new generic bow/spear or melee keyword matching was introduced.

## Verification

Regression tests cover identities/tags, attack-vs-spell scopes, Ice Shot's area
exclusion, conservative timing/coverage choices, support allowlists, explicit
priority application, tier replacement, save/load and JSON transfer. Routing
fixtures keep goals and point costs fixed, prefer the intended elemental or
physical effect over spell/minion/DoT effects, and change projectile-speed routing
only after explicit support-priority application. Shortest results are compared
with the unchanged shortest solver.

- `npm test`: 503 tests across 52 files passed.
- `npm run build`: passed.
- `npm run validate:graph`: passed.
- Read-only bundled-graph audit: every new suggestion has positive matches.
  Counts include attack damage 79, physical 59, cold 39, lightning 51, fire 47,
  elemental 54, projectile damage 39, attack speed 60, projectile speed 16 and
  attack-enabled area 74. Counts are not reachability or build-benefit claims.
- Local Edge smoke: all four focus/support allowlists checked; Lightning Spear
  suggestions, explicit projectile-support priority application, tier replacement,
  Catapult goal, optimization, apply, save/new/load and full-page reload passed.
  Applied route had 31 added points against a 29-point exact shortest baseline
  with two extra points. This is a workflow check, not proof of globally optimal
  weighted scoring or real-build DPS.
- Screenshots reviewed at 1440x1000, 1100x760 and 390x844 with no horizontal
  document overflow. No application console errors or warnings; the first load
  had only the existing missing `favicon.ico` 404, with none after reload.

# Ballista Build Focus Presets

Artillery Ballista and Siege Ballista are available in the existing Skill picker.
Selecting a skill does not change priorities; Add suggestions merges missing
preferences and preserves manual weights, goals, point budgets and saved builds.
Shortest routing and the exact solver are unchanged. No new support compatibility
is inferred from tags.

## Ownership and Components

Both primary deployment skills contain `base_deal_no_damage`. The granted firing
skills are attacks used by Totems/proxies, with Crossbow weapon restrictions.
Their damage is not a player self-hit, a spell or Minion damage. The native
modifier checks confirm that generic Attack Damage, Crossbow Damage, two-handed
Damage and Projectile Damage apply to firing, while Bow Damage does not (even
though Artillery's firing skill has a Bow skill-type tag).

Each literal modifier is scored once in its existing category:

| Preference | Scored benefit | Not credited as |
| --- | --- | --- |
| Totem Damage | Totem-used attack damage | Player self-use, Minion damage, another copy of Attack Damage |
| Attack Damage / Attack Speed | Applicable inherited generic/Crossbow modifiers | Another copy of Totem-specific damage/speed |
| Totem Attack Speed | Totem firing cadence | Player deployment, spell casting, detonation delay |
| Totem Placement Speed | Player deployment utility | Faster firing or damage per hit |
| Totem Life / Duration | Totem survival / lifetime | Player Life, guaranteed uptime or DPS |
| Totem Area / generic and attack area | Applicable firing coverage | Guaranteed overlap, hit count or damage per hit |
| Player Life and other manual defence | Player benefit, only if selected | Totem survival |

Artillery's physical bolts explicitly allow all their damage to Pin; Pin Buildup
is suggested without assuming Pin uptime. Its native lifetime is 12 seconds.
Siege's granted hit/explosion sets contain Physical-to-Fire conversion; Fire and
Elemental hit damage are suggested without assuming gear, Ignite or overlaps.
Its native lifetime is 8 seconds. Neither focus guesses reload benefits,
projectile-speed timing gains, Maim uptime, Totem limit scaling or Full DPS.
Optional attack/Crossbow critical and Accuracy modifiers remain opt-in.
Player/Totem/minion Life and speed preferences remain distinct even when all are
manually selected. Unconditional reductions retain their negative score.

## Source Discrepancy

Both Siege firing sets explicitly contain the generated game stat
`is_area_damage`, an Area skill type and area radius constants. However, the
isolated PoB 0.23.1 copy omits `baseFlags.area` for both sets and does not apply
Area Damage in the native calculation. This preset uses the explicit generated
game-stat evidence for area eligibility, not a tag-only inference or a claim
that PoB numerically verified it. This discrepancy is documented rather than
patched into PoB or hidden by a made-up DPS value. Artillery has both the area
flag and explicit area-damage stat, and its native check responds to Area Damage.

## Evidence and Validation

The implementation reuses the existing scorer; it adds no modifier regexes,
changes to scoring units or route-search behavior. Frozen identity/component
fixtures in `src/tree/ballistaSkills.fixtures.ts` and independent ownership,
real-tree, budget, Shortest and persistence tests require no native runtime or
network. The isolated modifier review is retained under
`var/ballista-presets-20261108/`; 70 deployment/firing cases were captured without
altering installed PoB or running route-quality research audits.

The catalog now contains 86/399 raw skill IDs (21.6%), including 81/234
positive-tier IDs (34.6%). This is curated skill-context coverage, not an overall
completion or obtainable-live-gem percentage. Passive wording coverage and
support allowlists are unchanged by these additions.

Release verification: `npm run validate:release` passed 2,404 tests across 107
files, typecheck, production build, graph validation and the coverage baseline.
Edge and Firefox production-preview smoke checks passed both skill selections,
explicit suggestion apply, route preview/apply and saved-build restoration with
separate player/Totem Life priorities. No application console errors or warnings
were reported after the smoke runs. Evidence is retained in
`var/ballista-presets-20261108/` and `output/playwright/ballista-presets-20261108/`.
The existing production chunk-size warning remains non-blocking. This verifies
the local build, not a GitHub Pages deployment.

- [Generated Artillery data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L923)
- [Generated Siege data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L17746)
- [Native modifier/weapon setup](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcActiveSkill.lua)

Upstream `dev` is a moving reference, not a claimed byte-identical snapshot of
the isolated installed data. The subsequent [Mortar Cannon batch](build-focus-mortar-cannon.md)
adds an explicit socketed-Grenade choice with separate proxy/player context.

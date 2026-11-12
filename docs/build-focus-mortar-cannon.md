# Mortar Cannon Build Focus

Mortar Cannon has a required Socketed Grenade dropdown in the existing Skill
section. It has no default Grenade. Six reviewed choices are available:
Explosive, Flash, Gas, Voltaic, Oil and Cluster Grenade. The untriaged tier-zero
default-launcher entry and incompatible skills are not offered.

Selecting or changing a Grenade does not silently change effect priorities,
goals, point budgets or committed allocation. Add suggestions merges missing
effects without overwriting existing weights. Old manual preferences remain
selected when changing Grenades and can be removed explicitly. Changing the
Skill clears its socketed selection. Existing saved/exported builds continue
to load; valid Mortar choices now round-trip with them. Invalid saved values
are discarded rather than silently converted to Explosive Grenade.

## Component and Ownership Boundaries

The cannon's deployment has no hit component in the generated metadata. Its
hidden support explicitly requires Grenade skills and adds UsedByTotem,
UsedByProxy and SupportedByMortarTotem. Meta, persistent, triggered and
usage-condition skill types have exclusions. A native isolated PoB check
confirmed all six reviewed choices become Totem-used attacks.

The chosen Grenade supplies the already reviewed hit component, damage elements,
Crossbow/attack/projectile/area scopes and Grenade-specific modifier matching.
This reuses the existing parser, including reductions such as Utility Ordnance,
without copying one modifier into multiple damage/speed categories.

- Totem Damage and inherited Attack/Grenade/Crossbow Damage are separate sources.
- Totem Attack Speed and generic/Crossbow Attack Speed concern firing actions,
  not player deployment. Both stay Normal priority because cooldowns can prevent
  a faster action from producing more shots.
- Totem Placement Speed is player deployment utility, not firing or fuse speed.
- Totem Life and its eight-second base lifetime are separate from player Life,
  Minion Life, Skill Effect Duration and Grenade fuse/cloud/ground duration.
- Generic and Grenade Cooldown Recovery apply to the socketed skill's uses, not
  cannon placement or detonation time. Native +100% recovery adds to increases:
  the reviewed Explosive case is 5/(1+1) = 2.5 seconds before server rounding;
  another +20% gives 5/2.2, not a further 20% reduction in seconds.
- Native 50% less damage and attack speed belong to the linked skill. They are
  not inserted into passive scores a second time or advertised as Full DPS.
- Totem area and generic/attack/Grenade area are distinct modifier sources,
  not guaranteed overlap or additional hits.
- Minion bonuses and unreviewed player-only Blind/Maim/Incision application
  scopes do not automatically transfer to the proxy. No extra support-gem
  compatibility is inferred from the parent or the Grenade's tags.

Gas and Oil score physical impact hits only, not Poison clouds, Oil Ground,
external ignition or triggered fire damage. Flash retains its native stun and
Blind effect/duration suggestions. No new flat Blind chance is recommended.
Voltaic scores its reviewed Lightning hit; Explosive and Cluster use their
reviewed Fire hit components. Conditional buffs, ailments, gear and external
detonations remain outside this version.

## Runtime Contract

The optional `socketedGrenadeId` setting is recognized only for Mortar Cannon
and a reviewed choice. It travels through the app, worker request and settings
normalization into scope/suggestion resolution. Build Focus refuses missing,
malformed or incompatible selections before search; the button explains this
in its tooltip. Changing Grenades cancels search and invalidates stale preview
candidates. Shortest does not require or use the setting and remains unchanged.

The preset catalog counts Mortar once, not once per Grenade. Coverage reports
its six socketed contexts separately. There are now 87/399 raw skill presets
(21.8%), including 82/234 positive-tier entries (35.0%); these are curated
catalog contexts, not a live obtainable-gem list or overall completion metric.

## Evidence

Metadata and native checks use the marked isolated PoB 0.23.1 copy. The 36
compatibility/ownership cases are retained in `var/mortar-cannon-20261108/`.
Frozen component/identity facts and independent regression fixtures are in
`src/tree/mortarCannon.fixtures.ts`; ordinary tests need no local PoB or network.
No optimizer-quality research audit or benchmark was run.

- [Generated Mortar Cannon and hidden support data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L14109)
- [Existing Ballista ownership review](build-focus-ballistas.md)
- [Existing Grenade hit boundaries](build-focus-skill-expansion.md)

The upstream `dev` branch is a moving reference, not a claimed byte-identical
snapshot of the isolated source. Preference weights are reviewed priorities,
not whole-build DPS or cooldown-limited throughput calculations.

## Verification

`npm run validate:release` passed 2,432 tests across 108 files, typecheck,
production build, graph validation and the coverage baseline. Edge and Firefox
production-preview smoke checks exercised all six selections, no-default
validation, unchanged Shortest availability, explicit suggestion apply, route
preview/apply, separate player/Totem Life priorities and saved-build reload.
No application console errors or warnings remained after either smoke run.
Screenshots and logs are retained under `output/playwright/mortar-cannon-20261108/`
and `var/mortar-cannon-20261108/`. The existing production chunk-size advisory
remains non-blocking. Local verification is not a GitHub Pages deployment.

# Concentrated Area for Poison Bow Focuses

Concentrated Area is reviewed for Poisonburst Arrow's Poison burst and Gas
Arrow's Poison cloud: two new skill/support pairs. Fireball's separate held
review remains untouched. This is not Full DPS evaluation or a recommended
support loadout.

## Behavior and Priority

- The source supplies 30% more Area Damage and 50% less area, not 50% less
  radius. Native PoB boosts both area-enabled derived Poison sources. It does
  not add a Poison Magnitude modifier, actual burst/cloud hits, Poison chance,
  stack limit, duration, deployment rate or a Mana-cost multiplier.
- Poisonburst's initial arrow hit is unchanged. Gas Arrow's separate area-enabled
  Arrow and conditional Fire-explosion outputs also gain damage. Neither those
  hits nor their critical behavior are promoted into the Poison-cloud score.
- Smaller coverage does not guarantee more contacts, overlaps or applications.
  Cloud growth, six-cloud limit utilization, external Poison feeding, detonation
  requirements and explosion frequency remain unmodeled. Exact live-game or
  fully equipped-build performance is not claimed from the native fixture.
- The selected support suggests High Area of Effect for coverage, not Poison
  magnitude or a calculated restoration of lost area. Selection does not change
  existing weights. Add suggestions preserves manual weights; Apply support
  priorities changes only the displayed Area of Effect priority. Removing the
  support does not undo an adopted manual preference. Other goals, budgets,
  class starts and support families survive saved-build round trips.
- A typed per-skill override keeps the Poison-source wording separate from the
  existing hit-focused Concentrated notes. Toxic Growth and older melee/rain
  behavior are unchanged. No parser, optimizer, point accounting, passive scope,
  CSS or save-schema change; no native damage estimate multiplies route scores.

## Source and Independent Evidence

The isolated PoB 0.23.1 runtime accepted both requested pairs. Two synthetic
type controls remove Area and MinionsCanExplode eligibility and reject the link.
Twenty-six MAIN calculations cover both Poisonburst sets and all three Gas Arrow
sets, plus separate area-only and damage-only controls, their synthetic
combination, 100% increased area, Magnified Area II, Deadly Poison II and combined
Magnified/Deadly/Efficiency links. Every calculation asserts the selected stat
set, a real equipped Bow and actual applied support IDs.

The empty-tree Witch, level-20 skill and normal Crude Bow isolate modifiers.
Installed PoB and user builds are untouched. Evidence is under
`var/poison-bow-concentrated-supports-20261109/`; independent frozen fixtures are
`src/tree/poisonBowConcentratedSupports.fixtures.ts`. Ordinary tests need no
network or native installation.

| Native Poison-component output | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Baseline Poison/s | 5.385766215481 | 4.0038541776187 |
| Concentrated Poison/s | 6.9202014957406 | 5.2115741262775 |
| Base radius -> Concentrated radius | 24 -> 16 | 18 -> 12 |
| Concentrated + 100% increased area radius | 24 | 18 |
| Concentrated + Magnified II radius | 20 | 15 |
| Base/Concentrated Mana cost | 38 | 62 |
| Displayed skill duration | 3.003 s | 4.026 s |
| Outgoing Poison duration | 3 s | 2 s |

The area-only control shrinks coverage without changing Poison output. The
damage-only control improves the derived Poison source without changing radius.
Their synthetic combination exactly reproduces the linked support. Low Bow
damage values round before the final ailment estimate, so observed hits/Poison
are not forced to have an exact final 1.3 ratio. Source no-hit flags still govern
interpretation of the calculation-only hit fields.

Independent radius checks use `floor(baseRadius * sqrt(.5))`, distinguish area
from radius and combine increased and more/less modifiers multiplicatively.
100% increased area with the half-area modifier restores the baseline radii in
this fixture: `floor(baseRadius * sqrt((1 + 1) * .5))`. Magnified II alone with
Concentrated gives `floor(baseRadius * sqrt(1.45 * .5))`, still below baseline.
PoB's displayed combined area modifier is rounded to 0.73; it is not used as an
exact substitute for the source factors. High priority does not promise enough
passive area to offset the loss.

| Separate hit output | Baseline | Concentrated |
| --- | ---: | ---: |
| Poisonburst Arrow / Arrow | 5.38125 | 5.38125 |
| Gas Arrow / Arrow | 1.8375 | 2.3625 |
| Gas Arrow / conditional Explosion | 11.025 | 14.4375 |

In the Poison components, Magnitude stays 1, native maximum stacks stay 1,
deployment stays 1.2/s, and duration, Poison duration and cost remain unchanged.
With Deadly II, native Poison output changes from 7.4384544711926/5.5922684579199
to 9.5724373112888/7.2463196919526. Adding Magnified II restores some area but
adds no damage. Adding Efficiency II produces cost 30/48 using the native
intermediate support-multiplier floor followed by the less-cost ceiling.
Those combined outputs retain their distinct source-damage, magnitude, coverage
and cost meanings; no whole-route DPS gain is derived.

- [Concentrated Area source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2069)
- [Skill component source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua)

Moving upstream links are not claimed byte-identical to the isolated snapshot.
Native/source evidence is not complete live-game simulation.

## Coverage and Next Batch

Reviewed pairs increase 462 -> 464; support choices stay 40, families 25,
skill presets 103/399, positive-tier skills 98/234 and passive preferences 184.
Confirmed main-tree wording/occurrence coverage remains 864/2182 and 3444/5451.
No source catalog refresh or baseline reset.

The subsequent authorized [Mobility/Deliberation review](build-focus-poison-bow-movement-supports.md)
is recorded separately; the counts and verification here describe this historical
Concentrated checkpoint. Further batches and deployment still require approval.

## Verification

The focused check passed 295 tests across eight files. One
`npm run validate:release` passed 2755 tests across 122 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
64019 ms. The existing large-chunk advisory remains non-blocking (main
697.34 kB). No baseline reset, source catalog refresh or route-quality audit.

An isolated Edge production-preview smoke passed both additions, source/coverage
notes, manual-priority preservation on selection/Add suggestions, explicit
Area of Effect-only apply, removal without undoing adopted weights, previous
support families, goal/start/budget preservation and saved-build load/reload.
The completion console had zero errors and warnings. The initial unrelated
favicon 404 was absent after reload. The screenshot was visually checked for a
nonblank tree and readable, non-overlapping controls. User saves were isolated
and the test session closed. No CSS or browser-specific implementation changed;
the existing Firefox checkpoint was not repeated for this allowlist extension.

Logs: `var/poison-bow-concentrated-supports-20261109/`. Repeatable browser script
and screenshot: `output/playwright/poison-bow-concentrated-supports-20261109/`.
The existing preview was reused after verifying its HTML matches the current
production build: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

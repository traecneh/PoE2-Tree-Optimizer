# Poison Bow Ricochet I/II Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f, plus moving upstream generated support data. Scope is
Poisonburst Arrow and Gas Arrow, not all compatible skills or Full DPS.

## Effects, Eligibility and Boundaries

| Choice | Effect | Catalog tier | Terrain-chain chance |
| --- | --- | ---: | ---: |
| Ricochet I | SupportRicochetPlayer | 2 | 40% |
| Ricochet II | SupportRicochetPlayerTwo | 4 | 50% |

Both belong to family Ricochet, require Projectile, and exclude CannotChain
and CannotTerrainChain. Both real parents pass. Four native compatibility
groups also reject missing Projectile, ProjectileNumber-only fallback and
each prohibited type. Gas's ground-targeted parent passing the type check
does not establish a useful terrain collision or another cloud placement.

The generated stat maps to `TerrainChainChance`, not ordinary chain count,
projectile count or Poison chance. PoB displays at most 100%: a parsed 60%
control plus I/II produces raw 100%/110%, displayed as 100%/100%. A probability
cap does not supply terrain, a valid next target, repeat hits or boss uptime.
No additional contacts, bursts, clouds or Poison applications are credited.

Poisonburst's actual arrow and separately enabled arrow Poison remain separate
from its no-hit burst. Gas's arrow, no-hit cloud Poison and conditional Fire
explosion remain separate. Native source-hit fields are not actual burst/cloud
hits, and no cloud chaining, overlap, ignition or detonation is inferred.

Neither tier adds a damage/speed penalty, cooldown or Mana multiplier. Other
links retain their costs, penalties and collision rules; Ricochet does not
override enemy-collision Pierce/Fork/Chain priority or prove any sequence.

Sources:
- [Ricochet I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4922)
- [Ricochet II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4952)
- [Native stat map](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L1901)
- [Native chain counters](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L1275)

Moving links are not claimed byte-identical to the frozen runtime.

## Bounded Native and Independent Checks

49 MAIN calculations: empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None, distance 20,
Bleeding/Poisoned false. No installed PoB, user builds or runtime source changed.

Five components have baseline/I/II calculations. Additional rows cover four
parsed scalar chance controls, Efficiency II, Poison III, Chain III with
Fork/Pierce III, Nova II and the 60%-base cap controls. Applied-support checks
confirm all intended links apply rather than silently comparing ignored gems.

Only terrain-chain chance changes within each context. Ordinary ChainMax stays
zero without Chain III, two with it; no extra counter is credited as a contact.
All other captured outputs and source ranges match the same-context baseline,
including damage, speed, Mana, Poison, projectiles, cooldown, areas and timers.

| Native source Poison/s | Baseline / I / II | Chain III + Fork/Pierce III, with or without Ricochet | Nova II, with or without Ricochet |
| --- | ---: | ---: | ---: |
| Poisonburst burst | 5.385766 | 3.251783 | 0.785634 |
| Gas cloud | 4.003854 | 2.415440 | 0.445193 |

Mana is 38/62, Efficiency II 23/38, Poison III 45/74, delivery links 41/68.
Nova II's cooldown stays 8.019 after native tick rounding. Poison duration is
3/2 seconds; burst/cloud timers 3.003/4.026 and radii 24/18. These are bounded
native estimates, not measured contact counts or sustainable in-game coverage.

Independent verification checks chance addition/cap, applied gems, exact
same-context outputs, scalar equivalence, baseline weapon ranges, costs and
PoB's source-roll/critical-presence/active-Poison arithmetic. No terrain chance
is multiplied into damage or application rate. Evidence is ignored under
`var/poison-bow-ricochet-20261109/`; normal source fixtures require no PoB/network.

## App Behavior and Coverage

Two context-only choices, four reviewed pairs; changing tier replaces only
Ricochet. Legal Nova I/Multishot pairing, Nova II's two-family restrictions,
existing warnings, manual weights, suggestions, scope, scores, point budget
and shortest routing stay unchanged. Save/JSON state stores the chosen ID,
without schema changes or new controls. No automatic priority action.

86/567 raw choices (15.2%), 85/450 positive-tier (18.9%), 52 unique families,
564 pairs and 63 choices per Poison focus. Skills stay 103/399 (98/234 positive),
preferences 184, wording 864/2182 and occurrences 3444/5451. These are scoped
review/heuristic counts, not overall completion. No catalog/baseline refresh.

## Validation

The independent verifier passed 49 rows, four compatibility groups and four
parsed scalar controls. Focused regressions passed 321 tests in five files,
including fourteen new pure tests and two UI cases.

`npm run validate:release` passed: 3,293 tests in 152 files, typecheck,
production build, graph validation and unchanged coverage baseline; 108.975
seconds. Existing large-chunk advisory remains nonblocking (main 763.32 kB,
189.44 kB gzip). No unrelated performance refactor or data refresh.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke passed both 63-choice lists, tier replacement,
removal/restoration, terrain-chance/component/cost notes, unchanged manual
weights, mixed-source caution and earlier support summaries. It also preserves
legal Nova I/Multishot pairing and Nova II's family restrictions. Screenshot
inspection confirms readable notes and a rendered tree without overlap. After
reload the console had zero errors/warnings and no page errors. Initial launch
only had the existing preview `/favicon.ico` 404, inspected separately.

Browser evidence: `output/playwright/poison-bow-ricochet-20261109/`. These are
source/native/regression/browser checks, not in-game tests or user visual
acceptance. Nothing committed, pushed or deployed.

## Next Proposed Batch

Review Salvo for these focuses: Seal generation and waiting time, random
projectile direction, shared AdditionalProjectiles/Seal families and Nova II's
added cooldown. Do not assume maximum Seals, extra contacts or extra Poison
applications. Completed in the subsequent [Salvo review](build-focus-poison-bow-salvo.md).

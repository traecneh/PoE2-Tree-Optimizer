# Poison Bow Pierce I/II/III Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB 0.23.1,
tree 0.5.5f; moving upstream generated support data was also checked. Scope:
Poisonburst Arrow and Gas Arrow. These are contextual reviews, not Full DPS.

## Source and Compatibility

| Choice | Effect | Catalog tier | Reviewed behavior |
| --- | --- | ---: | --- |
| Pierce I | SupportPiercePlayer | 1 | Pierce an enemy; 20% less Projectile Damage after a prior pierce |
| Pierce II | SupportPiercePlayerTwo | 3 | Pierce an enemy; no damage penalty |
| Pierce III | SupportPiercePlayerThree | 5 | Always pierce; 20% less Damage per prior enemy pierced |

All belong to the Pierce family. Each requires Projectile and excludes
ProjectileNoCollision. Six native compatibility probes accept both real parent
skills, reject missing Projectile and reject a synthetic no-collision type.
No additional Mana multiplier exists on any tier. This does not establish
actual collisions, cloud placements or valid multi-tier combinations.

Frozen `SkillStatMap.lua:1818-1820` maps the 100% constant on I/II to one
`PierceCount`, not unlimited pierce or 100 actual contacts. III uses
`PierceAllTargets`; native `PierceCount = 100` is the "All targets" sentinel,
not a game cap or observed contact count. `CalcOffence.lua:1340-1354` caps the
configured `PiercedCount` by available pierces. All counters here are explicit
zero/one/two prior-pierce scenarios, never extra contacts inferred by the app.

## Damage Scope and Poison Boundaries

Pierce I's conditional MORE modifier is Projectile-scoped and activates after
at least one configured prior pierce. Pierce II has no damage modifier. III's
native MORE uses `PerStat(PiercedCount)`; the frozen ModStore evaluates
`1 - 0.2 * count`, yielding 1/0.8/0.6 for the tested 0/1/2 scenarios. This
independently verified native formula is not asserted to be the live game's
repeated-pierce formula (nor silently replaced with `0.8 ** count`). Higher
counts were not audited or extrapolated.

All five native components retain Projectile flags, including synthetic Poison
source calculations and the conditional Gas explosion. The configured penalty
therefore changes their native source estimates. This is not proof that a
cloud or burst hits, pierces, or inherits a particular live-game projectile
state. No unconditional Poison multiplier, second Poison penalty or additional
Poison application is applied by the routing tool.

- Poisonburst's actual arrow hit is separate from its no-hit Poison burst.
  Extra bursts, contacts and overlapping coverage are not inferred.
- Gas's arrow travel and ground placement are separate from its no-hit cloud
  and conditional Fire explosion. Pierce supplies no ignition/detonation and
  does not guarantee extra clouds, targets or boss hits.
- Arrow Poison enabled separately by Poison III is checked independently of
  inherent burst/cloud Poison. Contact, Bleeding and uptime are not assumed.

## Bounded Native and Independent Checks

64 MAIN calculations: level-90 empty Witch, level-20/quality-zero skill,
Physical Crude Bow (6-9 damage), sufficient attributes, boss None, distance 20.
Enemy Bleeding/Poisoned are false; installed PoB and user builds are untouched.

| Native scenario | Poisonburst source Poison/s | Gas cloud-source Poison/s |
| --- | ---: | ---: |
| Baseline / all tiers at zero prior pierces | 5.385766 | 4.003854 |
| I or III, one configured prior pierce | 4.318775 | 3.176829 |
| II, one configured prior pierce | 5.385766 | 4.003854 |
| III, two configured prior pierces | 3.251783 | 2.415440 |

Arrow average hits for baseline / 0.8 / 0.6: Poisonburst 5.38125 / 4.33125 /
3.28125; Gas 1.8375 / 1.575 / 1.05. Conditional Gas Fire explosion: 22.05 /
17.85 / 13.125. These are separate component estimates, not aggregate DPS.

Ten independent scalar controls (`20% less Projectile Damage` or `40% less
Damage`) reproduce the tested post-pierce damage outputs exactly, excluding
the deliberate differences in pierce fields. The verifier independently
reconstructs rounded weapon-derived Physical/converted-Fire ranges, once-only
source-weighted Poison ratios and crit-weighted hit-channel sums. Zero-state
and Pierce II damage match their baselines; no extra hit or Poison count is used.

Mana stays 38/62, with Efficiency II 23/38, and with Poison III 45/74. Chance,
duration, magnitude, maximum Poison stacks, source rolls, speed, Accuracy,
critical chance, projectile speed, area and burst/cloud timers are unchanged
within each tested context. No support changes Mana sustain assumptions.

Ignored evidence: `var/poison-bow-pierce-20261109/` contains the native driver,
results, verifier and logs. The first driver run had a diagnostic flag-property
lookup error; that was corrected to the real stat-set flag before the successful
64-row run. No runtime source was changed. Independent source fixtures and
ordinary tests do not require PoB/network.

- [Pierce I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3648)
- [Pierce II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3680)
- [Pierce III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3711)
- [Pierce mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L1818)
- [Native prior-pierce calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L1340)

## Implementation and Coverage

Three unique choices, six reviewed pairs, one new family. Existing family
normalization replaces one tier with another instead of stacking all three.
Selection/removal, saved export and disabled controls are covered. Manual
priorities, suggestions, scopes, scores and shortest routing stay unchanged.
Chaos Attunement's mixed-source caution and earlier Withering Touch, Malady,
Blindside, distance and Exploit Weakness/Corrosion warnings are retained.

76/567 raw support choices (13.4%), 75/450 positive-tier (16.7%), 47 families
and 544 pairs; each Poison focus has 53 choices. Skills remain 103/399 (98/234
positive-tier), preferences 184, wording 864/2182 and occurrences 3444/5451.
These are scoped heuristic/review counts, not overall completion. No catalog
refresh, baseline reset, parser, schema, controls or route-search changes.

## Validation

Independent native verifier passed all 64 rows, six compatibility probes and ten
scalar controls. Focused regressions passed 293 tests across four files.
`npm run validate:release` passed: 3,206 tests in 147 files, typecheck, production
build, graph validation and coverage baseline; 59.150 seconds. The existing
large-chunk advisory remains nonblocking.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke checks passed both 53-choice lists, all three tier
selections/replacements, removal, conditional notes, unchanged manual weights,
mixed-source caution and earlier support warnings. Screenshot inspection
confirms readable notes and a rendered tree without overlap. After reload the
console had zero errors/warnings and no page errors; initial launch had only
the existing preview `/favicon.ico` 404, inspected separately.

Evidence: `output/playwright/poison-bow-pierce-20261109/`. These are local
source/native/runtime checks, not in-game testing or user acceptance. Nothing
committed, pushed or deployed.

## Next Proposed Batch

The subsequent [Fork review](build-focus-poison-bow-fork.md) checks compatibility,
post-fork penalties, Mana cost and interaction with Pierce, separating manual
counter scenarios from possible collisions and no-hit Poison applications.

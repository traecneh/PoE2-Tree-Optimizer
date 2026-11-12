# Poison Bow Chain I/II/III Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB 0.23.1,
tree 0.5.5f; moving upstream generated support data also checked. Scope is
Poisonburst Arrow and Gas Arrow, not every legal skill or Full DPS.

## Source, Compatibility and Cost

| Choice | Effect | Catalog tier | Additional chains | Less Hit Damage |
| --- | --- | ---: | ---: | ---: |
| Chain I | SupportChainPlayer | 1 | 1 | 30% |
| Chain II | SupportChainPlayerTwo | 2 | 2 | 50% |
| Chain III | SupportChainPlayerThree | 5 | 2 | 40% |

All are in family Chain. Each requires Projectile or Chains, excludes
CannotChain and ProjectileNoCollision, and has no added Mana multiplier. Six
native compatibility probes accept both real parents and a synthetic Chains
fallback; missing types and both prohibited types fail. The fallback is not
permission to add unreviewed focuses. No PvP multiplier is applied to PvE.

Mana remains 38/62, with Efficiency II 23/38, and with Poison III 45/74 across
all tiers. Fork still increases it to 41/68 in paired checks. No free sustain
or removal of another support's multiplier is inferred.

## Hit-Only Is Not Poison-Unchanged

The generated MORE modifier has `ModFlag.Hit` with no prior-chain condition.
It affects the initial hit even before a chain occurs. Configuring one prior
chain changes the native counter/remaining chains, not the penalty again.

PoE2's game-authored Poison description uses eligible pre-mitigation Physical
and Chaos source damage, without applying damage-dealt modifiers a second time.
Native `CalcOffence.lua:4884-4885` reads the stored eligible source hit range.
Consequently the hit penalty lowers the reviewed Poison-source estimate once;
it is not a direct non-hit/Poison multiplier and does not make Poison unaffected.

The driver checks separate hit and non-hit modifier queries, clearing both
ModFlag.Hit and KeywordFlag.Hit in the latter. Chain alone yields hit multipliers
0.7/0.5/0.6 and non-hit multipliers 1/1/1, while source-derived Poison falls.
Fifteen parsed `less Damage with Hits` scalar controls give the same damage
results without supplying Chains. The verifier checks this separation rather
than assuming Poison stays constant or applying the penalty twice.

The actual arrow and separately enabled arrow Poison remain distinct from
Poisonburst's no-hit burst and Gas's no-hit cloud. Native source-hit fields do
not make these real hits or prove live-game source inheritance. Conditional
Gas Fire-explosion hits are separate; extra clouds, ground placement, ignition,
detonation and terrain chains are not supplied by Chain.

## Collision Priority

The game-authored Chain glossary says Split, Pierce and Fork take priority over
Chain and the same enemy cannot be targeted twice in the same Chain. A collision
using a higher-priority behavior cannot also Chain. Available counters are not
measured contacts, guaranteed next targets, repeats on a boss or Poison uptime.

Selected Chain notes add a reversible priority warning when Fork or a reviewed
Pierce tier is selected. With Pierce III they additionally warn against
crediting enemy-hit Chains while always-Pierce is active on those collisions.
Both supports remain selected, with all costs and penalties. These are not
blanket gem-incompatibility warnings, and item/skill exceptions are not inferred.

The runtime accepts a configured Chain alongside Fork and Pierce III's "All
targets" sentinel. Forward/reversed triple links give identical values, not
proof of a possible collision sequence. Existing Fork/Pierce warnings remain
unchanged. Removing peers restores the standalone Chain note; changing Chain
tier replaces only its family and retains the peers.

## Bounded Native and Independent Checks

73 MAIN calculations: empty level-90 Witch, level-20/quality-zero skill, normal
Physical Crude Bow (6-9 damage), sufficient attributes, boss None, distance 20,
explicit Chain/Fork/Pierce counters, enemy Bleeding/Poisoned false. No installed
PoB or user builds changed; no runtime source modifications.

| Native source Poison/s | Baseline | Chain I | Chain II | Chain III |
| --- | ---: | ---: | ---: | ---: |
| Poisonburst burst | 5.385766 | 3.719227 | 2.601427 | 3.251783 |
| Gas cloud | 4.003854 | 2.796134 | 2.034746 | 2.415440 |

Arrow average hits (baseline/I/II/III): Poisonburst 5.38125 / 3.80625 / 2.625 /
3.28125; Gas 1.8375 / 1.3125 / 0.91875 / 1.05. Conditional Gas Fire explosion
22.05 / 15.75 / 11.55 / 13.125. These are separate native component estimates,
not aggregate DPS or a claim about burst/cloud contacts.

Independent verification reconstructs rounded Physical/converted-Fire ranges,
once-only eligible-source Poison ratios, crit-weighted hit sums, costs, tier
chain limits and reversed-link-order results. Paired Fork/Pierce generic
penalties remain separate from Chain's hit-only modifier. The triple modifier
query reports 0.34 after native rounding of 0.7 * 0.8 * 0.6; no universal live
rounding or feasible contact sequence is inferred from this arithmetic case.

Poison chance, duration, magnitude multiplier, max stacks, source roll, speed,
Accuracy, crit chance, radii and burst/cloud timers stay unchanged within each
context. A smaller eligible source can reduce final Poison damage despite an
unchanged separate magnitude multiplier. No extra hits, applications or uptime.

Ignored evidence: `var/poison-bow-chain-20261109/` contains driver, native results,
verifier and logs. The initial driver's deep copy of a cyclic skill config
overflowed; a shallow probe copy corrected that before the successful run.
Both hit flag kinds are explicitly cleared for the final non-hit probe.
Independent source fixtures and normal tests require no PoB or network.

- [Chain I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L808)
- [Chain II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L844)
- [Chain III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L880)
- [Stored ailment source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L4884)
- [Game-authored Chain glossary mirror](https://poe2db.tw/us/Chain)
- [Game-authored Poison glossary mirror](https://poe2db.tw/us/Poison)

The glossary mirrors are used for game-authored definitions, not community
guide analysis. Moving links are not claimed byte-identical to the frozen runtime.

## Implementation and Coverage

Three choices/six pairs/one new family. Existing normalization, tier replacement,
saved export and disabled controls are reused. Only contextual notes change;
weights, suggestions, exclusions, scopes, scores and shortest routing stay
unchanged. Prior Chaos Attunement, Withering Touch, Malady, Blindside, distance
and Exploit Weakness/Corrosion notes are preserved. No new controls, parser
categories, schema or collision/DPS engine.

80/567 raw support choices (14.1%); 79/450 positive-tier (17.6%); 49 families,
552 pairs; 57 choices per Poison focus. Skills remain 103/399 (98/234 positive),
preferences 184, wording 864/2182 and occurrences 3444/5451. These are scoped
review/heuristic counts, not overall completion. No baseline/catalog reset.

## Validation

Independent verifier passed all 73 rows, six compatibility probes and fifteen
hit-scoped scalar controls. Focused regressions passed 329 tests across six files.
`npm run validate:release` passed: 3,242 tests in 149 files, typecheck, production
build, graph validation and coverage baseline; 66.977 seconds. The existing
large-chunk advisory remains nonblocking.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke checks passed both 57-choice lists, three-tier
replacement, standalone hit/source/cost notes, Fork and all Pierce priority
warnings, warning restoration after removal, reverse selection order, unchanged
manual weights, mixed-source caution and earlier support warnings. Screenshot
inspection confirms readable notes and a rendered tree without overlap. After
reload the console had zero errors/warnings and no page errors. Initial launch
had only the existing preview `/favicon.ico` 404, inspected separately.

Evidence: `output/playwright/poison-bow-chain-20261109/`. These are local
source/native/runtime checks, not in-game tests or user acceptance. Nothing
committed, pushed or deployed.

## Next Proposed Batch

Review Multishot I/II for both focuses: actual compatibility, extra projectiles,
damage and speed penalties, eligible Poison-source rolls and costs. Do not
assume overlapping hits, extra Poison stacks or clouds. Both have positive
catalog tiers; these are the current Multishot names, not invented Scattershot
entries. Completed in the subsequent [Multishot review](build-focus-poison-bow-multishot.md).

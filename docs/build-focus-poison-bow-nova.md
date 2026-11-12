# Poison Bow Nova Projectiles I/II Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f, plus moving upstream generated support data. Only
Poisonburst Arrow and Gas Arrow are added as reviewed pairs, not all legal
skills or Full DPS simulation.

## Reviewed Effects and Families

| Choice | Effect | Catalog tier | Extra projectiles | Less Damage | Base cooldown | Families |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Nova Projectiles I | SupportNovaProjectilesPlayer | 2 | 0 | 0% | None added | NovaProjectiles |
| Nova Projectiles II | SupportNovaProjectilesTwoPlayer | 4 | 6 | 50% | 8 seconds | NovaProjectiles, AdditionalProjectiles |

Both change projectile delivery to a circle; neither guarantees extra hits,
Poison applications, stacks, burst contacts or overlapping clouds. Tier I's
native numeric outputs are identical to baseline: it is not extra projectiles
or a damage bonus. Circular geometry is not simulated by this tool or native
PoB's damage calculation. Tier II is not Multishot with an added circle: its
damage and cooldown trade-offs are separate, and it has no Skill Speed penalty.

Nova I and Multishot can coexist, retaining Multishot's damage and speed
penalties. Nova II conflicts with both Nova I and either Multishot tier. The
app's family metadata now supports additional families. Clicking a support
replaces every intersecting family, preserving unrelated links and warnings.
Loaded IDs retain the existing first-valid-wins normalization convention;
clicks use newest-choice-wins. Removing a support does not restore replaced
choices. Existing single-family behavior is unchanged; no saved-build schema
change or new UI controls.

The coverage tracker splits comma-delimited source-family labels before
deduplication, so the two-family combination is not a third distinct family.

## Compatibility and Costs

Both require one of Projectile, ProjectileNumber, CrossbowSkill or
CrossbowAmmoSkill, and reject Rain and ProjectilesNumberModifiersNotApplied.
Tier II additionally rejects an existing cooldown unless it is the marker from
its own Nova support application; proxy/persistent exclusions also apply. Both
real parents pass. Four compatibility groups include missing-type, synthetic
ProjectileNumber, excluded-type, existing-cooldown and own-marker controls.
The self-marker exception is a native application detail, not permission to
support arbitrary existing-cooldown skills.

Neither tier adds a Mana multiplier. Costs stay 38/62 for Poisonburst/Gas,
23/38 with Efficiency II, and 45/74 with Poison III. Other links and actual
use rate still matter for sustain. No poison-chance, Poison-duration or
maximum-stack increase is added.

The actual arrow and separately enabled arrow Poison stay distinct from the
no-hit burst/cloud. Native source-hit fields are not actual burst/cloud hits.
Gas's conditional Fire explosion remains separate; no assumed ignition,
detonation, cloud placement or overlap.

## Native and Independent Verification

46 MAIN calculations: empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None, distance 20,
enemy Bleeding/Poisoned false. No installed PoB, user builds or runtime source
changed. Five components cover baseline, both tiers and a parsed 50%-less-Damage
control. Additional rows cover Efficiency II, Poison III, cooldown recovery,
Nova/Multishot family conflicts and reverse link order.

| Native source Poison/s | Baseline / Nova I | Nova II | Only 50% less Damage | Nova II + 100% cooldown recovery |
| --- | ---: | ---: | ---: | ---: |
| Poisonburst burst | 5.385766 | 0.785634 | 2.601427 | 1.564829 |
| Gas cloud | 4.003854 | 0.445193 | 2.034746 | 0.886736 |

Native cooldown is tick-rounded to 8.019 seconds, or 4.026 with 100% increased
recovery. Effective rate becomes 1/cooldown; this is not an extra Skill Speed
penalty. Baseline firing is 1.2/s. Projectile counts are 1/1/7, not that many
hits. The independent verifier reconstructs rounded Physical/converted-Fire
ranges, once-only source reduction, Mana costs and 33 ms cooldown rounding.

For these one-stack fixtures the native repeated-application model changes
source roll, critical-Poison presence and active-stack fraction. Nova II drops
potential below one (3/8.019 for Poisonburst, 2/8.019 for Gas), uses the middle
of the source range and scales modeled active Poison by that fraction. This
explains why the native estimate falls further than the damage-only control.
It is not measured sustained coverage: burst/cloud behavior is not simulated,
and the displayed estimate must not be multiplied by seven projectiles.

Poison duration stays 3/2 seconds, burst/cloud timers 3.003/4.026, radii 24/18;
chance, magnitude multiplier, maximum stacks, Accuracy, crit chance/multiplier
and projectile travel speed stay unchanged within each context. No automatic
passive weights, cooldown priorities or route-score changes are introduced.

Native two-link family conflicts apply only the later link; reverse-order
results match the surviving standalone support. Nova I plus Multishot II is
legal in either order and matches the prior Multishot result, not an extra
damage or contact bonus.

Sources:
- [Nova Projectiles I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3315)
- [Nova Projectiles II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3343)
- [Native family resolution](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcSetup.lua#L502)
- [Native repeated-application model](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L5092)

Moving source links are not claimed byte-identical to the frozen runtime.
Ignored evidence: `var/poison-bow-nova-20261109/` (driver, native JSON, verifier,
logs). Normal independent regression fixtures need neither PoB nor network.

## Coverage and Validation

84/567 raw support choices (14.8%), 83/450 positive-tier (18.4%), 51 unique
families, 560 pairs and 61 choices per Poison focus. Skills remain 103/399
(98/234 positive), preferences 184, wording 864/2182 and occurrences 3444/5451.
These are scoped heuristic/review counts, not overall completion or full
mechanics simulation. No catalog or coverage-baseline refresh.

Independent verifier passed all 46 rows and four compatibility groups.
Focused regressions passed 329 tests in six files, including sixteen new pure
tests, two UI cases and a shared-family coverage regression.

`npm run validate:release` passed: 3,277 tests in 151 files, typecheck,
production build, graph validation and unchanged coverage baseline; 64.475
seconds. The existing large-chunk advisory remains nonblocking (main 761.32 kB,
189.05 kB gzip). No unrelated performance refactor or data refresh.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke passed both 61-choice lists, legal Nova I/Multishot
pairing with both Multishot tiers, Nova II's replacement of both conflicting
families, reverse replacements, removal and restoration of standalone notes.
Manual weights, mixed-source caution and all previously selected support
summaries stay unchanged. Screenshot inspection confirms readable notes and
a rendered tree without overlap. After reload there were zero console
errors/warnings and no page errors. Initial launch only had the existing preview
`/favicon.ico` 404, inspected separately, not a missing app resource.

Browser evidence: `output/playwright/poison-bow-nova-20261109/`. These are
source/native/regression/browser checks, not in-game tests or user visual
acceptance. Nothing committed, pushed or deployed.

## Next Proposed Batch

Review Ricochet I/II for these focuses: actual terrain-chain eligibility,
terrain versus enemy collisions and interaction with existing delivery
supports. Do not assume available walls, repeated boss contacts, extra Poison
applications or cloud coverage. Completed in the subsequent [Ricochet review](build-focus-poison-bow-ricochet.md).

# Gas Arrow Overabundance Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f, plus moving upstream generated support data. This adds
two Gas Arrow pairs, not a general Limit-skill allowlist or Full DPS model.

## Eligibility and Duration Trade-off

| Choice | Effect ID | Catalog tier | Cloud Limit | Less skill duration | Raw four-second cloud |
| --- | --- | ---: | ---: | ---: | ---: |
| Overabundance I | SupportIncreaseLimitPlayer | 1 | +1 | 50% | 2 seconds |
| Overabundance II | SupportIncreaseLimitPlayerTwo | 4 | +1 | 40% | 2.4 seconds |

Both use family Overabundance, require SkillType.Limit, have no excluded types
and add no Mana multiplier. Gas Arrow has Limit; Poisonburst Arrow does not.
Having Duration alone is not sufficient. Synthetic Limit compatibility is a
negative/control check, not permission to offer unreviewed focuses.

Gas's data cloud limit is six, so either choice raises capacity to seven.
That is not active cloud count, extra contacts, overlap or extra Poison stacks.
Shorter cloud persistence can reduce coverage and growth opportunity. Placement,
cloud growth, ignition and detonation are not simulated by this preference UI.
Gas's separately timed outgoing Poison remains two seconds, not one/1.2.
Arrow hits and separately enabled on-hit Poison, the no-hit cloud's Poison
source, and the conditional Fire explosion remain distinct.

Sources:
- [Overabundance I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3380)
- [Overabundance II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3416)
- [Generic limit mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua)
- [Native duration and cooldown calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving links are not claimed byte-identical to the frozen runtime.

## Native Checks and Limitations

36 MAIN calculations use an empty level-90 Witch, level-20/quality-zero skills,
normal Physical Crude Bow (6-9), sufficient attributes, boss None and enemy
Bleeding/Poisoned false. No installed PoB, user builds or runtime source changed.
Gas's three components and Poisonburst's two components have baseline/I/II
rows; Gas also has six parsed 50%/40%-less-duration controls. Five link contexts
have baseline/I/II rows: Efficiency II, Prolonged Duration II, Compressed
Duration II, Poison III on the actual arrow, and Nova II on the cloud source.

| Native cloud duration | Baseline | Overabundance I | Overabundance II |
| --- | ---: | ---: | ---: |
| No duration links | 4.026 | 2.013 | 2.409 |
| Prolonged Duration II | 5.412 | 2.739 | 3.267 |
| Compressed Duration II | 2.607 | 1.320 | 1.584 |

Native duration multiplies modifiers, rounds the combined More field to two
decimals and rounds the final duration to a 33ms server tick. For example,
1.35 * 0.5 = 0.675 rounds to 0.68 in reviewed PoB. This is an independently
reconstructed PoB calculation, not a claim about every live-game timer.

Outgoing Poison duration stays two seconds and the stack limit stays one.
Ordinary cloud Poison/s remains 4.003854 across all three rows; actual arrow
hit 1.8375, cloud source-hit field 4.33125 and conditional Fire hit 22.05 are
unchanged. Source-hit fields do not make the cloud a real Hit. Poisonburst
ignores both ineligible links, retaining its 5.38125 source hit and 5.385766
Poison/s. Identical native DPS is not proof of identical real coverage.

No cost increase: Gas Mana stays 62, or 38 with Efficiency II, 74 with
Prolonged Duration II and 74 with Poison III. Fixture levels and links matter;
these are not universal live-build costs.

### Nova II Bookkeeping Caveat

The frozen generic `base_limit_+` maps to AdditionalCooldownUses, not cloud
occupancy. With Nova II, either Overabundance changes stored uses from one to
two and bypasses native cooldown tick rounding (8.019 -> 8 seconds). The
derived source Poison/s changes from 0.445193 to 0.446250. Neither that tiny
change nor the extra stored-use field validates extra cooldown uses, clouds,
contacts, applications or DPS in game. No native cloud-occupancy model was found.

The selected Overabundance note warns when a valid Nova II is selected. Removing
Nova restores the standalone note. Invalid imported Salvo/Nova II combinations
are normalized first, so a rejected Nova II does not create a false warning.

Independent verification checks all 36 rows, intended applied/ignored supports,
four compatibility groups, six parsed duration controls, independent damage,
More/tick rounding and cost arithmetic, separate Poison duration/stacks and the
Nova exception. Ignored driver/JSON/verifier/logs:
`var/poison-bow-overabundance-20261109/`.

## App Behavior and Coverage

Gas offers 67 choices; Poisonburst remains at 65. Tiers replace only their own
family. Selection/removal preserves earlier movement/delivery/duration choices,
warnings, manual weights, suggestions, exclusions, scope, scores and budgets.
Save/JSON round trips retain eligible IDs and discard ineligible imported IDs.
No new controls, automatic priority action, cloud simulation or routing changes.

90/567 raw support choices (15.9%), 89/450 positive-tier (19.8%), 55 unique
families and 570 reviewed pairs. Skills stay 103/399 (98/234 positive),
preferences 184, wording 864/2182 and occurrences 3444/5451. These are scoped
review counts, not an overall completion percentage. No catalog/baseline refresh.

## Validation

Focused regressions passed 319 tests in five files, including ten new pure
tests and two new UI tests. The first full run caught two older tests assuming
identical support allowlists for both Poison bows; those now use per-skill
expectations. The final `npm run validate:release` passed 3,333 tests in 155
files, typecheck, production build, graph validation and unchanged coverage
baseline in 71.322 seconds. The existing large-chunk advisory remains
nonblocking (main 769.69 kB, 190.57 kB gzip).

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke passed Gas's 67-choice list and Poisonburst's
65-choice list, Gas-only eligibility, tier replacement, note removal and
restoration, the conditional Nova II caveat and unchanged manual state/older
warnings. No unexpected support-priority action or page errors. Screenshot
inspection confirmed readable notes and a rendered tree without overlap.
After reload the console had zero errors/warnings; the initial launch's
existing preview `/favicon.ico` 404 was inspected separately.

Browser evidence: `output/playwright/poison-bow-overabundance-20261109/`.
These are source/native/regression/browser checks, not in-game tests or user
visual acceptance. No commit, push or deployment.

## Next Proposed Batch

The proposed Supercritical review is now completed separately in
[the next checkpoint](build-focus-poison-bow-supercritical.md). It keeps
increased critical bonus, multiplicative chance and native source assumptions
separate, without automatic crit priorities or assumed uptime.

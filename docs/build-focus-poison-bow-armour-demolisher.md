# Poison Bow Armour Demolisher Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f and moving upstream sources. Four context-only pairs, not a
break-event timeline, enemy Armour solver, Full DPS model or global allowlist.

## Strength, Not Damage or Application

| Support | Effect ID | Catalog tier | More Armour Break |
| --- | --- | ---: | ---: |
| Armour Demolisher I | SupportArmourDemolisherPlayer | 1 | 50% (1.5x) |
| Armour Demolisher II | SupportArmourDemolisherPlayerTwo | 3 | 70% (1.7x) |

Both share family ArmourDemolisher, distinct from ArmourBreak. One Demolisher
tier is retained, while separately selected Armour Break remains. Native source
has no required/excluded types: four compatibility groups accept both parents,
an empty type set and Exploit-modified types. This batch admits only the two
reviewed focuses in the app; broad native eligibility is not an automatic
other-skill allowlist or proof of an eligible application source.

Demolisher grants no break source, hit, Poison chance, charge trigger or Mana
multiplier. It strengthens eligible supported-skill break, not Hit damage,
Poison DPS or percentage points of enemy Armour removed. For nominal pre-cap
amounts, 20 units of hit-based break become 30/34; 80 units from supported
Corrosion Poison become 120/136. These are source-defined unit checks, not
native event simulation or a claim the damage was dealt. More strength is
not added to the source damage and then applied again to break.

Physical arrow Hits used by Armour Break support remain separate from the
no-hit burst/cloud. Supported Corrosion Poison is its own break source, not
evidence those components Hit. Synthetic source-hit fields do not establish
extra applications. The reviewed fully converted Gas Fire explosion supplies
no Physical hit-based break; alternate gear/conversions and detonation are
not inferred. No combined timing, cap, below-zero Armour, Fully Broken Armour
or Endurance Charge uptime is calculated.

Sources: [I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L290),
[II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L325).
Moving references are not claimed byte-identical to the frozen runtime.

## Prohibition and Native Coverage

Exploit Weakness's CannotArmourBreak overrides the prospective benefit:
Demolisher cannot make the skill supply its own full-break condition or
charge event. It remains linked but does not bypass the prohibition. A new
reversible warning appears on Demolisher when Exploit is selected. Existing
Armour Break/Exploit warnings and the Corrosion/Exploit incompatibility warning
remain intact; prior notes are not rewritten by Demolisher alone.

Corrosion plus Demolisher is eligible alone. With Exploit, Corrosion is dropped
in both native link orders, and its 1.10 Mana multiplier must not be counted.
Exploit retains its 1.30 cost and requires a separately established full-break
state for the damage condition. A configured full-break snapshot is not a
supported-skill full-break event. No implied repeating application loop.

Native PoB stores the declared 1.5/1.7 More factor on ArmourBreakEffect.
Displayed ArmourBreakPerHit reads a separate modifier name and remains zero
for the percentage-based/Corrosion sources reviewed here. The per-hit More
factor remains one. A parsed Break 100% increased Armour control sets 100 INC
on the per-hit field, but still has no base amount to multiply. This is
incomplete native amount coverage, not zero game effect. No runtime patch or
invented break amount substitutes for the missing calculation.

[Native output calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)
and [percentage-source mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L2970).
See the prior [Armour Break](build-focus-poison-bow-armour-break.md),
[Corrosion](build-focus-poison-bow-corrosion.md) and
[Exploit Weakness](build-focus-poison-bow-exploit-weakness.md) checkpoints.

## Verification and Coverage

71 MAIN calculations use empty level-90 Witch builds, level-20/quality-zero
skills, a normal Physical Crude Bow, sufficient attributes, boss None and
two-metre distance. Five components each have baseline, Armour Break III,
Corrosion, both Demolisher tiers alone and with each source (45). Per parent:
no-hit source Exploit baseline/I/II (3); actual-arrow partial/full Exploit
baseline/II (4); actual-arrow Poison III baseline/II (2); both invalid triple
orders (2); and separate parsed break-increase/Poison-magnitude controls (2).
Total 71, four compatibility groups and four parsed scalar controls.

All rows passed independent checks of the stored More factor, separate per-hit
modifier, applied links/costs, actual configuration flags, prohibition,
unchanged damage/Poison/timers, and reconstructed Poison arithmetic. Adding
Demolisher gives no break capability by itself and earns no full-break state
or current charge. All charge-use flags are explicitly false and counts zero.
The fixed full-state Exploit comparison uses the same-state baseline; its
1.40 modifier is not credited to Demolisher.

Base Mana remains 38/62; Corrosion 41/68; Exploit 49/80; arrow Poison III 45/74.
No-hit Poison stays 5.38576622/4.00385418; arrow Poison III stays
4.56577245/1.53831410. The separate 100%-Poison-magnitude scalar doubles Poison
without supplying a native break amount. No installed/frozen runtime source or
saved user build changed. Evidence: ignored
`var/poison-bow-armour-demolisher-20261110/`; known frozen startup missing-node
notices are retained. These are not live-game tests or real-build imports.

112/567 support choices (19.8%), 111/450 positive-tier (24.7%), 67 families and
614 reviewed pairs. Poisonburst/Gas offer 87/89 choices. Skills remain 103/399
(98/234 positive), preferences 184, wording 864/2182 and occurrences 3444/5451.
No catalog refresh or baseline reset. These are scoped heuristic counts, not
overall completion. No automatic priorities, score changes, new parser scopes,
solver changes or persistence implementation changes.

Focused checks passed 386 tests in seven files, including sixteen new pure
tests and two UI cases. One `npm run validate:release` passed 3,519 tests in
166 files, typecheck, production build, graph validation and unchanged coverage
baseline in 79.620 seconds. Existing large-chunk advisory remains nonblocking
(main 797.43 kB, 195.38 kB gzip); no unrelated performance refactor.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
built JavaScript bytes. Edge smoke passed both 87/89-choice lists, tier
replacement/removal/restoration, the Demolisher prohibition warning, retained
Armour Break/Corrosion/Exploit warnings, component/model-gap notes and unchanged
manual weights. No unexpected automatic support-priority action or page errors.
Screenshot inspection confirmed readable notes and a nonblank tree without
overlap. Final console: zero errors/warnings after reload; the initial existing
preview `/favicon.ico` 404 was inspected separately.

Browser artifacts: `output/playwright/poison-bow-armour-demolisher-20261110/`.
Scoped `git diff --check` passed. These are source/native and local-app checks,
not live-game testing or user visual acceptance. Preview remains available.
No commit, push or deployment.

## Next Proposed Batch

Review [Armour Explosion](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L360)
for both Poison bows, separating its triggered Fire hit from Poison, checking
full-break event ownership and Exploit Weakness's prohibition, without assuming
extra hits or trigger uptime. Proposal only, not implemented here.

Completed subsequently in the [Armour Explosion checkpoint](build-focus-poison-bow-armour-explosion.md).

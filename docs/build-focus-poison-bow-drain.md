# Poison Bow Life Drain and Soul Drain Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f plus moving upstream sources. Four context-only pairs,
not a kill/Cull timeline, recovery simulator, Full DPS model or global allowlist.

## Supported-Skill Culls, Not Every Kill

| Support | Effect ID | Catalog tier | Declared recovery |
| --- | --- | ---: | --- |
| Life Drain | SupportLifeOnCullPlayer | 1 | 12% of maximum Life when supported skill Culls |
| Soul Drain | SupportManaOnCullPlayer | 3 | 12% of maximum Mana when supported skill Culls |

Distinct families LifeDrain/SoulDrain can coexist with each other, leech and
Culling Strike. Damage OR Attack OR CrossbowAmmoSkill is required, with no
excluded types. Four native compatibility groups accept both actual parents
and each synthetic fallback, reject missing requirements. This is scoped to
the two reviewed focuses, not proof every component can perform a Cull.

Neither Drain grants Cull. Actual supported arrow Hits can qualify with a
separate eligible source; Gas's conditional Fire explosion is separate and
requires an independently triggered detonation. Poisonburst's no-hit burst,
Gas's no-hit cloud and Poison damage over time cannot Cull. Native synthetic
source-hit fields are not real Cull events. Ordinary kills, Poison deaths and
Culls by another skill, minion or party member do not establish this event.

This is not Leech, Life/Mana on Hit, a Mana-cost refund, ongoing recovery or
guaranteed boss sustain. Missing resource and recovery restrictions matter.
Neither support adds a Mana multiplier; other linked support costs remain.
No event frequency, extra contacts, guaranteed kills or uptime is assumed.

Sources:
- [Life Drain](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L2747)
  and [Soul Drain](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5260)
- [Life recovery mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L555)
- [PercentStat rounding](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Classes/ModStore.lua)
  and [native recovery outputs](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving references are not claimed byte-identical to the frozen runtime.

## PoB Modeling Gaps and Culling Strike

Life Drain's raw `recover_%_maximum_life_on_cull` maps to generic LifeOnKill,
without a Cull gate. Native output is present even with no Cull source and on
Normal targets where Culling Strike I/II cannot Cull. This is a model artifact,
not proof that ordinary or Poison kills recover Life in game.

Soul Drain's `recover_%_maximum_mana_on_cull` is present in support data but
unmapped in the reviewed stat map. Native ManaOnKill stays zero; a separately
parsed generic on-kill Mana control produces recovery. Zero native output
does not establish no in-game effect. Both gaps are visible in support notes;
no installed/frozen runtime patch or substitute game rule is introduced.

With the reviewed Culling Strike I/II supports, only Rare/Unique enemies can
qualify, at 10%/5% Life thresholds. Normal enemies have no qualifying Cull.
Their finishing multipliers are not damage/Poison buffs or recovery rates.
Tier II declares a 20%-increased threshold buff for 20 seconds after Culling;
that stat is still unmapped in reviewed PoB. No first-Cull activation, buff
uptime or extra recovery is inferred. These rarity restrictions are specific
to the linked supports, not a claim about every external Cull source.
See [the existing Culling checkpoint](build-focus-poison-bow-culling-strike.md).

## Native Checks and Independent Arithmetic

72 MAIN calculations use empty level-90 Witch builds, level-20/quality-zero
skills, normal Physical Crude Bow (6-9), sufficient attributes and explicit
target rarity. No installed PoB, saved build or native source changed.

Five components (two real arrows, two synthetic no-hit Poison sources and
Gas's conditional Fire explosion) have Normal baseline/Life/Soul/both rows
(20), plus Rare/Unique Cull I alone, I+both and II+both rows (30). Per-parent
arrow controls cover Normal I/II+both (4), four parsed resource scalars (4),
recovery restrictions (6), separate Life/Mana Leech baseline/with Drains (4)
and Poison III + Cull II baseline/with Drains (4). Total: 72 calculations,
four compatibility groups and four parsed scalar comparisons.

The independent verifier checks every row's applied supports, rarity flags,
Cull eligibility/thresholds, costs, recovery fields, unchanged damage/Poison,
resource rounding and separate leech arithmetic. All passed.

- Life 3287 gives native LifeOnKill 395. Mana 2541 gives zero Soul Drain output;
  the generic Mana control gives 305. PoB PercentStat rounds upward before the
  final output floor: ceil(3287 x .12), ceil(2541 x .12). These are model snapshot
  values, not universal game amounts or proof of actual recovery.
- Sixteen rows expose LifeOnKill 395 with canCull false, demonstrating the
  missing gate rather than validating such events.
- Cannot Gain Life and Cannot Recover Life other than from Leech zero displayed
  Life recovery. Cannot Gain Mana zeroes the generic Mana control, not a newly
  implemented Soul Drain event model. Missing-resource timelines are not tested.
- Added Drains leave the separately linked Life/Mana Leech values unchanged.
  Poisonburst's per-hit .861/.4305 and rates 1.0332/.5166 come from Physical
  hits and the separate Leech supports, not Drain recovery. Gas's corresponding
  values are .294/.147 and .3528/.1764. Drains alone have zero leech rates.
- Base Mana costs 38/62 remain unchanged, or 45/74 with Poison III. Poison III
  arrow Poison DPS 4.56577245/1.53831410 and no-hit source Poison
  5.38576622/4.00385418 do not improve from these Drains or Culling links.
- Gas Fire's Unique hit is lower under the explicit boss-resistance setup;
  that is a target configuration difference, not a Drain damage penalty.

Ignored evidence: `var/poison-bow-drain-20261110/` (driver, native JSON,
independent verifier, logs). Known frozen startup missing-node messages are
unrelated to these empty-tree component checks. No actual kill, Cull, health
or missing-resource event sequence is simulated.

## App Behavior and Coverage

Both supports have no suggested priorities. Previous support warnings, manual
weights, route scores, goals, budgets, shortest/manual routing and persistence
implementation remain unchanged. Regression fixtures cover scoped eligibility,
both recovery families, Culling tier replacement, other selected supports,
removal/restoration, saved-build/JSON round trips and unsupported-focus rejection.
There is no automatic priority action, enemy-state input or recovery-rate score.

107/567 raw choices (18.9%), 106/450 positive-tier (23.6%), 65 families and
604 reviewed pairs. Poisonburst offers 82 choices; Gas offers 84. Skills remain
103/399 (98/234 positive), preferences 184, wording 864/2182 and occurrences
3444/5451. Scoped heuristic/catalog coverage, not overall completion; no
coverage-baseline refresh.

## Validation

Focused regressions passed 376 tests in seven files, including seventeen new
pure tests and two UI cases.

`npm run validate:release` passed 3,480 tests in 164 files, typecheck,
production build, graph validation and unchanged coverage baseline in 82.641
seconds. The existing large-chunk advisory remains nonblocking (main 791.25 kB,
194.30 kB gzip); no unrelated performance refactor or data refresh.

The local production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`
matches the built JavaScript bytes. Edge smoke passed both 82/84-choice lists,
selection/removal/restoration, Culling I/II replacement, preserved earlier
support warnings, recovery mapping/component boundaries and unchanged manual
weights. No automatic support-priority action, event-state input or page errors.
Screenshot inspection confirmed readable notes and a rendered tree without
overlap. The final console had zero errors/warnings after reload; the existing
initial preview `/favicon.ico` 404 was inspected separately.

Browser evidence: `output/playwright/poison-bow-drain-20261110/`. Scoped
`git diff --check` passed. These are source/native/regression/browser checks,
not live-game tests or user visual acceptance. Preview remains available.
No commit, push or deployment.

## Next Proposed Batch

Review [Armour Break I/II/III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L198)
for both Poison bows. Separate Physical-hit Armour Break from Poison and
Corrosion; check conditional Exploit Weakness without assuming Fully Broken
Armour or Endurance Charge uptime. Proposal only, not implemented here.

Completed subsequently in the [Armour Break checkpoint](build-focus-poison-bow-armour-break.md).

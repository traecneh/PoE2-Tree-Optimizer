# Poison Bow Salvo Review

Reviewed 2026-11-09. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f and moving upstream generated support data. Only Poisonburst
Arrow and Gas Arrow are added as reviewed pairs, not all legal skills or Full DPS.

## Game Data and Eligibility

`SupportSalvoPlayer`, catalog tier 3, has families AdditionalProjectiles and
Seal. The generated constants specify a 1,000 ms base Seal interval, six maximum
Seals and one additional projectile per Seal broken. The skill gains Seals over
time and breaks them on use; projectiles fire in random directions. The cap is
capacity, not current Seals. Waiting, use and other modifiers matter; no full
cap per attack, six extra contacts or sevenfold damage is assumed.

It requires Attack AND Projectile and excludes proxy, Triggered, Persistent,
Cooldown, ComboStacking and pre-existing HasSeals types. Its own
SupportedBySalvo marker allows its own HasSeals application, not arbitrary
pre-existing Seals; it does not bypass the cooldown restriction. Both real
parents pass. Two native compatibility groups exercise missing Attack/missing
Projectile, each of the six exclusions, the self-marker and cooldown plus marker.

Salvo conflicts with either Multishot tier and Nova II through AdditionalProjectiles.
Nova II also supplies a cooldown. They are not a combined loadout: the app's
existing multi-family replacement removes conflicts in either selection order.
Nova I can coexist, but neither circular nor random geometry establishes contacts.
The Seal family also prevents another Seal-family choice; unreviewed supports
are not added to the allowlist. Loaded IDs retain first-valid-wins normalization;
clicks use newest-choice-wins. Removing Salvo does not restore replaced choices.

No added Mana multiplier, damage/speed penalty or cooldown. Other links keep
their effects and costs. Poisonburst's arrow and separately enabled arrow Poison
stay separate from the no-hit burst. Gas's ground-targeted arrows, no-hit cloud
Poison and conditional Fire explosion remain separate. No extra clouds, overlap,
ignition, detonation, Poison stacks or uptime are inferred from projectile count.

## Native Modeling Gap

The frozen runtime maps `base_maximum_seals_for_skill` to SealCount and
`base_skill_is_sealed_skill` to HasSeals. It does not map Salvo's
`base_skill_seal_gain_interval_ms`, `skill_additional_projectiles_per_seal_broken`
or random projectile delivery into the damage calculation. The generic Seal
calculation uses a cast-time-percent SealGainFrequency that Salvo does not supply.

Consequently the tested native output shows SealMax 6, SealCooldown 0 and
TimeMaxSeals 0, but still one projectile and one AverageBurstHits. DamageSeal
and AreaSeal flags are absent. Enabling `waitForMaxSeals` sets its configuration
flag but does not change these outputs or damage. Zero timing is missing
modeling, not instant gain; an unchanged damage number is not proof of no
in-game benefit. Do not borrow Unleash's repeat or max-Seals damage model.

The site explains this limit instead of adding Seal inputs, waiting assumptions
or fake projectile/DPS multipliers. Suggestions, exclusions, scopes, manual
weights, route scores, budgets and shortest routing stay unchanged.

Sources:
- [Salvo generated data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L5032)
- [Mapped Seal stats](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua#L2323)
- [Generic Seal calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L1139)
- [Native support-family resolution](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcSetup.lua#L502)

Moving links are not claimed byte-identical to the frozen runtime.

## Bounded Native and Independent Checks

40 MAIN calculations: empty level-90 Witch, level-20/quality-zero skills, normal
Physical Crude Bow (6-9), sufficient attributes, boss None, distance 20, enemy
Bleeding/Poisoned false. No installed PoB, user builds or runtime source changed.

Five components have baseline/Salvo rows. Additional contexts cover Efficiency
II, Poison III on the actual arrow, Rapid Attacks II, Nova I, Ricochet II,
Multishot II/Nova II conflicts in both link orders and max-Seals waiting on/off.
All intended surviving supports are checked as applied. Native conflict pairs
keep only the later support, never stacked penalties or combined projectiles.

| Native source Poison/s | Baseline | Salvo | Rapid II without/with Salvo |
| --- | ---: | ---: | ---: |
| Poisonburst burst | 5.385766 | 5.385766 | 5.635858 |
| Gas cloud | 4.003854 | 4.003854 | 4.170581 |

Mana is 38/62, Efficiency II 23/38, Poison III 45/74. Speed remains 1.2/s or
1.5/s with Rapid II, not faster Seal gain. Poison duration stays 3/2 seconds,
burst/cloud timers 3.003/4.026 and radii 24/18. Same-context native damage,
projectiles and other outputs match after removing the three Seal metadata
fields. These are checks of a partial native model, not measured gameplay.

Independent verification checks raw Seal constants/units, mapped versus missing
fields, weapon-source ranges, costs, Poison source-roll/critical-presence/active
fraction arithmetic, exact same-context outputs and family survivors. Evidence
is ignored under `var/poison-bow-salvo-20261109/`; source fixtures need no PoB/network.

## Coverage and Validation

One context-only choice, two reviewed pairs. Save/JSON state keeps the selected
ID, with no schema or UI-control change. Previous warnings and legal delivery
combinations remain intact; no automatic support-priority action.

87/567 raw choices (15.3%), 86/450 positive-tier (19.1%), 53 unique families,
566 pairs and 64 choices per Poison focus. Skills stay 103/399 (98/234 positive),
preferences 184, wording 864/2182 and occurrences 3444/5451. These are scoped
heuristic/review counts, not overall completion. No catalog/baseline refresh.

Independent verifier passed all 40 rows and two compatibility groups.
Focused regressions passed 321 tests in five files, including twelve new pure
tests and two UI cases.

`npm run validate:release` passed: 3,307 tests in 153 files, typecheck,
production build, graph validation and unchanged coverage baseline; 97.800
seconds. Existing large-chunk advisory remains nonblocking (main 765.75 kB,
189.82 kB gzip). No unrelated performance refactor or data refresh.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
the built bytes. Edge smoke passed both 64-choice lists, Seal-data/model-gap
notes, legal Nova I pairing, family replacement with both Multishot tiers and
Nova II in both selection directions, note removal/restoration, unchanged
manual weights, mixed-source caution and earlier support summaries. Removal
does not restore replaced choices. Screenshot inspection confirms readable
notes and a rendered tree without overlap. After reload the console had zero
errors/warnings and no page errors. Initial launch only had the existing
preview `/favicon.ico` 404, inspected separately.

Browser evidence: `output/playwright/poison-bow-salvo-20261109/`. These are
source/native/regression/browser checks, not in-game tests or user visual
acceptance. Nothing committed, pushed or deployed.

## Next Proposed Batch

Review Momentum for these focuses: movement during skill use versus global
Movement Speed, conditional damage, eligible Poison-source scaling and Mana
costs. Do not assume the movement condition or sustained uptime. Completed in
the subsequent [Momentum review](build-focus-poison-bow-momentum.md).

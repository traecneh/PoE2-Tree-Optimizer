# Poison Bow Rupture and Rusted Spikes Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f plus moving upstream sources. Four context-only pairs, not
an ailment-event timeline, Full DPS model or global support allowlist.

## Different Requirements, Not Poison Damage

| Choice | Effect ID | Catalog tier | Requirement | Added Mana multiplier |
| --- | --- | ---: | --- | ---: |
| Rupture | SupportRupturePlayer | 3 | Supported Hit against a Heavily Stunned enemy | None |
| Rusted Spikes (catalog review) | SupportRustedSpikesPlayer | 0 | This supported skill Pins the enemy | 10% |

Rusted Spikes is explicitly labeled catalog review: frozen and inspected
upstream Gems data list tier 0. Current game obtainability is unverified;
native eligibility is not evidence otherwise. It is not counted in positive-tier
coverage. This follows the existing Malady catalog-review convention.

Both Aggravate existing Bleeding, not Poison. Neither grants Bleeding chance,
Heavy Stun or Pin. Rupture requires Heavy Stun, not merely Stunned/Pinned.
An externally supplied Heavy Stun can qualify, but is not assumed. Rusted Spikes'
100% chance is conditional on this skill's Pin event, not chance to Pin, a new
Bleeding application, an already Pinned target or another source's Pin. A
Bleed must exist; its application, ownership and uptime are not supplied.

Initial Physical arrow Hits can apply Bleeding with a separately eligible
chance source. No-hit burst/cloud Poison cannot Hit or Pin; native synthetic
source-hit Bleeding is not real component Bleeding. Gas's separate Fire
detonation can Hit for Rupture's condition if Heavy Stun and existing Bleeding
are independently established. The reviewed fully converted Fire fixture
supplies no Physical Pin buildup for Rusted Spikes and no new Bleed. Detonation,
other damage/gear sources and extra contacts are not inferred.

Sources: [Rupture](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6419),
[Rusted Spikes](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6447),
[catalog availability entry](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua#L13766).
Moving references are not claimed byte-identical to frozen data.

## Pin, Stun and Native Coverage

With Pin I/II/III selected, the supported skill cannot Stun. Rupture cannot
self-supply its Heavy Stun that way, but can still Hit a target Heavily Stunned
by a separate source. It is not globally incompatible with Pin. Rusted Spikes
can use an eligible supported-skill Pin mechanism, but positive buildup and
a configured Pinned snapshot do not prove a new Pin event. Cannot Immobilise
Enemies still prevents that event. Reversible notes explain both distinctions;
the tier-zero availability warning remains first on Rusted Spikes.

Existing Stun notes still explain conversion of generic Stun Buildup to Pin,
not a second Heavy Stun benefit. Stun III's damage penalty and cost remain.
No Rupture/Rusted Spikes selection resets existing links or changes their notes.

Both support-specific aggravation stats lack mappings in reviewed PoB. Neither
selecting both supports nor configuring Heavy Stun/Pinned automatically sets
BleedAggravated. Unchanged native output is incomplete event coverage, not
evidence the game effects do nothing. Manual aggravated-Bleed inputs and the
parsed unconditional aggravated-Bleed scalar are separate positive controls,
not substitutes for the missing support events.

The reviewed model's moving-or-aggravated condition supplies one 100%-More
Bleeding factor. Moving alone, aggravated alone and both together give 2x,
not 4x. This is not another Poison modifier or automatic Poison III/Admixture
condition. No timing, aggravation frequency, threshold crossings or uptime
is modeled. Rupture adds no Mana multiplier; Rusted Spikes costs 10% more even
without a qualifying event. Other support costs remain.

[Stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua),
[moving/aggravated condition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcSetup.lua#L946).

## Native Checks and Independent Arithmetic

68 MAIN calculations use empty level-90 Witch builds, level-20/quality-zero
skills, a normal Physical Crude Bow, sufficient attributes, boss None and
explicit Heavy Stun/Pinned/moving/aggravated flags. Enemy Bleeding/Poisoned
flags stay false; links do not silently provide those conditions. No installed
PoB, saved user build or frozen runtime source changed.

Five components each have baseline, Rupture, Rusted Spikes, both, Bleed III
baseline/with both and Pin I baseline/with both (40). Per-parent arrows add
four Bleed/Pin/both-support condition snapshots, Cannot Immobilise, three
explicit moving/aggravated controls, one parsed aggravated-Bleed scalar,
Poison III baseline/with both, Pin/Stun III/Bleed baseline/with both, and
Efficiency II (14 each). Four compatibility groups accept required-type
fallbacks, reject missing types, and check Rusted Spikes' DegenOnlySpellDamage
exclusion. There are two independent parsed scalar controls.

All 68 rows passed independent checks of source stats, applied links, flags,
Pin's prohibition, rounded cost composition, unchanged hits/Poison/timers and
reconstructed Bleed/Poison arithmetic. Eight Heavy Stun/Pin combination rows
stay natively unaggravated. Twenty-four Pin-linked rows have zero direct
Heavy Stun buildup; Cannot Immobilise controls have zero Pin buildup. No
buildup value is translated into an event rate.

| Native actual-arrow field | Poisonburst | Gas |
| --- | ---: | ---: |
| Bleed III baseline and both supports, unaggravated Bleed/s | 4.49945885 | 1.46367938 |
| Manual aggravated, moving, or both Bleed/s | 8.99891769 | 2.92735877 |
| Base Mana / with Rusted Spikes | 38 / 41 | 62 / 68 |
| Both + Efficiency II Mana | 25 | 41 |
| Pin + Stun III + both Mana | 50 | 81 |

Poison III actual-arrow Poison stays 4.56577245/1.53831410. Inherent no-hit
Poison stays 5.38576622/4.00385418. Synthetic Bleed outputs for burst/cloud
are explicitly not credited as game Bleeding. Native independent arithmetic
uses stored Physical source ranges, per-ailment roll/crit selection, .15
Bleed/.20 Poison base coefficients and one selected Bleed factor. Mana factors
combine before rounding; Efficiency II applies separately after the cost floor.

Evidence: ignored `var/poison-bow-bleed-aggravation-20261110/` (driver, JSON,
independent verifier, logs). Known frozen startup missing-node notices are
retained. Source/native checks are not live-game application or uptime tests.

## Coverage and App Validation

115/567 choices (20.3%), 113/450 positive-tier (25.1%), 70 families and 620
reviewed pairs. Poisonburst/Gas offer 90/92 choices, including catalog-only
entries. Skills remain 103/399 (98/234 positive), preferences 184, wording
864/2182 and occurrences 3444/5451. No catalog refresh or baseline reset;
these are scoped heuristic counts, not overall completion. No automatic
priorities, route scores, parser scopes, point budgets or persistence changes.

Focused checks passed 392 tests in seven files, including twenty new pure
tests and two UI cases. One `npm run validate:release` passed 3,561 tests in
168 files, typecheck, production build, graph validation and unchanged coverage
baseline in 83.129 seconds. Existing large-chunk advisory remains nonblocking
(main 804.33 kB, 196.69 kB gzip); no unrelated performance refactor.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
built JavaScript bytes. Edge smoke passed both 90/92-choice lists, both choices'
selection/removal/restoration, tier-zero availability label, Heavy Stun versus
own-Pin requirements, reversible Pin notes, retained Stun prohibition and
unchanged earlier links/manual weights. No unexpected automatic priority action
or page errors. Screenshot inspection confirmed readable notes and a nonblank
tree without overlap. Final console: zero errors/warnings after reload; the
initial existing preview `/favicon.ico` 404 was inspected separately.

Browser artifacts: `output/playwright/poison-bow-bleed-aggravation-20261110/`.
Scoped `git diff --check` passed. These are source/native/local-app checks,
not live-game event/availability testing or user visual acceptance. Preview
remains available. No commit, push or deployment.

## Next Proposed Batch

Review [Deep Cuts I/II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2347)
for both Poison bows, checking Hit-only damage penalties against Bleeding
magnitude, separate Poison-source behavior and conditional aggravation.
No assumed applications or uptime. Proposal only, not implemented here.

Completed separately in [the Deep Cuts checkpoint](build-focus-poison-bow-deep-cuts.md).

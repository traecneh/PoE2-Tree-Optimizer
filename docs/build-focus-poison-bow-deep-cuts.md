# Poison Bow Deep Cuts Review

Reviewed 2026-11-10 against frozen native PoB 0.23.1/tree 0.5.5f, with moving
upstream data inspected separately. This is support-context coverage, not a
Full DPS calculator or live-game validation.

## Source and Scope

| Support | Effect ID | Catalog tier | Hit damage | Bleeding magnitude | Added Mana multiplier |
| --- | --- | ---: | ---: | ---: | ---: |
| Deep Cuts I | SupportDeepCutsPlayer | 3 | 25% less | 75% more | None |
| Deep Cuts II | SupportDeepCutsPlayerTwo | 5 | 30% less | 100% more | None |

Both share family DeepCuts. The native compatibility rule accepts Attack,
Damage or CrossbowAmmoSkill, and both parent skills qualify. Negative controls
remove all three alternatives; each individual alternative is also checked.
Positive catalog tiers are not an independently verified live availability list.
Hit Damage MORE is Hit-flagged; AilmentMagnitude MORE is Bleed-keyword-only.

Sources: [Deep Cuts I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2347),
[Deep Cuts II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2386),
[native offence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
Frozen extraction lives under `var/pob-evaluation-spike-20261106/runtime`.

## Component Boundaries

Deep Cuts supplies no Bleeding chance. Eligible Physical initial-arrow hits
need a separate source, such as reviewed Bleed III. The Poisonburst burst
and Gas cloud do not Hit or inflict hit-based Bleeding. PoB's synthetic
source-hit/Bleed fields for these components are not proof of actual Bleeding.
The reviewed fully Fire-converted Gas detonation has no Physical Bleed source;
detonation is conditional and is not supplied by this support.

The native hit penalty also reduces stored weapon-derived Poison-source damage,
including the no-hit burst/cloud calculation. The Bleeding magnitude bonus
does not increase Poison magnitude or compensate that penalty. This observed
PoB behavior is not an independent live-game DPS measurement. Stage rounding
means final values do not equal a naive percentage of already-rounded output.

Poison III's separate arrow Poison remains penalized. Its enemy-Bleeding
condition is not supplied. Deadly Poison II's Poison magnitude and own hit
penalty remain separate; adding Deep Cuts still lowers Poison in that pairing.
Deep Cuts does not Aggravate Bleeding, Heavy Stun or Pin. Explicitly configured
aggravation is only a separate scalar control, not proof of Rupture/Rusted
Spikes events. No extra contacts, stacks, sustained ailments or event uptime.

## Independent Native Checks

Ignored artifacts: `var/poison-bow-deep-cuts-20261110/review.lua`, `native.json`,
`verify.mjs` and `native-run.log`. Driver asserts MAIN/effective player ownership,
Bow equipment, active stat-set identity and exact applied support count.
An empty level-90 Witch, normal 6-9 Physical Crude Bow, level-20 zero-quality
skills, level-1 supports and nonboss target isolate the arithmetic. Large
attributes meet requirements without spending passive points. Enemy Bleeding,
Poisoned and Dazed are explicitly false. No saved build is modified.

66 calculations cover five components, both tiers, no-Bleed/with-Bleed cases,
hit-only and magnitude-only controls, combined parsed scalar controls,
manual aggravation, Poison III and Deadly Poison II. Four compatibility groups
plus missing-type and individual fallback controls pass.

Selected native observations (baseline / I / II):

| Quantity | Poisonburst Arrow | Gas Arrow |
| --- | --- | --- |
| Arrow AverageHit | 5.38125 / 3.9375 / 3.80625 | 1.8375 / 1.3125 / 1.3125 |
| Arrow Bleed/s, with Bleed III | 4.499459 / 5.692086 / 6.179980 | 1.463679 / 1.897362 / 2.168414 |
| No-hit component Poison/s | 5.385766 / 3.902140 / 3.719227 | 4.003854 / 3.019300 / 2.796134 |
| Arrow Poison/s, with Poison III | 4.565772 / 3.329502 / 3.203065 | 1.538314 / 1.109834 / 1.109834 |
| No-hit Poison/s, with Deadly Poison II | 7.438454 / 5.670297 / 5.202853 | 5.592268 / 4.069491 / 3.938217 |
| Mana cost, no other cost support | 38 / 38 / 38 | 62 / 62 / 62 |

The verifier independently reconstructs Bleed with 0.15 and Poison with 0.20
of their stored Physical source, application-potential roll and crit weighting.
For these fixtures, potential = speed * duration * chance/100,
roll = potential/(potential+1), crit presence = 1 - 0.95^potential.
Magnitude is 1.75/2 for Bleed and stays 1 for Poison (2 with Deadly II).
Hit-only controls match stored-source penalties; magnitude-only controls leave
Poison unchanged. Combined scalar controls match actual linked Deep Cuts.
Explicit aggravation doubles only the selected Bleed control. Costs from other
supports remain: Poison III costs floor(base * 1.2), or 45/74. Speed, skill
duration, radius, Poison duration and stack capacity remain unchanged.

## App Changes and Validation

Two choices/four pairs, scoped to these two focuses, use the existing tier
replacement, settings normalization and saved-build transfer APIs. Selecting
them preserves earlier warning text and manual weights. No automatic priorities,
route-score multipliers, parser scopes, optimizer logic or persistence format
changes. Earlier Pin/Rupture/Rusted and Stun warnings remain intact.

Coverage is 117/567 support choices (20.6%), 115/450 positive-tier choices
(25.6%), 71 families and 624 reviewed pairs. Poisonburst/Gas offer 92/94
choices. Skill presets, stat wording/occurrence counts and the baseline stay
unchanged. These are scoped review counts, not full-mechanics completion.

Fourteen new pure tests and two UI cases cover independent frozen arithmetic,
metadata/warnings, no automatic scoring, same-family replacement, retained peers,
normalization, export/import, removal, disabled controls and scope rejection.
The initial focused run exposed a test expectation that incorrectly assumed
normalization kept the last conflicting tier; existing normalization keeps the
first, while explicit selection replaces it. The fixture expectation was fixed,
not production behavior. A transient array-spread syntax error was also fixed
before final validation.

`node var/poison-bow-deep-cuts-20261110/verify.mjs` passed all 66 native
calculations and four compatibility groups. One final `npm run validate:release`
passed 3,577 tests in 169 files, typecheck, production build, graph validation
and unchanged coverage baseline in 86.417 seconds. Existing large-chunk advisory
remains nonblocking (main 807.10 kB, 197.15 kB gzip); no unrelated refactor.

The production preview at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` serves
JavaScript byte-identical to the new dist asset. Edge smoke passed both 92/94
choice lists, both tiers' notes/replacement, removal/restoration, retained
earlier warnings and manual priorities, and no unexpected priority action.
Zero page errors and zero final console errors/warnings after reload. The
initial existing `/favicon.ico` 404 was inspected separately. Screenshot review
confirmed a nonblank tree and readable notes without overlap. Artifacts:
`output/playwright/poison-bow-deep-cuts-20261110/`.

Scoped `git diff --check` passed. Source/native/local-app checks are not
live-game validation, complete-build DPS or user visual acceptance. Preview
remains available. No commit, push or deployment.

## Next Proposed Batch

Review Brutality I/II/III for both Poison bows: Physical hit/Bleeding scaling
versus preventing Poison's Chaos damage and Gas's conditional Fire damage,
costs and Tier III's hit-only Physical reduction bypass. Reuse the existing
family, but do not assume Poison compatibility from the shared Physical source.
Proposal only; not implemented in this batch. No push or deployment.

Completed separately in [the Brutality checkpoint](build-focus-poison-bow-brutality.md).

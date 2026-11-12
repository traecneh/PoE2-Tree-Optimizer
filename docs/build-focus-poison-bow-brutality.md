# Poison Bow Brutality Review

Reviewed 2026-11-10 against frozen native PoB 0.23.1/tree 0.5.5f and separately
inspected moving upstream data. This adds context/suggestion warnings, not
complete-build DPS, live-game validation or a recommended Poison loadout.

## Source and Scope

| Support | Effect ID | Catalog tier | More Physical Damage | Hit chance to ignore Physical Damage Reduction | Added Mana multiplier |
| --- | --- | ---: | ---: | ---: | ---: |
| Brutality I | SupportBrutalityPlayer | 1 | 25% | None | 20% |
| Brutality II | SupportBrutalityPlayerTwo | 2 | 30% | None | 20% |
| Brutality III | SupportBrutalityPlayerThree | 5 | 30% | 20% | 20% |

All share the existing Brutality family and prohibit Chaos and all Elemental
damage. PhysicalDamage MORE is separate from a Bleeding-magnitude modifier;
Tier III's chance maps to ChanceToIgnoreEnemyPhysicalDamageReduction. Both
bow parents qualify through Attack/Damage. Six compatibility groups check
the Damage, Attack, DamageOverTime and CrossbowAmmoSkill alternatives separately
and reject missing alternatives. Positive catalog tiers are not independent
proof of current live availability.

Sources: [Brutality I](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1216),
[II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1253),
[III](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1290),
[skill stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua),
[offence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
The frozen runtime remains under `var/pob-evaluation-spike-20261106/runtime`.

## Component and Preference Policy

The burst/cloud's inherent Poison is disabled, even when its stored source
is Physical and the displayed source-hit field rises. Poison III, Deadly
Poison, added Chaos and Poison magnitude do not bypass the prohibition.
Poison applied by other skills is separate; no Poison-feeding setup is assumed.

Actual initial-arrow Physical hits and eligible Bleeding from them can improve.
Brutality grants no Bleeding chance, Bleeding magnitude or aggravation. The
non-hitting burst/cloud cannot inflict hit-based Bleeding; synthetic source-hit
and Bleed fields are not real applications. Deep Cuts' hit penalty and Bleeding
magnitude remain separate. No contact count, ailment uptime or critical uptime.

The reviewed Gas detonation fully converts Physical to Fire. With Fire damage
prohibited it deals zero damage in that setup, rather than reverting to Physical.
Detonation, other damage sources and conversion overrides are not supplied.
No global player/minion prohibition is inferred from this supported-skill rule.

The warning starts with the disabled Poison focus, not the favorable Physical
number. Existing manual preferences still score as before: they may serve another
skill, so they are retained with explicit cautions rather than silently removed.
There is no automatic switch to an arrow-hit/Bleeding focus or damage multiplier.

Suppressed suggestions are Poison Magnitude/Duration and the four suggestions
targeting the disabled Poison source (Attack/Physical/Projectile/Attack Area
Damage). Poison chance and Elemental/Chaos damage/penetration receive specific
prohibition cautions. Poisonburst's skill-duration suggestion is also suppressed
because it extended this disabled Poison. Gas's cloud lifetime, coverage and
deployment suggestions remain utility only, not restored Poison or Fire damage.
Removing the support restores the original suggestions. Add suggestions cannot
reintroduce the suppressed effects. Old manual weights are never deleted.

The three existing entries gain only the two new skill overrides; older caster
and Plant summaries, exclusions, priorities and applicability remain unchanged.
Tier replacement, disabled controls, normalization and export/import reuse
existing APIs. No parser, scoring, solver or persistence-format changes.

## Native and Independent Checks

Artifacts: `var/poison-bow-brutality-20261110/review.lua`, `native.json`,
`verify.mjs`, `native-run.log`. The isolated MAIN/effective player fixture is an
empty level-90 Witch with a normal 6-9 Physical Crude Bow, sufficient attributes,
level-20 zero-quality skills and level-1 supports. Actor, Bow, selected stat-set
and applied support count are asserted. Enemy Bleeding/Poisoned/Dazed are false.
No user's saved build or runtime source is modified.

66 calculations cover five components, all tiers, separate Bleed III controls,
Poison III, Deadly Poison II, added Fire/Cold/Lightning/Chaos, Deep Cuts II,
Efficiency II and explicit Tier III minimum/average/maximum mitigation controls.
The independent verifier reconstructs per-Bleed output from the stored Physical
range, 0.15 coefficient, application-potential roll and crit weighting; Brutality
does not multiply BleedMagnitudeEffect (1 normally, 2 only with Deep Cuts II).
As in preceding checkpoints, these source/per-ailment fields are not Full DPS.

Selected native observations (baseline / I / II / III):

| Quantity | Poisonburst Arrow | Gas Arrow |
| --- | --- | --- |
| Arrow AverageHit, default Armour | 5.38125 / 6.825 / 6.95625 / 11.13 | 1.8375 / 2.3625 / 2.3625 / 3.78 |
| Arrow BleedDPS field, Bleed III | 4.499459 / 5.610771 / 5.773402 / 5.773402 | 1.463679 / 1.978678 / 1.978678 / 1.978678 |
| No-hit component PoisonDPS field | 5.385766 / 0 / 0 / 0 | 4.003854 / 0 / 0 / 0 |
| Parent Mana, without other cost supports | 38 / 45 / 45 / 45 | 62 / 74 / 74 / 74 |

Zero here includes absent native Poison output when prohibited. Both Physical
source values and damage flags are checked, not just displayed zeros. Added
Fire/Cold/Lightning/Chaos controls have nonzero baseline hits and all vanish with
Brutality III; all tiers' prohibition flags are asserted across components.
Gas's base Fire detonation AverageHit 22.05 becomes zero for every tier.

For the zero-Armour, 50% additional PDR control, Tier III's minimum/average/maximum
AverageHit is 13.9125/16.695/27.825 for Poisonburst's arrow and 4.725/5.67/9.45
for Gas's arrow. Independently: raw = mean(stored range) * 1.05; damage factor
= 1 - 0.5 * (1 - ignoreChance), with ignoreChance 0/0.2/1 for the three modes.
Tier II equals Tier III's minimum. Stored source and Bleed output stay identical
between II and III, so no mitigation bypass is credited to Bleeding or Poison.
This is a controlled hit estimate, not guaranteed proc frequency or a universal
20% more DPS bonus. Rounding also prevents naive final-output multipliers.

Brutality's 20% Mana factor remains even with Poison disabled. With Poison III,
floor(base * 1.2 * 1.2) is 54/89; Efficiency II then yields 33/54, not a refund
for unusable Poison. Without Poison III, Efficiency II yields 27/45. Speed,
skill duration and area radius remain unchanged. No duration or extra stacks
are claimed from the increased Physical source.

## Coverage and Validation

Six new reviewed pairs bring the total to 630. Choices remain 117/567 (20.6%),
positive-tier choices 115/450 (25.6%) and families 71 because these three tiers
already existed. Poisonburst/Gas now offer 95/97 reviewed choices. Skill presets,
passive wording/occurrences and the baseline are not refreshed. This is scoped
heuristic coverage, not overall completion.

Sixteen new pure tests and two UI cases cover independent frozen arithmetic,
component/prohibition notes, tier replacement, no automatic score changes,
suppressed suggestions, retained manual priorities, reversible removal,
normalization, export/import and unchanged older skill overrides. Existing
negative fixtures now reject nonexistent Brutality IV, not newly reviewed I.
Focused node checks passed 186 tests in five files; the UI file passed 218.
A test-only concat type-inference error was fixed by projecting the expected
choice list to its id/name fields; production behavior was unchanged by that fix.

`node var/poison-bow-brutality-20261110/verify.mjs` passed all 66 native
calculations and six compatibility groups. One final `npm run validate:release`
passed 3,595 tests in 170 files, typecheck, production build, graph validation
and unchanged coverage baseline in 111.101 seconds. Existing large-chunk advisory
remains nonblocking (main 809.74 kB, 197.70 kB gzip); no unrelated refactor.

The production preview at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` serves
JavaScript byte-identical to the current dist asset. Edge smoke passed both
95/97-choice lists, all three tiers, replacement/removal/restoration, prominent
Poison/Fire prohibitions, no lost peer warnings/manual priorities, no automatic
priority command and Add suggestions not reviving the suppressed effects.
Zero page errors and zero final console errors/warnings after reload. The initial
existing `/favicon.ico` 404 was inspected separately. Screenshot inspection
confirmed a nonblank tree, readable notes and no overlap. Browser artifacts:
`output/playwright/poison-bow-brutality-20261110/`.

Scoped `git diff --check` passed. These are source/native/local-app checks, not
live-game testing, complete-build DPS or user visual acceptance. The local
preview remains available. No commit, push or deployment.

## Next Proposed Batch

Review Projectile Deceleration I/II for both bows, separating slower arrow
delivery from Poison damage, cloud lifetime, contacts and overlap. Check
FixedSpeedProjectile exclusion and replacement against Projectile Acceleration's
shared family. No damage/extra-contact benefit should be assumed from slower
travel. Proposal only; not implemented here. No push or deployment.

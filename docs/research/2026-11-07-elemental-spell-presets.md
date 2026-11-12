# Ten Reviewed Elemental Spell Presets

Reviewed 2026-11-07 against the isolated PoB 0.23.1 runtime and official upstream
skill/gem sources. The planned eight candidates were extended with Flameblast
and Frost Wall, which reuse verified area-hit scopes. No shortest algorithm,
graph/assets, support allowlist, saved-build schema or effect parser changed.
Existing preset entries and saved/manual priorities remain unchanged.

## Scope Decisions

Every preset targets base damaging hits. Spell Damage/type damage/Elemental
Damage and convenience/coverage priorities reuse the established heuristic
conventions, not measured DPS weights. Selecting a focus does not add effects;
the user must select them or use Add suggestions. Existing weights and goals
are preserved. Critical chance remains manual, though all ten have a reviewed
spell-critical scope based on native damaging spell flags and positive base crit.

| Preset | Reviewed component | Important limits |
| --- | --- | --- |
| Arc | Chaining lightning spell hit with explicit projectile damage flags | No area scope or assumed projectile-speed benefit; chains/Infusion not simulated |
| Ball Lightning | Base lightning bolts, with explicit projectile and area-damage flags | Ball itself does not hit; no speed/duration suggestion; dwell/interval and infused ground excluded |
| Frostbolt | Cold projectile and terrain-collision explosion | Area damage is explosion-only; explicit projectile lifetime supports duration despite no Duration gem tag |
| Ice Nova | Cold area nova hit | Frostbolt changes origin, not projectile damage; infused ground duration excluded |
| Comet | Base cold area impact | Fixed added cast/fall times and conditional fire component excluded from throughput claims |
| Firestorm | Base fire area bolts and storm uptime | No projectile flags; duration/area do not promise more single-target hits; one-storm limit and infused elements unmodeled |
| Eye of Winter | Cold projectile shard hits | Non-hitting Eye, first-hit bonus, cooldown and trajectory interactions are not total DPS; no area or speed scope |
| Frost Bomb | Cold detonation | Exposure pulses are not damaging hits; delay/cooldown, exposure buildup and duration benefits not assumed |
| Flameblast | Fire channel-release area hit | No guaranteed stage count; minimum channel time, release animation and cooldown unmodeled |
| Frost Wall | Base cold crystal explosions | Requires destruction; wall Life, early-destruction penalty, cooldown and infused lightning not scored |

Eight presets enable spell Area of Effect and Spell Area Damage: all except Arc
and Eye of Winter. Frostbolt enables spell-projectile speed; the other nine do
not gain that scope in this batch. Ball/Eye speed is trajectory-sensitive; Arc's
projectile damage flag alone does not establish travel-speed benefit. Generic
manual preferences still behave as before and cautions do not delete them.

Increased/reduced passive lines retain existing signs and units. Ruin's -10 area
and +35 spell-area damage produce independent -1 and +3.5 Normal contributions,
not one favorable combined bonus. Shared/base nodes and point budgets retain
existing behavior. There is no automatic critical/penetration/ailment suggestion
or assumed conversion/Infusion uptime. Fireball's Concentrated Area hold remains.

## Evidence and Independent Checks

References: official [active spell data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
[gem identities/tags](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua),
and [offence timing](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
These moving references are not claimed byte-identical to the local snapshot.
Local `Data/Skills/act_int.lua` SHA-256:
`5b42b006be62d02f428fa03dbcd94bc9385041e502dc0bfc0640ff1a2aa430ac`.

The isolated native export captured identities, exact tag sets, skill types,
base flags, stat sets and timing/constants for all ten candidates. Forty native
assertions checked relevant components, area flags plus `is_area_damage`,
projectile ownership, critical eligibility, durations, fixed intervals, cooldowns
and Frost Wall's negative early-destruction modifier. A separate TypeScript
comparison matched every implemented identity/tag set/scope to that export.
These are component/data checks, not a character-performance evaluation.

For Comet, native SkillStatMap maps the extra millisecond stat to TotalCastTime;
CalcOffence adds it after dividing base time by cast-speed modifiers. Independently,
a synthetic one-second base plus one-second fixed addition takes two seconds
at no increase and 1/2 + 1 = 1.5 seconds at +100% cast speed, not one second.
Fall delay is separate and is not added into a claimed steady-state DPS formula.

No installed PoB profile/build was edited. The isolated runtime's existing
missing-node startup messages did not prevent the checks. Export/probe artifacts
are local under `var/spell-preset-batch-20261107/` and are not required by normal
fresh-checkout tests.

## Validation and Coverage

- Focused preset/control checks passed 86 tests before integration expansion.
- Final `validate:quick` passed 663 tests in 15 files, typecheck and the old baseline.
- An earlier quick run exposed the old test assumption that every preset must
  already have a support allowlist. It now explicitly expects these ten to have
  none, protecting the original supported combinations instead of inventing new
  compatibility. A test-only TypeScript access to an extra goal field was also
  corrected; neither issue required a production compatibility change.
- Parameterized parser/route tests cover crit scope for all ten, signed area
  tradeoffs for all eight area focuses, selected/unselected preferences, manual
  fallback, Frostbolt-only scoped speed, preserved goals/budgets and shortest mode.
- Controls, save/load and JSON-transfer tests cover every new focus without
  silently adding suggestions or overwriting manual priorities. No new support
  combinations are admitted, including Fireball with Concentrated Area.
- Edge smoke: selected Frostbolt, explicitly applied nine suggestions, inspected
  updated area tooltips at 1100x760 and 390x844, then changed to Ball Lightning.
  All nine choices remained and its speed/duration cautions appeared. Tooltip
  bounds fit both viewports, with no horizontal overflow. Only the existing
  favicon 404 appeared; no application console error/warning was observed.
- Browser screenshots: `output/playwright/spell-batch-desktop.png` and
  `output/playwright/spell-batch-mobile.png`. Isolated QA browser was closed;
  the existing local dev server remains available.
- Final `validate:release` passed 980 tests in 59 files, typecheck, production
  build, graph validation and refreshed baseline. No final validation failed.
  No real-character Full DPS audit, cross-browser matrix or repeated browser
  save/load matrix was run.

Before/after: skill presets 14/399 (3.5%) -> 24/399 (6.0%); positive-tier skills
14/234 -> 24/234 (10.3%). Supports remain 14/567 (11 families, 44 reviewed pairs).
Preferences remain 59. Distinct wording stays 440/2,182 (20.2%); main-tree stat
occurrences stay 2,349/5,451 (43.1%). Reusing already-covered scopes does not
increase union wording coverage. No old focus loses covered wording; the ten new
contexts are explicitly reviewed before refreshing the baseline.

Remaining: 375 unconfigured skill entries, 553 unconfigured support entries,
1,742 unrecognized wordings and 3,102 occurrences. Five configured supports
remain context-only/partial. Component exclusions and deeper-state/gear work
remain visible; these counts are not a claim of full gem mechanics support.

Next larger batch: native compatibility/refinement review for four to six
casting/projectile support families across the ten new spells, retaining the
explicit Fireball Concentrated Area hold. No commit, push or deployment made.

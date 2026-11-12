# Fire and Lightning Spell Focuses

Eight presets extend the existing Skill selector. Selecting a skill does not
silently change goals, allocation, manual priorities or point budgets. Suggestions
still require explicit application. Saved/exported builds retain the stable skill
IDs. No change to the Shortest solver, point costs, weapon branches or scoring
parser is needed. No additional supports are advertised without their own review.

## Component Boundaries

| Skill | Reviewed focus | Deliberate limits |
| --- | --- | --- |
| Ember Fusillade | Base Fire projectiles and explosions; explosion-only area damage | Recasting resets a 1300 ms release delay; duration is not automatically beneficial. Travel speed is not storage/release speed. Infused Lightning beams, stored Ember damage ramp and overlaps are not simulated. |
| Living Bomb | Conditional Fire spell explosion | Planting is not an explosion. Damage/death activation, the 15-second seed window and Infusion Remnants are not continuous DPS. The generated catalog has a positive-tier gem ID with a trailing `Player`; active-skill metadata also marks it `fromItem`. Catalog membership is not proof of obtainable-gem status. |
| Incinerate | Conservative base Fire burning | Fire, Elemental and DoT priorities; coverage is utility. Do not promote native hit/critical fields into burning scaling. No fuel cycle, 250 ms stage-ramp simulation, compounding Ignite model or infusion-only ground. Cast speed and generic duration are not assumed to improve those mechanics. |
| Flame Wall | Conservative wall burning | Lifetime and placement utility are separate from burning rate. Damage granted to passing player/allied projectiles and infused Lightning are not scored as the wall's own projectile or critical damage. |
| Orb of Storms | Chaining Lightning spell hits | AoE affects targeting, not area damage. Placement, 12-second lifetime, 4000 ms base bolt interval and six-hit limit remain distinct. Extra triggers, hit counts and Infusions are not simulated. |
| Lightning Conduit | Lightning strikes | No area-damage scope from targeting radius alone. Eight-second cooldown and scalable casting are separate from fixed added 1000 ms. Cannot Shock itself; external Shock setup/consumption is not modeled. |
| Lightning Warp | Conditional Lightning area explosion | Culling/target availability is required. Targeting Ball Lightning does not make the explosion projectile damage. Debuff and ground duration are not an explosion-hit multiplier. |
| Thunderstorm | Lightning area strikes | Placement, 12-second lifetime and coverage are separate from 350 ms strikes and 500 ms hit prevention. No guaranteed overlaps, Drenched/Freeze benefits, Plant growth or extra enemy contacts. |

Spell Critical Chance/Bonus and spell-hit Hinder are opt-in scopes for the six
hit focuses, not automatically suggested effects. The two burning focuses retain
their Spell tags but do not opt into these hit scopes or Spell Area Damage.
Existing manual effects remain selected, including generic effects outside the
new focus; existing warnings describe those mismatches rather than deleting user
choices. A warning is not a promise that the generic parser suppresses the score.

In particular, Fire/Elemental, Spell, Projectile, Area and DoT are separate modifier
categories. A stat line is not copied into every category matching a gem tag.
Reductions retain their negative signs. Ownership and conditional wording remain
subject to the existing strict parser. Weights are heuristic priorities, not
damage multipliers, actual skill throughput or PoB Full DPS.

## Tag Example: Entangle

Follow-up: Entangle is now available in the separately reviewed
[Plant batch](build-focus-plant-skills.md). The notes below describe the boundary
at the time of the eight-spell batch, not its current catalog status.

Entangle was inspected as the user's example, not added as a ninth preset. Its
generated tags include Spell, AoE, Sustained, Physical, Duration, Repeatable and
Plant. The reviewed metadata separates Physical fissure hits with area damage
from vine hits without area-damage flags. The base cast time is 0.9 seconds and
the native critical-chance field is 10%; these are inputs for a future component
review, not independent passive bonuses to add to a route score.

Spell/Physical damage, area coverage versus area damage, cast speed, hit-critical
eligibility, vine/fissure duration and Plant-specific wording need individual
checks. Sustained/Repeatable are capabilities, not universal power multipliers.
Plant/growth states and all supports are not automatically enabled. This batch
does not claim every Plant passive or every Entangle interaction is supported.

## Source and Evidence

Identity, tags, component flags, timings and conditional stats were exported from
the marked isolated PoB 0.23.1 runtime into
`var/fire-lightning-spells-20261108/metadata.json`. The user's installed PoB was
not edited. A bounded 32-case synthetic modifier check is retained alongside it
as `calculations.json`; this is component verification, not another route-quality
research audit.

For the two burning skills, native Fire DoT increased by 20% with +20% Fire Damage
or +20% Damage over Time, but not with +20% Spell Damage, Area Damage, Cast Speed
or +100% spell-critical chance. Native hit outputs still exist; these do not
establish that the game's burning effect should receive those hit modifiers.
The conservative focus does not promise to model every alternate component.

Ordinary tests use frozen independent facts in
`src/tree/fireLightningSkills.fixtures.ts`, not a local PoB installation, network
access or the production preset array as their expected data. Regressions cover
identity, tags, scoped modifiers/reductions, owners, fixed timing explanations,
manual settings, saved JSON, bounded weighted routes and unchanged Shortest.

- [Generated Intelligence spell definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua)
- [Thunderstorm and Entangle definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua)

The upstream `dev` branch is a moving reference, not a claimed byte-identical
snapshot of the isolated source or a guarantee about a later game patch.

The catalog now has 95/399 raw skill IDs (23.8%), including 90/234 positive-tier
entries (38.5%). Support coverage remains 38 choices / 24 families / 370 reviewed
pairs. Main-tree wording coverage stays 863/2182 and occurrences 3436/5451; no
parser family was added. These are scoped catalog counts, not overall completion.

## Next Proposed Batch

Review Entangle, Briarpatch, Thrashing Vines and Toxic Domain together. Separate
player hits from DoT, damaging area from targeting radius, growth/wet/overgrown
conditions from unconditional Plant modifiers, and timers from damage rate.
Only add reviewed passive wording and support combinations. This remains a
proposal, not authorization to implement that batch or deploy this one.

## Verification

`npm run validate:release` passed 2493 tests across 109 files, typecheck, production
build, graph validation and the coverage baseline. Edge and Firefox production-
preview smoke checks exercised all eight selections, no automatic weight/support
application, manual preference preservation, weighted preview/apply, burning-focus
warnings and saved-build load/reload. Both applied the 14-point smoke route and
reported zero application console errors or warnings at completion.

Logs are in `var/fire-lightning-spells-20261108/`; inspected screenshots and the
repeatable browser script are in `output/playwright/fire-lightning-spells-20261108/`.
The initial Edge script used an abbreviated cooldown selector label; correcting
the automation to the actual accessible label resolved that test timeout without
an application change. The existing large-bundle advisory remains non-blocking
(656.09 kB main chunk). No benchmark corpus, route-quality audit, commit, push or
GitHub Pages deployment was performed for this batch. Local preview remains at
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

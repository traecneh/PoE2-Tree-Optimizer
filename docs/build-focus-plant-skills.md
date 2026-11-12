# Plant Build Focuses

Entangle, Briarpatch, Thrashing Vines and Toxic Domain extend the existing Skill
selector. Add suggestions is explicit, existing goals/weights/budgets are
preserved, and saved/exported builds retain all four IDs and Plant Damage weights.
Shortest routing, point costs, weapon branches and the search engine are unchanged.

## Plant-Specific Matching

The new Plant Damage preference recognizes only full unconditional lines of the
form `12% increased Damage with Plant Skills`, including signed reductions,
decimal values, zero and normalized whitespace/case. It requires one of these
four explicitly reviewed damaging focuses. A Plant tag or a passive's name alone
does not activate the scope for another skill.

A Plant line scores once in Plant Damage, never again as Generic Damage, Spell
Damage, Attack Damage, Physical Damage, Area Damage or DoT. Separate generic and
actor-specific lines still contribute only to their own selected preferences.
Plants do not receive Minion/Companion modifiers. Ownership, conditional suffixes,
composites, malformed numbers and unreviewed more/less modifiers are rejected.

Eight main-tree nodes have the reviewed 12% wording: 12189, 16721, 18270, 20848,
32239, 32859, 34187 and 56547. Each contributes 12 / 10 * priority in heuristic
score units, not 12% more build DPS. The preference tooltip explains the limits.

The following remain deliberately unscored:

- Return to Nature: Armour Break requires Overgrown Plants and application.
- Boundless Growth: immediate Overgrowth chance needs growth-state benefits.
- Splitting Ground: additional fissures need counts, limits and contact behavior.
- Proliferating Weeds: an increased fissure limit is not guaranteed damage.
- Wildsurge Incantation: more damage, less cost and much less duration must be
  evaluated together; none is flattened into a favorable increased-damage line.

These may still be required goals. This batch does not claim to evaluate all
effects of any route containing them or all Plant-specific mechanics.

## Components

| Focus | Reviewed components | Deliberate limits |
| --- | --- | --- |
| Entangle | Physical fissure and attached-vine spell hits | Area damage targets fissures only; vines have no native area-damage flag. Eight-second fissure uptime, 100 ms vine application, vine duration, stack/slow limits, extra fissures and Overgrown conditions are separate. |
| Briarpatch | Physical Thorny Ground spell hits | Attacks supply stored Physical damage; another spell creates ground, and enemies must move. No assumed full storage, Thorns transfer, contact count, reservation benefit or creation cadence. Zero cast time does not earn a Cast Speed suggestion. |
| Thrashing Vines | Physical area spell hits | Vines are not attacks or projectiles. Cast action, spawning at 50% of cast time, minimum channel time, retarget cooldown, lifetime and random contacts are not one linear DPS multiplier. Overgrown damage/area bonuses are not assumed. |
| Toxic Domain | Attack-based Pustule area explosion, not non-damaging Toxic Bloom | A projectile attack supplies a Pustule but the explosion has no projectile flag. No weapon choice is assumed. Stored Poison, growth/Overgrowth, detonation time and Poison damage are outside the explosion focus. The Chaos tag does not earn an unconditional Chaos Damage suggestion. |

Toxic Domain's native `NoAttackOrCastTime` type takes precedence over its generic
cast-time field for action-speed suggestions. Cooldown Recovery affects the
11-second skill cooldown, not the 15-second detonation delay or eight-second Bloom
lifetime. Bloom's Life regeneration and increased skill costs are not damage.

Spell/Attack Critical Chance and Critical Damage Bonus remain opt-in, not preset
defaults. Spell-hit Hinder is reviewed only for the three spell focuses. New
support combinations are not guessed from Plant, Persistent, Sustained or
Repeatable tags. A subsequent [support review](build-focus-plant-supports.md)
now offers Magnified Area I/II, Prolonged Duration I/II and Brutality I/II/III,
with component-specific notes and additional Poison conflict warnings.

## Evidence and Limits

The marked isolated PoB 0.23.1 runtime provided native gem IDs/tags, component
flags, timings and condition stats. No installed PoB, saved build or game files
were edited. Metadata and 42 bounded native component modifier cases are retained
under `var/plant-skills-20261108/`; this was not a route-quality research audit.

For Entangle's fissures/vines and Thrashing Vines, +20% Plant Damage produced the
same native hit output as +20% Generic Damage. Reductions lowered it, Spell
Damage applied and Attack Damage did not. Area Damage applied to fissures/slams
but not attached vines. Mitigation/rounding means final-hit ratios are not
necessarily exactly 1.2. These are scope checks, not a full-build DPS benchmark.

The naked native Briarpatch case has no supplied stored damage and produces zero;
the naked Toxic Domain case lacks a compatible equipped weapon and also produces
zero. Those zero outputs are not proof of modifier applicability. Their reviewed
scopes follow the generated spell/attack/area and Plant metadata plus the native
Plant SkillType parser. The application intentionally does not invent stored
damage, gear, targets or complete throughput to turn those into DPS results.

Independent frozen regression data is in `src/tree/plantSkills.fixtures.ts`.
Ordinary tests require no local PoB or network. Tests cover actual tree matches,
source/category separation, exclusions, signed values, existing preferences,
saved/exported builds, small weighted detours and unchanged Shortest results.

- [Entangle, Briarpatch and Thrashing Vines generated data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua)
- [Toxic Domain generated data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L9349)
- [PoB Plant modifier scope](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)

Upstream `dev` references move; they are not a claim of byte identity with the
isolated runtime or current live-game gem availability. These remain heuristic
priorities, not PoB Full DPS or exhaustive mechanics coverage.

## Coverage and Next Batch

The catalog now contains 99/399 raw skill IDs (24.8%), including 94/234
positive-tier entries (40.2%). There are 184 preference categories. Main-tree
coverage increases from 863 to 864 of 2182 distinct wordings, and from 3436 to
3444 of 5451 occurrences (63.2%). Support coverage remains 38 choices, 24 families
and, after the critical-hit/Echo follow-up, 416 reviewed pairs. No single percentage
describes project completion.

Next proposed batch: review Magnified Area I/II, Prolonged Duration I/II and
Brutality I/II/III for these four focuses. Check each real component and support
restriction, especially persistent Briarpatch and Toxic Domain's non-damaging
Bloom versus Pustule explosion. This is a proposal only, not authorization for
another batch or deployment.

That proposed support batch is now completed separately; see the linked review
for its evidence and next proposal. The verification below records the original
four-preset batch, not a new full-game mechanics claim.
The subsequent [utility review](build-focus-plant-utility-supports.md) adds seven
legal Efficiency/Mobility pairs without changing passive scores or skill scopes.
The [casting review](build-focus-plant-casting-supports.md) adds another eight
pairs, keeping manual priorities unchanged until explicit user action.
The [critical-hit/Echo review](build-focus-plant-crit-echo-supports.md) adds three
more pairs, withholding Echo from Entangle rather than inferring repeat eligibility.

## Verification

`npm run validate:release` passed 2530 tests across 110 files, typecheck, the
production build, graph validation and the unchanged coverage baseline. Focused
tests first identified one old automatic-area-suggestion allowlist; it was
expanded only for the explicitly reviewed Pustule component, not removed.

Edge and Firefox production-preview checks passed all four selections, explicit
suggestion application, preference preservation, weighted worker preview/apply,
component warnings and saved-build load/reload. Both found a 20-point smoke route
containing five Plant Damage nodes. The summary combined their five 12% lines
into 60%. Completion consoles had zero errors and warnings. Screenshots were
inspected; test profiles were isolated from the user's saved builds.

Logs and source exports are in `var/plant-skills-20261108/`; the repeatable smoke
script and screenshots are in `output/playwright/plant-skills-20261108/`.
The existing large-chunk advisory remains non-blocking (664.57 kB main chunk).
No route-quality benchmark/audit, commit, push or live deployment was performed.
Local preview remains `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

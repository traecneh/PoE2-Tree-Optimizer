# Plant Casting Support Review

Rapid Casting I/II/III and Considered Casting are now reviewed for Entangle and
Thrashing Vines: eight admitted skill/support pairs. These are base self-cast
spell-hit focuses, not triggered, proxy or whole-build performance models.
No support is added to Briarpatch or Toxic Domain in this batch.

## Compatibility and Effects

| Support | Reviewed effect | Boundary |
| --- | --- | --- |
| Rapid Casting I | 15% increased cast speed | Additive with other increased cast speed, not 15% more; no passive priority change |
| Rapid Casting II | 20% increased cast speed | Same scope; cost per cast stays unchanged, but faster use can increase resource demand |
| Rapid Casting III | 10% increased cast speed per different spell cast in the last eight seconds | Conditional count and uptime are not inferred; no permanent speed reward or priority change |
| Considered Casting | 35% more damage, 15% less cast speed, 115% Mana-cost multiplier | Self-cast hit review only; no guaranteed net DPS gain. Offers High cast-speed priority for responsiveness through explicit actions |

The native predicate accepts all eight base pairs. Rapid Casting requires Spell
and rejects Instant, FixedCastTime and NoAttackOrCastTime. Considered Casting
rejects triggered, proxy, Persistent and fixed-cast-time variants. Both Plant
skills have Sustained, not Persistent; the two types are not interchangeable.
Other skills and arbitrary legal links are not admitted through tag inference.

Entangle's 0.9-second action can be faster/slower without changing its fixed
100 ms vine-application stat, fissure travel, contacts or vine tick count.
Both native Fissures and Vines sets were selected and checked separately. Their
displayed cast rate is not proof of actual attached-vine damage frequency.

Thrashing Vines has a one-second cast action and a spawn stat referencing 50%
of cast time. Its 500 ms minimum channel, 500 ms retarget stat, eight-second and
five-second timers, random contacts and overlap remain separate. No extra slam
count or full DPS is calculated from a cast-speed modifier.

## App Behavior

Only existing support controls are extended. Selecting/removing a support keeps
manual priorities, goals, allocation and budgets unchanged. One Rapid Casting
tier per family is retained, independently of Efficiency or Considered Casting.
Saved builds and JSON transfer preserve the reviewed IDs and manual settings.

Considered Casting uses the existing High cast-speed suggestion. Add suggestions
fills missing effects without overwriting a current weight. Apply support
priorities explicitly changes only the shown cast-speed priority. Removing the
support does not undo previously applied manual preferences. Rapid tiers do not
offer automatic priority changes. No native damage/speed magnitude multiplies
passive scores, and Shortest/weighted route algorithms and point costs are unchanged.

## Native Evidence and Independent Checks

An isolated PoB 0.23.1 runtime checked eight compatible pairs, 34 negative type
assertions and 33 MAIN calculation cases. Applied support lists and actual
requested stat sets were checked, not just the standalone compatibility predicate.
Evidence is in `var/plant-casting-supports-20261108/`. Installed PoB and user
builds were untouched; no real-build route-quality audit was run.

The fixture uses an empty passive tree and attributes sufficient for the skill.
Its native damage outputs are synthetic component results, not game DPS or a
simulation of enemy movement, actual vine contacts or full Plant behavior.

Independent arithmetic and frozen native examples agree:

- Entangle's baseline rate is 1 / .9 = 1.111111 casts/s. Rapid I/II give
  1.277778 / 1.333333. With +100% existing increased cast speed, Rapid II changes
  2.222222 to 2.444444, a 10% relative gain, not 20% more.
- III with explicitly configured 0/1/3 different spells gives 0%/10%/30%
  increased cast speed. These counts are test inputs, not an assumed rotation
  or guaranteed minimum uptime in the app.
- Considered multiplies cast speed by .85, rather than adding 15% to cast time.
  Base Entangle takes about 1.058824 seconds, and Thrashing Vines about 1.176471.
  The native damage multiplier is separately 1.35; neither factor establishes
  a whole-build DPS gain, particularly with Physical mitigation and contacts.
- PoB rounds the combined speed multiplier to two decimals before calculating
  cast rate. III at three spells with Considered gives round(1.3 * .85, 2) =
  1.11, not 1.105. Entangle's native rate is 1.233333 and Thrashing's is 1.11.
  An initial test omitted this rounding and a hand-entered Thrashing fixture
  used 1.105. Both were corrected against the raw native output and source;
  no runtime or app scoring was changed to force agreement.
- Native Mana cost stays 95/152 with Rapid tiers, and becomes 109/174 with
  Considered. These final rounded outputs are not a generic formula based on
  multiplying already-rounded costs. Durations stay unchanged in these checks.

Frozen fixtures are independent of the app allowlist in
`src/tree/plantSkillSupports.fixtures.ts`; focused tests also verify scopes,
ownership, signed passive values, explicit priorities, family replacement,
persistence and unchanged route scores/costs. They require no PoB or network.

- [Rapid Casting definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L7539)
- [Considered Casting definition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2137)
- [Native compatibility](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcTools.lua)
- [Native cast-rate rounding](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Upstream dev references can move and are not claimed byte-identical to the local
snapshot. These checks qualify curated heuristic refinements, not exhaustive
support legality, support sockets, attribute requirements or Full DPS integration.

## Coverage and Next Batch

Reviewed pairs increase from 405 to 413. The catalog stays at 99 skill presets,
38 support choices, 24 families and 184 preferences. Passive wording coverage
stays 864/2182 distinct wordings and 3444/5451 occurrences; no baseline reset.

Next proposed batch: Controlled Destruction and Spell Echo for these two Plant
spell focuses, keeping critical-hit prohibition and repeat eligibility separate.
That is a proposal only; no next batch or deployment is authorized here.

The [critical-hit/Echo follow-up](build-focus-plant-crit-echo-supports.md) is now
complete separately. Counts and validation here retain this casting checkpoint.

## Verification

The focused 284-test check passed after the native rounding correction, followed
by one `npm run validate:release`: 2593 tests across 112 files, typecheck,
production build, graph validation and coverage baseline all passed. The new
casting test is also part of the lean quick-validation manifest. No coverage
baseline was reset. The existing large-chunk advisory remains non-blocking
(670.92 kB main chunk).

Edge and Firefox production-preview smoke passed both support lists (14 Entangle,
13 Thrashing Vines), all three Rapid tiers, one-tier replacement, other-family
preservation, component notes and conditional-uptime wording. Selecting supports
did not change manual weights. Add suggestions preserved the existing cast-speed
weight; Apply support priorities changed only cast speed. Removing Considered
Casting retained that explicit change, and its inactive note disappeared.

Both browsers passed disabled controls during optimization, a 20-point preview
and apply, and saved-build load/reload with Efficiency II, Rapid Casting III,
Considered Casting and the applied priority intact. Completion consoles had zero
errors/warnings. The initial Edge favicon 404 was unrelated and absent after
reload. Screenshots were inspected; isolated profiles did not touch user saves,
and both test sessions were closed.

Native and validation logs are in `var/plant-casting-supports-20261108/`;
the repeatable browser script and inspected screenshots are in
`output/playwright/plant-casting-supports-20261108/`.
No optimizer-quality benchmark/audit, commit, push or live deployment was run.
Local preview remains `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

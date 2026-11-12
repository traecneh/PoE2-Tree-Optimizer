# Plant Support Review

Magnified Area I/II, Prolonged Duration I/II and Brutality I/II/III are reviewed
for Entangle, Briarpatch, Thrashing Vines and Toxic Domain: 28 added skill/support
pairs. All pass the native compatibility predicate. None of these seven support
definitions excludes Persistent, so Briarpatch is not rejected solely for that
tag. Legal does not mean recommended for every build or component.

## App Behavior

The existing support checkboxes retain one tier per family. Selecting/removing a
support does not change manual weights, goals, allocation or point budgets.
These seven have no automatic priority adjustment. Add suggestions preserves
existing priorities; no support damage multiplier is inserted into route scores.
Shortest, weighted search, point costs and passive matching remain unchanged.

Context-specific support notes are resolved from the same reviewed allowlist
for UI and refinement warnings. Other skills retain their previous summaries
and exclusions. Inactive notes are not shown and no new panel is introduced.
Saved/exported builds preserve selected families. Changing skill clears support
selection, following the existing behavior.

## Effects and Boundaries

| Support | Reviewed effect | Limits |
| --- | --- | --- |
| Magnified Area I / II | 35% / 45% increased area; 130% mana-cost multiplier where applicable | Not increased radius or damage. Entangle's fissure coverage and vine targeting do not turn attached-vine hits into area damage. Ground, spawn and explosion coverage do not guarantee contacts, stored damage, growth or overlap. |
| Prolonged Duration I / II | 30% / 35% more skill-effect duration; 120% mana-cost multiplier where applicable | Entangle's fissures persist longer, not faster vine application; the separate one-second attached-vine timer is unverified. Briarpatch ground lifetime is not creation delay. Thrashing Vines' native eight-second and five-second timers both extend. Toxic Bloom lasts longer, but its separate 15-second detonation timer does not change in the native check. No duration priority is added to the explosion focus. |
| Brutality I / II / III | 25% / 30% / 30% more Physical Damage, no Elemental or Chaos damage; 120% mana-cost multiplier where applicable | Not guaranteed full-build improvement. III adds a 20% hit chance to ignore Physical Damage Reduction, not unconditional penetration. Entangle and vine slams remain conditional on contacts; Briarpatch still requires damage storage and moving enemies. Toxic Domain's supported Pustule cannot deal Poison damage, so this is not a Poison-build recommendation. |

The native Briarpatch checks retain 30 Spirit reservation for each of the seven
individual supports. Their mana-cost multipliers are not advertised as increased
Spirit reservation. This is an observed snapshot result, not a generic rule for
all supports or future game versions.

Brutality warnings include Elemental/Chaos damage and penetration plus Poison
chance, magnitude and duration. Poison is Chaos damage; preventing its damage
does not establish that external Poison can never be supplied to a Pustule.
External Poison, stored damage/growth, attack supply and the complete build are
not modeled. Generic damaging ailments are not all prohibited: Physical Bleeding
is not incorrectly removed. Existing manual weights remain selected and can
still affect routing for other skills; warnings do not silently zero the parser.

## Evidence and Independent Checks

The marked isolated PoB 0.23.1 runtime exported seven support definitions, 28
compatible pairs, three negative type controls and 48 native component fixtures
under `var/plant-supports-20261108/`. The final driver uses MAIN and asserts that
the requested stat set is selected. An initial CALCS check selected its own first
component; it was corrected and its output replaced, not counted as verification
of the requested vines or Pustule set. Installed PoB and user saves were untouched.

Synthetic added damage and a basic crossbow expose damage-type prohibitions;
they are not a real build, a full Briarpatch storage simulation or game DPS.
Injected damage fields on the non-damaging Bloom are not interpreted as real
Bloom damage. Only its area, duration and cost behavior are used here.

Independent arithmetic agrees with native examples:

- Magnified area scales radius by a square root, with native integer rounding:
  an 80-unit fissure radius becomes floor(80 * sqrt(1.35)) = 92, not 108.
- Duration multipliers apply before the native 33 ms rounding. An eight-second
  timer with Prolonged I becomes ceil(8 * 1.3 / .033) * .033 = 10.428 seconds;
  Prolonged II gives 10.824 seconds. These are not 30%/35% faster ticks.
- Toxic Domain's native detonation output stays 15 seconds while its Bloom
  duration grows. Poison output is absent with Brutality, with its Physical
  component still distinct. Stored-Poison interactions are not inferred.
- Tier III's ignore-reduction chance is recorded from its definition; native
  final-hit outputs are not used to infer guaranteed mitigation bypass or DPS.

Frozen identities, magnitudes and compact component evidence are in
`src/tree/plantSkillSupports.fixtures.ts`. Ordinary tests need no local PoB or
network. They cover all 28 pairings, actor-specific warnings, tier replacement,
settings persistence, unchanged passive scores and route/point-cost behavior.

- [Magnified Area definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6689)
- [Prolonged Duration definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5602)
- [Brutality definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1216)
- [Native detonation calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Upstream `dev` references move and are not claimed byte-identical to the isolated
source. These remain compatibility/heuristic reviews, not socket/attribute
validation, a route-quality audit or PoB Full DPS integration.

## Coverage and Next Batch

The catalog stays at 99 skill presets, 38 support choices and 24 support families;
reviewed pairs increase from 370 to 398. Passive coverage stays 864/2182 distinct
wordings and 3444/5451 main-tree stat occurrences. No new parser or preference
category was added and the coverage baseline is not reset.

Next proposed batch: Efficiency I/II and Mobility for these four Plant focuses.
Check Persistent, usable-while-moving and NoAttackOrCastTime restrictions rather
than inferring support from a Spell or Plant tag. This is a proposal only; no
next batch, commit, push or live deployment is authorized by this review.

That utility follow-up is now complete separately: see
[Plant utility supports](build-focus-plant-utility-supports.md). The 398-pair
count and verification below record this original seven-support checkpoint.

## Verification

`npm run validate:release` passed 2565 tests across 111 files, typecheck,
production build, graph validation and the unchanged coverage baseline. A
focused 504-test check passed before that single full release run. The existing
large-chunk advisory remains non-blocking (668.18 kB main chunk).

Edge and Firefox production-preview checks passed all seven offered choices on
each of the four skills, one-tier-per-family replacement, contextual notes,
manual Fire/Poison/Life priority preservation, support warning removal, weighted
preview/apply and saved-build load/reload. Both applied a 20-point test route and
retained all three support families on reload; completion consoles had no errors
or warnings. Test profiles were isolated from the user's saves.

An initial browser script expected a warning container to remain after removing
the last warning. The app correctly removed it; the script now accepts absence
and both runs pass. No application fix was needed for that automation timeout.
Logs and native source checks are retained in `var/plant-supports-20261108/`;
the repeatable smoke script and inspected screenshots are in
`output/playwright/plant-supports-20261108/`.

No route-quality audit/benchmark, commit, push or deployment was performed.
Local preview remains `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

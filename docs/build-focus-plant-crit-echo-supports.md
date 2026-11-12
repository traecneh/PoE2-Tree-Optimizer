# Plant Critical-Hit and Echo Support Review

Controlled Destruction and Spell Echo were reviewed for Entangle and Thrashing
Vines. Three pairs are admitted; Entangle with Echo is rejected in the reviewed
native data. No routing algorithm, point cost or automatic DPS score was added.

## Compatibility and Effects

| Skill | Controlled Destruction | Spell Echo |
| --- | --- | --- |
| Entangle | Admitted for fissure and vine spell hits | Withheld: no Cascadable type |
| Thrashing Vines | Admitted for spell-hit slams | Admitted for the base self-cast Cascadable skill |

Controlled Destruction requires both Spell and Damage. The native definition
grants 25% more hit damage and a cannot-crit flag, not a reduction to crit chance.
Neither a high critical chance nor Critical Damage Bonus overrides the prohibition.
It does not imply a net DPS improvement after lost crits, enemy mitigation or
contacts. The tested definition has no added Mana-cost multiplier.

Echo requires Cascadable and rejects Triggered, UsedByProxy and Persistent.
Entangle's Unleashable type is not Cascadable. Thrashing Vines' Sustained type is
not Persistent. The app does not patch these types or admit every Spell tag.
This batch does not extend either support to Briarpatch or Toxic Domain.

Echo adds one Echo, with 30% less cast speed, a 150% Mana-cost multiplier and
40% increased area for the Echo only. It is not 40% more radius, an unconditional
area bonus or a guarantee of double contacts/DPS. Plant limits, spawn/retarget
timing, minimum channel, overlap and actual enemy contacts remain unmodeled.

## App Behavior

The existing reviewed support checkboxes are extended; no new panel or control
scheme is introduced. Manual priorities, goals, allocation and budgets remain
intact on selection/removal. Support families stay independent and persist
through saved builds and JSON transfer.

Controlled Destruction reuses the existing conservative policy: remove the
reviewed spell-specific Critical Hit Chance and Critical Spell Damage Bonus
scopes for this supported focus. Warnings identify selected generic critical
preferences without deleting them or silently zeroing global values that may
serve other skills. Those manual generic preferences still affect routing until
the user removes them. Minion critical modifiers remain a separate owner/channel;
attack-specific critical modifiers do not become Plant spell bonuses.

Removing Controlled Destruction restores the base spell-critical scopes and
removes its warnings. Plant, Physical and other relevant non-critical matching
are unaffected; no 25% native multiplier is inserted into their scores.

Echo keeps the existing opt-in High cast-speed suggestion for responsiveness.
Add suggestions does not overwrite an existing weight; Apply support priorities
explicitly changes only the listed cast-speed weight. Removing Echo does not
undo previously applied preferences. No repeat count or Echo area is multiplied
into route scores. Shortest and non-critical weighted route costs are unchanged.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime checked four pairs, nine type controls and 26
MAIN component cases. Requested stat sets and actual applied-support lists were
asserted. Entangle's Fissures and Vines were checked separately; incompatible
Echo links were absent from the applied lists. A copied type table was used only
for controls, not to alter source data or admit Entangle.

Evidence is retained in `var/plant-crit-echo-supports-20261108/`. The fixture has
an empty passive tree and sufficient attributes, not a real build. Installed PoB
and user saves were untouched. Its component damage numbers are not live-game
Plant DPS, actual vine contacts or a route-quality audit.

Independent frozen fixtures and arithmetic check:

- Both skills start with 10% native crit chance; a custom +1000% increased crit
  setup reaches 100%. Controlled Destruction gives 0% in both cases, across all
  three components. The native hit multiplier is separately 1.25. Cast rate and
  cost stay unchanged with this support.
- Entangle's rejected Echo leaves rate 1.111111, cost 95 and one total use in
  both component sets. No extra fissure/vine event is invented.
- Thrashing Vines' Echo gives native .7 casts/s from 1, and 228 Mana from 152.
  One-second base casting becomes 1 / .7 = 1.428571 seconds, not 1.3 seconds.
  Native Repeats is two total uses (one initial plus one Echo), not two extra
  Echoes. That output is not itself a verified hit rate or throughput bonus.
- Native initial radius stays 25 in NONE repeat-view mode; AVERAGE and FINAL
  modes give 27 and 29. These agree with floor(25 * sqrt(1.2)) and
  floor(25 * sqrt(1.4)). The 40% bonus is repeat-only, not 40% larger radius for
  every hit. Durations stay 8.019 and 5.016 seconds.
- Combining both supports retains crit prohibition, one additional Echo and
  the .7 cast-speed modifier. The native component DPS fields are not used to
  infer double damage, a whole-build gain or additional Plant contacts.

Fixtures are in `src/tree/plantSkillSupports.fixtures.ts`; ordinary tests require
no PoB installation or network. Signed spell-critical values, owner separation,
warning removal, other support families, explicit priorities, persistence and
unchanged required goals/non-critical route scores are regression-covered.

- [Controlled Destruction definition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2177)
- [Spell Echo definition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8017)
- [Native compatibility](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcTools.lua)
- [Repeat modifiers](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua)
- [Native repeat calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving upstream references are not claimed byte-identical to the isolated runtime.
These are curated compatibility/heuristic reviews, not socket/gear validation or
PoB Full DPS integration.

## Coverage and Next Batch

Reviewed pairs increase from 413 to 416. The catalog remains 99 skill presets,
38 support choices, 24 families and 184 preferences. Passive coverage remains
864/2182 distinct wordings and 3444/5451 main-tree occurrences; no baseline reset.

Next proposed batch: add reviewed Vine Arrow and Toxic Growth focuses. Both are
present in the source catalog but not the app's preset list. Review attacks,
plant damage over time and externally supplied Poison separately rather than
assuming all shared Plant, Chaos, Projectile or Bow tags affect every component.
This is a proposal only, not authorization for the next batch or deployment.

That [Plant bow batch](build-focus-plant-bow-skills.md) is now completed separately.
The counts and validation here retain this critical-hit/Echo checkpoint.

## Verification

Focused checks passed 270 tests after correcting a test expectation: minion
critical modifiers remain independently available when the player's spell-critical
scopes are blocked. No parser fix was needed.

The initial full release run found four older assertions still treating the
newly reviewed pairs as unsupported. Only the explicit reviewed expectations
were updated: Entangle/Thrashing Vines now enter the scoped critical-blocking
test, with other rejection cases retained. The affected 68 tests then passed.

The final `npm run validate:release` passed 2609 tests across 113 files, typecheck,
production build, graph validation and coverage baseline. The new support test
is included in quick validation too. No baseline was reset. The existing
large-chunk advisory remains non-blocking (671.94 kB main chunk).

Edge and Firefox production-preview smoke passed both 15-choice lists, Echo
eligibility, critical warnings/removal, preserved manual weights, independent
support families, explicit Echo cast-speed priority and disabled controls while
optimizing. Both applied a 20-point route, then saved/loaded/reloaded Rapid
Casting II, Controlled Destruction, Spell Echo and their manual/applied priorities.
The critical warning also survived reload. Completion consoles had zero errors
and warnings. An initial Edge favicon 404 was unrelated and absent after reload.

Screenshots were inspected. Profiles were isolated from user saves, and both
test browser sessions were closed. Validation/native logs are retained under
`var/plant-crit-echo-supports-20261108/`; the repeatable browser script and
screenshots are in `output/playwright/plant-crit-echo-supports-20261108/`.
No route-quality benchmark/audit, commit, push or live deployment was performed.
Local preview remains `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

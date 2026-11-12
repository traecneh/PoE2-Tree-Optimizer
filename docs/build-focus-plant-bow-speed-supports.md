# Plant Bow Speed Support Review

Rapid Attacks I/II and Projectile Acceleration I/II were reviewed for Vine Arrow
and Toxic Growth. All eight pairs are admitted. These remain context-only
refinements, not automatic priority changes or Full DPS integration. Existing
Shortest/weighted routing, passive scopes, scores and point accounting are unchanged.

## Eligibility and Scope

Rapid Attacks accepts the native Attack type and excludes NoAttackOrCastTime and
Herald. Projectile Acceleration accepts Projectile or ProjectileSpeed and excludes
FixedSpeedProjectile. Vine Arrow qualifies through ProjectileSpeed even though
its native type list lacks the generic Projectile entry; its delivery component
still has projectile flags. Toxic Growth has Projectile. Actual applied-support
lists agree with the predicates on all four MAIN stat sets. Tags alone do not
grant compatibility. Projectile Acceleration III and Rapid Attacks III remain
unreviewed and are not admitted here.

- Rapid Attacks I/II provide 15%/25% increased attack speed, additive with other
  increases, not more speed. This speeds bow deployment/firing, not the intrinsic
  vine DoT rate, plant lifetime, damage per hit or the base detonation timer.
  Per-use cost is unchanged, but faster use can increase Mana demand.
- Projectile Acceleration I/II provide 40% more projectile speed with higher
  Mana cost. Delivery is distinct from attack speed, vine targeting or damage.
  Neither tier adds the Tier III speed-to-damage conversion.
- Tier II adds 40% chance to Pierce. Native output exposes this as a 0.4 Pierce
  count contribution, not forty targets or guaranteed additional hits/plants.
  Vine Arrow has non-colliding rain delivery; Toxic Growth is ground-targeted
  rain. The app does not invent useful Pierce contacts, overlap, travel time or
  more explosions from that eligibility.
- Toxic Growth's outgoing Poison is distinct from Poison supplied to plants.
  Storage, growth, accelerated expiry, contacts, limits, uptime and sustain are
  unmodeled. No support selection silently changes manual Poison priorities.

The existing controls handle family tier replacement, removal, disabled state,
save/JSON and clearing support selections on focus changes. Selected-only notes
describe each component boundary; no new UI panel or score explanation was added.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime checked eight support pairs, eight negative type
controls and 32 MAIN component cases across Vine Arrow Impact/Vines and Toxic
Growth Pustules/Explosion. Every calculation asserts the requested stat-set
index, a real equipped Bow and agreement between eligibility and applied supports.
An empty-tree Witch, level-20 skill and normal Crude Bow isolate these modifiers.
Installed PoB and user builds were untouched. Evidence is retained in
`var/plant-bow-speed-supports-20261109/`.

Independent frozen expectations in `src/tree/plantBowSpeedSupports.fixtures.ts`
require no native installation or network during ordinary tests.

- Base attack rate 1.2 becomes 1.38/1.5 with Rapid I/II. With a separate 100%
  increased Attack Speed and Rapid II it is `1.2 * (1 + 1 + .25) = 2.7`, not 3.
- Projectile speed modifier 1 becomes 1.4 for either tier. A separate 100%
  increased Projectile Speed gives `(1 + 1) * 1.4 = 2.8`, not 2.4. No actual
  distance/travel-time model or conversion-to-damage is supplied.
- Vine intrinsic Chaos DoT stays 271.3/s and lifetime stays 8.019 seconds.
  Toxic hits stay 1.3125, detonation stays 15 seconds and outgoing Poison duration
  stays two seconds. Hidden-hit fields on the Vines set are not treated as real
  vine hits or Poison.
- Native baseline Mana costs 47/98 stay unchanged under Rapid Attacks. Either
  Projectile Acceleration tier raises them to 56/117. Combined Rapid II +
  Projectile II + Efficiency II costs 34/71. Do not infer general cost rounding
  from already-rounded displayed costs; the app does not estimate final costs.

### Outgoing Poison Caveat

PoB's Toxic explosion Poison DPS changes from 1.2077199486588 to
1.2379800954575/1.2568875 with Rapid I/II, despite unchanged hit damage, magnitude
effect (1) and Poison duration (2). This is not faster intrinsic plant DoT or
stronger externally supplied Poison. Native CalcOffence uses rate-dependent
stack potential, strongest-roll selection and critical-presence assumptions.

The independent check reproduces stack potential 2.4/2.76/3 from rate times
duration with one maximum stack, and average roll 70.588235/73.404255/75% from
`(potential - (maxStacks - 1) / 2) / (potential + 1) * 100`. These constant-hit
assumptions are not live-game uptime or a whole-build DPS claim and are not
converted into route scores. Projectile Acceleration leaves that native Poison
output unchanged in the isolated cases.

- [Rapid Attacks I/II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4612)
- [Projectile Acceleration I/II](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4253)
- [Active skill definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua)
- [Native offence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua)

Moving upstream references were reviewed, but are not claimed byte-identical to
the isolated snapshot. Native outputs are not complete live-game simulation.

## Coverage and Next Batch

Reviewed pairs increase from 427 to 435. The catalog remains 101/399 skill
presets, 96/234 positive-tier skills, 38 support choices, 24 families and 184
passive preferences. Passive coverage remains 864/2182 distinct wordings and
3444/5451 main-tree occurrences. No coverage baseline reset.

Next proposed batch: review Swift Affliction I/II for Vine Arrow and Concentrated
Area for Toxic Growth, checking non-ailment DoT/lifetime and hit-area trade-offs
respectively. These are candidate reviews, not approved loadouts or authority to
start another batch. Fireball's Concentrated Area review remains on hold.

The [duration/area follow-up](build-focus-plant-bow-tradeoff-supports.md) is now
complete separately. Counts and verification here retain the speed checkpoint.

## Verification

Focused checks passed 293 tests across six files. One `npm run validate:release`
passed 2661 tests across 116 files, typecheck, production build, graph validation
and the unchanged coverage baseline in 103713 ms. The existing large-chunk
advisory remains non-blocking (main 681.43 kB). No baseline reset or route-quality
audit was performed.

A targeted isolated Edge production-preview smoke passed both lists (11/8
reviewed choices), all eight new selection/removal paths, tier replacement,
preservation of Area/Efficiency families, component notes, manual priorities,
required goal/start/budget and saved-build load/reload. Completion console:
zero errors and zero warnings. The nonblank tree and support-note layout were
visually checked in a screenshot. The initial favicon 404 was unrelated and
absent after reload. The profile was isolated from user saves and the test
session was closed. No CSS, layout or browser-specific code changed; Firefox's
previous utility checkpoint was not rerun for this data-only extension.

Logs are under `var/plant-bow-speed-supports-20261109/`; the repeatable browser
script and screenshot are under `output/playwright/plant-bow-speed-supports-20261109/`.
Local preview remains `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

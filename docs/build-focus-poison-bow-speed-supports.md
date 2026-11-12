# Poison Bow Delivery Supports

Rapid Attacks I/II and Projectile Acceleration I/II are reviewed choices for
Poisonburst Arrow's Poison burst and Gas Arrow's Poison cloud. Eight new pairs
are admitted. This is not Full DPS evaluation, a recommended loadout or a
simulation of Poison feeding into Plant skills.

## Scope

- Rapid Attacks supplies 15%/25% increased attack speed, additive with other
  increased attack speed, not more attack speed. It speeds deployment, not
  Poison magnitude, tick speed, linked Poison duration or cloud lifetime.
  Cost per use is unchanged; faster firing can increase Mana demand.
- Projectile Acceleration supplies 40% more projectile speed, not attack speed
  or a speed-to-damage conversion. Both tiers have a 120% source cost multiplier.
  Tier II additionally grants 40% chance to Pierce, not guaranteed contacts,
  hits, bursts or clouds. Poisonburst still requires the arrow to hit. Gas
  Arrow's ground-targeted delivery does not establish useful enemy Pierce
  contacts or additional clouds.
- Outgoing Poison duration, Poisonburst's linked skill duration, Gas cloud
  lifetime, area growth, overlaps, limits, external Poison feeding and Fire-
  explosion conditions/frequency remain separate. Cloud creation is at the
  end of arrow flight; travel speed is not cloud growth or explosion speed.
- Contextual notes change on selection; passive priorities do not. Add
  suggestions preserves manual weights. No Apply support priorities command is
  fabricated. Removal preserves adopted manual preferences. One tier per family
  is retained, alongside previously reviewed area/duration/cost supports.
- Rapid Attacks III, Projectile Acceleration III, Mobility and unreviewed Poison
  supports remain withheld. No passive scopes, parser, optimizer, point costs,
  layout or storage schema are changed.

## Native and Independent Checks

The isolated PoB 0.23.1 runtime accepted all eight requested pairs. Eight type
controls reject missing Attack/Projectile eligibility and NoAttackOrCastTime/
FixedSpeedProjectile exclusions. Forty MAIN calculations cover both Poisonburst
stat sets and all three Gas Arrow sets: baseline, four individual supports,
increased Attack/Projectile Speed probes and combined Tier-II speed links with
Efficiency II. Every case asserts the stat-set index, real equipped Bow and
applied support IDs. The empty-tree Witch, level-20 skills and normal Crude Bow
isolate effects; installed PoB and user saves were untouched.

Evidence: `var/poison-bow-speed-supports-20261109/`. Independent frozen fixtures
are in `src/tree/poisonBowSpeedSupports.fixtures.ts`. Ordinary tests require no
network or native PoB installation.

Deployment rate changes 1.2 -> 1.38/1.5 per second. With 100% increased Attack
Speed plus Rapid II it is `1.2 * (1 + 1 + .25) = 2.7`, not `1.2 * 2 * 1.25`.
Projectile speed changes 1 -> 1.4; adding 100% increased Projectile Speed gives
`2 * 1.4 = 2.8`. Tier II exposes native expected Pierce count 0.4, not an integer
extra contact. Neither tier enables ProjectileSpeedAppliesToProjectileDamage.

| Component | Base / Rapid Mana cost | Projectile cost | Combined with Efficiency II | Hit unchanged |
| --- | ---: | ---: | ---: | ---: |
| Poisonburst Arrow / Arrow | 38 | 45 | 27 | 5.38125 |
| Poisonburst Arrow / Poison Burst fake source | 38 | 45 | 27 | 5.38125 |
| Gas Arrow / Arrow | 62 | 74 | 45 | 1.8375 |
| Gas Arrow / Poison Cloud fake source | 62 | 74 | 45 | 4.33125 |
| Gas Arrow / conditional Explosion | 62 | 74 | 45 | 11.025 |

Cost arithmetic checks `floor(base * 1.2)` followed by `ceil(cost * .6)` with
Efficiency II. Poison duration stays 3/2 seconds; displayed skill timers stay
3.003/4.026 seconds; radii stay 24/18. Projectile support leaves Poison DPS at
5.385766215481/4.0038541776187, including its increased-speed probe.

### Native Roll Selection Is Not Faster Poison Ticks

Rapid I/II changes native outgoing Poison DPS estimates to
5.5394146805986/5.6358581778053 for Poisonburst and
4.1065293049709/4.17058125 for Gas. Magnitude multiplier stays 1, duration is
unchanged and the native maximum Poison stack count stays 1.

Independent checks reproduce application potential `rate * duration / maxStacks`
and the native average-roll formula
`(potential - (maxStacks - 1) / 2) / (potential + 1) * 100`.
These repeated-application assumptions do not establish guaranteed hits,
actual cloud contacts, stronger ticks, additional stack limits, Poison feeding
or full build performance. No such native estimate is multiplied into route
scores. Fake Poison-source hit fields are not actual cloud or burst hits.

- [Rapid Attacks data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4612)
- [Projectile Acceleration data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4253)
- [Skill components and delivery](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua)

Moving upstream references are not claimed byte-identical to the isolated
snapshot. Source/native evidence is not a blanket live-game simulation claim.

## Coverage and Next Batch

Reviewed pairs increase 450 -> 458. Choices stay 38, families 24, skill presets
103/399, positive-tier skills 98/234 and passive preferences 184. Confirmed
main-tree wording/occurrence coverage remains 864/2182 and 3444/5451. No catalog
refresh or baseline reset.

Next proposed batch: Deadly Poison I/II for both focuses, checking actual
compatibility, hit-damage penalties and Poison-source behavior instead of
assuming a support is beneficial from its name. Proposal only, not authorization
for another batch or deployment.
The subsequent authorized [Deadly Poison review](build-focus-poison-bow-deadly-supports.md)
is documented separately; counts above preserve this delivery checkpoint.

## Verification

The focused check passed 270 tests across six files. One
`npm run validate:release` passed 2728 tests across 120 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
73057 ms. The existing large-chunk advisory remains non-blocking (main
694.19 kB). No baseline reset, source catalog refresh or route-quality audit.

An isolated Edge production-preview smoke passed all eight new combinations,
delivery/Poison/Pierce notes, tier replacement, removal, previous utility-family
preservation, unchanged manual priorities, Add suggestions, goal/start/budget
preservation and saved-build load/reload. The completion console had zero errors
and warnings. The initial unrelated favicon 404 was absent after reload.
The screenshot was visually checked for a nonblank tree and readable,
non-overlapping controls. User saves were isolated and the test session closed.
No CSS or browser-specific code changed; the existing Firefox checkpoint was
not repeated for this support allowlist extension.

Logs: `var/poison-bow-speed-supports-20261109/`. Repeatable browser script and
screenshot: `output/playwright/poison-bow-speed-supports-20261109/`.
The existing preview was reused after confirming its HTML matches the current
production build: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

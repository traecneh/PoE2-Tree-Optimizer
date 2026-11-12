# Poison Bow Area, Duration and Cost Supports

Magnified Area I/II, Prolonged Duration I/II and Efficiency I/II are reviewed
choices for both Poisonburst Arrow and Gas Arrow: twelve new skill/support pairs.
These remain scoped passive-preference focuses, not a Full DPS engine or a
recommended loadout.

## Behavior

- Magnified Area I/II supplies 35%/45% increased area, not radius or Poison
  magnitude. Coverage is separate from hits, contacts, cloud overlap and growth.
  The source cost multiplier is 130%. No automatic passive-priority change.
- Prolonged Duration I/II supplies 30%/35% more skill-effect duration, with a
  120% cost multiplier. Poisonburst explicitly links outgoing Poison duration
  to skill duration. Gas Arrow instead extends cloud lifetime while its outgoing
  Poison duration stays unchanged. Longer persistence is not increased Poison
  magnitude, faster ticks or a real no-hit component becoming a hit.
- Efficiency I/II supplies 30%/40% less supported-skill cost. It does not grant
  Mana regeneration, shorten cloud timers or reduce a separate Poison-feed or
  Detonator skill's costs. Whole-build sustain is not calculated.
- Contextual summaries identify those differences. Selecting/removing a support
  preserves weights; Add suggestions preserves manual priorities. There is no
  fabricated Apply support priorities action for these context-only links.
  One tier per family is retained. Goals, start, point budget and saves survive.
- The cloud's conditional Fire explosion, external Poison feeding, limits,
  contact counts, growth, overlap and application uptime remain unmodeled.
  Neither passive scopes nor parser, optimizer, point accounting or CSS changed.

## Source and Native Checks

The isolated PoB 0.23.1 runtime accepted all twelve pairs. Six synthetic type
controls reject area support without Area, duration support without Duration
and Efficiency with Persistent. Forty-three MAIN calculation cases cover both
Poisonburst stat sets and all three Gas Arrow sets, individual supports,
combined Tier-II links and separate area/skill-duration/Poison-duration probes.
Every case asserts its selected stat set, actual Bow equipment and applied
supports. The empty-tree Witch, level-20 skills and normal Crude Bow isolate
effects. Installed PoB and user saves are untouched.

Evidence: `var/poison-bow-supports-20261109/`. Independent frozen fixtures are
`src/tree/poisonBowSupports.fixtures.ts`; ordinary tests need no native install
or network.

| Probe | Poisonburst Poison Burst | Gas Arrow Poison Cloud |
| --- | ---: | ---: |
| Base radius | 24 | 18 |
| Magnified I / II radius | 27 / 28 | 20 / 21 |
| Base displayed skill timer | 3.003 s | 4.026 s |
| Prolonged I / II displayed timer | 3.927 / 4.059 s | 5.214 / 5.412 s |
| Base outgoing Poison duration | 3 s | 2 s |
| Prolonged I / II outgoing Poison duration | 3.9 / 4.05 s | 2 / 2 s |
| Base Mana cost | 38 | 62 |
| Magnified / Prolonged Mana cost | 49 / 45 | 80 / 74 |
| Efficiency I / II Mana cost | 27 / 23 | 44 / 38 |
| Magnified II + Prolonged II + Efficiency II cost | 36 | 58 |

Independent arithmetic checks increased area with
`floor(baseRadius * sqrt(1 + increasedArea))`, more duration multiplicatively
and displayed timers rounded upward to 0.033-second ticks. Cost checks preserve
PoB's intermediate support-multiplier flooring and less-cost ceiling, rather
than rounding only the final product.

With 100% increased area plus Magnified II, radii become 37/28. With 100%
increased Skill Effect Duration plus Prolonged II, skill timers become
8.118/10.824 seconds; outgoing Poison becomes 8.1/2 seconds. Substituting
100% increased Poison Duration leaves the skill timers at 4.059/5.412 seconds
and outgoing Poison becomes 8.1/4 seconds. Skill and Poison timers do not merge.

Magnified and Efficiency leave the reviewed native outgoing Poison DPS at
5.385766215481/4.0038541776187. Prolonged I/II changes Poisonburst's native
roll-selection estimate to 5.68253518591/5.7282710959283; Gas stays unchanged.
That duration-dependent estimate is not a direct magnitude or tick-speed bonus,
and it is not multiplied into passive scores. Fake source hits stay unchanged,
as do the three real Arrow/Fire-explosion hit controls and 1.2/s attack rate.
No Fire-explosion frequency is inferred from its separate area-capable output.

- [Magnified Area data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L6689)
- [Prolonged Duration data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L5602)
- [Efficiency data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L2711)

Upstream links are moving references, not claimed byte-identical to the isolated
snapshot. Source and native calculations are not complete live-game simulation.

## Coverage and Next Batch

Reviewed pairs increase 438 -> 450; support choices stay 38 and families 24.
Skill presets stay 103/399, positive-tier skills 98/234 and preferences 184.
Confirmed main-tree wording/occurrence coverage stays 864/2182 and 3444/5451.
No catalog refresh or baseline reset.

Next proposed batch: Rapid Attacks I/II and Projectile Acceleration I/II for
both skills, checking actual compatibility and separating delivery, Pierce,
Poison tick rate, cloud growth and conditional detonation. Proposal only;
another batch or deployment needs authorization.
The subsequent authorized [delivery support review](build-focus-poison-bow-speed-supports.md)
is documented separately; counts above preserve this utility checkpoint.

## Verification

The focused check passed 268 tests across six files. The release run passed
2710 tests across 119 files, then typecheck caught three test-only queries using
Playwright's `exact` option in Testing Library. Those options were removed;
all 116 affected UI tests passed on rerun. `npm run build` then passed both
typecheck and production build, followed by `npm run validate:graph` and
`npm run coverage:check`. The full suite was not repeated for that test-only
typing correction. The existing large-chunk advisory remains non-blocking
(main 692.56 kB). No baseline reset or route-quality audit.

An isolated Edge production-preview smoke passed all twelve choices, the two
different duration explanations, tier replacement, removal, unchanged manual
weights, Add suggestions, goals/start/budget preservation and saved-build
load/reload. The final console had zero errors and warnings. The initial
unrelated favicon 404 was absent after reload. The screenshot was visually
checked for a nonblank tree, readable notes and non-overlapping controls.
The test profile did not touch user saves and its session was closed. No layout
or browser-specific code changed, so the previous Firefox checkpoint was not
repeated for this allowlist extension.

Logs: `var/poison-bow-supports-20261109/`. Repeatable smoke script and screenshot:
`output/playwright/poison-bow-supports-20261109/`. The preview listener was absent
and was restarted at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

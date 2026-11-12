# Bursting Plague for Poison Bow Focuses

Bursting Plague is reviewed for Poisonburst Arrow's Poison burst and Gas Arrow's
Poison cloud. One support choice/family and two reviewed pairs. This adds
explicit context and limitations, not automatic burst or boss-DPS scoring.

## Behavior and Scope

- The source uses supported Poison DPS to accumulate Plague on the affected
  enemy, with a 100% source coefficient and a cap of 20% of that enemy's maximum
  Life. These are not 100% more Poison damage, player Life scaling or a promise
  of reaching the cap. Accumulation, elapsed contact time and saturation are
  not calculated by this PoB snapshot or the app.
- The granted Plague Burst is a separate player-owned Physical area hit that
  requires an enemy with Plague to die. Source conversion is 100% of stored
  Plague, not an unconditional hit for 20% of enemy Life. It is not a Bow attack,
  Spell, minion skill or Gas Arrow's conditional Fire explosion. Its Chaos tag
  is not evidence of an added Chaos component or Poison-DPS multiplier.
- Killing frequency, target density, stored amounts, chaining, repeat hits,
  burst damage and boss uptime are unmodeled. A living isolated boss does not
  supply its own on-death bursts; nearby kills must not be assumed either.
- Poisonburst's initial arrow still needs to hit. Its linked outgoing Poison
  duration remains distinct from external Poison feeding. Gas cloud lifetime,
  outgoing Poison, growth and Fire detonation retain their existing boundaries.
- Support selection/removal preserves current priorities, suggestions, owner/hit
  scopes, exclusions, goals, budgets, class starts and other support families.
  No automatic Poison, Physical, area, critical or boss-DPS bonus is assigned.
  Shortest routing, allocation, point accounting, parsers, CSS and save schema
  are unchanged. Existing scores do not gain a second copy for the burst.

## Source and Native Evidence

The isolated PoB 0.23.1 runtime performed 26 MAIN calculations: baseline and
support across all five parent components; Efficiency II; separate and combined
Escalating/Deadly Poison controls; a combined Escalating/Deadly/Prolonged/
Efficiency loadout; and the actual granted child, with and without Magnified
Area II, for both parents. Requested component IDs/stat sets, actual Bow
equipment and applied parent supports are asserted. Native generated active-skill
lists contain the parent plus `PlagueBurstPlayer`. The child is selected through
the support gem's additional granted effect, not a fabricated stand-alone skill.

Both parent compatibility predicates pass. Removing all accepted parent types
rejects both links; a minion-only synthetic type set is also rejected despite
Attack/Damage types on the minion. Source `ignoreMinionTypes` does not admit a
minion through its child types. This is scoped native evidence, not a claim
that every possible proxy/trigger setup was reviewed.

| Native parent Poison-component output | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Baseline / linked Poison per second | 5.385766215481 | 4.0038541776187 |
| Baseline -> linked Mana cost | 38 -> 45 | 62 -> 74 |
| Linked + Efficiency II Mana cost | 27 | 45 |
| Unchanged displayed skill duration | 3.003 s | 4.026 s |
| Unchanged outgoing Poison duration | 3 s | 2 s |
| Unchanged maximum Poison stacks / magnitude / deployment | 1 / 1 / 1.2 per s | 1 / 1 / 1.2 per s |
| Escalating alone / with Bursting Poison per second | 9.2211585994231 | 6.6528 |
| Deadly II alone / with Bursting Poison per second | 7.4384544711926 | 5.5922684579199 |
| Combined-loadout Mana cost | 33 | 54 |

Direct arrow/conditional Fire-explosion damage, native Poison source, duration,
area, magnitude, stacks and deployment remain unchanged with this support alone.
Its 20-point support cost multiplier gives `floor(baseCost * 1.2)` in this
fixture; Efficiency II then gives `ceil(multipliedCost * .6)`. The combined
Prolonged/Bursting loadout uses both 1.2 factors before the floor. These
independent arithmetic checks do not simulate full-build sustain.

The source's storage coefficient and cap, the child's damage-from-storage,
maximum-Plague area and death trigger all lack native stat-map handlers in this
snapshot. Native child output is therefore **zero/unimplemented damage, not
evidence that the game burst does no damage**. No native number is substituted
for a missing storage simulation.

The child is player-owned, Area/Triggered, neither Attack nor Spell; it has
zero native Mana cost. That does not remove the parent's higher firing cost.
Native base radius 18 becomes 21 with Magnified II's 1.45 area multiplier:
`floor(18 * sqrt(1.45))`. The source's up-to-100%-more-area-at-maximum-Plague
effect remains unmodeled. Source cooldown .1 s displays as .132 s in the native
fixture; neither establishes actual burst frequency without qualifying deaths.

Independent source-unit examples keep values distinct: for a hypothetical
10000-Life enemy, the 20% storage cap is 2000, while 500 stored Plague supplies
500 base Physical damage at 100% conversion before other modifiers. This is
not a damage or time-to-cap calculator. Doubling area mathematically scales a
radius by the square root of two, not by two; maximum Plague is not assumed.

Evidence: `var/poison-bow-bursting-plague-20261109/`. Independent frozen fixtures:
`src/tree/poisonBowBurstingPlagueSupport.fixtures.ts`. The fixture uses an
empty-tree Witch, level-20 skills and a normal Crude Bow. Installed PoB and user
builds are untouched. Ordinary tests require no native installation or network.

- [Support and granted child source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L628)
- [Storage wording](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/StatDescriptions/gem_stat_descriptions.lua)
- [Granted-effect mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua)

Moving upstream references are not claimed byte-identical to the isolated runtime.
Source/native observations are not complete live-game validation.

## Coverage and Next Batch

Reviewed pairs 470 -> 472; support choices 42 -> 43; families 27 -> 28. Skills
remain 103/399 (98/234 positive-tier); supports 43/567 (43/450 positive-tier).
Preferences remain 184, main-tree wording 864/2182 and occurrences 3444/5451.
No source refresh or baseline reset.

The subsequent authorized [Poison I/II/III review](build-focus-poison-bow-poison-supports.md)
is recorded separately. The counts/checks here describe this historical
Bursting Plague checkpoint; further batches and deployment require approval.

## Verification

Focused regressions passed 331 tests across ten files. One
`npm run validate:release` passed 2805 tests across 125 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
67244 ms. The existing large-chunk advisory remains non-blocking (main
702.03 kB); no catalog refresh, baseline reset or route-quality audit.

An isolated Edge production-preview check passed both focuses, enemy-cap,
ownership, death-trigger and native-coverage notes, selection/removal, other
support families, manual-priority preservation on selection/Add suggestions,
goals, class start, point budget and saved-build load/reload. Completion
console: zero errors and warnings. Screenshot inspected for a nonblank tree
and readable, non-overlapping controls. User saves were isolated and the test
session closed. No CSS or browser-specific code changed; the existing Firefox
checkpoint was not repeated for this metadata extension.

The first local preview used the wrong base and failed to serve the production
JavaScript. Only this task's newly started preview process was restarted with
`--base /PoE2-Tree-Optimizer/`; no app configuration was changed. The repeated
browser check passed. HTML matched the current dist and the actual JavaScript
returned HTTP 200 as JavaScript (702039 bytes), not an HTML fallback.

Logs: `var/poison-bow-bursting-plague-20261109/`. Repeatable browser script and
screenshot: `output/playwright/poison-bow-bursting-plague-20261109/`.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

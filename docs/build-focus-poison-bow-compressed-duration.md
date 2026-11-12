# Compressed Duration I/II for Poison Bow Focuses

Two optional choices, one family and four reviewed pairs for Poisonburst Arrow
and Gas Arrow. Context-only duration trade-offs, not recommended Poison upgrades,
Full DPS multipliers or automatic priority changes.

## Effects and Boundaries

- I/II give 30%/35% less skill-effect duration. The source maps only Duration,
  unlike Swift Affliction's additional DamagingAilmentDuration modifier.
  The damage constant is zero; neither tier grants damage, Poison chance,
  magnitude, faster ticks or a Mana multiplier.
- Poisonburst's poison_duration_is_skill_duration links its burst Poison to
  the skill timer. Both tiers shorten that Poison, even though they do not
  directly modify generic damaging-ailment duration. The burst remains no-hit.
- Gas cloud lifetime is shortened; its outgoing Poison timer is separate and
  unchanged. Shorter persistence is not faster growth, more applications or
  guaranteed Fire-explosion frequency. Cloud expiry is not assumed to detonate.
- Actual-arrow Poison III/Bleed III controls keep their separate two-/five-
  second durations and magnitude. Neither support grants those ailments or
  makes synthetic burst/cloud source hits actual hits. The conditional Fire
  explosion gains no Poison eligibility or damage.
- Cost per use, attack rate, hit damage, area, Poison chance and stack cap stay
  unchanged with Compressed alone. Total damage, refresh cost, contacts and
  uptime remain unmodeled; unchanged native per-Poison output is not guaranteed
  unchanged whole-build/cloud DPS.
- Compressed, Swift and Prolonged are separate families. Tier replacement and
  removal retain other links and manual weights, goals, starts and budgets.
  No automatic duration priority or calculated compensation. No new scopes,
  parser, optimizer, point-counting, CSS or save schema. Shortest mode is
  unchanged. Other Duration skill pairs are not auto-admitted.

## Native and Independent Checks

The isolated PoB 0.23.1 runtime completed 47 MAIN calculations: baseline/two
tiers across all five parent components; actual-arrow Poison III and Bleed III;
independent skill-only penalties; 100% increased Skill Effect Duration;
Prolonged II; separate Poison-duration increases; and Compressed II + Swift II.
All four native links pass and all four missing-Duration controls reject.
Each calculation asserts active/stat set, equipped Bow, actually applied
supports and no assumed enemy Poisoned/Bleeding state.

Fixture: empty-tree Witch, level-20 skills, normal Crude Bow, sufficient
attributes. Installed PoB/user builds stay untouched. Evidence:
`var/poison-bow-compressed-duration-20261109/`; independent source/output
fixtures: `src/tree/poisonBowCompressedDurationSupports.fixtures.ts`.
Ordinary tests require no native PoB or network. These are source/native
observations, not in-game verification or a complete uptime simulation.

| Native timer | Baseline | Compressed I | Compressed II |
| --- | ---: | ---: | ---: |
| Poisonburst displayed skill timer | 3.003 s | 2.112 s | 1.980 s |
| Linked burst Poison | 3 s | 2.10 s | 1.95 s |
| Gas cloud lifetime | 4.026 s | 2.805 s | 2.607 s |
| Gas outgoing Poison | 2 s | 2 s | 2 s |
| Actual-arrow Poison III, either skill | 2 s | 2 s | 2 s |
| Actual-arrow Bleed III, either skill | 5 s | 5 s | 5 s |

Independent arithmetic confirms single factors 0.7/0.65, not squared penalties.
Native displayed skill timers round up to 0.033-second ticks; use the base
three/four seconds before rounding, not the already rounded baseline display.
Separate 30%/35%-less Skill Effect Duration controls reproduce both timers
and native per-Poison estimates exactly. Damaging-ailment-more stays one.

| Native Poison/s estimate | Baseline | Compressed I | Compressed II |
| --- | ---: | ---: | ---: |
| Poisonburst burst | 5.385766215481 | 5.0329003494532 | 4.9656386715656 |
| Gas cloud's outgoing Poison | 4.0038541776187 | 4.0038541776187 | 4.0038541776187 |

Poison magnitude stays one; the burst's duration-dependent roll-selection
estimate changes, not its tick speed. Gas's unchanged native per-Poison output
does not simulate lost cloud lifetime. Mana stays 38/62. Actual-arrow Poison
and Bleeding output is unchanged with their respective enabling supports;
their magnitude/chance are not supplied or boosted by Compressed.

### Other Duration Modifiers

100% increased Skill Effect Duration gives factors 1.4/1.3: burst Poison
4.2/3.9 seconds, cloud lifetime 5.610/5.214 seconds, outgoing Gas Poison still
two seconds. A separate 100% increased Poison Duration gives burst Poison six
seconds, or 3.9 with Compressed II; Gas outgoing Poison becomes four seconds
with or without Compressed II, without changing the cloud lifetime.

Prolonged II combines multiplicatively before native percentage precision:
0.7 * 1.35 -> 0.95 and 0.65 * 1.35 -> 0.88. Native burst Poison becomes
2.85/2.64 seconds, cloud lifetime 3.828/3.531, outgoing Gas Poison still two.
Prolonged's own Mana multiplier makes cost 45/74. These observations do not
claim calculated restoration of lost game uptime.

Compressed II + Swift II combines Duration-more as round(0.65 * 0.9, 2) = 0.59,
then Swift's separate ailment name contributes 0.9, giving 0.531. Native linked
burst Poison is 1.593 seconds and cloud lifetime 2.145 seconds; outgoing Gas
Poison remains at Swift II's 1.8 seconds. Swift's reviewed native overlap is
still explicit and exact game timing remains unverified; Compressed does not
introduce another damaging-ailment-duration modifier. No combined DPS score.

- [Compressed I source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1507)
- [Compressed II source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1543)
- [Native more-modifier precision](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Classes/ModList.lua#L118)

Moving upstream links are not claimed byte-identical to the isolated runtime.

## Coverage and Next Batch

Reviewed pairs 492 -> 496; support choices 51 -> 53; families 32 -> 33.
Supports are 53/567 (9.3%), or 53/450 positive-tier (11.8%). Skills remain
103/399 (98/234 positive-tier), preferences 184, main-tree wording 864/2182
and occurrences 3444/5451. No catalog refresh or baseline reset.

Successor: [Culling Strike I/II review](build-focus-poison-bow-culling-strike.md)
now separates eligible hits from no-hit Poison, enemy rarity, thresholds and
native effective-DPS estimates. This checkpoint's counts and verification below
remain historical. No deployment without authorization.

## Verification

Focused regressions passed 300 tests across six files. One
`npm run validate:release` passed 2915 tests across 131 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
76124 ms. The existing main-chunk advisory remains non-blocking (713.27 kB).
No catalog refresh, baseline reset or route-quality audit.

An isolated Edge production-preview smoke check passed all four pairs,
linked/separate timer notes, tier replacement, removal, other families and
manual Skill Effect Duration/Poison Duration weights on selection/Add suggestions.
No automatic support-priority action appeared. Final console: zero errors and
warnings; the initial unrelated favicon 404 was absent after reload. Screenshot
inspected for a nonblank tree and readable, non-overlapping controls. User saves
were isolated and the browser session closed. Parameterized DOM/JSON checks cover
disabled controls, goals, budgets and every tier's saved settings. Repetitive
browser save/reload and Firefox checks were not repeated: shared layout,
browser-specific code and persistence implementation did not change.

Logs: `var/poison-bow-compressed-duration-20261109/`. Repeatable smoke script and
screenshot: `output/playwright/poison-bow-compressed-duration-20261109/`.
The local preview was restarted with the project base path. Served HTML matched
current dist; actual entry JavaScript returned HTTP 200 as JavaScript (713274
bytes), not an HTML fallback. Scoped `git diff --check` passed with only the
existing README line-ending advisory.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

# Poison I/II/III for Poison Bow Focuses

Poison I/II/III are reviewed for Poisonburst Arrow's Poison burst and Gas
Arrow's Poison cloud: three choices, one family and six reviewed pairs. These
are optional support notes, not an automatic loadout or Full DPS calculation.

## Behavior and Boundaries

- Poison I gives 40% chance to Poison on eligible hits; II and III give 60%.
  This is flat on-hit chance, not increased chance, Poison magnitude, tick
  speed or additional stack capacity. It can enable Poison from the separate
  arrow hits, but the selected burst/cloud already applies Poison inherently
  without hitting. Extra chance does not strengthen that inherent Poison.
- Tier III separately supplies 20% more Poison magnitude against a Bleeding
  enemy. It does not supply Bleeding, and Bleeding/uptime are not assumed in
  the app. With no explicit Bleeding input, native burst/cloud output remains
  unchanged for all three tiers. No automatic conditional score bonus is added.
- Gas Arrow's conditional Fire explosion is outside the cloud focus. A chance
  field alone does not make its Fire damage eligible to Poison. The reviewed
  native fixture has no Poison damage from that explosion, even with III and
  Bleeding enabled. Special all-damage eligibility or added damage is not inferred.
- Direct-hit damage, Poison/skill duration, area, firing rate and stack limits
  stay unchanged with these supports alone. Poisonburst's initial arrow must
  still hit. Its arrow's separate two-second on-hit Poison is not the burst's
  three-second linked Poison. Gas cloud lifetime and outgoing Poison remain
  separate, as do growth, overlap and conditional Fire detonation.
- All tiers increase supported-skill cost through the same 20-point Mana
  multiplier. They share the Poison family: selecting a tier replaces only
  that family's previous tier. They do not replace Deadly Poison or Escalating
  Poison. Removing a tier does not modify adopted manual priorities.
- Manual Poison/Bleeding chance weights, other preferences, goals, starts,
  budgets and other support families are retained. Suggestions, exclusions and
  passive scopes are unchanged; no arrow-hit/critical/minion scope is promoted
  into the inherent Poison focus. No parser, optimizer, point-counting, CSS or
  save-schema changes. Shortest mode is unchanged.

## Native and Independent Evidence

The isolated PoB 0.23.1 runtime performed 43 MAIN calculations. Baseline,
each tier and III with Bleeding cover all five parent components. Further
checks cover Bleeding without III, II with Bleeding, an independent 20%-more-
Poison-magnitude modifier, Efficiency II, Escalating Poison with/without
Bleeding, combined Escalating/Deadly/Efficiency and over-cap chance controls.
Six native compatibility predicates pass; removing all accepted parent types
rejects all six links. Every calculation asserts the requested active/stat set,
actual equipped Bow, applied support IDs and actual enemy Bleeding condition.

The fixture is an empty-tree Witch, level-20 skills, normal Crude Bow and
sufficient attributes. Installed PoB/user builds remain untouched. Evidence:
`var/poison-bow-poison-supports-20261109/`. Independent frozen observations:
`src/tree/poisonBowPoisonSupports.fixtures.ts`. Ordinary tests require neither
a native PoB installation nor network. Source/native checks are not game testing.

| Native inherent-Poison output | Poisonburst burst | Gas cloud |
| --- | ---: | ---: |
| Baseline / I / II / III without Bleeding, Poison per second | 5.385766215481 | 4.0038541776187 |
| III with explicit Bleeding, Poison per second | 6.4629194585772 | 4.8046250131425 |
| Bleeding-only / II-with-Bleeding, Poison per second | 5.385766215481 | 4.0038541776187 |
| Magnitude without / with III's Bleeding condition | 1 / 1.2 | 1 / 1.2 |
| Effective Poison chance, all tiers | 100% | 100% |
| Baseline -> each tier Mana cost | 38 -> 45 | 62 -> 74 |
| III + Efficiency II Mana cost | 27 | 45 |
| Unchanged outgoing Poison duration | 3 s | 2 s |
| Unchanged displayed skill duration | 3.003 s | 4.026 s |

Native raw inherent chance becomes 140/160/160 but caps at 100. III plus a
separate +60-point chance control gives raw 220, still capped at 100 with
unchanged Poison output. Arrow-hit raw chance instead becomes 40/60/60, from
zero; III plus that same control gives raw 120 capped at 100. These checks
distinguish percentage-point addition from multiplying chance or damage.

With explicitly enabled Bleeding, III exactly matches the independent
Poison-magnitude-only control. Independent checks verify `basePoison * 1.2`
in these fixed fixtures; merely enabling Bleeding or using II does not add
the modifier. Escalating plus III retains a cap of two and shorter duration;
Bleeding changes magnitude, not capacity or application rate. Deadly II and
III's active condition combine as `2 * 1.2 = 2.4` magnitude, not 2.2, with
Deadly's separate hit penalty. These are not whole-build/whole-route multipliers.

Separate arrow observations:

| Native arrow-hit Poison output | Poisonburst arrow | Gas arrow |
| --- | ---: | ---: |
| Poison I per second | 4.1328 | 1.4112 |
| Poison II / III without Bleeding per second | 4.5657724526838 | 1.5383141032889 |
| Poison III with explicit Bleeding per second | 5.4789269432206 | 1.8459769239466 |
| Unchanged arrow hit damage | 5.38125 | 1.8375 |

These native arrow estimates use PoB's continuous-application/roll assumptions,
not verified contact rates. The app does not combine them with burst/cloud
output or assume independent sustained Poison stacks. Gas Fire-explosion
chance/magnitude fields are not evidence of an eligible damage source.
Costs independently check `floor(baseCost * 1.2)` and then Efficiency II's
`ceil(multipliedCost * .6)`; total Mana sustain is not modeled.

- [Poison I source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3846)
- [Poison II source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3876)
- [Poison III condition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L3906)

Moving upstream references are not claimed byte-identical to the isolated runtime.

## Coverage and Next Batch

Reviewed pairs 472 -> 478; support choices 43 -> 46; families 28 -> 29. Skills
remain 103/399 (98/234 positive-tier); supports 46/567 (46/450 positive-tier).
Preferences remain 184, main-tree wording 864/2182 and occurrences 3444/5451.
No source refresh or baseline reset.

The proposed successor, Admixture, was subsequently reviewed for both focuses.
See [its checkpoint](build-focus-poison-bow-admixture.md) for reciprocal
conditions, the native Poison III interaction and the next proposed batch.
The figures and verification below remain this batch's historical checkpoint.

## Verification

Focused regressions passed 348 tests across eleven files. One
`npm run validate:release` passed 2822 tests across 126 files, typecheck,
production build, graph validation and the unchanged coverage baseline in
66117 ms. The existing large-chunk advisory remains non-blocking (main
704.30 kB); no catalog refresh, baseline reset or route-quality audit.

An isolated Edge production-preview check passed all six pairs, tier-family
replacement, chance/inherent-Poison notes, explicit Bleeding cautions, removal,
other support families, manual-priority preservation on selection/Add
suggestions, goals, class start, budget and saved-build load/reload. Completion
console: zero errors and warnings. The initial unrelated favicon 404 was absent
after reload. Screenshot inspected for a nonblank tree and readable,
non-overlapping controls. User saves were isolated and the test session closed.
No CSS or browser-specific code changed; the existing Firefox checkpoint was
not repeated for this metadata extension.

Logs: `var/poison-bow-poison-supports-20261109/`. Repeatable browser script and
screenshot: `output/playwright/poison-bow-poison-supports-20261109/`.
The preview used `--base /PoE2-Tree-Optimizer/`; served HTML matched the current
dist and the actual JavaScript returned HTTP 200 as JavaScript (704301 bytes).
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

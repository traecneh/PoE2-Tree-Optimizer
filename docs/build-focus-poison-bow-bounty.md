# Bounty I/II for Poison Bow Focuses

Two optional choices, one family and four reviewed pairs for Poisonburst Arrow
and Gas Arrow. Hit-kill reward utility, not Poison damage or guaranteed sustain.

## Kill Requirement Before Rewards

- Both parents pass native hit-capable-parent compatibility. However, detailed
  game-generated stat wording requires enemies killed by Hits from the
  supported skill. This is more specific than the broad gem description.
  Merely applying Poison, hitting without killing, or being in a party does
  not establish the qualifying killing hit.
- Poison damage-over-time deaths are not hit kills. Poisonburst's initial
  arrow may supply the killing hit; its no-hit burst/linked Poison cannot.
  Gas's arrow or separately triggered Fire-explosion hit may supply it; the
  no-hit cloud/Poison cannot. Ignition/detonation and contacts are not supplied.
  Minion/party/other-skill kills and separate triggered effects are not assumed
  to belong to this skill. Special kill-attribution rules are not simulated.
- I/II grant 50%/100% more Life Flask charges, Mana Flask charges and Charm
  charges on eligible kills: factors 1.5/2 per applicable reward channel.
  These are not flat added charges, increased-charge modifiers, three stacked
  multipliers on a single reward, healing/Mana recovery amounts, charge
  generation per second, capacity, cheaper uses or free Charm activations.
- No contact, kill frequency, enemy payout, cap/rounding behavior, Flask/Charm
  uptime or boss sustain is assumed. The support does not cause damage, supply
  kills or guarantee flask use. Neither tier adds a Mana cost multiplier.
- Tier replacement/removal preserves other links, previous Blindside cautions,
  manual charge/Poison weights, required goals, starts and point budgets.
  No automatic utility priorities, new passive scope, parser/solver changes,
  point-count changes or save schema. Shortest mode is unchanged. Unreviewed
  skill/support pairs are not auto-admitted.

## Native Coverage Boundary

The isolated PoB 0.23.1 runtime contains all three conditional reward stats
in generated gem data/stat text but has no calculation mappings for them.
Native charge-more modifiers remain one and charge increases zero with either
Bounty tier. These are missing model effects, not zero in-game rewards.

Independent +50%/+100%-more Life/Mana Flask and Charm charge controls produce
raw modifier factors 1.5/2, while the generic Flask factor remains one. These
controls verify modifier separation/arithmetic only. They do not prove that
the actual Bounty support simulates a killing hit, payout or full flask loop.
No runtime patch, fake kill-rate input or universal on-kill assumption.

## Native and Independent Checks

25 isolated MAIN calculations: empty-tree Witch, level-20 skills, normal Crude
Bow and sufficient attributes. Active/stat set, equipped Bow, applied links
and effective mode are asserted. Enemy Poisoned/Bleeding are off; boss mode
is explicitly None. Installed PoB and user builds are untouched. No Flask or
Charm is equipped and no kill-event simulation is claimed.

- 15 baseline/I/II rows across all five parent components.
- 6 actual-arrow Poison III rows: both parents, baseline and each Bounty tier.
- 4 explicit charge-modifier controls: both parents and both magnitudes.
- Four compatible links and four missing-hit-type rejection controls.

| Native value | Baseline | Bounty I | Bounty II |
| --- | ---: | ---: | ---: |
| Poisonburst synthetic source hit | 5.38125 | Same | Same |
| Gas synthetic source hit | 4.33125 | Same | Same |
| Poisonburst burst Poison/s estimate | 5.385766215481 | Same | Same |
| Gas outgoing Poison/s estimate | 4.0038541776187 | Same | Same |
| Burst linked Poison / displayed skill timer | 3 / 3.003 s | Same | Same |
| Gas outgoing Poison / cloud timer | 2 / 4.026 s | Same | Same |
| Actual-arrow Poison III, Poisonburst / Gas | 4.5657724526838 / 1.5383141032889 | Same | Same |
| Base Mana cost, Poisonburst / Gas | 38 / 62 | Same | Same |
| With Poison III, Mana cost | 45 / 74 | Same | Same |

Native hits, TotalDPS/CombinedDPS, Poison magnitude/chance/stacks, timers, area,
speed, costs and recovery outputs match their respective controls exactly.
Poison magnitude stays one, stack cap one, inherent chance 100%, actual-arrow
Poison III chance 60% with its separate two-second duration. Native synthetic
source hits do not turn no-hit Poison into qualifying killing hits.

Independent source fixtures check reward arithmetic per channel using abstract,
uncapped base charges [2, 4, 6]: I gives [3, 6, 9], II [4, 8, 12]. These are
not actual enemy payouts or predicted charge rates. Ordinary tests also verify
that conditional reward wording does not become an unconditional passive value
or alter manual Flask/Charm/Poison route scores.

Evidence: `var/poison-bow-bounty-20261109/` (driver, native JSON, verifier/logs).
Independent ordinary-test fixtures: `src/tree/poisonBowBountySupports.fixtures.ts`.
Tests require neither native PoB nor network. Source/native verification, not
in-game kill-credit or uptime verification. Existing native startup missing-node
notices are retained and do not affect the empty-tree fixture. The first
verifier log preserves a JSON-array indexing error; the corrected verifier
uses zero-based JavaScript indexing without altering native data/calculations.

- [Bounty I/II generated source](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L565)
- [Detailed kill requirement and Mana reward wording](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/StatDescriptions/gem_stat_descriptions.lua#L25419)

Moving upstream links are not claimed byte-identical to the isolated runtime.

## Coverage and Next Batch

Reviewed pairs 506 -> 510; support choices 58 -> 60; families 36 -> 37.
Supports are 60/567 (10.6%), or 60/450 positive-tier (13.3%). Each Poison
focus now has 36 choices. Skills remain 103/399 (98/234 positive-tier),
preferences 184, main-tree wording 864/2182, occurrences 3444/5451. No catalog
refresh or baseline reset.

The proposed successor is now covered in the [Maim checkpoint](build-focus-poison-bow-maim.md).
Counts and verification below remain the historical Bounty checkpoint.

## Verification

Focused regressions passed 303 tests across six files before the final
clarifying healing/generation sentence. One `npm run validate:release` then
passed 2989 tests across 135 files, typecheck, production build, graph validation
and the unchanged coverage baseline in 64726 ms, including the final notes.
The existing main-chunk advisory remains non-blocking (722.58 kB). The corrected
native all-row verifier passed all 25 calculations; the initial verifier error
log is retained separately. No catalog refresh, baseline reset or route audit.

An isolated Edge production-preview smoke check passed I/II for both focuses:
36 reviewed choices each, hit-kill/reward/recovery boundaries, native coverage
notes, tier replacement, removal, other links, preserved Blindside warnings and
manual Flask Charges/Charm Charges/Poison Magnitude weights on selection and
Add suggestions. No automatic support-priority action appeared. Final console:
zero errors/warnings and no page errors; the initial unrelated favicon 404 was
absent after reload. Screenshot inspected for a nonblank tree and readable,
non-overlapping notes/controls. User saves were isolated and browser session
closed. DOM/JSON checks cover disabled controls, class, goals, budgets and both
tiers' saved settings. Repetitive browser save/reload and Firefox checks were
not repeated: layout, persistence and browser-specific code did not change.

Logs: `var/poison-bow-bounty-20261109/`. Repeatable smoke script and screenshot:
`output/playwright/poison-bow-bounty-20261109/`. The preview was started with the
project base path; served HTML and actual entry JavaScript matched current
dist. Entry returned HTTP 200 as JavaScript (722582 bytes), not HTML fallback.
Scoped `git diff --check` passed with only the existing README line-ending
advisory. Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or live deployment.

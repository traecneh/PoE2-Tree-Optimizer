# Unconditional Recovery Preferences

Reviewed on 2026-11-07 against the bundled PoE2 0.5.5f graph, official PoB source
and the isolated local PoB 0.23.1 native parser. No graph, assets, shortest solver,
gem/support allowlists or preset priorities changed.

## Rules and Interface

Four optional preferences use the existing effect picker, priority and remove
controls. Each Normal score unit represents 10% of its literal modifier;
High/Highest multiply the heuristic score by two/three.

| Preference | Group | Complete unconditional wording |
| --- | --- | --- |
| ES Recharge Start | Defence | N% faster/slower start of Energy Shield Recharge |
| ES Recharge Rate | Defence | N% increased/reduced Energy Shield Recharge Rate |
| Life Regeneration Rate | Defence | N% increased/reduced Life Regeneration rate |
| Mana Regeneration Rate | Utility | N% increased/reduced Mana Regeneration Rate |

Faster/increased is positive; slower/reduced is negative. Case/whitespace and
decimal values are normalized. Only full exact lines match. Conditional,
Shapeshifted, stationary, recent-event, per-minion/charge, enemy/minion-owned,
more/less, flat-regeneration and override/conversion wording is not included.
The conditional Life-and-Mana regeneration effect on Licking Wounds is excluded.

Timing, rate and maximum pools are separate preferences: none is copied into
another. Only selected effects score. No focus selection, preset or support
automatically adds these effects or changes their priorities. Existing storage
and JSON transfer retain the new IDs without a schema migration; old lists stay
unchanged. Required goals, point budgets and committed-base allocation behavior
are unchanged.

Tooltips explain that these are modifier percentages, not actual regeneration or
recharge per second. Life rate needs existing regeneration. Disabled/replaced
recharge, regen prohibitions, interruptions, spending, conversion, pool sizes and
sustain are not simulated. An unselected negative effect has no penalty, just as
other unselected preferences do; manually review the whole node/build.

## Native Evidence and Arithmetic

PoB's [recovery names](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L170-L183)
distinguish LifeRegen/ManaRegen from maximum Life/Mana. Its
[recharge names](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L235-L238)
distinguish EnergyShieldRecharge from EnergyShieldRechargeFaster.
The isolated native parser/ModDB probe checked all four modifiers and both signs,
including a synthetic unconditional reduced Mana regeneration line (none is in
the current main-tree batch). Parsing consumed complete lines and returned the
correct signed INC values. The copied runtime's existing missing-node startup
messages did not prevent these focused checks.

[Recharge calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua#L1768-L1769)
divides base delay by one plus the faster-start modifier. For a synthetic
four-second base, +20% faster means 4/1.2 = 3.333 seconds, not 3.2; 20% slower
means 4/0.8 = 5 seconds. These examples do not assert the game's current base
delay. Our score deliberately does not convert modifiers into seconds.

## Coverage and Tradeoffs

The main tree gains 182 recognized stat occurrences across 177 nodes:

- Recharge start: 78 nodes (77 faster, one slower).
- Recharge rate: two nodes (one increased, one reduced).
- Life regeneration rate: 32 nodes (31 increased, one reduced).
- Mana regeneration rate: 70 increased nodes.

Notable fixtures include Rapid Recharge (17973: +12 start, +12 rate),
Convalescence (36623: +20 start, -10 rate), Patient Barrier (62230: +50 maximum
ES, -20 start), and Adverse Growth (4295: -20 Life regeneration rate). Other
effects on these nodes are not invented as recovery rewards.

The tracker moves from 34 to 38 preferences and from 1,666/5,451 (30.6%) to
1,848/5,451 (33.9%) recognized main-tree occurrences. Distinct recognized
wordings increase from 292 to 320. The old baseline passed before refresh; the
new reviewed baseline now protects the added wording in every base focus.

## Verification

- `validate:quick`: 489 tests across 13 files, typecheck and baseline passed.
- `validate:release`: 806 tests across 57 files, typecheck, production build,
  graph validation and updated baseline passed.
- Native parser/ModDB checks passed for each modifier/sign. Unit checks cover
  decimals/zero, exact boundaries, exclusions, pools versus recovery, opt-in
  scoring, current-tree counts, storage/transfer and control help.
- Routing fixtures cover negative required goals, Convalescence/Rapid Recharge
  tradeoffs, selected/unselected preferences, budgets, shared-node counting,
  committed-base exclusions and unchanged shortest results.
- One Edge batch smoke check selected all four preferences, required
  Convalescence and optimized with zero extra points. The exact shortest baseline
  and selected route both used 19 points. Four start nodes totaled +38%, giving
  +3.8; Convalescence's -10% rate gave -1.0; independent total 2.8 matched the UI.
  Applying retained that count and the positive/negative summary lines.
- Desktop 1100x760 and mobile 390x844 controls/tooltips were inspected without
  horizontal overflow. Only the existing initial favicon 404 appeared; no
  application console errors or warnings. Repeated save/load browser runs were
  unnecessary because focused persistence/transfer tests cover the new IDs.

This verifies heuristic matching and arithmetic, not actual sustain or globally
optimal weighted routes. Next recommended batch: unconditional Accuracy Rating,
Block Chance and Stun Threshold, with reductions and explicit caps/gear caveats.

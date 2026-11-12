# Unconditional Accuracy, Block and Stun Threshold

Reviewed on 2026-11-07 against the bundled PoE2 0.5.5f graph, official PoB source
and the isolated local PoB 0.23.1 native parser. No graph, assets, shortest solver,
weighted algorithm, gem/support allowlists or preset priorities changed.

## Scope and Controls

Three opt-in preferences use the existing effect picker and priority/remove
controls, with details in their existing hover tooltips:

| Preference | Group | Complete unconditional wording |
| --- | --- | --- |
| Accuracy Rating | Offence | N% increased/reduced Accuracy Rating |
| Block Chance | Defence | N% increased/reduced Block chance |
| Stun Threshold | Defence | N% increased/reduced Stun Threshold |

Each Normal score unit represents 10% of its literal modifier; higher priorities
multiply that heuristic score by two/three. Increased is positive; reduced is
negative. Only selected effects score. Existing preset suggestions, manual
priorities and saved builds are not automatically expanded. New IDs round-trip
through storage and JSON transfer without a schema migration.

Matching normalizes case/whitespace, accepts decimal numbers, and requires the
whole line. Conditional, per-stat/charge, enemy/minion-owned, weapon-only,
more/less, malformed and unknown combined-effect lines stay excluded. Flat
accuracy, maximum Block Chance, Spell Block Chance, threshold conversions,
Stun Buildup, Stun Recovery and stun immunity are separate mechanics, not aliases.

These are modifier scores, not final hit/block probability, DPS or effective
survivability. Accuracy is an attack stat; block needs a block-capable setup.
Gear, evasion, caps, distance, cannot-miss effects, threshold bases/conversions,
active block and stun immunity are not simulated. A negative effect only costs
score when its preference is selected; manually review other node tradeoffs.

## Native Evidence and Independent Arithmetic

PoB's [parser mappings](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
keep Accuracy, BlockChance and StunThreshold separate from maximum block and
enemy stun threshold. Its
[defence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua)
derive hit chance using both ratings and apply increased/reduced block to base
block before caps; modifier percentages are not final probability points.

The isolated native parser/ModDB check consumed six complete lines, one increase
and reduction for each category. Each produced the expected signed INC value,
and BASE was zero. Synthetic reduced Block Chance and Stun Threshold lines were
included because the current main tree contains no unconditional reductions of
those two types. The copied runtime's existing missing-node startup messages did
not prevent these checks; no installed PoB build/settings were modified.

An independent synthetic example uses 25 base block and +20% increased block:
25 * 1.2 = 30, not 45 percentage points. This is not a real-character estimate.
Scoring a node with -10 accuracy, +30 block and +16 threshold at Normal gives
-10/10 + 30/10 + 16/10 = 3.6, matching the pure scorer.

## Coverage and Fixtures

The batch recognizes 147 main-tree stat occurrences across 145 unique nodes:

- Accuracy Rating: 53 occurrences, including Frantic Reach's reduction.
- Block Chance: 51 occurrences.
- Stun Threshold: 43 occurrences.

Frantic Reach (39911) retains +18 attack area and -20 accuracy independently.
Core of the Guardian (6133) retains +30 block and -20 maximum ES independently.
Eagle Eye (19104) scores +10% accuracy but not its flat +30 accuracy.
Grounded in the Earth (25429) retains duration and threshold separately.
Vigilance (22967) scores +12 block but not maximum block or Life gained on block.

Coverage increases from 38 to 41 preferences, from 1,848/5,451 (33.9%) to
1,995/5,451 (36.6%) recognized main-tree occurrences, and from 320 to 348 distinct
recognized wordings. No previously covered wording was lost; graph/catalog
fingerprints were unchanged. Only after reviewing the 28 new exact wordings was
the coverage baseline deliberately refreshed. This percentage is heuristic
effect coverage, not project completion or Full DPS support.

## Verification

- `validate:quick`: 510 tests across 14 files, typecheck and old baseline passed.
- `validate:release`: 827 tests across 58 files, typecheck, production build,
  graph validation and refreshed coverage baseline passed.
- Pure checks cover both signs, decimals/zero, exclusions, opt-in scoring,
  current-tree counts and unchanged preset behavior.
- Route fixtures verify required negative goals, Frantic Reach and Core of the
  Guardian tradeoffs, selected/unselected effects, budgets, base exclusions,
  shared-node counting and unchanged shortest results.
- Control tests cover all three existing picker/priority/remove flows and scope
  help. Storage and JSON transfer retain the new priorities and existing budgets.
- Coverage-test unsupported fixtures now use a deliberately unknown effect,
  rather than a real stat that becomes supported in a later batch.
- No repeated browser layout/save-load matrix was needed: controls and layout
  were unchanged and focused DOM/persistence tests cover this metadata addition.

Next recommended batch: unconditional Critical Damage Bonus, Stun Buildup and
Freeze Buildup, including reductions and clear separation from critical chance,
stun resistance and actual ailment application. The current backlog contains
38, 48 and 47 increased occurrences respectively. These are proposed, not added.

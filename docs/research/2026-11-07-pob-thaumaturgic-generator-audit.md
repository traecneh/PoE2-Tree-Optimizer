# Thaumaturgic Generator Audit

Measured November 7, 2026, using the isolated copy of PoB for PoE2 0.23.1 and
the captured [public Warbringer export](https://poe.ninja/poe2/pob/2b47e).
This is offline research; no website behaviour, personal build, or installed PoB
file was changed.

## Findings

Thaumaturgic Generator is an **anointment-only notable**, node **56666**, in the
local 0.5.5f `PassiveSkills` table. Its absence from our routable graph is expected,
not evidence of a missing travel connection. Its game-table ID is
`DeliriumAnoint_ThaumaturgicGenerator`, with `IsAnointmentOnly=true`,
`IsNotable=true`, and `PassiveSkillBuffs=[608]`.

PoB resolves the amulet's `Allocates Thaumaturgic Generator` modifier to that same
node. The node is present in the calculation environment's granted passives, but
not in the paid tree allocation. It adds **zero passive points**.

Its PoB description is `Grants Thaumaturgical Dynamism`. The native modifier parser
leaves that entire effect text unrecognized and produces zero modifiers. The
node's calculation modifier list is also empty. In this PoB version, identifying
the anoint is supported, but calculating this buff's effects is not.

**This does not mean the anoint has no benefit in-game.** We did not simulate its
timing or charge generation, change charge settings, invent replacement modifiers,
or independently verify its full in-game buff behaviour. General damage/EHP and
rotation accuracy remain outside this audit.

## Controlled Comparison

The active equipment set is `4`, with amulet `27`, Horror Rosary. The experiment
reloads complete XML for each of four variants in both W1 and W2:

1. Original anoint.
2. Only that anoint removed.
3. Only that anoint replaced with Beef, a known-working `+25 to Strength` control.
4. Original anoint restored.

Removing an enchanted line also decrements PoB's serialized `Implicits` count by
one. Assertions check that every remaining parsed amulet modifier stays in its
original enchant/implicit/explicit/rune category. All other item records and XML
sections, paid allocations, weapon assignments, jewels, attribute choices, skills,
configuration, class, ascendancy, level, and selected skill are preserved.

| Measurement | W1 | W2 |
| --- | ---: | ---: |
| Shared paid main points | 96 | 96 |
| Active weapon points | 24 | 24 |
| Active main total | 120 | 120 |
| Ascendancy points, separate | 8 | 8 |
| Extra paid points from the anoint | 0 | 0 |
| Original Strength | 199 | 199 |
| Beef-control Strength | 224 | 224 |
| Original Life | 3,054 | 3,054 |
| Beef-control Life | 3,108 | 3,108 |
| Original selected-skill CombinedDPS | 0 | 389,098.8882456 |
| Scalar outputs compared after anoint removal | 551 | 694 |
| Changed scalar outputs after removal | 0 | 0 |

All variants retain the same point counts. The raw union main count is 144:
`96 + 24 + 24`. That is not the active shared cost or 144 simultaneously active
main points. Four jewel sockets are included in the paid main allocation, not
added again. The class and ascendancy roots cost zero.

The independent verifier counts unique source IDs against the game graph rather
than accepting PoB's cost fields alone. For the control it checks
`199 + 25 = 224`. A fresh calculation environment also agrees with the standard
calculator's Strength and selected-skill damage. This is a narrow arithmetic and
cost check, not an independent reimplementation of all PoB formulas.

W1's zero damage is preserved from the author's selected skill/loadout. There are
no enabled Full DPS groups; the experiment does not change that configuration to
manufacture a different baseline. Original outputs, active W2 selection, and
complete item/paid-tree context restore successfully at the end.

## Evidence and Reproduction

Ignored artifacts: `var/pob-item-grant-audit-20261107/warbringer/`.

- `source-build.xml`: SHA-256
  `e73f5da708627c43124bef7b310baa86b16c3dd78d8c75990e8f14abd52dd7e8`.
- `item-grant-audit.json`: native calculation outputs and preservation assertions.
- `item-grant-verification.json`: 248 passing checks and hashes of output, graph,
  and raw passive-table evidence.
- Game table: `var/refresh-0.5.5f/tables/English/PassiveSkills.json`, row `_index=5989`.
- Game stat-description key: `ascendancy_gemling_charge_generator_buff_display`
  in `Data@StatDescriptions@passive_skill_stat_descriptions.csd`.
- Seven new regression tests, including deliberately wrong costs, missing output,
  broken positive control, missing grant evidence, and failed restoration.
  The complete offline audit suite passes 88 tests.

Primary PoB source for the measured version:
[grant resolution and paid counts](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/v0.23.1/src/Classes/PassiveSpec.lua),
[calculation-environment grants](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/v0.23.1/src/Modules/CalcSetup.lua),
[modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/v0.23.1/src/Modules/ModParser.lua).
The runtime measurements, not the presence of a display string alone, establish
the support limitation reported here.

From the repository root, using the already prepared isolated runtime:

```powershell
$job = "var/pob-item-grant-audit-20261107/warbringer"
node node_modules/tsx/dist/cli.mjs tools/pob-evaluation/prepare_real_audit.ts var/pob-second-build-audit-20261107/sources/warbringer.txt $job https://poe.ninja/poe2/pob/2b47e --profile life-armour --attribute Strength
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver tools/pob-evaluation/audit_item_grant.lua --job $job
node tools/pob-evaluation/verify_item_grant.mjs $job var/refresh-0.5.5f/tables/English/PassiveSkills.json
node --test tools/pob-evaluation/item-grant.check.mjs
```

## Recommended Next Step

Add a runtime **effect-coverage report** to the offline evaluation workflow:
resolve item grants against PoB's full node catalog, distinguish anointment-only
identity from routable nodes, and carry unsupported/partially parsed effect text
into the requirement comparison before performance ranking. A calculation can
be reproducible while omitting an important mechanic; it must not be described as
fully verified or interpreted as proof that the omitted mechanic is worthless.

Keep this separate from implementing a charge/uptime model or adding a website
performance mode. This task did not change the existing preflight or ranking policy.

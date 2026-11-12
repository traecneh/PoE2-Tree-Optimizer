# Charm Charge Gain, Generation, Cost and Effect Duration

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and isolated PoB runtime. Four opt-in Utility preferences. No graph/assets,
point-cost, solver, shared-control, save/transfer schema, gem or support changes.
Shortest routing and existing saved priorities remain unchanged.

## Matching and Units

| Preference | Complete unconditional wording | Normal unit |
| --- | --- | --- |
| Charm Charges Gained | N% increased/reduced Charm Charges gained | 10% increased |
| Charm Charges per Second | Charms gain N charge/charges per Second | 0.1 charges per second |
| Charm Charge Cost Reduction | N% reduced/increased Charm Charges used | 10% reduced |
| Charm Effect Duration | N% increased/reduced Charm Effect Duration | 10% increased |

Gain and duration increases are favorable; reductions penalize. Cost reductions
are favorable; increased cost penalizes. Flat generation accepts nonnegative
displayed values and singular/plural charge wording. Signed negative/positive
flat-generation syntax is excluded after native parser probes fail; no current
raw source in this batch is negative generation. Zero, decimals and cancellation
are tested where applicable. Normal units are manual normalization, not power
or uptime estimates; High/Highest multiply by two/three.

Raw game generation uses charges per minute, but graph wording is already per
second. Vale Shelter's raw value 9 becomes 0.15 charges per second; the scorer
uses that value once, without dividing by 60 again. Generation is not a gain
percentage, an immediate charge grant on activation or an assumed trigger rate.
The scorer does not multiply gain, generation, cost and duration into uptime.

Only complete unconditional player wording matches. Conditional/recent/per-charge,
from-Kills, shared/other ownership, more/less, unknown composites, malformed
numbers and unreviewed aliases remain excluded. Charm effect magnitude, slot
count, cooldowns, charge capacity, free-use chance, no-charge overrides, on-use
recovery and cannot-use mechanics are not assigned scores by these preferences.
No skill preset/support automatically selects them.

## Charm and Flask Separation

Charm-only lines do not create any Flask gain/generation/cost/duration/recovery
values. Flask-only lines do not create Charm values. Existing Flask normalization
and scores remain unchanged. Global stat namespaces are distinct even though
native item-local Charm data uses some legacy Flask keys internally; that is
not permission to alias Charm-only global wording into Flask preferences.

Exact 'Flask and Charm Charges gained' wording genuinely supplies both native
item-type modifiers. Its Flask benefit contributes once under Flask Charges
Gained and its Charm benefit once under Charm Charges Gained, if selected. It
does not imply Life/Mana-specific gain, flat generation, duration or effect.
Selecting both preferences represents two real item-type benefits, not two
allocated nodes: shared-route point cost still counts the node once. Separate
genuine Charm-only, Flask-only and combined lines add independently.

All preferences require applicable Charms. Charge sources, item requirements,
slot limits, caps, rounding/minimum costs, trigger conditions, prohibitions and
actual activation or uptime are not calculated. Duration does not activate a
Charm or strengthen its effect. The tooltips explicitly retain these limits.

## Primary Sources and Native Evidence

Reviewed PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[Charm merge calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua),
[item tooltip calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Classes/ItemsTab.lua)
and local game descriptors. Moving upstream links do not establish byte identity
with the tested isolated snapshot. Personal builds/settings remain unchanged.

Nine native forms parse completely: signed INC CharmChargesGained,
CharmChargesUsed and CharmDuration; BASE CharmChargesGenerated; and signed
combined CharmChargesGained plus FlaskChargesGained. None creates a minion
modifier. All other captured Charm/Flask fields stay at baseline unless their
exact source is present. Generation remains BASE 0.15, not INC 15 or 0.15 / 60.
Player modifiers do not transfer to an ordinary Skeletal Sniper.

Real manually selected, zero-quality Thawing Charm and Greater Life Flask
fixtures check item separation. The Charm supplies actual native Freeze
protection in the active fixture. Charm duration/charge modifiers do not
strengthen that immunity or alter Flask fields. Flask-only modifiers do not
alter Charm fields. 'Cannot use Charms' leaves raw modifiers present but sets
the native Charm limit to zero and removes its Freeze protection. Raw preference
sources therefore do not guarantee an active benefit.

The item-local Charm data remains duration 3 seconds and cost 40 charges;
global modifiers are held separately. The reviewed tooltip formula multiplies
item-local duration by 1 + global CharmDuration / 100, giving 3.6 seconds for
20% increased duration. That is an independent reconstruction of the reviewed
formula, not an exported final-duration field or measured game activation.
Native charge fields expose raw modifiers; this audit does not validate a full
charge-consumption/recharge/trigger simulation or sustained uptime. No final
resource-flow calculation is invented by the app.

All source occurrences independently trace to extracted game stats:

| Raw stat ID | Main-tree occurrences | Notes |
| --- | ---: | --- |
| charm_charges_gained_+% | 7 | Increased Charm-only gain |
| generate_x_charges_for_charms_per_minute | 1 | Raw 9 -> displayed 0.15 per second |
| charm_charges_used_+% | 3 | Negative raw cost is favorable |
| charm_duration_+% | 3 | Duration, not effect magnitude |
| charges_gained_+% | 3 | Existing shared Flask-and-Charm wording |

Six new wordings add 14 previously unmatched occurrences. Three already-covered
shared occurrences now additionally supply their Charm value; they are not
reported as three newly recognized stat occurrences. The four preferences
match 17 source occurrences across eight distinct wordings. Primal Protection
retains independent gain/duration values. Efficient Alchemy's conditional
recovery remains unsupported rather than being inferred from shared charges.

Ignored reproducible evidence: `var/charm-preferences-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/charm-preferences-20261108/native-check.lua --job var/charm-preferences-20261108
node var/charm-preferences-20261108/verify.mjs
```

Nine complete forms, 24 actor/item fixtures and all 17 raw source occurrences
passed 691 independent type/ownership/item-separation/prohibition/source-unit
checks. Existing fourteen missing-node startup messages are unrelated.

## Inventory and Validation

Preferences 166 -> 170. Wordings 780 -> 786 / 2,182 (36.0%); occurrences
3,257 -> 3,271 / 5,451 (60.0%). All 42 contexts retain every old match and both
source fingerprints, gaining exactly six reviewed wordings before deliberate
baseline refresh. Skills remain 41/399, supports 31/567, families 19 and reviewed
pairs 292. These are heuristic coverage measures, not overall completion.

Quick validation passed 1,469 tests in 38 files, typecheck and no-loss coverage.
Tests cover signs, zero/decimals, source units, full wording/ownership, separate
gain/generation/cost/duration, bidirectional Flask separation, combined benefits,
manual settings, catalog-driven controls/save/transfer, required penalties,
unchanged shortest and shared/base point costs. Five earlier expectations now
recognize Charm values without removing Flask, scoped-effect or recovery guards.

One final release validation passed 1,786 tests in 82 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk size warning remains
at 517.93 kB minified / 137.93 kB gzip; the build succeeds. No shared layout,
control or routing contract changed, so no repeated browser matrix was run.

Next proposal: generic Area Damage and attack-specific Critical Damage Bonus,
reviewing component/skill scope and generic/specific overlap. Not implemented
without approval. Fireball Concentrated Area remains on hold. No commit, push
or deployment authorized by this batch.

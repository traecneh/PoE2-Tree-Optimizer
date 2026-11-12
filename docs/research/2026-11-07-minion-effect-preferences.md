# Minion Effect Preferences

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph and isolated PoB 0.23.1
runtime. Adds eight opt-in preferences with complete, unconditional wording only.
No routing algorithm, preset suggestions, support compatibility, saved schema,
shared controls, graph or assets changed. Existing manual priorities and shortest
routing remain intact. These are heuristic effects, not Full DPS or mitigation.

## Scope and Units

| Preference | Normal score unit | Ownership and exclusions |
| --- | --- | --- |
| Minion Critical Hit Chance | 15% increased | Minion crit-chance modifier, not added chance or player crit; requires crit-capable hits |
| Minion Critical Damage Bonus | 10% increased | Minion bonus modifier, not flat bonus or player crit damage; requires damaging crits |
| Minion Area of Effect | 10% increased | Applicable minion area components, not player area, radius percentage or area damage |
| Minion Movement Speed | 5% increased | Minion movement, not player movement or minion attack/cast cadence |
| Minion Fire Resistance | +5 percentage points | Flat minion Fire resistance, not increased or maximum resistance |
| Minion Cold Resistance | +5 percentage points | Flat minion Cold resistance, not increased or maximum resistance |
| Minion Lightning Resistance | +5 percentage points | Flat minion Lightning resistance, not increased or maximum resistance |
| Minion Chaos Resistance | +5 percentage points | Flat minion Chaos resistance, never inferred from elemental resistance |

High/Highest use the existing 2x/3x priority multipliers. Increased/reduced forms
retain their sign; resistance reductions are explicit negative flat values.
Repeated positive/negative lines accumulate and can cancel to zero. No effect is
automatically selected by a preset. Existing saved/exported settings retain the
new IDs through the ordinary catalog-driven normalizer.

`Minions have +20% to all Elemental Resistances` contributes +20 once to each
selected Fire/Cold/Lightning channel. There is no additional aggregate preference,
so one selected channel earns 4 normal score; three selected channels earn 12,
not 24. This is three explicitly requested effects, not three node allocations.
Chaos receives nothing. Per-type and all-elemental modifiers stack only in their
relevant channels. Shared route nodes and already allocated base nodes follow
the existing once-only cost/reward policy.

Conditionals, recently-created minions, companions, mixed player/minion ownership,
more/less modifiers, conversions, incoming effects, scoped component modifiers
and malformed composites are excluded. Maximum resistances are not ordinary
resistance points. Caps, overcapping, crit prohibitions, inherited gear, area
overlap, minion positioning and actual combat uptime are not modeled. Tooltips
explain these limits without expanding the main interface.

## Source and Independent Checks

Official references:
[modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[defence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua),
[offence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
The moving upstream references are distinct from the isolated source snapshot:

| Local source | SHA-256 |
| --- | --- |
| ModParser.lua | `01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247` |
| CalcDefence.lua | `7884220a9744297bc62de7d67112173d4ba28ffb35c848e9418031e6f68b1cc7` |
| CalcOffence.lua | `eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435` |

Eighteen signed native forms were checked: four increased/reduced families and
five positive/negative resistance forms, including all-elemental. Each produces
an untagged MinionModifier LIST wrapping the expected INC or BASE stat. The
player ModDB does not receive the wrapped stat; the minion ModDB does. Our app's
extracted values independently agree with all eighteen forms.

Forty synthetic actor calculations and 206 independent comparisons check both
ownership directions and arithmetic using the Arsonist's Fire Bomb component:

- Minion +20% critical chance changes 5% -> 6%; a reduction changes 5% -> 4%.
  These are relative modifiers, not twenty added percentage points.
- Minion +20% critical bonus changes the native total multiplier 2 -> 2.2;
  reduction gives 1.8. Only the extra-damage portion is scaled, not the whole hit.
- Minion area and movement modifiers independently change 1 -> 1.2 or 0.8.
  Neither changes tested attack/cast speed or single-target native DPS.
- Resistance modifiers alter the named uncapped total by their literal signed
  points. All-elemental affects three elements, not Chaos. A +100 all-elemental
  fixture produces uncapped totals 150/100/100 and capped outputs 75/75/75;
  the heuristic does not pretend all those added points are effective mitigation.
- Player-only versions leave the complete exported minion output unchanged;
  minion-only versions leave the complete exported player output unchanged.
  Maximum-resistance fixtures leave ordinary uncapped resistance totals unchanged.
  This does not validate maximum-resistance scoring, which remains excluded.

The real unsigned `Minions have 0% to Chaos Resistance` line returns a zero-valued
native inner modifier but leaves unparsed text. It is deliberately not admitted
as complete wording or counted as new coverage. Signed +0 and offsetting signed
values still work without granting value. No native parser was modified.

Ignored reproduction/evidence:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/minion-effects-20261107/native-check.lua --job var/minion-effects-20261107
npx tsx var/minion-effects-20261107/verify.ts
```

The existing native missing-node startup messages did not prevent these checks.
Installed PoB builds/settings were untouched. Fresh-checkout tests do not require
ignored artifacts. No real-character Full DPS or live-game equivalence is claimed.

## Coverage and Validation

Eight categories raise preferences 79 -> 87. Eighteen new wordings across 38
nodes raise recognized wording 518/2,182 -> 536/2,182 (24.6%) and occurrences
2,584/5,451 -> 2,622/5,451 (48.1%). All-elemental is one wording/occurrence, not
three. All 42 contexts gain exactly the reviewed eighteen wordings without losing
old matches; graph/catalog fingerprints are unchanged. The reviewed baseline
is refreshed to protect these additions. Skills stay 41/399, support choices
31/567, families 19 and curated pairs 292. No overall completion claim is made.

Focused validation passed 1,056 tests in 20 files, typecheck and the old baseline.
Tests cover complete-line/sign/ownership exclusions, zero cancellation, per-type
fanout, current-tree inventory, UI picker/help/priority/removal, catalog-wide
storage/export and nine routing fixtures. Existing rejection tests now assert
the explicit minion-only values while retaining zero player benefit. Route
fixtures retain required goals, penalties, point costs and shortest behavior,
and check shared-node/base-node reward accounting.

No shared UI/layout, persistence implementation or routing contract changed, so
no repeated interactive browser/viewport matrix under the lean validation policy.
Final release validation passed 1,373 tests in 64 files, typecheck, production
build, graph validation and the refreshed coverage baseline. No final checks
failed. The existing local server returned HTTP 200, and graph/assets remained
unchanged. No commit, push or deployment requested or performed.

Raw backlog: 1,646 unrecognized wordings and 2,829 occurrences. This is not a
reviewed eligibility count. Next recommended batch: minion Evasion Rating,
additional Physical Damage Reduction, Life Recoup and maximum elemental
resistances, keeping caps, recovery timing and player ownership explicit.
Command/revival mechanics and Fireball's Concentrated Area hold remain separate.

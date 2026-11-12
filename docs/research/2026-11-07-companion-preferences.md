# Companion-Specific Preferences

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph and isolated PoB 0.23.1
runtime. Adds ten opt-in preferences without changing routing, preset suggestions,
support compatibility, shared controls, saved schema, graph or assets. Existing
priorities and shortest routing remain unchanged. This is literal modifier
scoring, not a complete Companion build, DPS, mitigation or summon-count engine.

## Scope and Units

| Preference | Normal score unit | Boundary |
| --- | --- | --- |
| Companion Damage | 10% increased | Companion-only damage wording, not player damage or damage-as-extra |
| Companion Maximum Life | 10% increased | Maximum Life, not player Life, recovery or damage-sharing mitigation |
| Companion Attack Speed | 3% increased | Attack cadence, not cast speed, movement or commands |
| Companion Movement Speed | 5% increased | Companion movement, not player/mounted movement or action speed |
| Companion Area of Effect | 10% increased | Requires an applicable area component; no invented radius for basic single-target attacks |
| Companion Fire Resistance | +5 percentage points | Flat Fire resistance, not maximum resistance |
| Companion Cold Resistance | +5 percentage points | Flat Cold resistance, not maximum resistance |
| Companion Lightning Resistance | +5 percentage points | Flat Lightning resistance, not maximum resistance |
| Companion Chaos Resistance | +5 percentage points | Not supplied by all-elemental resistance |
| Companion Reservation Efficiency | 5% increased | Reserving Companion Skills, not flat Spirit, equal cost reduction or guaranteed extra Companions |

Increased/reduced forms and signed flat resistances retain their signs. High and
Highest use the existing 2x/3x priorities. All-elemental resistance contributes
once to each selected Companion elemental channel, never an additional aggregate
or Chaos. Repeated independent modifiers accumulate, including zero cancellation.
No preset adds these preferences or changes existing priorities automatically.

Companions are a scoped subset of minions in this native data, not a wholly
disjoint actor class. A Companion-only line does not score as generic Minion
Damage/Life/resistance, and a generic line is not copied into the new Companion
categories. Broader minion bonuses can also benefit Companions: select those
existing preferences separately when desired. Two distinct lines may each count;
the same line is not rewarded twice through aliases. Tooltips explain this.

Only full, unconditional reviewed wording is admitted. Presence conditions,
per-charge effects, damage-as-extra, player/Companion transfer or inheritance,
flask sharing, shared damage taken, Onslaught/ailments, cast speed, maximum
resistance and malformed composites are excluded. Trusted Kinship's combined
Companion limits and more/less reservation rules remain unmodeled, not partially
read as an ordinary increased-efficiency line. New preferences do not grant a
second Companion or reinterpret currently allocated unmodeled mechanics.

## Native Source, Ownership and Calculations

Official references:
[modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[Companion skill definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua),
[reservation/defence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua).
Moving upstream references are not claimed byte-identical to the isolated copy.

| Local source | SHA-256 |
| --- | --- |
| ModParser.lua | `01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247` |
| act_dex.lua | `d36694d3168f733be34b711f42953b0186685a14d60402ba42cf1d08c13971f9` |
| CalcDefence.lua | `7884220a9744297bc62de7d67112173d4ba28ffb35c848e9418031e6f68b1cc7` |

Twenty-two signed native forms pass exact parser and ModDB scope checks. The
Companion actor modifiers are MinionModifier LIST entries with an outer
CreatesCompanion skill-type restriction; the wrapped Attack Speed modifier has
an Attack flag. ReservationEfficiency is a parent modifier with the same scoped
skill-type restriction. Ordinary CreatesMinion/Minion alone does not satisfy it.
All twenty-two app extractions independently agree with the native values,
including all-elemental fanout and both efficiency signs.

Fifty-six actor fixtures passed 268 independent comparisons using the existing
Rhoa Mount/Companion, ordinary Skeletal Sniper and non-minion Arctic Armour. No
beast data, conditions, skills or native engine calculations were injected:

- Each Companion-only form leaves the ordinary skeleton's complete exported
  player/target output unchanged. Non-reservation Companion forms also leave
  the Rhoa player's complete exported output unchanged. Player-only damage,
  Life, speed, area and resistance modifiers leave both summons unchanged in
  these blank-tree fixtures; player Life changes independently.
- Rhoa maximum Life 4,980 -> 5,976/3,984 for +20/-20 Life, within native rounding.
  +20/-20 Attack Speed scales its action cadence by 1.2/0.8. Damage modifiers
  move native damage in the expected direction, without assuming a matching DPS
  multiplier through mitigation/crit. Movement modifiers change movement only,
  not attack cadence or tested single-target damage.
- Rhoa's basic MinionMelee has no area component. The scoped Area modifier
  reaches its modifier database but produces no AreaOfEffectMod output, damage
  gain or new radius. This is ownership evidence, not useful area coverage for
  that attack. The preference explicitly requires a suitable area component.
- Flat resistance modifies only the named total; all-elemental modifies three
  elements, not Chaos. +100 all-elemental gives total 100 with effective 75 per
  element in the fixture. The heuristic does not simulate caps or mitigation.
- Rhoa reserves 100 Spirit at baseline. +20% Companion efficiency gives 83;
  -20% gives 125 after rounding. Independent arithmetic checks reciprocal
  scaling and the player's remaining Spirit. The target's damage/Life/speed
  do not change; the ordinary skeleton and non-minion reservation control are
  unchanged. Efficiency does not bypass Companion limits or guarantee counts.
- Broad minion Damage/Life/Attack Speed and Minion Reservation Efficiency affect
  both the Rhoa and ordinary skeleton. Independent checks confirm this overlap,
  while the app retains the original minion IDs without creating Companion
  aliases. The Rhoa is not assumed to be excluded from all minion bonuses.

These are snapshot engine checks, not a real-character or live-game audit. Shared
damage, inheritance and mounted behavior need additional inputs; results from a
blank tree do not prove those mechanics never transfer benefits.

Ignored reproduction/evidence:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/companion-preferences-20261107/native-check.lua --job var/companion-preferences-20261107
npx tsx var/companion-preferences-20261107/verify.ts
```

Existing native missing-node startup messages did not prevent these checks.
Installed PoB builds/settings and source files were untouched. Fresh-checkout
app tests do not require ignored native artifacts.

## Coverage and Validation

Preferences 97 -> 107. Fifteen new wordings across 44 nodes add 48 occurrences;
some nodes contain two new effects, and all-elemental counts as one occurrence.
Wording 563/2,182 -> 578/2,182 (26.5%); occurrences 2,661/5,451 -> 2,709/5,451
(49.7%). All 42 contexts gain exactly the fifteen reviewed wordings without
losing old matches. Graph/catalog fingerprints remain unchanged; the reviewed
baseline is refreshed to protect additions. Skills stay 41/399, supports 31/567,
families 19 and curated pairs 292. No overall completion percentage is implied.

Focused validation passed 1,133 tests in 23 files, typecheck and the old baseline.
Tests cover signs, zero cancellation, scopes, three-way wording ownership,
exclusions, exact inventory, explicit UI picker/help/priority/removal, catalog-
wide storage/export and eleven routing fixtures. Existing minion rejection tests
now assert Companion-only values while preserving zero minion-preference benefit.
Routes retain required goals, costs, shared/base-node reward rules and shortest
behavior. No existing preset automatically adds a new Companion preference.

No shared UI/layout, routing contract or persistence implementation changed, so
no repeated interactive browser/viewport matrix under the lean validation policy.
Final release validation passed 1,450 tests in 67 files, typecheck, production
build, graph validation and refreshed coverage baseline. No final checks failed.
The existing local server returned HTTP 200; graph/assets remained unchanged.
No commit, push or deployment requested or performed.

Raw backlog: 1,604 unrecognized wordings and 2,742 occurrences, not a reviewed
eligibility count. Next recommended batch: Attack Area Damage, Elemental Damage
with Attacks and Critical Spell Damage Bonus, with explicit skill/component
ownership checks. Companion Presence/transfer/conversion mechanics and revival
need deeper review. Fireball's Concentrated Area review remains on hold.

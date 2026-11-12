# Minion Defence Preferences

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph and isolated PoB 0.23.1
runtime. Adds six opt-in effects without changing routing, preset suggestions,
support compatibility, saved schema, shared controls, graph or assets. Existing
manual priorities and shortest routing stay unchanged. Scores express raw
modifier preferences, not actual capped mitigation, evade chance or sustain.

## Scope and Units

| Preference | Normal score unit | Boundary |
| --- | --- | --- |
| Minion Evasion Rating | 12% increased | Increased/reduced rating, not added evade chance or player evasion |
| Minion Physical Damage Reduction | 3% additional | Signed additional percentage points, not increased reduction, Armour or reduced damage taken |
| Minion Life Recoup | 3% recoup | Unqualified minion damage recouped as Life, not player recoup, regeneration, instant recovery or mitigation |
| Minion Maximum Fire Resistance | +1 percentage point | Cap modifier, separate from ordinary Fire resistance |
| Minion Maximum Cold Resistance | +1 percentage point | Cap modifier, separate from ordinary Cold resistance |
| Minion Maximum Lightning Resistance | +1 percentage point | Cap modifier, separate from ordinary Lightning resistance |

All maximum-elemental wording contributes once to each selected maximum-element
channel, not ordinary resistance, Chaos or an additional aggregate. Per-element
and all-elemental modifiers stack in the relevant channels. High/Highest retain
the existing 2x/3x weighting. No automatic preference selection or saved-priority
changes are made. The existing catalog-driven storage/export tests cover all IDs.

Full unconditional lines only: conditionals, per-charge effects, companions,
incoming/overwhelm effects, more/less modifiers, conversions, damage-type-specific
recoup, recovery-rate/timing modifiers, maximum Chaos resistance and malformed
composites are excluded. Negative Evasion, physical-reduction and maximum-
resistance values are retained where their forms were verified. Negative recoup
does not parse completely in this native snapshot and is not invented as an alias.

## Native Ownership, Caps and Timing

Official references:
[modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[defence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcDefence.lua).
Moving upstream references are not claimed byte-identical to the isolated copy.

| Local source | SHA-256 |
| --- | --- |
| ModParser.lua | `01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247` |
| CalcDefence.lua | `7884220a9744297bc62de7d67112173d4ba28ffb35c848e9418031e6f68b1cc7` |

Fifteen native forms, including signed Evasion/caps/physical reduction and zero
recoup, produce the expected untagged MinionModifier LIST wrapping INC or BASE
stats. Player ModDB receives none of those inner modifiers. All fifteen app
extractions independently agree with their native values.

Thirty-nine synthetic actor cases passed 304 independent comparisons using the
Arsonist's Fire Bomb component. These are native engine checks, not live-game or
full-character performance validation:

- +20%/-20% minion Evasion changes the tested rating 347 -> 416/278 after rounding,
  not player rating or guaranteed evade probability. A useful baseline rating,
  enemy accuracy and conversions remain separate inputs.
- The native ordinary maximum resistance is 75%; its hard cap is 90%. A +3
  maximum modifier changes the cap to 78 but leaves effective resistance unchanged
  when uncapped resistance is below it. With sufficient ordinary resistance,
  all-elemental maximum +3/-3 gives effective 78/72; +30 saturates at 90, not 105.
  Ordinary totals remain unchanged by maximum modifiers. Chaos is unaffected.
- Native additional Physical Damage Reduction clamps to 0..90. A 120-point
  modifier yields 90 native base reduction; a negative modifier at zero remains
  zero effective reduction. Armour, hit size, overwhelm and total mitigation are
  not reconstructed by our scalar preference.
- Minion recoup 15%/30% produces delayed recovery over eight seconds in the native
  breakdown, with no added regeneration. An explicitly injected native four-
  second Life-recoup flag changes timing, not the 15% amount. Injecting +20% Life
  Recovery Rate changes native output 15 -> 18%, still over eight seconds.
- Independent isolated-hit arithmetic: 1,000 damage x15% =150 Life total; uniform
  delivery over eight/four seconds would be 18.75/37.5 per second. This is not
  guaranteed recovery, survival, revival, actual incoming damage or continuous DPS.
- Minion-only forms leave the complete exported player output unchanged; player
  versions leave the exported minion output unchanged. Ordinary/cap/recoup channels
  remain separate, including on nodes that contain both player and minion effects.

Timing/recovery-rate injections are marked synthetic ModDB probes, not new
accepted passive wording or a claim that every minion can obtain that mechanic.
An initial probe reran the non-idempotent defence calculation and doubled the
displayed Evasion. It was replaced with a once-per-actor injection before the
first calculation, and an independent unchanged-Evasion assertion guards this.
Neither PoB source code nor installed settings/builds were modified.

Tooltips explicitly state the native caps, delayed recoup and the heuristic's
limits. The optimizer does not clamp modifier scores as though modifiers were
final character stats: a minion already below a cap or over the hard cap can
still receive a raw preference score. Review the route and select priorities
appropriate to the build; this batch is not automatic cap-aware build evaluation.

Ignored reproduction/evidence:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/minion-defence-20261107/native-check.lua --job var/minion-defence-20261107
npx tsx var/minion-defence-20261107/verify.ts
```

Existing native missing-node startup messages did not prevent the checks. Fresh-
checkout app tests do not require ignored artifacts. The unsigned zero Chaos-
resistance deferral, Cleric revival gap and other prior research holds remain.

## Coverage and Validation

Preferences 87 -> 93. Eleven new wordings across fifteen nodes add sixteen stat
occurrences (one node has both Evasion and Physical Damage Reduction). Wordings
536/2,182 -> 547/2,182 (25.1%); occurrences 2,622/5,451 -> 2,638/5,451 (48.4%).
All 42 contexts gain exactly the reviewed eleven wordings without losing old
matches. Graph/catalog fingerprints are unchanged; the reviewed baseline is
refreshed to protect the additions. Skills stay 41/399, supports 31/567,
families 19 and curated pairs 292. No overall completion percentage is implied.

Focused validation passed 1,079 tests in 21 files, typecheck and the old baseline.
New tests cover signs, zero cancellation, exclusions, ownership, resistance/cap
fanout, real inventory, opt-in controls/tooltips and seven routing fixtures.
Existing rejection tests now assert the new minion-only values while retaining
zero player/ordinary-resistance benefit. Catalog-wide save/export coverage and
route tests preserve goals, point costs, shared/base-node reward rules and
shortest behavior. Presets still add none of these six effects automatically.

No shared UI/layout, routing contract or persistence implementation changed, so
no repeated interactive browser/viewport matrix under the lean policy. Final
release validation passed 1,396 tests in 65 files, typecheck, production build,
graph validation and refreshed coverage baseline. No final checks failed. The
existing local server returned HTTP 200; graph/assets remained unchanged. No
commit, push or deployment requested or performed.

Raw backlog: 1,635 unrecognized wordings and 2,813 occurrences, not a reviewed
eligibility count. Next recommended batch: minion Command Skill damage/cooldown
recovery, temporary Minion Duration and Reservation Efficiency of Minion Skills,
keeping commands, temporary minions, persistent summons and resource rounding
separate. Revival and conditional effects need deeper review. Fireball's
Concentrated Area review remains on hold.

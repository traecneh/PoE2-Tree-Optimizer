# Recoup Speed, On-Kill Recovery and Flask Effect Duration

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and isolated PoB runtime. Four opt-in preferences using unchanged controls,
routing engine, point costs and save/transfer schema. No preset/support priorities
are added automatically. Shortest routing remains unchanged.

## Matching and Units

| Preference | Complete unconditional wording | Normal unit |
| --- | --- | --- |
| Recoup Speed | N% increased/reduced speed of Recoup Effects | 10% increased |
| Life Recovery on Kill | Recover/Lose N% of maximum Life on Kill | Recover 1% |
| Mana Recovery on Kill | Recover/Lose N% of maximum Mana on Kill | Recover 1% |
| Flask Effect Duration | N% increased/reduced Flask Effect Duration | 10% increased |

Reductions and Lose wording subtract value. Zero/decimals and cancellation are
tested. Normal units are manual heuristic normalization, not calibrated power.
High/Highest multiply by two/three. Signed Recover -N%, flat Life/Mana on Kill,
conditional/recent/per-charge, other owners, extra composite effects, more/less,
unreviewed aliases and malformed text do not match these four preferences.

Recoup speed requires existing applicable recoup and damage taken. It does not
grant a recoup source, increase the percentage of damage recouped or grant
mitigation. No actual delivery duration or sustain is calculated. Life/Mana
on-Kill preferences represent a percentage of maximum resource per eligible
event, never recovery per second or a kill rate. Kill attribution, minion/proxy
kills, overfill, prohibitions and actual resource pools are not evaluated.

Flask duration requires an applicable flask. Longer duration can increase total
recovery by extending delivery without increasing the recovery rate. A duration
line scores only its duration preference, not Life/Mana flask recovery, charges
or generic Skill Effect Duration. Instant recovery, early removal at full
resource, charge availability and actual uptime are not calculated. Separate
genuine amount, rate or charge lines remain independent; they are not multiplied
in the scorer. Shared route nodes contribute once; already allocated base nodes
do not become new route rewards.

## Primary Sources and Native Checks

Reviewed PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua),
[offence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua),
[flask calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua),
[item tooltip calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Classes/ItemsTab.lua)
and local game stat descriptors. Moving upstream links do not establish byte
identity with the tested local snapshot. Personal builds/settings are unchanged.

Five forms parse completely with the correct types/tags: signed INC
FlaskDuration, positive LifeOnKill/ManaOnKill and negative LifeOnKill. On-Kill
forms use BASE +/-1 with a PercentStat tag referencing the actor's final Life or
Mana pool. The native PercentStat evaluation rounds upward before the offence
output floors its sum. In the isolated fixture, 2% of 1,187 Life gives 24 and
2% of 441 Mana gives 9 per eligible Kill. Losing 2% Life gives -23 due to that
native asymmetric rounding, not an app claim about the game's rounding.
Larger-pool fixtures reproduce the final-pool calculation independently.

On-Kill recovery does not change regeneration or ongoing recovery. A Life
recovery prohibition suppresses the output despite retaining its source.
Player stats do not transfer to an ordinary Skeletal Sniper. A separate parsed
conditional minion control uses an explicitly enabled native enemy PoisonStack
tag and verifies ModDB evaluation against the minion's own Life pool. This
control is not a simulated kill or recomputed full output. An attempted generic
Minions Recover alias was unsupported and is not claimed as a successful control.
No conditional/minion on-Kill matcher was added by this batch.

Real active Greater Life/Mana flasks with zero quality and no instant component
are tested under explicit effect-not-removed conditions. Baseline Life recovery
is 150 / 4 = 37.5 per second; Mana is 90 / 2.5 = 36. A 20% duration increase
changes independent total/duration arithmetic to 180 / 4.8 and 108 / 3, leaving
native ongoing recovery unchanged. A 20% duration reduction also leaves those
rates unchanged. Separate 20% amount or rate modifiers increase the ongoing
rate to 45/43.2, with different duration behavior. Duration arithmetic here is
independently reconstructed from the reviewed formula, not an exported native
final-duration field or simulated flask uptime.

Two native gaps remain explicit:

- Recoup speed partially parses as LocalEffect with an unparsed remainder, not
  a recoup-speed modifier. Adding it does not change the tested recoup output.
  The exact game descriptor backs the literal preference; no native timing
  simulation or validation is claimed.
- Lose maximum Mana on Kill is misparsed as flat Mana -2 while KilledRecently,
  not percent Mana loss per event. The game descriptor supplies the app's
  correct literal negative form; this is not counted as a supported native form.

Raw stat provenance independently confirms all 28 main-tree occurrences:

| Raw stat ID | Occurrences |
| --- | ---: |
| recoup_speed_+% | 10 |
| recover_%_maximum_life_on_kill | 6 |
| recover_%_maximum_mana_on_kill | 6 |
| flask_duration_+% | 6 |

All current raw values are positive; opposite signs are game-defined and tested
synthetically. Twelve distinct wordings are added. Pliable Flesh keeps its
recoup amount separate from speed, Flow of Life keeps debuff expiry separate,
Efficient Killing keeps Mana regeneration separate, Siphon keeps Mana leech
amount separate, and Cautious Concoctions keeps flask charges gained separate.

Ignored reproducible evidence: `var/recoup-kill-flask-duration-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/recoup-kill-flask-duration-20261108/native-check.lua --job var/recoup-kill-flask-duration-20261108
node var/recoup-kill-flask-duration-20261108/verify.mjs
```

Passed 159 independent checks across 18 native actor fixtures and all 28 raw
source occurrences. Existing fourteen missing-node startup messages are unrelated.

## Coverage and Validation

Preferences 153 -> 157. Wordings 735 -> 747 / 2,182 (34.2%); occurrences
3,154 -> 3,182 / 5,451 (58.4%). All 42 contexts retain every old match and both
source fingerprints, adding exactly the twelve reviewed wordings before the
deliberate baseline refresh. Skills remain 41/399, supports 31/567, families 19
and reviewed pairs 292. These are heuristic coverage, not overall completion.

Tests cover signs, zero/decimals, complete wording/ownership, mixed nodes, no
amount/rate/frequency fanout, manual settings, metadata tooltips, catalog-driven
save/transfer, required penalties, unchanged shortest and shared/base rewards.
Three earlier tests now recognize Recoup speed without removing their other
guards. Quick validation passed 1,396 tests in 34 files, typecheck and no-loss
coverage. One final release validation passed 1,713 tests in 78 files, typecheck,
production build, graph validation and the reviewed coverage baseline. The local
server returns HTTP 200 at port 5174. The existing main-chunk size warning remains
at 510.85 kB minified / 136.66 kB gzip; the build succeeds. No shared controls or
layout changed, so no repeated browser matrix was run.

Next proposal: Warcry Speed, Warcry Cooldown Recovery Rate and Warcry Area of
Effect, reviewing generic-stat overlap and keeping cadence/cooldown/coverage
separate. Not implemented without approval. Fireball Concentrated Area remains
on hold. No commit, push or deployment authorized by this batch.

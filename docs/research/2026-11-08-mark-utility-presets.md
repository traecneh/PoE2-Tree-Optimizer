# Reviewed Mark Utility Presets

Reviewed 2026-11-08 against the PoE2 0.5.5f graph and isolated PoB 0.23.1
catalog/runtime. Adds Sniper's Mark, Bloodhound's Mark, Freezing Mark and
Voltaic Mark to the existing focus selector. No scorer, solver, allocation-cost,
support-pair, persistence-schema, graph/asset or shortest-route changes.

## Optional Priorities and Component Boundaries

All four suggest Mark Effect at Highest (3), Mark Use Speed at Normal (1), and
Mark Duration at Normal (1). These are editable utility heuristics, not measured
power or DPS. Choosing a focus alone adds nothing: the user enables effects or
uses Add suggestions. Existing priorities, required goals and point budgets
remain unchanged, including a lower existing Mark Effect priority.

| Preset / positive catalog tier | Reviewed application | Outside this utility focus |
| --- | --- | --- |
| Sniper's Mark / 7 | Next qualifying Critical Hit consumes the Mark for extra damage and a Frenzy Charge; base cooldown six seconds | Ownership of that hit, charge generation, consuming-hit damage and sustained uptime |
| Bloodhound's Mark / 9 | External Blood Loss builds Heavy Stun; consumption on Heavy Stun or qualifying death triggers Blood Explosion; timer does not expire during Blood Loss | External Blood Loss, thresholds/frequency, stun simulation and the separate non-weapon physical attack |
| Freezing Mark / 7 | Target susceptibility to Freeze; Freeze consumes it for a player extra-Cold buff; marking another target removes the buff | Freeze application, separate buff timer, actual buff uptime and another skill's damage |
| Voltaic Mark / 7 | Target susceptibility to Electrocute; Electrocute consumes it for a player extra-Lightning buff; marking another target removes the buff | Electrocute application, separate buff timer, uptime, Shock and another skill's damage |

All parent components have `base_deal_no_damage`, Mark skill type, no Attack or
Spell skill type, a 0.5-second action and an eight-second primary duration.
Each permits one Mark of its type. Freezing/Voltaic also export a separate
ten-second secondary duration. These are source facts, not a simulated event
sequence or proof that Mark Duration cannot affect a secondary timer.

All four deliberately have empty passive hit scopes. Bloodhound's gem-level
Attack/Area/Trigger tags do not turn its parent debuff into the separate Blood
Explosion component. Voltaic's legacy `baseFlags.spell` does not override its
missing Spell skill type or grant a hit. The separate Blood Explosion is a
triggered non-weapon Attack/Area/UseGlobalStats component, not a Spell, Mark or
Minion component, and explicitly cannot cause Bleeding.

No automatic damage, critical, minion, ailment-buildup, cooldown, generic Cast
Speed or Exposure priorities are inferred. Conditional buffs, target
susceptibility and an external activation source are not interchangeable with
the player's own hit modifiers. Explicit manual priorities still work for other
skills; outside-focus cautions do not silently delete or disable them. Mark
timing and generic timing remain separate source lines, not duplicated bonuses.
No support pairs are offered for these four yet; unreviewed does not mean illegal.

## Source and Native Checks

Official references: [Dexterity skill data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua),
[Intelligence skill data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
and [gem catalog](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua).
Moving upstream references are not claimed byte-identical to the tested local
snapshot. All four names, IDs, tags and positive tiers agree with that catalog.
Personal PoB builds/settings were not changed and native source was not patched.

| Tested local file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Modules/CalcOffence.lua | eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435 |
| Modules/CalcPerform.lua | b5955d4eaed31c01ea85e551a5eef46b6f006d7ebe3e8722993b69a425666b31 |
| Data/Skills/act_dex.lua | d36694d3168f733be34b711f42953b0186685a14d60402ba42cf1d08c13971f9 |
| Data/Skills/act_int.lua | 5b42b006be62d02f428fa03dbcd94bc9385041e502dc0bfc0640ff1a2aa430ac |
| Data/Gems.lua | 1ccea00a77c66dded39ee6c5d477d705c0e2602348d752982d075ac56136ffe1 |

Five component exports and 24 isolated actor fixtures: each parent has baseline,
+20/-20 game Mark utility, generic cast/attack-speed control, minion-speed/damage
control, and reference-only native Mark-effect alias cases. Level 20, quality 0,
empty tree, player-owned skills; no minion or damaging parent hit, TotalDPS zero.
The native startup's fourteen existing missing-node messages are unrelated.

- Independent `2 * (1 + speed/100)` gives use rates 2, 2.4 and 1.6. Native
  0.033-second tick rounding, `ceil(seconds / .033) * .033`, gives durations
  8.019, 9.603 and 6.402 from unrounded 8, 9.6 and 6.4. All four agree.
- Cooldowns round to 6.006 for Sniper and 0.528 for the others. Effective time
  is `max(1 / useRate, roundedCooldown)`, not a promise that use speed improves
  repeated-use frequency. Sniper stays at 6.006; the others become 0.625 only
  in the reduced-speed case. Minion controls change neither player rate nor DPS.
- Generic cast/attack control yields raw speed 30 and use rate 2.6, so native
  caster timing is not evidence that generic Cast Speed has zero effect. This
  review does not infer a new universal game Cast Speed rule or auto-priority.
- Exact game Mark-effect wording still maps to Mark-scoped `LocalEffect`, not
  the native `MarkEffect` consumed by its display calculation. +/-20 leaves
  `MarkEffectMod` at 1. The reference-only alias yields raw MarkEffect 20 and
  display 1.2, but audited enemy/player magnitudes still do not change: Sniper
  SelfCritMultiplier 77, Bloodhound ExplosionThreshold 5, Freezing Cold gain 30,
  Voltaic Lightning gain 30. Display-factor change is not effective scaling proof.
- Native Freezing/Voltaic buffs appear in the static baseline without a
  consumption event. That is not guaranteed in-game uptime. Correction from the
  follow-up support review: this initial probe read `SecondaryDuration` rather
  than PoB's `DurationSecondary`; its missing field did not establish missing
  native timing. The [support audit](2026-11-08-mark-utility-supports.md) verifies
  both timers and their scaling using the correct key. Event uptime and actual
  damage remain unmodeled; the site scores literal sources independently.

Ignored evidence and repeatable audit:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/mark-presets-20261108/native-check.lua --job var/mark-presets-20261108
node --import tsx var/mark-presets-20261108/verify.mjs
```

## Coverage and Verification

Presets 41 -> 45/399 (11.3%); positive-tier presets 45/234 (19.2%). All 42
existing contexts have exactly the same wording sets; the four new contexts
each equal the 743-wording manual context, with no invented hit scopes. Union
coverage stays 853/2,182 wordings (39.1%) and 3,412/5,451 occurrences (62.6%).
Preferences remain 183, supports 31/567 and reviewed pairs 292. Both data
fingerprints and union wording are unchanged. These are scoped coverage counts,
not complete Mark mechanics or an overall completion percentage.

Quick validation passed; exact source/component, 24-actor timing/ownership and
per-context coverage audit passed before deliberate baseline acceptance. Tests
cover explicit selection/add/remove, optional weights, retained priorities and
budgets, catalog-driven normalization, no unreviewed supports, non-hit scope
checks, shared/base point accounting, required penalties and unchanged shortest
routing. Quick passed 1,694 tests in 48 files, typecheck and no-loss coverage.
One final release passed 2,011 tests in 92 files, typecheck, production build,
graph validation and the deliberately reviewed baseline. The post-baseline
native/coverage audit also passes. Local port 5174 returns HTTP 200.

The existing main-chunk warning remains at 544.55 kB minified / 143.59 kB gzip;
the build succeeds. No shared control/layout/contract or storage implementation
changed, so the existing DOM control and routing tests were used without a
repeated real-browser viewport matrix for metadata-only presets. Visual browser
acceptance is not claimed. `git diff --check` passed with existing LF/CRLF
conversion notices. Hosted deployment was not performed.

Next proposal: review Mobility, Efficiency I/II and Prolonged Duration I/II for
these four Mark focuses, checking native compatibility, cost, movement penalties
and primary versus secondary duration before offering any pair. This is not an
approval of all twenty potential pairs. Ten-Incision and Fireball Concentrated
Area remain separate held reviews. No commit, push or deployment authorized.

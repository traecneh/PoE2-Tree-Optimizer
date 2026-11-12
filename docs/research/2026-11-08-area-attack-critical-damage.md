# Generic Area Damage and Attack Critical Damage Bonus

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game
tables and isolated PoB 0.23.1 runtime. One optional Area Damage preference;
attack-only critical damage joins the existing Critical Damage Bonus preference.
No graph/assets, solver, point-cost, save schema, support compatibility or
automatic suggested priorities change. Shortest routing remains unchanged.

## Matching and Scope

Only complete unconditional `N% increased/reduced Area Damage` and
`N% increased/reduced Critical Damage Bonus for Attack Damage` match. Increased
values add, reductions subtract, and zero/decimals are preserved. Normal means
one heuristic score per 10%; High/Highest multiply by two/three. These are
relative priorities, not damage multipliers or Full DPS.

Area Damage reuses the explicit reviewed spell/attack-area-damage scopes: 20
focuses, not inferred from Area tags, skill names, targeting radius or coverage.
Manual/unknown focuses remain excluded. Fireball, Frostbolt and Bonestorm apply
to the explosion only. Tempest Flurry applies to Normal Strikes, not Third/Fourth
Strike. Explosive Spear applies to Explosion/Frenzy-Charged hits, not its
travelling spear or ground effects. Other existing reviewed component boundaries
remain intact, including Dark Effigy's linked Vile Effusion and Unearth's player
cone, not its minions. Infusion, hit overlap, component weighting, ailment damage
and conditional activation/frequency are not simulated.

Coverage-only curses, Contagion spread, Ice Shot's cone and Lightning Spear's
targeting area do not qualify. Detonate Dead's corpse-Life component remains
outside this reviewed cohort pending a separate scope review. Frostbolt's
projectile and Dark Effigy's placement can carry an area base flag without the
reviewed `is_area_damage` stat; flags alone are insufficient evidence.

Attack critical damage uses a new explicit scope on nine reviewed attack-hit
focuses: Lightning Arrow, Ice Strike, Tempest Flurry, Boneshatter, Rolling Slam,
Ice Shot, Rain of Arrows, Lightning Spear and Explosive Spear. Spell, curse,
minion, manual and unknown focuses do not receive this scoped value. Damaging
critical hits still require an applicable weapon/skill and actual critical
chance; this preference does not grant critical hits. Gear, build-wide critical
prohibitions, effective critical chance and DPS are not calculated. Reviewed
Controlled Destruction compatibility still disables spell-only critical bonus,
not area damage; it is not silently treated as compatible with attacks.

## Separation and Counting

- A generic Area Damage line supplies only `areaDamage`, not `attackAreaDamage`,
  `spellAreaDamage`, generic Damage or Area of Effect coverage.
- Distinct generic and matching attack/spell-area stat lines represent genuine
  separate sources. Selecting both preferences scores each source once, not
  the same line in multiple categories.
- Generic and matching attack critical damage add once under
  `criticalDamageBonus`. Spell-only and attack-only values never cross scopes.
  Critical Hit Chance, flat added critical bonus, conditional versus-Stunned
  bonus and critical-hit Stun Buildup remain different mechanics.
- Mixed companion/player sources retain separate ownership. Minion/Companion/
  Totem-prefixed, enemy, conditional, per-charge, more/less, composite, flat and
  malformed lines are not promoted into these two player modifiers.
- Shared route nodes cost one point and contribute once even when satisfying
  multiple goals. Already allocated base nodes do not earn new reward.

For an independent arithmetic check, Area +10, Attack Area +20 and Area -5 give
25 increased area damage for attack-area components, 5 for spell-area components
and 0 for non-area attacks in native ModDB. Generic critical bonus +10, attack
critical bonus +20 and attack critical bonus -5 give 25 for attacks and 10 for
spells. These are additive modifier-source checks, not effective hit-DPS ratios.

## Sources and Reproduction

Reviewed PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and the isolated skill definitions. Moving upstream links are references, not
proof of byte identity with the tested local snapshot. Personal PoB settings
and builds were not modified.

Local SHA-256 identities:

| Native file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Data/Skills/act_dex.lua | d36694d3168f733be34b711f42953b0186685a14d60402ba42cf1d08c13971f9 |
| Data/Skills/act_str.lua | adab68bd650f7d7dceb3cc71dbbb412acc3013628fd059fd75bbd70123eb24ba |
| Data/Skills/act_int.lua | 5b42b006be62d02f428fa03dbcd94bc9385041e502dc0bfc0640ff1a2aa430ac |

Both signed forms parse completely as `INC Damage` with `ModFlag.Area` or
`INC CritMultiplier` with `ModFlag.Attack`. Native ModDB checks verify matching
attack/spell/area eligibility, wrong-component exclusion, no Area of Effect or
Critical Hit Chance leakage, and independent additive arithmetic. Native skill
exports cross-check the reviewed component allowlists. This batch does not run
a complete actor/gear or in-game DPS audit. The existing fourteen missing-node
startup messages in the isolated runtime remain unrelated.

Raw extracted sources independently verify all 13 occurrences:

| Raw stat ID | Occurrences | Graph nodes |
| --- | ---: | --- |
| area_damage_+% | 6 | 7542, 12893, 15913, 36737, 61362, 65167 |
| attack_critical_strike_multiplier_+ | 7 | 2511, 2936, 19802, 26176, 53386, 57388, 64399 |

The legacy raw attack stat ID does not imply flat scoring: its displayed wording
and native parser explicitly supply increased Critical Damage Bonus. Sundering's
conditional flat bonus and Overwhelming Strike's critical-hit Stun Buildup are
not included. Encompassing Domain's recent-Stun coverage is not assumed active.

Ignored reproducible evidence: `var/area-attack-crit-review-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/area-attack-crit-review-20261108/native-check.lua --job var/area-attack-crit-review-20261108
node var/area-attack-crit-review-20261108/verify.mjs
```

## Inventory and Validation

Preferences 170 -> 171. Six new wordings: three Area Damage values and three
attack critical values. Wordings 786 -> 792 / 2,182 (36.3%); occurrences
3,271 -> 3,284 / 5,451 (60.2%). Every old match and both source fingerprints
are preserved in all 42 contexts. The pre-refresh audit verifies exact additions
per eligible focus, not all six in every context. Manual coverage is unchanged.
Skills stay 41/399 and supports 31/567; these are heuristic coverage counts,
not overall completion percentages.

Quick validation passed 1,486 tests in 39 files, typecheck and no-loss coverage.
Tests cover explicit allowlists across every focus, signs/decimals/zero, ownership,
source occurrences, no generic/scoped fanout, support boundaries, catalog-driven
settings/save/transfer, existing tooltip controls, required penalties, unchanged
shortest routing and shared/base point costs. Earlier rejection assertions were
updated only for the newly supported scope; conditional and cross-stat guards
remain.

One final release validation passed 1,803 tests in 83 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk size warning remains
at 520.32 kB minified / 138.44 kB gzip; the build succeeds. No shared layout,
control contract or routing contract changed, so no repeated browser matrix
was run. `git diff --check` passed with existing LF/CRLF conversion notices.

Next proposal: weapon-specific Accuracy Rating and Critical Damage Bonus for
existing bow/spear/quarterstaff focuses (11 current occurrences), including
reductions, scope and overlap checks. Not implemented without approval. Fireball
Concentrated Area remains on hold. No commit, push or deployment is authorized.

# Weapon Accuracy Rating and Critical Damage Bonus

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and isolated PoB 0.23.1 runtime. Existing Accuracy Rating and Critical Damage
Bonus preferences gain literal matching weapon sources. No new preference IDs,
automatic priorities, graph/assets, point-cost, solver, save schema or support
compatibility changes. Shortest routing remains unchanged.

## Matching and Eligibility

Complete unconditional `N% increased/reduced Accuracy Rating with WEAPON` and
`N% increased/reduced Critical Damage Bonus with WEAPON` match only for these
explicit reviewed focus scopes:

| Weapon wording | Focuses |
| --- | --- |
| Bows | Lightning Arrow, Ice Shot, Rain of Arrows |
| Spears | Lightning Spear, Explosive Spear |
| Quarterstaves | Ice Strike, Tempest Flurry |

The shared reviewed weapon registry has separate optional accuracy/critical
damage scopes. No inference from class, Path start, node name, gem tag or a
generic attack scope. Manual/no-focus, unknown focuses, spells, curses, minions,
mace focuses and wrong-weapon lines receive no new weapon value. Crossbow,
Mace, generic Staves, singular Quarterstaff and other unreviewed aliases remain
excluded; PoB's internal Staff flag is not permission to accept every staff label.
Existing weapon-critical-chance scopes remain unchanged, including no new bow
critical-chance rule.

Increases add, reductions subtract, with zero/decimals retained. Normal remains
one score per 10% increased Accuracy Rating or Critical Damage Bonus; High and
Highest multiply by two/three. Accuracy is not hit chance. Critical damage is
not critical chance, flat bonus or an effective critical multiplier. Appropriate
weapon attacks, accuracy checks and damaging critical hits are prerequisites.
Gear, enemy evasion, distance falloff, caps, cannot-miss/no-critical-bonus states,
alternate weapon setups, hit frequency and actual DPS are not calculated. The
reviewed native skill definitions use their expected weapon type and attack
components; no component in this cohort declares `global_always_hit` in its
reviewed stat/constant lists. That is not a whole-build prohibition audit.

Conditional/recent/per-charge, minion/Companion/Totem/enemy ownership, incoming
hits, more/less, flat, composite, malformed and unknown weapon wording remain
excluded. A condition is not silently assumed active because a skill uses the
right weapon. No support is newly declared compatible; unreviewed Controlled
Destruction on an attack does not suppress these values. Existing supported
spell-critical blocking remains intact.

## Counting and Interface

Generic and matching weapon Accuracy Rating add once in `accuracy`. Genuine
generic, attack-only and matching weapon critical damage add once in
`criticalDamageBonus`. Other weapons and spell-only critical damage do not cross
scopes. No line fans out to Critical Hit Chance, Attack/Spell/Projectile Damage
or another preference. For example, generic accuracy +10, matching weapon +20
and matching weapon -5 give 25 increased accuracy, not 25 hit-chance points.
Generic critical bonus +10, attack critical bonus +30, matching weapon +20 and
matching weapon -5 give 55 increased critical damage bonus, not 55 critical chance.

Martial Artistry's two separate real combat sources and Dexterity remain
independent. Precise Point's spear damage and accuracy remain independent.
Shared branching route nodes still cost one point and earn each source once;
already allocated base nodes earn no added-route reward. Required nodes with
reductions remain required. Removing/unselecting the preference removes its
reward, and Add suggestions does not select these optional preferences.

Only the existing selected-preference tooltips gain weapon applicability and
counting explanations. No new panels, controls or visible score explanations.
Manual priorities, normalization, saved-build and transfer fields are unchanged.

## Primary Sources and Native Checks

Reviewed PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and native [dexterity skill definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua)
and [intelligence skill definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua).
Moving upstream references are not proof of byte identity with the tested
isolated copy. Personal PoB builds/settings were not modified.

| Local native file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Data/Skills/act_dex.lua | d36694d3168f733be34b711f42953b0186685a14d60402ba42cf1d08c13971f9 |
| Data/Skills/act_int.lua | 5b42b006be62d02f428fa03dbcd94bc9385041e502dc0bfc0640ff1a2aa430ac |

All twelve signed forms parse completely as INC `Accuracy` or `CritMultiplier`,
with Hit plus Bow, Spear or Staff flags and no keyword flags. Native ModDB
checks matching attack-hit scope, wrong weapon and spell exclusion, non-hit
exclusion, no CritChance leakage, and the independent additive examples above.
Native weapon requirements and attack stat sets are checked for all seven
focuses. This is modifier-source arithmetic, not final hit/crit chance, an
actor/gear DPS comparison or in-game validation. Existing fourteen missing-node
startup messages in the isolated runtime remain unrelated.

All eleven graph occurrences independently trace to raw extracted stats:

| Raw stat ID | Occurrences | Node IDs |
| --- | ---: | --- |
| bow_accuracy_rating_+% | 2 | 328, 25992 |
| spear_accuracy_rating_+% | 2 | 13895, 20105 |
| quarterstaff_accuracy_rating_+% | 1 | 2113 |
| bow_critical_strike_multiplier_+ | 2 | 25586, 38993 |
| spear_critical_strike_multiplier_+ | 1 | 10265 |
| quarterstaff_critical_strike_multiplier_+ | 3 | 2113, 52399, 59694 |

Legacy critical raw IDs do not override the displayed increased wording/native
INC interpretation. All current source occurrences are positive; reductions,
zero and decimal arithmetic are additionally covered by synthetic tests.

Ignored reproducible evidence: `var/weapon-accuracy-critical-review-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/weapon-accuracy-critical-review-20261108/native-check.lua --job var/weapon-accuracy-critical-review-20261108
node var/weapon-accuracy-critical-review-20261108/verify.mjs
```

## Inventory and Validation

Preferences remain 171. Eight new wordings add eleven occurrences: distinct
wordings 792 -> 800 / 2,182 (36.7%); occurrences 3,284 -> 3,295 / 5,451 (60.4%).
All 42 contexts preserve previous matches and both graph/catalog fingerprints.
Only the seven intended weapon focuses gain their exact two or three wording
additions; manual and other scopes remain unchanged. Skills remain 41/399,
supports 31/567, families 19 and reviewed pairs 292. These are heuristic/catalog
coverage measures, not overall completion or DPS-model coverage.

Quick validation passed 1,513 tests in 40 files, typecheck and no-loss coverage.
Tests cover explicit allowlists across every focus, wrong weapons, signs/zero/
decimals, conditional/ownership/malformed exclusions, unselected preferences,
generic/attack/weapon aggregation, genuine multi-effect nodes, support boundaries,
retained manual priorities, existing controls/tooltips, required reductions,
shared/base point costs and unchanged shortest routing. Older rejection tests
were updated only for newly reviewed values, retaining their critical-chance,
conditional and wrong-weapon guards.

One final release validation passed 1,830 tests in 84 files, typecheck,
production build, graph validation and the deliberately reviewed coverage
baseline. Local port 5174 returns HTTP 200. The existing main-chunk size warning
remains at 522.09 kB minified / 138.80 kB gzip; the build succeeds. No shared
control/routing contract or layout changed, so no repeated browser matrix was
run. `git diff --check` passed with existing LF/CRLF conversion notices.

Next proposal: melee/weapon-specific Stun Buildup and quarterstaff Freeze Buildup
with application/component prerequisites and generic/scoped overlap checks.
Not implemented without approval. Fireball Concentrated Area remains on hold.
No commit, push or deployment is authorized by this batch.

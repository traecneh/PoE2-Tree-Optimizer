# One-Handed Damage, Attack Speed and Melee Accuracy

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and isolated PoB 0.23.1 snapshot. Existing Attack Damage, Attack Speed and
Accuracy Rating preferences gain explicit one-handed scopes for Lightning Spear
and Explosive Spear. No new preference IDs, automatic priorities, graph/assets,
solver, point-cost, save schema or support compatibility changes. Shortest
routing remains unchanged.

## Matching and Eligibility

| Complete increased/reduced wording | Existing preference | Occurrences |
| --- | --- | ---: |
| N% Damage with One Handed Weapons | Attack Damage | 11 |
| N% Attack Speed with One Handed Weapons | Attack Speed | 2 |
| N% Attack Speed with One Handed Melee Weapons | Attack Speed | 5 |
| N% Accuracy Rating with One Handed Melee Weapons | Accuracy Rating | 5 |

Only full unconditional `N% increased/reduced ...` lines match. Increases add,
reductions subtract, with zero/decimals retained. Normal remains one score per
10% increased damage/accuracy or 3% increased attack speed; High/Highest multiply
by two/three. These are relative sources, not Full DPS or final hit chance.

Four explicit scopes are enabled only on the two reviewed spear focuses. Their
native allowed weapon type is solely Spear, classified as one-handed and melee.
Their primary hits are projectile attacks without a melee damage flag. Melee
weapon classification is therefore not interchangeable with melee damage:
one-handed melee-weapon speed/accuracy applies to these spear projectile hits,
but generic Melee Damage still does not score for these focuses.

Bow and quarterstaff focuses are two-handed and excluded. Boneshatter and
Rolling Slam allow both mace handedness categories, so their equipment is not
inferred. Spells, curses, minions, manual/unknown focuses and unreviewed weapon
families gain no new scoped value. Holding a one-handed weapon does not grant
weapon-hit damage or attack speed to a spell. No off-hand, dual-wield or gear
setup is assumed. Both handedness-exclusive accuracy lines on a node do not
apply to the same spear hit.

Conditional/recent/per-charge, minion/Companion/Totem/enemy ownership, more/less,
flat, malformed, composite, hyphenated aliases and other typed/handedness wording
remain excluded. No new support compatibility is implied, including Controlled
Destruction for spear attacks. Existing generic manual preferences stay intact.
Gear, conversion, enemy evasion, caps/cannot-miss states, cooldown/resource
constraints and actual action rate/DPS are not modeled.

## Overlap and Real Node Effects

Distinct generic, spear-specific and one-handed damage sources add once under
Attack Damage, not again under generic/Projectile/Spell/elemental Damage.
General one-handed and one-handed melee-weapon attack-speed lines are genuine
separate sources. Both add to Attack Speed, but one melee-weapon line matches
only one rule and does not count twice. Neither supplies Cast Speed or generic
Skill Speed. A separate genuine Skill Speed line stays in its own preference.

Independent arithmetic for a qualifying spear hit:

- Attack Damage +10, Spear Damage +20, One-Handed Damage +30 and -5 give 55.
- Attack Speed +3, Spear +6, One-Handed +4 and -2, Melee-Weapon +5 and -1 give 15.
- Accuracy +10, Spear Accuracy +20, One-Handed Melee Accuracy +30 and -5 give 55.

Those give Normal scores 5.5 + 5 + 5.5 = 16 when all three preferences are
selected, not multiplied damage/speed/hit chance. Unselected effects earn no
score. Shared goal branches still count each node/effect once, with one point
per route node; already allocated base nodes earn no added reward. Required
nodes with reductions remain required.

Versatile Arms retains independent speed +6, accuracy +15 and +10 Strength plus
+10 Dexterity (20 total Attributes), without doubling any source. Reaving keeps
its +15 Dexterity alongside +8 attack speed. Unerring Impact and node 9941
supply only their one-handed accuracy lines to spear focuses. Coated Arms and
Impair gain their +25 damage source, not their unreviewed attack ailment-chance
or Maim chance. No node-name inference creates effects.

Only existing selected-preference tooltips gain handedness, classification and
overlap explanations. No new panels, controls, equipment selector or visible
score explanations. Manual priorities and catalog-driven save/transfer fields
remain unchanged; Accuracy is not automatically suggested.

## Native Evidence and Provenance

Reviewed PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [weapon classification](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/Data.lua),
plus local skill requirements and calculation setup. Moving upstream links are
references, not proof of byte identity with the tested isolated copy. Personal
PoB builds/settings remain unchanged.

| Local native file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Modules/Data.lua | ae4dc4f0d2b580b459e0f6596d7f9a45a258b65a1877932f308cefd072dc5289 |
| Modules/CalcSetup.lua | a45920408c7d502abc6230727f00efd06a2de85918a32e76a28bb9757b07bc23 |
| Data/Skills/act_dex.lua | d36694d3168f733be34b711f42953b0186685a14d60402ba42cf1d08c13971f9 |
| Data/Skills/act_str.lua | adab68bd650f7d7dceb3cc71dbbb412acc3013628fd059fd75bbd70123eb24ba |

Eight signed forms parse completely as INC Damage, Speed or Accuracy with the
appropriate Weapon1H, WeaponMelee, Hit and Attack flags. ModDB checks verify
one-handed melee weapon eligibility without a melee damage flag, two-handed/
spell/non-hit exclusion, and a synthetic one-handed ranged attack that does not
receive the melee-weapon-only sources. Independent overlap sums match the app's
55 damage, 15 speed and 55 accuracy values above.

Fourteen fixed-gear actor fixtures compare baseline and modified raw INC values:

| Skill / normal zero-quality weapon | Damage delta | Speed delta | Accuracy delta |
| --- | ---: | ---: | ---: |
| Lightning Spear / Hardwood Spear | +20 | +40 | +20 |
| Explosive Spear / Hardwood Spear | +20 | +40 | +20 |
| Lightning Arrow / Crude Bow | 0 | 0 | 0 |
| Ice Strike / Wrapped Quarterstaff | 0 | 0 | 0 |
| Boneshatter / Wooden Club | +20 | +40 | +20 |
| Boneshatter / Felled Greatclub | 0 | 0 | 0 |
| Spark / Wooden Club | 0 | 0 | 0 |

Each modified fixture adds four distinct +20 source lines to a level-20,
zero-quality skill. The +40 speed is two real +20 sources, not duplicate parsing
of one source. The mace contrast confirms why focus alone cannot establish
handedness. These are applied modifier deltas, not actual damage/attack-rate
ratios, final accuracy, real-build performance or in-game validation. Existing
fourteen missing-node startup messages in the isolated runtime are unrelated.

All 23 occurrences independently trace to extracted game stats:

| Raw stat ID | Occurrences | Values |
| --- | ---: | --- |
| damage_+%_with_one_handed_weapons | 11 | 10%, 25% |
| one_handed_attack_speed_+% | 2 | 3%, 8% |
| one_handed_melee_attack_speed_+% | 5 | 3%, 6% |
| one_handed_melee_accuracy_rating_+% | 5 | 8%, 12%, 15%, 16% |

Ignored reproducible evidence: `var/one-handed-preferences-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/one-handed-preferences-20261108/native-check.lua --job var/one-handed-preferences-20261108
node var/one-handed-preferences-20261108/verify.mjs
```

## Inventory and Validation

Preferences remain 171. Ten new wordings and 23 occurrences: wordings
812 -> 822 / 2,182 (37.7%); occurrences 3,323 -> 3,346 / 5,451 (61.4%). All 42
contexts retain old matches and both graph/catalog fingerprints. Only the two
reviewed spear focuses gain the ten expected wordings; manual and all other
scopes remain unchanged. Skills remain 41/399 and supports 31/567. These are
heuristic coverage measures, not overall project or complete mechanic coverage.

Quick validation passed 1,582 tests in 43 files, typecheck and no-loss coverage.
Tests cover every focus/allowlist, ambiguous handedness, weapon versus damage
classification, signs/zero/decimals, ownership/condition/alias exclusions,
generic/spear/handedness overlap, speed units and no Cast/Skill Speed fanout,
real node effects and unsupported mechanics, existing priorities/tooltips,
required reductions, shared/base costs and unchanged shortest routing. The
shared routing test table now accepts an explicit 3% speed unit; existing 10%
damage/accuracy cases retain their original arithmetic.

One final release validation passed 1,899 tests in 87 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk size warning remains
at 527.34 kB minified / 139.92 kB gzip; the build succeeds. No shared control or
routing contract or layout changed, so no repeated browser matrix was run.
`git diff --check` passed with existing LF/CRLF conversion notices.

Next proposal: one-handed melee Critical Hit Chance and Critical Damage Bonus,
plus one-handed attack ailment chance, with application and overlap checks.
Not implemented without approval. Fireball Concentrated Area remains on hold.
No commit, push or deployment is authorized by this batch.

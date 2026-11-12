# Two-Handed Damage and Melee Accuracy

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and isolated PoB runtime used for recent batches. Existing Attack Damage and
Accuracy Rating preferences gain explicit handedness scopes. No new preference
IDs, automatic priorities, graph/assets, solver, point-cost, save schema or
support compatibility changes. Shortest routing remains unchanged.

## Matching and Handedness

| Complete increased/reduced wording | Preference | Reviewed focuses |
| --- | --- | --- |
| N% Damage with Two Handed Weapons | Attack Damage | Lightning Arrow, Ice Shot, Rain of Arrows, Ice Strike, Tempest Flurry |
| N% Accuracy Rating with Two Handed Melee Weapons | Accuracy Rating | Ice Strike, Tempest Flurry |

Only full unconditional `N% increased/reduced ...` lines match. Increases add,
reductions subtract, with zero/decimals retained. Normal is still one score per
10% increased Attack Damage or Accuracy Rating; High/Highest multiply by two/
three. These are relative source weights, not total hit chance or Full DPS.

The explicit preset scopes are based on reviewed native skill weapon
requirements and weapon-type classification. Bows are two-handed ranged weapons;
quarterstaves are two-handed melee weapons. Both qualify for the damage source,
but bows do not qualify for melee-weapon accuracy. A melee damage flag is not
interchangeable with the melee-weapon classification used by the native accuracy
modifier. Crossbows are not automatically enabled because no crossbow focus is
reviewed in the current catalog.

Boneshatter and Rolling Slam allow both one- and two-handed maces. The current
focus does not identify the equipped weapon, so neither gains these handedness
scopes. A two-handed mace can benefit in PoB when explicitly equipped, but the
site does not assume one, infer it from node names/class/tags, or add an equipment
selector in this batch. Spears are one-handed in the reviewed classification and
do not qualify. Spells do not gain weapon-hit damage simply by holding a staff;
manual/unknown, curse and minion focuses receive no new scoped values either.

Conditional/recent/per-charge, minion/Companion/Totem/enemy ownership, more/less,
flat, malformed, composite, hyphenated aliases and unreviewed typed/handedness
wording remain excluded. No new support is declared compatible. Existing generic
manual Attack Damage/Accuracy remain available for other skills. Actual gear,
damage conversions, enemy evasion, accuracy caps/cannot-miss states and DPS are
not simulated by the scorer.

## Overlap and Tradeoffs

Distinct generic, matching weapon-specific and two-handed damage sources add
once in Attack Damage, not additionally in generic/Projectile/Spell/elemental
Damage. Genuine Melee Damage remains a separate source that also adds once for
its reviewed melee components. Generic, matching quarterstaff and two-handed
melee accuracy add once in Accuracy Rating. One-handed accuracy on the same
node is not a second benefit for a two-handed quarterstaff.

Independent native arithmetic: Attack Damage +10, Quarterstaff Damage +20,
Two-Handed Damage +30 and Two-Handed Damage -5 give 55 increased damage for a
matching quarterstaff hit. The same generic/weapon/handedness Accuracy values
give 55 increased accuracy, not 55 hit-chance points. Additional genuine Melee
Damage +12 increases the app's Attack Damage source total to 67 once, without
copying any line into other damage categories.

Overwhelm and Singular Purpose retain their -5% Attack Speed and +20% Stun
Buildup alongside the new +40% two-handed damage source. Unselected effects
remain unvalued, as before. Unerring Impact and node 9941 supply only their
two-handed accuracy lines to quarterstaff focuses; their one-handed accuracy
and unmodeled range do not double the value. Required penalties remain required.
Shared branching route nodes cost one point and contribute once; existing base
nodes earn no added-route reward.

Only existing selected-preference tooltips gain handedness and overlap notes.
No new controls, score panels, equipment settings or visible explanations.
Existing manual priorities and catalog-driven save/transfer behavior are kept.

## Native Evidence and Provenance

Reviewed PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [weapon classification](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/Data.lua),
plus local skill requirements and calculation setup. Moving upstream links are
references, not proof of byte identity with the tested isolated snapshot.
Personal PoB builds/settings remain unchanged.

| Local native file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Modules/Data.lua | ae4dc4f0d2b580b459e0f6596d7f9a45a258b65a1877932f308cefd072dc5289 |
| Modules/CalcSetup.lua | a45920408c7d502abc6230727f00efd06a2de85918a32e76a28bb9757b07bc23 |
| Data/Skills/act_dex.lua | d36694d3168f733be34b711f42953b0186685a14d60402ba42cf1d08c13971f9 |
| Data/Skills/act_int.lua | 5b42b006be62d02f428fa03dbcd94bc9385041e502dc0bfc0640ff1a2aa430ac |
| Data/Skills/act_str.lua | adab68bd650f7d7dceb3cc71dbbb412acc3013628fd059fd75bbd70123eb24ba |

Four signed forms parse completely as INC Damage with Weapon2H + Hit flags,
or INC Accuracy with Weapon2H + WeaponMelee + Hit flags. ModDB checks verify
matching scope, one-handed/spell/non-hit exclusion, ranged versus melee-weapon
accuracy and independent additive overlap. All five admitted focuses have
exactly one native allowed weapon type with the required classification;
both mace focuses explicitly allow both handedness categories.

Ten fixed-gear actor fixtures compare baseline and modified raw INC modifiers:

| Skill / normal zero-quality weapon | Damage INC delta | Accuracy INC delta |
| --- | ---: | ---: |
| Ice Strike / Wrapped Quarterstaff | +20 | +20 |
| Lightning Arrow / Crude Bow | +20 | 0 |
| Boneshatter / Wooden Club | 0 | 0 |
| Boneshatter / Felled Greatclub | +20 | +20 |
| Spark / Wrapped Quarterstaff | 0 | 0 |

Each modified fixture adds both +20 sources to a level-20 zero-quality skill.
The mace contrast verifies why equipment cannot be inferred from focus; the
spell contrast verifies that equipped staff classification alone is insufficient.
These are applied modifier-source deltas, not 20% more damage, damage ratios,
final hit chance, actual build performance or in-game validation. Existing
fourteen missing-node startup messages in the isolated runtime remain unrelated.

All seventeen occurrences independently trace to extracted game stats:

| Raw stat ID | Occurrences | Values |
| --- | ---: | --- |
| damage_+%_with_two_handed_weapons | 15 | 10%, 40% |
| two_handed_melee_accuracy_rating_+% | 2 | 8%, 16% |

Ignored reproducible evidence: `var/two-handed-preferences-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/two-handed-preferences-20261108/native-check.lua --job var/two-handed-preferences-20261108
node var/two-handed-preferences-20261108/verify.mjs
```

## Inventory and Validation

Preferences remain 171. Four new wordings add seventeen occurrences: wordings
808 -> 812 / 2,182 (37.2%); occurrences 3,306 -> 3,323 / 5,451 (61.0%). All 42
contexts preserve old matches and both graph/catalog fingerprints. Only the
five intended focuses gain their exact two/four wording sets; manual and
ambiguous-mace coverage remain unchanged. Skills stay 41/399 and supports
31/567. These are heuristic/catalog measures, not overall completion or Full DPS.

Quick validation passed 1,557 tests in 42 files, typecheck and no-loss coverage.
Tests cover every focus/allowlist, ambiguous handedness and wrong weapons,
melee versus ranged/spell/minion scope, signs/zero/decimals, conditions and
ownership, generic/weapon/handedness aggregation, unselected categories, preserved
manual priorities, source occurrences and real tradeoffs, existing tooltips,
required reductions, shared/base node costs and unchanged shortest routing.

One final release validation passed 1,874 tests in 86 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk size warning remains
at 525.67 kB minified / 139.65 kB gzip; the build succeeds. No shared control or
routing contract or layout changed, so no repeated browser matrix was run.
`git diff --check` passed with existing LF/CRLF conversion notices.

Next proposal: one-handed weapon Damage, one-handed weapon and melee-weapon
Attack Speed, and one-handed melee Accuracy Rating for reviewed spear focuses,
with classification and overlap checks. Do not guess mace equipment. This is
not implemented without approval. Fireball Concentrated Area remains on hold.
No commit, push or deployment is authorized by this batch.

# Melee and Weapon Stun/Freeze Buildup

Reviewed 2026-11-08 against the bundled PoE2 0.5.5f graph, extracted game tables
and isolated PoB 0.23.1 runtime. Existing optional Stun Buildup and Freeze Buildup
preferences gain explicit component/weapon scopes. No new preference IDs,
automatic priorities, graph/assets, solver, point-cost, save schema or support
compatibility changes. Shortest routing remains unchanged.

## Rules and Application Requirements

| Complete increased/reduced wording | Reviewed focuses | Component restrictions |
| --- | --- | --- |
| N% Stun Buildup with Melee Damage | Ice Strike, Tempest Flurry, Boneshatter, Rolling Slam | Stun-capable melee hit portions only |
| N% Stun Buildup with Quarterstaves | Ice Strike, Tempest Flurry | Matching weapon, stun-capable melee hits |
| N% Stun Buildup with Maces | Boneshatter, Rolling Slam | Boneshatter shockwave; Rolling Slam damaging slams |
| N% Freeze Buildup with Quarterstaves | Ice Strike only | Reviewed native-cold hits that can inflict Freeze |

Only full `N% increased/reduced ...` lines match. Increases add, reductions
subtract, and zero/decimals are preserved. Normal remains one heuristic score
per 10% increased buildup; High/Highest multiply by two/three. Explicit preset
scopes and the reviewed weapon registry control matching, not class, Path start,
node name, tags or an inferred loadout. Manual/unknown focuses, spells, minions,
wrong weapons and unsupported aliases gain no new scoped value.

Ice Strike has native 80% physical-to-cold conversion. Tempest Flurry has native
lightning conversion, not a cold source. Quarterstaff Freeze Buildup therefore
does not score for Tempest Flurry; gear-added cold or ailment-enabling conversions
are not assumed. Ice Strike's generic damage/critical or conversion preferences
do not imply guaranteed Freeze. In the reviewed native setup, Cold cannot cause
Heavy Stun by default; Ice Strike still has a stun-capable physical portion.

Boneshatter's initial strike has 100% less Stun Buildup and receives no buildup
benefit. The reviewed shockwave can benefit, but requires an enemy Primed for
Stun. The tooltip explicitly says the preference does not prime enemies or
predict shockwave frequency. Rolling Slam's non-damaging sequence wrapper does
not qualify as a hit; its actual damaging slams do. No conditional hit counts,
enemy priming, immunity windows or multi-component weighting are calculated.

Buildup is not damage, flat ailment chance, duration, threshold reduction or
Stun Recovery. Sources require appropriate hit damage and the ability to apply
the immobilisation. Build-wide prohibitions, conversions, gear, enemy thresholds,
uptime and actual frequency remain outside this heuristic. Existing generic
manual Stun/Freeze Buildup priorities stay available for other skills; the new
scoped allowlists do not pretend to audit an entire build's application states.
No new support compatibility is assumed, including Brutality for Ice Strike.

Conditional/recent/per-charge, minion/Companion/Totem/enemy ownership, more/less,
flat, malformed and composite wording remains excluded. Empowered-Attack Freeze,
Stun-to-Freeze conversions, Heavy Stun decay and typed incoming effects remain
separate, not inferred from their words or a matching weapon.

## Overlap and Point Accounting

Generic, melee and matching weapon Stun Buildup add once under `stunBuildup`.
Generic and matching quarterstaff Freeze Buildup add once under `freezeBuildup`.
A scoped line does not also create Damage, Cold Damage, chance, threshold,
duration or generic Immobilisation Buildup values. Distinct genuine
Immobilisation Buildup sources remain in their own preference, not duplicated
into each specific buildup category.

Independent arithmetic: generic Stun +10, Melee +20, Quarterstaff +30 and
Quarterstaff -5 give 55 for the matching melee quarterstaff hit. Replacing the
quarterstaff sources with Mace +40 gives 70 for melee mace hits. No cross-weapon
bonus applies. Generic Freeze +10, Quarterstaff +20 and Quarterstaff -5 give 25
only for a matching eligible freeze component. These are additive sources,
not multiplicative power estimates.

One with the River's Stun, Freeze and Daze sources stay independent; its
equipment-dependent defence remains unsupported. Heavy Weaponry retains genuine
Melee Damage and Strength. Unleash Fire's conditional projectile damage is not
assumed active. Multiple selected effects or shared goals do not cost multiple
points for the same route node, and already allocated base nodes earn no added
reward. Required nodes with reductions remain required. No preset automatically
selects either optional buildup preference or changes an existing priority.

## Native Evidence and Provenance

Reviewed PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [offence calculation](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua),
with local skill definitions and buildup/application defaults. Moving upstream
links are references, not proof of byte identity with the tested isolated copy.
Personal PoB builds/settings remain unchanged.

| Local native file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Modules/CalcOffence.lua | eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435 |
| Modules/CalcSetup.lua | a45920408c7d502abc6230727f00efd06a2de85918a32e76a28bb9757b07bc23 |
| Modules/Data.lua | ae4dc4f0d2b580b459e0f6596d7f9a45a258b65a1877932f308cefd072dc5289 |
| Data/Skills/act_int.lua | 5b42b006be62d02f428fa03dbcd94bc9385041e502dc0bfc0640ff1a2aa430ac |
| Data/Skills/act_str.lua | adab68bd650f7d7dceb3cc71dbbb412acc3013628fd059fd75bbd70123eb24ba |

Eight signed forms parse completely as INC EnemyHeavyStunBuildup or
EnemyFreezeBuildup. Melee Damage uses the Melee flag; Quarterstaff/Mace use
their respective weapon plus Hit flags. ModDB checks verify signed amounts,
spell exclusion, independent additive overlap and no Damage/threshold/chance/
duration leakage.

Twelve native actor/component fixtures use zero-quality normal Wrapped
Quarterstaff or Wooden Club, level-20 zero-quality skills and explicit stat-set
selection. Independent JavaScript verification checks:

- Ice Strike's +20 melee/+20 quarterstaff Stun sources give 1.4 times its native
  Heavy Stun Buildup; Freeze Buildup and Average Damage stay unchanged.
- +20 quarterstaff Freeze gives 1.2 times Ice Strike's native Freeze Buildup,
  without changing Heavy Stun Buildup or Average Damage.
- Tempest Flurry retains raw +20 Freeze Buildup but produces zero native Freeze
  Buildup without cold. Its applicable Stun source still changes Stun Buildup.
- Cannot inflict Freeze or Chill leaves the raw Ice Strike Freeze modifier
  present but produces zero Freeze Buildup. Cannot Immobilise enemies similarly
  prevents Heavy Stun despite Rolling Slam's raw Stun modifier.
- Boneshatter initial strike produces zero Stun Buildup; explicitly selecting
  its shockwave yields positive buildup and the expected 1.2 ratio from +20.
  Rolling Slam's first damaging slam yields the expected 1.4 combined ratio.

These fixed-gear fixtures verify applicability/source arithmetic, not real-build
DPS, priming, uptime or in-game behavior. The site does not import their actor
state or gain a runtime prohibition engine. Existing fourteen missing-node
startup messages in the isolated runtime remain unrelated.

All eleven source occurrences independently trace to extracted game stats:

| Raw stat ID | Occurrences | Node IDs |
| --- | ---: | --- |
| melee_hit_damage_stun_multiplier_+% | 3 | 20008, 41512, 49968 |
| quarterstaff_hit_damage_stun_multiplier_+% | 3 | 2361, 32442, 34316 |
| mace_hit_damage_stun_multiplier_+% | 2 | 526, 17791 |
| quarterstaff_hit_damage_freeze_multiplier_+% | 3 | 34316, 61632, 64700 |

Ignored reproducible evidence: `var/scoped-buildup-review-20261108/`.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/scoped-buildup-review-20261108/native-check.lua --job var/scoped-buildup-review-20261108
node var/scoped-buildup-review-20261108/verify.mjs
```

## Inventory and Validation

Preferences remain 171. Eight new wordings and eleven occurrences: wordings
800 -> 808 / 2,182 (37.0%); occurrences 3,295 -> 3,306 / 5,451 (60.6%). All 42
contexts preserve old matches and both source fingerprints. Only four intended
focuses gain their exact applicable wording sets, with Freeze scoped to Ice
Strike. Manual coverage is unchanged. Skills remain 41/399, supports 31/567,
families 19 and reviewed pairs 292. These are heuristic coverage measures, not
overall project or full mechanic completion.

Quick validation passed 1,538 tests in 41 files, typecheck and no-loss coverage.
Tests cover every focus/allowlist, native-cold eligibility, signs/zero/decimals,
ownership, conditions, unreviewed mechanics, generic/melee/weapon aggregation,
independent real node effects, optional priorities, existing tooltip controls,
required reductions, unchanged shortest and shared/base point costs. Older
rejection tests now recognize only the newly reviewed values while retaining
their damage/speed, wrong-weapon and conditional guards.

One final release validation passed 1,855 tests in 85 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk size warning remains
at 524.40 kB minified / 139.38 kB gzip; the build succeeds. No shared control or
routing contract or layout changed, so no repeated browser matrix was run.
`git diff --check` passed with existing LF/CRLF conversion notices.

Next proposal: two-handed weapon Damage and two-handed melee Accuracy Rating,
with verified handedness, ranged/melee distinctions and overlap checks. Do not
guess one/two-handed mace equipment. Not implemented without approval. Fireball
Concentrated Area remains on hold. No commit, push or deployment is authorized.

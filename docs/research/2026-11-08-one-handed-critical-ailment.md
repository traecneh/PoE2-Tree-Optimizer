# One-Handed Melee Critical and Attack Ailment Preferences

Reviewed 2026-11-08 against the PoE2 0.5.5f graph/tables and isolated PoB 0.23.1
runtime. Three explicit scopes extend existing optional Critical Hit Chance,
Critical Damage Bonus and Generic Ailment Chance preferences for Lightning
Spear and Explosive Spear only. No new preference IDs, automatic priorities,
support compatibility, solver, cost, save schema, graph or assets changes.
Shortest routing remains unchanged.

## Exact Matching and Limits

| Complete wording, increased or reduced | Preference | Normal unit | Source occurrences |
| --- | --- | --- | ---: |
| N% Critical Hit Chance with One Handed Melee Weapons | Critical Hit Chance | 15% | 2 |
| N% Critical Damage Bonus with One Handed Melee Weapons | Critical Damage Bonus | 10% | 1 |
| Attacks with One-Handed Weapons have N% Chance to inflict Ailments | Generic Ailment Chance | 10% | 3 |

The first two use `N% increased/reduced ...`; the last uses the same signed
modifier after its attack prefix. Full-line matching retains decimals/zero,
adds increases and subtracts reductions. No flat, more/less, conditional,
owned, composite, malformed or unreviewed alias forms are enabled. Each source
scores only when its existing preference is selected; High/Highest remain x2/x3.

The two reviewed spear focuses require a one-handed melee-classified weapon,
even though their primary hits are projectile attacks, not melee damage.
Bow/quarterstaff, spell, curse, minion, manual/unknown focuses receive none of
the new scopes. Mace focuses permit both handedness categories, so equipment
is not inferred. A node/class name or holding a weapon does not enable a scope.
Existing generic manual values and reviewed support behavior remain unchanged.

These are source heuristics, not final critical/ailment probabilities or DPS:

- Critical chance requires nonzero base critical chance and being able to crit.
- Critical Damage Bonus scales extra critical damage, not the whole critical
  multiplier, and requires damaging critical hits allowed to deal extra damage.
- Increased ailment chance is relative, not added percentage points. It does
  not grant Poison/Bleeding chance from zero. Elemental application can instead
  have a damage-derived base chance. Eligible damage/hits and permission to
  inflict each ailment are still required.
- Gear, base application chance, damage thresholds, caps and build prohibitions
  are not simulated by the site. The selected-preference tooltips state this.
  No new controls, performance claims or automatic ailment/crit suggestions.

## Overlap and Source Audit

Distinct generic, attack-only, spear and handedness critical sources add once
within their own preference, not multiply. A one-handed ailment INC line scores
once under Generic Ailment Chance, not Poison/Bleeding/Daze flat chance, buildup,
magnitude or critical chance. Separate genuine flat chance sources remain
separate. Existing generic Daze-scaling limitations are not widened.

Independent arithmetic for a qualifying spear focus:

- Critical chance: generic 15 + attack 15 + spear 10 + one-handed 25 -5 = 60 (score 4).
- Critical bonus: generic 10 + attack 20 + spear 30 + one-handed 40 -5 = 95 (score 9.5).
- Ailment chance: generic 10 + one-handed 20 -5 = 25 (score 2.5).

Combined Normal score is 16, not a predicted damage multiplier. Shared branch
nodes count once; existing base nodes earn no new reward; required penalties
remain required. Coated Arms retains damage 25 and gains ailment chance 20 only
for the reviewed spear scopes. Impair's unreviewed Maim line remains excluded.

All six occurrences trace independently to extracted English PassiveSkills and
Stats under `var/refresh-0.5.5f/tables/English/`:

| Raw stat ID | Nodes | Values |
| --- | --- | --- |
| one_handed_melee_critical_strike_chance_+% | 12751, 26490 | 10% |
| one_handed_melee_critical_strike_multiplier_+ | 6229 (Push the Advantage) | 40% |
| one_handed_attack_ailment_chance_+% | 44330 (Coated Arms), 47733, 5108 | 20%, 15%, 15% |

## Native Checks

Reviewed official PoB [parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [offence calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
Moving upstream references do not establish byte identity with the isolated
tested copy. Personal PoB builds/settings were not changed.

| Tested local file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Modules/Data.lua | ae4dc4f0d2b580b459e0f6596d7f9a45a258b65a1877932f308cefd072dc5289 |
| Modules/CalcSetup.lua | a45920408c7d502abc6230727f00efd06a2de85918a32e76a28bb9757b07bc23 |
| Modules/CalcOffence.lua | eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435 |
| Data/Skills/act_dex.lua | d36694d3168f733be34b711f42953b0186685a14d60402ba42cf1d08c13971f9 |
| Data/Skills/act_str.lua | adab68bd650f7d7dceb3cc71dbbb412acc3013628fd059fd75bbd70123eb24ba |

Six signed forms parse completely as INC CritChance, CritMultiplier and
AilmentChance. Critical forms require Weapon1H/WeaponMelee/Hit flags; attack
ailment prefix sets Weapon1H. Native ModDB checks reject spells/two-handed
weapons; a synthetic one-handed ranged attack receives the ailment source but
not the melee-weapon critical sources. This broader native case does not enable
unreviewed site focuses. Independent ModDB sums match 60/95/25 above.

Twenty level 20, quality 0, fixed-normal-weapon actor fixtures passed:

- Lightning Spear increased/reduced 20 changes critical chance, extra critical
  bonus and noncritical Shock chance by x1.2/x0.8 in isolated uncapped cases.
  Poison/Bleeding without flat sources stay zero.
- Flat Poison/Bleeding 20 becomes 24 with increased 20, 16 with reduced 20.
  Flat 80 with increased 50 caps at 100, not 120.
- Cannot crit, no extra critical damage and cannot elemental ailments retain
  raw modifiers but give actual critical chance 0, critical multiplier 1 and
  Shock chance 0 respectively. These checks qualify the documented limits,
  not a new application-state engine in the website.
- Both spear skills and one-handed-mace Boneshatter receive all three +20 INC
  sources natively. Bow Lightning Arrow, quarterstaff Ice Strike and Spark
  holding a one-handed mace receive zero. Site mace handedness stays unknown.

Attack actor assertions read the native MainHand hit output; spell controls
use their root output. Existing fourteen missing-node runtime startup messages
are unrelated. Ignored reproducible evidence is under
`var/one-handed-critical-ailment-20261108/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/one-handed-critical-ailment-20261108/native-check.lua --job var/one-handed-critical-ailment-20261108
node var/one-handed-critical-ailment-20261108/verify.mjs
```

## Coverage and Validation

Preferences remain 171. Four new wordings/six occurrences: wordings 822 -> 826
/2,182 (37.9%); occurrences 3,346 -> 3,352 /5,451 (61.5%). All 42 contexts retain
old matches and both graph/catalog fingerprints. Only the two spear contexts
gain exactly the four reviewed wordings. Skills remain 41/399 and supports 31/567.
These are heuristic coverage counts, not complete mechanic support.

Quick validation passed 1,603 tests in 44 files, typecheck and no-loss coverage.
Tests cover all focuses/allowlists, signs/units/ownership/conditions, optional
selection, generic/attack/spear/handedness overlap, source inventory, flat chance
separation, existing priorities/tooltips, shared/base costs and shortest routing.
One final release validation passed 1,920 tests in 88 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk warning remains at
529.42 kB minified / 140.35 kB gzip; the build succeeds. No shared control,
routing contract, persistence or layout changed, so no repeated browser matrix
was run. The initial quick run caught an invalid Daze wording in the new test
fixture; correcting that fixture, not widening matching, resolved both failures.

Next proposal: Blind chance, effect and duration, plus spell-hit Hinder chance
and Hinder duration, with application, ownership and overlap checks. Not
implemented without approval. Fireball Concentrated Area remains on hold.
No commit, push or deployment is authorized by this batch.

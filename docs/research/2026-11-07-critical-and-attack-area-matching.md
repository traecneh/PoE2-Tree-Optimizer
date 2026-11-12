# Scoped Critical Chance and Attack Area

This note records the initial scope rollout. The subsequent
[melee preset batch](2026-11-07-melee-skill-presets.md) additionally enables
attack crit and attack area for Ice Strike, Tempest Flurry, Boneshatter and
Rolling Slam, using the same matching rules and scales.

## Reviewed Rules

These rules extend the existing weighted preferences, without adding controls,
panels, automatic preferences or default weights. Each rule recognizes complete,
unconditional `N% increased` and `N% reduced` lines, including decimal values.

| Wording | Preference | Reviewed focus |
| --- | --- | --- |
| Critical Hit Chance for Spells | criticalChance | Spark, Fireball |
| Critical Hit Chance for Attacks | criticalChance | Lightning Arrow |
| Area of Effect for Attacks | areaOfEffect | Lightning Arrow |

Essence Drain's preset targets its DoT, so it does not opt into critical-hit
matching merely because the delivery projectile is a spell hit. Enfeeble has no
damaging hit, and player attack/spell modifiers do not transfer to Arsonists.
Unknown/no focus retains generic-only behavior. Eligibility is an explicit
reviewed scope, not a tag inference. Users must select the corresponding
preference manually; existing preset suggestions are unchanged.

## Evidence

Reviewed on 2026-11-07 against the native PoB reference in
`var/pob-evaluation-spike-20261106/runtime/` and the upstream definitions.
Source links are moving upstream references, not immutable snapshot guarantees.

- [ModParser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L1043-L1064)
  restricts `for spells` / `for attacks` with Spell / Attack flags.
- [Lightning Arrow](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L4152-L4333)
  has native attack stat sets, the Area skill type and a base area radius in
  both Projectile and Beam stat sets. [CalcOffence](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua#L400-L530)
  calculates radius from area modifiers. Area is treated as coverage utility,
  not area damage, an extra hit count or a direct DPS increase.
- [Controlled Destruction](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2177-L2214)
  prevents the supported skill from critically hitting. Its reviewed support
  record disables `spellCriticalChance`, but not projectile-speed scope.

The generic manual critical preference remains unchanged by policy because it
may represent another skill. A tooltip distinguishes that from blocked scoped
spell crit. Selecting a support never changes the user's saved weights.

## Counting and Exclusions

General and matching scoped values sum into the existing preference once.
Reductions remain negative. Contribution node counts use each net-contributing
node once, not each matching line. Neither chance caps nor actual critical-hit
probabilities are calculated; scores remain normalized relative priorities.
Other gear, keystone and build-configuration interactions remain outside this
heuristic scorer; Controlled Destruction is an explicit reviewed support rule,
not a complete critical-hit eligibility engine.

Excluded: base critical chance overrides, Critical Damage Bonus, Attack Area
Damage, more/less modifiers, minion prefixes, conditions, per-enemy scaling and
unreviewed spell/attack wording. For example, Sunder the Flesh's base-crit
override and Engineered Blaze's conditional area are not treated as plain
increased crit or area.

The 0.5.5f bundled graph contains 19 exact spell-crit matches (18 positive and one
zero; four are ascendancy records), 17 attack-crit matches and 49 attack-area
matches. These counts describe stat coverage, not reachability or visible main
tree availability. Existing tree visibility and optimizer exclusions still apply.

## Integration and Verification

Weighted worker requests now carry the already-normalized selected support IDs
as well as focus ID. The scorer and tooltips resolve the same reviewed scopes.
Shortest requests omit this context and their routing remains unchanged. Saved
build schema is unchanged: focus and support IDs already persist, and scopes are
resolved from the catalog rather than trusted from imported settings.

- `npm test`: 451 tests across 52 files passed.
- `npm run build` and `npm run validate:graph`: passed.
- Focused tests cover cross-scope rejection, general/scoped additions, reductions,
  zero values, conditions, overrides, support blocking, request propagation,
  equal-cost routing, contribution counts and unchanged shortest behavior.
- Edge worker smoke: Critical Overload at zero extra points scored 2.33 across
  three spell-crit nodes for Spark, and zero with Controlled Destruction or
  Lightning Arrow, at Normal priority.
- Edge worker smoke: Catapult plus Near Sighted at zero extra points scored
  attack crit 2 (one node) and area 2.4 (three nodes) for Lightning Arrow, and
  zero for both with Spark, at Normal priority.
- The existing area preference tooltip fits a 1100 x 760 viewport without text
  overflow. No new controls or explanation panels were added.

These are software and heuristic checks, not live-game or Full DPS validation.

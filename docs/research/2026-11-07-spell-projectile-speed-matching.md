# Spell-Projectile Speed Matching

## Scope and Evidence

The first skill-scoped passive rule recognizes only complete, unconditional
`N% increased Projectile Speed for Spell Skills` and corresponding `reduced`
lines. It requires an explicit reviewed `spellProjectileSpeed` scope on the
selected preset; a gem tag, node name, preference ID or linked support alone
cannot enable it. There is no new scoring category or automatic preference.

PoB maps [projectile speed](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L600-L606)
to `ProjectileSpeed`, and [for spell skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L1043-L1052)
restricts the modifier with `ModFlag.Spell`. Local generated stat descriptions
include both increased and reduced forms. Native skill stat sets were reviewed
for [Spark](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L19893),
[Fireball](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L7374)
and [Essence Drain](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L6511).
These three presets opt in. Links are moving upstream references; local native
evidence is in `var/pob-evaluation-spike-20261106/runtime/`.

Essence Drain's delivery projectile benefits from speed, not its chaos DoT DPS.
Its preset still does not suggest projectile speed automatically; the user must
choose that utility preference. Lightning Arrow is an attack, Enfeeble has no
projectile, and player spell-projectile bonuses do not transfer to Arsonists.
Their presets do not opt in. Unknown/no focus retains the generic-only behavior.
Reviewed supports do not change this projectile-speed scope. The later
[critical/area rules](2026-11-07-critical-and-attack-area-matching.md) include an
explicit Controlled Destruction restriction for spell-crit scope only.

## Current Tree

Bundled graph: 0.5.5f, extracted `2026-11-07T03:20:21.651Z`.

| Node ID | Name | Spell-only speed |
| --- | --- | ---: |
| 2335 | Turn the Clock Forward | +15% |
| 26135 | Spell Damage and Projectile Speed | +8% |
| 35564 | Turn the Clock Back | -10% |
| 55041 | Spell Damage and Projectile Speed | -5% |

All four also have ordinary Spell Damage lines. Those remain independent and
unchanged. Full-line scope matching keeps conditions, minion/attack prefixes,
more/less modifiers and unrelated wording excluded. General and applicable
scoped speed add into the existing projectileSpeed value once. Reductions are
negative; the contribution node count counts each net-contributing node once.

## Integration and Verification

Weighted requests now carry `focusSkillId` from application state through the
worker boundary. The same context-aware values power route search and score
breakdowns. `scorePassiveNode` accepts the same optional context. Existing callers
without context retain generic-only matching. Shortest request shape and solver,
point budgets, goals, allocations and saved build schema are unchanged. Saved
focus IDs already round-trip and resolve scopes from the reviewed catalog.

Tests cover eligible/ineligible focus, both signs, mixed general/scoped lines,
conditions and malformed values, current node wording, score/count consistency,
support priorities applied once, worker request propagation and unchanged
shortest dispatch. `npm test` passed 432 tests across 52 files; the production
build and graph validation passed.

Edge worker smoke test: with Turn the Clock Forward required, Projectile Speed
at Normal and zero extra points, Spark reported `2.3 (2 nodes)` on an 18-point
route. The raw bonuses are 15% + 8%, so independent arithmetic is 23 / 10 = 2.3.
Switching only to Lightning Arrow reported `0 (0 nodes)`. This validates the
worker's scope propagation, not live-game or Full DPS accuracy.

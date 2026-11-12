# Quarterstaff and Mace Passive Matching

Reviewed on 2026-11-07 against the bundled PoE2 0.5.5f graph and current upstream
PoB native definitions. No graph, assets, preference categories or optimizer
algorithms were changed.

## Scope

The existing weapon-aware damage/speed rules now explicitly opt in:

| Focus | Exact weapon wording | Existing preferences |
| --- | --- | --- |
| Ice Strike, Tempest Flurry | with Quarterstaves | Attack Damage, Attack Speed |
| Boneshatter, Rolling Slam | with Maces | Attack Damage, Attack Speed |

Only complete unconditional numeric increased/reduced lines are supported.
Generic and matching weapon values add once. Weapon damage does not also populate
Physical Damage, elemental damage, Projectile Damage or Damage over Time.
Reductions remain penalties, not discarded lines. Separate damage and speed
effects may contribute to both preferences while costing only one passive point.

The allowlist for wording and scope names is shared between the matcher and
existing tooltips. It is not inferred from a class, Path start, skill name or gem
tag. Bow/spear behavior is preserved. Wrong weapons, Crossbows, generic Staves,
manual/no-focus, spells and minions receive no new bonuses. No new UI controls
or score panels were added.

## Native Evidence

The four reviewed native skill blocks match current upstream `dev` byte for byte
after newline normalization. Their `weaponTypes` entries and corresponding
[Gems.lua](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua)
weapon requirements establish the normal weapon context:

- [Ice Strike](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L13021-L13264) and
  [Tempest Flurry](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L21381-L21690)
  use native `Staff` internally; the gem records name the required weapon
  Quarterstaff. That internal identifier is not used to accept generic caster
  staff passive wording.
- [Boneshatter](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L1815-L1996) and
  [Rolling Slam](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua#L16108-L16406)
  permit One Hand Mace and Two Hand Mace. Both use the same reviewed Maces wording.
- The [native modifier flags](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L984-L1020)
  attach weapon/Hit scope for Maces and Quarterstaves. Mapping that weapon hit
  bonus into Attack Damage is our heuristic policy, not a PoB DPS calculation.

Links to upstream `dev` may move. Local reference files remain under
`var/pob-evaluation-spike-20261106/runtime/`.

## Bundled Tree Coverage

The read-only audit found four newly recognized nodes per matching focus:

- Quarterstaff speed: 4536, 11598 and 44516 grant 3% each; Whirling Assault 37514
  grants 8%. There are no unconditional Quarterstaff damage lines in this graph.
- Mace damage: 375 grants 15%; 13937 and 14693 grant 14% each; 52829 grants 10%.
  There are no unconditional Mace attack-speed lines in this graph.

Both numeric rules are supported for each weapon. Synthetic tests for the
currently absent wording establish parser behavior, not the existence of those
passives. Bow coverage remains seven damage/six speed nodes and Spear coverage
five damage/four speed nodes, with eight distinct Spear passives.

## Conservative Limits

Stun/Freeze buildup, accuracy, weapon critical stats, Heavy-Stun conditionals,
aftershock chance, splash damage, charge interactions, physical-only weapon
damage and defensive bonuses while wielding a weapon remain unmodeled. In
particular, Skullcrusher and One with the Storm are not assigned unconditional
damage scores from their special effects.

A later [optional weapon-critical pass](2026-11-07-optional-weapon-critical-chance.md)
adds exact Quarterstaff critical-chance lines for Ice Strike/Tempest Flurry when
Critical Hit Chance is explicitly selected. Critical damage and other weapon
critical effects remain outside that extension.

Matching does not model actual equipment or alternate unarmed setups such as
Hollow Palm Technique/Facebreaker. Native equipment handling is separate from
these normal-weapon preset scopes. Whole-build mechanics and Full DPS remain
outside this workflow. Rolling Slam keeps its lower speed priority and fixed
added-time caveat; Boneshatter still does not assume permanent Stun priming.

## Regression Checks

Tests cover all four focuses and both numeric forms, generic-plus-scoped totals,
reductions, decimals and zero-net effects, other weapons and generic Staves,
unsupported focuses, real graph wording and conditional/special exclusions.
Existing support refinements retain the weapon scope without silently changing
weights. Routing fixtures preserve required goals, already allocated nodes and
budgets, exclude base effects from new-route scores, and compare shortest output
against the unchanged solver. Tooltip tests use the same scopes and verify that
no controls or settings writes were added.

## Verification Results

- Focused checks: 225 tests across five files passed.
- `npm test`: 592 tests across 52 files passed.
- `npm run build`, `npm run validate:graph` and `git diff --check`: passed.
- Read-only whole-graph audit confirms four Quarterstaff speed and four Mace
  damage nodes, with the absent counterparts still zero. Bow and Spear matching
  counts are unchanged.
- Local Edge: Monk/Ice Strike/Whirling Assault optimization and apply used 18
  points, matching the exact baseline with zero extra points. Three Quarterstaff
  speed nodes produced 14% total speed: 14 / 3 * priority 2 = 9.3333. A manual
  Energy Shield priority 3 contributed 5 / 20 * 3 = 0.75 from +5 Energy Shield.
  Total 10.0833 agrees with the displayed 10.08. Save/new/load preserved the
  focus, manual defence, goal, priorities and budget; switching to Tempest Flurry
  did not rewrite them.
- Local Edge: Warrior/Rolling Slam/Mace Damage optimization and apply used 19
  points, also the exact baseline with zero extra points. Three Mace damage nodes
  produced 43% damage: 43 / 10 * priority 3 = 12.9. Physical Damage remained zero;
  aftershock effects were not assigned a score. Save/new/load and full-page reload
  retained the focus and low speed priority. Switching to Boneshatter did not
  rewrite damage priorities.
- Screenshots reviewed at 1440x1000, 1100x760 and 390x844 without horizontal
  document overflow. Existing preference tooltips were checked with the trigger
  centered in the scroll pane; bottom-edge positioning remains the pre-existing
  limitation documented in the bow/spear matching pass.
- No application console errors or warnings. Initial load reported only the
  existing missing `favicon.ico`; none remained after reload.

These checks verify matching, point accounting and software workflows, not Full
DPS or globally optimal weighted scores. A separate read-only audit found 29
nodes with plain unconditional Melee Damage wording, which remains outside the
current parser and is a candidate for the next reviewed scope expansion.

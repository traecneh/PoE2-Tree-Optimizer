# Bow and Spear Passive Matching

Reviewed on 2026-11-07 against the bundled PoE2 0.5.5f graph and native PoB
weapon requirements for the existing reviewed skill presets. No graph or assets
were changed.

## Rules

Only complete, unconditional increased/reduced numeric lines are recognized:

| Wording | Focus skills | Existing preference |
| --- | --- | --- |
| Damage with Bows | Lightning Arrow, Ice Shot, Rain of Arrows | Attack Damage |
| Attack Speed with Bows | Lightning Arrow, Ice Shot, Rain of Arrows | Attack Speed |
| Damage with Spears | Lightning Spear, Explosive Spear | Attack Damage |
| Attack Speed with Spears | Lightning Spear, Explosive Spear | Attack Speed |

These opt-ins are explicit preset scopes, not an inference from a gem tag, node
name, character class, Path start or allocation mode. Manual/no-focus, other
presets and the wrong weapon receive no scoped bonus. Crossbows are not Bows.
Existing skill/support selections and saved-build formats remain unchanged.

The native [PoB modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua#L984-L1020)
keeps Bow, Spear and Crossbow modifiers distinct and attaches the weapon/Hit
flags. The reviewed attack presets provide the weapon context. Mapping weapon
hit damage into the existing Attack Damage heuristic is our scoring policy,
not a PoB damage calculation. It does not imply ailment scaling.

Generic and matching weapon values add once, including reductions. A weapon
damage line does not also populate Physical Damage, elemental damage or
Projectile Damage. The original per-preference normalization and weights remain
unchanged. A node with separate damage and speed lines may legitimately contribute
to both preferences, but is still a single passive point in route costs.

## Current Tree Coverage

Read-only graph audit identified:

- Bows: seven damage nodes and six speed nodes, 13 distinct passives. Each of the
  three reviewed bow focuses gains this same scope.
- Spears: five damage nodes and four speed nodes, eight distinct passives.
  Roll and Strike appears in both effect sets but is one node.

Examples include Bow Damage 8573 (12% damage), Bow Attack Speed 7066 (5% speed),
Spear Damage 9240 (10% damage), Precise Point 13895 (25% damage), Spear Attack
Speed 19767 (3% speed) and Roll and Strike 61112 (25% damage and 10% speed).
These are matching counts, not guaranteed reachability or net build benefit.

## Conservative Exclusions

Conditional bonuses, minion-owned effects, more/less multipliers, combined
unreviewed wording, accuracy, weapon critical stats, physical-only weapon damage,
melee/projectile-only weapon damage, Culling Strike and projectile-speed-to-damage
conversion mechanics remain outside this rule. In particular Focused Thrust's
Surrounded/distance bonuses and Feathered Fletching's conversion are not treated
as unconditional weapon damage.

UI changes are limited to existing tooltips explaining which weapon scope
counts. There are no new controls or score panels. Whole-build accuracy, gear,
support uptime, charge supply, rain overlap, detonation timing and Full DPS remain
unmodeled. Shortest routing, required goals, point budgets and manual priorities
are unchanged.

## Regression Checks

Focused tests cover all five matching skills, opposite weapons, Crossbows,
no-focus/spell/minion/melee cases, reductions, zero-net and decimal effects,
general-plus-weapon totals, real-tree wording and special/conditional exclusions.
Route tests verify equal-cost preference changes, negative tradeoffs, existing
allocation exclusion, two required goals, exact contribution accounting and
unchanged shortest results. Existing tooltips explain the matching scope without
writing settings or adding controls.

## Verification Results

- `npm test`: 548 tests across 52 files passed.
- `npm run build`, `npm run validate:graph` and `git diff --check`: passed.
- Local Edge: Huntress start, Lightning Spear focus, Roll and Strike required
  goal, zero-extra-point optimization, apply and save/new/load passed. Route cost
  stayed at the 22-point exact shortest baseline. Switching to Ice Shot updated
  the existing tooltip to Bow scope without changing priorities or the goal.
- Applied-tree summary independently agreed with route contributions: 55% spear
  damage / 10 * priority 3 = 16.5, 16% spear attack speed / 3 * priority 2 =
  10.6667, plus 10% projectile damage / 10 * priority 2 = 2. Total 29.1667,
  displayed as 29.17. Conditional Focused Thrust bonuses were not included.
- Screenshots reviewed at 1440x1000, 1100x760 and 390x844. No horizontal document
  overflow. The existing CSS tooltips can extend below the viewport when their
  trigger sits near the bottom; scrolling the trigger toward the middle shows
  the full text. Tooltip edge-positioning was not changed in this matching work.
- No application console errors or warnings; only the existing initial
  `favicon.ico` 404 was reported.

These checks establish matching, scoring and workflow behavior, not actual DPS,
whole-build net benefit or a proof of globally optimal weighted routes.

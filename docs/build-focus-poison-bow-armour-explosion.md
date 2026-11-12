# Poison Bow Armour Explosion Review

Reviewed 2026-11-10. Local only; no commit, push or deployment. Frozen PoB
0.23.1/tree 0.5.5f plus moving upstream sources. One choice/family, two
context-only pairs, not a trigger simulator, Full DPS model or global allowlist.

## Supported-Skill Event and Separate Child

Armour Explosion (`SupportArmourExplosionPlayer`, catalog tier 1, family
ArmourExplosion) accepts Attack OR CrossbowAmmoSkill OR Warcry, not Damage
alone. Both actual Bow parents and Exploit-modified types pass; missing all
accepted types and a Damage/Spell-only control fail. The app admits only the
two reviewed focuses, not every natively compatible skill.

The supported skill must Fully Break an enemy's Armour. Partial break, a
previously fully broken target, or another skill/minion's event is not evidence
this source fulfilled the trigger. The support does not itself grant a break
source. Corrosion's Poison-derived break is separate; event credit and timing
are not simulated, and no stream of full breaks is assumed.

The gem actually grants `ArmourExplosionPlayer`, a player-owned Attack/Area/
Triggered Fire child, not a Spell, minion or another copy of parent Poison.
It uses its own 30%-standard-scaling attack multiplier and 100% Physical-to-Fire
conversion, with base radius 14 (1.4 m). These are not 30% more parent damage,
Poison scaling or damage based on enemy Armour. The child itself cannot Break
Armour, so it cannot sustain a self-triggering break loop. Gas's own conditional
Fire detonation remains a different component; ignition/detonation is not supplied.

The raw child chance is 100% on its qualifying event, not 100% uptime or a
frequency. No extra hits, automatic Gas-cloud chain, boss trigger rate or Fire/
Poison score bonus is credited. No added support Mana multiplier. The zero-cost
child does not waive the parent's firing cost or other support multipliers.

Sources: [support and child](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L360),
[granted-effect mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua),
[stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua),
[trigger handling](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcTriggers.lua).
Moving references are not claimed byte-identical to the frozen runtime.

## Exploit Weakness and Native Limits

Exploit Weakness permits the link but prevents the parent from Breaking Armour.
That parent cannot supply its own explosion event, even if the target is
configured Fully Broken by a different source. A new reversible warning appears
on Armour Explosion when Exploit is selected. Existing Armour Break/Demolisher
prohibitions and Corrosion's incompatibility warning remain unchanged.

Corrosion is dropped from actual triple links in either native link order.
Only Exploit's 1.30 Mana factor remains, not a speculative 1.30 x 1.10 combo.
The linked Exploit conditional damage field may affect the child in a fixed full
state; that demonstrates arithmetic, not that a prohibited parent triggers it.

The support linkage stat and child's trigger-on-break chance have no mapping
in reviewed PoB. A selectable child exists and exposes damage/DPS with no break
source, or in intact/partial/full configurations alike. It displays the Bow's
1.2 attack rate rather than a validated full-break event frequency. These are
potential-hit/ordinary-rate outputs, not proof of actual triggers or sustained
damage. No event model or runtime patch is invented to fill that gap.

## Native and Independent Checks

72 MAIN calculations: 52 parents and 20 granted-child rows. Five parent
components each have baseline/support, Armour Break III baseline/with support
and Corrosion baseline/with support (30). Per parent: no-hit Poison source
Exploit baseline/support in three states (6), two invalid triple orders (2),
arrow Poison III baseline/support (2), and support+Demolisher II (1). These
add 22 parent rows. Child rows per parent cover intact/partial/full (3),
Magnified Area II (1), Fire/Physical/Poison-magnitude scalars (3), Poison III
(1), and Exploit intact/full (2). Two compatibility groups and six parsed
scalar controls accompany the calculation matrix.

Empty level-90 Witch, level-20/quality-zero skills, normal Physical Crude Bow,
sufficient attributes, boss None, two-metre distance and explicitly disabled
Endurance Charge use. The real child is selected from the support gem's
additional granted effect, not fabricated as an independent skill. Requested
component/set, applied links, generated active IDs, player ownership and
configuration flags are asserted. Installed PoB, user saves and frozen source
are untouched. Known frozen startup missing-node notices are retained.

All rows passed an independent verifier: unchanged parent source hit/Poison/
timers, actual link filtering, cost multipliers, component separation and Poison
arithmetic. Arrow Poison III stays 4.56577245/1.53831410; no-hit source Poison
stays 5.38576622/4.00385418. Parent Mana stays 38/62, with Corrosion 41/68,
Exploit 49/80, or Poison III 45/74.

| Native child snapshot, same for either parent | Value |
| --- | ---: |
| Rounded Fire range / average Hit | 2-3 / 2.625 |
| 100% increased Fire Damage range / Hit | 4-6 / 5.25 |
| 100% increased Physical Damage or Poison magnitude, Hit | 2.625 |
| Explicit full-state Exploit range / Hit | 3-4 / 3.675 |
| Physical / Chaos hit damage | 0 / 0 |
| Base / Magnified II radius | 14 / 16 |
| Mana cost | 0 |
| Displayed attack rate / TotalDPS | 1.2 / 3.15 |

Independent checks reconstruct average ranges with 5% crit at 2x multiplier
and radius `floor(14 * sqrt(1.45))`. The frozen conversion/scalar observations
are not a universal gear-scaling claim. In this pure-Fire fixture, adding 60%
Poison chance still yields no calculated Poison DPS: no eligible Physical/Chaos
source is supplied. Extra gear/ailment-enabling effects are not assumed. The
displayed 3.15 is ordinary rate times potential hit, not earned explosion DPS.

Evidence: ignored `var/poison-bow-armour-explosion-20261110/` driver, JSON,
independent verifier and logs. These are source/native checks, not live-game
event/uptime validation or a real-build import.

## Coverage and App Validation

113/567 support choices (19.9%), 112/450 positive-tier (24.9%), 68 families and
616 reviewed pairs. Poisonburst/Gas offer 88/90 choices. Skills remain 103/399
(98/234 positive), preferences 184, wording 864/2182 and occurrences 3444/5451.
No catalog refresh or baseline reset. These are scoped heuristic counts, not
overall completion. Priorities, routes, point budgets, parser scopes, prior
support notes and persistence implementation remain unchanged.

Focused checks passed 421 tests in nine files, including eighteen new pure
tests and two UI cases. One `npm run validate:release` passed 3,539 tests in
167 files, typecheck, production build, graph validation and unchanged coverage
baseline in 98.986 seconds. Existing large-chunk advisory remains nonblocking
(main 801.03 kB, 195.93 kB gzip); no unrelated performance refactor.

The production entry at `http://127.0.0.1:5180/PoE2-Tree-Optimizer/` matches
built JavaScript bytes. Edge smoke passed both 88/90-choice lists, selection/
removal/restoration, separate child/Poison/event-ownership notes, reversible
Exploit warning, preserved earlier conflicts and unchanged manual weights.
No unexpected automatic support-priority action or page errors. Screenshot
inspection confirmed readable notes and a nonblank tree without overlap.
Final console: zero errors/warnings after reload; the initial existing preview
`/favicon.ico` 404 was inspected separately.

Browser artifacts: `output/playwright/poison-bow-armour-explosion-20261110/`.
Scoped `git diff --check` passed. These are source/native/local-app checks,
not live-game trigger testing or user visual acceptance. Preview remains
available. No commit, push or deployment.

## Next Proposed Batch

Review [Rupture](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6419)
and [Rusted Spikes](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L6447)
for both Poison bows, separating conditional Bleeding aggravation from Poison,
checking Heavy Stun/Pin application and ownership, and retaining Pin's Stun
prohibition. No assumed ailment uptime. Proposal only, not implemented here.

Completed subsequently in the [Bleeding aggravation checkpoint](build-focus-poison-bow-bleed-aggravation.md).

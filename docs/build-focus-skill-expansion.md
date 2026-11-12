# Crossbow and Bear/Wolf Skill Expansion

This adds 28 reviewed damage-component presets to Build Focus, bringing the
picker to 84. Shortest routing, scoring units, point budgets, default priorities,
saved-build format and existing support allowlists are unchanged.

## Added Skills

- Crossbow firing: Armour Piercing Rounds, Fragmentation Rounds, Permafrost
  Bolts, High Velocity Rounds, Incendiary Shot, Ice Shards, Rapid Shot, Glacial
  Bolt, Stormblast Bolts, Hailstorm Rounds, Shockburst Rounds, Plasma Blast,
  Siege Cascade, Crossbow Shot and Requiem.
- Grenades: Flash Grenade, Gas Grenade, Voltaic Grenade, Oil Grenade and Cluster
  Grenade. Existing Explosive Grenade remains unchanged.
- Bear/Wolf damage: Furious Slam, Fury of the Mountain, Rampage, Molten Crash,
  Lunar Assault, Pounce, Cross Slash and Walking Calamity. Existing Maul/Shred
  remain unchanged.

Crossbow Shot, Requiem and Molten Crash are item-granted tier-zero records,
not three new uncut gems. Walking Calamity scores its player-owned meteors only
when active, not its non-damaging activation or an assumed Glory/form uptime.

## Component Boundaries

| Case | Scored component | Not assumed |
| --- | --- | --- |
| Ammunition skills | Granted firing hits, never the non-damaging load action | Reload/clip uptime, Heat, merging, shotgun counts |
| Fragmentation / Shockburst | Ordinary projectiles | Frozen shrapnel / Lightning-ailment pulses and their area damage |
| Incendiary / Permafrost / basic Crossbow Shot | Reviewed projectile hits | Area damage from tags, cone visuals or a lone area flag |
| Glacial / Ice Shards / Plasma | Projectile plus reviewed wall/shard/terrain explosion hits | Destruction, arming, ageing, terrain contact or overlap frequency |
| Gas / Oil Grenade | Initial physical impact | Poison cloud, external ignition/detonation, Oil Ground or ailment scaling |
| Pounce | Player landing hit | Mark activation, socketed Marks, Wolf Minion damage or command frequency |
| Cross Slash | Player claw gouges | Marked-enemy shockwave, pulled Ice Fragments or guaranteed double contacts |
| Molten Crash | Physical landing slams | The separate fire-converted fissure component or Rage-dependent counts |
| Walking Calamity | Fire-converted meteor hits and optional effect duration | Melee/projectile bonuses, attack-speed-driven triggers or Glory generation |

Armour Piercing Rounds explicitly suggests Armour Break amount; High Velocity
Rounds does not, because its source cannot Break Armour. Flash Grenade suggests
Stun Buildup, Blind effect and duration from its native application sources,
not additional Blind chance on top of its native guaranteed chance.

Cooldown recovery is separate from attack animation, fuse time, buff duration
and reload speed. Generic/matching weapon/Grenade effects are counted once in
their existing categories, including reductions. The Utility Ordnance damage
penalty remains visible to the scorer when Attack Damage is selected. Manual
preferences are never deleted; unselected and unmodeled effects still have no
score. This is not Full DPS or whole-build performance simulation.

## Sources and Validation Scope

The native metadata inventory is retained in
`var/remaining-attack-skills-20261108/inventory.json`, exported from the marked
isolated PoB 0.23.1 data copy. Frozen identity/tag/component fixtures are tracked
in `src/tree/remainingAttackSkills.fixtures.ts`; tests need no native runtime or
network. Upstream is a moving reference, not a claimed byte-identical snapshot:

- [Native skill data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua)
- [Item-granted skill data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/other.lua)

Coverage is 84/399 raw catalog skill IDs (21.1%), or 79/234 positive-tier IDs
(33.8%). Recognized passive wording remains 863/2,182 and occurrences remain
3,436/5,451 (63.0%): this batch broadens skill contexts, not parser vocabulary.
These denominators are not a verified live obtainable-gem list or an overall
completion percentage. No research optimizer audit/benchmark was run.

The subsequent [Ballista batch](build-focus-ballistas.md) adds Artillery and Siege
Ballista with reviewed totem/player ownership. The [Mortar Cannon batch](build-focus-mortar-cannon.md)
adds explicit socketed-Grenade and ownership context. Emergency
Reload, Shard Scavenger, Arctic Howl and Lunar Blessing need utility/buff/trigger
reviews. A raw basic Grenade-launcher catalog entry remains untriaged rather than
being advertised as an obtainable skill from metadata alone. New support
compatibility is not inferred from shared tags.

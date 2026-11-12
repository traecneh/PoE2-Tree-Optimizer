# Build Focus Skill Batch

The weighted objective is now labelled **Build Focus**, and **Focus skill** is
labelled **Skill**. Internal mode (`weighted`), focus IDs, storage version,
shortest routing and existing saved priorities are unchanged. Suggestions still
require explicit application; a skill selection does not replace manual effects.

## Reviewed Components

| Skill | Reviewed focus | Deliberate limits |
| --- | --- | --- |
| Galvanic Shards | Granted firing skill: attack/projectile bolts and lightning beams | The ammunition load deals no damage. No area-damage scope; reload, merging and shotgun/chain counts are not simulated. |
| Explosive Shot | Granted attack/projectile shot and explosion; explosion-only area damage | Loading is not a hit. No damage credited from detonating other Grenades, Ignite, reload speed or magazine uptime. |
| Explosive Grenade | Attack/projectile/area explosion; native fire portion; cooldown recovery for stored uses | Cooldown, flight speed, fuse time and Skill Effect Duration are distinct. Heat, overlap, repeats and Ignite are not assumed. |
| Rake | Spear melee/area dash hit | Rake is not a shapeshift. Guaranteed Bleeding, distance ramps and the fixed 400 ms addition are not converted into hit DPS. |
| Maul | Talisman-granted Bear melee/area hit | No equipped Claw-weapon inference, Rage uptime, shapeshift-conditional passives or transformation-time simulation. |
| Shred | Talisman-granted Werewolf melee/area strikes | No unconditional Cold/Projectile suggestion from Ice Fragments' tags. Frozen-enemy payoff, combo timing and form uptime remain outside scope. |

Crossbow-specific damage, attack speed, accuracy and critical modifiers require
one of the three reviewed crossbow focuses. Grenade Damage adds to Attack Damage
once; Grenade area adds to Area of Effect once; Grenade cooldown recovery adds to
Cooldown Recovery Rate once. Reductions retain their negative sign, including
Utility Ordnance's 80% reduced Grenade Damage. As before, an unselected effect has
no score; selected positive effects do not imply that all unmodeled tradeoffs are
evaluated. Critical/accuracy preferences remain opt-in, not automatically added.

No new support compatibility is inferred. The six presets have no reviewed
support refinements yet; the empty support group is hidden, with limitations in
the Skill tooltip. The existing 38 support choices remain unchanged.

## Sources and Coverage

Metadata and component flags were read from the marked isolated PoB 0.23.1 copy
used by the existing catalog, using its Lua data structures. The local export is
retained under `var/build-focus-skills-20261108/native.json`. This was a metadata
check, not another optimizer audit or a whole-build performance evaluation.
Moving upstream references were checked separately and may have different line
numbers; no byte-identity or current game-version guarantee is inferred.

- [Crossbow ammunition, firing and Grenade definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua)
- [Rake's spear definition](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L6362)
- [Maul and Shred's item-granted definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/other.lua)

Coverage now reports 56/399 raw skill catalog IDs (14.0%), or 54/234 positive-tier
IDs (23.1%). Maul and Shred are tier-zero item-granted entries, not two extra
uncut gems. Recognized main-tree stat occurrences rose from 3,412 to 3,436 of
5,451 (63.0%); distinct wordings rose from 853 to 863 of 2,182. These are scoped
catalog/parser counts, not an overall completion percentage or Full DPS coverage.

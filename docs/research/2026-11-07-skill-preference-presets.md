# Reviewed Base-Skill Preference Presets

Reviewed on 2026-11-07 against the local native PoB reference at
`var/pob-evaluation-spike-20261106/runtime/`. The reviewed catalog supplies
editable suggestions to the existing weighted passive optimizer; it does not
change the shortest-route solver or perform full-build damage calculations.

## Provenance and Limits

`Data/Gems.lua` identifies itself as automatically generated gem data, copyright
Grinding Gear Games. Preset `gemId` values are its exact table keys; `tags` copy
all literal true tag keys, including metadata keys. They are not substring-based
compatibility rules. Fireball's table key uses `Metadata/Items/Gems/` even though
its separate native `gameId` field uses `Metadata/Items/Gem/`.

Weights (1-3), reasons, exclusions and scopes are manually reviewed heuristics,
not game-supplied weights, exhaustive compatibility, DPS estimates or build
recommendations. Exclusions describe direct benefits to the stated base-skill
scope; they are not build bans and never remove existing preferences. No
defensive or general utility choices are excluded.

This note records the original base-skill scope. Reviewed support refinements
were subsequently added; see [Support Preference Refinements](2026-11-07-support-preference-refinements.md).
Unreviewed supports, trigger mechanics, arbitrary conversions, infusions, resource sustain,
Full DPS and build-specific interactions are not modeled. Cast-speed suggestions
assume self-casting, not faster trigger frequency. Preference scores are not
interchangeable with PoB damage calculations.

The links below are corresponding upstream `dev` source paths with anchors from
the local snapshot. They are moving references, not a claim that today's remote
bytes equal the local files. Local SHA-256 fingerprints are recorded below.

## Native Evidence and Review Decisions

| Preset | Gem record in Gems.lua | Native skill evidence and decision |
| --- | --- | --- |
| Enfeeble | [912-934](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua#L912-L934) | [EnfeeblePlayer](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L6374-L6510) has `base_deal_no_damage`, a 0.7-second cast, `curse_delay_duration_ms = 1500`, duration and radius stats. Suggest outgoing curse magnitude/duration/area/activation plus self-cast convenience, not spell damage or crit. |
| Spark | [670-693](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua#L670-L693) | [SparkPlayer](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L19893) has base spell/projectile/duration flags, native lightning damage, 2000 ms duration and projectile-speed quality. Suggest spell/lightning/elemental/projectile damage, self-cast speed, general projectile speed and duration. Lifetime, travel and the 660 ms target-clearing interval do not establish guaranteed repeat hits. Cold Infusion's alternate stat set is out of scope. |
| Fireball | [6379-6403](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua#L6379-L6403) | [FireballPlayer](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L7374) has native fire damage. The projectile is a spell projectile; the Explosion stat set adds area while retaining spell/projectile flags and a radius of 17. Suggest hit scaling and explosion coverage. Area is not hit damage, projectile damage is not an ignite recommendation, and Fire Infusion firebolts are out of scope. |
| Lightning Arrow | [1185-1210](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua#L1185-L1210) | [LightningArrowPlayer](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua#L4152) requires a bow. Both Arrow and Beam stat sets have attack/projectile flags; native stats include physical-to-lightning conversion. Suggest attack/lightning/elemental/projectile damage, attack speed and arrow travel speed, not spell/cast scaling. No inference that pre-conversion physical scaling works, that all weapon damage is elemental, or that projectile speed converts to damage. |
| Essence Drain | [2268-2291](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua#L2268-L2291) | [EssenceDrainPlayer](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L6511) separates Projectile and Damage over Time stat sets. The DoT has native chaos damage, a 4000 ms duration and the explicit `spell_damage_modifiers_apply_to_skill_dot` stat at local line 6679. Suggest chaos damage, spell damage and duration. Projectile damage and crit can affect the delivery hit, not the targeted debuff. Duration is uptime, not DoT DPS. `damageOverTime` is relevant in principle but omitted because it has zero current matching unconditional passives. |
| Skeletal Arsonist | [2515-2537](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Gems.lua#L2515-L2537) | The exact gem display name is singular **Skeletal Arsonist**; [SummonSkeletalArsonistsPlayer](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua#L18047) displays **Skeletal Arsonist Minion**, with a plural ID/description. [RaisedSkeletonArsonist](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Minions.lua#L285-L324) lists Fire Bomb and Explosive Demise. [FireBombSkeletonMinion](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/minion.lua#L743-L813) has Attack skill type and `attack = true`, area/projectile mechanics and 70% physical-to-fire conversion. Suggest explicit minion damage, minion attack speed and minion life for survival, not player fire damage or player speed. |

Arsonist review does not infer cast behavior from its summoning info's
`spell = true` flag or the monster's `caster` tag. The command
[Explosive Demise](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/minion.lua#L814)
has an Attack skill type but a spell base flag in this snapshot. Its damage,
cooldown and sacrifice timing are intentionally not modeled. The minion cast
speed exclusion is explicitly scoped to the verified Fire Bomb attack, not a
claim about that command. Combined `minionSpeed` is not suggested because it
would also reward cast-speed-only lines and double-count combined speed lines.
Minion life is a survival preference, not a claim that an Arsonist's own life
scales every bomb or a sacrificed ally's explosion.

## Current Tree Coverage

Read-only audit used `passivePreferenceValues` from the preference scorer on each
unaltered stat string of each node in `data/tree-graph.json`. These are distinct
node counts with at least one positive recognized unconditional line, not
claims about reachability, net node benefit, path cost or build compatibility.
The graph identifies game version `0.5.5f`, extracted at
`2026-11-07T03:20:21.651Z`.

| Suggested preference | Positive nodes | Example recognized line |
| --- | ---: | --- |
| curseMagnitude | 13 | 10% increased Curse Magnitudes |
| curseDuration | 8 | 40% increased Curse Duration |
| curseArea | 6 | 10% increased Area of Effect of Curses |
| curseActivation | 4 | 10% faster Curse Activation |
| castSpeed | 31 | 3% increased Cast Speed |
| spellDamage | 43 | 8% increased Spell Damage |
| lightningDamage | 51 | 15% increased Lightning Damage |
| elementalDamage | 54 | 8% increased Elemental Damage |
| projectileDamage | 39 | 8% increased Projectile Damage |
| projectileSpeed | 16 | 5% increased Projectile Speed |
| skillDuration | 39 | 4% increased Skill Effect Duration |
| fireDamage | 47 | 12% increased Fire Damage |
| areaOfEffect | 25 | 12% increased Area of Effect |
| attackDamage | 79 | 8% increased Attack Damage |
| attackSpeed | 60 | 3% increased Attack Speed |
| chaosDamage | 41 | 7% increased Chaos Damage |
| minionDamage | 53 | Minions deal 10% increased Damage |
| minionAttackSpeed | 8 | Minions have 5% increased Attack and Cast Speed |
| minionLife | 31 | Minions have 6% increased maximum Life |
| damageOverTime (not suggested) | 0 | No matching plain increased Damage over Time line |

Every suggestion has current positive matches. At this base-skill checkpoint,
spell-only projectile-speed variants were ignored; general projectile speed
had independent matches. The later [spell-projectile scope rule](2026-11-07-spell-projectile-speed-matching.md)
adds those variants for reviewed focuses. Incoming `reduced effect of Curses on you` lines are
not outgoing curse magnitude. No catalog suggestion is derived just from a tag.

## Reproduction and Validation

Run directly to avoid data-generation hooks and unrelated output writes:

```powershell
.\node_modules\.bin\vitest.cmd run src/tree/skillPreferencePresets.test.ts src/tree/passivePreferences.test.ts
.\node_modules\.bin\tsc.cmd -p tsconfig.node.json --noEmit --incremental false --pretty false
```

The catalog suite has 15 pure tests: stable identities/native tags, unique and
nonconflicting preferences, bounded weights, descriptions of at most 40 words,
reviewed mappings, safe unknown lookup, immutable additive merging, unchanged
priorities/defence/budgets/mode/goals, no source tracking, idempotence and no
removal of excluded preferences. The catalog imports only types from
`passivePreferences.ts`; support refinement helpers likewise use type-only
imports for settings and preset types, avoiding a runtime initialization cycle.
The focused pair passed 23 tests, and the no-emit TypeScript check passed.

After integration, `npm test` passed 397 tests across 51 files, including UI,
saved-build and weighted-route cases. `npm run build` passed. Graph validation
reported no issues for 4,762 nodes and 5,426 edges. An Edge browser smoke test
covered adding suggestions, preserving a manual Energy Shield preference,
optimizing and applying a required-goal route, and saving/loading its focus and
priorities. The sample used an 18-point exact shortest baseline and produced a
23-point preferred route within a five-extra-point allowance. Desktop,
windowed and mobile layout checks found no horizontal overflow in the new
controls. These checks do not validate live-game damage or Full DPS.

## Local Snapshot Fingerprints

Paths below are relative to the native runtime except the tree graph:

| File | SHA-256 |
| --- | --- |
| Data/Gems.lua | `1CCEA00A77C66DDED39EE6C5D477D705C0E2602348D752982D075AC56136FFE1` |
| Data/Skills/act_int.lua | `5B42B006BE62D02F428FA03DBCD94BC9385041E502DC0BFC0640FF1A2AA430AC` |
| Data/Skills/act_dex.lua | `D36694D3168F733BE34B711F42953B0186685A14D60402BA42CF1D08C13971F9` |
| Data/Skills/minion.lua | `A2038AD3F141A5CF0F92697DBA1BB0A31FC6F0436AEB6FC6A9CAD7484CA0FBF0` |
| Data/Minions.lua | `49FF5E770683318E89F928087A4D39538705D826D2F541013C852CCE55669FAD` |
| data/tree-graph.json (worktree root) | `75D9579D3C23CC5C091D102E391425241DF0B01FBAC580B7637F65F9F01B5425` |

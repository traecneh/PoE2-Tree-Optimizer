# Banners and Defensive/Recovery Buffs

2026-11-10. Twelve focuses added together, plus 39 reviewed skill/support pairs.
Local only; no commit, push or deployment. Shortest and optimizer search
algorithms are unchanged. Existing priorities, allocation and point budgets are
preserved; suggestions and support choices remain explicit opt-in actions.

## Selected Components

| Focus | Selected behavior | Important boundaries |
| --- | --- | --- |
| War Banner | Planted Aura utility | Attack-generated Glory; recipient Attack Damage, Attack Speed and Accuracy are not modifiers to Aura strength |
| Defiance Banner | Planted Aura utility | Recipient Armour, Evasion and Movement Speed do not strengthen the Aura; no assumed planting uptime |
| Dread Banner | Planted Aura utility | Ailment Threshold, maximum Elemental Resistances and Flask charges; ordinary resistance, caps and recovery remain distinct |
| Arctic Armour | Source-declared Cold spell retaliation | Enemy Melee hits consume stages; no Armour/mitigation benefit inferred from name; native stage damage is unmodeled |
| Barkskin | ES-loss-driven temporary Armour | Current version, not old Bark/Evasion behavior; capped by Item Armour on equipped armour items; native gained amount is unmodeled |
| Ghost Dance | Evasion-based Shroud/ES utility | Cooldown-scaled Shroud generation; recovery output is incomplete, not Recharge or unconditional regeneration |
| Grim Feast | Collect Minion Life, use Grim Resurrection | Current version, not old ES overflow; reviving-Minions, Presence, storage cap, pickup and recipient Life costs matter |
| Iron Ward | Physical mitigation/storage utility and nova coverage | Stored-damage base is unmodeled; no speculative Physical/Spell/Attack damage suggestions, full storage or nova DPS |
| Magma Barrier | Shield block buff and granted Spray coverage | Requires charged lava and raised-Shield Block; triggered hit has no action time; no equipment-derived damage or charge uptime inferred |
| Scavenged Plating | Temporary Armour stack utility | Fully Broken Armour events required; rarity affects gains; no automatic ten stacks or Thorns DPS |
| Time of Need | Cooldown-scaled periodic recovery/cleanse | Flat Life per blessing, not regeneration or percentage-Life healing; no permanent immunity or guaranteed sustain |
| Wind Dancer | Stage-based Evasion and Gale Force coverage | Hits consume stages; fixed stage timer is not generic duration/cooldown recovery; no weapon-DPS or maximum-stage assumption |

The Banners use the granted planting action rather than the reservation toggle.
Grim Feast also describes the separately granted resurrection action. Iron Ward,
Magma Barrier and Wind Dancer support summaries distinguish their granted damage
components from the utility focus. No new component or state selector is added.

## Passive Matching

Two new literal preferences: **Aura Magnitude** and **Glory Generation**. Both
support increased/reduced wording, signed values and ordinary manual weighting.
Banner-only Aura Magnitude, Area of Effect and Glory modifiers require explicit
reviewed Banner scopes. Generic and Banner-only modifiers join the corresponding
category once; magnitude does not fan out into recipient offence/defence scores.

Complete-line matching rejects ally-owned, Body-Armour-granted, conditional,
per-charge, composite-unknown and more/less wording. Native PoB parses the Aura
modifiers and changes the planted Aura multiplier. It has no Glory-generation
parser/calculation; Glory preference values are literal game modifiers and a
heuristic utility preference, not calculated resource supply or buff uptime.

No new modifier is treated as a DPS multiplier. Arctic Armour's Cold/Spell
suggestions follow explicit source data, not a fabricated native damage result.
Its spell-critical scopes remain opt-in; Controlled Destruction removes those
scopes and warns without deleting existing manual critical priorities.

## Common Supports

Reviewed pair counts in the table's order: 5 / 5 / 5 / 1 / 2 / 0 / 3 / 7 / 3 /
2 / 0 / 6, totaling 39. These reuse existing support choices/families.

- Magnified Area I/II: planted Aura or granted nova/retaliation coverage only;
  not radius, buff magnitude, incoming defence or guaranteed contacts.
- Prolonged Duration I/II: planted Banner, Barkskin Armour and Scavenged stack
  timers, not the persistent parent, Glory generation or repeat intervals.
- Mobility: Banner planting, Grim Resurrection or Iron Ward release movement
  penalty only, not global Movement Speed or attack/cast speed.
- Rapid Casting I/II: Grim Resurrection application; native repeated-use rate
  remains cooldown-limited. Does not speed Minion casts or the persistent parent.
- Controlled Destruction: Arctic's source-declared spell retaliation cannot
  critically hit. Native stage damage remains unmodeled; no claimed net DPS gain.
- Concentrated Area: granted Iron Ward/Magma Spray/Gale Force area trade-off,
  not the defensive buff. No Banner recommendation: its Aura deals no damage.
- Brutality I/II/III: Iron Ward/Gale Force secondary Physical-damage context,
  with prohibitions and Tier III's conditional PDR bypass kept separate from
  defence. Excluded for Cold-only Arctic and Fire-only Spray.

Efficiency is excluded: active granted actions have zero Mana cost and do not
remove the persistent parent's 30-Spirit reservation. Considered Casting is not
offered for a non-damaging resurrection despite type-only acceptance. Triggered
Gale Force/Magma Spray are not given Rapid Attacks based on a displayed weapon
speed. No incompatible or pointless support is added to fill an arbitrary quota.

## Evidence and Coverage

Frozen source: isolated PoB 0.23.1 / tree 0.5.5f. Twelve source exports and 85
bounded native observations are retained in ignored
`var/defensive-batch-20261110/`; portable source/compatibility observations are
independently frozen in `src/tree/defensiveBuffSkills.fixtures.ts`. Neither the
installed PoB nor user saves were modified. Moving upstream navigation sources:
[Strength](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua),
[Intelligence](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
[Dexterity](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua).

Native controls use level-20 zero-quality skills, a normal Wooden Club, Splintered
Tower Shield and Rusted Cuirass, explicit attributes/Spirit, +1000 Evasion/ES,
zero enemy Armour and explicitly labeled baseline/planted/one-stack states.
Granted components are selected by verified effect ID, not assumed list order.
These controls are not full builds or a route-quality audit.

- Banner Duration: 9.801 -> 13.233 seconds with Prolonged Duration II; Spirit
  reservation stays 30. Generic/Banner-only +20% magnitude yields AuraEffectMod
  1.2; -20% yields 0.8. Coverage changes separately.
- Ghost Dance: 10.131 -> 8.448 second repeat interval with +20% cooldown recovery.
  Time of Need: 8.118 -> 6.765. Generic duration leaves each interval unchanged.
  Native recovery amounts are incomplete; zero output is not proof of no effect.
- Barkskin duration: 6.006 -> 8.118 seconds. Scavenged duration: 8.019 -> 10.824.
- One Scavenged stack changes captured Armour 63 -> 66; one Wind Dancer stage
  changes Evasion 1007 -> 1108. Neither proves sustained maximum stacks.
- Arctic native critical chance 11 -> 0 with Controlled Destruction, but captured
  stage damage remains zero/unmodeled. Iron Ward stored base and Magma Spray
  shield-scaled damage are likewise not claimed as validated DPS.

Skills: 187 -> 199 / 399 (49.9%); positive-tier subtotal 182 -> 194 / 234 (82.9%).
This is configured scoped coverage, not complete live-gem mechanics. Preferences
184 -> 186; support choices remain 117 / 567 (71 families); reviewed pairs
1,533 -> 1,572. Passive coverage: 864 -> 877 / 2,182 distinct wordings and
3,444 -> 3,484 / 5,451 main-tree occurrences (63.9%). The 13 new recognized
wordings are the reviewed Aura/Glory and Banner-area lines. The old regression
baseline was preserved and compared with no losses before accepting the updated
coverage; the refreshed baseline also protects previously reviewed scoped lines
that had not yet been added to it. Graph/catalog source fingerprints are unchanged.

## Verification

266 focused catalog/controls tests, 126 legacy-contract tests and 50 final
parser/controls guard tests passed. Final `npm run validate:release` passed
4,069 tests across 182 files, typecheck, production build, graph validation and
the reviewed coverage baseline. The initial full run found three stale
allowlists; these now explicitly cover the new cooldown/Presence suggestions
and the two focuses with no applicable reviewed supports. No blanket exceptions
or tests were removed. Existing large-bundle warnings remain non-fatal.

Edge smoke passed all twelve selectors, support counts, manual-priority
preservation and a real weighted worker preview/cancel/apply flow. Screenshots
at 1440x1000 and 1100x800 show a nonblank tree and no horizontal overflow.
Console/page errors were empty. After the final strict-number guard, a fresh
browser reload verified all 199 focuses and a visible tree. The preview at
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/` serves final bundle
`index-5OJiQz9G.js` byte-for-byte. Evidence is in ignored
`var/defensive-batch-20261110/` and
`output/playwright/defensive-batch-20261110/`. No route-quality research audits,
installed-PoB changes, commits or deployment were performed.

## Next Proposed Batch

Twelve persistent offence/minion focuses together: Herald of Ash, Herald of
Blood, Herald of Ice, Herald of Plague, Herald of Thunder, Plague Bearer,
Raging Spirits, Ravenous Swarm, Mirage Archer, Archmage, Overwhelming Presence
and Withering Presence. Separate triggered damage, player/minion/proxy ownership,
debuff application, resource requirements and recipient buffs. This is a proposal,
not authorization to begin another batch.

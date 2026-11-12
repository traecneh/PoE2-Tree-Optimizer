# Minion and Offering Presets

Reviewed 2026-11-07 against the isolated PoB 0.23.1 snapshot and official source
references. Adds eight opt-in focuses and 26 companion pairs using existing
support choices. No passive matcher, routing algorithm, shared controls, saved
schema, graph or assets changed. Shortest routing and existing priorities remain
unchanged; suggestions require explicit application.

## Focus and Ownership

| Focus | Suggested effects | Reviewed component and limits |
| --- | --- | --- |
| Skeletal Sniper | Minion Damage 3, Minion Attack Speed 2, Minion Life 1 | Basic bow attack; not Gas Arrow/cloud, poison, detonation or command performance |
| Skeletal Frost Mage | Minion Damage 3, Minion Cast Speed 2, Minion Life 1 | Ice Shard hit; not Ice Armour, commands, Freeze or overlap |
| Skeletal Storm Mage | Minion Damage 3, Minion Cast Speed 2, Minion Life 1 | Arc hit; not Death Storm, Shock pulses, chains or command uptime |
| Skeletal Brute | Minion Damage 3, Minion Attack Speed 2, Minion Life 1 | Basic melee attack; not Bonebreaker, Shattering Roar, priming or Freeze consumption |
| Skeletal Cleric | Minion Life 3, Minion Cast Speed 1 | Survival and Heal Buff application speed; not damage, outgoing healing magnitude or revival rate |
| Skeletal Reaver | Minion Damage 3, Minion Attack Speed 2, Minion Life 1 | Basic melee attack; not Enrage, Rage, Life loss, commands or revival timing |
| Bone Offering | Skill Duration 3, Minion Life 2, Cast Speed 1 | Offering lifetime and player use action; minion Life is ally survival, not spike Life or shield strength |
| Pain Offering | Skill Duration 3, Area of Effect 1, Minion Life 1, Cast Speed 1 | Offering lifetime/coverage and player use action; no inferred buff-strength scaling |

Numbers are editable heuristic priorities, not relative power or DPS multipliers.
Minion skills do not inherit player Spell/Attack Damage, elemental/physical/Chaos
damage, speed or Life preferences merely because the gem has a matching tag.
No new player spell/projectile/area passive scopes are enabled for these focuses.
Manual preferences remain editable and retained with outside-focus warnings.
Combined minion attack/cast-speed wording is scored once per selected preference.

Cleric is deliberately non-damaging. Cast speed changes the native Heal Buff
application action, not guaranteed healing per second. Its revival skill appears
in the minion definition but is absent from this runtime's active-skill table;
revival is therefore explicitly unmodeled rather than presented as tested.
Player Life regeneration is not outgoing Cleric healing.

Pain Offering explicitly buffs minions, not the player. Its source has a reviewed
base radius; Bone Offering's parent Area flag alone does not establish buff
coverage, so Bone does not suggest Area of Effect. Generic player cast speed
shortens both use actions despite neither parent having a Spell skill type.
Minion damage/speed do not become Offering buff-magnitude multipliers. Neither
Offering exposes a native spike actor for these checks: spike Life, sacrifice
supply, survival, shield absorption/explosion and covered-minion count remain
unmodeled. Reservation, minion counts, gear inheritance and complete DPS also
remain outside this batch.

## Companion Review

| Existing choices | New pairs | Admission |
| --- | ---: | --- |
| Feeding Frenzy I/II | 10 | Five combat minions; existing explicit Life-priority tradeoff, not Cleric or Offerings |
| Rapid Casting I/II | 6 | Frost Mage, Storm Mage and Cleric spell actions; context only, not player speed |
| Prolonged Duration I/II | 4 | Both Offering lifetimes; spike survival still required |
| Efficiency I/II | 4 | Both Offering use costs; context only |
| Mobility | 2 | Both Offering use actions; not faster casting |

The native matrix probes nine choices against eight parents: 72 pairs. Of 42
native-legal pairs, 26 are admitted and 16 withheld: six utility Feeding Frenzy,
eight persistent-minion duration pairs whose commands/buffs are outside focus,
and two Bone Offering Rapid Casting pairs without a reviewed minion actor.
Broad union skill types do not prove useful scaling of the selected component.
Rapid Casting III and other unreviewed choices are not added. Selection alone
does not alter manual priorities; existing explicit support-apply behavior stays.

## Evidence and Reproduction

Official references:
[active skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua),
[minion definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Minions.lua),
[minion skills](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/minion.lua).
Moving upstream references are not claimed byte-identical to the isolated source.

| Local source | SHA-256 |
| --- | --- |
| act_int.lua | `5b42b006be62d02f428fa03dbcd94bc9385041e502dc0bfc0640ff1a2aa430ac` |
| Minions.lua | `49ff5e770683318e89f928087a4d39538705d826d2f541013c852cce55669fad` |
| minion.lua | `a2038ad3f141a5cf0f92697dba1bb0a31fc6f0436aeb6fc6a9cad7484ca0fbf0` |

Exact identities, tags and component selection were checked for all eight skills.
Native Lua resolves Sniper's duplicated literal gem key to the later positive-
tier entry; this is one canonical preset, not two catalog additions.
Sixty-six synthetic native calculations passed 137 independent ownership and
arithmetic checks, plus eight identity/tag comparisons and all 26 admitted pairs:

- Combined player +30% damage/speed/Life modifiers leave the six minions' tested
  Life, speed and DPS unchanged while increasing player Life 1,187 -> 1,526.
- Minion +30% Life scales minion Life, not player Life. Minion +30% attack speed
  scales the three attack minions' action speed by 1.3, not the Mages/Cleric;
  +30% minion cast speed scales the three spell actors by 1.3, not attack actors.
- Cleric's Heal Buff remains zero DPS; cast speed changes action speed 1 -> 1.3,
  not the tested 4.026-second buff duration or guaranteed heal/revival throughput.
- +30% duration scales Offering lifetime with native tick rounding: Bone
  8.019 -> 10.428 seconds, Pain 6.006 -> 7.821. Generic +30% cast speed changes
  player use speed 1.6667 -> 2.1667, independently of minion spell speed.
- Pain's level-20 source supplies 29% minion speed and 58% minion damage. Native
  Sniper speed changes 0.6667 -> 0.86 (x1.29); player Spark hit, DPS, speed and
  Life remain unchanged with either Offering. Area modifier 1 -> 1.3 is checked
  against Pain's source radius, not a modeled count of buffed allies.
- Rapid Casting II increases the three minion spell actors' speed by 1.2, not
  player speed. Feeding Frenzy I increases tested minion damage, without making
  its damage-taken penalty a reduction to maximum Life. Prolonged Duration's
  1.30/1.35 lifetime factors, Efficiency I's 110 -> 77 Mana cost and Mobility's
  lack of a cast-speed multiplier are independently checked.

Ignored evidence lives under `var/minion-preset-batch-20261107/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/minion-preset-batch-20261107/review.lua --job var/minion-preset-batch-20261107
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/minion-preset-batch-20261107/calculate.lua --job var/minion-preset-batch-20261107
npx tsx var/minion-preset-batch-20261107/verify.ts
```

Existing native missing-node startup messages did not prevent these checks.
Installed PoB settings/builds were untouched. Fresh-checkout tests do not require
these ignored artifacts. This is not a real-character Full DPS or live-game audit.

## Validation and Coverage

Focused validation passed 1,027 tests in 19 files, typecheck and the prior baseline.
Tests cover all eight opt-in presets, exact tags and support allowlists, signed
owned modifiers, combined wording, player/minion exclusions, explicit apply,
saved/exported round-trips and eight route fixtures preserving goals and costs.
No assertions were removed or existing priorities changed. No shared UI/layout
implementation changed, so no repeated browser/viewport matrix under the lean
policy. Final `validate:release` passed 1,344 tests in 63 files, typecheck,
production build, graph validation and the refreshed coverage baseline. No final
check failed. The existing local server returned HTTP 200; no interactive or
cross-browser smoke is claimed. No commit, push or deployment was requested or
performed.

Skills: 33/399 -> 41/399 (10.3%); positive-tier 33/234 -> 41/234 (17.5%).
Support choices remain 31/567 across 19 families; curated pairs 266 -> 292.
Preferences remain 79, distinct wording 518/2,182 (23.7%) and recognized stat
occurrences 2,584/5,451 (47.4%). All old matches and graph/catalog fingerprints
are preserved; eight new contexts each recognize 466 wordings/2,419 occurrences
already present in the union. The reviewed baseline is refreshed to protect them.
Raw backlog remains 358 unconfigured skills, 536 unconfigured supports, 1,664
unrecognized wordings and 2,867 occurrences, not a reviewed eligibility count.

Next recommended batch: unconditional minion Critical Hit Chance, Critical
Damage Bonus, Area of Effect, Movement Speed and elemental/Chaos resistances,
including reductions and independent player/minion ownership checks. Maximum
resistances, command/revival effects and conditional modifiers stay separate.
Fireball's Concentrated Area review remains on hold.

# Scoped Attack and Spell Damage Preferences

Reviewed 2026-11-07 against the bundled PoE2 0.5.5f graph, PoB 0.23.1 catalog,
and the existing isolated native runtime. No graph, assets, routing algorithm,
point costs, save schema, gem catalog or support compatibility pairs changed.

## Native Evidence

Primary source references are PoB's [modifier parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and generated [Dexterity](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua),
[Intelligence](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_int.lua)
and [Strength](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua)
skill definitions. These upstream links move; the actual native checks used the
isolated local copy, not an assertion that upstream and local bytes are identical.

The probe is `var/scoped-damage-review-20261107/native-check.lua` (ignored), with
component export in `review.json` in the same directory:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/scoped-damage-review-20261107/native-check.lua --job var/scoped-damage-review-20261107
```

All six signed native forms parsed completely. Native ModDB queries verify:

| Wording | Native representation | Explicit negative control |
| --- | --- | --- |
| Attack Area Damage | Damage INC, Attack + Area flags | Ordinary attack and area spell receive zero |
| Elemental Damage with Attacks | ElementalDamage INC, Attack keyword | Spell keyword receives zero |
| Critical Spell Damage Bonus | CritMultiplier INC, Spell flag | Attack receives zero |

The elemental restriction is a keyword, not the Attack modifier flag. The initial
probe assumed a modifier flag and failed; correcting the probe to the actual
native keyword passed. No application behavior was based on that failed premise.

All nine attack definitions were checked component by component for attack/area
flags and native elemental conversion. The seventeen reviewed spell-hit focuses
have native spell components with positive critical chance; Dark Effigy's linked
Vile Effusion is checked instead of treating deployment as a damaging hit.
The runtime's existing fourteen missing-node startup messages persist; they are
not new probe failures. No installed PoB settings or personal builds were changed.
This is a modifier/component audit, not a whole-character DPS or hit-count test.

## Matching Policy

One new opt-in category, Attack Area Damage, uses 10% increased damage per Normal
score unit. It does not feed Attack Damage, Spell Damage or Area of Effect.
The other two families extend existing Elemental Damage and Critical Damage
Bonus preferences, also at 10% per Normal unit. High/Highest multiply by two/three.
Every matched line counts once in its own category, including reduced penalties.

All scopes are explicit preset metadata, not inferred from tags or passive names:

| Family | Reviewed focuses | Component limits |
| --- | --- | --- |
| Attack Area Damage | Ice Strike, Tempest Flurry, Boneshatter, Rolling Slam, Rain of Arrows, Explosive Spear | Both Ice Strike sets; Tempest Normal Strikes only; Boneshatter Initial Strike and conditional Shockwave; all reviewed Rolling Slam hits; Rain hits; Explosive Spear Explosion/Frenzy-Charged hits only |
| Elemental Damage with Attacks | Lightning Arrow, Ice Strike, Tempest Flurry, Ice Shot, Lightning Spear, Explosive Spear | Only elemental damage portions benefit; conversion proportions and gear are not simulated |
| Critical Spell Damage Bonus | Spark, Fireball, Arc, Ball Lightning, Frostbolt, Ice Nova, Comet, Firestorm, Eye of Winter, Frost Bomb, Flameblast, Frost Wall, Bonestorm, Bone Cage, Hexblast, Unearth, Dark Effigy | Reviewed damaging spell hits, not DoT, minions, offerings or deployment |

Lightning Arrow and Lightning Spear have targeting/coverage radii but no reviewed
area-damage component. Ice Shot's cone consists of projectile hits, not area
damage. Those three receive no Attack Area Damage scope. Physical-only Boneshatter,
Rolling Slam and Rain of Arrows receive no attack-elemental scope: added elemental
gear or conversion can change an actual build, but is not inferred by this tool.
Essence Drain's existing DoT-focused preset, Contagion, curses, minion/Offering
focuses and Detonate Dead's separately limited corpse-physical focus receive no
spell-critical-damage scope. This is conservative focus coverage, not a claim
that an excluded skill can never have an applicable component in the game.

Controlled Destruction disables the new spell-critical-damage scope on its
sixteen reviewed compatible focuses, alongside spell critical chance. Existing
generic manual crit preferences remain available for other skills, with a warning.
Dark Effigy is not an admitted Controlled Destruction pair. Attack-focused
Brutality compatibility is not added by this batch or inferred from arbitrary IDs.

Only complete unconditional increased/reduced lines match. More/less, flat bonus,
conditional/recent, per-charge, minion/Companion/enemy ownership, ailments,
composite unknown labels and malformed numeric wording are excluded. Existing
generic modifiers stay separate and are not silently filtered or copied per type.

No new automatic priorities or suggestion lists were added. Old settings keep
their preferences, weights, budgets and supports; focus selection does not add
the new category. Tooltips explain applicability without new visible detail panels.

## Inventory and Coverage

The main graph contributes exactly eight new wordings and 49 occurrences:

- Attack Area Damage: 23 occurrences, values 6/8/10/15/25%.
- Elemental Damage with Attacks: 14 occurrences, values 12/20%.
- Critical Spell Damage Bonus: 12 occurrences, value 15%.

Preferences 107 -> 108; distinct wording 578 -> 586 of 2,182 (26.9%);
occurrences 2,709 -> 2,758 of 5,451 (50.6%). Skills remain 41/399, supports
31/567, support families 19 and reviewed pairs 292. This is heuristic wording
coverage, not overall completion or damage accuracy.

Every previous match in all 42 contexts and both source fingerprints was checked
before baseline refresh. Manual/non-applicable contexts gain zero. Area-only
attack contexts gain five wordings, elemental-only contexts two, combined attack
contexts seven, and reviewed spell-hit contexts one. No unrelated additions.

## Verification

- Native signed parser, ModDB ownership and component allowlist assertions passed.
- Focused validation: 1,169 tests in 24 files, typecheck and no-loss baseline passed.
- Parameterized tests cover all 41 focuses, unknown IDs, signed/zero/decimal
  arithmetic, ownership, unselected effects, exact tree inventory and support
  blocking. Existing catalog-wide save/transfer tests include the new category.
- Route fixtures retain required reduced-value goals, unchanged shortest output,
  shared-node costs and base-node zero rewards. Scoped values do not leak to
  unrelated preference breakdowns or unsupported focuses.
- Local Edge smoke at 1280x720 and 1440x900: tree renders, new preference can be
  added, component tooltip wraps, focus changes update scope help and Controlled
  Destruction changes critical-damage help without removing manual preferences.
  Screenshots are in `output/playwright/scoped-damage-*.png`; blocked tooltip's
  DOM bounds fit the viewport. No application console errors observed; an existing
  missing `favicon.ico` request returned 404. Initial Chrome automation launch
  lacked Chrome; retry using installed Edge succeeded. No browser installed.
- Final `npm run validate:release`: 1,486 tests in 68 files passed, plus
  typechecking, production build, graph validation and refreshed coverage baseline.
  `git diff --check` passed (only existing Git line-ending warnings).
- No commit, push or deployment performed; existing local server remains available
  at `http://127.0.0.1:5174/`. The isolated browser session was closed.

## Next Proposed Batch

Unconditional Totem Damage, Life, Placement Speed, Duration and separate totem
Attack/Cast Speed. These six families have 56 current occurrences; review player,
minion and totem ownership plus deployment versus firing cadence before adding
scores. No recent-summon, per-totem or full-DPS assumptions. This batch is not
implemented here. Fireball Concentrated Area review remains explicitly on hold.

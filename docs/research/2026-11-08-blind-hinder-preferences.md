# Blind and Hinder Passive Preferences

Reviewed 2026-11-08 against the PoE2 0.5.5f graph/extracted English tables and
isolated PoB 0.23.1 runtime. Five optional Utility preferences add six exact
wording families. No automatic priorities, new support compatibility, solver,
allocation-cost, save-schema, graph/assets or shortest-route changes.

## Matching and Scope

| Complete wording family | Preference | Normal score unit | Occurrences |
| --- | --- | --- | ---: |
| N% chance to Blind Enemies on Hit | Blind Chance on Hit | 5 percentage points | 5 |
| N% chance to Blind Enemies on Hit with Attacks | Blind Chance on Hit | 5 percentage points | 5 |
| N% increased/reduced Blind Effect | Blind Effect | 10% | 6 |
| N% increased/reduced Blind duration | Blind Duration | 10% | 1 |
| N% chance to Hinder Enemies on Hit with Spells | Hinder Chance on Spell Hit | 5 percentage points | 2 |
| N% increased/reduced Hinder Duration | Hinder Duration | 10% | 2 |

Full-line matching only, normalized for case/whitespace. Flat chance accepts
signed numbers and decimals as chance points, not relative increased chance.
Effect/duration increases add and reductions subtract. Zero is retained.
High/Highest remain x2/x3. More/less, conditional/recent/per-charge, composite,
incoming, owned and unreviewed alias wording does not match.

Generic player Blind chance, effect and outgoing durations remain manual
source preferences across focuses, including for secondary player skills.
That does not assign the source to a focus that cannot use it. Tooltips require
eligible hits or an applicable Blind/Hinder source; effect/duration grants
neither application nor immunity bypass. Generic values are not minion/proxy
modifiers. No effect is auto-suggested or added by selecting a skill preset.

Attack-only Blind chance requires one of the nine reviewed player attack-hit
focuses: Lightning Arrow, Ice Shot, Rain of Arrows, Lightning Spear, Explosive
Spear, Ice Strike, Tempest Flurry, Boneshatter or Rolling Slam. Actual hit
components qualify, not non-damaging sequence wrappers. Distinct generic and
attack-only chance sources add once under Blind Chance, not multiply.

Spell-hit Hinder requires one of eighteen reviewed player hit focuses: Spark,
Fireball, Essence Drain, Arc, Ball Lightning, Frostbolt, Ice Nova, Comet,
Firestorm, Eye of Winter, Frost Bomb, Flameblast, Frost Wall, Bonestorm, Bone
Cage, Hexblast, Unearth or Detonate Dead. Explicit scope is independent of
critical chance; Controlled Destruction does not remove Hinder scope.

- Essence Drain: initial projectile hit only, not the DoT debuff.
- Detonate Dead: native spell-skill hit/keyword eligibility is not Spell Damage
  scaling for corpse-derived secondary damage. Existing damage exclusions stay.
- Unearth: player spike hits only, not constructs. Native minion-summoning flags
  do not establish hit ownership; the inspected hit belongs to the player actor.
- Dark Effigy placement, Contagion, non-hit curses, Offerings, minion focuses
  and manual/unknown contexts receive no spell-hit Hinder scope. No summon,
  Spell tag or node-name inference grants a player hit.

## Application and Overlap Limits

Chance, strength and duration are separate preferences. Blind Effect does not
also score as Slow Magnitude; Hinder Duration does not supply Slow Magnitude,
generic Skill Effect Duration or debuff expiry speed. Generic ailment chance
does not fan out into either control chance. Incoming immunity/protection and
minion/Companion/Totem/allied effects remain excluded.

The tool does not assume enemies are Blinded/Hindered, award conditional hit
damage or critical chance against them, compute final probabilities, duration,
stacking, caps, refresh/uptime, enemy immunities or actual DPS/defence. A source
preference score above 100 is not a guaranteed/capped application probability.

Independent mixed-node arithmetic at Normal priority:

- Attack focus: Blind chance 5+10 gives score 3; Blind Effect 20-5 gives 1.5;
  Blind duration 25-5 gives 2; Hinder duration 30-10 gives 2; separate Slow
  Magnitude 4 gives 0.4. Total 8.9, without rewarding conditional damage lines.
- Spell focus: generic Blind chance 5 gives 1 (attack-only 10 is ignored), plus
  Hinder chance 15 gives 3. The same effect/duration/slow sources yield 9.9.

Shared branch nodes cost one point and receive one contribution per selected
preference, not one per goal. Existing base nodes earn no new reward. Required
signed penalties stay required. Unselected categories earn no reward.

Real mixed nodes retain separate sources: Blinding Strike damage 24 plus
attack Blind chance 10; Sand in the Eyes speed 10 plus attack Blind chance 15;
Slow Effect and Hinder Duration duration 20 plus Slow Magnitude 4. Wasting
Casts gains spell Hinder chance 15 but not conditional damage 25. Disorientation
gains Blind duration 25, not its conditional damage. Chakra of Sight's chance
12 does not become incoming Blind immunity; Blinding Flash's effect 20 does
not make its stun-triggered application unconditional.

## Source and Native Evidence

All 21 occurrences independently trace to `PassiveSkills.json` and `Stats.json`
in `var/refresh-0.5.5f/tables/English/`:

| Raw stat ID | Occurrences | Values |
| --- | ---: | --- |
| global_chance_to_blind_on_hit_% | 5 | 5, 12 |
| attacks_chance_to_blind_on_hit_% | 5 | 5, 8, 10, 15 |
| blind_effect_+% | 6 | 10, 20, 50 |
| blind_duration_+% | 1 | 25 |
| spells_chance_to_hinder_on_hit_% | 2 | 10, 15 |
| hinder_duration_+% | 2 | 20 |

Reviewed official PoB [parser](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ModParser.lua)
and [calculation setup](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcSetup.lua).
Moving upstream references are not proof of byte identity with the isolated
tested copy. Personal PoB builds/settings were not modified.

| Tested local native file | SHA-256 |
| --- | --- |
| Modules/ModParser.lua | 01e2668025f70d0212378f815d10b189484d11c7db6e84e77c08c0e1dd068247 |
| Modules/CalcSetup.lua | a45920408c7d502abc6230727f00efd06a2de85918a32e76a28bb9757b07bc23 |
| Modules/CalcPerform.lua | b5955d4eaed31c01ea85e551a5eef46b6f006d7ebe3e8722993b69a425666b31 |
| Data/Skills/act_int.lua | 5b42b006be62d02f428fa03dbcd94bc9385041e502dc0bfc0640ff1a2aa430ac |

Sixteen native parser probes record eight complete forms and eight partial or
unsupported forms, not sixteen fully supported mechanics:

- Generic/attack-only Blind chance and their signed variants are BASE
  BlindChance; attack-only uses the Attack keyword, not generic player chance.
- Increased Blind Effect becomes an enemy-owned INC BlindEffect modifier.
  Reduced Blind Effect leaves residual text and must not be accepted as a
  correctly parsed LocalEffect reduction.
- Blind/Hinder duration leaves residual subject text on generic Duration;
  spell Hinder chance, including signed variants, has no complete modifier.
  The website uses exact game stat IDs/wording and independent signed arithmetic
  for these forms. It does not reuse the unrelated partial native modifiers.
- Minions' Blind chance is a MinionModifier, not player BlindChance.

Twenty-nine native actor fixtures record application boundaries: baseline and
modified Lightning Arrow gain 15 flat chance points, while Spark gains only 5;
both gain 20 enemy Blind Effect. Neither chance/effect source automatically
sets enemy Blind/Hinder or player Blind, and player incoming Blind duration
stays 100%. Explicit enemy-Blinded configuration enables that state separately.
A 150-point Blind source remains 150 in the native raw sum, not a capped final
probability. Minion chance does not enter the player sum. Eighteen player
spell-hit fixtures pass native hit/spell/Spell-keyword checks; Totem placement,
DoT-only Contagion, Enfeeble and Bone Offering supply no player hit. This is
source/scope evidence, not validation of unsupported Hinder uptime or in-game
mechanics. Existing fourteen missing-node runtime startup messages are unrelated.

Ignored reproducible evidence is under `var/blind-hinder-20261108/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/blind-hinder-20261108/native-check.lua --job var/blind-hinder-20261108
node var/blind-hinder-20261108/verify.mjs
```

## Coverage and Verification

Preferences 171 -> 176. Thirteen new wordings and 21 occurrences: wordings
826 -> 839/2,182 (38.5%); occurrences 3,352 -> 3,373/5,451 (61.9%). All 42
contexts preserve previous matches and both graph/catalog fingerprints. Seven
generic wordings are added in every context; four attack-only wordings only
in nine attack focuses; two spell-hit wordings only in eighteen spell focuses.
Skills remain 41/399, supports 31/567 and reviewed pairs 292. These percentages
describe heuristic/catalog coverage, not complete mechanics or project completion.

Quick validation passed 1,630 tests in 45 files, typecheck and no-loss coverage
before one further Unearth tooltip case was added. Tests cover full source
inventory, all focuses/allowlists, signs/units, ownership/conditions, optional
selection, independent sums, application limits, shared/base costs, existing
catalog-driven persistence, tooltips and unchanged shortest routing. Initial
quick failures were a new test bracket typo and two exact scope-list assertions;
they were corrected without weakening the existing damage exclusions.
One final release validation passed 1,948 tests in 89 files, typecheck,
production build, graph validation and the deliberately reviewed baseline.
Local port 5174 returns HTTP 200. The existing main-chunk size warning remains
at 534.06 kB minified / 141.36 kB gzip; the build succeeds. No shared layout,
control contract or persistence implementation changed, so no repeated browser
matrix was run for metadata/tooltips in the existing control structure.
`git diff --check` passed with existing LF/CRLF conversion notices.

Next proposed batch: Knockback Distance, attack-hit Maim chance and attack-hit
Incision chance with application/ownership/overlap review. Not implemented
without approval. Fireball Concentrated Area remains on hold. No commit, push
or deployment is authorized by this batch.

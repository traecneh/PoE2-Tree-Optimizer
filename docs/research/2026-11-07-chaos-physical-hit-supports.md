# Chaos/Physical Hit Support Review

Reviewed 2026-11-07 against isolated PoB 0.23.1 and current official upstream
sources. Adds 24 curated combinations across Considered Casting, Spell Echo,
Projectile Acceleration and Brutality for the nine new chaos/physical/curse
focuses. Three Brutality choices are new; the other choices already existed.
No routing algorithm, passive matcher, graph/assets or saved schema changed.

## Admitted and Withheld Components

| Family | New pairs | Policy |
| --- | ---: | --- |
| Considered Casting | 5 | Bonestorm, Bone Cage, Hexblast, Unearth player hit and Detonate Dead; explicit High cast-speed apply only |
| Spell Echo | 5 | Bone Cage, Despair, Vulnerability, Hexblast and Detonate Dead; explicit High cast-speed apply only |
| Projectile Acceleration I/II | 2 | Bonestorm delivery only; no passive damage or guaranteed Pierce/hit-count bonus |
| Brutality I/II/III | 12 | Bonestorm, Bone Cage, Unearth player hit and Detonate Dead physical focus; non-physical suggestion filtering and warnings |

Considered Casting's native type checker accepts Contagion, Despair and
Vulnerability, but its description specifies self-cast spells that hit. Those
three non-hit focuses stay withheld rather than treating a broad native type
test as proof of beneficial/live compatibility. Dark Effigy's deployment is not
the hit spell and Vile Effusion is a proxy; neither is admitted for this support.

Spell Echo requires native Cascadable and excludes triggered/proxy/persistent
skills. Bone Cage's ring-replacement limit, Detonate Dead's corpse supply,
Hexblast's curse consumption and curses' delayed application are not transformed
into guaranteed extra hits or curse magnitude. Echo-only area is conditional and
does not become an unconditional Area preference reward. Repeat timing/overlap
and resulting whole-build performance remain unmodeled.

Bonestorm I/II acceleration is verified for projectile travel speed, not channel
speed, stored spike count, explosion overlap, additional targets or subsequent
attack benefits. Tier III remains withheld for Bonestorm because the tested
spell-only projectile-speed wording did not become damage in the native engine.
All three Dark Effigy acceleration choices remain withheld pending beneficial
delivery/scoped-damage review of the auto-targeting proxy. Legal linking alone
does not establish either benefit. Existing older-focus selections and weights
are preserved, with III's explanation narrowed to verified generic modifiers.

Brutality is not offered for Contagion, Hexblast or Dark Effigy's Chaos-only base
damage, even where native compatibility allows it. It would suppress that damage.
It is not offered for non-damaging curses. Physical added/conversion/ailment and
other linked-gem interactions are not fully modeled by offering this support.

## Brutality Behavior

I grants 25% more Physical Damage; II/III grant 30%. All three prevent Elemental
and Chaos damage. III's 20% chance to ignore enemy Physical Damage Reduction is
not unconditional penetration and is not scored as a flat damage bonus.

Support selection removes Fire/Cold/Lightning/Elemental/Chaos Damage and
elemental penetration from the refined suggestions. In particular, Detonate
Dead no longer automatically suggests Fire Damage under Brutality. It does not
delete or disable existing manual weights: these may serve another skill and
still affect routing. The existing outside-focus warning says this explicitly;
users must remove a manual preference when it serves no other purpose.

No new automatic physical weighting or 1.25/1.30 score multiplier is introduced.
Brutality's three choices are classified conservatively as context/partial in
the coverage tracker, despite the suggestion filter. It is not a full prohibition
engine or performance model. All three share a single-tier family; tier changes
and removal preserve manual weights, goals and budgets. Considered Casting and
Echo alter only cast-speed priority, and only through the existing explicit
Apply support priorities command. Add suggestions preserves existing weights.

## Source and Native Evidence

Official references:
[Considered Casting](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L2137),
[Spell Echo](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua#L8017),
[Projectile Acceleration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua#L4254),
[Brutality](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua#L1216),
and [native projectile-speed conversion](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcOffence.lua).
Moving upstream references are not claimed byte-identical to the snapshot.
Local SHA-256 remains:

| File | SHA-256 |
| --- | --- |
| sup_int.lua | `573766c7653ba612984b8e12bc70b77aa0e46f7aa217fe836fae539c7911c5af` |
| sup_str.lua | `370edb0f3c6475565c23057953de8af2d3ca851cf3a94a5818ae547ed179e13a` |
| sup_dex.lua | `0cb6d21a33eced70a49b537a9b6ad9841c43b70f7fdd8a88eae9435263eec4c6` |

The native checker evaluated 80 component pairs (eight choices against nine
parent skills and Vile Effusion separately), with 25 passing type/exclusion and
constant assertions. Of 40 native-legal pairs, 24 are admitted and 16 withheld:
three non-hit Considered Casting, four acceleration (Bonestorm III and all three
Effigy tiers) and nine Chaos-only Brutality pairs. A separate app/catalog check
verified all 24 admitted pairings and eight source identities.

Forty-four synthetic native cases produced 81 independent checks. Verification
requires the correct selected component/stat set and an actually applied support,
not merely a socketed gem. Representative results:

- Considered Casting's five focuses: cast speed equals baseline x0.85; damage
  increases. This is not a total DPS multiplier; enemy mitigation and staged or
  supply-limited skills prevent that inference.
- Echo's five focuses: speed equals baseline x0.70, per-hit damage and duration
  unchanged. Curses remain non-damaging. Native aggregate area output is not
  proof that conditional Echo-only area applies unconditionally in game.
- Brutality's three tiers raise the tested physical hit output without changing
  cast speed. Added Fire and Chaos damage both become zero; Detonate Dead's
  separate fire hit also becomes zero. Enemy Armour/crit calculations are not
  independently reconstructed by these suppression checks.
- Bonestorm I/II: native projectile-speed modifier 1 -> 1.40 without a hit-damage
  increase. With +20% generic speed, 1.20 x1.40 = 1.68; with -20%, .80 x1.40 =
  1.12. Scoped +15% spell projectile speed gives 1.15 x1.40 = 1.61. Neither
  channel speed nor damage is inferred from these delivery multipliers.
- III applies generic speed increases and reductions to damage in the tested
  projectile and explosion components, and its own 40% more speed is not an
  additive damage bonus. However, +15% Projectile Speed for Spell Skills changed
  delivery but not hit damage in the tested native engine. That is a recorded
  source/runtime discrepancy, not a claim about live-game behavior or a silently
  repaired PoB engine. III's new-focus admission is therefore deferred.

Reproduction/evidence lives under ignored `var/chaos-hit-support-batch-20261107/`:

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/chaos-hit-support-batch-20261107/review.lua --job var/chaos-hit-support-batch-20261107
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/chaos-hit-support-batch-20261107/calculate.lua --job var/chaos-hit-support-batch-20261107
npx tsx var/chaos-hit-support-batch-20261107/verify.ts
```

The isolated runtime's existing missing-node startup messages did not prevent
these checks. No installed PoB builds/settings were edited. Fresh-checkout app
tests do not depend on the ignored native artifacts. This is not a real-character
Full DPS audit or complete runtime-effect-coverage proof.

## Validation and Coverage

- Quick validation passed 954 tests in 18 files, typecheck and the unchanged
  coverage baseline. The new parameterized tests cover the exact allowlists,
  negative cases, manual weight/goals/budget preservation, explicit cast-speed
  apply, Brutality tier replacement, warning/suggestion transitions and removal.
- Controls, local saves and JSON transfer cover all four families. Seven route
  fixtures check required goals, costs, signed projectile speed, no support
  multipliers, explicit apply and retained manual weights. Shortest is unchanged.
- No shared control/layout, parser or persistence implementation changed. No
  repeated real-browser/viewport/save-load matrix was run under the lean policy.
- Final `validate:release` passed 1,271 tests in 62 files, typecheck, production
  build, graph validation and unchanged coverage baseline. No final check failed;
  no full-character or cross-browser performance claim is made.

Before/after: support choices 28/567 (4.9%) -> 31/567 (5.5%); positive-tier supports
28/450 (6.2%) -> 31/450 (6.9%); families 18 -> 19; curated pairs 242 -> 266.
Twenty choices are context/partial; eleven have existing priority/scope-filter
behavior. Skills stay 33/399 (8.3%; 33/234 positive-tier), preferences 79, wording
518/2,182 (23.7%) and recognized occurrences 2,584/5,451 (47.4%). No old base-focus
wording or data fingerprints changed, so no baseline refresh was needed.

Raw backlog: 366 unconfigured skills, 536 unconfigured supports, 1,664
unrecognized wordings and 2,867 occurrences. Eligibility and full-mechanics
coverage are separate from these catalog totals. The projectile conversion and
other documented ownership/state gaps stay open; Fireball's Concentrated Area
review remains explicitly on hold.

Next recommended skill batch: Skeletal Sniper, Frost Mage, Storm Mage, Brute,
Cleric and Reaver, plus Bone Offering and Pain Offering. All eight have positive-
tier catalog entries, but native component/ownership review must determine safe
scope, especially Cleric's utility and Offering effects on minions versus the
player. Tier-zero Warrior availability remains separate triage. No minion DPS
or player-spell inheritance is inferred from tags. The scoped projectile-speed
discrepancy remains a separate research item; no additional III pairs are approved.
No commit, push or deployment requested or performed.

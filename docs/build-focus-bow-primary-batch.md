# Bow Primary Breadth Batch

2026-11-10. Ten missing positive-tier focuses, with common reviewed supports in
one batch. Local only; no commit, push or deployment.

## Delivered Scope

Lightning Rod, Stormcaller Arrow, Freezing Salvo, Snipe, Tornado Shot,
Electrocuting Arrow, Detonating Arrow, Magnetic Salvo, Spiral Volley and
Shockchain Arrow. Shared descriptors handle explicit components, matching scopes,
suggestions and cautions rather than deriving power from gem tags.

Six existing support families are extended: Magnified Area I/II, Efficiency I/II,
Rapid Attacks I/II, Concentrated Area, Projectile Acceleration I/II and Brutality
I/II/III. Nine focuses receive twelve choices; Spiral Volley receives nine because
it cannot support the area family choices. This adds 117 reviewed pairs, not new
catalog gems. Family/tier replacement and existing manual priorities are preserved.

## Component Boundaries

| Skill | Selected component | Boundaries |
| --- | --- | --- |
| Lightning Rod | Fully Lightning burst | External beams trigger later bursts; no assumed rod supply, durability, limits or trigger rate |
| Stormcaller Arrow | Delayed fully Lightning Bolt | Separate from initial arrow; longer duration delays the Bolt; no assumed Shock uptime |
| Freezing Salvo | Area projectile hit, 80% Cold conversion | Seal generation, projectile-to-repeat mapping and supplied Ice Fragments are separate; cannot Chain |
| Snipe | Normal Physical arrow | Perfect Timing explosions and fully Cold Icy Blast require setup; all components cannot Freeze |
| Tornado Shot | Intrinsic Physical Tornado DoT | Not native displayed hit fields, copied projectiles, Attack/Bow hit damage, crit or accuracy |
| Electrocuting Arrow | Projectile hit, 80% Lightning conversion | Native Area Damage does not scale the selected hit; rod lifetime/external Lightning/Electrocution are separate |
| Detonating Arrow | One-stage arrow with gained Fire | Gain is not conversion; no maximum-stage release frequency, explosion overlap or assumed Ignite |
| Magnetic Salvo | Impact projectile, 80% Lightning conversion | Native Area Damage does not scale this impact; lingering bolts/arrows supply separate explosions |
| Spiral Volley | Physical projectile hit | Targeting radius is not area damage; one hit per target per use; Frenzy bonuses/Chains are conditional |
| Shockchain Arrow | Projectile hit, 80% Lightning conversion | Cannot Shock; consumes Shock, not Electrocution; no assumed shockwaves, Chains or final rod uptime |

Nine hit focuses receive reviewed Bow/attack accuracy and critical scopes, but no
automatic crit preference. Only Lightning Rod, Stormcaller Bolt and Freezing Salvo
get Attack Area Damage. Coverage scopes do not imply damage, overlap or contacts.
Physical modifiers target only unconverted Physical damage, not the converted
Elemental portion or Detonating Arrow's gained Fire.

Tornado Shot receives a narrow `areaDamageOverTime` scope for generic Area Damage,
without enabling attack-only or spell-only area damage. Native controls establish
Physical, Projectile, generic Area and DoT scaling. Attack Damage/Bow hit damage
do not transfer to the intrinsic DoT. Bow Attack Speed is deployment utility;
generic duration extends lifetime, not DoT rate or the Tornado limit. Its explicit
projectile-to-DoT rule is not generalized to other projectile-delivered DoTs.

## Support Trade-Offs

Concentrated Area suggests a coverage priority only for the three area hits and
Tornado DoT. On Snipe/Detonating Arrow's normal arrows and Electrocuting,
Magnetic/ Shockchain's selected components, native hit damage is unchanged; notes
keep narrower coverage or secondary effects separate. This is not a claim that
the current PoB data fully models every live-game explosion.

Brutality removes Elemental/Chaos suggestions. For the two fully Lightning
focuses it also suppresses damage suggestions and explains that the selected
component deals no damage; it does not switch to another component or reverse
conversion. Tornado's Physical DoT remains, without a hit-only mitigation bypass.
Manual conflicting weights are retained with cautions, not silently deleted.

Projectile Acceleration changes delivery, not post-landing timers or intrinsic
DoT rate. Tier II does not imply extra contacts for non-colliding/ground-targeted
projectiles; Electrocuting Arrow cannot Pierce. Rapid Attacks does not supply
Seals, charges, perfect timing, external debuffs or copied projectiles. Spiral's
fixed 400 ms remains separate. Snipe and Detonating Arrow have over-time channel
cost, not a per-shot firing cost. No support magnitude is multiplied into route
scores or presented as actual Full DPS.

## Evidence and Checks

Frozen isolated PoB 0.23.1 / tree 0.5.5f. The installed app, runtime source and
user saves are unchanged. Moving upstream references:
[Bow skill data](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_dex.lua),
[Dexterity supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua),
[Strength supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua),
[Intelligence supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua).

Ignored evidence lives in `var/bow-primary-batch-20261110/`. Native export records
ten identities/tags/weapon constraints, seventeen components and 120 compatibility
decisions (117 allowed, three area-family rejections). Eighty-one native MAIN
cases cover all seventeen base components, 58 representative support cases and
six Tornado modifier controls. The isolated level-90 Ranger uses an unallocated
tree, normal zero-quality Crude Bow (6-9 Physical, 5% critical chance), level-20
zero-quality skills, enough attributes and zero enemy Armour. Player ownership,
weapon, active component and support application are asserted. Base focuses do
not assume charges, external ailments, perfect timing or maximum stages;
conditional stat sets are inspected separately, not credited as normal uptime.

Independent frozen fixtures check identities, signed scopes, other-owner and
conditional rejection, conversion/gained Fire, stored-hit rounding, critical
averages, area/radius square roots, cost trade-offs and Spiral's fixed timing.
Native integer channel-cost rounding is allowed its documented sub-unit error;
it is not a sustain estimate. Tornado's level-20 base 12,522 per minute gives
208.7 DoT per second; modifier controls and Concentrated Area/Brutality confirm
its scaling independently of displayed hit fields.

One grouped test covers storage, tier replacement and representative
weighted/Shortest routes. One UI contract checks all new options and three
representative focuses. Existing global scope/catalog allowlists are extended
using independent fixtures, with no rejected ownership tests removed. Initial
focused failures were a stale no-Area-Damage-suggestion expectation and a UI test
assuming supports carry across focus changes. Both were corrected and passed
targeted reruns. Typechecking passed before release validation.

Validation completed:

- `npm run validate:release` passed 3,720 tests in 173 files, typechecking,
  production build, graph validation and the unchanged coverage baseline in
  92.693 seconds. The existing large-chunk advisory remains nonblocking
  (main 843.72 kB, 205.56 kB gzip); no unrelated bundling refactor.
- Representative Edge checks passed Tornado Shot, Snipe and Lightning Rod:
  intrinsic DoT versus attack hits, explicit coverage-priority apply, non-area
  arrow cautions, fully converted damage prohibition and preserved manual
  priorities. No page errors or console errors/warnings. A desktop screenshot
  confirmed readable notes and a nonblank tree without overlap. No layout
  implementation changed, so no repeated mobile/per-tier browser matrix.
- The stopped preview server was restarted with the explicit GitHub Pages base
  path. Served JavaScript matches dist byte-for-byte (`index-WjxVYNAU.js`) at
  `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`. Artifacts are under
  `output/playwright/bow-primary-batch-20261110/`. The preview remains running.
- Scoped whitespace checks passed. These checks are local verification, not
  user visual acceptance, live-game timing proof or deployed-site validation.
  No commit, push or deployment.

## Coverage

| Measure | Before | After |
| --- | ---: | ---: |
| All-catalog skill presets | 120/399 (30.1%) | 130/399 (32.6%) |
| Positive-tier skill presets | 115/234 (49.1%) | 125/234 (53.4%) |
| Configured support choices | 117/567 (20.6%) | Unchanged |
| Reviewed skill/support pairs | 802 | 919 |
| Recognized distinct main-tree wording | 864/2,182 (39.6%) | Unchanged |
| Recognized stat occurrences | 3,444/5,451 (63.2%) | Unchanged |

The Tornado scope reuses existing generic wording, not a new modifier family.
No baseline refresh, raw tree change, routing algorithm change, point-limit
change, W1/W2 optimization or saved-build format change. Catalog coverage is
not overall project completion or verified live obtainable-primary coverage.

## Next Broad Batch

Review 8-10 remaining spear primary focuses with shared supports, including
Spearfield, Storm Lance, Whirling Slash and Spear of Solaris. Keep weapon
handedness, generated/consumed charges, secondary projectiles and conditional
hits explicit. Proposal only; not started in this batch.

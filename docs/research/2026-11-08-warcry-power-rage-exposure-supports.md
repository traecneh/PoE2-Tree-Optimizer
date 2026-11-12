# Warcry Power, Rage and Exposure Support Review

Reviewed 2026-11-08 against isolated PoB 0.23.1 and the PoE2 0.5.5f graph.
Four new positive-tier support choices add fourteen curated parent pairs.
These are context-only refinements, not Full DPS or simulated resource loops.

## Pairing Decisions

| Support | Admitted scope | Source mechanic and boundary |
| --- | --- | --- |
| Raging Cry | All five Warcry parents | 4 Rage per 5 counted enemy Power on use; no assumed enemy count, guaranteed generation or attack-damage benefit |
| Exposing Cry | Seismic Cry only | Exposure on Hit for 5 seconds, 1.30 support Mana-cost multiplier; requires the parent's actual secondary hit |
| Enraged Warcry I/II | Infernal, Seismic, Fortifying and standalone Ferocious | Spend 20/15 Rage instead of an Endurance Charge to bypass cooldown; no bypass without resources assumed |

All twenty native parent type predicates accept these supports because each
requires Warcry. Six pairs are nevertheless withheld for this useful-scope
allowlist: Exposing with four non-hitting/no-hit parents, and both Enraged tiers
with Ancestral's Glory gate rather than a base cooldown. Not offered does not
mean natively illegal. All sixteen child predicates reject these Warcry-only
supports: Combust, Volcanic Steps, Volcanic Eruption and Shield Wave are separate
components, not substitutes for a parent hit. Twenty negative controls removing
the Warcry type also reject them.

Seismic has a real secondary Physical hit. Fortifying has a native hit flag but
zero parent damage and the source no-hit-damage stat; Shield Wave's triggered
attack does not justify exposing the parent. Infernal, Ancestral and standalone
Ferocious have no parent hit. Seismic's Physical hit alone is not elemental DPS;
Exposure might serve another skill but does not add automatic Exposure Effect,
penetration or damage priorities.

Ancestral still requires 100 Glory from Ignites. Ferocious remains the standalone
Bear/Talisman focus; socketed human-Warcry replacement is outside this review.
Fortifying's Armoured Shield requirement and the previously documented native
equipment-validation gap remain. Player, minion and separately triggered damage
are not combined. Warcry area is not guaranteed enemy Power.

## Native Results and Independent Checks

The driver captures four definitions, 36 parent/child compatibility predicates,
twenty negative controls and 57 player-owned actor fixtures. Skills are level
20/quality 0, supports level 1/quality 0, empty tree and sufficient attributes.
Positive equipment uses Changeling Talisman or Splintered Tower Shield where
appropriate. Applied support IDs, ownership, disabled state, form, Power, Rage,
costs, cooldowns, hit/damage and elemental Exposure fields are asserted.

- **Power:** explicitly set enemy boss mode to None; otherwise a zero/blank
  Power input falls back to the default boss's 20 Power. Actual outputs are
  asserted at 0, 5, 20 and 50, not inferred from requested config.
- **Raging:** source-only arithmetic at these multiples of five yields raw
  grants 0, 4, 16 and 40 before caps/overflow/current Rage. No rounding rule for
  nonmultiples is inferred. Native mapping exposes CanGainRage, but configured
  zero Rage stays zero at every tested Power. It does not perform the grant.
  The fixture maximum is 30; raw grant 40 is not a claim of 40 usable Rage.
- **Enraged:** source thresholds are I >=20 and II >=15. At configured Rage
  14/15/19/20/30, independent per-event eligibility/subtraction is recorded
  separately from runtime results. Native Rage remains configured, RageCost is
  zero and RageHasCost false at every threshold. Cooldown remains
  `ceil(8 / .033) * .033 = 8.019` for the four cooldown parents; Ancestral has
  none. A separate Ignore Warcry Cooldowns control gives zero cooldown without
  spending Rage. That override is not evidence that Enraged implements bypass.
  The spending stat has no calculation mapping in this snapshot. Tier I adds
  ConsumesRage type while II does not; that source inconsistency is recorded,
  not interpreted as free Tier-II bypass or a new game rule.
- **Combined:** Raging + Enraged II at Power 20/configured Rage 15 across all
  five parents leaves Rage 15, rather than simulating a generation/spend order.
  Availability, decay, transaction order, charge supply and sustainable bypass
  frequency remain unmodeled. Existing cooldown preferences still apply to
  non-bypassed uses; they are not automatically removed.
- **Exposure:** `5000 ms / 1000 = 5 seconds` is descriptor/source arithmetic.
  Native raw ExposureDuration is 5000; this is not called 5000 seconds.
  InflictExposure and CanApply Fire/Cold/Lightning flags become true on every
  parent, even those with no hit. With no explicit enemy Exposure config, the
  tested enemy resistances stay zero, and HasExposure flags remain absent.
  Capability is not proof of actual hit eligibility, application or uptime.
  Explicit configured-Exposure positive controls apply native generic magnitude
  20; +20% player Exposure Effect gives `20 * 1.20 = 24` resistance reduction.
  A minion-owned +20% control does not change the player's effect. The generic
  configured magnitude does not prove Exposing Cry's intrinsic magnitude, and
  an explicit config is not a simulated hit. Exposure duration scaling is not
  validated by the raw duration field.
- **Costs/use:** Exposing costs `floor(85 * 1.30) = 110` Mana, or
  `floor(44 * 1.30) = 57` for Ancestral's native legal-but-withheld link. Other
  new links do not change Mana cost. Parent average damage and 0.8-second native
  Warcry use time stay unchanged in these fixtures. The known Ferocious source
  1.1 versus native 0.8 discrepancy is not patched or treated as game accuracy.

## Site Behavior

Selecting/removing these choices never changes manual priorities, defence,
goals, budgets or passive scopes. No automatic support strength multiplies
route scores. One Enraged tier per family is retained/replaced using existing
normalization. Save/load and JSON transfer preserve all admitted selections.
Exposing replaces Seismic's base-duration caution with an on-hit Exposure
caution, without suggesting Duration or enabling unreviewed linked-support
combinations such as Prolonged Duration on Seismic.

## Provenance and Reproduction

Official source references: [support definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua),
[Warcry components](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/act_str.lua),
[stat mapping](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua),
[configuration](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/ConfigOptions.lua)
and [calculations](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Modules/CalcPerform.lua).
Moving upstream references are not claimed byte-identical to the tested copy.

| Local file | SHA-256 |
| --- | --- |
| Data/Skills/sup_str.lua | 370edb0f3c6475565c23057953de8af2d3ca851cf3a94a5818ae547ed179e13a |
| Data/Skills/act_str.lua | adab68bd650f7d7dceb3cc71dbbb412acc3013628fd059fd75bbd70123eb24ba |
| Data/Gems.lua | 1ccea00a77c66dded39ee6c5d477d705c0e2602348d752982d075ac56136ffe1 |
| Data/SkillStatMap.lua | 703857f0c20f7a6a079a5379562a888dca02a2921f4e0e5467f65c531398081c |
| Modules/ConfigOptions.lua | 276c6b9c26b3ec3df4ff82f67d3dfc457d240d3204b0d6d3058c4a9d1cc03002 |
| Modules/CalcPerform.lua | b5955d4eaed31c01ea85e551a5eef46b6f006d7ebe3e8722993b69a425666b31 |
| Modules/CalcOffence.lua | eb76d3d8be967c5bca79062c79cf4693d182b652bb2b2418c07fa7da16f91435 |

Ignored evidence is under `var/warcry-special-supports-20261108/`. No native
source or personal PoB build/config was modified. Fourteen pre-existing
missing-node startup messages are unrelated. Ordinary tests need no PoB/network.

```powershell
python tools/pob-evaluation/run_headless.py var/pob-evaluation-spike-20261106/runtime --driver var/warcry-special-supports-20261108/review.lua --job var/warcry-special-supports-20261108
node --import tsx var/warcry-special-supports-20261108/verify.mjs
```

## Coverage and Validation

Support choices 31 -> 35/567 (6.2%), positive-tier 35/450 (7.8%), families
19 -> 22 and curated pairs 342 -> 356. Twenty-four choices remain
context-only/partial, not fully modeled mechanics. Presets remain 50/399 and
preferences 183. All 51 contexts and both fingerprints remain unchanged:
853/2,182 distinct wordings (39.1%), 3,412/5,451 occurrences (62.6%). No
coverage baseline refresh. Quick validation passed 1,773 tests in 49 files,
typecheck and no-loss coverage. Native/independent audit passed all checks above.
Final release validation passed 2,090 tests in 93 files, typecheck, production
build, graph validation and unchanged coverage baseline. Local port 5174 returns
HTTP 200. The existing main-chunk warning remains non-fatal at 555.44 kB
minified / 146.05 kB gzip; worker 207.30 kB. `git diff --check` passes with
existing LF/CRLF notices. This is metadata in existing controls, tested through
DOM, persistence and routing cases; no repeated real-browser matrix or visual
acceptance is claimed. No final validation step failed.

Next proposed batch: Echoing Cry and Corrupting Cry I/II, reviewing repeat
cadence, component/DoT ownership, Corrupted Blood stacking and costs before
admitting any pairs. Their positive-tier catalog entries exist; no mechanics or
pairs are approved here. Ferocious replacement, Fireball Concentrated Area and
ten-Incision remain separate held reviews. No commit, push or deployment.

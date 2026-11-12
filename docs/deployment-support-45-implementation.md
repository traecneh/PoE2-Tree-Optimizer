# Deployment and Combo Support Batch

Local-only implementation of the approved second 45-variant roster.
No commit, push or deployment. Shortest, required goals, point caps, W1/W2
branches and optimizer search algorithms are unchanged.

## Scope

All 45 variants are configured across **533 explicit reviewed skill/support
pairs**. Source-type compatibility was checked against all 239 focuses;
production cohorts are narrower where component or ownership checks require it.
They are not an assertion that every legal link or interaction is supported.

`src/tree/deploymentSupportBatch.ts` contains the shared definitions and
interaction explanations. Selecting or removing a support never edits manual
weights. Six variants suggest the new optional **Crossbow Reload Speed**
preference; only the explicit Apply command changes those priorities. Applying
a shown change can replace an existing weight for that same preference, as before.
No support magnitude is used as a numerical damage-score multiplier.

- Crossbow clip capacity, chance to conserve bolts, reload rate and firing
  cadence remain separate. Fresh Clip needs actual reload history; Double
  Barrel III needs actual Heavy Stun events. No sustain or maximum stacks are assumed.
- Streamlined Rounds retains its damage/reload penalties and Mana multiplier;
  extra loaded bolts do not become extra simultaneous projectiles.
- Long/Short Fuse combine increased and less detonation time multiplicatively.
  Grenade early-detonation restrictions do not become a universal prohibition
  for non-Grenade skills. Cloud lifetime and Poison duration are separate.
- Payload's repeat is a chance, with reduced cooldown recovery, not guaranteed
  repeated contacts or a linear reduction in cooldown seconds.
- Controlled Hazard, Delayed Reaction and Rearm affect Spearfield, not Grenades.
  The first two share one family; selecting either replaces the other.
- Aftershocks, periodic Ancestral Boosts and Jagged Ground require their actual
  events. Jagged Ground I spends an Endurance Charge; II instead requires an
  Aftershock. Their timing is not ordinary generic cooldown/duration scoring.
- Upheaval retains its damage and Skill Speed penalties. Extra fissures are
  not guaranteed extra attached vines, impacts or Plant DoT contacts.
- Crescendo's Strike sequence is not accumulated Combo. III boosts the final
  Strike instead of repeating it. Combo spenders/builders do not assume stacks.
- Combo Finisher and Culmination are an incompatible combination. Native PoB
  accepts only the first applicable link in either order; the tool retains both
  selections with a warning, not a combined damage bonus.
- Concoct spends Life Flask charges for Bleeding magnitude. It neither grants
  Bleeding nor scales Poison or Life recovery; no full-charge supply is assumed.
- Persistent Ground affects Ground Surfaces, not generic skill/Poison duration.
  II/III prohibit surface triggering; III slows affected enemies' cooldown
  recovery, not the player's. Gas Arrow's primary cloud-Poison focus is excluded.
- Mortar Cannon's socketed propagation, incidental Minion/proxy type matches
  and already-Combo skills are not admitted without a separate component review.

## Independent Evidence

Frozen local PoB **0.23.1 / tree 0.5.5f**, active gems level 20 quality zero,
supports level one, level-90 Witch, basic weapons and explicit config controls.
No personal builds/settings were read or changed. Fixtures pin all 45 source
definitions, separate reviewed cohorts, parent compatibility and **71 native
observations**. Drivers/logs: `var/deployment-support-45-20261110`.

Representative independent checks:

- Galvanic Shards reload 0.8 seconds -> 0.5 with 60% increased reload speed:
  0.8 / 1.6, not a 60% linear time reduction. +40% increased reload gives
  0.5714286 seconds; 20% reduced gives 1 second.
- Ammo Conservation III gives 30% conservation and a 1-second reload.
  Combined with Nimble Reload, native rate is 1.25 x 0.8 x 1.6 = 1.6.
- Double Barrel I loads two bolts with 1.142857-second reload and Mana 48
  versus 44. Streamlined loads six; combining Double Barrel II loads seven,
  with both reload penalties and Mana 58 retained.
- Explosive Grenade fuse 3 seconds -> 4.5 with Long Fuse I, 0.6 with Short
  Fuse II, or 0.9 together. Payload changes cooldown 5 -> 16.666667 seconds:
  5 / (1 - 0.7), not 5 x 0.3.
- Delayed Reaction changes native Hazard duration about 10 -> 3 seconds,
  including tick rounding. Rearm alone does not lengthen it.
- Culmination I/II at an explicitly configured 10 Combo changes hit
  27.5 -> 35.75/38.5; zero Combo leaves 27.5. Configured counts are not uptime.
- Fist of War II/III Mana is 96 -> 144/192. Periodic native damage averages
  are not asserted as every-hit boosts. Concoct leaves the Poisonburst arrow
  hit unchanged; this is not proof of Bleeding sustain or Poison scaling.

Known native gaps remain visible rather than receiving invented multipliers:
Long Fuse's source damage field does not change this captured hit; generic
Briarpatch Duration does not expose its Ground Surface timer; Fresh Clip's
configured history does not change the captured hit. Source rules and native
acceptance are distinct from fully modeled effect behavior. No Full DPS claim.

Moving upstream references: [Dexterity supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua),
[Strength supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua),
[Intelligence supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua).
The frozen fixtures, not moving branch lines, are the regression evidence.

## Coverage

Supports: 162 -> **207/567 raw entries**; positive-tier 160 -> **205/450
(45.6%)**, leaving **245**. Families: 98 -> 120. Reviewed pairings:
2,203 -> 2,736. Skills remain 239 total and 234/234 positive-tier.

Preferences: 200 -> 201. Recognized main-tree wording: 925 -> **927/2,182**;
occurrences 3,593 -> **3,600/5,451 (66.0%)**. The new matcher covers six 15%
and one 40% increased Crossbow Reload Speed occurrences, with signed reductions,
finite-value checks and conditional/foreign-owner near-miss rejection.

Compared both the previous baseline and pre-batch report: zero lost contexts,
wording or reviewed support scopes; graph/catalog fingerprints unchanged.
The baseline was advanced only after those comparisons passed.

Next proposed roster: [45 proxy and debuff variants](support-batch-proxy-debuff-45-proposal.md).

## Validation

Full `validate:release` passed: **4,629 tests in 192 files**, TypeScript,
production build, graph validation and coverage-baseline check. Existing
tests that expected reload wording to be unsupported were updated to the new
literal match; unrelated scope rejection checks remain intact.

The browser check also exposed old focus copy that denied any Attack Speed
contribution to Crossbow reloads. That explanation was corrected without
changing weights or matching. Afterward, 317 focused tests and a fresh
TypeScript/production build passed. A final 144-test node rerun verifies the
main-tree-only fixture count. The existing large-chunk build warning remains
non-blocking; no bundle-splitting change was mixed into this batch.

Edge smoke checks select all 45 additions, explicit reload-priority Apply,
family replacement, Combo/fuse warnings, player/proxy ownership exclusions,
and real worker optimization preview/apply. Captures at 1440x1000 and
1100x800 show the visible tree and scrollable controls without incoherent
overlap or horizontal overflow. No page errors, console errors or failed
responses were recorded during the smoke workflow. The served HTML/bundle
were checked against the local production build, not an older preview.

Reports and captures are ignored local evidence under
`var/deployment-support-45-20261110` and
`output/playwright/deployment-support-45-20261110`.

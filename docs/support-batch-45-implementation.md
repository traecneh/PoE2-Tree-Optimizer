# Shared 45-Variant Support Batch

Local-only implementation; no commit, push or deployment. The approved roster
is in [the original batch proposal](support-batch-45-proposal.md).
Shortest routing, required goals, allocation costs, W1/W2 branches and the
weighted search algorithm are unchanged.

## Scope and Behavior

All 45 approved variants are configured across **550 explicit skill/support
pairings**, spanning 96 focuses. Parent-type legality is not sufficient for
admission: the selected component and ownership must also fit the reviewed
cohort. This is not a claim that every legal link has been reviewed.

Shared metadata, tier-family replacement, contextual explanations and optional
preference refinements are in `src/tree/commonSupportBatch.ts`. No new broad
damage model or support-magnitude multiplier was added to passive scoring.
Selection does not edit manual priorities; suggested changes require the
existing explicit command. Removing a support does not erase manual weights.

- Attunement adds an eligible Element to reviewed hits, with penalties to the
  other two Elements. It is not conversion, intrinsic DoT or a guaranteed
  damage upgrade. Brutality still prohibits gained Elemental damage.
- Mastery raises the eligible gem's level; costs, reservation and different
  components can change. All reviewed element/Minion Masteries share the
  existing Mastery family, not one stackable family per Element.
- Cold Exposure requires a Cold critical hit; Fire/Lightning Exposure require
  Ignite/Shock application respectively. Configured enemy conditions are not
  proof of this skill's application. Controlled Destruction and Elemental Focus
  warnings describe their respective blocked events.
- Penetration is hit-specific. Fire Penetration II ignores Fire Resistance,
  including the benefit of negative resistance; it is not an extra percentage
  of penetration. Ignite/DoT resistance remains separate.
- Elemental Focus prohibits Elemental Ailments. Exclusions now win regardless
  of selection order and cannot be restored through Apply support priorities.
  Manual weights are retained with cautions, as before, because they may serve
  another skill. Non-elemental ailments are not automatically prohibited.
- Ignite chance is a multiplier, not flat chance. Faster Ignite delivery,
  duration and total damage stay separate. Searing Flame's hit penalties are
  not silently removed from application/source behavior.
- Arcane Surge needs actual self-cast Mana spending. Configuring its buff
  does not establish threshold completion, ten-second uptime or permanent DPS.
- Clarity/Vitality recover player resources, not Minion resources. Their added
  Spirit reservation remains; per-minute Life regeneration is divided by 60
  once. Optional rate preferences do not guarantee positive net sustain.
- Cooldown recovery changes rate, not seconds linearly. Second Wind's stored
  uses are burst capacity, not sustained cadence or continuous Life recovery.
- Boundless Energy, Capacitor and Retention separate gain, capacity and chance
  to refund. Event supply, release behavior and average trigger rate are not
  simulated; they receive no automatic numerical damage multiplier.
- Meat Shield, Hulking Minions, Elemental Army and Splash affect eligible
  summoned Minions, never player damage, Totems or Feral visages. Resistance
  caps, reservation, single-target hits and splash contacts remain separate.
- Accuracy supports are excluded from Gas Arrow's cloud-Poison focus and the
  Vine Arrow/Toxic Growth plant-focused components. Poisonburst Arrow retains
  them because the initial arrow must connect. Tier II's Full Life exception
  is not permanent cannot-miss behavior.
- Rapid Attacks III gives increased Attack Speed with a substantial supported
  damage penalty, not a guaranteed DPS increase or faster Poison ticks.

## Independent Evidence

Trusted isolated PoB 0.23.1 / tree 0.5.5f. Level-20 quality-zero active gems,
level-one support variants, level-90 Witch, supplied attributes/Spirit and basic
weapons. No personal builds or saved settings were read or modified.

Frozen fixtures include the 45 source definitions, parent compatibility
against all 239 configured focuses, the separately pinned reviewed cohorts
and **69 native observations**. Ignored drivers/captures/logs are under
`var/support-batch-45-20261110`.

Representative arithmetic checks:

- Fireball 299.6 -> 374.5 with Fire Attunement; Cold/Lightning Attunement each
  give 224.7 after the Fire penalty. Combined Cold/Lightning gives 149.8.
  Brutality plus Attunement gives zero Elemental damage, not a combined gain.
- Fire Mastery gives hit 338.12 and Mana 115, not a fixed percentage bonus.
  Cold/Lightning controls change their own hit and cost independently.
- At +25 Fire Resistance, Fire Penetration I and II both give hit 299.6.
  At -25, ordinary penetration retains hit 374.5, but ignoring resistance gives
  299.6. Neither changes the captured Ignite resistance treatment.
- Ignite I/II/III multiply captured application chance by 2/2.5/3.
  Tier III duration is 4/1.15 seconds. Elemental Focus removes application even
  when Ignite III is linked; no maximum chance or uptime is supplied.
- Clarity I/II changes Berserk's Mana regeneration 101.6 -> 132.1/152.5 and
  Spirit reservation 30 -> 40/50. Vitality grants 1%/2% Life per second,
  captured as 32.9/65.7 Life per second with reservation 50/70.
- Frost Bomb's 6.006-second cooldown becomes 4.818/4.62 with cooldown recovery,
  including native tick rounding. Second Wind I gives 12.012, not faster
  sustainable firing. Its source extra-use field is not implemented by this
  frozen runtime: the captured counter stays one.
- Hulking Arsonist Life 1,232 -> 1,479 and Spirit 39 -> 51. Elemental Army
  reaches capped 75 Fire but 30 Cold/Lightning, not +30 uncapped mitigation.
  Minion Splash leaves the selected original Zombie hit unchanged.
- Heightened Accuracy gives 6,576 -> 9,864 Accuracy. Rapid Attacks III changes
  firing speed 1.08 -> 1.458 while reducing the captured hit to 9.45.

Native Energy/refund generation, the Second Wind extra-use counter and some
secondary splash/ailment outputs remain incomplete. Source rules and gaps are
shown as context, not presented as validated uptime or Full DPS.

Moving upstream references: [Intelligence supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua),
[Dexterity supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua),
[Strength supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua).
These references are distinct from the frozen local regression evidence.

## Coverage and Validation

Support choices: 117 -> **162/567 raw entries**. Positive-tier subtotal:
115 -> **160/450 (35.6%)**, leaving **290** unconfigured. Families: 71 -> 98.
Reviewed pairings: 1,653 -> 2,203. Skill focuses stay at 239 total,
234/234 positive-tier. Preference categories stay at 200.

Recognized main-tree wording stays at 925/2,182 distinct lines and
3,593/5,451 occurrences. No new literal matcher was needed. Prior baseline
and pre-batch contexts/fingerprints were compared without losses; the baseline
was not regenerated to hide differences.

Historical capture suites still verify their previously reviewed links;
the new independent suite verifies every added cohort, all out-of-cohort
focuses, family replacement, manual-state preservation, save/export,
ownership, conflicts, native arithmetic and same-budget route behavior.

Final `validate:release` passed: **4,439 tests in 190 files**, TypeScript,
production build, graph validation and coverage-baseline check. Focused
component tests also passed after the Accuracy-cohort refinement. No loss of
previously recognized wording or raw graph/catalog fingerprint change.

Edge smoke selected all 45 variants, verified explicit priority application,
shared-tier replacement, prohibition warnings, component/ownership guards,
and a real worker route preview/apply. It recorded zero page errors, console
errors or failed responses. Inspected 1440x1000 and 1100x800 screenshots show a
visible tree, scrollable support controls and no horizontal overflow or
incoherent overlap.

Served HTML and `index-B3gVJ4ls.js` matched the final production build.
The pre-existing large-chunk warning remains non-fatal. No unrelated
performance refactor or route-quality audit was added.

Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.
No commit, push or deployment.

## Next Recommendation

The [next proposed 45-variant batch](support-batch-next-45-proposal.md) groups
Crossbow/Grenade handling with melee deployment, Combo and ground-duration
supports. It is not implemented in this checkpoint.

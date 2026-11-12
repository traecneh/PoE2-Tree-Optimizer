# Proxy and Debuff Support Batch

Implemented the approved 45-variant Minion, Totem, Curse, Mark and corpse
utility roster locally. No commit, push or deployment. Shortest, required
goals, node costs, extra-point budgets, W1/W2 branches and optimization search
algorithms are unchanged.

## Scope and Behavior

The 45 definitions cover **302 explicit reviewed skill/support pairings**.
`src/tree/proxyDebuffSupportBatch.ts` holds shared cohorts, metadata, optional
priorities and conditional interaction explanations. Parent-type eligibility
was exported against all 239 focuses; narrower component/ownership review
determines which controls are actually offered. Not every legal link or
combination is reviewed by this batch.

Support selection/removal never changes manual weights. Eighteen variants
offer source-specific optional priorities through the existing explicit Apply
command. Applying a displayed change can replace that preference's existing
weight, as before; unrelated preferences and budgets survive. No support
magnitude, resource counter or event frequency becomes a numeric route-score
damage multiplier.

- Bidding I/II affect Command damage and Command recharge, not basic Minion
  attacks. III grants only 80% increased Command recharge, not the earlier
  tiers' damage. Only I has the source's 30% eligible Mana multiplier.
- Crazed Minions needs actual recent revival, not summoning. Muster needs
  different summoned reviving types, not individual Minion or Wolf count.
  Last Gasp's four-second fatal-wound window is neither maximum Life nor
  automatic revival. No sustained death/revival loop is assumed.
- Minion Instability is a separate Low-Life Fire explosion based on 15% of
  Minion maximum Life. Infernal Legion's Ignite source uses 10% of maximum
  Life as base Fire damage, not 10% maximum Life as Ignite DPS. Its 600%-per-
  minute self-Fire damage becomes 10% per second once, before mitigation.
  Tier II adds Fire resistance and radius; caps and self-damage remain.
- Brutality still prohibits the supported actor's outgoing Elemental/Chaos
  damage. Infernal Legion, Minion Instability and Profanity show that warning
  in either selection order. Their damage-source-only priorities are filtered;
  Infernal Legion's optional Fire-resistance protection and all manual weights
  remain. Outgoing prohibitions do not remove incoming self-damage or corpse costs.
- Deathmarch heals nearby allied Minions on the supported Minion's death,
  using that dying Minion's Life, not the recipients' Life or player recovery.
  Sacrificial Lamb's target priority and Tier II Detonatable eligibility are
  not an actual sacrifice, explosion, death reward or corpse supply.
- Minion Pact is a self-used damaging-skill support, not Minion damage.
  The nearby Minion must supply the full 100%/150% of player maximum Life
  drain. A larger player Life pool raises that requirement; proximity and
  repeated-use sustain are not supplied.
- Loyalty retains 30% less Companion Life and hit-only damage redirection.
  It is not a flat player mitigation bonus or protection from DoT. Capture-
  only Tame Beast has no reviewed Companion recipient and is excluded.
- Danse Macabre requires an additional Skeleton before granting its support
  benefits. Sacrificial Offering retains the 15% player Life sacrifice and
  the Offering's normal Skeleton requirement. Different buff recipients are
  not collapsed into player damage or generic Minion damage. A non-damaging
  Offering remains non-damaging.
- Hardy Totems affects Totem Life, not player/Minion Life. Reinforced Totems
  separates ordinary resistances from caps; +maximum resistance needs enough
  ordinary resistance. Native support-specific resistance display coverage
  is incomplete and is explicitly identified, not used as proof of mitigation.
- Urgent Totems separates placement from firing. III adds an optional attack
  speed preference only for the reviewed Ballista/Shockwave attacks and a
  cast-speed preference for Dark Effigy. Unspecified socketed Totem components
  receive placement priority only, not assumed faster DoT ticks or repeats.
- Splinter Totem retains its parent limit, per-split damage/speed/Life/area
  penalties and Mana cost. It does not multiply assumed attackers or hits.
- Font of Blood and Font of Mana share the **Font** family. They grant nearby
  allies leech from the supported Totem's Physical damage, not regeneration
  or leech from those allies' own attacks. Stale native regeneration stat maps
  do not override the current source fields. No recovery uptime is assumed.
- Abiding Hex consumes a Power Charge for conditional duration. Heightened
  Curse's effect is increased, not a final damage multiplier; its 40% Mana/
  reservation cost is retained, including Blasphemy. Hex Bloom needs death
  and transfers to one nearby enemy, not free kills or unlimited Curses.
- Cursed Ground occupancy is not a proved Curse-expiry event. Decaying Hex's
  Profane Decay and Impending Doom's Doom Blast are separate children, not
  primary Curse damage or automatic Intelligence/Chaos/DoT scoring. Longer
  charge-boosted curses can delay Doom Blast; no repeat-trigger rate is supplied.
- Profanity needs actual corpse consumption for conditional Chaos damage.
  It does not grant Chaos damage or assume maximum corpse count. Corpse
  Conservation does not create corpses, guarantee reuse or refund charges.
- Eternal/Charged Mark need actual activation, not merely application. Mark
  for Death needs incoming Physical damage and does not guarantee Fully Broken
  Armour. Mark of Siphoning uses the player's Physical Attack hits, not Poison
  or Minion damage; 800 permyriad is 8%, not 800% leech.
- Slow Potency is offered for reviewed Temporal Chains and intrinsic vine
  slows, not assumed Briarpatch quality-based Hinder. It grants neither slow
  application nor immunity bypass. Essence Harvest's on-death maximum-Mana
  recoup is separate from damage-taken Mana Recoup and retains higher reservation.
- Tag-only matches such as Grim Feast and temporary Raging Spirits are not
  admitted to reviving/persistent-Minions cohorts. Player, Minion, Companion,
  Totem, Offering and triggered-child ownership remain separate.

## Independent Evidence

Frozen isolated **PoB 0.23.1 / tree 0.5.5f**, level-20 quality-zero active
skills, level-one supports, level-90 Witch, supplied attributes/Spirit and
basic weapons. No personal builds or settings were read or changed.

Fixtures pin all 45 definitions and native parent compatibility, independent
reviewed cohorts, source wording for sensitive units/recipients and **72 native
observations**. Captures distinguish accepted links from actually implemented
effects. Conditional counters and spawned attackers are not fabricated.

Representative checks:

- Hardy Totems I/II: 2,490 -> 3,486/3,735 Life. With 20% increased Totem Life,
  II gives 2,490 x 1.2 x 1.5 = 4,482, not an additive 70% modifier. Placement
  Mana is 103 -> 113 after native rounding.
- Urgent Totems I/II: placement 0.6 -> 0.333333/0.3 seconds, using division by
  1.8/2. Tier III retains 0.3-second placement and separately changes native
  action speed. These are not equal percentage reductions in seconds.
- Loyalty: Wolf Life 2,739 -> 1,917, retaining its basic hit and player Life.
  Additional generic Minion Life remains a separate modifier.
- Infernal Legion II: Arsonist Fire resistance 50 -> 70, capped at 75 with
  an additional supplied resistance source. Basic hit/Ignite output is not
  presented as a simulated Life-based secondary Ignite or explosion.
- Heightened Curse: effect 1 -> 1.25, or 1.45 with another 20% increased
  Curse Magnitudes, not 1.25 x 1.2. Despair Mana 178 -> 249. Blasphemy
  reservation 60 -> 84 with the supported Enfeeble recipient.
- Essence Harvest: Arsonist reservation 39 -> 43. No deaths are supplied;
  displayed damage-taken Mana Recoup and regeneration are not raised by an
  invented on-death recovery loop.
- Font supports leave captured player regeneration unchanged. Their current
  source is 12% leech from Totem Physical damage; event/range/leech propagation
  is incomplete in the native display and not assumed.
- Bidding does not change the selected basic Arsonist attack. Source command
  modifiers do not become a generic damage multiplier. Native default Muster
  count is not evidence of a sustained multi-type army.

Conditional sacrifices, revival/death loops, triggered child DPS, Font leech
delivery, Splinter attackers and several source-specific resistance/event
outputs remain incomplete. They are contextual rules, not claimed Full DPS
or actual defence/sustain calculations.

Moving references: [Intelligence supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_int.lua),
[Strength supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_str.lua),
[Dexterity supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/Skills/sup_dex.lua).
Frozen local fixtures are the regression evidence, distinct from moving branch lines.

## Coverage and Verification

Supports: 207 -> **252/567 raw entries**. Positive-tier: 205 -> **250/450
(55.6%)**, leaving **200**. Families: 120 -> 151. Reviewed pairings:
2,736 -> **3,038**. Skills remain 239 total and 234/234 positive-tier.
Preference categories remain 201.

Passive wording remains **927/2,182 distinct lines** and **3,600/5,451
occurrences (66.0%)**. Compared the prior baseline and pre-batch report:
zero lost contexts, wording or previously reviewed support scopes; graph and
catalog fingerprints unchanged. The baseline was not regenerated.

Full `validate:release` passed: **4,833 tests in 194 files**, TypeScript,
production build, graph validation and coverage-baseline check. Focused tests
also passed: 570 across the new/general/Minion/Mark/DOM suites and 166 across
existing recipient/proxy suites. Historical capture counts remain pinned;
the new independent suite checks all new positive and out-of-cohort scopes.
The existing large-chunk build warning remains non-blocking.

Edge smoke selected all 45 variants, checked explicit Apply, family replacement,
conditional warnings and wrong-owner/component exclusions, then optimized,
applied, saved and reloaded a real app route. Zero page errors, console errors
or failed responses during that workflow. Inspected 1440x1000 and 1100x800
captures show a visible tree and scrollable controls without horizontal
overflow or incoherent overlap. Served HTML and bundle SHA-256 match `dist`.

Ignored evidence: `var/proxy-debuff-support-45-20261110` and
`output/playwright/proxy-debuff-support-45-20261110`.

Next proposed batch: [50 elemental and ailment support variants](support-batch-elemental-50-proposal.md).

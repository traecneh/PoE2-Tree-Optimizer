# Resource, Recovery and Defensive Utility Support Batch

Implemented the approved 50-variant roster locally. No commit, push or deployment.
The Shortest solver, required goals, point costs/caps, extra-point budgets,
optimizer search algorithms and manual W1/W2 allocation are unchanged.

## Reviewed Scope

Adds **1,366 explicit reviewed skill/support pairings**. Static cohorts separate
player hits, spells, persistent buffs, corpse use, charge generation/consumption,
perfect timing, Remnants, channeling, shields, Warcries and hit-count objects.
Native parent eligibility alone is not approval for a player, Minion or child
recipient. Every reviewed cohort is checked against all 239 skill focuses.

Evidence uses isolated **PoB 0.23.1 / tree 0.5.5f**, level-20 quality-zero skills,
level-one supports and a level-90 Witch with supplied basic weapons and
attributes/Spirit. No personal builds or settings were loaded. The frozen
catalog is not a guarantee of current in-game obtainability or full simulation.

Selecting/removing supports preserves manual weights. Fourteen variants offer
optional priorities through explicit Apply: Ambrosia I/II, Cannibalism I/II,
Herbalism I/II, Precision I/II, Selfless Remnants, Steadfast I/II, Vanguard I/II
and Strong Hearted. Apply adds only the listed priorities, preserving unrelated
weights, goals, allocation and budgets. No conditional magnitude, trigger count,
resource transaction or support multiplier becomes numeric DPS in route scores.

## Mechanical Boundaries

- Ambrosia consumes actual Mana Flask charges: I drains 14% of maximum charges
  for 2% gained Lightning per charge consumed; II drains 35% for 1% per charge.
  Capacity, charges available and replenishment are not assumed. Brutality
  prevents linked gained damage, not drain; Embitter redirects eligible gain
  without removing the drain or overriding prohibitions.
- Cannibalism recovers 2%/3% maximum Life per eligible player kill and adds
  15/30 flat Spirit. Herbalism grants 30%/50% increased Life Flask recovery with
  the same flat reservations. Neither is guaranteed recovery per second.
  Gorge grants ten Life and ten Mana Flask charges per actual consumed corpse,
  not Charm charges or assured corpse supply.
- Lifetap converts the supported Mana cost into Life. Extraction's separate
  10% Life sacrifice and Mana Flare's current-Mana consumption are not costs
  converted by Lifetap. Extraction grants 35% gained Chaos; Brutality/Embitter
  interactions do not cancel sacrifice. Native LifeCost is not a complete
  sacrifice transaction.
- Mana Flare needs a parent critical hit and has a separate Fire child,
  current-Mana consumption and one-second child cooldown. Controlled Destruction
  prevents its trigger. Native child checks show Brutality disables its Fire
  damage, but do not establish trigger frequency, available Mana or sustain.
- Practical Magic gives 30%/40% increased Spell Damage for eight seconds after
  this skill's own Heavy Stun. Mysticism's 30%/40% Spell Damage requires player
  Full Energy Shield. Precision supplies 30%/50% increased player Accuracy,
  not flat hit chance or Minion Accuracy. Mysticism and Precision retain their
  extra Spirit reservation and require actual buff activation.
- Inhibitor counts different charge/Infusion types, not charge quantity, and
  prohibits consumption. Native acceptance of Heightened Charges, Perpetual
  Charge or Abiding Hex links does not bypass that prohibition or supply an
  event. Generation can still occur when separately eligible. Native Infusion
  damage coverage is incomplete, not evidence of a free or absent effect.
- Charge Profusion's 30% extra-charge event is separate from II's 15% random
  extra-type event and actual capacity. Heightened Charges' doubling chance,
  Perpetual Charge's retention chance and Perfected Endurance's own perfect-hit
  reward do not guarantee resources, repeated benefits or sustainable use.
- Harmonic Remnants changes collection range and II's extra-Remnant chance.
  Remnant Potency changes effect, with II/III delaying rewards four/three seconds
  after collection. Selfless Remnants delivers eligible rewards to allies in
  Presence instead of the player; it excludes Grim Feast. No personal recovery
  or ally is inferred from the shared Remnant tag.
- Catharsis needs 20 Volatility, not a supplied generator. Hit and Run and Combo
  Finisher conflict with its use condition: native checks retain only one link.
  Excise's cooldown is a separate gate, not that same incompatibility.
- Upwelling's conditional Minion damage uses the player's missing Mana, not
  missing Minion Mana or player damage. It adds 15/30 flat Spirit. Steadfast
  protects the channeling player; generic Ailment Threshold is not copied into
  every specific threshold preference. Native threshold outputs are incomplete.
- Stoicism ramps over time up to its cap and resets on Dodge/Travel; reviewed
  Travel focuses warn against assuming permanent capped damage. Defy's Lucky
  Attack hits need Surrounded. II's insufficient-Mana exception is not a blanket
  free-cost rule or an exemption from Lifetap's Life cost.
- Vanguard's normal Stun and additional Heavy-Stun Guard rewards use player
  Strength and four-second Guard timing. It does not grant Stun events or
  permanent Guard; Pin prevents this skill's own Stun rewards. Generic Attribute
  priorities are not substituted for Strength because that would also score
  Dexterity and Intelligence. Thornskin instead affects player Thorns, not
  ordinary Attack damage or an assumed retaliation event.
- Strong Hearted reduces incoming Shock duration, not its magnitude or outgoing
  Shock. Tireless' skip-consumption chance needs an actual empowerment event.
  Durability adds two object hits with its source reservation multiplier, not
  flat Spirit, object Life, guaranteed extra damage or a Mana-cost multiplier.
- Behead steals one/two Rare modifiers for 20 seconds, not double damage or a
  guaranteed useful buff. Thrill of the Kill requires a real Cull of a Shocked
  enemy and benefits player Attacks, not automatically its triggering Spell.
  II's 40% increased Shock chance is not flat chance; Cull support does not
  supply Shock or waive hit/rarity/threshold requirements.
- Commiserate uses a matching ailment currently on the player and removes it on
  eligible infliction. Selected application prohibitions still win. Frozen
  Spite needs an eligible Attack kill of a Frozen enemy, possibly externally
  Frozen; separate Ice Fragments use slain-enemy Life. Native child support
  inheritance is incomplete, so parent flags and zero unconfigured child damage
  are not treated as a complete live damage model.

## Verification

- Independent frozen fixtures pin all 50 identities, families and
  positive/negative cohorts, plus **99 native observations**. Ordinary costs,
  recovery rounding, Accuracy, reservations, trigger gates and child effects
  have separate controls; native gaps are retained as limitations.
- Final release: **5,513 tests across 200 files**, TypeScript, production build,
  graph validation and coverage baseline passed. New batch tests include
  save/JSON transfer, manual-weight preservation, optional Apply, family
  replacement, ownership, prohibitions and weighted/Shortest routing checks.
- Baseline and pre-batch comparisons found no lost wording or old pairings;
  graph/catalog fingerprints and the baseline file are unchanged.
- Edge production-preview smoke selected all 50 variants, checked tier
  replacement, resource ownership, interaction cautions, explicit Apply,
  actual goal/worker preview/apply, saved-build reload and right-pane scrolling.
  Screenshots at 1440x1000 and 1100x800 were inspected. No runtime, console or
  HTTP errors occurred during the reloaded smoke. The initial launch had only
  a favicon 404 outside that smoke.
- Served HTML and JavaScript SHA-256 match the final local production build.
  The existing Vite large-chunk warning remains non-fatal. These are not an
  exhaustive interaction audit, Firefox matrix or Full DPS verification.

Evidence: `var/resource-support-50-20261111/` and
`output/playwright/resource-support-50-20261111/`.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

## Coverage and Next Batch

Positive-tier support configuration is **400/450 (88.9%)**, with **50 remaining**.
All catalog entries total 402 configured, including two tier-zero reviews.
There are **6,737 reviewed pairs** and 250 support families. The 239 skill
focuses, all 234 positive-tier skill entries and 201 preference categories are
preserved. Passive matching remains 927/2,182 distinct lines and 3,600/5,451
main-tree occurrences. In-app Full DPS coverage remains zero.

Next proposal: `support-batch-final-50-proposal.md`, the final 50 specialist and
conditional variants. The exact roster was checked against this post-batch
report. Completing that separate batch would leave zero unconfigured
positive-tier catalog variants, not zero unmodeled interactions or a complete
combat simulator. It is not implemented or deployed.

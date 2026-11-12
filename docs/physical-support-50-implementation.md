# Physical, Weapon and Positional Support Batch

Implemented the approved 50-variant roster locally. No commit, push or deployment.
The Shortest solver, required goals, point costs/caps, extra-point budgets,
optimizer search algorithms and manual W1/W2 allocation are unchanged.

## Reviewed Scope

The batch adds **1,595 explicit reviewed skill/support pairings**. Broad native
parent eligibility is not automatic approval: offered cohorts target reviewed
player hits, Final Strikes, Slams, Fissures, leaping/travel components, Persistent
Buffs, Bow shots and Bow/Spear projectiles. Minion/proxy recipients are not
silently admitted from shared tags or native parent predicates.

Evidence uses isolated **PoB 0.23.1 / tree 0.5.5f**, level-20 quality-zero skills,
level-one supports and a level-90 Witch with basic weapons and supplied
attributes/Spirit. No personal builds or settings were loaded. This frozen
review is not a promise of current in-game obtainability or every live mechanic.

Selecting/removing supports preserves manual weights. Seven variants offer
optional priorities through explicit Apply: Excise, Rending Apex, Knockback,
Overreach, Enduring Impact I/II and Opening Move. Apply changes only the listed
preferences; unrelated weights, goals, allocations and budgets remain. No
support magnitude, trigger count or conditional uptime becomes a numeric DPS
multiplier in route scores.

## Mechanical Boundaries

- Barbs I/II empower the next four/six enemies hit after real Thorns retaliation.
  III instead deals Thorns twice to the next one enemy, not six hits or double
  full Attack damage. Quill Burst has a separate area child and three eligible
  post-retaliation hits. Neither grants Thorns, retaliation or contact uptime.
- Bleed IV grants Incision and conditional Melee Physical damage, not Poison or
  Projectile damage; it prohibits its own Bleeding. It shares the Bleed family
  and replaces earlier tiers, including for reviewed Poison-bow arrow components.
- Haemocrystals also prohibits own Bleeding and consumes external Bleeding:
  four crystals, plus two for Aggravated Bleeding, maximum 20. Blood Hunt's
  existing consumption excludes it. Crystal limits are not explosion counts.
- Incision's one-stack application and 3%-per-consumed-Incision Bleeding
  magnitude (30% cap) do not supply a Bleeding event or full stacks. Explicit
  prohibitions win. Malady's swapped on-hit Poison chance remains separate and
  its warning is preserved rather than overwritten or treated as restored Bleeding.
- Impale's 100% chance does not supply eligible Physical damage or extraction.
  The supported skill cannot Extract. Native legacy Impale output is incomplete;
  zero displayed chance is not proof the support has no in-game effect.
- Bone Shrapnel needs supported-skill kills of externally Pinned enemies and
  prohibits own Pin. A linked Pin support still prohibits Stun; disabling Pin
  buildup does not restore Heavy Stun. Enduring Impact requires this skill to
  cause Heavy Stun, not merely hit an externally Stunned enemy. Non-Unique
  30%-for-one rewards remain distinct from guaranteed one/three on a Unique event.
- Rip's Remnant is created within 1.5 metres, persists eight seconds and grants
  a five-second 10% increased regeneration-rate buff when collected, capped at
  100%. It is not flat regeneration or automatic sustain. Tear's 50% repeat chance
  applies to eligible kill rewards, not double damage or double kills.
- Excise adds an eight-second cooldown and 40% more Critical Hit Chance, not
  +40 chance points or free sustained DPS. Native cooldown display is tick-rounded.
  Controlled Destruction removes the crit benefit, not the cooldown; only the
  cooldown-recovery priority remains. Native-cooldown skills are excluded.
- Rending Apex breaks Armour from 75% of the actual Final Strike's Attack damage,
  not only Physical damage, every combo hit or an extra damage multiplier. No
  completed combo, full break or charge event is assumed.
- Brambleslam creates delayed, separate brambles with a 20-bramble limit.
  Branching Fissures makes two reduced-area/reduced-damage branches, not extra
  full-strength hits. Entangle's attached-vine component is not a branched fissure.
  Crater creates separate landing fissures; with Crater, reviewed native PoB
  rejects Tectonic Slams in either link order. The UI retains selections with
  a warning instead of claiming both links apply.
- Tectonic Slams shares the Aftershock family and preserves source damage,
  area, Attack Speed and Mana penalties. Its native parent-speed coverage is
  incomplete, not evidence that the penalty is absent. Stomping Ground's
  footsteps and Volcanic Eruption's separate Fire hit are not extra parent damage.
  External Ignite can qualify Eruption, but linked Brutality still prohibits
  its Fire damage; this was checked on the actual child.
- Overreach shares the area-support family. Its 40% increased area does not
  cancel 80% less close-range Accuracy. The near/far native Accuracy controls
  verify the multiplicative penalty. Punch Through requires Knockback and
  benefits the next Projectile Attack hit, not automatically its Melee source.
- Rage generation, Rageforged's ten-Rage cost and its 30% skip-spend chance are
  separate. Below maximum, Rage III grants speed; maximum-Rage damage does not
  imply that same speed buff. Configured resource thresholds are not a resource
  transaction or a proved sustained use rate.
- Direstrike I/II add 20/40 flat Spirit for conditional player Low-Life Attack
  damage, not Spell/Minion damage or an attacking buff. Clash compares remaining
  Life percentages, not raw Life. Native unchecked Clash takes the lower-damage
  branch; equal-Life behavior and encounter uptime are not simulated.
- Retaliate uses the player's incoming Stun Bar, not permanent outgoing Stun.
  Frenzied Riposte consumes a real Parried debuff, and Opening Move needs a hit
  against enemy Full Life. Neither grants its own setup or guaranteed charges/Daze.
- Hit and Run's 40% more Skill Speed does not simulate ten metres of movement
  before each use. Added cooldowns/use conditions warn, including Excise,
  Nova II and Combo Finisher. Nova I has no added cooldown and remains compatible.
- Retreat/Pursuit keep eight-second I/II and two-second III windows distinct.
  Melee events and Projectile Attack events are not interchangeable with spells.
  Each prohibits its opposite damage component; combined, the native mixed-hit
  control deals zero. Retreat filters only the Melee Damage passive scope;
  generic Attack modifiers and manual weights are not erased indiscriminately.
- Charged Shots I refunds Mana on the third shot; II lacks that refund and has a
  larger cost. Native averaged gain is not simulated shot cadence or sustain.
  Embitter redirects only gained damage; Brutality still prohibits that Element.
- Deceleration I/II share ProjectileSpeed's family with Acceleration. They reduce
  delivery speed, not action speed or guaranteed contacts. Gambleshot randomness
  and collision priority do not guarantee repeated Poison, Forks or Chains.
  Spectral Volley's five-projectile cap, linger, delay and initial damage penalty
  do not prove extra hits or full queue uptime; native parent damage is incomplete.

## Verification

- Frozen independent fixtures pin all 50 definitions and positive/negative
  reviewed scopes across all 239 focuses, plus **97 native observations**.
- Final release: **5,288 tests across 198 files**, TypeScript, production build,
  graph validation and coverage baseline passed.
- Baseline and pre-batch comparisons found no lost coverage or old support
  pairings; graph/catalog fingerprints and the baseline file are unchanged.
- Edge production-preview smoke selected all 50 variants, checked family
  replacement, prohibitions, explicit Apply, actual goal/worker preview/apply,
  saved-build reload and right-pane scrolling at 1440x1000 and 1100x800.
  No runtime, console or request errors during the reloaded smoke. Initial
  launch had only a favicon 404 outside that smoke.
- Served HTML and JavaScript SHA-256 match the final local production build.
  The existing Vite large-chunk warning remains non-fatal. These checks are not
  a Firefox matrix, exhaustive interaction audit or Full DPS simulation.

Evidence: `var/physical-support-50-20261111/` and
`output/playwright/physical-support-50-20261111/`.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

## Coverage and Next Batch

Positive-tier support configuration is **350/450 (77.8%)**, with **100 remaining**.
All catalog entries total 352 configured, including two tier-zero reviews.
Reviewed pairs total **5,371**. The 239 skill focuses, all 234 positive-tier skill
entries and 201 preference categories are preserved. Passive matching remains
927/2,182 distinct lines and 3,600/5,451 main-tree occurrences. In-app Full DPS
coverage remains zero.

Next proposal: `support-batch-resource-50-proposal.md`. These 50 exact names were
checked positive-tier and unconfigured after this batch; implementing that
separate proposal would leave **50**. It is not implemented or deployed.

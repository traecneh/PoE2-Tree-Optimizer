# Final 50 Specialist and Conditional Supports

Implemented the approved final 50-variant roster locally. No commit, push or
deployment. Shortest, required goals, point costs/caps, extra-point budgets,
optimizer search algorithms and manual W1/W2 branches are unchanged.

## Scope and Evidence

Adds **565 explicit reviewed skill/support pairings**. The 50 variants now have
conservative component-specific cohorts, source references, family replacement,
cost/recipient explanations and interaction cautions. This does not approve
every native-legal parent, every Minion/triggered child or every possible
combination. Held links remain held rather than being admitted from tags alone.

Evidence is frozen **PoB 0.23.1 / tree 0.5.5f**, isolated from personal builds
and settings. Native controls use level-20 quality-zero skills, level-one
supports and a level-90 Witch with supplied basic weapons, attributes and
resources. Source definitions, translated wording, **12 child definitions**
and **120 native observations** are retained with drivers and logs.

Selecting/removing supports preserves manual priorities. Seven variants offer
explicit Apply suggestions: Hourglass, Execrate and Expanse (cooldown recovery),
Derange (ES pool), Zenith II (Mana Cost Efficiency), Crackling Barrier (maximum
Mana) and Deadly Resolve (Armour). These are optional heuristic preferences,
not automatic numeric damage or sustain multipliers. Explicit Apply may replace
the listed priority; unrelated priorities, goals, allocations and budgets stay.

## Important Boundaries

- Astral Projection requires a Nova and applies 25% less area, not radius or
  damage. Spell Cascade adds one cascade per side along a random axis, with
  separate area/damage tradeoffs; three placements are not three same-target
  hits or stacked DoT. Native maps do not verify geometry or a second global
  area penalty.
- Empowered Sparks needs actual **Power** Charge generation and empowers three
  Attacks. Frenzy/Endurance generation alone does not qualify. The granted
  Spark is not the ordinary Spark focus, parent Spell or weapon hit. Generation,
  empowerment, Infusion, contacts and consumption remain separate events.
- Living Lightning creates Minions with chaining Attacks, not extra parent-hit
  damage. I/II's capacities are five/eight, with three attacks and a 30-second
  maximum lifetime. II's player Strength/Dexterity scaling belongs to the
  child. Capacity is not occupancy. Brutality can block the triggering parent's
  Lightning damage; inability to Shock alone does not block Lightning damage.
- Skittering Stone needs five nearby deaths within four metres and destroys
  eligible stone objects. I/II hatch one/two, capped at eight/twelve with
  ten/twenty-second lifetimes. Missing native Minion damage/actor output is
  a modeling gap, not no in-game effect or permanently full populations.
- Unleash's two Seals can repeat at 50% less damage and cost 50% more Mana.
  Expand instead has three Seals for increased area, not repeats, with a
  20% higher Mana cost. Waiting and actual broken Seals are not assumed.
  Added cooldowns can invalidate both, Spell Echo or Hit and Run. The UI retains
  conflicting selections with a warning, not a claim all links apply.
- All declared families participate in replacement: Expand has Seal and
  IncreasedAreaOfEffect; Alignment III has Alignment and AdditionalProjectiles.
  Hourglass/Execrate/Expanse share GrantsCooldown with Excise. Wildshards shares
  AdditionalProjectiles; Nova I's distinct family is not conflated with Nova II.
- Wildshards I/II have a 20%/25% chance for eight circular projectiles, not
  guaranteed hits, overlaps or extra Poison stacks. Only I adds a 20% Mana
  multiplier. Alignment I/II's directional damage is different from III's
  conditional four additional projectiles; aiming time, angle and uptime matter.
- Icicle halves crystal Life, not player/minion Life or explosion damage.
  Fortress changes Wall geometry/length and hit damage; II also reduces area.
  Hit-only wording and the broader native damage map differ, particularly for
  Flame Wall. Native output is not proof of live DoT penalties or wall geometry.
- Accelerated Growth needs Overgrowth and triggers a delayed, separate Physical
  Spell; II's Blind is on the child's actual hit. **Poison Spores instead needs
  Plant hits**, not Overgrowth. Its placement set is non-damaging and the delayed
  attack explosion has its own Poison chance/storage scaling. Toxic Domain is
  held for recipient verification; no maximum storage or instant detonation.
- Caltrops is a separate end-of-flight hazard, not extra Spear hits. Encroaching
  Ground grows existing ground area over time, bounded by lifetime and its cap,
  not damage rate or automatic maximum coverage.
- Execrate's 100% more ailment chance is not +100 chance points, a base source
  or a way around prohibitions. Intense Agony needs enemy Full Life for its
  non-ailment DoT bonus and shortens duration. Swift Affliction III shortens
  skill/damaging-ailment duration, but its damage bonus is conditional non-ailment
  DoT at the one-second threshold, not Poison/Bleeding DPS. Native threshold
  handling includes exactly one second despite stricter wording in one string.
- Acrimony reduces enemy regeneration under a non-ailment DoT, not player
  regeneration or DoT damage; only the strongest instance applies. Herald of
  Ash is not admitted here merely because its Ignite is damage over time.
- Brink improves buildup but prevents its own Heavy Stun. External Heavy Stun
  does not supply its own Practical Magic, Enduring Impact, Syzygy Intimidate
  or Heavy-Stun Guard event. Enduring Impact's optional priority is suppressed;
  manual priorities remain. Ordinary-Stun behavior is not inferred from
  inconsistent wording, and Vanguard's separate ordinary-Stun reward is not
  erased without evidence.
- Delayed Gratification makes requirements 150% harder for one extra permitted
  use within ten seconds, not automatic resources or repeated damage. Cadence
  gains speed from uses but can lock the skill for ten seconds after six uses
  within four seconds; maximum usable speed and net DPS are not assumed.
- Derange adds a real ES cost equal to Intelligence. Lifetap converts ordinary
  Mana cost to Life, not that ES obligation. The non-ailment DoT wording is
  narrower than a raw native Dot map; Poison/Ignite/Bleeding do not gain approval
  from native output. Generic Attributes is not substituted for Intelligence.
- Fluke concerns actual socketed triggered children, not damage of the trigger
  parent, guaranteed average refunds, Energy or sustain. Perfection can reset
  on failed timing elsewhere; Window of Opportunity narrows the timing window
  and II's timed Deflection is not permanent Evasion or mitigation.
- Syzygy needs Ignite **and** Fully Broken Armour; Intimidate additionally needs
  its own Heavy Stun. Volatility needs an eligible critical hit; Controlled
  Destruction blocks generation. Catharsis needs resources before the first use,
  so selecting a generator/spender does not make a self-starting loop.
- Zenith needs player Mana strictly above 90%, not Minion Mana or guaranteed
  recovery. II's efficiency divides applicable cost rather than subtracting 25%.
  Lifetap removes the ordinary Mana cost, so that optional efficiency suggestion
  is suppressed while existing manual choices are retained.
- Battershout consumes external Fully Broken Armour for a separate Physical
  explosion and cannot itself Break Armour. Overbroken Armour is excluded from
  its broken-Armour source. Crackling Barrier grants Lightning Thorns while
  channeling; retaliation is not any incoming Hit. Deadly Resolve instead
  consumes real stages after being Hit for a separate non-weapon Attack.
- Holy Descent needs landing. Shocking Leap instead needs the first critical
  hit, at most once per use; the ground is not an automatic landing reward or
  hit-based Shock chance. Deadly Herald reserves 20 additional flat Spirit;
  non-damaging Herald of Plague is held. Physical Mastery changes an eligible
  skill's level, not all supports or a flat damage multiplier. Advancing Storm's
  geometry and Rising Tempest's supplied rotation do not guarantee contacts
  or permanent maximum bonuses.

## Verification

- Independent frozen fixtures pin identities, every family, positive/negative
  cohorts across all 239 focuses, native links, child definitions and controls.
- **5,734 tests across 202 files** cover the app and new batch; TypeScript,
  production build, graph validation and coverage baseline passed.
- Saved JSON roundtrips cover every new variant, manual weights, goals, budgets,
  allocations and W1/W2. A weighted routing fixture stays within budget while
  the same request in Shortest stays unchanged.
- Historical tests now use genuinely unknown support IDs where Swift III was
  formerly an unknown sentinel. Old source captures and existing reviewed
  pairings are preserved, not regenerated to hide coverage losses.
- Edge production-preview smoke selected all 50, verified family replacement,
  cooldown/critical/resource warnings, explicit Apply, actual goal/worker route
  preview/apply, save/reload and right-pane scrolling. Desktop and smaller-window
  screenshots were inspected. No runtime, console or HTTP errors occurred during
  the reloaded smoke; initial launch had only a favicon 404 outside that smoke.
- Served HTML/JavaScript hashes match the local production build. The existing
  Vite large-chunk warning remains non-fatal. This is not an exhaustive
  interaction audit, live-mechanics guarantee, Firefox matrix or Full DPS proof.

Evidence: `var/final-support-50-20261111/` and
`output/playwright/final-support-50-20261111/`.
Local preview: `http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

## Coverage and Next Step

The frozen positive-tier support catalog is **450/450 (100%)**, with **zero
unconfigured positive-tier variants remaining**. All entries total 452 configured
(two tier-zero reviews), **282 families** and **7,302 reviewed pairs**. There are
still 115 unconfigured tier-zero catalog entries, not verified live obtainable
supports. Skill coverage remains 239 focuses / all 234 positive-tier entries,
with 201 preference categories. Passive recognition remains 927/2,182 unique
lines and 3,600/5,451 main-tree occurrences; in-app Full DPS coverage remains zero.

Next recommendation: make the support picker searchable with a selected-only
view, keeping the expanded catalog usable without a long scroll. This is a
separate usability change, not another research audit or automatic deployment.

# Elemental and Ailment Support Batch

Implemented the approved 50-variant roster locally. No commit, push or
deployment. Shortest routing, required goals, point costs/caps, extra-point
budgets, optimizer algorithms and manual W1/W2 allocation are unchanged.

## Scope

The batch adds **738 explicit reviewed skill/support pairings** across player
attack hits, spell hits, non-ailment DoT, Runic Inscriptions, Ice Crystals,
Persistent Buffs and Banners. Native parent compatibility was exported against
all 239 focuses. Actual components and recipients, rather than tags alone,
determine the narrower offered controls.

Source identities, families, stats, English stat wording and native results
come from an isolated **PoB 0.23.1 / tree 0.5.5f** runtime. Its frozen source is
the reviewed snapshot, not a claim that a moving upstream branch or every
in-game interaction is identical. No personal builds/settings were loaded.

## Behavior

Selecting/removing supports never changes manual weights. Seventeen variants
can supply optional priorities in at least one reviewed focus, using the
existing explicit Apply command. Applying a displayed change can update that
one preference's weight; unrelated preferences, goals, allocations and budgets
survive. Conditional gains, triggers, resource counters and gem magnitudes
never become automatic numeric route-score or Full DPS multipliers.

- Immolate needs an already Ignited target and prevents its own Ignite.
  Ignite supports cannot bypass that restriction. External conditions and
  this skill's own application events remain separate.
- Eternal Flame I/II extend actual Ignite duration. I's 25% less Flammability
  Magnitude is not a flat chance reduction. III instead offers a 20% critical
  refresh chance; it does not inherit the earlier duration bonus. Native
  additive duration and eligible Mana-cost rounding were independently checked.
- Fan The Flames requires a Wind hit against an Ignited target. Wildfire and
  Fiery Death require the supported skill's own Ignite event; spread and
  on-death children do not become extra primary hits or guaranteed boss damage.
- Burning Inscription belongs to reviewed Runic Inscription expiry components,
  not generic Fire spells. Its separate ground source and Max Mana dependency
  do not become player hit or guaranteed Ignite-DPS scaling.
- Ice Bite requires this skill to Freeze before granting a timed gain buff.
  The frozen stat map does not restrict that buff to Attacks. Biting Frost
  consumes external Freeze and prevents its own buildup; II's subsequent Chill
  is separate. Configured Frozen/Boss multipliers do not simulate consumption
  timing or permanent uptime.
- Frost Nexus, Creeping Chill, Crystalline Shards, Glacier and Verglas retain
  ground, Power Charge, Crystal, explosion, Impale and supplied-Life requirements.
  Glacier doubles Crystal Life, not player, Minion or Totem Life.
- Embitter redirects gained damage to Cold; it does not convert base damage or
  supply a gain source. Fire/Lightning Attunement suggestions redirect to Cold
  while their cross-element penalties remain. Brutality still forbids the
  linked actor's Elemental damage in either selection order.
- Cool Headed and Warm Blooded reduce incoming Ignite/Freeze duration and add
  15 flat Spirit. They do not improve outgoing duration or grant immunity.
  Applying both optional incoming-protection suggestions does not duplicate
  the same preference.
- Electrocute prevents Shock; Neural Overload is a Primed finisher, not an
  initial buildup source. They share the native Electrocute family and replace
  each other. Lasting Shock's duration and reduced application chance are
  distinct from Overcharge's effect and reflected-Shock risk.
- Innervate's supported-skill kill of a Shocked target can use an external
  Shock; this is not the same as requiring its own Shock event. Conduction,
  Coursing Current, Static Shocks, Electromagnetism and Stormfire keep their
  own-event, Drenched, pack-size, consumption and child-source conditions.
  Volt supplies no assumed movement, stored charges or free extra contacts.
- Frostfire consumes external Freeze but needs its own Ignite. Elemental
  Discharge prohibits only Ignite/Freeze/Shock, not Chill or Electrocute.
  Discharge and Catalysing Elements share a family. Conflicting Discharge/
  Frostfire or Biting Frost consumers warn that reviewed PoB accepts only the
  first applicable link; no combined bonus or valid combined loadout is assumed.
- Elemental Armament I/II target reviewed Elemental Attack components. III
  instead grants conditional Attack damage while prohibiting all Elemental
  Ailments. Its Physical-hit benefit can still exist with Brutality if a
  separate source supplies target ailments; neither count nor uptime is assumed.
- Potent Exposure does not grant Exposure. Optional effect priority requires a
  reviewed native source (Frost Bomb) or an eligible selected Exposure support.
  Ignite/Shock/critical-hit prohibitions still suppress those event-dependent
  sources; Frost Bomb's independent application remains distinct.
- Blazing Critical's recipient is the player's Attacks, not automatically its
  triggering Spell. Controlled Destruction prevents its trigger, Eternal III's
  critical refresh and Concussive Spells' critical Daze. A Physical critical
  hit may still trigger a global buff for a different eligible Attack.
- Chaotic Freeze requires a non-ailment Chaos DoT debuff and separate Chaos
  hits; DoT ticks and Poison do not become Freeze hits. Drain Ailments does not
  provide its consumed ailment or turn its conditional bonus into Poison DPS.
- Refraction I/II provide Banner Plating from recipient Armour/Evasion.
  III replaces that with Armour-based enemy Exposure capped at 80%, not both
  earlier defensive effects too. All three add 10 flat Spirit. No simulated
  mitigation, Armour supply or cap saturation is inferred from source wording.
- Burgeon I/II ramp with real channel time to the same 40% source cap.
  Tier II reaches it sooner rather than stacking with I or raising the cap.
  No maximum-power starting state or uninterrupted channel uptime is assumed.

## Verification

- Frozen fixtures: 50 source definitions, 90 native observations, translated
  wording and independent reviewed positive/negative scopes for all 239 focuses.
- Focused checks: 734 tests; final release: **5,059 tests in 196 files**,
  TypeScript, production build, graph validation and coverage baseline passed.
- No old support scopes or baseline coverage lost. Graph/catalog fingerprints
  unchanged; the baseline file was not regenerated.
- Edge production-preview smoke: all 50 choices, explicit Apply, source-family
  replacement, conditional warnings, actual goal/worker preview/apply, saved
  build reload, scrollable right pane and 1440x1000 / 1100x800 screenshots.
  No runtime, console or failed-request errors in the smoke. The initial
  browser launch's favicon-only 404 was outside the reloaded smoke.
- Served HTML and JavaScript SHA-256 match the final local production build.
- The existing Vite large-chunk warning remains non-fatal. Not a Firefox
  matrix, gameplay verification, exhaustive combination audit or Full DPS proof.

Evidence: `var/elemental-support-50-20261110/` and
`output/playwright/elemental-support-50-20261110/`. Local preview:
`http://127.0.0.1:5180/PoE2-Tree-Optimizer/`.

## Coverage and Next Batch

- Positive-tier supports: **300/450 (66.7%)**, **150 remain**.
- All catalog entries: 302/567 configured, including two tier-zero entries.
- Skill focuses: 239 configured; all 234 positive-tier entries remain covered.
- Reviewed pairs: 3,776 across 188 configured support families.
- Passive matching remains 201 categories, 927/2,182 distinct lines and
  3,600/5,451 main-tree occurrences (66.0%).
- In-app Full DPS coverage remains zero; context/configuration coverage is not
  a claim of fully simulated damage or overall project completion.

Next proposal: `support-batch-physical-50-proposal.md`. All 50 exact names were
verified positive-tier and unconfigured in the post-batch report. Completing
that separate proposed batch would leave **100**; it has not been implemented.
